'use client'

import type { SovereignEntity, SovereignWorkspaceSnapshot } from './SovereignTypes'
import { DeepNavigation, EntityMatrix, FlowField, PressureList, Surface } from './SovereignPrimitives'
import styles from './SovereignExperience.module.css'

export default function ServiceSovereignScene({snapshot,onOpen}:{snapshot:SovereignWorkspaceSnapshot;onOpen:(entity:SovereignEntity)=>void}) {
  const missions=snapshot.entities.filter(e=>e.kind==='onboarding')
  const tickets=snapshot.entities.filter(e=>e.kind==='ticket')
  const incidents=snapshot.entities.filter(e=>e.kind==='incident')
  const pressure=[...incidents.filter(e=>e.status!=='resolved'),...tickets.filter(e=>!['resolved','closed','archived'].includes(e.status||'')),...missions.filter(e=>['blocked','in_progress'].includes(e.status||''))].map(e=>({title:e.title,detail:`${e.kind} · ${e.subtitle||'Contexte client'}`,value:e.status||'À piloter'}))
  return <div className={styles.sceneGrid}>
    <div className={styles.sceneMain}>
      <Surface eyebrow="Service Mission Network" title="Activation, adoption et protection du client" description="Les missions de déploiement, tickets, incidents et actions de service sont reliés à leur client et tenant." count={missions.length+tickets.length+incidents.length}><FlowField nodes={[{label:'Activation',value:String(missions.length)},{label:'Tickets',value:String(tickets.length)},{label:'Incidents',value:String(incidents.length)},{label:'Actions',value:String(snapshot.entities.filter(e=>e.kind==='task').length)},{label:'Pression',value:String(pressure.length)}]}/></Surface>
      <Surface eyebrow="Activation Runway" title="Missions de déploiement" count={missions.length}><EntityMatrix entities={missions} empty="Aucune mission d’onboarding chargée." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Resolution Theatre" title="Support et Incident Command" count={tickets.length+incidents.length}><EntityMatrix entities={[...incidents,...tickets]} empty="Aucun ticket ou incident chargé." onOpen={onOpen}/></Surface>
      <Surface eyebrow="Service Instruments" title="Opérations client"><DeepNavigation items={[{eyebrow:'Launch',label:'Onboarding',href:'/angelcare-360-operator/onboarding'},{eyebrow:'Delivery',label:'Implementation',href:'/angelcare-360-operator/implementation'},{eyebrow:'Resolution',label:'Support',href:'/angelcare-360-operator/support'},{eyebrow:'Requests',label:'Service Requests',href:'/angelcare-360-operator/service-requests'},{eyebrow:'War Room',label:'Incidents',href:'/angelcare-360-operator/incidents'}]}/></Surface>
    </div>
    <aside className={styles.sceneSide}><Surface eyebrow="Service Pressure" title="SLA, blocages et impact" count={pressure.length}><PressureList items={pressure} empty="Aucune pression service active."/></Surface><Surface eyebrow="Customer Communication" title="Preuve de liaison"><div className={styles.emptySignal}>Les notes et statuts de communication sont traçables. L’envoi externe reste explicite et ne sera jamais simulé sans moteur connecté.</div></Surface></aside>
  </div>
}
