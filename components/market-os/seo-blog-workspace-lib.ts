"use client"

export type SeoStatus = "draft" | "brief" | "writing" | "review" | "approved" | "published" | "rejected" | "archived"
export type SeoPriority = "urgent" | "high" | "normal" | "low"
export type SeoType = "blog" | "landing_page" | "guide" | "faq" | "case_study" | "service_page" | "press" | "news"

export type SeoItem = {
  id: string
  title: string
  slug: string
  content_type: SeoType
  status: SeoStatus
  priority: SeoPriority
  owner: string
  service_name: string
  market: string
  audience: string
  primary_keyword: string
  secondary_keywords: string
  search_intent: string
  meta_title: string
  meta_description: string
  canonical_url: string
  internal_links: string
  external_links: string
  outline: string
  draft_body: string
  review_notes: string
  publish_url: string
  deadline: string
  seo_score: number
  readability_score: number
  conversion_score: number
  approval_status: string
  created_at?: string
  updated_at?: string
}

export type SeoChecklistItem = { id: string; label: string; done: boolean }
export type SeoEvent = { id: string; type: "comment" | "event"; message: string; created_at: string }

export const SEO_STORAGE_KEY = "market-os-seo-blog-items"
export const SEO_TYPES: Record<SeoType, string> = {
  blog: "Blog article",
  landing_page: "Landing page",
  guide: "Long-form guide",
  faq: "FAQ",
  case_study: "Case study",
  service_page: "Service page",
  press: "Press",
  news: "News",
}
export const SEO_STATUSES: SeoStatus[] = ["draft", "brief", "writing", "review", "approved", "published", "rejected", "archived"]
export const SEO_STATUS_LABELS: Record<SeoStatus, string> = {
  draft: "Draft",
  brief: "Brief",
  writing: "Writing",
  review: "Review",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
}
export const SEO_OWNERS = ["SEO Officer", "Content Officer", "Marketing Manager", "Brand Officer", "Growth Officer"]
export const SEO_MARKETS = ["Morocco", "France", "Spain", "UAE", "Qatar", "KSA", "Global"]
export const SEO_AUDIENCES = ["Parents B2C", "Partners B2B", "Families", "Corporate HR", "Healthcare partners", "Schools"]

export const emptySeoItem: SeoItem = {
  id: "",
  title: "",
  slug: "",
  content_type: "blog",
  status: "draft",
  priority: "normal",
  owner: "SEO Officer",
  service_name: "",
  market: "Morocco",
  audience: "Parents B2C",
  primary_keyword: "",
  secondary_keywords: "",
  search_intent: "",
  meta_title: "",
  meta_description: "",
  canonical_url: "",
  internal_links: "",
  external_links: "",
  outline: "",
  draft_body: "",
  review_notes: "",
  publish_url: "",
  deadline: "",
  seo_score: 0,
  readability_score: 0,
  conversion_score: 0,
  approval_status: "none",
}

export function slugify(v: string) {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
export function loadSeoItems(): SeoItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(SEO_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
export function persistSeoItems(items: SeoItem[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(items))
}
export function upsertSeoItem(item: SeoItem) {
  const items = loadSeoItems()
  const exists = items.some((x) => x.id === item.id)
  const next = exists ? items.map((x) => x.id === item.id ? item : x) : [item, ...items]
  persistSeoItems(next)
  return next
}
export function deleteSeoItem(id: string) {
  const next = loadSeoItems().filter((x) => x.id !== id)
  persistSeoItems(next)
  return next
}
export function calcSeo(item: SeoItem) {
  const fields = [item.title, item.slug, item.primary_keyword, item.search_intent, item.meta_title, item.meta_description, item.outline, item.draft_body, item.internal_links, item.service_name]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}
export function calcRead(item: SeoItem) {
  const words = (item.draft_body || "").trim().split(/\s+/).filter(Boolean).length
  if (!words) return 0
  return Math.min(100, Math.max(20, Math.round((words / 800) * 80 + (item.outline ? 20 : 0))))
}
export function calcConv(item: SeoItem) {
  const body = `${item.draft_body} ${item.meta_description}`.toLowerCase()
  const cta = body.includes("whatsapp") || body.includes("devis") || body.includes("contact") || body.includes("book")
  return Math.min(100, (cta ? 45 : 0) + (item.service_name ? 30 : 0) + (item.audience ? 25 : 0))
}
export function scoreItem(item: SeoItem): SeoItem {
  return { ...item, seo_score: calcSeo(item), readability_score: calcRead(item), conversion_score: calcConv(item), updated_at: new Date().toISOString() }
}
export function checklistKey(id: string) { return `market-os-seo-checklist-${id}` }
export function eventsKey(id: string) { return `market-os-seo-events-${id}` }
export function defaultChecklist(): SeoChecklistItem[] {
  return [
    { id: "keyword", label: "Primary keyword defined", done: false },
    { id: "intent", label: "Search intent confirmed", done: false },
    { id: "meta", label: "Meta title and description completed", done: false },
    { id: "outline", label: "H1/H2/H3 outline structured", done: false },
    { id: "links", label: "Internal links planned", done: false },
    { id: "cta", label: "Conversion CTA included", done: false },
    { id: "review", label: "Manager review completed", done: false },
    { id: "publish", label: "Published URL verified", done: false },
  ]
}
export function loadChecklist(id: string): SeoChecklistItem[] {
  if (typeof window === "undefined") return defaultChecklist()
  try {
    const raw = window.localStorage.getItem(checklistKey(id))
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : defaultChecklist()
  } catch { return defaultChecklist() }
}
export function persistChecklist(id: string, items: SeoChecklistItem[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(checklistKey(id), JSON.stringify(items))
}
export function loadEvents(id: string): SeoEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(eventsKey(id))
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
export function persistEvents(id: string, events: SeoEvent[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(eventsKey(id), JSON.stringify(events))
}
