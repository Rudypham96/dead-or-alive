// Wallet auth (SIWE-style) + JWT sessions.
//
// The bug Nick hit: personal_sign fired before the nonce promise resolved, so it
// signed `null`. The contract here makes that impossible — the client must GET a
// nonce, sign the EXACT message string we return, then POST it back. We recover
// the signer with ethers and compare. No nonce, no verify.

import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import { db } from "./db.js";

const JWT_SECRET = process.env.DOA_JWT_SECRET || "dev-only-secret-change-me";
const FAUCET = Number(process.env.DOA_FAUCET ?? 1000); // test house credits for new accounts
const ALLOW_DEV_LOGIN = process.env.DOA_ALLOW_DEV_LOGIN !== "0"; // on by default for local/dev
const now = () => Date.now();

export function buildSignMessage(address, nonce) {
  // A fixed, human-readable template. The client signs this verbatim.
  return [
    "Dead or Alive — sign in",
    "",
    "Wallet: " + address,
    "Nonce: " + nonce,
    "",
    "Signing proves you own this wallet. It does not authorize any transaction or cost gas.",
  ].join("\n");
}

export function issueNonce(addressRaw) {
  const address = String(addressRaw || "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) throw new Error("invalid address");
  const nonce = crypto.randomBytes(12).toString("base64url");
  db.prepare(
    `INSERT INTO nonces (address, nonce, created_at) VALUES (?, ?, ?)
     ON CONFLICT(address) DO UPDATE SET nonce = excluded.nonce, created_at = excluded.created_at`
  ).run(address, nonce, now());
  return { nonce, message: buildSignMessage(address, nonce) };
}

function findOrCreateUserByAddress(address) {
  const lower = address.toLowerCase();
  let user = db.prepare("SELECT * FROM users WHERE address = ?").get(lower);
  if (!user) {
    const username = lower.slice(0, 6) + "…" + lower.slice(-4);
    const info = db
      .prepare("INSERT INTO users (address, username, balance, created_at) VALUES (?, ?, ?, ?)")
      .run(lower, username, FAUCET, now());
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  }
  return user;
}

// Verify a wallet signature over the stored nonce message. Returns a user row.
export function verifyWalletSignature(addressRaw, signature) {
  const address = String(addressRaw || "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) throw new Error("invalid address");
  if (!signature || typeof signature !== "string") throw new Error("missing signature");

  const row = db.prepare("SELECT * FROM nonces WHERE address = ?").get(address);
  if (!row) throw new Error("no nonce issued for this address — request a nonce first");
  if (now() - row.created_at > 10 * 60 * 1000) throw new Error("nonce expired — request a new one");

  const message = buildSignMessage(address, row.nonce);
  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch (e) {
    throw new Error("signature could not be verified");
  }
  if (recovered.toLowerCase() !== address) throw new Error("signature does not match address");

  // burn the nonce so a signature can't be replayed
  db.prepare("DELETE FROM nonces WHERE address = ?").run(address);
  return findOrCreateUserByAddress(address);
}

// Dev/demo login — no wallet required. Guarded by DOA_ALLOW_DEV_LOGIN.
export function devLogin(usernameRaw) {
  if (!ALLOW_DEV_LOGIN) throw new Error("dev login disabled");
  const username = String(usernameRaw || "").trim().slice(0, 24) || "guest";
  const pseudo = "dev:" + username.toLowerCase();
  let user = db.prepare("SELECT * FROM users WHERE address = ?").get(pseudo);
  if (!user) {
    const info = db
      .prepare("INSERT INTO users (address, username, balance, created_at) VALUES (?, ?, ?, ?)")
      .run(pseudo, username, FAUCET, now());
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  }
  return user;
}

export function signToken(user) {
  return jwt.sign({ uid: user.id, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
}

export function setAuthCookie(res, token) {
  res.cookie("doa_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

// Express middleware: attaches req.user if a valid session token is present
// (cookie or Authorization: Bearer). Never throws — anonymous is allowed.
export function attachUser(req, res, next) {
  let token = req.cookies?.doa_session;
  const auth = req.headers.authorization;
  if (!token && auth && auth.startsWith("Bearer ")) token = auth.slice(7);
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.uid);
      if (user) req.user = user;
    } catch (e) {
      /* invalid/expired token → stay anonymous */
    }
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "authentication required" });
  next();
}

export { FAUCET, ALLOW_DEV_LOGIN };
