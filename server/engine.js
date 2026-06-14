// Betting engine: place bets, move the line, resolve markets, pay out.
//
// Pricing: a bet buys shares at the current implied probability (DEAD price =
// market.death, ALIVE price = market.survives). Each winning share is worth $1
// at resolution. We take a 2% fee on GROSS WINNINGS only (Polymarket model) —
// losers pay nothing. After each trade we nudge the line toward the bought side,
// scaled by stake vs the market's virtual liquidity, so big bets move the odds
// (this is a transparent price-impact model, not a full AMM — see README).

import { db, marketRowToApi } from "./db.js";
import { mulberry32, makeSeries, slugify, logoFor } from "./markets-seed.js";
import { emitEvent } from "./events.js";

export const FEE_RATE = 0.02;
export const WHALE_THRESHOLD = 500; // bets >= this trigger a "whale" alert on the wire
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

    // Paper trades don't move the real shared line (it's broadcast live to
    // everyone) — they only spend virtual funds. Real bets move it.
    if (!paper) {
      const newDeath = applyPriceImpact(market, side, stake);
      const series = JSON.parse(market.series);
      series.push(newDeath);
      while (series.length > 60) series.shift();
      const change24h = newDeath - series[Math.max(0, series.length - 24)];
      db.prepare(
        `UPDATE markets SET death = ?, survives = ?, series = ?, change24h = ?,
           volume = volume + ?, traders = traders + 1 WHERE id = ?`
      ).run(newDeath, 1 - newDeath, JSON.stringify(series), change24h, stake, marketId);
    }

    const bet = db.prepare("SELECT * FROM bets WHERE id = ?").get(info.lastInsertRowid);
    return { bet, balance };
  });

  const { bet, balance } = tx();
  if (!paper) matchOrders(marketId); // the line moved — fill any now-marketable limit orders
  const apiMarket = marketRowToApi(getMarket(marketId));
  if (!paper) {
    emitEvent({ kind: "bet", marketId, user: user.username, side, amt: round2(stake), price: bet.price, at: bet.created_at });
    emitMarket(apiMarket);
  }
  return { bet: betToApi(bet, market.name), market: apiMarket, balance };
}

// Broadcast a fresh market snapshot so every viewer's odds tick live.
function emitMarket(apiMarket) {
  emitEvent({ kind: "price", market: apiMarket });
}

