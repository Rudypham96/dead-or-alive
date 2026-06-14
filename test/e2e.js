// End-to-end test of the full stack against a throwaway DB.
// Boots the real server on a random DB + port, then drives the API the way the
// frontend does: wallet auth, dev login, bet, portfolio, resolve, payout, fee,
// leaderboard, activity, challenges, and every guard. Run: npm test
//
// Exits non-zero on the first failed assertion.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { ethers } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3100 + Math.floor(Math.random() * 800);
const DB = path.join(os.tmpdir(), "doa-test-" + crypto.randomBytes(4).toString("hex") + ".sqlite");
const BASE = `http://localhost:${PORT}`;
const ADMIN = "73392d7280957074bb7e653c5f06d0f83417d6631e0db49d7ffca45bd0917fb3";

let pass = 0, fail = 0;
const approx = (a, b, eps = 0.02) => Math.abs(a - b) <= eps;
function check(name, cond, detail) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "  → " + detail : "")); }
}

// minimal cookie jar
let cookie = "";
async function api(method, pathname, body, headers = {}) {
  const res = await fetch(BASE + pathname, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setC = res.headers.get("set-cookie");
  if (setC) cookie = setC.split(";")[0];
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { status: res.status, data };
}

function waitForServer(proc) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("server did not start in time")), 15000);
    const poll = async () => {
      try {
        const r = await fetch(BASE + "/api/health");
        if (r.ok) { clearTimeout(timeout); resolve(); return; }
      } catch (e) {}
      setTimeout(poll, 200);
    };
    proc.on("exit", (code) => { clearTimeout(timeout); reject(new Error("server exited early code " + code)); });
    poll();
  });
}

const server = spawn(process.execPath, [path.join(__dirname, "..", "server", "index.js")], {
  env: { ...process.env, PORT: String(PORT), DOA_DB: DB, DOA_ALLOW_DEV_LOGIN: "1", DOA_FAUCET: "1000", NODE_ENV: "test" },
  stdio: ["ignore", "ignore", "inherit"],
});

