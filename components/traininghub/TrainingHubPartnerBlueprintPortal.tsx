'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type PortalSummary = {
  organization: any
  organization_id: string
  stage: string
  next_action: string
  maturity: number
  open_invoice_minor: number
  memberships: any[]
  accounts: any[]
  subscriptions: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits: any[]
  sessions: any[]
  participants: any[]
  certificates: any[]
  warnings?: string[]
}

type PartnerRequest = {
  id: string
  request_type?: string
  title?: string
  description?: string
  status?: string
  priority?: string
  created_at?: string
  updated_at?: string
}

type TabKey = 'direction' | 'formations' | 'equipe' | 'certificats' | 'refresh' | 'documents' | 'facturation' | 'demandes'

const TABS: Array<{ key: TabKey; label: string; icon: string; href: string }> = [
  { key: 'direction', label: 'Vue direction', icon: '⌁', href: '/traininghub/partner' },
  { key: 'formations', label: 'Formations', icon: '△', href: '/traininghub/partner/formations' },
  { key: 'equipe', label: 'Équipe', icon: '●', href: '/traininghub/partner/equipe' },
  { key: 'certificats', label: 'Certificats', icon: '✦', href: '/traininghub/partner/certificats' },
  { key: 'refresh', label: 'Refresh', icon: '↻', href: '/traininghub/partner/refresh' },
  { key: 'documents', label: 'Documents', icon: '▣', href: '/traininghub/partner/documents' },
  { key: 'facturation', label: 'Facturation', icon: '◌', href: '/traininghub/partner/facturation' },
  { key: 'demandes', label: 'Demandes', icon: '→', href: '/traininghub/partner/demandes' },
]

const JOURNEY = [
  { label: 'Offre', icon: '01' },
  { label: 'Commande', icon: '02' },
  { label: 'Facture', icon: '03' },
  { label: 'Crédits', icon: '04' },
  { label: 'Session', icon: '05' },
  { label: 'Présence', icon: '06' },
  { label: 'Certificats', icon: '07' },
  { label: 'Refresh', icon: '08' },
  { label: 'Renouvellement', icon: '09' },
]

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

function amountMinor(row: any) {
  return Number(row?.grand_total_minor || row?.amount_due_minor || row?.balance_due_minor || row?.subtotal_minor || 0) || 0
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
  if (status === 'present') return 'présent'
  if (status === 'resolved') return 'résolue'
  if (status === 'open') return 'ouverte'
  return clean(value, 'à suivre').replace(/_/g, ' ')
}

function organizationName(org: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Établissement partenaire')
}

function maturityLabel(score: number) {
  if (score >= 85) return 'Excellence visible'
  if (score >= 60) return 'Progression solide'
  if (score >= 30) return 'Montée en gamme'
  return 'Activation en cours'
}

function isPaid(invoice: any) {
  return ['paid', 'settled', 'closed', 'cancelled'].includes(normalize(invoice?.status))
}

function buildDocuments(data: PortalSummary | null) {
  if (!data) return []
  return [
    ...data.proposals.map((row) => ({
      id: row.id,
      type: 'Offre',
      title: clean(row.proposal_number || row.title, 'Offre partenaire'),
      status: statusLabel(row.status),
      date: dateLabel(row.created_at),
    })),
    ...data.orders.map((row) => ({
      id: row.id,
      type: 'Commande',
      title: clean(row.order_number || row.title, 'Commande'),
      status: statusLabel(row.status),
      date: dateLabel(row.created_at),
    })),
    ...data.invoices.map((row) => ({
      id: row.id,
      type: 'Facture',
      title: clean(row.invoice_number || row.title, 'Facture'),
      status: statusLabel(row.status),
      date: dateLabel(row.issued_at || row.created_at),
    })),
    ...data.certificates.map((row) => ({
      id: row.id,
      type: 'Certificat',
      title: clean(row.certificate_number || row.title, 'Certificat'),
      status: statusLabel(row.status),
      date: dateLabel(row.issued_at || row.created_at),
    })),
  ]
}

function nextAttention(data: PortalSummary | null, requests: PartnerRequest[]) {
  if (!data) return []

  const items: Array<{ title: string; text: string; action: string; type: string; tone: 'amber' | 'blue' | 'green' }> = []
  const openInvoices = data.invoices.filter((invoice) => !isPaid(invoice))

  if (!data.proposals.length) {
    items.push({
      title: 'Première offre à préparer',
      text: 'Votre référent AngelCare peut structurer une proposition adaptée à votre établissement.',
      action: 'Demander une offre',
      type: 'formation_request',
      tone: 'amber',
    })
  }
  if (data.proposals.some((proposal) => ['sent', 'draft'].includes(normalize(proposal.status)))) {
    items.push({
      title: 'Offre à arbitrer',
      text: 'Une offre est prête ou en cours. Vous pouvez demander une clarification commerciale.',
      action: 'Clarifier l’offre',
      type: 'billing_question',
      tone: 'blue',
    })
  }
  if (openInvoices.length) {
    items.push({
      title: 'Facturation à suivre',
      text: `${openInvoices.length} facture(s) demandent un suivi ou une confirmation.`,
      action: 'Voir facturation',
      type: 'billing_question',
      tone: 'amber',
    })
  }
  if (data.credits.length && !data.sessions.length) {
    items.push({
      title: 'Session à planifier',
      text: 'Des crédits sont disponibles. Le prochain créneau peut être réservé.',
      action: 'Planifier une session',
      type: 'session_planning',
      tone: 'blue',
    })
  }
  if (data.certificates.length) {
    items.push({
      title: 'Refresh recommandé',
      text: 'Préparez le prochain cycle de consolidation et de montée en compétence.',
      action: 'Demander un refresh',
      type: 'refresh_request',
      tone: 'green',
    })
  }
  if (requests.some((request) => ['open', 'in_progress', 'pending'].includes(normalize(request.status)))) {
    items.push({
      title: 'Demande en traitement',
      text: 'Une demande partenaire est déjà suivie par AngelCare.',
      action: 'Voir demandes',
      type: 'support_issue',
      tone: 'blue',
    })
  }

  return items.slice(0, 4)
}

