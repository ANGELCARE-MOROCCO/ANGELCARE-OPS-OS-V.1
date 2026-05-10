import type { AmbassadorComplianceSnapshot } from "./ambassador-compliance-types";

export const ambassadorComplianceSnapshot: AmbassadorComplianceSnapshot = {
  proofs: [
    {
      id: "proof-001",
      ambassadorName: "Salma K.",
      campaignName: "Academy Training Referral Sprint",
      proofUrl: "https://example.com/proof/salma-001",
      submittedAt: "2026-05-09T13:20:00.000Z",
      decision: "approved",
      reviewer: "Content Reviewer",
      qualityScore: 93,
      riskFlags: [],
      reviewNotes: "Clean CTA, approved visuals, strong lead capture."
    },
    {
      id: "proof-002",
      ambassadorName: "Nora H.",
      campaignName: "Community Care Partner Drive",
      proofUrl: "https://example.com/proof/nora-002",
      submittedAt: "2026-05-09T15:05:00.000Z",
      decision: "revision_requested",
      reviewer: "Compliance Manager",
      qualityScore: 48,
      riskFlags: ["unapproved_health_claim", "missing_disclaimer"],
      reviewNotes: "Caption must remove unsupported health claim and add approved disclaimer."
    },
    {
      id: "proof-003",
      ambassadorName: "Meryem B.",
      campaignName: "Home Support Awareness",
      proofUrl: "https://example.com/proof/meryem-003",
      submittedAt: "2026-05-08T18:40:00.000Z",
      decision: "pending",
      reviewer: "Content Reviewer",
      qualityScore: 76,
      riskFlags: ["needs_cta_review"],
      reviewNotes: "Pending CTA review before reward generation."
    }
  ],
  cases: [
    {
      id: "case-001",
      ambassadorName: "Nora H.",
      city: "Marrakech",
      issue: "Repeated unapproved health claim in campaign caption.",
      severity: "critical",
      status: "coaching_required",
      owner: "Compliance Manager",
      nextAction: "Complete compliance coaching before new campaign assignment.",
      campaignEligibilityLocked: true
    },
    {
      id: "case-002",
      ambassadorName: "Aya R.",
      city: "Tanger",
      issue: "Missing proof context and attribution tags.",
      severity: "medium",
      status: "reviewing",
      owner: "Content Reviewer",
      nextAction: "Request proof resubmission with correct campaign tag.",
      campaignEligibilityLocked: false
    }
  ],
  claimRules: [
    {
      id: "claim-health-001",
      label: "No unapproved medical outcome promise",
      category: "health_claim",
      severity: "critical",
      allowedPattern: "Use approved care-support language only.",
      blockedExamples: ["guaranteed healing", "medical cure", "doctor-level result"],
      requiredAction: "Reject proof, request revision, and assign compliance coaching."
    },
    {
      id: "claim-price-001",
      label: "No unverified pricing statement",
      category: "pricing",
      severity: "high",
      allowedPattern: "Use current approved offer text from campaign assets.",
      blockedExamples: ["permanent discount", "cheapest in Morocco"],
      requiredAction: "Request revision and verify with campaign owner."
    },
    {
      id: "claim-privacy-001",
      label: "No private client info in content",
      category: "privacy",
      severity: "critical",
      allowedPattern: "Never show identifiable customer data without approved consent.",
      blockedExamples: ["client phone", "client address", "medical document"],
      requiredAction: "Block content and escalate immediately."
    }
  ],
  coaching: [
    {
      id: "coach-001",
      ambassadorName: "Nora H.",
      reason: "Critical compliance case requires retraining.",
      assignedCoach: "Compliance Trainer",
      dueDate: "2026-05-12",
      requiredTraining: "Health Claims, Compliance & Safe Communication",
      status: "todo"
    },
    {
      id: "coach-002",
      ambassadorName: "Aya R.",
      reason: "Proof attribution and campaign tag accuracy.",
      assignedCoach: "Content Reviewer",
      dueDate: "2026-05-13",
      requiredTraining: "Content Execution & Proof Standards",
      status: "doing"
    }
  ]
};
