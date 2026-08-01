"use client"

import { contentCommandRequest } from '@/components/market-os/content-command/runtime/content-command-runtime'
import Link from "next/link"
import * as React from "react"

export const CONTENT_ITEMS_KEY = "market_os_content_command_items_v2"
export const CONTENT_TASKS_KEY = "market_os_content_command_tasks_v2"
export const CONTENT_ASSETS_KEY = "market_os_content_command_assets_v2"
export const CONTENT_BRIEFS_KEY = "market_os_content_command_briefs_v2"
export const CONTENT_RULES_KEY = "market_os_content_command_brand_rules_v2"
export const CONTENT_LOGS_KEY = "market_os_content_command_logs_v2"

export type ContentStatus = "idea" | "brief" | "draft" | "review" | "approved" | "scheduled" | "published" | "revision" | "archived"
export type Channel = "Blog" | "Instagram" | "Facebook" | "TikTok" | "LinkedIn" | "Newsletter" | "WhatsApp" | "Landing Page" | "Clinic Partner" | "Ambassador Kit"
export type Priority = "Low" | "Medium" | "High" | "Critical"

export type ContentItem = {
  id: string
  title: string
  type: string
  channel: Channel
  campaign: string
  owner: string
  reviewer: string
  status: ContentStatus
  priority: Priority
  dueDate: string
  scheduledDate: string
  body: string
  objective: string
  audience: string
  angle: string
  cta: string
  assets: string[]
  brandScore: number
  seoKeyword: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ContentTask = {
  id: string
  contentId: string
  title: string
  owner: string
  status: "todo" | "doing" | "done" | "blocked"
  dueDate: string
  priority: Priority
  notes: string
}

export type ContentAsset = {
  id: string
  name: string
  type: "Image" | "Video" | "PDF" | "Script" | "Brief" | "Landing" | "Presentation" | "Other"
  channel: Channel
  linkedContentId: string
  owner: string
  status: "draft" | "approved" | "needs revision" | "archived"
  url: string
  notes: string
}

export type ContentBrief = {
  id: string
  title: string
  campaign: string
  audience: string
  objective: string
  message: string
  channel: Channel
  owner: string
  dueDate: string
  status: "draft" | "ready" | "used" | "archived"
}

export type BrandRule = {
  id: string
  title: string
  category: "Tone" | "Compliance" | "Visual" | "Message" | "CTA" | "Medical sensitivity"
  required: boolean
  active: boolean
  notes: string
}

export type ContentLog = {
  id: string
  timestamp: string
  action: string
  entity: string
  detail: string
}

export type ContentStore = {
  items: ContentItem[]
  tasks: ContentTask[]
  assets: ContentAsset[]
  briefs: ContentBrief[]
  rules: BrandRule[]
  logs: ContentLog[]
}

export const statusFlow: ContentStatus[] = ["idea", "brief", "draft", "review", "approved", "scheduled", "published"]
export const channels: Channel[] = ["Blog", "Instagram", "Facebook", "TikTok", "LinkedIn", "Newsletter", "WhatsApp", "Landing Page", "Clinic Partner", "Ambassador Kit"]
export const priorities: Priority[] = ["Low", "Medium", "High", "Critical"]
export const owners = ["Content Lead", "Brand Manager", "SEO Manager", "Creative Producer", "Community Manager", "Partnership Content Lead", "Founder Review"]

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
}

export function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export function nowISO() {
  return new Date().toISOString()
}

export const seedItems: ContentItem[] = []
export const seedTasks: ContentTask[] = []
export const seedAssets: ContentAsset[] = []
export const seedBriefs: ContentBrief[] = []
export const seedRules: BrandRule[] = []

export function defaultStore(): ContentStore {
  return { items: [], tasks: [], assets: [], briefs: [], rules: [], logs: [] }
}

