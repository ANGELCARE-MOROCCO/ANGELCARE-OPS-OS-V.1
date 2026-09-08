import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PORTAL_ROLE_KEYS } from '@/data/angelcare360/role-portals'
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
function record(row: Row, title: unknown, subtitle?: unknown, options?: { detail?: unknown; status?: unknown; date?: unknown; meta?: Record<string,string|number|boolean|null> }): Angelcare360PortalRecord {
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

function loginRoute(kind:Angelcare360PortalKind){ return `/angelcare-360-${kind}/login` }

export async function requirePortalIdentity(kind:Angelcare360PortalKind): Promise<PortalIdentity> {
  const user=await getCurrentAppUser()
  if (!user) redirect(loginRoute(kind))
  const role=t((user as Row).role).toLowerCase()
  if (!PORTAL_ROLE_KEYS[kind].includes(role)) redirect('/unauthorized')

  const db=await createClient()
  const table=kind==='parent'?'angelcare360_parents':kind==='student'?'angelcare360_students':'angelcare360_staff'
  const personResult=await bounded(
    db.from(table).select('*').eq('portal_app_user_id',(user as Row).id).eq('status','active').limit(2),
    `${table}.portal_identity`,
  )
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
  const studentIds=uniq(enroll.rows.map(r=>r.student_id))
  const [students,timetable,lessons,assignments,exams,comments,notifications,messages,cards]=await Promise.all([
    rows(db,'angelcare360_students',schoolId,{select:'id,student_code,full_name,first_name,last_name,current_class_id,current_section_id,status',filters:[{column:'id',operator:'in',values:studentIds}],limit:MAX_ROWS}),
    rows(db,'angelcare360_timetable_slots',schoolId,{select:'id,class_id,section_id,subject_id,staff_id,day_of_week,start_time,end_time,room,status',filters:[{column:'staff_id',value:staffId}],order:'day_of_week',ascending:true,limit:220}),
    rows(db,'angelcare360_lessons',schoolId,{select:'id,lesson_code,lesson_date,class_id,section_id,subject_id,staff_id,topic,objectives,status',filters:[{column:'staff_id',value:staffId}],order:'lesson_date',limit:220}),
    rows(db,'angelcare360_assignments',schoolId,{select:'id,assignment_code,class_id,section_id,subject_id,created_by_staff_id,title,description,due_on,max_score,status',filters:[{column:'created_by_staff_id',value:staffId}],order:'due_on',limit:220}),
    rows(db,'angelcare360_exams',schoolId,{select:'id,exam_code,class_id,section_id,subject_id,title,exam_type,scheduled_on,max_score,status',filters:[{column:'class_id',operator:'in',values:classIds}],order:'scheduled_on',limit:220}),
    rows(db,'angelcare360_teacher_comments',schoolId,{select:'id,student_id,class_id,section_id,staff_id,comment_type,comment_text,status',filters:[{column:'staff_id',value:staffId}],limit:180}),
    rows(db,'angelcare360_notifications',schoolId,{select:'id,title,body,channel,status,scheduled_for,recipient_staff_id,recipient_app_user_id',filters:[{column:'recipient_staff_id',value:staffId}],order:'scheduled_for',limit:120}),
    rows(db,'angelcare360_messages',schoolId,{select:'id,subject,body,message_type,sender_role,status,sent_at,sender_app_user_id',filters:[{column:'sender_app_user_id',value:t(i.appUser.id)}],order:'sent_at',limit:120}),
    rows(db,'angelcare360_report_cards',schoolId,{select:'id,report_card_code,student_id,class_id,overall_average,status',filters:[{column:'student_id',operator:'in',values:studentIds}],limit:220}),
  ])
  for(const result of [students,timetable,lessons,assignments,exams,comments,notifications,messages,cards]) warnings.push(...result.warnings)
  const assignmentIds=uniq(assignments.rows.map(r=>r.id))
  const [submissions,marks,sessions]=await Promise.all([
    rows(db,'angelcare360_assignment_submissions',schoolId,{select:'id,assignment_id,student_id,submitted_at,score,status',filters:[{column:'assignment_id',operator:'in',values:assignmentIds}],order:'submitted_at',limit:MAX_ROWS}),
    rows(db,'angelcare360_marks',schoolId,{select:'id,student_id,subject_id,assignment_id,exam_id,assessment_type,score,max_score,grade,mark_state,recorded_at,status',filters:[{column:'student_id',operator:'in',values:studentIds},{column:'subject_id',operator:'in',values:subjectIds}],order:'recorded_at',limit:MAX_ROWS}),
    rows(db,'angelcare360_attendance_sessions',schoolId,{select:'id,class_id,section_id,session_date,session_type,status,total_expected,total_present,total_absent,total_late',filters:[{column:'class_id',operator:'in',values:classIds}],order:'session_date',limit:220}),
  ])
  for(const result of [submissions,marks,sessions]) warnings.push(...result.warnings)
  const sessionIds=uniq(sessions.rows.map(r=>r.id))
  const attendance=await rows(db,'angelcare360_attendance_records',schoolId,{select:'id,attendance_session_id,student_id,attendance_status,minutes_late,justification_required,note,status',filters:[{column:'attendance_session_id',operator:'in',values:sessionIds},{column:'student_id',operator:'in',values:studentIds}],limit:MAX_ROWS}); warnings.push(...attendance.warnings)
  const studentMap=new Map(students.rows.map(r=>[t(r.id),t(r.full_name,`${t(r.first_name)} ${t(r.last_name)}`.trim())])); const assignmentMap=new Map(assignments.rows.map(r=>[t(r.id),t(r.title,t(r.assignment_code))]))
  return {
    portal:'teacher',school:{id:schoolId,name:t(i.school.name,'Établissement SANILA')},academicYear:{id:t(i.academicYear?.id)||null,label:t(i.academicYear?.label,'Année active')},teacher:{id:staffId,appUserId:t(i.appUser.id),code:t(i.person.staff_code)||null,name:t(i.person.full_name,t(i.appUser.full_name,'Enseignant')),email:t(i.person.email,t(i.appUser.email))||null,department:t(i.person.department)||null},view,
    metrics:[metric('classes','Classes attribuées',classIds.length,'Périmètre pédagogique autorisé','blue','/angelcare-360-teacher/classes'),metric('students','Élèves suivis',studentIds.length,'Uniquement dans vos classes','emerald','/angelcare-360-teacher/classes'),metric('homework','Devoirs',assignments.rows.length,'Créés sous votre identité','violet','/angelcare-360-teacher/devoirs'),metric('pending','Remises à traiter',submissions.rows.filter(r=>!['graded','returned'].includes(t(r.status))).length,'Travaux reçus à suivre','amber','/angelcare-360-teacher/soumissions')],
    classes:assigned.rows.map(r=>record(r,maps.classMap.get(t(r.class_id))||'Classe attribuée',`${maps.subjectMap.get(t(r.subject_id))||'Matière'}${r.section_id?` · ${maps.sectionMap.get(t(r.section_id))||'Section'}`:''}`,{status:r.status,detail:`${n(r.weekly_hours)} h/semaine · ${t(r.assignment_role,'enseignant')}`})),
    students:students.rows.map(r=>record(r,studentMap.get(t(r.id)),t(r.student_code),{status:r.status,meta:{studentId:t(r.id),classId:t(r.current_class_id),sectionId:t(r.current_section_id)}})),
    subjects:subjectIds.map(id=>({id,title:maps.subjectMap.get(id)||'Matière',tone:'slate' as const,meta:{subjectId:id}})),
    timetable:timetable.rows.map(r=>record(r,maps.subjectMap.get(t(r.subject_id))||'Séance',`${maps.classMap.get(t(r.class_id))||'Classe'} · ${t(r.room,'Salle à confirmer')}`,{status:r.status,detail:`${t(r.day_of_week)} · ${t(r.start_time)}–${t(r.end_time)}`})),
    attendance:attendance.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Élève',t(r.attendance_status),{status:r.attendance_status,detail:r.minutes_late?`${r.minutes_late} min de retard`:t(r.note)})),
    lessons:lessons.rows.map(r=>record(r,t(r.topic,'Cours'),`${maps.subjectMap.get(t(r.subject_id))||'Matière'} · ${maps.classMap.get(t(r.class_id))||'Classe'}`,{status:r.status,date:r.lesson_date,detail:r.objectives})),
    assignments:assignments.rows.map(r=>record(r,r.title,`${maps.subjectMap.get(t(r.subject_id))||'Matière'} · ${maps.classMap.get(t(r.class_id))||'Classe'}`,{status:r.status,date:r.due_on,detail:r.description})),
    submissions:submissions.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Soumission élève',assignmentMap.get(t(r.assignment_id))||'Devoir',{status:r.status,date:r.submitted_at,detail:r.score==null?'En attente de correction':`Score: ${r.score}`})),
    exams:exams.rows.map(r=>record(r,r.title,`${maps.subjectMap.get(t(r.subject_id))||'Matière'} · ${maps.classMap.get(t(r.class_id))||'Classe'}`,{status:r.status,date:r.scheduled_on,detail:`${t(r.exam_type)} · /${n(r.max_score)}`})),
    marks:marks.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Élève',maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.mark_state||r.status,date:r.recorded_at,detail:`${n(r.score)}/${n(r.max_score)}${r.grade?` · ${r.grade}`:''}`})),
    reportCards:cards.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Bulletin',t(r.report_card_code),{status:r.status,detail:r.overall_average==null?null:`Moyenne: ${r.overall_average}`})),
    comments:comments.rows.map(r=>record(r,studentMap.get(t(r.student_id))||'Appréciation',t(r.comment_type),{status:r.status,detail:r.comment_text})),
    communications:messages.rows.map(r=>record(r,r.subject,r.message_type,{status:r.status,date:r.sent_at,detail:r.body})),tasks:[],notifications:notifications.rows.map(r=>record(r,r.title,r.channel,{status:r.status,date:r.scheduled_for,detail:r.body})),leave:[],sourceWarnings:warnings,permissions:['teacher.self','teacher.assigned_classes','teacher.assigned_subjects'],generatedAt:new Date().toISOString(),
  }
}

export async function getParentPortalSnapshot(view='home',selectedStudentId?:string|null):Promise<Angelcare360ParentPortalSnapshot>{
  const i=await requirePortalIdentity('parent'); const db=await createClient(); const schoolId=t(i.school.id); const parentId=t(i.person.id); const warnings:string[]=[]
  const links=await rows(db,'angelcare360_student_parent_links',schoolId,{select:'id,parent_id,student_id,relationship_type,is_guardian,is_primary,can_pay_fees,can_pickup,can_receive_messages,status',filters:[{column:'parent_id',value:parentId},{column:'status',value:'active'}],limit:100}); warnings.push(...links.warnings)
  const childIds=uniq(links.rows.map(r=>r.student_id)); if(selectedStudentId&&!childIds.includes(selectedStudentId)) throw new Error('Cet enfant ne fait pas partie de votre périmètre familial autorisé.'); const active=selectedStudentId?[selectedStudentId]:childIds
  const [children,attendance,assignments,marks,cards,invoices,payments,transport,recipients,notifications,complaints,documents]=await Promise.all([
    rows(db,'angelcare360_students',schoolId,{select:'id,student_code,full_name,first_name,last_name,current_class_id,current_section_id,status',filters:[{column:'id',operator:'in',values:childIds}],limit:100}),
    rows(db,'angelcare360_attendance_records',schoolId,{select:'id,attendance_session_id,student_id,attendance_status,minutes_late,justification_required,note,status',filters:[{column:'student_id',operator:'in',values:active}],limit:MAX_ROWS}),
    rows(db,'angelcare360_assignments',schoolId,{select:'id,assignment_code,class_id,section_id,subject_id,title,description,due_on,max_score,status',limit:MAX_ROWS}),
    rows(db,'angelcare360_marks',schoolId,{select:'id,student_id,subject_id,assessment_type,score,max_score,grade,mark_state,recorded_at,status',filters:[{column:'student_id',operator:'in',values:active}],order:'recorded_at',limit:MAX_ROWS}),
    rows(db,'angelcare360_report_cards',schoolId,{select:'id,report_card_code,student_id,class_id,overall_average,status',filters:[{column:'student_id',operator:'in',values:active}],limit:220}),
    rows(db,'angelcare360_invoices',schoolId,{select:'id,invoice_number,student_id,invoice_date,due_date,total_amount,amount_paid,currency,status',filters:[{column:'student_id',operator:'in',values:active}],order:'invoice_date',limit:220}),
    rows(db,'angelcare360_payments',schoolId,{select:'id,payment_number,student_id,invoice_id,payment_date,amount,allocated_amount,method,status',filters:[{column:'student_id',operator:'in',values:active}],order:'payment_date',limit:220}),
    rows(db,'angelcare360_transport_assignments',schoolId,{select:'id,student_id,route_id,pickup_stop_id,dropoff_stop_id,vehicle_id,assigned_on,status',filters:[{column:'student_id',operator:'in',values:active}],limit:100}),
    rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_parent_id,read_at,delivery_status,status',filters:[{column:'recipient_parent_id',value:parentId}],limit:220}),
    rows(db,'angelcare360_notifications',schoolId,{select:'id,title,body,channel,status,scheduled_for,recipient_parent_id,recipient_app_user_id',filters:[{column:'recipient_parent_id',value:parentId}],order:'scheduled_for',limit:160}),
    rows(db,'angelcare360_reclamations',schoolId,{select:'id,reclamation_code,subject,description,priority,status,resolution_notes,resolved_at,submitted_by_parent_id',filters:[{column:'submitted_by_parent_id',value:parentId}],limit:160}),
    rows(db,'angelcare360_documents',schoolId,{select:'id,document_code,documentable_type,documentable_id,title,category,file_name,file_path,mime_type,status,metadata_json',filters:[{column:'documentable_id',operator:'in',values:[...active,parentId]}],limit:220}),
  ]); for(const result of [children,attendance,assignments,marks,cards,invoices,payments,transport,recipients,notifications,complaints,documents]) warnings.push(...result.warnings)
  const childMap=new Map(children.rows.map(r=>[t(r.id),t(r.full_name,`${t(r.first_name)} ${t(r.last_name)}`.trim())])); const classIds=uniq(children.rows.map(r=>r.current_class_id)); const subjectIds=uniq([...marks.rows.map(r=>r.subject_id),...assignments.rows.map(r=>r.subject_id)]); const maps=await mapsFor(db,schoolId,classIds,subjectIds,uniq(children.rows.map(r=>r.current_section_id))); warnings.push(...maps.warnings)
  const familyAssignments=assignments.rows.filter(r=>classIds.includes(t(r.class_id))); const messageIds=uniq(recipients.rows.map(r=>r.message_id)); const messageRows=await directRows(db,'angelcare360_messages','id',messageIds,'id,school_id,subject,body,message_type,status,sent_at','sent_at',220); warnings.push(...messageRows.warnings)
  const totalDue=invoices.rows.reduce((sum,r)=>sum+Math.max(0,n(r.total_amount)-n(r.amount_paid)),0)
  return {portal:'parent',school:{id:schoolId,name:t(i.school.name,'Établissement SANILA')},academicYear:{id:t(i.academicYear?.id)||null,label:t(i.academicYear?.label,'Année active')},parent:{id:parentId,appUserId:t(i.appUser.id),code:t(i.person.parent_code)||null,name:t(i.person.full_name,t(i.appUser.full_name,'Responsable')),email:t(i.person.email,t(i.appUser.email))||null,phone:t(i.person.phone)||null},family:{id:null,label:childIds.length>1?`Famille · ${childIds.length} enfants`:'Famille'},view,selectedStudentId:selectedStudentId||null,
    metrics:[metric('children','Enfants liés',childIds.length,'Relation familiale vérifiée','blue','/angelcare-360-parent/enfants'),metric('attendance','Alertes présence',attendance.rows.filter(r=>!['present','excused'].includes(t(r.attendance_status))).length,'Absences et retards visibles','amber','/angelcare-360-parent/presences'),metric('finance','Solde famille',`${totalDue.toLocaleString('fr-FR')} MAD`,'Factures des enfants autorisés',totalDue>0?'amber':'emerald','/angelcare-360-parent/finance'),metric('messages','Messages',messageRows.rows.length,'Échanges rattachés à votre identité','violet','/angelcare-360-parent/messages')],
    children:children.rows.map(r=>record(r,childMap.get(t(r.id)),t(r.student_code),{status:r.status,detail:maps.classMap.get(t(r.current_class_id))||'Classe à confirmer',meta:{studentId:t(r.id),classId:t(r.current_class_id)}})),attendance:attendance.rows.map(r=>record(r,childMap.get(t(r.student_id))||'Enfant',t(r.attendance_status),{status:r.attendance_status,detail:r.minutes_late?`${r.minutes_late} min de retard`:t(r.note)})),timetable:[],assignments:familyAssignments.map(r=>record(r,r.title,`${maps.subjectMap.get(t(r.subject_id))||'Matière'} · ${maps.classMap.get(t(r.class_id))||'Classe'}`,{status:r.status,date:r.due_on,detail:r.description})),marks:marks.rows.map(r=>record(r,childMap.get(t(r.student_id))||'Enfant',maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.mark_state||r.status,date:r.recorded_at,detail:`${n(r.score)}/${n(r.max_score)}${r.grade?` · ${r.grade}`:''}`})),reportCards:cards.rows.map(r=>record(r,childMap.get(t(r.student_id))||'Bulletin',t(r.report_card_code),{status:r.status,detail:r.overall_average==null?null:`Moyenne: ${r.overall_average}`})),finance:invoices.rows.map(r=>record(r,t(r.invoice_number,'Facture'),childMap.get(t(r.student_id))||'Enfant',{status:r.status,date:r.due_date,detail:`${n(r.total_amount).toLocaleString('fr-FR')} ${t(r.currency,'MAD')} · payé ${n(r.amount_paid).toLocaleString('fr-FR')}`})),payments:payments.rows.map(r=>record(r,t(r.payment_number,'Paiement'),childMap.get(t(r.student_id))||'Enfant',{status:r.status,date:r.payment_date,detail:`${n(r.amount).toLocaleString('fr-FR')} MAD · ${t(r.method)}`})),transport:transport.rows.map(r=>record(r,childMap.get(t(r.student_id))||'Transport enfant','Affectation transport',{status:r.status,date:r.assigned_on})),pickup:[],messages:messageRows.rows.map(r=>record(r,r.subject,r.message_type,{status:r.status,date:r.sent_at,detail:r.body})),notifications:notifications.rows.map(r=>record(r,r.title,r.channel,{status:r.status,date:r.scheduled_for,detail:r.body})),requests:complaints.rows.map(r=>record(r,r.subject,t(r.reclamation_code),{status:r.status,detail:r.description})),meetings:[],commitments:[],complaints:complaints.rows.map(r=>record(r,r.subject,t(r.reclamation_code),{status:r.status,detail:r.resolution_notes||r.description})),recoveries:[],satisfaction:[],renewals:[],feedback:[],documents:documents.rows.map(r=>record(r,r.title,`${t(r.category)} · ${t(r.file_name)}`,{status:r.status,detail:t(r.mime_type)})),sourceWarnings:warnings,permissions:['parent.self','parent.linked_children','parent.authorized_finance'],generatedAt:new Date().toISOString()}
}

