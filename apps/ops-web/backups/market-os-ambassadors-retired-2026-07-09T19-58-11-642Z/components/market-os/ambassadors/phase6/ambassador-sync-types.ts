export type AmbassadorSyncStatus = "local" | "synced" | "pending" | "conflict" | "failed";

export type AmbassadorEntityKind =
  | "ambassador"
  | "application"
  | "program"
  | "mission"
  | "proof"
  | "reward"
  | "payout"
  | "territory"
  | "lead"
  | "training"
  | "compliance"
  | "communication"
  | "automation";

export type AmbassadorCrudAction = "create" | "read" | "update" | "delete" | "approve" | "reject" | "archive";

export type AmbassadorSyncRecord = {
  id: string;
  entityKind: AmbassadorEntityKind;
  entityId: string;
  title: string;
  action: AmbassadorCrudAction;
  status: AmbassadorSyncStatus;
  owner: string;
  updatedAt: string;
  source: "browser" | "server" | "supabase_ready" | "manual_import";
  riskLevel: "low" | "medium" | "high" | "critical";
  notes: string;
};

export type AmbassadorDataTable = {
  name: string;
  entityKind: AmbassadorEntityKind;
  purpose: string;
  requiredForProduction: boolean;
  recommendedColumns: string[];
  linkedTables: string[];
};

export type AmbassadorSyncHealth = {
  totalRecords: number;
  syncedRecords: number;
  pendingRecords: number;
  conflictRecords: number;
  failedRecords: number;
  highRiskRecords: number;
  syncReadinessScore: number;
};

export type AmbassadorApiRoutePlan = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  entityKind: AmbassadorEntityKind;
  purpose: string;
  protectedByRole: string[];
};
