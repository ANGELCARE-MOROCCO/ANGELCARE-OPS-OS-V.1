import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, requestId } from '../server/request'
import { paypalAdminHealth, runPayPalSafeConnectionTest } from './paypal-admin'

export async function handlePayPalAdminHealth(request: Request) {
  const rid = requestId(request)
  try {
    if (request.method === 'GET') {
      await requireMarketplaceApiContext('marketplace.configuration.view')
      return apiSuccess(await paypalAdminHealth(), { requestId: rid })
    }
    await requireMarketplaceApiContext('marketplace.configuration.manage')
    return apiSuccess(await runPayPalSafeConnectionTest(), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}
