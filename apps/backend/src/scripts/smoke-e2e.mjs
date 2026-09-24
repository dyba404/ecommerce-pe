// smoke-e2e.mjs — smoke E2E sin claves de pago: cart → item → envío PE →
// payment con pp_system_default (manual) → orden. Prueba el flujo completo del
// MVP sin Culqi/Stripe (el pago real se prueba en T8 con claves test).
// Correr con el backend vivo en :9000:
//   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=... node src/scripts/smoke-e2e.mjs
const BACKEND = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

if (!PK) {
  console.error("Falta NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (exportarla antes de correr)");
  process.exit(1);
}

const storeHeaders = {
  "x-publishable-api-key": PK,
  "Content-Type": "application/json",
};

async function main() {
  // 1. Producto TEST
  const prodRes = await fetch(`${BACKEND}/store/products?handle=test-polo`, { headers: storeHeaders });
  const { products } = await prodRes.json();
  if (!products?.length) throw new Error("Producto TEST no encontrado");
  const variant = products[0].variants[0];
  console.log("1. producto:", products[0].title, "| variante:", variant.sku);

  // 2. Región PE
  const regionsRes = await fetch(`${BACKEND}/store/regions`, { headers: storeHeaders });
  const { regions } = await regionsRes.json();
  const pe = regions.find((r) => r.currency_code === "pen");
  if (!pe) throw new Error("Región PE no encontrada");
  console.log("2. región:", pe.name, pe.currency_code);

  // 3. Cart
  const cartRes = await fetch(`${BACKEND}/store/carts`, {
    method: "POST",
    headers: storeHeaders,
    body: JSON.stringify({ region_id: pe.id }),
  });
  const { cart } = await cartRes.json();
  if (!cart?.id) throw new Error("No se creó el cart: " + JSON.stringify(await cartRes.text()));
  console.log("3. cart:", cart.id);

  // 4. Line item
  const itemRes = await fetch(`${BACKEND}/store/carts/${cart.id}/line-items`, {
    method: "POST",
    headers: storeHeaders,
    body: JSON.stringify({ variant_id: variant.id, quantity: 1 }),
  });
  const itemJson = await itemRes.json();
  if (!itemJson.cart) throw new Error("Line item falló: " + JSON.stringify(itemJson).slice(0, 300));
  console.log("4. item agregado | subtotal:", JSON.stringify(itemJson.cart.subtotal));

  // 5. Dirección de envío + email
  const addrRes = await fetch(`${BACKEND}/store/carts/${cart.id}`, {
    method: "POST",
    headers: storeHeaders,
    body: JSON.stringify({
      email: "e2e@test.local",
      shipping_address: {
        first_name: "E2E",
        last_name: "Test",
        address_1: "Av. Test 123",
        city: "Lima",
        postal_code: "15001",
        country_code: "pe",
        phone: "+51900000001",
      },
    }),
  });
  const addrJson = await addrRes.json();
  if (!addrJson.cart) throw new Error("Dirección falló: " + JSON.stringify(addrJson).slice(0, 300));
  console.log("5. dirección OK");

  // 6. Shipping options + método
  const optRes = await fetch(`${BACKEND}/store/shipping-options?cart_id=${cart.id}`, { headers: storeHeaders });
  const { shipping_options } = await optRes.json();
  if (!shipping_options?.length) throw new Error("Sin shipping options para el cart");
  const lima = shipping_options.find((o) => o.name === "Envío Lima") ?? shipping_options[0];
  const methodRes = await fetch(`${BACKEND}/store/carts/${cart.id}/shipping-methods`, {
    method: "POST",
    headers: storeHeaders,
    body: JSON.stringify({ option_id: lima.id }),
  });
  const methodJson = await methodRes.json();
  if (!methodJson.cart) throw new Error("Shipping method falló: " + JSON.stringify(methodJson).slice(0, 300));
  console.log("6. envío:", lima.name, "| amount:", JSON.stringify(lima.amount));

  // 7. Payment collection + sesión con pp_system_default (manual, sin claves)
  const pcRes = await fetch(`${BACKEND}/store/payment-collections`, {
    method: "POST",
    headers: storeHeaders,
    body: JSON.stringify({ cart_id: cart.id }),
  });
  const pcJson = await pcRes.json();
  if (!pcJson.payment_collection) throw new Error("Payment collection falló: " + JSON.stringify(pcJson).slice(0, 300));
  const sessionRes = await fetch(`${BACKEND}/store/payment-collections/${pcJson.payment_collection.id}/payment-sessions`, {
    method: "POST",
    headers: storeHeaders,
    body: JSON.stringify({ provider_id: "pp_system_default" }),
  });
  const sessionJson = await sessionRes.json();
  if (!sessionJson.payment_collection) throw new Error("Payment session falló: " + JSON.stringify(sessionJson).slice(0, 300));
  console.log("7. payment session (pp_system_default) OK");

  // 8. Completar → orden
  const completeRes = await fetch(`${BACKEND}/store/carts/${cart.id}/complete`, {
    method: "POST",
    headers: storeHeaders,
  });
  const completeJson = await completeRes.json();
  if (completeJson.type !== "order") throw new Error("Complete falló: " + JSON.stringify(completeJson).slice(0, 300));
  console.log("8. ORDEN CREADA:", completeJson.order.id, "| total:", JSON.stringify(completeJson.order.total), completeJson.order.currency_code);
  console.log("SMOKE E2E OK — orden visible en Admin (localhost:9000/app)");
}

main().catch((e) => {
  console.error("SMOKE FALLÓ:", e.message);
  process.exit(1);
});
