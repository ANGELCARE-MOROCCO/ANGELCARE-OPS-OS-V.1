import type { JourneyCreateInput, OnboardingPhase } from "./types";
import { ONBOARDING_PHASES } from "./types";

export class OnboardingValidationError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "VALIDATION_ERROR", status = 400) {
    super(message);
    this.name = "OnboardingValidationError";
    this.code = code;
    this.status = status;
  }
}

export function nullableText(value: unknown, maxLength = 4000): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new OnboardingValidationError(`La valeur dépasse ${maxLength} caractères.`);
  return normalized;
}

export function requiredText(value: unknown, label: string, maxLength = 400): string {
  const normalized = nullableText(value, maxLength);
  if (!normalized) throw new OnboardingValidationError(`${label} est obligatoire.`);
  return normalized;
}

export function safeInteger(value: unknown, fallback = 0, min = 0, max = 100): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

export function booleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return fallback;
}

export function phaseValue(value: unknown, fallback: OnboardingPhase = "offer_accepted"): OnboardingPhase {
  const candidate = String(value ?? "").trim() as OnboardingPhase;
  return ONBOARDING_PHASES.includes(candidate) ? candidate : fallback;
}

export function dateOrNull(value: unknown): string | null {
  const normalized = nullableText(value, 40);
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(normalized)) throw new OnboardingValidationError("La date fournie est invalide.");
  return normalized.slice(0, 10);
}

export function isoOrNull(value: unknown): string | null {
  const normalized = nullableText(value, 80);
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new OnboardingValidationError("La date et l’heure fournies sont invalides.");
  return date.toISOString();
}

export function versionValue(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) throw new OnboardingValidationError("Version de l’enregistrement invalide.");
  return numeric;
}

export function validateJourneyCreate(input: Record<string, unknown>): JourneyCreateInput {
  const candidateKey = nullableText(input.candidateKey ?? input.candidate_key, 200);
  const staffKey = nullableText(input.staffKey ?? input.staff_key, 200);
  const title = requiredText(input.title, "Le collaborateur ou candidat", 240);
  const idempotencyKey = requiredText(input.idempotencyKey ?? input.idempotency_key, "La clé d’idempotence", 240);
  if (!candidateKey && !staffKey && !nullableText(input.email, 320)) {
    throw new OnboardingValidationError("Sélectionnez un candidat, un collaborateur, ou renseignez son adresse email.");
  }

  return {
    candidateKey,
    staffKey,
    title,
    position: nullableText(input.position, 240),
    department: nullableText(input.department, 240),
    startDate: dateOrNull(input.startDate ?? input.start_date),
    manager: nullableText(input.manager, 240),
    managerKey: nullableText(input.managerKey ?? input.manager_key, 200),
    location: nullableText(input.location, 240),
    employmentType: nullableText(input.employmentType ?? input.employment_type, 120),
    email: nullableText(input.email, 320),
    phone: nullableText(input.phone, 80),
    owner: nullableText(input.owner, 240),
    ownerKey: nullableText(input.ownerKey ?? input.owner_key, 200),
    priority: (["low", "normal", "high", "critical"] as const).includes(String(input.priority) as "low" | "normal" | "high" | "critical")
      ? String(input.priority) as "low" | "normal" | "high" | "critical"
      : "normal",
    riskLevel: (["low", "normal", "high", "critical"] as const).includes(String(input.riskLevel ?? input.risk_level) as "low" | "normal" | "high" | "critical")
      ? String(input.riskLevel ?? input.risk_level) as "low" | "normal" | "high" | "critical"
      : "normal",
    riskNotes: nullableText(input.riskNotes ?? input.risk_notes, 4000),
    checklistKey: nullableText(input.checklistKey ?? input.checklist_key, 200),
    idempotencyKey,
    notes: nullableText(input.notes, 8000),
  };
}
