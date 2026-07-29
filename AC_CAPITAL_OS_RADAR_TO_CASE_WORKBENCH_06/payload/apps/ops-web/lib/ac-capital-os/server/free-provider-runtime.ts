import { createServiceClient } from "@/lib/supabase/server";
import type {
  AcCapitalAiAgent,
  AcCapitalProviderConfig,
  ExternalResearchAnalysis,
  ExternalResearchExecution,
  ExternalResearchOpportunity,
  ExternalResearchSource,
  JsonRecord,
} from "./free-provider-types";

type SupabaseAny = any;

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const bool = (value: unknown, fallback = false) => value == null ? fallback : Boolean(value);
const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const stringArray = (value: unknown) => Array.isArray(value) ? value.map((item) => clean(item)).filter(Boolean) : [];

function validUrl(value: unknown) {
  try {
    const url = new URL(clean(value));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function domainOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "web"; }
}

function errorText(payload: unknown, status?: number) {
  const row = object(payload);
  const error = object(row.error);
  const detail = object(row.detail);
  const message = clean(error.message || detail.error || row.message || row.error || payload);
  return `${status ? `${status}:` : ""}${message || "PROVIDER_REQUEST_FAILED"}`;
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const raw = await response.text();
    let payload: unknown = raw;
    try { payload = raw ? JSON.parse(raw) : {}; } catch { /* preserve raw provider response */ }
    if (!response.ok) throw Object.assign(new Error(errorText(payload, response.status)), { status: response.status, payload });
    return { response, payload: object(payload), latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}

async function withRetry<T>(operation: () => Promise<T>, retries: number, cooldownMs = 750): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= Math.max(0, retries); attempt += 1) {
    try { return await operation(); } catch (error) {
      lastError = error;
      const status = Number((error as { status?: number })?.status || 0);
      if (attempt >= retries || ![408, 409, 425, 429, 500, 502, 503, 504].includes(status)) break;
      await new Promise((resolve) => setTimeout(resolve, cooldownMs * (attempt + 1)));
    }
  }
  throw lastError;
}

async function resolveSecret(supabase: SupabaseAny, credentialId: string) {
  const result = await supabase.rpc("ai_provider_resolve_secret", { p_credential_id: credentialId });
  if (result.error) throw new Error(result.error.message);
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  const secret = clean(row?.decrypted_secret || row);
  if (!secret) throw new Error("AC_CAPITAL_PROVIDER_SECRET_UNAVAILABLE");
  return secret;
}

async function loadProvider(supabase: SupabaseAny, providerKey: "tavily" | "openrouter") {
  const result = await supabase.from("ac_capital_ai_provider_configs").select("*").eq("provider_key", providerKey).single();
  if (result.error) throw new Error(result.error.message);
  const provider = result.data as AcCapitalProviderConfig;
  if (!provider.enabled) throw new Error(`AC_CAPITAL_PROVIDER_DISABLED:${providerKey}`);
  if (provider.paused) throw new Error(`AC_CAPITAL_PROVIDER_PAUSED:${providerKey}`);
  if (!provider.credential_id) throw new Error(`AC_CAPITAL_PROVIDER_CREDENTIAL_REQUIRED:${providerKey}`);
  return { provider, secret: await resolveSecret(supabase, provider.credential_id) };
}

async function loadAgent(supabase: SupabaseAny, agentKey: string, triggerType: "manual" | "scheduled") {
  const result = await supabase.from("ac_capital_ai_agents").select("*").eq("agent_key", agentKey).single();
  if (result.error) throw new Error(result.error.message);
  const agent = result.data as AcCapitalAiAgent;
  if (agent.status !== "active") throw new Error(`AC_CAPITAL_AGENT_${agent.status.toUpperCase()}:${agentKey}`);
  if (triggerType === "manual" && !["manual", "both"].includes(agent.trigger_mode)) throw new Error("AC_CAPITAL_AGENT_MANUAL_TRIGGER_DISABLED");
  if (triggerType === "scheduled" && !["scheduled", "both"].includes(agent.trigger_mode)) throw new Error("AC_CAPITAL_AGENT_SCHEDULED_TRIGGER_DISABLED");
  return agent;
}

async function loadRuntimeState(supabase: SupabaseAny) {
  const result = await supabase.from("ac_capital_ai_runtime_state").select("*").eq("state_key", "primary").maybeSingle();
  if (result.error) throw new Error(result.error.message);
  const state = object(result.data);
  if (bool(state.global_pause)) throw new Error("AC_CAPITAL_AI_GLOBAL_PAUSE");
  if (!bool(state.internal_automation_enabled, true)) throw new Error("AC_CAPITAL_INTERNAL_AUTOMATION_DISABLED");
  return state;
}

async function enforceConcurrency(supabase: SupabaseAny, state: JsonRecord) {
  const result = await supabase.from("ac_capital_ai_agent_runs").select("id", { count: "exact", head: true }).eq("status", "running");
  if (result.error) throw new Error(result.error.message);
  if (Number(result.count || 0) >= Math.max(1, number(state.max_parallel_runs, 1))) throw new Error("AC_CAPITAL_MAX_PARALLEL_RUNS_REACHED");
}

function periodStart(period: "day" | "week" | "month") {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (period === "week") date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  if (period === "month") date.setDate(1);
  return date.toISOString();
}

