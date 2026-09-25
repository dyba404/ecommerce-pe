"use server"

import {
  ComplaintInput,
  complaintSchema,
} from "@modules/libro-reclamaciones/schema"

export type ComplaintFormState = {
  status: "idle" | "success" | "invalid" | "error"
  message?: string
  fieldErrors?: Partial<Record<keyof ComplaintInput, string[]>>
  result?: {
    code: string
    type: ComplaintInput["type"]
    created_at: string
    acknowledgement_sent: boolean
  }
}

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

// POST /store/libro-reclamaciones (contrato: apps/backend/src/api/store/
// libro-reclamaciones/route.ts). 201 → { complaint: { code, type,
// created_at }, acknowledgement_sent }; 400 → { type, message,
// errors: fieldErrors }. Fetch plano (no sdk.client.fetch): el FetchError del
// SDK descarta el body del 400 y perderíamos los errores por campo.
export async function submitComplaint(
  _prev: ComplaintFormState,
  formData: FormData
): Promise<ComplaintFormState> {
  const parsed = complaintSchema.safeParse({
    type: formData.get("type") ?? undefined,
    full_name: formData.get("full_name") ?? undefined,
    document_type: formData.get("document_type") ?? undefined,
    document_number: formData.get("document_number") ?? undefined,
    email: formData.get("email") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    address: formData.get("address") ?? undefined,
    order_reference: formData.get("order_reference") ?? undefined,
    detail: formData.get("detail") ?? undefined,
  })

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "El formulario tiene errores. Revisa los campos marcados.",
      fieldErrors: parsed.error.flatten()
        .fieldErrors as ComplaintFormState["fieldErrors"],
    }
  }

  if (!publishableKey) {
    // Guard en voz alta: sin publishable key la ruta de store responde 401.
    console.error(
      "Libro de Reclamaciones: falta NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY en el storefront."
    )
    return {
      status: "error",
      message:
        "No pudimos registrar tu reclamo en este momento. Vuelve a intentarlo en unos minutos.",
    }
  }

  let response: Response
  try {
    response = await fetch(`${backendUrl}/store/libro-reclamaciones`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    })
  } catch (error) {
    console.error(
      `Libro de Reclamaciones: no se pudo contactar al backend: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return {
      status: "error",
      message:
        "No pudimos registrar tu reclamo en este momento. Vuelve a intentarlo en unos minutos.",
    }
  }

  if (response.ok) {
    const body = (await response.json()) as {
      complaint: {
        code: string
        type: ComplaintInput["type"]
        created_at: string
      }
      acknowledgement_sent: boolean
    }
    return {
      status: "success",
      result: {
        code: body.complaint.code,
        type: body.complaint.type,
        created_at: body.complaint.created_at,
        acknowledgement_sent: body.acknowledgement_sent,
      },
    }
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string
      errors?: Record<string, string[]>
    }
    return {
      status: "invalid",
      message:
        body.message ?? "El formulario tiene errores. Revisa los campos marcados.",
      fieldErrors: body.errors as ComplaintFormState["fieldErrors"],
    }
  }

  // Fallo real (backend 5xx, ruta no desplegada, etc.): guard en voz alta,
  // sin fingir éxito.
  console.error(
    `Libro de Reclamaciones: el backend respondió ${response.status} al registrar el reclamo.`
  )
  return {
    status: "error",
    message:
      "No pudimos registrar tu reclamo en este momento. Vuelve a intentarlo en unos minutos.",
  }
}
