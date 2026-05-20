
"use client"

import { useMemo, useState } from "react"
import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import AmbassadorAddLiveProductionModal from "@/components/market-os/ambassadors/ambassador-add-live-production-modal"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  Edit3,
  FileText,
  Filter,
  FolderDown,
  Grid2X2,
  History,
  List,
  Mail,
  MapPinned,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Phone,
  PlusCircle,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react"

type DirectoryModal = "add" | "import" | "assign" | "announce" | "performance" | "export" | null
type ViewMode = "list" | "grid"

type AmbassadorRow = {
  name: string
  phone: string
  region: string
  city: string
  group: string
  status: "Active" | "Inactive" | "Pending"
  score: number
  tasks: number
  lastActivity: string
  email: string
  proofQuality: number
  training: number
  leads: number
  incentives: number
  risk: "Low" | "Medium" | "High"
}

const ambassadors: AmbassadorRow[] = [
  { name: "Youssef El Fassi", phone: "+212 6 12 34 56 78", region: "Casablanca-Settat", city: "Casablanca", group: "Elite Performers", status: "Active", score: 92, tasks: 42, lastActivity: "Today, 10:45 AM", email: "youssef@angelcare.ma", proofQuality: 97, training: 100, leads: 39, incentives: 12800, risk: "Low" },
  { name: "Fatima Zahra Ait", phone: "+212 6 98 76 54 32", region: "Rabat-Salé-Kénitra", city: "Rabat", group: "Top Performers", status: "Active", score: 89, tasks: 38, lastActivity: "Today, 09:15 AM", email: "fatima@angelcare.ma", proofQuality: 96, training: 98, leads: 36, incentives: 11600, risk: "Low" },
  { name: "Omar Kabbaj", phone: "+212 6 55 44 33 22", region: "Marrakech-Safi", city: "Marrakech", group: "Top Performers", status: "Active", score: 88, tasks: 35, lastActivity: "Yesterday, 06:30 PM", email: "omar@angelcare.ma", proofQuality: 91, training: 94, leads: 31, incentives: 9800, risk: "Low" },
  { name: "Imane Lahlou", phone: "+212 6 77 88 99 00", region: "Fès-Meknès", city: "Fès", group: "Core Team", status: "Active", score: 85, tasks: 31, lastActivity: "Yesterday, 04:20 PM", email: "imane@angelcare.ma", proofQuality: 88, training: 90, leads: 25, incentives: 7600, risk: "Low" },
  { name: "Ahmed Benali", phone: "+212 6 66 77 88 99", region: "Tanger-Tétouan-Al Hoceima", city: "Tangier", group: "Core Team", status: "Active", score: 84, tasks: 29, lastActivity: "May 29, 2025", email: "ahmed@angelcare.ma", proofQuality: 84, training: 85, leads: 23, incentives: 6900, risk: "Medium" },
  { name: "Salma El Amrani", phone: "+212 6 11 22 33 44", region: "Agadir-Souss Massa", city: "Agadir", group: "Rising Stars", status: "Inactive", score: 65, tasks: 12, lastActivity: "May 27, 2025", email: "salma@angelcare.ma", proofQuality: 68, training: 72, leads: 11, incentives: 3200, risk: "High" },
  { name: "Mehdi Tazi", phone: "+212 6 22 33 44 55", region: "Oriental", city: "Oujda", group: "Rising Stars", status: "Active", score: 83, tasks: 27, lastActivity: "May 27, 2025", email: "mehdi@angelcare.ma", proofQuality: 61, training: 66, leads: 8, incentives: 2400, risk: "High" },
  { name: "Hicham Mourad", phone: "+212 6 33 44 55 66", region: "Drâa-Tafilalet", city: "Errachidia", group: "Core Team", status: "Active", score: 81, tasks: 24, lastActivity: "May 26, 2025", email: "hicham@angelcare.ma", proofQuality: 86, training: 88, leads: 19, incentives: 5600, risk: "Medium" },
]

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input type={type} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
    </label>
  )
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange?.(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
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

function RadioAiPanel({ title, subtitle, icon: Icon, items }: { title: string; subtitle: string; icon: typeof Bot; items: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/40 bg-[#06140d] p-5 text-emerald-100 shadow-[0_0_34px_rgba(16,185,129,0.18)]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(52,211,153,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.11)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-300"><Icon size={24} /></div>
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI SIGNAL ONLINE</div>
          <h3 className="font-mono text-lg font-black uppercase tracking-wide text-emerald-100">{title}</h3>
          <p className="font-mono text-xs font-bold text-emerald-300/80">{subtitle}</p>
        </div>
      </div>
      <div className="relative mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="rounded-2xl border border-emerald-400/25 bg-black/30 p-4 font-mono text-sm font-bold leading-relaxed text-emerald-100">
            <span className="mr-2 text-emerald-300">[{String(index + 1).padStart(2, "0")}]</span>{item}
          </div>
        ))}
      </div>
    </div>
  )
}

