import {
  apiError,
  isFounder,
  isWriter,
  requireCapitalApiActor,
  success,
} from "@/lib/ac-capital-os/server/mz15-api";
import {
  initializeCertificationContracts,
  loadCertificationSnapshot,
  recordBoardCertificationSignoff,
  recordCertificationEvidence,
  runCanonicalIntegrityAudit,
  runWorkspaceCertification,
  updateScenarioStep,
  type CertificationStatus,
} from "@/lib/ac-capital-os/server/institutional-certification";
import type { JsonRecord } from "@/lib/ac-capital-os/server/free-provider-types";

export const dynamic = "force-dynamic";

const clean = (value: unknown) => String(value ?? "").trim();
const allowedStatuses = new Set<CertificationStatus>([
  "CERTIFIED",
  "PARTIALLY CERTIFIED",
  "BLOCKED",
  "FAILED",
  "NOT TESTED",
]);

function status(value: unknown): CertificationStatus {
  const candidate = clean(value).toUpperCase() as CertificationStatus;
  if (!allowedStatuses.has(candidate)) {
    throw Object.assign(new Error("AC_CAPITAL_INVALID_CERTIFICATION_STATUS"), {
      status: 400,
    });
  }
  return candidate;
}

export async function GET(request: Request) {
  try {
    await requireCapitalApiActor();
    const url = new URL(request.url);
    const mode = clean(url.searchParams.get("mode") || "snapshot");
    const workspaceKey = clean(url.searchParams.get("workspaceKey")) || undefined;
    return Response.json(
      success(
        await loadCertificationSnapshot({
          mode,
          workspaceKey,
        }),
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) {
      throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    }
    const body = (await request.json()) as {
      action?: string;
      payload?: JsonRecord;
    };
    const action = clean(body.action);
    const payload = body.payload || {};

    if (action === "initialize") {
      return Response.json(success(await initializeCertificationContracts(actor)));
    }

    if (action === "run-workspaces") {
      return Response.json(
        success(
          await runWorkspaceCertification({
            actor,
            workspaceKey: clean(payload.workspaceKey) || undefined,
          }),
        ),
      );
    }

    if (action === "run-integrity") {
      return Response.json(success(await runCanonicalIntegrityAudit(actor)));
    }

    if (action === "record-check") {
      if (!clean(payload.gateKey) || !clean(payload.summary)) {
        throw Object.assign(new Error("CERTIFICATION_GATE_AND_SUMMARY_REQUIRED"), {
          status: 400,
        });
      }
      if (
        status(payload.status) === "CERTIFIED" &&
        ["route", "visual", "accessibility", "performance", "recovery"].includes(clean(payload.gateKey)) &&
        !clean(payload.reference)
      ) {
        throw Object.assign(new Error("CERTIFICATION_REFERENCE_REQUIRED_FOR_MANUAL_PASS"), {
          status: 400,
        });
      }
      return Response.json(
        success(
          await recordCertificationEvidence({
            actor,
            workspaceKey: clean(payload.workspaceKey) || undefined,
            scenarioKey: clean(payload.scenarioKey) || undefined,
            gateKey: clean(payload.gateKey),
            status: status(payload.status),
            summary: clean(payload.summary),
            evidenceType: clean(payload.evidenceType) || undefined,
            reference: clean(payload.reference) || undefined,
            payload:
              payload.evidence && typeof payload.evidence === "object"
                ? (payload.evidence as JsonRecord)
                : {},
          }),
        ),
      );
    }

    if (action === "scenario-step") {
      if (!clean(payload.scenarioKey) || !clean(payload.stepKey) || !clean(payload.summary)) {
        throw Object.assign(new Error("SCENARIO_STEP_AND_SUMMARY_REQUIRED"), {
          status: 400,
        });
      }
      if (status(payload.status) === "CERTIFIED") {
        const evidence =
          payload.evidence && typeof payload.evidence === "object"
            ? (payload.evidence as JsonRecord)
            : {};
        if (!clean(evidence.reference)) {
          throw Object.assign(new Error("SCENARIO_CERTIFICATION_REFERENCE_REQUIRED"), {
            status: 400,
          });
        }
      }
      return Response.json(
        success(
          await updateScenarioStep({
            actor,
            scenarioKey: clean(payload.scenarioKey),
            stepKey: clean(payload.stepKey),
            status: status(payload.status),
            summary: clean(payload.summary),
            evidence:
              payload.evidence && typeof payload.evidence === "object"
                ? (payload.evidence as JsonRecord)
                : {},
          }),
        ),
      );
    }

    if (action === "board-signoff") {
      if (!isFounder(actor)) {
        throw Object.assign(new Error("FOUNDER_APPROVAL_REQUIRED"), { status: 403 });
      }
      const snapshot = await loadCertificationSnapshot();
      const workspaceRows = Array.isArray(snapshot.workspaces) ? snapshot.workspaces : [];
      const scenarioRows = Array.isArray(snapshot.scenarios) ? snapshot.scenarios : [];
      const governedWorkspaces = workspaceRows;
      const requiredScenarios = scenarioRows.filter(
        (scenario) => scenario.required !== false,
      );
      const contractBlockers = [
        ...(workspaceRows.length === 15
          ? []
          : [{ type: "contract", key: "workspace-count", status: `EXPECTED_15_GOT_${workspaceRows.length}` }]),
        ...(scenarioRows.length === 8
          ? []
          : [{ type: "contract", key: "scenario-count", status: `EXPECTED_8_GOT_${scenarioRows.length}` }]),
      ];
      const blockers = [
        ...contractBlockers,
        ...governedWorkspaces
          .filter((workspace) => clean(workspace.status) !== "CERTIFIED")
          .map((workspace) => ({
            type: "workspace",
            key: workspace.workspace_key,
            status: workspace.status,
          })),
        ...requiredScenarios
          .filter((scenario) => clean(scenario.status) !== "CERTIFIED")
          .map((scenario) => ({
            type: "scenario",
            key: scenario.scenario_key,
            status: scenario.status,
          })),
        ...(Array.isArray(snapshot.integrityIssues)
          ? snapshot.integrityIssues
              .filter((issue) => clean(issue.severity).toLowerCase() === "critical")
              .map((issue) => ({
                type: "integrity",
                key: issue.issue_code,
                status: issue.status,
              }))
          : []),
      ];
      if (blockers.length) {
        throw Object.assign(new Error("AC_CAPITAL_CERTIFICATION_SIGNOFF_BLOCKED"), {
          status: 409,
          blockers,
        });
      }
      const statement =
        "All critical workspace gates and required live scenarios are certified.";
      const signoff = await recordBoardCertificationSignoff({
        actor,
        statement,
        snapshot: {
          workspaceCertifications: governedWorkspaces,
          scenarioCertifications: requiredScenarios,
          generatedAt: snapshot.generatedAt,
        },
      });
      return Response.json(
        success({
          status: "CERTIFIED",
          certifiedBy: actor.email || actor.name,
          certifiedAt: signoff.signed_at,
          statement,
          signoff,
        }),
      );
    }

    throw Object.assign(new Error("AC_CAPITAL_UNSUPPORTED_CERTIFICATION_ACTION"), {
      status: 400,
    });
  } catch (error) {
    return apiError(error);
  }
}
