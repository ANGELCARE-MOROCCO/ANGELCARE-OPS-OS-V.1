"use client"

import * as React from "react"
import {
  Activity,
  Archive,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileClock,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Send,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react"
import {
  Badge,
  Button,
  Meter,
  NotFoundPanel,
  PageHeader,
  Panel,
  Shell,
  canPublish,
  itemReadiness,
  nextStatus,
  statusLabel,
  useContentStore,
  type ContentStatus,
} from "./content-command-system"

type DossierTab = "overview" | "strategy" | "content" | "tasks" | "assets" | "review" | "publishing" | "performance" | "audit"

const tabs: Array<{ key: DossierTab; label: string; icon: React.ReactNode }> = [
  { key: "overview", label: "Vue exécutive", icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "strategy", label: "Brief & stratégie", icon: <Target className="h-4 w-4" /> },
  { key: "content", label: "Contenu & versions", icon: <FileText className="h-4 w-4" /> },
  { key: "tasks", label: "Tâches & contributeurs", icon: <ListChecks className="h-4 w-4" /> },
  { key: "assets", label: "Assets", icon: <FolderKanban className="h-4 w-4" /> },
  { key: "review", label: "Révision & approbations", icon: <ClipboardCheck className="h-4 w-4" /> },
  { key: "publishing", label: "Calendrier & publication", icon: <CalendarDays className="h-4 w-4" /> },
  { key: "performance", label: "Performance", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "audit", label: "Audit & preuves", icon: <ShieldCheck className="h-4 w-4" /> },
]

function statusTone(value: string): "soft" | "success" | "warning" | "danger" | "dark" {
  if (["approved", "published", "done", "ready"].includes(value)) return "success"
  if (["review", "scheduled", "doing", "revision"].includes(value)) return "warning"
  if (["blocked", "archived"].includes(value)) return "danger"
  if (["draft", "brief", "idea", "todo"].includes(value)) return "soft"
  return "dark"
}

function formatDate(value: string) {
  if (!value) return "Non définie"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: value.includes("T") ? "short" : undefined }).format(parsed)
}

