import { NextRequest } from "next/server";
import { archiveTask, getOnboardingWorkspace, updateTask } from "@/lib/hr-onboarding/server";
import { noStoreJson, onboardingErrorResponse } from "@/lib/hr-onboarding/http";

type Context = { params: Promise<{ taskKey: string }> };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { taskKey } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const result = await updateTask(taskKey, body);
    return noStoreJson({ ...result, workspace: await getOnboardingWorkspace() });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { taskKey } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const result = await archiveTask(taskKey, body);
    return noStoreJson({ ...result, workspace: await getOnboardingWorkspace() });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
