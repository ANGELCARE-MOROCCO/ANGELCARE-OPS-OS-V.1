import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

export type ResolvedEmailOSMailbox = {
  key: string
  mailboxId: string
  label: string
  email: string
  password: string
  source?: "env" | "database"
  credential?: {
    id: string
    mailboxId: string
    providerProfileId: string
    emailAddress: string
    username: string
    passwordRef: string
    status: string
  }
  provider?: {
    id: string
    name: string
    providerKey: string
    providerMode: string
    smtpHost: string
    smtpPort: number
    smtpSecure: boolean
    imapHost: string
    imapPort: number
    imapSecure: boolean
    status: string
  }
  smtp: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
  }
  incoming: {
    protocol: "pop3"
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }
  diagnostics: Record<string, string>
}

const MAILBOXES = [
  ["SUPPORTS", "Supports", ["SUPPORTS"]],
  ["OPS", "Ops", ["OPS"]],
  ["RH", "RH", ["RH", "HR"]],
  ["COMMERCIAL", "Commercial", ["COMMERCIAL"]],
  ["ACADEMY", "Academy", ["ACADEMY"]],
  ["MONTESSORI", "Montessori", ["MONTESSORI"]],
  ["FLASHCARTES", "Flashcartes", ["FLASHCARTES", "FLASHCARDS"]],
  ["IT_SUPPORT", "IT Support", ["IT_SUPPORT"]],
  ["HOMESERVICE", "Homeservice", ["HOMESERVICE", "HOME_SERVICE"]],
  ["EVENTS", "Events", ["EVENTS"]],
  ["EXCURSIONS", "Excursions", ["EXCURSIONS", "EXURSIONS"]],
  ["B2B", "B2B", ["B2B"]],
  ["PARTENAIRES", "Partenaires", ["PARTENAIRES", "PARTNERS"]]
] as const

function env(name: string) {
  return process.env[name] || ""
}

function firstEnv(names: string[]) {
  for (const name of names) {
    const value = env(name)
    if (value) return { value, source: name }
  }
  return { value: "", source: "" }
}

function toBoolText(value: string | undefined, fallback: boolean) {
  const text = String(value || "").trim().toLowerCase()
  if (!text) return fallback
  if (["true", "1", "yes"].includes(text)) return true
  if (["false", "0", "no"].includes(text)) return false
  return fallback
}

