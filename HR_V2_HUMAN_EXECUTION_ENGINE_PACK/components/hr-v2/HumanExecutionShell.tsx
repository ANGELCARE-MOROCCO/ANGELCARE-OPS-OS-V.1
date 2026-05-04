'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type CardProps = { title: string; value?: string; note?: string; href?: string; action?: string }

export function HumanExecutionNav() {
  const links = [
    ['/hr/human-engine','Human Engine'],['/hr/forms-lab','Forms Lab'],['/hr/bulk-actions','Bulk Actions'],['/hr/roster-control','Roster Control'],['/hr/workflow-center','Workflow Center'],['/hr/staff-control','Staff Control'],['/hr','HR Command']
  ]
  return <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm">
    {links.map(([href,label]) => <Link key={href} href={href} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-900 hover:text-white">{label}</Link>)}
  </div>
}

export function ExecCard({title,value,note,href,action}:CardProps){
  const inner = <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</div>
    {value && <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>}
    {note && <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>}
    {action && <button className="mt-4 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">{action}</button>}
  </div>
  return href ? <Link href={href}>{inner}</Link> : inner
}

export function HumanExecutionDashboard(){
  const [selected,setSelected]=useState<string[]>([])
  const staff = ['Caregiver - Amina','Sales Agent - Omar','HR Officer - Lina','Care Coordinator - Youssef','Voice Agent - Salma','Trainer - Noura']
  const workflows = ['Leave approval → roster impact → replacement','Document expiry → compliance review','Incident → field supervisor → corrective action','Training passed → certification → placement']
  const selectedCount = selected.length
  return <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
    <div className="mx-auto max-w-7xl space-y-6">
      <HumanExecutionNav />
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">AngelCare HR V2</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Human Execution Engine</h1>
            <p className="mt-4 max-w-3xl text-slate-300">Manual-first HR operating cockpit: forms, bulk operations, roster control, workflow chains, staff actions and cross-module execution access.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-black">42</div><div className="text-xs text-slate-300">Actions</div></div>
            <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-black">12</div><div className="text-xs text-slate-300">Workflows</div></div>
            <div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-black">8</div><div className="text-xs text-slate-300">Bulk Tools</div></div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        <ExecCard title="Staff control" value="360°" note="Edit, assign, document, review, roster and escalate." href="/hr/staff-control" />
        <ExecCard title="Bulk operations" value={selectedCount ? `${selectedCount}` : 'Ready'} note="Select staff and apply department, shift, memo, status or training." href="/hr/bulk-actions" />
        <ExecCard title="Roster control" value="Monthly" note="Coverage gaps, duties, shifts, conflicts and free navigation." href="/hr/roster-control" />
        <ExecCard title="Workflow center" value="Chains" note="Manual process chains with checkpoints and escalation." href="/hr/workflow-center" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-xl font-black">Bulk selection workspace</h2><p className="text-sm text-slate-500">Prototype selection logic for tomorrow’s operator workflow.</p></div>
            <button onClick={()=>setSelected(staff)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Select all</button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {staff.map(s=><label key={s} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
              <input type="checkbox" checked={selected.includes(s)} onChange={e=>setSelected(e.target.checked?[...selected,s]:selected.filter(x=>x!==s))}/>
              <span className="font-semibold">{s}</span>
            </label>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Assign shift','Send memo','Assign training','Change department','Mark inactive','Request documents'].map(a=><button key={a} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-950 hover:text-white">{a}</button>)}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Workflow chains</h2>
          <div className="mt-4 space-y-3">
            {workflows.map(w=><div key={w} className="rounded-2xl bg-slate-50 p-4"><div className="text-sm font-bold text-slate-900">{w}</div><div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-2 w-2/3 rounded-full bg-slate-950" /></div></div>)}
          </div>
        </div>
      </div>
    </div>
  </div>
}
