import { Metadata } from "next"

import { getStoreName } from "@lib/util/site"
import ComplaintForm from "@modules/libro-reclamaciones/components/complaint-form"

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Libro de Reclamaciones virtual conforme a la Ley N.° 29571. Registra tu reclamo o queja y recibe un código de seguimiento.",
}

export default function LibroReclamacionesPage() {
  return (
    <div className="content-container py-12 small:py-20">
      <div className="max-w-xl mx-auto flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-3">
          <h1 className="font-display text-4xl small:text-5xl tracking-tight text-ui-fg-base">
            Libro de Reclamaciones
          </h1>
          <p className="text-base-regular text-ui-fg-subtle">
            Conforme a la Ley N.° 29571 y su reglamento, {getStoreName()} pone
            a tu disposición este Libro de Reclamaciones virtual. Completa el
            formulario y recibirás de inmediato un código de registro y, si es
            posible, un acuse de recibo en tu correo electrónico.
          </p>
          <p className="text-small-regular text-ui-fg-muted">
            Un reclamo expresa disconformidad con un producto o servicio; una
            queja expresa malestar con la atención recibida.
          </p>
        </div>
        <ComplaintForm />
      </div>
    </div>
  )
}
