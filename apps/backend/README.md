# apps/backend — Medusa (ficha de scaffolding, Fase 1)

No hay código Medusa todavía para no ensuciar docs. Generar con (ver `docs/09-roadmap.md`):

```bash
npx create-medusa-app@latest --starter dtc ./apps/backend-tmp
# mover contenido a apps/backend/ y borrar tmp; o scaffoldear directo según CLI vigente
```

Luego: `.env` desde `/.env.example`, región PE, `src/modules/culqi-payment/` según `docs/04-pagos-peru.md` y delta `openspec/changes/mvp-ropa/specs/checkout-culqi/spec.md`.
