import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { HRShellSnapshot, HRSnapshotFactor, HRSnapshotTone } from "./types";

const TIMEZONE = "Africa/Casablanca" as const;
const MAX_ROWS_PER_SOURCE = 2500;

export const HR_SNAPSHOT_FACTOR_KEYS = [
  "active_workforce",
  "absent_or_leave_today",
  "late_arrivals_today",
  "missing_checkout",
  "attendance_pending_validation",
  "active_openings",
  "active_candidates",
  "interviews_today",
  "feedback_overdue",
  "active_onboarding",
  "blocked_onboarding",
  "documents_expiring",
  "training_due",
  "performance_reviews_due",
  "approvals_pending",
  "tasks_overdue",
  "roster_coverage",
  "overtime_risk",
  "contracts_expiring",
  "data_sync_health",
] as const;

export const HR_SNAPSHOT_FACTOR_COUNT = HR_SNAPSHOT_FACTOR_KEYS.length;

type Row = Record<string, unknown>;
type SourceResult = { table: string; available: boolean; rows: Row[]; error: string | null };
type SnapshotClient = Awaited<ReturnType<typeof createClient>>;

function isRecord(value: unknown): value is Row {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function numberValue(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
}

function booleanValue(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "1", "oui"].includes(normalized)) return true;
      if (["false", "no", "0", "non"].includes(normalized)) return false;
    }
  }
  return false;
}

function normalizedStatus(row: Row) {
  return (text(row, ["status", "state", "stage", "workflow_status", "attendance_status"]) || "").toLowerCase();
}

function formatDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return `${map.get("year")}-${map.get("month")}-${map.get("day")}`;
}

function dateValue(row: Row, keys: string[]) {
  const raw = text(row, keys);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function rowDateKey(row: Row, keys: string[]) {
  const raw = text(row, keys);
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.slice(0, 10))) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : formatDateKey(parsed);
}

function inDateRange(todayKey: string, row: Row, startKeys: string[], endKeys: string[]) {
  const start = rowDateKey(row, startKeys);
  const end = rowDateKey(row, endKeys) || start;
  return Boolean(start && end && start <= todayKey && end >= todayKey);
}

function activeStatus(status: string) {
  return !["inactive", "terminated", "dismissed", "archived", "cancelled", "canceled", "rejected", "closed"].some((item) => status.includes(item));
}

function completeStatus(status: string) {
  return ["completed", "complete", "done", "validated", "approved", "closed", "finished"].some((item) => status.includes(item));
}

function pendingStatus(status: string) {
  return ["pending", "awaiting", "review", "submitted", "requested", "open", "todo", "to_do", "draft"].some((item) => status.includes(item));
}

function identityKey(row: Row, fallback: string) {
  return text(row, ["staff_id", "employee_id", "user_id", "app_user_id", "candidate_id", "id"]) || fallback;
}

async function readSource(supabase: SnapshotClient | null, table: string): Promise<SourceResult> {
  if (!supabase) return { table, available: false, rows: [], error: "Supabase client unavailable" };
  try {
    const { data, error } = await supabase.from(table).select("*").limit(MAX_ROWS_PER_SOURCE);
    if (error) return { table, available: false, rows: [], error: error.message };
    return {
      table,
      available: true,
      rows: Array.isArray(data) ? data.filter(isRecord) : [],
      error: null,
    };
  } catch (error) {
    return {
      table,
      available: false,
      rows: [],
      error: error instanceof Error ? error.message : "source unavailable",
    };
  }
}

function factor(input: {
  key: (typeof HR_SNAPSHOT_FACTOR_KEYS)[number];
  label: string;
  href: string;
  available: boolean;
  value: number | string;
  sentence: string;
  tone?: HRSnapshotTone;
  unavailableSentence: string;
}): HRSnapshotFactor {
  return {
    key: input.key,
    label: input.label,
    href: input.href,
    available: input.available,
    value: input.available ? String(input.value) : "—",
    sentence: input.available ? input.sentence : input.unavailableSentence,
    tone: input.available ? input.tone || "neutral" : "unavailable",
  };
}

function countDistinct(rows: Row[], predicate: (row: Row) => boolean) {
  const keys = new Set<string>();
  rows.forEach((row, index) => {
    if (predicate(row)) keys.add(identityKey(row, `row-${index}`));
  });
  return keys.size;
}

