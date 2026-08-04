import { NextRequest, NextResponse } from "next/server";
import { createDocumentDownload } from "@/lib/hr-onboarding/server";
import { onboardingErrorResponse } from "@/lib/hr-onboarding/http";

type Context = { params: Promise<{ documentKey: string }> };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { documentKey } = await context.params;
    const result = await createDocumentDownload(documentKey);
    return NextResponse.redirect(result.url, { status: 307 });
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
