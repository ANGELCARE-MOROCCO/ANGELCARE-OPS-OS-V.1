"use client"

import { createPortal } from "react-dom"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle, ArrowUpRight, CalendarClock, CheckCircle2, ChevronRight, CircleDot, Clock3, ExternalLink,
  FileWarning, History, Loader2, PauseCircle, Play, Radio, RefreshCw, RotateCcw, Send, ShieldCheck, TimerReset, X,
} from "lucide-react"
import type { SocialBootstrap, SocialExecutionJob, SocialPublication } from "@/lib/social-command/types"
import type { PulseState } from "./ActionPulse"
import styles from "./MZ9ExecutionCommand.module.css"

type Props = {
  view: string
  data: SocialBootstrap
  onRefresh: () => Promise<void>
  setPulse: (pulse: PulseState | null) => void
  onJobAction: (id: string, action: string) => Promise<void>
  setSelectedPublication: (publication: SocialPublication | null) => void
}

type JobDossier = { job: any; publication: any; attempts: any[]; providerResults: any[]; media: any[] }
const liveStates = new Set(["preparing", "publishing", "confirming", "retrying"])
const finalStates = new Set(["published", "failed", "cancelled"])
const statusOrder = ["queued", "preparing", "publishing", "confirming", "retrying", "published", "failed"]
const statusLabel: Record<string,string> = {
  queued:"SCHEDULED", preparing:"PREPARING", publishing:"SENDING", confirming:"META PROCESSING",
  retrying:"RECOVERY", published:"PUBLISHED", failed:"FAILED", cancelled:"CANCELLED",
}
const statusMeaning: Record<string,string> = {
  queued:"Valid execution waiting for its due time. No operator intervention required.",
  preparing:"Worker claimed this execution and is validating its material.",
  publishing:"Social Command is currently sending to the provider.",
  confirming:"Meta accepted a creation/container and Social Command is waiting for provider readiness. This is not a failure.",
  retrying:"A provider or transport failure triggered controlled recovery. Inspect before forcing another manual execution.",
  published:"Provider success is recorded. This execution must not be sent again.",
  failed:"Automatic attempts are exhausted or the failure is non-retryable. Operator attention is required.",
  cancelled:"Execution intentionally cancelled.",
}
function dt(value: string | null | undefined) { if(!value)return"—"; const d=new Date(value); return Number.isNaN(d.getTime())?"—":d.toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"}) }
function relative(value: string | null | undefined) { if(!value)return"—"; const ms=new Date(value).getTime()-Date.now(); if(!Number.isFinite(ms))return"—"; const abs=Math.abs(ms); const m=Math.max(1,Math.round(abs/60000)); const label=m<60?`${m}m`:m<1440?`${Math.round(m/60)}h`:`${Math.round(m/1440)}j`; return ms>0?`in ${label}`:`${label} ago` }
async function ox(path:string){const r=await fetch(`/api/social-command/operator-experience/${path}`,{cache:"no-store"});const p=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));if(!r.ok||p?.ok===false)throw new Error(p?.error||`HTTP ${r.status}`);return p.data}

function ProviderMark({channel}:{channel:string}) { return <span className={styles.providerMark} data-provider={channel}>{channel==="facebook"?"f":"ig"}</span> }

function StatusChip({status}:{status:string}) { return <span className={styles.statusChip} data-status={status}><i/>{statusLabel[status]||status.toUpperCase()}</span> }

