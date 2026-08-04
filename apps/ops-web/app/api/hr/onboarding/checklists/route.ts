import { NextRequest } from "next/server";
import { getOnboardingWorkspace, saveChecklist } from "@/lib/hr-onboarding/server";
import { noStoreJson, onboardingErrorResponse } from "@/lib/hr-onboarding/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const workspace = await getOnboardingWorkspace();
    return noStoreJson({ ok: true, checklists: workspace.checklists, capabilities: workspace.capabilities });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const result = await saveChecklist(body);
    const workspace = await getOnboardingWorkspace();
    return noStoreJson({ ...result, checklists: workspace.checklists, capabilities: workspace.capabilities }, { status: body.checklistKey ? 200 : 201 });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
