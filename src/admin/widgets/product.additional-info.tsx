import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/types"
import { Badge, Button, Input, Label, Select, Text, usePrompt } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { AdditionalInfoPanel } from "../components/AdditionalInfoPanel"
import { NodeEditorDrawer } from "../components/Editors/NodeEditorDrawer"
import { TemplateValueEditor, type TemplateValues } from "../components/Templates/TemplateValueEditor"
import { useToast } from "../hooks/useToast"
import {
    useAdditionalInfoTemplates,
    useCreateAdditionalInfoTemplate,
    type AdditionalInfoTemplate,
} from "../hooks/useAdditionalInfoTemplate"
import {
    useAdditionalInfoValues,
    useCreateAdditionalInfoValues,
    useUpdateAdditionalInfoValue,
} from "../hooks/useAdditionalInfoValues"
import type { AdditionalInfoAttribute } from "../components/Templates/AttributeEditor"
import { saveProductTree } from "../adapters/medusa/write"
import { useProductAdditionalInfo } from "../hooks/useProductAdditionalInfo"
import { normalizeTemplateAttributes } from "../utils/attributes"
import { convertTreeToTemplate } from "../utils/manual"

const MANUAL_TEMPLATE_ID = "__manual__"

const ProductAdditionalInfoWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
    const prompt = usePrompt()
    const { toast } = useToast()
    const templatesQuery = useAdditionalInfoTemplates({ limit: 200 })
    const templates = templatesQuery.data?.additional_info_templates ?? []
    const valuesQuery = useAdditionalInfoValues(
        {
            limit: 20,
            product_id: product.id,
            expand: "template",
        },
        { enabled: !!product.id }
    )
    const assignedValue = valuesQuery.data?.additional_info_values?.[0] ?? null
    const assignedTemplateId = assignedValue?.template?.id ?? assignedValue?.template_id ?? ""
    const assignedTemplate: AdditionalInfoTemplate | null =
        templates.find((template) => template.id === assignedTemplateId) ??
        (assignedValue?.template as AdditionalInfoTemplate | null) ??
        null

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
    const [draftValues, setDraftValues] = useState<TemplateValues>({})
    const [isAssigning, setIsAssigning] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [manualNodeId, setManualNodeId] = useState<string | null>(null)
    const [manualTemplateName, setManualTemplateName] = useState("")
    const [isSavingManual, setIsSavingManual] = useState(false)
    const [isConverting, setIsConverting] = useState(false)

    const createTemplate = useCreateAdditionalInfoTemplate()
    const createValues = useCreateAdditionalInfoValues()
    const updateValue = useUpdateAdditionalInfoValue()
    const { tree, ops } = useProductAdditionalInfo(product)
    const manualNode = manualNodeId ? tree.nodes[manualNodeId] : null
    const isManualSelected = selectedTemplateId === MANUAL_TEMPLATE_ID

    useEffect(() => {
        setSelectedTemplateId(assignedTemplateId || MANUAL_TEMPLATE_ID)
    }, [assignedTemplateId])

    useEffect(() => {
        setDraftValues((assignedValue?.values ?? {}) as TemplateValues)
    }, [assignedValue?.id])

    useEffect(() => {
        if (manualTemplateName) return
        if (product.title) {
            setManualTemplateName(`Plantilla ${product.title}`)
        }
    }, [manualTemplateName, product.title])

    const attributes = useMemo<AdditionalInfoAttribute[]>(() => {
        if (!assignedTemplate) return []
        return normalizeTemplateAttributes(assignedTemplate.attributes)
    }, [assignedTemplate])

    const handleApplyTemplate = async () => {
        if (selectedTemplateId === MANUAL_TEMPLATE_ID) {
            return
        }

        if (!selectedTemplateId) {
            toast.error("Selecciona una plantilla.")
            return
        }

        if (selectedTemplateId === assignedTemplateId) {
            toast.info("La plantilla ya esta asignada.")
            return
        }

        if (assignedTemplateId) {
            const confirmed = await prompt({
                title: "Cambiar plantilla",
                description: "Esto reiniciara los valores del producto. Quieres continuar?",
                confirmText: "Cambiar",
                cancelText: "Cancelar",
                variant: "danger",
            })
            if (!confirmed) return
        }

        setIsAssigning(true)
        try {
            if (assignedValue?.id) {
                await updateValue.mutateAsync({
                    id: assignedValue.id,
                    payload: { template_id: selectedTemplateId, values: {} },
                })
            } else {
                await createValues.mutateAsync([
                    {
                        product_id: product.id,
                        template_id: selectedTemplateId,
                        values: {},
                    },
                ])
            }
            toast.success("Plantilla asignada.")
        } catch {
            toast.error("No se pudo asignar la plantilla.")
        } finally {
            setIsAssigning(false)
        }
    }

    const handleSaveValues = async () => {
        if (!assignedValue?.id) return
        setIsSaving(true)
        try {
            await updateValue.mutateAsync({
                id: assignedValue.id,
                payload: { values: draftValues },
            })
            toast.success("Cambios guardados.")
        } catch {
            toast.error("No se pudieron guardar los cambios.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveManual = async () => {
        setIsSavingManual(true)
        try {
            await saveProductTree({
                productId: product.id,
                currentMetadata: product.metadata ?? {},
                tree,
            })
            toast.success("Informacion guardada.")
        } catch {
            toast.error("No se pudo guardar la informacion.")
        } finally {
            setIsSavingManual(false)
        }
    }

    const handleCreateTemplateFromManual = async () => {
        const name = manualTemplateName.trim() || `Plantilla ${product.title ?? "Producto"}`
        const { attributes, values } = convertTreeToTemplate(tree)

        if (!attributes.length) {
            toast.error("No hay atributos para convertir en plantilla.")
            return
        }

        const confirmed = await prompt({
            title: "Crear plantilla",
            description: "Se creara una plantilla con la informacion actual y se asignara al producto.",
            confirmText: "Crear",
            cancelText: "Cancelar",
        })
        if (!confirmed) return

        setIsConverting(true)
        try {
            const template = await createTemplate.mutateAsync({
                name,
                description: null,
                attributes,
            })
            if (assignedValue?.id) {
                await updateValue.mutateAsync({
                    id: assignedValue.id,
                    payload: { template_id: template.id, values },
                })
            } else {
                await createValues.mutateAsync([
                    {
                        product_id: product.id,
                        template_id: template.id,
                        values,
                    },
                ])
            }
            setSelectedTemplateId(template.id)
            toast.success("Plantilla creada y asignada.")
        } catch {
            toast.error("No se pudo crear la plantilla.")
        } finally {
            setIsConverting(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-2">
                        <Label size="small">Plantilla</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <Select.Trigger>
                                <Select.Value placeholder="Selecciona una plantilla" />
                            </Select.Trigger>
                        <Select.Content>
                            <Select.Item value={MANUAL_TEMPLATE_ID}>Sin plantilla (manual)</Select.Item>
                            {templates.map((template) => (
                                <Select.Item key={template.id} value={template.id}>
                                    {template.name}
                                </Select.Item>
                            ))}
                            </Select.Content>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="small"
                            variant="secondary"
                            type="button"
                            onClick={() => {
                                window.location.href = "/app/additional-info"
                            }}
                        >
                            Crear plantilla
                        </Button>
                        {!isManualSelected ? (
                            <Button
                                size="small"
                                type="button"
                                isLoading={isAssigning}
                                onClick={handleApplyTemplate}
                                disabled={!selectedTemplateId || isAssigning}
                            >
                                {assignedTemplateId ? "Cambiar" : "Asignar"}
                            </Button>
                        ) : null}
                    </div>
                </div>

                {templatesQuery.isLoading ? (
                    <Text size="small" className="text-ui-fg-subtle">
                        Cargando plantillas...
                    </Text>
                ) : null}
                {templatesQuery.isError ? (
                    <Text size="small" className="text-ui-fg-error">
                        No se pudieron cargar las plantillas.
                    </Text>
                ) : null}
                {valuesQuery.isLoading ? (
                    <Text size="small" className="text-ui-fg-subtle">
                        Cargando informacion adicional...
                    </Text>
                ) : null}
                {valuesQuery.isError ? (
                    <Text size="small" className="text-ui-fg-error">
                        No se pudo cargar la informacion adicional del producto.
                    </Text>
                ) : null}
            </div>

            {isManualSelected ? (
                <div className="space-y-4">
                    <Text size="small" className="text-ui-fg-subtle">
                        Esta informacion es especifica del producto. Puedes convertirla en plantilla cuando quieras.
                    </Text>

                    <AdditionalInfoPanel
                        tree={tree}
                        mode="product"
                        onAddChild={ops.addChild}
                        onEditNode={(nodeId) => setManualNodeId(nodeId)}
                        onDeleteNode={ops.deleteNode}
                        onReorder={ops.reorderChildren}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label size="small">Nombre de plantilla</Label>
                            <Input
                                value={manualTemplateName}
                                onChange={(event) => setManualTemplateName(event.target.value)}
                                placeholder="Ej: Plantilla de producto"
                            />
                            <Text size="xsmall" className="text-ui-fg-subtle">
                                Si deseas reutilizar esta info, crea una plantilla con un clic.
                            </Text>
                        </div>

                        <div className="flex items-end justify-end gap-2">
                            <Button
                                size="small"
                                variant="secondary"
                                type="button"
                                isLoading={isSavingManual}
                                onClick={handleSaveManual}
                            >
                                Guardar info
                            </Button>
                            <Button
                                size="small"
                                type="button"
                                isLoading={isConverting}
                                onClick={handleCreateTemplateFromManual}
                            >
                                Crear plantilla
                            </Button>
                        </div>
                    </div>
                </div>
            ) : assignedTemplate ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <Text weight="plus">Campos de la plantilla</Text>
                        <Badge color="blue" size="small">
                            {assignedTemplate.name}
                        </Badge>
                    </div>

                    <TemplateValueEditor
                        attributes={attributes}
                        values={draftValues}
                        onChange={setDraftValues}
                    />

                    <div className="flex justify-end">
                        <Button size="small" isLoading={isSaving} onClick={handleSaveValues}>
                            Guardar cambios
                        </Button>
                    </div>
                </div>
            ) : (
                <Text size="small" className="text-ui-fg-subtle">
                    Asigna una plantilla para editar los valores del producto.
                </Text>
            )}

            {manualNode ? (
                <NodeEditorDrawer
                    open={!!manualNode}
                    onOpenChange={(open) => {
                        if (!open) setManualNodeId(null)
                    }}
                    initial={manualNode}
                    onSave={(patch) => {
                        ops.updateNode(manualNode.id, patch)
                    }}
                />
            ) : null}
        </div>
    )
}

export const config = defineWidgetConfig({
    zone: "product.details.after",
})

export default ProductAdditionalInfoWidget
