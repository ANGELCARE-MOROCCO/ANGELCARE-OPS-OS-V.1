import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { publicContentResearchDefaults } from '@/lib/market-os/content-research/config'
import { getAuditTimeline, getResearchControlSnapshot } from '@/lib/market-os/content-research/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireMarketingAiUser('view')
    const snapshot = await getResearchControlSnapshot()
    const audit = snapshot.migrationReady ? await getAuditTimeline() : []
    return NextResponse.json({
      ok: true,
      snapshot: { ...snapshot, audit },
      runtimeDefaults: publicContentResearchDefaults(),
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
