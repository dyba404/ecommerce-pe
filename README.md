# Ecommerce PE — Ropa (escalable a electrónica y digital)

Ecommerce elegante tipo dropshipping / DTC para mercado peruano. MVP: **solo ropa** (productos pequeños, envío rápido). Arquitectura lista para electrónica pequeña y productos digitales sin reescribir.

- Base commerce: **Medusa DTC Starter** (`medusajs/dtc-starter`) — no se reinventa cart, checkout, cuentas, órdenes, promos, regiones.
- Admin operario: **Medusa Admin** (`localhost:9000/app`) — única fuente de verdad backoffice.
- Pagos PE: **Culqi primario** (tarjeta + Yape + PagoEfectivo) + **Stripe secundario** (internacional / futuro Connect). Sin Mercado Pago por decisión del negocio.
- Specs: **OpenSpec** (`openspec/`) + `constitution.md`. Nada se construye sin proposal aprobada.
- Skills: shadcn + taste + impeccable + emil + vercel-react-best-practices + supabase-postgres + e-commerce + tdd/browser-testing (ver `docs/03-skills.md`).

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
ecommerce/
├── README.md  AGENTS.md  constitution.md
├── package.json  pnpm-workspace.yaml  .env.example  .gitignore
├── docs/                    # 00..14, toda decisión documentada
├── openspec/
│   ├── specs/<dominio>/spec.md      # verdad actual
│   └── changes/mvp-ropa/{proposal.md,design.md,tasks.md,specs/}  # cambio en curso
├── apps/
│   ├── backend/     # Medusa 2.21.1 (scaffold create-medusa-app; ya copiado, commit 691aa45)
│   ├── storefront/  # @dtc/storefront 1.0.3: Next 15.5 + React 19 + Tailwind 3.4 + instantsearch (shadcn en T7)
│   ├── workers/catalog-sync/  # FASE 2: BullMQ + Firecrawl/ScrapeGraph/Crawl4AI
│   └── studio-video/          # FASE 2: HyperFrames por campaña
└── packages/lib-jev/          # FASE 2: juicios tipados (moderación, ruteo)
```

## Estado

Fase actual: **Fase 1 (MVP ropa) en ejecución**. Fase 0 cerrada (docs 00..14 + OpenSpec).
Hecho y commiteado: scaffold DTC (backend Medusa 2.21.1 + storefront Next 15.5/React 19),
región PE (PEN + IGV 18%), provider Culqi verificado a nivel API con las claves test del
dueño (smoke de Yape pendiente de navegador real: el checkout-js de Culqi no monta en
IAB), checkout con Yape, Libro de Reclamaciones, búsqueda first-party, notificaciones
Resend, traducción ES completa y rediseño móvil. Pendiente: seed real del dueño y E2E
automatizado. Detalle y secuencia: `docs/09-roadmap.md` + `openspec/changes/mvp-ropa/tasks.md`.

## Reglas duras

1. Medusa Admin es el único panel operario. Prohibido un segundo admin paralelo.
2. Pagos: Culqi primero, Stripe segundo. Nada de Mercado Pago.
3. Todo cambio pasa por `openspec/changes/<nombre>/` antes de código.
4. Yape es obligatorio en checkout PE (tickets < S/500).
5. Workers (scrape/JEV/video) nunca en el request path de compra.

## Siguiente paso

Leer `docs/09-roadmap.md` y `openspec/changes/mvp-ropa/proposal.md`.
