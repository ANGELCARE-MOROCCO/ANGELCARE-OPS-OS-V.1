"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle, BarChart3, Building2, CheckCircle2, Download, FileSpreadsheet,
  Filter, Gauge, Layers3, Loader2, Map as MapIcon, MapPin, MoreHorizontal, Plus, RefreshCw,
  Search, ShieldCheck, Target, Upload, UserCheck, Users, X, type LucideIcon,
} from "lucide-react"
import { downloadAmbassadorCsv, loadAmbassadorSnapshot } from "@/lib/market-os/ambassadors/client"

type Row = Record<string, any>
type DrawerMode = "assignment" | "territory"
type ModalMode = null | "import" | "export" | "layers" | "approval"
type AssignmentType = "primary" | "secondary" | "backup" | "temporary"
type Decision = "approved" | "rejected"

type PendingAssignment = {
  id: string
  ambassadorId: string
  ambassadorName: string
  backupAmbassadorId: string
  assignmentType: AssignmentType
  submittedAt: string
  approvalManager: string
  approvalNote: string
  conflictReason: string
  overlapApproved: boolean
  status: "pending"
  payload: Row
}

type AssignmentHistory = {
  id: string
  ambassadorId: string
  ambassadorName: string
  assignmentType: AssignmentType
  decision: Decision
  managerName: string
  note: string
  decidedAt: string
}

type TerritoryConfig = {
  version: number
  prefecture: string
  neighborhood: string
  boundaryMode: "administrative" | "radius" | "custom"
  radiusKm: number
  addressableHouseholds: number
  addressableAccounts: number
  coveredHouseholds: number
  coveredAccounts: number
  targetAmbassadors: number
  maxConcurrentMissions: number
  targetLeads: number
  targetQualifiedLeads: number
  targetConversions: number
  targetVisits: number
  targetPartnerMeetings: number
  targetConversionRate: number
  targetCoveragePercent: number
  slaCoveragePercent: number
  slaResponseHours: number
  startDate: string
  reviewDate: string
  assignmentDurationMonths: number
  expectedProof: string
  escalationRule: string
  approvalManager: string
  pendingAssignments: PendingAssignment[]
  assignmentHistory: AssignmentHistory[]
  lastUpdatedAt: string
}

type FormState = {
  territoryMode: "existing" | "new"
  existingTerritoryId: string
  name: string
  region: string
  city: string
  prefecture: string
  zone: string
  neighborhood: string
  boundaryMode: "administrative" | "radius" | "custom"
  radiusKm: number
  addressableHouseholds: number
  addressableAccounts: number
  ambassadorId: string
  backupAmbassadorId: string
  assignmentType: AssignmentType
  targetAmbassadors: number
  maxConcurrentMissions: number
  targetLeads: number
  targetQualifiedLeads: number
  targetConversions: number
  targetVisits: number
  targetPartnerMeetings: number
  targetConversionRate: number
  targetCoveragePercent: number
  slaCoveragePercent: number
  slaResponseHours: number
  startDate: string
  reviewDate: string
  assignmentDurationMonths: number
  expectedProof: string
  escalationRule: string
  approvalManager: string
  approvalNote: string
  conflictReason: string
  overlapApproved: boolean
}

type TerritoryMetric = {
  row: Row
  config: TerritoryConfig
  id: string
  name: string
  region: string
  city: string
  zone: string
  manager: string
  status: string
  activeAmbassadors: Row[]
  activeAmbassadorCount: number
  coveragePercent: number
  coverageTarget: number
  workloadPercent: number
  densityPer10k: number
  openMissions: Row[]
  leads: Row[]
  conversions: Row[]
  conversionRate: number
  pendingAssignments: PendingAssignment[]
  risk: "healthy" | "attention" | "critical" | "unconfigured"
}

type ApprovalTarget = {
  territoryId: string
  assignment: PendingAssignment
  decision: Decision
  managerName: string
  note: string
}

const REGIONS = [
  "Rabat-Salé-Kénitra", "Casablanca-Settat", "Tanger-Tétouan-Al Hoceïma",
  "Fès-Meknès", "Marrakech-Safi", "Souss-Massa", "Oriental",
  "Béni Mellal-Khénifra", "Drâa-Tafilalet", "Guelmim-Oued Noun",
  "Laâyoune-Sakia El Hamra", "Dakhla-Oued Ed-Dahab",
]

const CITY_POINTS: Record<string, { x: number; y: number }> = {
  tangier:{x:44,y:10}, tanger:{x:44,y:10}, tetouan:{x:50,y:12},
  rabat:{x:40,y:25}, sale:{x:42,y:24}, temara:{x:38,y:27},
  kenitra:{x:40,y:20}, casablanca:{x:33,y:34}, mohammedia:{x:36,y:31},
  fes:{x:56,y:28}, meknes:{x:51,y:27}, oujda:{x:78,y:28},
  marrakech:{x:39,y:51}, safi:{x:26,y:53}, essaouira:{x:25,y:57},
  agadir:{x:27,y:68}, ouarzazate:{x:47,y:64}, errachidia:{x:61,y:55},
  laayoune:{x:24,y:82}, dakhla:{x:21,y:96},
}

const MAP_OUTLINE = "M44 4 C53 7 57 12 60 19 C64 25 69 28 72 35 C75 42 70 46 66 52 C61 60 58 67 54 74 C49 83 45 91 38 98 L22 96 C19 88 18 81 20 73 C22 64 25 56 27 48 C29 40 31 33 34 27 C38 19 39 11 44 4 Z"

const DEFAULT_CONFIG: TerritoryConfig = {
  version:2, prefecture:"", neighborhood:"", boundaryMode:"administrative", radiusKm:5,
  addressableHouseholds:0, addressableAccounts:0, coveredHouseholds:0, coveredAccounts:0,
  targetAmbassadors:1, maxConcurrentMissions:4, targetLeads:0, targetQualifiedLeads:0,
  targetConversions:0, targetVisits:0, targetPartnerMeetings:0, targetConversionRate:0,
  targetCoveragePercent:70, slaCoveragePercent:70, slaResponseHours:24,
  startDate:"", reviewDate:"", assignmentDurationMonths:3, expectedProof:"",
  escalationRule:"Escalade manager si la couverture ou le SLA passe sous le seuil.",
  approvalManager:"", pendingAssignments:[], assignmentHistory:[], lastUpdatedAt:"",
}

