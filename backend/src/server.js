// HTTP server: public storefront, customer API, seller API. Zero dependencies.
// Privacy is enforced HERE, server-side, not in the browser:
//  - customers only ever see their OWN orders/bills/history (others -> 404);
//  - public stats are counts only, never prices or totals;
//  - the seller's private advance decision is never serialized to customers;
//  - seller endpoints require the seller session; settings are seller-only.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
import { config, shopPublic } from "./config.js";
import { openDb, seed, getSetting, setSetting, publicStats, publicProduct } from "./db.js";
import { createSmsProvider } from "./sms.js";
import {
  normalizePhone, validPhone, issueSession, sessionUser, revokeSession,
  requestOtp, verifyOtp, loginWithPhone, sellerExists, setupSeller, sellerLogin, changeSellerPassword,
} from "./auth.js";
import { computeBill } from "./billing.js";
import { SALAAM, chatReply } from "./chatbot.js";
import { storefrontHTML, sellerHTML, esc } from "./views.js";

const db = openDb(config.dbPath);
seed(db);
const sms = createSmsProvider(config);
if (config.smsOtpEnabled) {
  console.log(`[INFO] SMS OTP ENABLED via provider: ${config.smsProvider}.`);
} else {
  console.log("[INFO] FREE design: SMS OTP is OFF (SMS_OTP_ENABLED is not 'true'). Customers log in with phone number only; verification happens via seller phone/WhatsApp confirmation before dispatch. No SMS is sent.");
}

// ---------- helpers ----------
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}
function sendHtml(res, html) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) reject(Object.assign(new Error("Body too large."), { status: 413 })); });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(Object.assign(new Error("Invalid JSON."), { status: 400 })); }
    });
    req.on("error", reject);
  });
}
function cookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function setSessionCookie(res, token, days) {
  res.setHeader("Set-Cookie", `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${days * 86400}`);
}
function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
}
function authUser(req) { return sessionUser(db, cookies(req).session); }
function requireCustomer(req) {
  const u = authUser(req);
  if (!u || u.role !== "customer") throw Object.assign(new Error("Login required."), { status: 401 });
  return u;
}
function requireSeller(req) {
  const u = authUser(req);
  if (!u || u.role !== "seller") throw Object.assign(new Error("Seller login required."), { status: 401 });
  return u;
}
function customerOrderView(o) {
  const items = JSON.parse(o.items);
  return {
    id: o.id, order_no: o.order_no, customer_name: o.customer_name,
    customer_phone: o.customer_phone, customer_address: o.customer_address,
    delivery_zone: o.delivery_zone, items, subtotal: o.subtotal,
    delivery_fee: o.delivery_fee, delivery_note: o.delivery_note,
    advance_due: o.advance_due, total_due: o.total_due,
    payment_terms: o.payment_terms, status: o.status, created_at: o.created_at,
    // Honest tracking: the real courier + tracking ID, shown to the customer
    // with a link to the courier's own tracking page. No fake live tracking.
    courier: o.courier || null, tracking_id: o.tracking_id || null,
    // NOTE: advance_decision is deliberately NOT included here.
  };
}
// Courier tracking pages (public, no login needed). The customer pastes the
// tracking ID there; no pre-filled deep link is assumed for any courier.
const COURIERS = {
  TCS: "https://www.tcsexpress.com/track",
  Leopards: "https://pk.leopardscourier.com/tracking",
  PostEx: "https://postex.pk/tracking",
  Trax: "https://trax.pk/tracking",
  "M&P": "https://mulphilog.com",
};
function sellerOrderView(o) { return { ...customerOrderView(o), advance_decision: o.advance_decision }; }
function orderMessages(orderId) {
  return db.prepare("SELECT id, sender_role, body, created_at FROM order_messages WHERE order_id=? ORDER BY id").all(orderId);
}

