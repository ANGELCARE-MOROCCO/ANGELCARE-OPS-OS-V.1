"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, BarChart3, BookOpen, Bot, BrainCircuit,
  CheckCircle2, ChevronRight, CirclePause, CirclePlay, Clock3, Command, Database,
  Eye, FileSpreadsheet, Filter, Flag, Gauge, GitBranch, GraduationCap, Import, Layers3,
  LineChart, LockKeyhole, MessageSquareText, Network, RefreshCw, Rocket, Search,
  Settings2, Shield, ShieldCheck, Signal, SlidersHorizontal, Sparkles, Target, Upload,
  UserRoundCheck, UsersRound, WandSparkles, Workflow, X, XCircle, Zap,
} from "lucide-react"
import type { AcWhatsAppAccount } from "@/lib/ac-whatsapp/types"
import { cx, ModalFrame, NoticeBanner, ProgressBar, StatusPill } from "./ACWhatsAppUI"
import { acApi, friendlyAcError, formatRelative } from "./useAcWhatsApp"

type RevenueData = {
  settings:any[]; packs:any[]; imports:any[]; maturity:any[]; proposals:any[]; simulations:any[]
  runtime:any[]; states:any[]; decisions:any[]; campaigns:any[]; counts:Record<string,number>
}

type CommandData = {
  cognition:any[]; learningCandidates:any[]; knowledge:any[]; offers:any[]; actionRuns:any[]
  events:any[]; outcomes:any[]; maturity:any[]; audit:any[]; doctrineNodes:any[]; counts:Record<string,number>
}

type Tab = "cockpit"|"doctrines"|"import"|"journeys"|"maturity"|"simulation"|"governance"|"runtime"
type Notice = {tone:"success"|"warning"|"danger"|"info";title:string;description:string}

const tabs:Array<{id:Tab;label:string;short:string;icon:any}> = [
  {id:"cockpit",label:"Autonomy Pulse",short:"Cockpit",icon:Gauge},
  {id:"doctrines",label:"Doctrine Universe",short:"Doctrine",icon:Layers3},
  {id:"import",label:"Knowledge Ingestion Lab",short:"Import",icon:FileSpreadsheet},
  {id:"journeys",label:"Journey Orchestrator",short:"Journey",icon:GitBranch},
  {id:"maturity",label:"Maturity Constellation",short:"Maturity",icon:GraduationCap},
  {id:"simulation",label:"Commercial Flight Simulator",short:"Simulation",icon:WandSparkles},
  {id:"governance",label:"Authority & Governance",short:"Governance",icon:ShieldCheck},
  {id:"runtime",label:"Live Nervous System",short:"Runtime",icon:Zap},
]

const journeyStages = ["aware","curious","engaged","qualified","solution_fit","evaluating","objection","decision","closing","converted","onboarding","satisfaction","expansion","renewal","recovery","referral"]
const journeyLabels:Record<string,string>={aware:"Acquire",curious:"Discover",engaged:"Engage",qualified:"Qualify",solution_fit:"Fit",evaluating:"Evaluate",objection:"Object",decision:"Decide",closing:"Close",converted:"Convert",onboarding:"Activate",satisfaction:"Satisfy",expansion:"Expand",renewal:"Renew",recovery:"Recover",referral:"Refer"}

function clamp(value:number,min=0,max=100){return Math.max(min,Math.min(max,value))}
function pct(value:unknown){const n=Number(value||0);return clamp(Math.round(n<=1?n*100:n))}
function levelWeight(level:string){return ({L0:0,L1:16,L2:32,L3:50,L4:68,L5:84,L6:100} as Record<string,number>)[String(level||"L0")]||0}
function safeDate(value:any){const n=new Date(value||0).getTime();return Number.isFinite(n)?n:0}
function compactJson(value:any,max=220){const text=JSON.stringify(value||{});return text.length>max?`${text.slice(0,max)}…`:text}
function confidenceOf(row:any){const c=row?.confidence;return typeof c==="number"?c:Number(c?.aggregate||row?.confidence_score||row?.score||0)}
function titleCase(value:any){return String(value||"—").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase())}

export default function SovereignRevenueIntelligenceWorkspace({accounts}:{accounts:AcWhatsAppAccount[]}){
  const [data,setData]=useState<RevenueData|null>(null)
  const [command,setCommand]=useState<CommandData|null>(null)
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState<Tab>("cockpit")
  const [notice,setNotice]=useState<Notice|null>(null)
  const [error,setError]=useState<string|null>(null)
  const [busy,setBusy]=useState(false)
  const [palette,setPalette]=useState(false)
  const [teach,setTeach]=useState(false)

  async function refresh(){
    setLoading(true)
    try{
      const [revenue,cognition]=await Promise.all([
        acApi<RevenueData>("/api/ac-whatsapp/revenue-intelligence/bootstrap"),
        acApi<CommandData>("/api/ac-whatsapp/commercial-cognition/command").catch(()=>null),
      ])
      setData(revenue);setCommand(cognition);setError(null)
    }catch(cause){setError(cause instanceof Error?cause.message:String(cause))}
    finally{setLoading(false)}
  }
  useEffect(()=>{void refresh()},[])
  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setPalette(value=>!value)}
      if(event.key==="Escape"){setPalette(false)}
    }
    window.addEventListener("keydown",listener);return()=>window.removeEventListener("keydown",listener)
  },[])

  const setting=data?.settings?.find(row=>row.scope_type==="global"&&!row.scope_id)||null
  const mode=String(setting?.autonomy_mode||"manual")
  const maturityAverage=useMemo(()=>{
    const rows=[...(data?.maturity||[]),...(command?.maturity||[])]
    if(!rows.length)return 0
    return Math.round(rows.reduce((sum,row)=>sum+pct(row.score),0)/rows.length)
  },[data,command])
  const tracked=Math.max(data?.states?.length||0,command?.cognition?.length||0,1)
  const autonomous=(data?.states||[]).filter(row=>["selected_auto","account_auto"].includes(String(row.mode))).length+(command?.counts?.green||0)
  const coverage=clamp(Math.round(Math.min(tracked,autonomous)/tracked*100))
  const knowledgeHealth=clamp(Math.round(35+Math.min(65,(command?.counts?.knowledge||0)/2)))
  const readiness=clamp(Math.round(coverage*.26+maturityAverage*.24+knowledgeHealth*.22+pct(setting?.min_autonomy_confidence||.82)*.12+(accounts.filter(row=>row.status==="connected").length?16:0)))
  const connected=accounts.filter(row=>row.status==="connected").length

  async function setAutonomy(next:string){
    setBusy(true)
    try{
      await acApi("/api/ac-whatsapp/revenue-intelligence/autonomy",{method:"PATCH",body:JSON.stringify({
        scope_type:"global",autonomy_mode:next,enabled:true,
        min_autonomy_confidence:setting?.min_autonomy_confidence||.82,
        min_assist_confidence:setting?.min_assist_confidence||.55,
        commercial_intensity_cap:setting?.commercial_intensity_cap||5,
        after_hours_start:setting?.after_hours_start||"19:00",after_hours_end:setting?.after_hours_end||"08:00",
        timezone:setting?.timezone||"Africa/Casablanca",overflow_threshold:setting?.overflow_threshold||25,
        reason:"Sovereign Automation Command Experience",
      })})
      await refresh();setNotice({tone:"success",title:"Autonomie reconfigurée",description:`Le portefeuille opère maintenant en mode ${titleCase(next)}. Les garde-fous restent prioritaires.`})
    }catch(cause){const f=friendlyAcError(cause);setNotice({tone:"danger",title:f.title,description:f.description})}
    finally{setBusy(false)}
  }

  const shellProps={data:data as RevenueData,command,setting,accounts,onRefresh:refresh,onNotice:setNotice,onTeach:()=>setTeach(true)}

  return <div data-acw-revenue-intelligence data-acx-command-experience="true" className="acx-root">
    <CommandHero mode={mode} readiness={readiness} coverage={coverage} maturity={maturityAverage} knowledgeHealth={knowledgeHealth} connected={connected} accounts={accounts.length} doctrines={command?.counts?.doctrineNodes||0} onTeach={()=>setTeach(true)} onPalette={()=>setPalette(true)} onRefresh={refresh} onPause={()=>void setAutonomy("manual")} busy={busy}/>
    {error?<NoticeBanner tone="danger" {...friendlyAcError(error)}/>:null}
    {notice?<NoticeBanner tone={notice.tone} title={notice.title} description={notice.description} onClose={()=>setNotice(null)}/>:null}
    <CommandNavigation tab={tab} onTab={setTab} data={data} command={command}/>
    {loading&&!data?<CommandLoading/>:null}
    {!loading&&data?<div className="acx-command-grid">
      <IntelligenceRail data={data} command={command} setting={setting} readiness={readiness} coverage={coverage} maturity={maturityAverage}/>
      <main className="acx-command-canvas">
        {tab==="cockpit"?<AutonomyPulse {...shellProps} busy={busy} onMode={setAutonomy} readiness={readiness} coverage={coverage}/>:null}
        {tab==="doctrines"?<DoctrineUniverse {...shellProps}/>:null}
        {tab==="import"?<ImportStudio {...shellProps}/>:null}
        {tab==="journeys"?<JourneyOrchestrator {...shellProps}/>:null}
        {tab==="maturity"?<MaturityLab {...shellProps}/>:null}
        {tab==="simulation"?<SimulationLab {...shellProps}/>:null}
        {tab==="governance"?<Governance {...shellProps}/>:null}
        {tab==="runtime"?<RuntimeIntelligence {...shellProps}/>:null}
      </main>
      <ContextRail tab={tab} data={data} command={command} setting={setting} readiness={readiness} coverage={coverage} maturity={maturityAverage} onTeach={()=>setTeach(true)} onTab={setTab}/>
    </div>:null}
    {palette?<CommandPalette onClose={()=>setPalette(false)} onTab={id=>{setTab(id);setPalette(false)}} onTeach={()=>{setPalette(false);setTeach(true)}} onRefresh={()=>{setPalette(false);void refresh()}} onPause={()=>{setPalette(false);void setAutonomy("manual")}}/>:null}
    {teach&&data?<TeachBrainModal data={data} onClose={()=>setTeach(false)} onSaved={async()=>{setTeach(false);await refresh();setNotice({tone:"success",title:"AngelCare a reçu un nouvel enseignement",description:"La connaissance ou doctrine est enregistrée dans le système gouverné et immédiatement disponible selon son périmètre."})}} onNotice={setNotice}/>:null}
  </div>
}

