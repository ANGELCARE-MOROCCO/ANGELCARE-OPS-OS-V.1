import {
  apiError,
  insertAudit,
  isFounder,
  requireCapitalApiActor,
  requiredString,
  success,
  updateRow,
} from "@/lib/ac-capital-os/server/mz15-api";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedTables = new Set([
  "ac_capital_universal_approvals",
  "ac_capital_coordinator_founder_approvals",
  "ac_capital_case_founder_approvals",
  "ac_capital_ai_human_approval_queue",
  "ac_capital_data_room_approval_events",
]);

const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isFounder(actor)) {
      throw Object.assign(new Error("FOUNDER_APPROVAL_REQUIRED"), { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const sourceTable = requiredString(body.sourceTable, "Source table");
    if (!allowedTables.has(sourceTable)) {
      throw Object.assign(new Error("UNSUPPORTED_APPROVAL_SOURCE"), { status: 400 });
    }

    const requestedDecision = requiredString(body.decision, "Decision").toLowerCase();
    const decision = requestedDecision === "request-revision" ? "revision" : requestedDecision;
    if (!["approve", "reject", "revision"].includes(decision)) {
      throw Object.assign(new Error("UNSUPPORTED_APPROVAL_DECISION"), { status: 400 });
    }

    if (sourceTable === "ac_capital_universal_approvals") {
      const supabase = await createServiceClient();
      const result = await supabase.rpc("ac_capital_ic10_decide_approval", {
        p_approval_id: id,
        p_decision: decision,
        p_note: clean(body.note) || decision,
        p_conditions: Array.isArray(body.conditions) ? body.conditions : [],
        p_decided_by: actor.email || actor.name,
      });
      if (result.error) throw result.error;

      const governed = object(result.data);
      if (governed.conflict === true) {
        throw Object.assign(
          new Error(
            `AC_CAPITAL_APPROVAL_VERSION_CONFLICT:requested=${clean(governed.requestedVersion)}:current=${clean(governed.currentVersion)}`,
          ),
          { status: 409, detail: governed },
        );
      }

      await insertAudit({
        actor: actor.email || actor.name,
        action: `universal_approval_${decision}`,
        objectType: "universal_approval",
        objectId: id,
        after: governed,
        reason: clean(body.note) || decision,
        approval: `Exact object version ${clean(governed.governedVersion)}`,
      });

      return Response.json(
        success({
          record: object(governed.approval),
          object: governed.object || null,
          event: governed.event || null,
          governedVersion: governed.governedVersion,
        }),
      );
    }

    const statusValue =
      decision === "approve"
        ? "Approved"
        : decision === "reject"
          ? "Rejected"
          : "Revision Requested";
    const payload: Record<string, unknown> = { status: statusValue };

    if (sourceTable === "ac_capital_coordinator_founder_approvals") {
      payload.approving_founder = actor.name;
      payload.comments = Array.isArray(body.comments)
        ? body.comments
        : [String(body.note || "")];
      payload.approval_history = [
        {
          decision,
          status: statusValue,
          note: body.note || null,
          actor: actor.email || actor.name,
          at: new Date().toISOString(),
        },
      ];
    } else if (sourceTable === "ac_capital_case_founder_approvals") {
      payload.approver = actor.name;
      payload.comments = body.note || null;
      if (statusValue === "Approved") payload.approved_at = new Date().toISOString();
    } else if (sourceTable === "ac_capital_data_room_approval_events") {
      payload.decided_by = actor.email || actor.name;
      payload.decided_at = new Date().toISOString();
      payload.comment = body.note || null;
    }

    const record = await updateRow(sourceTable, id, payload);
    await insertAudit({
      actor: actor.email || actor.name,
      action: `approval_${decision}`,
      objectType: "approval_request",
      objectId: id,
      after: record,
      reason: String(body.note || decision),
      approval: "Founder decision",
    });
    return Response.json(success({ record }));
  } catch (reason) {
    return apiError(reason);
  }
}
