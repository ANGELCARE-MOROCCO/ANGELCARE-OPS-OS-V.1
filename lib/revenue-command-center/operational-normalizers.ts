import { randomUUID } from "crypto"
import { cleanArray, cleanBoolean, cleanNumber, cleanObject, cleanString } from "@/lib/revenue-command-center/canonical-server"

export type RevenueOperationalEntityType =
  | "prospect"
  | "partnership"
  | "appointment"
  | "task"
  | "follow_up"
  | "note"
  | "comment"
  | "document"
  | "campaign"
  | "general"

type Row = Record<string, any>

const ENTITY_TYPES = new Set<RevenueOperationalEntityType>([
  "prospect",
  "partnership",
  "appointment",
  "task",
  "follow_up",
  "note",
  "comment",
  "document",
  "campaign",
  "general",
])

function first(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "")
}

function firstString(...values: any[]) {
  return cleanString(first(...values))
}

function firstNumber(...values: any[]) {
  return cleanNumber(first(...values), 0)
}

function normalizeEntityType(value: unknown, fallback: RevenueOperationalEntityType = "general"): RevenueOperationalEntityType {
  const key = cleanString(value).toLowerCase()
  if (key === "follow-up" || key === "followup" || key === "followups") return "follow_up"
  return ENTITY_TYPES.has(key as RevenueOperationalEntityType) ? (key as RevenueOperationalEntityType) : fallback
}

export function createRevenueId(input?: Row) {
  return cleanString(input?.id || input?.uuid || input?.recordId) || randomUUID()
}

export function compactRecord<T extends Row>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T
}

function metadataWithSource(input: Row, source: string) {
  return {
    ...cleanObject(input.metadata),
    source: cleanString(input.source || cleanObject(input.metadata).source, source),
  }
}

export function buildLinkedEntityPayload(input: Row) {
  const explicitType = normalizeEntityType(input.entityType ?? input.entity_type, "general")
  const prospectId = firstString(input.prospectId, input.prospect_id)
  const partnershipId = firstString(input.partnershipId, input.partnership_id)
  const explicitEntityId = firstString(input.entityId, input.entity_id, input.linkedEntityId, input.linked_entity_id)
  const entityType = prospectId ? "prospect" : partnershipId ? "partnership" : explicitType
  const entityId = explicitEntityId || prospectId || partnershipId || ""

  return {
    entity_type: entityType,
    entityType,
    entity_id: entityId || null,
    entityId: entityId || "",
    prospect_id: prospectId || (entityType === "prospect" ? entityId : "") || null,
    prospectId: prospectId || (entityType === "prospect" ? entityId : "") || "",
    partnership_id: partnershipId || (entityType === "partnership" ? entityId : "") || null,
    partnershipId: partnershipId || (entityType === "partnership" ? entityId : "") || "",
  }
}

export function normalizeProspectPayload(input: Row) {
  const metadata = metadataWithSource(input, "prospects_api")
  const name = firstString(input.name, input.company, input.organization, "Unnamed prospect")
  const valueMad = firstNumber(input.valueMad, input.value_mad, input.value, input.pipeline_value)

  return compactRecord({
    id: input.id ? cleanString(input.id) : undefined,
    name,
    company: firstString(input.company, input.organization, input.name),
    organization: firstString(input.organization, input.company, input.name),
    contact_name: firstString(input.contactName, input.contact_name, input.contact, input.decisionMaker),
    email: firstString(input.email),
    phone: firstString(input.phone, input.whatsapp),
    city: firstString(input.city, input.location, "Unassigned"),
    location: firstString(input.location, input.city),
    source: firstString(input.source, "manual"),
    segment: firstString(input.segment, input.type, "b2b"),
    status: firstString(input.status, "active"),
    stage: firstString(input.stage, "new_lead"),
    probability: firstNumber(input.probability),
    score: firstNumber(input.score),
    value_mad: valueMad,
    priority: firstString(input.priority, "medium"),
    owner: firstString(input.owner, input.assignedOwner, input.assignee, "BD Officer"),
    next_action: firstString(input.nextAction, input.next_action),
    next_action_at: first(input.nextActionAt, input.next_action_at) || null,
    notes: firstString(input.notes, input.description),
    tags: cleanArray(input.tags),
    data: {
      ...cleanObject(input.data),
      ...input,
      valueMad,
      contactName: firstString(input.contactName, input.contact_name, input.contact, input.decisionMaker),
      assignedOwner: firstString(input.assignedOwner, input.owner, input.assignee, "BD Officer"),
      nextAction: firstString(input.nextAction, input.next_action),
    },
    metadata,
  })
}

