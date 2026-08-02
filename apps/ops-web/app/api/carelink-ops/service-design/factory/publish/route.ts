import { randomUUID } from 'node:crypto'
import { apiError, apiOk, jsonBody } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { publishFactoryScenarios } from '@/lib/homeservice-factory/server/repository'

export async function POST(request: Request) {
  try {
    const user = await requireHomeServiceApi(['homeservice_design.publish', 'homeservice_design.admin'])
    const result = await publishFactoryScenarios(await jsonBody(request), user)
    return apiOk(result, 201, result.correlationId || randomUUID())
  } catch (error) { return apiError(error) }
}
