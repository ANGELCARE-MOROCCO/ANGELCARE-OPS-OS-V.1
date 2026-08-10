"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarClock,
  Check,
  CircleDot,
  Clock3,
  FileCheck2,
  FileText,
  Fingerprint,
  Gauge,
  HardDrive,
  Images,
  Layers3,
  LockKeyhole,
  MessageCircleMore,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  UserRoundCheck,
  WandSparkles,
  Zap,
} from "lucide-react"
import type { SocialBootstrap, SocialCampaign, SocialPublication } from "@/lib/social-command/types"
import { BROADCAST_RULES, buildBroadcastSnapshot, type BroadcastFamily } from "@/lib/social-command/mz4-broadcast"
import styles from "./SocialCommandMZ4.module.css"

function fmt(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function MZ4ExecutiveWorkspace({ data, snapshotAt, navigate }: { data: SocialBootstrap; snapshotAt: string; navigate: (universe: any, view?: string) => void }) {
  const snapshot = useMemo(() => buildBroadcastSnapshot(data, snapshotAt), [data, snapshotAt])
  const critical = snapshot.signals.filter((signal) => signal.severity === "critical")
  const attention = snapshot.signals.filter((signal) => ["critical", "warning", "attention"].includes(signal.severity))
  const activeCampaigns = data.campaigns.filter((campaign) => campaign.status === "active")
  const openRelationships = (data.mz2?.conversations || []).filter((conversation) => !["resolved", "archived"].includes(conversation.status))
  const next = data.publications.filter((publication) => publication.scheduled_at && new Date(publication.scheduled_at).getTime() >= new Date(snapshotAt).getTime()).sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()).slice(0, 8)
  return <div className={styles.executiveWorkspace}>
    <section className={styles.executiveHero}>
      <div><span>ANGELCARE · EXECUTIVE SOCIAL BRIEF</span><h2>Le réseau social comme responsabilité exécutive.</h2><p>Une lecture consolidée de l’exécution, de la relation, des risques et du prochain mouvement — basée uniquement sur le snapshot actuel.</p></div>
      <aside><b>{critical.length ? "ATTENTION" : "CONTROLLED"}</b><strong>{critical.length}</strong><span>critical signals</span><small>Snapshot {new Date(snapshotAt).toLocaleTimeString("fr-FR")}</small></aside>
    </section>
    <section className={styles.executiveKpis}>
      <article><span>PUBLISHING</span><b>{data.stats.todayPublished}</b><small>published today</small></article>
      <article><span>RUNWAY</span><b>{data.stats.todayScheduled}</b><small>scheduled today</small></article>
      <article><span>CAMPAIGNS</span><b>{activeCampaigns.length}</b><small>active</small></article>
      <article><span>RELATIONSHIPS</span><b>{openRelationships.length}</b><small>open</small></article>
      <article><span>ATTENTION</span><b>{attention.length}</b><small>signals</small></article>
      <article><span>MEDIA</span><b>{data.assets.filter((asset) => asset.status === "ready").length}</b><small>ready assets</small></article>
    </section>
    <div className={styles.executiveBody}>
      <section className={styles.executiveAttention}><header><AlertTriangle/><div><span>EXECUTIVE ATTENTION QUEUE</span><h3>Ce qui mérite une décision maintenant.</h3></div></header><div>{attention.slice(0, 9).map((signal) => <article key={signal.id} data-severity={signal.severity}><span>{signal.ruleCode}</span><div><b>{signal.message}</b><p>{signal.detail}</p></div><em>{signal.severity}</em></article>)}{!attention.length ? <div className={styles.truthEmpty}><Check/><div><b>Aucun signal d’attention.</b><p>La file reste vide plutôt que de fabriquer un problème.</p></div></div> : null}</div></section>
      <section className={styles.executiveRunway}><header><CalendarClock/><div><span>NEXT 24 HOURS</span><h3>Publishing pressure</h3></div></header><div>{next.map((publication, index) => <article key={publication.id}><span>{String(index + 1).padStart(2, "0")}</span><time>{fmt(publication.scheduled_at)}</time><div><b>{publication.title}</b><small>{publication.format.toUpperCase()} · {publication.channels.join(" + ")}</small></div></article>)}{!next.length ? <div className={styles.truthEmpty}><Clock3/><div><b>Aucun départ futur.</b><p>Aucune sortie n’est inventée.</p></div></div> : null}</div><footer><button onClick={() => navigate("publish", "temporal")}>Temporal Command <ArrowRight/></button></footer></section>
      <section className={styles.executiveCampaigns}><header><Target/><div><span>CAMPAIGN PORTFOLIO</span><h3>Operating streams</h3></div></header>{activeCampaigns.slice(0, 6).map((campaign) => <CampaignMini key={campaign.id} campaign={campaign} publications={data.publications.filter((publication) => publication.campaign_id === campaign.id)} />)}{!activeCampaigns.length ? <div className={styles.truthEmpty}><CircleDot/><div><b>Aucune campagne active.</b><p>Le portefeuille est réellement calme.</p></div></div> : null}<footer><button onClick={() => navigate("studio", "campaigns")}>Open campaigns <ArrowRight/></button></footer></section>
    </div>
  </div>
}

