"use client"

import { useEffect, useMemo, useState } from "react"

type Objective = {
  id: string
  title: string
  owner_name: string | null
  priority: "P0" | "P1" | "P2" | "P3"
  status: "planned" | "active" | "blocked" | "completed"
  target_mad: number | null
  next_action: string | null
  deadline?: string | null
}

type Step = {
  id: string
  objective_id: string
  title: string
  owner_name: string | null
  status: "todo" | "doing" | "done" | "blocked"
}

type ExecutionNote = {
  id: string
  objective_id: string
  step_id: string | null
  note_type: "note" | "blocker" | "risk" | "escalation" | "decision" | "resolution"
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "review" | "resolved" | "archived"
  title: string
  body: string | null
  owner_name: string | null
  created_at: string
}

type AuditEvent = {
  id: string
  objective_id: string | null
  event_type: string
  event_title: string
  event_summary: string | null
  actor_name: string | null
  source_module: string | null
  created_at: string
}

const emptyForm = {
  title: "",
  owner_name: "",
  priority: "P1",
  status: "active",
  target_mad: 0,
  next_action: "",
  deadline: "",
}

function badgeClass(value: string) {
  if (value === "P0" || value === "blocked" || value === "critical" || value === "high" || value === "open") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (value === "P1" || value === "active" || value === "doing" || value === "medium" || value === "review") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (value === "completed" || value === "done" || value === "resolved" || value === "low") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function formatMad(value: number | null) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export default function StrategyGrowthControlRoom() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [notes, setNotes] = useState<ExecutionNote[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [form, setForm] = useState<any>(emptyForm)
  const [stepTitle, setStepTitle] = useState<Record<string, string>>({})
  const [noteForm, setNoteForm] = useState<Record<string, any>>({})
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  async function safeJson(res: Response) {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  async function loadObjectives() {
    const res = await fetch("/api/market-os/strategy-objectives")
    const json = await safeJson(res)
    if (!res.ok) setMessage(json.error || "Failed to load objectives")
    else setObjectives(json.data || [])
  }

  async function loadSteps() {
    const res = await fetch("/api/market-os/objective-steps")
    const json = await safeJson(res)
    if (!res.ok) setMessage(json.error || "Failed to load steps")
    else setSteps(json.data || [])
  }

  async function loadNotes() {
    const res = await fetch("/api/market-os/execution-notes")
    const json = await safeJson(res)
    if (!res.ok) setMessage(json.error || "Failed to load notes")
    else setNotes(json.data || [])
  }

  async function loadAuditEvents() {
    const res = await fetch("/api/market-os/audit-events")
    const json = await safeJson(res)
    if (!res.ok) setAuditEvents([])
    else setAuditEvents(json.data || [])
  }

  async function reloadAll() {
    setLoading(true)
    setMessage("")
    await Promise.all([loadObjectives(), loadSteps(), loadNotes(), loadAuditEvents()])
    setLoading(false)
  }

  useEffect(() => {
    reloadAll()
  }, [])

  async function logEvent(objectiveId: string | null, title: string, summary?: string) {
    try {
      await fetch("/api/market-os/audit-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective_id: objectiveId,
          event_type: "action",
          event_title: title,
          event_summary: summary || null,
          actor_name: "User",
          source_module: "Strategy Growth Control Room",
        }),
      })
      await loadAuditEvents()
    } catch {}
  }

  async function createObjective() {
    if (!form.title.trim()) return setMessage("Title is required")
    setLoading(true)
    setMessage("")

    const res = await fetch("/api/market-os/strategy-objectives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to create objective")
    else {
      setForm(emptyForm)
      await logEvent(json.data?.id || null, "Objective created", form.title)
      await reloadAll()
    }

    setLoading(false)
  }

  function startEdit(item: Objective) {
    setEditingId(item.id)
    setEditForm({ ...item, deadline: item.deadline || "" })
  }

  async function saveEdit() {
    if (!editForm.id) return
    setLoading(true)
    setMessage("")

    const res = await fetch("/api/market-os/strategy-objectives", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })

    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to save objective")
    else {
      await logEvent(editForm.id, "Objective edited", editForm.title)
      setEditingId(null)
      await reloadAll()
    }

    setLoading(false)
  }

  async function updateObjective(item: Objective, status: Objective["status"]) {
    setLoading(true)
    setMessage("")

    const res = await fetch("/api/market-os/strategy-objectives", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, status }),
    })

    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to update objective")
    else {
      await logEvent(item.id, `Objective marked as ${status.toUpperCase()}`, item.title)
      await reloadAll()
    }

    setLoading(false)
  }

  async function deleteObjective(id: string) {
    setLoading(true)
    setMessage("")

    const deleted = objectives.find((objective) => objective.id === id)
    const res = await fetch(`/api/market-os/strategy-objectives?id=${id}`, { method: "DELETE" })
    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to delete objective")
    else {
      await logEvent(null, "Objective deleted", deleted?.title || id)
      await reloadAll()
    }

    setLoading(false)
  }

  async function generateTaskChain(item: Objective) {
    setLoading(true)
    setMessage("")

    const res = await fetch("/api/market-os/ai-generate-task-chain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective_title: item.title, owner_name: item.owner_name }),
    })

    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to generate task chain")
    else {
      await logEvent(item.id, "Task chain generated", item.title)
      setMessage("Task chain generated successfully. Open AI Task Chain Orchestrator.")
    }

    setLoading(false)
  }

  async function addStep(objectiveId: string) {
    const title = stepTitle[objectiveId]?.trim()
    if (!title) return setMessage("Step title is required")

    setLoading(true)
    setMessage("")

    const objective = objectives.find((item) => item.id === objectiveId)

    const res = await fetch("/api/market-os/objective-steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objective_id: objectiveId,
        title,
        owner_name: objective?.owner_name || "",
        status: "todo",
      }),
    })

    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to add step")
    else {
      setStepTitle({ ...stepTitle, [objectiveId]: "" })
      await logEvent(objectiveId, "Execution step added", title)
      await loadSteps()
    }

    setLoading(false)
  }

  async function updateStep(step: Step, status: Step["status"]) {
    setLoading(true)
    setMessage("")

    const res = await fetch("/api/market-os/objective-steps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...step, status }),
    })

    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to update step")
    else {
      await logEvent(step.objective_id, `Execution step marked as ${status.toUpperCase()}`, step.title)
      await loadSteps()
    }

    setLoading(false)
  }

  async function deleteStep(step: Step) {
    setLoading(true)
    setMessage("")

    const res = await fetch(`/api/market-os/objective-steps?id=${step.id}`, { method: "DELETE" })
    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to delete step")
    else {
      await logEvent(step.objective_id, "Execution step deleted", step.title)
      await loadSteps()
    }

    setLoading(false)
  }

  async function addNote(objectiveId: string) {
    const draft = noteForm[objectiveId] || {}
    if (!draft.title?.trim()) return setMessage("Note title is required")

    setLoading(true)
    setMessage("")

    const objective = objectives.find((item) => item.id === objectiveId)

    const res = await fetch("/api/market-os/execution-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objective_id: objectiveId,
        note_type: draft.note_type || "note",
        severity: draft.severity || "medium",
        title: draft.title,
        body: draft.body || "",
        owner_name: draft.owner_name || objective?.owner_name || "",
        status: "open",
      }),
    })

    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to add note")
    else {
      setNoteForm({ ...noteForm, [objectiveId]: {} })
      await logEvent(objectiveId, `${(draft.note_type || "note").toUpperCase()} added`, draft.title)
      await loadNotes()
    }

    setLoading(false)
  }

  async function updateNote(note: ExecutionNote, status: ExecutionNote["status"]) {
    setLoading(true)
    setMessage("")

    const res = await fetch("/api/market-os/execution-notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...note, status }),
    })

    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to update note")
    else {
      await logEvent(note.objective_id, `Execution note marked as ${status.toUpperCase()}`, note.title)
      await loadNotes()
    }

    setLoading(false)
  }

  async function deleteNote(note: ExecutionNote) {
    setLoading(true)
    setMessage("")

    const res = await fetch(`/api/market-os/execution-notes?id=${note.id}`, { method: "DELETE" })
    const json = await safeJson(res)

    if (!res.ok) setMessage(json.error || "Failed to delete note")
    else {
      await logEvent(note.objective_id, "Execution note deleted", note.title)
      await loadNotes()
    }

    setLoading(false)
  }

  function stepsForObjective(objectiveId: string) {
    return steps.filter((step) => step.objective_id === objectiveId)
  }

  function notesForObjective(objectiveId: string) {
    return notes.filter((note) => note.objective_id === objectiveId)
  }

  function auditForObjective(objectiveId: string) {
    return auditEvents.filter((event) => event.objective_id === objectiveId)
  }

  function progressForObjective(objectiveId: string) {
    const list = stepsForObjective(objectiveId)
    if (!list.length) return 0
    return Math.round((list.filter((step) => step.status === "done").length / list.length) * 100)
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return objectives.filter((item) => {
      return (
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.owner_name?.toLowerCase().includes(q) ||
        item.next_action?.toLowerCase().includes(q)
      )
    })
  }, [objectives, query])

  const active = objectives.filter((item) => item.status === "active").length
  const blocked = objectives.filter((item) => item.status === "blocked").length
  const completed = objectives.filter((item) => item.status === "completed").length
  const openNotes = notes.filter((note) => note.status === "open").length
  const criticalNotes = notes.filter((note) => note.severity === "critical" || note.severity === "high").length
  const totalTarget = objectives.reduce((sum, objective) => sum + Number(objective.target_mad || 0), 0)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Market-OS · Strategy Execution Recovery Build</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Strategy Growth Control Room</h1>
          <p className="mt-4 max-w-3xl text-slate-300">Cumulative hardened component: objectives, edit control, task-chain generation, execution checklists, blockers, escalation notes and audit timeline.</p>
          <div className="mt-8 grid gap-3 md:grid-cols-6">
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Active</p><p className="mt-2 text-3xl font-black">{active}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Blocked</p><p className="mt-2 text-3xl font-black">{blocked}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Completed</p><p className="mt-2 text-3xl font-black">{completed}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Open Notes</p><p className="mt-2 text-3xl font-black">{openNotes}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">High/Critical</p><p className="mt-2 text-3xl font-black">{criticalNotes}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Target</p><p className="mt-2 text-xl font-black">{formatMad(totalTarget)}</p></div>
          </div>
        </div>

        {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">{message}</div>}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Create Strategic Objective</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Objective title" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Owner" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"><option value="planned">Planned</option><option value="active">Active</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select>
            <input type="number" value={form.target_mad} onChange={(e) => setForm({ ...form, target_mad: Number(e.target.value) })} placeholder="Target MAD" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
            <input value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} placeholder="Next action" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 md:col-span-2" />
          </div>
          <button onClick={createObjective} disabled={loading} className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? "Saving..." : "Create Objective"}</button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search objectives..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900" />
        </div>

        <div className="grid gap-5">
          {filtered.map((item) => {
            const objectiveSteps = stepsForObjective(item.id)
            const objectiveNotes = notesForObjective(item.id)
            const objectiveAudit = auditForObjective(item.id)
            const progress = progressForObjective(item.id)
            const draft = noteForm[item.id] || {}

            return (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="w-full">
                    <div className="mb-3 flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.priority)}`}>{item.priority}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.status)}`}>{item.status}</span></div>
                    {editingId === item.id ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                        <input value={editForm.owner_name || ""} onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                        <select value={editForm.priority || "P1"} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select>
                        <select value={editForm.status || "active"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"><option value="planned">Planned</option><option value="active">Active</option><option value="blocked">Blocked</option><option value="completed">Completed</option></select>
                        <input type="number" value={editForm.target_mad || 0} onChange={(e) => setEditForm({ ...editForm, target_mad: Number(e.target.value) })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                        <input type="date" value={editForm.deadline || ""} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                        <input value={editForm.next_action || ""} onChange={(e) => setEditForm({ ...editForm, next_action: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" />
                        <button onClick={saveEdit} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Save</button>
                        <button onClick={() => setEditingId(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-black">{item.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">Owner: {item.owner_name || "Unassigned"} · Target: {formatMad(item.target_mad)} · Deadline: {item.deadline || "Not set"}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 p-4"><div className="mb-2 flex justify-between text-sm"><span className="font-bold">Objective Progress</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950" style={{ width: `${progress}%` }} /></div></div>
                <div className="mt-5 rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase text-slate-500">Next Action</p><p className="mt-2 text-sm text-slate-700">{item.next_action || "No next action yet."}</p></div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-black">Execution Checklist</h3>
                  <div className="mt-3 flex gap-2"><input value={stepTitle[item.id] || ""} onChange={(e) => setStepTitle({ ...stepTitle, [item.id]: e.target.value })} placeholder="Add execution step..." className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm" /><button onClick={() => addStep(item.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Add Step</button></div>
                  <div className="mt-4 grid gap-2">
                    {objectiveSteps.map((step) => (
                      <div key={step.id} className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="font-bold">{step.title}</p><p className="text-xs text-slate-500">Owner: {step.owner_name || "Unassigned"}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(step.status)}`}>{step.status}</span><button onClick={() => updateStep(step, "doing")} className="rounded-xl border px-3 py-1 text-xs font-bold">Doing</button><button onClick={() => updateStep(step, "done")} className="rounded-xl border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">Done</button><button onClick={() => updateStep(step, "blocked")} className="rounded-xl border border-red-200 px-3 py-1 text-xs font-bold text-red-700">Block</button><button onClick={() => deleteStep(step)} className="rounded-xl border px-3 py-1 text-xs font-bold">Delete</button></div></div></div>
                    ))}
                    {!objectiveSteps.length && <p className="text-sm text-slate-500">No checklist steps yet.</p>}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-black">Blockers, Escalations & Notes</h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <input value={draft.title || ""} onChange={(e) => setNoteForm({ ...noteForm, [item.id]: { ...draft, title: e.target.value } })} placeholder="Title" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                    <select value={draft.note_type || "note"} onChange={(e) => setNoteForm({ ...noteForm, [item.id]: { ...draft, note_type: e.target.value } })} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"><option value="note">Note</option><option value="blocker">Blocker</option><option value="risk">Risk</option><option value="escalation">Escalation</option><option value="decision">Decision</option><option value="resolution">Resolution</option></select>
                    <select value={draft.severity || "medium"} onChange={(e) => setNoteForm({ ...noteForm, [item.id]: { ...draft, severity: e.target.value } })} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
                    <input value={draft.owner_name || ""} onChange={(e) => setNoteForm({ ...noteForm, [item.id]: { ...draft, owner_name: e.target.value } })} placeholder="Owner" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                    <textarea value={draft.body || ""} onChange={(e) => setNoteForm({ ...noteForm, [item.id]: { ...draft, body: e.target.value } })} placeholder="Details / context / resolution requirement..." className="rounded-2xl border border-slate-200 px-4 py-2 text-sm md:col-span-3" />
                    <button onClick={() => addNote(item.id)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Add Note</button>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {objectiveNotes.map((note) => (
                      <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(note.severity)}`}>{note.severity}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(note.status)}`}>{note.status}</span><span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold">{note.note_type}</span></div><p className="mt-2 font-bold">{note.title}</p><p className="mt-1 text-sm text-slate-600">{note.body || "No details."}</p><p className="mt-1 text-xs text-slate-500">Owner: {note.owner_name || "Unassigned"}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => updateNote(note, "review")} className="rounded-xl border px-3 py-1 text-xs font-bold">Review</button><button onClick={() => updateNote(note, "resolved")} className="rounded-xl border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">Resolve</button><button onClick={() => updateNote(note, "archived")} className="rounded-xl border px-3 py-1 text-xs font-bold">Archive</button><button onClick={() => deleteNote(note)} className="rounded-xl border border-red-200 px-3 py-1 text-xs font-bold text-red-700">Delete</button></div></div></div>
                    ))}
                    {!objectiveNotes.length && <p className="text-sm text-slate-500">No blockers, escalations or notes yet.</p>}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-black">Audit Timeline</h3>
                  <div className="mt-3 grid gap-2">
                    {objectiveAudit.slice(0, 8).map((event) => (<div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-3"><p className="text-sm font-bold">{event.event_title}</p><p className="text-xs text-slate-500">{event.actor_name || "System"} · {event.created_at ? new Date(event.created_at).toLocaleString() : "No date"}</p>{event.event_summary && <p className="mt-1 text-xs text-slate-600">{event.event_summary}</p>}</div>))}
                    {!objectiveAudit.length && <p className="text-sm text-slate-500">No audit events yet. Actions will appear here once Pack 11 API is installed.</p>}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => startEdit(item)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Edit</button>
                  <button onClick={() => updateObjective(item, "active")} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Mark Active</button>
                  <button onClick={() => updateObjective(item, "blocked")} className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Mark Blocked</button>
                  <button onClick={() => updateObjective(item, "completed")} className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700">Complete</button>
                  <button onClick={() => generateTaskChain(item)} className="rounded-2xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700">Generate Task Chain</button>
                  <button onClick={() => deleteObjective(item.id)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
