import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canRoleDo, type PermissionAction } from "@/lib/permissions";

/**
 * Reusable role/permission hook.
 *
 * Usage:
 *   const { can, role, isAdmin } = usePermissions();
 *   if (can("product.delete")) { ... }
 *
 * To change who can do what, edit `src/lib/permissions.ts`. Nothing else.
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return useMemo(
    () => ({
      role,
      isAdmin: role === "admin",
      isStaff: role === "staff",
      isMember: role === "member",
      can: (action: PermissionAction) => canRoleDo(role, action),
      canAny: (actions: PermissionAction[]) => actions.some((a) => canRoleDo(role, a)),
      canAll: (actions: PermissionAction[]) => actions.every((a) => canRoleDo(role, a)),
    }),
    [role],
  );
}