let canonicalStoreCache: ContentStore | null = null

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function normalizeStore(value: unknown): ContentStore {
  const row = value && typeof value === "object" ? value as Partial<ContentStore> : {}
  return {
    items: safeArray<ContentItem>(row.items),
    tasks: safeArray<ContentTask>(row.tasks),
    assets: safeArray<ContentAsset>(row.assets),
    briefs: safeArray<ContentBrief>(row.briefs),
    rules: safeArray<BrandRule>(row.rules),
    logs: safeArray<ContentLog>(row.logs),
  }
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

/**
 * Browser storage is read only for explicit migration/recovery. It is no longer
 * an operational Content Command source of truth.
 */
export function readLegacyStoreForMigration(): ContentStore {
  return {
    items: readJson(CONTENT_ITEMS_KEY, seedItems),
    tasks: readJson(CONTENT_TASKS_KEY, seedTasks),
    assets: readJson(CONTENT_ASSETS_KEY, seedAssets),
    briefs: readJson(CONTENT_BRIEFS_KEY, seedBriefs),
    rules: readJson(CONTENT_RULES_KEY, seedRules),
    logs: readJson(CONTENT_LOGS_KEY, [] as ContentLog[]),
  }
}

export function clearLegacyBusinessStore() {
  if (typeof window === "undefined") return
  for (const key of [CONTENT_ITEMS_KEY, CONTENT_TASKS_KEY, CONTENT_ASSETS_KEY, CONTENT_BRIEFS_KEY, CONTENT_RULES_KEY, CONTENT_LOGS_KEY]) {
    window.localStorage.removeItem(key)
  }
}

/** @deprecated Business records are canonical server records. */
export function writeJson<T>(_key: string, _value: T) {
  console.warn("[CONTENT_COMMAND_LOCAL_WRITE_RETIRED] Business records are persisted through the canonical Headquarters runtime.")
}

export function loadStore(): ContentStore {
  return canonicalStoreCache || defaultStore()
}

export async function fetchCanonicalContentStore(): Promise<ContentStore> {
  const payload = await contentCommandRequest<{ ok: boolean; store: unknown }>("/api/market-os/content-command-center/data")
  const store = normalizeStore(payload.store)
  canonicalStoreCache = store
  return store
}

export async function persistCanonicalCommit(before: ContentStore, after: ContentStore, mutationAction: string, detail: string) {
  const payload = await contentCommandRequest<{ ok: boolean; store: unknown }>("/api/market-os/content-command-center/actions", {
    method: "POST",
    body: JSON.stringify({
      action: "canonical_store_commit",
      source: "content-command-system",
      payload: { before, after, mutationAction, detail },
    }),
  })
  const store = normalizeStore(payload.store)
  canonicalStoreCache = store
  return store
}


export async function commitCanonicalStoreChange(
  updater: (draft: ContentStore) => ContentStore | void,
  action = "update",
  detail = "Updated content command store",
): Promise<ContentStore> {
  const before = normalizeStore(canonicalStoreCache || await fetchCanonicalContentStore())
  const copy: ContentStore = {
    items: [...before.items],
    tasks: [...before.tasks],
    assets: [...before.assets],
    briefs: [...before.briefs],
    rules: [...before.rules],
    logs: [...before.logs],
  }
  const updated = updater(copy)
  const result: ContentStore = updated === undefined ? copy : updated
  return persistCanonicalCommit(before, result, action, detail)
}

/**
 * Compatibility bridge for evolved workspaces that still call saveStore().
 * The save is canonical and asynchronous; no browser business record is written.
 */
export function saveStore(next: ContentStore) {
  const before = normalizeStore(canonicalStoreCache || defaultStore())
  canonicalStoreCache = normalizeStore(next)
  void persistCanonicalCommit(before, canonicalStoreCache, "compatibility_save", "Canonical compatibility workspace save")
    .catch((error) => console.error("[CONTENT_COMMAND_CANONICAL_SAVE_FAILED]", error))
}

export function useContentStore() {
  const [store, setStore] = React.useState<ContentStore>(() => canonicalStoreCache || defaultStore())
  const [loading, setLoading] = React.useState(!canonicalStoreCache)
  const [syncing, setSyncing] = React.useState(false)
  const [error, setError] = React.useState("")
  const mounted = React.useRef(true)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const next = await fetchCanonicalContentStore()
      if (mounted.current) setStore(next)
      return next
    } catch (nextError) {
      if (mounted.current) setError(nextError instanceof Error ? nextError.message : "CONTENT_COMMAND_LOAD_FAILED")
      return canonicalStoreCache || defaultStore()
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    mounted.current = true
    void refresh()
    return () => { mounted.current = false }
  }, [refresh])

  const commit = React.useCallback((updater: (draft: ContentStore) => ContentStore | void, action = "update", detail = "Updated content command store") => {
    setStore((current) => {
      const before = normalizeStore(current)
      const copy: ContentStore = {
        items: [...before.items],
        tasks: [...before.tasks],
        assets: [...before.assets],
        briefs: [...before.briefs],
        rules: [...before.rules],
        logs: [...before.logs],
      }
      const updated = updater(copy)
      const result: ContentStore = updated === undefined ? copy : updated
      const optimistic: ContentStore = {
        ...result,
        logs: [{ id: uid("pending"), timestamp: nowISO(), action, entity: "content-command", detail: `${detail} · synchronisation en cours` }, ...result.logs].slice(0, 120),
      }
      canonicalStoreCache = optimistic
      setSyncing(true)
      setError("")
      void persistCanonicalCommit(before, optimistic, action, detail)
        .then((persisted) => { if (mounted.current) setStore(persisted) })
        .catch(async (nextError) => {
          if (mounted.current) setError(nextError instanceof Error ? nextError.message : "CONTENT_COMMAND_COMMIT_FAILED")
          const restored = await refresh()
          if (mounted.current) setStore(restored)
        })
        .finally(() => { if (mounted.current) setSyncing(false) })
      return optimistic
    })
  }, [refresh])

  const reset = React.useCallback(() => {
    void refresh()
  }, [refresh])

  return { store, commit, reset, refresh, loading, syncing, error }
}