function CommandHero({mode,readiness,coverage,maturity,knowledgeHealth,connected,accounts,doctrines,onTeach,onPalette,onRefresh,onPause,busy}:{mode:string;readiness:number;coverage:number;maturity:number;knowledgeHealth:number;connected:number;accounts:number;doctrines:number;onTeach:()=>void;onPalette:()=>void;onRefresh:()=>Promise<void>;onPause:()=>void;busy:boolean}){
  return <section className="acx-hero">
    <div className="acx-hero-scan"/><div className="acx-hero-orbit acx-hero-orbit-a"/><div className="acx-hero-orbit acx-hero-orbit-b"/>
    <div className="acx-hero-main">
      <div className="acx-hero-title-wrap">
        <div className="acx-brand-sigil"><BrainCircuit/></div>
        <div><p className="acx-kicker">ANGELCARE · SOVEREIGN AUTONOMY COMMAND</p><h2>Commercial cognition, revenue, learning and control — in one governed operating environment.</h2><p className="acx-subtitle">Perceive → reason → act → sell → learn → mature. One commercial brain, observable at every decision and controllable without reopening the architecture.</p></div>
      </div>
      <div className="acx-hero-actions">
        <button className="acx-button acx-button-primary" onClick={onTeach}><Sparkles/>Teach AngelCare</button>
        <button className="acx-button" onClick={onPalette}><Command/>Command <kbd>⌘K</kbd></button>
        <button className="acx-icon-button" onClick={()=>void onRefresh()} aria-label="Refresh"><RefreshCw/></button>
        <button className="acx-button acx-button-danger" disabled={busy||mode==="manual"} onClick={onPause}><CirclePause/>Pause fleet</button>
      </div>
    </div>
    <div className="acx-hero-instruments">
      <HeroGauge label="Autonomy readiness" value={readiness} tone="blue" detail="weighted operating readiness"/>
      <HeroGauge label="Portfolio coverage" value={coverage} tone="cyan" detail="relationships under governed scope"/>
      <HeroGauge label="Proven maturity" value={maturity} tone="violet" detail="evidence-weighted maturity"/>
      <HeroGauge label="Knowledge health" value={knowledgeHealth} tone="emerald" detail={`${doctrines} executable doctrine nodes`}/>
      <div className="acx-mode-instrument"><span>OPERATING MODE</span><strong>{titleCase(mode)}</strong><div className="acx-mode-line"><i className={cx("acx-status-dot",mode!=="manual"&&"is-live")}/>{connected}/{accounts} transport account{accounts===1?"":"s"} ready</div></div>
    </div>
  </section>
}

function HeroGauge({label,value,tone,detail}:{label:string;value:number;tone:string;detail:string}){
  return <div className="acx-gauge-card"><div className={cx("acx-ring",`tone-${tone}`)} style={{"--value":`${value*3.6}deg`} as any}><span>{value}%</span></div><div><p>{label}</p><strong>{detail}</strong></div></div>
}

function CommandNavigation({tab,onTab,data,command}:{tab:Tab;onTab:(id:Tab)=>void;data:RevenueData|null;command:CommandData|null}){
  return <nav className="acx-nav" aria-label="Automation command workspaces">{tabs.map(item=>{const Icon=item.icon;const active=item.id===tab;let signal="";if(item.id==="governance"&&Number(data?.counts?.proposals||0)>0)signal=String(data?.counts?.proposals);if(item.id==="runtime"&&Number(data?.counts?.runtimeWarnings||0)>0)signal=String(data?.counts?.runtimeWarnings);if(item.id==="maturity"&&Number(command?.counts?.learningCandidates||0)>0)signal=String(command?.counts?.learningCandidates);return <button key={item.id} onClick={()=>onTab(item.id)} className={cx("acx-nav-item",active&&"is-active")}><Icon/><span>{item.label}</span>{signal?<b>{signal}</b>:null}</button>})}</nav>
}

function CommandLoading(){return <div className="acx-loading"><div className="acx-loading-core"><BrainCircuit/><span>Synchronising the commercial nervous system…</span></div></div>}

function IntelligenceRail({data,command,setting,readiness,coverage,maturity}:{data:RevenueData;command:CommandData|null;setting:any;readiness:number;coverage:number;maturity:number}){
  const risks=(command?.counts?.red||0)+(data.counts?.runtimeWarnings||0)
  const learning=command?.counts?.learningCandidates||0
  return <aside className="acx-rail acx-rail-left">
    <RailSection eyebrow="SYSTEM INTELLIGENCE" title="Operating pulse" icon={Signal}>
      <RailMetric label="Autonomy readiness" value={`${readiness}%`} meter={readiness}/>
      <RailMetric label="Coverage" value={`${coverage}%`} meter={coverage}/>
      <RailMetric label="Maturity" value={`${maturity}%`} meter={maturity}/>
    </RailSection>
    <RailSection eyebrow="COGNITION" title="Relationship brain" icon={BrainCircuit}>
      <RailFact label="Tracked states" value={command?.counts?.cognition||data.states.length}/>
      <RailFact label="Green autonomy" value={command?.counts?.green||0} good/>
      <RailFact label="Escalations" value={command?.counts?.red||0} risk={Number(command?.counts?.red||0)>0}/>
      <RailFact label="Scheduled actions" value={command?.counts?.pendingEvents||0}/>
    </RailSection>
    <RailSection eyebrow="LEARNING" title="Brain growth" icon={GraduationCap}>
      <RailFact label="Doctrine nodes" value={command?.counts?.doctrineNodes||0}/>
      <RailFact label="Knowledge entities" value={command?.counts?.knowledge||0}/>
      <RailFact label="Candidates" value={learning} risk={learning>0}/>
      <RailFact label="Maturity domains" value={command?.counts?.maturityDomains||data.maturity.length}/>
    </RailSection>
    <div className={cx("acx-rail-alert",risks>0?"is-warning":"is-clear")}><Shield/><div><strong>{risks>0?`${risks} governed signal${risks===1?"":"s"}`:"Control envelope clear"}</strong><span>Truth, consent and human sovereignty remain above commercial pressure.</span></div></div>
    <div className="acx-rail-foot"><LockKeyhole/>Policy floor {Math.round(Number(setting?.min_autonomy_confidence||.82)*100)}%</div>
  </aside>
}

function ContextRail({tab,data,command,setting,readiness,coverage,maturity,onTeach,onTab}:{tab:Tab;data:RevenueData;command:CommandData|null;setting:any;readiness:number;coverage:number;maturity:number;onTeach:()=>void;onTab:(id:Tab)=>void}){
  const weak=[...(data.maturity||[]),...(command?.maturity||[])].filter(row=>pct(row.score)<55||Number(row.samples||0)<8).slice(0,4)
  const pending=(data.proposals||[]).filter(row=>["proposed","under_review"].includes(String(row.status))).slice(0,4)
  const risks=(command?.cognition||[]).filter(row=>row.eligibility==="red"||row.escalation_flag).slice(0,4)
  return <aside className="acx-rail acx-rail-right">
    {tab==="cockpit"?<><RailSection eyebrow="NEXT LEVER" title="Raise autonomy safely" icon={Target}><InsightAction title={readiness<80?"Readiness below strategic threshold":"Autonomy ready for expansion"} text={readiness<80?`Readiness is ${readiness}%. Strengthen weak maturity or knowledge before widening fleet authority.`:`Readiness is ${readiness}%. Simulate the next autonomy expansion before activation.`} onClick={()=>onTab(readiness<80?"maturity":"simulation")}/><InsightAction title="Portfolio coverage" text={`${coverage}% of tracked relationships are represented in governed autonomy evidence.`} onClick={()=>onTab("runtime")}/></RailSection><RailSection eyebrow="POLICY" title="Admission envelope" icon={ShieldCheck}><RailFact label="Autonomy floor" value={`${Math.round(Number(setting?.min_autonomy_confidence||.82)*100)}%`}/><RailFact label="Assist floor" value={`${Math.round(Number(setting?.min_assist_confidence||.55)*100)}%`}/><RailFact label="Commercial max" value={`${setting?.commercial_intensity_cap||5}/6`}/></RailSection></>:null}
    {tab==="doctrines"?<><RailSection eyebrow="COVERAGE GAPS" title="Where doctrine is thin" icon={Layers3}>{weak.length?weak.map(row=><Insight key={row.id||row.dimension_key} title={row.dimension_key||"Unmapped domain"} text={`${row.maturity_level||"L0"} · ${Number(row.samples||0)} evidence samples · ${pct(row.score)}% score`}/>):<Insight title="No critical doctrine gap detected" text="Coverage evidence will become more discriminating as runtime samples accumulate."/>}</RailSection><button className="acx-rail-cta" onClick={onTeach}><Sparkles/>Teach a doctrine</button></>:null}
    {tab==="import"?<RailSection eyebrow="INGESTION STANDARD" title="Truth before activation" icon={Database}><Insight title="Parse ≠ understand" text="Every import is mapped, scoped, checked for conflict and only then admitted to runtime."/><Insight title="Knowledge and doctrine stay separate" text="Facts describe AngelCare truth. Doctrines govern behavior and commercial execution."/></RailSection>:null}
    {tab==="journeys"?<RailSection eyebrow="LIFECYCLE" title="Commercial continuity" icon={GitBranch}><RailFact label="Active campaigns" value={(data.campaigns||[]).filter(row=>row.status==="active").length}/><RailFact label="Campaign brains" value={data.counts?.campaignBrains||0}/><RailFact label="Tracked relationships" value={data.states.length}/></RailSection>:null}
    {tab==="maturity"?<><RailSection eyebrow="PROMOTION QUEUE" title="What the brain must earn next" icon={GraduationCap}>{weak.length?weak.map(row=><Insight key={row.id||row.dimension_key} title={`${row.dimension_key||"Domain"} · ${row.maturity_level||"L0"}`} text={`${Number(row.samples||0)} samples · ${Number(row.override_count||row.overrides||0)} overrides · ${pct(row.score)}% evidence score`}/>):<Insight title="Evidence accumulating" text="No weak domain is currently exposed by the available sample."/>}</RailSection><RailSection eyebrow="GLOBAL" title={`${maturity}% proven maturity`} icon={LineChart}><ProgressBar value={maturity} tone={maturity>=70?"emerald":maturity>=50?"blue":"amber"}/></RailSection></>:null}
    {tab==="simulation"?<RailSection eyebrow="FLIGHT RULE" title="Simulate before authority" icon={WandSparkles}><Insight title="Shadow first" text="Use simulations to compare decision quality, confidence, commercial intensity and risk before widening autonomy."/><Insight title="Never promote on appearance" text="A better-looking message is not proof. Outcomes and override rates determine maturity."/></RailSection>:null}
    {tab==="governance"?<><RailSection eyebrow="HUMAN GATE" title="Pending decisions" icon={UserRoundCheck}>{pending.length?pending.map(row=><Insight key={row.id} title={row.title} text={`${titleCase(row.proposal_type)} · ${titleCase(row.status)}`}/>):<Insight title="Governance queue clear" text="No doctrine or maturity proposal currently requires human review."/>}</RailSection></>:null}
    {tab==="runtime"?<><RailSection eyebrow="ESCALATIONS" title="Human expertise requested" icon={AlertTriangle}>{risks.length?risks.map(row=><Insight key={row.id} title={row.escalation_reason||"Escalation"} text={`${titleCase(row.customer_type)} · ${titleCase(row.service_line)} · ${titleCase(row.current_action)}`}/>):<Insight title="No current red cognition state" text="Runtime can still surface amber uncertainty without forcing human takeover."/>}</RailSection><RailSection eyebrow="EVENT QUEUE" title="Durable future actions" icon={Clock3}><RailFact label="Scheduled" value={command?.counts?.pendingEvents||0}/><RailFact label="Failed" value={command?.counts?.failedEvents||0} risk={Number(command?.counts?.failedEvents||0)>0}/></RailSection></>:null}
  </aside>
}

