import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { JsonRecord } from "./free-provider-types";

export type CertificationStatus =
  | "CERTIFIED"
  | "PARTIALLY CERTIFIED"
  | "BLOCKED"
  | "FAILED"
  | "NOT TESTED";

export type CertificationActor = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type WorkspaceContract = {
  key: string;
  label: string;
  route: string;
  visualIdentity: string;
  primaryTables: string[];
  agentKey?: string;
  entityTypes: string[];
  artifactRequired?: boolean;
  critical: boolean;
};

type ScenarioContract = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  steps: Array<{ key: string; label: string; workspaceKey: string }>;
};

type TableProbe = {
  table: string;
  ok: boolean;
  count: number;
  error?: string;
};

type CheckInput = {
  runId: string;
  workspaceKey?: string;
  scenarioKey?: string;
  gateKey: string;
  required?: boolean;
  status: CertificationStatus;
  summary: string;
  severity?: string;
  evidence?: JsonRecord;
  actor?: CertificationActor;
};

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
const rows = (value: unknown): JsonRecord[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is JsonRecord =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
const actorName = (actor?: CertificationActor) =>
  clean(actor?.email || actor?.name || actor?.id || "AC Capital certification operator");

export const AC_CAPITAL_WORKSPACE_CONTRACTS: WorkspaceContract[] = [
  {
    key: "orchestrator",
    label: "Capital Executive Orchestrator",
    route: "/ac-capital-os/orchestrator",
    visualIdentity: "Executive control bridge, workflow supervision and exception command.",
    primaryTables: [
      "ac_capital_orchestrator_events",
      "ac_capital_orchestrator_workflows",
      "ac_capital_orchestrator_steps",
      "ac_capital_agent_registry",
      "ac_capital_integrity_issues",
    ],
    agentKey: "capital-executive-orchestrator",
    entityTypes: ["workflow", "event", "integrity"],
    critical: true,
  },
  {
    key: "radar",
    label: "Capital Radar",
    route: "/ac-capital-os/radar",
    visualIdentity: "External intelligence war room with evidence validation and deadline radar.",
    primaryTables: [
      "ac_capital_radar_sources",
      "ac_capital_radar_research_runs",
      "ac_capital_radar_opportunities",
    ],
    agentKey: "funding-opportunity-radar",
    entityTypes: ["source", "opportunity"],
    critical: true,
  },
  {
    key: "funders",
    label: "Funder Intelligence Room",
    route: "/ac-capital-os/funders",
    visualIdentity: "Institutional funder dossier, thesis and relationship strategy room.",
    primaryTables: ["ac_capital_funders"],
    agentKey: "funder-intelligence-agent",
    entityTypes: ["funder"],
    critical: true,
  },
  {
    key: "qualification",
    label: "Qualification Committee",
    route: "/ac-capital-os/qualification",
    visualIdentity: "Evidence-backed underwriting chamber and committee decision room.",
    primaryTables: [
      "ac_capital_qualification_dossiers",
      "ac_capital_qualification_scores",
      "ac_capital_qualification_decisions",
    ],
    agentKey: "qualification-underwriter",
    entityTypes: ["qualification"],
    artifactRequired: true,
    critical: true,
  },
  {
    key: "data-room",
    label: "Due Diligence Data Room",
    route: "/ac-capital-os/data-room",
    visualIdentity: "Secure proof vault, requirement matrix, expiry and contradiction control.",
    primaryTables: ["ac_capital_data_room_documents"],
    agentKey: "data-room-proof-agent",
    entityTypes: ["document"],
    artifactRequired: true,
    critical: true,
  },
  {
    key: "cases",
    label: "Funding Case Factory",
    route: "/ac-capital-os/cases",
    visualIdentity: "Evidence-linked board-grade funding case production studio.",
    primaryTables: [
      "ac_capital_cases",
      "ac_capital_case_narratives",
      "ac_capital_case_financial_sections",
      "ac_capital_case_risk_plans",
    ],
    agentKey: "funding-case-architect",
    entityTypes: ["case"],
    artifactRequired: true,
    critical: true,
  },
  {
    key: "pipeline",
    label: "Capital Pipeline",
    route: "/ac-capital-os/pipeline",
    visualIdentity: "Stage-gated capital portfolio, forecast and recovery command center.",
    primaryTables: [
      "ac_capital_pipeline_records",
      "ac_capital_pipeline_stage_events",
      "ac_capital_stage_gate_evaluations",
    ],
    agentKey: "pipeline-intelligence-agent",
    entityTypes: ["pipeline"],
    artifactRequired: true,
    critical: true,
  },
  {
    key: "approvals",
    label: "Founder Approval Chamber",
    route: "/ac-capital-os/approvals",
    visualIdentity: "Exact-version board authority, evidence and consequence chamber.",
    primaryTables: ["ac_capital_universal_approvals"],
    entityTypes: ["approval"],
    critical: true,
  },
  {
    key: "coordinator",
    label: "Coordinator Mission Desk",
    route: "/ac-capital-os/coordinator",
    visualIdentity: "Dispatch-grade human external-execution mission center.",
    primaryTables: ["ac_capital_coordinator_tasks"],
    agentKey: "coordinator-mission-planner",
    entityTypes: ["coordinator-task"],
    artifactRequired: true,
    critical: true,
  },
  {
    key: "artifacts",
    label: "Artifact Factory",
    route: "/ac-capital-os/artifacts",
    visualIdentity: "Premium A4 and multi-format governed document production studio.",
    primaryTables: ["ac_capital_artifacts", "ac_capital_artifact_versions"],
    entityTypes: ["artifact"],
    artifactRequired: true,
    critical: true,
  },
  {
    key: "reports",
    label: "Executive Report Studio",
    route: "/ac-capital-os/reports",
    visualIdentity: "Evidence-bound founder and board reporting studio.",
    primaryTables: [
      "ac_capital_strategy_reports",
      "ac_capital_strategy_report_sections",
      "ac_capital_artifacts",
    ],
    agentKey: "executive-report-agent",
    entityTypes: ["report", "artifact"],
    artifactRequired: true,
    critical: true,
  },
  {
    key: "doctrine",
    label: "Doctrine Vault",
    route: "/ac-capital-os/doctrine",
    visualIdentity: "Constitutional rules, prompt governance and conflict-control center.",
    primaryTables: [
      "ac_capital_doctrine_items",
      "ac_capital_doctrine_compilations",
    ],
    entityTypes: ["doctrine"],
    critical: true,
  },
  {
    key: "strategy",
    label: "Strategy War Room",
    route: "/ac-capital-os/strategy",
    visualIdentity: "Capital-mix, financing scenario and strategic decision laboratory.",
    primaryTables: ["ac_capital_strategy_scenarios"],
    entityTypes: ["strategy"],
    artifactRequired: true,
    critical: false,
  },
  {
    key: "learning",
    label: "Learning & Institutional Memory",
    route: "/ac-capital-os/learning",
    visualIdentity: "Win/loss, objection, proof-friction and controlled improvement laboratory.",
    primaryTables: ["ac_capital_outcome_learning"],
    agentKey: "capital-learning-agent",
    entityTypes: ["learning"],
    critical: false,
  },
  {
    key: "ai-operations",
    label: "AI Operations Control",
    route: "/ac-capital-os/ai-control",
    visualIdentity: "Provider, agent, schedule, quota, execution and emergency-control headquarters.",
    primaryTables: [
      "ac_capital_ai_providers",
      "ac_capital_ai_agents",
      "ac_capital_ai_agent_runs",
      "ac_capital_agent_schedules",
    ],
    entityTypes: ["agent", "provider-run"],
    critical: true,
  },
];

export const AC_CAPITAL_SCENARIO_CONTRACTS: ScenarioContract[] = [
  {
    key: "grant-lifecycle",
    label: "Grant lifecycle",
    description: "Public research through submission proof and learning.",
    required: true,
    steps: [
      ["research", "Run Tavily and OpenRouter research", "radar"],
      ["validate", "Validate authoritative source evidence", "radar"],
      ["opportunity", "Create canonical opportunity", "radar"],
      ["qualification", "Run AI qualification and persist evidence-backed criteria", "qualification"],
      ["proof", "Create and resolve proof requirements", "data-room"],
      ["case", "Generate structured funding case", "cases"],
      ["artifacts", "Generate and open PDF and DOCX", "artifacts"],
      ["approval", "Approve exact case or artifact version", "approvals"],
      ["mission", "Create coordinator execution pack", "coordinator"],
      ["submission", "Record manual submission proof", "pipeline"],
      ["outcome", "Record outcome and learning", "learning"],
    ].map(([key, label, workspaceKey]) => ({ key, label, workspaceKey })),
  },
  {
    key: "bank-financing",
    label: "Bank financing dossier",
    description: "Eligibility, proof readiness, bank dossier and approval-controlled mission.",
    required: true,
    steps: [
      ["program", "Create or validate bank program", "radar"],
      ["eligibility", "Verify eligibility and financial requirements", "qualification"],
      ["documents", "Record Data Room proof metadata", "data-room"],
      ["readiness", "Run proof readiness analysis", "data-room"],
      ["dossier", "Generate bank financing dossier", "artifacts"],
      ["approval", "Approve exact dossier version", "approvals"],
      ["mission", "Prepare bank communication mission", "coordinator"],
    ].map(([key, label, workspaceKey]) => ({ key, label, workspaceKey })),
  },
  {
    key: "rejection",
    label: "Evidence-backed rejection",
    description: "Hard disqualifier blocks downstream case creation and preserves learning.",
    required: true,
    steps: [
      ["evidence", "Capture evidence", "radar"],
      ["disqualifier", "Detect hard disqualifier", "qualification"],
      ["reject", "Persist rejection reason", "qualification"],
      ["block", "Confirm no case or pipeline record was created", "orchestrator"],
      ["learning", "Record controlled learning", "learning"],
    ].map(([key, label, workspaceKey]) => ({ key, label, workspaceKey })),
  },
  {
    key: "deadline-change",
    label: "Deadline change response",
    description: "Source change reprioritizes workflow without duplicate notifications.",
    required: true,
    steps: [
      ["refresh", "Revalidate source", "radar"],
      ["update", "Update opportunity deadline", "radar"],
      ["priority", "Reprioritize pipeline", "pipeline"],
      ["missions", "Reschedule missions", "coordinator"],
      ["notify", "Create one governed notification", "orchestrator"],
    ].map(([key, label, workspaceKey]) => ({ key, label, workspaceKey })),
  },
  {
    key: "provider-failure",
    label: "Provider failure recovery",
    description: "No false completion, preserved evidence and controlled retry/dead letter.",
    required: true,
    steps: [
      ["fail", "Trigger controlled provider failure", "ai-operations"],
      ["honest", "Confirm failed status and exact error", "ai-operations"],
      ["duplicates", "Confirm no duplicate business records", "orchestrator"],
      ["retry", "Retry or move to dead letter", "ai-operations"],
      ["restore", "Restore provider and complete successfully", "ai-operations"],
    ].map(([key, label, workspaceKey]) => ({ key, label, workspaceKey })),
  },
  {
    key: "approval-version",
    label: "Approval version integrity",
    description: "Editing an approved object supersedes the old approval and blocks release.",
    required: true,
    steps: [
      ["approve", "Approve version N", "approvals"],
      ["edit", "Edit object to version N+1", "cases"],
      ["supersede", "Confirm old approval is superseded", "approvals"],
      ["block", "Confirm external execution remains blocked", "coordinator"],
    ].map(([key, label, workspaceKey]) => ({ key, label, workspaceKey })),
  },
  {
    key: "concurrency",
    label: "Worker concurrency",
    description: "One lease holder processes one event without duplicate records.",
    required: true,
    steps: [
      ["ticks", "Start two runtime ticks", "ai-operations"],
      ["lease", "Confirm one lease holder", "orchestrator"],
      ["single", "Confirm one execution and no duplicates", "orchestrator"],
    ].map(([key, label, workspaceKey]) => ({ key, label, workspaceKey })),
  },
  {
    key: "artifact-integrity",
    label: "Artifact integrity",
    description: "All required formats open and approved snapshots remain immutable.",
    required: true,
    steps: [
      ["generate", "Generate PDF, DOCX, XLSX, CSV, JSON and ZIP", "artifacts"],
      ["open", "Open and inspect each format", "artifacts"],
      ["hash", "Verify stored hashes and byte sizes", "artifacts"],
      ["approve", "Approve exact artifact version", "approvals"],
      ["immutable", "Confirm approved snapshot cannot be overwritten", "artifacts"],
    ].map(([key, label, workspaceKey]) => ({ key, label, workspaceKey })),
  },
];

const REQUIRED_GATES = [
  "route",
  "data",
  "crud",
  "ai",
  "workflow",
  "integrity",
  "governance",
  "recovery",
  "visual",
  "accessibility",
  "performance",
  "artifact",
] as const;

async function tableProbe(table: string): Promise<TableProbe> {
  const supabase = await createServiceClient();
  const result = await supabase.from(table).select("id", { count: "exact", head: true });
  if (result.error) return { table, ok: false, count: 0, error: result.error.message };
  return { table, ok: true, count: Number(result.count || 0) };
}

async function countWhere(
  table: string,
  configure?: (query: any) => any,
): Promise<{ ok: boolean; count: number; error?: string }> {
  const supabase = await createServiceClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (configure) query = configure(query);
  const result = await query;
  if (result.error) return { ok: false, count: 0, error: result.error.message };
  return { ok: true, count: Number(result.count || 0) };
}

async function latestManualCheck(workspaceKey: string, gateKey: string) {
  const supabase = await createServiceClient();
  const result = await supabase
    .from("ac_capital_certification_checks")
    .select("*")
    .eq("workspace_key", workspaceKey)
    .eq("gate_key", gateKey)
    .in("status", ["CERTIFIED", "FAILED", "BLOCKED"])
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) return null;
  return result.data as JsonRecord | null;
}

