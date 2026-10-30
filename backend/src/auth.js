// Authentication: customers via phone + OTP; seller via own password.
// - There is NO default seller password. The seller MUST set one on first use.
// - OTP codes are stored hashed (scrypt), expire in 10 minutes, max 5 attempts.
// - Sessions are random tokens stored hashed, sent as httpOnly cookies.
// - No code is ever returned in an API response.
import crypto from "node:crypto";

export function normalizePhone(raw) {
  let p = String(raw || "").replace(/[\s\-()]/g, "");
  if (p.startsWith("+92")) p = "0" + p.slice(3);
  if (p.startsWith("92") && p.length === 12) p = "0" + p.slice(2);
  return p;
}
export function validPhone(p) { return /^03\d{9}$/.test(p); }

function scryptHash(secret) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(secret, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function scryptVerify(secret, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), crypto.scryptSync(secret, salt, 64));
}
function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

export function issueSession(db, userId, days) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + days * 86400e3).toISOString();
  db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?,?,?)")
    .run(userId, sha256(token), expires);
  return { token, expires };
}
export function sessionUser(db, token) {
  if (!token) return null;
  const row = db.prepare(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id " +
    "WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
  ).get(sha256(token));
  return row || null;
}
export function revokeSession(db, token) {
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(sha256(token));
}

// ---- Customer OTP (only when SMS_OTP_ENABLED=true; OFF in the FREE design) ----
export async function requestOtp(db, cfg, sms, rawPhone) {
  if (!cfg.smsOtpEnabled) {
    throw Object.assign(new Error("SMS OTP is disabled in the FREE design. Log in with your phone number; the seller confirms your order by phone/WhatsApp call before dispatch."), { status: 400 });
  }
  const phone = normalizePhone(rawPhone);
  if (!validPhone(phone)) throw Object.assign(new Error("Invalid phone number."), { status: 400 });
  const hourAgo = new Date(Date.now() - 3600e3).toISOString();
  const recent = db.prepare("SELECT COUNT(*) c FROM otp_codes WHERE phone=? AND created_at>?").get(phone, hourAgo).c;
  if (recent >= cfg.otpMaxRequestsPerHour) throw Object.assign(new Error("Too many codes requested. Try later."), { status: 429 });
  const last = db.prepare("SELECT created_at FROM otp_codes WHERE phone=? ORDER BY id DESC LIMIT 1").get(phone);
  if (last && Date.now() - new Date(last.created_at + "Z").getTime() < cfg.otpRequestCooldownSeconds * 1000) {
    throw Object.assign(new Error("Please wait before requesting another code."), { status: 429 });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + cfg.otpTtlMinutes * 60e3).toISOString();
  db.prepare("INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES (?,?,?)").run(phone, scryptHash(code), expires);
  await sms.sendOtp({ phone, code });
  // Deliberately returns NO code.
  return { sent: true, provider: sms.constructor.name };
}

export function verifyOtp(db, cfg, rawPhone, code) {
  if (!cfg.smsOtpEnabled) {
    throw Object.assign(new Error("SMS OTP is disabled in the FREE design. Log in with your phone number instead."), { status: 400 });
  }
  const phone = normalizePhone(rawPhone);
  const row = db.prepare(
    "SELECT * FROM otp_codes WHERE phone=? AND used_at IS NULL AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1"
  ).get(phone);
  if (!row) throw Object.assign(new Error("No valid code. Request a new one."), { status: 400 });
  db.prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE id=?").run(row.id);
  if (row.attempts + 1 > cfg.otpMaxAttempts) throw Object.assign(new Error("Too many attempts. Request a new code."), { status: 429 });
  if (!/^\d{6}$/.test(String(code)) || !scryptVerify(String(code), row.code_hash)) {
    throw Object.assign(new Error("Wrong code."), { status: 401 });
  }
  db.prepare("UPDATE otp_codes SET used_at = datetime('now') WHERE id=?").run(row.id);
  let user = db.prepare("SELECT * FROM users WHERE phone=?").get(phone);
  if (!user) {
    db.prepare("INSERT INTO users (phone, role) VALUES (?,'customer')").run(phone);
    user = db.prepare("SELECT * FROM users WHERE phone=?").get(phone);
  }
  if (user.role !== "customer") throw Object.assign(new Error("This number belongs to the seller account."), { status: 403 });
  return user;
}

// ---- Customer phone-only login (FREE design: no SMS, no code) ----
// Verification does NOT happen here. It happens when the seller confirms
// the order by phone/WhatsApp call before dispatch, and no order is
// dispatched without advance payment. A seller number can never log in
// as a customer.
export function loginWithPhone(db, rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!validPhone(phone)) throw Object.assign(new Error("Invalid phone number."), { status: 400 });
  let user = db.prepare("SELECT * FROM users WHERE phone=?").get(phone);
  if (!user) {
    db.prepare("INSERT INTO users (phone, role) VALUES (?,'customer')").run(phone);
    user = db.prepare("SELECT * FROM users WHERE phone=?").get(phone);
  }
  if (user.role !== "customer") throw Object.assign(new Error("This number belongs to the seller account."), { status: 403 });
  return user;
}

// ---- Seller password (no default) ----
export function sellerExists(db) {
  return !!db.prepare("SELECT id FROM users WHERE role='seller' LIMIT 1").get();
}
export function setupSeller(db, password, phone) {
  if (sellerExists(db)) throw Object.assign(new Error("Seller already set up."), { status: 400 });
  if (!password || password.length < 6) throw Object.assign(new Error("Password must be at least 6 characters."), { status: 400 });
  db.prepare("INSERT INTO users (phone, role, password_hash) VALUES (?, 'seller', ?)")
    .run(phone || "seller", scryptHash(password));
}
export function sellerLogin(db, password) {
  const user = db.prepare("SELECT * FROM users WHERE role='seller' LIMIT 1").get();
  if (!user || !user.password_hash || !scryptVerify(password, user.password_hash)) {
    throw Object.assign(new Error("Wrong password."), { status: 401 });
  }
  return user;
}
export function changeSellerPassword(db, userId, oldPassword, newPassword) {
  const user = db.prepare("SELECT * FROM users WHERE id=? AND role='seller'").get(userId);
  if (!user || !scryptVerify(oldPassword, user.password_hash)) {
    throw Object.assign(new Error("Old password is wrong."), { status: 401 });
  }
  if (!newPassword || newPassword.length < 6) throw Object.assign(new Error("Password must be at least 6 characters."), { status: 400 });
  db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(scryptHash(newPassword), userId);
}
