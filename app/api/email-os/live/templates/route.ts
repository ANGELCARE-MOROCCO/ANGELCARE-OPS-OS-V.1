import { finalFail, finalOk, finalJson } from "@/lib/email-os/final/final-response"
import { emailOSFinalDb, finalId, nowIso } from "@/lib/email-os/final/final-db"
import { normalizeTemplate } from "@/lib/email-os/final/final-normalizers"
import { writeFinalAudit } from "@/lib/email-os/final/final-audit"

export async function GET() {
  try {
    const db = emailOSFinalDb()
    const { data, error } = await db
      .from("email_os_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return finalOk([], {
        warning: "email_os_templates unavailable or incompatible",
        error: error.message
      })
    }

    return finalOk((data || []).map(normalizeTemplate))
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Failed to load templates", 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = await finalJson<any>(request)
    if (!body?.name || !body?.body) return finalFail("Missing template name or body", 400)

    const db = emailOSFinalDb()
    const now = nowIso()

    const row = {
      id: body.id || finalId("tpl"),
      name: body.name,
      subject: body.subject || "",
      body: body.body,
      category: body.category || "General",
      status: body.status || "active",
      created_at: now,
      updated_at: now
    }

    const { data, error } = await db
      .from("email_os_templates")
      .insert(row)
      .select("*")
      .single()

    if (error) throw error

    await writeFinalAudit({
      action: "template.created",
      severity: "info",
      details: { templateId: row.id, name: row.name }
    })

    return finalOk(normalizeTemplate(data))
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Failed to create template", 500)
  }
}
