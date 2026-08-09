'use client'

import type { SovereignEntity, SovereignWorkspaceSnapshot } from './SovereignTypes'
import { DeepNavigation, EntityMatrix, FlowField, PressureList, Surface } from './SovereignPrimitives'
import styles from './SovereignExperience.module.css'

export default function GrowthSovereignScene({ snapshot,onOpen }:{snapshot:SovereignWorkspaceSnapshot;onOpen:(entity:SovereignEntity)=>void}) {
  const clients=snapshot.entities.filter(e=>e.kind==='client')
  const contracts=snapshot.entities.filter(e=>e.kind==='contract')
  const renewals=snapshot.entities.filter(e=>e.kind==='renewal')
  const risk=clients.filter(e=>['at_risk','critical','high'].some(v=>(e.status||'').includes(v)||e.fields.some(f=>f.value.toLowerCase().includes(v.replace('_',' '))))).map(e=>({title:e.title,detail:e.subtitle||'Compte stratégique',value:'Intervention'}))
  return <div className={styles.sceneGrid}>
    <div className={styles.sceneMain}>
      <Surface eyebrow="Commercial Constellation" title="Portefeuille relationnel connecté" description="Clients, contrats, renouvellements et expansion sont opérés comme une constellation de valeur, pas comme des lignes CRM." count={clients.length}><EntityMatrix entities={clients} empty="Aucun compte client dans le portefeuille." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Value Conversion" title="Circulation commerciale" description="De la relation active au renouvellement et à l’expansion."><FlowField nodes={[{label:'Comptes',value:String(clients.length)},{label:'Contrats',value:String(contracts.length)},{label:'Subscriptions',value:String(snapshot.entities.filter(e=>e.kind==='subscription').length)},{label:'Renouvellements',value:String(renewals.length)},{label:'Valeur mensuelle',value:snapshot.metrics.find(m=>m.key==='value')?.value||'—'}]}/></Surface>
      <Surface eyebrow="Negotiation & Retention" title="Contrats et renouvellements" count={contracts.length+renewals.length}><EntityMatrix entities={[...renewals,...contracts]} empty="Aucun contrat ou renouvellement chargé." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Commercial Operating Modes" title="Outils de croissance"><DeepNavigation items={[{eyebrow:'Relation',label:'Dossiers clients',href:'/angelcare-360-operator/clients'},{eyebrow:'Transaction',label:'Contrats',href:'/angelcare-360-operator/contracts'},{eyebrow:'Rétention',label:'Renewal Strategy',href:'/angelcare-360-operator/renewals'},{eyebrow:'Diagnostic',label:'Customer Health',href:'/angelcare-360-operator/customer-health'}]}/></Surface>
    </div>
    <aside className={styles.sceneSide}>
      <Surface eyebrow="Strategic Accounts" title="Risques et expansion" count={risk.length}><PressureList items={risk} empty="Aucun compte explicitement classé à risque dans les données chargées."/></Surface>
      <Surface eyebrow="Decision-Maker Coverage" title="Qualité relationnelle"><div className={styles.pressureList}>{clients.slice(0,6).map(client=>({title:client.title,detail:client.fields.find(f=>f.label==='Contact')?.value||'Décideur non renseigné',value:client.status||'—'})).map(item=><div className={styles.pressureItem} key={item.title}><span className={styles.pressureSignal}/><div className={styles.pressureCopy}><strong>{item.title}</strong><span>{item.detail}</span></div><span className={styles.pressureValue}>{item.value}</span></div>)}</div></Surface>
    </aside>
  </div>
}
