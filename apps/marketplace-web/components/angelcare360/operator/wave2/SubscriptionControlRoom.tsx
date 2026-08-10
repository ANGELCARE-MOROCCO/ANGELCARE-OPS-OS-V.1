'use client'

import { useState } from 'react'
import styles from './Wave2CommandExperience.module.css'
import type { Wave2Decision, Wave2Simulation, Wave2SubscriptionCommand } from './Wave2CommandTypes'
import {
  Wave2ActionDock,
  Wave2DecisionChamber,
  Wave2EvidenceDrawer,
  Wave2FactorGrid,
  Wave2IdentityChamber,
  Wave2IntelligenceRibbon,
  Wave2LensBar,
  Wave2Lifecycle,
  Wave2RelationshipField,
  Wave2Section,
  Wave2SimulationView,
  Wave2SourceHealth,
  Wave2Timeline,
  formatDh,
  useWave2Investigation,
} from './Wave2CommandPrimitives'

const lenses = ['Commercial', 'Entitlements', 'Usage', 'Facturation', 'Changements', 'Renouvellement', 'Audit']

export default function SubscriptionControlRoom({ command }: { command: Wave2SubscriptionCommand }) {
  const [lens, setLens] = useState('Commercial')
  const [decision, setDecision] = useState<Wave2Decision | null>(null)
  const [simulation, setSimulation] = useState<Wave2Simulation | null>(null)
  const investigation = useWave2Investigation(command.evidence)
  return (
    <main className={`${styles.commandRoom} ${styles.subscription}`}>
      <Wave2SourceHealth command={command} />
      <Wave2IdentityChamber command={command} kind="subscription" extra={<div className={styles.identityMeta}><span className={styles.pill}>Plan · {command.plan?.name || 'Non disponible'}</span><span className={styles.pill}>Cycle · {command.subscription.billing_cycle}</span><span className={styles.pill}>Remise · {formatDh(Number(command.subscription.discount_amount_mad || 0))}</span><span className={styles.pill}>{command.features.filter((item) => item.enabled).length} capacité(s) active(s)</span></div>} />
      <Wave2IntelligenceRibbon items={command.ribbon} onEvidence={investigation.openEvidence} />
      <Wave2LensBar lenses={lenses} active={lens} onChange={setLens} />
      <div className={styles.commandGrid}>
        <div className={styles.mainColumn}>
          {lens === 'Commercial' ? <>
            <Wave2Section eyebrow="Service contract line" title="Cycle commercial de l’abonnement" description="Chaque transition conserve sa signification contractuelle, financière et runtime."><Wave2Lifecycle steps={command.lifecycle} /></Wave2Section>
            <Wave2Section eyebrow="Commercial control" title="Valeur, état et relation" description="La valeur récurrente reste reliée au client, au tenant, au plan et aux échéances."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          </> : null}
          {lens === 'Entitlements' ? <Wave2Section eyebrow="Capability architecture" title="Plan → capacités → overrides → runtime" description="Les capacités standard, restreintes et spécifiques restent distinguées."><Wave2FactorGrid factors={command.factors.filter((item) => item.id === 'entitlements')} onEvidence={investigation.openEvidence} /><Wave2RelationshipField nodes={command.relationships.filter((node) => ['tenant', 'contract', 'subscription'].includes(node.kind))} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Usage' ? <Wave2Section eyebrow="Usage control" title="Adéquation entre consommation et limites" description="Les changements de plan doivent être confrontés à l’usage avant validation."><Wave2FactorGrid factors={command.factors.filter((item) => item.id === 'usage')} onEvidence={investigation.openEvidence} /><Wave2RelationshipField nodes={command.relationships.filter((node) => node.kind === 'tenant')} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Facturation' ? <Wave2Section eyebrow="Billing relationship" title="Factures et exposition de l’abonnement" description="L’abonnement reste relié à son encours et à ses prochaines échéances."><Wave2FactorGrid factors={command.factors.filter((item) => item.id === 'billing')} onEvidence={investigation.openEvidence} /><Wave2RelationshipField nodes={command.relationships.filter((node) => node.kind === 'invoice')} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Changements' ? <Wave2Section eyebrow="Change simulator" title="Comparer avant modification" description="Chaque ligne indique si son résultat est exact, dérivé, estimé ou indisponible."><div className={styles.scenarioGrid}>{command.simulations.map((item) => <button key={item.id} type="button" className={styles.scenarioCard} onClick={() => setSimulation(item)}><span className={styles.scenarioTitle}>{item.title}</span><span className={styles.scenarioValue}>{item.financialDeltaDh >= 0 ? '+' : ''}{formatDh(item.financialDeltaDh)}</span><span className={styles.scenarioMeta}>{item.warning}</span></button>)}</div>{simulation ? <Wave2SimulationView simulation={simulation} /> : null}</Wave2Section> : null}
          {lens === 'Renouvellement' ? <Wave2Section eyebrow="Retention bridge" title="Abonnement vers renouvellement" description="La stratégie de renouvellement conserve la preuve du plan, de l’usage, du service et de la finance."><Wave2FactorGrid factors={command.factors.filter((item) => ['renewal', 'commercial', 'billing'].includes(item.id))} onEvidence={investigation.openEvidence} /><Wave2RelationshipField nodes={command.relationships.filter((node) => ['renewal', 'contract', 'customer'].includes(node.kind))} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Audit' ? <Wave2Section eyebrow="Change history" title="Chronologie contractuelle et financière" description="Les transitions, factures, contrats et renouvellements restent reliés."><Wave2Timeline events={command.timeline} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
        </div>
        <aside className={styles.sideColumn}>
          <Wave2Section eyebrow="Control posture" title="État de l’abonnement" description="La modification correcte protège valeur, usage et cohérence runtime."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          <Wave2Section eyebrow="Connected contract" title="Relations essentielles" description="Ouvrir le client, le tenant, les factures, le contrat ou le renouvellement."><Wave2RelationshipField nodes={command.relationships.slice(0, 9)} onEvidence={investigation.openEvidence} /></Wave2Section>
        </aside>
      </div>
      <Wave2ActionDock actions={command.actions} onDecision={setDecision} />
      <Wave2EvidenceDrawer open={investigation.drawerOpen} title={investigation.drawerTitle} evidence={investigation.filteredEvidence} selectedId={investigation.selectedEvidenceId} onSelect={(id) => investigation.setSelectedEvidenceId(id || null)} onClose={investigation.closeEvidence} />
      <Wave2DecisionChamber decision={decision} onClose={() => setDecision(null)} />
    </main>
  )
}
