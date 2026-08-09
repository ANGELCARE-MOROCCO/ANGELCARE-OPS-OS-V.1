import Link from 'next/link'
import {
  ArrowRight, BookOpenCheck, Boxes, BrainCircuit, Building2, FileText, FolderOpen,
  GraduationCap, HeartHandshake, LibraryBig, PackagePlus, ReceiptText, Sparkles, Truck,
} from 'lucide-react'
import type { FlashcardsDashboardData } from '@/lib/flashcards-os/types'
import type { ExperienceOverview } from '@/lib/flashcards-os/experience/types'
import styles from './flashcards-command-hall.module.css'

function money(value:number){return `${new Intl.NumberFormat('fr-FR').format(value)} Dh`}
export default function FlashcardsCommandHall2030({dashboard,experience}:{dashboard:FlashcardsDashboardData;experience:ExperienceOverview}){
 const actions=[
  {href:'/flashcards-os/product/collections?create=1',icon:PackagePlus,step:'01',title:'Créer une collection',copy:'Structurer un nouveau produit, ses cartes, objectifs, commandes et livrables.',accent:'blue'},
  {href:'/flashcards-os/solutions/composer',icon:Boxes,step:'02',title:'Composer un package',copy:'Assembler les collections locales dans une solution B2C ou B2B vendable.',accent:'indigo'},
  {href:'/flashcards-os/solutions/learning-journeys/new',icon:GraduationCap,step:'03',title:'Construire un programme',copy:'Concevoir jours, sessions, collections et progression pédagogique.',accent:'violet'},
 ]
 return <div className={styles.hall}>
  <section className={styles.hero}><div><span><Sparkles size={15}/> ANGELCARE FLASHCARDS PRODUCT & LEARNING STUDIO 2030</span><h1>Concevoir le produit. Orchestrer l’apprentissage. Commercialiser avec précision.</h1><p>Un seul environnement pour transformer le catalogue local en collections, packages, programmes, commandes de production, livrables, sellables et revenus.</p><div className={styles.heroActions}><Link href="/flashcards-os/my-work">Continuer mon travail <ArrowRight size={16}/></Link><Link href="/flashcards-os/product/collections">Explorer le catalogue</Link></div></div><aside><span>CATALOGUE SOURCE OF TRUTH</span><strong>{dashboard.collections}</strong><small>collections locales · {dashboard.expectedCards} cartes attendues</small><div><b>{dashboard.averageReadiness}%</b><i><span style={{width:`${dashboard.averageReadiness}%`}}/></i></div></aside></section>
  <section className={styles.actionStage}>{actions.map((action)=>{const Icon=action.icon;return <Link key={action.href} href={action.href} data-accent={action.accent}><span className={styles.actionStep}>{action.step}</span><span className={styles.actionIcon}><Icon size={28}/></span><div><h2>{action.title}</h2><p>{action.copy}</p><b>Ouvrir l’atelier <ArrowRight size={15}/></b></div></Link>})}</section>
  <section className={styles.signalBand}><article><LibraryBig/><div><span>Collections</span><strong>{dashboard.collections}</strong><small>{dashboard.structuredCards}/{dashboard.expectedCards} cartes structurées</small></div></article><article><BrainCircuit/><div><span>Readiness produit</span><strong>{dashboard.averageReadiness}%</strong><small>{dashboard.openIssues} points hérités ouverts</small></div></article><article><Truck/><div><span>Fulfilment</span><strong>{experience.metrics.ordersReady}</strong><small>{experience.metrics.physicalInProgress} opérations physiques</small></div></article><article><HeartHandshake/><div><span>Expérience client</span><strong>{experience.metrics.openCases}</strong><small>{experience.metrics.deliveryExceptions} exception(s) livraison</small></div></article><article><ReceiptText/><div><span>Exposition remboursement</span><strong>{money(experience.metrics.refundExposureDh)}</strong><small>Données réelles du moteur CX</small></div></article></section>
  <div className={styles.lowerGrid}>
   <section className={styles.portfolioMap}><header><div><span>COLLECTION CONSTELLATION</span><h2>Portefeuille par univers d’apprentissage</h2></div><Link href="/flashcards-os/product">Voir le portfolio <ArrowRight size={14}/></Link></header><div>{dashboard.topDomains.slice(0,8).map((domain,index)=><Link key={domain.id} href={`/flashcards-os/product/collections?q=${encodeURIComponent(domain.name)}`}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{domain.name}</strong><small>{domain.collections} collections · {domain.expectedCards} cartes</small></div><i><b style={{width:`${domain.readiness}%`}}/></i><em>{domain.readiness}%</em></Link>)}</div>
   </section>
   <aside className={styles.launchRail}><header><span>PRODUCT RUNWAY</span><h2>Du catalogue au revenu</h2></header>{[
    ['/flashcards-os/product/collections','Collection Product Atelier','Produit, cartes, versions et assets',LibraryBig],
    ['/flashcards-os/intelligence/production-commands','Production Command Lab','Commandes externes PDF, MP4 et classe',BookOpenCheck],
    ['/flashcards-os/delivery/vault','Deliverable Vault Gallery','Livrables et versions Windows',FolderOpen],
    ['/flashcards-os/solutions/b2c','B2C Family Vitrine','Produits familiaux prêts à vendre',HeartHandshake],
    ['/flashcards-os/solutions/b2b','B2B Deployment Portfolio','Solutions écoles et institutions',Building2],
    ['/flashcards-os/documents','A4/PDF Publishing House','Seize documents professionnels',FileText],
   ].map(([href,title,copy,Icon]:any)=><Link key={href} href={href}><span><Icon size={16}/></span><div><strong>{title}</strong><small>{copy}</small></div><ArrowRight size={14}/></Link>)}</aside>
  </div>
 </div>
}
