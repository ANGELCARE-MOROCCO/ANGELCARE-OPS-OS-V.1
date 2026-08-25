'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {BadgeDollarSign,Boxes,Gauge,Network,Rocket,Search,ShoppingBag,Sparkles,UsersRound,Waypoints} from 'lucide-react'
import styles from '../design-system/marketplace.module.css'
import {cx} from '../design-system/ui'

const masters=[
 {id:'01',href:'/angelcare-marketplace/admin/enterprise-command',label:'Command & Live Operations',icon:Gauge},
 {id:'02',href:'/angelcare-marketplace/admin/customers-revenue',label:'Customers & Revenue',icon:UsersRound},
 {id:'03',href:'/angelcare-marketplace/admin/commerce-factory',label:'Commerce & Offer Factory',icon:Boxes},
 {id:'04',href:'/angelcare-marketplace/admin/orders-fulfillment',label:'Orders & Fulfillment',icon:Waypoints},
 {id:'05',href:'/angelcare-marketplace/admin/finance-monetization',label:'Finance & Monetization',icon:BadgeDollarSign},
 {id:'06',href:'/angelcare-marketplace/admin/supply-network',label:'Supply & Partner Network',icon:Network},
 {id:'07',href:'/angelcare-marketplace/admin/growth-experience',label:'Growth & Marketplace Experience',icon:Rocket},
 {id:'08',href:'/angelcare-marketplace/admin/executive-control',label:'Intelligence & Executive Control',icon:Sparkles},
] as const

const tools=[
 {href:'/angelcare-marketplace/admin/workspaces',label:'Specialist Workspaces',icon:Boxes},
 {href:'/angelcare-marketplace/admin/search',label:'Global Search',icon:Search},
 {href:'/angelcare-marketplace/admin/orders/new',label:'Create Order',icon:ShoppingBag},
] as const

export function AdminNavigation(){
 const pathname=usePathname()
 return <nav className={styles.sidebarNav} aria-label="Marketplace Admin">
  <div className={styles.navGroup}><div className={styles.navGroupLabel}>ANGELCARE MARKETPLACE</div><Link href="/angelcare-marketplace/admin" className={styles.sideNavLink}><span className={styles.sideNavIcon}><Gauge size={15}/></span>Admin Command</Link></div>
  <div className={styles.navGroup}><div className={styles.navGroupLabel}>8 MASTER WORKSPACES</div>{masters.map(({id,href,label,icon:Icon})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} className={cx(styles.sideNavLink,active&&styles.sideNavLinkActive)}><span className={styles.sideNavIcon}><Icon size={15}/></span><span>{id} · {label}</span></Link>})}</div>
  <div className={styles.navGroup}><div className={styles.navGroupLabel}>SPECIALIST TOOLS</div>{tools.map(({href,label,icon:Icon})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} className={cx(styles.sideNavLink,active&&styles.sideNavLinkActive)}><span className={styles.sideNavIcon}><Icon size={15}/></span>{label}</Link>})}</div>
 </nav>
}
