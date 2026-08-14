import type { DoctrinePack, RevenueBootstrap } from './types'

export async function loadDoctrinePacks(supabase:any, packId?:string|null):Promise<DoctrinePack[]>{
  let packQuery=supabase.from('ac_whatsapp_ri_doctrine_packs').select('*').in('status',['active','validated'])
  if(packId)packQuery=packQuery.eq('id',packId)
  const packs=await packQuery.order('commercial_priority',{ascending:false}).order('updated_at',{ascending:false})
  if(packs.error)throw packs.error
  const ids=(packs.data||[]).map((row:any)=>row.id)
  if(!ids.length)return []
  const nodes=await supabase.from('ac_whatsapp_ri_doctrine_nodes').select('*').in('pack_id',ids).eq('status','active').order('priority',{ascending:false})
  if(nodes.error)throw nodes.error
  const byPack=new Map<string,any[]>()
  for(const node of nodes.data||[])byPack.set(node.pack_id,[...(byPack.get(node.pack_id)||[]),node])
  return (packs.data||[]).map((pack:any)=>({...pack,nodes:byPack.get(pack.id)||[]}))
}

export async function loadConversationRevenueState(supabase:any,conversationId:string){
  const state=await supabase.from('ac_whatsapp_ri_conversation_state').select('*').eq('conversation_id',conversationId).maybeSingle()
  if(state.error)throw state.error
  return state.data
}

export async function ensureConversationRevenueState(supabase:any,input:{conversationId:string;mode?:string;packId?:string|null;goal?:string|null;userId?:string|null}){
  const current=await loadConversationRevenueState(supabase,input.conversationId)
  if(current)return current
  const inserted=await supabase.from('ac_whatsapp_ri_conversation_state').insert({conversation_id:input.conversationId,mode:input.mode||'manual',doctrine_pack_id:input.packId||null,current_goal:input.goal||null,enabled_by:input.userId||null}).select('*').single()
  if(inserted.error)throw inserted.error
  return inserted.data
}

export async function revenueBootstrap(supabase:any):Promise<RevenueBootstrap>{
  const [settings,packs,imports,maturity,proposals,simulations,runtime,states,decisions,campaigns]=await Promise.all([
    supabase.from('ac_whatsapp_ri_engine_settings').select('*').order('scope_type').order('updated_at',{ascending:false}),
    supabase.from('ac_whatsapp_ri_doctrine_packs').select('*').order('commercial_priority',{ascending:false}).order('updated_at',{ascending:false}),
    supabase.from('ac_whatsapp_ri_imports').select('*').order('created_at',{ascending:false}).limit(30),
    supabase.from('ac_whatsapp_ri_maturity').select('*').order('score',{ascending:false}).limit(120),
    supabase.from('ac_whatsapp_ri_governance_proposals').select('*').order('created_at',{ascending:false}).limit(80),
    supabase.from('ac_whatsapp_ri_simulations').select('*').order('created_at',{ascending:false}).limit(30),
    supabase.from('ac_whatsapp_ri_runtime_events').select('*').order('created_at',{ascending:false}).limit(80),
    supabase.from('ac_whatsapp_ri_conversation_state').select('*').order('updated_at',{ascending:false}).limit(200),
    supabase.from('ac_whatsapp_ri_decisions').select('*').order('created_at',{ascending:false}).limit(100),
    supabase.from('ac_whatsapp_campaigns').select('id,name,status,objective,department,automation_doctrine_pack_id,automation_goal,created_at').order('created_at',{ascending:false}).limit(80),
  ])
  for(const result of [settings,packs,imports,maturity,proposals,simulations,runtime,states,decisions,campaigns])if(result.error)throw result.error
  const allPacks=packs.data||[]
  return {
    settings:settings.data||[],packs:allPacks,imports:imports.data||[],maturity:maturity.data||[],proposals:proposals.data||[],simulations:simulations.data||[],runtime:runtime.data||[],states:states.data||[],decisions:decisions.data||[],campaigns:campaigns.data||[],
    counts:{
      packs:allPacks.length,
      activePacks:allPacks.filter((x:any)=>['active','validated'].includes(x.status)).length,
      imports:(imports.data||[]).length,
      mature:(maturity.data||[]).filter((x:any)=>['L4','L5','L6'].includes(x.maturity_level)).length,
      proposals:(proposals.data||[]).filter((x:any)=>['proposed','under_review'].includes(x.status)).length,
      runtimeWarnings:(runtime.data||[]).filter((x:any)=>['warning','high','critical'].includes(x.severity)).length,
      autonomousConversations:(states.data||[]).filter((x:any)=>['selected_auto','account_auto'].includes(x.mode)).length,
      campaignBrains:(campaigns.data||[]).filter((x:any)=>Boolean(x.automation_doctrine_pack_id)).length,
    }
  }
}
