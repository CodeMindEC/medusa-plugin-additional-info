import { defineMiddlewares, authenticate, validateAndTransformBody } from "@medusajs/framework/http"
import { CreateTemplateSchema, CreateValueSchema } from "./admin/additional-info/validators"
import { z } from "@medusajs/framework/zod"

export default defineMiddlewares({
    routes: [
        {
            matcher: "/admin/additional-info*",
            middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
        },
        {
            method: "POST",
            matcher: "/admin/additional-info/templates",
            middlewares: [validateAndTransformBody(CreateTemplateSchema)],
        },
        {
            method: "POST",
            matcher: "/admin/additional-info/values",
            middlewares: [validateAndTransformBody(z.object({ values: z.array(CreateValueSchema) }))],
        },
    ],
})