export async function loadHRShellSnapshot(): Promise<HRShellSnapshot> {
  const now = new Date();
  const todayKey = formatDateKey(now);
  const in30Days = new Date(now.getTime() + 30 * 86_400_000);
  const in60Days = new Date(now.getTime() + 60 * 86_400_000);
  const nextWeekKey = formatDateKey(new Date(now.getTime() + 7 * 86_400_000));

  let supabase: SnapshotClient | null = null;
  try {
    supabase = await createClient();
  } catch {
    supabase = null;
  }

  const [
    staff,
    leave,
    attendance,
    openings,
    candidates,
    interviews,
    onboarding,
    onboardingTasks,
    documents,
    training,
    performance,
    approvals,
    tasks,
    rosters,
    contracts,
    dataQuality,
    syncEvents,
  ] = await Promise.all([
    readSource(supabase, "hr_staff_profiles"),
    readSource(supabase, "hr_leave_requests"),
    readSource(supabase, "hr_attendance_records"),
    readSource(supabase, "hr_opening_jobs"),
    readSource(supabase, "hr_candidates"),
    readSource(supabase, "hr_interviews"),
    readSource(supabase, "hr_onboarding_journeys"),
    readSource(supabase, "hr_onboarding_tasks"),
    readSource(supabase, "hr_documents"),
    readSource(supabase, "hr_training_records"),
    readSource(supabase, "hr_performance_reviews"),
    readSource(supabase, "hr_approval_requests"),
    readSource(supabase, "hr_tasks"),
    readSource(supabase, "hr_roster_assignments"),
    readSource(supabase, "hr_contracts"),
    readSource(supabase, "hr_data_quality_checks"),
    readSource(supabase, "hr_sync_events"),
  ]);

  const activeStaffRows = staff.rows.filter((row) => activeStatus(normalizedStatus(row)));
  const activeWorkforce = activeStaffRows.length;

  const absenceKeys = new Set<string>();
  leave.rows.forEach((row, index) => {
    const status = normalizedStatus(row);
    if (activeStatus(status) && !["rejected", "cancelled", "draft"].some((item) => status.includes(item)) && inDateRange(todayKey, row, ["start_date", "starts_at", "from_date", "leave_start"], ["end_date", "ends_at", "to_date", "leave_end"])) {
      absenceKeys.add(identityKey(row, `leave-${index}`));
    }
  });
  attendance.rows.forEach((row, index) => {
    const status = normalizedStatus(row);
    if (rowDateKey(row, ["work_date", "attendance_date", "date", "created_at"]) === todayKey && ["absent", "absence"].some((item) => status.includes(item))) {
      absenceKeys.add(identityKey(row, `attendance-${index}`));
    }
  });
  const absentToday = absenceKeys.size;

  const lateToday = countDistinct(attendance.rows, (row) => {
    const status = normalizedStatus(row);
    return rowDateKey(row, ["work_date", "attendance_date", "date", "created_at"]) === todayKey && (status.includes("late") || booleanValue(row, ["is_late", "late"]));
  });

  const missingCheckout = countDistinct(attendance.rows, (row) => {
    const dateKey = rowDateKey(row, ["work_date", "attendance_date", "date", "created_at"]);
    const status = normalizedStatus(row);
    const explicit = status.includes("missing_out") || status.includes("missing_checkout") || booleanValue(row, ["missing_checkout", "missing_out"]);
    const priorOpenPunch = Boolean(dateKey && dateKey < todayKey && text(row, ["check_in", "clock_in", "punched_in_at", "started_at"]) && !text(row, ["check_out", "clock_out", "punched_out_at", "ended_at"]));
    return explicit || priorOpenPunch;
  });

  const attendancePending = attendance.rows.filter((row) => pendingStatus(normalizedStatus(row)) && !completeStatus(normalizedStatus(row))).length;
  const activeOpenings = openings.rows.filter((row) => {
    const status = normalizedStatus(row);
    return activeStatus(status) && (!status || ["open", "active", "published", "approved", "recruiting"].some((item) => status.includes(item)));
  }).length;
  const activeCandidates = candidates.rows.filter((row) => activeStatus(normalizedStatus(row)) && !completeStatus(normalizedStatus(row))).length;
  const interviewsToday = interviews.rows.filter((row) => rowDateKey(row, ["scheduled_at", "interview_date", "starts_at", "date"]) === todayKey && activeStatus(normalizedStatus(row))).length;
  const feedbackOverdue = interviews.rows.filter((row) => {
    const status = normalizedStatus(row);
    const feedbackStatus = (text(row, ["feedback_status", "evaluation_status"]) || "").toLowerCase();
    const dueAt = dateValue(row, ["feedback_due_at", "feedback_deadline", "evaluation_due_at"]);
    return Boolean(dueAt && dueAt < now && !completeStatus(feedbackStatus) && !["cancelled", "no_show"].some((item) => status.includes(item)));
  }).length;

  const activeOnboarding = onboarding.rows.filter((row) => activeStatus(normalizedStatus(row)) && !completeStatus(normalizedStatus(row))).length;
  const blockedOnboardingIds = new Set<string>();
  onboarding.rows.forEach((row, index) => {
    const status = normalizedStatus(row);
    const risk = (text(row, ["risk_level", "risk", "health_status"]) || "").toLowerCase();
    if (["blocked", "paused", "critical", "at_risk"].some((item) => status.includes(item) || risk.includes(item))) blockedOnboardingIds.add(identityKey(row, `journey-${index}`));
  });
  onboardingTasks.rows.forEach((row, index) => {
    const status = normalizedStatus(row);
    if (status.includes("blocked") || booleanValue(row, ["is_blocked", "blocked"])) blockedOnboardingIds.add(text(row, ["journey_id", "onboarding_journey_id"]) || `task-${index}`);
  });
  const blockedOnboarding = blockedOnboardingIds.size;

  const documentsExpiring = documents.rows.filter((row) => {
    const expires = dateValue(row, ["expires_at", "expiry_date", "expiration_date", "valid_until"]);
    return Boolean(expires && expires >= now && expires <= in30Days && activeStatus(normalizedStatus(row)));
  }).length;
  const trainingDue = training.rows.filter((row) => {
    const due = dateValue(row, ["due_at", "due_date", "deadline", "scheduled_at"]);
    return Boolean(due && due <= in30Days && !completeStatus(normalizedStatus(row)) && activeStatus(normalizedStatus(row)));
  }).length;
  const performanceDue = performance.rows.filter((row) => {
    const due = dateValue(row, ["due_at", "due_date", "review_due_at", "scheduled_at"]);
    return Boolean(due && due <= in30Days && !completeStatus(normalizedStatus(row)) && activeStatus(normalizedStatus(row)));
  }).length;
  const approvalsPending = approvals.rows.filter((row) => pendingStatus(normalizedStatus(row)) && !completeStatus(normalizedStatus(row))).length;
  const tasksOverdue = tasks.rows.filter((row) => {
    const due = dateValue(row, ["due_at", "due_date", "deadline"]);
    return Boolean(due && due < now && !completeStatus(normalizedStatus(row)) && activeStatus(normalizedStatus(row)));
  }).length;

  const scheduledStaff = new Set<string>();
  rosters.rows.forEach((row, index) => {
    const dateKey = rowDateKey(row, ["work_date", "shift_date", "date", "starts_at"]);
    if (dateKey && dateKey >= todayKey && dateKey <= nextWeekKey && activeStatus(normalizedStatus(row))) scheduledStaff.add(identityKey(row, `roster-${index}`));
  });
  const rosterCoverage = activeWorkforce > 0 ? Math.min(100, Math.round((scheduledStaff.size / activeWorkforce) * 100)) : 0;

  const overtimeRisk = countDistinct(attendance.rows, (row) => {
    const status = normalizedStatus(row);
    const overtimeMinutes = numberValue(row, ["overtime_minutes", "extra_minutes"]);
    const overtimeHours = numberValue(row, ["overtime_hours", "extra_hours"]);
    return status.includes("overtime") || overtimeMinutes >= 120 || overtimeHours >= 2;
  });
  const contractsExpiring = contracts.rows.filter((row) => {
    const end = dateValue(row, ["ends_at", "end_date", "contract_end", "expires_at"]);
    return Boolean(end && end >= now && end <= in60Days && activeStatus(normalizedStatus(row)));
  }).length;

  const dataIssues = dataQuality.rows.filter((row) => {
    const status = normalizedStatus(row);
    const severity = (text(row, ["severity", "risk_level"]) || "").toLowerCase();
    return activeStatus(status) && (["open", "failed", "critical", "warning"].some((item) => status.includes(item)) || ["critical", "high"].some((item) => severity.includes(item)));
  }).length;
  const failedSyncs = syncEvents.rows.filter((row) => ["failed", "error", "critical"].some((item) => normalizedStatus(row).includes(item))).length;
  const healthIssues = dataIssues + failedSyncs;

  const factors: HRSnapshotFactor[] = [
    factor({ key: "active_workforce", label: "Effectif actif", href: "/hr/employees", available: staff.available, value: activeWorkforce, sentence: `${activeWorkforce} collaborateur${activeWorkforce === 1 ? "" : "s"} actif${activeWorkforce === 1 ? "" : "s"} dans le périmètre RH.`, tone: "healthy", unavailableSentence: "Effectif actif temporairement indisponible dans ce snapshot." }),
    factor({ key: "absent_or_leave_today", label: "Absences du jour", href: "/hr/leave", available: leave.available || attendance.available, value: absentToday, sentence: `${absentToday} absence${absentToday === 1 ? " ou congé est enregistré" : "s ou congés sont enregistrés"} aujourd’hui.`, tone: absentToday ? "attention" : "healthy", unavailableSentence: "État des absences et congés temporairement indisponible." }),
    factor({ key: "late_arrivals_today", label: "Retards", href: "/hr/attendance", available: attendance.available, value: lateToday, sentence: `${lateToday} retard${lateToday === 1 ? " est signalé" : "s sont signalés"} aujourd’hui.`, tone: lateToday ? "attention" : "healthy", unavailableSentence: "Signal des retards temporairement indisponible." }),
    factor({ key: "missing_checkout", label: "Sorties manquantes", href: "/hr/attendance", available: attendance.available, value: missingCheckout, sentence: `${missingCheckout} pointage${missingCheckout === 1 ? " de sortie nécessite" : "s de sortie nécessitent"} une régularisation.`, tone: missingCheckout ? "critical" : "healthy", unavailableSentence: "Contrôle des sorties manquantes temporairement indisponible." }),
    factor({ key: "attendance_pending_validation", label: "Présences à valider", href: "/hr/attendance", available: attendance.available, value: attendancePending, sentence: `${attendancePending} enregistrement${attendancePending === 1 ? " de présence attend" : "s de présence attendent"} une validation.`, tone: attendancePending ? "attention" : "healthy", unavailableSentence: "File de validation des présences temporairement indisponible." }),
    factor({ key: "active_openings", label: "Postes ouverts", href: "/hr/openings", available: openings.available, value: activeOpenings, sentence: `${activeOpenings} poste${activeOpenings === 1 ? " est actuellement ouvert" : "s sont actuellement ouverts"} au recrutement.`, tone: "neutral", unavailableSentence: "État des ouvertures de poste temporairement indisponible." }),
    factor({ key: "active_candidates", label: "Candidats actifs", href: "/hr/recruitment", available: candidates.available, value: activeCandidates, sentence: `${activeCandidates} candidat${activeCandidates === 1 ? " progresse" : "s progressent"} actuellement dans le recrutement.`, tone: "neutral", unavailableSentence: "Volume des candidats actifs temporairement indisponible." }),
    factor({ key: "interviews_today", label: "Entretiens aujourd’hui", href: "/hr/recruitment/interviews", available: interviews.available, value: interviewsToday, sentence: `${interviewsToday} entretien${interviewsToday === 1 ? " est programmé" : "s sont programmés"} aujourd’hui.`, tone: interviewsToday ? "neutral" : "healthy", unavailableSentence: "Agenda des entretiens temporairement indisponible." }),
    factor({ key: "feedback_overdue", label: "Feedback en retard", href: "/hr/recruitment/interviews", available: interviews.available, value: feedbackOverdue, sentence: `${feedbackOverdue} retour${feedbackOverdue === 1 ? " d’entretien dépasse" : "s d’entretien dépassent"} son échéance.`, tone: feedbackOverdue ? "critical" : "healthy", unavailableSentence: "État des feedbacks d’entretien temporairement indisponible." }),
    factor({ key: "active_onboarding", label: "Onboarding actifs", href: "/hr/onboarding", available: onboarding.available, value: activeOnboarding, sentence: `${activeOnboarding} parcours d’intégration ${activeOnboarding === 1 ? "est actif" : "sont actifs"}.`, tone: "neutral", unavailableSentence: "Parcours d’intégration actifs temporairement indisponibles." }),
    factor({ key: "blocked_onboarding", label: "Onboarding bloqués", href: "/hr/onboarding", available: onboarding.available || onboardingTasks.available, value: blockedOnboarding, sentence: `${blockedOnboarding} intégration${blockedOnboarding === 1 ? " nécessite" : "s nécessitent"} une intervention.`, tone: blockedOnboarding ? "critical" : "healthy", unavailableSentence: "État des intégrations bloquées temporairement indisponible." }),
    factor({ key: "documents_expiring", label: "Documents à échéance", href: "/hr/documents", available: documents.available, value: documentsExpiring, sentence: `${documentsExpiring} document${documentsExpiring === 1 ? " RH arrive" : "s RH arrivent"} à expiration dans les 30 prochains jours.`, tone: documentsExpiring ? "attention" : "healthy", unavailableSentence: "Échéances documentaires temporairement indisponibles." }),
    factor({ key: "training_due", label: "Formation à échéance", href: "/hr/training", available: training.available, value: trainingDue, sentence: `${trainingDue} affectation${trainingDue === 1 ? " de formation arrive" : "s de formation arrivent"} à échéance.`, tone: trainingDue ? "attention" : "healthy", unavailableSentence: "Échéances de formation temporairement indisponibles." }),
    factor({ key: "performance_reviews_due", label: "Évaluations dues", href: "/hr/performance-matrix", available: performance.available, value: performanceDue, sentence: `${performanceDue} évaluation${performanceDue === 1 ? " de performance est due" : "s de performance sont dues"} prochainement.`, tone: performanceDue ? "attention" : "healthy", unavailableSentence: "Échéances d’évaluation temporairement indisponibles." }),
    factor({ key: "approvals_pending", label: "Approbations", href: "/hr/approvals", available: approvals.available, value: approvalsPending, sentence: `${approvalsPending} approbation${approvalsPending === 1 ? " RH attend" : "s RH attendent"} une décision.`, tone: approvalsPending ? "attention" : "healthy", unavailableSentence: "File des approbations RH temporairement indisponible." }),
    factor({ key: "tasks_overdue", label: "Tâches en retard", href: "/hr", available: tasks.available, value: tasksOverdue, sentence: `${tasksOverdue} tâche${tasksOverdue === 1 ? " RH est en retard" : "s RH sont en retard"}.`, tone: tasksOverdue ? "critical" : "healthy", unavailableSentence: "État des tâches RH en retard temporairement indisponible." }),
    factor({ key: "roster_coverage", label: "Couverture planning", href: "/hr/work-schedules", available: rosters.available && staff.available && activeWorkforce > 0, value: `${rosterCoverage}%`, sentence: `${rosterCoverage} % de l’effectif actif possède une affectation planning sur les sept prochains jours.`, tone: rosterCoverage >= 90 ? "healthy" : rosterCoverage >= 70 ? "attention" : "critical", unavailableSentence: "Couverture planning temporairement indisponible ou effectif actif non mesurable." }),
    factor({ key: "overtime_risk", label: "Risque heures supplémentaires", href: "/hr/time-tracking", available: attendance.available, value: overtimeRisk, sentence: `${overtimeRisk} collaborateur${overtimeRisk === 1 ? " présente" : "s présentent"} un signal d’heures supplémentaires.`, tone: overtimeRisk ? "attention" : "healthy", unavailableSentence: "Risque d’heures supplémentaires temporairement indisponible." }),
    factor({ key: "contracts_expiring", label: "Contrats à échéance", href: "/hr/contracts", available: contracts.available, value: contractsExpiring, sentence: `${contractsExpiring} contrat${contractsExpiring === 1 ? " arrive" : "s arrivent"} à échéance dans les 60 prochains jours.`, tone: contractsExpiring ? "attention" : "healthy", unavailableSentence: "Échéances contractuelles temporairement indisponibles." }),
    factor({ key: "data_sync_health", label: "Santé données & sync", href: "/hr/system-health", available: dataQuality.available || syncEvents.available, value: healthIssues, sentence: healthIssues ? `${healthIssues} anomalie${healthIssues === 1 ? " de données ou synchronisation requiert" : "s de données ou synchronisation requièrent"} une attention.` : "Les sources RH disponibles ne signalent aucune anomalie critique de données ou synchronisation.", tone: healthIssues ? "critical" : "healthy", unavailableSentence: "Santé des données et synchronisations temporairement indisponible." }),
  ];

  if (factors.length !== HR_SNAPSHOT_FACTOR_COUNT) {
    throw new Error(`HR snapshot factor contract violated: expected ${HR_SNAPSHOT_FACTOR_COUNT}, received ${factors.length}.`);
  }

  const available = factors.filter((item) => item.available).length;
  return {
    generatedAt: now.toISOString(),
    generatedLabel: new Intl.DateTimeFormat("fr-MA", { timeZone: TIMEZONE, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(now),
    timezone: TIMEZONE,
    factors,
    sourceHealth: {
      available,
      unavailable: factors.length - available,
      total: factors.length,
    },
  };
}
