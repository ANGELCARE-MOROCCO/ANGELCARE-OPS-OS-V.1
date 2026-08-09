"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  MapPinned,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  RadioTower,
  Search,
  ShieldCheck,
  Target,
  Users,
  X,
} from "lucide-react";
import type { AmbassadorWorkspaceSnapshot } from "@/lib/market-os/ambassadors/types";
import {
  AmbassadorMissionBuilderModal,
  defaultMission,
  type CockpitModalFeedback,
} from "../modals/AmbassadorCockpitActionModals";

type AnyRow = Record<string, any>;
type IconType = ComponentType<{ className?: string; size?: number }>;
type MissionModal = "assign" | "close" | "roadmap" | "export" | "progress" | "evidence" | "incident" | "validation" | null;

type Props = {
  snapshot: AmbassadorWorkspaceSnapshot;
  loading: boolean;
  refreshing: boolean;
  error?: string | null;
  success?: string | null;
  onRefresh: () => void;
  onCreateMission: () => void;
};

type MissionMeta = {
  assignedAmbassadors?: Array<{ ambassadorId: string; role: string; allocation?: number; shift?: string; note?: string }>;
  assignmentControl?: {
    strategy?: string;
    dispatchMode?: string;
    startDate?: string;
    reviewDate?: string;
    manager?: string;
    validator?: string;
    notificationChannel?: string;
    briefingMode?: string;
    capacityPolicy?: string;
    territoryPolicy?: string;
    primaryRole?: string;
    checkpoint?: string;
    note?: string;
    updatedAt?: string;
  };
  progress?: number;
  checkpoint?: string;
  nextCheckpoint?: string;
  metrics?: { leads?: number; conversions?: number; cost?: number; quality?: number };
  evidence?: Array<{ id: string; type: string; url: string; note?: string; createdAt: string }>;
  incidents?: Array<{ id: string; severity: string; category: string; owner?: string; description: string; openedAt: string; status: string; slaHours?: number }>;
  routeSheet?: { date: string; time: string; order: number; meetingPoint?: string; coordinator?: string; checkpointPolicy?: string };
  validation?: { reviewer?: string; decision?: string; score?: number; note?: string; decidedAt?: string };
  closeout?: { owner?: string; note?: string; completedAt?: string };
  campaign?: string;
  serviceLine?: string;
};

const META_START = "<!-- ANGELCARE_MISSION_META_START";
const META_END = "ANGELCARE_MISSION_META_END -->";

const statusOrder = ["planned", "active", "late", "validation", "completed"] as const;
type StatusGroup = (typeof statusOrder)[number];

const statusLabels: Record<StatusGroup, string> = {
  planned: "À démarrer",
  active: "En cours",
  late: "En retard",
  validation: "En validation",
  completed: "Terminées",
};

const statusTones: Record<StatusGroup, string> = {
  planned: "border-blue-200 bg-blue-50/60 text-blue-800",
  active: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
  late: "border-rose-200 bg-rose-50/60 text-rose-800",
  validation: "border-blue-200 bg-blue-50/70 text-blue-800",
  completed: "border-teal-200 bg-teal-50/60 text-teal-800",
};

const priorityRank: Record<string, number> = { critical: 5, urgent: 5, high: 4, medium: 3, normal: 2, low: 1 };

