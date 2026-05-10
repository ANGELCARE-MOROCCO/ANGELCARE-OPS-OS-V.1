export type AmbassadorEnterpriseLayer =
  | "operations"
  | "intelligence"
  | "automation"
  | "governance"
  | "infrastructure"
  | "executive"
  | "market"
  | "production";

export type AmbassadorEnterpriseModule = {
  id: string;
  title: string;
  layer: AmbassadorEnterpriseLayer;
  route: string;
  phaseRange: string;
  maturityScore: number;
  owner: string;
  purpose: string;
  productionStatus: "ready_ui" | "backend_ready" | "needs_backend" | "needs_governance";
};

export type AmbassadorConnectorStatus = "placeholder" | "ready_to_connect" | "connected" | "blocked";

export type AmbassadorBackendConnector = {
  id: string;
  name: string;
  target: "supabase" | "api" | "realtime" | "queue" | "webhook" | "ai_memory" | "notification";
  status: AmbassadorConnectorStatus;
  safetyNote: string;
  nextEngineeringStep: string;
};

export type AmbassadorEnterprisePermission = {
  id: string;
  action: string;
  allowedRoles: string[];
  requiresServerValidation: boolean;
  risk: "low" | "medium" | "high" | "critical";
};

export type AmbassadorAuditEventModel = {
  id: string;
  eventName: string;
  entity: string;
  requiredFields: string[];
  retention: "30d" | "90d" | "1y" | "permanent";
};

export type AmbassadorProductionChecklistItem = {
  id: string;
  area: "build" | "routes" | "data" | "security" | "backend" | "ai" | "deployment";
  title: string;
  status: "passed" | "pending" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  instruction: string;
};

export type AmbassadorEnterpriseSnapshot = {
  modules: AmbassadorEnterpriseModule[];
  connectors: AmbassadorBackendConnector[];
  permissions: AmbassadorEnterprisePermission[];
  auditModels: AmbassadorAuditEventModel[];
  checklist: AmbassadorProductionChecklistItem[];
};
