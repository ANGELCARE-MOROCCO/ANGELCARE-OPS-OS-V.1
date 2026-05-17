"use client"

import Link from "next/link"
import * as React from "react"
import { ContentCommandNavigation } from "./content-command-navigation"

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

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value))
}

export const seedItems: ContentItem[] = [
  {
    id: "content-001",
    title: "Postpartum reassurance carousel",
    type: "Carousel",
    channel: "Instagram",
    campaign: "Premium Postpartum Reassurance",
    owner: "Content Lead",
    reviewer: "Brand Manager",
    status: "draft",
    priority: "High",
    dueDate: todayISO(2),
    scheduledDate: todayISO(4),
    body: "A calm educational carousel explaining the first week after birth and when AngelCare support helps families feel safe.",
    objective: "Generate qualified postpartum leads",
    audience: "New mothers and families in Rabat / Temara",
    angle: "Trusted reassurance from a trained care team",
    cta: "Book a private care assessment",
    assets: ["asset-001"],
    brandScore: 82,
    seoKeyword: "postpartum home care Morocco",
    notes: "Needs final objection handling slide.",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "content-002",
    title: "Clinic partner referral one-pager",
    type: "PDF",
    channel: "Clinic Partner",
    campaign: "Clinic Partnership Authority Sprint",
    owner: "Partnership Content Lead",
    reviewer: "Founder Review",
    status: "review",
    priority: "Critical",
    dueDate: todayISO(1),
    scheduledDate: todayISO(3),
    body: "Executive one-pager for maternity clinics with referral process and care promise.",
    objective: "Support partner meetings",
    audience: "Clinic managers and gynecologists",
    angle: "Reliable homecare extension for clinic patients",
    cta: "Schedule a referral partnership call",
    assets: ["asset-002"],
    brandScore: 76,
    seoKeyword: "maternity clinic partnership Morocco",
    notes: "Founder must validate promise wording.",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "content-003",
    title: "Homecare service landing page copy",
    type: "Landing Page",
    channel: "Landing Page",
    campaign: "Homecare Authority Sprint",
    owner: "SEO Manager",
    reviewer: "Brand Manager",
    status: "idea",
    priority: "Medium",
    dueDate: todayISO(6),
    scheduledDate: todayISO(8),
    body: "Landing page draft for families comparing homecare options and looking for a premium structured service.",
    objective: "Convert search traffic into assessment requests",
    audience: "Families looking for professional homecare support",
    angle: "Structured, reassuring and premium homecare execution",
    cta: "Request a care assessment",
    assets: [],
    brandScore: 68,
    seoKeyword: "homecare Morocco",
    notes: "Needs FAQ block and service package proof points.",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

export const seedTasks: ContentTask[] = [
  { id: "task-001", contentId: "content-001", title: "Write final carousel slide copy", owner: "Content Lead", status: "doing", dueDate: todayISO(1), priority: "High", notes: "Add clear CTA and family reassurance." },
  { id: "task-002", contentId: "content-002", title: "Founder review on partner claim", owner: "Founder Review", status: "todo", dueDate: todayISO(1), priority: "Critical", notes: "Validate clinic promise before distribution." },
  { id: "task-003", contentId: "content-003", title: "Add FAQ and package proof points", owner: "SEO Manager", status: "todo", dueDate: todayISO(4), priority: "Medium", notes: "Keep FAQ readable and brand-safe." },
]

export const seedAssets: ContentAsset[] = [
  { id: "asset-001", name: "Postpartum carousel visual kit", type: "Image", channel: "Instagram", linkedContentId: "content-001", owner: "Creative Producer", status: "draft", url: "", notes: "Needs brand-safe color check." },
  { id: "asset-002", name: "Clinic referral PDF v1", type: "PDF", channel: "Clinic Partner", linkedContentId: "content-002", owner: "Partnership Content Lead", status: "needs revision", url: "", notes: "Update contact section." },
]

export const seedBriefs: ContentBrief[] = [
  { id: "brief-001", title: "Premium postpartum trust brief", campaign: "Premium Postpartum Reassurance", audience: "Families seeking postnatal support", objective: "Qualified leads", message: "AngelCare brings structured care reassurance at home.", channel: "Instagram", owner: "Content Lead", dueDate: todayISO(2), status: "ready" },
  { id: "brief-002", title: "Clinic partnership authority brief", campaign: "Clinic Partnership Authority Sprint", audience: "Maternity clinics", objective: "Partner meetings", message: "AngelCare is a reliable referral extension after discharge.", channel: "Clinic Partner", owner: "Partnership Content Lead", dueDate: todayISO(1), status: "draft" },
]

export const seedRules: BrandRule[] = [
  { id: "rule-001", title: "Avoid medical promises that imply diagnosis or guaranteed outcomes", category: "Medical sensitivity", required: true, active: true, notes: "Use care support language and approved service wording." },
  { id: "rule-002", title: "Every lead-generation asset must include one clear CTA", category: "CTA", required: true, active: true, notes: "CTA must match the campaign objective." },
  { id: "rule-003", title: "Tone must be warm, professional, reassuring, and premium", category: "Tone", required: true, active: true, notes: "Avoid aggressive sales copy." },
]

export function defaultStore(): ContentStore {
  return {
    items: seedItems,
    tasks: seedTasks,
    assets: seedAssets,
    briefs: seedBriefs,
    rules: seedRules,
    logs: [{ id: uid("log"), timestamp: nowISO(), action: "seed", entity: "workspace", detail: "Content Command Center initialized." }],
  }
}

export function loadStore(): ContentStore {
  return {
    items: readJson(CONTENT_ITEMS_KEY, seedItems),
    tasks: readJson(CONTENT_TASKS_KEY, seedTasks),
    assets: readJson(CONTENT_ASSETS_KEY, seedAssets),
    briefs: readJson(CONTENT_BRIEFS_KEY, seedBriefs),
    rules: readJson(CONTENT_RULES_KEY, seedRules),
    logs: readJson(CONTENT_LOGS_KEY, defaultStore().logs),
  }
}

export function saveStore(store: ContentStore) {
  writeJson(CONTENT_ITEMS_KEY, store.items)
  writeJson(CONTENT_TASKS_KEY, store.tasks)
  writeJson(CONTENT_ASSETS_KEY, store.assets)
  writeJson(CONTENT_BRIEFS_KEY, store.briefs)
  writeJson(CONTENT_RULES_KEY, store.rules)
  writeJson(CONTENT_LOGS_KEY, store.logs)
}

export function useContentStore() {
  const [store, setStore] = React.useState<ContentStore>(defaultStore())

  React.useEffect(() => {
    setStore(loadStore())
  }, [])

  const commit = React.useCallback((updater: (draft: ContentStore) => ContentStore | void, action = "update", detail = "Updated content command store") => {
    setStore(() => {
      const base = typeof window === "undefined" ? defaultStore() : loadStore()
      const copy: ContentStore = {
        items: [...base.items],
        tasks: [...base.tasks],
        assets: [...base.assets],
        briefs: [...base.briefs],
        rules: [...base.rules],
        logs: [...base.logs],
      }
      const result = updater(copy) ?? copy
      const next: ContentStore = {
        ...result,
        logs: [{ id: uid("log"), timestamp: nowISO(), action, entity: "content-command", detail }, ...result.logs].slice(0, 80),
      }
      saveStore(next)
      return next
    })
  }, [])

  const reset = React.useCallback(() => {
    const next = defaultStore()
    saveStore(next)
    setStore(next)
  }, [])

  return { store, commit, reset }
}

export function statusLabel(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
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
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#02040d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(124,58,237,.22),transparent_30%),radial-gradient(circle_at_84%_4%,rgba(6,182,212,.18),transparent_28%),radial-gradient(circle_at_75%_86%,rgba(245,158,11,.10),transparent_30%),linear-gradient(180deg,#070b18_0%,#030612_58%,#01030a_100%)]" />
      <ContentCommandNavigation />
      <div className="relative min-w-0 xl:pl-[330px]">
        {children}
      </div>
    </div>
  )
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 ${className}`}>
      {children}
    </section>
  )
}

export function Badge({ children, kind = "soft" }: { children: React.ReactNode; kind?: "soft" | "priority" | "success" | "warning" | "danger" | "dark" }) {
  const styles: Record<NonNullable<Parameters<typeof Badge>[0]["kind"]>, string> = {
    soft: "border-slate-200 bg-slate-50 text-slate-700",
    priority: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    dark: "border-white/15 bg-white/10 text-white",
  }
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${styles[kind]}`}>{children}</span>
}