async function persistCheck(input: CheckInput) {
  const supabase = await createServiceClient();
  const payload = {
    run_id: input.runId,
    workspace_key: input.workspaceKey || "",
    scenario_key: input.scenarioKey || "",
    gate_key: input.gateKey,
    required: input.required !== false,
    status: input.status,
    severity: input.severity || "medium",
    summary: input.summary,
    evidence: input.evidence || {},
    checked_by: actorName(input.actor),
    checked_at: now(),
    updated_at: now(),
  };
  const result = await supabase
    .from("ac_capital_certification_checks")
    .upsert(payload, {
      onConflict: "run_id,workspace_key,scenario_key,gate_key",
    })
    .select("*")
    .single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}

function deriveStatus(checks: JsonRecord[]): CertificationStatus {
  const required = checks.filter((check) => check.required !== false);
  if (!required.length) return "NOT TESTED";
  if (required.some((check) => clean(check.status) === "FAILED")) return "FAILED";
  if (required.some((check) => clean(check.status) === "BLOCKED")) return "BLOCKED";
  if (required.every((check) => clean(check.status) === "CERTIFIED")) return "CERTIFIED";
  if (required.some((check) => clean(check.status) === "CERTIFIED")) return "PARTIALLY CERTIFIED";
  return "NOT TESTED";
}

