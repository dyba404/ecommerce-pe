# 15. Túnel permanente Cloudflare (ecommerce-mvp)

> Estado 2026-09-24: ACTIVO y verificado. Túnel **named/permanente** (no quick tunnel), corre como tarea programada de Windows con arranque automático.

## Topología

- `https://api-ecommerce.marsmode.me` → `http://127.0.0.1:9000` (backend Medusa: Store API, Admin `/app`, webhooks de pago)
- `https://ecommerce.marsmode.me` → `http://127.0.0.1:8000` (storefront Next.js)
- Todo lo demás → 404 (catch-all del ingress)

Datos del túnel (no sensibles): nombre `ecommerce-mvp`, ID `f30445d9-40be-481b-acc7-6954fa31e756`, cuenta CF la misma de odontoflow (`0d14cbeadf4bf93765ba88f974e85b1b`), dominio `marsmode.me`.

## Piezas (fuera del repo — NUNCA commitear)

- Binario: `C:\Users\Administrator\bin\cloudflared.exe` (2026.9.3)
- Cert de cuenta: `C:\Users\Administrator\.cloudflared\cert.pem` (copiado de WSL `/home/dev/.cloudflared/`, origen del login de odontoflow)
- Credenciales del túnel: `C:\Users\Administrator\.cloudflared\f30445d9-….json`
- Config/ingress: `C:\Users\Administrator\.cloudflared\ecommerce-mvp.yml`
- Tarea programada: `CloudflaredEcommerceMVP` (SYSTEM, `onstart`, HIGHEST). Comandos:
  - iniciar: `schtasks /run /tn "CloudflaredEcommerceMVP"`
  - estado/logs: `schtasks /query /tn "CloudflaredEcommerceMVP" /v`
  - recrear: ver comando exacto en el historial git de este doc si hace falta

Notas heredadas de odontoflow que aplican igual aquí:
- `--protocol http2` obligatorio en esta red (QUIC degrada requests con body → 502 del edge).
- Origin con `127.0.0.1` explícito, NO `localhost` (cloudflared resuelve `localhost` → `::1` y los dev servers no aceptan conexiones por ese socket → 502).
- `--no-autoupdate` siempre.

## webhooks Stripe (test)

- Endpoint en Stripe (test mode): `we_1UJPAK2OXmWPu5dHxXMqKMxx` → `https://api-ecommerce.marsmode.me/hooks/payment/stripe_stripe`
- Eventos: `payment_intent.*` (succeeded/canceled/failed/processing/requires_capture/amount_capturable_updated/partially_funded) + `charge.refunded`, `charge.refund.updated`
- El `whsec_…` vive SOLO en `apps/backend/.env` (`STRIPE_WEBHOOK_SECRET`).
- `STRIPE_API_KEY` (sk_test) también en `apps/backend/.env`. Stripe no soporta cuentas Perú (verificado 2026-09-23): MVP solo test mode.

## Dependencia: los dev servers

El túnel es permanente, **pero hace 502 cuando los dev servers no están corriendo** (el túnel no los levanta). Backend y storefront se arrancan como siempre (`pnpm dev` en cada app). Quien reinicie la máquina: Docker (WSL keepalive) + túnel suben solos; los dev servers se levantan al trabajar.

Culqi: cuando lleguen las claves (dashboard en mantenimiento 2026-09-24), sus webhooks apuntarán a `https://api-ecommerce.marsmode.me/hooks/payment/culqi_culqi` — mismo túnel, sin nueva infra (validación por re-consulta API según `docs/pagos-peru.md`).
