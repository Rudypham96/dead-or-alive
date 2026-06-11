// Betting engine: place bets, move the line, resolve markets, pay out.
//
// Pricing: a bet buys shares at the current implied probability (DEAD price =
// market.death, ALIVE price = market.survives). Each winning share is worth $1
// at resolution. We take a 2% fee on GROSS WINNINGS only (Polymarket model) —
// losers pay nothing. After each trade we nudge the line toward the bought side,
// scaled by stake vs the market's virtual liquidity, so big bets move the odds
// (this is a transparent price-impact model, not a full AMM — see README).

import { db, marketRowToApi } from "./db.js";

export const FEE_RATE = 0.02;
const IMPACT_SENSITIVITY = 0.6;
const now = () => Date.now();

const round2 = (n) => Math.round(n * 100) / 100;

export function getMarket(id) {
  return db.prepare("SELECT * FROM markets WHERE id = ?").get(id);
}

function applyPriceImpact(market, side, stake) {
  const frac = stake / (stake + market.liquidity); // 0..1
  let death = market.death;
  if (side === "DEAD") death = death + frac * (1 - death) * IMPACT_SENSITIVITY;
  else death = death - frac * death * IMPACT_SENSITIVITY;
  return Math.max(0.02, Math.min(0.98, death));
}

// Place a bet. Throws on validation failure. Returns { bet, market, balance }.
export function placeBet(user, marketId, side, stakeRaw, paper = false) {
  side = String(side || "").toUpperCase();
  if (side !== "DEAD" && side !== "ALIVE") throw new Error("side must be DEAD or ALIVE");
  const stake = Number(stakeRaw);
  if (!Number.isFinite(stake) || stake <= 0) throw new Error("stake must be a positive number");

  const market = getMarket(marketId);
  if (!market) throw new Error("market not found");
  if (market.status !== "open") throw new Error("market is resolved — betting closed");

  const price = side === "DEAD" ? market.death : market.survives;
  if (price <= 0.01) throw new Error("price too extreme to trade");
  const shares = stake / price;

  const tx = db.transaction(() => {
    let balance = user.balance;
    if (!paper) {
      if (user.balance < stake) throw new Error("insufficient balance");
      balance = round2(user.balance - stake);
      db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(balance, user.id);
    }

    const info = db
      .prepare(
        `INSERT INTO bets (user_id, market_id, side, stake, price, shares, status, paper, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`
      )
      .run(user.id, marketId, side, stake, price, shares, paper ? 1 : 0, now());

    // move the line + extend the series + bump market stats
    const newDeath = applyPriceImpact(market, side, stake);
    const series = JSON.parse(market.series);
    series.push(newDeath);
    while (series.length > 60) series.shift();
    const change24h = newDeath - series[Math.max(0, series.length - 24)];
    db.prepare(
      `UPDATE markets SET death = ?, survives = ?, series = ?, change24h = ?,
         volume = volume + ?, traders = traders + 1 WHERE id = ?`
    ).run(newDeath, 1 - newDeath, JSON.stringify(series), change24h, stake, marketId);

    const bet = db.prepare("SELECT * FROM bets WHERE id = ?").get(info.lastInsertRowid);
    return { bet, balance };
  });

  const { bet, balance } = tx();
  return { bet: betToApi(bet, market.name), market: marketRowToApi(getMarket(marketId)), balance };
}

