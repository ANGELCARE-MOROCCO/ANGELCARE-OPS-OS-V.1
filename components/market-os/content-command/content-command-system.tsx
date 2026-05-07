"use client"

import * as React from "react"
import Link from "next/link"

export const CONTENT_ITEMS_KEY = "market_os_content_command_items_v2"
export const CONTENT_TASKS_KEY = "market_os_content_command_tasks_v2"
export const CONTENT_ASSETS_KEY = "market_os_content_command_assets_v2"
export const CONTENT_BRIEFS_KEY = "market_os_content_command_briefs_v2"
export const CONTENT_RULES_KEY = "market_os_content_command_brand_rules_v2"
export const CONTENT_LOGS_KEY = "market_os_content_command_logs_v2"

export type ContentStatus = "idea" | "brief" | "draft" | "review" | "approved" | "scheduled" | "published" | "revision" | "archived"
export type Channel = "Blog" | "Instagram" | "Facebook" | "TikTok" | "LinkedIn" | "Email" | "WhatsApp" | "Landing Page" | "Clinic Partner" | "Ambassador Kit"
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
  type: "Image" | "Video" | "PDF" | "Script" | "Brief" | "Landing" | "Other"
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
export const channels: Channel[] = ["Blog", "Instagram", "Facebook", "TikTok", "LinkedIn", "Email", "WhatsApp", "Landing Page", "Clinic Partner", "Ambassador Kit"]
export const priorities: Priority[] = ["Low", "Medium", "High", "Critical"]
export const owners = ["Content Lead", "Brand Manager", "SEO Manager", "Creative Producer", "Community Manager", "Partnership Lead", "Academy Marketing", "Founder Review"]

