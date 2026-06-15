// ---- Shared components ----
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// Social state shared across pages (provided by App)
const SocialContext = React.createContext(null);
const FEE_RATE = 0.02;

// Format helpers
const fmtPct = (v) => (v * 100).toFixed(0) + "%";
const fmtPct1 = (v) => (v * 100).toFixed(1) + "%";
const fmtMoney = (v) => {
  const sign = v < 0 ? "-" : "";
  const a = Math.abs(v);
  if (a >= 1_000_000) return sign + "$" + (a / 1_000_000).toFixed(2) + "M";
  if (a >= 1_000) return sign + "$" + (a / 1_000).toFixed(1) + "K";
  return sign + "$" + a.toFixed(0);
};
const fmtSigned = (v) => (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "pp";
const fmtDays = (d) => {
  if (d > 365) return (d / 365).toFixed(1) + "y";
  return d + "d";
};
// FEATURE 1 — signed current streak from resolved bets (+W / -L)
function currentStreak(resolved) {
  const sorted = [...resolved].sort((a, b) => a.resolvedDaysAgo - b.resolvedDaysAgo);
  if (!sorted.length) return 0;
  const first = sorted[0].outcome;
  let n = 0;
  for (const r of sorted) { if (r.outcome === first) n++; else break; }
  return first === "WON" ? n : -n;
}

// Skull glyph
const Skull = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3c-4.6 0-8 3.2-8 7.5 0 2.5 1.2 4.6 3 5.9V20c0 .6.4 1 1 1h1.5v-2H11v2h2v-2h1.5v2H16c.6 0 1-.4 1-1v-3.6c1.8-1.3 3-3.4 3-5.9C20 6.2 16.6 3 12 3Z" fill={color}/>
    <circle cx="9" cy="11" r="1.6" fill="#0A0B14"/>
    <circle cx="15" cy="11" r="1.6" fill="#0A0B14"/>
    <path d="M11 14h2v2h-2z" fill="#0A0B14"/>
  </svg>
);

const HeartPulse = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21s-7-4.6-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.4-7 10-7 10Z" fill={color}/>
    <path d="M3 12h3l1.5-3 2 5 1.5-2h11" stroke="#0A0B14" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Logo monogram
