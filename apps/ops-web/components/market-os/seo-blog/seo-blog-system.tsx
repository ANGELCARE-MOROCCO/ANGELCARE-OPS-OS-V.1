"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  ShieldCheck,
} from "lucide-react"

export type SeoStatus = "idea" | "brief" | "draft" | "review" | "approved" | "scheduled" | "published" | "archived"
export type SeoIntent = "informational" | "commercial" | "transactional" | "navigational" | "local"
export type SeoPriority = "Low" | "Medium" | "High" | "Critical"
export type SeoChannel = "Blog" | "SEO Landing" | "Academy Blog" | "Partnership Article" | "Clinic Guide" | "Homecare Guide" | "Press/News"

export type SeoArticle = {
  id:string; title:string; slug:string; status:SeoStatus; priority:SeoPriority; channel:SeoChannel; owner:string; reviewer:string; cluster:string; primaryKeyword:string; secondaryKeywords:string[]; intent:SeoIntent; audience:string; objective:string; metaTitle:string; metaDescription:string; h1:string; outline:string[]; body:string; internalLinks:string[]; externalLinks:string[]; brandScore:number; seoScore:number; readability:number; dueDate:string; scheduledDate:string; publishedDate?:string; createdAt:string; updatedAt:string; notes:string; canonicalUrl:string; wordCount:number; impressions:number; clicks:number; rank:number; conversions:number
}
export type SeoTask = { id:string; articleId:string; title:string; owner:string; status:"todo"|"doing"|"blocked"|"done"; dueDate:string; note:string }
export type SeoCluster = { id:string; name:string; pillar:string; intent:SeoIntent; owner:string; target:string; status:"planning"|"active"|"expanding"|"complete"; notes:string }
export type SeoRule = { id:string; title:string; category:"brand"|"technical"|"medical"|"conversion"|"editorial"; required:boolean; active:boolean; description:string }
export type SeoLog = { id:string; action:string; entity:string; detail:string; at:string }
export type SeoStore = { articles:SeoArticle[]; tasks:SeoTask[]; clusters:SeoCluster[]; rules:SeoRule[]; logs:SeoLog[] }

export const SEO_STORE_KEY = "angelcare_market_os_seo_blog_real_execution_v3"
export const statuses: SeoStatus[] = ["idea","brief","draft","review","approved","scheduled","published"]
export const channels: SeoChannel[] = ["Blog","SEO Landing","Academy Blog","Partnership Article","Clinic Guide","Homecare Guide","Press/News"]
export const intents: SeoIntent[] = ["informational","commercial","transactional","navigational","local"]
export const priorities: SeoPriority[] = ["Low","Medium","High","Critical"]

const statusLabels: Record<string,string> = {
  idea:"Idée",
  brief:"Brief",
  draft:"Rédaction",
  review:"En validation",
  approved:"Approuvé",
  scheduled:"Programmé",
  published:"Publié",
  archived:"Archivé",
  planning:"Planification",
  active:"Actif",
  expanding:"Expansion",
  complete:"Terminé",
  informational:"Informationnelle",
  commercial:"Commerciale",
  transactional:"Transactionnelle",
  navigational:"Navigationnelle",
  local:"Locale",
}