async function deriveWorkspaceChecks(
  contract: WorkspaceContract,
  runId: string,
  actor?: CertificationActor,
) {
  const checks: JsonRecord[] = [];
  const probes = await Promise.all(contract.primaryTables.map(tableProbe));
  const dataOk = probes.every((probe) => probe.ok);
  checks.push(
    await persistCheck({
      runId,
      workspaceKey: contract.key,
      gateKey: "data",
      status: dataOk ? "CERTIFIED" : "FAILED",
      summary: dataOk
        ? `${contract.primaryTables.length} canonical table contract(s) are accessible.`
        : "One or more canonical table contracts are unavailable.",
      severity: dataOk ? "low" : "critical",
      evidence: { probes },
      actor,
    }),
  );

  const routeEvidence = await latestManualCheck(contract.key, "route");
  checks.push(
    await persistCheck({
      runId,
      workspaceKey: contract.key,
      gateKey: "route",
      status: (clean(routeEvidence?.status) as CertificationStatus) || "NOT TESTED",
      summary: routeEvidence
        ? clean(routeEvidence.summary)
        : "Browser route acceptance has not been recorded for this run.",
      evidence: routeEvidence ? object(routeEvidence.evidence) : { route: contract.route },
      actor,
    }),
  );

  const commandCount = await countWhere("ac_capital_command_results", (query) =>
    query.eq("workspace_key", contract.key).eq("status", "completed"),
  );
  checks.push(
    await persistCheck({
      runId,
      workspaceKey: contract.key,
      gateKey: "crud",
      status: commandCount.ok && commandCount.count > 0 ? "CERTIFIED" : commandCount.ok ? "NOT TESTED" : "FAILED",
      summary: commandCount.ok
        ? commandCount.count > 0
          ? `${commandCount.count} persisted completed command result(s) prove at least one real mutation.`
          : "No persisted CRUD command evidence exists yet."
        : "CRUD command evidence could not be read.",
      evidence: commandCount,
      actor,
    }),
  );

  if (contract.agentKey) {
    const agentCount = await countWhere("ac_capital_agent_outputs", (query) =>
      query.eq("agent_key", contract.agentKey).eq("status", "completed"),
    );
    checks.push(
      await persistCheck({
        runId,
        workspaceKey: contract.key,
        gateKey: "ai",
        status: agentCount.ok && agentCount.count > 0 ? "CERTIFIED" : agentCount.ok ? "NOT TESTED" : "FAILED",
        summary: agentCount.ok
          ? agentCount.count > 0
            ? `${agentCount.count} validated AI agent output(s) are persisted.`
            : `No completed live output exists for ${contract.agentKey}.`
          : `AI output evidence for ${contract.agentKey} could not be read.`,
        evidence: { ...agentCount, agentKey: contract.agentKey },
        actor,
      }),
    );
  } else {
    checks.push(
      await persistCheck({
        runId,
        workspaceKey: contract.key,
        gateKey: "ai",
        required: false,
        status: "CERTIFIED",
        summary: "A dedicated AI execution is not required for this governance workspace.",
        evidence: { notApplicable: true },
        actor,
      }),
    );
  }

  const linkCount = await countWhere("ac_capital_entity_links", (query) =>
    query.in("from_type", contract.entityTypes).limit(1),
  );
  checks.push(
    await persistCheck({
      runId,
      workspaceKey: contract.key,
      gateKey: "workflow",
      status: linkCount.ok && linkCount.count > 0 ? "CERTIFIED" : linkCount.ok ? "NOT TESTED" : "FAILED",
      summary: linkCount.ok
        ? linkCount.count > 0
          ? `${linkCount.count} canonical relationship link(s) are persisted.`
          : "No cross-workspace lifecycle link has been proven yet."
        : "Lifecycle relationship evidence could not be read.",
      evidence: linkCount,
      actor,
    }),
  );

  const integrityOpen = await countWhere("ac_capital_integrity_issues", (query) =>
    query.eq("status", "open").in("entity_type", contract.entityTypes),
  );
  checks.push(
    await persistCheck({
      runId,
      workspaceKey: contract.key,
      gateKey: "integrity",
      status: integrityOpen.ok
        ? integrityOpen.count === 0
          ? "CERTIFIED"
          : "BLOCKED"
        : "FAILED",
      summary: integrityOpen.ok
        ? integrityOpen.count === 0
          ? "No open canonical integrity issue is registered for this workspace."
          : `${integrityOpen.count} open integrity issue(s) block certification.`
        : "Integrity evidence could not be read.",
      severity: integrityOpen.count > 0 ? "critical" : "low",
      evidence: integrityOpen,
      actor,
    }),
  );

  const governanceCount = await countWhere("ac_capital_universal_approvals", (query) =>
    query.in("object_type", contract.entityTypes),
  );
  const governanceRequired = ["cases", "pipeline", "approvals", "coordinator", "artifacts", "reports"].includes(contract.key);
  checks.push(
    await persistCheck({
      runId,
      workspaceKey: contract.key,
      gateKey: "governance",
      required: governanceRequired,
      status: governanceRequired
        ? governanceCount.ok && governanceCount.count > 0
          ? "CERTIFIED"
          : governanceCount.ok
            ? "NOT TESTED"
            : "FAILED"
        : "CERTIFIED",
      summary: governanceRequired
        ? governanceCount.ok && governanceCount.count > 0
          ? `${governanceCount.count} exact-version approval record(s) exist.`
          : governanceCount.ok
            ? "No exact-version governance decision has been exercised yet."
            : "Approval evidence could not be read."
        : "Exact-version approval is not a mandatory gate for this workspace.",
      evidence: governanceCount,
      actor,
    }),
  );

  if (contract.artifactRequired) {
    const artifactCount = await countWhere("ac_capital_artifacts", (query) =>
      query.in("entity_type", contract.entityTypes),
    );
    checks.push(
      await persistCheck({
        runId,
        workspaceKey: contract.key,
        gateKey: "artifact",
        status: artifactCount.ok && artifactCount.count > 0 ? "CERTIFIED" : artifactCount.ok ? "NOT TESTED" : "FAILED",
        summary: artifactCount.ok
          ? artifactCount.count > 0
            ? `${artifactCount.count} governed artifact record(s) exist for this workspace.`
            : "No workspace artifact has been generated and validated yet."
          : "Artifact evidence could not be read.",
        evidence: artifactCount,
        actor,
      }),
    );
  } else {
    checks.push(
      await persistCheck({
        runId,
        workspaceKey: contract.key,
        gateKey: "artifact",
        required: false,
        status: "CERTIFIED",
        summary: "A dedicated artifact is not mandatory for this workspace.",
        evidence: { notApplicable: true },
        actor,
      }),
    );
  }

  for (const gateKey of ["recovery", "visual", "accessibility", "performance"] as const) {
    const manual = await latestManualCheck(contract.key, gateKey);
    checks.push(
      await persistCheck({
        runId,
        workspaceKey: contract.key,
        gateKey,
        status: (clean(manual?.status) as CertificationStatus) || "NOT TESTED",
        summary: manual
          ? clean(manual.summary)
          : `${gateKey} acceptance evidence has not been recorded.`,
        evidence: manual ? object(manual.evidence) : {},
        actor,
      }),
    );
  }

  return checks;
}

