"use client"

import * as React from "react"
import Link from "next/link"

export const AMBASSADOR_OS_KEY = "angelcare.marketos.ambassador.backoffice.v4"

export type AmbassadorStatus = "applicant" | "onboarding" | "active" | "paused" | "watchlist" | "offboarded"
export type MissionStatus = "draft" | "assigned" | "in_progress" | "proof_submitted" | "approved" | "rejected" | "paid" | "cancelled"
export type ApplicationStage = "lead" | "contacted" | "interview" | "approved" | "rejected" | "onboarding"
export type PayoutStatus = "pending" | "approved" | "paid" | "blocked"
export type Priority = "Low" | "Medium" | "High" | "Critical"

export type Ambassador = {
  id: string
  name: string
  phone: string
  email: string
  city: string
  territoryId: string
  status: AmbassadorStatus
  tier: "Starter" | "Growth" | "Elite" | "Partner"
  programId: string
  source: string
  manager: string
  joinedAt: string
  readiness: number
  complianceScore: number
  leadScore: number
  revenueMAD: number
  notes: string
}

export type Application = {
  id: string
  name: string
  phone: string
  city: string
  source: string
  stage: ApplicationStage
  priority: Priority
  owner: string
  nextStep: string
  notes: string
  createdAt: string
}

export type Program = {
  id: string
  name: string
  tier: string
  eligibility: string
  commissionPercent: number
  bonusMAD: number
  rules: string
  trainingRequired: string
  active: boolean
}

export type Mission = {
  id: string
  title: string
  ambassadorId: string
  programId: string
  territoryId: string
  channel: string
  objective: string
  rewardMAD: number
  dueDate: string
  status: MissionStatus
  proofRequired: string
  instructions: string
  priority: Priority
}

export type Proof = {
  id: string
  missionId: string
  ambassadorId: string
  type: string
  link: string
  status: "submitted" | "approved" | "rejected"
  reviewer: string
  decisionNote: string
  submittedAt: string
}

export type Reward = {
  id: string
  ambassadorId: string
  missionId: string
  label: string
  amountMAD: number
  status: PayoutStatus
  reason: string
  createdAt: string
}

export type Payout = {
  id: string
  ambassadorId: string
  amountMAD: number
  method: string
  status: PayoutStatus
  approvalNote: string
  payDate: string
}

export type Territory = {
  id: string
  name: string
  city: string
  capacity: number
  manager: string
  priority: Priority
  notes: string
}

export type Lead = {
  id: string
  ambassadorId: string
  parentName: string
  phone: string
  service: string
  status: "new" | "contacted" | "qualified" | "converted" | "lost"
  revenueMAD: number
  createdAt: string
}

export type ComplianceIssue = {
  id: string
  ambassadorId: string
  severity: Priority
  category: string
  status: "open" | "coaching" | "resolved" | "escalated"
  description: string
  action: string
}

export type TrainingItem = {
  id: string
  ambassadorId: string
  module: string
  status: "not_started" | "in_progress" | "completed"
  score: number
  dueDate: string
}

export type Communication = {
  id: string
  audience: string
  title: string
  channel: string
  message: string
  status: "draft" | "scheduled" | "sent"
  sendDate: string
}

export type LogItem = { id: string; at: string; action: string; entity: string; detail: string }

export type AmbassadorStore = {
  ambassadors: Ambassador[]
  applications: Application[]
  programs: Program[]
  missions: Mission[]
  proofs: Proof[]
  rewards: Reward[]
  payouts: Payout[]
  territories: Territory[]
  leads: Lead[]
  compliance: ComplianceIssue[]
  training: TrainingItem[]
  communications: Communication[]
  logs: LogItem[]
  settings: { defaultCommission: number; defaultManager: string; payoutCycle: string; proofPolicy: string }
}

export const todayISO = (offset = 0) => {
  const d = new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10)
}
let uidCounter = 0
export const uid = (prefix="id") => `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `sequence-${++uidCounter}`}`
export const mad = (n:number) => new Intl.NumberFormat("fr-MA",{style:"currency",currency:"MAD",maximumFractionDigits:0}).format(Number.isFinite(n)?n:0)
export const pct = (n:number) => `${Math.max(0, Math.min(100, Math.round(n||0)))}%`

