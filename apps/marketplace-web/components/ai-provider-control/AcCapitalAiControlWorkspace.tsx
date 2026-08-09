'use client'

import { Activity, Bot, ExternalLink, KeyRound, LockKeyhole, Search, ShieldCheck, Workflow } from 'lucide-react'
import type { AiProviderSnapshot, JsonRecord } from '@/lib/ai-provider-control/types'
import styles from './ai-provider-control.module.css'

const text = (value: unknown) => String(value ?? '')

function tone(status: unknown) {
  const value = text(status).toLowerCase()
  if (['active', 'operating', 'validated', 'healthy'].includes(value)) return styles.good
  if (['draft', 'stored-not-tested', 'paused'].includes(value)) return styles.warn
  if (['failed', 'blocked', 'revoked', 'disabled'].includes(value)) return styles.bad
  return styles.neutral
}

export default function AcCapitalAiControlWorkspace({
  snapshot,
}: {
  snapshot: AiProviderSnapshot | null
  busy?: boolean
  onApply?: (payload: JsonRecord) => void
}) {
  const dossiers = (snapshot?.dossiers || []).filter((row) => ['tavily', 'openrouter'].includes(text(row.provider_type).toLowerCase()))
  const credentials = snapshot?.credentials || []
  const tavily = dossiers.find((row) => text(row.provider_type).toLowerCase() === 'tavily')
  const openrouter = dossiers.find((row) => text(row.provider_type).toLowerCase() === 'openrouter')
  const tavilyCredential = credentials.find((row) => row.dossier_id === tavily?.id && row.status === 'active')
  const openrouterCredential = credentials.find((row) => row.dossier_id === openrouter?.id && row.status === 'active')

  return <div>
    <section className={styles.sovereigntyBanner}>
      <div>
        <span>AC CAPITAL OS · EXTERNAL INTELLIGENCE PROVIDERS</span>
        <h2>Tavily search and OpenRouter free analysis are controlled inside AC Capital</h2>
        <p>The global provider control retains encrypted credential custody and platform health. Agent frequencies, prompts, quotas, internal permissions, operating profiles, execution evidence and usage controls live in the dedicated AC Capital AI Operations workspace.</p>
      </div>
      <button className={styles.primaryButton} onClick={() => window.location.assign('/ac-capital-os/ai-control')}><ExternalLink size={17}/> Open AC Capital AI Operations</button>
    </section>

    <div className={styles.statsGrid}>
      <article className={styles.stat}><div className={styles.statIcon}><Search size={20}/></div><div><span>Research provider</span><strong>Tavily</strong><small>Public web evidence retrieval</small></div></article>
      <article className={styles.stat}><div className={styles.statIcon}><Workflow size={20}/></div><div><span>Analysis provider</span><strong>OpenRouter Free</strong><small>Structured evidence analysis</small></div></article>
      <article className={styles.stat}><div className={styles.statIcon}><KeyRound size={20}/></div><div><span>Credential custody</span><strong>{Number(Boolean(tavilyCredential)) + Number(Boolean(openrouterCredential))}/2 active</strong><small>Encrypted in global AI Provider Control</small></div></article>
      <article className={styles.stat}><div className={styles.statIcon}><LockKeyhole size={20}/></div><div><span>External actions</span><strong>Locked</strong><small>Research and internal records only</small></div></article>
    </div>

    <div className={styles.twoColumnsWide}>
      <section className={styles.panel}>
        <div className={styles.cardTitle}><div><span>GLOBAL CREDENTIAL AUTHORITY</span><h2>Provider dossiers and secret readiness</h2></div></div>
        <div className={styles.routeCards}>
          {[{ name: 'Tavily', dossier: tavily, credential: tavilyCredential, icon: Search }, { name: 'OpenRouter', dossier: openrouter, credential: openrouterCredential, icon: Bot }].map(({ name, dossier, credential, icon: Icon }) => <article key={name}><div><Icon size={20}/><span className={tone(credential?.status || dossier?.status)}>{credential?.status || dossier?.status || 'missing'}</span></div><h3>{dossier?.name || `${name} dossier not created yet`}</h3><p>Provider: <strong>{name}</strong></p><dl><div><dt>Dossier</dt><dd>{dossier?.status || 'missing'}</dd></div><div><dt>Credential</dt><dd>{credential ? `V${credential.version_number} · •••• ${credential.secret_suffix}` : 'not active'}</dd></div><div><dt>Tier</dt><dd>{dossier?.billing_tier || 'free'}</dd></div><div><dt>Scope</dt><dd>AC Capital public data</dd></div></dl></article>)}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.cardTitle}><div><span>RUNTIME OWNERSHIP</span><h2>What the dedicated workspace controls</h2></div></div>
        <div className={styles.decisionList}>
          <div><Activity size={18}/><p><strong>Provider request parameters</strong><span>Depth, result counts, timeouts, retries, tokens and internal ceilings.</span></p><span className={styles.good}>WRITABLE</span></div>
          <div><Bot size={18}/><p><strong>Outbound agents</strong><span>Create, configure, schedule, pause, duplicate, run and delete agent profiles.</span></p><span className={styles.good}>WRITABLE</span></div>
          <div><ShieldCheck size={18}/><p><strong>Internal action permissions</strong><span>Source capture, opportunity creation, duplicate detection, qualification and production controls.</span></p><span className={styles.good}>ENFORCED</span></div>
          <div><LockKeyhole size={18}/><p><strong>External action boundary</strong><span>Outreach, submission, communication and release remain locked.</span></p><span className={styles.good}>LOCKED</span></div>
        </div>
      </section>
    </div>
  </div>
}