async function startRun(actor: CertificationActor | undefined, runType: string, scope: JsonRecord) {
  const supabase = await createServiceClient();
  const result = await supabase
    .from("ac_capital_certification_runs")
    .insert({
      run_type: runType,
      status: "running",
      scope,
      environment: {
        source: "AC_CAPITAL_OS_IC10",
        executedAt: now(),
      },
      started_by: actorName(actor),
      started_at: now(),
    })
    .select("*")
    .single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}

async function finishRun(runId: string, status: CertificationStatus, summary: string, totals: JsonRecord) {
  const supabase = await createServiceClient();
  const result = await supabase
    .from("ac_capital_certification_runs")
    .update({ status, summary, totals, finished_at: now(), updated_at: now() })
    .eq("id", runId)
    .select("*")
    .single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}

export async function runWorkspaceCertification(input: {
  actor?: CertificationActor;
  workspaceKey?: string;
}) {
  const selected = input.workspaceKey
    ? AC_CAPITAL_WORKSPACE_CONTRACTS.filter((contract) => contract.key === input.workspaceKey)
    : AC_CAPITAL_WORKSPACE_CONTRACTS;
  if (!selected.length) throw Object.assign(new Error("AC_CAPITAL_UNKNOWN_WORKSPACE"), { status: 400 });

  const run = await startRun(input.actor, "workspace-certification", {
    workspaceKey: input.workspaceKey || "all",
  });
  const workspaceResults: JsonRecord[] = [];

  for (const contract of selected) {
    const checks = await deriveWorkspaceChecks(contract, clean(run.id), input.actor);
    const status = deriveStatus(checks);
    const blockers = checks
      .filter((check) => ["FAILED", "BLOCKED", "NOT TESTED"].includes(clean(check.status)) && check.required !== false)
      .map((check) => ({ gateKey: check.gate_key, status: check.status, summary: check.summary }));

    const supabase = await createServiceClient();
    const persisted = await supabase
      .from("ac_capital_workspace_certifications")
      .upsert(
        {
          workspace_key: contract.key,
          workspace_label: contract.label,
          route_path: contract.route,
          visual_identity: contract.visualIdentity,
          status,
          critical: contract.critical,
          last_run_id: run.id,
          blocking_reasons: blockers,
          metrics: {
            totalChecks: checks.length,
            certified: checks.filter((check) => clean(check.status) === "CERTIFIED").length,
            failed: checks.filter((check) => clean(check.status) === "FAILED").length,
            blocked: checks.filter((check) => clean(check.status) === "BLOCKED").length,
            notTested: checks.filter((check) => clean(check.status) === "NOT TESTED").length,
          },
          certified_at: status === "CERTIFIED" ? now() : null,
          certified_by: status === "CERTIFIED" ? actorName(input.actor) : null,
          updated_at: now(),
        },
        { onConflict: "workspace_key" },
      )
      .select("*")
      .single();
    if (persisted.error) throw persisted.error;
    workspaceResults.push({ ...persisted.data, checks });
  }

  const status = deriveStatus(
    workspaceResults.map((workspace) => ({
      status: workspace.status,
      required: workspace.critical !== false,
    })),
  );
  const runResult = await finishRun(
    clean(run.id),
    status,
    `${workspaceResults.length} workspace certification contract(s) evaluated without inventing browser evidence.`,
    {
      workspaces: workspaceResults.length,
      certified: workspaceResults.filter((workspace) => clean(workspace.status) === "CERTIFIED").length,
      partial: workspaceResults.filter((workspace) => clean(workspace.status) === "PARTIALLY CERTIFIED").length,
      blocked: workspaceResults.filter((workspace) => clean(workspace.status) === "BLOCKED").length,
      failed: workspaceResults.filter((workspace) => clean(workspace.status) === "FAILED").length,
      notTested: workspaceResults.filter((workspace) => clean(workspace.status) === "NOT TESTED").length,
    },
  );
  return { run: runResult, workspaces: workspaceResults };
}

