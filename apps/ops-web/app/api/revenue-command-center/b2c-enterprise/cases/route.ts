import { fail, ok, cleanNumber, cleanString } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { b2cContext, getB2CCase, normalizeCasePayload, recordB2CEvent } from "@/lib/revenue-command-center/b2c-enterprise/server"

export async function GET(){
  try{
    const {supabase}=await b2cContext("revenue.b2c.read")
    let result=await supabase.from("revenue_b2c_command_view").select("*").order("updated_at",{ascending:false})
    if(result.error)result=await supabase.from("revenue_b2c_cases").select("*").neq("status","archived").order("updated_at",{ascending:false})
    if(result.error)return fail(result.error)
    return ok({cases:result.data||[]})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
export async function POST(request:Request){
  try{
    const {access,supabase}=await b2cContext("revenue.b2c.manage")
    const body=await request.json(),row=normalizeCasePayload(body),actor=(access.user as any).id||null
    if(!row.phone&&!row.email)return fail("Un téléphone ou un email est requis.",400)
    let duplicate:any={data:[],error:null}
    if(row.phone)duplicate=await supabase.from("revenue_b2c_cases").select("id,parent_name,phone,email,city,status").eq("phone",row.phone).neq("status","archived").limit(10)
    if(!duplicate.error&&row.email&&!duplicate.data?.length)duplicate=await supabase.from("revenue_b2c_cases").select("id,parent_name,phone,email,city,status").ilike("email",row.email).neq("status","archived").limit(10)
    if(!duplicate.error&&(duplicate.data||[]).length)return fail("Un dossier famille actif existe déjà avec ce contact. Ouvrez le dossier existant ou documentez une exception.",409)
    const {data,error}=await supabase.from("revenue_b2c_cases").insert({...row,created_by:actor,updated_by:actor}).select("*").single()
    if(error)return fail(error)
    await recordB2CEvent(supabase,{caseRecord:data,eventType:"b2c_case_created",title:`Dossier famille créé : ${data.family_name||data.parent_name}`,newState:data.stage,payload:body,result:{id:data.id},actorId:actor})
    return ok({case:data})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
export async function PATCH(request:Request){
  try{
    const {access,supabase}=await b2cContext("revenue.b2c.manage"),body=await request.json(),id=cleanString(body.caseId||body.b2cCaseId||body.id)
    if(!id)return fail("caseId requis.",400)
    const current=await getB2CCase(supabase,id);if(!current)return fail("Dossier famille introuvable.",404)
    const normalized=normalizeCasePayload({...current,...body})
    const allowed=["parent_name","family_name","city","service_interest","priority","urgency","estimated_value_mad","owner","owner_id","phone","email","preferred_channel","prospect_text_id","account_id","opportunity_id","accepted_proposal_id","contract_id","operational_handoff_id","desired_start_date","intake_status","qualification_status","consultation_status","recommendation_status","quote_status","matching_status","onboarding_status","activation_status","care_start_status","relationship_status","retention_status","risk_status","satisfaction_score","next_action","next_action_at","metadata"]
    const patch:any={updated_at:new Date().toISOString(),updated_by:(access.user as any).id||null}
    for(const key of allowed)if((normalized as any)[key]!==undefined)patch[key]=(normalized as any)[key]
    if(body.paymentConfirmationId)patch.metadata={...(current.metadata||{}),payment_confirmation_id:body.paymentConfirmationId}
    const result=await supabase.from("revenue_b2c_cases").update(patch).eq("id",id).select("*").single()
    if(result.error)return fail(result.error)
    await recordB2CEvent(supabase,{caseRecord:result.data,eventType:"b2c_case_updated",title:`Dossier famille actualisé : ${result.data.family_name||result.data.parent_name}`,payload:body,result:{id},actorId:(access.user as any).id||null})
    return ok({case:result.data})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
