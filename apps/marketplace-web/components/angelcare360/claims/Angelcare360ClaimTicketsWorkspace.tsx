'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Grid2X2, Rows3 } from 'lucide-react'
import type { Angelcare360ClaimTicketRecord } from '@/types/angelcare360/communications'
import styles from './TrustResolutionOS.module.css'
import { claimAge, claimPriorityLabel, claimStatusLabel } from './claimPresentation'

export default function Angelcare360ClaimTicketsWorkspace({ tickets }: { tickets: Angelcare360ClaimTicketRecord[] }) {
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('all')
  const [status, setStatus] = useState('active')
  const [view, setView] = useState<'cards' | 'dense'>('cards')

  const filtered = useMemo(() => tickets.filter((ticket) => {
    const haystack = [ticket.reclamation_code, ticket.subject, ticket.description, ticket.category, ticket.requester_label, ticket.assigned_staff_label].join(' ').toLowerCase()
    const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase())
    const matchesPriority = priority === 'all' || ticket.priority === priority
    const matchesStatus = status === 'all' || (status === 'active' ? !['closed', 'archived'].includes(String(ticket.status)) : ticket.status === status)
    return matchesSearch && matchesPriority && matchesStatus
  }), [tickets, search, priority, status])

  return <section className={styles.workspacePanel}>
    <div className={styles.toolbar}>
      <input className={styles.searchField} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dossier, famille, sujet, catégorie…" aria-label="Rechercher les réclamations" />
      <select className={styles.selectField} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filtrer par priorité"><option value="all">Toutes priorités</option><option value="urgent">Urgente</option><option value="high">Élevée</option><option value="normal">Normale</option><option value="low">Faible</option></select>
      <select className={styles.selectField} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par état"><option value="active">Dossiers actifs</option><option value="all">Tous les états</option><option value="new">Signal reçu</option><option value="in_review">Compréhension</option><option value="assigned">Responsabilité engagée</option><option value="waiting_parent">Attente famille</option><option value="waiting_internal">Attente interne</option><option value="resolved">Résolus</option><option value="closed">Clos</option><option value="archived">Archivés</option></select>
      <div className={styles.viewSwitch} aria-label="Mode d’affichage"><button type="button" data-active={view === 'cards'} onClick={() => setView('cards')} aria-label="Vue cartes"><Grid2X2 size={14} /></button><button type="button" data-active={view === 'dense'} onClick={() => setView('dense')} aria-label="Vue dense"><Rows3 size={14} /></button></div>
    </div>
    {filtered.length ? <div className={styles.ticketGrid} style={view === 'dense' ? { gridTemplateColumns: '1fr' } : undefined}>
      {filtered.map((ticket) => <Link className={styles.ticketCard} key={ticket.id} href={`/angelcare-360-command-center/reclamations/tickets/${ticket.id}`} style={view === 'dense' ? { minHeight: 0, gridTemplateColumns: 'minmax(150px,.5fr) minmax(240px,1fr) minmax(260px,.8fr)', alignItems: 'center' } : undefined}>
        <div className={styles.ticketCardTop}><span className={styles.code}>{ticket.reclamation_code}</span><span className={styles.priorityPill} data-priority={ticket.priority}>{claimPriorityLabel(ticket.priority)}</span></div>
        <div><h3>{ticket.subject}</h3><p>{ticket.description}</p></div>
        <div className={styles.ticketMetaGrid}>
          <div className={styles.ticketMeta}><span>Étape</span><strong>{claimStatusLabel(ticket.status)}</strong></div>
          <div className={styles.ticketMeta}><span>Ancienneté</span><strong>{claimAge(ticket.created_at).label}</strong></div>
          <div className={styles.ticketMeta}><span>Responsable</span><strong>{ticket.assigned_staff_label || (ticket.assigned_staff_id ? ticket.assigned_staff_id : 'À attribuer')}</strong></div>
          <div className={styles.ticketMeta}><span>Catégorie</span><strong>{ticket.category || 'Non catégorisée'}</strong></div>
        </div>
      </Link>)}
    </div> : <div className={styles.emptyState}><div><div className={styles.emptyIcon}><CheckCircle2 /></div><h3>Aucun dossier dans cette vue</h3><p>Les filtres actuels ne retournent aucune situation. Les données réelles restent intactes ; modifiez les filtres pour élargir la lecture.</p></div></div>}
  </section>
}
