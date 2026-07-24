"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FilePlus2,
  FileSearch,
  Filter,
  Gauge,
  LayoutDashboard,
  ListFilter,
  Network,
  PenLine,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users2,
} from "lucide-react"
import {
  ArticleRow,
  Badge,
  Button,
  EmptyState,
  Meter,
  Metric,
  OperationalSignal,
  PageIntro,
  Panel,
  PriorityBadge,
  ScorePill,
  Shell,
  StateBadge,
  WorkspaceNav,
  WorkspaceTruthNotice,
  articleReadiness,
  canPublish,
  channels,
  compactNumber,
  cx,
  formatDate,
  formatDateTime,
  inputClass,
  isOverdue,
  label,
  nextStatus,
  statuses,
  useSeoStore,
  type SeoArticle,
  type SeoStore,
} from "./seo-blog/seo-blog-system"

type View = "command" | "pipeline" | "table" | "calendar" | "intelligence"
type Focus = "all" | "urgent" | "review" | "publishing" | "brand" | "growth"

const viewOptions: Array<{id:View;label:string;icon:React.ComponentType<{className?:string}>}> = [
  {id:"command",label:"Commandement",icon:LayoutDashboard},
  {id:"pipeline",label:"Pipeline",icon:CircleDot},
  {id:"table",label:"Inventaire",icon:ListFilter},
  {id:"calendar",label:"Calendrier",icon:CalendarDays},
  {id:"intelligence",label:"Intelligence",icon:Sparkles},
]

const gateways = [
  {href:"/market-os/seo-blog-workspace/create",label:"Créer un article",desc:"Transformer une intention de recherche en brief éditorial pilotable.",icon:FilePlus2,tone:"bg-sky-50 text-sky-700"},
  {href:"/market-os/seo-blog-workspace/review",label:"Piloter la validation",desc:"Arbitrer les contenus en rédaction ou en contrôle qualité.",icon:BookOpenCheck,tone:"bg-amber-50 text-amber-700"},
  {href:"/market-os/seo-blog-workspace/publishing",label:"Préparer la publication",desc:"Contrôler les seuils, la programmation et le statut éditorial.",icon:CheckCircle2,tone:"bg-emerald-50 text-emerald-700"},
  {href:"/market-os/seo-blog-workspace/optimizer",label:"Renforcer la qualité",desc:"Identifier les écarts SEO, marque et lisibilité déjà enregistrés.",icon:Gauge,tone:"bg-violet-50 text-violet-700"},
  {href:"/market-os/seo-blog-workspace/topic-clusters",label:"Déployer les clusters",desc:"Structurer les piliers et la couverture organique par intention.",icon:Network,tone:"bg-cyan-50 text-cyan-700"},
  {href:"/market-os/seo-blog-workspace/analytics",label:"Lire la performance",desc:"Comparer les positions, clics, impressions et conversions enregistrés.",icon:BarChart3,tone:"bg-slate-100 text-slate-700"},
]

function SectionHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description?:string;action?:React.ReactNode}){
  return <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950">{title}</h2>{description?<p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>:null}</div>{action?<div className="flex flex-wrap gap-2">{action}</div>:null}</div>
}

