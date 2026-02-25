import { DotsSix } from "@medusajs/icons"
import { Badge, Text } from "@medusajs/ui"
import type { AINodeV1 } from "../../../types"
import { NodeActions } from "./NodeActions"

export function NodeRow(props: {
    node: AINodeV1
    depth: number
    mode: "product" | "variant"
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>

    onAddChild?: (parentId: string) => void
    onEditNode?: (nodeId: string) => void
    onDeleteNode?: (nodeId: string) => void

    isOverridden?: (nodeId: string) => boolean
    onOverrideNode?: (nodeId: string) => void
    onResetOverride?: (nodeId: string) => void
    onToggleHide?: (nodeId: string) => void
}) {
    const { node, depth, mode, isOverridden, dragHandleProps } = props
    const overridden = mode === "variant" ? !!isOverridden?.(node.id) : false

    return (
        <div className="flex items-center justify-between rounded-md border border-ui-border-base px-3 py-2">
            <div className="flex items-center gap-2" style={{ marginLeft: depth * 14 }}>
                {dragHandleProps ? (
                    <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-ui-border-base bg-ui-bg-base text-ui-fg-subtle"
                        {...dragHandleProps}
                    >
                        <DotsSix />
                    </button>
                ) : null}
                <Text size="small" weight="plus">
                    {node.title}
                </Text>

                {mode === "variant" ? (
                    overridden ? (
                        <Badge size="2xsmall" color="blue">Personalizado</Badge>
                    ) : (
                        <Badge size="2xsmall" color="grey">Del producto</Badge>
                    )
                ) : null}
            </div>

            <NodeActions {...props} />
        </div>
    )
}
