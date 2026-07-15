import type { AmbassadorComplianceCase, AmbassadorComplianceSnapshot, AmbassadorProofEvidence } from "./ambassador-compliance-types";

export type AmbassadorComplianceMetrics = {
  totalProofs: number;
  approvedProofs: number;
  proofsNeedingReview: number;
  criticalCases: number;
  lockedAmbassadors: number;
  openCoaching: number;
  averageProofQuality: number;
  governanceReadinessScore: number;
};

export function getCriticalCases(cases: AmbassadorComplianceCase[]): AmbassadorComplianceCase[] {
  return cases.filter((item) => item.severity === "critical" && item.status !== "resolved");
}

export function getProofsNeedingReview(proofs: AmbassadorProofEvidence[]): AmbassadorProofEvidence[] {
  return proofs.filter((proof) => proof.decision === "pending" || proof.decision === "revision_requested" || proof.riskFlags.length > 0);
}

export function calculateAverageProofQuality(proofs: AmbassadorProofEvidence[]): number {
  if (proofs.length === 0) return 0;
  return Math.round(proofs.reduce((sum, proof) => sum + proof.qualityScore, 0) / proofs.length);
}

export function getAmbassadorComplianceMetrics(snapshot: AmbassadorComplianceSnapshot): AmbassadorComplianceMetrics {
  const totalProofs = snapshot.proofs.length;
  const approvedProofs = snapshot.proofs.filter((proof) => proof.decision === "approved").length;
  const proofsNeedingReview = getProofsNeedingReview(snapshot.proofs).length;
  const criticalCases = getCriticalCases(snapshot.cases).length;
  const lockedAmbassadors = snapshot.cases.filter((item) => item.campaignEligibilityLocked).length;
  const openCoaching = snapshot.coaching.filter((item) => item.status !== "completed").length;
  const averageProofQuality = calculateAverageProofQuality(snapshot.proofs);
  const base = averageProofQuality + approvedProofs * 8 + snapshot.claimRules.length * 5;
  const penalty = criticalCases * 14 + lockedAmbassadors * 10 + proofsNeedingReview * 4 + openCoaching * 3;
  const governanceReadinessScore = Math.max(0, Math.min(100, Math.round(base - penalty + 25)));

  return {
    totalProofs,
    approvedProofs,
    proofsNeedingReview,
    criticalCases,
    lockedAmbassadors,
    openCoaching,
    averageProofQuality,
    governanceReadinessScore
  };
}
