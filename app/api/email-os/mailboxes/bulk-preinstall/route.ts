import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { nowIso } from "@/lib/email-os-core/schema"

const accounts = [
  {
    "email": "supports@angelcare.ma",
    "password": "60dkz2hg",
    "name": "Support Inbox",
    "owner": "support"
  },
  {
    "email": "ops@angelcare.ma",
    "password": "ei7qkh5t",
    "name": "Operations Inbox",
    "owner": "operations"
  },
  {
    "email": "rh@angelcare.ma",
    "password": "a4cuxrxz",
    "name": "HR Inbox",
    "owner": "hr"
  },
  {
    "email": "Commercial@angelcare.ma",
    "password": "h4zut7hh",
    "name": "Commercial Inbox",
    "owner": "commercial"
  },
  {
    "email": "Academy@angelcare.ma",
    "password": "a3kd5p3c",
    "name": "Academy Inbox",
    "owner": "academy"
  },
  {
    "email": "montessori@angelcare.ma",
    "password": "nrgaiojx",
    "name": "Montessori Inbox",
    "owner": "academy"
  },
  {
    "email": "flashcartes@angelcare.ma",
    "password": "8c2blnqf",
    "name": "Flashcartes Inbox",
    "owner": "academy"
  },
  {
    "email": "it.support@angelcare.ma",
    "password": "ltd5yx0j",
    "name": "IT Support Inbox",
    "owner": "it"
  },
  {
    "email": "Homeservice@angelcare.ma",
    "password": "sjp6eddv",
    "name": "Home Service Inbox",
    "owner": "operations"
  },
  {
    "email": "events@angelcare.ma",
    "password": "362u4p3z",
    "name": "Events Inbox",
    "owner": "events"
  },
  {
    "email": "exursions@angelcare.ma",
    "password": "dvtwqqrk",
    "name": "Excursions Inbox",
    "owner": "events"
  },
  {
    "email": "b2b@angelcare.ma",
    "password": "igaloqjz",
    "name": "B2B Inbox",
    "owner": "sales"
  },
  {
    "email": "partenaires@angelcare.ma",
    "password": "2sj50qtg",
    "name": "Partners Inbox",
    "owner": "partnerships"
  }
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

function passwordFromEnv(email: string) {
  const key = mailboxEnvKey(email)
  return firstEnv([
    `EMAIL_OS_${key}_PASSWORD`,
    `EMAIL_OS_${key}_SMTP_PASSWORD`,
    `MAILBOX_${key}_PASSWORD`,
    `MAILBOX_${key}_SMTP_PASSWORD`,
    `${key}_PASSWORD`,
    `${key}_SMTP_PASSWORD`,
  ])
}

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase()
}


export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    await db.from("email_os_core_provider_profiles").upsert({
      id: "provider_menara_default",
      name: "Menara Maroc Telecom",
      provider_key: "menara",
      provider_mode: "smtp_imap",
      smtp_host: "smtp-auth.menara.ma",
      smtp_port: 587,
      smtp_secure: false,
      imap_host: "imap.menara.ma",
      imap_port: 993,
      imap_secure: true,
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
      id: credentialId(account.email),
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
        credentials: credentials.length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Bulk preinstall failed" },
      { status: 500 }
    )
  }
}
