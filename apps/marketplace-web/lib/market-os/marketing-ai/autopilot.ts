import { getMarketingAiConfig } from './config'
import { executeMarketingAiCommand } from './orchestrator'
import { calculateNextRun } from './scheduler'
import { listDueMarketingAiSchedules, markScheduleRun } from './repository'
import { processMarketingExecutionQueue } from './queue-engine'
import { recoverStaleExecutionJobs } from './phase3-repository'

export async function runMarketingAutopilotCycle(input: { workerId: string; actor: { id: string; name: string }; processSchedules?: boolean; processJobs?: boolean }) {
  const config = getMarketingAiConfig()
  const scheduleResults: Array<{ scheduleId: string; ok: boolean; runId?: string; error?: string }> = []
  if (input.processSchedules !== false) {
    const schedules = await listDueMarketingAiSchedules(config.maxDueRunsPerBatch)
    for (const schedule of schedules) {
      try {
        const run = await executeMarketingAiCommand({ commandCode: schedule.commandCode, objective: schedule.objective, authorityMode: schedule.authorityMode, scheduleId: schedule.id, context: schedule.context, actor: input.actor, forceGrounding: schedule.frequency === 'monthly' })
        const next = calculateNextRun({ frequency: schedule.frequency, timezone: schedule.timezone, hour: schedule.hour, minute: schedule.minute, dayOfWeek: schedule.dayOfWeek, dayOfMonth: schedule.dayOfMonth })
        await markScheduleRun(schedule.id, next)
        scheduleResults.push({ scheduleId: schedule.id, ok: true, runId: run.id })
      } catch (error) { scheduleResults.push({ scheduleId: schedule.id, ok: false, error: error instanceof Error ? error.message : 'RUN_FAILED' }) }
    }
  }
  const staleRecovered = input.processJobs === false ? [] : await recoverStaleExecutionJobs(15)
  const jobResults = input.processJobs === false ? [] : await processMarketingExecutionQueue({ workerId: input.workerId, limit: config.maxDueRunsPerBatch, actor: input.actor })
  return { ok: true, processedSchedules: scheduleResults.length, processedJobs: jobResults.length, staleRecovered: staleRecovered.length, scheduleResults, jobResults, completedAt: new Date().toISOString() }
}
