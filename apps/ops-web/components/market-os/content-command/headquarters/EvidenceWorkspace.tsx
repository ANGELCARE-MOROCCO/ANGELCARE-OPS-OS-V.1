"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  FileImage,
  FileSearch,
  ImagePlus,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
  ZoomIn,
} from "lucide-react"
import { PageStatus } from "./primitives"
import { formatDate, statusLabel, tone, useHeadquartersSnapshot } from "./client"
import {
  CommandHero,
  EmptyOperational,
  MetricCard,
  ProductionCanvas,
  ProgressBar,
  SectionHeading,
  StatusPill,
  TruthNotice,
  styles,
} from "../production/production-ui"

const rubric = [
  ["Brief", "Alignement avec l’objectif et la sortie autorisée"],
  ["Périmètre", "Respect du scope et des interdits"],
  ["Marque", "Logo, ton et règles actives"],
  ["Message", "Clarté, exactitude et CTA"],
  ["Technique", "Format, lisibilité et accessibilité"],
  ["Source", "Provenance et relation au dossier"],
] as const

export default function EvidenceWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [busy, setBusy] = React.useState("")
  const [note, setNote] = React.useState("")
  const [progress, setProgress] = React.useState(50)
  const [selectedId, setSelectedId] = React.useState("")
  const pending = snapshot?.evidence.filter((item) => item.status === "submitted") ?? []
  const reviewedIds = new Set(snapshot?.reviews.map((item) => item.evidence_id).filter(Boolean) ?? [])
  const selected = pending.find((item) => item.id === selectedId) ?? pending[0]
  const selectedDossier = selected ? snapshot?.dossiers.find((item) => item.id === selected.dossier_id) : undefined
  const selectedReview = selected ? snapshot?.reviews.find((item) => item.evidence_id === selected.id) : undefined
  const activeDossiers = snapshot?.dossiers.filter((item) => ["in_creation", "checkpoint_review", "draft_submitted", "revision"].includes(item.status)) ?? []

  React.useEffect(() => {
    if (!selectedId && pending[0]?.id) setSelectedId(pending[0].id)
  }, [pending, selectedId])

  async function upload(dossierId: string, file: File) {
    setBusy(dossierId)
    try {
      const body = new FormData()
      body.set("dossierId", dossierId)
      body.set("title", `Checkpoint ${progress}%`)
      body.set("note", note)
      body.set("progressPercent", String(progress))
      body.set("file", file)
      const response = await fetch("/api/market-os/content-command-headquarters/source-upload?mode=evidence", { method: "POST", body, credentials: "include" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) throw new Error(payload.error || "UPLOAD_FAILED")
      setNote("")
      await refresh()
    } finally {
      setBusy("")
    }
  }

  async function analyze(evidenceId: string) {
    setBusy(evidenceId)
    try {
      const response = await fetch("/api/market-os/content-command-headquarters/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "analyze_evidence", payload: { evidenceId } }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.ok) throw new Error(body.error || "AI_REVIEW_FAILED")
      await refresh()
    } finally {
      setBusy("")
    }
  }

  return <ProductionCanvas>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh} />
    <CommandHero
      eyebrow="EVIDENCE LAB · PROOF INSPECTION"
      title="Une preuve inspectable, une provenance visible, une décision humaine distincte."
      description="Evidence Lab relie le checkpoint, le dossier, le fichier, l’analyse AI et la conclusion de review sans confondre l’un avec l’autre."
      icon={ScanSearch}
      tone="navy"
      metrics={[
        { label: "À inspecter", value: pending.filter((item) => !reviewedIds.has(item.id)).length, detail: "Preuves soumises sans review liée" },
        { label: "Analysées", value: pending.filter((item) => reviewedIds.has(item.id)).length, detail: "Une review existe dans le snapshot" },
        { label: "Dossiers éligibles", value: activeDossiers.length, detail: "Création, checkpoint, soumission ou correction" },
      ]}
      actions={<>
        <Link className={styles.primaryAction} href="/market-os/content-command-center/review"><UserCheck /> Review Workspace</Link>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/directory"><FileSearch /> Content Atlas</Link>
      </>}
    />

    <section className={styles.metricGrid}>
      <MetricCard icon={UploadCloud} label="Preuves soumises" value={pending.length} detail="Statut submitted dans le snapshot" tone="info" />
      <MetricCard icon={Bot} label="Sans analyse liée" value={pending.filter((item) => !reviewedIds.has(item.id)).length} detail="AI review non encore enregistrée" tone="warning" />
      <MetricCard icon={UserCheck} label="Conclusion humaine" value="Review dédiée" detail="Jamais remplacée par l’AI" tone="violet" />
      <MetricCard icon={ShieldCheck} label="Validation formelle" value="Hors MZ5" detail="Destination distincte après review" tone="neutral" />
    </section>

    <section className={styles.workbenchGrid} style={{ marginTop: 18 }}>
      <article className={styles.commandPanel}>
        <SectionHeading eyebrow="EVIDENCE INTAKE" title="Soumettre une preuve de checkpoint" description="Les fichiers utilisent l’upload Headquarters existant. Une soumission reste une preuve à inspecter, pas une acceptation." />
        <div className={styles.formGrid}>
          <label className={styles.wide}>Note de progression<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Travail terminé, limites, décisions attendues…" /></label>
          <label className={styles.wide}>Progression déclarée<input type="range" min="5" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))} /><strong>{progress}%</strong></label>
        </div>
        <div className={styles.queueList} style={{ marginTop: 15 }}>
          {activeDossiers.map((dossier) => <label key={dossier.id} className={styles.queueItem}>
            <strong>{dossier.content_code} · {dossier.title}</strong>
            <span>{dossier.owner_name || "Responsable à affecter"} · {statusLabel(dossier.status)}</span>
            <input type="file" accept="image/*,.pdf,video/*" disabled={busy === dossier.id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(dossier.id, file) }} />
          </label>)}
          {!activeDossiers.length ? <EmptyOperational title="Aucun dossier disponible pour un checkpoint" detail="Les dossiers en création, review de checkpoint, soumission ou correction apparaîtront ici." /> : null}
        </div>
      </article>

      <aside className={styles.inspectorPanel}>
        <h3>Preuve ≠ source canonique</h3>
        <p>Une capture, un PDF ou un export permet l’inspection d’un état de travail. L’original éditable et sa version canonique restent sous Source Vault.</p>
        <dl>
          <div><dt>Evidence</dt><dd>Objet soumis à inspection</dd></div>
          <div><dt>AI review</dt><dd>Interprétation assistée, non autorité</dd></div>
          <div><dt>Human review</dt><dd>Décision opérationnelle</dd></div>
          <div><dt>Validation</dt><dd>Gate institutionnel distinct</dd></div>
        </dl>
        <TruthNotice title="Provenance" detail="Quand le snapshot ne fournit pas une relation de source ou de version, l’interface affiche cette limite plutôt qu’une provenance fictive." tone="warning" />
      </aside>
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="INSPECTION QUEUE" title="Théâtre de contrôle" description="La file, le viewer, la version, le rubric et les conclusions sont réunis sans effacer l’historique." />
      {pending.length ? <div className={styles.queueLayout}>
        <div className={styles.queueList} role="listbox" aria-label="Preuves soumises">
          {pending.map((evidence) => {
            const dossier = snapshot?.dossiers.find((item) => item.id === evidence.dossier_id)
            const review = snapshot?.reviews.find((item) => item.evidence_id === evidence.id)
            return <button key={evidence.id} className={styles.queueItem} aria-current={selected?.id === evidence.id} onClick={() => setSelectedId(evidence.id)}>
              <strong>{evidence.title}</strong>
              <span>{dossier?.content_code ?? "Dossier non résolu"} · {formatDate(evidence.created_at, true)}</span>
              <span>{review ? `Review: ${statusLabel(review.result)}` : "Analyse non liée"}</span>
            </button>
          })}
        </div>

        {selected ? <article className={styles.inspectionCanvas}>
          <div className={styles.inspectionHeader}><div><StatusPill tone="info">{selected.evidence_type || "Evidence"}</StatusPill><h3>{selected.title}</h3><p>{selectedDossier?.content_code} · {selectedDossier?.title}</p></div><StatusPill tone={selectedReview ? tone(selectedReview.result) as "success" | "warning" | "danger" | "neutral" : "warning"}>{selectedReview ? statusLabel(selectedReview.result) : "À analyser"}</StatusPill></div>
          <div className={styles.inspectionPreview}>
            {selected.content_type?.startsWith("image/") && selected.preview_url ? <img src={selected.preview_url} alt={`Preuve ${selected.title}`} /> : <FileImage />}
          </div>
          <div className={styles.assetMeta}>
            <div><span>Fichier</span><strong>{selected.filename || "Non renseigné"}</strong></div>
            <div><span>Soumis</span><strong>{formatDate(selected.created_at, true)}</strong></div>
            <div><span>Progression</span><strong>{selected.progress_percent || 0}%</strong></div>
            <div><span>Provenance</span><strong>{selectedDossier ? "Dossier résolu" : "Relation incomplète"}</strong></div>
          </div>
          <ProgressBar value={selected.progress_percent || 0} label="Progression déclarée" />
          <p>{selected.note || "Aucune note de progression enregistrée."}</p>

          <SectionHeading eyebrow="REVIEW RUBRIC" title="Critères explicites" description="Les critères sont des états d’inspection. Aucun score numérique n’est inventé par MZ5." />
          <div className={styles.rubricGrid}>{rubric.map(([label, detail]) => <div key={label}><strong>{label}</strong><span>{detail}</span></div>)}</div>

          <div className={styles.compareGrid} style={{ marginTop: 16 }}>
            <div className={styles.comparePane}><StatusPill>Version précédente</StatusPill><div><ArrowLeftRight /><span>Non disponible dans le snapshot</span></div></div>
            <span className={styles.compareArrow}><ArrowLeftRight /></span>
            <div className={styles.comparePane}><StatusPill tone="info">Version inspectée</StatusPill><div><ZoomIn /><span>{selected.filename || selected.title}</span></div></div>
          </div>

          <div className={styles.section} style={{ boxShadow: "none" }}>
            <SectionHeading eyebrow="AI INTERPRETATION" title="Analyse assistée" description="L’analyse existante peut produire une review liée. Elle reste distincte de la décision humaine." />
            {selectedReview ? <div className={styles.truthNotice}><Bot /><div><strong>{selectedReview.score}/100 · {statusLabel(selectedReview.result)}</strong><p>{selectedReview.summary}</p></div></div> : <button className={styles.quietAction} disabled={busy === selected.id} onClick={() => void analyze(selected.id)}><Sparkles /> Analyser avec AI Director</button>}
          </div>

          <div className={styles.section} style={{ boxShadow: "none" }}>
            <SectionHeading eyebrow="HUMAN CONCLUSION" title="Autorité de review" description="Evidence Lab prépare le contexte; la décision opérationnelle se prend dans Review Workspace." />
            <TruthNotice title="Aucune décision humaine simulée ici" detail="Ouvrez Review Workspace pour accepter, demander correction ou rejeter le record persistant associé." tone="info" />
          </div>

          <div className={styles.decisionBar}>
            <Link className={styles.primaryAction} href="/market-os/content-command-center/review"><UserCheck /> Ouvrir Review Workspace</Link>
            {selectedDossier ? <Link className={styles.quietAction} href={`/market-os/content-command-center/dossiers/${selectedDossier.id}`}>Dossier 360 <ArrowRight /></Link> : null}
            <Link className={styles.quietAction} href="/market-os/content-command-center/source-vault">Source Vault <ArrowRight /></Link>
          </div>
        </article> : null}
      </div> : <EmptyOperational title="Aucune preuve en attente" detail="La file est prête. Les soumissions de checkpoint apparaîtront ici depuis le snapshot Headquarters." />}
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="PROOF CHAIN" title="La qualité devient une chaîne traçable" description="Chaque étape possède un rôle différent et ne doit jamais être confondue avec la suivante." />
      <div className={styles.workflowRail}>{[
        ["Submit", "Fichier et note de checkpoint"],
        ["Inspect", "Viewer, métadonnées et rubric"],
        ["AI interpret", "Assistance, score existant si fourni"],
        ["Human review", "Décision opérationnelle"],
        ["Correction", "Nouvelle version et findings"],
        ["Ready", "Conditions de Validation satisfaites"],
        ["Validation", "Gate formel hors MZ5"],
      ].map(([label, detail]) => <div key={label}><strong>{label}</strong><small>{detail}</small></div>)}</div>
    </section>
  </ProductionCanvas>
}
