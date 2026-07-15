import { NextRequest } from 'next/server'
import { completeOperatorOnboardingTask, createOperatorOnboardingTask, listOperatorOnboardingTasks, updateOperatorOnboardingTask } from '@/lib/angelcare360/operator/onboarding'
import { sendOperatorOnboardingEmail } from '@/lib/angelcare360/operator/email'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return operatorJson({ ok: true, tasks: await listOperatorOnboardingTasks() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; entity?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête onboarding est incomplète.' }, 422)
    if (body.operation === 'create') return operatorJson(await createOperatorOnboardingTask(body.payload || {}))
    if (body.operation === 'update') return operatorJson(await updateOperatorOnboardingTask(body.payload || {}))
    if (body.operation === 'complete') return operatorJson(await completeOperatorOnboardingTask(body.payload || {}))
    if (body.entity === 'email' && body.operation === 'onboarding') return operatorJson(await sendOperatorOnboardingEmail(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération onboarding inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
