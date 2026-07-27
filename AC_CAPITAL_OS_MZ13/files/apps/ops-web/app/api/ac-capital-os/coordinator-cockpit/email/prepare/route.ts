import { prepareEmailDraft } from "../../../../../lib/ac-capital-os/server/automation-gates";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return Response.json(await prepareEmailDraft({
    subject: String(body.subject || "AC Capital manual email draft"),
    recipient: typeof body.recipient === "string" ? body.recipient : undefined,
    body: typeof body.body === "string" ? body.body : undefined,
    approvalStatus: typeof body.approvalStatus === "string" ? body.approvalStatus : undefined,
  }));
}
