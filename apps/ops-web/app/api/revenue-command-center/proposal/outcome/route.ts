import { fail,ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

import { proposalContext } from "@/lib/revenue-command-center/proposal-enterprise/server"
export async function POST(request:Request){
  try{
    const {access,supabase}=await proposalContext("revenue.proposals.accept")
    const body=await request.json(),proposalId=String(body.proposalId||"")
    if(!proposalId)return fail("Proposition requise.",400)
    const input={...body,evidence:body.evidence&&typeof body.evidence==="object"?body.evidence:{reference:String(body.acceptanceEvidence||"").trim()}}
    const result=await supabase.rpc("revenue_apply_commercial_outcome",{p_proposal_id:proposalId,p_input:input,p_actor_id:(access.user as any).id||null})
    if(result.error)return fail(result.error)
    const payload=Array.isArray(result.data)?result.data[0]:result.data
    return ok({outcome:payload})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
