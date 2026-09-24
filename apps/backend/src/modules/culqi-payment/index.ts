import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { CulqiPaymentService } from "./service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [CulqiPaymentService],
});
