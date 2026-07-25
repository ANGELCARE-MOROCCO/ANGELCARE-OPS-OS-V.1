import { fail, ok } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { engagementContext, optionalRows } from "@/lib/revenue-command-center/engagement-enterprise/server"

export async function GET(request: Request) {
  try {
    const { access, supabase } = await engagementContext("revenue.appointments.read")
    const { searchParams } = new URL(request.url)
    const appointmentId=searchParams.get("appointmentId")
    const limit=Math.min(Number(searchParams.get("limit")||2500),5000)
    const byAppointment=(query:any)=>appointmentId?query.eq("appointment_id",appointmentId):query.order("created_at",{ascending:false}).limit(limit)
    const [view,base,participants,statusHistory,agendaItems,preparationItems,attendance,notes,objections,decisions,commitments,outcomes,followUps,noShows,recoveryAttempts,communicationThreads,communicationEvents,deliveryEvents,tasks]=await Promise.all([
      optionalRows(supabase,"revenue_engagement_appointment_view","*",q=>appointmentId?q.eq("id",appointmentId):q.order("appointment_at",{ascending:true}).limit(limit)),
      optionalRows(supabase,"revenue_appointments","*",q=>appointmentId?q.eq("id",appointmentId):q.order("appointment_at",{ascending:true}).limit(limit)),
      optionalRows(supabase,"revenue_appointment_participants","*",byAppointment),
      optionalRows(supabase,"revenue_appointment_status_history","*",byAppointment),
      optionalRows(supabase,"revenue_meeting_agenda_items","*",q=>appointmentId?q.eq("appointment_id",appointmentId).order("position",{ascending:true}):q.order("created_at",{ascending:false}).limit(limit)),
      optionalRows(supabase,"revenue_meeting_preparation_items","*",q=>appointmentId?q.eq("appointment_id",appointmentId).order("position",{ascending:true}):q.order("created_at",{ascending:false}).limit(limit)),
      optionalRows(supabase,"revenue_meeting_attendance","*",byAppointment),
      optionalRows(supabase,"revenue_meeting_notes","*",byAppointment),
      optionalRows(supabase,"revenue_meeting_objections","*",byAppointment),
      optionalRows(supabase,"revenue_meeting_decisions","*",byAppointment),
      optionalRows(supabase,"revenue_meeting_commitments","*",byAppointment),
      optionalRows(supabase,"revenue_meeting_outcomes","*",byAppointment),
      optionalRows(supabase,"revenue_meeting_follow_ups","*",byAppointment),
      optionalRows(supabase,"revenue_appointment_no_shows","*",byAppointment),
      optionalRows(supabase,"revenue_appointment_recovery_attempts","*",byAppointment),
      optionalRows(supabase,"revenue_communication_threads","*",q=>appointmentId?q.eq("appointment_id",appointmentId):q.order("updated_at",{ascending:false}).limit(limit)),
      optionalRows(supabase,"revenue_communication_events","*",q=>appointmentId?q.eq("appointment_id",appointmentId):q.order("occurred_at",{ascending:false}).limit(limit)),
      optionalRows(supabase,"revenue_communication_delivery_events","*",q=>q.order("occurred_at",{ascending:false}).limit(limit)),
      optionalRows(supabase,"revenue_tasks","*",q=>appointmentId?q.eq("entity_type","appointment").eq("entity_id",appointmentId):q.eq("entity_type","appointment").order("updated_at",{ascending:false}).limit(limit)),
    ])
    const appointments=((view.available&&view.rows.length?view.rows:base.rows)||[]) as any[]
    const now=new Date(), today=now.toISOString().slice(0,10), nowMs=now.getTime()
    const status=(row:any)=>String(row.status||"scheduled").toLowerCase().replaceAll("-","_")
    const active=appointments.filter(row=>!["completed","converted","cancelled","lost","archived"].includes(status(row)))
    const todayRows=appointments.filter(row=>String(row.appointment_at||"").slice(0,10)===today)
    const upcoming=active.filter(row=>new Date(String(row.appointment_at||0)).getTime()>=nowMs)
    const confirmed=appointments.filter(row=>["confirmed","prepared","live","completed","converted"].includes(status(row))||String(row.confirmation_status||"")==="confirmed")
    const completed=appointments.filter(row=>["completed","converted","follow_up"].includes(status(row)))
    const converted=appointments.filter(row=>status(row)==="converted"||String(row.outcome_code||"").includes("converted"))
    const noShowRows=appointments.filter(row=>status(row)==="no_show")
    const atRisk=active.filter(row=>Number(row.no_show_risk||0)>=60||["confirmation_pending"].includes(status(row))||String(row.confirmation_status||"")==="pending")
    const highValue=appointments.filter(row=>Number(row.commercial_value_mad||0)>=25000)
    const recoveryOpen=recoveryAttempts.rows.filter((row:any)=>!["completed","closed","lost"].includes(String(row.status||"open"))).length
    const openCommitments=commitments.rows.filter((row:any)=>!["completed","cancelled"].includes(String(row.status||"open"))).length
    const waitingExternal=communicationThreads.rows.filter((row:any)=>String(row.status||"")==="waiting_external").length
    const summary={
      total:appointments.length,today:todayRows.length,upcoming:upcoming.length,
      confirmationPending:active.filter(row=>status(row)==="confirmation_pending"||String(row.confirmation_status||"")==="pending").length,
      preparationPending:active.filter(row=>["confirmed","prepared"].includes(status(row))&&String(row.preparation_status||"not_started")!=="complete").length,
      live:appointments.filter(row=>status(row)==="live").length,completed:completed.length,noShows:noShowRows.length,recoveryOpen,
      highValue:highValue.length,atRisk:atRisk.length,conversionRate:completed.length?Math.round(converted.length/completed.length*100):0,
      confirmedRate:appointments.length?Math.round(confirmed.length/appointments.length*100):0,
      commercialValueMad:appointments.reduce((sum,row)=>sum+Number(row.commercial_value_mad||0),0),
      valueAtRiskMad:atRisk.reduce((sum,row)=>sum+Number(row.commercial_value_mad||0),0),openCommitments,waitingExternal,
    }
    return ok({
      appointments,participants:participants.rows,statusHistory:statusHistory.rows,agendaItems:agendaItems.rows,preparationItems:preparationItems.rows,
      attendance:attendance.rows,notes:notes.rows,objections:objections.rows,decisions:decisions.rows,commitments:commitments.rows,outcomes:outcomes.rows,
      followUps:followUps.rows,noShows:noShows.rows,recoveryAttempts:recoveryAttempts.rows,communicationThreads:communicationThreads.rows,
      communicationEvents:communicationEvents.rows,deliveryEvents:deliveryEvents.rows,tasks:tasks.rows,summary,
      schema:{ appointmentView:view.available,participants:participants.available,statusHistory:statusHistory.available,agendaItems:agendaItems.available,preparationItems:preparationItems.available,attendance:attendance.available,notes:notes.available,objections:objections.available,decisions:decisions.available,commitments:commitments.available,outcomes:outcomes.available,followUps:followUps.available,noShows:noShows.available,recoveryAttempts:recoveryAttempts.available,communicationThreads:communicationThreads.available,communicationEvents:communicationEvents.available,deliveryEvents:deliveryEvents.available },
      currentUser:{id:(access.user as any).id||null,email:(access.user as any).email||null,role:access.role},syncedAt:new Date().toISOString(),
    })
  } catch(error) { const access=revenueAccessFailure(error); return access?fail(access.message,access.status):fail(error) }
}
