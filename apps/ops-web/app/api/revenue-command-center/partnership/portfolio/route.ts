import { fail, ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { optionalRows, partnershipContext } from "@/lib/revenue-command-center/partnership-enterprise/server"

export const dynamic = "force-dynamic"

export async function GET(request:Request){
  try{
    const {access,supabase}=await partnershipContext("revenue.partnerships.read")
    const url=new URL(request.url)
    const contextId=url.searchParams.get("contextId")
    let base=await optionalRows(supabase,"revenue_partnership_command_view","*",query=>query.order("updated_at",{ascending:false}).limit(2500))
    if(!base.available)base=await optionalRows(supabase,"revenue_partnerships","*",query=>query.order("updated_at",{ascending:false}).limit(2500))
    let partnerships=base.rows as Array<Record<string,any>>
    if(contextId)partnerships=partnerships.filter(row=>row.id===contextId)
    const scopeAll=!contextId
    const definitions=[
      ["stakeholders","revenue_partnership_stakeholders"],["qualifications","revenue_partnership_qualifications"],
      ["programs","revenue_partner_programs"],["programLocations","revenue_partner_program_locations"],
      ["programServices","revenue_partner_program_service_lines"],["benefits","revenue_partner_benefits"],
      ["benefitUsage","revenue_partner_benefit_usage"],["obligations","revenue_partnership_obligations"],
      ["milestones","revenue_partnership_milestones"],["activationPlans","revenue_partner_activation_plans"],
      ["activationGates","revenue_partner_activation_gates"],["referrals","revenue_partner_referrals"],
      ["referralHistory","revenue_partner_referral_status_history"],["attributions","revenue_partner_referral_attributions"],
      ["attributionConflicts","revenue_partner_attribution_conflicts"],["performancePeriods","revenue_partner_performance_periods"],
      ["performanceMetrics","revenue_partner_performance_metrics"],["scorecards","revenue_partner_scorecards"],
      ["reviews","revenue_partner_reviews"],["risks","revenue_partnership_risks"],
      ["recoveryPlans","revenue_partner_recovery_plans"],["recoveryCheckpoints","revenue_partner_recovery_checkpoints"],
      ["renewals","revenue_partner_renewal_readiness"],["expansions","revenue_partner_expansions"],
      ["statusHistory","revenue_partnership_status_history"],["closures","revenue_partnership_closures"],
    ] as const
    const result:any={partnerships,schema:{revenue_partnerships:base.available}}
    await Promise.all(definitions.map(async([key,table])=>{
      const rows=await optionalRows(supabase,table,"*",query=>query.order("created_at",{ascending:false}).limit(5000))
      result[key]=contextId?rows.rows.filter((row:any)=>row.partnership_id===contextId||row.partner_id===contextId):rows.rows
      result.schema[table]=rows.available
    }))
    const contracts=await optionalRows(supabase,"revenue_contract_command_view","*",query=>query.order("updated_at",{ascending:false}).limit(3000))
    result.contracts=scopeAll?contracts.rows:contracts.rows.filter((row:any)=>row.partnership_id===contextId)
    result.schema.revenue_contracts=contracts.available
    const realizations=await optionalRows(supabase,"revenue_realization_events","*",query=>query.order("created_at",{ascending:false}).limit(5000))
    const scopedContractIds=new Set(result.contracts.map((contract:any)=>contract.id))
    result.realizationEvents=scopeAll?realizations.rows:realizations.rows.filter((row:any)=>scopedContractIds.has(row.contract_id))
    result.schema.revenue_realization_events=realizations.available
    const tasks=await optionalRows(supabase,"revenue_tasks","*",query=>query.order("created_at",{ascending:false}).limit(5000))
    result.tasks=scopeAll?tasks.rows:tasks.rows.filter((row:any)=>row.partnership_id===contextId||row.entity_id===contextId||row.metadata?.partnership_id===contextId)
    result.schema.revenue_tasks=tasks.available
    const communications=await optionalRows(supabase,"revenue_communication_events","*",query=>query.order("created_at",{ascending:false}).limit(5000))
    result.communications=scopeAll?communications.rows:communications.rows.filter((row:any)=>row.partnership_id===contextId||row.entity_id===contextId)
    result.schema.revenue_communication_events=communications.available
    const meetings=await optionalRows(supabase,"revenue_engagement_appointment_view","*",query=>query.order("updated_at",{ascending:false}).limit(3000))
    result.meetings=scopeAll?meetings.rows:meetings.rows.filter((row:any)=>row.partnership_id===contextId||row.entity_id===contextId)
    result.schema.revenue_appointments=meetings.available
    const refs=result.referrals as Array<Record<string,any>>,attrs=result.attributions as Array<Record<string,any>>,risks=result.risks as Array<Record<string,any>>,obligations=result.obligations as Array<Record<string,any>>,renewals=result.renewals as Array<Record<string,any>>,expansions=result.expansions as Array<Record<string,any>>,conflicts=result.attributionConflicts as Array<Record<string,any>>
    const realized=attrs.filter(row=>row.event_type==="revenue_realized"&&["confirmed","attributed","active"].includes(String(row.status))).reduce((total,row)=>total+Number(row.attributed_value||row.value_mad||0),0)
    const contractValue=result.contracts.reduce((total:number,row:any)=>total+Number(row.contract_value||0),0)
    const now=Date.now(),soon=now+90*86400000
    const activeStatuses=["active","performing","under_review","renewal_pending","renewed","expansion"]
    const healthValues=partnerships.map(row=>Number(row.health_score||0)).filter(value=>Number.isFinite(value))
    result.summary={
      total:partnerships.length,
      qualifying:partnerships.filter(row=>["identified","qualification","qualified","targeted"].includes(String(row.stage||row.status))).length,
      active:partnerships.filter(row=>activeStatuses.includes(String(row.stage||row.status))).length,
      performing:partnerships.filter(row=>String(row.stage||row.status)==="performing").length,
      atRisk:partnerships.filter(row=>["at_risk","risk"].includes(String(row.stage||row.status))).length,
      recovery:partnerships.filter(row=>String(row.stage||row.status)==="recovery").length,
      renewalDue:renewals.filter(row=>["draft","prepared","pending","approved"].includes(String(row.status))).length+partnerships.filter(row=>{const time=Date.parse(String(row.renewal_date||""));return Number.isFinite(time)&&time>=now&&time<=soon}).length,
      expansionReady:expansions.filter(row=>["draft","assessment","approved"].includes(String(row.status))).length+partnerships.filter(row=>String(row.stage||row.status)==="expansion").length,
      referralCount:refs.length,
      acceptedReferrals:refs.filter(row=>["accepted","converted_to_prospect","converted_to_opportunity","attributed"].includes(String(row.status))).length,
      attributedReferrals:new Set(attrs.filter(row=>["confirmed","attributed","active"].includes(String(row.status))).map(row=>row.referral_id)).size,
      openConflicts:conflicts.filter(row=>!["resolved","rejected","closed"].includes(String(row.status))).length,
      openObligations:obligations.filter(row=>!["completed","cancelled","waived"].includes(String(row.status))).length,
      overdueObligations:obligations.filter(row=>!["completed","cancelled","waived"].includes(String(row.status))&&row.due_date&&Date.parse(row.due_date)<now).length,
      openRisks:risks.filter(row=>!["resolved","closed","accepted"].includes(String(row.status))).length,
      pipelineMad:partnerships.reduce((total,row)=>total+Number(row.estimated_value_mad||0),0),
      contractedMad:contractValue,
      realizedMad:realized,
      averageHealth:healthValues.length?Math.round(healthValues.reduce((a,b)=>a+b,0)/healthValues.length):0,
    }
    result.currentUser={id:(access.user as any).id||null,email:(access.user as any).email||null,role:access.role}
    result.syncedAt=new Date().toISOString()
    return ok({data:result})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
