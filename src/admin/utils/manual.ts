import type { AIBlockV1, AITreeDocV1 } from "../../types"
import type { AdditionalInfoAttribute } from "../components/Templates/AttributeEditor"
import type { TemplateValues } from "../components/Templates/TemplateValueEditor"

type ManualConversionResult = {
    attributes: AdditionalInfoAttribute[]
    values: TemplateValues
}

const DEFAULT_GROUP_TYPE = "text"

function createAttributeId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `attr_${crypto.randomUUID()}`
    }
    return `attr_${Math.random().toString(36).slice(2, 10)}`
}

function blocksToMarkdown(blocks?: AIBlockV1[]) {
    if (!blocks || !blocks.length) return ""
    const parts = blocks
        .map((block) => {
            if (block.kind === "md") return block.value
            if (block.kind === "list") {
                const items = block.items ?? []
                if (block.style === "number") {
                    return items.map((item, index) => `${index + 1}. ${item}`).join("\n")
                }
                return items.map((item) => `- ${item}`).join("\n")
            }
            return ""
        })
        .filter((value) => value && value.trim().length > 0)
    return parts.join("\n\n").trim()
}

export function convertTreeToTemplate(tree: AITreeDocV1): ManualConversionResult {
    const values: TemplateValues = {}

    const toAttribute = (nodeId: string): AdditionalInfoAttribute | null => {
        const node = tree.nodes[nodeId]
        if (!node) return null

        const label = node.title?.trim() || "Sin titulo"
        const content = blocksToMarkdown(node.blocks)
        const childIds = tree.children?.[nodeId] ?? []
        const children = childIds
            .map((childId) => toAttribute(childId))
            .filter((child): child is AdditionalInfoAttribute => !!child)

        if (children.length) {
            const groupChildren = children.slice()
            if (content) {
                const contentId = createAttributeId()
                values[contentId] = content
                groupChildren.unshift({
                    id: contentId,
                    label: "Descripcion",
                    type: "markdown",
                    required: false,
                })
            }

            return {
                id: createAttributeId(),
                label,
                type: DEFAULT_GROUP_TYPE,
                children: groupChildren,
            }
        }

        const leafId = createAttributeId()
        values[leafId] = content ? content : null
        return {
            id: leafId,
            label,
            type: "markdown",
            required: false,
        }
    }

    const rootChildren = tree.children?.root ?? []
    const attributes = rootChildren
        .map((nodeId) => toAttribute(nodeId))
        .filter((attr): attr is AdditionalInfoAttribute => !!attr)

    return { attributes, values }
}
