import { finalFail, finalOk, finalJson } from "@/lib/email-os/final/final-response"
import { emailOSFinalDb, finalId, nowIso } from "@/lib/email-os/final/final-db"
import { normalizeMailbox } from "@/lib/email-os/final/final-normalizers"
import { writeFinalAudit } from "@/lib/email-os/final/final-audit"

export async function GET() {
  try {
    const db = emailOSFinalDb()
    const { data, error } = await db
      .from("email_os_mailboxes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return finalOk([], {
        warning: "email_os_mailboxes unavailable or incompatible",
        error: error.message
      })
    }

    return finalOk((data || []).map(normalizeMailbox))
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Failed to load mailboxes", 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = await finalJson<any>(request)
    if (!body?.name || !body?.address) return finalFail("Missing mailbox name or address", 400)

    const db = emailOSFinalDb()
    const now = nowIso()

    const row = {
      id: body.id || finalId("mbx"),
      name: body.name,
      address: body.address,
      provider: body.provider || "smtp_imap",
      status: body.status || "active",
      owner_role: body.ownerRole || "operations_director",
      created_at: now,
      updated_at: now
    }

    const { data, error } = await db
      .from("email_os_mailboxes")
      .insert(row)
      .select("*")
      .single()

    if (error) throw error

    await writeFinalAudit({
      action: "mailbox.created",
      mailboxId: row.id,
      severity: "warning",
      details: { name: body.name, address: body.address }
    })

    return finalOk(normalizeMailbox(data))
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Failed to create mailbox", 500)
  }
}
