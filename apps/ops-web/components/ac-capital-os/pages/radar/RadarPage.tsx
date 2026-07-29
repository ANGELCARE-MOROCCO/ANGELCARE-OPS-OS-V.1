"use client";

import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  Bot,
  Boxes,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  Eye,
  FileSearch,
  Files,
  Filter,
  GitMerge,
  Globe2,
  Layers3,
  Link2,
  ListChecks,
  NotebookPen,
  Radar,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { EmptyState, ErrorState, LoadingState } from "../../core/AsyncState";
import { ActionFeedback, Field } from "../../core/FormParts";
import { MetricTile } from "../../core/MetricTile";
import { Dialog, Drawer } from "../../core/Overlay";
import { StatusBadge } from "../../core/StatusBadge";
import {
  FactGrid,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  TruthChip,
} from "../../core/WorkspaceParts";
import { postEnvelope } from "../../core/api";
import { formatDh, shortDate } from "../../core/data";
import type { CapitalActor, Row } from "../../core/types";
import { useAction } from "../../core/useAction";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./radar.module.css";

type View =
  | "live"
  | "validation"
  | "candidates"
  | "clusters"
  | "rejected"
  | "watchlist"
  | "deadlines"
  | "runs"
  | "audit";

type DialogMode =
  | "research"
  | "review-source"
  | "promote-source"
  | "cluster"
  | "deeper-research"
  | "convert"
  | "disposition"
  | "note"
  | null;

const asRows = (value: unknown): Row[] =>
  Array.isArray(value)
    ? value.filter((item): item is Row => Boolean(item && typeof item === "object"))
    : [];
const asRow = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};
const txt = (row: Row | null, key: string, fallback = "—") => {
  if (!row) return fallback;
  const value = row[key];
  return value == null || value === "" ? fallback : String(value);
};
const num = (row: Row | null, key: string, fallback = 0) => {
  if (!row) return fallback;
  const parsed = Number(row[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const list = (row: Row | null, key: string) => {
  if (!row) return [] as string[];
  const value = row[key];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
  return [] as string[];
};
const pretty = (value: unknown) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value ?? "");
  }
};
const domainOf = (value: unknown) => {
  try {
    return new URL(String(value || "")).hostname.replace(/^www\./, "");
  } catch {
    return "External source";
  }
};
const daysUntil = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
};

const viewLabels: Array<{ key: View; label: string }> = [
  { key: "live", label: "Live Radar" },
  { key: "validation", label: "Validation Queue" },
  { key: "candidates", label: "Opportunity Candidates" },
  { key: "clusters", label: "Evidence Clusters" },
  { key: "rejected", label: "Rejected Signals" },
  { key: "watchlist", label: "Watchlist" },
  { key: "deadlines", label: "Critical Deadlines" },
  { key: "runs", label: "Research Runs" },
  { key: "audit", label: "Audit & Handoffs" },
];