function AutonomyPulse({data,command,setting,accounts,busy,onMode,onRefresh,onNotice,readiness,coverage}:{data:RevenueData;command:CommandData|null;setting:any;accounts:AcWhatsAppAccount[];busy:boolean;onMode:(mode:string)=>void;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void;onTeach:()=>void;readiness:number;coverage:number}){
  const modes=[
    {id:"manual",title:"Human Operations",tag:"Protected",text:"Automation remains contextual and conversation-scoped.",authority:["suggest","inspect","teach"]},
    {id:"assisted",title:"Assisted Operations",tag:"Co-pilot",text:"Cognition proposes action and response while human execution remains sovereign.",authority:["reason","recommend","learn"]},
    {id:"controlled",title:"Controlled Autonomy",tag:"Governed",text:"Eligible relationships execute under confidence, doctrine and risk policy.",authority:["qualify","follow-up","close"]},
    {id:"no_shift",title:"No-Shift Autonomy",tag:"Continuity",text:"Commercial continuity during the configured no-shift window.",authority:["respond","nurture","escalate"]},
    {id:"overflow",title:"Overflow Autonomy",tag:"Capacity",text:"Expands autonomous coverage when queue pressure crosses policy threshold.",authority:["triage","progress","recover"]},
    {id:"campaign",title:"Campaign Autonomy",tag:"Acquisition",text:"Campaign-attributed relationships inherit approved commercial brains.",authority:["inbound","outbound","convert"]},
    {id:"full",title:"Full Commercial Autonomy",tag:"Sovereign",text:"All eligible relationships operate autonomously until a stop condition wins.",authority:["lifecycle","revenue","retention"]},
  ]
  const current=String(setting?.autonomy_mode||"manual")
  const states=data.states||[];const cognition=command?.cognition||[]
  const modeCounts={human:states.filter(r=>["manual","human"].includes(String(r.mode))).length,assist:states.filter(r=>String(r.mode)==="assist").length,selected:states.filter(r=>String(r.mode)==="selected_auto").length,account:states.filter(r=>String(r.mode)==="account_auto").length,green:cognition.filter(r=>r.eligibility==="green").length,amber:cognition.filter(r=>r.eligibility==="amber").length,red:cognition.filter(r=>r.eligibility==="red").length}
  return <div className="acx-workspace-stack">
    <WorkspaceTitle eyebrow="AUTONOMY PULSE" title="Control the commercial brain by authority, evidence and business consequence." description="Operating modes are not presets. Each changes which relationships can act, which authority classes are available, and how aggressively the system may progress a journey." icon={Rocket}/>
    <div className="acx-cockpit-top">
      <Panel className="acx-panel-major" title="Fleet operating systems" eyebrow="AUTONOMY COMMAND" icon={Bot} action={<span className="acx-live-chip"><i/>CURRENT · {titleCase(current)}</span>}>
        <div className="acx-mode-grid">{modes.map((item,index)=>{const active=current===item.id;const eligibility=item.id==="full"?command?.counts?.green||0:item.id==="controlled"?Math.max(command?.counts?.green||0,modeCounts.selected+modeCounts.account):item.id==="assisted"?Math.max(data.states.length,command?.cognition.length||0):0;return <button key={item.id} disabled={busy} onClick={()=>onMode(item.id)} className={cx("acx-mode-card",active&&"is-active")}><div className="acx-mode-card-top"><span className="acx-mode-index">0{index+1}</span><span className="acx-mode-tag">{item.tag}</span>{active?<span className="acx-active-state"><i/>ACTIVE</span>:<ChevronRight/>}</div><h4>{item.title}</h4><p>{item.text}</p><div className="acx-mode-authority">{item.authority.map(x=><span key={x}>{x}</span>)}</div><div className="acx-mode-foot"><span>{eligibility} relationships presently evidenced</span><ArrowRight/></div></button>})}</div>
      </Panel>
      <Panel title="Admission policy" eyebrow="AUTHORITY ENVELOPE" icon={ShieldCheck} className="acx-policy-panel">
        <div className="acx-policy-spectrum"><PolicyGauge label="Autonomy confidence" value={pct(setting?.min_autonomy_confidence||.82)} tone="blue"/><PolicyGauge label="Assist confidence" value={pct(setting?.min_assist_confidence||.55)} tone="cyan"/><PolicyGauge label="Commercial intensity" value={Math.round(Number(setting?.commercial_intensity_cap||5)/6*100)} display={`${setting?.commercial_intensity_cap||5}/6`} tone="violet"/></div>
        <div className="acx-policy-details"><KeyValue label="Overflow" value={`${setting?.overflow_threshold||25} conversations`}/><KeyValue label="No-shift" value={`${String(setting?.after_hours_start||"19:00").slice(0,5)} → ${String(setting?.after_hours_end||"08:00").slice(0,5)}`}/><KeyValue label="Timezone" value={setting?.timezone||"Africa/Casablanca"}/></div>
        <AutonomyPolicyEditor setting={setting} data={data} onRefresh={onRefresh} onNotice={onNotice}/>
      </Panel>
    </div>
    <div className="acx-cockpit-bottom">
      <Panel title="Autonomy portfolio map" eyebrow="LIVE COVERAGE" icon={UsersRound}>
        <div className="acx-segmented-bar"><Segment label="Human" value={modeCounts.human} total={Math.max(states.length,1)} tone="slate"/><Segment label="Assist" value={modeCounts.assist} total={Math.max(states.length,1)} tone="cyan"/><Segment label="Selected Auto" value={modeCounts.selected} total={Math.max(states.length,1)} tone="blue"/><Segment label="Account Auto" value={modeCounts.account} total={Math.max(states.length,1)} tone="violet"/></div>
        <div className="acx-portfolio-grid"><PortfolioStat label="GREEN" value={modeCounts.green} text="Autonomous confidence" tone="emerald"/><PortfolioStat label="AMBER" value={modeCounts.amber} text="Clarify / conservative" tone="amber"/><PortfolioStat label="RED" value={modeCounts.red} text="Human expertise" tone="rose"/><PortfolioStat label="COVERAGE" value={`${coverage}%`} text="Governed portfolio" tone="blue"/></div>
      </Panel>
      <Panel title="Commercial impact" eyebrow="BUSINESS CONSEQUENCE" icon={BarChart3}>
        <CommercialImpact data={data} command={command}/>
      </Panel>
      <Panel title="Transport & execution" eyebrow="DELIVERY CAPACITY" icon={Network}>
        <div className="acx-account-list">{accounts.map(account=><div key={account.id} className="acx-account-row"><div className="acx-account-icon"><Signal/></div><div><strong>{account.name}</strong><span>{account.department||"AngelCare"} · {account.openwa_session_id?"session bound":"session missing"}</span></div><StatusPill status={account.status} compact/></div>)}</div>
      </Panel>
    </div>
  </div>
}

