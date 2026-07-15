import {
  auditEvent,
  controlModule,
  createIncident,
  jsonError,
  jsonOk,
  parseJsonBody,
  registerAction,
  registerApi,
  upsertFactoryOption,
  upsertFeatureFlag,
} from "@/lib/saas-factory/phase3-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk({
    endpoint: "/api/saas-factory/execute",
    status: "ready",
    commands: [
      "option.upsert",
      "module.control",
      "feature_flag.upsert",
      "incident.create",
      "action.register",
      "api.register",
      "publish.changes",
      "probe.run",
      "deployment.readiness.run",
    ],
  });
}

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  const command = String(body.command ?? body.mode ?? body.action ?? "").toLowerCase();

  try {
    let result: unknown;

    if (command.includes("option") || command.includes("city") || command.includes("save city")) {
      result = await upsertFactoryOption({
        group_key: body.group_key ?? body.group ?? "cities",
        label: body.label ?? body.city ?? body.name ?? "Casablanca",
        value: body.value,
        modules: body.modules ?? body.availability_scope,
        metadata_json: body.metadata_json ?? {
          source: "phase3_execute",
          country: body.country ?? "Morocco",
          region: body.region ?? "Grand Casablanca",
        },
      });
    } else if (command.includes("module")) {
      result = await controlModule(body);
    } else if (command.includes("flag")) {
      result = await upsertFeatureFlag(body);
    } else if (command.includes("incident") || command.includes("war") || command.includes("emergency")) {
      result = await createIncident(body);
    } else if (command.includes("action") || command.includes("scan")) {
      result = await registerAction(body);
    } else if (command.includes("api") || command.includes("probe") || command.includes("endpoint")) {
      result = await registerApi(body);
    } else if (command.includes("publish")) {
      result = await auditEvent("saas_factory.publish.completed", {
        action: "publish",
        message: "Factory pending changes published",
        metadata_json: body,
      });
    } else if (command.includes("deployment") || command.includes("readiness")) {
      result = await auditEvent("saas_factory.deployment.readiness_run", {
        action: "readiness_run",
        message: "Deployment readiness check requested",
        metadata_json: body,
      });
    } else {
      result = await auditEvent("saas_factory.command.executed", {
        action: command || "generic_command",
        message: `Factory command executed: ${command || "generic_command"}`,
        metadata_json: body,
      });
    }

    return jsonOk({
      command: command || "generic_command",
      result,
      message: "SaaS Factory command executed.",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : String(error), 500, {
      command,
    });
  }
}
