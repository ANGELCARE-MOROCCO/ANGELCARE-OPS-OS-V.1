import { NextRequest } from "next/server";
import { createJourney, getOnboardingWorkspace } from "@/lib/hr-onboarding/server";
import { noStoreJson, onboardingErrorResponse } from "@/lib/hr-onboarding/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const selected = request.nextUrl.searchParams.get("selected");
    return noStoreJson({ ok: true, workspace: await getOnboardingWorkspace(selected) });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const result = await createJourney(body);
    return noStoreJson({ ...result, workspace: await getOnboardingWorkspace() }, { status: 201 });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