export function Button({ children, onClick, href, kind = "soft", type = "button", disabled = false }: { children: React.ReactNode; onClick?: () => void; href?: string; kind?: "primary" | "soft" | "danger" | "dark"; type?: "button" | "submit"; disabled?: boolean }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50"
  const styles = {
    primary: "bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    dark: "bg-slate-950 text-white hover:bg-slate-800",
  }
  if (href) return <Link href={href} className={`${base} ${styles[kind]}`}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[kind]}`}>{children}</button>
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 ${props.className ?? ""}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-slate-400 ${props.className ?? ""}`} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 5} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 ${props.className ?? ""}`} />
}

export function Meter({ value }: { value: number }) {
  return <div className="h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

export function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <Panel className="p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{sub}</p></Panel>
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">{title}</h1><p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{description}</p></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</div>
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

export function ContentForm({ initial, onSave, submitLabel = "Save content" }: { initial?: ContentItem; onSave: (item: ContentItem) => void; submitLabel?: string }) {
  const [form, setForm] = React.useState<ContentItem>(() => initial ?? contentTemplate())
  const set = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) => setForm((prev) => ({ ...prev, [key]: value, updatedAt: nowISO() }))
  return <form onSubmit={(event) => { event.preventDefault(); onSave({ ...form, title: form.title.trim(), updatedAt: nowISO() }) }} className="grid gap-4 lg:grid-cols-2">
    <Field label="Title"><Input required value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Content title" /></Field>
    <Field label="Type"><Input value={form.type} onChange={(event) => set("type", event.target.value)} placeholder="Carousel, brochure, landing, video..." /></Field>
    <Field label="Channel"><Select value={form.channel} onChange={(event) => set("channel", event.target.value as Channel)}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</Select></Field>
    <Field label="Campaign link"><Input value={form.campaign} onChange={(event) => set("campaign", event.target.value)} placeholder="Linked campaign name" /></Field>
    <Field label="Owner"><Select value={form.owner} onChange={(event) => set("owner", event.target.value)}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</Select></Field>
    <Field label="Reviewer"><Select value={form.reviewer} onChange={(event) => set("reviewer", event.target.value)}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</Select></Field>
    <Field label="Status"><Select value={form.status} onChange={(event) => set("status", event.target.value as ContentStatus)}>{[...statusFlow, "revision", "archived"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</Select></Field>
    <Field label="Priority"><Select value={form.priority} onChange={(event) => set("priority", event.target.value as Priority)}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></Field>
    <Field label="Due date"><Input type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></Field>
    <Field label="Scheduled publish date"><Input type="date" value={form.scheduledDate} onChange={(event) => set("scheduledDate", event.target.value)} /></Field>
    <Field label="Objective"><Input value={form.objective} onChange={(event) => set("objective", event.target.value)} placeholder="Qualified leads, awareness, partner support..." /></Field>
    <Field label="Audience"><Input value={form.audience} onChange={(event) => set("audience", event.target.value)} placeholder="Who is this for?" /></Field>
    <Field label="Strategic angle"><Input value={form.angle} onChange={(event) => set("angle", event.target.value)} placeholder="Why this content should win" /></Field>
    <Field label="CTA"><Input value={form.cta} onChange={(event) => set("cta", event.target.value)} placeholder="Book, apply, call, message..." /></Field>
    <Field label="SEO keyword"><Input value={form.seoKeyword} onChange={(event) => set("seoKeyword", event.target.value)} placeholder="Optional keyword" /></Field>
    <Field label="Brand score"><Input type="number" min={0} max={100} value={form.brandScore} onChange={(event) => set("brandScore", Number(event.target.value))} /></Field>
    <div className="lg:col-span-2"><Field label="Content body / production notes"><Textarea value={form.body} onChange={(event) => set("body", event.target.value)} placeholder="Write the content, brief, script, or production note here." /></Field></div>
    <div className="lg:col-span-2"><Field label="Internal notes"><Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Review notes, risk, missing asset, approvals..." /></Field></div>
    <div className="lg:col-span-2 flex flex-wrap gap-3"><Button kind="primary" type="submit">{submitLabel}</Button><Button href="/market-os/content-command-center">Back to workspace</Button></div>
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
    <div><p className="text-xs font-black uppercase text-slate-400">Owner</p><p className="mt-1 text-sm font-bold">{item.owner}</p></div>
    <div><p className="text-xs font-black uppercase text-slate-400">Due</p><p className="mt-1 text-sm font-bold">{item.dueDate}</p></div>
    <div><p className="text-xs font-black uppercase text-slate-400">Tasks</p><p className="mt-1 text-sm font-bold">{completed}/{itemTasks.length}</p></div>
    <div className="flex flex-wrap justify-start gap-2 lg:justify-end"><Button href={`/market-os/content-command-center/${item.id}`}>Open</Button><Button href={`/market-os/content-command-center/${item.id}/edit`}>Edit</Button><Button onClick={onAdvance} kind="dark">Next</Button><Button onClick={onArchive}>Archive</Button><Button onClick={onDelete} kind="danger">Delete</Button></div>
  </div>
}

export function NotFoundPanel({ id }: { id: string }) {
  return <Shell><main className="mx-auto max-w-5xl p-6"><PageHeader eyebrow="Content Command" title="Content item not found" description={`No content item exists with id ${id}.`} actions={<Button href="/market-os/content-command-center" kind="primary">Back</Button>} /></main></Shell>
}