function Logo({ name, size = 36, hue, initials }) {
  const meta = (hue == null || initials == null) ? logoFor(name) : { hue, initials };
  const bg = `linear-gradient(135deg, oklch(0.36 0.10 ${meta.hue}) 0%, oklch(0.22 0.06 ${(meta.hue + 40) % 360}) 100%)`;
  const fg = `oklch(0.92 0.06 ${meta.hue})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
      fontSize: size * 0.42, letterSpacing: "-0.02em",
      border: "1px solid rgba(255,255,255,0.06)",
      flexShrink: 0,
    }}>{meta.initials}</div>
  );
}

// Sparkline (60 points of death prob 0..1)
function Sparkline({ series, width = 120, height = 36, favored = "DEAD" }) {
  const path = useMemo(() => {
    if (!series || !series.length) return "";
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = Math.max(0.05, max - min);
    return series.map((v, i) => {
      const x = (i / (series.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
  }, [series, width, height]);
  // gradient fill area
  const area = useMemo(() => {
    if (!series || !series.length) return "";
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = Math.max(0.05, max - min);
    const pts = series.map((v, i) => {
      const x = (i / (series.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    return "M0," + height + " L" + pts.join(" L") + " L" + width + "," + height + " Z";
  }, [series, width, height]);

  const color = favored === "DEAD" ? "#EF4444" : "#10B981";
  const gradId = "sg" + Math.abs(series[0] * 1000 | 0) + "-" + series.length + "-" + favored;
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} stroke={color} strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// Category badge
function CatTag({ category }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", flexShrink: 0, whiteSpace: "nowrap",
      fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
      color: "#9CA3AF", padding: "3px 8px", borderRadius: 6,
      background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.22)",
    }}>{category}</span>
  );
}

// ---- Paper mode pill (FEATURE 5) ----
function PaperPill() {
  const social = React.useContext(SocialContext);
  if (!social) return null;
  const on = social.paperMode;
  return (
    <button
      onClick={() => on ? social.requestSwitchLive() : social.enablePaper()}
      title={on ? "Paper trading active — click to switch to live" : "Switch to paper trading"}
      className="nav-hide-sm"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0,
        padding: "7px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
        color: on ? "#0A0B14" : "var(--warn)",
        background: on ? "var(--warn)" : "rgba(245,158,11,0.10)",
        border: `1px solid ${on ? "var(--warn)" : "rgba(245,158,11,0.4)"}`,
      }}
    >
      📄 {on ? "PAPER MODE" : "PAPER"}
    </button>
  );
}

// ---- Notification centre (FEATURE 2) ----
function NotificationBell() {
  const social = React.useContext(SocialContext);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (!ref.current?.contains(e.target)) { setOpen(false); setShowSettings(false); } };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); setShowSettings(false); } };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, []);
  if (!social) return null;
  const notifs = social.notifications;
  const unread = notifs.filter(n => !n.read).length;

  const handleClick = (n) => {
    social.markNotificationRead(n.id);
    let r = n.route;
    if (r && r.name === "market" && r.marketName) r = { name: "market", id: marketByName(r.marketName).id };
    if (r) social.navigate(r);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Notifications" aria-label="Notifications" aria-expanded={open} style={{ position: "relative", width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {unread > 0 && (
          <span style={{ position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 9, background: "var(--dead)", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", border: "2px solid var(--bg)" }}>{unread}</span>
        )}
      </button>

      {open && (
        <div className="card" style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 380, maxHeight: 480, display: "flex", flexDirection: "column", zIndex: 60, overflow: "hidden", boxShadow: "0 20px 50px -16px rgba(0,0,0,0.7)" }}>
          {!showSettings ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Notifications</span>
                <button onClick={() => social.markAllNotificationsRead()} style={{ fontSize: 12, color: "var(--indigo)", fontWeight: 500 }}>Mark all read</button>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {notifs.map(n => (
                  <button key={n.id} onClick={() => handleClick(n)} style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(31,41,55,0.5)", borderLeft: n.read ? "3px solid transparent" : "3px solid var(--indigo)", background: n.read ? "transparent" : "rgba(91,107,245,0.06)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(91,107,245,0.10)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = n.read ? "transparent" : "rgba(91,107,245,0.06)"}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{n.body}</div>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-dim)", flexShrink: 0, whiteSpace: "nowrap" }}>{n.time}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowSettings(true)} style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textAlign: "center" }}>Notification Settings</button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                <button onClick={() => setShowSettings(false)} style={{ color: "var(--text-muted)" }}>←</button>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Notification Settings</span>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                {[["Email notifications", true], ["SMS notifications", false], ["Odds alerts", true]].map(([label, def]) => (
                  <SettingToggle key={label} label={label} defaultOn={def}/>
                ))}
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Preferences are saved to this device for the demo.</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SettingToggle({ label, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <button onClick={() => setOn(o => !o)} style={{ width: 40, height: 22, borderRadius: 999, background: on ? "var(--indigo)" : "var(--border-strong)", position: "relative", transition: "background 0.15s ease" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.15s ease" }}/>
      </button>
    </div>
  );
}

// Top nav
function TopNav({ route, navigate, balance, walletConnected, walletAddress, onConnect, challengeBadge = 0 }) {
  const social = React.useContext(SocialContext);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const q = search.toLowerCase();
    setResults(MARKETS.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)).slice(0, 12));
  }, [search]);

  // FIX 12 — close on outside click OR Escape
  useEffect(() => {
    const onClick = (e) => { if (!wrapRef.current?.contains(e.target)) setShowResults(false); };
    const onKey = (e) => { if (e.key === "Escape") setShowResults(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  // FIX 12 — Enter navigates to the first result
  const onSearchKeyDown = (e) => {
    if (e.key === "Enter" && results.length > 0) {
      navigate({ name: "market", id: results[0].id });
      setSearch(""); setShowResults(false);
    }
  };
  const shortAddr = walletAddress ? walletAddress.slice(0, 6) + "…" + walletAddress.slice(-4) : "";

  const navItem = (label, key, badge, isNew) => (
    <button
      onClick={() => navigate({ name: key })}
      style={{
        position: "relative",
        padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500,
        color: route.name === key ? "var(--text)" : "var(--text-muted)",
        background: route.name === key ? "rgba(91,107,245,0.12)" : "transparent",
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{
          position: "absolute", top: 1, right: -2, minWidth: 16, height: 16, padding: "0 4px",
          borderRadius: 8, background: "var(--dead)", color: "white",
          fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'JetBrains Mono', monospace",
        }}>{badge}</span>
      )}
      {isNew && (
        <span style={{
          position: "absolute", top: -4, right: -10,
          borderRadius: 6, background: "var(--alive)", color: "#04231a",
          fontSize: 8, fontWeight: 800, letterSpacing: "0.05em", padding: "1px 4px",
        }}>NEW</span>
      )}
    </button>
  );

  return (
    <header className="topnav">
      <div style={{ maxWidth: 1640, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 24 }}>
        {/* Brand */}
        <button onClick={() => navigate({ name: "markets" })} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, #5B6BF5 0%, #8B5CF6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(91,107,245,0.4)",
          }}>
            <Skull size={18} color="#0A0B14"/>
          </div>
          <div className="brand-text" style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span className="font-display" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>Dead or Alive</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>Will AI kill it?</span>
          </div>
        </button>

        {/* Nav */}
        <nav className="nav-links" style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          {navItem("Markets", "markets")}
          {navItem("Portfolio", "portfolio")}
          {navItem("Leaderboard", "leaderboard")}
          {navItem("Following", "following")}
          {navItem("Challenges", "challenges", challengeBadge)}
          {navItem("Tournaments", "tournaments", 0, true)}
          {navItem("Activity", "activity")}
        </nav>

        {/* Search */}
        <div ref={wrapRef} className="nav-search" style={{ flex: 1, maxWidth: 520, position: "relative" }}>
          <div style={{ position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder={`Search ${MARKETS.length} markets — Chegg, Fiverr, Shutterstock…`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="card" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, padding: 4, zIndex: 50, maxHeight: 320, overflowY: "auto" }}>
              {results.map(m => (
                <button
                  key={m.id}
                  onClick={() => { navigate({ name: "market", id: m.id }); setSearch(""); setShowResults(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, width: "100%", textAlign: "left" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(91,107,245,0.08)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Logo name={m.name} size={28} hue={m.logo.hue} initials={m.logo.initials} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.category}</div>
                  </div>
                  <div className="font-mono" style={{ fontSize: 12, color: m.death > 0.5 ? "var(--dead)" : "var(--alive)" }}>
                    {fmtPct(Math.max(m.death, m.survives))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PaperPill/>
          <NotificationBell/>
          <span className="pill live nav-hide-sm"><span className="dot"/>LIVE</span>
          {walletConnected ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* FIX 2 — connected: green address chip + balance */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--alive)", boxShadow: "0 0 8px var(--alive)" }}/>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--alive)" }}>{shortAddr}</span>
              </div>
              <div className="nav-hide-sm" style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px 6px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Balance</span>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>${balance.toLocaleString()}</span>
                </div>
                <button className="btn primary btn-sm">Deposit</button>
              </div>
            </div>
          ) : (
            <button className="btn primary" onClick={onConnect} style={{ padding: "10px 16px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="2.5" y="6" width="19" height="13" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 12.5h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M2.5 9.5h12" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ---- Death Watch widget (FEATURE 7) ----
function dwColor(tone) { return tone === "dead" ? "var(--dead)" : tone === "amber" ? "var(--warn)" : "var(--text-muted)"; }
function DeathWatchWidget() {
  const social = React.useContext(SocialContext);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setOffset(o => (o + 5) % DEATH_WATCH.length), 30000);
    return () => clearInterval(t);
  }, []);
  const items = [];
  for (let i = 0; i < 5; i++) items.push(DEATH_WATCH[(offset + i) % DEATH_WATCH.length]);
  return (
    <div style={{ marginTop: 16, padding: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className="pulse-urgent" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--dead)", boxShadow: "0 0 8px var(--dead)" }}/>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Death Watch</span>
        <span style={{ fontSize: 13 }}>🔍</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <button key={offset + "-" + i} onClick={() => social?.navigate({ name: "market", id: marketByName(it.market).id })}
            style={{ display: "block", textAlign: "left", width: "100%", padding: "8px 10px", borderRadius: 8, borderLeft: `2px solid ${dwColor(it.tone)}`, background: "var(--bg-elev)" }}>
            <div style={{ fontSize: 11, lineHeight: 1.4, color: "var(--text)" }}>{it.icon} {it.text}</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3 }}>{it.time}</div>
          </button>
        ))}
      </div>
      <button onClick={() => social?.navigate({ name: "death-watch" })} style={{ display: "block", width: "100%", textAlign: "center", marginTop: 12, fontSize: 12, fontWeight: 600, color: "var(--indigo)" }}>View all signals →</button>
    </div>
  );
}

// Sidebar (categories)
function Sidebar({ category, setCategory, sort, setSort }) {
  return (
    <aside className="sidebar">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px 8px" }}>Sort</div>
        {[
          ["hottest", "🔥 Hottest"],
          ["newest", "✦ Newest"],
          ["ending", "⏱ Ending Soon"],
          ["volume", "$ Highest Volume"],
          ["movers", "△ Biggest Movers"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 10px", borderRadius: 8, fontSize: 13,
              color: sort === k ? "var(--text)" : "var(--text-muted)",
              background: sort === k ? "rgba(91,107,245,0.10)" : "transparent",
              fontWeight: sort === k ? 600 : 400,
              marginBottom: 2,
            }}
          >{label}</button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px 8px" }}>Industry</div>
      <div>
        {CATEGORY_LIST.map(c => {
          const count = c === "All" ? MARKETS.length : MARKETS.filter(m => m.category === c).length;
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                width: "100%", textAlign: "left",
                padding: "8px 10px", borderRadius: 8, fontSize: 13,
                color: active ? "var(--text)" : "var(--text-muted)",
                background: active ? "rgba(91,107,245,0.10)" : "transparent",
                fontWeight: active ? 600 : 400,
                marginBottom: 2,
                borderLeft: active ? "2px solid var(--indigo)" : "2px solid transparent",
              }}
            >
              <span>{c}</span>
              <span className="font-mono" style={{ fontSize: 11, opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 24, padding: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Skull size={16} color="#5B6BF5"/>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Resolution Rules</span>
        </div>
        <p style={{ fontSize: 11, lineHeight: 1.5, color: "var(--text-muted)", margin: 0 }}>
          A company resolves <span style={{ color: "var(--dead)" }}>DEAD</span> on bankruptcy, distress acquisition, or 80%+ revenue collapse within the resolution window. Otherwise <span style={{ color: "var(--alive)" }}>ALIVE</span>.
        </p>
      </div>

      {/* FEATURE 7 — Death Watch */}
      <DeathWatchWidget/>
    </aside>
  );
}

// Market card
function MarketCard({ market, onOpen, onQuickBet, onShare, viewMode }) {
  const m = market;
  const favored = m.death >= m.survives ? "DEAD" : "ALIVE";
  const headlinePct = favored === "DEAD" ? m.death : m.survives;
  const headlineColor = favored === "DEAD" ? "var(--dead)" : "var(--alive)";

  const trend24 = m.change24h;
  const trendColor = trend24 > 0 ? "var(--dead)" : "var(--alive)";
  const trendSign = trend24 > 0 ? "▲" : "▼";
  const closing = m.daysLeft <= 30;

  return (
    <div className="card hover" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, cursor: "pointer", minHeight: 240, position: "relative" }} onClick={() => onOpen(m)}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <Logo name={m.name} size={36} hue={m.logo.hue} initials={m.logo.initials} />
          <div style={{ minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>{m.name}</div>
            <CatTag category={m.category} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {closing && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "var(--dead)", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 5, padding: "2px 6px" }}>CLOSING</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onShare?.(m); }}
              title="Share"
              aria-label={`Share ${m.name} market`}
              style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <Sparkline series={m.series} width={92} height={32} favored={favored} />
        </div>
      </div>

      {viewMode === "movers" && (
        <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: trendColor, background: trend24 > 0 ? "rgba(239,68,68,0.10)" : "rgba(16,185,129,0.10)", border: `1px solid ${trend24 > 0 ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: 7, padding: "3px 9px" }}>
          {trendSign} {fmtSigned(Math.abs(trend24))} in 24h
        </div>
      )}
      {viewMode === "risk" && (
        <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--dead)", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, padding: "3px 9px" }}>
          💀 High risk · {fmtPct(m.death)} DEAD
        </div>
      )}

      {/* Big odds row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            {favored === "DEAD" ? "AI kills it" : "Survives"}
          </div>
          <div className="font-mono card-odds" style={{ fontSize: 32, fontWeight: 600, color: headlineColor, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {fmtPct(headlinePct)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>24h</div>
          <div className="font-mono" style={{ fontSize: 13, color: trendColor }}>
            {trendSign} {fmtSigned(Math.abs(trend24))}
          </div>
        </div>
      </div>

      {/* Bar */}
      <div>
        <div className="bar">
          <div className="dead-fill" style={{ width: `${m.death * 100}%` }}/>
          <div className="alive-fill" style={{ width: `${m.survives * 100}%` }}/>
        </div>
        <div className="font-mono" style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
          <span style={{ color: "var(--dead)" }}>DEAD {fmtPct(m.death)}</span>
          <span style={{ color: "var(--alive)" }}>ALIVE {fmtPct(m.survives)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: "auto" }}>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)" }}>
          <span><span className="font-mono" style={{ color: "var(--text)" }}>{fmtMoney(m.volume)}</span> vol</span>
          <span><span className="font-mono" style={{ color: "var(--text)" }}>{m.traders.toLocaleString()}</span> traders</span>
          <span><span className="font-mono" style={{ color: "var(--text)" }}>{fmtDays(m.daysLeft)}</span></span>
        </div>
        <div className="card-quickbets" style={{ display: "flex", gap: 4 }}>
          {[10, 50, 100].map(v => (
            <button
              key={v}
              className="btn btn-sm"
              onClick={(e) => { e.stopPropagation(); onQuickBet?.(m, favored, v); }}
              style={{ padding: "5px 9px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
            >+${v}</button>
          ))}
        </div>
        <button
          className="card-betbtn btn btn-sm"
          onClick={(e) => { e.stopPropagation(); onQuickBet?.(m, favored, 50); }}
          style={{ display: "none", borderColor: "var(--indigo)", color: "var(--indigo)", background: "transparent", padding: "7px 16px", fontWeight: 600 }}
        >+ Bet</button>
      </div>
    </div>
  );
}

