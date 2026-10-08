'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BriefcaseBusiness, HeartHandshake, LayoutDashboard, Search, ShieldAlert, UsersRound } from 'lucide-react'
import styles from '../customer-relationship.module.css'

const items=[
 {href:'/angelcare-marketplace/admin/customers-revenue',label:'Overview',icon:LayoutDashboard},
 {href:'/angelcare-marketplace/admin/customers-revenue/customers',label:'Customers',icon:UsersRound},
 {href:'/angelcare-marketplace/admin/customers-revenue/families',label:'Families',icon:HeartHandshake},
 {href:'/angelcare-marketplace/admin/customers-revenue/crm',label:'CRM',icon:BriefcaseBusiness},
 {href:'/angelcare-marketplace/admin/customers-revenue/segments',label:'Segments',icon:Search},
 {href:'/angelcare-marketplace/admin/customers-revenue/cases',label:'Cases',icon:ShieldAlert},
 {href:'/angelcare-marketplace/admin/customers-revenue/activity',label:'Activity',icon:Activity},
]

export function CustomerRelationshipShell({children}:{children:React.ReactNode}){
 const pathname=usePathname()
 return <div className={styles.areaShell}>
  <header className={styles.areaHeader}>
   <div><span>02 · CUSTOMERS & REVENUE</span><h1>Relationship Intelligence House</h1><p>Understand, operate, grow and recover every Marketplace relationship without losing context.</p></div>
   <div className={styles.areaSignal}><i/><div><strong>RELATIONSHIP COMMAND</strong><small>Canonical customer estate · live operational context</small></div></div>
  </header>
  <nav className={styles.horizontalNav} aria-label="Customers & Revenue">
   <div>{items.map(({href,label,icon:Icon})=>{const active=pathname===href||(href!=='/angelcare-marketplace/admin/customers-revenue'&&pathname.startsWith(`${href}/`));return <Link key={href} href={href} data-active={active}><Icon size={14}/><span>{label}</span></Link>})}</div>
   <div className={styles.navUtilities}><Link href="/angelcare-marketplace/admin/search"><Search size={14}/>Global search</Link><Link href="/angelcare-marketplace/admin/my-workspace">War Room</Link></div>
  </nav>
  {children}
 </div>
}
