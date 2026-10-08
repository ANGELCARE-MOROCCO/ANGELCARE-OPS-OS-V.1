'use client'

import Link from 'next/link'
import {
  ArrowRight, BriefcaseBusiness, CircleCheckBig, Clock3, FileClock, Gauge, Inbox, Landmark,
  LockKeyhole, Radar, ShieldAlert, Sparkles, UserRoundCheck, UsersRound,
} from 'lucide-react'
import type { Angelcare360ClaimsOverviewRecord, Angelcare360ClaimTicketRecord } from '@/types/angelcare360/communications'
import styles from './TrustResolutionOS.module.css'
import {
  claimAge, claimPriorityLabel, claimStatusLabel, formatClaimDate, isClaimOpen, normalizeClaimHistory,
} from './claimPresentation'

const NAV = [
  { href: '/angelcare-360-command-center/reclamations', label: 'Observatoire', icon: Radar },
  { href: '/angelcare-360-command-center/reclamations/tickets', label: 'Dossiers', icon: Inbox },
  { href: '/angelcare-360-command-center/reclamations/priorites', label: 'Priorités', icon: ShieldAlert },
  { href: '/angelcare-360-command-center/reclamations/assignations', label: 'Responsabilités', icon: UserRoundCheck },
  { href: '/angelcare-360-command-center/reclamations/audit', label: 'Audit', icon: FileClock },
]

export type Angelcare360TrustResolutionSnapshot = {
  schoolName: string
  academicYearLabel: string
  generatedAt: string
  claims: Angelcare360ClaimsOverviewRecord
  claimTickets: Angelcare360ClaimTicketRecord[]
  sourceWarnings: string[]
}

function pressure(snapshot: Angelcare360TrustResolutionSnapshot) {
  if (snapshot.claims.urgentOpenTickets > 0) return { label: 'Intervention requise', tone: 'danger' as const }
  if (snapshot.claims.unassignedTickets > 0 || snapshot.claims.waitingInternalTickets > 0) return { label: 'Sous vigilance', tone: 'warning' as const }
  return { label: 'Maîtrisée', tone: 'success' as const }
}

function activeLane(status: string) {
  if (['new', 'in_review'].includes(status)) return 'intake'
  if (status === 'assigned') return 'ownership'
  if (['waiting_parent', 'waiting_internal'].includes(status)) return 'waiting'
  return 'recovery'
}

function latestPersistedEvents(tickets: Angelcare360ClaimTicketRecord[]) {
  return tickets.flatMap((ticket) => normalizeClaimHistory(ticket).map((event) => ({ ...event, ticket })))
    .filter((item) => item.at)
    .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
    .slice(0, 8)
}

