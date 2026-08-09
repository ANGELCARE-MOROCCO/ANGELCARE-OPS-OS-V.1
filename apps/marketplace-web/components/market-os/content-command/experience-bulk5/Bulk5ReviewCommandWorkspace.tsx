"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, ClipboardCheck, Eye, FileCheck2, FileSearch, Gavel, GitCompareArrows, ListChecks, RotateCcw, Scale, ShieldAlert, Sparkles, UserCheck } from "lucide-react"
import { formatDate, statusLabel } from "../headquarters/client"
import { PageStatus } from "../headquarters/primitives"
import { bulk5ContextHref, useBulk5Context, writeBulk5Context } from "./bulk5-context"
import { proofCaseTone, rubricFor } from "./bulk5-model"
import { useBulk5ProofRegistry } from "./bulk5-api"
import Bulk5CorrectionWorkbench from "./Bulk5CorrectionWorkbench"
import Bulk5RubricAuthority from "./Bulk5RubricAuthority"
import { Bulk5BrandCrown, Bulk5Modal, Bulk5TruthState, DominantAction, EmptyAuthorityState, ProofContextStrip, SectionTitle, TonePill, WorkspaceTabs, styles } from "./Bulk5Shared"
import { ContentMediaPreview } from "../media-preview/ContentMediaPreview"

const modes = [
  { id: "command", label: "Review Command", detail: "Intake et orchestration" },
  { id: "inspect", label: "Inspection", detail: "Dual-Lens Review Desk" },
  { id: "corrections", label: "Corrections", detail: "Resolution Workbench" },
  { id: "rubrics", label: "Rubrics", detail: "Critères versionnés" },
]

type Conclusion = "approved" | "revision" | "blocked"

