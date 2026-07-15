'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { ANGELCARE360_OPERATOR_NAVIGATION } from '@/data/angelcare360/operator-navigation'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import Angelcare360OperatorHeader from './Angelcare360OperatorHeader'
import Angelcare360OperatorSidebar from './Angelcare360OperatorSidebar'
import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Props = {
  children: ReactNode
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
}

export default function Angelcare360OperatorShell({ children, user, access }: Props) {
  const pathname = usePathname() || '/angelcare-360-operator'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1100px)')

    const updateMobileState = () => {
      const matches = mediaQuery.matches
      setIsMobile(matches)
      if (!matches) setSidebarOpen(false)
    }

    updateMobileState()
    mediaQuery.addEventListener('change', updateMobileState)
    return () => mediaQuery.removeEventListener('change', updateMobileState)
  }, [])

  return (
    <div style={shellStyle}>
      <div style={shellBackdropStyle} />
      <div style={floatingRibbonStyle} />
      <div style={isMobile ? shellStackStyle : shellGridStyle}>
        {!isMobile ? (
          <div style={sidebarWrapperStyle}>
            <Angelcare360OperatorSidebar
              open
              onClose={() => setSidebarOpen(false)}
              sections={ANGELCARE360_OPERATOR_NAVIGATION}
              pathname={pathname}
              showCloseButton={false}
            />
          </div>
        ) : null}

        {isMobile && sidebarOpen ? (
          <div style={mobileSidebarStyle} role="presentation" onClick={() => setSidebarOpen(false)}>
            <div style={mobileSidebarPanelStyle} onClick={(event) => event.stopPropagation()}>
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

        <div style={contentShellStyle}>
          <Angelcare360OperatorHeader
            user={user}
            access={access}
            pathname={pathname}
            onToggleSidebar={() => setSidebarOpen((current) => !current)}
            showMenuButton={isMobile}
          />
          <main style={mainStyle}>{children}</main>
        </div>
      </div>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  position: 'relative',
  background:
    'radial-gradient(circle at 18% 12%, rgba(219,234,254,.85), transparent 24%), radial-gradient(circle at 82% 10%, rgba(191,219,254,.55), transparent 18%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)',
  color: ANGELCARE360_OPERATOR_COLORS.navy,
}

const shellBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  background: 'linear-gradient(135deg, rgba(255,255,255,.72) 0%, rgba(255,255,255,.28) 100%)',
}

const floatingRibbonStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 'auto 16px 16px auto',
  width: 180,
  height: 180,
  borderRadius: 999,
  background: 'radial-gradient(circle, rgba(219,234,254,.42) 0%, rgba(219,234,254,0) 72%)',
  filter: 'blur(12px)',
  pointerEvents: 'none',
}

const shellGridStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '368px minmax(0,1fr)',
  minHeight: '100vh',
}

const shellStackStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr)',
  minHeight: '100vh',
}

const sidebarWrapperStyle: React.CSSProperties = {
  display: 'block',
}

const mobileSidebarStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  display: 'flex',
  justifyContent: 'flex-start',
  background: 'rgba(15, 23, 42, 0.28)',
  backdropFilter: 'blur(8px)',
}

const mobileSidebarPanelStyle: React.CSSProperties = {
  width: 'min(100vw, 392px)',
  maxWidth: '100%',
  height: '100%',
  background: '#fff',
  boxShadow: '18px 0 48px rgba(15,23,42,.18)',
}

const contentShellStyle: React.CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gridTemplateRows: 'auto minmax(0,1fr)',
}

const mainStyle: React.CSSProperties = {
  minWidth: 0,
  padding: 28,
}