try {
  await waitForServer(server);
  console.log("\nDead or Alive — end-to-end test\n");

  // --- markets ---
  let r = await api("GET", "/api/markets");
  check("GET /api/markets returns 120 markets", r.data.count === 120, "got " + r.data?.count);
  check("market has expected shape", r.data.markets[0].name && typeof r.data.markets[0].death === "number");

  // --- wallet auth (the bug Nick fought) ---
  const wallet = ethers.Wallet.createRandom();
  const addr = wallet.address;
  r = await api("GET", "/api/auth/nonce?address=" + addr);
  check("nonce + message issued", !!r.data.nonce && !!r.data.message);
  const sig = await wallet.signMessage(r.data.message);
  r = await api("POST", "/api/auth/verify", { address: addr, signature: sig });
  check("wallet verify succeeds with real signature", r.status === 200 && r.data.user, JSON.stringify(r.data));
  check("new wallet user gets $1000 faucet", r.data.user && r.data.user.balance === 1000, "balance " + r.data.user?.balance);

  // replay must fail (nonce burned)
  r = await api("POST", "/api/auth/verify", { address: addr, signature: sig });
  check("signature replay rejected", r.status === 400);

  // bad signature must fail
  let n2 = await api("GET", "/api/auth/nonce?address=" + addr);
  r = await api("POST", "/api/auth/verify", { address: addr, signature: sig }); // sig is for old nonce
  check("stale/mismatched signature rejected", r.status === 400);

  // --- dev login (fresh jar) ---
  cookie = "";
  r = await api("POST", "/api/auth/dev", { username: "tester" });
  check("dev login succeeds", r.status === 200 && r.data.user.balance === 1000);

  // --- place a bet ---
  r = await api("POST", "/api/bets", { marketId: 0, side: "DEAD", amount: 200 });
  check("place $200 DEAD bet on market 0", r.status === 200, JSON.stringify(r.data));
  const bet = r.data.bet;
  const entryPrice = bet.price;
  const expectedShares = 200 / entryPrice;
  check("shares = stake / price", approx(bet.shares, expectedShares, 0.1), `${bet.shares} vs ${expectedShares}`);
  check("balance debited to 800", r.data.balance === 800, "balance " + r.data.balance);

  // betting more than balance must fail
  r = await api("POST", "/api/bets", { marketId: 1, side: "DEAD", amount: 5000 });
  check("over-balance bet rejected", r.status === 400);

  // --- portfolio reflects the open position ---
  r = await api("GET", "/api/portfolio");
  check("portfolio shows 1 open position", r.data.open.length === 1 && r.data.open[0].market === "Chegg");

  // --- admin guards ---
  r = await api("POST", "/api/admin/resolve", { marketId: 0, outcome: "DEAD" }); // no secret
  check("resolve without admin secret rejected", r.status === 401);
  r = await api("POST", "/api/admin/resolve", { marketId: 0, outcome: "MAYBE" }, { "x-admin-secret": ADMIN });
  check("invalid outcome rejected", r.status === 400);

  // --- resolve DEAD, check payout + 2% fee ---
  r = await api("POST", "/api/admin/resolve", { marketId: 0, outcome: "DEAD" }, { "x-admin-secret": ADMIN });
  check("resolve succeeds", r.status === 200 && r.data.resolved.winners === 1, JSON.stringify(r.data));
  const settle = r.data.resolved;
  const expectedGross = expectedShares; // $1/share
  const expectedFee = expectedGross * 0.02;
  check("gross payout = winning shares", approx(settle.totalGrossPayout, expectedGross, 0.1));
  check("fee is 2% of gross", approx(settle.totalFeesCollected, expectedFee, 0.05), `${settle.totalFeesCollected} vs ${expectedFee}`);

  // balance credited net
  r = await api("GET", "/api/me");
  const expectedBalance = 800 + (expectedGross - expectedFee);
  check("balance credited net payout", approx(r.data.user.balance, expectedBalance, 0.1), `${r.data.user.balance} vs ${expectedBalance}`);

  // double resolve blocked
  r = await api("POST", "/api/admin/resolve", { marketId: 0, outcome: "ALIVE" }, { "x-admin-secret": ADMIN });
  check("double resolve blocked", r.status === 400);

  // bet on resolved market blocked
  r = await api("POST", "/api/bets", { marketId: 0, side: "DEAD", amount: 10 });
  check("bet on resolved market blocked", r.status === 400);

  // --- portfolio now shows resolved WON ---
  r = await api("GET", "/api/portfolio");
  check("position moved to resolved/WON", r.data.open.length === 0 && r.data.resolved[0]?.outcome === "WON");

  // --- leaderboard + activity reflect real bets ---
  r = await api("GET", "/api/leaderboard");
  check("leaderboard has the winning trader", r.data.leaderboard.length >= 1 && r.data.leaderboard[0].profit > 0);
  r = await api("GET", "/api/activity");
  check("activity feed shows the bet", r.data.events.length >= 1 && r.data.events[0].market === "Chegg");

  // --- challenges (escrow + accept) ---
  r = await api("POST", "/api/challenges", { marketId: 5, side: "DEAD", stake: 50 });
  check("create challenge escrows stake", r.status === 200, JSON.stringify(r.data));
  const chId = r.data.challenge.id;
  // second user accepts
  cookie = "";
  await api("POST", "/api/auth/dev", { username: "opponent" });
  r = await api("POST", "/api/challenges/" + chId + "/accept");
  check("opponent accepts challenge", r.status === 200 && r.data.challenge.status === "active");

  // --- comments ---
  r = await api("POST", "/api/markets/5/comments", { text: "AI ate this one." });
  check("post comment", r.status === 200 && r.data.comment.text === "AI ate this one.");
  r = await api("GET", "/api/markets/5/comments");
  check("comment persisted + readable", r.data.comments.some((c) => c.text === "AI ate this one."));

  // ===================== SELL / EXIT POSITIONS =====================
  cookie = "";
  await api("POST", "/api/auth/dev", { username: "exiter" });
  r = await api("POST", "/api/bets", { marketId: 1, side: "DEAD", amount: 100 });
  const exBet = r.data.bet;
  r = await api("POST", "/api/bets/" + exBet.id + "/close", {});
  check("close position succeeds", r.status === 200, JSON.stringify(r.data));
  const cl = r.data.closed;
  check("close fee is 2% of proceeds", approx(cl.fee, cl.grossProceeds * 0.02, 0.02), `${cl.fee} vs ${cl.grossProceeds * 0.02}`);
  check("close net = gross - fee", approx(cl.netProceeds, cl.grossProceeds - cl.fee, 0.02));
  r = await api("GET", "/api/me");
  check("balance credited net proceeds", approx(r.data.user.balance, 900 + cl.netProceeds, 0.05), `${r.data.user.balance} vs ${900 + cl.netProceeds}`);
  r = await api("GET", "/api/portfolio");
  check("portfolio shows CLOSED position", r.data.resolved.some((x) => x.outcome === "CLOSED"));
  r = await api("POST", "/api/bets/" + exBet.id + "/close", {});
  check("double close rejected", r.status === 400);

  // ===================== ADMIN MARKET CREATION =====================
  r = await api("POST", "/api/admin/markets", { name: "TestCo", category: "Education", death: 0.5, daysLeft: 100 });
  check("create market without admin secret rejected", r.status === 401);
  r = await api("POST", "/api/admin/markets", { name: "TestCo", category: "Education", death: 0.5, daysLeft: 100 }, { "x-admin-secret": ADMIN });
  check("admin creates market", r.status === 200 && r.data.market.name === "TestCo", JSON.stringify(r.data));
  const newId = r.data.market.id;
  check("new market has a 60-point series", r.data.market.series.length === 60);
  r = await api("GET", "/api/markets");
  check("market count is now 121", r.data.count === 121, "got " + r.data.count);
  r = await api("POST", "/api/admin/markets", { name: "TestCo", category: "Education", death: 0.5, daysLeft: 100 }, { "x-admin-secret": ADMIN });
  check("duplicate open market rejected", r.status === 400);
  r = await api("POST", "/api/bets", { marketId: newId, side: "DEAD", amount: 50 });
  check("can bet on the new market", r.status === 200);

  // ===================== RESOLUTION HISTORY + SOURCES =====================
  r = await api("POST", "/api/admin/resolve",
    { marketId: newId, outcome: "DEAD", reason: "TestCo filed for bankruptcy.", sourceUrl: "https://example.com/testco" },
    { "x-admin-secret": ADMIN });
  check("resolve with reason + source succeeds", r.status === 200);
  r = await api("GET", "/api/resolutions");
  const hist = r.data.resolutions.find((x) => x.id === newId);
  check("history records reason + source", !!hist && hist.reason === "TestCo filed for bankruptcy." && hist.sourceUrl === "https://example.com/testco");
  check("history records payout totals", !!hist && hist.winners === 1 && hist.totalPaid > 0, JSON.stringify(hist));
  r = await api("GET", "/api/markets/" + newId);
  check("market API exposes resolution reason", r.data.market.resolutionReason === "TestCo filed for bankruptcy.");

  // ===================== LIMIT ORDERS =====================
  // Market 26 (Corbis) is thin (liquidity floor), so a whale bet moves the line
  // enough to trigger a resting order.
  cookie = "";
  await api("POST", "/api/auth/dev", { username: "limitguy" });
  let mkt = (await api("GET", "/api/markets/26")).data.market;
  const restLimit = Math.round((mkt.death - 0.01) * 1000) / 1000;
  r = await api("POST", "/api/orders", { marketId: 26, side: "DEAD", limitPrice: restLimit, stake: 60 });
  check("limit below market rests open", r.data.order && r.data.order.status === "open", JSON.stringify(r.data));
  check("stake escrowed on placement", approx(r.data.balance, 940, 0.02), "balance " + r.data.balance);
  const restId = r.data.order.id;

  // whale pushes the line down through the limit
  cookie = "";
  await api("POST", "/api/auth/dev", { username: "whale2" });
  await api("POST", "/api/bets", { marketId: 26, side: "ALIVE", amount: 800 });

  cookie = "";
  await api("POST", "/api/auth/dev", { username: "limitguy" });
  r = await api("GET", "/api/orders");
  const rest = r.data.orders.find((o) => o.id === restId);
  check("resting order filled after price crossed limit", !!rest && rest.status === "filled" && !!rest.betId, JSON.stringify(rest));
  r = await api("GET", "/api/portfolio");
  check("filled order created a real position", r.data.open.some((p) => p.marketId === 26 && p.side === "DEAD"));

  // marketable limit fills immediately
  r = await api("POST", "/api/orders", { marketId: 26, side: "DEAD", limitPrice: 0.95, stake: 20 });
  check("marketable limit fills immediately", r.data.order && r.data.order.status === "filled");

  // cancel refunds escrow
  r = await api("POST", "/api/orders", { marketId: 26, side: "DEAD", limitPrice: 0.05, stake: 30 });
  const cancelId = r.data.order.id;
  const balBeforeCancel = r.data.balance;
  r = await api("DELETE", "/api/orders/" + cancelId);
  check("cancel refunds escrow", r.status === 200 && approx(r.data.balance, balBeforeCancel + 30, 0.02), JSON.stringify(r.data));

  // resolution refunds any open orders
  r = await api("POST", "/api/orders", { marketId: 26, side: "DEAD", limitPrice: 0.05, stake: 25 });
  const balBeforeResolve = r.data.balance;
  r = await api("POST", "/api/admin/resolve", { marketId: 26, outcome: "DEAD" }, { "x-admin-secret": ADMIN });
  check("resolution refunds open orders", r.status === 200 && r.data.resolved.ordersRefunded >= 1, JSON.stringify(r.data.resolved));
  r = await api("GET", "/api/me");
  check("escrow + winnings credited after resolution", r.data.user.balance >= balBeforeResolve + 25, "balance " + r.data.user.balance);

  // ===================== ORDER BOOK =====================
  cookie = "";
  await api("POST", "/api/auth/dev", { username: "booker" });
  let bk = (await api("GET", "/api/markets/30/orderbook")).data;
  check("order book endpoint returns sides", Array.isArray(bk.dead) && Array.isArray(bk.alive));
  const bkStart = bk.dead.length;
  // rest a DEAD limit below market so it sits in the book
  let bkMkt = (await api("GET", "/api/markets/30")).data.market;
  const bkLimit = Math.round((bkMkt.death - 0.03) * 100) / 100;
  await api("POST", "/api/orders", { marketId: 30, side: "DEAD", limitPrice: bkLimit, stake: 45 });
  bk = (await api("GET", "/api/markets/30/orderbook")).data;
  check("resting order appears in the book", bk.dead.length === bkStart + 1, JSON.stringify(bk.dead));
  check("book level has stake + shares", bk.dead.length > 0 && bk.dead[0].stake > 0 && bk.dead[0].shares > 0);

  // ===================== MY CHALLENGES =====================
  cookie = "";
  await api("POST", "/api/auth/dev", { username: "duelistA" });
  r = await api("POST", "/api/challenges", { marketId: 40, side: "DEAD", stake: 60 });
  const myChId = r.data.challenge.id;
  r = await api("GET", "/api/challenges/mine");
  check("my-challenges lists challenges I created", r.data.challenges.some((c) => c.id === myChId && c.yourSide === "DEAD"));
  // opponent accepts, then both see it active
  cookie = "";
  await api("POST", "/api/auth/dev", { username: "duelistB" });
  await api("POST", "/api/challenges/" + myChId + "/accept");
  r = await api("GET", "/api/challenges/mine");
  check("opponent sees accepted challenge as active", r.data.challenges.some((c) => c.id === myChId && c.status === "active" && c.opponent === "duelistA"));

  // ===================== REAL-TIME STREAM (SSE) =====================
  {
    const ac = new AbortController();
    const got = [];
    const streamP = (async () => {
      const sr = await fetch(BASE + "/api/stream?market=50", { signal: ac.signal, headers: { accept: "text/event-stream" } });
      const reader = sr.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
          const ev = {}; chunk.split("\n").forEach((l) => { if (l.startsWith("event:")) ev.event = l.slice(6).trim(); });
          if (ev.event) got.push(ev.event);
        }
      }
    })().catch(() => {});
    await new Promise((r) => setTimeout(r, 400));
    cookie = "";
    await api("POST", "/api/auth/dev", { username: "streamer" });
    await api("POST", "/api/bets", { marketId: 50, side: "DEAD", amount: 600 });
    await new Promise((r) => setTimeout(r, 600));
    ac.abort();
    await streamP;
    check("SSE emits presence on connect", got.includes("presence"));
    check("SSE streams a bet event", got.includes("bet"));
    check("SSE streams a price update", got.includes("price"));
  }

  console.log(`\n${fail === 0 ? "ALL PASSED" : "FAILED"} — ${pass} passed, ${fail} failed\n`);
} catch (e) {
  console.error("\nTest harness error:", e.message);
  fail++;
} finally {
  server.kill();
  // tiny delay so the kill lands before exit
  await new Promise((r) => setTimeout(r, 200));
  process.exit(fail === 0 ? 0 : 1);
}