function CampaignMini({ campaign, publications }: { campaign: SocialCampaign; publications: SocialPublication[] }) {
  const published = publications.filter((publication) => publication.status === "published").length
  const pct = publications.length ? Math.round((published / publications.length) * 100) : 0
  return <article className={styles.campaignMini}><div><b>{campaign.title}</b><small>{campaign.objective || "Objectif non renseigné"}</small></div><span>{publications.length} content</span><em>{pct}% published</em><i><span style={{ width: `${pct}%` }} /></i></article>
}

export function MZ4StudioWorkspace({ view, data, navigate }: { view: "factory" | "brand"; data: SocialBootstrap; navigate: (universe: any, view?: string) => void }) {
  if (view === "brand") return <BrandGovernanceWorkspace data={data} navigate={navigate} />
  return <ContentFactoryWorkspace data={data} navigate={navigate} />
}

function ContentFactoryWorkspace({ data, navigate }: { data: SocialBootstrap; navigate: (universe: any, view?: string) => void }) {
  const stages = [
    { code: "01", label: "INTENT", desc: "Campaign objective", count: data.campaigns.filter((campaign) => campaign.status === "active").length, icon: <Target/> },
    { code: "02", label: "BRIEF", desc: "Context & ownership", count: data.campaigns.filter((campaign) => Boolean(campaign.objective)).length, icon: <FileText/> },
    { code: "03", label: "MEDIA", desc: "Windows Vault ready", count: data.assets.filter((asset) => asset.status === "ready").length, icon: <Images/> },
    { code: "04", label: "CREATE", desc: "Draft inventory", count: data.publications.filter((publication) => publication.status === "draft").length, icon: <WandSparkles/> },
    { code: "05", label: "READY", desc: "Prepared for runway", count: data.publications.filter((publication) => publication.status === "ready").length, icon: <FileCheck2/> },
    { code: "06", label: "SCHEDULE", desc: "Timed departures", count: data.publications.filter((publication) => publication.status === "scheduled").length, icon: <CalendarClock/> },
    { code: "07", label: "PUBLISH", desc: "Provider confirmed", count: data.publications.filter((publication) => publication.status === "published").length, icon: <BadgeCheck/> },
    { code: "08", label: "LEARN", desc: "Measured intelligence", count: data.mz2?.performance?.metrics?.length || 0, icon: <Gauge/> },
  ]
  return <div className={styles.factoryWorkspace}>
    <header><div><span>SOCIAL STUDIO · CONTENT FACTORY</span><h2>One operating lineage from idea to learning.</h2><p>Chaque étape lit les mêmes objets réels. Aucun faux workflow, aucune fausse approbation.</p></div><div><button onClick={() => navigate("studio", "create")}><WandSparkles/>Create</button><button onClick={() => navigate("studio", "vault")}><HardDrive/>Media Vault</button></div></header>
    <section className={styles.factoryStages}>{stages.map((stage, index) => <article key={stage.code}><span>{stage.code}</span><div className={styles.factoryStageIcon}>{stage.icon}</div><h3>{stage.label}</h3><p>{stage.desc}</p><strong>{stage.count}</strong>{index < stages.length - 1 ? <ArrowRight/> : <Check/>}</article>)}</section>
    <div className={styles.factoryLower}>
      <section className={styles.factoryDrafts}><header><Layers3/><div><span>DRAFT FLOW</span><h3>Work waiting to mature</h3></div></header>{data.publications.filter((publication) => publication.status === "draft").slice(0, 8).map((publication) => <article key={publication.id}><span>{publication.format.toUpperCase()}</span><div><b>{publication.title}</b><small>{publication.channels.join(" + ")} · {publication.media?.length || 0} media</small></div><button onClick={() => navigate("studio", "drafts")}>Open <ArrowRight/></button></article>)}{!data.publications.some((publication) => publication.status === "draft") ? <div className={styles.truthEmpty}><Check/><div><b>Aucun brouillon.</b><p>Le factory ne fabrique pas de stock.</p></div></div> : null}</section>
      <section className={styles.factoryGovernance}><header><ShieldCheck/><div><span>FACTORY GOVERNANCE</span><h3>Truth before velocity</h3></div></header><ul><li><Check/>Campaign context remains linked.</li><li><Check/>Media stays in Windows Vault.</li><li><Check/>Provider confirmation determines publish truth.</li><li><Check/>AI output remains editable before action.</li><li><Check/>Missing provider data remains unavailable, never zero.</li></ul></section>
    </div>
  </div>
}

