import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { getStoreXraySnapshot } from '@/angelcare-marketplace/store-xray/repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.analytics.view')
    const minutes = Number(new URL(request.url).searchParams.get('window') || 30)
    return apiSuccess(await getStoreXraySnapshot(context, minutes), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}
