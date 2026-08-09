# MZ11 dependency map
MZ11 specialist agents must consume the provider-neutral `RevenueAiProvider`, never import Gemini directly outside the provider layer. Every council agent must use versioned prompts, structured verdict schemas, the MZ10.1 quota/job/audit infrastructure and the same Shadow-mode external-action lock.