async function usageTotal(supabase: SupabaseAny, providerKey: string, field: "request_count" | "credits_consumed", start: string) {
  const result = await supabase.from("ac_capital_ai_usage_ledger").select(field).eq("provider_key", providerKey).gte("occurred_at", start);
  if (result.error) throw new Error(result.error.message);
  return (result.data || []).reduce((sum: number, row: JsonRecord) => sum + number(row[field]), 0);
}

async function runCount(supabase: SupabaseAny, agentKey: string, start: string) {
  const result = await supabase.from("ac_capital_ai_agent_runs").select("id", { count: "exact", head: true }).eq("agent_key", agentKey).gte("created_at", start).in("status", ["queued", "running", "completed", "completed-with-warnings"]);
  if (result.error) throw new Error(result.error.message);
  return Number(result.count || 0);
}

async function enforceBudgets(supabase: SupabaseAny, agent: AcCapitalAiAgent, tavily: AcCapitalProviderConfig, openrouter: AcCapitalProviderConfig, searchCount: number) {
  const quota = object(agent.quota_config);
  const [agentDay, agentWeek, agentMonth, tavilyDay, tavilyMonth, openrouterDay, openrouterMonth] = await Promise.all([
    runCount(supabase, agent.agent_key, periodStart("day")),
    runCount(supabase, agent.agent_key, periodStart("week")),
    runCount(supabase, agent.agent_key, periodStart("month")),
    usageTotal(supabase, "tavily", "credits_consumed", periodStart("day")),
    usageTotal(supabase, "tavily", "credits_consumed", periodStart("month")),
    usageTotal(supabase, "openrouter", "request_count", periodStart("day")),
    usageTotal(supabase, "openrouter", "request_count", periodStart("month")),
  ]);
  if (agentDay >= number(quota.maxRunsPerDay, 1)) throw new Error("AC_CAPITAL_AGENT_DAILY_RUN_LIMIT");
  if (agentWeek >= number(quota.maxRunsPerWeek, 7)) throw new Error("AC_CAPITAL_AGENT_WEEKLY_RUN_LIMIT");
  if (agentMonth >= number(quota.maxRunsPerMonth, 30)) throw new Error("AC_CAPITAL_AGENT_MONTHLY_RUN_LIMIT");
  const tavilyLimits = object(tavily.internal_limits);
  const openrouterLimits = object(openrouter.internal_limits);
  const searchDepth = clean(object(agent.search_config).searchDepth || object(tavily.config).searchDepth || "basic");
  const estimatedSearchCredits = searchCount * (searchDepth === "advanced" ? 2 : 1);
  if (estimatedSearchCredits > number(quota.maxTavilyCreditsPerRun, estimatedSearchCredits)) throw new Error("AC_CAPITAL_AGENT_TAVILY_RUN_LIMIT");
  if (1 > number(quota.maxOpenRouterRequestsPerRun, 1)) throw new Error("AC_CAPITAL_AGENT_OPENROUTER_RUN_LIMIT");
  if (tavilyDay + estimatedSearchCredits > number(tavilyLimits.maxCreditsPerDay, 40)) throw new Error("AC_CAPITAL_TAVILY_DAILY_INTERNAL_LIMIT");
  if (tavilyMonth + estimatedSearchCredits > number(tavilyLimits.maxCreditsPerMonth, 900)) throw new Error("AC_CAPITAL_TAVILY_MONTHLY_INTERNAL_LIMIT");
  if (openrouterDay + 1 > number(openrouterLimits.maxRequestsPerDay, 40)) throw new Error("AC_CAPITAL_OPENROUTER_DAILY_INTERNAL_LIMIT");
  if (openrouterMonth + 1 > number(openrouterLimits.maxRequestsPerMonth, 1000)) throw new Error("AC_CAPITAL_OPENROUTER_MONTHLY_INTERNAL_LIMIT");
  const providerUsage = object(tavily.provider_usage);
  const keyUsage = object(providerUsage.key);
  const limit = number(keyUsage.limit, 0);
  const used = number(keyUsage.usage, 0);
  const reserve = number(tavilyLimits.reserveCredits, 100);
  if (limit > 0 && used + estimatedSearchCredits > Math.max(0, limit - reserve)) throw new Error("AC_CAPITAL_TAVILY_PROVIDER_RESERVE_PROTECTED");
}

function searchVariants(query: string, agent: AcCapitalAiAgent, maxSearches: number) {
  const searchConfig = object(agent.search_config);
  const countries = stringArray(searchConfig.countries);
  const keywords = stringArray(searchConfig.keywords);
  const excludeTerms = stringArray(searchConfig.excludeTerms);
  const doctrine = clean(agent.prompt_doctrine);
  const exclusionSuffix = excludeTerms.map((term) => `-${term.replace(/\s+/g, "-")}`).join(" ");
  const variants = [`${query} ${keywords.join(" ")} ${exclusionSuffix}`.trim()];
  if (maxSearches > 1) variants.push(`${query} official program application funding open deadline ${countries.slice(0, 4).join(" ")}`.trim());
  if (maxSearches > 2) variants.push(`${query} authoritative source investor grant bank accelerator ${doctrine.slice(0, 180)}`.trim());
  return Array.from(new Set(variants.map((item) => item.slice(0, 390)).filter(Boolean))).slice(0, Math.max(1, maxSearches));
}

function timeRangeFromDays(days: number) {
  if (days <= 1) return "day";
  if (days <= 7) return "week";
  if (days <= 31) return "month";
  if (days <= 366) return "year";
  return undefined;
}

