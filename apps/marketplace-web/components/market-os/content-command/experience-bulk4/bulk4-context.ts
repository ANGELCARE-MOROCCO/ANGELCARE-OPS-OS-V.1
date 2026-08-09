"use client"

import type { Bulk4CreativeContext, Bulk4StudioMode } from "./bulk4-types"

const STORAGE_KEY = "angelcare.content-command.bulk4.creative-context.v1"

export function readBulk4Context(): Bulk4CreativeContext | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Bulk4CreativeContext
    return parsed.returnTo ? parsed : null
  } catch {
    return null
  }
}

export function writeBulk4Context(value: Bulk4CreativeContext) {
  if (typeof window === "undefined") return
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* continuity is optional */ }
}

export function contextFromLocation(fallbackReturnTo: string): Partial<Bulk4CreativeContext> {
  if (typeof window === "undefined") return { returnTo: fallbackReturnTo }
  const params = new URLSearchParams(window.location.search)
  return {
    dossierId: params.get("dossier") || undefined,
    dossierTitle: params.get("dossierTitle") || undefined,
    briefId: params.get("brief") || undefined,
    missionId: params.get("mission") || undefined,
    taskId: params.get("task") || undefined,
    templateId: params.get("template") || undefined,
    assetId: params.get("asset") || undefined,
    returnTo: params.get("returnTo") || fallbackReturnTo,
  }
}

export function bulk4ContextHref(
  target: string,
  context: Partial<Bulk4CreativeContext> & { studio?: Bulk4StudioMode; returnTo?: string },
) {
  const [pathname, search = ""] = target.split("?")
  const params = new URLSearchParams(search)
  if (context.dossierId) params.set("dossier", context.dossierId)
  if (context.dossierTitle) params.set("dossierTitle", context.dossierTitle)
  if (context.briefId) params.set("brief", context.briefId)
  if (context.missionId) params.set("mission", context.missionId)
  if (context.taskId) params.set("task", context.taskId)
  if (context.templateId) params.set("template", context.templateId)
  if (context.assetId) params.set("asset", context.assetId)
  if (context.studio) params.set("studio", context.studio)
  if (context.returnTo) params.set("returnTo", context.returnTo)
  const next = params.toString()
  return next ? `${pathname}?${next}` : pathname
}