function text(...values: unknown[]) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function numberValue(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function isoDate(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function shortDate(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "Non renseignée";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function shortTime(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function isSameMonth(value: unknown, reference = new Date()) {
  const date = new Date(String(value || ""));
  return !Number.isNaN(date.getTime()) && date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
}

function dueTimestamp(mission: AnyRow) {
  const value = mission.due_date || mission.deadline || mission.end_at || mission.scheduled_at;
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function completedTimestamp(mission: AnyRow) {
  const value = mission.completed_at || mission.closed_at || mission.updated_at;
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function normalizeStatus(mission: AnyRow): StatusGroup {
  const raw = text(mission.status, mission.stage, mission.execution_status).toLowerCase().replace(/[\s-]+/g, "_");
  const due = dueTimestamp(mission);
  const finished = ["completed", "complete", "done", "closed", "finished", "terminee", "terminé", "termine"].includes(raw);
  if (finished || mission.completed_at) return "completed";
  if (["validation", "pending_validation", "review", "submitted", "to_validate", "en_validation"].includes(raw)) return "validation";
  if (due && due < Date.now() && !finished) return "late";
  if (["overdue", "late", "delayed", "en_retard"].includes(raw)) return "late";
  if (["in_progress", "active", "started", "ongoing", "running", "en_cours"].includes(raw)) return "active";
  return "planned";
}

function parseMeta(instructions: unknown): MissionMeta {
  const source = String(instructions || "");
  const start = source.indexOf(META_START);
  const end = source.indexOf(META_END);
  if (start < 0 || end < 0 || end <= start) return {};
  const jsonStart = source.indexOf("\n", start);
  if (jsonStart < 0) return {};
  const json = source.slice(jsonStart + 1, end).trim();
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function stripMeta(instructions: unknown) {
  const source = String(instructions || "");
  const start = source.indexOf(META_START);
  const end = source.indexOf(META_END);
  if (start < 0 || end < 0 || end <= start) return source.trim();
  return `${source.slice(0, start)}${source.slice(end + META_END.length)}`.trim();
}

function withMeta(mission: AnyRow, patch: Partial<MissionMeta>) {
  const base = parseMeta(mission.instructions);
  const merged: MissionMeta = {
    ...base,
    ...patch,
    metrics: patch.metrics ? { ...(base.metrics || {}), ...patch.metrics } : base.metrics,
  };
  const human = stripMeta(mission.instructions);
  return `${human}${human ? "\n\n" : ""}${META_START}\n${JSON.stringify(merged)}\n${META_END}`;
}

function missionTitle(mission: AnyRow) {
  return text(mission.title, mission.name, mission.mission_name, "Mission sans titre");
}

function missionCode(mission: AnyRow) {
  const explicit = text(mission.code, mission.mission_code, mission.reference);
  if (explicit) return explicit;
  const id = String(mission.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return id ? `MIS-${id}` : "MISSION";
}

function priorityLabel(value: unknown) {
  const raw = text(value, "normal").toLowerCase();
  if (["critical", "urgent", "critique"].includes(raw)) return "Critique";
  if (["high", "haute", "élevée", "elevee"].includes(raw)) return "Haute";
  if (["low", "faible"].includes(raw)) return "Faible";
  return "Normale";
}

function proofReady(mission: AnyRow, meta = parseMeta(mission.instructions)) {
  const status = text(mission.proof_status).toLowerCase();
  return Boolean(mission.evidence_url || meta.evidence?.length || ["approved", "verified", "complete", "completed", "validated"].includes(status));
}

function incidentRows(missions: AnyRow[]) {
  return missions.flatMap((mission) => {
    const meta = parseMeta(mission.instructions);
    const stored = Array.isArray(meta.incidents) ? meta.incidents : [];
    const native = mission.incident_status || mission.incident_severity || mission.incident_note
      ? [{
          id: `native-${mission.id}`,
          severity: text(mission.incident_severity, "medium"),
          category: text(mission.incident_type, "Incident mission"),
          owner: text(mission.incident_owner),
          description: text(mission.incident_note, "Incident déclaré sur la mission"),
          openedAt: text(mission.incident_opened_at, mission.updated_at, mission.created_at),
          status: text(mission.incident_status, "open"),
          slaHours: numberValue(mission.incident_sla_hours, 0),
        }]
      : [];
    return [...stored, ...native].map((incident) => ({ ...incident, mission }));
  });
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

// PAGE4B_EXACT_MISSION_MODAL_HELPERS_START
const missionRegionsByCity: Record<string, string> = {
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

function exactMissionMissingFields(form: typeof defaultMission) {
  const missing: string[] = [];
  if (!form.title.trim()) missing.push("Titre de mission");
  if (!form.campaign.trim()) missing.push("Campagne");
  if (!form.objective.trim()) missing.push("Objectif principal");
  if (!form.leads_expected.trim()) missing.push("Leads attendus");
  if (!form.conversations_expected.trim()) missing.push("Conversations attendues");
  if (!form.conversions_potential.trim()) missing.push("Conversions potentielles");
  if (!form.priority.trim()) missing.push("Priorité");
  if (!form.deadline.trim()) missing.push("Deadline");
  if (!form.sla_closing.trim()) missing.push("SLA de clôture");
  if (!form.city.trim()) missing.push("Ville");
  if (!form.zone.trim()) missing.push("Zone");
  if (!form.territory.trim()) missing.push("Territoire");
  if (!form.ambassador_id.trim()) missing.push("Ambassadeur assigné");
  if (!form.channel.trim()) missing.push("Canal");
  if (!form.script.trim()) missing.push("Script conseillé");
  if (!form.playbook.trim()) missing.push("Playbook");
  if (!form.proof_expected.trim()) missing.push("Preuve attendue");
  if (!form.success_criteria.trim()) missing.push("Critères de réussite");
  if (!form.validator.trim()) missing.push("Responsable validation");
  if (!form.escalation_rule.trim()) missing.push("Escalade");
  return missing;
}
// PAGE4B_EXACT_MISSION_MODAL_HELPERS_END

export default function AmbassadorMissionsRoute({ snapshot, loading, refreshing, error, success, onRefresh }: Props) {
  const missions = useMemo(() => (Array.isArray(snapshot.missions) ? snapshot.missions.filter((item) => !item.archived_at) : []), [snapshot.missions]);
  const ambassadors = useMemo(() => (Array.isArray(snapshot.ambassadors) ? snapshot.ambassadors.filter((item) => !item.archived_at) : []), [snapshot.ambassadors]);
  const territories = useMemo(() => (Array.isArray(snapshot.territories) ? snapshot.territories.filter((item) => !item.archived_at) : []), [snapshot.territories]);

  const ambassadorMap = useMemo(() => new Map(ambassadors.map((item) => [String(item.id), item])), [ambassadors]);
  const territoryMap = useMemo(() => new Map(territories.map((item) => [String(item.id), item])), [territories]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [ambassadorFilter, setAmbassadorFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [proofFilter, setProofFilter] = useState("all");
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [modal, setModal] = useState<MissionModal>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  // PAGE4B_EXACT_MISSION_MODAL_STATE_START
  const [createMissionOpen, setCreateMissionOpen] = useState(false);
  const [createMissionBusy, setCreateMissionBusy] = useState(false);
  const [createMissionFeedback, setCreateMissionFeedback] = useState<CockpitModalFeedback | null>(null);
  const [createMissionForm, setCreateMissionForm] = useState(() => ({ ...defaultMission }));
  // PAGE4B_EXACT_MISSION_MODAL_STATE_END

  const selectedMission = useMemo(() => missions.find((item) => String(item.id) === selectedMissionId) || null, [missions, selectedMissionId]);

  useEffect(() => {
    if (selectedMissionId && !missions.some((item) => String(item.id) === selectedMissionId)) setSelectedMissionId(null);
  }, [missions, selectedMissionId]);

  const ambassadorName = (id: unknown) => {
    const record = ambassadorMap.get(String(id || ""));
    return text(record?.full_name, record?.name, record?.candidate_name, "Non affecté");
  };

  const cityOptions = useMemo(() => Array.from(new Set(missions.map((item) => text(item.city, territoryMap.get(String(item.territory_id || ""))?.city)).filter(Boolean))).sort(), [missions, territoryMap]);

  const filteredMissions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return missions.filter((mission) => {
      const meta = parseMeta(mission.instructions);
      const group = normalizeStatus(mission);
      const haystack = [missionTitle(mission), missionCode(mission), mission.city, mission.region, mission.mission_type, mission.description, ambassadorName(mission.ambassador_id), meta.campaign, meta.serviceLine].join(" ").toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (statusFilter !== "all" && group !== statusFilter) return false;
      if (cityFilter !== "all" && text(mission.city) !== cityFilter) return false;
      if (ambassadorFilter !== "all" && String(mission.ambassador_id || "") !== ambassadorFilter && !meta.assignedAmbassadors?.some((item) => item.ambassadorId === ambassadorFilter)) return false;
      if (priorityFilter !== "all" && text(mission.priority, "normal").toLowerCase() !== priorityFilter) return false;
      if (proofFilter === "ready" && !proofReady(mission, meta)) return false;
      if (proofFilter === "missing" && proofReady(mission, meta)) return false;
      return true;
    });
  }, [missions, query, statusFilter, cityFilter, ambassadorFilter, priorityFilter, proofFilter, ambassadorMap]);

  const grouped = useMemo(() => Object.fromEntries(statusOrder.map((status) => [status, filteredMissions.filter((mission) => normalizeStatus(mission) === status)])) as Record<StatusGroup, AnyRow[]>, [filteredMissions]);
  const incidents = useMemo(() => incidentRows(missions), [missions]);
  const openIncidents = useMemo(() => incidents.filter((item) => !["closed", "resolved", "completed"].includes(text(item.status).toLowerCase())), [incidents]);

  const kpis = useMemo(() => {
    const active = missions.filter((item) => normalizeStatus(item) === "active").length;
    const planned = missions.filter((item) => normalizeStatus(item) === "planned").length;
    const late = missions.filter((item) => normalizeStatus(item) === "late").length;
    const validation = missions.filter((item) => normalizeStatus(item) === "validation").length;
    const completedMtd = missions.filter((item) => normalizeStatus(item) === "completed" && isSameMonth(item.completed_at || item.updated_at)).length;
    const coveredTerritories = new Set(missions.filter((item) => ["active", "planned", "validation"].includes(normalizeStatus(item))).map((item) => text(item.territory_id, item.city)).filter(Boolean));
    const coverage = territories.length ? Math.round((Array.from(coveredTerritories).filter((key) => territories.some((territory) => String(territory.id) === key)).length / territories.length) * 100) : 0;
    return { active, planned, late, validation, completedMtd, coverage, incidents: openIncidents.length };
  }, [missions, territories, openIncidents.length]);

  const priorities = useMemo(() => missions
    .filter((mission) => normalizeStatus(mission) !== "completed")
    .map((mission) => {
      const meta = parseMeta(mission.instructions);
      const due = dueTimestamp(mission);
      const reasons: string[] = [];
      if (normalizeStatus(mission) === "late") reasons.push("Échéance dépassée");
      if (!mission.ambassador_id) reasons.push("Aucun ambassadeur affecté");
      if (!proofReady(mission, meta)) reasons.push("Preuve non prête");
      if (meta.incidents?.some((incident) => !["closed", "resolved"].includes(text(incident.status).toLowerCase()))) reasons.push("Incident ouvert");
      const priorityWeight = (normalizeStatus(mission) === "late" ? 1000 : 0) + (priorityRank[text(mission.priority).toLowerCase()] || 2) * 100 + (due ? Math.max(0, 30 - Math.floor((due - Date.now()) / 86400000)) : 0);
      return { mission, reasons, priorityWeight };
    })
    .filter((item) => item.reasons.length)
    .sort((a, b) => b.priorityWeight - a.priorityWeight)
    .slice(0, 6), [missions]);

  const roadMap = useMemo(() => missions
    .map((mission) => ({ mission, route: parseMeta(mission.instructions).routeSheet }))
    .filter((item) => item.route && item.route.date === new Date().toISOString().slice(0, 10))
    .sort((a, b) => text(a.route?.time).localeCompare(text(b.route?.time))), [missions]);

  const cityCoverage = useMemo(() => {
    const map = new Map<string, { city: string; active: number; total: number; late: number; completed: number; ambassadors: Set<string> }>();
    for (const mission of missions) {
      const city = text(mission.city, territoryMap.get(String(mission.territory_id || ""))?.city, "Non renseignée");
      const current = map.get(city) || { city, active: 0, total: 0, late: 0, completed: 0, ambassadors: new Set<string>() };
      current.total += 1;
      const group = normalizeStatus(mission);
      if (["active", "planned", "validation"].includes(group)) current.active += 1;
      if (group === "late") current.late += 1;
      if (group === "completed") current.completed += 1;
      if (mission.ambassador_id) current.ambassadors.add(String(mission.ambassador_id));
      map.set(city, current);
    }
    return Array.from(map.values()).sort((a, b) => b.active - a.active || b.total - a.total).slice(0, 7);
  }, [missions, territoryMap]);

  const performance = useMemo(() => {
    const completed = missions.filter((item) => normalizeStatus(item) === "completed");
    const metrics = missions.map((item) => parseMeta(item.instructions).metrics || {});
    const leads = metrics.reduce((sum, item) => sum + numberValue(item.leads), 0);
    const conversions = metrics.reduce((sum, item) => sum + numberValue(item.conversions), 0);
    const cost = metrics.reduce((sum, item) => sum + numberValue(item.cost), 0);
    const qualityRows = metrics.map((item) => numberValue(item.quality)).filter((value) => value > 0);
    const onTime = completed.filter((item) => {
      const due = dueTimestamp(item);
      const done = completedTimestamp(item);
      return Boolean(due && done && done <= due);
    }).length;
    const proofCompliant = completed.filter((item) => proofReady(item)).length;
    return {
      completionRate: missions.length ? Math.round((completed.length / missions.length) * 100) : 0,
      leadsPerMission: missions.length ? leads / missions.length : 0,
      conversionRate: leads ? (conversions / leads) * 100 : 0,
      costPerLead: leads ? cost / leads : 0,
      quality: qualityRows.length ? qualityRows.reduce((sum, value) => sum + value, 0) / qualityRows.length : 0,
      onTimeRate: completed.length ? Math.round((onTime / completed.length) * 100) : 0,
      proofRate: completed.length ? Math.round((proofCompliant / completed.length) * 100) : 0,
      incidentRate: missions.length ? Math.round((openIncidents.length / missions.length) * 100) : 0,
    };
  }, [missions, openIncidents.length]);

  // PAGE4B_EXACT_MISSION_MODAL_FUNCTIONS_START
  function openExactMissionBuilder() {
    const firstAmbassador = ambassadors[0];
    const firstTerritory = territories[0];
    const city = text(firstAmbassador?.city, firstTerritory?.city, defaultMission.city);
    setCreateMissionFeedback(null);
    setCreateMissionForm({
      ...defaultMission,
      city,
      ambassador_id: text(firstAmbassador?.id),
      territory: text(firstTerritory?.id),
      zone: text(firstTerritory?.zone, firstTerritory?.name, defaultMission.zone),
    });
    setCreateMissionOpen(true);
  }

  function updateExactMission(key: string, value: string) {
    setCreateMissionFeedback(null);
    setCreateMissionForm((current) => {
      const next: Record<string, string> = { ...current, [key]: value };
      if (key === "city") next.region = missionRegionsByCity[value] || text((current as AnyRow).region);
      if (key === "deadline") next.due_date = value;
      if (key === "territory") next.territory_id = value;
      if (key === "channel") next.execution_channel = value;
      if (key === "playbook") next.support_playbook = value;
      if (key === "operator_notes") next.operator_note = value;
      if (key === "overloaded_warning") next.workload_warning = value;
      if (key === "success_criteria") next.success = value;
      return next as typeof defaultMission;
    });
  }

  async function submitExactMission(mode: "draft" | "create" | "notify") {
    setCreateMissionBusy(true);
    setCreateMissionFeedback(null);
    try {
      const missing = exactMissionMissingFields(createMissionForm);
      if (mode !== "draft" && missing.length) {
        throw new Error(`Mission incomplète: ${missing.slice(0, 4).join(", ")}`);
      }
      const response = await fetch("/api/market-os/ambassadors/missions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title: createMissionForm.title.trim() || (mode === "draft" ? "Brouillon mission terrain" : createMissionForm.title.trim()),
          mission_type: createMissionForm.mission_type,
          priority: createMissionForm.priority,
          status: mode === "draft" ? "draft" : "assigned",
          city: createMissionForm.city,
          region: (createMissionForm as AnyRow).region || missionRegionsByCity[createMissionForm.city] || null,
          ambassador_id: createMissionForm.ambassador_id || null,
          territory_id: createMissionForm.territory || null,
          due_date: createMissionForm.deadline || null,
          proof_status: "required",
          description: `${createMissionForm.campaign} — ${createMissionForm.objective}`,
          instructions: [
            `Scénario: ${createMissionForm.title}`,
            `Campagne: ${createMissionForm.campaign}`,
            `Canal d'exécution: ${createMissionForm.channel}`,
            `Objectif mesurable: ${createMissionForm.objective}`,
            `Objectif secondaire: ${createMissionForm.objective_secondary}`,
            `Objectifs quantifiés: leads ${createMissionForm.leads_expected}, conversations ${createMissionForm.conversations_expected}, conversions ${createMissionForm.conversions_potential}`,
            `Critères de réussite: ${createMissionForm.success_criteria}`,
            `Preuve attendue: ${createMissionForm.proof_expected}`,
            `Script terrain: ${createMissionForm.script}`,
            `Playbook associé: ${createMissionForm.playbook}`,
            `SLA de clôture: ${createMissionForm.sla_closing}`,
            `Responsable validation: ${createMissionForm.validator}`,
            `Escalade: ${createMissionForm.escalation_rule}`,
            `Zone: ${createMissionForm.zone}`,
            `Territoire: ${createMissionForm.territory}`,
            `Charge / vigilance: ${createMissionForm.overloaded_warning}`,
            `Note d'affectation: ${createMissionForm.assignment_notes}`,
            `Note opérateur: ${createMissionForm.operator_notes}`,
            `Notification: ${mode === "notify" ? "Demandée — " + createMissionForm.notify_ambassador : "Non demandée"}`,
          ].filter(Boolean).join("\n"),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || response.statusText || "Création mission impossible");
      setCreateMissionFeedback({
        tone: "success",
        message: mode === "draft"
          ? "Brouillon de mission enregistré dans la source réelle."
          : mode === "notify"
            ? "Mission créée et demande de notification enregistrée."
            : "Mission terrain créée, affectée et synchronisée.",
      });
      onRefresh();
    } catch (caught) {
      setCreateMissionFeedback({ tone: "error", message: caught instanceof Error ? caught.message : "Création mission impossible" });
    } finally {
      setCreateMissionBusy(false);
    }
  }
  // PAGE4B_EXACT_MISSION_MODAL_FUNCTIONS_END

  async function patchMission(mission: AnyRow, patch: AnyRow, positiveMessage: string) {
    if (!mission?.id) return false;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/market-os/ambassadors/missions/${mission.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || response.statusText || "Synchronisation impossible");
      setFeedback({ tone: "success", text: positiveMessage });
      onRefresh();
      return true;
    } catch (caught) {
      setFeedback({ tone: "error", text: caught instanceof Error ? caught.message : "Synchronisation impossible" });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openMissionModal(kind: Exclude<MissionModal, null>, mission?: AnyRow | null) {
    if (mission?.id) setSelectedMissionId(String(mission.id));
    setFeedback(null);
    setModal(kind);
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f8fc] text-slate-950">
      <div className="w-full px-4 py-5 sm:px-5 xl:px-6 2xl:px-8">
        <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] xl:px-7">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                <MapPinned size={13} /> Centre d’exécution terrain
              </div>
              <h1 className="mt-3 text-[30px] font-black tracking-[-0.035em] text-slate-950 xl:text-[36px]">Missions terrain</h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.17em] text-blue-700">National Field Dispatch Command</p>
              <p className="mt-2 max-w-[940px] text-sm font-semibold leading-6 text-slate-600">Pilotez l’affectation, l’exécution, les preuves, les incidents, la validation et la clôture de chaque mission ambassadeur depuis une seule source opérationnelle.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <HeaderButton primary icon={Plus} onClick={openExactMissionBuilder}>Créer mission</HeaderButton>
              <HeaderButton icon={Users} onClick={() => openMissionModal("assign")}>Affecter ambassadeur</HeaderButton>
              <HeaderButton icon={CheckCircle2} onClick={() => openMissionModal("close")}>Clôturer mission</HeaderButton>
              <HeaderButton icon={Calendar} onClick={() => openMissionModal("roadmap")}>Feuille de route</HeaderButton>
              <HeaderButton icon={Download} onClick={() => openMissionModal("export")}>Exporter</HeaderButton>
              <button type="button" onClick={onRefresh} disabled={refreshing} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50" title="Actualiser les données réelles">
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </section>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {success ? <Notice tone="success">{success}</Notice> : null}
        {feedback ? <Notice tone={feedback.tone}>{feedback.text}</Notice> : null}

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_1.35fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 p-5 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.26),transparent_68%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[0.17em] text-blue-200">Posture de dispatch</span><RadioTower size={18} className="text-blue-300" /></div>
              <div className="mt-5 flex items-end gap-3"><strong className="text-5xl font-black tabular-nums">{kpis.active}</strong><span className="pb-1 text-sm font-bold text-slate-300">mission(s) en exécution</span></div>
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                <DispatchDatum label="À lancer" value={kpis.planned} onClick={() => setStatusFilter("planned")} />
                <DispatchDatum label="En retard" value={kpis.late} danger onClick={() => setStatusFilter("late")} />
                <DispatchDatum label="Incidents" value={kpis.incidents} warning onClick={() => document.getElementById("mission-incidents")?.scrollIntoView({ behavior: "smooth" })} />
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Flux opérationnel</p><h2 className="mt-1 text-lg font-black text-slate-950">De l’affectation à la preuve</h2></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">{missions.length} au registre</span></div>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-5">
              {[{ key: "planned", label: "Planifiées", value: kpis.planned }, { key: "active", label: "En cours", value: kpis.active }, { key: "late", label: "En retard", value: kpis.late }, { key: "validation", label: "Preuve / validation", value: kpis.validation }, { key: "completed", label: "Terminées MTD", value: kpis.completedMtd }].map((item) => <button type="button" key={item.key} onClick={() => setStatusFilter(item.key as StatusGroup)} className="group text-left"><span className="block text-2xl font-black tabular-nums text-slate-950 group-hover:text-blue-700">{item.value}</span><span className="mt-1 block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{item.label}</span><span className={`mt-3 block h-1.5 rounded-full ${item.key === "late" ? "bg-rose-500" : item.key === "active" || item.key === "completed" ? "bg-emerald-500" : "bg-blue-600"}`} /></button>)}
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><Target size={20} className="text-blue-700" /><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">Données réelles</span></div>
            <div className="mt-5 text-4xl font-black tabular-nums text-slate-950">{kpis.coverage}%</div>
            <p className="mt-1 text-sm font-black text-slate-700">Couverture territoriale</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{territories.length} territoire(s) actuellement représenté(s) par les missions synchronisées.</p>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm xl:p-5">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Cycle d’exécution des missions</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Les cartes ci-dessous proviennent exclusivement des missions synchronisées.</p>
            </div>
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => setStatusFilter("all")} className={`rounded-xl px-3 py-2 text-xs font-black ${statusFilter === "all" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Tous</button>
              {statusOrder.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-xl px-3 py-2 text-xs font-black ${statusFilter === status ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>{statusLabels[status]}</button>)}
            </div>
          </div>
          <div className="grid gap-3 xl:grid-cols-5">
            {statusOrder.map((status) => (
              <LifecycleColumn key={status} status={status} missions={grouped[status]} ambassadorName={ambassadorName} onSelect={(mission) => setSelectedMissionId(String(mission.id))} />
            ))}
          </div>
        </section>

        <section className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                <div>
                  <h2 className="text-lg font-black">Registre opérationnel des missions</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Recherche, tri, preuve, équipe et actions d’exécution sur les enregistrements réels.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Statut" options={[{ value: "all", label: "Tous les statuts" }, ...statusOrder.map((status) => ({ value: status, label: statusLabels[status] }))]} />
                  <FilterSelect value={cityFilter} onChange={setCityFilter} label="Ville" options={[{ value: "all", label: "Toutes les villes" }, ...cityOptions.map((city) => ({ value: city, label: city }))]} />
                  <FilterSelect value={ambassadorFilter} onChange={setAmbassadorFilter} label="Ambassadeur" options={[{ value: "all", label: "Tous les ambassadeurs" }, ...ambassadors.map((item) => ({ value: String(item.id), label: text(item.full_name, item.name, "Ambassadeur") }))]} />
                  <FilterSelect value={priorityFilter} onChange={setPriorityFilter} label="Priorité" options={[{ value: "all", label: "Toutes priorités" }, { value: "urgent", label: "Urgente" }, { value: "high", label: "Haute" }, { value: "normal", label: "Normale" }, { value: "low", label: "Faible" }]} />
                  <FilterSelect value={proofFilter} onChange={setProofFilter} label="Preuve" options={[{ value: "all", label: "Toutes preuves" }, { value: "ready", label: "Preuve prête" }, { value: "missing", label: "Preuve manquante" }]} />
                </div>
              </div>
              <label className="mt-4 flex h-11 max-w-[560px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 focus-within:border-blue-300 focus-within:bg-white">
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400" placeholder="Rechercher mission, ville, campagne, ambassadeur…" />
              </label>
            </div>
            <MissionTable loading={loading} missions={filteredMissions} ambassadorName={ambassadorName} onSelect={(mission) => setSelectedMissionId(String(mission.id))} onAction={openMissionModal} />
          </div>

          <aside className="grid content-start gap-4">
            <CoveragePanel rows={cityCoverage} />
            <CompactPanel title="Contrôles immédiats" icon={ShieldCheck}>
              <ControlRow label="Sans ambassadeur" value={missions.filter((item) => !item.ambassador_id && normalizeStatus(item) !== "completed").length} tone="rose" />
              <ControlRow label="Preuves manquantes" value={missions.filter((item) => normalizeStatus(item) !== "completed" && !proofReady(item)).length} tone="amber" />
              <ControlRow label="En validation" value={kpis.validation} tone="blue" />
              <ControlRow label="Incidents ouverts" value={openIncidents.length} tone="rose" />
            </CompactPanel>
          </aside>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
          <CompactPanel title="Priorités du jour" icon={Target} action="Voir registre" onAction={() => document.getElementById("mission-registry")?.scrollIntoView({ behavior: "smooth" })}>
            {priorities.length ? priorities.map(({ mission, reasons }) => <PriorityRow key={mission.id} mission={mission} reasons={reasons} ambassador={ambassadorName(mission.ambassador_id)} onClick={() => setSelectedMissionId(String(mission.id))} />) : <PanelEmpty text="Aucune priorité critique détectée sur les missions réelles." />}
          </CompactPanel>

          <CompactPanel title="Feuille de route — Aujourd’hui" icon={Calendar} action="Construire" onAction={() => openMissionModal("roadmap")}>
            {roadMap.length ? roadMap.map(({ mission, route }) => <RoadRow key={mission.id} mission={mission} route={route!} ambassador={ambassadorName(mission.ambassador_id)} />) : <PanelEmpty text="Aucune étape de feuille de route enregistrée pour aujourd’hui." />}
          </CompactPanel>

          <div id="mission-incidents"><CompactPanel title="File d’incidents / escalades" icon={AlertTriangle} action="Créer incident" onAction={() => openMissionModal("incident")}>
            {openIncidents.length ? openIncidents.slice(0, 6).map((item) => <IncidentRow key={`${item.mission.id}-${item.id}`} item={item} onClick={() => setSelectedMissionId(String(item.mission.id))} />) : <PanelEmpty text="Aucun incident ouvert n’est synchronisé." />}
          </CompactPanel></div>

          <PerformancePanel performance={performance} />
        </section>
      </div>

      {/* PAGE4B_EXACT_MISSION_MODAL_RENDER_START */}
      {createMissionOpen ? (
        <AmbassadorMissionBuilderModal
          busy={createMissionBusy}
          form={createMissionForm}
          snapshot={snapshot}
          onChange={updateExactMission}
          onSubmit={submitExactMission}
          onClose={() => { setCreateMissionOpen(false); setCreateMissionFeedback(null); }}
          feedback={createMissionFeedback}
        />
      ) : null}
      {/* PAGE4B_EXACT_MISSION_MODAL_RENDER_END */}

      {selectedMission ? <MissionDrawer mission={selectedMission} meta={parseMeta(selectedMission.instructions)} ambassadorMap={ambassadorMap} territoryMap={territoryMap} onClose={() => setSelectedMissionId(null)} onAction={openMissionModal} onPatch={patchMission} busy={busy} /> : null}

      {modal === "assign" ? <AssignMissionModal missions={missions} ambassadors={ambassadors} selectedMission={selectedMission} busy={busy} feedback={feedback} onClose={() => setModal(null)} onSubmit={patchMission} /> : null}
      {modal === "close" ? <CloseMissionModal missions={missions} selectedMission={selectedMission} busy={busy} feedback={feedback} onClose={() => setModal(null)} onSubmit={patchMission} /> : null}
      {modal === "roadmap" ? <RoadmapModal missions={missions} ambassadorName={ambassadorName} busy={busy} feedback={feedback} onClose={() => setModal(null)} onRefresh={onRefresh} setBusy={setBusy} setFeedback={setFeedback} /> : null}
      {modal === "export" ? <ExportModal missions={missions} ambassadors={ambassadorMap} busy={busy} feedback={feedback} onClose={() => setModal(null)} setBusy={setBusy} setFeedback={setFeedback} /> : null}
      {modal === "progress" ? <ProgressModal missions={missions} selectedMission={selectedMission} busy={busy} feedback={feedback} onClose={() => setModal(null)} onSubmit={patchMission} /> : null}
      {modal === "evidence" ? <EvidenceModal missions={missions} selectedMission={selectedMission} busy={busy} feedback={feedback} onClose={() => setModal(null)} onSubmit={patchMission} /> : null}
      {modal === "incident" ? <IncidentModal missions={missions} selectedMission={selectedMission} busy={busy} feedback={feedback} onClose={() => setModal(null)} onSubmit={patchMission} /> : null}
      {modal === "validation" ? <ValidationModal missions={missions} selectedMission={selectedMission} busy={busy} feedback={feedback} onClose={() => setModal(null)} onSubmit={patchMission} /> : null}
    </div>
  );
}

function HeaderButton({ icon: Icon, children, onClick, primary = false }: { icon: IconType; children: ReactNode; onClick: () => void; primary?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm transition ${primary ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"}`}><Icon size={17} />{children}</button>;
}

function Notice({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{children}</div>;
}

function DispatchDatum({ label, value, danger = false, warning = false, onClick }: { label: string; value: number; danger?: boolean; warning?: boolean; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-xl p-2 text-left transition hover:bg-white/5"><span className={`block text-xl font-black tabular-nums ${danger ? "text-rose-300" : warning ? "text-amber-300" : "text-white"}`}>{value}</span><span className="mt-1 block text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</span></button>;
}

function LifecycleColumn({ status, missions, ambassadorName, onSelect }: { status: StatusGroup; missions: AnyRow[]; ambassadorName: (id: unknown) => string; onSelect: (mission: AnyRow) => void }) {
  return <div className={`min-h-[260px] rounded-[22px] border p-3 ${statusTones[status]}`}>
    <div className="flex items-center justify-between"><div><div className="text-sm font-black !text-black">{statusLabels[status]}</div><div className="mt-0.5 text-[10px] font-bold text-slate-500">Cycle mission</div></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm">{missions.length}</span></div>
    <div className="mt-3 space-y-2">
      {missions.slice(0, 4).map((mission) => <button key={mission.id} type="button" onClick={() => onSelect(mission)} className="w-full rounded-2xl border border-white/80 bg-white p-3 text-left shadow-sm transition hover:border-blue-200">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-xs font-black text-slate-950">{missionCode(mission)} · {missionTitle(mission)}</div><div className="mt-1 truncate text-[10px] font-semibold text-slate-500">{text(mission.city, "Ville non renseignée")} · {ambassadorName(mission.ambassador_id)}</div></div><span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">{priorityLabel(mission.priority)}</span></div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500"><span>{shortDate(mission.due_date)}</span><span>{proofReady(mission) ? "Preuve prête" : "Preuve à fournir"}</span></div>
      </button>)}
      {!missions.length ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-3 py-8 text-center text-[11px] font-bold text-slate-400">Aucune mission réelle dans cette étape</div> : null}
      {missions.length > 4 ? <div className="px-2 pt-1 text-[10px] font-black text-slate-600">+ {missions.length - 4} autre(s) mission(s)</div> : null}
    </div>
  </div>;
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: Array<{ value: string; label: string }> }) {
  return <label className="relative inline-flex h-10 min-w-[150px] items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none bg-transparent pr-6 outline-none">{options.map((option) => <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" /></label>;
}

function MissionTable({ loading, missions, ambassadorName, onSelect, onAction }: { loading: boolean; missions: AnyRow[]; ambassadorName: (id: unknown) => string; onSelect: (mission: AnyRow) => void; onAction: (kind: Exclude<MissionModal, null>, mission?: AnyRow | null) => void }) {
  return <div id="mission-registry" className="overflow-x-auto">
    <table className="w-full min-w-[1380px] text-left text-xs">
      <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-5 py-3">Mission</th><th>Ville / territoire</th><th>Ambassadeur principal</th><th>Équipe</th><th>Campagne / service</th><th>Statut</th><th>Priorité</th><th>Échéance</th><th>Résultats</th><th>Preuve</th><th>Qualité</th><th>Actions</th></tr></thead>
      <tbody>
        {missions.map((mission) => {
          const meta = parseMeta(mission.instructions);
          const group = normalizeStatus(mission);
          const teamCount = Math.max(1, meta.assignedAmbassadors?.length || (mission.ambassador_id ? 1 : 0));
          return <tr key={mission.id} className="border-t border-slate-100 align-middle transition hover:bg-blue-50/40">
            <td className="px-5 py-4"><button type="button" onClick={() => onSelect(mission)} className="max-w-[250px] text-left"><div className="truncate font-black text-slate-950">{missionCode(mission)} · {missionTitle(mission)}</div><div className="mt-1 truncate text-[10px] font-semibold text-slate-500">{text(mission.mission_type, mission.description, "Mission terrain")}</div></button></td>
            <td><div className="font-bold text-slate-800">{text(mission.city, "Non renseignée")}</div><div className="mt-1 text-[10px] text-slate-500">{text(mission.region, "Territoire non renseigné")}</div></td>
            <td className="font-bold text-slate-800">{ambassadorName(mission.ambassador_id)}</td>
            <td><span className="rounded-full bg-slate-100 px-2.5 py-1 font-black text-slate-700">{teamCount}</span></td>
            <td><div className="font-bold text-slate-800">{text(meta.campaign, mission.campaign, "—")}</div><div className="mt-1 text-[10px] text-slate-500">{text(meta.serviceLine, mission.service_line, "—")}</div></td>
            <td><StatusPill group={group} /></td>
            <td><PriorityPill value={mission.priority} /></td>
            <td className={group === "late" ? "font-black text-rose-700" : "font-bold text-slate-700"}>{shortDate(mission.due_date)}</td>
            <td><div className="font-black text-slate-800">{numberValue(meta.metrics?.leads)} lead(s)</div><div className="mt-1 text-[10px] text-slate-500">{numberValue(meta.metrics?.conversions)} conversion(s)</div></td>
            <td>{proofReady(mission, meta) ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-black text-emerald-700"><CheckCircle2 size={12} /> Prête</span> : <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-black text-amber-700"><AlertTriangle size={12} /> Manquante</span>}</td>
            <td className="font-black text-slate-800">{numberValue(meta.metrics?.quality) ? `${numberValue(meta.metrics?.quality).toFixed(1)}/5` : "—"}</td>
            <td><div className="flex items-center gap-1"><IconButton icon={Eye} label="Ouvrir dossier" onClick={() => onSelect(mission)} /><IconButton icon={Users} label="Affecter" onClick={() => onAction("assign", mission)} /><IconButton icon={MoreHorizontal} label="Progression" onClick={() => onAction("progress", mission)} /></div></td>
          </tr>;
        })}
      </tbody>
    </table>
    {loading ? <div className="grid min-h-[260px] place-items-center"><Loader2 className="animate-spin text-blue-600" /></div> : null}
    {!loading && !missions.length ? <div className="grid min-h-[280px] place-items-center px-6 text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><MapPinned size={24} /></div><h3 className="mt-4 text-base font-black">Aucune mission correspondant aux filtres</h3><p className="mt-2 text-sm font-semibold text-slate-500">Le registre n’injecte aucun exemple. Créez ou synchronisez une mission réelle pour l’afficher ici.</p></div></div> : null}
  </div>;
}

function StatusPill({ group }: { group: StatusGroup }) {
  const classes: Record<StatusGroup, string> = { planned: "bg-blue-50 text-blue-700", active: "bg-emerald-50 text-emerald-700", late: "bg-rose-50 text-rose-700", validation: "bg-blue-50 text-blue-700", completed: "bg-teal-50 text-teal-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 font-black ${classes[group]}`}>{statusLabels[group]}</span>;
}

function PriorityPill({ value }: { value: unknown }) {
  const label = priorityLabel(value);
  const classes = label === "Critique" ? "bg-rose-50 text-rose-700" : label === "Haute" ? "bg-orange-50 text-orange-700" : label === "Faible" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 font-black ${classes}`}>{label}</span>;
}

function IconButton({ icon: Icon, label, onClick }: { icon: IconType; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} title={label} className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><Icon size={14} /></button>;
}

function CoveragePanel({ rows }: { rows: Array<{ city: string; active: number; total: number; late: number; completed: number; ambassadors: Set<string> }> }) {
  const max = Math.max(1, ...rows.map((row) => row.total));
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-base font-black">Couverture territoriale</h2><p className="mt-1 text-[11px] font-semibold text-slate-500">Distribution réelle des missions par ville.</p></div><MapPinned size={20} className="text-blue-600" /></div><div className="mt-5 space-y-4">{rows.map((row) => <div key={row.city}><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-black text-slate-900">{row.city}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{row.active} active(s) · {row.ambassadors.size} ambassadeur(s)</div></div><div className="text-right"><div className="text-sm font-black !text-black">{row.total}</div><div className={`text-[10px] font-black ${row.late ? "text-rose-600" : "text-emerald-600"}`}>{row.late ? `${row.late} retard` : `${row.completed} terminée(s)`}</div></div></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${row.late ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${Math.max(8, Math.round((row.total / max) * 100))}%` }} /></div></div>)}{!rows.length ? <PanelEmpty text="Aucune distribution territoriale réelle disponible." /> : null}</div></section>;
}

function CompactPanel({ title, icon: Icon, children, action, onAction }: { title: string; icon: IconType; children: ReactNode; action?: string; onAction?: () => void }) {
  return <section className="min-h-[330px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-700"><Icon size={17} /></div><h2 className="text-sm font-black !text-black">{title}</h2></div>{action ? <button type="button" onClick={onAction} className="text-[10px] font-black text-blue-700 hover:underline">{action}</button> : null}</div><div className="mt-4 space-y-2">{children}</div></section>;
}

function ControlRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  const classes: Record<string, string> = { rose: "bg-rose-50 text-rose-700", amber: "bg-amber-50 text-amber-700", blue: "bg-blue-50 text-blue-700" };
  return <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3"><span className="text-xs font-bold text-slate-700">{label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-black ${classes[tone] || classes.blue}`}>{value}</span></div>;
}

function PriorityRow({ mission, reasons, ambassador, onClick }: { mission: AnyRow; reasons: string[]; ambassador: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-xs font-black text-slate-950">{missionCode(mission)} · {missionTitle(mission)}</div><div className="mt-1 truncate text-[10px] font-semibold text-slate-500">{text(mission.city, "—")} · {ambassador}</div></div><PriorityPill value={mission.priority} /></div><div className="mt-2 text-[10px] font-bold text-rose-600">{reasons.join(" · ")}</div></button>;
}

function RoadRow({ mission, route, ambassador }: { mission: AnyRow; route: NonNullable<MissionMeta["routeSheet"]>; ambassador: string }) {
  return <div className="grid grid-cols-[52px_1fr] gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className="text-xs font-black text-blue-700">{route.time || "—"}</div><div><div className="text-xs font-black text-slate-950">{missionTitle(mission)}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{text(mission.city, "—")} · {ambassador}</div></div></div>;
}

function IncidentRow({ item, onClick }: { item: AnyRow; onClick: () => void }) {
  const severity = text(item.severity, "medium").toLowerCase();
  return <button type="button" onClick={onClick} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-rose-200"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black text-slate-950">{missionTitle(item.mission)}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{text(item.category, "Incident")}</div></div><span className={`rounded-full px-2 py-1 text-[9px] font-black ${["critical", "urgent", "high"].includes(severity) ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{severity}</span></div><div className="mt-2 line-clamp-2 text-[10px] font-semibold text-slate-600">{text(item.description, "Incident déclaré")}</div></button>;
}

function PerformancePanel({ performance }: { performance: Record<string, number> }) {
  const metrics = [
    ["Taux de réalisation", `${performance.completionRate}%`],
    ["Leads par mission", performance.leadsPerMission.toFixed(1)],
    ["Taux de conversion", `${performance.conversionRate.toFixed(1)}%`],
    ["Coût par lead", `${performance.costPerLead.toFixed(1)} Dh`],
    ["Qualité moyenne", performance.quality ? `${performance.quality.toFixed(1)}/5` : "—"],
    ["Clôture à temps", `${performance.onTimeRate}%`],
    ["Conformité preuves", `${performance.proofRate}%`],
    ["Taux d’incident", `${performance.incidentRate}%`],
  ];
  return <section className="min-h-[330px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-sm font-black">Performance terrain</h2><p className="mt-1 text-[10px] font-semibold text-slate-500">Calculée à partir des missions synchronisées.</p></div><Target size={19} className="text-blue-600" /></div><div className="mt-4 grid grid-cols-2 gap-2">{metrics.map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-3"><div className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">{label}</div><div className="mt-2 text-base font-black text-slate-950">{value}</div></div>)}</div></section>;
}

function PanelEmpty({ text: value }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-[11px] font-bold leading-5 text-slate-400">{value}</div>;
}

function MissionDrawer({ mission, meta, ambassadorMap, territoryMap, onClose, onAction, onPatch, busy }: { mission: AnyRow; meta: MissionMeta; ambassadorMap: Map<string, AnyRow>; territoryMap: Map<string, AnyRow>; onClose: () => void; onAction: (kind: Exclude<MissionModal, null>, mission?: AnyRow | null) => void; onPatch: (mission: AnyRow, patch: AnyRow, message: string) => Promise<boolean>; busy: boolean }) {
  const primary = ambassadorMap.get(String(mission.ambassador_id || ""));
  const territory = territoryMap.get(String(mission.territory_id || ""));
  const group = normalizeStatus(mission);
  const support = (meta.assignedAmbassadors || []).filter((item) => item.ambassadorId !== String(mission.ambassador_id || ""));
  return <div className="fixed inset-0 z-[10040] bg-slate-950/30 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="absolute right-0 top-0 flex h-full w-full max-w-[760px] flex-col border-l border-slate-200 bg-[#f7f9fc] shadow-[-28px_0_70px_rgba(15,23,42,0.18)]"><div className="border-b border-slate-200 bg-white px-6 py-5"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Dossier mission 360</div><h2 className="mt-2 text-2xl font-black text-slate-950">{missionTitle(mission)}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{missionCode(mission)}</span><StatusPill group={group} /><PriorityPill value={mission.priority} /></div></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><X size={18} /></button></div></div><div className="flex-1 overflow-y-auto p-5"><div className="grid gap-4 md:grid-cols-2"><DrawerCard title="Identité opérationnelle"><DetailLine label="Ville" value={text(mission.city, territory?.city, "Non renseignée")} /><DetailLine label="Territoire" value={text(territory?.name, mission.region, "Non renseigné")} /><DetailLine label="Type" value={text(mission.mission_type, "Mission terrain")} /><DetailLine label="Échéance" value={shortDate(mission.due_date)} /></DrawerCard><DrawerCard title="Équipe affectée"><DetailLine label="Responsable" value={text(primary?.full_name, primary?.name, "Non affecté")} /><DetailLine label="Renforts" value={String(support.length)} /><DetailLine label="Campagne" value={text(meta.campaign, "Non renseignée")} /><DetailLine label="Service" value={text(meta.serviceLine, "Non renseigné")} /></DrawerCard><DrawerCard title="Exécution & SLA"><DetailLine label="Progression" value={`${numberValue(meta.progress)}%`} /><DetailLine label="Checkpoint" value={text(meta.checkpoint, "Non renseigné")} /><DetailLine label="Prochaine étape" value={text(meta.nextCheckpoint, "Non renseignée")} /><DetailLine label="Preuve" value={proofReady(mission, meta) ? "Conforme / disponible" : "À fournir"} /></DrawerCard><DrawerCard title="Résultats"><DetailLine label="Leads" value={String(numberValue(meta.metrics?.leads))} /><DetailLine label="Conversions" value={String(numberValue(meta.metrics?.conversions))} /><DetailLine label="Coût" value={`${numberValue(meta.metrics?.cost).toFixed(0)} Dh`} /><DetailLine label="Qualité" value={numberValue(meta.metrics?.quality) ? `${numberValue(meta.metrics?.quality).toFixed(1)}/5` : "Non évaluée"} /></DrawerCard></div><DrawerCard title="Objectifs, instructions et preuve" className="mt-4"><p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{text(mission.description, stripMeta(mission.instructions), "Aucune instruction opérationnelle enregistrée.")}</p>{mission.evidence_url ? <a href={mission.evidence_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"><FileText size={14} /> Ouvrir la preuve enregistrée</a> : null}</DrawerCard><DrawerCard title="Incidents & validation" className="mt-4"><DetailLine label="Incidents ouverts" value={String((meta.incidents || []).filter((item) => !["closed", "resolved"].includes(text(item.status).toLowerCase())).length)} /><DetailLine label="Décision validation" value={text(meta.validation?.decision, "Non soumise")} /><DetailLine label="Responsable validation" value={text(meta.validation?.reviewer, "Non renseigné")} /><DetailLine label="Note" value={text(meta.validation?.note, "Aucune note")} /></DrawerCard></div><div className="border-t border-slate-200 bg-white p-4"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><DrawerAction icon={Users} label="Réaffecter équipe" onClick={() => onAction("assign", mission)} /><DrawerAction icon={Target} label="Progression" onClick={() => onAction("progress", mission)} /><DrawerAction icon={FileText} label="Déposer preuve" onClick={() => onAction("evidence", mission)} /><DrawerAction icon={AlertTriangle} label="Ouvrir incident" onClick={() => onAction("incident", mission)} /><DrawerAction icon={ShieldCheck} label="Soumettre validation" onClick={() => onAction("validation", mission)} /><DrawerAction icon={CheckCircle2} label="Clôturer" onClick={() => onAction("close", mission)} /><DrawerAction icon={Play} label="Démarrer" disabled={busy || group === "active" || group === "completed"} onClick={() => void onPatch(mission, { status: "in_progress" }, "Mission démarrée et synchronisée.")} /><DrawerAction icon={RefreshCw} label="Repasser à planifier" disabled={busy || group === "completed"} onClick={() => void onPatch(mission, { status: "assigned" }, "Mission replacée dans la file à démarrer.")} /></div></div></aside></div>;
}

function DrawerCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm ${className}`}><h3 className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</h3><div className="mt-3 space-y-2">{children}</div></section>;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5"><span className="text-[11px] font-bold text-slate-500">{label}</span><span className="max-w-[65%] text-right text-[11px] font-black text-slate-900">{value}</span></div>;
}

function DrawerAction({ icon: Icon, label, onClick, disabled = false }: { icon: IconType; label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"><Icon size={15} />{label}</button>;
}

function MissionModalFrame({ title, subtitle, icon: Icon, onClose, children, footer, width = "max-w-[1660px]" }: { title: string; subtitle: string; icon: IconType; onClose: () => void; children: ReactNode; footer: ReactNode; width?: string }) {
  return <div className="fixed inset-0 z-[10060] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`mission-modal-force-dark-headings flex max-h-[calc(100vh-32px)] w-full ${width} flex-col overflow-hidden rounded-[34px] border border-white/60 bg-[#f4f7fb] shadow-[0_40px_120px_rgba(15,23,42,0.35)]`}><style>{`.mission-modal-force-dark-headings h1,.mission-modal-force-dark-headings h2,.mission-modal-force-dark-headings h3,.mission-modal-force-dark-headings h4,.mission-modal-force-dark-headings h5,.mission-modal-force-dark-headings h6,.mission-modal-force-dark-headings legend,.mission-modal-force-dark-headings [data-modal-title],.mission-modal-force-dark-headings [data-section-title]{color:#000000!important;-webkit-text-fill-color:#000000!important;opacity:1!important;font-weight:900!important}.mission-modal-force-dark-headings header p{color:#334155!important;-webkit-text-fill-color:#334155!important;opacity:1!important}`}</style><header className="border-b border-slate-200 bg-white px-6 py-5"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-800"><Icon size={21} /></div><div><h2 data-modal-title="true" className="text-xl font-black !text-black" style={{ color: "#000000", WebkitTextFillColor: "#000000", fontWeight: 900, opacity: 1 }}>{title}</h2><p className="mt-1 max-w-[980px] text-xs font-semibold leading-5 text-slate-600">{subtitle}</p></div></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><X size={18} /></button></div></header><div className="min-h-0 flex-1 overflow-y-auto p-5 xl:p-6">{children}</div><footer className="border-t border-slate-200 bg-white px-5 py-4">{footer}</footer></section></div>;
}

function Field({ label, required, children, helper }: { label: string; required?: boolean; children: ReactNode; helper?: string }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-slate-600">{label}{required ? " *" : ""}</span>{children}{helper ? <span className="mt-1.5 block text-[10px] font-semibold text-slate-400">{helper}</span> : null}</label>;
}

const inputClass = "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50";
const textAreaClass = "min-h-[112px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50";

function ModalFeedback({ feedback }: { feedback: { tone: "success" | "error"; text: string } | null }) {
  return feedback ? <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${feedback.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{feedback.text}</div> : null;
}

function MissionSelect({ missions, value, onChange }: { missions: AnyRow[]; value: string; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}><option value="">Choisir une mission réelle</option>{missions.filter((item) => normalizeStatus(item) !== "completed").map((mission) => <option key={mission.id} value={mission.id}>{missionCode(mission)} · {missionTitle(mission)} · {text(mission.city, "Ville non renseignée")}</option>)}</select>;
}

// PAGE4C_ASSIGNMENT_ENTERPRISE_HELPERS_START
type AssignmentTeamMember = {
  ambassadorId: string;
  role: string;
  allocation: number;
  shift: string;
  note: string;
};

const assignmentRoleOptions = [
  { value: "support_terrain", label: "Support terrain" },
  { value: "coordinateur_zone", label: "Coordinateur zone" },
  { value: "prospection_whatsapp", label: "Prospection WhatsApp" },
  { value: "relance_leads", label: "Relance leads" },
  { value: "collecte_preuves", label: "Collecte preuves" },
  { value: "liaison_partenaire", label: "Liaison partenaire" },
  { value: "qualite_terrain", label: "Contrôle qualité" },
];

const assignmentStrategyOptions = [
  { value: "solo_controle", title: "Solo contrôlé", description: "Un responsable autonome avec checkpoints renforcés.", teamSize: 1, tone: "blue" },
  { value: "binome_terrain", title: "Binôme terrain", description: "Responsable + support pour couverture et preuve.", teamSize: 2, tone: "emerald" },
  { value: "equipe_activation", title: "Équipe activation", description: "Cellule de 3 à 5 ambassadeurs pour volume terrain.", teamSize: 4, tone: "blue" },
  { value: "hybride_terrain_digital", title: "Hybride terrain + digital", description: "Terrain, WhatsApp et relance répartis par rôle.", teamSize: 3, tone: "amber" },
];

function ambassadorDisplayName(record: AnyRow | undefined) {
  return text(record?.full_name, record?.name, record?.candidate_name, "Ambassadeur");
}

function ambassadorDisplayCity(record: AnyRow | undefined) {
  return text(record?.city, record?.primary_city, record?.territory_city, "Ville non renseignée");
}

function ambassadorOperationalStatus(record: AnyRow | undefined) {
  return text(record?.status, record?.activation_status, "active").toLowerCase().replace(/[\s-]+/g, "_");
}

function ambassadorQualityScore(record: AnyRow | undefined) {
  return Math.max(0, Math.min(100, numberValue(record?.quality_score, numberValue(record?.performance_score, numberValue(record?.score, 0)))));
}

function ambassadorMissionLoad(missions: AnyRow[], ambassadorId: string) {
  if (!ambassadorId) return { count: 0, late: 0, score: 0 };
  const rows = missions.filter((mission) => {
    if (normalizeStatus(mission) === "completed") return false;
    const meta = parseMeta(mission.instructions);
    return String(mission.ambassador_id || "") === ambassadorId || Boolean(meta.assignedAmbassadors?.some((item) => item.ambassadorId === ambassadorId));
  });
  const late = rows.filter((mission) => normalizeStatus(mission) === "late").length;
  const score = Math.min(100, rows.length * 18 + late * 22);
  return { count: rows.length, late, score };
}

function assignmentRoleLabel(value: string) {
  return assignmentRoleOptions.find((item) => item.value === value)?.label || "Support terrain";
}
// PAGE4C_ASSIGNMENT_ENTERPRISE_HELPERS_END

function AssignMissionModal({ missions, ambassadors, selectedMission, busy, feedback, onClose, onSubmit }: { missions: AnyRow[]; ambassadors: AnyRow[]; selectedMission: AnyRow | null; busy: boolean; feedback: any; onClose: () => void; onSubmit: (mission: AnyRow, patch: AnyRow, message: string) => Promise<boolean> }) {
  // PAGE4C_ASSIGN_AMBASSADOR_ENTERPRISE_START
  const [missionId, setMissionId] = useState(String(selectedMission?.id || ""));
  const mission = missions.find((item) => String(item.id) === missionId) || null;
  const missionMeta = mission ? parseMeta(mission.instructions) : {};
  const existingAssignment = missionMeta.assignmentControl || {};
  const initialPrimary = String(mission?.ambassador_id || "");
  const initialSupport = (missionMeta.assignedAmbassadors || [])
    .filter((item) => item.ambassadorId && item.ambassadorId !== initialPrimary)
    .map((item) => ({
      ambassadorId: item.ambassadorId,
      role: item.role || "support_terrain",
      allocation: numberValue(item.allocation, 50),
      shift: text(item.shift, "Journée"),
      note: text(item.note),
    }));

  const [primaryId, setPrimaryId] = useState(initialPrimary);
  const [teamMembers, setTeamMembers] = useState<AssignmentTeamMember[]>(initialSupport);
  const [strategy, setStrategy] = useState(text(existingAssignment.strategy, "binome_terrain"));
  const [dispatchMode, setDispatchMode] = useState(text(existingAssignment.dispatchMode, "planifie"));
  const [startDate, setStartDate] = useState(text(existingAssignment.startDate, new Date().toISOString().slice(0, 10)));
  const [dueDate, setDueDate] = useState(isoDate(mission?.due_date));
  const [reviewDate, setReviewDate] = useState(text(existingAssignment.reviewDate));
  const [status, setStatus] = useState(text(mission?.status, "assigned"));
  const [manager, setManager] = useState(text(existingAssignment.manager));
  const [validator, setValidator] = useState(text(existingAssignment.validator));
  const [notificationChannel, setNotificationChannel] = useState(text(existingAssignment.notificationChannel, "interne"));
  const [briefingMode, setBriefingMode] = useState(text(existingAssignment.briefingMode, "brief_structure"));
  const [capacityPolicy, setCapacityPolicy] = useState(text(existingAssignment.capacityPolicy, "equilibre_strict"));
  const [territoryPolicy, setTerritoryPolicy] = useState(text(existingAssignment.territoryPolicy, "territoire_prioritaire"));
  const [checkpoint, setCheckpoint] = useState(text(existingAssignment.checkpoint, missionMeta.nextCheckpoint));
  const [note, setNote] = useState(text(existingAssignment.note));
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    if (!mission) return;
    const meta = parseMeta(mission.instructions);
    const assignment = meta.assignmentControl || {};
    const primary = String(mission.ambassador_id || "");
    setPrimaryId(primary);
    setTeamMembers((meta.assignedAmbassadors || [])
      .filter((item) => item.ambassadorId && item.ambassadorId !== primary)
      .map((item) => ({
        ambassadorId: item.ambassadorId,
        role: item.role || "support_terrain",
        allocation: numberValue(item.allocation, 50),
        shift: text(item.shift, "Journée"),
        note: text(item.note),
      })));
    setStrategy(text(assignment.strategy, "binome_terrain"));
    setDispatchMode(text(assignment.dispatchMode, "planifie"));
    setStartDate(text(assignment.startDate, new Date().toISOString().slice(0, 10)));
    setDueDate(isoDate(mission.due_date));
    setReviewDate(text(assignment.reviewDate));
    setStatus(text(mission.status, "assigned"));
    setManager(text(assignment.manager));
    setValidator(text(assignment.validator));
    setNotificationChannel(text(assignment.notificationChannel, "interne"));
    setBriefingMode(text(assignment.briefingMode, "brief_structure"));
    setCapacityPolicy(text(assignment.capacityPolicy, "equilibre_strict"));
    setTerritoryPolicy(text(assignment.territoryPolicy, "territoire_prioritaire"));
    setCheckpoint(text(assignment.checkpoint, meta.nextCheckpoint));
    setNote(text(assignment.note));
  }, [missionId]);

  const ambassadorMap = useMemo(() => new Map(ambassadors.map((item) => [String(item.id), item])), [ambassadors]);
  const missionCity = text(mission?.city, mission?.region);
  const cityOptions = useMemo(() => Array.from(new Set(ambassadors.map((item) => ambassadorDisplayCity(item)).filter(Boolean))).sort(), [ambassadors]);
  const primary = ambassadorMap.get(primaryId);
  const primaryLoad = ambassadorMissionLoad(missions, primaryId);

  const catalog = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return ambassadors.filter((item) => {
      const id = String(item.id || "");
      if (!id || id === primaryId) return false;
      const haystack = [ambassadorDisplayName(item), ambassadorDisplayCity(item), item.territory, item.level, item.status].join(" ").toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (cityFilter !== "all" && ambassadorDisplayCity(item) !== cityFilter) return false;
      return true;
    });
  }, [ambassadors, primaryId, search, cityFilter]);

  const selectedRows = useMemo(() => [
    ...(primaryId ? [{ ambassadorId: primaryId, role: "responsable_mission", allocation: 100, shift: "Pilotage", note: "" }] : []),
    ...teamMembers,
  ], [primaryId, teamMembers]);

  const selectedOperationalRows = useMemo(() => selectedRows.map((row) => {
    const ambassador = ambassadorMap.get(row.ambassadorId);
    const load = ambassadorMissionLoad(missions, row.ambassadorId);
    const sameCity = !missionCity || ambassadorDisplayCity(ambassador).toLowerCase() === missionCity.toLowerCase();
    const operational = !["inactive", "suspended", "archived", "blocked"].includes(ambassadorOperationalStatus(ambassador));
    return { ...row, ambassador, load, sameCity, operational, quality: ambassadorQualityScore(ambassador) };
  }), [selectedRows, ambassadorMap, missions, missionCity]);

  const warnings = useMemo(() => {
    const rows: string[] = [];
    if (!missionId) rows.push("Mission non sélectionnée");
    if (!primaryId) rows.push("Responsable principal manquant");
    if (!dueDate) rows.push("Échéance non renseignée");
    if (!manager) rows.push("Manager de dispatch non identifié");
    if (!validator) rows.push("Validateur opérationnel manquant");
    if (selectedOperationalRows.some((item) => !item.operational)) rows.push("Un ambassadeur sélectionné est inactif ou suspendu");
    if (selectedOperationalRows.some((item) => item.load.score >= 85)) rows.push("Surcharge critique détectée dans l’équipe");
    if (selectedOperationalRows.some((item) => !item.sameCity)) rows.push("Écart ville / territoire sur au moins un ambassadeur");
    const expectedTeam = assignmentStrategyOptions.find((item) => item.value === strategy)?.teamSize || 1;
    if (selectedRows.length < expectedTeam) rows.push(`Stratégie recommandée: ${expectedTeam} membre(s), équipe actuelle: ${selectedRows.length}`);
    return rows;
  }, [missionId, primaryId, dueDate, manager, validator, selectedOperationalRows, strategy, selectedRows.length]);

  const hardBlocked = !missionId || !primaryId || !dueDate || selectedOperationalRows.some((item) => !item.operational);
  const readinessChecks = [
    Boolean(missionId),
    Boolean(primaryId),
    Boolean(dueDate),
    Boolean(startDate),
    Boolean(manager),
    Boolean(validator),
    Boolean(checkpoint),
    selectedRows.length > 0,
    !selectedOperationalRows.some((item) => !item.operational),
    !selectedOperationalRows.some((item) => item.load.score >= 95),
  ];
  const readiness = Math.round((readinessChecks.filter(Boolean).length / readinessChecks.length) * 100);
  const averageLoad = selectedOperationalRows.length ? Math.round(selectedOperationalRows.reduce((sum, item) => sum + item.load.score, 0) / selectedOperationalRows.length) : 0;
  const territoryFit = selectedOperationalRows.length ? Math.round((selectedOperationalRows.filter((item) => item.sameCity).length / selectedOperationalRows.length) * 100) : 0;
  const averageQuality = selectedOperationalRows.length ? Math.round(selectedOperationalRows.reduce((sum, item) => sum + item.quality, 0) / selectedOperationalRows.length) : 0;

  function toggleSupport(ambassadorId: string) {
    setTeamMembers((current) => {
      const exists = current.some((item) => item.ambassadorId === ambassadorId);
      if (exists) return current.filter((item) => item.ambassadorId !== ambassadorId);
      return [...current, { ambassadorId, role: "support_terrain", allocation: 50, shift: "Journée", note: "" }];
    });
  }

  function updateSupport(ambassadorId: string, patch: Partial<AssignmentTeamMember>) {
    setTeamMembers((current) => current.map((item) => item.ambassadorId === ambassadorId ? { ...item, ...patch } : item));
  }

  function applyStrategy(value: string) {
    setStrategy(value);
    if (value === "solo_controle") setTeamMembers([]);
    if (value === "hybride_terrain_digital") {
      setBriefingMode("brief_structure");
      setCapacityPolicy("repartition_canaux");
    }
  }

  async function submit(mode: "draft" | "assign" | "start") {
    if (!mission) return;
    if (mode !== "draft" && hardBlocked) return;
    const assignments = [
      ...(primaryId ? [{ ambassadorId: primaryId, role: "responsable_mission", allocation: 100, shift: "Pilotage", note: "Responsable principal" }] : []),
      ...teamMembers.filter((item) => item.ambassadorId && item.ambassadorId !== primaryId),
    ];
    const nextStatus = mode === "start" ? "in_progress" : mode === "assign" ? (status || "assigned") : text(mission.status, "assigned");
    await onSubmit(mission, {
      ambassador_id: primaryId || mission.ambassador_id || null,
      due_date: dueDate || mission.due_date || null,
      status: nextStatus,
      instructions: withMeta(mission, {
        assignedAmbassadors: assignments,
        nextCheckpoint: checkpoint || missionMeta.nextCheckpoint,
        assignmentControl: {
          strategy,
          dispatchMode,
          startDate,
          reviewDate,
          manager,
          validator,
          notificationChannel,
          briefingMode,
          capacityPolicy,
          territoryPolicy,
          primaryRole: "responsable_mission",
          checkpoint,
          note,
          updatedAt: new Date().toISOString(),
        },
      }),
    }, mode === "draft"
      ? "Préparation d’affectation enregistrée dans le dossier mission."
      : mode === "start"
        ? "Équipe affectée, contrôles dispatch enregistrés et mission démarrée."
        : "Équipe mission affectée et synchronisée avec son dispositif opérationnel.");
  }

  const footer = <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
    <div className="min-w-0">
      <div className={`text-xs font-black ${hardBlocked ? "text-rose-700" : warnings.length ? "text-amber-700" : "text-emerald-700"}`}>
        {hardBlocked ? `Blocage: ${warnings.slice(0, 3).join(", ") || "contrôles minimum non satisfaits"}` : warnings.length ? `Vigilance: ${warnings.slice(0, 3).join(" · ")}` : "Équipe prête: affectation, capacité, territoire et gouvernance contrôlés."}
      </div>
      <div className="mt-1 text-[10px] font-semibold text-slate-500">{selectedRows.length} membre(s) · charge moyenne {averageLoad}% · compatibilité territoire {territoryFit}%</div>
    </div>
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50">Fermer</button>
      <button type="button" disabled={busy || !missionId} onClick={() => void submit("draft")} className="h-11 rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-black text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">Enregistrer préparation</button>
      <button type="button" disabled={busy || hardBlocked} onClick={() => void submit("assign")} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{busy ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />} Affecter l’équipe</button>
      <button type="button" disabled={busy || hardBlocked} onClick={() => void submit("start")} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Affecter & démarrer</button>
    </div>
  </div>;

  return <MissionModalFrame
    title="Affectation intelligente de l’équipe mission"
    subtitle="Composez une équipe principale et support, contrôlez charge, territoire, rôles, gouvernance, échéances et readiness avant dispatch réel."
    icon={Users}
    onClose={onClose}
    width="max-w-[1760px]"
    footer={footer}
  >
    <ModalFeedback feedback={feedback} />

    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <AssignmentSummaryTile label="Mission" value={mission ? missionCode(mission) : "À sélectionner"} helper={mission ? missionTitle(mission) : "Aucun dossier chargé"} />
      <AssignmentSummaryTile label="Équipe" value={String(selectedRows.length)} helper={strategy.replace(/_/g, " ")} />
      <AssignmentSummaryTile label="Readiness" value={`${readiness}%`} helper={readiness >= 80 ? "Dispatch maîtrisé" : "Contrôles à compléter"} />
      <AssignmentSummaryTile label="Charge moyenne" value={`${averageLoad}%`} helper={averageLoad >= 85 ? "Surcharge critique" : averageLoad >= 60 ? "Charge à surveiller" : "Capacité disponible"} />
      <AssignmentSummaryTile label="Fit territoire" value={`${territoryFit}%`} helper={missionCity || "Ville non renseignée"} />
    </div>

    <div className="grid gap-5 xl:grid-cols-[0.78fr_1.42fr_0.88fr]">
      <div className="space-y-5">
        <ModalSection title="1. Mission et contexte" subtitle="Chargez le dossier réel avant de composer l’équipe">
          <Field label="Mission à affecter" required><MissionSelect missions={missions} value={missionId} onChange={setMissionId} /></Field>
          {mission ? <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-black !text-black">{missionTitle(mission)}</div><div className="mt-1 text-[11px] font-semibold text-slate-500">{missionCode(mission)} · {missionCity || "Ville non renseignée"}</div></div><PriorityPill value={mission.priority} /></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><AssignmentFact label="Statut" value={statusLabels[normalizeStatus(mission)]} /><AssignmentFact label="Échéance" value={shortDate(mission.due_date)} /><AssignmentFact label="Territoire" value={text(mission.region, mission.territory_name, "Non renseigné")} /><AssignmentFact label="Preuve" value={proofReady(mission) ? "Disponible" : "À prévoir"} /></div>
          </div> : <PanelEmpty text="Sélectionnez une mission réelle pour charger ville, priorité, SLA, preuve et équipe existante." />}
        </ModalSection>

        <ModalSection title="2. Stratégie d’affectation" subtitle="Choisissez un modèle d’équipe adapté à l’intensité de la mission">
          <div className="grid gap-2">{assignmentStrategyOptions.map((option) => {
            const active = strategy === option.value;
            return <button key={option.value} type="button" onClick={() => applyStrategy(option.value)} className={`rounded-[20px] border p-4 text-left transition ${active ? "border-blue-400 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"}`}>
              <div className="flex items-center justify-between gap-3"><div className="text-xs font-black text-slate-950">{option.title}</div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{option.teamSize} membre(s)</span></div>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-600">{option.description}</p>
            </button>;
          })}</div>
        </ModalSection>
      </div>

      <div className="space-y-5">
        <ModalSection title="3. Responsable principal" subtitle="Sélectionnez le pilote et contrôlez immédiatement son aptitude">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <Field label="Ambassadeur responsable" required><select value={primaryId} onChange={(event) => { const id = event.target.value; setPrimaryId(id); setTeamMembers((rows) => rows.filter((row) => row.ambassadorId !== id)); }} className={inputClass}><option value="">Choisir le responsable principal</option>{ambassadors.map((item) => <option key={item.id} value={item.id}>{ambassadorDisplayName(item)} · {ambassadorDisplayCity(item)}</option>)}</select></Field>
            <Field label="Rôle principal"><input value="Responsable mission" readOnly className={`${inputClass} bg-slate-50`} /></Field>
          </div>
          {primary ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AssignmentMetric label="Ville" value={ambassadorDisplayCity(primary)} />
            <AssignmentMetric label="Qualité" value={`${ambassadorQualityScore(primary)}%`} />
            <AssignmentMetric label="Missions actives" value={String(primaryLoad.count)} />
            <AssignmentMetric label="Charge" value={`${primaryLoad.score}%`} tone={primaryLoad.score >= 85 ? "danger" : primaryLoad.score >= 60 ? "warning" : "good"} />
          </div> : null}
        </ModalSection>

        <ModalSection title="4. Ambassadeurs support et rôles" subtitle="Ajoutez plusieurs renforts, puis définissez rôle, allocation, créneau et note individuelle">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_210px]"><div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-10`} placeholder="Rechercher nom, ville, territoire, niveau…" /></div><select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className={inputClass}><option value="all">Toutes les villes</option>{cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}</select></div>

          <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">{catalog.map((item) => {
            const id = String(item.id);
            const active = teamMembers.some((row) => row.ambassadorId === id);
            const load = ambassadorMissionLoad(missions, id);
            const sameCity = !missionCity || ambassadorDisplayCity(item).toLowerCase() === missionCity.toLowerCase();
            const operational = !["inactive", "suspended", "archived", "blocked"].includes(ambassadorOperationalStatus(item));
            return <button key={id} type="button" disabled={!operational} onClick={() => toggleSupport(id)} className={`rounded-[20px] border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"}`}>
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-xs font-black text-slate-950">{ambassadorDisplayName(item)}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{ambassadorDisplayCity(item)} · qualité {ambassadorQualityScore(item)}%</div></div><div className={`grid h-7 w-7 place-items-center rounded-full ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{active ? <CheckCircle2 size={14} /> : <Plus size={14} />}</div></div>
              <div className="mt-3 flex flex-wrap gap-1.5"><span className={`rounded-full px-2 py-1 text-[9px] font-black ${load.score >= 85 ? "bg-rose-100 text-rose-700" : load.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>Charge {load.score}%</span><span className={`rounded-full px-2 py-1 text-[9px] font-black ${sameCity ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{sameCity ? "Territoire compatible" : "Écart territoire"}</span></div>
            </button>;
          })}{catalog.length === 0 ? <div className="col-span-full rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-xs font-bold text-slate-500">Aucun ambassadeur réel ne correspond aux filtres.</div> : null}</div>

          {teamMembers.length ? <div className="mt-5 space-y-3"><div className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-600">Configuration des renforts sélectionnés</div>{teamMembers.map((member) => {
            const record = ambassadorMap.get(member.ambassadorId);
            const load = ambassadorMissionLoad(missions, member.ambassadorId);
            return <div key={member.ambassadorId} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="min-w-[190px] flex-1"><div className="text-xs font-black text-slate-950">{ambassadorDisplayName(record)}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{ambassadorDisplayCity(record)} · charge {load.score}%</div></div><select value={member.role} onChange={(event) => updateSupport(member.ambassadorId, { role: event.target.value })} className="h-10 min-w-[190px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-950">{assignmentRoleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select value={member.shift} onChange={(event) => updateSupport(member.ambassadorId, { shift: event.target.value })} className="h-10 min-w-[125px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-950"><option>Matin</option><option>Après-midi</option><option>Journée</option><option>Soir</option><option>Flexible</option></select><div className="flex min-w-[150px] items-center gap-2"><input type="range" min="10" max="100" step="10" value={member.allocation} onChange={(event) => updateSupport(member.ambassadorId, { allocation: numberValue(event.target.value) })} className="w-full" /><span className="w-10 text-right text-[10px] font-black text-slate-700">{member.allocation}%</span></div><button type="button" onClick={() => toggleSupport(member.ambassadorId)} className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"><X size={14} /></button></div><input value={member.note} onChange={(event) => updateSupport(member.ambassadorId, { note: event.target.value })} className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-950" placeholder="Brief individuel, zone, livrable ou restriction…" /></div>;
          })}</div> : null}
        </ModalSection>
      </div>

      <div className="space-y-5">
        <ModalSection title="5. Paramètres de dispatch" subtitle="Cadrez dates, gouvernance, notification et contrôles de capacité">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Field label="Mode de dispatch"><select value={dispatchMode} onChange={(event) => setDispatchMode(event.target.value)} className={inputClass}><option value="planifie">Planifié</option><option value="urgent">Urgent</option><option value="remplacement">Remplacement</option><option value="renfort">Renfort zone</option><option value="reaffectation">Réaffectation corrective</option></select></Field>
            <Field label="Statut après affectation"><select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="assigned">À démarrer</option><option value="in_progress">Démarrer immédiatement</option><option value="validation">En validation</option></select></Field>
            <Field label="Date de démarrage"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} /></Field>
            <Field label="Échéance" required><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} /></Field>
            <Field label="Date de revue"><input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} className={inputClass} /></Field>
            <Field label="Canal de notification"><select value={notificationChannel} onChange={(event) => setNotificationChannel(event.target.value)} className={inputClass}><option value="interne">Interne</option><option value="whatsapp_prepare">WhatsApp à préparer</option><option value="email_prepare">Email à préparer</option><option value="manager_relay">Relais manager</option></select></Field>
            <Field label="Manager dispatch" required><input value={manager} onChange={(event) => setManager(event.target.value)} className={inputClass} placeholder="Responsable opérationnel" /></Field>
            <Field label="Validateur exécution" required><input value={validator} onChange={(event) => setValidator(event.target.value)} className={inputClass} placeholder="Ops / manager" /></Field>
            <Field label="Mode briefing"><select value={briefingMode} onChange={(event) => setBriefingMode(event.target.value)} className={inputClass}><option value="brief_structure">Brief structuré</option><option value="appel_manager">Appel manager</option><option value="reunion_equipe">Réunion équipe</option><option value="playbook_autonome">Playbook autonome</option></select></Field>
            <Field label="Politique capacité"><select value={capacityPolicy} onChange={(event) => setCapacityPolicy(event.target.value)} className={inputClass}><option value="equilibre_strict">Équilibre strict</option><option value="repartition_canaux">Répartition par canaux</option><option value="renfort_autorise">Renfort autorisé</option><option value="validation_manager">Surcharge avec validation manager</option></select></Field>
            <div className="sm:col-span-2 xl:col-span-1 2xl:col-span-2"><Field label="Politique territoire"><select value={territoryPolicy} onChange={(event) => setTerritoryPolicy(event.target.value)} className={inputClass}><option value="territoire_prioritaire">Territoire prioritaire</option><option value="partage_controle">Partage contrôlé</option><option value="mobilite_interville">Mobilité interville</option><option value="backup_zone">Backup zone</option></select></Field></div>
            <div className="sm:col-span-2 xl:col-span-1 2xl:col-span-2"><Field label="Prochain checkpoint"><input value={checkpoint} onChange={(event) => setCheckpoint(event.target.value)} className={inputClass} placeholder="Brief validé, point terrain, preuve intermédiaire…" /></Field></div>
            <div className="sm:col-span-2 xl:col-span-1 2xl:col-span-2"><Field label="Note d’affectation"><textarea value={note} onChange={(event) => setNote(event.target.value)} className={textAreaClass} placeholder="Répartition, contraintes, objectif de coordination, instructions manager…" /></Field></div>
          </div>
        </ModalSection>

        <ModalSection title="6. Intelligence de dispatch" subtitle="Readiness, charge, territoire, qualité et risques avant affectation">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><ScoreBlock label="Readiness équipe" value={readiness} /><ScoreBlock label="Compatibilité territoire" value={territoryFit} /><ScoreBlock label="Qualité moyenne" value={averageQuality} /><ScoreBlock label="Capacité disponible" value={Math.max(0, 100 - averageLoad)} /></div>
          <div className="mt-4 space-y-2"><CheckLine ok={Boolean(missionId)} label="Mission réelle sélectionnée" /><CheckLine ok={Boolean(primaryId)} label="Responsable principal affecté" /><CheckLine ok={Boolean(dueDate && startDate)} label="Cadre temporel défini" /><CheckLine ok={Boolean(manager && validator)} label="Gouvernance dispatch identifiée" /><CheckLine ok={!selectedOperationalRows.some((item) => !item.operational)} label="Tous les ambassadeurs sont opérationnels" /><CheckLine ok={!selectedOperationalRows.some((item) => item.load.score >= 95)} label="Aucune surcharge bloquante" /></div>
          {warnings.length ? <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 p-4"><div className="text-[10px] font-black uppercase tracking-[0.13em] text-amber-800">Vigilances détectées</div><div className="mt-3 space-y-2">{warnings.map((warning) => <div key={warning} className="flex items-start gap-2 text-[11px] font-bold text-amber-900"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{warning}</div>)}</div></div> : <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-xs font-black text-emerald-800">Aucun risque bloquant détecté. L’équipe peut être dispatchée.</div>}
        </ModalSection>
      </div>
    </div>
  </MissionModalFrame>;
  // PAGE4C_ASSIGN_AMBASSADOR_ENTERPRISE_END
}

function AssignmentSummaryTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="mt-2 text-xl font-black text-slate-950">{value}</div><div className="mt-1 truncate text-[10px] font-semibold text-slate-500">{helper}</div></div>;
}

function AssignmentFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white px-3 py-2"><div className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</div><div className="mt-1 truncate text-[10px] font-black text-slate-800">{value}</div></div>;
}

function AssignmentMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "good" | "warning" | "danger" }) {
  const toneClass = tone === "good" ? "border-emerald-200 bg-emerald-50" : tone === "warning" ? "border-amber-200 bg-amber-50" : tone === "danger" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50";
  return <div className={`rounded-[18px] border p-3 ${toneClass}`}><div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div><div className="mt-1 text-sm font-black text-slate-950">{value}</div></div>;
}

function CloseMissionModal({ missions, selectedMission, busy, feedback, onClose, onSubmit }: { missions: AnyRow[]; selectedMission: AnyRow | null; busy: boolean; feedback: any; onClose: () => void; onSubmit: (mission: AnyRow, patch: AnyRow, message: string) => Promise<boolean> }) {
  const [missionId, setMissionId] = useState(String(selectedMission?.id || "")); const mission = missions.find((item) => String(item.id) === missionId) || null; const current = mission ? parseMeta(mission.instructions) : {};
  const [proofStatus, setProofStatus] = useState(text(mission?.proof_status, "pending")); const [evidenceUrl, setEvidenceUrl] = useState(text(mission?.evidence_url)); const [leads, setLeads] = useState(String(numberValue(current.metrics?.leads))); const [conversions, setConversions] = useState(String(numberValue(current.metrics?.conversions))); const [cost, setCost] = useState(String(numberValue(current.metrics?.cost))); const [quality, setQuality] = useState(String(numberValue(current.metrics?.quality))); const [owner, setOwner] = useState(""); const [note, setNote] = useState("");
  useEffect(() => { if (!mission) return; const meta = parseMeta(mission.instructions); setProofStatus(text(mission.proof_status, "pending")); setEvidenceUrl(text(mission.evidence_url)); setLeads(String(numberValue(meta.metrics?.leads))); setConversions(String(numberValue(meta.metrics?.conversions))); setCost(String(numberValue(meta.metrics?.cost))); setQuality(String(numberValue(meta.metrics?.quality))); }, [missionId]);
  const blocked = !missionId || !owner || !["verified", "approved", "complete", "completed"].includes(proofStatus) || (!evidenceUrl && !(current.evidence?.length));
  async function submit() { if (!mission || blocked) return; const completedAt = new Date().toISOString(); await onSubmit(mission, { status: "completed", completed_at: completedAt, proof_status: proofStatus, evidence_url: evidenceUrl, instructions: withMeta(mission, { metrics: { leads: numberValue(leads), conversions: numberValue(conversions), cost: numberValue(cost), quality: numberValue(quality) }, closeout: { owner, note, completedAt }, progress: 100 }) }, "Mission clôturée avec résultats, preuve et audit opérationnel synchronisés."); }
  return <MissionModalFrame title="Clôture contrôlée de mission" subtitle="La mission ne peut être clôturée qu’après contrôle de la preuve, des résultats, de la qualité, des incidents et du responsable de décision." icon={CheckCircle2} onClose={onClose} footer={<ModalFooter busy={busy} blocked={blocked} blockedText="Bloqué : preuve vérifiée, justificatif et responsable de clôture requis." onClose={onClose} primaryLabel="Valider la clôture" onPrimary={() => void submit()} />}><ModalFeedback feedback={feedback} /><div className="grid gap-5 xl:grid-cols-[0.85fr_1.2fr_0.9fr]"><ModalSection title="Mission & conformité" subtitle="Sélection et preuve"><Field label="Mission" required><MissionSelect missions={missions} value={missionId} onChange={setMissionId} /></Field><div className="mt-4 grid gap-3"><Field label="Statut de preuve" required><select value={proofStatus} onChange={(event) => setProofStatus(event.target.value)} className={inputClass}><option value="pending">À contrôler</option><option value="verified">Vérifiée</option><option value="approved">Approuvée</option><option value="complete">Complète</option></select></Field><Field label="Lien de preuve"><input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} className={inputClass} placeholder="Drive, photo, rapport ou pièce justificative" /></Field></div></ModalSection><ModalSection title="Résultats de mission" subtitle="Mesures finales réellement constatées"><div className="grid gap-4 sm:grid-cols-2"><Field label="Leads générés"><input type="number" min="0" value={leads} onChange={(event) => setLeads(event.target.value)} className={inputClass} /></Field><Field label="Conversions"><input type="number" min="0" value={conversions} onChange={(event) => setConversions(event.target.value)} className={inputClass} /></Field><Field label="Coût mission (Dh)"><input type="number" min="0" value={cost} onChange={(event) => setCost(event.target.value)} className={inputClass} /></Field><Field label="Note qualité /5"><input type="number" min="0" max="5" step="0.1" value={quality} onChange={(event) => setQuality(event.target.value)} className={inputClass} /></Field><Field label="Responsable clôture" required><input value={owner} onChange={(event) => setOwner(event.target.value)} className={inputClass} placeholder="Ops ou manager validateur" /></Field><Field label="Note de clôture"><input value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} placeholder="Décision, réserve ou suite…" /></Field></div></ModalSection><ModalSection title="Décision de clôture" subtitle="Garde-fous avant validation"><ScoreBlock label="Conformité de clôture" value={Math.round(([missionId, owner, ["verified", "approved", "complete"].includes(proofStatus), Boolean(evidenceUrl || current.evidence?.length)].filter(Boolean).length / 4) * 100)} /><div className="mt-4 space-y-2"><CheckLine ok={Boolean(missionId)} label="Mission sélectionnée" /><CheckLine ok={["verified", "approved", "complete"].includes(proofStatus)} label="Preuve contrôlée" /><CheckLine ok={Boolean(evidenceUrl || current.evidence?.length)} label="Justificatif disponible" /><CheckLine ok={Boolean(owner)} label="Responsable de décision identifié" /></div></ModalSection></div></MissionModalFrame>;
}

