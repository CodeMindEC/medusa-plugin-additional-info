import { describe, it, expect } from "vitest"
import { createEmptyTree, resolveTree } from ".."

describe("resolveTree", () => {
    it("returns base when no diff", () => {
        const base = createEmptyTree()
        const out = resolveTree(base, null)
        expect(out.nodes.root.title).toBe("Información adicional")
        expect(out.children.root).toEqual([])
    })

    it("applies overrides (title)", () => {
        const base = createEmptyTree()
        base.nodes["a"] = { id: "a", type: "section", title: "Ingredientes" }
        base.children.root.push("a")

        const out = resolveTree(base, {
            schema: "com.mariquita.additional-info/diff@1",
            baseRev: base.rev,
            overrides: { a: { title: "Ingredientes (Variante)" } },
        })

        expect(out.nodes.a.title).toBe("Ingredientes (Variante)")
    })

    it("hides a node and its subtree", () => {
        const base = createEmptyTree()
        base.nodes["a"] = { id: "a", type: "section", title: "A" }
        base.nodes["b"] = { id: "b", type: "item", title: "B" }
        base.children.root.push("a")
        base.children["a"] = ["b"]

        const out = resolveTree(base, {
            schema: "com.mariquita.additional-info/diff@1",
            baseRev: base.rev,
            overrides: { a: { hidden: true } },
        })

        expect(out.nodes.a).toBeUndefined()
        expect(out.nodes.b).toBeUndefined()
        expect(out.children.root).toEqual([])
    })

    it("mounts additions", () => {
        const base = createEmptyTree()

        const out = resolveTree(base, {
            schema: "com.mariquita.additional-info/diff@1",
            baseRev: base.rev,
            additions: {
                mount: { parentId: "root", position: "end" },
                rootIds: ["x"],
                nodes: {
                    x: { id: "x", type: "section", title: "Solo variante" },
                },
                children: {
                    x: [],
                },
            },
        })

        expect(out.nodes.x.title).toBe("Solo variante")
        expect(out.children.root).toEqual(["x"])
    })

    it("applies children order overrides", () => {
        const base = createEmptyTree()
        base.nodes["a"] = { id: "a", type: "section", title: "A" }
        base.nodes["b"] = { id: "b", type: "section", title: "B" }
        base.nodes["c"] = { id: "c", type: "section", title: "C" }
        base.children.root = ["a", "b", "c"]

        const out = resolveTree(base, {
            schema: "com.mariquita.additional-info/diff@1",
            baseRev: base.rev,
            childrenOrder: {
                root: ["c", "a"],
            },
        })

        expect(out.children.root).toEqual(["c", "a", "b"])
    })
})