function rec(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {}
}
function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(v => v && typeof v === "object" && !Array.isArray(v)) as Row[] : []
}
function txt(value: unknown): string { return String(value ?? "").trim() }
function num(value: unknown, fallback=0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
function rid(row?: Row): string { return txt(row?.id || row?.uuid || row?.record_id) }
function norm(value: unknown): string {
  return txt(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}
function isoNow(): string { return new Date().toISOString() }
function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
}
function fmt(value: number): string {
  return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:value > 100 ? 0 : 1}).format(value)
}
function shortDate(value: unknown): string {
  const raw = txt(value)
  if (!raw) return "—"
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? raw.slice(0,10) : date.toLocaleDateString("fr-FR")
}
function isActiveAmbassador(row: Row): boolean {
  const status = norm(row.status || row.lifecycle_stage)
  return !status.includes("archive") && !status.includes("suspend") &&
    !status.includes("inactive") && (status.includes("active") || status.includes("actif") || !status)
}
function isOpenMission(row: Row): boolean {
  const status = norm(row.status)
  return !["completed","done","closed","cancelled","canceled","archived","termine"].some(v => status.includes(v))
}
function isConverted(row: Row): boolean {
  const status = norm(row.status || row.validation_decision)
  return status.includes("convert") || status.includes("validated") || status.includes("paid") ||
    Boolean(row.converted_at || row.validated_at)
}
function territoryIdOf(row: Row): string {
  return txt(row.territory_id || row.assigned_territory_id || rec(row.metadata).territory_id)
}
function parseNotes(raw: unknown): TerritoryConfig {
  const source = txt(raw)
  if (!source) return {...DEFAULT_CONFIG}
  try {
    const parsed = source.startsWith("AMB_TERRITORY_OS_V2:")
      ? JSON.parse(source.slice("AMB_TERRITORY_OS_V2:".length))
      : JSON.parse(source)
    const data = rec(parsed)
    return {
      ...DEFAULT_CONFIG, ...data,
      pendingAssignments: rows(data.pendingAssignments) as PendingAssignment[],
      assignmentHistory: rows(data.assignmentHistory) as AssignmentHistory[],
    }
  } catch {
    return {...DEFAULT_CONFIG, expectedProof:source}
  }
}
function serializeNotes(config: TerritoryConfig): string {
  return `AMB_TERRITORY_OS_V2:${JSON.stringify({...config,version:2,lastUpdatedAt:isoNow()})}`
}
function statusLabel(value: unknown): string {
  const status = norm(value)
  if (status.includes("pending")) return "En approbation"
  if (status.includes("draft")) return "Brouillon"
  if (status.includes("reject")) return "Rejeté"
  if (status.includes("archiv")) return "Archivé"
  if (status.includes("inactive")) return "Inactif"
  return "Actif"
}
function statusClass(value: unknown): string {
  const status = norm(value)
  if (status.includes("reject")) return "border-rose-200 bg-rose-50 text-rose-800"
  if (status.includes("pending") || status.includes("draft")) return "border-amber-200 bg-amber-50 text-amber-800"
  if (status.includes("archiv") || status.includes("inactive")) return "border-slate-300 bg-slate-100 text-slate-700"
  return "border-emerald-200 bg-emerald-50 text-emerald-800"
}
function coverageColor(value: number): string {
  if (value >= 80) return "#059669"
  if (value >= 60) return "#2563eb"
  if (value >= 40) return "#d97706"
  if (value > 0) return "#dc2626"
  return "#64748b"
}
function coverageBg(value: number): string {
  if (value >= 80) return "border-emerald-200 bg-emerald-50"
  if (value >= 60) return "border-blue-200 bg-blue-50"
  if (value >= 40) return "border-amber-200 bg-amber-50"
  if (value > 0) return "border-rose-200 bg-rose-50"
  return "border-slate-200 bg-slate-100"
}
function pointFor(city: string, index: number): {x:number;y:number} {
  return CITY_POINTS[norm(city)] || {x:33+(index%4)*8,y:22+Math.floor((index%8)/4)*30+(index%3)*4}
}
function coverageFor(row: Row, config: TerritoryConfig, activeCount: number): number {
  const explicit = num(row.coverage_percent || row.coverage_rate || row.current_coverage,-1)
  if (explicit >= 0) return Math.max(0,Math.min(100,explicit))
  if (config.addressableHouseholds > 0 && config.coveredHouseholds > 0)
    return Math.min(100,(config.coveredHouseholds/config.addressableHouseholds)*100)
  if (config.addressableAccounts > 0 && config.coveredAccounts > 0)
    return Math.min(100,(config.coveredAccounts/config.addressableAccounts)*100)
  const target = config.targetAmbassadors || num(row.target_ambassadors || row.coverage_goal)
  return target > 0 ? Math.min(100,(activeCount/target)*100) : 0
}
function defaultForm(): FormState {
  const start = new Date()
  const review = new Date(start)
  review.setMonth(review.getMonth()+3)
  return {
    territoryMode:"existing", existingTerritoryId:"", name:"", region:"", city:"",
    prefecture:"", zone:"", neighborhood:"", boundaryMode:"administrative", radiusKm:5,
    addressableHouseholds:0, addressableAccounts:0, ambassadorId:"", backupAmbassadorId:"",
    assignmentType:"primary", targetAmbassadors:1, maxConcurrentMissions:4,
    targetLeads:0, targetQualifiedLeads:0, targetConversions:0, targetVisits:0,
    targetPartnerMeetings:0, targetConversionRate:0, targetCoveragePercent:70,
    slaCoveragePercent:70, slaResponseHours:24, startDate:start.toISOString().slice(0,10),
    reviewDate:review.toISOString().slice(0,10), assignmentDurationMonths:3,
    expectedProof:"", escalationRule:DEFAULT_CONFIG.escalationRule,
    approvalManager:"", approvalNote:"", conflictReason:"", overlapApproved:false,
  }
}
async function api(path: string, init?: RequestInit): Promise<any> {
  const response = await fetch(path,{
    ...init,cache:"no-store",credentials:"include",
    headers:{Accept:"application/json",...(init?.body?{"Content-Type":"application/json"}:{}),...(init?.headers||{})},
  })
  const payload = await response.json().catch(()=>({}))
  if (!response.ok || payload?.ok === false)
    throw new Error(txt(payload?.error || payload?.message) || `HTTP ${response.status}`)
  return payload
}
function Card({children,className=""}:{children:ReactNode;className?:string}) {
  return <section className={`rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.055)] ${className}`}>{children}</section>
}
function Field({label,required=false,helper,children}:{label:string;required?:boolean;helper?:string;children:ReactNode}) {
  return <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-700">{label}{required?" *":""}</span>
    {children}
    {helper?<span className="mt-1 block text-[10px] font-semibold leading-5 text-slate-500">{helper}</span>:null}
  </label>
}
function Progress({value,color="bg-blue-600"}:{value:number;color?:string}) {
  const safe=Math.max(0,Math.min(100,value))
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{width:`${safe}%`}}/></div>
}
function Kpi({label,value,helper,icon:Icon,tone}:{label:string;value:string;helper:string;icon:LucideIcon;tone:string}) {
  return <Card className="p-4"><div className="flex items-start justify-between gap-3">
    <div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    <p className="mt-1 text-[10px] font-bold text-slate-500">{helper}</p></div>
    <span className={`rounded-2xl p-2.5 ${tone}`}><Icon className="h-5 w-5"/></span>
  </div></Card>
}
function ModalShell({title,subtitle,icon:Icon,children,footer,onClose,width="max-w-6xl"}:{title:string;subtitle:string;icon:LucideIcon;children:ReactNode;footer:ReactNode;onClose:()=>void;width?:string}) {
  return <div className="fixed inset-0 z-[190] flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 pb-10 pt-[92px] backdrop-blur-[3px]">
    <div className={`flex max-h-[calc(100vh-112px)] w-full flex-col overflow-hidden rounded-[22px] border border-slate-300 bg-[#f4f7fa] shadow-[0_38px_120px_rgba(3,15,31,0.42)] ${width}`}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex min-w-0 items-start gap-4"><span className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-700"><Icon className="h-5 w-5"/></span>
        <div><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">{subtitle}</p></div></div>
        <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950"><X className="h-4 w-4"/></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">{children}</div>
      <footer className="border-t border-slate-200 bg-white px-6 py-4">{footer}</footer>
    </div>
  </div>
}

