import "server-only";
import { getCurrentAppUser } from "@/lib/auth/session";
import {
  HR_NAVIGATION_ROLE_LABELS,
  isSovereignRole,
  normalizeNavigationRole,
} from "./navigation";
import type { HRShellIdentity } from "./types";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function firstText(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function permissionList(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return value.split(/[;,\n]/).map((item) => item.trim()).filter(Boolean);
  return [];
}

export async function loadHRShellIdentity(): Promise<HRShellIdentity> {
  const source = record(await getCurrentAppUser());
  const rawRole = firstText(source, ["role", "system_role", "job_role"]);
  const department = firstText(source, ["department", "department_name"]);
  const sovereign = isSovereignRole(rawRole);
  const role = sovereign ? "hr_admin" : normalizeNavigationRole(`${rawRole || ""} ${department || ""}`);
  const firstName = firstText(source, ["first_name"]);
  const lastName = firstText(source, ["last_name"]);
  const composedName = [firstName, lastName].filter(Boolean).join(" ");
  return {
    userId: firstText(source, ["id", "app_user_id", "user_id"]),
    fullName: firstText(source, ["full_name", "display_name", "name"]) || composedName || firstText(source, ["email"]) || "Utilisateur AngelCare",
    role,
    roleLabel: HR_NAVIGATION_ROLE_LABELS[role],
    department,
    tenantLabel: firstText(source, ["tenant_name", "tenant_label", "tenant_id"]),
    organizationLabel: firstText(source, ["organization_name", "organization_label", "organization_id"]),
    permissions: permissionList(source.permissions),
    sovereign,
  };
}