function DoctrineUniverse({data,command,onRefresh,onNotice}:{data:RevenueData;command:CommandData|null;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void;accounts:AcWhatsAppAccount[];setting:any;onTeach:()=>void}){
  const [query,setQuery]=useState("")
  const [selectedPack,setSelectedPack]=useState<string>(data.packs?.[0]?.id||"")
  const [editor,setEditor]=useState<any|null>(null)
  const [loading,setLoading]=useState(false)
  const packs=(data.packs||[]).filter(row=>`${row.name} ${row.service_line} ${row.customer_type}`.toLowerCase().includes(query.toLowerCase()))
  const current=data.packs.find(row=>row.id===selectedPack)||packs[0]||null
  const nodes=(command?.doctrineNodes||[]).filter(row=>!current||row.pack_id===current.id)
  const byStage=useMemo(()=>journeyStages.map(stage=>({stage,nodes:nodes.filter(row=>String(row.journey_stage||"all")==stage)})).filter(group=>group.nodes.length),[nodes])
  async function openEditor(packId:string){setLoading(true);try{const all=await acApi<any[]>("/api/ac-whatsapp/revenue-intelligence/doctrines");setEditor(all.find(pack=>pack.id===packId)||null)}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}finally{setLoading(false)}}
  async function action(packId:string,next:string){try{await acApi(`/api/ac-whatsapp/revenue-intelligence/doctrines/${packId}`,{method:"PATCH",body:JSON.stringify({action:next,reason:"Doctrine Universe Command Experience"})});await onRefresh();onNotice({tone:"success",title:"Doctrine governed",description:`${titleCase(next)} applied and audited.`})}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}}
  const maxStage=Math.max(...byStage.map(group=>group.nodes.length),1)
  return <div className="acx-workspace-stack">
    <WorkspaceTitle eyebrow="DOCTRINE UNIVERSE" title="See the commercial brain as a living behavioral system — not a list of templates." description="Inspect coverage, lifecycle position, maturity, action authority and conflicts. Every doctrine stays versioned, scoped, editable, pausable and simulatable." icon={Layers3}/>
    <div className="acx-doctrine-layout">
      <Panel title="Doctrine packs" eyebrow="BEHAVIORAL LIBRARY" icon={BookOpen} className="acx-doctrine-packs" action={<div className="acx-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find doctrine…"/></div>}>
        <div className="acx-pack-list">{packs.map(pack=><button key={pack.id} onClick={()=>setSelectedPack(pack.id)} className={cx("acx-pack-row",current?.id===pack.id&&"is-selected")}><div><span>{pack.service_line||"all"} · {pack.customer_type||"all"}</span><strong>{pack.name}</strong><small>{pack.description||pack.default_goal||"Governed commercial doctrine"}</small></div><div className="acx-pack-score"><b>{pack.maturity_level||"L0"}</b><em>{Math.round((levelWeight(pack.maturity_level||"L0")+pct(pack.coverage_score)+pct(pack.applicability_score))/3)}%</em></div></button>)}</div>
      </Panel>
      <Panel title={current?.name||"Doctrine intelligence graph"} eyebrow="EXECUTABLE GRAPH" icon={Workflow} className="acx-doctrine-graph" action={current?<div className="acx-inline-actions"><button onClick={()=>void openEditor(current.id)} disabled={loading}><Settings2/>Open doctrine</button>{current.status==="active"?<button onClick={()=>void action(current.id,"pause")}><CirclePause/>Pause</button>:<button onClick={()=>void action(current.id,"publish")}><CirclePlay/>Activate</button>}</div>:null}>
        {current?<><div className="acx-doctrine-head"><StatusPill status={current.status} compact/><span>{current.service_line||"ALL"}</span><span>{current.customer_type||"ALL"}</span><span>v{current.version||1}</span><span>{nodes.length} nodes</span></div>
        <div className="acx-graph-canvas">{byStage.length?byStage.map(group=><div key={group.stage} className="acx-graph-stage"><div className="acx-graph-stage-head"><span>{journeyLabels[group.stage]||titleCase(group.stage)}</span><b>{group.nodes.length}</b></div><div className="acx-graph-stage-line"/>{group.nodes.slice(0,10).map(node=><div key={node.id} className="acx-doctrine-node"><div className="acx-node-dot"/><div><span>{titleCase(node.action_type||"reply")}</span><strong>{node.title}</strong><small>{titleCase(node.intent_family||"all")} · priority {node.priority||50} · {node.status}</small></div></div>)}</div>):<EmptyState icon={Layers3} title="Doctrine nodes will materialise here" text="Import or teach doctrine nodes to expose the executable behavioral graph."/>}</div></>:<EmptyState icon={BookOpen} title="No doctrine selected" text="Select a governed doctrine pack to inspect its executable universe."/>}
      </Panel>
    </div>
    <Panel title="Doctrine coverage radar" eyebrow="BLIND-SPOT DETECTION" icon={Eye}>
      <div className="acx-coverage-radar">{journeyStages.map(stage=>{const count=nodes.filter(row=>String(row.journey_stage||"all")==stage).length;const value=Math.round(count/maxStage*100);return <div key={stage} className="acx-radar-row"><span>{journeyLabels[stage]}</span><div><i style={{width:`${value}%`}}/></div><b>{count}</b></div>})}</div>
    </Panel>
    {editor?<DoctrineEditorModal pack={editor} onClose={()=>setEditor(null)} onSaved={async()=>{setEditor(null);await onRefresh()}} onNotice={onNotice}/>:null}
  </div>
}

function DoctrineEditorModal({pack,onClose,onSaved,onNotice}:{pack:any;onClose:()=>void;onSaved:()=>Promise<void>;onNotice:(n:Notice)=>void}){
  const [selectedId,setSelectedId]=useState<string>(pack.nodes?.[0]?.id||"")
  const selected=pack.nodes?.find((node:any)=>node.id===selectedId)||null
  const [draft,setDraft]=useState<any>(selected||{pack_id:pack.id,title:"",code:"",customer_type:pack.customer_type||"all",service_line:pack.service_line||"all",journey_stage:"all",intent_family:"all",trigger_terms:[],objective:pack.default_goal||"advance_commercial_journey",tone_profile:{primary:"warm_commercial"},commercial_intensity:3,action_type:"reply",response_guidance:"",qualification_questions:[],priority:50,maturity_weight:.25,status:"active"})
  const [busy,setBusy]=useState(false)
  useEffect(()=>{const node=pack.nodes?.find((row:any)=>row.id===selectedId);if(node)setDraft(node)},[selectedId,pack.nodes])
  async function save(){if(!String(draft.title||"").trim())return;setBusy(true);try{if(selectedId)await acApi(`/api/ac-whatsapp/revenue-intelligence/doctrines/nodes/${selectedId}`,{method:"PATCH",body:JSON.stringify(draft)});else await acApi("/api/ac-whatsapp/revenue-intelligence/doctrines/nodes",{method:"POST",body:JSON.stringify({...draft,pack_id:pack.id})});await onSaved();onNotice({tone:"success",title:"Doctrine node saved",description:"Behavior, scope and commercial authority have been persisted and audited."})}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}finally{setBusy(false)}}
  return <ModalFrame title={pack.name} eyebrow="Doctrine Intelligence Editor" onClose={onClose} wide><div className="acx-editor-layout"><aside className="acx-editor-node-list"><button className={cx("acx-editor-node",!selectedId&&"is-selected")} onClick={()=>{setSelectedId("");setDraft({pack_id:pack.id,title:"",code:"",customer_type:pack.customer_type||"all",service_line:pack.service_line||"all",journey_stage:"all",intent_family:"all",objective:pack.default_goal||"advance_commercial_journey",commercial_intensity:3,action_type:"reply",response_guidance:"",qualification_questions:[],priority:50,maturity_weight:.25,status:"active"})}}><Sparkles/>New doctrine node</button>{(pack.nodes||[]).map((node:any)=><button key={node.id} className={cx("acx-editor-node",selectedId===node.id&&"is-selected")} onClick={()=>setSelectedId(node.id)}><span>{node.journey_stage||"all"}</span><strong>{node.title}</strong><small>{node.action_type||"reply"} · p{node.priority||50}</small></button>)}</aside><div className="acx-editor-form"><div className="acx-form-grid"><Field label="Title"><input className="ri-input" value={draft.title||""} onChange={e=>setDraft((d:any)=>({...d,title:e.target.value}))}/></Field><Field label="Code"><input className="ri-input" value={draft.code||""} onChange={e=>setDraft((d:any)=>({...d,code:e.target.value}))}/></Field><Field label="Customer type"><input className="ri-input" value={draft.customer_type||"all"} onChange={e=>setDraft((d:any)=>({...d,customer_type:e.target.value}))}/></Field><Field label="Service line"><input className="ri-input" value={draft.service_line||"all"} onChange={e=>setDraft((d:any)=>({...d,service_line:e.target.value}))}/></Field><Field label="Journey stage"><input className="ri-input" value={draft.journey_stage||"all"} onChange={e=>setDraft((d:any)=>({...d,journey_stage:e.target.value}))}/></Field><Field label="Intent family"><input className="ri-input" value={draft.intent_family||"all"} onChange={e=>setDraft((d:any)=>({...d,intent_family:e.target.value}))}/></Field><Field label="Action type"><input className="ri-input" value={draft.action_type||"reply"} onChange={e=>setDraft((d:any)=>({...d,action_type:e.target.value}))}/></Field><Field label="Commercial intensity"><input type="number" min={0} max={6} className="ri-input" value={draft.commercial_intensity??3} onChange={e=>setDraft((d:any)=>({...d,commercial_intensity:Number(e.target.value)}))}/></Field><Field label="Objective" wide><input className="ri-input" value={draft.objective||""} onChange={e=>setDraft((d:any)=>({...d,objective:e.target.value}))}/></Field><Field label="Response guidance" wide><textarea rows={5} className="ri-input" value={draft.response_guidance||""} onChange={e=>setDraft((d:any)=>({...d,response_guidance:e.target.value}))}/></Field><Field label="Qualification questions · | separated" wide><textarea rows={3} className="ri-input" value={Array.isArray(draft.qualification_questions)?draft.qualification_questions.join(" | "):String(draft.qualification_questions||"")} onChange={e=>setDraft((d:any)=>({...d,qualification_questions:e.target.value.split("|").map(x=>x.trim()).filter(Boolean)}))}/></Field></div><div className="acx-modal-actions"><button onClick={onClose}>Cancel</button><button className="is-primary" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save & audit"}</button></div></div></div></ModalFrame>
}

