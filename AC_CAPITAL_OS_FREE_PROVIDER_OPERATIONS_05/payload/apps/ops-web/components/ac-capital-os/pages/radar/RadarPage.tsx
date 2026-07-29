"use client";

import { AlertOctagon, Crosshair, Globe2, Radar, RadioTower, SearchCheck, Send, Sparkles, Target, Waves } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { EmptyState, ErrorState, LoadingState } from "../../core/AsyncState";
import { ActionFeedback, Field } from "../../core/FormParts";
import { MetricTile } from "../../core/MetricTile";
import { Dialog, Drawer } from "../../core/Overlay";
import { StatusBadge } from "../../core/StatusBadge";
import { FactGrid, PrimaryButton, SecondaryButton, SectionHeading, TruthChip } from "../../core/WorkspaceParts";
import { postEnvelope } from "../../core/api";
import { formatDh, number, rowsFrom, shortDate, text } from "../../core/data";
import type { CapitalActor, Row } from "../../core/types";
import { useAction } from "../../core/useAction";
import { useActionQuery } from "../../core/useActionQuery";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./radar.module.css";

type Modal = "create" | "validate" | "research" | "handoff" | "disposition" | null;

export function RadarPage({ actor }: { actor: CapitalActor }) {
  const workspace = useWorkspace("/api/ac-capital-os/capital-radar");
  const action = useAction();
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [region, setRegion] = useState("All");
  const [type, setType] = useState("All");
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState({ title: "", opportunityType: "Bank", country: "Morocco", region: "Rabat", sourceName: "", sourceUrl: "", sourceConfidence: 50, deadline: "", amountMin: "", amountMax: "", eligibilityPreview: "", angelcareRelevancePreview: "", whyCaptured: "" });
  const [validation, setValidation] = useState({ sourceConfidence: 75, sourceName: "", sourceUrl: "", reviewNote: "", valid: true });
  const [research, setResearch] = useState({ query: "AngelCare childcare, education, women-founder, SaaS and impact funding opportunities" });
  const [disposition, setDisposition] = useState({ action: "monitor", reason: "" });

  const openAction = useCallback((value: Modal) => setModal(value), []);
  useActionQuery({ create: "create", validate: "validate", research: "research" }, openAction);

  const opportunities = rowsFrom(workspace.envelope, "opportunities");
  const sources = rowsFrom(workspace.envelope, "sources");
  const researchRuns = rowsFrom(workspace.envelope, "researchRuns");
  const handoffs = rowsFrom(workspace.envelope, "handoffQueue");
  const rejections = rowsFrom(workspace.envelope, "rejections");
  const regions = useMemo(() => ["All", ...Array.from(new Set(opportunities.map((row) => text(row, ["region", "country"], "Unknown"))))], [opportunities]);
  const types = useMemo(() => ["All", ...Array.from(new Set(opportunities.map((row) => text(row, ["opportunity_type"], "Unknown"))))], [opportunities]);
  const filtered = opportunities.filter((row) => {
    const regionMatch = region === "All" || [text(row, ["region"], ""), text(row, ["country"], "")].includes(region);
    const typeMatch = type === "All" || text(row, ["opportunity_type"], "") === type;
    const haystack = `${text(row, ["title"], "")} ${text(row, ["source_name"], "")} ${text(row, ["country"], "")}`.toLowerCase();
    return regionMatch && typeMatch && haystack.includes(query.toLowerCase());
  });
  const hot = opportunities.filter((row) => ["hot", "critical"].includes(text(row, ["deadline_heat"], "").toLowerCase())).length;
  const weak = opportunities.filter((row) => number(row, ["source_confidence"], 0) < 60).length;
  const ready = opportunities.filter((row) => text(row, ["handoff_status"], "") === "ready-for-qualification").length;
  const avgConfidence = opportunities.length ? Math.round(opportunities.reduce((sum, row) => sum + number(row, ["source_confidence"], 0), 0) / opportunities.length) : 0;

  async function createOpportunity() {
    if (!create.title.trim() || !create.opportunityType.trim()) return action.validate("Opportunity title and type are required.");
    await action.execute(async () => postEnvelope("/api/ac-capital-os/capital-radar", { action: "create-opportunity", ...create, amountMin: create.amountMin || null, amountMax: create.amountMax || null }), "Opportunity persisted in Capital Radar.");
    await workspace.refresh();
  }
  async function validateSource() {
    if (!selected) return;
    await action.execute(async () => postEnvelope("/api/ac-capital-os/capital-radar", { action: "validate-source", id: selected.id, ...validation }), validation.valid ? "Source validated and opportunity prepared for qualification." : "Source flagged for human review.");
    await workspace.refresh();
  }
  async function runResearch() {
    if (!research.query.trim()) return action.validate("Research query is required.");
    await action.execute(async () => postEnvelope("/api/ac-capital-os/capital-radar/research/run", research), "Tavily public-web research and OpenRouter free analysis completed and persisted for human review.", { title: "External public capital research", workspaceKey: "opportunity-radar", stage: "free-provider-research" });
    await workspace.refresh();
  }
  async function handoff() {
    if (!selected) return;
    await action.execute(async () => postEnvelope("/api/ac-capital-os/capital-radar", { action: "handoff", id: selected.id, instruction: "Review source, eligibility, AngelCare fit, proof burden and founder-time requirement." }), "Opportunity handed to the Qualification Committee.");
    await workspace.refresh();
  }
  async function saveDisposition() {
    if (!selected) return;
    await action.execute(async () => postEnvelope("/api/ac-capital-os/capital-radar", { id: selected.id, ...disposition }), disposition.action === "monitor" ? "Opportunity moved to the watchlist." : "Opportunity rejected with reason.");
    await workspace.refresh();
  }

  const insights = [
    { label: "Heat concentration", value: hot ? `${hot} opportunity deadlines are hot or critical` : "No hot deadlines returned" },
    { label: "Source quality", value: weak ? `${weak} signals require stronger source evidence` : "No weak-source signals returned" },
    { label: "Qualification handoff", value: `${ready} opportunities are ready for committee review` },
    { label: "Research policy", value: "Tavily search · OpenRouter free analysis · human review" },
    { label: "Rejected signals", value: `${rejections.length} candidates rejected with recorded reasons` },
  ];

  return <AcCapitalShell actor={actor} workspaceKey="opportunity-radar" title="Opportunity Intelligence Radar" subtitle="A live, evidence-first capital signal room for Moroccan banks, grants, VC, angels, strategic partners, women-founder programs, impact funding and international routes." envelope={workspace.envelope} insights={insights} primaryAction="Create Opportunity" onPrimaryAction={() => setModal("create")}>
    {workspace.loading ? <LoadingState label="Scanning Capital Radar records…" /> : workspace.error ? <ErrorState message={workspace.error} onRetry={() => void workspace.refresh()} /> : <>
      <section className={styles.radarDeck}>
        <div className={styles.radarScope}><div className={styles.radarGrid}><div className={styles.sweep} /><div className={styles.axis} /><span className={styles.center}><Radar size={28} /></span>{opportunities.slice(0, 10).map((row, index) => <button key={String(row.id || index)} title={text(row, ["title"], "Opportunity")} style={{ left: `${20 + (index * 17) % 65}%`, top: `${16 + (index * 23) % 66}%` }} onClick={() => setSelected(row)}><i /></button>)}</div><div className={styles.radarLegend}><span><i className={styles.signalGood} /> Validated signal</span><span><i className={styles.signalWarn} /> Human review</span><span><i className={styles.signalCritical} /> Deadline pressure</span></div></div>
        <div className={styles.radarCommand}><span><RadioTower size={15} /> Controlled opportunity scan</span><h2>See the capital market as a field of evidence—not a list of promises.</h2><p>Each signal carries source confidence, deadline heat, region, capital type, eligibility clues and a controlled handoff state.</p><div className={styles.radarActions}><PrimaryButton onClick={() => setModal("research")}>Run Live Grounded Research</PrimaryButton><SecondaryButton onClick={() => setModal("create")}>Manual Opportunity</SecondaryButton></div><div className={styles.coverage}><div><Globe2 size={18} /><strong>Morocco</strong><span>Banks · public finance · impact</span></div><div><Waves size={18} /><strong>Africa / MENA</strong><span>VC · grants · strategic partners</span></div><div><Sparkles size={18} /><strong>International</strong><span>Education · child quality · SaaS</span></div></div></div>
      </section>

      <section className={styles.metrics}><MetricTile label="Live signals" value={String(opportunities.length)} detail="Records returned by Capital Radar API." tone="blue" /><MetricTile label="Average source confidence" value={opportunities.length ? `${avgConfidence}%` : "No live score"} detail="Calculated from live source confidence values." tone={avgConfidence >= 70 ? "green" : "amber"} /><MetricTile label="Deadline heat" value={String(hot)} detail="Hot or critical opportunity deadlines." tone={hot ? "red" : "green"} /><MetricTile label="Qualification ready" value={String(ready)} detail="Signals explicitly marked ready for handoff." tone="violet" /></section>

      <section className={styles.heatRoom}><SectionHeading eyebrow="Opportunity Heat Board" title="High fit, deadline pressure and source quality" copy="Filter and open live opportunity objects. A signal without evidence stays visibly unvalidated." action={<div className={styles.filterBar}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search signals…" /><select value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item}>{item}</option>)}</select><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select></div>} />
        {filtered.length ? <div className={styles.signalGrid}>{filtered.map((row) => <button key={String(row.id)} className={styles.signalCard} onClick={() => setSelected(row)}><div className={styles.signalTop}><StatusBadge value={text(row, ["status"], "detected")} /><span className={styles.confidence}>{number(row, ["source_confidence"], 0)}%</span></div><span className={styles.signalType}>{text(row, ["opportunity_type"], "Capital opportunity")}</span><strong>{text(row, ["title"], "Untitled opportunity")}</strong><p>{text(row, ["angelcare_relevance_preview", "eligibility_preview"], "No relevance summary recorded.")}</p><div className={styles.signalMeta}><span><Globe2 size={13} /> {text(row, ["country", "region"], "Unknown")}</span><span><Target size={13} /> {text(row, ["deadline_heat"], "unknown")}</span><span><Crosshair size={13} /> {row.amount_max ? formatDh(row.amount_max) : text(row, ["amount_range_label"], "Amount unknown")}</span></div></button>)}</div> : <EmptyState title="No opportunity matches this view" copy="Create the first opportunity, change filters, or run a Tavily + OpenRouter public intelligence scan. No opportunity is fabricated to fill the interface." action="Create opportunity" onAction={() => setModal("create")} />}
      </section>

      <div className={styles.lowerGrid}><section className={styles.sourceRoom}><SectionHeading eyebrow="Source Evidence Control" title="Validation queue" />{sources.length ? sources.slice(0, 6).map((row) => <article key={String(row.id)}><SearchCheck size={18} /><div><strong>{text(row, ["source_name"], "Source")}</strong><span>{text(row, ["verification_status"], "needs_review")} · {number(row, ["source_confidence"], 0)}%</span></div></article>) : <p>No live source records returned.</p>}</section><section className={styles.runRoom}><SectionHeading eyebrow="Research Run History" title="Governed scans" />{researchRuns.length ? researchRuns.slice(0, 6).map((row) => <article key={String(row.id)}><div><strong>{text(row, ["run_label"], "Research run")}</strong><span>{text(row, ["adapter_mode"], "unknown")} · {text(row, ["status"], "completed")}</span></div><b>{number(row, ["opportunities_detected"], 0)}</b></article>) : <p>No research run history returned.</p>}</section></div>
    </>}

    <Drawer open={Boolean(selected)} title={selected ? text(selected, ["title"], "Opportunity") : "Opportunity"} eyebrow="Opportunity Intelligence Dossier" onClose={() => setSelected(null)} footer={<><SecondaryButton onClick={() => setModal("disposition")}>Monitor / Reject</SecondaryButton><SecondaryButton onClick={() => setModal("validate")}>Validate Source</SecondaryButton><PrimaryButton onClick={() => setModal("handoff")}>Send to Qualification</PrimaryButton></>}>
      {selected ? <><div className={styles.drawerHero}><StatusBadge value={text(selected, ["status"], "detected")} /><strong>{number(selected, ["source_confidence"], 0)}% source confidence</strong><p>{text(selected, ["why_captured", "angelcare_relevance_preview"], "No capture rationale recorded.")}</p></div><FactGrid facts={[{ label: "Type", value: text(selected, ["opportunity_type"]) }, { label: "Region", value: text(selected, ["region", "country"]) }, { label: "Deadline", value: shortDate(selected.deadline) }, { label: "Deadline heat", value: text(selected, ["deadline_heat"]) }, { label: "Amount", value: selected.amount_max ? formatDh(selected.amount_max) : text(selected, ["amount_range_label"]) }, { label: "Handoff", value: text(selected, ["handoff_status"]) }]} /><section className={styles.drawerSection}><h3>Source evidence</h3><p>{text(selected, ["source_name"], "No source name")}</p><p>{text(selected, ["source_url"], "No source URL recorded")}</p></section><section className={styles.drawerSection}><h3>Eligibility / AngelCare fit</h3><p>{text(selected, ["eligibility_preview"], "No eligibility preview")}</p><p>{text(selected, ["angelcare_relevance_preview"], "No fit preview")}</p></section><div className={styles.truthRow}><TruthChip kind="proof">Source validation required</TruthChip><TruthChip kind="approval">Sensitive claims need review</TruthChip><TruthChip kind="safe">No automatic submission</TruthChip></div></> : null}
    </Drawer>

    <Dialog open={modal === "create"} title="Create a Capital Opportunity" eyebrow="Manual Signal Capture" wide onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void createOpportunity()} disabled={action.state.phase === "submitting"}>Persist opportunity</PrimaryButton></>}><div className={styles.formGrid}><Field label="Opportunity title"><input value={create.title} onChange={(event) => setCreate({ ...create, title: event.target.value })} /></Field><Field label="Capital type"><select value={create.opportunityType} onChange={(event) => setCreate({ ...create, opportunityType: event.target.value })}><option>Bank</option><option>Grant</option><option>VC</option><option>Angel</option><option>Strategic Partner</option><option>Public Funding</option><option>Impact Finance</option><option>SaaS Investor</option></select></Field><Field label="Country"><input value={create.country} onChange={(event) => setCreate({ ...create, country: event.target.value })} /></Field><Field label="Region"><input value={create.region} onChange={(event) => setCreate({ ...create, region: event.target.value })} /></Field><Field label="Source name"><input value={create.sourceName} onChange={(event) => setCreate({ ...create, sourceName: event.target.value })} /></Field><Field label="Source URL"><input value={create.sourceUrl} onChange={(event) => setCreate({ ...create, sourceUrl: event.target.value })} /></Field><Field label="Source confidence"><input type="number" min="0" max="100" value={create.sourceConfidence} onChange={(event) => setCreate({ ...create, sourceConfidence: Number(event.target.value) })} /></Field><Field label="Deadline"><input type="date" value={create.deadline} onChange={(event) => setCreate({ ...create, deadline: event.target.value })} /></Field><Field label="Minimum amount"><input type="number" value={create.amountMin} onChange={(event) => setCreate({ ...create, amountMin: event.target.value })} /></Field><Field label="Maximum amount"><input type="number" value={create.amountMax} onChange={(event) => setCreate({ ...create, amountMax: event.target.value })} /></Field><Field label="Eligibility preview"><textarea value={create.eligibilityPreview} onChange={(event) => setCreate({ ...create, eligibilityPreview: event.target.value })} /></Field><Field label="AngelCare relevance"><textarea value={create.angelcareRelevancePreview} onChange={(event) => setCreate({ ...create, angelcareRelevancePreview: event.target.value })} /></Field><Field label="Why captured"><textarea value={create.whyCaptured} onChange={(event) => setCreate({ ...create, whyCaptured: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "validate"} title="Validate Opportunity Source" eyebrow="Source Evidence Gate" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void validateSource()} disabled={!selected || action.state.phase === "submitting"}>Save source decision</PrimaryButton></>}><div className={styles.formGrid}><Field label="Source name"><input value={validation.sourceName || (selected ? text(selected, ["source_name"], "") : "")} onChange={(event) => setValidation({ ...validation, sourceName: event.target.value })} /></Field><Field label="Source URL"><input value={validation.sourceUrl || (selected ? text(selected, ["source_url"], "") : "")} onChange={(event) => setValidation({ ...validation, sourceUrl: event.target.value })} /></Field><Field label="Confidence"><input type="number" min="0" max="100" value={validation.sourceConfidence} onChange={(event) => setValidation({ ...validation, sourceConfidence: Number(event.target.value) })} /></Field><Field label="Decision"><select value={validation.valid ? "valid" : "review"} onChange={(event) => setValidation({ ...validation, valid: event.target.value === "valid" })}><option value="valid">Validated</option><option value="review">Needs human review</option></select></Field><Field label="Review note"><textarea value={validation.reviewNote} onChange={(event) => setValidation({ ...validation, reviewNote: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "research"} title="Run External Public Capital Research" eyebrow="Tavily Search + OpenRouter Analysis" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void runResearch()} disabled={action.state.phase === "submitting"}>Run live research</PrimaryButton></>}><div className={styles.researchGuard}><AlertOctagon size={22} /><div><strong>Real provider execution required</strong><p>Tavily must return public source evidence and OpenRouter must return structured analysis. Source records, opportunity candidates, rejections and any enabled internal draft actions are persisted. External communication and submission remain locked.</p></div></div><Field label="Research query"><textarea value={research.query} onChange={(event) => setResearch({ query: event.target.value })} /></Field><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "handoff"} title="Send Opportunity to Qualification" eyebrow="Committee Handoff" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void handoff()} disabled={!selected || action.state.phase === "submitting"}><Send size={15} /> Create handoff</PrimaryButton></>}><div className={styles.handoffPreview}><SearchCheck size={24} /><strong>{selected ? text(selected, ["title"], "Opportunity") : "Select an opportunity"}</strong><p>The Qualification Committee will receive source, eligibility, AngelCare fit, proof burden and founder-time context.</p></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>

    <Dialog open={modal === "disposition"} title="Monitor or Reject Opportunity" eyebrow="Opportunity Disposition" onClose={() => { setModal(null); action.reset(); }} footer={<><SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={() => void saveDisposition()} disabled={!selected || action.state.phase === "submitting"}>Save disposition</PrimaryButton></>}><div className={styles.formGrid}><Field label="Disposition"><select value={disposition.action} onChange={(event) => setDisposition({ ...disposition, action: event.target.value })}><option value="monitor">Monitor / Watchlist</option><option value="reject">Reject</option></select></Field><Field label="Reason"><textarea value={disposition.reason} onChange={(event) => setDisposition({ ...disposition, reason: event.target.value })} /></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message} /></Dialog>
  </AcCapitalShell>;
}
