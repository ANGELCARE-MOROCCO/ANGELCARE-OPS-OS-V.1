import type { SupabaseClient } from "@supabase/supabase-js"
import {
  cleanArray,
  cleanNumber,
  cleanString,
  logRevenueAction,
  logRevenueActivity,
} from "@/lib/revenue-command-center/canonical-server"

export type RevenueOperationEntity =
  | "prospect"
  | "partnership"
  | "b2c"
  | "appointment"
  | "task"
  | "follow_up"
  | "campaign"
  | "document"
  | "notification"
  | "decision_map"

export type RevenueTableConfig = {
  table: string
  entityType: RevenueOperationEntity
  collectionKey: string
  singleKey: string
  titleField: string
  archivedColumn?: string
  defaultOrder?: string
}

export const revenueTableConfigs: Record<string, RevenueTableConfig> = {
  prospects: { table: "revenue_prospects", entityType: "prospect", 
collectionKey: "prospects", singleKey: "prospect", titleField: "name", 
archivedColumn: "archived_at" },
  partnerships: { table: "revenue_partnerships", entityType: 
"partnership", collectionKey: "partnerships", singleKey: "partnership", 
titleField: "organization", archivedColumn: "archived_at" },
  b2c: { table: "revenue_b2c_cases", entityType: "b2c", collectionKey: 
"cases", singleKey: "case", titleField: "parent_name", archivedColumn: 
"archived_at" },
  appointments: { table: "revenue_appointments", entityType: 
"appointment", collectionKey: "appointments", singleKey: "appointment", 
titleField: "title", archivedColumn: "archived_at", defaultOrder: 
"appointment_at" },
  tasks: { table: "revenue_tasks", entityType: "task", collectionKey: 
"tasks", singleKey: "task", titleField: "title", archivedColumn: 
"archived_at" },
  followups: { table: "revenue_follow_ups", entityType: "follow_up", 
collectionKey: "followUps", singleKey: "followUp", titleField: "title", 
archivedColumn: "archived_at", defaultOrder: "scheduled_at" },
  campaigns: { table: "revenue_campaigns", entityType: "campaign", 
collectionKey: "campaigns", singleKey: "campaign", titleField: "name", 
archivedColumn: "archived_at" },
  documents: { table: "revenue_documents", entityType: "document", 
collectionKey: "documents", singleKey: "document", titleField: "title", 
archivedColumn: "archived_at" },
  notifications: { table: "revenue_notifications", entityType: 
"notification", collectionKey: "notifications", singleKey: "notification", 
titleField: "title", archivedColumn: "archived_at" },
  decisionMaps: { table: "revenue_decision_maps", entityType: 
"decision_map", collectionKey: "decisionMaps", singleKey: "decisionMap", 
titleField: "title", archivedColumn: "archived_at" },
}

export function jsonError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error || 
"Revenue operation failed")
  return { ok: false, error: message, status }
}