function ImportStudio({data,onRefresh,onNotice}:{data:RevenueData;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void;command:CommandData|null;accounts:AcWhatsAppAccount[];setting:any;onTeach:()=>void}){
  const fileRef=useRef<HTMLInputElement|null>(null);const [file,setFile]=useState<File|null>(null);const [packName,setPackName]=useState("");const [busy,setBusy]=useState(false);const [result,setResult]=useState<any>(null)
  async function submit(){if(!file)return;setBusy(true);try{const form=new FormData();form.append("file",file);form.append("pack_name",packName||file.name.replace(/\.csv$/i,""));const response=await fetch("/api/ac-whatsapp/revenue-intelligence/doctrines/import",{method:"POST",body:form,credentials:"include"});const json=await response.json();if(!response.ok||json?.ok===false)throw new Error(json?.error||`HTTP_${response.status}`);setResult(json.data);await onRefresh();onNotice({tone:json.data.green?"success":"warning",title:json.data.green?"Knowledge consumed and applicable":"Human review required",description:json.data.green?"The doctrine pack passed mapping, scope and applicability gates.":"The import was consumed, but conflicts or blocked rows require governance."})}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}finally{setBusy(false)}}
  const recent=(data.imports||[]).slice(0,10)
  return <div className="acx-workspace-stack"><WorkspaceTitle eyebrow="KNOWLEDGE INGESTION LAB" title="Upload is only the first second. Understanding, conflict detection and activation are the product." description="Structured doctrine enters through a three-gate pipeline: ingest → understand → activate. The operator sees exactly what the brain consumed and what remains unsafe." icon={FileSpreadsheet}/>
    <div className="acx-ingest-pipeline"><IngestStep index="01" title="INGEST" active={!result} text="CSV source, provenance and row integrity"/><ArrowRight/><IngestStep index="02" title="UNDERSTAND" active={Boolean(result)} text="Mapping, scope, conflicts and applicability"/><ArrowRight/><IngestStep index="03" title="ACTIVATE" active={Boolean(result?.green)} text="Governed runtime admission"/></div>
    <div className="acx-import-layout"><Panel title="Doctrine intake gateway" eyebrow="STRUCTURED COMMERCIAL INTELLIGENCE" icon={Upload}><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)}/><button className="acx-dropzone" onClick={()=>fileRef.current?.click()}><div className="acx-drop-icon"><Upload/></div><strong>{file?.name||"Select a doctrine CSV"}</strong><span>Drag-free deliberate intake · mapping · conflict detection · applicability · governance</span></button><div className="acx-import-controls"><input value={packName} onChange={e=>setPackName(e.target.value)} placeholder="Doctrine pack name"/><button disabled={!file||busy} onClick={()=>void submit()}>{busy?<RefreshCw className="animate-spin"/>:<Import/>}{busy?"Consuming…":"Consume & understand"}</button></div>{result?<ImportResult result={result}/>:null}</Panel>
    <Panel title="Recent consumption evidence" eyebrow="INGESTION MEMORY" icon={BadgeCheck}><div className="acx-import-history">{recent.length?recent.map(row=><div key={row.id} className="acx-history-row"><div><strong>{row.file_name}</strong><span>{formatRelative(row.created_at)} · {row.stats?.rows||0} rows · fit {row.stats?.applicability||0}%</span></div><StatusPill status={row.status} compact/></div>):<EmptyState icon={FileSpreadsheet} title="No doctrine ingestion evidence yet" text="The first import will create a permanent, inspectable consumption record."/>}</div></Panel></div>
  </div>
}

function JourneyOrchestrator({data,command,onRefresh,onNotice}:{data:RevenueData;command:CommandData|null;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void;accounts:AcWhatsAppAccount[];setting:any;onTeach:()=>void}){
  const [campaignBusy,setCampaignBusy]=useState("")
  async function assignCampaign(id:string,packId:string){try{await acApi(`/api/ac-whatsapp/revenue-intelligence/campaigns/${id}/automation`,{method:"PATCH",body:JSON.stringify({doctrine_pack_id:packId||null,goal:"convert_campaign_response"})});await onRefresh();onNotice({tone:"success",title:"Campaign brain linked",description:"Inbound and outbound campaign conversations can now inherit the selected commercial doctrine."})}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}}
  async function composeOutbound(campaign:any){if(!campaign.automation_doctrine_pack_id){onNotice({tone:"warning",title:"Doctrine required",description:"Link a doctrine pack before generating governed prospecting openings."});return}setCampaignBusy(campaign.id);try{const r=await acApi<any>(`/api/ac-whatsapp/revenue-intelligence/campaigns/${campaign.id}/compose-outbound`,{method:"POST",body:JSON.stringify({doctrine_pack_id:campaign.automation_doctrine_pack_id,min_confidence:.48,commercial_intensity_cap:3})});await onRefresh();onNotice({tone:r.ready?"success":"warning",title:r.ready?"Outbound intelligence ready":"Review required",description:`${r.composed||0} governed openings prepared; ${r.review||0} require review.`})}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}finally{setCampaignBusy("")}}
  const stateRows=[...(data.states||[]),...(command?.cognition||[])];const max=Math.max(...journeyStages.map(stage=>stateRows.filter(row=>String(row.journey_stage||row.cognition_state?.signals?.journeyStage||"")===stage).length),1)
  return <div className="acx-workspace-stack"><WorkspaceTitle eyebrow="JOURNEY ORCHESTRATOR" title="Commercial lifecycle is a living state machine, not a funnel poster." description="Every stage exposes real relationship volume, doctrine coverage, maturity and the next commercial responsibility of the autonomous brain." icon={GitBranch}/>
    <Panel title="Lifecycle intelligence corridor" eyebrow="ACQUISITION → REVENUE → RETENTION → EXPANSION" icon={Workflow}><div className="acx-journey-corridor">{journeyStages.map((stage,index)=>{const count=stateRows.filter(row=>String(row.journey_stage||row.cognition_state?.signals?.journeyStage||"")===stage).length;return <div key={stage} className="acx-journey-stage"><div className="acx-journey-stage-index">{String(index+1).padStart(2,"0")}</div><strong>{journeyLabels[stage]}</strong><span>{count} relationships</span><div className="acx-journey-volume"><i style={{height:`${Math.max(8,Math.round(count/max*100))}%`}}/></div></div>})}</div></Panel>
    <div className="acx-journey-lower"><Panel title="Campaign brains" eyebrow="ACQUISITION INTELLIGENCE" icon={Rocket}><div className="acx-campaign-grid">{(data.campaigns||[]).slice(0,18).map(campaign=><div key={campaign.id} className="acx-campaign-card"><div className="acx-campaign-top"><div><span>{campaign.department||"Campaign"}</span><strong>{campaign.name}</strong><small>{campaign.objective||"Commercial acquisition"}</small></div><StatusPill status={campaign.status} compact/></div><select value={campaign.automation_doctrine_pack_id||""} onChange={e=>void assignCampaign(campaign.id,e.target.value)}><option value="">No doctrine linked</option>{data.packs.map(pack=><option key={pack.id} value={pack.id}>{pack.name} · {pack.maturity_level}</option>)}</select><button disabled={campaignBusy===campaign.id||!campaign.automation_doctrine_pack_id} onClick={()=>void composeOutbound(campaign)}>{campaignBusy===campaign.id?<RefreshCw className="animate-spin"/>:<Sparkles/>}Prepare governed openings</button></div>)}</div></Panel>
    <Panel title="Lifecycle operating doctrine" eyebrow="CONTINUITY RULES" icon={Target}><div className="acx-lifecycle-rules"><Rule title="Goal-driven" text="Each stage carries an immediate, relationship, conversion and protection objective."/><Rule title="Dynamic branching" text="Intent, trust, momentum, authority and objection can move the journey without a fixed script."/><Rule title="Post-sale continuity" text="Conversion is not the finish line: activation, satisfaction, retention, expansion and referral remain owned."/><Rule title="Escalation as an action" text="Human expertise is requested when it is commercially or operationally superior, not when the script ends."/></div></Panel></div>
  </div>
}

function MaturityLab({data,command,onRefresh,onNotice}:{data:RevenueData;command:CommandData|null;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void;accounts:AcWhatsAppAccount[];setting:any;onTeach:()=>void}){
  const [busy,setBusy]=useState(false)
  async function recompute(){setBusy(true);try{const result=await acApi<any>("/api/ac-whatsapp/revenue-intelligence/maturity",{method:"POST",body:"{}"});await onRefresh();onNotice({tone:"success",title:"Maturity evidence recomputed",description:`${result.created||0} governance candidate(s) created from current evidence.`})}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}finally{setBusy(false)}}
  const rows=[...(command?.maturity||[]),...(data.maturity||[])].slice(0,60)
  const average=rows.length?Math.round(rows.reduce((sum,row)=>sum+pct(row.score),0)/rows.length):0
  return <div className="acx-workspace-stack"><WorkspaceTitle eyebrow="MATURITY CONSTELLATION" title="Witness the brain becoming competent — dimension by dimension, evidence by evidence." description="Maturity is earned independently by service, journey, intent, action and doctrine. Promotion is visible, measurable and reversible." icon={GraduationCap} action={<button className="acx-button" disabled={busy} onClick={()=>void recompute()}><RefreshCw className={busy?"animate-spin":""}/>Recompute evidence</button>}/>
    <Panel title="Global maturity trajectory" eyebrow="L0 UNKNOWN → L6 EXPERT" icon={LineChart}><div className="acx-maturity-ladder">{["L0","L1","L2","L3","L4","L5","L6"].map((level,index)=>{const threshold=levelWeight(level);const reached=average>=threshold;return <div key={level} className={cx("acx-maturity-step",reached&&"is-reached")}><span>{level}</span><i/><small>{["Unknown","Observed","Guided","Assisted","Controlled Auto","Proven Auto","Expert"][index]}</small></div>})}<div className="acx-maturity-marker" style={{left:`${clamp(average)}%`}}><b>{average}%</b></div></div></Panel>
    <div className="acx-maturity-layout"><Panel title="Capability constellation" eyebrow="SERVICE × CAPABILITY MATURITY" icon={Sparkles}><div className="acx-constellation">{rows.length?rows.map((row,index)=>{const score=pct(row.score);const level=row.maturity_level||"L0";return <div key={row.id||`${row.dimension_key}-${index}`} className={cx("acx-star",score>=70?"is-strong":score>=50?"is-growing":score<30?"is-weak":"")} style={{"--size":`${34+Math.min(40,score*.35)}px`} as any}><span>{level}</span><strong>{row.dimension_key||"Domain"}</strong><small>{score}% · {Number(row.samples||0)} samples</small></div>}):<EmptyState icon={GraduationCap} title="No maturity evidence yet" text="Runtime decisions, outcomes and human corrections will begin to populate the constellation."/>}</div></Panel>
    <Panel title="Promotion candidates & blind spots" eyebrow="WHAT THE BRAIN MUST LEARN" icon={BrainCircuit}><div className="acx-blind-list">{rows.filter(row=>pct(row.score)<55||Number(row.samples||0)<8).slice(0,14).map((row,index)=><div key={row.id||index} className="acx-blind-row"><div><span>{row.maturity_level||"L0"}</span><strong>{row.dimension_key||"Domain"}</strong><small>{Number(row.samples||0)} samples · {Number(row.overrides||row.override_count||0)} overrides</small></div><div className="acx-blind-meter"><i style={{width:`${pct(row.score)}%`}}/><b>{pct(row.score)}%</b></div></div>)}</div></Panel></div>
  </div>
}

