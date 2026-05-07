"use client"

import * as React from "react"
import Link from "next/link"
import {
  AMBASSADOR_STORAGE_KEY,
  MISSION_STORAGE_KEY,
  PROGRAM_STORAGE_KEY,
  REWARD_STORAGE_KEY,
  readJson,
  writeJson,
  uid,
} from "@/components/market-os/ambassadors/ambassador-v3-shared"

type AmbassadorRecord = {
  id: string
  name: string
  phone?: string
  email?: string
  city?: string
  territory?: string
  status?: string
  tier?: string
  program?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

type MissionRecord = {
  id: string
  title: string
  ambassadorId?: string
  missionType?: string
  dueDate?: string
  status?: string
  reward?: string
  proofRequired?: string
  instructions?: string
  createdAt?: string
  updatedAt?: string
}

type ProgramRecord = {
  id: string
  name: string
  tier?: string
  commission?: string
  eligibility?: string
  regions?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

type RewardRecord = {
  id: string
  ambassadorId?: string
  title?: string
  amount?: string | number
  reason?: string
  payoutDate?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

type AgendaType = "follow-up" | "mission" | "approval" | "payout" | "training" | "recruitment" | "compliance"
type AgendaStatus = "planned" | "in-progress" | "done" | "blocked"
type AgendaPriority = "Low" | "Medium" | "High" | "Critical"

type AgendaRecord = {
  id: string
  title: string
  owner: string
  agendaType: AgendaType
  dueDate: string
  priority: AgendaPriority
  status: AgendaStatus
  linkedAmbassadorId: string
  notes: string
  createdAt: string
  updatedAt: string
}

const AGENDA_STORAGE_KEY = "angelcare_market_os_ambassador_agenda_v4"
const agendaTypes: AgendaType[] = ["follow-up", "mission", "approval", "payout", "training", "recruitment", "compliance"]
const priorities: AgendaPriority[] = ["Low", "Medium", "High", "Critical"]
const agendaStatuses: AgendaStatus[] = ["planned", "in-progress", "done", "blocked"]

function todayISO(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function label(value?: string) {
  if (!value) return "Not set"
  return value.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    return readJson<T>(key, fallback)
  } catch {
    return fallback
  }
}

function safeWrite<T>(key: string, value: T) {
  try {
    writeJson(key, value)
  } catch {
    // localStorage can be unavailable during unusual render contexts.
  }
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

function seedAmbassadors(): AmbassadorRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "amb-rabat-mothers",
      name: "Rabat Mothers Circle",
      phone: "+212 600 000 001",
      email: "rabat.mothers@angelcare.local",
      city: "Rabat",
      territory: "Rabat-Sale-Kenitra",
      status: "active",
      tier: "gold",
      program: "Community Mothers Program",
      notes: "High-performing community ambassador group focused on mothers and postpartum referrals.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "amb-casa-clinic",
      name: "Casablanca Clinic Partners",
      phone: "+212 600 000 002",
      email: "clinic.partners@angelcare.local",
      city: "Casablanca",
      territory: "Grand Casablanca",
      status: "active",
      tier: "silver",
      program: "Clinic Referral Program",
      notes: "Clinic network ambassadors supporting referral growth and partner activation.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedMissions(): MissionRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "mission-proof-001",
      title: "Collect clinic referral proof",
      ambassadorId: "amb-casa-clinic",
      missionType: "proof-validation",
      dueDate: todayISO(2),
      status: "in-progress",
      reward: "300 MAD",
      proofRequired: "Partner screenshot or signed confirmation",
      instructions: "Validate referral source and prepare it for approval.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedPrograms(): ProgramRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "program-community",
      name: "Community Mothers Program",
      tier: "gold",
      commission: "10%",
      eligibility: "Active community presence and proof quality above 85%.",
      regions: "Rabat, Temara, Sale",
      notes: "Designed for trusted community lead generation.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedRewards(): RewardRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "reward-001",
      ambassadorId: "amb-rabat-mothers",
      title: "Community activation bonus",
      amount: "450",
      reason: "Validated awareness push and lead submission.",
      payoutDate: todayISO(7),
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedAgenda(): AgendaRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: "agenda-001",
      title: "Review Rabat Mothers proof pack",
      owner: "Program Manager",
      agendaType: "approval",
      dueDate: todayISO(1),
      priority: "High",
      status: "planned",
      linkedAmbassadorId: "amb-rabat-mothers",
      notes: "Check proof quality, lead list quality, and payout eligibility.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "agenda-002",
      title: "Prepare Casablanca clinic payout validation",
      owner: "Finance + Ambassador Lead",
      agendaType: "payout",
      dueDate: todayISO(3),
      priority: "Medium",
      status: "planned",
      linkedAmbassadorId: "amb-casa-clinic",
      notes: "Confirm approved proof and prepare payout record.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

const emptyAgenda = (): Omit<AgendaRecord, "id" | "createdAt" | "updatedAt"> => ({
  title: "",
  owner: "Program Manager",
  agendaType: "follow-up",
  dueDate: todayISO(1),
  priority: "Medium",
  status: "planned",
  linkedAmbassadorId: "",
  notes: "",
})

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" | "amber" | "rose" | "blue" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  }
  return <span className={classNames("inline-flex rounded-full border px-3 py-1 text-xs font-black", tones[tone])}>{children}</span>
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={classNames("rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</section>
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}

const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"

function DashboardMetric({ label, value, note, tone }: { label: string; value: string | number; note: string; tone: "emerald" | "blue" | "amber" | "rose" }) {
  const map = {
    emerald: "bg-emerald-950 text-emerald-50",
    blue: "bg-blue-950 text-blue-50",
    amber: "bg-amber-950 text-amber-50",
    rose: "bg-rose-950 text-rose-50",
  }
  return (
    <div className={classNames("rounded-3xl p-5 shadow-sm", map[tone])}>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
      <p className="mt-2 text-sm font-bold opacity-75">{note}</p>
    </div>
  )
}

export default function AmbassadorAgendaPage() {
  const [ambassadors, setAmbassadors] = React.useState<AmbassadorRecord[]>([])
  const [missions, setMissions] = React.useState<MissionRecord[]>([])
  const [programs, setPrograms] = React.useState<ProgramRecord[]>([])
  const [rewards, setRewards] = React.useState<RewardRecord[]>([])
  const [agenda, setAgenda] = React.useState<AgendaRecord[]>([])
  const [form, setForm] = React.useState(emptyAgenda())
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [selectedDate, setSelectedDate] = React.useState(todayISO(0))
  const [message, setMessage] = React.useState("Agenda workspace ready.")

  React.useEffect(() => {
    const loadedAmbassadors = safeRead<AmbassadorRecord[]>(AMBASSADOR_STORAGE_KEY, seedAmbassadors())
    const loadedMissions = safeRead<MissionRecord[]>(MISSION_STORAGE_KEY, seedMissions())
    const loadedPrograms = safeRead<ProgramRecord[]>(PROGRAM_STORAGE_KEY, seedPrograms())
    const loadedRewards = safeRead<RewardRecord[]>(REWARD_STORAGE_KEY, seedRewards())
    const loadedAgenda = safeRead<AgendaRecord[]>(AGENDA_STORAGE_KEY, seedAgenda())

    setAmbassadors(loadedAmbassadors)
    setMissions(loadedMissions)
    setPrograms(loadedPrograms)
    setRewards(loadedRewards)
    setAgenda(loadedAgenda)

    safeWrite(AMBASSADOR_STORAGE_KEY, loadedAmbassadors)
    safeWrite(MISSION_STORAGE_KEY, loadedMissions)
    safeWrite(PROGRAM_STORAGE_KEY, loadedPrograms)
    safeWrite(REWARD_STORAGE_KEY, loadedRewards)
    safeWrite(AGENDA_STORAGE_KEY, loadedAgenda)
  }, [])

  function persistAgenda(next: AgendaRecord[], logMessage: string) {
    setAgenda(next)
    safeWrite(AGENDA_STORAGE_KEY, next)
    setMessage(logMessage)
  }

  function resetForm() {
    setForm({ ...emptyAgenda(), dueDate: selectedDate || todayISO(1) })
    setEditingId(null)
  }

  function saveAgendaItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const now = new Date().toISOString()
    if (!form.title.trim()) {
      setMessage("Agenda title is required.")
      return
    }

    if (editingId) {
      const next = agenda.map(item => item.id === editingId ? { ...item, ...form, updatedAt: now } : item)
      persistAgenda(next, "Agenda item updated.")
      resetForm()
      return
    }

    const record: AgendaRecord = {
      id: uid(),
      ...form,
      linkedAmbassadorId: form.linkedAmbassadorId || ambassadors[0]?.id || "",
      createdAt: now,
      updatedAt: now,
    }
    persistAgenda([record, ...agenda], "Agenda item created and saved.")
    resetForm()
  }

  function editAgendaItem(item: AgendaRecord) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      owner: item.owner,
      agendaType: item.agendaType,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status,
      linkedAmbassadorId: item.linkedAmbassadorId,
      notes: item.notes,
    })
    setSelectedDate(item.dueDate)
    setMessage(`Editing ${item.title}`)
  }

  function deleteAgendaItem(id: string) {
    const target = agenda.find(item => item.id === id)
    const next = agenda.filter(item => item.id !== id)
    persistAgenda(next, target ? `Deleted ${target.title}` : "Agenda item deleted.")
    if (editingId === id) resetForm()
  }

  function updateStatus(id: string, status: AgendaStatus) {
    const next = agenda.map(item => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item)
    persistAgenda(next, `Agenda item moved to ${label(status)}.`)
  }

  function createMissionFromAgenda(item: AgendaRecord) {
    const now = new Date().toISOString()
    const mission: MissionRecord = {
      id: uid(),
      title: item.title,
      ambassadorId: item.linkedAmbassadorId,
      missionType: item.agendaType === "mission" ? "field-mission" : item.agendaType,
      dueDate: item.dueDate,
      status: "planned",
      reward: "",
      proofRequired: "Required",
      instructions: item.notes,
      createdAt: now,
      updatedAt: now,
    }
    const nextMissions = [mission, ...missions]
    setMissions(nextMissions)
    safeWrite(MISSION_STORAGE_KEY, nextMissions)
    setMessage("Mission created from agenda item and synced to missions storage.")
  }

  function createRewardFromAgenda(item: AgendaRecord) {
    const now = new Date().toISOString()
    const reward: RewardRecord = {
      id: uid(),
      ambassadorId: item.linkedAmbassadorId,
      title: item.title,
      amount: "",
      reason: item.notes,
      payoutDate: item.dueDate,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    }
    const nextRewards = [reward, ...rewards]
    setRewards(nextRewards)
    safeWrite(REWARD_STORAGE_KEY, nextRewards)
    setMessage("Reward draft created from agenda item and synced to rewards storage.")
  }

  const selectedAmbassador = React.useMemo(() => ambassadors.find(a => a.id === form.linkedAmbassadorId) || ambassadors[0], [ambassadors, form.linkedAmbassadorId])

  const filteredAgenda = React.useMemo(() => {
    return agenda.filter(item => {
      const ambassador = ambassadors.find(a => a.id === item.linkedAmbassadorId)
      const haystack = `${item.title} ${item.owner} ${item.agendaType} ${item.priority} ${item.status} ${item.notes} ${ambassador?.name || ""}`.toLowerCase()
      return (!query || haystack.includes(query.toLowerCase()))
        && (statusFilter === "all" || item.status === statusFilter)
        && (typeFilter === "all" || item.agendaType === typeFilter)
    })
  }, [agenda, ambassadors, query, statusFilter, typeFilter])

  const selectedDateItems = React.useMemo(() => filteredAgenda.filter(item => item.dueDate === selectedDate), [filteredAgenda, selectedDate])

  const monthCells = React.useMemo(() => {
    const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()
    const year = base.getFullYear()
    const month = base.getMonth()
    const first = new Date(year, month, 1)
    const startOffset = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - startOffset + 1
      const date = new Date(year, month, day)
      const iso = date.toISOString().slice(0, 10)
      return {
        key: `${year}-${month}-${index}`,
        day,
        iso,
        inMonth: day >= 1 && day <= daysInMonth,
        items: filteredAgenda.filter(item => item.dueDate === iso),
      }
    })
  }, [selectedDate, filteredAgenda])

  const todayItems = agenda.filter(item => item.dueDate === todayISO(0))
  const blocked = agenda.filter(item => item.status === "blocked")
  const openItems = agenda.filter(item => item.status !== "done")
  const critical = agenda.filter(item => item.priority === "Critical")
  const overdue = agenda.filter(item => item.dueDate < todayISO(0) && item.status !== "done")

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-[1800px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-slate-950 to-black p-6 text-white shadow-2xl lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="emerald">Market-OS</Pill>
                <Pill tone="blue">Ambassador Program</Pill>
                <Pill tone="amber">Agenda Command</Pill>
              </div>
              <h1 className="mt-6 max-w-5xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">Ambassador agenda and execution planning.</h1>
              <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-emerald-50/85 md:text-lg">A clean operational calendar for follow-ups, missions, approvals, training, payouts, recruitment and compliance actions. Every save, status change, mission creation and reward draft writes to localStorage and stays synced with the Ambassador workspace.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/market-os/ambassadors" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-950 shadow-lg">Back to ambassadors</Link>
                <Link href="/market-os/ambassadors/missions" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white">Open missions</Link>
                <Link href="/market-os/ambassadors/payouts" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white">Open payouts</Link>
                <button onClick={resetForm} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white">New agenda item</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DashboardMetric label="Open items" value={openItems.length} note="Not completed" tone="emerald" />
              <DashboardMetric label="Today" value={todayItems.length} note="Due today" tone="blue" />
              <DashboardMetric label="Critical" value={critical.length} note="Priority watch" tone="amber" />
              <DashboardMetric label="Blocked" value={blocked.length + overdue.length} note="Blocked/overdue" tone="rose" />
            </div>
          </div>
        </section>

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_.6fr_.6fr_.6fr]">
            <FieldBlock label="Search agenda"><input value={query} onChange={e => setQuery(e.target.value)} className={inputClass} placeholder="Search by title, ambassador, owner, notes..." /></FieldBlock>
            <FieldBlock label="Status"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputClass}><option value="all">All statuses</option>{agendaStatuses.map(status => <option key={status} value={status}>{label(status)}</option>)}</select></FieldBlock>
            <FieldBlock label="Type"><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={inputClass}><option value="all">All types</option>{agendaTypes.map(type => <option key={type} value={type}>{label(type)}</option>)}</select></FieldBlock>
            <FieldBlock label="Selected date"><input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setForm(current => ({ ...current, dueDate: e.target.value })) }} className={inputClass} /></FieldBlock>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">{editingId ? "Edit agenda item" : "Create agenda item"}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Manual planning form</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Fill, save and update agenda records. This page is manual and operator-controlled.</p>
              </div>
              <Pill tone={editingId ? "amber" : "emerald"}>{editingId ? "Editing" : "New"}</Pill>
            </div>

            <form onSubmit={saveAgendaItem} className="mt-6 grid gap-4">
              <FieldBlock label="Title"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Example: Review proof pack for Rabat campaign" /></FieldBlock>
              <div className="grid gap-4 md:grid-cols-2"><FieldBlock label="Owner"><input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} className={inputClass} /></FieldBlock><FieldBlock label="Due date"><input type="date" value={form.dueDate} onChange={e => { setForm({ ...form, dueDate: e.target.value }); setSelectedDate(e.target.value) }} className={inputClass} /></FieldBlock></div>
              <div className="grid gap-4 md:grid-cols-2"><FieldBlock label="Agenda type"><select value={form.agendaType} onChange={e => setForm({ ...form, agendaType: e.target.value as AgendaType })} className={inputClass}>{agendaTypes.map(type => <option key={type} value={type}>{label(type)}</option>)}</select></FieldBlock><FieldBlock label="Priority"><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as AgendaPriority })} className={inputClass}>{priorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}</select></FieldBlock></div>
              <div className="grid gap-4 md:grid-cols-2"><FieldBlock label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as AgendaStatus })} className={inputClass}>{agendaStatuses.map(status => <option key={status} value={status}>{label(status)}</option>)}</select></FieldBlock><FieldBlock label="Linked ambassador"><select value={form.linkedAmbassadorId} onChange={e => setForm({ ...form, linkedAmbassadorId: e.target.value })} className={inputClass}><option value="">Select ambassador</option>{ambassadors.map(ambassador => <option key={ambassador.id} value={ambassador.id}>{ambassador.name}</option>)}</select></FieldBlock></div>
              <FieldBlock label="Notes / execution instructions"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={classNames(inputClass, "min-h-[140px]")} placeholder="Add context, proof requirements, payout notes, follow-up steps..." /></FieldBlock>
              <div className="flex flex-wrap gap-3"><button type="submit" className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100">{editingId ? "Save changes" : "Create agenda item"}</button><button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Clear form</button>{editingId ? <button type="button" onClick={() => deleteAgendaItem(editingId)} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white">Delete item</button> : null}</div>
            </form>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Monthly agenda</p><h2 className="mt-2 text-2xl font-black text-slate-950">Planning calendar</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Click a day to plan work for that date.</p></div><Pill tone="blue">{selectedDate}</Pill></div>
            <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-slate-400">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day}>{day}</div>)}</div>
            <div className="mt-2 grid grid-cols-7 gap-2">{monthCells.map(cell => <button key={cell.key} type="button" onClick={() => { setSelectedDate(cell.iso); setForm(current => ({ ...current, dueDate: cell.iso })) }} className={classNames("min-h-[92px] rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md", cell.iso === selectedDate ? "border-emerald-700 bg-emerald-50" : "border-slate-200 bg-white", !cell.inMonth && "opacity-40")}><span className="text-xs font-black text-slate-700">{cell.inMonth ? cell.day : ""}</span><div className="mt-2 space-y-1">{cell.items.slice(0, 2).map(item => <div key={item.id} className="truncate rounded-lg bg-emerald-950 px-2 py-1 text-[10px] font-black text-white">{item.title}</div>)}{cell.items.length > 2 ? <p className="text-[10px] font-black text-slate-500">+{cell.items.length - 2} more</p> : null}</div></button>)}</div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Agenda list</p><h2 className="mt-2 text-2xl font-black text-slate-950">Actionable execution queue</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Edit, delete, complete, block, convert to mission, or create reward drafts.</p></div><Pill tone="slate">{filteredAgenda.length} visible</Pill></div>
            <div className="mt-6 space-y-3">{filteredAgenda.map(item => { const ambassador = ambassadors.find(a => a.id === item.linkedAmbassadorId); return <article key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Pill tone={item.status === "done" ? "emerald" : item.status === "blocked" ? "rose" : "blue"}>{label(item.status)}</Pill><Pill tone={item.priority === "Critical" ? "rose" : item.priority === "High" ? "amber" : "slate"}>{item.priority}</Pill><Pill tone="slate">{label(item.agendaType)}</Pill></div><h3 className="mt-3 text-lg font-black text-slate-950">{item.title}</h3><p className="mt-1 text-sm font-bold text-slate-500">{ambassador?.name || "No ambassador linked"} • Owner: {item.owner} • Due: {item.dueDate}</p><p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{item.notes || "No notes provided."}</p></div><div className="flex flex-wrap gap-2 lg:justify-end"><button onClick={() => editAgendaItem(item)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Edit</button><button onClick={() => updateStatus(item.id, "done")} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">Done</button><button onClick={() => updateStatus(item.id, "blocked")} className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white">Block</button><button onClick={() => createMissionFromAgenda(item)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Create mission</button><button onClick={() => createRewardFromAgenda(item)} className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white">Reward draft</button><button onClick={() => deleteAgendaItem(item.id)} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white">Delete</button></div></div></article> })}{filteredAgenda.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><h3 className="text-2xl font-black text-slate-950">No agenda items found.</h3><p className="mt-2 text-sm font-semibold text-slate-500">Create a new item or clear filters.</p></div> : null}</div>
          </Card>

          <div className="space-y-6">
            <Card><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Selected day</p><h2 className="mt-2 text-2xl font-black text-slate-950">{selectedDate}</h2><div className="mt-4 space-y-3">{selectedDateItems.map(item => <button key={item.id} onClick={() => editAgendaItem(item)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"><span className="text-sm font-black text-slate-950">{item.title}</span><span className="mt-1 block text-xs font-bold text-slate-500">{label(item.agendaType)} • {item.owner}</span></button>)}{selectedDateItems.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No agenda items on this date.</p> : null}</div></Card>
            <Card><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Active context</p><h2 className="mt-2 text-2xl font-black text-slate-950">{selectedAmbassador?.name || "No ambassador selected"}</h2><div className="mt-4 grid gap-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">Contact</p><p className="mt-1 text-sm font-black text-slate-950">{selectedAmbassador?.phone || "No phone"} • {selectedAmbassador?.email || "No email"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">Program</p><p className="mt-1 text-sm font-black text-slate-950">{selectedAmbassador?.program || "No program"} • {selectedAmbassador?.tier || "No tier"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">Territory</p><p className="mt-1 text-sm font-black text-slate-950">{selectedAmbassador?.territory || selectedAmbassador?.city || "No territory"}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><Link href="/market-os/ambassadors/create" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Create ambassador</Link><Link href="/market-os/ambassadors/programs" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Programs</Link><Link href="/market-os/ambassadors/rewards" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Rewards</Link></div></Card>
            <Card><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">System note</p><p className="mt-2 rounded-2xl bg-emerald-50 p-4 text-sm font-black leading-6 text-emerald-800">{message}</p></Card>
          </div>
        </div>
      </div>
    </main>
  )
}