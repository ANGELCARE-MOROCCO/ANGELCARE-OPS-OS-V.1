import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import { resolveAc360SchoolOpsContext } from '@/lib/ac360/school-ops'
import {
  createAc360MessageCampaign,
  dispatchAc360CampaignBatch,
  enqueueAc360CampaignRecipients,
  getAc360SchoolCommunicationDashboard,
  openAc360CommunicationThread,
  postAc360ThreadMessage,
  renderAc360MessageTemplate,
  resolveAc360CommunicationAlert,
  updateAc360NotificationPreference,
  upsertAc360MessageTemplate,
} from '@/lib/ac360/school-communication'
import type {
  SanilaAudienceMember,
  SanilaAudienceSegment,
  SanilaCampaign,
  SanilaCampaignRecipient,
  SanilaChannel,
  SanilaChannelReadiness,
  SanilaCommunicationAlert,
  SanilaCommunicationDashboard,
  SanilaCommunicationPreference,
  SanilaCommunicationThread,
  SanilaDeliveryEvent,
  SanilaDeliveryJob,
  SanilaDocumentReference,
  SanilaReferenceClass,
  SanilaReferencePerson,
  SanilaTemplate,
  SanilaTemplateVersion,
  SanilaThreadMessage,
} from '@/types/angelcare360/communication-command'

type Row = Record<string, any>

function text(value: unknown, fallback = '') { const v = String(value ?? '').trim(); return v || fallback }
function maybe(value: unknown) { const v = text(value); return v || null }
function num(value: unknown) { const v = Number(value ?? 0); return Number.isFinite(v) ? v : 0 }
function obj(value: unknown) { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function arrayObj(value: unknown) { return Array.isArray(value) ? value.filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v)) : [] }
function fullStudent(row?: Row | null) { if (!row) return null; return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.preferred_name || row.student_code || null }

async function commandContext(permission = 'messagerie.view') {
  const legacy = await getAngelcare360AccessContext()
  if (!legacy?.school) throw new Error('Aucun établissement actif n’est disponible.')
  await requireAngelcare360Permission(permission, { context: legacy })
  const advanced = await resolveAc360SchoolOpsContext()
  if (!advanced.ok || !advanced.orgId) throw new Error(advanced.error || 'Le contexte SANILA School Ops n’est pas disponible.')
  return { legacy, advanced, schoolId: legacy.school.id, schoolName: legacy.school.name, orgId: advanced.orgId }
}

async function referenceMaps(db: Awaited<ReturnType<typeof createClient>>, orgId: string, rows: Row[]) {
  const guardianIds = [...new Set(rows.map(r => r.guardian_id).filter(Boolean))]
  const studentIds = [...new Set(rows.map(r => r.student_id).filter(Boolean))]
  const staffIds = [...new Set(rows.map(r => r.assigned_staff_id).filter(Boolean))]
  const campusIds = [...new Set(rows.map(r => r.campus_id).filter(Boolean))]
  const [guardians, students, staff, campuses] = await Promise.all([
    guardianIds.length ? db.from('ac360_school_guardians').select('id,full_name,relation_label,preferred_channel').eq('org_id', orgId).in('id', guardianIds) : Promise.resolve({ data: [] as Row[], error: null }),
    studentIds.length ? db.from('ac360_school_students').select('id,first_name,last_name,preferred_name,student_code').eq('org_id', orgId).in('id', studentIds) : Promise.resolve({ data: [] as Row[], error: null }),
    staffIds.length ? db.from('ac360_school_staff_profiles').select('id,full_name,role_label,department').eq('org_id', orgId).in('id', staffIds) : Promise.resolve({ data: [] as Row[], error: null }),
    campusIds.length ? db.from('ac360_campuses').select('id,name,city').eq('org_id', orgId).in('id', campusIds) : Promise.resolve({ data: [] as Row[], error: null }),
  ])
  return {
    guardians: new Map((guardians.data || []).map((r: Row) => [text(r.id), r])),
    students: new Map((students.data || []).map((r: Row) => [text(r.id), r])),
    staff: new Map((staff.data || []).map((r: Row) => [text(r.id), r])),
    campuses: new Map((campuses.data || []).map((r: Row) => [text(r.id), r])),
  }
}

async function enrichThreads(db: Awaited<ReturnType<typeof createClient>>, orgId: string, rows: Row[]): Promise<SanilaCommunicationThread[]> {
  if (!rows.length) return []
  const ids = rows.map(r => text(r.id))
  const [{ data: messages }, refs] = await Promise.all([
    db.from('ac360_school_thread_messages').select('id,thread_id,sender_type,channel,body,created_at').eq('org_id', orgId).in('thread_id', ids).order('created_at', { ascending: false }),
    referenceMaps(db, orgId, rows),
  ])
  const buckets = new Map<string, Row[]>()
  for (const message of messages || []) { const id = text(message.thread_id); const bucket = buckets.get(id) || []; bucket.push(message); buckets.set(id, bucket) }
  return rows.map(row => {
    const bucket = buckets.get(text(row.id)) || []
    const guardian = refs.guardians.get(text(row.guardian_id))
    const student = refs.students.get(text(row.student_id))
    const staff = refs.staff.get(text(row.assigned_staff_id))
    const campus = refs.campuses.get(text(row.campus_id))
    const latest = bucket[0]
    return {
      ...row,
      id: text(row.id), org_id: text(row.org_id), thread_code: text(row.thread_code), thread_type: text(row.thread_type), subject: text(row.subject), status: text(row.status), priority: text(row.priority), opened_at: text(row.opened_at), created_at: text(row.created_at), updated_at: text(row.updated_at),
      campus_id: maybe(row.campus_id), guardian_id: maybe(row.guardian_id), student_id: maybe(row.student_id), assigned_staff_id: maybe(row.assigned_staff_id), opened_by: maybe(row.opened_by), closed_by: maybe(row.closed_by), closed_at: maybe(row.closed_at), last_message_at: maybe(row.last_message_at),
      guardian_name: guardian?.full_name || null, student_name: fullStudent(student), assigned_staff_name: staff?.full_name || null, campus_name: campus?.name || null,
      message_count: bucket.length, latest_message: latest?.body || null, latest_sender_type: latest?.sender_type || null, latest_channel: latest?.channel || null,
    } as SanilaCommunicationThread
  })
}