function SimulationLab({data,onRefresh,onNotice}:{data:RevenueData;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void;command:CommandData|null;accounts:AcWhatsAppAccount[];setting:any;onTeach:()=>void}){
  const [packId,setPackId]=useState(data.packs?.[0]?.id||"")
  const [message,setMessage]=useState("Bonjour, je dirige une crèche à Rabat. Nous cherchons une solution plus professionnelle mais je dois comprendre la valeur et le budget avant d'impliquer mon associée.")
  const [source,setSource]=useState("meta_b2b")
  const [busy,setBusy]=useState(false);const [result,setResult]=useState<any>(null)
  async function simulate(){if(!packId||!message.trim())return;setBusy(true);try{const r=await acApi<any>(`/api/ac-whatsapp/revenue-intelligence/doctrines/${packId}/simulate`,{method:"POST",body:JSON.stringify({message,source})});setResult(r);await onRefresh()}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}finally{setBusy(false)}}
  const decision=result?.output?.decision||{};const reasoning=decision.reasoning||{}
  return <div className="acx-workspace-stack"><WorkspaceTitle eyebrow="COMMERCIAL FLIGHT SIMULATOR" title="Watch the brain reason before you give it more authority." description="Simulate intent, doctrine fusion, confidence, risk, commercial intensity and final action before runtime activation." icon={WandSparkles}/>
    <div className="acx-sim-layout"><Panel title="Scenario injection" eyebrow="CONTROLLED TEST INPUT" icon={MessageSquareText}><div className="acx-sim-form"><label>Doctrine pack<select value={packId} onChange={e=>setPackId(e.target.value)}>{data.packs.map(pack=><option key={pack.id} value={pack.id}>{pack.name}</option>)}</select></label><label>Source<input value={source} onChange={e=>setSource(e.target.value)}/></label><label className="is-wide">Customer message<textarea rows={8} value={message} onChange={e=>setMessage(e.target.value)}/></label><button disabled={busy||!packId} onClick={()=>void simulate()}>{busy?<RefreshCw className="animate-spin"/>:<Sparkles/>}Run governed simulation</button></div></Panel>
    <Panel title="Decision flight recorder" eyebrow="EXPLAINABLE COGNITION" icon={Target}>{result?<><div className="acx-sim-flight"><FlightStep label="MESSAGE" value="Captured" state="done"/><FlightStep label="INTENT" value={titleCase(reasoning.intentFamily||reasoning.intent||"classified")} state="done"/><FlightStep label="DOCTRINE" value={`${decision.doctrineNodeIds?.length||reasoning.doctrine?.selected||"fused"}`} state="done"/><FlightStep label="ACTION" value={titleCase(decision.action?.type||decision.action||"selected")} state="done"/><FlightStep label="CONFIDENCE" value={`${pct(decision.confidence?.aggregate||decision.confidence)}%`} state={pct(decision.confidence?.aggregate||decision.confidence)>=70?"good":"warn"}/><FlightStep label="RISK" value={`${pct(decision.risk?.aggregate||0)}%`} state={pct(decision.risk?.aggregate||0)>60?"warn":"good"}/></div><div className="acx-sim-result"><div><span>GOVERNED RESPONSE</span><p>{decision.responseText||"No autonomous response — the judge selected a non-message action or escalation."}</p></div><div className="acx-sim-verdict"><small>VERDICT</small><strong>{titleCase(result.verdict||decision.eligibility||"review")}</strong><small>COMMERCIAL INTENSITY</small><strong>{decision.commercialIntensity??"—"}/6</strong></div></div><details className="acx-reasoning"><summary><BrainCircuit/>Inspect complete reasoning evidence</summary><pre>{JSON.stringify(reasoning,null,2)}</pre></details></>:<EmptyState icon={WandSparkles} title="Flight recorder awaiting simulation" text="Inject a realistic commercial situation to expose every decision layer before runtime authority."/>}</Panel></div>
  </div>
}

function Governance({data,setting,onRefresh,onNotice}:{data:RevenueData;setting:any;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void;command:CommandData|null;accounts:AcWhatsAppAccount[];onTeach:()=>void}){
  async function review(id:string,status:string){try{await acApi(`/api/ac-whatsapp/revenue-intelligence/governance/${id}`,{method:"PATCH",body:JSON.stringify({status})});await onRefresh();onNotice({tone:"success",title:"Governance decision recorded",description:`Proposal is now ${titleCase(status)} and remains auditable.`})}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}}
  const matrix=[
    ["Answer","✓","✓","✓","✓"],["Qualify","✓","✓","✓","✓"],["Follow-up","suggest","✓","✓","✓"],["Send catalogue","suggest","✓","✓","✓"],["Meeting","suggest","guarded","✓","✓"],["Offer","suggest","guarded","✓","✓"],["Discount","human","human","policy","policy"],["Contract exception","human","human","human","human"],
  ]
  return <div className="acx-workspace-stack"><WorkspaceTitle eyebrow="AUTHORITY & GOVERNANCE" title="Make autonomy legible: exactly what the brain may do, under which evidence, and where humans remain superior." description="Authority is explicit. High-impact changes stay auditable, reversible and governed by human sovereignty." icon={ShieldCheck}/>
    <Panel title="Authority matrix" eyebrow="CAPABILITY × AUTONOMY MODE" icon={Shield}><div className="acx-authority-matrix"><div className="acx-matrix-row is-head"><span>Capability</span><b>Assist</b><b>Selected Auto</b><b>Fleet Auto</b><b>Full Auto</b></div>{matrix.map(row=><div key={row[0]} className="acx-matrix-row"><strong>{row[0]}</strong>{row.slice(1).map((cell,index)=><span key={index} className={cx(cell==="✓"&&"is-yes",cell==="human"&&"is-human",cell==="guarded"&&"is-guarded",cell==="policy"&&"is-policy")}>{cell}</span>)}</div>)}</div></Panel>
    <div className="acx-governance-lower"><Panel title="Human validation gateway" eyebrow="LEARNING CANDIDATES" icon={UserRoundCheck}><div className="acx-proposal-list">{data.proposals.length?data.proposals.map(row=><div key={row.id} className="acx-proposal-card"><div><span>{titleCase(row.proposal_type)}</span><strong>{row.title}</strong><p>{row.description}</p><small>{compactJson(row.evidence,180)}</small></div><div className="acx-proposal-actions"><StatusPill status={row.status} compact/>{["proposed","under_review"].includes(row.status)?<><button className="is-reject" onClick={()=>void review(row.id,"rejected")}><XCircle/>Reject</button><button className="is-approve" onClick={()=>void review(row.id,"approved")}><CheckCircle2/>Approve</button></>:null}</div></div>):<EmptyState icon={ShieldCheck} title="Governance queue clear" text="The brain can observe and propose improvements, but it cannot silently publish doctrine mutations."/>}</div></Panel>
    <Panel title="Admission policy composer" eyebrow="CONSEQUENCE-AWARE SETTINGS" icon={SlidersHorizontal}><PolicyComposer setting={setting} data={data} onRefresh={onRefresh} onNotice={onNotice}/></Panel></div>
  </div>
}

function RuntimeIntelligence({data,command,onRefresh}:{data:RevenueData;command:CommandData|null;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void;accounts:AcWhatsAppAccount[];setting:any;onTeach:()=>void}){
  const stream=useMemo(()=>[
    ...(data.runtime||[]).map(row=>({...row,_kind:"runtime",_time:row.created_at})),
    ...(command?.actionRuns||[]).map(row=>({...row,_kind:"action",_time:row.created_at})),
    ...(command?.audit||[]).map(row=>({...row,_kind:"audit",_time:row.created_at})),
    ...(command?.events||[]).map(row=>({...row,_kind:"event",_time:row.created_at})),
  ].sort((a,b)=>safeDate(b._time)-safeDate(a._time)).slice(0,80),[data.runtime,command])
  return <div className="acx-workspace-stack"><WorkspaceTitle eyebrow="LIVE NERVOUS SYSTEM" title="Watch commercial cognition move through the system as business events, not developer logs." description="Inbound signals, goals, decisions, durable follow-ups, execution and escalation appear as a single operational stream." icon={Zap} action={<button className="acx-button" onClick={()=>void onRefresh()}><RefreshCw/>Refresh stream</button>}/>
    <div className="acx-runtime-layout"><Panel title="Commercial nervous-system telemetry" eyebrow="LIVE EVENT STREAM" icon={Activity}><div className="acx-runtime-stream">{stream.length?stream.map((row,index)=><RuntimeEvent key={`${row._kind}-${row.id||index}`} row={row}/>):<EmptyState icon={Activity} title="Runtime quiet" text="The next cognition event, scheduled action or execution result will appear here."/>}</div></Panel>
    <div className="acx-runtime-side"><Panel title="Durable future actions" eyebrow="EVENT QUEUE" icon={Clock3}><div className="acx-event-queue">{(command?.events||[]).slice(0,10).map(row=><div key={row.id}><div><strong>{titleCase(row.event_type)}</strong><span>{row.run_at?formatRelative(row.run_at):formatRelative(row.created_at)}</span></div><StatusPill status={row.status} compact/></div>)}</div></Panel><Panel title="Autonomous outcomes" eyebrow="BUSINESS EVIDENCE" icon={BarChart3}><CommercialImpact data={data} command={command}/></Panel></div></div>
  </div>
}

