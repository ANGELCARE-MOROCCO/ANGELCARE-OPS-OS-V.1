"use client";

import { AlertTriangle, ArrowUpRight, Bot, BriefcaseBusiness, Building2, CheckCircle2, FileLock2, Gauge, Landmark, Network, ShieldCheck, Sparkles, Target, TimerReset, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { ErrorState, LoadingState } from "../../core/AsyncState";
import { MetricTile } from "../../core/MetricTile";
import { Dialog, Drawer } from "../../core/Overlay";
import { ActionFeedback, Field } from "../../core/FormParts";
import { AuditTimeline, FactGrid, PrimaryButton, SecondaryButton, SectionHeading, TruthChip } from "../../core/WorkspaceParts";
import { postEnvelope } from "../../core/api";
import { formatDh, number, rowsFrom, text } from "../../core/data";
import type { CapitalActor, Row } from "../../core/types";
import { useAction } from "../../core/useAction";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./command-floor.module.css";

const flow = [
  ["Radar", "radar", Target], ["Qualification", "dossiers", Gauge], ["Funders", "funders", Landmark], ["Strategy", "blockers", Network],
  ["Case Factory", "cases", BriefcaseBusiness], ["Data Room", "documents", FileLock2], ["Approvals", "approvals", ShieldCheck],
  ["Pipeline", "deals", Building2], ["Coordinator", "tasks", UserRoundCheck], ["AI Alerts", "issues", Bot],
] as const;

export function CommandFloorPage({ actor }: { actor: CapitalActor }) {
  const workspace = useWorkspace("/api/ac-capital-os/command-floor");
  const [selectedNode, setSelectedNode] = useState<(typeof flow)[number] | null>(null);
  const [modal, setModal] = useState<"mission" | "approval" | "brief" | null>(null);
  const action = useAction();
  const [mission, setMission] = useState({ taskTitle: "", taskType: "Capital Mission", dueAt: "", proofRequired: true, founderApprovalRequired: false, humanActionRequired: "" });
  const [approval, setApproval] = useState({ title: "", reason: "", riskIfUnapproved: "", dueAt: "" });
  const [brief, setBrief] = useState({ reportType: "Founder Capital Brief", audience: "Founder / Managing Director", purpose: "Weekly executive capital decision brief" });

  const groups = useMemo(() => Object.fromEntries(flow.map(([, group]) => [group, rowsFrom(workspace.envelope, group)])) as Record<string, Row[]>, [workspace.envelope]);
  const liveDomainCount = flow.filter(([, group]) => (groups[group]?.length || 0) > 0).length;
  const domainCoverage = Math.round((liveDomainCount / flow.length) * 100);
  const deals = groups.deals || [];
  const pipelineValue = deals.reduce((sum, row) => sum + number(row, ["weighted_value", "estimated_amount_max", "estimated_amount_min"], 0), 0);
  const pendingApprovals = (groups.approvals || []).filter((row) => !["approved", "rejected"].includes(text(row, ["status"], "").toLowerCase())).length;
  const criticalBlockers = (groups.blockers || []).filter((row) => ["critical", "high"].includes(text(row, ["severity"], "").toLowerCase())).length;
  const urgentTasks = (groups.tasks || []).filter((row) => ["urgent", "critical", "high"].includes(text(row, ["priority"], "").toLowerCase())).length;
  const audits = rowsFrom(workspace.envelope, "auditEvents").slice(0, 8);

  async function submitMission() {
    if (!mission.taskTitle.trim()) return action.validate("Mission title is required.");
    await action.execute(async () => postEnvelope("/api/ac-capital-os/coordinator-cockpit", { action: "create-task", ...mission }), "Coordinator mission created and persisted.");
    await workspace.refresh();
  }
  async function submitApproval() {
    if (!approval.title.trim() || !approval.reason.trim()) return action.validate("Approval title and reason are required.");
    await action.execute(async () => postEnvelope("/api/ac-capital-os/approvals", approval), "Founder approval request created.");
    await workspace.refresh();
  }
  async function generateBrief() {
    await action.execute(async () => postEnvelope("/api/ac-capital-os/reports/generate", { ...brief, sourceWorkspaces: ["command-floor", "pipeline", "data-room", "approvals"], sections: ["Capital Situation", "Pipeline Exposure", "Founder Decisions", "Critical Proof", "Next 7 Days"] }), "Founder brief draft generated from the report API.");
  }

  const insights = [
    { label: "Capital priority", value: groups.cases?.length ? text(groups.cases[0], ["case_title"], "Review the strongest live case") : "Create or activate the first live capital case" },
    { label: "Approval exposure", value: `${pendingApprovals} founder decision${pendingApprovals === 1 ? "" : "s"} waiting` },
    { label: "Execution pressure", value: `${urgentTasks} urgent coordinator mission${urgentTasks === 1 ? "" : "s"}` },
    { label: "Production truth", value: workspace.envelope?.dataMode === "supabase-live" ? "Command floor is reading live records" : "No live records confirmed for one or more domains" },
  ];

  return <AcCapitalShell actor={actor} workspaceKey="capital-command-floor" title="Capital Command Floor" subtitle="AngelCare’s private capital headquarters: opportunity intelligence, founder decisions, proof readiness, deal execution and governed AI in one executive operating graph." envelope={workspace.envelope} insights={insights} primaryAction="New Capital Mission" onPrimaryAction={() => setModal("mission")}>
    {workspace.loading ? <LoadingState /> : workspace.error ? <ErrorState message={workspace.error} onRetry={() => void workspace.refresh()} /> : <>
      <section className={styles.situationDeck}>
        <div className={styles.situationCopy}><span><Sparkles size={14} /> Founder command situation</span><h2>{groups.cases?.length ? text(groups.cases[0], ["next_action", "case_title"], "Review live capital priorities") : "Build the first evidence-backed capital route"}</h2><p>The command floor does not invent a recommended route. It elevates the strongest live case, decision, deadline and blocker returned by Supabase.</p><div className={styles.situationActions}><PrimaryButton onClick={() => setModal("brief")}>Generate Founder Brief</PrimaryButton><SecondaryButton onClick={() => setModal("approval")}>Create Approval Request</SecondaryButton></div></div>
        <div className={styles.commandGauge}><div className={styles.gaugeRing} style={{ "--score": `${domainCoverage * 3.6}deg` } as React.CSSProperties}><strong>{workspace.envelope?.dataMode === "supabase-live" ? domainCoverage : "—"}</strong><span>Live domain coverage</span></div><div className={styles.gaugeTruth}><TruthChip kind="approval">{pendingApprovals} approvals</TruthChip><TruthChip kind="proof">{groups.documents?.length || 0} documents</TruthChip><TruthChip kind="time">{criticalBlockers} blockers</TruthChip></div></div>
      </section>

      <section className={styles.metrics}><MetricTile label="Weighted pipeline" value={pipelineValue ? formatDh(pipelineValue) : "No live value"} detail="Sum of live weighted pipeline records only." tone="blue" /><MetricTile label="Active opportunities" value={String(groups.radar?.length || 0)} detail="Capital Radar records detected by the API." tone="green" /><MetricTile label="Founder approvals" value={String(pendingApprovals)} detail="Pending decisions across the approval chamber." tone={pendingApprovals ? "red" : "green"} /><MetricTile label="Critical blockers" value={String(criticalBlockers)} detail="High or critical production blockers." tone={criticalBlockers ? "amber" : "green"} /></section>

      <section className={styles.flowRoom}>
        <SectionHeading eyebrow="Interactive Capital Operating Graph" title="Signal → decision → package → proof → approval → execution" copy="Every node is calculated from the API groups and opens its real operational context. Empty nodes stay visibly empty rather than displaying fabricated counts." />
        <div className={styles.flowGraph}>{flow.map((node, index) => { const [label, group, Icon] = node; const count = groups[group]?.length || 0; return <button key={group} className={styles.flowNode} onClick={() => setSelectedNode(node)}><span className={styles.flowIndex}>{String(index + 1).padStart(2, "0")}</span><Icon size={22} /><strong>{label}</strong><b>{count}</b><small>{count ? "Open live domain" : "Needs live records"}</small>{index < flow.length - 1 ? <ArrowUpRight className={styles.flowArrow} size={15} /> : null}</button>; })}</div>
      </section>

      <div className={styles.lowerGrid}>
        <section className={styles.missionControl}><SectionHeading eyebrow="Mission Control" title="Today’s execution pressure" action={<PrimaryButton onClick={() => setModal("mission")}>Assign mission</PrimaryButton>} />{(groups.tasks || []).length ? <div className={styles.missionList}>{groups.tasks.slice(0, 6).map((row) => <article key={String(row.id)}><div><span>{text(row, ["task_type"], "Mission")}</span><strong>{text(row, ["task_title"], "Capital mission")}</strong><p>{text(row, ["human_action_required", "next_step_after_completion"], "Review the mission details.")}</p></div><div><TruthChip kind={Boolean(row.founder_approval_required) ? "approval" : "safe"}>{text(row, ["status"], "Ready")}</TruthChip><small>{text(row, ["owner"], "Unassigned")}</small></div></article>)}</div> : <div className={styles.noMission}><TimerReset size={24} /><strong>No live missions returned</strong><p>Create the first coordinator mission from this command floor.</p></div>}</section>
        <section className={styles.auditRoom}><SectionHeading eyebrow="Capital Audit Stream" title="Recent controlled actions" /><AuditTimeline items={audits.map((row) => ({ title: text(row, ["action"], "Capital event"), meta: `${text(row, ["actor"], "system")} · ${text(row, ["created_at"], "")}`, note: text(row, ["reason"], "No reason recorded") }))} /></section>
      </div>
    </>}

    <Drawer open={Boolean(selectedNode)} title={selectedNode?.[0] || "Capital node"} eyebrow="Lifecycle Node Intelligence" onClose={() => setSelectedNode(null)} footer={<><SecondaryButton onClick={() => setSelectedNode(null)}>Close</SecondaryButton><PrimaryButton onClick={() => { if (selectedNode) window.location.href = selectedNode[1] === "dossiers" ? "/ac-capital-os/qualification" : selectedNode[1] === "documents" ? "/ac-capital-os/data-room" : selectedNode[1] === "deals" ? "/ac-capital-os/pipeline" : selectedNode[1] === "tasks" ? "/ac-capital-os/coordinator" : selectedNode[1] === "issues" ? "/ac-capital-os/ai-command" : selectedNode[1] === "approvals" ? "/ac-capital-os/approvals" : selectedNode[1] === "funders" ? "/ac-capital-os/funders" : selectedNode[1] === "cases" ? "/ac-capital-os/cases" : selectedNode[1] === "blockers" ? "/ac-capital-os/production" : "/ac-capital-os/radar"; }}>Enter workspace</PrimaryButton></>}>
      {selectedNode ? <><FactGrid facts={[{ label: "Live records", value: groups[selectedNode[1]]?.length || 0 }, { label: "Data mode", value: workspace.envelope?.dataMode || "checking" }, { label: "Source", value: workspace.envelope?.source || "none" }, { label: "Control", value: "Proof / approval / audit" }]} /><div className={styles.drawerRecords}>{(groups[selectedNode[1]] || []).slice(0, 8).map((row, index) => <article key={String(row.id || index)}><strong>{text(row, ["title", "case_title", "name", "task_title", "approval_title", "issue_title", "blocker_title"], `${selectedNode[0]} record`)}</strong><span>{text(row, ["status", "stage", "priority", "severity"], "Open")}</span><p>{text(row, ["next_action", "reason", "summary", "resolution_plan"], "Open the dedicated workspace for complete control.")}</p></article>)}</div></> : null}
    </Drawer>

    <Dialog open={modal === "mission"} title="Assign a Capital Mission" eyebrow="Coordinator Mission Control" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void submitMission()} disabled={action.state.phase === "submitting"}>Create mission</PrimaryButton></>}><div className={styles.formGrid}><Field label="Mission title"><input value={mission.taskTitle} onChange={(event) => setMission({ ...mission, taskTitle: event.target.value })} /></Field><Field label="Mission type"><select value={mission.taskType} onChange={(event) => setMission({ ...mission, taskType: event.target.value })}><option>Capital Mission</option><option>Manual Email</option><option>Call</option><option>Proof Collection</option><option>Follow-up</option></select></Field><Field label="Due at"><input type="datetime-local" value={mission.dueAt} onChange={(event) => setMission({ ...mission, dueAt: event.target.value })} /></Field><Field label="Human action required"><textarea value={mission.humanActionRequired} onChange={(event) => setMission({ ...mission, humanActionRequired: event.target.value })} /></Field><label className={styles.check}><input type="checkbox" checked={mission.proofRequired} onChange={(event) => setMission({ ...mission, proofRequired: event.target.checked })} /> Proof required</label><label className={styles.check}><input type="checkbox" checked={mission.founderApprovalRequired} onChange={(event) => setMission({ ...mission, founderApprovalRequired: event.target.checked })} /> Founder approval required</label></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "approval"} title="Create Founder Approval Request" eyebrow="Governance Firewall" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void submitApproval()} disabled={action.state.phase === "submitting"}>Request approval</PrimaryButton></>}><div className={styles.formGrid}><Field label="Approval title"><input value={approval.title} onChange={(event) => setApproval({ ...approval, title: event.target.value })} /></Field><Field label="Due at"><input type="datetime-local" value={approval.dueAt} onChange={(event) => setApproval({ ...approval, dueAt: event.target.value })} /></Field><Field label="Reason"><textarea value={approval.reason} onChange={(event) => setApproval({ ...approval, reason: event.target.value })} /></Field><Field label="Risk if unapproved"><textarea value={approval.riskIfUnapproved} onChange={(event) => setApproval({ ...approval, riskIfUnapproved: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "brief"} title="Generate Founder Capital Brief" eyebrow="Executive Report Studio" wide onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void generateBrief()} disabled={action.state.phase === "submitting"}>Generate draft</PrimaryButton></>}><div className={styles.briefPreview}><div><span>Audience</span><strong>{brief.audience}</strong></div><div><span>Report type</span><strong>{brief.reportType}</strong></div><div><span>Purpose</span><strong>{brief.purpose}</strong></div><div><span>Truth boundary</span><strong>Draft only · approval required before external release</strong></div></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>
  </AcCapitalShell>;
}
