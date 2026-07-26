# Direct Gemini Call Elimination Report

## Final rule

Normal Revenue Command OS execution has no direct Gemini credential or SDK authority.

## Eliminated bypasses

- Strategy Assembly environment-key fallback
- Validation Council direct `GEMINI_API_KEY` use
- Executive cockpit direct `GEMINI_API_KEY` use
- Active provider tests outside a governed request and usage record
- Secondary Revenue quota writes that could contradict AI Provider Control

## Single SDK boundary

Provider SDK execution is isolated in:

`lib/ai-provider-control/gemini-runtime.ts`

Revenue workloads invoke `executeGovernedAiRequest`, which resolves the centrally assigned credential and route. No API key is exposed to clients.

## Runtime decisions returned by the gateway

- `EXECUTE_NEW`
- `REUSE_CACHED`
- `JOIN_IN_FLIGHT`
- `BLOCK_QUOTA`
- `BLOCK_DUPLICATE`
- `BLOCK_POLICY`
- `DEFER_SCHEDULE`
- `REQUIRE_APPROVAL`

Break-glass is not silently enabled by this release.
