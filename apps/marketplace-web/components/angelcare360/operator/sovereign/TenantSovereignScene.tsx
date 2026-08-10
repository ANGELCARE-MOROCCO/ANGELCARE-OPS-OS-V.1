'use client'

import type { SovereignEntity, SovereignWorkspaceSnapshot } from './SovereignTypes'
import { DeepNavigation, EntityMatrix, FlowField, PressureList, Surface } from './SovereignPrimitives'
import styles from './SovereignExperience.module.css'

export default function TenantSovereignScene({snapshot,onOpen}:{snapshot:SovereignWorkspaceSnapshot;onOpen:(entity:SovereignEntity)=>void}) {
  const tenants=snapshot.entities.filter(e=>e.kind==='tenant')
  const subscriptions=snapshot.entities.filter(e=>e.kind==='subscription')
  const features=snapshot.entities.filter(e=>e.kind==='feature')
  const limits=snapshot.entities.filter(e=>e.kind==='limit')
  const attention=[...tenants.filter(e=>e.status!=='active'),...features.filter(e=>['locked','requires_configuration'].includes(e.status||'')),...limits.filter(e=>e.status==='paused')].map(e=>({title:e.title,detail:`${e.kind} · ${e.subtitle||''}`,value:e.status||'À contrôler'}))
  return <div className={styles.sceneGrid}>
    <div className={styles.sceneMain}>
      <Surface eyebrow="Living Digital-Twin Fleet" title="Flotte mondiale des environnements clients" description="Chaque tenant représente une infrastructure de service reliée au client, à l’abonnement, aux capacités et à la gouvernance." count={tenants.length}><EntityMatrix entities={tenants} empty="Aucun tenant provisionné." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Tenant Topology" title="Topologie produit et capacité"><FlowField nodes={[{label:'Tenants',value:String(tenants.length)},{label:'Subscriptions',value:String(subscriptions.length)},{label:'Entitlements',value:String(features.length)},{label:'Limites',value:String(limits.length)},{label:'Incidents',value:String(snapshot.entities.filter(e=>e.kind==='incident').length)}]}/></Surface>
      <Surface eyebrow="Capability Architecture" title="Entitlements et limites" count={features.length+limits.length}><EntityMatrix entities={[...features.slice(0,8),...limits.slice(0,8)]} empty="Aucun entitlement ou limite disponible." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Infrastructure Instruments" title="Contrôle approfondi"><DeepNavigation items={[{eyebrow:'Digital Twins',label:'Tenants',href:'/angelcare-360-operator/tenants'},{eyebrow:'Commercial Service',label:'Subscriptions',href:'/angelcare-360-operator/subscriptions'},{eyebrow:'Product Architecture',label:'Plans & Packages',href:'/angelcare-360-operator/plans'},{eyebrow:'Capabilities',label:'Feature Flags',href:'/angelcare-360-operator/features'},{eyebrow:'Capacity',label:'Usage Limits',href:'/angelcare-360-operator/usage-limits'}]}/></Surface>
    </div>
    <aside className={styles.sceneSide}><Surface eyebrow="Fleet Exceptions" title="Configuration et capacité" count={attention.length}><PressureList items={attention} empty="Aucune exception tenant détectée."/></Surface><Surface eyebrow="Configuration Parity" title="État attendu vs réel"><div className={styles.emptySignal}>La comparaison de configuration est disponible à partir des entitlements, limites et statuts actuels. Le rollback technique reste verrouillé tant que le backend ne publie pas de versioning de configuration.</div></Surface></aside>
  </div>
}
