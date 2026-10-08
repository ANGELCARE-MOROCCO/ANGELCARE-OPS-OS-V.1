import 'server-only'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { loadParentRelationshipPolicies, parentPolicyAllows, portalPermissionSet } from '@/lib/angelcare360/portal/policy'
import type {
  Angelcare360ParentPortalSnapshot,
  Angelcare360PortalKind,
  Angelcare360PortalMetric,
  Angelcare360PortalRecord,
  Angelcare360StaffPortalSnapshot,
  Angelcare360StudentPortalSnapshot,
  Angelcare360TeacherPortalSnapshot,
} from '@/types/angelcare360/role-portals'

type Row = Record<string, unknown>
type DatabaseClient = Awaited<ReturnType<typeof createClient>>
type PortalIdentity = {
  kind: Angelcare360PortalKind
  appUser: Row
  person: Row
  school: Row
  academicYear: Row | null
  settings: Row | null
}

type QueryOptions = {
  select?: string
  order?: string
  ascending?: boolean
  limit?: number
  filters?: Array<{ column: string; value?: unknown; values?: unknown[]; operator?: 'eq' | 'in' | 'gte' | 'lte' | 'neq' }>
}

const QUERY_TIMEOUT_MS = 8_000
const MAX_ROWS = 350

function t(value: unknown, fallback = '') {
  const raw = value === null || value === undefined ? '' : String(value).trim()
  return raw || fallback
}
function n(value: unknown, fallback = 0) {
  const v = Number(value)
  return Number.isFinite(v) ? v : fallback
}
function uniq(values: unknown[]) {
  return [...new Set(values.map((value) => t(value)).filter(Boolean))]
}