function RoadmapModal({ missions, ambassadorName, busy, feedback, onClose, onRefresh, setBusy, setFeedback }: { missions: AnyRow[]; ambassadorName: (id: unknown) => string; busy: boolean; feedback: any; onClose: () => void; onRefresh: () => void; setBusy: (value: boolean) => void; setFeedback: (value: any) => void }) {
  const eligible = missions.filter((item) => normalizeStatus(item) !== "completed"); const [selectedIds, setSelectedIds] = useState<string[]>([]); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [startTime, setStartTime] = useState("09:00"); const [interval, setInterval] = useState("90"); const [meetingPoint, setMeetingPoint] = useState(""); const [coordinator, setCoordinator] = useState(""); const [policy, setPolicy] = useState("Checkpoint après chaque mission et preuve avant passage à l’étape suivante.");
  async function submit() { if (!selectedIds.length || !date || !startTime || !coordinator) return; setBusy(true); setFeedback(null); try { const [hours, minutes] = startTime.split(":").map(Number); for (let index = 0; index < selectedIds.length; index += 1) { const mission = eligible.find((item) => String(item.id) === selectedIds[index]); if (!mission) continue; const totalMinutes = hours * 60 + minutes + index * numberValue(interval, 90); const time = `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`; const response = await fetch(`/api/market-os/ambassadors/missions/${mission.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ instructions: withMeta(mission, { routeSheet: { date, time, order: index + 1, meetingPoint, coordinator, checkpointPolicy: policy } }) }) }); const payload = await response.json().catch(() => ({})); if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Échec de la mission ${missionTitle(mission)}`); } setFeedback({ tone: "success", text: "Feuille de route enregistrée sur chaque mission sélectionnée." }); onRefresh(); } catch (caught) { setFeedback({ tone: "error", text: caught instanceof Error ? caught.message : "Feuille de route non synchronisée" }); } finally { setBusy(false); } }
  return <MissionModalFrame title="Constructeur de feuille de route terrain" subtitle="Ordonnez les missions réelles, définissez le responsable, les heures, le point de rassemblement et la règle de checkpoint avant diffusion opérationnelle." icon={Calendar} onClose={onClose} footer={<ModalFooter busy={busy} blocked={!selectedIds.length || !date || !startTime || !coordinator} blockedText="Bloqué : sélectionnez au moins une mission et renseignez date, heure et coordinateur." onClose={onClose} primaryLabel="Enregistrer la feuille de route" onPrimary={() => void submit()} />}><ModalFeedback feedback={feedback} /><div className="grid gap-5 xl:grid-cols-[1.25fr_0.8fr_0.8fr]"><ModalSection title="Missions à ordonner" subtitle="Sélection réelle, ordre de passage conservé"><div className="space-y-2">{eligible.map((mission) => { const id = String(mission.id); const active = selectedIds.includes(id); return <button key={id} type="button" onClick={() => setSelectedIds((rows) => active ? rows.filter((row) => row !== id) : [...rows, id])} className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left ${active ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}><div><div className="text-xs font-black text-slate-950">{missionCode(mission)} · {missionTitle(mission)}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{text(mission.city, "—")} · {ambassadorName(mission.ambassador_id)}</div></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700">{active ? selectedIds.indexOf(id) + 1 : "+"}</span></button>; })}{!eligible.length ? <PanelEmpty text="Aucune mission éligible pour la feuille de route." /> : null}</div></ModalSection><ModalSection title="Cadencement" subtitle="Date, horaires et durée"><div className="grid gap-4"><Field label="Date d’exécution" required><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} /></Field><Field label="Heure de départ" required><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={inputClass} /></Field><Field label="Intervalle par mission"><select value={interval} onChange={(event) => setInterval(event.target.value)} className={inputClass}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></Field><Field label="Point de rassemblement"><input value={meetingPoint} onChange={(event) => setMeetingPoint(event.target.value)} className={inputClass} placeholder="Siège, quartier, partenaire…" /></Field></div></ModalSection><ModalSection title="Gouvernance de journée" subtitle="Responsabilité et checkpoint"><div className="grid gap-4"><Field label="Coordinateur" required><input value={coordinator} onChange={(event) => setCoordinator(event.target.value)} className={inputClass} placeholder="Responsable de la feuille de route" /></Field><Field label="Politique de checkpoint"><textarea value={policy} onChange={(event) => setPolicy(event.target.value)} className={textAreaClass} /></Field><ScoreBlock label="Missions planifiées" value={Math.min(100, selectedIds.length * 20)} /></div></ModalSection></div></MissionModalFrame>;
}

function ExportModal({ missions, ambassadors, busy, feedback, onClose, setBusy, setFeedback }: { missions: AnyRow[]; ambassadors: Map<string, AnyRow>; busy: boolean; feedback: any; onClose: () => void; setBusy: (value: boolean) => void; setFeedback: (value: any) => void }) {
  const [format, setFormat] = useState("csv"); const [scope, setScope] = useState("all"); const [columns, setColumns] = useState(["mission", "city", "ambassador", "status", "priority", "due", "leads", "conversions", "proof"]); const available = [{ id: "mission", label: "Mission" }, { id: "city", label: "Ville" }, { id: "ambassador", label: "Ambassadeur" }, { id: "status", label: "Statut" }, { id: "priority", label: "Priorité" }, { id: "due", label: "Échéance" }, { id: "leads", label: "Leads" }, { id: "conversions", label: "Conversions" }, { id: "cost", label: "Coût" }, { id: "proof", label: "Preuve" }, { id: "quality", label: "Qualité" }]; const rows = missions.filter((item) => scope === "all" || normalizeStatus(item) === scope);
  function rowValue(mission: AnyRow, column: string) { const meta = parseMeta(mission.instructions); if (column === "mission") return `${missionCode(mission)} · ${missionTitle(mission)}`; if (column === "city") return text(mission.city); if (column === "ambassador") { const record = ambassadors.get(String(mission.ambassador_id || "")); return text(record?.full_name, record?.name, "Non affecté"); } if (column === "status") return statusLabels[normalizeStatus(mission)]; if (column === "priority") return priorityLabel(mission.priority); if (column === "due") return shortDate(mission.due_date); if (column === "leads") return numberValue(meta.metrics?.leads); if (column === "conversions") return numberValue(meta.metrics?.conversions); if (column === "cost") return numberValue(meta.metrics?.cost); if (column === "proof") return proofReady(mission, meta) ? "Conforme" : "Manquante"; if (column === "quality") return numberValue(meta.metrics?.quality); return ""; }
  async function submit() { if (!columns.length) return; setBusy(true); setFeedback(null); try { const headers = columns.map((column) => available.find((item) => item.id === column)?.label || column); if (format === "json") downloadBlob(`angelcare-missions-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(rows.map((mission) => Object.fromEntries(columns.map((column, index) => [headers[index], rowValue(mission, column)]))), null, 2), "application/json;charset=utf-8"); else downloadBlob(`angelcare-missions-${new Date().toISOString().slice(0, 10)}.csv`, [headers.map(csvEscape).join(","), ...rows.map((mission) => columns.map((column) => csvEscape(rowValue(mission, column))).join(","))].join("\n"), "text/csv;charset=utf-8"); await fetch("/api/market-os/ambassadors/reports/export", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ report_type: "missions", title: "Export missions terrain", filters: { scope, format, columns } }) }).catch(() => null); setFeedback({ tone: "success", text: `${rows.length} mission(s) exportée(s) depuis les données réelles.` }); } catch (caught) { setFeedback({ tone: "error", text: caught instanceof Error ? caught.message : "Export impossible" }); } finally { setBusy(false); } }
  return <MissionModalFrame title="Studio d’export missions terrain" subtitle="Définissez le périmètre, le format et les colonnes du rapport. Aucun enregistrement fictif n’est ajouté à l’export." icon={Download} onClose={onClose} width="max-w-[1320px]" footer={<ModalFooter busy={busy} blocked={!columns.length} blockedText="Sélectionnez au moins une colonne." onClose={onClose} primaryLabel="Générer l’export" onPrimary={() => void submit()} />}><ModalFeedback feedback={feedback} /><div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr_0.7fr]"><ModalSection title="Périmètre" subtitle="Filtre de cycle"><Field label="Étape mission"><select value={scope} onChange={(event) => setScope(event.target.value)} className={inputClass}><option value="all">Toutes les missions</option>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></Field><Field label="Format"><select value={format} onChange={(event) => setFormat(event.target.value)} className={inputClass}><option value="csv">CSV opérationnel</option><option value="json">JSON structuré</option></select></Field></ModalSection><ModalSection title="Colonnes du rapport" subtitle="Sélection du contenu exploitable"><div className="grid gap-2 sm:grid-cols-2">{available.map((item) => { const active = columns.includes(item.id); return <button key={item.id} type="button" onClick={() => setColumns((rows) => active ? rows.filter((row) => row !== item.id) : [...rows, item.id])} className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-xs font-black ${active ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700"}`}><span>{item.label}</span><span>{active ? "✓" : "+"}</span></button>; })}</div></ModalSection><ModalSection title="Prévisualisation" subtitle="Volume réel du fichier"><ScoreBlock label="Missions incluses" value={Math.min(100, rows.length ? 100 : 0)} /><div className="mt-4 space-y-2"><DetailLine label="Enregistrements" value={String(rows.length)} /><DetailLine label="Colonnes" value={String(columns.length)} /><DetailLine label="Format" value={format.toUpperCase()} /></div></ModalSection></div></MissionModalFrame>;
}

function ProgressModal({ missions, selectedMission, busy, feedback, onClose, onSubmit }: { missions: AnyRow[]; selectedMission: AnyRow | null; busy: boolean; feedback: any; onClose: () => void; onSubmit: (mission: AnyRow, patch: AnyRow, message: string) => Promise<boolean> }) {
  const [missionId, setMissionId] = useState(String(selectedMission?.id || "")); const mission = missions.find((item) => String(item.id) === missionId) || null; const meta = mission ? parseMeta(mission.instructions) : {}; const [progress, setProgress] = useState(String(numberValue(meta.progress))); const [checkpoint, setCheckpoint] = useState(text(meta.checkpoint)); const [nextCheckpoint, setNextCheckpoint] = useState(text(meta.nextCheckpoint)); const [leads, setLeads] = useState(String(numberValue(meta.metrics?.leads))); const [conversions, setConversions] = useState(String(numberValue(meta.metrics?.conversions))); const [note, setNote] = useState("");
  useEffect(() => { if (!mission) return; const next = parseMeta(mission.instructions); setProgress(String(numberValue(next.progress))); setCheckpoint(text(next.checkpoint)); setNextCheckpoint(text(next.nextCheckpoint)); setLeads(String(numberValue(next.metrics?.leads))); setConversions(String(numberValue(next.metrics?.conversions))); }, [missionId]);
  async function submit() { if (!mission || !checkpoint) return; const value = Math.max(0, Math.min(100, numberValue(progress))); await onSubmit(mission, { status: value >= 100 ? "validation" : "in_progress", instructions: withMeta(mission, { progress: value, checkpoint, nextCheckpoint: nextCheckpoint || note, metrics: { leads: numberValue(leads), conversions: numberValue(conversions) } }) }, "Progression et checkpoint mission synchronisés."); }
  return <MissionModalFrame title="Journal de progression mission" subtitle="Enregistrez l’avancement réel, le checkpoint atteint, les résultats intermédiaires et la prochaine décision attendue." icon={Target} onClose={onClose} width="max-w-[1320px]" footer={<ModalFooter busy={busy} blocked={!missionId || !checkpoint} blockedText="Bloqué : mission et checkpoint atteint requis." onClose={onClose} primaryLabel="Synchroniser la progression" onPrimary={() => void submit()} />}><ModalFeedback feedback={feedback} /><div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr_0.75fr]"><ModalSection title="Mission" subtitle="Dossier d’exécution"><Field label="Mission" required><MissionSelect missions={missions} value={missionId} onChange={setMissionId} /></Field>{mission ? <div className="mt-4"><StatusPill group={normalizeStatus(mission)} /></div> : null}</ModalSection><ModalSection title="Checkpoint & résultats" subtitle="Mesure de l’exécution"><div className="grid gap-4 sm:grid-cols-2"><Field label="Progression %"><input type="number" min="0" max="100" value={progress} onChange={(event) => setProgress(event.target.value)} className={inputClass} /></Field><Field label="Checkpoint atteint" required><input value={checkpoint} onChange={(event) => setCheckpoint(event.target.value)} className={inputClass} placeholder="Ex. 12 conversations qualifiées" /></Field><Field label="Leads constatés"><input type="number" min="0" value={leads} onChange={(event) => setLeads(event.target.value)} className={inputClass} /></Field><Field label="Conversions constatées"><input type="number" min="0" value={conversions} onChange={(event) => setConversions(event.target.value)} className={inputClass} /></Field><Field label="Prochain checkpoint"><input value={nextCheckpoint} onChange={(event) => setNextCheckpoint(event.target.value)} className={inputClass} /></Field><Field label="Note / blocage"><input value={note} onChange={(event) => setNote(event.target.value)} className={inputClass} /></Field></div></ModalSection><ModalSection title="Lecture opérationnelle" subtitle="État après synchronisation"><ScoreBlock label="Avancement mission" value={Math.max(0, Math.min(100, numberValue(progress)))} /><div className="mt-4 space-y-2"><CheckLine ok={Boolean(checkpoint)} label="Checkpoint documenté" /><CheckLine ok={Boolean(nextCheckpoint || note)} label="Prochaine étape identifiée" /><CheckLine ok={numberValue(progress) < 100 || Boolean(checkpoint)} label="Passage validation contrôlé" /></div></ModalSection></div></MissionModalFrame>;
}

function EvidenceModal({ missions, selectedMission, busy, feedback, onClose, onSubmit }: { missions: AnyRow[]; selectedMission: AnyRow | null; busy: boolean; feedback: any; onClose: () => void; onSubmit: (mission: AnyRow, patch: AnyRow, message: string) => Promise<boolean> }) {
  const [missionId, setMissionId] = useState(String(selectedMission?.id || "")); const mission = missions.find((item) => String(item.id) === missionId) || null; const [typeValue, setTypeValue] = useState("photo_terrain"); const [url, setUrl] = useState(text(mission?.evidence_url)); const [proofStatus, setProofStatus] = useState(text(mission?.proof_status, "submitted")); const [note, setNote] = useState("");
  async function submit() { if (!mission || !url) return; const meta = parseMeta(mission.instructions); const evidence = [...(meta.evidence || []), { id: `ev-${Date.now()}`, type: typeValue, url, note, createdAt: new Date().toISOString() }]; await onSubmit(mission, { evidence_url: url, proof_status: proofStatus, instructions: withMeta(mission, { evidence }) }, "Preuve ajoutée au dossier mission et synchronisée."); }
  return <MissionModalFrame title="Dépôt et contrôle de preuve mission" subtitle="Associez une preuve exploitable à une mission réelle, qualifiez son type et définissez son état de contrôle." icon={FileText} onClose={onClose} width="max-w-[1260px]" footer={<ModalFooter busy={busy} blocked={!missionId || !url} blockedText="Bloqué : mission et lien de preuve requis." onClose={onClose} primaryLabel="Enregistrer la preuve" onPrimary={() => void submit()} />}><ModalFeedback feedback={feedback} /><div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr_0.75fr]"><ModalSection title="Mission concernée" subtitle="Dossier source"><Field label="Mission" required><MissionSelect missions={missions} value={missionId} onChange={setMissionId} /></Field></ModalSection><ModalSection title="Preuve opérationnelle" subtitle="Type, emplacement et note"><div className="grid gap-4 sm:grid-cols-2"><Field label="Type de preuve"><select value={typeValue} onChange={(event) => setTypeValue(event.target.value)} className={inputClass}><option value="photo_terrain">Photo terrain</option><option value="liste_contacts">Liste contacts</option><option value="capture_whatsapp">Capture WhatsApp</option><option value="note_partenaire">Note partenaire</option><option value="rapport_mission">Rapport mission</option><option value="preuve_conversion">Preuve conversion</option></select></Field><Field label="État de contrôle"><select value={proofStatus} onChange={(event) => setProofStatus(event.target.value)} className={inputClass}><option value="submitted">Soumise</option><option value="verified">Vérifiée</option><option value="approved">Approuvée</option></select></Field><div className="sm:col-span-2"><Field label="URL / emplacement Drive" required><input value={url} onChange={(event) => setUrl(event.target.value)} className={inputClass} placeholder="https://…" /></Field></div><div className="sm:col-span-2"><Field label="Note de preuve"><textarea value={note} onChange={(event) => setNote(event.target.value)} className={textAreaClass} /></Field></div></div></ModalSection><ModalSection title="Conformité preuve" subtitle="Contrôles avant enregistrement"><div className="space-y-2"><CheckLine ok={Boolean(missionId)} label="Mission identifiée" /><CheckLine ok={Boolean(typeValue)} label="Type de preuve qualifié" /><CheckLine ok={Boolean(url)} label="Justificatif accessible" /><CheckLine ok={["verified", "approved"].includes(proofStatus)} label="Contrôle qualité effectué" /></div></ModalSection></div></MissionModalFrame>;
}

