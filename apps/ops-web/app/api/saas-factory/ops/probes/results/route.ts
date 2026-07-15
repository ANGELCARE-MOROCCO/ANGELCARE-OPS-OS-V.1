import { jsonError, jsonOk, rest } from "@/lib/saas-factory/phase7-ops-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await rest(
      "saas_factory_probe_results",
      "GET",
      undefined,
      "?select=*&order=checked_at.desc&limit=100"
    );

    return jsonOk({
      results: Array.isArray((result as any).data) ? (result as any).data : [],
      dryRun: Boolean((result as any).dryRun),
    });
  } catch (error) {
    return jsonError(error);
  }
}
