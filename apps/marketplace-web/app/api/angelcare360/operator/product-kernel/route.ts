import { NextRequest } from 'next/server'
import { executeProductKernelOperation, loadProductKernelSnapshot } from '@/lib/angelcare360/operator/product-kernel'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const snapshot = await loadProductKernelSnapshot({
      clientId: url.searchParams.get('clientId') || undefined,
      tenantId: url.searchParams.get('tenantId') || undefined,
      subscriptionId: url.searchParams.get('subscriptionId') || undefined,
    })
    return operatorJson({ ok: true, snapshot })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La commande Product Kernel est incomplète.' }, 422)
    const result = await executeProductKernelOperation(body.operation, body.payload || {})
    return operatorJson(result)
  } catch (error) {
    return operatorRouteError(error)
  }
}
