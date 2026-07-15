import {
  DEFAULT_PHASE7_PROBES,
  jsonError,
  jsonOk,
  readBody,
  runLocalProbe,
  audit,
} from "@/lib/saas-factory/phase7-ops-runtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  try {
    const results = [];
    for (const probe of DEFAULT_PHASE7_PROBES) {
      results.push(await runLocalProbe(origin, probe));
    }

    await audit("saas_factory.probes.run", {
      action: "probes_run",
      message: "Phase 7 default probes executed",
      metadata_json: { count: results.length, results },
    });

    return jsonOk({
      ran: results.length,
      results,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const body = await readBody<{ probes?: Array<{ target: string; method?: string; module_key?: string; probe_type?: string }> }>(request);
  const probes = Array.isArray(body.probes) && body.probes.length > 0 ? body.probes : [...DEFAULT_PHASE7_PROBES];

  try {
    const results = [];
    for (const probe of probes) {
      results.push(await runLocalProbe(origin, probe));
    }

    await audit("saas_factory.probes.run_custom", {
      action: "custom_probes_run",
      message: "Phase 7 custom probes executed",
      metadata_json: { count: results.length, results },
    });

    return jsonOk({
      ran: results.length,
      results,
    });
  } catch (error) {
    return jsonError(error);
  }
}
