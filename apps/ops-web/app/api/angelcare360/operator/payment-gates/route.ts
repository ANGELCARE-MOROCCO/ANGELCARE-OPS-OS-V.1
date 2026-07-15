import { NextRequest } from 'next/server'
import {
  cancelOperatorPaymentGate,
  createOperatorPaymentGate,
  expireOperatorPaymentGate,
  getAngelcare360OperatorPaymentGateOverview,
  getOperatorPaymentGateById,
  listOperatorPaymentGates,
  markOperatorPaymentGateManualPending,
  markOperatorPaymentGateManualProcessed,
  updateOperatorPaymentGateStatus,
  waiveOperatorPaymentGate,
} from '@/lib/angelcare360/operator/payment-gates'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'list'
    if (mode === 'detail') {
      const id = request.nextUrl.searchParams.get('id')
      if (!id) return operatorJson({ ok: false, error: 'Le gate de paiement est requis.' }, 422)
      return operatorJson({ ok: true, paymentGate: await getOperatorPaymentGateById(id) })
    }
    if (mode === 'overview') {
      return operatorJson({ ok: true, overview: await getAngelcare360OperatorPaymentGateOverview(), paymentGates: await listOperatorPaymentGates() })
    }
    return operatorJson({ ok: true, paymentGates: await listOperatorPaymentGates() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête de gate de paiement est incomplète.' }, 422)
    if (body.operation === 'create') return operatorJson(await createOperatorPaymentGate(body.payload || {}))
    if (body.operation === 'status') return operatorJson(await updateOperatorPaymentGateStatus(body.payload || {}))
    if (body.operation === 'manual_pending') return operatorJson(await markOperatorPaymentGateManualPending(body.payload || {}))
    if (body.operation === 'manual_processed') return operatorJson(await markOperatorPaymentGateManualProcessed(body.payload || {}))
    if (body.operation === 'waive') return operatorJson(await waiveOperatorPaymentGate(body.payload || {}))
    if (body.operation === 'cancel') return operatorJson(await cancelOperatorPaymentGate(body.payload || {}))
    if (body.operation === 'expire') return operatorJson(await expireOperatorPaymentGate(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération de gate de paiement inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
