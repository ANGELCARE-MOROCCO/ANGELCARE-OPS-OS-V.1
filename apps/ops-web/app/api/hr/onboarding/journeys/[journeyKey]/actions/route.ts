import { NextRequest } from "next/server";
import { getOnboardingWorkspace, performJourneyAction } from "@/lib/hr-onboarding/server";
import { noStoreJson, onboardingErrorResponse } from "@/lib/hr-onboarding/http";

type Context = { params: Promise<{ journeyKey: string }> };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest, context: Context) {
  try {
    const { journeyKey } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const result = await performJourneyAction(journeyKey, body);
    return noStoreJson({ ...result, workspace: await getOnboardingWorkspace(journeyKey) });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
