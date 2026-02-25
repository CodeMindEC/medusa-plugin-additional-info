import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const PRODUCT_INFO_KEY = "mariquita:additional_info@v1"

/**
 * GET /store/products/:id/additional-info
 * 
 * Endpoint público para obtener la información adicional de un producto.
 * Requiere x-publishable-api-key en el header (validado automáticamente por Medusa).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const productId = req.params.id
    if (!productId) {
        res.status(400).json({ message: "Missing product id" })
        return
    }

    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)

    try {
        const product = await productModuleService.retrieveProduct(productId, {
            select: ["id", "metadata"],
        })

        const metadata = product?.metadata ?? {}
        const additionalInfo = metadata?.[PRODUCT_INFO_KEY] ?? null

        res.json({
            product_id: productId,
            additional_info: additionalInfo,
        })
    } catch (error) {
        res.status(404).json({ message: "Product not found" })
    }
}
