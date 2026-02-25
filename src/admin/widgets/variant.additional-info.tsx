import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProductVariant, DetailWidgetProps } from "@medusajs/types"
import { Button, Text } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { AdditionalInfoPanel } from "../components/AdditionalInfoPanel"
import { OverrideDrawer } from "../components/Editors/OverrideDrawer"
import { saveVariantDiff } from "../adapters/medusa/write"
import { useVariantAdditionalInfo } from "../hooks/useVariantAdditionalInfo"
import { resolveTree } from "../../ops/resolve"
import type { AIDiffDocV1, AIBlockV1 } from "../../types"

function moveInArray<T>(list: T[], from: number, to: number) {
    const next = list.slice()
    if (from < 0 || to < 0 || from >= next.length || to >= next.length) return next
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
}

function sameOrder(a: string[], b: string[]) {
    if (a.length !== b.length) return false
    return a.every((id, index) => id === b[index])
}

const VariantAdditionalInfoWidget = ({ data: variant }: DetailWidgetProps<AdminProductVariant>) => {
    const { effectiveTree, baseTree, diff, setDiff, isLoading, error } = useVariantAdditionalInfo({ variant })

    const [overrideNodeId, setOverrideNodeId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState(false)

    const overrides = diff?.overrides ?? {}
    const isOverridden = (id: string) => !!overrides[id]

    const nodeForOverride = useMemo(() => {
        if (!effectiveTree || !overrideNodeId) return null
        return effectiveTree.nodes[overrideNodeId] ?? null
    }, [effectiveTree, overrideNodeId])
    const drawerOpen = !!nodeForOverride

    const baselineTree = useMemo(() => {
        if (!baseTree) return null
        if (!diff) return baseTree
        if (!diff.childrenOrder) return effectiveTree ?? baseTree
        const { childrenOrder, ...rest } = diff
        return resolveTree(baseTree, rest)
    }, [baseTree, diff, effectiveTree])

    if (isLoading) return <Text size="small">Cargando informacion...</Text>
    if (error) return <Text size="small">No pudimos cargar la informacion del producto.</Text>
    if (!effectiveTree || !baseTree) return <Text size="small">No hay informacion para mostrar.</Text>

    const ensureDiff = (): AIDiffDocV1 => {
        return (
            diff ?? {
                schema: "com.mariquita.additional-info/diff@1",
                baseRev: baseTree.rev,
                overrides: {},
            }
        )
    }

    const setOverridePatch = (nodeId: string, patch: { title?: string; blocks?: AIBlockV1[]; hidden?: boolean }) => {
        const next = ensureDiff()
        next.baseRev = baseTree.rev
        next.overrides = next.overrides ?? {}
        next.overrides[nodeId] = { ...(next.overrides[nodeId] ?? {}), ...patch }
        setDiff(structuredClone(next))
    }

    const resetOverride = (nodeId: string) => {
        if (!diff?.overrides?.[nodeId]) return
        const next = structuredClone(diff)
        delete next.overrides![nodeId]
        setDiff(next)
    }

    const handleReorder = (parentId: string, activeId: string, overId: string) => {
        if (!effectiveTree || !baseTree) return
        if (activeId === overId) return

        const current = (effectiveTree.children[parentId] ?? []) as string[]
        const from = current.indexOf(activeId)
        const to = current.indexOf(overId)
        if (from === -1 || to === -1) return

        const nextOrder = moveInArray(current, from, to)
        const baselineOrder = (baselineTree?.children[parentId] ?? []) as string[]
        const matchesBaseline = sameOrder(nextOrder, baselineOrder)

        const next = ensureDiff()
        next.baseRev = baseTree.rev
        next.childrenOrder = { ...(next.childrenOrder ?? {}) }

        if (matchesBaseline) {
            delete next.childrenOrder[parentId]
            if (!Object.keys(next.childrenOrder).length) {
                delete next.childrenOrder
            }
        } else {
            next.childrenOrder[parentId] = nextOrder
        }

        setDiff(structuredClone(next))
    }
    const handleSave = async () => {
        setIsSaving(true)
        setSaveError(false)
        try {
            await saveVariantDiff({
                variantId: variant.id,
                currentMetadata: variant.metadata ?? {},
                diff: diff ?? null,
            })
        } catch (error) {
            console.error("[additional-info] save variant failed", error)
            setSaveError(true)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-3">
            <AdditionalInfoPanel
                tree={effectiveTree}
                mode="variant"
                onReorder={handleReorder}
                isOverridden={isOverridden}
                onOverrideNode={(id) => setOverrideNodeId(id)}
                onResetOverride={(id) => resetOverride(id)}
                onToggleHide={(id) => setOverridePatch(id, { hidden: true })}
            />

            <div className="flex justify-end gap-2">
                <Button
                    size="small"
                    isLoading={isSaving}
                    onClick={handleSave}
                >
                    Guardar cambios
                </Button>
            </div>

            {nodeForOverride ? (
                <OverrideDrawer
                    node={nodeForOverride}
                    open={drawerOpen}
                    onOpenChange={(open) => {
                        if (!open) setOverrideNodeId(null)
                    }}
                    onSaveOverride={(patch) => {
                        setOverridePatch(nodeForOverride.id, patch)
                        setOverrideNodeId(null)
                    }}
                />
            ) : null}
            {!drawerOpen ? (
                <Text size="xsmall" className="text-ui-fg-subtle">
                    Solo se guardan los cambios que hagas aqui.
                </Text>
            ) : null}
            {saveError ? (
                <Text size="xsmall" className="text-ui-fg-subtle">
                    No se pudo guardar. Intenta de nuevo.
                </Text>
            ) : null}
        </div>
    )
}

export const config = defineWidgetConfig({
    zone: "product_variant.details.after",
})

export default VariantAdditionalInfoWidget
