import type { LiveTask } from "./task-adapter"

const STORAGE_KEY = "angelcare_csv_live_imported_tasks_v1"

export function saveLiveTasksToLocalStore(tasks: LiveTask[]) {
  if (typeof window === "undefined") return

  const existing = loadLiveTasksFromLocalStore()
  const merged = [...existing]

  tasks.forEach((task) => {
    const index = merged.findIndex((item) => item.id === task.id)
    if (index >= 0) merged[index] = task
    else merged.push(task)
  })

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
}

export function loadLiveTasksFromLocalStore(): LiveTask[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearLiveTasksFromLocalStore() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}