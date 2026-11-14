"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type FormEvent,type ReactNode} from "react";
import {
 Activity,AlertCircle,AlertTriangle,ArrowRight,BarChart3,BellRing,CalendarClock,
 CheckCircle2,ChevronLeft,ChevronRight,Clock3,Command,Cpu,Database,Download,
 ExternalLink,FileSearch,Filter,Globe2,Layers3,Link2,ListChecks,LockKeyhole,
 Pause,Play,Plus,Radio,RefreshCw,RotateCcw,Search,Settings2,ShieldCheck,
 ShieldAlert,Square,TrendingUp,Workflow,X,Zap
} from "lucide-react";
import type {Snapshot,Row} from "./model";
import {record} from "./model";
import {SeoPowerWorkspace as LegacyWorkspace} from "./OperationsWorkspace";
import {GrowthWorkspace} from "./GrowthWorkspace";
import s from "./command360.module.css";

const API="/api/angelcare-marketplace/admin/seo-power/command";
const LEGACY="/api/angelcare-marketplace/admin/seo-power";
const GURL="/angelcare-marketplace/admin/seo-power/google-intelligence";
const NAV=[
 ["command","Command Tower",Command],["live","Live Executions",Radio],
 ["schedule","Scheduler",CalendarClock],["capacity","Capacity Studio",Cpu],
 ["queue","Queue Manager",ListChecks],["forensics","Technical SEO",FileSearch],
 ["indexation","Crawl & Indexation",Layers3],["google","Google Intelligence",Globe2],
 ["experience","Page Experience",BarChart3],["growth","Organic Growth",TrendingUp],
 ["incidents","Incident Recovery",ShieldAlert],["governance","Governance",ShieldCheck],
 ["tools","Advanced Tools",Settings2]
] as const;
type Tab=typeof NAV[number][0];
type Envelope={data?:Row;error?:{code?:string;message?:string};requestId?:string};
const asRows=(v:unknown):Row[]=>Array.isArray(v)?v.map(record):[];
const n=(v:unknown)=>Number(v||0);
const stamp=(v:unknown)=>v&&!Number.isNaN(Date.parse(String(v)))?new Date(String(v)).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"medium"}):"—";
const number=(v:unknown)=>new Intl.NumberFormat("fr-FR").format(n(v));
const age=(v:unknown)=>v&&!Number.isNaN(Date.parse(String(v)))?Math.max(0,Math.round((Date.now()-Date.parse(String(v)))/1000)):null;
const state=(v:unknown)=>{const labels:Record<string,string>={queued:"En attente",running:"En cours",completed:"Terminé",cancelled:"Annulé",paused:"En pause",failed:"Échec",succeeded:"Réussi",degraded:"Dégradé"};return labels[String(v)]||String(v||"Non confirmé")};
const kindLabel=(v:unknown)=>{const labels:Record<string,string>={crawl:"Exploration",links:"Maillage",verify:"Vérification",indexnow:"IndexNow"};return labels[String(v)]||String(v||"—")};
const isTab=(v:string):v is Tab=>NAV.some(x=>x[0]===v);
function exportJson(data:unknown,name:string){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function Card({title,kicker,children,extra}:{title:string;kicker?:string;children:ReactNode;extra?:ReactNode}){
 return <section className={s.panel}><div className={s.panelHead}><div>{kicker?<span className={s.kicker}>{kicker}</span>:null}<h2>{title}</h2></div>{extra}</div>{children}</section>;
}
function Metric({label,value,sub,tone="neutral",icon:Icon=Activity}:{label:string;value:unknown;sub:string;tone?:string;icon?:typeof Activity}){
 return <div className={s.metric} data-tone={tone}><div className={s.metricHead}><span>{label}</span><Icon size={17}/></div><strong>{value===null||value===undefined?"—":String(value)}</strong><small>{sub}</small></div>;
}
function Badge({value}:{value:unknown}){return <span className={s.badge} data-state={String(value||"unknown")}>{state(value)}</span>}
function Campaign({c,onAction,busy}:{c:Row;onAction:(action:string,input:Row)=>Promise<void>;busy:boolean}){
 const completed=n(c.succeeded)+n(c.failed)+n(c.cancelled),total=n(c.total);
 const progress=total>0?Math.min(100,100*completed/total):null;
 const status=String(c.state),active=["queued","running"].includes(status),paused=status==="paused";
 return <article className={s.campaign}><div className={s.campaignTop}><div><span className={s.mini}>{String(c.world||"").toUpperCase()} · {c.source==="scheduled"?"Planifié":"Manuel"} · {kindLabel(c.kind)}</span><h3>{String(c.title)}</h3><small>{stamp(c.created_at)} · {String(c.id).slice(0,8)}</small></div><Badge value={c.state}/></div>
 <div className={s.campaignGrid}>
 <div className={s.progressArea}><div className={s.progressMeta}><strong>{progress===null?"Périmètre indisponible":progress.toFixed(1)+" % terminé"}</strong><span>{number(completed)} / {number(total)}</span></div><div className={s.track} role="progressbar" aria-label="Progression réelle des tâches de campagne" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress===null?undefined:progress}><span style={{width:(progress||0)+"%"}}/></div><small>Basé sur les états persistants. Les échecs sont comptés comme tâches terminées, pas comme réussites.</small></div>
 <div className={s.campaignNumbers}><span><b>{number(c.succeeded)}</b> Succès</span><span><b>{number(c.running)}</b> En cours</span><span><b>{number(c.queued)}</b> En attente</span><span><b>{number(c.failed)}</b> Échecs</span></div></div>
 <div className={s.campaignFoot}><span>Début {stamp(c.started_at)} · Fin {stamp(c.finished_at)}</span><div className={s.actions}>
 {active?<button disabled={busy} onClick={()=>void onAction("campaign-pause",{id:c.id,expected:status})}><Pause size={14}/> Mettre en pause</button>:null}
 {paused?<button disabled={busy} onClick={()=>void onAction("campaign-resume",{id:c.id,expected:status})}><Play size={14}/> Reprendre</button>:null}
 {(active||paused)?<button className={s.dangerGhost} disabled={busy} onClick={()=>{if(window.confirm("Annuler les tâches encore en attente de cette campagne ? Les travaux partagés ou actifs restent protégés."))void onAction("campaign-cancel",{id:c.id,expected:status})}}><Square size={14}/> Annuler l'attente</button>:null}
 </div></div></article>;
}
function Field({name,label,min,max,defaultValue}:{name:string;label:string;min:number;max:number;defaultValue:number}){
 return <label className={s.field}><span>{label}</span><input name={name} type="number" min={min} max={max} defaultValue={defaultValue} required/><small>{min}–{number(max)}</small></label>
}
const CAPACITY=[
 ["globalConcurrency","Exécutions globales",1,64],["perProjectConcurrency","Slots par univers",1,32],
 ["perOriginConcurrency","Slots par domaine",1,32],["workersPerTick","Workers par passage",1,8],
 ["jobsPerWorker","Jobs par worker",1,6],["requestTimeoutSeconds","Timeout HTTP (s)",5,45],
 ["leaseSeconds","Bail de travail (s)",90,600],["maxAttempts","Tentatives autorisées",1,12],
 ["linkBatchSize","Liens par lot",1,48],["linksPerPage","Liens par page",10,1000],
 ["dailyJobsPerProject","Pages explorées / jour",120,100000],["queueLimitPerProject","Capacité de file",1000,500000],
 ["maxPagesPerProject","Inventaire maximal",10000,1000000],["discoveryBatchSize","Découverte / lot",1,500],
 ["scheduleBatchSize","Planification / passage",1,1000]
] as const;
export function Command360({initial}:{initial:Snapshot}){
 const [tab,setTab]=useState<Tab>("command");
 const [project,setProject]=useState("");
 const [data,setData]=useState<Row>({});
 const [ready,setReady]=useState(false);
 const [connected,setConnected]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [queue,setQueue]=useState<Row>({});
 const [queueState,setQueueState]=useState("all");
 const [queuePage,setQueuePage]=useState(1);
 const [queueQuery,setQueueQuery]=useState("");
 const [campaignForm,setCampaignForm]=useState(false);
 const [scheduleForm,setScheduleForm]=useState(false);
 const [capacityForm,setCapacityForm]=useState(false);
 const [editingSchedule,setEditingSchedule]=useState<Row|null>(null);
 const seq=useRef(0),mounted=useRef(true),lastRequest=useRef<{signature:string;key:string}|null>(null);
 const rights=initial.permissions,canManage=Boolean(rights.manage),canGovern=Boolean(rights.publish);
 useEffect(()=>{
  const p=new URLSearchParams(location.search);
  const requested=p.get("view")||"";
  if(isTab(requested))setTab(requested);
  const selected=p.get("project")||"";
  if(initial.projects.some(project=>project.id===selected))setProject(selected);
 },[initial.projects]);
 const selectTab=(next:Tab)=>{setTab(next);const u=new URL(location.href);u.searchParams.set("view",next);history.replaceState(null,"",u)};
 const selectProject=(next:string)=>{setProject(next);setQueuePage(1);const u=new URL(location.href);if(next)u.searchParams.set("project",next);else u.searchParams.delete("project");history.replaceState(null,"",u)};
 const refresh=useCallback(async(showSpinner=false)=>{
   const current=++seq.current;if(showSpinner)setLoading(true);
   try{
    const u=new URLSearchParams();if(project)u.set("project",project);
    const res=await fetch(API+"?"+u.toString(),{cache:"no-store",credentials:"same-origin"});
    const v=await res.json() as Envelope;
    if(!res.ok)throw Error(v.error?.message||"Command Center indisponible.");
    if(current===seq.current&&mounted.current){setData(record(v.data));setReady(v.data?.ready===true);setConnected(true);setError("");}
   }catch(e){if(current===seq.current&&mounted.current){setConnected(false);setError(e instanceof Error?e.message:"Lecture indisponible.");}}
   finally{if(current===seq.current&&mounted.current)setLoading(false)}
 },[project]);
 useEffect(()=>{mounted.current=true;void refresh(true);const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh(false)},8000);return()=>{mounted.current=false;clearInterval(timer)}},[refresh]);
 const loadQueue=useCallback(async()=>{
   try{const u=new URLSearchParams({action:"queue-page",state:queueState,queuePage:String(queuePage)});if(project)u.set("project",project);
   const res=await fetch(LEGACY+"?"+u,{cache:"no-store"});const v=await res.json();if(!res.ok)throw Error(v.error?.message||"Queue unavailable");if(mounted.current)setQueue(record(v.data));}
   catch(e){if(mounted.current)setError(e instanceof Error?e.message:"File inaccessible.")}
 },[project,queueState,queuePage]);
 useEffect(()=>{if(tab==="queue")void loadQueue()},[tab,loadQueue,data.observedAt]);
 async function action(type:string,input:Row={}):Promise<void>{
   if(busy)return;
   const signature=JSON.stringify({type,input});
   if(lastRequest.current?.signature!==signature)lastRequest.current={signature,key:crypto.randomUUID()};
   setBusy(true);setError("");setNotice("");
   try{const res=await fetch(API,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:type,input,requestKey:lastRequest.current.key})});
   const v=await res.json() as Envelope;if(!res.ok)throw Error(v.error?.message||"Action non confirmée.");
   if(v.data===undefined)throw Error("Aucun reçu confirmé.");
   lastRequest.current=null;
   const proof=record(v.data);
   setNotice(type==="recover-group"
     ? "Reprise gouvernée: "+number(proof.enqueued)+" jobs, "+number(proof.prerequisites)+" prérequis, "+number(proof.skipped)+" exclusions · "+(v.requestId||"")
     :type==="campaign-start"
     ? "Campagne persistée: "+String(proof.title||"")+" · "+(v.requestId||"")
     :"Opération confirmée · "+(v.requestId||""));
   setCampaignForm(false);setScheduleForm(false);setCapacityForm(false);
   await refresh(false);if(tab==="queue")await loadQueue();
   }catch(e){setError(e instanceof Error?e.message:"Opération non confirmée.");}
   finally{setBusy(false);}
 }
 function formCampaign(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);void action("campaign-start",{projectId:f.get("projectId"),kind:f.get("kind"),limit:Number(f.get("limit")),title:f.get("title")})}
 function formSchedule(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);void action("schedule-save",{id:f.get("id")||null,version:Number(f.get("version"))||null,projectId:f.get("projectId"),name:f.get("name"),kind:f.get("kind"),intervalMinutes:Number(f.get("interval")),limit:Number(f.get("limit")),enabled:f.has("enabled")})}
 const r4=record(data.r4),r4capacity=record(r4.capacity),ctrl=record(data.control),perf=record(data.performance);
 const campaigns=asRows(data.campaigns),events=asRows(data.events),workers=asRows(data.workers);
 const schedules=asRows(data.schedules),errors=asRows(data.errors),executions=asRows(data.latestExecutions),jobs=asRows(data.queue);
 const active=Boolean(data.engineFlag)&&Boolean(data.r4Effective)&&ctrl.enabled===true&&r4.enabled===true;
 const canOperate=active&&canManage&&ready&&!busy;
 const stale=!connected||!ready||age(data.observedAt)===null||n(age(data.observedAt))>35;
 const scoped=project?initial.projects.filter(x=>x.id===project):initial.projects;
 const totalOpen=errors.reduce((sum,x)=>sum+n(x.total),0);
 const activeCampaigns=campaigns.filter(c=>["running","queued"].includes(String(c.state)));
 const incidentGroups=useMemo(()=>errors.slice().sort((a,b)=>n(b.total)-n(a.total)),[data.errors]);
 const world=(pid:unknown)=>initial.projects.find(p=>p.id===pid)?.world||"—";
 const barColor=(idx:number)=>["#117a62","#d5a047","#bc6555"][idx%3];
 return <main className={s.root}>
  <header className={s.hero}>
   <div className={s.heroText}><div className={s.overline}><span className={s.signal}/> ANGELCARE OPS OS · SEARCH OPERATIONS AUTHORITY</div>
    <h1>SEO POWER <em>Command Center 360</em></h1>
    <p>Un centre de décision professionnel. Exécutions persistantes, pilotage multi-univers, preuves techniques et autorité opérationnelle.</p>
    <div className={s.heroMeta}><span><Radio size={14}/> {stale?"Télémétrie non confirmée":"Lecture serveur confirmée"}</span><span><Clock3 size={14}/> {stamp(data.observedAt)}</span><span><Cpu size={14}/> {active?"R4 + R5 actifs":"Activation non confirmée"}</span></div>
   </div>
   <div className={s.heroActions}><button onClick={()=>void refresh(true)} disabled={loading}><RefreshCw size={16} className={loading?s.spin:""}/> Actualiser les preuves</button>
    <button onClick={()=>exportJson({observedAt:data.observedAt,world:project||"all",dashboard:data},"seo-power-evidence-"+new Date().toISOString().slice(0,10)+".json")} disabled={!ready}><Download size={16}/> Exporter le dossier</button>
    <button className={s.solid} onClick={()=>setCampaignForm(true)} disabled={!canOperate}><Play size={16}/> Nouvelle campagne</button></div>
  </header>
  <div className={s.switchRow}><div className={s.worlds}><button data-active={!project} onClick={()=>selectProject("")}>Portfolio global</button>{initial.projects.map(p=><button key={p.id} data-active={project===p.id} onClick={()=>selectProject(p.id)}>{p.name}</button>)}</div><span className={s.lastRead}>Actualisation 8s · {stale?"Flux déconnecté":"Données persistantes"}</span></div>
  <nav className={s.tabs} aria-label="SEO POWER workspaces">{NAV.map(([key,label,Icon])=><button key={key} data-active={tab===key} onClick={()=>selectTab(key)}><Icon size={16}/>{label}{key==="incidents"&&totalOpen>0?<b>{number(totalOpen)}</b>:null}</button>)}</nav>
  {error?<div role="alert" className={s.error}><AlertCircle size={16}/>{error}<button onClick={()=>setError("")} aria-label="Fermer"><X size={15}/></button></div>:null}
  {notice?<div role="status" className={s.success}><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")} aria-label="Fermer"><X size={15}/></button></div>:null}
  {!ready?<div className={s.blocker}><ShieldAlert size={26}/><div><strong>Migration R5 ou lecture d'autorité non confirmée</strong><p>{String(data.reason||"Le centre garde les outils historiques disponibles. Installer la migration additive R5 puis actualiser.")}</p></div><button onClick={()=>selectTab("tools")}>Ouvrir les outils historiques</button></div>:null}
  {ready&&!active?<div className={s.activation}><div><span className={s.kicker}>ACTIVATION GOUVERNÉE · EXÉCUTION PROTÉGÉE</span><strong>Le moteur de commande R5 est installé mais non pleinement actif.</strong><p>Déploiement R5: {data.engineFlag?"présent":"désactivé"} · Worker R4: {data.r4Effective?"actif":"inactif"} · DB R5: {ctrl.enabled?"active":"inactive"}. Aucun run n'est déclaré démarré tant que ces autorités ne concordent pas.</p></div>{canGovern&&data.engineFlag&&data.r4Effective&&ctrl.enabled!==true?<button className={s.solid} disabled={busy} onClick={()=>void action("activate",{enabled:true,revision:ctrl.revision})}><LockKeyhole size={15}/> Activer Command 360</button>:null}</div>:null}

  {tab==="command"?<div className={s.workspace}>
    <div className={s.metricGrid}>
      <Metric label="En cours maintenant" value={number(perf.running)} sub="Jobs avec baux persistants" icon={Activity} tone="green"/>
      <Metric label="En attente" value={number(perf.queued)} sub={number(perf.overdue)+" jobs en retard"} icon={Clock3} tone="amber"/>
      <Metric label="Réussites / 15 min" value={number(perf.succeeded15m)} sub="Historique des jobs finalisés" icon={CheckCircle2}/>
      <Metric label="Incidents non résolus" value={number(perf.unresolved)} sub={number(perf.failed15m)+" échecs récents"} icon={AlertTriangle} tone="red"/>
      <Metric label="Latence p95" value={perf.p95Seconds!=null?String(perf.p95Seconds)+" s":"—"} sub="Tentatives R4 · 24h" icon={Zap}/>
      <Metric label="Campagnes actives" value={number(activeCampaigns.length)} sub={number(campaigns.length)+" campagnes dans l'historique récent"} icon={Workflow}/>
    </div>
    <div className={s.twoColumns}><Card kicker="LIVE OPERATION PORTFOLIO" title="Exécutions sous surveillance" extra={<button onClick={()=>selectTab("live")}>Ouvrir le théâtre <ArrowRight size={14}/></button>}>
     {campaigns.slice(0,3).length?campaigns.slice(0,3).map(c=><Campaign key={String(c.id)} c={c} onAction={action} busy={!canOperate}/>):<p className={s.empty}>Aucune campagne R5 persistée pour ce périmètre. Les jobs historiques restent consultables dans la file.</p>}
    </Card>
    <div className={s.stack}>
     <Card kicker="ORGANIC ASSET AUTHORITY" title="Trois univers, un portefeuille">
      <div className={s.worldRows}>{scoped.map(p=><div key={p.id}><span><span className={s.worldIcon}><Globe2 size={16}/></span><b>{p.name}</b><small>{p.origin}</small></span><span className={s.worldSignal}>{p.enabled?"Activé":"En pause"}</span></div>)}</div>
     </Card>
     <Card kicker="OPERATOR PRIORITIES" title="Décisions immédiates">
      <div className={s.decisionList}><button onClick={()=>selectTab("incidents")}><AlertTriangle size={17}/><span><b>{number(perf.unresolved)} incidents à analyser</b><small>Causes regroupées, reprise contrôlée</small></span><ArrowRight size={15}/></button>
      <button onClick={()=>selectTab("queue")}><ListChecks size={17}/><span><b>{number(perf.overdue)} jobs en retard</b><small>Trier par état, page, tentative</small></span><ArrowRight size={15}/></button>
      <button onClick={()=>selectTab("capacity")}><Cpu size={17}/><span><b>Configuration active du moteur</b><small>Vérifier ce que les workers appliquent réellement</small></span><ArrowRight size={15}/></button></div>
     </Card></div></div>
    <Card kicker="RECENT EVIDENCE" title="Journal opérationnel" extra={<button onClick={()=>selectTab("live")}>Toutes les preuves <ArrowRight size={14}/></button>}><EventFeed events={events.slice(0,8)}/></Card>
  </div>:null}
  {tab==="live"?<div className={s.workspace}>
   <div className={s.metricGrid}><Metric label="Workers récemment observés" value={number(workers.filter(w=>n(age(w.last_seen_at))<60).length)} sub="Présences enregistrées côté serveur" icon={Cpu}/><Metric label="Baux actifs" value={number(perf.running)} sub="Jobs toujours détenus" icon={Activity}/><Metric label="Campagnes suivies" value={number(campaigns.length)} sub="Fenêtre des 40 dernières" icon={Workflow}/><Metric label="Débit / 15 min" value={number(perf.succeeded15m)} sub="Réussites constatées" icon={TrendingUp}/></div>
   <div className={s.twoColumns}><Card kicker="LIVE EXECUTION THEATRE" title="Progression réelle des campagnes" extra={<button className={s.solid} disabled={!canOperate} onClick={()=>setCampaignForm(true)}><Plus size={15}/> Nouvelle campagne</button>}>
     {campaigns.length?campaigns.map(c=><Campaign key={String(c.id)} c={c} busy={!canOperate} onAction={action}/>):<p className={s.empty}>Aucune campagne R5. Le suivi de l'exécution legacy est conservé dans les outils avancés.</p>}
    </Card>
    <div className={s.stack}><Card kicker="ACTIVE WORKER FLEET" title="Workers & heartbeats">
     {workers.length?<div className={s.workerList}>{workers.map(w=><div key={String(w.id)}><span className={s.workerDot} data-fresh={n(age(w.last_seen_at))<60}/><div><b>{String(w.id)}</b><small>{String(w.source)} · {String(w.engine)} · {stamp(w.last_seen_at)}</small></div><strong>{n(age(w.last_seen_at))<60?"Récent":"Inactif / ancien"}</strong></div>)}</div>:<p className={s.empty}>Aucun worker R5 enregistré. L'absence de télémétrie n'est pas assimilée à zéro charge.</p>}
    </Card>
    <Card kicker="EXECUTION RECEIPTS" title="Passages manuels & planifiés"><div className={s.receiptList}>{executions.slice(0,12).map(e=><div key={String(e.id)}><span><b>{e.source==="scheduler"?"Planifié":"Manuel"}</b><small>{stamp(e.started_at)}</small></span><Badge value={e.state}/></div>)}</div></Card></div></div>
   <Card kicker="PERSISTENT EVENT JOURNAL" title="Journal détaillé des événements"><EventFeed events={events}/></Card>
  </div>:null}
  {tab==="schedule"?<div className={s.workspace}><div className={s.metricGrid}><Metric label="Règles actives" value={number(schedules.filter(x=>x.enabled===true).length)} sub="Planification R5 explicite" icon={CalendarClock}/><Metric label="Règles enregistrées" value={number(schedules.length)} sub="Par projets et fréquence" icon={Workflow}/><Metric label="Passages récents" value={number(executions.filter(x=>x.source==="scheduler").length)} sub="Historique récent disponible" icon={Clock3}/></div>
   <Card kicker="SCHEDULE CONTROL AUTHORITY" title="Calendrier d'exécution" extra={<button className={s.solid} disabled={!canOperate} onClick={()=>setScheduleForm(true)}><Plus size={15}/> Nouvelle programmation</button>}>
    {schedules.length?<div className={s.tableScroll}><table><thead><tr><th>Règle</th><th>Univers</th><th>Type</th><th>Cadence</th><th>Prochain départ</th><th>Dernier départ</th><th>État</th><th>Contrôle</th></tr></thead><tbody>{schedules.map(x=><tr key={String(x.id)}><td><b>{String(x.name)}</b></td><td>{String(x.world)}</td><td>{kindLabel(x.kind)}</td><td>Chaque {number(x.interval_minutes)} min</td><td>{stamp(x.next_due_at)}</td><td>{stamp(x.last_started_at)}</td><td><Badge value={x.enabled?"running":"paused"}/></td><td><button disabled={!canOperate} onClick={()=>{setScheduleForm(true);setEditingSchedule(x)}}><Settings2 size={14}/> Éditer</button></td></tr>)}</tbody></table></div>:<p className={s.empty}>Aucune règle R5 définie. Le planificateur legacy continue indépendamment tant que la configuration R5 n'est pas activée.</p>}
   </Card><Card kicker="SCHEDULER EVIDENCE" title="Derniers passages confirmés"><div className={s.receiptList}>{executions.filter(e=>e.source==="scheduler").slice(0,15).map(e=><div key={String(e.id)}><span><b>{stamp(e.started_at)}</b><small>ID {String(e.id).slice(0,8)} · fin {stamp(e.finished_at)}</small></span><Badge value={e.state}/></div>)}</div></Card>
  </div>:null}
  {tab==="capacity"?<div className={s.workspace}><div className={s.metricGrid}><Metric label="Concurrence globale" value={number(r4capacity.globalConcurrency)} sub="Plafond R4 en base" icon={Cpu}/><Metric label="Concurrence / origine" value={number(r4capacity.perOriginConcurrency)} sub="Protection du domaine" icon={Globe2}/><Metric label="Timeout maximal" value={r4capacity.requestTimeoutSeconds!=null?String(r4capacity.requestTimeoutSeconds)+" s":"—"} sub="Politique HTTP R4" icon={Clock3}/><Metric label="Tentatives" value={number(r4capacity.maxAttempts)} sub="Reprises contrôlées" icon={RotateCcw}/></div>
   <div className={s.twoColumns}><Card kicker="CAPACITY GOVERNANCE" title="Configuration effective R4" extra={<button disabled={!canOperate||!canGovern} onClick={()=>setCapacityForm(true)}><Settings2 size={15}/> Éditer la capacité</button>}>
    <div className={s.capacityGrid}>{CAPACITY.map(([key,label])=><div key={key}><span>{label}</span><b>{r4capacity[key]!==undefined?number(r4capacity[key]):"Non disponible"}</b></div>)}</div>
   </Card><div className={s.stack}><Card kicker="WORKER AUTHORITY" title="Activation & compatibilité"><dl className={s.facts}><dt>R4 en base</dt><dd>{r4.enabled?"Activé":"Inactif"}</dd><dt>R4 côté serveur</dt><dd>{data.r4Effective?"Actif":"Non activé"}</dd><dt>Command 360 côté serveur</dt><dd>{data.engineFlag?"Autorisé":"Désactivé"}</dd><dt>Command 360 en base</dt><dd>{ctrl.enabled?"Actif":"Inactif"}</dd><dt>Workers présents</dt><dd>{number(workers.length)}</dd></dl></Card><Card kicker="RESOURCE DISCIPLINE" title="Limites de sécurité"><p className={s.note}>Les valeurs élevées augmentent la pression sur l'origine, la base de données et les ressources du worker. Le contrôle d'accès, le verrouillage et les plafonds techniques restent appliqués.</p><button onClick={()=>selectTab("live")}>Voir les workers observés <ArrowRight size={14}/></button></Card></div></div>
  </div>:null}
  {tab==="queue"?<div className={s.workspace}><Card kicker="PERSISTENT QUEUE OPERATIONS" title="Tous les états, toutes les tâches" extra={<button onClick={()=>void loadQueue()}><RefreshCw size={15}/> Actualiser</button>}>
   <div className={s.filters}><label><Filter size={15}/> État<select value={queueState} onChange={e=>{setQueueState(e.target.value);setQueuePage(1)}}>{["all","queued","running","failed","succeeded","cancelled","attention"].map(x=><option key={x} value={x}>{x}</option>)}</select></label><label><Search size={15}/> Filtrer la page<input placeholder="Chemin/URL" value={queueQuery} onChange={e=>setQueueQuery(e.target.value)}/></label><span>{number(queue.total)} tâches · page {queuePage}</span></div>
   <div className={s.tableScroll}><table><thead><tr><th>URL / tâche</th><th>Univers</th><th>État</th><th>Tentative</th><th>Échéance</th><th>Cause</th><th>Actions</th></tr></thead><tbody>{asRows(queue.items).filter(j=>!queueQuery||String(j.path||"").toLowerCase().includes(queueQuery.toLowerCase())).map(j=><tr key={String(j.id)}><td className={s.path}><b>{String(j.path||j.id)}</b><small>{kindLabel(j.kind)} · {String(j.id).slice(0,8)}</small></td><td>{world(j.project_id)}</td><td><Badge value={j.state}/></td><td>{number(j.attempts)}</td><td>{stamp(j.due_at)}</td><td>{String(record(j.result).code||j.error||"—").slice(0,120)}</td><td><div className={s.actions}>{j.state==="failed"?<button disabled={!canOperate} onClick={()=>void action("job-retry",{id:j.id})}><RotateCcw size={14}/> Reprendre</button>:null}{j.state==="queued"?<button disabled={!canOperate} onClick={()=>{if(window.confirm("Annuler cette tâche en attente ?"))void action("job-cancel",{id:j.id})}}><X size={14}/> Annuler</button>:null}</div></td></tr>)}</tbody></table></div>
   <div className={s.pager}><button disabled={queuePage<=1} onClick={()=>setQueuePage(p=>p-1)}><ChevronLeft size={15}/> Précédent</button><span>Page {queuePage} / {Math.max(1,Math.ceil(n(queue.total)/40))}</span><button disabled={queuePage>=Math.ceil(n(queue.total)/40)} onClick={()=>setQueuePage(p=>p+1)}>Suivant <ChevronRight size={15}/></button></div></Card></div>:null}
  {tab==="forensics"?<div className={s.workspace}><div className={s.metricGrid}><Metric label="Causes regroupées" value={number(errors.length)} sub="Incidents persistants" icon={FileSearch}/><Metric label="Échecs non résolus" value={number(perf.unresolved)} sub="Dernier statut enregistré" tone="red" icon={AlertTriangle}/><Metric label="Liens inspectés" value={number(initial.findings.length)} sub="Échantillon natif conservé" icon={Link2}/></div><div className={s.twoColumns}><Card kicker="TECHNICAL FAULT CLUSTERS" title="Incidents classifiés"><ErrorTable items={incidentGroups}/></Card><Card kicker="SOURCE FORENSICS" title="Analyse & gouvernance"><p className={s.note}>Les corrections touchant canonicals, schémas, robots, hreflang, liens ou source native doivent rester dans le workflow approuvé. Ce centre expose les preuves sans contourner l'autorité de publication.</p><div className={s.decisionList}><button onClick={()=>selectTab("incidents")}><ShieldAlert size={17}/><span><b>Centre de récupération</b><small>Regrouper les causes et vérifier les suites</small></span><ArrowRight size={14}/></button><button onClick={()=>selectTab("tools")}><FileSearch size={17}/><span><b>Explorer les pages et constats</b><small>Outils natifs d'inspection & correction</small></span><ArrowRight size={14}/></button></div></Card></div></div>:null}
  {tab==="indexation"?<div className={s.workspace}><div className={s.metricGrid}><Metric label="Pages enregistrées" value={number(initial.total)} sub="Inventaire paginé selon périmètre initial" icon={Database}/><Metric label="Découvertes en file" value={number(perf.queued)} sub="Différent des pages indexées" icon={Layers3}/><Metric label="Google indexation" value="Non déduite" sub="Requiert URL Inspection officielle" icon={Globe2}/></div><Card kicker="INDEXATION AUTHORITY" title="De la découverte au verdict Google"><div className={s.processSteps}>{["Découverte native","Crawl & HTTP","Robots & canonical","Sitemap","Inspection Google","Résultat vérifié"].map((x,i)=><div key={x}><span>{String(i+1).padStart(2,"0")}</span><b>{x}</b><small>Preuve distincte</small></div>)}</div><p className={s.note}>Indexable dans SEO POWER ne prouve jamais indexé dans Google. Les URL doivent être vérifiées via Google Search Console et les API officielles dans leurs quotas autorisés.</p><a className={s.link} href={GURL+"?view=inspection"}>Ouvrir l'inspection Google <ExternalLink size={15}/></a></Card></div>:null}
  {tab==="google"?<div className={s.workspace}><Card kicker="OFFICIAL GOOGLE EVIDENCE" title="Search Console × GA4 × Inspection"><div className={s.googleGrid}>{[{title:"Search Performance",text:"Impressions, clics, CTR, position, langues et destinations réelles.",url:GURL+"?view=search",icon:TrendingUp},{title:"Organic Analytics",text:"Sessions organiques et engagement confirmés par GA4.",url:GURL+"?view=analytics",icon:BarChart3},{title:"URL Inspection",text:"Verdict d'indexation Google, robots et état de l'URL.",url:GURL+"?view=inspection",icon:Search},{title:"Connector Diagnostics",text:"Sources, budgets, fraîcheur et état des autorisations.",url:GURL+"?view=diagnostics",icon:Activity}].map(x=><a href={x.url} key={x.title}><x.icon size={23}/><b>{x.title}</b><p>{x.text}</p><span>Ouvrir Google Intelligence <ArrowRight size={15}/></span></a>)}</div><p className={s.note}>Les chiffres du moteur interne ne sont pas présentés comme preuves Google. Ce module conserve les connecteurs authentiques et ne simule aucune valeur.</p></Card></div>:null}
  {tab==="experience"?<div className={s.workspace}><div className={s.metricGrid}><Metric label="Contrôles CI archivés" value={number(initial.ci.length)} sub="Historique source disponible" icon={BarChart3}/><Metric label="p95 worker" value={perf.p95Seconds!=null?String(perf.p95Seconds)+" s":"—"} sub="R4 tentatives, pas Core Web Vitals" icon={Cpu}/></div><Card kicker="PAGE EXPERIENCE LAB" title="Audit de performance et preuve de publication"><p className={s.note}>Un indicateur de latence crawler n'est pas une mesure Core Web Vitals. Les données de laboratoire et les données terrain doivent rester séparées. Ci-dessous, les véritables preuves CI conservées dans le registre existant.</p><div className={s.receiptList}>{initial.ci.length?initial.ci.slice(0,30).map((c,i)=><div key={String(c.id||i)}><span><b>{String(c.run_id||c.id||"Audit")}</b><small>{stamp(c.created_at)}</small></span><span>{String(c.state||c.status||"Enregistré")}</span></div>):<p className={s.empty}>Aucun contrôle CI présent dans l'échantillon initial. Aucune note de performance n'est inventée.</p>}</div></Card></div>:null}
  {tab==="growth"?<div className={s.workspace}><Card kicker="ORGANIC GROWTH AUTHORITY" title="Acquisition, publication et croissance"><p className={s.note}>Ce module conserve le véritable moteur Croissance existant: inventaire, opportunités, préparation des lots et publication avec autorisation. Les données officielles Google restent dans leur espace dédié.</p><div className={s.actions}><a className={s.link} href={GURL+"?view=analytics"}>GA4 acquisition organique <ExternalLink size={14}/></a><a className={s.link} href={GURL+"?view=search"}>Search Console <ExternalLink size={14}/></a></div></Card><GrowthWorkspace projectId={project} projects={initial.projects} permissions={initial.permissions} pages={initial.pages as unknown as Row[]}/></div>:null}
  {tab==="incidents"?<div className={s.workspace}><div className={s.metricGrid}><Metric label="Incidents non résolus" value={number(perf.unresolved)} sub="Ne jamais effacer sans preuve" tone="red" icon={AlertTriangle}/><Metric label="Échecs / 15 min" value={number(perf.failed15m)} sub="Signal des défauts récents" icon={Activity}/><Metric label="Classes de défaut" value={number(errors.length)} sub="Agrégation par code & univers" icon={ShieldAlert}/></div><Card kicker="INCIDENT INTELLIGENCE" title="Regroupement par cause racine"><RecoveryTable items={incidentGroups} onAction={action} busy={!canOperate} project={project} projects={initial.projects}/><p className={s.note}>Prioriser la correction de la cause; après réparation, reprendre uniquement les tâches éligibles. Les échecs historiques ne sont pas remis à zéro artificiellement.</p><button onClick={()=>selectTab("queue")}>Ouvrir la file et ses actions <ArrowRight size={14}/></button></Card><Card kicker="RECOVERY EVIDENCE" title="Derniers événements"><EventFeed events={events.slice(0,40)}/></Card></div>:null}
  {tab==="governance"?<div className={s.workspace}><div className={s.metricGrid}><Metric label="Reçus existants" value={number(initial.receipts.length)} sub="Historique de gouvernance" icon={ShieldCheck}/><Metric label="R5 contrôle" value={ctrl.enabled?"Actif":"Inactif"} sub="Avec vérification du moteur R4" icon={LockKeyhole}/><Metric label="Révision R5" value={number(ctrl.revision)} sub="Contrôle d'activation gouverné" icon={Settings2}/></div><div className={s.twoColumns}><Card kicker="CHANGE AUTHORITY" title="Traçabilité et droits"><dl className={s.facts}><dt>Lecture</dt><dd>Autorisation globale requise</dd><dt>Gestion</dt><dd>{canManage?"Accordée":"Non accordée"}</dd><dt>Publication / capacité</dt><dd>{canGovern?"Accordée":"Non accordée"}</dd><dt>Restauration</dt><dd>{rights.rollback?"Accordée":"Non accordée"}</dd></dl><p className={s.note}>Toute modification SEO publique, proposition, approbation ou restauration demeure sous les contrôles de publication existants.</p></Card><Card kicker="RELEASE & ACTIVATION" title="Autorité du moteur"><dl className={s.facts}><dt>R4 database</dt><dd>{r4.enabled?"Active":"Inactive"}</dd><dt>R4 serveur</dt><dd>{data.r4Effective?"Confirmé":"Non confirmé"}</dd><dt>R5 environnement</dt><dd>{data.engineFlag?"Autorisé":"Non autorisé"}</dd><dt>R5 base</dt><dd>{ctrl.enabled?"Actif":"Inactif"}</dd></dl>{ctrl.enabled&&canGovern&&data.engineFlag?<button className={s.dangerGhost} disabled={busy} onClick={()=>{if(window.confirm("Désactiver les nouvelles commandes R5 ? Les jobs existants persistent."))void action("activate",{enabled:false,revision:ctrl.revision})}}>Désactiver les commandes R5</button>:null}</Card></div><Card kicker="VERIFIABLE RECEIPTS" title="Journal d'autorité historique"><div className={s.receiptList}>{initial.receipts.slice(0,35).map((x,i)=><div key={String(x.id||i)}><span><b>{String(x.action||"Action")}</b><small>{stamp(x.created_at)} · {String(x.request_key||"").slice(0,24)}</small></span><ShieldCheck size={17}/></div>)}</div></Card></div>:null}
  {tab==="tools"?<div className={s.legacy}><div className={s.legacyIntro}><Settings2 size={20}/><div><strong>Outils experts existants — préservés intégralement</strong><p>Les pages, corrections, maillage, diffusion, historique et contrôle natif restent accessibles sous leur contrat historique.</p></div></div><LegacyWorkspace initial={initial}/></div>:null}

  {campaignForm?<div className={s.overlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setCampaignForm(false)}}><form className={s.modal} onSubmit={formCampaign}><div className={s.modalHead}><div><span className={s.kicker}>NEW EXECUTION · PERSISTENT CAMPAIGN</span><h2>Créer une campagne</h2></div><button type="button" onClick={()=>setCampaignForm(false)} aria-label="Fermer"><X size={18}/></button></div><p>La campagne est enregistrée côté serveur. Elle continue sous le planificateur même après fermeture du navigateur.</p><label className={s.field}><span>Nom de campagne</span><input name="title" minLength={3} maxLength={160} placeholder="Audit complet — catégorie services" required/></label><label className={s.field}><span>Univers</span><select name="projectId" defaultValue={project} required>{!project?<option value="">Sélectionner un univers</option>:null}{initial.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className={s.formCols}><label className={s.field}><span>Nature des tâches</span><select name="kind" defaultValue="crawl"><option value="crawl">Explorer les pages</option><option value="links">Vérifier les liens</option><option value="verify">Vérifier publication</option><option value="indexnow">Notifier IndexNow (éligibles)</option></select></label><Field name="limit" label="Nombre maximal de pages" min={1} max={1000} defaultValue={100}/></div><p className={s.note}>L'autorité de file applique les dépendances, les quotas, les permissions et les limites du domaine.</p><div className={s.modalActions}><button type="button" onClick={()=>setCampaignForm(false)}>Annuler</button><button className={s.solid} disabled={!canOperate||busy} type="submit"><Play size={15}/> Créer et mettre en file</button></div></form></div>:null}
  {scheduleForm?<div className={s.overlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget){setScheduleForm(false);setEditingSchedule(null)}}}><form className={s.modal} onSubmit={formSchedule}><div className={s.modalHead}><div><span className={s.kicker}>SCHEDULER CONTROL</span><h2>{editingSchedule?"Modifier la règle":"Nouvelle programmation"}</h2></div><button type="button" onClick={()=>{setScheduleForm(false);setEditingSchedule(null)}} aria-label="Fermer"><X size={18}/></button></div><input type="hidden" name="id" value={String(editingSchedule?.id||"")}/><input type="hidden" name="version" value={String(editingSchedule?.version||"")}/><label className={s.field}><span>Nom</span><input name="name" required minLength={3} maxLength={100} defaultValue={String(editingSchedule?.name||"")} placeholder="Vérification quotidienne des catégories"/></label><label className={s.field}><span>Univers</span><select name="projectId" defaultValue={String(editingSchedule?.project_id||project)} required>{!project&&!editingSchedule?<option value="">Sélectionner un univers</option>:null}{initial.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className={s.formCols}><label className={s.field}><span>Action</span><select name="kind" defaultValue={String(editingSchedule?.kind||"crawl")}><option value="crawl">Crawl</option><option value="links">Liens</option><option value="verify">Vérification</option><option value="indexnow">IndexNow</option></select></label><Field name="interval" label="Intervalle (minutes)" min={15} max={10080} defaultValue={n(editingSchedule?.interval_minutes)||1440}/><Field name="limit" label="URL / campagne" min={1} max={1000} defaultValue={n(editingSchedule?.max_pages)||100}/></div><label className={s.check}><input type="checkbox" name="enabled" defaultChecked={editingSchedule?editingSchedule.enabled===true:false}/> Programmation active</label><div className={s.modalActions}><button type="button" onClick={()=>{setScheduleForm(false);setEditingSchedule(null)}}>Annuler</button><button type="submit" disabled={!canOperate||busy} className={s.solid}><CalendarClock size={15}/> Enregistrer la règle</button></div></form></div>:null}
  {capacityForm?<div className={s.overlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setCapacityForm(false)}}><form className={s.modalWide} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget),cap:Row={};for(const [k] of CAPACITY)cap[k]=Number(f.get(k));void action("capacity-save",{capacity:cap,expectedUpdatedAt:r4.updatedAt})}}><div className={s.modalHead}><div><span className={s.kicker}>RESOURCE GOVERNANCE · R4</span><h2>Éditer la capacité du moteur</h2></div><button type="button" onClick={()=>setCapacityForm(false)} aria-label="Fermer"><X size={18}/></button></div><p>Les modifications sont validées côté serveur et exigent une révision cohérente. Aucun délai ni charge ne garantit un meilleur classement Google.</p><div className={s.formCapacity}>{CAPACITY.map(([key,label,min,max])=><Field key={key} name={key} label={label} min={min} max={max} defaultValue={n(r4capacity[key])||min}/>)}</div><div className={s.modalActions}><button type="button" onClick={()=>setCapacityForm(false)}>Annuler</button><button className={s.solid} disabled={!canOperate||!canGovern||busy} type="submit"><Settings2 size={15}/> Appliquer la politique</button></div></form></div>:null}
 </main>;
}
function EventFeed({events}:{events:Row[]}){
 return events.length?<div className={s.timeline}>{events.map((e,i)=><div key={String(e.id||i)}><span className={s.timelineDot}/><div><b>{String(e.event||"Transition")}</b><small>{String(e.category||"moteur")} · {stamp(e.created_at)}</small><p>{String(record(e.detail).code||record(e.detail).message||record(e.detail).state||"Preuve persistante")}</p></div><code>{String(e.job_id||e.campaign_id||e.execution_id||"").slice(0,8)}</code></div>)}</div>:<p className={s.empty}>Aucun événement R5 enregistré. Les historiques R1/R2 restent consultables séparément.</p>
}
function ErrorTable({items}:{items:Row[]}){
 return items.length?<div className={s.tableScroll}><table><thead><tr><th>Univers</th><th>Cause classifiée</th><th>Échecs</th><th>Dernier incident</th></tr></thead><tbody>{items.map((x,i)=><tr key={i}><td><b>{String(x.world)}</b></td><td className={s.path}>{String(x.code)}</td><td><span className={s.countBad}>{number(x.total)}</span></td><td>{stamp(x.latest)}</td></tr>)}</tbody></table></div>:<p className={s.empty}>Aucune cause non résolue enregistrée dans ce périmètre.</p>;
}

function RecoveryTable({items,onAction,busy,project,projects}:{items:Row[];onAction:(action:string,input:Row)=>Promise<void>;busy:boolean;project:string;projects:Snapshot["projects"]}){
 return items.length?<div className={s.tableScroll}><table><thead><tr><th>Univers</th><th>Cause racine</th><th>Échecs</th><th>Dernier incident</th><th>Reprise sécurisée</th></tr></thead>
 <tbody>{items.map((x,i)=><tr key={i}><td><b>{String(x.world)}</b></td><td className={s.path}>{String(x.code)}</td><td><span className={s.countBad}>{number(x.total)}</span></td><td>{stamp(x.latest)}</td><td><button disabled={busy} onClick={()=>{
 const code=String(x.code);if(window.confirm("Examiner puis réadmettre au plus 50 tâches de cause « "+code+" » ? Les prérequis seront validés et les échecs historiques seront conservés."))void onAction("recover-group",{projectId:project||projects.find(p=>p.world===String(x.world))?.id||null,code,limit:50});
 }}><RotateCcw size={14}/> Reprise contrôlée (50 max.)</button></td></tr>)}</tbody></table></div>:<p className={s.empty}>Aucune cause non résolue enregistrée dans ce périmètre.</p>;
}
