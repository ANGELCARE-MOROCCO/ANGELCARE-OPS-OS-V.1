'use client'

import { ShieldAlert } from 'lucide-react'
import { controlledIslandPolicy } from '../controlled-islands'
import type { StudioBlockProps } from '../types'
import styles from './studio-runtime.module.css'

export function StudioControlledIsland({props}:{props:StudioBlockProps}) {
  const policy = controlledIslandPolicy(props)
  return <section className={styles.island} role="note" aria-label="Îlot contrôlé à examiner">
    <div className={styles.islandHead}><ShieldAlert size={16}/><strong>{String(props.title || 'Capacité externe à examiner')}</strong></div>
    <p>{String(props.body || policy.reason)}</p>
    <dl className={styles.islandPolicy}>
      <div><dt>Type</dt><dd>{policy.kind}</dd></div>
      <div><dt>Code étranger</dt><dd>Bloqué</dd></div>
      <div><dt>Identifiants / cookies</dt><dd>Jamais transmis</dd></div>
      <div><dt>Réseau privé</dt><dd>Interdit</dd></div>
      <div><dt>Publication</dt><dd>Revue obligatoire</dd></div>
    </dl>
  </section>
}
