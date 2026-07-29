import { apiError, requireCapitalApiActor } from "@/lib/ac-capital-os/server/mz15-api";
import { renderCapitalArtifact } from "@/lib/ac-capital-os/server/artifact-factory";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireCapitalApiActor();
    const { id } = await context.params;
    const format = new URL(request.url).searchParams.get("format") || "pdf";
    const supabase = await createServiceClient();
    const result = await supabase.from("ac_capital_artifacts").select("*").eq("id", id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw Object.assign(new Error("AC_CAPITAL_ARTIFACT_NOT_FOUND"), { status: 404 });
    const rendered = await renderCapitalArtifact(result.data, format, actor);
    return new Response(Buffer.from(rendered.bytes), {
      status: 200,
      headers: {
        "Content-Type": rendered.mimeType,
        "Content-Disposition": `attachment; filename="${rendered.filename}"`,
        "Content-Length": String(rendered.bytes.length),
        "Cache-Control": "private, no-store",
        "X-AC-Capital-Artifact-SHA256": rendered.sha256,
        "X-AC-Capital-Output-Reference": rendered.outputReference,
      },
    });
  } catch (error) { return apiError(error); }
}
