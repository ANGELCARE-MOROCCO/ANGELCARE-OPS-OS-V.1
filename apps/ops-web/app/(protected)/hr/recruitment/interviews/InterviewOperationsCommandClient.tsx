"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  Edit3,
  ExternalLink,
  FileCheck2,
  Filter,
  ListChecks,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  UsersRound,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import styles from "./InterviewOperationsCommand.module.css";
import type {
  InterviewActionInput,
  InterviewCommandSnapshot,
  InterviewDecision,
  InterviewInput,
  InterviewMode,
  InterviewRecord,
  InterviewStatus,
  InterviewType,
} from "@/lib/hr-recruitment/interviews/types";

type ViewMode = "agenda" | "week" | "queue" | "feedback";
type ModalMode = "create" | "edit" | "cancel" | "decision" | "task" | "comment" | "feedback" | null;
type DrawerTab = "overview" | "candidate" | "evaluation" | "actions" | "audit";

type RequestResult<T> = { ok: true } & T;
type ErrorResult = { ok: false; error?: string; code?: string; conflicts?: InterviewRecord[] };

type InterviewDraft = {
  candidateId: string;
  newCandidateName: string;
  newCandidateEmail: string;
  newCandidatePhone: string;
  newCandidateCity: string;
  positionTitle: string;
  openingId: string;
  interviewType: InterviewType;
  status: InterviewStatus;
  scheduledLocal: string;
  durationMinutes: string;
  timezone: string;
  mode: InterviewMode;
  location: string;
  meetingUrl: string;
  leadInterviewer: string;
  leadInterviewerId: string;
  panelMembers: string;
  coordinator: string;
  priority: "normal" | "high" | "urgent";
  pipelineStageAfter: string;
  decision: InterviewDecision;
  score: string;
  competencies: string;
  notes: string;
  feedbackDueAt: string;
  createPreparationTask: boolean;
  preparationTaskTitle: string;
  version: number;
};

const interviewTypeLabels: Record<InterviewType, string> = {
  screening: "Préqualification",
  technical: "Entretien technique",
  hr_interview: "Entretien RH",
  assessment: "Évaluation",
  final_interview: "Entretien final",
  panel_interview: "Entretien panel",
};

const statusLabels: Record<InterviewStatus, string> = {
  scheduled: "Planifié",
  confirmed: "Confirmé",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
};

const decisionLabels: Record<InterviewDecision, string> = {
  pending: "Décision en attente",
  shortlisted: "Présélectionné",
  assessment: "Avancer vers évaluation",
  offer: "Avancer vers offre",
  on_hold: "En attente",
  rejected: "Rejeté",
  another_interview: "Nouvel entretien requis",
};

const checkpointLabels: Record<string, string> = {
  candidate_validated: "Candidat validé",
  conflicts_checked: "Conflits vérifiés",
  interview_created: "Entretien créé",
  interview_updated: "Entretien mis à jour",
  interview_cancelled: "Entretien annulé",
  candidate_synchronized: "Dossier candidat synchronisé",
  task_created: "Tâche de préparation créée",
  activity_recorded: "Preuve d’activité enregistrée",
  routes_revalidated: "Espaces recrutement actualisés",
  comment_recorded: "Note enregistrée",
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const pad = (value: number) => String(value).padStart(2, "0");
const dateIso = (value: Date) => `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
const addDays = (iso: string, amount: number) => {
  const value = new Date(`${iso}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return dateIso(value);
};
const addMonths = (iso: string, amount: number) => {
  const value = new Date(`${iso}T12:00:00`);
  value.setDate(1);
  value.setMonth(value.getMonth() + amount);
  return dateIso(value);
};
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDateTime = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca" });
const localDateOf = (record: InterviewRecord) => record.scheduledLocal.slice(0, 10);
const localTimeOf = (record: InterviewRecord) => record.scheduledLocal.slice(11, 16);
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AC";
const startOfWeek = (iso: string) => {
  const value = new Date(`${iso}T12:00:00`);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return dateIso(value);
};
const monthDays = (iso: string) => {
  const current = new Date(`${iso}T12:00:00`);
  const first = new Date(current.getFullYear(), current.getMonth(), 1);
  const blanks = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const total = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  return [...Array.from({ length: blanks }, () => null), ...Array.from({ length: total }, (_, index) => index + 1)];
};
const monthDayIso = (monthIso: string, day: number) => `${monthIso.slice(0, 8)}${pad(day)}`;
const statusTone = (status: InterviewStatus) => {
  if (status === "completed") return { background: "#ecfdf5", color: "#047857" };
  if (status === "cancelled" || status === "no_show") return { background: "#fff1f2", color: "#be123c" };
  if (status === "confirmed") return { background: "#eff6ff", color: "#1d4ed8" };
  if (status === "in_progress") return { background: "#fff7ed", color: "#c2410c" };
  return { background: "#eef2ff", color: "#4338ca" };
};
const typeTone = (type: InterviewType) => {
  if (type === "technical") return { "--card-bg": "#eff6ff", "--card-border": "#bfdbfe", "--card-color": "#1d4ed8" } as CSSProperties;
  if (type === "assessment") return { "--card-bg": "#fff7ed", "--card-border": "#fed7aa", "--card-color": "#c2410c" } as CSSProperties;
  if (type === "final_interview") return { "--card-bg": "#fff1f2", "--card-border": "#fecdd3", "--card-color": "#be123c" } as CSSProperties;
  if (type === "screening") return { "--card-bg": "#ecfdf5", "--card-border": "#a7f3d0", "--card-color": "#047857" } as CSSProperties;
  if (type === "panel_interview") return { "--card-bg": "#fdf4ff", "--card-border": "#f5d0fe", "--card-color": "#a21caf" } as CSSProperties;
  return { "--card-bg": "#eef2ff", "--card-border": "#c7d2fe", "--card-color": "#4338ca" } as CSSProperties;
};

function defaultDraft(snapshot: InterviewCommandSnapshot, date: string, time = "09:00", interviewer = ""): InterviewDraft {
  const firstInterviewer = snapshot.interviewers[0];
  return {
    candidateId: "",
    newCandidateName: "",
    newCandidateEmail: "",
    newCandidatePhone: "",
    newCandidateCity: "",
    positionTitle: "",
    openingId: "",
    interviewType: "hr_interview",
    status: "scheduled",
    scheduledLocal: `${date}T${time}`,
    durationMinutes: "60",
    timezone: snapshot.timezone,
    mode: "video",
    location: "",
    meetingUrl: "",
    leadInterviewer: interviewer || firstInterviewer?.fullName || "",
    leadInterviewerId: interviewer ? snapshot.interviewers.find((person) => person.fullName === interviewer)?.id || "" : firstInterviewer?.id || "",
    panelMembers: "",
    coordinator: "",
    priority: "normal",
    pipelineStageAfter: "interview",
    decision: "pending",
    score: "",
    competencies: "Communication\nCompétences métier\nAdéquation culturelle\nDisponibilité",
    notes: "",
    feedbackDueAt: `${date}T17:00`,
    createPreparationTask: true,
    preparationTaskTitle: "",
    version: 0,
  };
}

