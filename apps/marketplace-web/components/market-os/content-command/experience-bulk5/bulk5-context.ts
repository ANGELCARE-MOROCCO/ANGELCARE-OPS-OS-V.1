"use client"

import * as React from "react"
import { readBulk1Context } from "../experience-bulk1/bulk1-context"
import { readBulk3Context } from "../experience-bulk3/bulk3-context"
import { readBulk4Context } from "../experience-bulk4/bulk4-context"
import type { Bulk5Context, Bulk5WorkspaceMode } from "./bulk5-types"

const STORAGE_KEY = "angelcare.content-command.bulk5.proof-context.v1"

export function readBulk5Context(): Bulk5Context | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Bulk5Context : null
  } catch { return null }
}

export function writeBulk5Context(value: Bulk5Context) {
  if (typeof window === "undefined") return
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* optional continuity */ }
}

export function contextFromAllSources(stage: Bulk5WorkspaceMode, fallbackReturnTo: string): Bulk5Context {
  const now = new Date().toISOString()
  if (typeof window === "undefined") return { stage, sourceHref: "", returnTo: fallbackReturnTo, updatedAt: now }
  const params = new URLSearchParams(window.location.search)
  const own = readBulk5Context()
  const b4 = readBulk4Context()
  const b3 = readBulk3Context()
  const b1 = readBulk1Context()
  return {
    dossierId: params.get("dossier") || own?.dossierId || b4?.dossierId || b3?.dossierId || b1?.dossierId || undefined,
    dossierTitle: params.get("dossierTitle") || own?.dossierTitle || b4?.dossierTitle || b3?.dossierTitle || b1?.dossierTitle || undefined,
    missionId: params.get("mission") || own?.missionId || b4?.missionId || b3?.missionId || undefined,
    taskId: params.get("task") || own?.taskId || b4?.taskId || b3?.taskId || undefined,
    assetId: params.get("asset") || own?.assetId || b4?.assetId || undefined,
    evidenceId: params.get("evidence") || own?.evidenceId || undefined,
    reviewId: params.get("review") || own?.reviewId || undefined,
    version: params.get("version") || own?.version || undefined,
    stage,
    sourceHref: window.location.pathname + window.location.search,
    returnTo: params.get("returnTo") || own?.returnTo || b4?.returnTo || b3?.returnTo || b1?.href || fallbackReturnTo,
    updatedAt: now,
  }
}

export function bulk5ContextHref(target: string, context: Partial<Bulk5Context> & { stage?: Bulk5WorkspaceMode; returnTo?: string }) {
  const [pathname, currentSearch = ""] = target.split("?")
  const params = new URLSearchParams(currentSearch)
  if (context.dossierId) params.set("dossier", context.dossierId)
  if (context.dossierTitle) params.set("dossierTitle", context.dossierTitle)
  if (context.missionId) params.set("mission", context.missionId)
  if (context.taskId) params.set("task", context.taskId)
  if (context.assetId) params.set("asset", context.assetId)
  if (context.evidenceId) params.set("evidence", context.evidenceId)
  if (context.reviewId) params.set("review", context.reviewId)
  if (context.version) params.set("version", context.version)
  if (context.stage) params.set("proofStage", context.stage)
  if (context.returnTo) params.set("returnTo", context.returnTo)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function useBulk5Context(stage: Bulk5WorkspaceMode, fallbackReturnTo: string) {
  const [context, setContext] = React.useState<Bulk5Context>({ stage, sourceHref: "", returnTo: fallbackReturnTo, updatedAt: "" })
  React.useEffect(() => { setContext(contextFromAllSources(stage, fallbackReturnTo)) }, [stage, fallbackReturnTo])
  return context
}
