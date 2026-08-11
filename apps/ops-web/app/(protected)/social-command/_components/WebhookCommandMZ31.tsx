"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, CheckCircle2, CircleDot, RefreshCw, Radio, ShieldCheck, Webhook, XCircle } from "lucide-react"
import type { SocialBootstrap } from "@/lib/social-command/types"
import styles from "./WebhookCommandMZ31.module.css"

type Props = { data: SocialBootstrap; refresh: () => Promise<void> }
type Snapshot = {
  configured: boolean
  source: "instagram_login"
  host: "graph.instagram.com"
  graphVersion: string
  accountId: string | null
  tokenConfigured: boolean
  desiredFields: string[]
  subscribedFields: string[]
  missingFields: string[]
  unexpectedFields: string[]
  appSubscriptions: Array<{ id: string; subscribedFields: string[] }>
  healthy: boolean
  inspectedAt: string
}

type ApiEnvelope<T> = { ok: boolean; data?: T; error?: string }

async function call<T>(method: "GET" | "POST") {
  const response = await fetch("/api/social-command/instagram-webhook/subscriptions", {
    method,
    cache: "no-store",
    headers: method === "POST" ? { "content-type": "application/json" } : undefined,
    body: method === "POST" ? "{}" : undefined,
  })
  const payload = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` })) as ApiEnvelope<T>
  if (!response.ok || payload.ok === false || !payload.data) throw new Error(payload.error || `HTTP ${response.status}`)
  return payload.data
}

export default function WebhookCommandMZ31({ data, refresh }: Props) {
  const webhook = data.mz2?.webhook
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<"inspect" | "reconcile" | "refresh" | null>(null)

  const inspect = useCallback(async (silent = false) => {
    if (!silent) setBusy("inspect")
    try {
      const next = await call<Snapshot>("GET")
      setSnapshot(next)
      setError("")
      return next
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      return null
    } finally {
      if (!silent) setBusy(null)
    }
  }, [])

  useEffect(() => { void inspect(true) }, [inspect])

  const reconcile = async () => {
    setBusy("reconcile")
    try {
      const result = await call<{ success: true; snapshot: Snapshot }>("POST")
      setSnapshot(result.snapshot)
      setError("")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally { setBusy(null) }
  }

  const refreshSnapshot = async () => {
    setBusy("refresh")
    try { await Promise.all([inspect(true), refresh()]) } finally { setBusy(null) }
  }

  const accepted = Number(webhook?.events24h || 0)
  const historicalRejects = Number(webhook?.rejected24h || 0)
  const failed = Number(webhook?.failed24h || 0)
  const hmacHealthy = accepted > 0 && failed === 0
  const desired = snapshot?.desiredFields || []
  const active = snapshot?.subscribedFields || []
  const missing = snapshot?.missingFields || desired
  const status = snapshot?.healthy ? "LIVE" : snapshot?.configured ? "ACTION REQUIRED" : "NOT CONFIGURED"

  const coverage = useMemo(() => desired.length ? Math.round(((desired.length - missing.length) / desired.length) * 100) : 0, [desired, missing])

  return <div className={styles.root}>
    <header className={styles.hero}>
      <div>
        <span>CONTROL · INSTAGRAM LIVE EVENT INGRESS · MZ3.1</span>
        <h2>Le webhook devient une liaison de production vérifiable.</h2>
        <p>Facebook/Page et Instagram Login restent deux familles de credentials distinctes. Cette surface utilise exclusivement le token Instagram dédié pour <code>graph.instagram.com</code>.</p>
      </div>
      <button onClick={refreshSnapshot} disabled={Boolean(busy)}><RefreshCw/> {busy === "refresh" ? "Actualisation…" : "Actualiser le snapshot"}</button>
    </header>

    <section className={styles.topology}>
      <article><Radio/><small>INSTAGRAM PROFESSIONAL</small><b>{snapshot?.accountId || "Compte non chargé"}</b><em>Instagram Login</em></article>
      <i>→</i>
      <article className={styles.core}><Webhook/><small>GRAPH HOST</small><b>graph.instagram.com</b><em>{snapshot?.graphVersion || "v26.0"}</em></article>
      <i>→</i>
      <article><ShieldCheck/><small>ANGELCARE WEBHOOK</small><b>{status}</b><em>{coverage}% des champs requis</em></article>
    </section>

    <section className={styles.vitals}>
      <Vital label="Callback" ok={Boolean(webhook?.configured)} value={webhook?.configured ? "configured" : "not configured"}/>
      <Vital label="Challenge Meta" ok={Boolean(webhook?.verified)} value={webhook?.verified ? "verified" : "not observed"}/>
      <Vital label="Signature actuelle" ok={hmacHealthy} value={hmacHealthy ? "accepted traffic observed" : accepted ? "traffic processed with warnings" : "awaiting accepted traffic"}/>
      <Vital label="Trafic traité 24h" ok={accepted > 0} value={String(accepted)}/>
      <Vital label="Rejets historiques 24h" ok={true} value={String(historicalRejects)} neutral/>
      <Vital label="Échecs traitement" ok={failed === 0} value={String(failed)}/>
      <Vital label="Subscription Instagram" ok={Boolean(snapshot?.healthy)} value={snapshot ? `${active.length}/${desired.length} fields` : "inspection…"}/>
      <Vital label="Token dédié" ok={Boolean(snapshot?.tokenConfigured)} value={snapshot?.tokenConfigured ? "configured · hidden" : "missing"}/>
      <Vital label="Latence" ok={webhook?.lastLatencyMs == null || webhook.lastLatencyMs < 3000} value={webhook?.lastLatencyMs == null ? "—" : `${webhook.lastLatencyMs} ms`}/>
    </section>

    <section className={styles.subscriptionPanel}>
      <div className={styles.panelHead}>
        <div><span>ACCOUNT-LEVEL SUBSCRIPTION</span><h3>Champs live de l’Instagram Professional Account</h3></div>
        <div className={snapshot?.healthy ? styles.liveBadge : styles.attentionBadge}>{snapshot?.healthy ? <CheckCircle2/> : <AlertTriangle/>}{status}</div>
      </div>
      <div className={styles.fieldGrid}>
        {desired.map((field) => {
          const enabled = active.includes(field)
          return <article key={field} className={enabled ? styles.fieldOn : styles.fieldOff}>{enabled ? <CheckCircle2/> : <XCircle/>}<div><b>{field}</b><small>{enabled ? "SUBSCRIBED" : "MISSING"}</small></div></article>
        })}
        {!desired.length && <div className={styles.empty}>Chargement du contrat de souscription…</div>}
      </div>
      {snapshot?.unexpectedFields?.length ? <p className={styles.note}>Autres champs déjà actifs chez Meta : {snapshot.unexpectedFields.join(", ")}</p> : null}
    </section>

    <section className={styles.actions}>
      <button onClick={() => inspect()} disabled={Boolean(busy)}><Activity/> {busy === "inspect" ? "Inspection…" : "Inspect subscriptions"}</button>
      <button className={styles.primary} onClick={reconcile} disabled={Boolean(busy) || snapshot?.configured === false}><Radio/> {busy === "reconcile" ? "Réconciliation…" : "Reconcile Instagram subscriptions"}</button>
    </section>

    {error ? <section className={styles.error}><AlertTriangle/><div><b>Diagnostic Instagram Login</b><p>{error}</p><small>Aucun token n’est rendu au navigateur. Corrigez le credential ou l’autorisation Meta, puis réinspectez.</small></div></section> : null}

    <section className={styles.truth}>
      <ShieldCheck/><div><b>Production truth</b><p>Un test Meta valide le transport. La production n’est déclarée live que lorsque l’abonnement du compte professionnel est inspecté ici et qu’un commentaire/DM réel arrive dans ENGAGE.</p></div>
    </section>
  </div>
}

function Vital({ label, ok, value, neutral = false }: { label: string; ok: boolean; value: string; neutral?: boolean }) {
  return <article><span className={neutral ? styles.neutralDot : ok ? styles.okDot : styles.badDot}><CircleDot/></span><div><small>{label}</small><b>{value}</b></div><em>{neutral ? "HISTORY" : ok ? "READY" : "ATTENTION"}</em></article>
}
