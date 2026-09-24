# 04. Pagos Perú (Culqi primario, Stripe secundario, sin Mercado Pago)

## Decisión cerrada
| Rol | Pasarela | Por qué |
|---|---|---|
| Primario PE | **Culqi** (Credicorp) | API v2 moderna, docs ES, soporte Lima, onboarding 3-7 días. Tarjeta + **Yape** + PagoEfectivo + Cuotéalo |
| Secundario | **Stripe** | Internacional, Billing/Radar/Connect futuro. **Perú NO soportado** (stripe.com/global, 2026-09-23): cuenta real solo vía entidad extranjera (Stripe Atlas US LLC ~$500 + $100/año) → MVP solo test |
| Reserva | Izipay/Niubiz | Mayor aprobación Visa local + POS físico; API más tradicional, onboarding 7-30 días |
| Expansión Latam | dLocal | Verificado 2026-07-31 (docs.dlocal.com/peru): Yape `YP` one-shot / `YE` recurrente, `EF` PagoEfectivo (CIP, ≤5 días), `BC` BCP, `LY` LigoPay QR. REST con firma HMAC-SHA256. Overkill MVP |
| Prohibido | Mercado Pago | Decisión de negocio |

Comisiones verificadas 2026-09-23 (fuentes: `culqi.com/precios`, `stripe.com/pricing`): **Culqi online**: tarjetas nacionales 3.44% + $0.20 fija, internacionales 3.99%, **Yape 3.44%**, Cuotéalo/PagoEfectivo 3.99% (comisión mínima S/3.50 si monto < S/87.72); inafectas a IGV. **Stripe US**: 2.9% + $0.30 doméstico, +1.5% tarjeta internacional, +1% FX. Yape puede ser 30-50% de tickets < S/500: sin Yape no hay done.

## Culqi — integración (fuentes: `docs.culqi.com`, `apidocs.culqi.com`)
- Hosts: `https://api.culqi.com/v2` (server, secret `sk_`) y `https://secure.culqi.com/v2` (tokenización PCI, public `pk_`).
- Checkout Custom: `<script src="https://js.culqi.com/checkout-js">`, `new CulqiCheckout(pk, {settings:{title,currency:"PEN",amount,order?}, options:{paymentMethods:{tarjeta,yape,...}}, ...})`, `Culqi.open()`, `handleCulqiAction` recibe `Culqi.token.id` (`tkn_`) o `Culqi.order`.
- `order` (previo) habilita PagoEfectivo/billeteras/Cuotéalo; sin `order` solo tarjeta. `amount`+`currency` requeridos para Yape.
- Backend: `POST /v2/charges` `{amount(céntimos), currency_code, email, source_id}` donde `source_id` ∈ `tkn_|ype_|crd_`. Yape: token `ype_` (teléfono + OTP 6 dígitos del app, **vigencia 2 min** — no 5 —, 1 uso, **máx S/2000, solo PEN**; crear tokens Yape por API propia exige PCI SAQ-D → siempre modal Culqi). Órdenes: `POST /v2/orders` → `ord_` + CIP PagoEfectivo + expiración (default 24h) → confirmar; pago CIP notifica `order.status.changed`.
- **3DS mandatorio** (popup emisor según motor antifraude) y payload encriptado **RSA** (header `x-culqi-rsa-id`; llaves con caducidad 1 año). Test E2E: Yape celular `900 000 001` con cualquier OTP de 6 dígitos; tarjetas 3DS test con email `review@culqi.com`. Referencia Next: `moiseshp/culqi-react-nextjs-integration` (`payment-button.tsx`, `load-script.ts`, Server Action a `/v2/charges`).
- Webhooks Culqi: la doc **no documenta firma/secret** (verificado 2026-09-23) → validar re-consultando el cargo/orden por API (`GET /v2/charges/{id}`, secret server-side) y comparando estado antes de mutar; idempotencia por `charge_id/order_id`.

## Stripe en Medusa (oficial)
- Cuentas: **Perú no está soportado** (stripe.com/global, 2026-09-23) → MVP solo TEST mode; cuenta real exige entidad extranjera (Stripe Atlas US LLC ~$500 + $100/año registered agent), decisión de negocio post-MVP.
- `medusa-config.ts`: provider `@medusajs/medusa/payment-stripe`, id `stripe` → `pp_stripe_stripe` (+bancontact/ideal/blik/oxxo…). Opciones: `apiKey`, `webhookSecret`, `capture:false`, `automatic_payment_methods`, `payment_description`.
- Habilitar por región en Admin (Settings→Regions). Webhooks `{server}/hooks/payment/stripe_stripe`: `payment_intent.amount_capturable_updated|succeeded|payment_failed|partially_funded`. Soporte métodos async desde v2.17.

## Custom provider Culqi en Medusa (único código de pagos a escribir)
- `src/modules/culqi-payment/service.ts` extiende `AbstractPaymentProvider` (`identifier="culqi"`): `initiate/authorize/capture/cancel/refund/getPaymentStatus/retrieve/update/delete` + `createAccountHolder/savePaymentMethod` + `getWebhookActionAndData`. Superficie verificada en `@medusajs/types@2.21.1` (2026-09-23): esos 10 requeridos + opcionales accountHolder (create/retrieve/update/delete), `listPaymentMethods`, `savePaymentMethod`, `deletePaymentMethod`.
- `src/modules/culqi-payment/index.ts`: `ModuleProvider(Modules.PAYMENT, { services: [CulqiPaymentService] })`.
- Registro: `providers: [{ resolve:"./src/modules/culqi-payment", id:"culqi", options:{ secretKey, publicKey, webhookSecret } }]` → id final `pp_culqi_culqi`, asignable por región en Admin junto a Stripe.
- No existe provider Culqi nativo/community (verificado); `medusa-custom-payments`/Hyperswitch Prism orquesta Stripe/Adyen/PayPal… pero sin Culqi. El custom es inevitable y acotado.
- Checkout storefront: Culqi tokeniza en cliente → Server Action/Route crea payment session con `source_id` → Medusa autoriza/captura vía provider → webhooks confirman (clave para Yape/PagoEfectivo async).

## Yape/Plin
- Yape directo: **sin API pública para ecommerce fuera de procesadores** (`yape.com.pe/empresas` 404, portal dev BCP sin DNS, 2026-09-23) → Yape llega **vía Culqi**; afiliación Yape Empresas directa con BCP: A-VERIFICAR.
- Plin: sin API madura → aceptar como transferencia/QR (LigoPay de dLocal en fase expansión) con verificación semi-manual en MVP si se ofrece.
