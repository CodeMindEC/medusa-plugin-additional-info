import { Input, Label, Select, Switch, Text, Textarea } from "@medusajs/ui"
import type { AdditionalInfoAttribute } from "./AttributeEditor"

export type TemplateValue = string | number | boolean | null
export type TemplateValues = Record<string, TemplateValue>

type TemplateValueEditorProps = {
    attributes: AdditionalInfoAttribute[]
    values: TemplateValues
    onChange: (next: TemplateValues) => void
}

const FIELD_TYPES = new Set(["text", "number", "boolean", "markdown", "select"])

export function TemplateValueEditor(props: TemplateValueEditorProps) {
    const { attributes, values, onChange } = props

    const setValue = (id: string, value: TemplateValue) => {
        onChange({ ...values, [id]: value })
    }

    const renderAttributes = (items: AdditionalInfoAttribute[], depth: number) => {
        return items.map((attr) => {
            const hasChildren = Array.isArray(attr.children) && attr.children.length > 0
            const isField = FIELD_TYPES.has(attr.type)
            const indentClass = depth > 0 ? "ml-6" : ""

            if (hasChildren) {
                return (
                    <div
                        key={attr.id}
                        className={`rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-3 ${indentClass}`}
                    >
                        <Text weight="plus">{attr.label || "Sin titulo"}</Text>
                        <div className="mt-3 space-y-3">
                            {renderAttributes(attr.children ?? [], depth + 1)}
                        </div>
                    </div>
                )
            }

            if (!isField) {
                return (
                    <div
                        key={attr.id}
                        className={`rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-3 ${indentClass}`}
                    >
                        <Text size="small" className="text-ui-fg-subtle">
                            {attr.label || "Sin titulo"}
                        </Text>
                    </div>
                )
            }

            const label = attr.label || "Sin titulo"
            const requiredMark = attr.required ? " *" : ""
            const value = values[attr.id]

            return (
                <div
                    key={attr.id}
                    className={`rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-3 ${indentClass}`}
                >
                    <div className="flex flex-col gap-2">
                        <Label size="small">
                            {label}
                            {requiredMark ? <span className="text-ui-fg-error">{requiredMark}</span> : null}
                        </Label>

                        {attr.type === "text" ? (
                            <Input
                                value={typeof value === "string" ? value : ""}
                                onChange={(event) => setValue(attr.id, event.target.value)}
                                placeholder={label}
                            />
                        ) : null}

                        {attr.type === "number" ? (
                            <Input
                                type="number"
                                value={typeof value === "number" ? String(value) : ""}
                                onChange={(event) => {
                                    const raw = event.target.value.trim()
                                    setValue(attr.id, raw ? Number(raw) : null)
                                }}
                                placeholder={label}
                            />
                        ) : null}

                        {attr.type === "boolean" ? (
                            <div className="flex items-center gap-3">
                                <Switch
                                    size="small"
                                    checked={value === true}
                                    onCheckedChange={(checked) => setValue(attr.id, checked)}
                                />
                                <Text size="small">{value === true ? "Si" : "No"}</Text>
                            </div>
                        ) : null}

                        {attr.type === "markdown" ? (
                            <Textarea
                                value={typeof value === "string" ? value : ""}
                                onChange={(event) => setValue(attr.id, event.target.value)}
                                rows={4}
                                placeholder={label}
                            />
                        ) : null}

                        {attr.type === "select" ? (
                            attr.options && attr.options.length ? (
                                <Select
                                    value={typeof value === "string" ? value : ""}
                                    onValueChange={(next) => setValue(attr.id, next)}
                                >
                                    <Select.Trigger>
                                        <Select.Value placeholder="Selecciona una opcion" />
                                    </Select.Trigger>
                                    <Select.Content>
                                        {attr.options.map((option) => (
                                            <Select.Item key={option} value={option}>
                                                {option}
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select>
                            ) : (
                                <Text size="small" className="text-ui-fg-subtle">
                                    No hay opciones definidas.
                                </Text>
                            )
                        ) : null}
                    </div>
                </div>
            )
        })
    }

    if (!attributes.length) {
        return (
            <Text size="small" className="text-ui-fg-subtle">
                Esta plantilla no tiene atributos configurados.
            </Text>
        )
    }

    return <div className="space-y-3">{renderAttributes(attributes, 0)}</div>
}
