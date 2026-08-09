import { Activity, BrainCircuit, DatabaseZap, SearchCheck, ShieldAlert } from 'lucide-react'
import type { IntelligenceRun, UsageLedgerSummary } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'

export default function UsageControlCentre({ usage, runs }: { usage: UsageLedgerSummary; runs: IntelligenceRun[] }) {
  const tasks=Object.entries(runs.reduce<Record<string,{count:number,tokens:number;failures:number;actualModels:Set<string>}>>((acc,run)=>{const item=acc[run.taskProfile]||{count:0,tokens:0,failures:0,actualModels:new Set<string>()};item.count+=1;item.tokens+=run.totalTokens;if(['failed','dead_letter','blocked'].includes(run.status))item.failures+=1;if(run.modelUsed)item.actualModels.add(run.modelUsed);acc[run.taskProfile]=item;return acc},{})).sort((a,b)=>b[1].count-a[1].count)
  const actualModels=Array.from(new Set(runs.filter((run)=>run.provider==='openrouter'&&run.modelUsed).map((run)=>String(run.modelUsed))))
  return <div className={styles.usageControlPage}>
    <header><div><span className={styles.intelKicker}><SearchCheck size={16}/> AI USAGE & TRANSPARENCY</span><h1>Chaque requête, quota, modèle réellement choisi et erreur reste visible.</h1><p>Tavily Free n’a aucun modèle. OpenRouter reçoit toujours <strong>openrouter/free</strong>; le modèle concret retourné par le routeur est enregistré sans fallback synthétique.</p></div><strong>{usage.openrouterRequests+usage.tavilyRequests}<span>provider requests</span></strong></header>
    <section className={styles.usageProviderSplit}>
      <article><DatabaseZap size={20}/><span>Tavily Free</span><strong>{usage.tavilyRequests}</strong><p>{usage.tavilyCredits} crédits d’acquisition externe utilisés</p></article>
      <article><BrainCircuit size={20}/><span>OpenRouter Free</span><strong>{usage.openrouterRequests}</strong><p>{usage.totalTokens.toLocaleString('fr-FR')} tokens · route fixe openrouter/free</p></article>
      <article><ShieldAlert size={20}/><span>Visible exceptions</span><strong>{usage.failedRuns+usage.blockedRuns}</strong><p>{usage.failedRuns} failed · {usage.blockedRuns} privacy denied</p></article>
    </section>
    <section className={styles.aiTestEvidence}><header><span>ACTUAL FREE MODELS RETURNED BY OPENROUTER</span><strong>{actualModels.length}</strong></header><div>{actualModels.length?actualModels.map((model)=><p key={model}><Activity size={14}/><span>Selected model</span><strong>{model}</strong></p>):<p><span>No successful OpenRouter run yet</span><strong>Run a visible connection test from AI Provider Control.</strong></p>}</div></section>
    <section className={styles.usageTaskLedger}><header><span>USAGE BY TASK PROFILE</span><strong>{tasks.length}</strong></header>{tasks.map(([task,value])=><article key={task}><strong>{task}</strong><span>{value.count} runs</span><span>{value.tokens.toLocaleString('fr-FR')} tokens</span><span>{value.failures} failures</span></article>)}</section>
  </div>
}
