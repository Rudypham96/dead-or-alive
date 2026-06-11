# Dead or Alive — Session Handoff Document
*Created: 2026-06-05 | Updated: 2026-06-11 with full-stack build + trading mechanics*

---

## ⚡ UPDATE 2026-06-11 (later) — TRADING MECHANICS SHIPPED

Four more features, all tested (52-check e2e suite, all passing) and verified in the browser:

1. **Sell / exit positions** — every open position in Portfolio has a working Close button. Sells all shares at the current price, 2% fee on proceeds, net back to balance, line moves the other way. Closed positions show a CLOSED badge in Resolved. This unlocks continuous trading volume — every exit is a fee event.
2. **Admin market creation** — "+ Create market" form in `/admin`: name, category, starting odds, resolution window. Market goes live instantly (no redeploy) with synthesized chart history. The open-markets queue is newest-first with a search filter.
3. **Resolution history + sources** — resolving now takes a public reason + source URL. New public page (footer → "Resolution History") lists every settled market with outcome, reason, source link, winners/losers, paid out, fees. Resolved market pages show a banner with the reason. This is the trust layer.
4. **Limit orders** — Market | Limit toggle in the bet ticket. Limit orders escrow the stake and auto-fill when the line crosses the limit (each bet/sell re-checks resting orders). Marketable limits fill instantly. Portfolio has a "Limit orders" card with cancel (refunds escrow). Resolution refunds unfilled orders.

Also fixed: `?m=<id>` deep links were being wiped on first render (broke all shareable links) — now they work, including for admin-created markets.

---

## ⚡ UPDATE 2026-06-11 — IT'S NOW A REAL APP (not just a prototype)

The design prototype has been turned into a **working full-stack application**. The whole money loop runs for real, end to end. This repo now contains both the frontend and a real backend.

**Run it:**
```bash
npm install
npm start          # → http://localhost:3000
npm test           # 28-check end-to-end suite, all passing
```
Requires Node 22.5+ (uses built-in `node:sqlite` — no native build, no API keys, no DB setup).

**What's real now:**
- **Backend** — Express + SQLite (`server/`). Mirrors Nick's live API contract (`/api/markets`, `/api/auth/nonce`, `/api/leaderboard`, `/api/activity`) and extends it.
- **Wallet auth done right** — nonce is `await`-ed before `personal_sign`, so the `Cannot read properties of null` bug can't happen. Signature verified server-side with ethers; nonces are single-use. (See README → "Wallet auth".)
- **Betting** — real share purchase (`shares = stake/price`), balance debited, the line moves with each bet.
- **Resolution + payout** — admin resolves at `/admin`; winners settle at $1/share minus the **2% fee on winnings**; balances credited.
- **Portfolio / leaderboard / activity** — fed by real bets (with seeded demo content alongside so it never looks empty).
- **Challenges + comments** — P2P stake escrow/accept and persisted comments.

**Verified end to end in the browser:** connect → bet $100 on Chegg → balance $1000→$900 → portfolio shows the position → admin resolves Chegg DEAD → payout $111.13 (gross $113.40, fee $2.27) → balance $900→$1011.13. Plus 28 automated assertions via `npm test`.

**New money paths everyone should know:**
- New accounts get **$1,000 test house credits** (faucet). No real deposits/withdrawals yet — that's still parked.
- No wallet in the browser → frictionless guest login for testing/demos. Disable with `DOA_ALLOW_DEV_LOGIN=0`.

**Read `README.md` first** — full architecture, API reference, env vars, and known limitations live there.

**Still parked (unchanged):** real-money deposits/withdrawals, smart contracts, on-chain settlement, KYC, referrals, email/SMS, true AMM pricing. See the parked list further down.

---

## WHO YOU ARE WORKING WITH

**Rudy Pham** — Co-Founder & COO. Direct, fast-moving. Lead with options, give a clear recommendation. No em dashes. No fluff. When a task is done, confirm it and share the path.

---

## WHAT THIS PROJECT IS

