'use client'

import { useState } from 'react'
import OperatorOverlayPortal from '../OperatorOverlayPortal'
import styles from './Wave2CommandExperience.module.css'
import type { Wave2Decision, Wave2Simulation, Wave2TenantCommand } from './Wave2CommandTypes'
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
  useWave2Investigation,
} from './Wave2CommandPrimitives'

const lenses = ['Operations', 'Capacités', 'Usage', 'Accès', 'Restriction', 'Service', 'Sécurité', 'Audit']

export default function TenantOperationalTwin({ command }: { command: Wave2TenantCommand }) {
  const [lens, setLens] = useState('Operations')
  const [decision, setDecision] = useState<Wave2Decision | null>(null)
  const [simulation, setSimulation] = useState<Wave2Simulation | null>(null)
  const investigation = useWave2Investigation(command.evidence)
  return (
    <main className={`${styles.commandRoom} ${styles.tenant}`}>
      <Wave2SourceHealth command={command} />
      <Wave2IdentityChamber command={command} kind="tenant" extra={<div className={styles.identityMeta}><span className={styles.pill}>Environnement · {command.tenant.environment}</span><span className={styles.pill}>Provisionnement · {command.tenant.provisioning_status}</span><span className={styles.pill}>{command.features.length} flag(s)</span><span className={styles.pill}>{command.usage.length} limite(s)</span></div>} />
      <Wave2IntelligenceRibbon items={command.ribbon} onEvidence={investigation.openEvidence} />
      <Wave2LensBar lenses={lenses} active={lens} onChange={setLens} />

      <div className={styles.commandGrid}>
        <div className={styles.mainColumn}>
          {lens === 'Operations' ? <>
            <Wave2Section eyebrow="Tenant topology" title="Topologie opérationnelle du tenant" description="Client, abonnement, capacités, usage, service et incidents restent visibles dans une architecture unique.">
              <Wave2RelationshipField nodes={command.relationships} onEvidence={investigation.openEvidence} />
            </Wave2Section>
            <Wave2Section eyebrow="Runtime intelligence" title="État vivant du service" description="État principal, provisionnement, capacité, restrictions et pression opérationnelle.">
              <Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} />
            </Wave2Section>
          </> : null}

          {lens === 'Capacités' ? <Wave2Section eyebrow="Capability field" title="Architecture des modules et fonctionnalités" description="Chaque module montre les capacités actives et restreintes sans transformer les flags en décoration.">
            {command.capabilitySummary.length ? <div className={styles.capabilityGrid}>{command.capabilitySummary.map((item) => <article key={item.module} className={styles.capability}><div className={styles.capabilityTop}><span className={styles.capabilityName}>{item.module}</span><span className={styles.capabilityCount}>{item.enabled}/{item.total}</span></div><div className={styles.capabilityBar}><div className={styles.capabilityFill} style={{ width: `${item.total ? item.enabled / item.total * 100 : 0}%` }} /></div><div className={styles.capabilityMeta}>{item.restricted} restriction(s) · ouvrir une preuve pour comprendre la cause.</div></article>)}</div> : <Wave2FactorGrid factors={command.factors.filter((factor) => factor.id === 'capabilities')} onEvidence={investigation.openEvidence} />}
            <Wave2RelationshipField nodes={command.relationships.filter((node) => node.kind === 'feature')} onEvidence={investigation.openEvidence} />
          </Wave2Section> : null}

          {lens === 'Usage' ? <Wave2Section eyebrow="Capacity command" title="Consommation et limites" description="Aucune estimation de breach n’est affichée sans historique suffisant.">
            <Wave2FactorGrid factors={command.factors.filter((factor) => factor.id === 'capacity')} onEvidence={investigation.openEvidence} />
            <Wave2RelationshipField nodes={command.relationships.filter((node) => node.kind === 'usage')} onEvidence={investigation.openEvidence} />
          </Wave2Section> : null}

          {lens === 'Accès' || lens === 'Restriction' ? <>
            <Wave2Section eyebrow="Consequence simulation" title={lens === 'Restriction' ? 'Simulation de suspension' : 'Simulation de restauration'} description="Les résultats sont marqués exacts, dérivés, estimés ou indisponibles.">
              <Wave2SimulationView simulation={lens === 'Restriction' ? command.suspensionSimulation : command.restorationSimulation} />
              <button type="button" className={`${styles.actionButton} ${styles.actionCritical}`} onClick={() => setSimulation(lens === 'Restriction' ? command.suspensionSimulation : command.restorationSimulation)}>Ouvrir la simulation détaillée</button>
            </Wave2Section>
            <Wave2Section eyebrow="Authority" title="Décision et autorité" description="Une mutation de statut ne doit jamais être réduite à un simple bouton.">
              <Wave2ActionDock actions={command.actions.filter((action) => action.decision)} onDecision={setDecision} />
            </Wave2Section>
          </> : null}

          {lens === 'Service' || lens === 'Sécurité' ? <Wave2Section eyebrow="Operational pressure" title={lens === 'Service' ? 'Tickets, incidents et recovery' : 'Accès, état et preuves de contrôle'} description="Le tenant reste relié aux objets service et aux signaux de risque.">
            <Wave2FactorGrid factors={command.factors.filter((factor) => ['service', 'incident', 'provisioning'].includes(factor.id))} onEvidence={investigation.openEvidence} />
            <Wave2RelationshipField nodes={command.relationships.filter((node) => ['ticket', 'incident', 'task'].includes(node.kind))} onEvidence={investigation.openEvidence} />
          </Wave2Section> : null}

          {lens === 'Audit' ? <Wave2Section eyebrow="Tenant event stream" title="Chronologie du runtime et des décisions" description="Chaque événement ouvre la preuve liée."><Wave2Timeline events={command.timeline} onEvidence={investigation.openEvidence} /></Wave2Section> : null}
        </div>
        <aside className={styles.sideColumn}>
          <Wave2Section eyebrow="Control state" title="État de contrôle" description="Le tenant doit rester cohérent avec son abonnement, ses capacités et sa facturation."><Wave2FactorGrid factors={command.factors} onEvidence={investigation.openEvidence} /></Wave2Section>
          <Wave2Section eyebrow="Related objects" title="Objets critiques" description="Navigation directe vers les objets qui déterminent l’état runtime."><Wave2RelationshipField nodes={command.relationships.slice(0, 8)} onEvidence={investigation.openEvidence} /></Wave2Section>
        </aside>
      </div>

      <Wave2ActionDock actions={command.actions} onDecision={setDecision} />
      <Wave2EvidenceDrawer open={investigation.drawerOpen} title={investigation.drawerTitle} evidence={investigation.filteredEvidence} selectedId={investigation.selectedEvidenceId} onSelect={(id) => investigation.setSelectedEvidenceId(id || null)} onClose={investigation.closeEvidence} />
      <Wave2DecisionChamber decision={decision} onClose={() => setDecision(null)} />
      {simulation ? <SimulationDrawer simulation={simulation} onClose={() => setSimulation(null)} /> : null}
    </main>
  )
}

function SimulationDrawer({ simulation, onClose }: { simulation: Wave2Simulation; onClose: () => void }) {
  return <OperatorOverlayPortal><div className={styles.overlay} role="presentation" onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => { if (event.currentTarget === event.target) onClose() }}><section className={styles.drawer} role="dialog" aria-modal="true"><header className={styles.drawerHeader}><div className={styles.drawerTop}><div><div className={styles.drawerBreadcrumb}>Tenant Twin → Simulation</div><h2 className={styles.drawerTitle}>{simulation.title}</h2></div><button className={styles.closeButton} onClick={onClose} type="button">×</button></div><p className={styles.drawerSubtitle}>{simulation.description}</p></header><div className={styles.drawerBody}><Wave2SimulationView simulation={simulation} /><div className={styles.drawerPanel}><div className={styles.drawerPanelTitle}>Avertissement</div><div className={styles.decisionText}>{simulation.warning}</div></div></div><footer className={styles.drawerFooter}><button className={styles.actionButton} type="button" onClick={onClose}>Fermer</button></footer></section></div></OperatorOverlayPortal>
}
