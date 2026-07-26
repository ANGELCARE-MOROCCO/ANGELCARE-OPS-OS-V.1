import { fail, ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { campaignContext, loadCampaignPortfolio } from "@/lib/revenue-command-center/campaign-enterprise/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { access, supabase } = await campaignContext("revenue.campaigns.read")
    const campaignId = new URL(request.url).searchParams.get("campaignId")
    const data = await loadCampaignPortfolio(supabase, campaignId)
    return ok({ data: { ...data, currentUser: { id: (access.user as any).id || null, email: (access.user as any).email || null, role: access.role } } })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
