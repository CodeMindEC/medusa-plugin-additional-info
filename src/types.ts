export type AIBlockV1 =
    | { kind: "md"; value: string }
    | { kind: "list"; style: "bullet" | "number"; items: string[] }

export type AINodeTypeV1 = "root" | "section" | "item"

export type AINodeV1 = {
    id: string
    type: AINodeTypeV1
    title: string
    blocks?: AIBlockV1[]
    tags?: string[]
    ui?: {
        icon?: string
        collapsed?: boolean
    }
}

export type AITreeDocV1 = {
    schema: "com.mariquita.additional-info/tree@1"
    rev: number
    root: "root"
    nodes: Record<string, AINodeV1>
    children: Record<string, string[]>
    meta?: {
        createdAt?: string
        updatedAt?: string
    }
}

export type AINodePatchV1 = {
    title?: string
    blocks?: AIBlockV1[] // [] significa "clear"
    hidden?: boolean
}

export type AIAdditionsV1 = {
    mount: { parentId: string; position?: "start" | "end"; index?: number }
    nodes: Record<string, AINodeV1>
    children: Record<string, string[]>
    rootIds: string[]
}

export type AIDiffDocV1 = {
    schema: "com.mariquita.additional-info/diff@1"
    baseRev: number
    overrides?: Record<string, AINodePatchV1>
    additions?: AIAdditionsV1
    childrenOrder?: Record<string, string[]>
}

export type ValidationIssue = {
    path: string
    message: string
}

export type ValidationResult =
    | { ok: true }
    | { ok: false; issues: ValidationIssue[] }
