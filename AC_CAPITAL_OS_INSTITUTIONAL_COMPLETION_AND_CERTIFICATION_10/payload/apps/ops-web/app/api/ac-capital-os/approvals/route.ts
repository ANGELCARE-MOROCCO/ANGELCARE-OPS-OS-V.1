import {
  apiError,
  envelope,
  insertAudit,
  insertRow,
  readTable,
  requireCapitalApiActor,
  requiredString,
  success,
} from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCapitalApiActor();
    const [
      universal,
      coordinator,
      caseApprovals,
      aiApprovals,
      dataRoomApprovals,
    ] = await Promise.all([
      readTable("ac_capital_universal_approvals", 300, "requested_at"),
      readTable("ac_capital_coordinator_founder_approvals", 200),
      readTable("ac_capital_case_founder_approvals", 200),
      readTable("ac_capital_ai_human_approval_queue", 200),
      readTable("ac_capital_data_room_approval_events", 200),
    ]);

    const approvals = ([
      ...universal.map((row) => ({
        ...row,
        source_table: "ac_capital_universal_approvals",
        source_type: "Universal Exact-Version",
        approval_title:
          row.decision_requested ||
          `${row.object_type || "Object"} approval`,
        reason_required:
          row.decision_requested ||
          "Exact-version board decision required.",
        risk_if_unapproved:
          row.risk_level || "Governed release remains blocked.",
        due_at: row.expires_at || null,
        related_case_id:
          row.object_type === "case" ? row.object_id : null,
      })),
      ...coordinator.map((row) => ({
        ...row,
        source_table: "ac_capital_coordinator_founder_approvals",
        source_type: "Coordinator",
      })),
      ...caseApprovals.map((row) => ({
        ...row,
        source_table: "ac_capital_case_founder_approvals",
        source_type: "Legacy Case",
      })),
      ...aiApprovals.map((row) => ({
        ...row,
        source_table: "ac_capital_ai_human_approval_queue",
        source_type: "AI",
      })),
      ...dataRoomApprovals.map((row) => ({
        ...row,
        source_table: "ac_capital_data_room_approval_events",
        source_type: "Data Room",
      })),
    ] as Array<Record<string, unknown>>).sort((left, right) => {
      const a = Date.parse(String(left.requested_at || left.created_at || 0));
      const b = Date.parse(String(right.requested_at || right.created_at || 0));
      return b - a;
    });

    return Response.json(
      envelope({
        approvals,
        universal,
        coordinator,
        caseApprovals,
        aiApprovals,
        dataRoomApprovals,
      }),
    );
  } catch (reason) {
    return apiError(reason);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    const body = (await request.json()) as Record<string, unknown>;
    const record = await insertRow(
      "ac_capital_coordinator_founder_approvals",
      {
        approval_title: requiredString(body.title, "Approval title"),
        approving_founder:
          body.approvingFounder || "Founder / Managing Director",
        related_case_id: body.relatedCaseId || null,
        related_document_id: body.relatedDocumentId || null,
        reason_required: requiredString(body.reason, "Approval reason"),
        risk_if_unapproved: body.riskIfUnapproved || null,
        due_at: body.dueAt || null,
        status: "Pending Founder Review",
        comments: Array.isArray(body.comments) ? body.comments : [],
        approval_history: [],
      },
    );
    await insertAudit({
      actor: actor.email || actor.name,
      action: "create_approval_request",
      objectType: "founder_approval",
      objectId: String(record.id),
      after: record,
      approval: "Founder",
    });
    return Response.json(success({ record }));
  } catch (reason) {
    return apiError(reason);
  }
}