async function searchTavily(secret: string, provider: AcCapitalProviderConfig, agent: AcCapitalAiAgent, query: string) {
  const providerConfig = object(provider.config);
  const searchConfig = object(agent.search_config);
  const maxSearches = Math.max(1, Math.min(10, number(searchConfig.maxSearchesPerRun, 1)));
  const variants = searchVariants(query, agent, maxSearches);
  const allSources: ExternalResearchSource[] = [];
  const requestIds: string[] = [];
  let credits = 0;
  let totalLatency = 0;
  let lastHttpStatus = 200;
  const seen = new Set<string>();

  for (const variant of variants) {
    const depth = clean(searchConfig.searchDepth || providerConfig.searchDepth || "basic");
    const countryCandidates = stringArray(searchConfig.countries);
    const country = clean(providerConfig.country || countryCandidates[0]).toLowerCase();
    const body: JsonRecord = {
      query: variant,
      search_depth: ["advanced", "basic", "fast", "ultra-fast"].includes(depth) ? depth : "basic",
      max_results: Math.max(1, Math.min(20, number(searchConfig.maxResultsPerSearch || providerConfig.maxResults, 8))),
      topic: ["general", "news", "finance"].includes(clean(providerConfig.topic)) ? clean(providerConfig.topic) : "general",
      include_answer: bool(providerConfig.includeAnswer, false),
      include_raw_content: bool(providerConfig.includeRawContent, false),
      include_images: false,
      include_domains: Array.from(new Set([...stringArray(providerConfig.includeDomains), ...stringArray(searchConfig.includeDomains)])),
      exclude_domains: Array.from(new Set([...stringArray(providerConfig.excludeDomains), ...stringArray(searchConfig.excludeDomains)])),
      auto_parameters: bool(providerConfig.autoParameters, false),
      safe_search: false,
      include_usage: true,
    };
    const timeRange = timeRangeFromDays(number(searchConfig.recencyDays, 45));
    if (timeRange) body.time_range = timeRange;
    if (country && country !== "international" && country !== "africa" && country !== "mena") body.country = country;

    const result = await withRetry(() => fetchJson(provider.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        "X-Project-ID": "angelcare-ac-capital-os",
      },
      body: JSON.stringify(body),
    }, number(providerConfig.timeoutMs, 30000)), Math.max(0, number(providerConfig.maxRetries, 1)));
    totalLatency += result.latencyMs;
    lastHttpStatus = result.response.status;
    requestIds.push(clean(result.payload.request_id));
    credits += number(object(result.payload.usage).credits, depth === "advanced" ? 2 : 1);
    const rows = Array.isArray(result.payload.results) ? result.payload.results : [];
    for (const raw of rows) {
      const row = object(raw);
      const url = validUrl(row.url);
      const score = Math.max(0, Math.min(1, number(row.score, 0)));
      const minimumSourceScore = Math.max(0, Math.min(1, number(searchConfig.minimumSourceScore, 0)));
      if (!url || seen.has(url) || score < minimumSourceScore) continue;
      seen.add(url);
      allSources.push({
        index: allSources.length,
        title: clean(row.title || domainOf(url)),
        url,
        content: clean(row.content).slice(0, 8000),
        rawContent: clean(row.raw_content) || null,
        score,
        domain: domainOf(url),
      });
    }
  }

  return { sources: allSources, requestIds: requestIds.filter(Boolean), credits, latencyMs: totalLatency, httpStatus: lastHttpStatus, searchQueries: variants };
}

const opportunitySchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    confidence: { type: "number" },
    opportunities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          organizationName: { type: ["string", "null"] },
          opportunityType: { type: "string" },
          country: { type: ["string", "null"] },
          region: { type: ["string", "null"] },
          amountMin: { type: ["number", "null"] },
          amountMax: { type: ["number", "null"] },
          amountRangeLabel: { type: ["string", "null"] },
          currencyLabel: { type: "string" },
          deadline: { type: ["string", "null"] },
          deadlineLabel: { type: ["string", "null"] },
          deadlineHeat: { type: "string" },
          applicationUrl: { type: ["string", "null"] },
          applicationStatus: { type: "string" },
          sourceTitle: { type: "string" },
          sourceUrl: { type: "string" },
          eligibilityPreview: { type: "string" },
          angelcareRelevancePreview: { type: "string" },
          whyCaptured: { type: "string" },
          sourceConfidence: { type: "number" },
          relevanceScore: { type: "number" },
          eligibilityConfidence: { type: "number" },
          evidenceQualityScore: { type: "number" },
          strategicValueScore: { type: "number" },
          effortScore: { type: "number" },
          riskLevel: { type: "string" },
          requiredDocuments: { type: "array", items: { type: "string" } },
          proofGaps: { type: "array", items: { type: "string" } },
          evidenceQuotes: { type: "array", items: { type: "string" } },
          recommendedNextAction: { type: "string" },
          clusterKey: { type: ["string", "null"] },
          captureDecision: { type: "string" },
          rejectionReason: { type: ["string", "null"] },
        },
        required: [
          "title", "organizationName", "opportunityType", "country", "region",
          "amountMin", "amountMax", "amountRangeLabel", "currencyLabel",
          "deadline", "deadlineLabel", "deadlineHeat", "applicationUrl",
          "applicationStatus", "sourceTitle", "sourceUrl", "eligibilityPreview",
          "angelcareRelevancePreview", "whyCaptured", "sourceConfidence",
          "relevanceScore", "eligibilityConfidence", "evidenceQualityScore",
          "strategicValueScore", "effortScore", "riskLevel", "requiredDocuments",
          "proofGaps", "evidenceQuotes", "recommendedNextAction", "clusterKey",
          "captureDecision", "rejectionReason"
        ],
        additionalProperties: false,
      },
    },
    rejectedSignals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          reason: { type: "string" },
          sourceTitle: { type: ["string", "null"] },
          sourceUrl: { type: ["string", "null"] },
        },
        required: ["title", "reason", "sourceTitle", "sourceUrl"],
        additionalProperties: false,
      },
    },
    marketSignals: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    nextActions: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "confidence", "opportunities", "rejectedSignals", "marketSignals", "risks", "nextActions"],
  additionalProperties: false,
} as const;