// Close an open position early: sell all shares back at the current price.
// Proceeds = shares × price; 2% fee on gross proceeds (consistent with the
// resolution model — the platform takes 2% of whatever comes back to you).
// Selling pushes the line the other way, same impact model as buying.
export function closeBet(user, betId) {
  const bet = db.prepare("SELECT * FROM bets WHERE id = ?").get(betId);
  if (!bet) throw new Error("position not found");
  if (bet.user_id !== user.id) throw new Error("not your position");
  if (bet.status !== "open") throw new Error("position already settled");

  const market = getMarket(bet.market_id);
  if (!market) throw new Error("market not found");
  if (market.status !== "open") throw new Error("market is resolved — position will settle at resolution");

  const price = bet.side === "DEAD" ? market.death : market.survives;
  const proceeds = bet.shares * price;
  const fee = round2(proceeds * FEE_RATE);
  const net = round2(proceeds - fee);

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE bets SET status='closed', sold_price=?, gross_payout=?, fee=?, net_payout=?, resolved_at=?
       WHERE id=?`
    ).run(price, round2(proceeds), fee, net, now(), bet.id);

    if (!bet.paper) {
      db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(net, user.id);
      // selling DEAD = pressure toward ALIVE and vice versa (paper exits don't move the real line)
      const newDeath = applyPriceImpact(market, bet.side === "DEAD" ? "ALIVE" : "DEAD", proceeds);
      const series = JSON.parse(market.series);
      series.push(newDeath);
      while (series.length > 60) series.shift();
      const change24h = newDeath - series[Math.max(0, series.length - 24)];
      db.prepare(
        `UPDATE markets SET death = ?, survives = ?, series = ?, change24h = ?, volume = volume + ? WHERE id = ?`
      ).run(newDeath, 1 - newDeath, JSON.stringify(series), change24h, proceeds, bet.market_id);
    }

    return db.prepare("SELECT balance FROM users WHERE id = ?").get(user.id).balance;
  });

  const balance = tx();
  if (!bet.paper) matchOrders(bet.market_id);
  const apiMarket = marketRowToApi(getMarket(bet.market_id));
  if (!bet.paper) {
    emitEvent({ kind: "trade", marketId: bet.market_id, user: user.username, side: bet.side, amt: round2(proceeds), price, at: now(), action: "sold" });
    emitMarket(apiMarket);
  }
  return {
    closed: { id: bet.id, market: market.name, side: bet.side, shares: round2(bet.shares),
      soldPrice: price, grossProceeds: round2(proceeds), fee, netProceeds: net,
      pnl: round2(net - bet.stake) },
    market: apiMarket,
    balance,
  };
}

// Resolve a market. Pays winners (minus 2% fee), marks losers, refunds open
// limit orders, settles linked challenges, and records the why (reason +
// source URL) for the public resolution history. Refuses if already resolved.
export function resolveMarket(marketId, outcomeRaw, reason = null, sourceUrl = null) {
  const outcome = String(outcomeRaw || "").toUpperCase();
  if (outcome !== "DEAD" && outcome !== "ALIVE") throw new Error("outcome must be DEAD or ALIVE");
  const market = getMarket(marketId);
  if (!market) throw new Error("market not found");
  if (market.status === "resolved") throw new Error("market already resolved");
  reason = reason ? String(reason).trim().slice(0, 500) : null;
  sourceUrl = sourceUrl ? String(sourceUrl).trim().slice(0, 300) : null;

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

    // refund any unfilled limit orders — their escrow goes back to the owner
    const openOrders = db
      .prepare("SELECT * FROM orders WHERE market_id = ? AND status = 'open'")
      .all(marketId);
    for (const o of openOrders) {
      db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(o.stake, o.user_id);
      db.prepare("UPDATE orders SET status='cancelled', settled_at=? WHERE id=?").run(now(), o.id);
    }

    db.prepare(
      `UPDATE markets SET status='resolved', outcome=?, resolved_at=?, death=?, survives=?,
         resolution_reason=?, resolution_source=? WHERE id=?`
    ).run(outcome, now(), outcome === "DEAD" ? 1 : 0, outcome === "DEAD" ? 0 : 1, reason, sourceUrl, marketId);

    const challengesSettled = settleChallengesForMarket(marketId, outcome);

    return {
      market: market.name,
      outcome,
      winners,
      losers,
      challengesSettled,
      ordersRefunded: openOrders.length,
      totalGrossPayout: round2(totalGross),
      totalFeesCollected: round2(totalFees),
      totalNetPaid: round2(totalNet),
    };
  });

  const summary = tx();
  emitEvent({ kind: "resolution", marketId, market: marketRowToApi(getMarket(marketId)), outcome, reason });
  return summary;
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
  const c = tx();
  emitEvent({ kind: "challenge", action: "created", marketId, market: market.name, challenger: user.username, side, stake });
  return c;
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
  const accepted = tx();
  emitEvent({ kind: "challenge", action: "accepted", marketId: c.market_id, opponent: user.username, stake: c.stake });
  return accepted;
}

// Challenges where the given user is challenger or opponent, newest first.
export function getMyChallenges(userId) {
  const rows = db
    .prepare(
      `SELECT c.*, m.name AS market_name, m.days_left AS days_left,
              cu.username AS challenger_name, ou.username AS opponent_name
       FROM challenges c
       JOIN markets m ON m.id = c.market_id
       JOIN users cu ON cu.id = c.challenger_id
       LEFT JOIN users ou ON ou.id = c.opponent_id
       WHERE c.challenger_id = ? OR c.opponent_id = ?
       ORDER BY c.created_at DESC LIMIT 50`
    )
    .all(userId, userId);
  return rows.map((c) => {
    const iAmChallenger = c.challenger_id === userId;
    let outcome = null;
    if (c.status === "resolved" && c.outcome && c.outcome !== "PUSH") {
      outcome = String(c.outcome) === String(userId) ? "WON" : "LOST";
    }
    return {
      id: c.id,
      marketId: c.market_id,
      market: c.market_name,
      daysLeft: c.days_left,
      yourSide: iAmChallenger ? c.challenger_side : c.challenger_side === "DEAD" ? "ALIVE" : "DEAD",
      opponent: iAmChallenger ? c.opponent_name : c.challenger_name,
      stake: c.stake,
      status: c.status,
      outcome,
    };
  });
}

// Aggregate resting limit orders into an order book by side and price level.
export function getOrderBook(marketId) {
  const market = getMarket(marketId);
  if (!market) return null;
  const rows = db
    .prepare(
      `SELECT side, limit_price, SUM(stake) AS stake, COUNT(*) AS count
       FROM orders WHERE market_id = ? AND status = 'open'
       GROUP BY side, limit_price`
    )
    .all(marketId);
  const dead = [];
  const alive = [];
  for (const r of rows) {
    const level = { price: r.limit_price, stake: round2(r.stake), shares: round2(r.stake / r.limit_price), count: r.count };
    (r.side === "DEAD" ? dead : alive).push(level);
  }
  dead.sort((a, b) => b.price - a.price); // best (highest) DEAD bid first
  alive.sort((a, b) => b.price - a.price); // best (highest) ALIVE bid first
  return { marketId, lastDeath: market.death, lastSurvives: market.survives, dead, alive };
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
      const outcome = r.status === "won" ? "WON" : r.status === "lost" ? "LOST" : "CLOSED";
      resolved.push({ ...api, outcome, soldPrice: r.sold_price || null, pnl: round2(r.net_payout - r.stake) });
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

// ---- Admin market creation ----
// New markets go live instantly — no redeploy. Series history is synthesized
// backward from the starting odds so charts render from day one.
export function createMarket({ name, category, death, daysLeft, volume }) {
  name = String(name || "").trim().slice(0, 80);
  category = String(category || "").trim().slice(0, 50) || "Uncategorized";
  death = Number(death);
  daysLeft = Math.round(Number(daysLeft));
  volume = Number(volume) || 0;
  if (!name) throw new Error("market name required");
  if (!Number.isFinite(death) || death < 0.02 || death > 0.98)
    throw new Error("starting DEAD odds must be between 2% and 98%");
  if (!Number.isFinite(daysLeft) || daysLeft < 1 || daysLeft > 2000)
    throw new Error("resolution window must be 1–2000 days");
  const dup = db.prepare("SELECT id FROM markets WHERE LOWER(name) = LOWER(?) AND status='open'").get(name);
  if (dup) throw new Error(`an open market for "${name}" already exists (id ${dup.id})`);

  const tx = db.transaction(() => {
    const id = db.prepare("SELECT COALESCE(MAX(id), -1) + 1 AS next FROM markets").get().next;
    const rng = mulberry32(0x9e3779b1 ^ (id * 2654435761));
    const series = makeSeries(rng, death, 60, 0.05);
    const change24h = death - series[Math.max(0, series.length - 24)];
    const logo = logoFor(name);
    const vol = volume > 0 ? volume : Math.round(50000 + rng() * 150000);
    db.prepare(
      `INSERT INTO markets
         (id, slug, category, name, death, survives, base_death, series, change24h,
          volume, traders, days_left, logo_hue, logo_initials, liquidity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`
    ).run(
      id, slugify(name) + "-" + id, category, name, death, 1 - death, death,
      JSON.stringify(series), change24h, vol, 0, daysLeft, logo.hue, logo.initials,
      Math.max(vol * 0.05, 25000)
    );
    return id;
  });

  const apiMarket = marketRowToApi(getMarket(tx()));
  emitEvent({ kind: "market:new", market: apiMarket });
  return apiMarket;
}

// ---- Limit orders ----
// A limit order escrows the stake and fills when the side's price trades at or
// below the limit. Fills execute at the CURRENT price (at-or-better, never
// worse). Each fill is its own transaction and itself moves the line, so the
// match loop re-reads the market every iteration.

export function placeOrder(user, marketId, side, limitPriceRaw, stakeRaw) {
  side = String(side || "").toUpperCase();
  if (side !== "DEAD" && side !== "ALIVE") throw new Error("side must be DEAD or ALIVE");
  const limitPrice = Number(limitPriceRaw);
  if (!Number.isFinite(limitPrice) || limitPrice < 0.02 || limitPrice > 0.98)
    throw new Error("limit price must be between 2% and 98%");
  const stake = Number(stakeRaw);
  if (!Number.isFinite(stake) || stake <= 0) throw new Error("stake must be positive");

  const market = getMarket(marketId);
  if (!market || market.status !== "open") throw new Error("market not open");

  const tx = db.transaction(() => {
    const fresh = db.prepare("SELECT balance FROM users WHERE id = ?").get(user.id);
    if (fresh.balance < stake) throw new Error("insufficient balance");
    db.prepare("UPDATE users SET balance = ROUND(balance - ?, 2) WHERE id = ?").run(stake, user.id);
    const info = db
      .prepare(
        `INSERT INTO orders (user_id, market_id, side, limit_price, stake, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'open', ?)`
      )
      .run(user.id, marketId, side, limitPrice, stake, now());
    return info.lastInsertRowid;
  });

  const orderId = tx();
  matchOrders(marketId); // fills immediately if already marketable
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  emitEvent({ kind: "order", marketId, action: order.status === "filled" ? "filled" : "placed" });
  return {
    order: orderToApi(order, market.name),
    balance: db.prepare("SELECT balance FROM users WHERE id = ?").get(user.id).balance,
    market: marketRowToApi(getMarket(marketId)),
  };
}

export function cancelOrder(user, orderId) {
  const o = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!o) throw new Error("order not found");
  if (o.user_id !== user.id) throw new Error("not your order");
  if (o.status !== "open") throw new Error("order is not open");

  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?").run(o.stake, o.user_id);
    db.prepare("UPDATE orders SET status='cancelled', settled_at=? WHERE id=?").run(now(), o.id);
    return db.prepare("SELECT balance FROM users WHERE id = ?").get(user.id).balance;
  });
  const balance = tx();
  emitEvent({ kind: "order", marketId: o.market_id, action: "cancelled" });
  return { cancelled: o.id, refunded: o.stake, balance };
}

// Fill loop: oldest marketable order first; each fill moves the line, so
// re-check against fresh prices every round. Capped to avoid pathological spins.
export function matchOrders(marketId) {
  let filled = 0;
  for (let i = 0; i < 50; i++) {
    const market = getMarket(marketId);
    if (!market || market.status !== "open") break;
    const order = db
      .prepare(
        `SELECT * FROM orders WHERE market_id = ? AND status = 'open'
           AND ((side = 'DEAD' AND ? <= limit_price) OR (side = 'ALIVE' AND ? <= limit_price))
         ORDER BY created_at ASC LIMIT 1`
      )
      .get(marketId, market.death, market.survives);
    if (!order) break;

    const price = order.side === "DEAD" ? market.death : market.survives;
    const shares = order.stake / price;
    const tx = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO bets (user_id, market_id, side, stake, price, shares, status, paper, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'open', 0, ?)`
        )
        .run(order.user_id, marketId, order.side, order.stake, price, shares, now());
      db.prepare("UPDATE orders SET status='filled', bet_id=?, settled_at=? WHERE id=?")
        .run(info.lastInsertRowid, now(), order.id);

      const newDeath = applyPriceImpact(market, order.side, order.stake);
      const series = JSON.parse(market.series);
      series.push(newDeath);
      while (series.length > 60) series.shift();
      const change24h = newDeath - series[Math.max(0, series.length - 24)];
      db.prepare(
        `UPDATE markets SET death = ?, survives = ?, series = ?, change24h = ?,
           volume = volume + ?, traders = traders + 1 WHERE id = ?`
      ).run(newDeath, 1 - newDeath, JSON.stringify(series), change24h, order.stake, marketId);
    });
    tx();
    const owner = db.prepare("SELECT username FROM users WHERE id = ?").get(order.user_id);
    emitEvent({ kind: "fill", marketId, user: owner ? owner.username : "trader", side: order.side, amt: round2(order.stake), price, at: now() });
    emitEvent({ kind: "price", market: marketRowToApi(getMarket(marketId)) });
    filled++;
  }
  return filled;
}