export async function getStudentPortalSnapshot(view='today'):Promise<Angelcare360StudentPortalSnapshot>{
  const i=await requirePortalIdentity('student'); const db=await createClient(); const schoolId=t(i.school.id); const studentId=t(i.person.id); const classId=t(i.person.current_class_id); const sectionId=t(i.person.current_section_id); const warnings:string[]=[]
  const [timetable,classSubjects,lessons,assignments,submissions,marks,cards,attendance,library,notifications,recipients,documents]=await Promise.all([
    rows(db,'angelcare360_timetable_slots',schoolId,{select:'id,class_id,section_id,subject_id,staff_id,day_of_week,start_time,end_time,room,status',filters:[{column:'class_id',value:classId}],order:'day_of_week',ascending:true,limit:220}),rows(db,'angelcare360_class_subjects',schoolId,{select:'id,class_id,subject_id,teacher_id,coefficient,is_required,status',filters:[{column:'class_id',value:classId}],limit:150}),rows(db,'angelcare360_lessons',schoolId,{select:'id,lesson_code,lesson_date,class_id,section_id,subject_id,topic,objectives,status',filters:[{column:'class_id',value:classId}],order:'lesson_date',limit:220}),rows(db,'angelcare360_assignments',schoolId,{select:'id,assignment_code,class_id,section_id,subject_id,title,description,due_on,max_score,status',filters:[{column:'class_id',value:classId}],order:'due_on',limit:220}),rows(db,'angelcare360_assignment_submissions',schoolId,{select:'id,assignment_id,student_id,submitted_at,score,status',filters:[{column:'student_id',value:studentId}],order:'submitted_at',limit:220}),rows(db,'angelcare360_marks',schoolId,{select:'id,student_id,subject_id,assessment_type,score,max_score,grade,mark_state,recorded_at,status',filters:[{column:'student_id',value:studentId}],order:'recorded_at',limit:250}),rows(db,'angelcare360_report_cards',schoolId,{select:'id,report_card_code,student_id,overall_average,status',filters:[{column:'student_id',value:studentId}],limit:80}),rows(db,'angelcare360_attendance_records',schoolId,{select:'id,attendance_session_id,student_id,attendance_status,minutes_late,justification_required,note,status',filters:[{column:'student_id',value:studentId}],limit:250}),rows(db,'angelcare360_library_loans',schoolId,{select:'id,copy_id,borrower_student_id,loaned_at,due_at,returned_at,fine_amount,status',filters:[{column:'borrower_student_id',value:studentId}],order:'loaned_at',limit:160}),rows(db,'angelcare360_notifications',schoolId,{select:'id,title,body,channel,status,scheduled_for,recipient_student_id,recipient_app_user_id',filters:[{column:'recipient_student_id',value:studentId}],order:'scheduled_for',limit:160}),rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_student_id,read_at,delivery_status,status',filters:[{column:'recipient_student_id',value:studentId}],limit:220}),rows(db,'angelcare360_documents',schoolId,{select:'id,document_code,documentable_type,documentable_id,title,category,file_name,file_path,mime_type,status',filters:[{column:'documentable_id',value:studentId}],limit:180}),
  ]); for(const result of [timetable,classSubjects,lessons,assignments,submissions,marks,cards,attendance,library,notifications,recipients,documents]) warnings.push(...result.warnings)
  const subjectIds=uniq(classSubjects.rows.map(r=>r.subject_id)); const maps=await mapsFor(db,schoolId,classId?[classId]:[],subjectIds,sectionId?[sectionId]:[]); warnings.push(...maps.warnings); const assignmentMap=new Map(assignments.rows.map(r=>[t(r.id),t(r.title,t(r.assignment_code))])); const messageIds=uniq(recipients.rows.map(r=>r.message_id)); const messages=await directRows(db,'angelcare360_messages','id',messageIds,'id,school_id,subject,body,message_type,status,sent_at','sent_at',220); warnings.push(...messages.warnings)
  return {portal:'student',school:{id:schoolId,name:t(i.school.name,'Établissement SANILA')},academicYear:{id:t(i.academicYear?.id)||null,label:t(i.academicYear?.label,'Année active')},student:{id:studentId,appUserId:t(i.appUser.id),code:t(i.person.student_code)||null,name:t(i.person.full_name,t(i.appUser.full_name,'Élève')),classLabel:maps.classMap.get(classId)||null,sectionLabel:maps.sectionMap.get(sectionId)||null},view,metrics:[metric('today','Cours planifiés',timetable.rows.length,'Planning de votre classe','blue','/angelcare-360-student/emploi-du-temps'),metric('homework','Devoirs',assignments.rows.filter(r=>!['archived','cancelled'].includes(t(r.status))).length,'Travail publié pour votre classe','violet','/angelcare-360-student/devoirs'),metric('attendance','Absences / retards',attendance.rows.filter(r=>!['present','excused'].includes(t(r.attendance_status))).length,'Votre historique personnel','amber','/angelcare-360-student/presences'),metric('library','Prêts actifs',library.rows.filter(r=>!r.returned_at&&['open','overdue'].includes(t(r.status))).length,'Bibliothèque personnelle','emerald','/angelcare-360-student/bibliotheque')],timetable:timetable.rows.map(r=>record(r,maps.subjectMap.get(t(r.subject_id))||'Séance',`${t(r.day_of_week)} · ${t(r.start_time)}–${t(r.end_time)}`,{status:r.status,detail:t(r.room)})),subjects:classSubjects.rows.map(r=>record(r,maps.subjectMap.get(t(r.subject_id))||'Matière',r.is_required===false?'Option':'Matière du programme',{status:r.status,detail:`Coefficient ${n(r.coefficient,1)}`})),lessons:lessons.rows.map(r=>record(r,t(r.topic,'Cours'),maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.status,date:r.lesson_date,detail:r.objectives})),assignments:assignments.rows.map(r=>record(r,r.title,maps.subjectMap.get(t(r.subject_id))||'Matière',{status:r.status,date:r.due_on,detail:r.description})),submissions:submissions.rows.map(r=>record(r,assignmentMap.get(t(r.assignment_id))||'Remise','Votre soumission',{status:r.status,date:r.submitted_at,detail:r.score==null?'Enregistrée':`Score: ${r.score}`})),exams:[],marks:marks.rows.map(r=>record(r,maps.subjectMap.get(t(r.subject_id))||'Résultat',t(r.assessment_type),{status:r.mark_state||r.status,date:r.recorded_at,detail:`${n(r.score)}/${n(r.max_score)}${r.grade?` · ${r.grade}`:''}`})),reportCards:cards.rows.map(r=>record(r,t(r.report_card_code,'Bulletin'),'Bulletin publié',{status:r.status,detail:r.overall_average==null?null:`Moyenne: ${r.overall_average}`})),attendance:attendance.rows.map(r=>record(r,t(r.attendance_status,'Présence'),'Historique personnel',{status:r.attendance_status,detail:r.minutes_late?`${r.minutes_late} min de retard`:t(r.note)})),library:library.rows.map(r=>record(r,'Prêt bibliothèque',t(r.copy_id),{status:r.status,date:r.due_at,detail:r.returned_at?`Retourné le ${r.returned_at}`:r.fine_amount?`Pénalité: ${r.fine_amount} MAD`:'En circulation'})),messages:messages.rows.map(r=>record(r,r.subject,r.message_type,{status:r.status,date:r.sent_at,detail:r.body})),notifications:notifications.rows.map(r=>record(r,r.title,r.channel,{status:r.status,date:r.scheduled_for,detail:r.body})),documents:documents.rows.map(r=>record(r,r.title,`${t(r.category)} · ${t(r.file_name)}`,{status:r.status,detail:t(r.mime_type)})),supportTasks:[],sourceWarnings:warnings,permissions:['student.self','student.class_published_content'],generatedAt:new Date().toISOString()}
}

