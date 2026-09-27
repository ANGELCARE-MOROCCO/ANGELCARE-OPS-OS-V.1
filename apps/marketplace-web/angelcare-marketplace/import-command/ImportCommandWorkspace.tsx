import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  DatabaseZap,
  FileSpreadsheet,
  FolderInput,
  Languages,
  PackageCheck,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import styles from './import-command.module.css'

export type ImportCommandSection = 'overview'|'product'|'category-native'|'media'|'localization'|'wallet'|'expert-commerce'

const NAV: Array<{key:ImportCommandSection;label:string;short:string;icon:typeof UploadCloud}> = [
  {key:'overview',label:'Commandement',short:'Overview',icon:ShieldCheck},
  {key:'product',label:'Product 360',short:'Industrial',icon:PackageCheck},
  {key:'category-native',label:'Category-Native',short:'Archetypes',icon:Boxes},
  {key:'media',label:'Media Vault',short:'Assets',icon:FolderInput},
  {key:'localization',label:'Localisation',short:'Translations',icon:Languages},
  {key:'wallet',label:'Wallet',short:'Finance',icon:CircleDollarSign},
  {key:'expert-commerce',label:'Commerce expert',short:'Registry',icon:DatabaseZap},
]

const META: Record<ImportCommandSection,{eyebrow:string;title:string;description:string;authority:string;risk:string;accent:string;features:string[]}> = {
  overview:{eyebrow:'BUSINESS INGESTION COMMAND',title:'Une seule salle de contrôle. Six autorités d’import distinctes.',description:'Chaque passerelle conserve son moteur canonique, son niveau de risque et son modèle de validation. Aucun builder, World Factory ou Public Experience n’est exposé ici.',authority:'Control plane',risk:'Gouverné',accent:'overview',features:['Autorités séparées','Préflight avant mutation','Traçabilité par domaine']},
  product:{eyebrow:'CATALOG · PRODUCT 360',title:'Industrial Product 360 Ingestion',description:'Import massif complet pour produits, services, cours et offres structurées : doctrine, mapping déterministe, dry-run réel, job persistant, retry et rollback audité.',authority:'Product 360',risk:'Primaire',accent:'product',features:['CSV + XLSX','Mapping explicite','Persistent jobs']},
  'category-native':{eyebrow:'CATALOG · ARCHETYPE CONTRACTS',title:'Category-Native Import Command',description:'Le CSV suit un schéma métier versionné avant d’être adapté au catalogue canonique. La structure native de chaque offre reste visible et vérifiable.',authority:'Category-Native',risk:'Primaire',accent:'category',features:['Schéma versionné','Dry-run obligatoire','Rollback traçable']},
  media:{eyebrow:'DAM · MEDIA INGESTION',title:'Media Vault Ingestion Station',description:'Fichiers, dossiers complets, arborescence locale, préflight SHA-256, doublons, affectations catalogue et métadonnées sans publication automatique.',authority:'Media Vault',risk:'Primaire',accent:'media',features:['Fichiers + dossier','SHA-256','Duplicate policy']},
  localization:{eyebrow:'LOCALIZATION OS',title:'Translation Import Command',description:'Import de traductions gouverné avec comparaison avant/après, placeholders, conflits, application en brouillon et restauration contrôlée.',authority:'Localization',risk:'Primaire',accent:'localization',features:['Diff avant/après','Conflits','Draft only']},
  wallet:{eyebrow:'FINANCE · WALLET POLICIES',title:'Wallet Assignment Import',description:'Affectations financières validées contre clients et politiques existants, avec impact create/update/unchanged et confirmation gouvernée.',authority:'Wallet',risk:'Financier',accent:'wallet',features:['Validation client','Impact financier','Confirmation motivée']},
  'expert-commerce':{eyebrow:'ADVANCED · DIRECT REGISTRY',title:'Expert Commerce Data Operations',description:'Accès de bas niveau aux registres Commerce. Cette surface est volontairement plus stricte : dry-run verrouillé, diff, blast radius et jeton de préflight avant toute écriture.',authority:'Commerce Registry',risk:'Expert / élevé',accent:'expert',features:['Diff obligatoire','Preflight token','Blast radius']},
}

