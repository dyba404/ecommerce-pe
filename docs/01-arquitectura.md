# 01. Arquitectura madura

## Monorepo (npm workspaces hoy, pnpm/Turborepo cuando crezca)

```
apps/backend            Medusa v2 (create-medusa-app --starter dtc)
apps/storefront         Next.js 16 App Router + Tailwind v4 + shadcn
apps/workers/catalog-sync   FASE 2: BullMQ + Redis (scraping → Medusa API)
apps/studio-video           FASE 2: HyperFrames (1 carpeta por campaña)
packages/lib-jev            FASE 2: juicios tipados + políticas puras
openspec/  docs/  constitution.md  AGENTS.md
```

## Medusa v2 (fuente: release v2.0 + docs framework)

- **Módulos puros**: product, cart, order, payment, pricing, promotion, customer, inventory, fulfillment, region… Cada uno solo gestiona su dominio. Sin FKs entre módulos; relaciones vía **Module Links**; lectura agregada vía **Query graph**.
- **Workflows**: TODA lógica cross-dominio vive aquí. `createStep(id, main, compensation)` + `createWorkflow` + `WorkflowResponse`. `transform/when/parallelize`, `useQueryGraphStep`, hooks (`createHook`). Retries + rollback con compensación. Entry points: API Routes, Subscribers (eventos `order.placed`…), Scheduled Jobs.
- **Servicios "tontos"**: `CartService.createCart` solo crea cart. La composición (precios, promos, pagos) la hace el workflow. Esto permite vender ropa hoy y licencias mañana sin tocar cart.
- **Admin**: React+Vite+TS sobre Admin APIs. Layout Composer drag&drop. Widgets para inyectar UI nativa (ej. cola moderación JEV, estado Culqi). Mismas APIs sirven para un admin custom si algún día hace falta (hoy prohibido duplicar).
- **Worker modes**: HTTP y background separados en producción.

## Patrones obligatorios en backend

- Custom module: `src/modules/<nombre>/models/*.ts` (DML) + `service.ts` (`MedusaService`, `@InjectManager/@EmitEvents`) + `index.ts`.
- Payment provider: `src/modules/culqi-payment/service.ts` extiende `AbstractPaymentProvider` (`initiate/authorize/capture/cancel/refund/getPaymentStatus/retrieve/update/delete` + `createAccountHolder/savePaymentMethod` + `getWebhookActionAndData`), export vía `ModuleProvider(Modules.PAYMENT, { services: [...] })`, id `pp_culqi_culqi`.
- API route: exports `GET/POST/...`, `AuthenticatedMedusaRequest`/`MedusaRequest`, `MedusaResponse`, `req.scope`, workflows de `@medusajs/core-flows`.
- Migraciones siempre; Query para leer cross-módulo; eventos para side-effects.

## Storefront

- RSC primero; `"use client"` solo en cart drawer, checkout, Culqi Checkout Custom, Stripe Elements.
- Culqi tokeniza en cliente (`tkn_/ype_`); backend crea charges/orders. Stripe Elements con `clientSecret` del payment session.
- Env: solo `NEXT_PUBLIC_*` publishable al frente.

## Infra por fase

- MVP: Postgres + Redis + Medusa + Storefront (VPS/Vercel+Railway/Neon según `09-roadmap`).
- Fase 2: + BullMQ workers, S3/Cloudinary media, Meilisearch/Algolia search, Lambda/Cloud renders HyperFrames, JEV vía TypeSafe/OpenRouter/Vercel Gateway.
