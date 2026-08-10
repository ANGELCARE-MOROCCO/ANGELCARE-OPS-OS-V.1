import { NextRequest } from 'next/server'
import { assignOperatorSupportTicket, changeOperatorSupportTicketStatus, createOperatorSupportTicket, getOperatorSupportTicketById, listOperatorSupportTickets, resolveOperatorSupportTicket } from '@/lib/angelcare360/operator/support'
import { sendOperatorSupportFollowUpEmail } from '@/lib/angelcare360/operator/email'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'list'
    if (mode === 'detail') {
      const id = request.nextUrl.searchParams.get('id')
      if (!id) return operatorJson({ ok: false, error: 'Le ticket est requis.' }, 422)
      return operatorJson({ ok: true, ticket: await getOperatorSupportTicketById(id) })
    }
    return operatorJson({ ok: true, tickets: await listOperatorSupportTickets() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ operation?: string; entity?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'La requête support est incomplète.' }, 422)
    if (body.operation === 'create') return operatorJson(await createOperatorSupportTicket(body.payload || {}))
    if (body.operation === 'assign') return operatorJson(await assignOperatorSupportTicket(body.payload || {}))
    if (body.operation === 'status') return operatorJson(await changeOperatorSupportTicketStatus(body.payload || {}))
    if (body.operation === 'resolve') return operatorJson(await resolveOperatorSupportTicket(body.payload || {}))
    if (body.entity === 'email' && body.operation === 'follow_up') return operatorJson(await sendOperatorSupportFollowUpEmail(body.payload || {}))
    return operatorJson({ ok: false, error: 'Opération support inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
