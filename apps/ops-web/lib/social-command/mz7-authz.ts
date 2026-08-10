import type { SocialCommandActor } from "@/lib/social-command/auth"

export type MZ7Permission = "engagement.operate" | "facebook.control" | "history.sync" | "relationship.compliance"

const TRUE_VALUES = new Set(["1","true","yes","on"])
function enabled(name: string, fallback = false) {
  const raw = String(process.env[name] || "").trim().toLowerCase()
  return raw ? TRUE_VALUES.has(raw) : fallback
}
function roleSet(name: string, fallback: string[]) {
  const raw = String(process.env[name] || "").trim()
  return new Set((raw ? raw.split(",") : fallback).map(x => x.trim().toLowerCase()).filter(Boolean))
}

const ADMIN = ["super_admin","admin","administrator","direction","director","directeur","managing_director"]
const OPERATE = [...ADMIN,"manager","coordinator","coordinatrice","social_operator","operator","editor","content_editor","social_editor"]
const HISTORY = [...ADMIN,"manager","coordinator","coordinatrice","analyst"]

export function mz7AuthorizationSnapshot(actor: SocialCommandActor) {
  const enforce = enabled("SOCIAL_COMMAND_MZ7_RBAC_ENFORCE", false)
  const role = String(actor.role || "user").trim().toLowerCase()
  const admins = roleSet("SOCIAL_COMMAND_MZ7_ADMIN_ROLES", ADMIN)
  const operators = roleSet("SOCIAL_COMMAND_MZ7_OPERATOR_ROLES", OPERATE)
  const history = roleSet("SOCIAL_COMMAND_MZ7_HISTORY_ROLES", HISTORY)
  return {
    enforce,
    role,
    canOperate: !enforce || operators.has(role),
    canControlFacebook: !enforce || admins.has(role),
    canSyncHistory: !enforce || history.has(role) || admins.has(role),
    canCompliance: !enforce || admins.has(role) || role === "dpo" || role === "privacy_officer",
  }
}

export function assertMZ7Permission(actor: SocialCommandActor, permission: MZ7Permission) {
  const s = mz7AuthorizationSnapshot(actor)
  if (!s.enforce) return s
  const allowed = permission === "engagement.operate" ? s.canOperate
    : permission === "facebook.control" ? s.canControlFacebook
    : permission === "history.sync" ? s.canSyncHistory
    : s.canCompliance
  if (!allowed) throw new Error(`SOCIAL_COMMAND_MZ7_FORBIDDEN:${permission}`)
  return s
}