function ModalShell({
  title, subtitle, icon: Icon, gradient, children, right, action, onClose,
}: {
  title: string; subtitle: string; icon: typeof Users; gradient: string; children: React.ReactNode; right: React.ReactNode; action: string; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1480px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className={`relative overflow-hidden rounded-t-[38px] bg-gradient-to-r ${gradient} p-7 text-white`}>
          <Icon className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15"><Icon size={30} /></div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Angelcare Ambassador Directory</div>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
                <p className="mt-2 max-w-4xl text-sm font-semibold text-white/80">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-violet-50"><CheckCircle2 size={17} />{action}</button>
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-white/25"><X size={17} />Close</button>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-[1.35fr_0.75fr] gap-6 p-7"><main className="space-y-6">{children}</main><aside className="space-y-5">{right}</aside></div>
      </div>
    </div>
  )
}

function AmbassadorProfile360Modal({ ambassador, onClose }: { ambassador: AmbassadorRow; onClose: () => void }) {
  const [profileMode, setProfileMode] = useState<"overview" | "edit" | "tasks" | "comments" | "history">("overview")
  const [saveStatus, setSaveStatus] = useState("")
  const [commentDraft, setCommentDraft] = useState("")
  const [localComments, setLocalComments] = useState([
    { author: "Regional Manager", note: `${ambassador.name} is ready for review based on territory performance, proof quality and current group status.`, time: "Today · 09:40" },
    { author: "Operations Lead", note: "Directory profile opened from ambassador control board. Update task and comments before closing.", time: "Yesterday · 17:20" },
  ])
  const [localTasks, setLocalTasks] = useState([
    { title: "Review proof quality package", owner: "Performance Manager", sla: "Today", status: "Open", priority: "High" },
    { title: "Schedule field coaching checkpoint", owner: "Regional Supervisor", sla: "24h", status: "Open", priority: "High" },
    { title: "Validate incentive eligibility", owner: "Finance Control", sla: "48h", status: "Pending", priority: "Medium" },
    { title: "Assign next territory sprint", owner: "Operations Lead", sla: "3 days", status: "Open", priority: "Medium" },
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
    setSaveStatus("Profile changes saved in this workspace. Backend persistence hooks are ready for connection.")
    setProfileMode("overview")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-[1580px] overflow-y-auto rounded-[38px] border border-white/70 bg-white shadow-2xl">
        <header className="relative overflow-hidden rounded-t-[38px] bg-gradient-to-r from-slate-950 via-violet-800 to-blue-700 p-7 text-white">
          <Users className="absolute -right-10 -top-10 opacity-15" size={230} />
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/15 text-xl font-black">{ambassador.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-white/70">360 Ambassador Profile · Directory Sync</div>
                <h2 className="mt-2 text-4xl font-black tracking-tight">{ambassador.name}</h2>
                <p className="mt-2 text-sm font-semibold text-white/75">{ambassador.city} · {ambassador.region} · {ambassador.group}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">Score {ambassador.score}/100</span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">Risk {ambassador.risk}</span>
                  <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">{ambassador.tasks} tasks</span>
                  <span className="rounded-full bg-emerald-400/20 px-4 py-2 text-xs font-black text-emerald-100">Synced Profile</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/25 bg-slate-950/30 p-2 shadow-2xl backdrop-blur-md">
              <button onClick={saveProfileChanges} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-violet-50"><CheckCircle2 size={17}/>Save Changes</button>
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-white/25"><X size={17}/>Close</button>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-white px-7 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["overview", "Overview"], ["edit", "Edit Profile"], ["tasks", `Tasks (${localTasks.length})`], ["comments", `Comments (${localComments.length})`], ["history", "Timeline"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setProfileMode(key as typeof profileMode)} className={`rounded-2xl px-4 py-2 text-sm font-black transition ${profileMode === key ? "bg-violet-600 text-white shadow-lg shadow-violet-100" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{label}</button>
            ))}
          </div>
        </div>

        {saveStatus && <div className="mx-7 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">{saveStatus}</div>}

        <div className="grid grid-cols-[1.15fr_0.85fr] gap-6 p-7">
          <main className="space-y-6">
            <section className="grid grid-cols-5 gap-4">
              {[
                ["Performance", `${ambassador.score}/100`, BarChart3, "bg-violet-50 text-violet-700"],
                ["Tasks", String(ambassador.tasks), ClipboardCheck, "bg-blue-50 text-blue-700"],
                ["Leads", String(ambassador.leads), Target, "bg-emerald-50 text-emerald-700"],
                ["Proof", `${ambassador.proofQuality}%`, ShieldCheck, "bg-cyan-50 text-cyan-700"],
                ["Incentives", `${ambassador.incentives.toLocaleString()} MAD`, Wallet, "bg-orange-50 text-orange-700"],
              ].map(([label, value, Icon, tint]) => { const I = Icon as typeof BarChart3; return <div key={label as string} className={`rounded-[24px] p-5 ${tint as string}`}><I size={22}/><div className="mt-3 text-2xl font-black">{value as string}</div><div className="text-xs font-black uppercase">{label as string}</div></div> })}
            </section>

            {profileMode === "overview" && (
              <>
                <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                  <h3 className="text-2xl font-black">Profile Overview</h3>
                  <p className="text-sm font-semibold text-slate-500">Directory-synced view of contact, territory, score, proof, tasks and operational ownership.</p>
                  <div className="mt-6 grid grid-cols-3 gap-5">
                    {[
                      ["Phone", ambassador.phone, Phone],
                      ["Email", ambassador.email, Mail],
                      ["Territory", `${ambassador.city}, ${ambassador.region}`, MapPinned],
                      ["Status", ambassador.status, CheckCircle2],
                      ["Group", ambassador.group, Users],
                      ["Last Activity", ambassador.lastActivity, History],
                    ].map(([title, body, Icon]) => { const I = Icon as typeof Phone; return <div key={title as string} className="rounded-2xl border border-slate-200 p-4"><I className="text-violet-600" size={20}/><div className="mt-3 text-sm font-black">{title as string}</div><div className="text-sm font-semibold text-slate-500">{body as string}</div></div> })}
                  </div>
                </section>
                <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                  <h3 className="text-2xl font-black">Performance Breakdown</h3>
                  <div className="mt-6 grid grid-cols-2 gap-5">
                    {[
                      ["Score", ambassador.score, "overall score"],
                      ["Proof quality", ambassador.proofQuality, "validated proof compliance"],
                      ["Training", ambassador.training, "learning completion"],
                      ["Lead performance", Math.min(100, ambassador.leads * 2), "lead generation signal"],
                    ].map(([label, width, desc]) => <div key={label as string} className="rounded-2xl border border-slate-200 p-4"><div className="mb-2 flex justify-between text-sm font-black"><span>{label as string}</span><span>{width as number}%</span></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${width}%` }} /></div><div className="mt-2 text-xs font-semibold text-slate-500">{desc as string}</div></div>)}
                  </div>
                </section>
              </>
            )}

            {profileMode === "edit" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-black">Edit Ambassador Profile</h3>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <Field label="Full name" placeholder={ambassador.name} />
                  <Field label="Phone" placeholder={ambassador.phone} />
                  <Field label="Email" placeholder={ambassador.email} />
                  <SelectField label="Status" options={["Active", "Inactive", "Pending", "Suspended", "Recovery"]} />
                  <SelectField label="Group" options={["Elite Performers", "Top Performers", "Core Team", "Rising Stars", "Recovery", "New Ambassador"]} />
                  <SelectField label="Region" options={["Casablanca-Settat", "Rabat-Salé-Kénitra", "Marrakech-Safi", "Fès-Meknès", "Souss-Massa", "Oriental"]} />
                </div>
                <button onClick={saveProfileChanges} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white"><CheckCircle2 size={17}/>Save Profile Changes</button>
              </section>
            )}

            {profileMode === "tasks" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-black">Task Control</h3>
                <div className="mt-5 space-y-3">
                  {localTasks.map((task, index) => (
                    <div key={`${task.title}-${index}`} className="grid grid-cols-[28px_1.25fr_0.75fr_0.55fr_110px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold shadow-sm">
                      <input type="checkbox" checked={task.status === "Done"} onChange={(event) => updateTask(index, { status: event.target.checked ? "Done" : "Open" })} className="h-4 w-4 accent-violet-600" />
                      <div className="space-y-2">
                        <input value={task.title} onChange={(event) => updateTask(index, { title: event.target.value })} className="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 text-base font-black outline-none transition hover:border-slate-200 hover:bg-slate-50 focus:border-violet-400 focus:bg-white" />
                        <input value={task.owner} onChange={(event) => updateTask(index, { owner: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-violet-400" />
                      </div>
                      <select value={task.status} onChange={(event) => updateTask(index, { status: event.target.value })} className="rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-center text-xs font-black text-violet-700 outline-none"><option>Open</option><option>Pending</option><option>Escalated</option><option>Blocked</option><option>Done</option></select>
                      <select value={task.priority} onChange={(event) => updateTask(index, { priority: event.target.value })} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700 outline-none"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
                      <button onClick={() => updateTask(index, { status: "Escalated", priority: "Critical" })} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-black text-rose-700">Escalate</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profileMode === "comments" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-black">Comments & Manager Notes</h3>
                <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Add manager comment, coaching note, risk detail, or operational instruction..." className="mt-5 h-28 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400" />
                <button onClick={addComment} className="mt-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Save comment</button>
                <div className="mt-5 space-y-4">{localComments.map((comment, index) => <div key={`${comment.time}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><div className="font-black">{comment.author}</div><div className="text-xs font-bold text-slate-500">{comment.time}</div></div><p className="mt-2 text-sm font-semibold text-slate-600">{comment.note}</p></div>)}</div>
              </section>
            )}

            {profileMode === "history" && (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6">
                <h3 className="text-2xl font-black">Profile Timeline & Audit Trail</h3>
                <div className="mt-6 space-y-4">{["Profile opened from directory", "Performance score synced", "Last activity reviewed", "Tasks status updated"].map((title, index) => <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 p-4"><div className="mt-1 h-3 w-3 rounded-full bg-violet-600" /><div className="flex-1"><div className="font-black">{title}</div><div className="mt-1 text-sm font-semibold text-slate-500">Audit event #{index + 1}</div></div><div className="text-xs font-bold text-slate-500">Today</div></div>)}</div>
              </section>
            )}
          </main>

          <aside className="space-y-6">
            <RadioAiPanel title="Profile Intelligence" subtitle="Directory profile recommendations" icon={Bot} items={[ambassador.risk === "High" ? "Immediate coaching and proof validation required before next payout." : "Profile is stable; use as benchmark or mentor if performance stays above threshold.", "Create next sprint based on proof quality, lead conversion and training completion.", "Manager should add weekly comments until all profile controls are closed."]} />
            <section className="rounded-[30px] border border-slate-200 bg-white p-6">
              <h3 className="text-2xl font-black">Production Controls</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">{[["Edit profile", Edit3, "edit"],["Assign task", ClipboardCheck, "tasks"],["Add comment", MessageSquare, "comments"],["Timeline", History, "history"],["Approve payout", Wallet, "overview"],["Send praise", Trophy, "comments"]].map(([label, Icon, mode]) => { const I = Icon as typeof Edit3; return <button key={label as string} onClick={() => setProfileMode(mode as typeof profileMode)} className="grid min-h-[84px] place-items-center rounded-2xl border border-slate-200 text-center text-xs font-black transition hover:border-violet-300 hover:bg-violet-50"><I className="text-violet-600" size={20}/>{label as string}</button> })}</div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function AddAmbassadorModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Add Ambassador" subtitle="Create a complete production-ready ambassador profile with identity, territory, operational access, onboarding, tasks, comments and manager governance." icon={Users} gradient="from-slate-950 via-violet-800 to-blue-700" action="Save Ambassador" onClose={onClose}
      right={<><RadioAiPanel title="Profile Setup AI" subtitle="Live onboarding recommendations" icon={Bot} items={["Assign new ambassadors to narrow territories until proof quality is validated.", "Create onboarding tasks automatically: training, scripts, first route and manager check-in.", "Keep incentive eligibility locked until the first proof package is approved."]} /><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">Auto-created controls</h3><div className="mt-4 space-y-3">{["Profile audit log","Onboarding task pack","Territory assignment","Training checklist","Manager comments thread"].map(x => <div key={x} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{x}</div>)}</div></div></>}>
      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-xl font-black">Identity & Contact</h3><div className="mt-5 grid grid-cols-3 gap-4"><Field label="Full name" placeholder="Ambassador full name" /><Field label="Phone" placeholder="+212 6 XX XX XX XX" /><Field label="Email" placeholder="ambassador@angelcare.ma" /><Field label="National ID / CIN" placeholder="Optional compliance ID" /><SelectField label="Profile type" options={["Field ambassador","Senior ambassador","Supervisor candidate","Content ambassador","B2B ambassador"]} /><SelectField label="Preferred channel" options={["WhatsApp","Phone","Email","Internal app"]} /></div></section>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-xl font-black">Territory & Operations</h3><div className="mt-5 grid grid-cols-3 gap-4"><SelectField label="Region" options={["Casablanca-Settat","Rabat-Salé-Kénitra","Marrakech-Safi","Fès-Meknès","Souss-Massa","Oriental"]} /><SelectField label="City" options={["Casablanca","Rabat","Marrakech","Fès","Agadir","Oujda","Tangier"]} /><SelectField label="Group" options={["New Ambassador","Core Team","Top Performers","Elite Performers","Recovery"]} /><Field label="Monthly visit target" type="number" placeholder="80" /><Field label="Monthly lead target" type="number" placeholder="35" /><Field label="Manager owner" placeholder="Regional Manager" /></div></section>
      <section className="grid grid-cols-2 gap-5"><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">Onboarding Tasks</h3><div className="mt-4 space-y-3">{["Complete profile verification","Assign territory","Complete training academy","First route check-in","Submit first proof package"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div></div><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">Permissions</h3><div className="mt-4 space-y-3">{["Can create visits","Can upload proof","Can submit surveys","Can request payout","Needs manager approval"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div></div></section>
    </ModalShell>
  )
}

function ImportAmbassadorsModal({ onClose }: { onClose: () => void }) { return <ModalShell title="Import Ambassadors" subtitle="Bulk import ambassadors safely with validation, deduplication, region mapping, onboarding automation and error review before committing to production." icon={Upload} gradient="from-cyan-600 via-violet-700 to-fuchsia-700" action="Validate & Import" onClose={onClose} right={<><RadioAiPanel title="Import Scanner" subtitle="Bulk data validation" icon={Radio} items={["Detect duplicate phone numbers before import.","Auto-map regions/cities to Angelcare territory model.","Create onboarding tasks for all new active profiles."]}/><div className="rounded-[28px] border border-slate-200 p-5"><h3 className="text-lg font-black">Import Preview</h3>{["Rows detected: 0","Duplicates: pending file","Invalid phones: pending file","Ready to import: pending"].map(x => <div key={x} className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">{x}</div>)}</div></>}><section className="rounded-[28px] border-2 border-dashed border-violet-200 bg-violet-50 p-10 text-center"><Upload className="mx-auto text-violet-600" size={44}/><h3 className="mt-4 text-2xl font-black">Drop CSV/XLSX file here</h3><p className="mt-2 text-sm font-semibold text-slate-500">Supported columns: name, phone, email, city, region, group, status, manager, target visits.</p><button className="mt-5 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">Choose File</button></section><section className="grid grid-cols-3 gap-5">{["Column Mapping","Duplicate Rules","Post-import Automation"].map(title => <div key={title} className="rounded-[28px] border border-slate-200 p-5"><h3 className="text-lg font-black">{title}</h3><div className="mt-4 space-y-3">{["Validate","Preview","Require approval","Create audit log"].map(x => <ToggleRow key={`${title}-${x}`}>{x}</ToggleRow>)}</div></div>)}</section></ModalShell> }
function AssignGroupModal({ onClose }: { onClose: () => void }) { return <ModalShell title="Assign to Group" subtitle="Move ambassadors into operational groups based on score, territory, risk, role and campaign needs while preserving audit history." icon={Users} gradient="from-emerald-600 via-violet-700 to-blue-700" action="Assign Group" onClose={onClose} right={<><RadioAiPanel title="Group Optimizer" subtitle="Role allocation signal" icon={Bot} items={["Elite performers should mentor new ambassadors.","Recovery group must be linked to coaching tasks.","Avoid moving high-risk profiles into incentive-heavy campaigns."]}/></>}><section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-xl font-black">Assignment Rules</h3><div className="mt-5 grid grid-cols-3 gap-4"><SelectField label="Target Group" options={["Elite Performers","Top Performers","Core Team","Rising Stars","Recovery","New Ambassador"]}/><SelectField label="Selection Rule" options={["Manual selection","Score above 85","City/region based","Risk based","Training complete"]}/><SelectField label="Post-action" options={["Create tasks","Notify manager","Send announcement","No notification"]}/></div></section><section className="rounded-[28px] border border-slate-200 p-5"><h3 className="text-xl font-black">Select Ambassadors</h3><div className="mt-4 grid grid-cols-2 gap-3">{ambassadors.map(a => <ToggleRow key={a.name}>{a.name} · {a.city} · Score {a.score}</ToggleRow>)}</div></section></ModalShell> }
function AnnouncementModal({ onClose }: { onClose: () => void }) { return <ModalShell title="Send Announcement" subtitle="Broadcast operational instructions to ambassadors by region, group or status with delivery tracking and manager visibility." icon={Megaphone} gradient="from-orange-500 via-violet-700 to-blue-700" action="Send Announcement" onClose={onClose} right={<><RadioAiPanel title="Broadcast AI" subtitle="Message targeting guidance" icon={Radio} items={["Send recovery instructions only to low-score groups.","Keep operational instructions short and action-oriented.","Require confirmation for urgent route changes."]}/></>}><section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-xl font-black">Broadcast Setup</h3><div className="mt-5 grid grid-cols-3 gap-4"><SelectField label="Audience" options={["All ambassadors","Selected group","Selected territory","High-risk profiles","New ambassadors"]}/><SelectField label="Channel" options={["App notification","WhatsApp","Email","All channels"]}/><SelectField label="Priority" options={["Urgent","High","Normal","FYI"]}/></div></section><section className="rounded-[28px] border border-slate-200 p-5"><h3 className="text-lg font-black">Message</h3><Field label="Title" placeholder="Example: New route instructions for this week"/><textarea className="mt-4 h-40 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-violet-400" placeholder="Write announcement content..." /></section></ModalShell> }
function PerformanceModal({ onClose }: { onClose: () => void }) { return <ModalShell title="View Performance" subtitle="Open a directory-level performance command workflow to identify top performers, risks, coaching needs and incentive readiness." icon={BarChart3} gradient="from-slate-950 via-blue-700 to-violet-700" action="Open Performance Board" onClose={onClose} right={<><RadioAiPanel title="Performance Signal" subtitle="Directory analysis" icon={Bot} items={["Prioritize recovery profiles under 70 score.","Top performers should receive mentor missions.","Proof quality controls must be reviewed before payout."]}/></>}><section className="grid grid-cols-4 gap-4">{[["Network score","82/100",BarChart3],["Top performers","3",Trophy],["Recovery needed","2",AlertTriangle],["Incentive ready","5",Wallet]].map(([label,value,Icon])=>{const I=Icon as typeof BarChart3;return <div key={label as string} className="rounded-[24px] bg-violet-50 p-5 text-violet-700"><I size={22}/><div className="mt-3 text-3xl font-black">{value as string}</div><div className="text-xs font-black uppercase">{label as string}</div></div>})}</section><section className="rounded-[28px] border border-slate-200 p-5"><h3 className="text-xl font-black">Actions to Generate</h3><div className="mt-4 grid grid-cols-3 gap-3">{["Create coaching tasks","Approve eligible incentives","Flag proof risk","Export performance report","Assign mentors","Create KPI sprint"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div></section></ModalShell> }
function ExportDirectoryModal({ onClose }: { onClose: () => void }) { return <ModalShell title="Export Directory" subtitle="Export ambassador directory safely with filters, permission controls, field selection, audit trail and delivery options." icon={FolderDown} gradient="from-slate-900 via-violet-800 to-fuchsia-700" action="Generate Export" onClose={onClose} right={<><RadioAiPanel title="Export Guardrails" subtitle="Data protection scanner" icon={ShieldCheck} items={["Avoid exporting private contact fields unless manager permission is confirmed.","Attach audit log to every export.","Use filtered exports for regional managers."]}/></>}><section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"><h3 className="text-xl font-black">Export Configuration</h3><div className="mt-5 grid grid-cols-3 gap-4"><SelectField label="Format" options={["CSV","XLSX","PDF summary","CSV + PDF"]}/><SelectField label="Scope" options={["All ambassadors","Filtered view","Selected group","Selected territory","Active only"]}/><SelectField label="Delivery" options={["Download now","Email to manager","Save to documents","Generate secure link"]}/></div></section><section className="rounded-[28px] border border-slate-200 p-5"><h3 className="text-xl font-black">Fields to Include</h3><div className="mt-4 grid grid-cols-3 gap-3">{["Name","Phone","Email","City","Region","Group","Status","Score","Tasks","Last activity","Manager","Incentive status"].map(x => <ToggleRow key={x}>{x}</ToggleRow>)}</div></section></ModalShell> }

function DirectoryModalView({ active, onClose }: { active: DirectoryModal; onClose: () => void }) {
  if (active === "add") return <AmbassadorAddLiveProductionModal onClose={onClose} />
  if (active === "import") return <ImportAmbassadorsModal onClose={onClose} />
  if (active === "assign") return <AssignGroupModal onClose={onClose} />
  if (active === "announce") return <AnnouncementModal onClose={onClose} />
  if (active === "performance") return <PerformanceModal onClose={onClose} />
  if (active === "export") return <ExportDirectoryModal onClose={onClose} />
  return null
}

function MoroccoCard() {
  return <div className="relative h-[318px] overflow-hidden rounded-[26px] bg-violet-50"><div className="absolute left-[72px] top-[26px] h-[250px] w-[330px] rotate-[-18deg] rounded-[38%_62%_45%_55%] bg-violet-100/90" />{[["86","Tangier","left-[255px] top-[20px]"],["112","Rabat","left-[205px] top-[82px]"],["234","Casablanca","left-[132px] top-[128px]"],["68","Fès","left-[285px] top-[126px]"],["45","Oujda","left-[355px] top-[150px]"],["124","Marrakech","left-[195px] top-[220px]"],["67","Agadir","left-[96px] top-[248px]"]].map(([v,c,p]) => <div key={c} className={`absolute ${p} flex items-center gap-2`}><div className="grid h-12 w-12 place-items-center rounded-full border border-violet-200 bg-white text-base font-black text-violet-700 shadow-lg">{v}</div><div className="text-xs font-black text-slate-600">{c}</div></div>)}</div>
}

export default function AmbassadorsDirectoryOperationalPage() {
  const [activeModal, setActiveModal] = useState<DirectoryModal>(null)
  const [selectedProfile, setSelectedProfile] = useState<AmbassadorRow | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [regionFilter, setRegionFilter] = useState("All Regions")
  const [cityFilter, setCityFilter] = useState("All Cities")
  const [groupFilter, setGroupFilter] = useState("All Groups")
  const [scoreFilter, setScoreFilter] = useState("All")
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const regions = ["All Regions", ...Array.from(new Set(ambassadors.map((a) => a.region)))]
  const cities = ["All Cities", ...Array.from(new Set(ambassadors.map((a) => a.city)))]
  const groups = ["All Groups", ...Array.from(new Set(ambassadors.map((a) => a.group)))]

  const filtered = ambassadors.filter((a) => {
    const q = `${a.name} ${a.phone} ${a.email} ${a.city} ${a.region} ${a.group}`.toLowerCase().includes(query.toLowerCase())
    const status = statusFilter === "All Status" || a.status === statusFilter
    const region = regionFilter === "All Regions" || a.region === regionFilter
    const city = cityFilter === "All Cities" || a.city === cityFilter
    const group = groupFilter === "All Groups" || a.group === groupFilter
    const score = scoreFilter === "All" || (scoreFilter === "Elite 90+" && a.score >= 90) || (scoreFilter === "Strong 75-89" && a.score >= 75 && a.score < 90) || (scoreFilter === "Recovery <75" && a.score < 75)
    return q && status && region && city && group && score
  })

  const totals = useMemo(() => {
    const active = filtered.filter(a => a.status === "Active").length
    const avg = Math.round(filtered.reduce((s, a) => s + a.score, 0) / Math.max(filtered.length, 1))
    return { active, avg }
  }, [filtered])

  function clearFilters() {
    setQuery("")
    setStatusFilter("All Status")
    setRegionFilter("All Regions")
    setCityFilter("All Cities")
    setGroupFilter("All Groups")
    setScoreFilter("All")
  }

  const quickActions: [string, typeof Users, DirectoryModal][] = [["Add Ambassador", Users, "add"],["Import Ambassadors", Upload, "import"],["Assign to Group", Users, "assign"],["Send Announcement", Megaphone, "announce"],["View Performance", BarChart3, "performance"],["Export Directory", FolderDown, "export"]]

  return (
    <div className="flex min-h-screen bg-white text-slate-950">
      <AmbassadorMarketSidebar />
      <main className="flex-1 bg-white px-8 py-7">
        <div className="mb-5 flex items-start justify-between"><div><h1 className="text-[28px] font-black tracking-tight">Ambassadors Directory</h1><p className="mt-1 text-sm font-semibold text-slate-500">View, manage and connect with Angelcare ambassadors across Morocco.</p></div><div className="flex gap-2"><button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm">May 1 – May 31, 2025</button><button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm">Filters</button></div></div>

        <section className="grid grid-cols-7 gap-3">{[["Total Ambassadors",String(filtered.length),"Filtered live"],["Active Ambassadors",String(totals.active),"Current filter"],["Cities Covered",String(new Set(filtered.map(a => a.city)).size),"Cities"],["Avg. Performance Score",`${totals.avg}/100`,"Filtered average"],["Tasks Completed",String(filtered.reduce((s,a)=>s+a.tasks,0)),"Visible tasks"],["Total Incentives Paid","1.28M MAD","↑ 15%"],["New Ambassadors","78","↑ 15%"]].map((k,i)=><div key={k[0]} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className={["bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-blue-100 text-blue-700","bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-orange-100 text-orange-700","bg-emerald-100 text-emerald-700"][i]+" grid h-12 w-12 place-items-center rounded-2xl"}><Users size={20}/></div><div><div className="text-[11px] font-black text-slate-500">{k[0]}</div><div className="mt-1 text-2xl font-black">{k[1]}</div><div className="mt-1 text-[11px] font-black text-emerald-600">{k[2]}</div></div></div></div>)}</section>

        <section className="mt-5 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-[1.55fr_repeat(5,0.62fr)_0.5fr] gap-4">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full outline-none" placeholder="Search by name, phone, email, city..." /></label>
            <SelectField label="" options={["All Status", "Active", "Inactive", "Pending"]} value={statusFilter} onChange={setStatusFilter} />
            <SelectField label="" options={regions} value={regionFilter} onChange={setRegionFilter} />
            <SelectField label="" options={cities} value={cityFilter} onChange={setCityFilter} />
            <SelectField label="" options={groups} value={groupFilter} onChange={setGroupFilter} />
            <SelectField label="" options={["All", "Elite 90+", "Strong 75-89", "Recovery <75"]} value={scoreFilter} onChange={setScoreFilter} />
            <button onClick={clearFilters} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black hover:bg-slate-50">Clear</button>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-black text-slate-500"><span>{filtered.length} ambassadors match current filters</span><span>Synced filters · Search · View mode · Export scope</span></div>
        </section>

        <section className="mt-5 grid grid-cols-[1.9fr_1fr] gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">Ambassadors <span className="text-slate-400">({filtered.length})</span></h2>
              <div className="flex gap-2"><button onClick={() => setActiveModal("export")} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black"><Download size={16}/> Export</button><button onClick={() => setViewMode("list")} className={`grid h-10 w-10 place-items-center rounded-xl border ${viewMode === "list" ? "bg-violet-50 text-violet-700" : ""}`}><List size={16}/></button><button onClick={() => setViewMode("grid")} className={`grid h-10 w-10 place-items-center rounded-xl border ${viewMode === "grid" ? "bg-violet-50 text-violet-700" : ""}`}><Grid2X2 size={16}/></button></div>
            </div>

            {viewMode === "list" ? (
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-200 text-[12px] font-black text-slate-500"><th className="pb-3"><input type="checkbox"/></th><th className="pb-3">Ambassador</th><th className="pb-3">Region / City</th><th className="pb-3">Group</th><th className="pb-3">Status</th><th className="pb-3">Performance Score</th><th className="pb-3">Tasks</th><th className="pb-3">Last Activity</th><th className="pb-3">Actions</th></tr></thead>
                <tbody>{filtered.map((a,idx)=><tr key={a.name} className="border-b border-slate-100 text-[12px]"><td className="py-3"><input type="checkbox"/></td><td className="py-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-xs font-black">{a.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><button onClick={() => setSelectedProfile(a)} className="text-left hover:text-violet-700"><div className="font-black underline-offset-4 hover:underline">{a.name}</div><div className="font-semibold text-slate-500">{a.phone}</div></button></div></td><td><div className="font-black">{a.region}</div><div className="font-semibold text-slate-500">{a.city}</div></td><td><span className="rounded-md bg-violet-100 px-3 py-1 font-black text-violet-700">{a.group}</span></td><td><span className={a.status=="Active" ? "rounded-md bg-emerald-100 px-3 py-1 font-black text-emerald-700" : "rounded-md bg-rose-100 px-3 py-1 font-black text-rose-700"}>{a.status}</span></td><td><div className="flex items-center gap-3"><b>{a.score}/100</b><div className="h-2 w-20 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{width:a.score+"%"}}/></div></div></td><td className="font-black">{a.tasks}</td><td className="font-semibold text-slate-500">{a.lastActivity}</td><td><button onClick={() => setSelectedProfile(a)}><MoreHorizontal size={17}/></button></td></tr>)}</tbody>
              </table>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filtered.map((a) => (
                  <button key={a.name} onClick={() => setSelectedProfile(a)} className="rounded-[26px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg">
                    <div className="flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-sm font-black text-violet-700">{a.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><span className={a.status === "Active" ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700" : "rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700"}>{a.status}</span></div>
                    <h3 className="mt-4 text-lg font-black">{a.name}</h3>
                    <p className="mt-1 text-xs font-bold text-slate-500">{a.city} · {a.region}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-slate-50 p-3"><b>{a.score}</b><div className="text-[10px] font-black text-slate-500">Score</div></div><div className="rounded-2xl bg-slate-50 p-3"><b>{a.tasks}</b><div className="text-[10px] font-black text-slate-500">Tasks</div></div><div className="rounded-2xl bg-slate-50 p-3"><b>{a.leads}</b><div className="text-[10px] font-black text-slate-500">Leads</div></div></div>
                    <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{width:`${a.score}%`}} /></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-black">Ambassador Coverage</h2><p className="text-xs font-semibold text-slate-500">Presence across Morocco</p><MoroccoCard/><a className="mt-3 inline-flex items-center gap-2 text-sm font-black text-violet-600">View full map <ArrowRight size={14}/></a></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-black">Quick Actions</h2><div className="mt-4 grid grid-cols-3 gap-3">{quickActions.map(([q,Icon,key])=>{const I=Icon as typeof Users; return <button key={q} onClick={() => setActiveModal(key)} className="grid min-h-[112px] place-items-center rounded-xl border border-slate-200 p-3 text-center text-[12px] font-black transition hover:border-violet-300 hover:bg-violet-50"><I className="text-violet-600" size={22}/>{q}</button>})}</div></div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-4 gap-5"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Performance Overview</h2><div className="mt-5 h-36 bg-gradient-to-t from-violet-50 to-white"><svg viewBox="0 0 300 130" className="h-full w-full"><polyline fill="none" stroke="#7c3aed" strokeWidth="3" points="0,90 45,70 90,45 135,70 180,52 225,64 270,58 300,50"/></svg></div><a onClick={() => setActiveModal("performance")} className="cursor-pointer text-sm font-black text-violet-600">View analytics →</a></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Top Performing Ambassadors</h2>{filtered.slice(0,5).map((a,i)=><div key={a.name} className="mt-3 grid grid-cols-[20px_1fr_50px] text-xs font-black"><span>{i+1}</span><button onClick={() => setSelectedProfile(a)} className="text-left hover:text-violet-700">{a.name}</button><span>{a.score}/100</span></div>)}</div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Engagement Overview</h2>{[["Tasks","84%"],["Visits & Check-ins","78%"],["Surveys","72%"],["Trainings","90%"],["Events","65%"]].map(x=><div key={x[0]} className="mt-4 grid grid-cols-[1fr_130px_34px] items-center gap-2 text-xs font-black"><span>{x[0]}</span><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-500" style={{width:x[1]}}/></div><span>{x[1]}</span></div>)}</div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Directory Controls</h2><div className="mt-4 grid grid-cols-2 gap-3">{quickActions.map(([q,Icon,key])=>{const I=Icon as typeof Users; return <button key={q} onClick={() => setActiveModal(key)} className="grid min-h-[78px] place-items-center rounded-xl border text-center text-[11px] font-black"><I className="text-violet-600" size={18}/>{q}</button>})}</div></div></section>

        <DirectoryModalView active={activeModal} onClose={() => setActiveModal(null)} />
        {selectedProfile && <AmbassadorProfile360Modal ambassador={selectedProfile} onClose={() => setSelectedProfile(null)} />}
      </main>
    </div>
  )
}