export function normalizeRevenuePayload(entity: RevenueOperationEntity, 
body: Record<string, unknown>) {
  const metadata = typeof body.metadata === "object" && body.metadata !== 
null ? body.metadata : {}
  const base = {
    status: cleanString(body.status, entity === "notification" ? "unread" 
: "active"),
    priority: cleanString(body.priority, "medium"),
    owner: cleanString(body.owner || body.assignedOwner, "Revenue Command"),
    metadata,
  }

  if (entity === "prospect") {
    return {
      name: cleanString(body.name || body.company || body.organization, 
"Unnamed prospect"),
      company: cleanString(body.company || body.organization || body.name, 
""),
      contact_name: cleanString(body.contactName || body.contact_name || 
body.contact, ""),
      email: cleanString(body.email, ""),
      phone: cleanString(body.phone, ""),
      city: cleanString(body.city || body.location, "Unassigned"),
      source: cleanString(body.source, "manual"),
      segment: cleanString(body.segment || body.type, "b2b"),
      stage: cleanString(body.stage, "new_lead"),
      probability: cleanNumber(body.probability, 25),
      score: cleanNumber(body.score, 50),
      value_mad: cleanNumber(body.valueMad ?? body.value_mad ?? 
body.value, 0),
      next_action: cleanString(body.nextAction || body.next_action, 
"Qualify and plan next step"),
      next_action_at: body.nextActionAt || body.next_action_at || null,
      notes: cleanString(body.notes || body.description, ""),
      tags: cleanArray(body.tags),
      data: body,
      ...base,
    }
  }

  if (entity === "partnership") {
    return {
      organization: cleanString(body.organization || body.name || 
body.company, "Unnamed partner"),
      contact_name: cleanString(body.contactName || body.contact_name || 
body.contact, ""),
      email: cleanString(body.email, ""),
      phone: cleanString(body.phone, ""),
      partnership_type: cleanString(body.partnershipType || 
body.partnership_type || body.type, "strategic"),
      stage: cleanString(body.stage, "prospecting"),
      potential_value_mad: cleanNumber(body.potentialValueMad ?? 
body.potential_value_mad ?? body.valueMad ?? body.value, 0),
      contract_status: cleanString(body.contractStatus || 
body.contract_status, "not_started"),
      next_action: cleanString(body.nextAction || body.next_action, 
"Define partnership next step"),
      next_action_at: body.nextActionAt || body.next_action_at || null,
      relationship_notes: cleanString(body.relationshipNotes || 
body.relationship_notes || body.notes, ""),
      ...base,
    }
  }

  if (entity === "b2c") {
    return {
      parent_name: cleanString(body.parentName || body.parent_name || 
body.name, "Unnamed family"),
      child_age_range: cleanString(body.childAgeRange || 
body.child_age_range, ""),
      service_interest: cleanString(body.serviceInterest || 
body.service_interest || body.serviceType, "care"),
      city: cleanString(body.city || body.location, "Unassigned"),
      stage: cleanString(body.stage, "intake"),
      intake_status: cleanString(body.intakeStatus || body.intake_status, 
"pending"),
      consultation_status: cleanString(body.consultationStatus || 
body.consultation_status, "not_scheduled"),
      quote_status: cleanString(body.quoteStatus || body.quote_status, 
"not_sent"),
      matching_status: cleanString(body.matchingStatus || 
body.matching_status, "not_started"),
      care_start_status: cleanString(body.careStartStatus || 
body.care_start_status, "not_started"),
      estimated_value_mad: cleanNumber(body.estimatedValueMad ?? 
body.estimated_value_mad ?? body.valueMad ?? body.value, 0),
      urgency: cleanString(body.urgency, "medium"),
      phone: cleanString(body.phone, ""),
      email: cleanString(body.email, ""),
      preferred_channel: cleanString(body.preferredChannel || 
body.preferred_channel, "whatsapp"),
      next_action: cleanString(body.nextAction || body.next_action, 
"Complete intake"),
      notes: cleanString(body.notes || body.caseNotes, ""),
      ...base,
    }
  }

  if (entity === "appointment") {
    const entityId = cleanString(body.entityId || body.entity_id || 
body.prospectId || body.prospect_id, "")
    return {
      entity_type: cleanString(body.entityType || body.entity_type, 
entityId ? "prospect" : "general"),
      entity_id: entityId || null,
      prospect_id: cleanString(body.prospectId || body.prospect_id || 
entityId, "") || null,
      title: cleanString(body.title, "Revenue appointment"),
      appointment_type: cleanString(body.appointmentType || 
body.appointment_type, "meeting"),
      appointment_at: body.appointmentAt || body.appointment_at || new 
Date().toISOString(),
      end_at: body.endAt || body.end_at || null,
      location: cleanString(body.location, ""),
      meeting_link: cleanString(body.meetingLink || body.meeting_link, 
""),
      notes: cleanString(body.notes, ""),
      agenda: cleanString(body.agenda, ""),
      objective: cleanString(body.objective, ""),
      expected_outcome: cleanString(body.expectedOutcome || 
body.expected_outcome, ""),
      outcome: cleanString(body.outcome, ""),
      follow_up_at: body.followUpAt || body.follow_up_at || null,
      attendees: cleanArray(body.attendees),
      reminders: cleanArray(body.reminders),
      documents: cleanArray(body.documents),
      tasks: cleanArray(body.tasks),
      ...base,
    }
  }

  if (entity === "task") {
    const entityId = cleanString(body.entityId || body.entity_id || 
body.prospectId || body.prospect_id, "")
    return {
      entity_type: cleanString(body.entityType || body.entity_type, 
entityId ? "prospect" : "general"),
      entity_id: entityId || null,
      prospect_id: cleanString(body.prospectId || body.prospect_id || 
entityId, "") || null,
      title: cleanString(body.title, "Revenue task"),
      description: cleanString(body.description, ""),
      task_type: cleanString(body.taskType || body.task_type, 
"follow_up"),
      assigned_role: cleanString(body.assignedRole || body.assigned_role, 
""),
      due_date: body.dueDate || body.due_date || null,
      start_at: body.startAt || body.start_at || null,
      end_at: body.endAt || body.end_at || null,
      completed_at: body.completedAt || body.completed_at || null,
      blocked_reason: cleanString(body.blockedReason || 
body.blocked_reason, ""),
      expected_outcome: cleanString(body.expectedOutcome || 
body.expected_outcome, ""),
      location: cleanString(body.location, ""),
      ...base,
    }
  }

  if (entity === "follow_up") {
    return {
      entity_type: cleanString(body.entityType || body.entity_type, 
"prospect"),
      entity_id: cleanString(body.entityId || body.entity_id || 
body.prospectId || body.prospect_id, "") || null,
      prospect_id: cleanString(body.prospectId || body.prospect_id, "") || 
null,
      title: cleanString(body.title, "Revenue follow-up"),
      channel: cleanString(body.channel, "whatsapp"),
      scheduled_at: body.scheduledAt || body.scheduled_at || 
body.followUpAt || null,
      result: cleanString(body.result, ""),
      next_step: cleanString(body.nextStep || body.next_step, ""),
      notes: cleanString(body.notes, ""),
      ...base,
    }
  }

  if (entity === "campaign") {
    return {
      name: cleanString(body.name || body.title, "Revenue campaign"),
      audience: cleanString(body.audience, "Revenue segment"),
      objective: cleanString(body.objective, "Pipeline growth"),
      channel: cleanString(body.channel, "multi_channel"),
      budget_mad: cleanNumber(body.budgetMad ?? body.budget_mad ?? 
body.budget, 0),
      launch_at: body.launchAt || body.launch_at || null,
      completed_at: body.completedAt || body.completed_at || null,
      performance: typeof body.performance === "object" && 
body.performance !== null ? body.performance : {},
      assets: cleanArray(body.assets),
      ...base,
    }
  }

  if (entity === "document") {
    return {
      entity_type: cleanString(body.entityType || body.entity_type, 
"prospect"),
      entity_id: cleanString(body.entityId || body.entity_id, "") || null,
      title: cleanString(body.title, "Revenue document"),
      document_type: cleanString(body.documentType || body.document_type, 
"note"),
      file_url: cleanString(body.fileUrl || body.file_url, ""),
      storage_path: cleanString(body.storagePath || body.storage_path, 
""),
      notes: cleanString(body.notes, ""),
      ...base,
    }
  }

  if (entity === "notification") {
    return {
      recipient: cleanString(body.recipient || body.owner, "Revenue Command"),
      title: cleanString(body.title, "Revenue notification"),
      body: cleanString(body.body || body.description, ""),
      notification_type: cleanString(body.notificationType || 
body.notification_type || body.type, "workflow"),
      entity_type: cleanString(body.entityType || body.entity_type, ""),
      entity_id: cleanString(body.entityId || body.entity_id, "") || null,
      read_at: body.readAt || body.read_at || null,
      ...base,
    }
  }

  return {
    entity_type: cleanString(body.entityType || body.entity_type, 
"prospect"),
    entity_id: cleanString(body.entityId || body.entity_id, "") || null,
    title: cleanString(body.title, "Revenue decision map"),
    decision_maker: cleanString(body.decisionMaker || body.decision_maker, 
""),
    influencers: cleanArray(body.influencers),
    blockers: cleanArray(body.blockers),
    relationship_strength: cleanString(body.relationshipStrength || 
body.relationship_strength, "unknown"),
    notes: cleanString(body.notes, ""),
    ...base,
  }
}