function serveFile(res, filePath, type) {
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { sendJson(res, 404, { error: "Not found." }); return; }
    res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Cache-Control": "public, max-age=3600" });
    fs.createReadStream(filePath).pipe(res);
  });
}
function imageType(f) {
  if (f.endsWith(".png")) return "image/png";
  if (f.endsWith(".jpg") || f.endsWith(".jpeg")) return "image/jpeg";
  if (f.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const p = url.pathname;
    const method = req.method;

    // ----- static -----
    if (method === "GET" && p === "/") return sendHtml(res, storefrontHTML(shopPublic(), { otpEnabled: config.smsOtpEnabled }));
    if (method === "GET" && p === "/seller") return sendHtml(res, sellerHTML());
    // ----- PWA: manifest, service worker, icons (served from backend/public) -----
    if (method === "GET" && p === "/manifest.webmanifest") {
      return serveFile(res, path.join(here, "..", "public", "manifest.webmanifest"), "application/manifest+json");
    }
    if (method === "GET" && p === "/sw.js") {
      return serveFile(res, path.join(here, "..", "public", "sw.js"), "application/javascript");
    }
    if (method === "GET" && p === "/icons/icon-192.png") {
      return serveFile(res, path.join(here, "..", "public", "icons", "icon-192.png"), "image/png");
    }
    if (method === "GET" && p === "/icons/icon-512.png") {
      return serveFile(res, path.join(here, "..", "public", "icons", "icon-512.png"), "image/png");
    }
    if (method === "GET" && p === "/img/banner.png") return serveFile(res, config.bannerPath, "image/png");
    if (method === "GET" && p === "/img/profile.png") return serveFile(res, config.profilePath, "image/png");
    if (method === "GET" && p === "/img/app-qr.png") return serveFile(res, path.join(here, "..", "public", "app-qr.png"), "image/png");
    if (method === "GET" && p.startsWith("/img/products/")) {
      const file = path.basename(p.slice("/img/products/".length));
      if (!file || file.includes("..")) return sendJson(res, 400, { error: "Bad image name." });
      return serveFile(res, path.join(config.imagesDir, file), imageType(file));
    }

    // ----- test-only endpoint (TEST_MODE=1 only, never in production) -----
    if (config.testMode && method === "GET" && p === "/__test__/last-otp") {
      const last = sms.lastSent || null;
      return sendJson(res, 200, last ? { phone: last.phone, code: last.code } : { phone: null, code: null });
    }

    // ----- public API -----
    if (method === "GET" && p === "/api/categories") {
      const { CATEGORIES } = await import("./seed-data.js");
      return sendJson(res, 200, { categories: CATEGORIES });
    }
    if (method === "GET" && p === "/api/products") {
      const q = (url.searchParams.get("q") || "").toLowerCase();
      const cat = url.searchParams.get("category") || "";
      let rows = db.prepare("SELECT * FROM products ORDER BY sort_order").all();
      if (cat) rows = rows.filter((r) => r.category === cat);
      if (q) rows = rows.filter((r) => (r.name_en + " " + r.name_ur + " " + r.description).toLowerCase().includes(q));
      return sendJson(res, 200, { products: rows.map(publicProduct) });
    }
    if (method === "GET" && p.startsWith("/api/products/")) {
      const row = db.prepare("SELECT * FROM products WHERE id=?").get(p.slice("/api/products/".length));
      if (!row) return sendJson(res, 404, { error: "Product not found." });
      return sendJson(res, 200, publicProduct(row));
    }
    if (method === "GET" && p === "/api/stats") return sendJson(res, 200, publicStats(db));
    if (method === "GET" && p === "/api/payment-info") {
      // Public by design: the seller adds payment numbers precisely so
      // customers can pay through them. Empty until the seller adds them.
      const numbers = getSetting(db, "payment_numbers", {});
      const methods = shopPublic().paymentMethods.map((m) => ({
        method: m, number: numbers[m] || null,
      }));
      return sendJson(res, 200, { methods });
    }
    if (method === "GET" && p === "/api/announcements") {
      const rows = db.prepare("SELECT * FROM announcements ORDER BY id DESC LIMIT 20").all();
      return sendJson(res, 200, { announcements: rows });
    }
    if (method === "GET" && p === "/api/reviews") {
      const rows = db.prepare(
        "SELECT r.rating, r.body, p.name_en AS product FROM reviews r JOIN products p ON p.id=r.product_id WHERE r.visible=1 ORDER BY r.id DESC LIMIT 50"
      ).all();
      const agg = db.prepare("SELECT AVG(rating) avg, COUNT(*) c FROM reviews WHERE visible=1").get();
      return sendJson(res, 200, { average: agg.c ? Math.round(agg.avg * 10) / 10 : null, count: agg.c, reviews: rows });
    }
    if (method === "GET" && p === "/api/me") {
      const u = authUser(req);
      return sendJson(res, 200, u ? { loggedIn: true, role: u.role, phone: u.phone } : { loggedIn: false });
    }
    if (method === "POST" && p === "/api/bill/preview") {
      const body = await readBody(req);
      const items = await resolveOrderItems(body.items);
      const bill = computeBill(items, body.zone === "other" ? "other" : "lahore");
      return sendJson(res, 200, bill);
    }
    if (method === "POST" && p === "/api/auth/request-otp") {
      const body = await readBody(req);
      const r = await requestOtp(db, config, sms, body.phone);
      return sendJson(res, 200, { ok: true, sent: r.sent, provider: r.provider });
    }
    if (method === "POST" && p === "/api/auth/phone-login") {
      // FREE design login: phone number only, no SMS, no code issued.
      // Verification happens when the seller confirms the order by
      // phone/WhatsApp call before dispatch; no dispatch without advance.
      const body = await readBody(req);
      const user = loginWithPhone(db, body.phone);
      const s = issueSession(db, user.id, config.sessionDays);
      setSessionCookie(res, s.token, config.sessionDays);
      return sendJson(res, 200, { ok: true, role: user.role, phone: user.phone, otpEnabled: false });
    }
    if (method === "POST" && p === "/api/auth/verify-otp") {
      const body = await readBody(req);
      const user = verifyOtp(db, config, body.phone, body.code);
      const s = issueSession(db, user.id, config.sessionDays);
      setSessionCookie(res, s.token, config.sessionDays);
      return sendJson(res, 200, { ok: true, role: user.role, phone: user.phone });
    }
    if (method === "POST" && p === "/api/auth/logout") {
      revokeSession(db, cookies(req).session); clearSessionCookie(res);
      return sendJson(res, 200, { ok: true });
    }
    if (method === "POST" && p === "/api/chat") {
      const body = await readBody(req);
      const me = authUser(req);
      const r = chatReply(body.text || "");
      if (r.forward) {
        db.prepare("INSERT INTO chatbot_forwards (customer_id, topic, body) VALUES (?,?,?)")
          .run(me ? me.id : null, r.topic, String(body.text || ""));
      }
      return sendJson(res, 200, { reply: r.reply, forwarded: r.forward });
    }

    // ----- customer API -----
    if (method === "POST" && p === "/api/orders") {
      const user = requireCustomer(req);
      const body = await readBody(req);
      if (!body.name || !body.address) throw Object.assign(new Error("Name and address are required."), { status: 400 });
      const items = await resolveOrderItems(body.items);
      const zone = body.zone === "other" ? "other" : "lahore";
      const bill = computeBill(items, zone);
      const info = db.prepare(
        "INSERT INTO orders (order_no, customer_id, customer_name, customer_phone, customer_address, delivery_zone, items, subtotal, delivery_fee, delivery_note, advance_due, total_due, payment_terms) VALUES ('TEMP',?,?,?,?,?,?,?,?,?,?,?,?)"
      ).run(user.id, body.name, user.phone, body.address, zone,
        JSON.stringify(bill.lines), bill.subtotal, bill.deliveryFee, bill.deliveryNote,
        bill.advanceDue, bill.totalDue, bill.paymentTerms);
      const id = Number(info.lastInsertRowid);
      const orderNo = "AT-" + (1000 + id);
      db.prepare("UPDATE orders SET order_no=? WHERE id=?").run(orderNo, id);
      return sendJson(res, 201, { ok: true, orderId: id, orderNo, status: "placed", bill });
    }
    if (method === "GET" && p === "/api/orders/mine") {
      const user = requireCustomer(req);
      const rows = db.prepare("SELECT * FROM orders WHERE customer_id=? ORDER BY id DESC").all(user.id);
      return sendJson(res, 200, { orders: rows.map(customerOrderView) });
    }
    if (method === "GET" && p.startsWith("/api/orders/") && p.endsWith("/messages")) {
      const user = requireCustomer(req);
      const id = Number(p.split("/")[3]);
      const o = db.prepare("SELECT * FROM orders WHERE id=? AND customer_id=?").get(id, user.id);
      if (!o) return sendJson(res, 404, { error: "Order not found." });
      return sendJson(res, 200, { messages: orderMessages(id) });
    }
    if (method === "POST" && p.startsWith("/api/orders/") && p.endsWith("/message")) {
      const user = requireCustomer(req);
      const id = Number(p.split("/")[3]);
      const o = db.prepare("SELECT * FROM orders WHERE id=? AND customer_id=?").get(id, user.id);
      if (!o) return sendJson(res, 404, { error: "Order not found." });
      const body = await readBody(req);
      if (!body.body) throw Object.assign(new Error("Message is empty."), { status: 400 });
      db.prepare("INSERT INTO order_messages (order_id, sender_role, body) VALUES (?, 'customer', ?)").run(id, String(body.body));
      return sendJson(res, 200, { ok: true });
    }
    if (method === "GET" && p.startsWith("/api/orders/")) {
      const user = requireCustomer(req);
      const id = Number(p.split("/")[3]);
      const o = db.prepare("SELECT * FROM orders WHERE id=? AND customer_id=?").get(id, user.id);
      if (!o) return sendJson(res, 404, { error: "Order not found." });
      return sendJson(res, 200, { order: customerOrderView(o), messages: orderMessages(id) });
    }
    if (method === "POST" && p === "/api/reviews") {
      const user = requireCustomer(req);
      const body = await readBody(req);
      const rating = Number(body.rating);
      if (!body.productId || !(rating >= 1 && rating <= 5) || !body.body) {
        throw Object.assign(new Error("Product, rating 1-5, and text are required."), { status: 400 });
      }
      // Reviews only after delivery of that product by this customer.
      const delivered = db.prepare("SELECT items FROM orders WHERE customer_id=? AND status='delivered'").all(user.id);
      const bought = delivered.some((o) => JSON.parse(o.items).some((i) => i.productId === body.productId));
      if (!bought) throw Object.assign(new Error("You can review a product after its delivery."), { status: 400 });
      db.prepare("INSERT INTO reviews (product_id, customer_id, rating, body) VALUES (?,?,?,?)")
        .run(body.productId, user.id, rating, String(body.body));
      return sendJson(res, 201, { ok: true });
    }

    // ----- seller API -----
    if (method === "GET" && p === "/api/seller/exists") {
      return sendJson(res, 200, { exists: sellerExists(db) });
    }
    if (method === "POST" && p === "/api/seller/setup") {
      const body = await readBody(req);
      setupSeller(db, body.password, body.phone);
      return sendJson(res, 201, { ok: true });
    }
    if (method === "POST" && p === "/api/seller/login") {
      const body = await readBody(req);
      const user = sellerLogin(db, body.password);
      const s = issueSession(db, user.id, config.sessionDays);
      setSessionCookie(res, s.token, config.sessionDays);
      return sendJson(res, 200, { ok: true, role: "seller" });
    }
    if (method === "POST" && p === "/api/seller/logout") {
      revokeSession(db, cookies(req).session); clearSessionCookie(res);
      return sendJson(res, 200, { ok: true });
    }
    if (method === "GET" && p === "/api/seller/orders") {
      requireSeller(req);
      const rows = db.prepare("SELECT * FROM orders ORDER BY id DESC").all();
      return sendJson(res, 200, { orders: rows.map(sellerOrderView) });
    }
    if (method === "POST" && p.startsWith("/api/seller/orders/") && p.endsWith("/status")) {
      requireSeller(req);
      const id = Number(p.split("/")[4]);
      const body = await readBody(req);
      const allowed = ["confirmed", "dispatched", "delivered", "cancelled"];
      if (!allowed.includes(body.status)) throw Object.assign(new Error("Invalid status."), { status: 400 });
      const o = db.prepare("SELECT * FROM orders WHERE id=?").get(id);
      if (!o) return sendJson(res, 404, { error: "Order not found." });
      if (o.status === "delivered" || o.status === "cancelled") {
        throw Object.assign(new Error("This order is final and cannot change."), { status: 400 });
      }
      db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(body.status, id);
      return sendJson(res, 200, { ok: true, status: body.status });
    }
    if (method === "POST" && p.startsWith("/api/seller/orders/") && p.endsWith("/advance")) {
      requireSeller(req);
      const id = Number(p.split("/")[4]);
      const body = await readBody(req);
      const o = db.prepare("SELECT * FROM orders WHERE id=?").get(id);
      if (!o) return sendJson(res, 404, { error: "Order not found." });
      db.prepare("UPDATE orders SET advance_decision=? WHERE id=?").run(String(body.decision || ""), id);
      return sendJson(res, 200, { ok: true });
    }
    if (method === "POST" && p.startsWith("/api/seller/orders/") && p.endsWith("/tracking")) {
      // Honest tracking (seller only): set/clear the courier + tracking ID.
      // The customer then sees the real tracking ID and a link to the
      // courier's own tracking page. No fake live tracking is ever generated.
      requireSeller(req);
      const id = Number(p.split("/")[4]);
      const body = await readBody(req);
      const o = db.prepare("SELECT * FROM orders WHERE id=?").get(id);
      if (!o) return sendJson(res, 404, { error: "Order not found." });
      const courier = String(body.courier || "").trim();
      const trackingId = String(body.tracking_id || "").trim();
      if (courier && !Object.prototype.hasOwnProperty.call(COURIERS, courier)) {
        throw Object.assign(new Error("Unknown courier."), { status: 400 });
      }
      if (trackingId.length > 64) throw Object.assign(new Error("Tracking ID is too long."), { status: 400 });
      db.prepare("UPDATE orders SET courier=?, tracking_id=?, updated_at=datetime('now') WHERE id=?")
        .run(courier || null, trackingId || null, id);
      return sendJson(res, 200, { ok: true });
    }
    if (method === "POST" && p.startsWith("/api/seller/orders/") && p.endsWith("/message")) {
      requireSeller(req);
      const id = Number(p.split("/")[4]);
      const body = await readBody(req);
      const o = db.prepare("SELECT * FROM orders WHERE id=?").get(id);
      if (!o) return sendJson(res, 404, { error: "Order not found." });
      if (!body.body) throw Object.assign(new Error("Message is empty."), { status: 400 });
      // Every message to a customer begins with the full Salaam.
      const text = String(body.body).startsWith(SALAAM) ? String(body.body) : SALAAM + "\n" + String(body.body);
      db.prepare("INSERT INTO order_messages (order_id, sender_role, body) VALUES (?, 'seller', ?)").run(id, text);
      return sendJson(res, 200, { ok: true });
    }
    if (method === "GET" && p === "/api/seller/reviews") {
      requireSeller(req);
      const rows = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      return sendJson(res, 200, { reviews: rows });
    }
    if (method === "POST" && p.startsWith("/api/seller/reviews/")) {
      requireSeller(req);
      const parts = p.split("/");
      const id = Number(parts[4]); const action = parts[5];
      if (action === "hide") db.prepare("UPDATE reviews SET visible=0 WHERE id=?").run(id);
      else if (action === "show") db.prepare("UPDATE reviews SET visible=1 WHERE id=?").run(id);
      else if (action === "delete") db.prepare("DELETE FROM reviews WHERE id=?").run(id);
      else throw Object.assign(new Error("Invalid review action."), { status: 400 });
      return sendJson(res, 200, { ok: true });
    }
    if (method === "POST" && p.startsWith("/api/seller/products/")) {
      requireSeller(req);
      const id = p.split("/")[4];
      const body = await readBody(req);
      const row = db.prepare("SELECT * FROM products WHERE id=?").get(id);
      if (!row) return sendJson(res, 404, { error: "Product not found." });
      if (body.price !== undefined && body.price !== null && !(Number(body.price) >= 0)) {
        throw Object.assign(new Error("Invalid price."), { status: 400 });
      }
      if (body.status && !["available", "coming_soon", "price_on_contact"].includes(body.status)) {
        throw Object.assign(new Error("Invalid status."), { status: 400 });
      }
      db.prepare("UPDATE products SET price=?, status=? WHERE id=?").run(
        body.price === undefined ? row.price : body.price,
        body.status || row.status, id);
      return sendJson(res, 200, { ok: true });
    }
    if (method === "POST" && p === "/api/seller/announcements") {
      requireSeller(req);
      const body = await readBody(req);
      if (!body.titleEn || !body.body) throw Object.assign(new Error("Title and message are required."), { status: 400 });
      db.prepare("INSERT INTO announcements (title_en, title_ur, body) VALUES (?,?,?)")
        .run(body.titleEn, body.titleUr || "", body.body);
      return sendJson(res, 201, { ok: true });
    }
    if (method === "GET" && p === "/api/seller/forwards") {
      requireSeller(req);
      const rows = db.prepare("SELECT * FROM chatbot_forwards ORDER BY id DESC").all();
      return sendJson(res, 200, { forwards: rows });
    }
    if (method === "POST" && p.startsWith("/api/seller/forwards/") && p.endsWith("/handle")) {
      requireSeller(req);
      db.prepare("UPDATE chatbot_forwards SET handled=1 WHERE id=?").run(Number(p.split("/")[4]));
      return sendJson(res, 200, { ok: true });
    }
    if (method === "GET" && p === "/api/seller/settings") {
      requireSeller(req);
      return sendJson(res, 200, {
        payment_numbers: getSetting(db, "payment_numbers", {}),
        social_links: getSetting(db, "social_links", {}),
      });
    }
    if (method === "POST" && p === "/api/seller/settings") {
      requireSeller(req);
      const body = await readBody(req);
      if (body.payment_numbers) setSetting(db, "payment_numbers", body.payment_numbers);
      if (body.social_links) setSetting(db, "social_links", body.social_links);
      return sendJson(res, 200, { ok: true });
    }
    if (method === "POST" && p === "/api/seller/change-password") {
      const user = requireSeller(req);
      const body = await readBody(req);
      changeSellerPassword(db, user.id, body.oldPassword, body.newPassword);
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: "Not found." });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    sendJson(res, status, { error: err.message || "Server error." });
  }
});

async function resolveOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || !rawItems.length) {
    throw Object.assign(new Error("Cart is empty."), { status: 400 });
  }
  const items = [];
  for (const it of rawItems) {
    const product = db.prepare("SELECT * FROM products WHERE id=?").get(it.productId);
    if (!product) throw Object.assign(new Error("Unknown product: " + it.productId), { status: 400 });
    const qty = Number(it.qty);
    if (!(qty >= 1 && qty <= 99)) throw Object.assign(new Error("Invalid quantity."), { status: 400 });
    items.push({ product, qty, variantLabel: it.variant || null });
  }
  return items;
}

server.listen(config.port, config.host, () => {
  console.log(`Asif Traders backend listening on http://${config.host}:${config.port}`);
  console.log(`Storefront: http://${config.host}:${config.port}/   Seller: http://${config.host}:${config.port}/seller`);
});