function IncidentModal({ missions, selectedMission, busy, feedback, onClose, onSubmit }: { missions: AnyRow[]; selectedMission: AnyRow | null; busy: boolean; feedback: any; onClose: () => void; onSubmit: (mission: AnyRow, patch: AnyRow, message: string) => Promise<boolean> }) {
  const [missionId, setMissionId] = useState(String(selectedMission?.id || "")); const mission = missions.find((item) => String(item.id) === missionId) || null; const [severity, setSeverity] = useState("high"); const [category, setCategory] = useState("execution_terrain"); const [owner, setOwner] = useState(""); const [sla, setSla] = useState("4"); const [description, setDescription] = useState("");
  async function submit() { if (!mission || !description || !owner) return; const meta = parseMeta(mission.instructions); const incident = { id: `inc-${Date.now()}`, severity, category, owner, description, openedAt: new Date().toISOString(), status: "open", slaHours: numberValue(sla) }; await onSubmit(mission, { instructions: withMeta(mission, { incidents: [...(meta.incidents || []), incident] }) }, "Incident créé dans le dossier mission et file d’escalade mise à jour."); }
  return <MissionModalFrame title="Ouverture d’incident et escalade mission" subtitle="Formalisez la criticité, la catégorie, le responsable de décision, le SLA et le contexte factuel sans sortir du dossier mission." icon={AlertTriangle} onClose={onClose} width="max-w-[1280px]" footer={<ModalFooter busy={busy} blocked={!missionId || !description || !owner} blockedText="Bloqué : mission, description factuelle et responsable d’escalade requis." onClose={onClose} primaryLabel="Ouvrir l’incident" onPrimary={() => void submit()} />}><ModalFeedback feedback={feedback} /><div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr_0.75fr]"><ModalSection title="Mission impactée" subtitle="Contexte source"><Field label="Mission" required><MissionSelect missions={missions} value={missionId} onChange={setMissionId} /></Field></ModalSection><ModalSection title="Qualification de l’incident" subtitle="Faits, criticité et responsabilité"><div className="grid gap-4 sm:grid-cols-2"><Field label="Sévérité"><select value={severity} onChange={(event) => setSeverity(event.target.value)} className={inputClass}><option value="critical">Critique</option><option value="high">Élevée</option><option value="medium">Moyenne</option><option value="low">Faible</option></select></Field><Field label="Catégorie"><select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option value="execution_terrain">Exécution terrain</option><option value="securite">Sécurité</option><option value="client_partenaire">Client / partenaire</option><option value="preuve_conformite">Preuve / conformité</option><option value="transport_logistique">Transport / logistique</option><option value="ambassadeur_indisponible">Ambassadeur indisponible</option></select></Field><Field label="Responsable escalade" required><input value={owner} onChange={(event) => setOwner(event.target.value)} className={inputClass} /></Field><Field label="SLA décision (heures)"><input type="number" min="1" value={sla} onChange={(event) => setSla(event.target.value)} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Description factuelle" required><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={textAreaClass} placeholder="Que s’est-il passé, où, quand, impact et mesure immédiate…" /></Field></div></div></ModalSection><ModalSection title="Readiness escalade" subtitle="Conditions de traçabilité"><div className="space-y-2"><CheckLine ok={Boolean(missionId)} label="Mission reliée" /><CheckLine ok={Boolean(description)} label="Faits documentés" /><CheckLine ok={Boolean(owner)} label="Responsable identifié" /><CheckLine ok={numberValue(sla) > 0} label="SLA de décision défini" /></div></ModalSection></div></MissionModalFrame>;
}

