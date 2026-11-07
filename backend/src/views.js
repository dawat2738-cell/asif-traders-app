// Server-rendered HTML views. Bilingual (Urdu + English shown together),
// dark navy + gold theme, big photo-dominant product cards.
// No public azala / replacement / cancellation / refund promise is rendered
// anywhere here. Customer bills show only that customer's own data.
// Redeploy trigger 2026-10-31: chat/cart panels start closed (auto-deploy check).
// Redeploy retry 2026-10-31: auto-deploy retry after port timeout (no code change).
import { shopPublic } from "./config.js";

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

const CSS = `
*{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#070d1f;color:#f5f1e6}
a{color:#ffd75e} header.hero{position:relative}
.banner{width:100%;height:230px;object-fit:cover;display:block;background:#0d1b3a}
.profile{position:absolute;left:20px;bottom:-38px;width:96px;height:96px;border-radius:50%;object-fit:cover;border:4px solid #f5c542;background:#0d1b3a}
.wrap{max-width:1100px;margin:0 auto;padding:0 16px}
.hero-text{padding:52px 0 8px 132px}
.hero-text h1{margin:0;color:#ffd75e;font-size:32px}
.hero-text p{margin:4px 0;color:#d7dbe8}
.badge{display:inline-block;background:#1a2c5e;border:1px solid #f5c542;color:#ffe89a;padding:4px 10px;border-radius:20px;margin:3px;font-size:13px}
.islamic{text-align:center;padding:18px 10px 4px;color:#ffe89a;font-size:18px}
.islamic small{display:block;color:#c9d2ea;font-size:13px}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}
.toolbar input,.toolbar select{flex:1;min-width:180px;padding:10px;border-radius:10px;border:1px solid #33456e;background:#0d1b3a;color:#fff}
button,.btn{background:#f5c542;color:#131313;border:0;padding:10px 16px;border-radius:10px;font-weight:700;cursor:pointer}
button:disabled{opacity:.45;cursor:not-allowed}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{background:#0f1e3d;border:1px solid #24365f;border-radius:16px;overflow:hidden}
.card img{width:100%;height:260px;object-fit:cover;display:block;background:#16294f}
.card .pad{padding:14px}
.card h3{margin:0 0 6px;color:#ffe89a;font-size:18px}
.card p{margin:4px 0;color:#c9d2ea;font-size:14px}
.price{color:#ffd75e;font-size:20px;font-weight:800}
.soon{background:#16294f;height:260px;display:flex;align-items:center;justify-content:center;color:#ffe89a;font-size:20px;font-weight:800}
.panel{background:#0f1e3d;border:1px solid #24365f;border-radius:16px;padding:16px;margin:16px 0}
.panel h2{color:#ffd75e;margin-top:0}
input,textarea,select{width:100%;padding:10px;margin:6px 0;border-radius:10px;border:1px solid #33456e;background:#0d1b3a;color:#fff}
label{font-size:14px;color:#c9d2ea}
#cart{position:fixed;right:16px;bottom:16px;width:360px;max-width:92vw;background:#0f1e3d;border:2px solid #f5c542;border-radius:16px;padding:14px;z-index:20}
#chat{position:fixed;left:16px;bottom:16px;width:340px;max-width:92vw;background:#0f1e3d;border:2px solid #f5c542;border-radius:16px;padding:12px;z-index:20}
#chatlog{height:180px;overflow:auto;background:#070d1f;border-radius:10px;padding:8px;font-size:14px;white-space:pre-wrap}
#chat{display:none} #chat.open{display:block}
#cart{display:none} #cart.open{display:block}
#chatfab{position:fixed;left:16px;bottom:16px;z-index:20;background:#f5c542;color:#070d1f;border:none;border-radius:999px;padding:12px 18px;font-weight:800;font-size:16px}
#cartfab{position:fixed;right:16px;bottom:16px;z-index:20;background:#f5c542;color:#070d1f;border:none;border-radius:999px;padding:12px 18px;font-weight:800;font-size:16px}
.xbtn{position:absolute;top:8px;right:10px;background:transparent;color:#ffe89a;border:1px solid #f5c542;border-radius:50%;width:30px;height:30px;font-size:16px;line-height:1;padding:0}
.small{font-size:13px;color:#c9d2ea} .gold{color:#ffd75e}
.tabs button{margin-right:6px} .tabpane{display:none} .tabpane.on{display:block}
table{width:100%;border-collapse:collapse;font-size:14px} td,th{border-bottom:1px solid #24365f;padding:8px;text-align:left}
`;

