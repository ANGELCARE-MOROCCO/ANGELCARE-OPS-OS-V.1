'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, BadgeCheck, Clock3, FileText, MapPin, Search, ShieldCheck } from 'lucide-react'
import type { ConversionSession } from '../types'
import styles from '../conversion.module.css'

type Filter = 'all' | 'action' | 'ready' | 'failed'
type QueueMode = 'sessions' | 'exceptions' | 'holds' | 'abandonment' | 'enrollments'

const needsAction = (session: ConversionSession) => ['identity_pending', 'eligibility_pending', 'availability_pending', 'consent_pending', 'review', 'handover_pending'].includes(session.status) || Boolean(session.failure_message)
const identityLabel = (session: ConversionSession) => String(session.identity_context.displayName || session.identity_context.name || session.identity_context.email || session.family_account_id || session.crm_account_id || 'Identité non qualifiée')

export function ConversionQueueBoard({ title, eyebrow, sessions, mode = 'sessions' }: { title: string; eyebrow: string; sessions: ConversionSession[]; mode?: QueueMode }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const visible = useMemo(() => sessions.filter((session) => {
    const matchesFilter = filter === 'all' || filter === 'ready' && session.status === 'ready' || filter === 'failed' && session.status === 'failed' || filter === 'action' && needsAction(session)
    const haystack = `${session.public_reference} ${session.item?.name || ''} ${session.journey} ${session.status} ${identityLabel(session)}`.toLowerCase()
    return matchesFilter && (!query || haystack.includes(query.toLowerCase()))
  }), [sessions, filter, query])
  const ready = sessions.filter((session) => session.status === 'ready').length
  const action = sessions.filter(needsAction).length
  const failed = sessions.filter((session) => session.status === 'failed').length
  const btn = (key: Filter, label: string) => <button type="button" data-active={filter === key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>

  return <main className={styles.conversionQueueRoot} data-mode={mode}>
    <header className={styles.conversionQueueHeader}><div><span>{eyebrow}</span><h1>{title}</h1><p>Chaque dossier conserve prix, disponibilité, consentements, preuves et handover dans la même session.</p></div><div><button type="button" onClick={() => setFilter('action')}>Action requise</button><Link href="/angelcare-marketplace/admin/conversion/sessions">Ouvrir sessions</Link></div></header>
    <section className={styles.conversionQueueMetrics}>
      <article><span>Sessions</span><strong>{sessions.length.toLocaleString('fr-FR')}</strong><small>{mode === 'enrollments' ? 'academy_enrollment' : 'périmètre courant'}</small></article>
      <article data-tone="success"><span>Prêtes</span><strong>{ready.toLocaleString('fr-FR')}</strong><small>ready</small></article>
      <article data-tone="warning"><span>Action requise</span><strong>{action.toLocaleString('fr-FR')}</strong><small>consent / disponibilité / revue</small></article>
      <article data-tone="danger"><span>Échecs</span><strong>{failed.toLocaleString('fr-FR')}</strong><small>blocage réel</small></article>
    </section>
    <div className={styles.conversionQueueLayout}>
      <section className={styles.conversionQueuePanel}>
        <header><div><h2>{mode === 'enrollments' ? 'Inscriptions, cohortes & capacité' : 'Sessions & preuves de conversion'}</h2><p>{visible.length} dossiers affichés sur {sessions.length}</p></div></header>
        <div className={styles.conversionQueueToolbar}><label><Search size={15}/><span className="sr-only">Rechercher une session</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Session, client, programme, offre…"/></label><div>{btn('all', 'Toutes')}{btn('action', 'Action requise')}{btn('ready', 'Prêtes')}{btn('failed', 'Échecs')}</div></div>
        <div className={styles.conversionQueueCards}>{visible.map((session) => <article key={session.id} data-status={session.status}>
          <header><div><span>{session.journey.replaceAll('_', ' ')}</span><h3>{session.item?.name || session.public_reference}</h3></div><b>{session.public_reference}</b></header>
          <dl><div><dt>Client / contexte</dt><dd>{identityLabel(session)}</dd></div><div><dt>Statut</dt><dd><span data-status={session.status}>{session.status}</span></dd></div><div><dt>Preuve</dt><dd>{session.failure_message || `${String(session.availability_result.status || 'disponibilité non vérifiée')} · ${session.consents?.filter((consent) => consent.accepted).length || 0} consentement(s)`}</dd></div><div><dt>Activité</dt><dd>{new Date(session.last_activity_at).toLocaleString('fr-FR')}</dd></div></dl>
          <footer><span><MapPin size={13}/>{session.territory_id || 'global'}</span><Link href={`/angelcare-marketplace/admin/conversion/sessions/${session.id}`}>Ouvrir <ArrowRight size={14}/></Link></footer>
        </article>)}</div>
        {!visible.length ? <div className={styles.conversionQueueEmpty}>Aucune session ne correspond à la recherche et au filtre.</div> : null}
        {mode === 'enrollments' ? <section className={styles.conversionProofStrip}><h3>Contrôles conservés dans la session</h3><div><article><Circle icon="price"/><strong>Prix</strong><span>snapshot versionné</span><b>source-confirmé</b></article><article><Circle icon="availability"/><strong>Disponibilité</strong><span>authority réelle</span><b>source-confirmé</b></article><article><Circle icon="consent"/><strong>Consentements</strong><span>versions + hash</span><b>source-confirmé</b></article><article><Circle icon="handover"/><strong>Handover</strong><span>outcome canonique</span><b>source-confirmé</b></article></div></section> : null}
      </section>
      <aside className={styles.conversionQueueRail}>
        <section><h2>Accès associés</h2>{mode === 'enrollments' ? <><Link href="/angelcare-marketplace/admin/academy/cohorts">Cohortes Academy <ArrowRight size={14}/></Link><Link href="/angelcare-marketplace/admin/journeys/enrollments">Journey enrollments <ArrowRight size={14}/></Link></> : <Link href="/angelcare-marketplace/admin/conversion">Cockpit conversion <ArrowRight size={14}/></Link>}<Link href="/angelcare-marketplace/admin/conversion/exceptions">Exceptions <ArrowRight size={14}/></Link><Link href="/angelcare-marketplace/admin/conversion/consents">Consentements <ArrowRight size={14}/></Link><Link href="/angelcare-marketplace/admin/conversion/holds">Holds <ArrowRight size={14}/></Link></section>
        <section><span>PRINCIPE DE VÉRITÉ</span><p>{mode === 'enrollments' ? 'Une inscription n’est pas confirmée si prix, capacité ou consentements exigent encore une autorité ou une preuve.' : 'Une session n’est pas terminée tant qu’un résultat canonique persistant n’existe pas.'}</p></section>
        <section><span>LÉGENDE</span><p><BadgeCheck size={14}/> Prête · <AlertTriangle size={14}/> Échec · <Clock3 size={14}/> Action requise · <ShieldCheck size={14}/> Preuve</p></section>
      </aside>
    </div>
  </main>
}

function Circle({ icon }: { icon: 'price' | 'availability' | 'consent' | 'handover' }) {
  if (icon === 'price') return <FileText size={15}/>
  if (icon === 'availability') return <MapPin size={15}/>
  if (icon === 'consent') return <ShieldCheck size={15}/>
  return <BadgeCheck size={15}/>
}
