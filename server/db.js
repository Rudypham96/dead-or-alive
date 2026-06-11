// SQLite layer built on Node's built-in node:sqlite (no native build needed).
// One file = the whole datastore. Money is stored as REAL dollars to match the
// prototype's dollar amounts; we round to cents on read. A production build
// would move to integer cents — tracked in README "Known limitations".

import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { generateMarkets } from "./markets-seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = process.env.DOA_DB || path.join(DATA_DIR, "doa.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// node:sqlite has no better-sqlite3-style db.transaction(fn). Shim one: returns a
// function that runs fn inside BEGIN/COMMIT and rolls back on throw. Not reentrant
// (no nested transactions) — the call sites here never nest.
db.transaction = function transaction(fn) {
  return (...args) => {
    db.exec("BEGIN");
    try {
      const result = fn(...args);
      db.exec("COMMIT");
      return result;
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {
        /* ignore rollback failure */
      }
      throw e;
    }
  };
};

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  address      TEXT UNIQUE,                       -- lowercased wallet address (null for email users)
  email        TEXT UNIQUE,
  username     TEXT NOT NULL,
  balance      REAL NOT NULL DEFAULT 0,           -- live (real-money) house credits
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS nonces (
  address      TEXT PRIMARY KEY,
  nonce        TEXT NOT NULL,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS markets (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL,
  category      TEXT NOT NULL,
  name          TEXT NOT NULL,
  death         REAL NOT NULL,                    -- current implied P(AI kills it)
  survives      REAL NOT NULL,
  base_death    REAL NOT NULL,
  series        TEXT NOT NULL,                    -- JSON array of 60 death probs
  change24h     REAL NOT NULL,
  volume        REAL NOT NULL,
  traders       INTEGER NOT NULL,
  days_left     INTEGER NOT NULL,
  logo_hue      INTEGER NOT NULL,
  logo_initials TEXT NOT NULL,
  liquidity     REAL NOT NULL,                    -- virtual depth for price impact
  status        TEXT NOT NULL DEFAULT 'open',     -- 'open' | 'resolved'
  outcome       TEXT,                             -- 'DEAD' | 'ALIVE' | null
  resolved_at   INTEGER
);

CREATE TABLE IF NOT EXISTS bets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  market_id    INTEGER NOT NULL REFERENCES markets(id),
  side         TEXT NOT NULL,                     -- 'DEAD' | 'ALIVE'
  stake        REAL NOT NULL,
  price        REAL NOT NULL,                     -- entry price (implied prob) per share
  shares       REAL NOT NULL,                     -- stake / price
  status       TEXT NOT NULL DEFAULT 'open',      -- 'open' | 'won' | 'lost'
  gross_payout REAL NOT NULL DEFAULT 0,
  fee          REAL NOT NULL DEFAULT 0,
  net_payout   REAL NOT NULL DEFAULT 0,
  paper        INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  resolved_at  INTEGER
);

CREATE TABLE IF NOT EXISTS comments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id    INTEGER NOT NULL REFERENCES markets(id),
  user_id      INTEGER NOT NULL REFERENCES users(id),
  username     TEXT NOT NULL,
  text         TEXT NOT NULL,
  upvotes      INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS challenges (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  challenger_id   INTEGER NOT NULL REFERENCES users(id),
  opponent_id     INTEGER REFERENCES users(id),
  market_id       INTEGER NOT NULL REFERENCES markets(id),
  challenger_side TEXT NOT NULL,                  -- 'DEAD' | 'ALIVE'
  stake           REAL NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open',   -- 'open' | 'active' | 'resolved' | 'cancelled'
  outcome         TEXT,                           -- winner user_id as text, or 'PUSH'
  created_at      INTEGER NOT NULL,
  resolved_at     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_bets_user   ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_market ON bets(market_id);
CREATE INDEX IF NOT EXISTS idx_comments_market ON comments(market_id);
`);

// ---- One-time market seed ----
const marketCount = db.prepare("SELECT COUNT(*) AS n FROM markets").get().n;
if (marketCount === 0) {
  const insert = db.prepare(`
    INSERT INTO markets
      (id, slug, category, name, death, survives, base_death, series, change24h,
       volume, traders, days_left, logo_hue, logo_initials, liquidity, status)
    VALUES
      (@id, @slug, @category, @name, @death, @survives, @base_death, @series, @change24h,
       @volume, @traders, @days_left, @logo_hue, @logo_initials, @liquidity, 'open')
  `);
  const markets = generateMarkets();
  const tx = db.transaction((rows) => {
    for (const m of rows) {
      insert.run({
        id: m.id,
        slug: m.slug,
        category: m.category,
        name: m.name,
        death: m.death,
        survives: m.survives,
        base_death: m.death,
        series: JSON.stringify(m.series),
        change24h: m.change24h,
        volume: m.volume,
        traders: m.traders,
        days_left: m.daysLeft,
        logo_hue: m.logo.hue,
        logo_initials: m.logo.initials,
        // virtual depth: deeper markets move less per dollar. floor keeps thin markets sane.
        liquidity: Math.max(m.volume * 0.05, 25000),
      });
    }
  });
  tx(markets);
  console.log(`[db] seeded ${markets.length} markets into ${DB_PATH}`);
}

// Shape a DB market row into the API/client market object (matches Nick's contract).
export function marketRowToApi(row) {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    name: row.name,
    death: row.death,
    survives: row.survives,
    series: JSON.parse(row.series),
    change24h: row.change24h,
    volume: row.volume,
    traders: row.traders,
    daysLeft: row.days_left,
    logo: { hue: row.logo_hue, initials: row.logo_initials },
    status: row.status,
    outcome: row.outcome,
  };
}
