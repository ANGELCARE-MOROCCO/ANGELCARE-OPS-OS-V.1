import { enforceFounderApproval } from "./approval-guard";
import { errorResponse } from "./errors";
import { createWorkspaceRecord, loadWorkspaceData } from "./repository";
import { writeAcCapitalAuditEvent } from "./audit";
import type { AcCapitalWorkspaceKey } from "./types";

export function createWorkspaceRouteHandlers(workspaceKey: AcCapitalWorkspaceKey) {
  return {
    async GET() {
      try {
        const result = await loadWorkspaceData(workspaceKey);
        return Response.json(result);
      } catch (error) {
        return errorResponse(error);
      }
    },

    async POST(request: Request) {
      try {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const action = String(body.action || "create_note");
        const approvalStatus = typeof body.approvalStatus === "string" ? body.approvalStatus : undefined;
        const approval = enforceFounderApproval({ action, approvalStatus });

        if (!approval.ok) {
          return Response.json(
            {
              ok: false,
              dataMode: "disabled",
              source: "none",
              code: approval.code,
              warning: approval.warning,
              data: null,
            },
            { status: 403 },
          );
        }

        const record = {
          action,
          status: "Created",
          title: typeof body.title === "string" ? body.title : `AC Capital ${workspaceKey} safe write`,
          description: typeof body.description === "string" ? body.description : null,
          notes: typeof body.notes === "string" ? body.notes : null,
          created_by: typeof body.actor === "string" ? body.actor : "system-safe",
          created_at: new Date().toISOString(),
        };

        const result = await createWorkspaceRecord(workspaceKey, record);
        await writeAcCapitalAuditEvent({
          action: `safe_write_${workspaceKey}`,
          workspace: workspaceKey,
          objectType: "api_post",
          afterState: record,
          approvalRequirement: approvalStatus || "not required",
        });

        return Response.json({
          ok: result.ok,
          dataMode: result.dataMode,
          source: result.source,
          warning: result.warning,
          data: { record: result.record || record, action },
        });
      } catch (error) {
        return errorResponse(error);
      }
    },
  };
}
