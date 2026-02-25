import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ADDITIONAL_INFO_MODULE } from "../../../../modules/additional-info/constants"
import type AdditionalInfoService from "../../../../modules/additional-info/service"
import { CreateValuesBodySchema, CreateValueInput } from "../validators"

/**
 * GET /admin/additional-info/values
 * Supports: ?product_id=x  or  ?product_id[]=x&product_id[]=y
 * Supports: ?expand=template
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)

    const limit = Math.max(1, Number(req.query.limit ?? 20))
    const offset = Math.max(0, Number(req.query.offset ?? 0))

    // Normalise product_id to string[]
    const raw = req.query.product_id
    const productIds: string[] | undefined = raw
        ? Array.isArray(raw)
            ? (raw as string[])
            : [raw as string]
        : undefined

    const filter: Record<string, unknown> = {}
    if (productIds) {
        filter.product_id = productIds.length === 1 ? productIds[0] : { $in: productIds }
    }

    const expandParam = req.query.expand as string | undefined
    const relations = expandParam?.split(",").map((s) => s.trim()).filter(Boolean) ?? []

    const [values, count] = await service.listAndCountAdditionalInfoValues(
        filter,
        { take: limit, skip: offset, relations }
    )

    res.json({ additional_info_values: values, count, limit, offset })
}

/**
 * POST /admin/additional-info/values
 * Accepts a single object or an array of objects.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const service = req.scope.resolve<AdditionalInfoService>(ADDITIONAL_INFO_MODULE)

    // @ts-ignore - Middleware attaches validatedBody
    const validatedData = req.validatedBody as CreateValueInput[]

    // validatedData is always string[] after the transform
    const values = await service.createAdditionalInfoValues(validatedData)

    res.status(201).json({
        additional_info_values: Array.isArray(values) ? values : [values],
    })
}
