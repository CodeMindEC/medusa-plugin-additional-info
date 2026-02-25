import { useQuery } from "@tanstack/react-query"
import { adminGet } from "../adapters/medusa/sdk"

export type ProductListItem = {
    id: string
    title: string
    handle?: string | null
    status?: string | null
    thumbnail?: string | null
}

export type ProductsResponse = {
    products: ProductListItem[]
    count: number
    offset: number
    limit: number
}

export type ProductsQuery = {
    limit?: number
    offset?: number
    q?: string
    fields?: string
    status?: string
}

const PRODUCT_KEYS = {
    list: (query?: ProductsQuery) => ["products", query ?? {}] as const,
}

export function useProducts(query?: ProductsQuery) {
    return useQuery<ProductsResponse>({
        queryKey: PRODUCT_KEYS.list(query),
        queryFn: async () => {
            const response = await adminGet<ProductsResponse>("/admin/products", query)
            return response
        },
    })
}
