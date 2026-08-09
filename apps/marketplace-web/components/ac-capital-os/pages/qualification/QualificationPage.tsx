"use client";

import { CircleDotDashed, CheckCircle2, FileWarning, Gauge, GitCompareArrows, Scale, ShieldAlert, Stamp, Target, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { EmptyState, ErrorState, LoadingState } from "../../core/AsyncState";
import { ActionFeedback, Field } from "../../core/FormParts";
import { MetricTile } from "../../core/MetricTile";
import { Dialog, Drawer } from "../../core/Overlay";
import { StatusBadge } from "../../core/StatusBadge";
import { AuditTimeline, FactGrid, PrimaryButton, SecondaryButton, SectionHeading, TruthChip } from "../../core/WorkspaceParts";
import { postEnvelope } from "../../core/api";
import { number, rowsFrom, text } from "../../core/data";
import type { CapitalActor, Row } from "../../core/types";
import { canApprove } from "../../core/role";
import { useAction } from "../../core/useAction";
import { useActionQuery } from "../../core/useActionQuery";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./qualification.module.css";

type Modal = "create" | "decision" | "missing" | "next" | "memo" | null;
const dimensions = ["Business model", "B2B", "SaaS", "Women founder", "Child quality", "Financial credibility", "Documentation", "Deadline", "Legal sensitivity", "Founder time"];

export function QualificationPage({ actor }: { actor: CapitalActor }) {
  const workspace = useWorkspace("/api/ac-capital-os/qualification-engine");
  const action = useAction();
  const [selected, setSelected] = useState<Row | null>(null);
  const [compareId, setCompareId] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [create, setCreate] = useState({ title: "", opportunityType: "Bank", sourceConfidence: 0, totalScore: 0, decisionLabel: "Needs Proof", priority: "medium", documentationReadiness: 0, founderReviewRequired: false, executiveSummary: "", eligibilitySummary: "", angelcareMatchSummary: "", nextAction: "" });
  const [decision, setDecision] = useState({ decisionLabel: "Pursue", reason: "", founderReviewRequired: false, nextAction: "" });
  const [missing, setMissing] = useState({ documentName: "", category: "Evidence", priority: "high", requiredForSubmission: true, owner: actor.name, dueDate: "" });
  const [next, setNext] = useState({ actionLabel: "", why: "", owner: actor.name, priority: "medium", deadline: "", expectedOutput: "", relatedWorkspace: "data-room" });
  const openAction = useCallback((value: Modal) => setModal(value), []);
  useActionQuery({ review: "decision", create: "create" }, openAction);

  const dossiers = rowsFrom(workspace.envelope, "dossiers");
  const criteria = rowsFrom(workspace.envelope, "criteria");
  const scores = rowsFrom(workspace.envelope, "scores");
  const decisions = rowsFrom(workspace.envelope, "decisions");
  const risks = rowsFrom(workspace.envelope, "risks");
  const missingDocuments = rowsFrom(workspace.envelope, "missingDocuments");
  const nextActions = rowsFrom(workspace.envelope, "nextActions");
  const selectedScores = selected ? scores.filter((row) => String(row.dossier_id) === String(selected.id)) : [];
  const selectedRisks = selected ? risks.filter((row) => String(row.dossier_id) === String(selected.id)) : [];
  const selectedDocs = selected ? missingDocuments.filter((row) => String(row.dossier_id) === String(selected.id)) : [];
  const selectedActions = selected ? nextActions.filter((row) => String(row.dossier_id) === String(selected.id)) : [];
  const comparison = dossiers.find((row) => String(row.id) === compareId) || null;
  const averageScore = dossiers.length ? Math.round(dossiers.reduce((sum, row) => sum + number(row, ["total_score"], 0), 0) / dossiers.length) : 0;
  const needsProof = dossiers.filter((row) => text(row, ["decision_label"], "").toLowerCase().includes("proof")).length;
  const founderReview = dossiers.filter((row) => Boolean(row.founder_review_required)).length;

  async function createDossier() {
    if (!create.title.trim()) return action.validate("Dossier title is required.");
    await action.execute(async () => postEnvelope("/api/ac-capital-os/qualification-engine", { action: "create-dossier", ...create }), "Qualification dossier created.");
    await workspace.refresh();
  }
  async function saveDecision() {
    if (!selected) return;
    if (decision.founderReviewRequired && decision.decisionLabel === "Pursue" && !canApprove(actor)) return action.disabled("Founder approval is required for this pursue decision.");
    await action.execute(async () => postEnvelope("/api/ac-capital-os/qualification-engine", { action: "decision", dossierId: selected.id, ...decision }), "Committee decision persisted.");
    await workspace.refresh();
  }
  async function addMissing() {
    if (!selected || !missing.documentName.trim()) return action.validate("Select a dossier and enter the missing document.");
    await action.execute(async () => postEnvelope("/api/ac-capital-os/qualification-engine", { action: "missing-document", dossierId: selected.id, ...missing }), "Missing evidence requirement created.");
    await workspace.refresh();
  }
  async function addNext() {
    if (!selected || !next.actionLabel.trim()) return action.validate("Select a dossier and enter the next action.");
    await action.execute(async () => postEnvelope("/api/ac-capital-os/qualification-engine", { action: "next-action", dossierId: selected.id, ...next }), "Next action created.");
    await workspace.refresh();
  }

  const insights = [
    { label: "Committee load", value: `${dossiers.length} dossiers in the API` },
    { label: "Proof burden", value: `${needsProof} dossiers explicitly need proof` },
    { label: "Founder time", value: `${founderReview} dossiers require founder review` },
    { label: "Decision truth", value: "Scores are shown only when criteria records support them" },
  ];

  return <AcCapitalShell actor={actor} workspaceKey="qualification-committee" title="Investment Committee Qualification Room" subtitle="A decision-grade environment that explains fit, evidence, founder time, legal sensitivity and pursuit value before AngelCare commits resources." envelope={workspace.envelope} insights={insights} primaryAction="Create Dossier" onPrimaryAction={() => setModal("create")}>
    {workspace.loading ? <LoadingState label="Loading qualification dossiers and score evidence…" /> : workspace.error ? <ErrorState message={workspace.error} onRetry={() => void workspace.refresh()} /> : <>
      <section className={styles.committeeDeck}><div className={styles.committeeCopy}><span><Scale size={15} /> Investment Committee</span><h2>Every decision must explain its evidence, burden and strategic value.</h2><p>Decorative scoring is forbidden. The room exposes criteria, weighted scores, missing documents, risks, decision history and founder-review requirements.</p><div className={styles.committeeActions}><PrimaryButton onClick={() => setModal("create")}>Create dossier</PrimaryButton><SecondaryButton onClick={() => setModal("memo")}>Qualification memo</SecondaryButton></div></div><div className={styles.scoreOrb}><div className={styles.scoreRing} style={{ "--score": `${averageScore * 3.6}deg` } as React.CSSProperties}><strong>{dossiers.length ? averageScore : "—"}</strong><span>Average live score</span></div><TruthChip kind="approval">{founderReview} founder reviews</TruthChip></div></section>
      <section className={styles.metrics}><MetricTile label="Dossiers" value={String(dossiers.length)} detail="Qualification dossiers returned by API." tone="blue" /><MetricTile label="Average score" value={dossiers.length ? `${averageScore}%` : "No live score"} detail="Calculated from dossier total_score." tone={averageScore >= 70 ? "green" : "amber"} /><MetricTile label="Needs proof" value={String(needsProof)} detail="Explicit committee decision state." tone={needsProof ? "amber" : "green"} /><MetricTile label="Founder review" value={String(founderReview)} detail="Sensitive decisions requiring founder control." tone={founderReview ? "red" : "green"} /></section>
      <section className={styles.matrixRoom}><SectionHeading eyebrow="Decision Matrix" title="Dossier queue and committee evidence" action={<select value={compareId} onChange={(event) => setCompareId(event.target.value)}><option value="">Compare dossier…</option>{dossiers.map((row) => <option key={String(row.id)} value={String(row.id)}>{text(row, ["title"], "Dossier")}</option>)}</select>} />
        {dossiers.length ? <div className={styles.dossierGrid}>{dossiers.map((row) => <button key={String(row.id)} className={`${styles.dossierCard} ${selected?.id === row.id ? styles.selectedCard : ""}`} onClick={() => setSelected(row)}><div className={styles.dossierHeader}><StatusBadge value={text(row, ["decision_label"], "Under Review")} /><span>{number(row, ["total_score"], 0)}%</span></div><strong>{text(row, ["title"], "Qualification dossier")}</strong><p>{text(row, ["executive_summary", "angelcare_match_summary"], "No executive summary returned.")}</p><div className={styles.dossierMeta}><span><Target size={13} /> {text(row, ["opportunity_type"], "Unknown")}</span><span><FileWarning size={13} /> {number(row, ["documentation_readiness"], 0)}% proof</span><span><ShieldAlert size={13} /> {Boolean(row.founder_review_required) ? "Founder review" : "Committee review"}</span></div></button>)}</div> : <EmptyState title="No qualification dossiers yet" copy="Create a dossier from a validated Radar opportunity. No committee score is fabricated for an empty database." action="Create dossier" onAction={() => setModal("create")} />}
      </section>

      {selected ? <section className={styles.decisionRoom}><div className={styles.profile}><SectionHeading eyebrow="Selected Dossier" title={text(selected, ["title"], "Dossier")} copy={text(selected, ["executive_summary"], "No executive summary recorded.")} /><div className={styles.profileGrid}>{dimensions.map((dimension, index) => { const score = selectedScores[index] ? number(selectedScores[index], ["score", "weighted_score"], 0) : index === 0 ? number(selected, ["total_score"], 0) : 0; return <article key={dimension}><div className={styles.dimensionBar}><i style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div><strong>{dimension}</strong><span>{selectedScores[index] ? `${score}%` : "No criterion evidence"}</span></article>; })}</div></div><aside className={styles.decisionChamber}><Stamp size={27} /><span>Committee Decision Stamp</span><strong>{text(selected, ["decision_label"], "Under Review")}</strong><p>{text(selected, ["next_action"], "Review evidence and record the next action.")}</p><div><PrimaryButton onClick={() => setModal("decision")}>Record decision</PrimaryButton><SecondaryButton onClick={() => setModal("missing")}>Request evidence</SecondaryButton></div></aside></section> : null}

      {comparison && selected ? <section className={styles.compareRoom}><SectionHeading eyebrow="Dossier Comparison" title="Decision trade-off view" /><div className={styles.compareGrid}><article><span>Selected</span><strong>{text(selected, ["title"])}</strong><b>{number(selected, ["total_score"], 0)}%</b><p>{text(selected, ["decision_label"])}</p></article><GitCompareArrows size={34} /><article><span>Comparison</span><strong>{text(comparison, ["title"])}</strong><b>{number(comparison, ["total_score"], 0)}%</b><p>{text(comparison, ["decision_label"])}</p></article></div></section> : null}
    </>}

    <Drawer open={Boolean(selected)} title={selected ? text(selected, ["title"], "Qualification Dossier") : "Qualification Dossier"} eyebrow="Committee Dossier" onClose={() => setSelected(null)} footer={<><SecondaryButton onClick={() => setModal("next")}>Create next action</SecondaryButton><SecondaryButton onClick={() => setModal("missing")}>Missing evidence</SecondaryButton><PrimaryButton onClick={() => setModal("decision")}>Decision stamp</PrimaryButton></>}>
      {selected ? <><FactGrid facts={[{ label: "Decision", value: text(selected, ["decision_label"]) }, { label: "Total score", value: `${number(selected, ["total_score"], 0)}%` }, { label: "Source confidence", value: `${number(selected, ["source_confidence"], 0)}%` }, { label: "Documentation", value: `${number(selected, ["documentation_readiness"], 0)}%` }, { label: "Priority", value: text(selected, ["priority"]) }, { label: "Owner", value: text(selected, ["recommended_owner"]) }]} /><section className={styles.drawerBlock}><h3>Score evidence</h3>{selectedScores.length ? selectedScores.map((row) => <article key={String(row.id)}><strong>{text(row, ["criterion_label"], "Criterion")}</strong><span>{number(row, ["score"], 0)} / weight {number(row, ["weight"], 0)}</span><p>{text(row, ["explanation", "missing_evidence"], "No explanation recorded")}</p></article>) : <p>No criterion score rows returned.</p>}</section><section className={styles.drawerBlock}><h3>Risks</h3>{selectedRisks.length ? selectedRisks.map((row) => <article key={String(row.id)}><strong>{text(row, ["risk_type"])}</strong><span>{text(row, ["severity"])}</span><p>{text(row, ["description"])}</p></article>) : <p>No risk rows returned.</p>}</section><section className={styles.drawerBlock}><h3>Missing evidence</h3>{selectedDocs.length ? selectedDocs.map((row) => <article key={String(row.id)}><strong>{text(row, ["document_name"])}</strong><span>{text(row, ["status"])}</span><p>{text(row, ["owner", "due_date"])}</p></article>) : <p>No missing evidence rows returned.</p>}</section><AuditTimeline items={decisions.filter((row) => String(row.dossier_id) === String(selected.id)).map((row) => ({ title: text(row, ["decision_label"]), meta: text(row, ["decided_by"]), note: text(row, ["decision_reason"]) }))} /></> : null}
    </Drawer>

    <Dialog open={modal === "create"} title="Create Qualification Dossier" eyebrow="Committee Intake" wide onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void createDossier()} disabled={action.state.phase === "submitting"}>Create dossier</PrimaryButton></>}><div className={styles.formGrid}><Field label="Dossier title"><input value={create.title} onChange={(event) => setCreate({ ...create, title: event.target.value })} /></Field><Field label="Opportunity type"><select value={create.opportunityType} onChange={(event) => setCreate({ ...create, opportunityType: event.target.value })}><option>Bank</option><option>Grant</option><option>VC</option><option>Strategic Partner</option><option>Impact</option><option>SaaS Investor</option></select></Field><Field label="Source confidence"><input type="number" min="0" max="100" value={create.sourceConfidence} onChange={(event) => setCreate({ ...create, sourceConfidence: Number(event.target.value) })} /></Field><Field label="Initial total score"><input type="number" min="0" max="100" value={create.totalScore} onChange={(event) => setCreate({ ...create, totalScore: Number(event.target.value) })} /></Field><Field label="Documentation readiness"><input type="number" min="0" max="100" value={create.documentationReadiness} onChange={(event) => setCreate({ ...create, documentationReadiness: Number(event.target.value) })} /></Field><Field label="Initial decision"><select value={create.decisionLabel} onChange={(event) => setCreate({ ...create, decisionLabel: event.target.value })}><option>Needs Proof</option><option>Monitor</option><option>Needs Founder Review</option><option>Pursue</option><option>Reject</option></select></Field><Field label="Executive summary"><textarea value={create.executiveSummary} onChange={(event) => setCreate({ ...create, executiveSummary: event.target.value })} /></Field><Field label="Eligibility summary"><textarea value={create.eligibilitySummary} onChange={(event) => setCreate({ ...create, eligibilitySummary: event.target.value })} /></Field><Field label="AngelCare match"><textarea value={create.angelcareMatchSummary} onChange={(event) => setCreate({ ...create, angelcareMatchSummary: event.target.value })} /></Field><Field label="Next action"><textarea value={create.nextAction} onChange={(event) => setCreate({ ...create, nextAction: event.target.value })} /></Field><label className={styles.check}><input type="checkbox" checked={create.founderReviewRequired} onChange={(event) => setCreate({ ...create, founderReviewRequired: event.target.checked })} /> Founder review required</label></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "decision"} title="Committee Decision Stamp" eyebrow="Pursue / Monitor / Reject" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void saveDecision()} disabled={!selected || action.state.phase === "submitting"}>Persist decision</PrimaryButton></>}><div className={styles.decisionOptions}>{["Pursue", "Monitor", "Reject", "Needs Proof", "Needs Founder Review"].map((item) => <button key={item} className={decision.decisionLabel === item ? styles.decisionSelected : ""} onClick={() => setDecision({ ...decision, decisionLabel: item, founderReviewRequired: item === "Needs Founder Review" ? true : decision.founderReviewRequired })}>{item === "Pursue" ? <CheckCircle2 /> : item === "Reject" ? <XCircle /> : item === "Needs Proof" ? <FileWarning /> : <CircleDotDashed />}<strong>{item}</strong></button>)}</div><Field label="Decision reason"><textarea value={decision.reason} onChange={(event) => setDecision({ ...decision, reason: event.target.value })} /></Field><Field label="Next action"><textarea value={decision.nextAction} onChange={(event) => setDecision({ ...decision, nextAction: event.target.value })} /></Field><label className={styles.check}><input type="checkbox" checked={decision.founderReviewRequired} onChange={(event) => setDecision({ ...decision, founderReviewRequired: event.target.checked })} /> Founder approval required</label><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "missing"} title="Request Missing Evidence" eyebrow="Proof Burden Control" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void addMissing()} disabled={!selected || action.state.phase === "submitting"}>Create evidence requirement</PrimaryButton></>}><div className={styles.formGrid}><Field label="Document"><input value={missing.documentName} onChange={(event) => setMissing({ ...missing, documentName: event.target.value })} /></Field><Field label="Category"><input value={missing.category} onChange={(event) => setMissing({ ...missing, category: event.target.value })} /></Field><Field label="Priority"><select value={missing.priority} onChange={(event) => setMissing({ ...missing, priority: event.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></Field><Field label="Owner"><input value={missing.owner} onChange={(event) => setMissing({ ...missing, owner: event.target.value })} /></Field><Field label="Due date"><input type="date" value={missing.dueDate} onChange={(event) => setMissing({ ...missing, dueDate: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "next"} title="Create Committee Next Action" eyebrow="Workflow Transition" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void addNext()} disabled={!selected || action.state.phase === "submitting"}>Create next action</PrimaryButton></>}><div className={styles.formGrid}><Field label="Action"><input value={next.actionLabel} onChange={(event) => setNext({ ...next, actionLabel: event.target.value })} /></Field><Field label="Owner"><input value={next.owner} onChange={(event) => setNext({ ...next, owner: event.target.value })} /></Field><Field label="Priority"><select value={next.priority} onChange={(event) => setNext({ ...next, priority: event.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></Field><Field label="Deadline"><input type="date" value={next.deadline} onChange={(event) => setNext({ ...next, deadline: event.target.value })} /></Field><Field label="Why"><textarea value={next.why} onChange={(event) => setNext({ ...next, why: event.target.value })} /></Field><Field label="Expected output"><textarea value={next.expectedOutput} onChange={(event) => setNext({ ...next, expectedOutput: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "memo"} title="Qualification Memorandum Preview" eyebrow="Committee Reporting" wide onClose={() => setModal(null)} footer={<SecondaryButton onClick={() => setModal(null)}>Close</SecondaryButton>}><div className={styles.memo}><span>Selected dossier</span><h3>{selected ? text(selected, ["title"]) : "Select a dossier to preview a memorandum"}</h3><p><b>Decision:</b> {selected ? text(selected, ["decision_label"]) : "—"}</p><p><b>Score:</b> {selected ? `${number(selected, ["total_score"], 0)}%` : "—"}</p><p><b>Evidence gaps:</b> {selectedDocs.length}</p><p><b>Founder review:</b> {selected?.founder_review_required ? "Required" : "Not explicitly required"}</p><p>This is a controlled preview, not an external report export.</p></div></Dialog>
  </AcCapitalShell>;
}
