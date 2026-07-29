"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Bot, Boxes, CheckCircle2, ClipboardCheck, Eye, FileCheck2, FileImage, FileSearch, Fingerprint, GitCompareArrows, ImagePlus, Layers3, Link2, ScanSearch, ShieldCheck, UploadCloud, UserCheck } from "lucide-react"
import { formatDate, statusLabel } from "../headquarters/client"
import { PageStatus } from "../headquarters/primitives"
import { bulk5ContextHref, useBulk5Context, writeBulk5Context } from "./bulk5-context"
import { proofCaseTone, rubricFor } from "./bulk5-model"
import { useBulk5ProofRegistry } from "./bulk5-api"
import { Bulk5BrandCrown, Bulk5Modal, Bulk5TruthState, DominantAction, EmptyAuthorityState, ProofContextStrip, SectionTitle, TonePill, styles } from "./Bulk5Shared"

export default function Bulk5EvidenceLabWorkspace() {
  const registry = useBulk5ProofRegistry()
  const context = useBulk5Context("evidence", "/market-os/content-command-center")
  const [selectedId, setSelectedId] = React.useState(context.dossierId || "")
  const [view, setView] = React.useState<"proof" | "matrix" | "lineage" | "variants">("proof")
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [title, setTitle] = React.useState("Preuve de version contrôlée")
  const [note, setNote] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [busy, setBusy] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const item = registry.cases.find((entry) => entry.id === selectedId) || registry.cases[0]
  const rubric = item ? rubricFor(item) : null

  React.useEffect(() => { if (!selectedId && registry.cases[0]?.id) setSelectedId(registry.cases[0].id) }, [registry.cases, selectedId])
  React.useEffect(() => {
    if (!item) return
    writeBulk5Context({ ...context, dossierId: item.id, dossierTitle: item.dossier.title, evidenceId: item.latestEvidence?.id, version: item.latestEvidence?.filename || item.latestEvidence?.title, stage: "evidence", sourceHref: typeof window !== "undefined" ? window.location.pathname + window.location.search : "", updatedAt: new Date().toISOString() })
  }, [context, item])

  const missingProof = item ? [
    !item.latestEvidence ? "Version ou export contrôlé" : "",
    !item.dossier.reviewer_name ? "Reviewer ou inspecteur affecté" : "",
    item.dossier.source_state !== "secured" ? "Lien de source canonique ou déclaration de limite" : "",
    !rubric ? "Rubric applicable" : "",
  ].filter(Boolean) : []

  async function upload() {
    if (!item || !file) return
    setBusy("upload"); setNotice("")
    try {
      await registry.uploadEvidence({ dossierId: item.id, file, title, note, progress: Math.max(5, Number(item.dossier.progress || 100)) })
      setUploadOpen(false); setFile(null); setNote(""); setNotice("Preuve enregistrée dans le registre existant. Elle reste à inspecter; l’upload ne vaut pas acceptation.")
    } catch (error) { setNotice(error instanceof Error ? error.message : "EVIDENCE_UPLOAD_FAILED") }
    finally { setBusy("") }
  }
  async function analyze() {
    if (!item?.latestEvidence) return
    setBusy("analyze"); setNotice("")
    try { await registry.analyzeEvidence(item.latestEvidence.id); setNotice("Analyse assistée enregistrée. Elle demeure un avis non décisionnel.") }
    catch (error) { setNotice(error instanceof Error ? error.message : "EVIDENCE_ANALYSIS_FAILED") }
    finally { setBusy("") }
  }

  return <main className={styles.bulk5Canvas} data-content-experience-bulk5="evidence-lab">
    <PageStatus loading={registry.loading} error={registry.error} migrationReady={registry.snapshot.migrationReady} refresh={registry.refresh}/>
    <Bulk5BrandCrown eyebrow="FORENSIC INSPECTION THEATRE" title="Chaque preuve reliée à la bonne version, au bon critère et à sa provenance." description="Evidence Lab constitue le proof package, rend visibles les limites, compare les versions et prépare la review humaine sans confondre upload, suffisance, review et validation." returnTo={context.returnTo} actions={<Link href={bulk5ContextHref("/market-os/content-command-center/review", { ...context, dossierId: item?.id, evidenceId: item?.latestEvidence?.id, stage: "review" })}><ClipboardCheck/> Review Command</Link>}/>
    <Bulk5TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()}/>
    <ProofContextStrip context={context} caseCode={item?.dossier.content_code} version={item?.latestEvidence?.filename || item?.latestEvidence?.title} stage="Evidence intelligence"/>
    {notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.evidenceHeroMetrics} aria-label="Pression de preuve">
      <article><UploadCloud/><span><small>PROOF CASES</small><strong>{registry.cases.length}</strong><p>Dossiers exposant preuve ou review.</p></span></article>
      <article><FileSearch/><span><small>SANS PREUVE</small><strong>{registry.cases.filter((entry) => entry.proofState === "missing").length}</strong><p>Version contrôlée non jointe.</p></span></article>
      <article><UserCheck/><span><small>REVIEW ACCEPTÉE</small><strong>{registry.cases.filter((entry) => entry.reviewState === "accepted").length}</strong><p>Conclusion humaine observable.</p></span></article>
      <article><AlertTriangle/><span><small>INSUFFISANT</small><strong>{registry.cases.filter((entry) => entry.proofState === "insufficient").length}</strong><p>Correction ou preuve supplémentaire.</p></span></article>
    </section>

    <section className={styles.evidenceTheatre}>
      <aside className={styles.proofQueue}>
        <SectionTitle eyebrow="PROOF CASES" title="File de constitution" description="Sélectionnez le dossier et conservez sa version comme identité de l’inspection."/>
        <div>{registry.cases.map((entry) => <button type="button" key={entry.id} aria-current={item?.id === entry.id ? "page" : undefined} onClick={() => setSelectedId(entry.id)}><span><small>{entry.dossier.content_code || entry.id}</small><strong>{entry.dossier.title}</strong><em>{entry.latestEvidence?.filename || "Version non jointe"}</em></span><TonePill tone={proofCaseTone(entry.proofState)}>{statusLabel(entry.proofState)}</TonePill></button>)}</div>
        {!registry.cases.length ? <EmptyAuthorityState title="Aucun proof case" detail="Les productions soumises apparaîtront lorsque le snapshot exposera un dossier, une preuve ou une review."/> : null}
      </aside>

      <article className={styles.primaryEvidenceStage}>
        <header><span><ScanSearch/><small>PRIMARY EVIDENCE STAGE</small></span><div role="group" aria-label="Vues de preuve"><button aria-pressed={view === "proof"} onClick={() => setView("proof")}><Eye/> Preuve</button><button aria-pressed={view === "matrix"} onClick={() => setView("matrix")}><Boxes/> Matrice</button><button aria-pressed={view === "lineage"} onClick={() => setView("lineage")}><Fingerprint/> Provenance</button><button aria-pressed={view === "variants"} onClick={() => setView("variants")}><Layers3/> Variantes</button></div></header>
        {item && view === "proof" ? <div className={styles.evidencePreview}>
          {item.latestEvidence?.content_type?.startsWith("image/") && item.latestEvidence.preview_url ? <img src={item.latestEvidence.preview_url} alt={`Preuve ${item.latestEvidence.title || item.dossier.title}`}/> : <div className={styles.previewFallback}><FileImage/><strong>{item.latestEvidence?.title || "Aucune preuve visualisable"}</strong><p>{item.latestEvidence ? `${item.latestEvidence.filename || item.latestEvidence.evidence_type || "Fichier"}. Le format ne fournit pas de preview web dans le snapshot.` : "Joignez la version ou l’export contrôlé. Aucune image de démonstration ne remplace la preuve réelle."}</p></div>}
          <footer><dl><div><dt>Dossier</dt><dd>{item.dossier.content_code || item.id}</dd></div><div><dt>Version</dt><dd>{item.latestEvidence?.filename || "Non exposée"}</dd></div><div><dt>Type</dt><dd>{item.latestEvidence?.content_type || item.latestEvidence?.evidence_type || "Non exposé"}</dd></div><div><dt>Soumise</dt><dd>{formatDate(item.latestEvidence?.created_at, true)}</dd></div></dl></footer>
        </div> : null}
        {item && view === "matrix" ? <div className={styles.requirementMatrix}><header><span>Critère</span><span>Preuve attendue</span><span>Preuve soumise</span><span>État</span></header>{(rubric?.criteria || []).map((criterion) => <article key={criterion.code}><span><strong>{criterion.code}</strong><small>{criterion.title}</small></span><span>{criterion.evidence}</span><span>{item.latestEvidence?.title || "Aucune"}</span><TonePill tone={item.latestEvidence ? "warning" : criterion.blocking ? "danger" : "neutral"}>{item.latestEvidence ? "À inspecter" : criterion.blocking ? "Bloquant" : "Manquant"}</TonePill></article>)}</div> : null}
        {item && view === "lineage" ? <div className={styles.provenanceChain}>{[
          ["SOURCE", item.dossier.source_state === "secured" ? "Source sécurisée" : "Relation source non sécurisée", item.dossier.source_state === "secured" ? "success" : "warning"],
          ["WORKING VERSION", item.dossier.brief_version || "Version de brief non exposée", "info"],
          ["SUBMITTED VERSION", item.latestEvidence?.filename || item.latestEvidence?.title || "Absente", item.latestEvidence ? "warning" : "danger"],
          ["AI ADVICE", item.latestAiReview?.summary || "Non disponible", item.latestAiReview ? "info" : "neutral"],
          ["HUMAN REVIEW", item.latestHumanReview?.summary || "Non rendue", item.latestHumanReview ? proofCaseTone(item.latestHumanReview.result) : "warning"],
        ].map(([label, value, tone]) => <article key={label}><span>{label}</span><strong>{value}</strong><TonePill tone={tone as any}>{tone === "success" ? "Lié" : tone === "danger" ? "Absent" : "État observable"}</TonePill><ArrowRight/></article>)}</div> : null}
        {item && view === "variants" ? <div className={styles.variantWall}>{["Master", "Instagram", "Story", "WhatsApp", "LinkedIn", "Print", "Document"].map((variant, index) => <article key={variant}><span>{String(index + 1).padStart(2, "0")}</span><strong>{variant}</strong><p>{index === 0 && item.latestEvidence ? item.latestEvidence.filename || item.latestEvidence.title : "Relation de variante non exposée dans le snapshot."}</p><TonePill tone={index === 0 && item.latestEvidence ? "warning" : "neutral"}>{index === 0 && item.latestEvidence ? "À inspecter" : "Non documentée"}</TonePill></article>)}</div> : null}
      </article>

      <aside className={styles.sufficiencyInspector}>
        <header><ShieldCheck/><span><small>EVIDENCE SUFFICIENCY</small><strong>Suffisance ≠ upload</strong></span></header>
        <TonePill tone={item ? proofCaseTone(item.proofState) : "neutral"}>{item ? statusLabel(item.proofState) : "Aucun dossier"}</TonePill>
        <ul>{missingProof.length ? missingProof.map((entry) => <li key={entry}><AlertTriangle/>{entry}</li>) : <li><CheckCircle2/>Le package dispose des éléments structurels observables.</li>}</ul>
        <div className={styles.authorityTruth}><Bot/><span><strong>Analyse assistée</strong><p>{item?.latestAiReview?.summary || "Aucune analyse persistée. Elle ne serait jamais une autorité humaine."}</p></span></div>
        <div className={styles.authorityTruth}><UserCheck/><span><strong>Conclusion humaine</strong><p>{item?.latestHumanReview?.summary || "La suffisance reste à confirmer dans Review Command."}</p></span></div>
        <button type="button" onClick={() => setUploadOpen(true)} disabled={!item}><ImagePlus/> Joindre une preuve</button>
        <button type="button" onClick={() => void analyze()} disabled={!item?.latestEvidence || busy === "analyze"}><Bot/> {busy === "analyze" ? "Analyse…" : "Demander l’analyse assistée"}</button>
      </aside>
    </section>

    {item ? <section className={styles.proofAssemblyDock}>
      <div><SectionTitle eyebrow="PROOF PACKAGE ASSEMBLY" title="Constituer le handover de review" description="Le package conserve la version, les preuves, la rubric, la source, les limites et l’autorité attendue."/><div className={styles.packageFacts}><span><FileCheck2/><strong>{item.evidence.length}</strong><small>preuves liées</small></span><span><GitCompareArrows/><strong>Round {item.reviewRound}</strong><small>historique de review</small></span><span><Link2/><strong>{item.dossier.source_state === "secured" ? "Liée" : "Gate"}</strong><small>source canonique</small></span><span><ShieldCheck/><strong>{rubric?.code}</strong><small>rubric applicable</small></span></div></div>
      <div><DominantAction href={bulk5ContextHref("/market-os/content-command-center/review?mode=inspect", { ...context, dossierId: item.id, evidenceId: item.latestEvidence?.id, version: item.latestEvidence?.filename || item.latestEvidence?.title, stage: "review", returnTo: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/market-os/content-command-center/evidence" })}>Ouvrir la review de cette version</DominantAction><Link className={styles.secondaryLink} href={`/market-os/content-command-center/dossiers/${item.id}`}><FileSearch/> Dossier 360 <ArrowRight/></Link></div>
    </section> : null}

    <Bulk5Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Joindre une preuve versionnée" subtitle="PROOF SUBMISSION" footer={<><button type="button" onClick={() => setUploadOpen(false)}>Annuler</button><button type="button" className={styles.modalPrimary} disabled={!file || !item || busy === "upload"} onClick={() => void upload()}><UploadCloud/> {busy === "upload" ? "Envoi…" : "Soumettre la preuve"}</button></>}>
      <div className={styles.formGrid}><label>Titre de la preuve<input value={title} onChange={(event) => setTitle(event.target.value)}/></label><label>Version contrôlée<input value={item?.latestEvidence?.filename || context.version || "Nouvelle version"} readOnly/></label><label className={styles.wide}>Fichier<input type="file" accept="image/*,.pdf,video/*" onChange={(event) => setFile(event.target.files?.[0] || null)}/></label><label className={styles.wide}>Description, provenance et limites<textarea rows={6} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Origine, relation à la version, limites connues et objectif de preuve."/></label></div>
    </Bulk5Modal>
  </main>
}
