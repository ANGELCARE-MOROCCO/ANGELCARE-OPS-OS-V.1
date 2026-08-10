"use client"
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Activity,BadgeCheck,Banknote,BarChart3,Boxes,Building2,ClipboardCheck,FileClock,Gauge,Globe2,GraduationCap,HardDrive,LayoutTemplate,ListChecks,Megaphone,Navigation,Radio,Rocket,Search,Settings2,ShieldCheck,ShoppingBag,Sparkles,UsersRound,Waypoints,WandSparkles} from 'lucide-react'
import styles from '../design-system/marketplace.module.css'
import {cx} from '../design-system/ui'

const groups=[
 {label:'Executive Command',items:[
  {href:'/angelcare-marketplace/admin',label:'Cockpit de direction',icon:Gauge},
  {href:'/angelcare-marketplace/admin/command',label:'Commandement 360',icon:Sparkles},
  {href:'/angelcare-marketplace/admin/action-center',label:'Centre d’action',icon:ClipboardCheck},
  {href:'/angelcare-marketplace/admin/approvals',label:'Approbations',icon:ListChecks},
  {href:'/angelcare-marketplace/admin/search',label:'Recherche globale',icon:Search},
 ]},
 {label:'Commerce & Revenue',items:[
  {href:'/angelcare-marketplace/admin/commerce-studio',label:'Commerce Studio',icon:Sparkles},
  {href:'/angelcare-marketplace/admin/catalog',label:'Catalogue',icon:Boxes},
  {href:'/angelcare-marketplace/admin/commercial',label:'Revenue Command',icon:Activity},
  {href:'/angelcare-marketplace/admin/commercial/quotes',label:'Devis & preuves',icon:FileClock},
  {href:'/angelcare-marketplace/admin/conversion',label:'Conversion Command',icon:Waypoints},
  {href:'/angelcare-marketplace/admin/orders',label:'Enterprise Orders',icon:ShoppingBag},
 ]},
 {label:'Customers',items:[
  {href:'/angelcare-marketplace/admin/families',label:'Family Command',icon:UsersRound},
  {href:'/angelcare-marketplace/admin/family-requests',label:'Demandes familles',icon:ClipboardCheck},
  {href:'/angelcare-marketplace/admin/journeys',label:'Customer Journey',icon:Waypoints},
  {href:'/angelcare-marketplace/admin/public-inquiries',label:'Entrées publiques',icon:Activity},
 ]},
 {label:'Operations',items:[
  {href:'/angelcare-marketplace/admin/operations',label:'Operations Command',icon:Activity},
  {href:'/angelcare-marketplace/admin/operations/fulfillment',label:'Fulfillment',icon:Waypoints},
  {href:'/angelcare-marketplace/admin/operations/live',label:'Mission Control',icon:Radio},
  {href:'/angelcare-marketplace/admin/operations/incidents',label:'Incidents',icon:ShieldCheck},
  {href:'/angelcare-marketplace/admin/operations/disputes',label:'Disputes & Recovery',icon:BadgeCheck},
  {href:'/angelcare-marketplace/admin/operations/reconciliation',label:'Reconciliation',icon:Banknote},
 ]},
 {label:'Supply',items:[
  {href:'/angelcare-marketplace/admin/providers',label:'Provider Workforce',icon:UsersRound},
  {href:'/angelcare-marketplace/admin/providers/onboarding',label:'Provider Onboarding',icon:ClipboardCheck},
  {href:'/angelcare-marketplace/admin/providers/eligibility',label:'Éligibilité',icon:BadgeCheck},
  {href:'/angelcare-marketplace/admin/vendors',label:'Vendor Command',icon:Building2},
  {href:'/angelcare-marketplace/admin/suppliers',label:'Fournisseurs',icon:Boxes},
 ]},
 {label:'Partners',items:[
  {href:'/angelcare-marketplace/admin/partner-os',label:'Partner OS',icon:Building2},
  {href:'/angelcare-marketplace/admin/partner-os/tenants',label:'Tenants',icon:Boxes},
  {href:'/angelcare-marketplace/admin/verticals',label:'B2B Verticals',icon:Activity},
  {href:'/angelcare-marketplace/admin/verticals/corporates',label:'Corporate & RH',icon:UsersRound},
 ]},
 {label:'Academy',items:[
  {href:'/angelcare-marketplace/admin/academy',label:'Academy Command',icon:GraduationCap},
  {href:'/angelcare-marketplace/admin/academy/programs',label:'Programmes',icon:LayoutTemplate},
  {href:'/angelcare-marketplace/admin/academy/cohorts',label:'Cohortes',icon:UsersRound},
  {href:'/angelcare-marketplace/admin/academy/sessions',label:'Sessions',icon:Activity},
  {href:'/angelcare-marketplace/admin/academy/attendance',label:'Présence',icon:ClipboardCheck},
  {href:'/angelcare-marketplace/admin/academy/assessments',label:'Évaluations',icon:BadgeCheck},
  {href:'/angelcare-marketplace/admin/academy/certificates',label:'Certificats',icon:ShieldCheck},
 ]},
 {label:'Experience',items:[
  {href:'/angelcare-marketplace/admin/homepage',label:'Homepage Authority',icon:LayoutTemplate},
  {href:'/angelcare-marketplace/admin/homepage/composer',label:'Homepage Composer',icon:WandSparkles},
  {href:'/angelcare-marketplace/admin/live-experience-command',label:'Live Experience',icon:Megaphone},
  {href:'/angelcare-marketplace/admin/live-experience-command/popups',label:'Popups',icon:Sparkles},
  {href:'/angelcare-marketplace/admin/navigation/header',label:'Navigation Studio',icon:Navigation},
  {href:'/angelcare-marketplace/admin/footer-studio',label:'Footer Studio',icon:LayoutTemplate},
  {href:'/angelcare-marketplace/admin/localization',label:'Localization',icon:Globe2},
 ]},
 {label:'Growth',items:[
  {href:'/angelcare-marketplace/admin/growth',label:'Growth Command',icon:Rocket},
  {href:'/angelcare-marketplace/admin/growth/campaigns',label:'Campaigns',icon:Megaphone},
  {href:'/angelcare-marketplace/admin/growth/experiments',label:'Experiments',icon:Sparkles},
  {href:'/angelcare-marketplace/admin/merchandising',label:'Merchandising',icon:ShoppingBag},
 ]},
 {label:'Finance',items:[
  {href:'/angelcare-marketplace/admin/finance',label:'Finance Authority',icon:Banknote},
  {href:'/angelcare-marketplace/admin/payments',label:'Payment Command',icon:Banknote},
  {href:'/angelcare-marketplace/admin/wallet',label:'AC Privilege Wallet',icon:BadgeCheck},
  {href:'/angelcare-marketplace/admin/finance/margins',label:'Margin Authority',icon:BarChart3},
  {href:'/angelcare-marketplace/admin/finance/reconciliation',label:'Finance Reconciliation',icon:Activity},
 ]},
 {label:'Trust & Quality',items:[
  {href:'/angelcare-marketplace/admin/trust',label:'Trust Command',icon:BadgeCheck},
  {href:'/angelcare-marketplace/admin/trust/complaints',label:'Plaintes',icon:ShieldCheck},
  {href:'/angelcare-marketplace/admin/trust/investigations',label:'Investigations',icon:Search},
  {href:'/angelcare-marketplace/admin/trust/quality-check-360',label:'Quality Check 360',icon:ClipboardCheck},
  {href:'/angelcare-marketplace/admin/qa',label:'QA Authority',icon:ListChecks},
 ]},
 {label:'Intelligence',items:[
  {href:'/angelcare-marketplace/admin/intelligence',label:'Executive Intelligence',icon:BarChart3},
  {href:'/angelcare-marketplace/admin/analytics',label:'Enterprise Analytics',icon:Activity},
  {href:'/angelcare-marketplace/admin/platform-performance',label:'Platform Performance',icon:Gauge},
 ]},
 {label:'Platform & Security',items:[
  {href:'/angelcare-marketplace/admin/security',label:'Security Command',icon:ShieldCheck},
  {href:'/angelcare-marketplace/admin/security/incidents',label:'Security Incidents',icon:Activity},
  {href:'/angelcare-marketplace/admin/security/backups',label:'Backup & Recovery',icon:HardDrive},
  {href:'/angelcare-marketplace/admin/security/workspace-access',label:'Workspace Access',icon:UsersRound},
  {href:'/angelcare-marketplace/admin/configuration',label:'Configuration',icon:Settings2},
 ]},
 {label:'Launch & Governance',items:[
  {href:'/angelcare-marketplace/admin/launch',label:'Release Authority',icon:Rocket},
  {href:'/angelcare-marketplace/admin/launch/readiness',label:'Readiness',icon:ClipboardCheck},
  {href:'/angelcare-marketplace/admin/launch/monitoring',label:'Post-release Monitoring',icon:Activity},
  {href:'/angelcare-marketplace/admin/activation',label:'Production Activation',icon:Rocket},
  {href:'/angelcare-marketplace/admin/territories',label:'Territory Command',icon:Globe2},
 ]},
] as const