export default function AmbassadorTerritoriesRoute() {
  const [snapshot,setSnapshot]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState("")
  const [error,setError]=useState("")
  const [query,setQuery]=useState("")
  const [regionFilter,setRegionFilter]=useState("all")
  const [riskOnly,setRiskOnly]=useState(false)
  const [drawerOpen,setDrawerOpen]=useState(true)
  const [drawerMode,setDrawerMode]=useState<DrawerMode>("assignment")
  const [selectedTerritoryId,setSelectedTerritoryId]=useState("")
  const [form,setForm]=useState<FormState>(defaultForm())
  const [modal,setModal]=useState<ModalMode>(null)
  const [mapLayer,setMapLayer]=useState<"coverage"|"workload"|"leads"|"conversion">("coverage")
  const [showLabels,setShowLabels]=useState(true)
  const [csvText,setCsvText]=useState("")
  const [csvRows,setCsvRows]=useState<Row[]>([])
  const [importLog,setImportLog]=useState<string[]>([])
  const [approvalTarget,setApprovalTarget]=useState<ApprovalTarget|null>(null)

  const inputClass="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
  const textareaClass="min-h-[106px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

  const refresh=useCallback(async()=>{
    setLoading(true);setError("")
    try { setSnapshot(await loadAmbassadorSnapshot()) }
    catch(caught){setError(caught instanceof Error?caught.message:"Impossible de charger les territoires.")}
    finally{setLoading(false)}
  },[])

  useEffect(()=>{void refresh()},[refresh])

  const territories=useMemo(()=>rows(snapshot?.territories),[snapshot])
  const ambassadors=useMemo(()=>rows(snapshot?.ambassadors),[snapshot])
  const missions=useMemo(()=>rows(snapshot?.missions),[snapshot])
  const leads=useMemo(()=>rows(snapshot?.leads),[snapshot])
  const conversions=useMemo(()=>rows(snapshot?.conversions),[snapshot])
  const activeAmbassadors=useMemo(()=>ambassadors.filter(isActiveAmbassador),[ambassadors])

  const territoryMetrics=useMemo<TerritoryMetric[]>(()=>territories
    .filter(row=>!norm(row.status).includes("archiv"))
    .map(row=>{
      const id=rid(row), config=parseNotes(row.notes)
      const assigned=activeAmbassadors.filter(a=>territoryIdOf(a)===id)
      const relatedMissions=missions.filter(m=>territoryIdOf(m)===id)
      const relatedLeads=leads.filter(l=>territoryIdOf(l)===id)
      const relatedConversions=conversions.filter(c=>territoryIdOf(c)===id)
      const openMissions=relatedMissions.filter(isOpenMission)
      const activeCount=assigned.length || num(row.active_ambassadors_count)
      const coveragePercent=coverageFor(row,config,activeCount)
      const workloadPercent=Math.min(200,(openMissions.length/(Math.max(1,activeCount)*Math.max(1,config.maxConcurrentMissions||4)))*100)
      const converted=relatedConversions.filter(isConverted).length
      const conversionRate=relatedLeads.length?(converted/relatedLeads.length)*100:0
      const coverageTarget=config.slaCoveragePercent||config.targetCoveragePercent||70
      const risk:TerritoryMetric["risk"]=coveragePercent===0&&activeCount===0?"unconfigured":
        coveragePercent<40||workloadPercent>100?"critical":
        coveragePercent<coverageTarget||workloadPercent>80?"attention":"healthy"
      return {
        row,config,id,name:txt(row.name)||"Territoire sans nom",region:txt(row.region),
        city:txt(row.city),zone:txt(row.zone),manager:txt(row.manager_name)||config.approvalManager,
        status:txt(row.status)||"active",activeAmbassadors:assigned,activeAmbassadorCount:activeCount,
        coveragePercent,coverageTarget,workloadPercent,
        densityPer10k:config.addressableHouseholds>0?(activeCount/config.addressableHouseholds)*10000:0,
        openMissions,leads:relatedLeads,conversions:relatedConversions,conversionRate,
        pendingAssignments:config.pendingAssignments.filter(a=>a.status==="pending"),risk,
      }
    })
    .sort((a,b)=>{
      const weight={critical:0,attention:1,unconfigured:2,healthy:3} as const
      return weight[a.risk]-weight[b.risk]||a.city.localeCompare(b.city,"fr")
    }),
    [territories,activeAmbassadors,missions,leads,conversions])

  const regions=useMemo(()=>Array.from(new Set(territoryMetrics.map(t=>t.region).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"fr")),[territoryMetrics])
  const filtered=useMemo(()=>{
    const needle=norm(query)
    return territoryMetrics.filter(t=>{
      if(regionFilter!=="all"&&t.region!==regionFilter)return false
      if(riskOnly&&t.risk==="healthy")return false
      return !needle||norm([t.name,t.region,t.city,t.zone,t.manager].join(" ")).includes(needle)
    })
  },[territoryMetrics,query,regionFilter,riskOnly])

  const selectedTerritory=useMemo(()=>territoryMetrics.find(t=>t.id===selectedTerritoryId)||null,[territoryMetrics,selectedTerritoryId])
  const selectedAmbassador=useMemo(()=>activeAmbassadors.find(a=>rid(a)===form.ambassadorId)||null,[activeAmbassadors,form.ambassadorId])
  const currentMissionLoad=useMemo(()=>selectedAmbassador?missions.filter(m=>txt(m.ambassador_id)===rid(selectedAmbassador)&&isOpenMission(m)).length:0,[selectedAmbassador,missions])
  const currentLoad=Math.min(200,(currentMissionLoad/Math.max(1,form.maxConcurrentMissions))*100)
  const projectedLoad=Math.min(200,((currentMissionLoad+1)/Math.max(1,form.maxConcurrentMissions))*100)

  const conflict=useMemo(()=>{
    if(!selectedAmbassador)return null
    const current=territoryIdOf(selectedAmbassador)
    const target=form.territoryMode==="existing"?form.existingTerritoryId:""
    if(!current||current===target)return null
    return territoryMetrics.find(t=>t.id===current)||{id:current,name:txt(selectedAmbassador.territory_name)||"Territoire actuel"}
  },[selectedAmbassador,form.territoryMode,form.existingTerritoryId,territoryMetrics])

  const checks=useMemo(()=>({
    territory:form.territoryMode==="existing"?Boolean(form.existingTerritoryId):Boolean(form.name&&form.region&&form.city&&form.zone),
    ambassador:Boolean(selectedAmbassador&&isActiveAmbassador(selectedAmbassador)),
    capacity:projectedLoad<=100,
    conflict:!conflict||form.assignmentType==="backup"||form.assignmentType==="secondary"||(form.overlapApproved&&Boolean(form.conflictReason.trim())),
    objectives:form.targetCoveragePercent>0&&form.slaCoveragePercent>0&&form.maxConcurrentMissions>0,
    planning:Boolean(form.startDate&&form.reviewDate),
    approval:Boolean(form.approvalManager.trim()),
  }),[form,selectedAmbassador,projectedLoad,conflict])
  const readiness=Math.round((Object.values(checks).filter(Boolean).length/Object.values(checks).length)*100)

  const totalHouseholds=territoryMetrics.reduce((s,t)=>s+t.config.addressableHouseholds,0)
  const totalAccounts=territoryMetrics.reduce((s,t)=>s+t.config.addressableAccounts,0)
  const weightTotal=territoryMetrics.reduce((s,t)=>s+(t.config.addressableHouseholds||t.config.addressableAccounts||t.config.targetAmbassadors||1),0)
  const globalCoverage=weightTotal?territoryMetrics.reduce((s,t)=>s+t.coveragePercent*(t.config.addressableHouseholds||t.config.addressableAccounts||t.config.targetAmbassadors||1),0)/weightTotal:0
  const underCovered=territoryMetrics.filter(t=>t.coveragePercent<t.coverageTarget)
  const averageWorkload=activeAmbassadors.length?Math.min(200,(missions.filter(isOpenMission).length/(activeAmbassadors.length*4))*100):0
  const pendingCount=territoryMetrics.reduce((s,t)=>s+t.pendingAssignments.length,0)

  const cityPerformance=useMemo(()=>{
    const map=new Map<string,{city:string;territories:TerritoryMetric[];ambassadors:number;households:number;accounts:number;leads:number;conversions:number;weighted:number;weight:number}>()
    territoryMetrics.forEach(t=>{
      const key=t.city||"Ville non renseignée"
      const item=map.get(key)||{city:key,territories:[],ambassadors:0,households:0,accounts:0,leads:0,conversions:0,weighted:0,weight:0}
      const weight=t.config.addressableHouseholds||t.config.addressableAccounts||t.config.targetAmbassadors||1
      item.territories.push(t);item.ambassadors+=t.activeAmbassadorCount;item.households+=t.config.addressableHouseholds
      item.accounts+=t.config.addressableAccounts;item.leads+=t.leads.length;item.conversions+=t.conversions.filter(isConverted).length
      item.weighted+=t.coveragePercent*weight;item.weight+=weight;map.set(key,item)
    })
    return Array.from(map.values()).map(i=>({...i,coverage:i.weight?i.weighted/i.weight:0,conversionRate:i.leads?(i.conversions/i.leads)*100:0}))
      .sort((a,b)=>b.coverage-a.coverage||b.leads-a.leads)
  },[territoryMetrics])

  const workload=useMemo(()=>{
    const result={low:0,optimal:0,high:0,overloaded:0}
    activeAmbassadors.forEach(a=>{
      const open=missions.filter(m=>txt(m.ambassador_id)===rid(a)&&isOpenMission(m)).length
      const percent=(open/4)*100
      if(percent<60)result.low+=1;else if(percent<=85)result.optimal+=1;else if(percent<=100)result.high+=1;else result.overloaded+=1
    })
    return result
  },[activeAmbassadors,missions])
  const workloadTotal=Math.max(1,workload.low+workload.optimal+workload.high+workload.overloaded)

  const mapValue=(t:TerritoryMetric)=>mapLayer==="workload"?t.workloadPercent:
    mapLayer==="leads"?(t.leads.length/Math.max(1,...territoryMetrics.map(x=>x.leads.length)))*100:
    mapLayer==="conversion"?t.conversionRate:t.coveragePercent

  const openAssignment=(territory?:TerritoryMetric|null)=>{
    const next=defaultForm()
    if(territory){
      Object.assign(next,{
        territoryMode:"existing",existingTerritoryId:territory.id,name:territory.name,region:territory.region,
        city:territory.city,prefecture:territory.config.prefecture,zone:territory.zone,
        neighborhood:territory.config.neighborhood,boundaryMode:territory.config.boundaryMode,
        radiusKm:territory.config.radiusKm,addressableHouseholds:territory.config.addressableHouseholds,
        addressableAccounts:territory.config.addressableAccounts,targetAmbassadors:territory.config.targetAmbassadors,
        maxConcurrentMissions:territory.config.maxConcurrentMissions,targetLeads:territory.config.targetLeads,
        targetQualifiedLeads:territory.config.targetQualifiedLeads,targetConversions:territory.config.targetConversions,
        targetVisits:territory.config.targetVisits,targetPartnerMeetings:territory.config.targetPartnerMeetings,
        targetConversionRate:territory.config.targetConversionRate,targetCoveragePercent:territory.config.targetCoveragePercent,
        slaCoveragePercent:territory.config.slaCoveragePercent,slaResponseHours:territory.config.slaResponseHours,
        startDate:territory.config.startDate||next.startDate,reviewDate:territory.config.reviewDate||next.reviewDate,
        assignmentDurationMonths:territory.config.assignmentDurationMonths,expectedProof:territory.config.expectedProof,
        escalationRule:territory.config.escalationRule,approvalManager:territory.config.approvalManager||territory.manager,
      })
    }
    setForm(next);setSelectedTerritoryId(territory?.id||"");setDrawerMode("assignment");setDrawerOpen(true);setError("");setNotice("")
  }

  const loadTerritory=(id:string)=>{
    const t=territoryMetrics.find(x=>x.id===id)
    if(!t){setForm(v=>({...v,existingTerritoryId:id}));return}
    const next=defaultForm()
    Object.assign(next,{
      territoryMode:"existing",existingTerritoryId:t.id,name:t.name,region:t.region,city:t.city,
      prefecture:t.config.prefecture,zone:t.zone,neighborhood:t.config.neighborhood,
      boundaryMode:t.config.boundaryMode,radiusKm:t.config.radiusKm,
      addressableHouseholds:t.config.addressableHouseholds,addressableAccounts:t.config.addressableAccounts,
      targetAmbassadors:t.config.targetAmbassadors,maxConcurrentMissions:t.config.maxConcurrentMissions,
      targetLeads:t.config.targetLeads,targetQualifiedLeads:t.config.targetQualifiedLeads,
      targetConversions:t.config.targetConversions,targetVisits:t.config.targetVisits,
      targetPartnerMeetings:t.config.targetPartnerMeetings,targetConversionRate:t.config.targetConversionRate,
      targetCoveragePercent:t.config.targetCoveragePercent,slaCoveragePercent:t.config.slaCoveragePercent,
      slaResponseHours:t.config.slaResponseHours,startDate:t.config.startDate||next.startDate,
      reviewDate:t.config.reviewDate||next.reviewDate,assignmentDurationMonths:t.config.assignmentDurationMonths,
      expectedProof:t.config.expectedProof,escalationRule:t.config.escalationRule,
      approvalManager:t.config.approvalManager||t.manager,
    })
    setForm(next);setSelectedTerritoryId(id)
  }

  const submitAssignment=async()=>{
    setError("");setNotice("")
    if(!Object.values(checks).every(Boolean)){
      setError("Le dossier n’est pas prêt. Corrigez les contrôles avant soumission.")
      return
    }
    if(!selectedAmbassador){setError("Sélectionnez un ambassadeur réel et actif.");return}
    setBusy(true)
    try{
      const assignmentId=uid("territory-assignment")
      const payload={
        assignment_id:assignmentId,ambassador_id:rid(selectedAmbassador),
        backup_ambassador_id:form.backupAmbassadorId||null,assignment_type:form.assignmentType,
        start_date:form.startDate,review_date:form.reviewDate,duration_months:form.assignmentDurationMonths,
        max_concurrent_missions:form.maxConcurrentMissions,
        targets:{ambassadors:form.targetAmbassadors,leads:form.targetLeads,qualified_leads:form.targetQualifiedLeads,
          conversions:form.targetConversions,visits:form.targetVisits,partner_meetings:form.targetPartnerMeetings,
          conversion_rate:form.targetConversionRate,coverage_percent:form.targetCoveragePercent},
        sla:{coverage_percent:form.slaCoveragePercent,response_hours:form.slaResponseHours},
        expected_proof:form.expectedProof||null,escalation_rule:form.escalationRule||null,
        conflict_reason:form.conflictReason||null,overlap_approved:form.overlapApproved,
      }
      let territoryId=form.existingTerritoryId
      let existing=territoryMetrics.find(t=>t.id===territoryId)||null
      const base=existing?.config||{...DEFAULT_CONFIG}
      const pending:PendingAssignment={
        id:assignmentId,ambassadorId:rid(selectedAmbassador),
        ambassadorName:txt(selectedAmbassador.full_name||selectedAmbassador.name)||rid(selectedAmbassador),
        backupAmbassadorId:form.backupAmbassadorId,assignmentType:form.assignmentType,
        submittedAt:isoNow(),approvalManager:form.approvalManager.trim(),
        approvalNote:form.approvalNote.trim(),conflictReason:form.conflictReason.trim(),
        overlapApproved:form.overlapApproved,status:"pending",payload,
      }
      const config:TerritoryConfig={
        ...base,version:2,prefecture:form.prefecture,neighborhood:form.neighborhood,
        boundaryMode:form.boundaryMode,radiusKm:form.radiusKm,
        addressableHouseholds:form.addressableHouseholds,addressableAccounts:form.addressableAccounts,
        targetAmbassadors:form.targetAmbassadors,maxConcurrentMissions:form.maxConcurrentMissions,
        targetLeads:form.targetLeads,targetQualifiedLeads:form.targetQualifiedLeads,
        targetConversions:form.targetConversions,targetVisits:form.targetVisits,
        targetPartnerMeetings:form.targetPartnerMeetings,targetConversionRate:form.targetConversionRate,
        targetCoveragePercent:form.targetCoveragePercent,slaCoveragePercent:form.slaCoveragePercent,
        slaResponseHours:form.slaResponseHours,startDate:form.startDate,reviewDate:form.reviewDate,
        assignmentDurationMonths:form.assignmentDurationMonths,expectedProof:form.expectedProof,
        escalationRule:form.escalationRule,approvalManager:form.approvalManager.trim(),
        pendingAssignments:[
          ...base.pendingAssignments.filter(a=>!(a.ambassadorId===rid(selectedAmbassador)&&a.status==="pending")),
          pending,
        ],
        assignmentHistory:base.assignmentHistory,lastUpdatedAt:isoNow(),
      }

      if(form.territoryMode==="new"){
        const created=await api("/api/market-os/ambassadors/territories",{
          method:"POST",body:JSON.stringify({
            name:form.name.trim(),city:form.city.trim(),region:form.region.trim(),zone:form.zone.trim(),
            manager_name:form.approvalManager.trim(),coverage_goal:form.targetAmbassadors,
            active_ambassadors_count:0,status:"pending_approval",notes:serializeNotes(config),
          }),
        })
        const record=rec(created?.record||created?.data?.record||created?.data)
        territoryId=rid(record)
        if(!territoryId)throw new Error("Le territoire a été créé sans identifiant exploitable.")
        config.pendingAssignments=config.pendingAssignments.map(a=>a.id===assignmentId?{...a,payload:{...a.payload,territory_id:territoryId}}:a)
        await api(`/api/market-os/ambassadors/territories/${territoryId}`,{
          method:"PATCH",body:JSON.stringify({notes:serializeNotes(config)}),
        })
      }else{
        if(!territoryId)throw new Error("Sélectionnez un territoire réel.")
        await api(`/api/market-os/ambassadors/territories/${territoryId}`,{
          method:"PATCH",body:JSON.stringify({
            name:form.name||existing?.name,city:form.city||existing?.city,region:form.region||existing?.region,
            zone:form.zone||existing?.zone,manager_name:form.approvalManager.trim(),
            coverage_goal:form.targetAmbassadors,notes:serializeNotes(config),
          }),
        })
      }

      try{
        await api("/api/market-os/ambassadors/audit",{method:"POST",body:JSON.stringify({
          entity_type:"territories",entity_id:territoryId,action:"territory_assignment_submitted",
          summary:`Affectation soumise pour ${pending.ambassadorName}`,actor_name:"AngelCare OPS",
          payload:{territory_id:territoryId,assignment_id:assignmentId,ambassador_id:pending.ambassadorId,
            approval_manager:pending.approvalManager,assignment_type:pending.assignmentType},
        })})
      }catch{}

      await refresh();setSelectedTerritoryId(territoryId);setDrawerMode("territory")
      setNotice("Dossier territorial enregistré et soumis à l’approbation manager. Aucun rattachement actif n’a été simulé.")
    }catch(caught){setError(caught instanceof Error?caught.message:"La soumission territoriale a échoué.")}
    finally{setBusy(false)}
  }

  const decideAssignment=async()=>{
    if(!approvalTarget)return
    if(!approvalTarget.managerName.trim()){setError("Le manager décisionnaire est obligatoire.");return}
    if(approvalTarget.decision==="rejected"&&!approvalTarget.note.trim()){
      setError("La justification du rejet est obligatoire.");return
    }
    setBusy(true);setError("")
    try{
      const territory=territoryMetrics.find(t=>t.id===approvalTarget.territoryId)
      await api("/api/market-os/ambassadors/territories/approve",{method:"POST",body:JSON.stringify({
        territory_id:approvalTarget.territoryId,assignment_id:approvalTarget.assignment.id,
        ambassador_id:approvalTarget.assignment.ambassadorId,
        backup_ambassador_id:approvalTarget.assignment.backupAmbassadorId||null,
        assignment_type:approvalTarget.assignment.assignmentType,decision:approvalTarget.decision,
        manager_name:approvalTarget.managerName.trim(),decision_note:approvalTarget.note.trim(),
        city:territory?.city||null,region:territory?.region||null,
      })})
      setModal(null);setApprovalTarget(null);await refresh()
      setNotice(approvalTarget.decision==="approved"
        ?"Affectation approuvée, ambassadeur rattaché et couverture recalculée."
        :"Affectation rejetée et décision journalisée.")
    }catch(caught){setError(caught instanceof Error?caught.message:"La décision manager a échoué.")}
    finally{setBusy(false)}
  }

  const parseCsv=(source:string)=>{
    const lines=source.split(/\r?\n/).map(v=>v.trim()).filter(Boolean)
    if(lines.length<2){setCsvRows([]);return}
    const parseLine=(line:string)=>{
      const values:string[]=[];let current="";let quoted=false
      for(let i=0;i<line.length;i+=1){
        const char=line[i],next=line[i+1]
        if(char==='"'&&quoted&&next==='"'){current+='"';i+=1}
        else if(char==='"')quoted=!quoted
        else if((char===","||char===";")&&!quoted){values.push(current.trim());current=""}
        else current+=char
      }
      values.push(current.trim());return values
    }
    const headers=parseLine(lines[0]).map(norm)
    setCsvRows(lines.slice(1).map((line,index)=>{
      const values=parseLine(line),row:Row={_row:index+2}
      headers.forEach((header,i)=>{row[header]=values[i]||""})
      return row
    }))
  }

  const importZones=async()=>{
    if(!csvRows.length){setError("Chargez un CSV contenant au moins une zone.");return}
    setBusy(true);setError("");const log:string[]=[]
    try{
      for(const row of csvRows){
        const name=txt(row.name||row.nom||row.territoire||row.territory)
        const city=txt(row.city||row.ville),region=txt(row.region)
        const zone=txt(row.zone||row.quartier||row.secteur)
        if(!name||!city||!region){log.push(`Ligne ${row._row}: ignorée — nom, ville et région obligatoires.`);continue}
        const config:TerritoryConfig={
          ...DEFAULT_CONFIG,prefecture:txt(row.prefecture||row.commune||row.province),
          neighborhood:txt(row.neighborhood||row.quartier),
          addressableHouseholds:num(row.addressable_households||row.menages_adressables||row.households),
          addressableAccounts:num(row.addressable_accounts||row.comptes_adressables||row.accounts),
          targetAmbassadors:Math.max(1,num(row.target_ambassadors||row.ambassadeurs_cibles||row.coverage_goal,1)),
          targetLeads:num(row.target_leads||row.leads_cibles),
          targetConversions:num(row.target_conversions||row.conversions_cibles),
          targetCoveragePercent:num(row.target_coverage_percent||row.couverture_cible||row.sla_coverage,70),
          slaCoveragePercent:num(row.sla_coverage||row.sla_couverture,70),
          approvalManager:txt(row.manager||row.manager_name||row.responsable),
          pendingAssignments:[],assignmentHistory:[],lastUpdatedAt:isoNow(),
        }
        try{
          await api("/api/market-os/ambassadors/territories",{method:"POST",body:JSON.stringify({
            name,city,region,zone,manager_name:config.approvalManager||null,
            coverage_goal:config.targetAmbassadors,active_ambassadors_count:0,status:"draft",
            notes:serializeNotes(config),
          })})
          log.push(`Ligne ${row._row}: ${name} créée en brouillon.`)
        }catch(caught){log.push(`Ligne ${row._row}: échec — ${caught instanceof Error?caught.message:"erreur inconnue"}.`)}
      }
      setImportLog(log);await refresh();setNotice("Import terminé. Les zones valides sont enregistrées en brouillon, sans activation automatique.")
    }finally{setBusy(false)}
  }

  const exportCsv=async()=>{
    await downloadAmbassadorCsv("territories-coverage",[
      "id","name","region","city","zone","status","manager","active_ambassadors",
      "addressable_households","addressable_accounts","coverage_percent","coverage_target",
      "open_missions","leads","conversions","conversion_rate","workload_percent","pending_approvals",
    ],filtered.map(t=>[
      t.id,t.name,t.region,t.city,t.zone,statusLabel(t.status),t.manager,t.activeAmbassadorCount,
      t.config.addressableHouseholds,t.config.addressableAccounts,t.coveragePercent.toFixed(1),t.coverageTarget,
      t.openMissions.length,t.leads.length,t.conversions.filter(isConverted).length,t.conversionRate.toFixed(1),
      t.workloadPercent.toFixed(1),t.pendingAssignments.length,
    ]))
    setNotice("Export CSV généré depuis le périmètre filtré.")
  }

  const openDossier=(territory:TerritoryMetric)=>{
    setSelectedTerritoryId(territory.id);setDrawerMode("territory");setDrawerOpen(true);setError("")
  }

  return <div data-ambassador-territories-route="enterprise-territory-command-center" className="min-w-0 flex-1 bg-[#f1f4f7] p-4 text-slate-950 lg:p-5">
    <div className={`grid min-w-0 gap-4 ${drawerOpen?"2xl:grid-cols-[minmax(0,1fr)_430px]":"grid-cols-1"}`}>
      <main className="min-w-0 space-y-4">
        <header className="overflow-hidden border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.055)]">
          <div className="grid 2xl:grid-cols-[1.3fr_0.7fr]">
            <div className="relative px-5 py-6 lg:px-7">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-[#bd2634]" />
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.19em] text-[#2e6194]"><MapIcon className="h-4 w-4"/><span>Geographic Coverage Command</span><span className="h-1 w-1 rounded-full bg-[#bd2634]"/><span>Morocco Network</span></div>
                  <h1 className="mt-4 text-[30px] font-black tracking-[-0.035em] text-[#071c34] lg:text-[38px]">Territoires & déploiement national</h1>
                  <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">Pilotez les unités géographiques réelles, la densité du réseau, les écarts de couverture, la capacité terrain et les décisions d’affectation soumises à contrôle.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={()=>openAssignment(null)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b3159] px-4 text-sm font-black !text-white shadow-[0_9px_22px_rgba(11,49,89,0.18)] hover:bg-[#092746]"><Plus className="h-4 w-4"/>Affecter un territoire</button>
                  <button type="button" onClick={()=>setModal("import")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-[#173a61] hover:bg-slate-50"><Upload className="h-4 w-4"/>Importer</button>
                  <button type="button" onClick={()=>setModal("export")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4"/>Exporter</button>
                  <button type="button" onClick={()=>setModal("layers")} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50" aria-label="Couches de lecture"><Layers3 className="h-4 w-4"/></button>
                  <button type="button" onClick={()=>void refresh()} disabled={loading} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50" aria-label="Actualiser les territoires"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-slate-200 bg-[#0a2545] !text-white 2xl:border-l 2xl:border-t-0">
              <div className="border-r border-white/10 px-5 py-6">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] !text-[#bfdbfe]">Couverture réseau</p>
                <p className="mt-4 text-4xl font-black tabular-nums">{fmt(globalCoverage)}%</p>
                <p className="mt-2 text-[10px] font-semibold leading-5 !text-[#dbeafe]">Pondération basée sur le potentiel réel disponible.</p>
              </div>
              <div className="px-5 py-6">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] !text-[#bfdbfe]">Écart territorial</p>
                <p className="mt-4 text-4xl font-black tabular-nums">{underCovered.length}</p>
                <p className="mt-2 text-[10px] font-semibold leading-5 !text-[#dbeafe]">zone(s) sous le niveau de service défini.</p>
              </div>
              <div className="col-span-2 border-t border-white/10 px-5 py-4">
                <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.12em] !text-[#dbeafe]"><span>{territoryMetrics.length} territoire(s) documenté(s)</span><span>{pendingCount} approbation(s)</span></div>
              </div>
            </div>
          </div>
          {notice?<div className="border-t border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-900 lg:px-7">{notice}</div>:null}
          {error?<div className="border-t border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-900 lg:px-7">{error}</div>:null}
        </header>

        <section className="overflow-hidden border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            <div className="border-b border-r border-slate-200 px-5 py-4 xl:border-b-0"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Ambassadeurs déployés</p><div className="mt-3 flex items-end justify-between gap-3"><p className="text-3xl font-black tabular-nums text-[#0a2342]">{fmt(activeAmbassadors.filter(a=>territoryIdOf(a)).length)}</p><Users className="h-5 w-5 text-[#2d70b8]"/></div><p className="mt-1 text-[10px] font-bold text-slate-500">sur {activeAmbassadors.length} actif(s)</p></div>
            <div className="border-b border-slate-200 px-5 py-4 xl:border-b-0 xl:border-r"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Potentiel adressable</p><div className="mt-3 flex items-end justify-between gap-3"><p className="text-2xl font-black tabular-nums text-[#0a2342]">{totalHouseholds?`${fmt(totalHouseholds)} ménages`:totalAccounts?`${fmt(totalAccounts)} comptes`:"À renseigner"}</p><Building2 className="h-5 w-5 text-[#2d70b8]"/></div><p className="mt-1 text-[10px] font-bold text-slate-500">Valeurs enregistrées uniquement</p></div>
            <div className="border-b border-r border-slate-200 px-5 py-4 sm:border-b-0"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Charge moyenne</p><div className="mt-3 flex items-end justify-between gap-3"><p className="text-3xl font-black tabular-nums text-[#0a2342]">{fmt(averageWorkload)}%</p><Gauge className="h-5 w-5 text-amber-600"/></div><p className="mt-1 text-[10px] font-bold text-slate-500">capacité opérationnelle</p></div>
            <div className="px-5 py-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Territoires actifs</p><div className="mt-3 flex items-end justify-between gap-3"><p className="text-3xl font-black tabular-nums text-[#0a2342]">{fmt(territoryMetrics.filter(t=>norm(t.status)==="active").length)}</p><MapPin className="h-5 w-5 text-emerald-600"/></div><p className="mt-1 text-[10px] font-bold text-slate-500">{territoryMetrics.length} dossier(s) total</p></div>
          </div>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[245px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between"><div><h2 className="text-base font-black text-slate-950">Densité réseau</h2><p className="mt-1 text-[10px] font-bold text-slate-500">Ambassadeurs / 10 000 ménages</p></div><Users className="h-5 w-5 text-blue-600"/></div>
              <div className="mt-4 space-y-3">
                {cityPerformance.slice(0,7).map(city=>{
                  const density=city.households?(city.ambassadors/city.households)*10000:0
                  return <button key={city.city} type="button" onClick={()=>setQuery(city.city)} className="flex w-full items-center justify-between gap-3 text-left">
                    <span className="flex min-w-0 items-center gap-2"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${density>=4?"bg-emerald-500":density>0?"bg-blue-500":"bg-slate-300"}`}/><span className="truncate text-xs font-black text-slate-800">{city.city}</span></span>
                    <span className="text-xs font-black text-slate-950">{city.households?fmt(density):"—"}</span>
                  </button>
                })}
                {!cityPerformance.length?<p className="py-4 text-center text-xs font-semibold text-slate-500">Aucune ville réelle enregistrée.</p>:null}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between"><div><h2 className="text-base font-black text-slate-950">Secteurs sous-couverts</h2><p className="mt-1 text-[10px] font-bold text-slate-500">{underCovered.length} zone(s) sous le SLA</p></div><AlertTriangle className="h-5 w-5 text-amber-600"/></div>
              <div className="mt-4 space-y-2">
                {underCovered.slice(0,6).map(t=><button key={t.id} type="button" onClick={()=>openDossier(t)} className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-amber-50">
                  <span className="min-w-0"><span className="block truncate text-[11px] font-black text-slate-900">{t.zone||t.name}</span><span className="mt-0.5 block truncate text-[9px] font-bold text-slate-500">{t.city}</span></span>
                  <span className={`text-xs font-black ${t.coveragePercent<40?"text-rose-700":"text-amber-700"}`}>{fmt(t.coveragePercent)}%</span>
                </button>)}
                {!underCovered.length?<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-700"/><p className="mt-2 text-xs font-black text-emerald-950">Aucun écart de couverture</p></div>:null}
              </div>
            </Card>
          </div>

          <Card className="min-w-0 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div><h2 className="text-lg font-black text-slate-950">Couverture du terrain</h2><div className="mt-2 flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
                {[["Excellente (80%+)","bg-emerald-500"],["Bonne (60–80%)","bg-blue-500"],["Moyenne (40–60%)","bg-amber-500"],["Faible (<40%)","bg-rose-500"],["Non configurée","bg-slate-400"]].map(([label,color])=><span key={label} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-sm ${color}`}/>{label}</span>)}
              </div></div>
              <div className="flex items-center gap-2">
                <select value={mapLayer} onChange={e=>setMapLayer(e.target.value as any)} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950">
                  <option value="coverage">Couche couverture</option><option value="workload">Couche charge</option><option value="leads">Couche leads</option><option value="conversion">Couche conversion</option>
                </select>
                <button type="button" onClick={()=>setModal("layers")} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Layers3 className="h-4 w-4"/></button>
              </div>
            </div>

            <div className="relative min-h-[530px] overflow-hidden bg-[radial-gradient(circle_at_28%_42%,#dbeafe_0,#eff6ff_24%,#f8fafc_64%)] p-4">
              <svg viewBox="0 0 100 104" className="absolute inset-0 h-full w-full" aria-label="Carte opérationnelle simplifiée du Maroc">
                <defs><linearGradient id="moroccoFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f8fafc"/><stop offset="100%" stopColor="#e2e8f0"/></linearGradient><filter id="mapShadow"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.14"/></filter></defs>
                <path d={MAP_OUTLINE} fill="url(#moroccoFill)" stroke="#94a3b8" strokeWidth="0.55" filter="url(#mapShadow)"/>
                {[18,28,38,48,58,68,78].map(y=><path key={y} d={`M24 ${y} C38 ${y-5} 52 ${y+4} 66 ${y-2}`} fill="none" stroke="#cbd5e1" strokeWidth="0.25" strokeDasharray="1.5 1.5"/>)}
              </svg>
              <div className="absolute inset-0">
                {filtered.map((t,index)=>{
                  const point=pointFor(t.city,index),value=mapValue(t)
                  const color=mapLayer==="coverage"?coverageColor(value):value>=80?"#dc2626":value>=60?"#d97706":value>0?"#2563eb":"#64748b"
                  return <button key={t.id} type="button" onClick={()=>openDossier(t)} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{left:`${point.x}%`,top:`${point.y}%`}}>
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-xs font-black !text-white shadow-[0_8px_20px_rgba(15,23,42,0.28)] transition group-hover:scale-110" style={{backgroundColor:color}}>
                      {t.activeAmbassadorCount}
                      {t.pendingAssignments.length?<span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0b3159] px-1 text-[9px] font-black !text-white ring-2 ring-white">{t.pendingAssignments.length}</span>:null}
                    </span>
                    {showLabels?<span className="mt-1 block max-w-[140px] rounded-xl border border-slate-200 bg-white/95 px-2 py-1 text-[9px] font-black text-slate-950 shadow-lg">{t.city||t.name} · {fmt(value)}{mapLayer==="leads"?"":"%"}</span>:null}
                  </button>
                })}
              </div>
              <div className="absolute bottom-4 left-4 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg"><p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">Source</p><p className="mt-1 text-xs font-black text-slate-950">Données réelles Ambassador OS</p><p className="mt-1 text-[9px] font-bold text-slate-500">Aucun chiffre injecté.</p></div>
              <div className="absolute bottom-4 right-4 grid gap-2">
                <button type="button" onClick={()=>setShowLabels(v=>!v)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow"><MapPin className="h-4 w-4"/></button>
                <button type="button" onClick={()=>{setQuery("");setRegionFilter("all");setRiskOnly(false)}} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow"><RefreshCw className="h-4 w-4"/></button>
              </div>
              {!loading&&!filtered.length?<div className="absolute inset-0 flex items-center justify-center"><div className="rounded-[24px] border border-slate-200 bg-white/95 p-8 text-center shadow-xl"><MapPin className="mx-auto h-9 w-9 text-blue-600"/><p className="mt-3 text-base font-black text-slate-950">Aucun territoire réel</p><p className="mt-1 text-xs font-semibold text-slate-500">Créez ou importez une zone pour démarrer.</p></div></div>:null}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div><h2 className="text-lg font-black text-slate-950">Performance par ville</h2><p className="mt-1 text-xs font-semibold text-slate-500">Couverture, réseau, potentiel, leads et conversion.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-10 min-w-[210px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Territoire, ville, zone…" className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-950 outline-none"/></label>
                <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950"><option value="all">Toutes régions</option>{regions.map(r=><option key={r} value={r}>{r}</option>)}</select>
                <button type="button" onClick={()=>setRiskOnly(v=>!v)} className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-black ${riskOnly?"border-rose-300 bg-rose-50 text-rose-800":"border-slate-200 bg-white text-slate-950"}`}><Filter className="h-4 w-4"/>Risques</button>
              </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead><tr className="bg-slate-50">{["Ville","Couverture","Ambassadeurs","Potentiel","Leads","Conversion","Action"].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">{h}</th>)}</tr></thead>
              <tbody>{cityPerformance.map(city=>{
                const first=city.territories[0]
                return <tr key={city.city} className="border-t border-slate-100">
                  <td className="px-4 py-3"><p className="text-xs font-black text-slate-950">{city.city}</p><p className="mt-1 text-[10px] font-bold text-slate-500">{city.territories.length} territoire(s)</p></td>
                  <td className="px-4 py-3"><div className="w-36"><div className="mb-1 flex justify-between text-[10px] font-black"><span>{fmt(city.coverage)}%</span></div><Progress value={city.coverage} color={city.coverage>=80?"bg-emerald-600":city.coverage>=60?"bg-blue-600":city.coverage>=40?"bg-amber-500":"bg-rose-600"}/></div></td>
                  <td className="px-4 py-3 text-xs font-black">{city.ambassadors}</td>
                  <td className="px-4 py-3 text-xs font-black">{city.households?`${fmt(city.households)} ménages`:city.accounts?`${fmt(city.accounts)} comptes`:"À renseigner"}</td>
                  <td className="px-4 py-3 text-xs font-black">{city.leads}</td>
                  <td className="px-4 py-3 text-xs font-black">{fmt(city.conversionRate)}%</td>
                  <td className="px-4 py-3"><button type="button" onClick={()=>first&&openDossier(first)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-blue-700">Ouvrir</button></td>
                </tr>
              })}</tbody>
            </table></div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-slate-950">Charges de mission</h2><p className="mt-1 text-xs font-semibold text-slate-500">Répartition des ambassadeurs actifs.</p></div><Gauge className="h-5 w-5 text-blue-600"/></div>
              <div className="mt-5 grid gap-5 sm:grid-cols-[170px_1fr] sm:items-center">
                <div className="relative mx-auto h-40 w-40 rounded-full" style={{background:`conic-gradient(#10b981 0 ${(workload.low/workloadTotal)*100}%,#2563eb ${(workload.low/workloadTotal)*100}% ${((workload.low+workload.optimal)/workloadTotal)*100}%,#f59e0b ${((workload.low+workload.optimal)/workloadTotal)*100}% ${((workload.low+workload.optimal+workload.high)/workloadTotal)*100}%,#ef4444 ${((workload.low+workload.optimal+workload.high)/workloadTotal)*100}% 100%)`}}>
                  <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white shadow-inner"><span className="text-3xl font-black text-slate-950">{activeAmbassadors.length}</span><span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Ambassadeurs</span></div>
                </div>
                <div className="space-y-3">{[["Faible (<60%)",workload.low,"bg-emerald-500"],["Optimale (60–85%)",workload.optimal,"bg-blue-600"],["Élevée (85–100%)",workload.high,"bg-amber-500"],["Surchargée (>100%)",workload.overloaded,"bg-rose-600"]].map(([label,value,color])=><div key={String(label)} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-[11px] font-black text-slate-700"><span className={`h-2.5 w-2.5 rounded-full ${color}`}/>{label}</span><span className="text-xs font-black text-slate-950">{value}</span></div>)}</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between"><div><h2 className="text-lg font-black text-slate-950">Alertes & recommandations</h2><p className="mt-1 text-xs font-semibold text-slate-500">Signaux calculés depuis les dossiers réels.</p></div><ShieldCheck className="h-5 w-5 text-emerald-600"/></div>
              <div className="mt-4 space-y-2">
                {underCovered.slice(0,3).map(t=><button key={t.id} type="button" onClick={()=>openDossier(t)} className="flex w-full items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/><span><span className="block text-xs font-black text-amber-950">Renforcer {t.name}</span><span className="mt-1 block text-[10px] font-bold leading-5 text-amber-800">Couverture {fmt(t.coveragePercent)}% contre SLA {t.coverageTarget}%.</span></span></button>)}
                {territoryMetrics.filter(t=>t.workloadPercent>100).slice(0,2).map(t=><button key={`load-${t.id}`} type="button" onClick={()=>openDossier(t)} className="flex w-full items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-left"><Gauge className="mt-0.5 h-4 w-4 shrink-0 text-rose-700"/><span><span className="block text-xs font-black text-rose-950">Charge critique — {t.name}</span><span className="mt-1 block text-[10px] font-bold text-rose-800">{fmt(t.workloadPercent)}% de la capacité.</span></span></button>)}
                {!underCovered.length&&!territoryMetrics.some(t=>t.workloadPercent>100)?<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-black text-emerald-950">Aucun risque critique calculé.</p></div>:null}
              </div>
            </Card>
          </div>
        </section>
      </main>

      {drawerOpen?<aside className="min-w-0">
        <Card className="sticky top-24 flex max-h-[calc(100vh-112px)] flex-col overflow-hidden">
          <header className="border-b border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">Territory Command Drawer</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{drawerMode==="assignment"?"Affecter un territoire":selectedTerritory?.name||"Dossier territoire"}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">{drawerMode==="assignment"?"Préparation, contrôles et approbation.":`${selectedTerritory?.city||"Ville non renseignée"} · ${selectedTerritory?.zone||"Zone non renseignée"}`}</p></div>
              <button type="button" onClick={()=>setDrawerOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white"><X className="h-4 w-4"/></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              <button type="button" onClick={()=>setDrawerMode("assignment")} className={`h-9 rounded-xl text-xs font-black ${drawerMode==="assignment"?"bg-white text-blue-700 shadow":"text-slate-600"}`}>Affectation</button>
              <button type="button" onClick={()=>setDrawerMode("territory")} disabled={!selectedTerritory} className={`h-9 rounded-xl text-xs font-black disabled:opacity-40 ${drawerMode==="territory"?"bg-white text-blue-700 shadow":"text-slate-600"}`}>Dossier</button>
            </div>
          </header>

          {drawerMode==="assignment"?<>
            <div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={()=>setForm(v=>({...v,territoryMode:"existing"}))} className={`rounded-2xl border p-3 text-left ${form.territoryMode==="existing"?"border-blue-500 bg-blue-50":"border-slate-200 bg-white"}`}><p className="text-[9px] font-black uppercase text-slate-500">Mode</p><p className="mt-1 text-xs font-black">Existant</p></button>
                <button type="button" onClick={()=>setForm(v=>({...v,territoryMode:"new",existingTerritoryId:""}))} className={`rounded-2xl border p-3 text-left ${form.territoryMode==="new"?"border-blue-500 bg-blue-50":"border-slate-200 bg-white"}`}><p className="text-[9px] font-black uppercase text-slate-500">Mode</p><p className="mt-1 text-xs font-black">Nouveau</p></button>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">Readiness</p><p className="mt-1 text-xl font-black">{readiness}%</p></div>
              </div>

              <details open className="rounded-2xl border border-slate-200 bg-white">
                <summary className="cursor-pointer list-none p-4 text-sm font-black">1. Périmètre géographique</summary>
                <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                  {form.territoryMode==="existing"?<div className="sm:col-span-2"><Field label="Territoire réel" required><select value={form.existingTerritoryId} onChange={e=>loadTerritory(e.target.value)} className={inputClass}><option value="">Choisir un territoire</option>{territoryMetrics.map(t=><option key={t.id} value={t.id}>{t.name} · {t.city} · {fmt(t.coveragePercent)}%</option>)}</select></Field></div>:
                    <div className="sm:col-span-2"><Field label="Nom du territoire" required><input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} className={inputClass}/></Field></div>}
                  <Field label="Région" required><select value={form.region} onChange={e=>setForm(v=>({...v,region:e.target.value}))} className={inputClass}><option value="">Choisir</option>{REGIONS.map(r=><option key={r} value={r}>{r}</option>)}</select></Field>
                  <Field label="Ville" required><input value={form.city} onChange={e=>setForm(v=>({...v,city:e.target.value}))} className={inputClass}/></Field>
                  <Field label="Commune / préfecture"><input value={form.prefecture} onChange={e=>setForm(v=>({...v,prefecture:e.target.value}))} className={inputClass}/></Field>
                  <Field label="Quartier / secteur" required><input value={form.zone} onChange={e=>setForm(v=>({...v,zone:e.target.value}))} className={inputClass}/></Field>
                  <Field label="Sous-zone"><input value={form.neighborhood} onChange={e=>setForm(v=>({...v,neighborhood:e.target.value}))} className={inputClass}/></Field>
                  <Field label="Mode de limite"><select value={form.boundaryMode} onChange={e=>setForm(v=>({...v,boundaryMode:e.target.value as any}))} className={inputClass}><option value="administrative">Limites administratives</option><option value="radius">Rayon</option><option value="custom">Personnalisé</option></select></Field>
                  <Field label="Rayon km"><input type="number" min="1" value={form.radiusKm} onChange={e=>setForm(v=>({...v,radiusKm:num(e.target.value,5)}))} className={inputClass}/></Field>
                  <Field label="Ménages adressables"><input type="number" min="0" value={form.addressableHouseholds} onChange={e=>setForm(v=>({...v,addressableHouseholds:num(e.target.value)}))} className={inputClass}/></Field>
                  <Field label="Comptes B2B adressables"><input type="number" min="0" value={form.addressableAccounts} onChange={e=>setForm(v=>({...v,addressableAccounts:num(e.target.value)}))} className={inputClass}/></Field>
                </div>
              </details>

              <details open className="rounded-2xl border border-slate-200 bg-white">
                <summary className="cursor-pointer list-none p-4 text-sm font-black">2. Capacité & affectation</summary>
                <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Field label="Ambassadeur actif" required><select value={form.ambassadorId} onChange={e=>setForm(v=>({...v,ambassadorId:e.target.value}))} className={inputClass}><option value="">Choisir un ambassadeur réel</option>{activeAmbassadors.map(a=><option key={rid(a)} value={rid(a)}>{txt(a.full_name||a.name)||rid(a)} · {txt(a.city)||"Sans ville"} · {txt(a.territory_name)||"Non affecté"}</option>)}</select></Field></div>
                  <Field label="Type d’affectation"><select value={form.assignmentType} onChange={e=>setForm(v=>({...v,assignmentType:e.target.value as AssignmentType}))} className={inputClass}><option value="primary">Principal</option><option value="secondary">Secondaire</option><option value="backup">Backup</option><option value="temporary">Temporaire</option></select></Field>
                  <Field label="Ambassadeur backup"><select value={form.backupAmbassadorId} onChange={e=>setForm(v=>({...v,backupAmbassadorId:e.target.value}))} className={inputClass}><option value="">Aucun</option>{activeAmbassadors.filter(a=>rid(a)!==form.ambassadorId).map(a=><option key={rid(a)} value={rid(a)}>{txt(a.full_name||a.name)||rid(a)}</option>)}</select></Field>
                  <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">Charge actuelle</p><p className="mt-1 text-2xl font-black">{fmt(currentLoad)}%</p><Progress value={currentLoad} color={currentLoad>100?"bg-rose-600":"bg-blue-600"}/></div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">Charge projetée</p><p className="mt-1 text-2xl font-black">{fmt(projectedLoad)}%</p><Progress value={projectedLoad} color={projectedLoad>100?"bg-rose-600":projectedLoad>80?"bg-amber-500":"bg-emerald-600"}/></div>
                  </div>
                  {conflict?<div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/><div><p className="text-xs font-black text-amber-950">Conflit territorial détecté</p><p className="mt-1 text-[10px] font-bold text-amber-800">Déjà rattaché à {txt((conflict as Row).name)||"un autre territoire"}.</p></div></div>
                    <textarea value={form.conflictReason} onChange={e=>setForm(v=>({...v,conflictReason:e.target.value}))} placeholder="Justification obligatoire…" className={`${textareaClass} mt-3`}/>
                    <button type="button" onClick={()=>setForm(v=>({...v,overlapApproved:!v.overlapApproved}))} className={`mt-2 w-full rounded-2xl border p-3 text-left text-xs font-black ${form.overlapApproved?"border-blue-300 bg-blue-50":"border-amber-300 bg-white"}`}>{form.overlapApproved?"Exception confirmée":"Confirmer l’exception"}</button>
                  </div>:null}
                </div>
              </details>

              <details className="rounded-2xl border border-slate-200 bg-white">
                <summary className="cursor-pointer list-none p-4 text-sm font-black">3. Objectifs & SLA</summary>
                <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                  {[
                    ["Ambassadeurs cibles","targetAmbassadors",1,undefined],["Capacité missions / amb.","maxConcurrentMissions",1,undefined],
                    ["Leads cibles / mois","targetLeads",0,undefined],["Leads qualifiés / mois","targetQualifiedLeads",0,undefined],
                    ["Conversions / mois","targetConversions",0,undefined],["Visites terrain / mois","targetVisits",0,undefined],
                    ["RDV partenaires / mois","targetPartnerMeetings",0,undefined],["Conversion cible %","targetConversionRate",0,100],
                    ["Couverture cible %","targetCoveragePercent",1,100],["SLA couverture %","slaCoveragePercent",1,100],
                    ["SLA réponse heures","slaResponseHours",1,undefined],
                  ].map(([label,key,min,max])=><Field key={String(key)} label={String(label)}><input type="number" min={Number(min)} max={max===undefined?undefined:Number(max)} value={form[key as keyof FormState] as number} onChange={e=>setForm(v=>({...v,[key as string]:num(e.target.value,Number(min))}))} className={inputClass}/></Field>)}
                </div>
              </details>

              <details className="rounded-2xl border border-slate-200 bg-white">
                <summary className="cursor-pointer list-none p-4 text-sm font-black">4. Planification & gouvernance</summary>
                <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
                  <Field label="Date de début" required><input type="date" value={form.startDate} onChange={e=>setForm(v=>({...v,startDate:e.target.value}))} className={inputClass}/></Field>
                  <Field label="Révision prévue" required><input type="date" value={form.reviewDate} onChange={e=>setForm(v=>({...v,reviewDate:e.target.value}))} className={inputClass}/></Field>
                  <Field label="Durée mois"><input type="number" min="1" value={form.assignmentDurationMonths} onChange={e=>setForm(v=>({...v,assignmentDurationMonths:num(e.target.value,3)}))} className={inputClass}/></Field>
                  <Field label="Manager approbateur" required><input value={form.approvalManager} onChange={e=>setForm(v=>({...v,approvalManager:e.target.value}))} className={inputClass}/></Field>
                  <div className="sm:col-span-2"><Field label="Preuve attendue"><input value={form.expectedProof} onChange={e=>setForm(v=>({...v,expectedProof:e.target.value}))} className={inputClass}/></Field></div>
                  <div className="sm:col-span-2"><Field label="Règle d’escalade"><textarea value={form.escalationRule} onChange={e=>setForm(v=>({...v,escalationRule:e.target.value}))} className={textareaClass}/></Field></div>
                  <div className="sm:col-span-2"><Field label="Note de soumission"><textarea value={form.approvalNote} onChange={e=>setForm(v=>({...v,approvalNote:e.target.value}))} className={textareaClass}/></Field></div>
                </div>
              </details>

              <Card className="p-4">
                <div className="flex items-center justify-between"><div><h3 className="text-sm font-black">Règles de validation</h3><p className="mt-1 text-[10px] font-bold text-slate-500">Activation uniquement après approbation.</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${readiness===100?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"}`}>{readiness}%</span></div>
                <div className="mt-4 space-y-2">{[
                  [checks.territory,"Périmètre défini"],[checks.ambassador,"Ambassadeur réel et actif"],[checks.capacity,"Capacité compatible"],
                  [checks.conflict,"Conflit maîtrisé"],[checks.objectives,"Objectifs et SLA complets"],[checks.planning,"Planification renseignée"],[checks.approval,"Manager nommé"],
                ].map(([ok,label])=><div key={String(label)} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="text-[11px] font-black">{label}</span>{ok?<CheckCircle2 className="h-4 w-4 text-emerald-600"/>:<AlertTriangle className="h-4 w-4 text-amber-600"/>}</div>)}</div>
              </Card>
            </div></div>
            <footer className="border-t border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase text-slate-500">Statut après soumission</p><p className="mt-1 text-xs font-black text-amber-700">En attente d’approbation</p></div><button type="button" onClick={()=>void submitAssignment()} disabled={busy||readiness<100} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black !text-white disabled:bg-slate-200 disabled:!text-slate-500">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<ShieldCheck className="h-4 w-4"/>}Soumettre</button></div></footer>
          </>:selectedTerritory?<div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="space-y-4">
            <div className={`rounded-[22px] border p-4 ${coverageBg(selectedTerritory.coveragePercent)}`}><div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase text-slate-500">Couverture actuelle</p><p className="mt-1 text-3xl font-black">{fmt(selectedTerritory.coveragePercent)}%</p><p className="mt-1 text-xs font-black text-slate-600">SLA {selectedTerritory.coverageTarget}%</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-black ${statusClass(selectedTerritory.status)}`}>{statusLabel(selectedTerritory.status)}</span></div><div className="mt-3"><Progress value={selectedTerritory.coveragePercent} color={selectedTerritory.coveragePercent>=80?"bg-emerald-600":selectedTerritory.coveragePercent>=60?"bg-blue-600":selectedTerritory.coveragePercent>=40?"bg-amber-500":"bg-rose-600"}/></div></div>
            <Card className="p-4"><h3 className="text-sm font-black">Identité territoriale</h3><div className="mt-3 space-y-3">{[["Région",selectedTerritory.region||"—"],["Ville",selectedTerritory.city||"—"],["Préfecture",selectedTerritory.config.prefecture||"—"],["Secteur",selectedTerritory.zone||"—"],["Manager",selectedTerritory.manager||"À affecter"]].map(([label,value])=><div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2"><span className="text-[9px] font-black uppercase text-slate-500">{label}</span><span className="text-right text-xs font-black">{value}</span></div>)}</div></Card>
            <div className="grid grid-cols-2 gap-2">{[["Ambassadeurs",selectedTerritory.activeAmbassadorCount],["Missions ouvertes",selectedTerritory.openMissions.length],["Leads",selectedTerritory.leads.length],["Conversions",selectedTerritory.conversions.filter(isConverted).length],["Charge",`${fmt(selectedTerritory.workloadPercent)}%`],["Conversion",`${fmt(selectedTerritory.conversionRate)}%`]].map(([label,value])=><Card key={String(label)} className="p-3"><p className="text-[9px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></Card>)}</div>
            <Card className="p-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-black">Approbations en attente</h3><p className="mt-1 text-[10px] font-bold text-slate-500">Décision obligatoire avant rattachement.</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-800">{selectedTerritory.pendingAssignments.length}</span></div>
              <div className="mt-4 space-y-2">{selectedTerritory.pendingAssignments.map(a=><div key={a.id} className="rounded-2xl border border-violet-200 bg-violet-50 p-3"><p className="text-xs font-black text-violet-950">{a.ambassadorName}</p><p className="mt-1 text-[10px] font-bold text-violet-800">{a.assignmentType} · soumis le {shortDate(a.submittedAt)}</p><div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={()=>{setApprovalTarget({territoryId:selectedTerritory.id,assignment:a,decision:"rejected",managerName:a.approvalManager||selectedTerritory.manager,note:""});setModal("approval")}} className="h-9 rounded-xl border border-rose-200 bg-white text-[10px] font-black text-rose-700">Rejeter</button>
                <button type="button" onClick={()=>{setApprovalTarget({territoryId:selectedTerritory.id,assignment:a,decision:"approved",managerName:a.approvalManager||selectedTerritory.manager,note:""});setModal("approval")}} className="h-9 rounded-xl bg-emerald-600 text-[10px] font-black !text-white">Approuver</button>
              </div></div>)}{!selectedTerritory.pendingAssignments.length?<p className="py-5 text-center text-xs font-semibold text-slate-500">Aucune décision en attente.</p>:null}</div>
            </Card>
            <Card className="p-4"><h3 className="text-sm font-black">Ambassadeurs affectés</h3><div className="mt-3 space-y-2">{selectedTerritory.activeAmbassadors.map(a=><div key={rid(a)} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><span><span className="block text-xs font-black">{txt(a.full_name||a.name)||rid(a)}</span><span className="mt-1 block text-[10px] font-bold text-slate-500">{txt(a.city)||"Ville non renseignée"}</span></span><UserCheck className="h-4 w-4 text-emerald-600"/></div>)}{!selectedTerritory.activeAmbassadors.length?<p className="py-4 text-center text-xs font-semibold text-slate-500">Aucun ambassadeur actif affecté.</p>:null}</div></Card>
            <button type="button" onClick={()=>openAssignment(selectedTerritory)} className="h-11 w-full rounded-2xl bg-blue-600 text-xs font-black !text-white">Nouvelle affectation</button>
          </div></div>:<div className="p-10 text-center"><MapPin className="mx-auto h-9 w-9 text-blue-600"/><p className="mt-3 text-base font-black">Aucun territoire sélectionné</p></div>}
        </Card>
      </aside>:null}
    </div>

    {!drawerOpen?<button type="button" onClick={()=>setDrawerOpen(true)} className="fixed bottom-6 right-6 z-40 inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black !text-white shadow-xl"><MapPin className="h-4 w-4"/>Ouvrir le contrôle territorial</button>:null}

    {modal==="import"?<ModalShell title="Importer des zones" subtitle="Import CSV contrôlé, sans seed ni activation automatique. Chaque ligne valide devient un territoire brouillon." icon={FileSpreadsheet} onClose={()=>setModal(null)} width="max-w-6xl"
      footer={<div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-600">{csvRows.length} ligne(s) détectée(s)</p><div className="flex gap-2"><button type="button" onClick={()=>setModal(null)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black">Fermer</button><button type="button" onClick={()=>void importZones()} disabled={busy||!csvRows.length} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black !text-white disabled:bg-slate-200">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Upload className="h-4 w-4"/>}Importer en brouillon</button></div></div>}>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5"><h3 className="text-base font-black">Source CSV</h3><p className="mt-2 text-xs font-semibold leading-6 text-slate-500">Colonnes reconnues : name/nom, region, city/ville, zone, prefecture/commune, addressable_households, addressable_accounts, target_ambassadors, target_leads, target_conversions, sla_coverage, manager.</p>
          <textarea value={csvText} onChange={e=>{setCsvText(e.target.value);parseCsv(e.target.value)}} placeholder="name,region,city,zone,target_ambassadors,target_leads,sla_coverage,manager" className={`${textareaClass} mt-4 min-h-[360px] font-mono text-xs`}/>
        </Card>
        <Card className="overflow-hidden"><div className="border-b border-slate-100 p-4"><h3 className="text-base font-black">Prévisualisation</h3></div>
          <div className="max-h-[420px] overflow-auto"><table className="w-full min-w-[720px]"><thead><tr className="bg-slate-50">{["Ligne","Nom","Région","Ville","Zone","Cible amb.","SLA"].map(h=><th key={h} className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">{h}</th>)}</tr></thead>
            <tbody>{csvRows.slice(0,20).map(row=><tr key={row._row} className="border-t border-slate-100">
              <td className="px-3 py-3 text-xs font-black">{row._row}</td><td className="px-3 py-3 text-xs font-black">{txt(row.name||row.nom||row.territoire||row.territory)||"—"}</td>
              <td className="px-3 py-3 text-xs font-bold">{txt(row.region)||"—"}</td><td className="px-3 py-3 text-xs font-bold">{txt(row.city||row.ville)||"—"}</td>
              <td className="px-3 py-3 text-xs font-bold">{txt(row.zone||row.quartier)||"—"}</td><td className="px-3 py-3 text-xs font-black">{num(row.target_ambassadors||row.ambassadeurs_cibles)}</td>
              <td className="px-3 py-3 text-xs font-black">{num(row.sla_coverage||row.sla_couverture,70)}%</td>
            </tr>)}</tbody>
          </table>{!csvRows.length?<div className="p-10 text-center"><FileSpreadsheet className="mx-auto h-9 w-9 text-blue-600"/><p className="mt-3 text-base font-black">Aucune ligne chargée</p></div>:null}</div>
          {importLog.length?<div className="max-h-44 overflow-y-auto border-t border-slate-100 bg-slate-50 p-4">{importLog.map((line,index)=><p key={`${line}-${index}`} className="mb-1 text-[10px] font-bold text-slate-700">{line}</p>)}</div>:null}
        </Card>
      </div>
    </ModalShell>:null}

    {modal==="export"?<ModalShell title="Exporter la couverture territoriale" subtitle="Le fichier est généré depuis les seuls territoires réels correspondant aux filtres actuels." icon={Download} onClose={()=>setModal(null)} width="max-w-3xl"
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={()=>setModal(null)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black">Annuler</button><button type="button" onClick={()=>void exportCsv()} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black !text-white"><Download className="h-4 w-4"/>Générer le CSV</button></div>}>
      <Card className="p-5"><div className="grid gap-3 sm:grid-cols-3">{[["Territoires",filtered.length],["Couverture",`${fmt(globalCoverage)}%`],["Approbations",pendingCount]].map(([label,value])=><div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div>
      <p className="mt-5 text-xs font-semibold leading-6 text-slate-600">Colonnes : identité territoriale, statut, manager, ambassadeurs, potentiel, couverture, SLA, missions, leads, conversions, charge et décisions en attente.</p></Card>
    </ModalShell>:null}

    {modal==="layers"?<ModalShell title="Couches & contrôles de carte" subtitle="Adaptez la lecture de la carte sans modifier les données métier." icon={Layers3} onClose={()=>setModal(null)} width="max-w-2xl"
      footer={<div className="flex justify-end"><button type="button" onClick={()=>setModal(null)} className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-black !text-white">Appliquer</button></div>}>
      <div className="grid gap-3 sm:grid-cols-2">{([
        { value: "coverage", label: "Couverture", icon: Target },
        { value: "workload", label: "Charge opérationnelle", icon: Gauge },
        { value: "leads", label: "Densité de leads", icon: Users },
        { value: "conversion", label: "Conversion", icon: BarChart3 },
      ] satisfies Array<{ value: "coverage" | "workload" | "leads" | "conversion"; label: string; icon: LucideIcon }>).map(({ value, label, icon: Icon }) => <button key={value} type="button" onClick={()=>setMapLayer(value)} className={`rounded-2xl border p-5 text-left ${mapLayer===value?"border-blue-500 bg-blue-50":"border-slate-200 bg-white"}`}><Icon className="h-5 w-5 text-blue-700"/><p className="mt-3 text-sm font-black">{label}</p></button>)}</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={()=>setShowLabels(v=>!v)} className={`rounded-2xl border p-4 text-left ${showLabels?"border-emerald-300 bg-emerald-50":"border-slate-200 bg-white"}`}><p className="text-xs font-black">Libellés de carte</p><p className="mt-1 text-[10px] font-bold text-slate-500">{showLabels?"Affichés":"Masqués"}</p></button>
      <button type="button" onClick={()=>setRiskOnly(v=>!v)} className={`rounded-2xl border p-4 text-left ${riskOnly?"border-rose-300 bg-rose-50":"border-slate-200 bg-white"}`}><p className="text-xs font-black">Risques uniquement</p><p className="mt-1 text-[10px] font-bold text-slate-500">{riskOnly?"Actif":"Inactif"}</p></button></div>
    </ModalShell>:null}

    {modal==="approval"&&approvalTarget?<ModalShell title={approvalTarget.decision==="approved"?"Approuver l’affectation":"Rejeter l’affectation"} subtitle="La décision est journalisée. Une approbation rattache réellement l’ambassadeur et recalcule la couverture." icon={ShieldCheck} onClose={()=>{setModal(null);setApprovalTarget(null)}} width="max-w-3xl"
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={()=>{setModal(null);setApprovalTarget(null)}} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black">Annuler</button><button type="button" onClick={()=>void decideAssignment()} disabled={busy||!approvalTarget.managerName.trim()||(approvalTarget.decision==="rejected"&&!approvalTarget.note.trim())} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-black !text-white disabled:bg-slate-200 ${approvalTarget.decision==="approved"?"bg-emerald-600":"bg-rose-600"}`}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:approvalTarget.decision==="approved"?<CheckCircle2 className="h-4 w-4"/>:<X className="h-4 w-4"/>}Confirmer la décision</button></div>}>
      <Card className="p-5"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase text-slate-500">Ambassadeur</p><p className="mt-1 text-lg font-black">{approvalTarget.assignment.ambassadorName}</p><p className="mt-1 text-xs font-bold text-slate-500">{approvalTarget.assignment.assignmentType} · soumis le {shortDate(approvalTarget.assignment.submittedAt)}</p></div>
        <div className="mt-4 grid gap-3"><Field label="Manager décisionnaire" required><input value={approvalTarget.managerName} onChange={e=>setApprovalTarget(v=>v?{...v,managerName:e.target.value}:v)} className={inputClass}/></Field>
        <Field label={approvalTarget.decision==="rejected"?"Justification du rejet":"Note de décision"} required={approvalTarget.decision==="rejected"}><textarea value={approvalTarget.note} onChange={e=>setApprovalTarget(v=>v?{...v,note:e.target.value}:v)} className={textareaClass}/></Field></div>
      </Card>
    </ModalShell>:null}

    <style jsx global>{`
      [data-ambassador-territories-route="enterprise-territory-command-center"] h1,
      [data-ambassador-territories-route="enterprise-territory-command-center"] h2,
      [data-ambassador-territories-route="enterprise-territory-command-center"] h3,
      [data-ambassador-territories-route="enterprise-territory-command-center"] h4,
      [data-ambassador-territories-route="enterprise-territory-command-center"] label,
      [data-ambassador-territories-route="enterprise-territory-command-center"] th,
      [data-ambassador-territories-route="enterprise-territory-command-center"] summary {
        color:#020617!important;-webkit-text-fill-color:#020617!important;font-weight:900!important;
      }
      [data-ambassador-territories-route="enterprise-territory-command-center"] input,
      [data-ambassador-territories-route="enterprise-territory-command-center"] select,
      [data-ambassador-territories-route="enterprise-territory-command-center"] textarea,
      [data-ambassador-territories-route="enterprise-territory-command-center"] option {
        color:#020617!important;-webkit-text-fill-color:#020617!important;font-weight:700!important;
      }
      [data-ambassador-territories-route="enterprise-territory-command-center"] input::placeholder,
      [data-ambassador-territories-route="enterprise-territory-command-center"] textarea::placeholder {
        color:#64748b!important;-webkit-text-fill-color:#64748b!important;opacity:1!important;
      }
    `}</style>
  </div>
}
