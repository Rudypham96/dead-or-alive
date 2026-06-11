// Deterministic market generator — ported verbatim from the design prototype's
// data.jsx so the server DB and the client fallback agree on every id, slug,
// price, and series point. Do not "improve" the math here without changing the
// client in lockstep, or the two will drift.

export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAW_MARKETS = [
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

export const CATEGORY_LIST = [
  "All", "Education", "BPO & Call Centers", "Stock Photography",
  "Freelance Platforms", "Staffing & Recruiting", "Translation Services",
  "Advertising Agencies", "Legal Support", "Tax Preparation",
  "Enterprise Software", "Publishing & Media", "Data & Transcription",
];

function makeSeries(rng, end, len = 60, vol = 0.06) {
  const arr = new Array(len);
  arr[len - 1] = end;
  for (let i = len - 2; i >= 0; i--) {
    const drift = (rng() - 0.5) * vol;
    let v = arr[i + 1] - drift;
    v = v * 0.985 + 0.5 * 0.015;
    v = Math.max(0.04, Math.min(0.96, v));
    arr[i] = v;
  }
  return arr;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function logoFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const initials =
    name
      .replace(/[^A-Za-z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";
  return { hue, initials };
}

// Returns the full deterministic market list. `series` is kept as an array.
export function generateMarkets() {
  return RAW_MARKETS.map((row, i) => {
    const [category, name, baseDeath, volM] = row;
    const rng = mulberry32(0x9e3779b1 ^ (i * 2654435761));
    const death = Math.max(0.05, Math.min(0.97, baseDeath + (rng() - 0.5) * 0.04));
    const survives = 1 - death;
    const series = makeSeries(rng, death, 60, 0.05);
    const change24h = death - series[Math.max(0, series.length - 24)];
    const volume = Math.round(volM * 1_000_000 * (0.7 + rng() * 0.6));
    const traders = 200 + Math.round(rng() * 4800);
    const daysLeft =
      i % 7 === 3 ? 4 + Math.floor(rng() * 25) : 31 + Math.floor(rng() * 699);
    const slug = slugify(name) + "-" + i;
    return {
      id: i,
      slug,
      category,
      name,
      death,
      survives,
      series,
      change24h,
      volume,
      traders,
      daysLeft,
      logo: logoFor(name),
    };
  });
}