export function normalizeProspectFromDb(row: Row) {
  const data = cleanObject(row?.data)
  const metadata = cleanObject(row?.metadata)
  const valueMad = firstNumber(row?.value_mad, row?.valueMad, row?.value, data.valueMad, data.value_mad, data.value)
  const contactName = firstString(row?.contact_name, row?.contactName, data.contactName, data.contact_name, data.decisionMaker)
  const owner = firstString(row?.owner, data.owner, data.assignedOwner, "BD Officer")
  const nextAction = firstString(row?.next_action, row?.nextAction, data.nextAction, data.next_action)

  return {
    id: cleanString(row?.id),
    name: firstString(row?.name, data.name, row?.company, data.company, "Unnamed prospect"),
    company: firstString(row?.company, data.company, row?.organization, data.organization, row?.name),
    organization: firstString(row?.organization, data.organization, row?.company, data.company, row?.name),
    contact_name: contactName,
    contactName,
    email: firstString(row?.email, data.email),
    phone: firstString(row?.phone, data.phone),
    city: firstString(row?.city, data.city, row?.location, data.location, "Unassigned"),
    location: firstString(row?.location, data.location, row?.city, data.city),
    source: firstString(row?.source, data.source, "manual"),
    segment: firstString(row?.segment, data.segment, data.type, "b2b"),
    status: firstString(row?.status, data.status, "active"),
    stage: firstString(row?.stage, data.stage, "new_lead"),
    probability: firstNumber(row?.probability, data.probability),
    score: firstNumber(row?.score, data.score),
    value_mad: valueMad,
    valueMad,
    priority: firstString(row?.priority, data.priority, "medium"),
    owner,
    assignedOwner: owner,
    next_action: nextAction,
    nextAction,
    next_action_at: row?.next_action_at || data.nextActionAt || data.next_action_at || null,
    nextActionAt: row?.next_action_at || data.nextActionAt || data.next_action_at || null,
    notes: firstString(row?.notes, data.notes, data.description),
    tags: Array.isArray(row?.tags) ? row.tags : cleanArray(data.tags),
    metadata,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
    archived_at: row?.archived_at || null,
    raw: row,
  }
}

export function normalizePartnershipPayload(input: Row) {
  const metadata = metadataWithSource(input, "partnerships_api")
  const organization = firstString(input.organization, input.name, input.company, "Unnamed partner")
  const potentialValueMad = firstNumber(input.potentialValueMad, input.potential_value_mad, input.valueMad, input.value_mad, input.value, input.pipeline_value_mad)

  return compactRecord({
    id: input.id ? cleanString(input.id) : undefined,
    organization,
    name: firstString(input.name, input.organization, input.company, organization),
    company: firstString(input.company, input.organization, input.name),
    contact_name: firstString(input.contactName, input.contact_name, input.contact, input.decisionMaker),
    email: firstString(input.email),
    phone: firstString(input.phone, input.whatsapp),
    city: firstString(input.city, input.location, "Unassigned"),
    location: firstString(input.location, input.city),
    partnership_type: firstString(input.partnershipType, input.partnership_type, input.partner_type, input.kind, input.type, "strategic"),
    partner_type: firstString(input.partner_type, input.partnershipType, input.partnership_type, input.kind, input.type, "strategic"),
    kind: firstString(input.kind, input.partnershipType, input.partnership_type, input.type, "strategic"),
    stage: firstString(input.stage, input.status, "prospecting"),
    status: firstString(input.status, input.stage, "active"),
    potential_value_mad: potentialValueMad,
    value_mad: firstNumber(input.valueMad, input.value_mad, input.value, input.pipeline_value_mad, potentialValueMad),
    pipeline_value_mad: firstNumber(input.pipelineValueMad, input.pipeline_value_mad, input.valueMad, input.value_mad, potentialValueMad),
    contract_status: firstString(input.contractStatus, input.contract_status, "not_started"),
    next_action: firstString(input.nextAction, input.next_action, "Define partnership next step"),
    next_action_at: first(input.nextActionAt, input.next_action_at) || null,
    owner: firstString(input.owner, input.assignedOwner, input.owner_name, "Partnership Lead"),
    notes: firstString(input.notes, input.relationshipNotes, input.relationship_notes, input.context),
    relationship_notes: firstString(input.relationshipNotes, input.relationship_notes, input.notes, input.context),
    metadata,
  })
}