export function statusLabel(value: string) {
  const labels: Record<string, string> = {
    idea: "Idée",
    brief: "Brief",
    draft: "Brouillon",
    review: "En révision",
    approved: "Approuvé",
    scheduled: "Planifié",
    published: "Publié",
    revision: "Correction requise",
    archived: "Archivé",
    todo: "À faire",
    doing: "En cours",
    done: "Terminé",
    blocked: "Bloqué",
    ready: "Prêt",
    used: "Utilisé",
    active: "Actif",
    inactive: "Inactif",
    "needs revision": "Correction requise",
  }
  return labels[value] || value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function nextStatus(status: ContentStatus): ContentStatus {
  const idx = statusFlow.indexOf(status)
  if (idx < 0) return "draft"
  return statusFlow[Math.min(statusFlow.length - 1, idx + 1)]
}

export function itemReadiness(item: ContentItem, tasks: ContentTask[], rules: BrandRule[]) {
  let score = 20
  if (item.title.trim()) score += 10
  if (item.body.trim().length > 80) score += 15
  if (item.owner.trim()) score += 10
  if (item.reviewer.trim()) score += 10
  if (item.assets.length) score += 10
  if (item.scheduledDate) score += 10
  if (tasks.some((task) => task.contentId === item.id && task.status === "done")) score += 10
  if (item.brandScore >= 75) score += 5
  if (rules.some((rule) => rule.required && rule.active)) score += 5
  return Math.max(0, Math.min(100, score))
}

export function canPublish(item: ContentItem, tasks: ContentTask[], rules: BrandRule[]) {
  const blockingTasks = tasks.filter((task) => task.contentId === item.id && (task.status === "blocked" || task.status === "todo"))
  return (item.status === "approved" || item.status === "scheduled") && item.brandScore >= 70 && blockingTasks.length === 0 && Boolean(item.scheduledDate) && rules.some((rule) => rule.active)
}

export function isOverdue(date: string) {
  return Boolean(date) && date < todayISO(0)
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="cc360-existing-workspace">{children}</div>
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`cc360-panel rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,40,78,.065)] ${className}`}>
      {children}
    </section>
  )
}

