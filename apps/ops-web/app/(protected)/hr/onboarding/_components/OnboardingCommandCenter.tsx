"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  Edit3,
  FileBadge2,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  Network,
  PauseCircle,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import type {
  JsonObject,
  OnboardingActivity,
  OnboardingChecklist,
  OnboardingDocument,
  OnboardingJourney,
  OnboardingMutationResponse,
  OnboardingTask,
  OnboardingWorkspace,
} from "@/lib/hr-onboarding/types";
import { ONBOARDING_PHASES } from "@/lib/hr-onboarding/types";

export type OnboardingSeedData = OnboardingWorkspace;

type ModalKind =
  | null
  | "createJourney"
  | "editJourney"
  | "task"
  | "document"
  | "note"
  | "reassign"
  | "archive"
  | "cancel"
  | "override"
  | "upload"
  | "taskArchive"
  | "documentArchive";

type MutationStage = { label: string; state: "pending" | "running" | "done" | "failed" };
type ApiEnvelope = OnboardingMutationResponse & { workspace?: OnboardingWorkspace };

const PHASE_LABELS: Record<string, string> = {
  offer_accepted: "Offre & acceptation",
  preboarding: "Préboarding",
  documents: "Documents",
  orientation: "Orientation",
  training_setup: "Formation & accès",
  integration: "Intégration",
  probation: "Période d’essai",
  completed: "Terminé",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  active: "Actif",
  paused: "En pause",
  completed: "Terminé",
  cancelled: "Annulé",
  archived: "Archivé",
  pending: "À faire",
  in_progress: "En cours",
  blocked: "Bloqué",
  waived: "Dispensé",
  required: "Requis",
  requested: "Demandé",
  uploaded: "Téléversé",
  validated: "Validé",
  rejected: "Rejeté",
  expired: "Expiré",
};

const tabs = ["Tâches", "Documents", "Timeline", "Checklist", "Notes", "Activité"] as const;
type Tab = (typeof tabs)[number];