export function storefrontHTML(shop, opts = {}) {
  const s = shopPublic();
  const otpEnabled = !!opts.otpEnabled;
  const loginBox = otpEnabled
    ? "<div class=\"panel\" id=\"loginbox\" style=\"display:none\"><h2>Login with phone + OTP / فون + OTP سے لاگ ان</h2>" +
      "<label>Phone number / فون نمبر (03XX-XXXXXXX)</label><input id=\"phone\" placeholder=\"0300XXXXXXX\">" +
      "<button onclick=\"reqOtp()\">Send OTP / OTP بھیجیں</button>" +
      "<label>OTP code / OTP کوڈ</label><input id=\"otp\" placeholder=\"6-digit code\">" +
      "<button onclick=\"verifyOtp()\">Verify &amp; Login / تصدیق کریں</button>" +
      "<p id=\"loginmsg\" class=\"small\"></p>" +
      "<p class=\"small\">OTP is sent by SMS once a real SMS provider account is configured.</p></div>"
    : "<div class=\"panel\" id=\"loginbox\" style=\"display:none\"><h2>Login with phone number / فون نمبر سے لاگ ان</h2>" +
      "<label>Phone number / فون نمبر (03XX-XXXXXXX)</label><input id=\"phone\" placeholder=\"0300XXXXXXX\">" +
      "<button onclick=\"phoneLogin()\">Login / لاگ ان</button>" +
      "<p id=\"loginmsg\" class=\"small\"></p>" +
      "<p class=\"small\">FREE design: no SMS code is sent and no SMS OTP is used. " +
      "Verification happens when the seller confirms your order by phone/WhatsApp call before dispatch. " +
      "No order is dispatched without advance payment. / " +
      "مفت ڈیزائن: کوئی SMS کوڈ نہیں بھیجا جاتا اور کوئی SMS OTP استعمال نہیں ہوتا۔ " +
      "تصدیق اس وقت ہوتی ہے جب سیلر آرڈر روانہ کرنے سے پہلے فون/واٹس ایپ کال پر آپ کا آرڈر کنفرم کرتا ہے۔ " +
      "ایڈوانس ادائیگی کے بغیر کوئی آرڈر روانہ نہیں ہوتا۔</p></div>";
  return "<!DOCTYPE html><html lang=\"ur\"><head><meta charset=\"utf-8\">" +
  "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
  // PWA: Add to Home Screen — opens full-screen, app-like, from the phone's
  // home screen, without any Play Store install. QR code opens the public
  // link; the customer then adds it to the home screen from Chrome.
  "<link rel=\"manifest\" href=\"/manifest.webmanifest\">" +
  "<meta name=\"theme-color\" content=\"#070d1f\">" +
  "<meta name=\"mobile-web-app-capable\" content=\"yes\">" +
  "<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">" +
  "<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\">" +
  "<meta name=\"apple-mobile-web-app-title\" content=\"Asif Traders\">" +
  "<link rel=\"apple-touch-icon\" href=\"/icons/icon-192.png\">" +
  "<link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"/icons/icon-192.png\">" +
  "<title>" + esc(s.nameEn) + " | " + esc(s.nameUr) + "</title><style>" + CSS + "</style></head><body>" +
  "<div class=\"islamic\">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ<br>الصلاة والسلام عليك يا رسول الله" +
  "<small>Bismillah ir-Rahman ir-Rahim — As-Salatu was-Salamu Alaika Ya Rasool Allah</small></div>" +
  "<header class=\"hero\"><img class=\"banner\" src=\"/img/banner.png\" alt=\"Shop banner\">" +
  "<img class=\"profile\" src=\"/img/profile.png\" alt=\"Shop profile\"></header>" +
  "<div class=\"wrap\"><div class=\"hero-text\"><h1>" + esc(s.nameEn) + " — " + esc(s.nameUr) + "</h1>" +
  "<p>" + esc(s.addressEn) + " / " + esc(s.addressUr) + "</p>" +
  "<p>Phone / WhatsApp: <a href=\"" + s.whatsappLink + "\">" + esc(s.phone) + "</a> · " +
  "<a href=\"" + s.mapLink + "\" target=\"_blank\" rel=\"noopener\">Shop location / شاپ کی لوکیشن</a></p>" +
  "<p>" + esc(s.timings.shopEn) + " / " + esc(s.timings.shopUr) + "<br>" +
  esc(s.timings.onlineEn) + " / " + esc(s.timings.onlineUr) + "<br>" +
  esc(s.timings.installEn) + " / " + esc(s.timings.installUr) + "</p>" +
  "<p>Payment methods / ادائیگی کے طریقے: " + s.paymentMethods.map(esc).join(" · ") + "</p>" +
  "<p id=\"stats\" class=\"small\"></p>" +
  "<p><button onclick=\"document.getElementById('loginbox').style.display='block'\">Login / لاگ ان</button> " +
  "<button onclick=\"showMine()\">My Orders / میرے آرڈرز</button></p></div>" +

  loginBox +

  "<div class=\"toolbar\"><input id=\"q\" placeholder=\"Search products / پروڈکٹ تلاش کریں\" oninput=\"loadProducts()\">" +
  "<select id=\"cat\" onchange=\"loadProducts()\"><option value=\"\">All categories / تمام کیٹیگریز</option></select></div>" +
  "<div class=\"grid\" id=\"grid\"></div>" +

  "<div class=\"panel\"><h2>Latest News / تازہ ترین خبریں</h2><div id=\"news\"></div></div>" +
  "<div class=\"panel\"><h2>Customer Reviews / کسٹمر ریویوز</h2><div id=\"reviews\"></div></div>" +
  "<div class=\"panel\"><h2>Hamara Wada / ہمارا وعدہ</h2>" +
  "<p>• Har parcel ki <b>asal tracking</b> di jayegi — courier delivery par asal tracking ID + courier ki official tracking page ka link; apne rider ki delivery par rider ka naam + phone. / ہر پارسل کی اصل ٹریکنگ دی جائے گی — کوریئر ڈلیوری پر اصل ٹریکنگ آئی ڈی + کوریئر کی آفیشل ٹریکنگ پیج کا لنک؛ اپنے رائیڈر کی ڈلیوری پر رائیڈر کا نام + فون۔</p>" +
  "<p>• <b>Koi jhooti live tracking nahi</b> — status sirf tab badalta hai jab courier parcel scan karta hai. Ye live GPS nahi hai. / کوئی جھوٹی لائیو ٹریکنگ نہیں — اسٹیٹس صرف تب بدلتا ہے جب کوریئر پارسل اسکین کرتا ہے۔ یہ لائیو GPS نہیں ہے۔</p>" +
  "<p>• Delivery ki tareekh sirf <b>andaza</b> hai — 'Estimated delivery' likh kar di jayegi. / ڈلیوری کی تاریخ صرف اندازہ ہے — 'Estimated delivery' لکھ کر دی جائے گی۔</p>" +
  "<p>• Bill mein sab saaf — subtotal, delivery, advance — koi chhupi hui baat nahi. / بل میں سب صاف — سب ٹوٹل، ڈلیوری، ایڈوانس — کوئی چھپی ہوئی بات نہیں۔</p>" +
  "<p>• Jo likha hai, wahi milega. / جو لکھا ہے، وہی ملے گا۔</p></div>" +
  "<div class=\"panel\"><h2>Get the App / ایپ حاصل کریں</h2><p>Scan this QR code to open the shop on your phone, then add it to your home screen from Chrome — no Play Store install needed. / اس QR کوڈ کو اسکین کریں — دکان آپ کے فون پر کھل جائے گی، پھر Chrome سے Add to Home Screen کریں، Play Store کی ضرورت نہیں۔</p><p><img src=\"/img/app-qr.png\" alt=\"App download QR code\" style=\"width:220px;height:220px;background:#fff;padding:10px;border-radius:12px\"></p><p class=\"small\">Shop link / دکان کا لنک: https://asif-traders-app-7f6ad.containers.snapdeploy.app</p></div>" +
  "<div class=\"panel\" id=\"mine\" style=\"display:none\"><h2>My Orders / میرے آرڈرز</h2><div id=\"myorders\"></div></div>" +

  "</div>" + // wrap

  "<div id=\"cart\"><h3 style=\"margin-top:0\">Cart / کارٹ <button class=\"xbtn\" onclick=\"toggleCart(false)\">✕</button></h3><div id=\"cartitems\" class=\"small\"></div>" +
  "<div id=\"payinfo\" class=\"small\"></div>" +
  "<label>Delivery area / ڈلیوری علاقہ</label><select id=\"zone\"><option value=\"lahore\">Within Lahore / لاہور کے اندر</option><option value=\"other\">Outside Lahore — Other City / لاہور سے باہر</option></select>" +
  "<div id=\"bill\" class=\"small\"></div>" +
  "<label>Your name / آپ کا نام</label><input id=\"cname\">" +
  "<label>Delivery address / ڈلیوری پتہ</label><textarea id=\"caddr\" rows=\"2\"></textarea>" +
  "<button onclick=\"checkout()\">Place Order / آرڈر کریں</button><p id=\"ordermsg\" class=\"small\"></p></div>" +

  "<div id=\"chat\"><h3 style=\"margin-top:0\">Shop Assistant / شاپ اسسٹنٹ <button class=\"xbtn\" onclick=\"toggleChat(false)\">✕</button></h3><div id=\"chatlog\"></div>" +
  "<input id=\"chatin\" placeholder=\"Ask something / کچھ پوچھیں\">" +
  "<button onclick=\"sendChat()\">Send / بھیجیں</button></div>" +

  "<button id=\"chatfab\" onclick=\"toggleChat(true)\">💬 Chat / چیٹ</button><button id=\"cartfab\" onclick=\"toggleCart(true)\">🛒 Cart / کارٹ</button>" +
  "<script>" + storefrontJS() + "</script></body></html>";
}