export function normalizePartnershipFromDb(row: Row) {
  const metadata = cleanObject(row?.metadata)
  const potentialValueMad = firstNumber(row?.potential_value_mad, row?.potentialValueMad, row?.value_mad, row?.pipeline_value_mad, row?.value)
  const contactName = firstString(row?.contact_name, row?.contactName, row?.decision_maker, row?.contact)
  const partnershipType = firstString(row?.partnership_type, row?.partnershipType, row?.partner_type, row?.kind, row?.type, "strategic")
  const contractStatus = firstString(row?.contract_status, row?.contractStatus, "not_started")
  const nextAction = firstString(row?.next_action, row?.nextAction)

  return {
    id: cleanString(row?.id),
    organization: firstString(row?.organization, row?.name, row?.company, "Unnamed partner"),
    name: firstString(row?.name, row?.organization, row?.company, "Unnamed partner"),
    company: firstString(row?.company, row?.organization, row?.name),
    contact_name: contactName,
    contactName,
    email: firstString(row?.email),
    phone: firstString(row?.phone),
    city: firstString(row?.city, row?.location, "Unassigned"),
    location: firstString(row?.location, row?.city),
    partnership_type: partnershipType,
    partnershipType,
    partner_type: firstString(row?.partner_type, partnershipType),
    stage: firstString(row?.stage, row?.status, "prospecting"),
    status: firstString(row?.status, row?.stage, "active"),
    potential_value_mad: potentialValueMad,
    potentialValueMad,
    value_mad: firstNumber(row?.value_mad, potentialValueMad),
    valueMad: firstNumber(row?.value_mad, potentialValueMad),
    pipeline_value_mad: firstNumber(row?.pipeline_value_mad, potentialValueMad),
    contract_status: contractStatus,
    contractStatus,
    next_action: nextAction,
    nextAction,
    next_action_at: row?.next_action_at || null,
    nextActionAt: row?.next_action_at || null,
    owner: firstString(row?.owner, row?.owner_name, "Partnership Lead"),
    notes: firstString(row?.notes, row?.relationship_notes, row?.context),
    relationship_notes: firstString(row?.relationship_notes, row?.notes, row?.context),
    metadata,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
    archived_at: row?.archived_at || null,
    raw: row,
  }
}

export function normalizeTaskPayload(input: Row) {
  const linked = buildLinkedEntityPayload(input)
  return compactRecord({
    id: input.id ? cleanString(input.id) : undefined,
    entity_type: linked.entity_type,
    entity_id: linked.entity_id,
    prospect_id: linked.prospect_id,
    partnership_id: linked.partnership_id,
    title: firstString(input.title, input.name, "Revenue task"),
    description: firstString(input.description, input.body),
    owner: firstString(input.owner, input.assignedOwner, input.assigned_to, "BD Officer"),
    assigned_owner: firstString(input.assignedOwner, input.owner, input.assigned_to, "BD Officer"),
    status: firstString(input.status, "open"),
    priority: firstString(input.priority, "medium"),
    due_date: first(input.dueDate, input.due_date, input.dueAt, input.due_at) || null,
    completed_at: first(input.completedAt, input.completed_at) || null,
    blocked_reason: firstString(input.blockedReason, input.blocked_reason),
    notes: firstString(input.notes),
    task_type: firstString(input.taskType, input.task_type, input.type, "follow_up"),
    start_at: first(input.startAt, input.start_at) || null,
    end_at: first(input.endAt, input.end_at) || null,
    assigned_role: firstString(input.assignedRole, input.assigned_role),
    department: firstString(input.department, "Revenue Command"),
    location: firstString(input.location),
    expected_outcome: firstString(input.expectedOutcome, input.expected_outcome, input.outcomeExpected, input.outcome_expected),
    metadata: metadataWithSource(input, "tasks_api"),
  })
}

export function normalizeTaskFromDb(row: Row) {
  const linked = buildLinkedEntityPayload(row)
  return {
    id: cleanString(row?.id),
    title: firstString(row?.title, "Revenue task"),
    description: firstString(row?.description),
    entity_type: linked.entity_type,
    entityType: linked.entityType,
    entity_id: linked.entity_id,
    entityId: linked.entityId,
    prospect_id: linked.prospect_id,
    prospectId: linked.prospectId,
    partnership_id: linked.partnership_id,
    partnershipId: linked.partnershipId,
    owner: firstString(row?.owner, row?.assigned_owner, "BD Officer"),
    assignedOwner: firstString(row?.assigned_owner, row?.owner, "BD Officer"),
    status: firstString(row?.status, "open"),
    priority: firstString(row?.priority, "medium"),
    due_date: row?.due_date || null,
    dueDate: row?.due_date || null,
    completed_at: row?.completed_at || null,
    completedAt: row?.completed_at || null,
    blocked_reason: firstString(row?.blocked_reason),
    blockedReason: firstString(row?.blocked_reason),
    notes: firstString(row?.notes),
    task_type: firstString(row?.task_type, "follow_up"),
    taskType: firstString(row?.task_type, "follow_up"),
    start_at: row?.start_at || null,
    startAt: row?.start_at || null,
    end_at: row?.end_at || null,
    endAt: row?.end_at || null,
    owner_name: row?.owner_name,
    entity_name: row?.entity_name,
    metadata: cleanObject(row?.metadata),
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
    archived_at: row?.archived_at || null,
    raw: row,
  }
}