export function Badge({ children, kind = "soft" }: { children: React.ReactNode; kind?: "soft" | "priority" | "success" | "warning" | "danger" | "dark" }) {
  const styles: Record<NonNullable<Parameters<typeof Badge>[0]["kind"]>, string> = {
    soft: "border-slate-200 bg-slate-50 text-slate-800",
    priority: "border-rose-200 bg-rose-50 text-rose-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    dark: "border-slate-900 bg-slate-900 text-white",
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em] ${styles[kind]}`}>{children}</span>
}

export function Button({ children, onClick, href, kind = "soft", type = "button", disabled = false }: { children: React.ReactNode; onClick?: () => void; href?: string; kind?: "primary" | "soft" | "light" | "danger" | "dark"; type?: "button" | "submit"; disabled?: boolean }) {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50"
  const styles = {
    primary: "border border-[#10345f] bg-[#10345f] text-white shadow-[0_10px_26px_rgba(16,52,95,.18)] hover:bg-[#0a2749]",
    soft: "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50",
    light: "border border-white/25 bg-white/10 text-white hover:bg-white/15",
    danger: "border border-red-700 bg-red-700 text-white hover:bg-red-800",
    dark: "border border-slate-950 bg-slate-950 text-white hover:bg-slate-800",
  }
  if (href) return <Link href={href} className={`${base} ${styles[kind]}`}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[kind]}`}>{children}</button>
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-[.09em] text-slate-700">{label}</span>{children}{hint ? <small className="block text-xs font-semibold leading-5 text-slate-600">{hint}</small> : null}</label>
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 ${props.className ?? ""}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100 ${props.className ?? ""}`} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 5} className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 ${props.className ?? ""}`} />
}

export function Meter({ value }: { value: number }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-sky-700 via-blue-600 to-emerald-600" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

export function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <Panel className="p-5"><p className="text-xs font-black uppercase tracking-[.09em] text-slate-700">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-bold text-slate-600">{sub}</p></Panel>
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <header data-cc-dark className="cc360-page-header flex flex-col gap-5 rounded-[26px] border border-white/15 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,.18),transparent_30%),linear-gradient(135deg,#061224,#0b2748_56%,#123b66)] p-6 shadow-[0_22px_60px_rgba(5,18,36,.18)] lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white lg:text-4xl">{title}</h1><p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-100">{description}</p></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</header>
}

export function contentTemplate(): ContentItem {
  return {
    id: uid("content"),
    title: "",
    type: "Post",
    channel: "Instagram",
    campaign: "",
    owner: "Content Lead",
    reviewer: "Brand Manager",
    status: "idea",
    priority: "Medium",
    dueDate: todayISO(3),
    scheduledDate: todayISO(7),
    body: "",
    objective: "",
    audience: "",
    angle: "",
    cta: "",
    assets: [],
    brandScore: 70,
    seoKeyword: "",
    notes: "",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }
}

