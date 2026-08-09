"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  Gauge,
  Globe2,
  KeyRound,
  LockKeyhole,
  Pause,
  Play,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Workflow,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { Field } from "../../core/FormParts";
import { Drawer } from "../../core/Overlay";
import { PrimaryButton, SecondaryButton, SectionHeading, TruthChip } from "../../core/WorkspaceParts";
import { getEnvelope, postEnvelope } from "../../core/api";
import type { ApiEnvelope, CapitalActor } from "../../core/types";
import type { AcCapitalAiAgent, AcCapitalAiControlSnapshot, AcCapitalProviderConfig, JsonRecord } from "@/lib/ac-capital-os/server/free-provider-types";
import styles from "./ai-operations.module.css";

type Tab = "overview" | "providers" | "agents" | "profiles" | "activity";
type ProviderKey = "tavily" | "openrouter";

type AgentDraft = {
  agentKey: string;
  name: string;
  description: string;
  category: string;
  status: string;
  triggerMode: string;
  frequencyKey: string;
  schedule: JsonRecord;
  searchConfig: JsonRecord;
  analysisConfig: JsonRecord;
  quotaConfig: JsonRecord;
  actionPermissions: JsonRecord;
  promptDoctrine: string;
  failurePolicy: JsonRecord;
};

const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const text = (value: unknown) => String(value ?? "");
const array = (value: unknown) => Array.isArray(value) ? value.map(String) : [];
const formatNumber = (value: unknown) => new Intl.NumberFormat("fr-FR").format(number(value));
const formatDate = (value: unknown) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(String(value))) : "—";
const jsonList = (value: unknown) => array(value).join(", ");
const parseList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const records = (value: unknown): JsonRecord[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is JsonRecord =>
          Boolean(item)
          && typeof item === "object"
          && !Array.isArray(item),
      )
    : [];

const pretty = (value: unknown) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return text(value);
  }
};

// AC_CAPITAL_EXECUTION_INSPECTOR_01

function statusTone(value: unknown) {
  const status = text(value).toLowerCase();
  if (["healthy", "active", "completed", "operating", "resolved"].includes(status)) return styles.good;
  if (["paused", "stored-not-tested", "running", "queued", "warning"].includes(status)) return styles.warn;
  if (["failed", "disabled", "blocked", "critical", "open"].includes(status)) return styles.bad;
  return styles.neutral;
}

function providerDraft(provider: AcCapitalProviderConfig) {
  return {
    endpoint: provider.endpoint,
    modelCode: provider.model_code || "",
    config: { ...object(provider.config) },
    internalLimits: { ...object(provider.internal_limits) },
  };
}

function agentDraft(agent: AcCapitalAiAgent): AgentDraft {
  return {
    agentKey: agent.agent_key,
    name: agent.name,
    description: agent.description || "",
    category: agent.category,
    status: agent.status,
    triggerMode: agent.trigger_mode,
    frequencyKey: agent.frequency_key,
    schedule: { ...object(agent.schedule) },
    searchConfig: { ...object(agent.search_config) },
    analysisConfig: { ...object(agent.analysis_config) },
    quotaConfig: { ...object(agent.quota_config) },
    actionPermissions: { ...object(agent.action_permissions), externalActions: false },
    promptDoctrine: agent.prompt_doctrine,
    failurePolicy: { ...object(agent.failure_policy) },
  };
}

const permissionLabels: Array<[string, string]> = [
  ["captureSources", "Capture source records"],
  ["createOpportunities", "Create opportunity candidates"],
  ["rejectWeakCandidates", "Reject weak candidates"],
  ["detectDuplicates", "Detect and link duplicates"],
  ["runInitialQualification", "Run initial qualification"],
  ["createQualificationDossiers", "Create qualification dossiers"],
  ["draftCases", "Draft fundraising cases"],
  ["updatePipeline", "Update pipeline stages"],
  ["createInternalTasks", "Create internal tasks"],
  ["generateReports", "Generate internal reports"],
  ["refreshExistingOpportunities", "Refresh existing opportunities"],
  ["archiveExpiredOpportunities", "Archive expired opportunities"],
  ["escalateCriticalDeadlines", "Escalate critical deadlines"],
];

