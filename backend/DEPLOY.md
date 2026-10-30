# DEPLOY.md — FREE-design deployment (no Play Store, no SMS OTP)

This backend is prepared for the **FREE design** the shop owner chose:
**no Play Store, no SMS OTP (it costs money), web app opened via a
public link in Chrome, QR code opens that link, and Add to Home Screen
makes it look and open like an app.** The seller confirms every order
by phone/WhatsApp call (his existing habit) before dispatch, and
advance payment protects against fake orders.

This backend is a **local preparation**. It is NOT deployed, NOT public,
and sends NO real SMS. Nothing in this document should be read as a
claim that any of the items below are already done. **No public link
and no app-download QR exist yet, and none is invented here** — the
real app-download QR can only be made AFTER a real public link exists.

## How QR → link → Chrome → Add to Home Screen works for customers

1. The shop's public link (from step 3 below) is turned into a QR code
   (step 5). The QR code itself is free to generate.
2. A customer scans the QR code with their phone camera. The phone
   opens the link in Chrome (or their default browser). **Nothing is
   downloaded and nothing is installed from a store** — the QR code
   only opens a web page.
3. In Chrome, the customer taps the browser menu → **Add to Home
   Screen**. The shop's icon (from the shop profile picture) appears
   on the phone's home screen.
4. From then on, tapping that icon opens the shop full-screen,
   app-like, with the manifest (`/manifest.webmanifest`), the service
   worker (`/sw.js`, which caches the app shell only — never API data),
   and the mobile-web-app meta tags doing the work. There is no Play
   Store involved at any point.

## Ordered FREE-deployment steps

### Step 1 — The owner signs up for a free hosting account (owner provides)
- The owner creates a **free-tier hosting account with his own email
  address** (for example Render's free web service tier; `render.yaml`
  in this folder is a blueprint for it). The assistant never needs the
  owner's hosting password or credentials, and no money is spent.
- The owner must NOT share hosting credentials with anyone. The
  assistant's part is the code and the configuration in this folder.