export const seedStore: AmbassadorStore = {
  ambassadors: [
    { id:"amb-rabat-mothers", name:"Rabat Mothers Circle", phone:"+212 600 000 101", email:"rabat.circle@angelcare.ma", city:"Rabat", territoryId:"ter-rabat", status:"active", tier:"Elite", programId:"prog-community", source:"Community referral", manager:"Program Director", joinedAt:todayISO(-42), readiness:92, complianceScore:96, leadScore:88, revenueMAD:148000, notes:"High trust circle for premium postpartum referrals." },
    { id:"amb-casa-clinic", name:"Casablanca Clinic Partners", phone:"+212 600 000 202", email:"clinic.partners@angelcare.ma", city:"Casablanca", territoryId:"ter-casa", status:"active", tier:"Partner", programId:"prog-clinic", source:"Clinic partnership", manager:"Partnership Lead", joinedAt:todayISO(-32), readiness:85, complianceScore:91, leadScore:94, revenueMAD:226000, notes:"Clinic oriented partner network for maternity referrals." },
    { id:"amb-academy-students", name:"Academy Student Advocates", phone:"+212 600 000 303", email:"academy.advocates@angelcare.ma", city:"Temara", territoryId:"ter-rabat", status:"onboarding", tier:"Growth", programId:"prog-academy", source:"Academy", manager:"Academy Marketing", joinedAt:todayISO(-8), readiness:58, complianceScore:80, leadScore:61, revenueMAD:22000, notes:"New ambassador cohort for Academy candidate acquisition." },
  ],
  applications: [
    { id:"app-001", name:"Salé Parent Community Lead", phone:"+212 600 111 010", city:"Salé", source:"WhatsApp group", stage:"contacted", priority:"High", owner:"Recruitment Manager", nextStep:"Schedule interview", notes:"Strong local parent group access.", createdAt:todayISO(-2) },
    { id:"app-002", name:"Marrakech Creator Partner", phone:"+212 600 111 020", city:"Marrakech", source:"Instagram", stage:"lead", priority:"Medium", owner:"Program Manager", nextStep:"Initial qualification call", notes:"Homecare content creator.", createdAt:todayISO(-1) },
  ],
  programs: [
    { id:"prog-community", name:"Community Mother Ambassador", tier:"Elite", eligibility:"Trusted parent/community organizer with active WhatsApp audience.", commissionPercent:8, bonusMAD:500, rules:"Must use approved scripts and document referral source.", trainingRequired:"Brand safety + postpartum service FAQ", active:true },
    { id:"prog-clinic", name:"Clinic Referral Partner", tier:"Partner", eligibility:"Clinic, maternity professional or healthcare referral contact.", commissionPercent:6, bonusMAD:1000, rules:"No medical claims beyond approved wording. Referral consent required.", trainingRequired:"Clinic referral protocol", active:true },
    { id:"prog-academy", name:"Academy Student Advocate", tier:"Growth", eligibility:"Academy learner or alumni with local community network.", commissionPercent:5, bonusMAD:250, rules:"Promote training path accurately with approved FAQ.", trainingRequired:"Academy offer and candidate qualification", active:true },
  ],
  missions: [
    { id:"mis-001", title:"Postpartum referral week", ambassadorId:"amb-rabat-mothers", programId:"prog-community", territoryId:"ter-rabat", channel:"WhatsApp", objective:"Generate qualified postpartum family leads", rewardMAD:700, dueDate:todayISO(3), status:"assigned", proofRequired:"Screenshot of approved message + lead list", instructions:"Use approved premium reassurance script and tag each lead source.", priority:"High" },
    { id:"mis-002", title:"Clinic referral prospectus distribution", ambassadorId:"amb-casa-clinic", programId:"prog-clinic", territoryId:"ter-casa", channel:"Clinic", objective:"Book referral partner meetings", rewardMAD:1200, dueDate:todayISO(7), status:"in_progress", proofRequired:"Meeting confirmation + clinic contact details", instructions:"Share partner prospectus and record objections.", priority:"Critical" },
  ],
  proofs: [
    { id:"proof-001", missionId:"mis-001", ambassadorId:"amb-rabat-mothers", type:"Screenshot", link:"WhatsApp proof pending", status:"submitted", reviewer:"Program Director", decisionNote:"Check script quality and lead consent.", submittedAt:todayISO(0) },
  ],
  rewards: [], payouts: [],
  territories: [
    { id:"ter-rabat", name:"Rabat-Salé-Temara", city:"Rabat", capacity:25, manager:"Program Director", priority:"Critical", notes:"Main AngelCare operating region." },
    { id:"ter-casa", name:"Grand Casablanca", city:"Casablanca", capacity:20, manager:"Partnership Lead", priority:"High", notes:"Clinic and premium family acquisition." },
    { id:"ter-marrakech", name:"Marrakech-Safi", city:"Marrakech", capacity:10, manager:"Regional Coordinator", priority:"Medium", notes:"Creator and homecare expansion." },
  ],
  leads: [
    { id:"lead-001", ambassadorId:"amb-rabat-mothers", parentName:"Postpartum family inquiry", phone:"+212 600 222 111", service:"Postpartum Homecare", status:"qualified", revenueMAD:4200, createdAt:todayISO(-1) },
    { id:"lead-002", ambassadorId:"amb-casa-clinic", parentName:"Clinic referral", phone:"+212 600 222 222", service:"Premium nanny placement", status:"converted", revenueMAD:9800, createdAt:todayISO(-3) },
  ],
  compliance: [
    { id:"comp-001", ambassadorId:"amb-academy-students", severity:"Medium", category:"Training gap", status:"coaching", description:"Needs stronger explanation of Academy placement promise.", action:"Complete offer clarity coaching." },
  ],
  training: [
    { id:"train-001", ambassadorId:"amb-academy-students", module:"Brand safety and offer explanation", status:"in_progress", score:62, dueDate:todayISO(4) },
  ],
  communications: [
    { id:"com-001", audience:"All active ambassadors", title:"May mission quality reminder", channel:"WhatsApp", message:"Use only approved scripts and submit proof before payout validation.", status:"draft", sendDate:todayISO(1) },
  ],
  logs: [{ id:"log-seed", at:new Date().toISOString(), action:"seed", entity:"Ambassador OS", detail:"Initialized ambassador backoffice store." }],
  settings: { defaultCommission:7, defaultManager:"Program Director", payoutCycle:"Monthly", proofPolicy:"Proof required before reward approval" }
}

