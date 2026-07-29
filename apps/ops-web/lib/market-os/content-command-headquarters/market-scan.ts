import { createServiceClient } from '@/lib/supabase/server'
import { runContentResearchAgent } from '@/lib/market-os/content-research/orchestrator'
import { auditContentHeadquarters } from './repository'
import type { AiDirectorProfile } from './types'

export async function runMarketIntelligenceScan(input: {
  actorId: string
  actorName: string
  directorId?: string
  reason?: string
}) {
  const supabase = await createServiceClient() as any
  let query = supabase
    .from('market_content_ai_directors')
    .select('*')
    .eq('director_type', 'market_intelligence')
    .in('status', ['active', 'approved'])

  if (input.directorId) query = query.eq('id', input.directorId)

  const directorResult = await query
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (directorResult.error) throw directorResult.error
  const director = (directorResult.data || null) as AiDirectorProfile | null
  if (!director) throw new Error('ACTIVE_MARKET_INTELLIGENCE_DIRECTOR_NOT_FOUND')

  const run = await runContentResearchAgent({
    actorId: input.actorId,
    actorName: input.actorName,
    agentIdOrCode: 'OBSERVATORY_INTELLIGENCE',
    objective: 'Détecter pour ANGELCARE des saisons, périodes, signaux de marché, évolutions d’audience, mouvements concurrents, tendances de recherche, formats, canaux, risques de communication et fenêtres éditoriales qui doivent devenir des opportunités de contenu classifiées.',
    query: 'ANGELCARE Maroc services B2C B2B marché national saisons périodes tendances consommateurs entreprises partenaires recherche formats plateformes concurrence réputation communication contenu',
    priority: 'executive',
    triggerType: input.reason || 'manual_scan',
    overridePolicy: {
      directorId: director.id,
      directorCode: director.code,
      externalActionsAllowed: false,
      humanApprovalBoundary: 'external_only',
    },
  })

  await supabase
    .from('market_content_ai_directors')
    .update({
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', director.id)

  await auditContentHeadquarters({
    actorId: input.actorId,
    actorName: input.actorName,
    action: 'market_scan.content_research_completed',
    entityType: 'ai_director',
    entityId: director.id,
    detail: {
      researchRunId: run.id,
      status: run.status,
      providerChain: ['tavily', 'ac_capital_public_source_registry', 'openrouter'],
      externalActionsAllowed: false,
    },
  })

  return {
    directorId: director.id,
    researchRunId: run.id,
    status: run.status,
    sourcesCaptured: run.accepted_source_count,
    findingsCreated: run.finding_count,
    signalsCreated: run.signal_count,
    internalActionsCreated: run.internal_action_count,
    providerChain: ['tavily', 'ac_capital_public_source_registry', 'openrouter'],
    externalActionsAllowed: false,
  }
}
