"use client"

export type RCCProspect = {
  id: string
  name: string
  city: string
  stage: string
  priority: string
  score: number
  valueMad: number
  owner: string
  contactName: string
  email: string
  phone: string
  raw: any
  updatedAt?: string
}

export type RCCPartnership = {
  id: string
  name: string
  organization: string
  city: string
  stage: string
  status: string
  priority: string
  valueMad: number
  owner: string
  contactName: string
  email: string
  phone: string
  raw: any
  updatedAt?: string
}

export type RCCTask = {
  id: string
  entityType: string
  entityId: string
  entityName?: string
  title: string
  description?: string
  status: "open" | "done" | "cancelled" | string
  priority: string
  taskType: string
  owner: string
  assignedRole?: string
  startAt?: string | null
  endAt?: string | null
  dueDate?: string | null
  location?: string
  expectedOutcome?: string
  raw: any
  updatedAt?: string
}

export type RCCFollowUp = {
  id: string
  entityType: string
  entityId: string
  prospectId?: string
  partnershipId?: string
  title: string
  status: string
  channel: string
  priority: string
  owner: string
  scheduledAt?: string | null
  notes?: string
  raw: any
  updatedAt?: string
}

export type RCCAppointment = {
  id: string
  entityType: string
  entityId: string
  entityName?: string
  entityCity?: string
  title: string
  status: string
  appointmentType: string
  priority: string
  owner: string
  appointmentAt: string
  endAt?: string | null
  location?: string | null
  meetingLink?: string | null
  notes?: string | null
  agenda?: string | null
  objective?: string | null
  expectedOutcome?: string | null
  attendees: any[]
  reminders: any[]
  documents: any[]
  tasks: any[]
  raw: any
  updatedAt?: string
}

export type RCCActivity = {
  id: string
  entityType: string
  entityId: string
  eventType: string
  title: string
  body?: string | null
  actor?: string | null
  severity?: string | null
  metadata: Record<string, any>
  createdAt?: string
  raw: any
}

function firstString(...values: any[]) {
  const found = values.find((value) => typeof value === "string" && value.trim().length > 0)
  return found ? String(found) : ""
}

function firstNumber(...values: any[]) {
  const found = values.find((value) => value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value)))
  return Number(found || 0)
}

export function normalizeStatus(value: any, fallback = "open") {
  const status = String(value || fallback).toLowerCase()
  if (["pending", "todo", "new"].includes(status)) return "open"
  if (["complete", "completed", "closed"].includes(status)) return "done"
  return status
}

export function normalizeProspect(row: any): RCCProspect {
  const data = row?.data || row?.metadata || {}
  return {
    id: String(row?.id || data.id || ""),
    name: firstString(row?.name, data.name, data.company, row?.company, "Unnamed prospect"),
    city: firstString(row?.city, data.city, "Unassigned"),
    stage: firstString(row?.stage, data.stage, "new_lead"),
    priority: firstString(row?.priority, data.priority, "medium"),
    score: firstNumber(row?.score, data.score),
    valueMad: firstNumber(row?.value_mad, row?.valueMad, row?.value, data.valueMad, data.value_mad, data.value),
    owner: firstString(row?.owner, data.owner, data.assignedOwner, "BD Officer"),
    contactName: firstString(row?.contact_name, row?.contactName, data.contactName, data.decisionMaker, "N/A"),
    email: firstString(row?.email, data.email),
    phone: firstString(row?.phone, data.phone),
    raw: row,
    updatedAt: row?.updated_at || data.updatedAt,
  }
}

export function normalizePartnership(row: any): RCCPartnership {
  const metadata = row?.metadata || {}
  const name = firstString(row?.name, row?.organization, row?.company, "Unnamed partner")
  return {
    id: String(row?.id || ""),
    name,
    organization: firstString(row?.organization, row?.company, row?.name, name),
    city: firstString(row?.city, row?.location, metadata.city, "Unassigned"),
    stage: firstString(row?.stage, row?.status, "prospecting"),
    status: firstString(row?.status, row?.stage, "active"),
    priority: firstString(row?.priority, metadata.priority, "medium"),
    valueMad: firstNumber(row?.value_mad, row?.valueMad, row?.potential_value_mad, row?.potentialValueMad, row?.pipeline_value_mad, metadata.valueMad),
    owner: firstString(row?.owner, row?.assignedOwner, "Partnership Lead"),
    contactName: firstString(row?.contact_name, row?.contactName, row?.decision_maker, "N/A"),
    email: firstString(row?.email),
    phone: firstString(row?.phone),
    raw: row,
    updatedAt: row?.updated_at,
  }
}

