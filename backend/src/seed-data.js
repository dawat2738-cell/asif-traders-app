// Seed data transcribed from ../products-catalog.md (source of truth).
// Removed 2026-11-07 (Google policy): IPTV Service, Forever, Funcam,
// G-Share, Nashare recharge. Dish TV Recharge kept (lawful DTH top-up).
// status: "available" | "coming_soon" | "price_on_contact"
// - coming_soon: placeholder products; unorderable, shown as Coming Soon.
// - price_on_contact: installation / recharge services; NO price is shown.
// - variants: for products sold in several types/sizes where the catalog gives
//   several prices for one entry (5 ft dish, 6 ft dish, dish rods). Variant
//   labels are neutral ("Type 1"...) because the user did not name the types.
// - LNB metal plate price Rs 550 is as recorded in the catalog; the catalog
//   notes its confirmation (550 vs 500) is still pending with the user.
// - Receiver #4 display name "AERO 1 HD" is as recorded; the catalog notes the
//   user called it "F1 mini" and the name is still to confirm.
// - Dahua bullet camera is kept under WiFi Cameras as recorded; the catalog
//   notes its category (WiFi vs DVR) is still to confirm.
// - Dish rods light/heavy is still to confirm (catalog note); sizes are as given.
export const CATEGORIES = [
  { id: "android-box", en: "Android Boxes", ur: "اینڈرائیڈ باکسز" },
  { id: "receiver", en: "Satellite Receivers", ur: "سیٹلائٹ ریسیورز" },
  { id: "router", en: "WiFi / Routers", ur: "وائی فائی / راؤٹرز" },
  { id: "router-powerbank", en: "Router Power Banks", ur: "راؤٹر پاور بینکس" },
  { id: "cband-lnb", en: "C Band LNB", ur: "سی بینڈ ایل این بی" },
  { id: "ku-lnb", en: "Ku LNB", ur: "کیو ایل این بی" },
  { id: "power-adapter", en: "Power Adapters", ur: "پاور اڈاپٹرز" },
  { id: "hdmi", en: "HDMI Cable", ur: "ایچ ڈی ایم آئی کیبل" },
  { id: "av-lead", en: "AV TV Lead", ur: "اے وی ٹی وی لیڈ" },
  { id: "remote", en: "Remote", ur: "ریموٹ" },
  { id: "cells", en: "Cells", ur: "سیلز" },
  { id: "wifi-camera", en: "WiFi Cameras", ur: "وائی فائی کیمرے" },
  { id: "dvr-camera", en: "DVR Cameras", ur: "ڈی وی آر کیمرے" },
  { id: "dvr", en: "DVR", ur: "ڈی وی آر" },
  { id: "lnb-plate", en: "LNB Plates", ur: "ایل این بی پلیٹس" },
  { id: "dish-rods", en: "Dish Sticks / Rods", ur: "ڈش راڈز" },
  { id: "dish-nutbolt", en: "Dish Nut-Bolt Packets", ur: "ڈش نٹ بولٹ پیکٹ" },
  { id: "dish", en: "Satellite Dishes", ur: "سیٹلائٹ ڈشز" },
  { id: "diseqc", en: "DiSEqC Switches", ur: "ڈائزیک سوئچز" },
  { id: "installation", en: "Installation Service", ur: "انسٹالیشن سروس" },
  { id: "recharge", en: "Recharge Services", ur: "ریچارج سروسز" },
];

