"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArchiveRestore,
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileCheck2,
  FileWarning,
  Fingerprint,
  Gauge,
  History,
  KeyRound,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Network,
  Play,
  RefreshCw,
  Route,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { Dialog, Drawer } from "../../core/Overlay";
import type { CapitalActor, Row } from "../../core/types";
import styles from "./certification.module.css";

type Tab = "command" | "workspaces" | "scenarios" | "integrity" | "artifacts" | "evidence";
type CertificationStatus = "CERTIFIED" | "PARTIALLY CERTIFIED" | "BLOCKED" | "FAILED" | "NOT TESTED";

const text = (value: unknown) => String(value ?? "").trim();
const record = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};
const rows = (value: unknown): Row[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Row => Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
const formatDate = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "—";
  const date = new Date(raw);
  return Number.isNaN(date.getTime())
    ? raw
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
};
const status = (value: unknown): CertificationStatus => {
  const candidate = text(value).toUpperCase();
  if (candidate === "CERTIFIED") return "CERTIFIED";
  if (candidate === "PARTIALLY CERTIFIED") return "PARTIALLY CERTIFIED";
  if (candidate === "BLOCKED") return "BLOCKED";
  if (candidate === "FAILED") return "FAILED";
  return "NOT TESTED";
};

function statusIcon(value: unknown) {
  const current = status(value);
  if (current === "CERTIFIED") return <CheckCircle2 size={15} />;
  if (current === "PARTIALLY CERTIFIED") return <CircleDashed size={15} />;
  if (current === "BLOCKED") return <ShieldAlert size={15} />;
  if (current === "FAILED") return <XCircle size={15} />;
  return <TimerReset size={15} />;
}

function StatusPill({ value }: { value: unknown }) {
  const current = status(value);
  return (
    <span className={styles.statusPill} data-status={current}>
      {statusIcon(current)}
      {current}
    </span>
  );
}

function metricValue(value: unknown, fallback = 0) {
  const result = Number(value ?? fallback);
  return Number.isFinite(result) ? result : fallback;
}

