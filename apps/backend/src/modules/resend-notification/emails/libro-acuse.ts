// Acuse de recibo del Libro de Reclamaciones virtual (REQ-LIB-03, Ley 29571).
// HTML plano (sin React Email) como en order-placed.ts.

export type LibroAcuseTemplateData = {
  complaint?: {
    code?: string
    type?: string
    full_name?: string
    created_at?: string | Date
  }
  store_name?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatFechaHora(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(date)
}

export function libroAcuseEmail(data: LibroAcuseTemplateData): {
  subject: string
  html: string
} {
  const complaint = data.complaint
  if (!complaint?.code) {
    throw new Error(
      "Email libro-acuse: falta complaint.code en los datos de la notificación."
    )
  }

  const storeName = data.store_name ?? "Nuestra tienda"
  const tipo = complaint.type === "queja" ? "queja" : "reclamo"
  const fechaHora = complaint.created_at
    ? formatFechaHora(complaint.created_at)
    : formatFechaHora(new Date())

  const subject = `${storeName} — acuse de tu ${tipo} ${complaint.code}`

  const html = `<!DOCTYPE html>
<html lang="es-PE">
  <body style="margin:0;padding:24px;background:#f6f6f4;font-family:Arial,Helvetica,sans-serif;color:#1c1c1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e0;">
      <tr>
        <td style="padding:24px 24px 8px;">
          <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b66;">${escapeHtml(storeName)}</p>
          <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;">Acuse de recibo — Libro de Reclamaciones</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px 24px;font-size:14px;line-height:1.55;">
          <p>Hola${complaint.full_name ? ` ${escapeHtml(complaint.full_name)}` : ""},</p>
          <p>Tu ${tipo} quedó registrada en nuestro Libro de Reclamaciones virtual con el siguiente código:</p>
          <p style="margin:16px 0;padding:12px 16px;background:#f6f6f4;border:1px solid #e5e5e0;font-size:16px;font-weight:600;letter-spacing:0.04em;">${escapeHtml(complaint.code)}</p>
          <p style="margin:0;color:#6b6b66;">Fecha y hora de registro: ${fechaHora}.</p>
          <p>Conforme a la Ley N.° 29571, tu ${tipo} será atendida y te daremos una respuesta dentro del plazo de 30 días calendario. Guarda este código para hacer seguimiento.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html }
}