export function uid(prefix="seo"){ return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}` }
export function todayISO(offset=0){ const d=new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10) }
export function label(v:string){ return statusLabels[v] || v.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase()) }
export function pct(v:number){ return `${Math.max(0,Math.min(100,Math.round(v)))}%` }
export function compactNumber(v:number){ return new Intl.NumberFormat("fr-FR",{notation:"compact",maximumFractionDigits:1}).format(v) }
export function formatDate(v?:string){ if(!v)return "Non défini"; const d=new Date(`${v.slice(0,10)}T12:00:00`); return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"short",year:"numeric"}).format(d) }
export function formatDateTime(v?:string){ if(!v)return "Non défini"; const d=new Date(v); return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(d) }
export function scoreTone(v:number){ if(v>=85)return "text-emerald-700 bg-emerald-50 border-emerald-200"; if(v>=70)return "text-amber-700 bg-amber-50 border-amber-200"; return "text-red-700 bg-red-50 border-red-200" }
export function statusTone(s:string){ if(["published","approved","scheduled","complete"].includes(s))return "border-emerald-200 bg-emerald-50 text-emerald-800"; if(["review","draft","expanding"].includes(s))return "border-amber-200 bg-amber-50 text-amber-800"; if(s==="archived")return "border-slate-200 bg-slate-100 text-slate-600"; return "border-sky-200 bg-sky-50 text-sky-800" }
export function nextStatus(s:SeoStatus):SeoStatus{ const i=statuses.indexOf(s); return statuses[Math.min(statuses.length-1,i+1)] || s }
export function isOverdue(a:SeoArticle){ return a.dueDate < todayISO() && a.status!=="published" && a.status!=="archived" }
export function articleReadiness(a:SeoArticle,tasks:SeoTask[],rules:SeoRule[]){ let n=20; if(a.primaryKeyword)n+=10; if(a.metaTitle.length>=35&&a.metaTitle.length<=65)n+=10; if(a.metaDescription.length>=90&&a.metaDescription.length<=160)n+=10; if(a.outline.length>=4)n+=10; if(a.body.length>=600)n+=10; if(a.internalLinks.length>=2)n+=10; if(a.brandScore>=75)n+=10; if(tasks.filter(t=>t.articleId===a.id&&t.status!=="done").length===0)n+=10; if(rules.filter(r=>r.active&&r.required).length>0)n+=0; return Math.max(0,Math.min(100,n)) }
export function canPublish(a:SeoArticle,tasks:SeoTask[],rules:SeoRule[]){ return a.status==="approved" && articleReadiness(a,tasks,rules)>=80 && a.seoScore>=75 && a.brandScore>=75 }

export const defaultStore: SeoStore = {
  articles: [
    { id:"seo-001", title:"Postpartum home care in Rabat: complete family guide", slug:"postpartum-home-care-rabat-guide", status:"approved", priority:"High", channel:"Homecare Guide", owner:"SEO Lead", reviewer:"Medical Brand Reviewer", cluster:"Postpartum Care", primaryKeyword:"postpartum home care Rabat", secondaryKeywords:["postnatal support Rabat","new mother care Morocco"], intent:"commercial", audience:"Families seeking trusted after-birth support", objective:"Generate qualified homecare leads", metaTitle:"Postpartum Home Care in Rabat | AngelCare Guide", metaDescription:"A practical guide for families comparing trusted postpartum home care options in Rabat, Temara and Salé.", h1:"Postpartum home care in Rabat", outline:["Who needs postpartum support","Services included","How to choose provider","AngelCare process"], body:"This editorial item is prepared as a conversion-focused SEO guide for premium family care decisions.", internalLinks:["/services/homecare","/academy"], externalLinks:[], brandScore:88, seoScore:84, readability:81, dueDate:todayISO(2), scheduledDate:todayISO(4), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), notes:"Ready for publishing after final image check.", canonicalUrl:"", wordCount:1450, impressions:3200, clicks:220, rank:8, conversions:14 },
    { id:"seo-002", title:"How clinics can refer safe homecare support", slug:"clinic-referral-homecare-support", status:"review", priority:"Critical", channel:"Partnership Article", owner:"Partnership Content", reviewer:"SEO Manager", cluster:"Clinic Partnerships", primaryKeyword:"clinic homecare referral Morocco", secondaryKeywords:["maternity clinic partnership","homecare referral"], intent:"commercial", audience:"Clinic directors and maternity partners", objective:"Build partner authority and meetings", metaTitle:"Clinic Homecare Referral Program in Morocco", metaDescription:"How maternity clinics can work with AngelCare to guide families toward reliable support after birth.", h1:"Clinic homecare referral program", outline:["Why referrals matter","Patient experience","Partnership model","Next step"], body:"Article needs stronger proof, partner positioning and CTA discipline.", internalLinks:["/partners","/services"], externalLinks:[], brandScore:72, seoScore:69, readability:78, dueDate:todayISO(-1), scheduledDate:todayISO(6), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), notes:"Needs review and stronger authority signals.", canonicalUrl:"", wordCount:980, impressions:900, clicks:42, rank:17, conversions:3 },
    { id:"seo-003", title:"Academy career path for caregivers in Morocco", slug:"academy-caregiver-career-path-morocco", status:"draft", priority:"Medium", channel:"Academy Blog", owner:"Academy Marketing", reviewer:"Brand Lead", cluster:"Academy Recruitment", primaryKeyword:"caregiver training Morocco", secondaryKeywords:["nanny training Rabat","homecare academy"], intent:"informational", audience:"Young candidates considering training and career pathways", objective:"Recruit academy candidates", metaTitle:"Caregiver Training in Morocco | AngelCare Academy", metaDescription:"Discover how AngelCare Academy helps candidates build a professional care career with training and certification.", h1:"Caregiver training in Morocco", outline:["Training path","Skills learned","Certification","Career access"], body:"Draft content prepared for academy recruitment.", internalLinks:["/academy","/careers"], externalLinks:[], brandScore:82, seoScore:76, readability:86, dueDate:todayISO(5), scheduledDate:todayISO(10), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), notes:"Add candidate FAQ section.", canonicalUrl:"", wordCount:1120, impressions:1700, clicks:98, rank:12, conversions:9 },
  ],
  tasks: [
    { id:"task-001", articleId:"seo-002", title:"Add partner proof paragraph", owner:"Partnership Content", status:"doing", dueDate:todayISO(), note:"Need stronger clinic authority." },
    { id:"task-002", articleId:"seo-001", title:"Approve hero visual", owner:"Design", status:"todo", dueDate:todayISO(1), note:"Use premium family visual." },
    { id:"task-003", articleId:"seo-003", title:"Add FAQ schema draft", owner:"SEO Lead", status:"blocked", dueDate:todayISO(2), note:"Waiting for academy answers." },
  ],
  clusters: [
    { id:"cl-001", name:"Postpartum Care", pillar:"postpartum-home-care-rabat-guide", intent:"commercial", owner:"SEO Lead", target:"Own premium family care queries in Rabat-Salé-Temara", status:"active", notes:"Priority cluster for paid + organic alignment." },
    { id:"cl-002", name:"Clinic Partnerships", pillar:"clinic-referral-homecare-support", intent:"commercial", owner:"Partnership Lead", target:"Build authority for clinic referral program", status:"planning", notes:"Needs case-study style support." },
    { id:"cl-003", name:"Academy Recruitment", pillar:"academy-caregiver-career-path-morocco", intent:"informational", owner:"Academy Marketing", target:"Recruit caregivers and trainees", status:"active", notes:"Strong FAQ potential." },
  ],
  rules: [
    { id:"rule-001", title:"No unsafe medical promises", category:"medical", required:true, active:true, description:"Avoid diagnosis, treatment guarantees or medical claims outside approved positioning." },
    { id:"rule-002", title:"Clear premium CTA", category:"conversion", required:true, active:true, description:"Every commercial article must guide the reader toward a qualified next step." },
    { id:"rule-003", title:"Morocco-local relevance", category:"editorial", required:false, active:true, description:"Use city, region and local context where useful without keyword stuffing." },
  ],
  logs: [{ id:"log-001", action:"seed", entity:"SEO Blog", detail:"Workspace initialized with AngelCare SEO examples.", at:new Date().toISOString() }],
}

export function readStore(): SeoStore { if(typeof window==="undefined") return defaultStore; try{ const raw=localStorage.getItem(SEO_STORE_KEY); return raw?JSON.parse(raw):defaultStore }catch{return defaultStore} }
export function writeStore(s:SeoStore){ if(typeof window!=="undefined") localStorage.setItem(SEO_STORE_KEY,JSON.stringify(s)) }
export function useSeoStore(){
  const [store,setStore]=React.useState<SeoStore>(defaultStore)
  const [hydrated,setHydrated]=React.useState(false)
  React.useEffect(()=>{ setStore(readStore()); setHydrated(true) },[])
  const commit=React.useCallback((fn:(draft:SeoStore)=>void, action="update", detail="Updated SEO workspace")=>{ setStore(prev=>{ const draft:SeoStore=JSON.parse(JSON.stringify(prev)); fn(draft); draft.logs=[{id:uid("log"), action, entity:"SEO Blog", detail, at:new Date().toISOString()}, ...draft.logs].slice(0,80); writeStore(draft); return draft }) },[])
  const reset=React.useCallback(()=>{ writeStore(defaultStore); setStore(defaultStore) },[])
  return { store, commit, reset, hydrated }
}

export function cx(...p:Array<string|false|null|undefined>){ return p.filter(Boolean).join(" ") }
export function Shell({children}:{children:React.ReactNode}){ return <div data-market-os-root className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(224,242,254,.8),_transparent_32%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_45%,#ffffff_100%)] text-slate-950 selection:bg-sky-200 selection:text-slate-950">{children}</div> }
export function Panel({children,className=""}:{children:React.ReactNode; className?:string}){ return <section className={cx("rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_18px_50px_-36px_rgba(15,23,42,.45)]", className)}>{children}</section> }
export function Badge({children,kind="default"}:{children:React.ReactNode; kind?:"default"|"danger"|"success"|"warning"|"dark"}){ const tone=kind==="danger"?"border-red-200 bg-red-50 text-red-700":kind==="success"?"border-emerald-200 bg-emerald-50 text-emerald-700":kind==="warning"?"border-amber-200 bg-amber-50 text-amber-700":kind==="dark"?"border-slate-900 bg-slate-950 text-white":"border-slate-200 bg-slate-50 text-slate-700"; return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]",tone)}>{children}</span> }
export function Button({children,href,onClick,kind="secondary",disabled=false,type="button",className=""}:{children:React.ReactNode; href?:string; onClick?:()=>void; kind?:"primary"|"secondary"|"danger"|"success"|"dark";disabled?:boolean;type?:"button"|"submit";className?:string}){ const cls=cx("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200",kind==="primary"&&"bg-sky-600 text-white shadow-lg shadow-sky-200/70 hover:bg-sky-700",kind==="dark"&&"bg-slate-950 text-white hover:bg-slate-800",kind==="danger"&&"bg-red-600 text-white hover:bg-red-700",kind==="success"&&"bg-emerald-600 text-white hover:bg-emerald-700",kind==="secondary"&&"border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",disabled&&"cursor-not-allowed opacity-50",className); return href?<Link href={href} className={cls}>{children}</Link>:<button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button> }
export function Field({label:fieldLabel,children,hint,required=false}:{label:string; children:React.ReactNode;hint?:string;required?:boolean}){ return <label className="block"><span className="mb-2 flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-600">{fieldLabel}{required?<span className="text-red-600">*</span>:null}</span>{children}{hint?<span className="mt-2 block text-xs font-medium leading-5 text-slate-500">{hint}</span>:null}</label> }
export const inputClass="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
export function Meter({value,tone="sky"}:{value:number;tone?:"sky"|"emerald"|"amber"|"red"}){ const color={sky:"bg-sky-600",emerald:"bg-emerald-600",amber:"bg-amber-500",red:"bg-red-600"}[tone]; return <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><div className={cx("h-full rounded-full transition-all",color)} style={{width:pct(value)}} /></div> }
export function Metric({label:metricLabel,value,sub,tone="sky",icon:Icon}:{label:string; value:string; sub:string; tone?:"sky"|"emerald"|"amber"|"red"|"slate";icon?:React.ComponentType<{className?:string}>}){ const bg={sky:"bg-sky-50 text-sky-700",emerald:"bg-emerald-50 text-emerald-700",amber:"bg-amber-50 text-amber-700",red:"bg-red-50 text-red-700",slate:"bg-slate-100 text-slate-700"}[tone]; return <Panel className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{metricLabel}</p><p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p></div>{Icon?<div className={cx("rounded-2xl p-3",bg)}><Icon className="h-5 w-5"/></div>:null}</div><p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{sub}</p></Panel> }

export function StateBadge({status}:{status:string}){ return <span className={cx("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em]",statusTone(status))}>{label(status)}</span> }
export function PriorityBadge({priority}:{priority:SeoPriority}){ return <Badge kind={priority==="Critical"?"danger":priority==="High"?"warning":"default"}>{priority}</Badge> }
export function ScorePill({label:scoreLabel,value}:{label:string;value:number}){ return <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold",scoreTone(value))}><span>{scoreLabel}</span><span>{Math.round(value)}</span></span> }

export function WorkspaceTruthNotice(){ return <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-sky-950 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><Database className="mt-0.5 h-5 w-5 shrink-0 text-sky-700"/><div><p className="font-extrabold">Espace de travail enregistré dans ce navigateur</p><p className="mt-1 text-xs font-medium leading-5 text-sky-800">Les données affichées proviennent du stockage actuel du module. Aucune synchronisation externe n’est affirmée.</p></div></div><Badge>Traçabilité locale</Badge></div> }
export function EmptyState({title,description,action}:{title:string;description:string;action?:React.ReactNode}){ return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm"><FileText className="h-6 w-6"/></div><h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">{description}</p>{action?<div className="mt-5 flex justify-center">{action}</div>:null}</div> }
export function GateLine({ok,label:gateLabel,detail}:{ok:boolean;label:string;detail:string}){ return <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3"><div className={cx("mt-0.5 rounded-full p-1",ok?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600")}>{ok?<CheckCircle2 className="h-4 w-4"/>:<AlertTriangle className="h-4 w-4"/>}</div><div><p className="text-sm font-extrabold text-slate-900">{gateLabel}</p><p className="mt-1 text-xs font-medium leading-5 text-slate-500">{detail}</p></div></div> }

export function ArticleRow({article,tasks,onAdvance,onArchive,onDelete}:{article:SeoArticle; tasks:SeoTask[]; onAdvance:()=>void; onArchive:()=>void; onDelete:()=>void}){ const open=tasks.filter(t=>t.articleId===article.id&&t.status!=="done").length; return <article className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-200 hover:shadow-lg hover:shadow-slate-200/60"><div className="grid gap-5 xl:grid-cols-[minmax(260px,1.4fr)_minmax(170px,.7fr)_minmax(130px,.55fr)_minmax(120px,.45fr)_auto] xl:items-center"><div><div className="flex flex-wrap items-center gap-2"><StateBadge status={article.status}/><PriorityBadge priority={article.priority}/>{open>0?<Badge kind={open>1?"warning":"default"}>{open} tâche{open>1?"s":""}</Badge>:<Badge kind="success">Sans blocage</Badge>}</div><Link href={`/market-os/seo-blog-workspace/${article.id}`} className="mt-3 block text-base font-black leading-6 text-slate-950 transition group-hover:text-sky-700">{article.title}</Link><p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{article.channel} · {article.owner} · {article.primaryKeyword||"Mot-clé à définir"}</p></div><div><div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500"><span>Préparation</span><span>{article.seoScore}% SEO</span></div><div className="mt-2 space-y-2"><Meter value={article.seoScore}/><Meter value={article.brandScore} tone={article.brandScore>=75?"emerald":"amber"}/></div></div><div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Performance enregistrée</p><p className="mt-2 text-sm font-black text-slate-900">Position #{article.rank}</p><p className="mt-1 text-xs font-semibold text-slate-500">{compactNumber(article.clicks)} clics · {compactNumber(article.impressions)} impr.</p></div><div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Échéance</p><p className="mt-2 text-sm font-black text-slate-900">{formatDate(article.dueDate)}</p><p className="mt-1 text-xs font-semibold text-slate-500">{article.reviewer}</p></div><div className="flex flex-wrap items-center gap-2 xl:justify-end"><Button href={`/market-os/seo-blog-workspace/${article.id}`}>Ouvrir <ChevronRight className="h-4 w-4"/></Button><Button href={`/market-os/seo-blog-workspace/${article.id}/edit`}>Modifier</Button><Button onClick={onAdvance} kind="dark">Étape suivante <ArrowRight className="h-4 w-4"/></Button><details className="relative"><summary className="flex min-h-11 cursor-pointer list-none items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-800 hover:bg-slate-50">Plus</summary><div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"><button onClick={onArchive} className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">Archiver</button><button onClick={onDelete} className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50">Supprimer</button></div></details></div></div></article> }

export const workspaceNavigation = [
  {href:"/market-os/seo-blog-workspace",label:"Centre de commande"},
  {href:"/market-os/seo-blog-workspace/calendar",label:"Calendrier"},
  {href:"/market-os/seo-blog-workspace/review",label:"Validation"},
  {href:"/market-os/seo-blog-workspace/publishing",label:"Publication"},
  {href:"/market-os/seo-blog-workspace/optimizer",label:"Optimisation"},
  {href:"/market-os/seo-blog-workspace/topic-clusters",label:"Clusters"},
  {href:"/market-os/seo-blog-workspace/linking",label:"Maillage"},
  {href:"/market-os/seo-blog-workspace/brand-governance",label:"Gouvernance"},
  {href:"/market-os/seo-blog-workspace/analytics",label:"Performance"},
]

export function WorkspaceNav({active=""}:{active?:string}){ return <nav aria-label="Navigation SEO Blog" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><div className="flex min-w-max gap-1">{workspaceNavigation.map(item=><Link key={item.href} href={item.href} className={cx("rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition",active===item.href?"bg-slate-950 text-white":"text-slate-600 hover:bg-slate-50 hover:text-slate-950")}>{item.label}</Link>)}</div></nav> }

export function PageIntro({eyebrow,title,description,actions,meta}:{eyebrow:string;title:string;description:string;actions?:React.ReactNode;meta?:React.ReactNode}){ return <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_-46px_rgba(15,23,42,.55)]"><div className="relative p-6 lg:p-8"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-sky-600 to-emerald-500"/><div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2"><Badge kind="dark">ANGELCARE Market OS</Badge><Badge>{eyebrow}</Badge></div><h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-slate-950 md:text-5xl">{title}</h1><p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 md:text-base">{description}</p>{meta?<div className="mt-5">{meta}</div>:null}</div>{actions?<div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">{actions}</div>:null}</div></div></header> }

export function OperationalSignal({type,title,description,href}:{type:"critical"|"warning"|"success"|"info";title:string;description:string;href:string}){ const tone={critical:"border-red-200 bg-red-50 text-red-800",warning:"border-amber-200 bg-amber-50 text-amber-800",success:"border-emerald-200 bg-emerald-50 text-emerald-800",info:"border-sky-200 bg-sky-50 text-sky-800"}[type]; const Icon=type==="critical"?AlertTriangle:type==="warning"?Clock3:type==="success"?CheckCircle2:ShieldCheck; return <Link href={href} className={cx("group flex gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md",tone)}><Icon className="mt-0.5 h-5 w-5 shrink-0"/><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs font-semibold leading-5 opacity-80">{description}</p></div><ChevronRight className="ml-auto h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"/></Link> }
