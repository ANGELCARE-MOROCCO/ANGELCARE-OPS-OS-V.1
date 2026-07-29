import { executeGovernedAiRequest } from "@/lib/ai-provider-control/governor";
import { invokeGeminiProvider } from "@/lib/ai-provider-control/gemini-runtime";
import { getAcCapitalFeatureFlags } from "./feature-flags";
import { AC_CAPITAL_PROVIDER_MODULE_KEY } from "./ai-provider-bridge";

type UnknownRecord = Record<string, unknown>;

const AC_CAPITAL_SINGLE_MODEL = process.env.AC_CAPITAL_GEMINI_MODEL || "gemini-2.5-flash";

export type GroundedCapitalSource = {
  index: number;
  title: string;
  url: string;
  domain: string;
};

export type GroundedCapitalOpportunity = {
  title: string;
  opportunityType: string;
  country: string | null;
  region: string | null;
  amountMin: number | null;
  amountMax: number | null;
  amountRangeLabel: string | null;
  currencyLabel: string;
  deadline: string | null;
  deadlineLabel: string | null;
  deadlineHeat: "cold" | "watch" | "warm" | "hot" | "critical" | "unknown";
  sourceTitle: string;
  sourceUrl: string;
  sourceIndex: number;
  eligibilityPreview: string;
  angelcareRelevancePreview: string;
  whyCaptured: string;
  sourceConfidence: number;
};

export type GroundedCapitalRejection = {
  title: string;
  reason: string;
  sourceTitle: string | null;
  sourceUrl: string | null;
};

export type GroundedCapitalResearchResult = {
  summary: string;
  confidence: number;
  requiresHumanReview: boolean;
  searchQueries: string[];
  sources: GroundedCapitalSource[];
  opportunities: GroundedCapitalOpportunity[];
  rejectedSignals: GroundedCapitalRejection[];
  providerResponseId: string | null;
  providerModelVersion: string | null;
};

export type CapitalReportSection = {
  title: string;
  content: string;
  readiness: string;
  missingData: string[];
  riskFlags: string[];
  sourceWorkspaces: string[];
};

export type CapitalReportComposition = {
  executiveSummary: string;
  sections: CapitalReportSection[];
  missingData: string[];
  riskFlags: string[];
  nextActions: string[];
  confidence: number;
  requiresHumanApproval: boolean;
  providerResponseId: string | null;
  providerModelVersion: string | null;
};

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

function boundedNumber(value: unknown, minimum: number, maximum: number, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback;
}

function nullableNumber(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableText(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function parseStrictJson(value: unknown): UnknownRecord {
  const rawOutput = String(value || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  if (!rawOutput) throw new Error("AC_CAPITAL_PROVIDER_EMPTY_OUTPUT");
  const firstBrace = rawOutput.indexOf("{");
  const lastBrace = rawOutput.lastIndexOf("}");
  const raw = firstBrace >= 0 && lastBrace > firstBrace ? rawOutput.slice(firstBrace, lastBrace + 1) : rawOutput;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("NOT_OBJECT");
    return parsed as UnknownRecord;
  } catch {
    throw new Error("AC_CAPITAL_PROVIDER_INVALID_JSON");
  }
}

function validHttpUrl(value: unknown) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalized(value: unknown) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

function sourceDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "web"; }
}

function extractGrounding(response: UnknownRecord) {
  const candidates = Array.isArray(response.candidates) ? response.candidates : [];
  const candidate = record(candidates[0]);
  const metadata = record(candidate.groundingMetadata);
  const chunks = Array.isArray(metadata.groundingChunks) ? metadata.groundingChunks : [];
  const sources: GroundedCapitalSource[] = [];
  const seen = new Set<string>();
  for (const chunk of chunks) {
    const web = record(record(chunk).web);
    const url = validHttpUrl(web.uri);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    sources.push({ index: sources.length, title: String(web.title || sourceDomain(url)).trim(), url, domain: sourceDomain(url) });
  }
  return {
    sources,
    searchQueries: stringArray(metadata.webSearchQueries),
    rawMetadata: metadata,
  };
}

