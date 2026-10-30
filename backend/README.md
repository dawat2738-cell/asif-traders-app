# Asif Traders — Real Shop App Backend (Foundation)

Portable, host-agnostic backend for the real multi-user shop app. **Not a
Muse artifact.** Runs anywhere Node.js 22.5+ runs. Zero dependencies
(uses Node's built-in `node:sqlite`).

## What it is

- **Public storefront** (`/`) — the real catalog from
  `../products-catalog.md`: 43 available products, 19 Coming Soon
  placeholders (unorderable), 7 price-on-contact services. Bilingual
  (Urdu + English shown together), dark navy + gold theme, big
  photo-dominant cards, shop banner + owner portrait header, Islamic
  opening (Bismillah, then As-Salatu was-Salamu Alaika Ya Rasool Allah).
- **Customer login** — FREE design (default): phone number only, **no
  SMS OTP, no SMS sent, no code issued**. Verification happens when the
  seller confirms the order by phone/WhatsApp call before dispatch, and
  no order is dispatched without advance payment. The OTP provider
  interface (`src/sms.js`) stays intact but is config-flagged OFF
  (`SMS_OTP_ENABLED` must be `"true"` to enable it, for a later paid-SMS
  stage only).
- **Seller dashboard** (`/seller`) — incoming orders, confirm, tracking
  (placed → confirmed → dispatched → delivered), review moderation
  (hide/show/delete), seller-only settings, chatbot forwards inbox.
- **Server-side privacy** — a customer can only ever see their own
  orders/bills/history (other customers' orders return 404); public stats
  are counts only, never prices or totals; the seller's private advance
  decision is never sent to customers.
- **Policy enforcement in code** — Lahore: delivery Rs 500 minimum,
  Rs 1000 advance, rest on delivery. Out-of-Lahore: charges confirmed on
  the spot (Leopard mostly, or TCS), full payment in advance, and the
  bill **never** shows an Rs 500 figure. Installation: part advance,
  rest after installation. IPTV/recharge: advance only, IPTV trial FREE.
  Installation and recharge services show **Price on Contact** — no price
  is ever invented. No public azala, replacement, cancellation, or refund
  promise exists anywhere; those decisions stay private and seller-only,
  and the scripted chatbot only forwards such questions to the seller.
- **PWA / Add to Home Screen (FREE design)** — manifest, service worker
  (caches the app shell only, never API data), and mobile-web-app meta
  tags, so the public link opened in Chrome can be added to the phone's
  home screen and opens full-screen, app-like — with NO Play Store and
  NO download. QR code opens the public link; the customer then adds it
  to the home screen from Chrome. Icons come from the shop profile
  picture; no new branding is invented.
- **Payment methods by name only** (JazzCash, Easypaisa, U Paisa). No
  account number is invented or hardcoded anywhere; the seller adds real
  numbers in dashboard Settings, and only then do they appear at checkout.
- **Social links** start empty, for the seller to add later.

## Run locally

```bash
cd backend
node src/server.js
# Storefront: http://127.0.0.1:3000/
# Seller:     http://127.0.0.1:3000/seller
```

Environment variables (all optional; see `src/config.js`):

| Variable | Default | Meaning |
|---|---|---|
| `PORT` / `HOST` | `3000` / `127.0.0.1` | Listen address (`HOST=0.0.0.0` on a host) |
| `DB_PATH` | `backend/data/shop.db` | SQLite file (ephemeral on free tiers — see DEPLOY.md) |
| `IMAGES_DIR` | `../products` | Product pictures folder |
| `BANNER_PATH` / `PROFILE_PATH` | goal folder files | Banner / profile pictures |
| `SMS_OTP_ENABLED` | off (FREE design) | `"true"` enables phone+OTP login (paid SMS stage only) |
| `SMS_PROVIDER` | `stub` | `stub` (sends nothing) or `http` (only used when OTP is enabled) |
| `SMS_API_URL` / `SMS_API_KEY` | — | Required for `http` provider; server refuses to start without both |
| `SMS_SENDER_ID` | `AsifTraders` | Sender name shown on SMS |
| `TEST_MODE` | off | `1` enables only the `/__test__/last-otp` endpoint used by `verify.js`. **Never enable in production.** |

First run: open `/seller` and set the seller password. **There is no
default password** — the setup form refuses to run twice, and login
before setup is rejected.

## Verify

```bash
node verify.js       # OTP mode (SMS_OTP_ENABLED=true): original 48 checks
node verify-free.js  # FREE design (OTP off by default): PWA + phone-only
                     # login + policy/privacy rules still holding
# Each boots the server on a throwaway DB and runs HTTP assertions.
# Exits 0 on success.
```

To reseed after editing `src/seed-data.js`, delete `data/shop.db`
(products are inserted with `INSERT OR IGNORE`, so seller price edits
survive restarts and are not overwritten by reseeding).

## Project layout

```
backend/
  package.json          # zero dependencies, node >= 22.5
  Procfile              # free-host process file (web: node src/server.js)
  render.yaml           # free-tier host blueprint (Render free web service)
  Dockerfile            # generic container image (alternative host path)
  .env.example          # documented environment variables (copy to .env)
  public/
    manifest.webmanifest  # PWA manifest (Asif Traders, navy + gold)
    sw.js                 # service worker: caches the shell only, never API
    icons/icon-192.png    # app icon 192px (from shop profile picture)
    icons/icon-512.png    # app icon 512px (from shop profile picture)
  src/
    config.js           # env config; no secrets hardcoded
    seed-data.js        # catalog transcribed from products-catalog.md
    db.js               # SQLite schema + seeding + public views
    sms.js              # pluggable SMS provider interface (stub + http)
    auth.js             # phone-only login (FREE) / phone+OTP / seller password, sessions
    billing.js          # delivery/advance policy (single source of truth)
    chatbot.js          # scripted bilingual bot + seller-only forwarding
    views.js            # storefront + seller dashboard HTML (PWA meta, login modes)
    server.js           # HTTP routing + API + privacy enforcement + PWA routes
  verify.js             # end-to-end test suite, OTP mode (48 checks)
  verify-free.js        # FREE-design + PWA test suite
  DEPLOY.md             # FREE-design deployment steps + what is still needed
```

## What is NOT real yet

See `DEPLOY.md`. In short: no real SMS is sent, there is no public
link, no real push notifications, and no payment is processed in-app
(customers pay through their own JazzCash/Easypaisa/U Paisa apps using
the numbers the seller adds). This foundation is for local testing and
for the deployment step that follows.
