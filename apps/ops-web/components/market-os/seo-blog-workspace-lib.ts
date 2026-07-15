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


export type SeoWorkspaceView = "command" | "pipeline" | "calendar" | "intelligence" | "governance"
export type SeoActionLog = { id: string; itemId: string; action: string; actor: string; note: string; created_at: string }
export const SEO_LOG_STORAGE_KEY = "market-os-seo-executive-action-logs"
export function loadSeoLogs(): SeoActionLog[] {
  if (typeof window === "undefined") return []
  try { const raw = window.localStorage.getItem(SEO_LOG_STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}
export function persistSeoLogs(logs: SeoActionLog[]) { if (typeof window !== "undefined") window.localStorage.setItem(SEO_LOG_STORAGE_KEY, JSON.stringify(logs)) }
export function addSeoLog(log: Omit<SeoActionLog, "id" | "created_at">) {
  const next = [{ ...log, id: `seo-log-${Date.now()}`, created_at: new Date().toISOString() }, ...loadSeoLogs()].slice(0, 200)
  persistSeoLogs(next); return next
}
export function createSeoSeedIfEmpty() {
  const items = loadSeoItems()
  if (items.length) return items
  const seed: SeoItem[] = [
    scoreItem({ ...emptySeoItem, id: "seo-angelcare-postpartum-guide", title: "Guide complet pour organiser une garde post-partum fiable", slug: "guide-garde-postpartum-fiable-maroc", content_type: "guide", status: "writing", priority: "urgent", owner: "SEO Officer", service_name: "Postpartum support", market: "Morocco", audience: "Parents B2C", primary_keyword: "garde post-partum maroc", secondary_keywords: "nounou post partum, aide maman naissance, garde bébé maroc", search_intent: "Parents need a trustworthy practical guide and a clear way to contact AngelCare.", meta_title: "Garde post-partum au Maroc | Guide AngelCare", meta_description: "Découvrez comment organiser une garde post-partum fiable avec AngelCare: sécurité, profils, suivi et accompagnement.", canonical_url: "", internal_links: "/services/postpartum\n/contact\n/market-os", external_links: "", outline: "H1 Guide garde post-partum\nH2 Besoins des familles\nH2 Critères de confiance\nH2 Process AngelCare\nH2 CTA WhatsApp", draft_body: "AngelCare accompagne les familles avec une approche structurée, humaine et contrôlée. Contactez l'équipe pour une orientation rapide.", review_notes: "Validate claims and add local proof.", publish_url: "", deadline: "This week", approval_status: "working" }),
    scoreItem({ ...emptySeoItem, id: "seo-clinic-partnership-landing", title: "Page service pour partenariats cliniques et maternités", slug: "partenariat-cliniques-maternites", content_type: "landing_page", status: "brief", priority: "high", owner: "Marketing Manager", service_name: "Clinic partnerships", market: "Morocco", audience: "Healthcare partners", primary_keyword: "partenariat maternité maroc", secondary_keywords: "clinique maternité nounou, service post natal clinique", search_intent: "Clinic decision maker wants a credible operating partner and commercial next step.", meta_title: "Partenariat maternités et cliniques | AngelCare", meta_description: "AngelCare aide les cliniques à orienter les familles vers des solutions fiables de garde et accompagnement.", canonical_url: "", internal_links: "/partners\n/contact", external_links: "", outline: "H1 Partnership value\nH2 Patient continuity\nH2 Operating model\nH2 Contact", draft_body: "", review_notes: "Need commercial proof and service boundaries.", publish_url: "", deadline: "This month", approval_status: "brief" }),
    scoreItem({ ...emptySeoItem, id: "seo-academy-trainer-article", title: "Pourquoi former les intervenantes améliore la qualité du service", slug: "formation-intervenantes-qualite-service", content_type: "blog", status: "review", priority: "normal", owner: "Brand Officer", service_name: "Academy", market: "Morocco", audience: "Partners B2B", primary_keyword: "formation nounou maroc", secondary_keywords: "formation auxiliaire parentale, academy garde enfants", search_intent: "Explain quality and trust proof for parents and partners.", meta_title: "Formation nounou au Maroc | Qualité AngelCare", meta_description: "La formation des intervenantes renforce sécurité, confiance et qualité de service pour les familles.", canonical_url: "", internal_links: "/academy\n/services", external_links: "", outline: "H1 Formation and quality\nH2 Standards\nH2 Supervision\nH2 CTA", draft_body: "La qualité opérationnelle dépend de la formation, du suivi et d'un cadre clair. Contactez AngelCare pour en savoir plus.", review_notes: "Manager approval pending.", publish_url: "", deadline: "Today", approval_status: "submitted" }),
  ]
  persistSeoItems(seed); return seed
}
export function duplicateSeoItem(id: string) {
  const items = loadSeoItems(); const source = items.find(i => i.id === id); if (!source) return items
  const copy = scoreItem({ ...source, id: `seo-copy-${Date.now()}`, title: `${source.title} Copy`, slug: `${source.slug}-copy`, status: "draft", approval_status: "none", publish_url: "" })
  const next = [copy, ...items]; persistSeoItems(next); return next
}
export function seoReadinessWarnings(item: SeoItem) {
  const warnings: string[] = []
  if (!item.primary_keyword) warnings.push("Primary keyword missing")
  if (!item.search_intent) warnings.push("Search intent not defined")
  if (!item.meta_title || item.meta_title.length > 62) warnings.push("Meta title missing or too long")
  if (!item.meta_description || item.meta_description.length > 160) warnings.push("Meta description missing or too long")
  if (!item.internal_links) warnings.push("Internal links missing")
  if (!item.draft_body) warnings.push("Draft body missing")
  if (!item.service_name) warnings.push("Service mapping missing")
  return warnings
}
