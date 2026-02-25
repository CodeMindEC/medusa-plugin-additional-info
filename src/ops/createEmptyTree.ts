import type { AITreeDocV1 } from "../types"

export function createEmptyTree(): AITreeDocV1 {
    return {
        schema: "com.mariquita.additional-info/tree@1",
        rev: 0,
        root: "root",
        nodes: {
            root: {
                id: "root",
                type: "root",
                title: "Información adicional",
                ui: { collapsed: false },
            },
        },
        children: {
            root: [],
        },
        meta: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    }
}
