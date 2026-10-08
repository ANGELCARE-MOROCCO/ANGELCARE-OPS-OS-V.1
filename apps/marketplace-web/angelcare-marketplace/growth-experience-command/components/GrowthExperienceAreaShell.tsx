'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {
  Activity, BarChart3, Compass, FlaskConical, Globe2, Home, Megaphone,
  MousePointerClick, RefreshCcw, Search, Sparkles, Target, UsersRound, WandSparkles,
} from 'lucide-react'
import styles from '../growth-experience-command.module.css'

const root='/angelcare-marketplace/admin/growth-experience'
const tabs=[
  {href:root,label:'Command',icon:Sparkles},
  {href:`${root}/acquisition`,label:'Acquisition',icon:Target},
  {href:`${root}/campaigns`,label:'Campaigns',icon:Megaphone},
  {href:`${root}/audiences`,label:'Audiences',icon:UsersRound},
  {href:`${root}/merchandising`,label:'Merchandising',icon:WandSparkles},
  {href:`${root}/homepage`,label:'Homepage',icon:Home},
  {href:`${root}/discovery`,label:'Discovery',icon:Compass},
  {href:`${root}/search`,label:'Search',icon:Search},
  {href:`${root}/conversion`,label:'Conversion',icon:MousePointerClick},
  {href:`${root}/retention`,label:'Retention',icon:RefreshCcw},
  {href:`${root}/recovery`,label:'Recovery',icon:Activity},
  {href:`${root}/experiments`,label:'Experiments',icon:FlaskConical},
  {href:`${root}/localization`,label:'Localization',icon:Globe2},
  {href:`${root}/public-experience`,label:'Public Experience',icon:Compass},
  {href:`${root}/performance`,label:'Performance',icon:BarChart3},
] as const

export function GrowthExperienceAreaShell({children}:{children:React.ReactNode}){
  const pathname=usePathname()
  return <div className={styles.area}>
    <header className={styles.areaHeader}>
      <div>
        <div className={styles.eyebrow}>07 · GROWTH & MARKETPLACE EXPERIENCE</div>
        <h1>Growth Experience Command</h1>
        <p>Acquisition, campaigns, audiences, merchandising, discovery, conversion, retention and public experience — one operating surface over the canonical Marketplace authorities.</p>
      </div>
      <div className={styles.areaStatus}><span>COMMERCIAL EXPERIENCE</span><strong>Evidence → Action</strong><small>No fabricated ROAS, churn or forecast</small></div>
    </header>
    <nav className={styles.horizontalNav} aria-label="Growth & Marketplace Experience">
      <div className={styles.navScroller}>{tabs.map(({href,label,icon:Icon})=>{
        const active=pathname===href||(href!==root&&pathname.startsWith(`${href}/`))
        return <Link href={href} key={href} className={active?styles.navActive:styles.navLink}><Icon size={14}/><span>{label}</span></Link>
      })}</div>
      <div className={styles.navTools}><Link href="/angelcare-marketplace/admin/live-experience-command">Live Experience ↗</Link><Link href="/angelcare-marketplace/admin/frontend-experiences">Frontend Registry ↗</Link></div>
    </nav>
    {children}
  </div>
}
