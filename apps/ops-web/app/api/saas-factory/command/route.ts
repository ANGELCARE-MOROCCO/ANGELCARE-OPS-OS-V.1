import { jsonOk, parseJsonBody } from "@/lib/saas-factory/phase3-runtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "status";
  return jsonOk({
    endpoint: "/api/saas-factory/command",
    mode,
    message: "Compatibility endpoint is live. Use POST for execution.",
  });
}

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  const base = new URL(request.url);
  const response = await fetch(`${base.origin}/api/saas-factory/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      command: body.command ?? body.mode ?? body.action ?? "generic.command",
      ...body,
    }),
  });

  const data = await response.json().catch(() => ({}));
  return jsonOk({
    forwarded: true,
    data,
  });
}
