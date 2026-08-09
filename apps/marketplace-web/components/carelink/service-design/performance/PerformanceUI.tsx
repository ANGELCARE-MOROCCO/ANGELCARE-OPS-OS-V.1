import type{ReactNode}from'react'
import{AlertTriangle,ArrowRight,BarChart3,CheckCircle2,CircleGauge,Clock3,FileCheck2,HeartHandshake,Layers3,ShieldCheck,Sparkles,Target,TriangleAlert}from'lucide-react'
import type{PerformanceDashboard,Severity}from '@/types/homeservice-performance'
import{Badge,EmptyState,MetricCard,Panel,ProgressBar,WarningBanner,WorkspaceTitle,cx}from'../DesignSystem'
export{Badge,EmptyState,MetricCard,Panel,ProgressBar,WarningBanner,WorkspaceTitle}
const severityTone=(s:string)=>s==='critical'||s==='blocking'?'rose':s==='material'||s==='warning'?'amber':s==='opportunity'?'violet':'slate'
export function StatDeck({data}:{data:PerformanceDashboard}){
 const openCases=data.cases.filter(x=>!['resolved','closed'].includes(x.status)).length
 const critical=data.qualitySignals.filter(x=>['critical','blocking'].includes(x.severity)).length
 const readiness=data.readinessControls.filter(x=>x.status==='passed').length
 const unhealthy=data.healthChecks.filter(x=>x.state!=='healthy').length
 return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <MetricCard label="Cas CX ouverts" value={openCases} detail="Dossiers non résolus, attribuables à une mission et une version service." tone={openCases?'amber':'emerald'} icon={<HeartHandshake size={18}/>}/>
  <MetricCard label="Signaux critiques" value={critical} detail="Risques qualité nécessitant une autorité humaine explicite." tone={critical?'rose':'emerald'} icon={<TriangleAlert size={18}/>}/>
  <MetricCard label="Readiness" value={`${readiness}/${data.readinessControls.length||24}`} detail="Contrôles probants de mise en production." tone={readiness===24?'emerald':'blue'} icon={<FileCheck2 size={18}/>}/>
  <MetricCard label="Santé dégradée" value={unhealthy} detail="Contrôles vérifiés hors état nominal." tone={unhealthy?'rose':'emerald'} icon={<CircleGauge size={18}/>}/>
 </div>
}
export function SignalList({data,limit=6}:{data:PerformanceDashboard;limit?:number}){
 const items=data.qualitySignals.slice(0,limit)
 return items.length?<div className="space-y-3">{items.map(x=><article key={x.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-slate-950">{x.title}</p><p className="mt-1 text-xs font-semibold text-slate-500">{x.code} · {x.signalType}</p></div><Badge tone={severityTone(x.severity) as any}>{x.severity}</Badge></div>
  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{x.summary||'Aucune synthèse validée.'}</p>
 </article>)}</div>:<EmptyState title="Aucun signal qualité" detail="Les signaux apparaîtront depuis les missions, retours clients, variances et décisions humaines."/>
}
export function CaseList({data,limit=6}:{data:PerformanceDashboard;limit?:number}){
 const items=data.cases.slice(0,limit)
 return items.length?<div className="space-y-3">{items.map(x=><article key={x.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"><div><p className="font-black text-slate-950">{x.code} · {x.caseType}</p><p className="mt-1 text-xs font-semibold text-slate-500">{x.summary||'Dossier en instruction.'}</p></div><div className="flex items-center gap-2"><Badge tone={severityTone(x.severity) as any}>{x.severity}</Badge><Badge tone={x.status==='closed'?'emerald':'blue'}>{x.status}</Badge></div></article>)}</div>:<EmptyState title="Aucun dossier CX" detail="Aucune expérience négative ou action de récupération n’est enregistrée."/>
}
export function HealthMatrix({data}:{data:PerformanceDashboard}){
 const items=data.healthChecks
 return items.length?<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(x=><article key={x.id} className={cx('rounded-2xl border p-4',x.state==='healthy'?'border-emerald-200 bg-emerald-50/50':x.state==='unknown'?'border-slate-200 bg-slate-50':'border-amber-200 bg-amber-50')}>
  <div className="flex items-center justify-between gap-3"><p className="font-black text-slate-900">{x.label}</p>{x.state==='healthy'?<CheckCircle2 className="text-emerald-600" size={18}/>:<AlertTriangle className="text-amber-600" size={18}/>}</div>
  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{x.detail||'Aucune preuve récente.'}</p><p className="mt-3 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">{x.verified?'Preuve vérifiée':'Preuve requise'}</p>
 </article>)}</div>:<EmptyState title="Santé non mesurée" detail="Les contrôles opérationnels seront visibles après la migration et la première campagne de vérification."/>
}
export function ReadinessRail({data}:{data:PerformanceDashboard}){
 const total=data.readinessControls.length||24,passed=data.readinessControls.filter(x=>x.status==='passed').length
 return <div className="space-y-5"><ProgressBar value={Math.round(passed/total*100)} tone={passed===total?'emerald':'blue'} label="Production readiness"/>
  <div className="grid gap-2">{data.readinessControls.slice(0,12).map(x=><div key={x.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"><span>{x.label}</span><Badge tone={x.status==='passed'?'emerald':x.status==='failed'||x.status==='blocked'?'rose':'amber'}>{x.status}</Badge></div>)}</div>
  {!data.readinessControls.length?<EmptyState title="24 contrôles attendus" detail="La migration UMZ5 initialise le registre probant de mise en production."/>:null}
 </div>
}
export type WorkspaceVariant='theatre'|'observatory'|'command'|'chamber'|'studio'|'board'|'control'|'registry'|'timeline'|'matrix'|'document'
export function PerformanceWorkspace({data,eyebrow,title,description,variant,primary,secondary,aside}:{data:PerformanceDashboard;eyebrow:string;title:string;description:string;variant:WorkspaceVariant;primary:ReactNode;secondary?:ReactNode;aside?:ReactNode}){
 const heroTone=variant==='theatre'||variant==='command'?'navy':variant==='chamber'||variant==='control'?'violet':'blue'
 return <div className="space-y-6">
  <WorkspaceTitle eyebrow={eyebrow} title={title} description={description} tone={heroTone as any} actions={<><Badge tone="emerald">CARELINK souverain</Badge><Badge tone={data.provider.configured?'blue':'amber'}>OpenRouter Free · {data.provider.configured?'connecté':'non configuré'}</Badge></>}/>
  {variant==='theatre'||variant==='command'?<StatDeck data={data}/>:null}
  {variant==='observatory'?<div className="grid gap-4 lg:grid-cols-3"><MetricCard label="Sources" value={data.variances.length} detail="Écarts déterministes issus de l’exécution." icon={<Layers3 size={18}/>}/><MetricCard label="Mesures" value={data.metrics.length} detail="Définitions et valeurs attribuables." tone="violet" icon={<BarChart3 size={18}/>}/><MetricCard label="Interventions" value={data.interventions.length} detail="Décisions exécutives ouvertes." tone="amber" icon={<Target size={18}/>}/></div>:null}
  <div className={cx('grid gap-6',aside?'xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]':'')}>
   <div className="space-y-6">{primary}{secondary}</div>
   {aside?<aside className="space-y-6">{aside}</aside>:null}
  </div>
 </div>
}
export function DecisionRunway({items}:{items:Array<{title:string;detail:string;severity?:Severity;status?:string}>}){
 return items.length?<div className="space-y-2">{items.map((x,i)=><div key={`${x.title}-${i}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"><div><p className="font-black text-slate-900">{x.title}</p><p className="mt-1 text-xs font-semibold text-slate-500">{x.detail}</p></div><div className="flex items-center gap-2">{x.severity?<Badge tone={severityTone(x.severity) as any}>{x.severity}</Badge>:null}{x.status?<Badge tone="slate">{x.status}</Badge>:null}<ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600"/></div></div>)}</div>:<EmptyState title="Aucune décision en attente" detail="Le runway reste vide tant qu’aucun signal ou contrôle ne réclame une autorité humaine."/>
}
