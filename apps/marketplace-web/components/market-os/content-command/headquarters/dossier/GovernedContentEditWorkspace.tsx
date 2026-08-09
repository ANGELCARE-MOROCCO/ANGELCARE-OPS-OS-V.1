"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  FilePenLine,
  Flag,
  Layers3,
  Save,
  ShieldAlert,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react"
import {
  channels,
  priorities,
  type Channel,
  type ContentItem,
  type ContentStatus,
  type Priority,
  useContentStore,
} from "../../content-command-system"
import styles from "../mz2-executive-dossier.module.css"

const editSections = [
  { id: "identity", label: "Identité", icon: Layers3 },
  { id: "ownership", label: "Responsabilités", icon: UserRound },
  { id: "objective", label: "Objectif & message", icon: Target },
  { id: "schedule", label: "Calendrier", icon: Flag },
  { id: "governance", label: "Gouvernance", icon: ShieldCheck },
]

function equalItem(a: ContentItem, b: ContentItem) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function changedFields(original: ContentItem, draft: ContentItem) {
  const labels: Array<[keyof ContentItem, string]> = [
    ["title", "Titre"], ["type", "Type"], ["channel", "Canal"], ["campaign", "Campagne"],
    ["owner", "Responsable"], ["reviewer", "Réviseur"], ["status", "État"], ["priority", "Priorité"],
    ["dueDate", "Échéance"], ["scheduledDate", "Planification"], ["objective", "Objectif"], ["audience", "Audience"],
    ["angle", "Angle"], ["cta", "CTA"], ["body", "Contenu"], ["seoKeyword", "Mot-clé"], ["notes", "Notes"],
  ]
  return labels.filter(([key]) => JSON.stringify(original[key]) !== JSON.stringify(draft[key])).map(([, label]) => label)
}