**Dead or Alive** is a prediction market platform where users bet on whether specific companies will be wiped out by AI. Think Polymarket/Kalshi but the entire focus is AI disruption as the underlying theme. 120 markets live (Chegg, Fiverr, Shutterstock, Teleperformance etc. across 12 industry categories).

**Co-developer:** Nick (N Brons) — he's in Europe, back on the weekend. He has the live deployed version on Vercel. You and Rudy are working on the design prototype in Claude Design.

---

## KEY LINKS

| Resource | URL |
|---|---|
| Claude Design (main working file) | https://claude.ai/design/p/019e061a-2ae7-7067-85e7-7c4c80c7149c?file=index.html |
| Nick's live deployed version | https://prediction-market-phi-ten.vercel.app |
| Nick's admin panel | https://prediction-market-phi-ten.vercel.app/admin |
| Admin password | 73392d7280957074bb7e653c5f06d0f83417d6631e0db49d7ffca45bd0917fb3 |
| GitHub repo | https://github.com/Rudypham96/dead-or-alive |
| Issues/audit log | C:\Users\Admin\Claude Projects\DeadOrAlive\ISSUES.md |

---

## BRAND & DESIGN SYSTEM

- **Name:** Dead or Alive — Will AI Kill It?
- **Tagline:** "Will AI kill it?"
- **Background:** #0A0B14 (deep blue-black)
- **Surface:** #111827
- **Border:** #1F2937
- **Primary accent:** #5B6BF5 (indigo)
- **Secondary:** #8B5CF6 (purple)
- **DEAD side:** #EF4444 (red)
- **ALIVE side:** #10B981 (green)
- **Text:** #F9FAFB
- **Muted:** #6B7280
- **Fonts:** Space Grotesk (headings), Inter (body), JetBrains Mono (numbers/odds)
- **Tech stack:** React 18 + Babel (CDN), Chart.js, all in a single self-contained HTML file

---

## WHAT'S BEEN BUILT (in Claude Design)

### Round 1 — 14 Bug Fixes
All implemented and verified:
1. Wallet state management + MetaMask connect flow (eth_requestAccounts)
2. Buy button with wallet gate (shows "Connect Wallet to Bet" when disconnected)
3. Compact market view toggle (grid ↔ compact list with CompactMarketRow)
4. Portfolio always shows demo data (POSITIONS + RESOLVED seeded data)
5. Leaderboard always renders LEADERBOARD array data
6. Activity page always shows 50 seeded activity items
7. Share buttons on market detail (copy link + Tweet with 💀 message)
8. Footer links functional (Resolution Authority, Risk Disclosure, Terms, API)
9. Full mobile CSS (980/768/600px breakpoints)
10. Search dropdown (max-height 320px, outside click closes, Enter navigates)
11. Toast types: wallet (indigo), error (red), connected (green), bet placed (default)
12. Quick bet wallet gate propagates from App level
13. Activity ticker loops seamlessly
14. Payout calculator always visible regardless of wallet state

### Round 2 — Commission Model
- **2% fee on gross winnings only** (Polymarket model)
- Bet ticket shows: Gross payout → Platform fee (2%) in red → Net payout in green (bold)
- Note: "2% fee applied to winning payouts only"
- Resolved positions table shows fee deducted

### Round 3 — Social Layer + P2P Side Bets
- **User profiles** (/profile/:username) — stats, follow button, positions/activity tabs
- **Following feed** — new nav tab, shows bets from users you follow
- **Market comments** — seeded with realistic trader commentary per market
- **Follow buttons** on leaderboard and activity feed
- **P2P Challenge system:**
  - "Challenge a Trader" card on every market detail page
  - /challenges page with Open + My Challenges tabs
  - VS card design (challenger vs opponent, DEAD/ALIVE sides, stake)
  - 8 pre-seeded open challenges from leaderboard users
  - Winner takes pot minus 2% platform fee
- **Nav updated:** Following + Challenges tabs added, red badge "2" on Challenges

