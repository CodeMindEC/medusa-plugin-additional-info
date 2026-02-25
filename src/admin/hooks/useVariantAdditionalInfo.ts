import { useEffect, useMemo, useState } from "react"
import { resolveTree } from "../../ops/resolve"
import type { AIDiffDocV1, AITreeDocV1 } from "../../types"
import type { AdminProduct, AdminProductVariant } from "@medusajs/types"
import { adminGet } from "../adapters/medusa/sdk"
import { readProductTreeFromMetadata, readVariantDiffFromMetadata } from "../adapters/medusa/read"

type AdminProductResponse = {
    product: AdminProduct
}

export function useVariantAdditionalInfo(params: { variant: AdminProductVariant }) {
    const { variant } = params
    const productId: string | undefined = variant?.product_id

    const [productData, setProductData] = useState<AdminProduct | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(!!productId)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        let cancelled = false
        if (!productId) {
            setProductData(null)
            setIsLoading(false)
            setError(null)
            return () => {
                cancelled = true
            }
        }

        setIsLoading(true)
        setError(null)
        adminGet<AdminProductResponse>(`/admin/products/${productId}`)
            .then((res) => {
                if (cancelled) return
                setProductData(res.product)
                setIsLoading(false)
            })
            .catch((err: unknown) => {
                if (cancelled) return
                setError(err instanceof Error ? err : new Error("Failed to load product"))
                setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [productId])

    const baseTree = useMemo<AITreeDocV1 | null>(() => {
        if (!productData) return null
        return readProductTreeFromMetadata(productData.metadata)
    }, [productData])

    const [diff, setDiff] = useState<AIDiffDocV1 | null>(() => {
        return readVariantDiffFromMetadata(variant?.metadata)
    })

    const effectiveTree = useMemo(() => {
        if (!baseTree) return null
        return resolveTree(baseTree, diff)
    }, [baseTree, diff])

    return {
        productId,
        baseTree,
        diff,
        setDiff,
        effectiveTree,
        isLoading,
        error,
    }
}