function BrandGovernanceWorkspace({ data, navigate }: { data: SocialBootstrap; navigate: (universe: any, view?: string) => void }) {
  const services = ["Kindergarten & Preschool", "Hospitality Kids Friendly", "Academy", "Home Service", "Corporates Liner"]
  const drafts = data.publications.filter((publication) => publication.status === "draft")
  const withoutCampaign = drafts.filter((publication) => !publication.campaign_id)
  const withoutCaption = drafts.filter((publication) => publication.format !== "story" && !publication.caption.trim())
  const withoutMedia = drafts.filter((publication) => !(publication.media?.length))
  return <div className={styles.brandWorkspace}>
    <header><div className={styles.brandHeroLogo}><img src="/angelcare-social-command-official-logo.png" alt="AngelCare official logo" /></div><div><span>ANGELCARE BRAND COMMAND</span><h2>Identity is an operating asset, not decoration.</h2><p>The official logo asset is registered by exact binary provenance and must never be regenerated, approximated or substituted.</p></div><aside><LockKeyhole/><b>IMMUTABLE</b><small>official asset</small></aside></header>
    <section className={styles.brandServices}>{services.map((service, index) => <article key={service}><span>{String(index + 1).padStart(2, "0")}</span><b>{service}</b><small>Approved service-line context</small></article>)}</section>
    <div className={styles.brandBody}>
      <section className={styles.brandAudit}><header><FileCheck2/><div><span>CURRENT DRAFT READINESS</span><h3>{drafts.length} drafts inspected from live data</h3></div></header><div><article data-alert={withoutCampaign.length ? "true" : undefined}><b>{withoutCampaign.length}</b><span>without campaign</span><p>Add context when the draft belongs to a campaign; do not force one otherwise.</p></article><article data-alert={withoutCaption.length ? "true" : undefined}><b>{withoutCaption.length}</b><span>without caption</span><p>Stories may remain visual-first; non-story drafts need deliberate copy before execution.</p></article><article data-alert={withoutMedia.length ? "true" : undefined}><b>{withoutMedia.length}</b><span>without media</span><p>Attach registered Vault assets before media-dependent publication.</p></article></div></section>
      <section className={styles.brandDoctrine}><span>NON-NEGOTIABLE BRAND DOCTRINE</span><ul><li><ShieldCheck/>Exact official logo only.</li><li><ShieldCheck/>White enterprise environment.</li><li><ShieldCheck/>Institutional hierarchy before promotion.</li><li><ShieldCheck/>Purpose-specific creative by service line.</li><li><ShieldCheck/>No fake KPI or invented performance.</li></ul><button onClick={() => navigate("studio", "templates")}>Open creative structures <ArrowRight/></button></section>
    </div>
  </div>
}

