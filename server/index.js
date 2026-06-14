// Dead or Alive — API server.
// Mirrors the live deployment's contract (/api/markets, /api/auth/nonce,
// /api/leaderboard, /api/activity) and adds the full money loop: auth, betting,
// portfolio, comments, challenges, admin resolution.

import express from "express";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { db, marketRowToApi } from "./db.js";
import {
  issueNonce,
  verifyWalletSignature,
  devLogin,
  signToken,
  setAuthCookie,
  attachUser,
  requireUser,
  FAUCET,
  ALLOW_DEV_LOGIN,
} from "./auth.js";
import {
  placeBet,
  closeBet,
  resolveMarket,
  createMarket,
  getMarket,
  getPortfolio,
  getLeaderboard,
  getActivity,
  getResolutions,
  placeOrder,
  cancelOrder,
  getOrders,
  getOrderBook,
  createChallenge,
  acceptChallenge,
  getMyChallenges,
  FEE_RATE,
} from "./engine.js";
import { onEvent, emitEvent } from "./events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const PORT = Number(process.env.PORT || 3000);

// Admin auth: sha256 of the admin password. Default matches the value Nick shared
// (so the same /admin password works); override with DOA_ADMIN_SECRET in prod.
const ADMIN_SECRET =
  process.env.DOA_ADMIN_SECRET ||
  "73392d7280957074bb7e653c5f06d0f83417d6631e0db49d7ffca45bd0917fb3";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

const ok = (res, data) => res.json(data);
const fail = (res, code, msg) => res.status(code).json({ error: msg });
const wrap = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (e) {
    fail(res, 400, e.message || "request failed");
  }
};

// ---------------- Markets (matches live contract) ----------------
app.get("/api/markets", (req, res) => {
  const rows = db.prepare("SELECT * FROM markets ORDER BY id").all();
  ok(res, { markets: rows.map(marketRowToApi), count: rows.length });
});

app.get("/api/markets/:id", (req, res) => {
  const row = getMarket(Number(req.params.id));
  if (!row) return fail(res, 404, "market not found");
  ok(res, { market: marketRowToApi(row) });
});

// ---------------- Auth ----------------
// GET /api/auth/nonce            -> bare nonce (live-contract compatible)
// GET /api/auth/nonce?address=0x -> { nonce, message } to sign
app.get("/api/auth/nonce", (req, res) => {
  if (req.query.address) {
    try {
      return ok(res, issueNonce(req.query.address));
    } catch (e) {
      return fail(res, 400, e.message);
    }
  }
  ok(res, { nonce: crypto.randomBytes(12).toString("base64url") });
});

app.post(
  "/api/auth/verify",
  wrap((req, res) => {
    const { address, signature } = req.body || {};
    const user = verifyWalletSignature(address, signature);
    const token = signToken(user);
    setAuthCookie(res, token);
    ok(res, { token, user: publicUser(user) });
  })
);

app.post(
  "/api/auth/dev",
  wrap((req, res) => {
    if (!ALLOW_DEV_LOGIN) return fail(res, 403, "dev login disabled");
    const user = devLogin((req.body || {}).username);
    const token = signToken(user);
    setAuthCookie(res, token);
    ok(res, { token, user: publicUser(user) });
  })
);

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("doa_session");
  ok(res, { ok: true });
});

app.get("/api/me", (req, res) => {
  if (!req.user) return ok(res, { user: null });
  // re-read for fresh balance
  const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  ok(res, { user: publicUser(fresh) });
});

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    address: u.address && u.address.startsWith("dev:") ? null : u.address,
    balance: Math.round(u.balance * 100) / 100,
    faucet: FAUCET,
  };
}

// ---------------- Betting ----------------
app.post(
  "/api/bets",
  requireUser,
  wrap((req, res) => {
    const { marketId, side, amount, paper } = req.body || {};
    const result = placeBet(req.user, Number(marketId), side, Number(amount), !!paper);
    ok(res, result);
  })
);

// Sell an open position back at the current price (2% fee on proceeds).
app.post(
  "/api/bets/:id/close",
  requireUser,
  wrap((req, res) => {
    ok(res, closeBet(req.user, Number(req.params.id)));
  })
);

