import { audit, jsonError, jsonOk, readBody, rest } from "@/lib/saas-factory/phase7-ops-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readBody<{ limit?: number }>(request);
  const limit = Math.min(Math.max(Number(body.limit ?? 10), 1), 50);

  try {
    const queued = await rest(
      "saas_factory_queue_jobs",
      "GET",
      undefined,
      `?status=eq.queued&select=*&order=priority.desc,created_at.asc&limit=${limit}`
    );

    const jobs = Array.isArray((queued as any).data) ? (queued as any).data : [];
    const processed = [];

    for (const job of jobs) {
      const result = await rest(
        "saas_factory_queue_jobs",
        "PATCH",
        {
          status: "processed",
          attempts: Number(job.attempts ?? 0) + 1,
          result_json: {
            processedBy: "phase7_queue_processor",
            processedAt: new Date().toISOString(),
          },
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        `?id=eq.${job.id}`
      );

      processed.push({ id: job.id, key: job.key, result });
    }

    await audit("saas_factory.queue.processed", {
      action: "queue_process",
      message: `Processed ${processed.length} queue jobs`,
      metadata_json: { processed },
    });

    return jsonOk({
      processed: processed.length,
      jobs: processed,
      dryRun: Boolean((queued as any).dryRun),
    });
  } catch (error) {
    return jsonError(error);
  }
}
