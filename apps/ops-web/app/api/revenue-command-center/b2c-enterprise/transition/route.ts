import { fail, ok, cleanNumber, cleanString } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { B2C_STAGES, b2cContext, getB2CCase, normalizeB2CStage, recordB2CEvent } from "@/lib/revenue-command-center/b2c-enterprise/server"

const allowed:Record<string,string[]>={
  lead:["intake","cancelled","lost"],intake:["qualified","consultation","cancelled","lost"],qualified:["consultation","recommendation","quoted","lost"],
  consultation:["recommendation","quoted","lost"],recommendation:["quoted","consultation","lost"],quoted:["matching","lost","cancelled"],
  matching:["confirmed","matching","lost","cancelled"],confirmed:["onboarding","cancelled"],onboarding:["activation_pending","recovery","cancelled"],
  activation_pending:["active","recovery","cancelled"],active:["retention","recovery","completed","cancelled"],retention:["active","recovery","completed","cancelled"],
  recovery:["active","retention","completed","cancelled","lost"],completed:["archived"],cancelled:["archived"],lost:["archived"],archived:[],
}
export async function POST(request:Request){
  try{
    const {access,supabase}=await b2cContext("revenue.b2c.transition"),body=await request.json(),id=cleanString(body.caseId||body.b2cCaseId),to=normalizeB2CStage(body.toStage)
    if(!id)return fail("caseId requis.",400)
    const current=await getB2CCase(supabase,id);if(!current)return fail("Dossier famille introuvable.",404)
    const from=normalizeB2CStage(current.stage)
    if(!B2C_STAGES.includes(to)||!(allowed[from]||[]).includes(to))return fail(`Transition interdite : ${from} → ${to}.`,409)
    const reason=cleanString(body.reason);if(!reason)return fail("Le motif de transition est obligatoire.",400)
    const result=await supabase.from("revenue_b2c_cases").update({stage:to,next_action:cleanString(body.nextAction)||null,updated_at:new Date().toISOString(),updated_by:(access.user as any).id||null}).eq("id",id).select("*").single()
    if(result.error)return fail(result.error)
    await recordB2CEvent(supabase,{caseRecord:result.data,eventType:"b2c_stage_transition",title:`Cycle B2C : ${from} → ${to}`,previousState:from,newState:to,reason,payload:body,result:{id},actorId:(access.user as any).id||null})
    return ok({case:result.data})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
