"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  FolderOpen,
  ShieldCheck,
  Video,
  Building2,
  Check,
  Trash2,
  Database,
  FileJson,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types";
import {
  AmbassadorCandidateIntakeModal,
  candidateReadiness,
  defaultCandidate,
  type CockpitModalFeedback,
} from "../modals/AmbassadorCockpitActionModals";

type AnyRecord = Record<string, any>;

type RecruitmentProps = {
  snapshot: AmbassadorWorkspaceSnapshot;
  kpis: Record<string, number>;
  loading: boolean;
  refreshing: boolean;
  error?: string | null;
  success?: string | null;
  query?: string;
  onRefresh: () => void;
  onNewCandidate?: () => void;
  onExport: () => void;
};

type StageKey = "new" | "contacted" | "prequalified" | "interview" | "validated" | "onboarding" | "rejected";

const candidateRegions: Record<string, string> = {
  Rabat: "Rabat-Salé-Kénitra",
  Salé: "Rabat-Salé-Kénitra",
  Témara: "Rabat-Salé-Kénitra",
  Casablanca: "Casablanca-Settat",
  Kénitra: "Rabat-Salé-Kénitra",
  Tanger: "Tanger-Tétouan-Al Hoceima",
  Fès: "Fès-Meknès",
  Marrakech: "Marrakech-Safi",
  Agadir: "Souss-Massa",
};

type RecruitmentCandidateForm = typeof defaultCandidate & {
  region: string;
  approx_address: string;
  source_campaign: string;
  local_network: string;
  whatsapp_crm_capability: string;
  accepted_zones: string;
  compatibility_city: string;
  compatibility_profile: string;
  compatibility_availability: string;
  schedule_interview: string;
  documents_to_request: string;
  validation_checklist: string;
  risk_notes: string;
  profile_notes: string;
};

const recruitmentCandidateDefaults: RecruitmentCandidateForm = {
  ...defaultCandidate,
  region: candidateRegions[defaultCandidate.city] ?? "",
  approx_address: "",
  source_campaign: defaultCandidate.campaign,
  local_network: "",
  whatsapp_crm_capability: "",
  accepted_zones: defaultCandidate.zone,
  compatibility_city: "À évaluer",
  compatibility_profile: "À évaluer",
  compatibility_availability: "À évaluer",
  schedule_interview: "Non planifié",
  documents_to_request: "",
  validation_checklist: defaultCandidate.quality_checklist,
  risk_notes: "",
  profile_notes: "",
};

type Notice = {
  type: "success" | "error" | "info";
  message: string;
} | null;

const pipelineStages: Array<{
  key: Exclude<StageKey, "rejected">;
  label: string;
  description: string;
  accent: string;
  panel: string;
  badge: string;
}> = [
  {
    key: "new",
    label: "Nouveau",
    description: "À qualifier rapidement",
    accent: "bg-blue-500",
    panel: "border-blue-100 bg-blue-50/55",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    key: "contacted",
    label: "Contacté",
    description: "Premier contact réalisé",
    accent: "bg-sky-500",
    panel: "border-sky-100 bg-sky-50/55",
    badge: "bg-sky-100 text-sky-700",
  },
  {
    key: "prequalified",
    label: "Préqualification",
    description: "Score et disponibilité",
    accent: "bg-amber-500",
    panel: "border-amber-100 bg-amber-50/55",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    key: "interview",
    label: "Entretien",
    description: "Rendez-vous à sécuriser",
    accent: "bg-violet-500",
    panel: "border-violet-100 bg-violet-50/55",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    key: "validated",
    label: "Validation",
    description: "Prêt pour décision",
    accent: "bg-emerald-500",
    panel: "border-emerald-100 bg-emerald-50/55",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "onboarding",
    label: "Intégration",
    description: "Kit, documents et accès",
    accent: "bg-teal-500",
    panel: "border-teal-100 bg-teal-50/55",
    badge: "bg-teal-100 text-teal-700",
  },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("fr-MA").format(number(value));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CA";
}

function normalizePhone(value: unknown) {
  return text(value).replace(/[^0-9+]/g, "");
}

function candidateInterviewDate(candidate: AnyRecord): Date | null {
  const direct = dateValue(candidate, ["interview_at", "interview_date", "appointment_at"]);
  if (direct) return direct;
  const notes = text(candidate.notes);
  const marker = notes.match(/\[\[INTERVIEW_AT:([^\]]+)\]\]/);
  if (!marker?.[1]) return null;
  const parsed = new Date(marker[1]);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function appendOperationalMarker(existing: unknown, marker: string, narrative = "") {
  return [text(existing), marker, narrative].filter(Boolean).join("\n");
}

function candidateName(candidate: AnyRecord) {
  return text(
    candidate.candidate_name ||
      candidate.full_name ||
      candidate.name ||
      candidate.contact_name ||
      candidate.title,
    "Candidat à compléter"
  );
}

function candidatePhone(candidate: AnyRecord) {
  return text(candidate.phone || candidate.mobile || candidate.whatsapp || candidate.contact_phone);
}

function candidateEmail(candidate: AnyRecord) {
  return text(candidate.email || candidate.contact_email);
}

function candidateCity(candidate: AnyRecord) {
  return text(candidate.city || candidate.main_city || candidate.location || candidate.region, "À compléter");
}

function candidateSource(candidate: AnyRecord) {
  return text(candidate.source || candidate.origin || candidate.channel || candidate.acquisition_source, "À compléter");
}

function candidateAvailability(candidate: AnyRecord) {
  return text(candidate.availability || candidate.available_from || candidate.availability_label, "À compléter");
}

function candidateLanguages(candidate: AnyRecord) {
  const raw = candidate.languages || candidate.language || candidate.preferred_language;
  if (Array.isArray(raw)) return raw.map((item) => text(item)).filter(Boolean).join(" / ") || "À compléter";
  return text(raw, "À compléter");
}

function candidateManager(candidate: AnyRecord) {
  const raw = candidate.manager || candidate.owner || candidate.assigned_manager || candidate.interviewer || candidate.assigned_to;
  if (raw && typeof raw === "object") return text(raw.name || raw.full_name || raw.email, "Non assigné");
  return text(raw, "Non assigné");
}

function candidateScore(candidate: AnyRecord) {
  return Math.max(
    0,
    Math.min(
      100,
      number(candidate.evaluation_score ?? candidate.prequalification_score ?? candidate.readiness_score ?? candidate.score ?? candidate.quality_score)
    )
  );
}

function stageOf(candidate: AnyRecord): StageKey {
  const raw = lower(candidate.stage || candidate.pipeline_stage || candidate.current_stage || candidate.status || candidate.step);
  if (raw.includes("reject") || raw.includes("rejet") || raw.includes("refus")) return "rejected";
  if (raw.includes("onboard") || raw.includes("intégr") || raw.includes("integr")) return "onboarding";
  if (raw.includes("valid")) return "validated";
  if (raw.includes("entretien") || raw.includes("interview")) return "interview";
  if (raw.includes("pré") || raw.includes("pre") || raw.includes("qual")) return "prequalified";
  if (raw.includes("contact")) return "contacted";
  return "new";
}

function stageLabel(stage: StageKey) {
  if (stage === "rejected") return "Rejeté";
  return pipelineStages.find((item) => item.key === stage)?.label || "Nouveau";
}

function stageClass(stage: StageKey) {
  if (stage === "rejected") return "bg-rose-50 text-rose-700 ring-rose-100";
  return `${pipelineStages.find((item) => item.key === stage)?.badge || "bg-blue-100 text-blue-700"} ring-1 ring-inset ring-current/10`;
}

function stagePayload(stage: StageKey) {
  const values: Record<StageKey, string> = {
    new: "Nouveau",
    contacted: "Contacté",
    prequalified: "Préqualification",
    interview: "Entretien",
    validated: "Validation",
    onboarding: "Intégration",
    rejected: "Rejeté",
  };
  return values[stage];
}

function nextStage(stage: StageKey): StageKey | null {
  if (stage === "new") return "contacted";
  if (stage === "contacted") return "prequalified";
  if (stage === "prequalified") return "interview";
  if (stage === "interview") return "validated";
  if (stage === "validated") return "onboarding";
  return null;
}

function candidateId(candidate: AnyRecord) {
  return text(candidate.id || candidate.recruitment_id || candidate.candidate_id);
}

