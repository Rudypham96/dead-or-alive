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
npm test     # 28-check end-to-end suite against a throwaway DB
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
2. **Bet** — buy DEAD or ALIVE shares at the current implied probability. `shares = stake / price`. The stake is debited immediately.
3. **The line moves** — each bet nudges the market's odds toward the bought side, scaled by stake vs. the market's virtual liquidity. Big bets in thin markets move the line; small bets in deep markets barely do (realistic).
4. **Resolve** — an admin resolves the market DEAD or ALIVE in the Resolution Console (`/admin`).
5. **Payout** — winning shares settle at **$1.00 each**. A **2% fee is taken on gross winnings only** (Polymarket model). Losers pay nothing. Net is credited to the balance.

`netPayout = winningShares × $1.00 × 0.98`

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
| GET | `/api/markets/:id` | `{ market }` |
| GET | `/api/auth/nonce?address=0x…` | `{ nonce, message }` to sign |
| POST | `/api/auth/verify` | `{ address, signature }` → session |
| POST | `/api/auth/dev` | `{ username }` → session (test/demo; disable with `DOA_ALLOW_DEV_LOGIN=0`) |
| GET | `/api/me` | current user + balance |
| POST | `/api/bets` | `{ marketId, side, amount, paper }` → bet + new balance + updated market |
| GET | `/api/portfolio` | `{ open[], resolved[] }` (auth required) |
| GET | `/api/leaderboard` | `{ leaderboard }` — ranked by realized P&L |
| GET | `/api/activity` | `{ events }` — recent real bets |
| GET/POST | `/api/markets/:id/comments` | read / post (post requires auth) |
| GET/POST | `/api/challenges` | list open / create (escrows stake) |
| POST | `/api/challenges/:id/accept` | accept a P2P challenge |
| POST | `/api/admin/resolve` | `{ marketId, outcome }` + `x-admin-secret` header |
| GET | `/api/admin/stats` | users, open bets, fees collected, markets resolved |

---

## Admin / resolution

Visit `/admin` and enter the admin secret. The console lists open markets and resolves them, executing payouts immediately (the 2-of-3 multi-sig committee is conceptual for now — this is operator mode). The default secret matches the value from the original deployment; override it in production:

```
DOA_ADMIN_SECRET=<sha256-of-your-password>
```

---

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
- **Money stored as floats.** Fine for a bootstrap; move to integer cents (or on-chain units) before real money.
- **Price impact is a transparent nudge, not a true AMM.** No LMSR/CPMM, no order book matching. Good enough to make the line move; revisit when liquidity matters.
- **Comments/leaderboard/activity** show rich seeded demo content alongside real data so the app never looks empty pre-launch. Real user actions persist and rank correctly.
- Multi-sig resolution, KYC, referrals, and email/SMS notifications remain parked (see `HANDOFF.md`).

---

## Deploying

Any Node host works (Render, Railway, Fly, a VPS). Set the env vars above, ensure a writable path for `DOA_DB` (or point it at a mounted volume), and run `npm start`. For Vercel, the API would move to serverless functions and SQLite to a hosted DB (Turso/LibSQL is the closest drop-in) — the route handlers in `server/` are the source of truth for the contract.
