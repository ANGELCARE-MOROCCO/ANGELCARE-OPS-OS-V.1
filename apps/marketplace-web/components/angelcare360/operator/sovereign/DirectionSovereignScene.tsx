'use client'

import Link from 'next/link'
import type { SovereignEntity, SovereignWorkspaceSnapshot } from './SovereignTypes'
import { DeepNavigation, EntityMatrix, FlowField, PressureList, SourceIntegrity, Surface } from './SovereignPrimitives'
import styles from './SovereignExperience.module.css'

export default function DirectionSovereignScene({ snapshot, onOpen }: { snapshot:SovereignWorkspaceSnapshot; onOpen:(entity:SovereignEntity)=>void }) {
  const clients=snapshot.entities.filter((e)=>e.kind==='client')
  const tenants=snapshot.entities.filter((e)=>e.kind==='tenant')
  const subscriptions=snapshot.entities.filter((e)=>e.kind==='subscription')
  const pressure=snapshot.entities.filter((e)=>['incident','ticket','renewal'].includes(e.kind) && !['resolved','closed','renewed'].includes(e.status||'')).map((e)=>({title:e.title,detail:`${e.kind} · ${e.subtitle||'Contexte à ouvrir'}`,value:e.status||'À qualifier'}))
  return <div className={styles.sceneGrid}>
    <div className={styles.sceneMain}>
      <Surface eyebrow="Strategic Operating Atlas" title="Atlas vivant de la machine SaaS" description="Une lecture connectée du portefeuille, de la flotte tenant, de la valeur contractuelle et des pressions qui nécessitent une décision." count={clients.length+tenants.length}>
        <FlowField nodes={[{label:'Portefeuille',value:String(clients.length)},{label:'Tenants',value:String(tenants.length)},{label:'Subscriptions',value:String(subscriptions.length)},{label:'Valeur active',value:snapshot.metrics.find(m=>m.key==='mrr')?.value||'Indisponible'},{label:'Pression',value:String(pressure.length)}]}/>
      </Surface>
      <Surface eyebrow="Strategic Portfolio" title="Comptes et environnements sous commandement" description="Chaque objet ouvre son contexte, ses relations et les contrôles réellement publiés." count={clients.length+tenants.length}>
        <EntityMatrix entities={[...clients.slice(0,6),...tenants.slice(0,6)]} empty="Aucun client ou tenant disponible dans le périmètre actuel." onOpen={onOpen}/>
      </Surface>
      <Surface eyebrow="Management Architecture" title="Entrées exécutives" description="Board, performance, décisions, risques, horizon et responsabilité restent des scènes distinctes dans le même univers.">
        <DeepNavigation items={[{eyebrow:'Gouvernance',label:'Board Command Mode',href:'/angelcare-360-operator/executive/board'},{eyebrow:'Performance',label:'Executive Command',href:'/angelcare-360-operator/executive'},{eyebrow:'Autorité',label:'Decision Center',href:'/angelcare-360-operator/executive/decisions'},{eyebrow:'Futur',label:'Forward Horizon',href:'/angelcare-360-operator/executive/horizon'},{eyebrow:'Owners',label:'Accountability',href:'/angelcare-360-operator/executive/accountability'}]}/>
      </Surface>
    </div>
    <aside className={styles.sceneSide}>
      <Surface eyebrow="Intervention Agenda" title="Pression à arbitrer" count={pressure.length}><PressureList items={pressure} empty="Aucune pression critique détectée dans les sources chargées."/></Surface>
      <Surface eyebrow="Source Integrity" title="Qualité de la lecture"><SourceIntegrity sources={snapshot.sources}/></Surface>
      <Surface eyebrow="Global Readiness" title="Architecture internationale"><div className={styles.pressureList}>{['Entités légales & régions','Multi-currency & fiscalité','Langues & time zones','Data residency & politiques','Partenaires & white-label'].map((title)=><div className={styles.pressureItem} key={title}><span className={styles.pressureSignal}/><div className={styles.pressureCopy}><strong>{title}</strong><span>Contrat d’extension global prêt à être branché</span></div><span className={styles.pressureValue}>Foundation</span></div>)}</div></Surface>
    </aside>
  </div>
}