function dateValue(candidate: AnyRecord, keys: string[]) {
  for (const key of keys) {
    const value = candidate[key];
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function shortDate(value: Date | null) {
  if (!value) return "À planifier";
  return value.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function fullDateTime(value: Date | null) {
  if (!value) return "À planifier";
  return value.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nextAction(candidate: AnyRecord) {
  const explicit = text(candidate.next_step || candidate.next_action || candidate.follow_up_action || candidate.action);
  if (explicit) return explicit;
  const stage = stageOf(candidate);
  if (stage === "new") return "Premier contact à réaliser";
  if (stage === "contacted") return "Compléter la préqualification";
  if (stage === "prequalified") return "Planifier un entretien";
  if (stage === "interview") return "Confirmer la décision";
  if (stage === "validated") return "Préparer l’intégration";
  if (stage === "onboarding") return "Finaliser l’activation";
  return "Dossier clôturé";
}

function documents(candidate: AnyRecord) {
  const explicitTotal = number(candidate.documents_total ?? candidate.docs_total, -1);
  const explicitComplete = number(candidate.documents_complete ?? candidate.documents_ready ?? candidate.docs_ready, -1);
  const documentList = Array.isArray(candidate.documents) ? candidate.documents : [];
  const missingList = Array.isArray(candidate.missing_documents) ? candidate.missing_documents : [];

  if (explicitTotal >= 0) {
    const complete = Math.max(0, explicitComplete >= 0 ? explicitComplete : explicitTotal - missingList.length);
    return { known: true, complete, total: explicitTotal, missing: Math.max(0, explicitTotal - complete) };
  }
  if (documentList.length || missingList.length) {
    const complete = documentList.filter((item: AnyRecord) => lower(item.status).includes("valid") || item.verified === true).length;
    return { known: true, complete, total: documentList.length + missingList.length, missing: missingList.length };
  }
  return { known: false, complete: 0, total: 0, missing: 0 };
}

function collectCandidates(snapshot: AmbassadorWorkspaceSnapshot) {
  const source = snapshot as AnyRecord;
  const raw = [
    ...(Array.isArray(source.recruitment) ? source.recruitment : []),
    ...(Array.isArray(source.candidates) ? source.candidates : []),
    ...(Array.isArray(source.recruitmentRecords) ? source.recruitmentRecords : []),
    ...(Array.isArray(source.recruitment_records) ? source.recruitment_records : []),
  ];

  const seen = new Set<string>();
  return raw.filter((candidate: AnyRecord) => {
    const key = candidateId(candidate) || `${candidateName(candidate)}|${candidatePhone(candidate)}|${candidateEmail(candidate)}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sameDay(a: Date | null, b: Date) {
  return Boolean(a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

function isOverdue(candidate: AnyRecord) {
  const due = dateValue(candidate, ["next_action_at", "follow_up_at", "due_at"]);
  return Boolean(due && due.getTime() < Date.now() && stageOf(candidate) !== "onboarding" && stageOf(candidate) !== "rejected");
}

function averageProcessingDays(candidates: AnyRecord[]) {
  const values = candidates
    .map((candidate) => {
      const created = dateValue(candidate, ["created_at", "applied_at"]);
      const ended = dateValue(candidate, ["validated_at", "rejected_at", "updated_at"]);
      if (!created || !ended || ended.getTime() < created.getTime()) return null;
      return (ended.getTime() - created.getTime()) / 86_400_000;
    })
    .filter((value): value is number => value !== null);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function Avatar({ candidate, size = "md" }: { candidate: AnyRecord; size?: "sm" | "md" | "lg" }) {
  const name = candidateName(candidate);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 font-black text-blue-700 ring-1 ring-blue-100",
        size === "sm" && "h-8 w-8 text-[11px]",
        size === "md" && "h-10 w-10 text-xs",
        size === "lg" && "h-14 w-14 text-base"
      )}
    >
      {initials(name)}
    </span>
  );
}

function Button({
  children,
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-slate-100",
        variant === "danger" && "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Select({ value, onChange, children, className }: { value: string; onChange: (value: string) => void; children: ReactNode; className?: string }) {
  return (
    <label className={cn("relative inline-flex min-w-[118px]", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

function MetricCard({ label, value, icon: Icon, tone, helper }: { label: string; value: string; icon: LucideIcon; tone: string; helper: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-500">{label}</p>
          <p className="mt-2 text-[28px] font-black leading-none tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 truncate text-[11px] font-bold text-slate-500">{helper}</p>
        </div>
        <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function EmptyMini({ label }: { label: string }) {
  return (
    <div className="flex min-h-[94px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/75 px-3 text-center">
      <Users className="h-4 w-4 text-slate-300" />
      <p className="mt-2 text-[11px] font-bold text-slate-500">{label}</p>
    </div>
  );
}

function PipelineColumn({
  stage,
  candidates,
  onSelect,
}: {
  stage: (typeof pipelineStages)[number];
  candidates: AnyRecord[];
  onSelect: (candidate: AnyRecord) => void;
}) {
  return (
    <section className={cn("min-h-[300px] rounded-2xl border p-3", stage.panel)}>
      <div className={cn("h-1 rounded-full", stage.accent)} />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-950">{stage.label}</h3>
          <p className="mt-1 text-[10px] font-bold text-slate-500">{stage.description}</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-900 shadow-sm ring-1 ring-slate-100">
          {formatNumber(candidates.length)}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {candidates.slice(0, 4).map((candidate) => (
          <button
            key={candidateId(candidate) || `${candidateName(candidate)}-${candidatePhone(candidate)}`}
            type="button"
            onClick={() => onSelect(candidate)}
            className="w-full rounded-xl border border-white bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <Avatar candidate={candidate} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-slate-950">{candidateName(candidate)}</p>
                <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500">{candidateCity(candidate)} · {shortDate(dateValue(candidate, ["next_action_at", "follow_up_at", "interview_at", "due_at"]))}</p>
              </div>
              <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-700">{candidateScore(candidate)}%</span>
            </div>
          </button>
        ))}
        {!candidates.length ? <EmptyMini label="Aucun candidat à cette étape" /> : null}
      </div>
      <div className="mt-3 border-t border-slate-200/70 pt-2 text-center text-[10px] font-black text-blue-700">
        {candidates.length ? `Voir les ${formatNumber(candidates.length)} dossiers` : "Étape prête"}
      </div>
    </section>
  );
}

function SidePanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function NoticeBar({ notice, onClose }: { notice: NonNullable<Notice>; onClose: () => void }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm font-bold",
        notice.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        notice.type === "error" && "border-rose-200 bg-rose-50 text-rose-800",
        notice.type === "info" && "border-blue-200 bg-blue-50 text-blue-800"
      )}
    >
      <span>{notice.message}</span>
      <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-white/70"><X className="h-4 w-4" /></button>
    </div>
  );
}

function CandidateDrawer({
  candidate,
  saving,
  onClose,
  onMove,
  onInterview,
}: {
  candidate: AnyRecord;
  saving: boolean;
  onClose: () => void;
  onMove: (candidate: AnyRecord, stage: StageKey) => void;
  onInterview: (candidate: AnyRecord) => void;
}) {
  const stage = stageOf(candidate);
  const target = nextStage(stage);
  const docs = documents(candidate);
  const phone = candidatePhone(candidate);
  const email = candidateEmail(candidate);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/35 backdrop-blur-[2px]" onMouseDown={onClose}>
      <aside
        className="absolute bottom-0 right-0 top-0 flex w-full max-w-[560px] flex-col bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar candidate={candidate} size="lg" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Dossier candidat</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{candidateName(candidate)}</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{candidateCity(candidate)} · {candidateSource(candidate)}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"><X className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Étape actuelle</p>
              <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black", stageClass(stage))}>{stageLabel(stage)}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">Score préqualification</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{candidateScore(candidate)}%</p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-black text-slate-950">Coordonnées & disponibilité</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Téléphone</dt><dd className="text-right font-black text-slate-900">{phone || "À compléter"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Email</dt><dd className="max-w-[260px] truncate text-right font-black text-slate-900">{email || "À compléter"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Disponibilité</dt><dd className="text-right font-black text-slate-900">{candidateAvailability(candidate)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Langues</dt><dd className="text-right font-black text-slate-900">{candidateLanguages(candidate)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Manager</dt><dd className="text-right font-black text-slate-900">{candidateManager(candidate)}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-black text-slate-950">Documents & conformité</h3>
              {docs.known ? (
                <span className={cn("rounded-full px-3 py-1 text-xs font-black", docs.missing ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>{docs.complete}/{docs.total}</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Non renseigné</span>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              {docs.known
                ? docs.missing
                  ? `${docs.missing} document(s) restent à collecter ou valider avant activation.`
                  : "Le dossier documentaire renseigné est complet."
                : "Aucune information documentaire n’est encore disponible pour ce candidat."}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-black text-slate-950">Prochaine action</h3>
            <p className="mt-3 text-sm font-black text-slate-900">{nextAction(candidate)}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{fullDateTime(dateValue(candidate, ["next_action_at", "follow_up_at", "interview_at", "due_at"]))}</p>
          </section>
        </div>

        <footer className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex flex-wrap justify-end gap-2">
            {phone ? <a href={`tel:${normalizePhone(phone)}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-800 hover:bg-slate-50"><Phone className="h-4 w-4" /> Appeler</a> : null}
            {phone ? <a href={`https://wa.me/${normalizePhone(phone).replace("+", "")}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-extrabold text-emerald-700 hover:bg-emerald-100"><MessageCircle className="h-4 w-4" /> WhatsApp</a> : null}
            <Button onClick={() => onInterview(candidate)}><CalendarDays className="h-4 w-4" /> Planifier entretien</Button>
            {target ? <Button variant="primary" disabled={saving} onClick={() => onMove(candidate, target)}>{saving ? "Synchronisation…" : `Passer à ${stageLabel(target)}`} <ArrowRight className="h-4 w-4" /></Button> : null}
          </div>
        </footer>
      </aside>
    </div>
  );
}

function EnterpriseModal({
  eyebrow,
  title,
  description,
  icon: Icon,
  onClose,
  children,
  footer,
  width = "max-w-[1580px]",
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-2 backdrop-blur-[3px] sm:p-4" onMouseDown={onClose}>
      <section className={cn("flex max-h-[calc(100dvh-20px)] w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-32px)] sm:w-[calc(100vw-32px)]", width)} onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 bg-white px-6 py-5 text-slate-950">
          <div className="flex min-w-0 items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700"><Icon className="h-6 w-6" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">{eyebrow}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-950"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f9fc] p-5 sm:p-6">{children}</div>
        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-slate-950">{footer}</footer>
      </section>
    </div>
  );
}

function ModalField({ label, required, children, helper }: { label: string; required?: boolean; children: ReactNode; helper?: string }) {
  return <label className="block space-y-2"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">{label}{required ? " *" : ""}</span>{children}{helper ? <span className="block text-[11px] font-semibold leading-5 text-slate-500">{helper}</span> : null}</label>;
}
const modalInput = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
const modalTextarea = "w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

function InterviewModal({ candidates, initialCandidate, saving, onClose, onSubmit }: { candidates: AnyRecord[]; initialCandidate: AnyRecord | null; saving: boolean; onClose: () => void; onSubmit: (candidate: AnyRecord, payload: { date: string; time: string; format: string; interviewer: string; objective: string; location: string; duration: string; scorecard: string; reminder: string; decisionOwner: string }) => void; }) {
  const [selectedId, setSelectedId] = useState(candidateId(initialCandidate || {}));
  const selectedCandidate = candidates.find((candidate) => candidateId(candidate) === selectedId) || initialCandidate;
  const [date, setDate] = useState(""); const [time, setTime] = useState("10:00"); const [duration, setDuration] = useState("45");
  const [format, setFormat] = useState("Visioconférence"); const [location, setLocation] = useState("Google Meet");
  const [interviewer, setInterviewer] = useState(initialCandidate && candidateManager(initialCandidate) !== "Non assigné" ? candidateManager(initialCandidate) : "Sara Bakoki");
  const [decisionOwner, setDecisionOwner] = useState("Sara Bakoki"); const [reminder, setReminder] = useState("24 heures avant");
  const [objective, setObjective] = useState("Valider la motivation, la disponibilité, la posture terrain et la capacité de prospection.");
  const [scorecard, setScorecard] = useState("Motivation · Communication · Disponibilité · Mobilité · Réseau local · Discipline de suivi");
  const blocked = !selectedCandidate || !date || !time || !interviewer || !decisionOwner;
  const score = selectedCandidate ? candidateScore(selectedCandidate) : 0;
  return <EnterpriseModal eyebrow="ORCHESTRATION RECRUTEMENT" title="Planifier un entretien candidat" description="Sécurisez le créneau, les responsables, le cadre d’évaluation, les rappels et la décision attendue dans un seul workflow auditable." icon={CalendarDays} onClose={onClose} footer={<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="text-xs font-semibold text-slate-600"><p className="font-black text-slate-950">{selectedCandidate ? candidateName(selectedCandidate) : "Aucun dossier sélectionné"}</p><p>{blocked ? "Bloqué : candidat, date, heure et responsables requis." : "Entretien prêt à être synchronisé dans le dossier candidat."}</p></div><div className="flex flex-wrap justify-end gap-2"><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={blocked || saving} onClick={() => selectedCandidate && onSubmit(selectedCandidate, { date, time, format, interviewer, objective, location, duration, scorecard, reminder, decisionOwner })}>{saving ? "Synchronisation…" : "Planifier et synchroniser"}</Button></div></div>}>
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr_0.85fr]">
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">1. Dossier</p><h3 className="mt-1 text-lg font-black text-slate-950">Candidat & contexte</h3></div><ModalField label="Candidat réel" required><select value={selectedId} onChange={(e)=>{setSelectedId(e.target.value); const found=candidates.find(c=>candidateId(c)===e.target.value); if(found && candidateManager(found)!=="Non assigné") setInterviewer(candidateManager(found));}} className={modalInput}><option value="">Sélectionner un candidat</option>{candidates.map(c=><option key={candidateId(c)} value={candidateId(c)}>{candidateName(c)} · {candidateCity(c)} · {stageLabel(stageOf(c))}</option>)}</select></ModalField>{selectedCandidate ? <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4"><div className="flex items-center gap-3"><Avatar candidate={selectedCandidate} size="lg"/><div><p className="font-black text-slate-950">{candidateName(selectedCandidate)}</p><p className="text-xs font-bold text-slate-600">{candidateCity(selectedCandidate)} · {candidateSource(selectedCandidate)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-white p-3"><span className="font-bold text-slate-500">Score</span><p className="mt-1 text-xl font-black text-slate-950">{score}%</p></div><div className="rounded-xl bg-white p-3"><span className="font-bold text-slate-500">Étape</span><p className="mt-1 font-black text-violet-700">{stageLabel(stageOf(selectedCandidate))}</p></div></div></div> : <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-500">Sélectionnez un dossier réel.</div>}</section>
      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">2. Planification</p><h3 className="mt-1 text-lg font-black text-slate-950">Créneau, format & scorecard</h3></div><div className="grid gap-4 sm:grid-cols-2"><ModalField label="Date" required><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={modalInput}/></ModalField><ModalField label="Heure" required><input type="time" value={time} onChange={e=>setTime(e.target.value)} className={modalInput}/></ModalField><ModalField label="Durée"><select value={duration} onChange={e=>setDuration(e.target.value)} className={modalInput}>{["30","45","60","90"].map(v=><option key={v} value={v}>{v} minutes</option>)}</select></ModalField><ModalField label="Format"><select value={format} onChange={e=>setFormat(e.target.value)} className={modalInput}>{["Visioconférence","Téléphone","Présentiel siège","Présentiel terrain"].map(v=><option key={v}>{v}</option>)}</select></ModalField><ModalField label="Lieu / lien"><input value={location} onChange={e=>setLocation(e.target.value)} className={modalInput}/></ModalField><ModalField label="Rappel"><select value={reminder} onChange={e=>setReminder(e.target.value)} className={modalInput}>{["24 heures avant","2 heures avant","48 heures avant","Aucun rappel"].map(v=><option key={v}>{v}</option>)}</select></ModalField><div className="sm:col-span-2"><ModalField label="Objectif"><textarea rows={4} value={objective} onChange={e=>setObjective(e.target.value)} className={modalTextarea}/></ModalField></div><div className="sm:col-span-2"><ModalField label="Grille d’évaluation"><textarea rows={3} value={scorecard} onChange={e=>setScorecard(e.target.value)} className={modalTextarea}/></ModalField></div></div></section>
      <aside className="space-y-4"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">3. Gouvernance</p><h3 className="mt-1 text-lg font-black text-slate-950">Responsables & décision</h3><div className="mt-4 space-y-4"><ModalField label="Intervieweur" required><input value={interviewer} onChange={e=>setInterviewer(e.target.value)} className={modalInput}/></ModalField><ModalField label="Responsable décision" required><input value={decisionOwner} onChange={e=>setDecisionOwner(e.target.value)} className={modalInput}/></ModalField></div></section><section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-700"/><p className="font-black text-emerald-900">Contrôles avant planification</p></div><ul className="mt-4 space-y-3 text-sm font-semibold text-emerald-900"><li>• Dossier réel sélectionné</li><li>• Créneau et durée définis</li><li>• Scorecard explicite</li><li>• Responsable de décision nommé</li></ul></section></aside>
    </div>
  </EnterpriseModal>;
}

type CvQueueItem = { id: string; file: File; name: string; phone: string; email: string; city: string; source: string };
function ImportCvModal({ saving, onClose, onSubmit }: { saving: boolean; onClose: () => void; onSubmit: (items: CvQueueItem[], storeFiles: boolean) => void }) {
  const [items,setItems]=useState<CvQueueItem[]>([]); const [storeFiles,setStoreFiles]=useState(true);
  const addFiles=(files:FileList|null)=>{ if(!files)return; const next=Array.from(files).map(file=>({id:`${file.name}-${file.size}-${file.lastModified}`,file,name:file.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim(),phone:"",email:"",city:"",source:"Import CV"})); setItems(prev=>[...prev,...next.filter(n=>!prev.some(p=>p.id===n.id))]); };
  const update=(id:string,key:keyof Omit<CvQueueItem,"id"|"file">,value:string)=>setItems(prev=>prev.map(item=>item.id===id?{...item,[key]:value}:item));
  const ready=items.length>0 && items.every(i=>i.name.trim());
  return <EnterpriseModal eyebrow="INTAKE DOCUMENTAIRE" title="Importer des CV" description="Constituez une file d’import contrôlée, qualifiez les métadonnées essentielles et créez des dossiers candidats réels dans le pipeline sans injecter de données de démonstration." icon={Upload} onClose={onClose} footer={<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="text-xs font-semibold text-slate-600"><p className="font-black text-slate-950">{items.length} fichier(s) préparé(s)</p><p>{ready ? "La file est prête à être synchronisée." : "Ajoutez au moins un CV et confirmez chaque nom candidat."}</p></div><div className="flex gap-2"><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={!ready||saving} onClick={()=>onSubmit(items,storeFiles)}>{saving?"Import en cours…":"Importer et créer les dossiers"}</Button></div></div>}>
    <div className="grid gap-5 xl:grid-cols-[0.75fr_1.55fr_0.7fr]"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">1. Sélection</p><h3 className="mt-1 text-lg font-black text-slate-950">Fichiers CV</h3><label className="mt-5 flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center"><FolderOpen className="h-9 w-9 text-blue-600"/><p className="mt-3 font-black text-slate-950">Déposer PDF, DOC ou DOCX</p><p className="mt-1 text-xs font-semibold text-slate-500">Sélection multiple autorisée</p><input type="file" multiple accept=".pdf,.doc,.docx,application/pdf" className="hidden" onChange={e=>addFiles(e.target.files)}/></label><label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><input type="checkbox" checked={storeFiles} onChange={e=>setStoreFiles(e.target.checked)} className="mt-1 h-4 w-4"/><span><b className="block text-sm text-slate-950">Stockage central sécurisé</b><small className="font-semibold text-slate-500">Le dossier n’est créé qu’après retour réel du stockage lorsque cette option est active.</small></span></label></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">2. Qualification</p><h3 className="mt-1 text-lg font-black text-slate-950">File d’import</h3></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{items.length}</span></div><div className="mt-4 space-y-3">{items.length?items.map(item=><article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-950">{item.file.name}</p><p className="text-xs font-semibold text-slate-500">{(item.file.size/1024/1024).toFixed(2)} MB · {item.file.type||"document"}</p></div><button onClick={()=>setItems(prev=>prev.filter(x=>x.id!==item.id))} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button></div><div className="mt-4 grid gap-3 md:grid-cols-2"><ModalField label="Nom candidat" required><input value={item.name} onChange={e=>update(item.id,"name",e.target.value)} className={modalInput}/></ModalField><ModalField label="Ville"><input value={item.city} onChange={e=>update(item.id,"city",e.target.value)} className={modalInput}/></ModalField><ModalField label="Téléphone"><input value={item.phone} onChange={e=>update(item.id,"phone",e.target.value)} className={modalInput}/></ModalField><ModalField label="Email"><input value={item.email} onChange={e=>update(item.id,"email",e.target.value)} className={modalInput}/></ModalField></div></article>):<div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm font-bold text-slate-500">Aucun CV sélectionné.</div>}</div></section>
    <aside className="space-y-4"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">3. Résultat</p><h3 className="mt-1 text-lg font-black text-slate-950">Synchronisation attendue</h3><div className="mt-4 space-y-3 text-sm font-semibold text-slate-700"><div className="rounded-xl bg-slate-50 p-3">Création dans le pipeline recrutement</div><div className="rounded-xl bg-slate-50 p-3">Source marquée « Import CV »</div><div className="rounded-xl bg-slate-50 p-3">Traçabilité du nom de fichier</div><div className="rounded-xl bg-slate-50 p-3">Rafraîchissement automatique</div></div></section><section className="rounded-3xl border border-amber-100 bg-amber-50 p-5"><p className="font-black text-amber-900">Aucun parsing inventé</p><p className="mt-2 text-sm font-semibold leading-6 text-amber-800">Le système ne prétend pas extraire automatiquement des informations non réellement analysées. L’opérateur valide les métadonnées avant création.</p></section></aside></div>
  </EnterpriseModal>;
}

function CohortModal({ candidates, saving, onClose, onSubmit }: { candidates: AnyRecord[]; saving: boolean; onClose: () => void; onSubmit: (payload: { name:string; campaign:string; manager:string; startDate:string; objective:string; stage:string; candidateIds:string[] }) => void }) {
  const [name,setName]=useState(""); const [campaign,setCampaign]=useState("Programme Ambassadeurs Maroc 2026"); const [manager,setManager]=useState("Sara Bakoki"); const [startDate,setStartDate]=useState(""); const [objective,setObjective]=useState("Préparer un groupe homogène pour préqualification, entretien, validation et intégration."); const [stage,setStage]=useState("prequalified"); const [selected,setSelected]=useState<string[]>([]); const [q,setQ]=useState("");
  const visible=candidates.filter(c=>lower(candidateName(c)+candidateCity(c)+candidateSource(c)).includes(lower(q))); const blocked=!name.trim()||!manager.trim()||!startDate||!selected.length;
  const toggle=(id:string)=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  return <EnterpriseModal eyebrow="GESTION DE COHORTE" title="Créer une cohorte de recrutement" description="Regroupez des dossiers candidats réels, définissez un responsable, une cadence et une étape cible, puis synchronisez la décision dans chaque dossier sélectionné." icon={Users} onClose={onClose} footer={<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="text-xs font-semibold text-slate-600"><p className="font-black text-slate-950">{selected.length} candidat(s) sélectionné(s)</p><p>{blocked?"Bloqué : nom, responsable, date et sélection requis.":"Cohorte prête à être créée et répercutée dans les dossiers."}</p></div><div className="flex gap-2"><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={blocked||saving} onClick={()=>onSubmit({name,campaign,manager,startDate,objective,stage,candidateIds:selected})}>{saving?"Synchronisation…":"Créer la cohorte"}</Button></div></div>}>
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr_0.75fr]"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">1. Cadre</p><h3 className="mt-1 text-lg font-black text-slate-950">Identité & gouvernance</h3><div className="mt-4 space-y-4"><ModalField label="Nom cohorte" required><input value={name} onChange={e=>setName(e.target.value)} placeholder="Cohorte Rabat — Août 2026" className={modalInput}/></ModalField><ModalField label="Campagne"><input value={campaign} onChange={e=>setCampaign(e.target.value)} className={modalInput}/></ModalField><ModalField label="Responsable" required><input value={manager} onChange={e=>setManager(e.target.value)} className={modalInput}/></ModalField><ModalField label="Date de démarrage" required><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={modalInput}/></ModalField><ModalField label="Étape cible"><select value={stage} onChange={e=>setStage(e.target.value)} className={modalInput}><option value="contacted">Contacté</option><option value="prequalified">Préqualification</option><option value="interview">Entretien</option><option value="validated">Validation</option></select></ModalField><ModalField label="Objectif"><textarea rows={5} value={objective} onChange={e=>setObjective(e.target.value)} className={modalTextarea}/></ModalField></div></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">2. Membres</p><h3 className="mt-1 text-lg font-black text-slate-950">Dossiers candidats réels</h3></div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher nom, ville, source…" className={cn(modalInput,"max-w-[300px]")}/></div><div className="mt-4 grid max-h-[540px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">{visible.map(c=>{const id=candidateId(c); const active=selected.includes(id); return <button key={id} onClick={()=>toggle(id)} className={cn("rounded-2xl border p-4 text-left transition",active?"border-blue-500 bg-blue-50 ring-4 ring-blue-100":"border-slate-200 bg-white hover:border-blue-200")}><div className="flex items-center gap-3"><Avatar candidate={c}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-950">{candidateName(c)}</p><p className="truncate text-xs font-semibold text-slate-500">{candidateCity(c)} · {stageLabel(stageOf(c))}</p></div><span className={cn("flex h-6 w-6 items-center justify-center rounded-full border",active?"border-blue-600 bg-blue-600 text-white":"border-slate-300 text-transparent")}><Check className="h-3.5 w-3.5"/></span></div></button>})}{!visible.length?<div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-500">Aucun candidat réel correspondant.</div>:null}</div></section>
    <aside className="space-y-4"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">3. Readiness</p><h3 className="mt-1 text-lg font-black text-slate-950">Contrôle cohorte</h3><div className="mt-4 space-y-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Membres</p><p className="mt-1 text-2xl font-black text-slate-950">{selected.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Étape cible</p><p className="mt-1 font-black text-slate-950">{stageLabel(stage as StageKey)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Responsable</p><p className="mt-1 font-black text-slate-950">{manager||"À définir"}</p></div></div></section><section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5"><p className="font-black text-emerald-900">Synchronisation contrôlée</p><p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">La cohorte est inscrite dans les notes et la prochaine action de chaque dossier, sans créer de candidat fictif.</p></section></aside></div>
  </EnterpriseModal>;
}

function ExportPipelineModal({ candidates, saving, onClose, onSubmit }: { candidates: AnyRecord[]; saving: boolean; onClose: () => void; onSubmit: (config:{title:string;stage:string;format:string;columns:string[]})=>void }) {
 const [title,setTitle]=useState(`Pipeline recrutement ambassadeurs — ${new Date().toLocaleDateString("fr-FR")}`); const [stage,setStage]=useState("Tous"); const [format,setFormat]=useState("csv"); const all=["Nom","Téléphone","Email","Ville","Source","Étape","Score","Manager","Prochaine action","Documents"]; const [columns,setColumns]=useState(all); const rows=stage==="Tous"?candidates:candidates.filter(c=>stageLabel(stageOf(c))===stage); const toggle=(c:string)=>setColumns(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c]);
 return <EnterpriseModal eyebrow="REPORTING & GOUVERNANCE" title="Exporter le pipeline recrutement" description="Configurez un export strictement basé sur les dossiers réels visibles, avec périmètre, colonnes et format contrôlés avant téléchargement." icon={Download} onClose={onClose} footer={<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="text-xs font-semibold text-slate-600"><p className="font-black text-slate-950">{rows.length} dossier(s) · {columns.length} colonne(s)</p><p>{columns.length?"Export prêt à être généré et audité.":"Sélectionnez au moins une colonne."}</p></div><div className="flex gap-2"><Button onClick={onClose}>Annuler</Button><Button variant="primary" disabled={!columns.length||saving} onClick={()=>onSubmit({title,stage,format,columns})}>{saving?"Génération…":"Générer et télécharger"}</Button></div></div>}>
 <div className="grid gap-5 xl:grid-cols-[0.85fr_1.2fr_0.75fr]"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">1. Paramètres</p><h3 className="mt-1 text-lg font-black text-slate-950">Périmètre du rapport</h3><div className="mt-4 space-y-4"><ModalField label="Titre"><input value={title} onChange={e=>setTitle(e.target.value)} className={modalInput}/></ModalField><ModalField label="Étape"><select value={stage} onChange={e=>setStage(e.target.value)} className={modalInput}><option>Tous</option>{pipelineStages.map(s=><option key={s.key}>{s.label}</option>)}<option>Rejeté</option></select></ModalField><ModalField label="Format"><select value={format} onChange={e=>setFormat(e.target.value)} className={modalInput}><option value="csv">CSV opérationnel</option><option value="json">JSON structuré</option></select></ModalField></div></section><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">2. Colonnes</p><h3 className="mt-1 text-lg font-black text-slate-950">Contenu inclus</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{all.map(c=><button key={c} onClick={()=>toggle(c)} className={cn("flex items-center justify-between rounded-xl border p-3 text-left text-sm font-bold",columns.includes(c)?"border-blue-300 bg-blue-50 text-blue-900":"border-slate-200 bg-white text-slate-700")}><span>{c}</span><span className={cn("flex h-5 w-5 items-center justify-center rounded-full",columns.includes(c)?"bg-blue-600 text-white":"bg-slate-100 text-transparent")}><Check className="h-3 w-3"/></span></button>)}</div></section><aside className="space-y-4"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">3. Aperçu</p><h3 className="mt-1 text-lg font-black text-slate-950">Synthèse export</h3><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Dossiers</p><p className="mt-1 text-2xl font-black text-slate-950">{rows.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Format</p><p className="mt-1 font-black uppercase text-slate-950">{format}</p></div></div></section><section className="rounded-3xl border border-blue-100 bg-blue-50 p-5"><div className="flex gap-3"><Database className="h-5 w-5 text-blue-700"/><div><p className="font-black text-blue-900">Source réelle uniquement</p><p className="mt-1 text-sm font-semibold leading-6 text-blue-800">Aucune ligne seed, démo ou fallback n’est ajoutée à l’export.</p></div></div></section></aside></div>
 </EnterpriseModal>;
}

export default function AmbassadorRecruitmentRoute({
  snapshot,
  loading,
  refreshing,
  error,
  success,
  query: initialQuery = "",
  onRefresh,
  onExport,
}: RecruitmentProps) {
  const candidates = useMemo(() => collectCandidates(snapshot), [snapshot]);
  const [query, setQuery] = useState(initialQuery);
  const [stageFilter, setStageFilter] = useState("Tous");
  const [sourceFilter, setSourceFilter] = useState("Toutes");
  const [availabilityFilter, setAvailabilityFilter] = useState("Toutes");
  const [languageFilter, setLanguageFilter] = useState("Toutes");
  const [managerFilter, setManagerFilter] = useState("Tous");
  const [selectedCandidate, setSelectedCandidate] = useState<AnyRecord | null>(null);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<AnyRecord | null>(null);
  const [cvImportOpen, setCvImportOpen] = useState(false);
  const [cohortOpen, setCohortOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [candidateBusy, setCandidateBusy] = useState(false);
  const [candidateForm, setCandidateForm] = useState<RecruitmentCandidateForm>({ ...recruitmentCandidateDefaults });
  const [candidateFeedback, setCandidateFeedback] = useState<CockpitModalFeedback | null>(null);

  const options = useMemo(() => {
    const unique = (items: string[]) => Array.from(new Set(items.filter((item) => item && item !== "À compléter" && item !== "Non assigné"))).sort((a, b) => a.localeCompare(b, "fr"));
    return {
      sources: unique(candidates.map(candidateSource)),
      availability: unique(candidates.map(candidateAvailability)),
      languages: unique(candidates.map(candidateLanguages)),
      managers: unique(candidates.map(candidateManager)),
    };
  }, [candidates]);

  const grouped = useMemo(() => {
    const map: Record<Exclude<StageKey, "rejected">, AnyRecord[]> = {
      new: [], contacted: [], prequalified: [], interview: [], validated: [], onboarding: [],
    };
    candidates.forEach((candidate) => {
      const stage = stageOf(candidate);
      if (stage !== "rejected") map[stage].push(candidate);
    });
    return map;
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    const needle = lower(query);
    return candidates.filter((candidate) => {
      if (stageFilter !== "Tous" && stageLabel(stageOf(candidate)) !== stageFilter) return false;
      if (sourceFilter !== "Toutes" && candidateSource(candidate) !== sourceFilter) return false;
      if (availabilityFilter !== "Toutes" && candidateAvailability(candidate) !== availabilityFilter) return false;
      if (languageFilter !== "Toutes" && candidateLanguages(candidate) !== languageFilter) return false;
      if (managerFilter !== "Tous" && candidateManager(candidate) !== managerFilter) return false;
      if (!needle) return true;
      return [candidateName(candidate), candidatePhone(candidate), candidateEmail(candidate), candidateCity(candidate), candidateSource(candidate), candidateManager(candidate)]
        .some((value) => lower(value).includes(needle));
    });
  }, [availabilityFilter, candidates, languageFilter, managerFilter, query, sourceFilter, stageFilter]);

  const metrics = useMemo(() => ({
    new: grouped.new.length,
    contacted: grouped.contacted.length,
    interviews: grouped.interview.length,
    validated: grouped.validated.length,
    rejected: candidates.filter((candidate) => stageOf(candidate) === "rejected").length,
    averageDays: averageProcessingDays(candidates),
  }), [candidates, grouped]);

  const today = new Date();
  const callQueue = useMemo(() => candidates
    .filter((candidate) => {
      const stage = stageOf(candidate);
      const due = dateValue(candidate, ["next_action_at", "follow_up_at", "due_at"]);
      return Boolean(candidatePhone(candidate) && (sameDay(due, today) || (!due && (stage === "new" || stage === "contacted"))));
    })
    .slice(0, 6), [candidates]);

  const interviews = useMemo(() => candidates
    .map((candidate) => ({ candidate, at: candidateInterviewDate(candidate) }))
    .filter((item): item is { candidate: AnyRecord; at: Date } => Boolean(item.at && item.at.getTime() >= new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 5), [candidates]);

  const risks = useMemo(() => candidates
    .map((candidate) => {
      const docs = documents(candidate);
      if (isOverdue(candidate)) return { candidate, label: "Relance en retard", detail: nextAction(candidate), tone: "rose" };
      if (docs.known && docs.missing > 0) return { candidate, label: "Documents manquants", detail: `${docs.missing} pièce(s) à compléter`, tone: "amber" };
      if (candidateScore(candidate) > 0 && candidateScore(candidate) < 60) return { candidate, label: "Score à renforcer", detail: `${candidateScore(candidate)}% de préqualification`, tone: "amber" };
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 6), [candidates]);

  function openCandidateModal() {
    setCandidateForm({ ...recruitmentCandidateDefaults });
    setCandidateFeedback(null);
    setCandidateOpen(true);
  }

  function closeCandidateModal() {
    if (candidateBusy) return;
    setCandidateOpen(false);
    setCandidateFeedback(null);
  }

  function updateCandidate(key: string, value: string) {
    setCandidateForm((current) => {
      const next: RecruitmentCandidateForm = {
        ...current,
        [key]: value,
        region: key === "city" ? candidateRegions[value] || current.region : current.region,
      };
      if (key === "campaign") next.source_campaign = value;
      if (key === "zone") next.accepted_zones = value;
      if (key === "internal_referrer") next.profile_notes = value;
      if (key === "terrain_mode") next.availability = value;
      if (key === "quality_checklist") next.validation_checklist = value;
      return next;
    });
  }

  async function submitCandidate(mode: "draft" | "create" | "interview") {
    setCandidateBusy(true);
    setCandidateFeedback(null);
    try {
      const readiness = candidateReadiness(candidateForm);
      if (mode === "create" && readiness.missing.length) {
        throw new Error(`Dossier incomplet: ${readiness.missing.slice(0, 3).join(", ")}`);
      }
      if (mode === "interview" && readiness.interviewMissing.length) {
        throw new Error(`Dossier incomplet: ${readiness.interviewMissing.slice(0, 3).join(", ")}`);
      }

      const pipelineStage = mode === "draft"
        ? "sourced"
        : mode === "interview"
          ? "interview"
          : readiness.status === "Prêt entretien"
            ? "interview"
            : "screening";
      const nextStep = mode === "draft"
        ? "Brouillon recrutement OPS"
        : mode === "interview"
          ? "Créer + planifier entretien OPS"
          : candidateForm.next_action;
      const workflowNotes = [
        `Mode: ${mode}`,
        `Pipeline stage: ${pipelineStage}`,
        `Score live: ${readiness.score} | Readiness: ${readiness.status}`,
        `Identité: ${candidateForm.candidate_name} | ${candidateForm.phone} | ${candidateForm.email}`,
        `Localisation: ${candidateForm.city} / ${candidateForm.district} / ${candidateForm.approx_address}`,
        `Source: ${candidateForm.source} | Campagne: ${candidateForm.source_campaign || candidateForm.campaign} | Canal: ${candidateForm.preferred_channel}`,
        `Profil terrain: ${candidateForm.commercial_experience} | ${candidateForm.field_experience} | ${candidateForm.family_knowledge}`,
        `Réseau & digital: ${candidateForm.local_network} | WhatsApp/CRM: ${candidateForm.whatsapp_crm_capability} | ${candidateForm.digital_confidence}`,
        `Disponibilité: ${candidateForm.availability_days} | ${candidateForm.availability_slots} | ${candidateForm.weekly_capacity}`,
        `Mobilité: ${candidateForm.mobility} | Rayon: ${candidateForm.action_radius} | Zones: ${candidateForm.accepted_zones}`,
        `Préqualification: ${candidateForm.prequal_score}% | Ville: ${candidateForm.compatibility_city} | Profil: ${candidateForm.compatibility_profile} | Dispo: ${candidateForm.compatibility_availability}`,
        `Workflow RH/OPS: ${candidateForm.pipeline_stage} | Responsable: ${candidateForm.responsible_owner} | Intervieweur: ${candidateForm.interviewer} | Relance: ${candidateForm.followup_date}`,
        `Plan entretien: ${candidateForm.schedule_interview} | Documents: ${candidateForm.documents_to_request}`,
        `Checklist: ${candidateForm.validation_checklist}`,
        `Risque: ${candidateForm.risk_notes}`,
        `Note interne: ${candidateForm.internal_notes || candidateForm.profile_notes}`,
      ].filter(Boolean);

      const response = await fetch("/api/market-os/ambassadors/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_name: candidateForm.candidate_name.trim() || (mode === "draft" ? "Brouillon candidat" : candidateForm.candidate_name.trim()),
          phone: candidateForm.phone.trim() || null,
          email: candidateForm.email.trim() || null,
          city: candidateForm.city,
          region: candidateForm.region,
          source: candidateForm.source,
          stage: pipelineStage,
          evaluation_score: readiness.score,
          interviewer: candidateForm.interviewer,
          next_step: nextStep,
          notes: [...workflowNotes, candidateForm.notes].filter(Boolean).join("\n"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || "Création candidat impossible");
      }

      const message = mode === "draft"
        ? "Brouillon candidat enregistré et synchronisé dans le pipeline."
        : mode === "interview"
          ? "Candidat créé; le dossier est prêt pour la planification d’entretien."
          : "Candidat créé et synchronisé dans le pipeline recrutement.";
      setCandidateFeedback({ tone: "success", message });
      setNotice({ type: "success", message });
      onRefresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Création candidat impossible";
      setCandidateFeedback({ tone: "error", message });
      setNotice({ type: "error", message });
    } finally {
      setCandidateBusy(false);
    }
  }

  async function moveStage(candidate: AnyRecord, target: StageKey) {
    const id = candidateId(candidate);
    if (!id) {
      setNotice({ type: "error", message: "Ce dossier ne possède pas d’identifiant synchronisable." });
      return;
    }
    setSavingId(id);
    setNotice(null);
    try {
      const response = await fetch("/api/market-os/ambassadors/recruitment/stage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stage: stagePayload(target), next_step: target === "interview" ? "Planifier entretien" : undefined }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "La mise à jour de l’étape a échoué.");
      setNotice({ type: "success", message: `${candidateName(candidate)} a été déplacé vers « ${stageLabel(target)} ».` });
      setSelectedCandidate(null);
      onRefresh();
    } catch (caught) {
      setNotice({ type: "error", message: caught instanceof Error ? caught.message : "La mise à jour de l’étape a échoué." });
    } finally {
      setSavingId("");
    }
  }

  async function scheduleInterview(candidate: AnyRecord, payload: { date: string; time: string; format: string; interviewer: string; objective: string; location: string; duration: string; scorecard: string; reminder: string; decisionOwner: string }) {
    const id = candidateId(candidate);
    if (!id) {
      setNotice({ type: "error", message: "Ce dossier ne possède pas d’identifiant synchronisable." });
      return;
    }
    setSavingId(id);
    setNotice(null);
    try {
      const interviewAt = new Date(`${payload.date}T${payload.time}:00`).toISOString();
      const response = await fetch(`/api/market-os/ambassadors/recruitment/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "Entretien",
          interviewer: payload.interviewer,
          next_step: `Entretien ${payload.date} à ${payload.time} · ${payload.format}`,
          notes: appendOperationalMarker(candidate.notes, `[[INTERVIEW_AT:${interviewAt}]]`, `Entretien | Format: ${payload.format} | Lieu: ${payload.location} | Durée: ${payload.duration} min | Rappel: ${payload.reminder} | Intervieweur: ${payload.interviewer} | Décision: ${payload.decisionOwner} | Objectif: ${payload.objective} | Scorecard: ${payload.scorecard}`),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.ok === false) throw new Error(result?.error || "La planification de l’entretien a échoué.");
      setNotice({ type: "success", message: `Entretien planifié pour ${candidateName(candidate)}.` });
      setInterviewOpen(false);
      setInterviewCandidate(null);
      setSelectedCandidate(null);
      onRefresh();
    } catch (caught) {
      setNotice({ type: "error", message: caught instanceof Error ? caught.message : "La planification de l’entretien a échoué." });
    } finally {
      setSavingId("");
    }
  }

  async function importCvCandidates(items: CvQueueItem[], storeFiles: boolean) {
    setSavingId("cv-import"); setNotice(null);
    try {
      let created = 0;
      for (const item of items) {
        let storageId = "";
        if (storeFiles) {
          const formData = new FormData(); formData.append("file", item.file); formData.append("moduleKey", "market_os_ambassadors"); formData.append("entityType", "candidate_cv"); formData.append("direction", "inbound"); formData.append("metadata", JSON.stringify({ candidateName: item.name, source: "recruitment_cv_import" }));
          const upload = await fetch("/api/storage/upload", { method: "POST", body: formData }); const uploadPayload = await upload.json().catch(()=>({}));
          if (!upload.ok || uploadPayload?.ok === false) throw new Error(`Stockage impossible pour ${item.file.name}: ${uploadPayload?.error || "échec stockage"}`);
          storageId = text(uploadPayload?.data?.id);
        }
        const response = await fetch("/api/market-os/ambassadors/recruitment", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ candidate_name:item.name, phone:item.phone, email:item.email, city:item.city, source:item.source, stage:"sourced", evaluation_score:0, next_step:"Préqualification du CV", notes:appendOperationalMarker("", `[[CV_FILE:${item.file.name}]]${storageId?` [[STORAGE_FILE:${storageId}]]`:""}`, "Dossier créé depuis l’import CV contrôlé.") }) });
        const payload=await response.json().catch(()=>({})); if(!response.ok||payload?.ok===false) throw new Error(payload?.error||`Création impossible pour ${item.name}`); created++;
      }
      setNotice({type:"success",message:`${created} dossier(s) candidat(s) importé(s) et synchronisé(s).`}); setCvImportOpen(false); onRefresh();
    } catch(caught){setNotice({type:"error",message:caught instanceof Error?caught.message:"L’import CV a échoué."});} finally {setSavingId("");}
  }

  async function createCohort(payload:{name:string;campaign:string;manager:string;startDate:string;objective:string;stage:string;candidateIds:string[]}) {
    setSavingId("cohort"); setNotice(null);
    try { for(const id of payload.candidateIds){ const candidate=candidates.find(c=>candidateId(c)===id); if(!candidate) continue; const response=await fetch(`/api/market-os/ambassadors/recruitment/${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({stage:stagePayload(payload.stage as StageKey),next_step:`Cohorte ${payload.name} · démarrage ${payload.startDate}`,interviewer:payload.manager,notes:appendOperationalMarker(candidate.notes,`[[COHORT:${payload.name}]]`,`Campagne: ${payload.campaign} | Responsable: ${payload.manager} | Démarrage: ${payload.startDate} | Objectif: ${payload.objective}`)})}); const result=await response.json().catch(()=>({})); if(!response.ok||result?.ok===false) throw new Error(result?.error||`Échec de synchronisation pour ${candidateName(candidate)}`); }
      setNotice({type:"success",message:`Cohorte « ${payload.name} » créée pour ${payload.candidateIds.length} candidat(s).`}); setCohortOpen(false); onRefresh();
    } catch(caught){setNotice({type:"error",message:caught instanceof Error?caught.message:"La création de cohorte a échoué."});} finally {setSavingId("");}
  }

  async function exportPipeline(config:{title:string;stage:string;format:string;columns:string[]}) {
    setSavingId("export"); setNotice(null);
    try { const rows=config.stage==="Tous"?candidates:candidates.filter(c=>stageLabel(stageOf(c))===config.stage); const map:Record<string,(c:AnyRecord)=>unknown>={"Nom":candidateName,"Téléphone":candidatePhone,"Email":candidateEmail,"Ville":candidateCity,"Source":candidateSource,"Étape":c=>stageLabel(stageOf(c)),"Score":candidateScore,"Manager":candidateManager,"Prochaine action":nextAction,"Documents":c=>{const d=documents(c); return d.known?`${d.complete}/${d.total}`:"Non renseigné";}}; const report=await fetch("/api/market-os/ambassadors/reports/export",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({report_type:"recruitment",title:config.title,generated_by:"Recruitment Pipeline"})}); const rp=await report.json().catch(()=>({})); if(!report.ok||rp?.ok===false) throw new Error(rp?.error||"L’audit du rapport a échoué."); let content=""; let mime=""; let ext=""; if(config.format==="json"){content=JSON.stringify(rows.map(c=>Object.fromEntries(config.columns.map(col=>[col,map[col]?.(c)??""]))),null,2);mime="application/json";ext="json";}else{const esc=(v:unknown)=>`"${String(v??"").replaceAll('"','""')}"`;content=[config.columns.map(esc).join(";"),...rows.map(c=>config.columns.map(col=>esc(map[col]?.(c)??"")).join(";"))].join("\n");mime="text/csv;charset=utf-8";ext="csv";} const blob=new Blob([content],{type:mime}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url;a.download=`angelcare-recrutement-${new Date().toISOString().slice(0,10)}.${ext}`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url); setNotice({type:"success",message:`Export ${ext.toUpperCase()} généré depuis ${rows.length} dossier(s) réel(s).`}); setExportOpen(false);
    } catch(caught){setNotice({type:"error",message:caught instanceof Error?caught.message:"L’export a échoué."});} finally {setSavingId("");}
  }

  const metricCards = [
    { label: "Nouveaux candidats", value: formatNumber(metrics.new), icon: UserPlus, tone: "bg-blue-50 text-blue-700", helper: "Dossiers à qualifier" },
    { label: "Contactés", value: formatNumber(metrics.contacted), icon: MessageCircle, tone: "bg-sky-50 text-sky-700", helper: "Premier contact réalisé" },
    { label: "Entretiens planifiés", value: formatNumber(metrics.interviews), icon: CalendarDays, tone: "bg-indigo-50 text-indigo-700", helper: "Étape entretien" },
    { label: "Validés", value: formatNumber(metrics.validated), icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700", helper: "Prêts pour intégration" },
    { label: "Rejetés", value: formatNumber(metrics.rejected), icon: X, tone: "bg-amber-50 text-amber-700", helper: "Décisions clôturées" },
    { label: "Délai moyen", value: `${metrics.averageDays.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} j`, icon: Clock3, tone: "bg-rose-50 text-rose-700", helper: "Calculé sur les dossiers datés" },
  ];

  return (
    <div data-ambassador-recruitment-route="talent-acquisition-command-v4" className="min-h-screen w-full bg-[#f7f9fc] text-slate-950">
      <div className="w-full space-y-4 px-5 py-5 xl:px-7 2xl:px-8">
        <header className="overflow-hidden border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.07)]">
          <div className="grid xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="border-l-4 border-[#cf2437] px-6 py-6 lg:px-7">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#164d7d]">
                ANGELCARE TALENT ACQUISITION · PIPELINE NATIONAL
              </p>
              <h1 className="mt-2 text-[32px] font-black tracking-tight text-slate-950">
                Commandement du recrutement ambassadeurs
              </h1>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                Qualifiez les candidatures réelles, sécurisez les entretiens, les décisions et le passage vers l’activation sans perdre le contexte de chaque profil.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button variant="primary" onClick={openCandidateModal}><Plus className="h-4 w-4" /> Nouveau candidat</Button>
                <Button onClick={() => { if (!candidates.length) { setNotice({ type: "info", message: "Créez d’abord un candidat réel pour planifier un entretien." }); return; } setInterviewCandidate(null); setInterviewOpen(true); }}><CalendarDays className="h-4 w-4" /> Planifier entretien</Button>
                <Button onClick={() => setCvImportOpen(true)}><Upload className="h-4 w-4" /> Importer CV</Button>
                <Button onClick={() => { if (!candidates.length) { setNotice({ type: "info", message: "Créez d’abord des candidats réels pour constituer une cohorte." }); return; } setCohortOpen(true); }}><Users className="h-4 w-4" /> Créer cohorte</Button>
                <Button onClick={() => setExportOpen(true)}><Download className="h-4 w-4" /> Exporter pipeline</Button>
                <Button variant="ghost" onClick={onRefresh} disabled={refreshing}><RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /></Button>
              </div>
            </div>

            <aside className="grid grid-cols-3 bg-[#082b4d] text-center xl:grid-cols-1 xl:text-left">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.17em] !text-[#9ec4e7]">Portefeuille actif</p>
                <p className="mt-1 text-3xl font-black tabular-nums !text-white">{candidates.length}</p>
                <p className="mt-1 text-[10px] font-semibold !text-[#d6e4f2]">candidature(s) synchronisée(s)</p>
              </div>
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.17em] !text-[#9ec4e7]">Entretiens</p>
                <p className="mt-1 text-3xl font-black tabular-nums !text-white">{metrics.interviews}</p>
                <p className="mt-1 text-[10px] font-semibold !text-[#d6e4f2]">dossier(s) à l’étape entretien</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.17em] !text-[#9ec4e7]">Profils validés</p>
                <p className="mt-1 text-3xl font-black tabular-nums !text-white">{metrics.validated}</p>
                <p className="mt-1 text-[10px] font-semibold !text-[#d6e4f2]">prêts pour le prochain contrôle</p>
              </div>
            </aside>
          </div>
        </header>

        {notice ? <NoticeBar notice={notice} onClose={() => setNotice(null)} /> : null}
        {error ? <NoticeBar notice={{ type: "error", message: error }} onClose={() => undefined} /> : null}
        {success ? <NoticeBar notice={{ type: "success", message: success }} onClose={() => undefined} /> : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metricCards.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
            <div className="grid min-w-[1040px] grid-cols-6 gap-3">
              {pipelineStages.map((stage) => (
                <PipelineColumn key={stage.key} stage={stage} candidates={grouped[stage.key]} onSelect={setSelectedCandidate} />
              ))}
            </div>
          </div>

          <aside className="grid gap-3 sm:grid-cols-3 2xl:grid-cols-1">
            <SidePanel title="À appeler aujourd’hui" action={<span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700">{callQueue.length}</span>}>
              <div className="space-y-2">
                {callQueue.map((candidate) => (
                  <button key={candidateId(candidate)} type="button" onClick={() => setSelectedCandidate(candidate)} className="flex w-full items-center gap-2 rounded-xl bg-slate-50 p-2 text-left hover:bg-blue-50">
                    <Avatar candidate={candidate} size="sm" />
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-900">{candidateName(candidate)}</p><p className="truncate text-[10px] font-bold text-slate-500">{candidateCity(candidate)} · {nextAction(candidate)}</p></div>
                    <Phone className="h-4 w-4 text-emerald-600" />
                  </button>
                ))}
                {!callQueue.length ? <EmptyMini label="Aucun appel prioritaire" /> : null}
              </div>
            </SidePanel>

            <SidePanel title="Entretiens à venir" action={<button type="button" onClick={() => { if (interviews[0]) { setInterviewCandidate(interviews[0].candidate); setInterviewOpen(true); } }} className="text-[10px] font-black text-blue-700">Voir calendrier</button>}>
              <div className="space-y-2">
                {interviews.map(({ candidate, at }) => (
                  <button key={candidateId(candidate)} type="button" onClick={() => setSelectedCandidate(candidate)} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-2 text-left hover:bg-indigo-50">
                    <div className="w-9 text-center"><p className="text-base font-black leading-none text-slate-900">{at.getDate()}</p><p className="mt-1 text-[9px] font-black uppercase text-slate-500">{at.toLocaleDateString("fr-FR", { month: "short" })}</p></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-900">{candidateName(candidate)}</p><p className="truncate text-[10px] font-bold text-slate-500">{at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {text(candidate.interview_format, "Format à confirmer")}</p></div>
                  </button>
                ))}
                {!interviews.length ? <EmptyMini label="Aucun entretien planifié" /> : null}
              </div>
            </SidePanel>

            <SidePanel title="Risques & documents" action={<span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">{risks.length}</span>}>
              <div className="space-y-2">
                {risks.map((risk) => (
                  <button key={`${candidateId(risk.candidate)}-${risk.label}`} type="button" onClick={() => setSelectedCandidate(risk.candidate)} className={cn("flex w-full items-start gap-2 rounded-xl border p-2 text-left", risk.tone === "rose" ? "border-rose-100 bg-rose-50" : "border-amber-100 bg-amber-50")}>
                    <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", risk.tone === "rose" ? "text-rose-600" : "text-amber-600")} />
                    <div className="min-w-0"><p className="truncate text-xs font-black text-slate-900">{candidateName(risk.candidate)}</p><p className="mt-0.5 text-[10px] font-bold text-slate-600">{risk.label} · {risk.detail}</p></div>
                  </button>
                ))}
                {!risks.length ? <EmptyMini label="Aucun risque détecté" /> : null}
              </div>
            </SidePanel>
          </aside>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Tous les candidats</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Dossiers réels synchronisés depuis le même workflow « Nouveau candidat ».</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[260px] flex-1 xl:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un candidat, ville, source…" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </label>
              <Select value={stageFilter} onChange={setStageFilter}><option>Tous</option>{[...pipelineStages.map((stage) => stage.label), "Rejeté"].map((label) => <option key={label}>{label}</option>)}</Select>
              <Select value={sourceFilter} onChange={setSourceFilter}><option>Toutes</option>{options.sources.map((item) => <option key={item}>{item}</option>)}</Select>
              <Select value={availabilityFilter} onChange={setAvailabilityFilter}><option>Toutes</option>{options.availability.map((item) => <option key={item}>{item}</option>)}</Select>
              <Select value={languageFilter} onChange={setLanguageFilter}><option>Toutes</option>{options.languages.map((item) => <option key={item}>{item}</option>)}</Select>
              <Select value={managerFilter} onChange={setManagerFilter}><option>Tous</option>{options.managers.map((item) => <option key={item}>{item}</option>)}</Select>
              <Button onClick={() => setNotice({ type: "info", message: "Les vues sauvegardées et filtres avancés seront activés avec le service de préférences opérateur." })}><SlidersHorizontal className="h-4 w-4" /> Plus de filtres</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1260px] w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                  <th className="px-4 py-3">Candidat</th><th className="px-4 py-3">Ville</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Disponibilité</th><th className="px-4 py-3">Langue</th><th className="px-4 py-3">Manager</th><th className="px-4 py-3">Étape</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Prochaine action</th><th className="px-4 py-3">Documents</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((candidate) => {
                  const id = candidateId(candidate);
                  const stage = stageOf(candidate);
                  const target = nextStage(stage);
                  const docs = documents(candidate);
                  const phone = candidatePhone(candidate);
                  const email = candidateEmail(candidate);
                  return (
                    <tr key={id || `${candidateName(candidate)}-${candidatePhone(candidate)}`} className="bg-white transition hover:bg-blue-50/50">
                      <td className="px-4 py-3"><button type="button" onClick={() => setSelectedCandidate(candidate)} className="flex items-center gap-3 text-left"><Avatar candidate={candidate} size="sm" /><div><p className="font-black text-slate-950">{candidateName(candidate)}</p><p className="mt-0.5 text-[11px] font-bold text-slate-500">{phone || email || "Contact à compléter"}</p></div></button></td>
                      <td className="px-4 py-3 font-bold text-slate-700">{candidateCity(candidate)}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{candidateSource(candidate)}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{candidateAvailability(candidate)}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{candidateLanguages(candidate)}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{candidateManager(candidate)}</td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", stageClass(stage))}>{stageLabel(stage)}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", candidateScore(candidate) >= 80 ? "bg-emerald-500" : candidateScore(candidate) >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${candidateScore(candidate)}%` }} /></div><span className="text-xs font-black text-slate-900">{candidateScore(candidate)}%</span></div></td>
                      <td className="px-4 py-3"><p className="font-bold text-slate-900">{nextAction(candidate)}</p><p className="mt-0.5 text-[11px] font-bold text-slate-500">{shortDate(dateValue(candidate, ["next_action_at", "follow_up_at", "interview_at", "due_at"]))}</p></td>
                      <td className="px-4 py-3">{docs.known ? <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", docs.missing ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>{docs.complete}/{docs.total}</span> : <span className="text-xs font-bold text-slate-400">—</span>}</td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-1.5">{phone ? <a href={`tel:${normalizePhone(phone)}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><Phone className="h-3.5 w-3.5" /></a> : null}{email ? <a href={`mailto:${email}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><Mail className="h-3.5 w-3.5" /></a> : null}<button type="button" onClick={() => { setInterviewCandidate(candidate); setInterviewOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-100 bg-indigo-50 text-indigo-700 hover:bg-violet-100"><CalendarDays className="h-3.5 w-3.5" /></button>{target ? <button type="button" disabled={savingId === id} onClick={() => moveStage(candidate, target)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2.5 text-[11px] font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50">{savingId === id ? "Sync…" : "Avancer"}<ChevronRight className="h-3.5 w-3.5" /></button> : null}<button type="button" onClick={() => setSelectedCandidate(candidate)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><MoreHorizontal className="h-3.5 w-3.5" /></button></div></td>
                    </tr>
                  );
                })}
                {!filteredCandidates.length ? (
                  <tr><td colSpan={11} className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><UserPlus className="h-5 w-5" /></div><h3 className="mt-4 text-lg font-black text-slate-950">Aucun candidat dans cette vue</h3><p className="mt-1 text-sm font-semibold text-slate-500">Le pipeline reste prêt. Créez un candidat réel ou ajustez les filtres.</p><Button variant="primary" className="mt-5" onClick={openCandidateModal}><Plus className="h-4 w-4" /> Nouveau candidat</Button></td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs font-bold text-slate-500">
            <span>{formatNumber(filteredCandidates.length)} candidat(s) affiché(s)</span>
            <span>{loading || refreshing ? "Synchronisation en cours…" : `Dernière source: pipeline recrutement réel`}</span>
          </div>
        </section>
      </div>

      {candidateOpen ? (
        <AmbassadorCandidateIntakeModal
          busy={candidateBusy}
          form={candidateForm}
          snapshot={snapshot}
          onChange={updateCandidate}
          onSubmit={submitCandidate}
          onClose={closeCandidateModal}
          feedback={candidateFeedback}
        />
      ) : null}
      {selectedCandidate ? <CandidateDrawer candidate={selectedCandidate} saving={savingId === candidateId(selectedCandidate)} onClose={() => setSelectedCandidate(null)} onMove={moveStage} onInterview={(candidate) => { setInterviewCandidate(candidate); setInterviewOpen(true); }} /> : null}
      {interviewOpen ? <InterviewModal candidates={candidates} initialCandidate={interviewCandidate} saving={Boolean(savingId)} onClose={() => { setInterviewOpen(false); setInterviewCandidate(null); }} onSubmit={scheduleInterview} /> : null}
      {cvImportOpen ? <ImportCvModal saving={savingId === "cv-import"} onClose={() => setCvImportOpen(false)} onSubmit={importCvCandidates} /> : null}
      {cohortOpen ? <CohortModal candidates={candidates} saving={savingId === "cohort"} onClose={() => setCohortOpen(false)} onSubmit={createCohort} /> : null}
      {exportOpen ? <ExportPipelineModal candidates={candidates} saving={savingId === "export"} onClose={() => setExportOpen(false)} onSubmit={exportPipeline} /> : null}
    </div>
  );
}
