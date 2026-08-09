"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileWarning,
  MessageSquareWarning,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react"
import {
  statusLabel,
  useContentStore,
  type ContentItem,
} from "./content-command-system"
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
} from "./production/production-ui"
import {
  formatProductionDate,
  getReviewReadiness,
  productionStatusTone,
} from "./production/production-model"

type QueueMode = "all" | "first" | "revision" | "overdue" | "ready"

function waitingDays(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return null
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
}

export default function ContentReviewPage() {
  const { store, commit } = useContentStore()
  const queue = store.items.filter((item) => ["review", "revision", "draft"].includes(item.status))
  const [selectedId, setSelectedId] = React.useState(queue[0]?.id ?? "")
  const [mode, setMode] = React.useState<QueueMode>("all")
  const [query, setQuery] = React.useState("")
  const [correctionNote, setCorrectionNote] = React.useState("")
  const selected = queue.find((item) => item.id === selectedId) ?? queue[0]
  const selectedReadiness = selected ? getReviewReadiness(selected, store.assets, store.rules) : null

  React.useEffect(() => {
    if (!selectedId && queue[0]?.id) setSelectedId(queue[0].id)
    if (selectedId && !queue.some((item) => item.id === selectedId)) setSelectedId(queue[0]?.id ?? "")
  }, [queue, selectedId])

  const visibleQueue = queue.filter((item) => {
    const readiness = getReviewReadiness(item, store.assets, store.rules)
    const overdue = Boolean(item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10))
    const modeMatch = mode === "all"
      || (mode === "first" && item.status === "review")
      || (mode === "revision" && item.status === "revision")
      || (mode === "overdue" && overdue)
      || (mode === "ready" && readiness.ready)
    const haystack = `${item.title} ${item.owner} ${item.reviewer} ${item.channel} ${item.campaign}`.toLowerCase()
    return modeMatch && haystack.includes(query.toLowerCase())
  })

  const readyCount = queue.filter((item) => getReviewReadiness(item, store.assets, store.rules).ready).length
  const overdueCount = queue.filter((item) => item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10)).length
  const missingEvidence = queue.filter((item) => !store.assets.some((asset) => asset.linkedContentId === item.id && asset.status === "approved")).length

  function decide(item: ContentItem, status: ContentItem["status"], action: string, detail: string) {
    commit((draft) => {
      draft.items = draft.items.map((candidate) => candidate.id === item.id ? {
        ...candidate,
        status,
        notes: correctionNote.trim() ? `${candidate.notes ? `${candidate.notes}\n` : ""}Review: ${correctionNote.trim()}` : candidate.notes,
        updatedAt: new Date().toISOString(),
      } : candidate)
    }, action, detail)
    setCorrectionNote("")
  }

  return <ProductionCanvas>
    <CommandHero
      eyebrow="REVIEW WORKSPACE · OPERATIONAL QUALITY GATE"
      title="Inspecter, corriger et accepter sans effacer l’historique."
      description="Review Workspace rassemble le dossier, le contenu, les assets, les règles et les critères déterministes. L’acceptation de review prépare la Validation; elle ne la remplace pas."
      icon={UserCheck}
      tone="amber"
      metrics={[
        { label: "File active", value: queue.length, detail: "Draft, review et revision dans le store existant" },
        { label: "Prêts selon critères", value: readyCount, detail: "Six conditions observables satisfaites" },
        { label: "En retard", value: overdueCount, detail: "Échéance antérieure à aujourd’hui" },
      ]}
      actions={<>
        <Link className={styles.primaryAction} href="/market-os/content-command-center/evidence"><FileCheck2 /> Evidence Lab</Link>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/validation"><ShieldCheck /> Validation Chamber</Link>
        <Link className={styles.secondaryAction} href="/market-os/content-command-center/create">Nouvelle production <ArrowRight /></Link>
      </>}
    />

    <section className={styles.metricGrid}>
      <MetricCard icon={Users} label="Assignés à une review" value={queue.filter((item) => item.reviewer.trim()).length} detail="Reviewer renseigné" tone="info" />
      <MetricCard icon={RefreshCcw} label="Corrections" value={queue.filter((item) => item.status === "revision").length} detail="Records retournés pour correction" tone="warning" />
      <MetricCard icon={FileWarning} label="Preuve approuvée absente" value={missingEvidence} detail="Aucun asset approuvé lié" tone={missingEvidence ? "danger" : "success"} />
      <MetricCard icon={Clock3} label="SLA" value="Non configuré" detail="Le temps observé n’est pas présenté comme un SLA contractuel" tone="neutral" />
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="REVIEW COMMAND" title="File de révision et inspection" description="La file reste issue du Content Command store. Les filtres ne créent aucune décision locale supplémentaire." />
      <div className={styles.filterBar}>
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dossier, owner, reviewer, canal…" aria-label="Rechercher dans la file de review" />
        <select value={mode} onChange={(event) => setMode(event.target.value as QueueMode)} aria-label="Filtrer la file">
          <option value="all">Toute la file</option>
          <option value="first">Première review</option>
          <option value="revision">Révision</option>
          <option value="overdue">En retard</option>
          <option value="ready">Prêts selon critères</option>
        </select>
      </div>

      {visibleQueue.length ? <div className={styles.queueLayout} style={{ marginTop: 15 }}>
        <div className={styles.queueList} role="listbox" aria-label="File de review">
          {visibleQueue.map((item) => {
            const readiness = getReviewReadiness(item, store.assets, store.rules)
            const days = waitingDays(item.updatedAt)
            return <button key={item.id} className={styles.queueItem} aria-current={selected?.id === item.id} onClick={() => setSelectedId(item.id)}>
              <strong>{item.title}</strong>
              <span>{item.reviewer || "Reviewer manquant"} · {statusLabel(item.status)}</span>
              <span>{readiness.passed}/{readiness.total} critères · {days === null ? "attente inconnue" : `${days} jour(s) observé(s)`}</span>
            </button>
          })}
        </div>

        {selected && selectedReadiness ? <article className={styles.inspectionCanvas}>
          <div className={styles.inspectionHeader}>
            <div><StatusPill tone={productionStatusTone(selected.status)}>{statusLabel(selected.status)}</StatusPill><h3>{selected.title}</h3><p>{selected.channel} · {selected.campaign || "Sans campagne"} · version mise à jour {formatProductionDate(selected.updatedAt, true)}</p></div>
            <StatusPill tone={selectedReadiness.ready ? "success" : "warning"}>{selectedReadiness.passed}/{selectedReadiness.total} critères</StatusPill>
          </div>

          <div className={styles.inspectionPreview}>
            {store.assets.some((asset) => asset.linkedContentId === selected.id) ? <FileCheck2 /> : <FileWarning />}
            <span>{store.assets.filter((asset) => asset.linkedContentId === selected.id).length} asset(s) lié(s)</span>
          </div>

          <div className={styles.assetMeta}>
            <div><span>Owner</span><strong>{selected.owner || "Absent"}</strong></div>
            <div><span>Reviewer</span><strong>{selected.reviewer || "Absent"}</strong></div>
            <div><span>Échéance</span><strong>{formatProductionDate(selected.dueDate)}</strong></div>
            <div><span>Brand score</span><strong>{selected.brandScore}%</strong></div>
          </div>
          <ProgressBar value={selectedReadiness.percent} label="Readiness déterministe" />

          <section className={styles.section} style={{ boxShadow: "none" }}>
            <SectionHeading eyebrow="REVIEW CONTEXT" title="Brief, sortie et règles" description="Le reviewer inspecte le contexte sans quitter la page." />
            <div className={styles.cardGrid}>
              <article className={styles.reviewCard}><header><StatusPill tone="info">Objectif</StatusPill></header><h3>{selected.objective || "Objectif manquant"}</h3><p>{selected.audience || "Audience non renseignée"}</p></article>
              <article className={styles.reviewCard}><header><StatusPill tone="violet">Message / sortie</StatusPill></header><h3>{selected.angle || "Angle non renseigné"}</h3><p>{selected.body || "Aucun contenu ou résultat inspectable."}</p></article>
              <article className={styles.reviewCard}><header><StatusPill tone="warning">Gouvernance</StatusPill></header><h3>{store.rules.filter((rule) => rule.required && rule.active).length} règle(s) obligatoire(s)</h3><p>{selected.notes || "Aucune note ou restriction enregistrée."}</p></article>
            </div>
          </section>

          <section className={styles.section} style={{ boxShadow: "none" }}>
            <SectionHeading eyebrow="REVIEW CRITERIA" title="Critères et écarts" description="Un critère est Meets requirement ou Does not meet requirement; aucun score AI fictif n’est ajouté." />
            <div className={styles.criteriaList}>{selectedReadiness.criteria.map((criterion) => <div className={styles.criterion} key={criterion.key}><span>{criterion.pass ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}</span><div><strong>{criterion.label}</strong><p>{criterion.detail}</p></div><StatusPill tone={criterion.pass ? "success" : "danger"}>{criterion.pass ? "Conforme" : "Écart"}</StatusPill></div>)}</div>
          </section>

          <section className={styles.section} style={{ boxShadow: "none" }}>
            <SectionHeading eyebrow="FINDINGS & CORRECTIONS" title="Instruction de correction" description="La note est persistée dans le champ notes existant avec la décision, sans créer un faux système de findings backend." />
            <textarea className={styles.reviewNote} style={{ width: "100%", minHeight: 100 }} value={correctionNote} onChange={(event) => setCorrectionNote(event.target.value)} placeholder="Constat, correction requise, condition ou motif de décision…" />
          </section>

          <TruthNotice title="AI vs human authority" detail="Cette file ne présente aucune recommandation AI comme décision humaine. L’analyse AI, lorsqu’elle existe, reste visible dans Evidence Lab." tone="info" />

          <div className={styles.decisionBar}>
            <button className={styles.primaryAction} disabled={!selectedReadiness.ready} onClick={() => decide(selected, "approved", "review accept", `Accepted ${selected.title} for validation readiness`)}><CheckCircle2 /> Accepter pour Validation</button>
            <button className={styles.quietAction} onClick={() => decide(selected, "revision", "review correction", `Requested correction for ${selected.title}`)}><MessageSquareWarning /> Demander correction</button>
            <button className={styles.dangerAction} onClick={() => decide(selected, "draft", "review reject", `Rejected ${selected.title} to draft`)}><XCircle /> Rejeter vers brouillon</button>
            <Link className={styles.quietAction} href={`/market-os/content-command-center/${selected.id}`}>Dossier <ArrowRight /></Link>
          </div>
          {!selectedReadiness.ready ? <TruthNotice title="Validation readiness bloquée" detail="Tous les critères observables doivent être satisfaits avant que l’action Accepter pour Validation soit disponible." tone="warning" /> : null}
        </article> : null}
      </div> : <EmptyOperational title="Aucun élément dans cette vue" detail="La file est vide pour le filtre actuel. Les contenus en draft, review ou revision apparaissent depuis le store existant." action="Créer un contenu" href="/market-os/content-command-center/create" />}
    </section>

    <section className={styles.section}>
      <SectionHeading eyebrow="CORRECTION LOOP" title="Une correction crée une nouvelle décision, jamais un effacement" description="Le store actuel conserve les changements d’état et les logs. Les versions complètes restent une limite explicite lorsque le modèle ne les persiste pas." />
      <div className={styles.workflowRail}>{[
        ["Submit", "Contenu placé en review"],
        ["Inspect", "Contexte, assets et critères"],
        ["Finding", "Écart et note de correction"],
        ["Revision", "Retour au responsable"],
        ["Resubmit", "Nouvelle mise à jour du record"],
        ["Accept", "Review opérationnelle"],
        ["Validate", "Gate institutionnel distinct"],
      ].map(([label, detail]) => <div key={label}><strong>{label}</strong><small>{detail}</small></div>)}</div>
    </section>
  </ProductionCanvas>
}
