import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listMarketingAiSkills } from '@/lib/market-os/marketing-ai/repository'

export const dynamic = 'force-dynamic'
export async function GET() {
  try { await requireMarketingAiUser('view'); const result = await listMarketingAiSkills(); return NextResponse.json({ ok: true, ...result }) }
  catch (error) { return apiErrorResponse(error) }
}
