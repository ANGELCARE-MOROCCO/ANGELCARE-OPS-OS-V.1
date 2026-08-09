import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, requestId } from '../server/request'
import { activationCommandData, runActivationReadiness } from './repository'

export async function handleActivationSummary(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.commerce.view')
    return apiSuccess(await activationCommandData(context), { requestId: rid })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleActivationRun(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext('marketplace.publication.manage')
    return apiSuccess(await runActivationReadiness(context), { requestId: rid, status: 201 })
  } catch (error) {
    return apiFailure(error, rid)
  }
}
