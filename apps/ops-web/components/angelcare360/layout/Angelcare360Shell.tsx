'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getAngelcare360NavigationSections } from '@/data/angelcare360/navigation'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import Angelcare360Header from './Angelcare360Header'
import Angelcare360Sidebar from './Angelcare360Sidebar'
import Angelcare360PaymentGateProvider from '@/components/angelcare360/payment/Angelcare360PaymentGateProvider'
import {
  ANGELCARE360_COLORS,
  angelcare360PageBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

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
      <div style={shellGlowStyle} />
      <Angelcare360PaymentGateProvider pathname={pathname}>
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
      </Angelcare360PaymentGateProvider>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  ...angelcare360PageBackdropStyle,
  position: 'relative',
  background:
    'radial-gradient(circle at top left, rgba(59,130,246,.11), transparent 26%), radial-gradient(circle at top right, rgba(14,165,233,.08), transparent 20%), linear-gradient(180deg, #f8fafc 0%, #edf4fb 100%)',
  color: ANGELCARE360_COLORS.navy,
}

const shellBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  background: 'linear-gradient(135deg, rgba(255,255,255,.72) 0%, rgba(255,255,255,.26) 100%)',
}

const shellGlowStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  background:
    'radial-gradient(circle at 20% 0%, rgba(29,78,216,.08), transparent 22%), radial-gradient(circle at 90% 8%, rgba(14,165,233,.08), transparent 18%)',
}

const shellGridStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '344px minmax(0,1fr)',
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
  background: 'rgba(15, 23, 42, 0.32)',
  backdropFilter: 'blur(10px)',
}

const mobileSidebarPanelStyle: React.CSSProperties = {
  width: 'min(100vw, 360px)',
  maxWidth: '100%',
  height: '100%',
  background: '#fff',
  boxShadow: '18px 0 56px rgba(15,23,42,.18)',
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
