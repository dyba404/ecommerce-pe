// POST /store/libro-reclamaciones — Libro de Reclamaciones virtual
// (Ley N.° 29571; REQ-LIB-02/03). Ruta pública de tienda: el consumidor puede
// ser invitado. Validación Zod en el borde (es-PE, mensajes por campo).
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { INotificationModuleService } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { randomBytes } from "crypto"

import { LIBRO_RECLAMACIONES_MODULE } from "../../../modules/libro-reclamaciones"
import type LibroReclamacionesService from "../../../modules/libro-reclamaciones/service"

const complaintSchema = z
  .object({
    type: z.enum(["reclamo", "queja"], {
      error: "Elige si es un reclamo o una queja.",
    }),
    full_name: z
      .string({ error: "Ingresa tu nombre completo." })
      .trim()
      .min(3, "Ingresa tu nombre completo (mín. 3 caracteres).")
      .max(120, "El nombre es demasiado largo."),
    document_type: z.enum(["dni", "ce", "pasaporte", "ruc"], {
      error: "Elige el tipo de documento.",
    }),
    document_number: z
      .string({ error: "Ingresa tu número de documento." })
      .trim()
      .regex(
        /^[0-9A-Za-z]{6,12}$/,
        "Documento inválido (DNI: 8 dígitos, CE: 9-12, RUC: 11, pasaporte: alfanumérico)."
      ),
    email: z
      .string({ error: "Ingresa tu correo electrónico." })
      .trim()
      .email("Ingresa un correo válido.")
      .max(120),
    phone: z
      .string({ error: "Ingresa tu teléfono." })
      .trim()
      .regex(/^\+?[0-9 ]{6,15}$/, "Ingresa un teléfono válido (6-15 dígitos)."),
    address: z
      .string({ error: "Ingresa tu dirección." })
      .trim()
      .min(5, "Ingresa tu dirección completa.")
      .max(200),
    order_reference: z
      .string()
      .trim()
      .max(60, "La referencia de pedido es demasiado larga.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    detail: z
      .string({ error: "Describe tu reclamo o queja." })
      .trim()
      .min(10, "Cuéntanos un poco más (mín. 10 caracteres).")
      .max(2000, "El detalle es demasiado largo (máx. 2000 caracteres)."),
  })
  .strict()

type ComplaintInput = z.infer<typeof complaintSchema>

/** Código público con fecha-hora + sufijo aleatorio: LR-20260924-1530-4F9A2C. */
function generateComplaintCode(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}-${pad(now.getHours())}${pad(now.getMinutes())}`
  const suffix = randomBytes(3).toString("hex").toUpperCase()
  return `LR-${stamp}-${suffix}`
}

async function createComplaint(
  service: LibroReclamacionesService,
  input: ComplaintInput
) {
  // El índice único de `code` es la guarda real; el reintento cubre el choque
  // aleatorio (1 en ~16M por mismo minuto) sin loop infinito.
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await service.createComplaints({
        ...input,
        code: generateComplaintCode(),
      })
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes("complaint_code_unique")) {
        throw error
      }
    }
  }
  throw new MedusaError(
    MedusaError.Types.UNEXPECTED_STATE,
    `No se pudo generar un código de reclamo único tras 3 intentos: ${String(
      lastError
    )}`
  )
}

export async function POST(
  req: MedusaRequest<ComplaintInput>,
  res: MedusaResponse
): Promise<void> {
  const parsed = complaintSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      type: "invalid_data",
      message: "El formulario tiene errores. Revisa los campos marcados.",
      errors: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const libroService = req.scope.resolve<LibroReclamacionesService>(
    LIBRO_RECLAMACIONES_MODULE
  )

  const complaint = await createComplaint(libroService, parsed.data)

  // Acuse por email (REQ-LIB-03) vía el provider de notificaciones (REQ-NOT-01).
  // Si el envío falla (p. ej. falta RESEND_API_KEY en local) el registro legal
  // ya está persistido y NO se revierte: el fallo queda en el log en voz alta
  // y el consumidor igual recibe su código en pantalla.
  const notification: INotificationModuleService = req.scope.resolve(
    Modules.NOTIFICATION
  )

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["name"],
  })
  const storeName = (stores[0]?.name as string | undefined) ?? undefined

  let acknowledgementSent = true
  try {
    await notification.createNotifications([
      {
        to: complaint.email,
        channel: "email",
        template: "libro-acuse",
        data: {
          complaint: {
            code: complaint.code,
            type: complaint.type,
            full_name: complaint.full_name,
            created_at: complaint.created_at,
          },
          store_name: storeName,
        },
        trigger_type: "libro-reclamaciones.created",
        resource_id: complaint.id,
        resource_type: "complaint",
        idempotency_key: `libro-acuse-${complaint.code}`,
      },
    ])
  } catch (error) {
    acknowledgementSent = false
    logger.error(
      `Libro de Reclamaciones: el acuse de ${complaint.code} NO se envió: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }

  res.status(201).json({
    complaint: {
      code: complaint.code,
      type: complaint.type,
      created_at: complaint.created_at,
    },
    acknowledgement_sent: acknowledgementSent,
  })
}
