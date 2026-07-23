import type { NextRequest } from 'next/server'
import { resolveRevenueOsActor, requireRevenueOsPermission } from '@/lib/revenue-command-os/access'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '@/lib/revenue-command-os/http'
import {
  createRevenueSignalContext,
  ingestRevenueSignal,
  persistRevenueSignalValidation,
  readRevenueSignalFabric,
  runAllRevenueSignalScans,
  runRevenueSignalSourceScan,
  updateRevenueSignalSourceStatus,
  updateRevenueSignalStatus,
  updateRevenueSignalValidationStatus,
} from '@/lib/revenue-command-os/signal-fabric/repository'
import type {
  RevenueSignalContextSnapshot,
  RevenueSignalIngestionInput,
  RevenueSignalSource,
  RevenueSignalValidationIssue,
} from '@/lib/revenue-command-os/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type SignalActor = { id: string; label: string; role?: string }

function repositoryActor(actor: Awaited<ReturnType<typeof resolveRevenueOsActor>>): SignalActor {
  return { id: actor.id, label: actor.displayName, role: actor.role }
}

export async function GET() {
  try {
    await resolveRevenueOsActor('revenue_os.view', {
      aliases: ['revenue.view', 'revenue_os.signals.manage'],
      message: 'Accès Signal Fabric refusé.',
    })
    const { bootstrap, warnings } = await readRevenueSignalFabric()
    return revenueOsSuccess(bootstrap, { meta: { warnings }, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action ?? '')
    const actor = await resolveRevenueOsActor(undefined, { payload: body })
    const auditActor = repositoryActor(actor)

    if (action === 'ingest_event') {
      requireRevenueOsPermission(actor, 'revenue_os.signals.ingest', 'Permission d’ingestion requise.', [
        'revenue_os.signals.manage',
      ])
      const payload = body?.payload ?? {}
      const input: RevenueSignalIngestionInput = {
        sourceCode: String(payload.sourceCode ?? ''),
        sourceRecordId: payload.sourceRecordId ? String(payload.sourceRecordId) : undefined,
        eventType: String(payload.eventType ?? ''),
        occurredAt: payload.occurredAt ? String(payload.occurredAt) : undefined,
        payload: payload.data && typeof payload.data === 'object' ? payload.data : {},
        correlationId: payload.correlationId ? String(payload.correlationId) : undefined,
      }
      return revenueOsSuccess(await ingestRevenueSignal(input, auditActor), { status: 201 })
    }

    requireRevenueOsPermission(actor, 'revenue_os.signals.manage', 'Permission de gestion Signal Fabric requise.')

    if (action === 'run_source_scan') {
      const sourceCode = String(body?.payload?.sourceCode ?? '')
      if (!sourceCode) throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT', 'Source requise.', { status: 422 })
      return revenueOsSuccess(await runRevenueSignalSourceScan(sourceCode, auditActor))
    }
    if (action === 'run_all_scans') return revenueOsSuccess(await runAllRevenueSignalScans(auditActor))
    if (action === 'update_signal_status') {
      const id = String(body?.payload?.id ?? '')
      const status = String(body?.payload?.status ?? '') as any
      if (!id) throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT', 'Signal requis.', { status: 422 })
      return revenueOsSuccess(await updateRevenueSignalStatus(id, status, auditActor))
    }
    if (action === 'build_context') {
      const id = String(body?.payload?.signalId ?? '')
      const audienceRole = String(body?.payload?.audienceRole ?? 'Direction Revenue')
      const visibilityProfile = String(body?.payload?.visibilityProfile ?? 'revenue-manager') as RevenueSignalContextSnapshot['visibilityProfile']
      if (!id) throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT', 'Signal requis.', { status: 422 })
      return revenueOsSuccess(await createRevenueSignalContext(id, audienceRole, visibilityProfile, auditActor), { status: 201 })
    }
    if (action === 'run_validation') return revenueOsSuccess(await persistRevenueSignalValidation(auditActor))
    if (action === 'update_validation_status') {
      const id = String(body?.payload?.id ?? '')
      const status = String(body?.payload?.status ?? '') as RevenueSignalValidationIssue['status']
      if (!id) throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT', 'Point de validation requis.', { status: 422 })
      return revenueOsSuccess(await updateRevenueSignalValidationStatus(id, status, auditActor))
    }
    if (action === 'update_source_status') {
      const id = String(body?.payload?.id ?? '')
      const status = String(body?.payload?.status ?? '') as RevenueSignalSource['status']
      if (!id) throw new RevenueOsError('REVENUE_SIGNAL_INVALID_INPUT', 'Source requise.', { status: 422 })
      return revenueOsSuccess(await updateRevenueSignalSourceStatus(id, status, auditActor))
    }

    throw new RevenueOsError('REVENUE_SIGNAL_ACTION_NOT_ALLOWED', 'Action Signal Fabric non supportée.', {
      status: 405,
      recoverable: false,
      context: { action },
    })
  } catch (error) {
    return revenueOsErrorResponse(error)
  }
}