### Round 4 — Revenue-Optimized Gamification (8 features)
1. **Streak system + loss recovery prompts** — 🔥 streak counter in toasts, recovery market suggestions after losses, streak stat card on portfolio
2. **Dark Horse / Movers tabs** — tab strip on markets page: All | 🔥 Trending | ⚡ Movers | ⏰ Closing Soon | 💀 High Risk
3. **Countdown urgency** — amber "⚡ Xd left" (<90d), red pulsing "🔴 Xd left" (<30d), red urgency banner, "CLOSING" badge on cards
4. **Calibration score** — Brier-style accuracy score on leaderboard + profiles, color-coded, 🎯 badge for top trader
5. **Category reputation badges** — 🏆 Expert / ⭐ Specialist / 📊 Analyst based on win rate per category
6. **AI vs. Crowd divergence signal** — "🤖 AI Model Assessment" card on market detail, STRONG DEAD/LEAN DEAD/LEAN ALIVE/STRONG ALIVE, divergence indicator with ±6pp noise
7. **Shareable bet cards** — dark card with skull logo, bet details, net payout, Twitter/copy buttons. Share icon on every market card
8. **Tournament page** (/tournaments) — hero featured tournament, entry fees, rebuy mechanic, past results, upcoming tournaments. "NEW" badge in nav

### Round 5 — Infrastructure Features (7 features, just completed)
All verified and working:
1. **Multi-sig resolution UI** — expandable "How resolution works" on market detail (4-step flow, 2-of-3 signatures). Admin vote modal shows "vote 1 of 3 required"
2. **Notification centre** — bell icon in TopNav, red badge "3", dropdown with 6 seeded notifications, mark all read, notification settings toggle panel
3. **Live Intelligence feed** — Grok/X-branded per-market news feed with deliberately conflicting signals (bearish + bullish mixed to create uncertainty, not help people win). "Connect to live feed" placeholder button
4. **Onboarding flow** — 3-step first-visit modal (localStorage-gated): Welcome → How it works → Paper trading CTA
5. **Paper trading mode** — PAPER pill toggle in TopNav, amber banner, $10K virtual balance (localStorage), amber-styled bet confirmation, portfolio shows paper positions
6. **Risk disclosure** — collapsible banner in bet ticket + full /risk-disclosure page with 5 sections + acknowledgment state
7. **Death Watch** — sidebar widget with rotating ambiguous signals (refreshes every 30s), full /death-watch page with 20 signals. Deliberately ambiguous — analysts split, conflicting data — creates FOMO without giving clear direction

### Round 5b — Sticky Column Fix (just submitted, in progress)
**The bug:** On market detail page, right column (bet ticket + challenge + related markets) doesn't scroll/stick correctly when left column is long.
**The fix being applied:**
- Right column wrapper: `position: sticky; top: 80px; max-height: calc(100vh - 80px); overflow-y: auto`
- Remove `position: sticky` from BetTicket card (was fighting the column)
- Custom thin scrollbar on right column
- Mobile: remove sticky, flows naturally

---

## CURRENT NAV STRUCTURE

Markets | Portfolio | Leaderboard | Following | Challenges *(red badge 2)* | Tournaments *(NEW badge)* | Activity

---

## REVENUE MODEL

**Primary:** 2% fee on gross winning payouts at resolution
- Formula: netPayout = grossPayout × 0.98
- Platform fee = grossPayout × 0.02
- Losers pay nothing; fee only on winning side

**Philosophy:** Platform makes money on VOLUME (more bets = more resolved payouts = more fees). Features should drive urgency, FOMO, re-engagement, and repeat betting — not make winning too easy.

**Removed intentionally:**
- Copy trading (makes winning too easy, reduces active decision-making and volume)
- Creator economy / paid predictions (fragments attention, reduces platform engagement)

---

## BUGS ON NICK'S LIVE VERSION (needs his fix)

