import { getAcCapitalFeatureFlags } from "./feature-flags";

export async function getAiProviderBridgeStatus() {
  const flags = getAcCapitalFeatureFlags();

  return {
    providerAuthority: "/ai-provider-control",
    snapshotApi: "/api/ai-provider-control/snapshot",
    actionApi: "/api/ai-provider-control/action",
    providerMode: flags.providerMode,
    executionMode: flags.executionMode,
    allowLiveRuns: flags.allowLiveRuns,
    allowResearch: flags.allowResearch,
    noExposedApiKeys: true,
    supportedDossiers: [
      "same supplier from /ai-provider-control",
      "dedicated Gemini dossier",
      "dedicated OpenAI dossier",
      "hybrid failover",
      "manual/no-AI",
      "disabled",
    ],
  };
}

export async function requestProviderControlAction(payload: Record<string, unknown>) {
  const flags = getAcCapitalFeatureFlags();

  if (!flags.allowLiveRuns) {
    return {
      ok: true,
      mode: "dry-run",
      warning: "AC_CAPITAL_AI_ALLOW_LIVE_RUNS is not true. Provider action was not executed.",
      payload,
    };
  }

  return {
    ok: false,
    mode: "provider-control",
    warning: "Live provider action requires explicit integration with /api/ai-provider-control/action in a governed production step.",
    payload,
  };
}
