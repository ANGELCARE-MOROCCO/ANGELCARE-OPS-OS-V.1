
import { assertEmailOSPermission } from "@/lib/email-os/production/rbac"
import { evaluateApproval } from "@/lib/email-os/production/approvals"
import { ok, fail, readJson } from "@/lib/email-os/production/response"

export async function POST(request: Request) {
  try {
    assertEmailOSPermission(request, "email.approve")
    const body = await readJson<any>(request)
    if (!body?.policy) return fail("Missing approval policy", 400)
    return ok(evaluateApproval(body))
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Approval evaluation failed", 500)
  }
}
