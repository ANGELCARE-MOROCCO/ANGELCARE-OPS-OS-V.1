'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Settings2,
  DatabaseZap,
  SearchCheck,
  LockKeyhole,
  Network,
  RefreshCw,
  Save,
  ShieldCheck,
  AlertTriangle,
  GitBranch,
} from 'lucide-react'
import type { IntelligenceRun, ModelProfile, ProviderHealth, UsageLedgerSummary } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { StatusPill } from './IntelligencePrimitives'

type PublicProviderConfiguration = {
  freeOnly: true
  tavilyConfigured: boolean
  tavilyProjectConfigured: boolean
  tavilyBaseUrl: string
  tavilyTimeoutMs: number
  tavilyMaxResults: number
  openrouterConfigured: boolean
  openrouterRoute: 'openrouter/free'
  openrouterBaseUrl: string
  openrouterTimeoutMs: number
  workerConfigured: boolean
}

type TestResult = {
  provider: 'tavily' | 'openrouter'
  status: 'success'
  requestId?: string | null
  resultCount?: number
  credits?: number
  requestedRoute?: string
  actualModel?: string | null
  providerName?: string | null
  latencyMs: number
  totalTokens?: number
  providerReportedCostUsd?: number
}

const CAPABILITIES = [
  ['External public-web acquisition', 'Tavily Free'],
  ['Evidence extraction', 'OpenRouter Free'],
  ['Research synthesis', 'OpenRouter Free'],
  ['Product opportunity intelligence', 'OpenRouter Free'],
  ['Product Design architecture', 'OpenRouter Free'],
  ['Production command compilation', 'OpenRouter Free'],
  ['Sellable solution composition', 'OpenRouter Free'],
  ['Learning Journey architecture', 'OpenRouter Free'],
  ['Commercial intelligence', 'OpenRouter Free'],
  ['Customer Experience advisory', 'OpenRouter Free'],
] as const

