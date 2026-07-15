import { NextRequest } from 'next/server'
import { listOperatorAuditLogs } from '@/lib/angelcare360/operator/audit'
import { operatorJson, operatorRouteError } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    return operatorJson({
      ok: true,
      audit: await listOperatorAuditLogs({
        module: request.nextUrl.searchParams.get('module'),
        action: request.nextUrl.searchParams.get('action'),
        severity: request.nextUrl.searchParams.get('severity'),
        clientId: request.nextUrl.searchParams.get('clientId'),
        tenantId: request.nextUrl.searchParams.get('tenantId'),
        from: request.nextUrl.searchParams.get('from'),
        to: request.nextUrl.searchParams.get('to'),
      }),
    })
  } catch (error) {
    return operatorRouteError(error)
  }
}
