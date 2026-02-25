import { defineLink, Modules } from "@medusajs/framework/utils"
import { ADDITIONAL_INFO_MODULE } from "../modules/additional-info/constants"

export default defineLink(
  {
    linkable: {
      serviceName: ADDITIONAL_INFO_MODULE,
      field: "additional_info_value",
      linkable: "additional_info_value_id",
      primaryKey: "id",
    },
    isList: true, // A product can have multiple additional info values (for different templates)
  },
  {
    serviceName: Modules.PRODUCT,
    field: "product",
    linkable: "product_id",
    primaryKey: "id",
  }
)
