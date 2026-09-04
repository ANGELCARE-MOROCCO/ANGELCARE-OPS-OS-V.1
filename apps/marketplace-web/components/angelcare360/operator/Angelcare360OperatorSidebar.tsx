'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import type { Angelcare360OperatorNavigationSection } from '@/types/angelcare360/operator'
import { OperatorNavigationIcon } from './Angelcare360OperatorIcons'
import { resolveSovereignTower } from '@/data/angelcare360/operator-sovereign-navigation'
import SanilaLogo from '@/components/brand/SanilaLogo'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = { sections: Angelcare360OperatorNavigationSection[]; pathname:string; open:boolean; onClose:()=>void; showCloseButton:boolean }

export default function Angelcare360OperatorSidebar({sections,pathname,open,onClose,showCloseButton}:Props){
  if(!open)return null
  const items=sections.flatMap(section=>section.items)
  const activeTower=resolveSovereignTower(pathname)
  return <aside className={styles.sidebar} aria-label="Six univers souverains SANILA Operator">
    <div className={styles.sidebarBrand}><SanilaLogo variant="white" width={130} height={46} className={styles.sidebarBrandLogo} priority/><span className={styles.brandTitle}>OPERATOR COMMAND</span><span className={styles.brandSubtitle}>Six univers pour exploiter toute la machine SaaS.</span></div>
    <div className={styles.sidebarTop}><div><div className={styles.sidebarTopTitle}>Architecture souveraine</div><div className={styles.sidebarTopMeta}>6 responsabilités · 1 command fabric</div></div>{showCloseButton?<button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer"><X size={17}/></button>:null}</div>
    <nav className={styles.nav}>
      <div className={styles.navItems}>
        {items.map(item=>{const active=item.key===activeTower.key;return <Link key={item.key} href={item.href} onClick={onClose} aria-current={active?'page':undefined} className={`${styles.navLink} ${active?styles.navLinkActive:''}`} title={item.summary}><span className={styles.navIcon}><OperatorNavigationIcon itemKey={item.key}/></span><span className={styles.navLabel}><strong>{item.label}</strong><small>{item.summary}</small></span>{item.badge?<span className={styles.navBadge}>{item.badge}</span>:null}</Link>})}
      </div>
    </nav>
  </aside>
}
