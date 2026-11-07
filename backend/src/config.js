// Configuration: everything deployment-specific comes from environment variables.
// NOTHING secret is hardcoded here: no API keys, no passwords, no phone numbers
// beyond the shop's own public contact number (which is public shop data).
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const goalDir = path.resolve(here, "..", "..");

export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "127.0.0.1",
  // SQLite file. Default lives next to the code; override with DB_PATH.
  dbPath: process.env.DB_PATH || path.join(here, "..", "data", "shop.db"),
  // Product pictures + banner/profile live in the goal folder (source of truth).
  // Override with IMAGES_DIR if the backend is deployed away from the goal folder.
  imagesDir: process.env.IMAGES_DIR || path.join(goalDir, "products"),
  bannerPath: process.env.BANNER_PATH || path.join(goalDir, "shop-banner.png"),
  profilePath: process.env.PROFILE_PATH || path.join(goalDir, "shop-profile.png"),
  // Sessions are random tokens stored hashed in SQLite, so they survive
  // restarts and need no signing secret. No secret is required for session
  // security in this design.
  sessionDays: Number(process.env.SESSION_DAYS || 30),
  // OTP behaviour. FREE DESIGN (default): SMS OTP is OFF because SMS costs
  // money (local Pakistani gateways charge per SMS). Set SMS_OTP_ENABLED=true
  // ONLY if the shop owner later chooses a paid SMS provider; the OTP
  // provider interface in src/sms.js stays intact for that case.
  //   SMS_OTP_ENABLED=true  - phone + OTP login is active (needs SMS_PROVIDER).
  //   anything else (default) - FREE design: customers log in with their
  //     phone number only (no SMS sent, no code issued). Verification then
  //     happens when the seller confirms the order by phone/WhatsApp call
  //     before dispatch, and no order is dispatched without advance payment.
  smsOtpEnabled: process.env.SMS_OTP_ENABLED === "true",
  //   stub  (default)  - interface-only: NOTHING is sent. The code is written to
  //                      the server console in development so local testing can
  //                      proceed. Never returns the code in any API response.
  //   http             - POSTs to SMS_API_URL with SMS_API_KEY from env. Refuses
  //                      to start unless both are set. No key is ever in code.
  smsProvider: process.env.SMS_PROVIDER || "stub",
  smsApiUrl: process.env.SMS_API_URL || null,
  smsApiKey: process.env.SMS_API_KEY || null,
  smsSenderId: process.env.SMS_SENDER_ID || "AsifTraders",
  otpLength: 6,
  otpTtlMinutes: 10,
  otpMaxAttempts: 5,
  otpRequestCooldownSeconds: 60,
  otpMaxRequestsPerHour: 5,
  // TEST_MODE=1 enables ONLY the /__test__/last-otp endpoint used by verify.js.
  // It is off by default and must never be enabled in production.
  testMode: process.env.TEST_MODE === "1",
};

export function shopPublic() {
  return {
    nameEn: "Asif Traders",
    nameUr: "آصف ٹریڈرز",
    addressEn: "Younis Centre, Hall Road, Lahore",
    addressUr: "یونس سینٹر، ہال روڈ، لاہور",
    phone: "03007924762",
    whatsappLink: "https://wa.me/923007924762",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Younis+Centre+Hall+Road+Lahore",
    owner: "Muhammad Asif",
    // Payment methods by NAME ONLY. Numbers are never invented here; the seller
    // adds real numbers in the seller dashboard Settings (stored in settings).
    paymentMethods: ["JazzCash", "Easypaisa", "U Paisa"],
    timings: {
      shopEn: "Physical shop: 10 AM – 9 PM",
      shopUr: "فزیکل شاپ: صبح 10 بجے سے رات 9 بجے تک",
      onlineEn: "Online orders: 24/7 — contact any time",
      onlineUr: "آن لائن آرڈر: 24 گھنٹے، کسی بھی وقت رابطہ کریں",
      installEn: "Dish installation/setting: contact 24/7, work at agreed time within shop hours",
      installUr: "ڈش انسٹالیشن/سیٹنگ: رابطہ 24 گھنٹے، کام طے شدہ وقت پر شاپ ٹائمنگ میں",
    },
  };
}
