import { executeOpenRouterCapability } from "./free-provider-runtime";

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

const clean = (value: unknown) => String(value ?? "").trim();
const strings = (value: unknown) => Array.isArray(value) ? value.map(clean).filter(Boolean) : [];

function normalizeOutput(value: Record<string, unknown>, provider: string, model: string): AcCapitalGovernedOutput {
  return {
    summary: clean(value.summary) || "No summary returned.",
    confirmedFacts: strings(value.confirmedFacts),
    missingData: strings(value.missingData),
    risks: strings(value.risks),
    recommendations: strings(value.recommendations),
    humanActions: strings(value.humanActions),
    confidence: Math.max(0, Math.min(100, Number(value.confidence || 0))),
    requiresHumanApproval: value.requiresHumanApproval !== false,
    provider,
    model,
  };
}

export async function getAiProviderBridgeStatus() {
  return {
    providerAuthority: "/ac-capital-os/ai-control",
    snapshotApi: "/api/ac-capital-os/free-provider-control",
    actionApi: "/api/ac-capital-os/ai-command-center/run",
    moduleKey: AC_CAPITAL_PROVIDER_MODULE_KEY,
    providerMode: "openrouter-free",
    executionMode: "governed-live",
    allowLiveRuns: true,
    allowResearch: true,
    noExposedApiKeys: true,
    governedRuntime: true,
    externalActionsLocked: true,
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
  if (!input.prompt.trim()) throw new Error("AC_CAPITAL_PROMPT_REQUIRED");
  if (/financial sensitive/i.test(clean(input.riskLevel)) && !input.approvalGranted) {
    throw Object.assign(new Error("FOUNDER_APPROVAL_REQUIRED_FOR_FINANCIAL_SENSITIVE_AI"), { status: 403 });
  }

  const schema = {
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
    additionalProperties: false,
  };

  const response = await executeOpenRouterCapability({
    agentKey: input.agentKey || "ac-capital-intelligence-director",
    capability: "capital_intelligence",
    systemPrompt: [
      "You are the governed AC CAPITAL OS Intelligence Director for ANGELCARE.",
      "Provide evidence-bound internal decision support only.",
      "Never fabricate facts, eligibility, dates, funders, financial figures or completed external actions.",
      "Separate confirmed facts, assumptions and missing evidence.",
      "Financial, legal, bank, investor and submission-sensitive recommendations remain human-controlled.",
    ].join(" "),
    prompt: input.prompt,
    schema,
    context: {
      workspace: input.workspace,
      doctrineUsed: input.doctrineUsed || [],
      skill: input.skill || null,
      riskLevel: input.riskLevel || "Medium",
      forceRefresh: Boolean(input.forceRefresh),
      externalActionsLocked: true,
    },
    actorId: input.actorId || null,
  });

  const output = normalizeOutput(response.result, "openrouter", response.selectedModel);
  return {
    ok: true,
    mode: "openrouter-free-governed" as const,
    requestId: response.providerResponseId || response.runId,
    decision: "EXECUTE_NEW" as const,
    providerType: "openrouter",
    model: response.selectedModel,
    reused: false,
    joined: false,
    usage: {
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      estimatedCostUsd: 0,
      providerCallAvoided: false,
    },
    output,
    providerRunId: response.runId,
  };
}

export async function requestProviderControlAction(payload: Record<string, unknown>) {
  return executeAcCapitalGovernedAi({
    agentKey: clean(payload.agentKey) || "ac-capital-intelligence-director",
    workspace: clean(payload.workspace) || "AI Command Center",
    prompt: clean(payload.prompt),
    actorId: typeof payload.actorId === "string" ? payload.actorId : null,
    approvalGranted: payload.approvalGranted === true,
    doctrineUsed: Array.isArray(payload.doctrineUsed) ? payload.doctrineUsed.map(String) : [],
    skill: typeof payload.skill === "string" ? payload.skill : null,
    riskLevel: typeof payload.riskLevel === "string" ? payload.riskLevel : null,
    forceRefresh: payload.forceRefresh === true,
  });
}