export function AiOperationsPage({ actor }: { actor: CapitalActor }) {
  const [envelope, setEnvelope] = useState<ApiEnvelope<AcCapitalAiControlSnapshot> | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [providerSecrets, setProviderSecrets] = useState<Record<ProviderKey, string>>({ tavily: "", openrouter: "" });
  const [providerEdits, setProviderEdits] = useState<Record<string, ReturnType<typeof providerDraft>>>({});
  const [selectedAgent, setSelectedAgent] = useState<AgentDraft | null>(null);
  const [selectedRun, setSelectedRun] = useState<JsonRecord | null>(null);
  const [manualQuery, setManualQuery] = useState<Record<string, string>>({});
  const snapshot = envelope?.data || null;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await getEnvelope<AcCapitalAiControlSnapshot>("/api/ac-capital-os/ai-control");
      setEnvelope(next);
      setProviderEdits(Object.fromEntries(next.data.providers.map((provider) => [provider.provider_key, providerDraft(provider)])));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const state = object(snapshot?.runtimeState);
    if (!state.scheduler_enabled || state.global_pause) return;
    const minutes = Math.max(1, number(state.scheduler_poll_minutes, 15));
    const id = window.setInterval(() => {
      void postEnvelope("/api/ac-capital-os/ai-control/scheduler/tick", {}).then(() => refresh()).catch(() => null);
    }, minutes * 60_000);
    return () => window.clearInterval(id);
  }, [snapshot?.runtimeState, refresh]);

  async function action(actionKey: string, payload: JsonRecord, successMessage: string) {
    setBusy(actionKey);
    setMessage("");
    setError("");
    try {
      await postEnvelope("/api/ac-capital-os/ai-control", { action: actionKey, payload });
      setMessage(successMessage);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy("");
    }
  }

  const runtime = object(snapshot?.runtimeState);
  const providers = snapshot?.providers || [];
  const agents = snapshot?.agents || [];
  const profiles = snapshot?.profiles || [];
  const runs = snapshot?.runs || [];
  const usage = snapshot?.usage || [];
  const incidents = snapshot?.incidents || [];
  const activeProfile = profiles.find((profile) => Boolean(profile.active));
  const providerReady = providers.filter((provider) => provider.enabled && !provider.paused && provider.health_status === "healthy").length;
  const insights = [
    { label: "Provider route", value: "Tavily search → OpenRouter free analysis" },
    { label: "Runtime agents", value: `${snapshot?.rollups.activeAgents || 0} active · ${snapshot?.rollups.pausedAgents || 0} paused` },
    { label: "Operating profile", value: text(activeProfile?.label || runtime.active_profile_key || "Not selected") },
    { label: "External action boundary", value: "Permanently locked" },
  ];

  async function saveProvider(provider: AcCapitalProviderConfig) {
    const draft = providerEdits[provider.provider_key] || providerDraft(provider);
    await action("save_provider_config", { providerKey: provider.provider_key, endpoint: draft.endpoint, modelCode: draft.modelCode, config: draft.config, internalLimits: draft.internalLimits }, `${provider.display_name} configuration saved and enforced.`);
  }

  async function saveAgent() {
    if (!selectedAgent) return;
    await action("save_agent", selectedAgent, `${selectedAgent.name} configuration saved.`);
    setSelectedAgent(null);
  }

  async function runAgent(agent: AcCapitalAiAgent) {
    const query = (manualQuery[agent.agent_key] || text(object(agent.search_config).scheduledQuery) || `${agent.name}: find current public external intelligence relevant to AngelCare.`).trim();
    if (!query) { setError("A research query is required."); return; }
    await action("run_agent", { agentKey: agent.agent_key, query }, `${agent.name} completed its provider workflow.`);
  }

  async function runDueAgents() {
    setBusy("scheduler_tick");
    setMessage("");
    setError("");
    try {
      const result = await postEnvelope<{ executed?: JsonRecord[]; skipped?: string }>("/api/ac-capital-os/ai-control/scheduler/tick", {});
      const executed = Array.isArray(result.data.executed) ? result.data.executed.length : 0;
      setMessage(result.data.skipped ? `Scheduler did not execute: ${result.data.skipped}` : `${executed} due agent(s) processed.`);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy("");
    }
  }

  const tabs: Array<[Tab, string, typeof Activity]> = [
    ["overview", "Operations", Gauge],
    ["providers", "Providers", KeyRound],
    ["agents", "Outbound Agents", Bot],
    ["profiles", "Intensity Profiles", SlidersHorizontal],
    ["activity", "Usage & Activity", Activity],
  ];

  return <AcCapitalShell actor={actor} workspaceKey="ai-operations" title="AC Capital AI Operations" subtitle="Writable control plane for Tavily external research, OpenRouter free analysis, outbound agent frequencies, quotas, permissions, profiles, execution evidence and internal automation." envelope={envelope} insights={insights} primaryAction="Run Due Agents" onPrimaryAction={() => void runDueAgents()}>
    <section className={styles.hero}>
      <div>
        <span><Sparkles size={15}/> FREE EXTERNAL INTELLIGENCE CONTROL PLANE</span>
        <h2>Control what researches, how often it researches, what it may create, and exactly how much free capacity it may consume.</h2>
        <p>This workspace is authoritative for AC Capital outbound public-data agents. Tavily retrieves evidence; OpenRouter analyzes it. Gemini and SearXNG are excluded. External communication and submission remain locked.</p>
        <div className={styles.heroActions}>
          <PrimaryButton onClick={() => setTab("providers")}>Configure providers</PrimaryButton>
          <SecondaryButton onClick={() => setTab("agents")}>Control agents</SecondaryButton>
          <SecondaryButton onClick={() => void refresh()} disabled={loading}><RefreshCw size={15}/> Refresh truth</SecondaryButton>
        </div>
      </div>
      <aside className={styles.heroStatus}>
        <div className={providerReady === 2 ? styles.orbitGood : styles.orbitWarn}><Globe2/></div>
        <strong>{providerReady}/2</strong>
        <span>providers operational</span>
        <TruthChip kind="safe">Public external data only</TruthChip>
      </aside>
    </section>

    <section className={styles.tabBar}>
      {tabs.map(([key, label, Icon]) => <button key={key} className={tab === key ? styles.activeTab : ""} onClick={() => setTab(key)}><Icon size={16}/>{label}</button>)}
    </section>

    {message || error ? <section className={`${styles.feedback} ${error ? styles.feedbackError : styles.feedbackSuccess}`}><strong>{error ? "Operation failed" : "Operation completed"}</strong><span>{error || message}</span><button onClick={() => { setMessage(""); setError(""); }}>×</button></section> : null}

    {loading && !snapshot ? <section className={styles.loading}><RefreshCw className={styles.spin}/><strong>Loading live AI operations configuration…</strong></section> : null}

    {snapshot && tab === "overview" ? <>
      <section className={styles.metrics}>
        <article><Bot/><span>Active agents</span><strong>{snapshot.rollups.activeAgents}</strong><small>{snapshot.rollups.pausedAgents} paused</small></article>
        <article><Search/><span>Tavily today</span><strong>{formatNumber(snapshot.rollups.tavilyCreditsToday)}</strong><small>{formatNumber(snapshot.rollups.tavilyCreditsMonth)} credits this month</small></article>
        <article><Workflow/><span>OpenRouter today</span><strong>{formatNumber(snapshot.rollups.openRouterRequestsToday)}</strong><small>{formatNumber(snapshot.rollups.openRouterRequestsMonth)} requests this month</small></article>
        <article><AlertTriangle/><span>Failures today</span><strong>{snapshot.rollups.failedToday}</strong><small>{incidents.filter((row) => row.status === "open").length} open incidents</small></article>
      </section>

      <section className={styles.controlGrid}>
        <div className={styles.panel}>
          <SectionHeading eyebrow="Runtime Authority" title="Automation and scheduler" copy="These values are read before execution. Changes take effect without rebuilding or redeploying."/>
          <div className={styles.switchRows}>
            <label><div><strong>Internal automation</strong><span>Allow configured agents to search, analyze and execute permitted internal actions.</span></div><input type="checkbox" checked={Boolean(runtime.internal_automation_enabled)} onChange={(event) => void action("save_runtime_state", { internalAutomationEnabled: event.target.checked }, "Internal automation state updated.")}/></label>
            <label><div><strong>Scheduler enabled</strong><span>Permit due scheduled agents to execute through the scheduler tick.</span></div><input type="checkbox" checked={Boolean(runtime.scheduler_enabled)} onChange={(event) => void action("save_runtime_state", { schedulerEnabled: event.target.checked }, "Scheduler state updated.")}/></label>
            <label><div><strong>Global pause</strong><span>Immediately block all AC Capital AI agent executions.</span></div><input type="checkbox" checked={Boolean(runtime.global_pause)} onChange={(event) => void action("save_runtime_state", { globalPause: event.target.checked }, "Global pause state updated.")}/></label>
            <label className={styles.lockedSwitch}><div><strong>External actions</strong><span>Outreach, submission, communication and public release.</span></div><LockKeyhole/><b>LOCKED</b></label>
          </div>
          <div className={styles.runtimeFields}>
            <Field label="Scheduler poll minutes"><input type="number" min={1} max={1440} value={number(runtime.scheduler_poll_minutes, 15)} onChange={(event) => setEnvelope((current) => current ? { ...current, data: { ...current.data, runtimeState: { ...object(current.data.runtimeState), scheduler_poll_minutes: Number(event.target.value) } } } : current)}/></Field>
            <Field label="Maximum parallel runs"><input type="number" min={1} max={20} value={number(runtime.max_parallel_runs, 1)} onChange={(event) => setEnvelope((current) => current ? { ...current, data: { ...current.data, runtimeState: { ...object(current.data.runtimeState), max_parallel_runs: Number(event.target.value) } } } : current)}/></Field>
            <Field label="Timezone"><input value={text(runtime.timezone || "Africa/Casablanca")} onChange={(event) => setEnvelope((current) => current ? { ...current, data: { ...current.data, runtimeState: { ...object(current.data.runtimeState), timezone: event.target.value } } } : current)}/></Field>
          </div>
          <div className={styles.rowActions}><PrimaryButton disabled={busy === "save_runtime_state"} onClick={() => void action("save_runtime_state", { schedulerPollMinutes: runtime.scheduler_poll_minutes, maxParallelRuns: runtime.max_parallel_runs, timezone: runtime.timezone }, "Runtime controls saved.")}><Save size={15}/> Save runtime</PrimaryButton><SecondaryButton disabled={busy === "scheduler_tick"} onClick={() => void runDueAgents()}><Play size={15}/> Run due schedules now</SecondaryButton></div>
          <p className={styles.schedulerTruth}>While this page remains open, the local watchdog calls the scheduler at the configured interval. For unattended production execution, the same protected scheduler endpoint must be invoked by your deployment scheduler.</p>
        </div>

        <div className={styles.panel}>
          <SectionHeading eyebrow="Provider Chain" title="One explicit route, no hidden fallback"/>
          <div className={styles.chain}>
            {providers.map((provider, index) => <div key={provider.id}><article><span>{index + 1}</span><div><strong>{provider.display_name}</strong><small>{provider.provider_role === "search" ? "Public web evidence retrieval" : "Structured evidence analysis"}</small></div><b className={statusTone(provider.health_status)}>{provider.health_status}</b></article>{index < providers.length - 1 ? <i>↓</i> : null}</div>)}
            <article><span>3</span><div><strong>AC Capital database</strong><small>Sources, candidates, rejections, usage and audit evidence</small></div><b className={styles.good}>INTERNAL</b></article>
          </div>
          <div className={styles.truthBlock}><ShieldCheck/><div><strong>No provider ambiguity</strong><p>When Tavily fails, evidence retrieval fails truthfully. When OpenRouter fails, Tavily evidence remains visible but analysis is not falsely completed.</p></div></div>
        </div>
      </section>
    </> : null}

    {snapshot && tab === "providers" ? <section className={styles.providerSection}>
      <SectionHeading eyebrow="Writable Provider Configuration" title="Credentials, request behavior, internal ceilings and health" copy="Credentials are stored through the existing encrypted AI Provider Control vault. They are never returned to this page."/>
      <div className={styles.providerGrid}>{providers.map((provider) => {
        const draft = providerEdits[provider.provider_key] || providerDraft(provider);
        const config = object(draft.config);
        const limits = object(draft.internalLimits);
        const isTavily = provider.provider_key === "tavily";
        return <article key={provider.id} className={styles.providerCard}>
          <header><div className={styles.providerIcon}>{isTavily ? <Search/> : <Workflow/>}</div><div><span>{isTavily ? "SEARCH PROVIDER" : "ANALYSIS PROVIDER"}</span><h3>{provider.display_name}</h3></div><b className={statusTone(provider.health_status)}>{provider.health_status}</b></header>
          <p>{isTavily ? "Searches public web and news sources, returns ranked URLs and content evidence." : "Analyzes Tavily evidence and produces structured AC Capital opportunities, rejections, market signals and reports."}</p>
          <div className={styles.credentialBox}><KeyRound/><div><strong>{provider.credential_id ? "Credential stored" : "Credential required"}</strong><span>{provider.health_message || "Store, test and activate the provider key."}</span></div></div>
          <Field label={`New ${isTavily ? "Tavily" : "OpenRouter"} API key`}><input type="password" autoComplete="new-password" placeholder="Paste key to store securely" value={providerSecrets[provider.provider_key]} onChange={(event) => setProviderSecrets((current) => ({ ...current, [provider.provider_key]: event.target.value }))}/></Field>
          <div className={styles.rowActions}><SecondaryButton disabled={!providerSecrets[provider.provider_key] || busy === "store_provider_credential"} onClick={() => void action("store_provider_credential", { providerKey: provider.provider_key, secret: providerSecrets[provider.provider_key] }, `${provider.display_name} credential stored securely.`).then(() => setProviderSecrets((current) => ({ ...current, [provider.provider_key]: "" })))}><KeyRound size={15}/> Store key</SecondaryButton><PrimaryButton disabled={!provider.credential_id || busy === "test_provider"} onClick={() => void action("test_provider", { providerKey: provider.provider_key }, `${provider.display_name} tested, usage synchronized and activated.`)}><CheckCircle2 size={15}/> Test & activate</PrimaryButton></div>
          <div className={styles.providerForm}>
            <Field label="Endpoint"><input value={draft.endpoint} onChange={(event) => setProviderEdits((current) => ({ ...current, [provider.provider_key]: { ...draft, endpoint: event.target.value } }))}/></Field>
            <Field label="Request timeout (ms)"><input type="number" min={1000} value={number(config.timeoutMs, isTavily ? 30000 : 90000)} onChange={(event) => setProviderEdits((current) => ({ ...current, [provider.provider_key]: { ...draft, config: { ...config, timeoutMs: Number(event.target.value) } } }))}/></Field>
            <Field label="Retry count"><input type="number" min={0} max={5} value={number(config.maxRetries, 1)} onChange={(event) => setProviderEdits((current) => ({ ...current, [provider.provider_key]: { ...draft, config: { ...config, maxRetries: Number(event.target.value) } } }))}/></Field>
            {!isTavily ? <Field label="Model / router"><input value={draft.modelCode} onChange={(event) => setProviderEdits((current) => ({ ...current, [provider.provider_key]: { ...draft, modelCode: event.target.value } }))}/></Field> : null}
            {isTavily ? <>
              <Field label="Default search depth"><select value={text(config.searchDepth || "basic")} onChange={(event) => setProviderEdits((current) => ({ ...current, tavily: { ...draft, config: { ...config, searchDepth: event.target.value } } }))}><option value="basic">Basic · 1 credit</option><option value="advanced">Advanced · higher cost</option><option value="fast">Fast</option><option value="ultra-fast">Ultra fast</option></select></Field>
              <Field label="Default results/search"><input type="number" min={1} max={20} value={number(config.maxResults, 8)} onChange={(event) => setProviderEdits((current) => ({ ...current, tavily: { ...draft, config: { ...config, maxResults: Number(event.target.value) } } }))}/></Field>
              <Field label="Included domains"><input value={jsonList(config.includeDomains)} onChange={(event) => setProviderEdits((current) => ({ ...current, tavily: { ...draft, config: { ...config, includeDomains: parseList(event.target.value) } } }))}/></Field>
              <Field label="Excluded domains"><input value={jsonList(config.excludeDomains)} onChange={(event) => setProviderEdits((current) => ({ ...current, tavily: { ...draft, config: { ...config, excludeDomains: parseList(event.target.value) } } }))}/></Field>
              <Field label="Credits/day internal"><input type="number" min={0} value={number(limits.maxCreditsPerDay, 30)} onChange={(event) => setProviderEdits((current) => ({ ...current, tavily: { ...draft, internalLimits: { ...limits, maxCreditsPerDay: Number(event.target.value) } } }))}/></Field>
              <Field label="Credits/month internal"><input type="number" min={0} value={number(limits.maxCreditsPerMonth, 900)} onChange={(event) => setProviderEdits((current) => ({ ...current, tavily: { ...draft, internalLimits: { ...limits, maxCreditsPerMonth: Number(event.target.value) } } }))}/></Field>
              <Field label="Protected reserve"><input type="number" min={0} value={number(limits.reserveCredits, 100)} onChange={(event) => setProviderEdits((current) => ({ ...current, tavily: { ...draft, internalLimits: { ...limits, reserveCredits: Number(event.target.value) } } }))}/></Field>
            </> : <>
              <Field label="Max output tokens"><input type="number" min={100} value={number(config.maxOutputTokens, 4500)} onChange={(event) => setProviderEdits((current) => ({ ...current, openrouter: { ...draft, config: { ...config, maxOutputTokens: Number(event.target.value) } } }))}/></Field>
              <Field label="Temperature"><input type="number" min={0} max={2} step={0.05} value={number(config.temperature, 0.1)} onChange={(event) => setProviderEdits((current) => ({ ...current, openrouter: { ...draft, config: { ...config, temperature: Number(event.target.value) } } }))}/></Field>
              <Field label="Requests/day internal"><input type="number" min={0} value={number(limits.maxRequestsPerDay, 40)} onChange={(event) => setProviderEdits((current) => ({ ...current, openrouter: { ...draft, internalLimits: { ...limits, maxRequestsPerDay: Number(event.target.value) } } }))}/></Field>
              <Field label="Requests/month internal"><input type="number" min={0} value={number(limits.maxRequestsPerMonth, 1000)} onChange={(event) => setProviderEdits((current) => ({ ...current, openrouter: { ...draft, internalLimits: { ...limits, maxRequestsPerMonth: Number(event.target.value) } } }))}/></Field>
            </>}
          </div>
          <div className={styles.switchRows}><label><div><strong>Provider enabled</strong><span>Allow execution when healthy.</span></div><input type="checkbox" checked={provider.enabled} onChange={(event) => void action("save_provider_config", { providerKey: provider.provider_key, enabled: event.target.checked }, `${provider.display_name} enablement updated.`)}/></label><label><div><strong>Temporary pause</strong><span>Stop this provider without deleting its configuration.</span></div><input type="checkbox" checked={provider.paused} onChange={(event) => void action("save_provider_config", { providerKey: provider.provider_key, paused: event.target.checked }, `${provider.display_name} pause state updated.`)}/></label></div>
          <div className={styles.rowActions}><PrimaryButton disabled={busy === "save_provider_config"} onClick={() => void saveProvider(provider)}><Save size={15}/> Save provider</PrimaryButton><SecondaryButton disabled={!provider.credential_id || busy === "sync_provider_usage"} onClick={() => void action("sync_provider_usage", { providerKey: provider.provider_key }, `${provider.display_name} provider allowance synchronized.`)}><RefreshCw size={15}/> Sync usage</SecondaryButton></div>
          <details><summary>Provider allowance truth</summary><pre>{JSON.stringify(provider.provider_usage || {}, null, 2)}</pre></details>
        </article>;
      })}</div>
    </section> : null}

    {snapshot && tab === "agents" ? <section className={styles.agentSection}>
      <SectionHeading eyebrow="Outbound Agent Fleet" title="Frequency, doctrine, quotas and internal permissions" copy="Every run reads these persisted settings before contacting providers." action={<SecondaryButton onClick={() => setSelectedAgent({ agentKey: `custom-agent-${Date.now()}`, name: "New External Research Agent", description: "", category: "external-research", status: "paused", triggerMode: "both", frequencyKey: "daily", schedule: { days: [1,2,3,4,5], hour: 9, minute: 0, timezone: "Africa/Casablanca" }, searchConfig: { maxSearchesPerRun: 1, maxResultsPerSearch: 8, searchDepth: "basic", countries: ["Morocco"], recencyDays: 45 }, analysisConfig: { model: "openrouter/free", temperature: 0.1, maxOutputTokens: 4000, requireStructuredOutput: true, minimumRelevanceScore: 55, maximumOpportunitiesPerRun: 15 }, quotaConfig: { maxRunsPerDay: 1, maxRunsPerWeek: 5, maxRunsPerMonth: 20, maxTavilyCreditsPerRun: 1, maxOpenRouterRequestsPerRun: 1 }, actionPermissions: { captureSources: true, createOpportunities: true, rejectWeakCandidates: true, detectDuplicates: true, externalActions: false }, promptDoctrine: "Find current authoritative public evidence relevant to AngelCare. Never invent facts or URLs.", failurePolicy: { maxRetries: 1, cooldownMinutes: 60, suspendAfterFailures: 4 } })}>Create agent</SecondaryButton>}/>
      <div className={styles.agentGrid}>{agents.map((agent) => <article key={agent.id} className={styles.agentCard}>
        <header><div><span>{agent.category}</span><h3>{agent.name}</h3></div><b className={statusTone(agent.status)}>{agent.status}</b></header>
        <p>{agent.description}</p>
        <dl><div><dt>Trigger</dt><dd>{agent.trigger_mode}</dd></div><div><dt>Frequency</dt><dd>{agent.frequency_key}</dd></div><div><dt>Next run</dt><dd>{formatDate(agent.next_run_at)}</dd></div><div><dt>Failures</dt><dd>{agent.consecutive_failures}</dd></div></dl>
        <div className={styles.agentPermissions}>{permissionLabels.filter(([key]) => Boolean(object(agent.action_permissions)[key])).slice(0,5).map(([key,label]) => <span key={key}>{label}</span>)}</div>
        <Field label="Manual research command"><textarea rows={3} value={manualQuery[agent.agent_key] || ""} placeholder={text(object(agent.search_config).scheduledQuery || `${agent.name}: search current public intelligence`)} onChange={(event) => setManualQuery((current) => ({ ...current, [agent.agent_key]: event.target.value }))}/></Field>
        <div className={styles.rowActions}><PrimaryButton disabled={agent.status !== "active" || busy === "run_agent"} onClick={() => void runAgent(agent)}><Play size={15}/> Run now</PrimaryButton><SecondaryButton onClick={() => setSelectedAgent(agentDraft(agent))}><Settings2 size={15}/> Configure</SecondaryButton></div>
        <footer><button onClick={() => void action("set_agent_status", { agentKey: agent.agent_key, status: agent.status === "active" ? "paused" : "active" }, `${agent.name} status updated.`)}>{agent.status === "active" ? <><Pause size={14}/> Pause</> : <><Play size={14}/> Activate</>}</button><button onClick={() => { const key = window.prompt("New agent key", `${agent.agent_key}-copy`); if (key) void action("duplicate_agent", { agentKey: agent.agent_key, newAgentKey: key }, `${agent.name} duplicated.`); }}><Copy size={14}/> Duplicate</button><button disabled={agent.agent_key === "funding-opportunity-radar" || agent.agent_key === "executive-report-agent"} onClick={() => { if (window.confirm(`Delete ${agent.name}?`)) void action("delete_agent", { agentKey: agent.agent_key }, `${agent.name} deleted.`); }}><Trash2 size={14}/> Delete</button></footer>
      </article>)}</div>
    </section> : null}

    {snapshot && tab === "profiles" ? <section className={styles.profileSection}>
      <SectionHeading eyebrow="Operational Intensity" title="Switch the whole agent fleet without code changes" copy="Profiles activate their agent set, daily provider ceilings and concurrency policy immediately."/>
      <div className={styles.profileGrid}>{profiles.map((profile) => {
        const config = object(profile.configuration);
        return <article key={text(profile.id)} className={profile.active ? styles.profileActive : ""}><header><div><span>OPERATING PROFILE</span><h3>{text(profile.label)}</h3></div>{profile.active ? <b className={styles.good}>ACTIVE</b> : null}</header><p>{text(profile.description)}</p><dl><div><dt>Active agents</dt><dd>{array(config.activeAgentKeys).length}</dd></div><div><dt>Tavily/day</dt><dd>{formatNumber(config.tavilyCreditsPerDay)}</dd></div><div><dt>OpenRouter/day</dt><dd>{formatNumber(config.openrouterRequestsPerDay)}</dd></div><div><dt>Parallel</dt><dd>{formatNumber(config.maxParallelRuns)}</dd></div></dl><div className={styles.profileAgents}>{array(config.activeAgentKeys).map((key) => <span key={key}>{agents.find((agent) => agent.agent_key === key)?.name || key}</span>)}</div><PrimaryButton disabled={Boolean(profile.active) || busy === "activate_profile"} onClick={() => void action("activate_profile", { profileKey: profile.profile_key }, `${text(profile.label)} profile activated and enforced.`)}>{profile.active ? "Currently active" : "Activate profile"}</PrimaryButton></article>;
      })}</div>
    </section> : null}

    {snapshot && tab === "activity" ? <section className={styles.activitySection}>
      <SectionHeading eyebrow="Request & Usage Evidence" title="Every provider request, result, error and internal action" copy="Provider allowance and AngelCare internal usage are deliberately separated."/>
      <div className={styles.metrics}>
        <article><Search/><span>Tavily credits today</span><strong>{snapshot.rollups.tavilyCreditsToday}</strong><small>Internal ledger</small></article><article><Workflow/><span>OpenRouter requests today</span><strong>{snapshot.rollups.openRouterRequestsToday}</strong><small>Internal ledger</small></article><article><CheckCircle2/><span>Completed today</span><strong>{snapshot.rollups.completedToday}</strong><small>Agent runs</small></article><article><XCircle/><span>Failed today</span><strong>{snapshot.rollups.failedToday}</strong><small>Agent runs</small></article>
      </div>
      <div className={styles.panel}>
        <h3>Execution runs</h3>

        <p className={styles.tableHint}>
          Select any run to inspect provider requests, sources,
          analysis, internal actions and errors.
        </p>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Started</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Providers</th>
                <th>Actual model</th>
                <th>Evidence</th>
                <th>Error</th>
                <th>Inspect</th>
              </tr>
            </thead>

            <tbody>
              {runs.slice(0, 100).map((run) => (
                <tr
                  key={text(run.id)}
                  className={styles.clickableRunRow}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRun(run)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                      || event.key === " "
                    ) {
                      event.preventDefault();
                      setSelectedRun(run);
                    }
                  }}
                >
                  <td>
                    {formatDate(
                      run.started_at || run.created_at
                    )}
                  </td>

                  <td>{text(run.agent_key)}</td>

                  <td>
                    <b className={statusTone(run.status)}>
                      {text(run.status)}
                    </b>
                    <small>{text(run.phase)}</small>
                  </td>

                  <td>Tavily → OpenRouter</td>

                  <td>
                    {text(
                      run.selected_analysis_model || "—"
                    )}
                  </td>

                  <td>
                    {formatNumber(
                      run.sources_persisted
                      || run.sources_returned
                    )} sources ·{" "}
                    {formatNumber(
                      run.opportunities_created
                    )} opportunities ·{" "}
                    {formatNumber(
                      run.duplicates_detected
                    )} duplicates
                  </td>

                  <td>
                    {text(run.error_message || "—")}
                  </td>

                  <td>
                    <button
                      type="button"
                      className={styles.inspectRunButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedRun(run);
                      }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.panel}><h3>Provider usage ledger</h3><div className={styles.tableWrap}><table><thead><tr><th>Time</th><th>Provider</th><th>Agent</th><th>Outcome</th><th>Requests / credits</th><th>Tokens</th><th>HTTP</th><th>Request ID</th></tr></thead><tbody>{usage.slice(0,150).map((row) => <tr key={text(row.id)}><td>{formatDate(row.occurred_at)}</td><td>{text(row.provider_key)}</td><td>{text(row.agent_key)}</td><td><b className={statusTone(row.outcome)}>{text(row.outcome)}</b></td><td>{formatNumber(row.request_count)} req · {formatNumber(row.credits_consumed)} credits</td><td>{formatNumber(number(row.input_tokens)+number(row.output_tokens))}</td><td>{text(row.http_status || "—")}</td><td>{text(row.provider_request_id || "—")}</td></tr>)}</tbody></table></div></div>
      {incidents.length ? <div className={styles.panel}><h3>Runtime incidents</h3><div className={styles.incidents}>{incidents.map((incident) => <article key={text(incident.id)}><AlertTriangle/><div><strong>{text(incident.title)}</strong><span>{text(incident.provider_key)} · {text(incident.agent_key)} · {formatDate(incident.created_at)}</span><p>{text(incident.description)}</p></div><b className={statusTone(incident.status)}>{text(incident.status)}</b>{incident.status === "open" ? <button onClick={() => void action("resolve_incident", { incidentId: incident.id }, "Incident marked resolved.")}>Resolve</button> : null}</article>)}</div></div> : null}
    </section> : null}

    <Drawer
      open={Boolean(selectedRun)}
      title={
        selectedRun
          ? `${text(selectedRun.agent_key) || "Execution"} · ${
              formatDate(
                selectedRun.started_at
                || selectedRun.created_at
              )
            }`
          : "Execution evidence"
      }
      eyebrow="Provider Requests, Results & Internal Actions"
      onClose={() => setSelectedRun(null)}
      footer={
        <SecondaryButton
          onClick={() => setSelectedRun(null)}
        >
          Close inspection
        </SecondaryButton>
      }
    >
      {selectedRun ? (
        <div className={styles.runInspector}>
          <div className={styles.runFacts}>
            <article>
              <span>Status</span>
              <b className={statusTone(selectedRun.status)}>
                {text(selectedRun.status) || "—"}
              </b>
              <small>
                {text(selectedRun.phase) || "—"}
              </small>
            </article>

            <article>
              <span>Provider route</span>
              <strong>Tavily → OpenRouter</strong>
              <small>
                {text(
                  selectedRun.selected_analysis_model
                ) || "No analysis model recorded"}
              </small>
            </article>

            <article>
              <span>Started</span>
              <strong>
                {formatDate(
                  selectedRun.started_at
                  || selectedRun.created_at
                )}
              </strong>
              <small>
                Finished:{" "}
                {formatDate(
                  selectedRun.finished_at
                  || selectedRun.completed_at
                )}
              </small>
            </article>

            <article>
              <span>Provider request IDs</span>
              <strong>
                {text(selectedRun.search_request_id)
                  || "No Tavily request ID"}
              </strong>
              <small>
                {text(selectedRun.analysis_request_id)
                  || "No OpenRouter request ID"}
              </small>
            </article>
          </div>

          <div className={styles.runMetrics}>
            <article>
              <span>Sources returned</span>
              <strong>
                {formatNumber(
                  selectedRun.sources_returned
                )}
              </strong>
            </article>

            <article>
              <span>Sources persisted</span>
              <strong>
                {formatNumber(
                  selectedRun.sources_persisted
                )}
              </strong>
            </article>

            <article>
              <span>Opportunities</span>
              <strong>
                {formatNumber(
                  selectedRun.opportunities_created
                )}
              </strong>
            </article>

            <article>
              <span>Rejected</span>
              <strong>
                {formatNumber(
                  selectedRun.opportunities_rejected
                )}
              </strong>
            </article>

            <article>
              <span>Duplicates</span>
              <strong>
                {formatNumber(
                  selectedRun.duplicates_detected
                )}
              </strong>
            </article>

            <article>
              <span>Tavily credits</span>
              <strong>
                {formatNumber(
                  selectedRun.tavily_credits
                )}
              </strong>
            </article>

            <article>
              <span>Input tokens</span>
              <strong>
                {formatNumber(
                  selectedRun.input_tokens
                )}
              </strong>
            </article>

            <article>
              <span>Output tokens</span>
              <strong>
                {formatNumber(
                  selectedRun.output_tokens
                )}
              </strong>
            </article>
          </div>

          {Boolean(
            text(selectedRun.error_code)
            || text(selectedRun.error_message)
          ) ? (
            <section className={styles.runError}>
              <strong>
                {text(selectedRun.error_code)
                  || "Execution error"}
              </strong>

              <p>
                {text(selectedRun.error_message)
                  || "No additional error was stored."}
              </p>
            </section>
          ) : null}

          <section className={styles.runSection}>
            <h3>Returned sources</h3>

            {records(
              object(selectedRun.result_payload).sources
            ).length ? (
              <div className={styles.sourceList}>
                {records(
                  object(selectedRun.result_payload).sources
                ).map((source, index) => (
                  <a
                    key={`${text(source.url)}-${index}`}
                    href={text(source.url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <strong>
                      {text(source.title)
                        || text(source.url)
                        || `Source ${index + 1}`}
                    </strong>

                    <span>
                      {text(source.domain)
                        || "External source"}{" "}
                      · score{" "}
                      {number(source.score).toFixed(3)}
                    </span>

                    <p>
                      {text(source.content).slice(0, 420)}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className={styles.emptyEvidence}>
                No returned source payload was stored.
              </p>
            )}
          </section>

          <section className={styles.runSection}>
            <h3>Opportunity analysis</h3>

            {records(
              object(selectedRun.result_payload)
                .opportunities
            ).length ? (
              <div className={styles.opportunityList}>
                {records(
                  object(selectedRun.result_payload)
                    .opportunities
                ).map((opportunity, index) => (
                  <article
                    key={`${text(
                      opportunity.title
                    )}-${index}`}
                  >
                    <strong>
                      {text(opportunity.title)
                        || `Opportunity ${index + 1}`}
                    </strong>

                    <span>
                      {text(
                        opportunity.captureDecision
                      ) || "unclassified"}{" "}
                      · relevance{" "}
                      {formatNumber(
                        opportunity.relevanceScore
                      )}
                    </span>

                    <p>
                      {text(
                        opportunity.whyCaptured
                        || opportunity.rejectionReason
                        || opportunity
                          .angelcareRelevancePreview
                      )}
                    </p>

                    {text(opportunity.sourceUrl) ? (
                      <a
                        href={text(
                          opportunity.sourceUrl
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open authoritative source
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.emptyEvidence}>
                The provider returned no opportunity
                candidates for this run.
              </p>
            )}
          </section>

          <details open className={styles.runJson}>
            <summary>Provider evidence</summary>
            <pre>
              {pretty(selectedRun.provider_evidence)}
            </pre>
          </details>

          <details open className={styles.runJson}>
            <summary>Internal actions</summary>
            <pre>
              {pretty(selectedRun.internal_actions)}
            </pre>
          </details>

          <details className={styles.runJson}>
            <summary>Complete result payload</summary>
            <pre>
              {pretty(selectedRun.result_payload)}
            </pre>
          </details>

          <details className={styles.runJson}>
            <summary>Configuration snapshot</summary>
            <pre>
              {pretty(
                selectedRun.configuration_snapshot
              )}
            </pre>
          </details>
        </div>
      ) : null}
    </Drawer>

    <Drawer open={Boolean(selectedAgent)} title={selectedAgent?.name || "Agent configuration"} eyebrow="Persistent Outbound Agent Configuration" onClose={() => setSelectedAgent(null)} footer={<><SecondaryButton onClick={() => setSelectedAgent(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void saveAgent()} disabled={busy === "save_agent"}><Save size={15}/> Save and enforce</PrimaryButton></>}>
      {selectedAgent ? <div className={styles.agentEditor}>
        <div className={styles.formGrid}><Field label="Agent key"><input value={selectedAgent.agentKey} disabled={agents.some((agent) => agent.agent_key === selectedAgent.agentKey)}/></Field><Field label="Agent name"><input value={selectedAgent.name} onChange={(event) => setSelectedAgent({ ...selectedAgent, name: event.target.value })}/></Field><Field label="Category"><input value={selectedAgent.category} onChange={(event) => setSelectedAgent({ ...selectedAgent, category: event.target.value })}/></Field><Field label="Status"><select value={selectedAgent.status} onChange={(event) => setSelectedAgent({ ...selectedAgent, status: event.target.value })}><option value="active">Active</option><option value="paused">Paused</option><option value="disabled">Disabled</option></select></Field><Field label="Trigger mode"><select value={selectedAgent.triggerMode} onChange={(event) => setSelectedAgent({ ...selectedAgent, triggerMode: event.target.value })}><option value="manual">Manual</option><option value="scheduled">Scheduled</option><option value="both">Manual + scheduled</option></select></Field><Field label="Frequency"><select value={selectedAgent.frequencyKey} onChange={(event) => setSelectedAgent({ ...selectedAgent, frequencyKey: event.target.value })}><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="custom">Custom interval</option></select></Field></div>
        <Field label="Description"><textarea value={selectedAgent.description} onChange={(event) => setSelectedAgent({ ...selectedAgent, description: event.target.value })}/></Field>
        <h3><Clock3 size={16}/> Schedule & frequency</h3><div className={styles.formGrid}><Field label="Days (1=Mon … 7=Sun)"><input value={jsonList(selectedAgent.schedule.days)} onChange={(event) => setSelectedAgent({ ...selectedAgent, schedule: { ...selectedAgent.schedule, days: parseList(event.target.value).map(Number) } })}/></Field><Field label="Hour"><input type="number" min={0} max={23} value={number(selectedAgent.schedule.hour, 9)} onChange={(event) => setSelectedAgent({ ...selectedAgent, schedule: { ...selectedAgent.schedule, hour: Number(event.target.value) } })}/></Field><Field label="Minute"><input type="number" min={0} max={59} value={number(selectedAgent.schedule.minute, 0)} onChange={(event) => setSelectedAgent({ ...selectedAgent, schedule: { ...selectedAgent.schedule, minute: Number(event.target.value) } })}/></Field><Field label="Custom interval minutes"><input type="number" min={15} value={number(selectedAgent.schedule.intervalMinutes, 1440)} onChange={(event) => setSelectedAgent({ ...selectedAgent, schedule: { ...selectedAgent.schedule, intervalMinutes: Number(event.target.value) } })}/></Field></div>
        <h3><Search size={16}/> Tavily search behavior</h3><div className={styles.formGrid}><Field label="Searches per run"><input type="number" min={1} max={10} value={number(selectedAgent.searchConfig.maxSearchesPerRun, 1)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, maxSearchesPerRun: Number(event.target.value) } })}/></Field><Field label="Results per search"><input type="number" min={1} max={20} value={number(selectedAgent.searchConfig.maxResultsPerSearch, 8)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, maxResultsPerSearch: Number(event.target.value) } })}/></Field><Field label="Search depth"><select value={text(selectedAgent.searchConfig.searchDepth || "basic")} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, searchDepth: event.target.value } })}><option value="basic">Basic</option><option value="advanced">Advanced</option><option value="fast">Fast</option><option value="ultra-fast">Ultra fast</option></select></Field><Field label="Recency days"><input type="number" min={1} value={number(selectedAgent.searchConfig.recencyDays, 45)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, recencyDays: Number(event.target.value) } })}/></Field><Field label="Countries / regions"><input value={jsonList(selectedAgent.searchConfig.countries)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, countries: parseList(event.target.value) } })}/></Field><Field label="Required keywords"><input value={jsonList(selectedAgent.searchConfig.keywords)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, keywords: parseList(event.target.value) } })}/></Field><Field label="Excluded terms"><input value={jsonList(selectedAgent.searchConfig.excludeTerms)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, excludeTerms: parseList(event.target.value) } })}/></Field><Field label="Agent included domains"><input value={jsonList(selectedAgent.searchConfig.includeDomains)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, includeDomains: parseList(event.target.value) } })}/></Field><Field label="Agent excluded domains"><input value={jsonList(selectedAgent.searchConfig.excludeDomains)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, excludeDomains: parseList(event.target.value) } })}/></Field><Field label="Minimum source score (0–1)"><input type="number" min={0} max={1} step={0.05} value={number(selectedAgent.searchConfig.minimumSourceScore, 0)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, minimumSourceScore: Number(event.target.value) } })}/></Field><Field label="Scheduled query"><textarea value={text(selectedAgent.searchConfig.scheduledQuery)} onChange={(event) => setSelectedAgent({ ...selectedAgent, searchConfig: { ...selectedAgent.searchConfig, scheduledQuery: event.target.value } })}/></Field></div>
        <h3><Workflow size={16}/> OpenRouter analysis</h3><div className={styles.formGrid}><Field label="Free router/model"><input value={text(selectedAgent.analysisConfig.model || "openrouter/free")} onChange={(event) => setSelectedAgent({ ...selectedAgent, analysisConfig: { ...selectedAgent.analysisConfig, model: event.target.value } })}/></Field><Field label="Max output tokens"><input type="number" min={100} value={number(selectedAgent.analysisConfig.maxOutputTokens, 4000)} onChange={(event) => setSelectedAgent({ ...selectedAgent, analysisConfig: { ...selectedAgent.analysisConfig, maxOutputTokens: Number(event.target.value) } })}/></Field><Field label="Minimum relevance"><input type="number" min={0} max={100} value={number(selectedAgent.analysisConfig.minimumRelevanceScore, 55)} onChange={(event) => setSelectedAgent({ ...selectedAgent, analysisConfig: { ...selectedAgent.analysisConfig, minimumRelevanceScore: Number(event.target.value) } })}/></Field><Field label="Max opportunities/run"><input type="number" min={0} value={number(selectedAgent.analysisConfig.maximumOpportunitiesPerRun, 15)} onChange={(event) => setSelectedAgent({ ...selectedAgent, analysisConfig: { ...selectedAgent.analysisConfig, maximumOpportunitiesPerRun: Number(event.target.value) } })}/></Field></div>
        <h3><Gauge size={16}/> Agent quotas & failures</h3><div className={styles.formGrid}><Field label="Runs/day"><input type="number" min={0} value={number(selectedAgent.quotaConfig.maxRunsPerDay, 1)} onChange={(event) => setSelectedAgent({ ...selectedAgent, quotaConfig: { ...selectedAgent.quotaConfig, maxRunsPerDay: Number(event.target.value) } })}/></Field><Field label="Runs/week"><input type="number" min={0} value={number(selectedAgent.quotaConfig.maxRunsPerWeek, 5)} onChange={(event) => setSelectedAgent({ ...selectedAgent, quotaConfig: { ...selectedAgent.quotaConfig, maxRunsPerWeek: Number(event.target.value) } })}/></Field><Field label="Runs/month"><input type="number" min={0} value={number(selectedAgent.quotaConfig.maxRunsPerMonth, 20)} onChange={(event) => setSelectedAgent({ ...selectedAgent, quotaConfig: { ...selectedAgent.quotaConfig, maxRunsPerMonth: Number(event.target.value) } })}/></Field><Field label="Tavily credits/run"><input