export async function listSanilaCommunicationThreads(options: { status?: string; priority?: string; search?: string; limit?: number } = {}) {
  const { orgId } = await commandContext('messagerie.view')
  const db = await createClient()
  let query = db.from('ac360_school_communication_threads').select('*').eq('org_id', orgId).order('last_message_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(Math.min(Math.max(options.limit || 120, 1), 300))
  if (options.status) query = query.eq('status', options.status)
  if (options.priority) query = query.eq('priority', options.priority)
  if (options.search) query = query.or(`thread_code.ilike.%${options.search}%,subject.ilike.%${options.search}%`)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return enrichThreads(db, orgId, data || [])
}

export async function getSanilaCommunicationThreadDetail(id: string) {
  const { orgId } = await commandContext('messagerie.view')
  const db = await createClient()
  const { data: row, error } = await db.from('ac360_school_communication_threads').select('*').eq('org_id', orgId).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!row) return null
  const [thread] = await enrichThreads(db, orgId, [row])
  const [{ data: messages }, { data: prefs }, { data: docs }] = await Promise.all([
    db.from('ac360_school_thread_messages').select('*').eq('org_id', orgId).eq('thread_id', id).order('created_at', { ascending: true }),
    row.guardian_id ? db.from('ac360_school_notification_preferences').select('*').eq('org_id', orgId).eq('recipient_type', 'guardian').eq('recipient_id', row.guardian_id).order('channel') : Promise.resolve({ data: [] as Row[], error: null }),
    (row.student_id || row.guardian_id) ? db.from('ac360_school_documents').select('id,title,document_type,file_name,mime_type,status,student_id,guardian_id,created_at').eq('org_id', orgId).or([row.student_id ? `student_id.eq.${row.student_id}` : '', row.guardian_id ? `guardian_id.eq.${row.guardian_id}` : ''].filter(Boolean).join(',')).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] as Row[], error: null }),
  ])
  const senderIds = [...new Set((messages || []).map((m: Row) => m.sender_id).filter(Boolean))]
  const { data: staffRows } = senderIds.length ? await db.from('ac360_school_staff_profiles').select('id,full_name').eq('org_id', orgId).in('id', senderIds) : { data: [] as Row[] }
  const { data: guardianRows } = senderIds.length ? await db.from('ac360_school_guardians').select('id,full_name').eq('org_id', orgId).in('id', senderIds) : { data: [] as Row[] }
  const names = new Map<string, string>()
  for (const r of [...(staffRows || []), ...(guardianRows || [])]) names.set(text(r.id), text(r.full_name))
  return {
    thread,
    messages: (messages || []).map((m: Row) => ({ ...m, id: text(m.id), org_id: text(m.org_id), thread_id: text(m.thread_id), message_code: text(m.message_code), sender_type: text(m.sender_type), sender_id: maybe(m.sender_id), channel: text(m.channel), body: text(m.body), status: text(m.status), attachments_json: arrayObj(m.attachments_json), metadata_json: obj(m.metadata_json), created_at: text(m.created_at), sender_label: names.get(text(m.sender_id)) || (m.sender_type === 'system' ? 'SANILA' : m.sender_type === 'angelcare' ? 'AngelCare' : null) } as SanilaThreadMessage)),
    preferences: (prefs || []).map((p: Row) => mapPreference(p)),
    documents: (docs || []).map((d: Row) => ({ id: text(d.id), title: text(d.title), document_type: text(d.document_type), file_name: maybe(d.file_name), mime_type: maybe(d.mime_type), status: text(d.status) } as SanilaDocumentReference)),
  }
}

function mapCampaign(row: Row, refs?: { campus?: Row; template?: Row; segment?: Row }): SanilaCampaign {
  return { ...row, id: text(row.id), org_id: text(row.org_id), campus_id: maybe(row.campus_id), template_id: maybe(row.template_id), message_id: maybe(row.message_id), segment_id: maybe(row.segment_id), campaign_code: text(row.campaign_code), campaign_type: text(row.campaign_type), channel: text(row.channel), audience_type: text(row.audience_type), title: text(row.title), subject: maybe(row.subject), body: text(row.body), status: text(row.status), scheduled_at: maybe(row.scheduled_at), queued_at: maybe(row.queued_at), sent_at: maybe(row.sent_at), recipient_count: num(row.recipient_count), queued_count: num(row.queued_count), dispatched_count: num(row.dispatched_count), delivered_count: num(row.delivered_count), failed_count: num(row.failed_count), read_count: num(row.read_count), created_at: text(row.created_at), updated_at: text(row.updated_at), campus_name: refs?.campus?.name || null, template_label: refs?.template?.label || null, segment_label: refs?.segment?.label || null }
}

