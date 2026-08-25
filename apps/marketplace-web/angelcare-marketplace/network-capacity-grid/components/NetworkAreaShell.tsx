'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Activity,Boxes,Building2,ClipboardCheck,Globe2,Network,ShieldCheck,UsersRound,Waypoints} from 'lucide-react'
import styles from '../network-capacity-grid.module.css'
const tabs=[
 {href:'/angelcare-marketplace/admin/supply-network',label:'Overview',icon:Network},
 {href:'/angelcare-marketplace/admin/supply-network/providers',label:'Providers',icon:UsersRound},
 {href:'/angelcare-marketplace/admin/supply-network/availability',label:'Availability',icon:Activity},
 {href:'/angelcare-marketplace/admin/supply-network/capacity',label:'Capacity',icon:Waypoints},
 {href:'/angelcare-marketplace/admin/supply-network/assignments',label:'Assignments',icon:ClipboardCheck},
 {href:'/angelcare-marketplace/admin/supply-network/suppliers',label:'Suppliers',icon:Boxes},
 {href:'/angelcare-marketplace/admin/supply-network/vendors',label:'Vendors',icon:Building2},
 {href:'/angelcare-marketplace/admin/supply-network/partners',label:'Partners',icon:Globe2},
 {href:'/angelcare-marketplace/admin/supply-network/quality',label:'Quality',icon:ShieldCheck},
]
export function NetworkAreaShell({children}:{children:React.ReactNode}){const pathname=usePathname();return <div className={styles.area}><header className={styles.areaHeader}><div><div className={styles.eyebrow}>06 · SUPPLY & PARTNER NETWORK</div><h1>Network Capacity Grid</h1><p>Providers, capability, availability, capacity, assignments, partners and quality — one supply-side operating authority.</p></div><div className={styles.areaStatus}><span>NETWORK CONTROL</span><strong>Morocco Marketplace</strong><small>Canonical provider & operations data</small></div></header><nav className={styles.horizontalNav}>{tabs.map(({href,label,icon:Icon})=>{const active=pathname===href||(href!=='/angelcare-marketplace/admin/supply-network'&&pathname.startsWith(`${href}/`));return <Link href={href} key={href} className={active?styles.tabActive:styles.tab}><Icon size={14}/>{label}</Link>})}<span className={styles.navSpacer}/><Link href="/angelcare-marketplace/admin/providers" className={styles.specialistLink}>Provider Specialist ↗</Link></nav>{children}</div>}