export function MZ4DispatchWorkspace({ data, snapshotAt, navigate }: { data: SocialBootstrap; snapshotAt: string; navigate: (universe: any, view?: string) => void }) {
  const now = new Date(snapshotAt).getTime()
  const future = data.publications.filter((publication) => publication.scheduled_at && new Date(publication.scheduled_at).getTime() >= now).sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
  const jobsByPublication = new Map<string, typeof data.jobs>()
  for (const job of data.jobs) jobsByPublication.set(job.publication_id, [...(jobsByPublication.get(job.publication_id) || []), job])
  return <div className={styles.dispatchWorkspace}>
    <header><div><span>ANGELCARE PUBLISH · DISPATCH</span><h2>Content departures, controlled like operations.</h2><p>Timing, media readiness, execution jobs and provider truth in one departure board.</p></div><aside><Radio/><div><b>{future.length}</b><span>future departures</span></div></aside></header>
    <section className={styles.dispatchTable}><div className={styles.dispatchTableHead}><span>FLT</span><span>TIME</span><span>CONTENT</span><span>CHANNEL</span><span>MEDIA</span><span>EXECUTION</span><span>STATUS</span></div>{future.slice(0, 24).map((publication, index) => {const jobs=jobsByPublication.get(publication.id) || [];const failed=jobs.some((job) => job.status === "failed");return <article key={publication.id}><span>AC{String(index + 1).padStart(3, "0")}</span><time>{fmt(publication.scheduled_at)}</time><div><b>{publication.title}</b><small>{publication.format.toUpperCase()}</small></div><span>{publication.channels.join(" + ")}</span><span>{publication.media?.length || 0} asset{(publication.media?.length || 0) === 1 ? "" : "s"}</span><span>{jobs.length} job{jobs.length === 1 ? "" : "s"}</span><em data-alert={failed ? "true" : undefined}>{failed ? "FAILURE" : publication.status.toUpperCase()}</em></article>})}{!future.length ? <div className={styles.truthEmpty}><CalendarClock/><div><b>No future departures.</b><p>The board remains empty rather than inventing a schedule.</p></div></div> : null}</section>
    <footer><button onClick={() => navigate("publish", "temporal")}>Temporal Command <ArrowRight/></button><button onClick={() => navigate("publish", "failures")}>Failure recovery <AlertTriangle/></button></footer>
  </div>
}

