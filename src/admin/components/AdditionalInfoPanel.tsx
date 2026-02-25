import { Container, Heading, Text, Button } from "@medusajs/ui"
import type { AITreeDocV1 } from "../../types"
import { TreeView } from "./Tree/TreeView"

export function AdditionalInfoPanel(props: {
    title?: string
    tree: AITreeDocV1
    mode: "product" | "variant"
    onAddChild?: (parentId: string) => void
    onEditNode?: (nodeId: string) => void
    onDeleteNode?: (nodeId: string) => void
    onReorder?: (parentId: string, activeId: string, overId: string) => void

    // variante
    isOverridden?: (nodeId: string) => boolean
    onOverrideNode?: (nodeId: string) => void
    onResetOverride?: (nodeId: string) => void
    onToggleHide?: (nodeId: string) => void
}) {
    const {
        title = "Informacion adicional",
        tree,
        mode,
        onAddChild,
        onEditNode,
        onDeleteNode,
        onReorder,
        isOverridden,
        onOverrideNode,
        onResetOverride,
        onToggleHide,
    } = props

    return (
        <Container className="p-0 divide-y">
            <div className="px-6 py-4 flex items-center justify-between">
                <Heading level="h2">{title}</Heading>
                {mode === "product" ? (
                    <Button size="small" variant="secondary" onClick={() => onAddChild?.("root")}>
                        + Nueva seccion
                    </Button>
                ) : null}
            </div>

            <div className="px-6 py-4">
                <TreeView
                    tree={tree}
                    mode={mode}
                    onAddChild={onAddChild}
                    onEditNode={onEditNode}
                    onDeleteNode={onDeleteNode}
                    onReorder={onReorder}
                    isOverridden={isOverridden}
                    onOverrideNode={onOverrideNode}
                    onResetOverride={onResetOverride}
                    onToggleHide={onToggleHide}
                />
                {!tree.children?.root?.length ? (
                    <Text size="small" className="text-ui-fg-subtle mt-3">
                        Aun no hay secciones. Agrega la primera para empezar.
                    </Text>
                ) : null}
            </div>
        </Container>
    )
}
