'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { getAngelcare360NavigationSections } from '@/data/angelcare360/navigation'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'
import Angelcare360Header from './Angelcare360Header'
import Angelcare360Sidebar from './Angelcare360Sidebar'
import Angelcare360PaymentGateProvider from '@/components/angelcare360/payment/Angelcare360PaymentGateProvider'
import Angelcare360EntitlementGate from './Angelcare360EntitlementGate'
import CustomerExperienceProvider from '@/components/angelcare360/customer-experience/CustomerExperienceProvider'
import CustomerFooter from '@/components/angelcare360/customer-experience/CustomerFooter'
import styles from './Angelcare360CustomerShell.module.css'

type Props={children:ReactNode;user:Angelcare360SessionUser;access:Angelcare360AccessProfile;runtimeEntitlements:Angelcare360RuntimeEntitlements;schoolName?:string|null;academicYearLabel?:string|null}
const STORAGE_KEY='angelcare360.customer.sidebar'
export default function Angelcare360Shell({children,user,access,runtimeEntitlements,schoolName,academicYearLabel}:Props){
 const pathname=usePathname()||'/angelcare-360-command-center';const [mobileOpen,setMobileOpen]=useState(false);const [mobile,setMobile]=useState(false);const [collapsed,setCollapsed]=useState(false);const sections=getAngelcare360NavigationSections(runtimeEntitlements)
 useEffect(()=>{const saved=window.localStorage.getItem(STORAGE_KEY);setCollapsed(saved==='collapsed');const mq=window.matchMedia('(max-width:1100px)');const update=()=>{setMobile(mq.matches);if(!mq.matches)setMobileOpen(false)};update();mq.addEventListener('change',update);return()=>mq.removeEventListener('change',update)},[])
 function toggleCollapsed(){setCollapsed((current)=>{const next=!current;window.localStorage.setItem(STORAGE_KEY,next?'collapsed':'expanded');return next})}
 return <CustomerExperienceProvider><div className={styles.shell} data-angelcare360-customer-shell="true" style={{'--sidebar-width':collapsed?'88px':'310px'} as CSSProperties}><Angelcare360PaymentGateProvider pathname={pathname}><div className={styles.grid}>{!mobile?<Angelcare360Sidebar open onClose={()=>setMobileOpen(false)} sections={sections} pathname={pathname} showCloseButton={false} collapsed={collapsed} onToggleCollapse={toggleCollapsed}/>:null}{mobile&&mobileOpen?<div className={styles.mobileBackdrop} onClick={()=>setMobileOpen(false)}><div className={styles.mobilePanel} onClick={(event)=>event.stopPropagation()}><Angelcare360Sidebar open onClose={()=>setMobileOpen(false)} sections={sections} pathname={pathname} showCloseButton collapsed={false}/></div></div>:null}<div className={styles.content}><Angelcare360Header user={user} access={access} pathname={pathname} runtime={runtimeEntitlements} schoolName={schoolName} academicYearLabel={academicYearLabel} onToggleSidebar={()=>mobile?setMobileOpen(true):toggleCollapsed()} showMenuButton={mobile} collapsed={collapsed}/><main className={styles.main}><div className={styles.page}><Angelcare360EntitlementGate pathname={pathname} runtime={runtimeEntitlements}>{children}</Angelcare360EntitlementGate></div><CustomerFooter/></main></div></div></Angelcare360PaymentGateProvider></div></CustomerExperienceProvider>
}
