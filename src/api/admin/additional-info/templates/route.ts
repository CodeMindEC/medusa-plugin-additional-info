import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDITIONAL_INFO_MODULE } from "../../../../modules/additional-info/constants"
import type AdditionalInfoService from "../../../../modules/additional-info/service"
import { CreateTemplateSchema } from "../validators"

/**
 * GET /admin/additional-info/templates
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)

    const limit = Math.max(1, Number(req.query.limit ?? 50))
    const offset = Math.max(0, Number(req.query.offset ?? 0))

    const [templates, count] = await service.listAndCountAdditionalInfoTemplates(
        {},
        { take: limit, skip: offset, order: { created_at: "DESC" } }
    )

    res.json({ additional_info_templates: templates, count, limit, offset })
}

/**
 * POST /admin/additional-info/templates
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)

    // @ts-ignore - Middleware attaches validatedBody
    const { name, description, attributes } = req.validatedBody

    const template = await service.createAdditionalInfoTemplates({
        name,
        description: description ?? null,
        attributes,
    })

    res.status(201).json({ additional_info_template: template })
}
