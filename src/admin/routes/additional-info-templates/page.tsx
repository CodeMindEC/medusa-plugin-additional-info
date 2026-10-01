import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import {
    Badge,
    Button,
    Checkbox,
    Container,
    Heading,
    Input,
    Label,
    Select,
    Table,
    Text,
    Textarea,
    type CheckboxCheckedState,
} from "@medusajs/ui"
import { usePrompt } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { z } from "@medusajs/framework/zod"
import {
    useAdditionalInfoTemplates,
    useCreateAdditionalInfoTemplate,
    useDeleteAdditionalInfoTemplate,
    useUpdateAdditionalInfoTemplate,
} from "../../hooks/useAdditionalInfoTemplate"
import { AttributeEditor, type AdditionalInfoAttribute } from "../../components/Templates/AttributeEditor"
import { normalizeTemplateAttributes } from "../../utils/attributes"
import {
    useAdditionalInfoValues,
    useCreateAdditionalInfoValues,
    useUpdateAdditionalInfoValue,
    type AdditionalInfoValueInput,
    type AdditionalInfoValueUpdate,
} from "../../hooks/useAdditionalInfoValues"
import { useProducts } from "../../hooks/useProducts"
import { useToast } from "../../hooks/useToast"

const NEW_TEMPLATE_ID = "__new__"
const PRODUCT_PAGE_SIZE = 20
const PRODUCT_FIELDS = "id,title,handle,status,thumbnail"

type TemplateFormValues = {
    name: string
    description?: string
    attributes: string
}

const templateSchema: z.ZodType<TemplateFormValues> = z.object({
    name: z.string().trim().min(1, "El nombre es requerido"),
    description: z.string().trim().optional(),
    attributes: z
        .string()
        .trim()
        .refine((value) => {
            if (!value) return true
            try {
                const parsed = JSON.parse(value)
                return typeof parsed === "object" && parsed !== null
            } catch {
                return false
            }
        }, "JSON invalido"),
})



const serializeAttributes = (value: unknown) => {
    if (!value) return "[]"
    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return "[]"
    }
}

const parseAttributesJson = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return { ok: true, value: [] as AdditionalInfoAttribute[] }
    try {
        return { ok: true, value: normalizeTemplateAttributes(JSON.parse(trimmed)) }
    } catch {
        return { ok: false as const }
    }
}

const getEmptyFormValues = (): TemplateFormValues => ({
    name: "",
    description: "",
    attributes: "[]",
})

