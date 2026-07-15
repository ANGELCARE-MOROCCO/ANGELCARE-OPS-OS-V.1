import { NextRequest } from 'next/server'
import { cancelOperatorSubscription, changeOperatorSubscriptionStatus, createOperatorSubscription, listOperatorSubscriptions, updateOperatorSubscription } from '@/lib/angelcare360/operator/subscriptions'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return operatorJson({ ok: true, subscriptions: await listOperatorSubscriptions() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête abonnements est incomplète.' }, 422)
    if (body.operation === 'create') return operatorJson(await createOperatorSubscription(body.payload || {}))
    if (body.operation === 'update') return operatorJson(await updateOperatorSubscription(body.payload || {}))
    if (body.operation === 'status') return operatorJson(await changeOperatorSubscriptionStatus(body.payload || {}))
    if (body.operation === 'cancel') return operatorJson(await cancelOperatorSubscription(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération abonnement inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