export function RadarPage({ actor }: { actor: CapitalActor }) {
  const workspace = useWorkspace<Record<string, unknown>>("/api/ac-capital-os/capital-radar");
  const action = useAction();
  const data = asRow(workspace.envelope?.data);
  const sources = asRows(data.sources);
  const opportunities = asRows(data.opportunities);
  const researchRuns = asRows(data.researchRuns);
  const rejections = asRows(data.rejections);
  const handoffQueue = asRows(data.handoffQueue);
  const clusters = asRows(data.clusters);
  const clusterMembers = asRows(data.clusterMembers);
  const reviews = asRows(data.sourceReviews);
  const conversions = asRows(data.conversionEvents);
  const researchMissions = asRows(data.researchMissions);
  const notes = asRows(data.notes);
  const dossiers = asRows(data.qualificationDossiers);
  const cases = asRows(data.cases);
  const pipelineRecords = asRows(data.pipelineRecords);
  const coordinatorTasks = asRows(data.coordinatorTasks);
  const agentRuns = asRows(data.agentRuns);

  const [view, setView] = useState<View>("validation");
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selectedSource, setSelectedSource] = useState<Row | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Row | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Row | null>(null);
  const [selectedRun, setSelectedRun] = useState<Row | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [researchQuery, setResearchQuery] = useState("AngelCare childcare, education, women-founder, SaaS and impact funding opportunities");
  const [reviewForm, setReviewForm] = useState({ decision: "validate", confidence: 70, officiality: "unverified", assignedReviewer: actor.name, note: "" });
  const [promoteForm, setPromoteForm] = useState({ title: "", organizationName: "", opportunityType: "Grant", country: "Morocco", region: "Morocco", applicationStatus: "unknown", deadline: "", amountRangeLabel: "", owner: actor.name, nextAction: "Validate evidence and launch preliminary qualification." });
  const [clusterForm, setClusterForm] = useState({ title: "" });
  const [deeperForm, setDeeperForm] = useState({ query: "", note: "" });
  const [conversionMode, setConversionMode] = useState("convert-full-chain");
  const [dispositionForm, setDispositionForm] = useState({ disposition: "watchlist", owner: actor.name, reason: "", nextAction: "" });
  const [noteText, setNoteText] = useState("");

  const sourceById = useMemo(() => new Map(sources.map((row) => [String(row.id), row])), [sources]);
  const opportunityById = useMemo(() => new Map(opportunities.map((row) => [String(row.id), row])), [opportunities]);
  const dossierById = useMemo(() => new Map(dossiers.map((row) => [String(row.id), row])), [dossiers]);
  const caseById = useMemo(() => new Map(cases.map((row) => [String(row.id), row])), [cases]);
  const pipelineById = useMemo(() => new Map(pipelineRecords.map((row) => [String(row.id), row])), [pipelineRecords]);

  const filteredSources = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sources.filter((row) => {
      const status = txt(row, "lifecycle_status", txt(row, "verification_status", "captured"));
      const matchStatus = statusFilter === "all" || status === statusFilter;
      const haystack = [row.source_name, row.source_url, row.source_domain, row.notes, row.content_excerpt].map(String).join(" ").toLowerCase();
      return matchStatus && (!term || haystack.includes(term));
    });
  }, [search, sources, statusFilter]);

  const filteredOpportunities = useMemo(() => {
    const term = search.trim().toLowerCase();
    return opportunities.filter((row) => {
      const status = txt(row, "workflow_status", txt(row, "status", "candidate"));
      const matchStatus = statusFilter === "all" || status === statusFilter;
      const haystack = [row.title, row.organization_name, row.opportunity_type, row.country, row.region, row.angelcare_relevance_preview].map(String).join(" ").toLowerCase();
      return matchStatus && (!term || haystack.includes(term));
    });
  }, [opportunities, search, statusFilter]);

  const queueSources = sources.filter((row) => !["validated", "rejected", "archived", "secondary-evidence"].includes(txt(row, "lifecycle_status", "captured")));
  const validatedSources = sources.filter((row) => txt(row, "lifecycle_status", "") === "validated");
  const watchlist = opportunities.filter((row) => txt(row, "status", "") === "watchlist" || txt(row, "workflow_status", "") === "watchlist");
  const deadlineRows = opportunities.filter((row) => {
    const days = daysUntil(row.deadline);
    return days != null && days >= 0 && days <= 30;
  }).sort((left, right) => (daysUntil(left.deadline) ?? 9999) - (daysUntil(right.deadline) ?? 9999));
  const activePipeline = opportunities.filter((row) => Boolean(row.pipeline_record_id)).length;
  const convertedCases = opportunities.filter((row) => Boolean(row.case_id)).length;
  const nextBest = opportunities
    .filter((row) => txt(row, "status", "") !== "rejected")
    .slice()
    .sort((left, right) => num(right, "strategic_value_score") - num(left, "strategic_value_score"))[0] || null;

  const selectedSourceOpportunity = selectedSource?.linked_opportunity_id
    ? opportunityById.get(String(selectedSource.linked_opportunity_id)) || null
    : null;
  const selectedOpportunityDossier = selectedOpportunity?.qualification_dossier_id
    ? dossierById.get(String(selectedOpportunity.qualification_dossier_id)) || null
    : null;
  const selectedOpportunityCase = selectedOpportunity?.case_id
    ? caseById.get(String(selectedOpportunity.case_id)) || null
    : null;
  const selectedOpportunityPipeline = selectedOpportunity?.pipeline_record_id
    ? pipelineById.get(String(selectedOpportunity.pipeline_record_id)) || null
    : null;
  const selectedClusterMembers = selectedCluster
    ? clusterMembers.filter((row) => String(row.cluster_id) === String(selectedCluster.id)).map((row) => sourceById.get(String(row.source_id))).filter(Boolean) as Row[]
    : [];

  async function execute(actionName: string, payload: Record<string, unknown>, message: string, close = true) {
    const result = await action.execute(
      () => postEnvelope("/api/ac-capital-os/capital-radar", { action: actionName, ...payload }),
      message,
      { title: `Radar workbench · ${actionName}`, workspaceKey: "opportunity-radar" },
    );
    if (result) {
      await workspace.refresh();
      if (close) {
        setDialog(null);
        setSelectedSource(null);
        setSelectedOpportunity(null);
        setSelectedCluster(null);
      }
    }
    return result;
  }

  async function runResearch() {
    const result = await action.execute(
      () => postEnvelope("/api/ac-capital-os/capital-radar/research/run", { query: researchQuery, agentKey: "funding-opportunity-radar" }),
      "External research completed and materialized into the Radar workbench.",
      { title: "Run external public capital research", workspaceKey: "opportunity-radar" },
    );
    if (result) {
      await workspace.refresh();
      setDialog(null);
    }
  }

  function openSource(row: Row) {
    setSelectedSource(row);
    setReviewForm({
      decision: txt(row, "lifecycle_status", "captured") === "validated" ? "validate" : "validate",
      confidence: num(row, "source_confidence", 50),
      officiality: txt(row, "officiality", "unverified"),
      assignedReviewer: txt(row, "assigned_reviewer", actor.name),
      note: txt(row, "review_note", ""),
    });
    setPromoteForm({
      title: txt(row, "source_name", ""),
      organizationName: txt(asRow(row.metadata), "organizationName", domainOf(row.source_url)),
      opportunityType: txt(asRow(row.metadata), "opportunityType", "Grant"),
      country: txt(row, "country", "Morocco"),
      region: txt(row, "region", "Morocco"),
      applicationStatus: txt(asRow(row.metadata), "applicationStatus", "unknown"),
      deadline: txt(row, "detected_deadline", ""),
      amountRangeLabel: txt(row, "funding_amount_label", ""),
      owner: actor.name,
      nextAction: txt(asRow(row.metadata), "recommendedNextAction", "Validate evidence and launch preliminary qualification."),
    });
  }

  function toggleSource(sourceId: string) {
    setSelectedSourceIds((current) => current.includes(sourceId) ? current.filter((id) => id !== sourceId) : [...current, sourceId]);
  }

  function openOpportunity(row: Row) {
    setSelectedOpportunity(row);
    setDispositionForm({
      disposition: txt(row, "status", "watchlist") === "rejected" ? "reject" : "watchlist",
      owner: txt(row, "owner", actor.name),
      reason: "",
      nextAction: txt(row, "next_action", ""),
    });
  }

  const insights = [
    { label: "Best opportunity", value: nextBest ? `${txt(nextBest, "title")} · ${num(nextBest, "strategic_value_score")}% value` : "No opportunity candidate yet" },
    { label: "Validation load", value: `${queueSources.length} evidence sources need review` },
    { label: "Workflow conversion", value: `${convertedCases} cases · ${activePipeline} pipeline records` },
    { label: "External boundary", value: "Internal preparation enabled; outreach and submission remain approval-locked" },
  ];

  return (
    <AcCapitalShell
      actor={actor}
      workspaceKey="opportunity-radar"
      title="Opportunity Intelligence & Conversion Workbench"
      subtitle="Convert public capital evidence into validated opportunities, qualification dossiers, funding cases, pipeline records and controlled internal missions."
      envelope={workspace.envelope}
      insights={insights}
      primaryAction="Run Targeted Scan"
      onPrimaryAction={() => setDialog("research")}
    >
      {workspace.loading ? (
        <LoadingState label="Loading live evidence, candidates and downstream workflow links…" />
      ) : workspace.error ? (
        <ErrorState message={workspace.error} onRetry={() => void workspace.refresh()} />
      ) : (
        <>
          <section className={styles.commandDeck}>
            <div className={styles.commandCopy}>
              <span><Radar size={15} /> Evidence-to-capital conversion gateway</span>
              <h2>Every signal must become a reviewed decision, a connected workflow object—or a recorded rejection.</h2>
              <p>Tavily retrieves public evidence. OpenRouter structures it. This workbench governs source validation, clustering, opportunity creation and controlled handoff into the existing AC Capital operating chain.</p>
              <div className={styles.commandActions}>
                <PrimaryButton onClick={() => setDialog("research")}><Zap size={15} /> Run targeted scan</PrimaryButton>
                <SecondaryButton onClick={() => window.location.assign("/ac-capital-os/ai-control")}>Open AI Operations</SecondaryButton>
                <SecondaryButton onClick={() => void workspace.refresh()}><RefreshCw size={14} /> Refresh evidence</SecondaryButton>
              </div>
            </div>
            <div className={styles.commandStatus}>
              <article><span>Providers</span><strong>Tavily → OpenRouter</strong><small>Public evidence + free structured analysis</small></article>
              <article><span>Last successful scan</span><strong>{shortDate(researchRuns.find((row) => txt(row, "status") === "completed")?.finished_at)}</strong><small>{researchRuns.length} governed scan records</small></article>
              <article><span>Critical workload</span><strong>{queueSources.length + deadlineRows.length}</strong><small>Sources awaiting review + deadlines within 30 days</small></article>
            </div>
          </section>

          <section className={styles.metrics}>
            <MetricTile label="Evidence captured" value={String(sources.length)} detail={`${queueSources.length} require review · ${validatedSources.length} validated`} tone="blue" />
            <MetricTile label="Opportunity candidates" value={String(opportunities.length)} detail={`${watchlist.length} watchlist · ${rejections.length} rejected signals`} tone="amber" />
            <MetricTile label="Qualification dossiers" value={String(dossiers.length)} detail="Canonical dossiers visible in Qualification Committee." tone="green" />
            <MetricTile label="Funding cases" value={String(cases.length)} detail={`${pipelineRecords.length} connected pipeline records`} tone="violet" />
          </section>

          <nav className={styles.workbenchNav} aria-label="Radar workbench views">
            {viewLabels.map((item) => (
              <button key={item.key} className={view === item.key ? styles.activeView : ""} onClick={() => setView(item.key)}>{item.label}</button>
            ))}
          </nav>

          <section className={styles.filterBar}>
            <label><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search evidence, programs, organizations or countries…" /></label>
            <label><Filter size={15} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All states</option><option value="captured">Captured</option><option value="clustered">Clustered</option><option value="validated">Validated</option><option value="secondary-evidence">Secondary evidence</option><option value="candidate">Candidate</option><option value="qualifying">Qualifying</option><option value="case-created">Case created</option><option value="pipeline-active">Pipeline active</option><option value="watchlist">Watchlist</option><option value="rejected">Rejected</option></select></label>
            <span>{view === "validation" ? filteredSources.length : filteredOpportunities.length} visible records</span>
          </section>

          {view === "live" ? (
            <div className={styles.liveGrid}>
              <section className={styles.liveBoard}>
                <SectionHeading eyebrow="Opportunity Heat Board" title="Highest-value and deadline-sensitive capital opportunities" copy="Every card exposes evidence, workflow status and the exact next internal action." />
                {filteredOpportunities.length ? <div className={styles.opportunityGrid}>{filteredOpportunities.slice(0, 12).map((row) => <OpportunityCard key={String(row.id)} row={row} onOpen={() => openOpportunity(row)} />)}</div> : <EmptyState title="No canonical opportunity candidates yet" copy="Promote a validated source or run a scan whose analysis produces accepted candidates." action="Open validation queue" onAction={() => setView("validation")} />}
              </section>
              <aside className={styles.intelligencePanel}>
                <SectionHeading eyebrow="Context Intelligence" title="Next safest move" />
                {nextBest ? <><strong>{txt(nextBest, "title")}</strong><p>{txt(nextBest, "next_action", "Validate evidence and qualify the opportunity.")}</p><div className={styles.scoreStack}><span>Strategic value <b>{num(nextBest, "strategic_value_score")}%</b></span><span>Evidence quality <b>{num(nextBest, "evidence_quality_score", num(nextBest, "source_confidence"))}%</b></span><span>Eligibility <b>{num(nextBest, "eligibility_confidence")}%</b></span></div><PrimaryButton onClick={() => openOpportunity(nextBest)}>Open opportunity</PrimaryButton></> : <p>No candidate is available for recommendation.</p>}
                <div className={styles.intelligenceList}><span><CalendarClock size={15} /> {deadlineRows.length} deadlines within 30 days</span><span><ClipboardCheck size={15} /> {queueSources.length} sources awaiting review</span><span><BriefcaseBusiness size={15} /> {convertedCases} funding cases created</span><span><ShieldCheck size={15} /> External submission remains locked</span></div>
              </aside>
            </div>
          ) : null}

          {view === "validation" ? (
            <section className={styles.workspacePanel}>
              <SectionHeading eyebrow="Source Evidence Control" title="Validation queue" copy="Inspect the public page, validate or reject evidence, group duplicate pages and promote strong evidence into a canonical opportunity." action={<div className={styles.bulkActions}><span>{selectedSourceIds.length} selected</span><SecondaryButton disabled={!selectedSourceIds.length} onClick={() => void execute("bulk-review-sources", { sourceIds: selectedSourceIds, decision: "validate", confidence: 75, officiality: "unverified", assignedReviewer: actor.name, note: "Bulk validated for controlled opportunity review." }, "Selected evidence sources validated.")}>Validate selected</SecondaryButton><SecondaryButton disabled={selectedSourceIds.length < 2} onClick={() => { setClusterForm({ title: "" }); setDialog("cluster"); }}>Group selected</SecondaryButton><SecondaryButton disabled={!selectedSourceIds.length} onClick={() => void execute("bulk-review-sources", { sourceIds: selectedSourceIds, decision: "reject", confidence: 0, assignedReviewer: actor.name, note: "Bulk rejected from validation queue." }, "Selected evidence sources rejected.")}>Reject selected</SecondaryButton></div>} />
              {filteredSources.length ? <div className={styles.sourceGrid}>{filteredSources.map((row) => <SourceCard key={String(row.id)} row={row} selected={selectedSourceIds.includes(String(row.id))} onToggle={() => toggleSource(String(row.id))} onOpen={() => openSource(row)} />)}</div> : <EmptyState title="No evidence matches this view" copy="Change filters or run a new targeted research mission." action="Run targeted scan" onAction={() => setDialog("research")} />}
            </section>
          ) : null}

          {view === "candidates" ? (
            <section className={styles.workspacePanel}>
              <SectionHeading eyebrow="Canonical Opportunity Candidates" title="Evidence-backed opportunities entering the capital workflow" copy="Open any candidate to qualify, create a case, add it to the pipeline or materialize the full internal chain." />
              {filteredOpportunities.length ? <div className={styles.opportunityGrid}>{filteredOpportunities.map((row) => <OpportunityCard key={String(row.id)} row={row} onOpen={() => openOpportunity(row)} />)}</div> : <EmptyState title="No opportunity candidates" copy="Promote a validated source from the queue. No candidate is fabricated from weak evidence." action="Open validation queue" onAction={() => setView("validation")} />}
            </section>
          ) : null}

          {view === "clusters" ? (
            <section className={styles.workspacePanel}>
              <SectionHeading eyebrow="Opportunity Evidence Clustering" title="One program, many supporting pages" copy="Group official pages, application pages, announcements and supporting articles into one canonical evidence cluster." action={<PrimaryButton onClick={() => void execute("auto-cluster", { sourceIds: selectedSourceIds }, "Compatible evidence sources were clustered.")}>Auto-cluster evidence</PrimaryButton>} />
              {clusters.length ? <div className={styles.clusterGrid}>{clusters.map((row) => <button key={String(row.id)} className={styles.clusterCard} onClick={() => setSelectedCluster(row)}><div><Layers3 size={20} /><StatusBadge value={txt(row, "status", "needs-review")} /></div><strong>{txt(row, "cluster_title", "Evidence cluster")}</strong><p>{txt(row, "organization_name", "Organization not confirmed")}</p><footer><span>{num(row, "source_count")} sources</span><span>{num(row, "official_source_count")} official</span><span>{num(row, "evidence_quality_score")}% quality</span></footer></button>)}</div> : <EmptyState title="No evidence clusters yet" copy="Select related source cards and group them, or run automatic clustering." action="Open validation queue" onAction={() => setView("validation")} />}
            </section>
          ) : null}

          {view === "rejected" ? (
            <section className={styles.workspacePanel}>
              <SectionHeading eyebrow="Recorded Rejection Intelligence" title="Weak, irrelevant, expired or duplicate signals" copy="Rejections remain traceable so the research doctrine can learn without polluting the capital pipeline." />
              {rejections.length ? <div className={styles.rejectionList}>{rejections.map((row) => <article key={String(row.id)}><XCircle size={18} /><div><strong>{txt(row, "candidate_title", "Rejected signal")}</strong><p>{txt(row, "rejection_reason", "No reason recorded")}</p><span>{txt(row, "source_name", domainOf(row.source_url))} · {shortDate(row.created_at)}</span>{row.source_url ? <a href={String(row.source_url)} target="_blank" rel="noreferrer">Open source <ExternalLink size={12} /></a> : null}</div></article>)}</div> : <EmptyState title="No rejected signals" copy="Provider and human rejection reasons will appear here." />}
            </section>
          ) : null}

          {view === "watchlist" ? (
            <section className={styles.workspacePanel}><SectionHeading eyebrow="Strategic Watchlist" title="Opportunities worth monitoring, not yet pursuing" />{watchlist.length ? <div className={styles.opportunityGrid}>{watchlist.map((row) => <OpportunityCard key={String(row.id)} row={row} onOpen={() => openOpportunity(row)} />)}</div> : <EmptyState title="Watchlist is empty" copy="Use Monitor / Watchlist from an opportunity dossier." />}</section>
          ) : null}

          {view === "deadlines" ? (
            <section className={styles.workspacePanel}><SectionHeading eyebrow="Deadline Command" title="Critical and near-term opportunity deadlines" />{deadlineRows.length ? <div className={styles.deadlineList}>{deadlineRows.map((row) => <button key={String(row.id)} onClick={() => openOpportunity(row)}><CalendarClock size={18} /><div><strong>{txt(row, "title")}</strong><span>{shortDate(row.deadline)} · {daysUntil(row.deadline)} days · {txt(row, "workflow_status")}</span></div><b>{num(row, "strategic_value_score")}%</b></button>)}</div> : <EmptyState title="No deadlines within 30 days" copy="Deadlines appear only when authoritative dates are recorded." />}</section>
          ) : null}

          {view === "runs" ? (
            <section className={styles.workspacePanel}><SectionHeading eyebrow="Research Execution Evidence" title="Provider runs and operational materialization" />{researchRuns.length || agentRuns.length ? <div className={styles.runTable}><div className={styles.runHead}><span>Started</span><span>Command</span><span>Status</span><span>Provider/model</span><span>Evidence</span><span>Inspect</span></div>{researchRuns.map((row) => <button key={`radar-${String(row.id)}`} onClick={() => setSelectedRun({ ...row, run_kind: "radar" })}><span>{shortDate(row.started_at)}</span><strong>{txt(row, "run_label", "Research run")}</strong><StatusBadge value={txt(row, "status")} /><span>{txt(row, "provider_model", txt(row, "adapter_mode"))}</span><span>{num(row, "sources_captured")} sources · {num(row, "opportunities_detected")} opportunities</span><Eye size={15} /></button>)}{agentRuns.slice(0, 40).map((row) => <button key={`agent-${String(row.id)}`} onClick={() => setSelectedRun({ ...row, run_kind: "agent" })}><span>{shortDate(row.started_at || row.created_at)}</span><strong>{txt(row, "research_query", txt(row, "agent_key"))}</strong><StatusBadge value={txt(row, "status")} /><span>{txt(row, "selected_analysis_model", "Tavily → OpenRouter")}</span><span>{num(row, "sources_persisted", num(row, "sources_returned"))} sources · {num(row, "opportunities_created")} opportunities</span><Eye size={15} /></button>)}</div> : <EmptyState title="No research runs" copy="Run a targeted scan to create provider and materialization evidence." />}</section>
          ) : null}

          {view === "audit" ? (
            <section className={styles.auditGrid}>
              <div className={styles.workspacePanel}><SectionHeading eyebrow="Conversion Ledger" title="Radar-to-workflow handoffs" />{conversions.length ? <div className={styles.auditList}>{conversions.map((row) => <article key={String(row.id)}><GitMerge size={17} /><div><strong>{txt(row, "conversion_mode")}</strong><span>{shortDate(row.created_at)} · {txt(row, "actor")}</span><p>{txt(row, "reason", "Controlled conversion recorded")}</p><small>Dossier {txt(row, "qualification_dossier_id", "—")} · Case {txt(row, "case_id", "—")} · Pipeline {txt(row, "pipeline_record_id", "—")}</small></div></article>)}</div> : <p>No conversion events recorded.</p>}</div>
              <div className={styles.workspacePanel}><SectionHeading eyebrow="Queued Intelligence Missions" title="Deeper research and handoff queue" />{researchMissions.length || handoffQueue.length ? <div className={styles.auditList}>{researchMissions.map((row) => <article key={String(row.id)}><FileSearch size={17} /><div><strong>{txt(row, "mission_title")}</strong><span>{txt(row, "status")} · {shortDate(row.created_at)}</span><p>{txt(row, "research_query")}</p></div></article>)}{handoffQueue.map((row) => <article key={String(row.id)}><Send size={17} /><div><strong>{txt(row, "target_workspace")}</strong><span>{txt(row, "handoff_status")} · {shortDate(row.created_at)}</span><p>{txt(row, "coordinator_instruction")}</p></div></article>)}</div> : <p>No queued missions or handoffs.</p>}</div>
            </section>
          ) : null}
        </>
      )}

      <Drawer open={Boolean(selectedSource) && dialog === null} title={selectedSource ? txt(selectedSource, "source_name", "Evidence source") : "Evidence source"} eyebrow="Evidence Inspection & Conversion" onClose={() => setSelectedSource(null)} footer={<><SecondaryButton onClick={() => setDialog("review-source")}>Review evidence</SecondaryButton><SecondaryButton onClick={() => setDialog("deeper-research")}>Request deeper research</SecondaryButton>{selectedSourceOpportunity ? <PrimaryButton onClick={() => { setSelectedSource(null); openOpportunity(selectedSourceOpportunity); }}>Open linked opportunity</PrimaryButton> : <PrimaryButton onClick={() => setDialog("promote-source")}>Create opportunity</PrimaryButton>}</>}>
        {selectedSource ? <div className={styles.drawerContent}>
          <div className={styles.drawerHero}><div><StatusBadge value={txt(selectedSource, "lifecycle_status", txt(selectedSource, "verification_status", "captured"))} /><strong>{num(selectedSource, "source_confidence")}% evidence confidence</strong></div><p>{txt(selectedSource, "notes", "Public evidence captured for controlled human review.")}</p></div>
          <FactGrid facts={[{ label: "Domain", value: txt(selectedSource, "source_domain", domainOf(selectedSource.source_url)) }, { label: "Officiality", value: txt(selectedSource, "officiality", "unverified") }, { label: "Freshness", value: txt(selectedSource, "freshness_status", "unknown") }, { label: "Deadline", value: shortDate(selectedSource.detected_deadline) }, { label: "Amount", value: txt(selectedSource, "funding_amount_label") }, { label: "Reviewer", value: txt(selectedSource, "assigned_reviewer", "Unassigned") }]} />
          <section className={styles.drawerSection}><h3>Authoritative source</h3><a href={String(selectedSource.source_url)} target="_blank" rel="noreferrer">{txt(selectedSource, "source_url")} <ExternalLink size={13} /></a><p>{txt(selectedSource, "content_excerpt", "No extracted content was stored for this source.")}</p></section>
          <section className={styles.drawerSection}><h3>Eligibility and application evidence</h3><p><b>Eligibility:</b> {txt(selectedSource, "eligibility_excerpt", "Not extracted")}</p><p><b>Application URL:</b> {selectedSource.application_url ? <a href={String(selectedSource.application_url)} target="_blank" rel="noreferrer">Open application page</a> : "Not confirmed"}</p></section>
          <section className={styles.drawerSection}><h3>Traceability</h3><p>Provider request: {txt(selectedSource, "provider_request_id")}</p><p>Research run: {txt(selectedSource, "research_run_id")}</p><p>Cluster: {txt(selectedSource, "cluster_id", "Not clustered")}</p><p>Linked opportunity: {txt(selectedSource, "linked_opportunity_id", "Not linked")}</p></section>
          <details className={styles.jsonEvidence}><summary>Provider and extraction metadata</summary><pre>{pretty(selectedSource.metadata)}</pre></details>
          <div className={styles.truthRow}><TruthChip kind="proof">Public URL and provenance required</TruthChip><TruthChip kind="approval">Human validation controls workflow entry</TruthChip><TruthChip kind="safe">No external action</TruthChip></div>
        </div> : null}
      </Drawer>

      <Drawer open={Boolean(selectedOpportunity) && dialog === null} title={selectedOpportunity ? txt(selectedOpportunity, "title", "Opportunity") : "Opportunity"} eyebrow="Canonical Opportunity & Workflow Dossier" onClose={() => setSelectedOpportunity(null)} footer={<><SecondaryButton onClick={() => setDialog("disposition")}>Disposition</SecondaryButton><SecondaryButton onClick={() => setDialog("note")}>Add note</SecondaryButton><PrimaryButton onClick={() => { setConversionMode("convert-full-chain"); setDialog("convert"); }}>Materialize full chain</PrimaryButton></>}>
        {selectedOpportunity ? <div className={styles.drawerContent}>
          <div className={styles.drawerHero}><div><StatusBadge value={txt(selectedOpportunity, "workflow_status", txt(selectedOpportunity, "status"))} /><strong>{num(selectedOpportunity, "strategic_value_score")}% strategic value</strong></div><p>{txt(selectedOpportunity, "angelcare_relevance_preview", txt(selectedOpportunity, "why_captured"))}</p></div>
          <div className={styles.scoreMatrix}><Score label="Evidence" value={num(selectedOpportunity, "evidence_quality_score", num(selectedOpportunity, "source_confidence"))} /><Score label="Eligibility" value={num(selectedOpportunity, "eligibility_confidence")} /><Score label="Strategic value" value={num(selectedOpportunity, "strategic_value_score")} /><Score label="Effort" value={num(selectedOpportunity, "effort_score")} /></div>
          <FactGrid facts={[{ label: "Organization", value: txt(selectedOpportunity, "organization_name") }, { label: "Type", value: txt(selectedOpportunity, "opportunity_type") }, { label: "Geography", value: `${txt(selectedOpportunity, "country", "—")} · ${txt(selectedOpportunity, "region", "—")}` }, { label: "Deadline", value: shortDate(selectedOpportunity.deadline) }, { label: "Funding", value: selectedOpportunity.amount_max ? formatDh(selectedOpportunity.amount_max) : txt(selectedOpportunity, "amount_range_label") }, { label: "Owner", value: txt(selectedOpportunity, "owner", "Unassigned") }]} />
          <section className={styles.drawerSection}><h3>Eligibility and next action</h3><p>{txt(selectedOpportunity, "eligibility_preview", "Eligibility not extracted")}</p><p><b>Next:</b> {txt(selectedOpportunity, "next_action", "Validate evidence and qualify")}</p>{selectedOpportunity.application_url ? <a href={String(selectedOpportunity.application_url)} target="_blank" rel="noreferrer">Open application page <ExternalLink size={13} /></a> : null}</section>
          <section className={styles.drawerSection}><h3>Proof gaps and required documents</h3><div className={styles.tagList}>{[...list(selectedOpportunity, "proof_gaps"), ...list(selectedOpportunity, "required_documents")].map((item) => <span key={item}>{item}</span>)}</div></section>
          <section className={styles.workflowRail}><WorkflowLink label="Qualification" id={selectedOpportunity.qualification_dossier_id} href="/ac-capital-os/qualification" icon={<ClipboardCheck size={17} />} /><WorkflowLink label="Funding Case" id={selectedOpportunity.case_id} href="/ac-capital-os/cases" icon={<BriefcaseBusiness size={17} />} /><WorkflowLink label="Capital Pipeline" id={selectedOpportunity.pipeline_record_id} href="/ac-capital-os/pipeline" icon={<CircleDollarSign size={17} />} /><WorkflowLink label="Coordinator Missions" id={selectedOpportunity.case_id ? coordinatorTasks.filter((row) => String(row.related_case_id) === String(selectedOpportunity.case_id)).length : null} href="/ac-capital-os/coordinator" icon={<ListChecks size={17} />} /></section>
          <div className={styles.quickActions}><button onClick={() => { setConversionMode("send-to-qualification"); setDialog("convert"); }}><ClipboardCheck /><strong>Send to Qualification</strong><span>Create evidence-bound dossier and proof gaps.</span></button><button onClick={() => { setConversionMode("create-case"); setDialog("convert"); }}><BriefcaseBusiness /><strong>Create Funding Case</strong><span>Build case stages, documents, risks and approval gate.</span></button><button onClick={() => { setConversionMode("add-to-pipeline"); setDialog("convert"); }}><CircleDollarSign /><strong>Add to Pipeline</strong><span>Create weighted internal capital pipeline record.</span></button><button onClick={() => { setConversionMode("create-missions"); setDialog("convert"); }}><UserRoundCheck /><strong>Create Missions</strong><span>Generate exact human tasks and handover sheet.</span></button></div>
          <details className={styles.jsonEvidence}><summary>Opportunity metadata</summary><pre>{pretty(selectedOpportunity.metadata)}</pre></details>
        </div> : null}
      </Drawer>

      <Drawer open={Boolean(selectedCluster) && dialog === null} title={selectedCluster ? txt(selectedCluster, "cluster_title", "Evidence cluster") : "Evidence cluster"} eyebrow="Canonical Opportunity Evidence Cluster" onClose={() => setSelectedCluster(null)} footer={<><SecondaryButton onClick={() => setSelectedCluster(null)}>Close</SecondaryButton>{selectedCluster?.canonical_opportunity_id ? <PrimaryButton onClick={() => { const opportunity = opportunityById.get(String(selectedCluster.canonical_opportunity_id)); if (opportunity) { setSelectedCluster(null); openOpportunity(opportunity); } }}>Open opportunity</PrimaryButton> : null}</>}>
        {selectedCluster ? <div className={styles.drawerContent}><FactGrid facts={[{ label: "Sources", value: num(selectedCluster, "source_count") }, { label: "Official", value: num(selectedCluster, "official_source_count") }, { label: "Evidence quality", value: `${num(selectedCluster, "evidence_quality_score")}%` }, { label: "Deadline confidence", value: `${num(selectedCluster, "deadline_confidence")}%` }, { label: "Eligibility confidence", value: `${num(selectedCluster, "eligibility_confidence")}%` }, { label: "Status", value: txt(selectedCluster, "status") }]} /><section className={styles.drawerSection}><h3>Supporting evidence</h3><div className={styles.clusterSources}>{selectedClusterMembers.map((row) => <button key={String(row.id)} onClick={() => { setSelectedCluster(null); openSource(row); }}><strong>{txt(row, "source_name")}</strong><span>{domainOf(row.source_url)} · {num(row, "source_confidence")}%</span></button>)}</div></section><details className={styles.jsonEvidence}><summary>Cluster metadata</summary><pre>{pretty(selectedCluster.metadata)}</pre></details></div> : null}
      </Drawer>

      <Drawer open={Boolean(selectedRun) && dialog === null} title={selectedRun ? txt(selectedRun, "run_label", txt(selectedRun, "agent_key", "Research run")) : "Research run"} eyebrow="Provider, Evidence & Internal Action Trace" onClose={() => setSelectedRun(null)} footer={<SecondaryButton onClick={() => setSelectedRun(null)}>Close inspection</SecondaryButton>}>
        {selectedRun ? <div className={styles.drawerContent}><FactGrid facts={[{ label: "Status", value: txt(selectedRun, "status") }, { label: "Phase", value: txt(selectedRun, "phase") }, { label: "Model", value: txt(selectedRun, "selected_analysis_model", txt(selectedRun, "provider_model")) }, { label: "Sources", value: num(selectedRun, "sources_persisted", num(selectedRun, "sources_captured")) }, { label: "Opportunities", value: num(selectedRun, "opportunities_created", num(selectedRun, "opportunities_detected")) }, { label: "Rejected", value: num(selectedRun, "opportunities_rejected") }]} /><section className={styles.drawerSection}><h3>Command</h3><p>{txt(selectedRun, "research_query", txt(selectedRun, "run_label"))}</p><p>{txt(selectedRun, "error_message", "No execution error recorded.")}</p></section><details open className={styles.jsonEvidence}><summary>Provider evidence</summary><pre>{pretty(selectedRun.provider_evidence || selectedRun.grounding_metadata)}</pre></details><details open className={styles.jsonEvidence}><summary>Internal actions</summary><pre>{pretty(selectedRun.internal_actions)}</pre></details><details className={styles.jsonEvidence}><summary>Complete result payload</summary><pre>{pretty(selectedRun.result_payload)}</pre></details></div> : null}
      </Drawer>

      <Dialog open={dialog === "research"} title="Run Targeted External Capital Research" eyebrow="Tavily Search + OpenRouter Analysis" wide onClose={() => { setDialog(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void runResearch()} disabled={action.state.phase === "submitting"}>Run live research</PrimaryButton></>}><div className={styles.researchGuard}><Globe2 size={22} /><div><strong>Real provider execution and workflow materialization</strong><p>Public evidence is searched, analyzed and persisted. Strong findings enter the validation queue or opportunity workbench. External communication and submission remain locked.</p></div></div><Field label="Research mission"><textarea value={researchQuery} onChange={(event) => setResearchQuery(event.target.value)} /></Field><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

      <Dialog open={dialog === "review-source"} title="Review Public Evidence Source" eyebrow="Source Validation Gate" onClose={() => { setDialog(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => selectedSource && void execute("review-source", { sourceId: selectedSource.id, ...reviewForm }, "Source review persisted.")}>Save review</PrimaryButton></>}><div className={styles.formGrid}><Field label="Decision"><select value={reviewForm.decision} onChange={(event) => setReviewForm({ ...reviewForm, decision: event.target.value })}><option value="validate">Validate</option><option value="secondary">Secondary evidence</option><option value="needs-review">Needs more review</option><option value="reject">Reject</option><option value="archive">Archive</option></select></Field><Field label="Officiality"><select value={reviewForm.officiality} onChange={(event) => setReviewForm({ ...reviewForm, officiality: event.target.value })}><option value="unverified">Unverified</option><option value="official">Official source</option><option value="secondary">Secondary source</option></select></Field><Field label="Confidence"><input type="number" min={0} max={100} value={reviewForm.confidence} onChange={(event) => setReviewForm({ ...reviewForm, confidence: Number(event.target.value) })} /></Field><Field label="Assigned reviewer"><input value={reviewForm.assignedReviewer} onChange={(event) => setReviewForm({ ...reviewForm, assignedReviewer: event.target.value })} /></Field><Field label="Review note"><textarea value={reviewForm.note} onChange={(event) => setReviewForm({ ...reviewForm, note: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

      <Dialog open={dialog === "promote-source"} title="Create Canonical Opportunity" eyebrow="Evidence-to-Opportunity Conversion" wide onClose={() => { setDialog(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => selectedSource && void execute("create-opportunity-from-source", { sourceId: selectedSource.id, overrides: promoteForm }, "Canonical opportunity created from source evidence.")}>Create opportunity</PrimaryButton></>}><div className={styles.formGrid}><Field label="Opportunity title"><input value={promoteForm.title} onChange={(event) => setPromoteForm({ ...promoteForm, title: event.target.value })} /></Field><Field label="Organization"><input value={promoteForm.organizationName} onChange={(event) => setPromoteForm({ ...promoteForm, organizationName: event.target.value })} /></Field><Field label="Opportunity type"><input value={promoteForm.opportunityType} onChange={(event) => setPromoteForm({ ...promoteForm, opportunityType: event.target.value })} /></Field><Field label="Country"><input value={promoteForm.country} onChange={(event) => setPromoteForm({ ...promoteForm, country: event.target.value })} /></Field><Field label="Region"><input value={promoteForm.region} onChange={(event) => setPromoteForm({ ...promoteForm, region: event.target.value })} /></Field><Field label="Application status"><input value={promoteForm.applicationStatus} onChange={(event) => setPromoteForm({ ...promoteForm, applicationStatus: event.target.value })} /></Field><Field label="Deadline"><input type="date" value={promoteForm.deadline} onChange={(event) => setPromoteForm({ ...promoteForm, deadline: event.target.value })} /></Field><Field label="Funding amount / range"><input value={promoteForm.amountRangeLabel} onChange={(event) => setPromoteForm({ ...promoteForm, amountRangeLabel: event.target.value })} /></Field><Field label="Owner"><input value={promoteForm.owner} onChange={(event) => setPromoteForm({ ...promoteForm, owner: event.target.value })} /></Field><Field label="Next internal action"><textarea value={promoteForm.nextAction} onChange={(event) => setPromoteForm({ ...promoteForm, nextAction: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

      <Dialog open={dialog === "cluster"} title="Create Opportunity Evidence Cluster" eyebrow="Duplicate and Supporting Evidence Control" onClose={() => { setDialog(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void execute("create-cluster", { sourceIds: selectedSourceIds, clusterTitle: clusterForm.title }, "Evidence cluster created.")}>Create cluster</PrimaryButton></>}><Field label="Cluster title"><input value={clusterForm.title} onChange={(event) => setClusterForm({ title: event.target.value })} placeholder="Canonical program or opportunity name" /></Field><p>{selectedSourceIds.length} source records will be grouped. The strongest source becomes canonical and all originals remain traceable.</p><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

      <Dialog open={dialog === "deeper-research"} title="Request Deeper Research" eyebrow="Controlled Evidence Mission" onClose={() => { setDialog(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => selectedSource && void execute("request-deeper-research", { sourceId: selectedSource.id, researchQuery: deeperForm.query, note: deeperForm.note }, "Deeper research mission queued.")}>Queue mission</PrimaryButton></>}><Field label="Research query"><textarea value={deeperForm.query || `Find authoritative current evidence, eligibility rules, application status, deadline, amount and direct application path for: ${selectedSource ? txt(selectedSource, "source_name") : "this capital signal"}.`} onChange={(event) => setDeeperForm({ ...deeperForm, query: event.target.value })} /></Field><Field label="Internal note"><textarea value={deeperForm.note} onChange={(event) => setDeeperForm({ ...deeperForm, note: event.target.value })} /></Field><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

      <Dialog open={dialog === "convert"} title="Materialize Internal Capital Workflow" eyebrow="Qualification · Case · Pipeline · Missions" onClose={() => { setDialog(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => selectedOpportunity && void execute(conversionMode, { opportunityId: selectedOpportunity.id, reason: "Approved internal workflow materialization from Radar workbench." }, "Connected AC Capital workflow records created.")}>Execute internal handoff</PrimaryButton></>}><div className={styles.conversionPreview}><GitMerge size={26} /><strong>{selectedOpportunity ? txt(selectedOpportunity, "title") : "Select an opportunity"}</strong><p>{conversionMode === "send-to-qualification" ? "Create qualification dossier, criteria, proof gaps and committee handoff." : conversionMode === "create-case" ? "Create qualification plus funding case stages, documents, risks and approval gate." : conversionMode === "add-to-pipeline" ? "Create qualification, case and internal pipeline record." : conversionMode === "create-missions" ? "Create qualification, case, pipeline and coordinator missions." : "Materialize the complete internal chain: qualification → case → pipeline → coordinator missions."}</p><div className={styles.conversionSteps}><span>Evidence</span><span>Qualification</span><span>Case Factory</span><span>Pipeline</span><span>Human Missions</span></div><TruthChip kind="approval">External outreach, application and submission remain locked</TruthChip></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

      <Dialog open={dialog === "disposition"} title="Opportunity Disposition" eyebrow="Monitor, Qualify or Reject" onClose={() => { setDialog(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => selectedOpportunity && void execute("opportunity-disposition", { opportunityId: selectedOpportunity.id, ...dispositionForm }, "Opportunity disposition updated.")}>Save disposition</PrimaryButton></>}><div className={styles.formGrid}><Field label="Disposition"><select value={dispositionForm.disposition} onChange={(event) => setDispositionForm({ ...dispositionForm, disposition: event.target.value })}><option value="watchlist">Monitor / Watchlist</option><option value="qualify">Ready for qualification</option><option value="reject">Reject</option></select></Field><Field label="Owner"><input value={dispositionForm.owner} onChange={(event) => setDispositionForm({ ...dispositionForm, owner: event.target.value })} /></Field><Field label="Reason"><textarea value={dispositionForm.reason} onChange={(event) => setDispositionForm({ ...dispositionForm, reason: event.target.value })} /></Field><Field label="Next action"><textarea value={dispositionForm.nextAction} onChange={(event) => setDispositionForm({ ...dispositionForm, nextAction: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

      <Dialog open={dialog === "note"} title="Add Internal Opportunity Note" eyebrow="Institutional Memory" onClose={() => { setDialog(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => selectedOpportunity && void execute("add-note", { opportunityId: selectedOpportunity.id, note: noteText }, "Internal note recorded.")}>Save note</PrimaryButton></>}><Field label="Internal note"><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} /></Field><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>
    </AcCapitalShell>
  );
}

function SourceCard({ row, selected, onToggle, onOpen }: { row: Row; selected: boolean; onToggle: () => void; onOpen: () => void }) {
  const status = txt(row, "lifecycle_status", txt(row, "verification_status", "captured"));
  return <article className={styles.sourceCard}><div className={styles.sourceTop}><label onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected} onChange={onToggle} /></label><StatusBadge value={status} /><span>{num(row, "source_confidence")}%</span></div><button onClick={onOpen}><strong>{txt(row, "source_name", "External evidence source")}</strong><p>{txt(row, "content_excerpt", txt(row, "notes", "Open the source to inspect evidence and provenance.")).slice(0, 220)}</p><div className={styles.sourceMeta}><span><Globe2 size={13} /> {txt(row, "source_domain", domainOf(row.source_url))}</span><span><CalendarClock size={13} /> {shortDate(row.created_at)}</span><span><Link2 size={13} /> {row.linked_opportunity_id ? "Opportunity linked" : "Not converted"}</span></div></button><footer><span>{txt(row, "officiality", "unverified")}</span><span>{row.cluster_id ? "clustered" : "single source"}</span><span>{txt(row, "assigned_reviewer", "unassigned")}</span></footer></article>;
}

function OpportunityCard({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const days = daysUntil(row.deadline);
  return <button className={styles.opportunityCard} onClick={onOpen}><div className={styles.opportunityHeader}><StatusBadge value={txt(row, "workflow_status", txt(row, "status", "candidate"))} /><span className={days != null && days <= 14 ? styles.deadlineHot : ""}>{days == null ? "No deadline" : days < 0 ? "Expired" : `${days} days`}</span></div><strong>{txt(row, "title", "Capital opportunity")}</strong><p>{txt(row, "organization_name", txt(row, "source_name", "Organization not confirmed"))} · {txt(row, "opportunity_type")}</p><div className={styles.cardScores}><span>Fit <b>{num(row, "strategic_value_score")}%</b></span><span>Proof <b>{num(row, "evidence_quality_score", num(row, "source_confidence"))}%</b></span><span>Eligibility <b>{num(row, "eligibility_confidence")}%</b></span></div><div className={styles.cardFacts}><span>{txt(row, "country", txt(row, "region"))}</span><span>{row.amount_max ? formatDh(row.amount_max) : txt(row, "amount_range_label", "Amount unconfirmed")}</span><span>{txt(row, "owner", "Unassigned")}</span></div><footer><span className={row.qualification_dossier_id ? styles.linked : ""}>Qualification</span><span className={row.case_id ? styles.linked : ""}>Case</span><span className={row.pipeline_record_id ? styles.linked : ""}>Pipeline</span><ArrowUpRight size={15} /></footer></button>;
}

function Score({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><strong>{value}%</strong><i><b style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i></div>;
}

function WorkflowLink({ label, id, href, icon }: { label: string; id: unknown; href: string; icon: React.ReactNode }) {
  const active = Boolean(id && String(id) !== "0");
  return <a href={active ? href : undefined} className={active ? styles.workflowLinked : styles.workflowMissing}>{icon}<div><strong>{label}</strong><span>{active ? `Connected · ${String(id).slice(0, 8)}` : "Not created"}</span></div>{active ? <ArrowUpRight size={14} /> : null}</a>;
}
