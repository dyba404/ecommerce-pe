# 01. Arquitectura madura

## Monorepo (pnpm workspaces + Turborepo, activos desde 2026-09-23)

```
apps/backend            Medusa v2.21.1 (scaffold create-medusa-app; incl. @medusajs/caching y src/search/)
apps/storefront         @dtc/storefront 1.0.3: Next.js 15.5 App Router + React 19 + Tailwind 3.4 (shadcn en T7)
apps/backend            módulos propios: culqi-payment, libro-reclamaciones, notificaciones, búsqueda
docs/                   decisiones técnicas documentadas
```

## Medusa v2 (fuente: release v2.0 + docs framework)

- **Módulos puros**: product, cart, order, payment, pricing, promotion, customer, inventory, fulfillment, region… Cada uno solo gestiona su dominio. Sin FKs entre módulos; relaciones vía **Module Links**; lectura agregada vía **Query graph**.
- **Workflows**: TODA lógica cross-dominio vive aquí. `createStep(id, main, compensation)` + `createWorkflow` + `WorkflowResponse`. `transform/when/parallelize`, `useQueryGraphStep`, hooks (`createHook`). Retries + rollback con compensación. Entry points: API Routes, Subscribers (eventos `order.placed`…), Scheduled Jobs.
- **Servicios "tontos"**: `CartService.createCart` solo crea cart. La composición (precios, promos, pagos) la hace el workflow. Esto permite vender ropa hoy y licencias mañana sin tocar cart.
- **Admin**: React+Vite+TS sobre Admin APIs. Layout Composer drag&drop. Widgets para inyectar UI nativa (ej. cola moderación JEV, estado Culqi). Mismas APIs sirven para un admin custom si algún día hace falta (hoy prohibido duplicar).
- **Worker modes**: HTTP y background separados en producción.
- **Search first-party**: módulo `@medusajs/search` con `defineSearchIndex/graphSeed/graphConsume` (el scaffold ya trae `src/search/product.ts`); providers `search-postgres` (tsvector+pg_trgm) y `search-local` (Orama). Sin providers oficiales Meilisearch/Algolia (community: `@rokmohar/medusa-plugin-meilisearch`); el storefront consume vía `@medusajs/instantsearch-adapter` → `POST /store/search`.

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
- Fase 2: + BullMQ workers, S3/Cloudinary media, Lambda/Cloud renders HyperFrames, JEV vía TypeSafe/OpenRouter/Vercel Gateway. (Search ya quedó en MVP: first-party, ver arriba.)
