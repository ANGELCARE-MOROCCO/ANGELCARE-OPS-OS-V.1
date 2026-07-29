"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Clock3,
  Database,
  Eye,
  FileCheck2,
  GitBranch,
  Link2,
  ListChecks,
  PauseCircle,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { Dialog, Drawer } from "../../core/Overlay";
import type { CapitalActor, Row } from "../../core/types";
import styles from "./orchestrator.module.css";

const text = (value: unknown) => String(value ?? "").trim();
const count = (value: unknown) => Number(value || 0);
const record = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const stringList = (value: unknown): string[] => Array.isArray(value) ? value.map(text).filter(Boolean) : [];
const pretty = (value: unknown) => {
  try { return JSON.stringify(value ?? null, null, 2); } catch { return text(value); }
};
const formatDate = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "—";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const workspaceRoutes: Record<string, string> = {
  orchestrator: "/ac-capital-os/orchestrator",
  radar: "/ac-capital-os/radar",
  "opportunity-radar": "/ac-capital-os/radar",
  qualification: "/ac-capital-os/qualification",
  funders: "/ac-capital-os/funders",
  doctrine: "/ac-capital-os/doctrine",
  cases: "/ac-capital-os/cases",
  "data-room": "/ac-capital-os/data-room",
  pipeline: "/ac-capital-os/pipeline",
  coordinator: "/ac-capital-os/coordinator",
  approvals: "/ac-capital-os/approvals",
  reports: "/ac-capital-os/reports",
  learning: "/ac-capital-os/learning",
  "ai-operations": "/ac-capital-os/ai-control",
};

const entityRoutes: Record<string, string> = {
  source: "/ac-capital-os/radar",
  opportunity: "/ac-capital-os/radar",
  qualification: "/ac-capital-os/qualification",
  case: "/ac-capital-os/cases",
  pipeline: "/ac-capital-os/pipeline",
  approval: "/ac-capital-os/approvals",
  "coordinator-task": "/ac-capital-os/coordinator",
  document: "/ac-capital-os/data-room",
  funder: "/ac-capital-os/funders",
};

type InspectorKind = "workflow" | "agent" | "event" | "integrity" | "approval" | "doctrine" | "metric";
type InspectorState = { kind: InspectorKind; row?: Row; metric?: string } | null;

type CommandResult = {
  action: string;
  title: string;
  data: Row;
  completedAt: string;
};

const stageDefinitions = [
  { key: "intake", label: "Intake", detail: "Evidence and opportunity intake" },
  { key: "qualification", label: "Qualification", detail: "Underwriting and proof gaps" },
  { key: "case-production", label: "Case production", detail: "Funding case and proof pack" },
  { key: "founder-approval", label: "Founder approval", detail: "Version-bound authority" },
  { key: "coordinator-execution", label: "Execution", detail: "Human-controlled external action" },
  { key: "learning", label: "Outcome & learning", detail: "Result and doctrine proposals" },
] as const;

function statusLabel(value: unknown) {
  const raw = text(value) || "unknown";
  return raw.replaceAll("-", " ");
}

function apiErrorMessage(payload: Row, status: number) {
  const nested = record(payload.error);
  return text(
    nested.message
    || nested.code
    || payload.error
    || payload.message
    || payload.code
    || `ORCHESTRATOR_HTTP_${status}`,
  );
}

