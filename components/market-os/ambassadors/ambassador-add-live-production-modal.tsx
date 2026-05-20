
"use client"

import { useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Edit3,
  FileText,
  History,
  Mail,
  MapPinned,
  MessageSquare,
  Phone,
  PlusCircle,
  Send,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react"

type ProfileMode = "overview" | "edit" | "tasks" | "comments" | "history"

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      />
    </label>
  )
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold transition hover:border-violet-300 hover:bg-violet-50">
      <input type="checkbox" className="h-4 w-4 accent-violet-600" />
      <span>{children}</span>
    </label>
  )
}

function RadioAiPanel({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/40 bg-[#06140d] p-5 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.11)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
          <Bot size={24} />
        </div>
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI SIGNAL ONLINE</div>
          <h3 className="font-mono text-lg font-black uppercase tracking-wide text-emerald-100">{title}</h3>
          <p className="font-mono text-xs font-bold text-emerald-300/80">{subtitle}</p>
        </div>
      </div>

      <div className="relative mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="rounded-2xl border border-emerald-400/25 bg-black/30 p-4 font-mono text-sm font-bold leading-relaxed text-emerald-100">
            <span className="mr-2 text-emerald-300">[{String(index + 1).padStart(2, "0")}]</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AmbassadorAddLiveProductionModal({ onClose }: { onClose: () => void }) {
  const [profileMode, setProfileMode] = useState<"overview" | "edit" | "tasks" | "comments" | "history">("overview")
  const [saveStatus, setSaveStatus] = useState("")
  const [commentDraft, setCommentDraft] = useState("")
  const [localComments, setLocalComments] = useState([
    {
      author: "System",
      note: "New ambassador profile workspace prepared. Complete identity, territory, onboarding tasks and permissions before saving.",
      time: "Now",
    },
  ])
  const [localTasks, setLocalTasks] = useState([
    { title: "Complete profile verification", owner: "HR Ops", sla: "Today", status: "Open", priority: "High" },
    { title: "Assign first territory", owner: "Operations Lead", sla: "24h", status: "Open", priority: "High" },
    { title: "Complete training academy", owner: "Training Lead", sla: "3 days", status: "Pending", priority: "Medium" },
    { title: "Submit first proof package", owner: "Regional Supervisor", sla: "7 days", status: "Pending", priority: "Medium" },
  ])

  function updateTask(index: number, patch: Partial<{ title: string; owner: string; sla: string; status: string; priority: string }>) {
    setLocalTasks((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function addComment() {
    const clean = commentDraft.trim()
    if (!clean) return
    setLocalComments([{ author: "Current User", note: clean, time: "Just now" }, ...localComments])
    setCommentDraft("")
  }

  function saveProfileChanges() {
    setSaveStatus("Ambassador profile saved in this workspace. API persistence hook is ready for connection.")
    setProfileMode("overview")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1580px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <Users className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/15 text-xl font-black">
                NA
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">360 Ambassador Profile · Live Creation</div>
                <h2 className="mt-2 text-4xl font-black tracking-tight">New Ambassador</h2>
                <p className="mt-2 text-sm font-semibold text-white/75">Create, onboard, assign, control and activate a new Angelcare ambassador.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">Draft Profile</span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">Onboarding Required</span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">{localTasks.length} starter tasks</span>
                  <span className="rounded-full bg-emerald-400/20 px-4 py-2 text-xs font-black text-emerald-100">Production Ready</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button onClick={saveProfileChanges} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-violet-50">
                <CheckCircle2 size={17} />
                Save Ambassador
              </button>

              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-white/25">
                <X size={17} />
                Close
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-white px-7 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["overview", "Overview"],
              ["edit", "Edit Profile"],
              ["tasks", `Tasks (${localTasks.length})`],
              ["comments", `Comments (${localComments.length})`],
              ["history", "Timeline"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setProfileMode(key as typeof profileMode)}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  profileMode === key
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-100"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {saveStatus && (
          <div className="mx-7 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
            {saveStatus}
          </div>
        )}

        <div className="grid grid-cols-[1.15fr_0.85fr] gap-6 p-7">
          <main className="space-y-6">
            <section className="grid grid-cols-5 gap-4">
              {[
                ["Profile", "Draft", Edit3, "bg-violet-50 text-violet-700"],
                ["Tasks", String(localTasks.length), ClipboardCheck, "bg-blue-50 text-blue-700"],
                ["Territory", "Pending", MapPinned, "bg-emerald-50 text-emerald-700"],
                ["Proof", "Locked", ShieldCheck, "bg-cyan-50 text-cyan-700"],
                ["Incentives", "Locked", Wallet, "bg-orange-50 text-orange-700"],
              ].map(([label, value, Icon, tint]) => {
                const I = Icon as typeof Edit3
                return (
                  <div key={label as string} className={`rounded-[24px] p-5 ${tint as string}`}>
                    <I size={22} />
                    <div className="mt-3 text-2xl font-black">{value as string}</div>
                    <div className="text-xs font-black uppercase">{label as string}</div>
                  </div>
                )
              })}
            </section>

            {profileMode === "overview" && (
              <>
                <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                  <h3 className="text-2xl font-black">New Ambassador Overview</h3>
                  <p className="text-sm font-semibold text-slate-500">Complete the profile, assign territory, generate starter tasks and prepare operational activation.</p>
                  <div className="mt-6 grid grid-cols-3 gap-5">
                    {[
                      ["Contact", "Phone and email required", Phone],
                      ["Territory", "Region and city pending", MapPinned],
                      ["Status", "Draft until saved", CheckCircle2],
                      ["Group", "New Ambassador recommended", Users],
                      ["Training", "Academy checklist pending", CalendarCheck],
                      ["Audit", "Creation event ready", History],
                    ].map(([title, body, Icon]) => {
                      const I = Icon as typeof Phone
                      return (
                        <div key={title as string} className="rounded-2xl border border-slate-200 p-4">
                          <I className="text-violet-600" size={20} />
                          <div className="mt-3 text-sm font-black">{title as string}</div>
                          <div className="text-sm font-semibold text-slate-500">{body as string}</div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                  <h3 className="text-2xl font-black">Activation Readiness</h3>
                  <div className="mt-6 grid grid-cols-2 gap-5">
                    {[
                      ["Identity completion", 20, "name, phone, email, ID"],
                      ["Territory setup", 0, "region, city, manager"],
                      ["Training readiness", 0, "academy and scripts"],
                      ["Permission setup", 0, "access and approvals"],
                    ].map(([label, width, desc]) => (
                      <div key={label as string} className="rounded-2xl border border-slate-200 p-4">
                        <div className="mb-2 flex justify-between text-sm font-black">
                          <span>{label as string}</span>
                          <span>{width as number}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div className="h-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${width}%` }} />
                        </div>
                        <div className="mt-2 text-xs font-semibold text-slate-500">{desc as string}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {profileMode === "edit" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-black">Edit New Ambassador Profile</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Production creation form for identity, territory, status, permissions and operational ownership.</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <Field label="Full name" placeholder="Ambassador full name" />
                  <Field label="Phone" placeholder="+212 6 XX XX XX XX" />
                  <Field label="Email" placeholder="ambassador@angelcare.ma" />
                  <Field label="National ID / CIN" placeholder="Optional compliance ID" />
                  <SelectField label="Status" options={["Draft", "Active", "Pending Approval", "Onboarding", "Suspended"]} />
                  <SelectField label="Group" options={["New Ambassador", "Core Team", "Top Performers", "Elite Performers", "Recovery"]} />
                  <SelectField label="Region" options={["Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Fès-Meknès", "Souss-Massa", "Oriental"]} />
                  <SelectField label="City" options={["Casablanca", "Rabat", "Marrakech", "Fès", "Agadir", "Oujda", "Tangier"]} />
                  <Field label="Manager owner" placeholder="Regional Manager" />
                  <Field label="Monthly target visits" type="number" placeholder="80" />
                  <Field label="Monthly lead target" type="number" placeholder="35" />
                  <SelectField label="Preferred channel" options={["WhatsApp", "Phone", "Email", "Internal app"]} />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {["Can create visits", "Can upload proof", "Can request incentive", "Can access scripts", "Can submit surveys", "Needs approval"].map((item) => (
                    <ToggleRow key={item}>{item}</ToggleRow>
                  ))}
                </div>
                <button onClick={saveProfileChanges} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">
                  <CheckCircle2 size={17} />
                  Save Profile Changes
                </button>
              </section>
            )}

            {profileMode === "tasks" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black">Starter Task Control</h3>
                    <p className="text-sm font-semibold text-slate-500">Create, track and close onboarding tasks tied to this ambassador.</p>
                  </div>
                  <button onClick={() => setLocalTasks([{ title: "New onboarding task", owner: "Performance Manager", sla: "24h", status: "Open", priority: "High" }, ...localTasks])} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white">
                    <PlusCircle size={16} />
                    Add Task
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {localTasks.map((task, index) => (
                    <div key={`${task.title}-${index}`} className="grid grid-cols-[28px_1.25fr_0.75fr_0.55fr_0.55fr_110px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold shadow-sm">
                      <input
                        type="checkbox"
                        checked={task.status === "Done"}
                        onChange={(event) => updateTask(index, { status: event.target.checked ? "Done" : "Open" })}
                        className="h-4 w-4 accent-violet-600"
                      />

                      <div className="space-y-2">
                        <input
                          value={task.title}
                          onChange={(event) => updateTask(index, { title: event.target.value })}
                          className="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-base font-black outline-none transition hover:border-slate-200 hover:bg-slate-50 focus:border-violet-400 focus:bg-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input value={task.owner} onChange={(event) => updateTask(index, { owner: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400" />
                          <input value={task.sla} onChange={(event) => updateTask(index, { sla: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400" />
                        </div>
                      </div>

                      <select value={task.status} onChange={(event) => updateTask(index, { status: event.target.value })} className="rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-center text-xs font-black text-violet-700 outline-none">
                        {["Open", "Pending", "Recurring", "Escalated", "Blocked", "Done"].map((status) => <option key={status}>{status}</option>)}
                      </select>

                      <select value={task.priority} onChange={(event) => updateTask(index, { priority: event.target.value })} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700 outline-none">
                        {["Critical", "High", "Medium", "Low"].map((priority) => <option key={priority}>{priority}</option>)}
                      </select>

                      <button onClick={() => updateTask(index, { status: "Escalated", priority: "Critical" })} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-black text-rose-700">Escalate</button>
                      <button onClick={() => updateTask(index, { status: "Done" })} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700">Done</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profileMode === "comments" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black">Comments & Manager Notes</h3>
                    <p className="text-sm font-semibold text-slate-500">Operational comments, onboarding notes, risk details and decision history.</p>
                  </div>
                  <button onClick={addComment} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Save comment</button>
                </div>

                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Add manager comment, onboarding note, risk detail, or operational instruction..."
                  className="mt-5 h-28 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400"
                />

                <div className="mt-5 space-y-4">
                  {localComments.map((comment, index) => (
                    <div key={`${comment.time}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-black">{comment.author}</div>
                        <div className="text-xs font-bold text-slate-500">{comment.time}</div>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-600">{comment.note}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profileMode === "history" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-black">Creation Timeline & Audit Trail</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Prepared for production audit logs, manager decisions, proof validation and profile changes.</p>
                <div className="mt-6 space-y-4">
                  {[
                    ["Creation workspace opened", "New ambassador profile draft initialized", "Now"],
                    ["Onboarding tasks prepared", `${localTasks.length} starter tasks created`, "Now"],
                    ["Permission checklist ready", "Default role controls loaded", "Now"],
                    ["Backend sync ready", "Ready for /api/ambassadors create endpoint", "Next"],
                  ].map(([title, body, time]) => (
                    <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                      <div className="mt-1 h-3 w-3 rounded-full bg-violet-600" />
                      <div className="flex-1">
                        <div className="font-black">{title}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-500">{body}</div>
                      </div>
                      <div className="text-xs font-bold text-slate-500">{time}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-6">
            <RadioAiPanel
              title="Profile Intelligence"
              subtitle="New ambassador creation signal"
              items={[
                "Start with narrow territory ownership until proof quality is validated.",
                "Keep payout eligibility locked until first route and training are complete.",
                "Manager should add onboarding comments until profile activation is approved.",
              ]}
            />

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Production Controls</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Edit profile", Edit3, "edit" as const],
                  ["Assign task", ClipboardCheck, "tasks" as const],
                  ["Add comment", MessageSquare, "comments" as const],
                  ["Timeline", History, "history" as const],
                  ["Activate later", CheckCircle2, "overview" as const],
                  ["Generate report", FileText, "history" as const],
                ].map(([label, Icon, mode]) => {
                  const I = Icon as typeof Edit3
                  return (
                    <button
                      key={label as string}
                      onClick={() => setProfileMode(mode as ProfileMode)}
                      className="grid min-h-[84px] place-items-center rounded-2xl border border-slate-200 text-center text-xs font-black transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      <I className="text-violet-600" size={20} />
                      {label as string}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Live Sync Readiness</h3>
              <div className="mt-5 space-y-3">
                {[
                  ["Profile DB", "ambassador_profiles"],
                  ["Tasks DB", "ambassador_tasks"],
                  ["Comments DB", "ambassador_comments"],
                  ["Audit Logs", "profile_activity_logs"],
                  ["Permissions", "role-gated actions"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <b className="text-slate-500">{label}</b>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