export default function TrainingHubPartnerBlueprintPortal() {
  const [data, setData] = useState<PortalSummary | null>(null)
  const [requests, setRequests] = useState<PartnerRequest[]>([])
  const [tab, setTab] = useState<TabKey>('direction')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestType, setRequestType] = useState('formation_request')
  const [requestTitle, setRequestTitle] = useState('')
  const [requestDescription, setRequestDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
        setMessage(summaryPayload?.error?.message || summaryPayload?.message || 'Votre espace partenaire est en préparation.')
        return
      }

      setData(summaryPayload.data)
      setRequests(Array.isArray(requestsPayload?.data) ? requestsPayload.data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const org = data?.organization || {}
  const orgTitle = organizationName(org)
  const orgCity = clean(org?.city || org?.primary_city || org?.site_city, 'Rabat')
  const score = Number(data?.maturity || 0)
  const offerCount = data?.proposals.length || 0
  const sessionCount = data?.sessions.length || 0
  const teamCount = data?.participants.length || data?.memberships.length || 0
  const certificateCount = data?.certificates.length || 0
  const creditsCount = data?.credits.length || 0
  const openInvoices = data?.invoices.filter((invoice) => !isPaid(invoice)) || []
  const activeRequests = requests.filter((request) => ['open', 'in_progress', 'pending'].includes(normalize(request.status)))
  const docs = useMemo(() => buildDocuments(data), [data])
  const attention = useMemo(() => nextAttention(data, requests), [data, requests])
  const nextSession = useMemo(() => {
    return [...(data?.sessions || [])].sort((a, b) =>
      String(a.scheduled_start_at || a.created_at || '').localeCompare(String(b.scheduled_start_at || b.created_at || '')),
    )[0]
  }, [data?.sessions])

  function openRequest(type: string, title: string) {
    setRequestType(type)
    setRequestTitle(title)
    setRequestDescription('')
    setRequestOpen(true)
  }

  async function submitRequest() {
    setBusy(true)
    setMessage(null)

    try {
      const response = await fetch('/api/traininghub/partner/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_type: requestType, title: requestTitle, description: requestDescription, priority: 'normal' }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error?.message || payload?.message || 'Demande non envoyée.')
        return
      }

      setRequestOpen(false)
      await load()
      setMessage('Demande transmise avec succès à AngelCare.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main style={appBackgroundStyle}>
        <div style={pageCanvasStyle}>
          <Header />
          <section style={loadingCardStyle}>Chargement sécurisé du portail partenaire…</section>
        </div>
      </main>
    )
  }

  return (
    <main style={appBackgroundStyle}>
      <div style={pageCanvasStyle}>
        <Header />

        {message ? <div style={infoBannerStyle}>{message}</div> : null}

        <section style={heroShellStyle}>
          <div style={heroOrnamentStyle} />
          <div style={heroCopyStyle}>
            <div style={eyebrowStyle}>ANGELCARE • PARTNER EXPERIENCE</div>
            <h1 style={heroTitleStyle}>Votre montée en gamme devient visible.</h1>
            <p style={heroLeadStyle}>
              Suivez vos formations, vos équipes, vos refresh, vos certificats et vos preuves de progression dans un portail premium conçu pour la direction.
            </p>

            <div style={heroActionRowStyle}>
              <Button tone="primary" onClick={() => setTab('formations')} icon="△">Voir mes formations</Button>
              <Button tone="mint" onClick={() => setTab('refresh')} icon="↻">Ouvrir le refresh</Button>
              <Button tone="light" onClick={() => setTab('certificats')} icon="✦">Preuves & kits</Button>
              <Button tone="light" onClick={() => openRequest('support_issue', 'Nouvelle demande partenaire')} icon="→">Demander une action</Button>
            </div>

            <div style={heroProofGridStyle}>
              <HeroProof icon="01" label="Lecture direction" text="une seule vue claire" />
              <HeroProof icon="02" label="Preuves visibles" text="certificats et kits" />
              <HeroProof icon="03" label="Suivi continu" text="refresh et demandes" />
            </div>
          </div>

          <aside style={identityCardStyle}>
            <div style={identityGlowStyle} />
            <div style={identityTopRowStyle}>
              <div style={avatarStyle}>{orgTitle.slice(0, 1).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={identityKickerStyle}>ÉTABLISSEMENT PARTENAIRE</div>
                <h2 style={identityTitleStyle}>{orgTitle}</h2>
                <p style={identityMetaStyle}>{orgCity} • {statusLabel(org?.status || data?.stage || 'active')}</p>
              </div>
              <button type="button" style={identityToggleStyle} onClick={() => setDetailsOpen((value) => !value)}>
                {detailsOpen ? 'Réduire' : 'Détails'}
              </button>
            </div>

            <div style={identityStatsStyle}>
              <IdentityStat label="Indice" value={`${score}/100`} note={maturityLabel(score)} />
              <IdentityStat label="Formations" value={sessionCount} note="sessions suivies" />
              <IdentityStat label="Équipe" value={teamCount} note="collaborateurs" />
              <IdentityStat label="Certificats" value={certificateCount} note="preuves" />
            </div>

            <div style={identityProgressTrackStyle}>
              <div style={{ ...identityProgressFillStyle, width: `${Math.max(7, Math.min(100, score))}%` }} />
            </div>

            {detailsOpen ? (
              <div style={identityDetailsStyle}>
                <InfoPill label="Compte" value={data?.accounts.length ? 'Ouvert' : 'En préparation'} />
                <InfoPill label="Offres" value={offerCount} />
                <InfoPill label="Factures" value={openInvoices.length} />
                <InfoPill label="Crédits" value={creditsCount} />
                <InfoPill label="Demandes" value={activeRequests.length} />
                <InfoPill label="Référent" value={clean(org?.manager_name || org?.owner_name, 'AngelCare')} />
              </div>
            ) : null}
          </aside>
        </section>

        <section style={executiveRailStyle}>
          <ExecutiveMetric icon="◆" title="Progression qualité" value={`${score}/100`} subtitle={maturityLabel(score)} />
          <ExecutiveMetric icon="△" title="Formations activées" value={sessionCount} subtitle="sessions planifiées / livrées" />
          <ExecutiveMetric icon="●" title="Collaborateurs suivis" value={teamCount} subtitle="équipe partenaire" />
          <ExecutiveMetric icon="✦" title="Certificats délivrés" value={certificateCount} subtitle="preuves disponibles" />
          <ExecutiveMetric icon="◈" title="Crédits disponibles" value={creditsCount} subtitle="activation formation" />
          <ExecutiveMetric icon="◌" title="À suivre" value={money(data?.open_invoice_minor || 0)} subtitle="facturation" />
        </section>

        <section style={journeyStyle}>
          {JOURNEY.map((step) => {
            const active =
              (step.label === 'Offre' && Boolean(offerCount)) ||
              (step.label === 'Commande' && Boolean(data?.orders.length)) ||
              (step.label === 'Facture' && Boolean(data?.invoices.length)) ||
              (step.label === 'Crédits' && Boolean(creditsCount)) ||
              (step.label === 'Session' && Boolean(sessionCount)) ||
              (step.label === 'Présence' && Boolean(data?.participants.length)) ||
              (step.label === 'Certificats' && Boolean(certificateCount)) ||
              (step.label === 'Refresh' && Boolean(certificateCount || creditsCount)) ||
              (step.label === 'Renouvellement' && Boolean(data?.subscriptions.length || certificateCount))
            return <JourneyStep key={step.label} label={step.label} index={step.icon} active={active} />
          })}
        </section>

        <section style={attentionSectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>CE QUI DEMANDE VOTRE ATTENTION</div>
              <h3 style={sectionTitleStyle}>Actions utiles maintenant</h3>
              <p style={sectionLeadStyle}>Une zone claire pour savoir quoi faire ensuite, sans chercher dans plusieurs menus.</p>
            </div>
            <Button tone="light" onClick={() => openRequest('support_issue', 'Nouvelle demande partenaire')} icon="→">Nouvelle demande</Button>
          </div>

          <div style={attentionGridStyle}>
            {(attention.length ? attention : [{ title: 'Portail prêt', text: 'Aucune urgence visible. Vous pouvez créer une demande à tout moment.', action: 'Créer une demande', type: 'support_issue', tone: 'blue' as const }]).map((item, index) => (
              <article key={`${item.title}-${index}`} style={{ ...attentionCardStyle, ...(item.tone === 'green' ? attentionCardGreenStyle : item.tone === 'blue' ? attentionCardBlueStyle : null) }}>
                <div style={attentionCardTopStyle}>
                  <span style={attentionIndexStyle}>{String(index + 1).padStart(2, '0')}</span>
                  <span style={attentionStatusStyle}>{item.tone === 'amber' ? 'À traiter' : item.tone === 'green' ? 'Opportunité' : 'Suivi'}</span>
                </div>
                <strong style={attentionTitleStyle}>{item.title}</strong>
                <p style={attentionTextStyle}>{item.text}</p>
                <button type="button" style={attentionButtonStyle} onClick={() => openRequest(item.type, item.action)}>
                  {item.action}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section style={workspaceStyle}>
          <div style={tabsStyle}>
            {TABS.map((item) => (
              <button key={item.key} type="button" style={tab === item.key ? activeTabStyle : tabStyle} onClick={() => setTab(item.key)}>
                <span style={tabIconStyle}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'direction' ? (
            <ContentGrid>
              <FeatureCard
                icon="◌"
                title="Situation commerciale"
                kicker={openInvoices.length ? `${openInvoices.length} facture(s) à suivre` : 'Aucune alerte ouverte'}
                rows={[
                  `Dernière facture: ${openInvoices[0] ? clean(openInvoices[0].invoice_number || openInvoices[0].title, 'Facture') : 'Aucune facture ouverte'}`,
                  `Montant à suivre: ${money(data?.open_invoice_minor || 0)}`,
                  `Compte partenaire: ${data?.accounts.length ? 'actif' : 'en préparation'}`,
                ]}
              />
              <FeatureCard
                icon="△"
                title="Formation à venir"
                kicker={nextSession ? 'Planifiée' : 'À planifier'}
                rows={[
                  `Session: ${nextSession ? clean(nextSession.session_code || nextSession.title, 'Session') : 'Aucune session planifiée'}`,
                  `Date: ${nextSession ? dateLabel(nextSession.scheduled_start_at || nextSession.created_at) : 'À confirmer'}`,
                  `Participants: ${data?.participants.length || 0} inscrit(s)`,
                ]}
              />
              <FeatureCard
                icon="✦"
                title="Preuves disponibles"
                kicker={`${certificateCount} certificat(s)`}
                rows={[
                  `Dernier certificat: ${data?.certificates[0] ? clean(data.certificates[0].certificate_number || data.certificates[0].title, 'Certificat') : 'Aucun certificat émis'}`,
                  `Statut: ${data?.certificates[0] ? statusLabel(data.certificates[0].status) : 'À venir'}`,
                  'Publication après validation des présences',
                ]}
              />
            </ContentGrid>
          ) : null}

          {tab === 'formations' ? (
            <ContentGrid>
              <FeatureCard icon="△" title="Offres" kicker={`${offerCount} au total`} rows={(data?.proposals || []).slice(0, 4).map((proposal) => `${clean(proposal.proposal_number || proposal.title, 'Offre')} • ${statusLabel(proposal.status)}`)} empty="Aucune offre active pour le moment." />
              <FeatureCard icon="◈" title="Commandes" kicker={`${data?.orders.length || 0} au total`} rows={(data?.orders || []).slice(0, 4).map((order) => `${clean(order.order_number || order.title, 'Commande')} • ${statusLabel(order.status)}`)} empty="Aucune commande confirmée." />
              <FeatureCard icon="⌁" title="Sessions" kicker={`${sessionCount} planifiée(s)`} rows={(data?.sessions || []).slice(0, 4).map((session) => `${clean(session.session_code || session.title, 'Session')} • ${dateLabel(session.scheduled_start_at || session.created_at)}`)} empty="Aucune session planifiée." />
            </ContentGrid>
          ) : null}

          {tab === 'equipe' ? (
            <ContentGrid>
              <FeatureCard icon="●" title="Équipe suivie" kicker={`${teamCount} profil(s)`} rows={(data?.participants || data?.memberships || []).slice(0, 5).map((participant) => clean(participant.full_name || participant.display_name || participant.member_name, 'Collaborateur partenaire'))} empty="Aucun participant rattaché pour l’instant." />
              <FeatureCard icon="↻" title="Refresh e-learning" kicker={creditsCount ? 'Disponible' : 'À ouvrir'} rows={[`Crédits: ${creditsCount}`, 'Consolidez les acquis avec AngelCare.', 'Planifiez le prochain cycle de recyclage.']} />
              <FeatureCard icon="→" title="Assistance" kicker="Coordination" rows={['Ajout de comptes équipe', 'Correction des présences', 'Préparation de nouvelles cohortes']} />
            </ContentGrid>
          ) : null}

          {tab === 'certificats' ? (
            <ContentGrid>
              <FeatureCard icon="✦" title="Certificats" kicker={`${certificateCount} émis`} rows={(data?.certificates || []).slice(0, 5).map((certificate) => `${clean(certificate.certificate_number || certificate.title, 'Certificat')} • ${statusLabel(certificate.status)}`)} empty="Aucun certificat émis pour l’instant." />
              <FeatureCard icon="▣" title="Documents & preuves" kicker={`${docs.length} document(s)`} rows={docs.slice(0, 5).map((doc) => `${doc.type} • ${doc.title}`)} empty="Aucune preuve disponible." />
              <FeatureCard icon="◆" title="Traçabilité" kicker="Premium" rows={['Preuves structurées pour la direction', 'Lisibilité des parcours formés', 'Support aux audits internes et parents']} />
            </ContentGrid>
          ) : null}

          {tab === 'refresh' ? (
            <ContentGrid>
              <FeatureCard icon="↻" title="Cycle refresh" kicker={creditsCount ? 'Possible' : 'À préparer'} rows={['Préparer une reconduction ou un recyclage', 'Ajuster le périmètre de l’équipe', 'Demander un accompagnement sur mesure']} />
              <FeatureCard icon="◈" title="Crédits" kicker={`${creditsCount} disponible(s)`} rows={(data?.credits || []).slice(0, 4).map((credit) => `${statusLabel(credit.status)} • ${clean(credit.credit_type || credit.source_type, 'crédit formation')}`)} empty="Aucun crédit disponible." />
              <FeatureCard icon="◆" title="Renouvellement" kicker="Anticipation" rows={['Préparer la prochaine phase annuelle', 'Ouvrir un nouveau plan de formation', 'Sécuriser la continuité des standards']} />
            </ContentGrid>
          ) : null}

          {tab === 'documents' ? (
            <ContentGrid>
              <FeatureCard icon="▣" title="Bibliothèque partenaire" kicker={`${docs.length} élément(s)`} rows={docs.slice(0, 7).map((doc) => `${doc.type} • ${doc.title} • ${doc.date}`)} empty="Aucun document visible pour l’instant." />
              <FeatureCard icon="◌" title="Factures & offres" kicker="Raccourci" rows={['Retrouver les dernières offres', 'Retrouver les dernières factures', 'Centraliser les preuves de collaboration']} />
              <FeatureCard icon="✦" title="Pièces complémentaires" kicker="Sur demande" rows={['Demandes d’attestations', 'Documents administratifs', 'Kits et supports remis']} />
            </ContentGrid>
          ) : null}

          {tab === 'facturation' ? (
            <ContentGrid>
              <FeatureCard icon="◌" title="Compte partenaire" kicker={data?.accounts.length ? 'Ouvert' : 'En préparation'} rows={['Vue des offres converties', `Montant à suivre: ${money(data?.open_invoice_minor || 0)}`, `Factures ouvertes: ${openInvoices.length}`]} />
              <FeatureCard icon="▣" title="Factures" kicker={`${data?.invoices.length || 0} total`} rows={(data?.invoices || []).slice(0, 5).map((invoice) => `${clean(invoice.invoice_number || invoice.title, 'Facture')} • ${money(amountMinor(invoice))} • ${statusLabel(invoice.status)}`)} empty="Aucune facture disponible." />
              <FeatureCard icon="→" title="Aide commerciale" kicker="Support" rows={['Question sur une offre', 'Clarification de périmètre', 'Demande de rendez-vous commercial']} />
            </ContentGrid>
          ) : null}

          {tab === 'demandes' ? (
            <ContentGrid>
              <FeatureCard icon="→" title="Demandes ouvertes" kicker={`${activeRequests.length} en cours`} rows={activeRequests.slice(0, 5).map((request) => `${clean(request.title, 'Demande partenaire')} • ${statusLabel(request.status)} • ${dateLabel(request.created_at)}`)} empty="Aucune demande ouverte." />
              <FeatureCard icon="⌁" title="Historique récent" kicker={`${requests.length} total`} rows={requests.slice(0, 5).map((request) => `${clean(request.title, 'Demande')} • ${statusLabel(request.status)}`)} empty="Aucune demande enregistrée." />
              <FeatureCard icon="✉" title="Créer une demande" kicker="Action" rows={['Demande formation', 'Session / planning', 'Support facture', 'Refresh / renouvellement']} action={<Button tone="primary" icon="→" onClick={() => openRequest('support_issue', 'Nouvelle demande partenaire')}>Nouvelle demande</Button>} />
            </ContentGrid>
          ) : null}

          <div style={supportBannerStyle}>
            <strong>Besoin d’une action ?</strong>
            <span>Demandez une formation, un refresh, une correction, un rendez-vous ou une assistance depuis ce portail.</span>
          </div>
        </section>

        {requestOpen ? (
          <div style={modalOverlayStyle}>
            <div style={modalCardStyle}>
              <div style={modalHeaderStyle}>
                <div>
                  <div style={eyebrowStyle}>NOUVELLE DEMANDE PARTENAIRE</div>
                  <h3 style={modalTitleStyle}>Créer une demande</h3>
                </div>
                <button type="button" style={closeButtonStyle} onClick={() => setRequestOpen(false)}>
                  ×
                </button>
              </div>

              <div style={formGridStyle}>
                <label style={fieldStyle}>
                  <span>Type de demande</span>
                  <select value={requestType} onChange={(event) => setRequestType(event.target.value)} style={inputStyle}>
                    <option value="formation_request">Demande de formation</option>
                    <option value="session_planning">Planification session</option>
                    <option value="billing_question">Question de facturation</option>
                    <option value="refresh_request">Refresh / renouvellement</option>
                    <option value="certificate_correction">Certificat / preuve</option>
                    <option value="support_issue">Support / autre</option>
                  </select>
                </label>

                <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                  <span>Titre</span>
                  <input value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} style={inputStyle} placeholder="Ex: Préparer une offre formation" />
                </label>

                <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                  <span>Description</span>
                  <textarea value={requestDescription} onChange={(event) => setRequestDescription(event.target.value)} style={textareaStyle} placeholder="Décrivez votre besoin, le contexte et l’objectif attendu." />
                </label>
              </div>

              <div style={modalFooterStyle}>
                <Button tone="light" onClick={() => setRequestOpen(false)}>Annuler</Button>
                <Button tone="primary" onClick={submitRequest} disabled={busy || !requestTitle.trim()} icon="→">{busy ? 'Envoi…' : 'Envoyer la demande'}</Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

function Header() {
  return (
    <header style={headerStyle}>
      <div style={brandAreaStyle}>
        <div style={logoFrameStyle}>
          <img src="/logo.png" alt="AngelCare" style={logoImageStyle} />
        </div>
        <div>
          <div style={brandTitleStyle}>TRAININGHUB PARTNER PORTAL</div>
          <div style={brandSubtitleStyle}>Expérience premium • pilotage formation • relation partenaire</div>
        </div>
      </div>

      <nav style={navStyle}>
        {TABS.map((item) => (
          <Link key={item.key} href={item.href} style={navLinkStyle}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={headerActionsStyle}>
        <span style={secureBadgeStyle}>Accès sécurisé</span>
        <Link href="/logout" style={logoutStyle}>Déconnexion</Link>
      </div>
    </header>
  )
}

function Button({ children, icon, tone = 'light', onClick, disabled }: { children: ReactNode; icon?: string; tone?: 'primary' | 'mint' | 'light'; onClick?: () => void; disabled?: boolean }) {
  const style = tone === 'primary' ? primaryButtonStyle : tone === 'mint' ? mintButtonStyle : lightButtonStyle
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...style, opacity: disabled ? 0.55 : 1 }}>
      {icon ? <span style={buttonIconStyle}>{icon}</span> : null}
      {children}
    </button>
  )
}

function HeroProof({ icon, label, text }: { icon: string; label: string; text: string }) {
  return (
    <div style={heroProofStyle}>
      <span style={heroProofIconStyle}>{icon}</span>
      <div>
        <strong>{label}</strong>
        <small>{text}</small>
      </div>
    </div>
  )
}

function IdentityStat({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div style={identityStatStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={infoPillStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ExecutiveMetric({ icon, title, value, subtitle }: { icon: string; title: string; value: string | number; subtitle: string }) {
  return (
    <article style={executiveMetricStyle}>
      <div style={executiveMetricHeaderStyle}>
        <span style={metricIconStyle}>{icon}</span>
        <span>{title}</span>
      </div>
      <strong style={executiveMetricValueStyle}>{value}</strong>
      <small style={executiveMetricSubtitleStyle}>{subtitle}</small>
    </article>
  )
}

function JourneyStep({ label, index, active }: { label: string; index: string; active: boolean }) {
  return (
    <div style={active ? activeJourneyStepStyle : journeyStepStyle}>
      <span>{index}</span>
      <strong>{label}</strong>
    </div>
  )
}

function ContentGrid({ children }: { children: ReactNode }) {
  return <div style={contentGridStyle}>{children}</div>
}

function FeatureCard({ icon, title, kicker, rows, empty, action }: { icon: string; title: string; kicker: string; rows?: string[]; empty?: string; action?: ReactNode }) {
  const visibleRows = (rows || []).filter(Boolean)

  return (
    <article style={featureCardStyle}>
      <div style={featureHeaderStyle}>
        <span style={featureIconStyle}>{icon}</span>
        <div>
          <strong>{title}</strong>
          <small>{kicker}</small>
        </div>
      </div>
      <div style={featureRowsStyle}>
        {visibleRows.length ? visibleRows.map((row, index) => <p key={`${title}-${index}`}>{row}</p>) : <p style={emptyTextStyle}>{empty || 'Aucune donnée disponible.'}</p>}
      </div>
      {action ? <div style={featureActionStyle}>{action}</div> : null}
    </article>
  )
}

const appBackgroundStyle: CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at 12% 0%, rgba(70, 113, 255, 0.10), transparent 34%), linear-gradient(180deg, #f7faff 0%, #eff5ff 100%)',
  padding: '26px',
  color: '#0e1a35',
}

const pageCanvasStyle: CSSProperties = {
  width: 'min(1480px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gap: 20,
}

const headerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(360px, 1fr) minmax(360px, auto) auto',
  alignItems: 'center',
  gap: 20,
  padding: '14px 18px',
  borderRadius: 28,
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(204,216,238,0.85)',
  boxShadow: '0 18px 46px rgba(17, 35, 72, 0.08)',
  backdropFilter: 'blur(16px)',
}

const brandAreaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  minWidth: 0,
}

const logoFrameStyle: CSSProperties = {
  width: 150,
  height: 58,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 20,
  background: '#fff',
  border: '1px solid rgba(203, 214, 234, 0.9)',
  boxShadow: '0 10px 26px rgba(23, 50, 103, 0.08)',
  overflow: 'hidden',
}

const logoImageStyle: CSSProperties = {
  width: '88%',
  height: '88%',
  objectFit: 'contain',
}

const brandTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 950,
  letterSpacing: '0.18em',
  color: '#0f234b',
  whiteSpace: 'nowrap',
}

const brandSubtitleStyle: CSSProperties = {
  marginTop: 5,
  color: '#6a7a95',
  fontSize: 12,
  fontWeight: 800,
}

const navStyle: CSSProperties = {
  display: 'flex',
  gap: 9,
  flexWrap: 'wrap',
  justifyContent: 'center',
}

const navLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: '#41556f',
  background: '#ffffff',
  border: '1px solid rgba(205, 216, 235, 0.9)',
  padding: '9px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
}

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
}

const secureBadgeStyle: CSSProperties = {
  padding: '11px 15px',
  borderRadius: 999,
  color: '#08704b',
  background: 'linear-gradient(180deg, #eefff6 0%, #dcf8e9 100%)',
  border: '1px solid #b7eccf',
  fontWeight: 950,
  fontSize: 12,
}

const logoutStyle: CSSProperties = {
  textDecoration: 'none',
  color: '#5b6f8a',
  background: '#fff',
  border: '1px solid rgba(205, 216, 235, 0.9)',
  padding: '11px 14px',
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
}

const infoBannerStyle: CSSProperties = {
  padding: '14px 18px',
  borderRadius: 20,
  color: '#2854c6',
  background: 'linear-gradient(180deg, #f1f6ff 0%, #e8f0ff 100%)',
  border: '1px solid rgba(188, 205, 242, 0.9)',
  fontWeight: 850,
}

const loadingCardStyle: CSSProperties = {
  padding: 34,
  borderRadius: 30,
  background: '#fff',
  border: '1px solid rgba(205,216,238,0.85)',
  boxShadow: '0 18px 46px rgba(17, 35, 72, 0.08)',
  fontWeight: 900,
  color: '#27415f',
}

const heroShellStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateColumns: '1fr 0.92fr',
  gap: 22,
  minHeight: 440,
  padding: 24,
  borderRadius: 36,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,249,255,0.97) 62%, rgba(234,242,255,0.98) 100%)',
  border: '1px solid rgba(204,216,238,0.9)',
  boxShadow: '0 24px 70px rgba(17, 35, 72, 0.10)',
}

const heroOrnamentStyle: CSSProperties = {
  position: 'absolute',
  width: 480,
  height: 480,
  right: -150,
  top: -180,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(48, 100, 220, 0.18) 0%, transparent 70%)',
  pointerEvents: 'none',
}

const heroCopyStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  alignContent: 'center',
  gap: 19,
  padding: '20px 8px 20px 6px',
}

const eyebrowStyle: CSSProperties = {
  color: '#315fd8',
  fontSize: 12,
  letterSpacing: '0.17em',
  fontWeight: 950,
}

const heroTitleStyle: CSSProperties = {
  margin: 0,
  maxWidth: 720,
  fontSize: 'clamp(52px, 5.5vw, 76px)',
  lineHeight: 0.92,
  letterSpacing: '-0.065em',
  color: '#0b1730',
  fontWeight: 950,
}

const heroLeadStyle: CSSProperties = {
  margin: 0,
  maxWidth: 700,
  color: '#5c6f8d',
  fontSize: 18,
  lineHeight: 1.62,
  fontWeight: 800,
}

const heroActionRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
}

const buttonIconStyle: CSSProperties = {
  width: 25,
  height: 25,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(255,255,255,0.2)',
  fontWeight: 950,
}

const primaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  border: 0,
  cursor: 'pointer',
  borderRadius: 18,
  padding: '15px 18px',
  color: '#fff',
  background: 'linear-gradient(135deg, #132f6c 0%, #315fd8 100%)',
  boxShadow: '0 18px 34px rgba(49, 95, 216, 0.25)',
  fontWeight: 950,
  fontSize: 14,
}

const mintButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  color: '#08705b',
  background: 'linear-gradient(180deg, #f0fffb 0%, #e3fbf3 100%)',
  border: '1px solid #b9efdb',
  boxShadow: '0 14px 24px rgba(15, 118, 110, 0.10)',
}

const lightButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  color: '#344865',
  background: '#fff',
  border: '1px solid rgba(210, 220, 238, 0.95)',
  boxShadow: '0 12px 24px rgba(17, 35, 72, 0.06)',
}

const heroProofGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  maxWidth: 760,
}

const heroProofStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 15,
  borderRadius: 20,
  background: '#fff',
  border: '1px solid rgba(210, 220, 238, 0.95)',
  boxShadow: '0 10px 24px rgba(17, 35, 72, 0.045)',
}

const heroProofIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 14,
  background: '#edf3ff',
  color: '#315fd8',
  fontWeight: 950,
  fontSize: 12,
}

const identityCardStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  overflow: 'hidden',
  display: 'grid',
  alignContent: 'start',
  gap: 18,
  padding: 26,
  borderRadius: 32,
  color: '#fff',
  background: 'linear-gradient(135deg, #0e285e 0%, #214d9d 48%, #3268e8 100%)',
  boxShadow: '0 30px 60px rgba(32, 75, 169, 0.28), inset 0 1px 0 rgba(255,255,255,0.15)',
}

const identityGlowStyle: CSSProperties = {
  position: 'absolute',
  width: 320,
  height: 320,
  right: -90,
  top: -120,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,255,255,0.20) 0%, transparent 70%)',
  pointerEvents: 'none',
}

const identityTopRowStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: '68px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 14,
}

const avatarStyle: CSSProperties = {
  width: 68,
  height: 68,
  borderRadius: 24,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(255,255,255,0.13)',
  border: '1px solid rgba(255,255,255,0.18)',
  fontSize: 30,
  fontWeight: 950,
}

