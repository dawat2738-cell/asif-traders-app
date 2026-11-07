// SQLite schema + idempotent seeding. Zero dependencies (node:sqlite).
import { DatabaseSync } from "node:sqlite";
import { CATEGORIES, PRODUCTS } from "./seed-data.js";

export function openDb(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT NOT NULL CHECK (role IN ('customer','seller')),
      password_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'login',
      expires_at TEXT NOT NULL,
      used_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_ur TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER,
      image TEXT,
      status TEXT NOT NULL CHECK (status IN ('available','coming_soon','price_on_contact')),
      variants TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      delivery_zone TEXT NOT NULL CHECK (delivery_zone IN ('lahore','other')),
      items TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER,
      delivery_note TEXT NOT NULL,
      advance_due INTEGER NOT NULL,
      total_due INTEGER NOT NULL,
      payment_terms TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'placed'
        CHECK (status IN ('placed','confirmed','dispatched','delivered','cancelled')),
      -- Seller-private advance decision. NEVER exposed to customers.
      advance_decision TEXT,
      -- Honest parcel tracking (manual, Rank 1): courier + tracking ID the
      -- seller enters after booking. Shown to the customer with a link to the
      -- courier's own tracking page. No fake live tracking anywhere.
      -- Own-rider deliveries: the rider has no courier CN, so the seller
      -- enters the rider's name + phone instead; the customer calls the rider.
      courier TEXT,
      tracking_id TEXT,
      rider_name TEXT,
      rider_phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      sender_role TEXT NOT NULL CHECK (sender_role IN ('customer','seller')),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL REFERENCES products(id),
      customer_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      body TEXT NOT NULL,
      visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_ur TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS chatbot_forwards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      topic TEXT NOT NULL,
      body TEXT NOT NULL,
      handled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  // Migration for DBs created before the tracking columns existed (redeploy
  // normally wipes the DB, but an existing file must not break the server).
  for (const col of ["courier TEXT", "tracking_id TEXT", "rider_name TEXT", "rider_phone TEXT"]) {
    try { db.exec(`ALTER TABLE orders ADD COLUMN ${col}`); } catch { /* already present */ }
  }
  return db;
}

export function seed(db) {
  const catStmt = db.prepare(
    "INSERT OR IGNORE INTO products (id, category, name_en, name_ur, description, price, image, status, variants, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)"
  );
  PRODUCTS.forEach((p, i) => {
    catStmt.run(
      p.id, p.category, p.en, p.ur, p.desc, p.price, p.image, p.status,
      p.variants ? JSON.stringify(p.variants) : null, i
    );
  });
  const set = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?,?)");
  // Payment numbers: EMPTY by default. The seller adds real numbers in the
  // dashboard Settings. Nothing is invented here.
  set.run("payment_numbers", JSON.stringify({ JazzCash: "", Easypaisa: "", "U Paisa": "" }));
  // Social links: EMPTY by default, for the seller to add later.
  set.run("social_links", JSON.stringify({ facebook: "", instagram: "", tiktok: "", youtube: "" }));
  set.run("shop", JSON.stringify({
    nameEn: "Asif Traders", nameUr: "آصف ٹریڈرز",
    addressEn: "Younis Centre, Hall Road, Lahore",
    addressUr: "یونس سینٹر، ہال روڈ، لاہور",
    phone: "03007924762", owner: "Muhammad Asif",
  }));
  return { categories: CATEGORIES.length, products: PRODUCTS.length };
}

export function getSetting(db, key, fallback = null) {
  const row = db.prepare("SELECT value FROM settings WHERE key=?").get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export function setSetting(db, key, value) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
    .run(key, typeof value === "string" ? value : JSON.stringify(value));
}

// Public stats: COUNTS ONLY. Never prices, never totals, never revenue.
export function publicStats(db) {
  const products = db.prepare("SELECT COUNT(*) c FROM products WHERE status='available'").get().c;
  const reviews = db.prepare("SELECT COUNT(*) c FROM reviews WHERE visible=1").get().c;
  const orders = db.prepare("SELECT COUNT(*) c FROM orders").get().c;
  const sold = db.prepare("SELECT COUNT(*) c FROM orders WHERE status='delivered'").get().c;
  return { products, reviews, orders, itemsSold: sold };
}

export function publicProduct(p) {
  return {
    id: p.id, category: p.category,
    nameEn: p.name_en, nameUr: p.name_ur,
    description: p.description,
    price: p.price,
    image: p.image ? `/img/products/${p.image}` : null,
    status: p.status,
    variants: p.variants ? JSON.parse(p.variants) : null,
  };
}
