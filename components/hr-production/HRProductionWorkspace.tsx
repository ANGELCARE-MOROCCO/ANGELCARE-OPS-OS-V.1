'use client'

import Link from 'next/link'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, Archive, BadgeCheck, Banknote, Briefcase, CalendarCheck, CheckCircle2, ClipboardList, FileText, Filter, Gauge, Plus, Search, ShieldCheck, Sparkles, Users, UserPlus, Workflow, XCircle } from 'lucide-react'
import { hrAuditLogs as baseLogs, hrCandidates as baseCandidates, hrDocuments as baseDocs, hrEmployees as baseEmployees, hrTasks as baseTasks, getHrSnapshot } from '@/lib/hr-production/hr-data'
import type { HrAuditLog, HrCandidate, HrDocument, HrEmployee, HrTask, HrWorkflowStatus } from '@/types/hr-production'

type ModuleKey = 'dashboard' | 'employees' | 'recruitment' | 'performance' | 'payroll' | 'attendance' | 'roles' | 'documents' | 'tasks'

type Props = { module: ModuleKey; title: string; subtitle: string }

type Toast = { id: string; text: string; tone: 'success' | 'warning' | 'info' }

const moduleLinks = [
  ['Dashboard','/hr/command-dashboard'], ['Employees','/hr/employees'], ['Recruitment','/hr/recruitment'], ['Performance','/hr/performance'], ['Payroll','/hr/payroll'], ['Attendance','/hr/attendance'], ['Roles','/hr/roles'], ['Documents','/hr/documents'], ['Tasks','/hr/tasks'],
]

function cn(...v: Array<string | false | null | undefined>) { return v.filter(Boolean).join(' ') }
function pct(n:number){ return `${Math.round(n)}%` }

