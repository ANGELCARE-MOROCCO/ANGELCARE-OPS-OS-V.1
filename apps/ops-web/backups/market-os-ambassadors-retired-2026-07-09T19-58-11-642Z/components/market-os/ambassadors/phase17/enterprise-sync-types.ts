export type SyncHealth = "healthy" | "warning" | "critical";

export type CrossModuleSync = {
  id: string;
  sourceModule: string;
  targetModule: string;
  syncType: string;
  lastSyncAt: string;
  syncHealth: SyncHealth;
  recordsProcessed: number;
  issue?: string;
};

export type UnifiedOperationalFeed = {
  id: string;
  title: string;
  module: string;
  priority: "low" | "medium" | "high" | "critical";
  timestamp: string;
  summary: string;
};

export type DependencyMap = {
  id: string;
  operation: string;
  dependsOn: string[];
  blocked: boolean;
  blockerReason?: string;
};

export type EnterpriseTaskPropagation = {
  id: string;
  originModule: string;
  generatedTask: string;
  assignedTeam: string;
  status: "todo" | "doing" | "done" | "blocked";
};

export type EnterpriseSyncSnapshot = {
  syncs: CrossModuleSync[];
  feeds: UnifiedOperationalFeed[];
  dependencies: DependencyMap[];
  propagations: EnterpriseTaskPropagation[];
};
