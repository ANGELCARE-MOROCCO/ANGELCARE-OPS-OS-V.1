import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'

import { SanilaIcon } from '../SanilaIcon'
import styles from '../SanilaPublic.module.css'

type IconName = Parameters<typeof SanilaIcon>[0]['name']

type Signal = {
  icon: IconName
  label: string
  detail: string
}

const roleImages = [
  ['/sanila/gateway/sanila-gateway-admin.webp', 'Établissement'],
  ['/sanila/teacher-login/sanila-teacher-morocco-approved.webp', 'Enseignant'],
  ['/sanila/parent-login/sanila-parent-morocco-approved.webp', 'Parent'],
] as const

export function VisualSignalRail({ items }: { items: Signal[] }) {
  return (
    <div className={styles.visualSignalRail}>
      {items.map((item, index) => (
        <div key={item.label} className={styles.visualSignalItem}>
          <div className={styles.visualSignalIcon}><SanilaIcon name={item.icon} size={20} /></div>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{item.label}</strong>
          <p>{item.detail}</p>
        </div>
      ))}
    </div>
  )
}

export function ProductEvidenceMosaic() {
  return (
    <div className={styles.productEvidenceMosaic}>
      <div className={styles.productEvidenceLead}>
        <span>EXPÉRIENCES RÉELLES</span>
        <strong>Un produit commun, plusieurs contextes d’usage.</strong>
        <p>Les visuels ci-contre utilisent uniquement les actifs SANILA réellement présents dans la source.</p>
        <div className={styles.productEvidenceLegend}>
          <span><i /> Établissement</span><span><i /> Enseignant</span><span><i /> Famille</span>
        </div>
      </div>
      {roleImages.map(([src, label], index) => (
        <figure className={styles.productEvidenceTile} key={src} data-tile={index + 1}>
          <Image src={src} alt={`Expérience SANILA — ${label}`} fill sizes="(max-width: 820px) 100vw, 26vw" />
          <figcaption><span>0{index + 1}</span><strong>{label}</strong></figcaption>
        </figure>
      ))}
    </div>
  )
}

export function DemoQualificationBoard() {
  const axes: Signal[] = [
    { icon: 'building', label: 'Structure', detail: 'Type d’établissement, sites, organisation.' },
    { icon: 'layers', label: 'Système actuel', detail: 'Papier, Excel, logiciels et ruptures.' },
    { icon: 'spark', label: 'Priorités', detail: 'Ce qui mérite d’être montré en premier.' },
    { icon: 'users', label: 'Échelle', detail: 'Effectif, équipes et complexité opérationnelle.' },
    { icon: 'calendar', label: 'Calendrier', detail: 'Rentrée, bascule ou fenêtre de décision.' },
    { icon: 'check', label: 'Décideur', detail: 'Rôle, attentes et niveau de validation.' },
  ]
  return (
    <div className={styles.demoQualificationBoard}>
      <div className={styles.demoRadar} aria-label="Carte éditoriale de qualification de démonstration">
        <svg viewBox="0 0 500 500" aria-hidden="true">
          <polygon points="250,74 404,162 404,338 250,426 96,338 96,162" />
          <polygon points="250,125 360,188 360,312 250,375 140,312 140,188" />
          <polyline points="250,112 350,198 330,310 250,348 160,300 174,192 250,112" />
          <line x1="250" y1="60" x2="250" y2="440" />
          <line x1="85" y1="155" x2="415" y2="345" />
          <line x1="85" y1="345" x2="415" y2="155" />
        </svg>
        <div className={styles.demoRadarCore}><span>SANILA</span><strong>DÉMO</strong><small>ciblée</small></div>
        {axes.map((axis, index) => <span className={styles.demoRadarLabel} data-axis={index + 1} key={axis.label}>{axis.label}</span>)}
      </div>
      <VisualSignalRail items={axes} />
    </div>
  )
}

export function DemoAgendaVisual() {
  const steps = [
    ['01', 'Comprendre', 'Votre fonctionnement actuel'],
    ['02', 'Prioriser', 'Les domaines critiques'],
    ['03', 'Montrer', 'Les parcours utiles'],
    ['04', 'Relier', 'Rôles, dossiers et opérations'],
    ['05', 'Décider', 'La suite et la mise en service'],
  ]
  return <div className={styles.demoAgendaVisual}>{steps.map(([n, title, detail]) => <div key={n}><span>{n}</span><i /><strong>{title}</strong><p>{detail}</p></div>)}</div>
}