function asRows(value: unknown): Row[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (row): row is Row =>
      typeof row === 'object'
      && row !== null
      && !Array.isArray(row),
  )
}
function tone(status: unknown) {
  const value = t(status).toLowerCase()
  if (['paid','present','active','published','completed','approved','returned','delivered','verified','graded'].includes(value)) return 'emerald' as const
  if (['overdue','absent','failed','rejected','critical','incident','cancelled'].includes(value)) return 'red' as const
  if (['late','pending','open','scheduled','planned','draft','partially_paid','submitted'].includes(value)) return 'amber' as const
  if (['in_progress','processing','sent'].includes(value)) return 'blue' as const
  return 'slate' as const
}
function record(row: Row, title: unknown, subtitle?: unknown, options?: { detail?: unknown; status?: unknown; date?: unknown; href?: string | null; meta?: Record<string,string|number|boolean|null> }): Angelcare360PortalRecord {
  const status = t(options?.status ?? row.status)
  return {
    id: t(row.id) || `${t(title)}:${t(options?.date)}`,
    title: t(title,'Élément SANILA'),
    subtitle: t(subtitle) || null,
    detail: t(options?.detail) || null,
    status: status || null,
    statusLabel: status ? status.replaceAll('_',' ') : null,
    tone: tone(status),
    date: t(options?.date) || null,
    href: options?.href || null,
    meta: options?.meta,
  }
}
function metric(key:string,label:string,value:string|number,detail:string,toneValue:Angelcare360PortalMetric['tone'],href?:string): Angelcare360PortalMetric {
  return { key,label,value:String(value),detail,tone:toneValue,href:href||null }
}
async function bounded<T>(promiseLike: PromiseLike<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(promiseLike),
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}: délai de réponse dépassé (${QUERY_TIMEOUT_MS} ms)`)), QUERY_TIMEOUT_MS) }),
    ])
  } finally { if (timer) clearTimeout(timer) }
}
async function rows(db:DatabaseClient, table:string, schoolId:string, options:QueryOptions={}) {
  const warnings:string[]=[]
  try {
    let q=db.from(table).select(options.select||'*').eq('school_id',schoolId)
    for (const f of options.filters||[]) {
      if (f.operator==='in') {
        const values=(f.values||[]).filter((v)=>v!==null&&v!==undefined&&String(v)!=='')
        if (!values.length) return { rows:[] as Row[], warnings }
        q=q.in(f.column,values)
      } else if (f.operator==='gte') q=q.gte(f.column,f.value)
      else if (f.operator==='lte') q=q.lte(f.column,f.value)
      else if (f.operator==='neq') q=q.neq(f.column,f.value)
      else q=q.eq(f.column,f.value)
    }
    if (options.order) q=q.order(options.order,{ascending:options.ascending??false})
    q=q.limit(Math.min(Math.max(options.limit||MAX_ROWS,1),MAX_ROWS))
    const result=await bounded(q,table)
    if (result.error) return { rows:[] as Row[], warnings:[`${table}: ${result.error.message||'source indisponible'}`] }
    return { rows:asRows(result.data), warnings }
  } catch (error) {
    warnings.push(`${table}: ${error instanceof Error ? error.message : 'source indisponible'}`)
    return { rows:[] as Row[], warnings }
  }
}
async function directRows(db:DatabaseClient, table:string, column:string, values:string[], select='*', order?:string, limit=MAX_ROWS) {
  if (!values.length) return { rows:[] as Row[], warnings:[] as string[] }
  try {
    let q=db.from(table).select(select).in(column,values).limit(Math.min(limit,MAX_ROWS))
    if (order) q=q.order(order,{ascending:false})
    const result=await bounded(q,table)
    if (result.error) return { rows:[] as Row[], warnings:[`${table}: ${result.error.message}`] }
    return { rows:asRows(result.data), warnings:[] as string[] }
  } catch (error) {
    return { rows:[] as Row[], warnings:[`${table}: ${error instanceof Error ? error.message:'source indisponible'}`] }
  }
}
async function internalPortalOutboxRows(db:DatabaseClient,schoolId:string,recipientType:'student'|'parent'|'staff',recipientId:string){
  return rows(db,'angelcare360_notification_outbox',schoolId,{select:'id,event_key,recipient_type,recipient_id,channel,subject,body,payload_json,state,created_at,delivered_at',filters:[{column:'recipient_type',value:recipientType},{column:'recipient_id',value:recipientId},{column:'channel',value:'internal'}],order:'created_at',limit:180})
}
function notificationRecords(primary:Row[],outbox:Row[]){
  const core=primary.map(r=>record(r,r.title,r.channel,{status:r.status,date:r.scheduled_for,detail:r.body,href:t(r.action_href)||null,meta:{notificationId:t(r.id)}}))
  const durable=outbox.filter(r=>!['failed','cancelled'].includes(t(r.state))).map(r=>{const payload=r.payload_json&&typeof r.payload_json==='object'&&!Array.isArray(r.payload_json)?r.payload_json as Row:{};return record(r,t(r.subject,t(r.event_key,'Notification')),t(r.event_key,'Événement SANILA'),{status:r.state,date:r.delivered_at||r.created_at,detail:r.body,href:t(payload.action_href)||null,meta:{notificationOutboxId:t(r.id),eventKey:t(r.event_key)}})})
  return [...core,...durable].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))
}

function loginRoute(kind:Angelcare360PortalKind){ return `/angelcare-360-${kind}/login` }

export async function requirePortalIdentity(kind:Angelcare360PortalKind): Promise<PortalIdentity> {
  const user=await requireUser()
  const db=await createClient()
  const table=kind==='parent'?'angelcare360_parents':kind==='student'?'angelcare360_students':'angelcare360_staff'
  const cookieStore=await cookies()
  const selectedKind=cookieStore.get('sanila_portal_kind')?.value
  const selectedPerson=cookieStore.get('sanila_portal_person')?.value
  const selectedSchool=cookieStore.get('sanila_portal_school')?.value
  if(selectedKind&&selectedKind!==kind) redirect('/angelcare-360-portal/login?error=role')
  let personQuery=db.from(table).select('*').eq('portal_app_user_id',(user as Row).id).eq('status','active')
  if(selectedPerson) personQuery=personQuery.eq('id',selectedPerson)
  if(selectedSchool) personQuery=personQuery.eq('school_id',selectedSchool)
  const personResult=await bounded(personQuery.limit(2),`${table}.portal_identity`)
  if (personResult.error || !personResult.data?.length) redirect(`${loginRoute(kind)}?error=role`)
  if (personResult.data.length!==1) throw new Error(`Identité ${kind} ambiguë: plusieurs profils actifs sont liés au même compte.`)
  const person=personResult.data[0] as Row
  const schoolId=t(person.school_id)
  if (!schoolId) throw new Error(`Le profil ${kind} n’est rattaché à aucun établissement.`)

  const [schoolResult,yearResult,settingsResult]=await Promise.all([
    bounded(db.from('angelcare360_schools').select('id,name,school_code,status').eq('id',schoolId).eq('status','active').maybeSingle(),'angelcare360_schools'),
    bounded(db.from('angelcare360_academic_years').select('id,label,year_code,status,is_current,starts_on,ends_on').eq('school_id',schoolId).eq('status','active').order('is_current',{ascending:false}).order('starts_on',{ascending:false}).limit(1).maybeSingle(),'angelcare360_academic_years'),
    bounded(db.from('angelcare360_school_settings').select('*').eq('school_id',schoolId).limit(1).maybeSingle(),'angelcare360_school_settings'),
  ])
  if (schoolResult.error || !schoolResult.data) throw new Error('L’établissement lié à ce portail est indisponible ou inactif.')
  if (kind==='parent' && settingsResult.data?.allow_parent_portal===false) throw new Error('Le portail familles est désactivé par cet établissement.')
  if (kind==='student' && settingsResult.data?.allow_student_portal===false) throw new Error('Le portail élèves est désactivé par cet établissement.')
  return {kind,appUser:user as Row,person,school:schoolResult.data,academicYear:yearResult.data||null,settings:settingsResult.data||null}
}

async function orgRows(db:DatabaseClient, table:string, orgId:string, options:QueryOptions={}) {
  const warnings:string[]=[]
  try {
    let q=db.from(table).select(options.select||'*').eq('org_id',orgId)
    for (const f of options.filters||[]) {
      if (f.operator==='in') {
        const values=(f.values||[]).filter((v)=>v!==null&&v!==undefined&&String(v)!=='')
        if (!values.length) return { rows:[] as Row[], warnings }
        q=q.in(f.column,values)
      } else if (f.operator==='gte') q=q.gte(f.column,f.value)
      else if (f.operator==='lte') q=q.lte(f.column,f.value)
      else if (f.operator==='neq') q=q.neq(f.column,f.value)
      else q=q.eq(f.column,f.value)
    }
    if (options.order) q=q.order(options.order,{ascending:options.ascending??false})
    q=q.limit(Math.min(Math.max(options.limit||MAX_ROWS,1),MAX_ROWS))
    const result=await bounded(q,table)
    if (result.error) return { rows:[] as Row[], warnings:[`${table}: ${result.error.message||'source indisponible'}`] }
    return { rows:asRows(result.data), warnings }
  } catch (error) { return { rows:[] as Row[], warnings:[`${table}: ${error instanceof Error ? error.message : 'source indisponible'}`] } }
}
async function resolveStaffOperationalScope(db:DatabaseClient, school:Row, staff:Row) {
  const schoolId=t(school.id), schoolCode=t(school.school_code), staffCode=t(staff.staff_code)
  let org:Row|null=null
  const direct=await db.from('ac360_organizations').select('id,org_code').eq('id',schoolId).limit(1).maybeSingle()
  if (direct.error) throw new Error(direct.error.message)
  if (direct.data) org=direct.data as Row
  if (!org && schoolCode) {
    const byCode=await db.from('ac360_organizations').select('id,org_code').eq('org_code',schoolCode).limit(2)
    if (byCode.error) throw new Error(byCode.error.message)
    const candidates=asRows(byCode.data); if(candidates.length===1) org=candidates[0]
  }
  if (!org || !staffCode) throw new Error('Profil Staff OS non relié à cet établissement.')
  const profile=await db.from('ac360_school_staff_profiles').select('id,staff_code,department,status').eq('org_id',t(org.id)).eq('staff_code',staffCode).eq('status','active').limit(2)
  if (profile.error) throw new Error(profile.error.message)
  const profiles=asRows(profile.data); if(profiles.length!==1) throw new Error('Profil Staff OS ambigu ou absent.')
  return {orgId:t(org.id),profileId:t(profiles[0].id),department:t(profiles[0].department)}
}
function sectionVisible(row:Row, sectionId:string) { const rowSection=t(row.section_id); return !rowSection || !sectionId || rowSection===sectionId }

function workflowTargets(schema:unknown,fromState:string){
  const from=t(fromState);const out=new Set<string>()
  const add=(value:unknown)=>{const target=t(value);if(target)out.add(target)}
  if(Array.isArray(schema)) for(const item of schema){
    if(typeof item==='string'){const parts=item.split('->').map(v=>v.trim());if(parts.length===2&&parts[0]===from)add(parts[1]);continue}
    if(!item||typeof item!=='object'||Array.isArray(item))continue
    const row=item as Row;const declaredFrom=t(row.from_state,t(row.from,t(row.source)));if(declaredFrom&&declaredFrom!=='*'&&declaredFrom!==from)continue;add(row.to_state??row.to??row.target)
  }
  else if(schema&&typeof schema==='object'){
    const rec=schema as Row;const value=rec[from]??rec['*']
    if(Array.isArray(value)) for(const item of value){if(typeof item==='string')add(item);else if(item&&typeof item==='object'&&!Array.isArray(item))add((item as Row).to_state??(item as Row).to??(item as Row).target)}
    else if(value&&typeof value==='object') for(const [key,enabled] of Object.entries(value as Row)){if(enabled===true||typeof enabled==='string'||(enabled&&typeof enabled==='object'))add(key)}
  }
  return [...out]
}

async function mapsFor(db:DatabaseClient,schoolId:string,classIds:string[],subjectIds:string[],sectionIds:string[]) {
  const [classes,subjects,sections]=await Promise.all([
    rows(db,'angelcare360_classes',schoolId,{select:'id,name,level,class_code,status',filters:[{column:'id',operator:'in',values:classIds}],limit:200}),
    rows(db,'angelcare360_subjects',schoolId,{select:'id,name,short_name,subject_code,status',filters:[{column:'id',operator:'in',values:subjectIds}],limit:200}),
    rows(db,'angelcare360_sections',schoolId,{select:'id,name,section_code,room,status',filters:[{column:'id',operator:'in',values:sectionIds}],limit:200}),
  ])
  return {
    classMap:new Map(classes.rows.map((r)=>[t(r.id),t(r.name,t(r.class_code))])),
    subjectMap:new Map(subjects.rows.map((r)=>[t(r.id),t(r.name,t(r.subject_code))])),
    sectionMap:new Map(sections.rows.map((r)=>[t(r.id),t(r.name,t(r.section_code))])),
    warnings:[...classes.warnings,...subjects.warnings,...sections.warnings],
  }
}

export async function getTeacherPortalSnapshot(view='today'):Promise<Angelcare360TeacherPortalSnapshot>{
  const i=await requirePortalIdentity('teacher'); const db=await createClient(); const schoolId=t(i.school.id); const staffId=t(i.person.id); const warnings:string[]=[]
  const assigned=await rows(db,'angelcare360_teacher_assignments',schoolId,{select:'id,academic_year_id,staff_id,class_id,section_id,subject_id,assignment_role,weekly_hours,status',filters:[{column:'staff_id',value:staffId}],limit:220}); warnings.push(...assigned.warnings)
  const classIds=uniq(assigned.rows.map(r=>r.class_id)); const sectionIds=uniq(assigned.rows.map(r=>r.section_id)); const subjectIds=uniq(assigned.rows.map(r=>r.subject_id));
  const maps=await mapsFor(db,schoolId,classIds,subjectIds,sectionIds); warnings.push(...maps.warnings)
  const enroll=await rows(db,'angelcare360_class_enrollments',schoolId,{select:'id,student_id,class_id,section_id,enrollment_status,status',filters:[{column:'class_id',operator:'in',values:classIds}],limit:MAX_ROWS}); warnings.push(...enroll.warnings)
  const classSectionScopes=assigned.rows.map(r=>({classId:t(r.class_id),sectionId:t(r.section_id),subjectId:t(r.subject_id)}))
  const classSectionAllowed=(row:Row)=>classSectionScopes.some(scope=>scope.classId===t(row.class_id)&&(!scope.sectionId||!t(row.section_id)||scope.sectionId===t(row.section_id)))
  const teachingScopeAllowed=(row:Row)=>classSectionScopes.some(scope=>scope.classId===t(row.class_id)&&(!scope.sectionId||!t(row.section_id)||scope.sectionId===t(row.section_id))&&(!t(row.subject_id)||scope.subjectId===t(row.subject_id)))
  const scopedEnrollRows=enroll.rows.filter(classSectionAllowed)
  const studentIds=uniq(scopedEnrollRows.map(r=>r.student_id))
  const [students,timetable,lessons,assignments,exams,comments,notifications,messages,cards]=await Promise.all([
    rows(db,'angelcare360_students',schoolId,{select:'id,student_code,full_name,first_name,last_name,current_class_id,current_section_id,status',filters:[{column:'id',operator:'in',values:studentIds}],limit:MAX_ROWS}),
    rows(db,'angelcare360_timetable_slots',schoolId,{select:'id,class_id,section_id,subject_id,staff_id,day_of_week,start_time,end_time,room,status',filters:[{column:'staff_id',value:staffId}],order:'day_of_week',ascending:true,limit:220}),
    rows(db,'angelcare360_lessons',schoolId,{select:'id,lesson_code,lesson_date,class_id,section_id,subject_id,staff_id,topic,objectives,status',filters:[{column:'staff_id',value:staffId}],order:'lesson_date',limit:220}),
    rows(db,'angelcare360_assignments',schoolId,{select:'id,assignment_code,class_id,section_id,subject_id,created_by_staff_id,title,description,due_on,max_score,status',filters:[{column:'created_by_staff_id',value:staffId}],order:'due_on',limit:220}),
    rows(db,'angelcare360_exams',schoolId,{select:'id,exam_code,class_id,section_id,subject_id,title,exam_type,scheduled_on,max_score,status',filters:[{column:'class_id',operator:'in',values:classIds}],order:'scheduled_on',limit:220}),
    rows(db,'angelcare360_teacher_comments',schoolId,{select:'id,student_id,class_id,section_id,staff_id,comment_type,comment_text,status',filters:[{column:'staff_id',value:staffId}],limit:180}),
    rows(db,'angelcare360_notifications',schoolId,{select:'id,title,body,channel,status,scheduled_for,action_href,recipient_staff_id,recipient_app_user_id',filters:[{column:'recipient_staff_id',value:staffId}],order:'scheduled_for',limit:120}),
    rows(db,'angelcare360_messages',schoolId,{select:'id,conversation_id,subject,body,message_type,sender_role,status,sent_at,sender_app_user_id',filters:[{column:'sender_app_user_id',value:t(i.appUser.id)}],order:'sent_at',limit:120}),
    rows(db,'angelcare360_report_cards',schoolId,{select:'id,report_card_code,student_id,class_id,overall_average,status',filters:[{column:'student_id',operator:'in',values:studentIds}],limit:220}),
  ])
  for(const result of [students,timetable,lessons,assignments,exams,comments,notifications,messages,cards]) warnings.push(...result.warnings)
  const [teacherStaffRecipients,teacherAppRecipients]=await Promise.all([rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_staff_id,recipient_app_user_id,read_at,delivery_status,status',filters:[{column:'recipient_staff_id',value:staffId}],limit:220}),rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_staff_id,recipient_app_user_id,read_at,delivery_status,status',filters:[{column:'recipient_app_user_id',value:t(i.appUser.id)}],limit:220})]); warnings.push(...teacherStaffRecipients.warnings,...teacherAppRecipients.warnings)
  const incomingTeacherMessageIds=uniq([...teacherStaffRecipients.rows,...teacherAppRecipients.rows].map(r=>r.message_id)); const incomingTeacherMessages=await directRows(db,'angelcare360_messages','id',incomingTeacherMessageIds,'id,school_id,conversation_id,subject,body,message_type,sender_role,status,sent_at,sender_app_user_id','sent_at',220); warnings.push(...incomingTeacherMessages.warnings)
  const teacherMessageMap=new Map<string,Row>(); for(const row of [...messages.rows,...incomingTeacherMessages.rows]) teacherMessageMap.set(t(row.id),row); const teacherMessages=[...teacherMessageMap.values()]
  const assignmentIds=uniq(assignments.rows.map(r=>r.id))
  const [submissions,marks,sessions]=await Promise.all([
    rows(db,'angelcare360_assignment_submissions',schoolId,{select:'id,assignment_id,student_id,submitted_at,score,feedback,status,metadata_json',filters:[{column:'assignment_id',operator:'in',values:assignmentIds}],order:'submitted_at',limit:MAX_ROWS}),
    rows(db,'angelcare360_marks',schoolId,{select:'id,student_id,subject_id,assignment_id,exam_id,assessment_type,score,max_score,grade,mark_state,recorded_at,status',filters:[{column:'student_id',operator:'in',values:studentIds},{column:'subject_id',operator:'in',values:subjectIds}],order:'recorded_at',limit:MAX_ROWS}),
    rows(db,'angelcare360_attendance_sessions',schoolId,{select:'id,class_id,section_id,session_date,session_type,status,total_expected,total_present,total_absent,total_late',filters:[{column:'class_id',operator:'in',values:classIds}],order:'session_date',limit:220}),
  ])
  for(const result of [submissions,marks,sessions]) warnings.push(...result.warnings)
  const scopedSessions=sessions.rows.filter(classSectionAllowed)
  const sessionIds=uniq(scopedSessions.map(r=>r.id))
  const attendance=await rows(db,'angelcare360_attendance_records',schoolId,{select:'id,attendance_session_id,student_id,attendance_status,minutes_late,justification_required,note,status',filters:[{column:'attendance_session_id',operator:'in',values:sessionIds},{column:'student_id',operator:'in',values:studentIds}],limit:MAX_ROWS}); warnings.push(...attendance.warnings)
  let teacherOps:{orgId:string;profileId:string;department:string}|null=null
  try { teacherOps=await resolveStaffOperationalScope(db,i.school,i.person) } catch(error) { warnings.push(error instanceof Error?error.message:'Staff OS enseignant indisponible') }
  const [teacherTasks,teacherLeave,teacherLeavePolicies]=teacherOps?await Promise.all([
    orgRows(db,'ac360_school_tasks',teacherOps.orgId,{filters:[{column:'assigned_staff_id',value:teacherOps.profileId}],order:'due_at',limit:160}),
    orgRows(db,'ac360_school_leave_requests',teacherOps.orgId,{filters:[{column:'staff_profile_id',value:teacherOps.profileId}],order:'created_at',limit:120}),
    orgRows(db,'ac360_school_leave_policies',teacherOps.orgId,{select:'id,policy_key,label,leave_type,yearly_allowance_days,paid,requires_approval,status',filters:[{column:'status',value:'active'}],order:'label',ascending:true,limit:80}),
  ]):[{rows:[] as Row[],warnings:[] as string[]},{rows:[] as Row[],warnings:[] as string[]},{rows:[] as Row[],warnings:[] as string[]}]
  warnings.push(...teacherTasks.warnings,...teacherLeave.warnings,...teacherLeavePolicies.warnings)
  const teacherDocuments=await rows(db,'angelcare360_documents',schoolId,{select:'id,document_code,documentable_type,documentable_id,title,category,file_name,file_path,mime_type,status',filters:[{column:'documentable_id',value:staffId}],limit:180}); warnings.push(...teacherDocuments.warnings)
  const teacherOutbox=await internalPortalOutboxRows(db,schoolId,'staff',staffId); warnings.push(...teacherOutbox.warnings); const teacherNotificationRows=notificationRecords(notifications.rows,teacherOutbox.rows)
  const studentMap=new Map(students.rows.map(r=>[t(r.id),t(r.full_name,`${t(r.first_name)} ${t(r.last_name)}`.trim())])); const assignmentMap=new Map(assignments.rows.map(r=>[t(r.id),t(r.title,t(r.assignment_code))]))
  return {
    portal:'teacher',school:{id:schoolId,name:t(i.school.name,'Établissement SANILA')},academicYear:{id:t(i.academicYear?.id)||null,label:t(i.academicYear?.label,'Année active')},teacher:{id:staffId,appUserId:t(i.appUser.id),code:t(i.person.staff_code)||null,name:t(i.person.full_name,t(i.appUser.full_name,'Enseignant')),email:t(i.person.email,t(i.appUser.email))||null,department:t(i.person.department)||null},view,
    metrics:[metric('classes','Classes attribuées',classIds.length,'Périmètre pédagogique autorisé','blue','/angelcare-360-teacher/classes'),metric('students','Élèves suivis',studentIds.length,'Uniquement dans vos classes','emerald','/angelcare-360-teacher/classes'),metric('homework','Devoirs',assignments.rows.length,'Créés sous votre identité','violet','/angelcare-360-teacher/devoirs'),metric('pending','Remises à traiter',submissions.rows.filter(r=>!['graded','returned'].includes(t(r.status))).length,'Travaux reçus à suivre','amber','/angelcare-360-teacher/soumissions')],
    classes:assigned.rows.map(r=>record(r,maps.classMap.get(t(r.class_id))||'Classe attribuée',`${maps.subjectMap.get(t(r.subject_id))||'Matière'}${r.section_id?` · ${maps.sectionMap.get(t(r.section_id))||'Section'}`:''}`,{status:r.status,detail:`${n(r.weekly_hours)} h/semaine · ${t(r.assignment_role,'enseignant')}`,meta:{teacherAssignmentId:t(r.id),classId:t(r.class_id),sectionId:t(r.section_id)||null,subjectId:t(r.subject_id),academicYearId:t(r.academic_year_id)}})),
    students:students.rows.map(r=>record(r,studentMap.get(t(r.id)),t(r.student_code),{status:r.status,meta:{studentId:t(r.id),classId:t(r.current_class_id),sectionId:t(r.current_section_id)}})),
    subjects:subjectIds.map(id=>({id,title:maps.subjectMap.get(id)||'Matière',tone:'slate' as const,meta:{subjectId:id}})),
    timetable:timetable.rows.map(r=>record(r,maps.subjectMap.get(t(r.subject_id))||'Séance',`${maps.classMap.get(t(r.class_id))||'Classe'} · ${t(r.room,'Salle à confirmer')}`,{status:r.status,detail:`${t(r.day_of_week)} · ${t(r.start_time)}–${t(r.end_time)}`,meta:{slotId:t(r.id),classId:t(r.class_id),sectionId:t(r.section_id)||null,subjectId:t(r.subject_id),staffId:t(r.staff_id)}})),
    attendance:attendance.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Élève',t(r.attendance_status),{status:r.attendance_status,detail:r.minutes_late?`${r.minutes_late} min de retard`:t(r.note),meta:{recordId:t(r.id),sessionId:t(r.attendance_session_id),studentId:t(r.student_id)}})),
    lessons:lessons.rows.map(r=>record(r,t(r.topic,'Cours'),`${maps.subjectMap.get(t(r.subject_id))||'Matière'} · ${maps.classMap.get(t(r.class_id))||'Classe'}`,{status:r.status,date:r.lesson_date,detail:r.objectives,meta:{lessonId:t(r.id),classId:t(r.class_id),sectionId:t(r.section_id)||null,subjectId:t(r.subject_id)}})),
    assignments:assignments.rows.map(r=>record(r,r.title,`${maps.subjectMap.get(t(r.subject_id))||'Matière'} · ${maps.classMap.get(t(r.class_id))||'Classe'}`,{status:r.status,date:r.due_on,detail:r.description,meta:{assignmentId:t(r.id),classId:t(r.class_id),sectionId:t(r.section_id)||null,subjectId:t(r.subject_id)}})),
    submissions:submissions.rows.map(r=>{const metadata=r.metadata_json&&typeof r.metadata_json==='object'&&!Array.isArray(r.metadata_json)?r.metadata_json as Row:{};const attachmentId=t(metadata.attachment_document_id);const feedback=t(r.feedback);return record(r,studentMap.get(t(r.student_id))||'Soumission élève',assignmentMap.get(t(r.assignment_id))||'Devoir',{status:r.status,date:r.submitted_at,detail:[r.score==null?'En attente de correction':`Score: ${r.score}`,feedback?`Retour: ${feedback}`:''].filter(Boolean).join(' · '),href:attachmentId?`/api/angelcare360/portal-documents?documentId=${encodeURIComponent(attachmentId)}&portal=teacher`:null,meta:{submissionId:t(r.id),assignmentId:t(r.assignment_id),studentId:t(r.student_id),attachmentDocumentId:attachmentId||null}})}),
    exams:exams.rows.filter(teachingScopeAllowed).map(r=>record(r,r.title,`${maps.subjectMap.get(t(r.subject_id))||'Matière'} · ${maps.classMap.get(t(r.class_id))||'Classe'}`,{status:r.status,date:r.scheduled_on,detail:`${t(r.exam_type)} · /${n(r.max_score)}`,meta:{examId:t(r.id),classId:t(r.class_id),sectionId:t(r.section_id)||null,subjectId:t(r.subject_id)}})),
    marks:marks.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Élève',maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.mark_state||r.status,date:r.recorded_at,detail:`${n(r.score)}/${n(r.max_score)}${r.grade?` · ${r.grade}`:''}`,meta:{markId:t(r.id),studentId:t(r.student_id),subjectId:t(r.subject_id),assignmentId:t(r.assignment_id)||null,examId:t(r.exam_id)||null}})),
    reportCards:cards.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Bulletin',t(r.report_card_code),{status:r.status,detail:r.overall_average==null?null:`Moyenne: ${r.overall_average}`})),
    comments:comments.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Appréciation',t(r.comment_type),{status:r.status,detail:r.comment_text,meta:{commentId:t(r.id),studentId:t(r.student_id),classId:t(r.class_id),sectionId:t(r.section_id)||null}})),
    communications:teacherMessages.map(r=>record(r,r.subject,r.message_type,{status:r.status,date:r.sent_at,detail:r.body,meta:{messageId:t(r.id),conversationId:t(r.conversation_id)||null,senderAppUserId:t(r.sender_app_user_id)||null}})),tasks:teacherTasks.rows.map(r=>record(r,t(r.title,'Tâche'),t(r.priority,'Priorité standard'),{status:r.status,date:r.due_at,detail:t(r.description),meta:{taskId:t(r.id),staffProfileId:t(teacherOps?.profileId)||null,orgId:t(teacherOps?.orgId)||null}})),notifications:teacherNotificationRows,leave:teacherLeave.rows.map(r=>record(r,t(r.leave_type,'Congé'),`${t(r.starts_on)} → ${t(r.ends_on)}`,{status:r.status,date:r.created_at,detail:t(r.reason),meta:{leaveRequestId:t(r.id),staffProfileId:t(teacherOps?.profileId)||null,orgId:t(teacherOps?.orgId)||null}})),leavePolicies:teacherLeavePolicies.rows.map(r=>record(r,t(r.label,t(r.leave_type,'Politique de congé')),t(r.leave_type),{status:r.status,detail:r.yearly_allowance_days==null?(r.paid===true?'Rémunéré':null):`${n(r.yearly_allowance_days)} j/an${r.paid===true?' · rémunéré':''}`,meta:{policyId:t(r.id),leaveType:t(r.leave_type)}})),documents:teacherDocuments.rows.map(r=>record(r,r.title,`${t(r.category)} · ${t(r.file_name)}`,{status:r.status,detail:t(r.mime_type),href:`/api/angelcare360/portal-documents?documentId=${encodeURIComponent(t(r.id))}&portal=teacher`,meta:{documentId:t(r.id)}})),profile:[{id:`teacher-profile-${staffId}`,title:t(i.person.full_name,t(i.appUser.full_name,'Enseignant')),subtitle:[t(i.person.staff_code),t(i.person.department)].filter(Boolean).join(' · '),detail:t(i.person.email,t(i.appUser.email)),status:'active',meta:{staffId}},{id:`teacher-security-${staffId}`,title:'Sécurité du compte',subtitle:'Mot de passe et accès',detail:'Votre mot de passe peut être renouvelé depuis le parcours sécurisé.',status:'active',href:'/angelcare-360-access/change-password'}],sourceWarnings:warnings,permissions:['teacher.self','teacher.assigned_classes','teacher.assigned_subjects'],generatedAt:new Date().toISOString(),
  }
}

export async function getParentPortalSnapshot(view='home',selectedStudentId?:string|null):Promise<Angelcare360ParentPortalSnapshot>{
  const i=await requirePortalIdentity('parent'); const db=await createClient(); const schoolId=t(i.school.id); const parentId=t(i.person.id); const warnings:string[]=[]
  const policies=await loadParentRelationshipPolicies(db,schoolId,parentId)
  const policyMap=new Map(policies.map((policy)=>[policy.studentId,policy])); const childIds=policies.map((policy)=>policy.studentId)
  if(selectedStudentId&&!childIds.includes(selectedStudentId)) throw new Error('Cet enfant ne fait pas partie de votre périmètre familial autorisé.')
  const active=selectedStudentId?[selectedStudentId]:childIds
  const financeActive=active.filter((id)=>{const policy=policyMap.get(id);return Boolean(policy&&parentPolicyAllows(policy,'finance'))})
  const pickupActive=active.filter((id)=>{const policy=policyMap.get(id);return Boolean(policy&&parentPolicyAllows(policy,'pickup'))})
  const canReceiveMessages=active.some((id)=>{const policy=policyMap.get(id);return Boolean(policy&&parentPolicyAllows(policy,'messages'))})
  const [familyMemberships,children,attendance,assignments,marks,cards,invoices,payments,transport,recipients,notifications,complaints,documents,pickupRows,meetings,commitments,relationshipComplaints,recoveries,satisfaction,renewals,feedback]=await Promise.all([
    rows(db,'angelcare360_area11_family_memberships',schoolId,{select:'*',filters:[{column:'person_id',value:parentId}],limit:100}),
    rows(db,'angelcare360_students',schoolId,{select:'id,student_code,full_name,first_name,last_name,current_class_id,current_section_id,status',filters:[{column:'id',operator:'in',values:childIds}],limit:100}),
    rows(db,'angelcare360_attendance_records',schoolId,{select:'id,attendance_session_id,student_id,attendance_status,minutes_late,justification_required,note,status',filters:[{column:'student_id',operator:'in',values:active}],limit:MAX_ROWS}),
    rows(db,'angelcare360_assignments',schoolId,{select:'id,assignment_code,class_id,section_id,subject_id,title,description,due_on,max_score,status',limit:MAX_ROWS}),
    rows(db,'angelcare360_marks',schoolId,{select:'id,student_id,subject_id,assessment_type,score,max_score,grade,mark_state,recorded_at,status',filters:[{column:'student_id',operator:'in',values:active}],order:'recorded_at',limit:MAX_ROWS}),
    rows(db,'angelcare360_report_cards',schoolId,{select:'id,report_card_code,student_id,class_id,overall_average,status',filters:[{column:'student_id',operator:'in',values:active}],limit:220}),
    rows(db,'angelcare360_invoices',schoolId,{select:'id,invoice_number,student_id,invoice_date,due_date,total_amount,amount_paid,currency,status',filters:[{column:'student_id',operator:'in',values:financeActive}],order:'invoice_date',limit:220}),
    rows(db,'angelcare360_payments',schoolId,{select:'id,payment_number,student_id,invoice_id,payment_date,amount,allocated_amount,method,status',filters:[{column:'student_id',operator:'in',values:financeActive}],order:'payment_date',limit:220}),
    rows(db,'angelcare360_transport_assignments',schoolId,{select:'id,student_id,route_id,pickup_stop_id,dropoff_stop_id,vehicle_id,assigned_on,status',filters:[{column:'student_id',operator:'in',values:active}],limit:100}),
    canReceiveMessages?rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_parent_id,read_at,delivery_status,status',filters:[{column:'recipient_parent_id',value:parentId}],limit:220}):Promise.resolve({rows:[] as Row[],warnings:[] as string[]}),
    rows(db,'angelcare360_notifications',schoolId,{select:'id,title,body,channel,status,scheduled_for,action_href,recipient_parent_id,recipient_app_user_id',filters:[{column:'recipient_parent_id',value:parentId}],order:'scheduled_for',limit:160}),
    rows(db,'angelcare360_reclamations',schoolId,{select:'id,reclamation_code,subject,description,priority,status,resolution_notes,resolved_at,submitted_by_parent_id',filters:[{column:'submitted_by_parent_id',value:parentId}],limit:160}),
    rows(db,'angelcare360_documents',schoolId,{select:'id,document_code,documentable_type,documentable_id,title,category,file_name,file_path,mime_type,status,metadata_json',filters:[{column:'documentable_id',operator:'in',values:[...active,parentId]}],limit:220}),
    rows(db,'angelcare360_area11_pickup_authorizations',schoolId,{select:'*',filters:[{column:'student_id',operator:'in',values:pickupActive}],order:'created_at',limit:160}),
    rows(db,'angelcare360_area12_meetings',schoolId,{select:'*',filters:[{column:'parent_id',value:parentId}],order:'created_at',limit:160}),
    rows(db,'angelcare360_area12_commitments',schoolId,{select:'*',filters:[{column:'parent_id',value:parentId}],order:'created_at',limit:160}),
    rows(db,'angelcare360_area12_complaints',schoolId,{select:'*',filters:[{column:'parent_id',value:parentId}],order:'created_at',limit:160}),
    rows(db,'angelcare360_area12_service_recoveries',schoolId,{select:'*',filters:[{column:'parent_id',value:parentId}],order:'created_at',limit:160}),
    rows(db,'angelcare360_area12_satisfaction_responses',schoolId,{select:'*',filters:[{column:'parent_id',value:parentId}],order:'created_at',limit:160}),
    rows(db,'angelcare360_area12_renewal_cases',schoolId,{select:'*',filters:[{column:'parent_id',value:parentId}],order:'created_at',limit:160}),
    rows(db,'angelcare360_area12_feedback',schoolId,{select:'*',filters:[{column:'parent_id',value:parentId}],order:'created_at',limit:160}),
  ])
  for(const result of [familyMemberships,children,attendance,assignments,marks,cards,invoices,payments,transport,recipients,notifications,complaints,documents,pickupRows,meetings,commitments,relationshipComplaints,recoveries,satisfaction,renewals,feedback]) warnings.push(...result.warnings)
  const familyIds=uniq(familyMemberships.rows.map((row)=>row.family_id)); const familyId=familyIds.length===1?familyIds[0]:null
  const allFamilyMemberships=await rows(db,'angelcare360_area11_family_memberships',schoolId,{select:'id,family_id,member_type,person_id,student_id,status',filters:[{column:'family_id',operator:'in',values:familyIds}],limit:400}); warnings.push(...allFamilyMemberships.warnings)
  const pickupLinks=await rows(db,'angelcare360_student_parent_links',schoolId,{select:'id,student_id,parent_id,status',filters:[{column:'student_id',operator:'in',values:pickupActive}],limit:300}); warnings.push(...pickupLinks.warnings)
  const studentFamilyMap=new Map<string,string>(); for(const row of allFamilyMemberships.rows){const sid=t(row.student_id),fid=t(row.family_id);if(sid&&fid&&t(row.status,'active')==='active')studentFamilyMap.set(sid,fid)}
  const candidateIds=uniq([...allFamilyMemberships.rows.filter((row)=>t(row.member_type)==='person'&&t(row.status,'active')==='active').map((row)=>row.person_id),...pickupLinks.rows.filter((row)=>t(row.status,'active')==='active').map((row)=>row.parent_id)])
  const pickupAdults=await directRows(db,'angelcare360_parents','id',candidateIds,'id,school_id,full_name,parent_code,status','full_name',300); warnings.push(...pickupAdults.warnings); const pickupAdultMap=new Map(pickupAdults.rows.filter((row)=>t(row.status,'active')==='active').map((row)=>[t(row.id),row]))
  const familyPeople=new Map<string,Set<string>>(); for(const row of allFamilyMemberships.rows){const fid=t(row.family_id),pid=t(row.person_id);if(fid&&pid&&t(row.status,'active')==='active'){const set=familyPeople.get(fid)||new Set<string>();set.add(pid);familyPeople.set(fid,set)}}
  const visibleChildren=children.rows.filter(r=>active.includes(t(r.id))); const childMap=new Map(children.rows.map(r=>[t(r.id),t(r.full_name,`${t(r.first_name)} ${t(r.last_name)}`.trim())])); const classIds=uniq(visibleChildren.map(r=>r.current_class_id))
  const pickupCandidates=pickupActive.flatMap((studentId)=>{const fid=studentFamilyMap.get(studentId);const linked=new Set(pickupLinks.rows.filter((row)=>t(row.student_id)===studentId&&t(row.status,'active')==='active').map((row)=>t(row.parent_id)).filter(Boolean));for(const pid of fid?familyPeople.get(fid)||[]:[])linked.add(pid);return [...linked].map((pid)=>pickupAdultMap.get(pid)).filter(Boolean).map((adult)=>record(adult!,t(adult!.full_name,'Responsable'),childMap.get(studentId)||'Enfant',{status:adult!.status,detail:'Personne du foyer / responsable actif',meta:{studentId,authorizedPersonId:t(adult!.id),familyId:fid||null}}))})
  const parentTeacherAssignments=await rows(db,'angelcare360_teacher_assignments',schoolId,{select:'id,staff_id,class_id,section_id,subject_id,status',filters:[{column:'class_id',operator:'in',values:classIds}],limit:300}); warnings.push(...parentTeacherAssignments.warnings)
  const scopedParentTeacherAssignments=parentTeacherAssignments.rows.filter((row)=>visibleChildren.some((child)=>t(child.current_class_id)===t(row.class_id)&&sectionVisible(row,t(child.current_section_id))))
  const subjectIds=uniq([...marks.rows.map(r=>r.subject_id),...assignments.rows.map(r=>r.subject_id),...scopedParentTeacherAssignments.map(r=>r.subject_id)]); const maps=await mapsFor(db,schoolId,classIds,subjectIds,uniq(visibleChildren.map(r=>r.current_section_id))); warnings.push(...maps.warnings)
  const parentTeacherStaff=await directRows(db,'angelcare360_staff','id',uniq(scopedParentTeacherAssignments.map(r=>r.staff_id)),'id,school_id,full_name,staff_code,status','full_name',300); warnings.push(...parentTeacherStaff.warnings); const parentTeacherStaffMap=new Map(parentTeacherStaff.rows.map(r=>[t(r.id),t(r.full_name,t(r.staff_code,'Enseignant'))]))
  const parentTimetable=await rows(db,'angelcare360_timetable_slots',schoolId,{select:'id,class_id,section_id,subject_id,staff_id,day_of_week,start_time,end_time,room,status',filters:[{column:'class_id',operator:'in',values:classIds}],order:'day_of_week',ascending:true,limit:300}); warnings.push(...parentTimetable.warnings)
  const timetableRecords=visibleChildren.flatMap((child)=>parentTimetable.rows.filter((row)=>t(child.current_class_id)===t(row.class_id)&&sectionVisible(row,t(child.current_section_id))).map((row)=>record(row,maps.subjectMap.get(t(row.subject_id))||'Séance',`${childMap.get(t(child.id))||'Enfant'} · ${t(row.day_of_week)} · ${t(row.start_time)}–${t(row.end_time)}`,{status:row.status,detail:`${maps.classMap.get(t(row.class_id))||'Classe'} · ${t(row.room)}`,meta:{studentId:t(child.id),slotId:t(row.id),classId:t(row.class_id),sectionId:t(row.section_id)||null,subjectId:t(row.subject_id)}})))
  const assignmentRecords=visibleChildren.flatMap((child)=>assignments.rows.filter((row)=>t(child.current_class_id)===t(row.class_id)&&sectionVisible(row,t(child.current_section_id))).map((row)=>record(row,row.title,`${childMap.get(t(child.id))||'Enfant'} · ${maps.subjectMap.get(t(row.subject_id))||'Matière'}`,{status:row.status,date:row.due_on,detail:row.description,meta:{studentId:t(child.id),assignmentId:t(row.id),classId:t(row.class_id),sectionId:t(row.section_id)||null,subjectId:t(row.subject_id)}})))
  const parentAppRecipients=canReceiveMessages?await rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_app_user_id,read_at,delivery_status,status',filters:[{column:'recipient_app_user_id',value:t(i.appUser.id)}],limit:220}):{rows:[] as Row[],warnings:[] as string[]}; warnings.push(...parentAppRecipients.warnings)
  const messageIds=uniq([...recipients.rows,...parentAppRecipients.rows].map(r=>r.message_id)); const receivedMessages=await directRows(db,'angelcare360_messages','id',messageIds,'id,school_id,conversation_id,subject,body,message_type,status,sent_at,sender_app_user_id','sent_at',220); warnings.push(...receivedMessages.warnings)
  const sentMessages=canReceiveMessages?await rows(db,'angelcare360_messages',schoolId,{select:'id,subject,body,message_type,status,sent_at,sender_app_user_id',filters:[{column:'sender_app_user_id',value:t(i.appUser.id)}],order:'sent_at',limit:220}):{rows:[] as Row[],warnings:[] as string[]}; warnings.push(...sentMessages.warnings)
  const parentMessageMap=new Map<string,Row>(); for(const row of [...receivedMessages.rows,...sentMessages.rows]) parentMessageMap.set(t(row.id),row); const messageRows=[...parentMessageMap.values()]
  const receipts=await rows(db,'angelcare360_receipts',schoolId,{select:'id,payment_id,receipt_number,issued_at,status',filters:[{column:'payment_id',operator:'in',values:uniq(payments.rows.map(r=>r.id))}],order:'issued_at',limit:220}); warnings.push(...receipts.warnings)
  const parentOutbox=await internalPortalOutboxRows(db,schoolId,'parent',parentId); warnings.push(...parentOutbox.warnings); const parentNotificationRows=notificationRecords(notifications.rows,parentOutbox.rows)
  const paymentMap=new Map(payments.rows.map(r=>[t(r.id),r]))
  const totalDue=invoices.rows.reduce((sum,r)=>sum+Math.max(0,n(r.total_amount)-n(r.amount_paid)),0)
  return {portal:'parent',school:{id:schoolId,name:t(i.school.name,'Établissement SANILA')},academicYear:{id:t(i.academicYear?.id)||null,label:t(i.academicYear?.label,'Année active')},parent:{id:parentId,appUserId:t(i.appUser.id),code:t(i.person.parent_code)||null,name:t(i.person.full_name,t(i.appUser.full_name,'Responsable')),email:t(i.person.email,t(i.appUser.email))||null,phone:t(i.person.phone)||null},family:{id:familyId,label:familyIds.length>1?`Familles liées · ${familyIds.length}`:childIds.length>1?`Famille · ${childIds.length} enfants`:'Famille'},view,selectedStudentId:selectedStudentId||null,
    metrics:[metric('children','Enfants liés',childIds.length,'Relations familiales actives','blue','/angelcare-360-parent/enfants'),metric('attendance','Alertes présence',attendance.rows.filter(r=>!['present','excused'].includes(t(r.attendance_status))).length,'Absences et retards visibles','amber','/angelcare-360-parent/presences'),metric('finance','Solde autorisé',`${totalDue.toLocaleString('fr-FR')} MAD`,financeActive.length?'Factures des enfants pour lesquels vous avez autorité financière':'Aucune autorité financière active',totalDue>0?'amber':'emerald','/angelcare-360-parent/finance'),metric('messages','Messages',messageRows.length,canReceiveMessages?'Échanges autorisés par votre relation familiale':'Messagerie non autorisée pour cette relation','violet','/angelcare-360-parent/messages')],
    children:children.rows.map(r=>{const policy=policyMap.get(t(r.id));return record(r,childMap.get(t(r.id)),t(r.student_code),{status:r.status,detail:maps.classMap.get(t(r.current_class_id))||'Classe à confirmer',meta:{studentId:t(r.id),classId:t(r.current_class_id),sectionId:t(r.current_section_id)||null,familyId:studentFamilyMap.get(t(r.id))||familyId,isGuardian:Boolean(policy?.isGuardian),isPrimary:Boolean(policy?.isPrimary),canPayFees:Boolean(policy?.canPayFees),canPickup:Boolean(policy?.canPickup),canReceiveMessages:Boolean(policy?.canReceiveMessages)}})}),
    attendance:attendance.rows.map(r=>record(r,childMap.get(t(r.student_id))||'Enfant',t(r.attendance_status),{status:r.attendance_status,detail:r.minutes_late?`${r.minutes_late} min de retard`:t(r.note),meta:{recordId:t(r.id),studentId:t(r.student_id),guardianAllowed:Boolean(policyMap.get(t(r.student_id))&&parentPolicyAllows(policyMap.get(t(r.student_id))!,'guardian'))}})),
    timetable:timetableRecords,assignments:assignmentRecords,
    marks:marks.rows.map(r=>record(r,childMap.get(t(r.student_id))||'Enfant',maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.mark_state||r.status,date:r.recorded_at,detail:`${n(r.score)}/${n(r.max_score)}${r.grade?` · ${r.grade}`:''}`,meta:{studentId:t(r.student_id),markId:t(r.id),subjectId:t(r.subject_id)}})),
    reportCards:cards.rows.map(r=>record(r,childMap.get(t(r.student_id))||'Bulletin',t(r.report_card_code),{status:r.status,detail:r.overall_average==null?null:`Moyenne: ${r.overall_average}`,meta:{studentId:t(r.student_id),reportCardId:t(r.id)}})),
    finance:invoices.rows.map(r=>record(r,t(r.invoice_number,'Facture'),childMap.get(t(r.student_id))||'Enfant',{status:r.status,date:r.due_date,detail:`${n(r.total_amount).toLocaleString('fr-FR')} ${t(r.currency,'MAD')} · payé ${n(r.amount_paid).toLocaleString('fr-FR')}`,meta:{invoiceId:t(r.id),studentId:t(r.student_id),financeAuthorized:true}})),
    payments:payments.rows.map(r=>record(r,t(r.payment_number,'Paiement'),childMap.get(t(r.student_id))||'Enfant',{status:r.status,date:r.payment_date,detail:`${n(r.amount).toLocaleString('fr-FR')} MAD · ${t(r.method)}`,meta:{paymentId:t(r.id),invoiceId:t(r.invoice_id)||null,studentId:t(r.student_id),financeAuthorized:true}})),
    receipts:receipts.rows.map(r=>{const payment=paymentMap.get(t(r.payment_id));return record(r,t(r.receipt_number,'Reçu'),payment?childMap.get(t(payment.student_id))||'Paiement':'Paiement',{status:r.status,date:r.issued_at,detail:payment?`${n(payment.amount).toLocaleString('fr-FR')} MAD · ${t(payment.method)}`:null,meta:{receiptId:t(r.id),paymentId:t(r.payment_id)}})}),
    transport:transport.rows.map(r=>record(r,childMap.get(t(r.student_id))||'Transport enfant','Affectation transport',{status:r.status,date:r.assigned_on,meta:{transportAssignmentId:t(r.id),studentId:t(r.student_id),routeId:t(r.route_id)||null,pickupStopId:t(r.pickup_stop_id)||null,dropoffStopId:t(r.dropoff_stop_id)||null}})),
    pickup:pickupRows.rows.map(r=>{const adult=pickupAdultMap.get(t(r.person_id));return record(r,t(adult?.full_name,t(r.person_label,t(r.person_name,'Personne autorisée'))),childMap.get(t(r.student_id))||'Enfant',{status:r.status,date:r.valid_until||r.created_at,detail:t(r.authorization_type,'Autorisation de sortie'),meta:{pickupAuthorizationId:t(r.id),studentId:t(r.student_id),authorizedPersonId:t(r.person_id),familyId:t(r.family_id)||studentFamilyMap.get(t(r.student_id))||familyId}})}),
    pickupCandidates,
    messages:messageRows.map(r=>record(r,r.subject,r.message_type,{status:r.status,date:r.sent_at,detail:r.body,meta:{messageId:t(r.id),conversationId:t(r.conversation_id)||null,senderAppUserId:t(r.sender_app_user_id)||null}})),
    notifications:parentNotificationRows,
    requests:complaints.rows.map(r=>record(r,r.subject,t(r.reclamation_code),{status:r.status,detail:r.description,meta:{requestId:t(r.id)}})),
    meetings:meetings.rows.map(r=>record(r,t(r.title,'Rendez-vous'),t(r.location,t(r.channel,'Établissement')),{status:r.status,date:r.scheduled_at||r.starts_at||r.created_at,detail:t(r.description),meta:{meetingId:t(r.id),studentId:t(r.student_id)||null,familyId:t(r.family_id)||familyId}})),
    commitments:commitments.rows.map(r=>record(r,t(r.title,'Engagement'),t(r.next_action),{status:r.status,date:r.due_at,detail:t(r.description),meta:{commitmentId:t(r.id),studentId:t(r.student_id)||null}})),
    complaints:relationshipComplaints.rows.length?relationshipComplaints.rows.map(r=>record(r,t(r.title,t(r.subject,'Réclamation')),t(r.priority),{status:r.status,date:r.created_at,detail:t(r.description),meta:{complaintId:t(r.id),studentId:t(r.student_id)||null}})):complaints.rows.map(r=>record(r,r.subject,t(r.reclamation_code),{status:r.status,detail:r.resolution_notes||r.description,meta:{complaintId:t(r.id)}})),
    recoveries:recoveries.rows.map(r=>record(r,t(r.title,'Suivi de résolution'),t(r.next_action),{status:r.status,date:r.due_at,detail:t(r.description),meta:{recoveryId:t(r.id),studentId:t(r.student_id)||null}})),
    satisfaction:satisfaction.rows.map(r=>record(r,t(r.title,'Réponse satisfaction'),t(r.campaign_label,t(r.score,'Retour famille')),{status:r.status,date:r.created_at,detail:t(r.description,t(r.comment)),meta:{satisfactionId:t(r.id),studentId:t(r.student_id)||null}})),
    renewals:renewals.rows.map(r=>record(r,t(r.title,'Réinscription'),t(r.next_action),{status:r.status,date:r.due_at,detail:t(r.description),meta:{renewalId:t(r.id),studentId:t(r.student_id)||null}})),
    feedback:feedback.rows.map(r=>record(r,t(r.title,'Feedback famille'),t(r.category,t(r.feedback_type)),{status:r.status,date:r.created_at,detail:t(r.description,t(r.comment)),meta:{feedbackId:t(r.id),studentId:t(r.student_id)||null}})),
    documents:documents.rows.map(r=>record(r,r.title,`${t(r.category)} · ${t(r.file_name)}`,{status:r.status,detail:t(r.mime_type),href:`/api/angelcare360/portal-documents?documentId=${encodeURIComponent(t(r.id))}&portal=parent`,meta:{documentId:t(r.id),studentId:childIds.includes(t(r.documentable_id))?t(r.documentable_id):null}})),
    teacherContacts:scopedParentTeacherAssignments.map(r=>record(r,parentTeacherStaffMap.get(t(r.staff_id))||'Enseignant',maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.status,detail:`${maps.classMap.get(t(r.class_id))||'Classe'}${r.section_id?` · ${maps.sectionMap.get(t(r.section_id))||'Section'}`:''}`,meta:{teacherAssignmentId:t(r.id),staffId:t(r.staff_id),classId:t(r.class_id),sectionId:t(r.section_id)||null,subjectId:t(r.subject_id)}})),
    account:[{id:`parent-contact-${parentId}`,title:'Coordonnées famille',subtitle:t(i.person.phone,'Téléphone non renseigné'),detail:[t(i.person.whatsapp)&&`WhatsApp ${t(i.person.whatsapp)}`,t(i.person.address),`Langue ${t(i.person.preferred_language,'fr')}`].filter(Boolean).join(' · '),status:'active',meta:{parentId}},{id:`parent-security-${parentId}`,title:'Sécurité du compte',subtitle:t(i.appUser.username,t(i.appUser.email,'Identité SANILA')),detail:'Mot de passe et sécurité du compte.',status:'active',href:'/angelcare-360-access/change-password'}],
    sourceWarnings:warnings,permissions:['parent.self','parent.linked_children',...(financeActive.length?['parent.authorized_finance']:[]),...(pickupActive.length?['parent.authorized_pickup']:[]),...(canReceiveMessages?['parent.authorized_messages']:[])],generatedAt:new Date().toISOString()}
}

export async function getStudentPortalSnapshot(view='today'):Promise<Angelcare360StudentPortalSnapshot>{
  const i=await requirePortalIdentity('student'); const db=await createClient(); const schoolId=t(i.school.id); const studentId=t(i.person.id); const classId=t(i.person.current_class_id); const sectionId=t(i.person.current_section_id); const warnings:string[]=[]
  const [timetable,classSubjects,lessons,assignments,submissions,marks,cards,attendance,library,notifications,recipients,documents,exams]=await Promise.all([
    rows(db,'angelcare360_timetable_slots',schoolId,{select:'id,class_id,section_id,subject_id,staff_id,day_of_week,start_time,end_time,room,status',filters:[{column:'class_id',value:classId}],order:'day_of_week',ascending:true,limit:220}),rows(db,'angelcare360_class_subjects',schoolId,{select:'id,class_id,subject_id,teacher_id,coefficient,is_required,status',filters:[{column:'class_id',value:classId}],limit:150}),rows(db,'angelcare360_lessons',schoolId,{select:'id,lesson_code,lesson_date,class_id,section_id,subject_id,topic,objectives,status',filters:[{column:'class_id',value:classId}],order:'lesson_date',limit:220}),rows(db,'angelcare360_assignments',schoolId,{select:'id,assignment_code,class_id,section_id,subject_id,title,description,due_on,max_score,status',filters:[{column:'class_id',value:classId}],order:'due_on',limit:220}),rows(db,'angelcare360_assignment_submissions',schoolId,{select:'id,assignment_id,student_id,submitted_at,score,feedback,status,metadata_json',filters:[{column:'student_id',value:studentId}],order:'submitted_at',limit:220}),rows(db,'angelcare360_marks',schoolId,{select:'id,student_id,subject_id,assessment_type,score,max_score,grade,mark_state,recorded_at,status',filters:[{column:'student_id',value:studentId}],order:'recorded_at',limit:250}),rows(db,'angelcare360_report_cards',schoolId,{select:'id,report_card_code,student_id,overall_average,status',filters:[{column:'student_id',value:studentId}],limit:80}),rows(db,'angelcare360_attendance_records',schoolId,{select:'id,attendance_session_id,student_id,attendance_status,minutes_late,justification_required,note,status',filters:[{column:'student_id',value:studentId}],limit:250}),rows(db,'angelcare360_library_loans',schoolId,{select:'id,copy_id,borrower_student_id,loaned_at,due_at,returned_at,fine_amount,status',filters:[{column:'borrower_student_id',value:studentId}],order:'loaned_at',limit:160}),rows(db,'angelcare360_notifications',schoolId,{select:'id,title,body,channel,status,scheduled_for,action_href,recipient_student_id,recipient_app_user_id',filters:[{column:'recipient_student_id',value:studentId}],order:'scheduled_for',limit:160}),rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_student_id,read_at,delivery_status,status',filters:[{column:'recipient_student_id',value:studentId}],limit:220}),rows(db,'angelcare360_documents',schoolId,{select:'id,document_code,documentable_type,documentable_id,title,category,file_name,file_path,mime_type,status',filters:[{column:'documentable_id',value:studentId}],limit:180}),
    rows(db,'angelcare360_exams',schoolId,{select:'id,exam_code,class_id,section_id,subject_id,title,exam_type,scheduled_on,max_score,status',filters:[{column:'class_id',value:classId}],order:'scheduled_on',limit:180}),
  ]); for(const result of [timetable,classSubjects,lessons,assignments,submissions,marks,cards,attendance,library,notifications,recipients,documents,exams]) warnings.push(...result.warnings)
  const scopedTimetable=timetable.rows.filter(r=>sectionVisible(r,sectionId)); const scopedLessons=lessons.rows.filter(r=>sectionVisible(r,sectionId)); const scopedAssignments=assignments.rows.filter(r=>sectionVisible(r,sectionId)); const scopedExams=exams.rows.filter(r=>sectionVisible(r,sectionId))
  const studentTeacherAssignments=await rows(db,'angelcare360_teacher_assignments',schoolId,{select:'id,staff_id,class_id,section_id,subject_id,status',filters:[{column:'class_id',value:classId}],limit:200}); warnings.push(...studentTeacherAssignments.warnings); const scopedStudentTeacherAssignments=studentTeacherAssignments.rows.filter(r=>sectionVisible(r,sectionId))
  const subjectIds=uniq([...classSubjects.rows.map(r=>r.subject_id),...scopedStudentTeacherAssignments.map(r=>r.subject_id)]); const maps=await mapsFor(db,schoolId,classId?[classId]:[],subjectIds,sectionId?[sectionId]:[]); warnings.push(...maps.warnings)
  const teacherStaff=await directRows(db,'angelcare360_staff','id',uniq(scopedStudentTeacherAssignments.map(r=>r.staff_id)),'id,school_id,full_name,staff_code,status','full_name',200); warnings.push(...teacherStaff.warnings); const teacherStaffMap=new Map(teacherStaff.rows.map(r=>[t(r.id),t(r.full_name,t(r.staff_code,'Enseignant'))]))
  const studentOutbox=await internalPortalOutboxRows(db,schoolId,'student',studentId); warnings.push(...studentOutbox.warnings); const studentNotificationRows=notificationRecords(notifications.rows,studentOutbox.rows)
  const copies=await directRows(db,'angelcare360_library_copies','id',uniq(library.rows.map(r=>r.copy_id)),'id,school_id,book_id,copy_code,barcode,status','copy_code',200); warnings.push(...copies.warnings); const copyMap=new Map(copies.rows.map(r=>[t(r.id),r])); const books=await directRows(db,'angelcare360_library_books','id',uniq(copies.rows.map(r=>r.book_id)),'id,school_id,title,author,isbn,status','title',200); warnings.push(...books.warnings); const bookMap=new Map(books.rows.map(r=>[t(r.id),r]))
  const assignmentMap=new Map(scopedAssignments.map(r=>[t(r.id),t(r.title,t(r.assignment_code))])); const studentAppRecipients=await rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_app_user_id,read_at,delivery_status,status',filters:[{column:'recipient_app_user_id',value:t(i.appUser.id)}],limit:220}); warnings.push(...studentAppRecipients.warnings); const messageIds=uniq([...recipients.rows,...studentAppRecipients.rows].map(r=>r.message_id)); const messages=await directRows(db,'angelcare360_messages','id',messageIds,'id,school_id,conversation_id,subject,body,message_type,status,sent_at,sender_app_user_id','sent_at',220); warnings.push(...messages.warnings)
  return {portal:'student',school:{id:schoolId,name:t(i.school.name,'Établissement SANILA')},academicYear:{id:t(i.academicYear?.id)||null,label:t(i.academicYear?.label,'Année active')},student:{id:studentId,appUserId:t(i.appUser.id),code:t(i.person.student_code)||null,name:t(i.person.full_name,t(i.appUser.full_name,'Élève')),classLabel:maps.classMap.get(classId)||null,sectionLabel:maps.sectionMap.get(sectionId)||null},view,metrics:[metric('today','Cours planifiés',scopedTimetable.length,'Planning de votre classe','blue','/angelcare-360-student/emploi-du-temps'),metric('homework','Devoirs',scopedAssignments.filter(r=>!['archived','cancelled'].includes(t(r.status))).length,'Travail publié pour votre classe','violet','/angelcare-360-student/devoirs'),metric('attendance','Absences / retards',attendance.rows.filter(r=>!['present','excused'].includes(t(r.attendance_status))).length,'Votre historique personnel','amber','/angelcare-360-student/presences'),metric('library','Prêts actifs',library.rows.filter(r=>!r.returned_at&&['open','overdue'].includes(t(r.status))).length,'Bibliothèque personnelle','emerald','/angelcare-360-student/bibliotheque')],timetable:scopedTimetable.map(r=>record(r,maps.subjectMap.get(t(r.subject_id))||'Séance',`${t(r.day_of_week)} · ${t(r.start_time)}–${t(r.end_time)}`,{status:r.status,detail:t(r.room)})),subjects:classSubjects.rows.map(r=>record(r,maps.subjectMap.get(t(r.subject_id))||'Matière',r.is_required===false?'Option':'Matière du programme',{status:r.status,detail:`Coefficient ${n(r.coefficient,1)}`})),lessons:scopedLessons.map(r=>record(r,t(r.topic,'Cours'),maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.status,date:r.lesson_date,detail:r.objectives})),assignments:scopedAssignments.map(r=>record(r,r.title,maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.status,date:r.due_on,detail:r.description,meta:{assignmentId:t(r.id),classId:t(r.class_id),sectionId:t(r.section_id)||null,subjectId:t(r.subject_id)}})),submissions:submissions.rows.map(r=>{const metadata=r.metadata_json&&typeof r.metadata_json==='object'&&!Array.isArray(r.metadata_json)?r.metadata_json as Row:{};const attachmentId=t(metadata.attachment_document_id);const feedback=t(r.feedback);return record(r,assignmentMap.get(t(r.assignment_id))||'Remise','Votre soumission',{status:r.status,date:r.submitted_at,detail:[r.score==null?'Enregistrée':`Score: ${r.score}`,feedback?`Retour: ${feedback}`:''].filter(Boolean).join(' · '),href:attachmentId?`/api/angelcare360/portal-documents?documentId=${encodeURIComponent(attachmentId)}&portal=student`:null,meta:{submissionId:t(r.id),assignmentId:t(r.assignment_id),attachmentDocumentId:attachmentId||null}})}),exams:scopedExams.map(r=>record(r,t(r.title,'Évaluation'),maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.status,date:r.scheduled_on,detail:`${t(r.exam_type)} · /${n(r.max_score)}`})),marks:marks.rows.map(r=>record(r,maps.subjectMap.get(t(r.subject_id))||'Résultat',t(r.assessment_type),{status:r.mark_state||r.status,date:r.recorded_at,detail:`${n(r.score)}/${n(r.max_score)}${r.grade?` · ${r.grade}`:''}`})),reportCards:cards.rows.map(r=>record(r,t(r.report_card_code,'Bulletin'),'Bulletin publié',{status:r.status,detail:r.overall_average==null?null:`Moyenne: ${r.overall_average}`})),attendance:attendance.rows.map(r=>record(r,t(r.attendance_status,'Présence'),'Historique personnel',{status:r.attendance_status,detail:r.minutes_late?`${r.minutes_late} min de retard`:t(r.note)})),library:library.rows.map(r=>{const copy=copyMap.get(t(r.copy_id));const book=copy?bookMap.get(t(copy.book_id)):null;return record(r,t(book?.title,'Ouvrage bibliothèque'),t(book?.author,t(copy?.copy_code,t(r.copy_id))),{status:r.status,date:r.due_at,detail:r.returned_at?`Retourné le ${r.returned_at}`:r.fine_amount?`Pénalité: ${r.fine_amount} MAD`:'En circulation',meta:{loanId:t(r.id),copyId:t(r.copy_id),bookId:t(copy?.book_id)||null}})}),messages:messages.rows.map(r=>record(r,r.subject,r.message_type,{status:r.status,date:r.sent_at,detail:r.body,meta:{messageId:t(r.id),conversationId:t(r.conversation_id)||null,senderAppUserId:t(r.sender_app_user_id)||null}})),notifications:studentNotificationRows,documents:documents.rows.map(r=>record(r,r.title,`${t(r.category)} · ${t(r.file_name)}`,{status:r.status,detail:t(r.mime_type),href:`/api/angelcare360/portal-documents?documentId=${encodeURIComponent(t(r.id))}&portal=student`,meta:{documentId:t(r.id)}})),teacherContacts:scopedStudentTeacherAssignments.map(r=>record(r,teacherStaffMap.get(t(r.staff_id))||'Enseignant',maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.status,detail:`${maps.classMap.get(t(r.class_id))||'Classe'}${r.section_id?` · ${maps.sectionMap.get(t(r.section_id))||'Section'}`:''}`,meta:{teacherAssignmentId:t(r.id),staffId:t(r.staff_id),classId:t(r.class_id),sectionId:t(r.section_id)||null,subjectId:t(r.subject_id)}})),profile:[{id:`student-profile-${studentId}`,title:t(i.person.full_name,t(i.appUser.full_name,'Élève')),subtitle:[t(i.person.student_code),maps.classMap.get(classId),maps.sectionMap.get(sectionId)].filter(Boolean).join(' · '),detail:t(i.appUser.email,t(i.appUser.username)),status:'active',meta:{studentId}},{id:`student-security-${studentId}`,title:'Sécurité du compte',subtitle:'Mot de passe et accès',detail:'Accès personnel SANILA.',status:'active',href:'/angelcare-360-access/change-password'}],sourceWarnings:warnings,permissions:['student.self','student.class_published_content'],generatedAt:new Date().toISOString()}
}

export async function getStaffPortalSnapshot(view='today'):Promise<Angelcare360StaffPortalSnapshot>{
  const i=await requirePortalIdentity('staff'); const db=await createClient(); const schoolId=t(i.school.id); const staffId=t(i.person.id); const warnings:string[]=[]
  let ops:{orgId:string;profileId:string;department:string}|null=null
  try { ops=await resolveStaffOperationalScope(db,i.school,i.person) } catch(error) { warnings.push(error instanceof Error?error.message:'Staff OS indisponible') }
  const emptyOps=()=>Promise.resolve({rows:[] as Row[],warnings:ops?[]:['Staff OS non relié']})
  const [schedule,notifications,recipients,documents,payroll,attendance,leave,tasks,workflows,tickets,team]=await Promise.all([
    rows(db,'angelcare360_timetable_slots',schoolId,{select:'id,staff_id,class_id,section_id,subject_id,day_of_week,start_time,end_time,room,status',filters:[{column:'staff_id',value:staffId}],order:'day_of_week',ascending:true,limit:220}),
    rows(db,'angelcare360_notifications',schoolId,{select:'id,title,body,channel,status,scheduled_for,action_href,recipient_staff_id,recipient_app_user_id',filters:[{column:'recipient_staff_id',value:staffId}],order:'scheduled_for',limit:160}),
    rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_staff_id,read_at,delivery_status,status',filters:[{column:'recipient_staff_id',value:staffId}],limit:220}),
    rows(db,'angelcare360_documents',schoolId,{select:'id,document_code,documentable_type,documentable_id,title,category,file_name,file_path,mime_type,status',filters:[{column:'documentable_id',value:staffId}],limit:180}),
    rows(db,'angelcare360_payroll_records',schoolId,{select:'id,payroll_number,payroll_period_id,staff_id,base_salary,bonuses_total,deductions_total,gross_amount,net_amount,payment_status,paid_at,status',filters:[{column:'staff_id',value:staffId}],limit:80}),
    ops?orgRows(db,'ac360_school_attendance_records',ops.orgId,{filters:[{column:'staff_profile_id',value:ops.profileId}],order:'recorded_at',limit:220}):emptyOps(),
    ops?orgRows(db,'ac360_school_leave_requests',ops.orgId,{filters:[{column:'staff_profile_id',value:ops.profileId}],order:'created_at',limit:160}):emptyOps(),
    ops?orgRows(db,'ac360_school_tasks',ops.orgId,{filters:[{column:'assigned_staff_id',value:ops.profileId}],order:'due_at',limit:200}):emptyOps(),
    rows(db,'angelcare360_workflow_instances',schoolId,{filters:[{column:'owner_app_user_id',value:t(i.appUser.id)}],order:'created_at',limit:160}),
    ops?orgRows(db,'ac360_school_incident_reports',ops.orgId,{filters:[{column:'reported_by_staff_id',value:ops.profileId}],order:'occurred_at',limit:160}):emptyOps(),
    ops?orgRows(db,'ac360_school_staff_profiles',ops.orgId,{select:'id,staff_code,full_name,email,department,role_label,status',filters:ops.department?[{column:'department',value:ops.department}]:[],order:'full_name',ascending:true,limit:120}):emptyOps(),
  ]); for(const result of [schedule,notifications,recipients,documents,payroll,attendance,leave,tasks,workflows,tickets,team]) warnings.push(...result.warnings)
  const leavePolicies=ops?await orgRows(db,'ac360_school_leave_policies',ops.orgId,{select:'id,policy_key,label,leave_type,yearly_allowance_days,paid,requires_approval,status',filters:[{column:'status',value:'active'}],order:'label',ascending:true,limit:80}):{rows:[] as Row[],warnings:[] as string[]}; warnings.push(...leavePolicies.warnings)
  const workflowDefinitions=await directRows(db,'angelcare360_workflow_definitions','id',uniq(workflows.rows.map(r=>r.definition_id)),'id,school_id,workflow_key,version,transition_schema,status',undefined,200); warnings.push(...workflowDefinitions.warnings); const workflowDefinitionMap=new Map(workflowDefinitions.rows.map(r=>[t(r.id),r]))
  const staffAppRecipients=await rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_app_user_id,read_at,delivery_status,status',filters:[{column:'recipient_app_user_id',value:t(i.appUser.id)}],limit:220}); warnings.push(...staffAppRecipients.warnings)
  const messageIds=uniq([...recipients.rows,...staffAppRecipients.rows].map(r=>r.message_id)); const messages=await directRows(db,'angelcare360_messages','id',messageIds,'id,school_id,conversation_id,subject,body,message_type,status,sent_at,sender_app_user_id','sent_at',220); warnings.push(...messages.warnings)
  const coreTeam=await rows(db,'angelcare360_staff',schoolId,{select:'id,staff_code,full_name,email,department,staff_type,status',filters:[{column:'staff_code',operator:'in',values:uniq(team.rows.map(r=>r.staff_code))}],order:'full_name',ascending:true,limit:160}); warnings.push(...coreTeam.warnings); const coreTeamByCode=new Map(coreTeam.rows.map(r=>[t(r.staff_code),r]))
  const staffOutbox=await internalPortalOutboxRows(db,schoolId,'staff',staffId); warnings.push(...staffOutbox.warnings); const staffNotificationRows=notificationRecords(notifications.rows,staffOutbox.rows)
  return {portal:'staff',school:{id:schoolId,name:t(i.school.name,'Établissement SANILA')},academicYear:{id:t(i.academicYear?.id)||null,label:t(i.academicYear?.label,'Année active')},staff:{id:staffId,appUserId:t(i.appUser.id),code:t(i.person.staff_code)||null,name:t(i.person.full_name,t(i.appUser.full_name,'Collaborateur')),email:t(i.person.email,t(i.appUser.email))||null,department:t(i.person.department)||null,position:t(i.person.staff_type)||null},view,metrics:[metric('schedule','Planning',schedule.rows.length,'Affectations visibles','blue','/angelcare-360-staff/planning'),metric('documents','Documents',documents.rows.length,'Documents professionnels autorisés','violet','/angelcare-360-staff/documents'),metric('notifications','Notifications',staffNotificationRows.length,'Informations rattachées à votre compte','emerald','/angelcare-360-staff/notifications'),metric('history','Paies historiques',payroll.rows.length,'Continuité personnelle','amber','/angelcare-360-staff/historique')],schedule:schedule.rows.map(r=>record(r,'Affectation planning',`${t(r.day_of_week)} · ${t(r.start_time)}–${t(r.end_time)}`,{status:r.status,detail:t(r.room)})),attendance:attendance.rows.map(r=>record(r,t(r.attendance_status,'Présence'),t(r.recorded_at,'Pointage'),{status:r.attendance_status,date:r.recorded_at,detail:t(r.reason)})),leave:leave.rows.map(r=>record(r,t(r.leave_type,'Congé'),`${t(r.starts_on)} → ${t(r.ends_on)}`,{status:r.status,date:r.created_at,detail:t(r.reason)})),leavePolicies:leavePolicies.rows.map(r=>record(r,t(r.label,t(r.leave_type,'Politique de congé')),t(r.leave_type),{status:r.status,detail:r.yearly_allowance_days==null?(r.paid===true?'Rémunéré':null):`${n(r.yearly_allowance_days)} j/an${r.paid===true?' · rémunéré':''}`,meta:{policyId:t(r.id),leaveType:t(r.leave_type)}})),tasks:tasks.rows.map(r=>record(r,t(r.title,'Tâche'),t(r.priority,'Priorité standard'),{status:r.status,date:r.due_at,detail:t(r.description),meta:{taskId:t(r.id),orgId:t(ops?.orgId)||null,staffProfileId:t(ops?.profileId)||null}})),approvals:workflows.rows.map(r=>{const definition=workflowDefinitionMap.get(t(r.definition_id));const allowed=workflowTargets(definition?.transition_schema,t(r.current_state)).filter(v=>['approved','rejected'].includes(v));return{row:r,allowed}}).filter(x=>x.allowed.length>0).map(({row:r,allowed})=>record(r,t(r.workflow_key,'Approbation'),t(r.current_state,'Décision attendue'),{status:r.status,date:r.updated_at,detail:t(r.context_json&&typeof r.context_json==='object'?(r.context_json as Row).summary:null),meta:{workflowInstanceId:t(r.id),currentState:t(r.current_state),allowedTransitions:allowed.join(',')}})),workflows:workflows.rows.map(r=>{const definition=workflowDefinitionMap.get(t(r.definition_id));const allowed=workflowTargets(definition?.transition_schema,t(r.current_state));return record(r,t(r.workflow_key,'Workflow'),t(r.current_state,'État'),{status:r.status,date:r.updated_at,detail:t(r.context_json&&typeof r.context_json==='object'?(r.context_json as Row).summary:null),meta:{workflowInstanceId:t(r.id),currentState:t(r.current_state),allowedTransitions:allowed.join(',')}})}),tickets:tickets.rows.map(r=>record(r,t(r.incident_code,'Signalement'),t(r.incident_type,'Incident'),{status:r.status,date:r.occurred_at,detail:t(r.description),meta:{incidentId:t(r.id),orgId:t(ops?.orgId)||null,staffProfileId:t(ops?.profileId)||null}})),documents:documents.rows.map(r=>record(r,r.title,`${t(r.category)} · ${t(r.file_name)}`,{status:r.status,detail:t(r.mime_type),href:`/api/angelcare360/portal-documents?documentId=${encodeURIComponent(t(r.id))}&portal=staff`,meta:{documentId:t(r.id)}})),messages:messages.rows.map(r=>record(r,r.subject,r.message_type,{status:r.status,date:r.sent_at,detail:r.body,meta:{messageId:t(r.id),conversationId:t(r.conversation_id)||null,senderAppUserId:t(r.sender_app_user_id)||null}})),notifications:staffNotificationRows,team:team.rows.filter(r=>t(r.id)!==t(ops?.profileId)).map(r=>{const core=coreTeamByCode.get(t(r.staff_code));return record(r,t(r.full_name,t(r.staff_code,'Collaborateur')),t(r.department,t(r.role_label)),{status:r.status,detail:t(r.email),meta:{staffProfileId:t(r.id),staffId:t(core?.id)||null,staffCode:t(r.staff_code)}})}),history:payroll.rows.map(r=>record(r,t(r.payroll_number,'Paie'),t(r.payment_status),{status:r.status,date:r.paid_at,detail:`Net ${n(r.net_amount).toLocaleString('fr-FR')} MAD`})),profile:[{id:`staff-profile-${staffId}`,title:t(i.person.full_name,t(i.appUser.full_name,'Collaborateur')),subtitle:[t(i.person.staff_code),t(i.person.department),t(i.person.staff_type)].filter(Boolean).join(' · '),detail:t(i.person.email,t(i.appUser.email)),status:'active',meta:{staffId}},{id:`staff-security-${staffId}`,title:'Sécurité du compte',subtitle:'Mot de passe et accès',detail:'Accès personnel SANILA.',status:'active',href:'/angelcare-360-access/change-password'}],sourceWarnings:warnings,permissions:['staff.self','staff.assigned_work'],generatedAt:new Date().toISOString()}
}
