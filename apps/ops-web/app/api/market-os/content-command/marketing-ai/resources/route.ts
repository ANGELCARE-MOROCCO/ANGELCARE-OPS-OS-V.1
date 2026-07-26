import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { executeMarketingAiCommand } from '@/lib/market-os/marketing-ai/orchestrator'
import { listResourceUpdates } from '@/lib/market-os/marketing-ai/repository'
export async function GET() {
  try { await requireMarketingAiUser('view'); return NextResponse.json({ ok: true, updates: await listResourceUpdates() }) }
  catch (error) { return apiErrorResponse(error) }
}
export async function POST() {
  try {
    const actor = await requireMarketingAiUser('run')
    const run = await executeMarketingAiCommand({ commandCode: 'MKT-AI-2952', objective: 'Exécuter la mise à jour mensuelle officielle Gemini et ressources marketing, identifier les changements utiles à ANGELCARE et préparer des propositions de doctrine soumises à validation humaine.', authorityMode: 'advise', context: { updateType: 'monthly_gemini_marketing_resources' }, actor, forceGrounding: true })
    return NextResponse.json({ ok: true, run })
  } catch (error) { return apiErrorResponse(error) }
}
