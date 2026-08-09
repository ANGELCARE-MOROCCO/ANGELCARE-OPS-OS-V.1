export function getAcCapitalFeatureFlags() {
  const executionMode = process.env.AC_CAPITAL_AI_EXECUTION_MODE || "provider-control";
  const providerMode = process.env.AC_CAPITAL_AI_PROVIDER_MODE || "provider-control";
  const allowLiveRuns = process.env.AC_CAPITAL_AI_ALLOW_LIVE_RUNS !== "false";
  const allowResearch = process.env.AC_CAPITAL_AI_ALLOW_RESEARCH === "true";
  const forceSeeded = process.env.AC_CAPITAL_FORCE_SEEDED === "true";
  const disableWrites = process.env.AC_CAPITAL_DISABLE_WRITES === "true";

  return {
    executionMode,
    providerMode,
    allowLiveRuns,
    allowResearch,
    forceSeeded,
    disableWrites,
    storageBucket: process.env.AC_CAPITAL_DATA_ROOM_BUCKET || "ac-capital-data-room",
  };
}