export function ImportCommandWorkspace({section,children}:{section:ImportCommandSection;children:ReactNode}){
  const meta=META[section]
  return <main className={styles.page} data-accent={meta.accent}>
    <section className={styles.commandHero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{meta.eyebrow}</span>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
        <div className={styles.heroBadges}><span><ShieldCheck size={14}/> {meta.authority}</span><span data-risk={meta.risk.includes('élevé')?'high':'normal'}>{meta.risk}</span><span>marketplace-web only</span></div>
      </div>
      <div className={styles.heroSignal}>
        <UploadCloud size={26}/><strong>IMPORT COMMAND</strong><small>Source → Preflight → Review → Execute → Evidence</small>
        <div>{meta.features.map(feature=><span key={feature}>{feature}</span>)}</div>
      </div>
    </section>

    <nav className={styles.horizontalNav} aria-label="Import Command">
      {NAV.map(({key,label,short,icon:Icon})=><Link key={key} href={`/angelcare-marketplace/admin/imports/${key}`} data-active={section===key}>
        <Icon size={16}/><span><strong>{label}</strong><small>{short}</small></span>
      </Link>)}
    </nav>

    <section className={styles.engineMount} data-engine={section}>{children}</section>
  </main>
}

const GATEWAYS = [
  {key:'product' as const,icon:PackageCheck,title:'Product 360',scope:'Produits · services · cours · offres',input:'CSV / XLSX',safety:'Dry-run · job persistant · retry · rollback',tone:'primary'},
  {key:'category-native' as const,icon:Boxes,title:'Category-Native',scope:'Archétypes et schémas métier',input:'CSV contractuel',safety:'Schema lock · lignes validées · rollback',tone:'primary'},
  {key:'media' as const,icon:FolderInput,title:'Media Vault',scope:'Assets · folders · catalog mapping',input:'Fichiers / dossier / manifest',safety:'SHA-256 · doublons · upload borné',tone:'primary'},
  {key:'localization' as const,icon:Languages,title:'Localisation',scope:'Traductions EN / AR',input:'CSV gouverné',safety:'Hash source · conflits · draft · rollback',tone:'primary'},
  {key:'wallet' as const,icon:CircleDollarSign,title:'Wallet',scope:'Affectations politiques clients',input:'CSV',safety:'Validation · impact · confirmation',tone:'finance'},
  {key:'expert-commerce' as const,icon:DatabaseZap,title:'Commerce expert',scope:'Registres structurés bas niveau',input:'CSV / JSON',safety:'Dry-run obligatoire · diff · token · audit',tone:'expert'},
]

export function ImportCommandOverview(){
  return <div className={styles.overview}>
    <section className={styles.doctrineBand}><div><span>DOCTRINE D’INGESTION</span><h2>Le bon moteur pour le bon objet.</h2></div><p>Les importeurs ne sont pas fusionnés. Le workspace unifie l’expérience opérateur tout en conservant les autorités et garanties de chaque domaine.</p></section>
    <section className={styles.gatewayGrid}>{GATEWAYS.map(({key,icon:Icon,title,scope,input,safety,tone})=><Link key={key} className={styles.gatewayCard} data-tone={tone} href={`/angelcare-marketplace/admin/imports/${key}`}>
      <header><span><Icon size={19}/></span><em>{tone==='expert'?'EXPERT':tone==='finance'?'FINANCE':'PRIMARY'}</em></header>
      <h3>{title}</h3><p>{scope}</p>
      <dl><div><dt>Entrée</dt><dd>{input}</dd></div><div><dt>Contrôle</dt><dd>{safety}</dd></div></dl>
      <footer>Ouvrir l’autorité <ArrowRight size={15}/></footer>
    </Link>)}</section>
    <section className={styles.boundaryGrid}>
      <article><FileSpreadsheet size={19}/><div><strong>Frontline commerce</strong><p>Product 360 et Category-Native sont les voies normales de création massive du catalogue.</p></div></article>
      <article><DatabaseZap size={19}/><div><strong>Expert registry only</strong><p>Commerce Expert reste une échappatoire de registre. Il ne remplace jamais la readiness Product 360.</p></div></article>
      <article><ShieldCheck size={19}/><div><strong>Public Experience exclu</strong><p>World Factory, Universal Studio, Puck et Public Experience Authority sont hors périmètre et non importés par ce workspace.</p></div></article>
    </section>
  </div>
}
