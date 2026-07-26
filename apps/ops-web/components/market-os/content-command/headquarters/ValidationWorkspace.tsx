"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Bot, CheckCheck, Eye, FileCheck2, RotateCcw, Scale, ShieldCheck, UserCheck } from "lucide-react"
import { Badge, Empty, Field, Modal, PageStatus, SectionHeader } from "./primitives"
import { headquartersAction, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import styles from "./content-command-headquarters.module.css"

type Decision = "approved" | "revision" | "blocked"

export default function ValidationWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [selected, setSelected] = React.useState("")
  const [decisionOpen, setDecisionOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [decision, setDecision] = React.useState<Decision>("approved")
  const [summary, setSummary] = React.useState("")
  const [corrections, setCorrections] = React.useState("")

  const queue = snapshot?.dossiers.filter((dossier) => ["draft_submitted", "ai_review", "human_review", "revision", "validated", "source_required"].includes(dossier.status)) || []
  const dossier = queue.find((item) => item.id === selected) || queue[0]
  const reviews = snapshot?.reviews.filter((review) => review.dossier_id === dossier?.id) || []
  const evidence = snapshot?.evidence.filter((entry) => entry.dossier_id === dossier?.id) || []
  const lastEvidence = evidence[0]
  const aiPassed = reviews.some((review) => review.review_type === "ai" && ["pass", "pass_minor", "approved"].includes(review.result))
  const humanApproved = reviews.some((review) => review.review_type === "human" && ["approved", "pass"].includes(review.result))
  const sourceSecured = dossier?.source_state === "secured"
  const preDecisionGates = [
    ["Scope completion", Boolean(dossier && dossier.progress >= 90), "Tasks, livrables et evidence de checkpoint"],
    ["AI quality review", aiPassed, "Message, design, marque, risque et format"],
    ["Autorité identifiée", Boolean(dossier?.reviewer_name), "Reviewer ou autorité de direction affectée"],
  ] as const
  const postDecisionGates = [
    ["Décision humaine", humanApproved, "Validation, révision ou blocage documenté"],
    ["Source canonique", sourceSecured, "Original éditable sécurisé dans le Windows Bridge"],
  ] as const

  async function submitDecision() {
    if (!dossier) return
    setBusy(true)
    try {
      await headquartersAction("record_human_review", {
        dossierId: dossier.id,
        evidenceId: lastEvidence?.id || "",
        result: decision,
        score: decision === "approved" ? 100 : decision === "revision" ? 55 : 20,
        summary: summary || (decision === "approved" ? "Dossier conforme. Source originale désormais exigée." : "Décision de validation documentée."),
        corrections: corrections.split("\n").map((text) => text.trim()).filter(Boolean).map((text, index) => ({ code: `COR-${index + 1}`, instruction: text })),
        authorityRole: "Content Command Authority",
      })
      setDecisionOpen(false)
      setSummary("")
      setCorrections("")
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.validationHero}>
      <div><span className={styles.eyebrow}><Scale/> VALIDATION CHAMBER</span><h1>La conformité, l’autorité et la preuve finale réunies dans une chambre de décision.</h1><p>L’AI review prépare la décision; l’autorité humaine la matérialise; le Source Vault ferme ensuite la chaîne de vérité.</p></div>
      <aside><ShieldCheck/><strong>{queue.length}</strong><span>dossiers sous contrôle</span></aside>
    </section>

    <section className={styles.validationSplit}>
      <aside className={styles.validationQueue}>
        <SectionHeader eyebrow="QUEUE" title="Dossiers à décider" description="Priorité, état, reviewer et dernier gate."/>
        {queue.map((item) => <button key={item.id} className={dossier?.id === item.id ? styles.isSelected : ""} onClick={() => setSelected(item.id)}>
          <span>{item.content_code}</span><strong>{item.title}</strong><small>{item.reviewer_name || "Reviewer non désigné"}</small><Badge tone={tone(item.status)}>{statusLabel(item.status)}</Badge>
        </button>)}
        {!queue.length ? <Empty title="Queue vide" detail="Aucun dossier ne réclame actuellement une décision."/> : null}
      </aside>

      <article className={styles.validationDesk}>
        {dossier ? <>
          <header><div><small>{dossier.content_code}</small><h2>{dossier.title}</h2><p>{dossier.service_label} · {dossier.category} · {dossier.audience}</p></div><Badge tone={tone(dossier.status)}>{statusLabel(dossier.status)}</Badge></header>
          <div className={styles.validationPreview}>
            {lastEvidence?.content_type?.startsWith("image/") && lastEvidence.preview_url ? <img src={lastEvidence.preview_url} alt="Dernière preuve"/> : <Eye/>}
            <strong>{lastEvidence ? lastEvidence.title : "Prévisualisation gouvernée"}</strong>
            <p>{lastEvidence ? `${lastEvidence.filename || lastEvidence.evidence_type} · ${lastEvidence.progress_percent}% déclaré` : "Aucune preuve disponible. Retournez au Creative Evidence Lab avant décision."}</p>
          </div>
          <div className={styles.gateGrid}>
            {[...preDecisionGates, ...postDecisionGates].map(([name, ok, detail], index) => <div key={name} className={ok ? styles.gatePassed : styles.gateBlocked}><span>{ok ? <CheckCheck/> : <AlertTriangle/>}</span><div><small>GATE 0{index + 1}</small><strong>{name}</strong><p>{detail}</p></div><Badge tone={ok ? "success" : "warning"}>{ok ? "PASS" : "REQUIS"}</Badge></div>)}
          </div>
          <div className={styles.reviewHistory}>{reviews.map((review) => <article key={review.id}><span>{review.review_type === "ai" ? <Bot/> : <UserCheck/>}</span><div><strong>{review.review_type === "ai" ? "AI Director" : "Validation humaine"}</strong><p>{review.summary}</p></div><Badge tone={tone(review.result)}>{statusLabel(review.result)}</Badge><b>{review.score}</b></article>)}</div>
          <footer>
            <Link href={`/market-os/content-command-center/dossiers/${dossier.id}`}>Ouvrir le dossier 360 <ArrowRight/></Link>
            <button type="button" disabled={!preDecisionGates[0][1] || !preDecisionGates[1][1] || busy} onClick={() => { setDecision("revision"); setDecisionOpen(true) }}><RotateCcw/> Demander révision</button>
            <button type="button" disabled={!preDecisionGates.every((gate) => gate[1]) || humanApproved || busy} onClick={() => { setDecision("approved"); setDecisionOpen(true) }}><FileCheck2/> Valider & exiger la source</button>
          </footer>
        </> : <Empty title="Dossier non sélectionné" detail="La chambre attend un dossier sous validation."/>}
      </article>
    </section>

    <Modal open={decisionOpen} title={decision === "approved" ? "Valider le dossier et ouvrir le Source Gate" : "Formaliser la demande de révision"} onClose={() => setDecisionOpen(false)} footer={<><button className={styles.modalSecondary} onClick={() => setDecisionOpen(false)}>Annuler</button><button className={styles.modalPrimary} disabled={busy || !summary.trim()} onClick={() => void submitDecision()}>{decision === "approved" ? <FileCheck2/> : <RotateCcw/>}{decision === "approved" ? "Confirmer la validation" : "Renvoyer en révision"}</button></>}>
      <div className={styles.formGrid}>
        <Field label="Décision"><select value={decision} onChange={(event) => setDecision(event.target.value as Decision)}><option value="approved">Approuver et exiger la source</option><option value="revision">Révision requise</option><option value="blocked">Bloquer pour décision supérieure</option></select></Field>
        <Field label="Autorité"><input value="Content Command Authority" readOnly/></Field>
        <Field label="Conclusion motivée" wide><textarea rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Expliquez la décision, les critères satisfaits et le prochain gate."/></Field>
        <Field label="Corrections — une par ligne" wide><textarea rows={7} value={corrections} onChange={(event) => setCorrections(event.target.value)} placeholder="Correction 1\nCorrection 2"/></Field>
      </div>
    </Modal>
  </main>
}