export function OrchestratorPage({ actor }: { actor: CapitalActor }) {
  const router = useRouter();
  const [data, setData] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [inspector, setInspector] = useState<InspectorState>(null);
  const [actionResult, setActionResult] = useState<CommandResult | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/ac-capital-os/orchestrator", { cache: "no-store" });
      const raw = await response.text();
      let payload: Row = {};
      try { payload = raw ? JSON.parse(raw) as Row : {}; }
      catch { throw new Error(`ORCHESTRATOR_API_INVALID_RESPONSE:HTTP_${response.status}:${raw.slice(0, 500)}`); }
      if (!response.ok || payload.ok === false) throw new Error(apiErrorMessage(payload, response.status));
      setData(record(payload.data || payload));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : text(loadError) || "ORCHESTRATOR_LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setDecisionNote(""); }, [inspector]);

  const act = useCallback(async (action: string, payload: Row = {}, title = "Capital command completed") => {
    setBusy(action);
    setError("");
    try {
      const response = await fetch("/api/ac-capital-os/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const raw = await response.text();
      let body: Row = {};
      try { body = raw ? JSON.parse(raw) as Row : {}; }
      catch { throw new Error(`ORCHESTRATOR_ACTION_INVALID_RESPONSE:HTTP_${response.status}:${raw.slice(0, 500)}`); }
      if (!response.ok || body.ok === false) throw new Error(apiErrorMessage(body, response.status));
      const result = record(body.data || body);
      setActionResult({ action, title, data: result, completedAt: new Date().toISOString() });
      await load();
      return result;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : text(actionError) || "ORCHESTRATOR_ACTION_FAILED");
      return null;
    } finally {
      setBusy("");
    }
  }, [load]);

  const workflows = rows(data.workflows);
  const events = rows(data.events);
  const steps = rows(data.steps);
  const agents = rows(data.agents);
  const approvals = rows(data.approvals);
  const integrity = rows(data.integrity);
  const doctrine = rows(data.doctrine);
  const links = rows(data.links);
  const loadWarnings = rows(data.loadWarnings);

  const activeWorkflows = workflows.filter((item) => ["active", "blocked", "paused", "waiting-approval"].includes(text(item.status)));
  const queuedEvents = events.filter((item) => ["queued", "processing"].includes(text(item.status)));
  const criticalIssues = integrity.filter((item) => text(item.status) === "open" && ["critical", "high"].includes(text(item.severity)));
  const pendingApprovals = approvals.filter((item) => text(item.status) === "pending");
  const enabledAgents = agents.filter((item) => item.enabled === true);

  const recommendation = useMemo(() => {
    if (pendingApprovals[0]) return { type: "approval" as const, row: pendingApprovals[0], title: "Founder decision required", detail: text(pendingApprovals[0].decision_requested) || "Review the exact approved version and evidence package.", action: "Open approval" };
    if (criticalIssues[0]) return { type: "integrity" as const, row: criticalIssues[0], title: "Repair the highest-risk broken chain", detail: text(criticalIssues[0].recommended_action) || text(criticalIssues[0].title), action: "Inspect integrity" };
    const failed = events.find((item) => text(item.status) === "failed");
    if (failed) return { type: "event" as const, row: failed, title: "Recover a failed department event", detail: text(failed.error_message) || text(failed.event_type), action: "Inspect failure" };
    if (queuedEvents[0]) return { type: "event" as const, row: queuedEvents[0], title: "Process the next queued event", detail: `${text(queuedEvents[0].event_type)} · ${text(queuedEvents[0].entity_type)}`, action: "Open queued event" };
    const blocked = activeWorkflows.find((item) => ["blocked", "paused"].includes(text(item.status)));
    if (blocked) return { type: "workflow" as const, row: blocked, title: "Unblock a capital lifecycle", detail: text(blocked.blocked_reason) || text(blocked.next_action), action: "Open workflow" };
    if (activeWorkflows[0]) return { type: "workflow" as const, row: activeWorkflows[0], title: "Advance the most active capital lifecycle", detail: text(activeWorkflows[0].next_action) || text(activeWorkflows[0].current_stage), action: "Open workflow" };
    return { type: "route" as const, row: {}, title: "Start from verified market evidence", detail: "Open Opportunity Radar, validate a source, and materialize the first controlled capital lifecycle.", action: "Open Radar" };
  }, [activeWorkflows, criticalIssues, events, pendingApprovals, queuedEvents]);

  function openRecommendation() {
    if (recommendation.type === "route") router.push("/ac-capital-os/radar");
    else setInspector({ kind: recommendation.type, row: recommendation.row });
  }

  function navigateToWorkspace(key: unknown) {
    router.push(workspaceRoutes[text(key)] || "/ac-capital-os/orchestrator");
  }

  function navigateToEntity(type: unknown) {
    router.push(entityRoutes[text(type)] || "/ac-capital-os/orchestrator");
  }

  const metricRows = (metric: string) => {
    if (metric === "workflows") return activeWorkflows;
    if (metric === "events") return queuedEvents;
    if (metric === "integrity") return criticalIssues;
    if (metric === "approvals") return pendingApprovals;
    return enabledAgents;
  };

  const selected = inspector?.row || {};
  const selectedWorkflowSteps = inspector?.kind === "workflow" ? steps.filter((item) => text(item.workflow_id) === text(selected.id)) : [];
  const selectedWorkflowLinks = inspector?.kind === "workflow" ? links.filter((item) => text(item.from_id) === text(selected.id) || text(item.to_id) === text(selected.id)) : [];
  const selectedAgentEvents = inspector?.kind === "agent" ? events.filter((item) => text(item.source_workspace) === text(selected.workspace_key) || stringList(selected.trigger_events).includes(text(item.event_type))) : [];

  const drawerTitle = inspector?.kind === "workflow" ? text(selected.title) || "Capital lifecycle"
    : inspector?.kind === "agent" ? text(selected.agent_name) || "Capital agent"
      : inspector?.kind === "event" ? text(selected.event_type) || "Department event"
        : inspector?.kind === "integrity" ? text(selected.title) || "Integrity issue"
          : inspector?.kind === "approval" ? text(selected.approval_type) || "Founder approval"
            : inspector?.kind === "doctrine" ? "Compiled capital doctrine"
              : inspector?.kind === "metric" ? `${statusLabel(inspector.metric)} · operating records`
                : "Capital inspection";

  const drawerEyebrow = inspector?.kind === "workflow" ? "Complete lifecycle trace"
    : inspector?.kind === "agent" ? "AI executive team control"
      : inspector?.kind === "event" ? "Event payload and execution evidence"
        : inspector?.kind === "integrity" ? "Broken-chain prevention"
          : inspector?.kind === "approval" ? "Version-bound founder authority"
            : inspector?.kind === "doctrine" ? "Executable institutional policy"
              : "Operational record inspection";

  const operationSummary = actionResult ? (() => {
    const result = actionResult.data;
    if (actionResult.action === "process-queue") return `${count(result.processed)} event(s) processed.`;
    if (actionResult.action === "integrity-scan") return `${count(result.detected)} integrity issue(s) detected.`;
    if (actionResult.action === "compile-doctrine") return `Doctrine compilation ${text(result.status) || "completed"}.`;
    if (actionResult.action === "approval-decision") return `Approval marked ${text(record(result.approval).status)}.`;
    if (actionResult.action === "set-agent-enabled") return `Agent ${record(result.agent).enabled ? "enabled" : "paused"}.`;
    if (actionResult.action.includes("event") || actionResult.action === "process-event") return "Event command persisted with evidence.";
    if (actionResult.action.includes("integrity")) return "Integrity decision persisted.";
    if (actionResult.action === "workflow-command") return `Workflow marked ${text(record(result.workflow).status)}.`;
    return "Command persisted successfully.";
  })() : "";

  return (
    <AcCapitalShell
      actor={actor}
      workspaceKey="orchestrator"
      title="Capital Executive Orchestrator"
      subtitle="One governed command tower supervising the complete research, qualification, proof, case, pipeline, approval, coordinator, reporting and learning lifecycle."
      envelope={null}
      insights={[
        { label: "Next move", value: recommendation.title },
        { label: "Active workflows", value: String(activeWorkflows.length) },
        { label: "Queued events", value: String(queuedEvents.length) },
        { label: "Founder decisions", value: String(pendingApprovals.length), tone: pendingApprovals.length ? "warning" : "success" },
      ]}
    >
      <main className={styles.page}>
        <section className={styles.commandHero}>
          <div className={styles.heroCopy}>
            <span><BrainCircuit size={16} /> CAPITAL EXECUTIVE COMMAND</span>
            <h2>Supervise the AI department, intervene by exception, and open every decision down to its evidence.</h2>
            <p>Every card, metric, lifecycle, agent, event, integrity issue, approval and doctrine compilation is now inspectable and actionable.</p>
          </div>
          <div className={styles.commandActions}>
            <button onClick={() => void act("process-queue", { maxEvents: 20 }, "Department queue processed")} disabled={Boolean(busy)}><Play size={16} /> {busy === "process-queue" ? "Processing…" : "Process queue"}</button>
            <button onClick={() => void act("integrity-scan", {}, "Integrity scan completed")} disabled={Boolean(busy)}><ShieldCheck size={16} /> {busy === "integrity-scan" ? "Scanning…" : "Integrity scan"}</button>
            <button onClick={() => void act("compile-doctrine", {}, "Doctrine compilation completed")} disabled={Boolean(busy)}><Sparkles size={16} /> {busy === "compile-doctrine" ? "Compiling…" : "Compile doctrine"}</button>
            <button className={styles.iconButton} onClick={() => void load()} disabled={loading} aria-label="Refresh Orchestrator"><RefreshCw size={17} className={loading ? styles.spin : ""} /></button>
          </div>
        </section>

        {error ? <section className={styles.errorBanner}><AlertTriangle size={18} /><div><strong>Orchestrator command requires attention</strong><span>{error}</span></div><button onClick={() => setError("")}>Dismiss</button></section> : null}
        {loadWarnings.length ? <section className={styles.warningBanner}><AlertTriangle size={18} /><div><strong>Snapshot loaded with compatibility warnings</strong><span>{loadWarnings.map((item) => `${text(item.table)}: ${text(item.error) || "alternate ordering used"}`).join(" · ")}</span></div></section> : null}

        <section className={styles.recommendation}>
          <div className={styles.recommendationIcon}><Zap size={24} /></div>
          <div><span>NEXT SAFEST MOVE</span><h3>{recommendation.title}</h3><p>{recommendation.detail}</p></div>
          <button onClick={openRecommendation}>{recommendation.action}<ChevronRight size={17} /></button>
        </section>

        <section className={styles.metrics}>
          {[
            { key: "workflows", label: "Active workflows", value: activeWorkflows.length, icon: Workflow, detail: "Live, blocked, paused or waiting approval" },
            { key: "events", label: "Queued events", value: queuedEvents.length, icon: Activity, detail: "Ready or currently processing" },
            { key: "integrity", label: "Critical integrity", value: criticalIssues.length, icon: AlertTriangle, detail: "High-risk broken lifecycle links" },
            { key: "approvals", label: "Pending approvals", value: pendingApprovals.length, icon: ShieldCheck, detail: "Founder decisions awaiting authority" },
            { key: "agents", label: "Enabled agents", value: enabledAgents.length, icon: BrainCircuit, detail: "Internal AI executive team" },
          ].map(({ key, label, value, icon: Icon, detail }) => (
            <button key={key} onClick={() => setInspector({ kind: "metric", metric: key })}>
              <Icon size={20} />
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
              <ChevronRight size={16} className={styles.metricArrow} />
            </button>
          ))}
        </section>

        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <div><span>DEPARTMENT FLOW</span><h3>Live capital lifecycle board</h3><p>Open any card to inspect its connected opportunity, qualification, case, pipeline, steps and evidence.</p></div>
            <button onClick={() => router.push("/ac-capital-os/radar")}>Open Radar <ArrowUpRight size={15} /></button>
          </header>
          <div className={styles.lifecycleBoard}>
            {stageDefinitions.map((stage) => {
              const lane = workflows.filter((item) => text(item.current_stage) === stage.key || (stage.key === "intake" && !stageDefinitions.some((known) => known.key === text(item.current_stage))));
              return (
                <article key={stage.key} className={styles.lifecycleLane}>
                  <header><div><span>{stage.label}</span><small>{stage.detail}</small></div><strong>{lane.length}</strong></header>
                  <div>
                    {lane.slice(0, 8).map((workflowRow) => (
                      <button key={text(workflowRow.id)} className={styles.workflowCard} onClick={() => setInspector({ kind: "workflow", row: workflowRow })}>
                        <span data-status={text(workflowRow.status)}>{statusLabel(workflowRow.status)}</span>
                        <strong>{text(workflowRow.title) || "Capital lifecycle"}</strong>
                        <p>{text(workflowRow.next_action) || text(workflowRow.blocked_reason) || "Awaiting orchestrator decision"}</p>
                        <footer><Clock3 size={13} /> {formatDate(workflowRow.updated_at || workflowRow.created_at)}<ChevronRight size={14} /></footer>
                      </button>
                    ))}
                    {!lane.length ? <div className={styles.laneEmpty}>No workflow in this stage.</div> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <header className={styles.panelHeader}><div><span>AI EXECUTIVE TEAM</span><h3>Capital agents and operational authority</h3><p>Inspect mission, provider policy, triggers, permissions, workload and recent evidence.</p></div><BrainCircuit size={22} /></header>
            <div className={styles.agentGrid}>
              {agents.map((agent) => {
                const agentEvents = events.filter((event) => text(event.source_workspace) === text(agent.workspace_key) || stringList(agent.trigger_events).includes(text(event.event_type)));
                return (
                  <button key={text(agent.id)} onClick={() => setInspector({ kind: "agent", row: agent })} className={styles.agentCard}>
                    <div className={styles.agentTop}><i data-enabled={agent.enabled === true} /><span>{agent.enabled === true ? "Enabled" : "Paused"}</span><strong>{agentEvents.filter((event) => ["queued", "processing"].includes(text(event.status))).length} assigned</strong></div>
                    <h4>{text(agent.agent_name)}</h4>
                    <p>{text(agent.description) || text(agent.capability)}</p>
                    <footer><span>{text(agent.workspace_key)}</span><span>{text(agent.capability).replaceAll("_", " ")}</span><ChevronRight size={15} /></footer>
                  </button>
                );
              })}
              {!agents.length ? <button className={styles.emptyAction} onClick={() => void load()}><RefreshCw size={18} />Reload the agent registry</button> : null}
            </div>
          </article>

          <article className={styles.panel}>
            <header className={styles.panelHeader}><div><span>EXECUTIVE RECOMMENDATION</span><h3>Decision context and operating posture</h3><p>The safest next action is computed from approvals, integrity, failures, queue pressure and active lifecycles.</p></div><Zap size={22} /></header>
            <div className={styles.recommendationDetail}>
              <span>Priority recommendation</span><h4>{recommendation.title}</h4><p>{recommendation.detail}</p>
              <button onClick={openRecommendation}>{recommendation.action}<ChevronRight size={16} /></button>
            </div>
            <div className={styles.healthMatrix}>
              <button onClick={() => setInspector({ kind: "metric", metric: "events" })}><Activity size={17} /><div><span>Queue pressure</span><strong>{queuedEvents.length ? `${queuedEvents.length} event(s)` : "Clear"}</strong></div></button>
              <button onClick={() => setInspector({ kind: "metric", metric: "integrity" })}><ShieldCheck size={17} /><div><span>Integrity posture</span><strong>{criticalIssues.length ? `${criticalIssues.length} critical/high` : "Controlled"}</strong></div></button>
              <button onClick={() => setInspector({ kind: "doctrine", row: doctrine[0] || {} })}><Sparkles size={17} /><div><span>Doctrine state</span><strong>{doctrine[0] ? statusLabel(doctrine[0].status) : "Not compiled"}</strong></div></button>
              <button onClick={() => setInspector({ kind: "metric", metric: "agents" })}><BrainCircuit size={17} /><div><span>AI workforce</span><strong>{enabledAgents.length}/{agents.length || 0} enabled</strong></div></button>
            </div>
          </article>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <header className={styles.panelHeader}><div><span>EVENT BUS</span><h3>Department execution evidence</h3><p>Each row opens the exact payload, entity, retries, failure and processing actions.</p></div><Activity size={22} /></header>
            <div className={styles.eventList}>
              {events.slice(0, 30).map((event) => (
                <button key={text(event.id)} onClick={() => setInspector({ kind: "event", row: event })}>
                  <div className={styles.eventIcon} data-status={text(event.status)}><Activity size={16} /></div>
                  <div><strong>{text(event.event_type)}</strong><span>{text(event.entity_type)} · {text(event.source_workspace)}</span><p>{text(event.error_message) || `Priority ${text(event.priority) || "normal"}`}</p></div>
                  <time>{formatDate(event.created_at)}</time><ChevronRight size={15} />
                </button>
              ))}
              {!events.length ? <button className={styles.emptyAction} onClick={() => router.push("/ac-capital-os/radar")}><Database size={18} />No event yet — validate Radar evidence to start the chain</button> : null}
            </div>
          </article>

          <article className={styles.panel}>
            <header className={styles.panelHeader}><div><span>INTEGRITY CONTROL</span><h3>Broken-chain prevention</h3><p>Open each issue to inspect the affected record, evidence snapshot, risk and resolution action.</p></div><ShieldCheck size={22} /></header>
            <div className={styles.integrityList}>
              {integrity.filter((item) => text(item.status) === "open").slice(0, 20).map((issue) => (
                <button key={text(issue.id)} onClick={() => setInspector({ kind: "integrity", row: issue })} data-severity={text(issue.severity)}>
                  <AlertTriangle size={17} /><div><span>{text(issue.severity)} · {text(issue.issue_code)}</span><strong>{text(issue.title)}</strong><p>{text(issue.recommended_action)}</p></div><ChevronRight size={15} />
                </button>
              ))}
              {!integrity.filter((item) => text(item.status) === "open").length ? <div className={styles.controlledState}><CheckCircle2 size={24} /><strong>No open integrity issue detected</strong><span>Run a fresh integrity scan after meaningful workflow changes.</span><button onClick={() => void act("integrity-scan", {}, "Integrity scan completed")}>Run scan</button></div> : null}
            </div>
          </article>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <header className={styles.panelHeader}><div><span>FOUNDER AUTHORITY</span><h3>Universal approval decisions</h3><p>Inspect exact object version, snapshot, evidence and downstream authority before deciding.</p></div><ShieldCheck size={22} /></header>
            <div className={styles.approvalList}>
              {approvals.slice(0, 20).map((approval) => (
                <button key={text(approval.id)} onClick={() => setInspector({ kind: "approval", row: approval })}>
                  <div><span data-status={text(approval.status)}>{statusLabel(approval.status)}</span><strong>{text(approval.approval_type)}</strong><p>{text(approval.decision_requested)}</p><small>{text(approval.object_type)} · version {text(approval.object_version)}</small></div><ChevronRight size={16} />
                </button>
              ))}
              {!approvals.length ? <button className={styles.emptyAction} onClick={() => router.push("/ac-capital-os/cases")}><FileCheck2 size={18} />No approval yet — open Case Factory</button> : null}
            </div>
          </article>

          <article className={styles.panel}>
            <header className={styles.panelHeader}><div><span>EXECUTABLE DOCTRINE</span><h3>Latest compiled capital brain</h3><p>Inspect rules, prompts, skills, injections, conflicts and the exact compilation evidence.</p></div><Sparkles size={22} /></header>
            {doctrine[0] ? (
              <button className={styles.doctrineCard} onClick={() => setInspector({ kind: "doctrine", row: doctrine[0] })}>
                <div><span data-status={text(doctrine[0].status)}>{statusLabel(doctrine[0].status)}</span><strong>{text(doctrine[0].compilation_key)}</strong><p>{Object.keys(record(doctrine[0].effective_bundle)).length} doctrine domains compiled.</p><small>{formatDate(doctrine[0].compiled_at)}</small></div><ChevronRight size={18} />
              </button>
            ) : (
              <div className={styles.controlledState}><Sparkles size={24} /><strong>No compiled department doctrine</strong><span>Compile the Doctrine Vault before relying on agent-wide policy enforcement.</span><button onClick={() => void act("compile-doctrine", {}, "Doctrine compilation completed")}>Compile doctrine</button></div>
            )}
          </article>
        </section>
      </main>

      <Drawer
        open={Boolean(inspector)}
        title={drawerTitle}
        eyebrow={drawerEyebrow}
        onClose={() => setInspector(null)}
        footer={<>
          <button className={styles.secondaryButton} onClick={() => setInspector(null)}>Close</button>
          {inspector?.kind === "workflow" ? <button className={styles.primaryButton} onClick={() => navigateToEntity(selected.root_entity_type)}>Open connected workspace <ArrowUpRight size={15} /></button> : null}
          {inspector?.kind === "agent" ? <button className={styles.primaryButton} onClick={() => navigateToWorkspace(selected.workspace_key)}>Open agent workspace <ArrowUpRight size={15} /></button> : null}
          {inspector?.kind === "event" ? <button className={styles.primaryButton} onClick={() => navigateToWorkspace(selected.source_workspace)}>Open source workspace <ArrowUpRight size={15} /></button> : null}
          {inspector?.kind === "integrity" ? <button className={styles.primaryButton} onClick={() => navigateToEntity(selected.entity_type)}>Open affected workspace <ArrowUpRight size={15} /></button> : null}
          {inspector?.kind === "approval" ? <button className={styles.primaryButton} onClick={() => navigateToEntity(selected.object_type)}>Open governed object <ArrowUpRight size={15} /></button> : null}
          {inspector?.kind === "doctrine" ? <button className={styles.primaryButton} onClick={() => router.push("/ac-capital-os/doctrine")}>Open Doctrine Vault <ArrowUpRight size={15} /></button> : null}
        </>}
      >
        {inspector?.kind === "metric" ? (
          <div className={styles.drawerStack}>
            <section className={styles.drawerIntro}><ListChecks size={22} /><div><span>OPERATING RECORDS</span><h3>{statusLabel(inspector.metric)}</h3><p>Select a record to open its complete inspection drawer.</p></div></section>
            <div className={styles.drawerRecordList}>
              {metricRows(inspector.metric || "").map((item) => {
                const kind: InspectorKind = inspector.metric === "workflows" ? "workflow" : inspector.metric === "events" ? "event" : inspector.metric === "integrity" ? "integrity" : inspector.metric === "approvals" ? "approval" : "agent";
                return <button key={text(item.id)} onClick={() => setInspector({ kind, row: item })}><div><strong>{text(item.title || item.agent_name || item.event_type || item.approval_type || item.issue_code)}</strong><span>{statusLabel(item.status || (item.enabled ? "enabled" : "paused"))}</span><p>{text(item.next_action || item.description || item.error_message || item.decision_requested || item.recommended_action)}</p></div><ChevronRight size={16} /></button>;
              })}
              {!metricRows(inspector.metric || "").length ? <div className={styles.drawerEmpty}>No record currently matches this operating view.</div> : null}
            </div>
          </div>
        ) : null}

        {inspector?.kind === "workflow" ? (
          <div className={styles.drawerStack}>
            <section className={styles.factGrid}>
              <article><span>Status</span><strong data-status={text(selected.status)}>{statusLabel(selected.status)}</strong></article>
              <article><span>Current stage</span><strong>{statusLabel(selected.current_stage)}</strong></article>
              <article><span>Automation</span><strong>{statusLabel(selected.automation_mode)}</strong></article>
              <article><span>Owner</span><strong>{text(selected.owner) || "Unassigned"}</strong></article>
            </section>
            <section className={styles.drawerSection}><span>NEXT ACTION</span><h3>{text(selected.next_action) || "No next action recorded"}</h3>{text(selected.blocked_reason) ? <p className={styles.dangerText}>{text(selected.blocked_reason)}</p> : null}</section>
            <section className={styles.connectedGrid}>
              {[
                ["Opportunity", selected.opportunity_id, "/ac-capital-os/radar"],
                ["Qualification", selected.qualification_dossier_id, "/ac-capital-os/qualification"],
                ["Funding case", selected.case_id, "/ac-capital-os/cases"],
                ["Pipeline", selected.pipeline_record_id, "/ac-capital-os/pipeline"],
              ].map(([label, id, route]) => <button key={String(label)} disabled={!id} onClick={() => router.push(String(route))}><Link2 size={17} /><span>{label}</span><strong>{id ? text(id).slice(0, 12) : "Not created"}</strong><ChevronRight size={14} /></button>)}
            </section>
            <section className={styles.drawerSection}><header><div><span>EXECUTION STEPS</span><h3>Lifecycle evidence timeline</h3></div><strong>{selectedWorkflowSteps.length}</strong></header><div className={styles.timeline}>{selectedWorkflowSteps.map((step) => <article key={text(step.id)}><i data-status={text(step.status)} /><div><strong>{statusLabel(step.step_key)}</strong><span>{text(step.workspace_key)} · {statusLabel(step.capability)}</span><p>{text(step.error_message) || `Status ${statusLabel(step.status)}`}</p><time>{formatDate(step.completed_at || step.updated_at || step.created_at)}</time></div></article>)}{!selectedWorkflowSteps.length ? <div className={styles.drawerEmpty}>No execution step recorded yet.</div> : null}</div></section>
            <section className={styles.drawerSection}><header><div><span>TRACE GRAPH</span><h3>Connected entity links</h3></div><strong>{selectedWorkflowLinks.length}</strong></header><div className={styles.linkList}>{selectedWorkflowLinks.map((item) => <article key={text(item.id)}><GitBranch size={16} /><div><strong>{text(item.from_type)} → {text(item.to_type)}</strong><span>{statusLabel(item.relation_type)}</span></div></article>)}{!selectedWorkflowLinks.length ? <div className={styles.drawerEmpty}>No explicit entity link recorded.</div> : null}</div></section>
            <section className={styles.drawerCommands}><button onClick={() => void act("workflow-command", { workflowId: selected.id, command: "resume" }, "Workflow resumed")} disabled={Boolean(busy)}><CirclePlay size={16} /> Resume</button><button onClick={() => void act("workflow-command", { workflowId: selected.id, command: "pause" }, "Workflow paused")} disabled={Boolean(busy)}><CirclePause size={16} /> Pause</button><button className={styles.dangerButton} onClick={() => void act("workflow-command", { workflowId: selected.id, command: "cancel" }, "Workflow cancelled")} disabled={Boolean(busy)}><XCircle size={16} /> Cancel</button></section>
            <details className={styles.jsonDetails}><summary>Complete workflow trace</summary><pre>{pretty(selected.trace)}</pre></details>
          </div>
        ) : null}

        {inspector?.kind === "agent" ? (
          <div className={styles.drawerStack}>
            <section className={styles.agentIdentity}><div className={styles.agentOrb}><BrainCircuit size={28} /></div><div><span>{selected.enabled ? "ENABLED INTERNAL AGENT" : "PAUSED AGENT"}</span><h3>{text(selected.agent_name)}</h3><p>{text(selected.description)}</p></div></section>
            <section className={styles.factGrid}><article><span>Workspace</span><strong>{text(selected.workspace_key)}</strong></article><article><span>Capability</span><strong>{statusLabel(selected.capability)}</strong></article><article><span>Automation</span><strong>{statusLabel(selected.automation_level)}</strong></article><article><span>External authority</span><strong>{selected.external_actions_allowed ? "Allowed" : "Locked"}</strong></article></section>
            <section className={styles.drawerSection}><header><div><span>PROVIDER POLICY</span><h3>Assigned execution route</h3></div><Database size={18} /></header><pre className={styles.policyPre}>{pretty(selected.provider_policy)}</pre></section>
            <section className={styles.drawerSection}><header><div><span>TRIGGERS</span><h3>Events that activate this agent</h3></div><strong>{stringList(selected.trigger_events).length}</strong></header><div className={styles.tagList}>{stringList(selected.trigger_events).map((item) => <span key={item}>{item}</span>)}</div></section>
            <section className={styles.drawerSection}><header><div><span>INTERNAL PERMISSIONS</span><h3>Actions the agent may perform</h3></div><ShieldCheck size={18} /></header><div className={styles.permissionList}>{Object.entries(record(selected.action_permissions)).map(([key, value]) => <article key={key}><span>{statusLabel(key)}</span><strong data-enabled={value === true}>{value === true ? "Allowed" : "Locked"}</strong></article>)}</div></section>
            <section className={styles.drawerSection}><header><div><span>ASSIGNED EXECUTION</span><h3>Recent matching events</h3></div><strong>{selectedAgentEvents.length}</strong></header><div className={styles.drawerRecordList}>{selectedAgentEvents.slice(0, 12).map((event) => <button key={text(event.id)} onClick={() => setInspector({ kind: "event", row: event })}><div><strong>{text(event.event_type)}</strong><span>{statusLabel(event.status)}</span><p>{text(event.error_message) || text(event.entity_type)}</p></div><ChevronRight size={15} /></button>)}</div></section>
            <section className={styles.drawerCommands}><button onClick={() => void act("set-agent-enabled", { agentId: selected.id, enabled: !selected.enabled }, selected.enabled ? "Agent paused" : "Agent enabled")} disabled={Boolean(busy)}>{selected.enabled ? <PauseCircle size={16} /> : <Play size={16} />}{selected.enabled ? "Pause agent" : "Enable agent"}</button><button onClick={() => navigateToWorkspace(selected.workspace_key)}><ArrowUpRight size={16} /> Open workspace</button></section>
          </div>
        ) : null}

        {inspector?.kind === "event" ? (
          <div className={styles.drawerStack}>
            <section className={styles.factGrid}><article><span>Status</span><strong data-status={text(selected.status)}>{statusLabel(selected.status)}</strong></article><article><span>Priority</span><strong>{statusLabel(selected.priority)}</strong></article><article><span>Attempts</span><strong>{count(selected.attempts)}</strong></article><article><span>Available</span><strong>{formatDate(selected.available_at)}</strong></article></section>
            <section className={styles.drawerSection}><span>EVENT</span><h3>{text(selected.event_type)}</h3><p>{text(selected.entity_type)} · {text(selected.entity_id) || "No entity ID"} · source {text(selected.source_workspace)}</p></section>
            {text(selected.error_message) ? <section className={styles.eventError}><AlertTriangle size={18} /><div><strong>{text(selected.error_code) || "Event failure"}</strong><p>{text(selected.error_message)}</p></div></section> : null}
            <section className={styles.drawerCommands}><button onClick={() => void act("process-event", { eventId: selected.id }, "Event processed")} disabled={Boolean(busy) || ["completed", "cancelled"].includes(text(selected.status))}><Play size={16} /> Process now</button><button onClick={() => void act("event-retry", { eventId: selected.id }, "Event requeued")} disabled={Boolean(busy)}><RotateCcw size={16} /> Retry</button><button className={styles.dangerButton} onClick={() => void act("event-cancel", { eventId: selected.id }, "Event cancelled")} disabled={Boolean(busy) || text(selected.status) === "completed"}><XCircle size={16} /> Cancel</button></section>
            <details open className={styles.jsonDetails}><summary>Event payload</summary><pre>{pretty(selected.payload)}</pre></details>
            <details className={styles.jsonDetails}><summary>Complete event evidence</summary><pre>{pretty(selected)}</pre></details>
          </div>
        ) : null}

        {inspector?.kind === "integrity" ? (
          <div className={styles.drawerStack}>
            <section className={styles.integrityHero} data-severity={text(selected.severity)}><AlertTriangle size={24} /><div><span>{text(selected.severity)} · {text(selected.issue_code)}</span><h3>{text(selected.title)}</h3><p>{text(selected.detail)}</p></div></section>
            <section className={styles.drawerSection}><span>RECOMMENDED CORRECTION</span><h3>{text(selected.recommended_action)}</h3><p>Affected: {text(selected.entity_type)} · {text(selected.entity_id)}</p></section>
            <label className={styles.noteField}><span>Resolution note</span><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Record why this issue is resolved, reopened or assigned." /></label>
            <section className={styles.drawerCommands}><button onClick={() => void act("resolve-integrity", { issueId: selected.id, note: decisionNote }, "Integrity issue resolved")} disabled={Boolean(busy)}><CheckCircle2 size={16} /> Mark resolved</button><button onClick={() => void act("reopen-integrity", { issueId: selected.id, note: decisionNote }, "Integrity issue reopened")} disabled={Boolean(busy)}><RotateCcw size={16} /> Reopen</button></section>
            <details open className={styles.jsonDetails}><summary>Detected record snapshot</summary><pre>{pretty(selected.detected_snapshot)}</pre></details>
          </div>
        ) : null}

        {inspector?.kind === "approval" ? (
          <div className={styles.drawerStack}>
            <section className={styles.approvalHero}><ShieldCheck size={26} /><div><span>{text(selected.risk_level)} RISK · {statusLabel(selected.status)}</span><h3>{text(selected.decision_requested)}</h3><p>{text(selected.object_type)} · exact version {text(selected.object_version)}</p></div></section>
            <section className={styles.factGrid}><article><span>Requested by</span><strong>{text(selected.requested_by) || "—"}</strong></article><article><span>Approver role</span><strong>{text(selected.approver_role)}</strong></article><article><span>Requested</span><strong>{formatDate(selected.requested_at)}</strong></article><article><span>Expires</span><strong>{formatDate(selected.expires_at)}</strong></article></section>
            <label className={styles.noteField}><span>Founder decision note</span><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Record conditions, reasoning or rejection instructions." /></label>
            {text(selected.status) === "pending" ? <section className={styles.drawerCommands}><button onClick={() => void act("approval-decision", { approvalId: selected.id, decision: "approved", note: decisionNote }, "Approval granted")} disabled={Boolean(busy)}><CheckCircle2 size={16} /> Approve exact version</button><button className={styles.dangerButton} onClick={() => void act("approval-decision", { approvalId: selected.id, decision: "rejected", note: decisionNote }, "Approval rejected")} disabled={Boolean(busy)}><XCircle size={16} /> Reject</button></section> : <section className={styles.decisionState}><strong>{statusLabel(selected.status)}</strong><span>{text(selected.decision_note) || "No decision note."}</span><time>{formatDate(selected.decided_at)}</time></section>}
            <details open className={styles.jsonDetails}><summary>Approval snapshot</summary><pre>{pretty(selected.snapshot)}</pre></details>
            <details className={styles.jsonDetails}><summary>Difference snapshot</summary><pre>{pretty(selected.diff_snapshot)}</pre></details>
            <details className={styles.jsonDetails}><summary>Evidence package</summary><pre>{pretty(selected.evidence_package)}</pre></details>
          </div>
        ) : null}

        {inspector?.kind === "doctrine" ? (
          <div className={styles.drawerStack}>
            {selected.id ? <><section className={styles.doctrineHero}><Sparkles size={26} /><div><span>{statusLabel(selected.status)}</span><h3>{text(selected.compilation_key)}</h3><p>Compiled by {text(selected.compiled_by) || "system"} on {formatDate(selected.compiled_at)}</p></div></section><section className={styles.factGrid}><article><span>Items</span><strong>{rows(record(selected.effective_bundle).items).length}</strong></article><article><span>Commands</span><strong>{rows(record(selected.effective_bundle).commands).length}</strong></article><article><span>Prompts</span><strong>{rows(record(selected.effective_bundle).prompts).length}</strong></article><article><span>Conflicts</span><strong>{rows(record(selected.effective_bundle).unresolvedConflicts).length}</strong></article></section><section className={styles.drawerCommands}><button onClick={() => void act("compile-doctrine", {}, "Doctrine compilation completed")} disabled={Boolean(busy)}><Sparkles size={16} /> Recompile now</button></section><details open className={styles.jsonDetails}><summary>Effective doctrine bundle</summary><pre>{pretty(selected.effective_bundle)}</pre></details><details className={styles.jsonDetails}><summary>Source versions</summary><pre>{pretty(selected.source_versions)}</pre></details><details className={styles.jsonDetails}><summary>Conflicts</summary><pre>{pretty(selected.conflicts)}</pre></details></> : <div className={styles.controlledState}><Sparkles size={26} /><strong>No doctrine compilation exists</strong><span>Create the first executable capital-department policy bundle.</span><button onClick={() => void act("compile-doctrine", {}, "Doctrine compilation completed")}>Compile doctrine</button></div>}
          </div>
        ) : null}
      </Drawer>

      <Dialog
        open={Boolean(actionResult)}
        title={actionResult?.title || "Capital command result"}
        eyebrow="Persisted execution outcome"
        onClose={() => setActionResult(null)}
        wide
        footer={<><button className={styles.secondaryButton} onClick={() => setActionResult(null)}>Close result</button><button className={styles.primaryButton} onClick={() => void load()}>Refresh cockpit <RefreshCw size={15} /></button></>}
      >
        {actionResult ? <div className={styles.resultDialog}><section><CheckCircle2 size={28} /><div><span>COMPLETED</span><h3>{operationSummary}</h3><p>{formatDate(actionResult.completedAt)}</p></div></section><div className={styles.resultFacts}>{Object.entries(actionResult.data).slice(0, 8).map(([key, value]) => <article key={key}><span>{statusLabel(key)}</span><strong>{typeof value === "object" ? Array.isArray(value) ? `${value.length} item(s)` : "Persisted object" : text(value) || "—"}</strong></article>)}</div><details open className={styles.jsonDetails}><summary>Complete execution result</summary><pre>{pretty(actionResult.data)}</pre></details></div> : null}
      </Dialog>
    </AcCapitalShell>
  );
}