export function AdminNavigation(){const pathname=usePathname();return <nav className={styles.sidebarNav} aria-label="Master Backoffice Marketplace">{groups.map(group=><div className={styles.navGroup} key={group.label}><div className={styles.navGroupLabel}>{group.label}</div>{group.items.map(({href,label,icon:Icon})=>{const active=pathname===href||(href!=='/angelcare-marketplace/admin'&&pathname.startsWith(`${href}/`));return <Link key={href} href={href} className={cx(styles.sideNavLink,active&&styles.sideNavLinkActive)}><span className={styles.sideNavIcon}><Icon size={15}/></span>{label}</Link>})}</div>)}<div className={styles.navGroup}><div className={styles.navGroupLabel}>Operating Universes</div><Link href="/angelcare-marketplace/fr/marketplace" className={styles.sideNavLink}><span className={styles.sideNavIcon}><Boxes size={15}/></span>Marketplace public</Link><Link href="/angelcare-marketplace/partner/dashboard" className={styles.sideNavLink}><span className={styles.sideNavIcon}><Building2 size={15}/></span>Espace partenaire</Link><Link href="/angelcare-marketplace/provider" className={styles.sideNavLink}><span className={styles.sideNavIcon}><UsersRound size={15}/></span>Espace provider</Link><Link href="/angelcare-marketplace/trainer" className={styles.sideNavLink}><span className={styles.sideNavIcon}><GraduationCap size={15}/></span>Espace trainer</Link><Link href="/angelcare-marketplace/family/dashboard" className={styles.sideNavLink}><span className={styles.sideNavIcon}><UsersRound size={15}/></span>Espace famille</Link></div></nav>}
