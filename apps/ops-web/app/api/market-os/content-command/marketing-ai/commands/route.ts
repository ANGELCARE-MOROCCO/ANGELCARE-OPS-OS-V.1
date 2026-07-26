import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { listMarketingAiCommands, listMarketingAiSkills } from '@/lib/market-os/marketing-ai/repository'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    await requireMarketingAiUser('view')
    const params = new URL(request.url).searchParams
    const [result, skillResult] = await Promise.all([
      listMarketingAiCommands({
        search: params.get('search') || undefined,
        category: params.get('category') || undefined,
        status: params.get('status') || undefined,
        page: Number(params.get('page') || 1),
        pageSize: Number(params.get('pageSize') || 50),
      }),
      listMarketingAiSkills(),
    ])
    const categories = [...new Set(skillResult.skills.map((skill) => skill.category))].sort((left, right) => left.localeCompare(right, 'fr'))
    return NextResponse.json({ ok: true, ...result, categories })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