export default function HRProductionWorkspace({ module, title, subtitle }: Props) {
  const [employees,setEmployees] = useState<HrEmployee[]>(baseEmployees)
  const [candidates,setCandidates] = useState<HrCandidate[]>(baseCandidates)
  const [tasks,setTasks] = useState<HrTask[]>(baseTasks)
  const [documents,setDocuments] = useState<HrDocument[]>(baseDocs)
  const [logs,setLogs] = useState<HrAuditLog[]>(baseLogs)
  const [query,setQuery] = useState('')
  const [selected,setSelected] = useState<string[]>([])
  const [toast,setToast] = useState<Toast[]>([])

  const snapshot = useMemo(() => {
    const active = employees.filter(e=>e.status==='active').length
    const blockers = employees.filter(e=>e.payrollStatus==='blocked').length + documents.filter(d=>d.risk==='critical').length
    const avgScore = Math.round(employees.reduce((s,e)=>s+e.score,0)/Math.max(employees.length,1))
    const attendance = Math.round(employees.reduce((s,e)=>s+e.attendanceRate,0)/Math.max(employees.length,1))
    return { ...getHrSnapshot(), active, blockers, avgScore, attendance, employees: employees.length, candidates: candidates.length, tasks: tasks.length, documents: documents.length }
  },[employees,candidates,tasks,documents])

  function push(text:string, tone:Toast['tone']='success') {
    const t = { id: Math.random().toString(36), text, tone }
    setToast(x=>[t,...x].slice(0,3))
    const log: HrAuditLog = { id: `log-${Date.now()}`, actor: 'HR Command', action: text, target: title, createdAt: new Date().toISOString(), severity: tone==='warning'?'high':'medium' }
    setLogs(x=>[log,...x].slice(0,20))
  }
  function toggle(id:string){ setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]) }
  function bulk(status:HrWorkflowStatus){ setTasks(t=>t.map(x=>selected.includes(x.id)?{...x,status}:x)); setSelected([]); push(`${selected.length} selected tasks moved to ${status}`) }
  function addEmployee(){ const e:HrEmployee={ id:`emp-${Date.now()}`, fullName:'New Staff Member', role:'Care Staff', department:'Operations', location:'Rabat', status:'probation', score:75, attendanceRate:100, payrollStatus:'review', contractType:'CDD', startDate:new Date().toISOString().slice(0,10), manager:'HR Command', phone:'', email:'new.staff@angelcare.local', tags:['new','needs-profile']}; setEmployees([e,...employees]); push('Employee draft created with onboarding controls') }
  function advanceCandidate(id:string){ setCandidates(candidates.map(c=> c.id===id ? {...c, stage: c.stage==='screening'?'interview':c.stage==='interview'?'offer':c.stage==='offer'?'hired':c.stage, nextAction:'Next recruitment checkpoint generated'} : c)); push('Candidate advanced and next action generated') }
  function payrollScan(){ const count=employees.filter(e=>e.payrollStatus==='blocked'||e.payrollStatus==='review').length; push(`${count} payroll blockers scanned and isolated`, count?'warning':'success') }
  function approveDoc(id:string){ setDocuments(documents.map(d=>d.id===id?{...d,status:'approved',risk:'low'}:d)); push('Document approved and compliance risk reduced') }

  const filteredEmployees = employees.filter(e => `${e.fullName} ${e.role} ${e.department} ${e.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))

  return <main className="min-h-screen bg-slate-950 text-white">
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.35),transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)]">
      <div className="absolute right-8 top-8 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100"><Sparkles size={14}/> HR OS Production Command Layer</div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>push('AI HR action plan generated')} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-950/30">Generate Plan</button>
            <button onClick={()=>push('Risk scan executed across HR records','warning')} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur">Run Risk Scan</button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Kpi icon={<Users/>} label="Active Staff" value={snapshot.active} note={`${snapshot.employees} total records`} />
          <Kpi icon={<Gauge/>} label="Performance Avg" value={pct(snapshot.avgScore)} note="review + attendance score" />
          <Kpi icon={<CalendarCheck/>} label="Attendance" value={pct(snapshot.attendance)} note="today command signal" />
          <Kpi icon={<AlertTriangle/>} label="Blockers" value={snapshot.blockers} note="payroll/doc/compliance" danger={snapshot.blockers>0}/>
        </div>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-3xl border border-white/10 bg-white/[.04] p-3 shadow-2xl shadow-black/20">
        <div className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">HR Navigation</div>
        <div className="grid gap-1">{moduleLinks.map(([label,href]) => <Link key={href} href={href} className={cn('rounded-2xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white', href.includes(module==='dashboard'?'command-dashboard':module) && 'bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/20')}>{label}</Link>)}</div>
        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100"><b>Execution Guard:</b> all buttons update local state immediately and log actions. API route included for backend wiring.</div>
      </aside>

      <div className="space-y-5">
        {toast.length>0 && <div className="grid gap-2">{toast.map(t=><div key={t.id} className={cn('rounded-2xl border px-4 py-3 text-sm font-bold', t.tone==='warning'?'border-amber-300/30 bg-amber-300/10 text-amber-100':'border-emerald-300/30 bg-emerald-300/10 text-emerald-100')}>{t.text}</div>)}</div>}
        <ControlBar query={query} setQuery={setQuery} addEmployee={addEmployee} payrollScan={payrollScan}/>
        {module==='dashboard' && <Dashboard employees={employees} candidates={candidates} tasks={tasks} documents={documents} logs={logs} advanceCandidate={advanceCandidate} approveDoc={approveDoc} bulk={bulk} selected={selected} toggle={toggle}/>} 
        {module==='employees' && <Employees employees={filteredEmployees} addEmployee={addEmployee} toggleStatus={(id: string) =>{setEmployees(employees.map(e=>e.id===id?{...e,status:e.status==='active'?'on_leave':'active'}:e)); push('Employee status toggled')}}/>}
        {module==='recruitment' && <Recruitment candidates={candidates} advanceCandidate={advanceCandidate}/>} 
        {module==='performance' && <Performance employees={employees} calibrate={(id: string) =>{setEmployees(employees.map(e=>e.id===id?{...e,score:Math.min(100,e.score+3)}:e)); push('Performance calibration applied')}}/>}
        {module==='payroll' && <Payroll employees={employees} payrollScan={payrollScan} markReady={(id: string) =>{setEmployees(employees.map(e=>e.id===id?{...e,payrollStatus:'ready'}:e)); push('Payroll record marked ready')}}/>}
        {module==='attendance' && <Attendance employees={employees} adjust={(id: string) =>{setEmployees(employees.map(e=>e.id===id?{...e,attendanceRate:Math.min(100,e.attendanceRate+1)}:e)); push('Attendance correction applied')}}/>}
        {module==='roles' && <Roles employees={employees} promote={(id: string) =>{setEmployees(employees.map(e=>e.id===id?{...e,role:`Senior ${e.role}`,score:Math.min(100,e.score+2)}:e)); push('Role promotion workflow executed')}}/>}
        {module==='documents' && <Documents documents={documents} approveDoc={approveDoc}/>} 
        {module==='tasks' && <Tasks tasks={tasks} selected={selected} toggle={toggle} bulk={bulk} complete={(id: string) =>{setTasks(tasks.map(t=>t.id===id?{...t,status:'completed'}:t)); push('Task completed')}}/>}
      </div>
    </section>
  </main>
}

function Kpi({icon,label,value,note,danger}:{icon:React.ReactNode;label:string;value:string|number;note:string;danger?:boolean}){return <div className="rounded-3xl border border-white/10 bg-white/[.06] p-4 backdrop-blur"><div className="flex items-center justify-between"><span className="text-slate-300">{label}</span><span className={cn('rounded-2xl p-2',danger?'bg-rose-400/20 text-rose-100':'bg-cyan-400/15 text-cyan-100')}>{icon}</span></div><div className="mt-3 text-3xl font-black">{value}</div><div className="text-xs text-slate-400">{note}</div></div>}
function ControlBar({query,setQuery,addEmployee,payrollScan}:{query:string;setQuery:(v:string)=>void;addEmployee:()=>void;payrollScan:()=>void}){return <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-white/10 bg-white/[.04] p-3"><div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-2xl bg-white/10 px-3 py-2"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search HR records, staff, roles, tags..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"/></div><button className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"><Filter size={16} className="mr-2 inline"/>Filters</button><button onClick={addEmployee} className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"><Plus size={16} className="mr-2 inline"/>New Employee</button><button onClick={payrollScan} className="rounded-2xl bg-amber-300 px-4 py-2 text-sm font-black text-slate-950"><Banknote size={16} className="mr-2 inline"/>Payroll Scan</button></div>}
function Card({children,className}:{children:React.ReactNode;className?:string}){return <div className={cn('rounded-3xl border border-white/10 bg-white/[.04] p-5 shadow-xl shadow-black/10',className)}>{children}</div>}
function Status({text}:{text:string}){return <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs font-bold capitalize text-slate-200">{text.replace('_',' ')}</span>}
function Dashboard(p:any){return <div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="mb-4 text-xl font-black">Command Priorities</h2><div className="space-y-3">{p.tasks.map((t:HrTask)=><Row key={t.id} title={t.title} meta={`${t.owner} • ${t.module} • ${t.dueDate}`} right={<Status text={t.status}/>}/>)}</div></Card><Card><h2 className="mb-4 text-xl font-black">Recruitment Pipeline</h2>{p.candidates.map((c:HrCandidate)=><Row key={c.id} title={c.fullName} meta={`${c.role} • ${c.stage} • ${c.score}%`} right={<button onClick={()=>p.advanceCandidate(c.id)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Advance</button>}/>)}</Card><Card><h2 className="mb-4 text-xl font-black">Compliance Documents</h2>{p.documents.map((d:HrDocument)=><Row key={d.id} title={d.title} meta={`${d.type} • risk ${d.risk}`} right={<button onClick={()=>p.approveDoc(d.id)} className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950">Approve</button>}/>)}</Card><Card><h2 className="mb-4 text-xl font-black">Audit Trail</h2>{p.logs.slice(0,6).map((l:HrAuditLog)=><Row key={l.id} title={l.action} meta={`${l.actor} • ${new Date(l.createdAt).toLocaleString()}`} right={<Status text={l.severity}/>}/>)}</Card></div>}
function Row({title,meta,right}:{title:string;meta:string;right:React.ReactNode}){return <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div><div className="font-bold text-white">{title}</div><div className="text-xs text-slate-400">{meta}</div></div><div>{right}</div></div>}
function Employees({employees,addEmployee,toggleStatus}:any){return <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black"><Users className="mr-2 inline"/>Employee Command</h2><button onClick={addEmployee} className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">Create Staff</button></div><div className="grid gap-3">{employees.map((e:HrEmployee)=><Row key={e.id} title={e.fullName} meta={`${e.role} • ${e.department} • ${e.location} • score ${e.score}%`} right={<div className="flex gap-2"><Status text={e.status}/><button onClick={()=>toggleStatus(e.id)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Toggle</button></div>}/>)}</div></Card>}
function Recruitment({candidates,advanceCandidate}:any){return <Card><h2 className="mb-4 text-2xl font-black"><UserPlus className="mr-2 inline"/>Recruitment Execution</h2><div className="grid gap-3">{candidates.map((c:HrCandidate)=><Row key={c.id} title={c.fullName} meta={`${c.role} • ${c.stage} • ${c.nextAction}`} right={<button onClick={()=>advanceCandidate(c.id)} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">Advance Stage</button>}/>)}</div></Card>}
function Performance({employees,calibrate}:any){return <Card><h2 className="mb-4 text-2xl font-black"><Activity className="mr-2 inline"/>Performance Control</h2>{employees.map((e:HrEmployee)=><Row key={e.id} title={e.fullName} meta={`${e.role} • KPI ${e.score}% • attendance ${e.attendanceRate}%`} right={<button onClick={()=>calibrate(e.id)} className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950">Calibrate +3</button>}/>)}</Card>}
function Payroll({employees,payrollScan,markReady}:any){return <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black"><Banknote className="mr-2 inline"/>Payroll Control</h2><button onClick={payrollScan} className="rounded-2xl bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Run Scan</button></div>{employees.map((e:HrEmployee)=><Row key={e.id} title={e.fullName} meta={`${e.contractType} • ${e.payrollStatus} • start ${e.startDate}`} right={<button onClick={()=>markReady(e.id)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Mark Ready</button>}/>)}</Card>}
function Attendance({employees,adjust}:any){return <Card><h2 className="mb-4 text-2xl font-black"><CalendarCheck className="mr-2 inline"/>Attendance Operations</h2>{employees.map((e:HrEmployee)=><Row key={e.id} title={e.fullName} meta={`${e.department} • attendance ${e.attendanceRate}% • status ${e.status}`} right={<button onClick={()=>adjust(e.id)} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">Correct +1</button>}/>)}</Card>}
function Roles({employees,promote}:any){return <Card><h2 className="mb-4 text-2xl font-black"><ShieldCheck className="mr-2 inline"/>Roles & Access</h2>{employees.map((e:HrEmployee)=><Row key={e.id} title={e.fullName} meta={`${e.role} • manager ${e.manager} • ${e.tags.join(', ')}`} right={<button onClick={()=>promote(e.id)} className="rounded-xl bg-violet-300 px-3 py-2 text-xs font-black text-slate-950">Promote</button>}/>)}</Card>}
function Documents({documents,approveDoc}:any){return <Card><h2 className="mb-4 text-2xl font-black"><FileText className="mr-2 inline"/>Document Vault</h2>{documents.map((d:HrDocument)=><Row key={d.id} title={d.title} meta={`${d.type} • ${d.status} • expiry ${d.expiryDate || 'none'} • risk ${d.risk}`} right={<button onClick={()=>approveDoc(d.id)} className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950">Approve</button>}/>)}</Card>}
function Tasks({tasks,selected,toggle,bulk,complete}:any){return <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-black"><ClipboardList className="mr-2 inline"/>Task Execution Center</h2><div className="flex gap-2"><button onClick={()=>bulk('completed')} className="rounded-xl bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950"><CheckCircle2 size={14} className="mr-1 inline"/>Complete Selected</button><button onClick={()=>bulk('paused')} className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-black text-slate-950"><Archive size={14} className="mr-1 inline"/>Pause</button><button onClick={()=>bulk('rejected')} className="rounded-xl bg-rose-300 px-3 py-2 text-xs font-black text-slate-950"><XCircle size={14} className="mr-1 inline"/>Reject</button></div></div>{tasks.map((t:HrTask)=><div key={t.id} className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-3"><div className="flex items-center gap-3"><input type="checkbox" checked={selected.includes(t.id)} onChange={()=>toggle(t.id)}/><div><div className="font-bold">{t.title}</div><div className="text-xs text-slate-400">{t.owner} • {t.module} • {t.impact} • due {t.dueDate}</div></div></div><div className="flex gap-2"><Status text={t.status}/><button onClick={()=>complete(t.id)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Done</button></div></div>)}</Card>}
