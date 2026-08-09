'use client'

import { useState } from 'react'
import styles from './Wave2CommandExperience.module.css'
import type { Wave2Decision, Wave2IncidentCommand } from './Wave2CommandTypes'
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
  useWave2Investigation,
} from './Wave2CommandPrimitives'

const lenses = ['Live command', 'Impact', 'Investigation', 'Containment', 'Communications', 'Recovery', 'Post-incident', 'Audit']

export default function IncidentWarRoom({ command }: { command: Wave2IncidentCommand }) {
  const [lens, setLens] = useState('Live command')
  const [decision, setDecision] = useState<Wave2Decision | null>(null)
  const investigation = useWave2Investigation(command.evidence)
  return (
    <main className={`${styles.commandRoom} ${styles.incident}`}>
      <Wave2SourceHealth command={command} />
      <Wave2IdentityChamber command={command} kind="incident" extra={<div className={styles.identityMeta}><span className={styles.pill}>Sévérité · {command.incident.severity}</span><span className={styles.pill}>Client · {command.client?.display_name || 'Non lié'}</span><span className={styles.pill}>Tenant · {command.tenant?.tenant_slug || 'Non lié'}</span><span className={styles.pill}>{command.tasks.filter((item) => ['todo', 'in_progress', 'blocked'].includes(String(item.status))).length} action(s) ouverte(s)</span></div>} />
      <Wave2IntelligenceRibbon items={command.ribbon} onEvidence={investigation.openEvidence} />
      <Wave2LensBar lenses={lenses} active={lens} onChange={setLens} />
      <div className={styles.commandGrid}>
        <div className={styles.mainColumn}>
          {lens === 'Live command' ? <>
            <Wave2Section eyebrow="Incident command phases" title="De la détection au post-incident" description="Une clôture n’est possible qu’après recovery, communication, risques résiduels et follow-up."><Wave2Lifecycle steps={command.phases} /></Wave2Section>
            <Wave2Section eyebrow="Live pressure" title="Situation, impact et commandement" description="La sévérité, le périmètre, les actions, la communication et la valeur exposée restent unifiés."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          </> : null}
          {lens === 'Impact' ? <Wave2Section eyebrow="Incident topology" title="Clients, tenants, tickets, actions et revenu exposé" description="Chaque nœud ouvre son command room ou sa source d’exécution."><Wave2RelationshipField nodes={command.relationships} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Investigation' ? <Wave2Section eyebrow="Evidence field" title="Constats, symptômes et objets liés" description="Aucune cause racine n’est inventée; seules les preuves disponibles sont exposées."><Wave2FactorGrid factors={command.factors.filter((item) => ['severity', 'service', 'impact'].includes(item.id))} onEvidence={investigation.openEvidence} /><Wave2Timeline events={command.timeline} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Containment' || lens === 'Recovery' ? <Wave2Section eyebrow="Operational response" title={lens === 'Containment' ? 'Containment et mitigation' : 'Recovery et monitoring'} description="Les tâches ouvertes et bloquées déterminent la capacité à avancer vers la clôture."><Wave2RelationshipField nodes={command.relationships.filter((node) => ['task', 'ticket', 'tenant'].includes(node.kind))} onEvidence={investigation.openEvidence} /><Wave2FactorGrid factors={command.factors.filter((item) => ['service', 'severity'].includes(item.id))} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Communications' ? <Wave2Section eyebrow="Customer communications" title="État de communication et preuves" description="L’absence de communication explicite est signalée au lieu d’être masquée."><Wave2FactorGrid factors={command.factors.filter((item) => item.id === 'communication')} onEvidence={investigation.openEvidence} /><Wave2Timeline events={command.timeline.filter((item) => item.detail.toLowerCase().includes('communication') || item.title.toLowerCase().includes('communication'))} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
          {lens === 'Post-incident' ? <>
            <Wave2Section eyebrow="Closure gate" title="Chambre de clôture contrôlée" description="Recovery, communication, risques restants, root cause et owners de follow-up doivent être vérifiés."><Wave2ActionDock actions={command.actions.filter((action) => action.decision)} onDecision={setDecision} /></Wave2Section>
            <Wave2Section eyebrow="Follow-up evidence" title="Actions et risques résiduels" description="Un incident résolu n’est pas encore nécessairement prêt à être clôturé."><Wave2RelationshipField nodes={command.relationships.filter((node) => ['task', 'ticket', 'renewal'].includes(node.kind))} onEvidence={investigation.openEvidence} /></Wave2Section>
          </> : null}
          {lens === 'Audit' ? <Wave2Section eyebrow="Forensic incident stream" title="Chronologie de commandement" description="Détection, investigation, actions, communications, recovery et décisions."><Wave2Timeline events={command.timeline} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
        </div>
        <aside className={styles.sideColumn}>
          <Wave2Section eyebrow="Command posture" title="État de l’incident" description="Le commandement doit rester attribué, daté et soutenu par les preuves."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          <Wave2Section eyebrow="Affected network" title="Périmètre associé" description="Client, tenant, tickets, tâches, abonnements et renouvellements."><Wave2RelationshipField nodes={command.relationships.slice(0, 9)} onEvidence={investigation.openEvidence} /></Wave2Section>
        </aside>
      </div>
      <Wave2ActionDock actions={command.actions} onDecision={setDecision} />
      <Wave2EvidenceDrawer open={investigation.drawerOpen} title={investigation.drawerTitle} evidence={investigation.filteredEvidence} selectedId={investigation.selectedEvidenceId} onSelect={(id) => investigation.setSelectedEvidenceId(id || null)} onClose={investigation.closeEvidence} />
      <Wave2DecisionChamber decision={decision} onClose={() => setDecision(null)} />
    </main>
  )
}
