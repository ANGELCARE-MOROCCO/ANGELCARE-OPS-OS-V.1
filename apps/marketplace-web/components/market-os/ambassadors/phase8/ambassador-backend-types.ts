export type AmbassadorRole =
  | "ceo"
  | "marketing_director"
  | "ambassador_director"
  | "ambassador_manager"
  | "regional_manager"
  | "content_reviewer"
  | "finance_operations"
  | "trainer"
  | "ambassador";

export type AmbassadorPermission =
  | "ambassadors.read"
  | "ambassadors.create"
  | "ambassadors.update"
  | "ambassadors.delete"
  | "applications.review"
  | "missions.assign"
  | "proofs.review"
  | "rewards.manage"
  | "payouts.approve"
  | "compliance.manage"
  | "communications.send"
  | "analytics.read"
  | "settings.manage";

export type AmbassadorAuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "assign"
  | "send"
  | "sync"
  | "archive";

export type AmbassadorBackendEntity =
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
  | "automation"
  | "setting";

export type AmbassadorAuditLog = {
  id: string;
  entity: AmbassadorBackendEntity;
  entityId: string;
  action: AmbassadorAuditAction;
  actorId: string;
  actorRole: AmbassadorRole;
  summary: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type AmbassadorServerResult<T> =
  | {
      ok: true;
      data: T;
      auditLog?: AmbassadorAuditLog;
    }
  | {
      ok: false;
      error: string;
      code: "permission_denied" | "validation_error" | "not_found" | "server_error";
    };

export type AmbassadorBackendRecord = {
  id: string;
  status: "active" | "draft" | "archived" | "blocked";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type AmbassadorProfileRecord = AmbassadorBackendRecord & {
  fullName: string;
  city: string;
  phone?: string;
  email?: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "elite";
  managerId: string;
  healthScore: number;
  revenueMad: number;
  generatedLeads: number;
};

export type AmbassadorProofReviewInput = {
  proofId: string;
  reviewerId: string;
  decision: "approved" | "rejected" | "revision_requested";
  reviewNotes: string;
};

export type AmbassadorPayoutApprovalInput = {
  payoutId: string;
  financeOwnerId: string;
  approvedAmountMad: number;
  paymentReference?: string;
  approvalNotes: string;
};

export type AmbassadorCrudInput<T> = {
  actorId: string;
  actorRole: AmbassadorRole;
  payload: T;
};
