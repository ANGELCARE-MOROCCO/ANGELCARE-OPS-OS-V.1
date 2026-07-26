import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listLearningEvents } from '@/lib/market-os/marketing-ai/repository'
export async function GET() {
  try { await requireMarketingAiUser('view'); return NextResponse.json({ ok: true, events: await listLearningEvents() }) }
  catch (error) { return apiErrorResponse(error) }
}