app.get("/api/portfolio", requireUser, (req, res) => {
  ok(res, getPortfolio(req.user.id));
});

// ---------------- Limit orders ----------------
app.get("/api/orders", requireUser, (req, res) => ok(res, { orders: getOrders(req.user.id) }));

app.post(
  "/api/orders",
  requireUser,
  wrap((req, res) => {
    const { marketId, side, limitPrice, stake } = req.body || {};
    ok(res, placeOrder(req.user, Number(marketId), side, Number(limitPrice), Number(stake)));
  })
);

app.delete(
  "/api/orders/:id",
  requireUser,
  wrap((req, res) => {
    ok(res, cancelOrder(req.user, Number(req.params.id)));
  })
);

// ---------------- Public resolution history ----------------
app.get("/api/resolutions", (req, res) => ok(res, { resolutions: getResolutions() }));

// ---------------- Leaderboard / Activity (live-contract compatible) ----------------
app.get("/api/leaderboard", (req, res) => ok(res, { leaderboard: getLeaderboard() }));
app.get("/api/activity", (req, res) => ok(res, { events: getActivity(50) }));

// ---------------- Comments ----------------
app.get("/api/markets/:id/comments", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM comments WHERE market_id = ? ORDER BY created_at DESC LIMIT 100")
    .all(Number(req.params.id));
  ok(res, {
    comments: rows.map((c) => ({
      id: c.id,
      username: c.username,
      text: c.text,
      upvotes: c.upvotes,
      createdAt: c.created_at,
    })),
  });
});

app.post(
  "/api/markets/:id/comments",
  requireUser,
  wrap((req, res) => {
    const text = String((req.body || {}).text || "").trim().slice(0, 600);
    if (!text) throw new Error("comment text required");
    const marketId = Number(req.params.id);
    if (!getMarket(marketId)) throw new Error("market not found");
    const info = db
      .prepare("INSERT INTO comments (market_id, user_id, username, text, upvotes, created_at) VALUES (?,?,?,?,0,?)")
      .run(marketId, req.user.id, req.user.username, text, Date.now());
    const c = db.prepare("SELECT * FROM comments WHERE id = ?").get(info.lastInsertRowid);
    ok(res, { comment: { id: c.id, username: c.username, text: c.text, upvotes: 0, createdAt: c.created_at } });
  })
);

