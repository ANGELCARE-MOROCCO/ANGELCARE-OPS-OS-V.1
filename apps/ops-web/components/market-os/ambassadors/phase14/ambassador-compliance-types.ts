export type ComplianceSeverity = "low" | "medium" | "high" | "critical";
export type ComplianceStatus = "open" | "reviewing" | "coaching_required" | "resolved" | "blocked";
export type ProofDecision = "pending" | "approved" | "rejected" | "revision_requested";

export type AmbassadorProofEvidence = {
  id: string;
  ambassadorName: string;
  campaignName: string;
  proofUrl: string;
  submittedAt: string;
  decision: ProofDecision;
  reviewer: string;
  qualityScore: number;
  riskFlags: string[];
  reviewNotes: string;
};

export type AmbassadorComplianceCase = {
  id: string;
  ambassadorName: string;
  city: string;
  issue: string;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  owner: string;
  nextAction: string;
  campaignEligibilityLocked: boolean;
};

export type AmbassadorClaimRule = {
  id: string;
  label: string;
  category: "health_claim" | "pricing" | "brand_tone" | "customer_promise" | "privacy" | "visual_identity";
  severity: ComplianceSeverity;
  allowedPattern: string;
  blockedExamples: string[];
  requiredAction: string;
};

export type AmbassadorCoachingWorkflow = {
  id: string;
  ambassadorName: string;
  reason: string;
  assignedCoach: string;
  dueDate: string;
  requiredTraining: string;
  status: "todo" | "doing" | "completed";
};

export type AmbassadorComplianceSnapshot = {
  proofs: AmbassadorProofEvidence[];
  cases: AmbassadorComplianceCase[];
  claimRules: AmbassadorClaimRule[];
  coaching: AmbassadorCoachingWorkflow[];
};
