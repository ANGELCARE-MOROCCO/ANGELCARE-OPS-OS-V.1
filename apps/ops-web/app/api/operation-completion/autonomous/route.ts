import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import {
  OPERATION_AREAS,
  buildAutonomousPlan,
  executeAutonomousOperation,
  runOperationEnterpriseScan,
  summarizeModules,
  type OperationArea,
  type OperationExecutionMode,
} from '@/lib/operation-completion/autonomous-core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Action = 'plan' | 'execute' | 'history'

function sanitizeAreas(values: unknown): OperationArea[] {
  const allowed = new Set<string>(OPERATION_AREAS)
  if (!Array.isArray(values)) return []
  return values.map(String).filter((item) => allowed.has(item)) as OperationArea[]
}

function sanitizeModules(values: unknown) {
  if (!Array.isArray(values)) return []
  const allowed = new Set(summarizeModules().map((item) => item.key))
  return values.map(String).filter((item) => allowed.has(item))
}

function sanitizeMode(value: unknown): OperationExecutionMode {
  const mode = String(value || 'controlled')
  if (mode === 'observe' || mode === 'controlled' || mode === 'strict' || mode === 'autonomous') return mode
  return 'controlled'
}

async function persistEvent(payload: Record<string, unknown>) {
  try {
    const supabase = await createClient()
    await supabase.from('operation_completion_audit_events').insert({
      event_type: String(payload.event_type || 'operation_completion_event'),
      actor_role: String(payload.actor_role || 'system'),
      job_id: payload.job_id ? String(payload.job_id) : null,
      scan_id: payload.scan_id ? String(payload.scan_id) : null,
      payload,
    })
  } catch {
    // The feature stays operational before the SQL migration is installed.
  }
}

async function persistScan(scan: Awaited<ReturnType<typeof runOperationEnterpriseScan>>) {
  try {
    const supabase = await createClient()
    await supabase.from('operation_completion_scans').insert({
      id: scan.scanId,
      selected_modules: scan.selectedModules,
      selected_areas: scan.selectedAreas,
      scanned_files: scan.scannedFiles,
      total_actions: scan.coverage.totalActions,
      completion_score: scan.completionScore,
      risk_summary: scan.riskSummary,
      coverage: scan.coverage,
      generated_at: scan.generatedAt,
    })
    const rows = scan.items.slice(0, 500).map((item) => ({
      scan_id: scan.scanId,
      item_id: item.id,
      module_key: item.module,
      area: item.area,
      file_path: item.file,
      label: item.label,
      action_type: item.actionType,
      risk: item.risk,
      confidence: item.confidence,
      protected_action: Boolean(item.protectedAction),
      evidence: item.evidence,
      recommendations: item.recommendations,
    }))
    if (rows.length) await supabase.from('operation_completion_scan_items').insert(rows)
  } catch {
    // DB migration can be applied after the code patch; do not break scanner.
  }
}

async function persistJob(result: Awaited<ReturnType<typeof executeAutonomousOperation>>) {
  try {
    const supabase = await createClient()
    await supabase.from('operation_completion_jobs').insert({
      id: result.jobId,
      mode: result.mode,
      dry_run: result.dryRun,
      source_write_applied: result.sourceWriteApplied,
      progress: result.progress,
      status: result.summary.failed ? 'failed' : 'completed',
      summary: result.summary,
      artifacts: result.artifacts,
      rollback_manifest: result.rollbackManifest || null,
      started_at: result.startedAt,
      finished_at: result.finishedAt,
    })
    if (result.steps.length) {
      await supabase.from('operation_completion_job_steps').insert(result.steps.slice(0, 500).map((step) => ({
        job_id: result.jobId,
        step_id: step.id,
        title: step.title,
        module_key: step.module,
        area: step.area,
        risk: step.risk,
        execution: step.execution,
        status: step.status,
        description: step.description,
        target_files: step.targetFiles,
        rollback_hint: step.rollbackHint,
      })))
    }
  } catch {
    // The JSON artifact remains available locally even if DB tables are not installed yet.
  }
}

export async function GET() {
  await requireRole(['ceo', 'manager', 'admin'])

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('operation_completion_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25)
    return NextResponse.json({ ok: true, jobs: data || [], registry: { modules: summarizeModules(), areas: OPERATION_AREAS } })
  } catch {
    return NextResponse.json({ ok: true, jobs: [], registry: { modules: summarizeModules(), areas: OPERATION_AREAS }, note: 'History table not installed yet.' })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRole(['ceo', 'manager', 'admin'])
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || 'plan') as Action
  const selectedModules = sanitizeModules(body.selectedModules)
  const selectedAreas = sanitizeAreas(body.selectedAreas)
  const mode = sanitizeMode(body.mode)
  const dryRun = body.dryRun !== false
  const sourceWrite = body.sourceWrite === true
  const maxFiles = Number(body.maxFiles || 1600)

  if (action === 'history') {
    return GET()
  }

  const scan = await runOperationEnterpriseScan({ selectedModules, selectedAreas, maxFiles })
  await persistScan(scan)

  if (action === 'plan') {
    const plan = buildAutonomousPlan(scan, { selectedModules, selectedAreas, mode, dryRun, sourceWrite })
    await persistEvent({
      event_type: 'operation_completion_plan_created',
      actor_role: String((user as any)?.role || 'admin'),
      job_id: plan.jobId,
      scan_id: scan.scanId,
      selectedModules,
      selectedAreas,
      mode,
      dryRun,
      sourceWrite,
      summary: plan.summary,
    })
    return NextResponse.json({ ok: true, scan, plan, registry: { modules: summarizeModules(), areas: OPERATION_AREAS } })
  }

  if (action === 'execute') {
    const result = await executeAutonomousOperation(scan, { selectedModules, selectedAreas, mode, dryRun, sourceWrite })
    await persistJob(result)
    await persistEvent({
      event_type: 'operation_completion_job_executed',
      actor_role: String((user as any)?.role || 'admin'),
      job_id: result.jobId,
      scan_id: scan.scanId,
      selectedModules,
      selectedAreas,
      mode,
      dryRun,
      sourceWrite,
      summary: result.summary,
      artifacts: result.artifacts,
    })
    return NextResponse.json({ ok: true, scan, result, registry: { modules: summarizeModules(), areas: OPERATION_AREAS } })
  }

  return NextResponse.json({ ok: false, error: `Unsupported action: ${action}` }, { status: 400 })
}