// Compact market row — FIX 5
function CompactMarketRow({ market, onOpen, onQuickBet }) {
  const m = market;
  const favored = m.death >= m.survives ? "DEAD" : "ALIVE";
  return (
    <div
      className="compact-row"
      onClick={() => onOpen(m)}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 18px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.12s ease" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(91,107,245,0.04)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <Logo name={m.name} size={32} hue={m.logo.hue} initials={m.logo.initials}/>
      <div className="compact-name" style={{ minWidth: 0, flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
        <span style={{ alignSelf: "flex-start" }}><CatTag category={m.category}/></span>
      </div>
      <div className="compact-spark" style={{ flexShrink: 0 }}><Sparkline series={m.series} width={80} height={24} favored={favored}/></div>
      <div className="font-mono compact-odds" style={{ width: 64, textAlign: "right", fontSize: 13, color: "var(--dead)", fontWeight: 600, flexShrink: 0 }}>{fmtPct(m.death)}</div>
      <div className="font-mono compact-odds" style={{ width: 64, textAlign: "right", fontSize: 13, color: "var(--alive)", fontWeight: 600, flexShrink: 0 }}>{fmtPct(m.survives)}</div>
      <div className="font-mono compact-vol" style={{ width: 70, textAlign: "right", fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{fmtMoney(m.volume)}</div>
      <div className="compact-bets" style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {[10, 50, 100].map(v => (
          <button
            key={v}
            className="btn btn-sm"
            onClick={(e) => { e.stopPropagation(); onQuickBet?.(m, favored, v); }}
            style={{ padding: "5px 9px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
          >+${v}</button>
        ))}
      </div>
    </div>
  );
}

// Activity ticker
function ActivityTicker({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="ticker-wrap">
      <div className="ticker-track font-mono" style={{ fontSize: 12 }}>
        {doubled.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text)" }}>{t.user}</span>
            <span>bet</span>
            <span style={{ color: "var(--text)" }}>${t.amt}</span>
            <span>on</span>
            <span style={{ color: t.side === "DEAD" ? "var(--dead)" : "var(--alive)", fontWeight: 600 }}>{t.side}</span>
            <span>·</span>
            <span style={{ color: "var(--text)" }}>{t.market}</span>
            <span style={{ color: "var(--border-strong)", marginLeft: 8 }}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- Social atoms ----
function Avatar({ username, hue = 210, size = 32, ring }) {
  const initial = (username || "?").replace(/^@/, "").charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `oklch(0.42 0.12 ${hue})`, color: `oklch(0.96 0.04 ${hue})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: size * 0.42,
      border: ring ? `2px solid ${ring}` : "none",
    }}>{initial}</div>
  );
}

function FollowButton({ username, size = "sm", full }) {
  const social = React.useContext(SocialContext);
  if (!social) return null;
  const following = social.isFollowing(username);
  const isSelf = username.replace(/^@/, "") === social.currentUser.username;
  if (isSelf) return null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); social.toggleFollow(username); }}
      className="btn"
      style={{
        padding: size === "sm" ? "5px 12px" : "8px 16px",
        fontSize: size === "sm" ? 12 : 13,
        width: full ? "100%" : "auto",
        background: following ? "transparent" : "var(--indigo)",
        borderColor: following ? "rgba(91,107,245,0.5)" : "var(--indigo)",
        color: following ? "var(--indigo)" : "white",
        gap: 6,
      }}
    >
      {following && <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {following ? "Following" : "Follow"}
    </button>
  );
}

// Clickable avatar + username that routes to a profile
function UserChip({ username, hue, size = 30, bold = true, sub }) {
  const social = React.useContext(SocialContext);
  const go = (e) => { e.stopPropagation(); social?.navigate({ name: "profile", username: username.replace(/^@/, "") }); };
  return (
    <button onClick={go} style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left" }}>
      <Avatar username={username} hue={hue} size={size}/>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: bold ? 600 : 500 }}>@{username.replace(/^@/, "")}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>}
      </div>
    </button>
  );
}

// ---- P2P Challenge card ----
function StatusBadge({ status }) {
  const map = {
    pending: ["PENDING", "var(--warn)", "rgba(245,158,11,0.12)", "rgba(245,158,11,0.3)"],
    open:    ["OPEN", "var(--warn)", "rgba(245,158,11,0.12)", "rgba(245,158,11,0.3)"],
    active:  ["ACTIVE", "var(--indigo)", "rgba(91,107,245,0.12)", "rgba(91,107,245,0.35)"],
    incoming:["AWAITING YOU", "var(--indigo)", "rgba(91,107,245,0.12)", "rgba(91,107,245,0.35)"],
    won:     ["RESOLVED · WON", "var(--alive)", "rgba(16,185,129,0.12)", "rgba(16,185,129,0.3)"],
    lost:    ["RESOLVED · LOST", "var(--dead)", "rgba(239,68,68,0.12)", "rgba(239,68,68,0.3)"],
  };
  const [label, color, bg, bd] = map[status] || map.open;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 6, color, background: bg, border: `1px solid ${bd}` }}>{label}</span>
  );
}

function SidePill({ side }) {
  const dead = side === "DEAD";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
      padding: "4px 10px", borderRadius: 7,
      color: dead ? "var(--dead)" : "var(--alive)",
      background: dead ? "rgba(239,68,68,0.10)" : "rgba(16,185,129,0.10)",
      border: `1px solid ${dead ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
    }}>
      {dead ? <Skull size={12} color="currentColor"/> : <HeartPulse size={12} color="currentColor"/>}
      {side}
    </span>
  );
}

// challenge: { challenger?, from?, opponent?, market, challengerSide/yourSide/theirSide, stake, status }
function ChallengeCard({ challenge, variant = "open", onAccept, onDecline }) {
  const social = React.useContext(SocialContext);
  const c = challenge;
  const m = c.market;
  const pot = c.stake * 2;
  const net = pot * (1 - FEE_RATE);

  // Resolve display roles
  let leftUser, leftSide, rightUser, rightSide, status;
  if (variant === "open") {
    leftUser = c.challenger; leftSide = c.challengerSide;
    rightUser = null; rightSide = c.challengerSide === "DEAD" ? "ALIVE" : "DEAD";
    status = "open";
  } else if (variant === "incoming") {
    leftUser = c.from; leftSide = c.theirSide;
    rightUser = social?.currentUser; rightSide = c.theirSide === "DEAD" ? "ALIVE" : "DEAD";
    status = "incoming";
  } else {
    // mine
    leftUser = social?.currentUser; leftSide = c.yourSide;
    rightUser = c.opponent; rightSide = c.yourSide === "DEAD" ? "ALIVE" : "DEAD";
    status = c.status === "resolved" ? (c.outcome === "WON" ? "won" : "lost") : c.status;
  }

  const resolveDate = new Date(Date.now() + m.daysLeft * 86400000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const Side = ({ user, side, isMe, ghost }) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 }}>
      {(ghost || !user) ? (
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px dashed var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 20, fontWeight: 700 }}>?</div>
      ) : (
        <Avatar username={user.username} hue={user.hue} size={44}/>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
        {(ghost || !user) ? "Open seat" : (isMe ? "You" : "@" + user.username.replace(/^@/, ""))}
      </div>
      <SidePill side={side}/>
      <div className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>${c.stake}</div>
    </div>
  );

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <StatusBadge status={status}/>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.createdMinsAgo != null ? `${c.createdMinsAgo}m ago` : `Resolves ${resolveDate}`}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Side user={leftUser} side={leftSide} isMe={variant === "mine"}/>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 22 }}>⚔️</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>VS</div>
        </div>
        <Side user={rightUser} side={rightSide} isMe={variant === "incoming"} ghost={variant === "open"}/>
      </div>

      <button onClick={() => social?.navigate({ name: "market", id: m.id })} style={{ display: "block", width: "100%", textAlign: "center", margin: "14px 0 4px", fontSize: 13, fontWeight: 600 }}>
        {m.name}
      </button>
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>
        Pot <span className="font-mono" style={{ color: "var(--text)" }}>${pot}</span> · winner nets <span className="font-mono" style={{ color: "var(--alive)" }}>${net.toFixed(0)}</span> after 2% fee
      </div>

      {variant === "open" && (
        <button className="btn alive" style={{ width: "100%", padding: "12px" }} onClick={() => onAccept?.(c)}>
          Accept Challenge · ${c.stake}
        </button>
      )}
      {variant === "incoming" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn alive" style={{ flex: 1, padding: "11px" }} onClick={() => onAccept?.(c)}>Accept · ${c.stake}</button>
          <button className="btn" style={{ flex: 1, padding: "11px" }} onClick={() => onDecline?.(c)}>Decline</button>
        </div>
      )}
      {variant === "mine" && status === "pending" && (
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>Waiting for an opponent to accept…</div>
      )}
      {variant === "mine" && status === "active" && (
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--indigo)" }}>Locked in — settles on market resolution.</div>
      )}
      {variant === "mine" && (status === "won" || status === "lost") && (
        <div className="font-mono" style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: status === "won" ? "var(--alive)" : "var(--dead)" }}>
          {status === "won" ? `+$${net.toFixed(0)} payout` : `-$${c.stake} lost`}
        </div>
      )}
    </div>
  );
}

