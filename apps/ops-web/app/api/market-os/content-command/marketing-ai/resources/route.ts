import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { executeMarketingAiCommand } from '@/lib/market-os/marketing-ai/orchestrator'
import { listResourceUpdates } from '@/lib/market-os/marketing-ai/repository'
async function GET__angelcareGovernedImpl() {
  try { await requireMarketingAiUser('view'); return NextResponse.json({ ok: true, updates: await listResourceUpdates() }) }
  catch (error) { return apiErrorResponse(error) }
}
async function POST__angelcareGovernedImpl() {
  try {
    const actor = await requireMarketingAiUser('run')
    const run = await executeMarketingAiCommand({ commandCode: 'MKT-AI-2952', objective: 'Exécuter la mise à jour mensuelle officielle Gemini et ressources marketing, identifier les changements utiles à ANGELCARE et préparer des propositions de doctrine soumises à validation humaine.', authorityMode: 'advise', context: { updateType: 'monthly_gemini_marketing_resources' }, actor, forceGrounding: true })
    return NextResponse.json({ ok: true, run })
  } catch (error) { return apiErrorResponse(error) }
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/market-os/content-command/marketing-ai/resources',
  },
  GET__angelcareGovernedImpl,
)

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/resources',
  },
  POST__angelcareGovernedImpl,
)