export default function ContentDetailPage({ id }: { id: string }) {
  const { store, commit } = useContentStore()
  const [activeTab, setActiveTab] = React.useState<DossierTab>("overview")
  const item = store.items.find((candidate) => candidate.id === id)
  if (!item) return <NotFoundPanel id={id} />

  const tasks = store.tasks.filter((task) => task.contentId === item.id)
  const assets = store.assets.filter((asset) => asset.linkedContentId === item.id || item.assets.includes(asset.id))
  const readiness = itemReadiness(item, store.tasks, store.rules)
  const publishable = canPublish(item, store.tasks, store.rules)
  const completedTasks = tasks.filter((task) => task.status === "done").length
  const blockedTasks = tasks.filter((task) => task.status === "blocked").length
  const applicableRules = store.rules.filter((rule) => rule.active)
  const logs = store.logs.filter((entry) => entry.detail.toLowerCase().includes(item.title.toLowerCase()) || entry.entity === item.id).slice(0, 18)

  const nextAction = blockedTasks
    ? "Lever les blocages de production"
    : item.status === "review"
      ? "Décider la révision ou l’approbation"
      : item.status === "approved" && !item.scheduledDate
        ? "Définir une date de publication"
        : item.status === "scheduled"
          ? "Ouvrir le contrôle de publication"
          : item.status === "published"
            ? "Importer ou analyser la performance"
            : "Faire progresser le contenu vers l’étape suivante"

  const itemId = item.id

  function updateStatus(status: ContentStatus, action: string, detail: string) {
    commit((draft) => {
      draft.items = draft.items.map((candidate) => candidate.id === itemId ? { ...candidate, status, updatedAt: new Date().toISOString() } : candidate)
    }, action, detail)
  }

  return (
    <Shell>
      <main data-market-os-root className="cc360-dossier-page">
        <PageHeader
          eyebrow="CONTENT COMMAND 360 · DOSSIER CONTENU"
          title={item.title}
          description="Dossier opérationnel de référence : stratégie, production, assets, validation, publication et preuves."
          actions={(
            <>
              <Button href="/market-os/content-command-center">Portfolio</Button>
              <Button href={`/market-os/content-command-center/${item.id}/edit`} kind="primary">Modifier le dossier</Button>
            </>
          )}
        />

        <section className="cc360-content-passport" data-cc-dark>
          <div className="cc360-content-passport-main">
            <div className="cc360-content-passport-mark"><Megaphone className="h-7 w-7" /></div>
            <div>
              <span>CONTENT PASSPORT</span>
              <h2>{item.title}</h2>
              <p>{item.campaign || "Sans campagne"} · {item.channel} · {item.type}</p>
              <div className="cc360-passport-badges">
                <Badge kind="dark">{statusLabel(item.status)}</Badge>
                <Badge kind={item.priority === "Critical" ? "danger" : item.priority === "High" ? "warning" : "soft"}>{item.priority}</Badge>
                <Badge kind={publishable ? "success" : "warning"}>{publishable ? "Prêt selon règles locales" : "Préflight incomplet"}</Badge>
              </div>
            </div>
          </div>
          <dl className="cc360-content-passport-facts">
            <div><dt>Responsable</dt><dd>{item.owner}</dd></div>
            <div><dt>Validateur</dt><dd>{item.reviewer}</dd></div>
            <div><dt>Échéance</dt><dd>{formatDate(item.dueDate)}</dd></div>
            <div><dt>Planification</dt><dd>{formatDate(item.scheduledDate)}</dd></div>
          </dl>
        </section>

        <section className="cc360-dossier-metrics">
          <article><span><Target className="h-5 w-5" /></span><div><small>Préparation</small><strong>{readiness}%</strong><Meter value={readiness} /></div></article>
          <article><span><ShieldCheck className="h-5 w-5" /></span><div><small>Score marque</small><strong>{item.brandScore}%</strong><Meter value={item.brandScore} /></div></article>
          <article><span><ListChecks className="h-5 w-5" /></span><div><small>Tâches</small><strong>{completedTasks}/{tasks.length}</strong><p>{blockedTasks ? `${blockedTasks} bloquée${blockedTasks > 1 ? "s" : ""}` : "Aucun blocage"}</p></div></article>
          <article><span><FolderKanban className="h-5 w-5" /></span><div><small>Assets</small><strong>{assets.length}</strong><p>{assets.filter((asset) => asset.status === "approved").length} approuvé(s)</p></div></article>
          <article className="is-primary"><span><ChevronRight className="h-5 w-5" /></span><div><small>Prochaine action</small><strong>{nextAction}</strong></div></article>
        </section>

        <nav className="cc360-dossier-tabs" aria-label="Navigation du dossier contenu">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? "is-active" : ""}>
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <section className="cc360-dossier-workspace">
          {activeTab === "overview" ? (
            <div className="cc360-dossier-grid">
              <Panel className="cc360-dossier-main-panel">
                <header className="cc360-panel-title"><div><LayoutDashboard className="h-5 w-5" /><span><strong>Position exécutive</strong><small>Pourquoi ce contenu existe et ce qui doit se produire ensuite.</small></span></div></header>
                <div className="cc360-overview-brief">
                  <article><span>Objectif</span><p>{item.objective || "Objectif non défini."}</p></article>
                  <article><span>Audience</span><p>{item.audience || "Audience non définie."}</p></article>
                  <article><span>Angle</span><p>{item.angle || "Angle éditorial non défini."}</p></article>
                  <article><span>CTA</span><p>{item.cta || "CTA non défini."}</p></article>
                </div>
              </Panel>
              <aside className="cc360-dossier-rail">
                <Panel className="cc360-action-center">
                  <header className="cc360-panel-title"><div><ChevronRight className="h-5 w-5" /><span><strong>Action Center</strong><small>Actions existantes, conséquences explicites.</small></span></div></header>
                  <div className="cc360-action-stack">
                    <Button onClick={() => updateStatus(nextStatus(item.status), "content advance", `Advanced ${item.title}`)} kind="dark">Faire progresser</Button>
                    <Button onClick={() => updateStatus("review", "content review", `Sent ${item.title} to review`)}>Soumettre en révision</Button>
                    <Button onClick={() => updateStatus("approved", "content approve", `Approved ${item.title}`)} kind="primary">Approuver</Button>
                    <Button onClick={() => updateStatus("revision", "content revision", `Revision requested for ${item.title}`)}>Demander correction</Button>
                  </div>
                  <p className="cc360-truth-note">Une approbation interne ne constitue ni une publication externe, ni une preuve de diffusion.</p>
                </Panel>
              </aside>
            </div>
          ) : null}

          {activeTab === "strategy" ? (
            <Panel className="cc360-dossier-main-panel">
              <header className="cc360-panel-title"><div><Target className="h-5 w-5" /><span><strong>Brief & stratégie</strong><small>Cadre stratégique réellement disponible sur ce record.</small></span></div></header>
              <dl className="cc360-definition-grid">
                <div><dt>Campagne</dt><dd>{item.campaign || "Sans campagne"}</dd></div>
                <div><dt>Canal</dt><dd>{item.channel}</dd></div>
                <div><dt>Type</dt><dd>{item.type}</dd></div>
                <div><dt>Mot-clé SEO</dt><dd>{item.seoKeyword || "Non défini"}</dd></div>
                <div className="is-wide"><dt>Objectif</dt><dd>{item.objective || "Non défini"}</dd></div>
                <div className="is-wide"><dt>Audience</dt><dd>{item.audience || "Non définie"}</dd></div>
                <div className="is-wide"><dt>Angle</dt><dd>{item.angle || "Non défini"}</dd></div>
                <div className="is-wide"><dt>Appel à l’action</dt><dd>{item.cta || "Non défini"}</dd></div>
              </dl>
            </Panel>
          ) : null}

          {activeTab === "content" ? (
            <div className="cc360-dossier-grid">
              <Panel className="cc360-dossier-main-panel">
                <header className="cc360-panel-title"><div><FileText className="h-5 w-5" /><span><strong>Contenu actif</strong><small>Version opérationnelle conservée par le workflow existant.</small></span></div></header>
                <div className="cc360-content-body">{item.body || "Aucun corps de contenu n’est encore enregistré."}</div>
                <div className="cc360-note-block"><strong>Notes internes</strong><p>{item.notes || "Aucune note interne."}</p></div>
              </Panel>
              <aside className="cc360-dossier-rail"><Panel><header className="cc360-panel-title"><div><FileClock className="h-5 w-5" /><span><strong>Version & provenance</strong><small>Le store actuel ne fournit pas un historique de version complet.</small></span></div></header><dl className="cc360-audit-list"><div><dt>Créé</dt><dd>{formatDate(item.createdAt)}</dd></div><div><dt>Mis à jour</dt><dd>{formatDate(item.updatedAt)}</dd></div><div><dt>Source</dt><dd>Workspace navigateur v2</dd></div></dl></Panel></aside>
            </div>
          ) : null}

          {activeTab === "tasks" ? (
            <Panel className="cc360-dossier-main-panel">
              <header className="cc360-panel-title"><div><Users className="h-5 w-5" /><span><strong>Tâches & contributeurs</strong><small>{tasks.length} tâche(s) rattachée(s) au contenu.</small></span></div><Button href="/market-os/content-command-center/tasks">Ouvrir Task Command</Button></header>
              <div className="cc360-record-list">
                {tasks.map((task) => <article key={task.id}><div><Badge kind={statusTone(task.status)}>{statusLabel(task.status)}</Badge><Badge kind={task.priority === "Critical" ? "danger" : task.priority === "High" ? "warning" : "soft"}>{task.priority}</Badge></div><h3>{task.title}</h3><p>{task.owner} · échéance {formatDate(task.dueDate)}</p><small>{task.notes || "Aucune instruction complémentaire."}</small></article>)}
                {!tasks.length ? <div className="cc360-purposeful-empty"><ListChecks className="h-7 w-7" /><strong>Aucune tâche rattachée</strong><span>Le contenu peut exister sans plan de production, mais son exécution n’est pas encore structurée.</span></div> : null}
              </div>
            </Panel>
          ) : null}

          {activeTab === "assets" ? (
            <Panel className="cc360-dossier-main-panel">
              <header className="cc360-panel-title"><div><FolderKanban className="h-5 w-5" /><span><strong>Assets créatifs</strong><small>{assets.length} asset(s) identifié(s).</small></span></div><Button href="/market-os/content-command-center/assets">Ouvrir la bibliothèque</Button></header>
              <div className="cc360-record-list is-assets">
                {assets.map((asset) => <article key={asset.id}><div><Badge>{asset.type}</Badge><Badge kind={statusTone(asset.status)}>{statusLabel(asset.status)}</Badge></div><h3>{asset.name}</h3><p>{asset.owner} · {asset.channel}</p><small>{asset.notes || asset.url || "Aucune référence complémentaire."}</small></article>)}
                {!assets.length ? <div className="cc360-purposeful-empty"><FolderKanban className="h-7 w-7" /><strong>Aucun asset lié</strong><span>La production peut nécessiter des visuels, vidéos, documents ou adaptations par canal.</span></div> : null}
              </div>
            </Panel>
          ) : null}

          {activeTab === "review" ? (
            <div className="cc360-dossier-grid">
              <Panel className="cc360-dossier-main-panel">
                <header className="cc360-panel-title"><div><ClipboardCheck className="h-5 w-5" /><span><strong>Révision & approbations</strong><small>Lecture des règles existantes et état du contenu.</small></span></div></header>
                <div className="cc360-rule-list">{applicableRules.map((rule) => <article key={rule.id}><span><Badge kind={rule.required ? "warning" : "soft"}>{rule.category}</Badge><Badge kind={rule.active ? "success" : "soft"}>{rule.active ? "Active" : "Inactive"}</Badge></span><h3>{rule.title}</h3><p>{rule.notes}</p></article>)}</div>
              </Panel>
              <aside className="cc360-dossier-rail"><Panel><header className="cc360-panel-title"><div><ShieldCheck className="h-5 w-5" /><span><strong>État de gouvernance</strong><small>Résultat lisible, pas uniquement un score.</small></span></div></header><dl className="cc360-audit-list"><div><dt>Score marque</dt><dd>{item.brandScore}%</dd></div><div><dt>Validateur</dt><dd>{item.reviewer}</dd></div><div><dt>Statut</dt><dd>{statusLabel(item.status)}</dd></div><div><dt>Préflight local</dt><dd>{publishable ? "Conforme" : "Incomplet"}</dd></div></dl></Panel></aside>
            </div>
          ) : null}

          {activeTab === "publishing" ? (
            <div className="cc360-dossier-grid">
              <Panel className="cc360-dossier-main-panel">
                <header className="cc360-panel-title"><div><Send className="h-5 w-5" /><span><strong>Calendrier & publication</strong><small>Le statut interne est distingué de l’exécution externe.</small></span></div><Button href="/market-os/content-command-center/publishing">Ouvrir Publishing Control</Button></header>
                <div className="cc360-publication-truth">
                  <div><span>01</span><strong>Contenu préparé</strong><small>{item.body ? "Disponible" : "Manquant"}</small></div>
                  <div><span>02</span><strong>Approbation interne</strong><small>{["approved", "scheduled", "published"].includes(item.status) ? "Oui" : "Non"}</small></div>
                  <div><span>03</span><strong>Planification interne</strong><small>{item.scheduledDate ? formatDate(item.scheduledDate) : "Non définie"}</small></div>
                  <div><span>04</span><strong>Publication externe</strong><small>{item.status === "published" ? "Statut interne ‘published’ — vérification externe non prouvée" : "Non déclarée"}</small></div>
                </div>
              </Panel>
              <aside className="cc360-dossier-rail"><Panel><header className="cc360-panel-title"><div><CalendarDays className="h-5 w-5" /><span><strong>Préflight</strong><small>Conditions du workflow local existant.</small></span></div></header><dl className="cc360-audit-list"><div><dt>Date</dt><dd>{formatDate(item.scheduledDate)}</dd></div><div><dt>Canal</dt><dd>{item.channel}</dd></div><div><dt>Assets</dt><dd>{assets.length}</dd></div><div><dt>État</dt><dd>{publishable ? "Prêt localement" : "Conditions manquantes"}</dd></div></dl></Panel></aside>
            </div>
          ) : null}

          {activeTab === "performance" ? (
            <Panel className="cc360-dossier-main-panel">
              <header className="cc360-panel-title"><div><BarChart3 className="h-5 w-5" /><span><strong>Performance & intelligence</strong><small>Aucune métrique de démonstration n’est présentée comme résultat certifié.</small></span></div></header>
              <div className="cc360-purposeful-empty"><BarChart3 className="h-8 w-8" /><strong>Performance non disponible dans le record local</strong><span>La Phase 1 conserve l’intégrité de l’information. Les résultats devront être chargés par une source analytique vérifiée avant d’être affichés comme faits.</span></div>
            </Panel>
          ) : null}

          {activeTab === "audit" ? (
            <div className="cc360-dossier-grid">
              <Panel className="cc360-dossier-main-panel">
                <header className="cc360-panel-title"><div><History className="h-5 w-5" /><span><strong>Chronologie d’activité</strong><small>Événements du store existant liés au record lorsque détectables.</small></span></div></header>
                <div className="cc360-timeline">
                  <article><span><Activity className="h-4 w-4" /></span><div><strong>Dossier créé</strong><small>{formatDate(item.createdAt)}</small></div></article>
                  {logs.map((entry) => <article key={entry.id}><span><Activity className="h-4 w-4" /></span><div><strong>{entry.action}</strong><p>{entry.detail}</p><small>{formatDate(entry.timestamp)}</small></div></article>)}
                  <article><span><CheckCircle2 className="h-4 w-4" /></span><div><strong>Dernière mise à jour connue</strong><small>{formatDate(item.updatedAt)}</small></div></article>
                </div>
              </Panel>
              <aside className="cc360-dossier-rail"><Panel><header className="cc360-panel-title"><div><ShieldCheck className="h-5 w-5" /><span><strong>Evidence Desk</strong><small>Identifiants et provenance secondaires.</small></span></div></header><dl className="cc360-audit-list"><div><dt>Content ID</dt><dd>{item.id}</dd></div><div><dt>Persistence</dt><dd>Local Storage v2</dd></div><div><dt>Route</dt><dd>/content-command-center/{item.id}</dd></div><div><dt>Assets refs</dt><dd>{item.assets.length}</dd></div></dl><Button href={`/market-os/content-command-center/${item.id}/delete`} kind="danger"><Archive className="h-4 w-4" /> Contrôles administratifs</Button></Panel></aside>
            </div>
          ) : null}
        </section>
      </main>
    </Shell>
  )
}
