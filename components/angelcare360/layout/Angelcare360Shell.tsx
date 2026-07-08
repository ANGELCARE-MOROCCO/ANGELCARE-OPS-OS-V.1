'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getAngelcare360NavigationSections } from '@/data/angelcare360/navigation'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import Angelcare360Header from './Angelcare360Header'
import Angelcare360Sidebar from './Angelcare360Sidebar'
import { ANGELCARE360_COLORS } from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Angelcare360ShellProps = {
  children: ReactNode
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
}

export default function Angelcare360Shell({ children, user, access }: Angelcare360ShellProps) {
  const pathname = usePathname() || '/angelcare-360-command-center'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sections = getAngelcare360NavigationSections()

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1100px)')

    const updateMobileState = () => {
      const matches = mediaQuery.matches
      setIsMobile(matches)
      if (!matches) {
        setSidebarOpen(false)
      }
    }

    updateMobileState()
    mediaQuery.addEventListener('change', updateMobileState)

    return () => mediaQuery.removeEventListener('change', updateMobileState)
  }, [])

  return (
    <div style={shellStyle}>
      <div style={shellBackdropStyle} />
      <div style={isMobile ? shellStackStyle : shellGridStyle}>
        {!isMobile ? (
          <div style={sidebarWrapperStyle}>
            <Angelcare360Sidebar
              open
              onClose={() => setSidebarOpen(false)}
              sections={sections}
              pathname={pathname}
              showCloseButton={false}
            />
          </div>
        ) : null}
        {isMobile && sidebarOpen ? (
          <div style={mobileSidebarStyle} role="presentation" onClick={() => setSidebarOpen(false)}>
            <div style={mobileSidebarPanelStyle} onClick={(event) => event.stopPropagation()}>
              <Angelcare360Sidebar
                open
                onClose={() => setSidebarOpen(false)}
                sections={sections}
                pathname={pathname}
                showCloseButton
              />
            </div>
          </div>
        ) : null}
        <div style={contentShellStyle}>
          <Angelcare360Header
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
    'radial-gradient(circle at top left, rgba(59,130,246,.09), transparent 26%), radial-gradient(circle at top right, rgba(14,165,233,.07), transparent 20%), linear-gradient(180deg, #f8fafc 0%, #eef4fb 100%)',
  color: ANGELCARE360_COLORS.navy,
}

const shellBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  background: 'linear-gradient(135deg, rgba(255,255,255,.58) 0%, rgba(255,255,255,.22) 100%)',
}

const shellGridStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '336px minmax(0,1fr)',
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
  width: 'min(100vw, 348px)',
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
  padding: 24,
}