// AC_CAPITAL_OPENROUTER_JSON_RESILIENCE_06
function openRouterContentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      const row = object(item);
      return clean(row.text || row.content || row.value || "");
    }).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  return clean(value);
}

function extractBalancedJsonObject(raw: string) {
  const start = raw.indexOf("{");
  if (start < 0) return raw;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < raw.length; index += 1) {
    const character = raw[index];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (character === "\\") { escaped = true; continue; }
      if (character === '"') inString = false;
      continue;
    }
    if (character === '"') { inString = true; continue; }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, index + 1);
    }
  }
  return raw.slice(start);
}

function strictJson(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as JsonRecord;
  const original = openRouterContentText(value).replace(/^\uFEFF/, "").trim();
  const withoutFence = original.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const balanced = extractBalancedJsonObject(withoutFence);
  const repaired = balanced
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/,\s*([}\]])/g, "$1");
  for (const candidate of [withoutFence, balanced, repaired]) {
    if (!candidate) continue;
    try {
      const first = JSON.parse(candidate);
      const parsed = typeof first === "string" ? JSON.parse(first) : first;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as JsonRecord;
    } catch { /* continue */ }
  }
  throw new Error("AC_CAPITAL_OPENROUTER_INVALID_JSON");
}

function normalizeOpportunity(raw: unknown, sourceByUrl: Map<string, ExternalResearchSource>): ExternalResearchOpportunity | null {
  const row = object(raw);
  const url = validUrl(row.sourceUrl);
  if (!url || !sourceByUrl.has(url)) return null;
  const source = sourceByUrl.get(url) as ExternalResearchSource;
  const heat = clean(row.deadlineHeat).toLowerCase();
  const decision = clean(row.captureDecision).toLowerCase();
  return {
    title: clean(row.title || "Untitled opportunity"),
    organizationName: clean(row.organizationName) || null,
    opportunityType: clean(row.opportunityType || "Other"),
    country: clean(row.country) || null,
    region: clean(row.region) || null,
    amountMin: row.amountMin == null ? null : number(row.amountMin),
    amountMax: row.amountMax == null ? null : number(row.amountMax),
    amountRangeLabel: clean(row.amountRangeLabel) || null,
    currencyLabel: clean(row.currencyLabel || "Dh"),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(clean(row.deadline)) ? clean(row.deadline) : null,
    deadlineLabel: clean(row.deadlineLabel) || null,
    deadlineHeat: ["cold", "watch", "warm", "hot", "critical", "unknown"].includes(heat) ? heat as ExternalResearchOpportunity["deadlineHeat"] : "unknown",
    applicationUrl: validUrl(row.applicationUrl) || null,
    applicationStatus: clean(row.applicationStatus || "unknown"),
    sourceTitle: clean(row.sourceTitle || source.title),
    sourceUrl: url,
    eligibilityPreview: clean(row.eligibilityPreview || "Human eligibility verification required."),
    angelcareRelevancePreview: clean(row.angelcareRelevancePreview || "Human relevance verification required."),
    whyCaptured: clean(row.whyCaptured || "Captured from public evidence for internal review."),
    sourceConfidence: Math.max(0, Math.min(100, number(row.sourceConfidence, source.score * 100))),
    relevanceScore: Math.max(0, Math.min(100, number(row.relevanceScore, 50))),
    eligibilityConfidence: Math.max(0, Math.min(100, number(row.eligibilityConfidence, 0))),
    evidenceQualityScore: Math.max(0, Math.min(100, number(row.evidenceQualityScore, source.score * 100))),
    strategicValueScore: Math.max(0, Math.min(100, number(row.strategicValueScore, row.relevanceScore))),
    effortScore: Math.max(0, Math.min(100, number(row.effortScore, 50))),
    riskLevel: clean(row.riskLevel || "unknown"),
    requiredDocuments: stringArray(row.requiredDocuments),
    proofGaps: stringArray(row.proofGaps),
    evidenceQuotes: stringArray(row.evidenceQuotes).slice(0, 8),
    recommendedNextAction: clean(row.recommendedNextAction || "Validate the authoritative source and launch preliminary qualification."),
    clusterKey: clean(row.clusterKey) || null,
    captureDecision: decision === "reject" ? "reject" : "capture",
    rejectionReason: clean(row.rejectionReason) || null,
  };
}

