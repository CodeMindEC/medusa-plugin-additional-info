import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDITIONAL_INFO_MODULE } from "../../../../../modules/additional-info/constants"
import type AdditionalInfoService from "../../../../../modules/additional-info/service"
import { UpdateValueSchema } from "../../validators"

/**
 * POST /admin/additional-info/values/:id
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)
    const { id } = req.params

    const parsed = UpdateValueSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() })
        return
    }

    const { template_id, values } = parsed.data

    const update: Record<string, unknown> = {}
    if (template_id !== undefined) update.template_id = template_id
    if (values !== undefined) update.values = values

    const value = await service.updateAdditionalInfoValues({ id }, update)

    res.json({ additional_info_value: value })
}

/**
 * DELETE /admin/additional-info/values/:id
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)
    const { id } = req.params

    await service.deleteAdditionalInfoValues({ id })

    res.json({ id, object: "additional_info_value", deleted: true })
}
