import { NextResponse } from "next/server";
import { OnboardingConcurrencyError, OnboardingOperationError } from "./server";
import { OnboardingValidationError } from "./validation";

export function noStoreJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
      ...(init?.headers ?? {}),
    },
  });
}

export function onboardingErrorResponse(error: unknown): NextResponse {
  if (error instanceof OnboardingConcurrencyError) {
    return noStoreJson({ ok: false, code: "ONBOARDING_VERSION_CONFLICT", error: error.message }, { status: 409 });
  }
  if (error instanceof OnboardingValidationError) {
    return noStoreJson({ ok: false, code: error.code, error: error.message }, { status: error.status });
  }
  if (error instanceof OnboardingOperationError) {
    return noStoreJson({ ok: false, code: error.code, error: error.message, details: error.details }, { status: error.status });
  }
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const status = Number(record.status);
  return noStoreJson({
    ok: false,
    code: String(record.code ?? "ONBOARDING_INTERNAL_ERROR"),
    error: error instanceof Error ? error.message : "Une erreur inattendue a interrompu l’opération onboarding.",
  }, { status: Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500 });
}
