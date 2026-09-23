# 11. Mobile-first (la mayoría compra desde el móvil)

## Principio
Todo UI se diseña **360px primero**, se escala hacia arriba. Medir con PostHog; asumir móvil hasta demostrar lo contrario.

## Layout
- PDP: galería swipe + sticky add-to-cart + talla en bottom-sheet (no dropdown desktop).
- Cart: drawer bottom-sheet (Vaul) + toasts (Sonner); checkout en 1 columna.
- Pagos: Yape QR grande + botón copiar código; Culqi Checkout Custom probado en viewport móvil; Stripe Elements apilados.
- Libro de Reclamaciones y WhatsApp accesibles con 1 tap (enlace persistente + `wa.me`).

## Performance budget móvil (gama media Android, 4G)
- LCP < 2.5s, INP < 200ms, CLS < 0.1. Imágenes responsive AVIF/WebP + `sizes`, media en S3/Cloudinary (Fase 2).
- Fuentes subset es-PE, JS mínimo (islas `"use client"` solo donde hay interactividad, ver `docs/01-arquitectura.md`).
- PWA MVP: `manifest` + `theme-color` + iconos. Offline/full-PWA en Fase 2.

## QA móvil
- `browser-testing-with-devtools` con emulación de dispositivo + Lighthouse CI en modo mobile como gate (`/opsx:verify`).
- `impeccable audit` también en 360px; targets táctiles ≥44px; contraste y foco visibles (WCAG 2.1 AA); dark mode paritario.
- Copy es-PE corto, precio PEN grande, CTA Yape siempre visible sin scroll.

## Anti-patrones
Tablas de escritorio encogidas, hover como único affordance, QR de 80px, checkout a 2 columnas en móvil, popups que tapan el CTA de pago.
