import { NextRequest } from 'next/server'
import { completeOperatorServiceRequest, completeOperatorTask, createOperatorIncident, createOperatorNote, createOperatorServiceRequest, createOperatorTask, listOperatorIncidents, listOperatorNotes, listOperatorServiceEvents, listOperatorServiceRequests, listOperatorTasks, resolveOperatorIncident, updateOperatorServiceRequest, updateOperatorTask } from '@/lib/angelcare360/operator/service'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get('mode') || 'events'
    if (mode === 'requests') return operatorJson({ ok: true, requests: await listOperatorServiceRequests() })
    if (mode === 'incidents') return operatorJson({ ok: true, incidents: await listOperatorIncidents() })
    if (mode === 'tasks') return operatorJson({ ok: true, tasks: await listOperatorTasks() })
    if (mode === 'notes') return operatorJson({ ok: true, notes: await listOperatorNotes() })
    return operatorJson({ ok: true, events: await listOperatorServiceEvents() })
  } catch (error) {
    return operatorRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readOperatorBody<{ entity?: string; operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.entity || !body.operation) return operatorJson({ ok: false, error: 'La requête service est incomplète.' }, 422)
    if (body.entity === 'request') {
      if (body.operation === 'create') return operatorJson(await createOperatorServiceRequest(body.payload || {}))
      if (body.operation === 'update') return operatorJson(await updateOperatorServiceRequest(body.payload || {}))
      if (body.operation === 'complete') return operatorJson(await completeOperatorServiceRequest(body.payload || {}))
    }
    if (body.entity === 'incident') {
      if (body.operation === 'create') return operatorJson(await createOperatorIncident(body.payload || {}))
      if (body.operation === 'resolve') return operatorJson(await resolveOperatorIncident(body.payload || {}))
    }
    if (body.entity === 'task') {
      if (body.operation === 'create') return operatorJson(await createOperatorTask(body.payload || {}))
      if (body.operation === 'update') return operatorJson(await updateOperatorTask(body.payload || {}))
      if (body.operation === 'complete') return operatorJson(await completeOperatorTask(body.payload || {}))
    }
    if (body.entity === 'note' && body.operation === 'create') {
      return operatorJson(await createOperatorNote(body.payload || {}))
    }
    return operatorJson({ ok: false, error: 'Opération service inconnue.' }, 400)
  } catch (error) {
    return operatorRouteError(error)
  }
}
