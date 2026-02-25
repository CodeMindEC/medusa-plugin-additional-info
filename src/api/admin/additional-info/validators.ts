import { z } from "zod"

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const AttributesSchema = z.record(z.unknown()).default({})

// ---------------------------------------------------------------------------
// Template schemas
// ---------------------------------------------------------------------------

export const CreateTemplateSchema = z.object({
    name: z.string().min(1, "name is required"),
    description: z.string().nullable().optional(),
    attributes: AttributesSchema,
})

export const UpdateTemplateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    attributes: z.record(z.unknown()).optional(),
})

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>

// ---------------------------------------------------------------------------
// Value schemas
// ---------------------------------------------------------------------------

export const ValuesMapSchema = z.record(
    z.union([z.string(), z.number(), z.boolean(), z.null()])
).default({})

export const CreateValueSchema = z.object({
    product_id: z.string().min(1, "product_id is required"),
    template_id: z.string().optional(),
    values: ValuesMapSchema,
})

/** POST body can be a single value or an array */
export const CreateValuesBodySchema = z.union([
    z.array(CreateValueSchema).min(1),
    CreateValueSchema.transform((v) => [v]),
])

export const UpdateValueSchema = z.object({
    template_id: z.string().optional(),
    values: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
})

export type CreateValueInput = z.infer<typeof CreateValueSchema>
export type UpdateValueInput = z.infer<typeof UpdateValueSchema>
