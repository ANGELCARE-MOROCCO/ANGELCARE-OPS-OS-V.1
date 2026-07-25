import { fail,ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { engagementContext,getAppointment,recordEngagementEvent } from "@/lib/revenue-command-center/engagement-enterprise/server"

export async function POST(request:Request){
  try{
    const {access,supabase}=await engagementContext("revenue.appointments.outcomes.manage")
    const body=await request.json()
    const appointment=await getAppointment(supabase,String(body.appointmentId||""))
    if(!appointment)return fail("Rendez-vous introuvable.",404)
    if(!String(body.summary||body.outcome||"").trim())return fail("Le résumé du résultat est requis.",400)
    const {data,error}=await supabase.rpc("revenue_apply_meeting_outcome",{
      p_appointment_id:appointment.id,p_payload:body,p_actor:(access.user as any).id||null,
    })
    if(error)return fail(error)
    const result=(data||{}) as any
    await recordEngagementEvent(supabase,{
      appointment:result.appointment||appointment,eventType:"meeting_outcome_recorded",
      title:`Résultat commercial : ${body.outcomeCode||"follow_up"}`,body:String(body.summary||body.outcome),
      severity:String(body.outcomeCode||"").includes("lost")?"warning":"info",
      metadata:{outcomeId:result.outcome?.id,taskIds:result.taskIds||[]},payload:body,
      result:{outcomeId:result.outcome?.id,status:result.appointment?.status,taskIds:result.taskIds||[]},
    })
    return ok(result)
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
