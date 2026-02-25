import { describe, it, expect } from "vitest"
import { createEmptyTree, validateTreeDocV1 } from ".."

describe("validateTreeDocV1", () => {
    it("validates an empty tree", () => {
        const t = createEmptyTree()
        const v = validateTreeDocV1(t)
        expect(v.ok).toBe(true)
    })

    it("fails when root is missing", () => {
        const t = createEmptyTree()
        delete (t.nodes as any).root

        const v = validateTreeDocV1(t)
        expect(v.ok).toBe(false)
        if (!v.ok) {
            expect(v.issues.some((i) => i.path.includes("nodes.root"))).toBe(true)
        }
    })

    it("fails when children references a missing node", () => {
        const t = createEmptyTree()
        t.children.root.push("missing")

        const v = validateTreeDocV1(t)
        expect(v.ok).toBe(false)
    })
})
