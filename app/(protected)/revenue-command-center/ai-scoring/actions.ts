'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { scoreProspect, summarizeScores } from '@/lib/tier2RevenueScoringEngine'

export async function runAIScoring() {
  const supabase = await createClient()

  const [{ data: prospects }, { data: profile }] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('is_archived', false),
    supabase.from('bd_scoring_profiles').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const activeProspects = prospects || []
  const scores = activeProspects.map((prospect: any) => ({
    prospect,
    score: scoreProspect(prospect),
  }))

  for (const item of scores) {
    await supabase.from('bd_prospect_scores').insert({
      prospect_id: item.prospect.id,
      profile_id: profile?.id || null,
      total_score: item.score.total_score,
      fit_score: item.score.fit_score,
      urgency_score: item.score.urgency_score,
      risk_score: item.score.risk_score,
      revenue_score: item.score.revenue_score,
      next_best_action: item.score.next_best_action,
      rationale: item.score.rationale,
    })

    await supabase.from('bd_prospects').update({
      ai_score: item.score.total_score,
      ai_fit_score: item.score.fit_score,
      ai_urgency_score: item.score.urgency_score,
      ai_risk_score: item.score.risk_score,
      ai_revenue_score: item.score.revenue_score,
      ai_next_best_action: item.score.next_best_action,
      ai_scored_at: new Date().toISOString(),
    }).eq('id', item.prospect.id)
  }

  const summary = summarizeScores(scores.map((x: any) => x.score))

  await supabase.from('bd_scoring_runs').insert({
    profile_id: profile?.id || null,
    prospects_scored: activeProspects.length,
    avg_score: summary.avg_score,
    high_priority_count: summary.high_priority_count,
    high_risk_count: summary.high_risk_count,
  })

  revalidatePath('/revenue-command-center/ai-scoring')
}
