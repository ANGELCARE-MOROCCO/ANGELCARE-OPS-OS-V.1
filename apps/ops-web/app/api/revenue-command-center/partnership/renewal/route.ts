import { fail,ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { cleanString } from "@/lib/revenue-command-center/canonical-server"
import { partnershipContext,updateRow } from "@/lib/revenue-command-center/partnership-enterprise/server"

export async function POST(request:Request){
  try{
    const {access,supabase}=await partnershipContext("revenue.partnerships.renewal")
    const body=await request.json(),partnershipId=cleanString(body.partnershipId||body.partnerId)
    if(!partnershipId)return fail("partnershipId requis.",400)
    const result=await supabase.from("revenue_partner_renewal_readiness").insert({
      partnership_id:partnershipId,contract_id:cleanString(body.contractId)||null,decision_date:cleanString(body.decisionDate)||null,
      recommendation:cleanString(body.recommendation,"renew"),evidence_summary:cleanString(body.evidenceSummary),status:"prepared",
      created_by:(access.user as any).id||null,updated_by:(access.user as any).id||null,
    }).select("*").single()
    if(result.error)return fail(result.error)
    return ok({renewal:result.data})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}

export async function PATCH(request:Request){
  try{
    const body=await request.json(),id=cleanString(body.renewalId),action=cleanString(body.action)
    if(!id)return fail("renewalId requis.",400)
    const permission=action==="launch_negotiation"?"revenue.negotiations.manage":action==="launch_proposal"?"revenue.proposals.manage":"revenue.partnerships.renewal.approve"
    const {access,supabase}=await partnershipContext(permission)
    if(action==="launch_proposal"||action==="launch_negotiation"){
      const rpc=await supabase.rpc("revenue_launch_partner_renewal_workflow",{
        p_renewal_id:id,p_action:action,p_actor_id:(access.user as any).id||null,
        p_notes:cleanString(body.commercialObjective||body.position||body.notes)||null,
      })
      if(rpc.error)return fail(rpc.error)
      return ok({result:Array.isArray(rpc.data)?rpc.data[0]:rpc.data})
    }
    const status=cleanString(body.status,"approved"),reason=cleanString(body.decisionReason)
    if(["approved","rejected"].includes(status)&&!reason)return fail("Le motif de décision est obligatoire.",400)
    const data=await updateRow(supabase,"revenue_partner_renewal_readiness",id,{
      status,decision_reason:reason||null,updated_by:(access.user as any).id||null,updated_at:new Date().toISOString(),
    })
    return ok({renewal:data})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
