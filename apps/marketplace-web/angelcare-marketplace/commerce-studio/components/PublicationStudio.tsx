'use client'

import { CheckCircle2, Clock3, History, RefreshCcw, RotateCcw, Send, XCircle } from 'lucide-react'
import styles from '../commerce-studio.module.css'
import type { CommerceRecord, CommerceResource } from '../types'
import { CommerceActionDialog } from './StudioClient'

export function PublicationStudio({ versions, events }: { versions: CommerceRecord[]; events: CommerceRecord[] }) {
  return (
    <main className={styles.shell}>
      <section className={styles.workspaceHero} data-accent="publication">
        <div><span>IMMEDIATE PUBLICATION ORCHESTRATOR</span><h1>Save. Publish. Refresh. Prove.</h1><p>Chaque mutation commerciale invalide les surfaces ciblées, inscrit une version et produit un événement auditable.</p></div>
        <div className={styles.workspaceStats}><Send size={27}/><strong>{events.filter((entry) => entry.status === 'completed').length}</strong><span>publications réussies</span></div>
      </section>
      <section className={styles.publicationFlow}>
        {([
          ['SAVE', 'Persistance canonique', CheckCircle2],
          ['PUBLISH', 'Statut live contrôlé', Send],
          ['REFRESH', 'Routes & tags ciblés', RefreshCcw],
          ['RESULT', 'Preview et audit', History],
        ] as const).map(([key, label, Icon], index) => <article key={key}><span>0{index + 1}</span><Icon size={23}/><strong>{key}</strong><p>{label}</p></article>)}
      </section>
      <section className={styles.publicationGrid}>
        <div className={styles.panel}>
          <header><div><span>PUBLICATION EVENTS</span><h2>Historique d’exécution</h2></div><Clock3 size={20}/></header>
          <div className={styles.recordRows}>{events.map((event) => <div key={event.id}><div><strong>{String(event.object_type || 'commerce')}</strong><span>{String(event.action || 'update')} · {Array.isArray(event.affected_paths) ? event.affected_paths.length : 0} routes</span></div><b data-risk={event.status === 'failed'}>{event.status === 'failed' ? <XCircle size={14}/> : <CheckCircle2 size={14}/>} {String(event.status)}</b></div>)}</div>
        </div>
        <div className={styles.panel}>
          <header><div><span>VERSION HISTORY</span><h2>Rollback gouverné</h2></div><RotateCcw size={20}/></header>
          <div className={styles.recordRows}>{versions.map((version) => {
            const resource = String(version.object_type) as CommerceResource
            return <div key={version.id}><div><strong>{resource}</strong><span>Version {String(version.version_number)} · {String(version.action)} · objet {String(version.object_id)}</span></div><CommerceActionDialog resource={resource} id={String(version.object_id)} action="rollback" label="Restaurer" objectLabel={`${resource} · ${String(version.object_id)}`} currentState="version courante" targetState={`version ${String(version.version_number)}`} consequences="Le snapshot choisi remplace l’état courant, crée une nouvelle trace de version et rafraîchit les surfaces publiques affectées." reversible payload={{ version_number: Number(version.version_number) }}/></div>
          })}</div>
        </div>
      </section>
    </main>
  )
}
