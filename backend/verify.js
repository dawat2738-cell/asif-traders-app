// End-to-end verification for the backend foundation.
// Boots the server on a temp DB with TEST_MODE=1, runs HTTP assertions,
// then kills the server and removes the temp DB. Exit 0 = all pass.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3101;
const BASE = `http://127.0.0.1:${PORT}`;
const DB = path.join(here, "data", "verify-test.db");

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL ${name} ${extra}`); }
}
function jar() {
  const cookies = {};
  return {
    async req(p, method = "GET", body = null) {
      const headers = { "Content-Type": "application/json" };
      const ck = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
      if (ck) headers.Cookie = ck;
      const r = await fetch(BASE + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
      const setCookie = r.headers.get("set-cookie");
      if (setCookie) {
        const m = setCookie.match(/session=([^;]*)/);
        if (m) cookies.session = m[1];
      }
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* html */ }
      return { status: r.status, json, text };
    },
  };
}

async function waitReady(tries = 50) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(BASE + "/api/stats"); if (r.ok) return true; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

try { fs.unlinkSync(DB); } catch { /* fresh */ }
try { fs.unlinkSync(DB + "-wal"); } catch { /* fresh */ }
try { fs.unlinkSync(DB + "-shm"); } catch { /* fresh */ }

const child = spawn("node", ["src/server.js"], {
  cwd: here,
  env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1", DB_PATH: DB, TEST_MODE: "1", SMS_OTP_ENABLED: "true" },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", (d) => process.stdout.write("[server] " + d));
child.stderr.on("data", (d) => process.stdout.write("[server:err] " + d));

const anon = jar();
try {
  console.log("Waiting for server...");
  if (!(await waitReady())) throw new Error("Server did not start.");

  console.log("== Storefront ==");
  let r = await anon.req("/");
  check("storefront 200 + Islamic opening + shop name", r.status === 200 &&
    r.text.includes("بِسْمِ اللَّهِ") && r.text.includes("آصف ٹریڈرز") && r.text.includes("Asif Traders"));
  check("banner + profile images served", (await anon.req("/img/banner.png")).status === 200 &&
    (await anon.req("/img/profile.png")).status === 200);
  check("product image served", (await anon.req("/img/products/android-box-01-premium-max.jpg")).status === 200);

  console.log("== Catalog ==");
  r = await anon.req("/api/products");
  const products = r.json.products;
  check("63 products seeded", products.length === 63, `(got ${products.length})`);
  check("43 available / 19 coming_soon / 1 price_on_contact",
    products.filter((p) => p.status === "available").length === 43 &&
    products.filter((p) => p.status === "coming_soon").length === 19 &&
    products.filter((p) => p.status === "price_on_contact").length === 1);
  const premium = products.find((p) => p.id === "android-box-01");
  check("Premium Max Rs 6000", premium && premium.price === 6000);
  const chinaPlate = products.find((p) => p.id === "plate-plastic-china");
  check("China plate Rs 200", chinaPlate && chinaPlate.price === 200);
  const dish6 = products.find((p) => p.id === "dish-6ft");
  check("6ft dish has NO brand name + 3 variants",
    dish6 && !/shabbir/i.test(dish6.nameEn) && dish6.variants &&
    dish6.variants.map((v) => v.price).join(",") === "38000,45000,55000");
  const dish5 = products.find((p) => p.id === "dish-5ft");
  check("5ft dish 4 variants 9000/15000/25000/35000",
    dish5 && dish5.variants.map((v) => v.price).join(",") === "9000,15000,25000,35000");
  const install = products.find((p) => p.id === "install-01");
  check("installation price null (Price on Contact)", install && install.price === null && install.status === "price_on_contact");
  check("no recharge/IPTV products remain", !products.some((p) => /recharge-iptv|recharge-forever|recharge-funcam|recharge-gshare|recharge-nashare|recharge-dishtv/.test(p.id)));
  check("no invented payment numbers in public catalog",
    !JSON.stringify(products).match(/0300\d{7}|03\d{2}-\d{7}/));

  console.log("== Public stats (counts only) ==");
  r = await anon.req("/api/stats");
  check("stats has counts only, no money keys",
    r.json.products !== undefined && r.json.orders !== undefined &&
    !("revenue" in r.json) && !("total" in r.json) && !("prices" in r.json));

  console.log("== OTP login (stub: nothing sent, code never in API) ==");
  const custA = jar(), custB = jar();
  r = await custA.req("/api/auth/request-otp", "POST", { phone: "03001111111" });
  check("OTP request 200, response carries NO code", r.status === 200 && !("code" in (r.json || {})));
  const otp = await anon.req("/__test__/last-otp");
  check("test hook returns code (test mode only)", otp.json && /^\d{6}$/.test(otp.json.code));
  r = await custA.req("/api/auth/verify-otp", "POST", { phone: "03001111111", code: "000000" });
  check("wrong OTP rejected", r.status === 401);
  r = await custA.req("/api/auth/verify-otp", "POST", { phone: "03001111111", code: otp.json.code });
  check("correct OTP logs customer in", r.status === 200 && r.json.role === "customer");

  console.log("== Billing rules ==");
  r = await anon.req("/api/bill/preview", "POST", { items: [{ productId: "android-box-01", qty: 1 }], zone: "lahore" });
  check("Lahore bill: 6000 + 500 delivery, 1000 advance, 6500 total",
    r.json.subtotal === 6000 && r.json.deliveryFee === 500 && r.json.advanceDue === 1000 && r.json.totalDue === 6500);
  r = await anon.req("/api/bill/preview", "POST", { items: [{ productId: "plate-plastic-china", qty: 1 }], zone: "other" });
  check("Out-of-Lahore bill: NO 500 figure, delivery null, full advance 200",
    r.json.deliveryFee === null && r.json.advanceDue === 200 && r.json.totalDue === 200 &&
    /Leopard/.test(r.json.deliveryNote) && !JSON.stringify(r.json).includes('"deliveryFee":500'));
  r = await anon.req("/api/bill/preview", "POST", { items: [{ productId: "install-01", qty: 1 }], zone: "lahore" });
  check("Service-only order: no delivery fee, advance 0, Price on Contact",
    r.json.deliveryFee === null && r.json.advanceDue === 0 && r.json.hasPriceOnContact === true);
  r = await anon.req("/api/bill/preview", "POST", { items: [{ productId: "android-box-05", qty: 1 }], zone: "lahore" });
  check("Coming Soon cannot be billed", r.status === 400);

  console.log("== Orders + privacy ==");
  r = await custA.req("/api/orders", "POST", {
    items: [{ productId: "android-box-01", qty: 1 }], zone: "lahore",
    name: "Test Customer", address: "Test Street, Lahore",
  });
  check("customer A order created", r.status === 201 && r.json.orderNo === "AT-1001");
  const orderId = r.json.orderId;
  await custB.req("/api/auth/request-otp", "POST", { phone: "03002222222" });
  const otpB = await anon.req("/__test__/last-otp");
  await custB.req("/api/auth/verify-otp", "POST", { phone: "03002222222", code: otpB.json.code });
  r = await custB.req("/api/orders/" + orderId);
  check("customer B CANNOT see customer A's order (404)", r.status === 404);
  r = await custB.req("/api/orders/mine");
  check("customer B order list excludes A's order", r.json.orders.every((o) => o.id !== orderId));
  r = await custA.req("/api/orders/" + orderId);
  check("customer A sees own order WITHOUT advance_decision key",
    r.status === 200 && !("advance_decision" in r.json.order));

  console.log("== Seller (no default password) ==");
  const seller = jar();
  r = await seller.req("/api/seller/exists");
  check("no seller exists at first boot", r.json.exists === false);
  r = await seller.req("/api/seller/login", "POST", { password: "anything" });
  check("seller login before setup rejected", r.status === 401);
  r = await seller.req("/api/seller/setup", "POST", { password: "sellerpass123", phone: "seller" });
  check("seller setup works", r.status === 201);
  r = await seller.req("/api/seller/setup", "POST", { password: "otherpass123", phone: "seller" });
  check("second setup rejected", r.status === 400);
  r = await seller.req("/api/seller/login", "POST", { password: "wrongpass" });
  check("wrong seller password rejected", r.status === 401);
  r = await seller.req("/api/seller/login", "POST", { password: "sellerpass123" });
  check("seller login works", r.status === 200);
  r = await seller.req("/api/seller/orders");
  check("seller sees all orders WITH advance_decision field",
    r.status === 200 && r.json.orders.some((o) => o.id === orderId && "advance_decision" in o));
  r = await seller.req("/api/seller/orders/" + orderId + "/advance", "POST", { decision: "adjusted against next order" });
  check("seller sets private advance decision", r.status === 200);
  r = await custA.req("/api/orders/" + orderId);
  check("advance decision still hidden from customer", !("advance_decision" in r.json.order));
  r = await seller.req("/api/seller/orders/" + orderId + "/message", "POST", { body: "Your order is confirmed." });
  check("seller message accepted", r.status === 200);
  r = await custA.req("/api/orders/" + orderId + "/messages");
  check("seller message begins with full Salaam",
    r.json.messages.some((m) => m.sender_role === "seller" && m.body.startsWith("السلام علیکم ورحمة الله وبركاته")));
  await seller.req("/api/seller/orders/" + orderId + "/status", "POST", { status: "confirmed" });
  await seller.req("/api/seller/orders/" + orderId + "/status", "POST", { status: "dispatched" });
  await seller.req("/api/seller/orders/" + orderId + "/status", "POST", { status: "delivered" });
  r = await custA.req("/api/orders/" + orderId);
  check("tracking: placed -> confirmed -> dispatched -> delivered", r.json.order.status === "delivered");

  console.log("== Reviews + moderation ==");
  r = await custA.req("/api/reviews", "POST", { productId: "android-box-01", rating: 5, body: "Great box, fast delivery." });
  check("review after delivery accepted", r.status === 201);
  r = await anon.req("/api/reviews");
  check("public reviews show it, average 5", r.json.count === 1 && r.json.average === 5);
  const revId = (await seller.req("/api/seller/reviews")).json.reviews[0].id;
  await seller.req("/api/seller/reviews/" + revId + "/hide", "POST", {});
  r = await anon.req("/api/reviews");
  check("hidden review excluded from public list + average", r.json.count === 0 && r.json.average === null);
  await seller.req("/api/seller/reviews/" + revId + "/show", "POST", {});
  r = await anon.req("/api/reviews");
  check("shown review returns", r.json.count === 1);

  console.log("== Chatbot boundaries ==");
  r = await anon.req("/api/chat", "POST", { text: "payment confirm karein, transaction id bhej di hai" });
  check("payment-confirmation forwarded, not decided",
    r.json.forwarded === true && /forwarded to the seller/.test(r.json.reply));
  r = await anon.req("/api/chat", "POST", { text: "shop timing kya hai?" });
  check("timings answer bilingual + starts with Salaam",
    r.json.reply.startsWith("السلام علیکم ورحمة الله وبركاته") && r.json.reply.includes("10 AM"));
  const fwd = await seller.req("/api/seller/forwards");
  check("forward visible in seller inbox", fwd.json.forwards.some((f) => f.topic === "payment_confirmation"));
  const chatTexts = [
    (await anon.req("/api/chat", "POST", { text: "refund chahiye" })).json.reply,
    (await anon.req("/api/chat", "POST", { text: "replacement do" })).json.reply,
    (await anon.req("/api/chat", "POST", { text: "order cancel karna hai" })).json.reply,
  ];
  check("no public refund/replacement promise in chatbot replies",
    chatTexts.every((t) => !/refund|replacement guarantee|money-back|free replacement/i.test(t)));

  console.log("== Settings (seller-only) ==");
  r = await anon.req("/api/seller/settings");
  check("settings blocked without seller login", r.status === 401);
  r = await seller.req("/api/seller/settings", "POST", {
    // Deliberately fake test numbers (throwaway test DB only).
    payment_numbers: { JazzCash: "03009999999", Easypaisa: "03009999999", "U Paisa": "" },
    social_links: { facebook: "", instagram: "", tiktok: "", youtube: "" },
  });
  check("seller saves payment numbers + empty social links", r.status === 200);
  r = await anon.req("/api/payment-info");
  check("payment info shows seller numbers at checkout",
    r.json.methods.find((m) => m.method === "JazzCash").number === "03009999999");

  console.log(`\nRESULT: ${pass} passed, ${fail} failed.`);
  if (fail) { console.log("Failed checks: " + failures.join(" | ")); }
  process.exitCode = fail ? 1 : 0;
} catch (err) {
  console.error("VERIFY ERROR:", err);
  process.exitCode = 1;
} finally {
  child.kill();
  await new Promise((r) => setTimeout(r, 300));
  for (const f of [DB, DB + "-wal", DB + "-shm"]) { try { fs.unlinkSync(f); } catch { /* ignore */ } }
}
