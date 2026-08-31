import { operatorJson } from '../_shared'
import { operatorRouteError } from '../_shared'
import { getOperatorSettings } from '@/lib/angelcare360/operator/settings'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return operatorJson({ ok: true, settings: await getOperatorSettings() })
  } catch (error) {
    return operatorRouteError(error)
  }
}