export async function listSanilaCommunicationCampaigns(options: { type?: string; status?: string; limit?: number } = {}) {
  const { orgId } = await commandContext('messagerie.view')
  const db = await createClient()
  let q = db.from('ac360_school_message_campaigns').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(Math.min(Math.max(options.limit || 120, 1), 300))
  if (options.type) q = q.eq('campaign_type', options.type)
  if (options.status) q = q.eq('status', options.status)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows = data || []
  const campusIds = [...new Set(rows.map((r: Row) => r.campus_id).filter(Boolean))]
  const templateIds = [...new Set(rows.map((r: Row) => r.template_id).filter(Boolean))]
  const segmentIds = [...new Set(rows.map((r: Row) => r.segment_id).filter(Boolean))]
  const [campuses, templates, segments] = await Promise.all([
    campusIds.length ? db.from('ac360_campuses').select('id,name').eq('org_id', orgId).in('id', campusIds) : Promise.resolve({ data: [] as Row[], error: null }),
    templateIds.length ? db.from('ac360_school_message_templates').select('id,label').eq('org_id', orgId).in('id', templateIds) : Promise.resolve({ data: [] as Row[], error: null }),
    segmentIds.length ? db.from('ac360_school_audience_segments').select('id,label').eq('org_id', orgId).in('id', segmentIds) : Promise.resolve({ data: [] as Row[], error: null }),
  ])
  const cm = new Map((campuses.data || []).map((r: Row) => [text(r.id), r])); const tm = new Map((templates.data || []).map((r: Row) => [text(r.id), r])); const sm = new Map((segments.data || []).map((r: Row) => [text(r.id), r]))
  return rows.map((r: Row) => mapCampaign(r, { campus: cm.get(text(r.campus_id)), template: tm.get(text(r.template_id)), segment: sm.get(text(r.segment_id)) }))
}

export async function getSanilaCommunicationCampaignDetail(id: string) {
  const { orgId } = await commandContext('messagerie.view')
  const db = await createClient()
  const { data: row, error } = await db.from('ac360_school_message_campaigns').select('*').eq('org_id', orgId).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message); if (!row) return null
  const [{ data: recipients }, { data: events }, { data: jobs }] = await Promise.all([
    db.from('ac360_school_message_recipients').select('*').eq('org_id', orgId).eq('campaign_id', id).order('queued_at', { ascending: false }).limit(500),
    db.from('ac360_school_delivery_events').select('*').eq('org_id', orgId).eq('campaign_id', id).order('created_at', { ascending: false }).limit(500),
    db.from('ac360_school_delivery_jobs').select('*').eq('org_id', orgId).eq('campaign_id', id).order('created_at', { ascending: false }).limit(100),
  ])
  const [campaign] = await listSanilaCommunicationCampaigns({ limit: 300 }).then(all => all.filter(c => c.id === id))
  return { campaign: campaign || mapCampaign(row), recipients: (recipients || []).map(mapRecipient), events: (events || []).map(mapDeliveryEvent), jobs: (jobs || []).map(mapDeliveryJob) }
}

function mapRecipient(r: Row): SanilaCampaignRecipient { return { id: text(r.id), campaign_id: text(r.campaign_id), recipient_type: text(r.recipient_type), display_name: maybe(r.display_name), channel: text(r.channel), contact_value: maybe(r.contact_value), preference_status: text(r.preference_status), status: text(r.status), queued_at: text(r.queued_at), dispatched_at: maybe(r.dispatched_at), delivered_at: maybe(r.delivered_at), failed_at: maybe(r.failed_at), read_at: maybe(r.read_at), last_error: maybe(r.last_error) } }
function mapDeliveryEvent(r: Row): SanilaDeliveryEvent { return { id: text(r.id), campaign_id: maybe(r.campaign_id), recipient_id: maybe(r.recipient_id), delivery_job_id: maybe(r.delivery_job_id), event_type: text(r.event_type), provider_key: text(r.provider_key), provider_message_id: maybe(r.provider_message_id), error_message: maybe(r.error_message), created_at: text(r.created_at) } }
function mapDeliveryJob(r: Row): SanilaDeliveryJob { return { id: text(r.id), campaign_id: maybe(r.campaign_id), job_code: text(r.job_code), channel: text(r.channel), provider_key: text(r.provider_key), status: text(r.status), attempted_count: num(r.attempted_count), succeeded_count: num(r.succeeded_count), failed_count: num(r.failed_count), started_at: maybe(r.started_at), completed_at: maybe(r.completed_at), created_at: text(r.created_at) } }

export async function listSanilaCommunicationTemplates() {
  const { orgId } = await commandContext('messagerie.view'); const db = await createClient()
  const { data, error } = await db.from('ac360_school_message_templates').select('*').eq('org_id', orgId).order('updated_at', { ascending: false }).limit(250)
  if (error) throw new Error(error.message)
  const ids = (data || []).map((r: Row) => text(r.id))
  const { data: versions } = ids.length ? await db.from('ac360_school_message_template_versions').select('*').eq('org_id', orgId).in('template_id', ids).order('version_number', { ascending: false }) : { data: [] as Row[] }
  const by = new Map<string, Row[]>(); for (const v of versions || []) { const b = by.get(text(v.template_id)) || []; b.push(v); by.set(text(v.template_id), b) }
  return (data || []).map((r: Row) => { const v = by.get(text(r.id)) || []; return { ...r, id: text(r.id), org_id: text(r.org_id), campus_id: maybe(r.campus_id), template_key: text(r.template_key), label: text(r.label), template_type: text(r.template_type), channel: text(r.channel), audience_type: text(r.audience_type), language_code: text(r.language_code), subject_template: maybe(r.subject_template), body_template: text(r.body_template), variables_schema_json: obj(r.variables_schema_json), status: text(r.status), published_at: maybe(r.published_at), created_at: text(r.created_at), updated_at: text(r.updated_at), version_count: v.length, latest_version: v[0]?.version_number ? num(v[0].version_number) : null } as SanilaTemplate })
}