export async function listRevenueRows(supabase: SupabaseClient, config: 
RevenueTableConfig, url: string) {
  const { searchParams } = new URL(url)
  const limit = Math.min(Number(searchParams.get("limit") || 1000), 5000)
  const status = searchParams.get("status")
  const stage = searchParams.get("stage")
  const owner = searchParams.get("owner")
  const entityId = searchParams.get("entityId")
  const includeArchived = searchParams.get("includeArchived") === "true"
  const order = config.defaultOrder || "updated_at"

  let query = supabase.from(config.table).select("*").order(order, { 
ascending: order.endsWith("_at") && order !== "updated_at" }).limit(limit)
  if (status && status !== "all") query = query.eq("status", status)
  if (stage && stage !== "all") query = query.eq("stage", stage)
  if (owner && owner !== "all") query = query.eq("owner", owner)
  if (entityId) query = query.eq("entity_id", entityId)
  if (!includeArchived && config.archivedColumn) query = 
query.is(config.archivedColumn, null)

  return query
}

export async function createRevenueRow(supabase: SupabaseClient, config: 
RevenueTableConfig, body: Record<string, unknown>) {
  const row = normalizeRevenuePayload(config.entityType, body) as Record<string, unknown>
  const dynamicTable = (supabase as any).from(config.table)
  const { data, error } = await dynamicTable.insert(row).select("*").single()
  if (error) throw new Error(error.message)
  await logRevenueActivity(supabase, {
    entityType: config.entityType,
    entityId: data.id,
    prospectId: config.entityType === "prospect" ? data.id : 
data.prospect_id || null,
    eventType: `${config.entityType}_created`,
    title: `${config.singleKey} created: ${String(data[config.titleField] 
|| data.title || data.name || data.id)}`,
    metadata: { table: config.table },
  })
  await logRevenueAction(supabase, {
    actionType: `create_${config.entityType}`,
    entityType: config.entityType,
    entityId: data.id,
    payload: body,
    result: { id: data.id, table: config.table },
  })
  return data
}

