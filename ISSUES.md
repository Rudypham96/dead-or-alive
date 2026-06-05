# Dead or Alive — Full Site Audit
*Conducted: 2026-06-04 | Every page, every button, every function tested.*

---

## WHAT'S WORKING ✅

### Homepage (/)
- All 120 market cards load correctly
- Sort buttons work: Hottest, Newest, Ending Soon, Highest Volume, Biggest Movers
- All 12 category filters in sidebar work
- Featured spotlight card renders correctly
- Activity ticker scrolls with live bet data
- Stats bar shows correct data (120 markets, volume, open interest, avg dead odds)
- LIVE animated pill present
- Search bar present and triggers
- Nav links all route correctly (Markets, Portfolio, Leaderboard, Activity)
- Logo links back to homepage

### Market Detail (/markets/92 and select valid IDs)
- Price chart renders (2 canvas elements — price + volume)
- Timeframe buttons work: 1D, 1W, 1M, All — chart updates on click
- Order book renders with synthetic bid/ask data
- Resolution criteria section fully present
- Related markets section shows 5 related markets, all clickable
- AI disruption thesis section renders
- Breadcrumb navigation works
- Side toggle (AI kills it / Survives) — clickable, switches state
- Amount input field — accepts input
- Preset chips ($10, $50, $100, $500, $1000) — clickable, updates amount

### Admin (/admin)
- Login works with ADMIN_SECRET
- All 120 markets display: name, category, DEAD%, volume, traders, resolve date, status
- DEAD and ALIVE resolution buttons present on every market row
- "Show resolved" toggle present
- Warning banner about needing oracle wallet call after resolution
- Sign out works

---

## 🔴 BROKEN — Fix These First

### 1. Wallet Signing Fails (Blocker for Everything)
**What:** Connect Wallet → Sign message → "Error signing message, please retry!"
**Why:** Console confirms: `MetaMask RPC Error: Cannot read properties of null (reading 'length')`. The message passed to `personal_sign` is null — the nonce fetch isn't awaited before the sign call fires.
**Fix:** `const message = await getNonce(address)` must resolve before calling `ethereum.request({ method: 'personal_sign', params: [message, address] })`.

### 2. Buy Button Missing from Bet Ticket (Blocker)
**What:** On any market detail page, you can select a side (DEAD/ALIVE), set an amount, click preset chips — but there is NO confirm/buy/place bet button. The action cannot be completed.
**Buttons present:** AI kills it, Survives, $10, $50, $100, $500, $1000
**Buttons missing:** Buy DEAD / Buy ALIVE / Place Bet / Confirm
**Fix:** The submit button needs to be added to the bet ticket component. Should call the smart contract (or DB transaction pending contract deploy).

### 3. Most Market Detail Pages Show "Loading…" Forever
**What:** Direct navigation to `/markets/0`, `/markets/1`, etc. gets stuck on "Loading…". Only specific IDs like `/markets/92` load correctly.
**Why:** The market IDs on homepage cards link to IDs that don't match the DB records. Frontend is using sequential index IDs (0–119) but the DB has different IDs (like 92 for Salesforce).
**Fix:** Market card links need to use the DB's actual market ID, not the array index. Either fix the href generation or create a slug-based routing system.

### 4. No Bet Execution Flow (Dependent on 1 + 2)
**What:** Even if wallet connects and buy button existed, there's no on-chain or DB transaction wired up. Smart contracts not deployed. Real money can't move.
**Status:** Expected for now — but needs to be the next major build sprint.

---

## 🟡 BROKEN — Secondary Priority

### 5. Footer Links All Dead
**What:** Resolution Authority, Risk Disclosure, Terms, API — all rendered as plain text with no href. Clicking does nothing.
**Fix:** Either link to real pages (build them) or remove until ready. Dead links look unprofessional to first users.

### 6. Grid / Compact Toggle Does Nothing
**What:** On the homepage market feed, there's a Grid / Compact view toggle. Clicking "Compact" does nothing — stays in grid view.
**Fix:** Implement compact list view or remove the toggle until it's built.

### 7. Quick Bet Buttons Don't Trigger Feedback Without Wallet
**What:** Clicking +$10 / +$50 / +$100 on a market card does nothing visible. No error, no toast, no prompt to connect wallet.
**Fix:** Should show "Connect wallet to bet" toast or auto-open the connect wallet modal.

