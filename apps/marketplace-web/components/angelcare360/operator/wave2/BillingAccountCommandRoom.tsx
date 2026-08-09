'use client'

import { useState } from 'react'
import styles from './Wave2CommandExperience.module.css'
import type { Wave2BillingCommand, Wave2Decision } from './Wave2CommandTypes'
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
  Wave2SimulationView,
  Wave2SourceHealth,
  Wave2Timeline,
  formatDh,
  toneColor,
  useWave2Investigation,
} from './Wave2CommandPrimitives'

const lenses = ['Position financière', 'Factures', 'Paiements', 'Engagements', 'Collection', 'Restrictions', 'Audit']

export default function BillingAccountCommandRoom({ command }: { command: Wave2BillingCommand }) {
  const [lens, setLens] = useState('Position financière')
  const [decision, setDecision] = useState<Wave2Decision | null>(null)
  const investigation = useWave2Investigation(command.evidence)
  return (
    <main className={`${styles.commandRoom} ${styles.billing}`}>
      <Wave2SourceHealth command={command} />
      <Wave2IdentityChamber command={command} kind="billing" extra={<div className={styles.identityMeta}><span className={styles.pill}>Email · {command.account.billing_email}</span><span className={styles.pill}>Conditions · {command.account.payment_terms_days} jours</span><span className={styles.pill}>{command.invoices.length} facture(s)</span><span className={styles.pill}>{command.payments.length} paiement(s)</span></div>} />
      <Wave2IntelligenceRibbon items={command.ribbon} onEvidence={investigation.openEvidence} />
      <Wave2LensBar lenses={lenses} active={lens} onChange={setLens} />
      <div className={styles.commandGrid}>
        <div className={styles.mainColumn}>
          {lens === 'Position financière' ? <>
            <Wave2Section eyebrow="Financial movement" title="De la valeur facturée au cash confirmé" description="Chaque étape expose son montant, son volume et sa signification opérationnelle."><div className={styles.movement}>{command.collectionStages.map((stage) => { const max = Math.max(...command.collectionStages.map((item) => item.amountDh), 1); return <article key={stage.key} className={styles.movementRow}><span className={styles.movementLabel}>{stage.label}<small style={{ display: 'block', color: '#64748b', marginTop: 3 }}>{stage.count} objet(s)</small></span><span className={styles.movementTrack}><span className={styles.movementFill} style={{ width: `${Math.max(4, stage.amountDh / max * 100)}%`, background: toneColor(stage.tone) }} /></span><span className={styles.movementValue}>{formatDh(stage.amountDh)}</span></article>})}</div></Wave2Section>
            <Wave2Section eyebrow="Financial intelligence" title="Position, fiabilité et risque relationnel" description="Le compte de facturation reste connecté au client et aux abonnements actifs."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          </> : null}
          {lens === 'Factures' ? <Wave2Section eyebrow="Invoice architecture" title="Registre des factures liées" description="Chaque facture ouvre sa preuve et sa source d’exécution."><Wave2RelationshipField nodes={command.relationships.filter((node) => node.kind === 'invoice')} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Paiements' ? <Wave2Section eyebrow="Payment validation desk" title="Paiements, preuves et validation" description="Les paiements confirmés, en attente ou rejetés restent distincts."><Wave2RelationshipField nodes={command.relationships.filter((node) => node.kind === 'payment')} onEvidence={investigation.openEvidence} /><Wave2FactorGrid factors={command.factors.filter((item) => ['collection', 'verification'].includes(item.id))} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Engagements' || lens === 'Collection' ? <Wave2Section eyebrow="Collection intervention" title={lens === 'Engagements' ? 'Promesses et responsabilités' : 'Niveaux d’intervention de recouvrement'} description="Le système ne confond pas rappel, promesse, intervention commerciale et restriction."><div className={styles.lifecycle}>{command.collectionStages.map((stage, index) => <article key={stage.key} className={`${styles.lifecycleStep} ${stage.tone === 'critical' ? styles.lifecycleBlocked : stage.tone === 'success' ? styles.lifecycleDone : styles.lifecycleCurrent}`}><span className={styles.lifecycleIndex}>{String(index + 1).padStart(2, '0')}</span><span className={styles.lifecycleLabel}>{stage.label}</span><span className={styles.lifecycleDetail}>{stage.detail} · {formatDh(stage.amountDh)}</span></article>)}</div></Wave2Section> : null}
          {lens === 'Restrictions' ? <>
            <Wave2Section eyebrow="Restriction consequences" title="Simulation avant recommandation" description="Le compte peut couvrir plusieurs abonnements et tenants; les impacts inconnus restent déclarés indisponibles."><Wave2SimulationView simulation={command.restrictionSimulation} /></Wave2Section>
            <Wave2Section eyebrow="Authority gate" title="Décision de restriction" description="L’exécution reste dans le workspace protégé après examen des preuves et alternatives."><Wave2ActionDock actions={command.actions.filter((item) => item.decision)} onDecision={setDecision} /></Wave2Section>
          </> : null}
          {lens === 'Audit' ? <Wave2Section eyebrow="Financial evidence stream" title="Chronologie factures, paiements et renouvellements" description="Les événements restent traçables jusqu’à leur source."><Wave2Timeline events={command.timeline} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
        </div>
        <aside className={styles.sideColumn}>
          <Wave2Section eyebrow="Exposure matrix" title="Exposition et décision" description="La collection doit protéger le cash sans ignorer la relation et le service."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          <Wave2Section eyebrow="Financial relationships" title="Objets financiers liés" description="Client, abonnements, factures, paiements et renouvellements."><Wave2RelationshipField nodes={command.relationships.slice(0, 10)} onEvidence={investigation.openEvidence} /></Wave2Section>
        </aside>
      </div>
      <Wave2ActionDock actions={command.actions} onDecision={setDecision} />
      <Wave2EvidenceDrawer open={investigation.drawerOpen} title={investigation.drawerTitle} evidence={investigation.filteredEvidence} selectedId={investigation.selectedEvidenceId} onSelect={(id) => investigation.setSelectedEvidenceId(id || null)} onClose={investigation.closeEvidence} />
      <Wave2DecisionChamber decision={decision} onClose={() => setDecision(null)} />
    </main>
  )
}
