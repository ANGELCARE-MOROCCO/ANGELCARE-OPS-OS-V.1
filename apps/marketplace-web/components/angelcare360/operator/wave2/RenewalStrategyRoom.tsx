'use client'

import { useState } from 'react'
import styles from './Wave2CommandExperience.module.css'
import type { Wave2Decision, Wave2RenewalCommand } from './Wave2CommandTypes'
import {
  Wave2ActionDock,
  Wave2DecisionChamber,
  Wave2EvidenceDrawer,
  Wave2FactorGrid,
  Wave2IdentityChamber,
  Wave2IntelligenceRibbon,
  Wave2LensBar,
  Wave2RelationshipField,
  Wave2Section,
  Wave2SourceHealth,
  Wave2Timeline,
  formatDh,
  useWave2Investigation,
} from './Wave2CommandPrimitives'

const lenses = ['Stratégie', 'Santé', 'Valeur', 'Négociation', 'Risques', 'Scénarios', 'Approbations']

export default function RenewalStrategyRoom({ command }: { command: Wave2RenewalCommand }) {
  const [lens, setLens] = useState('Stratégie')
  const [decision, setDecision] = useState<Wave2Decision | null>(null)
  const investigation = useWave2Investigation(command.evidence)
  return (
    <main className={`${styles.commandRoom} ${styles.renewal}`}>
      <Wave2SourceHealth command={command} />
      <Wave2IdentityChamber command={command} kind="renewal" extra={<div className={styles.identityMeta}><span className={styles.pill}>Probabilité · {command.renewal.probability ?? 'Non renseignée'}%</span><span className={styles.pill}>Valeur · {formatDh(Number(command.renewal.expected_amount_mad || 0))}</span><span className={styles.pill}>Plan · {command.plan?.name || 'Non disponible'}</span><span className={styles.pill}>Owner · {command.renewal.owner_id || 'Non attribué'}</span></div>} />
      <Wave2IntelligenceRibbon items={command.ribbon} onEvidence={investigation.openEvidence} />
      <Wave2LensBar lenses={lenses} active={lens} onChange={setLens} />
      <div className={styles.commandGrid}>
        <div className={styles.mainColumn}>
          {lens === 'Stratégie' ? <>
            <Wave2Section eyebrow="Renewal strategy canvas" title="Mission de rétention et d’expansion" description="Objectif, décisionnaires, valeur, questions ouvertes, prix et prochaine étape restent réunis."><div className={styles.strategyGrid}>{command.strategyFields.map((field) => <article key={field.label} className={styles.strategyCell}><span className={styles.strategyLabel}>{field.label}</span><span className={styles.strategyValue}>{field.value}</span><span className={styles.strategyDetail}>{field.detail}</span></article>)}</div></Wave2Section>
            <Wave2Section eyebrow="Causal readiness" title="Pourquoi ce renouvellement est prêt ou exposé" description="Chaque facteur ouvre les preuves financières, service, contractuelles et relationnelles."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          </> : null}
          {lens === 'Santé' || lens === 'Risques' ? <Wave2Section eyebrow="Retention causal chain" title={lens === 'Santé' ? 'Santé explicable du renouvellement' : 'Risques à fermer avant décision'} description="La probabilité enregistrée n’est jamais présentée sans facteurs et preuves."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /><Wave2RelationshipField nodes={command.relationships.filter((node) => ['incident', 'ticket', 'contract', 'customer'].includes(node.kind))} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Valeur' ? <Wave2Section eyebrow="Value architecture" title="Valeur actuelle, valeur attendue et potentiel" description="La décision doit protéger la valeur sans accorder une concession non autorisée."><div className={styles.scenarioGrid}>{command.scenarios.map((scenario) => <article key={scenario.id} className={styles.scenarioCard}><span className={styles.scenarioTitle}>{scenario.title}</span><span className={styles.scenarioValue}>{formatDh(scenario.annualValueDh)}</span><span className={styles.scenarioMeta}>Delta {scenario.deltaDh >= 0 ? '+' : ''}{formatDh(scenario.deltaDh)} · {scenario.approval}</span></article>)}</div></Wave2Section> : null}
          {lens === 'Négociation' ? <Wave2Section eyebrow="Negotiation architecture" title="Position, boundaries et preuves" description="La négociation relie prix, service, adoption, finance et autorité."><div className={styles.strategyGrid}>{command.strategyFields.map((field) => <article key={field.label} className={styles.strategyCell}><span className={styles.strategyLabel}>{field.label}</span><span className={styles.strategyValue}>{field.value}</span><span className={styles.strategyDetail}>{field.detail}</span></article>)}</div><Wave2RelationshipField nodes={command.relationships} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Scénarios' ? <Wave2Section eyebrow="Scenario comparison" title="Maintien, upgrade, concession, réduction ou sortie" description="Les scénarios indicatifs sont explicitement séparés des montants exacts du registre."><div className={styles.scenarioGrid}>{command.scenarios.map((scenario) => <button key={scenario.id} type="button" className={styles.scenarioCard} onClick={() => command.actions.find((action) => action.decision)?.decision && setDecision(command.actions.find((action) => action.decision)!.decision!)}><span className={styles.scenarioTitle}>{scenario.title}</span><span className={styles.scenarioValue}>{formatDh(scenario.annualValueDh)}</span><span className={styles.scenarioMeta}>{scenario.featureImpact}<br />{scenario.relationshipImpact}<br />Approbation: {scenario.approval}</span></button>)}</div></Wave2Section> : null}
          {lens === 'Approbations' ? <Wave2Section eyebrow="Decision authority" title="Arbitrage commercial et financier" description="La proposition finale doit exposer alternatives, impact, autorité et follow-up."><Wave2ActionDock actions={command.actions.filter((action) => action.decision)} onDecision={setDecision} /></Wave2Section> : null}
        </div>
        <aside className={styles.sideColumn}>
          <Wave2Section eyebrow="Retention position" title="État de préparation" description="Les risques de service, finance et gouvernance doivent être fermés avant signature."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          <Wave2Section eyebrow="Evidence chronology" title="Derniers signaux" description="Contrats, factures, tickets, incidents et renouvellement."><Wave2Timeline events={command.timeline.slice(0, 8)} onEvidence={investigation.openEvidence} /></Wave2Section>
        </aside>
      </div>
      <Wave2ActionDock actions={command.actions} onDecision={setDecision} />
      <Wave2EvidenceDrawer open={investigation.drawerOpen} title={investigation.drawerTitle} evidence={investigation.filteredEvidence} selectedId={investigation.selectedEvidenceId} onSelect={(id) => investigation.setSelectedEvidenceId(id || null)} onClose={investigation.closeEvidence} />
      <Wave2DecisionChamber decision={decision} onClose={() => setDecision(null)} />
    </main>
  )
}
