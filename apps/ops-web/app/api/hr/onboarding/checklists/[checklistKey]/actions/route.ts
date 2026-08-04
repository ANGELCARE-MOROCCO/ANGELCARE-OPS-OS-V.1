import { NextRequest } from "next/server";
import { getOnboardingWorkspace, performChecklistAction } from "@/lib/hr-onboarding/server";
import { noStoreJson, onboardingErrorResponse } from "@/lib/hr-onboarding/http";

type Context = { params: Promise<{ checklistKey: string }> };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest, context: Context) {
  try {
    const { checklistKey } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const result = await performChecklistAction(checklistKey, body);
    const workspace = await getOnboardingWorkspace();
    return noStoreJson({ ...result, checklists: workspace.checklists, capabilities: workspace.capabilities });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
