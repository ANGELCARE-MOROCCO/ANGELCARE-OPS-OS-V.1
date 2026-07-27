export type AcCapitalRole =
  | "Founder / Managing Director"
  | "Capital Strategy Admin"
  | "AI System Admin"
  | "Capital Coordinator"
  | "Finance/Admin Reviewer"
  | "Data Room Owner"
  | "Read-only Viewer"
  | "system-safe";

const sensitiveRoles: AcCapitalRole[] = [
  "Founder / Managing Director",
  "Capital Strategy Admin",
  "AI System Admin",
];

export function canPerformSensitiveAction(role?: string | null) {
  return sensitiveRoles.includes((role || "system-safe") as AcCapitalRole);
}

export function resolveSystemSafeRole(role?: string | null): AcCapitalRole {
  return (role || "system-safe") as AcCapitalRole;
}
