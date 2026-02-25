import { MedusaService } from "@medusajs/framework/utils"
import { AdditionalInfoTemplate, AdditionalInfoValue } from "./models"

class AdditionalInfoService extends MedusaService({
    AdditionalInfoTemplate,
    AdditionalInfoValue,
}) { }

export default AdditionalInfoService
