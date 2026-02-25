import { NodeEditorDrawer } from "./NodeEditorDrawer"
import type { AINodeV1, AIBlockV1 } from "../../../types"

export function OverrideDrawer(props: {
    node: AINodeV1
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveOverride: (patch: { title?: string; blocks?: AIBlockV1[] }) => void
}) {
    return (
        <NodeEditorDrawer
            open={props.open}
            onOpenChange={props.onOpenChange}
            initial={props.node}
            onSave={({ title, blocks }) => props.onSaveOverride({ title, blocks })}
        />
    )
}