// ---- Reputation badges (FEATURE 5) ----
function CategoryBadge({ badge, showLabel = true, compact = false, size = "sm" }) {
  if (!badge) return null;
  const label = compact ? badge.tier : `${badge.tier} · ${badge.category}`;
  return (
    <span title={`${badge.tier} in ${badge.category}`} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: size === "sm" ? 10 : 11, fontWeight: 600,
      padding: size === "sm" ? "2px 7px" : "4px 9px", borderRadius: 6,
      color: badge.color, background: `${badge.color}1A`, border: `1px solid ${badge.color}55`,
      whiteSpace: "nowrap",
    }}>
      <span>{badge.emoji}</span>
      {(showLabel || compact) && <span>{label}</span>}
    </span>
  );
}

// ---- Calibration bar (FEATURE 4) ----
function CalibrationBar({ value }) {
  const pct = Math.round(value * 100);
  const color = value > 0.8 ? "var(--alive)" : value >= 0.6 ? "var(--warn)" : "var(--dead)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <div style={{ width: 56, height: 6, borderRadius: 999, background: "var(--bg-elev)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }}/>
      </div>
      <span className="font-mono" style={{ fontSize: 12, color, fontWeight: 600, minWidth: 34, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ---- Countdown urgency (FEATURE 3) ----
function CountdownPill({ daysLeft }) {
  if (daysLeft > 90) {
    return <span className="font-mono" style={{ fontSize: 18, fontWeight: 600 }}>{fmtDays(daysLeft)}</span>;
  }
  if (daysLeft > 30) {
    return <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--warn)" }}>⚡ {daysLeft}d left</span>;
  }
  return (
    <span className="font-mono pulse-urgent" style={{ fontSize: 17, fontWeight: 700, color: "var(--dead)" }}>🔴 {daysLeft}d — closing soon</span>
  );
}

// ---- AI Signal divergence (FEATURE 6) ----
function AISignalCard({ market }) {
  const m = market;
  const r = mulberry32(m.id * 977 + 13);
  const aiConfidence = Math.max(2, Math.min(98, m.death * 100 + r() * 12 - 6));
  const crowd = m.death * 100;
  const diverge = Math.abs(aiConfidence - crowd);

  let label, color, glyph;
  if (m.death > 0.75) { label = "STRONG DEAD"; color = "#EF4444"; glyph = <Skull size={15} color="#EF4444"/>; }
  else if (m.death > 0.55) { label = "LEAN DEAD"; color = "#F59E0B"; glyph = <span>📉</span>; }
  else if (m.death < 0.20) { label = "STRONG ALIVE"; color = "#22D38B"; glyph = <HeartPulse size={15} color="#22D38B"/>; }
  else if (m.death < 0.35) { label = "LEAN ALIVE"; color = "#10B981"; glyph = <span>📈</span>; }
  else { label = "TOSS-UP"; color = "#9CA3AF"; glyph = <span>⚖️</span>; }

  return (
    <div className="card" style={{ padding: 18, borderColor: "rgba(91,107,245,0.25)", background: "linear-gradient(180deg, rgba(91,107,245,0.05), transparent 45%), var(--surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>AI Model Assessment</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, color, background: `${color}1A`, border: `1px solid ${color}55` }}>
          {glyph} {label}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "var(--bg-elev)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI confidence (DEAD)</div>
          <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, color, marginTop: 2 }}>{aiConfidence.toFixed(1)}%</div>
        </div>
        <div style={{ background: "var(--bg-elev)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Crowd odds (DEAD)</div>
          <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{crowd.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: diverge > 8 ? "rgba(91,107,245,0.10)" : "rgba(16,185,129,0.08)", border: `1px solid ${diverge > 8 ? "rgba(91,107,245,0.35)" : "rgba(16,185,129,0.3)"}`, color: diverge > 8 ? "var(--indigo)" : "var(--alive)" }}>
        {diverge > 8
          ? <span>⚡ Signal diverges from crowd by {diverge.toFixed(1)}pp — potential edge</span>
          : <span>✓ AI and crowd agree</span>}
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
        AI signal based on revenue trend analysis, analyst sentiment, and category base rates. Not financial advice.
      </p>
    </div>
  );
}

// ---- Shareable bet card + share sheet (FEATURE 7) ----
function ShareBetCard({ market, side, amt }) {
  const m = market;
  const hasBet = side && amt;
  const price = side === "DEAD" ? m.death : m.survives;
  const net = hasBet ? (amt / Math.max(0.01, price)) * (1 - FEE_RATE) : 0;
  const sideColor = side === "DEAD" ? "#EF4444" : "#10B981";

  return (
    <div style={{
      background: "#0A0B14", borderRadius: 16, padding: 24, position: "relative", overflow: "hidden",
      border: "1.5px solid transparent",
      backgroundImage: "linear-gradient(#0A0B14, #0A0B14), linear-gradient(135deg, #5B6BF5, #8B5CF6)",
      backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box",
    }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #5B6BF5, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Skull size={17} color="#0A0B14"/>
        </div>
        <span className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>Dead or Alive</span>
      </div>

      <div className="font-display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, marginBottom: 16 }}>
        {hasBet
          ? (side === "DEAD"
              ? <span>I just bet <span style={{ color: "#fff" }}>{m.name}</span> gets 💀 wiped out by AI</span>
              : <span>I just bet <span style={{ color: "#fff" }}>{m.name}</span> survives 🟢 the AI wave</span>)
          : <span>Will AI kill <span style={{ color: "#fff" }}>{m.name}</span>?</span>}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: hasBet ? 16 : 4 }}>
        <div style={{ flex: 1, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI kills it</div>
          <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: "#EF4444" }}>{fmtPct(m.death)}</div>
        </div>
        <div style={{ flex: 1, background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Survives</div>
          <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: "#10B981" }}>{fmtPct(m.survives)}</div>
        </div>
      </div>

      {hasBet && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>My bet</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>${amt} on <span style={{ color: sideColor }}>{side}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Net payout</div>
            <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--alive)" }}>${net.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
        <span style={{ color: "var(--indigo)" }}>@DeadOrAliveAI · deadoralive.io</span>
        <span>#DeadOrAlive #AIDisruption</span>
      </div>
    </div>
  );
}

function ShareSheet({ share, onClose }) {
  const social = React.useContext(SocialContext);
  if (!share) return null;
  const { market, side, amt } = share;
  const url = "https://deadoralive.io/m/" + market.slug;
  const text = side
    ? `I just bet ${market.name} ${side === "DEAD" ? "gets 💀 wiped out by AI" : "survives 🟢 the AI wave"} — $${amt} on ${side}. ${url} #DeadOrAlive #AIDisruption`
    : `Will AI kill ${market.name}? DEAD ${fmtPct(market.death)} / ALIVE ${fmtPct(market.survives)} — ${url} #DeadOrAlive #AIDisruption`;

  const tweet = () => window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(text), "_blank", "noopener");
  const copy = () => {
    const done = () => social?.showToast({ type: "info", message: "Link copied!" });
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done).catch(done);
    else done();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,6,12,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.18s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, animation: "popIn 0.22s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Share your bet</span>
          <button onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: 8, color: "var(--text-muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <ShareBetCard market={market} side={side} amt={amt}/>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn primary" onClick={tweet} style={{ flex: 1, padding: "12px" }}>🐦 Tweet this</button>
          <button className="btn" onClick={copy} style={{ flex: 1, padding: "12px" }}>📋 Copy link</button>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes popIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// Toast — FIX 3: handles bet-placed (default), wallet, error, connected, info
function Toast({ toast }) {
  if (!toast) return null;

  const WalletIcon = ({ color }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="6" width="19" height="13" rx="3" stroke={color} strokeWidth="1.8"/>
      <path d="M16 12.5h2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M2.5 9.5h12" stroke={color} strokeWidth="1.8"/>
    </svg>
  );

  let accent = "var(--indigo)";
  let title = "Bet placed";
  let body = null;
  let icon = null;

  if (toast.type === "wallet") {
    accent = "var(--indigo)";
    title = "Wallet required";
    icon = <WalletIcon color="var(--indigo)"/>;
    body = <span>Connect your wallet to place bets.</span>;
  } else if (toast.type === "error") {
    accent = "var(--dead)";
    title = "Something went wrong";
    icon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--dead)" strokeWidth="1.8"/><path d="M12 7v6M12 16h.01" stroke="var(--dead)" strokeWidth="1.8" strokeLinecap="round"/></svg>
    );
    body = <span>{toast.message || "Unexpected error."}</span>;
  } else if (toast.type === "connected") {
    accent = "var(--alive)";
    title = toast.address ? "Wallet connected!" : (toast.title || "Success");
    icon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--alive)" strokeWidth="1.8"/><path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="var(--alive)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
    body = toast.address
      ? <span className="font-mono" style={{ fontSize: 12 }}>{toast.address.slice(0, 6) + "…" + toast.address.slice(-4)}</span>
      : <span>{toast.message || ""}</span>;
  } else if (toast.type === "info") {
    accent = "var(--indigo)";
    title = "Heads up";
    icon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--indigo)" strokeWidth="1.8"/><path d="M12 11v5M12 8h.01" stroke="var(--indigo)" strokeWidth="1.8" strokeLinecap="round"/></svg>
    );
    body = <span>{toast.message}</span>;
  } else {
    // default bet-placed
    const sideColor = toast.side === "DEAD" ? "var(--dead)" : "var(--alive)";
    accent = toast.paper ? "var(--warn)" : sideColor;
    title = toast.paper ? "Paper bet placed" : "Bet placed";
    body = (
      <span>
        {toast.paper && (
          <span style={{ display: "inline-block", marginRight: 6, fontSize: 10, fontWeight: 700, color: "#0A0B14", background: "var(--warn)", borderRadius: 5, padding: "1px 6px", verticalAlign: "middle" }}>📄 PAPER BET</span>
        )}
        ${toast.amt} on <span style={{ color: sideColor, fontWeight: 600 }}>{toast.side}</span> · {toast.name}
        {toast.streak > 1 && (
          <span style={{ display: "block", marginTop: 6, fontWeight: 600, color: "var(--warn)" }}>
            🔥 {toast.streak}-win streak! Keep it going.
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 100,
      background: "var(--surface)", border: "1px solid var(--border-strong)", borderLeft: `3px solid ${accent}`,
      borderRadius: 10, padding: "12px 16px", minWidth: 280, maxWidth: 360,
      boxShadow: "0 16px 40px -12px rgba(0,0,0,0.6)",
      animation: "slideUp 0.3s ease",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      {icon && <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13 }}>{body}</div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

// ---- Email capture (FEATURE 3a) ----
function EmailCaptureModal({ onClose, onSubscribe }) {
  const [email, setEmail] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "#111827", border: "1px solid #1F2937", borderRadius: 16, padding: 32, textAlign: "center", animation: "popIn 0.25s ease" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>💀</div>
        <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Stay ahead of the kill</h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "10px 0 20px", lineHeight: 1.5 }}>Get our Friday AI Disruption Digest and alerts when your positions move 10%+.</p>
        <input
          className="input"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 12, textAlign: "center" }}
        />
        <button className="btn primary" style={{ width: "100%", height: 44, fontSize: 14 }} onClick={() => onSubscribe(email)}>Subscribe for free</button>
        <button onClick={onClose} style={{ display: "block", width: "100%", textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>No thanks</button>
      </div>
    </div>
  );
}

