import { Module } from "@medusajs/framework/utils"

import LibroReclamacionesService from "./service"

export const LIBRO_RECLAMACIONES_MODULE = "libroReclamaciones"

export default Module(LIBRO_RECLAMACIONES_MODULE, {
  service: LibroReclamacionesService,
})
