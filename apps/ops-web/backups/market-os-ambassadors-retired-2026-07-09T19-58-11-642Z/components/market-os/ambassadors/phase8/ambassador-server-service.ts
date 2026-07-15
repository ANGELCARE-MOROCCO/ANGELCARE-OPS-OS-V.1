import type {
  AmbassadorCrudInput,
  AmbassadorPayoutApprovalInput,
  AmbassadorProfileRecord,
  AmbassadorProofReviewInput,
  AmbassadorServerResult,
} from "./ambassador-backend-types";
import { createAmbassadorAuditLog } from "./ambassador-audit";
import { requireAmbassadorPermission } from "./ambassador-permissions";
import {
  validateAmbassadorProfile,
  validatePayoutApproval,
  validateProofReview,
} from "./ambassador-validation";

export async function createAmbassadorProfile(
  input: AmbassadorCrudInput<Omit<AmbassadorProfileRecord, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">>,
): Promise<AmbassadorServerResult<AmbassadorProfileRecord>> {
  try {
    requireAmbassadorPermission(input.actorRole, "ambassadors.create");

    const validationErrors = validateAmbassadorProfile(input.payload);
    if (validationErrors.length > 0) {
      return {
        ok: false,
        error: validationErrors.join(" "),
        code: "validation_error",
      };
    }

    const now = new Date().toISOString();
    const record: AmbassadorProfileRecord = {
      ...input.payload,
      id: `amb-${crypto.randomUUID()}`,
      createdAt: now,
      updatedAt: now,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    };

    const auditLog = createAmbassadorAuditLog({
      entity: "ambassador",
      entityId: record.id,
      action: "create",
      actorId: input.actorId,
      actorRole: input.actorRole,
      summary: `Created ambassador profile for ${record.fullName}.`,
      metadata: {
        city: record.city,
        tier: record.tier,
        managerId: record.managerId,
      },
    });

    return { ok: true, data: record, auditLog };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Server error",
      code: "permission_denied",
    };
  }
}

export async function reviewAmbassadorProof(
  input: AmbassadorCrudInput<AmbassadorProofReviewInput>,
): Promise<AmbassadorServerResult<AmbassadorProofReviewInput>> {
  try {
    requireAmbassadorPermission(input.actorRole, "proofs.review");

    const validationErrors = validateProofReview(input.payload);
    if (validationErrors.length > 0) {
      return {
        ok: false,
        error: validationErrors.join(" "),
        code: "validation_error",
      };
    }

    const auditLog = createAmbassadorAuditLog({
      entity: "proof",
      entityId: input.payload.proofId,
      action: input.payload.decision === "approved" ? "approve" : "reject",
      actorId: input.actorId,
      actorRole: input.actorRole,
      summary: `Proof review completed with decision: ${input.payload.decision}.`,
      metadata: {
        decision: input.payload.decision,
        reviewerId: input.payload.reviewerId,
      },
    });

    return { ok: true, data: input.payload, auditLog };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Server error",
      code: "permission_denied",
    };
  }
}

export async function approveAmbassadorPayout(
  input: AmbassadorCrudInput<AmbassadorPayoutApprovalInput>,
): Promise<AmbassadorServerResult<AmbassadorPayoutApprovalInput>> {
  try {
    requireAmbassadorPermission(input.actorRole, "payouts.approve");

    const validationErrors = validatePayoutApproval(input.payload);
    if (validationErrors.length > 0) {
      return {
        ok: false,
        error: validationErrors.join(" "),
        code: "validation_error",
      };
    }

    const auditLog = createAmbassadorAuditLog({
      entity: "payout",
      entityId: input.payload.payoutId,
      action: "approve",
      actorId: input.actorId,
      actorRole: input.actorRole,
      summary: `Approved ambassador payout for ${input.payload.approvedAmountMad} MAD.`,
      metadata: {
        approvedAmountMad: input.payload.approvedAmountMad,
        financeOwnerId: input.payload.financeOwnerId,
        paymentReference: input.payload.paymentReference ?? null,
      },
    });

    return { ok: true, data: input.payload, auditLog };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Server error",
      code: "permission_denied",
    };
  }
}
