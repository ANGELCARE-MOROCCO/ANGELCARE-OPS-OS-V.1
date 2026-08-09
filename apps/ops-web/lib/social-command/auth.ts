import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/getUser"

export type SocialCommandActor = {
  id: string
  name: string
  email: string
  role: string
  raw: Record<string, unknown>
}

export type SocialCommandPermission = "view" | "operate" | "publish" | "engage" | "automate" | "control" | "meta_admin" | "destructive"

function normalizedRole(value: unknown) {
  return String(value || "user").trim().toLowerCase().replace(/[\s-]+/g, "_")
}

function parseRoles(value: string | undefined) {
  return new Set(String(value || "").split(/[\s,;]+/).map(normalizedRole).filter(Boolean))
}

function roleSets() {
  const privileged = new Set([
    "admin", "administrator", "superadmin", "super_admin", "owner", "founder", "managing_director", "director",
    ...parseRoles(process.env.SOCIAL_COMMAND_PRIVILEGED_ROLES),
  ])
  const operators = new Set([
    ...privileged,
    "manager", "operations_manager", "marketing", "marketing_manager", "social_media", "social_media_manager", "content", "content_manager",
    ...parseRoles(process.env.SOCIAL_COMMAND_OPERATOR_ROLES),
  ])
  const viewers = new Set([...operators, "user", "staff", "coordinator", ...parseRoles(process.env.SOCIAL_COMMAND_VIEWER_ROLES)])
  return { privileged, operators, viewers }
}

export function socialCommandRbacEnforced() {
  return /^(1|true|yes|on)$/i.test(String(process.env.SOCIAL_COMMAND_RBAC_ENFORCE || ""))
}

export function actorHasSocialCommandPermission(actor: SocialCommandActor, permission: SocialCommandPermission) {
  if (!socialCommandRbacEnforced()) return true
  const role = normalizedRole(actor.role)
  const { privileged, operators, viewers } = roleSets()
  if (permission === "view") return viewers.has(role)
  if (permission === "meta_admin" || permission === "destructive") return privileged.has(role)
  if (permission === "publish" || permission === "engage" || permission === "automate" || permission === "control" || permission === "operate") return operators.has(role)
  return false
}

function routePermission(method: string, key: string): SocialCommandPermission {
  const verb = method.toUpperCase()
  if (verb === "DELETE") return "destructive"
  if (verb === "GET") {
    if (key === "meta/connect" || key === "meta/candidates") return "meta_admin"
    return "view"
  }
  if (key.startsWith("meta/")) return key === "meta/webhooks" ? "operate" : "meta_admin"
  if (key.startsWith("control/")) return "control"
  if (key.startsWith("automations") || key.startsWith("automation/") || key.startsWith("ai/")) return "automate"
  if (key.startsWith("conversations") || key.startsWith("comments") || key.startsWith("mentions")) return "engage"
  if (key.startsWith("publications") || key.startsWith("jobs") || key.startsWith("calendar") || key.startsWith("bulk-plans")) return "publish"
  return "operate"
}

export async function getSocialCommandActor(): Promise<SocialCommandActor | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const raw = user as unknown as Record<string, unknown>
  const id = String(raw.id || "").trim()
  if (!id) return null
  return {
    id,
    name: String(raw.full_name || raw.fullName || raw.username || raw.email || "Utilisateur AngelCare"),
    email: String(raw.email || ""),
    role: String(raw.role || raw.role_key || "user"),
    raw,
  }
}

export async function requireSocialCommandActor() {
  const actor = await getSocialCommandActor()
  if (!actor) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 }) }
  }
  return { ok: true as const, actor }
}

export function requireSocialCommandRoutePermission(actor: SocialCommandActor, method: string, key: string) {
  const permission = routePermission(method, key)
  if (actorHasSocialCommandPermission(actor, permission)) return { ok: true as const, permission }
  return {
    ok: false as const,
    permission,
    response: NextResponse.json({ ok: false, error: "SOCIAL_COMMAND_FORBIDDEN", permission }, { status: 403, headers: { "cache-control": "no-store" } }),
  }
}

export function socialCommandSecurityHealth(actor?: SocialCommandActor | null) {
  const { privileged, operators, viewers } = roleSets()
  return {
    rbacEnforced: socialCommandRbacEnforced(),
    actorRole: actor ? normalizedRole(actor.role) : null,
    actorCanControl: actor ? actorHasSocialCommandPermission(actor, "control") : null,
    configuredRoleCounts: { privileged: privileged.size, operators: operators.size, viewers: viewers.size },
  }
}

export function socialOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { ...init, headers: { "cache-control": "no-store", ...(init?.headers || {}) } })
}

export function socialError(error: unknown, status = 400, details?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error")
  return NextResponse.json({ ok: false, error: message, ...(details || {}) }, { status, headers: { "cache-control": "no-store" } })
}