// ---------------- Challenges ----------------
app.get("/api/challenges", (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, m.name AS market_name, cu.username AS challenger_name, ou.username AS opponent_name
       FROM challenges c
       JOIN markets m ON m.id = c.market_id
       JOIN users cu ON cu.id = c.challenger_id
       LEFT JOIN users ou ON ou.id = c.opponent_id
       WHERE c.status = 'open' ORDER BY c.created_at DESC LIMIT 50`
    )
    .all();
  ok(res, {
    challenges: rows.map((c) => ({
      id: c.id,
      market: c.market_name,
      marketId: c.market_id,
      challenger: c.challenger_name,
      challengerSide: c.challenger_side,
      stake: c.stake,
      createdAt: c.created_at,
    })),
  });
});

app.post(
  "/api/challenges",
  requireUser,
  wrap((req, res) => {
    const { marketId, side, stake } = req.body || {};
    const c = createChallenge(req.user, Number(marketId), side, Number(stake));
    ok(res, { challenge: c, balance: db.prepare("SELECT balance FROM users WHERE id=?").get(req.user.id).balance });
  })
);

app.post(
  "/api/challenges/:id/accept",
  requireUser,
  wrap((req, res) => {
    const c = acceptChallenge(req.user, Number(req.params.id));
    ok(res, { challenge: c, balance: db.prepare("SELECT balance FROM users WHERE id=?").get(req.user.id).balance });
  })
);

// ---------------- Admin (resolution console) ----------------
function requireAdmin(req, res, next) {
  const secret = req.headers["x-admin-secret"] || (req.body || {}).adminSecret || req.query.adminSecret;
  if (secret !== ADMIN_SECRET) return fail(res, 401, "admin authentication required");
  next();
}

app.post("/api/admin/login", (req, res) => {
  const secret = (req.body || {}).adminSecret;
  ok(res, { ok: secret === ADMIN_SECRET });
});

app.post(
  "/api/admin/resolve",
  requireAdmin,
  wrap((req, res) => {
    const { marketId, outcome, reason, sourceUrl } = req.body || {};
    ok(res, { resolved: resolveMarket(Number(marketId), outcome, reason, sourceUrl) });
  })
);

// Create a new market live, no redeploy.
app.post(
  "/api/admin/markets",
  requireAdmin,
  wrap((req, res) => {
    const { name, category, death, daysLeft, volume } = req.body || {};
    ok(res, { market: createMarket({ name, category, death, daysLeft, volume }) });
  })
);

app.get("/api/admin/stats", requireAdmin, (req, res) => {
  const users = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  const openBets = db.prepare("SELECT COUNT(*) AS n FROM bets WHERE status='open' AND paper=0").get().n;
  const fees = db.prepare("SELECT ROUND(SUM(fee),2) AS f FROM bets WHERE paper=0").get().f || 0;
  const resolved = db.prepare("SELECT COUNT(*) AS n FROM markets WHERE status='resolved'").get().n;
  ok(res, { users, openBets, feesCollected: fees, marketsResolved: resolved, feeRate: FEE_RATE });
});

// ---------------- Order book ----------------
app.get("/api/markets/:id/orderbook", (req, res) => {
  const book = getOrderBook(Number(req.params.id));
  if (!book) return fail(res, 404, "market not found");
  ok(res, book);
});

// ---------------- My challenges ----------------
app.get("/api/challenges/mine", requireUser, (req, res) => ok(res, { challenges: getMyChallenges(req.user.id) }));

// ---------------- Real-time stream (SSE) ----------------
// One event source per browser. Domain events from the engine fan out to every
// client. `?market=<id>` lets us count "who's watching" per market (presence).
const sseClients = new Set();
const presence = new Map(); // marketId -> viewer count

function broadcastPresence() {
  const counts = {};
  for (const [mid, n] of presence) if (n > 0) counts[mid] = n;
  emitEvent({ kind: "presence", counts });
}

function sseSend(res, evt) {
  try {
    res.write(`event: ${evt.kind}\n`);
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  } catch {
    /* client gone; cleanup happens on 'close' */
  }
}

// Forward every engine event to every connected browser.
onEvent((evt) => {
  for (const c of sseClients) sseSend(c.res, evt);
});

app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`retry: 3000\n\n`);

  const marketId = req.query.market !== undefined && req.query.market !== "" ? Number(req.query.market) : null;
  const client = { res, marketId };
  sseClients.add(client);
  if (marketId != null) {
    presence.set(marketId, (presence.get(marketId) || 0) + 1);
    broadcastPresence();
  }
  // send a hello so the client knows it's live + current presence
  sseSend(res, { kind: "hello", ts: Date.now() });

  const ping = setInterval(() => res.write(`: ping\n\n`), 25000); // keep intermediaries from closing it

  req.on("close", () => {
    clearInterval(ping);
    sseClients.delete(client);
    if (marketId != null) {
      presence.set(marketId, Math.max(0, (presence.get(marketId) || 1) - 1));
      broadcastPresence();
    }
  });
});

// ---------------- Health ----------------
app.get("/api/health", (req, res) => ok(res, { ok: true, ts: Date.now(), viewers: sseClients.size }));

// ---------------- Static frontend ----------------
app.use(express.static(PUBLIC_DIR));
// SPA fallback: anything not under /api serves the app shell
app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

app.listen(PORT, () => {
  console.log(`\n  Dead or Alive running → http://localhost:${PORT}`);
  console.log(`  API:   http://localhost:${PORT}/api/markets`);
  console.log(`  Admin: http://localhost:${PORT}/admin  (dev login ${ALLOW_DEV_LOGIN ? "ON" : "OFF"}, faucet $${FAUCET})\n`);
});
