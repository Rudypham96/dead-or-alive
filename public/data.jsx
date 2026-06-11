// ---- Dead or Alive: market data ----
// Deterministic pseudo-random so refreshes look the same.
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAW_MARKETS = [
  // category, name, baseDeath (0..1), volumeMillions
  ["Education", "Chegg", 0.88, 4.2],
  ["Education", "2U / edX", 0.81, 1.1],
  ["Education", "Coursera", 0.62, 2.7],
  ["Education", "Udemy", 0.71, 1.8],
  ["Education", "Skillshare", 0.74, 0.6],
  ["Education", "Kaplan", 0.66, 0.9],
  ["Education", "Princeton Review", 0.69, 0.4],
  ["Education", "Varsity Tutors", 0.83, 0.7],
  ["Education", "Pearson Digital", 0.58, 1.4],
  ["Education", "Cengage", 0.64, 0.8],

  ["BPO & Call Centers", "Teleperformance", 0.79, 6.1],
  ["BPO & Call Centers", "Concentrix", 0.76, 3.4],
  ["BPO & Call Centers", "TTEC Holdings", 0.72, 1.2],
  ["BPO & Call Centers", "Conduent", 0.74, 0.9],
  ["BPO & Call Centers", "TaskUs", 0.81, 2.0],
  ["BPO & Call Centers", "Sutherland Global", 0.70, 0.5],
  ["BPO & Call Centers", "Foundever", 0.77, 0.8],
  ["BPO & Call Centers", "Alorica", 0.73, 0.6],
  ["BPO & Call Centers", "Synnex", 0.42, 1.1],
  ["BPO & Call Centers", "Arise Virtual Solutions", 0.80, 0.3],

  ["Stock Photography", "Shutterstock", 0.84, 3.8],
  ["Stock Photography", "Getty Images", 0.71, 4.5],
  ["Stock Photography", "Dreamstime", 0.86, 0.4],
  ["Stock Photography", "Depositphotos", 0.85, 0.5],
  ["Stock Photography", "123RF", 0.87, 0.3],
  ["Stock Photography", "Bigstock", 0.84, 0.2],
  ["Stock Photography", "Corbis", 0.90, 0.2],
  ["Stock Photography", "EyeEm", 0.82, 0.3],
  ["Stock Photography", "Westend61", 0.78, 0.2],
  ["Stock Photography", "Alamy", 0.76, 0.4],

  ["Freelance Platforms", "Fiverr", 0.74, 5.3],
  ["Freelance Platforms", "Upwork", 0.69, 4.8],
  ["Freelance Platforms", "Freelancer.com", 0.78, 1.0],
  ["Freelance Platforms", "Guru.com", 0.81, 0.3],
  ["Freelance Platforms", "PeoplePerHour", 0.79, 0.3],
  ["Freelance Platforms", "Toptal", 0.41, 1.4],
  ["Freelance Platforms", "99designs", 0.83, 0.6],
  ["Freelance Platforms", "DesignCrowd", 0.85, 0.2],
  ["Freelance Platforms", "Bark.com", 0.66, 0.5],
  ["Freelance Platforms", "Worksome", 0.59, 0.3],

  ["Staffing & Recruiting", "Robert Half", 0.61, 2.2],
  ["Staffing & Recruiting", "ManpowerGroup", 0.55, 1.6],
  ["Staffing & Recruiting", "Kforce", 0.58, 0.7],
  ["Staffing & Recruiting", "Kelly Services", 0.60, 0.9],
  ["Staffing & Recruiting", "Adecco", 0.53, 1.5],
  ["Staffing & Recruiting", "Randstad", 0.51, 1.4],
  ["Staffing & Recruiting", "Heidrick & Struggles", 0.38, 0.6],
  ["Staffing & Recruiting", "MPS Group", 0.62, 0.3],
  ["Staffing & Recruiting", "Spherion", 0.64, 0.2],
  ["Staffing & Recruiting", "Volt Information Sciences", 0.67, 0.2],

  ["Translation Services", "TransPerfect", 0.86, 1.8],
  ["Translation Services", "Lionbridge", 0.88, 1.4],
  ["Translation Services", "RWS Holdings", 0.83, 1.1],
  ["Translation Services", "SDL Group", 0.85, 0.4],
  ["Translation Services", "Welocalize", 0.82, 0.5],
  ["Translation Services", "LanguageLine Solutions", 0.79, 0.6],
  ["Translation Services", "Transperfect Legal", 0.84, 0.3],
  ["Translation Services", "thebigword", 0.87, 0.2],
  ["Translation Services", "Semantix", 0.81, 0.2],
  ["Translation Services", "Acolad", 0.83, 0.3],

  ["Advertising Agencies", "WPP", 0.64, 3.0],
  ["Advertising Agencies", "Interpublic Group", 0.62, 2.1],
  ["Advertising Agencies", "Havas Group", 0.59, 0.9],
  ["Advertising Agencies", "Dentsu", 0.66, 1.3],
  ["Advertising Agencies", "Grey Group", 0.68, 0.4],
  ["Advertising Agencies", "FCB Global", 0.67, 0.4],
  ["Advertising Agencies", "Leo Burnett", 0.65, 0.5],
  ["Advertising Agencies", "BBDO", 0.63, 0.6],
  ["Advertising Agencies", "Ogilvy", 0.57, 0.7],
  ["Advertising Agencies", "McCann Worldgroup", 0.60, 0.6],

  ["Legal Support", "RELX / LexisNexis", 0.46, 1.9],
  ["Legal Support", "Thomson Reuters Legal", 0.43, 2.4],
  ["Legal Support", "Wolters Kluwer Legal", 0.45, 1.0],
  ["Legal Support", "Donnelley Financial", 0.71, 0.5],
  ["Legal Support", "Epiq Systems", 0.69, 0.6],
  ["Legal Support", "Consilio", 0.74, 0.3],
  ["Legal Support", "Kroll (legal division)", 0.55, 0.4],
  ["Legal Support", "DTI", 0.78, 0.2],
  ["Legal Support", "Document Technologies", 0.81, 0.2],
  ["Legal Support", "Conduent Legal", 0.76, 0.3],

  ["Tax Preparation", "H&R Block", 0.77, 2.6],
  ["Tax Preparation", "Jackson Hewitt", 0.80, 0.7],
  ["Tax Preparation", "Liberty Tax", 0.82, 0.5],
  ["Tax Preparation", "TaxAct", 0.74, 0.6],
  ["Tax Preparation", "TaxSlayer", 0.76, 0.4],
  ["Tax Preparation", "1-800Accountant", 0.71, 0.3],
  ["Tax Preparation", "Bench Accounting", 0.83, 0.4],
  ["Tax Preparation", "Bookkeeper360", 0.79, 0.2],
  ["Tax Preparation", "Botkeeper", 0.65, 0.3],
  ["Tax Preparation", "Pilot.com", 0.60, 0.5],

  ["Enterprise Software", "ServiceNow", 0.22, 4.2],
  ["Enterprise Software", "Salesforce", 0.34, 5.6],
  ["Enterprise Software", "Zendesk", 0.71, 1.8],
  ["Enterprise Software", "Freshworks", 0.66, 0.9],
  ["Enterprise Software", "Sprinklr", 0.62, 0.5],
  ["Enterprise Software", "Veeva Systems", 0.28, 1.1],
  ["Enterprise Software", "Unity Software", 0.49, 1.4],
  ["Enterprise Software", "Adobe", 0.31, 4.8],
  ["Enterprise Software", "Bazaarvoice", 0.59, 0.4],
  ["Enterprise Software", "Braze", 0.42, 0.8],

  ["Publishing & Media", "BuzzFeed", 0.86, 1.2],
  ["Publishing & Media", "Vice Media", 0.91, 0.8],
  ["Publishing & Media", "Dotdash Meredith", 0.74, 0.9],
  ["Publishing & Media", "Vox Media", 0.72, 1.0],
  ["Publishing & Media", "IAC", 0.55, 1.3],
  ["Publishing & Media", "About.com", 0.88, 0.3],
  ["Publishing & Media", "HuffPost", 0.81, 0.5],
  ["Publishing & Media", "Bleacher Report", 0.78, 0.4],
  ["Publishing & Media", "Complex Networks", 0.79, 0.3],
  ["Publishing & Media", "Bustle Digital", 0.83, 0.3],

  ["Data & Transcription", "Rev.com", 0.84, 0.8],
  ["Data & Transcription", "Scribie", 0.87, 0.2],
  ["Data & Transcription", "TranscribeMe", 0.85, 0.2],
  ["Data & Transcription", "Appen", 0.78, 1.1],
  ["Data & Transcription", "Defined.ai", 0.65, 0.4],
  ["Data & Transcription", "iMerit", 0.69, 0.3],
  ["Data & Transcription", "Sama", 0.71, 0.5],
  ["Data & Transcription", "Alegion", 0.74, 0.2],
  ["Data & Transcription", "Labelbox", 0.52, 0.7],
  ["Data & Transcription", "Telus International", 0.66, 0.9],
];

