"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BellRing,
  Bot,
  Boxes,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  Crosshair,
  FileCheck2,
  Film,
  Gauge,
  Globe2,
  HardDrive,
  HeartHandshake,
  Images,
  Layers3,
  LockKeyhole,
  MessageCircleMore,
  MousePointer2,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react"
import type {
  SocialBootstrap,
  SocialChannelCapability,
  SocialConversation,
  SocialPublication,
  SocialUniverse,
} from "@/lib/social-command/types"
import {
  BROADCAST_RULES,
  buildBroadcastSnapshot,
  type BroadcastFamily,
  type BroadcastRule,
  type BroadcastSeverity,
  type BroadcastSignal,
} from "@/lib/social-command/mz4-broadcast"
import styles from "./SocialCommandMZ4.module.css"

type Navigate = (universe: SocialUniverse, view?: string) => void

type MastheadProps = {
  data: SocialBootstrap
  universe: SocialUniverse
  snapshotAt: string
  search: string
  setSearch: (value: string) => void
  onRefresh: () => Promise<void>
  navigate: Navigate
}

type PreludeProps = {
  data: SocialBootstrap
  universe: SocialUniverse
  snapshotAt: string
  navigate: Navigate
}

const familyLabels: Record<BroadcastFamily, string> = {
  publishing: "Publishing",
  engagement: "Engagement",
  campaign: "Campaigns",
  brand: "Brand",
  media: "Media Vault",
  meta: "Meta",
  automation: "Automation",
  commercial: "Commercial",
  governance: "Governance",
  system: "System",
  intelligence: "Intelligence",
  workflow: "Workflow",
}

const severityLabels: Record<BroadcastSeverity, string> = {
  critical: "CRITIQUE",
  warning: "ALERTE",
  attention: "ATTENTION",
  healthy: "SAIN",
  info: "INFO",
}

const presetDefinitions = {
  calm: { label: "Calm", severities: ["critical", "warning", "attention"] as BroadcastSeverity[], limit: 10, speed: "92s" },
  standard: { label: "Standard", severities: ["critical", "warning", "attention", "healthy"] as BroadcastSeverity[], limit: 18, speed: "72s" },
  dense: { label: "Dense", severities: ["critical", "warning", "attention", "healthy", "info"] as BroadcastSeverity[], limit: 28, speed: "58s" },
  command: { label: "Command", severities: ["critical", "warning", "attention", "healthy", "info"] as BroadcastSeverity[], limit: 22, speed: "64s" },
  critical: { label: "Critical only", severities: ["critical", "warning"] as BroadcastSeverity[], limit: 16, speed: "78s" },
  executive: { label: "Executive brief", severities: ["critical", "attention", "healthy"] as BroadcastSeverity[], limit: 14, speed: "82s" },
}

type PresetKey = keyof typeof presetDefinitions

