import { audit, jsonError, jsonOk, rest } from "@/lib/saas-factory/phase7-ops-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const modules = await rest("saas_factory_modules", "GET", undefined, "?select=*&order=key.asc");
    const probeResults = await rest(
      "saas_factory_probe_results",
      "GET",
      undefined,
      "?select=*&order=checked_at.desc&limit=200"
    ).catch(() => ({ ok: true, data: [] }));

    const moduleRows = Array.isArray((modules as any).data) ? (modules as any).data : [];
    const probes = Array.isArray((probeResults as any).data) ? (probeResults as any).data : [];

    const snapshot = moduleRows.map((module: any) => {
      const related = probes.filter((probe: any) => probe.module_key === module.key);
      const hasCritical = related.some((probe: any) => probe.status === "critical");
      const hasWarning = related.some((probe: any) => probe.status === "warning");

      return {
        key: module.key,
        label: module.label,
        status: hasCritical ? "critical" : hasWarning ? "warning" : module.status ?? "active",
        last_probe_count: related.length,
        last_probe_status: related[0]?.status ?? "unknown",
        last_checked_at: related[0]?.checked_at ?? null,
      };
    });

    await audit("saas_factory.modules.snapshot", {
      action: "module_snapshot",
      message: "Module health snapshot generated",
      metadata_json: { count: snapshot.length },
    });

    return jsonOk({
      snapshot,
      moduleCount: snapshot.length,
      dryRun: Boolean((modules as any).dryRun),
    });
  } catch (error) {
    return jsonError(error);
  }
}
