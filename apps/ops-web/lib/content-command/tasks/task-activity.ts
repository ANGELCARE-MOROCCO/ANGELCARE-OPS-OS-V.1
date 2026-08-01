"use client"

import {
  loadStore,
  nowISO,
  saveStore,
  uid,
  type ContentTask,
} from "@/components/market-os/content-command/content-command-system"

export type TaskActivityEvent = {
  id: string
  taskId: string
  action: string
  detail: string
  timestamp: string
}

export type TaskChecklistItem = {
  id: string
  taskId: string
  label: string
  done: boolean
  required: boolean
  evidenceLinked: boolean
  createdAt: string
  completedAt?: string
}

export type TaskEvidenceRecord = {
  id: string
  taskId: string
  type: "capture" | "document" | "source" | "export" | "preview" | "video" | "link" | "confirmation"
  label: string
  url?: string
  note?: string
  state: "draft" | "submitted" | "accepted" | "rejected"
  submittedAt?: string
  reviewedAt?: string
}

export type TaskBlockerRecord = {
  id: string
  taskId: string
  type: "information" | "approval" | "owner" | "source" | "asset" | "dependency" | "technical" | "brand" | "scope" | "capacity" | "review" | "external"
  description: string
  severity: "low" | "medium" | "high" | "critical"
  owner: string
  state: "open" | "waiting" | "resolved" | "reopened"
  consequence?: string
  openedAt: string
  resolvedAt?: string
}

export type TaskClarificationRecord = {
  id: string
  taskId: string
  question: string
  requestedFrom: string
  dueDate?: string
  impactedArea?: string
  response?: string
  state: "open" | "answered" | "resolved" | "reopened"
  createdAt: string
}

export type TaskExecutionMeta = {
  taskId: string
  missionId?: string
  reviewer?: string
  objective?: string
  requiredOutput?: string
  scope?: string
  outOfScope?: string
  completionDefinition?: string
  acceptanceCriteria?: string
  qualityCriteria?: string
  evidenceRequirement?: string
  sourceRequirement?: string
  reviewRequirement?: string
  dependencyIds: string[]
  successorIds: string[]
  workState: "not_started" | "accepted" | "active" | "paused" | "blocked" | "awaiting_clarification" | "preparing_evidence" | "submitted" | "returned" | "completed"
  startedAt?: string
  pausedAt?: string
  submittedAt?: string
  amendmentReason?: string
  updatedAt: string
  evidences: TaskEvidenceRecord[]
  blockers: TaskBlockerRecord[]
  clarifications: TaskClarificationRecord[]
}

type TaskRuntimePayload = {
  taskId: string
  meta: TaskExecutionMeta
  checklist: TaskChecklistItem[]
  activity: TaskActivityEvent[]
}

let activityCache: TaskActivityEvent[] = []
let checklistCache: TaskChecklistItem[] = []
let metasCache: Record<string, TaskExecutionMeta> = {}
let hydratedAll = false
const hydratedTasks = new Set<string>()

export function defaultTaskExecutionMeta(taskId: string): TaskExecutionMeta {
  return {
    taskId,
    dependencyIds: [],
    successorIds: [],
    workState: "not_started",
    updatedAt: nowISO(),
    evidences: [],
    blockers: [],
    clarifications: [],
  }
}

function applyPayload(payload: TaskRuntimePayload) {
  metasCache[payload.taskId] = payload.meta || defaultTaskExecutionMeta(payload.taskId)
  checklistCache = [
    ...checklistCache.filter((row) => row.taskId !== payload.taskId),
    ...(Array.isArray(payload.checklist) ? payload.checklist : []),
  ]
  activityCache = [
    ...activityCache.filter((row) => row.taskId !== payload.taskId),
    ...(Array.isArray(payload.activity) ? payload.activity : []),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 1200)
  hydratedTasks.add(payload.taskId)
}

