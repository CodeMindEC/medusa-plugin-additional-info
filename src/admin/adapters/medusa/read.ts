import { createEmptyTree } from "../../../ops/createEmptyTree"
import { validateTreeDocV1, validateDiffDocV1 } from "../../../ops/validate"
import type { AIDiffDocV1, AITreeDocV1 } from "../../../types"
import { LEGACY_INFO_KEY, PRODUCT_INFO_KEY } from "./keys"

function readMetadataKey(metadata: any) {
    return metadata?.[PRODUCT_INFO_KEY] ?? metadata?.[LEGACY_INFO_KEY]
}

export function readProductTreeFromMetadata(metadata: any): AITreeDocV1 {
    const raw = readMetadataKey(metadata)
    if (!raw) return createEmptyTree()

    const v = validateTreeDocV1(raw)
    if (!v.ok) return createEmptyTree()

    return raw as AITreeDocV1
}

export function readVariantDiffFromMetadata(metadata: any): AIDiffDocV1 | null {
    const raw = readMetadataKey(metadata)
    if (!raw) return null

    const v = validateDiffDocV1(raw)
    if (!v.ok) return null

    return raw as AIDiffDocV1
}

export function isDiffEmpty(diff: AIDiffDocV1 | null | undefined) {
    if (!diff) return true
    const overrides = diff.overrides ?? {}
    const hasOverrides = Object.keys(overrides).length > 0
    const hasAdditions = !!diff.additions && (diff.additions.rootIds?.length ?? 0) > 0
    const childrenOrder: Record<string, string[]> = diff.childrenOrder ?? {}
    const hasOrder = Object.values(childrenOrder).some((list) => (list?.length ?? 0) > 0)
    return !hasOverrides && !hasAdditions && !hasOrder
}
