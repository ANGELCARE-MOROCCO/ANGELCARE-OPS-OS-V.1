import { fail, ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { runCampaignCommand } from "@/lib/revenue-command-center/campaign-enterprise/server"

export function campaignCommand(operation: string) {
  return async function handler(request: Request) {
    try {
      const body = await request.json().catch(() => ({}))
      const result = await runCampaignCommand(operation, body)
      return ok({ data: result })
    } catch (error) {
      const access = revenueAccessFailure(error)
      return access ? fail(access.message, access.status) : fail(error)
    }
  }
}

export function campaignDynamicCommand(defaultOperation: string, allowed: string[]) {
  return async function handler(request: Request) {
    try {
      const body = await request.json().catch(() => ({}))
      const operation = String(body.operation || body.action || defaultOperation)
      if (!allowed.includes(operation)) return fail("Commande campagne non autorisée.", 400)
      const result = await runCampaignCommand(operation, body)
      return ok({ data: result })
    } catch (error) {
      const access = revenueAccessFailure(error)
      return access ? fail(access.message, access.status) : fail(error)
    }
  }
}
