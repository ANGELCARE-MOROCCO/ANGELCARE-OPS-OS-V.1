import { createIncident, jsonError, jsonOk, readBody } from "@/lib/saas-factory/phase7-ops-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readBody<{
    target?: string;
    module_key?: string;
    severity?: string;
    error?: string;
    status?: string;
  }>(request);

  try {
    const result = await createIncident({
      title: `Probe incident: ${body.target ?? "unknown target"}`,
      severity: body.severity ?? "warning",
      module_key: body.module_key ?? "saas_factory_command",
      description: body.error ?? `Probe reported status ${body.status ?? "unknown"}`,
      source: "manual_probe_incident",
      metadata_json: body,
    });

    return jsonOk({
      incidentCreated: true,
      result,
    });
  } catch (error) {
    return jsonError(error);
  }
}
