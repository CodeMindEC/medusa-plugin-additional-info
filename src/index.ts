/**
 * Additional Info Products Plugin - Main Entry Point
 *
 * Este plugin provee funcionalidad de información adicional para productos
 * con un árbol de nodos editable (sections/items/blocks) en Medusa v2.
 */

// Re-export the additional-info module name
export { ADDITIONAL_INFO_MODULE } from "./modules/additional-info"

// Re-export service for typing
export { default as AdditionalInfoService } from "./modules/additional-info/service"

// Re-export types and ops
export * from "./types"
export * from "./ops/createEmptyTree"
export * from "./ops/ids"
export * from "./ops/validate"
export * from "./ops/prune"
export * from "./ops/resolve"
export * from "./schema"
