# 00. Visión y alcance

## Idea
Ecommerce elegante tipo dropshipping/DTC para Perú. Productos pequeños de envío rápido. Empieza con **ropa**; la arquitectura soporta electrónica pequeña y productos digitales sin reescritura.

## Por qué ropa primero
- Variantes simples (talla/color), fotos simples, devoluciones manejables.
- Ticket medio compatible con Yape (< S/500 gran parte).
- Si el checkout, Culqi+Yape y la operación funcionan con ropa, escalar es agregar `productType`, no rehacer.

## Alcance MVP (mvp-ropa)
- Catálogo ropa con variantes, colecciones, búsqueda/filtros.
- Cart + promos, checkout PE (envío Lima/provincias + Culqi/Stripe), cuentas cliente (historial, direcciones).
- Admin Medusa operando productos, órdenes, clientes, promos, regiones.
- Pagos: Culqi (tarjeta+Yape+PagoEfectivo) primario, Stripe secundario test.
- NO MVP: scraping proveedores, JEV, video HyperFrames, marketplace split, POS físico, app móvil.

## Escalabilidad reservada
- `productType`: `apparel` hoy; `electronics-small`, `digital` mañana.
- `fulfillment`: `ship-small` hoy; `digital-delivery` (email/link, sin shipping) mañana.
- Precios multi-moneda (PEN hoy, USD después), multi-región.
- Proveedor Culqi y Stripe conviviendo por región desde día 1.

## Criterios de done del MVP
- Compra completa en PEN con Culqi test (tarjeta + Yape `ype_`) y orden visible en Admin.
- Sin Yape no hay done. Sin proposal OpenSpec aprobada no hay código.
