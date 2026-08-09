import "server-only";

import { getCurrentUser } from "@/lib/getUser";
import { hasPermission } from "@/lib/auth/permissions";
import { createServiceClient } from "@/lib/supabase/server";

export type OnboardingActor = {
  userId: string;
  fullName: string;
  role: string;
  tenantKey: string | null;
  organizationKey: string | null;
  permissions: string[];
  sovereign: boolean;
  scopeWarning: string | null;
  canRead: boolean;
  canManage: boolean;
  canArchive: boolean;
  canOverride: boolean;
  canManageChecklists: boolean;
  canManageDocuments: boolean;
};

type ActorRow = Record<string, unknown>;

function text(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

async function resolveScope(user: ActorRow): Promise<{ tenantKey: string | null; organizationKey: string | null; warning: string | null }> {
  let tenantKey = text(user.tenant_id ?? user.tenant_key ?? user.company_id);
  let organizationKey = text(user.organization_id ?? user.organization_key ?? user.company_id);

  if (tenantKey && organizationKey) return { tenantKey, organizationKey, warning: null };

  const userId = text(user.id);
  if (!userId) return { tenantKey, organizationKey, warning: "Identité utilisateur sans identifiant exploitable pour la résolution de scope." };

  let warning: string | null = null;
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("angelcare360_operator_tenant_access_accounts")
      .select("tenant_id,organization_id,school_id,status")
      .eq("app_user_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const scopeRow = (data ?? null) as Record<string, unknown> | null;
    tenantKey = tenantKey || text(scopeRow?.tenant_id);
    organizationKey = organizationKey || text(scopeRow?.organization_id ?? scopeRow?.school_id);
  } catch (error) {
    warning = error instanceof Error
      ? `Résolution de scope opérateur indisponible: ${error.message}`
      : "Résolution de scope opérateur indisponible.";
  }

  return { tenantKey, organizationKey, warning };
}

export async function requireOnboardingActor(mode: "read" | "manage" | "archive" | "override" | "checklists" | "documents" = "read"): Promise<OnboardingActor> {
  const user = (await getCurrentUser()) as ActorRow | null;
  if (!user) throw Object.assign(new Error("Session expirée. Reconnectez-vous."), { status: 401, code: "UNAUTHENTICATED" });

  const userId = text(user.id);
  if (!userId) throw Object.assign(new Error("Identité utilisateur invalide."), { status: 401, code: "INVALID_ACTOR" });

  const role = String(user.role ?? "").trim().toLowerCase();
  const permissions = stringArray(user.permissions);
  const sovereign = ["ceo", "owner", "super_admin"].includes(role) || permissions.includes("*");
  const canRead = sovereign || hasPermission(user, "hr.view") || hasPermission(user, "hr.onboarding.manage");
  const canManage = sovereign || hasPermission(user, "hr.onboarding.manage") || hasPermission(user, "hr.admin");
  const canArchive = sovereign || hasPermission(user, "hr.admin") || hasPermission(user, "hr.onboarding.manage");
  const canOverride = sovereign || hasPermission(user, "hr.admin");
  const canManageChecklists = canManage;
  const canManageDocuments = canManage || hasPermission(user, "hr.documents.manage");

  const allowed =
    mode === "read" ? canRead
      : mode === "manage" ? canManage
        : mode === "archive" ? canArchive
          : mode === "override" ? canOverride
            : mode === "checklists" ? canManageChecklists
              : canManageDocuments;

  if (!allowed) {
    throw Object.assign(new Error("Vous ne disposez pas de l’autorisation RH Onboarding requise."), {
      status: 403,
      code: "ONBOARDING_PERMISSION_DENIED",
    });
  }

  const scope = await resolveScope(user);
  if (!sovereign && !scope.tenantKey && !scope.organizationKey) {
    throw Object.assign(new Error("Le scope tenant/organisation du compte RH n’est pas résolu."), {
      status: 403,
      code: "ONBOARDING_SCOPE_UNRESOLVED",
    });
  }
  return {
    userId,
    fullName: text(user.full_name ?? user.name ?? user.email) || "Opérateur RH",
    role,
    tenantKey: scope.tenantKey,
    organizationKey: scope.organizationKey,
    permissions,
    sovereign,
    scopeWarning: scope.warning,
    canRead,
    canManage,
    canArchive,
    canOverride,
    canManageChecklists,
    canManageDocuments,
  };
}