### Critical (blocking real money flow):
1. **Wallet signing broken** — `MetaMask RPC Error: Cannot read properties of null (reading 'length')`. The nonce fetch isn't awaited before `personal_sign` fires. Fix: `const message = await getNonce(address)` must resolve before `ethereum.request({ method: 'personal_sign', params: [message, address] })`.
2. **Buy button missing** — Bet ticket has side buttons + amount input but no confirm/buy button. Needs to be added.
3. **Market ID routing** — `/markets/0`, `/markets/1` etc. stuck on "Loading…". Only DB-matched IDs like `/markets/92` work. Frontend uses array index IDs, DB has different IDs.

### Secondary:
4. Footer links all dead (no href)
5. Grid/Compact toggle does nothing
6. No wallet-connection feedback on quick bet buttons
7. Portfolio wallet-gated (shows empty instead of demo data)
8. Leaderboard and Activity both empty (no real bets placed yet)

---

## PARKED — Come Back To Later

| Item | Notes |
|---|---|
| KYC / identity verification | Not until closer to launch |
| Deposit / withdrawal flow | After smart contracts deployed |
| Liquidity / market maker / AMM | Later |
| Smart contract deployment | Nick's domain |
| Referral / affiliate tracking | Phase 2 |
| Public API | Phase 2 |
| User-created market proposals | Phase 2 |
| Email / SMS notifications | Good idea, build when ready |
| Grok/X live integration | Placeholder exists in design. Real implementation: Grok API → query 48h of X sentiment per company → prompt for conflicting signals (no clear verdict) → update every 15 min. ~11,500 API calls/day, fractions of a cent each. |
| Mobile native app | Phase 2 |

---

## NEXT THINGS TO BUILD (when ready)

Priority order:
1. Confirm sticky column fix looks right in design preview
2. Referral program ("Invite a friend, get $10 bet credits when they deposit")
3. Odds/price alert system (notify when market crosses X%)
4. Watchlist (star markets, see them in a tab)
5. Resolution history public page (builds trust, shows past payouts)
6. Market countdown urgency (already in design, verify it's working)
7. Community market proposals (users suggest companies, community votes)

---

## HOW TO INTERACT WITH CLAUDE DESIGN

The design tool is at the URL above. To add features or fixes:
1. Use the Chrome MCP browser tools to navigate to the Claude Design URL
2. Find the textarea with placeholder "Describe what you want to create..."
3. Use JavaScript to fill it: `Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(textarea, msg); textarea.dispatchEvent(new Event('input', {bubbles:true}))`
4. Find the Send button: `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Send' && b.type === 'submit').click()`
5. Monitor progress by polling `document.body.innerText.slice(-500)` every 30s
6. It's done when you see "Send" button re-appear and no more "Writing/Editing/Creating" status

---

## DATA ARCHITECTURE (for reference)

All market data is seeded deterministically using `mulberry32()` PRNG so refreshes look identical.

Key global arrays (all in `data.jsx`, exposed via `Object.assign(window, {...})`):
- `MARKETS` — 120 markets with id, name, category, death %, survives %, series (60-point odds history), volume, traders, daysLeft, logo
- `POSITIONS` — 9 seeded open portfolio positions
- `RESOLVED` — 6 seeded resolved positions
- `PORTFOLIO_EQUITY` — 90-day equity curve data points
- `LEADERBOARD` — 20 traders with username, profit, winRate, trades, calibration, category badge
- `TICKER` — 28 activity items for the scrolling ticker
- `CHALLENGES` — 8 pre-seeded open P2P challenges
- `NOTIFICATIONS` — 6 seeded notification items

---

## TECHNICAL CONTEXT

- Everything runs in a single `index.html` with `<script type="text/babel">` blocks
- React 18 + Babel loaded from unpkg CDN (no build step)
- Chart.js for price charts and volume bars
- No backend in the design prototype — all data is seeded/deterministic
- localStorage keys used: `doa_visited` (onboarding shown), `doa_paper_balance` (paper trading balance), `doa_paper_mode` (paper mode toggle state)
- Routes are handled by React state (`route.name` + `route.id`), not the browser URL — it's a single-page app with no router library

---

*Last updated: 2026-06-05 | Prepared by Claude Code for session continuity*
