# @codemind.ec/medusa-plugin-additional-info

Medusa v2 plugin for **hierarchical product metadata** — tree-based templates, diff-based updates, drag-and-drop ordering, and per-product overrides.

[![npm version](https://img.shields.io/npm/v/@codemind.ec/medusa-plugin-additional-info.svg)](https://www.npmjs.com/package/@codemind.ec/medusa-plugin-additional-info)
[![Medusa v2](https://img.shields.io/badge/medusa-v2-blueviolet)](https://docs.medusajs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Features

- **Tree-based templates** — define hierarchical structures of sections, items, and content blocks.
- **Versioned schemas** — `tree@1` and `diff@1` schemas with Zod validation.
- **Diff-based overrides** — apply per-product patches, additions, reordering, and hiding without duplicating templates.
- **Content blocks** — markdown (`md`) and list (`bullet`/`number`) blocks per node.
- **Admin UI** — full CRUD interface with drag-and-drop tree editing for templates and product values.
- **Store API** — public endpoint to fetch resolved additional info for any product.
- **Product linking** — automatic Medusa link between additional info values and products.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js     | >= 20   |
| Medusa      | >= 2.4.0 |

---

## Installation

```bash
npm install @codemind.ec/medusa-plugin-additional-info
# or
pnpm add @codemind.ec/medusa-plugin-additional-info
```

---

## Configuration

Add the plugin and its module to your `medusa-config.ts`:

```typescript
import { defineConfig } from "@medusajs/framework/utils"

export default defineConfig({
  // ...
  modules: [
    {
      resolve: "@codemind.ec/medusa-plugin-additional-info/additional-info",
      definition: { isQueryable: true },
    },
  ],
  plugins: [
    {
      resolve: "@codemind.ec/medusa-plugin-additional-info",
      options: {},
    },
  ],
})
```

> **Nota:** El módulo se registra por separado en `modules[]` con `isQueryable: true` para que sea accesible desde el query graph de Medusa. La entrada en `plugins[]` carga admin UI, API routes, links y workflows.

---

## Architecture

### Module: `additional-info`

#### `additional_info_template`

Reusable tree structures that define the shape of additional info.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | string | Template name |
| `description` | string? | Optional description |
| `attributes` | JSON | Tree document (`tree@1` schema) |

#### `additional_info_value`

Per-product values, optionally referencing a template.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `product_id` | string | Associated product ID |
| `template` | relation | Parent template (optional) |
| `values` | JSON | Diff document or standalone tree |

---

### Schema: Tree v1

Schema identifier: `com.mariquita.additional-info/tree@1`

```typescript
type AITreeDocV1 = {
  schema: "com.mariquita.additional-info/tree@1"
  rev: number
  root: "root"
  nodes: Record<string, AINodeV1>   // id → node
  children: Record<string, string[]> // parentId → [childIds]
  meta?: { createdAt?: string; updatedAt?: string }
}

type AINodeV1 = {
  id: string
  type: "root" | "section" | "item"
  title: string
  blocks?: AIBlockV1[]
  tags?: string[]
  ui?: { icon?: string; collapsed?: boolean }
}

type AIBlockV1 =
  | { kind: "md"; value: string }
  | { kind: "list"; style: "bullet" | "number"; items: string[] }
```

### Schema: Diff v1

Schema identifier: `com.mariquita.additional-info/diff@1`

```typescript
type AIDiffDocV1 = {
  schema: "com.mariquita.additional-info/diff@1"
  baseRev: number
  overrides?: Record<string, AINodePatchV1>   // per-node patches
  additions?: AIAdditionsV1                    // new subtrees
  childrenOrder?: Record<string, string[]>     // reorder children
}

type AIAdditionsV1 = {
  mount: {
    parentId: string
    position?: "start" | "end"
    index?: number
  }
  nodes: Record<string, AINodeV1>
  children: Record<string, string[]>
  rootIds: string[]
}
```

---

### Operations

| Function | Description |
|----------|-------------|
| `createEmptyTree()` | Creates a canonical empty tree with a root node |
| `validateTreeDocV1(input)` | Validates schema, root existence, cycle detection (DFS), and child references |
| `resolveTree(base, diff?)` | Merges a base tree with a diff: applies overrides, prunes hidden subtrees, mounts additions, and reorders children |
| `pruneHidden(tree, hiddenIds)` | Removes subtrees by ID |

---

## API Reference

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/additional-info/templates` | List templates (paginated: `limit`, `offset`) |
| `POST` | `/admin/additional-info/templates` | Create a template |
| `GET` | `/admin/additional-info/templates/:id` | Get a template |
| `PUT` | `/admin/additional-info/templates/:id` | Update a template |
| `DELETE` | `/admin/additional-info/templates/:id` | Delete a template |
| `GET` | `/admin/additional-info/values` | List values (filter: `product_id`, expand: `template`) |
| `POST` | `/admin/additional-info/values` | Create value(s) — single or array |
| `PUT` | `/admin/additional-info/values/:id` | Update a value |
| `DELETE` | `/admin/additional-info/values/:id` | Delete a value |

### Store Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/store/products/:id/additional-info` | Get resolved additional info for a product |

### Create a Template

```bash
curl -X POST /admin/additional-info/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Specs",
    "attributes": {
      "schema": "com.mariquita.additional-info/tree@1",
      "rev": 1,
      "root": "root",
      "nodes": {
        "root": { "id": "root", "type": "root", "title": "Root" },
        "specs": { "id": "specs", "type": "section", "title": "Specifications", "blocks": [
          { "kind": "md", "value": "Technical details for this product." }
        ]}
      },
      "children": { "root": ["specs"] }
    }
  }'
```

---

## Workflows

### `createAdditionalInfoValuesWorkflow`

1. **Step 1:** `createAdditionalInfoValuesStep` — creates value records (rollback: soft-delete).
2. **Step 2:** `linkAdditionalInfoProductStep` — establishes links to products (rollback: dismiss links).

---

## Product Linking

The plugin defines a Medusa link between `additional_info_value` and `Product` (using `Modules.PRODUCT`). This enables:

- Querying values through product relations
- Automatic cleanup on product deletion
- Multiple values per product (`isList: true`)

---

## TypeScript Exports

```typescript
// Types
import type { AITreeDocV1, AIDiffDocV1, AINodeV1, AIBlockV1 } from "@codemind.ec/medusa-plugin-additional-info/types"

// Module
import AdditionalInfoModule from "@codemind.ec/medusa-plugin-additional-info/modules/additional-info"

// Workflows
import { createAdditionalInfoValuesWorkflow } from "@codemind.ec/medusa-plugin-additional-info/workflows"
```

---

## License

MIT — [CodeMind](https://codemind.ec)
