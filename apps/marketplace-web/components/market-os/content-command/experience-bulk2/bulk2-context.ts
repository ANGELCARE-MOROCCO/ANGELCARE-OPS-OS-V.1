"use client"

import type { StrategicContext } from "./bulk2-types"

const STORAGE_KEY = "angelcare.content-command.bulk2.strategic-context.v1"
const EVENT_NAME = "angelcare:content-command:strategic-context"
const BULK1_STORAGE_KEY = "angelcare.content-command.bulk1.context.v1"

export function readStrategicContext(): StrategicContext | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StrategicContext
    const bulk1Raw = window.sessionStorage.getItem(BULK1_STORAGE_KEY)
    if (!bulk1Raw) return null
    const bulk1 = JSON.parse(bulk1Raw) as { dossierId?: string; dossierCode?: string; dossierTitle?: string; stage?: string; href?: string }
    if (!bulk1.dossierId) return null
    return {
      caseId: bulk1.dossierId,
      caseCode: bulk1.dossierCode || bulk1.dossierId,
      title: bulk1.dossierTitle,
      stage: "observation",
      status: bulk1.stage,
      returnTo: bulk1.href,
    }
  } catch {
    return null
  }
}

export function writeStrategicContext(context: StrategicContext) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context))
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: context }))
}

export function strategicHref(path: string, context: StrategicContext) {
  const query = new URLSearchParams()
  if (context.caseId) { query.set("strategicCaseId", context.caseId); query.set("dossier", context.caseId) }
  if (context.caseCode) query.set("strategicCaseCode", context.caseCode)
  if (context.stage) query.set("strategicStage", context.stage)
  query.set("returnTo", context.returnTo || (typeof window !== "undefined" ? window.location.pathname + window.location.search : path))
  const suffix = query.toString()
  return suffix ? `${path}?${suffix}` : path
}

export function subscribeStrategicContext(listener: (context: StrategicContext | null) => void) {
  if (typeof window === "undefined") return () => undefined
  const handler = (event: Event) => listener((event as CustomEvent<StrategicContext>).detail || readStrategicContext())
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
