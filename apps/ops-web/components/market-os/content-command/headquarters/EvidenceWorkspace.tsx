"use client"

import * as React from "react"
import { AlertTriangle, Bot, CheckCircle2, Eye, FileImage, ImagePlus, ScanSearch, Sparkles, UploadCloud } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge, Empty, PageStatus, Progress, SectionHeader } from "./primitives"
import { formatDate, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import styles from "./content-command-headquarters.module.css"

export default function EvidenceWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [busy, setBusy] = React.useState("")
  const [note, setNote] = React.useState("")
  const [progress, setProgress] = React.useState(50)
  const pending = snapshot?.evidence.filter((item) => item.status === "submitted") || []
  const reviewedIds = new Set(snapshot?.reviews.map((item) => item.evidence_id).filter(Boolean) || [])

  async function upload(dossierId: string, file: File) {
    setBusy(dossierId)
    try {
      const body = new FormData(); body.set("dossierId", dossierId); body.set("title", `Checkpoint ${progress}%`); body.set("note", note); body.set("progressPercent", String(progress)); body.set("file", file)
      const response = await fetch("/api/market-os/content-command-headquarters/source-upload?mode=evidence", { method:"POST", body, credentials:"include" })
      const payload = await response.json().catch(()=>({})); if(!response.ok || !payload.ok) throw new Error(payload.error || "UPLOAD_FAILED"); await refresh()
    } finally { setBusy("") }
  }

  async function analyze(evidenceId: string) {
    setBusy(evidenceId)
    try { const response=await fetch("/api/market-os/content-command-headquarters/actions",{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({action:"analyze_evidence",payload:{evidenceId}})}); const body=await response.json().catch(()=>({})); if(!response.ok||!body.ok) throw new Error(body.error||"AI_REVIEW_FAILED"); await refresh() } finally { setBusy("") }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.evidenceHero}><div><span className={styles.eyebrow}><ScanSearch/> CREATIVE EVIDENCE LAB</span><h1>Le travail externe reste gouverné par des preuves, des checkpoints et des corrections précises.</h1><p>Canva, Figma, Adobe ou vidéo: l’utilisateur rapporte l’avancement; l’AI Director analyse le scope, la marque, le design et le message.</p></div><aside><Bot/><strong>{pending.filter((item)=>!reviewedIds.has(item.id)).length}</strong><span>preuves à analyser</span></aside></section>

    <section className={styles.evidenceLabGrid}>
      <article className={styles.evidenceSubmissionDeck}><SectionHeader eyebrow="REPORT PROGRESS" title="Soumettre une preuve de checkpoint" description="Sélectionnez le dossier puis chargez screenshot, PDF proof, vidéo preview ou export."/>
        <div className={styles.progressInputs}><label>Progression <input type="range" min="5" max="100" value={progress} onChange={(e)=>setProgress(Number(e.target.value))}/><strong>{progress}%</strong></label><textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Ce qui est terminé, ce qui reste, question ou limitation…"/></div>
        <div className={styles.dossierDropList}>{snapshot?.dossiers.filter((item)=>["in_creation","checkpoint_review","draft_submitted","revision"].includes(item.status)).map((dossier)=><label key={dossier.id} className={styles.evidenceDrop}><div><span>{dossier.content_code}</span><strong>{dossier.title}</strong><small>{dossier.owner_name || "Owner à affecter"} · {statusLabel(dossier.status)}</small></div><input type="file" accept="image/*,.pdf,video/*" disabled={busy===dossier.id} onChange={(e)=>{ const file=e.target.files?.[0]; if(file) void upload(dossier.id,file) }}/><b><UploadCloud/> Charger une preuve</b></label>)}{!snapshot?.dossiers.some((item)=>["in_creation","checkpoint_review","draft_submitted","revision"].includes(item.status))?<Empty title="Aucun dossier en checkpoint" detail="Les dossiers actifs apparaîtront ici avec le checkpoint courant."/>:null}</div>
      </article>

      <article className={styles.reviewTheatre}><SectionHeader eyebrow="AI VISUAL REVIEW" title="Théâtre de contrôle" description="Une preuve, son dossier, le rubric et le résultat sur le même plan de travail."/>
        <div className={styles.evidenceQueue}>{pending.map((evidence)=>{ const dossier=snapshot?.dossiers.find((item)=>item.id===evidence.dossier_id); const review=snapshot?.reviews.find((item)=>item.evidence_id===evidence.id); return <div key={evidence.id} className={styles.evidenceCase}>
          <div className={styles.evidencePreview}>{evidence.content_type?.startsWith("image/")&&evidence.preview_url?<img src={evidence.preview_url} alt="Preuve"/>:<FileImage/>}<span>{evidence.filename || evidence.evidence_type}</span></div>
          <div className={styles.evidenceCaseBody}><small>{dossier?.content_code} · {formatDate(evidence.created_at,true)}</small><h3>{evidence.title}</h3><p>{evidence.note || "Aucune note de progression."}</p><Progress value={evidence.progress_percent}/>{review?<div className={styles.reviewResult}><Badge tone={tone(review.result)}>{statusLabel(review.result)}</Badge><strong>{review.score}/100</strong><p>{review.summary}</p></div>:<button disabled={busy===evidence.id} onClick={()=>void analyze(evidence.id)}><Sparkles/> Analyser avec AI Director</button>}</div>
        </div>})}{!pending.length?<Empty title="Aucune preuve en attente" detail="La file est prête pour les checkpoints soumis par les équipes."/>:null}</div>
      </article>
    </section>

    <section className={styles.qualityRubric}><SectionHeader eyebrow="RUBRIC ANGELCARE" title="La qualité n’est pas une impression" description="Les contrôles sont explicites, contextualisés et traçables."/><div>{([
      { label: "Scope", Icon: Eye },
      { label: "Logo & marque", Icon: CheckCircle2 },
      { label: "Contraste", Icon: ScanSearch },
      { label: "Message", Icon: Bot },
      { label: "CTA", Icon: Sparkles },
      { label: "Dignité & privacy", Icon: AlertTriangle },
      { label: "Format", Icon: FileImage },
      { label: "Preuve finale", Icon: ImagePlus },
    ] satisfies Array<{ label: string; Icon: LucideIcon }>).map(({ label, Icon })=><span key={label}><Icon/><strong>{label}</strong><small>Contrôle obligatoire selon la famille.</small></span>)}</div></section>
  </main>
}
