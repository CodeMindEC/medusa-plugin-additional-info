import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDITIONAL_INFO_MODULE } from "../../../../../modules/additional-info/constants"
import type AdditionalInfoService from "../../../../../modules/additional-info/service"
import { UpdateTemplateSchema } from "../../validators"

/**
 * GET /admin/additional-info/templates/:id
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)
    const { id } = req.params

    try {
        const template = await service.retrieveAdditionalInfoTemplate(id)
        res.json({ additional_info_template: template })
    } catch {
        res.status(404).json({ message: `Template '${id}' not found` })
    }
}

/**
 * POST /admin/additional-info/templates/:id
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)
    const { id } = req.params

    const parsed = UpdateTemplateSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() })
        return
    }

    const { name, description, attributes } = parsed.data

    // Build partial update — only send fields that were provided
    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (attributes !== undefined) update.attributes = attributes

    const template = await service.updateAdditionalInfoTemplates({ id }, update)

    res.json({ additional_info_template: template })
}

/**
 * DELETE /admin/additional-info/templates/:id
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)
    const { id } = req.params

    await service.deleteAdditionalInfoTemplates({ id })

    res.json({ id, object: "additional_info_template", deleted: true })
}
