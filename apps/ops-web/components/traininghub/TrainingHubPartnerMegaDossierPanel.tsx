'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  sites: any[]
  courses: any[]
  proposals: any[]
  proposalItems: any[]
  orders: any[]
  invoices: any[]
  payments: any[]
  accounts: any[]
  subscriptions: any[]
  credits: any[]
  sessions: any[]
  participants: any[]
  certificates: any[]
  profiles: any[]
  memberships: any[]
  roleAssignments: any[]
  roles: any[]
}

type Tab = 'vue' | 'cycle' | 'services' | 'utilisateurs' | 'operations' | 'facturation' | 'actions'

const activeValues = new Set(['active', 'paid', 'confirmed', 'accepted', 'current', 'trial'])
const warningValues = new Set(['draft', 'pending', 'sent', 'viewed', 'negotiation'])
const dangerValues = new Set(['suspended', 'cancelled', 'expired', 'overdue', 'rejected', 'inactive'])

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(amountMinor?: number | null, currency = 'MAD') {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n(amountMinor) / 100)} ${currency || 'MAD'}`
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function dateLabel(value?: string | null) {
  if (!value) return 'Non défini'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function isPartner(org: any) {
  const type = normalize(org.organization_type)
  return type.includes('partner') || type.includes('school') || type.includes('creche') || type.includes('crèche') || type !== 'angelcare_internal'
}

function orgName(org?: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Partenaire non renseigné')
}

function statusLabel(value?: string | null) {
  const status = normalize(value)
  if (status === 'active') return 'Actif'
  if (status === 'trial') return 'Essai'
  if (status === 'current') return 'En cours'
  if (status === 'draft') return 'Brouillon'
  if (status === 'sent') return 'Envoyé'
  if (status === 'viewed') return 'Vu'
  if (status === 'negotiation') return 'Négociation'
  if (status === 'accepted') return 'Accepté'
  if (status === 'converted_to_order') return 'Converti'
  if (status === 'issued') return 'Émis'
  if (status === 'paid') return 'Payé'
  if (status === 'overdue') return 'En retard'
  if (status === 'suspended') return 'Suspendu'
  if (status === 'cancelled') return 'Annulé'
  return clean(value, 'À configurer').replace(/_/g, ' ')
}

function statusTone(value?: string | null) {
  const status = normalize(value)
  if (activeValues.has(status) || status === 'converted_to_order') return { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' }
  if (warningValues.has(status) || status === '') return { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' }
  if (dangerValues.has(status)) return { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' }
  return { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' }
}

function sum(rows: any[], selector: (row: any) => number) {
  return rows.reduce((total, row) => total + selector(row), 0)
}

function proposalAmount(proposal: any) {
  return n(proposal.grand_total_minor || proposal.subtotal_minor)
}

function orderAmount(order: any) {
  return n(order.grand_total_minor || order.subtotal_minor)
}

function invoiceDue(invoice: any) {
  return n(invoice.amount_due_minor ?? invoice.balance_due_minor ?? invoice.grand_total_minor)
}

function paymentAmount(payment: any) {
  return n(payment.amount_minor || payment.amount_paid_minor || payment.payment_amount_minor || payment.grand_total_minor)
}

function accountLabel(account?: any, subscription?: any) {
  if (subscription?.plan_name) return String(subscription.plan_name)
  if (subscription?.plan_code) return String(subscription.plan_code)
  if (subscription?.billing_interval) return `Plan ${subscription.billing_interval}`
  if (activeValues.has(normalize(subscription?.status || account?.status))) return 'Compte actif'
  if (account) return 'Compte à finaliser'
  return 'Compte à créer'
}

function initials(value?: string | null) {
  const text = clean(value, 'AC')
  return text.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC'
}

function partnerScore(row: any) {
  return Math.min(
    100,
    Math.round(
      (row.account ? 16 : 0) +
        (row.subscription ? 16 : 0) +
        Math.min(row.proposals.length, 4) * 7 +
        Math.min(row.orders.length, 4) * 8 +
        Math.min(row.sessions.length, 6) * 5 +
        Math.min(row.users.length, 5) * 5 +
        Math.min(row.certificates.length, 20) * 0.7,
    ),
  )
}

export default function TrainingHubPartnerMegaDossierPanel({
  organizations,
  sites,
  courses,
  proposals,
  proposalItems,
  orders,
  invoices,
  payments,
  accounts,
  subscriptions,
  credits,
  sessions,
  participants,
  certificates,
  profiles,
  memberships,
  roleAssignments,
  roles,
}: Props) {
  const partnerOrganizations = useMemo(() => organizations.filter(isPartner), [organizations])
  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles])
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])
  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])

  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(partnerOrganizations[0]?.id || null)
  const [tab, setTab] = useState<Tab>('vue')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    return partnerOrganizations.map((org) => {
      const account = accounts.find((item) => item.organization_id === org.id || item.org_id === org.id)
      const subscription = subscriptions.find((item) => item.organization_id === org.id || item.org_id === org.id || item.account_id === account?.id)
      const orgSites = sites.filter((site) => site.organization_id === org.id || site.org_id === org.id)
      const orgProposals = proposals.filter((proposal) => proposal.organization_id === org.id || proposal.org_id === org.id)
      const orgOrders = orders.filter((order) => order.organization_id === org.id || order.org_id === org.id || orgProposals.some((proposal) => proposal.id === order.proposal_id))
      const orgInvoices = invoices.filter((invoice) => invoice.organization_id === org.id || invoice.org_id === org.id || orgOrders.some((order) => order.id === invoice.order_id))
      const orgPayments = payments.filter((payment) => payment.organization_id === org.id || payment.org_id === org.id || orgInvoices.some((invoice) => invoice.id === payment.invoice_id))
      const orgCredits = credits.filter((credit) => credit.organization_id === org.id || credit.org_id === org.id)
      const orgSessions = sessions.filter((session) => session.organization_id === org.id || session.org_id === org.id)
      const orgParticipants = participants.filter((participant) => participant.organization_id === org.id || participant.org_id === org.id || orgSessions.some((session) => session.id === participant.session_id))
      const orgCertificates = certificates.filter((certificate) => certificate.organization_id === org.id || certificate.org_id === org.id || orgSessions.some((session) => session.id === certificate.session_id))
      const orgMemberships = memberships.filter((membership) => membership.organization_id === org.id || membership.org_id === org.id)
      const users = orgMemberships
        .map((membership) => {
          const profile = profileById.get(membership.user_id)
          const assignments = roleAssignments.filter((assignment) => assignment.user_id === membership.user_id && assignment.organization_id === org.id)
          const userRoles = assignments.map((assignment) => roleById.get(assignment.role_id)).filter(Boolean)
          return profile ? { membership, profile, roles: userRoles } : null
        })
        .filter(Boolean) as any[]

      const openInvoices = orgInvoices.filter((invoice) => !['paid', 'cancelled'].includes(normalize(invoice.status)))
      const latestProposal = orgProposals[0]
      const accountType = accountLabel(account, subscription)
      const stage = orgOrders.length
        ? 'client'
        : orgProposals.some((proposal) => ['accepted', 'sent', 'viewed', 'negotiation'].includes(normalize(proposal.status)))
          ? 'pipeline'
          : account || subscription
            ? 'account'
            : 'prospect'
      const city = clean(org.city || orgSites[0]?.city || orgSites[0]?.address_city, 'Ville non renseignée')
      const row = {
        org,
        account,
        subscription,
        sites: orgSites,
        proposals: orgProposals,
        orders: orgOrders,
        invoices: orgInvoices,
        payments: orgPayments,
        credits: orgCredits,
        sessions: orgSessions,
        participants: orgParticipants,
        certificates: orgCertificates,
        users,
        openInvoices,
        latestProposal,
        accountType,
        stage,
        city,
      }
      return { ...row, score: partnerScore(row) }
    })
  }, [partnerOrganizations, accounts, subscriptions, sites, proposals, orders, invoices, payments, credits, sessions, participants, certificates, memberships, profileById, roleAssignments, roleById])

  const cityOptions = useMemo<string[]>(() => Array.from(new Set(rows.map((row) => String(row.city || '')))).filter(Boolean).sort(), [rows])
  const filteredRows = useMemo(() => {
    const q = normalize(search)
    return rows
      .filter((row) => {
        const matchesSearch = !q || normalize(`${orgName(row.org)} ${row.city} ${row.accountType}`).includes(q)
        const matchesStage = stageFilter === 'all' || row.stage === stageFilter
        const matchesCity = cityFilter === 'all' || row.city === cityFilter
        return matchesSearch && matchesStage && matchesCity
      })
      .sort((a, b) => b.score - a.score || orgName(a.org).localeCompare(orgName(b.org)))
  }, [rows, search, stageFilter, cityFilter])

  const selected = rows.find((row) => row.org.id === selectedId) || filteredRows[0] || rows[0] || null
  const portfolioRevenue = sum(rows.flatMap((row) => row.orders), orderAmount)
  const openReceivables = sum(rows.flatMap((row) => row.openInvoices), invoiceDue)
  const activeAccounts = rows.filter((row) => row.account || row.subscription).length
  const strategicAccounts = rows.filter((row) => row.score >= 70).length

  async function dossierAction(action: string, organizationId: string) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/commercial/partner-dossier/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, organization_id: organizationId }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        setMessage(result?.error?.message || result?.message || 'Action dossier non finalisée.')
        return
      }
      setMessage('Action dossier enregistrée.')
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={sectionStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>MEGA DOSSIER PARTENAIRE</div>
          <h2 style={titleStyle}>Pilotage complet des comptes écoles</h2>
          <p style={textStyle}>
            Chaque partenaire possède un dossier unique qui regroupe cycle commercial, accès utilisateurs, services, delivery, facturation, crédits, opérations et prochaines actions.
          </p>
        </div>
        <div style={quickStatsStyle}>
          <Stat label="Dossiers" value={rows.length} />
          <Stat label="Comptes actifs" value={activeAccounts} />
          <Stat label="Stratégiques" value={strategicAccounts} />
          <Stat label="À encaisser" value={money(openReceivables)} />
        </div>
      </div>

      <div style={filterBarStyle}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher partenaire, ville, compte…" style={inputStyle} />
        <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} style={inputStyle}>
          <option value="all">Tous les cycles</option>
          <option value="prospect">Prospect</option>
          <option value="account">Compte créé</option>
          <option value="pipeline">Pipeline commercial</option>
          <option value="client">Client actif</option>
        </select>
        <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} style={inputStyle}>
          <option value="all">Toutes les villes</option>
          {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>

      <div style={layoutStyle}>
        <aside style={dossierListStyle}>
          {filteredRows.length ? filteredRows.map((row) => (
            <button
              key={row.org.id}
              type="button"
              onClick={() => { setSelectedId(row.org.id); setTab('vue') }}
              style={selected?.org.id === row.org.id ? dossierButtonActiveStyle : dossierButtonStyle}
            >
              <div style={avatarStyle}>{initials(orgName(row.org))}</div>
              <div>
                <strong>{orgName(row.org)}</strong>
                <span>{row.city} • {row.accountType}</span>
              </div>
              <b>{row.score}</b>
            </button>
          )) : <Empty text="Aucun dossier partenaire selon les filtres." />}
        </aside>

        <main style={dossierMainStyle}>
          {selected ? (
            <>
              <section style={heroStyle}>
                <div>
                  <div style={heroKickerStyle}>{selected.city} • {selected.accountType}</div>
                  <h3 style={heroTitleStyle}>{orgName(selected.org)}</h3>
                  <p style={heroTextStyle}>
                    Dossier vivant : {selected.proposals.length} proposition(s), {selected.orders.length} commande(s), {selected.sessions.length} session(s), {selected.users.length} utilisateur(s), {selected.certificates.length} certificat(s).
                  </p>
                </div>
                <div style={scoreBoxStyle}>
                  <span>Indice compte</span>
                  <strong>{selected.score}/100</strong>
                  <small>{selected.score >= 75 ? 'Compte stratégique' : selected.score >= 45 ? 'Compte à développer' : 'Compte à activer'}</small>
                </div>
              </section>

              <div style={tabsStyle}>
                {(['vue', 'cycle', 'services', 'utilisateurs', 'operations', 'facturation', 'actions'] as Tab[]).map((item) => (
                  <button key={item} type="button" onClick={() => setTab(item)} style={tab === item ? tabActiveStyle : tabStyle}>
                    {item === 'vue' && 'Vue'}
                    {item === 'cycle' && 'Cycle'}
                    {item === 'services' && 'Services'}
                    {item === 'utilisateurs' && 'Utilisateurs'}
                    {item === 'operations' && 'Opérations'}
                    {item === 'facturation' && 'Facturation'}
                    {item === 'actions' && 'Actions'}
                  </button>
                ))}
              </div>

              {tab === 'vue' ? <Overview row={selected} revenue={portfolioRevenue} /> : null}
              {tab === 'cycle' ? <Lifecycle row={selected} /> : null}
              {tab === 'services' ? <Services row={selected} courseById={courseById} /> : null}
              {tab === 'utilisateurs' ? <Users row={selected} /> : null}
              {tab === 'operations' ? <Operations row={selected} courseById={courseById} /> : null}
              {tab === 'facturation' ? <Billing row={selected} /> : null}
              {tab === 'actions' ? <Actions row={selected} busy={busy} dossierAction={dossierAction} /> : null}
            </>
          ) : <Empty text="Aucun partenaire disponible." />}
        </main>
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}
    </section>
  )
}

function Overview({ row, revenue }: { row: any; revenue: number }) {
  const open = sum(row.openInvoices, invoiceDue)
  const paid = sum(row.payments, paymentAmount)
  return (
    <div style={gridStyle}>
      <Info label="Cycle actuel" value={stageLabel(row.stage)} text="Position du compte dans la relation." />
      <Info label="Revenus commandés" value={money(sum(row.orders, orderAmount))} text={`Portefeuille global ${money(revenue)}`} />
      <Info label="À encaisser" value={money(open)} text="Factures ouvertes." />
      <Info label="Paiements reçus" value={money(paid)} text="Encaissements enregistrés." />
      <Info label="Équipe rattachée" value={row.users.length} text="Utilisateurs partenaires." />
      <Info label="Impact formation" value={row.participants.length} text={`${row.certificates.length} certificats.`} />
    </div>
  )
}

function Lifecycle({ row }: { row: any }) {
  const steps = [
    { label: 'Compte', done: Boolean(row.account || row.subscription), text: row.accountType },
    { label: 'Proposition', done: row.proposals.length > 0, text: `${row.proposals.length} offre(s)` },
    { label: 'Commande', done: row.orders.length > 0, text: `${row.orders.length} commande(s)` },
    { label: 'Facture', done: row.invoices.length > 0, text: `${row.invoices.length} facture(s)` },
    { label: 'Paiement', done: row.payments.length > 0, text: `${row.payments.length} paiement(s)` },
    { label: 'Delivery', done: row.sessions.length > 0, text: `${row.sessions.length} session(s)` },
    { label: 'Certificats', done: row.certificates.length > 0, text: `${row.certificates.length} preuve(s)` },
  ]
  return (
    <div style={railStyle}>
      {steps.map((step, index) => (
        <div key={step.label} style={step.done ? stepDoneStyle : stepTodoStyle}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{step.label}</strong>
          <small>{step.text}</small>
        </div>
      ))}
    </div>
  )
}

function Services({ row, courseById }: { row: any; courseById: Map<string, any> }) {
  const itemCourseIds = new Set<string>(row.proposals.flatMap((proposal: any) => proposal.items || []).map((item: any) => String(item.course_id || '')).filter(Boolean))
  const sessionCourseIds = new Set<string>(row.sessions.map((session: any) => String(session.course_id || '')).filter(Boolean))
  const allCourseIds = Array.from(new Set<string>([...Array.from(itemCourseIds), ...Array.from(sessionCourseIds)]))
  return (
    <div style={listStyle}>
      {allCourseIds.length ? allCourseIds.map((courseId) => {
        const course = courseById.get(courseId)
        const delivered = row.sessions.filter((session: any) => session.course_id === courseId).length
        return (
          <div key={courseId} style={listRowStyle}>
            <div>
              <strong>{course?.title || 'Formation AngelCare'}</strong>
              <span>{course?.ref || 'TRN'} • {delivered} session(s) liée(s)</span>
            </div>
            <b>{money(course?.onsite_entry_price_minor, course?.currency_code)}</b>
          </div>
        )
      }) : <Empty text="Aucun service formation encore lié à ce partenaire." />}
    </div>
  )
}

function Users({ row }: { row: any }) {
  return (
    <div style={cardGridStyle}>
      {row.users.length ? row.users.map((user: any) => {
        const tone = statusTone(user.profile.status || user.membership.status)
        return (
          <article key={user.profile.id} style={miniUserStyle}>
            <div style={miniAvatarStyle}>{initials(user.profile.full_name || user.profile.email)}</div>
            <strong>{user.profile.full_name || user.profile.email}</strong>
            <span>{user.profile.email}</span>
            <small>{user.roles.map((role: any) => role.code || role.name).join(' / ') || 'Rôle à confirmer'}</small>
            <em style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusLabel(user.profile.status || user.membership.status)}</em>
          </article>
        )
      }) : <Empty text="Aucun utilisateur partenaire rattaché. Utilisez la section Comptes utilisateurs partenaires pour créer un accès." />}
    </div>
  )
}

function Operations({ row, courseById }: { row: any; courseById: Map<string, any> }) {
  return (
    <div style={listStyle}>
      {row.sessions.length ? row.sessions.slice(0, 12).map((session: any) => {
        const tone = statusTone(session.status)
        const course = courseById.get(session.course_id)
        return (
          <div key={session.id} style={listRowStyle}>
            <div>
              <strong>{session.session_code || 'Session'}</strong>
              <span>{course?.title || 'Formation'} • {dateLabel(session.scheduled_start_at)} • {session.city || row.city}</span>
            </div>
            <em style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusLabel(session.status)}</em>
          </div>
        )
      }) : <Empty text="Aucune session opérationnelle encore planifiée pour ce partenaire." />}
    </div>
  )
}

function Billing({ row }: { row: any }) {
  return (
    <div style={listStyle}>
      {row.invoices.length ? row.invoices.slice(0, 12).map((invoice: any) => {
        const tone = statusTone(invoice.status)
        return (
          <div key={invoice.id} style={listRowStyle}>
            <div>
              <strong>{invoice.invoice_number || invoice.id}</strong>
              <span>Échéance {dateLabel(invoice.due_date)} • {money(invoiceDue(invoice), invoice.currency_code)}</span>
            </div>
            <em style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusLabel(invoice.status)}</em>
          </div>
        )
      }) : <Empty text="Aucune facture liée à ce partenaire." />}
    </div>
  )
}

function Actions({ row, busy, dossierAction }: { row: any; busy: boolean; dossierAction: (action: string, organizationId: string) => Promise<void> }) {
  return (
    <div style={actionsGridStyle}>
      <button type="button" disabled={busy} onClick={() => dossierAction('ensure_account', row.org.id)} style={primaryActionStyle}>Créer / activer compte</button>
      <button type="button" disabled={busy} onClick={() => dossierAction('open_followup', row.org.id)} style={secondaryActionStyle}>Marquer relance à faire</button>
      <button type="button" disabled={busy} onClick={() => dossierAction('upgrade_review', row.org.id)} style={secondaryActionStyle}>Ouvrir revue upgrade</button>
      <div style={actionNoteStyle}>
        Le dossier partenaire doit devenir la fiche source pour toutes les décisions : accès, ventes, opérations, facturation, services, relances et montée en gamme.
      </div>
    </div>
  )
}

function stageLabel(stage: string) {
  if (stage === 'client') return 'Client actif'
  if (stage === 'pipeline') return 'Pipeline commercial'
  if (stage === 'account') return 'Compte créé'
  return 'Prospect à activer'
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return <div style={statStyle}><strong>{value}</strong><span>{label}</span></div>
}

function Info({ label, value, text }: { label: string; value: ReactNode; text: string }) {
  return <div style={infoStyle}><span>{label}</span><strong>{value}</strong><small>{text}</small></div>
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const sectionStyle: CSSProperties = { borderRadius: 34, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 520px', gap: 18, alignItems: 'start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 28, lineHeight: 1.08, letterSpacing: '-.045em', fontWeight: 950 }
const textStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6, fontSize: 13, fontWeight: 700, maxWidth: 840 }
const quickStatsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const statStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, padding: 14, background: '#f8fbff', border: '1px solid #dbeafe' }
const filterBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 16 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const layoutStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '370px minmax(0,1fr)', gap: 16 }
const dossierListStyle: CSSProperties = { display: 'grid', gap: 9, alignContent: 'start', maxHeight: 760, overflow: 'auto', paddingRight: 4 }
const dossierButtonStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '44px minmax(0,1fr) 42px', gap: 10, alignItems: 'center', textAlign: 'left', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 20, padding: 12, cursor: 'pointer', color: '#0f172a' }
const dossierButtonActiveStyle: CSSProperties = { ...dossierButtonStyle, borderColor: '#93c5fd', background: '#eff6ff', boxShadow: '0 0 0 4px rgba(37,99,235,.10)' }
const avatarStyle: CSSProperties = { width: 44, height: 44, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#dbeafe', color: '#1d4ed8', fontWeight: 950 }
const dossierMainStyle: CSSProperties = { minWidth: 0 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 180px', gap: 18, borderRadius: 28, padding: 22, color: '#fff', background: 'radial-gradient(circle at top right, rgba(96,165,250,.30), transparent 38%), linear-gradient(135deg,#0b2348,#123c72 52%,#2557d6)', marginBottom: 14 }
const heroKickerStyle: CSSProperties = { color: 'rgba(255,255,255,.72)', fontSize: 12, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 9 }
const heroTitleStyle: CSSProperties = { margin: 0, fontSize: 36, lineHeight: 1, letterSpacing: '-.055em', fontWeight: 980 }
const heroTextStyle: CSSProperties = { margin: '12px 0 0', color: 'rgba(255,255,255,.78)', lineHeight: 1.65, fontWeight: 750 }
const scoreBoxStyle: CSSProperties = { display: 'grid', gap: 4, alignContent: 'center', justifyItems: 'center', borderRadius: 22, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)', padding: 16 }
const tabsStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', padding: 8, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14 }
const tabStyle: CSSProperties = { border: 0, borderRadius: 14, background: 'transparent', color: '#475569', padding: '10px 13px', fontWeight: 950, cursor: 'pointer' }
const tabActiveStyle: CSSProperties = { ...tabStyle, background: '#0f2a52', color: '#fff' }
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const infoStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 20, padding: 18, background: '#f8fbff', border: '1px solid #dbeafe' }
const railStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 10 }
const stepDoneStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 20, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857' }
const stepTodoStyle: CSSProperties = { ...stepDoneStyle, background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }
const listStyle: CSSProperties = { display: 'grid', gap: 10 }
const listRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderRadius: 18, padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }
const cardGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const miniUserStyle: CSSProperties = { display: 'grid', gap: 7, borderRadius: 20, padding: 16, background: '#f8fbff', border: '1px solid #dbeafe' }
const miniAvatarStyle: CSSProperties = { width: 46, height: 46, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950 }
const badgeStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap', fontStyle: 'normal' }
const actionsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const primaryActionStyle: CSSProperties = { border: 0, borderRadius: 18, padding: 16, color: '#fff', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', fontWeight: 950, cursor: 'pointer' }
const secondaryActionStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 18, padding: 16, color: '#1d4ed8', background: '#eff6ff', fontWeight: 950, cursor: 'pointer' }
const actionNoteStyle: CSSProperties = { gridColumn: '1 / -1', padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const messageStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const emptyStyle: CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', color: '#64748b', fontWeight: 800, border: '1px dashed #cbd5e1' }
