import { Button } from "@medusajs/ui"
import type { AINodeV1 } from "../../../types"

export function NodeActions(props: {
    node: AINodeV1
    mode: "product" | "variant"

    onAddChild?: (parentId: string) => void
    onEditNode?: (nodeId: string) => void
    onDeleteNode?: (nodeId: string) => void

    isOverridden?: (nodeId: string) => boolean
    onOverrideNode?: (nodeId: string) => void
    onResetOverride?: (nodeId: string) => void
    onToggleHide?: (nodeId: string) => void
}) {
    const { node, mode } = props
    const isRoot = node.id === "root"

    if (mode === "product") {
        return (
            <div className="flex items-center gap-2">
                <Button size="small" variant="secondary" onClick={() => props.onAddChild?.(node.id)}>
                    + Subseccion
                </Button>
                {!isRoot ? (
                    <>
                        <Button size="small" variant="secondary" onClick={() => props.onEditNode?.(node.id)}>
                            Editar
                        </Button>
                        <Button size="small" variant="danger" onClick={() => props.onDeleteNode?.(node.id)}>
                            Eliminar
                        </Button>
                    </>
                ) : null}
            </div>
        )
    }

    // variant mode
    const overridden = !!props.isOverridden?.(node.id)

    return (
        <div className="flex items-center gap-2">
            {!isRoot ? (
                <Button size="small" variant="secondary" onClick={() => props.onOverrideNode?.(node.id)}>
                    Personalizar
                </Button>
            ) : null}

            {overridden && !isRoot ? (
                <Button size="small" variant="secondary" onClick={() => props.onResetOverride?.(node.id)}>
                    Quitar cambios
                </Button>
            ) : null}

            {!isRoot ? (
                <Button size="small" variant="secondary" onClick={() => props.onToggleHide?.(node.id)}>
                    Ocultar
                </Button>
            ) : null}
        </div>
    )
}
