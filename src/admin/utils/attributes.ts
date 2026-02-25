import type { AdditionalInfoAttribute } from "../components/Templates/AttributeEditor"

const DEFAULT_ATTRIBUTE_TYPE = "text"

function createAttributeId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `attr_${crypto.randomUUID()}`
    }
    return `attr_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeAttribute(input: unknown): AdditionalInfoAttribute {
    if (!input || typeof input !== "object") {
        return { id: createAttributeId(), label: String(input ?? ""), type: DEFAULT_ATTRIBUTE_TYPE }
    }

    const record = input as Record<string, unknown>
    const rawChildren = record.children
    const children = Array.isArray(rawChildren)
        ? rawChildren.map((child) => normalizeAttribute(child))
        : undefined

    const options = Array.isArray(record.options)
        ? record.options.filter(
              (option): option is string => typeof option === "string" && option.trim().length > 0
          )
        : undefined

    return {
        id: typeof record.id === "string" && record.id.trim() ? record.id : createAttributeId(),
        label: typeof record.label === "string" && record.label.trim() ? record.label : "Sin titulo",
        type: typeof record.type === "string" && record.type.trim() ? record.type : DEFAULT_ATTRIBUTE_TYPE,
        required: record.required === true,
        options,
        children,
    }
}

function ensureUniqueIds(items: AdditionalInfoAttribute[]) {
    const seen = new Set<string>()
    const dedupe = (item: AdditionalInfoAttribute, fallbackSuffix: number): AdditionalInfoAttribute => {
        let id = item.id || createAttributeId()
        while (seen.has(id)) {
            id = `${id}-${fallbackSuffix}`
        }
        seen.add(id)
        const nextChildren = item.children
            ? item.children.map((child, index) => dedupe(child, index + 1))
            : undefined
        return { ...item, id, children: nextChildren }
    }
    return items.map((item, index) => dedupe(item, index + 1))
}

export function normalizeTemplateAttributes(value: unknown): AdditionalInfoAttribute[] {
    if (Array.isArray(value)) {
        return ensureUniqueIds(value.map((item) => normalizeAttribute(item)))
    }

    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
            if (entry && typeof entry === "object") {
                return normalizeAttribute({ id: key, ...(entry as Record<string, unknown>) })
            }
            return normalizeAttribute({ id: key, label: String(entry), type: DEFAULT_ATTRIBUTE_TYPE })
        })
        return ensureUniqueIds(entries)
    }

    return []
}
