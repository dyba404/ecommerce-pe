import { Metadata } from "next"

import ComplaintForm from "@modules/libro-reclamaciones/components/complaint-form"

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Libro de Reclamaciones virtual conforme a la Ley N.° 29571. Registra tu reclamo o queja y recibe un código de seguimiento.",
}

export default function LibroReclamacionesPage() {
  return (
    <div className="content-container py-12 sm:py-16">
      <div className="max-w-xl mx-auto flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl-semi">Libro de Reclamaciones</h1>
          <p className="text-base-regular text-ui-fg-subtle">
            Conforme a la Ley N.° 29571 y su reglamento, ponemos a tu
            disposición este Libro de Reclamaciones virtual. Completa el
            formulario y recibirás un código de registro, además de un acuse de
            recibo en tu correo electrónico.
          </p>
        </div>
        <ComplaintForm />
      </div>
    </div>
  )
}