function safeRead(): AmbassadorStore {
  return seedStore
}
function safeWrite(store: AmbassadorStore) { void store }

export function useAmbassadorStore() {
  const [store, setStore] = React.useState<AmbassadorStore>(seedStore)
  React.useEffect(()=>{ setStore(safeRead()) }, [])
  const commit = React.useCallback((mutator:(draft:AmbassadorStore)=>void, action="update", detail="Updated workspace") => {
    setStore(prev => {
      const draft: AmbassadorStore = JSON.parse(JSON.stringify(prev))
      mutator(draft)
      draft.logs.unshift({ id:uid("log"), at:new Date().toISOString(), action, entity:"Ambassador OS", detail })
      safeWrite(draft)
      return draft
    })
  }, [])
  const reset = React.useCallback(()=>{ safeWrite(seedStore); setStore(seedStore) }, [])
  return { store, commit, reset }
}

export function Button({ children, href, onClick, kind="soft", type="button" }:{children:React.ReactNode; href?:string; onClick?:()=>void; kind?:"primary"|"soft"|"danger"|"success"|"dark"; type?:"button"|"submit"}) {
  const cls = kind==="primary" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-200 hover:bg-emerald-400" : kind==="danger" ? "bg-rose-600 text-slate-950 hover:bg-rose-700" : kind==="success" ? "bg-emerald-700 text-slate-950 hover:bg-emerald-800" : kind==="dark" ? "bg-white text-slate-950 hover:bg-white" : "border border-slate-200 bg-white text-slate-950 shadow-sm hover:bg-slate-50"
  const base = `inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition ${cls}`
  if (href) return <Link href={href} className={base}>{children}</Link>
  return <button type={type} onClick={onClick} className={base}>{children}</button>
}
export function Panel({ children, className="" }:{children:React.ReactNode; className?:string}) { return <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section> }
export function DarkPanel({ children, className="" }:{children:React.ReactNode; className?:string}) {
  return (
    <section className={`rounded-3xl border border-emerald-300/25 bg-gradient-to-br from-white via-slate-50 to-emerald-950 text-slate-950 shadow-2xl shadow-emerald-950/20 ${className}`}>
      {children}
    </section>
  )
}
export function Field({ label, children, help }:{label:string; children:React.ReactNode; help?:string}) { return <label className="block"><span className="text-xs font-black uppercase tracking-wider text-slate-9500">{label}</span><div className="mt-2">{children}</div>{help?<p className="mt-1 text-xs font-bold text-slate-9500">{help}</p>:null}</label> }
export const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
export function Input(props:React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`${inputClass} ${props.className||""}`} /> }
export function TextArea(props:React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`${inputClass} min-h-[120px] ${props.className||""}`} /> }
export function Select(props:React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`${inputClass} ${props.className||""}`} /> }
export function Badge({ children, tone="slate" }:{children:React.ReactNode; tone?:"slate"|"emerald"|"amber"|"rose"|"blue"}) {
  const c = tone==="emerald"?"border-emerald-200 bg-emerald-50 text-emerald-800":tone==="amber"?"border-amber-200 bg-amber-50 text-amber-800":tone==="rose"?"border-rose-200 bg-rose-50 text-rose-800":tone==="blue"?"border-blue-200 bg-blue-50 text-blue-800":"border-slate-200 bg-slate-50 text-slate-700"
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${c}`}>{children}</span>
}
export function Meter({ value }:{value:number}) { return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:pct(value)}} /></div> }
export function Metric({ label, value, sub, tone="slate" }:{label:string; value:string; sub:string; tone?:"slate"|"emerald"|"rose"|"amber"}) {
  const accent = tone === "emerald" ? "border-emerald-200 bg-emerald-50/60" : tone === "rose" ? "border-rose-200 bg-rose-50/60" : tone === "amber" ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-white"
  return (
    <Panel className={`p-5 ${accent}`}>
      <p className="text-xs font-black uppercase tracking-wider text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-700">{sub}</p>
    </Panel>
  )
}
export function Shell({ children }:{children:React.ReactNode}) {
  return (
    <div data-market-os-root className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d1fae5_0,#f8fafc_30%,#ffffff_100%)] text-slate-950 selection:bg-emerald-200 selection:text-slate-950">
      <div className="mx-auto w-full max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-8">
        <TrainingAcademyAccessCard />
      </div>
      {children}
    </div>
  )
}
export function sectionTitle(eyebrow:string,title:string,description:string){ return <div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h2><p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">{description}</p></div> }

export function TrainingAcademyAccessCard() {
  return (
    <Link
      href="/market-os/ambassadors/training-academy"
      className="group relative block overflow-hidden rounded-[32px] border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-lg shadow-emerald-950/5 ring-1 ring-white transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-2xl"
    >
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800">
            Training Academy
          </div>

          <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
            Ambassador OS Enterprise Academy
          </h3>

          <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-700">
            Learn the full ambassador operating model from zero to expert: program purpose,
            missions, proofs, payouts, compliance, AI workflows, territories, SOPs,
            scenario labs, KPI interpretation, production governance, and real execution routines.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-200">Beginner → Expert</span>
            <span className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-200">SOP Library</span>
            <span className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-200">Scenario Labs</span>
            <span className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-200">Production Ready</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white/90 p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-9500">Recommended first step</p>
          <p className="mt-2 text-lg font-black text-slate-950">
            Train users before giving them finance, compliance, or AI execution access.
          </p>
          <div className="mt-5 inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition group-hover:bg-emerald-700">
            Open Training Academy →
          </div>
        </div>
      </div>
    </Link>
  )
}

export function findAmbassador(store:AmbassadorStore, id:string){ return store.ambassadors.find(a=>a.id===id) }
export function ambassadorName(store:AmbassadorStore, id:string){ return findAmbassador(store,id)?.name || "Unassigned" }
export function programName(store:AmbassadorStore, id:string){ return store.programs.find(p=>p.id===id)?.name || "No program" }
export function territoryName(store:AmbassadorStore, id:string){ return store.territories.find(t=>t.id===id)?.name || "No territory" }
export function riskTone(priority:Priority){ return priority==="Critical"?"rose":priority==="High"?"amber":priority==="Medium"?"blue":"slate" as any }
export function applicationNext(stage:ApplicationStage):ApplicationStage { const flow:ApplicationStage[]=["lead","contacted","interview","approved","onboarding"]; const i=flow.indexOf(stage); return flow[Math.min(flow.length-1, Math.max(0,i+1))] }
export function missionNext(status:MissionStatus):MissionStatus { const flow:MissionStatus[]=["draft","assigned","in_progress","proof_submitted","approved","paid"]; const i=flow.indexOf(status); return flow[Math.min(flow.length-1, Math.max(0,i+1))] }
export function statusTone(status:string){ if(["active","approved","paid","completed","converted"].includes(status)) return "emerald"; if(["blocked","rejected","watchlist","Critical","escalated"].includes(status)) return "rose"; if(["onboarding","pending","in_progress","proof_submitted","High","coaching"].includes(status)) return "amber"; return "slate" }
