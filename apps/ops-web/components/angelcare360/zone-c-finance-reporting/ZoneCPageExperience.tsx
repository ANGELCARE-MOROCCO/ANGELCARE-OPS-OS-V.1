'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import ZoneCVisualSignature, { ZoneCCrossDomainBridge } from './ZoneCVisualSignatures'
import { ZoneCCommandSurface, commandDefinitions } from './ZoneCCommandSurfaces'
import ZoneCIcon from './ZoneCIcon'
import { descriptors, resolveZoneCSurface, type ZoneCCommandSurfaceId } from './zone-c-registry'
import styles from './ZoneCFrame.module.css'

export default function ZoneCPageExperience({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/angelcare-360-command-center/finance'
  const surface = resolveZoneCSurface(pathname)
  const descriptor = descriptors[surface]
  const [openCommand, setOpenCommand] = useState<ZoneCCommandSurfaceId | null>(null)
  const coreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = coreRef.current
    if (!root) return
    const expectedBase = descriptor.domain === 'finance' ? '/angelcare-360-command-center/finance' : '/angelcare-360-command-center/rapports'
    const navs = Array.from(root.querySelectorAll<HTMLElement>('nav'))
    navs.forEach((nav) => {
      const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href]'))
      const matches = links.filter((link) => (link.getAttribute('href') || '').startsWith(expectedBase))
      if (matches.length >= 3) nav.setAttribute('data-zone-c-legacy-nav','true')
    })
  }, [pathname, descriptor.domain])

  const open = (id: string) => {
    if (id in commandDefinitions) setOpenCommand(id as ZoneCCommandSurfaceId)
  }

  const continueToCore = () => {
    setOpenCommand(null)
    requestAnimationFrame(() => {
      const root = coreRef.current
      root?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const focusable = root?.querySelector<HTMLElement>('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),a[href]')
      focusable?.focus({ preventScroll: true })
    })
  }

  return <div className={styles.pageExperience} data-zone-c-surface={surface}>
    <ZoneCVisualSignature surface={surface} onOpenCommand={open}/>

    <div className={styles.truthRail}>
      <div className={styles.truthRailIntro}><span>CONSTITUTION DE VÉRITÉ</span><strong>{descriptor.signature}</strong></div>
      {descriptor.truth.map((truth, index)=><div className={styles.truthRailItem} key={truth}><span>{String(index+1).padStart(2,'0')}</span><p>{truth}</p></div>)}
      <div className={styles.truthRailAttention}><ZoneCIcon name="warning"/><p>{descriptor.attention}</p></div>
    </div>

    <div className={styles.commandDock} aria-label="Commandes contextuelles Zone C">
      <div className={styles.commandDockTitle}><span>COMMANDES CONTEXTUELLES</span><strong>Préparer · comprendre · poursuivre dans le registre réel</strong></div>
      <div className={styles.commandDockActions}>{descriptor.commands.map((id)=><button key={id} type="button" onClick={()=>setOpenCommand(id)}><span><ZoneCIcon name={commandDefinitions[id].icon}/></span><div><strong>{commandDefinitions[id].title}</strong><small>{commandDefinitions[id].eyebrow}</small></div><ZoneCIcon name="arrow"/></button>)}</div>
    </div>

    <div ref={coreRef} id="zone-c-live-core" className={styles.liveCore} data-zone-c-live-core>
      <div className={styles.liveCoreHeader}><div><span>REGISTRE OPÉRATIONNEL RÉEL</span><strong>Les données, formulaires et mutations existants restent l’autorité d’exécution.</strong></div><button type="button" onClick={()=>coreRef.current?.scrollIntoView({behavior:'smooth',block:'start'})}>Recentrer</button></div>
      {children}
    </div>

    <ZoneCCrossDomainBridge domain={descriptor.domain}/>

    {openCommand ? <ZoneCCommandSurface id={openCommand} open onClose={()=>setOpenCommand(null)} onContinue={continueToCore}/> : null}
  </div>
}
