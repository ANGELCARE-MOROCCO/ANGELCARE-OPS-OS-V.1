import { apiError, apiOk, jsonBody } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { applyDirectImport } from '@/lib/homeservice-factory/server/importer'

export const maxDuration = 120
export async function POST(request: Request) {
  try {
    const user = await requireHomeServiceApi(['homeservice_design.import_configuration', 'homeservice_design.admin'])
    return apiOk(await applyDirectImport(await jsonBody(request), user), 201)
  } catch (error) { return apiError(error) }
}
