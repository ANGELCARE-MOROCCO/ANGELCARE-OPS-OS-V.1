import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { scheduleInputSchema } from '@/lib/market-os/marketing-ai/schemas'
import { calculateNextRun } from '@/lib/market-os/marketing-ai/scheduler'
import { listMarketingAiSchedules, saveMarketingAiSchedule } from '@/lib/market-os/marketing-ai/repository'

export async function GET() {
  try { await requireMarketingAiUser('view'); return NextResponse.json({ ok: true, schedules: await listMarketingAiSchedules() }) }
  catch (error) { return apiErrorResponse(error) }
}
export async function POST(request: Request) {
  try {
    const actor = await requireMarketingAiUser('schedule')
    const parsed = scheduleInputSchema.parse(await request.json())
    const nextRunAt = calculateNextRun({ frequency: parsed.frequency, timezone: parsed.timezone, hour: parsed.hour, minute: parsed.minute, dayOfWeek: parsed.dayOfWeek, dayOfMonth: parsed.dayOfMonth })
    const schedule = await saveMarketingAiSchedule({ ...parsed, commandId: null, nextRunAt, lastRunAt: null }, actor.id)
    return NextResponse.json({ ok: true, schedule })
  } catch (error) { return apiErrorResponse(error) }
}
