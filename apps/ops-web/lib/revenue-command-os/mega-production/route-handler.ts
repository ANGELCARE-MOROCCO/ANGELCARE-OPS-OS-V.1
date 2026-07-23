import type { NextRequest } from 'next/server'
import { RevenueOsError } from '../errors'
import { invalidRevenueOsAction, revenueOsErrorResponse, revenueOsSuccess } from '../http'
import { megaActor, requirePermission } from './api-access'
import {
  changeExperiment,
  createExperiment,
  executeEmergencyStop,
  megaProductionDashboard,
  manageRegistry,
  queueAction,
  requestActivation,
  restoreEmergencyStop,
  runEvaluation,
} from './service'

export async function dashboardRoute() {
  try {
    const actor = await megaActor('revenue_os.mega_production.view')
    return revenueOsSuccess(await megaProductionDashboard(actor.tenantId))
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}

export async function actionRoute(request: NextRequest, action: string) {
  try {
    const body = await request.json().catch(() => ({}))
    const actor = await megaActor(undefined, body)
    let data: unknown

    switch (action) {
      case 'create-experiment':
        requirePermission(actor, 'revenue_os.experiments.manage')
        data = await createExperiment(actor, body)
        break
      case 'activate-experiment':
        requirePermission(actor, 'revenue_os.experiments.manage')
        data = await changeExperiment(actor, body, 'activate')
        break
      case 'stop-experiment':
        requirePermission(actor, 'revenue_os.experiments.manage')
        data = await changeExperiment(actor, body, 'stop')
        break
      case 'emergency-stop':
        requirePermission(actor, 'revenue_os.mega_production.emergency_stop')
        data = await executeEmergencyStop(actor, body)
        break
      case 'restore':
        requirePermission(actor, 'revenue_os.mega_production.emergency_stop')
        data = await restoreEmergencyStop(actor, body)
        break
      case 'activate-production':
        requirePermission(actor, 'revenue_os.mega_production.activate')
        data = await requestActivation(actor, body)
        break
      case 'manage-registry':
        requirePermission(actor, 'revenue_os.registries.manage')
        data = await manageRegistry(actor, body)
        break
      case 'run-evaluation':
        requirePermission(actor, 'revenue_os.mega_production.manage')
        data = await runEvaluation(actor, body)
        break
      case 'retry-job':
      case 'cancel-job':
      case 'replay-job':
        requirePermission(actor, 'revenue_os.queues.manage')
        data = await queueAction(actor, body, action.split('-')[0] as 'retry' | 'cancel' | 'replay')
        break
      default:
        invalidRevenueOsAction(action)
    }

    return revenueOsSuccess(data)
  } catch (error) {
    if (error instanceof RevenueOsError) return revenueOsErrorResponse(error)
    return revenueOsErrorResponse(error)
  }
}