export async function hydrateTaskRuntime(taskId?: string) {
  if (taskId && hydratedTasks.has(taskId)) return
  if (!taskId && hydratedAll) return
  const query = taskId ? `?task_id=${encodeURIComponent(taskId)}` : ""
  const response = await fetch(`/api/market-os/content-command-center/task-runtime${query}`, {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
  const payload = await response.json().catch(() => ({})) as { ok?: boolean; runtimes?: TaskRuntimePayload[]; error?: string }
  if (!response.ok || !payload.ok) throw new Error(payload.error || `TASK_RUNTIME_${response.status}`)
  for (const runtime of payload.runtimes || []) applyPayload(runtime)
  if (taskId) hydratedTasks.add(taskId)
  else hydratedAll = true
}

function runtimeFor(taskId: string): TaskRuntimePayload {
  return {
    taskId,
    meta: metasCache[taskId] || defaultTaskExecutionMeta(taskId),
    checklist: checklistCache.filter((row) => row.taskId === taskId),
    activity: activityCache.filter((row) => row.taskId === taskId).slice(0, 300),
  }
}

function persistTaskRuntime(taskId: string) {
  const payload = runtimeFor(taskId)
  void fetch("/api/market-os/content-command-center/task-runtime", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  }).then(async (response) => {
    const result = await response.json().catch(() => ({})) as { ok?: boolean; runtime?: TaskRuntimePayload; error?: string }
    if (!response.ok || !result.ok) throw new Error(result.error || `TASK_RUNTIME_SAVE_${response.status}`)
    if (result.runtime) applyPayload(result.runtime)
  }).catch((error) => console.error("[CONTENT_COMMAND_TASK_RUNTIME_SAVE_FAILED]", error))
}

export function readTaskActivity() {
  return activityCache
}

export function addTaskActivity(taskId: string, action: string, detail: string) {
  const event = { id: uid("task-event"), taskId, action, detail, timestamp: nowISO() }
  activityCache = [event, ...activityCache].slice(0, 1200)
  persistTaskRuntime(taskId)
  return event
}

export function readTaskChecklists() {
  return checklistCache
}

export function addTaskChecklistItem(taskId: string, label: string, options?: { required?: boolean; evidenceLinked?: boolean }) {
  const item: TaskChecklistItem = {
    id: uid("task-check"),
    taskId,
    label,
    done: false,
    required: options?.required ?? true,
    evidenceLinked: options?.evidenceLinked ?? false,
    createdAt: nowISO(),
  }
  checklistCache = [...checklistCache, item]
  addTaskActivity(taskId, "checklist_item_added", `Étape ajoutée : ${label}`)
  return item
}

export function toggleTaskChecklistItem(itemId: string) {
  const item = checklistCache.find((candidate) => candidate.id === itemId)
  if (!item) return null
  const done = !item.done
  checklistCache = checklistCache.map((candidate) => candidate.id === itemId ? { ...candidate, done, completedAt: done ? nowISO() : undefined } : candidate)
  addTaskActivity(item.taskId, done ? "checklist_item_completed" : "checklist_item_reopened", item.label)
  return checklistCache.find((candidate) => candidate.id === itemId) ?? null
}

export function deleteTaskChecklistItem(itemId: string) {
  const item = checklistCache.find((candidate) => candidate.id === itemId)
  checklistCache = checklistCache.filter((candidate) => candidate.id !== itemId)
  if (item) addTaskActivity(item.taskId, "checklist_item_removed", item.label)
}

export function readTaskExecutionMetas() {
  return metasCache
}

export function readTaskExecutionMeta(taskId: string) {
  return metasCache[taskId] ?? defaultTaskExecutionMeta(taskId)
}

export function saveTaskExecutionMeta(taskId: string, updater: TaskExecutionMeta | ((current: TaskExecutionMeta) => TaskExecutionMeta)) {
  const current = metasCache[taskId] ?? defaultTaskExecutionMeta(taskId)
  const value = typeof updater === "function" ? updater(current) : updater
  const next = { ...value, taskId, updatedAt: nowISO() }
  metasCache = { ...metasCache, [taskId]: next }
  persistTaskRuntime(taskId)
  return next
}

export function setTaskWorkState(taskId: string, workState: TaskExecutionMeta["workState"], note?: string) {
  const next = saveTaskExecutionMeta(taskId, (current) => ({
    ...current,
    workState,
    startedAt: workState === "active" && !current.startedAt ? nowISO() : current.startedAt,
    pausedAt: workState === "paused" ? nowISO() : current.pausedAt,
    submittedAt: workState === "submitted" ? nowISO() : current.submittedAt,
  }))
  addTaskActivity(taskId, "work_state_changed", note || `État d’exécution : ${workState}`)
  return next
}

export function addTaskEvidence(taskId: string, evidence: Omit<TaskEvidenceRecord, "id" | "taskId">) {
  const record: TaskEvidenceRecord = { ...evidence, id: uid("task-evidence"), taskId }
  const next = saveTaskExecutionMeta(taskId, (current) => ({ ...current, evidences: [record, ...current.evidences] }))
  addTaskActivity(taskId, "evidence_added", evidence.label)
  return next
}

export function addTaskBlocker(taskId: string, blocker: Omit<TaskBlockerRecord, "id" | "taskId" | "openedAt">) {
  const record: TaskBlockerRecord = { ...blocker, id: uid("task-blocker"), taskId, openedAt: nowISO() }
  const next = saveTaskExecutionMeta(taskId, (current) => ({ ...current, blockers: [record, ...current.blockers], workState: "blocked" }))
  updateContentCommandTask(taskId, (task) => ({ ...task, status: "blocked" }))
  addTaskActivity(taskId, "blocker_opened", blocker.description)
  return next
}

export function resolveTaskBlocker(taskId: string, blockerId: string) {
  const next = saveTaskExecutionMeta(taskId, (current) => ({
    ...current,
    blockers: current.blockers.map((item) => item.id === blockerId ? { ...item, state: "resolved", resolvedAt: nowISO() } : item),
  }))
  addTaskActivity(taskId, "blocker_resolved", `Blocage ${blockerId} résolu`)
  return next
}

export function addTaskClarification(taskId: string, clarification: Omit<TaskClarificationRecord, "id" | "taskId" | "createdAt">) {
  const record: TaskClarificationRecord = { ...clarification, id: uid("task-question"), taskId, createdAt: nowISO() }
  const next = saveTaskExecutionMeta(taskId, (current) => ({ ...current, clarifications: [record, ...current.clarifications], workState: "awaiting_clarification" }))
  addTaskActivity(taskId, "clarification_requested", clarification.question)
  return next
}

export function updateContentCommandTask(taskId: string, updater: (task: ContentTask) => ContentTask) {
  const store = loadStore()
  const current = store.tasks.find((task) => task.id === taskId)
  if (!current) return null
  const updated = updater(current)
  saveStore({ ...store, tasks: store.tasks.map((task) => task.id === taskId ? updated : task) })
  return updated
}

export function deleteContentCommandTask(taskId: string) {
  const store = loadStore()
  saveStore({ ...store, tasks: store.tasks.filter((task) => task.id !== taskId) })
  checklistCache = checklistCache.filter((item) => item.taskId !== taskId)
  activityCache = activityCache.filter((item) => item.taskId !== taskId)
  const { [taskId]: _removed, ...rest } = metasCache
  metasCache = rest
  void fetch(`/api/market-os/content-command-center/task-runtime?task_id=${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    credentials: "include",
  }).catch((error) => console.error("[CONTENT_COMMAND_TASK_RUNTIME_ARCHIVE_FAILED]", error))
}
