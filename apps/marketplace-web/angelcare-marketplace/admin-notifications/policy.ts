import "server-only";
import {
  hasMarketplacePermission,
  hasMarketplaceWorkspaceAccess,
} from "../auth/context";
import type {
  MarketplaceRequestContext,
  MarketplacePermission,
} from "../domain/types";
import { SOURCES } from "./registry";
export function notificationPolicy(c: MarketplaceRequestContext) {
  const master =
    c.roleKeys.includes("marketplace_admin") ||
    ["ceo", "admin", "super_admin"].includes(c.actor.sourceRole);
  const sources = SOURCES.filter(
    (s) =>
      hasMarketplaceWorkspaceAccess(c, s.workspace) &&
      hasMarketplacePermission(c, s.permission as MarketplacePermission),
  ).map((s) => s.id);
  // Assignments remain paired. No union of tenant IDs crossed with unrelated territory IDs.
  // Native context exposes no school/organization grant resolver: these objects fail closed for ordinary operators.
  return {
    sources,
    global: master,
    manage: master,
    tenant: c.tenantId,
    territory: c.territoryId,
    scopes: master
      ? []
      : c.assignments
          .filter((a) =>
            ["tenant", "territory", "read_only"].includes(a.scopeType),
          )
          .map((a) => ({
            type: a.scopeType,
            tenant: a.tenantId,
            territory: a.territoryId,
          })),
  };
}