function CommandPalette({onClose,onTab,onTeach,onRefresh,onPause}:{onClose:()=>void;onTab:(id:Tab)=>void;onTeach:()=>void;onRefresh:()=>void;onPause:()=>void}){
  const [query,setQuery]=useState("")
  const commands=[
    ...tabs.map(item=>({label:`Open ${item.label}`,detail:`Workspace · ${item.short}`,icon:item.icon,action:()=>onTab(item.id)})),
    {label:"Teach AngelCare",detail:"Inject knowledge or doctrine",icon:Sparkles,action:onTeach},
    {label:"Refresh commercial brain",detail:"Reload evidence and command state",icon:RefreshCw,action:onRefresh},
    {label:"Pause fleet autonomy",detail:"Return global autonomy to human mode",icon:CirclePause,action:onPause},
  ].filter(item=>`${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="acx-palette-backdrop" onMouseDown={onClose}><div className="acx-palette" onMouseDown={e=>e.stopPropagation()}><div className="acx-palette-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Command the autonomy system…"/><kbd>ESC</kbd></div><div className="acx-palette-results">{commands.map((item,index)=>{const Icon=item.icon;return <button key={`${item.label}-${index}`} onClick={item.action}><span><Icon/></span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ChevronRight/></button>})}</div></div></div>
}

function TeachBrainModal({data,onClose,onSaved,onNotice}:{data:RevenueData;onClose:()=>void;onSaved:()=>Promise<void>;onNotice:(n:Notice)=>void}){
  const [mode,setMode]=useState<"knowledge"|"strategy"|"doctrine"|"correction">("knowledge")
  const [busy,setBusy]=useState(false)
  const [draft,setDraft]=useState<any>({title:"",service_line:"all",customer_type:"all",content:"",priority:80,pack_id:data.packs?.[0]?.id||"",action_type:"reply",objective:"advance_commercial_journey",conversation_id:""})
  async function save(){if(!draft.title.trim())return;setBusy(true);try{
    const code=draft.title.toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"").slice(0,90)||`TEACH_${Date.now()}`
    if(mode==="doctrine")await acApi("/api/ac-whatsapp/revenue-intelligence/doctrines/nodes",{method:"POST",body:JSON.stringify({pack_id:draft.pack_id,title:draft.title,code,customer_type:draft.customer_type,service_line:draft.service_line,journey_stage:"all",intent_family:"all",objective:draft.objective,action_type:draft.action_type,response_guidance:draft.content,priority:draft.priority,status:"active"})})
    else if(mode==="correction")await acApi("/api/ac-whatsapp/commercial-cognition/teach",{method:"POST",body:JSON.stringify({conversation_id:draft.conversation_id,event_type:"operator_correction",correction:draft.content,preferred_action:draft.action_type,notes:draft.title})})
    else await acApi("/api/ac-whatsapp/commercial-cognition/knowledge",{method:"POST",body:JSON.stringify({code,entity_type:mode==="strategy"?"strategy":"knowledge",title:draft.title,content:{text:draft.content},scope:{customer_types:[draft.customer_type],service_lines:[draft.service_line],intent_families:["all"]},truth_status:"validated",priority:draft.priority,active:true,source_kind:"manual"})})
    await onSaved()
  }catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}finally{setBusy(false)}}
  return <ModalFrame title="Teach AngelCare" eyebrow="Manual Growth Gateway" onClose={onClose} wide><div className="acx-teach"><div className="acx-teach-types">{([['knowledge','Knowledge',Database],['strategy','Commercial strategy',Target],['doctrine','Doctrine behavior',Layers3],['correction','Operator correction',UserRoundCheck]] as any[]).map(([id,label,Icon])=><button key={id} onClick={()=>setMode(id)} className={cx(mode===id&&"is-selected")}><Icon/><strong>{label}</strong><span>{id==="knowledge"?"Product/service truth":id==="strategy"?"Selling and lifecycle logic":id==="doctrine"?"Executable behavioral rule":"Evidence from a real case"}</span></button>)}</div><div className="acx-teach-form"><div className="acx-form-grid"><Field label="Teaching title" wide><input className="ri-input" value={draft.title} onChange={e=>setDraft((d:any)=>({...d,title:e.target.value}))}/></Field>{mode==="doctrine"?<Field label="Doctrine pack" wide><select className="ri-input" value={draft.pack_id} onChange={e=>setDraft((d:any)=>({...d,pack_id:e.target.value}))}>{data.packs.map(pack=><option key={pack.id} value={pack.id}>{pack.name}</option>)}</select></Field>:null}{mode==="correction"?<Field label="Conversation ID" wide><input className="ri-input" value={draft.conversation_id} onChange={e=>setDraft((d:any)=>({...d,conversation_id:e.target.value}))} placeholder="Required for correction evidence"/></Field>:null}<Field label="Customer type"><input className="ri-input" value={draft.customer_type} onChange={e=>setDraft((d:any)=>({...d,customer_type:e.target.value}))}/></Field><Field label="Service line"><input className="ri-input" value={draft.service_line} onChange={e=>setDraft((d:any)=>({...d,service_line:e.target.value}))}/></Field>{mode==="doctrine"||mode==="correction"?<Field label="Preferred action"><input className="ri-input" value={draft.action_type} onChange={e=>setDraft((d:any)=>({...d,action_type:e.target.value}))}/></Field>:<Field label="Priority"><input type="number" className="ri-input" min={1} max={100} value={draft.priority} onChange={e=>setDraft((d:any)=>({...d,priority:Number(e.target.value)}))}/></Field>}<Field label={mode==="doctrine"?"Behavior / response guidance":mode==="correction"?"Correction evidence":"Knowledge / strategy content"} wide><textarea rows={7} className="ri-input" value={draft.content} onChange={e=>setDraft((d:any)=>({...d,content:e.target.value}))}/></Field></div><div className="acx-teach-impact"><BrainCircuit/><div><strong>What happens after save</strong><span>{mode==="doctrine"?"This becomes an executable, scoped doctrine node inside the selected pack.":mode==="correction"?"This becomes learning evidence. It does not silently mutate live doctrine.":"This becomes validated structured knowledge retrievable by the cognition engine according to scope."}</span></div></div><div className="acx-modal-actions"><button onClick={onClose}>Cancel</button><button className="is-primary" disabled={busy||!draft.title.trim()||(mode==="correction"&&!draft.conversation_id.trim())} onClick={()=>void save()}>{busy?"Teaching…":"Validate & teach"}</button></div></div></div></ModalFrame>
}

function AutonomyPolicyEditor({setting,data,onRefresh,onNotice}:{setting:any;data:RevenueData;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void}){
  const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [draft,setDraft]=useState<any>({})
  useEffect(()=>{if(open)setDraft({min_autonomy_confidence:Number(setting?.min_autonomy_confidence||.82),min_assist_confidence:Number(setting?.min_assist_confidence||.55),commercial_intensity_cap:Number(setting?.commercial_intensity_cap||5),overflow_threshold:Number(setting?.overflow_threshold||25),after_hours_start:String(setting?.after_hours_start||"19:00").slice(0,5),after_hours_end:String(setting?.after_hours_end||"08:00").slice(0,5),timezone:String(setting?.timezone||"Africa/Casablanca")})},[open,setting])
  const eligible=(data.states||[]).filter(row=>confidenceOf(row)>=Number(draft.min_autonomy_confidence||.82)).length
  async function save(){setBusy(true);try{await acApi("/api/ac-whatsapp/revenue-intelligence/autonomy",{method:"PATCH",body:JSON.stringify({scope_type:"global",autonomy_mode:String(setting?.autonomy_mode||"manual"),enabled:setting?.enabled!==false,...draft,reason:"Consequence-aware autonomy policy composer"})});await onRefresh();setOpen(false);onNotice({tone:"success",title:"Admission policy saved",description:"Confidence, commercial intensity, overflow and no-shift envelope have been updated and audited."})}catch(cause){const f=friendlyAcError(cause);onNotice({tone:"danger",title:f.title,description:f.description})}finally{setBusy(false)}}
  return <><button className="acx-policy-button" onClick={()=>setOpen(true)}><SlidersHorizontal/>Configure policy with impact preview</button>{open?<ModalFrame title="Autonomy Admission Policy" eyebrow="Consequence-aware control" onClose={()=>setOpen(false)} wide><div className="acx-policy-modal"><div className="acx-form-grid"><Field label="Autonomy confidence"><input type="number" min="0.4" max="0.99" step="0.01" className="ri-input" value={draft.min_autonomy_confidence??.82} onChange={e=>setDraft((d:any)=>({...d,min_autonomy_confidence:Number(e.target.value)}))}/></Field><Field label="Assist confidence"><input type="number" min="0.2" max="0.95" step="0.01" className="ri-input" value={draft.min_assist_confidence??.55} onChange={e=>setDraft((d:any)=>({...d,min_assist_confidence:Number(e.target.value)}))}/></Field><Field label="Commercial intensity"><input type="number" min="0" max="6" step="1" className="ri-input" value={draft.commercial_intensity_cap??5} onChange={e=>setDraft((d:any)=>({...d,commercial_intensity_cap:Number(e.target.value)}))}/></Field><Field label="Overflow threshold"><input type="number" min="1" max="10000" step="1" className="ri-input" value={draft.overflow_threshold??25} onChange={e=>setDraft((d:any)=>({...d,overflow_threshold:Number(e.target.value)}))}/></Field><Field label="No-shift starts"><input type="time" className="ri-input" value={draft.after_hours_start||"19:00"} onChange={e=>setDraft((d:any)=>({...d,after_hours_start:e.target.value}))}/></Field><Field label="No-shift ends"><input type="time" className="ri-input" value={draft.after_hours_end||"08:00"} onChange={e=>setDraft((d:any)=>({...d,after_hours_end:e.target.value}))}/></Field><Field label="Timezone" wide><input className="ri-input" value={draft.timezone||"Africa/Casablanca"} onChange={e=>setDraft((d:any)=>({...d,timezone:e.target.value}))}/></Field></div><div className="acx-policy-preview"><div><span>RELATIONSHIPS EVIDENCED AT THIS FLOOR</span><strong>{eligible}</strong></div><div><span>AUTONOMY THRESHOLD</span><strong>{pct(draft.min_autonomy_confidence)}%</strong></div><div><span>MAX COMMERCIAL FORCE</span><strong>{draft.commercial_intensity_cap}/6</strong></div><p>Preview is evidence-based only; stop-list, human takeover, service-truth and critical-risk gates can still remove relationships from autonomous eligibility.</p></div><div className="acx-modal-actions"><button onClick={()=>setOpen(false)}>Cancel</button><button className="is-primary" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save & audit policy"}</button></div></div></ModalFrame>:null}</>
}

function PolicyComposer({setting,data,onRefresh,onNotice}:{setting:any;data:RevenueData;onRefresh:()=>Promise<void>;onNotice:(n:Notice)=>void}){return <div className="acx-policy-composer"><PolicyGauge label="Autonomy confidence" value={pct(setting?.min_autonomy_confidence||.82)} tone="blue"/><PolicyGauge label="Assist confidence" value={pct(setting?.min_assist_confidence||.55)} tone="cyan"/><PolicyGauge label="Commercial intensity" value={Math.round(Number(setting?.commercial_intensity_cap||5)/6*100)} display={`${setting?.commercial_intensity_cap||5}/6`} tone="violet"/><div className="acx-policy-details"><KeyValue label="Overflow" value={`${setting?.overflow_threshold||25} conversations`}/><KeyValue label="No-shift" value={`${String(setting?.after_hours_start||"19:00").slice(0,5)} → ${String(setting?.after_hours_end||"08:00").slice(0,5)}`}/><KeyValue label="Custom pricing" value="Human / policy"/><KeyValue label="Critical risk" value="Human escalation"/></div><AutonomyPolicyEditor setting={setting} data={data} onRefresh={onRefresh} onNotice={onNotice}/></div>}

function Panel({title,eyebrow,icon:Icon,action,children,className}:{title:string;eyebrow:string;icon:any;action?:any;children:any;className?:string}){return <section className={cx("acx-panel",className)}><header className="acx-panel-head"><div className="acx-panel-title"><span><Icon/></span><div><p>{eyebrow}</p><h3>{title}</h3></div></div>{action?<div className="acx-panel-action">{action}</div>:null}</header><div className="acx-panel-body">{children}</div></section>}
function WorkspaceTitle({eyebrow,title,description,icon:Icon,action}:{eyebrow:string;title:string;description:string;icon:any;action?:any}){return <div className="acx-workspace-title"><div className="acx-workspace-icon"><Icon/></div><div><p>{eyebrow}</p><h2>{title}</h2><span>{description}</span></div>{action?<div className="acx-workspace-action">{action}</div>:null}</div>}
function RailSection({eyebrow,title,icon:Icon,children}:{eyebrow:string;title:string;icon:any;children:any}){return <section className="acx-rail-section"><div className="acx-rail-title"><Icon/><div><span>{eyebrow}</span><strong>{title}</strong></div></div><div className="acx-rail-content">{children}</div></section>}
function RailMetric({label,value,meter}:{label:string;value:any;meter:number}){return <div className="acx-rail-metric"><div><span>{label}</span><strong>{value}</strong></div><div><i style={{width:`${clamp(meter)}%`}}/></div></div>}
function RailFact({label,value,good=false,risk=false}:{label:string;value:any;good?:boolean;risk?:boolean}){return <div className="acx-rail-fact"><span>{label}</span><strong className={cx(good&&"is-good",risk&&"is-risk")}>{value}</strong></div>}
function Insight({title,text}:{title:string;text:string}){return <div className="acx-insight"><strong>{title}</strong><span>{text}</span></div>}
function InsightAction({title,text,onClick}:{title:string;text:string;onClick:()=>void}){return <button className="acx-insight acx-insight-action" onClick={onClick}><div><strong>{title}</strong><span>{text}</span></div><ArrowRight/></button>}
function PolicyGauge({label,value,display,tone}:{label:string;value:number;display?:string;tone:string}){return <div className="acx-policy-gauge"><div className="acx-policy-gauge-head"><span>{label}</span><strong>{display||`${value}%`}</strong></div><div className={cx("acx-policy-track",`tone-${tone}`)}><i style={{width:`${clamp(value)}%`}}/></div></div>}
function KeyValue({label,value}:{label:string;value:any}){return <div className="acx-key-value"><span>{label}</span><strong>{value}</strong></div>}
function Segment({label,value,total,tone}:{label:string;value:number;total:number;tone:string}){const width=Math.max(value?4:0,Math.round(value/Math.max(total,1)*100));return <div className={cx("acx-segment",`tone-${tone}`)} style={{width:`${width}%`}} title={`${label}: ${value}`}><span>{label}</span><b>{value}</b></div>}
function PortfolioStat({label,value,text,tone}:{label:string;value:any;text:string;tone:string}){return <div className={cx("acx-portfolio-stat",`tone-${tone}`)}><span>{label}</span><strong>{value}</strong><small>{text}</small></div>}
function CommercialImpact({data,command}:{data:RevenueData;command:CommandData|null}){const actions=command?.actionRuns||[];const outcomes=command?.outcomes||[];const success=command?.counts?.successfulOutcomes||0;const conversions=outcomes.filter(row=>["converted","booking","meeting","proposal","qualified"].includes(String(row.outcome))).length;const executed=actions.filter(row=>row.status==="executed").length;const queued=actions.filter(row=>row.status==="queued").length;return <div className="acx-impact-grid"><Impact label="Autonomous actions" value={executed} detail={`${queued} queued`} icon={Zap}/><Impact label="Recorded outcomes" value={outcomes.length} detail={`${success} positive`} icon={BadgeCheck}/><Impact label="Commercial movement" value={conversions} detail="qualified / meeting / proposal / conversion" icon={LineChart}/><Impact label="Decision evidence" value={data.decisions.length} detail="recent governed decisions" icon={BrainCircuit}/></div>}
function Impact({label,value,detail,icon:Icon}:{label:string;value:any;detail:string;icon:any}){return <div className="acx-impact"><span><Icon/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></div>}
function IngestStep({index,title,text,active}:{index:string;title:string;text:string;active:boolean}){return <div className={cx("acx-ingest-step",active&&"is-active")}><span>{index}</span><div><strong>{title}</strong><small>{text}</small></div></div>}
function ImportResult({result}:{result:any}){return <div className={cx("acx-import-result",result.green?"is-green":"is-amber")}><div className="acx-import-result-head">{result.green?<CheckCircle2/>:<Flag/>}<div><strong>{result.green?"APPLICABLE · READY FOR GOVERNANCE":"REVIEW REQUIRED"}</strong><span>The system consumed, mapped and materialised the doctrine payload.</span></div></div><div className="acx-import-result-grid"><KeyValue label="Rows" value={result.stats?.rows||0}/><KeyValue label="Applicable" value={result.stats?.applicable||0}/><KeyValue label="Review" value={result.stats?.review||0}/><KeyValue label="Blocked" value={result.stats?.blocked||0}/><KeyValue label="Fit" value={`${result.stats?.applicability||0}%`}/></div></div>}
function Rule({title,text}:{title:string;text:string}){return <div className="acx-rule"><span><Workflow/></span><div><strong>{title}</strong><p>{text}</p></div></div>}
function FlightStep({label,value,state}:{label:string;value:string;state:"done"|"good"|"warn"}){return <div className={cx("acx-flight-step",`is-${state}`)}><span>{label}</span><i/><strong>{value}</strong></div>}
function RuntimeEvent({row}:{row:any}){const kind=String(row._kind||"runtime");const title=kind==="action"?row.action_type:kind==="event"?row.event_type:kind==="audit"?row.action_type||row.event_type:row.event_type;const status=row.status||row.severity||row.eligibility||"info";const detail=kind==="action"?row.goal||compactJson(row.details):kind==="audit"?row.goal||compactJson(row.reasoning):kind==="event"?compactJson(row.payload):compactJson(row.details);return <div className={cx("acx-runtime-event",`kind-${kind}`)}><div className="acx-runtime-time"><span>{formatRelative(row._time)}</span><i/></div><div className="acx-runtime-icon">{kind==="action"?<Zap/>:kind==="event"?<Clock3/>:kind==="audit"?<ShieldCheck/>:<Activity/>}</div><div className="acx-runtime-copy"><span>{kind.toUpperCase()}</span><strong>{titleCase(title)}</strong><p>{detail||"Operational evidence recorded"}</p></div><StatusPill status={status} compact/></div>}
function EmptyState({icon:Icon,title,text}:{icon:any;title:string;text:string}){return <div className="acx-empty"><span><Icon/></span><strong>{title}</strong><p>{text}</p></div>}
function Field({label,children,wide=false}:{label:string;children:any;wide?:boolean}){return <label className={cx("acx-field",wide&&"is-wide")}><span>{label}</span>{children}</label>}