export const PRODUCTS = [
  // ---------------- Android Box ----------------
  { id: "android-box-01", category: "android-box", en: "Premium Max 8K Ultra HD Android TV Box", ur: "پریمیم میکس 8K اینڈرائیڈ ٹی وی باکس", desc: "Bluetooth voice control remote, WiFi 6, Google Assistant, 8K video decoding, Netflix/YouTube/Prime Video", price: 6000, image: "android-box-01-premium-max.jpg", status: "available" },
  { id: "android-box-02", category: "android-box", en: "NOBAL 8K Ultra HD Set-Top Box", ur: "نوبل 8K سیٹ ٹاپ باکس", desc: "Voice search remote included, WiFi 6, 5G connectivity, Miracast, Ok Google", price: 5500, image: "android-box-02-nobal.jpg", status: "available" },
  { id: "android-box-03", category: "android-box", en: "Media Star 8K Ultra HD TV Box", ur: "میڈیا اسٹار 8K ٹی وی باکس", desc: "8GB DDR, 128GB eMMC, 5G Fast WiFi, Google Assistant, Bluetooth", price: 4500, image: "android-box-03-media-star.jpg", status: "available" },
  { id: "android-box-04", category: "android-box", en: "StarSat 8K Ultra HD TV Box", ur: "اسٹار سیٹ 8K ٹی وی باکس", desc: "8GB DDR, 128GB eMMC, 5G Fast WiFi, Google Assistant, Bluetooth", price: 4500, image: "android-box-04-starsat.jpg", status: "available" },
  { id: "android-box-05", category: "android-box", en: "Android Box (Coming Soon)", ur: "اینڈرائیڈ باکس (جلد آ رہا ہے)", desc: "To be replaced later with a real Android Box.", price: null, image: null, status: "coming_soon" },
  { id: "android-box-06", category: "android-box", en: "Android Box (Coming Soon)", ur: "اینڈرائیڈ باکس (جلد آ رہا ہے)", desc: "To be replaced later with a real Android Box.", price: null, image: null, status: "coming_soon" },
  // ---------------- Satellite Receiver ----------------
  { id: "receiver-01", category: "receiver", en: "Echolink EL-555 HD Digital Satellite Receiver", ur: "ایکولنک EL-555 ایچ ڈی ریسیور", desc: "Big metal body, Full HD 1080p, WiFi supported, YouTube, DVB-S2, multimedia support", price: 2600, image: "receiver-01-echolink-el555.jpg", status: "available" },
  { id: "receiver-02", category: "receiver", en: "Star Track Platinum Full HD & 4K Digital Satellite Receiver", ur: "اسٹار ٹریک پلاٹینم فل ایچ ڈی اور 4K ریسیور", desc: "Small metal body, 4K Ultra HD, DVB-S2, USB 2.0, high sensitivity", price: 2500, image: "receiver-02-startrack-platinum.jpg", status: "available" },
  { id: "receiver-03", category: "receiver", en: "Echolink EL-8214 Ultra HD Digital Satellite Receiver", ur: "ایکولنک EL-8214 الٹرا ایچ ڈی ریسیور", desc: "Plastic body, Full HD 1080p, WiFi & YouTube support, DVB-S2, HDMI, original big board", price: 2400, image: "receiver-03-echolink-el8214.jpg", status: "available" },
  { id: "receiver-04", category: "receiver", en: "SAT TRACK AERO 1 HD Digital Satellite Receiver", ur: "سیٹ ٹریک ایرو 1 ایچ ڈی ریسیور", desc: "Mini receiver, Full HD 1080p, LED display, USB media player, DVB, PVR recording, WiFi", price: 2600, image: "receiver-04-sattrack-aero1hd.png", status: "available" },
  { id: "receiver-05", category: "receiver", en: "Satellite Receiver (Coming Soon)", ur: "سیٹلائٹ ریسیور (جلد آ رہا ہے)", desc: "To be replaced later with a real Satellite Receiver.", price: null, image: null, status: "coming_soon" },
  { id: "receiver-06", category: "receiver", en: "Satellite Receiver (Coming Soon)", ur: "سیٹلائٹ ریسیور (جلد آ رہا ہے)", desc: "To be replaced later with a real Satellite Receiver.", price: null, image: null, status: "coming_soon" },
  // ---------------- WiFi / Router ----------------
  { id: "router-01", category: "router", en: "4-Antenna Wireless Router 300Mbps", ur: "4 اینٹینا وائرلیس راؤٹر 300Mbps", desc: "4 antennas, high speed, strong signals, dual band, multi-function, easy setup", price: 2500, image: "wifi-router-01-4antenna.jpg", status: "available" },
  { id: "router-02", category: "router", en: "China Mobile Wireless Router (Double Antenna)", ur: "چائنا موبائل وائرلیس راؤٹر (ڈبل اینٹینا)", desc: "High-speed fiber/wireless N router, double antenna, dual band, fast connection", price: 2600, image: "wifi-router-02-china-mobile.jpg", status: "available" },
  { id: "router-03", category: "router", en: "TP-Link Wireless Router 300Mbps (Double Antenna)", ur: "ٹی پی لنک وائرلیس راؤٹر 300Mbps (ڈبل اینٹینا)", desc: "300Mbps wireless N, double antenna, dual band, high speed", price: 2000, image: "wifi-router-03-tplink.jpg", status: "available" },
  { id: "router-04", category: "router", en: "China Mobile Wireless Gateway / Fiber ONT", ur: "چائنا موبائل وائرلیس گیٹ وے / فائبر ONT", desc: "High-speed fiber/gateway router, internal antenna, dual band, fast connection", price: 1900, image: "wifi-router-04-china-mobile-ont.jpg", status: "available" },
  { id: "router-05", category: "router", en: "WiFi Router (Coming Soon)", ur: "وائی فائی راؤٹر (جلد آ رہا ہے)", desc: "To be replaced later with a real WiFi Router.", price: null, image: null, status: "coming_soon" },
  { id: "router-06", category: "router", en: "WiFi Router (Coming Soon)", ur: "وائی فائی راؤٹر (جلد آ رہا ہے)", desc: "To be replaced later with a real WiFi Router.", price: null, image: null, status: "coming_soon" },
  // ---------------- Router Power Bank ----------------
  { id: "powerbank-01", category: "router-powerbank", en: "Mi Router Power Bank 12V (Model DDM.687)", ur: "ایم آئی راؤٹر پاور بینک 12V", desc: "12V high-power backup / UPS for routers, continuous backup during load-shedding, plug & play, works with router/TV box/modem/CCTV/fiber ONT", price: 2500, image: "router-powerbank-01-mi-12v.jpg", status: "available" },
  { id: "powerbank-02", category: "router-powerbank", en: "Xiaomi Router Power Bank 12V (20000mAh)", ur: "شیاومی راؤٹر پاور بینک 12V (20000mAh)", desc: "20000mAh capacity, 12V output, safe charging, portable power solution, router compatibility", price: 2200, image: "router-powerbank-02-xiaomi-20000mah.jpg", status: "available" },
  { id: "powerbank-03", category: "router-powerbank", en: "Router Power Bank (Coming Soon)", ur: "راؤٹر پاور بینک (جلد آ رہا ہے)", desc: "To be replaced later with a real Router Power Bank.", price: null, image: null, status: "coming_soon" },
  // ---------------- C Band LNB ----------------
  { id: "cband-01", category: "cband-lnb", en: "Focus FS-1000 C-Band Quad LNBF", ur: "فوکس FS-1000 سی بینڈ کواڈ ایل این بی ایف", desc: "Extended C-band, dual polarization, quad output (runs 4 receivers), high gain, high sensitivity", price: 3500, image: "cband-lnb-01-focus-fs1000.jpg", status: "available" },
  { id: "cband-02", category: "cband-lnb", en: "Focus Plus C-Band Twin LNBF", ur: "فوکس پلس سی بینڈ ٹوئن ایل این بی ایف", desc: "Twin output (2 receivers), built-in 5G elimination filter (anti-5G), high gain, low noise", price: 1500, image: "cband-lnb-02-focus-plus-twin.jpg", status: "available" },
  { id: "cband-03", category: "cband-lnb", en: "Newset NS-5555 C-Band Single LNBF", ur: "نیوسٹ NS-5555 سی بینڈ سنگل ایل این بی ایف", desc: "Single output (1 receiver), built-in 5G elimination filter (anti-5G), high gain, low noise", price: 1000, image: "cband-lnb-03-newset-ns5555.jpg", status: "available" },
  { id: "cband-04", category: "cband-lnb", en: "C Band LNB (Coming Soon)", ur: "سی بینڈ ایل این بی (جلد آ رہا ہے)", desc: "To be replaced later with a real C Band LNB.", price: null, image: null, status: "coming_soon" },
  { id: "cband-05", category: "cband-lnb", en: "C Band LNB (Coming Soon)", ur: "سی بینڈ ایل این بی (جلد آ رہا ہے)", desc: "To be replaced later with a real C Band LNB.", price: null, image: null, status: "coming_soon" },
  // ---------------- Ku LNB ----------------
  { id: "ku-01", category: "ku-lnb", en: "Premium X 3 Circle Big LNB", ur: "پریمیم ایکس 3 سرکل بگ ایل این بی", desc: "High-performance satellite LNB, 3 circle technology, high gain, low noise, weatherproof", price: 600, image: "ku-lnb-01-premium-x-3circle.jpg", status: "available" },
  { id: "ku-02", category: "ku-lnb", en: "Inverto X2 Premium Twin LNB (IT-02)", ur: "انورٹو X2 پریمیم ٹوئن ایل این بی", desc: "Ku-band twin output, high gain, 0.1 dB low noise, waterproof, HD & 3D ready", price: 1000, image: "ku-lnb-02-inverto-x2.jpg", status: "available" },
  { id: "ku-03", category: "ku-lnb", en: "NeoSat Ku-Band Universal Quad LNB", ur: "نیوسیٹ کیو بینڈ یونیورسل کواڈ ایل این بی", desc: "Quad output (4 ports), high gain, low noise, weatherproof, 3D Full HD 1080", price: 1800, image: "ku-lnb-03-neosat-quad.jpg", status: "available" },
];

