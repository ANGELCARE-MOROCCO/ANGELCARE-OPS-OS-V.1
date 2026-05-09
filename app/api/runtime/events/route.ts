
import { ok, fail, readJson } from "@/lib/email-os/production/response"
import { assertEmailOSPermission } from "@/lib/email-os/production/rbac"
import { createRuntimeEvent } from "@/lib/email-os/runtime/repositories"

export async function POST(request: Request) {
  try {
    assertEmailOSPermission(request, "email.audit")
    const body = await readJson<any>(request)
    if (!body?.type) return fail("Missing runtime event type", 400)
    const event = await createRuntimeEvent(body)
    return ok(event)
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Runtime event failed", 500)
  }
}
