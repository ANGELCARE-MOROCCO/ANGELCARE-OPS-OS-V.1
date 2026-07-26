import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { scheduleInputSchema } from '@/lib/market-os/marketing-ai/schemas'
import { calculateNextRun } from '@/lib/market-os/marketing-ai/scheduler'
import { saveMarketingAiSchedule } from '@/lib/market-os/marketing-ai/repository'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireMarketingAiUser('schedule')
    const { id } = await context.params
    const parsed = scheduleInputSchema.parse({ ...(await request.json()), id })
    const nextRunAt = calculateNextRun({ frequency: parsed.frequency, hour: parsed.hour, minute: parsed.minute, dayOfWeek: parsed.dayOfWeek, dayOfMonth: parsed.dayOfMonth })
    const schedule = await saveMarketingAiSchedule({ ...parsed, commandId: null, nextRunAt, lastRunAt: null }, actor.id)
    return NextResponse.json({ ok: true, schedule })
  } catch (error) { return apiErrorResponse(error) }
}
