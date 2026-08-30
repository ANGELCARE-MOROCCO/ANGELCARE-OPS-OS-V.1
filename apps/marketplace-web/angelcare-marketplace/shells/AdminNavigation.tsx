'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {BadgeDollarSign,Boxes,CalendarDays,ChartNoAxesCombined,FolderTree,Gauge,HeartHandshake,LayoutTemplate,Megaphone,Network,PackageSearch,ShieldCheck,UsersRound} from 'lucide-react'
import styles from '../design-system/marketplace.module.css'
import {cx} from '../design-system/ui'

const masters=[
 {id:'01',href:'/angelcare-marketplace/admin',label:'Accueil',icon:Gauge},
 {id:'02',href:'/angelcare-marketplace/admin/orders',label:'Commandes & réservations',icon:CalendarDays},
 {id:'03',href:'/angelcare-marketplace/admin/catalog/items',label:'Produits & services',icon:PackageSearch},
 {id:'04',href:'/angelcare-marketplace/admin/catalog/categories',label:'Catégories & collections',icon:FolderTree},
 {id:'05',href:'/angelcare-marketplace/admin/customers',label:'Clients',icon:UsersRound},
 {id:'06',href:'/angelcare-marketplace/admin/boutique',label:'Boutique',icon:LayoutTemplate},
 {id:'07',href:'/angelcare-marketplace/admin/promotions',label:'Marketing & promotions',icon:Megaphone},
 {id:'08',href:'/angelcare-marketplace/admin/operations',label:'Opérations',icon:Network},
 {id:'09',href:'/angelcare-marketplace/admin/supply-network',label:'Prestataires & fournisseurs',icon:HeartHandshake},
 {id:'10',href:'/angelcare-marketplace/admin/academy',label:'Academy',icon:ShieldCheck},
 {id:'11',href:'/angelcare-marketplace/admin/verticals',label:'B2B & partenaires',icon:Boxes},
 {id:'12',href:'/angelcare-marketplace/admin/finance',label:'Finance',icon:BadgeDollarSign},
 {id:'13',href:'/angelcare-marketplace/admin/trust',label:'Trust & qualité',icon:ShieldCheck},
 {id:'14',href:'/angelcare-marketplace/admin/analytics',label:'Analytics & intelligence',icon:ChartNoAxesCombined},
 {id:'15',href:'/angelcare-marketplace/admin/configuration',label:'Paramètres & gouvernance',icon:Boxes},
] as const

export function AdminNavigation(){
 const pathname=usePathname()
 return <nav className={styles.sidebarNav} aria-label="Marketplace Admin">
  <div className={styles.navGroup}><div className={styles.navGroupLabel}>ANGELCARE MARKETPLACE</div></div>
  <div className={styles.navGroup}><div className={styles.navGroupLabel}>15 WORKSPACES</div>{masters.map(({id,href,label,icon:Icon})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={`${id}-${href}`} href={href} className={cx(styles.sideNavLink,active&&styles.sideNavLinkActive)}><span className={styles.sideNavIcon}><Icon size={15}/></span><span>{id} · {label}</span></Link>})}</div>
 </nav>
}