export async function updateRevenueRow(supabase: SupabaseClient, config: 
RevenueTableConfig, body: Record<string, unknown>) {
  const id = cleanString(body.id)
  if (!id) throw new Error("Missing id")
  const patch = normalizeRevenuePayload(config.entityType, body)
  const { data, error } = await supabase.from(config.table).update({ 
...patch, updated_at: new Date().toISOString() }).eq("id", 
id).select("*").single()
  if (error) throw new Error(error.message)
  await logRevenueActivity(supabase, {
    entityType: config.entityType,
    entityId: data.id,
    prospectId: config.entityType === "prospect" ? data.id : 
data.prospect_id || null,
    eventType: `${config.entityType}_updated`,
    title: `${config.singleKey} updated: ${String(data[config.titleField] 
|| data.title || data.name || data.id)}`,
    metadata: { table: config.table, patch },
  })
  await logRevenueAction(supabase, {
    actionType: `update_${config.entityType}`,
    entityType: config.entityType,
    entityId: data.id,
    payload: body,
    result: { id: data.id, table: config.table },
  })
  return data
}

export async function archiveRevenueRow(supabase: SupabaseClient, config: 
RevenueTableConfig, body: Record<string, unknown>) {
  const id = cleanString(body.id)
  if (!id) throw new Error("Missing id")
  const patch = config.archivedColumn ? { status: "archived", 
[config.archivedColumn]: new Date().toISOString(), updated_at: new 
Date().toISOString() } : { status: "archived", updated_at: new 
Date().toISOString() }
  const { data, error } = await 
supabase.from(config.table).update(patch).eq("id", 
id).select("*").single()
  if (error) throw new Error(error.message)
  await logRevenueActivity(supabase, {
    entityType: config.entityType,
    entityId: data.id,
    prospectId: config.entityType === "prospect" ? data.id : 
data.prospect_id || null,
    eventType: `${config.entityType}_archived`,
    title: `${config.singleKey} archived: ${String(data[config.titleField] 
|| data.title || data.name || data.id)}`,
    severity: "warning",
    metadata: { table: config.table },
  })
  return data
}

export async function restoreRevenueRow(supabase: SupabaseClient, config: 
RevenueTableConfig, body: Record<string, unknown>) {
  const id = cleanString(body.id)
  if (!id) throw new Error("Missing id")
  const patch = config.archivedColumn ? { status: "active", 
[config.archivedColumn]: null, updated_at: new Date().toISOString() } : { 
status: "active", updated_at: new Date().toISOString() }
  const { data, error } = await 
supabase.from(config.table).update(patch).eq("id", 
id).select("*").single()
  if (error) throw new Error(error.message)
  await logRevenueActivity(supabase, {
    entityType: config.entityType,
    entityId: data.id,
    prospectId: config.entityType === "prospect" ? data.id : 
data.prospect_id || null,
    eventType: `${config.entityType}_restored`,
    title: `${config.singleKey} restored: ${String(data[config.titleField] 
|| data.title || data.name || data.id)}`,
    metadata: { table: config.table },
  })
  return data
}
