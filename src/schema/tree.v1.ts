import { z } from "zod"
import { zAIBlockV1 } from "./blocks.v1"

export const zAINodeV1 = z.object({
    id: z.string(),
    type: z.enum(["root", "section", "item"]),
    title: z.string(),
    blocks: z.array(zAIBlockV1).optional(),
    tags: z.array(z.string()).optional(),
    ui: z
        .object({
            icon: z.string().optional(),
            collapsed: z.boolean().optional(),
        })
        .optional(),
})

export const zAITreeDocV1 = z.object({
    schema: z.literal("com.mariquita.additional-info/tree@1"),
    rev: z.number().int().min(0),
    root: z.literal("root"),
    nodes: z.record(z.string(), zAINodeV1),
    children: z.record(z.string(), z.array(z.string())),
    meta: z
        .object({
            createdAt: z.string().optional(),
            updatedAt: z.string().optional(),
        })
        .optional(),
})

export type ZAINodeV1 = z.infer<typeof zAINodeV1>
export type ZAITreeDocV1 = z.infer<typeof zAITreeDocV1>
