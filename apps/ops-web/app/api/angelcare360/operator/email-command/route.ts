import { NextRequest } from 'next/server'
import { executeEmailCommandOperation, loadEmailCommandSnapshot } from '@/lib/angelcare360/operator/email-command'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    return operatorJson({ ok: true, snapshot: await loadEmailCommandSnapshot({ clientId: request.nextUrl.searchParams.get('clientId'), limit: Number(request.nextUrl.searchParams.get('limit') || 400) }) })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'Commande Email OS manquante.' }, 422)
    const result = await executeEmailCommandOperation(body.operation, body.payload || {}) as { ok?: boolean }
    return operatorJson(result, result?.ok === false ? 422 : 200)
  } catch (error) {
    return operatorRouteError(error)
  }
}