export function CertificationPage({ actor }: { actor: CapitalActor }) {
  const [tab, setTab] = useState<Tab>("command");
  const [data, setData] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<Row | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Row | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Row | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Row | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    workspaceKey: "orchestrator",
    scenarioKey: "",
    gateKey: "route",
    status: "CERTIFIED" as CertificationStatus,
    summary: "",
    reference: "",
    evidenceType: "browser-acceptance",
  });
  const [scenarioStep, setScenarioStep] = useState<Row | null>(null);
  const [scenarioForm, setScenarioForm] = useState({
    status: "CERTIFIED" as CertificationStatus,
    summary: "",
    reference: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ac-capital-os/certification", {
        cache: "no-store",
      });
      const raw = await response.text();
      const payload = raw ? JSON.parse(raw) : {};
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.warning || payload.code || `CERTIFICATION_LOAD_HTTP_${response.status}`);
      }
      setData(record(payload.data));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function execute(action: string, payload: Row = {}, successMessage?: string) {
    setBusy(action);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/ac-capital-os/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const raw = await response.text();
      const result = raw ? JSON.parse(raw) : {};
      if (!response.ok || result.ok === false) {
        throw new Error(result.warning || result.code || `CERTIFICATION_ACTION_HTTP_${response.status}`);
      }
      setMessage(successMessage || "Certification command completed and persisted.");
      await load();
      return record(result.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text(reason));
      return null;
    } finally {
      setBusy("");
    }
  }

  const contracts = rows(data.contracts);
  const workspaces = rows(data.workspaces);
  const checks = rows(data.checks);
  const scenarioContracts = rows(data.scenarioContracts);
  const scenarios = rows(data.scenarios);
  const steps = rows(data.scenarioSteps);
  const integrityIssues = rows(data.integrityIssues);
  const artifacts = rows(data.artifacts);
  const evidence = rows(data.evidence);
  const runs = rows(data.runs);
  const signoffs = rows(data.signoffs);

  const mergedWorkspaces = useMemo<Row[]>(
    () =>
      contracts.map((contract) => ({
        ...contract,
        ...(workspaces.find(
          (workspace) => text(workspace.workspace_key) === text(contract.key),
        ) || {}),
        workspace_key: text(contract.key),
        workspace_label: text(contract.label),
        route_path: text(contract.route),
        visual_identity: text(contract.visualIdentity),
      })),
    [contracts, workspaces],
  );

  const mergedScenarios = useMemo<Row[]>(
    () =>
      scenarioContracts.map((contract) => ({
        ...contract,
        ...(scenarios.find(
          (scenario) => text(scenario.scenario_key) === text(contract.key),
        ) || {}),
        scenario_key: text(contract.key),
        title: text(contract.label),
        description: text(contract.description),
      })),
    [scenarioContracts, scenarios],
  );

  const certifiedWorkspaces = mergedWorkspaces.filter(
    (workspace) => status(workspace.status) === "CERTIFIED",
  ).length;
  const criticalWorkspaces = mergedWorkspaces.filter((workspace) => workspace.critical !== false);
  const blockingWorkspaces = criticalWorkspaces.filter((workspace) =>
    ["BLOCKED", "FAILED"].includes(status(workspace.status)),
  ).length;
  const requiredScenarios = mergedScenarios.filter((scenario) => scenario.required !== false);
  const certifiedScenarios = requiredScenarios.filter(
    (scenario) => status(scenario.status) === "CERTIFIED",
  ).length;
  const criticalIssues = integrityIssues.filter(
    (issue) => text(issue.severity).toLowerCase() === "critical",
  ).length;
  const approvedArtifacts = artifacts.filter(
    (artifact) => text(artifact.approval_status).toLowerCase() === "approved",
  ).length;
  const certificationPercent = Math.round(
    ((certifiedWorkspaces + certifiedScenarios) /
      Math.max(1, mergedWorkspaces.length + requiredScenarios.length)) *
      100,
  );

  const selectedWorkspaceChecks = selectedWorkspace
    ? checks.filter(
        (check) => text(check.workspace_key) === text(selectedWorkspace.workspace_key),
      )
    : [];
  const selectedScenarioSteps = selectedScenario
    ? steps.filter(
        (step) => text(step.scenario_key) === text(selectedScenario.scenario_key),
      )
    : [];

  const insights = [
    {
      label: "Certification truth",
      value: `${certificationPercent}% evidence-complete`,
    },
    {
      label: "Critical blockers",
      value: `${blockingWorkspaces + criticalIssues} require resolution`,
      tone: blockingWorkspaces + criticalIssues ? "danger" : "success",
    },
    {
      label: "Required scenarios",
      value: `${certifiedScenarios}/${requiredScenarios.length} certified`,
    },
    {
      label: "Board sign-off",
      value:
        certifiedWorkspaces === mergedWorkspaces.length &&
        certifiedScenarios === requiredScenarios.length &&
        criticalIssues === 0
          ? "Eligible"
          : "Strictly blocked",
      tone: "approval",
    },
  ];

  function openWorkspace(workspace: Row) {
    setSelectedWorkspace(workspace);
  }

  function openScenario(scenario: Row) {
    setSelectedScenario(scenario);
  }

  function openEvidence(workspace?: Row, gateKey = "route") {
    setEvidenceForm({
      workspaceKey: text(workspace?.workspace_key || workspace?.key || "orchestrator"),
      scenarioKey: "",
      gateKey,
      status: "CERTIFIED",
      summary: "",
      reference: "",
      evidenceType: "browser-acceptance",
    });
    setEvidenceOpen(true);
  }

  async function saveEvidence() {
    if (!evidenceForm.summary.trim()) {
      setError("Certification evidence summary is required.");
      return;
    }
    if (
      evidenceForm.status === "CERTIFIED" &&
      ["route", "visual", "accessibility", "performance", "recovery"].includes(evidenceForm.gateKey) &&
      !evidenceForm.reference.trim()
    ) {
      setError("A screenshot, test report or other evidence reference is required for a certified manual gate.");
      return;
    }
    const result = await execute(
      "record-check",
      {
        ...evidenceForm,
        evidence: {
          reference: evidenceForm.reference || null,
          recordedFrom: "Certification Command Center",
        },
      },
      "Certification evidence recorded without inflating the workspace status.",
    );
    if (result) setEvidenceOpen(false);
  }

  async function saveScenarioStep() {
    if (!selectedScenario || !scenarioStep || !scenarioForm.summary.trim()) {
      setError("Scenario, step and evidence summary are required.");
      return;
    }
    if (scenarioForm.status === "CERTIFIED" && !scenarioForm.reference.trim()) {
      setError("A concrete record, screenshot, output or test reference is required to certify a scenario step.");
      return;
    }
    const result = await execute(
      "scenario-step",
      {
        scenarioKey: selectedScenario.scenario_key,
        stepKey: scenarioStep.step_key,
        status: scenarioForm.status,
        summary: scenarioForm.summary,
        evidence: { reference: scenarioForm.reference || null },
      },
      "Scenario evidence recorded and the scenario status recalculated.",
    );
    if (result) setScenarioStep(null);
  }

  return (
    <AcCapitalShell
      actor={actor}
      workspaceKey="certification"
      title="Institutional Certification & Release Authority"
      subtitle="A board-defensible command center that refuses false completion: every workspace, AI agent, lifecycle gate, artifact and failure-recovery scenario must produce live evidence before AC CAPITAL OS can be certified."
      envelope={null}
      insights={insights}
      primaryAction="Run certification audit"
      onPrimaryAction={() => void execute("run-workspaces", {}, "Workspace contracts evaluated.")}
    >
      <div className={styles.page}>
        <section className={styles.commandBridge}>
          <div className={styles.bridgeIdentity}>
            <span><Fingerprint size={16} /> INSTITUTIONAL RELEASE AUTHORITY · IC10</span>
            <h2>Nothing receives a green badge because code exists.</h2>
            <p>
              Certification requires persisted data, real CRUD, real AI output, lifecycle continuity,
              exact-version governance, valid artifacts, recovery proof and purpose-built browser acceptance.
            </p>
            <div className={styles.bridgeActions}>
              <button
                className={styles.primaryAction}
                onClick={() => void execute("run-workspaces", {}, "All workspace certification contracts evaluated.")}
                disabled={Boolean(busy)}
              >
                {busy === "run-workspaces" ? <LoaderCircle className={styles.spin} /> : <Play />}
                Run all workspace gates
              </button>
              <button
                onClick={() => void execute("run-integrity", {}, "Canonical lifecycle integrity audit completed.")}
                disabled={Boolean(busy)}
              >
                <SearchCheck /> Run integrity audit
              </button>
              <button
                onClick={() => void execute("initialize", {}, "Certification contracts initialized.")}
                disabled={Boolean(busy)}
              >
                <RefreshCw /> Initialize contracts
              </button>
            </div>
          </div>
          <div className={styles.certificationDial}>
            <div
              className={styles.dial}
              style={{ "--certification-progress": `${certificationPercent * 3.6}deg` } as CSSProperties}
            >
              <div><strong>{certificationPercent}%</strong><span>Evidence complete</span></div>
            </div>
            <div className={styles.releaseState} data-ready={certificationPercent === 100 && criticalIssues === 0}>
              <LockKeyhole size={18} />
              <div>
                <strong>{certificationPercent === 100 && criticalIssues === 0 ? "Board sign-off eligible" : "Release remains blocked"}</strong>
                <span>{criticalIssues} critical integrity issue(s) · {blockingWorkspaces} blocked workspace(s)</span>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className={styles.error}><AlertTriangle /> <span>{error}</span></div> : null}
        {message ? <div className={styles.success}><CheckCircle2 /> <span>{message}</span></div> : null}

        <section className={styles.truthMetrics}>
          <button onClick={() => setTab("workspaces")}>
            <Layers3 /><span>Certified workspaces</span><strong>{certifiedWorkspaces}/{mergedWorkspaces.length}</strong><small>All mandatory gates, not an average score</small>
          </button>
          <button onClick={() => setTab("scenarios")}>
            <Workflow /><span>Live scenarios</span><strong>{certifiedScenarios}/{requiredScenarios.length}</strong><small>Grant, bank, rejection, failure and governance</small>
          </button>
          <button onClick={() => setTab("integrity")} data-alert={criticalIssues > 0}>
            <ShieldAlert /><span>Critical integrity</span><strong>{criticalIssues}</strong><small>No orphan or false-completion tolerance</small>
          </button>
          <button onClick={() => setTab("artifacts")}>
            <FileCheck2 /><span>Approved artifacts</span><strong>{approvedArtifacts}</strong><small>Versioned, hashed and immutable</small>
          </button>
          <button onClick={() => setTab("evidence")}>
            <Fingerprint /><span>Evidence records</span><strong>{evidence.length}</strong><small>Browser, runtime, file and governance proof</small>
          </button>
        </section>

        <nav className={styles.tabs} aria-label="Certification workspaces">
          {([
            ["command", "Release command", Award],
            ["workspaces", "Workspace matrix", Layers3],
            ["scenarios", "Live scenarios", Workflow],
            ["integrity", "Integrity control", ShieldAlert],
            ["artifacts", "Artifact assurance", FileCheck2],
            ["evidence", "Evidence ledger", Fingerprint],
          ] as const).map(([key, label, Icon]) => (
            <button key={key} className={tab === key ? styles.tabActive : ""} onClick={() => setTab(key)}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <section className={styles.loading}><LoaderCircle className={styles.spin} /><strong>Loading the certification evidence graph…</strong></section>
        ) : null}

        {!loading && tab === "command" ? (
          <div className={styles.commandGrid}>
            <section className={styles.releaseBoard}>
              <header>
                <div><span>RELEASE DECISION</span><h3>Certification status by institutional dependency</h3></div>
                <StatusPill value={criticalIssues || blockingWorkspaces ? "BLOCKED" : certificationPercent === 100 ? "CERTIFIED" : "PARTIALLY CERTIFIED"} />
              </header>
              <div className={styles.releaseLanes}>
                {[
                  ["Workspace UX", certifiedWorkspaces, mergedWorkspaces.length, "Purpose-built route, CRUD, evidence and recovery"],
                  ["Lifecycle scenarios", certifiedScenarios, requiredScenarios.length, "Real source-to-outcome journeys"],
                  ["Integrity", criticalIssues === 0 ? 1 : 0, 1, "No critical orphan, version or false-completion defect"],
                  ["Artifact assurance", approvedArtifacts > 0 ? 1 : 0, 1, "Openable, hashed and immutable approved file"],
                ].map(([label, complete, total, description]) => {
                  const percent = Math.round((Number(complete) / Math.max(1, Number(total))) * 100);
                  return (
                    <article key={String(label)}>
                      <div><strong>{String(label)}</strong><span>{String(description)}</span></div>
                      <div className={styles.progressTrack}><i style={{ width: `${percent}%` }} /></div>
                      <b>{complete}/{total}</b>
                    </article>
                  );
                })}
              </div>
              <footer>
                <button
                  className={styles.signoff}
                  disabled={Boolean(busy) || certificationPercent !== 100 || criticalIssues > 0}
                  onClick={() => void execute("board-signoff", {}, "Board certification sign-off completed.")}
                >
                  <BadgeCheck /> Board certification sign-off
                </button>
                <span>Server-side authorization rechecks every critical workspace and required scenario.</span>
              </footer>
            </section>

            <section className={styles.nextActions}>
              <header><span>NEXT SAFEST CERTIFICATION MOVE</span><h3>Evidence gaps requiring action</h3></header>
              <div>
                {mergedWorkspaces
                  .filter((workspace) => status(workspace.status) !== "CERTIFIED")
                  .slice(0, 6)
                  .map((workspace) => (
                    <button key={text(workspace.workspace_key)} onClick={() => openWorkspace(workspace)}>
                      <span data-status={status(workspace.status)}>{statusIcon(workspace.status)}</span>
                      <div><strong>{text(workspace.workspace_label)}</strong><small>{text(workspace.visual_identity)}</small></div>
                      <ChevronRight />
                    </button>
                  ))}
                {!mergedWorkspaces.length ? <p>Initialize certification contracts to begin.</p> : null}
              </div>
            </section>

            <section className={styles.executiveTimeline}>
              <header><span>CERTIFICATION EXECUTION</span><h3>Latest audit and evidence activity</h3></header>
              <div>
                {runs.slice(0, 8).map((run) => (
                  <article key={text(run.id)}>
                    <span>{statusIcon(run.status)}</span>
                    <div><strong>{text(run.run_type).replaceAll("-", " ")}</strong><p>{text(run.summary) || "Certification run persisted."}</p></div>
                    <time>{formatDate(run.finished_at || run.started_at)}</time>
                  </article>
                ))}
                {!runs.length ? <p>No certification run has been persisted yet.</p> : null}
              </div>
            </section>

            <section className={styles.boardPolicy}>
              <ShieldCheck size={28} />
              <div><span>BOARD TRUTH POLICY</span><h3>No average score can hide a failed critical gate.</h3><p>A workspace is certified only when every mandatory gate is certified. A live scenario is certified only when every expected step has persisted evidence.</p></div>
            </section>
          </div>
        ) : null}

        {!loading && tab === "workspaces" ? (
          <section className={styles.workspaceMatrix}>
            <header>
              <div><span>WORKSPACE CERTIFICATION MATRIX</span><h3>Purpose-built product quality, runtime truth and operational integrity</h3></div>
              <button onClick={() => void execute("run-workspaces", {}, "All workspace gates recalculated.")} disabled={Boolean(busy)}><RefreshCw /> Recalculate all</button>
            </header>
            <div className={styles.workspaceGrid}>
              {mergedWorkspaces.map((workspace, index) => {
                const metrics = record(workspace.metrics);
                const certified = metricValue(metrics.certified);
                const total = Math.max(1, metricValue(metrics.totalChecks, 12));
                const percent = Math.round((certified / total) * 100);
                return (
                  <article key={text(workspace.workspace_key)} className={styles.workspaceCard} data-status={status(workspace.status)}>
                    <header><span>{String(index + 1).padStart(2, "0")}</span><StatusPill value={workspace.status} /></header>
                    <div className={styles.workspaceIcon}><Boxes size={22} /></div>
                    <h4>{text(workspace.workspace_label)}</h4>
                    <p>{text(workspace.visual_identity)}</p>
                    <div className={styles.workspaceProgress}><i style={{ width: `${percent}%` }} /><span>{percent}% evidence</span></div>
                    <dl>
                      <div><dt>Certified gates</dt><dd>{certified}/{total}</dd></div>
                      <div><dt>Critical</dt><dd>{workspace.critical === false ? "No" : "Yes"}</dd></div>
                      <div><dt>Last run</dt><dd>{formatDate(workspace.updated_at)}</dd></div>
                    </dl>
                    <footer>
                      <button onClick={() => openWorkspace(workspace)}>Inspect gates <ChevronRight /></button>
                      <Link href={text(workspace.route_path)}><ExternalLink /> Open workspace</Link>
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {!loading && tab === "scenarios" ? (
          <section className={styles.scenarioDeck}>
            <header><div><span>LIVE END-TO-END CERTIFICATION</span><h3>Real journeys, exact evidence and controlled failure recovery</h3></div><small>{certifiedScenarios}/{requiredScenarios.length} required scenarios certified</small></header>
            <div>
              {mergedScenarios.map((scenario, index) => {
                const scenarioSteps = steps.filter((step) => text(step.scenario_key) === text(scenario.scenario_key));
                const certified = scenarioSteps.filter((step) => status(step.status) === "CERTIFIED").length;
                const total = metricValue(scenario.total_steps, rows(scenario.steps).length || 1);
                return (
                  <button key={text(scenario.scenario_key)} onClick={() => openScenario(scenario)} data-status={status(scenario.status)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><StatusPill value={scenario.status} /><strong>{text(scenario.title)}</strong><p>{text(scenario.description)}</p></div>
                    <aside><b>{certified}/{total}</b><small>steps certified</small><ChevronRight /></aside>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {!loading && tab === "integrity" ? (
          <section className={styles.integrityCenter}>
            <header>
              <div><span>CANONICAL INTEGRITY CONTROL</span><h3>Broken lifecycle chains and approval risks</h3></div>
              <button onClick={() => void execute("run-integrity", {}, "Canonical integrity audit completed.")} disabled={Boolean(busy)}><SearchCheck /> Scan now</button>
            </header>
            <div className={styles.integritySummary}>
              <article><ShieldAlert /><strong>{criticalIssues}</strong><span>Critical</span></article>
              <article><FileWarning /><strong>{integrityIssues.filter((issue) => text(issue.severity).toLowerCase() === "high").length}</strong><span>High</span></article>
              <article><Network /><strong>{integrityIssues.length}</strong><span>Open findings</span></article>
              <article><ArchiveRestore /><strong>{integrityIssues.filter((issue) => issue.auto_repairable === true).length}</strong><span>Auto-repairable</span></article>
            </div>
            <div className={styles.issueList}>
              {integrityIssues.map((issue) => (
                <button key={text(issue.id)} onClick={() => setSelectedIssue(issue)} data-severity={text(issue.severity).toLowerCase()}>
                  <span><ShieldAlert /></span>
                  <div><strong>{text(issue.title)}</strong><p>{text(issue.detail)}</p><small>{text(issue.issue_code)} · {text(issue.entity_type)}</small></div>
                  <aside><b>{text(issue.severity)}</b><ChevronRight /></aside>
                </button>
              ))}
              {!integrityIssues.length ? <div className={styles.cleanState}><ShieldCheck /><strong>No open integrity issue is currently registered.</strong><p>Run the audit again after significant lifecycle changes.</p></div> : null}
            </div>
          </section>
        ) : null}

        {!loading && tab === "artifacts" ? (
          <section className={styles.artifactAssurance}>
            <header><div><span>ARTIFACT ASSURANCE</span><h3>Board documents must be openable, hashed, versioned and immutable after approval</h3></div><Link href="/ac-capital-os/artifacts">Open Artifact Factory <ExternalLink /></Link></header>
            <div className={styles.artifactGrid}>
              {artifacts.map((artifact) => (
                <button key={text(artifact.id)} onClick={() => setSelectedArtifact(artifact)}>
                  <FileCheck2 />
                  <div><strong>{text(artifact.title)}</strong><span>{text(artifact.artifact_type).replaceAll("-", " ")}</span></div>
                  <StatusPill value={text(artifact.approval_status).toLowerCase() === "approved" && text(artifact.immutable_snapshot_hash) ? "CERTIFIED" : "NOT TESTED"} />
                  <dl><div><dt>Version</dt><dd>{text(artifact.current_version) || "1"}</dd></div><div><dt>Approved</dt><dd>{text(artifact.approved_version) || "—"}</dd></div><div><dt>Hash</dt><dd>{text(artifact.immutable_snapshot_hash).slice(0, 12) || "Missing"}</dd></div></dl>
                </button>
              ))}
              {!artifacts.length ? <div className={styles.cleanState}><FileWarning /><strong>No artifact has been generated.</strong><p>Artifact integrity remains NOT TESTED.</p></div> : null}
            </div>
          </section>
        ) : null}

        {!loading && tab === "evidence" ? (
          <section className={styles.evidenceLedger}>
            <header><div><span>CERTIFICATION EVIDENCE LEDGER</span><h3>Browser, runtime, document and governance proof</h3></div><button onClick={() => openEvidence()}><Fingerprint /> Record evidence</button></header>
            <div>
              {signoffs.map((item) => (
                <article key={`signoff-${text(item.id)}`}>
                  <span><BadgeCheck /></span>
                  <div><strong>Board certification sign-off</strong><p>{text(item.certification_status)} · {text(item.signed_by)}</p><small>Snapshot {text(item.snapshot_hash).slice(0, 18)}…</small></div>
                  <time>{formatDate(item.signed_at)}</time>
                </article>
              ))}
              {evidence.map((item) => (
                <article key={text(item.id)}>
                  <span><Fingerprint /></span>
                  <div><strong>{text(item.title)}</strong><p>{text(item.evidence_type).replaceAll("-", " ")} · {text(item.workspace_key || item.scenario_key || "department")}</p><small>{text(item.reference) || "Persisted evidence payload"}</small></div>
                  <time>{formatDate(item.recorded_at)}</time>
                </article>
              ))}
              {!evidence.length && !signoffs.length ? <div className={styles.cleanState}><Fingerprint /><strong>No live evidence has been recorded yet.</strong><p>Structural checks alone cannot certify the product.</p></div> : null}
            </div>
          </section>
        ) : null}
      </div>

      <Drawer
        open={Boolean(selectedWorkspace)}
        title={text(selectedWorkspace?.workspace_label || "Workspace certification")}
        eyebrow="Workspace Gate Inspection"
        onClose={() => setSelectedWorkspace(null)}
        footer={
          selectedWorkspace ? (
            <div className={styles.drawerActions}>
              <button onClick={() => openEvidence(selectedWorkspace, "route")}><Fingerprint /> Record browser evidence</button>
              <button onClick={() => void execute("run-workspaces", { workspaceKey: selectedWorkspace.workspace_key }, "Workspace gates recalculated.")}><RefreshCw /> Recalculate</button>
              <Link href={text(selectedWorkspace.route_path)}><ExternalLink /> Open workspace</Link>
            </div>
          ) : null
        }
      >
        {selectedWorkspace ? (
          <div className={styles.workspaceDrawer}>
            <section className={styles.drawerHero}>
              <div><span>WORKSPACE CONTRACT</span><h3>{text(selectedWorkspace.workspace_label)}</h3><p>{text(selectedWorkspace.visual_identity)}</p></div>
              <StatusPill value={selectedWorkspace.status} />
            </section>
            <section className={styles.gateGrid}>
              {selectedWorkspaceChecks.length ? selectedWorkspaceChecks.map((check) => (
                <article key={text(check.id)} data-status={status(check.status)}>
                  <header><span>{statusIcon(check.status)}</span><strong>{text(check.gate_key).replaceAll("-", " ")}</strong><StatusPill value={check.status} /></header>
                  <p>{text(check.summary)}</p>
                  <footer><span>{check.required === false ? "Optional" : "Mandatory"}</span><time>{formatDate(check.checked_at)}</time></footer>
                  <details><summary>Evidence</summary><pre>{JSON.stringify(check.evidence || {}, null, 2)}</pre></details>
                </article>
              )) : <div className={styles.cleanState}><TimerReset /><strong>Workspace has not been evaluated.</strong><p>Run its certification contract to create gate evidence.</p></div>}
            </section>
            <section className={styles.blockers}>
              <h4>Blocking reasons</h4>
              {rows(selectedWorkspace.blocking_reasons).length ? rows(selectedWorkspace.blocking_reasons).map((blocker, index) => <p key={`${text(blocker.gateKey)}-${index}`}><AlertTriangle /> <strong>{text(blocker.gateKey)}</strong> — {text(blocker.summary)}</p>) : <p><ShieldCheck /> No persisted blocker.</p>}
            </section>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={Boolean(selectedScenario)}
        title={text(selectedScenario?.title || "Scenario certification")}
        eyebrow="Live Scenario Evidence"
        onClose={() => setSelectedScenario(null)}
      >
        {selectedScenario ? (
          <div className={styles.scenarioDrawer}>
            <section className={styles.drawerHero}>
              <div><span>REQUIRED END-TO-END JOURNEY</span><h3>{text(selectedScenario.title)}</h3><p>{text(selectedScenario.description)}</p></div>
              <StatusPill value={selectedScenario.status} />
            </section>
            <div className={styles.scenarioSteps}>
              {selectedScenarioSteps.map((step, index) => (
                <article key={text(step.id || step.step_key)} data-status={status(step.status)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{text(step.label)}</strong><p>{text(step.summary) || "Live evidence has not been recorded."}</p><small>{text(step.workspace_key)} · {formatDate(step.completed_at || step.updated_at)}</small></div>
                  <StatusPill value={step.status} />
                  <button onClick={() => { setScenarioStep(step); setScenarioForm({ status: "CERTIFIED", summary: "", reference: "" }); }}><ClipboardCheck /> Record result</button>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={Boolean(selectedIssue)}
        title={text(selectedIssue?.title || "Integrity issue")}
        eyebrow="Canonical Integrity Finding"
        onClose={() => setSelectedIssue(null)}
      >
        {selectedIssue ? (
          <div className={styles.issueDrawer}>
            <section className={styles.issueSeverity} data-severity={text(selectedIssue.severity).toLowerCase()}><ShieldAlert /><div><span>{text(selectedIssue.severity)} severity</span><strong>{text(selectedIssue.issue_code)}</strong></div></section>
            <section><h3>Why this blocks trust</h3><p>{text(selectedIssue.detail)}</p></section>
            <section><h3>Required repair</h3><p>{text(selectedIssue.recommended_action)}</p></section>
            <details open><summary>Detected snapshot</summary><pre>{JSON.stringify(selectedIssue.detected_snapshot || {}, null, 2)}</pre></details>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={Boolean(selectedArtifact)}
        title={text(selectedArtifact?.title || "Artifact assurance")}
        eyebrow="Document Integrity Inspection"
        onClose={() => setSelectedArtifact(null)}
        footer={<Link className={styles.openLink} href="/ac-capital-os/artifacts"><ExternalLink /> Open Artifact Factory</Link>}
      >
        {selectedArtifact ? (
          <div className={styles.artifactDrawer}>
            <section className={styles.drawerHero}><div><span>GOVERNED OUTPUT</span><h3>{text(selectedArtifact.title)}</h3><p>{text(selectedArtifact.artifact_type).replaceAll("-", " ")}</p></div><StatusPill value={text(selectedArtifact.approval_status).toLowerCase() === "approved" && text(selectedArtifact.immutable_snapshot_hash) ? "CERTIFIED" : "NOT TESTED"} /></section>
            <div className={styles.artifactFacts}><article><span>Current version</span><strong>{text(selectedArtifact.current_version) || "1"}</strong></article><article><span>Approved version</span><strong>{text(selectedArtifact.approved_version) || "—"}</strong></article><article><span>Approval</span><strong>{text(selectedArtifact.approval_status)}</strong></article><article><span>Immutable hash</span><strong>{text(selectedArtifact.immutable_snapshot_hash).slice(0, 18) || "Missing"}</strong></article></div>
            <section className={styles.assuranceRules}><h3>Certification rules</h3><p><FileCheck2 /> Required MIME types must open successfully.</p><p><KeyRound /> Stored SHA-256 must match downloaded bytes.</p><p><LockKeyhole /> Approved version must remain immutable.</p><p><History /> Regeneration must create a new version, never overwrite approval evidence.</p></section>
          </div>
        ) : null}
      </Drawer>

      <Dialog
        open={evidenceOpen}
        title="Record Certification Evidence"
        eyebrow="Live Acceptance Evidence"
        wide
        onClose={() => setEvidenceOpen(false)}
        footer={<><button className={styles.dialogSecondary} onClick={() => setEvidenceOpen(false)}>Cancel</button><button className={styles.dialogPrimary} onClick={() => void saveEvidence()} disabled={Boolean(busy)}>{busy === "record-check" ? "Recording…" : "Persist evidence"}</button></>}
      >
        <div className={styles.evidenceForm}>
          <label><span>Workspace</span><select value={evidenceForm.workspaceKey} onChange={(event) => setEvidenceForm({ ...evidenceForm, workspaceKey: event.target.value })}>{mergedWorkspaces.map((workspace) => <option key={text(workspace.workspace_key)} value={text(workspace.workspace_key)}>{text(workspace.workspace_label)}</option>)}</select></label>
          <label><span>Gate</span><select value={evidenceForm.gateKey} onChange={(event) => setEvidenceForm({ ...evidenceForm, gateKey: event.target.value })}>{["route","crud","ai","workflow","integrity","governance","artifact","recovery","visual","accessibility","performance"].map((gate) => <option key={gate} value={gate}>{gate}</option>)}</select></label>
          <label><span>Result</span><select value={evidenceForm.status} onChange={(event) => setEvidenceForm({ ...evidenceForm, status: event.target.value as CertificationStatus })}>{["CERTIFIED","PARTIALLY CERTIFIED","BLOCKED","FAILED","NOT TESTED"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Evidence type</span><input value={evidenceForm.evidenceType} onChange={(event) => setEvidenceForm({ ...evidenceForm, evidenceType: event.target.value })} /></label>
          <label className={styles.formWide}><span>Exact result summary</span><textarea value={evidenceForm.summary} onChange={(event) => setEvidenceForm({ ...evidenceForm, summary: event.target.value })} placeholder="Describe what was executed, what persisted, what failed and what evidence proves the result." /></label>
          <label className={styles.formWide}><span>Reference</span><input value={evidenceForm.reference} onChange={(event) => setEvidenceForm({ ...evidenceForm, reference: event.target.value })} placeholder="Screenshot, request ID, artifact ID, URL or audit reference" /></label>
        </div>
        <section className={styles.truthNotice}><ShieldCheck /><div><strong>Evidence does not automatically certify the full workspace.</strong><span>The server recalculates mandatory gates and blocks board sign-off when any critical dependency remains incomplete.</span></div></section>
      </Dialog>

      <Dialog
        open={Boolean(scenarioStep)}
        title={text(scenarioStep?.label || "Record scenario result")}
        eyebrow="Scenario Step Certification"
        onClose={() => setScenarioStep(null)}
        footer={<><button className={styles.dialogSecondary} onClick={() => setScenarioStep(null)}>Cancel</button><button className={styles.dialogPrimary} onClick={() => void saveScenarioStep()} disabled={Boolean(busy)}>{busy === "scenario-step" ? "Recording…" : "Persist step evidence"}</button></>}
      >
        <div className={styles.evidenceForm}>
          <label><span>Result</span><select value={scenarioForm.status} onChange={(event) => setScenarioForm({ ...scenarioForm, status: event.target.value as CertificationStatus })}>{["CERTIFIED","PARTIALLY CERTIFIED","BLOCKED","FAILED","NOT TESTED"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Evidence reference</span><input value={scenarioForm.reference} onChange={(event) => setScenarioForm({ ...scenarioForm, reference: event.target.value })} placeholder="Request ID, artifact ID, screenshot or audit reference" /></label>
          <label className={styles.formWide}><span>Execution result</span><textarea value={scenarioForm.summary} onChange={(event) => setScenarioForm({ ...scenarioForm, summary: event.target.value })} placeholder="State exactly what happened. A provider call, UI toast or code path alone is not sufficient." /></label>
        </div>
      </Dialog>
    </AcCapitalShell>
  );
}