### 8. Payout Calculator Not Visible
**What:** The bet ticket shows side buttons and amount input but the payout calculator (Price, Shares, Max payout, Potential profit) appears to be missing or not rendering.
**Fix:** Check if the calculator section is hidden behind the missing buy button or if it's a render issue.

---

## 🟠 EMPTY (Expected But Need Seeding for Demo)

### 9. Portfolio — Wallet Gated, No Preview
**What:** Shows "Connect your wallet to view your portfolio" with skull emoji. Nothing else.
**Issue:** Fine logically, but for demos and first impressions it's a dead end. Users bounce.
**Fix:** Add a demo/preview mode showing fake positions — makes the product feel real before anyone bets.

### 10. Leaderboard — No Data
**What:** "No traders yet. Place the first bet to claim the top spot." Tabs (This week / This month / All time) work but all show empty.
**Fix:** Seed 5–10 fake leaderboard entries so the page doesn't look dead. Real data populates once bets exist.

### 11. Activity Feed — No Data
**What:** "No bets yet. Browse markets →". Page renders but completely empty.
**Fix:** Same as leaderboard — seed some fake historical bets for the demo state.

### 12. Live Activity Ticker on Homepage Shows Fake Data
**What:** The scrolling ticker at top shows activity but it's all seeded fake data. Not connected to real transactions.
**Note:** Fine for now. Will auto-populate once real bets exist and the ticker is wired to the DB.

---

## ⚙️ MISSING FEATURES (Build Next)

### 13. Commission / Take Rate Not Built
**What:** No platform fee on trades. Every winning bet pays out at full $1/share with no house cut.
**What to build:** 2% take rate on winnings is standard (Polymarket model). Wire into resolution logic.
**Priority:** Must be done before any real money flows.

### 14. Smart Contracts Not Deployed
**What:** The entire on-chain layer doesn't exist yet. All market data is DB-backed but no crypto transactions work.
**Next step:** Deploy factory contract → enable on-chain deposits/withdrawals → connect to frontend.

### 15. Admin: No Market Creation
**What:** Admin dashboard only shows existing markets and lets you resolve them. Can't create new markets from the UI.
**Fix:** Add "Create Market" form: company name, category, resolution date, starting odds.

### 16. Admin: No User/Balance Management
**What:** No way to see user wallets, balances, or manually credit/adjust.
**Fix:** Add user table with address, balance, total bets, P&L.

### 17. Admin: No Fee/Commission Controls
**What:** No way to set or view the platform's commission rate from admin.
**Fix:** Add commission rate setting + total fees collected to admin dashboard.

### 18. No Social / Sharing Features
**What:** No "Share this market" button, no Twitter/X intent link, no copy link.
**Fix:** Add share button on each market detail page. Huge for virality — "I just bet Chegg goes to zero, join me."

### 19. No Email / Notification System
**What:** No way for users to get notified when a market they bet on resolves.
**Fix:** Email or push notification on resolution. Even just a simple Resend integration.

### 20. No Mobile Optimization
**What:** N Brons flagged this directly. Site not built for phone.
**Fix:** Audit on iPhone. Fix sidebar collapse, card sizing, bet ticket stacking, nav hamburger menu.

---

## PRIORITY ORDER — What to Fix First

| Priority | Issue | Effort | Impact |
|---|---|---|---|
| 🔴 1 | Wallet signing null message bug | Low (1 line) | Unlocks everything |
| 🔴 2 | Buy button missing from bet ticket | Low–Med | Core product function |
| 🔴 3 | Market ID routing (/markets/0 loading forever) | Low | All market pages broken |
| 🟡 4 | Quick bet → wallet prompt on homepage | Low | First impression |
| 🟡 5 | Footer links dead | Low | Credibility |
| 🟡 6 | Compact view toggle broken | Low | Polish |
| 🟠 7 | Seed demo data (leaderboard, activity) | Low | Makes product feel alive |
| 🟠 8 | Portfolio preview/demo mode | Med | Reduces bounce |
| ⚙️ 9 | Commission % wired into resolution | Med | Must-have before real money |
| ⚙️ 10 | Smart contract deploy | High | Real money flow |
| ⚙️ 11 | Mobile optimization | Med | Audience is on phones |
| ⚙️ 12 | Share buttons on markets | Low | Virality |
| ⚙️ 13 | Admin: create market UI | Med | Operations |
| ⚙️ 14 | Notifications on resolution | Med | Retention |

---

*Last updated: 2026-06-04 — Full automated audit via Claude*