export async function getStaffPortalSnapshot(view='today'):Promise<Angelcare360StaffPortalSnapshot>{
  const i=await requirePortalIdentity('staff'); const db=await createClient(); const schoolId=t(i.school.id); const staffId=t(i.person.id); const warnings:string[]=[]
  const [schedule,notifications,recipients,documents,payroll]=await Promise.all([
    rows(db,'angelcare360_timetable_slots',schoolId,{select:'id,staff_id,class_id,section_id,subject_id,day_of_week,start_time,end_time,room,status',filters:[{column:'staff_id',value:staffId}],order:'day_of_week',ascending:true,limit:220}),rows(db,'angelcare360_notifications',schoolId,{select:'id,title,body,channel,status,scheduled_for,recipient_staff_id,recipient_app_user_id',filters:[{column:'recipient_staff_id',value:staffId}],order:'scheduled_for',limit:160}),rows(db,'angelcare360_message_recipients',schoolId,{select:'id,message_id,recipient_staff_id,read_at,delivery_status,status',filters:[{column:'recipient_staff_id',value:staffId}],limit:220}),rows(db,'angelcare360_documents',schoolId,{select:'id,document_code,documentable_type,documentable_id,title,category,file_name,file_path,mime_type,status',filters:[{column:'documentable_id',value:staffId}],limit:180}),rows(db,'angelcare360_payroll_records',schoolId,{select:'id,payroll_number,payroll_period_id,staff_id,base_salary,bonuses_total,deductions_total,gross_amount,net_amount,payment_status,paid_at,status',filters:[{column:'staff_id',value:staffId}],limit:80}),
  ]); for(const result of [schedule,notifications,recipients,documents,payroll]) warnings.push(...result.warnings)
  const messageIds=uniq(recipients.rows.map(r=>r.message_id)); const messages=await directRows(db,'angelcare360_messages','id',messageIds,'id,school_id,subject,body,message_type,status,sent_at','sent_at',220); warnings.push(...messages.warnings)
  return {portal:'staff',school:{id:schoolId,name:t(i.school.name,'Établissement SANILA')},academicYear:{id:t(i.academicYear?.id)||null,label:t(i.academicYear?.label,'Année active')},staff:{id:staffId,appUserId:t(i.appUser.id),code:t(i.person.staff_code)||null,name:t(i.person.full_name,t(i.appUser.full_name,'Collaborateur')),email:t(i.person.email,t(i.appUser.email))||null,department:t(i.person.department)||null,position:t(i.person.staff_type)||null},view,metrics:[metric('schedule','Planning',schedule.rows.length,'Affectations visibles','blue','/angelcare-360-staff/planning'),metric('documents','Documents',documents.rows.length,'Documents professionnels autorisés','violet','/angelcare-360-staff/documents'),metric('notifications','Notifications',notifications.rows.length,'Informations rattachées à votre compte','emerald','/angelcare-360-staff/notifications'),metric('history','Paies historiques',payroll.rows.length,'Continuité personnelle','amber','/angelcare-360-staff/historique')],schedule:schedule.rows.map(r=>record(r,'Affectation planning',`${t(r.day_of_week)} · ${t(r.start_time)}–${t(r.end_time)}`,{status:r.status,detail:t(r.room)})),attendance:[],leave:[],tasks:[],approvals:[],workflows:[],tickets:[],documents:documents.rows.map(r=>record(r,r.title,`${t(r.category)} · ${t(r.file_name)}`,{status:r.status,detail:t(r.mime_type)})),messages:messages.rows.map(r=>record(r,r.subject,r.message_type,{status:r.status,date:r.sent_at,detail:r.body})),notifications:notifications.rows.map(r=>record(r,r.title,r.channel,{status:r.status,date:r.scheduled_for,detail:r.body})),team:[],history:payroll.rows.map(r=>record(r,t(r.payroll_number,'Paie'),t(r.payment_status),{status:r.status,date:r.paid_at,detail:`Net ${n(r.net_amount).toLocaleString('fr-FR')} MAD`})),sourceWarnings:warnings,permissions:['staff.self','staff.assigned_work'],generatedAt:new Date().toISOString()}
}
