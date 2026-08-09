import { createDeadLetter, claimDueJobs, getCompilation, updateCompilationItem, updateCompilationStatus, updateJob } from './phase3-repository'
import { executeMarketingInternalTool } from './tool-gateway'
import type { Phase3ExecutionJob } from './phase3-types'

function retryDelay(attempt: number) { return Math.min(60 * 60 * 1000, Math.max(60_000, 2 ** Math.max(0, attempt - 1) * 60_000)) }

export async function processMarketingExecutionQueue(input: { workerId: string; limit: number; actor: { id: string; name: string } }) {
  const jobs = await claimDueJobs(input.limit, input.workerId)
  const results: Array<{ jobId: string; ok: boolean; status: string; error?: string }> = []
  for (const job of jobs) {
    try {
      if (!job.compilationItemId || !job.compilationId || !job.toolName) throw new Error('JOB_CONTEXT_INCOMPLETE')
      const current = await getCompilation(job.compilationId)
      const currentItem = current?.items.find((entry: import('./phase3-types').Phase3CompilationItem) => entry.id === job.compilationItemId)
      if (!current || !currentItem) throw new Error('COMPILATION_ITEM_NOT_FOUND')
      const dependencySequences = currentItem.dependencies.map((value: string) => /^sequence:(\d+)$/.exec(value)?.[1]).filter(Boolean).map(Number)
      const dependenciesReady = dependencySequences.every((sequence: number) => current.items.some((entry: import('./phase3-types').Phase3CompilationItem) => entry.sequence === sequence && ['materialized','linked','skipped'].includes(entry.status)))
      if (!dependenciesReady) {
        await updateJob(job.id, { status: 'retry_scheduled', claimed_at: null, heartbeat_at: null, next_retry_at: new Date(Date.now() + 60_000).toISOString(), error: 'DEPENDENCY_NOT_READY' })
        results.push({ jobId: job.id, ok: true, status: 'retry_scheduled' })
        continue
      }
      await updateJob(job.id, { status: 'running', heartbeat_at: new Date().toISOString(), attempt_count: job.attemptCount + 1 })
      if (job.status === 'awaiting_approval' || currentItem.requiresApproval && currentItem.status !== 'approved') {
        await updateJob(job.id, { status: 'awaiting_approval', claimed_at: null, heartbeat_at: null })
        results.push({ jobId: job.id, ok: true, status: 'awaiting_approval' })
        continue
      }
      await updateCompilationItem(currentItem.id, { status: 'executing' })
      const output = await executeMarketingInternalTool({
        toolName: job.toolName,
        payload: { ...currentItem.payload, targetWorkspace: currentItem.targetWorkspace },
        title: currentItem.title,
        description: currentItem.description,
        actor: input.actor,
        jobId: job.id,
        compilationItemId: currentItem.id,
        idempotencyKey: job.idempotencyKey,
      })
      await updateCompilationItem(currentItem.id, { status: 'materialized', canonical_record_id: output.canonicalId, canonical_table: output.canonicalTable, mirror_state: output.mirrorState, error: null })
      await updateJob(job.id, { status: 'completed', output, completed_at: new Date().toISOString(), heartbeat_at: null })
      const refreshed = await getCompilation(job.compilationId)
      if (refreshed && refreshed.items.every((entry: import('./phase3-types').Phase3CompilationItem) => ['materialized','linked','skipped'].includes(entry.status))) await updateCompilationStatus(job.compilationId, 'completed')
      else if (refreshed && refreshed.items.some((entry: import('./phase3-types').Phase3CompilationItem) => entry.status === 'materialized')) await updateCompilationStatus(job.compilationId, 'partially_executed')
      results.push({ jobId: job.id, ok: true, status: 'completed' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JOB_EXECUTION_FAILED'
      const attempt = job.attemptCount + 1
      if (attempt >= job.maxAttempts) {
        await updateJob(job.id, { status: 'dead_letter', error: message, completed_at: new Date().toISOString(), heartbeat_at: null })
        if (job.compilationItemId) await updateCompilationItem(job.compilationItemId, { status: 'failed', error: message })
        await createDeadLetter({ jobId: job.id, reason: message, payload: job.input })
        results.push({ jobId: job.id, ok: false, status: 'dead_letter', error: message })
      } else {
        const nextRetryAt = new Date(Date.now() + retryDelay(attempt)).toISOString()
        await updateJob(job.id, { status: 'retry_scheduled', error: message, next_retry_at: nextRetryAt, claimed_at: null, heartbeat_at: null })
        results.push({ jobId: job.id, ok: false, status: 'retry_scheduled', error: message })
      }
    }
  }
  return results
}

export async function controlMarketingJob(job: Phase3ExecutionJob, action: 'pause'|'resume'|'cancel'|'retry'|'dead_letter'|'replay', reason?: string) {
  if (action === 'pause') return updateJob(job.id, { status: 'blocked', error: reason || 'Paused by operator', claimed_at: null, heartbeat_at: null })
  if (action === 'resume') return updateJob(job.id, { status: 'queued', error: null, next_retry_at: null, scheduled_at: new Date().toISOString(), claimed_at: null })
  if (action === 'cancel') return updateJob(job.id, { status: 'cancelled', error: reason || 'Cancelled by operator', completed_at: new Date().toISOString() })
  if (action === 'dead_letter') { await createDeadLetter({ jobId: job.id, reason: reason || 'Moved manually to dead letter', payload: job.input }); return updateJob(job.id, { status: 'dead_letter', error: reason || 'Moved manually to dead letter', completed_at: new Date().toISOString() }) }
  return updateJob(job.id, { status: 'queued', error: null, next_retry_at: null, scheduled_at: new Date().toISOString(), claimed_at: null, attempt_count: action === 'replay' ? 0 : job.attemptCount })
}
