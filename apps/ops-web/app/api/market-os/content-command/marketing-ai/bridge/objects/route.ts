import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listMarketingAiBridgeObjects } from '@/lib/market-os/marketing-ai/repository'

export async function GET(request: Request) {
  try {
    await requireMarketingAiUser('view')
    const limit = Math.min(200, Math.max(1, Number(new URL(request.url).searchParams.get('limit') || 100)))
    return NextResponse.json({ ok: true, objects: await listMarketingAiBridgeObjects(limit) })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
