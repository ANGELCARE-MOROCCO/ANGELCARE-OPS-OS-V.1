import { enqueueJob, jsonError, jsonOk, readBody } from "@/lib/saas-factory/phase7-ops-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readBody<{
    queue_name?: string;
    job_type?: string;
    priority?: string;
    payload_json?: Record<string, unknown>;
    module_key?: string;
  }>(request);

  try {
    const result = await enqueueJob({
      queue_name: body.queue_name ?? "factory-ops",
      job_type: body.job_type ?? "manual_job",
      priority: body.priority ?? "normal",
      payload_json: body.payload_json ?? {},
      module_key: body.module_key ?? "saas_factory_command",
    });

    return jsonOk({
      enqueued: true,
      result,
    });
  } catch (error) {
    return jsonError(error);
  }
}
