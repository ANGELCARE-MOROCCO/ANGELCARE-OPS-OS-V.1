'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  partners: any[]
  sites: any[]
  accounts: any[]
  subscriptions: any[]
  sessions: any[]
  proposals: any[]
  participants: any[]
  counts: Record<string, number>
  recentCourses: any[]
  queryWarnings: string[]
}

const activeValues = new Set(['active', 'confirmed', 'trial', 'current', 'paid', 'valid'])
const inactiveValues = new Set(['inactive', 'suspended', 'cancelled', 'expired', 'closed'])

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function orgName(partner: any) {
  return clean(partner.name || partner.legal_name || partner.display_name, 'Partenaire sans nom')
}

function orgCity(partner: any, partnerSites: any[]) {
  return clean(partner.city || partnerSites[0]?.city || partnerSites[0]?.address_city, 'Ville non renseignée')
}

function orgStatus(partner: any) {
  return clean(partner.status || partner.account_status, 'active')
}

function statusLabel(status: string) {
  const value = normalize(status)
  if (activeValues.has(value)) return 'Actif'
  if (value === 'pending') return 'En activation'
  if (inactiveValues.has(value)) return 'À revoir'
  return status.replace(/_/g, ' ')
}

function statusTone(status: string) {
  const value = normalize(status)
  if (activeValues.has(value)) return { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' }
  if (value === 'pending') return { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' }
  if (inactiveValues.has(value)) return { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' }
  return { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' }
}

function partnerAccountLabel(partner: any, accounts: any[], subscriptions: any[]) {
  const account = accounts.find((item) => item.organization_id === partner.id || item.org_id === partner.id)
  const subscription = subscriptions.find((item) => item.organization_id === partner.id || item.org_id === partner.id || item.account_id === account?.id)
  const subscriptionStatus = normalize(subscription?.status || subscription?.subscription_status)
  const accountStatus = normalize(account?.status || account?.account_status)

  if (subscription?.plan_name) return String(subscription.plan_name)
  if (subscription?.plan_code) return String(subscription.plan_code)
  if (subscription?.billing_interval) return `Plan ${subscription.billing_interval}`
  if (activeValues.has(subscriptionStatus)) return 'Abonnement actif'
  if (subscriptionStatus === 'trial') return 'Essai partenaire'
  if (activeValues.has(accountStatus)) return 'Compte actif'
  if (account) return 'Compte à finaliser'
  return 'À configurer'
}

function partnerHealthScore(input: { sites: number; sessions: number; participants: number; proposals: number; activeAccount: boolean }) {
  return Math.min(
    100,
    Math.round(
      (input.activeAccount ? 28 : 0) +
        Math.min(input.sites, 3) * 10 +
        Math.min(input.sessions, 5) * 7 +
        Math.min(input.participants, 20) * 1.2 +
        Math.min(input.proposals, 3) * 5,
    ),
  )
}

function isActiveAccount(partner: any, accounts: any[], subscriptions: any[]) {
  const account = accounts.find((item) => item.organization_id === partner.id || item.org_id === partner.id)
  const subscription = subscriptions.find((item) => item.organization_id === partner.id || item.org_id === partner.id || item.account_id === account?.id)
  return activeValues.has(normalize(account?.status || account?.account_status)) || activeValues.has(normalize(subscription?.status || subscription?.subscription_status))
}

function percent(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export default function TrainingHubCommandCenterWorkspace({
  partners,
  sites,
  accounts,
  subscriptions,
  sessions,
  proposals,
  participants,
  counts,
  recentCourses,
  queryWarnings,
}: Props) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('all')
  const [status, setStatus] = useState('all')
  const [accountType, setAccountType] = useState('all')
  const [sortMode, setSortMode] = useState('activity')

  const partnerRows = useMemo(() => {
    return partners.map((partner) => {
      const partnerSites = sites.filter((site) => site.organization_id === partner.id || site.org_id === partner.id)
      const partnerSessions = sessions.filter((session) => session.organization_id === partner.id || session.org_id === partner.id)
      const partnerParticipants = participants.filter((participant) => participant.organization_id === partner.id || participant.org_id === partner.id)
      const partnerProposals = proposals.filter((proposal) => proposal.organization_id === partner.id || proposal.org_id === partner.id)
      const accountLabel = partnerAccountLabel(partner, accounts, subscriptions)
      const activeAccount = isActiveAccount(partner, accounts, subscriptions)
      const score = partnerHealthScore({
        sites: partnerSites.length,
        sessions: partnerSessions.length,
        participants: partnerParticipants.length,
        proposals: partnerProposals.length,
        activeAccount,
      })

      return {
        partner,
        id: partner.id,
        name: orgName(partner),
        city: orgCity(partner, partnerSites),
        status: orgStatus(partner),
        type: accountLabel,
        activeAccount,
        score,
        sites: partnerSites,
        sessions: partnerSessions,
        participants: partnerParticipants,
        proposals: partnerProposals,
      }
    })
  }, [partners, sites, sessions, participants, proposals, accounts, subscriptions])

  const cityOptions = useMemo(() => Array.from(new Set(partnerRows.map((row) => row.city))).filter(Boolean).sort(), [partnerRows])
  const statusOptions = useMemo(() => Array.from(new Set(partnerRows.map((row) => statusLabel(row.status)))).filter(Boolean).sort(), [partnerRows])
  const accountOptions = useMemo(() => Array.from(new Set(partnerRows.map((row) => row.type))).filter(Boolean).sort(), [partnerRows])

  const filteredRows = useMemo(() => {
    const q = normalize(search)
    const rows = partnerRows.filter((row) => {
      const matchSearch = !q || normalize(`${row.name} ${row.city} ${row.type}`).includes(q)
      const matchCity = city === 'all' || row.city === city
      const matchStatus = status === 'all' || statusLabel(row.status) === status
      const matchType = accountType === 'all' || row.type === accountType
      return matchSearch && matchCity && matchStatus && matchType
    })

    return rows.sort((a, b) => {
      if (sortMode === 'score') return b.score - a.score
      if (sortMode === 'name') return a.name.localeCompare(b.name)
      if (sortMode === 'city') return a.city.localeCompare(b.city)
      return (b.sessions.length + b.participants.length + b.proposals.length) - (a.sessions.length + a.participants.length + a.proposals.length)
    })
  }, [partnerRows, search, city, status, accountType, sortMode])

  const activePartners = partnerRows.filter((row) => activeValues.has(normalize(row.status))).length
  const activeAccounts = partnerRows.filter((row) => row.activeAccount).length
  const representedCities = cityOptions.length
  const avgScore = partnerRows.length ? Math.round(partnerRows.reduce((sum, row) => sum + row.score, 0) / partnerRows.length) : 0
  const totalSites = sites.length
  const activeSessions = sessions.filter((session) => ['scheduled', 'confirmed', 'kit_preparation', 'ready_to_deliver', 'in_delivery'].includes(normalize(session.status))).length

  const cityDistribution = cityOptions
    .map((name) => ({ name, count: partnerRows.filter((row) => row.city === name).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const accountDistribution = accountOptions
    .map((name) => ({ name, count: partnerRows.filter((row) => row.type === name).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return (
    <div style={pageStackStyle}>
      <section style={executiveHeroStyle}>
        <div style={heroCopyStyle}>
          <div style={heroEyebrowStyle}>VUE DIRECTION • PARTENAIRES FORMATION</div>
          <h2 style={heroTitleStyle}>Piloter le réseau des crèches partenaires comme une plateforme nationale.</h2>
          <p style={heroTextStyle}>
            Visualisez en quelques secondes les établissements actifs, les villes couvertes, les comptes partenaires, les sessions en cours, les équipes formées et les opportunités à relancer.
          </p>

          <div style={heroSearchStyle}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une crèche, une ville ou un type de compte…"
              style={searchInputStyle}
            />
            <button type="button" onClick={() => { setSearch(''); setCity('all'); setStatus('all'); setAccountType('all') }} style={resetButtonStyle}>
              Réinitialiser
            </button>
          </div>
        </div>

        <aside style={networkPulseStyle}>
          <div style={pulseTopStyle}>
            <span>Indice réseau</span>
            <strong>{avgScore}/100</strong>
          </div>
          <div style={pulseTrackStyle}><div style={{ ...pulseFillStyle, width: `${avgScore}%` }} /></div>
          <div style={pulseGridStyle}>
            <MiniStat label="Partenaires" value={partnerRows.length} />
            <MiniStat label="Comptes actifs" value={activeAccounts} />
            <MiniStat label="Villes" value={representedCities} />
            <MiniStat label="Sessions actives" value={activeSessions} />
          </div>
        </aside>
      </section>

      <section style={metricGridStyle}>
        <MetricCard label="Établissements partenaires" value={partnerRows.length} detail={`${activePartners} actifs`} accent="#2563eb" />
        <MetricCard label="Comptes actifs" value={activeAccounts} detail={`${percent(activeAccounts, partnerRows.length)}% du réseau`} accent="#059669" />
        <MetricCard label="Villes couvertes" value={representedCities} detail={`${totalSites} site(s) rattaché(s)`} accent="#0f766e" />
        <MetricCard label="Sessions actives" value={activeSessions} detail={`${sessions.length} sessions au total`} accent="#7c3aed" />
        <MetricCard label="Participants suivis" value={participants.length} detail="collaborateurs formés" accent="#db2777" />
        <MetricCard label="Formations catalogue" value={counts.courses || 0} detail={`${counts.modules || 0} refresh modules`} accent="#ea580c" />
      </section>

      <section style={marketGridStyle}>
        <article style={panelStyle}>
          <SectionHeader eyebrow="COUVERTURE MARCHÉ" title="Répartition par ville" text="Lecture rapide des zones où le réseau partenaire est déjà présent." />
          <div style={distributionListStyle}>
            {cityDistribution.length ? cityDistribution.map((item) => (
              <button key={item.name} type="button" onClick={() => setCity(item.name)} style={distributionRowStyle}>
                <span>{item.name}</span>
                <strong>{item.count}</strong>
                <div style={distributionTrackStyle}><div style={{ ...distributionFillStyle, width: `${percent(item.count, Math.max(1, partnerRows.length))}%` }} /></div>
              </button>
            )) : <Empty text="Aucune ville partenaire encore disponible." />}
          </div>
        </article>

        <article style={panelStyle}>
          <SectionHeader eyebrow="COMPTES PARTENAIRES" title="Types de comptes" text="Vue des statuts commerciaux et niveaux d’activation visibles." />
          <div style={distributionListStyle}>
            {accountDistribution.length ? accountDistribution.map((item) => (
              <button key={item.name} type="button" onClick={() => setAccountType(item.name)} style={distributionRowStyle}>
                <span>{item.name}</span>
                <strong>{item.count}</strong>
                <div style={distributionTrackStyle}><div style={{ ...distributionFillStyle, width: `${percent(item.count, Math.max(1, partnerRows.length))}%` }} /></div>
              </button>
            )) : <Empty text="Aucun compte partenaire encore catégorisé." />}
          </div>
        </article>
      </section>

      <section style={filterPanelStyle}>
        <div style={filterHeaderStyle}>
          <div>
            <div style={sectionEyebrowStyle}>LISTE PARTENAIRES</div>
            <h2 style={sectionTitleStyle}>Établissements à piloter</h2>
            <p style={sectionTextStyle}>Filtrez le réseau par ville, statut, type de compte et niveau d’activité.</p>
          </div>
          <div style={resultCounterStyle}>{filteredRows.length} résultat(s)</div>
        </div>

        <div style={filterBarStyle}>
          <select value={city} onChange={(event) => setCity(event.target.value)} style={selectStyle}>
            <option value="all">Toutes les villes</option>
            {cityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle}>
            <option value="all">Tous les statuts</option>
            {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={accountType} onChange={(event) => setAccountType(event.target.value)} style={selectStyle}>
            <option value="all">Tous les comptes</option>
            {accountOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} style={selectStyle}>
            <option value="activity">Trier par activité</option>
            <option value="score">Trier par potentiel</option>
            <option value="city">Trier par ville</option>
            <option value="name">Trier par nom</option>
          </select>
        </div>

        <div style={partnerGridStyle}>
          {filteredRows.length ? filteredRows.slice(0, 60).map((row) => (
            <PartnerCard key={row.id || row.name} row={row} />
          )) : <Empty text="Aucun partenaire ne correspond aux filtres sélectionnés." />}
        </div>
      </section>

      <section style={bottomGridStyle}>
        <article style={panelStyle}>
          <SectionHeader eyebrow="OPPORTUNITÉS" title="À développer en priorité" text="Établissements à activer ou à enrichir commercialement." />
          <div style={priorityListStyle}>
            {partnerRows
              .filter((row) => !row.activeAccount || row.score < 45)
              .sort((a, b) => a.score - b.score)
              .slice(0, 8)
              .map((row) => (
                <div key={row.id || row.name} style={priorityRowStyle}>
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.city} • {row.type}</span>
                  </div>
                  <small>{row.score}/100</small>
                </div>
              ))}
            {!partnerRows.filter((row) => !row.activeAccount || row.score < 45).length ? <Empty text="Aucune priorité faible détectée." /> : null}
          </div>
        </article>

        <article style={panelStyle}>
          <SectionHeader eyebrow="CATALOGUE" title="Formations prêtes à pousser" text="Signal commercial simple pour relancer les partenaires." />
          <div style={courseListStyle}>
            {recentCourses.length ? recentCourses.slice(0, 8).map((course: any) => (
              <div key={course.id || course.ref} style={courseRowStyle}>
                <div>
                  <strong>{course.ref}</strong>
                  <span>{course.title}</span>
                </div>
                <small>{course.publication_status || course.status || 'visible'}</small>
              </div>
            )) : <Empty text="Aucune formation récente à afficher." />}
          </div>
        </article>
      </section>

      {queryWarnings.length ? (
        <section style={warningStyle}>
          Certaines informations partenaires ne sont pas encore complètes. Les blocs concernés se mettront à jour automatiquement dès que les comptes, sites, sessions ou abonnements seront alimentés.
        </section>
      ) : null}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={miniStatStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function MetricCard({ label, value, detail, accent }: { label: string; value: number; detail: string; accent: string }) {
  return (
    <article style={metricCardStyle}>
      <div style={{ ...metricAccentStyle, background: accent }} />
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </article>
  )
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div style={sectionHeaderStyle}>
      <div style={sectionEyebrowStyle}>{eyebrow}</div>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionTextStyle}>{text}</p>
    </div>
  )
}

function PartnerCard({ row }: { row: any }) {
  const tone = statusTone(row.status)
  return (
    <article style={partnerCardStyle}>
      <div style={partnerTopStyle}>
        <div>
          <div style={partnerTypeStyle}>{row.type}</div>
          <h3 style={partnerNameStyle}>{row.name}</h3>
          <p style={partnerMetaStyle}>{row.city} • {row.sites.length || 1} site(s)</p>
        </div>
        <span style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusLabel(row.status)}</span>
      </div>

      <div style={healthStyle}>
        <div style={healthTopStyle}>
          <span>Potentiel partenaire</span>
          <strong>{row.score}/100</strong>
        </div>
        <div style={healthTrackStyle}><div style={{ ...healthFillStyle, width: `${row.score}%` }} /></div>
      </div>

      <div style={partnerStatsStyle}>
        <div><strong>{row.sessions.length}</strong><span>sessions</span></div>
        <div><strong>{row.participants.length}</strong><span>staff</span></div>
        <div><strong>{row.proposals.length}</strong><span>offres</span></div>
      </div>
    </article>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const pageStackStyle: CSSProperties = { display: 'grid', gap: 18 }
const executiveHeroStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.22fr) minmax(360px, .78fr)',
  gap: 18,
}
const heroCopyStyle: CSSProperties = {
  borderRadius: 34,
  padding: 28,
  background: 'radial-gradient(circle at top right, rgba(37,99,235,.14), transparent 35%), linear-gradient(135deg,#ffffff,#f8fbff)',
  border: '1px solid #dbeafe',
  boxShadow: '0 24px 64px rgba(15,23,42,.08)',
}
const heroEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }
const heroTitleStyle: CSSProperties = { margin: 0, maxWidth: 860, fontSize: 46, lineHeight: 1, letterSpacing: '-.06em', fontWeight: 980, color: '#0f172a' }
const heroTextStyle: CSSProperties = { margin: '15px 0 0', maxWidth: 790, color: '#475569', lineHeight: 1.7, fontSize: 15, fontWeight: 750 }
const heroSearchStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, marginTop: 24 }
const searchInputStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#fff', borderRadius: 18, padding: '15px 16px', fontSize: 14, fontWeight: 800, color: '#0f172a', outline: 'none' }
const resetButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 18, padding: '0 16px', fontWeight: 950, cursor: 'pointer' }
const networkPulseStyle: CSSProperties = {
  borderRadius: 34,
  padding: 24,
  color: '#fff',
  background: 'radial-gradient(circle at top right, rgba(96,165,250,.32), transparent 34%), linear-gradient(160deg,#0b2348 0%,#123c72 52%,#2557d6 100%)',
  boxShadow: '0 24px 64px rgba(15,42,82,.22)',
}
const pulseTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 16 }
const pulseTrackStyle: CSSProperties = { height: 12, borderRadius: 999, background: 'rgba(255,255,255,.18)', overflow: 'hidden', marginBottom: 16 }
const pulseFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const pulseGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const miniStatStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, padding: 14, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)' }
const metricGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const metricCardStyle: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 18, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 42px rgba(15,23,42,.06)', display: 'grid', gap: 5 }
const metricAccentStyle: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 4 }
const marketGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const panelStyle: CSSProperties = { borderRadius: 30, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const sectionHeaderStyle: CSSProperties = { marginBottom: 16 }
const sectionEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 25, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 950 }
const sectionTextStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 780 }
const distributionListStyle: CSSProperties = { display: 'grid', gap: 10 }
const distributionRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 40px', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 18, padding: 13, textAlign: 'left', cursor: 'pointer', color: '#0f172a', fontWeight: 900 }
const distributionTrackStyle: CSSProperties = { gridColumn: '1 / -1', height: 7, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const distributionFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#60a5fa)' }
const filterPanelStyle: CSSProperties = { borderRadius: 32, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const filterHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const resultCounterStyle: CSSProperties = { borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '10px 12px', fontWeight: 950, whiteSpace: 'nowrap' }
const filterBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: 16 }
const selectStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#334155', fontWeight: 850 }
const partnerGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const partnerCardStyle: CSSProperties = { borderRadius: 24, padding: 18, background: 'linear-gradient(180deg,#ffffff,#f8fbff)', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.05)', display: 'grid', gap: 14 }
const partnerTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }
const partnerTypeStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.10em', textTransform: 'uppercase', marginBottom: 5 }
const partnerNameStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, lineHeight: 1.1, letterSpacing: '-.03em', fontWeight: 950 }
const partnerMetaStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 12, fontWeight: 750 }
const badgeStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap' }
const healthStyle: CSSProperties = { display: 'grid', gap: 8 }
const healthTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, color: '#334155', fontSize: 12, fontWeight: 950 }
const healthTrackStyle: CSSProperties = { height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const healthFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const partnerStatsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }
const bottomGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const priorityListStyle: CSSProperties = { display: 'grid', gap: 10 }
const priorityRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 18, padding: 13 }
const courseListStyle: CSSProperties = { display: 'grid', gap: 10 }
const courseRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 18, padding: 13 }
const warningStyle: CSSProperties = { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', borderRadius: 20, padding: 14, fontSize: 13, fontWeight: 750 }
const emptyStyle: CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', color: '#64748b', fontWeight: 800, border: '1px dashed #cbd5e1' }
