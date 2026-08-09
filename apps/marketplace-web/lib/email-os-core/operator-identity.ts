import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export type EmailOSOperatorIdentity = {
  id: string
  fullName: string
  email: string
  role: string
  department: string
  title: string
  initials: string
  avatarUrl: string
  active: boolean
}

type EmailOSCoreDb = ReturnType<typeof createEmailOSCoreDb>

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function firstValue(...values: unknown[]) {
  for (const value of values) {
    const normalized = clean(value)
    if (normalized) return normalized
  }
  return ""
}

function readableEmailName(email: string) {
  const local = clean(email).split("@")[0] || ""
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).trim()
}

export function emailOSOperatorInitials(fullName: unknown, email?: unknown) {
  const source = firstValue(fullName, readableEmailName(clean(email)), "AC")
  const words = source.split(/\s+/).filter(Boolean)
  if (!words.length) return "AC"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] || ""}${words[words.length - 1][0] || ""}`.toUpperCase()
}

export function normalizeEmailOSOperatorIdentity(
  row: any,
  fallback: Partial<EmailOSOperatorIdentity> & { name?: string } = {}
): EmailOSOperatorIdentity {
  const metadata = row?.metadata || row?.metadata_json || row?.profile || {}
  const firstName = firstValue(row?.first_name, row?.firstname, metadata?.first_name, metadata?.firstName)
  const lastName = firstValue(row?.last_name, row?.lastname, metadata?.last_name, metadata?.lastName)
  const email = firstValue(row?.email, row?.email_address, metadata?.email, fallback.email)
  const composedName = [firstName, lastName].filter(Boolean).join(" ").trim()
  const fullName = firstValue(
    row?.full_name,
    row?.display_name,
    row?.name,
    row?.legal_name,
    row?.preferred_name,
    metadata?.full_name,
    metadata?.display_name,
    metadata?.name,
    composedName,
    fallback.fullName,
    fallback.name,
    readableEmailName(email),
    "AngelCare Operator"
  )
  const role = firstValue(row?.role, row?.role_name, row?.job_title, row?.position, metadata?.role, fallback.role, "Operator")
  const department = firstValue(row?.department, row?.department_name, row?.team, row?.team_name, row?.business_unit, metadata?.department, fallback.department, "AngelCare")
  const title = firstValue(row?.job_title, row?.position_title, row?.position, metadata?.job_title, fallback.title, role)
  const status = firstValue(row?.status, row?.account_status, metadata?.status, "active").toLowerCase()
  const explicitActive = row?.is_active ?? row?.active ?? metadata?.active
  const active = typeof explicitActive === "boolean" ? explicitActive : !["inactive", "disabled", "suspended", "revoked", "deleted"].includes(status)

  return {
    id: firstValue(row?.id, row?.user_id, fallback.id),
    fullName,
    email,
    role,
    department,
    title,
    initials: emailOSOperatorInitials(fullName, email),
    avatarUrl: firstValue(row?.avatar_url, row?.photo_url, row?.image_url, metadata?.avatar_url, fallback.avatarUrl),
    active
  }
}

export function emailOSOperatorSnapshot(identity: EmailOSOperatorIdentity | null | undefined) {
  return {
    userId: identity?.id || null,
    name: identity?.fullName || null,
    email: identity?.email || null,
    role: identity?.role || null,
    department: identity?.department || null,
    title: identity?.title || null
  }
}

export function identityFromSnapshot(input: { id?: unknown; name?: unknown; email?: unknown; role?: unknown; department?: unknown; title?: unknown }) {
  return normalizeEmailOSOperatorIdentity({
    id: input.id,
    full_name: input.name,
    email: input.email,
    role: input.role,
    department: input.department,
    job_title: input.title
  })
}

export async function resolveEmailOSOperatorIdentity(
  db: EmailOSCoreDb,
  userId: unknown,
  fallback: Partial<EmailOSOperatorIdentity> & { name?: string } = {}
) {
  const id = clean(userId || fallback.id)
  if (!id) return normalizeEmailOSOperatorIdentity(null, fallback)
  try {
    const { data, error } = await db.from("app_users").select("*").eq("id", id).maybeSingle()
    if (!error && data) return normalizeEmailOSOperatorIdentity(data, { ...fallback, id })
  } catch {}
  return normalizeEmailOSOperatorIdentity(null, { ...fallback, id })
}

export async function loadEmailOSOperatorDirectory(
  db: EmailOSCoreDb,
  options: { limit?: number; includeInactive?: boolean } = {}
) {
  const limit = Math.max(1, Math.min(Number(options.limit || 500), 2000))
  let rows: any[] = []
  try {
    const { data, error } = await db.from("app_users").select("*").limit(limit)
    if (!error) rows = data || []
  } catch {}
  return rows
    .map((row) => normalizeEmailOSOperatorIdentity(row))
    .filter((identity) => identity.id && (options.includeInactive || identity.active))
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "fr", { sensitivity: "base" }))
}

export function emailOSOperatorDirectoryMap(directory: EmailOSOperatorIdentity[]) {
  return new Map(directory.map((identity) => [identity.id, identity]))
}
