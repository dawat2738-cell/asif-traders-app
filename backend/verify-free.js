// FREE-design + PWA verification for the Asif Traders backend.
// Boots the server with DEFAULT env (SMS_OTP_ENABLED unset => OFF) and
// checks: PWA manifest/service worker/icons, Add to Home Screen meta,
// phone-only login with no SMS, OTP endpoints rejected, and that every
// policy/privacy rule still holds in free-design mode.
// Exit 0 = all pass. Uses a throwaway DB that is deleted afterwards.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3102;
const BASE = `http://127.0.0.1:${PORT}`;
const DB = path.join(here, "data", "verify-free-test.db");

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
      try { json = JSON.parse(text); } catch { /* html / js */ }
      return { status: r.status, json, text, contentType: r.headers.get("content-type") };
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

for (const f of [DB, DB + "-wal", DB + "-shm"]) { try { fs.unlinkSync(f); } catch { /* fresh */ } }

// NOTE: SMS_OTP_ENABLED is deliberately NOT set here: default must be OFF.
const child = spawn("node", ["src/server.js"], {
  cwd: here,
  env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1", DB_PATH: DB },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", (d) => process.stdout.write("[server] " + d));
child.stderr.on("data", (d) => process.stdout.write("[server:err] " + d));

const anon = jar();
try {
  console.log("Waiting for server (FREE design, OTP off by default)...");
  if (!(await waitReady())) throw new Error("Server did not start.");

  console.log("== PWA ==");
  let r = await anon.req("/manifest.webmanifest");
  check("manifest serves, name Asif Traders, navy+gold theme, standalone",
    r.status === 200 && r.json && r.json.name === "Asif Traders — آصف ٹریڈرز" &&
    r.json.theme_color === "#070d1f" && r.json.display === "standalone" &&
    r.json.start_url === "/" &&
    (r.json.icons || []).some((i) => i.sizes === "192x192") &&
    (r.json.icons || []).some((i) => i.sizes === "512x512"));
  r = await anon.req("/sw.js");
  check("service worker serves, caches shell only, never API",
    r.status === 200 && /caches/.test(r.text) && /\/api\//.test(r.text) &&
    /asif-traders-shell/.test(r.text));
  r = await anon.req("/icons/icon-192.png");
  check("icon 192 serves as PNG", r.status === 200 && (r.contentType || "").includes("image/png"));
  r = await anon.req("/icons/icon-512.png");
  check("icon 512 serves as PNG", r.status === 200 && (r.contentType || "").includes("image/png"));

  console.log("== Storefront head (Add to Home Screen) ==");
  r = await anon.req("/");
  check("manifest link + theme-color + mobile-web-app-capable + Apple meta present",
    r.status === 200 &&
    r.text.includes('href="/manifest.webmanifest"') &&
    r.text.includes('name="theme-color"') &&
    r.text.includes('mobile-web-app-capable') &&
    r.text.includes('apple-mobile-web-app-capable') &&
    r.text.includes('apple-touch-icon') &&
    r.text.includes("serviceWorker.register('/sw.js')"));
  check("Islamic opening + shop name + banner/profile intact",
    r.text.includes("بِسْمِ اللَّهِ") && r.text.includes("آصف ٹریڈرز") &&
    r.text.includes("/img/banner.png") && r.text.includes("/img/profile.png"));

  console.log("== FREE-design login (no SMS) ==");
  check("login box states no SMS + seller phone confirmation + no dispatch without advance",
    r.text.includes("no SMS code is sent") &&
    r.text.includes("seller confirms your order by phone/WhatsApp call before dispatch") &&
    r.text.includes("No order is dispatched without advance payment"));
  const cust = jar();
  r = await cust.req("/api/auth/phone-login", "POST", { phone: "03003333333" });
  check("phone-only login works, role customer, no code in response",
    r.status === 200 && r.json.role === "customer" && !("code" in (r.json || {})));
  r = await cust.req("/api/orders/mine");
  check("phone-logged-in customer can list own orders (empty)",
    r.status === 200 && Array.isArray(r.json.orders));
  r = await cust.req("/api/auth/phone-login", "POST", { phone: "12345" });
  check("invalid phone rejected", r.status === 400);
  r = await anon.req("/api/auth/request-otp", "POST", { phone: "03003333333" });
  check("OTP request REJECTED when OTP is off (no SMS can be triggered)",
    r.status === 400 && /disabled/.test(r.json.error || ""));
  r = await anon.req("/api/auth/verify-otp", "POST", { phone: "03003333333", code: "123456" });
  check("OTP verify REJECTED when OTP is off", r.status === 400);

  console.log("== Policy + privacy rules still hold in FREE mode ==");
  r = await anon.req("/api/products");
  check("69 products still seeded", r.json.products.length === 69);
  const dish6 = r.json.products.find((p) => p.id === "dish-6ft");
  check("6ft dish still has NO brand name", dish6 && !/shabbir/i.test(dish6.nameEn));
  r = await anon.req("/api/bill/preview", "POST", { items: [{ productId: "android-box-01", qty: 1 }], zone: "lahore" });
  check("Lahore bill unchanged: 6000 + 500 delivery, 1000 advance",
    r.json.subtotal === 6000 && r.json.deliveryFee === 500 && r.json.advanceDue === 1000);
  r = await anon.req("/api/bill/preview", "POST", { items: [{ productId: "plate-plastic-china", qty: 1 }], zone: "other" });
  check("Out-of-Lahore bill: NO 500 figure, delivery null, full advance",
    r.json.deliveryFee === null && r.json.advanceDue === 200 && !JSON.stringify(r.json).includes('"deliveryFee":500'));
  r = await anon.req("/api/bill/preview", "POST", { items: [{ productId: "install-01", qty: 1 }], zone: "lahore" });
  check("Installation still Price on Contact, advance 0",
    r.json.hasPriceOnContact === true && r.json.advanceDue === 0);
  r = await anon.req("/api/payment-info");
  check("payment methods by name only, no numbers invented",
    r.json.methods.every((m) => ["JazzCash", "Easypaisa", "U Paisa"].includes(m.method) && m.number === null));
  // Free-design order flow end to end: place order as phone-logged-in customer.
  r = await cust.req("/api/orders", "POST", {
    items: [{ productId: "android-box-01", qty: 1 }], zone: "lahore",
    name: "Free Design Customer", address: "Test Street, Lahore",
  });
  check("phone-logged-in customer can place order (seller confirms by call)",
    r.status === 201 && !!r.json.orderNo);
  const orderId = r.json.orderId;
  const custB = jar();
  await custB.req("/api/auth/phone-login", "POST", { phone: "03004444444" });
  r = await custB.req("/api/orders/" + orderId);
  check("other customer still CANNOT see this order (404)", r.status === 404);
  r = await anon.req("/api/stats");
  check("public stats counts only, no money keys",
    r.json.products !== undefined && !("revenue" in r.json) && !("total" in r.json));

  console.log(`\nRESULT: ${pass} passed, ${fail} failed.`);
  if (fail) { console.log("Failed checks: " + failures.join(" | ")); }
  process.exitCode = fail ? 1 : 0;
} catch (err) {
  console.error("VERIFY-FREE ERROR:", err);
  process.exitCode = 1;
} finally {
  child.kill();
  await new Promise((r) => setTimeout(r, 300));
  for (const f of [DB, DB + "-wal", DB + "-shm"]) { try { fs.unlinkSync(f); } catch { /* ignore */ } }
}
