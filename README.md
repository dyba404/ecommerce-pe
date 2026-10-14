# Ecommerce PE — Ropa (escalable a electrónica y digital)

Ecommerce elegante tipo dropshipping / DTC para mercado peruano. MVP: **solo ropa** (productos pequeños, envío rápido). Arquitectura lista para electrónica pequeña y productos digitales sin reescribir.

- Base commerce: **Medusa DTC Starter** (`medusajs/dtc-starter`) — no se reinventa cart, checkout, cuentas, órdenes, promos, regiones.
- Admin operario: **Medusa Admin** (`localhost:9000/app`) — única fuente de verdad backoffice.
- Pagos PE: **Culqi primario** (tarjeta + Yape + PagoEfectivo) + **Stripe secundario** (internacional / futuro Connect). Sin Mercado Pago por decisión del negocio.

## Qué aporta este repo sobre el starter

Parte del [Medusa DTC Starter](https://github.com/medusajs/dtc-starter) (cart, checkout,
cuentas, órdenes y promos no se reinventan) y añade la capa peruana propia:

- **Provider de pagos Culqi custom** (`apps/backend/src/modules/culqi-payment/`): cargo +
  3DS + RSA, y webhooks sin firma validados por re-consulta al API (nunca por el payload).
- **Checkout con Yape** en el storefront (obligatorio en checkout PE para tickets < S/500)
  y PagoEfectivo.
- **Libro de Reclamaciones virtual** (Ley 29571): module backend + formulario frontend —
  requisito legal peruano que ningún starter trae.
- **Región PE**: PEN + IGV 18% + envíos Lima/Provincias (script `setup-pe.ts`).
- **Búsqueda first-party** sobre Postgres con instantsearch (sin servicio externo).
- **Notificaciones por email** con Resend (module propio).
- **Traducción completa a español** del storefront.
- **Rediseño móvil app-like** (navbar inferior con badge de carrito, carrusel en PDP,
  carrito en tarjetas apiladas) verificado a 360px, y fix de CLS 1.202 → 0 con evidencia
  Lighthouse.

## Estructura

```
apps/
├── backend/     # Medusa 2.21.1 (custom: culqi-payment, libro-reclamaciones, notificaciones, búsqueda first-party)
├── storefront/  # @dtc/storefront: Next 15.5 + React 19 + Tailwind 3.4 + instantsearch
└── packages/    # workspace interno
docs/            # decisiones técnicas documentadas (arquitectura, pagos PE, infra)
```

## Estado

MVP de ropa en ejecución. Hecho y commiteado: scaffold DTC (backend Medusa 2.21.1 +
storefront Next 15.5/React 19), región PE (PEN + IGV 18%), provider Culqi verificado a
nivel API con las claves test del dueño (smoke de Yape pendiente de navegador real),
checkout con Yape, Libro de Reclamaciones, búsqueda first-party, notificaciones Resend,
traducción ES completa y rediseño móvil. Pendiente: catálogo real y E2E automatizado.

## Reglas duras

1. Medusa Admin es el único panel operario. Prohibido un segundo admin paralelo.
2. Pagos: Culqi primero, Stripe segundo. Nada de Mercado Pago.
3. Yape es obligatorio en checkout PE (tickets < S/500).
4. Workers pesados (scrape/video) nunca en el request path de compra.