export function normalizeAppointmentPayload(input: Row) {
  const linked = buildLinkedEntityPayload(input)
  return compactRecord({
    id: input.id ? cleanString(input.id) : undefined,
    entity_type: linked.entity_type,
    entity_id: linked.entity_id,
    prospect_id: linked.prospect_id,
    partnership_id: linked.partnership_id,
    title: firstString(input.title, "Revenue appointment"),
    appointment_at: first(input.appointmentAt, input.appointment_at, input.scheduledAt, input.scheduled_at) || null,
    scheduled_at: first(input.scheduledAt, input.scheduled_at, input.appointmentAt, input.appointment_at) || null,
    end_at: first(input.endAt, input.end_at) || null,
    status: firstString(input.status, "scheduled"),
    owner: firstString(input.owner, input.assignedOwner, "BD Officer"),
    attendees: cleanArray(input.attendees),
    notes: firstString(input.notes),
    briefing_notes: firstString(input.briefingNotes, input.briefing_notes),
    live_notes: firstString(input.liveNotes, input.live_notes),
    outcome: firstString(input.outcome),
    follow_up_at: first(input.followUpAt, input.follow_up_at) || null,
    appointment_type: firstString(input.appointmentType, input.appointment_type, input.type, "meeting"),
    priority: firstString(input.priority, "medium"),
    location: firstString(input.location),
    meeting_link: firstString(input.meetingLink, input.meeting_link),
    agenda: firstString(input.agenda),
    objective: firstString(input.objective),
    expected_outcome: firstString(input.expectedOutcome, input.expected_outcome),
    reminders: cleanArray(input.reminders),
    documents: cleanArray(input.documents),
    tasks: cleanArray(input.tasks),
    metadata: metadataWithSource(input, "appointments_api"),
  })
}

export function normalizeAppointmentFromDb(row: Row) {
  const linked = buildLinkedEntityPayload(row)
  return {
    id: cleanString(row?.id),
    title: firstString(row?.title, "Revenue appointment"),
    entity_type: linked.entity_type,
    entityType: linked.entityType,
    entity_id: linked.entity_id,
    entityId: linked.entityId,
    prospect_id: linked.prospect_id,
    prospectId: linked.prospectId,
    partnership_id: linked.partnership_id,
    partnershipId: linked.partnershipId,
    appointment_at: row?.appointment_at || row?.scheduled_at || null,
    appointmentAt: row?.appointment_at || row?.scheduled_at || null,
    scheduled_at: row?.scheduled_at || row?.appointment_at || null,
    scheduledAt: row?.scheduled_at || row?.appointment_at || null,
    end_at: row?.end_at || null,
    endAt: row?.end_at || null,
    status: firstString(row?.status, "scheduled"),
    owner: firstString(row?.owner, "BD Officer"),
    attendees: cleanArray(row?.attendees),
    notes: row?.notes || null,
    briefing_notes: row?.briefing_notes || null,
    briefingNotes: row?.briefing_notes || null,
    live_notes: row?.live_notes || null,
    liveNotes: row?.live_notes || null,
    outcome: row?.outcome || null,
    follow_up_at: row?.follow_up_at || null,
    followUpAt: row?.follow_up_at || null,
    appointment_type: firstString(row?.appointment_type, "meeting"),
    appointmentType: firstString(row?.appointment_type, "meeting"),
    priority: firstString(row?.priority, "medium"),
    location: row?.location || null,
    meeting_link: row?.meeting_link || null,
    meetingLink: row?.meeting_link || null,
    agenda: row?.agenda || null,
    objective: row?.objective || null,
    expected_outcome: row?.expected_outcome || null,
    expectedOutcome: row?.expected_outcome || null,
    reminders: cleanArray(row?.reminders),
    documents: cleanArray(row?.documents),
    tasks: cleanArray(row?.tasks),
    entity_name: row?.entity_name,
    metadata: cleanObject(row?.metadata),
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
    archived_at: row?.archived_at || null,
    raw: row,
  }
}