export default function GovernedContentEditWorkspace({ id }: { id: string }) {
  const router = useRouter()
  const { store, commit } = useContentStore()
  const item = store.items.find((candidate) => candidate.id === id)
  const [draft, setDraft] = React.useState<ContentItem | null>(null)
  const [amendmentReason, setAmendmentReason] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  React.useEffect(() => {
    if (item) setDraft({ ...item, assets: [...item.assets] })
  }, [item])

  const dirty = Boolean(item && draft && !equalItem(item, draft))
  const protectedRecord = Boolean(item && ["approved", "scheduled", "published", "archived"].includes(item.status))
  const changes = item && draft ? changedFields(item, draft) : []

  React.useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [dirty])

  if (!item || !draft) return <main className={styles.governedRouteCanvas}><section className={styles.routeFailure}><AlertTriangle/><div><span>ÉDITION INDISPONIBLE</span><h1>Ce dossier n’existe pas dans le registre historique éditable.</h1><p>La route de compatibilité ne peut modifier que les enregistrements réellement présents dans le store Content Command existant.</p><Link href={`/market-os/content-command-center/${id}`}>Retour au dossier <ChevronRight/></Link></div></section></main>

  const currentItem = item
  const currentDraft = draft

  function update<K extends keyof ContentItem>(key: K, value: ContentItem[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current)
  }

  function save() {
    setSubmitted(true)
    if (!currentDraft.title.trim() || !currentDraft.owner.trim() || !currentDraft.reviewer.trim()) return
    if (protectedRecord && !amendmentReason.trim()) return
    const next: ContentItem = { ...currentDraft, updatedAt: new Date().toISOString() }
    commit((storeDraft) => {
      storeDraft.items = storeDraft.items.map((candidate) => candidate.id === id ? next : candidate)
    }, protectedRecord ? "content amendment" : "content edit", protectedRecord ? `Amendment ${currentItem.title}: ${amendmentReason.trim()}` : `Updated ${currentItem.title}: ${changes.join(", ")}`)
    router.push(`/market-os/content-command-center/${id}`)
  }

  return <main className={styles.governedRouteCanvas} data-mz2-governed-edit>
    <header className={styles.governedEditHeader}>
      <div><Link href={`/market-os/content-command-center/${id}`}><ArrowLeft/> Retour au dossier</Link><span>GOVERNED EDIT CHAMBER</span><h1>Modifier : {item.title}</h1><p>Les changements sont structurés, résumés et protégés contre une sortie accidentelle.</p></div>
      <aside><span><small>ÉTAT COURANT</small><strong>{item.status}</strong></span><span><small>CHAMPS MODIFIÉS</small><strong>{changes.length}</strong></span><button type="button" disabled={!dirty} onClick={save}><Save/> Enregistrer</button></aside>
    </header>

    {protectedRecord ? <section className={styles.amendmentWarning}><ShieldAlert/><div><strong>Enregistrement sous contrôle d’amendement</strong><p>Ce contenu est déjà {item.status}. Toute modification doit être accompagnée d’un motif conservé dans l’historique local.</p></div></section> : null}

    <div className={styles.governedEditLayout}>
      <nav className={styles.editSectionRail} aria-label="Sections du formulaire">{editSections.map((section) => { const Icon = section.icon; return <a key={section.id} href={`#edit-${section.id}`}><Icon/><span>{section.label}</span></a> })}</nav>
      <form className={styles.governedForm} onSubmit={(event) => { event.preventDefault(); save() }}>
        <section id="edit-identity" className={styles.editChamber}>
          <header><Layers3/><span><small>01</small><h2>Identité et classification</h2><p>Ce que le record est, où il s’inscrit et par quel canal il doit vivre.</p></span></header>
          <div className={styles.formGrid}>
            <label className={styles.fieldWide}><span>Titre *</span><input value={draft.title} onChange={(event) => update("title", event.target.value)} aria-invalid={submitted && !draft.title.trim()}/>{submitted && !draft.title.trim() ? <small>Titre obligatoire.</small> : null}</label>
            <label><span>Type</span><input value={draft.type} onChange={(event) => update("type", event.target.value)}/></label>
            <label><span>Canal</span><select value={draft.channel} onChange={(event) => update("channel", event.target.value as Channel)}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
            <label><span>Campagne</span><input value={draft.campaign} onChange={(event) => update("campaign", event.target.value)}/></label>
            <label><span>Priorité</span><select value={draft.priority} onChange={(event) => update("priority", event.target.value as Priority)}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
            <label><span>État</span><select value={draft.status} onChange={(event) => update("status", event.target.value as ContentStatus)}>{["idea","brief","draft","review","approved","scheduled","published","revision","archived"].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          </div>
        </section>

        <section id="edit-ownership" className={styles.editChamber}>
          <header><UserRound/><span><small>02</small><h2>Responsabilités</h2><p>Le dossier ne peut pas masquer une responsabilité manquante.</p></span></header>
          <div className={styles.formGrid}>
            <label><span>Responsable *</span><input value={draft.owner} onChange={(event) => update("owner", event.target.value)} aria-invalid={submitted && !draft.owner.trim()}/>{submitted && !draft.owner.trim() ? <small>Responsable obligatoire.</small> : null}</label>
            <label><span>Réviseur *</span><input value={draft.reviewer} onChange={(event) => update("reviewer", event.target.value)} aria-invalid={submitted && !draft.reviewer.trim()}/>{submitted && !draft.reviewer.trim() ? <small>Réviseur obligatoire.</small> : null}</label>
          </div>
        </section>

        <section id="edit-objective" className={styles.editChamber}>
          <header><Target/><span><small>03</small><h2>Objectif, audience et message</h2><p>La finalité opérationnelle est séparée du corps de contenu.</p></span></header>
          <div className={styles.formGrid}>
            <label className={styles.fieldWide}><span>Objectif</span><textarea value={draft.objective} onChange={(event) => update("objective", event.target.value)}/></label>
            <label><span>Audience</span><textarea value={draft.audience} onChange={(event) => update("audience", event.target.value)}/></label>
            <label><span>Angle éditorial</span><textarea value={draft.angle} onChange={(event) => update("angle", event.target.value)}/></label>
            <label className={styles.fieldWide}><span>Appel à l’action</span><input value={draft.cta} onChange={(event) => update("cta", event.target.value)}/></label>
            <label className={styles.fieldWide}><span>Contenu ou matière de travail</span><textarea className={styles.largeTextarea} value={draft.body} onChange={(event) => update("body", event.target.value)}/></label>
          </div>
        </section>

        <section id="edit-schedule" className={styles.editChamber}>
          <header><Flag/><span><small>04</small><h2>Calendrier et publication</h2><p>Les dates sont explicites et restent indépendantes du changement d’état.</p></span></header>
          <div className={styles.formGrid}>
            <label><span>Échéance</span><input type="date" value={draft.dueDate} onChange={(event) => update("dueDate", event.target.value)}/></label>
            <label><span>Date planifiée</span><input type="datetime-local" value={draft.scheduledDate ? draft.scheduledDate.slice(0,16) : ""} onChange={(event) => update("scheduledDate", event.target.value)}/></label>
            <label><span>Mot-clé SEO</span><input value={draft.seoKeyword} onChange={(event) => update("seoKeyword", event.target.value)}/></label>
            <label className={styles.fieldWide}><span>Notes opérationnelles</span><textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)}/></label>
          </div>
        </section>

        <section id="edit-governance" className={styles.editChamber}>
          <header><ShieldCheck/><span><small>05</small><h2>Contrôle avant enregistrement</h2><p>Le système résume les conséquences avant de modifier le registre.</p></span></header>
          {protectedRecord ? <label className={styles.fieldWide}><span>Motif d’amendement *</span><textarea value={amendmentReason} onChange={(event) => setAmendmentReason(event.target.value)} aria-invalid={submitted && !amendmentReason.trim()} placeholder="Expliquez pourquoi un contenu déjà approuvé, planifié, publié ou archivé doit changer."/>{submitted && !amendmentReason.trim() ? <small>Le motif est obligatoire pour ce niveau de gouvernance.</small> : null}</label> : null}
          <div className={styles.changeSummary}><FilePenLine/><div><small>RÉSUMÉ DES CHANGEMENTS</small>{changes.length ? <ul>{changes.map((change) => <li key={change}><Check/>{change}</li>)}</ul> : <p>Aucune modification détectée.</p>}</div></div>
          <div className={styles.formActions}><Link href={`/market-os/content-command-center/${id}`}>Annuler</Link><button type="submit" disabled={!dirty}><Save/> {protectedRecord ? "Enregistrer l’amendement" : "Enregistrer les modifications"}</button></div>
        </section>
      </form>
    </div>
  </main>
}
