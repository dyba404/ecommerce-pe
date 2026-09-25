import { MedusaService } from "@medusajs/framework/utils"

import Complaint from "./models/complaint"

class LibroReclamacionesService extends MedusaService({ Complaint }) {}

export default LibroReclamacionesService
