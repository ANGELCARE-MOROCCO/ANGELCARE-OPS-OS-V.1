export type HardeningSeverity = "low" | "medium" | "high" | "critical";
export type HardeningStatus = "passed" | "warning" | "failed" | "pending";

export type ProductionDiagnostic = {
  id: string;
  area:
    | "routes"
    | "typescript"
    | "permissions"
    | "data"
    | "security"
    | "performance"
    | "sync"
    | "ui"
    | "governance";
  title: string;
  status: HardeningStatus;
  severity: HardeningSeverity;
  recommendation: string;
};

export type RouteCoverageItem = {
  id: string;
  route: string;
  phase: string;
  status: "available" | "missing" | "duplicate_risk" | "needs_sidebar_link";
  owner: string;
};

export type BuildSafetyCheck = {
  id: string;
  checkName: string;
  status: HardeningStatus;
  risk: HardeningSeverity;
  detail: string;
};

export type ReleaseReadinessGate = {
  id: string;
  gate: string;
  required: boolean;
  status: HardeningStatus;
  blocker: boolean;
  nextAction: string;
};

export type ProductionHardeningSnapshot = {
  diagnostics: ProductionDiagnostic[];
  routes: RouteCoverageItem[];
  buildChecks: BuildSafetyCheck[];
  releaseGates: ReleaseReadinessGate[];
};