export function MZ4BroadcastRulesWorkspace({ data, snapshotAt }: { data: SocialBootstrap; snapshotAt: string }) {
  const snapshot = useMemo(() => buildBroadcastSnapshot(data, snapshotAt), [data, snapshotAt])
  const [family, setFamily] = useState<BroadcastFamily | "all">("all")
  const [query, setQuery] = useState("")
  const families = Array.from(new Set(BROADCAST_RULES.map((rule) => rule.family)))
  const rules = BROADCAST_RULES.filter((rule) => (family === "all" || rule.family === family) && (!query || `${rule.code} ${rule.title} ${rule.condition} ${rule.resolution}`.toLowerCase().includes(query.toLowerCase())))
  return <div className={styles.broadcastRulesWorkspace}>
    <header><div><span>AUTOMATE · BROADCAST GOVERNANCE</span><h2>{BROADCAST_RULES.length} canonical signal rules.</h2><p>This engine interprets snapshot truth for operator broadcasting. It does not mutate Meta or business records.</p></div><aside><b>{snapshot.signals.length}</b><span>active signals</span><small>{snapshot.counts.critical} critical · {snapshot.counts.warning} warning</small></aside></header>
    <section className={styles.broadcastFamilyMap}>{families.map((item) => <button key={item} className={family === item ? styles.broadcastFamilyActive : ""} onClick={() => setFamily(item)}><span>{item.toUpperCase()}</span><b>{BROADCAST_RULES.filter((rule) => rule.family === item).length}</b><small>{snapshot.signals.filter((signal) => signal.family === item).length} active</small></button>)}</section>
    <section className={styles.broadcastRuleSearch}><label><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rule, condition or resolution…" /></label><button onClick={() => { setFamily("all"); setQuery("") }}>Reset</button></section>
    <section className={styles.broadcastRuleTable}>{rules.map((rule) => <article key={rule.code}><span>{rule.code}</span><div><b>{rule.title}</b><small>{rule.condition}</small></div><p>{rule.resolution}</p><em>{rule.source}</em></article>)}</section>
  </div>
}

export function MZ4ControlWorkspace({ view, data, snapshotAt }: { view: "governance" | "security" | "retention"; data: SocialBootstrap; snapshotAt: string }) {
  if (view === "security") return <SecurityWorkspace data={data} snapshotAt={snapshotAt} />
  if (view === "retention") return <RetentionWorkspace data={data} snapshotAt={snapshotAt} />
  return <GovernanceWorkspace data={data} snapshotAt={snapshotAt} />
}

function GovernanceWorkspace({ data, snapshotAt }: { data: SocialBootstrap; snapshotAt: string }) {
  const snapshot = useMemo(() => buildBroadcastSnapshot(data, snapshotAt), [data, snapshotAt])
  const truth = [
    ["Meta connection", data.connection ? data.connection.connection_health : "disconnected"],
    ["Windows Vault", data.storage.healthy ? "healthy" : "attention"],
    ["Webhook", data.mz2?.webhook?.verified ? "verified" : "not verified"],
    ["AI Provider", data.mz2?.ai?.configured ? "configured" : "not configured"],
    ["Publishing failures", String(data.jobs.filter((job) => job.status === "failed").length)],
    ["Broadcast critical", String(snapshot.counts.critical)],
  ]
  return <div className={styles.governanceWorkspace}>
    <header><div><span>CONTROL · GOVERNANCE</span><h2>Truth, authority and operating boundaries.</h2><p>Governance surfaces actual posture and limitations; it does not manufacture compliance states.</p></div><ShieldCheck/></header>
    <section className={styles.governanceTruth}>{truth.map(([label, value]) => <article key={label}><span>{label}</span><b>{value}</b></article>)}</section>
    <div className={styles.governanceBody}>
      <section><header><LockKeyhole/><div><span>AUTHORITY BOUNDARIES</span><h3>Protected actions stay explicit.</h3></div></header><ul><li><Check/>Credential changes require intentional operator action.</li><li><Check/>Webhook subscription changes remain a Control responsibility.</li><li><Check/>Publishing truth requires provider confirmation.</li><li><Check/>AI output never equals automatic approval.</li><li><Check/>Historical rejection/error evidence remains distinct from current health.</li></ul></section>
      <section><header><Fingerprint/><div><span>AUDIT POSTURE</span><h3>Evidence survives operation.</h3></div></header><dl><div><dt>Operations loaded</dt><dd>{data.operations.length}</dd></div><div><dt>Automation runs loaded</dt><dd>{data.mz2?.automationRuns?.length || 0}</dd></div><div><dt>Webhook events 24h</dt><dd>{data.mz2?.webhook?.events24h || 0}</dd></div><div><dt>Snapshot</dt><dd>{new Date(snapshotAt).toLocaleTimeString("fr-FR")}</dd></div></dl></section>
    </div>
  </div>
}

