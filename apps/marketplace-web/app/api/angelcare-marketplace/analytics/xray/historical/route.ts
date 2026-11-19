import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { getXrayHistoricalR6 } from '@/angelcare-marketplace/store-xray/repository'
import type { XrayHistoricalFilters, XrayHistoricalGranularity } from '@/angelcare-marketplace/store-xray/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const id = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.analytics.view')
    const params = new URL(request.url).searchParams
    const now = Date.now()
    const filters: XrayHistoricalFilters = {
      from: params.get('from') || new Date(now - 7 * 86_400_000).toISOString(),
      to: params.get('to') || new Date(now).toISOString(),
      timezone: params.get('timezone') || 'Africa/Casablanca',
      granularity: (params.get('granularity') || 'day') as XrayHistoricalGranularity,
      country: params.get('country') || undefined,
      device: params.get('device') || undefined,
      route: params.get('route') || undefined,
      source: params.get('source') || undefined,
      campaign: params.get('campaign') || undefined,
      intent: params.get('intent') || undefined,
      locale: params.get('locale') || undefined,
      event: params.get('event') || undefined,
      search: params.get('search') || undefined,
    }
    return apiSuccess(await getXrayHistoricalR6(context, filters), { requestId: id })
  } catch (error) {
    return apiFailure(error, id)
  }
}
