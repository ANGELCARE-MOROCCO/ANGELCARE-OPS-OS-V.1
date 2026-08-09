import type {
  AmbassadorPayoutApprovalInput,
  AmbassadorProfileRecord,
  AmbassadorProofReviewInput,
} from "./ambassador-backend-types";

export function validateAmbassadorProfile(profile: Partial<AmbassadorProfileRecord>): string[] {
  const errors: string[] = [];

  if (!profile.fullName || profile.fullName.trim().length < 2) {
    errors.push("Full name is required.");
  }

  if (!profile.city || profile.city.trim().length < 2) {
    errors.push("City is required.");
  }

  if (typeof profile.healthScore === "number" && (profile.healthScore < 0 || profile.healthScore > 100)) {
    errors.push("Health score must be between 0 and 100.");
  }

  if (typeof profile.revenueMad === "number" && profile.revenueMad < 0) {
    errors.push("Revenue cannot be negative.");
  }

  return errors;
}

export function validateProofReview(input: AmbassadorProofReviewInput): string[] {
  const errors: string[] = [];

  if (!input.proofId) errors.push("Proof ID is required.");
  if (!input.reviewerId) errors.push("Reviewer ID is required.");
  if (!input.reviewNotes || input.reviewNotes.trim().length < 5) {
    errors.push("Review notes must explain the decision.");
  }

  return errors;
}

export function validatePayoutApproval(input: AmbassadorPayoutApprovalInput): string[] {
  const errors: string[] = [];

  if (!input.payoutId) errors.push("Payout ID is required.");
  if (!input.financeOwnerId) errors.push("Finance owner ID is required.");
  if (!Number.isFinite(input.approvedAmountMad) || input.approvedAmountMad <= 0) {
    errors.push("Approved amount must be greater than zero.");
  }
  if (!input.approvalNotes || input.approvalNotes.trim().length < 5) {
    errors.push("Approval notes are required.");
  }

  return errors;
}
