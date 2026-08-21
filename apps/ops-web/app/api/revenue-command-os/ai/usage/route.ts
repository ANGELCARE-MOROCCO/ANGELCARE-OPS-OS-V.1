import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { aiRights, apiError, tenantOf } from '@/lib/revenue-command-os/ai/api-access'
import { getAiUsage } from '@/lib/revenue-command-os/ai/repository'
import { loadAiProviderSnapshot } from '@/lib/ai-provider-control/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function GET__angelcareGovernedImpl() {
  const user = await getCurrentUser()
  try {
    const [rows, snapshot] = await Promise.all([getAiUsage(tenantOf(user)), loadAiProviderSnapshot()])
    const totals = rows.reduce((acc: { requests: number; inputTokens: number; outputTokens: number }, row: any) => ({
      requests: acc.requests + Number(row.request_count || 0),
      inputTokens: acc.inputTokens + Number(row.input_tokens || 0),
      outputTokens: acc.outputTokens + Number(row.output_tokens || 0),
    }), { requests: 0, inputTokens: 0, outputTokens: 0 })
    const quota = snapshot.quotas.find((item) => item.scope_type === 'module' && item.scope_key === 'revenue_os') || null
    return NextResponse.json({ ok: true, data: { ...totals, quota, sourceOfTruth: 'ai-provider-control' }, externalActions: true })
  } catch (error) {
    return apiError('AI_USAGE_UNAVAILABLE', error instanceof Error ? error.message : 'Consommation IA indisponible.', 503)
  }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/revenue-command-os/ai/usage',
  },
  GET__angelcareGovernedImpl,
)
