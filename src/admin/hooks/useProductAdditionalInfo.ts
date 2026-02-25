import { useMemo, useState } from "react"
import type { AdminProduct } from "@medusajs/types"
import { generateNodeId } from "../../ops/ids"
import type { AITreeDocV1, AIBlockV1 } from "../../types"
import { readProductTreeFromMetadata } from "../adapters/medusa/read"

function moveInArray<T>(list: T[], from: number, to: number) {
    const next = list.slice()
    if (from < 0 || to < 0 || from >= next.length || to >= next.length) return next
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
}

export function useProductAdditionalInfo(product: AdminProduct) {
    const initial = useMemo<AITreeDocV1>(() => {
        return readProductTreeFromMetadata(product?.metadata)
    }, [product?.id])

    const [tree, setTree] = useState<AITreeDocV1>(initial)

    const ops = {
        resetFromProduct() {
            setTree(readProductTreeFromMetadata(product?.metadata))
        },

        addChild(parentId: string) {
            const id = generateNodeId("n")
            setTree((prev: AITreeDocV1) => {
                const next = structuredClone(prev)
                next.nodes[id] = { id, type: "item", title: "Nuevo ítem", blocks: [{ kind: "md", value: "" }] }
                next.children[parentId] = Array.isArray(next.children[parentId]) ? next.children[parentId] : []
                next.children[parentId].push(id)
                next.children[id] = []
                next.rev = (next.rev ?? 0) + 1
                return next
            })
        },

        updateNode(nodeId: string, patch: { title?: string; blocks?: AIBlockV1[] }) {
            setTree((prev: AITreeDocV1) => {
                const next = structuredClone(prev)
                if (!next.nodes[nodeId]) return prev
                if (patch.title !== undefined) next.nodes[nodeId].title = patch.title
                if (patch.blocks !== undefined) next.nodes[nodeId].blocks = patch.blocks
                next.rev = (next.rev ?? 0) + 1
                return next
            })
        },

        deleteNode(nodeId: string) {
            if (nodeId === "root") return
            setTree((prev: AITreeDocV1) => {
                const next = structuredClone(prev)

                // collect subtree
                const stack = [nodeId]
                const toRemove = new Set<string>()
                while (stack.length) {
                    const id = stack.pop()!
                    if (toRemove.has(id)) continue
                    toRemove.add(id)
                    const kids = next.children[id] ?? []
                    kids.forEach((k: string) => stack.push(k))
                }

                // remove refs from parents
                for (const pid of Object.keys(next.children)) {
                    next.children[pid] = (next.children[pid] ?? []).filter((cid: string) => !toRemove.has(cid))
                }

                // delete nodes/children
                for (const id of toRemove) {
                    delete next.nodes[id]
                    delete next.children[id]
                }

                next.rev = (next.rev ?? 0) + 1
                return next
            })
        },

        reorderChildren(parentId: string, activeId: string, overId: string) {
            if (activeId === overId) return
            setTree((prev: AITreeDocV1) => {
                const next = structuredClone(prev)
                const list = Array.isArray(next.children[parentId]) ? next.children[parentId] : []
                const from = list.indexOf(activeId)
                const to = list.indexOf(overId)
                if (from === -1 || to === -1) return prev
                next.children[parentId] = moveInArray(list, from, to)
                next.rev = (next.rev ?? 0) + 1
                return next
            })
        },
    }

    return { tree, setTree, ops }
}