export default function AiProviderControlCentre({
  profiles,
  health,
  usage,
  runs,
  configuration,
}: {
  profiles: ModelProfile[]
  health: ProviderHealth[]
  usage: UsageLedgerSummary
  runs: IntelligenceRun[]
  configuration: PublicProviderConfiguration
}) {
  const router = useRouter()
  const [selected, setSelected] = useState(profiles[0]?.id || '')
  const [busyProfile, setBusyProfile] = useState(false)
  const [testing, setTesting] = useState<'tavily' | 'openrouter' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const profile = profiles.find((item) => item.id === selected)
  const tavilyHealth = health.find((item) => item.provider === 'tavily')
  const openrouterHealth = health.find((item) => item.provider === 'openrouter')
  const latestOpenRouterRun = useMemo(
    () => runs.find((run) => run.provider === 'openrouter' && run.modelUsed),
    [runs],
  )

  async function savePolicy(formData: FormData) {
    if (!profile) return
    setBusyProfile(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/flashcards-os/intelligence/control/model-profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          temperature: Number(formData.get('temperature')),
          maxOutputTokens: Number(formData.get('maxOutputTokens')),
          timeoutMs: Number(formData.get('timeoutMs')),
          retryLimit: Number(formData.get('retryLimit')),
          requireStructuredOutput: formData.get('requireStructuredOutput') === 'on',
          status: String(formData.get('status')),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Policy update failed.')
      setMessage('Task execution policy saved. The OpenRouter route remains fixed to openrouter/free.')
      router.refresh()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Policy update failed.')
    } finally {
      setBusyProfile(false)
    }
  }

  async function testProvider(provider: 'tavily' | 'openrouter') {
    setTesting(provider)
    setError('')
    setMessage('')
    setTestResult(null)
    try {
      const response = await fetch('/api/flashcards-os/intelligence/control/providers/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const payload = await response.json()
      if (!response.ok) {
        const suffix = payload.code ? ` (${payload.code})` : ''
        throw new Error(`${payload.error || 'Provider test failed.'}${suffix}`)
      }
      setTestResult(payload.result)
      setMessage(`${provider === 'tavily' ? 'Tavily Free' : 'OpenRouter Free'} connection test passed and was written to the run ledger.`)
      router.refresh()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Provider test failed. No synthetic result was generated.')
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className={styles.aiProviderControlPage}>
      <header className={styles.aiProviderHero}>
        <div>
          <span className={styles.intelKicker}><Network size={16}/> AI PROVIDER & USAGE CONTROL CENTRE</span>
          <h1>Deux providers. Une route gratuite. Zéro modèle nommé caché.</h1>
          <p>Tavily acquiert les preuves web publiques. OpenRouter exécute tout le raisonnement via <strong>openrouter/free</strong>. Les secrets restent dans l’environnement; l’état, les erreurs, l’usage et le modèle réellement choisi restent visibles ici.</p>
        </div>
        <div className={styles.aiDoctrineSeal}>
          <ShieldCheck size={24}/>
          <strong>FREE-ONLY</strong>
          <span>No paid route · no synthetic fallback</span>
        </div>
      </header>

      <section className={styles.aiProviderStations}>
        <article className={styles.aiProviderStation}>
          <header><DatabaseZap size={21}/><div><span>EXTERNAL ACQUISITION</span><h2>Tavily Free</h2></div><StatusPill value={tavilyHealth?.status || 'unconfigured'}/></header>
          <div className={styles.aiProviderFacts}>
            <p><span>API key</span><strong>{configuration.tavilyConfigured ? 'Configured' : 'Missing'}</strong></p>
            <p><span>Project ID</span><strong>{configuration.tavilyProjectConfigured ? 'Configured' : 'Not set'}</strong></p>
            <p><span>Model selector</span><strong>Not applicable</strong></p>
            <p><span>Maximum results</span><strong>{configuration.tavilyMaxResults}</strong></p>
            <p><span>Timeout</span><strong>{configuration.tavilyTimeoutMs.toLocaleString('fr-FR')} ms</strong></p>
            <p><span>Requests recorded</span><strong>{usage.tavilyRequests}</strong></p>
          </div>
          <div className={styles.aiProviderStatusLine}><span>Last success</span><strong>{tavilyHealth?.lastSuccessAt ? new Date(tavilyHealth.lastSuccessAt).toLocaleString('fr-FR') : 'No successful call yet'}</strong></div>
          {tavilyHealth?.lastError ? <div className={styles.aiVisibleProviderError}><AlertTriangle size={15}/>{tavilyHealth.lastError}</div> : null}
          <button type="button" onClick={() => testProvider('tavily')} disabled={Boolean(testing) || !configuration.tavilyConfigured}><RefreshCw size={15}/>{testing === 'tavily' ? 'Testing Tavily…' : 'Run visible Tavily test'}</button>
        </article>

        <article className={styles.aiProviderStation}>
          <header><BrainCircuit size={21}/><div><span>ALL INTERNAL REASONING</span><h2>OpenRouter Free</h2></div><StatusPill value={openrouterHealth?.status || 'unconfigured'}/></header>
          <div className={styles.aiProviderFacts}>
            <p><span>API key</span><strong>{configuration.openrouterConfigured ? 'Configured' : 'Missing'}</strong></p>
            <p><span>Requested route</span><strong>{configuration.openrouterRoute}</strong></p>
            <p><span>Named model list</span><strong>None</strong></p>
            <p><span>Hidden fallback</span><strong>None</strong></p>
            <p><span>Last actual model</span><strong>{latestOpenRouterRun?.modelUsed || 'No successful call yet'}</strong></p>
            <p><span>Requests recorded</span><strong>{usage.openrouterRequests}</strong></p>
          </div>
          <div className={styles.aiProviderStatusLine}><span>Last success</span><strong>{openrouterHealth?.lastSuccessAt ? new Date(openrouterHealth.lastSuccessAt).toLocaleString('fr-FR') : 'No successful call yet'}</strong></div>
          {openrouterHealth?.lastError ? <div className={styles.aiVisibleProviderError}><AlertTriangle size={15}/>{openrouterHealth.lastError}</div> : null}
          <button type="button" onClick={() => testProvider('openrouter')} disabled={Boolean(testing) || !configuration.openrouterConfigured}><RefreshCw size={15}/>{testing === 'openrouter' ? 'Testing OpenRouter…' : 'Run visible OpenRouter test'}</button>
        </article>

        <article className={styles.aiProviderStation}>
          <header><LockKeyhole size={21}/><div><span>INTERNAL WORKER AUTHORITY</span><h2>Worker Secret</h2></div><StatusPill value={configuration.workerConfigured ? 'healthy' : 'unconfigured'}/></header>
          <div className={styles.aiWorkerDoctrine}>
            <p><SearchCheck size={15}/><span>The secret value is never displayed or editable from the browser.</span></p>
            <p><GitBranch size={15}/><span>It authorises only the protected intelligence worker endpoint.</span></p>
            <p><Settings2 size={15}/><span>Local and Vercel production values remain separate.</span></p>
          </div>
          <div className={styles.aiProviderStatusLine}><span>Environment status</span><strong>{configuration.workerConfigured ? 'Configured' : 'Missing'}</strong></div>
        </article>
      </section>

      <section className={styles.aiTransparencyStrip}>
        <article><Activity size={17}/><span>OpenRouter tokens</span><strong>{usage.totalTokens.toLocaleString('fr-FR')}</strong></article>
        <article><DatabaseZap size={17}/><span>Tavily credits used</span><strong>{usage.tavilyCredits}</strong></article>
        <article><AlertTriangle size={17}/><span>Visible failures</span><strong>{usage.failedRuns}</strong></article>
        <article><ShieldCheck size={17}/><span>Provider-reported cost</span><strong>{usage.monthlySpendUsd.toFixed(4)} USD</strong></article>
      </section>

      {message ? <div className={styles.aiVisibleSuccess}><CheckCircle2 size={16}/>{message}</div> : null}
      {error ? <div className={styles.aiVisibleProviderError}><AlertTriangle size={16}/>{error}</div> : null}
      {testResult ? <section className={styles.aiTestEvidence}><header><span>LAST EXPLICIT CONNECTION TEST</span><strong>{testResult.provider}</strong></header><div><p><span>Status</span><strong>{testResult.status}</strong></p><p><span>Latency</span><strong>{testResult.latencyMs} ms</strong></p>{testResult.requestedRoute ? <p><span>Requested route</span><strong>{testResult.requestedRoute}</strong></p> : null}{testResult.actualModel ? <p><span>Actual selected model</span><strong>{testResult.actualModel}</strong></p> : null}{typeof testResult.resultCount === 'number' ? <p><span>Sources returned</span><strong>{testResult.resultCount}</strong></p> : null}{typeof testResult.totalTokens === 'number' ? <p><span>Tokens</span><strong>{testResult.totalTokens}</strong></p> : null}</div></section> : null}

      <section className={styles.aiCapabilityMatrix}>
        <header><div><span>AUTHORITATIVE CAPABILITY ROUTING</span><h2>Every intelligence capability has one visible provider assignment.</h2></div><strong>{CAPABILITIES.length}</strong></header>
        <div>{CAPABILITIES.map(([capability, provider]) => <article key={capability}><span>{capability}</span><strong>{provider}</strong></article>)}</div>
      </section>

      <section className={styles.aiTaskPolicyWorkspace}>
        <aside className={styles.modelProfileRail}>
          <header><span>TASK EXECUTION POLICIES</span><strong>{profiles.length}</strong></header>
          {profiles.map((item) => <button type="button" className={item.id === selected ? styles.modelProfileActive : ''} onClick={() => setSelected(item.id)} key={item.id}><BrainCircuit size={16}/><div><strong>{item.label}</strong><span>{item.profileKey}</span></div><StatusPill value={item.status}/></button>)}
        </aside>
        {profile ? <form action={savePolicy} className={styles.aiTaskPolicyEditor} key={profile.id}>
          <header><div><span>{profile.profileKey}</span><h2>{profile.label}</h2><p>{profile.purpose}</p></div><div className={styles.aiFixedRouteBadge}><Network size={15}/><span>FIXED ROUTE</span><strong>openrouter/free</strong></div></header>
          <section className={styles.aiTaskParameterGrid}>
            <label>Temperature<input name="temperature" type="number" min="0" max="2" step="0.05" defaultValue={profile.temperature}/></label>
            <label>Maximum output tokens<input name="maxOutputTokens" type="number" min="256" max="50000" defaultValue={profile.maxOutputTokens}/></label>
            <label>Timeout ms<input name="timeoutMs" type="number" min="10000" max="180000" defaultValue={profile.timeoutMs}/></label>
            <label>Retry limit on same free route<input name="retryLimit" type="number" min="0" max="5" defaultValue={profile.retryLimit}/></label>
            <label>Execution status<select name="status" defaultValue={profile.status}><option value="active">active</option><option value="draft">draft</option><option value="disabled">disabled</option><option value="archived">archived</option></select></label>
          </section>
          <section className={styles.aiTaskIntegrityBoard}>
            <label><input name="requireStructuredOutput" type="checkbox" defaultChecked={profile.requireStructuredOutput}/><ShieldCheck size={17}/><div><strong>Validate structured business output</strong><span>The free route is not filtered by named-model capabilities. Returned JSON is parsed and validated locally; invalid output becomes a visible error.</span></div></label>
            <article><SearchCheck size={17}/><div><strong>No synthetic fallback</strong><span>Provider failure, rate limiting, invalid JSON and quota exhaustion remain visible to the operator.</span></div></article>
            <article><ShieldCheck size={17}/><div><strong>Local context protection</strong><span>Flashcards OS redacts sensitive fields before provider transmission without hiding provider failures.</span></div></article>
          </section>
          <section className={styles.allowedDataClasses}><span>ALLOWED CONTEXT CLASSES</span>{profile.allowedDataClasses.map((item) => <i key={item}>{item}</i>)}</section>
          <footer><button type="submit" disabled={busyProfile}><Save size={15}/>{busyProfile ? 'Saving…' : 'Save execution policy'}</button></footer>
        </form> : null}
      </section>
    </div>
  )
}