function matchGroundedSource(candidate: UnknownRecord, sources: GroundedCapitalSource[]) {
  const requestedUrl = validHttpUrl(candidate.sourceUrl);
  if (requestedUrl) {
    const exact = sources.find((source) => source.url === requestedUrl);
    if (exact) return exact;
    const requestedDomain = sourceDomain(requestedUrl);
    const domainMatch = sources.find((source) => source.domain === requestedDomain);
    if (domainMatch) return domainMatch;
  }
  const title = normalized(candidate.sourceTitle);
  if (title) {
    const titleMatch = sources.find((source) => normalized(source.title).includes(title) || title.includes(normalized(source.title)));
    if (titleMatch) return titleMatch;
  }
  return null;
}

function normalizeHeat(value: unknown): GroundedCapitalOpportunity["deadlineHeat"] {
  const heat = String(value || "unknown").toLowerCase();
  return ["cold", "watch", "warm", "hot", "critical", "unknown"].includes(heat) ? heat as GroundedCapitalOpportunity["deadlineHeat"] : "unknown";
}

export async function executeGroundedCapitalResearch(input: { query: string; actorId?: string | null }) {
  const flags = getAcCapitalFeatureFlags();
  if (!flags.allowLiveRuns) throw new Error("AC_CAPITAL_LIVE_AI_DISABLED_BY_POLICY");
  if (!flags.allowResearch) throw new Error("AC_CAPITAL_LIVE_RESEARCH_DISABLED_BY_POLICY");
  if (flags.disableWrites) throw new Error("AC_CAPITAL_WRITES_DISABLED_BY_POLICY");
  const query = input.query.trim().slice(0, 2000);
  if (!query) throw new Error("AC_CAPITAL_RESEARCH_QUERY_REQUIRED");

  const requestedModel = AC_CAPITAL_SINGLE_MODEL;
  const prompt = [
    "Perform a live Google-grounded capital opportunity scan for ANGELCARE, a Morocco-based childcare, education, home-service and SaaS-enabled operating company.",
    `Research request: ${query}`,
    "Prioritize currently open or clearly active opportunities from authoritative funder, bank, government, investor, accelerator, grant or institutional sources.",
    "Do not invent a funder, program, amount, deadline, eligibility rule or URL. Reject stale, closed, ambiguous or weakly sourced signals.",
    "Return one strict JSON object only, without markdown fences, using this shape:",
    JSON.stringify({
      summary: "string",
      confidence: 0,
      opportunities: [{
        title: "string", opportunityType: "Bank|Grant|VC|Angel|Strategic Partner|Public Funding|Impact Finance|SaaS Investor|Other",
        country: "string|null", region: "string|null", amountMin: "number|null", amountMax: "number|null",
        amountRangeLabel: "string|null", currencyLabel: "Dh or source currency", deadline: "YYYY-MM-DD|null",
        deadlineLabel: "string|null", deadlineHeat: "cold|watch|warm|hot|critical|unknown",
        sourceTitle: "exact source title", sourceUrl: "exact source URL", eligibilityPreview: "string",
        angelcareRelevancePreview: "string", whyCaptured: "string", sourceConfidence: 0,
        captureDecision: "capture|reject", rejectionReason: "string|null"
      }]
    }),
    "Every captured opportunity must include a source URL actually used by Google Search grounding. Mark uncertain candidates as reject and explain why.",
    "All outputs require human review before qualification, outreach or submission.",
  ].join("\n");

  const governed = await executeGovernedAiRequest<GroundedCapitalResearchResult>({
    moduleKey: AC_CAPITAL_PROVIDER_MODULE_KEY,
    workspaceKey: "opportunity-radar",
    capability: "grounded_research",
    commandCode: "AC_CAPITAL_RADAR_GROUNDED_RESEARCH",
    requestedModel,
    promptVersion: "AC-CAPITAL-RADAR-GROUNDED-V1",
    sourceRevision: "AC-CAPITAL-RUNTIME-TRUTH-REPAIR-01",
    requestPayload: { query },
    triggerType: "manual",
    actorId: input.actorId || null,
    estimatedRequests: 1,
    estimatedInputTokens: Math.max(256, Math.ceil(prompt.length / 3.5)),
    estimatedOutputTokens: 3200,
    grounded: true,
    forceRefresh: true,
    approvalGranted: true,
    cacheTtlSeconds: 0,
    metadata: { source: "ac-capital-radar", humanReviewRequired: true, externalActions: false },
    execute: async ({ apiKey, model, providerType, requestId }) => {
      if (providerType !== "gemini") throw new Error(`AC_CAPITAL_UNSUPPORTED_PROVIDER:${providerType}`);
      const startedAt = Date.now();
      const response = await invokeGeminiProvider({
        apiKey,
        model,
        contents: prompt,
        systemInstruction: "You are the governed AC CAPITAL OS live research director. Use Google Search grounding. Evidence and truth are more important than volume. Return strict JSON only.",
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 6000,
        thinkingLevel: /^gemini-3(?:\.|$)/i.test(model) ? "MEDIUM" : undefined,
      });
      const blockedReason = String(response.promptFeedback?.blockReason || "").trim();
      if (blockedReason) throw new Error(`AC_CAPITAL_PROVIDER_BLOCKED:${blockedReason}`);
      const grounding = extractGrounding(response as unknown as UnknownRecord);
      if (!grounding.sources.length) throw new Error("AC_CAPITAL_GROUNDING_METADATA_MISSING");
      const parsed = parseStrictJson(response.text);
      const candidateRows = Array.isArray(parsed.opportunities) ? parsed.opportunities.map(record) : [];
      const opportunities: GroundedCapitalOpportunity[] = [];
      const rejectedSignals: GroundedCapitalRejection[] = [];
      for (const candidate of candidateRows) {
        const title = String(candidate.title || "Untitled research signal").trim();
        const source = matchGroundedSource(candidate, grounding.sources);
        const captureDecision = String(candidate.captureDecision || "capture").toLowerCase();
        const rejectionReason = String(candidate.rejectionReason || "").trim();
        if (captureDecision !== "capture" || !source) {
          rejectedSignals.push({
            title,
            reason: rejectionReason || (!source ? "Candidate source could not be verified against Gemini grounding metadata." : "Candidate was rejected by the governed research analysis."),
            sourceTitle: source?.title || nullableText(candidate.sourceTitle),
            sourceUrl: source?.url || validHttpUrl(candidate.sourceUrl),
          });
          continue;
        }
        opportunities.push({
          title,
          opportunityType: String(candidate.opportunityType || "Other").trim(),
          country: nullableText(candidate.country),
          region: nullableText(candidate.region),
          amountMin: nullableNumber(candidate.amountMin),
          amountMax: nullableNumber(candidate.amountMax),
          amountRangeLabel: nullableText(candidate.amountRangeLabel),
          currencyLabel: String(candidate.currencyLabel || "Dh").trim(),
          deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(candidate.deadline || "")) ? String(candidate.deadline) : null,
          deadlineLabel: nullableText(candidate.deadlineLabel),
          deadlineHeat: normalizeHeat(candidate.deadlineHeat),
          sourceTitle: source.title,
          sourceUrl: source.url,
          sourceIndex: source.index,
          eligibilityPreview: String(candidate.eligibilityPreview || "Human eligibility verification required.").trim(),
          angelcareRelevancePreview: String(candidate.angelcareRelevancePreview || "Human AngelCare-fit review required.").trim(),
          whyCaptured: String(candidate.whyCaptured || "Captured from live grounded research for human review.").trim(),
          sourceConfidence: Math.round(boundedNumber(candidate.sourceConfidence, 0, 100, 65)),
        });
      }
      const usage = response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;
      const result: GroundedCapitalResearchResult = {
        summary: String(parsed.summary || `Grounded research completed with ${opportunities.length} captured opportunities.`),
        confidence: boundedNumber(parsed.confidence, 0, 100, opportunities.length ? 70 : 0),
        requiresHumanReview: true,
        searchQueries: grounding.searchQueries,
        sources: grounding.sources,
        opportunities,
        rejectedSignals,
        providerResponseId: response.responseId || null,
        providerModelVersion: response.modelVersion || model,
      };
      return {
        result,
        requestCount: 1,
        groundedRequestCount: 1,
        inputTokens: Number(usage?.promptTokenCount || 0),
        outputTokens: Number(usage?.candidatesTokenCount || 0),
        latencyMs: Date.now() - startedAt,
        httpStatus: 200,
        metadata: {
          governedRequestId: requestId,
          responseId: response.responseId || null,
          finishReason: response.candidates?.[0]?.finishReason || null,
          searchQueries: grounding.searchQueries,
          groundingSources: grounding.sources,
          groundingMetadata: grounding.rawMetadata,
        },
      };
    },
  });

  if (governed.usage.providerCallAvoided) throw new Error("AC_CAPITAL_RESEARCH_PROVIDER_CALL_NOT_EXECUTED");
  return {
    requestId: governed.requestId,
    decision: governed.decision,
    providerType: governed.providerType,
    model: governed.model,
    usage: governed.usage,
    result: governed.result,
  };
}