export function ContentForm({ initial, onSave, submitLabel = "Enregistrer le contenu" }: { initial?: ContentItem; onSave: (item: ContentItem) => void; submitLabel?: string }) {
  const [form, setForm] = React.useState<ContentItem>(() => initial ?? contentTemplate())
  const [stage, setStage] = React.useState(0)
  const set = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) => setForm((prev) => ({ ...prev, [key]: value, updatedAt: nowISO() }))
  const stages = ["Identité", "Audience", "Canal", "Gouvernance", "Contenu", "Revue"]
  const required = [form.title, form.type, form.channel, form.owner, form.reviewer, form.dueDate, form.objective, form.audience]
  const completion = Math.round((required.filter((value) => String(value || "").trim()).length / required.length) * 100)
  const missing = [
    !form.title.trim() ? "Titre" : null,
    !form.objective.trim() ? "Objectif" : null,
    !form.audience.trim() ? "Audience" : null,
    !form.owner.trim() ? "Responsable" : null,
    !form.reviewer.trim() ? "Validateur" : null,
    !form.dueDate ? "Échéance" : null,
  ].filter(Boolean) as string[]

  return <form onSubmit={(event) => { event.preventDefault(); if (stage < stages.length - 1) { setStage((current) => current + 1); return }; onSave({ ...form, title: form.title.trim(), updatedAt: nowISO() }) }} className="cc360-form-studio">
    <div className="cc360-form-main">
      <nav className="cc360-form-stages" aria-label="Étapes du contenu">
        {stages.map((label, index) => <button key={label} type="button" onClick={() => setStage(index)} className={stage === index ? "is-active" : index < stage ? "is-complete" : ""}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong></button>)}
      </nav>

      <section className="cc360-form-stage">
        {stage === 0 ? <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Titre"><Input required value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Titre opérationnel du contenu" /></Field>
          <Field label="Type"><Input value={form.type} onChange={(event) => set("type", event.target.value)} placeholder="Carousel, brochure, landing, vidéo…" /></Field>
          <Field label="Campagne"><Input value={form.campaign} onChange={(event) => set("campaign", event.target.value)} placeholder="Campagne rattachée" /></Field>
          <Field label="Priorité"><Select value={form.priority} onChange={(event) => set("priority", event.target.value as Priority)}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></Field>
          <div className="lg:col-span-2"><Field label="Objectif"><Textarea rows={4} value={form.objective} onChange={(event) => set("objective", event.target.value)} placeholder="Résultat attendu, besoin business et critère de succès" /></Field></div>
        </div> : null}

        {stage === 1 ? <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Audience"><Textarea rows={4} value={form.audience} onChange={(event) => set("audience", event.target.value)} placeholder="Public, contexte, douleur et niveau de maturité" /></Field>
          <Field label="Angle stratégique"><Textarea rows={4} value={form.angle} onChange={(event) => set("angle", event.target.value)} placeholder="Pourquoi ce contenu doit convaincre" /></Field>
          <Field label="CTA"><Input value={form.cta} onChange={(event) => set("cta", event.target.value)} placeholder="Réserver, postuler, appeler, envoyer un message…" /></Field>
          <Field label="Mot-clé SEO"><Input value={form.seoKeyword} onChange={(event) => set("seoKeyword", event.target.value)} placeholder="Mot-clé optionnel" /></Field>
        </div> : null}

        {stage === 2 ? <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Canal"><Select value={form.channel} onChange={(event) => set("channel", event.target.value as Channel)}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</Select></Field>
          <Field label="Date de publication planifiée" hint="Une date interne ne prouve pas une publication externe."><Input type="date" value={form.scheduledDate} onChange={(event) => set("scheduledDate", event.target.value)} /></Field>
          <Field label="Statut"><Select value={form.status} onChange={(event) => set("status", event.target.value as ContentStatus)}>{[...statusFlow, "revision", "archived"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</Select></Field>
          <Field label="Score marque"><Input type="number" min={0} max={100} value={form.brandScore} onChange={(event) => set("brandScore", Number(event.target.value))} /></Field>
        </div> : null}

        {stage === 3 ? <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Responsable"><Select value={form.owner} onChange={(event) => set("owner", event.target.value)}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</Select></Field>
          <Field label="Validateur"><Select value={form.reviewer} onChange={(event) => set("reviewer", event.target.value)}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</Select></Field>
          <Field label="Échéance"><Input type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></Field>
          <Field label="Assets liés" hint="Les références d’assets existantes restent préservées dans le record."><Input value={form.assets.join(", ")} readOnly /></Field>
        </div> : null}

        {stage === 4 ? <div className="grid gap-4">
          <Field label="Contenu / script / note de production"><Textarea rows={14} value={form.body} onChange={(event) => set("body", event.target.value)} placeholder="Rédigez le contenu, le script, le brief ou les instructions de production." /></Field>
          <Field label="Notes internes"><Textarea rows={6} value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Risques, remarques de révision, assets manquants et dépendances." /></Field>
        </div> : null}

        {stage === 5 ? <div className="cc360-form-review">
          <header data-cc-dark><div><span>Final review</span><h2>{form.title || "Contenu sans titre"}</h2><p>Vérifiez la stratégie, la gouvernance et les prérequis avant l’enregistrement.</p></div><Badge kind={missing.length ? "warning" : "success"}>{missing.length ? `${missing.length} point(s) incomplet(s)` : "Prêt"}</Badge></header>
          <dl><div><dt>Type / Canal</dt><dd>{form.type} · {form.channel}</dd></div><div><dt>Campagne</dt><dd>{form.campaign || "Non rattachée"}</dd></div><div><dt>Responsable / Validateur</dt><dd>{form.owner} · {form.reviewer}</dd></div><div><dt>Statut / Priorité</dt><dd>{statusLabel(form.status)} · {form.priority}</dd></div><div><dt>Échéance / Planification</dt><dd>{form.dueDate || "Non définie"} · {form.scheduledDate || "Non planifiée"}</dd></div><div><dt>Objectif</dt><dd>{form.objective || "Non défini"}</dd></div><div><dt>Audience</dt><dd>{form.audience || "Non définie"}</dd></div><div><dt>CTA</dt><dd>{form.cta || "Non défini"}</dd></div></dl>
        </div> : null}
      </section>

      <footer className="cc360-form-footer"><Button type="button" disabled={stage === 0} onClick={() => setStage((current) => Math.max(0, current - 1))}>Précédent</Button><div><Button href="/market-os/content-command-center">Annuler</Button><Button kind="primary" type="submit">{stage === stages.length - 1 ? submitLabel : "Continuer"}</Button></div></footer>
    </div>

    <aside className="cc360-form-rail">
      <div data-cc-dark><span>Content readiness</span><strong>{completion}%</strong><Meter value={completion} /></div>
      <section><h3>Identité du contenu</h3><strong>{form.title || "Titre à définir"}</strong><p>{form.campaign || "Sans campagne"} · {form.channel}</p></section>
      <section><h3>Gouvernance</h3><dl><div><dt>Responsable</dt><dd>{form.owner || "Non défini"}</dd></div><div><dt>Validateur</dt><dd>{form.reviewer || "Non défini"}</dd></div><div><dt>Échéance</dt><dd>{form.dueDate || "Non définie"}</dd></div><div><dt>Brand score</dt><dd>{form.brandScore}%</dd></div></dl></section>
      <section><h3>Éléments manquants</h3>{missing.length ? <ul>{missing.map((label) => <li key={label}>{label}</li>)}</ul> : <p className="is-success">Les exigences essentielles sont renseignées.</p>}</section>
      <section><h3>Vérité d’exécution</h3><p>Enregistrer ce record ne signifie pas qu’un message a été envoyé ou qu’une publication externe a été vérifiée.</p></section>
    </aside>
  </form>
}

export function TaskForm({ items, onSave }: { items: ContentItem[]; onSave: (task: ContentTask) => void }) {
  const [task, setTask] = React.useState<ContentTask>({ id: uid("task"), contentId: items[0]?.id ?? "", title: "", owner: "Content Lead", status: "todo", dueDate: todayISO(2), priority: "Medium", notes: "" })
  React.useEffect(() => { if (!task.contentId && items[0]?.id) setTask((prev) => ({ ...prev, contentId: items[0].id })) }, [items, task.contentId])
  const set = <K extends keyof ContentTask>(key: K, value: ContentTask[K]) => setTask((prev) => ({ ...prev, [key]: value }))
  return <form onSubmit={(event) => { event.preventDefault(); if (!task.contentId) return; onSave(task); setTask({ id: uid("task"), contentId: items[0]?.id ?? "", title: "", owner: "Content Lead", status: "todo", dueDate: todayISO(2), priority: "Medium", notes: "" }) }} className="grid gap-4 lg:grid-cols-2">
    <Field label="Task title"><Input required value={task.title} onChange={(event) => set("title", event.target.value)} /></Field>
    <Field label="Linked content"><Select value={task.contentId} onChange={(event) => set("contentId", event.target.value)}>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></Field>
    <Field label="Owner"><Select value={task.owner} onChange={(event) => set("owner", event.target.value)}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</Select></Field>
    <Field label="Deadline"><Input type="date" value={task.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></Field>
    <Field label="Priority"><Select value={task.priority} onChange={(event) => set("priority", event.target.value as Priority)}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></Field>
    <Field label="Status"><Select value={task.status} onChange={(event) => set("status", event.target.value as ContentTask["status"])}>{["todo", "doing", "done", "blocked"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</Select></Field>
    <div className="lg:col-span-2"><Field label="Notes"><Textarea value={task.notes} onChange={(event) => set("notes", event.target.value)} /></Field></div>
    <div className="lg:col-span-2"><Button kind="primary" type="submit" disabled={!items.length}>Create task</Button></div>
  </form>
}

export function AssetForm({ items, onSave }: { items: ContentItem[]; onSave: (asset: ContentAsset) => void }) {
  const [asset, setAsset] = React.useState<ContentAsset>({ id: uid("asset"), name: "", type: "Image", channel: "Instagram", linkedContentId: items[0]?.id ?? "", owner: "Creative Producer", status: "draft", url: "", notes: "" })
  React.useEffect(() => { if (!asset.linkedContentId && items[0]?.id) setAsset((prev) => ({ ...prev, linkedContentId: items[0].id })) }, [items, asset.linkedContentId])
  const set = <K extends keyof ContentAsset>(key: K, value: ContentAsset[K]) => setAsset((prev) => ({ ...prev, [key]: value }))
  return <form onSubmit={(event) => { event.preventDefault(); if (!asset.linkedContentId) return; onSave(asset); setAsset({ id: uid("asset"), name: "", type: "Image", channel: "Instagram", linkedContentId: items[0]?.id ?? "", owner: "Creative Producer", status: "draft", url: "", notes: "" }) }} className="grid gap-4 lg:grid-cols-2">
    <Field label="Asset name"><Input required value={asset.name} onChange={(event) => set("name", event.target.value)} /></Field>
    <Field label="Asset type"><Select value={asset.type} onChange={(event) => set("type", event.target.value as ContentAsset["type"])}>{["Image", "Video", "PDF", "Script", "Brief", "Landing", "Presentation", "Other"].map((type) => <option key={type}>{type}</option>)}</Select></Field>
    <Field label="Channel"><Select value={asset.channel} onChange={(event) => set("channel", event.target.value as Channel)}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</Select></Field>
    <Field label="Linked content"><Select value={asset.linkedContentId} onChange={(event) => set("linkedContentId", event.target.value)}>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></Field>
    <Field label="Owner"><Select value={asset.owner} onChange={(event) => set("owner", event.target.value)}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</Select></Field>
    <Field label="Status"><Select value={asset.status} onChange={(event) => set("status", event.target.value as ContentAsset["status"])}>{["draft", "approved", "needs revision", "archived"].map((status) => <option key={status}>{status}</option>)}</Select></Field>
    <Field label="Asset URL / reference"><Input value={asset.url} onChange={(event) => set("url", event.target.value)} placeholder="Paste drive link or reference" /></Field>
    <div className="lg:col-span-2"><Field label="Notes"><Textarea value={asset.notes} onChange={(event) => set("notes", event.target.value)} /></Field></div>
    <div className="lg:col-span-2"><Button kind="primary" type="submit" disabled={!items.length}>Register asset</Button></div>
  </form>
}

export function BriefForm({ onSave }: { onSave: (brief: ContentBrief) => void }) {
  const [brief, setBrief] = React.useState<ContentBrief>({ id: uid("brief"), title: "", campaign: "", audience: "", objective: "", message: "", channel: "Instagram", owner: "Content Lead", dueDate: todayISO(3), status: "draft" })
  const set = <K extends keyof ContentBrief>(key: K, value: ContentBrief[K]) => setBrief((prev) => ({ ...prev, [key]: value }))
  return <form onSubmit={(event) => { event.preventDefault(); onSave(brief); setBrief({ id: uid("brief"), title: "", campaign: "", audience: "", objective: "", message: "", channel: "Instagram", owner: "Content Lead", dueDate: todayISO(3), status: "draft" }) }} className="grid gap-4 lg:grid-cols-2">
    <Field label="Brief title"><Input required value={brief.title} onChange={(event) => set("title", event.target.value)} /></Field>
    <Field label="Campaign"><Input value={brief.campaign} onChange={(event) => set("campaign", event.target.value)} /></Field>
    <Field label="Audience"><Input value={brief.audience} onChange={(event) => set("audience", event.target.value)} /></Field>
    <Field label="Objective"><Input value={brief.objective} onChange={(event) => set("objective", event.target.value)} /></Field>
    <Field label="Channel"><Select value={brief.channel} onChange={(event) => set("channel", event.target.value as Channel)}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</Select></Field>
    <Field label="Owner"><Select value={brief.owner} onChange={(event) => set("owner", event.target.value)}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</Select></Field>
    <Field label="Due date"><Input type="date" value={brief.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></Field>
    <Field label="Status"><Select value={brief.status} onChange={(event) => set("status", event.target.value as ContentBrief["status"])}>{["draft", "ready", "used", "archived"].map((status) => <option key={status}>{status}</option>)}</Select></Field>
    <div className="lg:col-span-2"><Field label="Core message"><Textarea value={brief.message} onChange={(event) => set("message", event.target.value)} /></Field></div>
    <div className="lg:col-span-2"><Button kind="primary" type="submit">Create brief</Button></div>
  </form>
}

export function ContentRow({ item, tasks, onAdvance, onArchive, onDelete }: { item: ContentItem; tasks: ContentTask[]; onAdvance: () => void; onArchive: () => void; onDelete: () => void }) {
  const itemTasks = tasks.filter((task) => task.contentId === item.id)
  const completed = itemTasks.filter((task) => task.status === "done").length
  return <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1.5fr_.8fr_.8fr_.8fr_1.3fr] lg:items-center">
    <div><div className="flex flex-wrap items-center gap-2"><Badge>{statusLabel(item.status)}</Badge><Badge kind="priority">{item.priority}</Badge></div><h3 className="mt-3 text-lg font-black">{item.title}</h3><p className="mt-1 text-xs font-bold text-slate-500">{item.channel} • {item.campaign || "No campaign"}</p></div>
    <div><p className="text-xs font-black uppercase text-slate-500">Owner</p><p className="mt-1 text-sm font-bold">{item.owner}</p></div>
    <div><p className="text-xs font-black uppercase text-slate-500">Due</p><p className="mt-1 text-sm font-bold">{item.dueDate}</p></div>
    <div><p className="text-xs font-black uppercase text-slate-500">Tasks</p><p className="mt-1 text-sm font-bold">{completed}/{itemTasks.length}</p></div>
    <div className="flex flex-wrap justify-start gap-2 lg:justify-end"><Button href={`/market-os/content-command-center/${item.id}`}>Open</Button><Button href={`/market-os/content-command-center/${item.id}/edit`}>Edit</Button><Button onClick={onAdvance} kind="dark">Next</Button><Button onClick={onArchive}>Archive</Button><Button onClick={onDelete} kind="danger">Delete</Button></div>
  </div>
}

export function NotFoundPanel({ id }: { id: string }) {
  return <Shell><main data-market-os-root className="mx-auto max-w-5xl p-6"><PageHeader eyebrow="Content Command" title="Content item not found" description={`No content item exists with id ${id}.`} actions={<Button href="/market-os/content-command-center" kind="primary">Back</Button>} /></main></Shell>
}
