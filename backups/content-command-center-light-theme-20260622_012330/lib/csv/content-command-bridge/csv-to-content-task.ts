import {
  loadStore,
  saveStore,
  nowISO,
  type ContentTask,
  type Priority,
} from "@/components/market-os/content-command/content-command-system"

export type CsvTaskImportRow = {
  id: string
  title: string
  status: string
  owner: string
  priority?: string
  due_date?: string
  blocked_by?: string
  next_action?: string
  department?: string
}

const allowedStatuses: ContentTask["status"][] = ["todo", "doing", "done", "blocked"]
const allowedPriorities: Priority[] = ["Low", "Medium", "High", "Critical"]

function normalizeStatus(value?: string): ContentTask["status"] {
  const status = value?.trim().toLowerCase()
  if (status && allowedStatuses.includes(status as ContentTask["status"])) {
    return status as ContentTask["status"]
  }
  return "todo"
}

function normalizePriority(value?: string): Priority {
  const priority = value?.trim().toLowerCase()
  const match = allowedPriorities.find((item) => item.toLowerCase() === priority)
  return match ?? "Medium"
}

function findFallbackContentId(): string {
  const store = loadStore()
  return store.items[0]?.id ?? "content-001"
}

export function csvRowToContentCommandTask(row: CsvTaskImportRow): ContentTask {
  const fallbackContentId = findFallbackContentId()

  const notes = [
    row.department ? `Department: ${row.department}` : "",
    row.blocked_by ? `Blocked by: ${row.blocked_by}` : "",
    row.next_action ? `Next action: ${row.next_action}` : "",
    "Imported from CSV task injection bridge.",
  ].filter(Boolean).join("\n")

  return {
    id: row.id,
    contentId: fallbackContentId,
    title: row.title,
    owner: row.owner,
    status: normalizeStatus(row.status),
    dueDate: row.due_date || "",
    priority: normalizePriority(row.priority),
    notes,
  }
}

export function injectCsvRowsIntoContentCommandTasks(rows: Record<string, string>[]) {
  const store = loadStore()
  const importedTasks = rows.map((row) => csvRowToContentCommandTask(row as CsvTaskImportRow))

  const mergedTasks = [...store.tasks]

  importedTasks.forEach((task) => {
    const existingIndex = mergedTasks.findIndex((candidate) => candidate.id === task.id)

    if (existingIndex >= 0) {
      mergedTasks[existingIndex] = {
        ...mergedTasks[existingIndex],
        ...task,
      }
    } else {
      mergedTasks.push(task)
    }
  })

  const nextStore = {
    ...store,
    tasks: mergedTasks,
    logs: [
      {
        id: `log-csv-task-import-${Date.now()}`,
        timestamp: nowISO(),
        action: "csv task injection",
        entity: "content-command",
        detail: `Imported ${importedTasks.length} CSV tasks into Content Command task store.`,
      },
      ...store.logs,
    ].slice(0, 80),
  }

  saveStore(nextStore)

  return {
    imported: importedTasks.length,
    totalTasks: nextStore.tasks.length,
    tasks: importedTasks,
  }
}