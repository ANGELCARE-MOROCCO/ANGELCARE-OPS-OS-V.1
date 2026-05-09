
import { assertEmailOSPermission } from "@/lib/email-os/production/rbac"
import { persistNotification } from "@/lib/email-os/production/notifications"
import { ok, fail, readJson } from "@/lib/email-os/production/response"

export async function POST(request: Request) {
  try {
    assertEmailOSPermission(request, "email.configure")
    const body = await readJson<any>(request)
    if (!body?.type || !body?.title || !body?.body) return fail("Missing notification fields", 400)

    const notification = await persistNotification({
      type: body.type,
      title: body.title,
      body: body.body,
      priority: body.priority || "medium"
    })

    return ok(notification)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Notification failed", 500)
  }
}
