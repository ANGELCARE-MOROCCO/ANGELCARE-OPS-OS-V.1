'use client'

import { useState } from 'react'
import styles from './Wave2CommandExperience.module.css'
import type { Wave2CustomerCommand, Wave2Decision } from './Wave2CommandTypes'
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
  Wave2SourceHealth,
  Wave2Timeline,
  formatDh,
  useWave2Investigation,
} from './Wave2CommandPrimitives'

const lenses = ['Executive', 'Relation', 'Finance', 'Produit', 'Service', 'Renouvellement', 'Expansion', 'Audit']

export default function CustomerRelationshipCommandRoom({ command }: { command: Wave2CustomerCommand }) {
  const [lens, setLens] = useState('Executive')
  const [decision, setDecision] = useState<Wave2Decision | null>(null)
  const investigation = useWave2Investigation(command.evidence)
  const serviceFactors = command.factors.filter((factor) => ['service', 'adoption', 'relationship'].includes(factor.id))
  const financialFactors = command.factors.filter((factor) => ['finance', 'renewal'].includes(factor.id))

  return (
    <main className={`${styles.commandRoom} ${styles.customer}`}>
      <Wave2SourceHealth command={command} />
      <Wave2IdentityChamber command={command} kind="customer" extra={<div className={styles.identityMeta}><span className={styles.pill}>Santé · {command.healthScore}/100</span><span className={styles.pill}>{command.tenants.length} tenant(s)</span><span className={styles.pill}>{command.subscriptions.length} abonnement(s)</span><span className={styles.pill}>{command.renewals.length} renouvellement(s)</span></div>} />
      <Wave2IntelligenceRibbon items={command.ribbon} onEvidence={investigation.openEvidence} />
      <Wave2LensBar lenses={lenses} active={lens} onChange={setLens} />

      <div className={styles.commandGrid}>
        <div className={styles.mainColumn}>
          <Wave2Section eyebrow="Relationship architecture" title="Colonne vertébrale du cycle client" description="Chaque étape expose la situation actuelle, les blocages et la prochaine transition attendue." badge={command.client.lifecycle_stage}>
            <Wave2Lifecycle steps={command.lifecycle} />
          </Wave2Section>

          {lens === 'Executive' || lens === 'Relation' ? (
            <Wave2Section eyebrow="Operational twin" title="Jumeau de relation AngelCare–client" description="Une lecture connectée de la valeur, de l’adoption, du service, de la finance et de la rétention.">
              <Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} />
            </Wave2Section>
          ) : null}

          {lens === 'Finance' ? (
            <Wave2Section eyebrow="Financial relationship" title="Position financière et exposition" description="Encours, retards, paiements et valeur récurrente restent reliés à la relation complète." badge={formatDh(command.financialValueDh)}>
              <Wave2FactorGrid factors={financialFactors} onEvidence={investigation.openEvidence} />
              <Wave2RelationshipField nodes={command.relationships.filter((node) => ['billing', 'invoice', 'payment', 'subscription', 'renewal'].includes(node.kind))} onEvidence={investigation.openEvidence} />
            </Wave2Section>
          ) : null}

          {lens === 'Produit' ? (
            <Wave2Section eyebrow="Product relationship" title="Tenants, abonnements et adoption" description="Le command room relie la relation commerciale à la réalité de service et d’usage.">
              <Wave2RelationshipField nodes={command.relationships.filter((node) => ['tenant', 'subscription', 'feature', 'usage'].includes(node.kind))} onEvidence={investigation.openEvidence} />
              <Wave2FactorGrid factors={command.factors.filter((factor) => factor.id === 'adoption')} onEvidence={investigation.openEvidence} />
            </Wave2Section>
          ) : null}

          {lens === 'Service' ? (
            <Wave2Section eyebrow="Service pressure" title="Pression support, incidents et expérience" description="Les signaux de service sont replacés dans leur impact relationnel et financier.">
              <Wave2FactorGrid factors={serviceFactors} onEvidence={investigation.openEvidence} />
              <Wave2RelationshipField nodes={command.relationships.filter((node) => ['incident', 'ticket', 'task'].includes(node.kind))} onEvidence={investigation.openEvidence} />
            </Wave2Section>
          ) : null}

          {lens === 'Renouvellement' || lens === 'Expansion' ? (
            <Wave2Section eyebrow="Retention & growth" title={lens === 'Renouvellement' ? 'Préparation du renouvellement' : 'Potentiel d’expansion'} description="Les décisions de valeur doivent rester liées à l’adoption, au service, à la finance et aux contacts décisionnaires.">
              <Wave2FactorGrid factors={command.factors.filter((factor) => ['renewal', 'adoption', 'relationship', 'finance', 'service'].includes(factor.id))} onEvidence={investigation.openEvidence} />
              <Wave2RelationshipField nodes={command.relationships.filter((node) => ['renewal', 'subscription', 'contract', 'tenant'].includes(node.kind))} onEvidence={investigation.openEvidence} />
            </Wave2Section>
          ) : null}

          {lens === 'Audit' ? (
            <Wave2Section eyebrow="Forensic relationship" title="Chronologie probante" description="Factures, paiements, contrats, incidents et décisions restent ordonnés dans une seule histoire.">
              <Wave2Timeline events={command.timeline} onEvidence={investigation.openEvidence} />
            </Wave2Section>
          ) : null}

          {lens === 'Executive' || lens === 'Relation' ? (
            <Wave2Section eyebrow="Relationship map" title="Carte vivante des objets liés" description="Chaque nœud ouvre son command room ou sa source opérationnelle sans casser le contexte.">
              <Wave2RelationshipField nodes={command.relationships} onEvidence={investigation.openEvidence} />
            </Wave2Section>
          ) : null}
        </div>

        <aside className={styles.sideColumn}>
          <Wave2Section eyebrow="Executive scan" title="Situation de management" description="Le facteur causal dominant doit être traité par un owner unique.">
            <Wave2FactorGrid factors={command.factors.slice(0, 4)} onEvidence={investigation.openEvidence} />
          </Wave2Section>
          <Wave2Section eyebrow="Latest evidence" title="Derniers événements" description="Les événements restent cliquables et reliés à leur preuve.">
            <Wave2Timeline events={command.timeline.slice(0, 7)} onEvidence={investigation.openEvidence} />
          </Wave2Section>
        </aside>
      </div>

      <Wave2ActionDock actions={command.actions} onDecision={setDecision} />
      <Wave2EvidenceDrawer open={investigation.drawerOpen} title={investigation.drawerTitle} evidence={investigation.filteredEvidence} selectedId={investigation.selectedEvidenceId} onSelect={(id) => investigation.setSelectedEvidenceId(id || null)} onClose={investigation.closeEvidence} />
      <Wave2DecisionChamber decision={decision} onClose={() => setDecision(null)} />
    </main>
  )
}
