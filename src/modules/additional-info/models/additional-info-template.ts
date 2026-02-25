import { model } from "@medusajs/framework/utils"
import AdditionalInfoValue from "./additional-info-value"

const AdditionalInfoTemplate = model.define("additional_info_template", {
    id: model.id().primaryKey(),
    name: model.text(),
    description: model.text().nullable(),
    attributes: model.json().default({}),
    values: model.hasMany(() => AdditionalInfoValue, { mappedBy: "template" }),
}).indexes([
    {
        on: ["name"],
    }
])

export default AdditionalInfoTemplate
 