function storefrontJS() {
  return `
var cart = [];
function money(n){ return n === null || n === undefined ? 'Price on Contact / قیمت رابطہ پر' : 'Rs ' + n; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
async function api(p, m, b){
  var r = await fetch(p, {method: m||'GET', headers: {'Content-Type':'application/json'}, body: b ? JSON.stringify(b) : undefined, credentials: 'same-origin'});
  var t = await r.json().catch(function(){ return {}; });
  if(!r.ok) throw new Error(t.error || ('Request failed (' + r.status + ')'));
  return t;
}
async function loadCats(){
  var d = await api('/api/categories');
  var sel = document.getElementById('cat');
  d.categories.forEach(function(c){
    var o = document.createElement('option'); o.value = c.id; o.textContent = c.en + ' / ' + c.ur; sel.appendChild(o);
  });
}
async function loadProducts(){
  var q = document.getElementById('q').value, cat = document.getElementById('cat').value;
  var d = await api('/api/products?q=' + encodeURIComponent(q) + '&category=' + encodeURIComponent(cat));
  var g = document.getElementById('grid'); g.innerHTML = '';
  d.products.forEach(function(p){
    var div = document.createElement('div'); div.className = 'card';
    var img = p.image ? '<img src="' + p.image + '" alt="">' : '<div class="soon">Coming Soon / جلد آ رہا ہے</div>';
    var price = p.status === 'coming_soon' ? '<div class="price">Coming Soon / جلد آ رہا ہے</div>'
      : (p.status === 'price_on_contact' ? '<div class="price">Price on Contact / قیمت رابطہ پر</div>' : '<div class="price">' + money(p.price) + '</div>');
    var vsel = '';
    if(p.variants){
      vsel = '<label>Type / قسم</label><select id="v-' + p.id + '">' + p.variants.map(function(v){ return '<option value="' + esc(v.label) + '">' + esc(v.label) + ' — Rs ' + v.price + '</option>'; }).join('') + '</select>';
    }
    var btn = p.status === 'coming_soon' ? '<button disabled>Coming Soon / جلد آ رہا ہے</button>'
      : '<button onclick="addToCart(\\'' + p.id + '\\')">Add to Cart / کارٹ میں ڈالیں</button>';
    div.innerHTML = img + '<div class="pad"><h3>' + esc(p.nameEn) + ' / ' + esc(p.nameUr) + '</h3><p>' + esc(p.description) + '</p>' + price + vsel + btn + '</div>';
    g.appendChild(div);
  });
}
function addToCart(id){
  fetch('/api/products/' + id).then(function(r){ return r.json(); }).then(function(p){
    var v = null, vs = document.getElementById('v-' + id);
    if(vs) v = vs.value;
    cart.push({ productId: p.id, qty: 1, variant: v });
    renderCart();
  });
}
function renderCart(){
  var box = document.getElementById('cartitems');
  if(!cart.length){ box.innerHTML = 'Cart is empty / کارٹ خالی ہے'; document.getElementById('bill').innerHTML=''; return; }
  box.innerHTML = cart.map(function(it, i){ return (i+1) + '. ' + esc(it.productId) + (it.variant ? ' (' + esc(it.variant) + ')' : '') + ' x' + it.qty + ' <button onclick="cart.splice(' + i + ',1);renderCart();">x</button>'; }).join('<br>');
  previewBill();
}
async function previewBill(){
  try{
    var b = await api('/api/bill/preview', 'POST', { items: cart, zone: document.getElementById('zone').value });
    var html = 'Subtotal / سب ٹوٹل: Rs ' + b.subtotal + '<br>';
    html += b.deliveryFee === null ? 'Delivery / ڈلیوری: ' + esc(b.deliveryNote) + '<br>' : 'Delivery / ڈلیوری: Rs ' + b.deliveryFee + '<br>';
    html += 'Advance due / ایڈوانس: Rs ' + b.advanceDue + '<br>';
    html += 'Total / کل: Rs ' + b.totalDue + '<br><span class="small">' + esc(b.paymentTerms) + '</span>';
    document.getElementById('bill').innerHTML = html;
  }catch(e){ document.getElementById('bill').innerHTML = esc(e.message); }
}
document.getElementById('zone').addEventListener('change', previewBill);
async function reqOtp(){
  try{ await api('/api/auth/request-otp', 'POST', { phone: document.getElementById('phone').value });
    document.getElementById('loginmsg').textContent = 'OTP requested. If a real SMS provider were configured, it would arrive by SMS.'; }
  catch(e){ document.getElementById('loginmsg').textContent = e.message; }
}
async function phoneLogin(){
  try{ var d = await api('/api/auth/phone-login', 'POST', { phone: document.getElementById('phone').value });
    document.getElementById('loginmsg').textContent = 'Logged in / لاگ ان ہو گیا ہے — the seller will confirm your order by phone/WhatsApp call before dispatch.'; }
  catch(e){ document.getElementById('loginmsg').textContent = e.message; }
}
async function verifyOtp(){
  try{ var d = await api('/api/auth/verify-otp', 'POST', { phone: document.getElementById('phone').value, code: document.getElementById('otp').value });
    document.getElementById('loginmsg').textContent = 'Logged in / لاگ ان ہو گیا ہے'; }
  catch(e){ document.getElementById('loginmsg').textContent = e.message; }
}
async function checkout(){
  try{
    var d = await api('/api/orders', 'POST', { items: cart, zone: document.getElementById('zone').value,
      name: document.getElementById('cname').value, address: document.getElementById('caddr').value });
    document.getElementById('ordermsg').textContent = 'السلام علیکم ورحمة الله وبركاته — Thank you! / شکریہ! Order ' + d.orderNo + ' placed. Tracking: ' + d.status;
    cart = []; renderCart(); showMine();
  }catch(e){ document.getElementById('ordermsg').textContent = e.message; }
}
async function showMine(){
  try{
    var d = await api('/api/orders/mine');
    document.getElementById('mine').style.display = 'block';
    document.getElementById('myorders').innerHTML = d.orders.length ? d.orders.map(function(o){
      return '<div class="panel"><b>' + esc(o.order_no) + '</b> — ' + esc(o.status) + ' — Rs ' + o.subtotal +
      '<br><span class="small">' + esc(o.delivery_note) + '</span>' + trackHtml(o) + '</div>';
    }).join('') : 'No orders yet / ابھی کوئی آرڈر نہیں';
  }catch(e){ document.getElementById('myorders').textContent = 'Please login first / پہلے لاگ ان کریں'; document.getElementById('mine').style.display = 'block'; }
}
// Honest tracking: show the real tracking ID + a link to the courier's own
// tracking page — or, for the shop's own rider (who has no courier CN), the
// rider's name + a callable phone number. No fake live tracking, no countdown
// pretending to be live.
var TRACK_URLS = { 'TCS': 'https://www.tcsexpress.com/track', 'Leopards': 'https://pk.leopardscourier.com/tracking', 'PostEx': 'https://postex.pk/tracking', 'Trax': 'https://trax.pk/tracking', 'M&P': 'https://mulphilog.com' };
function trackHtml(o){
  if(o.courier === 'Own Rider' && (o.rider_name || o.rider_phone)){
    var parts = [];
    if(o.rider_name) parts.push('<span class="gold">Rider / رائیڈر: ' + esc(o.rider_name) + '</span>');
    if(o.rider_phone) parts.push('<a href="tel:' + esc(String(o.rider_phone).replace(/[^0-9+]/g, '')) + '">' + esc(o.rider_phone) + '</a>');
    return '<br>' + parts.join(' ') +
    '<br><span class="small">Rider se rabta karein — call karein; ye live GPS nahi hai. / رائیڈر سے رابطہ کریں — کال کریں؛ یہ لائیو GPS نہیں ہے۔</span>';
  }
  if(o.tracking_id){
    var u = TRACK_URLS[o.courier] || '';
    return '<br><span class="gold">Tracking ID / ٹریکنگ آئی ڈی: ' + esc(o.tracking_id) + '</span>' +
    (o.courier ? ' (' + esc(o.courier) + ')' : '') +
    (u ? ' <a href="' + u + '" target="_blank" rel="noopener">Track on ' + esc(o.courier) + ' / ٹریک کریں</a>' : '') +
    '<br><span class="small">Status courier ki website par scan hone par badalta hai — ye live GPS nahi hai. / اسٹیٹس کوریئر کی ویب سائٹ پر اسکین ہونے پر بدلتا ہے — یہ لائیو GPS نہیں ہے۔</span>';
  }
  return '<br><span class="small">Tracking ID dispatch ke baad di jayegi. / ٹریکنگ آئی ڈی روانگی کے بعد دی جائے گی۔</span>';
}
async function loadNews(){
  var d = await api('/api/announcements');
  document.getElementById('news').innerHTML = d.announcements.length ? d.announcements.map(function(a){
    return '<p><b>' + esc(a.title_en) + ' / ' + esc(a.title_ur) + '</b><br>' + esc(a.body) + '</p>';
  }).join('') : '<p class="small">No announcements yet / ابھی کوئی خبر نہیں</p>';
}
async function loadReviews(){
  var d = await api('/api/reviews');
  document.getElementById('reviews').innerHTML = '<p>Average rating (visible reviews only): ' + (d.average === null ? '—' : d.average) + ' / ' + d.count + ' reviews</p>' +
    d.reviews.map(function(r){ return '<p>' + '★'.repeat(r.rating) + ' — ' + esc(r.body) + '</p>'; }).join('');
}
async function loadStats(){
  var d = await api('/api/stats');
  document.getElementById('stats').textContent = 'Products: ' + d.products + ' · Reviews: ' + d.reviews + ' · Orders: ' + d.orders + ' · Items delivered: ' + d.itemsSold;
}
async function loadPayInfo(){
  try{
    var d = await api('/api/payment-info');
    document.getElementById('payinfo').innerHTML = 'Payment / ادائیگی: ' + d.methods.map(function(m){
      return esc(m.method) + (m.number ? ' — ' + esc(m.number) : ' (number added by seller)');
    }).join(' · ');
  }catch(e){}
}
function toggleChat(open){ var p=document.getElementById('chat'); if(!p) return; p.classList.toggle('open', open); var f=document.getElementById('chatfab'); if(f) f.style.display = open ? 'none' : 'block'; }
function toggleCart(open){ var p=document.getElementById('cart'); if(!p) return; p.classList.toggle('open', open); var f=document.getElementById('cartfab'); if(f) f.style.display = open ? 'none' : 'block'; }
async function sendChat(){
  var inp = document.getElementById('chatin'); if(!inp.value) return;
  var log = document.getElementById('chatlog');
  log.textContent += '\\nYou: ' + inp.value;
  try{ var d = await api('/api/chat', 'POST', { text: inp.value }); log.textContent += '\\nAssistant: ' + d.reply; }
  catch(e){ log.textContent += '\\nError: ' + e.message; }
  inp.value = ''; log.scrollTop = log.scrollHeight;
}
loadCats(); loadProducts(); loadNews(); loadReviews(); loadStats(); loadPayInfo();
// PWA: register the service worker so Add to Home Screen opens the app shell
// full-screen and app-like. Registration failure must never break the shop.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function(){});
}
`;
}