function toNumberText(value: string | undefined, fallback: number) {
  const text = String(value || "").trim()
  if (!text) return fallback
  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function normalize(value: any) {
  return String(value || "").trim().toLowerCase()
}

function normalizeText(value: any) {
  return String(value || "").trim()
}

function mailboxKeyFromEmail(email: string) {
  const localPart = normalizeText(email).split("@")[0] || ""
  return localPart.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase()
}

function namesFor(aliases: readonly string[], suffix: string) {
  return aliases.flatMap((alias) => [`${alias}_${suffix}`, `MAILBOX_${alias}_${suffix}`])
}

export function mailboxIdFromEmail(email: string) {
  return `mbx_${String(email || "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`
}

export function listEmailOSMultiMailboxes(): ResolvedEmailOSMailbox[] {
  const globalSmtpHost =
    env("GLOBAL_SMTP_HOST") ||
    env("EMAIL_OS_SMTP_HOST") ||
    env("MENARA_SMTP_HOST") ||
    "smtp-auth.menara.ma"

  const globalSmtpPort = toNumberText(
    env("GLOBAL_SMTP_PORT") || env("EMAIL_OS_SMTP_PORT") || env("MENARA_SMTP_PORT"),
    587
  )

  const globalSmtpSecure = toBoolText(
    env("GLOBAL_SMTP_SECURE") || env("EMAIL_OS_SMTP_SECURE") || env("MENARA_SMTP_SECURE"),
    false
  )

  const globalPopHost =
    env("GLOBAL_POP_HOST") ||
    env("EMAIL_OS_POP_HOST") ||
    env("MENARA_POP_HOST") ||
    "pop.menara.ma"

  const globalPopPort = toNumberText(
    env("GLOBAL_POP_PORT") || env("EMAIL_OS_POP_PORT") || env("MENARA_POP_PORT"),
    110
  )

  const globalPopSecure = toBoolText(
    env("GLOBAL_POP_SECURE") || env("EMAIL_OS_POP_SECURE") || env("MENARA_POP_SECURE"),
    false
  )

  return MAILBOXES.map<ResolvedEmailOSMailbox>(([key, label, aliases]) => {
    const emailMatch = firstEnv([
      ...namesFor(aliases, "EMAIL"),
      ...namesFor(aliases, "SMTP_USER"),
      ...namesFor(aliases, "POP_USER")
    ])

    const passMatch = firstEnv([
      ...namesFor(aliases, "PASSWORD"),
      ...namesFor(aliases, "SMTP_PASSWORD"),
      ...namesFor(aliases, "POP_PASSWORD")
    ])

    const smtpUser = firstEnv(namesFor(aliases, "SMTP_USER"))
    const smtpPass = firstEnv(namesFor(aliases, "SMTP_PASSWORD"))
    const smtpFrom = firstEnv(namesFor(aliases, "SMTP_FROM"))
    const smtpHost = firstEnv(namesFor(aliases, "SMTP_HOST"))
    const smtpPort = firstEnv(namesFor(aliases, "SMTP_PORT"))
    const smtpSecure = firstEnv(namesFor(aliases, "SMTP_SECURE"))

    const popUser = firstEnv(namesFor(aliases, "POP_USER"))
    const popPass = firstEnv(namesFor(aliases, "POP_PASSWORD"))
    const popHost = firstEnv(namesFor(aliases, "POP_HOST"))
    const popPort = firstEnv(namesFor(aliases, "POP_PORT"))
    const popSecure = firstEnv(namesFor(aliases, "POP_SECURE"))

    const email = emailMatch.value.toLowerCase()
    const password = passMatch.value

    return {
      key,
      label,
      mailboxId: mailboxIdFromEmail(email),
      email,
      password,
      smtp: {
        host: smtpHost.value || globalSmtpHost,
        port: toNumberText(smtpPort.value, globalSmtpPort),
        secure: toBoolText(smtpSecure.value, globalSmtpSecure),
        user: smtpUser.value || email,
        pass: smtpPass.value || password,
        from: smtpFrom.value || email
      },
      incoming: {
        protocol: "pop3" as const,
        host: popHost.value || globalPopHost,
        port: toNumberText(popPort.value, globalPopPort),
        secure: toBoolText(popSecure.value, globalPopSecure),
        user: popUser.value || email,
        pass: popPass.value || password
      },
      diagnostics: {
        emailSource: emailMatch.source,
        passwordSource: passMatch.source,
        incomingProtocol: "pop3",
        incomingHost: popHost.value || globalPopHost
      }
    }
  }).filter((mailbox) => Boolean(mailbox.email))
}

export function resolveEmailOSMailboxIdentity(input: {
  mailboxId?: string | null
  fromEmail?: string | null
  selectedEmail?: string | null
}) {
  const mailboxId = normalize(input.mailboxId)
  const fromEmail = normalize(input.fromEmail)
  const selectedEmail = normalize(input.selectedEmail)

  return (
    listEmailOSMultiMailboxes().find(
      (mailbox) =>
        normalize(mailbox.mailboxId) === mailboxId ||
        normalize(mailbox.key) === mailboxId ||
        normalize(mailbox.email) === fromEmail ||
        normalize(mailbox.email) === selectedEmail
    ) || null
  )
}

type DbMailboxCredential = {
  id: string
  mailbox_id: string | null
  provider_profile_id: string | null
  email_address: string | null
  username: string | null
  password_ref: string | null
  status: string | null
}

type DbProviderProfile = {
  id: string
  name: string | null
  provider_key: string | null
  provider_mode: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_secure: boolean | null
  imap_host: string | null
  imap_port: number | null
  imap_secure: boolean | null
  status: string | null
}

function toBool(value: any, fallback = false) {
  if (typeof value === "boolean") return value
  const text = normalizeText(value).toLowerCase()
  if (!text) return fallback
  if (["true", "1", "yes", "on"].includes(text)) return true
  if (["false", "0", "no", "off"].includes(text)) return false
  return fallback
}

function toNumber(value: any, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function findCredentialByMailboxId(db: any, mailboxId: string) {
  if (!mailboxId) return null

  const { data } = await db
    .from("email_os_core_mailbox_credentials")
    .select("*")
    .eq("mailbox_id", mailboxId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data || null) as DbMailboxCredential | null
}

async function findCredentialByEmail(db: any, email: string) {
  if (!email) return null

  const { data } = await db
    .from("email_os_core_mailbox_credentials")
    .select("*")
    .ilike("email_address", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data) return data as DbMailboxCredential

  const fallback = await db
    .from("email_os_core_mailbox_credentials")
    .select("*")
    .ilike("username", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return (fallback.data || null) as DbMailboxCredential | null
}

async function findProviderProfile(db: any, providerProfileId: string) {
  if (!providerProfileId) return null

  const { data } = await db
    .from("email_os_core_provider_profiles")
    .select("*")
    .eq("id", providerProfileId)
    .maybeSingle()

  return (data || null) as DbProviderProfile | null
}

function buildResolvedMailboxFromDb(
  credential: DbMailboxCredential,
  provider: DbProviderProfile | null,
  input: { mailboxId?: string | null; fromEmail?: string | null; selectedEmail?: string | null }
): ResolvedEmailOSMailbox {
  const email = normalizeText(
    credential.email_address ||
      credential.username ||
      input.fromEmail ||
      input.selectedEmail ||
      ""
  ).toLowerCase()
  const mailboxId = normalizeText(credential.mailbox_id || input.mailboxId || "")
  const smtpHost = provider?.smtp_host || env("GLOBAL_SMTP_HOST") || env("EMAIL_OS_SMTP_HOST") || env("MENARA_SMTP_HOST") || "smtp-auth.menara.ma"
  const smtpPort = toNumber(provider?.smtp_port, toNumber(env("GLOBAL_SMTP_PORT") || env("EMAIL_OS_SMTP_PORT") || env("MENARA_SMTP_PORT"), 587))
  const smtpSecure = toBool(provider?.smtp_secure, toBool(env("GLOBAL_SMTP_SECURE") || env("EMAIL_OS_SMTP_SECURE") || env("MENARA_SMTP_SECURE"), false))
  const imapHost = provider?.imap_host || env("GLOBAL_POP_HOST") || env("EMAIL_OS_POP_HOST") || env("MENARA_POP_HOST") || "pop.menara.ma"
  const imapPort = toNumber(provider?.imap_port, toNumber(env("GLOBAL_POP_PORT") || env("EMAIL_OS_POP_PORT") || env("MENARA_POP_PORT"), 110))
  const imapSecure = toBool(provider?.imap_secure, toBool(env("GLOBAL_POP_SECURE") || env("EMAIL_OS_POP_SECURE") || env("MENARA_POP_SECURE"), false))
  const username = normalizeText(credential.username || credential.email_address || email)
  const password = normalizeText(credential.password_ref || "")

  return {
    key: mailboxKeyFromEmail(email || username || mailboxId),
    mailboxId: mailboxId || input.mailboxId || `mbx_${mailboxKeyFromEmail(email || username || mailboxId).toLowerCase()}`,
    label: provider?.name || credential.email_address || credential.username || email || mailboxId || "Mailbox",
    email,
    password,
    source: "database",
    credential: {
      id: credential.id,
      mailboxId: mailboxId || "",
      providerProfileId: normalizeText(credential.provider_profile_id || ""),
      emailAddress: normalizeText(credential.email_address || email),
      username,
      passwordRef: password,
      status: normalizeText(credential.status || "active")
    },
    provider: provider
      ? {
          id: provider.id,
          name: normalizeText(provider.name || ""),
          providerKey: normalizeText(provider.provider_key || ""),
          providerMode: normalizeText(provider.provider_mode || ""),
          smtpHost,
          smtpPort,
          smtpSecure,
          imapHost,
          imapPort,
          imapSecure,
          status: normalizeText(provider.status || "active")
        }
      : undefined,
    smtp: {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: username || email,
      pass: password,
      from: normalizeText(credential.email_address || credential.username || email)
    },
    incoming: {
      protocol: "pop3" as const,
      host: imapHost,
      port: imapPort,
      secure: imapSecure,
      user: username || email,
      pass: password
    },
    diagnostics: {
      source: "database",
      credentialId: credential.id,
      providerProfileId: normalizeText(credential.provider_profile_id || ""),
      credentialStatus: normalizeText(credential.status || "active"),
      providerStatus: normalizeText(provider?.status || ""),
      matchedBy: credential.mailbox_id && normalizeText(credential.mailbox_id) === mailboxId ? "mailbox_id" : "email_address"
    }
  }
}

export async function resolveEmailOSMailboxIdentityFromDb(input: {
  mailboxId?: string | null
  fromEmail?: string | null
  selectedEmail?: string | null
}) {
  try {
    const db = createEmailOSCoreDb()
    const mailboxId = normalizeText(input.mailboxId)
    const fromEmail = normalizeText(input.fromEmail).toLowerCase()
    const selectedEmail = normalizeText(input.selectedEmail).toLowerCase()

    const credential =
      (await findCredentialByMailboxId(db, mailboxId)) ||
      (await findCredentialByEmail(db, fromEmail)) ||
      (await findCredentialByEmail(db, selectedEmail))

    if (!credential) return null

    const providerProfileId = normalizeText(credential.provider_profile_id)
    const provider = providerProfileId ? await findProviderProfile(db, providerProfileId) : null

    return buildResolvedMailboxFromDb(credential, provider, input)
  } catch {
    return null
  }
}

export async function listEmailOSMailboxConfigStatusFromDb() {
  const db = createEmailOSCoreDb()

  const [{ data: credentials, error: credentialsError }, { data: providers, error: providerError }] = await Promise.all([
    db.from("email_os_core_mailbox_credentials").select("*").order("updated_at", { ascending: false }),
    db.from("email_os_core_provider_profiles").select("*").order("updated_at", { ascending: false })
  ])

  if (credentialsError) throw credentialsError
  if (providerError) throw providerError

  const providerMap = new Map<string, DbProviderProfile>()
  for (const provider of providers || []) {
    providerMap.set(normalizeText(provider?.id), provider as DbProviderProfile)
  }

  const rows = (credentials || []).map((credential: any) => {
    const provider = providerMap.get(normalizeText(credential?.provider_profile_id || ""))
    const emailAddress = normalizeText(credential?.email_address || credential?.username || "")
    const username = normalizeText(credential?.username || emailAddress)
    const smtpHost = provider?.smtp_host || env("GLOBAL_SMTP_HOST") || env("EMAIL_OS_SMTP_HOST") || env("MENARA_SMTP_HOST") || "smtp-auth.menara.ma"
    const smtpPort = toNumber(provider?.smtp_port, toNumber(env("GLOBAL_SMTP_PORT") || env("EMAIL_OS_SMTP_PORT") || env("MENARA_SMTP_PORT"), 587))
    const smtpSecure = toBool(provider?.smtp_secure, toBool(env("GLOBAL_SMTP_SECURE") || env("EMAIL_OS_SMTP_SECURE") || env("MENARA_SMTP_SECURE"), false))
    const providerProfileId = normalizeText(credential?.provider_profile_id || "")

    return {
      id: normalizeText(credential?.id || ""),
      mailboxId: normalizeText(credential?.mailbox_id || ""),
      emailAddress,
      username,
      providerProfileId: providerProfileId || null,
      providerName: provider?.name || null,
      providerKey: provider?.provider_key || null,
      providerMode: provider?.provider_mode || null,
      providerStatus: provider?.status || null,
      smtpHost,
      smtpPort,
      smtpSecure,
      passwordConfigured: Boolean(normalizeText(credential?.password_ref || "")),
      credentialStatus: normalizeText(credential?.status || "active"),
      lastTestStatus: credential?.last_test_status || null,
      lastTestedAt: credential?.last_tested_at || null,
      resolvedBy: normalizeText(credential?.mailbox_id || "") ? "mailbox_id" : emailAddress ? "email_address" : "username"
    }
  })

  const configuredCredentials = rows.filter((row) => row.passwordConfigured).length
  const missingCredentials = rows.length - configuredCredentials
  const ready =
    rows.length > 0 &&
    rows.every(
      (row) =>
        row.passwordConfigured &&
        Boolean(row.smtpHost) &&
        Boolean(row.smtpPort) &&
        Boolean(row.emailAddress) &&
        Boolean(row.providerProfileId)
    )

  return {
    ready,
    configuredCredentials,
    missingCredentials,
    totalMailboxes: rows.length,
    smtpHost: rows[0]?.smtpHost || null,
    smtpPort: rows[0]?.smtpPort || null,
    mailboxes: rows
  }
}
