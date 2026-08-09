'use client'

type TrainingHubPartnerTone = 'green' | 'amber' | 'blue' | 'red' | 'slate' | 'violet'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

type PageKey = 'formations' | 'equipe' | 'certificats' | 'refresh' | 'documents' | 'facturation' | 'demandes' | 'profil'

type Props = {
  page: PageKey
}

type PortalSummary = {
  organization: any
  organization_id?: string
  stage: string
  next_action: string
  maturity: number
  open_invoice_minor: number
  memberships: any[]
  accounts: any[]
  subscriptions?: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits: any[]
  sessions: any[]
  participants: any[]
  certificates: any[]
  documents?: any[]
  resources?: any[]
  entitlements?: any[]
  sites?: any[]
  commercial_state?: any
  training_state?: any
  proof_state?: any
  warnings?: string[]
}

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function money(value: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((Number(value) || 0) / 100)} MAD`
}

function amount(row: any) {
  return Number(row?.grand_total_minor || row?.amount_due_minor || row?.balance_due_minor || row?.subtotal_minor || row?.total_minor || row?.amount_minor || 0) || 0
}

function numberValue(value: unknown) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function dateLabel(value: unknown) {
  if (!value) return 'Date à confirmer'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(String(value)))
  } catch {
    return clean(value)
  }
}

function statusLabel(value: unknown) {
  const status = normalize(value)
  if (status === 'active') return 'actif'
  if (status === 'inactive') return 'inactif'
  if (status === 'draft') return 'brouillon'
  if (status === 'sent') return 'envoyée'
  if (status === 'accepted') return 'acceptée'
  if (status === 'converted_to_order') return 'convertie'
  if (status === 'confirmed') return 'confirmée'
  if (status === 'issued') return 'émise'
  if (status === 'paid') return 'payée'
  if (status === 'available') return 'disponible'
  if (status === 'planned') return 'planifiée'
  if (status === 'scheduled') return 'planifiée'
  if (status === 'closed') return 'clôturée'
  if (status === 'open') return 'ouverte'
  if (status === 'pending') return 'en attente'
  if (status === 'published') return 'publié'
  return clean(value, 'à suivre').replace(/_/g, ' ')
}

function orgName(org: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Établissement partenaire')
}

function orgCity(org: any) {
  return clean(org?.city || org?.metadata?.partner?.city || org?.metadata?.city, 'Ville non renseignée')
}

function titleCase(value: unknown) {
  return clean(value, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Non défini'
}

const PAGE_COPY: Record<PageKey, { title: string; subtitle: string; eyebrow: string }> = {
  formations: { eyebrow: 'FORMATIONS', title: 'Vos formations activées', subtitle: 'Sessions, crédits, modules et prérequis pédagogiques réellement rattachés à votre compte.' },
  equipe: { eyebrow: 'ÉQUIPE', title: 'Collaborateurs & accès', subtitle: 'Accès portail, participants, rôles et collaborateurs suivis par AngelCare.' },
  certificats: { eyebrow: 'CERTIFICATS', title: 'Centre de preuves', subtitle: 'Certificats, présences, preuves publiées et éléments qualité disponibles.' },
  refresh: { eyebrow: 'REFRESH', title: 'Continuité & recyclage', subtitle: 'Refresh e-learning, renouvellement, crédits restants et recommandations annuelles.' },
  documents: { eyebrow: 'DOCUMENTS', title: 'Coffre documentaire', subtitle: 'Offres, commandes, factures, preuves, certificats, supports et kits publiés.' },
  facturation: { eyebrow: 'FACTURATION', title: 'Situation commerciale', subtitle: 'Compte partenaire, abonnement, offres, commandes, factures, crédits achetés et crédits utilisés.' },
  demandes: { eyebrow: 'DEMANDES', title: 'Demandes & support', subtitle: 'Demandes en cours, actions utiles et tickets transmis à l’équipe AngelCare.' },
  profil: { eyebrow: 'PROFIL', title: 'Profil établissement', subtitle: 'Identité de l’établissement, rattachements, accès portail et périmètre de synchronisation.' },
}

type DisplayRow = {
  id: string
  title: string
  meta: string
  detail: string
  amount?: string
  status?: string
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet'
}

function creditRemaining(row: any) {
  return numberValue(row.quantity_available ?? row.quantity_remaining ?? row.remaining_quantity ?? row.quantity_total)
}

function buildCommercialRows(data: PortalSummary | null): DisplayRow[] {
  if (!data) return []
  const rows: DisplayRow[] = []

  for (const account of data.accounts || []) {
    rows.push({
      id: `account-${account.id}`,
      title: clean(account.account_name || account.account_number, 'Compte partenaire'),
      meta: `Compte • ${statusLabel(account.status)}`,
      detail: `${clean(account.account_type, 'Compte TrainingHub')} • ${clean(account.currency || account.currency_code, 'MAD')}`,
      status: statusLabel(account.status),
      tone: 'blue',
    })
  }

  for (const subscription of data.subscriptions || []) {
    rows.push({
      id: `subscription-${subscription.id}`,
      title: clean(subscription.plan_name || subscription.subscription_number, 'Abonnement partenaire'),
      meta: `Abonnement • ${statusLabel(subscription.status)}`,
      detail: `${titleCase(subscription.billing_period || 'annual')} • ${clean(subscription.renewal_policy, 'renouvellement manuel')}`,
      amount: money(amount(subscription)),
      status: statusLabel(subscription.status),
      tone: 'green',
    })
  }

  for (const proposal of data.proposals || []) {
    rows.push({
      id: `proposal-${proposal.id}`,
      title: clean(proposal.proposal_number || proposal.title, 'Offre partenaire'),
      meta: `Offre • ${statusLabel(proposal.status)}`,
      detail: `Validité ${dateLabel(proposal.valid_until || proposal.created_at)}`,
      amount: money(amount(proposal)),
      status: statusLabel(proposal.status),
      tone: ['accepted', 'converted_to_order'].includes(normalize(proposal.status)) ? 'green' : 'amber',
    })
  }

  for (const order of data.orders || []) {
    rows.push({
      id: `order-${order.id}`,
      title: clean(order.order_number || order.title, 'Commande'),
      meta: `Commande • ${statusLabel(order.status)}`,
      detail: dateLabel(order.created_at || order.confirmed_at),
      amount: money(amount(order)),
      status: statusLabel(order.status),
      tone: 'violet',
    })
  }

  for (const invoice of data.invoices || []) {
    rows.push({
      id: `invoice-${invoice.id}`,
      title: clean(invoice.invoice_number || invoice.title, 'Facture'),
      meta: `Facture • ${statusLabel(invoice.status)}`,
      detail: `Émise ${dateLabel(invoice.issued_at || invoice.created_at)}`,
      amount: money(amount(invoice)),
      status: statusLabel(invoice.status),
      tone: ['paid', 'settled', 'closed'].includes(normalize(invoice.status)) ? 'green' : 'amber',
    })
  }

  for (const credit of data.credits || []) {
    rows.push({
      id: `credit-${credit.id}`,
      title: clean(credit.credit_type || credit.title, 'Crédits formation'),
      meta: `Crédits • ${statusLabel(credit.status)}`,
      detail: `${creditRemaining(credit)} restant(s) / ${numberValue(credit.quantity_total)} total`,
      amount: money(amount(credit)),
      status: statusLabel(credit.status),
      tone: creditRemaining(credit) > 0 ? 'green' : 'amber',
    })
  }

  if (!rows.length) {
    rows.push({
      id: 'commercial-empty-account',
      title: 'Compte commercial non initialisé',
      meta: 'Synchronisation réelle • Aucun compte trouvé',
      detail: 'Le portail est actif, mais aucun compte, abonnement, offre ou crédit n’est encore inscrit dans les tables de facturation.',
      status: 'à préparer',
      tone: 'amber',
    })
    rows.push({
      id: 'commercial-empty-action',
      title: 'Action AngelCare requise',
      meta: 'Production • Back-office',
      detail: 'Créer ou convertir l’offre depuis le dossier partenaire pour alimenter automatiquement facturation, crédits et formations.',
      status: 'à exécuter',
      tone: 'blue',
    })
  }

  return rows
}

function buildFormationRows(data: PortalSummary | null): DisplayRow[] {
  if (!data) return []
  const rows: DisplayRow[] = []

  for (const session of data.sessions || []) {
    rows.push({
      id: `session-${session.id}`,
      title: clean(session.session_code || session.title, 'Session formation'),
      meta: `${statusLabel(session.status)} • ${dateLabel(session.scheduled_start_at || session.created_at)}`,
      detail: `${numberValue(session.actual_participant_count || session.planned_participant_count)} participant(s) • ${clean(session.delivery_mode || session.mode, 'mode à confirmer')}`,
      status: statusLabel(session.status),
      tone: 'blue',
    })
  }

  for (const entitlement of data.entitlements || []) {
    rows.push({
      id: `entitlement-${entitlement.id}`,
      title: clean(entitlement.learn_modules?.title || entitlement.ent_definitions?.name || entitlement.title, 'Module activé'),
      meta: `Droit formation • ${statusLabel(entitlement.status)}`,
      detail: `Validité ${dateLabel(entitlement.valid_until || entitlement.unlocked_at || entitlement.created_at)}`,
      status: statusLabel(entitlement.status),
      tone: 'green',
    })
  }

  for (const credit of data.credits || []) {
    rows.push({
      id: `training-credit-${credit.id}`,
      title: clean(credit.credit_type, 'Crédits formation disponibles'),
      meta: `${creditRemaining(credit)} crédit(s) restant(s)`,
      detail: 'Ces crédits permettent de planifier une session ou un refresh selon votre offre.',
      status: statusLabel(credit.status),
      tone: creditRemaining(credit) > 0 ? 'green' : 'amber',
    })
  }

  if (!rows.length) {
    rows.push({
      id: 'training-empty-action',
      title: 'Aucune session encore planifiée',
      meta: 'Formation • à activer',
      detail: 'La formation apparaîtra ici dès qu’une offre ou un crédit formation sera validé par AngelCare.',
      status: 'à planifier',
      tone: 'amber',
    })
  }

  return rows
}

function buildTeamRows(data: PortalSummary | null): DisplayRow[] {
  if (!data) return []
  const rows: DisplayRow[] = []

  for (const participant of data.participants || []) {
    rows.push({
      id: `participant-${participant.id}`,
      title: clean(participant.full_name || participant.participant_name, 'Collaborateur'),
      meta: `${statusLabel(participant.attendance_status)} • ${statusLabel(participant.certificate_status)}`,
      detail: clean(participant.job_title || participant.email, 'Équipe partenaire'),
      status: statusLabel(participant.attendance_status || participant.status),
      tone: 'blue',
    })
  }

  for (const membership of data.memberships || []) {
    rows.push({
      id: `membership-${membership.id}`,
      title: clean(membership.full_name || membership.email || membership.role || membership.role_key, 'Accès partenaire'),
      meta: `Accès portail • ${statusLabel(membership.status)}`,
      detail: clean(membership.role || membership.role_key || membership.membership_type, 'partner_admin'),
      status: statusLabel(membership.status),
      tone: 'green',
    })
  }

  if (!rows.length) {
    rows.push({
      id: 'team-empty-action',
      title: 'Aucun participant inscrit',
      meta: 'Équipe • à compléter',
      detail: 'Ajoutez les collaborateurs concernés dans une session ou dans le dossier partenaire.',
      status: 'à compléter',
      tone: 'amber',
    })
  }

  return rows
}

function buildCertificateRows(data: PortalSummary | null): DisplayRow[] {
  if (!data) return []
  const rows: DisplayRow[] = (data.certificates || []).map((row) => ({
    id: `certificate-${row.id}`,
    title: clean(row.certificate_number || row.title, 'Certificat'),
    meta: `Certificat • ${statusLabel(row.status)}`,
    detail: dateLabel(row.issued_at || row.created_at),
    status: statusLabel(row.status),
    tone: 'green' as const,
  }))

  if (!rows.length) {
    rows.push({
      id: 'certificate-empty-action',
      title: 'Aucun certificat émis',
      meta: 'Preuves • post-formation',
      detail: 'Les certificats seront disponibles après validation des présences et clôture de session.',
      status: 'en attente',
      tone: 'amber',
    })
  }

  return rows
}

function buildDocumentRows(data: PortalSummary | null): DisplayRow[] {
  if (!data) return []
  const rows: DisplayRow[] = [
    ...(data.proposals || []).map((row) => ({ id: `doc-proposal-${row.id}`, title: clean(row.proposal_number || row.title, 'Offre partenaire'), meta: `Offre • ${statusLabel(row.status)}`, detail: dateLabel(row.created_at), tone: 'blue' as const })),
    ...(data.orders || []).map((row) => ({ id: `doc-order-${row.id}`, title: clean(row.order_number || row.title, 'Commande'), meta: `Commande • ${statusLabel(row.status)}`, detail: dateLabel(row.created_at), tone: 'violet' as const })),
    ...(data.invoices || []).map((row) => ({ id: `doc-invoice-${row.id}`, title: clean(row.invoice_number || row.title, 'Facture'), meta: `Facture • ${statusLabel(row.status)}`, detail: `${money(amount(row))} • ${dateLabel(row.issued_at || row.created_at)}`, tone: 'amber' as const })),
    ...(data.certificates || []).map((row) => ({ id: `doc-certificate-${row.id}`, title: clean(row.certificate_number || row.title, 'Certificat'), meta: `Certificat • ${statusLabel(row.status)}`, detail: dateLabel(row.issued_at || row.created_at), tone: 'green' as const })),
    ...((data.documents || []).map((row) => ({ id: `partner-document-${row.id}`, title: clean(row.title || row.document_type, 'Document partenaire'), meta: `Kit preuve • ${statusLabel(row.status)}`, detail: dateLabel(row.published_at || row.created_at), tone: 'blue' as const }))),
    ...((data.resources || []).map((row) => ({ id: `resource-${row.id}`, title: clean(row.resource_title || row.title, 'Ressource formation'), meta: `Support • ${statusLabel(row.status)}`, detail: clean(row.resource_type || row.visibility_scope, 'ressource'), tone: 'slate' as const }))),
  ]

  if (!rows.length) {
    rows.push({
      id: 'documents-empty-action',
      title: 'Coffre documentaire à alimenter',
      meta: 'Documents • à publier',
      detail: 'Les offres, factures, preuves et kits seront publiés ici dès leur création dans le dossier partenaire.',
      status: 'à publier',
      tone: 'amber',
    })
  }

  return rows
}

function buildRefreshRows(data: PortalSummary | null): DisplayRow[] {
  if (!data) return []
  const rows: DisplayRow[] = [
    ...((data.credits || []).map((credit) => ({
      id: `refresh-credit-${credit.id}`,
      title: clean(credit.credit_type, 'Crédits refresh / formation'),
      meta: `${creditRemaining(credit)} restant(s)`,
      detail: `${numberValue(credit.quantity_total)} crédit(s) total • ${statusLabel(credit.status)}`,
      status: statusLabel(credit.status),
      tone: creditRemaining(credit) > 0 ? 'green' as const : 'amber' as const,
    }))),
    ...((data.subscriptions || []).map((subscription) => ({
      id: `refresh-subscription-${subscription.id}`,
      title: clean(subscription.plan_name, 'Plan renouvelable'),
      meta: `Renouvellement • ${statusLabel(subscription.status)}`,
      detail: clean(subscription.renewal_policy, 'Revue manuelle avant échéance'),
      amount: money(amount(subscription)),
      status: statusLabel(subscription.status),
      tone: 'blue' as const,
    }))),
  ]

  rows.push({
    id: 'refresh-next-action',
    title: 'Prochaine action recommandée',
    meta: 'Continuité partenaire',
    detail: clean(data.next_action, 'Préparer le prochain cycle avec AngelCare.'),
    status: 'à suivre',
    tone: 'violet',
  })

  return rows
}

function buildRequestRows(requests: any[]): DisplayRow[] {
  if (!requests.length) {
    return [{
      id: 'request-empty-action',
      title: 'Aucune demande ouverte',
      meta: 'Support • disponible',
      detail: 'Vous pouvez demander une offre, un refresh, une correction de facture, un rendez-vous ou une assistance.',
      status: 'prêt',
      tone: 'blue',
    }]
  }

  return requests.map((row) => ({
    id: `request-${row.id}`,
    title: clean(row.title, 'Demande partenaire'),
    meta: `${statusLabel(row.status)} • ${clean(row.request_type, 'demande').replace(/_/g, ' ')}`,
    detail: clean(row.description, 'Suivi par AngelCare'),
    status: statusLabel(row.status),
    tone: normalize(row.priority) === 'high' ? 'amber' : 'blue',
  }))
}

function buildProfileRows(data: PortalSummary | null): DisplayRow[] {
  if (!data) return []
  const org = data.organization || {}

  return [
    {
      id: 'profile-identity',
      title: orgName(org),
      meta: `${orgCity(org)} • ${statusLabel(org.status)}`,
      detail: clean(org.organization_type || org.partner_type || org.segment, 'Établissement partenaire'),
      status: statusLabel(org.status),
      tone: 'blue',
    },
    {
      id: 'profile-plan',
      title: clean(data.commercial_state?.plan_name || org.plan_name, 'Plan TrainingHub'),
      meta: `Maturité ${data.maturity || 0}/100`,
      detail: clean(data.next_action, 'Action à préparer'),
      status: data.stage,
      tone: 'green',
    },
    {
      id: 'profile-access',
      title: 'Accès portail',
      meta: `${data.memberships?.length || 0} accès rattaché(s)`,
      detail: `${data.accounts?.length || 0} compte(s) billing • ${data.credits?.length || 0} wallet(s) crédits`,
      status: data.memberships?.length ? 'actif' : 'à compléter',
      tone: data.memberships?.length ? 'green' : 'amber',
    },
  ]
}

export default function TrainingHubPartnerSubPage({ page }: Props) {
  const [data, setData] = useState<PortalSummary | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setMessage(null)

      try {
        const [summaryResponse, requestsResponse] = await Promise.all([
          fetch('/api/traininghub/partner/business-summary', { cache: 'no-store' }),
          fetch('/api/traininghub/partner/requests', { cache: 'no-store' }),
        ])

        const summaryPayload = await summaryResponse.json().catch(() => ({}))
        const requestsPayload = await requestsResponse.json().catch(() => ({}))

        if (!summaryResponse.ok || summaryPayload?.ok === false) {
          setMessage(summaryPayload?.error || summaryPayload?.message || 'Portail indisponible.')
          return
        }

        if (!cancelled) {
          setData(summaryPayload.data)
          setRequests(Array.isArray(requestsPayload?.data) ? requestsPayload.data : [])
          const warnings = Array.isArray(summaryPayload.data?.warnings) ? summaryPayload.data.warnings : []
          setMessage(warnings.length ? `${warnings.length} table(s) non disponibles ou à migrer. Les éléments visibles restent synchronisés.` : null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const copy = PAGE_COPY[page]

  const rows = useMemo(() => {
    if (page === 'formations') return buildFormationRows(data)
    if (page === 'equipe') return buildTeamRows(data)
    if (page === 'certificats') return buildCertificateRows(data)
    if (page === 'refresh') return buildRefreshRows(data)
    if (page === 'documents') return buildDocumentRows(data)
    if (page === 'facturation') return buildCommercialRows(data)
    if (page === 'demandes') return buildRequestRows(requests)
    if (page === 'profil') return buildProfileRows(data)
    return []
  }, [data, page, requests])

  if (loading) {
    return (
      <main style={pageStyle}>
        <section style={panelStyle}>Chargement du périmètre partenaire synchronisé…</section>
      </main>
    )
  }

  if (!data) {
    return (
      <main style={pageStyle}>
        <section style={panelStyle}>{message || 'Portail indisponible.'}</section>
      </main>
    )
  }

  const org = data.organization || {}
  const commercial = data.commercial_state || {}
  const training = data.training_state || {}
  const proof = data.proof_state || {}

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/traininghub/partner" style={backStyle}>← Vue direction</Link>
        <strong>{orgName(org)}</strong>
        <span>{data.maturity || 0}/100</span>
      </header>

      {message ? <div style={warningStyle}>{message}</div> : null}

      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>{copy.eyebrow}</div>
          <h1 style={titleStyle}>{copy.title}</h1>
          <p style={leadStyle}>{copy.subtitle}</p>
        </div>
        <div style={identityStyle}>
          <span>Établissement</span>
          <strong>{orgName(org)}</strong>
          <small>{clean(data.next_action, 'Prochaine action à préparer')}</small>
        </div>
      </section>

      <section style={kpiGridStyle}>
        <Kpi label="Plan" value={clean(commercial.plan_name || org.plan_name, 'Activation')} tone="blue" />
        <Kpi label="Compte billing" value={commercial.account_ready ? 'Actif' : 'À créer'} tone={commercial.account_ready ? 'green' : 'amber'} />
        <Kpi label="Offres" value={`${data.proposals?.length || 0}`} tone={data.proposals?.length ? 'green' : 'amber'} />
        <Kpi label="Factures ouvertes" value={`${commercial.open_invoice_count || 0}`} tone={commercial.open_invoice_count ? 'amber' : 'green'} />
        <Kpi label="Crédits restants" value={`${commercial.available_credits || 0}`} tone={commercial.available_credits ? 'green' : 'amber'} />
        <Kpi label="Sessions" value={`${training.planned_sessions || 0}/${training.delivered_sessions || 0}`} tone={training.has_sessions ? 'blue' : 'amber'} />
        <Kpi label="Preuves" value={`${proof.document_count || 0}`} tone={proof.document_count ? 'green' : 'amber'} />
      </section>

      <nav style={navStyle}>
        {Object.entries(PAGE_COPY).map(([key, item]) => (
          <Link key={key} href={`/traininghub/partner/${key}`} style={key === page ? navActiveStyle : navLinkStyle}>{item.eyebrow}</Link>
        ))}
      </nav>

      <section style={recordGridStyle}>
        {rows.map((row) => (
          <RecordCard key={row.id} row={row} />
        ))}
      </section>
    </main>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: DisplayRow['tone'] }) {
  return (
    <article style={{ ...kpiStyle, borderColor: toneBorder(tone), background: toneSoft(tone) }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function RecordCard({ row }: { row: DisplayRow }) {
  return (
    <article style={{ ...recordStyle, borderColor: toneBorder(row.tone), background: toneCard(row.tone) }}>
      <div style={recordTopStyle}>
        <span style={{ ...pillStyle, background: tonePill(row.tone), color: toneText(row.tone) }}>{row.status || 'sync'}</span>
        {row.amount ? <strong style={amountStyle}>{row.amount}</strong> : null}
      </div>
      <strong style={recordTitleStyle}>{row.title}</strong>
      <span style={recordMetaStyle}>{row.meta}</span>
      <p style={recordDetailStyle}>{row.detail}</p>
    </article>
  )
}

function toneSoft(tone: DisplayRow['tone']) {
  if (tone === 'green') return '#ecfdf5'
  if (tone === 'amber') return '#fff7ed'
  if (tone === 'red') return '#fef2f2'
  if (tone === 'violet') return '#f5f3ff'
  if (tone === 'slate') return '#f8fafc'
  return '#eff6ff'
}

function toneCard(tone: DisplayRow['tone']) {
  if (tone === 'green') return 'linear-gradient(180deg,#ffffff,#f0fdf4)'
  if (tone === 'amber') return 'linear-gradient(180deg,#ffffff,#fff7ed)'
  if (tone === 'red') return 'linear-gradient(180deg,#ffffff,#fef2f2)'
  if (tone === 'violet') return 'linear-gradient(180deg,#ffffff,#f5f3ff)'
  if (tone === 'slate') return 'linear-gradient(180deg,#ffffff,#f8fafc)'
  return 'linear-gradient(180deg,#ffffff,#eff6ff)'
}

function toneBorder(tone: DisplayRow['tone']) {
  if (tone === 'green') return '#bbf7d0'
  if (tone === 'amber') return '#fed7aa'
  if (tone === 'red') return '#fecaca'
  if (tone === 'violet') return '#ddd6fe'
  if (tone === 'slate') return '#e2e8f0'
  return '#bfdbfe'
}

function tonePill(tone: DisplayRow['tone']) {
  if (tone === 'green') return '#dcfce7'
  if (tone === 'amber') return '#ffedd5'
  if (tone === 'red') return '#fee2e2'
  if (tone === 'violet') return '#ede9fe'
  if (tone === 'slate') return '#e2e8f0'
  return '#dbeafe'
}

function toneText(tone: DisplayRow['tone']) {
  if (tone === 'green') return '#047857'
  if (tone === 'amber') return '#c2410c'
  if (tone === 'red') return '#b91c1c'
  if (tone === 'violet') return '#6d28d9'
  if (tone === 'slate') return '#475569'
  return '#1d4ed8'
}

const pageStyle: CSSProperties = { minHeight: '100vh', background: 'radial-gradient(circle at 15% 5%,#e0f2fe 0,#f6f9ff 28%,#f8fbff 100%)', color: '#0f172a', padding: 18, display: 'grid', gap: 18, alignContent: 'start' }
const panelStyle: CSSProperties = { borderRadius: 28, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)', fontWeight: 900 }
const warningStyle: CSSProperties = { borderRadius: 22, padding: '12px 16px', background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontWeight: 900 }
const headerStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, borderRadius: 24, padding: '14px 18px', background: 'rgba(255,255,255,.9)', border: '1px solid #dbeafe', boxShadow: '0 14px 38px rgba(15,23,42,.05)' }
const backStyle: CSSProperties = { color: '#1d4ed8', textDecoration: 'none', fontWeight: 950 }
const heroStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 18, borderRadius: 34, padding: 28, background: 'linear-gradient(135deg,#fff,#eff6ff)', border: '1px solid #dbeafe', boxShadow: '0 24px 58px rgba(30,64,175,.10)' }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase' }
const titleStyle: CSSProperties = { margin: '7px 0', fontSize: 42, lineHeight: .98, letterSpacing: '-.06em', fontWeight: 950 }
const leadStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 800, lineHeight: 1.6 }
const identityStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)', boxShadow: '0 24px 58px rgba(37,99,235,.24)' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 10 }
const kpiStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 20, padding: 14, border: '1px solid', boxShadow: '0 14px 34px rgba(15,23,42,.04)' }
const navStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 9, borderRadius: 24, padding: 12, background: '#fff', border: '1px solid #e2e8f0' }
const navLinkStyle: CSSProperties = { borderRadius: 999, padding: '10px 12px', color: '#475569', textDecoration: 'none', fontWeight: 950 }
const navActiveStyle: CSSProperties = { ...navLinkStyle, color: '#1d4ed8', background: '#eff6ff', boxShadow: 'inset 0 0 0 1px #bfdbfe' }
const recordGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const recordStyle: CSSProperties = { display: 'grid', gap: 8, borderRadius: 24, padding: 18, border: '1px solid', boxShadow: '0 18px 44px rgba(15,23,42,.06)' }
const recordTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const recordTitleStyle: CSSProperties = { fontSize: 18, letterSpacing: '-.02em' }
const recordMetaStyle: CSSProperties = { color: '#475569', fontWeight: 900 }
const recordDetailStyle: CSSProperties = { margin: 0, color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const pillStyle: CSSProperties = { borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 950 }
const amountStyle: CSSProperties = { fontSize: 16, color: '#0f172a' }
