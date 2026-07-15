import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"

async function count(table: string, column?: string, value?: string) {
  const db = createEmailOSCoreDb()
  let q = db.from(table).select("*", { count: "exact", head: true })
  if (column && value) q = q.eq(column, value)
  const { count, error } = await q
  if (error) return 0
  return count || 0
}

export async function GET() {
  const mailboxes = await count("email_os_core_mailboxes")
  const credentials = await count("email_os_core_mailbox_credentials")
  const passedTests = await count("email_os_core_mailbox_credentials", "last_test_status", "passed")
  const providerProfiles = await count("email_os_core_provider_profiles")

  const blockers = []
  if (providerProfiles === 0) blockers.push("No provider profiles")
  if (mailboxes === 0) blockers.push("No mailboxes")
  if (credentials === 0) blockers.push("No mailbox credentials")
  if (passedTests === 0) blockers.push("No passed mailbox credential tests")

  return NextResponse.json({
    ok: blockers.length === 0,
    data: {
      mailboxes,
      credentials,
      passedTests,
      providerProfiles,
      blockers,
      status: blockers.length === 0 ? "mailbox-validation-passed" : "mailbox-validation-incomplete"
    }
  })
}
