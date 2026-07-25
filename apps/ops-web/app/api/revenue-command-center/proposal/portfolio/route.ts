import { fail,ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { optionalRows,proposalContext } from "@/lib/revenue-command-center/proposal-enterprise/server"

export async function GET(request:Request){
  try{
    const {access,supabase}=await proposalContext("revenue.proposals.read")
    const url=new URL(request.url),contextId=url.searchParams.get("contextId"),contextType=url.searchParams.get("contextType")
    let proposalResult=await optionalRows(supabase,"revenue_proposal_command_view","*",(q:any)=>q.order("updated_at",{ascending:false}).limit(2000))
    if(!proposalResult.available)proposalResult=await optionalRows(supabase,"revenue_proposals","*",(q:any)=>q.order("updated_at",{ascending:false}).limit(2000))
    let proposals=proposalResult.rows as any[]
    if(contextId)proposals=proposals.filter(item=>item.id===contextId||item.prospect_id===contextId||item.partnership_id===contextId||item.b2c_case_id===contextId)
    if(contextType)proposals=proposals.filter(item=>item.context_type===contextType||item.proposal_type===contextType||contextType==="b2c"&&item.proposal_type==="b2c_quote")
    const proposalIds=proposals.map(item=>item.id)
    const tables=[
      ["versions","revenue_proposal_versions"],["sections","revenue_proposal_sections"],["lineItems","revenue_proposal_line_items"],["pricingScenarios","revenue_pricing_scenarios"],["approvals","revenue_proposal_approval_requests"],["discountRequests","revenue_discount_requests"],["marginExceptions","revenue_margin_exceptions"],["recipients","revenue_proposal_recipients"],["transmissions","revenue_proposal_transmissions"],["deliveryEvents","revenue_proposal_delivery_events"],["responses","revenue_proposal_responses"],["negotiations","revenue_negotiations"],["rounds","revenue_negotiation_rounds"],["positions","revenue_negotiation_positions"],["objections","revenue_proposal_objections"],["counteroffers","revenue_counteroffers"],["concessions","revenue_concession_requests"],["decisions","revenue_negotiation_decisions"],["statusHistory","revenue_proposal_status_history"],["contractHandoffs","revenue_contract_handoffs"],
    ] as const
    const result:any={proposals,schema:{revenue_proposals:proposalResult.available}}
    const opportunityResult=await optionalRows(supabase,"revenue_opportunities","*",(q:any)=>q.order("updated_at",{ascending:false}).limit(1000))
    result.opportunities=opportunityResult.rows
    result.schema.revenue_opportunities=opportunityResult.available
    const fetched=await Promise.all(tables.map(async([key,table])=>[key,table,await optionalRows(supabase,table,"*",(q:any)=>q.order("created_at",{ascending:false}).limit(3000))] as const))
    for(const [key,table,rows] of fetched){result[key]=rows.rows;result.schema[table]=rows.available}
    if(proposalIds.length){
      result.negotiations=(result.negotiations||[]).filter((row:any)=>proposalIds.includes(row.proposal_id))
      const negotiationIds=result.negotiations.map((row:any)=>row.id)
      for(const [key] of tables){
        if(key==="negotiations")continue
        result[key]=(result[key]||[]).filter((row:any)=>proposalIds.includes(row.proposal_id)||negotiationIds.includes(row.negotiation_id))
      }
    }
    const communications=await optionalRows(supabase,"revenue_communication_events","*",(q:any)=>q.order("created_at",{ascending:false}).limit(1000));result.communications=communications.rows.filter((row:any)=>proposalIds.includes(row.proposal_id)||proposalIds.includes(row.entity_id));result.schema.revenue_communication_events=communications.available
    const tasks=await optionalRows(supabase,"revenue_tasks","*",(q:any)=>q.order("created_at",{ascending:false}).limit(2000));result.tasks=tasks.rows.filter((row:any)=>proposalIds.includes(row.entity_id)||proposalIds.includes(row.metadata?.proposal_id));result.schema.revenue_tasks=tasks.available
    const now=Date.now(),soon=now+7*86400000
    const active=proposals.filter(item=>!["rejected","withdrawn","expired","archived","superseded"].includes(item.status))
    const value=active.reduce((s,item)=>s+Number(item.net_value||0),0)
    const weighted=active.reduce((s,item)=>s+Number(item.net_value||0)*Number(item.probability||item.metadata?.probability||50)/100,0)
    const margins=active.filter(item=>Number.isFinite(Number(item.margin_percent))).map(item=>Number(item.margin_percent||0))
    const negotiations=(result.negotiations||[]) as any[],concessions=(result.concessions||[]) as any[],objections=(result.objections||[]) as any[]
    result.summary={total:proposals.length,draft:proposals.filter(i=>i.status==="draft").length,approvalRequired:proposals.filter(i=>i.status==="approval_required"||i.approval_status==="pending").length,approved:proposals.filter(i=>i.status==="approved").length,readyToSend:proposals.filter(i=>i.status==="ready_to_send").length,sent:proposals.filter(i=>i.status==="sent").length,customerReview:proposals.filter(i=>i.status==="customer_review").length,negotiation:proposals.filter(i=>i.status==="negotiation").length,accepted:proposals.filter(i=>["accepted","contract_ready"].includes(i.status)).length,rejected:proposals.filter(i=>i.status==="rejected").length,expiring:active.filter(i=>{const d=new Date(i.validity_until||0).getTime();return d>=now&&d<=soon}).length,valueMad:value,weightedValueMad:weighted,valueAtRiskMad:active.filter(i=>Number(i.margin_percent||0)<Number(i.minimum_margin_percent||25)||i.status==="negotiation").reduce((s,i)=>s+Number(i.net_value||0),0),averageMarginPercent:margins.length?margins.reduce((a,b)=>a+b,0)/margins.length:0,discountExposureMad:active.reduce((s,i)=>s+Number(i.discount_value||0),0),pendingConcessions:concessions.filter(i=>["requested","pending"].includes(i.status)).length,openObjections:objections.filter(i=>!["resolved","closed"].includes(i.resolution_status)).length,stalledNegotiations:negotiations.filter(i=>i.status==="stalled").length,contractReady:proposals.filter(i=>i.status==="contract_ready").length}
    result.currentUser={id:(access.user as any).id||null,email:(access.user as any).email||null,role:access.role};result.syncedAt=new Date().toISOString()
    return ok(result)
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