// Resolve a market. Pays winners (minus 2% fee), marks losers, settles linked
// challenges. Returns a settlement summary. Idempotent-guarded: refuses if already resolved.
export function resolveMarket(marketId, outcomeRaw) {
  const outcome = String(outcomeRaw || "").toUpperCase();
  if (outcome !== "DEAD" && outcome !== "ALIVE") throw new Error("outcome must be DEAD or ALIVE");
  const market = getMarket(marketId);
  if (!market) throw new Error("market not found");
  if (market.status === "resolved") throw new Error("market already resolved");

  const tx = db.transaction(() => {
    const openBets = db.prepare("SELECT * FROM bets WHERE market_id = ? AND status = 'open'").all(marketId);
    let winners = 0,
      losers = 0,
      totalGross = 0,
      totalFees = 0,
      totalNet = 0;

    for (const bet of openBets) {
      if (bet.side === outcome) {
        const gross = bet.shares * 1.0; // $1 per winning share
        const fee = round2(gross * FEE_RATE);
        const net = round2(gross - fee);
        db.prepare(
          "UPDATE bets SET status='won', gross_payout=?, fee=?, net_payout=?, resolved_at=? WHERE id=?"
        ).run(round2(gross), fee, net, now(), bet.id);
        if (!bet.paper) {
          db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(net, bet.user_id);
        }
        winners++;
        totalGross += gross;
        totalFees += fee;
        totalNet += net;
      } else {
        db.prepare("UPDATE bets SET status='lost', resolved_at=? WHERE id=?").run(now(), bet.id);
        losers++;
      }
    }

    db.prepare("UPDATE markets SET status='resolved', outcome=?, resolved_at=?, death=?, survives=? WHERE id=?")
      .run(outcome, now(), outcome === "DEAD" ? 1 : 0, outcome === "DEAD" ? 0 : 1, marketId);

    const challengesSettled = settleChallengesForMarket(marketId, outcome);

    return {
      market: market.name,
      outcome,
      winners,
      losers,
      challengesSettled,
      totalGrossPayout: round2(totalGross),
      totalFeesCollected: round2(totalFees),
      totalNetPaid: round2(totalNet),
    };
  });

  return tx();
}

// Settle every active/open challenge on a market. Winner takes the pot (2 * stake)
// minus 2% fee. A PUSH refunds both. Open (unaccepted) challenges refund the challenger.
function settleChallengesForMarket(marketId, outcome) {
  const rows = db
    .prepare("SELECT * FROM challenges WHERE market_id = ? AND status IN ('open','active')")
    .all(marketId);
  let settled = 0;
  for (const c of rows) {
    if (c.status === "open" || !c.opponent_id) {
      // never matched → refund challenger's escrow
      db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(c.stake, c.challenger_id);
      db.prepare("UPDATE challenges SET status='cancelled', resolved_at=? WHERE id=?").run(now(), c.id);
      continue;
    }
    const challengerWon = c.challenger_side === outcome;
    const winnerId = challengerWon ? c.challenger_id : c.opponent_id;
    const pot = c.stake * 2;
    const fee = round2(pot * FEE_RATE);
    const net = round2(pot - fee);
    db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(net, winnerId);
    db.prepare("UPDATE challenges SET status='resolved', outcome=?, resolved_at=? WHERE id=?")
      .run(String(winnerId), now(), c.id);
    settled++;
  }
  return settled;
}

// ---- Challenge creation / acceptance (stake escrowed from balance) ----
export function createChallenge(user, marketId, side, stakeRaw) {
  side = String(side || "").toUpperCase();
  if (side !== "DEAD" && side !== "ALIVE") throw new Error("side must be DEAD or ALIVE");
  const stake = Number(stakeRaw);
  if (!Number.isFinite(stake) || stake <= 0) throw new Error("stake must be positive");
  const market = getMarket(marketId);
  if (!market || market.status !== "open") throw new Error("market not open");

  const tx = db.transaction(() => {
    if (user.balance < stake) throw new Error("insufficient balance");
    db.prepare("UPDATE users SET balance = ROUND(balance - ?, 2) WHERE id = ?").run(stake, user.id);
    const info = db
      .prepare(
        `INSERT INTO challenges (challenger_id, market_id, challenger_side, stake, status, created_at)
         VALUES (?, ?, ?, ?, 'open', ?)`
      )
      .run(user.id, marketId, side, stake, now());
    return db.prepare("SELECT * FROM challenges WHERE id = ?").get(info.lastInsertRowid);
  });
  return tx();
}

