import { jsonError, rest } from "@/lib/saas-factory/phase7-ops-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await rest(
      "saas_factory_audit_events",
      "GET",
      undefined,
      "?select=*&order=created_at.desc&limit=500"
    );

    const rows = Array.isArray((result as any).data) ? (result as any).data : [];
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        count: rows.length,
        rows,
        dryRun: Boolean((result as any).dryRun),
      },
      null,
      2
    );

    return new Response(payload, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="saas-factory-audit-export.json"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
