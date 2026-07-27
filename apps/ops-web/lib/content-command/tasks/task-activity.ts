"use client"

import {
  loadStore,
  nowISO,
  saveStore,
  uid,
  type ContentTask,
} from "@/components/market-os/content-command/content-command-system"

const TASK_ACTIVITY_KEY = "market_os_content_command_task_activity_v2"
const TASK_CHECKLIST_KEY = "market_os_content_command_task_checklists_v2"
const TASK_EXECUTION_META_KEY = "market_os_content_command_task_execution_meta_v1"

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

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value))
}

export function readTaskActivity() {
  return readJson<TaskActivityEvent[]>(TASK_ACTIVITY_KEY, [])
}

export function addTaskActivity(taskId: string, action: string, detail: string) {
  const next = [{ id: uid("task-event"), taskId, action, detail, timestamp: nowISO() }, ...readTaskActivity()].slice(0, 600)
  writeJson(TASK_ACTIVITY_KEY, next)
  return next[0]
}

export function readTaskChecklists() {
  return readJson<TaskChecklistItem[]>(TASK_CHECKLIST_KEY, [])
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
  writeJson(TASK_CHECKLIST_KEY, [...readTaskChecklists(), item])
  addTaskActivity(taskId, "checklist_item_added", `Étape ajoutée : ${label}`)
  return item
}

export function toggleTaskChecklistItem(itemId: string) {
  const current = readTaskChecklists()
  const item = current.find((candidate) => candidate.id === itemId)
  if (!item) return null
  const done = !item.done
  const next = current.map((candidate) => candidate.id === itemId ? { ...candidate, done, completedAt: done ? nowISO() : undefined } : candidate)
  writeJson(TASK_CHECKLIST_KEY, next)
  addTaskActivity(item.taskId, done ? "checklist_item_completed" : "checklist_item_reopened", item.label)
  return next.find((candidate) => candidate.id === itemId) ?? null
}

export function deleteTaskChecklistItem(itemId: string) {
  const current = readTaskChecklists()
  const item = current.find((candidate) => candidate.id === itemId)
  writeJson(TASK_CHECKLIST_KEY, current.filter((candidate) => candidate.id !== itemId))
  if (item) addTaskActivity(item.taskId, "checklist_item_removed", item.label)
}

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

export function readTaskExecutionMetas() {
  return readJson<Record<string, TaskExecutionMeta>>(TASK_EXECUTION_META_KEY, {})
}

export function readTaskExecutionMeta(taskId: string) {
  return readTaskExecutionMetas()[taskId] ?? defaultTaskExecutionMeta(taskId)
}

export function saveTaskExecutionMeta(taskId: string, updater: TaskExecutionMeta | ((current: TaskExecutionMeta) => TaskExecutionMeta)) {
  const metas = readTaskExecutionMetas()
  const current = metas[taskId] ?? defaultTaskExecutionMeta(taskId)
  const value = typeof updater === "function" ? updater(current) : updater
  const next = { ...value, taskId, updatedAt: nowISO() }
  writeJson(TASK_EXECUTION_META_KEY, { ...metas, [taskId]: next })
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
  writeJson(TASK_CHECKLIST_KEY, readTaskChecklists().filter((item) => item.taskId !== taskId))
  writeJson(TASK_ACTIVITY_KEY, readTaskActivity().filter((item) => item.taskId !== taskId))
  const metas = readTaskExecutionMetas()
  delete metas[taskId]
  writeJson(TASK_EXECUTION_META_KEY, metas)
}
