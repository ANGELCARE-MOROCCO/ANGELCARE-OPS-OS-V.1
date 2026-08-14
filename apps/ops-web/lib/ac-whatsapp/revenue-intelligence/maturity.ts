import type { RevenueMaturityLevel } from './types'

export function maturityLevel(score: number, samples: number): RevenueMaturityLevel {
  if (samples < 1) return 'L0'
  if (samples < 3) return 'L1'
  if (samples < 8) return 'L2'
  if (score < .58 || samples < 15) return 'L3'
  if (score < .7 || samples < 35) return 'L4'
  if (score < .82 || samples < 80) return 'L5'
  return 'L6'
}

export function maturityScore(input: { samples:number; successes:number; failures:number; overrides:number; conversions:number }) {
  const { samples, successes, failures, overrides, conversions } = input
  if (!samples) return 0
  const successRate = successes / samples
  const failureRate = failures / samples
  const overrideRate = overrides / samples
  const conversionSignal = Math.min(.2, conversions / Math.max(1,samples) * .2)
  const evidenceBonus = Math.min(.12, Math.log10(samples + 1) * .05)
  return Math.max(0, Math.min(1, successRate * .7 - failureRate * .25 - overrideRate * .2 + conversionSignal + evidenceBonus))
}

export async function recordMaturityEvent(supabase:any,input:{dimensionType:string;dimensionKey:string;event:'success'|'failure'|'override'|'conversion'|'sample';metadata?:Record<string,unknown>}){
  const found=await supabase.from('ac_whatsapp_ri_maturity').select('*').eq('dimension_type',input.dimensionType).eq('dimension_key',input.dimensionKey).maybeSingle()
  if(found.error)throw found.error
  const current=found.data||{samples:0,successful_count:0,failed_count:0,override_count:0,conversion_count:0,evidence:{}}
  const samples=Number(current.samples||0)+1
  const successes=Number(current.successful_count||0)+(input.event==='success'?1:0)
  const failures=Number(current.failed_count||0)+(input.event==='failure'?1:0)
  const overrides=Number(current.override_count||0)+(input.event==='override'?1:0)
  const conversions=Number(current.conversion_count||0)+(input.event==='conversion'?1:0)
  const score=maturityScore({samples,successes,failures,overrides,conversions})
  const level=maturityLevel(score,samples)
  const evidence={...(current.evidence||{}),last_event:input.event,last_metadata:input.metadata||{},last_at:new Date().toISOString()}
  const payload={samples,successful_count:successes,failed_count:failures,override_count:overrides,conversion_count:conversions,score,maturity_level:level,evidence,updated_at:new Date().toISOString()}
  if(found.data?.id){const update=await supabase.from('ac_whatsapp_ri_maturity').update(payload).eq('id',found.data.id);if(update.error)throw update.error}
  else{const inserted=await supabase.from('ac_whatsapp_ri_maturity').insert({...payload,dimension_type:input.dimensionType,dimension_key:input.dimensionKey});if(inserted.error)throw inserted.error}
  return {score,level,samples}
}

export async function generateMaturityProposals(supabase:any){
  const maturity=await supabase.from('ac_whatsapp_ri_maturity').select('*').gte('samples',8).order('updated_at',{ascending:false}).limit(200)
  if(maturity.error)throw maturity.error
  const proposals:any[]=[]
  for(const row of maturity.data||[]){
    const overrideRate=Number(row.override_count||0)/Math.max(1,Number(row.samples||0))
    const failureRate=Number(row.failed_count||0)/Math.max(1,Number(row.samples||0))
    if(overrideRate<.18&&failureRate<.2)continue
    const fingerprint=`${row.dimension_type}:${row.dimension_key}:${Math.floor(Number(row.samples||0)/5)}`
    const exists=await supabase.from('ac_whatsapp_ri_governance_proposals').select('id').eq('fingerprint',fingerprint).in('status',['proposed','under_review']).maybeSingle()
    if(exists.error)throw exists.error
    if(exists.data)continue
    proposals.push({
      fingerprint,
      proposal_type:'maturity_refinement',
      title:`Renforcer ${row.dimension_key}`,
      description:overrideRate>=.18?'Les opérateurs corrigent fréquemment cette intelligence. Revoir la doctrine, le ton ou le prochain objectif.':'Le taux d’échec observé justifie une nouvelle simulation et un raffinement.',
      evidence:{samples:row.samples,overrideRate,failureRate,score:row.score,maturityLevel:row.maturity_level},
      proposed_change:{dimension_type:row.dimension_type,dimension_key:row.dimension_key,action:'review_doctrine_and_simulate'},
      risk_level:failureRate>.35?'high':'medium',
      status:'proposed',
    })
  }
  if(proposals.length){const inserted=await supabase.from('ac_whatsapp_ri_governance_proposals').insert(proposals);if(inserted.error)throw inserted.error}
  return proposals.length
}