export function normalizeTask(row: any): RCCTask {
  return {
    id: String(row?.id || ""),
    entityType: firstString(row?.entity_type, "prospect"),
    entityId: firstString(row?.entity_id, row?.prospect_id, row?.linked_entity_id),
    entityName: firstString(row?.entity_name, row?.prospect_name) || undefined,
    title: firstString(row?.title, row?.task_title, "Untitled task"),
    description: firstString(row?.description, row?.execution_brief),
    status: normalizeStatus(row?.status),
    priority: firstString(row?.priority, "medium"),
    taskType: firstString(row?.task_type, row?.type, "follow_up"),
    owner: firstString(row?.owner, "BD Officer"),
    assignedRole: firstString(row?.assigned_role) || undefined,
    startAt: row?.start_at || null,
    endAt: row?.end_at || null,
    dueDate: row?.due_date || row?.due_at || null,
    location: firstString(row?.location),
    expectedOutcome: firstString(row?.expected_outcome, row?.outcome_expected),
    raw: row,
    updatedAt: row?.updated_at,
  }
}

export function normalizeFollowUp(row: any): RCCFollowUp {
  return {
    id: String(row?.id || ""),
    entityType: firstString(row?.entity_type, row?.entityType, "general"),
    entityId: firstString(row?.entity_id, row?.entityId, row?.prospect_id, row?.prospectId, row?.partnership_id, row?.partnershipId),
    prospectId: firstString(row?.prospect_id, row?.prospectId) || undefined,
    partnershipId: firstString(row?.partnership_id, row?.partnershipId) || undefined,
    title: firstString(row?.title, row?.next_step, row?.nextStep, "Revenue follow-up"),
    status: normalizeStatus(row?.status, "pending"),
    channel: firstString(row?.channel, "whatsapp"),
    priority: firstString(row?.priority, "medium"),
    owner: firstString(row?.owner, "BD Officer"),
    scheduledAt: row?.scheduled_at || row?.scheduledAt || null,
    notes: firstString(row?.notes),
    raw: row,
    updatedAt: row?.updated_at,
  }
}

export function normalizeAppointment(row: any): RCCAppointment {
  return {
    id: String(row?.id || ""),
    entityType: firstString(row?.entity_type, "prospect"),
    entityId: firstString(row?.entity_id, row?.prospect_id, row?.linked_entity_id),
    entityName: firstString(row?.entity_name, row?.prospect_name) || undefined,
    entityCity: firstString(row?.entity_city, row?.city) || undefined,
    title: firstString(row?.title, "Untitled appointment"),
    status: normalizeStatus(row?.status, "scheduled"),
    appointmentType: firstString(row?.appointment_type, row?.type, "meeting"),
    priority: firstString(row?.priority, "medium"),
    owner: firstString(row?.owner, "BD Officer"),
    appointmentAt: firstString(row?.appointment_at, row?.start_at),
    endAt: row?.end_at || null,
    location: row?.location || null,
    meetingLink: row?.meeting_link || null,
    notes: row?.notes || null,
    agenda: row?.agenda || null,
    objective: row?.objective || null,
    expectedOutcome: row?.expected_outcome || row?.outcome_expected || null,
    attendees: Array.isArray(row?.attendees) ? row.attendees : [],
    reminders: Array.isArray(row?.reminders) ? row.reminders : [],
    documents: Array.isArray(row?.documents) ? row.documents : [],
    tasks: Array.isArray(row?.tasks) ? row.tasks : [],
    raw: row,
    updatedAt: row?.updated_at,
  }
}

export function normalizeActivity(row: any): RCCActivity {
  return {
    id: String(row?.id || ""),
    entityType: firstString(row?.entity_type, "prospect"),
    entityId: firstString(row?.entity_id, row?.prospect_id, row?.linked_entity_id),
    eventType: firstString(row?.event_type, row?.action, row?.action_type, "activity"),
    title: firstString(row?.event_title, row?.title, row?.action, "Activity logged"),
    body: row?.event_body || row?.body || row?.note || null,
    actor: row?.actor || null,
    severity: row?.severity || "info",
    metadata: (row?.metadata && typeof row.metadata === "object") ? row.metadata : {},
    createdAt: row?.created_at,
    raw: row,
  }
}