export function sellerHTML() {
  return "<!DOCTYPE html><html lang=\"ur\"><head><meta charset=\"utf-8\">" +
  "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
  "<link rel=\"manifest\" href=\"/manifest.webmanifest\">" +
  "<meta name=\"theme-color\" content=\"#070d1f\">" +
  "<meta name=\"mobile-web-app-capable\" content=\"yes\">" +
  "<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">" +
  "<link rel=\"apple-touch-icon\" href=\"/icons/icon-192.png\">" +
  "<title>Seller Dashboard / سیلر ڈیش بورڈ — Asif Traders</title><style>" + CSS + "</style></head><body>" +
  "<div class=\"wrap\"><h1 class=\"gold\">Seller Dashboard / سیلر ڈیش بورڈ</h1>" +
  "<p class=\"small\">Seller only. No default password exists: the seller must set a password on first use, and can change it in Settings. " +
  "Advance decisions and customer bills shown here are private to the seller.</p>" +
  "<div class=\"panel\" id=\"setupbox\"><h2>First-time setup / پہلی دفعہ سیٹ اپ</h2>" +
  "<p class=\"small\" id=\"setupnote\">Checking whether a seller password already exists…</p>" +
  "<label>Set seller password / سیلر پاس ورڈ بنائیں (at least 6 characters)</label><input type=\"password\" id=\"newpass\">" +
  "<button onclick=\"setupSeller()\">Set Password / پاس ورڈ بنائیں</button></div>" +
  "<div class=\"panel\"><h2>Seller login / سیلر لاگ ان</h2>" +
  "<label>Password / پاس ورڈ</label><input type=\"password\" id=\"pass\">" +
  "<button onclick=\"sellerLogin()\">Login / لاگ ان</button> <button onclick=\"sellerLogout()\">Logout / لاگ آؤٹ</button>" +
  "<p id=\"loginmsg\" class=\"small\"></p></div>" +
  "<div id=\"dash\" style=\"display:none\">" +
  "<div class=\"tabs\"><button onclick=\"tab('orders')\">Orders / آرڈرز</button>" +
  "<button onclick=\"tab('reviews')\">Reviews / ریویوز</button>" +
  "<button onclick=\"tab('products')\">Products / پروڈکٹس</button>" +
  "<button onclick=\"tab('news')\">News / خبریں</button>" +
  "<button onclick=\"tab('forwards')\">Chat forwards / چیٹ سوالات</button>" +
  "<button onclick=\"tab('settings')\">Settings / سیٹنگز</button></div>" +
  "<div class=\"panel tabpane on\" id=\"pane-orders\"><h2>Orders / آرڈرز</h2><div id=\"orders\"></div></div>" +
  "<div class=\"panel tabpane\" id=\"pane-reviews\"><h2>Review moderation / ریویو کی نگرانی</h2><div id=\"revlist\"></div></div>" +
  "<div class=\"panel tabpane\" id=\"pane-products\"><h2>Products / پروڈکٹس</h2><div id=\"prodlist\"></div></div>" +
  "<div class=\"panel tabpane\" id=\"pane-news\"><h2>Post announcement / خبر پوسٹ کریں</h2>" +
  "<input id=\"newstitle\" placeholder=\"Title (English)\"><input id=\"newstitleur\" placeholder=\"عنوان (اردو)\">" +
  "<textarea id=\"newsbody\" rows=\"3\" placeholder=\"Message\"></textarea><button onclick=\"postNews()\">Post / پوسٹ کریں</button><div id=\"newslist\"></div></div>" +
  "<div class=\"panel tabpane\" id=\"pane-forwards\"><h2>Questions forwarded by the chatbot / چیٹ بوٹ کے بھیجے ہوئے سوالات</h2><div id=\"fwdlist\"></div></div>" +
  "<div class=\"panel tabpane\" id=\"pane-settings\"><h2>Settings / سیٹنگز</h2>" +
  "<label>Payment numbers (seller only — shown to customers at checkout) / ادائیگی نمبرز</label>" +
  "<input id=\"pay-jazz\" placeholder=\"JazzCash number\"><input id=\"pay-easy\" placeholder=\"Easypaisa number\"><input id=\"pay-upaisa\" placeholder=\"U Paisa number\">" +
  "<label>Social links (leave empty until ready) / سوشل لنکس</label>" +
  "<input id=\"soc-fb\" placeholder=\"Facebook link\"><input id=\"soc-ig\" placeholder=\"Instagram link\">" +
  "<input id=\"soc-tt\" placeholder=\"TikTok link\"><input id=\"soc-yt\" placeholder=\"YouTube link\">" +
  "<button onclick=\"saveSettings()\">Save Settings / سیٹنگز محفوظ کریں</button>" +
  "<h3>Change password / پاس ورڈ تبدیل کریں</h3>" +
  "<input type=\"password\" id=\"oldpass\" placeholder=\"Old password\"><input type=\"password\" id=\"newpass2\" placeholder=\"New password\">" +
  "<button onclick=\"changePass()\">Change Password / تبدیل کریں</button><p id=\"setmsg\" class=\"small\"></p></div>" +
  "</div></div><script>" + sellerJS() + "</script></body></html>";
}

