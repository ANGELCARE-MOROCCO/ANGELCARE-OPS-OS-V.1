import { NextRequest } from "next/server";
import { archiveDocument, getOnboardingWorkspace, updateDocument } from "@/lib/hr-onboarding/server";
import { noStoreJson, onboardingErrorResponse } from "@/lib/hr-onboarding/http";

type Context = { params: Promise<{ documentKey: string }> };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { documentKey } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const result = await updateDocument(documentKey, body);
    return noStoreJson({ ...result, workspace: await getOnboardingWorkspace() });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { documentKey } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const result = await archiveDocument(documentKey, body);
    return noStoreJson({ ...result, workspace: await getOnboardingWorkspace() });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
