"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Eye,
  ListChecks,
  MessageCircle,
  Plus,
  Trash2,
  Gauge,
  ImagePlus,
  Layers3,
  LayoutGrid,
  Megaphone,
  MessageSquareText,
  Paperclip,
  PlayCircle,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  UploadCloud,
  UserCheck,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import {
  channels,
  contentTypeLabels,
  creators,
  defaultServices,
  seedContentItems,
  stageLabels,
  stageOrder,
  targets,
  type ContentPriority,
  type ContentStage,
  type ContentType,
  type ContentWorkspaceItem,
  type ServiceOption,
} from "@/lib/market-os/content-workspace";

const STORAGE_KEY = "market-os-content-items"
const ENABLE_DEMO_CONTENT = false

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function loadStoredItems(): ContentWorkspaceItem[] {
  if (typeof window === "undefined") return ENABLE_DEMO_CONTENT ? seedContentItems : []
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return ENABLE_DEMO_CONTENT ? seedContentItems : []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : (ENABLE_DEMO_CONTENT ? seedContentItems : [])
  } catch {
    return ENABLE_DEMO_CONTENT ? seedContentItems : []
  }
}

function persistTask(task: ContentWorkspaceItem) {
  if (typeof window === "undefined") return
  const current = loadStoredItems()
  const exists = current.some((i) => i.id === task.id)
  const next = exists ? current.map((i) => (i.id === task.id ? task : i)) : [task, ...current]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

const input =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-[inset_0_1px_0_rgba(15,23,42,0.03)] outline-none transition placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-50";
const button =
  "rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";
const whitePanel =
  "rounded-[2.2rem] border border-slate-200/90 bg-white/95 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-white/70 backdrop-blur";
const sectionTitle =
  "flex items-center gap-2 text-xl font-black tracking-tight text-slate-950";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs font-bold text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "pink" | "green" | "amber" | "red" | "violet" | "blue";
}) {
  const m = {
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    pink: "border-pink-200 bg-pink-50 text-pink-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide",
        m[tone],
      )}
      style={{
        color:
          tone === "pink"
            ? "#be185d"
            : tone === "green"
              ? "#047857"
              : tone === "violet"
                ? "#6d28d9"
                : tone === "amber"
                  ? "#b45309"
                  : tone === "red"
                    ? "#b91c1c"
                    : tone === "blue"
                      ? "#1d4ed8"
                      : "#334155",
      }}
    >
      {children}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/10 backdrop-blur">
      <Icon className="h-5 w-5 text-pink-200" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.72)" }}>
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight" style={{ color: "#ffffff" }}>
        {value}
      </p>
      <p className="mt-1 text-xs font-bold" style={{ color: "rgba(255,255,255,0.68)" }}>{sub}</p>
    </div>
  );
}

function stageTone(s: ContentStage) {
  return s === "published" || s === "approved"
    ? "green"
    : s === "rejected"
      ? "red"
      : s === "review"
        ? "violet"
        : s === "production"
          ? "amber"
          : "slate";
}
function priorityTone(p: ContentPriority) {
  return p === "urgent"
    ? "red"
    : p === "high"
      ? "amber"
      : p === "normal"
        ? "blue"
        : "slate";
}

const emptyTask: ContentWorkspaceItem = {
  id: "",
  title: "",
  content_type: "post",
  service_id: "",
  service_name: "",
  creator: "Content Officer",
  asset_url: "",
  stage: "planned",
  priority: "normal",
  channel: "Meta",
  target: "Parents B2C",
  deadline: "",
  objective: "",
  output_notes: "",
  review_notes: "",
  approval_status: "none",
  production_score: 0,
};

const productionStandards = [
  "Angle confiance + preuve qualité",
  "Message adapté au service choisi",
  "CTA WhatsApp / devis / rendez-vous clair",
  "Visuel propre AngelCare, lisible mobile",
  "Version prête review manager",
  "Output final attaché avant publication",
];

type TaskChecklistItem = {
  id: string
  label: string
  done: boolean
}

type TaskEvent = {
  id: string
  type: "comment" | "event"
  message: string
  created_at: string
}

function checklistKey(taskId: string) {
  return `market-os-content-checklist-${taskId}`
}

