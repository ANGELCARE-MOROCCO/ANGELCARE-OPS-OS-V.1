import { apiError, apiOk, jsonBody } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { rollbackConfigurationImport } from '@/lib/homeservice-design/server/repository'
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireHomeServiceApi('homeservice_design.import_configuration')
    const { id } = await params
    const result = await rollbackConfigurationImport(id, await jsonBody(request), user)
    return apiOk(result.data, 200, result.correlationId)
  } catch (error) { return apiError(error) }
}
