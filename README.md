# Dead or Alive

A prediction market where people bet on whether AI wipes out specific companies. Polymarket/Kalshi mechanics, AI-disruption as the only theme. 120 markets across 12 industries (Chegg, Fiverr, Shutterstock, Teleperformance, and friends).

This repo is the **full-stack build**: the polished React frontend from the design prototype, now running on a real Express + SQLite backend with working auth, betting, balances, resolution, and payouts.

---

## Quick start

```bash
npm install
npm start
# → http://localhost:3000
```

No build step, no database setup, no API keys. `npm start` creates the SQLite file and seeds 120 markets on first run.

```bash
npm test     # 73-check end-to-end suite against a throwaway DB
```

Requires **Node 22.5+** (uses the built-in `node:sqlite` module — no native compilation, no `better-sqlite3`).

---

## How it works

```
public/    React 18 + Babel (CDN, no build) — the design frontend, wired to the API
  index.html      app shell + CSS
  api.js          window.API client + bootstrap (loads markets + session before React mounts)
  data.jsx        deterministic seed data (same generator as the server)
  components.jsx  TopNav, MarketCard, BetTicket, etc.
  pages.jsx       all pages (Markets, MarketDetail, Portfolio, Leaderboard, Resolution Console…)
  app.jsx         App root: wallet/session state, bet handler, live market sync

server/    Express + node:sqlite
  index.js        routes + static serving
  db.js           schema, seed, transaction shim
  auth.js         wallet (SIWE) auth + JWT sessions + dev login
  engine.js       betting, price impact, resolution, payouts, challenges
  markets-seed.js deterministic market generator (ported from data.jsx)

test/e2e.js   boots the real server and drives the whole flow
```

### The money loop

1. **Connect** — a wallet (MetaMask, etc.) or, with no wallet present, a frictionless guest login for testing. New accounts get **$1,000 in test house credits** (faucet — no deposits/withdrawals yet).
2. **Bet** — buy DEAD or ALIVE shares at the current implied probability. `shares = stake / price`. The stake is debited immediately. Or place a **limit order**: pick a max price, the stake is escrowed, and the order fills automatically when the line trades at or below your limit (at the current price — at-or-better, never worse). Cancel any time for a full refund.
3. **The line moves** — each bet (and each limit-order fill) nudges the market's odds toward the bought side, scaled by stake vs. the market's virtual liquidity. Big bets in thin markets move the line; small bets in deep markets barely do (realistic). Every price move re-checks resting limit orders.
4. **Exit early or hold** — close any open position from the Portfolio at the current price. Proceeds = `shares × price`, minus the 2% fee on proceeds. Selling pushes the line the other way.
5. **Resolve** — an admin resolves the market DEAD or ALIVE in the Resolution Console (`/admin`), recording a **public reason + source URL**. Unfilled limit orders are refunded automatically.
6. **Payout** — winning shares settle at **$1.00 each**. A **2% fee is taken on gross winnings only** (Polymarket model). Losers pay nothing. Net is credited to the balance.

`netPayout = winningShares × $1.00 × 0.98`

The consistent fee rule everywhere: **the platform takes 2% of whatever comes back to you** — resolution payouts, early-exit proceeds, challenge pots. Losers never pay.

### Live, multiplayer feel

The platform pushes updates over Server-Sent Events (`GET /api/stream`), so the screen moves on its own:

- **Live odds** — when anyone bets, sells, or a limit order fills, every viewer's price ticks without a refresh.
- **Live activity feed** — each market's feed shows real trades as they land, newest first, with a live dot.
- **Presence** — a "X watching" count per market, driven by open stream connections.
- **Whale alerts** — a bet (or sale) of $500+ by another trader fires a toast for everyone watching.
- **Live order book + challenges** — both update in place as orders rest/fill/cancel and as challenges are created or accepted.

`?market=<id>` on the stream scopes presence to the market you're viewing; global events (any trade, resolution) arrive regardless.

