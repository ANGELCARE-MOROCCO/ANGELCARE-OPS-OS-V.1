import { executeGovernedAiRequest } from "@/lib/ai-provider-control/governor";
import { invokeGeminiProvider } from "@/lib/ai-provider-control/gemini-runtime";
import { getAcCapitalFeatureFlags } from "./feature-flags";

export const AC_CAPITAL_PROVIDER_MODULE_KEY = "ac_capital_os" as const;
export const AC_CAPITAL_PROVIDER_COMMAND = "AC_CAPITAL_GOVERNED_RUN" as const;
export const AC_CAPITAL_PROVIDER_WORKSPACE = "ai-command-center" as const;

export type AcCapitalGovernedOutput = {
  summary: string;
  confirmedFacts: string[];
  missingData: string[];
  risks: string[];
  recommendations: string[];
  humanActions: string[];
  confidence: number;
  requiresHumanApproval: boolean;
  provider?: string;
  model?: string;
};

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

function parseProviderJson(value: unknown): Record<string, unknown> {
  const raw = String(value || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  if (!raw) throw new Error("AC_CAPITAL_PROVIDER_EMPTY_OUTPUT");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("NOT_OBJECT");
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("AC_CAPITAL_PROVIDER_INVALID_JSON");
  }
}

function normalizeOutput(value: Record<string, unknown>): AcCapitalGovernedOutput {
  return {
    summary: String(value.summary || "No summary returned."),
    confirmedFacts: asStringArray(value.confirmedFacts),
    missingData: asStringArray(value.missingData),
    risks: asStringArray(value.risks),
    recommendations: asStringArray(value.recommendations),
    humanActions: asStringArray(value.humanActions),
    confidence: Math.max(0, Math.min(100, Number(value.confidence || 0))),
    requiresHumanApproval: value.requiresHumanApproval !== false,
  };
}

export async function getAiProviderBridgeStatus() {
  const flags = getAcCapitalFeatureFlags();
  return {
    providerAuthority: "/ai-provider-control",
    snapshotApi: "/api/ai-provider-control/snapshot",
    actionApi: "/api/ai-provider-control/action",
    moduleKey: AC_CAPITAL_PROVIDER_MODULE_KEY,
    providerMode: flags.providerMode,
    executionMode: flags.executionMode,
    allowLiveRuns: flags.allowLiveRuns,
    allowResearch: flags.allowResearch,
    noExposedApiKeys: true,
    governedRuntime: true,
  };
}

