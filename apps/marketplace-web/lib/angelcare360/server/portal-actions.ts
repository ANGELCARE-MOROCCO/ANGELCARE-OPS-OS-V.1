import 'server-only'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { requirePortalIdentity } from '@/lib/angelcare360/portal/server'
import { executeAngelcare360EnterpriseCommand } from '@/lib/angelcare360/server/enterprise-command-kernel'

type DatabaseClient = Awaited<ReturnType<typeof createClient>>

function str(value: unknown) { return String(value ?? '').trim() }
function required(value: unknown, label: string) { const v=str(value); if(!v) throw new Error(`${label} requis.`); return v }
function isoDate(value: unknown, label: string) {
  const v=required(value,label)
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`${label} invalide.`)
  return v
}

async function teacherAssignmentScope(client:DatabaseClient, schoolId:string, staffId:string, classId:string, subjectId:string) {
  const { data, error } = await client.from('angelcare360_teacher_assignments')
    .select('id,class_id,section_id,subject_id,academic_year_id,status')
    .eq('school_id',schoolId).eq('staff_id',staffId).eq('class_id',classId).eq('subject_id',subjectId).eq('status','active').limit(1).maybeSingle()
  if(error) throw new Error(error.message)
  if(!data) throw new Error('Classe ou matière hors de votre périmètre enseignant.')
  return data
}

async function linkedChildIds(client:DatabaseClient, schoolId:string, parentId:string) {
  const { data, error } = await client.from('angelcare360_student_parent_links').select('student_id,status').eq('school_id',schoolId).eq('parent_id',parentId).eq('status','active').limit(100)
  if(error) throw new Error(error.message)
  return new Set((data||[]).map((row)=>String(row.student_id)))
}

async function resolveStaffProfile(client:DatabaseClient, school:Record<string, unknown>, staff:Record<string, unknown>) {
  const schoolId=String(school.id); const code=str(school.school_code)
  let org:Record<string, unknown>|null=null
  const direct=await client.from('ac360_organizations').select('id,org_code').eq('id',schoolId).limit(1).maybeSingle()
  if(direct.data) org=direct.data
  if(!org && code) {
    const byCode=await client.from('ac360_organizations').select('id,org_code').eq('org_code',code).limit(2)
    const byCodeRows=byCode.data ?? []
    const byCodeMatch=byCodeRows[0]
    if(byCodeRows.length===1 && byCodeMatch) org=byCodeMatch
  }
  if(!org) throw new Error('Profil opérationnel Staff OS non relié à cet établissement.')
  const profile=await client.from('ac360_school_staff_profiles').select('id,staff_code,status').eq('org_id',org.id).eq('staff_code',str(staff.staff_code)).eq('status','active').limit(2)
  if(profile.error) throw new Error(profile.error.message)
  if((profile.data||[]).length!==1) throw new Error('Profil opérationnel Staff OS ambigu ou absent.')
  return { orgId:String(org.id), profileId:String(profile.data[0].id) }
}