function FilterBar({query,setQuery,status,setStatus,channel,setChannel,focus,setFocus,view,setView}:{query:string;setQuery:(v:string)=>void;status:string;setStatus:(v:string)=>void;channel:string;setChannel:(v:string)=>void;focus:Focus;setFocus:(v:Focus)=>void;view:View;setView:(v:View)=>void}){
  return <Panel className="p-4 lg:p-5"><div className="flex flex-col gap-4"><div className="grid gap-3 lg:grid-cols-[minmax(260px,1.3fr)_repeat(3,minmax(170px,.55fr))]"><label className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(e:any)=>setQuery(e.target.value)} className={cx(inputClass,"pl-11")} placeholder="Rechercher un article, mot-clé, cluster, responsable…" aria-label="Rechercher"/></label><label className="relative"><Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><select value={status} onChange={(e:any)=>setStatus(e.target.value)} className={cx(inputClass,"pl-11")} aria-label="Filtrer par statut"><option value="all">Tous les statuts</option>{[...statuses,"archived"].map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label><select value={channel} onChange={(e:any)=>setChannel(e.target.value)} className={inputClass} aria-label="Filtrer par canal"><option value="all">Tous les canaux</option>{channels.map(c=><option key={c} value={c}>{c}</option>)}</select><select value={focus} onChange={(e:any)=>setFocus(e.target.value as Focus)} className={inputClass} aria-label="Filtrer par priorité opérationnelle"><option value="all">Toutes les priorités</option><option value="urgent">Urgences</option><option value="review">Validation</option><option value="publishing">Publication</option><option value="brand">Risque marque</option><option value="growth">Potentiel organique</option></select></div><div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4" role="tablist" aria-label="Mode d’affichage">{viewOptions.map(option=>{const Icon=option.icon;return <button key={option.id} onClick={()=>setView(option.id)} className={cx("inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition",view===option.id?"bg-slate-950 text-white":"bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><Icon className="h-4 w-4"/>{option.label}</button>})}</div></div></Panel>
}

function ExecutiveSignals({store}:{store:SeoStore}){
  const overdue=store.articles.filter(isOverdue)
  const review=store.articles.filter(a=>["draft","review"].includes(a.status))
  const ready=store.articles.filter(a=>canPublish(a,store.tasks,store.rules))
  const blocked=store.tasks.filter(t=>t.status==="blocked")
  const weakBrand=store.articles.filter(a=>a.brandScore<75)
  return <Panel className="p-5"><SectionHeading eyebrow="Priorités opérationnelles" title="Ce qui exige une décision maintenant" description="Une lecture immédiate des risques, files d’attente et opportunités réellement présentes dans l’espace de travail."/><div className="mt-5 grid gap-3 md:grid-cols-2">{overdue.length?<OperationalSignal type="critical" title={`${overdue.length} contenu${overdue.length>1?"s":""} en retard`} description="Les échéances sont dépassées et le contenu n’est ni publié ni archivé." href="/market-os/seo-blog-workspace?focus=urgent"/>:<OperationalSignal type="success" title="Aucun retard éditorial" description="Les échéances enregistrées sont actuellement maîtrisées." href="/market-os/seo-blog-workspace/calendar"/>}{review.length?<OperationalSignal type="warning" title={`${review.length} contenu${review.length>1?"s":""} à arbitrer`} description="Les brouillons et contenus en validation attendent une décision éditoriale." href="/market-os/seo-blog-workspace/review"/>:<OperationalSignal type="success" title="File de validation maîtrisée" description="Aucun brouillon ou contenu en validation n’attend actuellement." href="/market-os/seo-blog-workspace/review"/>}{ready.length?<OperationalSignal type="success" title={`${ready.length} article${ready.length>1?"s":""} conforme${ready.length>1?"s":""} au seuil`} description="Les conditions de préparation actuelles permettent d’avancer vers la publication." href="/market-os/seo-blog-workspace/publishing"/>:<OperationalSignal type="info" title="Aucun article au seuil complet" description="Consultez les diagnostics avant de programmer la prochaine publication." href="/market-os/seo-blog-workspace/optimizer"/>}{blocked.length?<OperationalSignal type="critical" title={`${blocked.length} tâche${blocked.length>1?"s":""} bloquée${blocked.length>1?"s":""}`} description={blocked[0]?.note||"Une dépendance empêche l’avancement éditorial."} href={blocked[0]?`/market-os/seo-blog-workspace/${blocked[0].articleId}`:"/market-os/seo-blog-workspace"}/>:weakBrand.length?<OperationalSignal type="warning" title={`${weakBrand.length} contenu${weakBrand.length>1?"s":""} sous le seuil marque`} description="Une vérification de la gouvernance et du positionnement est recommandée." href="/market-os/seo-blog-workspace/brand-governance"/>:<OperationalSignal type="success" title="Gouvernance de marque maîtrisée" description="Aucun article n’est sous le seuil de marque de référence." href="/market-os/seo-blog-workspace/brand-governance"/>}</div></Panel>
}

