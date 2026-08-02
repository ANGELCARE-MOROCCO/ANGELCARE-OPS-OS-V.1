import { randomUUID } from 'node:crypto'
import { apiError, apiOk, jsonBody } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { composeFactoryScenarios, validateFactoryInput } from '@/lib/homeservice-factory/server/composer'
import { persistFactoryComposition } from '@/lib/homeservice-factory/server/repository'

export const maxDuration = 180
export async function POST(request: Request) {
  try {
    const user = await requireHomeServiceApi(['homeservice_design.view', 'homeservice_design.manage_categories', 'homeservice_design.create_planning_requests'])
    const raw = await jsonBody(request)
    const input = validateFactoryInput(raw)
    const result = await composeFactoryScenarios(input)
    const persistence = await persistFactoryComposition({ ...result, input }, user)
    return apiOk({ ...result, ...persistence }, 201, persistence.correlationId || randomUUID())
  } catch (error) { return apiError(error) }
}
