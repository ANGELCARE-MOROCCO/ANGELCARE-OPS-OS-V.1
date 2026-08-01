'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import { ANGELCARE360_OPERATOR_NAVIGATION } from '@/data/angelcare360/operator-navigation'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import Angelcare360OperatorCommandPalette from './Angelcare360OperatorCommandPalette'
import Angelcare360OperatorHeader from './Angelcare360OperatorHeader'
import Angelcare360OperatorSidebar from './Angelcare360OperatorSidebar'
import SovereignWorkspaceRail from './sovereign/SovereignWorkspaceRail'
import { resolveOperatorExperience } from './Angelcare360OperatorExperience'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = {
  children: ReactNode
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
}

type OperatorCssVariables = CSSProperties & {
  '--operator-accent': string
  '--operator-accent-deep': string
  '--operator-accent-soft': string
  '--operator-accent-glow': string
}

export default function Angelcare360OperatorShell({ children, user, access }: Props) {
  const pathname = usePathname() || '/angelcare-360-operator'
  const profile = useMemo(() => resolveOperatorExperience(pathname), [pathname])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1180px)')
    const updateMobileState = () => {
      const matches = mediaQuery.matches
      setIsMobile(matches)
      if (!matches) setSidebarOpen(false)
    }
    updateMobileState()
    mediaQuery.addEventListener('change', updateMobileState)
    return () => mediaQuery.removeEventListener('change', updateMobileState)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
    setCommandOpen(false)
  }, [pathname])

  const cssVariables: OperatorCssVariables = {
    '--operator-accent': profile.accent,
    '--operator-accent-deep': profile.accentDeep,
    '--operator-accent-soft': profile.accentSoft,
    '--operator-accent-glow': profile.accentGlow,
  }

  return (
    <div
      className={styles.shell}
      data-district={profile.district}
      data-experience={profile.key}
      style={cssVariables}
    >
      <div className={styles.ambientGrid} aria-hidden="true" />
      <div className={styles.ambientLight} aria-hidden="true" />

      <div className={styles.shellGrid}>
        {!isMobile ? (
          <Angelcare360OperatorSidebar
            open
            onClose={() => setSidebarOpen(false)}
            sections={ANGELCARE360_OPERATOR_NAVIGATION}
            pathname={pathname}
            showCloseButton={false}
          />
        ) : null}

        {isMobile && sidebarOpen ? (
          <div className={styles.mobileOverlay} role="presentation" onClick={() => setSidebarOpen(false)}>
            <div className={styles.mobilePanel} onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
              <Angelcare360OperatorSidebar
                open
                onClose={() => setSidebarOpen(false)}
                sections={ANGELCARE360_OPERATOR_NAVIGATION}
                pathname={pathname}
                showCloseButton
              />
            </div>
          </div>
        ) : null}

        <div className={styles.contentShell}>
          <Angelcare360OperatorHeader
            user={user}
            access={access}
            pathname={pathname}
            profile={profile}
            onToggleSidebar={() => setSidebarOpen((current) => !current)}
            onOpenCommand={() => setCommandOpen(true)}
            showMenuButton={isMobile}
          />
          <SovereignWorkspaceRail />
          <main className={styles.main}>{children}</main>
        </div>
      </div>

      <Angelcare360OperatorCommandPalette
        open={commandOpen}
        pathname={pathname}
        onClose={() => setCommandOpen(false)}
      />
    </div>
  )
}