const identityKickerStyle: CSSProperties = {
  letterSpacing: '0.16em',
  fontSize: 11,
  fontWeight: 950,
  color: 'rgba(230,238,255,0.86)',
}

const identityTitleStyle: CSSProperties = {
  margin: '5px 0 0',
  fontSize: 38,
  lineHeight: 0.94,
  letterSpacing: '-0.04em',
  fontWeight: 950,
}

const identityMetaStyle: CSSProperties = {
  margin: '8px 0 0',
  color: 'rgba(232,239,255,0.84)',
  fontWeight: 850,
}

const identityToggleStyle: CSSProperties = {
  alignSelf: 'start',
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.13)',
  color: '#fff',
  borderRadius: 999,
  padding: '11px 14px',
  cursor: 'pointer',
  fontWeight: 950,
}

const identityStatsStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
}

const identityStatStyle: CSSProperties = {
  minHeight: 100,
  padding: 15,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.13)',
  border: '1px solid rgba(255,255,255,0.15)',
  display: 'grid',
  gap: 8,
}

const identityProgressTrackStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  height: 10,
  borderRadius: 999,
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.19)',
}

const identityProgressFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(159,211,255,1) 100%)',
}

const identityDetailsStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10,
}

const infoPillStyle: CSSProperties = {
  padding: 13,
  borderRadius: 17,
  background: 'rgba(255,255,255,0.11)',
  border: '1px solid rgba(255,255,255,0.13)',
  display: 'grid',
  gap: 5,
}

const executiveRailStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 14,
}

const executiveMetricStyle: CSSProperties = {
  minHeight: 130,
  borderRadius: 24,
  padding: 18,
  background: '#fff',
  border: '1px solid rgba(210, 220, 238, 0.96)',
  boxShadow: '0 16px 36px rgba(17, 35, 72, 0.07)',
  display: 'grid',
  gap: 8,
}

const executiveMetricHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#536783',
  fontSize: 13,
  fontWeight: 900,
}

const metricIconStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  background: '#edf3ff',
  color: '#315fd8',
  fontWeight: 950,
}

const executiveMetricValueStyle: CSSProperties = {
  color: '#0c1830',
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 950,
}

const executiveMetricSubtitleStyle: CSSProperties = {
  color: '#7b8ba5',
  fontWeight: 800,
  fontSize: 12,
}

const journeyStyle: CSSProperties = {
  padding: 12,
  borderRadius: 26,
  display: 'grid',
  gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
  gap: 10,
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(210, 220, 238, 0.96)',
  boxShadow: '0 14px 32px rgba(17, 35, 72, 0.05)',
}

const journeyStepStyle: CSSProperties = {
  minHeight: 58,
  display: 'grid',
  placeItems: 'center',
  gap: 4,
  borderRadius: 18,
  background: '#fbfcff',
  border: '1px solid rgba(218, 226, 240, 0.96)',
  color: '#63768f',
  fontWeight: 900,
  fontSize: 12,
}

