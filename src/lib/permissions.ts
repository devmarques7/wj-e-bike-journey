import type { UserRole } from "@/contexts/AuthContext";

/**
 * Central permission matrix. Single source of truth for what each role can do.
 * Add a new action key here, then use it via `usePermissions().can('actionKey')`.
 *
 * Convention: <resource>.<verb>
 *   verbs: view | create | update | delete | manage
 */
export type PermissionAction =
  // Inventory domain
  | "inventory.view"
  | "inventory.adjust"
  | "inventory.receive"
  | "inventory.transfer"
  | "inventory.reorder"
  | "inventory.export"
  | "movements.view"
  // Catalog
  | "product.view"
  | "product.create"
  | "product.update"
  | "product.delete"
  | "variant.create"
  | "variant.update"
  | "variant.delete"
  // Master data
  | "category.manage"
  | "location.manage"
  // CRM
  | "crm.view"
  | "crm.edit"
  | "crm.contact"
  | "crm.segment.manage";

const MATRIX: Record<PermissionAction, UserRole[]> = {
  "inventory.view":   ["admin", "staff"],
  "inventory.adjust": ["admin", "staff"],
  "inventory.receive":["admin", "staff"],
  "inventory.transfer":["admin", "staff"],
  "inventory.reorder":["admin"],
  "inventory.export": ["admin"],
  "movements.view":   ["admin", "staff"],

  "product.view":     ["admin", "staff"],
  "product.create":   ["admin"],
  "product.update":   ["admin", "staff"],
  "product.delete":   ["admin"],
  "variant.create":   ["admin", "staff"],
  "variant.update":   ["admin", "staff"],
  "variant.delete":   ["admin"],

  "category.manage":  ["admin"],
  "location.manage":  ["admin"],

  "crm.view":            ["admin", "staff"],
  "crm.edit":            ["admin"],
  "crm.contact":         ["admin", "staff"],
  "crm.segment.manage":  ["admin"],
};

export function canRoleDo(role: UserRole | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  return MATRIX[action]?.includes(role) ?? false;
}

export const PERMISSION_MATRIX = MATRIX;