export default function Angelcare360TrustResolutionCommand({ snapshot }: { snapshot: Angelcare360TrustResolutionSnapshot }) {
  const tickets = snapshot.claimTickets || []
  const active = tickets.filter(isClaimOpen)
  const p = pressure(snapshot)
  const lanes = [
    { key: 'intake', label: 'Signal & compréhension', tickets: active.filter((item) => activeLane(String(item.status)) === 'intake') },
    { key: 'ownership', label: 'Responsabilité engagée', tickets: active.filter((item) => activeLane(String(item.status)) === 'ownership') },
    { key: 'waiting', label: 'Attente & dépendances', tickets: active.filter((item) => activeLane(String(item.status)) === 'waiting') },
    { key: 'recovery', label: 'Résolution & vérification', tickets: active.filter((item) => activeLane(String(item.status)) === 'recovery') },
  ]
  const attention = active
    .filter((ticket) => ['urgent', 'high'].includes(String(ticket.priority)) || !ticket.assigned_staff_id || ['waiting_parent', 'waiting_internal'].includes(String(ticket.status)))
    .sort((a, b) => Number(b.priority === 'urgent') - Number(a.priority === 'urgent'))
    .slice(0, 3)
  const events = latestPersistedEvents(tickets)
  const maxSignal = Math.max(snapshot.claims.totalTickets, 1)
  const categoryCounts = Array.from(tickets.reduce((map, ticket) => {
    const key = ticket.category || 'Non catégorisée'
    map.set(key, (map.get(key) || 0) + 1)
    return map
  }, new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const institutionalMemory = tickets.filter((ticket) => ['resolved', 'closed'].includes(String(ticket.status)) && Boolean(ticket.resolution_summary)).slice(0, 6)

  return (
    <main className={styles.page}>
      <header className={styles.commandHeader}>
        <div>
          <div className={styles.kicker}>SANILA · TRUST RESOLUTION OS</div>
          <h1 className={styles.commandTitle}>Confiance & Résolution<span>Relation familles · Récupération de service · Qualité institutionnelle</span></h1>
          <p className={styles.commandLead}>Un environnement de commandement dédié aux situations qui mettent la relation famille sous tension : comprendre, responsabiliser, corriger, documenter et vérifier la résolution sans inventer de satisfaction ni de score de confiance.</p>
          <div className={styles.contextRail}>
            <span><Landmark />{snapshot.schoolName}</span>
            <span><BriefcaseBusiness />{snapshot.academicYearLabel}</span>
            <span><Clock3 />Actualisé {formatClaimDate(snapshot.generatedAt)}</span>
          </div>
        </div>

        <section className={styles.pressureInstrument} aria-label="Instrument de pression relationnelle">
          <div className={styles.instrumentTop}>
            <span>Pression opérationnelle documentée</span>
            <span className={styles.pressureState} data-tone={p.tone}><i />{p.label}</span>
          </div>
          <div className={styles.instrumentValue}>
            <strong>{active.length}</strong>
            <span>dossiers non archivés<br />dans le périmètre courant</span>
          </div>
          <div className={styles.instrumentBars}>
            <InstrumentBar label="Urgents ouverts" value={snapshot.claims.urgentOpenTickets} max={maxSignal} tone="danger" />
            <InstrumentBar label="Sans responsable" value={snapshot.claims.unassignedTickets} max={maxSignal} tone="warning" />
            <InstrumentBar label="Attente famille" value={snapshot.claims.waitingParentTickets} max={maxSignal} />
            <InstrumentBar label="Résolus" value={snapshot.claims.resolvedTickets} max={maxSignal} />
          </div>
        </section>
      </header>

      <nav className={styles.commandNav} aria-label="Navigation Trust Resolution">
        {NAV.map(({ href, label, icon: Icon }) => <Link key={href} className={styles.navLink} data-active={href.endsWith('/reclamations')} href={href}><Icon />{label}</Link>)}
      </nav>

      <section className={styles.observatory}>
        <section className={styles.situationField}>
          <div className={styles.panelHead}>
            <div><div className={styles.eyebrow}>LIVING SITUATION FIELD</div><h2>Champ des situations</h2><p>Une lecture spatiale fondée uniquement sur le statut, la priorité, l’assignation et l’ancienneté persistés. Aucun score comportemental n’est fabriqué.</p></div>
            <div className={styles.panelMeta}>{active.length} dossier(s) actifs</div>
          </div>
          <div className={styles.fieldGrid}>
            {lanes.map((lane) => (
              <div className={styles.fieldLane} key={lane.key}>
                <div className={styles.fieldLaneHead}><span>{lane.label}</span><b>{lane.tickets.length}</b></div>
                <div className={styles.fieldStack}>
                  {lane.tickets.slice(0, 8).map((ticket) => <SituationCard key={ticket.id} ticket={ticket} />)}
                  {!lane.tickets.length ? <div className={styles.truthLock}>Aucun dossier enregistré dans cette étape.</div> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.sideStack}>
          <section className={styles.recoveryStream}>
            <div className={styles.panelHead}><div><div className={styles.eyebrow}>RECOVERY STREAM</div><h2>Mouvement réel</h2><p>Dernières transitions réellement persistées dans les dossiers.</p></div></div>
            <div className={styles.streamList}>
              {events.length ? events.map((event) => (
                <div className={styles.streamEvent} key={`${event.ticket.id}-${event.id}`}>
                  <div className={styles.streamTime}>{formatClaimDate(event.at, false)}</div>
                  <div className={styles.streamBody}><strong>{event.title}</strong><p>{event.ticket.reclamation_code} · {event.ticket.subject}</p></div>
                </div>
              )) : <div className={styles.truthLock}>Aucun historique horodaté n’est encore disponible.</div>}
            </div>
          </section>

          <section className={styles.executiveBriefs}>
            <div className={styles.panelHead}><div><div className={styles.eyebrow}>ATTENTION NOW</div><h2>Interventions à regarder</h2><p>Priorité élevée, absence de responsable ou dépendance explicite.</p></div></div>
            <div className={styles.briefList}>
              {attention.length ? attention.map((ticket) => (
                <article className={styles.brief} data-priority={ticket.priority} key={ticket.id}>
                  <div className={styles.briefHead}><span>{claimPriorityLabel(ticket.priority)}</span><span>{claimAge(ticket.created_at).label}</span></div>
                  <h3>{ticket.subject}</h3>
                  <p>{ticket.assigned_staff_id ? claimStatusLabel(ticket.status) : 'Responsabilité à attribuer'} · {ticket.category || 'Catégorie non documentée'}</p>
                  <Link className={styles.textLink} href={`/angelcare-360-command-center/reclamations/tickets/${ticket.id}`}>Prendre le dossier <ArrowRight size={12} /></Link>
                </article>
              )) : <div className={styles.truthLock}><CircleCheckBig size={15} />Aucune situation à haut niveau d’attention selon les champs actuellement persistés.</div>}
            </div>
          </section>
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <section className={styles.lifecyclePanel}>
          <div className={styles.lifecycleHeader}><div><div className={styles.eyebrow}>RECOVERY PROTOCOL</div><h2>Cycle institutionnel</h2><p>La résolution est séparée de la fermeture : le système conserve la différence entre correction enregistrée et dossier clos.</p></div><Gauge size={22} color="#a8753d" /></div>
          <div className={styles.lifecycleFlow}>
            <LifeStage label="Signal reçu" value={snapshot.claims.newTickets} />
            <LifeStage label="Compréhension" value={active.filter((x) => x.status === 'in_review').length} />
            <LifeStage label="Responsable" value={snapshot.claims.assignedTickets} />
            <LifeStage label="Dépendances" value={snapshot.claims.waitingParentTickets + snapshot.claims.waitingInternalTickets} />
            <LifeStage label="Résolution" value={snapshot.claims.resolvedTickets} />
            <LifeStage label="Clos" value={snapshot.claims.closedTickets} />
          </div>
        </section>

        <section className={styles.qualityPanel}>
          <div className={styles.qualityHeader}><div><div className={styles.eyebrow}>INSTITUTIONAL TRUTH</div><h2>Qualité & intégrité</h2><p>Les limites réelles du produit restent visibles au lieu d’être maquillées en intelligence fictive.</p></div><Sparkles size={20} color="#a8753d" /></div>
          <div className={styles.qualityGrid}>
            <QualityItem label="Dossiers persistés" value={snapshot.claims.totalTickets} />
            <QualityItem label="Résolutions documentées" value={snapshot.claims.resolvedTickets + snapshot.claims.closedTickets} />
            <QualityItem label="Alertes source" value={snapshot.sourceWarnings.length} />
            <QualityItem label="Canal réclamations" value="Canonique" />
          </div>
          <div className={styles.truthLock}><LockKeyhole />Satisfaction, sentiment, churn et « trust score » restent volontairement non calculés tant qu’une autorité canonique ne les documente pas.</div>
        </section>
      </section>

      <section className={styles.memoryBand}>
        <section className={styles.constellationPanel}>
          <div className={styles.panelHead}><div><div className={styles.eyebrow}>QUALITY CONSTELLATION</div><h2>Constellation des frictions</h2><p>Répartition réelle des tickets par catégorie. Une concentration signale où regarder ; elle n’est jamais présentée comme une cause racine sans preuve.</p></div></div>
          <div className={styles.constellationBody}>{categoryCounts.length ? categoryCounts.map(([label, count]) => <div className={styles.constellationNode} key={label}><strong>{count}</strong><span>{label}</span></div>) : <div className={styles.truthLock}>Aucune catégorie persistée à analyser.</div>}</div>
        </section>
        <section className={styles.memoryPanel}>
          <div className={styles.panelHead}><div><div className={styles.eyebrow}>INSTITUTIONAL MEMORY</div><h2>Mémoire des résolutions</h2><p>Les conclusions réellement documentées restent consultables comme mémoire opérationnelle. SANILA n’invente ni cause racine ni efficacité corrective.</p></div></div>
          <div className={styles.memoryList}>{institutionalMemory.length ? institutionalMemory.map((ticket) => <Link className={styles.memoryCase} href={`/angelcare-360-command-center/reclamations/tickets/${ticket.id}`} key={ticket.id}><span>{ticket.reclamation_code}</span><div><strong>{ticket.subject}</strong><p>{ticket.resolution_summary}</p></div><span>{formatClaimDate(ticket.closed_at || ticket.resolved_at, false)}</span></Link>) : <div className={styles.truthLock}>Aucune résolution documentée n’est encore disponible dans le périmètre chargé.</div>}</div>
        </section>
      </section>
    </main>
  )
}

function InstrumentBar({ label, value, max, tone }: { label: string; value: number; max: number; tone?: string }) {
  const width = value ? Math.max(8, Math.min(100, (value / max) * 100)) : 0
  return <div className={styles.instrumentBar} data-tone={tone}><span>{label}</span><div className={styles.instrumentTrack}><i style={{ width: `${width}%` }} /></div><b>{value}</b></div>
}

function LifeStage({ label, value }: { label: string; value: number }) {
  return <div className={styles.lifeStage}><span>{label}</span><strong>{value}</strong></div>
}

function QualityItem({ label, value }: { label: string; value: number | string }) {
  return <div className={styles.qualityItem}><span>{label}</span><strong>{value}</strong></div>
}

function SituationCard({ ticket }: { ticket: Angelcare360ClaimTicketRecord }) {
  return (
    <Link className={styles.situationCard} data-priority={ticket.priority} href={`/angelcare-360-command-center/reclamations/tickets/${ticket.id}`}>
      <div className={styles.situationTop}><span className={styles.code}>{ticket.reclamation_code}</span><span className={styles.priorityPill} data-priority={ticket.priority}>{claimPriorityLabel(ticket.priority)}</span></div>
      <strong>{ticket.subject}</strong>
      <p>{ticket.description}</p>
      <div className={styles.situationMeta}><span>{claimStatusLabel(ticket.status)}</span><span>{claimAge(ticket.created_at).label}</span></div>
    </Link>
  )
}
