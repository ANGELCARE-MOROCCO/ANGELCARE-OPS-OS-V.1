'use client'

import { useEffect, useState } from 'react'
import styles from './commercial-experience-controls.module.css'

const FOCUS_KEY = 'angelcare:sanila:commercial-focus'
const DENSITY_KEY = 'angelcare:sanila:commercial-density'

type Density = 'comfortable' | 'compact'

function applyPreferences(focus: boolean, density: Density) {
  const root = document.documentElement
  root.dataset.commercialFocus = focus ? 'true' : 'false'
  root.dataset.commercialDensity = density
}

export default function CommercialExperienceControls() {
  const [focus, setFocus] = useState(false)
  const [density, setDensity] = useState<Density>('comfortable')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedFocus = window.localStorage.getItem(FOCUS_KEY) === 'true'
    const storedDensity = window.localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable'
    setFocus(storedFocus)
    setDensity(storedDensity)
    applyPreferences(storedFocus, storedDensity)
    setReady(true)

    return () => {
      delete document.documentElement.dataset.commercialFocus
      delete document.documentElement.dataset.commercialDensity
    }
  }, [])

  const toggleFocus = () => {
    const next = !focus
    setFocus(next)
    window.localStorage.setItem(FOCUS_KEY, String(next))
    applyPreferences(next, density)
  }

  const toggleDensity = () => {
    const next: Density = density === 'compact' ? 'comfortable' : 'compact'
    setDensity(next)
    window.localStorage.setItem(DENSITY_KEY, next)
    applyPreferences(focus, next)
  }

  return (
    <div className={styles.controls} aria-label="Préférences de l’espace commercial">
      <button
        type="button"
        className={focus ? styles.activeButton : styles.button}
        onClick={toggleFocus}
        aria-pressed={focus}
        title="Réduire les éléments exécutifs secondaires et agrandir la zone de travail"
      >
        <span aria-hidden="true" className={styles.controlMark}>{focus ? 'F' : '◫'}</span>
        <span>{ready && focus ? 'Focus actif' : 'Mode focus'}</span>
      </button>
      <button
        type="button"
        className={density === 'compact' ? styles.activeButton : styles.button}
        onClick={toggleDensity}
        aria-pressed={density === 'compact'}
        title="Basculer entre une densité confortable et compacte"
      >
        <span aria-hidden="true" className={styles.controlMark}>≡</span>
        <span>{ready && density === 'compact' ? 'Compact' : 'Densité'}</span>
      </button>
    </div>
  )
}
