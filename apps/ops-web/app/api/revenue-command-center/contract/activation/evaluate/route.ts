import { fail,ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

import { contractContext } from "@/lib/revenue-command-center/contract-enterprise/server"
export async function POST(request:Request){try{const {access,supabase}=await contractContext("revenue.contracts.activation.evaluate"),body=await request.json(),contractId=String(body.contractId||"");if(!contractId)return fail("Contrat requis.",400);const result=await supabase.rpc("revenue_evaluate_activation_gates",{p_contract_id:contractId,p_input:body,p_actor_id:(access.user as any).id||null});if(result.error)return fail(result.error);return ok({evaluation:Array.isArray(result.data)?result.data[0]:result.data})}catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}}
