import { model } from "@medusajs/framework/utils"
import AdditionalInfoTemplate from "./additional-info-template"

const AdditionalInfoValue = model.define("additional_info_value", {
    id: model.id().primaryKey(),
    product_id: model.text(),
    template: model.belongsTo(() => AdditionalInfoTemplate, { mappedBy: "values" }),
    values: model.json().default({}),
}).indexes([
    {
        on: ["product_id"],
    },
    {
        on: ["template_id"],
    }
])

export default AdditionalInfoValue
