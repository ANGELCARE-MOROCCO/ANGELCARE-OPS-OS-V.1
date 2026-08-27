'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import styles from './AcademicZoneAChrome.module.css'

type Command = {
  label: string
  description: string
  href: string
  keywords: string
}

const commands: Command[] = [
  { label: 'Aujourd’hui académique', description: 'Cours, évaluations et points d’attention du jour', href: '/angelcare-360-command-center/academique', keywords: 'today aujourd hui académique cockpit' },
  { label: 'Emploi du temps', description: 'Ouvrir le Timetable Airspace', href: '/angelcare-360-command-center/emploi-du-temps', keywords: 'planning timetable semaine jour' },
  { label: 'Classes & groupes', description: 'Dossiers académiques des classes', href: '/angelcare-360-command-center/emploi-du-temps/classes', keywords: 'classe groupes' },
  { label: 'Charge enseignants', description: 'Planning et charge académique', href: '/angelcare-360-command-center/emploi-du-temps/enseignants', keywords: 'enseignants professeurs charge' },
  { label: 'Cours', description: 'Teaching Delivery Command', href: '/angelcare-360-command-center/academique/cours', keywords: 'cours séances leçons' },
  { label: 'Progression', description: 'Learning Flow et retard pédagogique', href: '/angelcare-360-command-center/academique?plane=progression', keywords: 'progression programme retard apprentissage' },
  { label: 'Devoirs', description: 'Homework Studio et échéances', href: '/angelcare-360-command-center/academique/devoirs', keywords: 'devoir homework remise' },
  { label: 'Soumissions', description: 'Travaux à corriger et retards', href: '/angelcare-360-command-center/academique/soumissions', keywords: 'soumissions corrections retards' },
  { label: 'Évaluations', description: 'Assessment Foundry', href: '/angelcare-360-command-center/academique/examens', keywords: 'examens evaluations tests quiz' },
  { label: 'Sessions d’examens', description: 'Assessment Operations Airspace', href: '/angelcare-360-command-center/academique/sessions-examens', keywords: 'sessions examens salles surveillance' },
  { label: 'Notes & maîtrise', description: 'Mastery & Grade Matrix', href: '/angelcare-360-command-center/academique/notes', keywords: 'notes grades mastery saisie' },
  { label: 'Moyennes', description: 'Consolidation et readiness', href: '/angelcare-360-command-center/academique/moyennes', keywords: 'moyennes calcul consolidation' },
  { label: 'Bulletins', description: 'Bulletin Atelier', href: '/angelcare-360-command-center/academique/bulletins', keywords: 'bulletins publication résultats' },
  { label: 'Appréciations', description: 'Teacher Commentary Studio', href: '/angelcare-360-command-center/academique/appreciations', keywords: 'appreciations commentaires enseignants' },
  { label: 'Coordination', description: 'Academic Intervention Room', href: '/angelcare-360-command-center/academique?plane=review', keywords: 'coordination interventions blocages' },
  { label: 'Historique académique', description: 'Academic History Lens', href: '/angelcare-360-command-center/academique/audit', keywords: 'historique audit trace' },
]

export default function AcademicZoneACommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pathname = usePathname() || ''

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const timer = globalThis.setTimeout(() => inputRef.current?.focus(), 20)
    return () => globalThis.clearTimeout(timer)
  }, [open])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr')
    if (!normalized) return commands
    return commands.filter((item) => `${item.label} ${item.description} ${item.keywords}`.toLocaleLowerCase('fr').includes(normalized))
  }, [query])

  return (
    <>
      <button type="button" className={styles.commandPaletteTrigger} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span>Rechercher / commander</span><kbd>⌘K</kbd>
      </button>
      {open ? (
        <div className={styles.commandPaletteRoot} data-zone-a-overlay-root="true" role="presentation">
          <button className={styles.commandPaletteBackdrop} type="button" aria-label="Fermer" onClick={() => setOpen(false)} />
          <section className={styles.commandPalettePanel} role="dialog" aria-modal="true" aria-label="Commandes académiques">
            <div className={styles.commandPaletteInputRow}>
              <span aria-hidden="true">⌕</span>
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cours, devoirs, évaluations, planning…" />
              <button type="button" onClick={() => setOpen(false)}>Échap</button>
            </div>
            <div className={styles.commandPaletteResults}>
              {filtered.length ? filtered.map((item) => (
                <Link key={item.href} href={item.href} data-current={pathname === item.href} onClick={() => setOpen(false)}>
                  <div><strong>{item.label}</strong><span>{item.description}</span></div>
                  <b aria-hidden="true">→</b>
                </Link>
              )) : <div className={styles.commandPaletteEmpty}>Aucune commande correspondante.</div>}
            </div>
            <footer><span>Navigation uniquement — aucune mutation destructive depuis la palette.</span></footer>
          </section>
        </div>
      ) : null}
    </>
  )
}