// Build a sparkline series of length N that ends near `end` and walks backwards.
function makeSeries(rng, end, len = 60, vol = 0.06) {
  const arr = new Array(len);
  arr[len - 1] = end;
  for (let i = len - 2; i >= 0; i--) {
    const drift = (rng() - 0.5) * vol;
    let v = arr[i + 1] - drift;
    // pull toward a slightly lower historical mean to imply a trend
    v = v * 0.985 + 0.5 * 0.015;
    v = Math.max(0.04, Math.min(0.96, v));
    arr[i] = v;
  }
  return arr;
}

const CATEGORY_LIST = [
  "All",
  "Education",
  "BPO & Call Centers",
  "Stock Photography",
  "Freelance Platforms",
  "Staffing & Recruiting",
  "Translation Services",
  "Advertising Agencies",
  "Legal Support",
  "Tax Preparation",
  "Enterprise Software",
  "Publishing & Media",
  "Data & Transcription",
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function logoFor(name) {
  // 2-letter monogram + deterministic background tint via hue from name
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const initials = name
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");
  return { hue, initials: initials || "?" };
}

const MARKETS = RAW_MARKETS.map((row, i) => {
  const [category, name, baseDeath, volM] = row;
  const rng = mulberry32(0x9E3779B1 ^ (i * 2654435761));
  // jitter the headline odds slightly so it doesn't look engineered
  const death = Math.max(0.05, Math.min(0.97, baseDeath + (rng() - 0.5) * 0.04));
  const survives = 1 - death;
  const series = makeSeries(rng, death, 60, 0.05);
  const change24h = death - series[Math.max(0, series.length - 24)];
  const volume = Math.round(volM * 1_000_000 * (0.7 + rng() * 0.6));
  const traders = 200 + Math.round(rng() * 4800);
  // Most markets resolve far out, but seed a slice that closes within 30 days for urgency UI.
  const daysLeft = (i % 7 === 3)
    ? 4 + Math.floor(rng() * 25)      // 4–28 days → "closing soon" tier
    : 31 + Math.floor(rng() * 699);   // 31–729 days
  const slug = slugify(name) + "-" + i;
  return {
    id: i,
    slug,
    category,
    name,
    death,           // current implied probability AI KILLS IT
    survives,
    series,          // 60 points, in [0,1] death prob
    change24h,       // pct points
    volume,
    traders,
    daysLeft,
    logo: logoFor(name),
  };
});

// ----- Sample portfolio + leaderboard data -----
function pickIdx(rng, n) { return Math.floor(rng() * n); }

const _prng = mulberry32(0xBADCAFE);
const POSITIONS = (() => {
  const out = [];
  const taken = new Set();
  while (out.length < 9) {
    const i = pickIdx(_prng, MARKETS.length);
    if (taken.has(i)) continue;
    taken.add(i);
    const m = MARKETS[i];
    const side = _prng() < 0.6 ? "DEAD" : "ALIVE";
    const currentPrice = side === "DEAD" ? m.death : m.survives;
    // Make roughly a third of positions underwater so Recovery picks can surface.
    const losing = out.length % 3 === 0;
    const entryProb = losing
      ? Math.min(0.95, currentPrice + 0.05 + _prng() * 0.15)
      : Math.max(0.1, currentPrice - 0.05 - _prng() * 0.18);
    const shares = 50 + Math.floor(_prng() * 950);
    const avgPrice = entryProb;
    const cost = shares * avgPrice;
    const value = shares * currentPrice;
    const pnl = value - cost;
    const pct = pnl / cost;
    out.push({ market: m, side, shares, avgPrice, currentPrice, cost, value, pnl, pct });
  }
  return out;
})();

const RESOLVED = (() => {
  const out = [];
  const taken = new Set();
  while (out.length < 6) {
    const i = pickIdx(_prng, MARKETS.length);
    if (taken.has(i)) continue;
    taken.add(i);
    const m = MARKETS[i];
    const won = _prng() < 0.62;
    const side = _prng() < 0.5 ? "DEAD" : "ALIVE";
    const shares = 80 + Math.floor(_prng() * 600);
    const cost = shares * (0.2 + _prng() * 0.5);
    const grossPayout = won ? shares : 0;        // $1 per winning share
    const fee = grossPayout * 0.02;              // 2% platform fee on winnings only
    const payout = grossPayout - fee;            // net received
    out.push({
      market: m, side, shares, cost, grossPayout, fee, payout, pnl: payout - cost,
      resolvedDaysAgo: 1 + Math.floor(_prng() * 60),
      outcome: won ? "WON" : "LOST",
    });
  }
  return out;
})();

const PORTFOLIO_EQUITY = (() => {
  const arr = [];
  let v = 5000;
  const r = mulberry32(0xCAFEBABE);
  for (let i = 0; i < 90; i++) {
    v += (r() - 0.42) * 200;
    v = Math.max(1500, v);
    arr.push(Math.round(v));
  }
  return arr;
})();

const BADGE_CATEGORIES = CATEGORY_LIST.slice(1); // drop "All"
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function tierFor(winRate, bets) {
  if (winRate >= 0.75 && bets >= 10) return { tier: "Expert", emoji: "\uD83C\uDFC6", color: "#F59E0B" };
  if (winRate >= 0.65 && bets >= 5) return { tier: "Specialist", emoji: "\u2B50", color: "#5B6BF5" };
  if (bets >= 1) return { tier: "Analyst", emoji: "\uD83D\uDCCA", color: "#9CA3AF" };
  return null;
}
// Deterministic per-(user, category) expertise badge
function getCategoryBadge(username, category) {
  const r = mulberry32(hashStr(username.replace(/^@/, "") + "|" + category));
  const bets = Math.floor(r() * 19);
  const winRate = 0.45 + r() * 0.45;
  const t = tierFor(winRate, bets);
  if (!t) return null;
  return { ...t, category, winRate, bets };
}

const LEADERBOARD = (() => {
  const usernames = [
    "skullking", "bayesbot", "vega.weighted", "midas.eth", "delta.huxley",
    "kellyfraction", "shorting.tomorrow", "the.oracle", "puttygod", "longgamma",
    "carry.trader", "moloch", "paperhands", "diamondaxe", "alphabettor",
    "quanttherave", "tetonprism", "iron.condor", "blackswan23", "mu.sigma",
  ];
  const r = mulberry32(0xFEEDFACE);
  const arr = usernames.map((u, idx) => {
    const rank = idx + 1;
    const profit = Math.round((140000 - idx * (4500 + r() * 1500)) * (0.9 + r() * 0.2));
    const winRate = 0.78 - idx * 0.012 - r() * 0.04;
    const trades = 320 - idx * 8 + Math.floor(r() * 40);
    const fav = MARKETS[Math.floor(r() * MARKETS.length)];
    const hue = (u.charCodeAt(0) * 17 + u.charCodeAt(u.length-1) * 31) % 360;
    // FEATURE 4 — calibration
    const calibration = Math.max(0.45, Math.min(0.95, 0.85 - rank * 0.018 + r() * 0.08));
    // FEATURE 5 — primary expertise badge
    const primaryCategory = BADGE_CATEGORIES[hue % BADGE_CATEGORIES.length];
    const primaryTier = winRate >= 0.75 ? { tier: "Expert", emoji: "\uD83C\uDFC6", color: "#F59E0B" }
      : winRate >= 0.65 ? { tier: "Specialist", emoji: "\u2B50", color: "#5B6BF5" }
      : { tier: "Analyst", emoji: "\uD83D\uDCCA", color: "#9CA3AF" };
    return {
      rank, username: u, profit, winRate, trades, fav,
      hue, calibration,
      primaryCategory, primaryBadge: { ...primaryTier, category: primaryCategory },
      streak: Math.floor(r() * 12) - 2,
    };
  });
  return arr;
})();
// FEATURE 4 — calibration king = highest calibration
const CALIBRATION_KING = LEADERBOARD.reduce((a, b) => (b.calibration > a.calibration ? b : a), LEADERBOARD[0]).username;

// activity ticker
const TICKER = (() => {
  const r = mulberry32(0xDEADBEEF);
  const out = [];
  for (let i = 0; i < 28; i++) {
    const m = MARKETS[Math.floor(r() * MARKETS.length)];
    const amt = [10, 25, 50, 100, 250, 500, 1000][Math.floor(r() * 7)];
    const side = r() < 0.6 ? "DEAD" : "ALIVE";
    const u = ["@skullking","@bayesbot","@vega.weighted","@delta.huxley","@kellyfraction","@longgamma","@moloch","@iron.condor","@mu.sigma"][Math.floor(r()*9)];
    out.push({ user: u, market: m.name, side, amt });
  }
  return out;
})();

// ---------- SOCIAL + CHALLENGE DATA ----------
const CURRENT_USER = { username: "you", hue: 265 };

function lbUser(username) {
  const u = username.replace(/^@/, "");
  return LEADERBOARD.find(x => x.username === u) || { username: u, hue: 210, profit: 0, winRate: 0.5, trades: 0, fav: MARKETS[0] };
}
function marketByName(n) { return MARKETS.find(m => m.name === n) || MARKETS[0]; }

const TAGLINES = [
  "Shorting the future, one incumbent at a time.",
  "Bayesian to a fault. Mostly DEAD.",
  "Risk manager by day, degen by night.",
  "I only bet on extinction events.",
  "Long volatility, short hopium.",
  "Reading 10-Ks so you don't have to.",
  "Probabilistic nihilist. GLHF.",
  "Calling tops since the last cycle.",
  "Diamond axe. Never paper.",
  "Contrarian until proven right.",
];

// Build full profiles for every leaderboard trader
function makeProfile(u, seed) {
  const r = mulberry32(seed);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const joinLabel = months[Math.floor(r() * 12)] + " " + (2023 + Math.floor(r() * 3));
  const followers = 120 + Math.floor(r() * 14000);
  const following = 18 + Math.floor(r() * 420);
  const tagline = TAGLINES[Math.floor(r() * TAGLINES.length)];

  const positions = [];
  const taken = new Set();
  const nPos = 4 + Math.floor(r() * 3);
  while (positions.length < nPos) {
    const i = Math.floor(r() * MARKETS.length);
    if (taken.has(i)) continue;
    taken.add(i);
    const m = MARKETS[i];
    const side = r() < 0.6 ? "DEAD" : "ALIVE";
    const entry = Math.max(0.1, (side === "DEAD" ? m.death : m.survives) - (0.02 + r() * 0.2));
    const shares = 40 + Math.floor(r() * 1400);
    const cur = side === "DEAD" ? m.death : m.survives;
    const cost = shares * entry, value = shares * cur;
    positions.push({ market: m, side, shares, avgPrice: entry, currentPrice: cur, cost, value, pnl: value - cost, pct: (value - cost) / cost });
  }

  const activity = [];
  for (let i = 0; i < 9; i++) {
    const m = MARKETS[Math.floor(r() * MARKETS.length)];
    const side = r() < 0.58 ? "DEAD" : "ALIVE";
    const amt = [25, 50, 100, 250, 500, 1000][Math.floor(r() * 6)];
    activity.push({ market: m, side, amt, minsAgo: Math.floor((i + 1) * (12 + r() * 90)) });
  }

  return { ...u, joinLabel, followers, following, tagline, positions, activity };
}

const USERS = (() => {
  const out = {};
  LEADERBOARD.forEach((u, i) => { out[u.username] = makeProfile(u, 0x5A17 + i * 7919); });
  return out;
})();
function getUser(username) {
  const name = (username || "").replace(/^@/, "");
  if (USERS[name]) return USERS[name];
  // fallback profile for unknown handles (e.g. the current user)
  const base = lbUser(name);
  return makeProfile({ ...base, username: name }, name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 131 + 7);
}

// Following feed — chronological bets by leaderboard traders
const FOLLOW_FEED = (() => {
  const r = mulberry32(0x50C1A1);
  const out = [];
  for (let i = 0; i < 36; i++) {
    const u = LEADERBOARD[Math.floor(r() * LEADERBOARD.length)];
    const m = MARKETS[Math.floor(r() * MARKETS.length)];
    const side = r() < 0.56 ? "DEAD" : "ALIVE";
    const amt = [25, 50, 100, 250, 500, 1000, 2500][Math.floor(r() * 7)];
    out.push({ id: "ff" + i, user: u, market: m, side, amt, minsAgo: Math.floor((i + 1) * (4 + r() * 22)), comments: Math.floor(r() * 24) });
  }
  return out.sort((a, b) => a.minsAgo - b.minsAgo);
})();

// Per-market comments — seeded so each market is different
const COMMENT_TEMPLATES = [
  "The writing is on the wall. {tool} already does what {company} charged ${price}/month for.",
  "People keep underestimating how sticky enterprise contracts are. ALIVE easy.",
  "Insider here — the layoffs aren't stopping. DEAD before end of year.",
  "Chart looks like Blockbuster 2012. Betting heavy DEAD.",
  "Management pivoting to an AI narrative buys {company} two more years. Too early to call.",
  "Just closed my position. The multiple compression alone will kill {company}.",
  "Strong disagree. {company} has pricing power and brand. ALIVE bet.",
  "{tool} ate my use case for this in a weekend. Hard to see the moat.",
  "Everyone's a doomer until the turnaround quarter. I'm fading the panic.",
];
const AI_TOOLS = ["ChatGPT", "Claude", "Gemini", "Copilot", "Midjourney", "a $20/mo tool", "an open-source model"];
function commentsForMarket(marketId) {
  const m = MARKETS.find(x => x.id === marketId) || MARKETS[0];
  const r = mulberry32(0xC0FFEE ^ (marketId * 2654435761));
  const n = 3 + Math.floor(r() * 3); // 3–5
  const used = new Set();
  const out = [];
  for (let i = 0; i < n; i++) {
    let t = Math.floor(r() * COMMENT_TEMPLATES.length);
    let guard = 0;
    while (used.has(t) && guard++ < 8) t = Math.floor(r() * COMMENT_TEMPLATES.length);
    used.add(t);
    const u = LEADERBOARD[Math.floor(r() * LEADERBOARD.length)];
    const price = [10, 15, 20, 30, 49, 99][Math.floor(r() * 6)];
    const text = COMMENT_TEMPLATES[t]
      .replace(/\{tool\}/g, AI_TOOLS[Math.floor(r() * AI_TOOLS.length)])
      .replace(/\{company\}/g, m.name)
      .replace(/\{price\}/g, price);
    out.push({
      id: "c" + marketId + "-" + i,
      user: u,
      text,
      upvotes: Math.floor(r() * 140),
      minsAgo: Math.floor((i + 1) * (8 + r() * 180)),
      replies: Math.floor(r() * 6),
    });
  }
  return out;
}

// Open P2P challenges
const CHALLENGE_SEED = [
  ["skullking", "Chegg", "DEAD", 250, 14],
  ["bayesbot", "Teleperformance", "DEAD", 500, 41],
  ["vega.weighted", "Salesforce", "ALIVE", 100, 73],
  ["delta.huxley", "Fiverr", "DEAD", 150, 96],
  ["kellyfraction", "Shutterstock", "DEAD", 300, 122],
  ["longgamma", "Coursera", "ALIVE", 200, 168],
  ["moloch", "H&R Block", "DEAD", 400, 205],
  ["iron.condor", "ServiceNow", "ALIVE", 750, 290],
];
const CHALLENGES = CHALLENGE_SEED.map((c, i) => ({
  id: "ch" + i,
  challenger: lbUser(c[0]),
  market: marketByName(c[1]),
  challengerSide: c[2],
  stake: c[3],
  status: "open",
  createdMinsAgo: c[4],
}));

// Challenges sent TO the current user (drives the nav badge)
const INCOMING_CHALLENGES = [
  { id: "in0", from: lbUser("moloch"), market: marketByName("Udemy"), theirSide: "DEAD", stake: 200, createdMinsAgo: 22 },
  { id: "in1", from: lbUser("the.oracle"), market: marketByName("Getty Images"), theirSide: "ALIVE", stake: 350, createdMinsAgo: 64 },
];

// Challenges the current user already has going (sent / active / resolved)
const MY_CHALLENGES = [
  { id: "my0", opponent: lbUser("paperhands"), market: marketByName("Upwork"), yourSide: "DEAD", stake: 100, status: "active" },
  { id: "my1", opponent: null, market: marketByName("Lionbridge"), yourSide: "DEAD", stake: 250, status: "pending" },
  { id: "my2", opponent: lbUser("blackswan23"), market: marketByName("BuzzFeed"), yourSide: "DEAD", stake: 300, status: "resolved", outcome: "WON" },
  { id: "my3", opponent: lbUser("midas.eth"), market: marketByName("Coursera"), yourSide: "DEAD", stake: 150, status: "resolved", outcome: "LOST" },
];

// ---- Tournaments (FEATURE 8) ----
function avatarStack(seed, n) {
  const r = mulberry32(seed);
  const pool = [...LEADERBOARD];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}
const FEATURED_TOURNAMENT = {
  name: "AI Apocalypse — Week 23",
  status: "ENROLLING",
  prizePool: 4200,
  entryFee: 25,
  schedule: "Starts Monday · Ends Sunday",
  format: "Fixed 20 markets · Most profit wins · Rebuys allowed ($25)",
  participants: 47,
  bankroll: 1000,
  avatars: avatarStack(0x7011, 5),
};
const PAST_TOURNAMENTS = [
  { name: "Week 22", winner: lbUser("skullking"), profit: 1840, participants: 52 },
  { name: "Week 21", winner: lbUser("bayesbot"), profit: 2100, participants: 61 },
  { name: "Week 20", winner: lbUser("vega.weighted"), profit: 990, participants: 38 },
];
const UPCOMING_TOURNAMENTS = [
  { name: "AI Bloodbath", entryFee: 50, prizeEst: 8400, startsIn: "Starts in 3 days" },
  { name: "High Stakes", entryFee: 100, prizeEst: 14000, startsIn: "Starts in 10 days" },
];

// ---- Notifications (FEATURE 2) ----
const NOTIFICATIONS = [
  { id: "n0", icon: "⚔️", title: "Challenge accepted", body: "@bayesbot accepted your challenge on Chegg", time: "2m ago", read: false, route: { name: "challenges" } },
  { id: "n1", icon: "🔔", title: "Odds alert", body: "Teleperformance DEAD crossed 80%", time: "15m ago", read: false, route: { name: "market", marketName: "Teleperformance" } },
  { id: "n2", icon: "💬", title: "New comment", body: "@skullking commented on Fiverr: \u201CChart looks like Blockbuster 2012\u201D", time: "1h ago", read: false, route: { name: "market", marketName: "Fiverr" } },
  { id: "n3", icon: "✅", title: "Market resolved", body: "Shutterstock resolved DEAD. Your payout: $196.00", time: "3h ago", read: true, route: { name: "portfolio" } },
  { id: "n4", icon: "⚡", title: "Movers alert", body: "Chegg moved +4.2pp in the last hour", time: "5h ago", read: true, route: { name: "market", marketName: "Chegg" } },
  { id: "n5", icon: "🏆", title: "Tournament starting", body: "AI Apocalypse Week 23 starts in 2 hours", time: "8h ago", read: true, route: { name: "tournaments" } },
];

// ---- Live Intelligence news feed per market (FEATURE 3) ----
const NEWS_BEARISH = [
  ["EARNINGS DATA", "Q1 revenue declined 23% YoY — third consecutive quarter of decline", "Bloomberg", "2d ago"],
  ["X SIGNAL", "Multiple X posts report users switching to AI alternatives this week", "@aimonitor", "4h ago"],
  ["ANALYST NOTE", "Analyst downgrades to SELL, cuts price target 40%", "Morgan Stanley", "1d ago"],
  ["INSIDER ACTIVITY", "CEO sold $2.4M in shares last month", "SEC Form 4", "5d ago"],
  ["SENTIMENT SHIFT", "Negative sentiment trending on X: 'Is this company dead?' reaches 50K posts", "Grok", "3h ago"],
  ["EARNINGS DATA", "Operating margin compressed 600bps as AI undercuts core pricing", "10-Q filing", "6d ago"],
  ["X SIGNAL", "Viral thread: 'I cancelled my subscription, ChatGPT does it free'", "@churnwatch", "7h ago"],
];
const NEWS_BULLISH = [
  ["ANALYST NOTE", "Company announces AI partnership with Microsoft — stock up 8% pre-market", "Reuters", "6h ago"],
  ["EARNINGS DATA", "Q1 retention metrics held steady despite macro headwinds", "Earnings call", "3d ago"],
  ["X SIGNAL", "New product launch received positively — 10K signups in first 48 hours", "@producthunt", "1d ago"],
  ["INSIDER ACTIVITY", "Enterprise contract renewals at 94% — higher than prior year", "Investor deck", "2d ago"],
  ["ANALYST NOTE", "Boutique fund initiates LONG: 'market has overpriced the death narrative'", "Citron", "9h ago"],
];
const NEWS_NEUTRAL = [
  ["SENTIMENT SHIFT", "Mixed analyst coverage — 4 HOLD, 2 SELL, 1 BUY in past month", "FactSet", "12h ago"],
  ["X SIGNAL", "Engagement flat week-over-week; no clear directional signal", "Grok", "5h ago"],
];
function newsForMarket(marketId) {
  const m = MARKETS.find(x => x.id === marketId) || MARKETS[0];
  const r = mulberry32(0x4E55 ^ (marketId * 2654435761));
  const pick = (arr, tone, n) => {
    const pool = [...arr];
    const out = [];
    while (out.length < n && pool.length) {
      const [type, head, source, time] = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const sentiment = tone === "bearish" ? 0.12 + r() * 0.28 : tone === "bullish" ? 0.60 + r() * 0.28 : 0.40 + r() * 0.20;
      out.push({ id: "nw" + marketId + "-" + type + "-" + out.length, type, headline: head.replace(/this company/gi, m.name), source, time, tone, sentiment, upvotes: Math.floor(r() * 320) });
    }
    return out;
  };
  // weighted bearish: 2–3 bearish, 1–2 bullish, occasional neutral
  const nBear = 2 + Math.floor(r() * 2);
  const nBull = 1 + Math.floor(r() * 2);
  const items = [...pick(NEWS_BEARISH, "bearish", nBear), ...pick(NEWS_BULLISH, "bullish", nBull)];
  if (r() < 0.6) items.push(...pick(NEWS_NEUTRAL, "neutral", 1));
  // shuffle deterministically
  for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  return items.slice(0, 5);
}

// ---- Death Watch (FEATURE 7) ----
const DEATH_WATCH = [
  { icon: "📉", text: "Chegg revenue -49% YoY — 3rd consecutive decline", tone: "dead", time: "2h ago", market: "Chegg" },
  { icon: "📊", text: "Analyst split on Fiverr: 3 say DEAD, 2 say pivot saves it", tone: "amber", time: "4h ago", market: "Fiverr" },
  { icon: "🔥", text: "Teleperformance DEAD odds moved +3.2pp in last hour", tone: "dead", time: "1h ago", market: "Teleperformance" },
  { icon: "🤔", text: "Shutterstock CEO 'cautiously optimistic' — market disagrees at 84% DEAD", tone: "amber", time: "6h ago", market: "Shutterstock" },
  { icon: "⚡", text: "BuzzFeed: silence from management raises questions", tone: "gray", time: "8h ago", market: "BuzzFeed" },
  { icon: "📉", text: "Coursera enterprise seats down 18% QoQ — growth thesis questioned", tone: "dead", time: "3h ago", market: "Coursera" },
  { icon: "🤷", text: "Upwork: bulls and bears both claim this week's data proves their case", tone: "amber", time: "5h ago", market: "Upwork" },
  { icon: "🔇", text: "Lionbridge cancels investor day — 'scheduling conflict', no reschedule given", tone: "gray", time: "7h ago", market: "Lionbridge" },
  { icon: "📈", text: "H&R Block ticks up on AI-assist rollout — skeptics call it 'too late'", tone: "amber", time: "9h ago", market: "H&R Block" },
  { icon: "⚠️", text: "Getty Images legal win cheered — but odds barely move at 71% DEAD", tone: "amber", time: "10h ago", market: "Getty Images" },
];
const DEATH_WATCH_ALL = (() => {
  const r = mulberry32(0xD3A7);
  const out = [...DEATH_WATCH];
  const templates = [
    ["📉", "{m} posts another double-digit revenue drop — pattern or blip?", "dead"],
    ["📊", "Street divided on {m}: ratings range from STRONG SELL to BUY", "amber"],
    ["🔥", "{m} DEAD odds whipsaw intraday — heavy two-way flow", "dead"],
    ["🤔", "{m} management upbeat on call; crowd unconvinced", "amber"],
    ["🔇", "{m} goes quiet after the quarter — read into it what you will", "gray"],
    ["⚡", "Unusual options activity in {m} — direction unclear", "gray"],
    ["🤷", "Conflicting {m} datapoints leave traders guessing", "amber"],
    ["📈", "Contrarians load up on {m} ALIVE — 'priced for bankruptcy'", "amber"],
  ];
  for (let i = 0; i < 14; i++) {
    const m = MARKETS[Math.floor(r() * MARKETS.length)];
    const t = templates[Math.floor(r() * templates.length)];
    out.push({ icon: t[0], text: t[1].replace(/\{m\}/g, m.name), tone: t[2], time: (1 + Math.floor(r() * 23)) + "h ago", market: m.name });
  }
  return out.slice(0, 20);
})();

// ---- Bear / Bull case arguments (FEATURE 1) ----
const DEAD_ARGS = [
  "AI tools now replicate this service for free, killing the core value proposition.",
  "Revenue has declined for 3+ consecutive years as AI alternatives eat share.",
  "Rebranding to 'AI-powered' is a survival narrative, not a strategy.",
  "Enterprise clients are quietly migrating to AI-native replacements.",
  "Pricing power is gone — can't compete with free AI tools on cost.",
  "The category is being compressed from both ends: AI startups above, commoditization below.",
  "Workforce reductions signal that even management knows the model is terminal.",
  "Their core market is shrinking faster than they can pivot into new ones.",
  "No defensible moat — the moment a better AI tool drops, customers leave overnight.",
  "B2B contracts are renewing at lower values or not at all.",
  "Their primary users (students, freelancers, call center workers) are switching to AI first.",
  "Geographic expansion can't offset structural decline in the core product.",
  "Copycat AI features from Big Tech eliminate any remaining edge.",
  "Cash runway doesn't support the 3-5 year transformation timeline required.",
];
const ALIVE_ARGS = [
  "Enterprise contracts are 3-5 years long — revenue is locked in regardless of the AI threat.",
  "The brand and institutional trust built over decades don't disappear overnight.",
  "Incumbent regulatory advantages make displacement far harder than it appears.",
  "Company is already building AI-native features — adapting rather than ignoring the shift.",
  "Human oversight requirements in regulated industries keep this category partially AI-proof.",
  "Switching costs for enterprise customers are extremely high — migrations take years.",
  "The doom narrative is priced in — contrarian money is flowing the other way.",
  "Global markets outside the US and EU are 5-10 years behind on AI adoption curves.",
  "More likely to be acquired at a premium than to die — a consolidation target.",
  "Regulatory moats in healthcare, finance, and legal make pure AI replacement unlikely near-term.",
  "Management has executed successful pivots before under comparable competitive pressure.",
  "Network effects and proprietary data moats can't be instantly replicated by an AI tool.",
  "Trust and compliance requirements that AI alone cannot satisfy yet remain central.",
  "Core users are price-sensitive — AI alternatives carry their own cost structure.",
];
function pickArgs(marketName, arr, count) {
  const seed = marketName.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const rng = mulberry32(seed);
  const indices = [];
  while (indices.length < count) {
    const i = Math.floor(rng() * arr.length);
    if (!indices.includes(i)) indices.push(i);
  }
  return indices.map(i => arr[i]);
}

// expose globally
Object.assign(window, {
  MARKETS, CATEGORY_LIST, POSITIONS, RESOLVED, PORTFOLIO_EQUITY, LEADERBOARD, TICKER,
  mulberry32, logoFor,
  CURRENT_USER, USERS, getUser, lbUser, marketByName,
  FOLLOW_FEED, commentsForMarket, CHALLENGES, INCOMING_CHALLENGES, MY_CHALLENGES,
  getCategoryBadge, BADGE_CATEGORIES, CALIBRATION_KING,
  FEATURED_TOURNAMENT, PAST_TOURNAMENTS, UPCOMING_TOURNAMENTS,
  NOTIFICATIONS, newsForMarket, DEATH_WATCH, DEATH_WATCH_ALL,
  DEAD_ARGS, ALIVE_ARGS, pickArgs,
});