// ---- Onboarding (FEATURE 4) ----
function OnboardingModal({ onFinish }) {
  const [step, setStep] = useState(1);
  const Dots = ({ n }) => (
    <div style={{ display: "flex", gap: 7, justifyContent: "center", marginTop: 20 }}>
      {[1, 2, 3].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= n ? "var(--indigo)" : "var(--border-strong)" }}/>)}
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(5,6,12,0.88)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.2s ease" }}>
      <div className="card" style={{ width: "100%", maxWidth: 460, padding: 32, position: "relative", animation: "popIn 0.25s ease" }}>
        {step === 1 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, margin: "0 auto 18px", background: "linear-gradient(135deg, #5B6BF5, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 36px rgba(91,107,245,0.5)" }}>
              <Skull size={40} color="#0A0B14"/>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Step 1 of 3</div>
            <h2 className="font-display" style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Welcome to Dead or Alive</h2>
            <p style={{ fontSize: 15, color: "var(--text)", margin: "10px 0 4px", fontWeight: 500 }}>The prediction market for the AI apocalypse</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 22px", lineHeight: 1.5 }}>Bet on whether AI wipes out the world's biggest companies. Real money. Real outcomes.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {[["💀", "120 Live Markets"], ["⚔️", "Challenge Traders"], ["🏆", "Weekly Tournaments"]].map(([e, t]) => (
                <div key={t} style={{ flex: 1, padding: "14px 8px", background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12 }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{e}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.3 }}>{t}</div>
                </div>
              ))}
            </div>
            <button className="btn primary" style={{ width: "100%", padding: 14, fontSize: 15 }} onClick={() => setStep(2)}>Let's go →</button>
            <button onClick={() => onFinish("skip")} style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>Skip</button>
            <Dots n={1}/>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, textAlign: "center" }}>Step 2 of 3</div>
            <h2 className="font-display" style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 700, textAlign: "center", letterSpacing: "-0.02em" }}>How it works</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[["🔍", "Pick a company", "Browse 120 markets or search for any company at AI risk"],
                ["💀", "Choose your side", "Bet DEAD (AI kills it) or ALIVE (it survives)"],
                ["💰", "Collect your winnings", "Market resolves, winners paid out. Platform takes 2% fee."]].map(([e, t, d]) => (
                <div key={t} style={{ display: "flex", gap: 14, alignItems: "center", padding: 14, background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 12 }}>
                  <div style={{ fontSize: 26, flexShrink: 0 }}>{e}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn primary" style={{ width: "100%", padding: 14, fontSize: 15, marginTop: 22 }} onClick={() => setStep(3)}>Got it →</button>
            <Dots n={2}/>
          </div>
        )}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Step 3 of 3</div>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
            <h2 className="font-display" style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Try it risk-free</h2>
            <p style={{ fontSize: 14, color: "var(--text)", margin: "8px 0 2px", fontWeight: 600 }}>Start with paper trading</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 22px", lineHeight: 1.5 }}>Practice with $10,000 in virtual funds. No real money needed until you're ready.</p>
            <button className="btn primary" style={{ width: "100%", padding: 14, fontSize: 15, marginBottom: 10 }} onClick={() => onFinish("paper")}>Start Paper Trading</button>
            <button className="btn" style={{ width: "100%", padding: 14, fontSize: 15 }} onClick={() => onFinish("live")}>Connect Wallet & Bet Real</button>
            <Dots n={3}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Push notification bar (FEATURE 4) ----
