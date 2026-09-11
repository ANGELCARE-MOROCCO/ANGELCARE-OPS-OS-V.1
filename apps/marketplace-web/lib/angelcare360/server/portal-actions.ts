import 'server-only'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { requirePortalIdentity } from '@/lib/angelcare360/portal/server'
import { portalPermissionSet, requireParentChildCapability } from '@/lib/angelcare360/portal/policy'
import { executeAngelcare360EnterpriseCommand, transitionAngelcare360Workflow } from '@/lib/angelcare360/server/enterprise-command-kernel'
import { createAc360LeaveRequest } from '@/lib/ac360/school-hr'

type DatabaseClient = Awaited<ReturnType<typeof createClient>>
type PortalKind = 'teacher'|'parent'|'student'|'staff'
type Row = Record<string, unknown>

function str(value: unknown, fallback='') { const valueText=String(value ?? '').trim(); return valueText||fallback }
function required(value: unknown, label: string) { const v=str(value); if(!v) throw new Error(`${label} requis.`); return v }
function isoDate(value: unknown, label: string) { const v=required(value,label); if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`${label} invalide.`); return v }
function numberValue(value: unknown, label: string, min?: number, max?: number) { const n=Number(value); if(!Number.isFinite(n)||(min!=null&&n<min)||(max!=null&&n>max)) throw new Error(`${label} invalide.`); return n }
function nowIso(){return new Date().toISOString()}

async function enqueueInternalPortalNotifications(client:DatabaseClient,input:{schoolId:string;eventKey:string;recipientType:'student'|'parent'|'staff'|'app_user';recipientIds:string[];title:string;body:string;actionHref?:string|null;correlationId:string;payload?:Row}){
  const recipientIds=[...new Set(input.recipientIds.map((value)=>str(value)).filter(Boolean))]
  if(!recipientIds.length)return [] as string[]
  const rows=recipientIds.map((recipientId)=>({school_id:input.schoolId,event_key:input.eventKey,recipient_type:input.recipientType,recipient_id:input.recipientType==='app_user'?null:recipientId,recipient_app_user_id:input.recipientType==='app_user'?recipientId:null,channel:'internal',subject:input.title,body:input.body,payload_json:{...(input.payload||{}),source:'role_portal',action_href:input.actionHref||null},state:'queued',correlation_id:input.correlationId}))
  const result=await client.from('angelcare360_notification_outbox').insert(rows).select('id')
  if(result.error)throw new Error(`Conséquence de notification non enregistrée: ${result.error.message}`)
  return (result.data||[]).map((row)=>str(row.id)).filter(Boolean)
}
async function discardPortalNotifications(client:DatabaseClient,schoolId:string,correlationId:string){
  const result=await client.from('angelcare360_notification_outbox').delete().eq('school_id',schoolId).eq('correlation_id',correlationId).eq('channel','internal').eq('state','queued')
  if(result.error)throw new Error(`Compensation des notifications impossible: ${result.error.message}`)
}

async function effectivePermission(client:DatabaseClient,schoolId:string,appUserId:string,candidates:string[],label:string){
  const permissions=await portalPermissionSet(client,schoolId,appUserId)
  const chosen=candidates.find((key)=>permissions.has(key))
  if(!chosen) throw new Error(`Votre rôle actif ne permet pas ${label}. Autorisation attendue : ${candidates.join(' ou ')}.`)
  return chosen
}

async function exactTeacherAssignment(client:DatabaseClient,schoolId:string,staffId:string,teacherAssignmentId:string){
  const {data,error}=await client.from('angelcare360_teacher_assignments')
    .select('id,academic_year_id,staff_id,class_id,section_id,subject_id,assignment_role,status')
    .eq('school_id',schoolId).eq('staff_id',staffId).eq('id',teacherAssignmentId).eq('status','active').limit(1).maybeSingle()
  if(error) throw new Error(error.message)
  if(!data) throw new Error('Affectation pédagogique introuvable ou hors de votre périmètre.')
  return data
}

async function assertStudentInTeacherAssignment(client:DatabaseClient,schoolId:string,studentId:string,assignment:Row){
  let query=client.from('angelcare360_class_enrollments').select('id,student_id,class_id,section_id,status').eq('school_id',schoolId).eq('student_id',studentId).eq('class_id',str(assignment.class_id)).eq('status','active')
  if(assignment.section_id) query=query.eq('section_id',str(assignment.section_id))
  const {data,error}=await query.limit(1).maybeSingle()
  if(error) throw new Error(error.message)
  if(!data) throw new Error('Élève hors de votre classe ou section autorisée.')
  return data
}

async function resolveStaffProfile(client:DatabaseClient,school:Record<string, unknown>,staff:Record<string, unknown>){
  const schoolId=String(school.id); const code=str(school.school_code)
  let org:Record<string, unknown>|null=null
  const direct=await client.from('ac360_organizations').select('id,org_code').eq('id',schoolId).limit(1).maybeSingle()
  if(direct.error) throw new Error(direct.error.message)
  if(direct.data) org=direct.data
  if(!org&&code){
    const byCode=await client.from('ac360_organizations').select('id,org_code').eq('org_code',code).limit(2)
    if(byCode.error) throw new Error(byCode.error.message)
    const rows=byCode.data??[]; if(rows.length===1&&rows[0]) org=rows[0]
  }
  if(!org) throw new Error('Profil opérationnel Staff OS non relié à cet établissement.')
  const profile=await client.from('ac360_school_staff_profiles').select('id,staff_code,status').eq('org_id',org.id).eq('staff_code',str(staff.staff_code)).eq('status','active').limit(2)
  if(profile.error) throw new Error(profile.error.message)
  if((profile.data||[]).length!==1) throw new Error('Profil opérationnel Staff OS ambigu ou absent.')
  return {orgId:String(org.id),profileId:String(profile.data![0].id)}
}

async function familyIdFor(client:DatabaseClient,schoolId:string,parentId:string,studentId:string){
  const [parentMemberships,studentMemberships]=await Promise.all([
    client.from('angelcare360_area11_family_memberships').select('family_id,person_id,member_type,status').eq('school_id',schoolId).eq('person_id',parentId).eq('status','active'),
    client.from('angelcare360_area11_family_memberships').select('family_id,student_id,member_type,status').eq('school_id',schoolId).eq('student_id',studentId).eq('status','active'),
  ])
  if(parentMemberships.error) throw new Error(parentMemberships.error.message)
  if(studentMemberships.error) throw new Error(studentMemberships.error.message)
  const parentFamilyIds=new Set((parentMemberships.data||[]).map((row)=>str(row.family_id)).filter(Boolean))
  const ids=[...new Set((studentMemberships.data||[]).map((row)=>str(row.family_id)).filter((id)=>Boolean(id)&&parentFamilyIds.has(id)))]
  if(ids.length>1) throw new Error('Plusieurs foyers actifs correspondent à cette relation. Une régularisation Famille 360 est requise.')
  return ids[0]||null
}

async function assertPickupCandidate(client:DatabaseClient,schoolId:string,parentId:string,studentId:string,authorizedPersonId:string){
  await requireParentChildCapability(client,schoolId,parentId,studentId,'pickup')
  const familyId=await familyIdFor(client,schoolId,parentId,studentId)
  if(familyId){
    const {data,error}=await client.from('angelcare360_area11_family_memberships').select('id,person_id,family_id,status').eq('school_id',schoolId).eq('family_id',familyId).eq('person_id',authorizedPersonId).eq('status','active').limit(1).maybeSingle()
    if(error) throw new Error(error.message)
    if(!data) throw new Error('La personne autorisée doit appartenir au même foyer Famille 360.')
  }else{
    const {data,error}=await client.from('angelcare360_student_parent_links').select('id,parent_id,status').eq('school_id',schoolId).eq('student_id',studentId).eq('parent_id',authorizedPersonId).eq('status','active').limit(1).maybeSingle()
    if(error) throw new Error(error.message)
    if(!data) throw new Error('La personne autorisée doit être un responsable actif de cet enfant.')
  }
  const {data:person,error:personError}=await client.from('angelcare360_parents').select('id,full_name,status').eq('school_id',schoolId).eq('id',authorizedPersonId).eq('status','active').limit(1).maybeSingle()
  if(personError) throw new Error(personError.message)
  if(!person) throw new Error('Responsable autorisé introuvable ou inactif.')
  return {familyId,person}
}

