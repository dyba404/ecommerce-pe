// Template de confirmación de pedido (REQ-NOT-01) — español PE, HTML inline
// (email-safe). Los montos llegan en unidades mayores (S/ 59.00) tal como los
// devuelve el Query graph de Medusa v2.
// Sin React Email: HTML plano para cero dependencias extra (docs/10).

type OrderItem = {
  title?: string
  quantity?: number
  unit_price?: number
  total?: number
}

type OrderShape = {
  display_id?: number
  email?: string
  currency_code?: string
  total?: number
  item_subtotal?: number
  subtotal?: number
  shipping_total?: number
  tax_total?: number
  discount_total?: number
  items?: OrderItem[]
  shipping_address?: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    province?: string
    postal_code?: string
  }
}

export type OrderPlacedTemplateData = {
  order?: OrderShape
  store_name?: string
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const formatMoney = (amount: number | undefined, currency: string): string => {
  if (amount === undefined || amount === null) return "—"
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function orderPlacedEmail(data: OrderPlacedTemplateData): {
  subject: string
  html: string
} {
  const order = data.order
  if (!order) {
    throw new Error(
      "Template order-placed: falta `order` en data de la notificación."
    )
  }

  const storeName = data.store_name?.trim() || "la tienda"
  const currency = order.currency_code ?? "pen"
  const displayId = order.display_id ?? "—"
  const nombre = order.shipping_address?.first_name
    ? escapeHtml(order.shipping_address.first_name)
    : ""
  const saludo = nombre ? `Hola ${nombre},` : "Hola,"

  const addr = order.shipping_address
  const direccion = addr
    ? [
        [addr.first_name, addr.last_name].filter(Boolean).join(" "),
        addr.address_1,
        addr.address_2,
        [addr.city, addr.province].filter(Boolean).join(", "),
        addr.postal_code,
      ]
        .filter((l) => l && l.trim())
        .map((l) => escapeHtml(l!.trim()))
        .join("<br/>")
    : ""

  const rows = (order.items ?? [])
    .map((item) => {
      const titulo = escapeHtml(item.title ?? "Item")
      const qty = item.quantity ?? 1
      const unit = formatMoney(item.unit_price, currency)
      const total = formatMoney(item.total, currency)
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eaeaea;font-size:14px;color:#111;">${titulo} <span style="color:#666;">× ${qty}</span><br/><span style="font-size:12px;color:#666;">${unit} c/u</span></td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #eaeaea;font-size:14px;color:#111;">${total}</td>
      </tr>`
    })
    .join("")

  const line = (label: string, value: string, bold = false) => `<tr>
    <td style="padding:4px 0;font-size:14px;color:${bold ? "#111" : "#444"};${bold ? "font-weight:600;" : ""}">${label}</td>
    <td align="right" style="padding:4px 0;font-size:14px;color:#111;${bold ? "font-weight:600;" : ""}">${value}</td>
  </tr>`

  const totales = [
    line("Subtotal", formatMoney(order.item_subtotal ?? order.subtotal, currency)),
    ...(order.discount_total
      ? [line("Descuento", `− ${formatMoney(order.discount_total, currency)}`)]
      : []),
    line("Envío", formatMoney(order.shipping_total, currency)),
    ...(order.tax_total
      ? [line("IGV incluido", formatMoney(order.tax_total, currency))]
      : []),
    line("Total", formatMoney(order.total, currency), true),
  ].join("")

  const subject = `${storeName} — pedido #${displayId} confirmado`

  const html = `<!doctype html>
<html lang="es-PE">
<body style="margin:0;padding:0;background:#f6f6f4;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border:1px solid #eaeaea;border-radius:12px;padding:32px;">
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#888;">${escapeHtml(storeName)}</p>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111;">Pedido #${displayId} confirmado</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.5;">${saludo}<br/>recibimos tu pedido y lo estamos preparando. Te avisaremos cuando salga.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">${rows}</table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">${totales}</table>

      ${
        direccion
          ? `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#888;">Envío a</p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.5;">${direccion}</p>`
          : ""
      }

      <p style="margin:28px 0 0;font-size:12px;color:#999;line-height:1.6;">Los precios incluyen IGV. Si no reconoces este pedido o necesitas ayuda, responde a este correo.</p>
    </div>
  </div>
</body>
</html>`

  return { subject, html }
}
