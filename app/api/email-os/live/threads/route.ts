import { finalFail, finalOk } from "@/lib/email-os/final/final-response"
import { emailOSFinalDb } from "@/lib/email-os/final/final-db"
import { normalizeThread } from "@/lib/email-os/final/final-normalizers"

export async function GET() {
  try {
    const db = emailOSFinalDb()

    const { data, error } = await db
      .from("email_os_threads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      return finalOk([], {
        warning: "email_os_threads unavailable or incompatible",
        error: error.message
      })
    }

    return finalOk((data || []).map(normalizeThread))
  } catch (error) {
    return finalFail(error instanceof Error ? error.message : "Failed to load live threads", 500)
  }
}
