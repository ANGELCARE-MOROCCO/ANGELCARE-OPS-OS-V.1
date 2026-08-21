import { governRoute } from '@/lib/runtime/governor/route'
import { randomUUID } from 'node:crypto'
import { apiError, apiOk, jsonBody } from '@/lib/homeservice-design/server/api'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
import { composeFactoryScenarios, validateFactoryInput } from '@/lib/homeservice-factory/server/composer'
import { persistFactoryComposition } from '@/lib/homeservice-factory/server/repository'

export const maxDuration = 180

function isAbortLike(error: unknown) {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error || '')
  return /abort|aborted|signal is aborted|timeout/i.test(text)
}

async function composeWithOneRecovery(input: ReturnType<typeof validateFactoryInput>) {
  try {
    return await composeFactoryScenarios(input)
  } catch (error) {
    if (!isAbortLike(error)) throw error
    await new Promise((resolve) => setTimeout(resolve, 450))
    try {
      return await composeFactoryScenarios(input)
    } catch (secondError) {
      if (!isAbortLike(secondError)) throw secondError
      throw Object.assign(new Error('Le fournisseur de composition a interrompu deux tentatives. Votre brouillon est conservé; relancez « Composer » dans quelques secondes.'), {
        status: 503,
        code: 'FACTORY_PROVIDER_ABORTED',
      })
    }
  }
}

async function POST__angelcareGovernedImpl(request: Request) {
  try {
    const user = await requireHomeServiceApi([
      'homeservice_design.view',
      'homeservice_design.manage_categories',
      'homeservice_design.create_planning_requests',
    ])
    const raw = await jsonBody(request)
    const input = validateFactoryInput(raw)
    const result = await composeWithOneRecovery(input)
    const persistence = await persistFactoryComposition({ ...result, input }, user)
    return apiOk({ ...result, ...persistence }, 201, persistence.correlationId || randomUUID())
  } catch (error) {
    return apiError(error)
  }
}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/carelink-ops/service-design/factory/generate',
  },
  POST__angelcareGovernedImpl,
)