export function uid(prefix = "id") { return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}` }
export function todayISO(offset = 0) { const d = new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10) }
export function nowISO() { return new Date().toISOString() }

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
export function writeJson<T>(key: string, value: T) { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value)) }

export const seedItems: ContentItem[] = [
  { id:"content-001", title:"Postpartum reassurance carousel", type:"Carousel", channel:"Instagram", campaign:"Premium Postpartum Reassurance", owner:"Content Lead", reviewer:"Brand Manager", status:"draft", priority:"High", dueDate:todayISO(2), scheduledDate:todayISO(4), body:"A calm educational carousel explaining the first week after birth and when AngelCare support helps families feel safe.", objective:"Generate qualified postpartum leads", audience:"New mothers and families in Rabat/Temara", angle:"Trusted reassurance from trained care team", cta:"Book a private care assessment", assets:["asset-001"], brandScore:82, seoKeyword:"postpartum home care Morocco", notes:"Needs final objection handling slide.", createdAt:nowISO(), updatedAt:nowISO() },
  { id:"content-002", title:"Clinic partner referral one-pager", type:"PDF", channel:"Clinic Partner", campaign:"Clinic Partnership Authority Sprint", owner:"Partnership Lead", reviewer:"Founder Review", status:"review", priority:"Critical", dueDate:todayISO(1), scheduledDate:todayISO(3), body:"Executive one-pager for maternity clinics with referral process and care promise.", objective:"Support partner meetings", audience:"Clinic managers and gynecologists", angle:"Reliable homecare extension for clinic patients", cta:"Schedule a referral partnership call", assets:["asset-002"], brandScore:76, seoKeyword:"maternity clinic partnership Morocco", notes:"Founder must validate promise wording.", createdAt:nowISO(), updatedAt:nowISO() },
  { id:"content-003", title:"Academy career path WhatsApp script", type:"Script", channel:"WhatsApp", campaign:"Academy Career Path Recruitment", owner:"Academy Marketing", reviewer:"Brand Manager", status:"idea", priority:"Medium", dueDate:todayISO(6), scheduledDate:todayISO(8), body:"Script sequence for candidates interested in care training and certification.", objective:"Convert candidate inquiries", audience:"Young candidates seeking training-to-job pathway", angle:"Professional future with certification", cta:"Apply for the next Academy intake", assets:[], brandScore:68, seoKeyword:"care training Morocco", notes:"Needs eligibility questions.", createdAt:nowISO(), updatedAt:nowISO() },
]
export const seedTasks: ContentTask[] = [
  { id:"task-001", contentId:"content-001", title:"Write final carousel slide copy", owner:"Content Lead", status:"doing", dueDate:todayISO(1), priority:"High", notes:"Add clear CTA and family reassurance." },
  { id:"task-002", contentId:"content-002", title:"Founder review on partner claim", owner:"Founder Review", status:"todo", dueDate:todayISO(1), priority:"Critical", notes:"Validate clinic promise before distribution." },
  { id:"task-003", contentId:"content-003", title:"Draft qualification questions", owner:"Academy Marketing", status:"todo", dueDate:todayISO(4), priority:"Medium", notes:"Keep questions simple for WhatsApp." },
]
export const seedAssets: ContentAsset[] = [
  { id:"asset-001", name:"Postpartum carousel visual kit", type:"Image", channel:"Instagram", linkedContentId:"content-001", owner:"Creative Producer", status:"draft", url:"", notes:"Needs brand-safe color check." },
  { id:"asset-002", name:"Clinic referral PDF v1", type:"PDF", channel:"Clinic Partner", linkedContentId:"content-002", owner:"Partnership Lead", status:"needs revision", url:"", notes:"Update contact section." },
]
export const seedBriefs: ContentBrief[] = [
  { id:"brief-001", title:"Premium postpartum trust brief", campaign:"Premium Postpartum Reassurance", audience:"Families seeking postnatal support", objective:"Qualified leads", message:"AngelCare brings structured care reassurance at home.", channel:"Instagram", owner:"Content Lead", dueDate:todayISO(2), status:"ready" },
  { id:"brief-002", title:"Clinic partnership authority brief", campaign:"Clinic Partnership Authority Sprint", audience:"Maternity clinics", objective:"Partner meetings", message:"AngelCare is a reliable referral extension after discharge.", channel:"Clinic Partner", owner:"Partnership Lead", dueDate:todayISO(1), status:"draft" },
]
export const seedRules: BrandRule[] = [
  { id:"rule-001", title:"Avoid medical promises that imply diagnosis or guaranteed outcomes", category:"Medical sensitivity", required:true, active:true, notes:"Use care support language and approved service wording." },
  { id:"rule-002", title:"Every lead-generation asset must include one clear CTA", category:"CTA", required:true, active:true, notes:"CTA must match the campaign objective." },
  { id:"rule-003", title:"Tone must be warm, professional, reassuring, and premium", category:"Tone", required:true, active:true, notes:"Avoid aggressive sales copy." },
]

export function defaultStore(): ContentStore { return { items: seedItems, tasks: seedTasks, assets: seedAssets, briefs: seedBriefs, rules: seedRules, logs: [{id:uid("log"), timestamp:nowISO(), action:"seed", entity:"workspace", detail:"Content Command Center initialized."}] } }
export function loadStore(): ContentStore { return { items: readJson(CONTENT_ITEMS_KEY, seedItems), tasks: readJson(CONTENT_TASKS_KEY, seedTasks), assets: readJson(CONTENT_ASSETS_KEY, seedAssets), briefs: readJson(CONTENT_BRIEFS_KEY, seedBriefs), rules: readJson(CONTENT_RULES_KEY, seedRules), logs: readJson(CONTENT_LOGS_KEY, defaultStore().logs) } }
export function saveStore(store: ContentStore) { writeJson(CONTENT_ITEMS_KEY, store.items); writeJson(CONTENT_TASKS_KEY, store.tasks); writeJson(CONTENT_ASSETS_KEY, store.assets); writeJson(CONTENT_BRIEFS_KEY, store.briefs); writeJson(CONTENT_RULES_KEY, store.rules); writeJson(CONTENT_LOGS_KEY, store.logs) }
export function useContentStore() {
  const [store, setStore] = React.useState<ContentStore>(defaultStore())
  React.useEffect(()=>{ setStore(loadStore()) }, [])
  const commit = React.useCallback((updater: (draft: ContentStore)=>ContentStore | void, action="update", detail="Updated content command store") => {
    setStore(prev => { const base = typeof window === "undefined" ? prev : loadStore(); const copy: ContentStore = { items:[...base.items], tasks:[...base.tasks], assets:[...base.assets], briefs:[...base.briefs], rules:[...base.rules], logs:[...base.logs] }; const result = updater(copy) || copy; result.logs = [{ id:uid("log"), timestamp:nowISO(), action, entity:"content-command", detail }, ...result.logs].slice(0,100); saveStore(result); return result })
  }, [])
  return { store, commit, reset:()=>{ const d=defaultStore(); saveStore(d); setStore(d) } }
}

export function nextStatus(status: ContentStatus): ContentStatus { const idx=statusFlow.indexOf(status); return statusFlow[Math.min(statusFlow.length-1, Math.max(0, idx+1))] }
export function previousStatus(status: ContentStatus): ContentStatus { const idx=statusFlow.indexOf(status); return statusFlow[Math.max(0, idx-1)] }
export function statusLabel(s:string) { return s.replace(/_/g," ").replace(/\b\w/g, c=>c.toUpperCase()) }
export function statusClass(status:string) { if(["published","approved","done"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700"; if(["review","scheduled","doing"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-700"; if(["revision","blocked","archived"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700"; return "border-slate-200 bg-slate-50 text-slate-700" }
export function priorityClass(priority:string) { if(priority==="Critical") return "border-red-200 bg-red-50 text-red-700"; if(priority==="High") return "border-orange-200 bg-orange-50 text-orange-700"; if(priority==="Medium") return "border-amber-200 bg-amber-50 text-amber-700"; return "border-slate-200 bg-slate-50 text-slate-700" }
export function itemReadiness(item: ContentItem, tasks: ContentTask[], rules: BrandRule[]) { let score=20; if(item.title) score+=10; if(item.body.length>80) score+=15; if(item.owner) score+=10; if(item.reviewer) score+=10; if(item.assets.length) score+=10; if(item.scheduledDate) score+=10; if(tasks.filter(t=>t.contentId===item.id && t.status==="done").length) score+=10; if(item.brandScore>=75) score+=5; const mandatory=rules.filter(r=>r.required&&r.active).length; if(mandatory>0) score+=5; return Math.max(0, Math.min(100, score)) }
export function canPublish(item: ContentItem, tasks: ContentTask[], rules: BrandRule[]) { const blockingTasks = tasks.filter(t=>t.contentId===item.id && (t.status==="blocked" || t.status==="todo")); return item.status==="approved" || item.status==="scheduled" ? item.brandScore>=70 && blockingTasks.length===0 && !!item.scheduledDate : false }
export function monthMatrix(date: Date) { const y=date.getFullYear(); const m=date.getMonth(); const first=new Date(y,m,1); const start=new Date(first); start.setDate(1-first.getDay()); const days=[]; for(let i=0;i<42;i++){ const d=new Date(start); d.setDate(start.getDate()+i); days.push(d) } return days }

export function Shell({children}:{children:React.ReactNode}){ return <div className="min-h-screen bg-slate-50 text-slate-950">{children}</div> }
export function Panel({children, className=""}:{children:React.ReactNode; className?:string}) { return <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section> }
export function Badge({children, kind="status"}:{children:React.ReactNode; kind?:"status"|"priority"}) { return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${kind==="priority"?priorityClass(String(children)):statusClass(String(children).toLowerCase())}`}>{children}</span> }
export function Button({children,onClick,href,kind="soft",type="button",disabled=false}:{children:React.ReactNode;onClick?:()=>void;href?:string;kind?:"primary"|"soft"|"danger"|"dark";type?:"button"|"submit";disabled?:boolean}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${disabled?"cursor-not-allowed opacity-50":"hover:-translate-y-0.5"} ${kind==="primary"?"bg-rose-600 text-white shadow-lg shadow-rose-100":kind==="danger"?"bg-red-600 text-white":kind==="dark"?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`
  if(href) return <Link href={href} className={cls}>{children}</Link>
  return <button type={type} disabled={disabled} onClick={onClick} className={cls}>{children}</button>
}
export function Field({label,children,hint}:{label:string;children:React.ReactNode;hint?:string}){ return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>{children}{hint?<span className="mt-2 block text-xs font-semibold text-slate-400">{hint}</span>:null}</label> }
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 ${props.className||""}`} /> }
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`min-h-[130px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 ${props.className||""}`} /> }
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 ${props.className||""}`} /> }
export function Meter({value}:{value:number}){ return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950" style={{width:`${Math.max(0,Math.min(100,value))}%`}} /></div> }
export function PageHeader({title,eyebrow,description,actions}:{title:string;eyebrow:string;description:string;actions?:React.ReactNode}){ return <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">{eyebrow}</p><h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight lg:text-6xl">{title}</h1><p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-slate-300">{description}</p></div><div className="flex flex-wrap gap-3">{actions}</div></div></div> }
export function Metric({label,value,sub}:{label:string;value:string;sub:string}){ return <Panel className="p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{sub}</p></Panel> }

export function ContentForm({initial,onSave,submitLabel="Save content"}:{initial?:Partial<ContentItem>;onSave:(item:ContentItem)=>void;submitLabel?:string}){
  const [form,setForm]=React.useState<ContentItem>({ id: initial?.id || uid("content"), title: initial?.title || "", type: initial?.type || "Post", channel: initial?.channel || "Instagram", campaign: initial?.campaign || "", owner: initial?.owner || "Content Lead", reviewer: initial?.reviewer || "Brand Manager", status: initial?.status || "idea", priority: initial?.priority || "Medium", dueDate: initial?.dueDate || todayISO(3), scheduledDate: initial?.scheduledDate || todayISO(5), body: initial?.body || "", objective: initial?.objective || "", audience: initial?.audience || "", angle: initial?.angle || "", cta: initial?.cta || "", assets: initial?.assets || [], brandScore: initial?.brandScore || 70, seoKeyword: initial?.seoKeyword || "", notes: initial?.notes || "", createdAt: initial?.createdAt || nowISO(), updatedAt: nowISO() })
  const set=(key:keyof ContentItem,value:any)=>setForm(prev=>({...prev,[key]:value, updatedAt:nowISO()}))
  return <form onSubmit={e=>{e.preventDefault(); onSave(form)}} className="grid gap-5 lg:grid-cols-2">
    <Field label="Content title"><Input required value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Example: Postpartum reassurance carousel" /></Field>
    <Field label="Content type"><Input value={form.type} onChange={e=>set("type",e.target.value)} placeholder="Carousel, blog, email, ad, script..." /></Field>
    <Field label="Channel"><Select value={form.channel} onChange={e=>set("channel",e.target.value as Channel)}>{channels.map(c=><option key={c}>{c}</option>)}</Select></Field>
    <Field label="Campaign link"><Input value={form.campaign} onChange={e=>set("campaign",e.target.value)} placeholder="Linked campaign name" /></Field>
    <Field label="Owner"><Select value={form.owner} onChange={e=>set("owner",e.target.value)}>{owners.map(o=><option key={o}>{o}</option>)}</Select></Field>
    <Field label="Reviewer"><Select value={form.reviewer} onChange={e=>set("reviewer",e.target.value)}>{owners.map(o=><option key={o}>{o}</option>)}</Select></Field>
    <Field label="Status"><Select value={form.status} onChange={e=>set("status",e.target.value as ContentStatus)}>{[...statusFlow,"revision","archived"].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field>
    <Field label="Priority"><Select value={form.priority} onChange={e=>set("priority",e.target.value as Priority)}>{priorities.map(p=><option key={p}>{p}</option>)}</Select></Field>
    <Field label="Due date"><Input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)} /></Field>
    <Field label="Scheduled publish date"><Input type="date" value={form.scheduledDate} onChange={e=>set("scheduledDate",e.target.value)} /></Field>
    <Field label="Objective"><Input value={form.objective} onChange={e=>set("objective",e.target.value)} placeholder="Qualified leads, partner meeting, awareness..." /></Field>
    <Field label="Audience"><Input value={form.audience} onChange={e=>set("audience",e.target.value)} placeholder="Who is this for?" /></Field>
    <Field label="Strategic angle"><Input value={form.angle} onChange={e=>set("angle",e.target.value)} placeholder="Why this content should win" /></Field>
    <Field label="CTA"><Input value={form.cta} onChange={e=>set("cta",e.target.value)} placeholder="Book, apply, call, message..." /></Field>
    <Field label="SEO keyword"><Input value={form.seoKeyword} onChange={e=>set("seoKeyword",e.target.value)} placeholder="Optional keyword" /></Field>
    <Field label="Brand score"><Input type="number" min={0} max={100} value={form.brandScore} onChange={e=>set("brandScore",Number(e.target.value))} /></Field>
    <div className="lg:col-span-2"><Field label="Content body / production notes"><Textarea value={form.body} onChange={e=>set("body",e.target.value)} placeholder="Write the content, brief, script, or production note here." /></Field></div>
    <div className="lg:col-span-2"><Field label="Internal notes"><Textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Review notes, risk, missing asset, approvals..." /></Field></div>
    <div className="lg:col-span-2 flex flex-wrap gap-3"><Button kind="primary" type="submit">{submitLabel}</Button><Button href="/market-os/content-command-center">Back to workspace</Button></div>
  </form>
}

export function TaskForm({items,onSave}:{items:ContentItem[];onSave:(task:ContentTask)=>void}){
  const [task,setTask]=React.useState<ContentTask>({ id:uid("task"), contentId:items[0]?.id||"", title:"", owner:"Content Lead", status:"todo", dueDate:todayISO(2), priority:"Medium", notes:"" })
  const set=(k:keyof ContentTask,v:any)=>setTask(p=>({...p,[k]:v}))
  return <form onSubmit={e=>{e.preventDefault(); onSave(task); setTask({ id:uid("task"), contentId:items[0]?.id||"", title:"", owner:"Content Lead", status:"todo", dueDate:todayISO(2), priority:"Medium", notes:"" })}} className="grid gap-4 lg:grid-cols-2">
    <Field label="Task title"><Input required value={task.title} onChange={e=>set("title",e.target.value)} /></Field>
    <Field label="Linked content"><Select value={task.contentId} onChange={e=>set("contentId",e.target.value)}>{items.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</Select></Field>
    <Field label="Owner"><Select value={task.owner} onChange={e=>set("owner",e.target.value)}>{owners.map(o=><option key={o}>{o}</option>)}</Select></Field>
    <Field label="Deadline"><Input type="date" value={task.dueDate} onChange={e=>set("dueDate",e.target.value)} /></Field>
    <Field label="Priority"><Select value={task.priority} onChange={e=>set("priority",e.target.value as Priority)}>{priorities.map(p=><option key={p}>{p}</option>)}</Select></Field>
    <Field label="Status"><Select value={task.status} onChange={e=>set("status",e.target.value as any)}>{["todo","doing","done","blocked"].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</Select></Field>
    <div className="lg:col-span-2"><Field label="Notes"><Textarea value={task.notes} onChange={e=>set("notes",e.target.value)} /></Field></div>
    <div className="lg:col-span-2"><Button kind="primary" type="submit">Create task</Button></div>
  </form>
}

export function AssetForm({items,onSave}:{items:ContentItem[];onSave:(asset:ContentAsset)=>void}){
 const [asset,setAsset]=React.useState<ContentAsset>({ id:uid("asset"), name:"", type:"Image", channel:"Instagram", linkedContentId:items[0]?.id||"", owner:"Creative Producer", status:"draft", url:"", notes:"" })
 const set=(k:keyof ContentAsset,v:any)=>setAsset(p=>({...p,[k]:v}))
 return <form onSubmit={e=>{e.preventDefault(); onSave(asset); setAsset({ id:uid("asset"), name:"", type:"Image", channel:"Instagram", linkedContentId:items[0]?.id||"", owner:"Creative Producer", status:"draft", url:"", notes:"" })}} className="grid gap-4 lg:grid-cols-2">
  <Field label="Asset name"><Input required value={asset.name} onChange={e=>set("name",e.target.value)} /></Field>
  <Field label="Asset type"><Select value={asset.type} onChange={e=>set("type",e.target.value as any)}>{["Image","Video","PDF","Script","Brief","Landing","Other"].map(t=><option key={t}>{t}</option>)}</Select></Field>
  <Field label="Channel"><Select value={asset.channel} onChange={e=>set("channel",e.target.value as Channel)}>{channels.map(c=><option key={c}>{c}</option>)}</Select></Field>
  <Field label="Linked content"><Select value={asset.linkedContentId} onChange={e=>set("linkedContentId",e.target.value)}>{items.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</Select></Field>
  <Field label="Owner"><Select value={asset.owner} onChange={e=>set("owner",e.target.value)}>{owners.map(o=><option key={o}>{o}</option>)}</Select></Field>
  <Field label="Status"><Select value={asset.status} onChange={e=>set("status",e.target.value as any)}>{["draft","approved","needs revision","archived"].map(s=><option key={s}>{s}</option>)}</Select></Field>
  <Field label="Asset URL / reference"><Input value={asset.url} onChange={e=>set("url",e.target.value)} placeholder="Paste drive link or reference" /></Field>
  <div className="lg:col-span-2"><Field label="Notes"><Textarea value={asset.notes} onChange={e=>set("notes",e.target.value)} /></Field></div>
  <div className="lg:col-span-2"><Button kind="primary" type="submit">Register asset</Button></div>
 </form>
}

export function BriefForm({onSave}:{onSave:(brief:ContentBrief)=>void}){
 const [brief,setBrief]=React.useState<ContentBrief>({ id:uid("brief"), title:"", campaign:"", audience:"", objective:"", message:"", channel:"Instagram", owner:"Content Lead", dueDate:todayISO(3), status:"draft" })
 const set=(k:keyof ContentBrief,v:any)=>setBrief(p=>({...p,[k]:v}))
 return <form onSubmit={e=>{e.preventDefault(); onSave(brief); setBrief({ id:uid("brief"), title:"", campaign:"", audience:"", objective:"", message:"", channel:"Instagram", owner:"Content Lead", dueDate:todayISO(3), status:"draft" })}} className="grid gap-4 lg:grid-cols-2">
  <Field label="Brief title"><Input required value={brief.title} onChange={e=>set("title",e.target.value)} /></Field>
  <Field label="Campaign"><Input value={brief.campaign} onChange={e=>set("campaign",e.target.value)} /></Field>
  <Field label="Audience"><Input value={brief.audience} onChange={e=>set("audience",e.target.value)} /></Field>
  <Field label="Objective"><Input value={brief.objective} onChange={e=>set("objective",e.target.value)} /></Field>
  <Field label="Channel"><Select value={brief.channel} onChange={e=>set("channel",e.target.value as Channel)}>{channels.map(c=><option key={c}>{c}</option>)}</Select></Field>
  <Field label="Owner"><Select value={brief.owner} onChange={e=>set("owner",e.target.value)}>{owners.map(o=><option key={o}>{o}</option>)}</Select></Field>
  <Field label="Due date"><Input type="date" value={brief.dueDate} onChange={e=>set("dueDate",e.target.value)} /></Field>
  <Field label="Status"><Select value={brief.status} onChange={e=>set("status",e.target.value as any)}>{["draft","ready","used","archived"].map(s=><option key={s}>{s}</option>)}</Select></Field>
  <div className="lg:col-span-2"><Field label="Core message"><Textarea value={brief.message} onChange={e=>set("message",e.target.value)} /></Field></div>
  <div className="lg:col-span-2"><Button kind="primary" type="submit">Create brief</Button></div>
 </form>
}

export function ContentRow({item,tasks,onAdvance,onArchive,onDelete}:{item:ContentItem;tasks:ContentTask[];onAdvance:()=>void;onArchive:()=>void;onDelete:()=>void}){
 const itemTasks=tasks.filter(t=>t.contentId===item.id)
 return <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1.5fr_.8fr_.8fr_.8fr_1.3fr] lg:items-center">
  <div><div className="flex flex-wrap items-center gap-2"><Badge>{statusLabel(item.status)}</Badge><Badge kind="priority">{item.priority}</Badge></div><h3 className="mt-3 text-lg font-black">{item.title}</h3><p className="mt-1 text-xs font-bold text-slate-500">{item.channel} • {item.campaign || "No campaign"}</p></div>
  <div><p className="text-xs font-black uppercase text-slate-400">Owner</p><p className="mt-1 text-sm font-bold">{item.owner}</p></div>
  <div><p className="text-xs font-black uppercase text-slate-400">Due</p><p className="mt-1 text-sm font-bold">{item.dueDate}</p></div>
  <div><p className="text-xs font-black uppercase text-slate-400">Tasks</p><p className="mt-1 text-sm font-bold">{itemTasks.filter(t=>t.status==="done").length}/{itemTasks.length}</p></div>
  <div className="flex flex-wrap justify-start gap-2 lg:justify-end"><Button href={`/market-os/content-command-center/${item.id}`}>Open</Button><Button href={`/market-os/content-command-center/${item.id}/edit`}>Edit</Button><Button onClick={onAdvance} kind="dark">Next</Button><Button onClick={onArchive}>Archive</Button><Button onClick={onDelete} kind="danger">Delete</Button></div>
 </div>
}

export function NotFoundPanel({id}:{id:string}){ return <Shell><main className="mx-auto max-w-5xl p-6"><PageHeader eyebrow="Content Command" title="Content item not found" description={`No content item exists with id ${id}.`} actions={<Button href="/market-os/content-command-center" kind="primary">Back</Button>} /></main></Shell> }
