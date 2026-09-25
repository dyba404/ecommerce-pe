"use client"

import { SubmitButton } from "@modules/checkout/components/submit-button"
import {
  ComplaintFormState,
  submitComplaint,
} from "@modules/libro-reclamaciones/actions"
import { useActionState, useState } from "react"

const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "dni", label: "DNI" },
  { value: "ce", label: "Carné de extranjería" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "ruc", label: "RUC" },
]

const inputClasses =
  "w-full h-11 px-3 border border-ui-border-base rounded-base bg-ui-bg-field text-ui-fg-base focus:border-ui-border-interactive focus:outline-none placeholder:text-ui-fg-muted"
const labelClasses = "text-small-semi text-ui-fg-base"
const errorClasses = "text-small-regular text-rose-600 mt-1"

const EMPTY = {
  type: "reclamo",
  full_name: "",
  document_type: "dni",
  document_number: "",
  email: "",
  phone: "",
  address: "",
  order_reference: "",
  detail: "",
}

// Campos controlados: tras un envío rechazado (400 del backend o validación
// local con el esquema espejo) el consumidor no pierde lo que ya escribió.
export default function ComplaintForm() {
  const [state, formAction] = useActionState(submitComplaint, {
    status: "idle",
  } as ComplaintFormState)
  const [values, setValues] = useState(EMPTY)

  const set =
    (field: keyof typeof EMPTY) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setValues((v) => ({ ...v, [field]: e.target.value }))

  const fieldError = (field: keyof typeof EMPTY) =>
    state.fieldErrors?.[field]?.[0] ?? null

  if (state.status === "success" && state.result) {
    const result = state.result
    return (
      <div className="flex flex-col gap-y-4 rounded-large border border-ui-border-base bg-ui-bg-subtle p-6 small:p-8">
        <h2 className="font-display text-2xl text-ui-fg-base">
          {result.type === "queja" ? "Queja registrada" : "Reclamo registrado"}
        </h2>
        <p className="text-base-regular text-ui-fg-subtle">
          Tu código de seguimiento es:
        </p>
        <p
          className="text-lg-semi font-mono bg-ui-bg-base border border-ui-border-base rounded-md px-4 py-3 w-fit"
          data-testid="complaint-code"
        >
          {result.code}
        </p>
        <p className="text-small-regular text-ui-fg-muted">
          {result.acknowledgement_sent
            ? "Te enviamos un acuse de recibo a tu correo. Responderemos dentro del plazo de 30 días calendario, conforme al art. 24 de la Ley N.° 29571."
            : "Guarda este código: no pudimos enviarte la constancia por correo ahora, pero tu registro ya quedó guardado. Responderemos dentro del plazo de 30 días calendario, conforme al art. 24 de la Ley N.° 29571."}
        </p>
        <p className="text-small-regular text-ui-fg-muted">
          Fecha de registro:{" "}
          {new Date(result.created_at).toLocaleString("es-PE", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY)
            // Nuevo formulario limpio desde el estado inicial.
            window.location.reload()
          }}
          className="w-fit text-small-semi text-ui-fg-interactive underline underline-offset-4 hover:text-ui-fg-interactive-hover"
        >
          Registrar otro reclamo
        </button>
      </div>
    )
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-y-5"
      data-testid="complaint-form"
      noValidate
    >
      <fieldset>
        <legend className={labelClasses}>¿Qué deseas registrar?</legend>
        <div className="mt-2 grid grid-cols-1 small:grid-cols-2 gap-3">
          <label
            className={`flex cursor-pointer flex-col gap-y-1 rounded-base border p-4 transition-colors ${
              values.type === "reclamo"
                ? "border-ui-border-interactive bg-accent-50"
                : "border-ui-border-base"
            }`}
            data-testid="complaint-type-reclamo"
          >
            <span className="flex items-center gap-x-2 text-base-semi text-ui-fg-base">
              <input
                type="radio"
                name="type"
                value="reclamo"
                checked={values.type === "reclamo"}
                onChange={set("type")}
                className="accent-emerald-700"
              />
              Reclamo
            </span>
            <span className="text-small-regular text-ui-fg-subtle">
              Disconformidad con un producto o servicio.
            </span>
          </label>
          <label
            className={`flex cursor-pointer flex-col gap-y-1 rounded-base border p-4 transition-colors ${
              values.type === "queja"
                ? "border-ui-border-interactive bg-accent-50"
                : "border-ui-border-base"
            }`}
            data-testid="complaint-type-queja"
          >
            <span className="flex items-center gap-x-2 text-base-semi text-ui-fg-base">
              <input
                type="radio"
                name="type"
                value="queja"
                checked={values.type === "queja"}
                onChange={set("type")}
                className="accent-emerald-700"
              />
              Queja
            </span>
            <span className="text-small-regular text-ui-fg-subtle">
              Malestar con la atención recibida.
            </span>
          </label>
        </div>
        {fieldError("type") && (
          <p className={errorClasses} role="alert">
            {fieldError("type")}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="full_name" className={labelClasses}>
          Nombres y apellidos
        </label>
        <input
          id="full_name"
          name="full_name"
          autoComplete="name"
          className={`${inputClasses} mt-2`}
          value={values.full_name}
          onChange={set("full_name")}
          aria-invalid={!!fieldError("full_name")}
          data-testid="complaint-full-name"
        />
        {fieldError("full_name") && (
          <p className={errorClasses} role="alert">
            {fieldError("full_name")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 small:grid-cols-2 gap-5">
        <div>
          <label htmlFor="document_type" className={labelClasses}>
            Tipo de documento
          </label>
          <select
            id="document_type"
            name="document_type"
            className={`${inputClasses} mt-2`}
            value={values.document_type}
            onChange={set("document_type")}
            aria-invalid={!!fieldError("document_type")}
            data-testid="complaint-document-type"
          >
            {DOCUMENT_TYPES.map((doc) => (
              <option key={doc.value} value={doc.value}>
                {doc.label}
              </option>
            ))}
          </select>
          {fieldError("document_type") && (
            <p className={errorClasses} role="alert">
              {fieldError("document_type")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="document_number" className={labelClasses}>
            Número de documento
          </label>
          <input
            id="document_number"
            name="document_number"
            autoComplete="off"
            className={`${inputClasses} mt-2`}
            value={values.document_number}
            onChange={set("document_number")}
            aria-invalid={!!fieldError("document_number")}
            data-testid="complaint-document-number"
          />
          {fieldError("document_number") && (
            <p className={errorClasses} role="alert">
              {fieldError("document_number")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 small:grid-cols-2 gap-5">
        <div>
          <label htmlFor="email" className={labelClasses}>
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`${inputClasses} mt-2`}
            value={values.email}
            onChange={set("email")}
            aria-invalid={!!fieldError("email")}
            data-testid="complaint-email"
          />
          {fieldError("email") && (
            <p className={errorClasses} role="alert">
              {fieldError("email")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className={labelClasses}>
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={`${inputClasses} mt-2`}
            value={values.phone}
            onChange={set("phone")}
            aria-invalid={!!fieldError("phone")}
            data-testid="complaint-phone"
          />
          {fieldError("phone") && (
            <p className={errorClasses} role="alert">
              {fieldError("phone")}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="address" className={labelClasses}>
          Dirección (distrito, provincia, departamento)
        </label>
        <input
          id="address"
          name="address"
          autoComplete="street-address"
          className={`${inputClasses} mt-2`}
          value={values.address}
          onChange={set("address")}
          aria-invalid={!!fieldError("address")}
          data-testid="complaint-address"
        />
        {fieldError("address") && (
          <p className={errorClasses} role="alert">
            {fieldError("address")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="order_reference" className={labelClasses}>
          N.° de pedido relacionado{" "}
          <span className="text-ui-fg-muted">(opcional)</span>
        </label>
        <input
          id="order_reference"
          name="order_reference"
          autoComplete="off"
          className={`${inputClasses} mt-2`}
          value={values.order_reference}
          onChange={set("order_reference")}
          aria-invalid={!!fieldError("order_reference")}
          data-testid="complaint-order-reference"
        />
        {fieldError("order_reference") && (
          <p className={errorClasses} role="alert">
            {fieldError("order_reference")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="detail" className={labelClasses}>
          Detalle del reclamo o queja
        </label>
        <textarea
          id="detail"
          name="detail"
          rows={6}
          className={`${inputClasses} mt-2 h-auto py-3`}
          value={values.detail}
          onChange={set("detail")}
          aria-invalid={!!fieldError("detail")}
          data-testid="complaint-detail"
        />
        {fieldError("detail") && (
          <p className={errorClasses} role="alert">
            {fieldError("detail")}
          </p>
        )}
      </div>

      {state.message && (
        <p className={errorClasses} role="alert" data-testid="complaint-error">
          {state.message}
        </p>
      )}

      <SubmitButton className="w-full h-12" data-testid="complaint-submit">
        Registrar {values.type === "queja" ? "queja" : "reclamo"}
      </SubmitButton>
    </form>
  )
}
