import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"

const accounts = [
  { email: process.env.SUPPORTS_EMAIL || "supports@angelcarehub.ma", password: process.env.SUPPORTS_PASSWORD || "", name: "Support Inbox", owner: "support" },
  { email: process.env.OPS_EMAIL || "ops@angelcarehub.ma", password: process.env.OPS_PASSWORD || "", name: "Operations Inbox", owner: "operations" },
  { email: process.env.RH_EMAIL || "rh@angelcarehub.ma", password: process.env.RH_PASSWORD || "", name: "HR Inbox", owner: "hr" },
  { email: process.env.COMMERCIAL_EMAIL || "commercial@angelcarehub.ma", password: process.env.COMMERCIAL_PASSWORD || "", name: "Commercial Inbox", owner: "commercial" },
  { email: process.env.ACADEMY_EMAIL || "academy@angelcarehub.ma", password: process.env.ACADEMY_PASSWORD || "", name: "Academy Inbox", owner: "academy" },
  { email: process.env.MONTESSORI_EMAIL || "montessori@angelcarehub.ma", password: process.env.MONTESSORI_PASSWORD || "", name: "Montessori Inbox", owner: "academy" },
  { email: process.env.FLASHCARTES_EMAIL || "flashcartes@angelcarehub.ma", password: process.env.FLASHCARTES_PASSWORD || "", name: "Flashcartes Inbox", owner: "academy" },
  { email: process.env.IT_SUPPORT_EMAIL || "it.support@angelcarehub.ma", password: process.env.IT_SUPPORT_PASSWORD || "", name: "IT Support Inbox", owner: "it" },
  { email: process.env.HOMESERVICE_EMAIL || "homeservice@angelcarehub.ma", password: process.env.HOMESERVICE_PASSWORD || "", name: "Home Service Inbox", owner: "operations" },
  { email: process.env.EVENTS_EMAIL || "events@angelcarehub.ma", password: process.env.EVENTS_PASSWORD || "", name: "Events Inbox", owner: "events" },
  { email: process.env.EXCURSIONS_EMAIL || "excursions@angelcarehub.ma", password: process.env.EXCURSIONS_PASSWORD || "", name: "Excursions Inbox", owner: "events" },
  { email: process.env.B2B_EMAIL || "b2b@angelcarehub.ma", password: process.env.B2B_PASSWORD || "", name: "B2B Inbox", owner: "sales" },
  { email: process.env.PARTENAIRES_EMAIL || "partenaires@angelcarehub.ma", password: process.env.PARTENAIRES_PASSWORD || "", name: "Partners Inbox", owner: "partnerships" }
]

function mailboxId(email: string) {
  return `mbx_${email.toLowerCase().replace("@", "_").replace(/\./g, "_")}`
}

function credentialId(email: string) {
  return `cred_${email.toLowerCase().replace("@", "_").replace(/\./g, "_")}`
}

function mailboxEnvKey(email: string) {
  return String(email || "")
    .toLowerCase()
    .split("@")[0]
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
}

function firstEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function passwordEnvKeys(email: string) {
  const key = mailboxEnvKey(email)
  return [
    `EMAIL_OS_${key}_PASSWORD`,
    `EMAIL_OS_${key}_SMTP_PASSWORD`,
    `MAILBOX_${key}_PASSWORD`,
    `MAILBOX_${key}_SMTP_PASSWORD`,
    `${key}_PASSWORD`,
    `${key}_SMTP_PASSWORD`,
  ]
}

function passwordFromEnv(email: string) {
  return firstEnv(passwordEnvKeys(email))
}

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase()
}


export async function POST() {
  try {
    const db = createEmailOSCoreDb()
    const smtpHost = process.env.GLOBAL_SMTP_HOST || "smtp-auth.menara.ma"
    const smtpPort = Number(process.env.GLOBAL_SMTP_PORT || 587)
    const smtpSecure = String(process.env.GLOBAL_SMTP_SECURE || "false").toLowerCase() === "true"

    const accountDiagnostics = accounts.map((account) => {
      const email = normalizeEmail(account.email)
      const envPassword = passwordFromEnv(account.email)
      const accountPassword = String(account.password || "").trim()
      const passwordConfigured = Boolean(envPassword || accountPassword)
      const acceptedEnvKeys = passwordEnvKeys(account.email)

      return {
        mailboxId: mailboxId(email),
        email,
        owner: account.owner,
        passwordConfigured,
        acceptedEnvKeys,
      }
    })

    const configuredCredentials = accountDiagnostics.filter((account) => account.passwordConfigured).length
    const missingCredentials = accountDiagnostics.length - configuredCredentials
    const missing = accountDiagnostics
      .filter((account) => !account.passwordConfigured)
      .map(({ mailboxId, email, owner, acceptedEnvKeys }) => ({
        mailboxId,
        email,
        owner,
        expectedEnvKeys: acceptedEnvKeys,
      }))

    await db.from("email_os_core_provider_profiles").upsert({
      id: "provider_menara_default",
      name: "Menara Maroc Telecom",
      provider_key: "menara",
      provider_mode: "smtp_imap",
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_secure: smtpSecure,
      imap_host: process.env.GLOBAL_POP_HOST || process.env.EMAIL_OS_POP_HOST || "pop.menara.ma",
      imap_port: Number(process.env.GLOBAL_POP_PORT || process.env.EMAIL_OS_POP_PORT || 110),
      imap_secure: String(process.env.GLOBAL_POP_SECURE || process.env.EMAIL_OS_POP_SECURE || "false").toLowerCase() === "true",
      status: "active",
      created_at: nowIso(),
      updated_at: nowIso()
    })

    const mailboxes = accounts.map((account) => ({
      id: mailboxId(normalizeEmail(account.email)),
      name: account.name,
      address: normalizeEmail(account.email),
      provider: "smtp_imap",
      status: "active",
      owner: account.owner,
      created_at: nowIso(),
      updated_at: nowIso()
    }))

    const credentials = accounts.map((account) => ({
      id: credentialId(normalizeEmail(account.email)),
      mailbox_id: mailboxId(normalizeEmail(account.email)),
      provider_profile_id: "provider_menara_default",
      email_address: normalizeEmail(account.email),
      username: normalizeEmail(account.email),
      password_ref: passwordFromEnv(account.email) || account.password,
      status: "active",
      last_tested_at: null,
      last_test_status: null,
      created_at: nowIso(),
      updated_at: nowIso()
    }))

    const { error: mailboxError } = await db.from("email_os_core_mailboxes").upsert(mailboxes)
    if (mailboxError) throw mailboxError

    const { error: credentialError } = await db.from("email_os_core_mailbox_credentials").upsert(credentials)
    if (credentialError) throw credentialError

    return NextResponse.json({
      ok: true,
      data: {
        provider: "provider_menara_default",
        mailboxes: mailboxes.length,
        credentials: credentials.length,
        smtpHost,
        smtpPort,
        smtpSecure,
        ready: missingCredentials === 0,
        ...(missingCredentials > 0
          ? {
              warning: "Some mailbox passwords are missing; credentials rows were installed but not usable.",
            }
          : {}),
        diagnostics: {
          configuredCredentials,
          missingCredentials,
          missing,
          accounts: accountDiagnostics,
        },
      }
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Bulk preinstall failed" },
      { status: 500 }
    )
  }
}
