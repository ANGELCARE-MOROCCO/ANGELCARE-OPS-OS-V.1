import Link from 'next/link'
import type { AuditSignal, ObjectComment, SearchResult } from '../types'
import styles from '../sovereign.module.css'

export function ObjectDossier({ object, comments, audit, relations }: { object: SearchResult | null; comments: ObjectComment[]; audit: AuditSignal[]; relations: Record<string, unknown>[] }) {
  if (!object) return <div className={styles.panel}><div className={styles.empty}>Objet introuvable ou hors de votre périmètre.</div></div>
  return <div className={styles.dossier}>
    <div className={styles.dossierMain}>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>{object.title}</h2><p>{object.subtitle || object.public_reference || 'Objet métier gouverné'}</p></div><span className={styles.status} data-status={object.status}>{object.status}</span></header><div className={styles.riskStack}><div><strong>Type</strong><p>{object.object_type}</p></div><div><strong>Propriétaire</strong><p>{object.owner_id || 'À attribuer'}</p></div><div><strong>Territoire</strong><p>{object.territory_id || 'Global'}</p></div><Link href={object.route} className={styles.primaryButton}>Ouvrir l’espace opérationnel</Link></div></section>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Preuves et chronologie</h2><p>Actions sensibles enregistrées sur cet objet.</p></div></header><div className={styles.timeline}>{audit.length ? audit.map((event) => <div className={styles.timelineItem} key={event.id}><strong>{event.action}</strong><span>{new Date(event.created_at).toLocaleString('fr-FR')} · {event.result}</span></div>) : <div className={styles.empty}>Aucun événement d’audit enregistré.</div>}</div></section>
    </div>
    <aside className={styles.dossierRail}>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Relations</h2><p>Objets liés et dépendances.</p></div></header><div className={styles.list}>{relations.length ? relations.map((relation, index) => <div className={styles.listRow} key={String(relation.id || index)}><div className={styles.listTitle}>{String(relation.relation_type || 'relation')}</div><span>Voir</span></div>) : <div className={styles.empty}>Aucune relation enregistrée.</div>}</div></section>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Commentaires internes</h2><p>Contexte conservé pour les équipes autorisées.</p></div></header><div className={styles.list}>{comments.length ? comments.map((comment) => <div className={styles.listRow} key={comment.id}><div><div className={styles.listTitle}>{comment.body}</div><div className={styles.listMeta}>{new Date(comment.created_at).toLocaleString('fr-FR')}</div></div></div>) : <div className={styles.empty}>Aucun commentaire.</div>}</div></section>
    </aside>
  </div>
}
