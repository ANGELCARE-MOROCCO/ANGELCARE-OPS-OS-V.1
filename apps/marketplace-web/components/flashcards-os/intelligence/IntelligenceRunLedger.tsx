import { Activity, Ban, BrainCircuit, Clock3, DatabaseZap, ShieldAlert } from 'lucide-react'
import type { IntelligenceRun, UsageLedgerSummary } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { EmptyIntelligenceState, StatusPill } from './IntelligencePrimitives'

export default function IntelligenceRunLedger({ runs, usage }: { runs: IntelligenceRun[]; usage: UsageLedgerSummary }) {
  return (
    <div className={styles.runLedgerPage}>
      <header className={styles.runLedgerHeader}><div><span className={styles.intelKicker}><Activity size={16}/> INTELLIGENCE RUN LEDGER</span><h1>La route demandée, le modèle réellement choisi et chaque échec restent explicites.</h1><p>Tavily Free acquiert les preuves. OpenRouter Free reçoit uniquement <strong>openrouter/free</strong>. Aucune réponse synthétique n’est créée lorsqu’un provider échoue.</p></div><div><strong>{runs.length}</strong><span>runs visibles</span></div></header>
      <section className={styles.runLedgerTelemetry}><article><DatabaseZap size={17}/><span>Requests</span><strong>{usage.tavilyRequests+usage.openrouterRequests}</strong></article><article><BrainCircuit size={17}/><span>Tokens</span><strong>{usage.totalTokens.toLocaleString('fr-FR')}</strong></article><article><Clock3 size={17}/><span>Provider cost reported</span><strong>{usage.monthlySpendUsd.toFixed(4)} USD</strong></article><article><ShieldAlert size={17}/><span>Failed</span><strong>{usage.failedRuns}</strong></article><article><Ban size={17}/><span>Privacy denied</span><strong>{usage.blockedRuns}</strong></article></section>
      <section className={styles.runLedgerTable}><header><span>Run</span><span>Task / provider</span><span>Requested → actual</span><span>Usage</span><span>Latency</span><span>State</span></header>{runs.map(run=><article key={run.id}><div><strong>{run.runCode}</strong><span>{run.createdAt?new Date(run.createdAt).toLocaleString('fr-FR'):'—'}</span></div><div><strong>{run.taskProfile}</strong><span>{run.provider}</span></div><div><strong>{run.modelRequested||'No model applicable'}</strong><span>{run.modelUsed?`actual: ${run.modelUsed}`:'actual model not returned'}</span></div><div><strong>{run.totalTokens.toLocaleString('fr-FR')} tokens</strong><span>{run.costUsd.toFixed(4)} USD provider-reported</span></div><div><strong>{run.latencyMs} ms</strong><span>{run.retryCount} same-route retries</span></div><div><StatusPill value={run.status}/>{run.errorMessage?<small>{run.errorMessage}</small>:null}</div></article>)}{!runs.length?<EmptyIntelligenceState title="Aucun run exécuté" detail="Les providers ne sont pas simulés. Lancez un test visible depuis AI Provider Control ou exécutez une mission réelle."/>:null}</section>
    </div>
  )
}
