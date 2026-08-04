export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export const ONBOARDING_PHASES = [
  "offer_accepted",
  "preboarding",
  "documents",
  "orientation",
  "training_setup",
  "integration",
  "probation",
  "completed",
] as const;

export type OnboardingPhase = (typeof ONBOARDING_PHASES)[number];
export type OnboardingJourneyStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "archived";
export type OnboardingTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked"
  | "waived"
  | "archived";
export type OnboardingDocumentStatus =
  | "required"
  | "requested"
  | "uploaded"
  | "validated"
  | "rejected"
  | "waived"
  | "expired"
  | "archived";

export type OnboardingJourney = {
  journeyKey: string;
  sourceId: string;
  tenantKey: string | null;
  organizationKey: string | null;
  candidateKey: string | null;
  staffKey: string | null;
  title: string;
  position: string | null;
  department: string | null;
  status: OnboardingJourneyStatus;
  phase: OnboardingPhase;
  startDate: string | null;
  manager: string | null;
  managerKey: string | null;
  location: string | null;
  employmentType: string | null;
  email: string | null;
  phone: string | null;
  owner: string | null;
  ownerKey: string | null;
  priority: "low" | "normal" | "high" | "critical";
  riskLevel: "low" | "normal" | "high" | "critical";
  riskNotes: string | null;
  progress: number;
  checklistAssignmentKey: string | null;
  version: number;
  archivedAt: string | null;
  archiveReason: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  metadata: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingTask = {
  taskKey: string;
  sourceId: string;
  journeyKey: string;
  title: string;
  groupName: string;
  phase: OnboardingPhase;
  status: OnboardingTaskStatus;
  owner: string | null;
  ownerKey: string | null;
  priority: "low" | "normal" | "high" | "critical";
  dueAt: string | null;
  completedAt: string | null;
  blockedAt: string | null;
  blockerReason: string | null;
  evidenceUrl: string | null;
  notes: string | null;
  required: boolean;
  sortOrder: number;
  version: number;
  archivedAt: string | null;
  metadata: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingDocument = {
  documentKey: string;
  sourceId: string;
  journeyKey: string;
  title: string;
  category: string;
  documentType: string | null;
  status: OnboardingDocumentStatus;
  owner: string | null;
  ownerKey: string | null;
  required: boolean;
  dueDate: string | null;
  fileUrl: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectedReason: string | null;
  expiresAt: string | null;
  waivedAt: string | null;
  notes: string | null;
  version: number;
  archivedAt: string | null;
  metadata: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingActivity = {
  activityKey: string;
  sourceId: string;
  journeyKey: string;
  type: string;
  status: string;
  title: string;
  body: string | null;
  actorKey: string | null;
  actorName: string | null;
  metadata: JsonObject;
  createdAt: string;
};

export type OnboardingChecklistItem = {
  key: string;
  title: string;
  groupName: string;
  phase: OnboardingPhase;
  ownerRole: string | null;
  priority: "low" | "normal" | "high" | "critical";
  required: boolean;
  dueOffsetDays: number;
  documentRequirement?: boolean;
  documentType?: string | null;
};

export type OnboardingChecklist = {
  checklistKey: string;
  sourceId: string;
  name: string;
  roleKey: string | null;
  departmentKey: string | null;
  status: "draft" | "published" | "inactive" | "archived";
  version: number;
  isPublished: boolean;
  publishedAt: string | null;
  items: OnboardingChecklistItem[];
  notes: string | null;
  metadata: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingPeopleOption = {
  key: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  kind: "candidate" | "staff" | "user";
};

export type OnboardingWorkspace = {
  journeys: OnboardingJourney[];
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
  activity: OnboardingActivity[];
  checklists: OnboardingChecklist[];
  candidates: OnboardingPeopleOption[];
  staff: OnboardingPeopleOption[];
  owners: OnboardingPeopleOption[];
  selectedJourneyKey: string | null;
  loadedAt: string;
  capabilities: {
    canRead: boolean;
    canManage: boolean;
    canArchive: boolean;
    canOverride: boolean;
    canManageChecklists: boolean;
    canManageDocuments: boolean;
  };
  diagnostics: {
    scopeResolved: boolean;
    tenantKey: string | null;
    organizationKey: string | null;
    schemaVersion: string;
    warnings: string[];
  };
};

export type OnboardingMutationResponse = {
  ok: boolean;
  operation: string;
  message: string;
  result?: JsonValue;
  workspace?: OnboardingWorkspace;
  error?: string;
  code?: string;
  conflict?: JsonObject;
};

export type JourneyCreateInput = {
  candidateKey?: string | null;
  staffKey?: string | null;
  title: string;
  position?: string | null;
  department?: string | null;
  startDate?: string | null;
  manager?: string | null;
  managerKey?: string | null;
  location?: string | null;
  employmentType?: string | null;
  email?: string | null;
  phone?: string | null;
  owner?: string | null;
  ownerKey?: string | null;
  priority?: "low" | "normal" | "high" | "critical";
  riskLevel?: "low" | "normal" | "high" | "critical";
  riskNotes?: string | null;
  checklistKey?: string | null;
  idempotencyKey: string;
  notes?: string | null;
};
