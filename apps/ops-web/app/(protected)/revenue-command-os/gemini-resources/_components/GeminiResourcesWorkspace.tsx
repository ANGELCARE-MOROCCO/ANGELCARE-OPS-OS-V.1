'use client'

import { Bot, Boxes, BrainCircuit, CheckCircle2, Database, RefreshCw, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CanonicalCsvImportDock from '../../_components/imports/CanonicalCsvImportDock'
import AiSovereigntyGovernancePanel from './AiSovereigntyGovernancePanel'
import styles from './GeminiResourcesWorkspace.module.css'

type ListItem = { code: string; title: string; subtitle?: string; status?: string; version?: string }
type RunItem = {
  id: string
  status: string
  provider: string
  model: string
  strategyCount: number
  selectedCommandCount: number
  contextFactCount: number
  createdAt: string
}

export default function GeminiResourcesWorkspace() {
  const [resources, setResources] = useState<ListItem[]>([])
  const [runs, setRuns] = useState<RunItem[]>([])
  const [health, setHealth] = useState<any>(null)
  const [models, setModels] = useState<any[]>([])
  const [governance, setGovernance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [resourceEnvelope, healthEnvelope, modelsEnvelope, spineEnvelope, governanceEnvelope] = await Promise.all([
        fetch('/api/revenue-command-os/canonical-operations?kind=gemini-resources', { cache: 'no-store' }).then((response) => response.json()),
        fetch('/api/revenue-command-os/ai/health', { cache: 'no-store' }).then((response) => response.json()).catch(() => null),
        fetch('/api/revenue-command-os/ai/models', { cache: 'no-store' }).then((response) => response.json()).catch(() => null),
        fetch('/api/revenue-command-os/operating-spine', { cache: 'no-store' }).then((response) => response.json()).catch(() => null),
        fetch('/api/revenue-command-os/ai/governance', { cache: 'no-store' }).then((response) => response.json()).catch(() => null),
      ])
      setResources(Array.isArray(resourceEnvelope?.data?.items) ? resourceEnvelope.data.items : [])
      setHealth(healthEnvelope?.data || null)
      setModels(Array.isArray(modelsEnvelope?.data) ? modelsEnvelope.data : Array.isArray(modelsEnvelope?.data?.models) ? modelsEnvelope.data.models : [])
      setRuns(Array.isArray(spineEnvelope?.data?.aiRuns) ? spineEnvelope.data.aiRuns : [])
      setGovernance(governanceEnvelope?.data || null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const activeResources = useMemo(() => resources.filter((resource) => ['active','approved','validated'].includes(String(resource.status))).length, [resources])
  const completedRuns = useMemo(() => runs.filter((run) => run.status === 'completed').length, [runs])

  return (
    <main className={styles.page} data-revenue-workspace="gemini-resources">
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.kicker}>AI Resource & Orchestration Authority</p>
            <h1 className={styles.title}>Gemini & ressources AngelCare</h1>
            <p className={styles.lead}>Gouverner les modèles, prompts, cadres analytiques, context adapters et schémas de sortie utilisés par le moteur stratégique—avec version, permission, coût, preuve et traçabilité.</p>
            <div className={styles.badges}>
              <span className={styles.badge}><ShieldCheck size={12} /> Approval-gated</span>
              <span className={styles.badge}><Database size={12} /> Sources internes gouvernées</span>
              <span className={styles.badge}><Zap size={12} /> Aucun effet externe automatique</span>
            </div>
          </div>
          <aside className={styles.runtime}>
            <div className={styles.runtimeHead}><h2>Runtime Gemini</h2><span className={styles.status}>{health?.status || 'Configuré'}</span></div>
            <div className={styles.metrics}>
              <div className={styles.metric}><label>Ressources</label><strong>{resources.length}</strong><span>{activeResources} active(s) ou approuvée(s)</span></div>
              <div className={styles.metric}><label>Modèles</label><strong>{models.length}</strong><span>Registre fournisseur</span></div>
              <div className={styles.metric}><label>Runs</label><strong>{runs.length}</strong><span>{completedRuns} terminé(s)</span></div>
              <div className={styles.metric}><label>Outils natifs</label><strong>{runs.reduce((sum, run: any) => sum + Number((run as any).providerNativeToolCalls || 0), 0)}</strong><span>Distincts des adapters internes</span></div>
            </div>
          </aside>
        </div>
      </section>

      <AiSovereigntyGovernancePanel governance={governance} />

      <div className={styles.body}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div><p>Canonical Resource Registry</p><h2>Ressources versionnées disponibles</h2></div>
            <button className={styles.refresh} onClick={() => void load()} aria-label="Actualiser">{loading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}</button>
          </div>
          {resources.length ? (
            <div className={styles.resourceGrid}>
              {resources.map((resource, index) => <article key={`${resource.code}-${resource.version}`} className={styles.resource}>
                <div className={styles.resourceTop}>
                  <span className={styles.resourceIcon}>{index % 3 === 0 ? <BrainCircuit size={17} /> : index % 3 === 1 ? <Boxes size={17} /> : <Sparkles size={17} />}</span>
                  <div><h3>{resource.title}</h3><code>{resource.code}</code></div>
                </div>
                <p>{resource.subtitle || 'Ressource Gemini gouvernée et traçable.'}</p>
                <div className={styles.resourceFoot}><span className={styles.smallPill}>{resource.status || 'draft'}</span><span className={styles.version}>Version {resource.version || '1.0'}</span></div>
              </article>)}
            </div>
          ) : (
            <div className={styles.empty}><div><span className={styles.emptyIcon}><Bot size={20} /></span><h3>Aucune ressource importée</h3><p>Le fournisseur peut être configuré sans que vos cadres, prompts et adapters métier soient encore enregistrés. Utilisez le studio d’import situé à droite.</p></div></div>
          )}
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHead}><div><p>AI Orchestration Ledger</p><h2>Derniers runs gouvernés</h2></div></div>
          <div className={styles.ledger}>
            {runs.slice(0, 8).map((run) => <article key={run.id} className={styles.run}><span className={styles.runIcon}><Bot size={15} /></span><div><h3>{run.provider || 'Gemini'} · {run.model || 'modèle gouverné'}</h3><p>{run.strategyCount} stratégie(s) · {run.selectedCommandCount} commande(s) · {run.contextFactCount} fait(s)</p></div><span className={styles.runStatus}>{run.status}</span></article>)}
            {!runs.length ? <div className={styles.empty}><div><span className={styles.emptyIcon}><Bot size={20} /></span><h3>Aucun run Gemini gouverné</h3><p>Importez ou sélectionnez des ressources, puis utilisez l’onglet « Exécuter & observer » du studio.</p></div></div> : null}
          </div>
          <div className={styles.principles}>
            <div className={styles.principle}><CheckCircle2 size={16} /><div><strong>Adapters internes séparés</strong><span>Les lectures AngelCare ne sont jamais présentées comme des appels d’outils natifs Gemini.</span></div></div>
            <div className={styles.principle}><ShieldCheck size={16} /><div><strong>Secrets exclus du CSV</strong><span>Les clés et credentials restent exclusivement dans la configuration sécurisée.</span></div></div>
            <div className={styles.principle}><Database size={16} /><div><strong>Versions conservées</strong><span>Chaque ressource est identifiable par code, version, contenu et empreinte.</span></div></div>
          </div>
        </aside>
      </div>

      <CanonicalCsvImportDock kind="gemini-resources" />
    </main>
  )
}
