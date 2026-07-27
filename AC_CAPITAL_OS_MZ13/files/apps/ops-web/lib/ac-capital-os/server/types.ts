export type AcCapitalDataMode = "supabase-live" | "seeded-fallback" | "disabled";
export type AcCapitalSource = "supabase" | "seeded" | "none";

export type AcCapitalWorkspaceKey =
  | "foundation"
  | "executive-cockpit"
  | "capital-radar"
  | "qualification-engine"
  | "funder-intelligence"
  | "capital-doctrine"
  | "case-builder"
  | "data-room"
  | "capital-pipeline"
  | "coordinator-cockpit"
  | "ai-command-center"
  | "strategy-production-command";

export type AcCapitalEnvelope<T> = {
  ok: boolean;
  dataMode: AcCapitalDataMode;
  source: AcCapitalSource;
  warning?: string;
  data: T;
};

export type AcCapitalTableGroup = {
  label: string;
  table: string;
  limit?: number;
};

export type AcCapitalWorkspaceConfig = {
  key: AcCapitalWorkspaceKey;
  title: string;
  groups: AcCapitalTableGroup[];
  safeWriteTable?: string;
};

export type AcCapitalSupabaseConfig = {
  enabled: boolean;
  url?: string;
  key?: string;
  reason?: string;
};

export type AcCapitalWriteResult = {
  ok: boolean;
  dataMode: AcCapitalDataMode;
  source: AcCapitalSource;
  warning?: string;
  record?: unknown;
  code?: string;
};

export type AcCapitalActor = {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
};

export type AcCapitalRiskLevel =
  | "Low"
  | "Medium"
  | "High"
  | "Critical"
  | "Founder Sensitive"
  | "Financial Sensitive"
  | "Legal Sensitive"
  | "Child/Safety Sensitive"
  | "Equity/Dilution Sensitive"
  | "Bank Commitment Sensitive";