type="number"
min={0}
max={20}
value={number(
  selectedAgent.quotaConfig.maxTavilyCreditsPerRun,
  Math.max(
    1,
    number(selectedAgent.searchConfig.maxSearchesPerRun, 1)
      * (
        text(
          selectedAgent.searchConfig.searchDepth || "basic"
        ) === "advanced"
          ? 2
          : 1
      ),
  ),
)}
onChange={(event) =>
  setSelectedAgent({
    ...selectedAgent,
    quotaConfig: {
      ...selectedAgent.quotaConfig,
      maxTavilyCreditsPerRun: Number(event.target.value),
    },
  })
}
/></Field><Field label="OpenRouter requests/run"><input
type="number"
min={0}
max={10}
value={number(
  selectedAgent.quotaConfig.maxOpenRouterRequestsPerRun,
  1,
)}
onChange={(event) =>
  setSelectedAgent({
    ...selectedAgent,
    quotaConfig: {
      ...selectedAgent.quotaConfig,
      maxOpenRouterRequestsPerRun: Number(event.target.value),
    },
  })
}
/></Field><Field label="Suspend after failures"><input type="number" min={1} value={number(selectedAgent.failurePolicy.suspendAfterFailures, 4)} onChange={(event) => setSelectedAgent({ ...selectedAgent, failurePolicy: { ...selectedAgent.failurePolicy, suspendAfterFailures: Number(event.target.value) } })}/></Field></div>
        <h3><ShieldCheck size={16}/> Internal action permissions</h3><div className={styles.permissionMatrix}>{permissionLabels.map(([key,label]) => <label key={key}><input type="checkbox" checked={Boolean(selectedAgent.actionPermissions[key])} onChange={(event) => setSelectedAgent({ ...selectedAgent, actionPermissions: { ...selectedAgent.actionPermissions, [key]: event.target.checked, externalActions: false } })}/><span>{label}</span></label>)}<label className={styles.permissionLocked}><input type="checkbox" checked={false} disabled/><span>External actions permanently locked</span><LockKeyhole size={15}/></label></div>
        <Field label="Research doctrine and extraction instructions"><textarea rows={8} value={selectedAgent.promptDoctrine} onChange={(event) => setSelectedAgent({ ...selectedAgent, promptDoctrine: event.target.value })}/></Field>
      </div> : null}
    </Drawer>
  </AcCapitalShell>;
}
