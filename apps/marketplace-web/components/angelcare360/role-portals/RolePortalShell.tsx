import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { APP_SESSION_COOKIE, APP_SESSION_COOKIE_DOMAIN } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PARENT_PORTAL_NAV, STAFF_PORTAL_NAV, STUDENT_PORTAL_NAV, TEACHER_PORTAL_NAV } from '@/data/angelcare360/role-portals'
import type { Angelcare360PortalKind } from '@/types/angelcare360/role-portals'
import styles from './RolePortalShell.module.css'

const NAV={teacher:TEACHER_PORTAL_NAV,parent:PARENT_PORTAL_NAV,staff:STAFF_PORTAL_NAV,student:STUDENT_PORTAL_NAV} as const
const LABELS:Record<Angelcare360PortalKind,string>={teacher:'Espace Enseignant',parent:'Espace Famille',staff:'Espace Équipe',student:'Espace Élève'}
function initials(name:string){return name.split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]?.toUpperCase()).join('')||'S'}

export default async function RolePortalShell({kind,schoolName,academicYear,identityName,children}:{kind:Angelcare360PortalKind;schoolName:string;academicYear:string;identityName:string;children:React.ReactNode}){
  async function logoutAction(){
    'use server'
    const store=await cookies(); const token=store.get(APP_SESSION_COOKIE)?.value
    if(token){const db=await createClient(); await db.from('app_sessions').delete().eq('session_token',token).then(()=>null,()=>null)}
    store.set(APP_SESSION_COOKIE,'',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',expires:new Date(0)}); if(APP_SESSION_COOKIE_DOMAIN) store.set(APP_SESSION_COOKIE,'',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',domain:APP_SESSION_COOKIE_DOMAIN,expires:new Date(0)}); store.delete('sanila_portal_kind'); store.delete('sanila_portal_person'); store.delete('sanila_portal_school'); redirect(`/angelcare-360-${kind}/login`)
  }
  return <div className={styles.shell}>
    <header className={styles.topbar}>
      <div className={styles.brand}><Image src="/brand/sanila-official-logo.png" alt="SANILA" width={148} height={48} className={styles.brandLogo}/><div><div className={styles.brandMeta}>{LABELS[kind]} · Operating System sécurisé</div></div></div>
      <div className={styles.topActions}><span className={styles.statusChip}>Session vérifiée</span><div className={styles.identity}><div className={styles.avatar}>{initials(identityName)}</div><div><div className={styles.identityName}>{identityName}</div><div className={styles.identityRole}>{LABELS[kind]}</div></div></div><form action={logoutAction}><button className={styles.logout} type="submit">Déconnexion</button></form></div>
    </header>
    <nav className={styles.mobileNav} aria-label="Navigation mobile">{NAV[kind].map(item=><Link key={item.href} href={item.href}>{item.shortLabel}</Link>)}</nav>
    <div className={styles.body}><aside className={styles.sidebar}><div className={styles.schoolCard}><div className={styles.schoolLabel}>Établissement</div><div className={styles.schoolName}>{schoolName}</div><div className={styles.year}>{academicYear}</div></div><nav className={styles.nav} aria-label={LABELS[kind]}>{NAV[kind].map(item=><Link key={item.href} href={item.href} className={styles.navLink}><span className={styles.navDot}/><span>{item.label}</span></Link>)}</nav><div className={styles.footerNote}>Les informations affichées sont limitées à votre identité, votre établissement et votre périmètre autorisé. SANILA n’utilise pas un simple masquage d’interface comme frontière de sécurité.</div></aside><main className={styles.main}>{children}</main></div>
  </div>
}
