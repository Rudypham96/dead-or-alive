// ---- Pages: Markets feed, Market Detail, Portfolio, Leaderboard, Activity ----

// Featured spotlight at top of markets feed
function FeaturedSpotlight({ market, onOpen, onBet }) {
  const m = market;
  const favored = m.death >= m.survives ? "DEAD" : "ALIVE";
  return (
    <div className="card" style={{ padding: 28, background: "linear-gradient(135deg, rgba(91,107,245,0.10), rgba(139,92,246,0.04) 60%, transparent), var(--surface)", borderColor: "rgba(91,107,245,0.25)", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)", pointerEvents: "none" }}/>
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <Logo name={m.name} size={64} hue={m.logo.hue} initials={m.logo.initials}/>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span className="pill" style={{ color: "var(--indigo)", borderColor: "rgba(91,107,245,0.4)", background: "rgba(91,107,245,0.1)" }}><span className="dot"/>FEATURED</span>
            <CatTag category={m.category}/>
          </div>
          <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Will AI kill {m.name}?</h2>
          <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: 13, maxWidth: 520, lineHeight: 1.5 }}>
            Resolves DEAD if {m.name} files bankruptcy, is acquired in distress, or loses 80%+ of revenue before {new Date(Date.now() + m.daysLeft * 86400000).toLocaleDateString(undefined, { month: "short", year: "numeric" })}.
          </p>
        </div>
        <div style={{ minWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onBet(m, "DEAD", 50)} className="btn dead" style={{ flex: 1, padding: "14px 18px", fontSize: 14, flexDirection: "column", gap: 0 }}>
              <span style={{ fontSize: 11, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI kills it</span>
              <span className="font-mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmtPct(m.death)}</span>
            </button>
            <button onClick={() => onBet(m, "ALIVE", 50)} className="btn alive" style={{ flex: 1, padding: "14px 18px", fontSize: 14, flexDirection: "column", gap: 0 }}>
              <span style={{ fontSize: 11, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.06em" }}>Survives</span>
              <span className="font-mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmtPct(m.survives)}</span>
            </button>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)", justifyContent: "space-between" }}>
            <span><span className="font-mono" style={{ color: "var(--text)" }}>{fmtMoney(m.volume)}</span> vol · <span className="font-mono" style={{ color: "var(--text)" }}>{m.traders.toLocaleString()}</span> traders</span>
            <button onClick={() => onOpen(m)} style={{ color: "var(--indigo)", fontSize: 12, fontWeight: 600 }}>Open market →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- This Week in AI editorial block (FEATURE 2) ----
function WeekInAI({ navigate }) {
  const picks = [
    ["Chegg", "AI tutoring killed the core product. Most-watched market this week."],
    ["Fiverr", "ChatGPT took their lunch. Volume up 340% since last Friday."],
    ["Teleperformance", "Largest AI call-center play by volume. Analysts split 52/48."],
  ].map(([name, note]) => ({ m: marketByName(name), note })).filter(x => x.m);
  const starters = ["Chegg", "Fiverr", "Teleperformance"].map(n => marketByName(n)).filter(Boolean);

  return (
    <div style={{ background: "#111827", borderLeft: "4px solid #5B6BF5", borderRadius: 12, padding: 24, marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>📡 This Week in AI</span>
        <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "#0A0B14", background: "var(--warn)", borderRadius: 6, padding: "3px 8px" }}>WEEKLY DIGEST</span>
      </div>
      <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>Markets our analysts are watching right now</div>
      <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }}/>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {picks.map(({ m, note }) => (
          <button key={m.id} onClick={() => navigate({ name: "market", id: m.id })}
            className="wia-row"
            style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "12px 10px", borderRadius: 10 }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(91,107,245,0.06)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <Logo name={m.name} size={40} hue={m.logo.hue} initials={m.logo.initials}/>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", flexShrink: 0, width: 230, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
              <CatTag category={m.category}/>
            </div>
            <div className="font-mono wia-pct" style={{ fontSize: 18, fontWeight: 700, color: "var(--dead)", width: 56, flexShrink: 0 }}>{fmtPct(m.death)}</div>
            <div className="wia-note" style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{note}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--indigo)", flexShrink: 0, marginLeft: "auto" }}>View →</span>
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>New to Dead or Alive? Start with these 3 markets →</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {starters.map(m => (
            <button key={m.id} onClick={() => navigate({ name: "market", id: m.id })} className="chip" style={{ borderColor: "rgba(91,107,245,0.4)", color: "var(--text)" }}>{m.name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Markets feed
function MarketsPage({ navigate, onQuickBet }) {
  const social = React.useContext(SocialContext);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("hottest");
  const [view, setView] = useState("grid"); // FIX 5: 'grid' | 'compact'
  const [tab, setTab] = useState("all");     // FEATURE 2: All|trending|movers|closing|risk

  const filtered = useMemo(() => {
    let xs = MARKETS;
    if (category !== "All") xs = xs.filter(m => m.category === category);
    if (tab === "closing") xs = xs.filter(m => m.daysLeft < 60);
    if (tab === "risk") xs = xs.filter(m => m.death > 0.80);
    const sorters = {
      hottest: (a, b) => (b.volume * Math.abs(b.change24h)) - (a.volume * Math.abs(a.change24h)),
      newest: (a, b) => b.id - a.id,
      ending: (a, b) => a.daysLeft - b.daysLeft,
      volume: (a, b) => b.volume - a.volume,
      movers: (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h),
    };
    let cmp;
    if (tab === "trending") cmp = sorters.hottest;
    else if (tab === "movers") cmp = sorters.movers;
    else if (tab === "closing") cmp = sorters.ending;
    else if (tab === "risk") cmp = (a, b) => b.death - a.death;
    else cmp = sorters[sort] || sorters.hottest;
    return [...xs].sort(cmp);
  }, [category, sort, tab]);

  const viewMode = tab === "movers" ? "movers" : tab === "risk" ? "risk" : null;
  const FILTER_TABS = [
    ["all", "All"], ["trending", "🔥 Trending"], ["movers", "⚡ Movers"],
    ["closing", "⏰ Closing Soon"], ["risk", "💀 High Risk"],
  ];

  const featured = MARKETS[0]; // Chegg as featured

  // Stats strip
  const stats = useMemo(() => {
    const totalVol = MARKETS.reduce((s, m) => s + m.volume, 0);
    const totalTraders = LEADERBOARD.reduce((s, t) => s + t.trades, 0);
    const avgDeath = MARKETS.reduce((s, m) => s + m.death, 0) / MARKETS.length;
    return { totalVol, totalTraders, avgDeath, count: MARKETS.length };
  }, []);

  return (
    <div className="app">
      <Sidebar category={category} setCategory={setCategory} sort={sort} setSort={setSort}/>
      <main className="main">
        {/* Hero band */}
        <section style={{ padding: "32px 32px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span className="pill live"><span className="dot"/>122 LIVE MARKETS</span>
                  <span className="pill">CASH-SETTLED</span>
                </div>
                <h1 className="font-display hero-title" style={{ margin: 0, fontSize: 36, fontWeight: 700, letterSpacing: "-0.025em" }}>
                  Will AI kill it?<span style={{ color: "var(--text-muted)", fontWeight: 400 }}> Place your bet.</span>
                </h1>
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: 14, maxWidth: 640 }}>
                  Bet on whether AI wipes out specific companies. Real money. Real outcomes. Resolves on bankruptcy, distress acquisition, or 80%+ revenue collapse.
                </p>
              </div>
              <div className="hero-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 24 }}>
                {[
                  ["Markets", stats.count.toString()],
                  ["24h volume", fmtMoney(stats.totalVol * 0.04)],
                  ["Open interest", fmtMoney(stats.totalVol)],
                  ["Avg DEAD odds", fmtPct1(stats.avgDeath)],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
                    <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <FeaturedSpotlight market={featured} onOpen={(m) => navigate({ name: "market", id: m.id })} onBet={(m, side, amt) => onQuickBet(m, side, amt)}/>

            <div style={{ marginTop: 18, marginBottom: 20, padding: "10px 14px", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10 }}>
              <ActivityTicker items={TICKER}/>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section style={{ padding: "24px 32px 60px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            {/* FEATURE 2 — This Week in AI editorial block */}
            <WeekInAI navigate={navigate}/>
            {/* FEATURE 2 — filter tab strip */}
            <div className="filter-tabs" style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
              {FILTER_TABS.map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    padding: "10px 16px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                    color: tab === k ? "var(--text)" : "var(--text-muted)",
                    borderBottom: tab === k ? "2px solid var(--indigo)" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >{l}</button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {category === "All" ? "All markets" : category}
                <span className="font-mono" style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 8, fontSize: 14 }}>{filtered.length}</span>
              </h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button className={view === "grid" ? "chip active" : "chip"} onClick={() => setView("grid")}>Grid</button>
                <button className={view === "compact" ? "chip active" : "chip"} onClick={() => setView("compact")}>Compact</button>
              </div>
            </div>
            {view === "grid" ? (
              <div className="market-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {filtered.map(m => (
                  <MarketCard
                    key={m.id} market={m} viewMode={viewMode}
                    onOpen={(mk) => navigate({ name: "market", id: mk.id })}
                    onQuickBet={(mk, side, amt) => onQuickBet(mk, side, amt)}
                    onShare={(mk) => social.openShare({ market: mk })}
                  />
                ))}
              </div>
            ) : (
              <div className="card" style={{ overflow: "hidden" }}>
                <div className="compact-head" style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 18px", background: "var(--bg-elev)", borderBottom: "1px solid var(--border)", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <span style={{ width: 32, flexShrink: 0 }}></span>
                  <span style={{ flex: "1 1 200px" }}>Market</span>
                  <span style={{ width: 80, flexShrink: 0 }}>Trend</span>
                  <span style={{ width: 64, textAlign: "right", flexShrink: 0 }}>Dead</span>
                  <span style={{ width: 64, textAlign: "right", flexShrink: 0 }}>Alive</span>
                  <span style={{ width: 70, textAlign: "right", flexShrink: 0 }}>Volume</span>
                  <span style={{ width: 124, flexShrink: 0 }}></span>
                </div>
                {filtered.map(m => (
                  <CompactMarketRow
                    key={m.id} market={m}
                    onOpen={(mk) => navigate({ name: "market", id: mk.id })}
                    onQuickBet={(mk, side, amt) => onQuickBet(mk, side, amt)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// ---- Market Detail ----
function PriceChart({ series, height = 280 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const labels = series.map((_, i) => {
      const d = new Date(Date.now() - (series.length - 1 - i) * 24 * 3600 * 1000);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });
    const deathSeries = series.map(v => +(v * 100).toFixed(2));
    const aliveSeries = series.map(v => +((1 - v) * 100).toFixed(2));

    const ctx = ref.current.getContext("2d");
    const deadGrad = ctx.createLinearGradient(0, 0, 0, height);
    deadGrad.addColorStop(0, "rgba(239,68,68,0.30)");
    deadGrad.addColorStop(1, "rgba(239,68,68,0)");
    const aliveGrad = ctx.createLinearGradient(0, 0, 0, height);
    aliveGrad.addColorStop(0, "rgba(16,185,129,0.18)");
    aliveGrad.addColorStop(1, "rgba(16,185,129,0)");

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "AI KILLS IT", data: deathSeries, borderColor: "#EF4444", backgroundColor: deadGrad, fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
          { label: "SURVIVES", data: aliveSeries, borderColor: "#10B981", backgroundColor: aliveGrad, fill: false, tension: 0.35, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, borderDash: [4, 4] },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0F1120", borderColor: "#2A3347", borderWidth: 1, padding: 10,
            titleColor: "#F9FAFB", bodyColor: "#F9FAFB",
            titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
            callbacks: { label: (item) => ` ${item.dataset.label}: ${item.parsed.y.toFixed(1)}%` },
          },
        },
        scales: {
          x: { grid: { color: "rgba(31,41,55,0.4)" }, ticks: { color: "#6B7280", maxRotation: 0, autoSkipPadding: 32, font: { family: "'JetBrains Mono', monospace", size: 10 } } },
          y: { min: 0, max: 100, grid: { color: "rgba(31,41,55,0.4)" }, ticks: { color: "#6B7280", callback: (v) => v + "%", font: { family: "'JetBrains Mono', monospace", size: 10 } } },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [series, height]);
  return <div style={{ position: "relative", height }}><canvas ref={ref}/></div>;
}

function VolumeBars({ series, height = 80 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const r = mulberry32(series.length * 7);
    const data = series.map(() => Math.round(20 + r() * 100));
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: { labels: data.map((_, i) => i), datasets: [{ data, backgroundColor: "rgba(139,92,246,0.55)", borderRadius: 2, borderSkipped: false }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [series]);
  return <div style={{ position: "relative", height }}><canvas ref={ref}/></div>;
}

// "X watching now" — live presence from the SSE stream.
function WatchingPill({ marketId }) {
  const social = React.useContext(SocialContext);
  const n = (social?.watching && social.watching(marketId)) || 0;
  const shown = Math.max(1, n); // you're here, so at least 1
  return (
    <span className="pill" style={{ color: "var(--text-muted)" }} title="People viewing this market right now">
      <span style={{ display: "inline-flex", width: 6, height: 6, borderRadius: "50%", background: "var(--indigo)", marginRight: 2 }}/>
      {shown} watching
    </span>
  );
}

// Order book — REAL resting limit orders, re-fetched live on price ticks and
// order events (place/fill/cancel) streamed over SSE.
function OrderBook({ market }) {
  const social = React.useContext(SocialContext);
  const m = market;
  const [book, setBook] = useState(null);
  useEffect(() => {
    let alive = true;
    window.API.orderbook(m.id).then((b) => { if (alive) setBook(b); }).catch(() => {});
    return () => { alive = false; };
  }, [m.id, m.death, social?.orderbookVersion]); // refreshes when the line moves or any order changes

  const dead = (book && book.dead) || [];
  const alive = (book && book.alive) || [];
  const total = dead.length + alive.length;

  const Col = ({ title, levels, color }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>
        {title} <span style={{ color: "var(--text-muted)" }}>· {levels.length}</span>
      </div>
      {levels.length === 0 ? (
        <div style={{ padding: "14px 12px", fontSize: 11, color: "var(--text-dim)" }}>No resting orders</div>
      ) : (
        levels.slice(0, 7).map((l, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "5px 12px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", borderBottom: "1px solid rgba(31,41,55,0.4)" }}>
            <span style={{ color, fontWeight: 500 }}>{(l.price * 100).toFixed(0)}¢</span>
            <span style={{ color: "var(--text)", textAlign: "right" }}>{fmtMoney(l.stake)}</span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Order book</span>
        <span className="pill live" style={{ padding: "2px 8px", fontSize: 9 }}><span className="dot"/>LIVE</span>
      </div>
      <div style={{ padding: "8px 12px", textAlign: "center", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", background: "rgba(91,107,245,0.06)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--dead)", fontWeight: 600 }}>{(m.death * 100).toFixed(1)}¢ DEAD</span>
        <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>·</span>
        <span style={{ color: "var(--alive)", fontWeight: 600 }}>{(m.survives * 100).toFixed(1)}¢ ALIVE</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 8 }}>last</span>
      </div>
      <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
        <Col title="DEAD bids" levels={dead} color="var(--dead)"/>
        <div style={{ width: 1, background: "var(--border)" }}/>
        <Col title="ALIVE bids" levels={alive} color="var(--alive)"/>
      </div>
      {total === 0 && (
        <div style={{ padding: "10px 12px", fontSize: 11, color: "var(--text-muted)", textAlign: "center", borderTop: "1px solid var(--border)" }}>
          No resting limit orders yet — place one from the ticket to seed the book.
        </div>
      )}
    </div>
  );
}

function ActivityFeed({ market }) {
  const social = React.useContext(SocialContext);
  // real trades streamed in for THIS market (newest first)
  const live = (social?.liveFeed || [])
    .filter((e) => e.marketId === market.id)
    .map((e) => ({ live: true, user: "@" + (e.user || "trader").replace(/^@/, ""), side: e.side, amt: e.amt, price: e.price, at: e.at, action: e.action }));
  // seeded backdrop so a quiet market still shows depth
  const seeded = useMemo(() => {
    const r = mulberry32(market.id * 17 + 99);
    const out = [];
    for (let i = 0; i < 10; i++) {
      const minsAgo = Math.floor(i * (1 + r() * 4) + r() * 2);
      const side = r() < market.death ? "DEAD" : "ALIVE";
      const amt = [25, 50, 100, 250, 500, 1000, 2500][Math.floor(r() * 7)];
      const price = (side === "DEAD" ? market.death : market.survives) + (r() - 0.5) * 0.04;
      const u = ["@kellyfraction","@longgamma","@moloch","@iron.condor","@mu.sigma","@bayesbot","@delta.huxley","@vega.weighted","@skullking"][Math.floor(r() * 9)];
      out.push({ user: u, side, amt, price: Math.max(0.01, Math.min(0.99, price)), minsAgo });
    }
    return out;
  }, [market.id, market.death, market.survives]);
  const items = [...live, ...seeded].slice(0, 12);
  const ago = (at) => { const s = Math.max(0, Math.round((Date.now() - at) / 1000)); return s < 60 ? s + "s" : Math.round(s / 60) + "m"; };
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Live activity</span>
        <span className="pill live" style={{ padding: "2px 8px", fontSize: 9 }}><span className="dot"/>LIVE</span>
      </div>
      <div>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(31,41,55,0.5)", fontSize: 12, background: it.live ? "rgba(91,107,245,0.06)" : "transparent" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {it.live && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--indigo)", flexShrink: 0 }}/>}
              <span style={{ color: "var(--text)", fontWeight: 500 }}>{it.user}</span>
              <span style={{ color: "var(--text-muted)" }}>{it.action === "sold" ? "sold" : "bet"}</span>
              <span className="font-mono" style={{ color: "var(--text)" }}>${Math.round(it.amt).toLocaleString()}</span>
              <span style={{ color: it.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 600 }}>{it.side}</span>
            </div>
            <div style={{ display: "flex", gap: 12, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
              <span>@ {(it.price * 100).toFixed(1)}¢</span>
              <span>{it.live ? ago(it.at) : it.minsAgo + "m"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Risk disclosure banner (FEATURE 6) ----
function RiskBanner() {
  const social = React.useContext(SocialContext);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12, border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, background: "rgba(245,158,11,0.05)", overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", textAlign: "left" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--warn)" }}>⚠️ Risk disclosure — prediction markets involve significant risk</span>
        <span style={{ color: "var(--warn)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", fontSize: 10 }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Trading on Dead or Alive involves substantial risk of loss. You may lose your entire investment. Past performance does not guarantee future results. This platform is intended for entertainment and informational purposes. Do not bet more than you can afford to lose. Verify your local laws before participating.
          </p>
          <button onClick={() => social?.navigate({ name: "risk-disclosure" })} style={{ fontSize: 11, fontWeight: 600, color: "var(--indigo)", marginTop: 8 }}>Read full Risk Disclosure →</button>
        </div>
      )}
    </div>
  );
}

// ---- Multi-sig resolution explainer (FEATURE 1) ----
function MultiSigFlow() {
  const social = React.useContext(SocialContext);
  const [open, setOpen] = useState(false);
  const steps = [
    ["1", "Event Occurs", "A triggering event is detected (bankruptcy filing, SEC report, verified revenue collapse)."],
    ["2", "Resolution Committee", "3 independent resolution committee members review the evidence independently."],
    ["3", "Multi-Sig Confirms", "2-of-3 signatures required to confirm outcome on-chain. No single party can resolve alone."],
    ["4", "Payouts Sent", "Smart contract executes automatically. Payouts sent within 24 hours."],
  ];
  return (
    <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left" }}>
        <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v5c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V7l8-4z" stroke="var(--indigo)" strokeWidth="1.7" strokeLinejoin="round"/></svg>
          How resolution works
        </span>
        <span style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", fontSize: 11 }}>▼</span>
      </button>
      {open && (
        <div style={{ marginTop: 14 }}>
          {steps.map((s, i) => (
            <div key={s[0]} style={{ display: "flex", gap: 14, paddingBottom: 14, marginBottom: 14, borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none", position: "relative" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: "rgba(91,107,245,0.12)", border: "1px solid rgba(91,107,245,0.4)", color: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{s[0]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s[1]}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>{s[2]}</div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, padding: "10px 12px", background: "var(--bg-elev)", borderRadius: 8, border: "1px solid var(--border)" }}>
            Disputed resolutions enter a 48-hour challenge window. Any holder can submit counter-evidence.
          </div>
          <button onClick={() => social?.navigate({ name: "admin" })} style={{ fontSize: 12, fontWeight: 600, color: "var(--indigo)", marginTop: 12 }}>Resolution Authority →</button>
        </div>
      )}
    </div>
  );
}

// ---- Bear / Bull case (FEATURE 1) ----
function TheCase({ market }) {
  const bear = useMemo(() => pickArgs(market.name, DEAD_ARGS, 3), [market.name]);
  const bull = useMemo(() => pickArgs(market.name, ALIVE_ARGS, 3), [market.name]);
  const Col = ({ title, emoji, color, args }) => (
    <div className="card" style={{ padding: 18, borderLeft: `3px solid ${color}`, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color }}>{emoji} {title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {args.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            <span style={{ color, flexShrink: 0 }}>•</span>
            <span>{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>The Case</div>
      <div className="case-grid" style={{ display: "flex", gap: 16 }}>
        <Col title="Bear Case (DEAD)" emoji="💀" color="#EF4444" args={bear}/>
        <Col title="Bull Case (ALIVE)" emoji="🌱" color="#10B981" args={bull}/>
      </div>
    </div>
  );
}

// ---- Live Intelligence news feed (FEATURE 3) ----
function NewsFeed({ market }) {
  const items = useMemo(() => newsForMarket(market.id), [market.id]);
  const toneColor = (t) => t === "bearish" ? "var(--dead)" : t === "bullish" ? "var(--warn)" : "var(--text-muted)";
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 3l7.5 9.8L3.4 21H6l5.7-6.4L16.5 21H21l-7.9-10.3L20.5 3H18l-5.3 5.9L8.2 3H3z" fill="currentColor"/></svg>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Live Intelligence</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--indigo)", background: "rgba(91,107,245,0.10)", border: "1px solid rgba(91,107,245,0.3)", borderRadius: 6, padding: "3px 8px" }}>Powered by Grok</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(n => (
          <div key={n.id} style={{ padding: "12px 14px", borderRadius: 10, borderLeft: `3px solid ${toneColor(n.tone)}`, background: "var(--bg-elev)", border: "1px solid var(--border)", borderLeftWidth: 3, borderLeftColor: toneColor(n.tone) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: toneColor(n.tone), background: `${n.tone === "bearish" ? "rgba(239,68,68,0.12)" : n.tone === "bullish" ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.15)"}`, padding: "2px 7px", borderRadius: 5 }}>{n.type}</span>
              <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{n.source} · {n.time}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{n.headline}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bearish</span>
              <div style={{ flex: 1, height: 5, borderRadius: 999, background: "linear-gradient(90deg, var(--dead), var(--text-dim) 50%, var(--warn))", position: "relative" }}>
                <span style={{ position: "absolute", top: "50%", left: `${n.sentiment * 100}%`, transform: "translate(-50%,-50%)", width: 11, height: 11, borderRadius: "50%", background: "#fff", border: "2px solid var(--bg)", boxShadow: "0 0 0 1px rgba(0,0,0,0.4)" }}/>
              </div>
              <span style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bullish</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4, display: "flex", alignItems: "center", gap: 3 }}>▲ {n.upvotes}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Powered by Grok — real-time X data and AI analysis. Updated every 15 minutes.</span>
        <button className="btn btn-sm" style={{ borderColor: "rgba(91,107,245,0.4)", color: "var(--indigo)", background: "transparent" }}>Connect to live feed</button>
      </div>
    </div>
  );
}

// ---- Alert bell (FEATURE 3b) ----
function readAlerts() { try { return JSON.parse(localStorage.getItem("doa_alerts") || "[]"); } catch (e) { return []; } }
function AlertBell({ market }) {
  const social = React.useContext(SocialContext);
  const [on, setOn] = useState(() => readAlerts().includes(market.id));
  useEffect(() => { setOn(readAlerts().includes(market.id)); }, [market.id]);
  const toggle = () => {
    let arr = readAlerts();
    if (arr.includes(market.id)) {
      arr = arr.filter(x => x !== market.id);
      social?.showToast({ type: "info", message: `Alert removed` });
      setOn(false);
    } else {
      arr = [...arr, market.id];
      social?.showToast({ type: "info", message: `Alert set for ${market.name}` });
      setOn(true);
    }
    try { localStorage.setItem("doa_alerts", JSON.stringify(arr)); } catch (e) {}
    window.dispatchEvent(new Event("doa-alerts-changed"));
  };
  const color = on ? "var(--indigo)" : "var(--text-muted)";
  return (
    <button onClick={toggle} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 10, padding: "9px", borderRadius: 10, border: `1px solid ${on ? "rgba(91,107,245,0.4)" : "var(--border)"}`, background: on ? "rgba(91,107,245,0.08)" : "transparent", color, fontSize: 12, fontWeight: 600 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {on ? "Alert set ✓" : "Alert me when this moves 10%+"}
    </button>
  );
}

function BetTicket({ market, side, setSide, onConfirm, walletConnected, onConnect }) {
  const social = React.useContext(SocialContext);
  const paper = social?.paperMode;
  const m = market;
  const marketPrice = side === "DEAD" ? m.death : m.survives;
  const [amt, setAmt] = useState(100);
  const [orderType, setOrderType] = useState("market");          // 'market' | 'limit'
  const [limitPct, setLimitPct] = useState(() => Math.round(marketPrice * 100));
  const [placingLimit, setPlacingLimit] = useState(false);
  const isLimit = orderType === "limit" && !paper;
  const price = isLimit ? Math.min(0.98, Math.max(0.02, (+limitPct || 0) / 100)) : marketPrice;
  const shares = amt / Math.max(0.01, price);
  const grossPayout = shares; // pays $1 per share if right
  const platformFee = grossPayout * FEE_RATE;
  const netPayout = grossPayout - platformFee;
  const profit = netPayout - amt;
  const sideColor = side === "DEAD" ? "var(--dead)" : "var(--alive)";
  const limitIsMarketable = isLimit && marketPrice <= price;

  const placeLimitOrder = async () => {
    if (!walletConnected) { onConnect(); return; }
    if (!amt || amt <= 0) { social.showToast({ type: "error", message: "Enter an amount first." }); return; }
    setPlacingLimit(true);
    try {
      const r = await window.API.placeOrder(m.id, side, price, amt);
      social.syncMarket && social.syncMarket(r.market);
      social.refreshMe && social.refreshMe();
      social.showToast({
        type: r.order.status === "filled" ? "connected" : "info",
        message: r.order.status === "filled"
          ? `Limit order filled instantly — ${side} ${m.name} at market.`
          : `Limit order resting: ${side} ${m.name} at ${(price * 100).toFixed(0)}¢. $${amt} escrowed — manage it in Portfolio.`,
      });
    } catch (e) {
      social.showToast({ type: "error", message: e.message || "Order failed." });
    } finally { setPlacingLimit(false); }
  };

  return (
    <div className="card" style={{ padding: 18, ...(paper ? { borderColor: "rgba(245,158,11,0.4)" } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Place a bet</span>
        {paper && <span style={{ fontSize: 10, fontWeight: 700, color: "#0A0B14", background: "var(--warn)", borderRadius: 5, padding: "2px 7px" }}>📄 PAPER</span>}
      </div>

      {/* Side toggle - two big buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <button
          onClick={() => setSide("DEAD")}
          className={side === "DEAD" ? "btn dead" : "btn"}
          style={{ flexDirection: "column", padding: "16px 10px", gap: 2, ...(side !== "DEAD" ? { borderColor: "rgba(239,68,68,0.25)", color: "var(--dead)" } : {}) }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <Skull size={12} color={side === "DEAD" ? "white" : "currentColor"}/>AI kills it
          </span>
          <span className="font-mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmtPct(m.death)}</span>
        </button>
        <button
          onClick={() => setSide("ALIVE")}
          className={side === "ALIVE" ? "btn alive" : "btn"}
          style={{ flexDirection: "column", padding: "16px 10px", gap: 2, ...(side !== "ALIVE" ? { borderColor: "rgba(16,185,129,0.25)", color: "var(--alive)" } : {}) }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <HeartPulse size={12} color={side === "ALIVE" ? "white" : "currentColor"}/>Survives
          </span>
          <span className="font-mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmtPct(m.survives)}</span>
        </button>
      </div>

      {/* Order type: market (fill now) vs limit (rest until price hits) */}
      {!paper && (
        <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 9, marginBottom: 12 }}>
          {[["market", "Market"], ["limit", "Limit"]].map(([k, l]) => (
            <button key={k} onClick={() => setOrderType(k)} style={{ flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, color: orderType === k ? "var(--text)" : "var(--text-muted)", background: orderType === k ? "var(--surface)" : "transparent", border: orderType === k ? "1px solid var(--border-strong)" : "1px solid transparent" }}>{l}</button>
          ))}
        </div>
      )}

      {isLimit && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Limit price (max {side} price you'll pay)
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="number" min="2" max="98" step="1"
              className="input font-mono"
              value={limitPct}
              onChange={(e) => setLimitPct(e.target.value)}
              style={{ paddingRight: 30, fontSize: 16, fontWeight: 600 }}
            />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>¢</span>
          </div>
          <div style={{ fontSize: 11, color: limitIsMarketable ? "var(--warn)" : "var(--text-muted)", marginTop: 6 }}>
            {limitIsMarketable
              ? `Market is at ${(marketPrice * 100).toFixed(1)}¢ — this fills immediately.`
              : `Fills if ${side} drops to ${(price * 100).toFixed(0)}¢ (now ${(marketPrice * 100).toFixed(1)}¢). Stake is escrowed until filled or cancelled.`}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Amount (USD)</div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>$</span>
          <input
            type="number"
            className="input font-mono"
            value={amt}
            onChange={(e) => setAmt(Math.max(0, +e.target.value || 0))}
            style={{ paddingLeft: 28, fontSize: 18, fontWeight: 600 }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[10, 50, 100, 500, 1000].map(v => (
            <button key={v} className="chip font-mono" onClick={() => setAmt(v)} style={{ flex: 1, justifyContent: "center" }}>${v}</button>
          ))}
        </div>
      </div>

      {/* Calculator — FEATURE 1: 2% commission on winnings */}
      <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
        {[
          [isLimit ? "Limit price" : "Price", `${(price * 100).toFixed(1)}¢`, "var(--text)"],
          ["Shares", shares.toFixed(2), "var(--text)"],
          ["Gross payout", "$" + grossPayout.toFixed(2), "var(--text)"],
          ["Platform fee (2%)", "-$" + platformFee.toFixed(2), "var(--dead)", 0.7],
        ].map(([l, v, c, op]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
            <span style={{ color: "var(--text-muted)" }}>{l}</span>
            <span className="font-mono" style={{ color: c, fontWeight: 600, opacity: op || 1 }}>{v}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13 }}>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>Net payout</span>
          <span className="font-mono" style={{ color: paper ? "var(--warn)" : "var(--alive)", fontWeight: 700 }}>${netPayout.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
          <span style={{ color: "var(--text-muted)" }}>Potential profit</span>
          <span className="font-mono" style={{ color: profit >= 0 ? "var(--alive)" : "var(--dead)", fontWeight: 600 }}>{(profit >= 0 ? "+$" : "-$") + Math.abs(profit).toFixed(2)}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        2% fee applied to winning payouts only
      </div>

      {paper ? (
        <button className="btn" style={{ width: "100%", padding: "14px", fontSize: 14, background: "var(--warn)", borderColor: "var(--warn)", color: "#0A0B14", fontWeight: 700 }} onClick={() => onConfirm(side, amt)}>
          📄 Place Paper Bet · ${amt}
        </button>
      ) : walletConnected ? (
        isLimit ? (
          <button className="btn primary" disabled={placingLimit} style={{ width: "100%", padding: "14px", fontSize: 14, opacity: placingLimit ? 0.6 : 1 }} onClick={placeLimitOrder}>
            {placingLimit ? "Placing…" : `Place Limit Order · ${side} @ ${(price * 100).toFixed(0)}¢ · $${amt}`}
          </button>
        ) : (
          <button className="btn primary" style={{ width: "100%", padding: "14px", fontSize: 14, background: sideColor, borderColor: sideColor }} onClick={() => onConfirm(side, amt)}>
            Buy {side} · ${amt}
          </button>
        )
      ) : (
        <button className="btn primary" style={{ width: "100%", padding: "14px", fontSize: 14 }} onClick={onConnect}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="2.5" y="6" width="19" height="13" rx="3" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M16 12.5h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M2.5 9.5h12" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          Connect Wallet to Bet
        </button>
      )}

      {/* FEATURE 3b — alert bell */}
      <AlertBell market={m}/>

      {/* FEATURE 6 — risk disclosure */}
      <RiskBanner/>

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
        Cash-settled at $1 / share on resolution. By placing this bet you agree to the resolution criteria above.
      </p>
    </div>
  );
}

// ---- Comments (FEATURE 2c) ----
function CommentsSection({ market }) {
  const social = React.useContext(SocialContext);
  const [draft, setDraft] = useState("");
  const comments = social.getComments(market.id);

  const post = () => {
    if (!draft.trim()) return;
    social.addComment(market.id, draft.trim());
    setDraft("");
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12a8 8 0 01-11.6 7.1L3 20l1-6a8 8 0 1117 -2z" stroke="var(--indigo)" strokeWidth="1.8" strokeLinejoin="round"/></svg>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Discussion</span>
        <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{comments.length}</span>
      </div>

      {/* Composer */}
      {social.walletConnected ? (
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <Avatar username={social.currentUser.username} hue={social.currentUser.hue} size={34}/>
          <div style={{ flex: 1 }}>
            <textarea
              className="input"
              placeholder={`Share your take on ${market.name}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              style={{ resize: "vertical", minHeight: 56 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn primary btn-sm" onClick={post} disabled={!draft.trim()} style={{ opacity: draft.trim() ? 1 : 0.5 }}>Post</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={social.onConnect} className="btn" style={{ width: "100%", padding: "12px", marginBottom: 18, borderColor: "rgba(91,107,245,0.4)", color: "var(--indigo)" }}>
          Connect wallet to comment
        </button>
      )}

      {/* Thread */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {comments.map(c => {
          const up = social.isUpvoted(c.id);
          const isMine = c.user.username === social.currentUser.username;
          return (
            <div key={c.id} style={{ display: "flex", gap: 10 }}>
              <Avatar username={c.user.username} hue={c.user.hue} size={34}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <button onClick={() => !isMine && social.navigate({ name: "profile", username: c.user.username })} style={{ fontSize: 13, fontWeight: 600 }}>@{c.user.username}</button>
                  {(() => { const b = getCategoryBadge(c.user.username, market.category); return b ? <CategoryBadge badge={b} compact={true}/> : null; })()}
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.minsAgo < 60 ? c.minsAgo + "m" : Math.floor(c.minsAgo / 60) + "h"} ago</span>
                </div>
                <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{c.text}</p>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                  <button onClick={() => social.upvoteComment(c.id)} style={{ display: "flex", gap: 5, alignItems: "center", color: up ? "var(--indigo)" : "var(--text-muted)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={up ? "currentColor" : "none"}><path d="M7 11v8H4a1 1 0 01-1-1v-6a1 1 0 011-1h3zm0 0l4-7a2 2 0 012 2v3h4.5a2 2 0 011.9 2.6l-1.8 6A2 2 0 0115.7 19H7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                    {c.upvotes + (up ? 1 : 0)}
                  </button>
                  <button style={{ color: "var(--text-muted)" }}>Reply{c.replies ? ` (${c.replies})` : ""}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Challenge creator (FEATURE 3a) ----
function ChallengeCreator({ market }) {
  const social = React.useContext(SocialContext);
  const [side, setSide] = useState("DEAD");
  const [amt, setAmt] = useState(100);
  const [opp, setOpp] = useState("");
  const [show, setShow] = useState(false);

  const matches = useMemo(() => {
    if (!opp.trim()) return [];
    const q = opp.toLowerCase().replace(/^@/, "");
    return LEADERBOARD.filter(u => u.username.toLowerCase().includes(q)).slice(0, 5);
  }, [opp]);

  const send = () => {
    if (!social.walletConnected) { social.onConnect(); return; }
    social.sendChallenge({ market, yourSide: side, stake: amt, opponent: opp.trim() ? lbUser(opp) : null });
    setOpp("");
  };

  return (
    <div className="card" style={{ padding: 18, borderColor: "rgba(245,158,11,0.25)", background: "linear-gradient(180deg, rgba(245,158,11,0.05), transparent 40%), var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>⚔️</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Head-to-Head</span>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--text-muted)" }}>Bet directly against another trader.</p>

      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Your side</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setSide("DEAD")} className={side === "DEAD" ? "btn dead" : "btn"} style={side !== "DEAD" ? { borderColor: "rgba(239,68,68,0.25)", color: "var(--dead)" } : {}}>
          <Skull size={13} color={side === "DEAD" ? "white" : "currentColor"}/> DEAD
        </button>
        <button onClick={() => setSide("ALIVE")} className={side === "ALIVE" ? "btn alive" : "btn"} style={side !== "ALIVE" ? { borderColor: "rgba(16,185,129,0.25)", color: "var(--alive)" } : {}}>
          <HeartPulse size={13} color={side === "ALIVE" ? "white" : "currentColor"}/> ALIVE
        </button>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Challenge amount (each side)</div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>$</span>
        <input type="number" className="input font-mono" value={amt} onChange={(e) => setAmt(Math.max(1, +e.target.value || 0))} style={{ paddingLeft: 28, fontWeight: 600 }}/>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Challenge a trader <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional — leave blank for open)</span></div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input
          className="input"
          placeholder="@username"
          value={opp}
          onChange={(e) => { setOpp(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 150)}
        />
        {show && matches.length > 0 && (
          <div className="card" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, padding: 4, zIndex: 20, maxHeight: 200, overflowY: "auto" }}>
            {matches.map(u => (
              <button key={u.username} onMouseDown={() => { setOpp(u.username); setShow(false); }} style={{ display: "flex", gap: 8, alignItems: "center", width: "100%", padding: "8px 10px", borderRadius: 6, textAlign: "left" }}>
                <Avatar username={u.username} hue={u.hue} size={24}/>
                <span style={{ fontSize: 13 }}>@{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="btn primary" style={{ width: "100%", padding: "12px" }} onClick={send}>
        {social.walletConnected ? "Send Challenge · $" + amt : "Connect wallet to challenge"}
      </button>
      <button onClick={() => social.navigate({ name: "challenges" })} style={{ display: "block", width: "100%", textAlign: "center", marginTop: 10, fontSize: 12, color: "var(--indigo)", fontWeight: 500 }}>
        Or browse open challenges on this market →
      </button>
    </div>
  );
}

function MarketDetailPage({ marketId, navigate, onConfirmBet, walletConnected, onConnect, showToast }) {
  const m = MARKETS.find(x => x.id === marketId);
  const [side, setSide] = useState(m.death >= m.survives ? "DEAD" : "ALIVE");
  const [tf, setTf] = useState("1M");
  const [sheetOpen, setSheetOpen] = useState(false); // FEATURE 5b/5d mobile bet sheet

  if (!m) return <div style={{ padding: 80, textAlign: "center" }}>Market not found.</div>;

  // FEATURE 6c — canvas share card
  const copyCard = () => {
    const cv = document.createElement("canvas");
    cv.width = 1200; cv.height = 630;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#0A0B14"; ctx.fillRect(0, 0, 1200, 630);
    // bottom bar proportional to death%
    const barH = 14;
    ctx.fillStyle = "#10B981"; ctx.fillRect(0, 630 - barH, 1200, barH);
    ctx.fillStyle = "#EF4444"; ctx.fillRect(0, 630 - barH, 1200 * m.death, barH);
    // brand
    ctx.fillStyle = "#5B6BF5"; ctx.font = "700 30px 'Space Grotesk', sans-serif";
    ctx.fillText("💀 DEAD OR ALIVE", 64, 90);
    // headline
    ctx.fillStyle = "#6B7280"; ctx.font = "500 34px Inter, sans-serif";
    ctx.fillText("Will AI Kill", 64, 250);
    ctx.fillStyle = "#F9FAFB"; ctx.font = "700 72px 'Space Grotesk', sans-serif";
    ctx.fillText(m.name, 64, 330);
    ctx.fillStyle = "#EF4444"; ctx.font = "700 100px 'JetBrains Mono', monospace";
    ctx.fillText(fmtPct(m.death), 64, 460);
    ctx.fillStyle = "#6B7280"; ctx.font = "500 26px Inter, sans-serif";
    ctx.fillText("of traders predict AI wipes it out", 64, 510);
    ctx.fillStyle = "#4B5563"; ctx.font = "500 24px 'JetBrains Mono', monospace";
    ctx.textAlign = "right"; ctx.fillText("deadoralive.io", 1136, 560); ctx.textAlign = "left";
    cv.toBlob((blob) => {
      if (!blob) return;
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(
          () => showToast?.({ type: "info", message: "Card copied to clipboard!" }),
          () => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = m.slug + "-card.png"; a.click(); showToast?.({ type: "info", message: "Card downloaded." }); }
        );
      } else {
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = m.slug + "-card.png"; a.click();
        showToast?.({ type: "info", message: "Card downloaded." });
      }
    }, "image/png");
  };

  // FIX 9 — share handlers
  const copyLink = () => {
    const url = window.location.href;
    const done = () => showToast?.({ type: "info", message: "Link copied!" });
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => {
        try { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); done(); } catch (e) {}
      });
    } else {
      try { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); done(); } catch (e) {}
    }
  };
  const tweet = () => {
    const text = `I just bet ${m.name} gets wiped out by AI 💀 — ${window.location.href} #DeadOrAlive #AI`;
    window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(text), "_blank", "noopener");
  };

  // Series slice based on timeframe
  const sliced = useMemo(() => {
    if (tf === "1D") return m.series.slice(-2);
    if (tf === "1W") return m.series.slice(-8);
    if (tf === "1M") return m.series.slice(-30);
    return m.series;
  }, [tf, m.series]);

  const related = useMemo(() => MARKETS.filter(x => x.category === m.category && x.id !== m.id).slice(0, 5), [m]);

  return (
    <div style={{ padding: "24px 32px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          <button onClick={() => navigate({ name: "markets" })} style={{ color: "var(--text-muted)" }}>Markets</button>
          <span>/</span>
          <span>{m.category}</span>
          <span>/</span>
          <span style={{ color: "var(--text)" }}>{m.name}</span>
        </div>

        {/* Resolved banner — outcome + public reason + source */}
        {m.status === "resolved" && (
          <div style={{ padding: "14px 18px", marginBottom: 16, borderRadius: 12, background: m.outcome === "DEAD" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${m.outcome === "DEAD" ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 700, color: m.outcome === "DEAD" ? "var(--dead)" : "var(--alive)" }}>
              <span>{m.outcome === "DEAD" ? "💀" : "💚"}</span>
              <span>RESOLVED {m.outcome} — betting is closed. Winning shares settled at $1.00 (2% fee on winnings).</span>
            </div>
            {m.resolutionReason && <div style={{ fontSize: 13, color: "var(--text)", marginTop: 8, lineHeight: 1.6 }}>{m.resolutionReason}</div>}
            {m.resolutionSource && (
              <a href={m.resolutionSource} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--indigo)", marginTop: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M10 14L21 3M21 3h-6M21 3v6M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                View source
              </a>
            )}
          </div>
        )}

        {/* FEATURE 3 — urgency banner */}
        {m.status !== "resolved" && m.daysLeft <= 30 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", marginBottom: 16, borderRadius: 10, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.4)", color: "var(--dead)", fontSize: 13, fontWeight: 600 }}>
            <span className="pulse-urgent" style={{ fontSize: 14 }}>🔴</span>
            <span>This market closes in {m.daysLeft} days. Final bets are open.</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <Logo name={m.name} size={64} hue={m.logo.hue} initials={m.logo.initials}/>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <CatTag category={m.category}/>
              <span className="pill live"><span className="dot"/>LIVE</span>
              <WatchingPill marketId={m.id}/>
            </div>
            <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Will AI kill {m.name}?</h1>
          </div>
          {/* FIX 9 — share buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={copyLink} title="Copy link" style={{ padding: "8px 12px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9.5 14.5l5-5M8 12l-2 2a3.5 3.5 0 005 5l2-2M16 12l2-2a3.5 3.5 0 00-5-5l-2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Copy link
            </button>
            <button className="btn btn-sm" onClick={tweet} title="Share on X" style={{ padding: "8px 12px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 3l7.5 9.8L3.4 21H6l5.7-6.4L16.5 21H21l-7.9-10.3L20.5 3H18l-5.3 5.9L8.2 3H3z" fill="currentColor"/></svg>
              Tweet
            </button>
            <button className="btn btn-sm" onClick={copyCard} title="Copy share card" style={{ padding: "8px 12px" }}>
              📋 Copy card
            </button>
          </div>
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
            {[
              ["Volume", fmtMoney(m.volume)],
              ["Traders", m.traders.toLocaleString()],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{v}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Resolves in</div>
              <div style={{ marginTop: 2 }}><CountdownPill daysLeft={m.daysLeft}/></div>
            </div>
          </div>
        </div>

        <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Big odds card */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ display: "flex", gap: 28 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>AI kills it</div>
                    <div className="font-mono" style={{ fontSize: 32, fontWeight: 600, color: "var(--dead)", lineHeight: 1 }}>{fmtPct1(m.death)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Survives</div>
                    <div className="font-mono" style={{ fontSize: 32, fontWeight: 600, color: "var(--alive)", lineHeight: 1 }}>{fmtPct1(m.survives)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>24h Δ</div>
                    <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: m.change24h > 0 ? "var(--dead)" : "var(--alive)", lineHeight: 1 }}>
                      {m.change24h > 0 ? "▲" : "▼"} {fmtSigned(Math.abs(m.change24h))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["1D", "1W", "1M", "All"].map(t => (
                    <button key={t} onClick={() => setTf(t)} className={tf === t ? "chip active" : "chip"} style={{ minWidth: 42, justifyContent: "center" }}>{t}</button>
                  ))}
                </div>
              </div>
              <PriceChart series={sliced} height={260}/>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Volume</div>
                <VolumeBars series={sliced} height={60}/>
              </div>
            </div>

            {/* FEATURE 6 — AI vs crowd signal */}
            <AISignalCard market={m}/>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <OrderBook market={m} side={side}/>
              <ActivityFeed market={m}/>
            </div>

            {/* Resolution */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Resolution criteria
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                This market resolves <strong style={{ color: "var(--dead)" }}>DEAD</strong> if any of the following occur before <strong style={{ color: "var(--text)" }}>{new Date(Date.now() + m.daysLeft * 86400000).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</strong>:
              </p>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                <li>{m.name} files for Chapter 7 or Chapter 11 bankruptcy.</li>
                <li>{m.name} is acquired in a distress sale at &lt;25% of trailing 12-month peak market cap.</li>
                <li>{m.name} reports an 80%+ year-over-year revenue collapse in a quarterly filing.</li>
                <li>{m.name} announces wind-down or ceases primary operations.</li>
              </ul>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Otherwise this market resolves <strong style={{ color: "var(--alive)" }}>ALIVE</strong>. Settled at $1.00 per share to the correct side.
              </p>

              {/* FEATURE 1 — multi-sig resolution explainer */}
              <MultiSigFlow/>
            </div>

            {/* About */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>AI disruption thesis</div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                {m.name} operates in <strong style={{ color: "var(--text)" }}>{m.category}</strong>, a sector where automation has compressed unit economics meaningfully over the past 24 months. The base rate of failure for incumbents in this category is <span className="font-mono" style={{ color: "var(--text)" }}>{fmtPct((MARKETS.filter(x => x.category === m.category).reduce((s, x) => s + x.death, 0) / MARKETS.filter(x => x.category === m.category).length))}</span>.
                Use this as anchoring for your bet — markets reflect crowd belief, not ground truth.
              </p>
            </div>

            {/* FEATURE 1 — Bear / Bull case */}
            <TheCase market={m}/>

            {/* FEATURE 3 — Live Intelligence */}
            <NewsFeed market={m}/>

            {/* Discussion (FEATURE 2c) */}
            <CommentsSection market={m}/>
          </div>

          {/* Right column */}
          <div className="detail-right detail-right-sticky" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <BetTicket market={m} side={side} setSide={setSide} onConfirm={onConfirmBet} walletConnected={walletConnected} onConnect={onConnect}/>

            {/* Head-to-Head (FEATURE 3a) */}
            <ChallengeCreator market={m}/>

            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>Related markets</div>
              {related.map(r => {
                const fav = r.death >= r.survives ? "DEAD" : "ALIVE";
                return (
                  <button key={r.id} onClick={() => navigate({ name: "market", id: r.id })} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 14px", borderBottom: "1px solid rgba(31,41,55,0.5)", textAlign: "left" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                      <Logo name={r.name} size={28} hue={r.logo.hue} initials={r.logo.initials}/>
                      <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{r.name}</span>
                    </div>
                    <span className="font-mono" style={{ fontSize: 12, color: fav === "DEAD" ? "var(--dead)" : "var(--alive)" }}>{fmtPct(Math.max(r.death, r.survives))}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE 5d — mobile FAB */}
      <button className="bet-fab" onClick={() => setSheetOpen(true)} title="Place a bet">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {/* FEATURE 5b — mobile bet bottom sheet */}
      {sheetOpen && (
        <BetBottomSheet onClose={() => setSheetOpen(false)}>
          <BetTicket market={m} side={side} setSide={setSide} onConfirm={(s, a) => { onConfirmBet(s, a); setSheetOpen(false); }} walletConnected={walletConnected} onConnect={onConnect}/>
        </BetBottomSheet>
      )}
    </div>
  );
}

// ---- Mobile bet bottom sheet (FEATURE 5b) ----
function BetBottomSheet({ onClose, children }) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef(null);
  const onStart = (e) => { startY.current = (e.touches ? e.touches[0].clientY : e.clientY); };
  const onMove = (e) => {
    if (startY.current == null) return;
    const y = (e.touches ? e.touches[0].clientY : e.clientY);
    const d = y - startY.current;
    if (d > 0) setDragY(d);
  };
  const onEnd = () => {
    if (dragY > 80) onClose();
    else setDragY(0);
    startY.current = null;
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s ease" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxHeight: "85vh", overflowY: "auto", background: "#111827", borderRadius: "16px 16px 0 0", padding: "8px 16px 24px", transform: `translateY(${dragY}px)`, transition: startY.current == null ? "transform 0.2s ease" : "none", animation: "sheetUp 0.28s ease" }}>
        <div onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          style={{ display: "flex", justifyContent: "center", padding: "8px 0 14px", cursor: "grab", touchAction: "none" }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "#374151" }}/>
        </div>
        {children}
      </div>
      <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

// ---- Portfolio ----
// Pull the signed-in user's real positions and shape them like the seeded demo
// data so the rest of PortfolioPage works unchanged. Returns null when logged out
// (page then falls back to the seeded demo portfolio).
function useLivePortfolio(authed, tick) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    if (!authed) { setData(null); return; }
    const findM = (id) =>
      (window.MARKETS || []).find((x) => x.id === id) ||
      { id, name: "?", category: "", logo: { hue: 210, initials: "?" }, death: 0.5, survives: 0.5 };
    window.API.portfolio()
      .then((pf) => {
        if (!alive) return;
        const positions = pf.open.map((p) => {
          const market = findM(p.marketId);
          return { betId: p.id, market, side: p.side, shares: p.shares, avgPrice: p.price,
            currentPrice: p.currentPrice, cost: p.stake, value: p.value, pnl: p.pnl,
            pct: p.pnl / Math.max(1, p.stake), paper: p.paper };
        });
        const resolved = pf.resolved.map((r) => {
          const market = findM(r.marketId);
          return { market, side: r.side, shares: r.shares, cost: r.stake,
            grossPayout: r.grossPayout, fee: r.fee, payout: r.netPayout, pnl: r.pnl,
            outcome: r.outcome,
            resolvedDaysAgo: r.resolvedAt ? Math.max(0, Math.round((Date.now() - r.resolvedAt) / 86400000)) : 0 };
        });
        setData({ positions, resolved });
      })
      .catch(() => setData({ positions: [], resolved: [] }));
    return () => { alive = false; };
  }, [authed, tick]);
  return data;
}

// Signed-in user's resting + recent limit orders, with cancel.
function OpenOrdersCard({ tick, onChanged }) {
  const social = React.useContext(SocialContext);
  const [orders, setOrders] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    window.API.myOrders().then((r) => { if (alive) setOrders(r.orders); }).catch(() => setOrders([]));
    return () => { alive = false; };
  }, [tick]);
  if (!orders || orders.length === 0) return null;
  const cancel = async (o) => {
    try {
      await window.API.cancelOrder(o.id);
      social.showToast({ type: "info", message: `Order cancelled — $${o.stake} refunded.` });
      social.refreshMe && social.refreshMe();
      onChanged && onChanged();
    } catch (e) { social.showToast({ type: "error", message: e.message }); }
  };
  const statusStyle = (s) =>
    s === "open" ? { background: "rgba(91,107,245,0.12)", color: "var(--indigo)" }
    : s === "filled" ? { background: "rgba(16,185,129,0.12)", color: "var(--alive)" }
    : { background: "rgba(107,114,128,0.15)", color: "var(--text-muted)" };
  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Limit orders</span>
        <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{orders.filter(o => o.status === "open").length} resting</span>
      </div>
      <table className="data">
        <thead>
          <tr>
            <th>Market</th><th>Side</th>
            <th style={{ textAlign: "right" }}>Limit</th>
            <th style={{ textAlign: "right" }}>Stake</th>
            <th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="row">
              <td style={{ fontWeight: 500 }}>{o.market}</td>
              <td><span style={{ color: o.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 600, fontSize: 12 }}>{o.side}</span></td>
              <td className="font-mono" style={{ textAlign: "right" }}>{(o.limitPrice * 100).toFixed(1)}¢</td>
              <td className="font-mono" style={{ textAlign: "right" }}>{fmtMoney(o.stake)}</td>
              <td><span style={{ display: "inline-flex", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", ...statusStyle(o.status) }}>{o.status}</span></td>
              <td style={{ textAlign: "right" }}>
                {o.status === "open" && (
                  <button className="btn btn-sm" onClick={() => cancel(o)}>Cancel</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PortfolioPage({ navigate, walletConnected }) {
  const social = React.useContext(SocialContext);
  const [pfTick, setPfTick] = React.useState(0);
  const [closing, setClosing] = React.useState(null); // betId in flight
  const live = useLivePortfolio(walletConnected, pfTick);

  const handleClose = async (p, e) => {
    e.stopPropagation();
    if (!walletConnected || !p.betId) { social.showToast({ type: "wallet" }); return; }
    if (closing) return;
    setClosing(p.betId);
    try {
      const r = await window.API.closeBet(p.betId);
      social.syncMarket && social.syncMarket(r.market);
      social.refreshMe && social.refreshMe();
      setPfTick((t) => t + 1);
      social.showToast({ type: "connected", message: `Closed ${r.closed.market} ${r.closed.side} — $${r.closed.netProceeds.toFixed(2)} back to balance (fee $${r.closed.fee.toFixed(2)}).` });
    } catch (err) {
      social.showToast({ type: "error", message: err.message || "Close failed." });
    } finally { setClosing(null); }
  };
  const POSITIONS = live ? live.positions : (window.POSITIONS || []);
  const RESOLVED = live ? live.resolved : (window.RESOLVED || []);
  const totalValue = POSITIONS.reduce((s, p) => s + p.value, 0);
  const totalCost = POSITIONS.reduce((s, p) => s + p.cost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPct = totalPnl / Math.max(1, totalCost);
  const winRate = RESOLVED.filter(r => r.outcome === "WON").length / Math.max(1, RESOLVED.length);
  const equityRef = useRef(null);
  const eqChartRef = useRef(null);

  useEffect(() => {
    if (!equityRef.current) return;
    const ctx = equityRef.current.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, "rgba(91,107,245,0.30)");
    grad.addColorStop(1, "rgba(91,107,245,0)");
    if (eqChartRef.current) eqChartRef.current.destroy();
    eqChartRef.current = new Chart(ctx, {
      type: "line",
      data: { labels: PORTFOLIO_EQUITY.map((_, i) => i + 1), datasets: [{ data: PORTFOLIO_EQUITY, borderColor: "#5B6BF5", backgroundColor: grad, fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0F1120", borderColor: "#2A3347", borderWidth: 1 } },
        scales: { x: { display: false }, y: { ticks: { color: "#6B7280", callback: v => "$" + v, font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { color: "rgba(31,41,55,0.4)" } } },
      },
    });
    return () => { if (eqChartRef.current) { eqChartRef.current.destroy(); eqChartRef.current = null; } };
  }, []);

  const StatCard = ({ label, value, sub, color }) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 26, fontWeight: 600, marginTop: 4, color: color || "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "32px", maxWidth: 1320, margin: "0 auto" }}>
      {/* FIX 6 — demo portfolio banner when wallet not connected */}
      {!walletConnected && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 18, background: "rgba(91,107,245,0.08)", border: "1px solid rgba(91,107,245,0.28)", borderRadius: 10, fontSize: 13, color: "var(--text)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" stroke="var(--indigo)" strokeWidth="1.8"/><path d="M12 11v5M12 8h.01" stroke="var(--indigo)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <span>Showing demo portfolio — connect wallet to see your real positions.</span>
        </div>
      )}

      {/* FEATURE 5 — paper trading panel */}
      {social?.paperMode && (
        <div className="card" style={{ padding: 18, marginBottom: 18, borderColor: "rgba(245,158,11,0.4)", background: "linear-gradient(180deg, rgba(245,158,11,0.06), transparent 50%), var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>📄 Paper balance</div>
                <div className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--warn)", marginTop: 2 }}>${social.paperBalance.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Paper P&L</div>
                <div className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: social.paperBalance >= 10000 ? "var(--alive)" : "var(--dead)", marginTop: 2 }}>{(social.paperBalance - 10000 >= 0 ? "+" : "") + fmtMoney(social.paperBalance - 10000)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Paper win rate</div>
                <div className="font-mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>{fmtPct(winRate)}</div>
              </div>
            </div>
            <button className="btn" onClick={() => social.requestSwitchLive()} style={{ borderColor: "rgba(245,158,11,0.5)", color: "var(--warn)" }}>Switch to Live →</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Portfolio</h1>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>You vs. the AI apocalypse.</div>
      </div>

      <div className="portfolio-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="Portfolio value" value={fmtMoney(totalValue)} sub={`from ${fmtMoney(totalCost)} invested`}/>
        <StatCard label="Total P&L" value={(totalPnl >= 0 ? "+" : "") + fmtMoney(totalPnl)} sub={(totalPct * 100).toFixed(1) + "%"} color={totalPnl >= 0 ? "var(--alive)" : "var(--dead)"}/>
        <StatCard label="Win rate" value={fmtPct(winRate)} sub={`${RESOLVED.filter(r => r.outcome === "WON").length} / ${RESOLVED.length} resolved`}/>
        {(() => {
          const streak = currentStreak(RESOLVED);
          const val = streak === 0 ? "—" : streak > 0 ? `🔥 ${streak}W` : `🧊 ${-streak}L`;
          return <StatCard label="Current streak" value={val} sub={streak > 0 ? "on a heater" : streak < 0 ? "due for a bounce" : "no streak"} color={streak > 0 ? "var(--warn)" : streak < 0 ? "var(--indigo)" : "var(--text)"}/>;
        })()}
        <StatCard label="Open positions" value={POSITIONS.length.toString()} sub={`across ${new Set(POSITIONS.map(p => p.market.category)).size} sectors`}/>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Equity curve · 90 days</span>
          <span className="font-mono" style={{ fontSize: 13, color: "var(--alive)" }}>+{(((PORTFOLIO_EQUITY[PORTFOLIO_EQUITY.length-1] / PORTFOLIO_EQUITY[0]) - 1) * 100).toFixed(1)}%</span>
        </div>
        <div style={{ height: 220 }}><canvas ref={equityRef}/></div>
      </div>

      <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Open positions</span>
          <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{POSITIONS.length} active</span>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Market</th><th>Side</th><th style={{ textAlign: "right" }}>Shares</th>
              <th style={{ textAlign: "right" }}>Avg</th><th style={{ textAlign: "right" }}>Now</th>
              <th style={{ textAlign: "right" }}>Value</th><th style={{ textAlign: "right" }}>P&L</th><th></th>
            </tr>
          </thead>
          <tbody>
            {POSITIONS.map((p, i) => (
              <tr key={i} className="row" onClick={() => navigate({ name: "market", id: p.market.id })} style={{ cursor: "pointer" }}>
                <td>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Logo name={p.market.name} size={28} hue={p.market.logo.hue} initials={p.market.logo.initials}/>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.market.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.market.category}</div>
                    </div>
                  </div>
                </td>
                <td><span style={{ color: p.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 600, fontSize: 12 }}>{p.side}</span></td>
                <td className="font-mono" style={{ textAlign: "right" }}>{p.shares}</td>
                <td className="font-mono" style={{ textAlign: "right", color: "var(--text-muted)" }}>{(p.avgPrice * 100).toFixed(1)}¢</td>
                <td className="font-mono" style={{ textAlign: "right" }}>{(p.currentPrice * 100).toFixed(1)}¢</td>
                <td className="font-mono" style={{ textAlign: "right" }}>{fmtMoney(p.value)}</td>
                <td className="font-mono" style={{ textAlign: "right", color: p.pnl >= 0 ? "var(--alive)" : "var(--dead)", fontWeight: 600 }}>
                  {(p.pnl >= 0 ? "+" : "") + fmtMoney(p.pnl)}
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{(p.pct * 100).toFixed(1)}%</div>
                </td>
                <td>
                  <button
                    className="btn btn-sm"
                    disabled={closing === p.betId}
                    onClick={(e) => handleClose(p, e)}
                    title={p.betId ? `Sell ${p.shares} shares at ${(p.currentPrice * 100).toFixed(1)}¢ (2% fee on proceeds)` : "Demo position"}
                    style={closing === p.betId ? { opacity: 0.5 } : {}}
                  >{closing === p.betId ? "Closing…" : "Close"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Limit orders (live accounts only) */}
      {walletConnected && <OpenOrdersCard tick={pfTick} onChanged={() => setPfTick((t) => t + 1)}/>}

      {/* FEATURE 1 — Recovery picks (shown when holding a losing position) */}
      {POSITIONS.some(p => p.pnl < 0) && (() => {
        const wonCats = new Set([
          ...RESOLVED.filter(r => r.outcome === "WON").map(r => r.market.category),
          ...POSITIONS.filter(p => p.pnl >= 0).map(p => p.market.category),
        ]);
        const held = new Set(POSITIONS.map(p => p.market.id));
        let pool = MARKETS.filter(m => wonCats.has(m.category) && !held.has(m.id));
        if (pool.length < 4) pool = MARKETS.filter(m => !held.has(m.id));
        const picks = [...pool].sort((a, b) => (b.volume * Math.abs(b.change24h)) - (a.volume * Math.abs(a.change24h))).slice(0, 4);
        return (
          <div style={{ marginBottom: 18 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>📈 Recovery picks — markets trending your way.</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>From categories you've won in before. Get back on the board.</div>
            </div>
            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 6 }}>
              {picks.map(m => (
                <div key={m.id} style={{ flex: "0 0 320px", maxWidth: 320 }}>
                  <MarketCard
                    market={m}
                    onOpen={(mk) => navigate({ name: "market", id: mk.id })}
                    onQuickBet={(mk, side, amt) => social?.quickBet ? social.quickBet(mk, side, amt) : navigate({ name: "market", id: mk.id })}
                    onShare={(mk) => social?.openShare({ market: mk })}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Resolved positions</span>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Market</th><th>Side</th><th>Outcome</th>
              <th style={{ textAlign: "right" }}>Shares</th>
              <th style={{ textAlign: "right" }}>Cost</th>
              <th style={{ textAlign: "right" }}>Gross</th>
              <th style={{ textAlign: "right" }}>Fee</th>
              <th style={{ textAlign: "right" }}>Net payout</th>
              <th style={{ textAlign: "right" }}>P&L</th>
              <th style={{ textAlign: "right" }}>Resolved</th>
            </tr>
          </thead>
          <tbody>
            {RESOLVED.map((r, i) => (
              <tr key={i} className="row">
                <td>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Logo name={r.market.name} size={26} hue={r.market.logo.hue} initials={r.market.logo.initials}/>
                    <span style={{ fontWeight: 500 }}>{r.market.name}</span>
                  </div>
                </td>
                <td><span style={{ color: r.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 600, fontSize: 12 }}>{r.side}</span></td>
                <td>
                  <span style={{
                    display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0,
                    fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    background: r.outcome === "WON" ? "rgba(16,185,129,0.12)" : r.outcome === "CLOSED" ? "rgba(91,107,245,0.12)" : "rgba(239,68,68,0.12)",
                    color: r.outcome === "WON" ? "var(--alive)" : r.outcome === "CLOSED" ? "var(--indigo)" : "var(--dead)",
                  }}>{r.outcome}</span>
                </td>
                <td className="font-mono" style={{ textAlign: "right" }}>{r.shares}</td>
                <td className="font-mono" style={{ textAlign: "right", color: "var(--text-muted)" }}>{fmtMoney(r.cost)}</td>
                <td className="font-mono" style={{ textAlign: "right", color: "var(--text-muted)" }}>{r.grossPayout > 0 ? fmtMoney(r.grossPayout) : "—"}</td>
                <td className="font-mono" style={{ textAlign: "right", color: r.fee > 0 ? "var(--dead)" : "var(--text-dim)", opacity: r.fee > 0 ? 0.8 : 1 }}>{r.fee > 0 ? "-" + fmtMoney(r.fee) : "—"}</td>
                <td className="font-mono" style={{ textAlign: "right" }}>{fmtMoney(r.payout)}</td>
                <td className="font-mono" style={{ textAlign: "right", color: r.pnl >= 0 ? "var(--alive)" : "var(--dead)", fontWeight: 600 }}>
                  {(r.pnl >= 0 ? "+" : "") + fmtMoney(r.pnl)}
                </td>
                <td className="font-mono" style={{ textAlign: "right", color: "var(--text-muted)" }}>{r.resolvedDaysAgo}d ago</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Leaderboard ----
function LeaderboardPage({ navigate }) {
  const [tab, setTab] = useState("weekly");
  return (
    <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Leaderboard</h1>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Top traders ranked by realized profit.</div>
        </div>
        <div style={{ display: "flex", gap: 6, padding: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
          {[["weekly", "This week"], ["monthly", "This month"], ["all", "All time"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, color: tab === k ? "var(--text)" : "var(--text-muted)", background: tab === k ? "var(--bg-elev)" : "transparent" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      <div className="podium" style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 14, marginBottom: 18, alignItems: "end" }}>
        {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((u, i) => {
          const real = i === 1 ? 1 : i === 0 ? 2 : 3;
          const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
          const heights = { 1: 210, 2: 185, 3: 170 };
          return (
            <div key={u.username} className="card" style={{ padding: 20, minHeight: heights[real], display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14, borderColor: real === 1 ? "rgba(91,107,245,0.4)" : "var(--border)", background: real === 1 ? "linear-gradient(180deg, rgba(91,107,245,0.10), transparent), var(--surface)" : "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                  <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "50%", background: `oklch(0.4 0.12 ${u.hue})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: `oklch(0.96 0.04 ${u.hue})` }}>{u.username[0].toUpperCase()}</div>
                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => navigate({ name: "profile", username: u.username })} style={{ fontSize: 13, fontWeight: 600 }}>{u.username}</button>
                      {u.username === CALIBRATION_KING && <span title="Calibration King" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0, fontSize: 9, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 5, padding: "1px 5px" }}>🎯 Cal. King</span>}
                    </div>
                    <div><CategoryBadge badge={u.primaryBadge} compact={true}/></div>
                    <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtPct(u.calibration)} cal. · {u.trades} trades</div>
                  </div>
                </div>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{medals[real]}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Profit</div>
                  <div className="font-mono" style={{ fontSize: 24, fontWeight: 600, color: "var(--alive)" }}>+{fmtMoney(u.profit)}</div>
                </div>
                <FollowButton username={u.username}/>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Trader</th>
              <th style={{ textAlign: "right" }}>Profit</th>
              <th style={{ textAlign: "right" }}>Win rate</th>
              <th style={{ textAlign: "right" }}>Calibration</th>
              <th style={{ textAlign: "right" }}>Trades</th>
              <th style={{ textAlign: "right" }}>Streak</th>
              <th>Top market</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {LEADERBOARD.slice(3).map(u => (
              <tr key={u.username} className="row">
                <td className="font-mono" style={{ color: "var(--text-muted)" }}>#{u.rank}</td>
                <td>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: `oklch(0.4 0.12 ${u.hue})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: `oklch(0.96 0.04 ${u.hue})` }}>{u.username[0].toUpperCase()}</div>
                    <button onClick={() => navigate({ name: "profile", username: u.username })} style={{ fontWeight: 500 }}>{u.username}</button>
                    <CategoryBadge badge={u.primaryBadge} compact={true}/>
                    {u.username === CALIBRATION_KING && <span title="Calibration King" style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 6, padding: "2px 7px" }}>🎯 Calibration King</span>}
                  </div>
                </td>
                <td className="font-mono" style={{ textAlign: "right", color: "var(--alive)", fontWeight: 600 }}>+{fmtMoney(u.profit)}</td>
                <td className="font-mono" style={{ textAlign: "right" }}>{fmtPct(u.winRate)}</td>
                <td style={{ textAlign: "right" }}><CalibrationBar value={u.calibration}/></td>
                <td className="font-mono" style={{ textAlign: "right", color: "var(--text-muted)" }}>{u.trades}</td>
                <td className="font-mono" style={{ textAlign: "right", color: u.streak > 0 ? "var(--alive)" : u.streak < 0 ? "var(--dead)" : "var(--text-muted)" }}>
                  {u.streak > 0 ? "W" + u.streak : u.streak < 0 ? "L" + Math.abs(u.streak) : "—"}
                </td>
                <td>
                  <button onClick={() => navigate({ name: "market", id: u.fav.id })} style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text)" }}>
                    <Logo name={u.fav.name} size={22} hue={u.fav.logo.hue} initials={u.fav.logo.initials}/>
                    <span style={{ fontSize: 12 }}>{u.fav.name}</span>
                  </button>
                </td>
                <td style={{ textAlign: "right" }}><FollowButton username={u.username}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Activity (full-page feed) ----
function ActivityPage() {
  const social = React.useContext(SocialContext);
  const r = mulberry32(0x1234ABCD);
  const items = useMemo(() => {
    const out = [];
    for (let i = 0; i < 50; i++) {
      const m = MARKETS[Math.floor(r() * MARKETS.length)];
      const side = r() < 0.55 ? "DEAD" : "ALIVE";
      const amt = [25, 50, 100, 250, 500, 1000, 2500, 5000][Math.floor(r() * 8)];
      const u = LEADERBOARD[Math.floor(r() * LEADERBOARD.length)];
      const price = (side === "DEAD" ? m.death : m.survives) + (r() - 0.5) * 0.04;
      out.push({ market: m, side, amt, user: u, price: Math.max(0.01, Math.min(0.99, price)), ago: i + Math.floor(r() * 3) });
    }
    return out;
  }, []);

  return (
    <div style={{ padding: "32px", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Activity</h1>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Every bet placed across the platform — live.</div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid rgba(31,41,55,0.5)" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Avatar username={it.user.username} hue={it.user.hue} size={32}/>
              <div>
                <div style={{ fontSize: 13 }}>
                  <button onClick={() => social.navigate({ name: "profile", username: it.user.username })} style={{ fontWeight: 600 }}>@{it.user.username}</button>
                  <span style={{ color: "var(--text-muted)" }}> bet </span>
                  <span className="font-mono">${it.amt}</span>
                  <span style={{ color: "var(--text-muted)" }}> on </span>
                  <span style={{ color: it.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 600 }}>{it.side}</span>
                  <span style={{ color: "var(--text-muted)" }}> · </span>
                  <button onClick={() => social.navigate({ name: "market", id: it.market.id })} style={{ fontWeight: 500, color: "var(--text)" }}>{it.market.name}</button>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{it.market.category}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)" }}>
                <div>@ {(it.price * 100).toFixed(1)}¢</div>
                <div>{it.ago}m ago</div>
              </div>
              <FollowButton username={it.user.username}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Profile (FEATURE 2a) ----
function ProfilePage({ username }) {
  const social = React.useContext(SocialContext);
  const u = getUser(username);
  const [tab, setTab] = useState("positions");
  const isSelf = u.username === social.currentUser.username;
  const followerCount = u.followers + (social.isFollowing(u.username) ? 1 : 0);

  const sampleUsers = (seedKey, n) => {
    const r = mulberry32(seedKey);
    const pool = [...LEADERBOARD];
    const out = [];
    while (out.length < n && pool.length) {
      const cand = pool.splice(Math.floor(r() * pool.length), 1)[0];
      if (cand.username !== u.username) out.push(cand);
    }
    return out;
  };
  const followersList = useMemo(() => sampleUsers(u.username.length * 991 + 1, 8), [u.username]);
  const followingList = useMemo(() => sampleUsers(u.username.length * 773 + 5, 8), [u.username]);

  const pnl = u.profit || 0;
  const calib = u.calibration || 0.6;
  const stats = [
    ["Total P&L", (pnl >= 0 ? "+" : "") + fmtMoney(pnl), pnl >= 0 ? "var(--alive)" : "var(--dead)"],
    ["Win rate", fmtPct(u.winRate || 0.5), "var(--text)"],
    ["Calibration", fmtPct(calib), calib > 0.8 ? "var(--alive)" : calib >= 0.6 ? "var(--warn)" : "var(--dead)", "How often your X% predictions actually resolve correctly. Top traders score above 80%."],
    ["Total bets", (u.trades || 0).toLocaleString(), "var(--text)"],
    ["Followers", followerCount.toLocaleString(), "var(--text)"],
    ["Following", (u.following || 0).toLocaleString(), "var(--text)"],
  ];

  // FEATURE 5 — expertise badges
  const expertise = useMemo(() => {
    const out = [];
    if (u.primaryBadge) out.push(u.primaryBadge);
    BADGE_CATEGORIES.forEach(cat => {
      if (u.primaryBadge && cat === u.primaryBadge.category) return;
      const b = getCategoryBadge(u.username, cat);
      if (b && (b.tier === "Expert" || b.tier === "Specialist")) out.push(b);
    });
    return out.slice(0, 8);
  }, [u.username]);

  const UserRow = ({ user }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(31,41,55,0.5)" }}>
      <UserChip username={user.username} hue={user.hue} size={36} sub={`${fmtPct(user.winRate)} win · ${(user.profit >= 0 ? "+" : "") + fmtMoney(user.profit)}`}/>
      <FollowButton username={user.username}/>
    </div>
  );

  return (
    <div style={{ padding: "32px", maxWidth: 1000, margin: "0 auto" }}>
      <button onClick={() => social.navigate({ name: "leaderboard" })} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>← Back to leaderboard</button>

      {/* Header */}
      <div className="card" style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Avatar username={u.username} hue={u.hue} size={72}/>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 className="font-display" style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>@{u.username}</h1>
              {isSelf ? (
                <span className="pill">YOU</span>
              ) : (
                <FollowButton username={u.username} size="md"/>
              )}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text)", fontStyle: "italic" }}>{u.tagline}</p>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Joined {u.joinLabel}</div>
          </div>
        </div>
        <div className="profile-stats" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          {stats.map(([l, v, c, tip]) => (
            <div key={l}>
              <div title={tip || ""} style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 4, cursor: tip ? "help" : "default" }}>
                {l}{tip && <span style={{ opacity: 0.6 }}>ⓘ</span>}
              </div>
              <div className="font-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE 5 — Expertise */}
      {expertise.length > 0 && (
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Expertise</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {expertise.map((b, i) => <CategoryBadge key={i} badge={b} size="md"/>)}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "1px solid var(--border)" }}>
        {[["positions", "Positions"], ["activity", "Activity"], ["following", "Following"], ["followers", "Followers"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: tab === k ? "var(--text)" : "var(--text-muted)", borderBottom: tab === k ? "2px solid var(--indigo)" : "2px solid transparent", marginBottom: -1 }}>{l}</button>
        ))}
      </div>

      {tab === "positions" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data">
            <thead><tr><th>Market</th><th>Side</th><th style={{ textAlign: "right" }}>Shares</th><th style={{ textAlign: "right" }}>Avg</th><th style={{ textAlign: "right" }}>Now</th><th style={{ textAlign: "right" }}>P&L</th></tr></thead>
            <tbody>
              {u.positions.map((p, i) => (
                <tr key={i} className="row" onClick={() => social.navigate({ name: "market", id: p.market.id })} style={{ cursor: "pointer" }}>
                  <td><div style={{ display: "flex", gap: 10, alignItems: "center" }}><Logo name={p.market.name} size={26} hue={p.market.logo.hue} initials={p.market.logo.initials}/><span style={{ fontWeight: 500 }}>{p.market.name}</span></div></td>
                  <td><span style={{ color: p.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 600, fontSize: 12 }}>{p.side}</span></td>
                  <td className="font-mono" style={{ textAlign: "right" }}>{p.shares}</td>
                  <td className="font-mono" style={{ textAlign: "right", color: "var(--text-muted)" }}>{(p.avgPrice * 100).toFixed(1)}¢</td>
                  <td className="font-mono" style={{ textAlign: "right" }}>{(p.currentPrice * 100).toFixed(1)}¢</td>
                  <td className="font-mono" style={{ textAlign: "right", color: p.pnl >= 0 ? "var(--alive)" : "var(--dead)", fontWeight: 600 }}>{(p.pnl >= 0 ? "+" : "") + fmtMoney(p.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "activity" && (
        <div className="card" style={{ overflow: "hidden" }}>
          {u.activity.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: "1px solid rgba(31,41,55,0.5)" }}>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>bet </span>
                <span className="font-mono">${a.amt}</span>
                <span style={{ color: "var(--text-muted)" }}> on </span>
                <span style={{ color: a.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 600 }}>{a.side}</span>
                <span style={{ color: "var(--text-muted)" }}> · </span>
                <button onClick={() => social.navigate({ name: "market", id: a.market.id })} style={{ fontWeight: 500, color: "var(--text)" }}>{a.market.name}</button>
              </div>
              <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.minsAgo < 60 ? a.minsAgo + "m" : Math.floor(a.minsAgo / 60) + "h"} ago</span>
            </div>
          ))}
        </div>
      )}

      {tab === "following" && <div className="card" style={{ overflow: "hidden" }}>{followingList.map(x => <UserRow key={x.username} user={x}/>)}</div>}
      {tab === "followers" && <div className="card" style={{ overflow: "hidden" }}>{followersList.map(x => <UserRow key={x.username} user={x}/>)}</div>}
    </div>
  );
}

// ---- Following feed (FEATURE 2b) ----
function FollowingPage() {
  const social = React.useContext(SocialContext);
  const feed = FOLLOW_FEED.filter(f => social.isFollowing(f.user.username));
  const suggestions = LEADERBOARD.slice(0, 6);

  return (
    <div style={{ padding: "32px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Following</h1>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Bets from the traders you follow, as they happen.</div>
      </div>

      {feed.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👀</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Follow traders to see their bets here</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>Here are some of the top traders to get you started.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
            {suggestions.map(u => (
              <div key={u.username} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elev)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <UserChip username={u.username} hue={u.hue} size={36} sub={`#${u.rank} · ${(u.profit >= 0 ? "+" : "") + fmtMoney(u.profit)}`}/>
                <FollowButton username={u.username}/>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {feed.map(f => (
            <div key={f.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <UserChip username={f.user.username} hue={f.user.hue} size={40} sub={`${f.minsAgo < 60 ? f.minsAgo + "m" : Math.floor(f.minsAgo / 60) + "h"} ago`}/>
                <FollowButton username={f.user.username}/>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 0", padding: "12px 14px", background: "var(--bg-elev)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <Logo name={f.market.name} size={32} hue={f.market.logo.hue} initials={f.market.logo.initials}/>
                <div style={{ flex: 1, fontSize: 14 }}>
                  <span style={{ color: "var(--text-muted)" }}>bet </span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>${f.amt}</span>
                  <span style={{ color: "var(--text-muted)" }}> on </span>
                  <span style={{ color: f.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 700 }}>{f.side}</span>
                </div>
                <button onClick={() => social.navigate({ name: "market", id: f.market.id })} style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{f.market.name} →</button>
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>💬 {f.comments}</span>
                <button onClick={() => social.navigate({ name: "market", id: f.market.id })} style={{ color: "var(--indigo)", fontWeight: 500 }}>Copy this bet</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Challenges (FEATURE 3b) ----
function ChallengesPage() {
  const social = React.useContext(SocialContext);
  const [tab, setTab] = useState("open");
  const openList = social.openChallenges;
  const incoming = social.incoming;
  const mine = social.myChallenges;

  return (
    <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>⚔️ Challenges</h1>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Bet head-to-head against another trader. Winner takes the pot, minus a 2% fee.</div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, padding: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, width: "fit-content" }}>
        {[["open", `Open (${openList.length})`], ["mine", `My Challenges (${incoming.length + mine.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, color: tab === k ? "var(--text)" : "var(--text-muted)", background: tab === k ? "var(--bg-elev)" : "transparent", position: "relative" }}>
            {l}
            {k === "mine" && incoming.length > 0 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: "var(--dead)", color: "white", borderRadius: 8, padding: "1px 6px" }}>{incoming.length}</span>}
          </button>
        ))}
      </div>

      {tab === "open" && (
        openList.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No open challenges right now. Create one from any market page.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
            {openList.map(c => <ChallengeCard key={c.id} challenge={c} variant="open" onAccept={social.acceptChallenge}/>)}
          </div>
        )
      )}

      {tab === "mine" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {incoming.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Challenges sent to you</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
                {incoming.map(c => <ChallengeCard key={c.id} challenge={c} variant="incoming" onAccept={social.acceptIncoming} onDecline={social.declineIncoming}/>)}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Your challenges</div>
            {mine.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>You haven't created any challenges yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
                {mine.map(c => <ChallengeCard key={c.id} challenge={c} variant="mine"/>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Tournaments (FEATURE 8) ----
function TournamentsPage() {
  const social = React.useContext(SocialContext);
  const t = FEATURED_TOURNAMENT;
  const [entered, setEntered] = useState(false);
  const enter = () => {
    if (!social.walletConnected) { social.onConnect(); return; }
    setEntered(true);
    social.showToast({ type: "info", message: `Entered ${t.name} — $${t.entryFee} buy-in. $1,000 bankroll loaded.` });
  };

  return (
    <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Weekly Tournaments — Compete for the pot 🏆</h1>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Fixed bankroll, fixed markets, one week. Highest profit % takes the prize pool.</div>
      </div>

      {/* Featured */}
      <div className="card" style={{ padding: 28, marginBottom: 24, position: "relative", overflow: "hidden", borderColor: "rgba(91,107,245,0.3)", background: "linear-gradient(135deg, rgba(91,107,245,0.10), rgba(139,92,246,0.04) 55%, transparent), var(--surface)" }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)", pointerEvents: "none" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span className="pill live" style={{ color: "var(--alive)", borderColor: "rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.08)" }}><span className="dot"/>{t.status}</span>
              <span className="pill">ENTRY ${t.entryFee}</span>
            </div>
            <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{t.name}</h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{t.schedule}</div>
            <div style={{ fontSize: 13, color: "var(--text)", marginTop: 14, lineHeight: 1.6, maxWidth: 540 }}>
              {t.format}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
              <div style={{ display: "flex" }}>
                {t.avatars.map((a, i) => (
                  <div key={a.username} style={{ marginLeft: i === 0 ? 0 : -10, borderRadius: "50%", border: "2px solid var(--surface)" }}>
                    <Avatar username={a.username} hue={a.hue} size={32}/>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}><span className="font-mono" style={{ color: "var(--text)" }}>{t.participants}</span> entered</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16, lineHeight: 1.6, padding: "12px 14px", background: "var(--bg-elev)", borderRadius: 10, border: "1px solid var(--border)", maxWidth: 560 }}>
              Each entrant gets a <strong style={{ color: "var(--text)" }}>$1,000 virtual bankroll</strong>. Trade any of the 20 fixed markets. Top 3 profit % at end of week wins. Rebuy resets your bankroll for ${t.entryFee} more.
            </div>
          </div>

          <div style={{ minWidth: 240, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Prize pool</div>
              <div className="font-mono" style={{ fontSize: 40, fontWeight: 700, color: "var(--alive)", letterSpacing: "-0.02em" }}>{fmtMoney(t.prizePool)}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>grows with every entry</div>
            </div>
            <button className={entered ? "btn" : "btn primary"} onClick={enter} disabled={entered} style={{ padding: "15px", fontSize: 15, ...(entered ? { borderColor: "rgba(16,185,129,0.5)", color: "var(--alive)" } : {}) }}>
              {entered ? "✓ Entered — good luck" : "Enter Tournament · $" + t.entryFee}
            </button>
          </div>
        </div>
      </div>

      {/* Past */}
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Past tournaments</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 28 }}>
        {PAST_TOURNAMENTS.map(p => (
          <div key={p.name} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.participants} entered</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar username={p.winner.username} hue={p.winner.hue} size={40} ring="#F59E0B"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>🥇 Winner</div>
                <button onClick={() => social.navigate({ name: "profile", username: p.winner.username })} style={{ fontSize: 14, fontWeight: 600 }}>@{p.winner.username}</button>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--alive)" }}>+{fmtMoney(p.profit)}</div>
              </div>
            </div>
            <button className="btn btn-sm" style={{ width: "100%", marginTop: 14 }} onClick={() => social.showToast({ type: "info", message: `${p.name} results — full breakdown coming soon.` })}>View Results</button>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Upcoming</div>
      <div className="card" style={{ overflow: "hidden" }}>
        {UPCOMING_TOURNAMENTS.map((u, i) => (
          <div key={u.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: i < UPCOMING_TOURNAMENTS.length - 1 ? "1px solid var(--border)" : "none", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(91,107,245,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏆</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Entry ${u.entryFee} · Prize est. {fmtMoney(u.prizeEst)} · {u.startsIn}</div>
              </div>
            </div>
            <button className="btn btn-sm" onClick={() => social.showToast({ type: "info", message: `Reminder set for ${u.name}.` })}>Notify me</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Resolution Console (FEATURE 1 — admin multi-sig vote) ----
function ResolutionConsolePage() {
  const social = React.useContext(SocialContext);
  const [secret, setSecret] = useState(() => { try { return localStorage.getItem("doa_admin_secret") || ""; } catch (e) { return ""; } });
  const [authed, setAuthed] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [stats, setStats] = useState(null);
  const [vote, setVote] = useState(null);     // { market, side }
  const [reason, setReason] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // last settlement summary
  const [tick, setTick] = useState(0);
  // create-market form
  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cCategory, setCCategory] = useState(CATEGORY_LIST[1]);
  const [cDeath, setCDeath] = useState(70);
  const [cDays, setCDays] = useState(365);
  const [creating, setCreating] = useState(false);

  const openVote = (m, s) => { setReason(""); setSourceUrl(""); setVote({ market: m, side: s }); };

  const submitCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const r = await window.API.adminCreateMarket(
        { name: cName, category: cCategory, death: (+cDeath || 0) / 100, daysLeft: +cDays || 0 },
        secret
      );
      social.syncMarket && social.syncMarket(r.market);
      social.showToast({ type: "connected", message: `Market live: "${r.market.name}" at ${Math.round(r.market.death * 100)}% DEAD.` });
      setCName(""); setCreateOpen(false); setTick((t) => t + 1);
      window.API.adminStats(secret).then(setStats).catch(() => {});
    } catch (e) {
      social.showToast({ type: "error", message: e.message || "Create failed." });
    } finally { setCreating(false); }
  };

  // open markets only — newest first so just-created markets surface on top
  const [qFilter, setQFilter] = useState("");
  const queue = useMemo(() => {
    const f = qFilter.trim().toLowerCase();
    return (window.MARKETS || [])
      .filter((m) => m.status !== "resolved")
      .filter((m) => !f || m.name.toLowerCase().includes(f) || m.category.toLowerCase().includes(f))
      .sort((a, b) => b.id - a.id)
      .slice(0, 30);
  }, [tick, social, qFilter]);

  const tryAuth = async (sec) => {
    try {
      const r = await window.API.adminLogin(sec);
      if (r.ok) {
        setAuthed(true); setSecret(sec);
        try { localStorage.setItem("doa_admin_secret", sec); } catch (e) {}
        window.API.adminStats(sec).then(setStats).catch(() => {});
      } else {
        social.showToast({ type: "error", message: "Incorrect admin secret." });
      }
    } catch (e) { social.showToast({ type: "error", message: e.message }); }
  };

  useEffect(() => { if (secret && !authed) tryAuth(secret); /* eslint-disable-next-line */ }, []);

  const confirmResolve = async () => {
    if (!vote) return;
    setBusy(true);
    try {
      const r = await window.API.adminResolve(vote.market.id, vote.side, secret, reason, sourceUrl);
      const s = r.resolved;
      setResult(s);
      social.syncMarket && social.syncMarket({ ...vote.market, status: "resolved", outcome: vote.side, death: vote.side === "DEAD" ? 1 : 0, survives: vote.side === "DEAD" ? 0 : 1, resolutionReason: reason || null, resolutionSource: sourceUrl || null, resolvedAt: Date.now() });
      social.refreshMe && social.refreshMe();
      window.API.adminStats(secret).then(setStats).catch(() => {});
      social.showToast({ type: "connected", message: `${s.market} resolved ${s.outcome} — ${s.winners} winners paid $${s.totalNetPaid.toFixed(2)} (fees $${s.totalFeesCollected.toFixed(2)}).` });
      setVote(null);
      setTick((t) => t + 1);
    } catch (e) {
      social.showToast({ type: "error", message: e.message || "Resolution failed." });
    } finally { setBusy(false); }
  };

  if (!authed) {
    return (
      <div style={{ padding: "32px", maxWidth: 460, margin: "40px auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v5c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V7l8-4z" stroke="var(--indigo)" strokeWidth="1.7" strokeLinejoin="round"/></svg>
          <h1 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Resolution Console</h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>Committee access only. Enter the admin secret to resolve markets and execute payouts.</p>
        <input type="password" className="input font-mono" placeholder="Admin secret" value={secretInput} onChange={(e) => setSecretInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tryAuth(secretInput)} style={{ marginBottom: 12 }} />
        <button className="btn primary" style={{ width: "100%", padding: 12 }} onClick={() => tryAuth(secretInput)}>Unlock console</button>
        <button onClick={() => social.navigate({ name: "markets" })} style={{ display: "block", width: "100%", textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>← Back to markets</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => social.navigate({ name: "markets" })} style={{ fontSize: 12, color: "var(--text-muted)" }}>← Back</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v5c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V7l8-4z" stroke="var(--indigo)" strokeWidth="1.7" strokeLinejoin="round"/></svg>
        <h1 className="font-display" style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Resolution Console</h1>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 18px", maxWidth: 620 }}>
        Production resolution requires a 2-of-3 multi-sig committee. In this operator build, a confirmed vote resolves the market and executes payouts immediately (2% fee on winnings).
      </p>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
          {[["Users", stats.users], ["Open bets", stats.openBets], ["Fees collected", "$" + Number(stats.feesCollected || 0).toFixed(2)], ["Markets resolved", stats.marketsResolved]].map(([l, v]) => (
            <div key={l} className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
              <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderColor: "rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.06)" }}>
          <span style={{ fontSize: 13 }}>✅ <strong>{result.market}</strong> resolved <strong>{result.outcome}</strong> — {result.winners} winners, {result.losers} losers, {result.challengesSettled} challenges settled. Net paid <span className="font-mono">${result.totalNetPaid.toFixed(2)}</span>, fees <span className="font-mono">${result.totalFeesCollected.toFixed(2)}</span>.</span>
        </div>
      )}

      {/* Create a new market — live immediately, no redeploy */}
      <div className="card" style={{ marginBottom: 18, overflow: "hidden" }}>
        <button onClick={() => setCreateOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", textAlign: "left" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>＋ Create market</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{createOpen ? "▲" : "▼"}</span>
        </button>
        {createOpen && (
          <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr", gap: 12, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Company name</div>
                <input className="input" placeholder="e.g. Stack Overflow" value={cName} onChange={(e) => setCName(e.target.value)}/>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Category</div>
                <select className="input" value={cCategory} onChange={(e) => setCCategory(e.target.value)}>
                  {CATEGORY_LIST.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Starting DEAD odds (%)</div>
                <input type="number" min="2" max="98" className="input font-mono" value={cDeath} onChange={(e) => setCDeath(e.target.value)}/>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Resolves in (days)</div>
                <input type="number" min="1" max="2000" className="input font-mono" value={cDays} onChange={(e) => setCDays(e.target.value)}/>
              </div>
            </div>
            <button className="btn primary" disabled={creating || !cName.trim()} onClick={submitCreate} style={{ width: "100%", marginTop: 14, padding: 12, opacity: creating || !cName.trim() ? 0.6 : 1 }}>
              {creating ? "Creating…" : "Launch market"}
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Open markets</span>
          <input
            className="input"
            placeholder="Filter by name or category…"
            value={qFilter}
            onChange={(e) => setQFilter(e.target.value)}
            style={{ maxWidth: 280, padding: "7px 10px", fontSize: 12 }}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{queue.length} shown · newest first</span>
        </div>
        {queue.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid rgba(31,41,55,0.5)", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Logo name={m.name} size={32} hue={m.logo.hue} initials={m.logo.initials}/>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.category} · {fmtPct(m.death)} DEAD · resolves in {fmtDays(m.daysLeft)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn btn-sm dead" onClick={() => openVote(m, "DEAD")}>Resolve DEAD</button>
              <button className="btn btn-sm alive" onClick={() => openVote(m, "ALIVE")}>Resolve ALIVE</button>
            </div>
          </div>
        ))}
        {queue.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No open markets — everything is resolved.</div>}
      </div>

      {vote && (
        <div onClick={() => !busy && setVote(null)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,6,12,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 440, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Confirm Resolution</span>
              <button onClick={() => !busy && setVote(null)} style={{ width: 30, height: 30, borderRadius: 8, color: "var(--text-muted)", border: "1px solid var(--border)" }}>✕</button>
            </div>
            <p style={{ fontSize: 14, margin: "0 0 6px" }}>
              Resolve <strong>{vote.market.name}</strong> as <span style={{ color: vote.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 700 }}>{vote.side}</span>?
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
              Winning shares settle at $1.00. A 2% fee is taken on gross winnings. Unfilled limit orders are refunded. This is irreversible.
            </p>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Resolution reason (public)</div>
            <textarea
              className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder={vote.side === "DEAD" ? "e.g. Filed Chapter 11 bankruptcy on June 3, 2026." : "e.g. Resolution window ended with revenue above the collapse threshold."}
              style={{ resize: "vertical", marginBottom: 10, fontFamily: "inherit" }}
            />
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Source URL (public)</div>
            <input className="input font-mono" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" style={{ marginBottom: 14, fontSize: 12 }}/>
            <button className="btn primary" disabled={busy} style={{ width: "100%", padding: 13, opacity: busy ? 0.6 : 1, background: vote.side === "DEAD" ? "var(--dead)" : "var(--alive)", borderColor: vote.side === "DEAD" ? "var(--dead)" : "var(--alive)" }} onClick={confirmResolve}>
              {busy ? "Resolving…" : `Confirm — Resolve ${vote.side}`}
            </button>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "10px 0 0", textAlign: "center" }}>
              Reason and source are published on the public Resolution History page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Public Resolution History — the trust layer ----
// Every resolved market: outcome, when, why, source, and what was paid out.
function ResolutionHistoryPage() {
  const social = React.useContext(SocialContext);
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let alive = true;
    window.API.resolutions().then((r) => { if (alive) setRows(r.resolutions); }).catch(() => setRows([]));
    return () => { alive = false; };
  }, []);

  return (
    <div style={{ padding: "32px", maxWidth: 860, margin: "0 auto" }}>
      <button onClick={() => social.navigate({ name: "markets" })} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>← Back</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>📜</span>
        <h1 className="font-display" style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Resolution History</h1>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px", maxWidth: 620, lineHeight: 1.6 }}>
        Every market we've ever settled, with the reason and the source. Winning shares pay $1.00 minus the 2% platform fee. If you think a resolution is wrong, this is the record to argue with.
      </p>

      {rows === null && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>}
      {rows && rows.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No markets resolved yet. When one settles, the full record appears here.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(rows || []).map((r) => (
          <div key={r.id} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Logo name={r.name} size={36} hue={r.logo.hue} initials={r.logo.initials}/>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    <button onClick={() => social.navigate({ name: "market", id: r.id })} style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {r.category} · resolved {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </div>
                </div>
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700,
                padding: "5px 12px", borderRadius: 8, letterSpacing: "0.04em",
                background: r.outcome === "DEAD" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                color: r.outcome === "DEAD" ? "var(--dead)" : "var(--alive)",
              }}>{r.outcome === "DEAD" ? "💀 DEAD" : "💚 ALIVE"}</span>
            </div>

            {(r.reason || r.sourceUrl) && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10 }}>
                {r.reason && <div style={{ fontSize: 13, lineHeight: 1.6 }}>{r.reason}</div>}
                {r.sourceUrl && (
                  <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--indigo)", marginTop: r.reason ? 8 : 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M10 14L21 3M21 3h-6M21 3v6M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Source
                  </a>
                )}
              </div>
            )}
            {!r.reason && !r.sourceUrl && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-dim)" }}>No public reason recorded for this resolution.</div>
            )}

            <div style={{ display: "flex", gap: 22, marginTop: 12, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
              <span>Winners: <span className="font-mono" style={{ color: "var(--text)" }}>{r.winners}</span></span>
              <span>Losers: <span className="font-mono" style={{ color: "var(--text)" }}>{r.losers}</span></span>
              <span>Paid out: <span className="font-mono" style={{ color: "var(--alive)" }}>${(r.totalPaid || 0).toLocaleString()}</span></span>
              <span>Fees: <span className="font-mono" style={{ color: "var(--text)" }}>${(r.totalFees || 0).toLocaleString()}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Risk Disclosure (FEATURE 6) ----
function RiskDisclosurePage() {
  const social = React.useContext(SocialContext);
  const [ack, setAck] = useState(() => { try { return localStorage.getItem("doa_risk_ack") === "1"; } catch (e) { return false; } });
  const sections = [
    ["Platform Risk", "Dead or Alive is an experimental platform provided on an as-is basis. Service interruptions, smart contract bugs, or operational failures may result in delayed resolutions or loss of funds. The platform does not guarantee continuous availability or the accuracy of any displayed odds."],
    ["Market Risk", "Prediction market prices are determined entirely by participant activity and may not reflect the true probability of any outcome. Odds can move sharply and without warning. You may purchase a position and see its value decline to zero upon resolution."],
    ["Liquidity Risk", "There may be insufficient liquidity to exit a position before resolution at a favorable price, or at all. Order books for individual markets can be thin, and large orders may experience significant slippage."],
    ["Regulatory Risk", "The legal status of prediction markets varies by jurisdiction and may change. Participation may be restricted or prohibited where you live. You are solely responsible for determining whether your use of the platform is lawful in your jurisdiction."],
    ["Smart Contract Risk", "Settlement is executed by on-chain smart contracts that, while audited, may contain vulnerabilities. Once funds are committed to a contract, transactions are irreversible. No party can recover funds lost to a contract exploit or to user error such as an incorrect address."],
  ];
  return (
    <div style={{ padding: "32px", maxWidth: 760, margin: "0 auto" }}>
      <button onClick={() => social.navigate({ name: "markets" })} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>← Back</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>⚠️</span>
        <h1 className="font-display" style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Risk Disclosure</h1>
      </div>
      <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 8px", fontWeight: 500 }}>Trading on Dead or Alive involves substantial risk of loss. You may lose your entire investment.</p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px", lineHeight: 1.6 }}>Past performance does not guarantee future results. This platform is intended for entertainment and informational purposes. Do not bet more than you can afford to lose. Verify your local laws before participating.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sections.map(([h, b]) => (
          <div key={h} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{h}</div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{b}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        {ack ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--alive)", fontSize: 14, fontWeight: 600 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            You have acknowledged the risks.
          </div>
        ) : (
          <button className="btn primary" style={{ padding: "13px 28px" }} onClick={() => { try { localStorage.setItem("doa_risk_ack", "1"); } catch (e) {} setAck(true); social.showToast({ type: "info", message: "Risk disclosure acknowledged." }); }}>I understand the risks</button>
        )}
      </div>
    </div>
  );
}

// ---- Death Watch page (FEATURE 7) ----
function DeathWatchPage() {
  const social = React.useContext(SocialContext);
  return (
    <div style={{ padding: "32px", maxWidth: 820, margin: "0 auto" }}>
      <button onClick={() => social.navigate({ name: "markets" })} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>← Back to markets</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span className="pulse-urgent" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--dead)", boxShadow: "0 0 10px var(--dead)" }}/>
        <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Death Watch 🔍</h1>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 22px" }}>Signals, whispers and conflicting tea leaves from across the markets. Read them and decide for yourself — nobody's sure which way these break.</p>
      <div className="card" style={{ overflow: "hidden" }}>
        {DEATH_WATCH_ALL.map((it, i) => (
          <button key={i} onClick={() => social.navigate({ name: "market", id: marketByName(it.market).id })}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "14px 18px", borderBottom: i < DEATH_WATCH_ALL.length - 1 ? "1px solid rgba(31,41,55,0.5)" : "none", borderLeft: `3px solid ${dwColor(it.tone)}` }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{it.icon}</span>
              <span style={{ fontSize: 13, lineHeight: 1.4 }}>{it.text}</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, whiteSpace: "nowrap" }}>{it.time}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Alerts page (FEATURE 5a target) ----
function AlertsPage() {
  const social = React.useContext(SocialContext);
  const [ids, setIds] = useState(() => { try { return JSON.parse(localStorage.getItem("doa_alerts") || "[]"); } catch (e) { return []; } });
  const markets = ids.map(id => MARKETS.find(m => m.id === id)).filter(Boolean);
  const remove = (id) => {
    const next = ids.filter(x => x !== id);
    setIds(next);
    try { localStorage.setItem("doa_alerts", JSON.stringify(next)); } catch (e) {}
    window.dispatchEvent(new Event("doa-alerts-changed"));
    social.showToast({ type: "info", message: "Alert removed" });
  };
  return (
    <div style={{ padding: "32px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="var(--indigo)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <h1 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Price Alerts</h1>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 22px" }}>You'll be notified when these markets move 10%+ in a day.</p>
      {markets.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No alerts yet</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>Open any market and tap "Alert me when this moves 10%+".</p>
          <button className="btn primary" onClick={() => social.navigate({ name: "markets" })}>Browse markets</button>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          {markets.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < markets.length - 1 ? "1px solid rgba(31,41,55,0.5)" : "none" }}>
              <Logo name={m.name} size={32} hue={m.logo.hue} initials={m.logo.initials}/>
              <button onClick={() => social.navigate({ name: "market", id: m.id })} style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.category}</div>
              </button>
              <span className="font-mono" style={{ fontSize: 14, color: "var(--dead)", fontWeight: 600 }}>{fmtPct(m.death)}</span>
              <button className="btn btn-sm" onClick={() => remove(m.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MarketsPage, MarketDetailPage, PortfolioPage, LeaderboardPage, ActivityPage, ProfilePage, FollowingPage, ChallengesPage, TournamentsPage, ResolutionConsolePage, RiskDisclosurePage, DeathWatchPage, AlertsPage });
