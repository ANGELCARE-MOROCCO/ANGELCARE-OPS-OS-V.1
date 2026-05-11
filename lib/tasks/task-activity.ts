import {
  loadStore,
  saveStore,
  nowISO,
  uid,
  type ContentTask,
  type ContentStore,
} from "@/components/market-os/content-command/content-command-system"

export type TaskActivityEvent = {
  id: string
  taskId: string
  timestamp: string
  action: string
  detail: string
}

const ACTIVITY_KEY = "market_os_content_command_task_activity_v1"
const CHECKLIST_KEY = "market_os_content_command_task_checklists_v1"

export type TaskChecklistItem = {
  id: string
  taskId: string
  label: string
  done: boolean
  createdAt: string
}

export function readTaskActivity(): TaskActivityEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function writeTaskActivity(events: TaskActivityEvent[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(events.slice(0, 500)))
}

export function addTaskActivity(taskId: string, action: string, detail: string) {
  const events = readTaskActivity()
  writeTaskActivity([
    {
      id: uid("task-activity"),
      taskId,
      timestamp: nowISO(),
      action,
      detail,
    },
    ...events,
  ])
}

export function readTaskChecklists(): TaskChecklistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(CHECKLIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function writeTaskChecklists(items: TaskChecklistItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(items))
}

export function addTaskChecklistItem(taskId: string, label: string) {
  const items = readTaskChecklists()
  const next = [
    {
      id: uid("check"),
      taskId,
      label,
      done: false,
      createdAt: nowISO(),
    },
    ...items,
  ]
  writeTaskChecklists(next)
  addTaskActivity(taskId, "checklist item added", `Added checklist item: ${label}`)
  return next
}

export function toggleTaskChecklistItem(itemId: string) {
  const items = readTaskChecklists()
  const next = items.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item
  )
  writeTaskChecklists(next)
  const item = next.find((candidate) => candidate.id === itemId)
  if (item) addTaskActivity(item.taskId, "checklist updated", `${item.done ? "Completed" : "Reopened"}: ${item.label}`)
  return next
}

export function deleteTaskChecklistItem(itemId: string) {
  const items = readTaskChecklists()
  const item = items.find((candidate) => candidate.id === itemId)
  const next = items.filter((candidate) => candidate.id !== itemId)
  writeTaskChecklists(next)
  if (item) addTaskActivity(item.taskId, "checklist item deleted", `Deleted checklist item: ${item.label}`)
  return next
}

export function updateContentCommandTask(taskId: string, updater: (task: ContentTask) => ContentTask) {
  const store = loadStore()
  const before = store.tasks.find((task) => task.id === taskId)

  if (!before) return null

  const after = updater(before)

  const nextStore: ContentStore = {
    ...store,
    tasks: store.tasks.map((task) => (task.id === taskId ? after : task)),
    logs: [
      {
        id: uid("log"),
        timestamp: nowISO(),
        action: "task update",
        entity: "content-command-task",
        detail: `Updated task ${after.title}`,
      },
      ...store.logs,
    ].slice(0, 80),
  }

  saveStore(nextStore)
  addTaskActivity(taskId, "task updated", `Updated task: ${after.title}`)
  return after
}

export function deleteContentCommandTask(taskId: string) {
  const store = loadStore()
  const task = store.tasks.find((candidate) => candidate.id === taskId)

  const nextStore: ContentStore = {
    ...store,
    tasks: store.tasks.filter((candidate) => candidate.id !== taskId),
    logs: [
      {
        id: uid("log"),
        timestamp: nowISO(),
        action: "task delete",
        entity: "content-command-task",
        detail: task ? `Deleted task ${task.title}` : `Deleted task ${taskId}`,
      },
      ...store.logs,
    ].slice(0, 80),
  }

  saveStore(nextStore)
  addTaskActivity(taskId, "task deleted", task ? `Deleted task: ${task.title}` : "Deleted task")
}