function orderToApi(o, marketName) {
  return {
    id: o.id,
    marketId: o.market_id,
    market: marketName,
    side: o.side,
    limitPrice: o.limit_price,
    stake: round2(o.stake),
    status: o.status,
    betId: o.bet_id || null,
    createdAt: o.created_at,
    settledAt: o.settled_at || null,
  };
}

export function getOrders(userId) {
  const rows = db
    .prepare(
      `SELECT o.*, m.name AS market_name FROM orders o JOIN markets m ON m.id = o.market_id
       WHERE o.user_id = ? ORDER BY (o.status = 'open') DESC, o.created_at DESC LIMIT 50`
    )
    .all(userId);
  return rows.map((o) => orderToApi(o, o.market_name));
}

// ---- Public resolution history ----
// Every resolved market with its why, its source, and what was paid out.
// This page is the trust layer: anyone can audit how markets settle.
export function getResolutions() {
  const rows = db
    .prepare(
      `SELECT m.*,
              (SELECT COUNT(*) FROM bets b WHERE b.market_id = m.id AND b.status = 'won' AND b.paper = 0) AS winners,
              (SELECT COUNT(*) FROM bets b WHERE b.market_id = m.id AND b.status = 'lost' AND b.paper = 0) AS losers,
              (SELECT ROUND(COALESCE(SUM(b.net_payout), 0), 2) FROM bets b WHERE b.market_id = m.id AND b.status = 'won' AND b.paper = 0) AS total_paid,
              (SELECT ROUND(COALESCE(SUM(b.fee), 0), 2) FROM bets b WHERE b.market_id = m.id AND b.status IN ('won','closed') AND b.paper = 0) AS total_fees
       FROM markets m WHERE m.status = 'resolved' ORDER BY m.resolved_at DESC`
    )
    .all();
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    logo: { hue: r.logo_hue, initials: r.logo_initials },
    outcome: r.outcome,
    resolvedAt: r.resolved_at,
    reason: r.resolution_reason || null,
    sourceUrl: r.resolution_source || null,
    winners: r.winners,
    losers: r.losers,
    totalPaid: r.total_paid,
    totalFees: r.total_fees,
  }));
}
