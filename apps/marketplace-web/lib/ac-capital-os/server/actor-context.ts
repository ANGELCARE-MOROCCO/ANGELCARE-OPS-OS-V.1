import { getCurrentUser } from "@/lib/getUser";
import { mapCapitalRole } from "@/components/ac-capital-os/core/role";
import type { CapitalActor } from "@/components/ac-capital-os/core/types";

export async function getCapitalActorContext(): Promise<CapitalActor> {
  const user = await getCurrentUser();
  const row = (user || {}) as Record<string, unknown>;
  const rawRole = String(row.role || "read_only");
  const permissions = Array.isArray(row.permissions) ? row.permissions.map(String) : [];
  return {
    id: String(row.id || row.user_id || ""),
    name: String(row.full_name || row.name || row.display_name || "Authenticated user"),
    email: String(row.email || ""),
    rawRole,
    role: mapCapitalRole(rawRole),
    permissions,
  };
}
