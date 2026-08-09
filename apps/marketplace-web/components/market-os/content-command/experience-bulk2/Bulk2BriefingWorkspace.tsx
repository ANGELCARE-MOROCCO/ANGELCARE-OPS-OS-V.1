"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight, BookOpenCheck, CheckCircle2, CircleDot, ClipboardCheck, FileStack,
  GitBranch, MessageCircleQuestion, Plus, Save, Search, ShieldAlert, Target,
  TriangleAlert, UserRound, Waypoints,
} from "lucide-react"
import {
  channels, type Channel, type ContentBrief, statusLabel, todayISO, uid, useContentStore,
} from "../content-command-system"
import type { StrategicContext } from "./bulk2-types"
import { briefReadiness } from "./bulk2-derivations"
import { readStrategicContext, strategicHref } from "./bulk2-context"
import { Drawer, EmptyStrategicState, Notice, ReadinessGate, StrategicContextSidecar, StrategicIdentityStrip } from "./Bulk2Shared"
import styles from "./bulk2-experience.module.css"

type BriefSectionId = "origin" | "objective" | "audience" | "message" | "outputs" | "governance" | "ownership"
type EditableBriefField = "campaign" | "objective" | "audience" | "message" | "channel" | "owner"

type BriefSection = {
  id: BriefSectionId
  label: string
  purpose: string
  state: "complete" | "missing" | "clarification" | "approved"
}

function sectionsFor(brief: ContentBrief | null): BriefSection[] {
  if (!brief) return []
  return [
    { id: "origin", label: "Origine stratégique", purpose: "Campagne et autorisation qui justifient le brief.", state: brief.campaign.trim() ? "complete" : "missing" },
    { id: "objective", label: "Objectif", purpose: "Résultat business et communication attendu.", state: brief.objective.trim() ? "complete" : "missing" },
    { id: "audience", label: "Audience", purpose: "Public, besoin et contexte de réception.", state: brief.audience.trim() ? "complete" : "missing" },
    { id: "message", label: "Message central", purpose: "Proposition, preuve et perception recherchée.", state: brief.message.trim() ? "complete" : "missing" },
    { id: "outputs", label: "Sorties & canal", purpose: "Canal principal et destination de production.", state: brief.channel ? "complete" : "missing" },
    { id: "governance", label: "Brand & contraintes", purpose: "Doctrine applicable et contraintes de production.", state: "clarification" },
    { id: "ownership", label: "Ownership & délai", purpose: "Propriétaire, échéance et état de préparation.", state: brief.owner.trim() && brief.dueDate ? "complete" : "missing" },
  ]
}

function fieldFor(section: BriefSectionId): EditableBriefField | null {
  const map: Record<BriefSectionId, EditableBriefField | null> = {
    origin: "campaign", objective: "objective", audience: "audience", message: "message",
    outputs: "channel", governance: null, ownership: "owner",
  }
  return map[section]
}

