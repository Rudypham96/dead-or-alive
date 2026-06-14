// window.API — thin client for the Dead or Alive backend.
// Plain JS (loaded before the Babel/JSX bundle) so the app shell can bootstrap
// session + live market state before React mounts.

(function () {
  const base = "";
  const j = async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.status + " " + res.statusText);
    return data;
  };
  const get = (path) => fetch(base + path, { credentials: "include" }).then(j);
  const post = (path, body, headers) =>
    fetch(base + path, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", ...(headers || {}) },
      body: JSON.stringify(body || {}),
    }).then(j);

  window.API = {
    // session
    me: () => get("/api/me"),
    devLogin: (username) => post("/api/auth/dev", { username }),
    logout: () => post("/api/auth/logout"),
    // wallet auth (SIWE)
    walletNonce: (address) => get("/api/auth/nonce?address=" + encodeURIComponent(address)),
    walletVerify: (address, signature) => post("/api/auth/verify", { address, signature }),
    // markets
    markets: () => get("/api/markets"),
    market: (id) => get("/api/markets/" + id),
    // betting
    placeBet: (marketId, side, amount, paper) => post("/api/bets", { marketId, side, amount, paper: !!paper }),
    closeBet: (betId) => post("/api/bets/" + betId + "/close"),
    portfolio: () => get("/api/portfolio"),
    // limit orders
    myOrders: () => get("/api/orders"),
    placeOrder: (marketId, side, limitPrice, stake) => post("/api/orders", { marketId, side, limitPrice, stake }),
    cancelOrder: (id) =>
      fetch(base + "/api/orders/" + id, { method: "DELETE", credentials: "include" }).then(j),
    // resolution history (public)
    resolutions: () => get("/api/resolutions"),
    // social / feeds
    leaderboard: () => get("/api/leaderboard"),
    activity: () => get("/api/activity"),
    comments: (id) => get("/api/markets/" + id + "/comments"),
    postComment: (id, text) => post("/api/markets/" + id + "/comments", { text }),
    challenges: () => get("/api/challenges"),
    myChallenges: () => get("/api/challenges/mine"),
    createChallenge: (marketId, side, stake) => post("/api/challenges", { marketId, side, stake }),
    acceptChallenge: (id) => post("/api/challenges/" + id + "/accept"),
    orderbook: (id) => get("/api/markets/" + id + "/orderbook"),
    // admin
    adminResolve: (marketId, outcome, adminSecret, reason, sourceUrl) =>
      post("/api/admin/resolve", { marketId, outcome, reason, sourceUrl }, { "x-admin-secret": adminSecret }),
    adminCreateMarket: (payload, adminSecret) =>
      post("/api/admin/markets", payload, { "x-admin-secret": adminSecret }),
    adminStats: (adminSecret) =>
      fetch("/api/admin/stats", { credentials: "include", headers: { "x-admin-secret": adminSecret } }).then(j),
    adminLogin: (adminSecret) => post("/api/admin/login", { adminSecret }),
  };

  // Bootstrap: fetch live market state + current session before React mounts.
  // Stored on window.__BOOTSTRAP; app.jsx reads it on first render.
  window.__bootReady = (async () => {
    const boot = { markets: null, me: null };
    try {
      const m = await get("/api/markets");
      boot.markets = m.markets;
    } catch (e) {
      console.warn("bootstrap markets failed (using seeded fallback):", e.message);
    }
    try {
      const me = await get("/api/me");
      boot.me = me.user;
    } catch (e) {
      /* anonymous */
    }
    window.__BOOTSTRAP = boot;
    return boot;
  })();
})();
