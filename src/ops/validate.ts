import type { AIDiffDocV1, AITreeDocV1, ValidationIssue, ValidationResult } from "../types"
import { zAIDiffDocV1, zAITreeDocV1 } from "../schema"

function issue(path: string, message: string): ValidationIssue {
    return { path, message }
}

function unique(arr: string[]) {
    return Array.from(new Set(arr))
}

function detectCycles(tree: AITreeDocV1): string[] {
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const cycles: string[] = []

    function dfs(id: string, stack: string[]) {
        if (visiting.has(id)) {
            cycles.push([...stack, id].join(" -> "))
            return
        }
        if (visited.has(id)) return

        visiting.add(id)
        const children = tree.children[id] ?? []
        for (const c of children) {
            dfs(c, [...stack, id])
        }
        visiting.delete(id)
        visited.add(id)
    }

    dfs(tree.root, [])
    return cycles
}

export function validateTreeDocV1(input: unknown): ValidationResult {
    const parsed = zAITreeDocV1.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            issues: parsed.error.issues.map((i) => issue(i.path.join("."), i.message)),
        }
    }

    const tree = parsed.data
    const issues: ValidationIssue[] = []

    // root node
    const rootNode = tree.nodes[tree.root]
    if (!rootNode) {
        issues.push(issue("nodes.root", "Missing root node"))
    } else if (rootNode.type !== "root") {
        issues.push(issue("nodes.root.type", "Root node must have type 'root'"))
    }

    // children[root] exists
    if (!Array.isArray(tree.children[tree.root])) {
        issues.push(issue("children.root", "children[root] must exist and be an array"))
    }

    // all children references exist
    for (const [parentId, childIds] of Object.entries(tree.children)) {
        if (!tree.nodes[parentId]) {
            issues.push(issue(`children.${parentId}`, `Parent '${parentId}' not found in nodes`))
        }
        const duplicates = childIds.filter((id, idx) => childIds.indexOf(id) !== idx)
        if (duplicates.length) {
            issues.push(issue(`children.${parentId}`, `Duplicate child ids: ${unique(duplicates).join(", ")}`))
        }
        for (const childId of childIds) {
            if (!tree.nodes[childId]) {
                issues.push(issue(`children.${parentId}`, `Child '${childId}' not found in nodes`))
            }
        }
    }

    // cycle detection (optional but pro)
    const cycles = detectCycles(tree)
    if (cycles.length) {
        issues.push(issue("children", `Cycles detected: ${cycles.join(" | ")}`))
    }

    return issues.length ? { ok: false, issues } : { ok: true }
}

export function parseTreeDocV1(input: unknown): AITreeDocV1 {
    const v = validateTreeDocV1(input)
    if (!v.ok) {
        const msg = v.issues.map((i) => `${i.path}: ${i.message}`).join("\n")
        throw new Error(`Invalid AITreeDocV1\n${msg}`)
    }
    return input as AITreeDocV1
}

export function validateDiffDocV1(input: unknown): ValidationResult {
    const parsed = zAIDiffDocV1.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            issues: parsed.error.issues.map((i) => issue(i.path.join("."), i.message)),
        }
    }
    return { ok: true }
}

export function parseDiffDocV1(input: unknown): AIDiffDocV1 {
    const v = validateDiffDocV1(input)
    if (!v.ok) {
        const msg = v.issues.map((i) => `${i.path}: ${i.message}`).join("\n")
        throw new Error(`Invalid AIDiffDocV1\n${msg}`)
    }
    return input as AIDiffDocV1
}
