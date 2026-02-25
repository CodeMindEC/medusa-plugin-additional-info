import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DotsSix, Trash } from "@medusajs/icons"
import { Button, IconButton, Input, Label, Select, Switch, Text } from "@medusajs/ui"
import type { CSSProperties, ReactNode } from "react"

export type AdditionalInfoAttribute = {
    id: string
    label: string
    type: string
    required?: boolean
    options?: string[]
    children?: AdditionalInfoAttribute[]
}

const ATTRIBUTE_TYPES = [
    { value: "text", label: "Texto" },
    { value: "number", label: "Numero" },
    { value: "boolean", label: "Si/No" },
    { value: "markdown", label: "Markdown" },
    { value: "select", label: "Seleccion" },
]

const DEFAULT_TYPE = "text"

function createAttributeId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `attr_${crypto.randomUUID()}`
    }
    return `attr_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeOptions(input: string) {
    return input
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
}

type AttributeEditorProps = {
    attributes: AdditionalInfoAttribute[]
    onChange: (next: AdditionalInfoAttribute[]) => void
}

const ROOT_PARENT_ID = "__root__"

function updateChildren(
    list: AdditionalInfoAttribute[],
    parentId: string,
    updater: (children: AdditionalInfoAttribute[]) => AdditionalInfoAttribute[]
): AdditionalInfoAttribute[] {
    if (parentId === ROOT_PARENT_ID) {
        return updater(list)
    }

    let changed = false
    const next: AdditionalInfoAttribute[] = list.map((attr) => {
        if (attr.id === parentId) {
            const currentChildren = attr.children ?? []
            const nextChildren: AdditionalInfoAttribute[] = updater(currentChildren)
            if (nextChildren !== currentChildren) {
                changed = true
                return { ...attr, children: nextChildren }
            }
            return attr
        }

        if (attr.children?.length) {
            const nextChildren: AdditionalInfoAttribute[] = updateChildren(attr.children, parentId, updater)
            if (nextChildren !== attr.children) {
                changed = true
                return { ...attr, children: nextChildren }
            }
        }

        return attr
    })

    return changed ? next : list
}

function updateAttributeNode(
    list: AdditionalInfoAttribute[],
    id: string,
    patch: Partial<AdditionalInfoAttribute>
): AdditionalInfoAttribute[] {
    let changed = false
    const next: AdditionalInfoAttribute[] = list.map((attr) => {
        if (attr.id === id) {
            changed = true
            return { ...attr, ...patch }
        }
        if (attr.children?.length) {
            const nextChildren: AdditionalInfoAttribute[] = updateAttributeNode(attr.children, id, patch)
            if (nextChildren !== attr.children) {
                changed = true
                return { ...attr, children: nextChildren }
            }
        }
        return attr
    })

    return changed ? next : list
}

function removeAttributeNode(list: AdditionalInfoAttribute[], id: string): AdditionalInfoAttribute[] {
    let changed = false
    const next: AdditionalInfoAttribute[] = list.flatMap((attr) => {
        if (attr.id === id) {
            changed = true
            return []
        }
        if (attr.children?.length) {
            const nextChildren: AdditionalInfoAttribute[] = removeAttributeNode(attr.children, id)
            if (nextChildren !== attr.children) {
                changed = true
                return [{ ...attr, children: nextChildren }]
            }
        }
        return [attr]
    })

    return changed ? next : list
}

function reorderWithinParent(
    list: AdditionalInfoAttribute[],
    parentId: string,
    activeId: string,
    overId: string
): AdditionalInfoAttribute[] {
    return updateChildren(list, parentId, (children) => {
        const oldIndex = children.findIndex((attr) => attr.id === activeId)
        const newIndex = children.findIndex((attr) => attr.id === overId)
        if (oldIndex === -1 || newIndex === -1) return children
        return arrayMove(children, oldIndex, newIndex)
    })
}

export function AttributeEditor(props: AttributeEditorProps) {
    const { attributes, onChange } = props
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

    const handleDragEnd = (event: DragEndEvent) => {
        const over = event.over
        if (!over) return

        const activeId = String(event.active.id)
        const overIdString = String(over.id)
        if (activeId === overIdString) return

        const activeParent = event.active.data?.current?.parentId ?? ROOT_PARENT_ID
        const overParent = over.data?.current?.parentId ?? ROOT_PARENT_ID
        if (activeParent !== overParent) return

        onChange(reorderWithinParent(attributes, activeParent, activeId, overIdString))
    }

    const handleAddRoot = () => {
        const next = [
            ...attributes,
            {
                id: createAttributeId(),
                label: "Nuevo atributo",
                type: DEFAULT_TYPE,
                required: false,
            },
        ]
        onChange(next)
    }

    const handleAddChild = (parentId: string) => {
        const child = {
            id: createAttributeId(),
            label: "Nuevo atributo",
            type: DEFAULT_TYPE,
            required: false,
        }
        onChange(updateChildren(attributes, parentId, (children) => [...children, child]))
    }

    const updateAttribute = (id: string, patch: Partial<AdditionalInfoAttribute>) => {
        onChange(updateAttributeNode(attributes, id, patch))
    }

    const removeAttribute = (id: string) => {
        onChange(removeAttributeNode(attributes, id))
    }

    if (!attributes.length) {
        return (
            <div className="space-y-3">
                <Text size="small" className="text-ui-fg-subtle">
                    Aun no hay atributos. Agrega el primero para empezar.
                </Text>
                <Button size="small" variant="secondary" onClick={handleAddRoot}>
                    + Agregar atributo
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <AttributeList
                    items={attributes}
                    depth={0}
                    parentId={ROOT_PARENT_ID}
                    onAddChild={handleAddChild}
                    onChange={updateAttribute}
                    onRemove={removeAttribute}
                />
            </DndContext>

            <Button size="small" variant="secondary" onClick={handleAddRoot}>
                + Agregar atributo
            </Button>
        </div>
    )
}

function AttributeList(props: {
    items: AdditionalInfoAttribute[]
    depth: number
    parentId: string
    onAddChild: (parentId: string) => void
    onChange: (id: string, patch: Partial<AdditionalInfoAttribute>) => void
    onRemove: (id: string) => void
}) {
    const { items, depth, parentId, onAddChild, onChange, onRemove } = props
    if (!items.length) return null

    return (
        <SortableContext items={items.map((attr) => attr.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
                {items.map((attribute) => (
                    <AttributeRow
                        key={attribute.id}
                        attribute={attribute}
                        depth={depth}
                        parentId={parentId}
                        onAddChild={onAddChild}
                        onChange={onChange}
                        onRemove={onRemove}
                    >
                        {attribute.children?.length ? (
                            <div className="mt-2 space-y-2">
                                <AttributeList
                                    items={attribute.children}
                                    depth={depth + 1}
                                    parentId={attribute.id}
                                    onAddChild={onAddChild}
                                    onChange={onChange}
                                    onRemove={onRemove}
                                />
                            </div>
                        ) : null}
                    </AttributeRow>
                ))}
            </div>
        </SortableContext>
    )
}

function AttributeRow(props: {
    attribute: AdditionalInfoAttribute
    depth: number
    parentId: string
    onAddChild: (parentId: string) => void
    onChange: (id: string, patch: Partial<AdditionalInfoAttribute>) => void
    onRemove: (id: string) => void
    children?: ReactNode
}) {
    const { attribute, depth, parentId, onAddChild, onChange, onRemove, children } = props
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: attribute.id,
        data: { parentId },
    })

    const indent = depth * 20
    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: indent ? `${indent}px` : undefined,
    }

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? "opacity-60" : ""}>
            <div
                className={`rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-3 ${
                    depth > 0 ? "border-l-4 border-ui-border-base pl-4" : ""
                }`}
            >
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        className="mt-2 flex h-8 w-8 items-center justify-center rounded-md border border-ui-border-base bg-ui-bg-base text-ui-fg-subtle"
                        {...attributes}
                        {...listeners}
                    >
                        <DotsSix />
                    </button>

                    <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label size="small">Etiqueta</Label>
                            <Input
                                value={attribute.label}
                                onChange={(event) => onChange(attribute.id, { label: event.target.value })}
                                placeholder="Ej: Peso"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label size="small">Tipo</Label>
                            <Select
                                value={attribute.type}
                                onValueChange={(value) => onChange(attribute.id, { type: value })}
                            >
                                <Select.Trigger>
                                    <Select.Value />
                                </Select.Trigger>
                                <Select.Content>
                                    {ATTRIBUTE_TYPES.map((type) => (
                                        <Select.Item key={type.value} value={type.value}>
                                            {type.label}
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select>
                        </div>

                        <div className="flex items-center gap-3">
                            <Label size="small">Requerido</Label>
                            <Switch
                                size="small"
                                checked={!!attribute.required}
                                onCheckedChange={(checked) => onChange(attribute.id, { required: checked })}
                            />
                        </div>

                        {attribute.type === "select" ? (
                            <div className="flex flex-col gap-2">
                                <Label size="small">Opciones</Label>
                                <Input
                                    value={(attribute.options ?? []).join(", ")}
                                    onChange={(event) =>
                                        onChange(attribute.id, { options: normalizeOptions(event.target.value) })
                                    }
                                    placeholder="Ej: Chico, Mediano, Grande"
                                />
                                <Text size="xsmall" className="text-ui-fg-subtle">
                                    Separa cada opcion con una coma.
                                </Text>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <Button type="button" size="small" variant="secondary" onClick={() => onAddChild(attribute.id)}>
                            + Subatributo
                        </Button>
                        <IconButton
                            type="button"
                            size="xsmall"
                            variant="transparent"
                            onClick={() => onRemove(attribute.id)}
                        >
                            <Trash />
                        </IconButton>
                    </div>
                </div>
            </div>
            {children}
        </div>
    )
}
