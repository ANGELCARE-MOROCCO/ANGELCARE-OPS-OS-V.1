"use client"

import Link from "next/link"
import * as React from "react"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Database,
  FileStack,
  FolderKanban,
  Layers3,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react"
import {
  Badge,
  Button,
  Panel,
  canPublish,
  isOverdue,
  statusLabel,
  useContentStore,
  type ContentItem,
  type ContentTask,
} from "./content-command-system"

type RuntimeStats = {
  assets: number
  documents: number
  tasks: number
  comments: number
  categories: number
  activity: number
  state: "loading" | "live" | "partial" | "unavailable"
  updatedAt: string
}

const EMPTY_RUNTIME_STATS: RuntimeStats = {
  assets: 0,
  documents: 0,
  tasks: 0,
  comments: 0,
  categories: 0,
  activity: 0,
  state: "loading",
  updatedAt: "",
}

function formatDateTime(value: string) {
  if (!value) return "Non disponible"
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  } catch {
    return value
  }
}

function relativeWait(date: string) {
  if (!date) return "Sans échéance"
  const target = new Date(`${date}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  if (days === 0) return "Échéance aujourd’hui"
  if (days > 0) return `Dans ${days} jour${days > 1 ? "s" : ""}`
  const late = Math.abs(days)
  return `${late} jour${late > 1 ? "s" : ""} de retard`
}

function statusTone(status: string): "success" | "warning" | "danger" | "soft" {
  if (["approved", "published", "done", "ready"].includes(status)) return "success"
  if (["blocked", "revision", "archived"].includes(status)) return "danger"
  if (["review", "scheduled", "doing", "brief"].includes(status)) return "warning"
  return "soft"
}

function nextAction(item: ContentItem, tasks: ContentTask[]) {
  const itemTasks = tasks.filter((task) => task.contentId === item.id)
  if (itemTasks.some((task) => task.status === "blocked")) return "Lever le blocage de production"
  if (item.status === "idea" || item.status === "brief") return "Compléter le brief stratégique"
  if (item.status === "draft") return "Finaliser puis soumettre en révision"
  if (item.status === "review") return "Prendre la décision de révision"
  if (item.status === "revision") return "Appliquer les corrections requises"
  if (item.status === "approved" && !item.scheduledDate) return "Définir la date de publication"
  if (item.status === "approved") return "Préparer la planification"
  if (item.status === "scheduled") return "Ouvrir le contrôle de publication"
  if (item.status === "published") return "Analyser la performance"
  return "Examiner le dossier"
}

function QueueCard({
  title,
  description,
  items,
  empty,
  icon,
}: {
  title: string
  description: string
  items: ContentItem[]
  empty: string
  icon: React.ReactNode
}) {
  const { store } = useContentStore()

  return (
    <Panel className="cc360-queue-card">
      <header className="cc360-section-heading">
        <span className="cc360-section-icon">{icon}</span>
        <div><h2>{title}</h2><p>{description}</p></div>
        <strong>{items.length}</strong>
      </header>
      <div className="cc360-queue-list">
        {items.slice(0, 5).map((item) => (
          <Link key={item.id} href={`/market-os/content-command-center/${item.id}`} className="cc360-queue-item">
            <div className="cc360-queue-item-main">
              <div className="cc360-queue-item-badges"><Badge kind={statusTone(item.status)}>{statusLabel(item.status)}</Badge><Badge kind={item.priority === "Critical" ? "danger" : item.priority === "High" ? "warning" : "soft"}>{item.priority}</Badge></div>
              <strong>{item.title || "Contenu sans titre"}</strong>
              <span>{item.campaign || "Sans campagne"} · {item.channel} · {item.owner}</span>
            </div>
            <div className="cc360-queue-item-action"><span>{relativeWait(item.dueDate)}</span><strong>{nextAction(item, store.tasks)}</strong><ChevronRight className="h-4 w-4" /></div>
          </Link>
        ))}
        {!items.length ? <div className="cc360-purposeful-empty"><CheckCircle2 className="h-6 w-6" /><strong>{empty}</strong><span>Aucune intervention n’est requise dans cette file avec les données actuellement disponibles.</span></div> : null}
      </div>
    </Panel>
  )
}

export default function ContentCommand360Home() {
  const { store } = useContentStore()
  const [runtime, setRuntime] = React.useState<RuntimeStats>(EMPTY_RUNTIME_STATS)
  const [refreshing, setRefreshing] = React.useState(false)

  const loadRuntime = React.useCallback(async () => {
    setRefreshing(true)
    const endpoints = [
      ["assets", "/api/market-os/content-command-center/assets"],
      ["documents", "/api/market-os/content-command-center/documents"],
      ["tasks", "/api/market-os/content-command-center/tasks"],
      ["comments", "/api/market-os/content-command-center/comments"],
      ["categories", "/api/market-os/content-command-center/categories"],
      ["activity", "/api/market-os/content-command-center/activity"],
    ] as const

    const settled = await Promise.allSettled(
      endpoints.map(async ([key, endpoint]) => {
        const response = await fetch(endpoint, { cache: "no-store", credentials: "include" })
        const payload = await response.json().catch(() => ({}))
        const list = Array.isArray(payload[key]) ? payload[key] : []
        if (!response.ok) throw new Error(endpoint)
        return [key, list.length] as const
      }),
    )

    const next = { ...EMPTY_RUNTIME_STATS, state: "live" as RuntimeStats["state"], updatedAt: new Date().toISOString() }
    let successes = 0
    settled.forEach((result) => {
      if (result.status === "fulfilled") {
        successes += 1
        const [key, value] = result.value
        ;(next as Record<string, unknown>)[key] = value
      }
    })
    next.state = successes === endpoints.length ? "live" : successes > 0 ? "partial" : "unavailable"
    setRuntime(next)
    setRefreshing(false)
  }, [])

  React.useEffect(() => {
    void loadRuntime()
  }, [loadRuntime])

  const activeItems = store.items.filter((item) => item.status !== "archived")
  const overdue = activeItems.filter((item) => isOverdue(item.dueDate) && !["published", "archived"].includes(item.status))
  const blockedContentIds = new Set(store.tasks.filter((task) => task.status === "blocked").map((task) => task.contentId))
  const blocked = activeItems.filter((item) => blockedContentIds.has(item.id))
  const review = activeItems.filter((item) => item.status === "review" || item.status === "revision")
  const readyToPublish = activeItems.filter((item) => canPublish(item, store.tasks, store.rules))
  const management = activeItems.filter((item) => item.priority === "Critical" || blockedContentIds.has(item.id) || (isOverdue(item.dueDate) && item.status === "review"))
  const production = activeItems.filter((item) => ["idea", "brief", "draft"].includes(item.status) || blockedContentIds.has(item.id))
  const published = store.items.filter((item) => item.status === "published")

  const stages = [
    { label: "Brief", value: activeItems.filter((item) => item.status === "idea" || item.status === "brief").length, href: "/market-os/content-command-center/briefs" },
    { label: "Production", value: activeItems.filter((item) => item.status === "draft").length, href: "/market-os/content-command-center/tasks/execution" },
    { label: "Review", value: activeItems.filter((item) => item.status === "review" || item.status === "revision").length, href: "/market-os/content-command-center/review" },
    { label: "Approval", value: activeItems.filter((item) => item.status === "approved").length, href: "/market-os/content-command-center/review" },
    { label: "Scheduling", value: activeItems.filter((item) => item.status === "scheduled").length, href: "/market-os/content-command-center/calendar" },
    { label: "Publishing", value: readyToPublish.length, href: "/market-os/content-command-center/publishing" },
    { label: "Verified", value: published.length, href: "/market-os/content-command-center#performance" },
  ]

  const metrics = [
    { label: "Production active", value: activeItems.length, detail: "contenus non archivés", icon: <Layers3 className="h-5 w-5" />, tone: "navy" },
    { label: "Échéances dépassées", value: overdue.length, detail: "intervention requise", icon: <Clock3 className="h-5 w-5" />, tone: overdue.length ? "red" : "green" },
    { label: "Blocages", value: blocked.length, detail: "tâches bloquées", icon: <CircleAlert className="h-5 w-5" />, tone: blocked.length ? "red" : "green" },
    { label: "Révision", value: review.length, detail: "décisions en attente", icon: <ClipboardCheck className="h-5 w-5" />, tone: review.length ? "amber" : "green" },
    { label: "Prêts à publier", value: readyToPublish.length, detail: "selon les règles locales", icon: <Send className="h-5 w-5" />, tone: "blue" },
    { label: "Décisions management", value: management.length, detail: "priorités critiques", icon: <AlertTriangle className="h-5 w-5" />, tone: management.length ? "red" : "green" },
  ]

  return (
    <main data-market-os-root className="cc360-route-main cc360-home">
      <section className="cc360-hero" data-cc-dark>
        <div className="cc360-hero-copy">
          <span className="cc360-hero-eyebrow">Executive Content Command</span>
          <h1>Diriger la production, la marque, la validation et la publication depuis une seule position de contrôle.</h1>
          <p>Cette expérience organise toutes les fonctions déjà construites sans supprimer leurs workflows. Les chiffres issus du navigateur et les compteurs serveur restent explicitement séparés pour protéger la vérité opérationnelle.</p>
          <div className="cc360-hero-actions">
            <Button href="/market-os/content-command-center/create" kind="primary"><Sparkles className="h-4 w-4" /> Créer un contenu</Button>
            <Button href="/market-os/content-command-center/tasks" kind="light"><Workflow className="h-4 w-4" /> Ouvrir la production</Button>
            <Button href="/market-os/content-command-center/legacy-operations" kind="light"><Layers3 className="h-4 w-4" /> Cockpit complet existant</Button>
            <a href="/training/content-command-center-training.html" target="_blank" rel="noopener noreferrer" className="cc360-training-action"><BookOpenCheck className="h-4 w-4" /> Formation interne</a>
          </div>
        </div>
        <aside className="cc360-source-command">
          <header><Database className="h-5 w-5" /><div><strong>État des sources</strong><small>Dernier contrôle : {formatDateTime(runtime.updatedAt)}</small></div></header>
          <div className="cc360-source-status"><span data-state={runtime.state}>{runtime.state === "live" ? "Sources serveur disponibles" : runtime.state === "partial" ? "Sources partiellement disponibles" : runtime.state === "loading" ? "Contrôle en cours" : "Sources serveur indisponibles"}</span><button type="button" onClick={() => void loadRuntime()} disabled={refreshing}><RefreshCw className={`h-4 w-4${refreshing ? " animate-spin" : ""}`} /> Actualiser</button></div>
          <dl>
            <div><dt>Assets serveur</dt><dd>{runtime.assets}</dd></div>
            <div><dt>Documents serveur</dt><dd>{runtime.documents}</dd></div>
            <div><dt>Tasks serveur</dt><dd>{runtime.tasks}</dd></div>
            <div><dt>Commentaires</dt><dd>{runtime.comments}</dd></div>
            <div><dt>Catégories</dt><dd>{runtime.categories}</dd></div>
            <div><dt>Événements</dt><dd>{runtime.activity}</dd></div>
          </dl>
          <p><ShieldCheck className="h-4 w-4" /> Les contenus, briefs, tâches et assets du workflow local sont conservés dans le navigateur par le système existant. Ils ne sont jamais présentés comme des enregistrements Supabase certifiés.</p>
        </aside>
      </section>

      <section className="cc360-metrics" data-cc-focus-hide>
        {metrics.map((metric) => (
          <article key={metric.label} className="cc360-metric" data-tone={metric.tone}>
            <span>{metric.icon}</span><div><small>{metric.label}</small><strong>{metric.value}</strong><p>{metric.detail}</p></div>
          </article>
        ))}
      </section>

      <section className="cc360-flow" data-cc-focus-hide>
        <header><div><span>Cycle de production</span><h2>Brief → production → validation → publication vérifiée</h2></div><p>Chaque étape est calculée uniquement depuis les statuts réellement disponibles dans le workflow existant.</p></header>
        <div className="cc360-flow-steps">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.label}>
              <Link href={stage.href} className="cc360-flow-step"><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong><b>{stage.value}</b></Link>
              {index < stages.length - 1 ? <ArrowRight className="h-4 w-4" /> : null}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="cc360-home-grid">
        <div className="cc360-primary-workspace cc360-queue-grid">
          <QueueCard title="Production requise" description="Briefs, drafts, assets et dépendances à traiter." items={production} empty="Aucune production urgente" icon={<Workflow className="h-5 w-5" />} />
          <QueueCard title="Révision requise" description="Contenus en révision ou correction requise." items={review} empty="Aucune décision de révision en attente" icon={<ClipboardCheck className="h-5 w-5" />} />
          <QueueCard title="Publication requise" description="Contenus approuvés répondant aux conditions locales de publication." items={readyToPublish} empty="Aucun contenu prêt à publier" icon={<Send className="h-5 w-5" />} />
          <QueueCard title="Décisions management" description="Priorités critiques, blocages et retards sensibles." items={management} empty="Aucune décision critique" icon={<AlertTriangle className="h-5 w-5" />} />
        </div>

        <aside className="cc360-decision-rail cc360-secondary">
          <Panel className="cc360-decision-panel">
            <header className="cc360-section-heading"><span className="cc360-section-icon"><Users className="h-5 w-5" /></span><div><h2>Position équipe</h2><p>Répartition d’après le workflow navigateur existant.</p></div></header>
            <div className="cc360-owner-list">
              {Array.from(new Set(activeItems.map((item) => item.owner).filter(Boolean))).slice(0, 8).map((owner) => {
                const owned = activeItems.filter((item) => item.owner === owner)
                const late = owned.filter((item) => isOverdue(item.dueDate) && !["published", "archived"].includes(item.status)).length
                return <div key={owner}><span><strong>{owner}</strong><small>{owned.length} contenu{owned.length > 1 ? "s" : ""}</small></span><Badge kind={late ? "danger" : "success"}>{late ? `${late} retard` : "Sous contrôle"}</Badge></div>
              })}
              {!activeItems.length ? <div className="cc360-purposeful-empty"><Users className="h-6 w-6" /><strong>Aucun portefeuille actif</strong><span>Créez le premier contenu pour construire la vue de charge.</span></div> : null}
            </div>
          </Panel>
          <Panel className="cc360-decision-panel" data-cc-audit-only>
            <header className="cc360-section-heading"><span className="cc360-section-icon"><ShieldCheck className="h-5 w-5" /></span><div><h2>Audit & provenance</h2><p>Visibilité renforcée en mode Audit.</p></div></header>
            <dl className="cc360-audit-list"><div><dt>Persistence contenus</dt><dd>Local Storage v2</dd></div><div><dt>API actions génériques</dt><dd>Contrat existant préservé</dd></div><div><dt>Source runtime</dt><dd>{runtime.state}</dd></div><div><dt>Brand rules actives</dt><dd>{store.rules.filter((rule) => rule.active).length}</dd></div></dl>
          </Panel>
        </aside>
      </section>

      <section id="portfolio" className="cc360-portfolio-section">
        <header className="cc360-section-title"><div><span>Portefeuille contenu</span><h2>Inventaire opérationnel et prochaine action</h2><p>La table repose sur les contenus existants du workspace navigateur et ne prétend pas remplacer le futur runtime canonique.</p></div><div><Link href="/market-os/content-command-center/create" className="cc360-table-action">Créer</Link><Link href="/market-os/content-command-center/legacy-operations" className="cc360-table-action secondary">Cockpit existant</Link></div></header>
        <div className="cc360-table-wrap">
          <table>
            <thead><tr><th>Contenu</th><th>Campagne / Canal</th><th>Responsable</th><th>Étape</th><th>Priorité</th><th>Échéance</th><th>Assets</th><th>Prochaine action</th></tr></thead>
            <tbody>
              {activeItems.slice(0, 14).map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/market-os/content-command-center/${item.id}`}><strong>{item.title || "Contenu sans titre"}</strong><small>{item.type}</small></Link></td>
                  <td><strong>{item.campaign || "Sans campagne"}</strong><small>{item.channel}</small></td>
                  <td><strong>{item.owner}</strong><small>Review : {item.reviewer}</small></td>
                  <td><Badge kind={statusTone(item.status)}>{statusLabel(item.status)}</Badge></td>
                  <td><Badge kind={item.priority === "Critical" ? "danger" : item.priority === "High" ? "warning" : "soft"}>{item.priority}</Badge></td>
                  <td><strong>{item.dueDate || "Non définie"}</strong><small className={isOverdue(item.dueDate) ? "is-danger" : ""}>{relativeWait(item.dueDate)}</small></td>
                  <td><strong>{item.assets.length}</strong><small>références</small></td>
                  <td><Link href={`/market-os/content-command-center/${item.id}`} className="cc360-next-action">{nextAction(item, store.tasks)} <ChevronRight className="h-4 w-4" /></Link></td>
                </tr>
              ))}
              {!activeItems.length ? <tr><td colSpan={8}><div className="cc360-purposeful-empty"><FileStack className="h-7 w-7" /><strong>Aucun contenu dans le portefeuille</strong><span>Créez un contenu pour activer la production, les tâches, les assets, la révision et le calendrier.</span><Link href="/market-os/content-command-center/create">Créer le premier contenu</Link></div></td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section id="performance" className="cc360-performance-section" data-cc-focus-hide>
        <header className="cc360-section-title"><div><span>Performance & intelligence</span><h2>État honnête de la disponibilité des résultats</h2><p>Phase 1 interdit aux métriques de démonstration de se présenter comme des performances certifiées.</p></div></header>
        <div className="cc360-performance-grid">
          <article><BarChart3 className="h-6 w-6" /><strong>{published.length}</strong><span>contenus marqués « published » dans le workspace local</span><small>Ce statut ne prouve pas une publication externe vérifiée.</small></article>
          <article><FolderKanban className="h-6 w-6" /><strong>{store.assets.length}</strong><span>assets enregistrés dans le workspace local</span><small>Les actifs serveur sont comptés séparément : {runtime.assets}.</small></article>
          <article><CalendarClock className="h-6 w-6" /><strong>{activeItems.filter((item) => item.scheduledDate).length}</strong><span>contenus avec date planifiée</span><small>Une date interne ne constitue pas une exécution externe.</small></article>
          <article><ShieldCheck className="h-6 w-6" /><strong>{store.rules.filter((rule) => rule.active).length}</strong><span>règles de marque actives</span><small>Leur présence ne remplace pas la décision humaine de validation.</small></article>
        </div>
      </section>
    </main>
  )
}
