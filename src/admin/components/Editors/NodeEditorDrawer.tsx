import { Drawer, Button, Label, Input, Textarea } from "@medusajs/ui"
import { useEffect, useState } from "react"
import type { AINodeV1, AIBlockV1 } from "../../../types"

function blocksToText(blocks?: AIBlockV1[]) {
    const md = blocks?.find((b) => b.kind === "md") as any
    return md?.value ?? ""
}

function textToBlocks(text: string): AIBlockV1[] {
    return [{ kind: "md", value: text }]
}

export function NodeEditorDrawer(props: {
    open: boolean
    onOpenChange: (open: boolean) => void
    initial?: Partial<AINodeV1>
    onSave: (patch: { title: string; blocks: AIBlockV1[] }) => void
}) {
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")

    useEffect(() => {
        if (!props.open) return
        setTitle(props.initial?.title ?? "")
        setBody(blocksToText(props.initial?.blocks as AIBlockV1[] | undefined))
    }, [props.open, props.initial])

    return (
        <Drawer open={props.open} onOpenChange={props.onOpenChange}>
            <Drawer.Content>
                <Drawer.Header>
                    <div className="text-base font-semibold">Editar seccion</div>
                </Drawer.Header>

                <Drawer.Body className="space-y-4">
                    <div className="space-y-2">
                        <Label size="small" weight="plus">Titulo</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Titulo de la seccion"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label size="small" weight="plus">Descripcion</Label>
                        <Textarea
                            rows={8}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Escribe aqui el contenido"
                        />
                    </div>
                </Drawer.Body>

                <Drawer.Footer>
                    <div className="flex justify-end gap-2">
                        <Drawer.Close asChild>
                            <Button size="small" variant="secondary">Cancelar</Button>
                        </Drawer.Close>
                        <Button
                            size="small"
                            onClick={() => {
                                props.onSave({ title: title.trim() || "Sin titulo", blocks: textToBlocks(body) })
                                props.onOpenChange(false)
                            }}
                        >
                            Guardar
                        </Button>
                    </div>
                </Drawer.Footer>
            </Drawer.Content>
        </Drawer>
    )
}