function ValidationModal({ missions, selectedMission, busy, feedback, onClose, onSubmit }: { missions: AnyRow[]; selectedMission: AnyRow | null; busy: boolean; feedback: any; onClose: () => void; onSubmit: (mission: AnyRow, patch: AnyRow, message: string) => Promise<boolean> }) {
  const [missionId, setMissionId] = useState(String(selectedMission?.id || "")); const mission = missions.find((item) => String(item.id) === missionId) || null; const [reviewer, setReviewer] = useState(""); const [decision, setDecision] = useState("submit"); const [score, setScore] = useState("0"); const [note, setNote] = useState("");
  async function submit() { if (!mission || !reviewer || !note) return; const decidedAt = new Date().toISOString(); const status = decision === "approved" ? "completed" : decision === "rework" ? "in_progress" : "validation"; await onSubmit(mission, { status, completed_at: decision === "approved" ? decidedAt : mission.completed_at, instructions: withMeta(mission, { validation: { reviewer, decision, score: numberValue(score), note, decidedAt }, metrics: { quality: numberValue(score) / 20 } }) }, decision === "approved" ? "Exécution validée et mission clôturée." : decision === "rework" ? "Mission renvoyée en exécution avec décision tracée." : "Mission soumise à validation."); }
  return <MissionModalFrame title="Validation d’exécution mission" subtitle="Évaluez la qualité, la preuve, les résultats et la décision finale avec un responsable clairement identifié." icon={ShieldCheck} onClose={onClose} width="max-w-[1280px]" footer={<ModalFooter busy={busy} blocked={!missionId || !reviewer || !note} blockedText="Bloqué : mission, responsable et note de décision requis." onClose={onClose} primaryLabel="Enregistrer la décision" onPrimary={() => void submit()} />}><ModalFeedback feedback={feedback} /><div className="grid gap-5 lg:grid-cols-[0.8fr_1.15fr_0.8fr]"><ModalSection title="Mission à valider" subtitle="Dossier d’exécution"><Field label="Mission" required><MissionSelect missions={missions} value={missionId} onChange={setMissionId} /></Field>{mission ? <div className="mt-4 space-y-2"><DetailLine label="Preuve" value={proofReady(mission) ? "Disponible" : "Manquante"} /><DetailLine label="Progression" value={`${numberValue(parseMeta(mission.instructions).progress)}%`} /></div> : null}</ModalSection><ModalSection title="Décision qualité" subtitle="Responsable, score et justification"><div className="grid gap-4 sm:grid-cols-2"><Field label="Responsable validation" required><input value={reviewer} onChange={(event) => setReviewer(event.target.value)} className={inputClass} /></Field><Field label="Décision"><select value={decision} onChange={(event) => setDecision(event.target.value)} className={inputClass}><option value="submit">Soumettre en validation</option><option value="approved">Approuver l’exécution</option><option value="rework">Retour pour correction</option></select></Field><Field label="Score /100"><input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Note de décision" required><textarea value={note} onChange={(event) => setNote(event.target.value)} className={textAreaClass} /></Field></div></div></ModalSection><ModalSection title="Contrôle final" subtitle="Garde-fous avant décision"><ScoreBlock label="Score proposé" value={Math.max(0, Math.min(100, numberValue(score)))} /><div className="mt-4 space-y-2"><CheckLine ok={Boolean(missionId)} label="Mission identifiée" /><CheckLine ok={Boolean(reviewer)} label="Validateur responsable" /><CheckLine ok={Boolean(note)} label="Décision justifiée" /><CheckLine ok={decision !== "approved" || Boolean(mission && proofReady(mission))} label="Preuve disponible avant approbation" /></div></ModalSection></div></MissionModalFrame>;
}