function JobDrawer({job,onClose,onAction,onRefresh,setPulse}:{job:SocialExecutionJob|null;onClose:()=>void;onAction:(id:string,action:string)=>Promise<void>;onRefresh:()=>Promise<void>;setPulse:(pulse:PulseState|null)=>void}){
  const[mounted,setMounted]=useState(false),[top,setTop]=useState(0),[data,setData]=useState<JobDossier|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false)
  useEffect(()=>setMounted(true),[])
  useEffect(()=>{if(!job)return;const measure=()=>{const nav=document.querySelector('[data-social-command-horizontal-nav="true"]') as HTMLElement|null;setTop(Math.max(0,Math.round(nav?.getBoundingClientRect().bottom||0)))};measure();window.addEventListener("resize",measure);const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",key);return()=>{window.removeEventListener("resize",measure);window.removeEventListener("keydown",key)}},[job,onClose])
  useEffect(()=>{if(!job){setData(null);return}setError("");setData(null);void ox(`jobs/${job.id}/dossier`).then(setData).catch(e=>setError(e instanceof Error?e.message:String(e)))},[job?.id])
  if(!mounted||!job)return null
  const publication=data?.publication
  const execute=async(action:string)=>{setBusy(true);try{await onAction(job.id,action);await onRefresh();setPulse({id:crypto.randomUUID(),label:action==="execute"?"Execution override accepted":"Recovery command accepted",status:"completed",progress:100,step:"Execution Queue synchronized"});onClose()}catch(e){setPulse({id:crypto.randomUUID(),label:"Execution command",status:"failed",progress:100,step:"Command not applied",detail:e instanceof Error?e.message:String(e)})}finally{setBusy(false)}}
  const dueFuture=new Date(job.due_at).getTime()>Date.now()+60_000
  return createPortal(<div className={styles.drawerLayer} style={{top}}><button className={styles.scrim} onClick={onClose} aria-label="Close execution dossier"/><aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Execution dossier">
    <header><div><span>EXECUTION DOSSIER · PROVIDER TRUTH</span><h3>{publication?.title||"Execution job"}</h3><p>{job.channel.toUpperCase()} · attempt {job.attempt_count}/{job.max_attempts}</p></div><button onClick={onClose} aria-label="Close"><X/></button></header>
    <div className={styles.drawerBody}>
      <section className={styles.truthHero} data-status={job.status}><ProviderMark channel={job.channel}/><div><StatusChip status={job.status}/><h4>{statusMeaning[job.status]||"Execution state recorded by Social Command."}</h4><p>Due {dt(job.due_at)} · {relative(job.due_at)}</p></div>{job.provider_reference?<div className={styles.providerProof}><ShieldCheck/><span>PROVIDER REFERENCE</span><b>{job.provider_reference}</b></div>:null}</section>
      {error?<div className={styles.error}><AlertTriangle/>{error}</div>:null}
      {!data&&!error?<div className={styles.loading}><Loader2/><span>Loading execution evidence…</span></div>:null}
      {data?<>
        <section className={styles.factGrid}><article><span>SCHEDULED</span><b>{dt(job.due_at)}</b></article><article><span>NEXT ATTEMPT</span><b>{dt(job.next_attempt_at)}</b></article><article><span>UPDATED</span><b>{dt(job.updated_at)}</b></article><article><span>PROVIDER</span><b>{job.provider_reference?"CONFIRMED / REFERENCED":"NOT YET CONFIRMED"}</b></article></section>
        {job.last_error?<section className={styles.failureEvidence}><FileWarning/><div><span>LAST RECORDED ERROR</span><b>{job.last_error}</b><small>The error remains visible until a subsequent successful state clears it.</small></div></section>:null}
        <section className={styles.timeline}><header><div><History/><span>ATTEMPT FLIGHT RECORDER</span></div><b>{data.attempts.length} RECORDS</b></header><div>{data.attempts.map((a:any)=><article key={a.id||`${a.attempt_no}-${a.started_at}`} data-status={a.status}><i/><div><span>ATTEMPT {a.attempt_no}</span><b>{statusLabel[a.status]||String(a.status).toUpperCase()}</b><small>{dt(a.started_at)} → {dt(a.completed_at)}{a.latency_ms!=null?` · ${a.latency_ms}ms`:""}</small>{a.error_message?<p>{a.error_message}</p>:null}</div>{a.provider_reference?<em>{a.provider_reference}</em>:null}</article>)}{!data.attempts.length?<p>No execution attempt evidence recorded yet.</p>:null}</div></section>
        <section className={styles.providerLedger}><header><span>PROVIDER RESULT LEDGER</span><b>{data.providerResults.length}</b></header>{data.providerResults.map((r:any)=><article key={r.id}><StatusChip status={r.result_type}/><div><b>{r.provider_reference||"No provider reference"}</b><small>{dt(r.created_at)}</small></div>{r.public_url?<a href={r.public_url} target="_blank" rel="noreferrer"><ExternalLink/></a>:null}</article>)}{!data.providerResults.length?<p>No provider result has been persisted for this job yet.</p>:null}</section>
      </>:null}
    </div>
    <footer>
      {job.status==="queued"?<button disabled={busy} className={styles.executeNow} onClick={()=>{const message=dueFuture?`This job is scheduled for ${dt(job.due_at)}. Execute it ahead of schedule now?`:`Execute this due job now?`;if(confirm(message))void execute("execute")}}><Play/>Execute now</button>:null}
      {job.status==="failed"||job.status==="retrying"?<button disabled={busy} onClick={()=>{if(confirm("Authorize a controlled retry for this execution job?"))void execute("retry")}}><RotateCcw/>Authorize retry</button>:null}
      {job.status==="confirming"?<span className={styles.noAction}><TimerReset/>Meta processing · no manual resend required</span>:null}
      {job.status==="published"?<span className={styles.noAction}><CheckCircle2/>Provider success recorded · resend disabled</span>:null}
    </footer>
  </aside></div>,document.body)
}

export default function MZ9ExecutionCommand({view,data,onRefresh,setPulse,onJobAction,setSelectedPublication}:Props){
  const[selectedJob,setSelectedJob]=useState<SocialExecutionJob|null>(null)
  const jobs=data.jobs||[]
  const publications=data.publications||[]
  const pubMap=useMemo(()=>new Map(publications.map(p=>[p.id,p])),[publications])
  const filteredJobs=useMemo(()=>view==="failures"?jobs.filter(j=>j.status==="failed"):view==="published"?jobs.filter(j=>j.status==="published"):view==="scheduled"?jobs.filter(j=>["queued","preparing","publishing","confirming","retrying"].includes(j.status)):jobs,[jobs,view])
  const counts=Object.fromEntries(statusOrder.map(status=>[status,jobs.filter(j=>j.status===status).length]))
  const future=jobs.filter(j=>j.status==="queued"&&new Date(j.due_at).getTime()>Date.now()).length
  const live=jobs.filter(j=>liveStates.has(j.status)).length
  const failed=jobs.filter(j=>j.status==="failed").length
  const published=jobs.filter(j=>j.status==="published").length

  if(view==="published"||view==="scheduled") return <div className={styles.publicationMode} data-mode={view}>
    <header className={styles.modeHeader}><div><span>{view==="published"?"PROVIDER-CONFIRMED HISTORY":"AUTONOMOUS SCHEDULE RUNWAY"}</span><h2>{view==="published"?"Published means provider success recorded.":"Queued means wait. The worker owns normal execution."}</h2><p>{view==="published"?"Scheduled time remains historical context; published state is the authoritative completion signal.":"Use Execute now only as an explicit schedule override—not as routine operation."}</p></div><aside><article><b>{view==="published"?published:future}</b><span>{view==="published"?"published jobs":"future queued jobs"}</span></article></aside></header>
    <section className={styles.publicationGrid}>{filteredJobs.map(job=>{const p=pubMap.get(job.publication_id);return <button key={job.id} className={styles.publicationCard} data-status={job.status} onClick={()=>setSelectedJob(job)}><div className={styles.cardTop}><ProviderMark channel={job.channel}/><StatusChip status={job.status}/><ChevronRight/></div><h3>{p?.title||"Publication"}</h3><p>{p?.format?.toUpperCase()||"CONTENT"} · {job.channel.toUpperCase()}</p><dl><div><dt>{job.status==="published"?"Originally scheduled":"Scheduled"}</dt><dd>{dt(job.due_at)}</dd></div><div><dt>Attempts</dt><dd>{job.attempt_count}/{job.max_attempts}</dd></div><div><dt>Provider</dt><dd>{job.provider_reference||"Pending"}</dd></div></dl></button>})}{!filteredJobs.length?<div className={styles.empty}><CheckCircle2/><b>{view==="published"?"No published execution in this snapshot.":"No future scheduled execution."}</b><span>Nothing is fabricated to fill the workspace.</span></div>:null}</section>
    <JobDrawer job={selectedJob} onClose={()=>setSelectedJob(null)} onAction={onJobAction} onRefresh={onRefresh} setPulse={setPulse}/>
  </div>

  return <div className={styles.queueShell}>
    <header className={styles.modeHeader}><div><span>PUBLISH · EXECUTION CONTROL</span><h2>{view==="failures"?"Failure containment and deliberate recovery.":"Every execution state has one precise operational meaning."}</h2><p>Provider processing, actual failure, scheduled waiting and confirmed publication are intentionally separated.</p></div><aside className={styles.metrics}><article><b>{future}</b><span>WAITING</span></article><article><b>{live}</b><span>IN MOTION</span></article><article data-alert={failed>0}><b>{failed}</b><span>FAILED</span></article><article><b>{published}</b><span>PUBLISHED</span></article></aside></header>
    {view==="failures"?<section className={styles.failureList}>{filteredJobs.map(job=>{const p=pubMap.get(job.publication_id);return <article key={job.id}><div className={styles.failureIcon}><AlertTriangle/></div><div><span>{job.channel.toUpperCase()} · ATTEMPT {job.attempt_count}/{job.max_attempts}</span><h3>{p?.title||"Publication"}</h3><p>{job.last_error||"No provider error detail was persisted."}</p><small>Due {dt(job.due_at)} · updated {dt(job.updated_at)}</small></div><aside><button onClick={()=>setSelectedJob(job)}>Inspect evidence <ArrowUpRight/></button><button onClick={()=>{if(confirm("Authorize a controlled retry?"))void onJobAction(job.id,"retry")}}><RefreshCw/>Retry</button></aside></article>})}{!filteredJobs.length?<div className={styles.empty}><ShieldCheck/><b>No failed jobs require intervention.</b><span>Recovery remains quiet when there is nothing to act on.</span></div>:null}</section>:<section className={styles.flow}>{statusOrder.map((status,index)=>{const rows=jobs.filter(job=>job.status===status);return <section key={status} className={styles.lane} data-status={status}><header><div><span>{String(index+1).padStart(2,"0")}</span><b>{statusLabel[status]}</b></div><em>{counts[status]||0}</em><p>{statusMeaning[status]}</p></header><div>{rows.map(job=>{const p=pubMap.get(job.publication_id);return <button key={job.id} className={styles.jobCard} onClick={()=>setSelectedJob(job)}><div className={styles.cardTop}><ProviderMark channel={job.channel}/><span>{relative(job.due_at)}</span></div><h3>{p?.title||"Publication"}</h3><small>{dt(job.due_at)}</small><footer><span>Attempt {job.attempt_count}/{job.max_attempts}</span>{job.provider_reference?<b>PROVIDER ✓</b>:null}</footer>{job.last_error?<p>{job.last_error}</p>:null}</button>})}{!rows.length?<div className={styles.laneEmpty}><CircleDot/><span>CLEAR</span></div>:null}</div></section>})}</section>}
    <JobDrawer job={selectedJob} onClose={()=>setSelectedJob(null)} onAction={onJobAction} onRefresh={onRefresh} setPulse={setPulse}/>
  </div>
}