export async function executePortalAction(input: Record<string, unknown>) {
  const kind = required(input.kind, 'Portail') as 'teacher'|'parent'|'student'|'staff'
  const action = required(input.action, 'Action')
  const identity = await requirePortalIdentity(kind)
  const schoolId=String(identity.school.id)
  const client=await createClient()
  const idempotencyKey = str(input.idempotencyKey) || `${kind}:${action}:${randomUUID()}`

  if(kind==='teacher' && action==='assignment.create') {
    const classId=required(input.classId,'Classe'); const subjectId=required(input.subjectId,'Matière')
    const title=required(input.title,'Titre'); const dueOn=isoDate(input.dueOn,'Échéance')
    const assignment=await teacherAssignmentScope(client,schoolId,String(identity.person.id),classId,subjectId)
    return executeAngelcare360EnterpriseCommand({
      commandKey:'teacher.assignment.create', idempotencyKey, permission:'eleves.view', resourceType:'angelcare360_assignments',
      request:{classId,subjectId,title,dueOn},
      execute:async({client,userId,correlationId})=>{
        const id=randomUUID(); const code=`T-${id.slice(0,8).toUpperCase()}`
        const { data, error }=await client.from('angelcare360_assignments').insert({
          id, school_id:schoolId, academic_year_id:assignment.academic_year_id, class_id:classId, section_id:assignment.section_id || null,
          subject_id:subjectId, created_by_staff_id:identity.person.id, assignment_code:code, title,
          description:str(input.description)||null, due_on:dueOn, max_score:Number(input.maxScore||20), status:'published',
          metadata_json:{created_from:'teacher_portal',correlation_id:correlationId,created_by_app_user_id:userId},
        }).select('id,assignment_code,title,status,due_on').single()
        if(error) throw new Error(error.message)
        return data
      },
    })
  }

  if(kind==='teacher' && action==='submission.grade') {
    const submissionId=required(input.submissionId,'Soumission')
    const score=Number(input.score); if(!Number.isFinite(score)||score<0) throw new Error('Score invalide.')
    const submission=await client.from('angelcare360_assignment_submissions').select('id,assignment_id,student_id').eq('school_id',schoolId).eq('id',submissionId).limit(1).maybeSingle()
    if(submission.error||!submission.data) throw new Error('Soumission introuvable.')
    const submissionData=submission.data
    const assignment=await client.from('angelcare360_assignments').select('id,class_id,section_id,subject_id,max_score,created_by_staff_id,status').eq('school_id',schoolId).eq('id',submissionData.assignment_id).eq('created_by_staff_id',identity.person.id).limit(1).maybeSingle()
    if(assignment.error||!assignment.data) throw new Error('Cette soumission n’appartient pas à l’un de vos devoirs.')
    const assignmentData=assignment.data
    if(score>Number(assignmentData.max_score||20)) throw new Error('Le score dépasse le maximum du devoir.')
    return executeAngelcare360EnterpriseCommand({
      commandKey:'teacher.submission.grade', idempotencyKey, permission:'eleves.view', resourceType:'angelcare360_assignment_submissions', resourceId:submissionId,
      request:{submissionId,score}, execute:async({client,correlationId})=>{
        const now=new Date().toISOString()
        const updated=await client.from('angelcare360_assignment_submissions').update({score,status:'graded',metadata_json:{graded_from:'teacher_portal',correlation_id:correlationId},updated_at:now}).eq('school_id',schoolId).eq('id',submissionId)
        if(updated.error) throw new Error(updated.error.message)
        const existing=await client.from('angelcare360_marks').select('id').eq('school_id',schoolId).eq('assignment_id',assignmentData.id).eq('student_id',submissionData.student_id).limit(1).maybeSingle()
        if(existing.error) throw new Error(existing.error.message)
        const markPayload={school_id:schoolId,student_id:submissionData.student_id,subject_id:assignmentData.subject_id,assignment_id:assignmentData.id,assessment_type:'assignment',score,max_score:Number(assignmentData.max_score||20),mark_state:'published',recorded_at:now,status:'active',metadata_json:{source:'teacher_portal',correlation_id:correlationId}}
        const mark=existing.data
          ? await client.from('angelcare360_marks').update(markPayload).eq('school_id',schoolId).eq('id',existing.data.id)
          : await client.from('angelcare360_marks').insert(markPayload)
        if(mark.error) throw new Error(mark.error.message)
        return {submissionId,score,status:'graded'}
      },
    })
  }

  if(kind==='teacher' && action==='comment.create') {
    const studentId=required(input.studentId,'Élève'); const classId=required(input.classId,'Classe'); const comment=required(input.comment,'Appréciation')
    const assigned=await client.from('angelcare360_teacher_assignments').select('id,academic_year_id,section_id').eq('school_id',schoolId).eq('staff_id',identity.person.id).eq('class_id',classId).eq('status','active').limit(1).maybeSingle()
    if(assigned.error||!assigned.data) throw new Error('Classe hors de votre périmètre.')
    const assignedData=assigned.data
    const enrolled=await client.from('angelcare360_class_enrollments').select('id').eq('school_id',schoolId).eq('student_id',studentId).eq('class_id',classId).eq('status','active').limit(1).maybeSingle()
    if(enrolled.error||!enrolled.data) throw new Error('Élève hors de votre classe.')
    return executeAngelcare360EnterpriseCommand({commandKey:'teacher.comment.create',idempotencyKey,permission:'eleves.view',request:{studentId,classId},execute:async({client,correlationId})=>{
      const {data,error}=await client.from('angelcare360_teacher_comments').insert({school_id:schoolId,academic_year_id:assignedData.academic_year_id,class_id:classId,section_id:assignedData.section_id||null,student_id:studentId,staff_id:identity.person.id,comment_text:comment,comment_type:'appreciation',status:'active',metadata_json:{source:'teacher_portal',correlation_id:correlationId}}).select('id').single()
      if(error) throw new Error(error.message); return data
    }})
  }

  if(kind==='parent' && action==='request.create') {
    const subject=required(input.subject,'Objet'); const description=required(input.description,'Description')
    const related= str(input.relatedEntityType)||'operations'; const priority=str(input.priority)||'medium'
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.request.create',idempotencyKey,permission:'parents.view',request:{subject,related,priority},execute:async({client,correlationId})=>{
      const code=`REQ-${randomUUID().slice(0,8).toUpperCase()}`
      const {data,error}=await client.from('angelcare360_reclamations').insert({school_id:schoolId,reclamation_code:code,reporter_role:'parent',subject,description,related_entity_type:related,priority,status:'open',submitted_by_parent_id:identity.person.id,metadata_json:{source:'parent_portal',correlation_id:correlationId}}).select('id,reclamation_code,status').single()
      if(error) throw new Error(error.message); return data
    }})
  }

  if(kind==='parent' && action==='attendance.justify') {
    const recordId=required(input.recordId,'Présence'); const description=required(input.description,'Justification')
    const record=await client.from('angelcare360_attendance_records').select('id,student_id,attendance_status').eq('school_id',schoolId).eq('id',recordId).limit(1).maybeSingle()
    if(record.error||!record.data) throw new Error('Présence introuvable.')
    const children=await linkedChildIds(client,schoolId,String(identity.person.id)); if(!children.has(String(record.data.student_id))) throw new Error('Présence hors de votre périmètre familial.')
    return executeAngelcare360EnterpriseCommand({commandKey:'parent.attendance.justify',idempotencyKey,permission:'parents.view',request:{recordId},execute:async({client,correlationId})=>{
      const code=`JUST-${randomUUID().slice(0,8).toUpperCase()}`
      const {data,error}=await client.from('angelcare360_attendance_justifications').insert({school_id:schoolId,attendance_record_id:recordId,justification_code:code,reason_category:str(input.reasonCategory)||'family',description,submitted_at:new Date().toISOString(),decision:'pending',status:'active',metadata_json:{source:'parent_portal',parent_id:identity.person.id,correlation_id:correlationId}}).select('id,justification_code,decision').single()
      if(error) throw new Error(error.message); return data
    }})
  }

  if(kind==='student' && action==='assignment.submit') {
    const assignmentId=required(input.assignmentId,'Devoir')
    const assignment=await client.from('angelcare360_assignments').select('id,class_id,section_id,subject_id,status,due_on').eq('school_id',schoolId).eq('id',assignmentId).eq('class_id',identity.person.current_class_id).limit(1).maybeSingle()
    if(assignment.error||!assignment.data) throw new Error('Devoir hors de votre classe.')
    if(!['published','active','open','planned'].includes(str(assignment.data.status))) throw new Error('Ce devoir n’accepte plus de remise.')
    return executeAngelcare360EnterpriseCommand({commandKey:'student.assignment.submit',idempotencyKey,permission:'eleves.view',request:{assignmentId},execute:async({client,correlationId})=>{
      const now=new Date().toISOString(); const payload={school_id:schoolId,assignment_id:assignmentId,student_id:identity.person.id,submitted_at:now,score:null,status:'submitted',metadata_json:{source:'student_portal',student_note:str(input.note)||null,correlation_id:correlationId}}
      const existing=await client.from('angelcare360_assignment_submissions').select('id,status').eq('school_id',schoolId).eq('assignment_id',assignmentId).eq('student_id',identity.person.id).limit(1).maybeSingle()
      if(existing.error) throw new Error(existing.error.message)
      if(existing.data && ['graded','returned'].includes(str(existing.data.status))) throw new Error('Cette remise est déjà corrigée et ne peut plus être remplacée.')
      const result=existing.data ? await client.from('angelcare360_assignment_submissions').update(payload).eq('school_id',schoolId).eq('id',existing.data.id).select('id,status').single() : await client.from('angelcare360_assignment_submissions').insert(payload).select('id,status').single()
      if(result.error) throw new Error(result.error.message); return result.data
    }})
  }

  if(kind==='staff' && action==='leave.request') {
    const startsOn=isoDate(input.startsOn,'Début'); const endsOn=isoDate(input.endsOn,'Fin'); if(endsOn<startsOn) throw new Error('La fin du congé précède son début.')
    const reason=required(input.reason,'Motif'); const advanced=await resolveStaffProfile(client,identity.school,identity.person)
    const policy=await client.from('ac360_school_leave_policies').select('id,leave_type,status').eq('org_id',advanced.orgId).eq('status','active').limit(1).maybeSingle()
    if(policy.error||!policy.data) throw new Error('Aucune politique de congé active n’est configurée.')
    const policyData=policy.data
    return executeAngelcare360EnterpriseCommand({commandKey:'staff.leave.request',idempotencyKey,permission:'personnel.view',request:{startsOn,endsOn},execute:async({client,correlationId})=>{
      const start=new Date(`${startsOn}T00:00:00Z`), end=new Date(`${endsOn}T00:00:00Z`); const totalDays=Math.floor((end.getTime()-start.getTime())/86400000)+1
      const code=`LR-${randomUUID().slice(0,8).toUpperCase()}`
      const {data,error}=await client.from('ac360_school_leave_requests').insert({org_id:advanced.orgId,staff_profile_id:advanced.profileId,policy_id:policyData.id,request_code:code,leave_type:policyData.leave_type||'authorized_absence',starts_on:startsOn,ends_on:endsOn,total_days:totalDays,status:'pending',reason,metadata_json:{source:'staff_portal',correlation_id:correlationId}}).select('id,request_code,status').single()
      if(error) throw new Error(error.message); return data
    }})
  }

  throw new Error('Action de portail inconnue ou non autorisée.')
}
