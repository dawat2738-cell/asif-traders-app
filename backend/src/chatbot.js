// Scripted shop chatbot (foundation version).
// - EVERY reply begins with the full Salaam.
// - Answers only general shop questions (timings, delivery, payment methods,
//   location, products, installation).
// - Seller-only topics are NEVER decided here: payment confirmation,
//   password reset, cancellation/advance decisions, and replacement/refund
//   requests are forwarded to the seller as private messages, with no promise
//   made to the customer. No public azala, replacement, cancellation, or
//   refund promise appears anywhere in this file.
// - Replies are bilingual (Urdu + English shown together). Full per-language
//   detection (as in the demo) is a later enhancement, not claimed here.
import { shopPublic } from "./config.js";

export const SALAAM = "السلام علیکم ورحمة الله وبركاته";

const SELLER_ONLY = [
  { topic: "payment_confirmation", keys: ["payment confirm", "payment ho gaya", "payment kar di", "transaction id", "tid", "screenshot", "payment proof", "advance bhej", "paisay bhej", "پیمنٹ کنفرم", "ٹرانزیکشن"] },
  { topic: "password_reset", keys: ["password reset", "password bhool", "password change", "seller password", "پاس ورڈ"] },
  { topic: "cancellation_advance", keys: ["cancel", "cancellation", "advance wapas", "advance refund", "order cancel", "کینسل"] },
  { topic: "replacement_refund", keys: ["replacement", "refund", "azala", "azalah", "badla", "wapsi", "خراب", "ghalat item", "wrong item"] },
];

const ANSWERS = [
  { keys: ["timing", "time", "open", "close", "khulta", "band", "ٹائمنگ", "وقت"], en: "Physical shop: 10 AM – 9 PM. Online: 24/7, contact any time. Dish installation/setting: contact 24/7, work at the agreed time within shop hours.", ur: "فزیکل شاپ: صبح 10 بجے سے رات 9 بجے تک۔ آن لائن: 24 گھنٹے، کسی بھی وقت رابطہ کریں۔ ڈش انسٹالیشن/سیٹنگ: رابطہ 24 گھنٹے، کام طے شدہ وقت پر شاپ ٹائمنگ میں۔" },
  { keys: ["delivery", "deliver", "charges", "lahore", "courier", "leopard", "tcs", "ڈلیوری"], en: "Lahore delivery: minimum Rs 500, Rs 1000 advance, rest on delivery. Other cities: delivery charges are confirmed on the spot (Leopard mostly, or TCS), full payment in advance, delivery charges are the customer's.", ur: "لاہور ڈلیوری: کم سے کم Rs 500، Rs 1000 ایڈوانس، باقی ڈلیوری پر۔ دوسرے شہر: ڈلیوری چارجز موقع پر بتائے جائیں گے (اکثر Leopard یا TCS)، مکمل ادائیگی ایڈوانس میں، ڈلیوری چارجز کسٹمر کے ہوں گے۔" },
  { keys: ["payment", "jazzcash", "easypaisa", "u paisa", "paisa", "account", "پیمنٹ"], en: "Payment methods: JazzCash, Easypaisa, U Paisa. Account numbers are added by the seller in Settings and shown at checkout.", ur: "ادائیگی کے طریقے: JazzCash، Easypaisa، U Paisa۔ اکاؤنٹ نمبر سیلر Settings میں ڈالتا ہے اور چیک آؤٹ پر نظر آتے ہیں۔" },
  { keys: ["location", "address", "kahan", "shop kahan", "ایڈریس", "پتہ"], en: "Shop address: Younis Centre, Hall Road, Lahore. Phone/WhatsApp: 03007924762.", ur: "شاپ کا پتہ: یونس سینٹر، ہال روڈ، لاہور۔ فون/واٹس ایپ: 03007924762۔" },
  { keys: ["install", "installation", "setup", "dish lag", "انسٹالیشن"], en: "Dish installation: complete setup (dish + receiver + LNB + cable). Price depends on channels and your requirements — contact the seller. Part advance, rest after installation.", ur: "ڈش انسٹالیشن: مکمل سیٹ اپ (ڈش + ریسیور + LNB + کیبل)۔ قیمت چینلز اور آپ کی ضرورت پر منحصر ہے — سیلر سے رابطہ کریں۔ کچھ ایڈوانس، باقی انسٹالیشن کے بعد۔" },
  { keys: ["iptv", "recharge", "trial", "free"], en: "IPTV and recharge services are not offered. We sell physical products: satellite dishes, receivers, Android TV boxes, LNBs, WiFi routers, CCTV cameras and accessories.", ur: "IPTV اور ریچارج سروسز دستیاب نہیں ہیں۔ ہم جسمانی سامان بیچتے ہیں: سیٹلائٹ ڈش، ریسیور، اینڈرائیڈ ٹی وی باکس، LNB، وائی فائی راؤٹر، CCTV کیمرے اور لوازمات۔" },
  { keys: ["product", "price", "rate", "qeemat", "dish", "box", "receiver", "قیمت"], en: "You can see all products, pictures and prices in the store above. Tell me a product name and I will help you find it.", ur: "تمام پروڈکٹس، تصویریں اور قیمتیں اوپر اسٹور میں دیکھ سکتے ہیں۔ کسی پروڈکٹ کا نام بتائیں، میں آپ کو ڈھونڈنے میں مدد کروں گا۔" },
  { keys: ["salam", "assalam", "hello", "hi", "aoa", "السلام"], en: "Welcome to Asif Traders. Ask about products, prices, timings, delivery, or installation.", ur: "آصف ٹریڈرز میں خوش آمدید۔ پروڈکٹس، قیمتوں، ٹائمنگ، ڈلیوری یا انسٹالیشن کے بارے میں پوچھیں۔" },
];

export function chatReply(text) {
  const t = String(text || "").toLowerCase();
  for (const s of SELLER_ONLY) {
    if (s.keys.some((k) => t.includes(k))) {
      return {
        forward: true, topic: s.topic,
        reply: `${SALAAM}\nYour question has been forwarded to the seller. The seller will reply personally.\nآپ کا سوال سیلر کو بھیج دیا گیا ہے۔ سیلر خود جواب دے گا۔`,
      };
    }
  }
  for (const a of ANSWERS) {
    if (a.keys.some((k) => t.includes(k))) {
      return { forward: false, topic: null, reply: `${SALAAM}\n${a.en}\n${a.ur}` };
    }
  }
  return {
    forward: false, topic: null,
    reply: `${SALAAM}\nI can help with products, prices, timings, delivery, payment methods, and installation. For payment confirmation, password, cancellation, or advance questions, I forward your question to the seller.\nمیں پروڈکٹس، قیمتوں، ٹائمنگ، ڈلیوری، ادائیگی کے طریقوں اور انسٹالیشن میں مدد کر سکتا ہوں۔ ادائیگی کی تصدیق، پاس ورڈ، کینسلیشن یا ایڈوانس کے سوالوں پر میں آپ کا سوال سیلر کو بھیج دیتا ہوں۔`,
  };
}

export function shopInfo() { return shopPublic(); }