export async function executeAcCapitalGovernedAi(input: {
  agentKey: string;
  workspace: string;
  prompt: string;
  actorId?: string | null;
  approvalGranted: boolean;
  doctrineUsed?: string[];
  skill?: string | null;
  riskLevel?: string | null;
  forceRefresh?: boolean;
}) {
  const flags = getAcCapitalFeatureFlags();
  if (!flags.allowLiveRuns) throw new Error("AC_CAPITAL_LIVE_AI_DISABLED_BY_POLICY");
  if (!input.prompt.trim()) throw new Error("AC_CAPITAL_PROMPT_REQUIRED");

  const requestedModel = process.env.AC_CAPITAL_GEMINI_PRIMARY_MODEL || "gemini-3.6-flash";
  const estimatedInputTokens = Math.max(96, Math.ceil(input.prompt.length / 3.5));
  const estimatedOutputTokens = 1800;
  const systemInstruction = [
    "You are the governed AC CAPITAL OS Intelligence Director for ANGELCARE.",
    "Produce decision support only. Never guarantee financing, invent eligibility, fabricate deadlines, invent funders, or perform an external action.",
    "Separate confirmed facts from assumptions and missing evidence.",
    "Financial, legal, bank, investor and submission-sensitive recommendations remain subject to Founder / Managing Director approval.",
    "Return strict JSON matching the supplied schema, with concise but operationally useful arrays.",
  ].join(" ");

  const governed = await executeGovernedAiRequest<AcCapitalGovernedOutput>({
    moduleKey: AC_CAPITAL_PROVIDER_MODULE_KEY,
    workspaceKey: AC_CAPITAL_PROVIDER_WORKSPACE,
    capability: "capital_intelligence",
    commandCode: AC_CAPITAL_PROVIDER_COMMAND,
    requestedModel,
    promptVersion: "AC-CAPITAL-DIRECTOR-V1",
    sourceRevision: "AC-CAPITAL-LIVE-BRIDGE-01",
    requestPayload: {
      agentKey: input.agentKey,
      workspace: input.workspace,
      prompt: input.prompt,
      doctrineUsed: input.doctrineUsed || [],
      skill: input.skill || null,
      riskLevel: input.riskLevel || "Medium",
    },
    triggerType: "manual",
    actorId: input.actorId || null,
    estimatedRequests: 1,
    estimatedInputTokens,
    estimatedOutputTokens,
    grounded: false,
    forceRefresh: Boolean(input.forceRefresh),
    approvalGranted: input.approvalGranted,
    cacheTtlSeconds: 900,
    metadata: {
      source: "ac-capital-os",
      agentKey: input.agentKey,
      riskLevel: input.riskLevel || "Medium",
      humanAuthority: "Founder / Managing Director",
    },
    execute: async ({ apiKey, model, providerType, requestId }) => {
      if (providerType !== "gemini") throw new Error(`AC_CAPITAL_UNSUPPORTED_PROVIDER:${providerType}`);
      const startedAt = Date.now();
      const response = await invokeGeminiProvider({
        apiKey,
        model,
        contents: input.prompt,
        systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            confirmedFacts: { type: "array", items: { type: "string" } },
            missingData: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            humanActions: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
            requiresHumanApproval: { type: "boolean" },
          },
          required: ["summary", "confirmedFacts", "missingData", "risks", "recommendations", "humanActions", "confidence", "requiresHumanApproval"],
        },
        maxOutputTokens: 4096,
        thinkingLevel: /^gemini-3(?:\.|$)/i.test(model) ? "MEDIUM" : undefined,
      });
      const blockedReason = String(response.promptFeedback?.blockReason || "").trim();
      if (blockedReason) throw new Error(`AC_CAPITAL_PROVIDER_BLOCKED:${blockedReason}`);
      const output = normalizeOutput(parseProviderJson(response.text));
      const usage = response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;
      return {
        result: { ...output, provider: providerType, model: response.modelVersion || model },
        requestCount: 1,
        groundedRequestCount: 0,
        inputTokens: Number(usage?.promptTokenCount || 0),
        outputTokens: Number(usage?.candidatesTokenCount || 0),
        latencyMs: Date.now() - startedAt,
        httpStatus: 200,
        metadata: {
          governedRequestId: requestId,
          responseId: response.responseId || null,
          finishReason: response.candidates?.[0]?.finishReason || null,
        },
      };
    },
  });

  return {
    ok: true,
    mode: "provider-control-live" as const,
    requestId: governed.requestId,
    decision: governed.decision,
    providerType: governed.providerType,
    model: governed.model,
    reused: governed.reused,
    joined: governed.joined,
    usage: governed.usage,
    output: governed.result,
  };
}

export async function requestProviderControlAction(payload: Record<string, unknown>) {
  return executeAcCapitalGovernedAi({
    agentKey: String(payload.agentKey || "ac_capital_intelligence_director"),
    workspace: String(payload.workspace || "AI Command Center"),
    prompt: String(payload.prompt || ""),
    actorId: typeof payload.actorId === "string" ? payload.actorId : null,
    approvalGranted: payload.approvalGranted === true,
    doctrineUsed: Array.isArray(payload.doctrineUsed) ? payload.doctrineUsed.map(String) : [],
    skill: typeof payload.skill === "string" ? payload.skill : null,
    riskLevel: typeof payload.riskLevel === "string" ? payload.riskLevel : null,
    forceRefresh: payload.forceRefresh === true,
  });
}
