import { NextRequest } from "next/server";
import { getOnboardingWorkspace, uploadDocumentFile } from "@/lib/hr-onboarding/server";
import { noStoreJson, onboardingErrorResponse } from "@/lib/hr-onboarding/http";

type Context = { params: Promise<{ documentKey: string }> };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest, context: Context) {
  try {
    const { documentKey } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    const version = Number(form.get("version"));
    if (!(file instanceof File)) return noStoreJson({ ok: false, code: "FILE_REQUIRED", error: "Sélectionnez un fichier." }, { status: 400 });
    const result = await uploadDocumentFile(documentKey, file, version);
    return noStoreJson({ ...result, workspace: await getOnboardingWorkspace() });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
