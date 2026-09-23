# 04. Pagos Perú (Culqi primario, Stripe secundario, sin Mercado Pago)

## Decisión cerrada
| Rol | Pasarela | Por qué |
|---|---|---|
| Primario PE | **Culqi** (Credicorp) | API v2 moderna, docs ES, soporte Lima, onboarding 3-7 días. Tarjeta + **Yape** + PagoEfectivo + Cuotéalo |
| Secundario | **Stripe** | Internacional, Billing/Radar/Connect futuro. Sin Yape nativo, onboarding PE 7-21 días (entidad extranjera en la práctica) |
| Reserva | Izipay/Niubiz | Mayor aprobación Visa local + POS físico; API más tradicional, onboarding 7-30 días |
| Expansión Latam | dLocal | Yape `YP/YE`, PagoEfectivo, BCP, LigoPay QR (Yape/Plin). Overkill MVP |
| Prohibido | Mercado Pago | Decisión de negocio |

Comisiones de referencia 2026 (verificar al afiliar): Culqi ~3.99%+S/0.60, Yape ~2.99%+S/0.30; Stripe ~3.75%+S/0.50. Yape puede ser 30-50% de tickets < S/500: sin Yape no hay done.

## Culqi — integración (fuentes: `docs.culqi.com`, `apidocs.culqi.com`)
- Hosts: `https://api.culqi.com/v2` (server, secret `sk_`) y `https://secure.culqi.com/v2` (tokenización PCI, public `pk_`).
- Checkout Custom: `<script src="https://js.culqi.com/checkout-js">`, `new CulqiCheckout(pk, {settings:{title,currency:"PEN",amount,order?}, options:{paymentMethods:{tarjeta,yape,...}}, ...})`, `Culqi.open()`, `handleCulqiAction` recibe `Culqi.token.id` (`tkn_`) o `Culqi.order`.
- `order` (previo) habilita PagoEfectivo/billeteras/Cuotéalo; sin `order` solo tarjeta. `amount`+`currency` requeridos para Yape.
- Backend: `POST /v2/charges` `{amount(céntimos), currency_code, email, source_id}` donde `source_id` ∈ `tkn_|ype_|crd_`. Yape: token `ype_` (teléfono+OTP 6 dígitos, 5 min, 1 uso; NO guardar datos Yapero sin PCI). Órdenes: `POST /v2/orders` → `ord_` + expiración (default 24h) → confirmar.
- RSA keys + 3DS + antifraud fingerprint según panel. Referencia Next: `moiseshp/culqi-react-nextjs-integration` (`payment-button.tsx`, `load-script.ts`, Server Action a `/v2/charges`).
- Webhooks Culqi: verificar firma, idempotencia por `charge_id/order_id`.

## Stripe en Medusa (oficial)
- `medusa-config.ts`: provider `@medusajs/medusa/payment-stripe`, id `stripe` → `pp_stripe_stripe` (+bancontact/ideal/blik/oxxo…). Opciones: `apiKey`, `webhookSecret`, `capture:false`, `automatic_payment_methods`, `payment_description`.
- Habilitar por región en Admin (Settings→Regions). Webhooks `{server}/hooks/payment/stripe_stripe`: `payment_intent.amount_capturable_updated|succeeded|payment_failed|partially_funded`. Soporte métodos async desde v2.17.

## Custom provider Culqi en Medusa (único código de pagos a escribir)
- `src/modules/culqi-payment/service.ts` extiende `AbstractPaymentProvider` (`identifier="culqi"`): `initiate/authorize/capture/cancel/refund/getPaymentStatus/retrieve/update/delete` + `createAccountHolder/savePaymentMethod` + `getWebhookActionAndData`.
- `src/modules/culqi-payment/index.ts`: `ModuleProvider(Modules.PAYMENT, { services: [CulqiPaymentService] })`.
- Registro: `providers: [{ resolve:"./src/modules/culqi-payment", id:"culqi", options:{ secretKey, publicKey, webhookSecret } }]` → id final `pp_culqi_culqi`, asignable por región en Admin junto a Stripe.
- No existe provider Culqi nativo/community (verificado); `medusa-custom-payments`/Hyperswitch Prism orquesta Stripe/Adyen/PayPal… pero sin Culqi. El custom es inevitable y acotado.
- Checkout storefront: Culqi tokeniza en cliente → Server Action/Route crea payment session con `source_id` → Medusa autoriza/captura vía provider → webhooks confirman (clave para Yape/PagoEfectivo async).

## Yape/Plin
- Yape Business: RUC + cuenta BCP, aprobación 3-10 días, QR dinámico + verificación + webhook. Vía Culqi no se necesita afiliación Yape directa separada.
- Plin: sin API madura → aceptar como transferencia/QR (LigoPay de dLocal en fase expansión) con verificación semi-manual en MVP si se ofrece.
