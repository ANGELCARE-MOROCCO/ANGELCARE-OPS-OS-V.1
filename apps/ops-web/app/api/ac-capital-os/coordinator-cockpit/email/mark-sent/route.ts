import { markEmailSentManually } from "../../../../../../lib/ac-capital-os/server/automation-gates";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return Response.json(await markEmailSentManually({
    emailId: typeof body.emailId === "string" ? body.emailId : undefined,
    proofReference: typeof body.proofReference === "string" ? body.proofReference : undefined,
    approvalStatus: typeof body.approvalStatus === "string" ? body.approvalStatus : undefined,
  }));
}