function sellerJS() {
  return `
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
async function api(p, m, b){
  var r = await fetch(p, {method: m||'GET', headers: {'Content-Type':'application/json'}, body: b ? JSON.stringify(b) : undefined, credentials: 'same-origin'});
  var t = await r.json().catch(function(){ return {}; });
  if(!r.ok) throw new Error(t.error || ('Request failed (' + r.status + ')'));
  return t;
}
function tab(name){
  document.querySelectorAll('.tabpane').forEach(function(el){ el.classList.remove('on'); });
  document.getElementById('pane-' + name).classList.add('on');
  if(name === 'orders') loadOrders();
  if(name === 'reviews') loadReviews();
  if(name === 'products') loadProducts();
  if(name === 'forwards') loadForwards();
  if(name === 'settings') loadSettings();
}
async function checkSetup(){
  try{ var d = await api('/api/seller/exists');
    document.getElementById('setupnote').textContent = d.exists ? 'Seller password already set. Use login below. / سیلر پاس ورڈ پہلے سے بنا ہوا ہے۔ نیچے لاگ ان کریں۔'
      : 'No seller password yet. Set one now — there is no default password. / ابھی کوئی سیلر پاس ورڈ نہیں ہے۔ ابھی بنائیں — کوئی ڈیفالٹ پاس ورڈ نہیں ہے۔';
  }catch(e){ document.getElementById('setupnote').textContent = e.message; }
}
async function setupSeller(){
  try{ await api('/api/seller/setup', 'POST', { password: document.getElementById('newpass').value, phone: 'seller' });
    alert('Seller password set / سیلر پاس ورڈ بن گیا ہے'); checkSetup(); }
  catch(e){ alert(e.message); }
}
async function sellerLogin(){
  try{ await api('/api/seller/login', 'POST', { password: document.getElementById('pass').value });
    document.getElementById('loginmsg').textContent = 'Logged in / لاگ ان ہو گیا ہے';
    document.getElementById('dash').style.display = 'block'; loadOrders(); }
  catch(e){ document.getElementById('loginmsg').textContent = e.message; }
}
async function sellerLogout(){ await api('/api/seller/logout', 'POST', {}); document.getElementById('dash').style.display = 'none'; }
async function loadOrders(){
  try{
    var d = await api('/api/seller/orders');
    document.getElementById('orders').innerHTML = d.orders.length ? d.orders.map(function(o){
      return '<div class="panel"><b>' + esc(o.order_no) + '</b> — ' + esc(o.customer_name) + ' (' + esc(o.customer_phone) + ') — ' + esc(o.status) +
      '<br>Items: ' + o.items.map(function(i){ return esc(i.nameEn) + ' x' + i.qty; }).join(', ') +
      '<br>Subtotal Rs ' + o.subtotal + ' · Delivery: ' + (o.delivery_fee === null ? esc(o.delivery_note) : 'Rs ' + o.delivery_fee) +
      ' · Advance due Rs ' + o.advance_due + ' · Total Rs ' + o.total_due +
      '<br><span class="small">' + esc(o.payment_terms) + '</span>' +
      '<br><button onclick="setStatus(' + o.id + ',\\'confirmed\\')">Confirm / کنفرم</button> ' +
      '<button onclick="setStatus(' + o.id + ',\\'dispatched\\')">Dispatch / روانہ</button> ' +
      '<button onclick="setStatus(' + o.id + ',\\'delivered\\')">Deliver / ڈلیور</button> ' +
      '<button onclick="setStatus(' + o.id + ',\\'cancelled\\')">Cancel / کینسل</button>' +
      '<br><label>Advance decision (PRIVATE — seller only, never shown to the customer) / ایڈوانس فیصلہ (صرف سیلر کے لیے)</label>' +
      '<input id="adv-' + o.id + '" value="' + esc(o.advance_decision || '') + '" placeholder="e.g. adjusted / forfeited / refunded">' +
      '<button onclick="saveAdv(' + o.id + ')">Save / محفوظ کریں</button>' +
      '<br><label>Courier / rider tracking (seller only — customer sees the real tracking ID + courier link, or the rider\'s name + phone) / کوریئر / رائیڈر ٹریکنگ</label>' +
      '<select id="cour-' + o.id + '" onchange="toggleRider(' + o.id + ')"><option value="">No courier / کوئی نہیں</option>' +
      [['TCS','TCS'],['Leopards','Leopards'],['PostEx','PostEx'],['Trax','Trax'],['M&P','M&P'],['Own Rider','Own Rider / اپنا رائیڈر']].map(function(p){ return '<option value="' + p[0] + '"' + (o.courier === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select>' +
      '<span id="trk-wrap-' + o.id + '"><input id="trk-' + o.id + '" value="' + esc(o.tracking_id || '') + '" placeholder="Tracking ID / CN"></span>' +
      '<span id="rider-wrap-' + o.id + '" style="display:none"><input id="rider-name-' + o.id + '" value="' + esc(o.rider_name || '') + '" placeholder="Rider name / رائیڈر کا نام"><input id="rider-phone-' + o.id + '" value="' + esc(o.rider_phone || '') + '" placeholder="Rider phone / رائیڈر کا فون"></span>' +
      '<button onclick="saveTracking(' + o.id + ')">Save tracking / ٹریکنگ محفوظ کریں</button>' +
      '<br><label>Message to customer (Salaam is added automatically) / کسٹمر کو پیغام</label>' +
      '<input id="msg-' + o.id + '" placeholder="Message">' +
      '<button onclick="sendMsg(' + o.id + ')">Send / بھیجیں</button></div>';
    }).join('') : 'No orders yet / ابھی کوئی آرڈر نہیں';
    d.orders.forEach(function(o){ toggleRider(o.id); });
  }catch(e){ document.getElementById('orders').textContent = 'Please login first / پہلے لاگ ان کریں'; }
}
async function setStatus(id, status){ try{ await api('/api/seller/orders/' + id + '/status', 'POST', { status: status }); loadOrders(); }catch(e){ alert(e.message); } }
async function saveAdv(id){
  try{ await api('/api/seller/orders/' + id + '/advance', 'POST', { decision: document.getElementById('adv-' + id).value }); alert('Saved / محفوظ ہو گیا'); }
  catch(e){ alert(e.message); }
}
function toggleRider(id){
  var sel = document.getElementById('cour-' + id);
  var isRider = sel && sel.value === 'Own Rider';
  var rw = document.getElementById('rider-wrap-' + id), tw = document.getElementById('trk-wrap-' + id);
  if(rw) rw.style.display = isRider ? 'block' : 'none';
  if(tw) tw.style.display = isRider ? 'none' : 'block';
}
async function saveTracking(id){
  try{ await api('/api/seller/orders/' + id + '/tracking', 'POST', { courier: document.getElementById('cour-' + id).value, tracking_id: document.getElementById('trk-' + id).value, rider_name: document.getElementById('rider-name-' + id).value, rider_phone: document.getElementById('rider-phone-' + id).value }); alert('Tracking saved / ٹریکنگ محفوظ ہو گئی'); loadOrders(); }
  catch(e){ alert(e.message); }
}
async function sendMsg(id){
  try{ await api('/api/seller/orders/' + id + '/message', 'POST', { body: document.getElementById('msg-' + id).value }); alert('Sent / بھیج دیا گیا'); }
  catch(e){ alert(e.message); }
}
async function loadReviews(){
  try{
    var d = await api('/api/seller/reviews');
    document.getElementById('revlist').innerHTML = d.reviews.map(function(r){
      return '<p>' + '★'.repeat(r.rating) + ' — ' + esc(r.body) + ' [' + (r.visible ? 'visible' : 'hidden') + '] ' +
      '<button onclick="modRev(' + r.id + ',\\'hide\\')">Hide / چھپائیں</button> ' +
      '<button onclick="modRev(' + r.id + ',\\'show\\')">Show / دکھائیں</button> ' +
      '<button onclick="modRev(' + r.id + ',\\'delete\\')">Delete / ڈیلیٹ کریں</button></p>';
    }).join('') || 'No reviews / کوئی ریویو نہیں';
  }catch(e){ document.getElementById('revlist').textContent = e.message; }
}
async function modRev(id, action){ try{ await api('/api/seller/reviews/' + id + '/' + action, 'POST', {}); loadReviews(); }catch(e){ alert(e.message); } }
async function loadProducts(){
  try{
    var d = await api('/api/products?all=1');
    document.getElementById('prodlist').innerHTML = d.products.map(function(p){
      return '<p>' + esc(p.nameEn) + ' — ' + (p.price === null ? (p.status === 'price_on_contact' ? 'Price on Contact' : 'Coming Soon') : 'Rs ' + p.price) +
      ' [' + p.status + '] <button onclick="editProd(\\'' + p.id + '\\')">Edit price/status</button></p>';
    }).join('');
  }catch(e){ document.getElementById('prodlist').textContent = e.message; }
}
async function editProd(id){
  var price = prompt('New price in Rs (leave empty for Price on Contact / Coming Soon items):');
  var status = prompt('Status: available, coming_soon, or price_on_contact', 'available');
  try{ await api('/api/seller/products/' + id, 'POST', { price: price === '' ? null : Number(price), status: status }); loadProducts(); }
  catch(e){ alert(e.message); }
}
async function postNews(){
  try{ await api('/api/seller/announcements', 'POST', { titleEn: document.getElementById('newstitle').value, titleUr: document.getElementById('newstitleur').value, body: document.getElementById('newsbody').value }); alert('Posted / پوسٹ ہو گئی'); }
  catch(e){ alert(e.message); }
}
async function loadForwards(){
  try{
    var d = await api('/api/seller/forwards');
    document.getElementById('fwdlist').innerHTML = d.forwards.map(function(f){
      return '<p>[' + esc(f.topic) + '] ' + esc(f.body) + ' <button onclick="handleFwd(' + f.id + ')">Mark handled</button></p>';
    }).join('') || 'No forwarded questions / کوئی سوال نہیں';
  }catch(e){ document.getElementById('fwdlist').textContent = e.message; }
}
async function handleFwd(id){ try{ await api('/api/seller/forwards/' + id + '/handle', 'POST', {}); loadForwards(); }catch(e){ alert(e.message); } }
async function loadSettings(){
  try{
    var d = await api('/api/seller/settings');
    document.getElementById('pay-jazz').value = d.payment_numbers.JazzCash || '';
    document.getElementById('pay-easy').value = d.payment_numbers.Easypaisa || '';
    document.getElementById('pay-upaisa').value = d.payment_numbers['U Paisa'] || '';
    document.getElementById('soc-fb').value = d.social_links.facebook || '';
    document.getElementById('soc-ig').value = d.social_links.instagram || '';
    document.getElementById('soc-tt').value = d.social_links.tiktok || '';
    document.getElementById('soc-yt').value = d.social_links.youtube || '';
  }catch(e){ document.getElementById('setmsg').textContent = e.message; }
}
async function saveSettings(){
  try{
    await api('/api/seller/settings', 'POST', {
      payment_numbers: { JazzCash: document.getElementById('pay-jazz').value, Easypaisa: document.getElementById('pay-easy').value, 'U Paisa': document.getElementById('pay-upaisa').value },
      social_links: { facebook: document.getElementById('soc-fb').value, instagram: document.getElementById('soc-ig').value, tiktok: document.getElementById('soc-tt').value, youtube: document.getElementById('soc-yt').value }
    });
    document.getElementById('setmsg').textContent = 'Saved / محفوظ ہو گیا';
  }catch(e){ document.getElementById('setmsg').textContent = e.message; }
}
async function changePass(){
  try{ await api('/api/seller/change-password', 'POST', { oldPassword: document.getElementById('oldpass').value, newPassword: document.getElementById('newpass2').value });
    document.getElementById('setmsg').textContent = 'Password changed / پاس ورڈ بدل گیا'; }
  catch(e){ document.getElementById('setmsg').textContent = e.message; }
}
checkSetup();
`;
}
