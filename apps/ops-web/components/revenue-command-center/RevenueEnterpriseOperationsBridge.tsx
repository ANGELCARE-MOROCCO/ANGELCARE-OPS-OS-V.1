"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type EntityKey = "prospects" | "partnerships" | "b2c" | "appointments" | "tasks" | "follow-ups" | "campaigns" | "documents" | "notifications" | "decision-maps"

type FieldSpec = {
  name: string
  label: string
  type?: "text" | "number" | "datetime-local" | "textarea" | "select"
  required?: boolean
  options?: string[]
  placeholder?: string
}

type EntitySpec = {
  key: EntityKey
  label: string
  endpoint: string
  description: string
  fields: FieldSpec[]
}

const specs: EntitySpec[] = [
  {
    key: "prospects",
    label: "Prospect",
    endpoint: "/api/revenue-command-center/prospects",
    description: "Create a qualified pipeline prospect with value, owner, stage and next action.",
    fields: [
      { name: "name", label: "Prospect / organization", required: true, placeholder: "Clinique Atlas, Groupe scolaire..." },
      { name: "contactName", label: "Decision contact" },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email" },
      { name: "city", label: "City" },
      { name: "stage", label: "Stage", type: "select", options: ["new_lead", "discovery", "qualification", "decision_map", "appointment_ready", "proposal", "negotiation", "contracting", "closed_won", "closed_lost", "recovery"] },
      { name: "priority", label: "Priority", type: "select", options: ["critical", "high", "medium", "low"] },
      { name: "valueMad", label: "Estimated value MAD", type: "number" },
      { name: "owner", label: "Owner" },
      { name: "nextAction", label: "Next action", type: "textarea" },
    ],
  },
  {
    key: "partnerships",
    label: "Partnership",
    endpoint: "/api/revenue-command-center/partnerships",
    description: "Create a partner account with contract status, relationship notes and operational next step.",
    fields: [
      { name: "organization", label: "Partner organization", required: true },
      { name: "contactName", label: "Contact person" },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email" },
      { name: "partnershipType", label: "Type", type: "select", options: ["strategic", "referral", "academy", "clinic", "preschool", "corporate", "association"] },
      { name: "stage", label: "Stage", type: "select", options: ["prospecting", "qualification", "proposal", "negotiation", "contracting", "active", "paused"] },
      { name: "contractStatus", label: "Contract status", type: "select", options: ["not_started", "drafting", "sent", "negotiation", "signed", "blocked"] },
      { name: "potentialValueMad", label: "Potential value MAD", type: "number" },
      { name: "owner", label: "Owner" },
      { name: "relationshipNotes", label: "Relationship notes", type: "textarea" },
    ],
  },
  {
    key: "b2c",
    label: "B2C case",
    endpoint: "/api/revenue-command-center/b2c",
    description: "Create a live family case with intake, consultation, quote, matching and care-start workflow fields.",
    fields: [
      { name: "parentName", label: "Parent / family name", required: true },
      { name: "phone", label: "Phone" },
      { name: "email", label: "Email" },
      { name: "city", label: "City" },
      { name: "serviceInterest", label: "Service interest" },
      { name: "stage", label: "Stage", type: "select", options: ["intake", "consultation", "quote", "matching", "care_start", "active_client", "recovery"] },
      { name: "priority", label: "Priority", type: "select", options: ["critical", "high", "medium", "low"] },
      { name: "estimatedValueMad", label: "Estimated monthly value MAD", type: "number" },
      { name: "owner", label: "Owner" },
      { name: "notes", label: "Case notes", type: "textarea" },
    ],
  },
  {
    key: "appointments",
    label: "Appointment",
    endpoint: "/api/revenue-command-center/appointments",
    description: "Schedule a revenue appointment and keep it linked to pipeline activity when an entity ID is provided.",
    fields: [
      { name: "title", label: "Appointment title", required: true },
      { name: "entityId", label: "Linked entity ID / prospect ID" },
      { name: "appointmentAt", label: "Appointment start", type: "datetime-local", required: true },
      { name: "endAt", label: "Appointment end", type: "datetime-local" },
      { name: "appointmentType", label: "Type", type: "select", options: ["discovery", "qualification", "proposal", "negotiation", "follow_up", "recovery"] },
      { name: "location", label: "Location / channel" },
      { name: "owner", label: "Owner" },
      { name: "agenda", label: "Agenda", type: "textarea" },
      { name: "expectedOutcome", label: "Expected outcome", type: "textarea" },
    ],
  },
  {
    key: "tasks",
    label: "Task",
    endpoint: "/api/revenue-command-center/tasks",
    description: "Create an executable revenue task with owner, due date, priority and linked entity context.",
    fields: [
      { name: "title", label: "Task title", required: true },
      { name: "entityId", label: "Linked entity ID / prospect ID" },
      { name: "taskType", label: "Task type", type: "select", options: ["follow_up", "approval", "proposal", "call", "appointment", "document", "recovery"] },
      { name: "priority", label: "Priority", type: "select", options: ["critical", "high", "medium", "low"] },
      { name: "dueDate", label: "Due date", type: "datetime-local" },
      { name: "owner", label: "Owner" },
      { name: "description", label: "Execution note", type: "textarea" },
      { name: "expectedOutcome", label: "Expected outcome", type: "textarea" },
    ],
  },
  {
    key: "follow-ups",
    label: "Follow-up",
    endpoint: "/api/revenue-command-center/follow-ups",
    description: "Plan or close a follow-up with channel, result, next step and activity logging.",
    fields: [
      { name: "title", label: "Follow-up title", required: true },
      { name: "entityId", label: "Linked entity ID" },
      { name: "channel", label: "Channel", type: "select", options: ["call", "whatsapp", "email", "meeting", "visit"] },
      { name: "scheduledAt", label: "Scheduled date", type: "datetime-local" },
      { name: "priority", label: "Priority", type: "select", options: ["critical", "high", "medium", "low"] },
      { name: "owner", label: "Owner" },
      { name: "notes", label: "Notes", type: "textarea" },
      { name: "nextStep", label: "Next step", type: "textarea" },
    ],
  },
  {
    key: "campaigns",
    label: "Campaign",
    endpoint: "/api/revenue-command-center/campaigns",
    description: "Create a campaign command object with channel, objective, budget and launch status.",
    fields: [
      { name: "name", label: "Campaign name", required: true },
      { name: "audience", label: "Audience" },
      { name: "objective", label: "Objective", type: "textarea" },
      { name: "channel", label: "Channel", type: "select", options: ["multi_channel", "email", "whatsapp", "phone", "field", "partners", "social"] },
      { name: "budgetMad", label: "Budget MAD", type: "number" },
      { name: "launchAt", label: "Launch date", type: "datetime-local" },
      { name: "owner", label: "Owner" },
    ],
  },
  {
    key: "documents",
    label: "Document metadata",
    endpoint: "/api/revenue-command-center/documents",
    description: "Register document metadata without fake upload behavior; attach storage URL only when available.",
    fields: [
      { name: "title", label: "Document title", required: true },
      { name: "entityId", label: "Linked entity ID" },
      { name: "documentType", label: "Document type", type: "select", options: ["proposal", "contract", "briefing", "quote", "report", "note"] },
      { name: "fileUrl", label: "File URL / storage reference" },
      { name: "owner", label: "Owner" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "notifications",
    label: "Notification",
    endpoint: "/api/revenue-command-center/notifications",
    description: "Create an operational notification tied to a user, entity and priority.",
    fields: [
      { name: "title", label: "Notification title", required: true },
      { name: "recipient", label: "Recipient" },
      { name: "priority", label: "Priority", type: "select", options: ["critical", "high", "medium", "low"] },
      { name: "entityId", label: "Linked entity ID" },
      { name: "body", label: "Message", type: "textarea" },
    ],
  },
  {
    key: "decision-maps",
    label: "Decision map",
    endpoint: "/api/revenue-command-center/decision-maps",
    description: "Map decision makers, influencers, blockers and relationship strength for enterprise sales.",
    fields: [
      { name: "title", label: "Decision map title", required: true },
      { name: "entityId", label: "Linked prospect / partner ID" },
      { name: "decisionMaker", label: "Decision maker" },
      { name: "relationshipStrength", label: "Relationship strength", type: "select", options: ["unknown", "weak", "medium", "strong", "champion"] },
      { name: "owner", label: "Owner" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
]

const initialValues = Object.fromEntries(specs.flatMap((spec) => spec.fields.map((field) => [field.name, ""]))) as Record<string, string>

export default function RevenueEnterpriseOperationsBridge() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<EntityKey>("prospects")
  const [form, setForm] = useState<Record<string, string>>(initialValues)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ tone: "idle" | "success" | "error"; message: string }>({ tone: "idle", message: "Ready for live Revenue Command Center execution." })

  const active = useMemo(() => specs.find((spec) => spec.key === activeKey) || specs[0], [activeKey])

  function setValue(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const missing = active.fields.find((field) => field.required && !String(form[field.name] || "").trim())
    if (missing) {
      setStatus({ tone: "error", message: `${missing.label} is required.` })
      return
    }

    setBusy(true)
    setStatus({ tone: "idle", message: `Saving ${active.label.toLowerCase()} to Supabase...` })
    const payload = Object.fromEntries(
      active.fields
        .map((field) => [field.name, field.type === "number" ? Number(form[field.name] || 0) : form[field.name]])
        .filter(([, value]) => value !== "" && value !== null && value !== undefined),
    )

    try {
      const response = await fetch(active.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, metadata: { source: "enterprise_operations_bridge" } }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || "Save failed")
      setStatus({ tone: "success", message: `${active.label} saved live. Dashboard and lists are refreshing.` })
      setForm(initialValues)
      router.refresh()
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "Unable to save revenue operation." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[80] rounded-full border border-cyan-300/40 bg-cyan-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_24px_80px_rgba(34,211,238,.35)] transition hover:scale-[1.02]"
      >
        Revenue Ops
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[36px] border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_38%),linear-gradient(135deg,#061120,#0b1020_55%,#140c2a)] text-white shadow-2xl">
            <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Live production command bridge</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Revenue Command Center Operations</h2>
                <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-300">Create real persisted revenue records from any Revenue page. Every save goes through Revenue Command Center APIs, refreshes the UI, and writes activity/audit events through the server layer.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black hover:bg-white/15">Close</button>
            </header>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[320px_1fr]">
              <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-5">
                <div className="grid gap-3">
                  {specs.map((spec) => (
                    <button
                      key={spec.key}
                      type="button"
                      onClick={() => setActiveKey(spec.key)}
                      className={`rounded-3xl border p-4 text-left transition ${activeKey === spec.key ? "border-cyan-300/60 bg-cyan-300/15" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}
                    >
                      <p className="text-sm font-black">Create {spec.label}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-300">{spec.description}</p>
                    </button>
                  ))}
                </div>
              </aside>

              <main className="min-h-0 overflow-y-auto p-6">
                <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Supabase-backed CRUD</p>
                      <h3 className="mt-2 text-2xl font-black">Create {active.label}</h3>
                      <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-300">{active.description}</p>
                    </div>
                    <div className={`rounded-2xl border px-4 py-3 text-sm font-black ${status.tone === "success" ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100" : status.tone === "error" ? "border-rose-300/40 bg-rose-500/15 text-rose-100" : "border-white/10 bg-white/[0.06] text-slate-200"}`}>{status.message}</div>
                  </div>

                  <form onSubmit={submit} className="mt-7 grid gap-5 xl:grid-cols-2">
                    {active.fields.map((field) => (
                      <label key={field.name} className={field.type === "textarea" ? "grid gap-2 xl:col-span-2" : "grid gap-2"}>
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">{field.label}{field.required ? " *" : ""}</span>
                        {field.type === "textarea" ? (
                          <textarea value={form[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)} placeholder={field.placeholder} className="min-h-[118px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
                        ) : field.type === "select" ? (
                          <select value={form[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/50">
                            <option value="">Select {field.label.toLowerCase()}</option>
                            {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        ) : (
                          <input type={field.type || "text"} value={form[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)} placeholder={field.placeholder} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
                        )}
                      </label>
                    ))}

                    <div className="flex flex-wrap items-center gap-3 xl:col-span-2">
                      <button disabled={busy} type="submit" className="rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Saving live..." : `Save ${active.label}`}</button>
                      <button disabled={busy} type="button" onClick={() => setForm(initialValues)} className="rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-4 text-sm font-black text-white hover:bg-white/[0.10] disabled:opacity-60">Reset form</button>
                      <p className="text-xs font-bold text-slate-400">No local-only save. No fake success. Failed DB/API responses are shown here.</p>
                    </div>
                  </form>
                </div>
              </main>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
