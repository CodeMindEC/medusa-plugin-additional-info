import { z } from "zod"
import { zAIBlockV1 } from "./blocks.v1"
import { zAINodeV1 } from "./tree.v1"

export const zAINodePatchV1 = z.object({
    title: z.string().optional(),
    blocks: z.array(zAIBlockV1).optional(),
    hidden: z.boolean().optional(),
})

export const zAIAdditionsV1 = z.object({
    mount: z.object({
        parentId: z.string(),
        position: z.enum(["start", "end"]).optional(),
        index: z.number().int().min(0).optional(),
    }),
    nodes: z.record(z.string(), zAINodeV1),
    children: z.record(z.string(), z.array(z.string())),
    rootIds: z.array(z.string()),
})

export const zAIDiffDocV1 = z.object({
    schema: z.literal("com.mariquita.additional-info/diff@1"),
    baseRev: z.number().int().min(0),
    overrides: z.record(z.string(), zAINodePatchV1).optional(),
    additions: zAIAdditionsV1.optional(),
    childrenOrder: z.record(z.string(), z.array(z.string())).optional(),
})

export type ZAINodePatchV1 = z.infer<typeof zAINodePatchV1>
export type ZAIDiffDocV1 = z.infer<typeof zAIDiffDocV1>