async function insertConversationMessage(client:DatabaseClient,input:{schoolId:string;senderAppUserId:string;senderRole:string;subject:string;body:string;recipientAppUserIds?:string[];recipientStudentIds?:string[];recipientParentIds?:string[];recipientStaffIds?:string[];participantStudentIds?:string[];participantParentIds?:string[];participantStaffIds?:string[];conversationId?:string|null}){
  const schoolId=input.schoolId
  let conversationId=str(input.conversationId)
  let createdConversation=false
  let messageId:string|null=null
  try{
    if(!conversationId){
      const {data,error}=await client.from('angelcare360_conversations').insert({school_id:schoolId,conversation_code:`PORTAL-${randomUUID().slice(0,10).toUpperCase()}`,subject:input.subject,conversation_type:'internal',status:'open',metadata_json:{source:'role_portal'}}).select('id').single()
      if(error||!data) throw new Error(error?.message||'Conversation impossible.')
      conversationId=String(data.id); createdConversation=true
      const participants=[
        {school_id:schoolId,conversation_id:conversationId,participant_app_user_id:input.senderAppUserId,participant_role:input.senderRole,status:'active'},
        ...(input.recipientAppUserIds||[]).map((id)=>({school_id:schoolId,conversation_id:conversationId,participant_app_user_id:id,participant_role:'app_user',status:'active'})),
        ...(input.participantStudentIds||[]).map((id)=>({school_id:schoolId,conversation_id:conversationId,participant_student_id:id,participant_role:'student',status:'active'})),
        ...(input.participantParentIds||[]).map((id)=>({school_id:schoolId,conversation_id:conversationId,participant_parent_id:id,participant_role:'parent',status:'active'})),
        ...(input.participantStaffIds||[]).map((id)=>({school_id:schoolId,conversation_id:conversationId,participant_staff_id:id,participant_role:'staff',status:'active'})),
      ]
      if(participants.length){const result=await client.from('angelcare360_conversation_participants').insert(participants);if(result.error) throw new Error(result.error.message)}
    }
    const {data:message,error}=await client.from('angelcare360_messages').insert({school_id:schoolId,conversation_id:conversationId,message_code:`MSG-${randomUUID().slice(0,10).toUpperCase()}`,sender_app_user_id:input.senderAppUserId,sender_role:input.senderRole,subject:input.subject,body:input.body,message_type:'internal',sent_at:nowIso(),status:'sent_internal',metadata_json:{source:'role_portal'}}).select('id').single()
    if(error||!message) throw new Error(error?.message||'Envoi du message impossible.')
    messageId=String(message.id)
    const recipients=[
      ...(input.recipientAppUserIds||[]).map((id)=>({school_id:schoolId,message_id:message.id,recipient_app_user_id:id,delivery_status:'delivered_internal',status:'active'})),
      ...(input.recipientStudentIds||[]).map((id)=>({school_id:schoolId,message_id:message.id,recipient_student_id:id,delivery_status:'delivered_internal',status:'active'})),
      ...(input.recipientParentIds||[]).map((id)=>({school_id:schoolId,message_id:message.id,recipient_parent_id:id,delivery_status:'delivered_internal',status:'active'})),
      ...(input.recipientStaffIds||[]).map((id)=>({school_id:schoolId,message_id:message.id,recipient_staff_id:id,delivery_status:'delivered_internal',status:'active'})),
    ]
    if(!recipients.length) throw new Error('Aucun destinataire autorisé n’a été résolu.')
    const recipientResult=await client.from('angelcare360_message_recipients').insert(recipients)
    if(recipientResult.error) throw new Error(recipientResult.error.message)
    const update=await client.from('angelcare360_conversations').update({last_message_at:nowIso(),status:'open'}).eq('school_id',schoolId).eq('id',conversationId)
    if(update.error) throw new Error(update.error.message)
    return {conversationId,messageId}
  }catch(error){
    if(messageId){
      await client.from('angelcare360_message_recipients').delete().eq('school_id',schoolId).eq('message_id',messageId)
      await client.from('angelcare360_messages').delete().eq('school_id',schoolId).eq('id',messageId)
    }
    if(createdConversation&&conversationId){
      await client.from('angelcare360_conversation_participants').delete().eq('school_id',schoolId).eq('conversation_id',conversationId)
      await client.from('angelcare360_conversations').delete().eq('school_id',schoolId).eq('id',conversationId)
    }
    throw error
  }
}

async function updateStaffTaskPreservingMetadata(client:DatabaseClient,input:{orgId:string;profileId:string;taskId:string;status:string;source:string;correlationId:string}){
  const before=await client.from('ac360_school_tasks').select('id,status,metadata_json').eq('org_id',input.orgId).eq('id',input.taskId).eq('assigned_staff_id',input.profileId).limit(1).maybeSingle()
  if(before.error||!before.data) throw new Error(before.error?.message||'Tâche hors de votre périmètre.')
  const existing=before.data.metadata_json&&typeof before.data.metadata_json==='object'&&!Array.isArray(before.data.metadata_json)?before.data.metadata_json as Row:{}
  const {data,error}=await client.from('ac360_school_tasks').update({status:input.status,metadata_json:{...existing,source:input.source,correlation_id:input.correlationId,portal_previous_status:before.data.status,portal_updated_at:nowIso()}}).eq('org_id',input.orgId).eq('id',input.taskId).eq('assigned_staff_id',input.profileId).select('id,status').maybeSingle()
  if(error||!data) throw new Error(error?.message||'Tâche hors de votre périmètre.')
  return data
}

async function mergeScopedMetadata(client:DatabaseClient,table:string,schoolId:string,id:string,column:'metadata'|'metadata_json',patch:Row,extraPatch:Row={}){
  const before=await client.from(table).select(`id,${column}`).eq('school_id',schoolId).eq('id',id).limit(1).maybeSingle()
  if(before.error||!before.data) throw new Error(before.error?.message||'Objet introuvable.')
  const current=(before.data as Row)[column]
  const existing=current&&typeof current==='object'&&!Array.isArray(current)?current as Row:{}
  return {...extraPatch,[column]:{...existing,...patch}}
}

async function assertReceivedMessage(client:DatabaseClient,schoolId:string,kind:PortalKind,personId:string,appUserId:string,messageId:string){
  let query=client.from('angelcare360_message_recipients').select('id,message_id,recipient_app_user_id,recipient_student_id,recipient_parent_id,recipient_staff_id,status').eq('school_id',schoolId).eq('message_id',messageId).eq('status','active')
  if(kind==='teacher'||kind==='staff') query=query.or(`recipient_staff_id.eq.${personId},recipient_app_user_id.eq.${appUserId}`)
  else if(kind==='parent') query=query.or(`recipient_parent_id.eq.${personId},recipient_app_user_id.eq.${appUserId}`)
  else query=query.or(`recipient_student_id.eq.${personId},recipient_app_user_id.eq.${appUserId}`)
  const recipient=await query.limit(1).maybeSingle()
  if(recipient.error) throw new Error(recipient.error.message)
  if(!recipient.data) throw new Error('Ce message ne fait pas partie de votre boîte de réception autorisée.')
  const original=await client.from('angelcare360_messages').select('id,conversation_id,sender_app_user_id,subject').eq('school_id',schoolId).eq('id',messageId).limit(1).maybeSingle()
  if(original.error||!original.data) throw new Error('Message source introuvable.')
  if(!original.data.sender_app_user_id) throw new Error('Ce message système ne peut pas recevoir de réponse directe.')
  return original.data
}

async function requestStaffLeave(client:DatabaseClient,identity:Awaited<ReturnType<typeof requirePortalIdentity>>,input:Record<string,unknown>,correlationId:string){
  const startsOn=isoDate(input.startsOn,'Début'); const endsOn=isoDate(input.endsOn,'Fin'); if(endsOn<startsOn) throw new Error('La fin du congé précède son début.')
  const reason=required(input.reason,'Motif'); const advanced=await resolveStaffProfile(client,identity.school,identity.person);const policyId=required(input.policyId,'Politique de congé')
  const policy=await client.from('ac360_school_leave_policies').select('id,leave_type,status').eq('org_id',advanced.orgId).eq('id',policyId).eq('status','active').limit(1).maybeSingle()
  if(policy.error||!policy.data) throw new Error('La politique de congé sélectionnée est indisponible ou hors de votre organisation.')
  const result=await createAc360LeaveRequest({orgId:advanced.orgId,staffProfileId:advanced.profileId,policyId:policy.data.id,leaveType:policy.data.leave_type||'authorized_absence',startsOn,endsOn,reason,idempotencyKey:`role-portal-leave:${correlationId}`,metadata:{source:'role_portal',portal_kind:identity.kind,school_id:String(identity.school.id),correlation_id:correlationId}})
  if(!result||result.ok!==true) throw new Error(String((result as {error?:unknown})?.error||'La demande de congé n’a pas pu entrer dans le workflow RH.'))
  return (result as {data?:unknown}).data??result
}