async function upsertIntegrityIssue(input: {
  code: string;
  entityType: string;
  entityId?: string;
  severity: string;
  title: string;
  detail: string;
  action: string;
  snapshot?: JsonRecord;
}) {
  const supabase = await createServiceClient();
  const payload = {
    issue_code: input.code,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    severity: input.severity,
    status: "open",
    title: input.title,
    detail: input.detail,
    recommended_action: input.action,
    auto_repairable: false,
    detected_snapshot: input.snapshot || {},
    detected_at: now(),
    updated_at: now(),
  };
  const result = await supabase
    .from("ac_capital_integrity_issues")
    .upsert(payload, { onConflict: "issue_code,entity_type,entity_id" })
    .select("*")
    .single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}

export async function runCanonicalIntegrityAudit(actor?: CertificationActor) {
  const run = await startRun(actor, "canonical-integrity-audit", { scope: "capital-lifecycle" });
  const supabase = await createServiceClient();
  const findings: JsonRecord[] = [];

  const opportunities = await supabase
    .from("ac_capital_radar_opportunities")
    .select("id,title,status,source_id,source_url")
    .neq("status", "rejected")
    .limit(1000);
  if (opportunities.error) throw opportunities.error;
  for (const row of rows(opportunities.data)) {
    if (!row.source_id && !clean(row.source_url)) {
      findings.push(
        await upsertIntegrityIssue({
          code: "OPPORTUNITY_WITHOUT_EVIDENCE",
          entityType: "opportunity",
          entityId: clean(row.id),
          severity: "critical",
          title: "Opportunity has no source evidence",
          detail: clean(row.title) || "Canonical opportunity lacks source provenance.",
          action: "Attach a validated source or record an authorized manual override.",
          snapshot: row,
        }),
      );
    }
  }

  const qualifications = await supabase
    .from("ac_capital_qualification_dossiers")
    .select("id,title,radar_opportunity_id,status")
    .limit(1000);
  if (qualifications.error) throw qualifications.error;
  for (const row of rows(qualifications.data)) {
    if (!row.radar_opportunity_id) {
      findings.push(
        await upsertIntegrityIssue({
          code: "QUALIFICATION_WITHOUT_OPPORTUNITY",
          entityType: "qualification",
          entityId: clean(row.id),
          severity: "high",
          title: "Qualification has no canonical opportunity",
          detail: clean(row.title) || "Qualification provenance is incomplete.",
          action: "Link the dossier to a canonical Radar opportunity or record a founder override.",
          snapshot: row,
        }),
      );
    }
  }

  const cases = await supabase
    .from("ac_capital_cases")
    .select("id,case_title,qualification_dossier_id,opportunity_id,status")
    .limit(1000);
  if (cases.error) throw cases.error;
  for (const row of rows(cases.data)) {
    if (!row.qualification_dossier_id) {
      findings.push(
        await upsertIntegrityIssue({
          code: "CASE_WITHOUT_QUALIFICATION",
          entityType: "case",
          entityId: clean(row.id),
          severity: "critical",
          title: "Funding case has no qualification provenance",
          detail: clean(row.case_title) || "Case lifecycle provenance is incomplete.",
          action: "Link a qualification dossier or record an explicit founder override before approval.",
          snapshot: row,
        }),
      );
    }
  }

  const pipeline = await supabase
    .from("ac_capital_pipeline_records")
    .select("id,title,case_id,owner,next_action,stage,status")
    .limit(1000);
  if (pipeline.error) throw pipeline.error;
  for (const row of rows(pipeline.data)) {
    const missing = [
      !row.case_id ? "case_id" : "",
      !clean(row.owner) ? "owner" : "",
      !clean(row.next_action) ? "next_action" : "",
    ].filter(Boolean);
    if (missing.length) {
      findings.push(
        await upsertIntegrityIssue({
          code: "PIPELINE_REQUIRED_FIELDS_MISSING",
          entityType: "pipeline",
          entityId: clean(row.id),
          severity: missing.includes("case_id") ? "critical" : "high",
          title: "Active pipeline record is operationally incomplete",
          detail: `${clean(row.title) || "Pipeline record"}: missing ${missing.join(", ")}.`,
          action: "Complete canonical case link, owner and next action before stage advancement.",
          snapshot: row,
        }),
      );
    }
  }

  const approvals = await supabase
    .from("ac_capital_universal_approvals")
    .select("id,object_type,object_id,object_version,status,snapshot,evidence_package")
    .eq("status", "approved")
    .limit(1000);
  if (approvals.error) throw approvals.error;
  for (const row of rows(approvals.data)) {
    if (!clean(row.object_version) || !Object.keys(object(row.snapshot)).length) {
      findings.push(
        await upsertIntegrityIssue({
          code: "APPROVAL_WITHOUT_VERSION_SNAPSHOT",
          entityType: "approval",
          entityId: clean(row.id),
          severity: "critical",
          title: "Approved decision lacks exact-version evidence",
          detail: `${clean(row.object_type)} approval cannot safely authorize external action.`,
          action: "Supersede this approval and request a new exact-version approval.",
          snapshot: row,
        }),
      );
    }
  }

  const artifacts = await supabase
    .from("ac_capital_artifacts")
    .select("id,title,status,approval_status,current_version,approved_version,immutable_snapshot_hash")
    .eq("approval_status", "approved")
    .limit(1000);
  if (artifacts.error) throw artifacts.error;
  for (const row of rows(artifacts.data)) {
    if (!row.approved_version || !clean(row.immutable_snapshot_hash)) {
      findings.push(
        await upsertIntegrityIssue({
          code: "APPROVED_ARTIFACT_NOT_IMMUTABLE",
          entityType: "artifact",
          entityId: clean(row.id),
          severity: "critical",
          title: "Approved artifact lacks immutable snapshot proof",
          detail: clean(row.title) || "Approved document cannot be independently verified.",
          action: "Regenerate, hash and approve an immutable artifact version.",
          snapshot: row,
        }),
      );
    }
  }

  const staleEvents = await supabase
    .from("ac_capital_orchestrator_events")
    .select("id,event_type,status,updated_at,created_at")
    .in("status", ["queued", "processing", "running"])
    .lt("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
    .limit(500);
  if (staleEvents.error) throw staleEvents.error;
  for (const row of rows(staleEvents.data)) {
    findings.push(
      await upsertIntegrityIssue({
        code: "STALE_ORCHESTRATOR_EVENT",
        entityType: "event",
        entityId: clean(row.id),
        severity: "high",
        title: "Orchestrator event exceeded runtime window",
        detail: `${clean(row.event_type)} remains ${clean(row.status)} beyond 30 minutes.`,
        action: "Retry, cancel or dead-letter the event after inspecting evidence.",
        snapshot: row,
      }),
    );
  }

  const runResult = await finishRun(
    clean(run.id),
    findings.some((finding) => clean(finding.severity) === "critical")
      ? "BLOCKED"
      : findings.length
        ? "PARTIALLY CERTIFIED"
        : "CERTIFIED",
    findings.length
      ? `${findings.length} canonical integrity finding(s) require review.`
      : "No canonical integrity finding was detected by the non-destructive audit.",
    {
      findings: findings.length,
      critical: findings.filter((finding) => clean(finding.severity) === "critical").length,
      high: findings.filter((finding) => clean(finding.severity) === "high").length,
    },
  );
  return { run: runResult, findings };
}

export async function recordCertificationEvidence(input: {
  actor?: CertificationActor;
  workspaceKey?: string;
  scenarioKey?: string;
  gateKey: string;
  status: CertificationStatus;
  summary: string;
  evidenceType?: string;
  reference?: string;
  payload?: JsonRecord;
}) {
  const run = await startRun(input.actor, "manual-evidence", {
    workspaceKey: input.workspaceKey || null,
    scenarioKey: input.scenarioKey || null,
    gateKey: input.gateKey,
  });
  const check = await persistCheck({
    runId: clean(run.id),
    workspaceKey: input.workspaceKey,
    scenarioKey: input.scenarioKey,
    gateKey: input.gateKey,
    status: input.status,
    summary: input.summary,
    evidence: input.payload || {},
    actor: input.actor,
  });
  const supabase = await createServiceClient();
  const evidenceResult = await supabase
    .from("ac_capital_certification_evidence")
    .insert({
      check_id: check.id,
      workspace_key: input.workspaceKey || "",
      scenario_key: input.scenarioKey || "",
      evidence_type: input.evidenceType || "operator-evidence",
      title: input.summary,
      reference: input.reference || null,
      payload: input.payload || {},
      recorded_by: actorName(input.actor),
      recorded_at: now(),
    })
    .select("*")
    .single();
  if (evidenceResult.error) throw evidenceResult.error;
  await finishRun(clean(run.id), input.status, input.summary, { checks: 1, evidence: 1 });
  return { check, evidence: evidenceResult.data };
}

export async function updateScenarioStep(input: {
  actor?: CertificationActor;
  scenarioKey: string;
  stepKey: string;
  status: CertificationStatus;
  summary: string;
  evidence?: JsonRecord;
}) {
  const contract = AC_CAPITAL_SCENARIO_CONTRACTS.find((scenario) => scenario.key === input.scenarioKey);
  if (!contract) throw Object.assign(new Error("AC_CAPITAL_UNKNOWN_SCENARIO"), { status: 400 });
  const step = contract.steps.find((item) => item.key === input.stepKey);
  if (!step) throw Object.assign(new Error("AC_CAPITAL_UNKNOWN_SCENARIO_STEP"), { status: 400 });
  const supabase = await createServiceClient();
  const scenarioResult = await supabase
    .from("ac_capital_scenario_certifications")
    .upsert(
      {
        scenario_key: contract.key,
        title: contract.label,
        description: contract.description,
        required: contract.required,
        status: "PARTIALLY CERTIFIED",
        started_at: now(),
        updated_at: now(),
      },
      { onConflict: "scenario_key" },
    )
    .select("*")
    .single();
  if (scenarioResult.error) throw scenarioResult.error;
  const stepResult = await supabase
    .from("ac_capital_scenario_steps")
    .upsert(
      {
        scenario_key: contract.key,
        step_key: step.key,
        sequence_no: contract.steps.findIndex((item) => item.key === step.key) + 1,
        label: step.label,
        workspace_key: step.workspaceKey,
        status: input.status,
        summary: input.summary,
        evidence: input.evidence || {},
        completed_by: input.status === "CERTIFIED" ? actorName(input.actor) : null,
        completed_at: input.status === "CERTIFIED" ? now() : null,
        updated_at: now(),
      },
      { onConflict: "scenario_key,step_key" },
    )
    .select("*")
    .single();
  if (stepResult.error) throw stepResult.error;

  const stepsResult = await supabase
    .from("ac_capital_scenario_steps")
    .select("*")
    .eq("scenario_key", contract.key)
    .order("sequence_no", { ascending: true });
  if (stepsResult.error) throw stepsResult.error;
  const persistedSteps = rows(stepsResult.data);
  const status = deriveStatus(
    contract.steps.map((expected) => {
      const actual = persistedSteps.find((candidate) => clean(candidate.step_key) === expected.key);
      return { status: actual?.status || "NOT TESTED", required: true };
    }),
  );
  const completed = persistedSteps.filter((candidate) => clean(candidate.status) === "CERTIFIED").length;
  const blockers = persistedSteps
    .filter((candidate) => ["FAILED", "BLOCKED"].includes(clean(candidate.status)))
    .map((candidate) => ({ stepKey: candidate.step_key, status: candidate.status, summary: candidate.summary }));
  const updatedScenario = await supabase
    .from("ac_capital_scenario_certifications")
    .update({
      status,
      current_step: completed,
      total_steps: contract.steps.length,
      blocking_reasons: blockers,
      finished_at: status === "CERTIFIED" ? now() : null,
      certified_by: status === "CERTIFIED" ? actorName(input.actor) : null,
      updated_at: now(),
    })
    .eq("scenario_key", contract.key)
    .select("*")
    .single();
  if (updatedScenario.error) throw updatedScenario.error;
  return { scenario: updatedScenario.data, step: stepResult.data, steps: persistedSteps };
}

export async function loadCertificationSnapshot(input?: {
  workspaceKey?: string;
  mode?: string;
}) {
  const supabase = await createServiceClient();
  if (input?.mode === "pulse" && input.workspaceKey) {
    const result = await supabase
      .from("ac_capital_workspace_certifications")
      .select("*")
      .eq("workspace_key", input.workspaceKey)
      .maybeSingle();
    if (result.error) throw result.error;
    const contract = AC_CAPITAL_WORKSPACE_CONTRACTS.find((item) => item.key === input.workspaceKey);
    return {
      certification: result.data || null,
      contract: contract || null,
      generatedAt: now(),
    };
  }

  const [runsResult, checksResult, workspacesResult, scenariosResult, stepsResult, evidenceResult, issuesResult, artifactsResult, signoffsResult] = await Promise.all([
    supabase.from("ac_capital_certification_runs").select("*").order("started_at", { ascending: false }).limit(50),
    supabase.from("ac_capital_certification_checks").select("*").order("checked_at", { ascending: false }).limit(600),
    supabase.from("ac_capital_workspace_certifications").select("*").order("critical", { ascending: false }).order("workspace_label", { ascending: true }),
    supabase.from("ac_capital_scenario_certifications").select("*").order("required", { ascending: false }).order("title", { ascending: true }),
    supabase.from("ac_capital_scenario_steps").select("*").order("scenario_key", { ascending: true }).order("sequence_no", { ascending: true }),
    supabase.from("ac_capital_certification_evidence").select("*").order("recorded_at", { ascending: false }).limit(300),
    supabase.from("ac_capital_integrity_issues").select("*").eq("status", "open").order("severity", { ascending: true }).order("detected_at", { ascending: false }).limit(300),
    supabase.from("ac_capital_artifacts").select("id,title,artifact_type,status,approval_status,current_version,approved_version,immutable_snapshot_hash,updated_at").order("updated_at", { ascending: false }).limit(100),
    supabase.from("ac_capital_certification_signoffs").select("*").order("signed_at", { ascending: false }).limit(20),
  ]);
  for (const result of [runsResult, checksResult, workspacesResult, scenariosResult, stepsResult, evidenceResult, issuesResult, artifactsResult, signoffsResult]) {
    if (result.error) throw result.error;
  }
  return {
    contracts: AC_CAPITAL_WORKSPACE_CONTRACTS,
    scenarioContracts: AC_CAPITAL_SCENARIO_CONTRACTS,
    runs: rows(runsResult.data),
    checks: rows(checksResult.data),
    workspaces: rows(workspacesResult.data),
    scenarios: rows(scenariosResult.data),
    scenarioSteps: rows(stepsResult.data),
    evidence: rows(evidenceResult.data),
    integrityIssues: rows(issuesResult.data),
    artifacts: rows(artifactsResult.data),
    signoffs: rows(signoffsResult.data),
    requiredGates: REQUIRED_GATES,
    generatedAt: now(),
  };
}

export async function initializeCertificationContracts(actor?: CertificationActor) {
  const supabase = await createServiceClient();
  const workspaceRows = AC_CAPITAL_WORKSPACE_CONTRACTS.map((contract) => ({
    workspace_key: contract.key,
    workspace_label: contract.label,
    route_path: contract.route,
    visual_identity: contract.visualIdentity,
    status: "NOT TESTED",
    critical: contract.critical,
    required_gates: REQUIRED_GATES,
    metrics: {},
    blocking_reasons: [],
    updated_at: now(),
  }));
  const workspaceResult = await supabase
    .from("ac_capital_workspace_certifications")
    .upsert(workspaceRows, { onConflict: "workspace_key", ignoreDuplicates: true })
    .select("*");
  if (workspaceResult.error) throw workspaceResult.error;

  const scenarioRows = AC_CAPITAL_SCENARIO_CONTRACTS.map((scenario) => ({
    scenario_key: scenario.key,
    title: scenario.label,
    description: scenario.description,
    required: scenario.required,
    status: "NOT TESTED",
    total_steps: scenario.steps.length,
    current_step: 0,
    blocking_reasons: [],
    updated_at: now(),
  }));
  const scenarioResult = await supabase
    .from("ac_capital_scenario_certifications")
    .upsert(scenarioRows, { onConflict: "scenario_key", ignoreDuplicates: true })
    .select("*");
  if (scenarioResult.error) throw scenarioResult.error;

  const stepRows = AC_CAPITAL_SCENARIO_CONTRACTS.flatMap((scenario) =>
    scenario.steps.map((step, index) => ({
      scenario_key: scenario.key,
      step_key: step.key,
      sequence_no: index + 1,
      label: step.label,
      workspace_key: step.workspaceKey,
      status: "NOT TESTED",
      summary: "Live evidence has not been recorded.",
      evidence: {},
      updated_at: now(),
    })),
  );
  const stepResult = await supabase
    .from("ac_capital_scenario_steps")
    .upsert(stepRows, { onConflict: "scenario_key,step_key", ignoreDuplicates: true })
    .select("*");
  if (stepResult.error) throw stepResult.error;
  return {
    initializedBy: actorName(actor),
    workspaces: workspaceResult.data || [],
    scenarios: scenarioResult.data || [],
    steps: stepResult.data || [],
  };
}

export function certificationRequestId() {
  return randomUUID();
}

export async function recordBoardCertificationSignoff(input: {
  actor?: CertificationActor;
  statement: string;
  snapshot: JsonRecord;
}) {
  const supabase = await createServiceClient();
  const snapshotHash = createHash("sha256")
    .update(JSON.stringify(input.snapshot))
    .digest("hex");
  const result = await supabase
    .from("ac_capital_certification_signoffs")
    .insert({
      certification_status: "CERTIFIED",
      statement: input.statement,
      snapshot: input.snapshot,
      snapshot_hash: snapshotHash,
      signed_by: actorName(input.actor),
      signed_at: now(),
    })
    .select("*")
    .single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}
