'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Command, Globe2, Plus, ScanSearch } from 'lucide-react'
import type { SovereignEntity, SovereignWorkspaceSnapshot } from './SovereignTypes'
import { resolveSovereignTower } from '@/data/angelcare360/operator-sovereign-navigation'
import { IntelligenceRibbon, LensBar, WorkspaceCrown } from './SovereignPrimitives'
import SovereignEntityPortal from './SovereignEntityPortal'
import SovereignActionDeck from './SovereignActionDeck'
import DirectionSovereignScene from './DirectionSovereignScene'
import GrowthSovereignScene from './GrowthSovereignScene'
import TenantSovereignScene from './TenantSovereignScene'
import RevenueAuthorityCommandDeck from './revenue-authority/RevenueAuthorityCommandDeck'
import ServiceIndustrialMissionNetwork from './service-authority/ServiceIndustrialMissionNetwork'
import PlatformSovereignScene from './PlatformSovereignScene'
import styles from './SovereignExperience.module.css'

const copy = {
  direction:{eyebrow:'Sovereign Universe 01 · Executive Brain',title:'Direction, stratégie et expansion mondiale',subtitle:'Gouverner la performance, les risques, les décisions, les scénarios, l’horizon et la responsabilité management depuis un seul atlas stratégique.',lenses:['Commandement','Board','Performance','Scénarios','Risques','Horizon']},
  growth:{eyebrow:'Sovereign Universe 02 · Commercial Constellation',title:'Croissance, commerce et portefeuille clients',subtitle:'Piloter acquisition, comptes stratégiques, décisionnaires, contrats, renouvellements, expansion et rétention comme un système de valeur connecté.',lenses:['Portefeuille','Comptes stratégiques','Contrats','Renouvellement','Expansion','Churn']},
  tenants:{eyebrow:'Sovereign Universe 03 · Digital-Twin Fleet',title:'Tenants, produit et infrastructure de service',subtitle:'Provisionner et contrôler chaque environnement client, ses écoles, droits produit, capacités, accès, versions et états de service.',lenses:['Flotte','Digital Twins','Provisioning','Entitlements','Usage','Sécurité']},
  revenue:{eyebrow:'Sovereign Universe 04 · Economic Machine',title:'Revenus, contrats et rentabilité',subtitle:'Relier pricing, abonnement, facture, cash, recouvrement, prévision, renouvellement et valeur protégée dans une circulation financière gouvernée.',lenses:['Revenue Command','Billing','Cash','Collections','Prévisions','Rentabilité']},
  service:{eyebrow:'Sovereign Universe 05 · Service Mission Network',title:'Déploiement, expérience client et service command',subtitle:'Conduire activation, implémentation, adoption, support, SLA, incidents, communication et qualité comme des missions opérationnelles complètes.',lenses:['Activation','Implémentation','Adoption','Support','Incidents','Qualité']},
  platform:{eyebrow:'Sovereign Universe 06 · Control Lattice',title:'Plateforme, confiance et gouvernance',subtitle:'Protéger identités, autorités, politiques, capacités produit, audit, intégrations, automatisations et santé de la plateforme.',lenses:['Identités','Autorités','Sécurité','Politiques','Audit','Santé plateforme']},
} as const

export default function SovereignWorkspaceClient({ snapshot }: { snapshot:SovereignWorkspaceSnapshot }) {
  const [selected,setSelected]=useState<SovereignEntity|null>(null)
  const [lens,setLens]=useState<string>(copy[snapshot.tower].lenses[0])
  const tower=resolveSovereignTower(`/angelcare-360-operator/${snapshot.tower==='tenants'?'tenants-product':snapshot.tower}`)
  const relationshipCount=useMemo(()=>Object.values(snapshot.relationships).reduce((sum,ids)=>sum+ids.length,0),[snapshot.relationships])
  const sceneProps={snapshot,onOpen:setSelected}

  if (snapshot.tower === 'revenue') {
    return (
      <section className={styles.workspace} style={{'--tower':tower.accent,'--tower-deep':tower.accentDeep} as CSSProperties}>
        <RevenueAuthorityCommandDeck snapshot={snapshot} onOpen={setSelected}/>
        <SovereignEntityPortal entity={selected} snapshot={snapshot} onClose={()=>setSelected(null)}/>
      </section>
    )
  }

  if (snapshot.tower === 'service') {
    return (
      <section className={styles.workspace} style={{'--tower':tower.accent,'--tower-deep':tower.accentDeep} as CSSProperties}>
        <ServiceIndustrialMissionNetwork snapshot={snapshot} onOpen={setSelected}/>
        <SovereignEntityPortal entity={selected} snapshot={snapshot} onClose={()=>setSelected(null)}/>
      </section>
    )
  }

  const Scene=snapshot.tower==='direction'?DirectionSovereignScene:snapshot.tower==='growth'?GrowthSovereignScene:snapshot.tower==='tenants'?TenantSovereignScene:PlatformSovereignScene

  return (
    <section className={styles.workspace} style={{'--tower':tower.accent,'--tower-deep':tower.accentDeep} as CSSProperties}>
      <WorkspaceCrown eyebrow={copy[snapshot.tower].eyebrow} title={copy[snapshot.tower].title} subtitle={copy[snapshot.tower].subtitle} metrics={snapshot.metrics}>
        <a href="#operations" className={styles.workspaceActionPrimary}><Plus size={15}/>Ouvrir les commandes</a>
        <a href="#scene" className={styles.workspaceActionSecondary}><ScanSearch size={15}/>Explorer la scène</a>
        <Link href="/angelcare-360-operator" className={styles.workspaceActionSecondary}><Globe2 size={15}/>Retour aux six univers</Link>
      </WorkspaceCrown>
      <IntelligenceRibbon metrics={snapshot.metrics}/>
      <LensBar lenses={[...copy[snapshot.tower].lenses]} active={lens} onChange={setLens}/>
      <div id="scene"><Scene {...sceneProps}/></div>
      <div id="operations"><SovereignActionDeck snapshot={snapshot}/></div>
      <div className={styles.intelligenceRibbon}>
        <div className={styles.ribbonSignal}><span>Lens actif</span><strong>{lens}</strong><small>La scène conserve le même graphe opérationnel.</small></div>
        <div className={styles.ribbonSignal}><span>Relations</span><strong>{relationshipCount}</strong><small>Liens entre objets dans le périmètre chargé.</small></div>
        <div className={styles.ribbonSignal}><span>Fraîcheur</span><strong>{new Date(snapshot.generatedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</strong><small>Génération serveur de la situation.</small></div>
        <div className={styles.ribbonSignal}><span>Command Palette</span><strong><Command size={15}/> ⌘K</strong><small>Navigation globale sans surcharge du menu.</small></div>
      </div>
      <SovereignEntityPortal entity={selected} snapshot={snapshot} onClose={()=>setSelected(null)}/>
    </section>
  )
}
