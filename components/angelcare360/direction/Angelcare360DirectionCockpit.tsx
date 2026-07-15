import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { Angelcare360DirectionCockpitData } from '@/lib/angelcare360/server/direction'

type Props = {
  data: Angelcare360DirectionCockpitData
}

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'pink' | 'slate'
type AlertTone = 'danger' | 'warning' | 'info' | 'success'

type KpiCard = {
  label: string
  value: string
  note: string
  tone: Tone
  href: string
  state?: 'ready' | 'empty' | 'watch'
}

const moneyFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
})

function formatMad(value: number) {
  return `${moneyFormatter.format(Math.round(value || 0))} MAD`
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function safePositive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function statusLabel(value: string) {
  const normalized = value.toLowerCase()
  if (['active', 'actif'].includes(normalized)) return 'Actif'
  if (normalized.includes('review')) return 'En revue'
  if (normalized.includes('approved')) return 'Validé'
  if (normalized.includes('converted')) return 'Converti'
  if (normalized.includes('open')) return 'Ouvert'
  if (normalized.includes('new')) return 'Nouveau'
  if (normalized.includes('pending')) return 'En attente'
  if (normalized.includes('sent')) return 'Envoyé'
  if (normalized.includes('archived')) return 'Archivé'
  return value || 'À suivre'
}

function hasPresenceData(data: Angelcare360DirectionCockpitData) {
  return data.attendance.expectedToday > 0
}

function hasFinanceData(data: Angelcare360DirectionCockpitData) {
  return data.finance.monthlyCollectionsMad > 0 || data.finance.outstandingMad > 0 || data.finance.pendingPaymentCount > 0
}

function hasParentTrustData(data: Angelcare360DirectionCockpitData) {
  return data.kpis.parentTrustScore !== null
}

export default function Angelcare360DirectionCockpit({ data }: Props) {
  const presenceReady = hasPresenceData(data)
  const financeReady = hasFinanceData(data)
  const parentTrustReady = hasParentTrustData(data)
  const financeTotal = safePositive(data.finance.monthlyCollectionsMad + data.finance.outstandingMad)
  const collectionRate = financeTotal > 0 ? Math.round((data.finance.monthlyCollectionsMad / financeTotal) * 100) : null

  const kpis: KpiCard[] = [
    {
      label: 'Taux de présence',
      value: presenceReady ? formatPercent(data.kpis.presenceRate) : 'À compléter',
      note: presenceReady
        ? `${data.attendance.presentToday} présent(s) · ${data.attendance.absentToday} absent(s) · ${data.attendance.lateToday} retard(s)`
        : 'Aucune présence pointée aujourd’hui',
      tone: presenceReady ? 'green' : 'slate',
      href: '/angelcare-360-command-center/presences/jour',
      state: presenceReady ? 'ready' : 'empty',
    },
    {
      label: 'Encaissements du mois',
      value: formatMad(data.kpis.monthlyCollectionsMad),
      note: financeReady
        ? data.finance.pendingPaymentCount
          ? `${data.finance.pendingPaymentCount} paiement(s) à valider`
          : `${data.finance.overdueInvoiceCount} facture(s) à suivre`
        : 'Aucun mouvement financier ce mois',
      tone: financeReady ? 'blue' : 'slate',
      href: '/angelcare-360-command-center/finance/paiements',
      state: financeReady ? 'ready' : 'empty',
    },
    {
      label: 'Admissions en cours',
      value: String(data.kpis.admissionsInProgress),
      note: data.kpis.admissionsInProgress > 0 ? 'Dossiers familles à suivre' : 'Aucune admission en attente',
      tone: data.kpis.admissionsInProgress > 0 ? 'purple' : 'slate',
      href: '/angelcare-360-command-center/admissions/pipeline',
      state: data.kpis.admissionsInProgress > 0 ? 'watch' : 'empty',
    },
    {
      label: 'Incidents ouverts',
      value: String(data.kpis.openIncidents),
      note: data.kpis.openIncidents > 0
        ? `${data.transport.incidentsToday} transport aujourd’hui · ${Math.max(0, data.kpis.openIncidents - data.transport.incidentsToday)} service`
        : 'Aucun incident ouvert',
      tone: data.kpis.openIncidents > 0 ? 'orange' : 'green',
      href: '/angelcare-360-command-center/reclamations/tickets',
      state: data.kpis.openIncidents > 0 ? 'watch' : 'ready',
    },
    {
      label: 'Confiance parents',
      value: parentTrustReady
        ? `${Math.max(0, Math.min(100, data.kpis.parentTrustScore || 0)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} / 100`
        : 'À consolider',
      note: parentTrustReady
        ? `${data.communication.openConversations} conversation(s) · ${data.communication.unreadMessages} message(s)`
        : 'Aucun signal parent exploitable',
      tone: parentTrustReady ? 'pink' : 'slate',
      href: '/angelcare-360-command-center/messagerie/conversations',
      state: parentTrustReady ? 'ready' : 'empty',
    },
  ]

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroTopStyle}>
          <div style={heroCopyStyle}>
            <div style={breadcrumbStyle}>Cockpit de Direction</div>
            <h1 style={heroTitleStyle}>{data.school.name}</h1>
            <p style={heroSubtitleStyle}>Vue d’ensemble claire des priorités, performances et actions du jour.</p>
          </div>
          <div style={heroActionsStyle}>
            <Badge tone={data.school.status === 'active' ? 'green' : 'orange'}>{data.school.status === 'active' ? 'Actif' : statusLabel(data.school.status)}</Badge>
            <Badge tone="blue">{data.school.academicYearLabel || 'Année à configurer'}</Badge>
            <Badge tone="slate">{data.school.timezone}</Badge>
          </div>
        </div>

        <nav aria-label="Sections du cockpit" style={tabsStyle}>
          {[
            ['Vue d’ensemble', '#overview'],
            ['Scolarité', '#academics'],
            ['Finances', '#finance'],
            ['Opérations', '#operations'],
            ['Communication', '#communication'],
            ['Qualité', '#quality'],
            ['Paramètres', '/angelcare-360-command-center/administration/parametres'],
          ].map(([label, href], index) => (
            <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>
              {label}
            </Link>
          ))}
        </nav>
      </section>

      <section id="overview" style={kpiGridStyle}>
        {kpis.map((item) => (
          <KpiCardView key={item.label} item={item} />
        ))}
      </section>

      <section style={commandBarStyle} aria-label="Actions rapides direction">
        <ActionLink href="/angelcare-360-command-center/admissions/demandes" primary>Nouvelle admission</ActionLink>
        <ActionLink href="/angelcare-360-command-center/finance/paiements">Enregistrer un paiement</ActionLink>
        <ActionLink href="/angelcare-360-command-center/finance/factures">Générer une facture</ActionLink>
        <ActionLink href="/angelcare-360-command-center/rapports/catalogue">Ouvrir les rapports</ActionLink>
        <ActionLink href="/angelcare-360-command-center/messagerie/annonces">Envoyer une annonce</ActionLink>
        <ActionLink href="/angelcare-360-command-center/reclamations/tickets">Traiter les alertes</ActionLink>
      </section>

      <section style={dashboardGridStyle}>
        <Panel
          id="admissions"
          eyebrow="Admissions récentes"
          title="Parcours familles à suivre"
          actionHref="/angelcare-360-command-center/admissions/demandes"
          actionLabel="Ouvrir Admissions"
        >
          {data.recentAdmissions.length ? (
            <div style={listStyle}>
              {data.recentAdmissions.map((item) => (
                <Link key={item.id} href={item.href} style={personRowStyle}>
                  <Avatar initials={initials(item.label)} tone="purple" />
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{item.label}</strong>
                    <span style={rowMetaStyle}>{item.level} · {item.dateLabel}</span>
                  </span>
                  <span style={statusPillStyle}>{statusLabel(item.status)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyLine text="Aucune admission récente à afficher." href="/angelcare-360-command-center/admissions/demandes" actionLabel="Ouvrir Admissions" />
          )}
        </Panel>

        <Panel
          id="finance"
          eyebrow="Situation financière"
          title="Encaissements & créances"
          actionHref="/angelcare-360-command-center/finance"
          actionLabel="Voir la finance"
        >
          <div style={financeLayoutStyle}>
            <div style={financeMainStyle}>
              <div style={financeCaptionStyle}>Encaissements du mois</div>
              <div style={financeValueStyle}>{formatMad(data.finance.monthlyCollectionsMad)}</div>
              <ProgressBar value={collectionRate ?? 0} tone={financeReady ? 'blue' : 'slate'} />
              <div style={financeFootStyle}>
                {financeReady
                  ? collectionRate !== null
                    ? `${collectionRate}% du flux financier identifié`
                    : `${data.finance.overdueInvoiceCount} facture(s) à relancer`
                  : 'Aucune donnée financière consolidée'}
              </div>
            </div>
            <div style={donutWrapStyle} aria-label="Répartition financière">
              <div
                style={{
                  ...donutStyle,
                  background: financeReady
                    ? `conic-gradient(#2563eb ${collectionRate || 0}%, #f97316 ${collectionRate || 0}% ${Math.min(100, (collectionRate || 0) + 18)}%, #ef4444 0)`
                    : 'conic-gradient(#e2e8f0 100%, #e2e8f0 0)',
                }}
              >
                <span style={donutLabelStyle}>{financeReady ? (data.finance.outstandingMad > 0 ? 'À suivre' : 'À jour') : 'Vide'}</span>
              </div>
              <div style={donutLegendStyle}>
                <span><Dot color="#2563eb" /> encaissé</span>
                <span><Dot color="#f97316" /> en attente</span>
                <span><Dot color="#ef4444" /> dû</span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          id="operations"
          eyebrow="Assiduité moyenne"
          title="Présence du jour"
          actionHref="/angelcare-360-command-center/presences"
          actionLabel="Voir les présences"
        >
          {presenceReady ? (
            <>
              <div style={attendanceValueStyle}>{formatPercent(data.attendance.presenceRate)}</div>
              <div style={barChartStyle} aria-label="Indicateurs de présence">
                <Bar label="Présents" value={data.attendance.presentToday} total={data.attendance.expectedToday} tone="green" />
                <Bar label="Absents" value={data.attendance.absentToday} total={data.attendance.expectedToday} tone="red" />
                <Bar label="Retards" value={data.attendance.lateToday} total={data.attendance.expectedToday} tone="orange" />
              </div>
            </>
          ) : (
            <EmptyBlock title="Présences non pointées" description="Le cockpit affichera le taux dès que la journée sera ouverte et les pointages enregistrés." href="/angelcare-360-command-center/presences/jour" actionLabel="Ouvrir Présences" />
          )}
        </Panel>

        <Panel
          id="communication"
          eyebrow="Messages des parents"
          title="Conversations récentes"
          actionHref="/angelcare-360-command-center/messagerie/conversations"
          actionLabel="Ouvrir Messagerie"
        >
          {data.recentMessages.length ? (
            <div style={listStyle}>
              {data.recentMessages.map((message) => (
                <Link key={message.id} href={message.href} style={messageRowStyle}>
                  <Avatar initials={message.subject.slice(0, 2)} tone="blue" />
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{message.subject}</strong>
                    <span style={rowMetaStyle}>{message.bodyPreview}</span>
                  </span>
                  <span style={messageTimeStyle}>{message.dateLabel}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyLine text="Aucun message récent à traiter." href="/angelcare-360-command-center/messagerie/conversations" actionLabel="Ouvrir Messagerie" />
          )}
        </Panel>

        <Panel
          id="academics"
          eyebrow="Statut académique"
          title="Structure scolaire"
          actionHref="/angelcare-360-command-center/academique"
          actionLabel="Voir Scolarité"
          wide
        >
          <div style={academicGridStyle}>
            <Ring value={data.academics.dossierCompletionRate} label="Dossiers" />
            <Metric label="Élèves actifs" value={data.academics.activeStudents} />
            <Metric label="Parents actifs" value={data.academics.activeParents} />
            <Metric label="Classes actives" value={data.academics.activeClasses} />
            <Metric label="Enseignants" value={data.academics.activeTeachers} />
          </div>
        </Panel>

        <Panel
          eyebrow="Transport"
          title="Disponibilité & sécurité"
          actionHref="/angelcare-360-command-center/transport"
          actionLabel="Voir Transport"
        >
          <div style={transportStackStyle}>
            <TransportLine label="Circuits actifs" value={`${data.transport.activeRoutes}`} tone="blue" />
            <TransportLine label="Véhicules actifs" value={`${data.transport.activeVehicles}`} tone="green" />
            <TransportLine label="Affectations" value={`${data.transport.activeAssignments}`} tone="purple" />
            <TransportLine label="Incidents aujourd’hui" value={`${data.transport.incidentsToday}`} tone={data.transport.incidentsToday ? 'orange' : 'green'} />
          </div>
        </Panel>

        <Panel
          id="quality"
          eyebrow="Alertes & actions requises"
          title="Priorités direction"
          actionHref="/angelcare-360-command-center/reclamations/tickets"
          actionLabel="Traiter les alertes"
        >
          {data.alerts.length ? (
            <div style={listStyle}>
              {data.alerts.slice(0, 4).map((alert) => (
                <Link key={alert.id} href={alert.href} style={alertRowStyle(alert.tone)}>
                  <span style={{ ...alertIconStyle, ...alertToneStyle(alert.tone) }}>!</span>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{alert.title}</strong>
                    <span style={rowMetaStyle}>{alert.detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyLine text="Aucune priorité bloquante détectée." href="/angelcare-360-command-center/rapports" actionLabel="Voir les rapports" />
          )}
        </Panel>

        <Panel
          eyebrow="Flux d’activité"
          title="Derniers mouvements"
          actionHref="/angelcare-360-command-center/administration/audit"
          actionLabel="Voir Audit"
        >
          {data.recentActivities.length ? (
            <div style={activityListStyle}>
              {data.recentActivities.map((activity) => (
                <div key={activity.id} style={activityRowStyle}>
                  <span style={activityDotStyle(activity.severity)} />
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{activity.label}</strong>
                    <span style={rowMetaStyle}>{activity.module} · {activity.dateLabel}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyLine text="Aucune activité récente enregistrée." href="/angelcare-360-command-center/administration/audit" actionLabel="Voir Audit" />
          )}
        </Panel>
      </section>

      {data.queryWarnings.length > 0 ? (
        <section style={qualityNoteStyle}>
          <strong>Données à compléter.</strong> Certaines sources métier ne sont pas encore disponibles pour cet établissement. Les zones concernées restent vides plutôt que d’afficher des chiffres non vérifiés.
        </section>
      ) : null}
    </div>
  )
}

function KpiCardView({ item }: { item: KpiCard }) {
  return (
    <Link href={item.href} style={{ ...kpiCardStyle, ...toneBorder(item.tone), ...(item.state === 'empty' ? kpiEmptyStyle : null) }}>
      <div style={kpiIconRowStyle}>
        <span style={{ ...iconBubbleStyle, ...toneBubble(item.tone) }}>{iconForTone(item.tone)}</span>
        <MiniSpark tone={item.tone} state={item.state || 'ready'} />
      </div>
      <div style={kpiLabelStyle}>{item.label}</div>
      <div style={{ ...kpiValueStyle, ...(item.state === 'empty' ? mutedValueStyle : null) }}>{item.value}</div>
      <div style={kpiNoteStyle}>{item.note}</div>
    </Link>
  )
}

function Panel({ eyebrow, title, actionHref, actionLabel, children, wide, id }: { eyebrow: string; title: string; actionHref: string; actionLabel: string; children: ReactNode; wide?: boolean; id?: string }) {
  return (
    <article id={id} style={{ ...panelStyle, ...(wide ? widePanelStyle : null) }}>
      <div style={panelHeaderStyle}>
        <div style={{ minWidth: 0 }}>
          <div style={panelEyebrowStyle}>{eyebrow}</div>
          <h2 style={panelTitleStyle}>{title}</h2>
        </div>
        <Link href={actionHref} style={panelActionStyle}>{actionLabel} →</Link>
      </div>
      {children}
    </article>
  )
}

function ActionLink({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return <Link href={href} style={primary ? primaryActionStyle : actionButtonStyle}>{children}</Link>
}

function Badge({ children, tone }: { children: ReactNode; tone: 'green' | 'blue' | 'slate' | 'orange' }) {
  const styles = {
    green: { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' },
    blue: { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
    slate: { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' },
    orange: { background: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa' },
  }
  return <span style={{ ...badgeStyle, ...styles[tone] }}>{children}</span>
}

function Avatar({ initials: value, tone }: { initials: string; tone: Tone }) {
  return <span style={{ ...avatarStyle, ...toneBubble(tone) }}>{value.slice(0, 2).toUpperCase()}</span>
}

function EmptyLine({ text, href, actionLabel }: { text: string; href: string; actionLabel: string }) {
  return (
    <Link href={href} style={emptyLineStyle}>
      <span>{text}</span>
      <strong>{actionLabel}</strong>
    </Link>
  )
}

function EmptyBlock({ title, description, href, actionLabel }: { title: string; description: string; href: string; actionLabel: string }) {
  return (
    <Link href={href} style={emptyBlockStyle}>
      <span style={emptyBlockIconStyle}>○</span>
      <strong>{title}</strong>
      <span>{description}</span>
      <em>{actionLabel} →</em>
    </Link>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={metricStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricLabelStyle}>{label}</div>
    </div>
  )
}

function Ring({ value, label }: { value: number | null; label: string }) {
  const safeValue = value === null ? 0 : Math.max(0, Math.min(100, value))
  return (
    <div style={ringWrapStyle}>
      <div style={{ ...ringStyle, background: value === null ? '#e2e8f0' : `conic-gradient(#22c55e ${safeValue}%, #e2e8f0 0)` }}>
        <div style={ringInnerStyle}>{value === null ? 'À compléter' : formatPercent(value)}</div>
      </div>
      <div style={ringLabelStyle}>{label}</div>
    </div>
  )
}

function MiniSpark({ tone, state }: { tone: Tone; state: 'ready' | 'empty' | 'watch' }) {
  const color = state === 'empty' ? '#cbd5e1' : toneColor(tone)
  const heights = state === 'watch' ? [22, 30, 36, 28, 42] : state === 'empty' ? [18, 18, 18, 18, 18] : [22, 28, 24, 32, 38]
  return (
    <span style={sparkStyle} aria-hidden="true">
      {heights.map((height, index) => <span key={index} style={{ ...sparkBarStyle, height, background: color }} />)}
    </span>
  )
}

function ProgressBar({ value, tone }: { value: number; tone: Tone }) {
  return (
    <div style={progressTrackStyle}>
      <span style={{ ...progressValueStyle, width: `${Math.max(0, Math.min(100, value))}%`, background: toneColor(tone) }} />
    </div>
  )
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: Tone }) {
  const percent = Math.round((value / Math.max(total, 1)) * 100)
  return (
    <div style={barRowStyle}>
      <span style={barLabelStyle}>{label}</span>
      <span style={barTrackStyle}><span style={{ ...barValueStyle, width: `${percent}%`, background: toneColor(tone) }} /></span>
      <strong style={barNumberStyle}>{value}</strong>
    </div>
  )
}

function Dot({ color }: { color: string }) {
  return <span style={{ ...dotStyle, background: color }} />
}

function TransportLine({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div style={transportLineStyle}>
      <span style={{ ...transportIconStyle, ...toneBubble(tone) }}>●</span>
      <span style={rowMainStyle}><strong style={rowTitleStyle}>{label}</strong></span>
      <strong style={transportValueStyle}>{value}</strong>
    </div>
  )
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'AC'
  return `${parts[0]?.[0] || 'A'}${parts[1]?.[0] || parts[0]?.[1] || 'C'}`
}

function iconForTone(tone: Tone) {
  if (tone === 'green') return '✓'
  if (tone === 'orange') return '!'
  if (tone === 'red') return '×'
  if (tone === 'purple') return '↗'
  if (tone === 'pink') return '♡'
  if (tone === 'slate') return '○'
  return '•'
}

function toneColor(tone: Tone) {
  return {
    blue: '#2563eb',
    green: '#22c55e',
    orange: '#f97316',
    red: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    slate: '#94a3b8',
  }[tone]
}

function toneBubble(tone: Tone): CSSProperties {
  return {
    blue: { background: '#eff6ff', color: '#2563eb' },
    green: { background: '#dcfce7', color: '#15803d' },
    orange: { background: '#ffedd5', color: '#c2410c' },
    red: { background: '#fee2e2', color: '#dc2626' },
    purple: { background: '#f3e8ff', color: '#7c3aed' },
    pink: { background: '#fce7f3', color: '#db2777' },
    slate: { background: '#f1f5f9', color: '#64748b' },
  }[tone]
}

function toneBorder(tone: Tone): CSSProperties {
  return { borderColor: `${toneColor(tone)}26` }
}

function alertToneStyle(tone: AlertTone): CSSProperties {
  return {
    danger: { background: '#fee2e2', color: '#dc2626' },
    warning: { background: '#ffedd5', color: '#c2410c' },
    info: { background: '#eff6ff', color: '#2563eb' },
    success: { background: '#dcfce7', color: '#15803d' },
  }[tone]
}

function alertRowStyle(tone: AlertTone): CSSProperties {
  return {
    ...baseListLinkStyle,
    borderColor: tone === 'danger' ? '#fecaca' : tone === 'warning' ? '#fed7aa' : tone === 'success' ? '#bbf7d0' : '#bfdbfe',
    background: tone === 'danger' ? '#fff7f7' : tone === 'warning' ? '#fffaf3' : '#fff',
  }
}

function activityDotStyle(severity: string): CSSProperties {
  const normalized = severity.toLowerCase()
  const color = normalized.includes('critical') || normalized.includes('warning') ? '#f97316' : normalized.includes('error') ? '#ef4444' : '#22c55e'
  return { ...activityDotBaseStyle, background: color }
}

const pageStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
  width: '100%',
  maxWidth: '100%',
  overflowX: 'hidden',
  boxSizing: 'border-box',
}

const heroStyle: CSSProperties = {
  minWidth: 0,
  borderRadius: 26,
  border: '1px solid #dbe4ef',
  background: 'linear-gradient(135deg, rgba(255,255,255,.98) 0%, rgba(248,251,255,.96) 100%)',
  boxShadow: '0 22px 64px rgba(15,23,42,.07)',
  padding: 22,
}

const heroTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  minWidth: 0,
}

const heroCopyStyle: CSSProperties = {
  minWidth: 0,
  flex: '1 1 520px',
}

const breadcrumbStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: '.04em',
}

const heroTitleStyle: CSSProperties = {
  margin: '10px 0 0',
  color: '#0f172a',
  fontSize: 'clamp(28px, 2.4vw, 38px)',
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: -0.8,
}

const heroSubtitleStyle: CSSProperties = {
  margin: '8px 0 0',
  color: '#64748b',
  fontWeight: 650,
}

const heroActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid',
  borderRadius: 999,
  padding: '7px 11px',
  fontSize: 12,
  fontWeight: 900,
}

const tabsStyle: CSSProperties = {
  display: 'flex',
  gap: 22,
  marginTop: 20,
  borderBottom: '1px solid #e2e8f0',
  overflowX: 'auto',
}

const tabStyle: CSSProperties = {
  color: '#64748b',
  textDecoration: 'none',
  fontWeight: 850,
  fontSize: 13,
  padding: '0 0 12px',
  whiteSpace: 'nowrap',
  borderBottom: '3px solid transparent',
}

const activeTabStyle: CSSProperties = {
  color: '#2563eb',
  borderBottomColor: '#2563eb',
}

const kpiGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
  gap: 14,
  minWidth: 0,
}

const kpiCardStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: 8,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 40px rgba(15,23,42,.06)',
  padding: 18,
  textDecoration: 'none',
}

const kpiEmptyStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #fff 0%, #f8fafc 100%)',
}

const kpiIconRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}

const iconBubbleStyle: CSSProperties = {
  width: 44,
  height: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 15,
  fontWeight: 950,
  fontSize: 20,
}

const kpiLabelStyle: CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 850,
}

const kpiValueStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 26,
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: -0.6,
}

const mutedValueStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 22,
}

const kpiNoteStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
}

const sparkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'end',
  gap: 3,
  height: 44,
}

const sparkBarStyle: CSSProperties = {
  display: 'inline-block',
  width: 5,
  borderRadius: 999,
  opacity: .72,
}

const commandBarStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
  border: '1px solid #dbe4ef',
  borderRadius: 22,
  background: '#fff',
  boxShadow: '0 14px 38px rgba(15,23,42,.05)',
  padding: 12,
  minWidth: 0,
}

const primaryActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  borderRadius: 13,
  padding: '0 16px',
  color: '#fff',
  background: '#2563eb',
  border: '1px solid #2563eb',
  textDecoration: 'none',
  fontWeight: 900,
  boxShadow: '0 12px 24px rgba(37,99,235,.22)',
}

const actionButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  borderRadius: 13,
  padding: '0 15px',
  color: '#0f172a',
  background: '#fff',
  border: '1px solid #dbe4ef',
  textDecoration: 'none',
  fontWeight: 850,
}

const dashboardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
  gap: 16,
  minWidth: 0,
}