export function ProductOperatingConstellation() {
  const nodes = [
    ['Direction', 'chart'], ['Administration', 'building'], ['Admissions', 'users'], ['Présences', 'clock'], ['Pédagogie', 'book'], ['Finance', 'wallet'], ['Transport', 'bus'], ['Familles', 'heart'],
  ] as const
  return (
    <div className={styles.operatingConstellation}>
      <div className={styles.operatingConstellationCore}><span>SANILA</span><strong>Operating System</strong><small>une continuité institutionnelle</small></div>
      <svg viewBox="0 0 1000 620" aria-hidden="true">
        {[[160,120],[390,70],[650,80],[850,180],[850,430],[650,540],[365,535],[145,405]].map(([x,y],i)=><line key={i} x1="500" y1="310" x2={x} y2={y}/>) }
        <circle cx="500" cy="310" r="122" />
        <circle cx="500" cy="310" r="205" />
      </svg>
      {nodes.map(([label, icon], index)=><div className={styles.operatingConstellationNode} data-node={index+1} key={label}><SanilaIcon name={icon} size={19}/><strong>{label}</strong><span>0{index+1}</span></div>)}
    </div>
  )
}

export function AttendancePulseVisual() {
  const states = [
    ['Présent','Arrivée confirmée','72%'], ['Retard','Contexte distinct','38%'], ['Absent','Suivi nécessaire','54%'], ['Justifié','Trace conservée','63%'],
  ]
  return <div className={styles.attendancePulseVisual}><header><span>PRÉSENCES / AUJOURD’HUI</span><strong>Lire les états sans perdre leur contexte.</strong><small>schéma qualitatif</small></header><div>{states.map(([a,b,w],i)=><section key={a}><span>0{i+1}</span><div><strong>{a}</strong><small>{b}</small><i><b style={{'--meter-w':w} as CSSProperties}/></i></div></section>)}</div></div>
}

export function PayrollControlVisual() {
  const lanes=[['Période','Ouvrir'],['Éléments','Consolider'],['Validation','Contrôler'],['Paiement','Exécuter'],['Historique','Relire']]
  return <div className={styles.payrollControlVisual}><div className={styles.payrollControlHeader}><span>PAIE / PÉRIODE</span><strong>Une séquence gouvernée, pas un calcul isolé.</strong></div><div className={styles.payrollControlLanes}>{lanes.map(([a,b],i)=><div key={a}><span>0{i+1}</span><SanilaIcon name={i<2?'file':i===2?'check':i===3?'wallet':'clock'} size={19}/><strong>{a}</strong><small>{b}</small></div>)}</div></div>
}

export function CommunicationNetworkVisual() {
  const nodes=[['Établissement','building'],['Direction','chart'],['Équipe','users'],['Enseignant','book'],['Famille','heart']]
  return <div className={styles.communicationNetworkVisual}><div className={styles.communicationNetworkCore}><SanilaIcon name="message" size={28}/><strong>Message contextualisé</strong><small>canal selon configuration</small></div><svg viewBox="0 0 800 430" aria-hidden="true">{[[150,92],[650,92],[680,342],[120,342],[400,390]].map(([x,y],i)=><line key={i} x1="400" y1="215" x2={x} y2={y}/>)}</svg>{nodes.map(([label,icon],i)=><div data-node={i+1} className={styles.communicationNetworkNode} key={label}><SanilaIcon name={icon as IconName} size={18}/><strong>{label}</strong></div>)}</div>
}

export function LibraryCirculationVisual() {
  const stages=[['Catalogue','book'],['Disponible','search'],['Prêt','arrow'],['Détenteur','users'],['Retour','check'],['Historique','clock']]
  return <div className={styles.libraryCirculationVisual}>{stages.map(([label,icon],i)=><div key={label}><span>0{i+1}</span><SanilaIcon name={icon as IconName} size={20}/><strong>{label}</strong>{i<stages.length-1?<i/>:null}</div>)}</div>
}