export default function Bulk5ReviewCommandWorkspace() {
  const registry = useBulk5ProofRegistry()
  const context = useBulk5Context("review", "/market-os/content-command-center")
  const [mode, setMode] = React.useState("command")
  React.useEffect(() => { if (typeof window !== "undefined") setMode(new URLSearchParams(window.location.search).get("mode") || "command") }, [])
  const [selectedId, setSelectedId] = React.useState(context.dossierId || "")
  const [decisionOpen, setDecisionOpen] = React.useState(false)
  const [conclusion, setConclusion] = React.useState<Conclusion>("approved")
  const [summary, setSummary] = React.useState("")
  const [corrections, setCorrections] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const item = registry.cases.find((entry) => entry.id === selectedId) || registry.cases[0]
  const rubric = item ? rubricFor(item) : null

  React.useEffect(() => { if (!selectedId && registry.cases[0]?.id) setSelectedId(registry.cases[0].id) }, [registry.cases, selectedId])
  React.useEffect(() => { if (item) writeBulk5Context({ ...context, dossierId: item.id, dossierTitle: item.dossier.title, evidenceId: item.latestEvidence?.id, reviewId: item.latestHumanReview?.id, version: item.latestEvidence?.filename || item.latestEvidence?.title, stage: mode === "corrections" ? "corrections" : mode === "rubrics" ? "rubrics" : "review", sourceHref: typeof window !== "undefined" ? window.location.pathname + window.location.search : "", updatedAt: new Date().toISOString() }) }, [context, item, mode])

  const queues = {
    new: registry.cases.filter((entry) => entry.evidence.length && !entry.reviews.length),
    inspect: registry.cases.filter((entry) => entry.reviewState === "under_review"),
    corrections: registry.cases.filter((entry) => entry.reviewState === "correction_required" || entry.reviewState === "blocked"),
    conclusion: registry.cases.filter((entry) => entry.evidence.length && entry.reviewState !== "accepted"),
    accepted: registry.cases.filter((entry) => entry.reviewState === "accepted"),
  }

  async function submitReview() {
    if (!item || !summary.trim()) return
    setBusy(true); setNotice("")
    try {
      await registry.recordHumanReview({ dossierId: item.id, evidenceId: item.latestEvidence?.id, result: conclusion, summary: summary.trim(), corrections: corrections.split("\n").map((line) => line.trim()).filter(Boolean), authorityRole: "Content Reviewer" })
      setDecisionOpen(false); setSummary(""); setCorrections(""); setNotice(conclusion === "approved" ? "Review humaine acceptée pour la version sélectionnée." : "Conclusion et corrections enregistrées. Le cycle de correction reste ouvert.")
    } catch (error) { setNotice(error instanceof Error ? error.message : "REVIEW_DECISION_FAILED") }
    finally { setBusy(false) }
  }

  return <main className={styles.bulk5Canvas} data-content-experience-bulk5="review-command">
    <PageStatus loading={registry.loading} error={registry.error} migrationReady={registry.snapshot.migrationReady} refresh={registry.refresh}/>
    <Bulk5BrandCrown eyebrow="REVIEWER OPERATIONS THEATRE" title="Inspecter la bonne version, contre les bons critères, avec une conclusion humaine traçable." description="Review Command orchestre les dossiers, l’inspection, les findings, les corrections et les rounds sans réduire l’autorité à une table Approve/Reject." returnTo={context.returnTo} actions={<Link href={bulk5ContextHref("/market-os/content-command-center/validation", { ...context, dossierId: item?.id, evidenceId: item?.latestEvidence?.id, stage: "validation" })}><Scale/> Validation Chamber</Link>}/>
    <Bulk5TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()}/>
    <ProofContextStrip context={context} caseCode={item?.dossier.content_code} version={item?.latestEvidence?.filename || item?.latestEvidence?.title} stage={mode === "corrections" ? "Correction & resubmission" : mode === "rubrics" ? "Review rubric authority" : "Professional review"}/>
    <WorkspaceTabs value={mode} items={modes} onChange={setMode}/>
    {notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}

    {mode === "command" ? <section className={styles.reviewCommandTheatre} data-bulk5-silhouette="review-orchestration">
      <section className={styles.reviewIntake}><SectionTitle eyebrow="REVIEW INTAKE" title="File d’inspection institutionnelle" description="Les cases restent liés à leur version, preuve, round et reviewer."/><div className={styles.reviewQueueMetrics}>{[
        ["Nouvelles", queues.new.length, "Preuve sans review"], ["Inspection", queues.inspect.length, "Review ouverte"], ["Corrections", queues.corrections.length, "Retour ou blocage"], ["Conclusion", queues.conclusion.length, "Décision à rendre"], ["Acceptées", queues.accepted.length, "Review humaine"],
      ].map(([label, value, detail]) => <article key={String(label)}><strong>{String(value)}</strong><span><b>{String(label)}</b><small>{String(detail)}</small></span></article>)}</div><div className={styles.reviewCaseList}>{registry.cases.map((entry) => <button type="button" key={entry.id} aria-current={item?.id === entry.id ? "page" : undefined} onClick={() => setSelectedId(entry.id)}><span><small>{entry.dossier.content_code || entry.id} · Round {entry.reviewRound}</small><strong>{entry.dossier.title}</strong><em>{entry.latestEvidence?.filename || "Preuve absente"}</em></span><TonePill tone={proofCaseTone(entry.reviewState)}>{statusLabel(entry.reviewState)}</TonePill></button>)}</div></section>
      <section className={styles.reviewConstellations}><SectionTitle eyebrow="REVIEW CONSTELLATIONS" title="Dossiers regroupés par pression réelle" description="Aucune capacité ou productivité inventée; uniquement assignments, délais et états observés."/><div>{[
        ["Version manquante", registry.cases.filter((entry) => !entry.latestEvidence)],
        ["Reviewer manquant", registry.cases.filter((entry) => !entry.dossier.reviewer_name)],
        ["Findings ouverts", registry.cases.filter((entry) => entry.findings.length)],
        ["Prêtes à conclure", registry.cases.filter((entry) => entry.latestEvidence && entry.reviewState === "under_review")],
      ].map(([label, entries]) => <article key={String(label)}><header><strong>{String(label)}</strong><TonePill tone={(entries as any[]).length ? "warning" : "success"}>{(entries as any[]).length}</TonePill></header><ul>{(entries as typeof registry.cases).slice(0, 4).map((entry) => <li key={entry.id}>{entry.dossier.title}<small>{entry.dossier.reviewer_name || "Autorité non affectée"}</small></li>)}</ul></article>)}</div></section>
      <aside className={styles.reviewRiskRail}><header><ShieldAlert/><span><small>RISK & ESCALATION</small><strong>Pression institutionnelle</strong></span></header>{registry.cases.filter((entry) => !entry.latestEvidence || !entry.dossier.reviewer_name || entry.reviewState === "blocked").slice(0, 6).map((entry) => <button key={entry.id} onClick={() => setSelectedId(entry.id)}><AlertTriangle/><span><strong>{entry.dossier.title}</strong><small>{!entry.latestEvidence ? "Version absente" : !entry.dossier.reviewer_name ? "Reviewer absent" : "Review bloquée"}</small></span></button>)}<DominantAction onClick={() => setMode("inspect")} disabled={!item}>Inspecter le case sélectionné</DominantAction></aside>
    </section> : null}

    {mode === "inspect" && item ? <section className={styles.dualLensReviewDesk} data-bulk5-silhouette="dual-lens-review">
      <section className={styles.reviewPreviewLens}><header><span><Eye/><small>CREATIVE / DOCUMENT LENS</small></span><div><TonePill tone={proofCaseTone(item.proofState)}>{statusLabel(item.proofState)}</TonePill><button type="button" onClick={() => setMode("corrections")}><RotateCcw/> Corrections</button></div></header>{item.latestEvidence ? <ContentMediaPreview source={{ id: item.latestEvidence.id, title: item.latestEvidence.title || item.latestEvidence.filename || item.dossier.title, url: item.latestEvidence.preview_url, bridgeFileId: item.latestEvidence.bridge_file_id, storageKey: item.latestEvidence.storage_key, contentType: item.latestEvidence.content_type, filename: item.latestEvidence.filename, sizeBytes: item.latestEvidence.size_bytes, sourceLabel: "Review Command" }} mode="inspector" fit="contain"/> : <div className={styles.previewFallback}><FileSearch/><strong>Version non visualisable</strong><p>Aucune version soumise: la review ne peut pas être conclue.</p></div>}<footer><span><GitCompareArrows/><strong>Round {item.reviewRound}</strong><small>{item.evidence.length} preuve(s) · {item.reviews.length} review(s)</small></span><Link href={bulk5ContextHref("/market-os/content-command-center/evidence", { ...context, dossierId: item.id, evidenceId: item.latestEvidence?.id, stage: "evidence" })}>Evidence Lab <ArrowRight/></Link></footer></section>
      <section className={styles.reviewConstitutionLens}><header><ClipboardCheck/><span><small>REVIEW CONSTITUTION</small><h2>{item.dossier.title}</h2><p>{rubric?.code} · {rubric?.name} · v{rubric?.version}</p></span></header><div className={styles.criteriaRail}>{rubric?.criteria.map((criterion) => <article key={criterion.code}><span>{criterion.blocking ? <ShieldAlert/> : <CheckCircle2/>}</span><div><small>{criterion.code} · {criterion.severity}</small><strong>{criterion.title}</strong><p>{criterion.purpose}</p><em>Preuve: {criterion.evidence}</em></div><TonePill tone={criterion.blocking ? "danger" : "info"}>{criterion.blocking ? "Bloquant" : "Applicable"}</TonePill></article>)}</div><section className={styles.findingsLayer}><header><ListChecks/><span><small>FINDINGS LAYER</small><strong>{item.findings.length} finding(s) historiques</strong></span></header>{item.findings.length ? item.findings.map((finding) => <article key={finding.id}><span>{finding.code}</span><div><strong>{finding.instruction}</strong><small>{finding.criterion} · {finding.severity}</small></div><TonePill tone={finding.severity === "blocking" || finding.severity === "critical" ? "danger" : "warning"}>{finding.status}</TonePill></article>) : <EmptyAuthorityState title="Aucun finding structuré" detail="La conclusion du reviewer peut être rendue sans inventer de constat."/>}</section></section>
      <aside className={styles.reviewConclusionDock}><header><Gavel/><span><small>HUMAN CONCLUSION</small><strong>Autorité de review</strong></span></header><dl><div><dt>Reviewer</dt><dd>{item.dossier.reviewer_name || "Non affecté"}</dd></div><div><dt>Version</dt><dd>{item.latestEvidence?.filename || "Non exposée"}</dd></div><div><dt>Dernière conclusion</dt><dd>{item.latestHumanReview ? statusLabel(item.latestHumanReview.result) : "Aucune"}</dd></div><div><dt>Résumé</dt><dd>{item.latestHumanReview?.summary || "À rendre"}</dd></div></dl><button type="button" className={styles.approveAction} disabled={!item.latestEvidence} onClick={() => { setConclusion("approved"); setDecisionOpen(true) }}><FileCheck2/> Accepter la review</button><button type="button" onClick={() => { setConclusion("revision"); setDecisionOpen(true) }}><RotateCcw/> Retourner pour correction</button><button type="button" className={styles.blockAction} onClick={() => { setConclusion("blocked"); setDecisionOpen(true) }}><ShieldAlert/> Bloquer / escalader</button><Link href={bulk5ContextHref("/market-os/content-command-center/validation", { ...context, dossierId: item.id, evidenceId: item.latestEvidence?.id, stage: "validation" })}><Scale/> Validation Chamber <ArrowRight/></Link></aside>
    </section> : null}

    {mode === "corrections" ? <Bulk5CorrectionWorkbench item={item} context={context}/> : null}
    {mode === "rubrics" ? <Bulk5RubricAuthority/> : null}

    <Bulk5Modal open={decisionOpen} onClose={() => setDecisionOpen(false)} title={conclusion === "approved" ? "Accepter la review de cette version" : conclusion === "revision" ? "Formaliser les corrections" : "Bloquer ou escalader"} subtitle="HUMAN REVIEW CONCLUSION" footer={<><button type="button" onClick={() => setDecisionOpen(false)}>Annuler</button><button type="button" className={conclusion === "blocked" ? styles.modalDanger : styles.modalPrimary} disabled={!summary.trim() || busy} onClick={() => void submitReview()}>{busy ? "Enregistrement…" : "Confirmer la conclusion"}</button></>}><div className={styles.formGrid}><label>Version<input value={item?.latestEvidence?.filename || item?.latestEvidence?.title || "Non exposée"} readOnly/></label><label>Autorité<input value={item?.dossier.reviewer_name || "Content Reviewer"} readOnly/></label><label className={styles.wide}>Conclusion motivée<textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Fondement, critères inspectés, limites et conclusion."/></label><label className={styles.wide}>Findings / corrections — une par ligne<textarea rows={8} value={corrections} onChange={(event) => setCorrections(event.target.value)} placeholder="Correction 1\nCorrection 2"/></label></div></Bulk5Modal>
  </main>
}