export async function listSanilaTemplateVersions(templateId: string) {
  const { orgId } = await commandContext('messagerie.view'); const db = await createClient()
  const { data, error } = await db.from('ac360_school_message_template_versions').select('*').eq('org_id', orgId).eq('template_id', templateId).order('version_number', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map((r: Row) => ({ ...r, id: text(r.id), template_id: text(r.template_id), version_number: num(r.version_number), subject_template: maybe(r.subject_template), body_template: text(r.body_template), variables_schema_json: obj(r.variables_schema_json), status: text(r.status), created_at: text(r.created_at) } as SanilaTemplateVersion))
}

export async function listSanilaAudienceSegments() {
  const { orgId } = await commandContext('messagerie.view'); const db = await createClient()
  const [{ data: segments, error }, { data: members }] = await Promise.all([
    db.from('ac360_school_audience_segments').select('*').eq('org_id', orgId).order('updated_at', { ascending: false }).limit(200),
    db.from('ac360_school_audience_segment_members').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(4000),
  ])
  if (error) throw new Error(error.message)
  const by = new Map<string, Row[]>(); for (const m of members || []) { const b = by.get(text(m.segment_id)) || []; b.push(m); by.set(text(m.segment_id), b) }
  return (segments || []).map((s: Row) => { const m = by.get(text(s.id)) || []; const mapped = m.map(mapMember); return { ...s, id: text(s.id), org_id: text(s.org_id), campus_id: maybe(s.campus_id), segment_key: text(s.segment_key), label: text(s.label), audience_type: text(s.audience_type), filter_json: obj(s.filter_json), status: text(s.status), created_at: text(s.created_at), updated_at: text(s.updated_at), member_count: mapped.length, active_member_count: mapped.filter(x => x.status === 'active').length, sample_members: mapped.slice(0, 8) } as SanilaAudienceSegment })
}
function mapMember(m: Row): SanilaAudienceMember { return { id: text(m.id), segment_id: text(m.segment_id), member_type: text(m.member_type), member_id: maybe(m.member_id), display_name: maybe(m.display_name), contact_channel: maybe(m.contact_channel), contact_value: maybe(m.contact_value), status: text(m.status) } }

export async function listSanilaCommunicationAlerts() {
  const { orgId } = await commandContext('messagerie.view'); const db = await createClient(); const { data, error } = await db.from('ac360_school_communication_alerts').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(250); if (error) throw new Error(error.message); return (data || []).map((r: Row) => ({ ...r, id: text(r.id), org_id: text(r.org_id), campus_id: maybe(r.campus_id), campaign_id: maybe(r.campaign_id), thread_id: maybe(r.thread_id), alert_key: text(r.alert_key), alert_type: text(r.alert_type), severity: text(r.severity), title: text(r.title), description: maybe(r.description), status: text(r.status), resolved_at: maybe(r.resolved_at), resolution_note: maybe(r.resolution_note), created_at: text(r.created_at), updated_at: text(r.updated_at) } as SanilaCommunicationAlert))
}

export async function listSanilaDeliveryCommand() {
  const { orgId } = await commandContext('messagerie.view'); const db = await createClient(); const [jobs, events, recipients] = await Promise.all([
    db.from('ac360_school_delivery_jobs').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(200),
    db.from('ac360_school_delivery_events').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(400),
    db.from('ac360_school_message_recipients').select('*').eq('org_id', orgId).order('queued_at', { ascending: false }).limit(400),
  ]); if (jobs.error) throw new Error(jobs.error.message); return { jobs: (jobs.data || []).map(mapDeliveryJob), events: (events.data || []).map(mapDeliveryEvent), recipients: (recipients.data || []).map(mapRecipient) }
}

function mapPreference(r: Row): SanilaCommunicationPreference { return { id: text(r.id), campus_id: maybe(r.campus_id), recipient_type: text(r.recipient_type), recipient_id: maybe(r.recipient_id), channel: text(r.channel), is_enabled: Boolean(r.is_enabled), consent_status: text(r.consent_status), quiet_hours_json: obj(r.quiet_hours_json), language_code: text(r.language_code), created_at: text(r.created_at), updated_at: text(r.updated_at), recipient_label: null } }
export async function listSanilaCommunicationPreferences() {
  const { orgId } = await commandContext('messagerie.view'); const db = await createClient(); const { data, error } = await db.from('ac360_school_notification_preferences').select('*').eq('org_id', orgId).order('updated_at', { ascending: false }).limit(500); if (error) throw new Error(error.message)
  const rows = data || []; const guardianIds = [...new Set(rows.filter((r: Row) => r.recipient_type === 'guardian').map((r: Row) => r.recipient_id).filter(Boolean))]; const staffIds = [...new Set(rows.filter((r: Row) => r.recipient_type === 'staff').map((r: Row) => r.recipient_id).filter(Boolean))]
  const [g,s] = await Promise.all([guardianIds.length ? db.from('ac360_school_guardians').select('id,full_name').eq('org_id', orgId).in('id', guardianIds) : Promise.resolve({data:[] as Row[], error:null}), staffIds.length ? db.from('ac360_school_staff_profiles').select('id,full_name').eq('org_id', orgId).in('id', staffIds) : Promise.resolve({data:[] as Row[], error:null})]); const names = new Map<string,string>(); for (const r of [...(g.data||[]), ...(s.data||[])]) names.set(text(r.id), text(r.full_name)); return rows.map((r: Row) => ({ ...mapPreference(r), recipient_label: names.get(text(r.recipient_id)) || null }))
}

export async function getSanilaCommunicationReferences() {
  const { orgId } = await commandContext('messagerie.view'); const db = await createClient(); const [guardians, students, staff, classes, campuses, documents] = await Promise.all([
    db.from('ac360_school_guardians').select('id,full_name,relation_label,phone,whatsapp,email,preferred_channel,campus_id').eq('org_id', orgId).eq('status','active').order('full_name').limit(500),
    db.from('ac360_school_students').select('id,first_name,last_name,preferred_name,student_code,campus_id').eq('org_id', orgId).eq('status','active').order('first_name').limit(800),
    db.from('ac360_school_staff_profiles').select('id,full_name,role_label,department,email,phone,campus_id').eq('org_id', orgId).eq('status','active').order('full_name').limit(500),
    db.from('ac360_school_classes').select('id,name,level_label,class_code,campus_id').eq('org_id', orgId).eq('status','active').order('name').limit(300),
    db.from('ac360_campuses').select('id,name,city').eq('org_id', orgId).eq('status','active').order('name').limit(100),
    db.from('ac360_school_documents').select('id,title,document_type,file_name,mime_type,status').eq('org_id', orgId).in('status',['active','approved']).order('created_at',{ascending:false}).limit(100),
  ])
  return {
    guardians: (guardians.data||[]).map((r:Row)=>({id:text(r.id),label:text(r.full_name),secondary:[r.relation_label,r.preferred_channel].filter(Boolean).join(' · '),campus_id:maybe(r.campus_id)} as SanilaReferencePerson)),
    students: (students.data||[]).map((r:Row)=>({id:text(r.id),label:fullStudent(r)||text(r.student_code),secondary:text(r.student_code),campus_id:maybe(r.campus_id)} as SanilaReferencePerson)),
    staff: (staff.data||[]).map((r:Row)=>({id:text(r.id),label:text(r.full_name),secondary:[r.role_label,r.department].filter(Boolean).join(' · '),campus_id:maybe(r.campus_id)} as SanilaReferencePerson)),
    classes: (classes.data||[]).map((r:Row)=>({id:text(r.id),label:text(r.name),secondary:[r.level_label,r.class_code].filter(Boolean).join(' · '),campus_id:maybe(r.campus_id)} as SanilaReferenceClass)),
    campuses: (campuses.data||[]).map((r:Row)=>({id:text(r.id),label:text(r.name),secondary:maybe(r.city),campus_id:text(r.id)} as SanilaReferencePerson)),
    documents: (documents.data||[]).map((r:Row)=>({id:text(r.id),title:text(r.title),document_type:text(r.document_type),file_name:maybe(r.file_name),mime_type:maybe(r.mime_type),status:text(r.status)} as SanilaDocumentReference)),
  }
}

async function legacyArchiveCounts(db: Awaited<ReturnType<typeof createClient>>, schoolId: string) {
  const results = await Promise.all([
    db.from('angelcare360_conversations').select('id',{count:'exact',head:true}).eq('school_id',schoolId),
    db.from('angelcare360_messages').select('id',{count:'exact',head:true}).eq('school_id',schoolId),
    db.from('angelcare360_announcements').select('id',{count:'exact',head:true}).eq('school_id',schoolId),
    db.from('angelcare360_message_templates').select('id',{count:'exact',head:true}).eq('school_id',schoolId),
  ])
  return { conversations: results[0].count||0, messages: results[1].count||0, announcements: results[2].count||0, templates: results[3].count||0 }
}

export async function getSanilaCommunicationDashboard(): Promise<SanilaCommunicationDashboard> {
  const { orgId, schoolId, schoolName, advanced } = await commandContext('messagerie.view'); const db = await createClient()
  const [dashboardResult, threads, campaigns, alerts, connectors, legacyArchive] = await Promise.all([
    getAc360SchoolCommunicationDashboard(orgId), listSanilaCommunicationThreads({limit:18}), listSanilaCommunicationCampaigns({limit:12}), listSanilaCommunicationAlerts(), db.from('ac360_school_integration_connectors').select('id,connector_type,label,status,last_error').eq('org_id',orgId).in('connector_type',['email','sms','whatsapp']).neq('status','archived'), legacyArchiveCounts(db,schoolId),
  ])
  const connectorRows = connectors.data || []
  const readiness: SanilaChannelReadiness[] = [
    {channel:'internal',state:'ready_internal',label:'Interne SANILA',detail:'Diffusion et notifications internes autorisées par l’autorité Communication 2E.'},
    ...(['email','whatsapp','sms'] as const).map(channel => { const c = connectorRows.find((r:Row)=>r.connector_type===channel); if (!c) return {channel,state:'not_configured',label:channel.toUpperCase(),detail:'Aucun connecteur actif déclaré. Les envois externes restent verrouillés.'} as SanilaChannelReadiness; if (c.status==='active') return {channel,state:'locked_external',label:c.label||channel.toUpperCase(),detail:'Connecteur déclaré actif, mais le dispatcher actuel reste un stub interne. Aucun envoi externe réel n’est affirmé.',connectorId:text(c.id)} as SanilaChannelReadiness; return {channel,state:'degraded',label:c.label||channel.toUpperCase(),detail:c.last_error||`Connecteur ${c.status}.`,connectorId:text(c.id)} as SanilaChannelReadiness }),
    {channel:'push',state:'locked_external',label:'Push',detail:'Le moteur actuel matérialise les notifications internes. Aucun push externe n’est affirmé.'},
  ]
  const d = dashboardResult.ok ? (dashboardResult as any).dashboard || {} : {}
  return { orgId, schoolId, schoolName, orgName: (advanced as any).context?.context?.org?.display_name || null, dashboard:d, channelReadiness:readiness, latestThreads:threads, latestCampaigns:campaigns, latestAlerts:alerts.filter(a=>a.status==='open').slice(0,10), legacyArchive }
}

export async function listSanilaCommunicationAudit() {
  const { schoolId } = await commandContext('audit.view'); const db = await createClient(); const { data, error } = await db.from('angelcare360_audit_logs').select('*').eq('school_id',schoolId).in('module',['messaging','communication','communication-command']).order('created_at',{ascending:false}).limit(400); if(error) throw new Error(error.message); return data||[]
}

async function audit(action:string, schoolId:string, entityType:string, entityId:string, beforeData:Record<string,unknown>, afterData:Record<string,unknown>, metadata:Record<string,unknown>={}) {
  await recordAngelcare360AuditEventServer({category:'communication',module:'communication-command',action,schoolId,entityType,entityId,severity:'info',beforeData,afterData,metadata})
}

export async function updateSanilaCommunicationThread(input: Record<string, unknown>) {
  const { orgId, schoolId } = await commandContext('messagerie.update'); const db = await createClient(); const id=text(input.id); if(!id) return {ok:false,error:'Conversation requise.'}
  const {data:before}=await db.from('ac360_school_communication_threads').select('*').eq('org_id',orgId).eq('id',id).maybeSingle(); if(!before) return {ok:false,error:'Conversation introuvable.'}
  const allowedStatus=['open','pending','resolved','closed','archived']; const allowedPriority=['low','normal','high','urgent']; const nextStatus=input.status?text(input.status):text(before.status); const nextPriority=input.priority?text(input.priority):text(before.priority); if(!allowedStatus.includes(nextStatus)) return {ok:false,error:'Statut de conversation invalide.'}; if(!allowedPriority.includes(nextPriority)) return {ok:false,error:'Priorité invalide.'}
  const patch:Record<string,unknown>={status:nextStatus,priority:nextPriority,updated_at:new Date().toISOString()}; if('assignedStaffId' in input) patch.assigned_staff_id=maybe(input.assignedStaffId); if(nextStatus==='closed'&&!before.closed_at) patch.closed_at=new Date().toISOString(); if(nextStatus!=='closed'&&before.status==='closed') patch.closed_at=null
  const {data,error}=await db.from('ac360_school_communication_threads').update(patch).eq('org_id',orgId).eq('id',id).select('*').maybeSingle(); if(error||!data) return {ok:false,error:error?.message||'Mise à jour impossible.'}; await audit('thread.updated',schoolId,'ac360_school_communication_threads',id,before,data,{authority:'ac360_school'}); return {ok:true,data}
}

export async function upsertSanilaAudienceSegment(input: Record<string, unknown>) {
  const { orgId, schoolId } = await commandContext('messagerie.update'); const db=await createClient(); const id=maybe(input.id); const key=text(input.segmentKey||input.segment_key); const label=text(input.label); const type=text(input.audienceType||input.audience_type,'custom'); const allowed=['parents','staff','class','student','custom']; const status=text(input.status,'active'); if(!key||!label) return {ok:false,error:'Clé et libellé requis.'}; if(!allowed.includes(type)) return {ok:false,error:'Type d’audience invalide.'}; if(!['active','inactive','archived'].includes(status)) return {ok:false,error:'État de segment invalide.'}
  let before:Row={}; if(id){ const r=await db.from('ac360_school_audience_segments').select('*').eq('org_id',orgId).eq('id',id).maybeSingle(); before=r.data||{} }
  const payload={org_id:orgId,campus_id:maybe(input.campusId||input.campus_id),segment_key:key,label,audience_type:type,filter_json:obj(input.filter||input.filter_json),status,metadata_json:{...obj(input.metadata||input.metadata_json),source:'sanila_communication_command'}}
  const result=id?await db.from('ac360_school_audience_segments').update({...payload,updated_at:new Date().toISOString()}).eq('org_id',orgId).eq('id',id).select('*').maybeSingle():await db.from('ac360_school_audience_segments').insert(payload).select('*').maybeSingle(); if(result.error||!result.data) return {ok:false,error:result.error?.message||'Audience impossible à enregistrer.'}; await audit(id?'audience.updated':'audience.created',schoolId,'ac360_school_audience_segments',text(result.data.id),before,result.data,{authority:'ac360_school'}); return {ok:true,data:result.data}
}

export async function upsertSanilaAudienceMember(input: Record<string, unknown>) {
  const { orgId, schoolId } = await commandContext('messagerie.update'); const db=await createClient(); const segmentId=text(input.segmentId||input.segment_id); const memberType=text(input.memberType||input.member_type); const allowed=['guardian','student','staff','custom']; if(!segmentId||!allowed.includes(memberType)) return {ok:false,error:'Segment ou type de membre invalide.'}; const memberId=maybe(input.memberId||input.member_id); const status=text(input.status,'active'); const contactChannel=maybe(input.contactChannel||input.contact_channel); if(!['active','inactive','archived'].includes(status)) return {ok:false,error:'État de membre invalide.'}; if(contactChannel && !['email','whatsapp','sms','push','internal'].includes(contactChannel)) return {ok:false,error:'Canal de contact invalide.'}; const payload={org_id:orgId,segment_id:segmentId,member_type:memberType,member_id:memberId,display_name:maybe(input.displayName||input.display_name),contact_channel:contactChannel,contact_value:maybe(input.contactValue||input.contact_value),status,metadata_json:{...obj(input.metadata||input.metadata_json),source:'sanila_communication_command'}}
  let result; if(memberId){ result=await db.from('ac360_school_audience_segment_members').upsert(payload,{onConflict:'org_id,segment_id,member_type,member_id'}).select('*').maybeSingle() } else { result=await db.from('ac360_school_audience_segment_members').insert(payload).select('*').maybeSingle() }
  if(result.error||!result.data) return {ok:false,error:result.error?.message||'Membre impossible à enregistrer.'}; await audit('audience.member.upserted',schoolId,'ac360_school_audience_segment_members',text(result.data.id),{},result.data,{segmentId}); return {ok:true,data:result.data}
}

export async function updateSanilaCampaign(input: Record<string, unknown>) {
  const {orgId,schoolId}=await commandContext('messagerie.update'); const db=await createClient(); const id=text(input.id); if(!id)return{ok:false,error:'Campagne requise.'}; const {data:before}=await db.from('ac360_school_message_campaigns').select('*').eq('org_id',orgId).eq('id',id).maybeSingle(); if(!before)return{ok:false,error:'Campagne introuvable.'}; const editable=['draft','scheduled']; if(!editable.includes(text(before.status))&&input.mode!=='lifecycle')return{ok:false,error:'Le contenu d’une campagne déjà engagée est immuable.'}; const patch:Record<string,unknown>={updated_at:new Date().toISOString()}; for(const [inputKey,dbKey] of [['title','title'],['subject','subject'],['body','body'],['scheduledAt','scheduled_at']] as const){if(inputKey in input)patch[dbKey]=input[inputKey]||null}; if(input.status){const next=text(input.status); const current=text(before.status); const allowedTransitions:Record<string,string[]>={draft:['draft','scheduled','cancelled','archived'],scheduled:['draft','scheduled','cancelled','archived'],queued:['cancelled','archived'],dispatching:['archived'],partially_sent:['archived'],sent:['archived'],failed:['cancelled','archived'],cancelled:['archived'],archived:['archived']}; if(!(allowedTransitions[current]||[]).includes(next))return{ok:false,error:`Transition ${current} → ${next} non autorisée.`}; patch.status=next}
  const {data,error}=await db.from('ac360_school_message_campaigns').update(patch).eq('org_id',orgId).eq('id',id).select('*').maybeSingle(); if(error||!data)return{ok:false,error:error?.message||'Campagne impossible à modifier.'}; await audit('campaign.updated',schoolId,'ac360_school_message_campaigns',id,before,data,{authority:'ac360_school'}); return{ok:true,data}
}

export async function enqueueSanilaCampaignFromSegment(input: Record<string, unknown>) {
  const {orgId}=await commandContext('messagerie.update'); const db=await createClient(); const campaignId=text(input.campaignId||input.campaign_id); const segmentId=text(input.segmentId||input.segment_id); if(!campaignId||!segmentId)return{ok:false,error:'Campagne et segment requis.'}; const [{data:campaign},{data:members}]=await Promise.all([db.from('ac360_school_message_campaigns').select('*').eq('org_id',orgId).eq('id',campaignId).maybeSingle(),db.from('ac360_school_audience_segment_members').select('*').eq('org_id',orgId).eq('segment_id',segmentId).eq('status','active').limit(2000)]); if(!campaign)return{ok:false,error:'Campagne introuvable.'}; const channel=text(campaign.channel,'internal'); const recipients=(members||[]).map((m:Row)=>({recipientType:m.member_type,recipientId:m.member_id,guardianId:m.member_type==='guardian'?m.member_id:null,studentId:m.member_type==='student'?m.member_id:null,staffId:m.member_type==='staff'?m.member_id:null,displayName:m.display_name,contactValue:channel==='internal'?null:m.contact_value})); return enqueueAc360CampaignRecipients({orgId,campaignId,recipients,recipientCount:recipients.length,metadata:{source:'sanila_segment',segmentId}})
}


export async function updateSanilaPreferenceGovernance(input: Record<string, unknown>) {
  const { orgId, schoolId } = await commandContext('messagerie.update')
  const db = await createClient()
  const id = text(input.preferenceId || input.id)
  if (!id) return { ok: false, error: 'Préférence requise.' }
  const { data: before, error: beforeError } = await db.from('ac360_school_notification_preferences').select('*').eq('org_id', orgId).eq('id', id).maybeSingle()
  if (beforeError || !before) return { ok: false, error: beforeError?.message || 'Préférence introuvable.' }
  const quietStart = maybe(input.quietStart)
  const quietEnd = maybe(input.quietEnd)
  const timezone = maybe(input.timezone) || 'Africa/Casablanca'
  const hhmm = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  if (Boolean(quietStart) !== Boolean(quietEnd)) return { ok: false, error: 'Début et fin des heures calmes doivent être renseignés ensemble.' }
  if ((quietStart && !hhmm.test(quietStart)) || (quietEnd && !hhmm.test(quietEnd))) return { ok: false, error: 'Heures calmes invalides. Format attendu HH:MM.' }
  const patch: Record<string, unknown> = {
    quiet_hours_json: quietStart && quietEnd ? { start: quietStart, end: quietEnd, timezone } : {},
    updated_at: new Date().toISOString(),
  }
  if ('isEnabled' in input) patch.is_enabled = Boolean(input.isEnabled)
  if (input.consentStatus) patch.consent_status = text(input.consentStatus)
  if (input.languageCode) patch.language_code = text(input.languageCode)
  const { data, error } = await db.from('ac360_school_notification_preferences').update(patch).eq('org_id', orgId).eq('id', id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Préférence impossible à mettre à jour.' }
  await audit('preference.governance.updated', schoolId, 'ac360_school_notification_preferences', id, before, data, { authority: 'ac360_school' })
  return { ok: true, data }
}


export async function openSanilaCommunicationThread(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.update')
  return openAc360CommunicationThread({ ...input, orgId })
}

export async function postSanilaCommunicationThreadMessage(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.update')
  return postAc360ThreadMessage({ ...input, orgId, channel: 'internal' })
}

export async function upsertSanilaCommunicationTemplate(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.update')
  return upsertAc360MessageTemplate({ ...input, orgId })
}

export async function createSanilaCommunicationCampaign(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.update')
  return createAc360MessageCampaign({ ...input, orgId })
}

export async function enqueueSanilaCampaignRecipients(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.update')
  return enqueueAc360CampaignRecipients({ ...input, orgId })
}

export async function dispatchSanilaInternalCampaign(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.update')
  const db = await createClient()
  const campaignId = text(input.campaignId || input.campaign_id)
  if (!campaignId) return { ok: false, error: 'Campagne requise.' }
  const { data: campaign, error } = await db.from('ac360_school_message_campaigns').select('id,channel,status').eq('org_id', orgId).eq('id', campaignId).maybeSingle()
  if (error || !campaign) return { ok: false, error: error?.message || 'Campagne introuvable.' }
  if (campaign.channel !== 'internal') return { ok: false, error: 'Canal externe verrouillé : le dispatcher de production actuel est un internal_stub et ne constitue pas une livraison fournisseur.' }
  if (!['queued', 'partially_sent'].includes(text(campaign.status))) return { ok: false, error: `Dispatch interne indisponible à l’état ${text(campaign.status)}.` }
  return dispatchAc360CampaignBatch({ ...input, orgId, campaignId, providerKey: 'internal_stub', channel: 'internal' })
}

export async function updateSanilaNotificationPreference(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.update')
  return updateAc360NotificationPreference({ ...input, orgId })
}

export async function resolveSanilaCommunicationAlert(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.update')
  return resolveAc360CommunicationAlert({ ...input, orgId })
}


export async function getSanilaCommunicationTemplateDetail(id: string) {
  const { orgId } = await commandContext('messagerie.view')
  const db = await createClient()
  const { data: template, error } = await db.from('ac360_school_message_templates').select('*').eq('org_id', orgId).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!template) return null
  const versions = await listSanilaTemplateVersions(id)
  return { template: { ...template, id: text(template.id), org_id: text(template.org_id), template_key: text(template.template_key), label: text(template.label), template_type: text(template.template_type), channel: text(template.channel), audience_type: text(template.audience_type), language_code: text(template.language_code), subject_template: maybe(template.subject_template), body_template: text(template.body_template), variables_schema_json: obj(template.variables_schema_json), status: text(template.status), published_at: maybe(template.published_at), created_at: text(template.created_at), updated_at: text(template.updated_at), version_count: versions.length, latest_version: versions[0]?.version_number || null } as SanilaTemplate, versions }
}

export async function renderSanilaCommunicationTemplate(input: Record<string, unknown>) {
  const { orgId } = await commandContext('messagerie.view')
  return renderAc360MessageTemplate({ ...input, orgId })
}

export async function getSanilaAudienceSegmentDetail(id: string) {
  const { orgId } = await commandContext('messagerie.view')
  const db = await createClient()
  const [{ data: segment, error }, { data: members, error: membersError }] = await Promise.all([
    db.from('ac360_school_audience_segments').select('*').eq('org_id', orgId).eq('id', id).maybeSingle(),
    db.from('ac360_school_audience_segment_members').select('*').eq('org_id', orgId).eq('segment_id', id).order('status').order('created_at', { ascending: false }).limit(2500),
  ])
  if (error) throw new Error(error.message)
  if (membersError) throw new Error(membersError.message)
  if (!segment) return null
  const mappedMembers = (members || []).map((m: Row) => mapMember(m))
  return {
    segment: { ...segment, id: text(segment.id), org_id: text(segment.org_id), campus_id: maybe(segment.campus_id), segment_key: text(segment.segment_key), label: text(segment.label), audience_type: text(segment.audience_type), filter_json: obj(segment.filter_json), status: text(segment.status), created_at: text(segment.created_at), updated_at: text(segment.updated_at), member_count: mappedMembers.length, active_member_count: mappedMembers.filter(m => m.status === 'active').length, sample_members: mappedMembers.slice(0, 12) } as SanilaAudienceSegment,
    members: mappedMembers,
  }
}
