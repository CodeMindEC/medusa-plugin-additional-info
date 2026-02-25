import { Module } from "@medusajs/framework/utils"
import AdditionalInfoService from "./service"
import { ADDITIONAL_INFO_MODULE } from "./constants"

export { ADDITIONAL_INFO_MODULE }
export { default as AdditionalInfoService } from "./service"

export default Module(ADDITIONAL_INFO_MODULE, {
    service: AdditionalInfoService,
})
