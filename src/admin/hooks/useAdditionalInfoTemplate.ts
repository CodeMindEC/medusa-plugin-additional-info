import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminDelete, adminGet, adminPost, adminUpdate, type QueryParams } from "../adapters/medusa/sdk"

type AdditionalInfoAttributeInput = {
    id?: string
    label?: string
    type?: string
    required?: boolean
    options?: string[]
    children?: AdditionalInfoAttributeInput[]
}

type AdditionalInfoAttributePrimitive = string | number | boolean | null

type AdditionalInfoTemplateAttributes =
    | AdditionalInfoAttributeInput[]
    | Record<string, AdditionalInfoAttributeInput | AdditionalInfoAttributePrimitive>

type AdditionalInfoTemplatesQuery = QueryParams

export type AdditionalInfoTemplate = {
    id: string
    name: string
    description: string | null
    attributes: AdditionalInfoTemplateAttributes
    created_at: string
    updated_at: string
}

type AdditionalInfoTemplateInput = {
    name: string
    description?: string | null
    attributes: AdditionalInfoTemplateAttributes
}

const TEMPLATE_KEYS = {
    list: (query?: AdditionalInfoTemplatesQuery) => ["additional_info_templates", query ?? {}] as const,
    detail: (id: string) => ["additional_info_template", id] as const,
}

export function useAdditionalInfoTemplates(query?: AdditionalInfoTemplatesQuery) {
    return useQuery<{ additional_info_templates: AdditionalInfoTemplate[]; count: number }>({
        queryKey: TEMPLATE_KEYS.list(query),
        queryFn: async () => {
            const response = await adminGet<{
                additional_info_templates: AdditionalInfoTemplate[]
                count: number
            }>("/admin/additional-info/templates", query)
            return response
        },
    })
}

export function useCreateAdditionalInfoTemplate(options?: { onSuccess?: (template: AdditionalInfoTemplate) => void }) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: AdditionalInfoTemplateInput) => {
            const response = await adminPost<{ additional_info_template: AdditionalInfoTemplate }>(
                "/admin/additional-info/templates",
                payload
            )
            return response.additional_info_template
        },
        onSuccess: (template) => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.list() })
            if (template?.id) {
                queryClient.setQueryData(TEMPLATE_KEYS.detail(template.id), template)
            }
            options?.onSuccess?.(template)
        },
    })
}

export function useUpdateAdditionalInfoTemplate(
    id?: string,
    options?: { onSuccess?: (template: AdditionalInfoTemplate) => void }
) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id: mutationId,
            payload,
        }: {
            id?: string
            payload: AdditionalInfoTemplateInput
        }) => {
            const targetId = mutationId || id
            if (!targetId) throw new Error("ID is required to update the template")
            const response = await adminUpdate<{ additional_info_template: AdditionalInfoTemplate }>(
                `/admin/additional-info/templates/${targetId}`,
                payload
            )
            return response.additional_info_template
        },
        onSuccess: (template) => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.list() })
            if (template?.id) {
                queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.detail(template.id) })
            }
            options?.onSuccess?.(template)
        },
    })
}

export function useDeleteAdditionalInfoTemplate(options?: { onSuccess?: (id: string) => void }) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await adminDelete(`/admin/additional-info/templates/${id}`)
            return id
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.list() })
            if (id) queryClient.removeQueries({ queryKey: TEMPLATE_KEYS.detail(id) })
            options?.onSuccess?.(id)
        },
    })
}
