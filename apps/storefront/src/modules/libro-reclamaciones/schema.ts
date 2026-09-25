import { z } from "zod"

// Espejo exacto del schema del backend (apps/backend/src/api/store/
// libro-reclamaciones/route.ts, zod v4): los mensajes son los mismos para que
// la UX del formulario coincida con la respuesta 400 del API.
export const complaintSchema = z
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

export type ComplaintInput = z.infer<typeof complaintSchema>
