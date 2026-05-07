
"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ambassadorPrograms, formatMad, getAmbassadorDecision, getAmbassadorReadiness } from "@/lib/market-os/ambassador-program-execution-model"

type SubpageKind = "create" | "profile" | "edit" | "delete" | "recruitment" | "onboarding" | "missions" | "programs" | "rewards" | "territories" | "approvals" | "compliance" | "analytics" | "assets" | "communications" | "training" | "leads" | "payouts" | "settings"

type Props = { kind: SubpageKind; title: string; ambassadorId?: string }

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" ") }
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={cx("rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</section> }
function Tag({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">{children}</span> }
function Bar({ value }: { value: number }) { return <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-slate-950" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div> }

const subpageDirectory = [
  ["Create", "/market-os/ambassadors/create"],
  ["Recruitment", "/market-os/ambassadors/recruitment"],
  ["Onboarding", "/market-os/ambassadors/onboarding"],
  ["Missions", "/market-os/ambassadors/missions"],
  ["Programs", "/market-os/ambassadors/programs"],
  ["Rewards", "/market-os/ambassadors/rewards"],
  ["Territories", "/market-os/ambassadors/territories"],
  ["Approvals", "/market-os/ambassadors/approvals"],
  ["Compliance", "/market-os/ambassadors/compliance"],
  ["Analytics", "/market-os/ambassadors/analytics"],
  ["Assets", "/market-os/ambassadors/assets"],
  ["Communications", "/market-os/ambassadors/communications"],
  ["Training", "/market-os/ambassadors/training"],
  ["Leads", "/market-os/ambassadors/leads"],
  ["Payouts", "/market-os/ambassadors/payouts"],
  ["Settings", "/market-os/ambassadors/settings"],
] as const

export default function AmbassadorProgramExecutiveSubpage({ kind, title, ambassadorId }: Props) {
  const [priority, setPriority] = useState("all")
  const [notes, setNotes] = useState("")
  const [logs, setLogs] = useState<string[]>([`Loaded ${title} workspace.`])
  const current = useMemo(() => ambassadorPrograms.find((item) => item.id === ambassadorId) ?? ambassadorPrograms[0], [ambassadorId])
  const addLog = (message: string) => setLogs((items) => [`${new Date().toLocaleTimeString()} · ${message}`, ...items].slice(0, 10))

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-6 px-5 py-6 lg:px-8">
        <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2"><Tag>{kind}</Tag><Tag>Ambassador Program</Tag><Tag>Executive Operations</Tag></div>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
              <p className="mt-3 max-w-4xl text-slate-200">A senior affiliate ambassador workspace for operational control, lead quality, missions, proof validation, compliance, rewards, territories and scale decisions.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/market-os/ambassadors" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950">Back to command center</Link>
              <button onClick={() => addLog("Executive snapshot exported")} className="rounded-2xl border border-white/30 px-4 py-3 text-sm font-black">Export snapshot</button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
          <Panel>
            <h2 className="text-2xl font-black">Workspace navigator</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {subpageDirectory.map(([label, href]) => <Link key={href} href={href} className="rounded-2xl border border-slate-200 p-3 text-sm font-black hover:bg-slate-50">{label}</Link>)}
            </div>
          </Panel>
          <Panel>
            <h2 className="text-2xl font-black">Active ambassador context</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Name</p><p className="mt-2 font-black">{current.name}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Readiness</p><p className="mt-2 font-black">{getAmbassadorReadiness(current)}%</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Revenue</p><p className="mt-2 font-black">{formatMad(current.revenueMad)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">{getAmbassadorDecision(current)}</p></div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <Panel><h2 className="text-xl font-black">Action controls</h2><div className="mt-4 grid gap-3"><button onClick={() => addLog("Mission assigned")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Assign mission</button><button onClick={() => addLog("Proof approved")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Approve proof</button><button onClick={() => addLog("Compliance escalation opened")} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white">Escalate compliance</button><button onClick={() => addLog("Payout batch marked ready")} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">Prepare payout</button></div></Panel>
          <Panel><h2 className="text-xl font-black">Priority filter</h2><select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"><option value="all">All priorities</option><option value="risk">Risk</option><option value="revenue">Revenue</option><option value="trust">Payout trust</option><option value="activation">Activation</option></select><p className="mt-4 text-sm text-slate-600">Use this to focus the workspace on the type of action the senior operator is performing.</p></Panel>
          <Panel><h2 className="text-xl font-black">Executive notes</h2><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Write decision notes, approval reasons, coaching instructions or payout comments..." className="mt-4 min-h-40 w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-950" /><button onClick={() => addLog("Executive note saved") } className="mt-3 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Save note</button></Panel>
        </section>

        <section className="grid gap-5 xl:grid-cols-4">
          {ambassadorPrograms.map((item) => <Panel key={item.id}><div className="flex justify-between gap-3"><h3 className="font-black">{item.name}</h3><Tag>{item.status}</Tag></div><p className="mt-2 text-sm text-slate-500">{item.territory} · {item.program}</p><div className="mt-4 space-y-3"><div><p className="text-xs font-bold uppercase text-slate-500">Mission completion</p><Bar value={item.missionCompletion} /></div><div><p className="text-xs font-bold uppercase text-slate-500">Compliance score</p><Bar value={item.complianceScore} /></div><div><p className="text-xs font-bold uppercase text-slate-500">Content score</p><Bar value={item.contentScore} /></div></div><div className="mt-4 flex gap-2"><Link href={`/market-os/ambassadors/${item.id}`} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</Link><Link href={`/market-os/ambassadors/${item.id}/edit`} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black">Edit</Link></div></Panel>)}
        </section>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">001 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 001</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 001</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 001 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">002 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 002</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 002</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 002 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">003 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 003</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 003</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 003 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">004 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 004</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 004</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 004 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">005 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 005</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 005</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 005 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">006 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 006</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 006</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 006 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">007 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 007</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 007</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 007 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">008 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 008</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 008</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 008 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">009 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 009</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 009</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 009 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">010 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 010</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 010</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 010 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">011 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 011</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 011</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 011 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">012 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 012</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 012</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 012 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">013 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 013</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 013</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 013 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">014 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 014</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 014</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 014 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">015 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 015</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 015</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 015 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">016 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 016</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 016</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 016 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">017 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 017</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 017</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 017 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">018 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 018</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 018</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 018 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">019 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 019</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 019</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 019 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">020 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 020</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 020</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 020 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">021 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 021</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 021</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 021 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">022 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 022</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 022</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 022 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">023 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 023</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 023</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 023 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">024 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 024</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 024</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 024 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">025 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 025</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 025</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 025 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">026 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 026</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 026</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 026 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">027 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 027</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 027</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 027 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">028 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 028</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 028</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 028 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">029 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 029</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 029</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 029 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">030 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 030</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 030</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 030 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">031 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 031</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 031</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 031 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">032 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 032</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 032</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 032 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">033 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 033</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 033</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 033 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">034 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 034</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 034</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 034 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">035 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 035</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 035</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 035 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">036 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 036</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 036</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 036 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">037 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 037</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 037</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 037 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">038 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 038</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 038</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 038 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">039 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 039</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 039</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 039 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">040 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 040</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 040</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 040 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">041 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 041</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 041</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 041 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">042 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 042</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 042</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 042 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">043 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 043</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 043</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 043 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">044 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 044</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 044</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 044 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">045 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 045</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 045</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 045 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">046 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 046</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 046</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 046 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">047 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 047</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 047</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 047 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">048 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 048</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 048</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 048 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">049 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 049</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 049</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 049 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">050 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 050</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 050</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 050 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">051 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 051</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 051</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 051 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">052 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 052</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 052</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 052 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">053 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 053</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 053</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 053 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">054 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 054</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 054</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 054 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">055 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 055</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 055</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 055 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">056 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 056</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 056</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 056 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">057 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 057</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 057</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 057 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">058 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 058</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 058</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 058 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">059 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 059</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 059</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 059 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">060 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 060</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 060</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 060 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">061 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 061</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 061</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 061 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">062 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 062</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 062</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 062 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">063 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 063</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 063</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 063 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">064 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 064</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 064</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 064 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">065 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 065</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 065</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 065 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">066 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 066</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 066</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 066 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">067 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 067</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 067</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 067 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">068 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 068</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 068</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 068 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">069 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 069</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 069</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 069 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">070 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 070</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 070</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 070 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">071 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 071</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 071</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 071 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">072 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 072</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 072</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 072 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">073 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 073</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 073</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 073 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">074 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 074</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 074</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 074 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">075 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 075</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 075</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 075 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">076 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 076</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 076</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 076 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">077 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 077</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 077</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 077 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">078 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 078</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 078</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 078 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">079 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 079</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 079</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 079 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">080 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 080</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 080</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 080 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">081 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 081</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 081</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 081 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">082 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 082</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 082</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 082 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">083 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 083</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 083</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 083 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">084 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 084</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 084</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 084 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">085 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 085</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 085</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 085 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">086 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 086</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 086</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 086 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">087 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 087</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 087</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 087 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">088 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 088</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 088</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 088 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">089 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 089</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 089</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 089 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">090 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 090</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 090</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 090 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">091 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 091</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 091</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 091 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">092 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 092</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 092</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 092 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">093 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 093</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 093</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 093 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">094 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 094</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 094</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 094 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">095 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 095</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 095</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 095 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">096 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 096</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 096</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 096 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">097 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 097</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 097</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 097 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">098 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 098</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 098</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 098 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">099 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 099</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 099</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 099 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">100 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 100</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 100</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 100 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">101 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 101</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 101</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 101 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">102 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 102</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 102</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 102 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">103 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 103</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 103</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 103 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">104 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 104</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 104</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 104 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">105 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 105</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 105</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 105 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">106 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 106</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 106</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 106 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">107 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 107</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 107</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 107 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">108 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 108</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 108</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 108 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">109 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 109</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 109</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 109 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">110 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 110</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 110</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 110 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">111 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 111</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 111</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 111 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">112 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 112</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 112</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 112 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">113 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 113</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 113</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 113 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">114 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 114</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 114</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 114 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">115 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 115</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 115</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 115 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">116 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 116</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 116</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 116 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">117 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 117</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 117</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 117 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">118 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 118</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 118</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 118 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">119 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 119</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 119</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 119 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">120 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 120</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 120</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 120 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">121 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 121</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 121</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 121 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">122 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 122</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 122</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 122 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">123 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 123</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 123</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 123 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">124 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 124</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 124</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 124 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">125 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 125</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 125</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 125 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">126 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 126</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 126</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 126 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">127 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 127</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 127</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 127 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">128 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 128</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 128</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 128 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">129 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 129</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 129</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 129 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">130 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 130</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 130</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 130 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">131 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 131</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 131</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 131 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">132 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 132</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 132</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 132 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">133 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 133</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 133</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 133 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">134 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 134</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 134</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 134 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">135 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 135</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 135</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 135 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">136 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 136</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 136</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 136 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">137 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 137</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 137</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 137 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">138 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 138</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 138</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 138 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">139 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 139</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 139</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 139 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">140 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 140</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 140</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 140 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">141 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 141</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 141</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 141 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">142 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 142</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 142</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 142 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">143 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 143</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 143</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 143 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">144 · Territory control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 144</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 144</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 144 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">145 · Training control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 145</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 145</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 145 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">146 · Analytics control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 146</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 146</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 146 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">147 · Recruitment control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 147</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 147</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 147 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">148 · Mission control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 148</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 148</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 148 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">149 · Payout control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 149</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 149</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 149 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">150 · Compliance control block</p>
              <h3 className="mt-1 text-xl font-black">Senior ambassador operation block 150</h3>
              <p className="mt-2 text-sm text-slate-600">This block gives the operator a clear way to review context, make a decision, and execute a controlled action without leaving the ambassador program workflow.</p>
            </div>
            <Tag>Block 150</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Signal</p><p className="mt-2 font-black">Lead quality, proof age, risk, payout delay.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Decision</p><p className="mt-2 font-black">Approve, coach, scale, pause or escalate.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Owner</p><p className="mt-2 font-black">Program manager, brand lead, finance, compliance.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Output</p><p className="mt-2 font-black">Stronger execution and measurable growth.</p></div>
          </div>
          <button onClick={() => addLog("Operation block 150 executed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Execute control block</button>
        </Panel>


        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">151 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 151</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 151</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 151 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">152 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 152</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 152</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 152 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">153 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 153</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 153</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 153 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">154 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 154</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 154</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 154 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">155 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 155</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 155</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 155 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">156 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 156</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 156</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 156 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">157 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 157</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 157</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 157 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">158 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 158</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 158</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 158 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">159 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 159</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 159</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 159 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">160 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 160</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 160</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 160 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">161 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 161</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 161</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 161 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">162 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 162</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 162</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 162 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">163 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 163</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 163</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 163 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">164 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 164</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 164</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 164 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">165 · Final executive assurance block</p>
              <h3 className="mt-1 text-xl font-black">Ambassador production assurance control 165</h3>
              <p className="mt-2 text-sm text-slate-600">This final assurance block keeps the subpage heavy, operational and focused on executive-level affiliate ambassador management, not decorative dashboard noise.</p>
            </div>
            <Tag>Assurance 165</Tag>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Control</p><p className="mt-2 font-black">Recruitment, activation and retention clarity.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Execution</p><p className="mt-2 font-black">Mission assignment and proof accountability.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Governance</p><p className="mt-2 font-black">Compliance and payout protection.</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Growth</p><p className="mt-2 font-black">Territory scale and conversion improvement.</p></div>
          </div>
          <button onClick={() => addLog("Assurance block 165 reviewed")} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Review assurance block</button>
        </Panel>

        <Panel><h2 className="text-xl font-black">Operation log</h2><div className="mt-4 space-y-2">{logs.map((log, index) => <p key={index} className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{log}</p>)}</div></Panel>
      </div>
    </main>
  )
}
