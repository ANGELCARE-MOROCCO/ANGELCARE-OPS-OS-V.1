"use client"

import * as React from "react"
import type { ContentHeadquartersSnapshot } from "@/lib/market-os/content-command-headquarters/types"

export const CONTENT_FAMILIES = [
  {
    id: "digital",
    label: "Contenu digital",
    short: "Réseaux, web, vidéo, photographie et publicités",
    categories: ["Photos produits ou service", "Publication Reel", "Publication story", "Publication image", "Publication vidéo", "Vidéos ads promotionnelles"],
    subcategories: ["A.A ANGELCARE ACADEMY", "S.L ANIMATION LUDIQUE MONTESSORI À DOMICILE", "H.S GARDE ACCOMPAGNEMENT ENFANTS À DOMICILE", "P.P ACCOMPAGNEMENT POST PARTUM", "S.K GARDE ACCOMPAGNEMENT ENFANT SPÉCIAL", "K.E ÉVÉNEMENT POUR ENFANT", "F.C PROGRAMME FLASHCARTES"],
  },
  {
    id: "print_offline",
    label: "Print & Offline",
    short: "Imprimés, terrain, événements et supports commerciaux",
    categories: ["Brochure", "Catalog", "Flyer", "Prospectus", "Business Card", "Poster", "Packaging", "Stationery", "Report", "Rollup", "Direct Mailer", "Packaging Insert"],
    subcategories: ["Corporate", "Marketing", "Product", "Sales", "HR & Internal", "Events", "Clients", "Partnerships"],
  },
  {
    id: "corporate_document",
    label: "Documents corporate",
    short: "Politiques, SOP, gouvernance, guides et présentations",
    categories: ["Policy", "SOP", "Executive memo", "Company profile", "Governance document", "Guide", "Agreement", "Form", "Presentation"],
    subcategories: ["Governance & Policies", "Human Resources", "Operations", "Finance & Legal", "Quality & Compliance", "IT & Security", "Marketing & Brand", "Sales & Commercial", "Products & Services", "Training & Development", "Facilities & Maintenance"],
  },
] as const

export type HeadquartersView = "command" | "signals" | "strategies" | "missions" | "directory" | "studio" | "evidence" | "validation" | "source-vault" | "distribution" | "performance" | "attribution" | "optimization" | "learning" | "ai-foundry" | "dossier"

export function useHeadquartersSnapshot() {
  const [snapshot, setSnapshot] = React.useState<ContentHeadquartersSnapshot | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/market-os/content-command-headquarters/snapshot", { cache: "no-store", credentials: "include" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) throw new Error(payload.error || `SNAPSHOT_${response.status}`)
      setSnapshot(payload.snapshot as ContentHeadquartersSnapshot)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "CONTENT_HEADQUARTERS_UNAVAILABLE")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])
  return { snapshot, loading, error, refresh }
}

export async function headquartersAction(action: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/market-os/content-command-headquarters/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, payload }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.ok) throw new Error(body.error || `ACTION_${response.status}`)
  return body.result
}

export function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("fr-FR", includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(value))
  } catch { return value }
}

export function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function tone(value: string) {
  const status = value.toLowerCase()
  if (["active", "approved", "validated", "verified", "published", "closed", "done", "pass", "healthy", "source_secured", "classified", "ready_distribution"].some((item) => status.includes(item))) return "success"
  if (["blocked", "failed", "critical", "rejected", "expired", "cancelled", "revision_required", "integrity_failed"].some((item) => status.includes(item))) return "danger"
  if (["review", "warning", "medium", "checkpoint", "submitted", "source_required", "draft", "qualified"].some((item) => status.includes(item))) return "warning"
  return "neutral"
}

export function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AC"
}
