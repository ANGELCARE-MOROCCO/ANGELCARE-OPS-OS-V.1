"use client"

export type Bulk3ExecutionContext = {
  dossierId?: string
  dossierTitle?: string
  missionId?: string
  missionTitle?: string
  taskId?: string
  taskTitle?: string
  stage: "mission" | "task-command" | "task-execution" | "task-detail" | "task-amendment"
  sourceHref: string
  returnTo: string
  updatedAt: string
}

const STORAGE_KEY = "angelcare.content-command.bulk3.execution-context.v1"

export function readBulk3Context(): Bulk3ExecutionContext | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Bulk3ExecutionContext
    if (!parsed.stage || !parsed.returnTo) return null
    return parsed
  } catch {
    return null
  }
}

export function writeBulk3Context(value: Bulk3ExecutionContext) {
  if (typeof window === "undefined") return
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* optional continuity */ }
}

export function bulk3ContextHref(
  target: string,
  context: Partial<Bulk3ExecutionContext> & { returnTo?: string },
) {
  const [pathname, currentSearch = ""] = target.split("?")
  const params = new URLSearchParams(currentSearch)
  if (context.dossierId) params.set("dossier", context.dossierId)
  if (context.missionId) params.set("mission", context.missionId)
  if (context.taskId) params.set("task", context.taskId)
  if (context.returnTo) params.set("returnTo", context.returnTo)
  if (context.stage) params.set("executionStage", context.stage)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function contextFromLocation(fallbackReturnTo: string): Partial<Bulk3ExecutionContext> {
  if (typeof window === "undefined") return { returnTo: fallbackReturnTo }
  const params = new URLSearchParams(window.location.search)
  return {
    dossierId: params.get("dossier") || undefined,
    missionId: params.get("mission") || undefined,
    taskId: params.get("task") || undefined,
    returnTo: params.get("returnTo") || fallbackReturnTo,
  }
}