export async function executePortalAction(input:Record<string,unknown>){
  const kind=required(input.kind,'Portail') as PortalKind
  const action=required(input.action,'Action')
  const identity=await requirePortalIdentity(kind)
  const schoolId=String(identity.school.id), appUserId=String(identity.appUser.id), personId=String(identity.person.id)
  const client=await createClient(); const idempotencyKey=str(input.idempotencyKey)||`${kind}:${action}:${randomUUID()}`

  if(kind==='teacher'&&action==='assignment.create'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation'); const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId)
    const permission=await effectivePermission(client,schoolId,appUserId,['academics.create','academics.update'],'publier un devoir')
    const title=required(input.title,'Titre');const dueOn=isoDate(input.dueOn,'Échéance');const maxScore=numberValue(input.maxScore||20,'Barème',1,1000)
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.assignment.create',idempotencyKey,permission,schoolId,resourceType:'angelcare360_assignments',request:{teacherAssignmentId,title,dueOn},execute:async({client,userId,correlationId})=>{
      let enrollmentQuery=client.from('angelcare360_class_enrollments').select('student_id').eq('school_id',schoolId).eq('class_id',assignment.class_id).eq('status','active')
      if(assignment.section_id)enrollmentQuery=enrollmentQuery.eq('section_id',assignment.section_id)
      const enrollments=await enrollmentQuery;if(enrollments.error)throw new Error(enrollments.error.message)
      const studentIds=(enrollments.data||[]).map((row)=>str(row.student_id)).filter(Boolean)
      await enqueueInternalPortalNotifications(client,{schoolId,eventKey:'assignment.published',recipientType:'student',recipientIds:studentIds,title:'Nouveau devoir publié',body:`${title} · échéance ${dueOn}`,actionHref:'/angelcare-360-student/devoirs',correlationId,payload:{teacher_assignment_id:teacherAssignmentId,due_on:dueOn}})
      const {data,error}=await client.from('angelcare360_assignments').insert({school_id:schoolId,academic_year_id:assignment.academic_year_id,class_id:assignment.class_id,section_id:assignment.section_id||null,subject_id:assignment.subject_id,created_by_staff_id:personId,assignment_code:`T-${randomUUID().slice(0,8).toUpperCase()}`,title,description:str(input.description)||null,due_on:dueOn,max_score:maxScore,status:'published',metadata_json:{created_from:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId,created_by_app_user_id:userId}}).select('id,assignment_code,title,status,due_on').single()
      if(error){await discardPortalNotifications(client,schoolId,correlationId);throw new Error(error.message)}
      return data
    }})
  }

  if(kind==='teacher'&&action==='attendance.batch'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId)
    const sessionDate=isoDate(input.sessionDate,'Date');const rawRecords=Array.isArray(input.records)?input.records:[]
    if(!rawRecords.length)throw new Error('Le registre de présence est vide.');if(rawRecords.length>120)throw new Error('Le registre dépasse la capacité autorisée pour une session.')
    const normalized=rawRecords.map((value,index)=>{const row=value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{};const studentId=required(row.studentId,`Élève ${index+1}`);const attendanceStatus=required(row.attendanceStatus,`Statut ${index+1}`);if(!['present','absent','late','excused'].includes(attendanceStatus))throw new Error(`Statut de présence invalide pour l’élève ${index+1}.`);const minutesLate=attendanceStatus==='late'?numberValue(row.minutesLate||0,'Retard',0,1440):0;return{studentId,attendanceStatus,minutesLate,note:str(row.note)||null}})
    const ids=normalized.map((row)=>row.studentId);if(new Set(ids).size!==ids.length)throw new Error('Un élève apparaît plusieurs fois dans le registre.')
    let enrollmentQuery=client.from('angelcare360_class_enrollments').select('id,student_id,class_id,section_id,status').eq('school_id',schoolId).eq('class_id',str(assignment.class_id)).eq('status','active').in('student_id',ids)
    if(assignment.section_id)enrollmentQuery=enrollmentQuery.eq('section_id',str(assignment.section_id))
    const enrollments=await enrollmentQuery;if(enrollments.error)throw new Error(enrollments.error.message);const authorized=new Set((enrollments.data||[]).map((row)=>str(row.student_id)));const unauthorized=ids.filter((id)=>!authorized.has(id));if(unauthorized.length)throw new Error('Le registre contient un élève hors de votre classe ou section autorisée.')
    const permission=await effectivePermission(client,schoolId,appUserId,['presences.update','attendance.update'],'enregistrer les présences')
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.attendance.batch',idempotencyKey,permission,schoolId,resourceType:'angelcare360_attendance_records',request:{teacherAssignmentId,sessionDate,count:normalized.length},execute:async({client,correlationId})=>{
      const sessionKey=`teacher:${teacherAssignmentId}`
      let session=await client.from('angelcare360_attendance_sessions').select('id,status,total_expected,total_present,total_absent,total_late').eq('school_id',schoolId).eq('academic_year_id',assignment.academic_year_id).eq('class_id',assignment.class_id).eq('session_date',sessionDate).eq('session_key',sessionKey).limit(1).maybeSingle()
      if(session.error)throw new Error(session.error.message)
      let createdSession=false
      if(!session.data){const created=await client.from('angelcare360_attendance_sessions').insert({school_id:schoolId,academic_year_id:assignment.academic_year_id,class_id:assignment.class_id,section_id:assignment.section_id||null,session_date:sessionDate,session_key:sessionKey,status:'open',opened_by:appUserId,opened_at:nowIso(),metadata_json:{source:'teacher_portal_batch',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}).select('id,status,total_expected,total_present,total_absent,total_late').single();if(created.error||!created.data)throw new Error(created.error?.message||'Session de présence impossible.');session={data:created.data,error:null} as typeof session;createdSession=true}
      if(['closed','finalized','locked'].includes(str(session.data?.status).toLowerCase()))throw new Error('La session de présence est clôturée.')
      const previous=await client.from('angelcare360_attendance_records').select('id,student_id,attendance_status,minutes_late,note,justification_required,status,metadata_json').eq('school_id',schoolId).eq('attendance_session_id',session.data!.id).in('student_id',ids);if(previous.error)throw new Error(previous.error.message)
      const beforeMap=new Map((previous.data||[]).map((row)=>[str(row.student_id),row as Row]));const historyIds:string[]=[]
      const restore=async()=>{await discardPortalNotifications(client,schoolId,correlationId);if(historyIds.length)await client.from('angelcare360_attendance_status_history').delete().in('id',historyIds);for(const row of normalized){const before=beforeMap.get(row.studentId);if(before){await client.from('angelcare360_attendance_records').update({attendance_status:before.attendance_status,minutes_late:before.minutes_late,note:before.note,justification_required:before.justification_required,status:before.status,metadata_json:before.metadata_json}).eq('school_id',schoolId).eq('id',before.id)}else{await client.from('angelcare360_attendance_records').delete().eq('school_id',schoolId).eq('attendance_session_id',session.data!.id).eq('student_id',row.studentId)}}if(createdSession){await client.from('angelcare360_attendance_sessions').delete().eq('school_id',schoolId).eq('id',session.data!.id)}else{await client.from('angelcare360_attendance_sessions').update({total_expected:session.data?.total_expected,total_present:session.data?.total_present,total_absent:session.data?.total_absent,total_late:session.data?.total_late}).eq('school_id',schoolId).eq('id',session.data!.id)}}
      try{
        const alertStudentIds=normalized.filter((row)=>['absent','late'].includes(row.attendanceStatus)).map((row)=>row.studentId)
        if(alertStudentIds.length){const links=await client.from('angelcare360_student_parent_links').select('parent_id,student_id').eq('school_id',schoolId).eq('status','active').eq('can_receive_messages',true).in('student_id',alertStudentIds);if(links.error)throw new Error(links.error.message);const parentIds=[...new Set((links.data||[]).map((row)=>str(row.parent_id)).filter(Boolean))];await enqueueInternalPortalNotifications(client,{schoolId,eventKey:'attendance.alert',recipientType:'parent',recipientIds:parentIds,title:'Présence à vérifier',body:'Une absence ou un retard vient d’être enregistré pour votre enfant.',actionHref:'/angelcare-360-parent/presences',correlationId,payload:{student_ids:alertStudentIds,session_date:sessionDate}})}
        for(const row of normalized){const before=beforeMap.get(row.studentId);const existingMeta=before?.metadata_json&&typeof before.metadata_json==='object'&&!Array.isArray(before.metadata_json)?before.metadata_json as Row:{};const payload={school_id:schoolId,attendance_session_id:session.data!.id,student_id:row.studentId,attendance_status:row.attendanceStatus,minutes_late:row.minutesLate||null,note:row.note,justification_required:['absent','late'].includes(row.attendanceStatus),status:'active',metadata_json:{...existingMeta,source:'teacher_portal_batch',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}};const result=await client.from('angelcare360_attendance_records').upsert(payload,{onConflict:'attendance_session_id,student_id'}).select('id,attendance_status').single();if(result.error||!result.data)throw new Error(result.error?.message||'Présence non enregistrée.');const history=await client.from('angelcare360_attendance_status_history').insert({school_id:schoolId,attendance_record_id:result.data.id,from_status:before?.attendance_status||null,to_status:row.attendanceStatus,changed_by:appUserId,changed_at:nowIso(),note:row.note,metadata_json:{source:'teacher_portal_batch',correlation_id:correlationId}}).select('id').single();if(history.error||!history.data)throw new Error(history.error?.message||'Historique de présence non enregistré.');historyIds.push(str(history.data.id))}
        const finalRows=await client.from('angelcare360_attendance_records').select('attendance_status').eq('school_id',schoolId).eq('attendance_session_id',session.data!.id).eq('status','active');if(finalRows.error)throw new Error(finalRows.error.message);const statuses=(finalRows.data||[]).map((row)=>str(row.attendance_status));const totals={total_expected:statuses.length,total_present:statuses.filter((status)=>status==='present').length,total_absent:statuses.filter((status)=>status==='absent').length,total_late:statuses.filter((status)=>status==='late').length};const sessionUpdate=await client.from('angelcare360_attendance_sessions').update(totals).eq('school_id',schoolId).eq('id',session.data!.id);if(sessionUpdate.error)throw new Error(sessionUpdate.error.message)
        return{sessionId:str(session.data!.id),updated:normalized.length,...totals}
      }catch(error){await restore();throw error}
    }})
  }

  if(kind==='teacher'&&action==='attendance.mark'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation'); const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId)
    const studentId=required(input.studentId,'Élève'); await assertStudentInTeacherAssignment(client,schoolId,studentId,assignment)
    const permission=await effectivePermission(client,schoolId,appUserId,['presences.update','attendance.update'],'enregistrer les présences')
    const sessionDate=isoDate(input.sessionDate,'Date'); const attendanceStatus=required(input.attendanceStatus,'Statut')
    if(!['present','absent','late','excused','justified'].includes(attendanceStatus)) throw new Error('Statut de présence invalide.')
    const minutesLate=attendanceStatus==='late'?numberValue(input.minutesLate||0,'Retard',0,1440):0
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.attendance.mark',idempotencyKey,permission,schoolId,resourceType:'angelcare360_attendance_records',request:{teacherAssignmentId,studentId,sessionDate,attendanceStatus},execute:async({client,correlationId})=>{
      const sessionKey=`teacher:${teacherAssignmentId}`
      let session=await client.from('angelcare360_attendance_sessions').select('id,status').eq('school_id',schoolId).eq('academic_year_id',assignment.academic_year_id).eq('class_id',assignment.class_id).eq('session_date',sessionDate).eq('session_key',sessionKey).limit(1).maybeSingle()
      if(session.error) throw new Error(session.error.message)
      let createdSession=false
      if(!session.data){
        const created=await client.from('angelcare360_attendance_sessions').insert({school_id:schoolId,academic_year_id:assignment.academic_year_id,class_id:assignment.class_id,section_id:assignment.section_id||null,session_date:sessionDate,session_key:sessionKey,status:'open',opened_by:appUserId,opened_at:nowIso(),metadata_json:{source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}).select('id,status').single()
        if(created.error) throw new Error(created.error.message);session={data:created.data,error:null} as typeof session;createdSession=true
      }
      if(['closed','finalized','locked'].includes(str(session.data?.status).toLowerCase())) throw new Error('La session de présence est clôturée.')
      const before=await client.from('angelcare360_attendance_records').select('id,attendance_status,minutes_late,note,justification_required,status,metadata_json').eq('school_id',schoolId).eq('attendance_session_id',session.data!.id).eq('student_id',studentId).limit(1).maybeSingle();if(before.error) throw new Error(before.error.message)
      if(['absent','late'].includes(attendanceStatus)){const links=await client.from('angelcare360_student_parent_links').select('parent_id').eq('school_id',schoolId).eq('student_id',studentId).eq('status','active').eq('can_receive_messages',true);if(links.error)throw new Error(links.error.message);await enqueueInternalPortalNotifications(client,{schoolId,eventKey:'attendance.alert',recipientType:'parent',recipientIds:(links.data||[]).map((row)=>str(row.parent_id)).filter(Boolean),title:'Présence à vérifier',body:'Une absence ou un retard vient d’être enregistré pour votre enfant.',actionHref:'/angelcare-360-parent/presences',correlationId,payload:{student_id:studentId,session_date:sessionDate,attendance_status:attendanceStatus}})}
      const payload={school_id:schoolId,attendance_session_id:session.data!.id,student_id:studentId,attendance_status:attendanceStatus,minutes_late:minutesLate||null,note:str(input.note)||null,justification_required:['absent','late'].includes(attendanceStatus),status:'active',metadata_json:{...(before.data?.metadata_json&&typeof before.data.metadata_json==='object'&&!Array.isArray(before.data.metadata_json)?before.data.metadata_json:{}),source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}
      const result=await client.from('angelcare360_attendance_records').upsert(payload,{onConflict:'attendance_session_id,student_id'}).select('id,attendance_status').single()
      if(result.error){await discardPortalNotifications(client,schoolId,correlationId);if(createdSession)await client.from('angelcare360_attendance_sessions').delete().eq('school_id',schoolId).eq('id',session.data!.id);throw new Error(result.error.message)}
      const history=await client.from('angelcare360_attendance_status_history').insert({school_id:schoolId,attendance_record_id:result.data.id,from_status:before.data?.attendance_status||null,to_status:attendanceStatus,changed_by:appUserId,changed_at:nowIso(),note:str(input.note)||null,metadata_json:{source:'teacher_portal',correlation_id:correlationId}})
      if(history.error){
        if(before.data){await client.from('angelcare360_attendance_records').update({attendance_status:before.data.attendance_status,minutes_late:before.data.minutes_late,note:before.data.note,justification_required:before.data.justification_required,status:before.data.status,metadata_json:before.data.metadata_json}).eq('school_id',schoolId).eq('id',before.data.id)}else{await client.from('angelcare360_attendance_records').delete().eq('school_id',schoolId).eq('id',result.data.id)}
        await discardPortalNotifications(client,schoolId,correlationId)
        if(createdSession)await client.from('angelcare360_attendance_sessions').delete().eq('school_id',schoolId).eq('id',session.data!.id)
        throw new Error(history.error.message)
      }
      return result.data
    }})
  }

  if(kind==='teacher'&&action==='lesson.create'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId);const permission=await effectivePermission(client,schoolId,appUserId,['academics.create','academics.update'],'enregistrer un cours');const lessonDate=isoDate(input.lessonDate,'Date');const topic=required(input.topic,'Sujet')
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.lesson.create',idempotencyKey,permission,schoolId,resourceType:'angelcare360_lessons',request:{teacherAssignmentId,lessonDate,topic},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_lessons').insert({school_id:schoolId,academic_year_id:assignment.academic_year_id,class_id:assignment.class_id,section_id:assignment.section_id||null,subject_id:assignment.subject_id,staff_id:personId,lesson_code:`LES-${randomUUID().slice(0,8).toUpperCase()}`,lesson_date:lessonDate,topic,objectives:str(input.objectives)||null,homework_summary:str(input.homeworkSummary)||null,status:'published',metadata_json:{source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}).select('id,lesson_code,topic,status').single();if(error)throw new Error(error.message);return data}})
  }


  if(kind==='teacher'&&action==='lesson.update'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId);const lessonId=required(input.lessonId,'Cours');const permission=await effectivePermission(client,schoolId,appUserId,['academics.update'],'modifier un cours')
    const existing=await client.from('angelcare360_lessons').select('id,class_id,section_id,subject_id,staff_id,status').eq('school_id',schoolId).eq('id',lessonId).eq('staff_id',personId).eq('class_id',assignment.class_id).eq('subject_id',assignment.subject_id).limit(1).maybeSingle();if(existing.error||!existing.data)throw new Error('Cours hors de votre affectation.');if(assignment.section_id&&str(existing.data.section_id)!==str(assignment.section_id))throw new Error('Cours hors de votre section.')
    const patch:Row={};if(str(input.topic))patch.topic=str(input.topic);if(str(input.lessonDate))patch.lesson_date=isoDate(input.lessonDate,'Date');if(input.objectives!==undefined)patch.objectives=str(input.objectives)||null;if(input.homeworkSummary!==undefined)patch.homework_summary=str(input.homeworkSummary)||null
    if(!Object.keys(patch).length)throw new Error('Aucune modification de cours fournie.')
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.lesson.update',idempotencyKey,permission,schoolId,resourceType:'angelcare360_lessons',resourceId:lessonId,request:{lessonId,teacherAssignmentId},execute:async({client,correlationId})=>{const current=await client.from('angelcare360_lessons').select('metadata_json').eq('school_id',schoolId).eq('id',lessonId).limit(1).maybeSingle();if(current.error)throw new Error(current.error.message);const meta=current.data?.metadata_json&&typeof current.data.metadata_json==='object'&&!Array.isArray(current.data.metadata_json)?current.data.metadata_json as Row:{};const {data,error}=await client.from('angelcare360_lessons').update({...patch,metadata_json:{...meta,source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}).eq('school_id',schoolId).eq('id',lessonId).eq('staff_id',personId).select('id,topic,lesson_date,status').maybeSingle();if(error||!data)throw new Error(error?.message||'Cours non modifié.');return data}})
  }

  if(kind==='teacher'&&action==='assignment.update'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const scope=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId);const assignmentId=required(input.assignmentId,'Devoir');const permission=await effectivePermission(client,schoolId,appUserId,['academics.update'],'modifier un devoir')
    const existing=await client.from('angelcare360_assignments').select('id,class_id,section_id,subject_id,created_by_staff_id,status,metadata_json').eq('school_id',schoolId).eq('id',assignmentId).eq('created_by_staff_id',personId).eq('class_id',scope.class_id).eq('subject_id',scope.subject_id).limit(1).maybeSingle();if(existing.error||!existing.data)throw new Error('Devoir hors de votre affectation.');if(scope.section_id&&str(existing.data.section_id)!==str(scope.section_id))throw new Error('Devoir hors de votre section.')
    const patch:Row={};if(str(input.title))patch.title=str(input.title);if(str(input.dueOn))patch.due_on=isoDate(input.dueOn,'Échéance');if(input.description!==undefined)patch.description=str(input.description)||null;if(str(input.status)){const status=str(input.status);if(!['published','closed','cancelled'].includes(status))throw new Error('État de devoir invalide.');patch.status=status}
    if(!Object.keys(patch).length)throw new Error('Aucune modification de devoir fournie.')
    const meta=existing.data.metadata_json&&typeof existing.data.metadata_json==='object'&&!Array.isArray(existing.data.metadata_json)?existing.data.metadata_json as Row:{}
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.assignment.update',idempotencyKey,permission,schoolId,resourceType:'angelcare360_assignments',resourceId:assignmentId,request:{assignmentId,teacherAssignmentId},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_assignments').update({...patch,metadata_json:{...meta,source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}).eq('school_id',schoolId).eq('id',assignmentId).eq('created_by_staff_id',personId).select('id,title,due_on,status').maybeSingle();if(error||!data)throw new Error(error?.message||'Devoir non modifié.');return data}})
  }

  if(kind==='teacher'&&action==='exam.create'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId);const permission=await effectivePermission(client,schoolId,appUserId,['examens.create','academics.create'],'créer une évaluation');const title=required(input.title,'Titre');const scheduledOn=isoDate(input.scheduledOn,'Date');const maxScore=numberValue(input.maxScore||20,'Barème',1,1000)
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.exam.create',idempotencyKey,permission,schoolId,resourceType:'angelcare360_exams',request:{teacherAssignmentId,title,scheduledOn},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_exams').insert({school_id:schoolId,academic_year_id:assignment.academic_year_id,class_id:assignment.class_id,section_id:assignment.section_id||null,subject_id:assignment.subject_id,exam_code:`EX-${randomUUID().slice(0,8).toUpperCase()}`,title,exam_type:str(input.examType)||'assessment',scheduled_on:scheduledOn,duration_minutes:input.durationMinutes?numberValue(input.durationMinutes,'Durée',1,600):null,max_score:maxScore,status:'scheduled',metadata_json:{source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}).select('id,exam_code,title,status').single();if(error)throw new Error(error.message);return data}})
  }


  if(kind==='teacher'&&action==='exam.update'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const scope=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId);const examId=required(input.examId,'Évaluation');const permission=await effectivePermission(client,schoolId,appUserId,['examens.update','academics.update'],'modifier une évaluation')
    const existing=await client.from('angelcare360_exams').select('id,class_id,section_id,subject_id,status,metadata_json').eq('school_id',schoolId).eq('id',examId).eq('class_id',scope.class_id).eq('subject_id',scope.subject_id).limit(1).maybeSingle();if(existing.error||!existing.data)throw new Error('Évaluation hors de votre affectation.');if(scope.section_id&&str(existing.data.section_id)!==str(scope.section_id))throw new Error('Évaluation hors de votre section.')
    const patch:Row={};if(str(input.title))patch.title=str(input.title);if(str(input.scheduledOn))patch.scheduled_on=isoDate(input.scheduledOn,'Date');if(str(input.status)){const status=str(input.status);if(!['scheduled','completed','cancelled'].includes(status))throw new Error('État d’évaluation invalide.');patch.status=status}if(str(input.maxScore))patch.max_score=numberValue(input.maxScore,'Barème',1,1000)
    if(!Object.keys(patch).length)throw new Error('Aucune modification d’évaluation fournie.')
    const meta=existing.data.metadata_json&&typeof existing.data.metadata_json==='object'&&!Array.isArray(existing.data.metadata_json)?existing.data.metadata_json as Row:{}
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.exam.update',idempotencyKey,permission,schoolId,resourceType:'angelcare360_exams',resourceId:examId,request:{examId,teacherAssignmentId},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_exams').update({...patch,metadata_json:{...meta,source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}).eq('school_id',schoolId).eq('id',examId).select('id,title,scheduled_on,status').maybeSingle();if(error||!data)throw new Error(error?.message||'Évaluation non modifiée.');return data}})
  }

  if(kind==='teacher'&&action==='mark.upsert'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId);const studentId=required(input.studentId,'Élève');await assertStudentInTeacherAssignment(client,schoolId,studentId,assignment);const examId=required(input.examId,'Évaluation');const exam=await client.from('angelcare360_exams').select('id,class_id,section_id,subject_id,max_score,status').eq('school_id',schoolId).eq('id',examId).eq('class_id',assignment.class_id).eq('subject_id',assignment.subject_id).limit(1).maybeSingle();if(exam.error||!exam.data)throw new Error('Évaluation hors de votre affectation.');if(assignment.section_id&&str(exam.data.section_id)!==str(assignment.section_id))throw new Error('Évaluation hors de votre section.');const maxScore=numberValue(exam.data.max_score||20,'Barème',1,1000);const score=numberValue(input.score,'Note',0,maxScore);const permission=await effectivePermission(client,schoolId,appUserId,['academics.update','examens.update'],'enregistrer une note')
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.mark.upsert',idempotencyKey,permission,schoolId,resourceType:'angelcare360_marks',request:{teacherAssignmentId,studentId,examId,score},execute:async({client,correlationId})=>{const existing=await client.from('angelcare360_marks').select('id').eq('school_id',schoolId).eq('student_id',studentId).eq('exam_id',examId).limit(1).maybeSingle();if(existing.error)throw new Error(existing.error.message);const payload={school_id:schoolId,academic_year_id:assignment.academic_year_id,student_id:studentId,subject_id:assignment.subject_id,exam_id:examId,assignment_id:null,assessment_type:'exam',score,max_score:maxScore,grade:null,mark_state:'present',recorded_by_staff_id:personId,recorded_at:nowIso(),status:'active',metadata_json:{source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}};const result=existing.data?await client.from('angelcare360_marks').update(payload).eq('school_id',schoolId).eq('id',existing.data.id).select('id,score,max_score,mark_state').single():await client.from('angelcare360_marks').insert(payload).select('id,score,max_score,mark_state').single();if(result.error)throw new Error(result.error.message);return result.data}})
  }

  if(kind==='teacher'&&action==='submission.grade'){
    const submissionId=required(input.submissionId,'Soumission');const score=numberValue(input.score,'Score',0);const submission=await client.from('angelcare360_assignment_submissions').select('id,assignment_id,student_id').eq('school_id',schoolId).eq('id',submissionId).limit(1).maybeSingle();if(submission.error||!submission.data)throw new Error('Soumission introuvable.');const submissionRow=submission.data;const assignment=await client.from('angelcare360_assignments').select('id,class_id,section_id,subject_id,max_score,created_by_staff_id,status').eq('school_id',schoolId).eq('id',submissionRow.assignment_id).eq('created_by_staff_id',personId).limit(1).maybeSingle();if(assignment.error||!assignment.data)throw new Error('Cette soumission n’appartient pas à l’un de vos devoirs.');const assignmentRow=assignment.data;if(score>Number(assignmentRow.max_score||20))throw new Error('Le score dépasse le maximum du devoir.');const permission=await effectivePermission(client,schoolId,appUserId,['academics.update','examens.update'],'corriger une soumission')
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.submission.grade',idempotencyKey,permission,schoolId,resourceType:'angelcare360_assignment_submissions',resourceId:submissionId,request:{submissionId,score},execute:async({client,correlationId})=>{await enqueueInternalPortalNotifications(client,{schoolId,eventKey:'submission.graded',recipientType:'student',recipientIds:[str(submissionRow.student_id)],title:'Travail corrigé',body:'Un enseignant vient de corriger l’une de vos remises.',actionHref:'/angelcare-360-student/soumissions',correlationId,payload:{submission_id:submissionId}});const result=await client.rpc('angelcare360_grade_submission_atomic_v1',{p_school_id:schoolId,p_submission_id:submissionId,p_teacher_staff_id:personId,p_score:score,p_correlation_id:correlationId});if(result.error){await discardPortalNotifications(client,schoolId,correlationId);throw new Error(result.error.message)}return result.data}})
  }

  if(kind==='teacher'&&action==='comment.create'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId);const studentId=required(input.studentId,'Élève');await assertStudentInTeacherAssignment(client,schoolId,studentId,assignment);const comment=required(input.comment,'Appréciation');const permission=await effectivePermission(client,schoolId,appUserId,['academics.update'],'enregistrer une appréciation')
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.comment.create',idempotencyKey,permission,schoolId,resourceType:'angelcare360_teacher_comments',request:{teacherAssignmentId,studentId},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_teacher_comments').insert({school_id:schoolId,academic_year_id:assignment.academic_year_id,class_id:assignment.class_id,section_id:assignment.section_id||null,student_id:studentId,staff_id:personId,comment_text:comment,comment_type:'appreciation',status:'active',metadata_json:{source:'teacher_portal',teacher_assignment_id:teacherAssignmentId,correlation_id:correlationId}}).select('id').single();if(error)throw new Error(error.message);return data}})
  }

  if(kind==='teacher'&&action==='task.complete'){
    const taskId=required(input.taskId,'Tâche');const ops=await resolveStaffProfile(client,identity.school,identity.person)
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.task.complete',idempotencyKey,permission:'personnel.view',schoolId,resourceType:'ac360_school_tasks',resourceId:taskId,request:{taskId},execute:async({client,correlationId})=>updateStaffTaskPreservingMetadata(client,{orgId:ops.orgId,profileId:ops.profileId,taskId,status:'completed',source:'teacher_portal',correlationId})})
  }

  if(kind==='teacher'&&action==='leave.request'){
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.leave.request',idempotencyKey,permission:'personnel.view',schoolId,resourceType:'ac360_school_leave_requests',request:{startsOn:input.startsOn,endsOn:input.endsOn},execute:async({client,correlationId})=>requestStaffLeave(client,identity,input,correlationId)})
  }

  if(kind==='teacher'&&action==='family.message'){
    const studentId=required(input.studentId,'Élève');const body=required(input.body,'Message');const subject=str(input.subject)||'Message de l’enseignant';const teacherAssignmentId=required(input.teacherAssignmentId,'Affectation');const assignment=await exactTeacherAssignment(client,schoolId,personId,teacherAssignmentId);await assertStudentInTeacherAssignment(client,schoolId,studentId,assignment);const permission=await effectivePermission(client,schoolId,appUserId,['messagerie.create','messagerie.view'],'communiquer avec les familles');const links=await client.from('angelcare360_student_parent_links').select('parent_id,can_receive_messages,status').eq('school_id',schoolId).eq('student_id',studentId).eq('status','active').eq('can_receive_messages',true);if(links.error)throw new Error(links.error.message);const parentIds=(links.data||[]).map((row)=>str(row.parent_id)).filter(Boolean);if(!parentIds.length)throw new Error('Aucun responsable autorisé à recevoir des messages pour cet élève.')
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.family.message',idempotencyKey,permission,schoolId,resourceType:'angelcare360_messages',request:{studentId,teacherAssignmentId},execute:async({client})=>insertConversationMessage(client,{schoolId,senderAppUserId:appUserId,senderRole:'teacher',subject,body,recipientParentIds:parentIds,participantParentIds:parentIds,participantStaffIds:[personId]})})
  }

  if(action==='message.reply'){
    const messageId=required(input.messageId,'Message');const body=required(input.body,'Réponse');const original=await assertReceivedMessage(client,schoolId,kind,personId,appUserId,messageId);const permissionCandidates=kind==='teacher'?['messagerie.create','messagerie.view']:kind==='parent'?['parents.view']:kind==='student'?['eleves.view']:['personnel.view'];const permission=await effectivePermission(client,schoolId,appUserId,permissionCandidates,'répondre à ce message')
    return executeAngelcare360EnterpriseCommand({commandKey:`${kind}.message.reply`,idempotencyKey,permission,schoolId,resourceType:'angelcare360_messages',request:{messageId},execute:async({client})=>insertConversationMessage(client,{schoolId,senderAppUserId:appUserId,senderRole:kind,subject:`Re: ${str(original.subject,'Message')}`,body,recipientAppUserIds:[str(original.sender_app_user_id)],conversationId:str(original.conversation_id)||null})})
  }

  if(kind==='parent'&&action==='request.create'){
    const subject=required(input.subject,'Objet');const description=required(input.description,'Description');const related=str(input.relatedEntityType)||'operations';const priority=str(input.priority)||'medium'
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.request.create',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_reclamations',request:{subject,related,priority},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_reclamations').insert({school_id:schoolId,reclamation_code:`REQ-${randomUUID().slice(0,8).toUpperCase()}`,reporter_role:'parent',subject,description,related_entity_type:related,priority,status:'open',submitted_by_parent_id:personId,metadata_json:{source:'parent_portal',correlation_id:correlationId}}).select('id,reclamation_code,status').single();if(error)throw new Error(error.message);return data}})
  }

  if(kind==='parent'&&action==='attendance.justify'){
    const recordId=required(input.recordId,'Présence');const description=required(input.description,'Justification');const record=await client.from('angelcare360_attendance_records').select('id,student_id,attendance_status').eq('school_id',schoolId).eq('id',recordId).limit(1).maybeSingle();if(record.error||!record.data)throw new Error('Présence introuvable.');await requireParentChildCapability(client,schoolId,personId,str(record.data.student_id),'guardian')
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.attendance.justify',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_attendance_justifications',request:{recordId},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_attendance_justifications').insert({school_id:schoolId,attendance_record_id:recordId,justification_code:`JUST-${randomUUID().slice(0,8).toUpperCase()}`,reason_category:str(input.reasonCategory)||'family',description,submitted_by:appUserId,submitted_at:nowIso(),decision:'pending',status:'active',metadata_json:{source:'parent_portal',parent_id:personId,correlation_id:correlationId}}).select('id,justification_code,decision').single();if(error)throw new Error(error.message);return data}})
  }

  if(kind==='parent'&&action==='meeting.create'){
    const studentId=required(input.studentId,'Enfant');await requireParentChildCapability(client,schoolId,personId,studentId,'guardian');const scheduledAt=required(input.scheduledAt,'Date/heure');const title=str(input.title)||'Rendez-vous famille';const familyId=await familyIdFor(client,schoolId,personId,studentId)
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.meeting.create',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_area12_meetings',request:{studentId,scheduledAt},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_area12_meetings').insert({school_id:schoolId,family_id:familyId,parent_id:personId,student_id:studentId,title,description:str(input.description)||null,status:'scheduled',priority:'normal',due_at:scheduledAt,next_action:'Confirmation établissement',metadata:{source:'parent_portal',correlation_id:correlationId},created_by_user_id:appUserId}).select('id,status,due_at').single();if(error)throw new Error(error.message);return data}})
  }

  if(kind==='parent'&&action==='meeting.cancel'){
    const meetingId=required(input.meetingId,'Rendez-vous');return executeAngelcare360EnterpriseCommand({commandKey:'parent.meeting.cancel',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_area12_meetings',resourceId:meetingId,request:{meetingId},execute:async({client,correlationId})=>{const patch=await mergeScopedMetadata(client,'angelcare360_area12_meetings',schoolId,meetingId,'metadata',{source:'parent_portal',reason:str(input.reason)||null,correlation_id:correlationId},{status:'cancelled',updated_at:nowIso()});const {data,error}=await client.from('angelcare360_area12_meetings').update(patch).eq('school_id',schoolId).eq('id',meetingId).eq('parent_id',personId).select('id,status').maybeSingle();if(error||!data)throw new Error(error?.message||'Rendez-vous hors de votre périmètre.');return data}})
  }

  if(kind==='parent'&&action==='satisfaction.submit'){
    const studentId=required(input.studentId,'Enfant');await requireParentChildCapability(client,schoolId,personId,studentId,'view');const score=numberValue(input.score,'Satisfaction',1,10);const familyId=await familyIdFor(client,schoolId,personId,studentId)
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.satisfaction.submit',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_area12_satisfaction_responses',request:{studentId,score},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_area12_satisfaction_responses').insert({school_id:schoolId,family_id:familyId,parent_id:personId,student_id:studentId,title:'Satisfaction parent',description:str(input.comment)||null,status:'completed',priority:'normal',metadata:{source:'parent_portal',score,correlation_id:correlationId},created_by_user_id:appUserId}).select('id,status').single();if(error)throw new Error(error.message);return data}})
  }

  if(kind==='parent'&&action==='feedback.submit'){
    const studentId=required(input.studentId,'Enfant');await requireParentChildCapability(client,schoolId,personId,studentId,'view');const familyId=await familyIdFor(client,schoolId,personId,studentId);const body=required(input.body,'Retour')
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.feedback.submit',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_area12_feedback',request:{studentId},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_area12_feedback').insert({school_id:schoolId,family_id:familyId,parent_id:personId,student_id:studentId,title:str(input.title)||'Retour famille',description:body,status:'open',priority:'normal',metadata:{source:'parent_portal',correlation_id:correlationId},created_by_user_id:appUserId}).select('id,status').single();if(error)throw new Error(error.message);return data}})
  }

  if(kind==='parent'&&action==='pickup.request'){
    const studentId=required(input.studentId,'Enfant');const authorizedPersonId=required(input.authorizedPersonId,'Personne autorisée');const candidate=await assertPickupCandidate(client,schoolId,personId,studentId,authorizedPersonId)
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.pickup.request',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_area11_pickup_authorizations',request:{studentId,authorizedPersonId},execute:async({client,correlationId})=>{const {data,error}=await client.from('angelcare360_area11_pickup_authorizations').insert({school_id:schoolId,family_id:candidate.familyId,student_id:studentId,person_id:authorizedPersonId,authorization_type:str(input.authorizationType)||'recurring',valid_from:str(input.validFrom)||nowIso(),valid_until:str(input.validUntil)||null,verification_requirement:'identity_check',status:'pending',created_by_user_id:appUserId,metadata_json:{source:'parent_portal',requested_by_parent_id:personId,authorized_person_label:str(candidate.person.full_name),correlation_id:correlationId}}).select('id,status,student_id,person_id').single();if(error)throw new Error(error.message);return data}})
  }

  if(kind==='parent'&&action==='pickup.revoke'){
    const authorizationId=required(input.authorizationId,'Autorisation');const existing=await client.from('angelcare360_area11_pickup_authorizations').select('id,student_id,person_id,status').eq('school_id',schoolId).eq('id',authorizationId).limit(1).maybeSingle();if(existing.error||!existing.data)throw new Error(existing.error?.message||'Autorisation introuvable.');await requireParentChildCapability(client,schoolId,personId,str(existing.data.student_id),'pickup')
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.pickup.revoke',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_area11_pickup_authorizations',resourceId:authorizationId,request:{authorizationId,studentId:existing.data.student_id},execute:async({client,correlationId})=>{const patch=await mergeScopedMetadata(client,'angelcare360_area11_pickup_authorizations',schoolId,authorizationId,'metadata_json',{source:'parent_portal',revoked_by_parent_id:personId,correlation_id:correlationId},{status:'revoked',revoked_at:nowIso()});const {data,error}=await client.from('angelcare360_area11_pickup_authorizations').update(patch).eq('school_id',schoolId).eq('id',authorizationId).select('id,status,student_id,person_id').maybeSingle();if(error||!data)throw new Error(error?.message||'Autorisation hors de votre périmètre.');return data}})
  }

  if(kind==='parent'&&action==='teacher.message'){
    const studentId=required(input.studentId,'Enfant');await requireParentChildCapability(client,schoolId,personId,studentId,'messages');const teacherAssignmentId=required(input.teacherAssignmentId,'Enseignant');const student=await client.from('angelcare360_students').select('id,current_class_id,current_section_id').eq('school_id',schoolId).eq('id',studentId).limit(1).maybeSingle();if(student.error||!student.data)throw new Error('Enfant introuvable.');const studentRow=student.data;const teacher=await client.from('angelcare360_teacher_assignments').select('id,staff_id,class_id,section_id,status').eq('school_id',schoolId).eq('id',teacherAssignmentId).eq('class_id',studentRow.current_class_id).eq('status','active').limit(1).maybeSingle();if(teacher.error||!teacher.data)throw new Error('Enseignant hors du périmètre de cet enfant.');const teacherRow=teacher.data;if(teacherRow.section_id&&str(teacherRow.section_id)!==str(studentRow.current_section_id))throw new Error('Enseignant hors de la section de cet enfant.');const body=required(input.body,'Message');const subject=str(input.subject)||'Message famille'
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.teacher.message',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_messages',request:{studentId,teacherAssignmentId},execute:async({client})=>insertConversationMessage(client,{schoolId,senderAppUserId:appUserId,senderRole:'parent',subject,body,recipientStaffIds:[str(teacherRow.staff_id)],participantParentIds:[personId],participantStaffIds:[str(teacherRow.staff_id)]})})
  }


  if(kind==='parent'&&action==='account.update'){
    const phone=str(input.phone)||null,whatsapp=str(input.whatsapp)||null,address=str(input.address)||null,preferredLanguage=str(input.preferredLanguage)||'fr';if(!['fr','en','ar'].includes(preferredLanguage))throw new Error('Langue de préférence invalide.')
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.account.update',idempotencyKey,permission:'parents.view',schoolId,resourceType:'angelcare360_parents',resourceId:personId,request:{phone,whatsapp,address,preferredLanguage},execute:async({client})=>{const {data,error}=await client.from('angelcare360_parents').update({phone,whatsapp,address,preferred_language:preferredLanguage}).eq('school_id',schoolId).eq('id',personId).eq('status','active').select('id,phone,whatsapp,address,preferred_language').maybeSingle();if(error||!data)throw new Error(error?.message||'Compte famille non modifié.');return data}})
  }

  if(kind==='student'&&action==='assignment.submit'){
    const assignmentId=required(input.assignmentId,'Devoir');const assignment=await client.from('angelcare360_assignments').select('id,class_id,section_id,subject_id,status,due_on,created_by_staff_id').eq('school_id',schoolId).eq('id',assignmentId).eq('class_id',identity.person.current_class_id).limit(1).maybeSingle();if(assignment.error||!assignment.data)throw new Error('Devoir hors de votre classe.');const assignmentRow=assignment.data;if(assignmentRow.section_id&&str(assignmentRow.section_id)!==str(identity.person.current_section_id))throw new Error('Devoir hors de votre section.');if(!['published','active','open','planned'].includes(str(assignmentRow.status)))throw new Error('Ce devoir n’accepte plus de remise.')
    return executeAngelcare360EnterpriseCommand({commandKey:'student.assignment.submit',idempotencyKey,permission:'eleves.view',schoolId,resourceType:'angelcare360_assignment_submissions',request:{assignmentId},execute:async({client,correlationId})=>{
      const existing=await client.from('angelcare360_assignment_submissions').select('id,status,submitted_at,score,feedback,metadata_json').eq('school_id',schoolId).eq('assignment_id',assignmentId).eq('student_id',personId).limit(1).maybeSingle();if(existing.error)throw new Error(existing.error.message);if(existing.data&&['graded','returned'].includes(str(existing.data.status)))throw new Error('Cette remise est déjà corrigée et ne peut plus être remplacée.')
      const attachmentId=str(input.attachmentDocumentId)||null
      if(attachmentId){const doc=await client.from('angelcare360_documents').select('id,status,documentable_id,metadata_json').eq('school_id',schoolId).eq('id',attachmentId).eq('documentable_type','student').eq('documentable_id',personId).eq('status','pending').limit(1).maybeSingle();if(doc.error||!doc.data)throw new Error('Pièce jointe en attente introuvable ou hors de votre dossier.');const meta=doc.data.metadata_json&&typeof doc.data.metadata_json==='object'&&!Array.isArray(doc.data.metadata_json)?doc.data.metadata_json as Row:{};if(str(meta.assignment_id)!==assignmentId)throw new Error('La pièce jointe ne correspond pas à ce devoir.');const obj=await client.from('angelcare360_document_objects').select('document_id,state').eq('school_id',schoolId).eq('document_id',attachmentId).eq('subject_id',personId).eq('state','pending').limit(1).maybeSingle();if(obj.error||!obj.data)throw new Error('Objet documentaire privé en attente introuvable.')}
      if(assignmentRow.created_by_staff_id)await enqueueInternalPortalNotifications(client,{schoolId,eventKey:'assignment.submitted',recipientType:'staff',recipientIds:[str(assignmentRow.created_by_staff_id)],title:'Nouvelle remise élève',body:'Un élève vient de remettre un devoir.',actionHref:'/angelcare-360-teacher/soumissions',correlationId,payload:{assignment_id:assignmentId,student_id:personId}})
      const payload={school_id:schoolId,assignment_id:assignmentId,student_id:personId,submitted_at:nowIso(),score:null,status:'submitted',metadata_json:{...(existing.data?.metadata_json&&typeof existing.data.metadata_json==='object'?existing.data.metadata_json:{}),source:'student_portal',student_note:str(input.note)||null,attachment_document_id:attachmentId,correlation_id:correlationId}}
      const result=existing.data?await client.from('angelcare360_assignment_submissions').update(payload).eq('school_id',schoolId).eq('id',existing.data.id).select('id,status').single():await client.from('angelcare360_assignment_submissions').insert(payload).select('id,status').single();if(result.error){await discardPortalNotifications(client,schoolId,correlationId);throw new Error(result.error.message)}
      if(attachmentId){
        const docFinalize=await client.from('angelcare360_documents').update({status:'active'}).eq('school_id',schoolId).eq('id',attachmentId).eq('documentable_id',personId).eq('status','pending');const objFinalize=docFinalize.error?{error:docFinalize.error}:await client.from('angelcare360_document_objects').update({state:'active'}).eq('school_id',schoolId).eq('document_id',attachmentId).eq('subject_id',personId).eq('state','pending')
        if(docFinalize.error||objFinalize.error){
          await client.from('angelcare360_documents').update({status:'pending'}).eq('school_id',schoolId).eq('id',attachmentId).eq('documentable_id',personId)
          await client.from('angelcare360_document_objects').update({state:'pending'}).eq('school_id',schoolId).eq('document_id',attachmentId).eq('subject_id',personId)
          if(existing.data){await client.from('angelcare360_assignment_submissions').update({status:existing.data.status,submitted_at:existing.data.submitted_at,score:existing.data.score,feedback:existing.data.feedback,metadata_json:existing.data.metadata_json}).eq('school_id',schoolId).eq('id',existing.data.id)}else{await client.from('angelcare360_assignment_submissions').delete().eq('school_id',schoolId).eq('id',result.data.id)}
          await discardPortalNotifications(client,schoolId,correlationId)
          throw new Error(docFinalize.error?.message||objFinalize.error?.message||'Finalisation de la pièce jointe impossible.')
        }
      }
      return result.data
    }})
  }

  if(kind==='student'&&action==='teacher.message'){
    const teacherAssignmentId=required(input.teacherAssignmentId,'Enseignant');const teacher=await client.from('angelcare360_teacher_assignments').select('id,staff_id,class_id,section_id,status').eq('school_id',schoolId).eq('id',teacherAssignmentId).eq('class_id',identity.person.current_class_id).eq('status','active').limit(1).maybeSingle();if(teacher.error||!teacher.data)throw new Error('Enseignant hors de votre classe.');const teacherRow=teacher.data;if(teacherRow.section_id&&str(teacherRow.section_id)!==str(identity.person.current_section_id))throw new Error('Enseignant hors de votre section.');const body=required(input.body,'Message');const subject=str(input.subject)||'Message élève'
    return executeAngelcare360EnterpriseCommand({commandKey:'student.teacher.message',idempotencyKey,permission:'eleves.view',schoolId,resourceType:'angelcare360_messages',request:{teacherAssignmentId},execute:async({client})=>insertConversationMessage(client,{schoolId,senderAppUserId:appUserId,senderRole:'student',subject,body,recipientStaffIds:[str(teacherRow.staff_id)],participantStudentIds:[personId],participantStaffIds:[str(teacherRow.staff_id)]})})
  }


  if(kind==='staff'&&action==='staff.message'){
    const recipientStaffId=required(input.recipientStaffId,'Destinataire');if(recipientStaffId===personId)throw new Error('Choisissez un autre membre de l’équipe.');const recipient=await client.from('angelcare360_staff').select('id,status').eq('school_id',schoolId).eq('id',recipientStaffId).eq('status','active').limit(1).maybeSingle();if(recipient.error||!recipient.data)throw new Error('Destinataire hors de votre établissement.');const body=required(input.body,'Message');const subject=str(input.subject)||'Message interne'
    return executeAngelcare360EnterpriseCommand({commandKey:'staff.message.create',idempotencyKey,permission:'personnel.view',schoolId,resourceType:'angelcare360_messages',request:{recipientStaffId},execute:async({client})=>insertConversationMessage(client,{schoolId,senderAppUserId:appUserId,senderRole:'staff',subject,body,recipientStaffIds:[recipientStaffId],participantStaffIds:[personId,recipientStaffId]})})
  }

  if((kind==='staff'||kind==='teacher')&&action==='leave.request'){
    return executeAngelcare360EnterpriseCommand({commandKey:`${kind}.leave.request`,idempotencyKey,permission:'personnel.view',schoolId,resourceType:'ac360_school_leave_requests',request:{startsOn:input.startsOn,endsOn:input.endsOn},execute:async({client,correlationId})=>requestStaffLeave(client,identity,input,correlationId)})
  }

  if((kind==='staff'||kind==='teacher')&&action==='task.update'){
    const taskId=required(input.taskId,'Tâche');const status=required(input.status,'Statut');if(!['todo','in_progress','completed','blocked','cancelled'].includes(status))throw new Error('Statut de tâche invalide.');const ops=await resolveStaffProfile(client,identity.school,identity.person)
    return executeAngelcare360EnterpriseCommand({commandKey:`${kind}.task.update`,idempotencyKey,permission:'personnel.view',schoolId,resourceType:'ac360_school_tasks',resourceId:taskId,request:{taskId,status},execute:async({client,correlationId})=>updateStaffTaskPreservingMetadata(client,{orgId:ops.orgId,profileId:ops.profileId,taskId,status,source:`${kind}_portal`,correlationId})})
  }

  if(kind==='staff'&&action==='workflow.transition'){
    const workflowInstanceId=required(input.workflowInstanceId,'Workflow');const toState=required(input.toState,'État cible');const owned=await client.from('angelcare360_workflow_instances').select('id,current_state,status').eq('school_id',schoolId).eq('id',workflowInstanceId).eq('owner_app_user_id',appUserId).eq('status','active').limit(1).maybeSingle();if(owned.error||!owned.data)throw new Error('Workflow hors de votre périmètre.')
    return executeAngelcare360EnterpriseCommand({commandKey:'staff.workflow.transition',idempotencyKey,permission:'personnel.view',schoolId,resourceType:'angelcare360_workflow_instances',resourceId:workflowInstanceId,request:{workflowInstanceId,toState},execute:async({correlationId})=>transitionAngelcare360Workflow({schoolId,workflowInstanceId,transitionKey:`staff_${toState}`,toState,actorAppUserId:appUserId,reason:str(input.reason)||null,metadata:{source:'staff_portal',correlation_id:correlationId}})})
  }

  if(kind==='staff'&&action==='approval.decide'){
    const workflowInstanceId=required(input.workflowInstanceId,'Approbation');const decision=required(input.decision,'Décision');if(!['approved','rejected'].includes(decision))throw new Error('Décision invalide.');const owned=await client.from('angelcare360_workflow_instances').select('id,current_state,status').eq('school_id',schoolId).eq('id',workflowInstanceId).eq('owner_app_user_id',appUserId).eq('status','active').limit(1).maybeSingle();if(owned.error||!owned.data)throw new Error('Approbation hors de votre périmètre.')
    return executeAngelcare360EnterpriseCommand({commandKey:'staff.approval.decide',idempotencyKey,permission:'personnel.view',schoolId,resourceType:'angelcare360_workflow_instances',resourceId:workflowInstanceId,request:{workflowInstanceId,decision},execute:async({correlationId})=>transitionAngelcare360Workflow({schoolId,workflowInstanceId,transitionKey:`staff_${decision}`,toState:decision,actorAppUserId:appUserId,reason:str(input.reason)||null,metadata:{source:'staff_portal',correlation_id:correlationId}})})
  }

  if(kind==='staff'&&action==='incident.create'){
    const ops=await resolveStaffProfile(client,identity.school,identity.person);const title=required(input.title,'Titre');const description=required(input.description,'Description');const severity=str(input.severity)||'medium'
    return executeAngelcare360EnterpriseCommand({commandKey:'staff.incident.create',idempotencyKey,permission:'personnel.view',schoolId,resourceType:'ac360_school_incident_reports',request:{title,severity},execute:async({client,correlationId})=>{const {data,error}=await client.from('ac360_school_incident_reports').insert({org_id:ops.orgId,incident_code:`STAFF-INC-${randomUUID().slice(0,8).toUpperCase()}`,incident_type:str(input.incidentType)||'operational',severity,occurred_at:nowIso(),location:str(input.location)||null,description,immediate_action:str(input.immediateAction)||null,parent_notification_status:'not_required',status:'open',reported_by_staff_id:ops.profileId,metadata_json:{source:'staff_portal',correlation_id:correlationId}}).select('id,incident_code,status').single();if(error)throw new Error(error.message);return data}})
  }

  if(kind==='staff'&&action==='incident.update'){
    const ops=await resolveStaffProfile(client,identity.school,identity.person);const incidentId=required(input.incidentId,'Signalement');const status=required(input.status,'Statut');if(!['open','under_review','resolved','closed'].includes(status))throw new Error('Statut de signalement invalide.')
    return executeAngelcare360EnterpriseCommand({commandKey:'staff.incident.update',idempotencyKey,permission:'personnel.view',schoolId,resourceType:'ac360_school_incident_reports',resourceId:incidentId,request:{incidentId,status},execute:async({client,correlationId})=>{const existing=await client.from('ac360_school_incident_reports').select('id,metadata_json').eq('org_id',ops.orgId).eq('id',incidentId).eq('reported_by_staff_id',ops.profileId).limit(1).maybeSingle();if(existing.error||!existing.data)throw new Error(existing.error?.message||'Signalement hors de votre périmètre.');const currentMeta=existing.data.metadata_json&&typeof existing.data.metadata_json==='object'&&!Array.isArray(existing.data.metadata_json)?existing.data.metadata_json as Row:{};const patch:Record<string,unknown>={status,metadata_json:{...currentMeta,source:'staff_portal',correlation_id:correlationId,portal_updated_at:nowIso()}};if(['resolved','closed'].includes(status))patch.closed_at=nowIso();const {data,error}=await client.from('ac360_school_incident_reports').update(patch).eq('org_id',ops.orgId).eq('id',incidentId).eq('reported_by_staff_id',ops.profileId).select('id,status').maybeSingle();if(error||!data)throw new Error(error?.message||'Signalement hors de votre périmètre.');return data}})
  }

  throw new Error('Action de portail inconnue ou non autorisée.')
}