const navGroups = [
  { label: "Vue générale", items: [{ label: "Dashboard", href: "/hr", icon: LayoutDashboard }] },
  {
    label: "Capital humain",
    items: [
      { label: "Collaborateurs", href: "/hr/employees", icon: Users },
      { label: "Équipes & départements", href: "/hr/departments", icon: Building2 },
      { label: "Recrutement", href: "/hr/recruitment", icon: UserCheck },
      { label: "Onboarding", href: "/hr/onboarding", icon: ClipboardCheck },
      { label: "Performance", href: "/hr/performance-matrix", icon: Gauge },
      { label: "Learning & Development", href: "/hr/training", icon: GraduationCap },
    ],
  },
  {
    label: "Opérations",
    items: [
      { label: "Présence", href: "/hr/attendance", icon: CalendarDays },
      { label: "Planning", href: "/hr/work-schedules", icon: Workflow },
      { label: "Documents", href: "/hr/documents", icon: FileBadge2 },
      { label: "Conformité", href: "/hr/compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Système",
    items: [
      { label: "Synchronisation", href: "/hr/sync-center", icon: Network },
      { label: "Paramètres", href: "/hr/settings", icon: Settings },
    ],
  },
] as const;

function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(value: string | null): string {
  if (!value) return "Non planifiée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function statusTone(status: string): string {
  if (["completed", "validated", "done"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["blocked", "rejected", "cancelled", "critical", "expired"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  if (["paused", "pending", "required", "requested"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "archived") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-violet-200 bg-violet-50 text-violet-700";
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: init?.body instanceof FormData
        ? init.headers
        : { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    const body = await response.json() as Record<string, unknown>;
    if (!response.ok || body.ok === false) throw new Error(String(body.error ?? `Erreur HTTP ${response.status}`));
    return body as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function OnboardingCommandCenter({ initialData }: { initialData: OnboardingSeedData }) {
  const [workspace, setWorkspace] = useState<OnboardingWorkspace>(initialData);
  const [selectedKey, setSelectedKey] = useState<string | null>(initialData.selectedJourneyKey);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [tab, setTab] = useState<Tab>("Tâches");
  const [modal, setModal] = useState<ModalKind>(null);
  const [editingTask, setEditingTask] = useState<OnboardingTask | null>(null);
  const [editingDocument, setEditingDocument] = useState<OnboardingDocument | null>(null);
  const [toast, setToast] = useState("Synchronisation Supabase active");
  const [busy, setBusy] = useState(false);
  const [stages, setStages] = useState<MutationStage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selected = workspace.journeys.find((item) => item.journeyKey === selectedKey) ?? workspace.journeys[0] ?? null;
  const filteredJourneys = useMemo(() => workspace.journeys.filter((journey) => {
    const matchesQuery = `${journey.title} ${journey.position ?? ""} ${journey.department ?? ""} ${journey.owner ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || journey.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [workspace.journeys, query, statusFilter]);

  const tasks = useMemo(() => selected ? workspace.tasks.filter((item) => item.journeyKey === selected.journeyKey) : [], [workspace.tasks, selected]);
  const documents = useMemo(() => selected ? workspace.documents.filter((item) => item.journeyKey === selected.journeyKey) : [], [workspace.documents, selected]);
  const activity = useMemo(() => selected ? workspace.activity.filter((item) => item.journeyKey === selected.journeyKey) : [], [workspace.activity, selected]);
  const notes = activity.filter((item) => ["note", "manager_instruction", "escalation", "decision"].includes(item.type));
  const completedTasks = tasks.filter((item) => item.status === "completed" || item.status === "waived").length;
  const validatedDocuments = documents.filter((item) => item.status === "validated" || item.status === "waived").length;
  const activeCount = workspace.journeys.filter((item) => item.status === "active").length;
  const atRisk = workspace.journeys.filter((item) => ["high", "critical"].includes(item.riskLevel)).length;
  const blockedTasks = workspace.tasks.filter((item) => item.status === "blocked").length;
  const missingDocs = workspace.documents.filter((item) => item.required && !["validated", "waived"].includes(item.status)).length;

  async function refresh(preferredKey?: string | null): Promise<void> {
    const target = preferredKey ?? selectedKey;
    const response = await apiRequest<{ ok: true; workspace: OnboardingWorkspace }>(`/api/hr/onboarding/workspace${target ? `?selected=${encodeURIComponent(target)}` : ""}`);
    setWorkspace(response.workspace);
    setSelectedKey(response.workspace.selectedJourneyKey);
  }

  function openModal(kind: ModalKind): void {
    setError(null);
    setModal(kind);
  }

  async function runMutation(options: {
    title: string;
    stageLabels: string[];
    request: () => Promise<ApiEnvelope>;
    preferredKey?: string | null;
    closeOnSuccess?: boolean;
  }): Promise<void> {
    setBusy(true);
    setError(null);
    setStages(options.stageLabels.map((label, index) => ({ label, state: index === 0 ? "running" : "pending" })));
    try {
      for (let index = 1; index < options.stageLabels.length; index += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 90));
        setStages((current) => current.map((stage, stageIndex) => ({ ...stage, state: stageIndex < index ? "done" : stageIndex === index ? "running" : "pending" })));
      }
      const response = await options.request();
      setStages((current) => current.map((stage) => ({ ...stage, state: "done" })));
      if (response.workspace) {
        setWorkspace(response.workspace);
        setSelectedKey(response.workspace.selectedJourneyKey);
      } else {
        await refresh(options.preferredKey);
      }
      setToast(`${options.title} · ${response.message}`);
      if (options.closeOnSuccess !== false) window.setTimeout(() => setModal(null), 450);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "L’opération a échoué.";
      setError(message);
      setStages((current) => current.map((stage) => stage.state === "running" ? { ...stage, state: "failed" } : stage));
    } finally {
      setBusy(false);
    }
  }

  async function submitJourney(form: FormData, editing: boolean): Promise<void> {
    const personKey = String(form.get("personKey") ?? "");
    const person = [...workspace.candidates, ...workspace.staff].find((item) => item.key === personKey);
    const ownerKey = String(form.get("ownerKey") ?? "");
    const managerKey = String(form.get("managerKey") ?? "");
    const owner = workspace.owners.find((item) => item.key === ownerKey);
    const manager = workspace.owners.find((item) => item.key === managerKey);
    const payload: JsonObject = {
      candidateKey: person?.kind === "candidate" ? person.key : null,
      staffKey: person?.kind === "staff" ? person.key : null,
      title: String(form.get("title") ?? person?.fullName ?? ""),
      position: String(form.get("position") ?? person?.position ?? ""),
      department: String(form.get("department") ?? person?.department ?? ""),
      startDate: String(form.get("startDate") ?? "") || null,
      manager: manager?.fullName ?? null,
      managerKey: managerKey || null,
      location: String(form.get("location") ?? "") || null,
      employmentType: String(form.get("employmentType") ?? "") || null,
      email: String(form.get("email") ?? person?.email ?? "") || null,
      phone: String(form.get("phone") ?? person?.phone ?? "") || null,
      owner: owner?.fullName ?? null,
      ownerKey: ownerKey || null,
      priority: String(form.get("priority") ?? "normal"),
      riskLevel: String(form.get("riskLevel") ?? "normal"),
      riskNotes: String(form.get("riskNotes") ?? "") || null,
      checklistKey: String(form.get("checklistKey") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      idempotencyKey: crypto.randomUUID(),
    };
    if (editing && selected) payload.version = selected.version;

    await runMutation({
      title: editing ? "Parcours mis à jour" : "Parcours créé",
      stageLabels: editing
        ? ["Validation", "Contrôle de version", "Mise à jour", "Recalcul des gates", "Synchronisation"]
        : ["Validation", "Création du parcours", "Affectation checklist", "Génération des tâches", "Demandes documentaires", "Audit", "Synchronisation"],
      request: () => apiRequest<ApiEnvelope>(editing && selected ? `/api/hr/onboarding/journeys/${encodeURIComponent(selected.journeyKey)}` : "/api/hr/onboarding/journeys", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
      preferredKey: selected?.journeyKey,
    });
  }

  async function submitTask(form: FormData): Promise<void> {
    if (!selected) return;
    const ownerKey = String(form.get("ownerKey") ?? "");
    const owner = workspace.owners.find((item) => item.key === ownerKey);
    const payload: JsonObject = {
      title: String(form.get("title") ?? ""),
      groupName: String(form.get("groupName") ?? "Général"),
      phase: String(form.get("phase") ?? selected.phase),
      status: String(form.get("status") ?? "pending"),
      owner: owner?.fullName ?? null,
      ownerKey: ownerKey || null,
      priority: String(form.get("priority") ?? "normal"),
      dueAt: String(form.get("dueAt") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      required: form.get("required") === "on",
      idempotencyKey: crypto.randomUUID(),
    };
    if (editingTask) payload.version = editingTask.version;
    await runMutation({
      title: editingTask ? "Tâche mise à jour" : "Tâche créée",
      stageLabels: ["Validation", "Persistance", "Recalcul du progrès", "Audit", "Synchronisation"],
      request: () => apiRequest<ApiEnvelope>(editingTask ? `/api/hr/onboarding/tasks/${encodeURIComponent(editingTask.taskKey)}` : `/api/hr/onboarding/journeys/${encodeURIComponent(selected.journeyKey)}/tasks`, {
        method: editingTask ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
      preferredKey: selected.journeyKey,
    });
    setEditingTask(null);
  }

  async function submitDocument(form: FormData): Promise<void> {
    if (!selected) return;
    const ownerKey = String(form.get("ownerKey") ?? "");
    const owner = workspace.owners.find((item) => item.key === ownerKey);
    const payload: JsonObject = {
      title: String(form.get("title") ?? ""),
      category: String(form.get("category") ?? "Général"),
      documentType: String(form.get("documentType") ?? "") || null,
      status: String(form.get("status") ?? "requested"),
      owner: owner?.fullName ?? null,
      ownerKey: ownerKey || null,
      required: form.get("required") === "on",
      dueDate: String(form.get("dueDate") ?? "") || null,
      expiresAt: String(form.get("expiresAt") ?? "") || null,
      rejectedReason: String(form.get("rejectedReason") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      idempotencyKey: crypto.randomUUID(),
    };
    if (editingDocument) payload.version = editingDocument.version;
    await runMutation({
      title: editingDocument ? "Document mis à jour" : "Demande documentaire créée",
      stageLabels: ["Validation", "Persistance", "Recalcul des gates", "Audit", "Synchronisation"],
      request: () => apiRequest<ApiEnvelope>(editingDocument ? `/api/hr/onboarding/documents/${encodeURIComponent(editingDocument.documentKey)}` : `/api/hr/onboarding/journeys/${encodeURIComponent(selected.journeyKey)}/documents`, {
        method: editingDocument ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }),
      preferredKey: selected.journeyKey,
    });
    setEditingDocument(null);
  }

  async function submitActivity(form: FormData): Promise<void> {
    if (!selected) return;
    const type = String(form.get("type") ?? "note");
    await runMutation({
      title: "Événement enregistré",
      stageLabels: ["Validation", "Écriture de la timeline", "Audit", "Synchronisation"],
      request: () => apiRequest<ApiEnvelope>(`/api/hr/onboarding/journeys/${encodeURIComponent(selected.journeyKey)}/activity`, {
        method: "POST",
        body: JSON.stringify({ type, title: String(form.get("title") ?? ""), body: String(form.get("body") ?? ""), status: "recorded" }),
      }),
      preferredKey: selected.journeyKey,
    });
  }

  async function journeyAction(action: string, payload: JsonObject = {}): Promise<void> {
    if (!selected) return;
    await runMutation({
      title: "Parcours synchronisé",
      stageLabels: ["Contrôle d’autorisation", "Vérification des gates", "Mutation transactionnelle", "Recalcul du progrès", "Audit", "Synchronisation"],
      request: () => apiRequest<ApiEnvelope>(`/api/hr/onboarding/journeys/${encodeURIComponent(selected.journeyKey)}/actions`, {
        method: "POST",
        body: JSON.stringify({ action, version: selected.version, ...payload }),
      }),
      preferredKey: selected.journeyKey,
    });
  }

  async function quickTaskStatus(task: OnboardingTask, status: string): Promise<void> {
    await runMutation({
      title: "Tâche synchronisée",
      stageLabels: ["Validation", "Mise à jour", "Recalcul du parcours", "Audit"],
      request: () => apiRequest<ApiEnvelope>(`/api/hr/onboarding/tasks/${encodeURIComponent(task.taskKey)}`, {
        method: "PATCH",
        body: JSON.stringify({ version: task.version, status }),
      }),
      preferredKey: selected?.journeyKey,
      closeOnSuccess: false,
    });
  }

  async function quickDocumentStatus(document: OnboardingDocument, status: string): Promise<void> {
    await runMutation({
      title: "Document synchronisé",
      stageLabels: ["Validation", "Mise à jour", "Recalcul des gates", "Audit"],
      request: () => apiRequest<ApiEnvelope>(`/api/hr/onboarding/documents/${encodeURIComponent(document.documentKey)}`, {
        method: "PATCH",
        body: JSON.stringify({ version: document.version, status }),
      }),
      preferredKey: selected?.journeyKey,
      closeOnSuccess: false,
    });
  }

  async function uploadFile(file: File): Promise<void> {
    if (!editingDocument) return;
    const form = new FormData();
    form.append("file", file);
    form.append("version", String(editingDocument.version));
    await runMutation({
      title: "Fichier téléversé",
      stageLabels: ["Validation du fichier", "Téléversement sécurisé", "Liaison au document", "Audit", "Synchronisation"],
      request: () => apiRequest<ApiEnvelope>(`/api/hr/onboarding/documents/${encodeURIComponent(editingDocument.documentKey)}/upload`, { method: "POST", body: form }),
      preferredKey: selected?.journeyKey,
    });
    setEditingDocument(null);
  }

  const empty = workspace.journeys.length === 0;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 border-r border-slate-200 bg-white xl:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-5">
            <div className="rounded-[24px] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-4 text-white shadow-xl shadow-indigo-950/10">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/12"><ClipboardCheck className="h-5 w-5" /></div>
                <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">AngelCare HR</p><h2 className="font-black">Onboarding OS</h2></div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-xs text-slate-200"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Source de vérité Supabase</div>
            </div>
            <nav className="mt-5 space-y-5">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = item.href === "/hr/onboarding";
                      return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition", active ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}><Icon className="h-4 w-4" />{item.label}</Link>;
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6 xl:p-8">
          <header className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.08)]">
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 px-6 py-6 text-white md:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-4 w-4" /> Commandement Onboarding & Activation</div>
                  <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Onboarding Production Command</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Parcours, tâches, documents, checklists, preuves et synchronisations RH dans une autorité unique — sans données fictives ni stockage navigateur.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black hover:bg-white/15"><RefreshCw className="h-4 w-4" /> Actualiser</button>
                  <Link href="/hr/onboarding/checklists" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black hover:bg-white/15"><ClipboardCheck className="h-4 w-4" /> Checklists</Link>
                  {workspace.capabilities.canManage && <button onClick={() => openModal("createJourney")} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-indigo-950 shadow-lg"><Plus className="h-4 w-4" /> Nouveau parcours</button>}
                </div>
              </div>
            </div>
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi label="Parcours actifs" value={activeCount} icon={Workflow} tone="violet" />
              <Kpi label="Risques élevés" value={atRisk} icon={AlertTriangle} tone="rose" />
              <Kpi label="Tâches bloquées" value={blockedTasks} icon={LockKeyhole} tone="amber" />
              <Kpi label="Documents incomplets" value={missingDocs} icon={FileBadge2} tone="cyan" />
            </div>
          </header>

          {workspace.diagnostics.warnings.length > 0 && (
            <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">Diagnostic de sources optionnelles</p><p className="mt-1 font-semibold">Certaines sources périphériques sont indisponibles. Les parcours canoniques restent opérationnels, mais les listes de candidats, collaborateurs ou owners peuvent être incomplètes.</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-semibold">{workspace.diagnostics.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div></div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Rechercher un collaborateur, poste, département, owner…" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" /></div>
            <div className="flex flex-wrap items-center gap-2"><Filter className="h-4 w-4 text-slate-400" />{["all", "active", "paused", "completed", "archived"].map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={cn("rounded-xl px-3 py-2 text-xs font-black", statusFilter === status ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{status === "all" ? "Tous" : STATUS_LABELS[status]}</button>)}</div>
          </div>

          {empty ? (
            <EmptyState canManage={workspace.capabilities.canManage} onCreate={() => openModal("createJourney")} />
          ) : (
            <div className="mt-5 grid gap-5 2xl:grid-cols-[340px_minmax(0,1fr)]">
              <section className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between px-3 py-2"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Portefeuille</p><h2 className="font-black">Parcours onboarding</h2></div><span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">{filteredJourneys.length}</span></div>
                <div className="mt-2 max-h-[760px] space-y-2 overflow-y-auto pr-1">
                  {filteredJourneys.map((journey) => <JourneyCard key={journey.journeyKey} journey={journey} active={journey.journeyKey === selected?.journeyKey} onSelect={() => { setSelectedKey(journey.journeyKey); setTab("Tâches"); }} />)}
                  {!filteredJourneys.length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">Aucun parcours ne correspond aux filtres.</div>}
                </div>
              </section>

              {selected && (
                <section className="min-w-0 space-y-5">
                  <JourneyHero journey={selected} tasks={tasks} documents={documents} canManage={workspace.capabilities.canManage} canOverride={workspace.capabilities.canOverride} onEdit={() => openModal("editJourney")} onAdvance={() => void journeyAction("advance")} onPause={() => void journeyAction(selected.status === "paused" ? "resume" : "pause", { reason: selected.status === "paused" ? "Reprise du parcours" : "Pause opérationnelle" })} onReassign={() => openModal("reassign")} onCancel={() => openModal("cancel")} onRestore={() => void journeyAction("restore", { reason: "Restauration contrôlée du parcours" })} onOverride={() => openModal("override")} onArchive={() => openModal("archive")} />

                  <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 pt-4 md:px-6">
                      <div className="flex gap-1 overflow-x-auto">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={cn("border-b-2 px-4 py-3 text-sm font-black whitespace-nowrap", tab === item ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-900")}>{item}</button>)}</div>
                    </div>
                    <div className="p-4 md:p-6">
                      {tab === "Tâches" && <TasksView tasks={tasks} canManage={workspace.capabilities.canManage} onCreate={() => { setEditingTask(null); openModal("task"); }} onEdit={(task) => { setEditingTask(task); openModal("task"); }} onStatus={(task, status) => void quickTaskStatus(task, status)} onArchive={(task) => { setEditingTask(task); openModal("taskArchive"); }} />}
                      {tab === "Documents" && <DocumentsView documents={documents} canManage={workspace.capabilities.canManageDocuments} onCreate={() => { setEditingDocument(null); openModal("document"); }} onEdit={(document) => { setEditingDocument(document); openModal("document"); }} onUpload={(document) => { setEditingDocument(document); openModal("upload"); }} onStatus={(document, status) => void quickDocumentStatus(document, status)} onArchive={(document) => { setEditingDocument(document); openModal("documentArchive"); }} />}
                      {tab === "Timeline" && <TimelineView activity={activity} onAdd={() => openModal("note")} />}
                      {tab === "Checklist" && <ChecklistView journey={selected} tasks={tasks} documents={documents} checklists={workspace.checklists} canManage={workspace.capabilities.canManage} onAssign={(checklist) => void journeyAction("assign_checklist", { checklistKey: checklist.checklistKey })} />}
                      {tab === "Notes" && <NotesView notes={notes} canManage={workspace.capabilities.canManage} onAdd={() => openModal("note")} />}
                      {tab === "Activité" && <ActivityView activity={activity} />}
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-3">
                    <SummaryCard title="Exécution" icon={Zap} rows={[["Tâches", `${completedTasks}/${tasks.length}`], ["Documents", `${validatedDocuments}/${documents.length}`], ["Progression", `${selected.progress}%`]]} />
                    <SummaryCard title="Gouvernance" icon={ShieldCheck} rows={[["Owner", selected.owner || "Non affecté"], ["Manager", selected.manager || "Non affecté"], ["Version", `v${selected.version}`]]} />
                    <SummaryCard title="Identité" icon={UserCheck} rows={[["Email", selected.email || "Non renseigné"], ["Téléphone", selected.phone || "Non renseigné"], ["Démarrage", formatDate(selected.startDate)]]} />
                  </div>
                </section>
              )}
            </div>
          )}

          <footer className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-semibold text-slate-500 md:flex-row md:items-center md:justify-between"><span>{toast}</span><span>Schéma: {workspace.diagnostics.schemaVersion} · Scope {workspace.diagnostics.scopeResolved ? "résolu" : "non résolu"} · Alertes {workspace.diagnostics.warnings.length} · {new Date(workspace.loadedAt).toLocaleTimeString("fr-MA")}</span></footer>
        </main>
      </div>

      {modal && <ModalShell title={modalTitle(modal, editingTask, editingDocument)} onClose={() => { if (!busy) { setModal(null); setError(null); setEditingTask(null); setEditingDocument(null); } }} busy={busy}>
        {stages.length > 0 && busy ? <ProgressPanel stages={stages} error={error} /> : null}
        {error && !busy ? <ErrorPanel message={error} /> : null}
        {!busy && modal === "createJourney" && <JourneyForm workspace={workspace} onSubmit={(form: FormData) => void submitJourney(form, false)} />}
        {!busy && modal === "editJourney" && selected && <JourneyForm workspace={workspace} journey={selected} onSubmit={(form: FormData) => void submitJourney(form, true)} />}
        {!busy && modal === "task" && selected && <TaskForm task={editingTask} journey={selected} owners={workspace.owners} onSubmit={(form: FormData) => void submitTask(form)} />}
        {!busy && modal === "document" && selected && <DocumentForm document={editingDocument} owners={workspace.owners} onSubmit={(form: FormData) => void submitDocument(form)} />}
        {!busy && modal === "note" && <ActivityForm onSubmit={(form: FormData) => void submitActivity(form)} />}
        {!busy && modal === "reassign" && selected && <ReassignForm owners={workspace.owners} journey={selected} onSubmit={(form: FormData) => { const nextOwnerKey = String(form.get("ownerKey") ?? ""); const nextManagerKey = String(form.get("managerKey") ?? ""); const nextOwner = workspace.owners.find((item) => item.key === nextOwnerKey); const nextManager = workspace.owners.find((item) => item.key === nextManagerKey); void journeyAction("reassign", { owner: nextOwner?.fullName ?? null, ownerKey: nextOwnerKey || null, manager: nextManager?.fullName ?? null, managerKey: nextManagerKey || null }); }} />}
        {!busy && modal === "archive" && selected && <ReasonForm label="Archiver ce parcours" warning="Le parcours disparaîtra des vues actives, mais son historique, ses tâches, documents et preuves seront conservés." onSubmit={(form: FormData) => void runMutation({ title: "Parcours archivé", stageLabels: ["Autorisation", "Contrôle de version", "Archivage", "Audit", "Synchronisation"], request: () => apiRequest<ApiEnvelope>(`/api/hr/onboarding/journeys/${encodeURIComponent(selected.journeyKey)}`, { method: "DELETE", body: JSON.stringify({ version: selected.version, reason: String(form.get("reason") ?? "") }) }) })} />}
        {!busy && modal === "cancel" && selected && <ReasonForm label="Annuler le parcours" warning="L’annulation préserve toute la traçabilité et bloque l’avancement opérationnel." onSubmit={(form: FormData) => void journeyAction("cancel", { reason: String(form.get("reason") ?? "") })} />}
        {!busy && modal === "override" && selected && <OverrideForm journey={selected} onSubmit={(form: FormData) => void journeyAction("override_progress", { reason: String(form.get("reason") ?? ""), progress: Number(form.get("progress")), force: true })} />}
        {!busy && modal === "upload" && editingDocument && <UploadForm document={editingDocument} inputRef={fileInputRef} onSubmit={(file) => void uploadFile(file)} />}
        {!busy && modal === "taskArchive" && editingTask && <ReasonForm label="Archiver la tâche" warning="La tâche sera retirée du tableau actif, sans suppression de son historique." onSubmit={(form: FormData) => void runMutation({ title: "Tâche archivée", stageLabels: ["Autorisation", "Archivage", "Recalcul du progrès", "Audit"], request: () => apiRequest<ApiEnvelope>(`/api/hr/onboarding/tasks/${encodeURIComponent(editingTask.taskKey)}`, { method: "DELETE", body: JSON.stringify({ version: editingTask.version, reason: String(form.get("reason") ?? "") }) }), preferredKey: selected?.journeyKey })} />}
        {!busy && modal === "documentArchive" && editingDocument && <ReasonForm label="Archiver le document" warning="Le document est conservé dans l’historique et retiré des exigences actives." onSubmit={(form: FormData) => void runMutation({ title: "Document archivé", stageLabels: ["Autorisation", "Archivage", "Recalcul des gates", "Audit"], request: () => apiRequest<ApiEnvelope>(`/api/hr/onboarding/documents/${encodeURIComponent(editingDocument.documentKey)}`, { method: "DELETE", body: JSON.stringify({ version: editingDocument.version, reason: String(form.get("reason") ?? "") }) }), preferredKey: selected?.journeyKey })} />}
      </ModalShell>}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Workflow; tone: "violet" | "rose" | "amber" | "cyan" }) {
  const tones = { violet: "text-violet-700 bg-violet-50", rose: "text-rose-700 bg-rose-50", amber: "text-amber-700 bg-amber-50", cyan: "text-cyan-700 bg-cyan-50" };
  return <div className="flex items-center gap-4 bg-white px-6 py-4"><div className={cn("grid h-11 w-11 place-items-center rounded-2xl", tones[tone])}><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-black">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div></div>;
}

function EmptyState({ canManage, onCreate }: { canManage: boolean; onCreate: () => void }) {
  return <div className="mt-5 rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-violet-50 text-violet-700"><ClipboardCheck className="h-8 w-8" /></div><h2 className="mt-5 text-xl font-black">Aucun parcours onboarding enregistré</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">La base ne contient aucun parcours actif. Aucun collaborateur, document, événement ou tâche fictive n’est injecté dans l’interface.</p>{canManage && <button onClick={onCreate} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" /> Créer le premier parcours</button>}</div>;
}

function JourneyCard({ journey, active, onSelect }: { journey: OnboardingJourney; active: boolean; onSelect: () => void }) {
  return <button onClick={onSelect} className={cn("w-full rounded-[22px] border p-4 text-left transition", active ? "border-violet-200 bg-gradient-to-br from-violet-50 to-cyan-50 shadow-sm" : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white")}><div className="flex gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xs font-black text-white">{initials(journey.title)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="truncate font-black">{journey.title}</h3><p className="truncate text-xs font-semibold text-slate-500">{journey.position || "Poste non renseigné"}</p></div><ChevronRight className={cn("h-4 w-4 shrink-0", active ? "text-violet-600" : "text-slate-300")} /></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className={cn("rounded-lg border px-2 py-1 text-[10px] font-black", statusTone(journey.status))}>{STATUS_LABELS[journey.status] || journey.status}</span><span className="text-[10px] font-bold text-slate-400">{PHASE_LABELS[journey.phase]}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{ width: `${journey.progress}%` }} /></div></div></div></button>;
}

function JourneyHero({ journey, tasks, documents, canManage, canOverride, onEdit, onAdvance, onPause, onReassign, onCancel, onRestore, onOverride, onArchive }: { journey: OnboardingJourney; tasks: OnboardingTask[]; documents: OnboardingDocument[]; canManage: boolean; canOverride: boolean; onEdit: () => void; onAdvance: () => void; onPause: () => void; onReassign: () => void; onCancel: () => void; onRestore: () => void; onOverride: () => void; onArchive: () => void }) {
  const requiredTasks = tasks.filter((item) => item.required);
  const requiredDocs = documents.filter((item) => item.required);
  const taskCompletion = requiredTasks.length ? Math.round(requiredTasks.filter((item) => ["completed", "waived"].includes(item.status)).length / requiredTasks.length * 100) : 100;
  const docCompletion = requiredDocs.length ? Math.round(requiredDocs.filter((item) => ["validated", "waived"].includes(item.status)).length / requiredDocs.length * 100) : 100;
  return <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"><div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white md:p-8"><div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between"><div className="flex gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border border-white/10 bg-white/10 text-lg font-black">{initials(journey.title)}</div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-black">{journey.title}</h2><span className={cn("rounded-xl border px-2.5 py-1 text-[10px] font-black", statusTone(journey.status))}>{STATUS_LABELS[journey.status] || journey.status}</span></div><p className="mt-1 font-semibold text-slate-300">{journey.position || "Poste non renseigné"} · {journey.department || "Département non renseigné"}</p><div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-300"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {journey.location || "Lieu non renseigné"}</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(journey.startDate)}</span><span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {journey.employmentType || "Contrat non renseigné"}</span></div></div></div>{canManage && <div className="flex flex-wrap gap-2"><button onClick={onEdit} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black hover:bg-white/15"><Edit3 className="h-4 w-4" /> Modifier</button>{journey.status === "archived" ? <button onClick={onRestore} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white"><RotateCcw className="h-4 w-4" /> Restaurer</button> : <button onClick={onPause} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black hover:bg-white/15"><PauseCircle className="h-4 w-4" /> {journey.status === "paused" ? "Reprendre" : "Pause"}</button>}<button onClick={onReassign} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black hover:bg-white/15"><UserCheck className="h-4 w-4" /> Réaffecter</button><button onClick={onCancel} disabled={["archived", "cancelled", "completed"].includes(journey.status)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/15 px-4 py-2.5 text-sm font-black hover:bg-rose-500/25 disabled:opacity-40"><X className="h-4 w-4" /> Annuler</button>{canOverride && <button onClick={onOverride} className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-500/15 px-4 py-2.5 text-sm font-black hover:bg-amber-500/25"><Gauge className="h-4 w-4" /> Override</button>}<button onClick={onAdvance} disabled={["archived", "cancelled", "completed"].includes(journey.status)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-indigo-950 disabled:cursor-not-allowed disabled:opacity-50"><ArrowRight className="h-4 w-4" /> Avancer la phase</button><button onClick={onArchive} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 hover:bg-rose-500/25" title="Archiver"><Archive className="h-4 w-4" /></button></div>}</div><div className="mt-7 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]"><ProgressBlock label="Progression consolidée" value={journey.progress} /><ProgressBlock label="Tâches obligatoires" value={taskCompletion} /><ProgressBlock label="Documents requis" value={docCompletion} /></div></div><div className="grid gap-px bg-slate-200 md:grid-cols-4"><HeroMeta label="Phase" value={PHASE_LABELS[journey.phase]} /><HeroMeta label="Owner" value={journey.owner || "Non affecté"} /><HeroMeta label="Manager" value={journey.manager || "Non affecté"} /><HeroMeta label="Risque" value={journey.riskLevel} /></div></div>;
}

function ProgressBlock({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-white/10 bg-white/8 p-4"><div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.1em] text-slate-300"><span>{label}</span><span>{value}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300" style={{ width: `${value}%` }} /></div></div>; }
function HeroMeta({ label, value }: { label: string; value: string }) { return <div className="bg-white px-5 py-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-black text-slate-800">{value}</p></div>; }

function TasksView({ tasks, canManage, onCreate, onEdit, onStatus, onArchive }: { tasks: OnboardingTask[]; canManage: boolean; onCreate: () => void; onEdit: (task: OnboardingTask) => void; onStatus: (task: OnboardingTask, status: string) => void; onArchive: (task: OnboardingTask) => void }) {
  const groups = Array.from(new Set(tasks.map((item) => item.groupName)));
  return <div><SectionHeader eyebrow="Exécution persistée" title="Tâches onboarding" action={canManage ? <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Ajouter</button> : null} />{!tasks.length ? <MiniEmpty icon={ClipboardCheck} title="Aucune tâche" text="Aucune tâche n’est générée en mémoire. Affectez une checklist ou créez une tâche persistée." /> : <div className="mt-5 space-y-5">{groups.map((group) => <div key={group}><div className="mb-2 flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-violet-500" /><h4 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{group}</h4></div><div className="space-y-2">{tasks.filter((item) => item.groupName === group).sort((a, b) => a.sortOrder - b.sortOrder).map((task) => <div key={task.taskKey} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center"><button disabled={!canManage} onClick={() => onStatus(task, task.status === "completed" ? "in_progress" : "completed")} className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl border", task.status === "completed" ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-white text-slate-400")}>{task.status === "completed" ? <Check className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h5 className="font-black">{task.title}</h5>{task.required && <span className="rounded-lg bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-600">OBLIGATOIRE</span>}<span className={cn("rounded-lg border px-2 py-1 text-[9px] font-black", statusTone(task.status))}>{STATUS_LABELS[task.status] || task.status}</span></div><div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold text-slate-500"><span>{PHASE_LABELS[task.phase]}</span><span>{task.owner || "Owner non affecté"}</span><span>{task.dueAt ? formatDate(task.dueAt) : "Sans échéance"}</span>{task.blockerReason && <span className="text-rose-600">Blocage: {task.blockerReason}</span>}</div></div>{canManage && <div className="flex gap-1"><button onClick={() => onEdit(task)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-950"><Edit3 className="h-4 w-4" /></button>{task.status !== "blocked" && <button onClick={() => onStatus(task, "blocked")} className="grid h-9 w-9 place-items-center rounded-xl text-amber-600 hover:bg-amber-50" title="Bloquer"><LockKeyhole className="h-4 w-4" /></button>}<button onClick={() => onArchive(task)} className="grid h-9 w-9 place-items-center rounded-xl text-rose-500 hover:bg-rose-50"><Archive className="h-4 w-4" /></button></div>}</div>)}</div></div>)}</div>}</div>;
}

function DocumentsView({ documents, canManage, onCreate, onEdit, onUpload, onStatus, onArchive }: { documents: OnboardingDocument[]; canManage: boolean; onCreate: () => void; onEdit: (document: OnboardingDocument) => void; onUpload: (document: OnboardingDocument) => void; onStatus: (document: OnboardingDocument, status: string) => void; onArchive: (document: OnboardingDocument) => void }) {
  return <div><SectionHeader eyebrow="Dossier documentaire" title="Documents onboarding" action={canManage ? <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Demander</button> : null} />{!documents.length ? <MiniEmpty icon={FileBadge2} title="Aucun document demandé" text="Ajoutez une demande documentaire réelle ou affectez une checklist publiée." /> : <div className="mt-5 grid gap-3 xl:grid-cols-2">{documents.map((document) => <div key={document.documentKey} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm"><FileText className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-black">{document.title}</h4>{document.required && <span className="rounded-lg bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-600">REQUIS</span>}</div><p className="mt-1 text-xs font-semibold text-slate-500">{document.category} · {document.owner || "Owner non affecté"}</p><div className="mt-3 flex flex-wrap items-center gap-2"><span className={cn("rounded-lg border px-2 py-1 text-[10px] font-black", statusTone(document.status))}>{STATUS_LABELS[document.status] || document.status}</span>{document.fileSize !== null && <span className="text-[10px] font-bold text-slate-400">{Math.round(document.fileSize / 1024)} Ko</span>}{document.verifiedAt && <span className="text-[10px] font-bold text-emerald-600">Vérifié {formatDate(document.verifiedAt)}</span>}</div></div></div>{canManage && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onEdit(document)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black"><Edit3 className="h-3.5 w-3.5" /> Modifier</button><button onClick={() => onUpload(document)} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700"><Upload className="h-3.5 w-3.5" /> Téléverser</button>{document.storagePath && <a href={`/api/hr/onboarding/documents/${encodeURIComponent(document.documentKey)}/download`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black"><Download className="h-3.5 w-3.5" /> Télécharger</a>}{document.status === "uploaded" && <button onClick={() => onStatus(document, "validated")} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"><BadgeCheck className="h-3.5 w-3.5" /> Valider</button>}<button onClick={() => onArchive(document)} className="grid h-9 w-9 place-items-center rounded-xl text-rose-500 hover:bg-rose-50"><Archive className="h-4 w-4" /></button></div>}</div>)}</div>}</div>;
}

function TimelineView({ activity, onAdd }: { activity: OnboardingActivity[]; onAdd?: () => void }) { return <div><SectionHeader eyebrow="Traçabilité immuable" title="Timeline du parcours" action={onAdd ? <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-black text-white"><Plus className="h-4 w-4" /> Ajouter une preuve</button> : null} />{!activity.length ? <MiniEmpty icon={Activity} title="Aucune activité" text="La timeline affichera uniquement les opérations et notes réellement persistées." /> : <div className="mt-5 space-y-0">{activity.map((event, index) => <div key={event.activityKey} className="relative flex gap-4 pb-6"><div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-700"><Activity className="h-4 w-4" /></div>{index < activity.length - 1 && <div className="absolute bottom-0 left-5 top-10 w-px bg-slate-200" />}<div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-black">{event.title}</h4><p className="mt-1 text-sm text-slate-600">{event.body || "Aucun détail complémentaire."}</p></div><span className="text-[10px] font-bold text-slate-400">{formatTime(event.createdAt)}</span></div><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-500"><span className="rounded-lg bg-white px-2 py-1">{event.type}</span><span className="rounded-lg bg-white px-2 py-1">{event.actorName || "Système"}</span></div></div></div>)}</div>}</div>; }

function ChecklistView({ journey, tasks, documents, checklists, canManage, onAssign }: { journey: OnboardingJourney; tasks: OnboardingTask[]; documents: OnboardingDocument[]; checklists: OnboardingChecklist[]; canManage: boolean; onAssign: (checklist: OnboardingChecklist) => void }) {
  const assigned = checklists.find((item) => item.checklistKey === journey.checklistAssignmentKey) ?? null;
  return <div><SectionHeader eyebrow="Matrice de gates" title="Checklist affectée" action={<Link href="/hr/onboarding/checklists" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black"><ClipboardCheck className="h-4 w-4" /> Bibliothèque</Link>} />{assigned ? <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/60 p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-violet-500">Version figée</p><h4 className="mt-1 text-lg font-black">{assigned.name} · v{assigned.version}</h4><p className="mt-1 text-sm text-slate-600">{assigned.items.length} exigences · {tasks.length} tâches · {documents.length} documents instanciés.</p></div><span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Affectation active</span></div></div> : <MiniEmpty icon={ClipboardCheck} title="Aucune checklist affectée" text="Affectez une checklist publiée pour instancier les exigences persistées de ce parcours." />}{canManage && <div className="mt-5 grid gap-3 md:grid-cols-2">{checklists.filter((item) => item.isPublished && item.status === "published").map((checklist) => <button key={checklist.checklistKey} disabled={checklist.checklistKey === assigned?.checklistKey} onClick={() => onAssign(checklist)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"><div className="flex items-center justify-between"><h4 className="font-black">{checklist.name}</h4><span className="text-xs font-black text-violet-600">v{checklist.version}</span></div><p className="mt-1 text-xs font-semibold text-slate-500">{checklist.items.length} étapes · {checklist.roleKey || "tous rôles"}</p></button>)}</div>}</div>;
}

function NotesView({ notes, canManage, onAdd }: { notes: OnboardingActivity[]; canManage: boolean; onAdd: () => void }) { return <div><SectionHeader eyebrow="Notes persistées" title="Instructions, risques & décisions" action={canManage ? <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-black text-white"><MessageSquareText className="h-4 w-4" /> Ajouter</button> : null} />{!notes.length ? <MiniEmpty icon={MessageSquareText} title="Aucune note" text="Les notes et décisions apparaissent ici uniquement après persistance serveur." /> : <div className="mt-5 grid gap-3 md:grid-cols-2">{notes.map((note) => <div key={note.activityKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><h4 className="font-black">{note.title}</h4><span className="text-[10px] font-bold text-slate-400">{formatDate(note.createdAt)}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{note.body || "—"}</p><p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-violet-600">{note.type} · {note.actorName || "Système"}</p></div>)}</div>}</div>; }
function ActivityView({ activity }: { activity: OnboardingActivity[] }) { return <TimelineView activity={activity} />; }

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-500">{eyebrow}</p><h3 className="mt-1 text-lg font-black">{title}</h3></div>{action}</div>; }
function MiniEmpty({ icon: Icon, title, text }: { icon: typeof ClipboardCheck; title: string; text: string }) { return <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm"><Icon className="h-5 w-5" /></div><h4 className="mt-4 font-black">{title}</h4><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{text}</p></div>; }
function SummaryCard({ title, icon: Icon, rows }: { title: string; icon: typeof Zap; rows: string[][] }) { return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Icon className="h-4 w-4" /></div><h3 className="font-black">{title}</h3></div><div className="mt-4 space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-500">{label}</span><span className="truncate font-black text-slate-800">{value}</span></div>)}</div></div>; }

function ModalShell({ title, onClose, busy, children }: { title: string; onClose: () => void; busy: boolean; children: React.ReactNode }) { return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm"><div className="max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/40 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 px-6 py-5 text-white"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Onboarding Production Command</p><h2 className="mt-1 text-xl font-black">{title}</h2></div><button disabled={busy} onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10 disabled:opacity-40"><X className="h-5 w-5" /></button></div><div className="max-h-[calc(94vh-88px)] overflow-y-auto p-6">{children}</div></div></div>; }
function ProgressPanel({ stages, error }: { stages: MutationStage[]; error: string | null }) { return <div className="space-y-3"><div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><div className="flex items-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin text-violet-700" /><div><h3 className="font-black">Exécution transactionnelle</h3><p className="text-xs font-semibold text-slate-500">Ne fermez pas cette fenêtre avant la confirmation serveur.</p></div></div></div>{stages.map((stage, index) => <div key={`${stage.label}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"><div className={cn("grid h-8 w-8 place-items-center rounded-xl", stage.state === "done" ? "bg-emerald-100 text-emerald-700" : stage.state === "failed" ? "bg-rose-100 text-rose-700" : stage.state === "running" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-400")}>{stage.state === "done" ? <Check className="h-4 w-4" /> : stage.state === "failed" ? <X className="h-4 w-4" /> : stage.state === "running" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <span className="text-xs font-black">{index + 1}</span>}</div><span className="text-sm font-black">{stage.label}</span></div>)}{error && <ErrorPanel message={error} />}</div>; }
function ErrorPanel({ message }: { message: string }) { return <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{message}</span></div></div>; }

function BaseForm({ onSubmit, children, submitLabel = "Enregistrer" }: { onSubmit: (form: FormData) => void; children: React.ReactNode; submitLabel?: string }) { return <form action={(form: FormData) => onSubmit(form)} className="space-y-5">{children}<div className="flex justify-end border-t border-slate-200 pt-5"><button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><CheckCircle2 className="h-4 w-4" /> {submitLabel}</button></div></form>; }
function Field({ label, name, defaultValue, type = "text", required = false, placeholder, children }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; placeholder?: string; children?: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-600">{label}{required && <span className="text-rose-500"> *</span>}</span>{children ?? <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />}</label>; }
function SelectField({ label, name, defaultValue, options, required = false }: { label: string; name: string; defaultValue?: string | null; options: Array<{ value: string; label: string }>; required?: boolean }) { return <Field label={label} name={name} required={required}><select name={name} required={required} defaultValue={defaultValue ?? ""} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"><option value="">Sélectionner</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>; }
function TextAreaField({ label, name, defaultValue, required = false, placeholder }: { label: string; name: string; defaultValue?: string | null; required?: boolean; placeholder?: string }) { return <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-600">{label}{required && <span className="text-rose-500"> *</span>}</span><textarea name={name} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" /></label>; }

function JourneyForm({ workspace, journey, onSubmit }: { workspace: OnboardingWorkspace; journey?: OnboardingJourney; onSubmit: (form: FormData) => void }) { const people = [...workspace.candidates, ...workspace.staff]; return <BaseForm onSubmit={onSubmit} submitLabel={journey ? "Mettre à jour" : "Créer le bundle onboarding"}><div className="grid gap-4 md:grid-cols-2">{!journey && <SelectField label="Candidat ou collaborateur existant" name="personKey" options={people.map((person) => ({ value: person.key, label: `${person.fullName} · ${person.kind === "candidate" ? "Candidat" : "Collaborateur"}` }))} />}<Field label="Nom complet" name="title" defaultValue={journey?.title} required /><Field label="Poste" name="position" defaultValue={journey?.position} /><Field label="Département" name="department" defaultValue={journey?.department} /><Field label="Date de démarrage" name="startDate" type="date" defaultValue={journey?.startDate} /><SelectField label="Manager" name="managerKey" defaultValue={journey?.managerKey} options={workspace.owners.map((owner) => ({ value: owner.key, label: owner.fullName }))} /><Field label="Lieu" name="location" defaultValue={journey?.location} /><Field label="Type d’emploi" name="employmentType" defaultValue={journey?.employmentType} /><Field label="Email" name="email" type="email" defaultValue={journey?.email} /><Field label="Téléphone" name="phone" defaultValue={journey?.phone} /><SelectField label="Owner RH" name="ownerKey" defaultValue={journey?.ownerKey} options={workspace.owners.map((owner) => ({ value: owner.key, label: owner.fullName }))} /><SelectField label="Priorité" name="priority" defaultValue={journey?.priority ?? "normal"} options={["low", "normal", "high", "critical"].map((value) => ({ value, label: value }))} /><SelectField label="Niveau de risque" name="riskLevel" defaultValue={journey?.riskLevel ?? "normal"} options={["low", "normal", "high", "critical"].map((value) => ({ value, label: value }))} />{!journey && <SelectField label="Checklist publiée" name="checklistKey" options={workspace.checklists.filter((item) => item.isPublished).map((item) => ({ value: item.checklistKey, label: `${item.name} · v${item.version}` }))} />}</div><TextAreaField label="Risques / vigilance" name="riskNotes" defaultValue={journey?.riskNotes} /><TextAreaField label="Notes initiales" name="notes" /></BaseForm>; }

function TaskForm({ task, journey, owners, onSubmit }: { task: OnboardingTask | null; journey: OnboardingJourney; owners: OnboardingWorkspace["owners"]; onSubmit: (form: FormData) => void }) { return <BaseForm onSubmit={onSubmit} submitLabel={task ? "Mettre à jour" : "Créer la tâche"}><div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-bold text-violet-800">Parcours: {journey.title}</div><div className="grid gap-4 md:grid-cols-2"><Field label="Titre" name="title" defaultValue={task?.title} required /><Field label="Groupe" name="groupName" defaultValue={task?.groupName ?? "Général"} required /><SelectField label="Phase" name="phase" defaultValue={task?.phase ?? journey.phase} options={ONBOARDING_PHASES.map((value) => ({ value, label: PHASE_LABELS[value] }))} /><SelectField label="Statut" name="status" defaultValue={task?.status ?? "pending"} options={["pending", "in_progress", "completed", "blocked", "waived"].map((value) => ({ value, label: STATUS_LABELS[value] }))} /><SelectField label="Owner" name="ownerKey" defaultValue={task?.ownerKey} options={owners.map((owner) => ({ value: owner.key, label: owner.fullName }))} /><SelectField label="Priorité" name="priority" defaultValue={task?.priority ?? "normal"} options={["low", "normal", "high", "critical"].map((value) => ({ value, label: value }))} /><Field label="Échéance" name="dueAt" type="datetime-local" defaultValue={task?.dueAt ? task.dueAt.slice(0, 16) : ""} /></div><label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black"><input type="checkbox" name="required" defaultChecked={task?.required ?? true} className="h-4 w-4" /> Tâche obligatoire pour le passage de gate</label><TextAreaField label="Notes / blocage / preuve" name="notes" defaultValue={task?.notes} /></BaseForm>; }

function DocumentForm({ document, owners, onSubmit }: { document: OnboardingDocument | null; owners: OnboardingWorkspace["owners"]; onSubmit: (form: FormData) => void }) { return <BaseForm onSubmit={onSubmit} submitLabel={document ? "Mettre à jour" : "Créer la demande"}><div className="grid gap-4 md:grid-cols-2"><Field label="Titre" name="title" defaultValue={document?.title} required /><Field label="Catégorie" name="category" defaultValue={document?.category ?? "Administratif"} required /><Field label="Type documentaire" name="documentType" defaultValue={document?.documentType} /><SelectField label="Statut" name="status" defaultValue={document?.status ?? "requested"} options={["required", "requested", "uploaded", "validated", "rejected", "waived"].map((value) => ({ value, label: STATUS_LABELS[value] }))} /><SelectField label="Owner" name="ownerKey" defaultValue={document?.ownerKey} options={owners.map((owner) => ({ value: owner.key, label: owner.fullName }))} /><Field label="Échéance" name="dueDate" type="date" defaultValue={document?.dueDate} /><Field label="Expiration" name="expiresAt" type="datetime-local" defaultValue={document?.expiresAt ? document.expiresAt.slice(0, 16) : ""} /></div><label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black"><input type="checkbox" name="required" defaultChecked={document?.required ?? true} className="h-4 w-4" /> Document obligatoire pour le passage de gate</label><TextAreaField label="Motif de rejet" name="rejectedReason" defaultValue={document?.rejectedReason} /><TextAreaField label="Notes" name="notes" defaultValue={document?.notes} /></BaseForm>; }

function ActivityForm({ onSubmit }: { onSubmit: (form: FormData) => void }) { return <BaseForm onSubmit={onSubmit} submitLabel="Ajouter à la timeline"><SelectField label="Type d’événement" name="type" defaultValue="note" options={[{ value: "note", label: "Note interne" }, { value: "manager_instruction", label: "Instruction manager" }, { value: "decision", label: "Décision" }, { value: "escalation", label: "Escalade" }, { value: "risk", label: "Risque" }, { value: "evidence", label: "Preuve" }]} /><Field label="Titre" name="title" required /><TextAreaField label="Détail" name="body" required /></BaseForm>; }
function ReassignForm({ owners, journey, onSubmit }: { owners: OnboardingWorkspace["owners"]; journey: OnboardingJourney; onSubmit: (form: FormData) => void }) { return <BaseForm onSubmit={onSubmit} submitLabel="Réaffecter"><SelectField label="Owner RH" name="ownerKey" defaultValue={journey.ownerKey} options={owners.map((owner) => ({ value: owner.key, label: owner.fullName }))} /><SelectField label="Manager" name="managerKey" defaultValue={journey.managerKey} options={owners.map((owner) => ({ value: owner.key, label: owner.fullName }))} /></BaseForm>; }
function ReasonForm({ label, warning, onSubmit }: { label: string; warning: string; onSubmit: (form: FormData) => void }) { return <BaseForm onSubmit={onSubmit} submitLabel={label}><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4" />{warning}</div><TextAreaField label="Motif obligatoire" name="reason" required /></BaseForm>; }
function OverrideForm({ journey, onSubmit }: { journey: OnboardingJourney; onSubmit: (form: FormData) => void }) { return <BaseForm onSubmit={onSubmit} submitLabel="Appliquer l’override"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">Override réservé aux administrateurs HR. Toute modification est auditée.</div><Field label="Progression" name="progress" type="number" defaultValue={journey.progress} required /><TextAreaField label="Justification obligatoire" name="reason" required /></BaseForm>; }
function UploadForm({ document, inputRef, onSubmit }: { document: OnboardingDocument; inputRef: React.RefObject<HTMLInputElement | null>; onSubmit: (file: File) => void }) { const [file, setFile] = useState<File | null>(null); return <div className="space-y-5"><div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><h3 className="font-black">{document.title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">PDF, JPG, PNG, WEBP ou DOCX · 20 Mo maximum</p></div><input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold" />{file && <div className="rounded-2xl border border-slate-200 p-4 text-sm"><p className="font-black">{file.name}</p><p className="text-slate-500">{Math.round(file.size / 1024)} Ko · {file.type}</p></div>}<div className="flex justify-end"><button disabled={!file} onClick={() => file && onSubmit(file)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-40"><Upload className="h-4 w-4" /> Téléverser</button></div></div>; }

function modalTitle(modal: ModalKind, task: OnboardingTask | null, document: OnboardingDocument | null): string {
  const labels: Record<Exclude<ModalKind, null>, string> = {
    createJourney: "Créer un parcours onboarding",
    editJourney: "Modifier le parcours",
    task: task ? "Modifier la tâche" : "Créer une tâche",
    document: document ? "Modifier le document" : "Créer une demande documentaire",
    note: "Ajouter à la timeline",
    reassign: "Réaffecter le parcours",
    archive: "Archiver le parcours",
    cancel: "Annuler le parcours",
    override: "Override de progression",
    upload: "Téléverser un document",
    taskArchive: "Archiver la tâche",
    documentArchive: "Archiver le document",
  };
  return modal ? labels[modal] : "Onboarding";
}