function ModalSection({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5"><h3 data-section-title="true" className="text-sm font-black !text-black" style={{ color: "#000000", WebkitTextFillColor: "#000000", fontWeight: 900, opacity: 1 }}>{title}</h3><p className="mt-1 text-[11px] font-semibold text-slate-500">{subtitle}</p></div>{children}</section>;
}

function CheckLine({ ok, label }: { ok: boolean; label: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3"><div className={`grid h-6 w-6 place-items-center rounded-full ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}</div><span className="text-xs font-bold text-slate-700">{label}</span></div>;
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(100, value || 0));
  return <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div><div className="text-2xl font-black text-slate-950">{safe}%</div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className={`h-full rounded-full ${safe >= 80 ? "bg-emerald-500" : safe >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${safe}%` }} /></div></div>;
}

function ModalFooter({ busy, blocked, blockedText, onClose, primaryLabel, onPrimary }: { busy: boolean; blocked: boolean; blockedText: string; onClose: () => void; primaryLabel: string; onPrimary: () => void }) {
  return <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className={`text-xs font-bold ${blocked ? "text-amber-700" : "text-emerald-700"}`}>{blocked ? blockedText : "Contrôles minimum satisfaits. La synchronisation peut être exécutée."}</div><div className="flex items-center justify-end gap-2"><button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50">Fermer</button><button type="button" disabled={busy || blocked} onClick={onPrimary} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{primaryLabel}</button></div></div>;
}