function SecurityWorkspace({ data, snapshotAt }: { data: SocialBootstrap; snapshotAt: string }) {
  const checks = [
    { title: "Meta credential boundary", status: data.connection ? "OBSERVED" : "NOT OBSERVED", detail: "Primary connection is server-side; secrets are not surfaced in the browser." },
    { title: "Webhook verification", status: data.mz2?.webhook?.verified ? "VERIFIED" : "CHECK", detail: "Verification and event health remain separate truth states." },
    { title: "Windows storage boundary", status: data.storage.configured ? "CONFIGURED" : "CHECK", detail: "Media binaries remain outside Supabase according to the Social Command storage contract." },
    { title: "AI provider boundary", status: data.mz2?.ai?.configured ? "CONFIGURED" : "NOT CONFIGURED", detail: "AI availability is explicit and does not fabricate output when unavailable." },
    { title: "Snapshot discipline", status: "ENFORCED", detail: "MZ4 removed continuous 20-second bootstrap polling; snapshots refresh on load, navigation, mutation or explicit refresh." },
    { title: "Official logo provenance", status: "LOCKED", detail: "MZ4 ships the exact registered AngelCare logo binary with SHA-256 provenance." },
  ]
  return <div className={styles.securityWorkspace}><header><div><span>CONTROL · SECURITY POSTURE</span><h2>Secrets stay invisible. Boundaries stay understandable.</h2><p>This surface reports architecture posture without exposing secret values.</p></div><LockKeyhole/></header><section>{checks.map((check) => <article key={check.title}><span><ShieldCheck/></span><div><b>{check.title}</b><p>{check.detail}</p></div><em>{check.status}</em></article>)}</section><footer>Snapshot {new Date(snapshotAt).toLocaleString("fr-FR")}</footer></div>
}

function RetentionWorkspace({ data, snapshotAt }: { data: SocialBootstrap; snapshotAt: string }) {
  const oldestAsset = [...data.assets].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
  const oldestConversation = [...(data.mz2?.conversations || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
  const cards = [
    { label: "Media assets", count: data.assets.length, oldest: oldestAsset?.created_at || null, policy: "Archive/delete only through an approved media lifecycle; preserve publication lineage." },
    { label: "Publications", count: data.publications.length, oldest: data.publications[0]?.created_at || null, policy: "Keep execution evidence and provider references; archive abandoned drafts intentionally." },
    { label: "Conversations", count: data.mz2?.conversations?.length || 0, oldest: oldestConversation?.created_at || null, policy: "Retention must follow AngelCare privacy/governance policy; MZ4 does not auto-delete relationship history." },
    { label: "Webhook evidence", count: data.mz2?.webhook?.events24h || 0, oldest: null, policy: "Preserve operational evidence required for replay/diagnosis according to backend policy." },
  ]
  return <div className={styles.retentionWorkspace}><header><div><span>CONTROL · DATA RETENTION</span><h2>Lifecycle before deletion.</h2><p>MZ4 deliberately does not invent retention periods. It surfaces inventory and requires policy-backed decisions.</p></div><TimerReset/></header><section>{cards.map((card) => <article key={card.label}><span>{card.label}</span><b>{card.count}</b><small>Oldest observed: {fmt(card.oldest)}</small><p>{card.policy}</p></article>)}</section><footer><AlertTriangle/><span>No automatic destructive retention action is introduced by MZ4. Snapshot {new Date(snapshotAt).toLocaleTimeString("fr-FR")}.</span></footer></div>
}