function draftFromInterview(record: InterviewRecord): InterviewDraft {
  const competencies = Array.isArray(record.scorecard.competencies) ? record.scorecard.competencies.map(String).join("\n") : "Communication\nCompétences métier\nAdéquation culturelle\nDisponibilité";
  return {
    candidateId: record.candidateId,
    newCandidateName: record.candidateName,
    newCandidateEmail: record.candidateEmail || "",
    newCandidatePhone: record.candidatePhone || "",
    newCandidateCity: record.city || "",
    positionTitle: record.positionTitle || "",
    openingId: record.openingId || "",
    interviewType: record.interviewType,
    status: record.status,
    scheduledLocal: record.scheduledLocal,
    durationMinutes: String(record.durationMinutes),
    timezone: record.timezone,
    mode: record.mode,
    location: record.location || "",
    meetingUrl: record.meetingUrl || "",
    leadInterviewer: record.leadInterviewer,
    leadInterviewerId: record.leadInterviewerId || "",
    panelMembers: record.panelMembers.join(", "),
    coordinator: record.coordinator || "",
    priority: record.priority,
    pipelineStageAfter: record.pipelineStageAfter || "interview",
    decision: record.decision,
    score: record.score === null ? "" : String(record.score),
    competencies,
    notes: record.notes || "",
    feedbackDueAt: record.feedbackDueAt ? record.feedbackDueAt.slice(0, 16) : record.scheduledLocal.slice(0, 10) + "T17:00",
    createPreparationTask: false,
    preparationTaskTitle: "",
    version: record.version,
  };
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<RequestResult<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store", headers: { "content-type": "application/json", ...(init?.headers || {}) } });
    const payload = (await response.json().catch(() => ({ ok: false, error: "Réponse serveur illisible." }))) as RequestResult<T> | ErrorResult;
    if (!response.ok || payload.ok !== true) {
      const failure = payload as ErrorResult;
      throw Object.assign(new Error(failure.error || "Opération impossible."), { payload: failure });
    }
    return payload as RequestResult<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Le serveur n’a pas répondu dans le délai prévu.");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function Metric({ label, value, note, glow }: { label: string; value: string | number; note: string; glow: string }) {
  return <div className={styles.metric} style={{ "--metric-glow": glow } as CSSProperties}><div className={styles.metricLabel}>{label}</div><div className={styles.metricValue}>{value}</div><div className={styles.metricNote}>{note}</div></div>;
}

function StatusBadge({ status }: { status: InterviewStatus }) {
  return <span className={styles.statusBadge} style={statusTone(status)}>{statusLabels[status]}</span>;
}

