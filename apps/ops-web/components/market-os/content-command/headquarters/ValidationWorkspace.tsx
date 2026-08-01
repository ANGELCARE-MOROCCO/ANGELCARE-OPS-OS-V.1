"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  FileCheck2,
  FileWarning,
  Fingerprint,
  Gavel,
  History,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { PageStatus } from "./primitives"
import { formatDate, headquartersAction, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import { Empty, Field, Metric, Modal, Pill, SectionTitle, toneClass, type ReleaseTone } from "../release/release-ui"
import styles from "../release/mz7-release.module.css"
import { ContentMediaPreview } from "../media-preview/ContentMediaPreview"

type Decision = "approved" | "revision" | "blocked"

type Gate = {
  label: string
  detail: string
  ok: boolean
  critical?: boolean
}

function gateTone(gate: Gate): ReleaseTone {
  if (gate.ok) return "success"
  return gate.critical ? "danger" : "warning"
}

export default function ValidationWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [selectedId, setSelectedId] = React.useState("")
  const [decisionOpen, setDecisionOpen] = React.useState(false)
  const [decision, setDecision] = React.useState<Decision>("approved")
  const [summary, setSummary] = React.useState("")
  const [corrections, setCorrections] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")

  const queue = React.useMemo(() => snapshot?.dossiers.filter((dossier) => [
    "draft_submitted",
    "ai_review",
    "human_review",
    "revision",
    "validated",
    "source_required",
  ].includes(dossier.status)) || [], [snapshot])

  const dossier = queue.find((item) => item.id === selectedId) || queue[0]
  const reviews = snapshot?.reviews.filter((review) => review.dossier_id === dossier?.id) || []
  const evidence = snapshot?.evidence.filter((entry) => entry.dossier_id === dossier?.id) || []
  const lastEvidence = evidence[0]
  const aiReview = reviews.find((review) => review.review_type === "ai")
  const humanReview = reviews.find((review) => review.review_type === "human")
  const aiPassed = Boolean(aiReview && ["pass", "pass_minor", "approved"].includes(aiReview.result))
  const humanApproved = Boolean(humanReview && ["approved", "pass"].includes(humanReview.result))
  const sourceSecured = dossier?.source_state === "secured"
  const evidenceReady = evidence.length > 0
  const scopeReady = Boolean(dossier && dossier.progress >= 90)
  const reviewerReady = Boolean(dossier?.reviewer_name)

  const gates: Gate[] = [
    { label: "Version et périmètre", detail: "Progression, livrables et périmètre de production observables.", ok: scopeReady, critical: true },
    { label: "Preuve opérationnelle", detail: "Une preuve liée au dossier est disponible pour inspection.", ok: evidenceReady, critical: true },
    { label: "Révision AI", detail: "La recommandation automatisée est disponible comme avis, jamais comme autorité.", ok: aiPassed },
    { label: "Autorité humaine", detail: "Un reviewer ou validateur humain est affecté au dossier.", ok: reviewerReady, critical: true },
    { label: "Décision humaine", detail: "Une conclusion humaine persistée existe pour la version contrôlée.", ok: humanApproved },
    { label: "Source canonique", detail: "La source éditable est sécurisée ou demeure un gate explicite après décision.", ok: sourceSecured },
  ]
  const preDecisionReady = gates.slice(0, 4).every((gate) => gate.ok)
  const pendingCount = queue.filter((item) => !["validated", "source_required"].includes(item.status)).length
  const highRiskCount = queue.filter((item) => item.progress < 90 || !item.reviewer_name).length
  const missingSourceCount = queue.filter((item) => item.source_state !== "secured").length
  const conditionalCount = reviews.filter((review) => ["revision", "pass_minor", "blocked"].includes(review.result)).length

  const timeline = [
    ...(evidence.map((entry) => ({ id: `ev-${entry.id}`, label: "Preuve soumise", detail: entry.title, at: entry.created_at, icon: <Eye/> }))),
    ...(reviews.map((review) => ({ id: `rv-${review.id}`, label: review.review_type === "ai" ? "Avis AI enregistré" : "Décision humaine enregistrée", detail: review.summary, at: "", icon: review.review_type === "ai" ? <Bot/> : <UserCheck/> }))),
  ]

  async function submitDecision() {
    if (!dossier || !summary.trim()) return
    setBusy(true)
    setNotice("")
    try {
      await headquartersAction("record_human_review", {
        dossierId: dossier.id,
        evidenceId: lastEvidence?.id || "",
        result: decision,
        score: decision === "approved" ? 100 : decision === "revision" ? 55 : 20,
        summary: summary.trim(),
        corrections: corrections.split("\n").map((text) => text.trim()).filter(Boolean).map((text, index) => ({ code: `COR-${index + 1}`, instruction: text })),
        authorityRole: "Content Command Authority",
      })
      setDecisionOpen(false)
      setSummary("")
      setCorrections("")
      setNotice(decision === "approved" ? "Décision humaine enregistrée. Le Source Gate reste visible jusqu’à sécurisation canonique." : "Décision et corrections enregistrées.")
      await refresh()
    } catch (nextError) {
      setNotice(nextError instanceof Error ? nextError.message : "VALIDATION_DECISION_FAILED")
    } finally {
      setBusy(false)
    }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <div className={styles.liveRegion} aria-live="polite">{notice}</div>
    {notice ? <div className={styles.notice}>{notice}<button type="button" aria-label="Fermer la notification" onClick={() => setNotice("")}>×</button></div> : null}

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}><Scale/> VALIDATION CHAMBER</span>
        <h1>L’autorité institutionnelle avant toute diffusion.</h1>
        <p>Une chambre de décision versionnée où la preuve, la révision, la marque, la source et l’autorité humaine convergent avant le passage vers Distribution Tower.</p>
      </div>
      <aside className={styles.heroCommand}>
        <div className={styles.heroStat}><span><Gavel/></span><div><strong>{pendingCount}</strong><small>décisions encore ouvertes</small></div><b>{queue.length} dossiers</b></div>
        <div className={styles.heroActions}><button type="button" className={styles.primary} onClick={() => dossier && setDecisionOpen(true)} disabled={!dossier}><FileCheck2/> Ouvrir la décision</button><Link className={styles.secondary} href="/market-os/content-command-center/review"><ClipboardCheck/> Review Workspace</Link></div>
      </aside>
    </section>

    <section className={styles.metrics} aria-label="Indicateurs de validation">
      <Metric icon={<Clock3/>} label="En attente" value={pendingCount} detail="Dossiers sans décision finale observable." tone="warning"/>
      <Metric icon={<AlertTriangle/>} label="Risque élevé" value={highRiskCount} detail="Périmètre ou autorité encore incomplets." tone={highRiskCount ? "danger" : "success"}/>
      <Metric icon={<Fingerprint/>} label="Source requise" value={missingSourceCount} detail="La validation ne remplace pas la source canonique." tone={missingSourceCount ? "warning" : "success"}/>
      <Metric icon={<RotateCcw/>} label="Conditions / retours" value={conditionalCount} detail="Révisions, passages mineurs ou blocages observés." tone={conditionalCount ? "warning" : "neutral"}/>
    </section>

    <section className={styles.split}>
      <aside className={styles.section}>
        <SectionTitle eyebrow="VALIDATION INTAKE" title="File d’autorité" description="La version, la preuve, le reviewer et le Source Gate restent visibles avant toute décision."/>
        <div className={styles.queue}>
          {queue.map((item) => {
            const itemReviews = snapshot?.reviews.filter((review) => review.dossier_id === item.id) || []
            const hasHuman = itemReviews.some((review) => review.review_type === "human")
            const itemTone: ReleaseTone = hasHuman ? "success" : item.progress < 90 || !item.reviewer_name ? "danger" : "warning"
            return <button key={item.id} type="button" className={`${styles.queueButton} ${dossier?.id === item.id ? styles.queueSelected : ""}`} onClick={() => setSelectedId(item.id)}>
              <span><small>{item.content_code} · {item.service_label}</small><strong>{item.title}</strong><small>{item.reviewer_name || "Autorité non affectée"}</small></span>
              <span><Pill tone={itemTone}>{statusLabel(item.status)}</Pill></span>
            </button>
          })}
          {!queue.length ? <Empty title="Aucune soumission" detail="Les dossiers terminant leur Review Workspace arriveront ici."/> : null}
        </div>
      </aside>

      <article className={`${styles.section} ${styles.case}`}>
        {dossier ? <>
          <header className={styles.caseHeader}>
            <div><small>{dossier.content_code} · VERSION CONTRÔLÉE</small><h2>{dossier.title}</h2><p>{dossier.service_label} · {dossier.category} · {dossier.audience} · {dossier.channel}</p></div>
            <div className={styles.caseMeta}><Pill tone={tone(dossier.status) as ReleaseTone}>{statusLabel(dossier.status)}</Pill><Pill tone={dossier.progress >= 90 ? "success" : "warning"}>{dossier.progress}% observé</Pill><Pill tone={sourceSecured ? "success" : "warning"}>{sourceSecured ? "SOURCE SÉCURISÉE" : "SOURCE GATE"}</Pill></div>
          </header>

          <div className={styles.lineage} aria-label="Lignée de validation">
            {[
              ["STRATÉGIE", dossier.campaign_label || "Relation non exposée", "Contexte"],
              ["DOSSIER", dossier.content_code, dossier.status],
              ["MISSION", "Relation via dossier", "Traçabilité"],
              ["PREUVE", lastEvidence?.title || "Preuve absente", evidenceReady ? "Disponible" : "Requise"],
              ["REVIEW", humanReview?.summary || aiReview?.summary || "Décision absente", humanApproved ? "Humain" : aiPassed ? "AI seulement" : "Requise"],
              ["VALIDATION", humanApproved ? "Décision enregistrée" : "Autorité attendue", sourceSecured ? "Source prête" : "Source à sécuriser"],
            ].map(([stage, value, state]) => <div className={styles.lineageNode} key={stage}><span>{stage}</span><strong>{value}</strong><small>{state}</small></div>)}
          </div>

          <div className={styles.inspectionGrid}>
            <section className={styles.preview} aria-label="Prévisualisation de la version soumise">
              {lastEvidence ? <ContentMediaPreview source={{ id: lastEvidence.id, title: lastEvidence.title, url: lastEvidence.preview_url, bridgeFileId: lastEvidence.bridge_file_id, storageKey: lastEvidence.storage_key, contentType: lastEvidence.content_type, filename: lastEvidence.filename, sizeBytes: lastEvidence.size_bytes, sourceLabel: "Validation Workspace" }} mode="inspector" fit="contain"/> : <div className={styles.previewFallback}><Eye/><strong>Prévisualisation indisponible</strong><p>Aucune preuve n’est liée à cette soumission. Le dossier ne peut pas être présenté comme prêt.</p></div>}
            </section>
            <aside className={styles.inspectionRail}>
              <div className={`${styles.truthCard} ${toneClass(evidenceReady ? "success" : "danger")}`}><span><Eye/></span><div><strong>Evidence</strong><p>{evidenceReady ? `${evidence.length} preuve(s), dernière: ${lastEvidence?.title}` : "Preuve opérationnelle manquante."}</p></div></div>
              <div className={`${styles.truthCard} ${toneClass(aiReview ? "info" : "warning")}`}><span><Bot/></span><div><strong>Recommandation AI</strong><p>{aiReview?.summary || "Aucun avis AI disponible. Cette absence ne devient pas une conclusion humaine."}</p></div></div>
              <div className={`${styles.truthCard} ${toneClass(humanReview ? "success" : "warning")}`}><span><UserCheck/></span><div><strong>Autorité humaine</strong><p>{humanReview?.summary || `${dossier.reviewer_name || "Validateur non affecté"}. Une décision humaine reste requise.`}</p></div></div>
              <div className={`${styles.truthCard} ${toneClass(sourceSecured ? "success" : "warning")}`}><span><Fingerprint/></span><div><strong>Source Authority</strong><p>{sourceSecured ? "La source canonique est signalée comme sécurisée." : "La décision peut ouvrir le Source Gate, mais ne remplace jamais la sécurisation canonique."}</p></div></div>
            </aside>
          </div>
        </> : <Empty title="Aucun dossier sélectionné" detail="La chambre attend une soumission issue du cycle Review."/>}
      </article>
    </section>

    {dossier ? <>
      <section className={styles.section}>
        <SectionTitle eyebrow="INSTITUTIONAL CONTROL MATRIX" title="Contrôles formels et readiness" description="Aucun score décoratif: chaque contrôle expose son fondement observable et son manque réel." action={{ href: `/market-os/content-command-center/dossiers/${dossier.id}`, label: "Ouvrir Dossier 360" }}/>
        <div className={styles.controlMatrix}>{gates.map((gate) => { const gateToneValue = gateTone(gate); return <article key={gate.label} className={`${styles.controlCard} ${toneClass(gateToneValue)}`}><span>{gate.ok ? <CheckCircle2/> : <FileWarning/>}</span><div><strong>{gate.label}</strong><p>{gate.detail}</p></div><Pill tone={gateToneValue}>{gate.ok ? "PASS" : gate.critical ? "BLOQUANT" : "REQUIS"}</Pill></article>})}</div>
      </section>

      <section className={styles.authorityGrid}>
        <article className={`${styles.authorityCard} ${toneClass(aiReview ? "info" : "neutral")}`}><header><span><Sparkles/></span><div><h3>AI Recommendation</h3><small>AVIS NON DÉCISIONNEL</small></div></header><Pill tone={aiReview ? (aiPassed ? "success" : "warning") : "neutral"}>{aiReview ? statusLabel(aiReview.result) : "NON DISPONIBLE"}</Pill><p>{aiReview?.summary || "Aucune recommandation automatisée persistée. Aucun texte simulé n’est présenté comme analyse live."}</p></article>
        <article className={`${styles.authorityCard} ${toneClass(humanReview ? "success" : "warning")}`}><header><span><Gavel/></span><div><h3>Human Authority Conclusion</h3><small>{dossier.reviewer_name || "AUTORITÉ NON AFFECTÉE"}</small></div></header><Pill tone={humanReview ? (humanApproved ? "success" : "warning") : "warning"}>{humanReview ? statusLabel(humanReview.result) : "DÉCISION REQUISE"}</Pill><p>{humanReview?.summary || "La conclusion humaine demeure l’autorité institutionnelle finale pour la version sélectionnée."}</p></article>
      </section>

      <section className={styles.section}>
        <SectionTitle eyebrow="DECISION CHAMBER" title="Décision, conditions et certificat" description="La décision persistée conserve la version, l’autorité, le motif et le prochain gate."/>
        <div className={styles.decisionGrid}>
          <div className={styles.decisionActions}>
            <button type="button" className={styles.primary} disabled={!preDecisionReady || busy} onClick={() => { setDecision("approved"); setDecisionOpen(true) }}><FileCheck2/> Approuver la version</button>
            <button type="button" className={styles.secondary} disabled={!dossier || busy} onClick={() => { setDecision("revision"); setDecisionOpen(true) }}><RotateCcw/> Demander correction</button>
            <button type="button" className={styles.danger} disabled={!dossier || busy} onClick={() => { setDecision("blocked"); setDecisionOpen(true) }}><AlertTriangle/> Bloquer / escalader</button>
            <Link className={styles.quiet} href="/market-os/content-command-center/distribution"><ArrowRight/> Distribution Tower</Link>
          </div>
          <aside className={styles.certificate}><span>DECISION CERTIFICATE</span><h3>{humanReview ? "Décision institutionnelle enregistrée" : "Certificat non disponible"}</h3><Pill tone={humanReview ? (humanApproved ? "success" : "warning") : "neutral"}>{humanReview ? statusLabel(humanReview.result) : "EN ATTENTE"}</Pill><dl><div><dt>Dossier</dt><dd>{dossier.content_code}</dd></div><div><dt>Version</dt><dd>{lastEvidence?.filename || lastEvidence?.title || "Non exposée"}</dd></div><div><dt>Autorité</dt><dd>{dossier.reviewer_name || "Non affectée"}</dd></div><div><dt>Source</dt><dd>{sourceSecured ? "Sécurisée" : "Gate ouvert"}</dd></div></dl></aside>
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle eyebrow="VALIDATION TIMELINE" title="Historique observable" description="Les événements affichés proviennent des preuves et reviews persistées disponibles dans le snapshot."/>
        <div className={styles.timeline}>{timeline.map((item) => <article className={styles.timelineItem} key={item.id}><span>{item.icon}</span><div><strong>{item.label}</strong><p>{item.detail}</p></div><time>{item.at ? formatDate(item.at, true) : "Date non exposée"}</time></article>)}{!timeline.length ? <Empty title="Aucun événement observable" detail="Aucune preuve ou review persistée n’est exposée pour ce dossier."/> : null}</div>
      </section>
    </> : null}

    <Modal open={decisionOpen} eyebrow="HUMAN AUTHORITY" title={decision === "approved" ? "Approuver la version contrôlée" : decision === "revision" ? "Formaliser la correction" : "Bloquer ou escalader la soumission"} onClose={() => setDecisionOpen(false)} footer={<><button type="button" className={styles.secondary} onClick={() => setDecisionOpen(false)}>Annuler</button><button type="button" className={decision === "blocked" ? styles.danger : styles.primary} disabled={busy || !summary.trim()} onClick={() => void submitDecision()}>{decision === "approved" ? <FileCheck2/> : decision === "revision" ? <RotateCcw/> : <AlertTriangle/>} Confirmer</button></>}>
      <div className={styles.formGrid}>
        <Field label="Décision"><select value={decision} onChange={(event) => setDecision(event.target.value as Decision)}><option value="approved">Approuver et ouvrir le Source Gate</option><option value="revision">Correction / nouvelle version requise</option><option value="blocked">Bloquer pour autorité supérieure</option></select></Field>
        <Field label="Autorité"><input value={dossier?.reviewer_name || "Content Command Authority"} readOnly/></Field>
        <Field label="Conclusion motivée" wide><textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Fondement, version, risques acceptés ou rejetés, prochain gate."/></Field>
        <Field label="Conditions ou corrections — une par ligne" wide><textarea rows={7} value={corrections} onChange={(event) => setCorrections(event.target.value)} placeholder="Condition 1\nCorrection 2"/></Field>
      </div>
    </Modal>
  </main>
}
