import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminGet, adminPost, adminUpdate } from "../adapters/medusa/sdk"

export type AdditionalInfoTemplateRef = {
    id: string
    name: string
}

export type AdditionalInfoValue = {
    id: string
    product_id: string
    template_id?: string | null
    template?: AdditionalInfoTemplateRef | null
    values?: Record<string, string | number | boolean | null>
}

export type AdditionalInfoValuesResponse = {
    additional_info_values: AdditionalInfoValue[]
    count: number
    offset: number
    limit: number
}

export type AdditionalInfoValuesQuery = {
    limit?: number
    offset?: number
    expand?: string
    product_id?: string | string[]
}

export type AdditionalInfoValueInput = {
    product_id: string
    template_id: string
    values: Record<string, string | number | boolean | null>
}

export type AdditionalInfoValueUpdate = {
    template_id?: string
    values?: Record<string, string | number | boolean | null>
}

const VALUE_KEYS = {
    list: (query?: AdditionalInfoValuesQuery) => ["additional_info_values", query ?? {}] as const,
}

export function useAdditionalInfoValues(query?: AdditionalInfoValuesQuery, options?: { enabled?: boolean }) {
    return useQuery<AdditionalInfoValuesResponse>({
        queryKey: VALUE_KEYS.list(query),
        queryFn: async () => {
            const response = await adminGet<AdditionalInfoValuesResponse>("/admin/additional-info/values", query)
            return response
        },
        enabled: options?.enabled,
    })
}

export function useCreateAdditionalInfoValues(options?: { onSuccess?: (values: AdditionalInfoValue[]) => void }) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: AdditionalInfoValueInput[]) => {
            const response = await adminPost<{ additional_info_values: AdditionalInfoValue[] }>(
                "/admin/additional-info/values",
                payload
            )
            return response.additional_info_values
        },
        onSuccess: (values) => {
            queryClient.invalidateQueries({ queryKey: VALUE_KEYS.list() })
            options?.onSuccess?.(values)
        },
    })
}

export function useUpdateAdditionalInfoValue(options?: { onSuccess?: (value: AdditionalInfoValue) => void }) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: AdditionalInfoValueUpdate }) => {
            const response = await adminUpdate<{ additional_info_value: AdditionalInfoValue }>(
                `/admin/additional-info/values/${id}`,
                payload
            )
            return response.additional_info_value
        },
        onSuccess: (value) => {
            queryClient.invalidateQueries({ queryKey: VALUE_KEYS.list() })
            options?.onSuccess?.(value)
        },
    })
}
