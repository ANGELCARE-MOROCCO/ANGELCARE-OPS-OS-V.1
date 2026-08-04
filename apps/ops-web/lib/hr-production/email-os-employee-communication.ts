import "server-only"

import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import {
  listEmailOSMultiMailboxes,
  listEmailOSMultiMailboxesFromDb,
  type ResolvedEmailOSMailbox,
} from "@/lib/email-os-core/multi-mailbox-resolver"

export type HrEmployeeEmailStage =
  | "preparing"
  | "validating_employee"
  | "resolving_rh_mailbox"
  | "recording_outbox"
  | "sending_to_bridge"
  | "provider_accepted"
  | "sent"
  | "failed"

export type HrEmployeeEmailJobStatus = "running" | "sent" | "failed"

export type HrEmployeeRecipient = {
  id: string
  email: string
  fullName: string
  sourceTable: string
}

export type HrEmailOperator = {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
  permissions?: unknown
}

const EMPLOYEE_TABLES = [
  "hr_staff_profiles",
  "hr_staff",
  "staff_profiles",
  "profiles",
  "app_users",
] as const

const PRIVILEGED_ROLES = new Set([
  "ceo",
  "owner",
  "super_admin",
  "admin",
  "hr_admin",
  "hr_manager",
])

const HR_SEND_PERMISSIONS = new Set([
  "*",
  "hr.view",
  "hr.manage",
  "hr.communication.send",
  "hr.communications.send",
])

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase()
}

function permissionList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean)
  if (typeof value === "string") {
    return value
      .split(/[\s,;|]+/)
      .map((item) => clean(item))
      .filter(Boolean)
  }
  return []
}

export function canSendHrEmployeeEmail(user: HrEmailOperator | null | undefined) {
  if (!user?.id) return false
  const role = clean(user.role).toLowerCase()
  if (PRIVILEGED_ROLES.has(role)) return true
  return permissionList(user.permissions).some((permission) => HR_SEND_PERMISSIONS.has(permission))
}

function employeeName(row: Record<string, unknown>) {
  const fullName = clean(row.full_name || row.name || row.display_name)
  if (fullName) return fullName
  const composed = [clean(row.first_name), clean(row.last_name)].filter(Boolean).join(" ")
  return composed || normalizeEmail(row.email) || "Collaborateur"
}

async function findEmployeeById(
  db: ReturnType<typeof createEmailOSCoreDb>,
  table: string,
  employeeId: string,
) {
  if (!employeeId) return null
  try {
    const { data, error } = await db.from(table).select("*").eq("id", employeeId).limit(1).maybeSingle()
    if (!error && data) return data as Record<string, unknown>
  } catch {
    return null
  }
  return null
}

async function findEmployeeByEmail(
  db: ReturnType<typeof createEmailOSCoreDb>,
  table: string,
  email: string,
) {
  if (!email) return null
  try {
    const { data, error } = await db.from(table).select("*").ilike("email", email).limit(1).maybeSingle()
    if (!error && data) return data as Record<string, unknown>
  } catch {
    return null
  }
  return null
}

export async function resolveHrEmployeeRecipient(input: {
  employeeId?: string | null
  requestedEmail?: string | null
}) {
  const db = createEmailOSCoreDb()
  const employeeId = clean(input.employeeId)
  const requestedEmail = normalizeEmail(input.requestedEmail)

  for (const table of EMPLOYEE_TABLES) {
    const row =
      (await findEmployeeById(db, table, employeeId)) ||
      (await findEmployeeByEmail(db, table, requestedEmail))

    if (!row) continue

    const email = normalizeEmail(row.email || row.email_address || row.work_email)
    if (!email) {
      throw new Error("Le collaborateur sélectionné ne possède aucune adresse email exploitable.")
    }

    if (requestedEmail && requestedEmail !== email) {
      throw new Error("L’adresse email affichée ne correspond plus au dossier collaborateur actuel.")
    }

    return {
      id: clean(row.id || employeeId || email),
      email,
      fullName: employeeName(row),
      sourceTable: table,
    } satisfies HrEmployeeRecipient
  }

  throw new Error("Le dossier collaborateur n’a pas été retrouvé dans la base RH.")
}

function isRhMailbox(mailbox: ResolvedEmailOSMailbox) {
  const key = clean(mailbox.key).toUpperCase()
  const localPart = normalizeEmail(mailbox.email).split("@")[0] || ""
  const label = clean(mailbox.label).toLowerCase()
  return key === "RH" || key === "HR" || localPart === "rh" || localPart === "hr" || label === "rh"
}

function assertOperationalRhMailbox(mailbox: ResolvedEmailOSMailbox | null | undefined) {
  if (!mailbox) {
    throw new Error("La boîte RH Email OS n’est pas configurée.")
  }
  if (!clean(mailbox.mailboxId) || !normalizeEmail(mailbox.email)) {
    throw new Error("La boîte RH Email OS est incomplète.")
  }
  if (!clean(mailbox.smtp?.host) || !Number(mailbox.smtp?.port) || !clean(mailbox.smtp?.user)) {
    throw new Error("La configuration SMTP de la boîte RH est incomplète.")
  }
  if (!clean(mailbox.smtp?.pass || mailbox.credential?.passwordRef)) {
    throw new Error("Les identifiants de la boîte RH ne sont pas configurés.")
  }
  return mailbox
}

export async function resolveCanonicalRhEmailOSMailbox() {
  const databaseMailboxes = await listEmailOSMultiMailboxesFromDb()
  const databaseRhMailbox = databaseMailboxes.find(isRhMailbox)
  if (databaseRhMailbox) return assertOperationalRhMailbox(databaseRhMailbox)

  const environmentRhMailbox = listEmailOSMultiMailboxes().find(isRhMailbox)
  return assertOperationalRhMailbox(environmentRhMailbox)
}

export function safeEmailErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : clean(error) || "Échec de l’envoi email."
  if (/535|authentication|credentials were rejected/i.test(raw)) {
    return "La boîte RH a refusé l’authentification. Vérifiez sa configuration Email OS."
  }
  if (/421|throttl/i.test(raw)) {
    return "Le serveur Menara limite temporairement les envois. Réessayez dans une minute."
  }
  if (/fetch failed|bridge/i.test(raw)) {
    return "Le pont de messagerie AngelCare n’a pas confirmé l’envoi."
  }
  return raw.slice(0, 500)
}