function formatSnapshot(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function formatWhen(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

function hoursUntil(value: string | null, snapshotAt: string) {
  if (!value) return null
  const target = new Date(value).getTime()
  const base = new Date(snapshotAt).getTime()
  if (Number.isNaN(target) || Number.isNaN(base)) return null
  return (target - base) / 3_600_000
}

function isOpenConversation(conversation: SocialConversation) {
  return !["resolved", "archived"].includes(conversation.status)
}

function commercialIntent(conversation: SocialConversation) {
  return /(commercial|sales|lead|prix|price|tarif|devis|quote|parten|b2b|achat|buy)/i.test(
    `${conversation.triage_category || ""} ${(conversation.tags || []).join(" ")}`,
  )
}

function capabilityLabel(state: string | undefined, supported: boolean) {
  if (supported && (!state || state === "available")) return "AVAILABLE"
  if (state === "requires_reconnect") return "AUTHORIZATION REQUIRED"
  if (state === "permission_missing") return "PERMISSION REQUIRED"
  if (state === "provider_limited") return "PROVIDER LIMITED"
  if (state === "degraded") return "DEGRADED"
  return supported ? "AVAILABLE WITH LIMITS" : "UNAVAILABLE"
}

function capabilityTone(state: string | undefined, supported: boolean) {
  if (supported && (!state || state === "available")) return "ready"
  if (state === "degraded" || state === "provider_limited") return "attention"
  return "blocked"
}

function topSignals(snapshot: ReturnType<typeof buildBroadcastSnapshot>, count = 5) {
  return snapshot.signals.slice(0, count)
}

export function MZ4InstitutionalMasthead({ data, universe, snapshotAt, search, setSearch, onRefresh, navigate }: MastheadProps) {
  const snapshot = useMemo(() => buildBroadcastSnapshot(data, snapshotAt), [data, snapshotAt])
  const [preset, setPreset] = useState<PresetKey>("command")
  const [presetOpen, setPresetOpen] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<BroadcastSignal | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [ruleQuery, setRuleQuery] = useState("")
  const [ruleFamily, setRuleFamily] = useState<BroadcastFamily | "all">("all")
  const searchRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen(true)
        searchRef.current?.focus()
      }
      if (event.key === "Escape") {
        setPaletteOpen(false)
        setPresetOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const activePreset = presetDefinitions[preset]
  const railSignals = snapshot.signals
    .filter((signal) => activePreset.severities.includes(signal.severity))
    .slice(0, activePreset.limit)

  const rules = BROADCAST_RULES.filter((item) => {
    const familyMatch = ruleFamily === "all" || item.family === ruleFamily
    const q = ruleQuery.trim().toLowerCase()
    const textMatch = !q || `${item.code} ${item.title} ${item.condition} ${item.resolution} ${item.source}`.toLowerCase().includes(q)
    return familyMatch && textMatch
  })

  const paletteResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fixed = [
      { label: "Live Command", detail: "Cockpit exécutif et attention réseau", action: () => navigate("command", "live"), icon: <Command /> },
      { label: "Créer du contenu", detail: "Ouvrir le Master Creative Studio", action: () => navigate("studio", "create"), icon: <WandSparkles /> },
      { label: "Media Vault", detail: "Windows media constellation", action: () => navigate("studio", "vault"), icon: <HardDrive /> },
      { label: "Campaigns", detail: "Flux campagne et exécution", action: () => navigate("studio", "campaigns"), icon: <Target /> },
      { label: "Temporal Command", detail: "Calendrier et runway de publication", action: () => navigate("publish", "temporal"), icon: <CalendarDays /> },
      { label: "Engagement Inbox", detail: "DM, commentaires et mentions", action: () => navigate("engage", "inbox"), icon: <MessageCircleMore /> },
      { label: "Automation Lab", detail: "Règles et exécutions", action: () => navigate("automate", "lab"), icon: <Zap /> },
      { label: "Capability Intelligence", detail: "Support, autorisation et runtime", action: () => navigate("control", "capabilities"), icon: <ShieldCheck /> },
      { label: "Webhook Control", detail: "Événements Meta et diagnostic", action: () => navigate("control", "webhooks"), icon: <Radio /> },
    ]
    const publicationMatches = data.publications.slice(0, 40).map((publication) => ({
      label: publication.title,
      detail: `${publication.status} · ${publication.channels.join(" + ")}`,
      action: () => navigate("publish", publication.status === "failed" ? "failures" : "scheduled"),
      icon: publication.format === "reel" ? <Film /> : publication.format === "carousel" ? <Layers3 /> : <Images />,
    }))
    const campaignMatches = data.campaigns.slice(0, 30).map((campaign) => ({
      label: campaign.title,
      detail: `Campaign · ${campaign.status}`,
      action: () => navigate("studio", "campaigns"),
      icon: <Target />,
    }))
    return [...fixed, ...publicationMatches, ...campaignMatches]
      .filter((item) => !q || `${item.label} ${item.detail}`.toLowerCase().includes(q))
      .slice(0, 10)
  }, [data.campaigns, data.publications, navigate, search])

  return <>
    <header className={styles.institutionalMasthead}>
      <div className={styles.identityBlock}>
        <div className={styles.logoStage}>
          <img src="/angelcare-social-command-official-logo.png" alt="AngelCare" />
        </div>
        <div className={styles.identityCopy}>
          <span>PROPRIETARY SOCIAL OPERATIONS OS</span>
          <strong>SOCIAL COMMAND</strong>
          <small>{universe.toUpperCase()} · Sovereign operating environment</small>
        </div>
      </div>

      <section className={styles.broadcastSystem} aria-label="AngelCare Live Signal Broadcast Rail">
        <div className={styles.broadcastHeader}>
          <div className={styles.broadcastIdentity}>
            <span className={styles.liveDot} />
            <div><b>ANGELCARE LIVE SIGNAL</b><small>Snapshot broadcasting · {snapshot.signals.length} active signals</small></div>
          </div>
          <div className={styles.broadcastControls}>
            <button className={styles.snapshotButton} onClick={() => void onRefresh()} title="Capturer un nouveau snapshot"><RefreshCw /><span>SNAP {formatSnapshot(snapshotAt)}</span></button>
            <button onClick={() => setRulesOpen(true)}><SlidersHorizontal /><span>{BROADCAST_RULES.length} RULES</span></button>
            <div className={styles.presetControl}>
              <button onClick={() => setPresetOpen((value) => !value)}><Gauge /><span>{activePreset.label}</span><ChevronRight /></button>
              {presetOpen ? <div className={styles.presetMenu}>{(Object.keys(presetDefinitions) as PresetKey[]).map((key) => <button key={key} className={preset === key ? styles.presetSelected : ""} onClick={() => { setPreset(key); setPresetOpen(false) }}><span>{presetDefinitions[key].label}</span><small>{presetDefinitions[key].limit} signals · {presetDefinitions[key].speed}</small></button>)}</div> : null}
            </div>
          </div>
        </div>

        <div className={styles.broadcastViewport} style={{ "--broadcast-speed": activePreset.speed } as React.CSSProperties} tabIndex={0}>
          <div className={styles.broadcastTrack}>
            {[...railSignals, ...railSignals].map((signal, index) => <button key={`${signal.id}-${index}`} className={`${styles.broadcastItem} ${styles[`broadcast_${signal.severity}`]}`} onClick={() => setSelectedSignal(signal)} aria-hidden={index >= railSignals.length ? true : undefined} tabIndex={index >= railSignals.length ? -1 : 0}>
              <span className={styles.broadcastCode}>{signal.ruleCode}</span>
              <i />
              <div><b>{signal.message}</b><small>{signal.detail}</small></div>
              <em>{severityLabels[signal.severity]}</em>
            </button>)}
            {!railSignals.length ? <div className={styles.broadcastEmpty}><Check />Aucun signal correspondant au preset.</div> : null}
          </div>
          <div className={styles.hoverInstruction}><MousePointer2 /><span>Survol = pause de lecture</span><Pause /></div>
        </div>
      </section>

      <div className={styles.mastheadTools}>
        <div className={styles.commandSearch} onFocus={() => setPaletteOpen(true)}>
          <Search />
          <input ref={searchRef} value={search} onChange={(event) => { setSearch(event.target.value); setPaletteOpen(true) }} placeholder="Rechercher ou commander Social Command…" />
          <kbd>⌘ K</kbd>
          {paletteOpen ? <div className={styles.commandPalette}>
            <header><div><Command /><span>COMMAND PALETTE</span></div><button onMouseDown={(event) => event.preventDefault()} onClick={() => setPaletteOpen(false)}><X /></button></header>
            <div>{paletteResults.map((result, index) => <button key={`${result.label}-${index}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { result.action(); setPaletteOpen(false) }}><span>{result.icon}</span><div><b>{result.label}</b><small>{result.detail}</small></div><ArrowRight /></button>)}</div>
            {!paletteResults.length ? <p>Aucun objet correspondant au snapshot actuel.</p> : null}
          </div> : null}
        </div>
        <div className={styles.healthPills}>
          <span data-state={data.storage.healthy ? "ready" : "attention"}><HardDrive /><b>WINDOWS</b><em>{data.storage.healthy ? "ONLINE" : "CHECK"}</em></span>
          <span data-state={data.connection?.connection_health === "healthy" ? "ready" : "attention"}><Signal /><b>META</b><em>{data.connection ? "CONNECTED" : "OFFLINE"}</em></span>
          <span data-state={snapshot.counts.critical ? "attention" : "ready"}><BellRing /><b>ATTENTION</b><em>{snapshot.counts.critical + snapshot.counts.warning}</em></span>
        </div>
      </div>
    </header>

    {selectedSignal ? <div className={styles.signalBackdrop} role="dialog" aria-modal="true" onMouseDown={() => setSelectedSignal(null)}>
      <article className={styles.resolutionPanel} onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span className={styles[`signalTone_${selectedSignal.severity}`]}>{selectedSignal.ruleCode}</span><small>{familyLabels[selectedSignal.family]} · snapshot {formatSnapshot(snapshotAt)}</small><h2>{selectedSignal.message}</h2></div><button onClick={() => setSelectedSignal(null)}><X /></button></header>
        <section className={styles.resolutionWhy}><span>WHAT HAPPENED</span><p>{selectedSignal.detail}</p></section>
        <section className={styles.resolutionWhy}><span>WHY IT MATTERS</span><p>{selectedSignal.title}. Source de vérité : <b>{selectedSignal.source}</b>.</p></section>
        <section className={styles.resolutionAction}><span>RECOMMENDED RESOLUTION</span><p>{selectedSignal.resolution}</p><button onClick={() => setSelectedSignal(null)}>{selectedSignal.actionLabel || "Acknowledge"}<ArrowRight /></button></section>
        <footer><LockKeyhole /><span>Signal dérivé du snapshot actuel. Aucun KPI ou état n’est fabriqué.</span></footer>
      </article>
    </div> : null}

    {rulesOpen ? <div className={styles.ruleBackdrop} role="dialog" aria-modal="true">
      <section className={styles.ruleCenter}>
        <header><div><span>ANGELCARE BROADCAST GOVERNANCE</span><h2>{BROADCAST_RULES.length} canonical operating rules.</h2><p>Règles déclaratives, résolutions opérateur et sources de vérité — le rail ne contient pas de message décoratif.</p></div><button onClick={() => setRulesOpen(false)}><X /></button></header>
        <div className={styles.ruleControls}><label><Search /><input value={ruleQuery} onChange={(event) => setRuleQuery(event.target.value)} placeholder="Code, condition, source, résolution…" /></label><select value={ruleFamily} onChange={(event) => setRuleFamily(event.target.value as BroadcastFamily | "all")}><option value="all">Toutes les familles</option>{(Object.keys(familyLabels) as BroadcastFamily[]).map((family) => <option key={family} value={family}>{familyLabels[family]}</option>)}</select><div><b>{rules.length}</b><span>rules visible</span></div></div>
        <div className={styles.ruleGrid}>{rules.map((item) => <RuleCard key={item.code} rule={item} />)}</div>
      </section>
    </div> : null}
  </>
}

function RuleCard({ rule }: { rule: BroadcastRule }) {
  return <article className={styles.ruleCard}>
    <header><span>{rule.code}</span><em data-severity={rule.defaultSeverity}>{severityLabels[rule.defaultSeverity]}</em></header>
    <h3>{rule.title}</h3>
    <dl><div><dt>TRIGGER</dt><dd>{rule.condition}</dd></div><div><dt>TRUTH SOURCE</dt><dd>{rule.source}</dd></div><div><dt>RESOLUTION</dt><dd>{rule.resolution}</dd></div></dl>
    <footer><span>{familyLabels[rule.family]}</span><b>{rule.dedupeMinutes}m dedupe</b></footer>
  </article>
}

export function MZ4WorkspacePrelude({ data, universe, snapshotAt, navigate }: PreludeProps) {
  if (universe === "command") return <CommandPrelude data={data} snapshotAt={snapshotAt} navigate={navigate} />
  if (universe === "studio") return <StudioPrelude data={data} snapshotAt={snapshotAt} navigate={navigate} />
  if (universe === "publish") return <PublishPrelude data={data} snapshotAt={snapshotAt} navigate={navigate} />
  if (universe === "engage") return <EngagePrelude data={data} snapshotAt={snapshotAt} navigate={navigate} />
  if (universe === "automate") return <AutomatePrelude data={data} snapshotAt={snapshotAt} navigate={navigate} />
  return <ControlPrelude data={data} snapshotAt={snapshotAt} navigate={navigate} />
}

function CommandPrelude({ data, snapshotAt, navigate }: Omit<PreludeProps, "universe">) {
  const snapshot = useMemo(() => buildBroadcastSnapshot(data, snapshotAt), [data, snapshotAt])
  const mz2 = data.mz2
  const openRelationships = (mz2?.conversations || []).filter(isOpenConversation).length
  const unread = (mz2?.conversations || []).reduce((total, conversation) => total + conversation.unread_count, 0)
  const nextPublication = data.publications.filter((publication) => publication.scheduled_at && new Date(publication.scheduled_at).getTime() >= new Date(snapshotAt).getTime()).sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0]
  const brief = [
    data.connection?.connection_health === "healthy" ? "Réseau Meta connecté." : "Le réseau Meta demande une vérification.",
    `${data.stats.todayPublished} publication${data.stats.todayPublished === 1 ? "" : "s"} confirmée${data.stats.todayPublished === 1 ? "" : "s"} aujourd’hui; ${data.stats.todayScheduled} planifiée${data.stats.todayScheduled === 1 ? "" : "s"}.`,
    openRelationships ? `${openRelationships} relation${openRelationships > 1 ? "s" : ""} ouverte${openRelationships > 1 ? "s" : ""}, dont ${unread} message${unread === 1 ? "" : "s"} non lu${unread === 1 ? "" : "s"}.` : "Aucune relation ouverte dans le snapshot chargé.",
    snapshot.counts.critical ? `${snapshot.counts.critical} signal${snapshot.counts.critical > 1 ? "s" : ""} critique${snapshot.counts.critical > 1 ? "s" : ""} réclame${snapshot.counts.critical > 1 ? "nt" : ""} une lecture opérateur.` : "Aucun signal critique dans le snapshot actuel.",
  ]
  return <section className={styles.commandPrelude}>
    <div className={styles.commandBrief}>
      <span>EXECUTIVE LIVE BRIEF · SNAP {formatSnapshot(snapshotAt)}</span>
      <h2>La situation sociale en une lecture.</h2>
      <div>{brief.map((line, index) => <p key={line}><b>{String(index + 1).padStart(2, "0")}</b>{line}</p>)}</div>
      <footer><button onClick={() => navigate("command", "performance")}><TrendingUp />Social Intelligence</button><button onClick={() => navigate("publish", "temporal")}><CalendarClock />Next 24h</button></footer>
    </div>
    <div className={styles.commandPressure}>
      <header><Crosshair /><div><span>OPERATOR ATTENTION</span><b>{snapshot.counts.critical + snapshot.counts.warning + snapshot.counts.attention}</b></div></header>
      <div>{topSignals(snapshot, 4).map((item) => <article key={item.id} data-severity={item.severity}><i /><div><b>{item.message}</b><small>{item.detail}</small></div><span>{item.ruleCode}</span></article>)}</div>
    </div>
    <div className={styles.commandNext}>
      <span>NEXT OPERATIONAL PRESSURE</span>
      {nextPublication ? <><div className={styles.departureTime}>{formatWhen(nextPublication.scheduled_at)}</div><h3>{nextPublication.title}</h3><p>{nextPublication.format.toUpperCase()} · {nextPublication.channels.join(" + ")}</p><button onClick={() => navigate("publish", "temporal")}>Open runway <ArrowRight /></button></> : <><Check /><h3>Aucune sortie future.</h3><p>Le runway reste vrai : aucun départ n’est inventé.</p><button onClick={() => navigate("studio", "create")}>Prepare content <ArrowRight /></button></>}
    </div>
  </section>
}

function StudioPrelude({ data, snapshotAt, navigate }: Omit<PreludeProps, "universe">) {
  const drafts = data.publications.filter((publication) => publication.status === "draft").length
  const readyAssets = data.assets.filter((asset) => asset.status === "ready").length
  const activeCampaigns = data.campaigns.filter((campaign) => campaign.status === "active").length
  const scheduled = data.publications.filter((publication) => publication.scheduled_at && new Date(publication.scheduled_at).getTime() >= new Date(snapshotAt).getTime()).length
  const factory = [
    ["IDEA", "Intent & objective", activeCampaigns],
    ["BRIEF", "Campaign context", data.campaigns.length],
    ["ASSETS", "Windows Vault", readyAssets],
    ["COPY", "Draft inventory", drafts],
    ["VALIDATE", "Truth & brand", data.publications.filter((publication) => ["ready", "scheduled"].includes(publication.status)).length],
    ["SCHEDULE", "Future departures", scheduled],
  ] as const
  const serviceLines = ["Kindergarten & Preschool", "Hospitality Kids Friendly", "Academy", "Home Service", "Corporates Liner"]
  return <section className={styles.studioPrelude}>
    <div className={styles.factoryMap}>
      <header><div><span>CONTENT FACTORY</span><h2>De l’intention à l’exécution, sans perte de contexte.</h2></div><button onClick={() => navigate("studio", "create")}><WandSparkles />New creative</button></header>
      <div>{factory.map(([name, detail, count], index) => <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><div><b>{name}</b><small>{detail}</small></div><strong>{count}</strong>{index < factory.length - 1 ? <ArrowRight /> : <Check />}</article>)}</div>
    </div>
    <div className={styles.brandCommand}>
      <header><ShieldCheck /><div><span>BRAND COMMAND</span><b>Official identity registered</b></div></header>
      <div className={styles.brandLogoMini}><img src="/angelcare-social-command-official-logo.png" alt="AngelCare official identity" /></div>
      <p>L’actif officiel reste immuable; les variantes doivent être dérivées de la charte, jamais régénérées.</p>
      <div className={styles.serviceLines}>{serviceLines.map((line) => <span key={line}>{line}</span>)}</div>
    </div>
    <div className={styles.studioDemand}>
      <span>CREATIVE PRESSURE</span><strong>{drafts}</strong><small>drafts</small>
      <div><b>{readyAssets}</b><span>assets ready</span></div><div><b>{activeCampaigns}</b><span>campaigns active</span></div>
      <button onClick={() => navigate("studio", "vault")}>Open Media Vault <ArrowRight /></button>
    </div>
  </section>
}

function PublishPrelude({ data, snapshotAt, navigate }: Omit<PreludeProps, "universe">) {
  const now = new Date(snapshotAt).getTime()
  const future = data.publications.filter((publication) => publication.scheduled_at && new Date(publication.scheduled_at).getTime() >= now).sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
  const failed = data.jobs.filter((job) => job.status === "failed")
  const queue = data.jobs.filter((job) => ["queued", "preparing", "publishing", "confirming", "retrying"].includes(job.status))
  const departures = future.slice(0, 5)
  return <section className={styles.publishPrelude}>
    <div className={styles.dispatchBoard}>
      <header><div><span>PUBLICATION DISPATCH</span><h2>Departure board</h2></div><div><b>{queue.length}</b><span>jobs moving</span></div></header>
      <div>{departures.map((publication, index) => <article key={publication.id}><span>{String(index + 1).padStart(2, "0")}</span><time>{new Date(publication.scheduled_at!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</time><div><b>{publication.title}</b><small>{publication.format.toUpperCase()} · {publication.channels.join(" + ")}</small></div><em data-state={publication.status}>{publication.status}</em></article>)}{!departures.length ? <p>Aucun départ futur enregistré.</p> : null}</div>
    </div>
    <div className={styles.publishControlTower}>
      <header><Radio /><span>CONTROL TOWER</span></header>
      <dl><div><dt>Scheduled</dt><dd>{future.length}</dd></div><div><dt>Queue</dt><dd>{queue.length}</dd></div><div data-alert={failed.length ? "true" : undefined}><dt>Failures</dt><dd>{failed.length}</dd></div><div><dt>Media ready</dt><dd>{data.assets.filter((asset) => asset.status === "ready").length}</dd></div></dl>
      <button onClick={() => navigate("publish", "failures")}>Open recovery <ArrowRight /></button>
    </div>
    <div className={styles.publishWindow}>
      <span>NEXT WINDOW</span>
      {future[0] ? <><CalendarClock /><h3>{formatWhen(future[0].scheduled_at)}</h3><p>{future[0].title}</p><small>{hoursUntil(future[0].scheduled_at, snapshotAt)?.toFixed(1)}h from snapshot</small></> : <><CalendarDays /><h3>Runway clear</h3><p>No future departure in the loaded snapshot.</p></>}
      <button onClick={() => navigate("publish", "temporal")}>Temporal Command <ArrowRight /></button>
    </div>
  </section>
}

function EngagePrelude({ data, snapshotAt, navigate }: Omit<PreludeProps, "universe">) {
  const mz2 = data.mz2
  const conversations = mz2?.conversations || []
  const comments = mz2?.comments || []
  const open = conversations.filter(isOpenConversation)
  const unread = conversations.reduce((total, conversation) => total + conversation.unread_count, 0)
  const slaRisk = open.filter((conversation) => conversation.due_at && new Date(conversation.due_at).getTime() - new Date(snapshotAt).getTime() <= 30 * 60_000)
  const commercial = open.filter(commercialIntent)
  const sensitive = comments.filter((comment) => ["priority", "sensitive"].includes(comment.status)).length + open.filter((conversation) => conversation.priority === "high" || conversation.status === "priority").length
  return <section className={styles.engagePrelude}>
    <div className={styles.relationshipRadar}>
      <header><div><span>RELATIONSHIP OPERATIONS</span><h2>L’interaction devient un dossier opérable.</h2></div><HeartHandshake /></header>
      <div className={styles.relationshipMetrics}><article><b>{open.length}</b><span>open</span></article><article><b>{unread}</b><span>unread</span></article><article data-alert={slaRisk.length ? "true" : undefined}><b>{slaRisk.length}</b><span>SLA risk</span></article><article data-alert={sensitive ? "true" : undefined}><b>{sensitive}</b><span>sensitive</span></article><article><b>{commercial.length}</b><span>commercial intent</span></article></div>
      <footer><button onClick={() => navigate("engage", "inbox")}><MessageCircleMore />Live Inbox</button><button onClick={() => navigate("engage", "priority")}><AlertTriangle />Priority</button></footer>
    </div>
    <div className={styles.engageSla}>
      <span>SLA & OWNERSHIP</span>
      <div>{slaRisk.slice(0, 4).map((conversation) => <article key={conversation.id}><i /><div><b>{conversation.participant_name || conversation.participant_username || "Instagram contact"}</b><small>{conversation.triage_category || "unclassified"}</small></div><time>{conversation.due_at ? formatWhen(conversation.due_at) : "—"}</time></article>)}{!slaRisk.length ? <div className={styles.engageClear}><Check /><b>No relationship at SLA risk</b><small>Snapshot {formatSnapshot(snapshotAt)}</small></div> : null}</div>
    </div>
    <div className={styles.commercialSignals}>
      <span>SOCIAL → REVENUE SIGNALS</span><strong>{commercial.length}</strong><p>Interactions whose structured triage/tags indicate commercial intent.</p>
      <div>{commercial.slice(0, 3).map((conversation) => <span key={conversation.id}>{conversation.participant_name || conversation.participant_username || "contact"} · {conversation.triage_category || "intent"}</span>)}</div>
      <small>Aucun lead n’est inventé lorsque le triage réel ne le démontre pas.</small>
    </div>
  </section>
}

function AutomatePrelude({ data, snapshotAt, navigate }: Omit<PreludeProps, "universe">) {
  const automations = data.mz2?.automations || []
  const runs = data.mz2?.automationRuns || []
  const active = automations.filter((automation) => automation.status === "active")
  const failedRuns = runs.filter((run) => run.status === "failed")
  const modes = {
    automatic: automations.filter((automation) => automation.execution_mode === "automatic").length,
    proposal: automations.filter((automation) => automation.execution_mode === "proposal").length,
    manual: automations.filter((automation) => automation.execution_mode === "manual").length,
  }
  return <section className={styles.automatePrelude}>
    <div className={styles.automationCore}>
      <header><Zap /><div><span>AUTOMATION OPERATING CORE</span><h2>{active.length} armed · {failedRuns.length} failed runs</h2></div></header>
      <div className={styles.modeRail}><article><Bot /><b>{modes.automatic}</b><span>AUTOMATIC</span></article><article><Sparkles /><b>{modes.proposal}</b><span>PROPOSAL</span></article><article><UserRoundCheck /><b>{modes.manual}</b><span>MANUAL</span></article></div>
      <footer><button onClick={() => navigate("automate", "lab")}>Open Automation Lab <ArrowRight /></button></footer>
    </div>
    <div className={styles.broadcastGovernance}>
      <header><Radio /><div><span>BROADCAST GOVERNANCE</span><strong>{BROADCAST_RULES.length}</strong><small>canonical rules</small></div></header>
      <p>Le rail MZ4 évalue uniquement des signaux dérivés du snapshot chargé. Il ne déclenche aucune mutation métier.</p>
      <div>{Object.entries(familyLabels).slice(0, 6).map(([family, label]) => <span key={family}><i />{label}<b>{BROADCAST_RULES.filter((item) => item.family === family).length}</b></span>)}</div>
    </div>
    <div className={styles.automationRunway}>
      <span>RECENT RUNS</span>
      <div>{runs.slice(0, 5).map((run) => <article key={run.id} data-state={run.status}><i /><div><b>{run.automation_code}</b><small>{run.decision || run.trigger_type}</small></div><em>{run.status}</em></article>)}{!runs.length ? <p>Aucune exécution enregistrée.</p> : null}</div>
      <small>Snapshot {formatSnapshot(snapshotAt)} · no background polling</small>
    </div>
  </section>
}

function ControlPrelude({ data, snapshotAt, navigate }: Omit<PreludeProps, "universe">) {
  const capabilityRows = capabilityMatrix(data)
  const healthy = capabilityRows.filter((row) => row.tone === "ready").length
  const attention = capabilityRows.length - healthy
  return <section className={styles.controlPrelude}>
    <div className={styles.capabilityMatrix}>
      <header><div><span>CAPABILITY INTELLIGENCE</span><h2>Support n’est jamais supposé.</h2><p>Platform → access → account → permission → implementation → runtime → user availability.</p></div><div><b>{healthy}</b><span>ready</span><b>{attention}</b><span>attention</span></div></header>
      <div className={styles.capabilityRows}>{capabilityRows.map((row) => <article key={row.name}><div><span>{row.channel}</span><b>{row.name}</b></div>{row.gates.map((gate) => <span key={gate.label} data-state={gate.state}><small>{gate.label}</small><b>{gate.value}</b></span>)}<em data-tone={row.tone}>{row.status}</em></article>)}</div>
      <footer><button onClick={() => navigate("control", "capabilities")}>Open capability detail <ArrowRight /></button><button onClick={() => navigate("control", "webhooks")}>Webhook control <Radio /></button></footer>
    </div>
    <div className={styles.controlPosture}>
      <span>SOVEREIGN CONTROL POSTURE</span>
      <dl><div><dt>Meta</dt><dd>{data.connection?.connection_health || "disconnected"}</dd></div><div><dt>Windows</dt><dd>{data.storage.healthy ? "healthy" : "attention"}</dd></div><div><dt>Webhook</dt><dd>{data.mz2?.webhook?.verified ? "verified" : "not verified"}</dd></div><div><dt>AI</dt><dd>{data.mz2?.ai?.configured ? "configured" : "not configured"}</dd></div></dl>
      <footer><LockKeyhole /><small>Snapshot truth · {formatSnapshot(snapshotAt)}</small></footer>
    </div>
  </section>
}

type MatrixRow = {
  name: string
  channel: string
  status: string
  tone: "ready" | "attention" | "blocked"
  gates: Array<{ label: string; value: string; state: "ready" | "attention" | "unknown" | "blocked" }>
}

function capabilityMatrix(data: SocialBootstrap): MatrixRow[] {
  const capabilities = data.mz2?.capabilities || []
  const byName = (predicate: (capability: SocialChannelCapability) => boolean) => capabilities.find(predicate)
  const igPublish = byName((capability) => capability.channel === "instagram" && /(publish|post)/i.test(capability.capability))
  const igMessages = byName((capability) => capability.channel === "instagram" && /(message|dm)/i.test(capability.capability))
  const fbPublish = byName((capability) => capability.channel === "facebook" && /(publish|post)/i.test(capability.capability))
  const rows: Array<{ name: string; channel: string; highLevel: boolean; detailed?: SocialChannelCapability; runtime: boolean; implementation: string }> = [
    { name: "Instagram publishing", channel: "INSTAGRAM", highLevel: data.capabilities.instagramPublish, detailed: igPublish, runtime: Boolean(data.connection), implementation: "IMPLEMENTED" },
    { name: "Instagram messages", channel: "INSTAGRAM", highLevel: data.capabilities.instagramMessages, detailed: igMessages, runtime: Boolean(data.mz2), implementation: "IMPLEMENTED" },
    { name: "Facebook publishing", channel: "FACEBOOK", highLevel: data.capabilities.facebookPublish, detailed: fbPublish, runtime: Boolean(data.connection), implementation: "IMPLEMENTED" },
    { name: "Facebook Page Story", channel: "FACEBOOK", highLevel: data.capabilities.facebookStory, runtime: Boolean(data.connection), implementation: data.capabilities.facebookStory ? "IMPLEMENTED" : "NOT CLAIMED" },
    { name: "Meta webhooks", channel: "META", highLevel: Boolean(data.mz2?.webhook?.configured), runtime: Boolean(data.mz2?.webhook?.verified), implementation: "IMPLEMENTED" },
    { name: "Windows Media Vault", channel: "WINDOWS", highLevel: data.storage.configured, runtime: data.storage.healthy, implementation: "IMPLEMENTED" },
    { name: "AI Provider Control", channel: "ANGELCARE", highLevel: Boolean(data.mz2?.ai?.configured), runtime: Boolean(data.mz2?.ai?.configured), implementation: "IMPLEMENTED" },
  ]
  return rows.map((item) => {
    const supported = item.detailed ? item.detailed.supported : item.highLevel
    const state = item.detailed?.state
    const status = item.detailed ? capabilityLabel(state, item.detailed.supported) : item.runtime && item.highLevel ? "AVAILABLE" : item.highLevel ? "AVAILABLE WITH LIMITS" : "UNAVAILABLE"
    const tone = item.detailed ? capabilityTone(state, item.detailed.supported) : item.runtime && item.highLevel ? "ready" : item.highLevel ? "attention" : "blocked"
    return {
      name: item.name,
      channel: item.channel,
      status,
      tone,
      gates: [
        { label: "PLATFORM", value: item.detailed?.source ? "OBSERVED" : "NOT OBSERVED", state: item.detailed?.source ? "ready" : "unknown" },
        { label: "APP ACCESS", value: supported ? "YES" : "NO", state: supported ? "ready" : "blocked" },
        { label: "PERMISSION", value: state === "permission_missing" ? "MISSING" : supported ? "OK" : "UNKNOWN", state: state === "permission_missing" ? "blocked" : supported ? "ready" : "unknown" },
        { label: "ANGELCARE", value: item.implementation, state: item.implementation === "IMPLEMENTED" ? "ready" : "unknown" },
        { label: "RUNTIME", value: item.runtime ? "HEALTHY" : "CHECK", state: item.runtime ? "ready" : "attention" },
      ],
    }
  })
}
