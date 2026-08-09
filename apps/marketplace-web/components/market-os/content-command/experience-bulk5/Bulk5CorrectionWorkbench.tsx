"use client"

import * as React from "react"
import { AlertTriangle, ArrowRight, CheckCircle2, FileClock, GitBranch, GitCompareArrows, ListChecks, RotateCcw, UploadCloud } from "lucide-react"
import type { Bulk5Context, ProofCase } from "./bulk5-types"
import { useBulk5ProofRegistry } from "./bulk5-api"
import { Bulk5Modal, DominantAction, EmptyAuthorityState, SectionTitle, TonePill, styles } from "./Bulk5Shared"
import { bulk5ContextHref } from "./bulk5-context"

export default function Bulk5CorrectionWorkbench({ item, context }: { item?: ProofCase; context: Bulk5Context }) {
  const registry = useBulk5ProofRegistry()
  const [selectedFinding, setSelectedFinding] = React.useState(item?.findings[0]?.id || "")
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [note, setNote] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const finding = item?.findings.find((entry) => entry.id === selectedFinding) || item?.findings[0]

  React.useEffect(() => { if (item?.findings[0]?.id && !selectedFinding) setSelectedFinding(item.findings[0].id) }, [item, selectedFinding])

  async function resubmit() {
    if (!item || !file) return
    setBusy(true); setNotice("")
    try {
      await registry.uploadEvidence({ dossierId: item.id, file, title: `Version corrigée · Round ${item.reviewRound + 1}`, note: note || `Resoumission corrective pour ${finding?.code || "findings ouverts"}`, progress: 100 })
      setUploadOpen(false); setFile(null); setNote(""); setNotice("Version corrective soumise comme nouvelle preuve. Les findings restent ouverts jusqu’à vérification du reviewer.")
    } catch (error) { setNotice(error instanceof Error ? error.message : "CORRECTION_RESUBMIT_FAILED") }
    finally { setBusy(false) }
  }

  if (!item) return <EmptyAuthorityState title="Aucun dossier retourné" detail="Sélectionnez un proof case présentant une correction ou un finding ouvert."/>

  return <section className={styles.correctionWorkbench} data-bulk5-silhouette="correction-resolution">
    {notice ? <div className={styles.inlineNotice} aria-live="polite">{notice}</div> : null}
    <header className={styles.returnMandate}><div><small>REVIEW RETURN MANDATE · ROUND {item.reviewRound}</small><h2>{item.dossier.title}</h2><p>{item.latestHumanReview?.summary || "La review demande une nouvelle version ou une preuve supplémentaire."}</p></div><TonePill tone={item.findings.length ? "danger" : "warning"}>{item.findings.length ? `${item.findings.length} finding(s)` : "Retour sans finding structuré"}</TonePill></header>
    <div className={styles.correctionGrid}>
      <aside className={styles.findingResolutionMap}><SectionTitle eyebrow="FINDING RESOLUTION MAP" title="Constats à traiter" description="Un finding résolu reste historique; il ne disparaît jamais."/>{item.findings.length ? item.findings.map((entry) => <button type="button" key={entry.id} aria-current={finding?.id === entry.id ? "page" : undefined} onClick={() => setSelectedFinding(entry.id)}><span><small>{entry.code} · {entry.criterion}</small><strong>{entry.instruction}</strong></span><TonePill tone={entry.severity === "blocking" || entry.severity === "critical" ? "danger" : "warning"}>{entry.severity}</TonePill></button>) : <EmptyAuthorityState title="Aucun finding structuré" detail="La conclusion humaine existe, mais le snapshot n’expose pas de correction structurée. Le reviewer doit formaliser les corrections."/>}</aside>
      <article className={styles.beforeRequiredAfter}>
        <header><GitCompareArrows/><span><small>BEFORE / REQUIRED / AFTER</small><strong>{finding?.code || "Correction générale"}</strong></span></header>
        <div><section><small>AVANT</small><strong>{item.latestEvidence?.filename || item.latestEvidence?.title || "Version non exposée"}</strong><p>Version inspectée lors du dernier round.</p></section><section><small>REQUIS</small><strong>{finding?.instruction || item.latestHumanReview?.summary || "Correction à clarifier"}</strong><p>Fondement : {finding?.criterion || "Conclusion de review"}</p></section><section><small>APRÈS</small><strong>Nouvelle version obligatoire</strong><p>La version rejetée reste immuable; la résolution doit produire une nouvelle preuve.</p></section></div>
      </article>
      <aside className={styles.correctionDependencyGraph}><SectionTitle eyebrow="CORRECTION DEPENDENCIES" title="Impact de la correction" description="Relations réellement observables et limites clairement indiquées."/><ul><li><AlertTriangle/>Version soumise affectée</li><li><GitBranch/>Variants potentiellement affectés — relation non exposée</li><li><ListChecks/>Critère {finding?.criterion || "à déterminer"}</li><li><FileClock/>Review round {item.reviewRound + 1} requis</li></ul></aside>
    </div>
    <footer className={styles.resubmissionGate}><div><span><RotateCcw/><small>RESUBMISSION GATE</small></span><strong>Une nouvelle version, une note de résolution et une preuve.</strong><p>La resoumission n’accepte pas la correction. Elle renvoie le dossier au reviewer pour vérification.</p></div><div><button type="button" onClick={() => setUploadOpen(true)}><UploadCloud/> Joindre la version corrigée</button><DominantAction href={bulk5ContextHref("/market-os/content-command-center/review?mode=inspect", { ...context, dossierId: item.id, evidenceId: item.latestEvidence?.id, stage: "review" })}>Retourner à la review</DominantAction></div></footer>
    <Bulk5Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Soumettre la version corrective" subtitle="CORRECTIVE VERSION CONTROL" footer={<><button type="button" onClick={() => setUploadOpen(false)}>Annuler</button><button type="button" className={styles.modalPrimary} disabled={!file || busy} onClick={() => void resubmit()}><UploadCloud/> {busy ? "Envoi…" : "Resoumettre"}</button></>}><div className={styles.formGrid}><label>Finding<input value={finding?.code || "Correction générale"} readOnly/></label><label>Round<input value={`Round ${item.reviewRound + 1}`} readOnly/></label><label className={styles.wide}>Nouvelle version<input type="file" accept="image/*,.pdf,video/*" onChange={(event) => setFile(event.target.files?.[0] || null)}/></label><label className={styles.wide}>Note de résolution<textarea rows={6} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Décrivez précisément ce qui a été corrigé et quelle preuve soutient la résolution."/></label></div></Bulk5Modal>
  </section>
}
