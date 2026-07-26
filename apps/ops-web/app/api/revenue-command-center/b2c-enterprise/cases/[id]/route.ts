import { fail, ok, cleanNumber, cleanString } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { b2cContext, getB2CCase, recordB2CEvent } from "@/lib/revenue-command-center/b2c-enterprise/server"

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  try{const {supabase}=await b2cContext("revenue.b2c.read"),{id}=await params,row=await getB2CCase(supabase,id);return row?ok({case:row}):fail("Dossier famille introuvable.",404)}
  catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {access,supabase}=await b2cContext("revenue.b2c.admin"),{id}=await params,current=await getB2CCase(supabase,id)
    if(!current)return fail("Dossier famille introuvable.",404)
    if(!["lead","lost","cancelled","archived"].includes(String(current.stage)))return fail("Un dossier engagé ne peut pas être supprimé. Utilisez la clôture gouvernée.",409)
    const result=await supabase.from("revenue_b2c_cases").delete().eq("id",id);if(result.error)return fail(result.error)
    await recordB2CEvent(supabase,{caseRecord:current,eventType:"b2c_case_deleted",title:`Dossier famille supprimé : ${current.family_name||current.parent_name}`,actorId:(access.user as any).id||null,severity:"warning"})
    return ok({deleted:true,id})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