### Step 2 — Deploy this code (no new code needed)
- Deploy this `backend/` folder to the free host (via the host's
  dashboard, a connected code repository, or the host's deploy flow).
  The service needs no build step: zero dependencies, plain Node.js.
- Set these environment variables on the host:
  - `HOST=0.0.0.0` (so the host can reach the server)
  - `SMS_OTP_ENABLED=false` (FREE design: SMS OTP stays OFF)
  - `PORT` is set automatically by most free hosts — do not set it
    unless the host asks for it.
  - Leave `TEST_MODE` unset (off). It must never be on in production.
- Copy the shop pictures to the host as well: the `products/` folder,
  `shop-banner.png`, and `shop-profile.png` — or set `IMAGES_DIR`,
  `BANNER_PATH`, and `PROFILE_PATH` to where they live on the host.
  Without them, product pictures, the banner, and the profile picture
  will not load.
- `Procfile` (`web: node src/server.js`) covers hosts that use it;
  `render.yaml` covers Render; `Dockerfile` covers container hosts.
  Pick one path — they all run the same code.

### Step 3 — The host gives a public link (owner provides the link)
- The free host assigns a public link (a free subdomain of the host).
  That link is what customers open. **Until this step, there is no
  public link, and no app-download QR can be made.**
- Open the link in Chrome and check: the storefront loads with the
  real catalog, banner, and profile picture; Add to Home Screen works;
  `/seller` loads.

### Step 4 — Seller first-time setup (seller provides)
- Open `<public-link>/seller` and **set the seller password**. There is
  no default password, and the setup form refuses to run twice.
- In dashboard Settings, the seller adds: payment numbers (JazzCash,
  Easypaisa, U Paisa) and social links (when ready). Payment methods
  show by name only until the seller adds real numbers.
- Seller-side data is never invented by the assistant.

### Step 5 — Make the REAL app-download QR (only now, from the real link)
- Only after step 3, generate a QR code from the **real public link**
  using any free QR generator. That QR code is the app-download QR:
  print it, post it in the shop, or share it wherever customers see it.
- **Never generate or publish an app-download QR before the real
  public link exists.** A QR made from a guessed or placeholder link
  would send customers to the wrong place.

### Step 6 — Customers use it (no Play Store, no install)
- Customer scans the QR → link opens in Chrome → Add to Home Screen →
  app-like icon on the phone. Orders placed in the app reach the
  seller's dashboard; the seller confirms each order by phone/WhatsApp
  call before dispatch, and no order is dispatched without advance
  payment.

## What is already real (in this code)

- Real catalog, prices, policies, banner, and profile picture from
  `../products-catalog.md` and the goal folder's pictures.
- Real server-side rules: per-customer privacy, counts-only public stats,
  Lahore vs out-of-Lahore billing (out-of-Lahore bills never show an
  Rs 500 figure), Price on Contact services, Coming Soon unorderable
  placeholders, seller-only settings, no public azala/replacement/
  cancellation/refund promise.
- Real account mechanics: phone-only login (FREE design), seller
  password setup (no default), hashed passwords, hashed session tokens.
- PWA files: manifest, service worker, 192px and 512px icons made from
  the shop profile picture. No new branding is invented.

## What is NOT real yet (and what each needs)

### 1. SMS delivery (OTP) — DELIBERATELY OFF in the FREE design
- Current state: `SMS_OTP_ENABLED` defaults to **off**. Customers log
  in with their phone number only. No SMS is sent, no code is issued,
  and the OTP endpoints reject requests while the flag is off.
- The OTP provider interface (`src/sms.js`) stays intact for a later
  paid-SMS stage only: set `SMS_OTP_ENABLED=true` plus `SMS_PROVIDER`,
  `SMS_API_URL`, and `SMS_API_KEY` (via environment or a secret
  manager — never in code). A **local Pakistani gateway is the
  expected choice** (typical cost Rs 1–4/SMS at the time this
  foundation was written — confirm the current rate with the provider
  before committing; international providers charge far more per SMS
  to Pakistan).
- FREE-design verification model (stated plainly in the app itself):
  **verification happens when the seller confirms the order by
  phone/WhatsApp call before dispatch, and no order is dispatched
  without advance payment.** This is the seller's existing habit, and
  it is what keeps the FREE design safe without SMS costs.

### 2. Public access — needs hosting + a public link (steps 1–3 above)
- Current state: the server binds to `127.0.0.1` by default and serves
  only on the machine it runs on. There is no public link.
- Needed: a free hosting account (owner's own email) and the deploy
  steps above, behind HTTPS (free hosts provide HTTPS on their links;
  a reverse proxy such as Caddy or nginx is recommended for TLS on a
  VPS path).
- Free-tier limits, stated plainly: **free tiers have limits — a slow
  first open is possible (the service may sleep when idle), monthly
  usage caps apply, and on most free tiers the SQLite file is
  ephemeral, so data can reset when the service restarts or redeploys.**
  This is sufficient for a small shop's scale, but it is NOT a
  free-forever guarantee. If the shop outgrows the free tier, the
  step-up is a persistent disk or an external database (a paid step,
  only when needed).
- Optional: a custom domain (yearly fee, only if wanted). The app works
  on a plain host link without one.
- Security checklist before going public: HTTPS on, `TEST_MODE` off
  (it is off by default), server logs checked, backups of `shop.db`
  arranged where the host allows, and seller password set (there is
  no default).

### 3. Real push notifications — needs a push setup (not included)
- Current state: announcements exist in-app (seller posts, customers see
  them on the storefront when they open the app). Nothing is pushed to
  customers' phones in the background.
- Needed: a push provider and a client that can receive pushes (for
  example Firebase Cloud Messaging plus a PWA push setup). This is a
  separate integration step, not part of this FREE preparation. In the
  FREE design, order updates reach customers via the seller's
  phone/WhatsApp confirmation and the in-app views.

### 4. Play Store — NOT wanted in the FREE design (not started)
- The owner chose NO Play Store. Distribution is via QR code → public
  link → Chrome → Add to Home Screen. If the owner ever changes his
  mind, it needs a Google Play developer account (about $25 one-time,
  at the time of writing), an installable app build, and store review
  (takes days).

### 5. Seller-side data still to be filled in by the seller
- Payment numbers (JazzCash, Easypaisa, U Paisa): shown by name only
  until the seller adds real numbers in dashboard Settings.
- Social links: empty until the seller adds them.
- App-download QR: needs the real public link (step 3) before a real
  QR can be generated (step 5). No QR is invented before then.
- Small catalog confirmations still open with the shop owner (from the
  catalog notes): receiver #4 display name (AERO 1 HD vs F1 mini), LNB
  metal plate price (Rs 550 vs 500), Dahua bullet camera category (WiFi
  vs DVR), dish rods light vs heavy. The code uses the catalog's
  recorded values; update `src/seed-data.js` (then delete `data/shop.db`
  to reseed) when the owner confirms.

## What never happens in this codebase

- No account number, API key, password, or secret is hardcoded anywhere.
  Payment numbers live only in the `settings` table after the seller
  enters them; SMS keys live only in environment variables.
- No public promise of azala, replacement, cancellation, or refund is
  rendered anywhere. Those decisions stay private to the seller
  dashboard (`advance_decision`), and the chatbot only forwards such
  questions to the seller.
- No out-of-Lahore bill ever shows an Rs 500 figure (enforced in
  `src/billing.js` and covered by `verify.js` and `verify-free.js`).
- No app-download QR is generated before a real public link exists.
- No SMS is sent in the FREE design, and no background push
  notification is claimed to exist.
