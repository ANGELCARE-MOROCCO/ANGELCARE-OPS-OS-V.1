import { executeExternalResearchAgent, executeOpenRouterReport } from "./free-provider-runtime";
import type { ExternalResearchOpportunity, ExternalResearchSource, JsonRecord } from "./free-provider-types";

export type GroundedCapitalSource = {
  index: number;
  title: string;
  url: string;
  domain: string;
  content?: string;
  score?: number;
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
  relevanceScore?: number;
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
  marketSignals?: string[];
  risks?: string[];
  nextActions?: string[];
  freeProviderRunId?: string;
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

function sourceIndex(url: string, sources: ExternalResearchSource[]) {
  const index = sources.findIndex((source) => source.url === url);
  return index >= 0 ? index : 0;
}

function opportunity(candidate: ExternalResearchOpportunity, sources: ExternalResearchSource[]): GroundedCapitalOpportunity {
  return {
    title: candidate.title,
    opportunityType: candidate.opportunityType,
    country: candidate.country,
    region: candidate.region,
    amountMin: candidate.amountMin,
    amountMax: candidate.amountMax,
    amountRangeLabel: candidate.amountRangeLabel,
    currencyLabel: candidate.currencyLabel,
    deadline: candidate.deadline,
    deadlineLabel: candidate.deadlineLabel,
    deadlineHeat: candidate.deadlineHeat,
    sourceTitle: candidate.sourceTitle,
    sourceUrl: candidate.sourceUrl,
    sourceIndex: sourceIndex(candidate.sourceUrl, sources),
    eligibilityPreview: candidate.eligibilityPreview,
    angelcareRelevancePreview: candidate.angelcareRelevancePreview,
    whyCaptured: candidate.whyCaptured,
    sourceConfidence: candidate.sourceConfidence,
    relevanceScore: candidate.relevanceScore,
  };
}

export async function executeGroundedCapitalResearch(input: { query: string; actorId?: string | null; agentKey?: string }) {
  const execution = await executeExternalResearchAgent({
    agentKey: input.agentKey || "funding-opportunity-radar",
    query: input.query,
    triggerType: "manual",
    actorId: input.actorId || null,
  });
  const result: GroundedCapitalResearchResult = {
    summary: execution.analysis.summary,
    confidence: execution.analysis.confidence,
    requiresHumanReview: true,
    searchQueries: execution.searchQueries,
    sources: execution.sources.map((source) => ({ index: source.index, title: source.title, url: source.url, domain: source.domain, content: source.content, score: source.score })),
    opportunities: execution.analysis.opportunities.map((candidate) => opportunity(candidate, execution.sources)),
    rejectedSignals: execution.analysis.rejectedSignals,
    providerResponseId: execution.openRouterRequestId,
    providerModelVersion: execution.selectedAnalysisModel,
    marketSignals: execution.analysis.marketSignals,
    risks: execution.analysis.risks,
    nextActions: execution.analysis.nextActions,
    freeProviderRunId: execution.runId,
  };
  return {
    requestId: execution.openRouterRequestId || execution.runId,
    decision: "EXECUTE_NEW" as const,
    providerType: "tavily+openrouter",
    model: execution.selectedAnalysisModel,
    usage: {
      inputTokens: execution.inputTokens,
      outputTokens: execution.outputTokens,
      estimatedCostUsd: 0,
      providerCallAvoided: false,
      tavilyCredits: execution.tavilyCredits,
      searchLatencyMs: execution.searchLatencyMs,
      analysisLatencyMs: execution.analysisLatencyMs,
    },
    result,
    execution,
  };
}

export async function executeCapitalReportComposition(input: {
  reportType: string;
  audience: string;
  purpose: string;
  sections: string[];
  sourceWorkspaces: string[];
  context: JsonRecord;
  actorId?: string | null;
}) {
  const response = await executeOpenRouterReport(input);
  const sections: CapitalReportSection[] = input.sections.map((title) => {
    const rows = Array.isArray(response.sections) ? response.sections as JsonRecord[] : [];
    const matched = rows.find((row) => String(row.title || "").trim().toLowerCase() === title.trim().toLowerCase()) || rows.find((row) => String(row.title || "").toLowerCase().includes(title.toLowerCase()));
    return {
      title,
      content: String(matched?.content || `No evidence-bound content was returned for ${title}.`).trim(),
      readiness: String(matched?.readiness || "Draft — Human Review").trim(),
      missingData: Array.isArray(matched?.missingData) ? matched.missingData.map(String) : [],
      riskFlags: Array.isArray(matched?.riskFlags) ? matched.riskFlags.map(String) : [],
      sourceWorkspaces: Array.isArray(matched?.sourceWorkspaces) && matched.sourceWorkspaces.length ? matched.sourceWorkspaces.map(String) : input.sourceWorkspaces,
    };
  });
  const result: CapitalReportComposition = {
    executiveSummary: response.executiveSummary,
    sections,
    missingData: response.missingData,
    riskFlags: response.riskFlags,
    nextActions: response.nextActions,
    confidence: response.confidence,
    requiresHumanApproval: true,
    providerResponseId: response.providerResponseId,
    providerModelVersion: response.providerModelVersion,
  };
  return {
    requestId: response.providerResponseId || `openrouter-report-${Date.now()}`,
    decision: "EXECUTE_NEW" as const,
    providerType: "openrouter",
    model: response.providerModelVersion || "openrouter/free",
    usage: { inputTokens: response.inputTokens, outputTokens: response.outputTokens, estimatedCostUsd: 0, providerCallAvoided: false },
    result,
  };
}