async function analyzeOpenRouter(secret: string, provider: AcCapitalProviderConfig, agent: AcCapitalAiAgent, query: string, sources: ExternalResearchSource[]) {
  if (!sources.length) throw new Error("AC_CAPITAL_TAVILY_NO_USABLE_SOURCES");
  const config = object(provider.config);
  const analysisConfig = object(agent.analysis_config);
  const model = clean(analysisConfig.model || provider.model_code || "openrouter/free");
  const sourcePayload = sources.map((source) => ({ title: source.title, url: source.url, score: source.score, content: source.content.slice(0, 3500) }));
  const prompt = [
    `AC CAPITAL OS agent: ${agent.name}`,
    `Research command: ${query}`,
    `Agent doctrine: ${agent.prompt_doctrine}`,
    "Analyze only the supplied public source evidence. Never invent a URL, program, amount, deadline, eligibility rule, investor thesis or status.",
    "Each captured or rejected opportunity must reference one exact sourceUrl from the evidence list.",
    "Keep all external actions disabled. Produce internal intelligence only.",
    "Return at most 10 opportunity candidates and at most 20 rejected signals. Keep every text field concise.",
    "Extract organization, application URL/status, evidence quotes, required documents, proof gaps, next action and explainable scores only when the supplied evidence supports them.",
    "Use clusterKey to group pages that describe the same program. Return one complete JSON object only, with no Markdown or commentary outside JSON.",
    `Evidence: ${JSON.stringify(sourcePayload)}`,
  ].join("\n");
  const baseBody: JsonRecord = {
    model,
    messages: [
      { role: "system", content: "You are the AC CAPITAL OS external intelligence analyst. Return evidence-bound structured JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: Math.max(0, Math.min(1.5, number(analysisConfig.temperature ?? config.temperature, 0.1))),
    max_tokens: Math.max(500, Math.min(12000, number(analysisConfig.maxOutputTokens || config.maxOutputTokens, 4500))),
    stream: false,
    plugins: [{ id: "response-healing" }],
    provider: { require_parameters: true, allow_fallbacks: true },
    response_format: { type: "json_schema", json_schema: { name: "ac_capital_external_research", strict: true, schema: opportunitySchema } },
  };
  const headers = {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
    "HTTP-Referer": clean(config.httpReferer || "http://localhost:3000"),
    "X-Title": clean(config.appTitle || "AngelCare AC Capital OS"),
    "X-OpenRouter-Metadata": "enabled",
  };
  const timeoutMs = number(config.timeoutMs, 90000);
  const retries = Math.max(0, number(object(agent.failure_policy).maxRetries, number(config.maxRetries, 1)));
  let response;
  try {
    response = await withRetry(() => fetchJson(provider.endpoint, { method: "POST", headers, body: JSON.stringify(baseBody) }, timeoutMs), retries, 1200);
  } catch (error) {
    if (!bool(analysisConfig.allowJsonFallback ?? config.allowJsonFallback, true)) throw error;
    const fallbackBody = { ...baseBody, provider: { allow_fallbacks: true }, response_format: { type: "json_object" } };
    response = await withRetry(() => fetchJson(provider.endpoint, { method: "POST", headers, body: JSON.stringify(fallbackBody) }, timeoutMs), retries, 1200);
  }
  const choice = object((Array.isArray(response.payload.choices) ? response.payload.choices[0] : null));
  if (choice.error) throw new Error(errorText(choice.error, response.response.status));
  const message = object(choice.message);
  const parsed = strictJson(message.content);
  const sourceByUrl = new Map(sources.map((source) => [source.url, source]));
  const opportunities = (Array.isArray(parsed.opportunities) ? parsed.opportunities : []).map((row) => normalizeOpportunity(row, sourceByUrl)).filter(Boolean) as ExternalResearchOpportunity[];
  const explicitRejections = (Array.isArray(parsed.rejectedSignals) ? parsed.rejectedSignals : []).map((raw) => {
    const row = object(raw);
    const url = validUrl(row.sourceUrl);
    return { title: clean(row.title || "Rejected signal"), reason: clean(row.reason || "Rejected by analysis policy."), sourceTitle: clean(row.sourceTitle) || null, sourceUrl: url };
  });
  const minimumRelevance = Math.max(0, Math.min(100, number(analysisConfig.minimumRelevanceScore, 0)));
  const maximumOpportunities = Math.max(0, Math.min(100, number(analysisConfig.maximumOpportunitiesPerRun, 20)));
  const rejectedFromOpportunities = opportunities.filter((item) => item.captureDecision === "reject" || item.relevanceScore < minimumRelevance).map((item) => ({ title: item.title, reason: item.captureDecision === "reject" ? (item.rejectionReason || "Rejected by analysis policy.") : `Below configured relevance threshold (${item.relevanceScore} < ${minimumRelevance}).`, sourceTitle: item.sourceTitle, sourceUrl: item.sourceUrl }));
  const accepted = opportunities.filter((item) => item.captureDecision === "capture" && item.relevanceScore >= minimumRelevance).sort((left, right) => right.relevanceScore - left.relevanceScore).slice(0, maximumOpportunities);
  const usage = object(response.payload.usage);
  const analysis: ExternalResearchAnalysis = {
    summary: clean(parsed.summary || `Analyzed ${sources.length} public sources.`),
    confidence: Math.max(0, Math.min(100, number(parsed.confidence, accepted.length ? 65 : 0))),
    opportunities: accepted,
    rejectedSignals: [...explicitRejections, ...rejectedFromOpportunities],
    marketSignals: stringArray(parsed.marketSignals),
    risks: stringArray(parsed.risks),
    nextActions: stringArray(parsed.nextActions),
  };
  return {
    analysis,
    requestId: clean(response.payload.id) || null,
    selectedModel: clean(response.payload.model || model),
    inputTokens: number(usage.prompt_tokens || usage.input_tokens, 0),
    outputTokens: number(usage.completion_tokens || usage.output_tokens, 0),
    latencyMs: response.latencyMs,
    httpStatus: response.response.status,
    metadata: object(response.payload.openrouter_metadata),
  };
}

async function ledger(supabase: SupabaseAny, row: JsonRecord) {
  const result = await supabase.from("ac_capital_ai_usage_ledger").insert(row);
  if (result.error) console.error("AC_CAPITAL_AI_USAGE_LEDGER_FAILED", result.error.message);
}

async function updateRun(supabase: SupabaseAny, runId: string, payload: JsonRecord) {
  const result = await supabase.from("ac_capital_ai_agent_runs").update({ ...payload, updated_at: now() }).eq("id", runId).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function executeExternalResearchAgent(input: {
  agentKey: string;
  query: string;
  triggerType?: "manual" | "scheduled";
  actorId?: string | null;
}): Promise<ExternalResearchExecution> {
  const supabase = await createServiceClient() as SupabaseAny;
  const triggerType = input.triggerType || "manual";
  const runtimeState = await loadRuntimeState(supabase);
  await enforceConcurrency(supabase, runtimeState);
  const agent = await loadAgent(supabase, input.agentKey, triggerType);
  const query = clean(input.query).slice(0, 2000);
  if (!query) throw new Error("AC_CAPITAL_RESEARCH_QUERY_REQUIRED");
  const [{ provider: tavily, secret: tavilySecret }, { provider: openrouter, secret: openRouterSecret }] = await Promise.all([
    loadProvider(supabase, "tavily"),
    loadProvider(supabase, "openrouter"),
  ]);
  const maxSearches = Math.max(1, Math.min(10, number(object(agent.search_config).maxSearchesPerRun, 1)));
  await enforceBudgets(supabase, agent, tavily, openrouter, maxSearches);

  const runResult = await supabase.from("ac_capital_ai_agent_runs").insert({
    agent_id: agent.id,
    agent_key: agent.agent_key,
    trigger_type: triggerType,
    status: "running",
    phase: "search",
    research_query: query,
    search_provider_key: "tavily",
    analysis_provider_key: "openrouter",
    configuration_snapshot: { agent, tavily: { ...tavily, credential_id: tavily.credential_id ? "configured" : null }, openrouter: { ...openrouter, credential_id: openrouter.credential_id ? "configured" : null } },
    actor_id: input.actorId || null,
    started_at: now(),
  }).select("*").single();
  if (runResult.error) throw new Error(runResult.error.message);
  const runId = String(runResult.data.id);

  try {
    const search = await searchTavily(tavilySecret, tavily, agent, query);
    await ledger(supabase, {
      run_id: runId, provider_key: "tavily", agent_key: agent.agent_key, command_code: "AC_CAPITAL_EXTERNAL_SEARCH",
      request_count: search.requestIds.length || 1, credits_consumed: search.credits, input_tokens: 0, output_tokens: 0,
      latency_ms: search.latencyMs, http_status: search.httpStatus, outcome: "completed", provider_request_id: search.requestIds.join(","),
      metadata: { queryVariants: search.searchQueries, sourceCount: search.sources.length },
    });
    await updateRun(supabase, runId, {
      phase: "analysis", search_request_id: search.requestIds.join(",") || null, search_http_status: search.httpStatus,
      search_latency_ms: search.latencyMs, tavily_credits: search.credits, sources_returned: search.sources.length,
      provider_evidence: { tavily: { requestIds: search.requestIds, queryVariants: search.searchQueries } },
    });
    const analysis = await analyzeOpenRouter(openRouterSecret, openrouter, agent, query, search.sources);
    await ledger(supabase, {
      run_id: runId, provider_key: "openrouter", agent_key: agent.agent_key, command_code: "AC_CAPITAL_EXTERNAL_ANALYSIS",
      request_count: 1, credits_consumed: 0, input_tokens: analysis.inputTokens, output_tokens: analysis.outputTokens,
      latency_ms: analysis.latencyMs, http_status: analysis.httpStatus, outcome: "completed", provider_request_id: analysis.requestId,
      selected_model: analysis.selectedModel, metadata: { sourceCount: search.sources.length, opportunityCount: analysis.analysis.opportunities.length, openrouterMetadata: analysis.metadata },
    });
    await updateRun(supabase, runId, {
      status: "completed", phase: "persistence-pending", analysis_request_id: analysis.requestId,
      selected_analysis_model: analysis.selectedModel, analysis_http_status: analysis.httpStatus, analysis_latency_ms: analysis.latencyMs,
      input_tokens: analysis.inputTokens, output_tokens: analysis.outputTokens,
      opportunities_created: 0, opportunities_rejected: analysis.analysis.rejectedSignals.length,
      result_payload: { summary: analysis.analysis.summary, confidence: analysis.analysis.confidence, sources: search.sources, opportunities: analysis.analysis.opportunities, rejectedSignals: analysis.analysis.rejectedSignals, marketSignals: analysis.analysis.marketSignals, risks: analysis.analysis.risks, nextActions: analysis.analysis.nextActions },
      provider_evidence: { tavily: { requestIds: search.requestIds, queryVariants: search.searchQueries }, openrouter: { requestId: analysis.requestId, selectedModel: analysis.selectedModel, metadata: analysis.metadata } },
      finished_at: now(),
    });
    await supabase.from("ac_capital_ai_agents").update({ last_run_at: now(), last_success_at: now(), consecutive_failures: 0, updated_at: now() }).eq("id", agent.id);
    return {
      runId, agent, searchProvider: "tavily", analysisProvider: "openrouter", selectedAnalysisModel: analysis.selectedModel,
      tavilyRequestId: search.requestIds.join(",") || null, openRouterRequestId: analysis.requestId,
      tavilyCredits: search.credits, searchQueries: search.searchQueries, inputTokens: analysis.inputTokens, outputTokens: analysis.outputTokens,
      searchLatencyMs: search.latencyMs, analysisLatencyMs: analysis.latencyMs, sources: search.sources, analysis: analysis.analysis,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = Number(message.match(/\b(400|401|403|404|408|409|429|5\d\d)\b/)?.[1] || 0) || null;
    await updateRun(supabase, runId, { status: "failed", phase: "failed", error_code: message.slice(0, 180), error_message: message.slice(0, 3000), finished_at: now() }).catch(() => null);
    const nextFailureCount = Number(agent.consecutive_failures || 0) + 1;
    const suspendAfter = Math.max(1, number(object(agent.failure_policy).suspendAfterFailures, 4));
    await supabase.from("ac_capital_ai_agents").update({ last_run_at: now(), last_failure_at: now(), consecutive_failures: nextFailureCount, status: nextFailureCount >= suspendAfter ? "paused" : agent.status, next_run_at: nextFailureCount >= suspendAfter ? null : agent.next_run_at, updated_at: now() }).eq("id", agent.id);
    const providerKey = /TAVILY|search/i.test(message) ? "tavily" : "openrouter";
    await ledger(supabase, { run_id: runId, provider_key: providerKey, agent_key: agent.agent_key, command_code: "AC_CAPITAL_EXTERNAL_RESEARCH", request_count: 1, credits_consumed: 0, input_tokens: 0, output_tokens: 0, http_status: status, outcome: "failed", error_code: message.slice(0, 180), metadata: { message: message.slice(0, 1000) } });
    await supabase.from("ac_capital_ai_runtime_incidents").insert({ incident_key: `run-${runId}`, provider_key: providerKey, agent_key: agent.agent_key, severity: status === 401 || status === 403 ? "critical" : "warning", status: "open", title: `Provider execution failed for ${agent.name}`, description: message.slice(0, 2000), evidence: { runId, status } });
    throw error;
  }
}

export async function executeOpenRouterReport(input: {
  reportType: string;
  audience: string;
  purpose: string;
  sections: string[];
  sourceWorkspaces: string[];
  context: JsonRecord;
  actorId?: string | null;
}) {
  const supabase = await createServiceClient() as SupabaseAny;
  const runtimeState = await loadRuntimeState(supabase);
  await enforceConcurrency(supabase, runtimeState);
  const agent = await loadAgent(supabase, "executive-report-agent", "manual");
  const { provider, secret } = await loadProvider(supabase, "openrouter");
  const agentQuota = object(agent.quota_config);
  const providerLimits = object(provider.internal_limits);
  const [agentDay, agentWeek, agentMonth, providerDay, providerMonth] = await Promise.all([
    runCount(supabase, agent.agent_key, periodStart("day")),
    runCount(supabase, agent.agent_key, periodStart("week")),
    runCount(supabase, agent.agent_key, periodStart("month")),
    usageTotal(supabase, "openrouter", "request_count", periodStart("day")),
    usageTotal(supabase, "openrouter", "request_count", periodStart("month")),
  ]);
  if (agentDay >= number(agentQuota.maxRunsPerDay, 2)) throw new Error("AC_CAPITAL_REPORT_AGENT_DAILY_RUN_LIMIT");
  if (agentWeek >= number(agentQuota.maxRunsPerWeek, 5)) throw new Error("AC_CAPITAL_REPORT_AGENT_WEEKLY_RUN_LIMIT");
  if (agentMonth >= number(agentQuota.maxRunsPerMonth, 20)) throw new Error("AC_CAPITAL_REPORT_AGENT_MONTHLY_RUN_LIMIT");
  if (providerDay + 1 > number(providerLimits.maxRequestsPerDay, 40)) throw new Error("AC_CAPITAL_OPENROUTER_DAILY_INTERNAL_LIMIT");
  if (providerMonth + 1 > number(providerLimits.maxRequestsPerMonth, 1000)) throw new Error("AC_CAPITAL_OPENROUTER_MONTHLY_INTERNAL_LIMIT");

  const config = object(provider.config);
  const analysisConfig = object(agent.analysis_config);
  const model = clean(analysisConfig.model || provider.model_code || "openrouter/free");
  const schema = {
    type: "object",
    properties: {
      executiveSummary: { type: "string" },
      sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" }, readiness: { type: "string" }, missingData: { type: "array", items: { type: "string" } }, riskFlags: { type: "array", items: { type: "string" } }, sourceWorkspaces: { type: "array", items: { type: "string" } } }, required: ["title", "content", "readiness", "missingData", "riskFlags", "sourceWorkspaces"], additionalProperties: false } },
      missingData: { type: "array", items: { type: "string" } }, riskFlags: { type: "array", items: { type: "string" } }, nextActions: { type: "array", items: { type: "string" } }, confidence: { type: "number" }, requiresHumanApproval: { type: "boolean" },
    },
    required: ["executiveSummary", "sections", "missingData", "riskFlags", "nextActions", "confidence", "requiresHumanApproval"], additionalProperties: false,
  };
  const prompt = [
    `Compose ${input.reportType} for AC CAPITAL OS.`, `Audience: ${input.audience}`, `Purpose: ${input.purpose}`,
    `Required sections: ${input.sections.join(" | ")}`, `Source workspaces: ${input.sourceWorkspaces.join(", ")}`,
    agent.prompt_doctrine,
    "Use only the supplied internal record snapshot. Never invent facts. External release remains human-controlled.",
    JSON.stringify(input.context),
  ].join("\n");
  const runResult = await supabase.from("ac_capital_ai_agent_runs").insert({
    agent_id: agent.id,
    agent_key: agent.agent_key,
    trigger_type: "manual",
    status: "running",
    phase: "analysis",
    research_query: `${input.reportType}: ${input.purpose}`,
    search_provider_key: null,
    analysis_provider_key: "openrouter",
    configuration_snapshot: { reportType: input.reportType, audience: input.audience, sections: input.sections, provider: { provider_key: provider.provider_key, model_code: model } },
    actor_id: input.actorId || null,
    started_at: now(),
  }).select("*").single();
  if (runResult.error) throw new Error(runResult.error.message);
  const runId = String(runResult.data.id);
  try {
    const result = await fetchJson(provider.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", "HTTP-Referer": clean(config.httpReferer || "http://localhost:3000"), "X-Title": clean(config.appTitle || "AngelCare AC Capital OS"), "X-OpenRouter-Metadata": "enabled" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: "You are the AC CAPITAL OS Executive Reporting Director. Return strict evidence-bound JSON." }, { role: "user", content: prompt }],
        temperature: number(analysisConfig.temperature ?? config.temperature, 0.1),
        max_tokens: number(analysisConfig.maxOutputTokens || config.maxOutputTokens, 5000),
        stream: false,
        plugins: [{ id: "response-healing" }],
        provider: { require_parameters: true, allow_fallbacks: true },
        response_format: { type: "json_schema", json_schema: { name: "ac_capital_report", strict: true, schema } },
      }),
    }, number(config.timeoutMs, 90000));
    const choice = object((Array.isArray(result.payload.choices) ? result.payload.choices[0] : null));
    const parsed = strictJson(object(choice.message).content);
    const usage = object(result.payload.usage);
    const responseId = clean(result.payload.id) || null;
    const selectedModel = clean(result.payload.model || model);
    const inputTokens = number(usage.prompt_tokens || usage.input_tokens);
    const outputTokens = number(usage.completion_tokens || usage.output_tokens);
    await ledger(supabase, {
      run_id: runId,
      provider_key: "openrouter",
      agent_key: agent.agent_key,
      command_code: "AC_CAPITAL_REPORT_COMPOSE_FREE",
      request_count: 1,
      credits_consumed: 0,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      latency_ms: result.latencyMs,
      http_status: result.response.status,
      outcome: "completed",
      provider_request_id: responseId,
      selected_model: selectedModel,
      metadata: { reportType: input.reportType, sourceWorkspaces: input.sourceWorkspaces },
    });
    await updateRun(supabase, runId, {
      status: "completed",
      phase: "completed",
      analysis_request_id: responseId,
      selected_analysis_model: selectedModel,
      analysis_http_status: result.response.status,
      analysis_latency_ms: result.latencyMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      internal_actions: { generateReports: { allowed: true, executed: 1, status: "draft-human-review" }, externalActions: { allowed: false, executed: 0, status: "permanently-locked" } },
      result_payload: parsed,
      finished_at: now(),
    });
    await supabase.from("ac_capital_ai_agents").update({ last_run_at: now(), last_success_at: now(), consecutive_failures: 0, updated_at: now() }).eq("id", agent.id);
    return {
      executiveSummary: clean(parsed.executiveSummary),
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      missingData: stringArray(parsed.missingData),
      riskFlags: stringArray(parsed.riskFlags),
      nextActions: stringArray(parsed.nextActions),
      confidence: Math.max(0, Math.min(100, number(parsed.confidence))),
      requiresHumanApproval: true,
      providerResponseId: responseId,
      providerModelVersion: selectedModel,
      inputTokens,
      outputTokens,
      latencyMs: result.latencyMs,
      freeProviderRunId: runId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = Number(message.match(/\b(400|401|403|404|408|409|429|5\d\d)\b/)?.[1] || 0) || null;
    await updateRun(supabase, runId, { status: "failed", phase: "failed", error_code: message.slice(0, 180), error_message: message.slice(0, 3000), finished_at: now() }).catch(() => null);
    await ledger(supabase, { run_id: runId, provider_key: "openrouter", agent_key: agent.agent_key, command_code: "AC_CAPITAL_REPORT_COMPOSE_FREE", request_count: 1, credits_consumed: 0, input_tokens: 0, output_tokens: 0, http_status: status, outcome: "failed", error_code: message.slice(0, 180), metadata: { message: message.slice(0, 1000) } });
    await supabase.from("ac_capital_ai_runtime_incidents").insert({ incident_key: `report-${runId}`, provider_key: "openrouter", agent_key: agent.agent_key, severity: status === 401 || status === 403 ? "critical" : "warning", status: "open", title: `Report provider execution failed for ${agent.name}`, description: message.slice(0, 2000), evidence: { runId, status } });
    throw error;
  }
}