export default function Bulk2BriefingWorkspace() {
  const { store, commit } = useContentStore()
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [selectedId, setSelectedId] = React.useState("")
  const [activeSection, setActiveSection] = React.useState<BriefSectionId>("origin")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [clarificationOpen, setClarificationOpen] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null)
  const [strategicContext, setStrategicContext] = React.useState<StrategicContext | null>(null)
  const [draftValue, setDraftValue] = React.useState("")
  const [clarification, setClarification] = React.useState({ question: "", owner: "", dueDate: todayISO(2) })
  const [createForm, setCreateForm] = React.useState<ContentBrief>({ id: uid("brief"), title: "", campaign: "", audience: "", objective: "", message: "", channel: "Instagram", owner: "", dueDate: todayISO(7), status: "draft" })

  React.useEffect(() => { setStrategicContext(readStrategicContext()) }, [])

  const briefs = React.useMemo(() => store.briefs.filter((brief) => {
    const haystack = `${brief.title} ${brief.campaign} ${brief.audience} ${brief.objective} ${brief.owner}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === "all" || brief.status === status)
  }), [store.briefs, query, status])
  const selected = store.briefs.find((brief) => brief.id === selectedId) || briefs[0] || null
  const sections = sectionsFor(selected)
  const checks = briefReadiness(selected)
  const selectedSection = sections.find((section) => section.id === activeSection) || sections[0]
  const selectedField = selectedSection ? fieldFor(selectedSection.id) : null
  const clarificationLogs = selected ? store.logs.filter((log) => log.detail.includes(`[brief:${selected.id}]`) && /clarification/i.test(`${log.action} ${log.detail}`)).slice(0, 8) : []
  const briefLogs = selected ? store.logs.filter((log) => log.detail.includes(selected.id) || log.detail.includes(selected.title)).slice(0, 12) : []

  React.useEffect(() => {
    if (!selected || !selectedField) { setDraftValue(""); return }
    setDraftValue(String(selected[selectedField] || ""))
  }, [selected?.id, selectedField, selected])

  const context: StrategicContext = {
    caseId: strategicContext?.caseId || selected?.id,
    caseCode: strategicContext?.caseCode || selected?.id,
    title: strategicContext?.title || selected?.title,
    stage: "brief",
    owner: selected?.owner,
    deadline: selected?.dueDate,
    status: selected ? statusLabel(selected.status) : "Aucun brief",
    returnTo: "/market-os/content-command-center/briefs",
  }

  function createBrief() {
    if (!createForm.title.trim()) return
    const next = { ...createForm, id: createForm.id || uid("brief") }
    commit((draft) => { draft.briefs = [next, ...draft.briefs] }, "brief create", `[brief:${next.id}] Brief créé : ${next.title}`)
    setSelectedId(next.id); setCreateOpen(false)
    setCreateForm({ id: uid("brief"), title: "", campaign: strategicContext?.title || "", audience: "", objective: "", message: "", channel: "Instagram", owner: "", dueDate: todayISO(7), status: "draft" })
    setNotice({ tone: "success", text: "Brief créé en brouillon. Aucune approbation n’a été simulée." })
  }

  function saveSection() {
    if (!selected || !selectedField) return
    commit((draft) => {
      draft.briefs = draft.briefs.map((brief) => {
        if (brief.id !== selected.id) return brief
        if (selectedField === "channel") return { ...brief, channel: draftValue as Channel }
        return { ...brief, [selectedField]: draftValue }
      })
    }, "brief section update", `[brief:${selected.id}] Section ${selectedSection?.label || selectedField} mise à jour`)
    setNotice({ tone: "success", text: `${selectedSection?.label || "Section"} enregistrée dans le store existant.` })
  }

  function setBriefStatus(nextStatus: ContentBrief["status"]) {
    if (!selected) return
    commit((draft) => {
      draft.briefs = draft.briefs.map((brief) => brief.id === selected.id ? { ...brief, status: nextStatus } : brief)
    }, "brief status", `[brief:${selected.id}] État du brief : ${nextStatus}`)
    setNotice({ tone: "success", text: nextStatus === "ready" ? "Brief marqué prêt selon le contrat existant. Cela ne constitue pas une validation institutionnelle MZ7." : `État mis à jour : ${statusLabel(nextStatus)}.` })
  }

  function recordClarification() {
    if (!selected || !clarification.question.trim()) return
    commit(() => undefined, "brief clarification", `[brief:${selected.id}] Clarification demandée à ${clarification.owner || "responsable non renseigné"} avant ${clarification.dueDate || "échéance non renseignée"} : ${clarification.question}`)
    setClarificationOpen(false); setClarification({ question: "", owner: "", dueDate: todayISO(2) })
    setNotice({ tone: "success", text: "Clarification enregistrée dans le journal existant. Le modèle ne dispose pas d’une entité structurée de clarification." })
  }

  const nextAction = !selected ? "Créer un brief" : checks.some((check) => !check.passed) ? `Compléter ${checks.find((check) => !check.passed)?.label || "le brief"}` : selected.status === "draft" ? "Marquer prêt pour revue" : "Planifier l’exécution"

  return <main aria-label="Briefing Suite AngelCare" className={`${styles.bulk2Canvas} ${styles.briefingCanvas}`}>
    <section className={styles.briefingHero}>
      <div className={styles.briefFolio}><span>BRIEF</span><strong>ANGELCARE</strong><small>CONSTITUTION DESK</small></div>
      <div className={styles.heroCopy}><span>Briefing Suite</span><h1>Constituer un mandat créatif précis, traçable et prêt à exécuter.</h1><p>Le brief reste relié à son origine stratégique, sa version opérationnelle, ses lacunes et son propriétaire. Il ne devient jamais “approuvé” par simple remplissage visuel.</p></div>
      <div className={styles.heroCommandCluster}><button className={styles.sovereignButton} onClick={() => setCreateOpen(true)}><Plus/> Nouveau brief</button><Link className={styles.secondaryButton} href={strategicHref("/market-os/content-command-center/strategies", { ...context, stage: "strategy" })}><GitBranch/> Origine stratégique</Link></div>
    </section>

    {notice ? <Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice> : null}
    <StrategicIdentityStrip context={context} nextAction={nextAction} onNextAction={!selected ? () => setCreateOpen(true) : checks.some((check) => !check.passed) ? undefined : selected.status === "draft" ? () => setBriefStatus("ready") : undefined}/>

    <section className={styles.briefingCommandBar}>
      <label className={styles.searchControl}><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brief, campagne, audience ou propriétaire…"/></label>
      <select className={styles.selectControl} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les états</option>{["draft", "ready", "used", "archived"].map((value) => <option value={value} key={value}>{statusLabel(value)}</option>)}</select>
      <div className={styles.truthCounters}><span><strong>{store.briefs.length}</strong> briefs</span><span><strong>{store.briefs.filter((brief) => brief.status === "ready").length}</strong> prêts</span><span><strong>{store.briefs.filter((brief) => brief.status === "draft").length}</strong> brouillons</span></div>
    </section>

    <div className={styles.briefingDesk}>
      <aside className={styles.briefRegister}>
        <header className={styles.zoneHeader}><div><span>Registre</span><h2>Constitutions actives</h2><p>Sélectionnez le mandat à structurer.</p></div><FileStack/></header>
        <div className={styles.briefRows}>{briefs.map((brief) => {
          const readiness = briefReadiness(brief)
          const complete = readiness.filter((check) => check.passed).length
          return <button key={brief.id} className={selected?.id === brief.id ? styles.briefRowActive : styles.briefRow} onClick={() => setSelectedId(brief.id)}><header><span>{statusLabel(brief.status)}</span><small>{complete}/{readiness.length} exigences</small></header><strong>{brief.title}</strong><p>{brief.objective || "Objectif non renseigné"}</p><footer><span>{brief.channel}</span><span>{brief.owner || "Sans owner"}</span></footer></button>
        })}{!briefs.length ? <EmptyStrategicState title="Aucun brief" detail="Créez le premier brief ou arrivez depuis une stratégie afin de préserver son contexte." action={<button className={styles.inlineAction} onClick={() => setCreateOpen(true)}>Créer un brief <ArrowRight/></button>}/> : null}</div>
      </aside>

      <nav className={styles.briefArchitecture} aria-label="Architecture du brief">
        <header><span>01 · Architecture Navigator</span><h2>{selected?.title || "Brief non sélectionné"}</h2></header>
        <div>{sections.map((section, index) => <button key={section.id} className={activeSection === section.id ? styles.briefSectionActive : styles.briefSection} onClick={() => setActiveSection(section.id)}><span className={styles.sectionIndex}>{String(index + 1).padStart(2, "0")}</span><div><strong>{section.label}</strong><p>{section.purpose}</p></div><span className={`${styles.sectionState} ${styles[`sectionState_${section.state}`]}`}>{section.state === "complete" ? <CheckCircle2/> : section.state === "missing" ? <ShieldAlert/> : <MessageCircleQuestion/>}</span></button>)}</div>
      </nav>

      <section className={styles.briefWorkbench}>
        {selected && selectedSection ? <>
          <header className={styles.workbenchHeader}><div><span>02 · Active Section Workbench</span><h2>{selectedSection.label}</h2><p>{selectedSection.purpose}</p></div><span className={`${styles.statusChip} ${selectedSection.state === "complete" ? styles.tone_success : styles.tone_warning}`}>{selectedSection.state === "complete" ? "Complet" : selectedSection.state === "missing" ? "À compléter" : "Clarification"}</span></header>

          {selectedField === "channel" ? <div className={styles.sectionEditor}><label>Canal principal<select value={selected.channel} onChange={(event) => setDraftValue(event.target.value)}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label><button className={styles.sovereignButton} onClick={saveSection}><Save/> Enregistrer le canal</button></div>
          : selectedField ? <div className={styles.sectionEditor}><label>{selectedSection.label}<textarea rows={activeSection === "message" || activeSection === "objective" ? 10 : 6} value={draftValue} onChange={(event) => setDraftValue(event.target.value)} placeholder={`Constituer : ${selectedSection.label.toLowerCase()}`}/></label><div className={styles.editorActions}><button className={styles.secondaryButton} onClick={() => setClarificationOpen(true)}><MessageCircleQuestion/> Demander une clarification</button><button className={styles.sovereignButton} onClick={saveSection}><Save/> Enregistrer la section</button></div></div>
          : activeSection === "governance" ? <div className={styles.governanceBridge}><ShieldAlert/><div><strong>Brand Governance reste l’autorité dédiée</strong><p>Le modèle ContentBrief actuel ne stocke pas un lien structuré vers les règles. Le brief conserve le passage contextuel sans inventer d’applicabilité.</p><Link href={strategicHref("/market-os/content-command-center/brand-governance", { ...context, stage: "brand" })}>Ouvrir les doctrines applicables <ArrowRight/></Link></div></div>
          : <div className={styles.ownershipWorkbench}><article><small>Propriétaire</small><strong>{selected.owner || "Non renseigné"}</strong><button onClick={() => { setActiveSection("ownership"); setDraftValue(selected.owner) }}>Modifier</button></article><article><small>Échéance</small><strong>{selected.dueDate || "Non renseignée"}</strong><input type="date" value={selected.dueDate} onChange={(event) => commit((draft) => { draft.briefs = draft.briefs.map((brief) => brief.id === selected.id ? { ...brief, dueDate: event.target.value } : brief) }, "brief deadline", `[brief:${selected.id}] Échéance mise à jour`)}/></article></div>}

          <section className={styles.strategicOriginRail}>
            <header><Waypoints/><div><span>03 · Strategic Origin Rail</span><h3>Pourquoi ce brief existe</h3></div></header>
            <div><article><small>Cas stratégique</small><strong>{strategicContext?.caseCode || "Non relié"}</strong><p>{strategicContext?.title || "Aucun contexte stratégique reçu dans cette session."}</p></article><article><small>Campagne</small><strong>{selected.campaign || "Non renseignée"}</strong><p>Valeur persistée dans le brief actuel.</p></article><article><small>Autorité</small><strong>Non exposée par ContentBrief</strong><p>Aucune autorité fictive n’est attribuée.</p></article></div>
          </section>

          <section className={styles.clarificationChamber}>
            <header className={styles.subsectionTitle}><div><span>04 · Clarification Chamber</span><h3>Questions qui empêchent une constitution fiable</h3></div><MessageCircleQuestion/></header>
            <div className={styles.clarificationList}>{clarificationLogs.map((log) => <article key={log.id}><CircleDot/><div><strong>{log.action}</strong><p>{log.detail}</p><small>{new Date(log.timestamp).toLocaleString("fr-FR")}</small></div></article>)}{!clarificationLogs.length ? <EmptyStrategicState title="Aucune clarification enregistrée" detail="Le store actuel ne fournit pas d’entité dédiée; les demandes sont consignées dans le journal existant avec l’identité du brief."/> : null}</div>
            <button className={styles.secondaryButton} onClick={() => setClarificationOpen(true)}><Plus/> Enregistrer une clarification</button>
          </section>
        </> : <EmptyStrategicState title="Sélectionnez un brief" detail="L’architecture, l’active section, la lignée stratégique et le gate de préparation apparaîtront ici."/>}
      </section>

      <StrategicContextSidecar context={context} sections={[
        { label: "Origine", value: strategicContext?.caseCode || selected?.campaign || "Non reliée", tone: strategicContext?.caseCode || selected?.campaign ? "success" : "danger" },
        { label: "Sections", value: selected ? `${checks.filter((check) => check.passed).length}/${checks.length}` : "—", tone: selected && checks.every((check) => check.passed) ? "success" : "warning" },
        { label: "Clarifications", value: String(clarificationLogs.length), tone: clarificationLogs.length ? "warning" : "neutral" },
        { label: "Version", value: "Non structurée", tone: "warning" },
      ]}/>
    </div>

    <section className={styles.briefApprovalDeck}>
      <ReadinessGate title="Brief Readiness Gate" checks={checks} actionLabel={selected?.status === "ready" ? "Ouvrir Planning éditorial" : "Marquer prêt pour revue"} onAction={selected ? () => {
        if (selected.status === "ready") {
          window.location.href = strategicHref("/market-os/content-command-center/calendar", { ...context, stage: "planning" })
          return
        }
        setBriefStatus("ready")
      } : undefined} actionDisabled={Boolean(selected && checks.some((check) => !check.passed))}/>
      <article className={styles.approvalBoundary}><header><ClipboardCheck/><span>05 · Approval & Conversion</span></header><h3>Prêt n’est pas “validé institutionnellement”</h3><p>Le statut <strong>ready</strong> du store existant indique que le brief est utilisable pour la suite. La validation formelle reste gouvernée par les workspaces Review/Validation.</p><div>{selected ? <><button className={styles.secondaryButton} onClick={() => setBriefStatus(selected.status === "archived" ? "draft" : "archived")}>{selected.status === "archived" ? "Réactiver le brouillon" : "Archiver"}</button><Link className={styles.sovereignButton} href={strategicHref("/market-os/content-command-center/calendar", { ...context, stage: "planning" })}>Planifier l’exécution <ArrowRight/></Link></> : null}</div></article>
      <article className={styles.versionRail}><header><GitBranch/><span>Version & audit</span></header>{briefLogs.length ? briefLogs.map((log) => <div key={log.id}><strong>{log.action}</strong><p>{log.detail}</p><small>{new Date(log.timestamp).toLocaleString("fr-FR")}</small></div>) : <p>Aucun événement spécifique à ce brief dans le journal observable.</p>}<footer>Aucun numéro de version n’est inventé : le modèle ContentBrief ne l’expose pas.</footer></article>
    </section>

    {createOpen ? <Drawer title="Créer un brief gouverné" eyebrow="Briefing Suite · Constitution" onClose={() => setCreateOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setCreateOpen(false)}>Annuler</button><button className={styles.sovereignButton} disabled={!createForm.title.trim()} onClick={createBrief}><Plus/> Créer en brouillon</button></>}>
      <div className={styles.drawerFormGrid}>
        <label>Titre<input value={createForm.title} onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })}/></label>
        <label>Campagne / origine<input value={createForm.campaign} onChange={(event) => setCreateForm({ ...createForm, campaign: event.target.value })}/></label>
        <label>Audience<textarea rows={3} value={createForm.audience} onChange={(event) => setCreateForm({ ...createForm, audience: event.target.value })}/></label>
        <label>Objectif<textarea rows={4} value={createForm.objective} onChange={(event) => setCreateForm({ ...createForm, objective: event.target.value })}/></label>
        <label>Message central<textarea rows={6} value={createForm.message} onChange={(event) => setCreateForm({ ...createForm, message: event.target.value })}/></label>
        <label>Canal<select value={createForm.channel} onChange={(event) => setCreateForm({ ...createForm, channel: event.target.value as Channel })}>{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
        <label>Owner<input value={createForm.owner} onChange={(event) => setCreateForm({ ...createForm, owner: event.target.value })}/></label>
        <label>Échéance<input type="date" value={createForm.dueDate} onChange={(event) => setCreateForm({ ...createForm, dueDate: event.target.value })}/></label>
      </div>
    </Drawer> : null}

    {clarificationOpen && selected ? <Drawer title="Enregistrer une clarification" eyebrow={`${selected.title} · Clarification`} onClose={() => setClarificationOpen(false)} footer={<><button className={styles.secondaryButton} onClick={() => setClarificationOpen(false)}>Annuler</button><button className={styles.sovereignButton} disabled={!clarification.question.trim()} onClick={recordClarification}><MessageCircleQuestion/> Consigner la demande</button></>}>
      <div className={styles.drawerFormGrid}><label>Question<textarea rows={6} value={clarification.question} onChange={(event) => setClarification({ ...clarification, question: event.target.value })}/></label><label>Responsable attendu<input value={clarification.owner} onChange={(event) => setClarification({ ...clarification, owner: event.target.value })}/></label><label>Échéance<input type="date" value={clarification.dueDate} onChange={(event) => setClarification({ ...clarification, dueDate: event.target.value })}/></label><div className={styles.dataBoundary}><TriangleAlert/><p>La demande sera conservée dans le journal existant. Le modèle actuel ne permet pas un état structuré “résolu/non résolu”.</p></div></div>
    </Drawer> : null}
  </main>
}
