export type CsvTaskRow = {
  id: string
  title: string
  status: string
  owner: string
  priority?: string
  due_date?: string
  department?: string
  blocked_by?: string
  next_action?: string
  created_at?: string
  updated_at?: string
}

export type LiveTask = {
  id: string
  title: string
  status: "todo" | "doing" | "review" | "blocked" | "done" | "cancelled"
  owner: string
  priority: "Low" | "Medium" | "High" | "Critical"
  dueDate?: string
  department?: string
  blockedBy?: string
  nextAction?: string
  createdAt: string
  updatedAt: string
}

const statusMap: Record<string, LiveTask["status"]> = {
  todo: "todo",
  doing: "doing",
  review: "review",
  blocked: "blocked",
  done: "done",
  cancelled: "cancelled",
}

const priorityMap: Record<string, LiveTask["priority"]> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

export function csvTaskToLiveTask(row: CsvTaskRow): LiveTask {
  const now = new Date().toISOString()

  return {
    id: row.id,
    title: row.title,
    status: statusMap[row.status?.toLowerCase()] ?? "todo",
    owner: row.owner,
    priority: priorityMap[row.priority?.toLowerCase() ?? "medium"] ?? "Medium",
    dueDate: row.due_date || undefined,
    department: row.department || undefined,
    blockedBy: row.blocked_by || undefined,
    nextAction: row.next_action || undefined,
    createdAt: row.created_at || now,
    updatedAt: row.updated_at || now,
  }
}

export function convertCsvRowsToLiveTasks(rows: Record<string, string>[]): LiveTask[] {
  return rows.map((row) => csvTaskToLiveTask(row as CsvTaskRow))
}