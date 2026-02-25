import type { AIDiffDocV1, AITreeDocV1 } from "../types"
import { pruneHidden } from "./prune"

function deepClone<T>(value: T): T {
    const g: any = globalThis as any
    if (typeof g.structuredClone === "function") return g.structuredClone(value)
    return JSON.parse(JSON.stringify(value)) as T
}

function ensureChildrenArray(tree: AITreeDocV1, parentId: string) {
    if (!Array.isArray(tree.children[parentId])) tree.children[parentId] = []
}

function insertMany(arr: string[], items: string[], index: number) {
    const i = Math.max(0, Math.min(index, arr.length))
    arr.splice(i, 0, ...items)
}

function reorderChildren(current: string[], desiredOrder: string[]) {
    if (!current.length || !desiredOrder.length) return current
    const currentSet = new Set(current)
    const seen = new Set<string>()
    const ordered: string[] = []

    for (const id of desiredOrder) {
        if (seen.has(id)) continue
        seen.add(id)
        if (currentSet.has(id)) ordered.push(id)
    }

    const rest = current.filter((id) => !seen.has(id))
    return ordered.concat(rest)
}

function applyChildrenOrder(tree: AITreeDocV1, orderMap: Record<string, string[]>) {
    for (const [parentId, desiredOrder] of Object.entries(orderMap)) {
        const current = tree.children[parentId]
        if (!Array.isArray(current) || !Array.isArray(desiredOrder)) continue
        tree.children[parentId] = reorderChildren(current, desiredOrder)
    }
}

export function resolveTree(base: AITreeDocV1, diff?: AIDiffDocV1 | null): AITreeDocV1 {
    const out = deepClone(base)
    out.meta = out.meta ?? {}
    out.meta.updatedAt = new Date().toISOString()

    if (!diff) return out

    const hidden = new Set<string>()

    // 1) Apply overrides
    for (const [nodeId, patch] of Object.entries(diff.overrides ?? {})) {
        const node = out.nodes[nodeId]
        if (!node) continue

        if (patch.title !== undefined) node.title = patch.title
        if (patch.blocks !== undefined) node.blocks = patch.blocks // [] clears
        if (patch.hidden === true) hidden.add(nodeId)
    }

    // 2) Prune hidden subtrees
    const pruned = pruneHidden(out, hidden)

    // 3) Mount additions (optional)
    if (diff.additions) {
        const add = diff.additions
        const parentId = add.mount.parentId
        ensureChildrenArray(pruned, parentId)

        // Collision guard
        for (const id of Object.keys(add.nodes)) {
            if (pruned.nodes[id]) {
                throw new Error(`Additions node id collision: '${id}' already exists in base tree`)
            }
        }

        // Merge nodes
        Object.assign(pruned.nodes, add.nodes)

        // Merge children (ensure arrays)
        for (const [pid, childIds] of Object.entries(add.children)) {
            pruned.children[pid] = Array.isArray(pruned.children[pid]) ? pruned.children[pid] : []
            pruned.children[pid].push(...childIds)
        }

        // Mount rootIds at parent
        const roots = add.rootIds ?? []
        const list = pruned.children[parentId]

        if (add.mount.index !== undefined) {
            insertMany(list, roots, add.mount.index)
        } else if (add.mount.position === "start") {
            insertMany(list, roots, 0)
        } else {
            // end default
            insertMany(list, roots, list.length)
        }
    }

    if (diff.childrenOrder) {
        applyChildrenOrder(pruned, diff.childrenOrder)
    }

    return pruned
}
