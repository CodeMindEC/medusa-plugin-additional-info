import { z } from "zod"

export const zAIBlockV1 = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("md"), value: z.string() }),
    z.object({
        kind: z.literal("list"),
        style: z.enum(["bullet", "number"]),
        items: z.array(z.string()),
    }),
])

export type ZAIBlockV1 = z.infer<typeof zAIBlockV1>