export function normalizeFollowUpPayload(input: Row) {
  const linked = buildLinkedEntityPayload(input)
  return compactRecord({
    id: input.id ? cleanString(input.id) : undefined,
    entity_type: linked.entity_type,
    entity_id: linked.entity_id,
    prospect_id: linked.prospect_id,
    partnership_id: linked.partnership_id,
    title: firstString(input.title, input.nextStep, input.next_step, "Revenue follow-up"),
    scheduled_at: first(input.scheduledAt, input.scheduled_at, input.followUpAt, input.follow_up_at) || null,
    channel: firstString(input.channel, "whatsapp"),
    status: firstString(input.status, "pending"),
    owner: firstString(input.owner, input.assignedOwner, "BD Officer"),
    result: firstString(input.result),
    next_step: firstString(input.nextStep, input.next_step),
    notes: firstString(input.notes),
    priority: firstString(input.priority, "medium"),
    metadata: metadataWithSource(input, "followups_api"),
  })
}

export function normalizeFollowUpFromDb(row: Row) {
  const linked = buildLinkedEntityPayload(row)
  return {
    id: cleanString(row?.id),
    title: firstString(row?.title, "Revenue follow-up"),
    entity_type: linked.entity_type,
    entityType: linked.entityType,
    entity_id: linked.entity_id,
    entityId: linked.entityId,
    prospect_id: linked.prospect_id,
    prospectId: linked.prospectId,
    partnership_id: linked.partnership_id,
    partnershipId: linked.partnershipId,
    scheduled_at: row?.scheduled_at || null,
    scheduledAt: row?.scheduled_at || null,
    channel: firstString(row?.channel, "whatsapp"),
    status: firstString(row?.status, "pending"),
    owner: firstString(row?.owner, "BD Officer"),
    result: firstString(row?.result),
    next_step: firstString(row?.next_step),
    nextStep: firstString(row?.next_step),
    notes: firstString(row?.notes),
    priority: firstString(row?.priority, "medium"),
    metadata: cleanObject(row?.metadata),
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
    archived_at: row?.archived_at || null,
    raw: row,
  }
}

export function normalizeActivityEventFromDb(row: Row) {
  const linked = buildLinkedEntityPayload(row)
  const title = firstString(row?.title, row?.event_title, row?.action, row?.action_type, "Revenue activity")
  const body = firstString(row?.body, row?.event_body, row?.note)
  return {
    id: cleanString(row?.id),
    entity_type: linked.entity_type,
    entityType: linked.entityType,
    entity_id: linked.entity_id,
    entityId: linked.entityId,
    prospect_id: linked.prospect_id,
    prospectId: linked.prospectId,
    partnership_id: linked.partnership_id,
    partnershipId: linked.partnershipId,
    event_type: firstString(row?.event_type, row?.action_type, row?.action, "activity"),
    eventType: firstString(row?.event_type, row?.action_type, row?.action, "activity"),
    title,
    event_title: title,
    body: body || null,
    event_body: body || null,
    actor: row?.actor || null,
    severity: firstString(row?.severity, "info"),
    metadata: cleanObject(row?.metadata),
    created_at: row?.created_at || null,
    createdAt: row?.created_at || null,
    raw: row,
  }
}

export function normalizeNotePayload(input: Row) {
  const linked = buildLinkedEntityPayload(input)
  const noteType = firstString(input.noteType, input.note_type, input.type, input.channel, "note")
  return compactRecord({
    id: input.id ? cleanString(input.id) : undefined,
    entity_type: linked.entity_type,
    entity_id: linked.entity_id,
    prospect_id: linked.prospect_id,
    partnership_id: linked.partnership_id,
    author: firstString(input.author, input.owner, "Revenue Command Center"),
    note_type: noteType,
    body: firstString(input.body, input.note, input.comment, input.notes),
    visibility: firstString(input.visibility, "team"),
    metadata: metadataWithSource(input, "notes_api"),
  })
}

export function isArchiveStatus(status: unknown) {
  return ["archived", "deleted"].includes(cleanString(status).toLowerCase())
}

export function isOpenOperationalStatus(status: unknown) {
  return !["done", "completed", "cancelled", "canceled", "archived", "closed", "missed"].includes(cleanString(status).toLowerCase())
}

export function booleanFromInput(value: unknown, fallback = false) {
  return cleanBoolean(value, fallback)
}
