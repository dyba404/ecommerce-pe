# 10. Notificaciones (email + WhatsApp)

## Decisión email
> **2026-09-23:** la guía oficial Medusa↔Resend (docs.medusajs.com) devuelve 404 y `medusa-plugin-resend` fue des-publicado de npm (2026-08-08). First-party solo existen `@medusajs/notification-local` y `@medusajs/notification-sendgrid`. Resend sigue como default vía **provider propio** (~un archivo: `AbstractNotificationProviderService` + API Resend + React Email); SendGrid oficial queda como alternativa cero-código.

| Rol | Provider | Por qué |
|---|---|---|
| Default MVP | **Resend** | DX moderno (React Email en JSX), setup 15 min, free 3k/mes, Pro $20/50k. Transaccional puro. |
| Path escala | **Amazon SES** | Más barato a volumen ($0.10/1k, 4-5x menos que gestionados). Setup 2-3 días: sandbox, DKIM/SPF, bounces vía SNS, supresión propia. |
| All-in-one | **Brevo** | Transaccional + marketing + CRM + SMS/WhatsApp en una suite. Free 300/día. Setup ~30 min, sin sandbox. |

Precios de referencia 2026 (verificar al contratar): `stackcompare.net/ses-vs-resend-vs-postmark-vs-sendgrid-2026` (2026-03-31), `brevo.com/blog/amazon-ses-alternatives` (2026-05-20), `courier.com/integrations/compare/amazon-ses-vs-brevo` (2026-09). Regla: **streams separados** — transaccional (Resend/SES) nunca comparte IP/reputación con marketing (Brevo).

## Wiring Medusa (igual para los 3, solo cambia el provider)
- `src/modules/<resend|ses|brevo>/service.ts` extiende `AbstractNotificationProviderService` (`send`), registrado en el Notification Module con `channels: ["email"]`. Resend hoy = implementación propia (guía oficial 404; plugin community des-publicado 2026-08-08); SendGrid tiene provider first-party (`@medusajs/notification-sendgrid`).
- Envío vía workflow: `sendNotificationsStep({to, channel:"email", template, data})` ejecutado en subscriber (`order.placed`, `auth.password_reset`…). Templates versionados en código (React Email en Resend).
- Env vars en `/.env.example` (vacías, valores reales en `.env` gitignored).

## Eventos MVP
`order.placed` (confirmación + resumen PEN), `auth.password_reset`, reclamo del Libro recibido (acuse + SLA 15 días hábiles). Todo idempotente (reintento de webhook no duplica email).

## WhatsApp (canal, no botón flotante)
- MVP: app gratuita (hasta ~50 conv/día) + links `wa.me` con pedido preseleccionado.
- Fase 2: API vía Wati (soporte/WISMO, desde ~$39/mo) o Manychat (~$29/mo, recovery + upsells). Más costo Meta ~$0.02-0.08/conversación. Perú: catálogo + Flows sí, pago nativo no → link Culqi. Plantillas utility para confirmación/envío/entrega; recovery de carrito a 1h.
- Worker fuera del checkout: evento Medusa → BSP → plantilla. Jamás bloquea el pago (C4).
- Fuentes: `guiawabusiness.cliengo.com/in-chat-checkout-whatsapp` (2026-06-16), `kom.pe/whatsapp-business-canal-ventas-tienda-lima` (2026-05-27).

## Criterio de cambio de provider
Resend hasta 50k/mes o hasta necesitar marketing integrado (→ Brevo) o volumen 500k+/mes con equipo que opere bounces (→ SES). El cambio es config del provider, no reescritura: la interfaz `AbstractNotificationProviderService` lo aísla.
