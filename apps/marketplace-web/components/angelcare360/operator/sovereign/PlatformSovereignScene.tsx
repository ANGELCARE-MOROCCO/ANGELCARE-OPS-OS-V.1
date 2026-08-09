'use client'

import type { SovereignEntity, SovereignWorkspaceSnapshot } from './SovereignTypes'
import { DeepNavigation, EntityMatrix, FlowField, PressureList, Surface } from './SovereignPrimitives'
import styles from './SovereignExperience.module.css'

export default function PlatformSovereignScene({snapshot,onOpen}:{snapshot:SovereignWorkspaceSnapshot;onOpen:(entity:SovereignEntity)=>void}) {
  const features=snapshot.entities.filter(e=>e.kind==='feature')
  const limits=snapshot.entities.filter(e=>e.kind==='limit')
  const audit=snapshot.entities.filter(e=>e.kind==='audit')
  const controls=[...features.filter(e=>['locked','requires_configuration'].includes(e.status||'')),...limits.filter(e=>e.status!=='active')].map(e=>({title:e.title,detail:e.subtitle||e.kind,value:e.status||'À vérifier'}))
  return <div className={styles.sceneGrid}>
    <div className={styles.sceneMain}>
      <Surface eyebrow="Control Lattice" title="Autorité, capacités, preuve et santé plateforme" description="Le contrôle lattice relie tenants, feature flags, limites, audit et incidents sans exposer le langage technique aux opérateurs."><FlowField nodes={[{label:'Clients',value:String(snapshot.metrics.find(m=>m.key==='tenants')?.detail.match(/\d+/)?.[0]||'—')},{label:'Tenants',value:snapshot.metrics.find(m=>m.key==='tenants')?.value||'—'},{label:'Feature flags',value:String(features.length)},{label:'Limites',value:String(limits.length)},{label:'Audit',value:String(audit.length)}]}/></Surface>
      <Surface eyebrow="Authority & Product Controls" title="Capacités gouvernées" count={features.length+limits.length}><EntityMatrix entities={[...features,...limits]} empty="Aucun contrôle produit chargé." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Forensic Observatory" title="Événements audités" count={audit.length}><EntityMatrix entities={audit.slice(0,12)} empty="Aucun événement d’audit visible dans le périmètre." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Governance Instruments" title="Contrôle de la machine"><DeepNavigation items={[{eyebrow:'Identity',label:'Operator Roles',href:'/angelcare-360-operator/operator-roles'},{eyebrow:'Policy',label:'Settings',href:'/angelcare-360-operator/settings'},{eyebrow:'Evidence',label:'Audit Observatory',href:'/angelcare-360-operator/audit'},{eyebrow:'Product Control',label:'Feature Flags',href:'/angelcare-360-operator/features'},{eyebrow:'Capacity',label:'Usage Limits',href:'/angelcare-360-operator/usage-limits'}]}/></Surface>
    </div>
    <aside className={styles.sceneSide}><Surface eyebrow="Control Exceptions" title="Verrous et configuration" count={controls.length}><PressureList items={controls} empty="Aucune exception de gouvernance détectée."/></Surface><Surface eyebrow="Authority Simulator" title="Séparation des pouvoirs"><div className={styles.emptySignal}>Le contrat visuel d’autorité est présent. La simulation complète de rôles et seuils reste verrouillée jusqu’à publication d’un moteur RBAC Operator persistant et vérifiable.</div></Surface></aside>
  </div>
}
