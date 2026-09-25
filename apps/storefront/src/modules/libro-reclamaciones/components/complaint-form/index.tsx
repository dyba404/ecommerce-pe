"use client"

import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { Button, clx } from "@modules/common/components/ui"
import { sdk } from "@lib/config"
import { useRef, useState } from "react"

type ComplaintResponse = {
  complaint: {
    code: string
    type: string
    created_at: string
  }
  acknowledgement_sent: boolean
}

type ServerError = {
  type?: string
  message?: string
  errors?: Record<string, string[]>
}

const inputClass =
  "w-full h-10 px-4 pt-4 pb-1 text-base-regular bg-ui-bg-field border border-ui-border-base rounded-md hover:bg-ui-bg-field-hover focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"

export default function ComplaintForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [registered, setRegistered] = useState<ComplaintResponse | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const response = await sdk.client.fetch<ComplaintResponse>(
        "/store/libro-reclamaciones",
        { method: "POST", body: data }
      )
      setRegistered(response)
      formRef.current?.reset()
    } catch (error) {
      const serverError = (error ?? {}) as ServerError
      if (serverError?.errors) {
        setFieldErrors(serverError.errors)
      }
      setFormError(
        serverError?.message ??
          "No pudimos registrar tu reclamo. Inténtalo de nuevo."
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (registered) {
    return (
      <div className="flex flex-col gap-y-4 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-6">
        <h2 className="text-xl-semi">Reclamo registrado</h2>
        <p className="text-base-regular text-ui-fg-subtle">
          Tu {registered.complaint.type === "queja" ? "queja" : "reclamo"} se
          registró correctamente. Tu código de seguimiento es:
        </p>
        <p className="text-lg-semi font-mono bg-ui-bg-base border border-ui-border-base rounded-md px-4 py-3 w-fit">
          {registered.complaint.code}
        </p>
        <p className="text-small-regular text-ui-fg-muted">
          {registered.acknowledgement_sent
            ? "Te enviamos un acuse de recibo a tu correo electrónico. Responderemos dentro del plazo de 30 días calendario, conforme a la Ley N.° 29571."
            : "Guarda este código. Responderemos dentro del plazo de 30 días calendario, conforme a la Ley N.° 29571."}
        </p>
        <Button
          variant="secondary"
          onClick={() => setRegistered(null)}
          className="w-fit"
        >
          Registrar otro reclamo
        </Button>
      </div>
    )
  }

  const errorText = (name: string) =>
    fieldErrors[name]?.[0] ? (
      <span className="text-small-regular text-ui-fg-error">
        {fieldErrors[name][0]}
      </span>
    ) : null

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="flex flex-col gap-y-6"
      noValidate
    >
      <fieldset className="flex flex-col gap-y-2">
        <legend className="text-small-plus txt-ui-fg-base mb-1">
          Tipo de registro
        </legend>
        <div className="flex gap-x-6">
          <label className="flex items-center gap-x-2 text-base-regular">
            <input type="radio" name="type" value="reclamo" required />
            Reclamo
          </label>
          <label className="flex items-center gap-x-2 text-base-regular">
            <input type="radio" name="type" value="queja" required />
            Queja
          </label>
        </div>
        {errorText("type")}
      </fieldset>

      <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1">
          <Input
            label="Nombres y apellidos"
            name="full_name"
            required
            minLength={3}
            maxLength={120}
            autoComplete="name"
          />
          {errorText("full_name")}
        </div>
        <div className="flex flex-col gap-y-1">
          <span className="text-small-regular text-ui-fg-base">
            Documento de identidad
          </span>
          <div className="grid grid-cols-[7rem_1fr] gap-x-2">
            <NativeSelect
              name="document_type"
              required
              defaultValue="dni"
              aria-label="Tipo de documento"
            >
              <option value="dni">DNI</option>
              <option value="ce">CE</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="ruc">RUC</option>
            </NativeSelect>
            <Input
              label="Número"
              name="document_number"
              required
              minLength={6}
              maxLength={12}
              autoComplete="off"
            />
          </div>
          {errorText("document_type")}
          {errorText("document_number")}
        </div>
        <div className="flex flex-col gap-y-1">
          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            required
            maxLength={120}
            autoComplete="email"
          />
          {errorText("email")}
        </div>
        <div className="flex flex-col gap-y-1">
          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            required
            maxLength={15}
            autoComplete="tel"
          />
          {errorText("phone")}
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <Input
          label="Dirección (distrito, provincia, departamento)"
          name="address"
          required
          minLength={5}
          maxLength={200}
          autoComplete="street-address"
        />
        {errorText("address")}
      </div>

      <div className="flex flex-col gap-y-1">
        <Input
          label="Pedido relacionado (opcional, ej. #1042)"
          name="order_reference"
          maxLength={60}
        />
        {errorText("order_reference")}
      </div>

      <div className="flex flex-col gap-y-1">
        <label htmlFor="detail" className="text-small-regular text-ui-fg-base">
          Detalle del reclamo o queja
        </label>
        <textarea
          id="detail"
          name="detail"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className={clx(inputClass, "py-2 h-auto")}
        />
        {errorText("detail")}
      </div>

      {formError && (
        <p className="text-small-regular text-ui-fg-error">{formError}</p>
      )}

      <Button type="submit" isLoading={submitting} size="large">
        Enviar reclamo o queja
      </Button>
    </form>
  )
}
