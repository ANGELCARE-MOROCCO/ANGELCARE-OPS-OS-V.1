"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Clock3, FileCheck2, FileKey2, Fingerprint, Gavel, History, LockKeyhole, RotateCcw, Scale, ShieldCheck, UserCheck } from "lucide-react"
import { formatDate, statusLabel } from "../headquarters/client"
import { PageStatus } from "../headquarters/primitives"
import { bulk5ContextHref, useBulk5Context, writeBulk5Context } from "./bulk5-context"
import { proofCaseTone, validationGates } from "./bulk5-model"
import { useBulk5ProofRegistry } from "./bulk5-api"
import { Bulk5BrandCrown, Bulk5Modal, Bulk5TruthState, EmptyAuthorityState, ProofContextStrip, ReadinessMatrix, SectionTitle, TonePill, styles } from "./Bulk5Shared"

type Decision = "approved" | "revision" | "blocked"

export default function Bulk5ValidationChamber() {
  const registry = useBulk5ProofRegistry()
  const context = useBulk5Context("validation", "/market-os/content-command-center")
  const [selectedId, setSelectedId] = React.useState(context.dossierId || "")
  const [decisionOpen, setDecisionOpen] = React.useState(false)
  const [decision, setDecision] = React.useState<Decision>("approved")
  const [summary, setSummary] = React.useState("")
  const [conditions, setConditions] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const item = registry.cases.find((entry) => entry.id === selectedId) || registry.cases[0]
  const gates = item ? validationGates(item) : []
  const blockers = gates.filter((gate) => gate.blocking && !gate.passed)
  const validated = item?.validationState === "validated" || item?.validationState === "conditional"

  React.useEffect(() => { if (!selectedId && registry.cases[0]?.id) setSelectedId(registry.cases[0].id) }, [registry.cases, selectedId])
  React.useEffect(() => { if (item) writeBulk5Context({ ...context, dossierId: item.id, dossierTitle: item.dossier.title, evidenceId: item.latestEvidence?.id, reviewId: item.latestHumanReview?.id, version: item.latestEvidence?.filename || item.latestEvidence?.title, stage: "validation", sourceHref: typeof window !== "undefined" ? window.location.pathname + window.location.search : "", updatedAt: new Date().toISOString() }) }, [context, item])

  async function submitDecision() {
    if (!item || !summary.trim()) return
    setBusy(true); setNotice("")
    try {
      await registry.recordHumanReview({ dossierId: item.id, evidenceId: item.latestEvidence?.id, result: decision, summary: `[VALIDATION] ${summary.trim()}`, corrections: conditions.split("\n").map((line) => line.trim()).filter(Boolean), authorityRole: "Content Command Authority" })
      setDecisionOpen(false); setSummary(""); setConditions(""); setNotice(decision === "approved" ? "Décision institutionnelle enregistrée pour la version sélectionnée. Les conditions restent visibles dans la lineage." : "Décision institutionnelle enregistrée; la progression demeure bloquée ou retournée.")
    } catch (error) { setNotice(error instanceof Error ? error.message : "VALIDATION_DECISION_FAILED") }
    finally { setBusy(false) }
  }

  return <main className={styles.bulk5Canvas} data-content-experience-bulk5="validation-chamber">
    <PageStatus loading={registry.loading} error={registry.error} migrationReady={registry.snapshot.migrationReady} refresh={registry.refresh}/>
    <Bulk5BrandCrown eyebrow="INSTITUTIONAL DECISION CHAMBER" title="Une décision humaine, sur la bonne version, avec ses preuves et ses conséquences." description="Validation Chamber rend explicites readiness, autorité, conditions, immutabilité et handover vers la release. La review n’est jamais confondue avec la validation formelle." returnTo={context.returnTo} actions={<Link href={bulk5ContextHref("/market-os/content-command-center/review?mode=inspect", { ...context, dossierId: item?.id, evidenceId: item?.latestEvidence?.id, stage: "review" })}><UserCheck/> Review Desk</Link>}/>
    <Bulk5TruthState loading={registry.loading} error={registry.error} onRefresh={() => void registry.refresh()}/>
    <ProofContextStrip context={context} caseCode={item?.dossier.content_code} version={item?.latestEvidence?.filename || item?.latestEvidence?.title} stage="Formal human validation"/>
    {notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.validationCommandBar}>
      <article><Clock3/><span><small>EN ATTENTE</small><strong>{registry.cases.filter((entry) => entry.validationState === "ready").length}</strong><p>Review acceptée, décision requise.</p></span></article>
      <article><AlertTriangle/><span><small>NON PRÊTS</small><strong>{registry.cases.filter((entry) => entry.validationState === "not_ready").length}</strong><p>Preuve, review ou autorité manquante.</p></span></article>
      <article><FileCheck2/><span><small>VALIDÉS</small><strong>{registry.cases.filter((entry) => entry.validationState === "validated" || entry.validationState === "conditional").length}</strong><p>Décision humaine observable.</p></span></article>
      <article><Fingerprint/><span><small>SOURCE GATE</small><strong>{registry.cases.filter((entry) => entry.dossier.source_state !== "secured").length}</strong><p>Validation distincte de la source canonique.</p></span></article>
    </section>

    <section className={styles.validationChamber} data-bulk5-silhouette="institutional-decision">
      <aside className={styles.validationIntake}><SectionTitle eyebrow="VALIDATION INTAKE" title="File d’autorité" description="La version et la conclusion de review restent visibles avant toute décision."/>{registry.cases.map((entry) => <button type="button" key={entry.id} aria-current={item?.id === entry.id ? "page" : undefined} onClick={() => setSelectedId(entry.id)}><span><small>{entry.dossier.content_code || entry.id} · {entry.latestEvidence?.filename || "Version absente"}</small><strong>{entry.dossier.title}</strong><em>{entry.dossier.reviewer_name || "Autorité non affectée"}</em></span><TonePill tone={proofCaseTone(entry.validationState)}>{statusLabel(entry.validationState)}</TonePill></button>)}</aside>
      <article className={styles.validationCaseIdentity}>
        {item ? <><header><Scale/><span><small>VALIDATION CASE · {item.dossier.content_code || item.id}</small><h2>{item.dossier.title}</h2><p>{item.dossier.service_label || item.dossier.service || "Service non exposé"} · {item.dossier.audience || "Audience non exposée"} · {item.dossier.channel || "Canal non exposé"}</p></span><TonePill tone={proofCaseTone(item.validationState)}>{statusLabel(item.validationState)}</TonePill></header><div className={styles.validationLineage}>{[
          ["PRODUCTION", `${item.dossier.progress || 0}% observé`, Number(item.dossier.progress || 0) >= 90],
          ["VERSION", item.latestEvidence?.filename || item.latestEvidence?.title || "Absente", Boolean(item.latestEvidence)],
          ["EVIDENCE", statusLabel(item.proofState), item.proofState === "sufficient"],
          ["REVIEW", item.latestHumanReview?.summary || "Conclusion absente", item.reviewState === "accepted"],
          ["VALIDATION", statusLabel(item.validationState), validated],
          ["SOURCE", item.dossier.source_state === "secured" ? "Sécurisée" : "Gate restant", item.dossier.source_state === "secured"],
        ].map(([label, value, ok]) => <article key={String(label)}><span>{String(label)}</span><strong>{String(value)}</strong>{ok ? <CheckCircle2/> : <AlertTriangle/>}<ArrowRight/></article>)}</div><section className={styles.proofReviewSummary}><div className={styles.validationPreview}>{item.latestEvidence?.content_type?.startsWith("image/") && item.latestEvidence.preview_url ? <img src={item.latestEvidence.preview_url} alt={`Version ${item.latestEvidence.title}`}/> : <div className={styles.previewFallback}><FileKey2/><strong>{item.latestEvidence?.filename || "Preview indisponible"}</strong><p>{item.latestEvidence ? "La version est identifiée mais le format ne fournit pas de preview web." : "Aucune version probante ne peut être validée."}</p></div>}</div><aside><div><Bot/><span><small>AI ADVICE</small><strong>{item.latestAiReview?.summary || "Non disponible"}</strong></span></div><div><UserCheck/><span><small>HUMAN REVIEW</small><strong>{item.latestHumanReview?.summary || "Non rendue"}</strong></span></div><div><History/><span><small>REVIEW LINEAGE</small><strong>{item.humanReviews.length} conclusion(s) · Round {item.reviewRound}</strong></span></div></aside></section></> : <EmptyAuthorityState title="Aucun validation case" detail="Les dossiers reviewés apparaîtront ici avec leur version contrôlée."/>}
      </article>
      <aside className={styles.authorityBoundary}><header><LockKeyhole/><span><small>AUTHORITY BOUNDARY</small><strong>Décision humaine protégée</strong></span></header><dl><div><dt>Autorité affectée</dt><dd>{item?.dossier.reviewer_name || "Non affectée"}</dd></div><div><dt>Version</dt><dd>{item?.latestEvidence?.filename || "Non exposée"}</dd></div><div><dt>Review acceptée</dt><dd>{item?.reviewState === "accepted" ? "Oui" : "Non"}</dd></div><div><dt>Decision supportée</dt><dd>Approve · Revision · Block</dd></div></dl><p>Les décisions Defer, Reject autonome, suspension ou délégation ne sont pas simulées sans code backend explicitement exposé.</p><button type="button" className={styles.approveAction} disabled={!item || blockers.length > 0} onClick={() => { setDecision("approved"); setDecisionOpen(true) }}><Gavel/> Rendre la décision</button><button type="button" onClick={() => { setDecision("revision"); setDecisionOpen(true) }} disabled={!item}><RotateCcw/> Retourner pour correction</button><button type="button" className={styles.blockAction} onClick={() => { setDecision("blocked"); setDecisionOpen(true) }} disabled={!item}><AlertTriangle/> Bloquer / escalader</button></aside>
    </section>

    {item ? <section className={styles.validationLowerDeck}><ReadinessMatrix gates={gates} title="Institutional readiness matrix"/><section className={styles.decisionConsequencePreview}><SectionTitle eyebrow="DECISION CONSEQUENCE PREVIEW" title="Effet attendu avant confirmation" description="La conséquence reste une prévision UI fondée sur les gates; la mutation autoritaire est enregistrée par l’action existante."/><div>{[
      ["Dossier", decision === "approved" ? "Passage vers Source Gate / release selon backend" : decision === "revision" ? "Retour au cycle correction" : "Progression bloquée"],
      ["Asset", decision === "approved" ? "Éligible à la promotion après source et rights" : "Non éligible"],
      ["My Work", decision === "revision" ? "Correction attendue" : "Décision retirée de la file après reload"],
      ["Distribution", decision === "approved" && item.dossier.source_state === "secured" ? "Handover possible" : "Gate restant"],
    ].map(([label, value]) => <article key={label}><strong>{label}</strong><span>{value}</span><ArrowRight/></article>)}</div></section><section className={styles.decisionCertificate}><header><ShieldCheck/><span><small>DECISION CERTIFICATE</small><strong>{validated ? "Décision institutionnelle observable" : "Certificat en attente"}</strong></span></header><dl><div><dt>Dossier</dt><dd>{item.dossier.content_code || item.id}</dd></div><div><dt>Version</dt><dd>{item.latestEvidence?.filename || item.latestEvidence?.title || "Non exposée"}</dd></div><div><dt>Autorité</dt><dd>{item.dossier.reviewer_name || "Non affectée"}</dd></div><div><dt>Décision</dt><dd>{item.latestHumanReview ? statusLabel(item.latestHumanReview.result) : "En attente"}</dd></div><div><dt>Date</dt><dd>{formatDate(item.latestHumanReview?.created_at, true)}</dd></div><div><dt>Source</dt><dd>{item.dossier.source_state === "secured" ? "Sécurisée" : "Gate restant"}</dd></div></dl>{validated ? <Link href={bulk5ContextHref("/market-os/content-command-center/distribution", { ...context, dossierId: item.id, evidenceId: item.latestEvidence?.id, stage: "validation" })}>Préparer la release <ArrowRight/></Link> : null}</section></section> : null}

    <Bulk5Modal open={decisionOpen} onClose={() => setDecisionOpen(false)} title={decision === "approved" ? "Valider la version contrôlée" : decision === "revision" ? "Retourner au cycle de correction" : "Bloquer ou escalader la validation"} subtitle="INSTITUTIONAL HUMAN DECISION" footer={<><button type="button" onClick={() => setDecisionOpen(false)}>Annuler</button><button type="button" className={decision === "blocked" ? styles.modalDanger : styles.modalPrimary} disabled={!summary.trim() || busy} onClick={() => void submitDecision()}>{busy ? "Enregistrement…" : "Confirmer la décision"}</button></>}><div className={styles.formGrid}><label>Décision<select value={decision} onChange={(event) => setDecision(event.target.value as Decision)}><option value="approved">Valider / valider avec conditions</option><option value="revision">Retourner pour correction</option><option value="blocked">Bloquer / escalader</option></select></label><label>Autorité<input value={item?.dossier.reviewer_name || "Content Command Authority"} readOnly/></label><label className={styles.wide}>Motivation institutionnelle<textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Fondement, version, risques acceptés ou rejetés, restrictions et handover."/></label><label className={styles.wide}>Conditions — une par ligne<textarea rows={7} value={conditions} onChange={(event) => setConditions(event.target.value)} placeholder="Condition non bloquante\nPreuve de suivi\nRestriction d’usage"/></label></div></Bulk5Modal>
  </main>
}
