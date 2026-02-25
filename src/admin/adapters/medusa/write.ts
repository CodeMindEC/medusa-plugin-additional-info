import type { AIDiffDocV1, AITreeDocV1 } from "../../../types"
import { adminUpdate, type JsonObject, type JsonValue } from "./sdk"
import { isDiffEmpty } from "./read"
import { LEGACY_INFO_KEY, PRODUCT_INFO_KEY } from "./keys"

type AdminProductUpdateResponse = {
    product?: {
        id: string
        metadata?: Record<string, JsonValue>
    }
}

type AdminVariantUpdateResponse = {
    product_variant?: {
        id: string
        metadata?: Record<string, JsonValue>
    }
}

function nowIso() {
    return new Date().toISOString()
}

function toJsonObject(input: Record<string, unknown> | null | undefined): JsonObject {
    if (!input) return {}
    const out: JsonObject = {}
    for (const [key, value] of Object.entries(input)) {
        if (value === undefined) continue
        out[key] = value as JsonValue
    }
    return out
}

export async function saveProductTree(params: {
    productId: string
    currentMetadata: Record<string, unknown> | null | undefined
    tree: AITreeDocV1
}): Promise<AdminProductUpdateResponse> {
    const { productId, currentMetadata, tree } = params
    const meta = toJsonObject(currentMetadata)

    tree.meta = tree.meta ?? {}
    tree.meta.updatedAt = nowIso()
    if (!tree.meta.createdAt) tree.meta.createdAt = nowIso()

    delete meta[LEGACY_INFO_KEY]
    meta[PRODUCT_INFO_KEY] = tree

    return adminUpdate<AdminProductUpdateResponse>(`/admin/products/${productId}`, {
        metadata: meta,
    })
}

export async function saveVariantDiff(params: {
    variantId: string
    currentMetadata: Record<string, unknown> | null | undefined
    diff: AIDiffDocV1 | null
}): Promise<AdminVariantUpdateResponse> {
    const { variantId, currentMetadata, diff } = params
    const meta = toJsonObject(currentMetadata)

    // Para evitar duplicacion, si no hay nada, guardamos null.
    delete meta[LEGACY_INFO_KEY]
    meta[PRODUCT_INFO_KEY] = isDiffEmpty(diff) ? null : diff

    return adminUpdate<AdminVariantUpdateResponse>(`/admin/product-variants/${variantId}`, {
        metadata: meta,
    })
}
