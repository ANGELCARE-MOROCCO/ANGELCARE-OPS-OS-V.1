export type CapitalRole =
  | "Founder / Managing Director"
  | "Capital Strategy Admin"
  | "AI System Admin"
  | "Capital Coordinator"
  | "Finance / Admin Reviewer"
  | "Data Room Owner"
  | "Read-only Viewer";

export type CapitalActor = {
  id: string;
  name: string;
  email: string;
  rawRole: string;
  role: CapitalRole;
  permissions: string[];
};

export type DataMode = "supabase-live" | "seeded-fallback" | "disabled";
export type DataSource = "supabase" | "seeded" | "none";

export type ApiEnvelope<T = Record<string, unknown>> = {
  ok: boolean;
  dataMode: DataMode;
  source: DataSource;
  warning?: string;
  code?: string;
  data: T;
};

export type Row = Record<string, unknown>;

export type ActionPhase = "idle" | "validating" | "submitting" | "success" | "error" | "approval-required" | "disabled";

export type ActionState<T = unknown> = {
  phase: ActionPhase;
  message: string;
  data?: T;
};

export type NavigationItem = {
  key: string;
  label: string;
  href: string;
  group: string;
  attention?: boolean;
};
