import { jsonOk, parseJsonBody, slugify, supabaseRest } from "@/lib/saas-factory/phase3-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  const flag = slugify(body.flag ?? body.key ?? "unknown_flag", "flag");

  try {
    const result = await supabaseRest(
      "saas_factory_feature_flags",
      "GET",
      undefined,
      `?key=eq.${encodeURIComponent(flag)}&select=*`
    );

    const data = Array.isArray((result as any).data) ? (result as any).data : [];
    const row = data[0];

    return jsonOk({
      flag,
      enabled: row ? row.is_enabled !== false : false,
      source: row ? "database" : "default_false",
      row,
    });
  } catch (error) {
    return jsonOk({
      flag,
      enabled: false,
      source: "safe_fallback",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
