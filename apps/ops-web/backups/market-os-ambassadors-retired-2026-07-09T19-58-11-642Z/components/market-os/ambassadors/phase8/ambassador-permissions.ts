import type { AmbassadorPermission, AmbassadorRole } from "./ambassador-backend-types";

export const ambassadorRolePermissions: Record<AmbassadorRole, AmbassadorPermission[]> = {
  ceo: [
    "ambassadors.read",
    "ambassadors.create",
    "ambassadors.update",
    "ambassadors.delete",
    "applications.review",
    "missions.assign",
    "proofs.review",
    "rewards.manage",
    "payouts.approve",
    "compliance.manage",
    "communications.send",
    "analytics.read",
    "settings.manage",
  ],
  marketing_director: [
    "ambassadors.read",
    "ambassadors.create",
    "ambassadors.update",
    "applications.review",
    "missions.assign",
    "proofs.review",
    "rewards.manage",
    "compliance.manage",
    "communications.send",
    "analytics.read",
  ],
  ambassador_director: [
    "ambassadors.read",
    "ambassadors.create",
    "ambassadors.update",
    "applications.review",
    "missions.assign",
    "proofs.review",
    "rewards.manage",
    "compliance.manage",
    "communications.send",
    "analytics.read",
  ],
  ambassador_manager: [
    "ambassadors.read",
    "ambassadors.create",
    "ambassadors.update",
    "applications.review",
    "missions.assign",
    "proofs.review",
    "communications.send",
    "analytics.read",
  ],
  regional_manager: [
    "ambassadors.read",
    "ambassadors.update",
    "missions.assign",
    "communications.send",
    "analytics.read",
  ],
  content_reviewer: ["ambassadors.read", "proofs.review", "analytics.read"],
  finance_operations: ["ambassadors.read", "rewards.manage", "payouts.approve", "analytics.read"],
  trainer: ["ambassadors.read", "communications.send", "analytics.read"],
  ambassador: ["ambassadors.read"],
};

export function hasAmbassadorPermission(role: AmbassadorRole, permission: AmbassadorPermission): boolean {
  return ambassadorRolePermissions[role]?.includes(permission) ?? false;
}

export function requireAmbassadorPermission(role: AmbassadorRole, permission: AmbassadorPermission): void {
  if (!hasAmbassadorPermission(role, permission)) {
    throw new Error(`Permission denied: ${role} cannot perform ${permission}`);
  }
}
