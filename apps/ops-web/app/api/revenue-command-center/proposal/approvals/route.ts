import { fail,ok,cleanString } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { getProposal,proposalContext,recordProposalEvent } from "@/lib/revenue-command-center/proposal-enterprise/server"

export async function POST(request:Request){
  try{
    const {access,supabase}=await proposalContext(["revenue.proposals.approve","revenue.pricing.approve"])
    const body=await request.json(),proposalId=String(body.proposalId||""),proposal=await getProposal(supabase,proposalId)
    if(!proposal)return fail("Proposition introuvable.",404)
    const requestType=cleanString(body.requestType,"proposal"),decision=cleanString(body.decision,"requested"),reason=cleanString(body.reason)
    if(!reason)return fail("Le motif de décision est requis.",400)
    if(decision==="approved"&&Number(proposal.net_value||0)<=0)return fail("Une proposition sans valeur nette ne peut pas être approuvée.",409)
    if(decision==="approved"&&Number(proposal.margin_percent||0)<Number(proposal.minimum_margin_percent||25)&&requestType!=="margin_exception"){
      const exception=await supabase.from("revenue_margin_exceptions").select("id,status").eq("proposal_id",proposalId).eq("status","approved").order("created_at",{ascending:false}).limit(1).maybeSingle()
      if(exception.error)return fail(exception.error)
      if(!exception.data)return fail("La marge est sous le seuil. Une exception de marge approuvée est requise.",409)
    }
    const row={proposal_id:proposalId,proposal_version_id:proposal.active_version_id||null,request_type:requestType,status:decision,reason,requested_by:(access.user as any).id||null,decided_by:decision!=="requested"?(access.user as any).id||null:null,decided_at:decision!=="requested"?new Date().toISOString():null}
    const {data,error}=await supabase.from("revenue_proposal_approval_requests").insert(row).select("*").single()
    if(error)return fail(error)
    if(decision!=="requested"){
      const related:Record<string,string>={discount:"revenue_discount_requests",margin_exception:"revenue_margin_exceptions",concession:"revenue_concession_requests"}
      const table=related[requestType]
      if(table){
        let query=supabase.from(table).select("id").eq("proposal_id",proposalId).eq("status","requested").order("created_at",{ascending:false}).limit(1)
        const pending=await query.maybeSingle()
        if(pending.error)return fail(pending.error)
        if(pending.data){const update=await supabase.from(table).update({status:decision,decided_by:(access.user as any).id||null,decision_reason:reason,decided_at:new Date().toISOString()}).eq("id",pending.data.id);if(update.error)return fail(update.error)}
      }
    }
    const update:any={approval_status:decision,version:Number(proposal.version||1)+1,last_activity_at:new Date().toISOString()}
    if(decision==="requested")update.status="approval_required"
    if(decision==="approved")update.status="approved"
    if(decision==="rejected"||decision==="correction_required")update.status="pricing_review"
    const updated=await supabase.from("revenue_proposals").update(update).eq("id",proposalId).select("*").single()
    if(updated.error)return fail(updated.error)
    if(proposal.active_version_id&&decision!=="requested"){
      const versionUpdate=await supabase.from("revenue_proposal_versions").update({approval_status:decision}).eq("id",proposal.active_version_id)
      if(versionUpdate.error)return fail(versionUpdate.error)
    }
    await recordProposalEvent(supabase,{proposal:updated.data,eventType:`proposal_approval_${decision}`,title:`Décision d’approbation : ${decision}`,body:reason,payload:body,result:{approvalId:data.id,requestType}})
    return ok({approval:data,proposal:updated.data})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