### Order book

`GET /api/markets/:id/orderbook` aggregates real resting limit orders into DEAD and ALIVE depth by price level. The market detail page renders it live — place a limit order and it appears in the book for everyone; cancel or fill it and it disappears. Empty until someone rests an order (honest — no fake depth).

### Challenges (head-to-head)

Real P2P duels. Create an open challenge from a market's Head-to-Head card (stake escrowed), anyone can accept the other side (`/api/challenges`, `/api/challenges/mine`, `/api/challenges/:id/accept`). On resolution the winner takes the pot minus 2%; unaccepted challenges refund the challenger. New challenges stream live to the Challenges page.

### Trust layer

`/api/resolutions` + the public **Resolution History** page (footer link) list every settled market with its outcome, the reason, the source URL, and the payout totals. Resolved markets also show a banner with the reason on their detail page.

### Operating the platform

Admins (at `/admin`) can **create new markets live** — name, category, starting odds, resolution window — with no redeploy. New markets appear instantly with a synthesized 60-point price history so charts render from the first second.

---

## Wallet auth (the bug from the first live build)

The first deployment hit `MetaMask RPC Error: Cannot read properties of null (reading 'length')` because `personal_sign` fired before the nonce promise resolved — it signed `null`.

The contract here makes that impossible:

1. `GET /api/auth/nonce?address=0x…` → returns a `nonce` **and the exact message string to sign**.
2. Client signs that message with `personal_sign` — **after `await`-ing the nonce** (see `app.jsx → handleConnectWallet`).
3. `POST /api/auth/verify { address, signature }` → server recovers the signer with `ethers.verifyMessage` and compares. Match → JWT session cookie.

Nonces are single-use (burned on verify) so signatures can't be replayed. The e2e suite asserts replay and tampered-signature rejection.

---

## API

Mirrors the live Vercel deployment's contract so the two converge, then extends it.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/markets` | `{ markets, count }` — same shape as the live site |
| GET | `/api/markets/:id` | `{ market }` (includes resolution reason/source once resolved) |
| GET | `/api/auth/nonce?address=0x…` | `{ nonce, message }` to sign |
| POST | `/api/auth/verify` | `{ address, signature }` → session |
| POST | `/api/auth/dev` | `{ username }` → session (test/demo; disable with `DOA_ALLOW_DEV_LOGIN=0`) |
| GET | `/api/me` | current user + balance |
| POST | `/api/bets` | `{ marketId, side, amount, paper }` → bet + new balance + updated market |
| POST | `/api/bets/:id/close` | sell an open position at the current price (2% fee on proceeds) |
| GET | `/api/portfolio` | `{ open[], resolved[] }` (auth required) |
| GET | `/api/orders` | your limit orders, resting first (auth required) |
| POST | `/api/orders` | `{ marketId, side, limitPrice, stake }` — escrows stake, fills when marketable |
| DELETE | `/api/orders/:id` | cancel a resting order, refund escrow |
| GET | `/api/resolutions` | public resolution history: outcome, reason, source, payout totals |
| GET | `/api/markets/:id/orderbook` | real resting-order depth (DEAD + ALIVE levels) |
| GET | `/api/challenges/mine` | challenges you created or accepted (auth required) |
| GET | `/api/stream?market=<id>` | SSE: price, bet, fill, trade, order, presence, resolution, challenge events |
| GET | `/api/leaderboard` | `{ leaderboard }` — ranked by realized P&L |
| GET | `/api/activity` | `{ events }` — recent real bets |
| GET/POST | `/api/markets/:id/comments` | read / post (post requires auth) |
| GET/POST | `/api/challenges` | list open / create (escrows stake) |
| POST | `/api/challenges/:id/accept` | accept a P2P challenge |
| POST | `/api/admin/resolve` | `{ marketId, outcome, reason, sourceUrl }` + `x-admin-secret` header |
| POST | `/api/admin/markets` | `{ name, category, death, daysLeft }` — create a market live |
| GET | `/api/admin/stats` | users, open bets, fees collected, markets resolved |