const AdditionalInfoTemplatesPage = () => {
    const prompt = usePrompt()
    const { toast } = useToast()
    const [selectedId, setSelectedId] = useState<string>(NEW_TEMPLATE_ID)
    const templatesQuery = useAdditionalInfoTemplates({ limit: 200 })
    const templates = templatesQuery.data?.additional_info_templates ?? []
    const [attributes, setAttributes] = useState<AdditionalInfoAttribute[]>([])
    const [showJson, setShowJson] = useState(false)
    const [jsonText, setJsonText] = useState("[]")
    const [productSearch, setProductSearch] = useState("")
    const [pageIndex, setPageIndex] = useState(0)
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
    const [assignTemplateId, setAssignTemplateId] = useState("")
    const [isAssigning, setIsAssigning] = useState(false)

    const selectedTemplate = useMemo(
        () => templates.find((template) => template.id === selectedId) ?? null,
        [templates, selectedId]
    )

    const productsQuery = useProducts({
        limit: PRODUCT_PAGE_SIZE,
        offset: pageIndex * PRODUCT_PAGE_SIZE,
        q: productSearch.trim() || undefined,
        fields: PRODUCT_FIELDS,
    })
    const products = productsQuery.data?.products ?? []
    const totalProducts = productsQuery.data?.count ?? 0
    const productPageCount = Math.ceil(totalProducts / PRODUCT_PAGE_SIZE)
    const productIds = useMemo(() => products.map((product) => product.id), [products])

    const valuesQuery = useAdditionalInfoValues(
        {
            limit: productIds.length || PRODUCT_PAGE_SIZE,
            product_id: productIds,
            expand: "template",
        },
        { enabled: productIds.length > 0 }
    )
    const values = valuesQuery.data?.additional_info_values ?? []
    const valuesByProduct = useMemo(() => new Map(values.map((value) => [value.product_id, value])), [values])

    const selectedSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds])
    const allSelected = productIds.length > 0 && productIds.every((id) => selectedSet.has(id))
    const someSelected = productIds.some((id) => selectedSet.has(id))
    const selectAllState: CheckboxCheckedState = allSelected ? true : someSelected ? "indeterminate" : false

    const customZodResolver: Resolver<TemplateFormValues> = async (values) => {
        const result = await templateSchema.safeParseAsync(values)
        if (result.success) {
            return { values: result.data, errors: {} }
        }
        const errors: Record<string, { type: string; message: string }> = {}
        for (const err of result.error.issues) {
            const path = err.path.join('.')
            if (!errors[path]) {
                errors[path] = { type: err.code, message: err.message }
            }
        }
        return { values, errors }
    }

    const form = useForm<TemplateFormValues>({
        resolver: customZodResolver,
        defaultValues: getEmptyFormValues(),
    })

    useEffect(() => {
        if (!selectedTemplate) {
            form.reset(getEmptyFormValues())
            setAttributes([])
            setJsonText("[]")
            return
        }

        const normalizedAttributes = normalizeTemplateAttributes(selectedTemplate.attributes)
        const nextJson = serializeAttributes(normalizedAttributes)
        setAttributes(normalizedAttributes)
        setJsonText(nextJson)

        form.reset({
            name: selectedTemplate.name ?? "",
            description: selectedTemplate.description ?? "",
            attributes: nextJson,
        })
    }, [selectedTemplate])

    useEffect(() => {
        setSelectedProductIds([])
    }, [pageIndex, productSearch])

    useEffect(() => {
        if (selectedTemplate && selectedTemplate.id !== NEW_TEMPLATE_ID) {
            setAssignTemplateId(selectedTemplate.id)
        } else if (templates.length) {
            setAssignTemplateId(templates[0].id)
        }
    }, [selectedTemplate, templates])

    const createTemplate = useCreateAdditionalInfoTemplate()
    const updateTemplate = useUpdateAdditionalInfoTemplate()
    const deleteTemplate = useDeleteAdditionalInfoTemplate()
    const createValues = useCreateAdditionalInfoValues()
    const updateValue = useUpdateAdditionalInfoValue()

    const isSaving = createTemplate.isPending || updateTemplate.isPending
    const isDeleting = deleteTemplate.isPending

    const toggleAllProducts = (checked: CheckboxCheckedState) => {
        if (checked === true) {
            setSelectedProductIds(productIds)
            return
        }
        setSelectedProductIds([])
    }

    const toggleProduct = (productId: string, checked: CheckboxCheckedState) => {
        if (checked === true) {
            setSelectedProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]))
            return
        }
        setSelectedProductIds((prev) => prev.filter((id) => id !== productId))
    }

    const clearSelection = () => {
        setSelectedProductIds([])
    }

    const onSubmit = (values: TemplateFormValues) => {
        let attributesToSave = attributes
        if (showJson) {
            const parsed = parseAttributesJson(jsonText)
            if (!parsed.ok) {
                form.trigger("attributes")
                toast.error("Corrige el JSON antes de guardar.")
                return
            }
            attributesToSave = parsed.value
            setAttributes(parsed.value)
            setJsonText(serializeAttributes(parsed.value))
        }

        const payload = {
            name: values.name.trim(),
            description: values.description?.trim() || null,
            attributes: attributesToSave,
        }

        if (selectedTemplate) {
            updateTemplate.mutate(
                { id: selectedTemplate.id, payload },
                {
                    onSuccess: () => {
                        toast.success("Plantilla actualizada")
                    },
                    onError: () => {
                        toast.error("No se pudo actualizar la plantilla")
                    },
                }
            )
            return
        }

        createTemplate.mutate(payload, {
            onSuccess: (template) => {
                toast.success("Plantilla creada")
                if (template?.id) {
                    setSelectedId(template.id)
                }
            },
            onError: () => {
                toast.error("No se pudo crear la plantilla")
            },
        })
    }

    const handleDelete = async () => {
        if (!selectedTemplate) return
        const confirmed = await prompt({
            title: "Eliminar plantilla",
            description: "Esto eliminara la plantilla y sus valores asociados.",
            variant: "danger",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
        })

        if (!confirmed) return

        deleteTemplate.mutate(selectedTemplate.id, {
            onSuccess: () => {
                toast.success("Plantilla eliminada")
                setSelectedId(NEW_TEMPLATE_ID)
            },
            onError: () => {
                toast.error("No se pudo eliminar la plantilla")
            },
        })
    }

    const handleAssignTemplate = async () => {
        if (!assignTemplateId) {
            toast.error("Selecciona una plantilla antes de asignar.")
            return
        }

        if (!selectedProductIds.length) {
            toast.error("Selecciona al menos un producto.")
            return
        }

        const toCreate: AdditionalInfoValueInput[] = []
        const toUpdate: Array<{ id: string; payload: AdditionalInfoValueUpdate }> = []

        for (const productId of selectedProductIds) {
            const existing = valuesByProduct.get(productId)
            const existingTemplateId = existing?.template?.id ?? existing?.template_id ?? null

            if (existingTemplateId === assignTemplateId) {
                continue
            }

            if (existing?.id) {
                toUpdate.push({
                    id: existing.id,
                    payload: {
                        template_id: assignTemplateId,
                        values: {},
                    },
                })
            } else {
                toCreate.push({
                    product_id: productId,
                    template_id: assignTemplateId,
                    values: {},
                })
            }
        }

        if (!toCreate.length && !toUpdate.length) {
            toast.info("No hay cambios para aplicar.")
            return
        }

        setIsAssigning(true)
        try {
            if (toCreate.length) {
                await createValues.mutateAsync(toCreate)
            }
            if (toUpdate.length) {
                await Promise.all(toUpdate.map((item) => updateValue.mutateAsync(item)))
            }
            toast.success(`Plantilla asignada a ${toCreate.length + toUpdate.length} producto(s).`)
            clearSelection()
        } catch {
            toast.error("No se pudo asignar la plantilla.")
        } finally {
            setIsAssigning(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Heading level="h1">Plantillas de informacion adicional</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                    Crea y edita plantillas para reutilizar atributos en productos y variantes.
                </Text>
            </div>

            <Container className="p-0 divide-y">
                <div className="px-6 py-4">
                    <Heading level="h2">Seleccion de plantilla</Heading>
                    <Text size="small" className="text-ui-fg-subtle">
                        Elige una plantilla existente o crea una nueva.
                    </Text>
                </div>
                <div className="px-6 py-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <Label size="small" htmlFor="template-select">
                            Plantilla
                        </Label>
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <Select.Trigger id="template-select">
                                <Select.Value placeholder="Selecciona una plantilla" />
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value={NEW_TEMPLATE_ID}>Nueva plantilla</Select.Item>
                                {templates.map((template) => (
                                    <Select.Item key={template.id} value={template.id}>
                                        {template.name}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select>
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
                    </div>
                    <div className="flex justify-end">
                        <Button
                            size="small"
                            variant="secondary"
                            onClick={() => setSelectedId(NEW_TEMPLATE_ID)}
                        >
                            Nueva plantilla
                        </Button>
                    </div>
                </div>
            </Container>

            <Container className="p-0 divide-y">
                <div className="px-6 py-4">
                    <Heading level="h2">{selectedTemplate ? "Editar plantilla" : "Nueva plantilla"}</Heading>
                    <Text size="small" className="text-ui-fg-subtle">
                        Define el nombre, descripcion y atributos en formato JSON.
                    </Text>
                </div>
                <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 flex flex-col gap-4">
                    <input type="hidden" {...form.register("attributes")} />
                    <div className="flex flex-col gap-2">
                        <Label size="small" htmlFor="template-name">
                            Nombre
                        </Label>
                        <Input id="template-name" placeholder="Ej: Ficha tecnica" {...form.register("name")} />
                        {form.formState.errors.name ? (
                            <Text size="small" className="text-ui-fg-error">
                                {form.formState.errors.name.message}
                            </Text>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label size="small" htmlFor="template-description">
                            Descripcion
                        </Label>
                        <Textarea
                            id="template-description"
                            placeholder="Describe cuando usar esta plantilla"
                            rows={3}
                            {...form.register("description")}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label size="small">Atributos</Label>
                        <AttributeEditor
                            attributes={attributes}
                            onChange={(next) => {
                                setAttributes(next)
                                if (!showJson) {
                                    const nextJson = serializeAttributes(next)
                                    setJsonText(nextJson)
                                    form.setValue("attributes", nextJson, { shouldValidate: false })
                                }
                            }}
                        />
                        <div className="flex items-center justify-between">
                            <Text size="small" className="text-ui-fg-subtle">
                                Arrastra para cambiar el orden.
                            </Text>
                            <Button
                                size="small"
                                variant="secondary"
                                type="button"
                                onClick={() => {
                                    const next = !showJson
                                    setShowJson(next)
                                    if (next) {
                                        const nextJson = serializeAttributes(attributes)
                                        setJsonText(nextJson)
                                        form.setValue("attributes", nextJson, { shouldValidate: false })
                                    }
                                }}
                            >
                                {showJson ? "Ocultar JSON" : "Vista avanzada"}
                            </Button>
                        </div>
                        {showJson ? (
                            <div className="space-y-2">
                                <Textarea
                                    id="template-attributes"
                                    placeholder='Ej: [{"id":"peso","label":"Peso","type":"text"}]'
                                    rows={8}
                                    value={jsonText}
                                    onChange={(event) => {
                                        setJsonText(event.target.value)
                                        form.setValue("attributes", event.target.value, { shouldValidate: false })
                                    }}
                                />
                                {form.formState.errors.attributes ? (
                                    <Text size="small" className="text-ui-fg-error">
                                        {form.formState.errors.attributes.message}
                                    </Text>
                                ) : null}
                                <div className="flex items-center justify-between">
                                    <Text size="small" className="text-ui-fg-subtle">
                                        Edita el JSON solo si necesitas atributos avanzados.
                                    </Text>
                                    <Button
                                        size="small"
                                        variant="secondary"
                                        type="button"
                                        onClick={() => {
                                            const parsed = parseAttributesJson(jsonText)
                                            if (!parsed.ok) {
                                                form.trigger("attributes")
                                                return
                                            }
                                            setAttributes(parsed.value)
                                            const nextJson = serializeAttributes(parsed.value)
                                            setJsonText(nextJson)
                                            form.setValue("attributes", nextJson, { shouldValidate: false })
                                        }}
                                    >
                                        Aplicar JSON
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        {selectedTemplate ? (
                            <Button
                                size="small"
                                variant="secondary"
                                type="button"
                                isLoading={isDeleting}
                                onClick={handleDelete}
                            >
                                Eliminar
                            </Button>
                        ) : null}
                        <Button size="small" type="submit" isLoading={isSaving}>
                            Guardar
                        </Button>
                    </div>
                </form>
            </Container>

            <Container className="p-0 divide-y">
                <div className="px-6 py-4">
                    <Heading level="h2">Asignacion a productos</Heading>
                    <Text size="small" className="text-ui-fg-subtle">
                        Selecciona productos y asignales una plantilla de informacion adicional.
                    </Text>
                </div>
                <div className="px-6 py-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex flex-col gap-2">
                            <Label size="small" htmlFor="product-search">
                                Buscar productos
                            </Label>
                            <Input
                                id="product-search"
                                value={productSearch}
                                onChange={(event) => {
                                    setProductSearch(event.target.value)
                                    setPageIndex(0)
                                }}
                                placeholder="Buscar por nombre o handle"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label size="small" htmlFor="assign-template">
                                Plantilla
                            </Label>
                            <Select value={assignTemplateId} onValueChange={setAssignTemplateId}>
                                <Select.Trigger id="assign-template">
                                    <Select.Value placeholder="Selecciona una plantilla" />
                                </Select.Trigger>
                                <Select.Content>
                                    {templates.map((template) => (
                                        <Select.Item key={template.id} value={template.id}>
                                            {template.name}
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Text size="small" className="text-ui-fg-subtle">
                                {selectedProductIds.length} seleccionados
                            </Text>
                            <Button size="small" variant="secondary" type="button" onClick={clearSelection}>
                                Limpiar
                            </Button>
                            <Button
                                size="small"
                                type="button"
                                isLoading={isAssigning}
                                onClick={handleAssignTemplate}
                                disabled={!assignTemplateId || !selectedProductIds.length || isAssigning}
                            >
                                Asignar
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border border-ui-border-base">
                        <Table>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>
                                        <Checkbox checked={selectAllState} onCheckedChange={toggleAllProducts} />
                                    </Table.HeaderCell>
                                    <Table.HeaderCell>Producto</Table.HeaderCell>
                                    <Table.HeaderCell>Plantilla</Table.HeaderCell>
                                    <Table.HeaderCell>Estado</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {products.map((product) => {
                                    const value = valuesByProduct.get(product.id)
                                    const templateName =
                                        value?.template?.name ??
                                        (value?.template_id ? "Plantilla asignada" : "Sin plantilla")
                                    const templateColor = value ? "blue" : "grey"

                                    return (
                                        <Table.Row key={product.id}>
                                            <Table.Cell>
                                                <Checkbox
                                                    checked={selectedSet.has(product.id)}
                                                    onCheckedChange={(checked) => toggleProduct(product.id, checked)}
                                                />
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div className="flex flex-col">
                                                    <Text size="small" weight="plus">
                                                        {product.title}
                                                    </Text>
                                                    {product.handle ? (
                                                        <Text size="small" className="text-ui-fg-subtle">
                                                            /{product.handle}
                                                        </Text>
                                                    ) : null}
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge size="xsmall" color={templateColor}>
                                                    {templateName}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {product.status ? (
                                                    <Badge size="xsmall" color="grey">
                                                        {product.status}
                                                    </Badge>
                                                ) : (
                                                    <Text size="small" className="text-ui-fg-subtle">
                                                        -
                                                    </Text>
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                    )
                                })}
                                {!products.length && !productsQuery.isLoading ? (
                                    <Table.Row>
                                        <Table.Cell />
                                        <Table.Cell>
                                            <Text size="small" className="text-ui-fg-subtle">
                                                No hay productos para mostrar.
                                            </Text>
                                        </Table.Cell>
                                        <Table.Cell />
                                        <Table.Cell />
                                    </Table.Row>
                                ) : null}
                            </Table.Body>
                        </Table>
                    </div>

                    {productsQuery.isLoading ? (
                        <Text size="small" className="text-ui-fg-subtle">
                            Cargando productos...
                        </Text>
                    ) : null}
                    {productsQuery.isError ? (
                        <Text size="small" className="text-ui-fg-error">
                            No se pudieron cargar los productos.
                        </Text>
                    ) : null}
                    {valuesQuery.isError ? (
                        <Text size="small" className="text-ui-fg-error">
                            No se pudieron cargar las asignaciones.
                        </Text>
                    ) : null}
                    {productPageCount > 1 ? (
                        <Table.Pagination
                            count={totalProducts}
                            pageSize={PRODUCT_PAGE_SIZE}
                            pageIndex={pageIndex}
                            pageCount={productPageCount}
                            canPreviousPage={pageIndex > 0}
                            canNextPage={pageIndex + 1 < productPageCount}
                            previousPage={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                            nextPage={() =>
                                setPageIndex((prev) => (prev + 1 < productPageCount ? prev + 1 : prev))
                            }
                        />
                    ) : null}
                </div>
            </Container>
        </div>
    )
}

export const config = defineRouteConfig({
    label: "Info Adicional",
    icon: DocumentText,
})

export default AdditionalInfoTemplatesPage