PRODUCTS.push(
  // ---------------- Power Adapter ----------------
  { id: "adapter-01", category: "power-adapter", en: "12V Power Adapter (2.5 Amp)", ur: "12V پاور اڈاپٹر (2.5 ایمپیئر)", desc: "High-quality DC power supply, safe/stable/durable, overload protection, universal compatibility", price: 400, image: "power-adapter-01-12v-2.5a.jpg", status: "available" },
  { id: "adapter-02", category: "power-adapter", en: "Power Adapter (Coming Soon)", ur: "پاور اڈاپٹر (جلد آ رہا ہے)", desc: "To be replaced later with a real Power Adapter.", price: null, image: null, status: "coming_soon" },
  { id: "adapter-03", category: "power-adapter", en: "Power Adapter (Coming Soon)", ur: "پاور اڈاپٹر (جلد آ رہا ہے)", desc: "To be replaced later with a real Power Adapter.", price: null, image: null, status: "coming_soon" },
  { id: "adapter-04", category: "power-adapter", en: "Power Adapter (Coming Soon)", ur: "پاور اڈاپٹر (جلد آ رہا ہے)", desc: "To be replaced later with a real Power Adapter.", price: null, image: null, status: "coming_soon" },
  { id: "adapter-05", category: "power-adapter", en: "Power Adapter (Coming Soon)", ur: "پاور اڈاپٹر (جلد آ رہا ہے)", desc: "To be replaced later with a real Power Adapter.", price: null, image: null, status: "coming_soon" },
  { id: "adapter-06", category: "power-adapter", en: "Power Adapter (Coming Soon)", ur: "پاور اڈاپٹر (جلد آ رہا ہے)", desc: "To be replaced later with a real Power Adapter.", price: null, image: null, status: "coming_soon" },
  // ---------------- HDMI / AV / Remote / Cells ----------------
  { id: "hdmi-01", category: "hdmi", en: "Premium High-Speed HDMI Cable 2.0", ur: "پریمیم ہائی اسپیڈ ایچ ڈی ایم آئی کیبل 2.0", desc: "4K Ultra HD, HDR support, 18Gbps high bandwidth, gold connectors, braided jacket", price: 400, image: "hdmi-cable-01-premium-2.0.jpg", status: "available" },
  { id: "av-01", category: "av-lead", en: "Premium Component Video & Audio Cable (3+2)", ur: "پریمیم کمپوننٹ ویڈیو اور آڈیو کیبل (3+2)", desc: "3x RCA video + 2x RCA audio, gold plated, high-purity copper, durable jacket", price: 300, image: "av-tv-lead-01-component-3plus2.jpg", status: "available" },
  { id: "remote-01", category: "remote", en: "Universal Satellite & Smart TV Remote (F1 Fs)", ur: "یونیورسل سیٹلائٹ اور اسمارٹ ٹی وی ریموٹ", desc: "Premium smart remote, multi-device compatibility, durable silicone case, easy setup", price: 250, image: "remote-01-universal-smart-tv.jpg", status: "available" },
  { id: "cells-01", category: "cells", en: "Power Tec 18650 Li-ion Rechargeable Cells", ur: "پاور ٹیک 18650 لیتھیم ریچارج ایبل سیلز", desc: "High capacity, rechargeable, trusted power, complete box (mukammal dibbi)", price: 350, image: "cells-01-power-tec-18650.jpg", status: "available" },
  // ---------------- WiFi Cameras ----------------
  { id: "wificam-01", category: "wifi-camera", en: "Tenda 3MP Quad HD AI Security Pan/Tilt Camera (CP3, Wi-Fi 6)", ur: "ٹینڈا 3MP کواڈ ایچ ڈی اے آئی سیکیورٹی کیمرہ (CP3)", desc: "360° panoramic, human detection, two-way audio, night vision, USB-C power, SD card + mobile app", price: 7200, image: "wifi-camera-01-tenda-cp3.jpg", status: "available" },
  { id: "wificam-02", category: "wifi-camera", en: "Smart Net Camera V380 (Triple Lens)", ur: "اسمارٹ نیٹ کیمرہ V380 (ٹرپل لینز)", desc: "Triple-lens PTZ camera, HD, motion detection, infrared night vision, cloud storage, two-way audio, real-time remote viewing", price: 7500, image: "wifi-camera-02-v380-triple.jpg", status: "available" },
  { id: "wificam-03", category: "wifi-camera", en: "WiFi Smart Bulb Camera (5MP, Dual Lens)", ur: "وائی فائی اسمارٹ بلب کیمرہ (5MP، ڈوئل لینز)", desc: "Bulb-type camera, 5MP FHD, 355° pan & tilt, two-way audio, night alerts, cloud storage", price: 3800, image: "wifi-camera-03-bulb-5mp.jpg", status: "available" },
  { id: "wificam-04", category: "wifi-camera", en: "Dahua Economy HD Outdoor Bullet Camera", ur: "ڈاہوا اکانومی ایچ ڈی آؤٹ ڈور بلٹ کیمرہ", desc: "Bullet camera, HD outdoor. Category confirmation pending (WiFi or DVR) as noted in the catalog.", price: 4000, image: "wifi-camera-04-dahua-bullet.jpg", status: "available" },
  { id: "wificam-05", category: "wifi-camera", en: "WiFi Camera (Coming Soon)", ur: "وائی فائی کیمرہ (جلد آ رہا ہے)", desc: "To be replaced later with a real WiFi Camera.", price: null, image: null, status: "coming_soon" },
  { id: "wificam-06", category: "wifi-camera", en: "WiFi Camera (Coming Soon)", ur: "وائی فائی کیمرہ (جلد آ رہا ہے)", desc: "To be replaced later with a real WiFi Camera.", price: null, image: null, status: "coming_soon" },
  // ---------------- DVR Cameras (placeholders) / DVR ----------------
  { id: "dvrcam-01", category: "dvr-camera", en: "DVR Camera (Coming Soon)", ur: "ڈی وی آر کیمرہ (جلد آ رہا ہے)", desc: "To be replaced later with a real DVR Camera.", price: null, image: null, status: "coming_soon" },
  { id: "dvrcam-02", category: "dvr-camera", en: "DVR Camera (Coming Soon)", ur: "ڈی وی آر کیمرہ (جلد آ رہا ہے)", desc: "To be replaced later with a real DVR Camera.", price: null, image: null, status: "coming_soon" },
  { id: "dvrcam-03", category: "dvr-camera", en: "DVR Camera (Coming Soon)", ur: "ڈی وی آر کیمرہ (جلد آ رہا ہے)", desc: "To be replaced later with a real DVR Camera.", price: null, image: null, status: "coming_soon" },
  { id: "dvr-01", category: "dvr", en: "Dahua HDCVI WizSense Digital Video Recorder", ur: "ڈاہوا HDCVI وز سینس ڈیجیٹل ویڈیو ریکارڈر", desc: "HDCVI DVR, SMD Plus (human/vehicle detection, fewer false alarms), AI Coding ABR", price: 11000, image: "dvr-01-dahua-hdcvi.jpg", status: "available" },
  // ---------------- LNB Plates ----------------
  { id: "plate-metal-01", category: "lnb-plate", en: "LNB Metal Plate for Satellite Dish", ur: "ایل این بی میٹل پلیٹ برائے سیٹلائٹ ڈش", desc: "Heavy-duty round metal mounting plate/ring for C-band LNB, pre-drilled mounting holes, rust-resistant grey finish, easy installation", price: 550, image: "lnb-plate-metal-01-stylish.jpg", status: "available" },
  { id: "plate-plastic-local", category: "lnb-plate", en: "Local Plastic Plate (Dish TV Mounting Plate)", ur: "لوکل پلاسٹک پلیٹ (ڈش ٹی وی ماؤنٹنگ پلیٹ)", desc: "Strong, durable, long life, heavy duty, rust proof, easy installation, perfect fit for dish antenna", price: 100, image: "lnb-plate-plastic-01-local.png", status: "available" },
  { id: "plate-plastic-china", category: "lnb-plate", en: "China Plastic Plate for Satellite Dish (C-band LNB)", ur: "چائنا پلاسٹک پلیٹ برائے سیٹلائٹ ڈش (سی بینڈ ایل این بی)", desc: "Premium quality, high quality plastic, strong & durable, weather resistant, perfect fit, easy installation, suitable for all satellite dish brands, wholesale & retail available, 100% original", price: 200, image: "lnb-plate-plastic-02-china.png", status: "available" },
  // ---------------- Dish Rods (sizes as variants) ----------------
  { id: "rods-01", category: "dish-rods", en: "Dish Antenna Rods (3-piece set)", ur: "ڈش اینٹینا راڈز (3 پیس سیٹ)", desc: "Strong, durable, easy to install. 3-piece set for 4/5/6 foot dishes. Light or heavy type confirmation pending (catalog note).", price: null, image: "dish-rods-01-set-of-3.png", status: "available", variants: [{ label: "4 foot", ur: "4 فٹ", price: 350 }, { label: "5 foot", ur: "5 فٹ", price: 400 }, { label: "6 foot", ur: "6 فٹ", price: 1000 }] },
  // ---------------- Dish Nut-Bolt ----------------
  { id: "nutbolt-01", category: "dish-nutbolt", en: "Dish Nut-Bolt Packet (Satellite Dish Fitting Accessories)", ur: "ڈش نٹ بولٹ پیکٹ (سیٹلائٹ ڈش فٹنگ)", desc: "Strong & durable, long life, easy to use, best quality, 100% original", price: 250, image: "dish-nutbolt-packet-01.png", status: "available" },
  // ---------------- Satellite Dishes ----------------
  { id: "dish-2ft", category: "dish", en: "Star Sat HD Satellite Dish (2 foot)", ur: "اسٹار سیٹ ایچ ڈی سیٹلائٹ ڈش (2 فٹ)", desc: "4K Ultra HD, Full HD support, strong & durable, long life, easy installation, best signal quality, 100% original", price: 1200, image: "dish-01-starsat-2ft.png", status: "available" },
  { id: "dish-4ft-a", category: "dish", en: "Focal Sat Satellite Dish (4 foot, Category A)", ur: "فوکل سیٹ سیٹلائٹ ڈش (4 فٹ، کیٹیگری A)", desc: "Strong & durable, long life, HD signal receive, weather resistant, easy installation, 100% original", price: 5500, image: "dish-02-focal-sat.png", status: "available" },
  { id: "dish-4ft-b", category: "dish", en: "Focal Sat Satellite Dish (4 foot, Category B)", ur: "فوکل سیٹ سیٹلائٹ ڈش (4 فٹ، کیٹیگری B)", desc: "Strong & durable, long life, HD signal receive, weather resistant, easy installation, 100% original", price: 3500, image: "dish-02-focal-sat.png", status: "available" },
  { id: "dish-4ft-c", category: "dish", en: "Focal Sat Satellite Dish (4 foot, Category C)", ur: "فوکل سیٹ سیٹلائٹ ڈش (4 فٹ، کیٹیگری C)", desc: "Strong & durable, long life, HD signal receive, weather resistant, easy installation, 100% original", price: 2500, image: "dish-02-focal-sat.png", status: "available" },
  // 5 ft: four types, prices as given; type names were not specified by the user,
  // so variants are neutrally labelled Type 1-4. NO brand name is invented here.
  { id: "dish-5ft", category: "dish", en: "Star Track Full HD Satellite Dish (5 foot)", ur: "اسٹار ٹریک فل ایچ ڈی سیٹلائٹ ڈش (5 فٹ)", desc: "Full HD support, strong & durable, long life, weather resistant, easy installation, 100% original. Four types (user confirmed the four prices are sufficient).", price: null, image: "dish-03-startrack-5ft.png", status: "available", variants: [{ label: "Type 1", ur: "قسم 1", price: 9000 }, { label: "Type 2", ur: "قسم 2", price: 15000 }, { label: "Type 3", ur: "قسم 3", price: 25000 }, { label: "Type 4", ur: "قسم 4", price: 35000 }] },
  // 6 ft: NO brand name anywhere, per the user's explicit instruction.
  { id: "dish-6ft", category: "dish", en: "Satellite Dish (6 foot)", ur: "سیٹلائٹ ڈش (6 فٹ)", desc: "Full HD support, strong & durable, long life, weather resistant, easy installation, 100% original. Three types.", price: null, image: "dish-04-6ft.png", status: "available", variants: [{ label: "Type 1", ur: "قسم 1", price: 38000 }, { label: "Type 2", ur: "قسم 2", price: 45000 }, { label: "Type 3", ur: "قسم 3", price: 55000 }] },
  // ---------------- DiSEqC Switches ----------------
  { id: "diseqc-01", category: "diseqc", en: "Echolink 4x1 Splitter/Switch (Metal)", ur: "ایکولنک 4x1 اسپلٹر/سوئچ (میٹل)", desc: "950-2400MHz frequency, insertion loss 5dB, power passing 500mA max, metal chassis, CE certified, easy installation", price: 300, image: "diseqc-switch-01-echolink-4x1.jpg", status: "available" },
  { id: "diseqc-02", category: "diseqc", en: "Premium X 4x1 Splitter (Waterproof)", ur: "پریمیم ایکس 4x1 اسپلٹر (واٹر پروف)", desc: "Waterproof case, outdoor use, high frequency, strong signals, durable quality, easy installation", price: 500, image: "diseqc-switch-02-premiumx-waterproof.jpg", status: "available" },
  // ---------------- Installation (NO price) ----------------
  { id: "install-01", category: "installation", en: "Satellite Dish Complete Setup / Installation Service", ur: "سیٹلائٹ ڈش مکمل سیٹ اپ / انسٹالیشن سروس", desc: "Complete setup: dish + receiver + LNB + cable. Pakistani & Indian channels (PTV Home, Geo, ARY, HUM, A Plus, 92 News, Dawn News, Samaa, Express, Star Plus, Zee TV, Sony, Colors, DD National, &TV, Aaj Tak, NDTV India and more). HD/Full HD quality, crystal clear picture, no monthly charges, free channel scanning, lifetime support, home service available, fast & reliable installation. Setup and deal vary by channels and customer requirements.", price: null, image: "installation-01-complete-setup.png", status: "price_on_contact" },
  // ---------------- Recharge Services (NO prices) ----------------
  { id: "recharge-dishtv", category: "recharge", en: "Dish TV Recharge", ur: "ڈش ٹی وی ریچارج", desc: "Dish TV recharge service, fast & secure, instant recharge, 24/7 support.", price: null, image: "recharge-01-all-services.png", status: "price_on_contact" },
);