export async function executeCapitalReportComposition(input: {
  reportType: string;
  audience: string;
  purpose: string;
  sections: string[];
  sourceWorkspaces: string[];
  context: UnknownRecord;
  actorId?: string | null;
}) {
  const flags = getAcCapitalFeatureFlags();
  if (!flags.allowLiveRuns) throw new Error("AC_CAPITAL_LIVE_AI_DISABLED_BY_POLICY");
  if (flags.disableWrites) throw new Error("AC_CAPITAL_WRITES_DISABLED_BY_POLICY");
  const requestedModel = AC_CAPITAL_SINGLE_MODEL;
  const prompt = [
    `Compose a substantive ${input.reportType} for AC CAPITAL OS.`,
    `Audience: ${input.audience}`,
    `Purpose: ${input.purpose}`,
    `Required sections: ${input.sections.join(" | ")}`,
    `Approved source workspaces: ${input.sourceWorkspaces.join(", ") || "none"}`,
    "Use only the supplied AC CAPITAL OS record snapshot. Do not invent missing facts, amounts, approvals, eligibility, deadlines, documents or outcomes.",
    "Clearly state missing evidence, operational risks, founder decisions and next actions. External release always remains human-controlled.",
    "Controlled record snapshot follows:",
    JSON.stringify(input.context),
  ].join("\n");

  const governed = await executeGovernedAiRequest<CapitalReportComposition>({
    moduleKey: AC_CAPITAL_PROVIDER_MODULE_KEY,
    workspaceKey: "executive-report-studio",
    capability: "structured_content",
    commandCode: "AC_CAPITAL_REPORT_COMPOSE",
    requestedModel,
    promptVersion: "AC-CAPITAL-REPORT-COMPOSER-V1",
    sourceRevision: "AC-CAPITAL-RUNTIME-TRUTH-REPAIR-01",
    requestPayload: { reportType: input.reportType, audience: input.audience, purpose: input.purpose, sections: input.sections, sourceWorkspaces: input.sourceWorkspaces, context: input.context },
    triggerType: "manual",
    actorId: input.actorId || null,
    estimatedRequests: 1,
    estimatedInputTokens: Math.max(512, Math.ceil(prompt.length / 3.5)),
    estimatedOutputTokens: 5000,
    grounded: false,
    forceRefresh: true,
    approvalGranted: true,
    cacheTtlSeconds: 0,
    metadata: { source: "ac-capital-report-studio", humanApprovalRequired: true, externalActions: false },
    execute: async ({ apiKey, model, providerType, requestId }) => {
      if (providerType !== "gemini") throw new Error(`AC_CAPITAL_UNSUPPORTED_PROVIDER:${providerType}`);
      const startedAt = Date.now();
      const response = await invokeGeminiProvider({
        apiKey,
        model,
        contents: prompt,
        systemInstruction: "You are the governed AC CAPITAL OS Executive Reporting Director. Produce evidence-bound, board-ready content from supplied records only. Return strict JSON.",
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            executiveSummary: { type: "string" },
            sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" }, readiness: { type: "string" }, missingData: { type: "array", items: { type: "string" } }, riskFlags: { type: "array", items: { type: "string" } }, sourceWorkspaces: { type: "array", items: { type: "string" } } }, required: ["title", "content", "readiness", "missingData", "riskFlags", "sourceWorkspaces"] } },
            missingData: { type: "array", items: { type: "string" } },
            riskFlags: { type: "array", items: { type: "string" } },
            nextActions: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
            requiresHumanApproval: { type: "boolean" },
          },
          required: ["executiveSummary", "sections", "missingData", "riskFlags", "nextActions", "confidence", "requiresHumanApproval"],
        },
        maxOutputTokens: 7000,
        thinkingLevel: /^gemini-3(?:\.|$)/i.test(model) ? "MEDIUM" : undefined,
      });
      const blockedReason = String(response.promptFeedback?.blockReason || "").trim();
      if (blockedReason) throw new Error(`AC_CAPITAL_PROVIDER_BLOCKED:${blockedReason}`);
      const parsed = parseStrictJson(response.text);
      const rawSections = Array.isArray(parsed.sections) ? parsed.sections.map(record) : [];
      const byTitle = new Map(rawSections.map((section) => [normalized(section.title), section]));
      const sections: CapitalReportSection[] = input.sections.map((title) => {
        const section = byTitle.get(normalized(title)) || rawSections.find((item) => normalized(item.title).includes(normalized(title)) || normalized(title).includes(normalized(item.title))) || {};
        return {
          title,
          content: String(section.content || `No evidence-bound content was returned for ${title}.`).trim(),
          readiness: String(section.readiness || "Draft — Human Review").trim(),
          missingData: stringArray(section.missingData),
          riskFlags: stringArray(section.riskFlags),
          sourceWorkspaces: stringArray(section.sourceWorkspaces).length ? stringArray(section.sourceWorkspaces) : input.sourceWorkspaces,
        };
      });
      const usage = response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;
      const result: CapitalReportComposition = {
        executiveSummary: String(parsed.executiveSummary || "").trim(),
        sections,
        missingData: stringArray(parsed.missingData),
        riskFlags: stringArray(parsed.riskFlags),
        nextActions: stringArray(parsed.nextActions),
        confidence: boundedNumber(parsed.confidence, 0, 100, 0),
        requiresHumanApproval: true,
        providerResponseId: response.responseId || null,
        providerModelVersion: response.modelVersion || model,
      };
      const thinSections = result.sections.filter((section) => section.content.length < 120);
      if (result.executiveSummary.length < 100 || !result.sections.length || thinSections.length) {
        throw new Error(`AC_CAPITAL_REPORT_NOT_SUBSTANTIVE:${thinSections.map((section) => section.title).join("|") || "executive-summary"}`);
      }
      return {
        result,
        requestCount: 1,
        groundedRequestCount: 0,
        inputTokens: Number(usage?.promptTokenCount || 0),
        outputTokens: Number(usage?.candidatesTokenCount || 0),
        latencyMs: Date.now() - startedAt,
        httpStatus: 200,
        metadata: { governedRequestId: requestId, responseId: response.responseId || null, finishReason: response.candidates?.[0]?.finishReason || null },
      };
    },
  });

  if (governed.usage.providerCallAvoided) throw new Error("AC_CAPITAL_REPORT_PROVIDER_CALL_NOT_EXECUTED");
  return {
    requestId: governed.requestId,
    decision: governed.decision,
    providerType: governed.providerType,
    model: governed.model,
    usage: governed.usage,
    result: governed.result,
  };
}