function GatewayGrid(){
  return <Panel className="p-5"><SectionHeading eyebrow="Accès métier" title="Passer directement à l’action" description="Chaque espace correspond à une responsabilité précise du cycle organique ANGELCARE."/><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{gateways.map(g=>{const Icon=g.icon;return <Link key={g.href} href={g.href} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-slate-200/60"><div className="flex items-start justify-between gap-4"><div className={cx("rounded-2xl p-3",g.tone)}><Icon className="h-5 w-5"/></div><ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-600"/></div><h3 className="mt-4 text-base font-black text-slate-950">{g.label}</h3><p className="mt-2 text-xs font-medium leading-5 text-slate-500">{g.desc}</p></Link>})}</div></Panel>
}

function PipelineBoard({items,store,onAdvance,onArchive}:{items:SeoArticle[];store:SeoStore;onAdvance:(id:string)=>void;onArchive:(id:string)=>void}){
  return <Panel className="p-5"><SectionHeading eyebrow="Chaîne éditoriale" title="De l’intention à la publication" description="Les colonnes utilisent les statuts existants. Chaque action conserve sa conséquence actuelle." action={<Button href="/market-os/seo-blog-workspace/create" kind="primary"><FilePlus2 className="h-4 w-4"/> Nouvel article</Button>}/><div className="mt-5 overflow-x-auto pb-2"><div className="grid min-w-[1500px] grid-cols-7 gap-3">{statuses.map(status=>{const list=items.filter(a=>a.status===status);return <section key={status} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-950">{label(status)}</p><p className="mt-1 text-[11px] font-bold text-slate-500">{list.length} élément{list.length>1?"s":""}</p></div><Badge>{list.length}</Badge></div><div className="mt-3 space-y-3">{list.slice(0,5).map(article=>{const readiness=articleReadiness(article,store.tasks,store.rules);return <article key={article.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex flex-wrap gap-1.5"><PriorityBadge priority={article.priority}/>{isOverdue(article)?<Badge kind="danger">En retard</Badge>:null}</div><Link href={`/market-os/seo-blog-workspace/${article.id}`} className="mt-3 block text-sm font-black leading-5 text-slate-950 hover:text-sky-700">{article.title}</Link><p className="mt-2 line-clamp-1 text-[11px] font-semibold text-slate-500">{article.primaryKeyword||"Mot-clé à définir"}</p><div className="mt-3"><div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500"><span>Préparation</span><span>{readiness}%</span></div><Meter value={readiness} tone={readiness>=80?"emerald":readiness>=60?"amber":"red"}/></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={()=>onAdvance(article.id)} className="rounded-xl bg-slate-950 px-3 py-2 text-[11px] font-extrabold text-white">Avancer</button><Link href={`/market-os/seo-blog-workspace/${article.id}/edit`} className="rounded-xl border border-slate-200 px-3 py-2 text-center text-[11px] font-extrabold text-slate-700">Modifier</Link></div><button onClick={()=>onArchive(article.id)} className="mt-2 w-full rounded-xl px-3 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50">Archiver</button></article>})}{list.length===0?<div className="rounded-2xl border border-dashed border-slate-300 px-3 py-8 text-center text-xs font-semibold text-slate-400">Aucun contenu dans cette étape.</div>:null}</div></section>})}</div></div></Panel>
}

function PerformanceSnapshot({store}:{store:SeoStore}){
  const totals=store.articles.reduce((acc,a)=>({impressions:acc.impressions+a.impressions,clicks:acc.clicks+a.clicks,conversions:acc.conversions+a.conversions}),{impressions:0,clicks:0,conversions:0})
  const maxClicks=Math.max(1,...store.articles.map(a=>a.clicks))
  return <Panel className="p-5"><SectionHeading eyebrow="Performance enregistrée" title="Contribution organique du portefeuille" description="Ces valeurs proviennent des champs actuellement enregistrés dans le workspace, sans prétendre à une synchronisation externe." action={<Button href="/market-os/seo-blog-workspace/analytics">Analyse détaillée <ArrowRight className="h-4 w-4"/></Button>}/><div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Impressions</p><p className="mt-2 text-2xl font-black">{compactNumber(totals.impressions)}</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Clics</p><p className="mt-2 text-2xl font-black text-slate-950">{compactNumber(totals.clicks)}</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Conversions</p><p className="mt-2 text-2xl font-black text-slate-950">{compactNumber(totals.conversions)}</p></div></div><div className="mt-5 space-y-4">{[...store.articles].sort((a,b)=>b.clicks-a.clicks).slice(0,5).map(article=><div key={article.id}><div className="flex items-center justify-between gap-4 text-xs"><Link href={`/market-os/seo-blog-workspace/${article.id}`} className="truncate font-extrabold text-slate-800 hover:text-sky-700">{article.title}</Link><span className="shrink-0 font-black text-slate-500">{article.clicks} clics</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-600" style={{width:`${Math.max(7,(article.clicks/maxClicks)*100)}%`}}/></div></div>)}</div></Panel>
}

function CalendarPreview({items}:{items:SeoArticle[]}){
  const now=new Date(); const year=now.getFullYear(); const month=now.getMonth(); const first=(new Date(year,month,1).getDay()+6)%7; const days=new Date(year,month+1,0).getDate(); const cells=Array.from({length:42},(_,index)=>{const day=index-first+1;const date=new Date(year,month,day);return {index,day,inMonth:day>=1&&day<=days,iso:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}})
  return <Panel className="p-5"><SectionHeading eyebrow="Cadence éditoriale" title={new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric"}).format(now)} description="Aperçu des dates de programmation existantes." action={<Button href="/market-os/seo-blog-workspace/calendar">Ouvrir le calendrier <CalendarDays className="h-4 w-4"/></Button>}/><div className="mt-5 grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(day=><div key={day} className="py-2">{day}</div>)}</div><div className="grid grid-cols-7 gap-1">{cells.map(cell=>{const list=items.filter(a=>a.scheduledDate===cell.iso);return <div key={cell.index} className={cx("min-h-20 rounded-xl border p-2",cell.inMonth?"border-slate-200 bg-white":"border-transparent bg-slate-50/50 text-slate-300")}><p className="text-[10px] font-black">{cell.inMonth?cell.day:""}</p>{list.slice(0,2).map(article=><Link key={article.id} href={`/market-os/seo-blog-workspace/${article.id}`} className="mt-1 block truncate rounded-md bg-sky-50 px-1.5 py-1 text-[9px] font-bold text-sky-800">{article.title}</Link>)}</div>})}</div></Panel>
}

function ClusterSnapshot({store}:{store:SeoStore}){
  return <Panel className="p-5"><SectionHeading eyebrow="Architecture organique" title="Clusters prioritaires" description="Piliers, propriétaires et objectifs enregistrés dans la stratégie éditoriale." action={<Button href="/market-os/seo-blog-workspace/topic-clusters">Gérer les clusters <Network className="h-4 w-4"/></Button>}/><div className="mt-5 space-y-3">{store.clusters.map(cluster=>{const coverage=store.articles.filter(a=>a.cluster===cluster.name).length;return <Link key={cluster.id} href="/market-os/seo-blog-workspace/topic-clusters" className="group block rounded-2xl border border-slate-200 p-4 transition hover:border-sky-200 hover:bg-sky-50/30"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><StateBadge status={cluster.status}/><Badge>{label(cluster.intent)}</Badge></div><h3 className="mt-3 font-black text-slate-950 group-hover:text-sky-700">{cluster.name}</h3><p className="mt-1 text-xs font-medium leading-5 text-slate-500">{cluster.target}</p></div><div className="shrink-0 text-right"><p className="text-2xl font-black text-slate-950">{coverage}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">article{coverage>1?"s":""}</p></div></div></Link>})}</div></Panel>
}

function IntelligenceView({store}:{store:SeoStore}){
  const articles=store.articles.map(article=>({article,readiness:articleReadiness(article,store.tasks,store.rules),openTasks:store.tasks.filter(t=>t.articleId===article.id&&t.status!=="done").length})).sort((a,b)=>a.readiness-b.readiness)
  return <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><Panel className="p-5"><SectionHeading eyebrow="Diagnostic du portefeuille" title="Contenus à renforcer en priorité" description="Classement fondé exclusivement sur les scores, tâches et exigences déjà enregistrés."/><div className="mt-5 space-y-3">{articles.map(({article,readiness,openTasks})=><Link key={article.id} href={`/market-os/seo-blog-workspace/${article.id}`} className="block rounded-2xl border border-slate-200 p-4 transition hover:border-sky-200 hover:bg-sky-50/30"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap gap-2"><StateBadge status={article.status}/><PriorityBadge priority={article.priority}/>{openTasks?<Badge kind="warning">{openTasks} tâche{openTasks>1?"s":""}</Badge>:null}</div><h3 className="mt-3 font-black text-slate-950">{article.title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{article.primaryKeyword}</p></div><div className="flex flex-wrap gap-2"><ScorePill label="SEO" value={article.seoScore}/><ScorePill label="Marque" value={article.brandScore}/><ScorePill label="Prêt" value={readiness}/></div></div></Link>)}</div></Panel><div className="space-y-5"><ExecutiveSignals store={store}/><ClusterSnapshot store={store}/></div></div>
}

export default function SeoBlogWorkspace(){
  const {store,commit,reset}=useSeoStore()
  const [query,setQuery]=React.useState("")
  const [status,setStatus]=React.useState("all")
  const [channel,setChannel]=React.useState("all")
  const [view,setView]=React.useState<View>("command")
  const [focus,setFocus]=React.useState<Focus>("all")

  const filtered=React.useMemo(()=>store.articles.filter(article=>{
    const haystack=`${article.title} ${article.primaryKeyword} ${article.secondaryKeywords.join(" ")} ${article.cluster} ${article.owner} ${article.reviewer} ${article.audience} ${article.channel}`.toLowerCase()
    const matchesQuery=!query||haystack.includes(query.toLowerCase())
    const matchesStatus=status==="all"||article.status===status
    const matchesChannel=channel==="all"||article.channel===channel
    const matchesFocus=focus==="all"||(focus==="urgent"&&(isOverdue(article)||article.priority==="Critical"))||(focus==="review"&&["review","draft"].includes(article.status))||(focus==="publishing"&&["approved","scheduled"].includes(article.status))||(focus==="brand"&&article.brandScore<80)||(focus==="growth"&&(article.rank>10||article.clicks<100))
    return matchesQuery&&matchesStatus&&matchesChannel&&matchesFocus
  }),[store.articles,query,status,channel,focus])

  const overdue=store.articles.filter(isOverdue)
  const review=store.articles.filter(a=>["review","draft"].includes(a.status))
  const ready=store.articles.filter(a=>canPublish(a,store.tasks,store.rules))
  const blocked=store.tasks.filter(t=>t.status==="blocked")
  const averageSeo=store.articles.length?Math.round(store.articles.reduce((sum,a)=>sum+a.seoScore,0)/store.articles.length):0

  const advance=React.useCallback((id:string)=>commit(d=>{d.articles=d.articles.map(a=>a.id===id?{...a,status:nextStatus(a.status),updatedAt:new Date().toISOString()}:a)},"advance",`Advanced article ${id}`),[commit])
  const archive=React.useCallback((id:string)=>commit(d=>{d.articles=d.articles.map(a=>a.id===id?{...a,status:"archived",updatedAt:new Date().toISOString()}:a)},"archive",`Archived article ${id}`),[commit])
  const remove=React.useCallback((id:string)=>commit(d=>{d.articles=d.articles.filter(a=>a.id!==id);d.tasks=d.tasks.filter(t=>t.articleId!==id)},"delete",`Deleted article ${id}`),[commit])

  return <Shell><main className="mx-auto max-w-[1880px] space-y-5 p-4 lg:p-7 xl:p-8"><PageIntro eyebrow="Organic Growth & Editorial Command" title="Centre de commande SEO & contenu" description="Pilotez la stratégie organique ANGELCARE, la production éditoriale, la gouvernance de marque et la préparation à la publication depuis une expérience institutionnelle unique." meta={<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600"/> Gouvernance active</span><span className="inline-flex items-center gap-2"><Users2 className="h-4 w-4 text-sky-600"/> {new Set(store.articles.map(a=>a.owner)).size} responsables</span><span className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-violet-600"/> Dernière opération {formatDateTime(store.logs[0]?.at)}</span></div>} actions={<><Button href="/market-os/seo-blog-workspace/create" kind="primary"><PenLine className="h-4 w-4"/> Créer un article</Button><Button href="/market-os/seo-blog-workspace/review"><BookOpenCheck className="h-4 w-4"/> File de validation</Button><Button href="/market-os/seo-blog-workspace/calendar"><CalendarDays className="h-4 w-4"/> Calendrier</Button><Button onClick={reset}><RefreshCcw className="h-4 w-4"/> Réinitialiser</Button></>}/><WorkspaceNav active="/market-os/seo-blog-workspace"/><WorkspaceTruthNotice/><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric label="Portefeuille" value={String(store.articles.length)} sub="Articles enregistrés" tone="slate" icon={FileSearch}/><Metric label="Retards" value={String(overdue.length)} sub="Échéances à reprendre" tone={overdue.length?"red":"emerald"} icon={AlertTriangle}/><Metric label="Validation" value={String(review.length)} sub="Décisions éditoriales" tone="amber" icon={BookOpenCheck}/><Metric label="Au seuil" value={String(ready.length)} sub="Préparation complète" tone="emerald" icon={CheckCircle2}/><Metric label="Score SEO" value={`${averageSeo}%`} sub="Moyenne du portefeuille" tone="sky" icon={Gauge}/><Metric label="Blocages" value={String(blocked.length)} sub="Tâches empêchées" tone={blocked.length?"red":"slate"} icon={Clock3}/></section><FilterBar query={query} setQuery={setQuery} status={status} setStatus={setStatus} channel={channel} setChannel={setChannel} focus={focus} setFocus={setFocus} view={view} setView={setView}/>{view==="command"?<><div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><ExecutiveSignals store={store}/><GatewayGrid/></div><PipelineBoard items={filtered} store={store} onAdvance={advance} onArchive={archive}/><div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><PerformanceSnapshot store={store}/><ClusterSnapshot store={store}/></div><CalendarPreview items={filtered}/></>:null}{view==="pipeline"?<PipelineBoard items={filtered} store={store} onAdvance={advance} onArchive={archive}/>:null}{view==="calendar"?<CalendarPreview items={filtered}/>:null}{view==="intelligence"?<IntelligenceView store={store}/>:null}{view==="table"||view==="command"?<Panel className="p-5"><SectionHeading eyebrow="Portefeuille éditorial" title="Inventaire de production" description="Recherche, scores, échéances et actions sur les articles correspondant aux filtres actifs." action={<div className="flex items-center gap-2"><Badge>{filtered.length} résultat{filtered.length>1?"s":""}</Badge><Button href="/market-os/seo-blog-workspace/create" kind="primary"><FilePlus2 className="h-4 w-4"/> Créer</Button></div>}/><div className="mt-5 space-y-3">{filtered.map(article=><ArticleRow key={article.id} article={article} tasks={store.tasks} onAdvance={()=>advance(article.id)} onArchive={()=>archive(article.id)} onDelete={()=>remove(article.id)}/>)}{filtered.length===0?<EmptyState title="Aucun article ne correspond à cette vue" description="Modifiez les filtres ou créez une nouvelle initiative éditoriale pour alimenter le portefeuille." action={<Button href="/market-os/seo-blog-workspace/create" kind="primary"><FilePlus2 className="h-4 w-4"/> Créer un article</Button>}/>:null}</div></Panel>:null}<Panel className="p-5"><SectionHeading eyebrow="Traçabilité" title="Dernières opérations" description="Historique des actions enregistrées par le store actuel du module."/><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{store.logs.slice(0,8).map(log=><div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><div className="flex items-center justify-between gap-3"><Badge>{log.action}</Badge><span className="text-[10px] font-bold text-slate-400">{formatDateTime(log.at)}</span></div><p className="mt-3 text-sm font-black text-slate-950">{log.entity}</p><p className="mt-1 text-xs font-medium leading-5 text-slate-500">{log.detail}</p></div>)}</div></Panel></main></Shell>
}