function NotificationBar({ onEnable, onDismiss }) {
  return (
    <div style={{ width: "100%", minHeight: 48, background: "#5B6BF5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "8px 16px", flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>🔔 Get real-time alerts when your markets move. Enable notifications →</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onEnable} style={{ padding: "6px 14px", borderRadius: 8, background: "white", color: "#5B6BF5", fontWeight: 600, fontSize: 13 }}>Enable</button>
        <button onClick={onDismiss} title="Dismiss" aria-label="Dismiss" style={{ width: 30, height: 30, borderRadius: 8, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✕</button>
      </div>
    </div>
  );
}

// ---- Mobile bottom nav (FEATURE 5a) ----
function BottomNav({ route, navigate }) {
  const social = React.useContext(SocialContext);
  const [hasAlerts, setHasAlerts] = useState(false);
  useEffect(() => {
    const check = () => { try { setHasAlerts(JSON.parse(localStorage.getItem("doa_alerts") || "[]").length > 0); } catch (e) { setHasAlerts(false); } };
    check();
    window.addEventListener("doa-alerts-changed", check);
    return () => window.removeEventListener("doa-alerts-changed", check);
  }, []);
  const icons = {
    grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>,
    chart: <path d="M3 3v18h18M7 14l3-3 3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    trophy: <path d="M7 4h10v3a5 5 0 01-10 0V4zM5 5H3v2a3 3 0 003 3M19 5h2v2a3 3 0 01-3 3M9 16h6M10 20h4M12 13v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    bell: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    user: <path d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
  };
  const tabs = [
    ["Markets", "markets", icons.grid, false],
    ["Portfolio", "portfolio", icons.chart, false],
    ["Leaderboard", "leaderboard", icons.trophy, false],
    ["Alerts", "alerts", icons.bell, true],
    ["Profile", "profile", icons.user, false],
  ];
  const isActive = (key) => route.name === key || (key === "profile" && route.name === "profile");
  return (
    <nav className="bottom-nav">
      {tabs.map(([label, key, icon, alertDot]) => {
        const active = isActive(key);
        return (
          <button key={key} onClick={() => navigate(key === "profile" ? { name: "profile", username: social?.currentUser.username || "you" } : { name: key })}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0", color: active ? "var(--indigo)" : "#6B7280", position: "relative" }}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              <svg width="22" height="22" viewBox="0 0 24 24">{icon}</svg>
              {alertDot && hasAlerts && <span style={{ position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--dead)", border: "1.5px solid #111827" }}/>}
            </span>
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

Object.assign(window, {
  fmtPct, fmtPct1, fmtMoney, fmtSigned, fmtDays, FEE_RATE, currentStreak,
  Skull, HeartPulse, Logo, Sparkline, CatTag,
  SocialContext, Avatar, FollowButton, UserChip, StatusBadge, SidePill, ChallengeCard,
  CategoryBadge, CalibrationBar, CountdownPill, AISignalCard, ShareBetCard, ShareSheet,
  PaperPill, NotificationBell, DeathWatchWidget, OnboardingModal, dwColor,
  EmailCaptureModal, NotificationBar, BottomNav,
  TopNav, Sidebar, MarketCard, CompactMarketRow, ActivityTicker, Toast,
});
