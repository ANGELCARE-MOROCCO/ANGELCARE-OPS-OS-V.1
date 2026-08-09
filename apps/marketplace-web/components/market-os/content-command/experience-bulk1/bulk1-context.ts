"use client"

export type Bulk1ContextSnapshot = {
  dossierId: string
  dossierTitle: string
  dossierCode: string
  stage: string
  href: string
  updatedAt: string
}

const STORAGE_KEY = "angelcare.content-command.bulk1.context.v1"

export function readBulk1Context(): Bulk1ContextSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Bulk1ContextSnapshot
    if (!value.dossierId || !value.href) return null
    return value
  } catch {
    return null
  }
}

export function writeBulk1Context(value: Bulk1ContextSnapshot): void {
  if (typeof window === "undefined") return
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* session storage is optional continuity only */ }
}

export function clearBulk1Context(): void {
  if (typeof window === "undefined") return
  try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* no-op */ }
}

export function contextualHref(target: string, dossierId: string, returnTo: string, stage?: string): string {
  const [pathname, search = ""] = target.split("?")
  const params = new URLSearchParams(search)
  params.set("dossier", dossierId)
  params.set("returnTo", returnTo)
  if (stage) params.set("stage", stage)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
