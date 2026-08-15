import { NextRequest } from 'next/server'
import { acContext, fail, ok } from '@/lib/ac-whatsapp/server'

export async function GET(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.view')
  if('error' in context)return context.error
  try{
    const [cognition,learningCandidates,knowledge,offers,actionRuns,events,outcomes,maturity,audit,doctrineNodes]=await Promise.all([
      context.supabase.from('ac_whatsapp_cc_relationship_cognition').select('*').order('updated_at',{ascending:false}).limit(240),
      context.supabase.from('ac_whatsapp_cc_learning_candidates').select('*').order('created_at',{ascending:false}).limit(120),
      context.supabase.from('ac_whatsapp_cc_knowledge_entities').select('*').order('priority',{ascending:false}).limit(600),
      context.supabase.from('ac_whatsapp_cc_offer_catalog').select('*').order('priority',{ascending:false}).limit(200),
      context.supabase.from('ac_whatsapp_cc_action_runs').select('*').order('created_at',{ascending:false}).limit(160),
      context.supabase.from('ac_whatsapp_cc_event_queue').select('*').order('created_at',{ascending:false}).limit(160),
      context.supabase.from('ac_whatsapp_cc_outcomes').select('*').order('created_at',{ascending:false}).limit(160),
      context.supabase.from('ac_whatsapp_cc_maturity_dimensions').select('*').order('score',{ascending:false}).limit(240),
      context.supabase.from('ac_whatsapp_cc_audit').select('*').order('created_at',{ascending:false}).limit(180),
      context.supabase.from('ac_whatsapp_ri_doctrine_nodes').select('*').order('priority',{ascending:false}).limit(800),
    ])
    for(const result of [cognition,learningCandidates,knowledge,offers,actionRuns,events,outcomes,maturity,audit,doctrineNodes])if(result.error)throw result.error
    const cognitionRows=cognition.data||[]
    const learningRows=learningCandidates.data||[]
    const knowledgeRows=knowledge.data||[]
    const actionRows=actionRuns.data||[]
    const eventRows=events.data||[]
    const outcomeRows=outcomes.data||[]
    const maturityRows=maturity.data||[]
    const auditRows=audit.data||[]
    const doctrineRows=doctrineNodes.data||[]
    const activeKnowledge=knowledgeRows.filter((row:any)=>row.active!==false&&row.truth_status!=='blocked')
    const green=cognitionRows.filter((row:any)=>row.eligibility==='green').length
    const amber=cognitionRows.filter((row:any)=>row.eligibility==='amber').length
    const red=cognitionRows.filter((row:any)=>row.eligibility==='red'||row.escalation_flag).length
    const successfulOutcomes=outcomeRows.filter((row:any)=>['converted','booking','meeting','proposal','qualified','retained','upsold','recovered'].includes(String(row.outcome||''))).length
    return ok({
      cognition:cognitionRows,
      learningCandidates:learningRows,
      knowledge:knowledgeRows,
      offers:offers.data||[],
      actionRuns:actionRows,
      events:eventRows,
      outcomes:outcomeRows,
      maturity:maturityRows,
      audit:auditRows,
      doctrineNodes:doctrineRows,
      counts:{
        cognition:cognitionRows.length,
        green,amber,red,
        escalations:red,
        learningCandidates:learningRows.filter((row:any)=>['proposed','under_review'].includes(String(row.status))).length,
        knowledge:activeKnowledge.length,
        offers:(offers.data||[]).filter((row:any)=>row.active!==false).length,
        pendingEvents:eventRows.filter((row:any)=>row.status==='scheduled').length,
        failedEvents:eventRows.filter((row:any)=>row.status==='failed').length,
        actions:actionRows.length,
        outcomes:outcomeRows.length,
        successfulOutcomes,
        doctrineNodes:doctrineRows.length,
        maturityDomains:maturityRows.length,
      }
    })
  }catch(cause){
    return fail('COMMERCIAL_COGNITION_COMMAND_FAILED',500,cause instanceof Error?cause.message:String(cause))
  }
}
