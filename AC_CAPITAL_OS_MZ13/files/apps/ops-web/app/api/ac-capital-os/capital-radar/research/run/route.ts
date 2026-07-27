import { runResearchAdapter } from "../../../../../lib/ac-capital-os/server/research-adapter";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await runResearchAdapter({
    query: String(body.query || "AngelCare funding opportunities"),
    mode: body.mode === "provider-control" || body.mode === "manual" || body.mode === "disabled" ? body.mode : "dry-run",
  });
  return Response.json(result);
}