---

## Admin / resolution

Visit `/admin` and enter the admin secret. The console lists open markets and resolves them, executing payouts immediately (the 2-of-3 multi-sig committee is conceptual for now — this is operator mode). The default secret matches the value from the original deployment; override it in production:

```
DOA_ADMIN_SECRET=<sha256-of-your-password>
```

---

## Security & hardening

- **Money integrity:** every balance debit re-reads the balance *inside* the transaction and writes relatively (`balance = balance - ?`) — no stale-snapshot overdraft, no negative balances. Verified by tests (two oversized bets, second rejected, balance intact).
- **Production won't boot insecure:** with `NODE_ENV=production`, the server refuses to start if `DOA_JWT_SECRET` or `DOA_ADMIN_SECRET` is unset/default, or if dev login is enabled. Dev login defaults OFF in production.
- **Admin:** secret compared with `crypto.timingSafeEqual`, only via the `x-admin-secret` header (never the query string, which leaks into logs).
- **Stored-XSS guarded:** resolution source URLs are server-validated to `http(s)` only — `javascript:`/`data:` are dropped. (Client renders all user text as React text nodes, never `dangerouslySetInnerHTML`.)
- **Rate limiting:** in-process per-IP/per-user limits on auth, admin, and money endpoints (bypassed under `NODE_ENV=test`).
- **SSE bounded:** total and per-IP connection caps; presence only tracks real market ids.
- **Accessibility:** site-wide `:focus-visible`, WCAG-AA contrast on muted text, `aria-label`s on icon buttons and money inputs, `aria-live` toast region, Escape-to-close + `role="dialog"` on the money modals.

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DOA_DB` | `data/doa.sqlite` | SQLite file path |
| `DOA_JWT_SECRET` | dev fallback | **set in production** |
| `DOA_ADMIN_SECRET` | original deploy hash | admin console secret |
| `DOA_FAUCET` | `1000` | starting test credits per new account |
| `DOA_ALLOW_DEV_LOGIN` | on | set `0` in production to require wallet auth |

---

## Known limitations (intentionally parked)

- **House credits, not real money.** No deposit/withdrawal, no on-chain settlement, no smart contracts yet. The faucet exists so the loop is fully playable today.
- **LAUNCH BLOCKER — money is stored as floats.** Balances/stakes/payouts are REAL dollars with consistent rounding, fine for a bootstrap, but a real-money book must use integer cents (or on-chain units) end-to-end to avoid sub-cent drift and reconciliation pain. This is the one hardening item deliberately left for the money-rail sprint (it touches every money line and is best done alongside Nick's contract work, which defines the real unit anyway). Do not flow real money until this is done.
- **Price impact is a transparent nudge, not a true AMM.** No LMSR/CPMM. Limit orders fill against the line (house liquidity), not against each other — the order book shows real resting demand but there's no user-to-user matching yet. Good enough to make the market feel real; revisit when liquidity matters.
- **Real-time is single-process.** The SSE event bus lives in one Node process. Fine for one server; scaling horizontally would need a shared pub/sub (Redis) so events fan out across instances.
- **Paper bets don't move the shared line** (they would let virtual money distort a live market everyone sees) — they spend virtual funds and show in your portfolio only.
- **Comments/leaderboard/activity** show rich seeded demo content alongside real data so the app never looks empty pre-launch. Real user actions persist and rank correctly.
- Multi-sig resolution, KYC, referrals, and email/SMS notifications remain parked (see `HANDOFF.md`).

---

## Deploying

Any Node host works (Render, Railway, Fly, a VPS). Set the env vars above, ensure a writable path for `DOA_DB` (or point it at a mounted volume), and run `npm start`. For Vercel, the API would move to serverless functions and SQLite to a hosted DB (Turso/LibSQL is the closest drop-in) — the route handlers in `server/` are the source of truth for the contract.