function eventsKey(taskId: string) {
  return `market-os-content-events-${taskId}`
}

function loadChecklist(taskId: string): TaskChecklistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(checklistKey(taskId))
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return [
    { id: "brief", label: "Brief marketing validé", done: false },
    { id: "asset", label: "Asset final attaché", done: false },
    { id: "cta", label: "CTA WhatsApp / devis confirmé", done: false },
    { id: "review", label: "Review manager préparée", done: false },
  ]
}

function persistChecklist(taskId: string, items: TaskChecklistItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(checklistKey(taskId), JSON.stringify(items))
}

function loadEvents(taskId: string): TaskEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(eventsKey(taskId))
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return [
    {
      id: "opened",
      type: "event",
      message: "Content task opened in production workspace.",
      created_at: new Date().toISOString(),
    },
  ]
}

function persistEvents(taskId: string, events: TaskEvent[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(eventsKey(taskId), JSON.stringify(events))
}


export default function ContentTaskEditor({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<ContentWorkspaceItem>(emptyTask);
  const [original, setOriginal] = useState<ContentWorkspaceItem | null>(null);
  const [services, setServices] = useState<ServiceOption[]>(defaultServices);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [smartOutput, setSmartOutput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    setChecklist(loadChecklist(taskId));
    setEvents(loadEvents(taskId));

    fetch("/api/market-os/content-workspace/services")
      .then((r) => r.json())
      .then((j) => Array.isArray(j.data) && setServices(j.data))
      .catch(() => {});

    const localItems = loadStoredItems()
    const localMatch = localItems.find((i) => i.id === taskId)
    if (localMatch) {
      setTask(localMatch)
      setOriginal(localMatch)
    }

    fetch(`/api/market-os/content-workspace/${taskId}`)
      .then((r) => r.json())
      .then((j) => {
        const fallback = localMatch || (ENABLE_DEMO_CONTENT ? seedContentItems.find((i) => i.id === taskId) : undefined);
        const next = j.data && j.data.title ? j.data : fallback || { ...emptyTask, id: taskId, title: "New content task" };
        setTask(next);
        setOriginal(next);
        persistTask(next)
      })
      .catch(() => {
        const fallback = localMatch || (ENABLE_DEMO_CONTENT ? seedContentItems.find((i) => i.id === taskId) : undefined) || {
          ...emptyTask,
          id: taskId,
          title: "New content task",
        };
        setTask(fallback);
        setOriginal(fallback);
        persistTask(fallback)
      });
  }, [taskId]);

  const dirty = useMemo(
    () => JSON.stringify(task) !== JSON.stringify(original),
    [task, original],
  );
  const readiness = useMemo(() => {
    const checks = [
      task.title,
      task.content_type,
      task.service_id || task.service_name,
      task.creator,
      task.channel,
      task.target,
      task.objective,
      task.asset_url,
      task.output_notes,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [task]);
  const stageIndex = Math.max(0, stageOrder.indexOf(task.stage));
  const selectedService = services.find((s) => s.id === task.service_id);

  function set<K extends keyof ContentWorkspaceItem>(
    k: K,
    v: ContentWorkspaceItem[K],
  ) {
    setTask((t) => ({ ...t, [k]: v }));
  }

  async function save(patch: Partial<ContentWorkspaceItem> = {}) {
    const next = { ...task, ...patch };
    setTask(next);
    persistTask(next)
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/market-os/content-workspace/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      const savedTask = json.data && json.data.title ? json.data : next
      setTask(savedTask);
      setOriginal(savedTask);
      persistTask(savedTask)
      setSaved(true);
      addEvent("Task saved.");
      setTimeout(() => setSaved(false), 1800);
    } catch (e: any) {
      setOriginal(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
      setError("Saved locally. API sync unavailable.")
      addEvent("Task saved locally because API sync was unavailable.")
    } finally {
      setBusy(false);
    }
  }

  function advance(
    stage: ContentStage,
    approval_status = task.approval_status,
  ) {
    const score =
      stage === "published"
        ? 100
        : stage === "approved"
          ? Math.max(task.production_score || 0, 92)
          : stage === "review"
            ? Math.max(task.production_score || 0, 78)
            : Math.max(task.production_score || 0, readiness);
    save({ stage, approval_status, production_score: score });
  }

  function applySmartTool(kind: "hook" | "caption" | "review" | "compliance") {
    const service =
      selectedService?.name || task.service_name || "service AngelCare";
    const type = contentTypeLabels[task.content_type];
    const map = {
      hook: `HOOK PROPOSÉ — ${service}:\nCréer un angle confiance immédiat: problème parent / preuve AngelCare / solution claire / CTA WhatsApp.`,
      caption: `CAPTION PROPOSÉE — ${type}:\nAngelCare accompagne les familles avec une solution fiable, humaine et organisée. Besoin d'un accompagnement adapté ? Envoyez-nous un message WhatsApp pour recevoir une orientation rapide.`,
      review: `CHECK REVIEW MANAGER:\n1. Vérifier service + promesse.\n2. Valider ton de marque AngelCare.\n3. Confirmer visuel et CTA.\n4. Vérifier que l'asset final est attaché.`,
      compliance: `BRAND COMPLIANCE:\nTon rassurant, aucune promesse excessive, message orienté confiance, preuve, clarté, respect famille/enfants, CTA commercial propre.`,
    };
    setSmartOutput(map[kind]);
    addEvent(`Smart production tool used: ${kind}.`)
    const next = {
      ...task,
      output_notes: `${task.output_notes || ""}\n\n${map[kind]}`.trim(),
      production_score: Math.max(task.production_score || 0, 55),
    }
    setTask(next)
    persistTask(next)
  }

  async function copyAssetLink() {
    await navigator.clipboard?.writeText(task.asset_url || "")
    setCopyFeedback(task.asset_url ? "Asset link copied." : "No asset link to copy.")
    setTimeout(() => setCopyFeedback(""), 1800)
  }


  function addEvent(message: string, type: "comment" | "event" = "event") {
    const next = [
      {
        id: `${type}-${Date.now()}`,
        type,
        message,
        created_at: new Date().toISOString(),
      },
      ...events,
    ]
    setEvents(next)
    persistEvents(taskId, next)
  }

  function toggleChecklistItem(id: string) {
    const next = checklist.map((item) => item.id === id ? { ...item, done: !item.done } : item)
    setChecklist(next)
    persistChecklist(taskId, next)
    addEvent("Checklist updated.")
  }

  function addChecklistItem() {
    if (!newChecklistItem.trim()) return
    const label = newChecklistItem.trim()
    const next = [...checklist, { id: `item-${Date.now()}`, label, done: false }]
    setChecklist(next)
    persistChecklist(taskId, next)
    setNewChecklistItem("")
    addEvent(`Checklist item added: ${label}`)
  }

  function deleteChecklistItem(id: string) {
    const next = checklist.filter((item) => item.id !== id)
    setChecklist(next)
    persistChecklist(taskId, next)
    addEvent("Checklist item deleted.")
  }

  function addComment() {
    if (!comment.trim()) return
    addEvent(comment.trim(), "comment")
    setComment("")
  }

  function deleteTask() {
    const confirmed = window.confirm("Delete this content task permanently? This removes it from the local content workspace.")
    if (!confirmed) return

    if (typeof window !== "undefined") {
      const current = loadStoredItems()
      const next = current.filter((item) => item.id !== taskId)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      window.localStorage.removeItem(checklistKey(taskId))
      window.localStorage.removeItem(eventsKey(taskId))
    }

    window.location.href = "/market-os/content-command-center"
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4f0,transparent_28%),linear-gradient(180deg,#f8fafc,#eef2f7)] p-4 text-slate-950 md:p-8">
      <section className="mx-auto max-w-[1600px] space-y-6">
        <div className="sticky top-3 z-40 flex flex-wrap items-center justify-between gap-3 rounded-[1.7rem] border border-white/70 bg-white/85 p-3 shadow-lg shadow-slate-900/5 backdrop-blur">
          <Link
            href="/market-os/content-command-center"
            className={cn(
              button,
              "border border-slate-200 bg-white text-slate-950 shadow-sm",
            )}
          >
            <ArrowLeft className="mr-2 inline h-4 w-4" /> Back to content center
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge tone={priorityTone(task.priority)}>
              Priority {task.priority}
            </Badge>
            <Badge tone={stageTone(task.stage)}>
              {stageLabels[task.stage]}
            </Badge>
            <Badge tone="pink">AngelCare content</Badge>
            {dirty && <Badge tone="amber">Unsaved changes</Badge>}
            {saved && <Badge tone="green">Saved</Badge>}
          </div>
        </div>

        <header className="overflow-hidden rounded-[2.7rem] border border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.30),transparent_34%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] text-white shadow-2xl shadow-slate-950/25">
          <div className="relative grid gap-6 p-6 md:p-8 xl:grid-cols-[1.35fr_.95fr]">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-pink-500/25 blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-wrap gap-2">
                <Badge tone="pink">Gestion contenu & livrables</Badge>
                <Badge tone="violet">Production workspace</Badge>
                <Badge tone="green">Review → approve → publish</Badge>
              </div>
              <h1
                className="mt-5 max-w-5xl text-4xl font-black tracking-tight drop-shadow-sm md:text-6xl"
                style={{ color: "#ffffff" }}
              >
                {task.title || "Corporate content task production desk"}
              </h1>
              <p
                className="mt-4 max-w-4xl text-sm font-semibold leading-7"
                style={{ color: "rgba(255,255,255,0.88)" }}
              >
                Page dédiée pour ouvrir une tâche, éditer le brief, configurer
                le livrable, lier un service AngelCare, attacher l’asset,
                piloter la review et publier avec un vrai standard marketing
                digital.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <button
                  disabled={busy}
                  onClick={() => save()}
                  className={cn(
                    button,
                    "bg-white !text-slate-950 ring-1 ring-white/70",
                  )}
                >
                  <Save className="mr-2 inline h-4 w-4" />
                  Save task
                </button>
                <button
                  disabled={busy}
                  onClick={() => advance("review", "submitted" as any)}
                  className={cn(button, "bg-violet-500 !text-white")}
                >
                  <Send className="mr-2 inline h-4 w-4" />
                  Submit review
                </button>
                <button
                  disabled={busy}
                  onClick={() => advance("approved", "approved" as any)}
                  className={cn(button, "bg-emerald-500 !text-white")}
                >
                  <ShieldCheck className="mr-2 inline h-4 w-4" />
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => advance("published", task.approval_status)}
                  className={cn(button, "bg-pink-500 !text-white")}
                >
                  <PlayCircle className="mr-2 inline h-4 w-4" />
                  Publish
                </button>
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-3">
              <MetricCard
                icon={Gauge}
                label="Readiness"
                value={`${readiness}%`}
                sub="Brief + asset quality"
              />
              <MetricCard
                icon={Layers3}
                label="Output score"
                value={`${task.production_score || 0}%`}
                sub="Production maturity"
              />
              <MetricCard
                icon={Clock}
                label="Deadline"
                value={task.deadline || "TBD"}
                sub="Execution timing"
              />
              <MetricCard
                icon={UserCheck}
                label="Owner"
                value={task.creator || "None"}
                sub="Responsible creator"
              />
            </div>
          </div>
        </header>

        <nav
          className="rounded-[2rem] border border-slate-200/90 bg-white/90 p-3 shadow-sm backdrop-blur"
          aria-label="Content production navigation"
        >
          <div className="grid gap-2 md:grid-cols-5">
            {[
              ["01", "Configure", "Deliverable + service"],
              ["02", "Brief", "Mission + script"],
              ["03", "Asset", "Attach final output"],
              ["04", "Review", "Approve / reject"],
              ["05", "Publish", "Production tracking"],
            ].map(([n, a, b], idx) => (
              <a
                key={a}
                href={
                  idx === 0
                    ? "#configuration"
                    : idx === 1
                      ? "#brief"
                      : idx === 2
                        ? "#asset"
                        : idx === 3
                          ? "#workflow"
                          : "#tracker"
                }
                className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-pink-200 hover:bg-pink-50"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-pink-600">
                  {n}
                </span>
                <p className="mt-1 text-sm font-black text-slate-950">{a}</p>
                <p className="text-xs font-bold text-slate-500">{b}</p>
              </a>
            ))}
          </div>
        </nav>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_.8fr_.55fr]">
          <section className="space-y-6">
            <div id="configuration" className={whitePanel}>
              <div className="flex items-center justify-between gap-4">
                <h2 className={sectionTitle}>
                  <LayoutGrid className="h-5 w-5 text-pink-600" />
                  Deliverable command panel
                </h2>
                <Badge tone="blue">Configuration</Badge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Deliverable title">
                  <input
                    className={input}
                    value={task.title || ""}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Ex: Brochure ventes - Garde d'enfants"
                  />
                </Field>
                <Field label="Content type">
                  <select
                    className={input}
                    value={task.content_type}
                    onChange={(e) =>
                      set("content_type", e.target.value as ContentType)
                    }
                  >
                    {Object.entries(contentTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Related service"
                  hint="Préchargé depuis le module services quand l’API existe."
                >
                  <select
                    className={input}
                    value={task.service_id || ""}
                    onChange={(e) => {
                      const svc = services.find((s) => s.id === e.target.value);
                      setTask((t) => ({
                        ...t,
                        service_id: e.target.value,
                        service_name: svc?.name || t.service_name,
                      }));
                    }}
                  >
                    <option value="">Choose from services module</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.category ? ` · ${s.category}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Assigned creator">
                  <select
                    className={input}
                    value={task.creator || ""}
                    onChange={(e) => set("creator", e.target.value)}
                  >
                    {creators.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Channel">
                  <select
                    className={input}
                    value={task.channel}
                    onChange={(e) => set("channel", e.target.value)}
                  >
                    {channels.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Target audience">
                  <select
                    className={input}
                    value={task.target}
                    onChange={(e) => set("target", e.target.value)}
                  >
                    {targets.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className={input}
                    value={task.priority}
                    onChange={(e) =>
                      set("priority", e.target.value as ContentPriority)
                    }
                  >
                    {["urgent", "high", "normal", "low"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Deadline">
                  <input
                    className={input}
                    value={task.deadline || ""}
                    onChange={(e) => set("deadline", e.target.value)}
                    placeholder="Today 18:00"
                  />
                </Field>
              </div>
            </div>

            <div id="brief" className={whitePanel}>
              <h2 className={sectionTitle}>
                <Target className="h-5 w-5 text-pink-600" />
                Marketing brief & production direction
              </h2>
              <div className="mt-5 grid gap-4">
                <Field label="Mission / conversion objective">
                  <textarea
                    className={cn(input, "min-h-[115px]")}
                    value={task.objective || ""}
                    onChange={(e) => set("objective", e.target.value)}
                    placeholder="Créer confiance, engager, convertir, générer messages entrants..."
                  />
                </Field>
                <Field label="Production notes / script / visual direction">
                  <textarea
                    className={cn(input, "min-h-[160px]")}
                    value={task.output_notes || ""}
                    onChange={(e) => set("output_notes", e.target.value)}
                    placeholder="Hook, CTA, format, Canva direction, video script, newsletter structure..."
                  />
                </Field>
                <Field label="Review notes / manager decision">
                  <textarea
                    className={cn(input, "min-h-[115px]")}
                    value={task.review_notes || ""}
                    onChange={(e) => set("review_notes", e.target.value)}
                    placeholder="Corrections, approval reason, rejection reason, publication condition..."
                  />
                </Field>
              </div>
            </div>

            <div id="workflow" className={whitePanel}>
              <h2 className={sectionTitle}>
                <Megaphone className="h-5 w-5 text-pink-600" />
                Workflow stage control
              </h2>
              <div className="mt-5 grid gap-3 md:grid-cols-7">
                {stageOrder.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => set("stage", s)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                      task.stage === s
                        ? "border-pink-300 bg-pink-50 text-pink-700 shadow-sm"
                        : i <= stageIndex
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-700",
                    )}
                  >
                    <CalendarDays className="mb-3 h-4 w-4" />
                    <p className="text-sm font-black">{stageLabels[s]}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-60">
                      Step {i + 1}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div id="asset" className={whitePanel}>
              <h2 className={sectionTitle}>
                <Paperclip className="h-5 w-5 text-pink-600" />
                Asset & deliverable control
              </h2>
              <div className="mt-5 space-y-3">
                <Field label="Attach asset URL">
                  <input
                    className={input}
                    value={task.asset_url || ""}
                    onChange={(e) => set("asset_url", e.target.value)}
                    placeholder="Canva / Drive / video / image link"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  {task.asset_url ? (
                    <a
                      href={task.asset_url}
                      target="_blank"
                      className={cn(
                        button,
                        "border border-slate-200 bg-white text-center text-slate-900",
                      )}
                    >
                      <Eye className="mr-2 inline h-4 w-4" />
                      Open asset
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={cn(
                        button,
                        "border border-dashed border-slate-300 bg-white text-slate-500",
                      )}
                    >
                      <UploadCloud className="mr-2 inline h-4 w-4" />
                      Waiting asset
                    </button>
                  )}
                  <button
                    onClick={copyAssetLink}
                    className={cn(
                      button,
                      "border border-slate-200 bg-white text-slate-900",
                    )}
                  >
                    <Copy className="mr-2 inline h-4 w-4" />
                    Copy link
                  </button>
                </div>
                {copyFeedback ? <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">{copyFeedback}</p> : null}
                <div className="rounded-[1.7rem] border border-dashed border-pink-200 bg-pink-50/60 p-5 text-center">
                  <ImagePlus className="mx-auto h-7 w-7 text-pink-600" />
                  <p className="mt-2 text-sm font-black text-slate-800">
                    Final output vault
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Attach Canva, Drive, reel, video, PDF, presentation or
                    newsletter preview.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2.2rem] border border-slate-800 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.22),transparent_35%),linear-gradient(145deg,#020617,#0f172a)] p-5 text-white shadow-2xl shadow-slate-950/20">
              <h2
                className="flex items-center gap-2 text-xl font-black tracking-tight"
                style={{ color: "#ffffff" }}
              >
                <Sparkles className="h-5 w-5 text-pink-300" />
                Smart production tools
              </h2>
              <p className="mt-2 text-sm font-bold" style={{ color: "rgba(255,255,255,0.78)" }}>
                Buttons inject useful working notes directly into the task.
              </p>
              <div className="mt-5 grid gap-2">
                <button
                  onClick={() => applySmartTool("hook")}
                  className={cn(
                    button,
                    "border border-white/10 bg-white/10 text-left text-white hover:bg-white/15",
                  )}
                >
                  <Wand2 className="mr-2 inline h-4 w-4 text-pink-200" />
                  Generate trust hook
                </button>
                <button
                  onClick={() => applySmartTool("caption")}
                  className={cn(
                    button,
                    "border border-white/10 bg-white/10 text-left text-white hover:bg-white/15",
                  )}
                >
                  <MessageSquareText className="mr-2 inline h-4 w-4 text-pink-200" />
                  Generate caption direction
                </button>
                <button
                  onClick={() => applySmartTool("review")}
                  className={cn(
                    button,
                    "border border-white/10 bg-white/10 text-left text-white hover:bg-white/15",
                  )}
                >
                  <BookOpenCheck className="mr-2 inline h-4 w-4 text-pink-200" />
                  Prepare manager review
                </button>
                <button
                  onClick={() => applySmartTool("compliance")}
                  className={cn(
                    button,
                    "border border-white/10 bg-white/10 text-left text-white hover:bg-white/15",
                  )}
                >
                  <ShieldCheck className="mr-2 inline h-4 w-4 text-pink-200" />
                  Brand compliance check
                </button>
              </div>
              {smartOutput ? (
                <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-4 text-xs font-bold leading-6 text-white/85">
                  {smartOutput}
                </pre>
              ) : null}
            </div>

            <div className={whitePanel}>
              <h2 className={sectionTitle}>
                <ClipboardCheck className="h-5 w-5 text-pink-600" />
                Production standards
              </h2>
              <div className="mt-4 space-y-2">
                {productionStandards.map((x, idx) => {
                  const done = idx < Math.round(readiness / 17);
                  return (
                    <div
                      key={x}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-slate-800"
                    >
                      <span>{x}</span>
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4",
                          done ? "text-emerald-600" : "text-slate-300",
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <div className={whitePanel}>
              <h2 className={sectionTitle}>
                <Zap className="h-5 w-5 text-pink-600" />
                Action dock
              </h2>
              <div className="mt-5 grid gap-2">
                <button
                  disabled={busy}
                  onClick={() => save()}
                  className={cn(button, "bg-slate-950 text-white")}
                >
                  <Save className="mr-2 inline h-4 w-4" />
                  Save changes
                </button>
                <button
                  disabled={busy}
                  onClick={() => advance("review", "submitted" as any)}
                  className={cn(button, "bg-violet-600 text-white")}
                >
                  <Send className="mr-2 inline h-4 w-4" />
                  Submit review
                </button>
                <button
                  disabled={busy}
                  onClick={() => advance("approved", "approved" as any)}
                  className={cn(button, "bg-emerald-600 text-white")}
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => advance("rejected", "rejected" as any)}
                  className={cn(button, "bg-red-600 text-white")}
                >
                  <XCircle className="mr-2 inline h-4 w-4" />
                  Reject
                </button>
                <button
                  disabled={busy}
                  onClick={() => advance("published", task.approval_status)}
                  className={cn(button, "bg-pink-600 text-white")}
                >
                  <PlayCircle className="mr-2 inline h-4 w-4" />
                  Publish
                </button>
                <button
                  disabled={busy}
                  onClick={deleteTask}
                  className={cn(button, "border border-red-200 bg-red-50 text-red-700")}
                >
                  <Trash2 className="mr-2 inline h-4 w-4" />
                  Delete permanently
                </button>
              </div>
              {error && (
                <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}
            </div>


            <div className={whitePanel}>
              <h2 className={sectionTitle}>
                <ListChecks className="h-5 w-5 text-pink-600" />
                Task checklist
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Create and control execution sub-tasks for this content deliverable.
              </p>

              <div className="mt-4 space-y-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <button
                      onClick={() => toggleChecklistItem(item.id)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-black",
                        item.done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400",
                      )}
                    >
                      {item.done ? "✓" : ""}
                    </button>
                    <span className={cn("flex-1 text-sm font-bold", item.done ? "text-slate-400 line-through" : "text-slate-800")}>
                      {item.label}
                    </span>
                    <button onClick={() => deleteChecklistItem(item.id)} className="rounded-xl border border-red-100 bg-white px-2 py-1 text-xs font-black text-red-600">
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <input
                  className={input}
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add checklist item..."
                />
                <button onClick={addChecklistItem} className={cn(button, "bg-slate-950 text-white")}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className={whitePanel}>
              <h2 className={sectionTitle}>
                <MessageCircle className="h-5 w-5 text-pink-600" />
                Comments & event log
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Track manager decisions, production comments and task history.
              </p>

              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <input
                  className={input}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add comment or manager note..."
                />
                <button onClick={addComment} className={cn(button, "bg-pink-600 text-white")}>
                  Add
                </button>
              </div>

              <div className="mt-4 max-h-[280px] space-y-2 overflow-auto pr-1">
                {events.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                        <Activity className="h-3.5 w-3.5 text-pink-600" />
                        {event.type}
                      </p>
                      <time className="text-[10px] font-bold text-slate-400">
                        {new Date(event.created_at).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{event.message}</p>
                  </article>
                ))}
              </div>
            </div>

            <div id="tracker" className={whitePanel}>
              <h2 className={sectionTitle}>
                <BarChart3 className="h-5 w-5 text-pink-600" />
                Output tracker
              </h2>
              <div className="mt-4 space-y-4">
                {[
                  { label: "Readiness", value: readiness },
                  { label: "Production", value: task.production_score || 0 },
                  {
                    label: "Workflow",
                    value: Math.round(
                      ((stageIndex + 1) / stageOrder.length) * 100,
                    ),
                  },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                      <span>{m.label}</span>
                      <span>{m.value}%</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-pink-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, m.value))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={whitePanel}>
              <h2 className={sectionTitle}>
                <Timer className="h-5 w-5 text-pink-600" />
                Live production rhythm
              </h2>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-700">
                {[
                  ["Brief locked", task.objective ? "Ready" : "Missing"],
                  ["Asset status", task.asset_url ? "Attached" : "Waiting"],
                  ["Approval", task.approval_status],
                  [
                    "Service",
                    selectedService?.name || task.service_name || "Not linked",
                  ],
                ].map(([a, b]) => (
                  <div
                    key={a}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
                  >
                    <span>{a}</span>
                    <span className="text-right text-slate-500">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}