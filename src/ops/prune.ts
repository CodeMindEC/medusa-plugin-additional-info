import type { AITreeDocV1 } from "../types"

function deepClone<T>(value: T): T {
    const g: any = globalThis as any
    if (typeof g.structuredClone === "function") return g.structuredClone(value)
    return JSON.parse(JSON.stringify(value)) as T
}

export function collectSubtreeIds(tree: AITreeDocV1, startId: string): Set<string> {
    const out = new Set<string>()
    const stack = [startId]
    while (stack.length) {
        const id = stack.pop()!
        if (out.has(id)) continue
        out.add(id)
        const kids = tree.children[id] ?? []
        for (const k of kids) stack.push(k)
    }
    return out
}

/**
 * Removes any hidden node AND its full subtree from nodes + children,
 * and removes references from parents.
 */
export function pruneHidden(tree: AITreeDocV1, hiddenIds: Set<string>): AITreeDocV1 {
    if (!hiddenIds.size) return deepClone(tree)

    const next = deepClone(tree)
    const toRemove = new Set<string>()

    for (const id of hiddenIds) {
        if (id === next.root) continue // never remove root
        if (!next.nodes[id]) continue
        const ids = collectSubtreeIds(next, id)
        for (const x of ids) toRemove.add(x)
    }

    // remove refs from parents
    for (const [parentId, childIds] of Object.entries(next.children)) {
        next.children[parentId] = childIds.filter((cid) => !toRemove.has(cid))
    }

    // delete nodes and children maps
    for (const id of toRemove) {
        delete next.nodes[id]
        delete next.children[id]
    }

    return next
}
