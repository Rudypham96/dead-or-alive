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