const panelStyle: CSSProperties = {
  gridColumn: 'span 4',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 42px rgba(15,23,42,.055)',
  padding: 16,
  overflow: 'hidden',
}

const widePanelStyle: CSSProperties = {
  gridColumn: 'span 6',
}

const panelHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
}

const panelEyebrowStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
}

const panelTitleStyle: CSSProperties = {
  margin: '4px 0 0',
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
  lineHeight: 1.15,
}

const panelActionStyle: CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: 'nowrap',
}

const listStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const baseListLinkStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 10,
  textDecoration: 'none',
}

const personRowStyle: CSSProperties = {
  ...baseListLinkStyle,
  background: '#fff',
}

const messageRowStyle: CSSProperties = {
  ...baseListLinkStyle,
  background: '#f8fbff',
}

const avatarStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 13,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 950,
  flex: '0 0 auto',
}

const rowMainStyle: CSSProperties = {
  minWidth: 0,
  display: 'grid',
  gap: 3,
  flex: '1 1 auto',
}

const rowTitleStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 13,
  lineHeight: 1.2,
}

const rowMetaStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 650,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const statusPillStyle: CSSProperties = {
  color: '#166534',
  background: '#dcfce7',
  borderRadius: 999,
  padding: '5px 9px',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap',
}

const messageTimeStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

const emptyLineStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: '1px dashed #cbd5e1',
  borderRadius: 18,
  padding: 18,
  color: '#64748b',
  textDecoration: 'none',
  fontWeight: 750,
  background: '#fbfdff',
}

const emptyBlockStyle: CSSProperties = {
  minHeight: 132,
  display: 'grid',
  alignContent: 'center',
  gap: 8,
  border: '1px dashed #cbd5e1',
  borderRadius: 18,
  padding: 18,
  color: '#64748b',
  textDecoration: 'none',
  fontWeight: 750,
  background: '#fbfdff',
}

const emptyBlockIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  background: '#eff6ff',
  color: '#2563eb',
  fontStyle: 'normal',
}

const financeLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 148px',
  gap: 14,
  alignItems: 'center',
}

const financeMainStyle: CSSProperties = {
  minWidth: 0,
}

const financeCaptionStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 850,
}

const financeValueStyle: CSSProperties = {
  marginTop: 6,
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 950,
  letterSpacing: -0.6,
}

const financeFootStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 750,
  marginTop: 8,
}

const progressTrackStyle: CSSProperties = {
  height: 9,
  borderRadius: 999,
  background: '#e2e8f0',
  overflow: 'hidden',
  marginTop: 14,
}

