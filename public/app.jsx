// ---- App: routing + state ----
function App() {
  const __boot = (typeof window !== "undefined" && window.__BOOTSTRAP) || {};
  const [route, setRoute] = useState({ name: "markets" });
  const [balance, setBalance] = useState(__boot.me ? __boot.me.balance : 0);
  const [toast, setToast] = useState(null);
  // walletConnected == "an authenticated session exists" (wallet OR dev login)
  const [walletConnected, setWalletConnected] = useState(!!__boot.me);
  const [walletAddress, setWalletAddress] = useState(
    __boot.me ? (__boot.me.address || "@" + __boot.me.username) : ""
  );
  const [marketTick, setMarketTick] = useState(0); // re-render trigger after live market sync
  const [presence, setPresence] = useState({});    // marketId -> viewers watching now
  const [liveFeed, setLiveFeed] = useState([]);     // recent real trades streamed from the server
  const [challengesVersion, setChallengesVersion] = useState(0); // bump to refetch challenges
  const [orderbookVersion, setOrderbookVersion] = useState(0);   // bump to refetch the order book
  const [shareTarget, setShareTarget] = useState(null);          // FEATURE 7
  const [betStreak, setBetStreak] = useState(Math.max(0, currentStreak(RESOLVED))); // FEATURE 1

  // ---- FEATURE 2 notifications / 4 onboarding / 5 paper ----
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [paperMode, setPaperMode] = useState(() => { try { return localStorage.getItem("doa_paper") === "1"; } catch (e) { return false; } });
  const [paperBalance, setPaperBalance] = useState(() => { try { return +(localStorage.getItem("doa_paper_balance") || 10000); } catch (e) { return 10000; } });
  const [switchLiveModal, setSwitchLiveModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => { try { return localStorage.getItem("doa_visited") !== "1"; } catch (e) { return true; } });

  // ---- Social state ----
  const [following, setFollowing] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("doa_following") || "null");
      if (Array.isArray(saved)) return saved;
    } catch (e) {}
    return ["bayesbot", "longgamma", "skullking"];
  });
  useEffect(() => {
    try { localStorage.setItem("doa_following", JSON.stringify(following)); } catch (e) {}
  }, [following]);
  const [posted, setPosted] = useState({});          // marketId -> [comments]
  const [upvoted, setUpvoted] = useState([]);        // comment ids
  const seedCache = useRef({});                       // marketId -> seeded comments (stable)

  // ---- Challenge state ----
  const [openChallenges, setOpenChallenges] = useState(CHALLENGES);
  const [myChallenges, setMyChallenges] = useState(MY_CHALLENGES);
  const [incoming, setIncoming] = useState(INCOMING_CHALLENGES);
  const [liveOpen, setLiveOpen] = useState(null); // real open challenges (null until first fetch)
  const [liveMine, setLiveMine] = useState(null); // real challenges I'm in

  // ---- FEATURE 3a email / FEATURE 4 push bar ----
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPushBar, setShowPushBar] = useState(false);

  const maybePostBetPrompts = useCallback(() => {
    try {
      if (!localStorage.getItem("doa_push_dismissed") && !localStorage.getItem("doa_push_enabled")) {
        setShowPushBar(true);
      }
      if (!localStorage.getItem("doa_email_captured")) {
        setTimeout(() => setShowEmailModal(true), 2000);
      }
    } catch (e) {}
  }, []);

  const navigate = useCallback((r) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const showToast = useCallback((t) => {
    setToast(t);
    setTimeout(() => setToast(null), 3400);
  }, []);

  // ---- Wallet ----
  // SIWE flow. The nonce MUST resolve before personal_sign fires — signing a
  // null/pending message is the exact bug that broke the first live build.
  const handleConnectWallet = useCallback(async () => {
    try {
      if (typeof window.ethereum !== "undefined" && window.ethereum?.request) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const addr = accounts && accounts[0];
        if (!addr) { showToast({ type: "error", message: "No accounts returned from wallet." }); return; }

        const { message } = await window.API.walletNonce(addr); // <-- awaited before signing
        const signature = await window.ethereum.request({ method: "personal_sign", params: [message, addr] });
        const { user } = await window.API.walletVerify(addr, signature);

        setWalletConnected(true);
        setWalletAddress(user.address || addr);
        setBalance(user.balance);
        showToast({ type: "connected", address: addr });
      } else {
        // No injected wallet → frictionless demo login so the platform is fully
        // usable for testing. Real auth is wallet-based; this is the test path.
        let name = "guest";
        try {
          name = localStorage.getItem("doa_guest_name") || ("guest-" + Math.random().toString(36).slice(2, 6));
          localStorage.setItem("doa_guest_name", name);
        } catch (e) {}
        const { user } = await window.API.devLogin(name);
        setWalletConnected(true);
        setWalletAddress("@" + user.username);
        setBalance(user.balance);
        showToast({ type: "connected", address: user.username });
      }
    } catch (err) {
      showToast({ type: "error", message: err.message || "Wallet connection failed — please retry." });
    }
  }, [showToast]);

  // Apply a server market snapshot onto the in-memory MARKETS objects so the
  // displayed odds move right after a bet (objects are shared by reference).
  const syncMarketInPlace = useCallback((m) => {
    if (!m) return;
    const target = MARKETS.find(x => x.id === m.id);
    if (target) {
      target.death = m.death; target.survives = m.survives;
      if (m.series) target.series = m.series;
      if (m.change24h != null) target.change24h = m.change24h;
      if (m.volume != null) target.volume = m.volume;
      target.status = m.status; target.outcome = m.outcome;
      if ("resolutionReason" in m) target.resolutionReason = m.resolutionReason;
      if ("resolutionSource" in m) target.resolutionSource = m.resolutionSource;
      if ("resolvedAt" in m) target.resolvedAt = m.resolvedAt;
    } else if (m.name && m.logo) {
      // brand new market created from the admin console — goes live client-side too
      MARKETS.push({ ...m });
    }
    setMarketTick(t => t + 1);
  }, []);

  const handleBet = useCallback(async (market, side, amt, opts) => {
    if (!amt || amt <= 0) { showToast({ type: "error", message: "Enter an amount first." }); return; }
    // Paper mode: deduct virtual funds, no wallet required.
    if (paperMode) {
      if (amt > paperBalance) { showToast({ type: "error", message: "Not enough paper balance." }); return; }
      setPaperBalance(b => { const nb = Math.max(0, b - amt); try { localStorage.setItem("doa_paper_balance", nb); } catch (e) {} return nb; });
      const ns = betStreak + 1; setBetStreak(ns);
      showToast({ name: market.name, side, amt, streak: ns, paper: true });
      if (opts && opts.share) setShareTarget({ market, side, amt });
      maybePostBetPrompts();
      // record the paper bet server-side too (shows in portfolio, doesn't touch real balance)
      window.API.placeBet(market.id, side, amt, true).then(r => syncMarketInPlace(r.market)).catch(() => {});
      return;
    }
    if (!walletConnected) { showToast({ type: "wallet" }); return; }
    try {
      const res = await window.API.placeBet(market.id, side, amt, false);
      setBalance(res.balance);
      syncMarketInPlace(res.market);
      const next = betStreak + 1;
      setBetStreak(next);
      showToast({ name: market.name, side, amt, streak: next });
      if (opts && opts.share) setShareTarget({ market, side, amt });
      maybePostBetPrompts();
    } catch (e) {
      showToast({ type: "error", message: e.message || "Bet failed." });
    }
  }, [showToast, walletConnected, betStreak, paperMode, paperBalance, syncMarketInPlace]);

  const handleConfirmBet = useCallback((side, amt) => {
    if (route.name !== "market") return;
    const m = MARKETS.find(x => x.id === route.id);
    if (!m) return;
    handleBet(m, side, amt, { share: true });
  }, [route, handleBet]);

  const openShare = useCallback((payload) => setShareTarget(payload), []);

  // Re-pull the current user (balance) from the server — used after resolutions/payouts.
  const refreshMe = useCallback(async () => {
    try {
      const { user } = await window.API.me();
      if (user) { setWalletConnected(true); setBalance(user.balance); }
    } catch (e) { /* stay as-is */ }
  }, []);

  // ---- Challenges, backed by the real API ----
  const mapOpenChallenge = (c) => ({
    id: c.id,
    challenger: lbUser(c.challenger),
    market: MARKETS.find((m) => m.id === c.marketId) || marketByName(c.market),
    challengerSide: c.challengerSide,
    stake: c.stake,
    createdMinsAgo: c.createdAt ? Math.max(0, Math.round((Date.now() - c.createdAt) / 60000)) : 0,
  });
  const mapMyChallenge = (c) => ({
    id: c.id,
    yourSide: c.yourSide,
    market: MARKETS.find((m) => m.id === c.marketId) || marketByName(c.market),
    opponent: c.opponent ? lbUser(c.opponent) : null,
    stake: c.stake,
    status: c.status,
    outcome: c.outcome,
  });
  const refreshChallenges = useCallback(async () => {
    if (!walletConnected) return;
    try {
      const [openR, mineR] = await Promise.all([window.API.challenges(), window.API.myChallenges()]);
      setLiveOpen((openR.challenges || []).map(mapOpenChallenge));
      setLiveMine((mineR.challenges || []).map(mapMyChallenge));
    } catch (e) { /* keep last */ }
  }, [walletConnected]);
  useEffect(() => { refreshChallenges(); }, [refreshChallenges, challengesVersion]);

  const apiSendChallenge = useCallback(async ({ market, yourSide, stake }) => {
    if (!walletConnected) { showToast({ type: "wallet" }); return; }
    try {
      await window.API.createChallenge(market.id, yourSide, stake);
      refreshMe(); refreshChallenges();
      showToast({ type: "info", message: `Open challenge posted: ${yourSide} ${market.name} for $${stake}. Anyone can accept.` });
    } catch (e) { showToast({ type: "error", message: e.message || "Challenge failed." }); }
  }, [walletConnected, showToast, refreshMe, refreshChallenges]);

  const apiAcceptChallenge = useCallback(async (c) => {
    if (!walletConnected) { showToast({ type: "wallet" }); return; }
    try {
      await window.API.acceptChallenge(c.id);
      refreshMe(); refreshChallenges();
      showToast({ type: "connected", message: `Challenge accepted — $${c.stake} locked. Winner takes the pot, minus 2%.` });
    } catch (e) { showToast({ type: "error", message: e.message || "Accept failed." }); }
  }, [walletConnected, showToast, refreshMe, refreshChallenges]);

  // ---- FEATURE 5 paper mode ----
  const enablePaper = useCallback(() => {
    setPaperMode(true); try { localStorage.setItem("doa_paper", "1"); } catch (e) {}
    showToast({ type: "info", message: "Paper trading on — betting with $10,000 virtual funds." });
  }, [showToast]);
  const requestSwitchLive = useCallback(() => setSwitchLiveModal(true), []);
  const confirmSwitchLive = useCallback(() => {
    setPaperMode(false); try { localStorage.setItem("doa_paper", "0"); } catch (e) {}
    setSwitchLiveModal(false);
    showToast({ type: "info", message: "Switched to live trading." });
  }, [showToast]);

  // ---- FEATURE 2 notifications ----
  const markNotificationRead = useCallback((id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllNotificationsRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), []);

  // ---- FEATURE 4 onboarding ----
  const finishOnboarding = useCallback((action) => {
    try { localStorage.setItem("doa_visited", "1"); } catch (e) {}
    setShowOnboarding(false);
    if (action === "paper") enablePaper();
    else if (action === "live") handleConnectWallet();
  }, [enablePaper, handleConnectWallet]);

  // ---- Follow ----
  const isFollowing = useCallback((u) => following.includes((u || "").replace(/^@/, "")), [following]);
  const toggleFollow = useCallback((u) => {
    const name = (u || "").replace(/^@/, "");
    setFollowing(prev => {
      if (prev.includes(name)) {
        showToast({ type: "info", message: `Unfollowed @${name}.` });
        return prev.filter(x => x !== name);
      }
      showToast({ type: "info", message: `You're now following @${name}.` });
      return [...prev, name];
    });
  }, [showToast]);

  // ---- Comments ----
  const getComments = useCallback((marketId) => {
    if (!seedCache.current[marketId]) seedCache.current[marketId] = commentsForMarket(marketId);
    return [...(posted[marketId] || []), ...seedCache.current[marketId]];
  }, [posted]);
  const addComment = useCallback((marketId, text) => {
    const c = { id: "u" + marketId + "-" + Date.now(), user: { username: CURRENT_USER.username, hue: CURRENT_USER.hue }, text, upvotes: 0, minsAgo: 0, replies: 0 };
    setPosted(prev => ({ ...prev, [marketId]: [c, ...(prev[marketId] || [])] }));
    showToast({ type: "info", message: "Comment posted." });
  }, [showToast]);
  const upvoteComment = useCallback((id) => {
    setUpvoted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const isUpvoted = useCallback((id) => upvoted.includes(id), [upvoted]);

  // ---- Challenges ----
  const acceptChallenge = useCallback((c) => {
    if (!walletConnected) { showToast({ type: "wallet" }); return; }
    setOpenChallenges(prev => prev.filter(x => x.id !== c.id));
    setMyChallenges(prev => [{
      id: "acc" + c.id, opponent: c.challenger, market: c.market,
      yourSide: c.challengerSide === "DEAD" ? "ALIVE" : "DEAD", stake: c.stake, status: "active",
    }, ...prev]);
    setBalance(b => Math.max(0, b - c.stake));
    showToast({ type: "info", message: `Challenge accepted — $${c.stake} locked vs @${c.challenger.username}.` });
  }, [walletConnected, showToast]);

  const sendChallenge = useCallback(({ market, yourSide, stake, opponent }) => {
    if (!walletConnected) { showToast({ type: "wallet" }); return; }
    setMyChallenges(prev => [{
      id: "snt" + Date.now(), opponent: opponent || null, market, yourSide, stake,
      status: opponent ? "active" : "pending",
    }, ...prev]);
    setBalance(b => Math.max(0, b - stake));
    showToast({ type: "info", message: opponent ? `Challenge sent to @${opponent.username}.` : "Open challenge posted." });
  }, [walletConnected, showToast]);

  const acceptIncoming = useCallback((c) => {
    if (!walletConnected) { showToast({ type: "wallet" }); return; }
    setIncoming(prev => prev.filter(x => x.id !== c.id));
    setMyChallenges(prev => [{
      id: "ai" + c.id, opponent: c.from, market: c.market,
      yourSide: c.theirSide === "DEAD" ? "ALIVE" : "DEAD", stake: c.stake, status: "active",
    }, ...prev]);
    setBalance(b => Math.max(0, b - c.stake));
    showToast({ type: "info", message: `Accepted @${c.from.username}'s challenge — $${c.stake} locked.` });
  }, [walletConnected, showToast]);

  const declineIncoming = useCallback((c) => {
    setIncoming(prev => prev.filter(x => x.id !== c.id));
    showToast({ type: "info", message: `Declined @${c.from.username}'s challenge.` });
  }, [showToast]);

  // Logged in → real challenges from the API; logged out → seeded demo so the
  // page is never empty. Incoming/directed challenges aren't in the live model
  // yet (all challenges are open-to-anyone), so that bucket is empty when authed.
  const effectiveOpen = walletConnected ? (liveOpen || []) : openChallenges;
  const effectiveMine = walletConnected ? (liveMine || []) : myChallenges;
  const effectiveIncoming = walletConnected ? [] : incoming;
  const myName = (walletAddress || "").replace(/^@/, "");
  const challengeBadge = walletConnected
    ? effectiveOpen.filter((c) => (c.challenger?.username || "") !== myName).length
    : incoming.length;

  const social = {
    currentUser: CURRENT_USER,
    navigate, showToast,
    walletConnected, walletAddress, onConnect: handleConnectWallet,
    following, isFollowing, toggleFollow,
    getComments, addComment, upvoteComment, isUpvoted,
    openChallenges: effectiveOpen, myChallenges: effectiveMine, incoming: effectiveIncoming,
    acceptChallenge: walletConnected ? apiAcceptChallenge : acceptChallenge,
    sendChallenge: walletConnected ? apiSendChallenge : sendChallenge,
    acceptIncoming, declineIncoming,
    quickBet: handleBet, openShare,
    notifications, markNotificationRead, markAllNotificationsRead,
    paperMode, paperBalance, enablePaper, requestSwitchLive,
    syncMarket: syncMarketInPlace, refreshMe, balance,
    presence, liveFeed, watching: (id) => presence[id] || 0, orderbookVersion,
  };

  // ---- FEATURE 3a email handlers ----
  const subscribeEmail = useCallback(() => {
    try { localStorage.setItem("doa_email_captured", "1"); } catch (e) {}
    setShowEmailModal(false);
    showToast({ type: "connected", message: "You're in! Check your inbox." });
  }, [showToast]);
  const skipEmail = useCallback(() => {
    try { localStorage.setItem("doa_email_captured", "1"); } catch (e) {}
    setShowEmailModal(false);
  }, []);

  // ---- FEATURE 4 push bar handlers ----
  const enablePush = useCallback(() => {
    try { localStorage.setItem("doa_push_enabled", "1"); } catch (e) {}
    setShowPushBar(false);
    if (typeof Notification !== "undefined" && Notification.requestPermission) {
      Notification.requestPermission().then(p => {
        showToast({ type: p === "granted" ? "connected" : "info", message: p === "granted" ? "Notifications enabled!" : "Notifications " + p + "." });
      }).catch(() => showToast({ type: "info", message: "Notifications unavailable." }));
    } else {
      showToast({ type: "info", message: "Notifications not supported in this browser." });
    }
  }, [showToast]);
  const dismissPush = useCallback(() => {
    try { localStorage.setItem("doa_push_dismissed", "1"); } catch (e) {}
    setShowPushBar(false);
  }, []);

  // ---- FEATURE 6 — URL state + meta ----
  const updatePageMeta = useCallback((r) => {
    const setMeta = (sel, attr, val) => { let el = document.head.querySelector(sel); if (!el) { el = document.createElement("meta"); const [a, v] = sel.replace(/[\[\]]/g, "").split("="); el.setAttribute(a, v.replace(/['"]/g, "")); document.head.appendChild(el); } el.setAttribute(attr, val); };
    let title, desc, url = window.location.href;
    if (r.name === "market") {
      const m = MARKETS.find(x => x.id === r.id);
      if (m) { title = `Will AI Kill ${m.name}? — Dead or Alive`; desc = `${fmtPct(m.death)} of traders predict AI will wipe out ${m.name}.`; }
    }
    if (!title) { title = "Dead or Alive — Will AI Kill It?"; desc = "Bet on whether AI will destroy specific companies. 120 live markets."; }
    document.title = title;
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", desc);
  }, []);

  // pushState + meta on route change. Skip the very first run — it fires with
  // the default route before the ?m= deep link is read, and would wipe it.
  const routeEffectRan = useRef(false);
  useEffect(() => {
    if (!routeEffectRan.current) {
      routeEffectRan.current = true;
      updatePageMeta(route);
      return;
    }
    if (route.name === "market") {
      window.history.pushState({ marketId: route.id }, "", "?m=" + route.id);
    } else if (route.name === "markets") {
      window.history.pushState({}, "", window.location.pathname);
    }
    updatePageMeta(route);
  }, [route, updatePageMeta]);

  // read ?m= / /admin on mount + browser back
  useEffect(() => {
    if (window.location.pathname.replace(/\/$/, "") === "/admin") { setRoute({ name: "admin" }); return; }
    const params = new URLSearchParams(window.location.search);
    const m = params.get("m");
    if (m != null) { const found = MARKETS.find(x => x.id === +m); if (found) setRoute({ name: "market", id: found.id }); }
    const onPop = (e) => {
      const mid = e.state && e.state.marketId;
      if (mid != null && MARKETS.find(x => x.id === mid)) setRoute({ name: "market", id: mid });
      else setRoute({ name: "markets" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Hydrate from the bootstrap once it resolves: copy live market state onto the
  // in-memory MARKETS objects, and restore an existing session if present.
  useEffect(() => {
    let cancelled = false;
    (window.__bootReady || Promise.resolve(window.__BOOTSTRAP)).then((boot) => {
      if (cancelled || !boot) return;
      if (Array.isArray(boot.markets)) {
        const byId = new Map(boot.markets.map((m) => [m.id, m]));
        MARKETS.forEach((t) => {
          const m = byId.get(t.id);
          if (m) {
            t.death = m.death; t.survives = m.survives; t.series = m.series;
            t.change24h = m.change24h; t.volume = m.volume; t.status = m.status; t.outcome = m.outcome;
            t.resolutionReason = m.resolutionReason; t.resolutionSource = m.resolutionSource; t.resolvedAt = m.resolvedAt;
            byId.delete(t.id);
          }
        });
        // markets created server-side that the seeded client list doesn't know about
        byId.forEach((m) => MARKETS.push({ ...m }));
        setMarketTick((x) => x + 1);
        // re-check the ?m= deep link — it may point at a market that only just arrived
        const params = new URLSearchParams(window.location.search);
        const mid = params.get("m");
        if (mid != null) {
          const found = MARKETS.find((x) => x.id === +mid);
          if (found) setRoute((r) => (r.name === "markets" ? { name: "market", id: found.id } : r));
        }
      }
      if (boot.me) {
        setWalletConnected(true);
        setWalletAddress(boot.me.address || "@" + boot.me.username);
        setBalance(boot.me.balance);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ---- Real-time stream (SSE) ----
  // One EventSource, reconnected when you open a market so presence counts the
  // right room. Global events (any market's trades, resolutions) arrive regardless.
  const myNameRef = useRef("");
  useEffect(() => { myNameRef.current = (walletAddress || "").replace(/^@/, ""); }, [walletAddress]);
  const marketNameById = (id) => (MARKETS.find((m) => m.id === id) || {}).name || "a market";

  const onLiveTrade = useCallback((d) => {
    setLiveFeed((prev) => [{ ...d, _id: (d.at || 0) + ":" + (d.user || "") + ":" + Math.round((d.amt || 0) * 100) }, ...prev].slice(0, 80));
    // whale alert for OTHER people's big moves
    const mine = (d.user || "").replace(/^@/, "") === myNameRef.current;
    if (!mine && (d.amt || 0) >= 500) {
      const verb = d.action === "sold" ? "sold" : "bet";
      showToast({ type: "info", message: `🐳 @${(d.user || "someone").replace(/^@/, "")} just ${verb} $${Math.round(d.amt).toLocaleString()} ${d.side} on ${marketNameById(d.marketId)}` });
    }
  }, [showToast]);

  useEffect(() => {
    if (typeof window.EventSource === "undefined") return;
    const marketParam = route.name === "market" && route.id != null ? route.id : "";
    const es = new EventSource("/api/stream?market=" + encodeURIComponent(marketParam));
    es.addEventListener("price", (e) => { try { syncMarketInPlace(JSON.parse(e.data).market); } catch (x) {} });
    es.addEventListener("market:new", (e) => { try { syncMarketInPlace(JSON.parse(e.data).market); } catch (x) {} });
    es.addEventListener("bet", (e) => { try { onLiveTrade(JSON.parse(e.data)); } catch (x) {} });
    es.addEventListener("fill", (e) => { try { onLiveTrade(JSON.parse(e.data)); } catch (x) {} });
    es.addEventListener("trade", (e) => { try { onLiveTrade(JSON.parse(e.data)); } catch (x) {} });
    es.addEventListener("presence", (e) => { try { setPresence(JSON.parse(e.data).counts || {}); } catch (x) {} });
    es.addEventListener("resolution", (e) => {
      try { const d = JSON.parse(e.data); if (d.market) syncMarketInPlace(d.market); } catch (x) {}
    });
    es.addEventListener("challenge", () => setChallengesVersion((v) => v + 1));
    es.addEventListener("order", () => setOrderbookVersion((v) => v + 1));
    return () => es.close();
  }, [route.name, route.id, syncMarketInPlace, onLiveTrade]);

  const walletProps = { walletConnected, walletAddress, onConnect: handleConnectWallet };

  let page;
  if (route.name === "markets") page = <MarketsPage navigate={navigate} onQuickBet={handleBet} {...walletProps}/>;
  else if (route.name === "market") page = <MarketDetailPage marketId={route.id} navigate={navigate} onConfirmBet={handleConfirmBet} showToast={showToast} {...walletProps}/>;
  else if (route.name === "portfolio") page = <PortfolioPage navigate={navigate} {...walletProps}/>;
  else if (route.name === "leaderboard") page = <LeaderboardPage navigate={navigate} {...walletProps}/>;
  else if (route.name === "following") page = <FollowingPage/>;
  else if (route.name === "challenges") page = <ChallengesPage/>;
  else if (route.name === "tournaments") page = <TournamentsPage/>;
  else if (route.name === "profile") page = <ProfilePage username={route.username}/>;
  else if (route.name === "admin") page = <ResolutionConsolePage/>;
  else if (route.name === "resolutions") page = <ResolutionHistoryPage/>;
  else if (route.name === "risk-disclosure") page = <RiskDisclosurePage/>;
  else if (route.name === "death-watch") page = <DeathWatchPage/>;
  else if (route.name === "alerts") page = <AlertsPage/>;
  else if (route.name === "activity") page = <ActivityPage {...walletProps}/>;
  else page = <MarketsPage navigate={navigate} onQuickBet={handleBet} {...walletProps}/>;

  const footerLink = (label, routeName) => (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); routeName ? navigate({ name: routeName }) : showToast({ type: "info", message: `Coming soon — ${label} docs in progress.` }); }}
      style={{ color: "var(--text-muted)", transition: "color 0.15s ease" }}
      onMouseEnter={(e) => e.currentTarget.style.color = "var(--text)"}
      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
    >{label}</a>
  );

  return (
    <SocialContext.Provider value={social}>
      <TopNav route={route} navigate={navigate} balance={balance} challengeBadge={challengeBadge} {...walletProps}/>
      {/* FEATURE 4 — push notification bar */}
      {showPushBar && <NotificationBar onEnable={enablePush} onDismiss={dismissPush}/>}
      {/* FEATURE 5 — paper mode banner */}
      {paperMode && (
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 24px", background: "rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
        📄 Paper trading active — all bets use virtual funds. No real money at risk.
        </div>
      )}
      {page}
      <Toast toast={toast}/>
      <ShareSheet share={shareTarget} onClose={() => setShareTarget(null)}/>
      {showOnboarding && <OnboardingModal onFinish={finishOnboarding}/>}
      {switchLiveModal && (
        <div onClick={() => setSwitchLiveModal(false)} style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(5,6,12,0.78)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
            <h3 className="font-display" style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 700 }}>Switch to live trading?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>Real money will be used for all bets. Make sure your wallet is connected before placing live bets.</p>
            <div style={{ display: "flex", gap: 10 }}>
              {!walletConnected && (
                <button className="btn" style={{ flex: 1, padding: 12 }} onClick={() => { setSwitchLiveModal(false); handleConnectWallet(); }}>Connect Wallet</button>
              )}
              <button className="btn primary" style={{ flex: 1, padding: 12 }} onClick={confirmSwitchLive}>Switch to Live</button>
            </div>
            <button onClick={() => setSwitchLiveModal(false)} style={{ display: "block", width: "100%", textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>Stay in paper mode</button>
          </div>
        </div>
      )}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px 32px", marginTop: 40 }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, fontSize: 11, color: "var(--text-muted)" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <Skull size={14} color="var(--indigo)"/>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>Dead or Alive</span>
            </span>
            <span>Cash-settled prediction market on AI disruption.</span>
          </div>
          <div style={{ display: "flex", gap: 18, fontFamily: "'JetBrains Mono', monospace", alignItems: "center" }}>
            {footerLink("Resolution Authority", "admin")}
            {footerLink("Resolution History", "resolutions")}
            {footerLink("Risk Disclosure", "risk-disclosure")}
            {footerLink("Terms")}
            {footerLink("API")}
            <span style={{ color: "var(--alive)" }}>● All systems operational</span>
          </div>
        </div>
      </footer>
      {/* FEATURE 3a — email capture */}
      {showEmailModal && <EmailCaptureModal onClose={skipEmail} onSubscribe={subscribeEmail}/>}
      {/* FEATURE 5a — mobile bottom nav */}
      <BottomNav route={route} navigate={navigate}/>
    </SocialContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
