import { model } from "@medusajs/framework/utils"

/**
 * Registro del Libro de Reclamaciones virtual (Ley N.° 29571 y su reglamento).
 * Tabla propia del módulo: no toca tablas commerce y no referencia por FK a
 * `order` — el pedido relacionado queda como texto libre (display_id) porque
 * la queja puede venir de un invitado sin cuenta y de un pedido de otro canal.
 */
const Complaint = model
  .define("complaint", {
    id: model.id({ prefix: "cmpl" }).primaryKey(),
    // Código público que el consumidor ve en pantalla y en el acuse; incluye
    // fecha-hora y sufijo aleatorio. La unicidad se impone por índice único.
    code: model.text(),
    type: model.enum(["reclamo", "queja"]),
    full_name: model.text(),
    document_type: model.enum(["dni", "ce", "pasaporte", "ruc"]),
    document_number: model.text(),
    email: model.text(),
    phone: model.text(),
    address: model.text(),
    order_reference: model.text().nullable(),
    detail: model.text(),
  })
  .indexes([
    {
      on: ["code"],
      unique: true,
    },
    {
      on: ["email"],
    },
    {
      on: ["document_type", "document_number"],
    },
  ])

export default Complaint