function MiniCalendar({ selectedDate, activeDates, onChange }: { selectedDate: string; activeDates: Set<string>; onChange: (date: string) => void }) {
  const days = monthDays(selectedDate);
  return <section className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelTitle}>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</div><div className={styles.panelSubtitle}>Navigation mensuelle réelle</div></div><div className={styles.dateControls}><button className={styles.buttonGhost} onClick={() => onChange(addMonths(selectedDate, -1))} aria-label="Mois précédent"><ChevronLeft size={15} /></button><button className={styles.buttonGhost} onClick={() => onChange(addMonths(selectedDate, 1))} aria-label="Mois suivant"><ChevronRight size={15} /></button></div></div><div className={styles.panelBody}><div className={styles.calendarGrid}>{["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((label) => <div className={styles.calendarWeekday} key={label}>{label}</div>)}{days.map((day, index) => day === null ? <span className={styles.calendarDayMuted} key={`blank-${index}`} /> : (() => { const iso = monthDayIso(selectedDate, day); return <button key={iso} className={iso === selectedDate ? styles.calendarDayActive : styles.calendarDay} onClick={() => onChange(iso)}>{day}{activeDates.has(iso) && <span className={styles.calendarDot} />}</button>; })())}</div></div></section>;
}

function InterviewFormModal({ mode, snapshot, draft, setDraft, onClose, onSubmit, busy }: { mode: "create" | "edit"; snapshot: InterviewCommandSnapshot; draft: InterviewDraft; setDraft: (next: InterviewDraft) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) {
  const selectedCandidate = snapshot.candidates.find((candidate) => candidate.id === draft.candidateId);
  const update = <K extends keyof InterviewDraft>(key: K, value: InterviewDraft[K]) => setDraft({ ...draft, [key]: value });
  const candidateChanged = (candidateId: string) => {
    const candidate = snapshot.candidates.find((item) => item.id === candidateId);
    setDraft({ ...draft, candidateId, newCandidateName: candidate?.fullName || "", newCandidateEmail: candidate?.email || "", newCandidatePhone: candidate?.phone || "", newCandidateCity: candidate?.city || "", positionTitle: candidate?.positionTitle || draft.positionTitle, openingId: candidate?.openingId || draft.openingId });
  };
  return <div className={styles.modalBackdrop} role="dialog" aria-modal="true"><form className={styles.modal} onSubmit={onSubmit}><div className={styles.modalHeader}><div><span className={styles.eyebrow}><Sparkles size={13} /> Commandement entretien</span><div className={styles.modalTitle}>{mode === "create" ? "Planifier un entretien" : "Modifier et resynchroniser l’entretien"}</div><div className={styles.modalSubtitle}>Candidat, agenda, équipe, évaluation et synchronisation dans une seule opération contrôlée.</div></div><button type="button" className={styles.closeButton} onClick={onClose}><X size={18} /></button></div><div className={styles.modalBody}><div className={styles.formGrid}>
    <section className={styles.formSection}><div className={styles.sectionTitle}><CircleUserRound size={16} /> Candidat</div><div className={styles.sectionText}>Sélectionnez un dossier existant ou créez un candidat sans doublon.</div><div className={styles.fields}><label className={`${styles.label} ${styles.fieldWide}`}>Dossier candidat<select className={styles.select} value={draft.candidateId} onChange={(event) => candidateChanged(event.target.value)} disabled={mode === "edit"}><option value="">Nouveau candidat</option>{snapshot.candidates.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.fullName} · {candidate.positionTitle || "Poste non défini"}</option>)}</select></label><label className={styles.label}>Nom complet<input className={styles.input} value={draft.newCandidateName} onChange={(event) => update("newCandidateName", event.target.value)} disabled={Boolean(selectedCandidate)} required={!draft.candidateId} /></label><label className={styles.label}>Poste<input className={styles.input} value={draft.positionTitle} onChange={(event) => update("positionTitle", event.target.value)} required /></label><label className={styles.label}>Email<input className={styles.input} type="email" value={draft.newCandidateEmail} onChange={(event) => update("newCandidateEmail", event.target.value)} disabled={Boolean(selectedCandidate)} /></label><label className={styles.label}>Téléphone<input className={styles.input} value={draft.newCandidatePhone} onChange={(event) => update("newCandidatePhone", event.target.value)} disabled={Boolean(selectedCandidate)} /></label><label className={styles.label}>Ville<input className={styles.input} value={draft.newCandidateCity} onChange={(event) => update("newCandidateCity", event.target.value)} disabled={Boolean(selectedCandidate)} /></label><label className={styles.label}>Ouverture de poste<select className={styles.select} value={draft.openingId} onChange={(event) => update("openingId", event.target.value)}><option value="">Aucune ouverture liée</option>{snapshot.openings.map((opening) => <option value={opening.id} key={opening.id}>{opening.title}</option>)}</select></label></div></section>
    <section className={styles.formSection}><div className={styles.sectionTitle}><CalendarCheck2 size={16} /> Planification</div><div className={styles.sectionText}>Fuseau Africa/Casablanca et contrôle des chevauchements avant écriture.</div><div className={styles.fields}><label className={`${styles.label} ${styles.fieldWide}`}>Date et heure<input className={styles.input} type="datetime-local" value={draft.scheduledLocal} onChange={(event) => update("scheduledLocal", event.target.value)} required /></label><label className={styles.label}>Durée<select className={styles.select} value={draft.durationMinutes} onChange={(event) => update("durationMinutes", event.target.value)}>{[30,45,60,75,90,120].map((minutes) => <option value={minutes} key={minutes}>{minutes} minutes</option>)}</select></label><label className={styles.label}>Type<select className={styles.select} value={draft.interviewType} onChange={(event) => update("interviewType", event.target.value as InterviewType)}>{Object.entries(interviewTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className={styles.label}>Mode<select className={styles.select} value={draft.mode} onChange={(event) => update("mode", event.target.value as InterviewMode)}><option value="video">Visioconférence</option><option value="onsite">Présentiel</option><option value="phone">Téléphone</option></select></label><label className={styles.label}>Lieu<input className={styles.input} value={draft.location} onChange={(event) => update("location", event.target.value)} placeholder="Bureau, site ou salle" /></label><label className={`${styles.label} ${styles.fieldWide}`}>Lien de réunion<input className={styles.input} type="url" value={draft.meetingUrl} onChange={(event) => update("meetingUrl", event.target.value)} placeholder="https://..." /></label></div></section>
    <section className={styles.formSection}><div className={styles.sectionTitle}><UsersRound size={16} /> Équipe d’entretien</div><div className={styles.sectionText}>Les intervenants proviennent des collaborateurs et utilisateurs actifs.</div><div className={styles.fields}><label className={`${styles.label} ${styles.fieldWide}`}>Intervieweur principal<select className={styles.select} value={draft.leadInterviewerId} onChange={(event) => { const person = snapshot.interviewers.find((item) => item.id === event.target.value); setDraft({ ...draft, leadInterviewerId: event.target.value, leadInterviewer: person?.fullName || "" }); }} required><option value="">Sélectionner</option>{snapshot.interviewers.map((person) => <option value={person.id} key={person.id}>{person.fullName} · {person.position || person.department || "Équipe"}</option>)}</select></label><label className={`${styles.label} ${styles.fieldWide}`}>Membres du panel<input className={styles.input} value={draft.panelMembers} onChange={(event) => update("panelMembers", event.target.value)} placeholder="Noms séparés par des virgules" /></label><label className={`${styles.label} ${styles.fieldWide}`}>Coordinateur<input className={styles.input} value={draft.coordinator} onChange={(event) => update("coordinator", event.target.value)} /></label></div></section>
    <section className={styles.formSection}><div className={styles.sectionTitle}><Target size={16} /> Évaluation et pipeline</div><div className={styles.sectionText}>Préparez la grille et le résultat attendu sans écraser les tours précédents.</div><div className={styles.fields}><label className={styles.label}>Priorité<select className={styles.select} value={draft.priority} onChange={(event) => update("priority", event.target.value as InterviewDraft["priority"])}><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></label><label className={styles.label}>Étape après entretien<select className={styles.select} value={draft.pipelineStageAfter} onChange={(event) => update("pipelineStageAfter", event.target.value)}><option value="interview">Entretien</option><option value="assessment">Évaluation</option><option value="offer">Offre</option><option value="screening">Préqualification</option></select></label><label className={styles.label}>Décision<select className={styles.select} value={draft.decision} onChange={(event) => update("decision", event.target.value as InterviewDecision)}>{Object.entries(decisionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className={styles.label}>Score<input className={styles.input} type="number" min="0" max="100" value={draft.score} onChange={(event) => update("score", event.target.value)} /></label><label className={`${styles.label} ${styles.fieldWide}`}>Compétences évaluées<textarea className={styles.textarea} value={draft.competencies} onChange={(event) => update("competencies", event.target.value)} /></label></div></section>
    <section className={`${styles.formSection} ${styles.formSectionWide}`}><div className={styles.sectionTitle}><ClipboardCheck size={16} /> Exécution et synchronisation</div><div className={styles.sectionText}>Le dossier candidat, les espaces recrutement, la tâche et l’audit sont validés avant le succès final.</div><div className={styles.fields}><label className={`${styles.label} ${styles.fieldWide}`}>Plan et notes<textarea className={styles.textarea} value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Objectifs, risques, éléments à vérifier et consignes internes..." /></label><label className={styles.label}>Échéance feedback<input className={styles.input} type="datetime-local" value={draft.feedbackDueAt} onChange={(event) => update("feedbackDueAt", event.target.value)} /></label><label className={styles.label}>Statut<select className={styles.select} value={draft.status} onChange={(event) => update("status", event.target.value as InterviewStatus)}><option value="scheduled">Planifié</option><option value="confirmed">Confirmé</option><option value="in_progress">En cours</option><option value="completed">Terminé</option></select></label><label className={`${styles.checkRow} ${styles.fieldWide}`}><input type="checkbox" checked={draft.createPreparationTask} onChange={(event) => update("createPreparationTask", event.target.checked)} /><span><strong>Créer une tâche de préparation liée</strong><br /><small>La sauvegarde échoue clairement si la tâche obligatoire ne peut pas être créée.</small></span></label>{draft.createPreparationTask && <label className={`${styles.label} ${styles.fieldWide}`}>Titre de la tâche<input className={styles.input} value={draft.preparationTaskTitle} onChange={(event) => update("preparationTaskTitle", event.target.value)} placeholder={`Préparer l’entretien de ${draft.newCandidateName || "ce candidat"}`} /></label>}</div></section>
  </div></div><div className={styles.modalFooter}><span className={styles.panelSubtitle}>Version {draft.version || "nouvelle"} · {snapshot.timezone}</span><div className={styles.headerActions}><button type="button" className={styles.button} onClick={onClose}>Annuler</button><button type="submit" className={styles.buttonPrimary} disabled={busy}><Check size={16} /> {mode === "create" ? "Planifier et synchroniser" : "Enregistrer et resynchroniser"}</button></div></div></form></div>;
}

function SimpleActionModal({ mode, record, onClose, onSubmit, busy }: { mode: Exclude<ModalMode, "create" | "edit" | null>; record: InterviewRecord; onClose: () => void; onSubmit: (payload: Record<string, string | number>) => void; busy: boolean }) {
  const [fields, setFields] = useState<Record<string, string>>({ reason: "", notes: "", decision: record.decision, pipelineStage: record.pipelineStageAfter || "interview", title: `Suivi entretien — ${record.candidateName}`, owner: record.leadInterviewer, priority: "high", dueDate: record.scheduledLocal.slice(0,10), comment: "", feedback: "", score: record.score === null ? "" : String(record.score) });
  const update = (key: string, value: string) => setFields((current) => ({ ...current, [key]: value }));
  const title = mode === "cancel" ? "Annuler l’entretien" : mode === "decision" ? "Décision rapide" : mode === "task" ? "Créer une tâche liée" : mode === "feedback" ? "Soumettre le feedback" : "Ajouter une note interne";
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, key === "score" && value ? Number(value) : value]))); };
  return <div className={styles.modalBackdrop}><form className={`${styles.modal} ${styles.modalSmall}`} onSubmit={submit}><div className={styles.modalHeader}><div><div className={styles.modalTitle}>{title}</div><div className={styles.modalSubtitle}>{record.candidateName} · version {record.version}</div></div><button type="button" className={styles.closeButton} onClick={onClose}><X size={18} /></button></div><div className={styles.modalBody}><div className={styles.fields}>
    {mode === "cancel" && <><label className={`${styles.label} ${styles.fieldWide}`}>Motif obligatoire<textarea className={styles.textarea} value={fields.reason} onChange={(event) => update("reason", event.target.value)} required /></label><label className={styles.label}>Retour pipeline<select className={styles.select} value={fields.pipelineStage} onChange={(event) => update("pipelineStage", event.target.value)}><option value="screening">Préqualification</option><option value="interview">Entretien</option><option value="on_hold">En attente</option></select></label><label className={`${styles.label} ${styles.fieldWide}`}>Notes<textarea className={styles.textarea} value={fields.notes} onChange={(event) => update("notes", event.target.value)} /></label></>}
    {mode === "decision" && <><label className={styles.label}>Décision<select className={styles.select} value={fields.decision} onChange={(event) => update("decision", event.target.value)}>{Object.entries(decisionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className={styles.label}>Étape pipeline<select className={styles.select} value={fields.pipelineStage} onChange={(event) => update("pipelineStage", event.target.value)}><option value="interview">Entretien</option><option value="assessment">Évaluation</option><option value="offer">Offre</option><option value="on_hold">En attente</option><option value="rejected">Rejeté</option></select></label><label className={`${styles.label} ${styles.fieldWide}`}>Justification<textarea className={styles.textarea} value={fields.notes} onChange={(event) => update("notes", event.target.value)} /></label></>}
    {mode === "task" && <><label className={`${styles.label} ${styles.fieldWide}`}>Titre<input className={styles.input} value={fields.title} onChange={(event) => update("title", event.target.value)} required /></label><label className={styles.label}>Responsable<input className={styles.input} value={fields.owner} onChange={(event) => update("owner", event.target.value)} /></label><label className={styles.label}>Priorité<select className={styles.select} value={fields.priority} onChange={(event) => update("priority", event.target.value)}><option value="medium">Moyenne</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></label><label className={styles.label}>Échéance<input className={styles.input} type="date" value={fields.dueDate} onChange={(event) => update("dueDate", event.target.value)} /></label><label className={`${styles.label} ${styles.fieldWide}`}>Description<textarea className={styles.textarea} value={fields.notes} onChange={(event) => update("notes", event.target.value)} /></label></>}
    {mode === "comment" && <label className={`${styles.label} ${styles.fieldWide}`}>Note interne<textarea className={styles.textarea} value={fields.comment} onChange={(event) => update("comment", event.target.value)} required placeholder="Feedback, préoccupation, prochain pas..." /></label>}
    {mode === "feedback" && <><label className={styles.label}>Score final<input className={styles.input} type="number" min="0" max="100" value={fields.score} onChange={(event) => update("score", event.target.value)} /></label><label className={styles.label}>Décision<select className={styles.select} value={fields.decision} onChange={(event) => update("decision", event.target.value)}>{Object.entries(decisionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className={`${styles.label} ${styles.fieldWide}`}>Feedback obligatoire<textarea className={styles.textarea} value={fields.feedback} onChange={(event) => update("feedback", event.target.value)} required /></label></>}
  </div></div><div className={styles.modalFooter}><span /><div className={styles.headerActions}><button type="button" className={styles.button} onClick={onClose}>Fermer</button><button className={mode === "cancel" ? styles.buttonDanger : styles.buttonPrimary} disabled={busy}>{mode === "cancel" ? "Confirmer l’annulation" : "Enregistrer"}</button></div></div></form></div>;
}

function InterviewDrawer({ record, snapshot, tab, setTab, onClose, onEdit, onAction, onQuickStatus }: { record: InterviewRecord; snapshot: InterviewCommandSnapshot; tab: DrawerTab; setTab: (tab: DrawerTab) => void; onClose: () => void; onEdit: () => void; onAction: (mode: Exclude<ModalMode, "create" | "edit" | null>) => void; onQuickStatus: (action: "complete" | "no_show") => void }) {
  const activities = snapshot.activities.filter((activity) => activity.interviewId === record.id);
  const candidate = snapshot.candidates.find((item) => item.id === record.candidateId);
  const detail = (label: string, value: string | number | null | undefined) => <div className={styles.detailCell}><div className={styles.detailLabel}>{label}</div><div className={styles.detailValue}>{value || "—"}</div></div>;
  return <div className={styles.drawerBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className={styles.drawer}><div className={styles.drawerHeader}><div className={styles.drawerIdentity}><div className={styles.avatar}>{initials(record.candidateName)}</div><div><div className={styles.modalTitle}>{record.candidateName}</div><div className={styles.modalSubtitle}>{record.positionTitle || "Poste non défini"} · {shortDateTime(record.scheduledAt)}</div></div><button className={styles.closeButton} onClick={onClose} style={{ marginLeft: "auto" }}><X size={18} /></button></div><div className={styles.cardFooter}><StatusBadge status={record.status} /><span className={styles.tag}>{interviewTypeLabels[record.interviewType]}</span><span className={styles.tag}>Version {record.version}</span></div></div><div className={styles.drawerBody}><div className={styles.tabs}>{(["overview","candidate","evaluation","actions","audit"] as DrawerTab[]).map((item) => <button key={item} className={tab === item ? styles.tabActive : styles.tab} onClick={() => setTab(item)}>{item === "overview" ? "Vue d’ensemble" : item === "candidate" ? "Candidat" : item === "evaluation" ? "Évaluation" : item === "actions" ? "Actions" : "Audit"}</button>)}</div>
    {tab === "overview" && <><div className={styles.detailGrid}>{detail("Date et heure", shortDateTime(record.scheduledAt))}{detail("Durée", `${record.durationMinutes} min`)}{detail("Intervieweur", record.leadInterviewer)}{detail("Mode", record.mode)}{detail("Lieu", record.location)}{detail("Réunion", record.meetingUrl)}{detail("Décision", decisionLabels[record.decision])}{detail("Feedback", record.feedbackStatus)}</div><div className={styles.actionGrid}><button className={styles.buttonPrimary} onClick={onEdit}><Edit3 size={15} /> Modifier</button>{record.meetingUrl ? <a className={styles.button} href={record.meetingUrl} target="_blank" rel="noreferrer"><Video size={15} /> Rejoindre</a> : <button className={styles.button} disabled title="Aucun lien de réunion"><Video size={15} /> Rejoindre</button>}<button className={styles.button} onClick={() => onAction("decision")}><Target size={15} /> Décision</button><button className={styles.buttonDanger} onClick={() => onAction("cancel")} disabled={record.status === "cancelled"}><XCircle size={15} /> Annuler</button></div>{record.notes && <div className={styles.activityItem} style={{ marginTop: 14 }}><div className={styles.activityTitle}>Plan et notes</div><div className={styles.activityDetail}>{record.notes}</div></div>}</>}
    {tab === "candidate" && <div className={styles.detailGrid}>{detail("Dossier", candidate?.fullName || record.candidateName)}{detail("Email", candidate?.email || record.candidateEmail)}{detail("Téléphone", candidate?.phone || record.candidatePhone)}{detail("Ville", candidate?.city || record.city)}{detail("Pipeline", candidate?.pipelineStage)}{detail("Décision", candidate?.decision)}<div className={`${styles.detailCell}`} style={{ gridColumn: "1 / -1" }}><Link className={styles.button} href={`/hr/recruitment/candidates/${record.candidateId}`}><ExternalLink size={15} /> Ouvrir le dossier candidat</Link></div></div>}
    {tab === "evaluation" && <><div className={styles.detailGrid}>{detail("Score", record.score)}{detail("Décision", decisionLabels[record.decision])}{detail("Feedback", record.feedbackStatus)}{detail("Échéance", record.feedbackDueAt ? shortDateTime(record.feedbackDueAt) : null)}</div><div className={styles.actionGrid}><button className={styles.buttonPrimary} onClick={() => onAction("feedback")}><FileCheck2 size={15} /> Soumettre feedback</button><button className={styles.button} onClick={() => onAction("decision")}><Target size={15} /> Décision rapide</button></div></>}
    {tab === "actions" && <div className={styles.actionGrid}><button className={styles.buttonPrimary} onClick={() => onQuickStatus("complete")} disabled={record.status === "completed"}><CheckCircle2 size={15} /> Marquer terminé</button><button className={styles.button} onClick={() => onQuickStatus("no_show")} disabled={record.status === "no_show"}><XCircle size={15} /> Enregistrer absence</button><button className={styles.button} onClick={() => onAction("task")}><ListChecks size={15} /> Créer une tâche</button><button className={styles.button} onClick={() => onAction("comment")}><MessageSquareText size={15} /> Ajouter une note</button><button className={styles.button} onClick={() => onAction("decision")}><UserRoundCheck size={15} /> Décision</button><button className={styles.buttonDanger} onClick={() => onAction("cancel")}><XCircle size={15} /> Annulation contrôlée</button></div>}
    {tab === "audit" && <div className={styles.activityList}>{activities.length ? activities.map((activity) => <div className={styles.activityItem} key={activity.id}><div className={styles.activityTitle}>{activity.title}</div><div className={styles.activityMeta}>{activity.actorLabel || "Système"} · {shortDateTime(activity.createdAt)} · {activity.activityType}</div>{activity.detail && <div className={styles.activityDetail}>{activity.detail}</div>}</div>) : <div className={styles.empty}><div className={styles.emptyIcon}><ShieldCheck /></div><div className={styles.emptyTitle}>Aucune activité enregistrée</div></div>}</div>}
  </div></aside></div>;
}

export default function InterviewOperationsCommandClient({ initialSnapshot }: { initialSnapshot: InterviewCommandSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [view, setView] = useState<ViewMode>("agenda");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [interviewerFilter, setInterviewerFilter] = useState("");
  const [selected, setSelected] = useState<InterviewRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");
  const [modal, setModal] = useState<ModalMode>(null);
  const [draft, setDraft] = useState<InterviewDraft>(() => defaultDraft(initialSnapshot, todayIso()));
  const [busy, setBusy] = useState(false);
  const [operationLabel, setOperationLabel] = useState("");
  const [checkpoints, setCheckpoints] = useState<string[]>([]);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refresh = async (preserveSelectedId?: string) => {
    const result = await requestJson<{ snapshot: InterviewCommandSnapshot }>("/api/hr/recruitment/interviews");
    setSnapshot(result.snapshot);
    if (preserveSelectedId) setSelected(result.snapshot.interviews.find((item) => item.id === preserveSelectedId) || null);
  };

  type MutationPayload = { interview: InterviewRecord; checkpoints: string[] };
  const execute = async (label: string, request: () => Promise<RequestResult<MutationPayload>>) => {
    setBusy(true); setOperationLabel(label); setCheckpoints([]); setNotice(null);
    try {
      const result = await request();
      setCheckpoints(result.checkpoints || []);
      await refresh(result.interview.id);
      setNotice({ type: "success", text: `${label} terminé avec synchronisation vérifiée.` });
      window.setTimeout(() => { setModal(null); setOperationLabel(""); setCheckpoints([]); }, 900);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Opération impossible.";
      setNotice({ type: "error", text: message });
      setOperationLabel("");
    } finally { setBusy(false); }
  };

  useEffect(() => { if (selected && !snapshot.interviews.some((item) => item.id === selected.id)) setSelected(null); }, [snapshot, selected]);

  const activeDates = useMemo(() => new Set(snapshot.interviews.filter((record) => !["cancelled"].includes(record.status)).map(localDateOf)), [snapshot.interviews]);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => snapshot.interviews.filter((record) => {
    const matchesQuery = !normalizedQuery || [record.candidateName, record.positionTitle, record.leadInterviewer, record.candidateEmail, record.interviewType].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? ["scheduled","confirmed","in_progress"].includes(record.status) : record.status === statusFilter);
    const matchesInterviewer = !interviewerFilter || record.leadInterviewer === interviewerFilter || record.panelMembers.includes(interviewerFilter);
    return matchesQuery && matchesStatus && matchesInterviewer;
  }), [snapshot.interviews, normalizedQuery, statusFilter, interviewerFilter]);
  const dayInterviews = filtered.filter((record) => localDateOf(record) === selectedDate).sort((a,b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const weekStart = startOfWeek(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const upcoming = filtered.filter((record) => record.scheduledAt >= new Date().toISOString() && ["scheduled","confirmed","in_progress"].includes(record.status)).sort((a,b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const feedbackQueue = filtered.filter((record) => record.feedbackStatus === "pending" || record.feedbackStatus === "overdue").sort((a,b) => String(a.feedbackDueAt).localeCompare(String(b.feedbackDueAt)));
  const selectedDayInterviewers = Array.from(new Set(dayInterviews.map((record) => record.leadInterviewer)));
  const visibleInterviewers = (selectedDayInterviewers.length ? selectedDayInterviewers : snapshot.interviewers.map((person) => person.fullName)).slice(0, 6);
  const timelineHours = Array.from({ length: 11 }, (_, index) => `${pad(index + 8)}:00`);
  const conflictCount = useMemo(() => {
    const active = snapshot.interviews.filter((record) => ["scheduled", "confirmed", "in_progress"].includes(record.status));
    let conflicts = 0;
    for (let left = 0; left < active.length; left += 1) {
      for (let right = left + 1; right < active.length; right += 1) {
        const first = active[left];
        const second = active[right];
        const firstPeople = new Set([first.leadInterviewer, ...first.panelMembers].map((value) => value.toLowerCase()));
        const sharedPerson = [second.leadInterviewer, ...second.panelMembers].some((value) => firstPeople.has(value.toLowerCase()));
        if (!sharedPerson) continue;
        const firstStart = new Date(first.scheduledAt).getTime();
        const firstEnd = firstStart + first.durationMinutes * 60_000;
        const secondStart = new Date(second.scheduledAt).getTime();
        const secondEnd = secondStart + second.durationMinutes * 60_000;
        if (firstStart < secondEnd && secondStart < firstEnd) conflicts += 1;
      }
    }
    return conflicts;
  }, [snapshot.interviews]);
  const metrics = {
    today: snapshot.interviews.filter((record) => localDateOf(record) === todayIso() && !["cancelled"].includes(record.status)).length,
    sevenDays: snapshot.interviews.filter((record) => { const date = localDateOf(record); return date >= todayIso() && date <= addDays(todayIso(), 7) && !["cancelled"].includes(record.status); }).length,
    pending: snapshot.interviews.filter((record) => record.status === "scheduled").length,
    feedback: feedbackQueue.length,
    completed: snapshot.interviews.filter((record) => record.status === "completed").length,
    conflicts: conflictCount,
    unscheduled: snapshot.candidates.filter((candidate) => candidate.pipelineStage?.includes("interview") && !snapshot.interviews.some((record) => record.candidateId === candidate.id && ["scheduled","confirmed"].includes(record.status))).length,
  };

  const openCreate = (date = selectedDate, time = "09:00", interviewer = "") => { setDraft(defaultDraft(snapshot, date, time, interviewer)); setModal("create"); setNotice(null); };
  const openEdit = () => { if (!selected) return; setDraft(draftFromInterview(selected)); setModal("edit"); setNotice(null); };
  const submitInterview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: InterviewInput = {
      candidateId: draft.candidateId || null,
      newCandidate: draft.candidateId ? null : { fullName: draft.newCandidateName, email: draft.newCandidateEmail || null, phone: draft.newCandidatePhone || null, city: draft.newCandidateCity || null, positionTitle: draft.positionTitle, openingId: draft.openingId || null },
      openingId: draft.openingId || null,
      candidateName: draft.newCandidateName || null,
      candidateEmail: draft.newCandidateEmail || null,
      candidatePhone: draft.newCandidatePhone || null,
      city: draft.newCandidateCity || null,
      positionTitle: draft.positionTitle,
      interviewType: draft.interviewType,
      status: draft.status,
      scheduledLocal: draft.scheduledLocal,
      durationMinutes: Number(draft.durationMinutes),
      timezone: draft.timezone,
      mode: draft.mode,
      location: draft.location || null,
      meetingUrl: draft.meetingUrl || null,
      leadInterviewer: draft.leadInterviewer,
      leadInterviewerId: draft.leadInterviewerId || null,
      panelMembers: draft.panelMembers.split(",").map((item) => item.trim()).filter(Boolean),
      coordinator: draft.coordinator || null,
      priority: draft.priority,
      pipelineStageAfter: draft.pipelineStageAfter,
      decision: draft.decision,
      score: draft.score ? Number(draft.score) : null,
      scorecard: { competencies: draft.competencies.split("\n").map((item) => item.trim()).filter(Boolean) },
      notes: draft.notes || null,
      feedbackDueAt: draft.feedbackDueAt || null,
      createPreparationTask: draft.createPreparationTask,
      preparationTaskTitle: draft.preparationTaskTitle || null,
      version: draft.version,
    };
    if (modal === "create") execute("Planification de l’entretien", () => requestJson<MutationPayload>("/api/hr/recruitment/interviews", { method: "POST", body: JSON.stringify(input) }));
    else if (selected) execute("Mise à jour de l’entretien", () => requestJson<MutationPayload>(`/api/hr/recruitment/interviews/${selected.id}`, { method: "PATCH", body: JSON.stringify(input) }));
  };

  const submitSimpleAction = (fields: Record<string, string | number>) => {
    if (!selected || !modal || ["create","edit"].includes(modal)) return;
    if (modal === "cancel") execute("Annulation de l’entretien", () => requestJson<MutationPayload>(`/api/hr/recruitment/interviews/${selected.id}`, { method: "DELETE", body: JSON.stringify({ reason: fields.reason, pipelineStage: fields.pipelineStage, notes: fields.notes, version: selected.version }) }));
    else {
      const actionPayload: InterviewActionInput = modal === "decision" ? { action: "decision", decision: String(fields.decision) as InterviewDecision, pipelineStage: String(fields.pipelineStage || ""), notes: String(fields.notes || ""), version: selected.version } : modal === "task" ? { action: "task", title: String(fields.title), owner: String(fields.owner || ""), priority: String(fields.priority || "high"), dueDate: String(fields.dueDate || ""), description: String(fields.notes || "") } : modal === "feedback" ? { action: "feedback", score: fields.score === "" ? null : Number(fields.score), feedback: String(fields.feedback), decision: String(fields.decision) as InterviewDecision, version: selected.version } : { action: "comment", comment: String(fields.comment), visibility: "internal", category: "comment" };
      execute(modal === "decision" ? "Enregistrement de la décision" : modal === "task" ? "Création de la tâche" : modal === "feedback" ? "Soumission du feedback" : "Ajout de la note", () => requestJson<MutationPayload>(`/api/hr/recruitment/interviews/${selected.id}/actions`, { method: "POST", body: JSON.stringify(actionPayload) }));
    }
  };

  const quickStatusAction = (action: "complete" | "no_show") => {
    if (!selected) return;
    const payload: InterviewActionInput = action === "complete" ? { action, score: selected.score, notes: selected.notes, version: selected.version } : { action, notes: selected.notes, version: selected.version };
    execute(action === "complete" ? "Clôture de l’entretien" : "Enregistrement de l’absence", () => requestJson<MutationPayload>(`/api/hr/recruitment/interviews/${selected.id}/actions`, { method: "POST", body: JSON.stringify(payload) }));
  };

  const renderAgenda = () => <section className={`${styles.panel} ${styles.agenda}`}><div className={styles.timelineHeader}><div><div className={styles.panelTitle}>Agenda opérationnel — {longDate(selectedDate)}</div><div className={styles.panelSubtitle}>{dayInterviews.length} entretien(s) · {visibleInterviewers.length} intervieweur(s)</div></div><button className={styles.buttonPrimary} onClick={() => openCreate()}><Plus size={15} /> Planifier</button></div>{visibleInterviewers.length ? <div className={styles.timelineScroller}><div className={styles.timeline} style={{ "--columns": visibleInterviewers.length } as CSSProperties}><div className={styles.columnHead}><div className={styles.panelSubtitle}>Heure locale</div><div className={styles.personName}>Casablanca</div></div>{visibleInterviewers.map((name) => <div className={styles.columnHead} key={name}><div className={styles.personName}>{name}</div><div className={styles.personMeta}>{snapshot.interviewers.find((person) => person.fullName === name)?.position || "Intervieweur"}</div></div>)}{timelineHours.flatMap((hour) => [<div className={styles.timeCell} key={`${hour}-time`}>{hour}</div>, ...visibleInterviewers.map((name) => { const cards = dayInterviews.filter((record) => record.leadInterviewer === name && localTimeOf(record).slice(0,2) === hour.slice(0,2)); return <div className={styles.slot} key={`${hour}-${name}`}><button className={styles.slotAdd} onClick={() => openCreate(selectedDate, hour, name)}><Plus size={14} /> Ajouter</button>{cards.map((record) => <button key={record.id} className={styles.interviewCard} style={typeTone(record.interviewType)} onClick={() => { setSelected(record); setDrawerTab("overview"); }}><div className={styles.cardTop}><span><Clock3 size={11} /> {localTimeOf(record)}</span><StatusBadge status={record.status} /></div><div className={styles.cardName}>{record.candidateName}</div><div className={styles.cardRole}>{record.positionTitle || "Poste"}</div><div className={styles.cardFooter}><span className={styles.tag}>{interviewTypeLabels[record.interviewType]}</span><span className={styles.tag}>{record.durationMinutes} min</span></div></button>)}</div>; })])}</div></div> : <div className={styles.empty}><div className={styles.emptyIcon}><UsersRound /></div><div className={styles.emptyTitle}>Aucun intervieweur actif détecté</div><div className={styles.emptyText}>Ajoutez ou activez un collaborateur RH dans les profils du personnel avant de planifier un entretien.</div></div>}</section>;
  const renderWeek = () => <section className={styles.panel}><div className={styles.timelineHeader}><div><div className={styles.panelTitle}>Semaine du {longDate(weekStart)}</div><div className={styles.panelSubtitle}>Vue consolidée des sept jours</div></div></div><div className={styles.panelBody} style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(170px,1fr))", gap: 10, overflowX: "auto" }}>{weekDates.map((date) => { const records = filtered.filter((record) => localDateOf(record) === date).sort((a,b) => a.scheduledAt.localeCompare(b.scheduledAt)); return <div className={styles.formSection} key={date} style={{ minWidth: 170 }}><button className={styles.buttonGhost} onClick={() => { setSelectedDate(date); setView("agenda"); }} style={{ width: "100%" }}>{new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</button><div className={styles.queueList} style={{ marginTop: 10 }}>{records.map((record) => <button className={styles.queueItem} key={record.id} onClick={() => setSelected(record)}><div className={styles.queueTitle}>{localTimeOf(record)} · {record.candidateName}</div><div className={styles.queueMeta}>{record.leadInterviewer}</div></button>)}{!records.length && <div className={styles.queueMeta}>Aucun entretien</div>}</div></div>; })}</div></section>;
  const renderQueue = (records: InterviewRecord[], title: string, subtitle: string) => <section className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelTitle}>{title}</div><div className={styles.panelSubtitle}>{subtitle}</div></div></div><div className={styles.panelBody}><div className={styles.queueList}>{records.length ? records.map((record) => <button className={styles.queueItem} key={record.id} onClick={() => { setSelected(record); setDrawerTab(view === "feedback" ? "evaluation" : "overview"); }}><div className={styles.queueTop}><div><div className={styles.queueTitle}>{record.candidateName}</div><div className={styles.queueMeta}>{shortDateTime(record.scheduledAt)} · {record.leadInterviewer} · {record.positionTitle || "Poste"}</div></div><StatusBadge status={record.status} /></div><div className={styles.cardFooter}><span className={styles.tag}>{interviewTypeLabels[record.interviewType]}</span><span className={styles.tag}>{decisionLabels[record.decision]}</span>{record.feedbackStatus !== "not_required" && <span className={styles.tag}>Feedback {record.feedbackStatus}</span>}</div></button>) : <div className={styles.empty}><div className={styles.emptyIcon}><CalendarCheck2 /></div><div className={styles.emptyTitle}>Aucun élément dans cette vue</div><div className={styles.emptyText}>Les filtres et l’état de synchronisation ne retournent aucun entretien.</div></div>}</div></div></section>;

  return <div className={styles.shell}><header className={styles.commandHeader}><div className={styles.headerInner}><div><span className={styles.eyebrow}><ShieldCheck size={13} /> Commandement RH recrutement</span><h1 className={styles.title}>Entretiens & Évaluation</h1><p className={styles.subtitle}>Agenda, tours multiples, conflits, décisions, tâches, feedback et audit synchronisés.</p></div><div className={styles.headerActions}><Link className={styles.button} href="/hr/recruitment"><ArrowLeft size={15} /> Recrutement</Link><button className={styles.button} onClick={() => refresh(selected?.id)} disabled={busy}><RefreshCw size={15} /> Actualiser</button><button className={styles.buttonPrimary} onClick={() => openCreate()}><Plus size={15} /> Planifier un entretien</button></div></div></header><main className={styles.content}>
    {notice && <div className={notice.type === "success" ? styles.alertSuccess : styles.alertError} style={{ marginBottom: 14 }}>{notice.text}</div>}
    {snapshot.warnings.length > 0 && <div className={styles.alert} style={{ marginBottom: 14 }}><AlertTriangle size={14} style={{ display: "inline", marginRight: 7 }} /> Certaines sources secondaires n’ont pas répondu. La table canonique des entretiens reste disponible. <details><summary>Diagnostics</summary><pre style={{ whiteSpace: "pre-wrap" }}>{snapshot.warnings.join("\n")}</pre></details></div>}
    <div className={styles.healthRibbon}><Metric label="Aujourd’hui" value={metrics.today} note="Entretiens actifs" glow="#e0e7ff" /><Metric label="7 prochains jours" value={metrics.sevenDays} note="Charge planifiée" glow="#dbeafe" /><Metric label="À confirmer" value={metrics.pending} note="Sessions planifiées" glow="#fef3c7" /><Metric label="Feedback en attente" value={metrics.feedback} note="Suivi obligatoire" glow="#ffe4e6" /><Metric label="Terminés" value={metrics.completed} note="Historique conservé" glow="#d1fae5" /><Metric label="Conflits" value={metrics.conflicts} note="Bloqués avant sauvegarde" glow="#fee2e2" /><Metric label="Sans créneau" value={metrics.unscheduled} note="Candidats à planifier" glow="#f3e8ff" /></div>
    <div className={styles.toolbar}><div className={styles.searchBox}><Search size={16} color="#94a3b8" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher candidat, poste ou intervieweur..." /></div><div className={styles.segmented}>{(["agenda","week","queue","feedback"] as ViewMode[]).map((item) => <button className={view === item ? styles.segmentActive : styles.segment} key={item} onClick={() => setView(item)}>{item === "agenda" ? "Agenda" : item === "week" ? "Semaine" : item === "queue" ? "File entretiens" : "Feedback"}</button>)}</div><div className={styles.dateControls}><button className={styles.buttonGhost} onClick={() => setSelectedDate(addDays(selectedDate, -1))}><ChevronLeft size={15} /></button><div className={styles.dateLabel}>{longDate(selectedDate)}</div><button className={styles.buttonGhost} onClick={() => setSelectedDate(addDays(selectedDate, 1))}><ChevronRight size={15} /></button><button className={styles.button} onClick={() => setSelectedDate(todayIso())}>Aujourd’hui</button></div></div>
    <div className={styles.workspace}><aside style={{ display: "grid", gap: 16 }}><MiniCalendar selectedDate={selectedDate} activeDates={activeDates} onChange={setSelectedDate} /><section className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelTitle}>Filtres opérationnels</div><div className={styles.panelSubtitle}>Les résultats se mettent à jour immédiatement.</div></div><Filter size={16} /></div><div className={styles.panelBody}><div className={styles.filterStack}>{["active","all","scheduled","confirmed","completed","cancelled","no_show"].map((status) => <button key={status} className={statusFilter === status ? styles.filterButtonActive : styles.filterButton} onClick={() => setStatusFilter(status)}><span>{status === "active" ? "Actifs" : status === "all" ? "Tous" : statusLabels[status as InterviewStatus]}</span><MoreHorizontal size={13} /></button>)}</div></div></section><section className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelTitle}>Intervieweurs</div><div className={styles.panelSubtitle}>Personnel réel détecté</div></div></div><div className={styles.panelBody}><div className={styles.filterStack}><button className={!interviewerFilter ? styles.filterButtonActive : styles.filterButton} onClick={() => setInterviewerFilter("")}>Tous les intervieweurs</button>{snapshot.interviewers.slice(0,8).map((person) => <button className={interviewerFilter === person.fullName ? styles.filterButtonActive : styles.filterButton} key={person.id} onClick={() => setInterviewerFilter(person.fullName)}><span className={styles.personRow} style={{ border: 0, padding: 0, background: "transparent" }}><span className={styles.avatar}>{initials(person.fullName)}</span><span><span className={styles.personName}>{person.fullName}</span><span className={styles.personMeta}>{person.position || person.department || "Collaborateur"}</span></span></span></button>)}</div></div></section></aside>
      <div>{view === "agenda" ? renderAgenda() : view === "week" ? renderWeek() : view === "queue" ? renderQueue(upcoming, "File des entretiens", `${upcoming.length} entretien(s) à venir`) : renderQueue(feedbackQueue, "Feedback & décisions", `${feedbackQueue.length} dossier(s) à finaliser`)}</div>
      <aside style={{ display: "grid", gap: 16 }}><section className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelTitle}>Briefing du jour</div><div className={styles.panelSubtitle}>{dayInterviews.length} session(s) sélectionnée(s)</div></div><CalendarDays size={16} /></div><div className={styles.panelBody}><div className={styles.queueList}>{dayInterviews.slice(0,6).map((record) => <button className={styles.queueItem} key={record.id} onClick={() => setSelected(record)}><div className={styles.queueTitle}>{localTimeOf(record)} · {record.candidateName}</div><div className={styles.queueMeta}>{record.leadInterviewer}</div></button>)}{!dayInterviews.length && <div className={styles.emptyText}>Aucun entretien ce jour. Cliquez sur un créneau pour planifier.</div>}</div></div></section><section className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelTitle}>Prochaine session</div><div className={styles.panelSubtitle}>Accès direct au commandement</div></div><Video size={16} /></div><div className={styles.panelBody}>{upcoming[0] ? <div className={styles.queueItem}><div className={styles.queueTitle}>{upcoming[0].candidateName}</div><div className={styles.queueMeta}>{shortDateTime(upcoming[0].scheduledAt)} · {upcoming[0].leadInterviewer}</div><div className={styles.actionGrid}>{upcoming[0].meetingUrl ? <a className={styles.buttonPrimary} href={upcoming[0].meetingUrl} target="_blank" rel="noreferrer"><Video size={14} /> Rejoindre</a> : <button className={styles.button} disabled>Sans lien</button>}<button className={styles.button} onClick={() => setSelected(upcoming[0])}>Ouvrir</button></div></div> : <div className={styles.emptyText}>Aucune session à venir.</div>}</div></section><section className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelTitle}>Actions fiables</div><div className={styles.panelSubtitle}>Aucun bouton décoratif</div></div><CheckCircle2 size={16} /></div><div className={styles.panelBody}><div className={styles.actionGrid}><button className={styles.buttonPrimary} onClick={() => openCreate()}><Plus size={14} /> Planifier</button><button className={styles.button} onClick={() => setView("feedback")}><FileCheck2 size={14} /> Feedback</button><Link className={styles.button} href="/hr/recruitment/candidates"><CircleUserRound size={14} /> Candidats</Link><Link className={styles.button} href="/hr/recruitment/kanban"><BriefcaseBusiness size={14} /> Pipeline</Link></div></div></section></aside>
    </div>
  </main>
  {selected && <InterviewDrawer record={selected} snapshot={snapshot} tab={drawerTab} setTab={setDrawerTab} onClose={() => setSelected(null)} onEdit={openEdit} onAction={(mode) => { setModal(mode); setNotice(null); }} onQuickStatus={quickStatusAction} />}
  {(modal === "create" || modal === "edit") && <InterviewFormModal mode={modal} snapshot={snapshot} draft={draft} setDraft={setDraft} onClose={() => setModal(null)} onSubmit={submitInterview} busy={busy} />}
  {selected && modal && !["create","edit"].includes(modal) && <SimpleActionModal mode={modal as Exclude<ModalMode,"create"|"edit"|null>} record={selected} onClose={() => setModal(null)} onSubmit={submitSimpleAction} busy={busy} />}
  {operationLabel && <div className={styles.operationOverlay}><div className={styles.operationCard}><div className={styles.spinner} /><div className={styles.modalTitle} style={{ marginTop: 16 }}>{operationLabel}</div><div className={styles.modalSubtitle}>Validation, écriture canonique, synchronisation candidat et preuve d’audit.</div><div className={styles.checkpoints}>{checkpoints.length ? checkpoints.map((checkpoint) => <div className={styles.checkpoint} key={checkpoint}><CheckCircle2 size={15} color="#059669" /> {checkpointLabels[checkpoint] || checkpoint}</div>) : <div className={styles.checkpoint}><RefreshCw size={15} /> Opération serveur en cours…</div>}</div></div></div>}
</div>;
}