const progressValueStyle: CSSProperties = {
  display: 'block',
  height: '100%',
  borderRadius: 999,
}

const donutWrapStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  gap: 8,
}

const donutStyle: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  position: 'relative',
}

const donutLabelStyle: CSSProperties = {
  width: 62,
  height: 62,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: '#fff',
  color: '#0f172a',
  fontSize: 11,
  fontWeight: 950,
  textAlign: 'center',
}

const donutLegendStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  color: '#64748b',
  fontSize: 11,
  fontWeight: 750,
}

const dotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
  display: 'inline-block',
  marginRight: 5,
}

const attendanceValueStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 30,
  fontWeight: 950,
  marginBottom: 16,
}

const barChartStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const barRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '80px minmax(0, 1fr) 34px',
  alignItems: 'center',
  gap: 10,
}

const barLabelStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 850,
}

const barTrackStyle: CSSProperties = {
  height: 9,
  background: '#e2e8f0',
  borderRadius: 999,
  overflow: 'hidden',
}

const barValueStyle: CSSProperties = {
  display: 'block',
  height: '100%',
  borderRadius: 999,
}

const barNumberStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 12,
  textAlign: 'right',
}

const academicGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '150px repeat(4, minmax(90px, 1fr))',
  gap: 12,
  alignItems: 'stretch',
}

const ringWrapStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  gap: 8,
}

const ringStyle: CSSProperties = {
  width: 104,
  height: 104,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
}

const ringInnerStyle: CSSProperties = {
  width: 70,
  height: 70,
  borderRadius: '50%',
  background: '#fff',
  color: '#0f172a',
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  fontSize: 13,
  fontWeight: 950,
}

const ringLabelStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 850,
}

const metricStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 13,
  display: 'grid',
  alignContent: 'center',
  gap: 4,
  background: '#fbfdff',
}

const metricValueStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const metricLabelStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800,
}

const transportStackStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const transportLineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  padding: 11,
}

const transportIconStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 11,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
}

const transportValueStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 16,
  fontWeight: 950,
}

const alertIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 13,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 950,
  flex: '0 0 auto',
}

const activityListStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
}

const activityRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 0',
  borderBottom: '1px solid #eef2f7',
}

const activityDotBaseStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  flex: '0 0 auto',
}

const qualityNoteStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid #fed7aa',
  background: '#fff7ed',
  color: '#9a3412',
  padding: 14,
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 750,
}

