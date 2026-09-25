// Provider de notificaciones vía Resend (REQ-NOT-01). La guía oficial
// Medusa↔Resend devuelve 404 y el plugin community fue des-publicado
// (2026-08): la integración es propia, sobre la API HTTP de Resend, sin SDK.
//
// Guard ruidoso (REQ-NOT-02): sin RESEND_API_KEY/RESEND_FROM_EMAIL el send()
// falla en voz alta con la env faltante. Nunca finge un envío exitoso ni
// traga el error. El backend sí bootea sin claves (validateOptions no lanza)
// para no tumbar el dev local; el fallo se produce al primer uso.
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import {
  orderPlacedEmail,
  OrderPlacedTemplateData,
} from "./emails/order-placed"
import {
  libroAcuseEmail,
  LibroAcuseTemplateData,
} from "./emails/libro-acuse"

enum Templates {
  ORDER_PLACED = "order-placed",
  LIBRO_ACUSE = "libro-acuse",
}

const templates: Record<
  Templates,
  (data: Record<string, unknown>) => { subject: string; html: string }
> = {
  [Templates.ORDER_PLACED]: (data) =>
    orderPlacedEmail(data as OrderPlacedTemplateData),
  [Templates.LIBRO_ACUSE]: (data) =>
    libroAcuseEmail(data as LibroAcuseTemplateData),
}

type ResendOptions = {
  api_key?: string
  from?: string
}

type InjectedDependencies = {
  logger: Logger
}

const RESEND_API_URL = "https://api.resend.com/emails"

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"
  protected logger_: Logger
  protected options_: ResendOptions

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.logger_ = logger
    this.options_ = options ?? {}
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!this.options_.api_key) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Resend: falta RESEND_API_KEY en apps/backend/.env — el email transaccional no se envió. Sin clave no hay envío (guard REQ-NOT-02)."
      )
    }
    if (!this.options_.from) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Resend: falta RESEND_FROM_EMAIL en apps/backend/.env — el email transaccional no se envió (guard REQ-NOT-02)."
      )
    }

    const template = templates[notification.template as Templates]
    if (!template) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Resend: template desconocido "${notification.template}". Válidos: ${Object.values(
          Templates
        ).join(", ")}.`
      )
    }

    const { subject, html } = template(notification.data ?? {})

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options_.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.options_.from,
        to: [notification.to],
        subject,
        html,
      }),
    })

    const bodyText = await response.text()
    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Resend API respondió ${response.status}: ${bodyText}`
      )
    }

    let id: string | undefined
    try {
      id = (JSON.parse(bodyText) as { id?: string }).id
    } catch {
      this.logger_.warn(
        `Resend respondió 2xx pero el body no es JSON parseable: ${bodyText}`
      )
    }

    this.logger_.info(
      `Email "${notification.template}" enviado a ${notification.to} vía Resend (id: ${id ?? "desconocido"}).`
    )
    return id ? { id } : {}
  }
}

export default ResendNotificationProviderService
