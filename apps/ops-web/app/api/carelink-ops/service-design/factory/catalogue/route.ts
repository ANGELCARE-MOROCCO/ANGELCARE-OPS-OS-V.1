import { apiError, apiOk } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { loadFactoryCatalogue } from '@/lib/homeservice-factory/server/catalogue'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    await requireHomeServiceApi('homeservice_design.view')
    return apiOk(await loadFactoryCatalogue())
  } catch (error) { return apiError(error) }
}