const activeJourneyStepStyle: CSSProperties = {
  ...journeyStepStyle,
  color: '#2854c6',
  background: 'linear-gradient(180deg, #f0f5ff 0%, #e3ecff 100%)',
  border: '1px solid rgba(179, 197, 239, 1)',
}

const attentionSectionStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  padding: 22,
  borderRadius: 30,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,252,255,0.96) 100%)',
  border: '1px solid rgba(210, 220, 238, 0.96)',
  boxShadow: '0 18px 40px rgba(17, 35, 72, 0.06)',
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 16,
}

const sectionTitleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 28,
  letterSpacing: '-0.035em',
  color: '#0c1830',
  fontWeight: 950,
}

const sectionLeadStyle: CSSProperties = {
  margin: '7px 0 0',
  color: '#71839e',
  fontWeight: 800,
}

const attentionGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 14,
}

const attentionCardStyle: CSSProperties = {
  minHeight: 190,
  display: 'grid',
  alignContent: 'start',
  gap: 12,
  padding: 18,
  borderRadius: 24,
  background: 'linear-gradient(180deg, #fffaf3 0%, #fff2e3 100%)',
  border: '1px solid rgba(245, 210, 166, 0.95)',
  color: '#9a4d12',
}

const attentionCardBlueStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #f3f7ff 0%, #e8f0ff 100%)',
  border: '1px solid rgba(190, 207, 244, 0.95)',
  color: '#2854c6',
}

const attentionCardGreenStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #f0fff8 0%, #e1faee 100%)',
  border: '1px solid rgba(174, 232, 201, 0.95)',
  color: '#08704b',
}

const attentionCardTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
}

const attentionIndexStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 14,
  display: 'grid',
  placeItems: 'center',
  background: '#fff',
  fontWeight: 950,
  boxShadow: '0 8px 18px rgba(17, 35, 72, 0.06)',
}

const attentionStatusStyle: CSSProperties = {
  borderRadius: 999,
  padding: '8px 10px',
  background: 'rgba(255,255,255,0.72)',
  fontSize: 11,
  fontWeight: 950,
}

const attentionTitleStyle: CSSProperties = {
  fontSize: 17,
  lineHeight: 1.15,
}

const attentionTextStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.55,
  fontWeight: 800,
  opacity: 0.92,
}

const attentionButtonStyle: CSSProperties = {
  marginTop: 'auto',
  border: 0,
  cursor: 'pointer',
  borderRadius: 16,
  padding: '12px 14px',
  background: '#fff',
  color: 'currentColor',
  fontWeight: 950,
  boxShadow: '0 10px 20px rgba(17, 35, 72, 0.06)',
}

const workspaceStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  padding: 22,
  borderRadius: 30,
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(210, 220, 238, 0.96)',
  boxShadow: '0 18px 40px rgba(17, 35, 72, 0.06)',
}

const tabsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const tabStyle: CSSProperties = {
  border: '1px solid rgba(210, 220, 238, 0.95)',
  background: '#fff',
  color: '#465a74',
  padding: '12px 15px',
  borderRadius: 999,
  cursor: 'pointer',
  fontWeight: 950,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
}

const activeTabStyle: CSSProperties = {
  ...tabStyle,
  color: '#2854c6',
  background: 'linear-gradient(180deg, #f0f5ff 0%, #e3ecff 100%)',
  border: '1px solid rgba(179, 197, 239, 1)',
}

const tabIconStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(49,95,216,0.08)',
}

const contentGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 16,
}

const featureCardStyle: CSSProperties = {
  minHeight: 230,
  display: 'grid',
  gap: 14,
  alignContent: 'start',
  borderRadius: 24,
  padding: 20,
  background: '#fff',
  border: '1px solid rgba(210, 220, 238, 0.95)',
  boxShadow: '0 14px 30px rgba(17, 35, 72, 0.055)',
}

const featureHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
}

const featureIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  background: '#edf3ff',
  color: '#315fd8',
  fontWeight: 950,
}

const featureRowsStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  color: '#41546f',
  fontWeight: 800,
  lineHeight: 1.55,
}

const emptyTextStyle: CSSProperties = {
  color: '#7e8da6',
  fontWeight: 800,
}

const featureActionStyle: CSSProperties = {
  marginTop: 'auto',
}

const supportBannerStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
  padding: 18,
  borderRadius: 22,
  color: '#2854c6',
  background: 'linear-gradient(180deg, #edf3ff 0%, #e4ecff 100%)',
  border: '1px solid rgba(196, 210, 244, 0.95)',
  fontWeight: 900,
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: 'rgba(8, 18, 36, 0.46)',
}

const modalCardStyle: CSSProperties = {
  width: 'min(820px, 100%)',
  display: 'grid',
  gap: 18,
  padding: 26,
  borderRadius: 30,
  background: '#fff',
  boxShadow: '0 40px 90px rgba(10, 21, 39, 0.24)',
}

const modalHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 14,
}

const modalTitleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 30,
  color: '#0c1830',
}

const closeButtonStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 18,
  border: '1px solid rgba(210, 220, 238, 0.95)',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 26,
  fontWeight: 900,
  color: '#344865',
}

const formGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
}

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  fontWeight: 900,
  color: '#263a59',
}

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 17,
  border: '1px solid rgba(210, 220, 238, 0.95)',
  background: '#fbfcff',
  padding: '15px 16px',
  outline: 'none',
  color: '#0c1830',
  fontWeight: 800,
}

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 150,
  resize: 'vertical',
}

const modalFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
}
