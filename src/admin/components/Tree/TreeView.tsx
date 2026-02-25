import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { AINodeV1, AITreeDocV1 } from "../../../types"
import type { ReactNode } from "react"
import { NodeRow } from "./NodeRow"

export function TreeView(props: {
    tree: AITreeDocV1
    mode: "product" | "variant"
    onAddChild?: (parentId: string) => void
    onEditNode?: (nodeId: string) => void
    onDeleteNode?: (nodeId: string) => void
    onReorder?: (parentId: string, activeId: string, overId: string) => void

    isOverridden?: (nodeId: string) => boolean
    onOverrideNode?: (nodeId: string) => void
    onResetOverride?: (nodeId: string) => void
    onToggleHide?: (nodeId: string) => void
}) {
    const { tree, onReorder, ...nodeProps } = props
    const isSortable = !!onReorder
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

    const handleDragEnd = (event: DragEndEvent) => {
        if (!onReorder) return
        const overId = event.over?.id
        if (!overId || event.active.id === overId) return

        const activeParent = event.active.data?.current?.parentId
        const overParent = event.over?.data?.current?.parentId
        if (!activeParent || activeParent !== overParent) return

        onReorder(activeParent, String(event.active.id), String(overId))
    }

    function renderChildren(parentId: string, depth: number) {
        const childIds: string[] = tree.children[parentId] ?? []
        if (!childIds.length) return null

        const content = (
            <div className="space-y-2">
                {childIds.map((childId: string) => renderNode(childId, parentId, depth))}
            </div>
        )

        if (!isSortable) return content
        return (
            <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
                {content}
            </SortableContext>
        )
    }

    function renderNode(nodeId: string, parentId: string, depth: number) {
        const node = tree.nodes[nodeId]
        if (!node) return null
        const children = renderChildren(nodeId, depth + 1)

        if (!isSortable) {
            return (
                <div key={nodeId}>
                    <NodeRow node={node} depth={depth} {...nodeProps} />
                    {children}
                </div>
            )
        }

        return (
            <SortableNode
                key={nodeId}
                node={node}
                depth={depth}
                parentId={parentId}
                {...nodeProps}
            >
                {children}
            </SortableNode>
        )
    }

    const roots = renderChildren("root", 0)
    if (!isSortable) return roots ? roots : <div className="space-y-2" />

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {roots}
        </DndContext>
    )
}

function SortableNode(props: {
    node: AINodeV1
    depth: number
    parentId: string
    children?: ReactNode
    mode: "product" | "variant"
    onAddChild?: (parentId: string) => void
    onEditNode?: (nodeId: string) => void
    onDeleteNode?: (nodeId: string) => void
    isOverridden?: (nodeId: string) => boolean
    onOverrideNode?: (nodeId: string) => void
    onResetOverride?: (nodeId: string) => void
    onToggleHide?: (nodeId: string) => void
}) {
    const { node, depth, parentId, children, ...rest } = props
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: node.id,
        data: { parentId },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? "opacity-60" : ""}>
            <NodeRow
                node={node}
                depth={depth}
                dragHandleProps={{ ...attributes, ...listeners }}
                {...rest}
            />
            {children}
        </div>
    )
}
