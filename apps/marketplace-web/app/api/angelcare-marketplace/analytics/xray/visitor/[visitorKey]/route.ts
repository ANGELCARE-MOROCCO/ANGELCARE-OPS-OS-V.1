import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { getVisitorXrayProfile } from '@/angelcare-marketplace/store-xray/repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ visitorKey: string }> }) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.analytics.view')
    const { visitorKey } = await params
    return apiSuccess(await getVisitorXrayProfile(context, decodeURIComponent(visitorKey)), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}