export function acceptChallenge(user, challengeId) {
  const c = db.prepare("SELECT * FROM challenges WHERE id = ?").get(challengeId);
  if (!c) throw new Error("challenge not found");
  if (c.status !== "open") throw new Error("challenge no longer open");
  if (c.challenger_id === user.id) throw new Error("cannot accept your own challenge");

  const tx = db.transaction(() => {
    if (user.balance < c.stake) throw new Error("insufficient balance");
    db.prepare("UPDATE users SET balance = ROUND(balance - ?, 2) WHERE id = ?").run(c.stake, user.id);
    db.prepare("UPDATE challenges SET opponent_id = ?, status = 'active' WHERE id = ?").run(user.id, c.id);
    return db.prepare("SELECT * FROM challenges WHERE id = ?").get(c.id);
  });
  return tx();
}

// ---- Read helpers shaped for the API ----
export function betToApi(bet, marketName) {
  return {
    id: bet.id,
    marketId: bet.market_id,
    market: marketName,
    side: bet.side,
    stake: round2(bet.stake),
    price: bet.price,
    shares: round2(bet.shares),
    status: bet.status,
    grossPayout: round2(bet.gross_payout),
    fee: round2(bet.fee),
    netPayout: round2(bet.net_payout),
    paper: !!bet.paper,
    createdAt: bet.created_at,
    resolvedAt: bet.resolved_at,
  };
}

export function getPortfolio(userId) {
  const rows = db
    .prepare(
      `SELECT b.*, m.name AS market_name, m.death AS market_death, m.survives AS market_survives,
              m.status AS market_status, m.outcome AS market_outcome
       FROM bets b JOIN markets m ON m.id = b.market_id
       WHERE b.user_id = ? ORDER BY b.created_at DESC`
    )
    .all(userId);

  const open = [];
  const resolved = [];
  for (const r of rows) {
    const currentPrice = r.side === "DEAD" ? r.market_death : r.market_survives;
    const api = betToApi(r, r.market_name);
    if (r.status === "open") {
      const value = r.shares * currentPrice;
      open.push({ ...api, currentPrice, value: round2(value), pnl: round2(value - r.stake) });
    } else {
      resolved.push({ ...api, outcome: r.status === "won" ? "WON" : "LOST", pnl: round2(r.net_payout - r.stake) });
    }
  }
  return { open, resolved };
}

// Leaderboard from realized P&L of real (non-paper) resolved bets.
export function getLeaderboard() {
  const rows = db
    .prepare(
      `SELECT u.id, u.username,
              COUNT(*) AS trades,
              SUM(CASE WHEN b.status='won' THEN 1 ELSE 0 END) AS wins,
              ROUND(SUM(b.net_payout - b.stake), 2) AS profit
       FROM bets b JOIN users u ON u.id = b.user_id
       WHERE b.paper = 0 AND b.status IN ('won','lost')
       GROUP BY u.id
       ORDER BY profit DESC
       LIMIT 50`
    )
    .all();
  return rows.map((r, i) => ({
    rank: i + 1,
    username: r.username,
    trades: r.trades,
    winRate: r.trades ? r.wins / r.trades : 0,
    profit: r.profit || 0,
  }));
}

// Recent real bets, newest first — shaped as Nick's /api/activity "events".
export function getActivity(limit = 50) {
  const rows = db
    .prepare(
      `SELECT b.id, b.side, b.stake, b.created_at, u.username, m.name AS market
       FROM bets b JOIN users u ON u.id = b.user_id JOIN markets m ON m.id = b.market_id
       WHERE b.paper = 0 ORDER BY b.created_at DESC LIMIT ?`
    )
    .all(limit);
  return rows.map((r) => ({
    id: r.id,
    user: "@" + r.username,
    market: r.market,
    side: r.side,
    amt: round2(r.stake),
    at: r.created_at,
  }));
}
