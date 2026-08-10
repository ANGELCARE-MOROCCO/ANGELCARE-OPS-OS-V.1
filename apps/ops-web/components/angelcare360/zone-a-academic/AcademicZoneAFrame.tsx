'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import AcademicZoneARail from './AcademicZoneARail'
import AcademicZoneACommandPalette from './AcademicZoneACommandPalette'
import AcademicZoneASavedViews from './AcademicZoneASavedViews'
import styles from './AcademicZoneAChrome.module.css'

type Density = 'comfortable' | 'compact'

type Props = {
  children: ReactNode
  showRail?: boolean
  eyebrow?: string
}

const DENSITY_KEY = 'angelcare360.zone-a.density'
const FOCUS_KEY = 'angelcare360.zone-a.focus'
const LAST_ROUTE_KEY = 'angelcare360.zone-a.last-route'

export default function AcademicZoneAFrame({ children, showRail = true, eyebrow = 'Academic Flight Deck' }: Props) {
  const [density, setDensity] = useState<Density>('comfortable')
  const [focusMode, setFocusMode] = useState(false)
  const [ready, setReady] = useState(false)
  const pathname = usePathname() || ''

  useEffect(() => {
    const storedDensity = globalThis.localStorage?.getItem(DENSITY_KEY)
    if (storedDensity === 'compact' || storedDensity === 'comfortable') setDensity(storedDensity)
    setFocusMode(globalThis.localStorage?.getItem(FOCUS_KEY) === 'true')
    setReady(true)
  }, [])

  useEffect(() => {
    if (pathname) globalThis.localStorage?.setItem(LAST_ROUTE_KEY, pathname)
  }, [pathname])

  const changeDensity = (next: Density) => {
    setDensity(next)
    globalThis.localStorage?.setItem(DENSITY_KEY, next)
  }

  const changeFocus = () => {
    setFocusMode((current) => {
      const next = !current
      globalThis.localStorage?.setItem(FOCUS_KEY, String(next))
      return next
    })
  }

  return (
    <section
      className={styles.frame}
      data-zone-a-frame="true"
      data-density={density}
      data-focus={focusMode}
      data-ready={ready}
    >
      <div className={styles.flightDeckBar}>
        <div className={styles.flightDeckIdentity}>
          <span className={styles.signalDot} aria-hidden="true" />
          <div>
            <span>{eyebrow}</span>
            <strong>Pilotage pédagogique & temps scolaire</strong>
          </div>
        </div>
        <div className={styles.flightDeckCommandArea}>
          <AcademicZoneACommandPalette />
      <AcademicZoneASavedViews />
          <div className={styles.experienceControls} aria-label="Préférences d’affichage Zone A">
            <button
              type="button"
              aria-pressed={density === 'compact'}
              onClick={() => changeDensity(density === 'compact' ? 'comfortable' : 'compact')}
            >
              {density === 'compact' ? 'Confort' : 'Compact'}
            </button>
            <button type="button" aria-pressed={focusMode} onClick={changeFocus}>
              {focusMode ? 'Quitter focus' : 'Mode focus'}
            </button>
          </div>
        </div>
      </div>
      {showRail ? <AcademicZoneARail /> : null}
      <div className={styles.frameCanvas}>{children}</div>
    </section>
  )
}
