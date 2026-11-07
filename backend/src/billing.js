// Bill computation — the shop's real delivery & payment policy (2026-10-29).
//
// Lahore:      delivery fee Rs 500 (minimum), advance Rs 1000 (or the full
//              bill if it is smaller), rest on delivery.
// Out-of-Lahore: delivery fee is NEVER a number here and NEVER Rs 500.
//              Charges are confirmed on the spot (Leopard mostly, or TCS),
//              full payment is taken in advance, delivery charges are the
//              customer's. The bill shows an on-the-spot note, no amount.
// Installation: part advance, rest after installation at the customer's place.
// IPTV/recharge: advance payment only; IPTV trial FREE.
// Price-on-contact services contribute no invented price to any bill.

export const LAHORE_DELIVERY_MIN = 500;
export const LAHORE_ADVANCE = 1000;

export function resolveItemPrice(product, variantLabel) {
  if (product.status === "coming_soon") return { ok: false, reason: "coming_soon" };
  if (product.status === "price_on_contact") return { ok: true, price: null, priceOnContact: true };
  if (product.variants) {
    const variants = JSON.parse(product.variants);
    const v = variants.find((x) => x.label === variantLabel) || variants[0];
    return { ok: true, price: v.price, variant: v.label };
  }
  return { ok: true, price: product.price, variant: null };
}

// items: [{ product, qty, variantLabel }]
// Returns { lines, subtotal, deliveryFee, deliveryNote, advanceDue, totalDue,
//           paymentTerms, hasPriceOnContact }
export function computeBill(items, deliveryZone, orderKinds) {
  const lines = [];
  let subtotal = 0;
  let hasPriceOnContact = false;
  for (const it of items) {
    const r = resolveItemPrice(it.product, it.variantLabel);
    if (!r.ok) throw Object.assign(new Error(`"${it.product.name_en}" is Coming Soon and cannot be ordered.`), { status: 400 });
    if (r.priceOnContact) hasPriceOnContact = true;
    else subtotal += r.price * it.qty;
    lines.push({
      productId: it.product.id,
      nameEn: it.product.name_en, nameUr: it.product.name_ur,
      variant: r.variant || null, qty: it.qty,
      unitPrice: r.price, lineTotal: r.price === null ? null : r.price * it.qty,
      priceOnContact: !!r.priceOnContact,
    });
  }
  const isServiceOnly = lines.length > 0 && lines.every((l) => l.priceOnContact);
  let deliveryFee = null;
  let deliveryNote;
  let advanceDue;
  let paymentTerms;
  if (deliveryZone === "lahore") {
    deliveryFee = LAHORE_DELIVERY_MIN;
    deliveryNote = "Lahore delivery — minimum Rs 500 / لاہور ڈلیوری — کم سے کم Rs 500";
    const total = subtotal + deliveryFee;
    advanceDue = Math.min(LAHORE_ADVANCE, total);
    paymentTerms = "Rs 1000 advance, rest on delivery / Rs 1000 ایڈوانس، باقی ڈلیوری پر";
  } else {
    // Out-of-Lahore: NO figure here, ever. Not 500, not anything.
    deliveryFee = null;
    deliveryNote = "Confirmed on the spot (Leopard mostly, or TCS) — delivery charges are the customer's / موقع پر بتائے جائیں گے (اکثر Leopard یا TCS) — ڈلیوری چارجز کسٹمر کے ہوں گے";
    advanceDue = subtotal; // full payment in advance (delivery excluded: on the spot)
    paymentTerms = "Full payment in advance; delivery charges confirmed on the spot / مکمل ادائیگی ایڈوانس میں؛ ڈلیوری چارجز موقع پر بتائے جائیں گے";
  }
  if (isServiceOnly) {
    // A service-only order has no delivery fee at all: the amount (and any
    // travel/installation arrangement) is settled with the seller privately.
    deliveryFee = null;
    deliveryNote = "To be settled with the seller / سیلر سے طے ہوگا";
    paymentTerms = "Price on Contact — seller confirms the amount; installation: part advance, rest after installation; Dish TV recharge: advance only / قیمت رابطہ پر — سیلر رقم بتائے گا؛ انسٹالیشن: کچھ ایڈوانس، باقی انسٹالیشن کے بعد؛ ڈش ٹی وی ریچارج: صرف ایڈوانس";
    advanceDue = 0; // seller sets it privately after contact
  }
  const totalDue = subtotal + (deliveryFee || 0);
  return { lines, subtotal, deliveryFee, deliveryNote, advanceDue, totalDue, paymentTerms, hasPriceOnContact };
}