export function InventoryMatrixVisual() {
  const rows=[['Matériel pédagogique','Classe A','Affecté'],['Équipement IT','Administration','En service'],['Mobilier','Site 02','Inventorié'],['Fournitures','Stock central','À suivre']]
  return <div className={styles.inventoryMatrixVisual}><header><span>INVENTAIRE / CONTRÔLE PHYSIQUE</span><strong>Objet → lieu → responsabilité → état</strong></header><div className={styles.inventoryMatrixHead}><span>Objet</span><span>Localisation</span><span>État</span></div>{rows.map((r,i)=><div className={styles.inventoryMatrixRow} key={r[0]}><b>0{i+1}</b><strong>{r[0]}</strong><span>{r[1]}</span><em>{r[2]}</em></div>)}</div>
}

export function ClaimsResolutionLoop() {
  const items=[['Signalement','message'],['Qualification','search'],['Responsable','users'],['Action','spark'],['Résolution','check'],['Trace','file']]
  return <div className={styles.claimsResolutionLoop}><svg viewBox="0 0 620 620" aria-hidden="true"><circle cx="310" cy="310" r="220"/><circle cx="310" cy="310" r="140"/><path d="M310 90a220 220 0 0 1 190 110"/></svg><div className={styles.claimsResolutionCore}><SanilaIcon name="heart" size={30}/><strong>Confiance</strong><small>récupérée par la trace</small></div>{items.map(([label,icon],i)=><div className={styles.claimsResolutionNode} data-node={i+1} key={label}><SanilaIcon name={icon as IconName} size={18}/><strong>{label}</strong></div>)}</div>
}

export function CapabilityAtlasVisual() {
  const groups=[
    ['Piloter',['Direction','Rapports'],'chart'],['Structurer',['Administration','Admissions'],'building'],['Enseigner',['Présences','Pédagogie'],'book'],['Administrer',['Finance','Paie'],'wallet'],['Opérer',['Transport','Inventaire'],'bus'],['Relier',['Communication','Réclamations'],'message'],
  ]
  return <div className={styles.capabilityAtlasVisual}>{groups.map(([title,items,icon],i)=><section key={title as string}><span>0{i+1}</span><SanilaIcon name={icon as IconName} size={22}/><strong>{title as string}</strong><div>{(items as string[]).map(x=><em key={x}>{x}</em>)}</div></section>)}</div>
}

export function PricingArchitectureVisual() {
  const factors=[['Établissements','building'],['Effectif','users'],['Domaines','layers'],['Mise en service','spark'],['Complexité','chart']]
  return <div className={styles.pricingArchitectureVisual}><div className={styles.pricingArchitectureCore}><span>TARIFICATION</span><strong>Un périmètre réel</strong><small>→ une proposition structurée</small></div>{factors.map(([label,icon],i)=><div className={styles.pricingArchitectureFactor} data-factor={i+1} key={label}><SanilaIcon name={icon as IconName} size={18}/><strong>{label}</strong></div>)}</div>
}

export function OnboardingLaunchMap() {
  const stages=[['Diagnostic','search'],['Architecture','layers'],['Configuration','building'],['Données','file'],['Accès','shield'],['Formation','users'],['Validation','check'],['Mise en service','spark'],['Accompagnement','heart']]
  return <div className={styles.onboardingLaunchMap}>{stages.map(([label,icon],i)=><div key={label}><span>{String(i+1).padStart(2,'0')}</span><SanilaIcon name={icon as IconName} size={18}/><strong>{label}</strong></div>)}</div>
}

export function SolutionOperatingProfile({ title, icon, items }: { title: string; icon: IconName; items: string[] }) {
  return <div className={styles.solutionOperatingProfile}><div className={styles.solutionOperatingProfileCore}><SanilaIcon name={icon} size={28}/><strong>{title}</strong><small>profil d’exploitation</small></div><div>{items.map((item,i)=><span key={item}><b>0{i+1}</b>{item}</span>)}</div></div>
}

export function VisualPanel({ children, label, title }: { children: ReactNode; label: string; title: string }) {
  return <section className={styles.visualPanel}><header><span>{label}</span><strong>{title}</strong><small>Schéma éditorial — aucune capacité inventée</small></header><div>{children}</div></section>
}
