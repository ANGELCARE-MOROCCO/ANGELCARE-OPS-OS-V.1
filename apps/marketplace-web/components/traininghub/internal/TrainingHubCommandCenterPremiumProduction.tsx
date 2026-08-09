'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

type Snapshot = {
  counts?: Record<string, number>
  rows?: Array<{ key: string; table: string; label: string; count: number; error?: string }>
  recent?: Array<{ id: string; label: string; title: string; subtitle: string; date: string }>
  score?: { health?: number; certification_rate?: number; conversion_rate?: number; presence_rate?: number }
  finance?: { revenue_mad?: number; forecast_mad?: number }
  alerts?: { high_risks?: number; partners_at_risk?: number; sla_rate?: number }
  generated_at?: string
  warning?: string
}

const SIDEBAR = [
  {
    group: 'Pilotage',
    items: [
      { label: 'Command Center', href: '/traininghub', icon: '⌘', active: true },
    ],
  },
  {
    group: 'Partenaires',
    items: [
      { label: 'Partenaires', href: '/traininghub/partners', icon: '◉' },
      { label: 'Dossier partenaire', href: '/traininghub/partners', icon: '▦' },
    ],
  },
  {
    group: 'Revenus',
    items: [
      { label: 'Commercial', href: '/traininghub/commercial', icon: '◆' },
      { label: 'Offres', href: '/traininghub/offres', icon: '▱' },
      { label: 'Commandes', href: '/traininghub/orders', icon: '◈' },
      { label: 'Facturation', href: '/traininghub/billing', icon: '◌' },
      { label: 'Crédits formation', href: '/traininghub/credits', icon: '◇' },
    ],
  },
  {
    group: 'Catalogue',
    items: [
      { label: 'Catalogue', href: '/traininghub/catalogue', icon: '▤' },
      { label: 'Catégories', href: '/traininghub/categories', icon: '◫' },
      { label: 'Sessions', href: '/traininghub/sessions', icon: '◷' },
      { label: 'Participants', href: '/traininghub/participants', icon: '●' },
      { label: 'Formateurs', href: '/traininghub/trainers', icon: '▲' },
      { label: 'Inscriptions', href: '/traininghub/attendance', icon: '✓' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { label: 'Certificats', href: '/traininghub/certificates', icon: '✦' },
      { label: 'Documents', href: '/traininghub/documents', icon: '▣' },
      { label: 'Batch', href: '/traininghub/reports', icon: '▧' },
      { label: 'Qualité', href: '/traininghub/quality', icon: '★' },
      { label: 'Rapports', href: '/traininghub/reports', icon: '▥' },
    ],
  },
  {
    group: 'Pilotage partenaires',
    items: [
      { label: 'Demandes partenaires', href: '/traininghub/requests', icon: '✉' },
      { label: 'Notifications', href: '/traininghub/notifications', icon: '◔' },
    ],
  },
]

const CHAIN = [
  ['01', 'Partenaires', 'partners'],
  ['02', 'Offres', 'proposals'],
  ['03', 'Commandes', 'orders'],
  ['04', 'Factures', 'invoices'],
  ['05', 'Crédits', 'credits'],
  ['06', 'Sessions', 'sessions'],
  ['07', 'Présence', 'participants'],
  ['08', 'Certificat', 'certificates'],
  ['09', 'Archivage', 'documents'],
]

const MODULE_STATUS = [
  ['Partenaires', 'partners'],
  ['Commercial', 'proposals'],
  ['Delivery', 'sessions'],
  ['Finances', 'invoices'],
  ['Qualité', 'certificates'],
]

function formatNumber(value: unknown) {
  return new Intl.NumberFormat('fr-MA').format(Number(value || 0))
}

function formatMoney(value: unknown) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 1 }).format(Number(value || 0) / 1000)} K MAD`
}

function safeDate(value?: string) {
  if (!value) return 'Aujourd’hui'
  try {
    return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return 'Aujourd’hui'
  }
}

export default function TrainingHubCommandCenterPremiumProduction() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/traininghub/internal/command-center', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      setSnapshot(payload?.data || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = snapshot?.counts || {}
  const score = snapshot?.score || {}
  const finance = snapshot?.finance || {}
  const alerts = snapshot?.alerts || {}
  const health = Number(score.health || 86)

  const kpis = useMemo(() => [
    { icon: '👥', label: 'Partenaires actifs', value: counts.partners || 0, note: 'vs mois précédent', delta: '+6' },
    { icon: '📄', label: 'Offres ouvertes', value: counts.proposals || 0, note: 'vs mois précédent', delta: '+4' },
    { icon: '🏫', label: 'Commandes confirmées', value: counts.orders || 0, note: 'vs mois précédent', delta: '+2' },
    { icon: '🧾', label: 'Factures à livrer', value: counts.invoices || 0, note: 'MAD à suivre', delta: formatMoney((counts.invoices || 0) * 8200) },
    { icon: '💳', label: 'Crédits disponibles', value: counts.credits || 0, note: 'valeur formation', delta: formatMoney((counts.credits || 0) * 4000) },
    { icon: '🗓', label: 'Sessions à venir', value: counts.sessions || 0, note: 'cette semaine', delta: '+6' },
    { icon: '🛡', label: 'Certificats émis', value: counts.certificates || 0, note: 'vs mois précédent', delta: '+4' },
    { icon: '📬', label: 'Demandes ouvertes', value: counts.requests || 0, note: 'à traiter', delta: '+3' },
  ], [counts])

  return (
    <main style={pageStyle}>
      <aside style={sidebarStyle}>
        <div style={logoBlockStyle}>
          <img src="/logo.png" alt="AngelCare" style={logoStyle} />
          <div style={brandTextStyle}>
            <strong>TrainingHub</strong>
            <span>Portail partenaires</span>
          </div>
        </div>

        <nav style={sidebarNavStyle}>
          {SIDEBAR.map((group) => (
            <div key={group.group} style={navGroupStyle}>
              <div style={navGroupTitleStyle}>{group.group}</div>
              {group.items.map((item) => (
                <Link key={`${group.group}-${item.label}`} href={item.href} style={('active' in item && Boolean(item.active)) ? navActiveStyle : navItemStyle}>
                  <span style={navIconStyle}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <button style={collapseStyle} type="button">‹ Réduire</button>
      </aside>

      <section style={mainStyle}>
        <header style={topbarStyle}>
          <div>
            <h1 style={topbarTitleStyle}>TrainingHub Command Center</h1>
            <p style={topbarSubtitleStyle}>Pilotage central des partenaires, revenus, sessions, certificats, demandes, risques et opérations.</p>
          </div>

          <div style={topbarActionsStyle}>
            <button style={ghostButtonStyle} type="button">▣ Vue portefeuille</button>
            <button style={primaryButtonStyle} type="button">✦ Action prioritaire</button>
            <button style={ghostButtonStyle} type="button">⌁ Filtres</button>
            <label style={searchStyle}>
              <span>⌕</span>
              <input placeholder="Rechercher…" style={searchInputStyle} />
            </label>
            <button style={ghostButtonStyle} type="button">▣ Exporter</button>
            <div style={profileStyle}>
              <strong>MC</strong>
              <span>Marie Carbonneau<br /><small>Admin système</small></span>
            </div>
          </div>
        </header>

        {snapshot?.warning ? <div style={warningStyle}>{snapshot.warning}</div> : null}

        <section style={heroGridStyle}>
          <div style={heroCardStyle}>
            <div style={heroCurveStyle} />
            <div style={heroCopyStyle}>
              <span style={welcomeStyle}>Bienvenue Marie</span>
              <h2 style={heroTitleStyle}>Pilotez vos partenaires, revenus, sessions, certificats, demandes, risques et opérations en temps réel.</h2>
              <p style={heroLeadStyle}>Chaîne opérationnelle intégrée du partenariat à la délivrance et au renouvellement.</p>
            </div>
          </div>

          <div style={overviewCardStyle}>
            <div style={miniHeaderStyle}>
              <strong>Vue d’ensemble</strong>
              <button style={miniSelectStyle}>Ce mois-ci⌄</button>
            </div>
            <div style={overviewMetricsStyle}>
              <MiniMetric label="Chiffre d’affaires" value={formatMoney(finance.revenue_mad || 0)} delta="+4,8%" />
              <MiniMetric label="Sessions délivrées" value={counts.sessions || 0} delta="+9,5%" />
              <MiniMetric label="Taux de certification" value={`${score.certification_rate || 0}%`} delta="+4,3pts" />
            </div>
          </div>

          <HealthCard score={health} />
        </section>

        <section style={kpiGridStyle}>
          {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
        </section>

        <section style={chainCardStyle}>
          <div style={sectionTopStyle}>
            <div>
              <strong>Chaîne opérationnelle</strong>
              <span> — De la relation partenaire au certificat</span>
            </div>
            <button style={linkButtonStyle}>Voir le détail de la chaîne ›</button>
          </div>
          <div style={chainStyle}>
            {CHAIN.map(([index, label, key], i) => (
              <div key={label} style={chainStepWrapStyle}>
                <div style={chainStepStyle}>
                  <span>{index}</span>
                  <strong>{label}</strong>
                  <small>{formatNumber(counts[key] || 0)} {i === 0 ? 'actifs' : i === 8 ? 'à traiter' : ''}</small>
                </div>
                {i < CHAIN.length - 1 ? <div style={arrowStyle}>→</div> : null}
              </div>
            ))}
          </div>
        </section>

        <section style={dashboardGridStyle}>
          <div style={leftContentStyle}>
            <section style={commandSectionStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h3 style={sectionTitleStyle}>Centre de commandement opérationnel</h3>
                  <p style={sectionSubtitleStyle}>Suivez la performance, les alertes et les actions de délivrance de bout en bout.</p>
                </div>
              </div>

              <div style={cardsGridStyle}>
                <Panel title="Portefeuille partenaires — Pipeline" footer="Voir tous les partenaires">
                  <div style={donutRowStyle}>
                    <div style={donutStyle}>
                      <span>{formatNumber(counts.partners || 0)}</span>
                      <small>Actifs</small>
                    </div>
                    <div style={legendStyle}>
                      <Legend color="#064ee4" label="Actifs" value={`${counts.partners || 0} (52%)`} />
                      <Legend color="#4d8dff" label="En croissance" value="32 (21%)" />
                      <Legend color="#9fc0ff" label="À risque" value={`${alerts.partners_at_risk || 0} (20%)`} />
                      <Legend color="#d8e5ff" label="Inactifs" value="56 (22%)" />
                    </div>
                  </div>
                </Panel>

                <Panel title="Suivi commercial — Conversion" right="Ce mois-ci⌄" footer="Voir le tunnel commercial">
                  <BarRow label="Offres créées" value={counts.proposals || 0} width={78} delta="+2,1pts" />
                  <BarRow label="Taux de conversion" value={`${score.conversion_rate || 0}%`} width={74} delta="+2,1pts" />
                  <BarRow label="Commandes confirmées" value={counts.orders || 0} width={70} delta="+3" />
                  <BarRow label="Montant commandé" value={formatMoney(finance.revenue_mad || 0)} width={54} delta="+15%" />
                </Panel>

                <Panel title="Planning — Sessions à venir" right="2 prochaines semaines⌄" footer="Voir toutes les sessions">
                  <SessionRow title="Sécurité des dirigeants" date="19 juin 2025 • Casablanca" count="12" />
                  <SessionRow title="Leadership exécutif" date="05 juin 2025 • Rabat" count="8" />
                  <SessionRow title="Gestion de crise" date="10 juin 2025 • Online" count="15" />
                  <SessionRow title="Pilotage stratégique" date="18 juin 2025 • Tanger" count="7" />
                </Panel>

                <Panel title="Puissance & Certifications" footer="Voir le détail des performances">
                  <div style={smallChartGridStyle}>
                    <SmallChart label="Taux de présence" value={`${score.presence_rate || 0}%`} />
                    <SmallChart label="Taux de certification" value={`${score.certification_rate || 0}%`} />
                  </div>
                </Panel>

                <Panel title="Demandes partenaires" footer="Voir toutes les demandes">
                  <RequestRow title="Accès catalogue personnalisé" partner="Partenaire Alpha • 10 juin 2025" status="En cours" tone="red" />
                  <RequestRow title="Ajout formateur agréé" partner="Partenaire Beta • 9 juin 2025" status="Prioritaire" tone="amber" />
                  <RequestRow title="Report session entreprise" partner="Partenaire Gamma • 8 juin 2025" status="Basse" tone="green" />
                </Panel>

                <Panel title="Activité récente" right="⌁ Filtrer" footer="Voir toute l’activité">
                  {(snapshot?.recent?.length ? snapshot.recent : [
                    { id: '1', label: 'Commande', title: 'Commande CMD-2025-064 confirmée', subtitle: 'Partenaire Alpha', date: '' },
                    { id: '2', label: 'Session', title: 'Session Leadership exécutif créée', subtitle: 'Partenaire Beta', date: '' },
                    { id: '3', label: 'Certificat', title: 'Certificat délivré', subtitle: 'Partenaire Gamma', date: '' },
                    { id: '4', label: 'Facture', title: 'Facture FAC-2025-023 générée', subtitle: 'Partenaire Delta', date: '' },
                  ]).slice(0, 4).map((item) => <ActivityRow key={item.id || item.title} {...item} />)}
                </Panel>
              </div>
            </section>
          </div>

          <aside style={rightRailStyle}>
            <RightCard title="SLA & Risques">
              <RiskLine label="SLA respectés" value={`${alerts.sla_rate || 92.1}%`} tone="green" />
              <RiskLine label="Risques élevés" value={alerts.high_risks || 3} tone="red" />
              <RiskLine label="Partenaires à risque" value={alerts.partners_at_risk || 5} tone="amber" />
              <button style={rightLinkStyle}>Voir le registre des risques</button>
            </RightCard>

            <RightCard title="État des modules" action="Tous les modules⌄">
              {MODULE_STATUS.map(([label, key]) => (
                <ModuleLine key={label} label={label} active={Boolean(counts[key] || key === 'partners')} />
              ))}
            </RightCard>

            <RightCard title="Alertes prioritaires" badge={alerts.high_risks || 3}>
              <AlertLine text="3 factures en retard de paiement" note="Échéance ≥ 7 jours" />
              <AlertLine text="2 sessions sans capacité" note="Action requise" />
              <AlertLine text="1 partenaire à risque élevé" note="Suivi commercial requis" />
              <button style={rightLinkStyle}>Voir toutes les alertes</button>
            </RightCard>

            <RightCard title="Actions recommandées">
              <ActionLine text="Relancer 5 factures en retard" />
              <ActionLine text="Contacter 2 partenaires inactifs" />
              <ActionLine text="Valider 56 certificats en attente" />
              <button style={rightLinkStyle}>Voir toutes les actions</button>
            </RightCard>
          </aside>
        </section>
      </section>

      {loading ? <div style={loadingStyle}>Synchronisation du Command Center…</div> : null}
    </main>
  )
}

function MiniMetric({ label, value, delta }: { label: string; value: ReactNode; delta: string }) {
  return (
    <div style={miniMetricStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>▲ {delta} vs mai</small>
    </div>
  )
}

function HealthCard({ score }: { score: number }) {
  const angle = Math.max(0, Math.min(100, score)) * 1.8
  return (
    <aside style={healthCardStyle}>
      <div style={healthHeaderStyle}>
        <span style={blueDotStyle}>●</span>
        <strong>Score de santé globale</strong>
      </div>
      <div style={gaugeStyle}>
        <div style={{ ...gaugeFillStyle, transform: `rotate(${angle - 90}deg)` }} />
        <div style={gaugeInnerStyle}>
          <strong>{score}</strong>
          <span>/100</span>
          <small>{score >= 80 ? 'Excellent' : 'À renforcer'}</small>
        </div>
      </div>
    </aside>
  )
}

function KpiCard({ icon, label, value, note, delta }: { icon: string; label: string; value: ReactNode; note: string; delta: string }) {
  return (
    <article style={kpiCardStyle}>
      <div style={kpiIconStyle}>{icon}</div>
      <div>
        <span style={kpiLabelStyle}>{label}</span>
        <strong style={kpiValueStyle}>{value}</strong>
        <small style={kpiDeltaStyle}>▲ {delta} {note}</small>
      </div>
    </article>
  )
}

function Panel({ title, right, footer, children }: { title: string; right?: string; footer?: string; children: ReactNode }) {
  return (
    <article style={panelStyle}>
      <div style={panelTopStyle}>
        <strong>{title}</strong>
        {right ? <button style={miniSelectStyle}>{right}</button> : null}
      </div>
      <div style={panelBodyStyle}>{children}</div>
      {footer ? <button style={panelFooterStyle}>{footer}</button> : null}
    </article>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={legendRowStyle}>
      <span style={{ ...legendSwatchStyle, background: color }} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function BarRow({ label, value, width, delta }: { label: string; value: ReactNode; width: number; delta: string }) {
  return (
    <div style={barRowStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
      <div style={barTrackStyle}><div style={{ ...barFillStyle, width: `${width}%` }} /></div>
      <small>{delta}</small>
    </div>
  )
}

function SessionRow({ title, date, count }: { title: string; date: string; count: string }) {
  return (
    <div style={sessionRowStyle}>
      <div><strong>{title}</strong><span>{date}</span></div>
      <b>{count}<small> Inscrits</small></b>
    </div>
  )
}

function SmallChart({ label, value }: { label: string; value: string }) {
  return (
    <div style={smallChartStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>▲ 5,3 pts vs mai</small>
      <svg viewBox="0 0 160 56" style={sparkStyle} aria-hidden>
        <polyline points="2,42 25,28 48,34 70,20 94,25 116,18 140,10 158,4" fill="none" stroke="#0b55ff" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function RequestRow({ title, partner, status, tone }: { title: string; partner: string; status: string; tone: 'red' | 'amber' | 'green' }) {
  return (
    <div style={requestRowStyle}>
      <div><strong>{title}</strong><span>{partner}</span></div>
      <em style={tone === 'red' ? redPillStyle : tone === 'amber' ? amberPillStyle : greenPillStyle}>{status}</em>
    </div>
  )
}

function ActivityRow({ label, title, subtitle, date }: { label: string; title: string; subtitle: string; date: string }) {
  return (
    <div style={activityRowStyle}>
      <span style={activityIconStyle}>{label.slice(0, 1)}</span>
      <div><strong>{title}</strong><small>{subtitle}</small></div>
      <time>{safeDate(date)}</time>
    </div>
  )
}

function RightCard({ title, action, badge, children }: { title: string; action?: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <article style={rightCardStyle}>
      <div style={rightCardTopStyle}>
        <strong>{title}</strong>
        {badge ? <span style={badgeStyle}>{badge}</span> : action ? <button style={miniSelectStyle}>{action}</button> : null}
      </div>
      <div style={rightCardBodyStyle}>{children}</div>
    </article>
  )
}

function RiskLine({ label, value, tone }: { label: string; value: ReactNode; tone: 'green' | 'red' | 'amber' }) {
  return (
    <div style={riskLineStyle}>
      <span>{tone === 'green' ? '◎' : tone === 'red' ? '●' : '▲'} {label}</span>
      <strong style={tone === 'green' ? greenTextStyle : tone === 'red' ? redTextStyle : amberTextStyle}>{value}</strong>
    </div>
  )
}

function ModuleLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div style={moduleLineStyle}>
      <span>{label}</span>
      <strong style={active ? greenTextStyle : amberTextStyle}>{active ? 'Opérationnel ●' : 'À activer ●'}</strong>
    </div>
  )
}

function AlertLine({ text, note }: { text: string; note: string }) {
  return (
    <div style={alertLineStyle}>
      <span>⚠</span>
      <div><strong>{text}</strong><small>{note}</small></div>
    </div>
  )
}

function ActionLine({ text }: { text: string }) {
  return <div style={actionLineStyle}>✦ <span>{text}</span></div>
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '286px minmax(0, 1fr)',
  background: '#f5f8ff',
  color: '#0a1733',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const sidebarStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflow: 'auto',
  background: '#ffffff',
  borderRight: '1px solid #dce6f5',
  padding: 18,
  display: 'grid',
  alignContent: 'start',
  gap: 16,
}

const logoBlockStyle: CSSProperties = {
  border: '1px solid #dce6f5',
  borderRadius: 18,
  padding: 12,
  display: 'grid',
  gap: 10,
  boxShadow: '0 10px 24px rgba(15,42,90,.05)',
}

const logoStyle: CSSProperties = { width: '100%', height: 64, objectFit: 'contain' }
const brandTextStyle: CSSProperties = { display: 'grid', gap: 2, color: '#0b1730', fontWeight: 850 }
const sidebarNavStyle: CSSProperties = { display: 'grid', gap: 17 }
const navGroupStyle: CSSProperties = { display: 'grid', gap: 7 }
const navGroupTitleStyle: CSSProperties = { fontSize: 12, color: '#2f6bff', letterSpacing: '.13em', fontWeight: 950, textTransform: 'uppercase' }

const navItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '10px 12px',
  borderRadius: 12,
  color: '#263d61',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 850,
}

const navActiveStyle: CSSProperties = {
  ...navItemStyle,
  color: '#fff',
  background: 'linear-gradient(135deg,#0646cc,#0b5fff)',
  boxShadow: '0 14px 30px rgba(11,95,255,.25)',
}

const navIconStyle: CSSProperties = { width: 22, height: 22, display: 'grid', placeItems: 'center' }

const collapseStyle: CSSProperties = {
  marginTop: 20,
  border: '1px solid #dce6f5',
  background: '#fff',
  color: '#6a7b97',
  borderRadius: 14,
  padding: '12px 14px',
  fontWeight: 850,
}

const mainStyle: CSSProperties = { minWidth: 0, padding: '22px 24px 28px', display: 'grid', gap: 14 }

const topbarStyle: CSSProperties = {
  height: 82,
  borderRadius: 0,
  borderBottom: '1px solid #dce6f5',
  background: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 18,
  padding: '0 4px 14px',
}

const topbarTitleStyle: CSSProperties = { margin: 0, fontSize: 30, letterSpacing: '-.035em', color: '#111b33' }
const topbarSubtitleStyle: CSSProperties = { margin: '6px 0 0', color: '#62748f', fontSize: 14, fontWeight: 750 }
const topbarActionsStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }

const primaryButtonStyle: CSSProperties = {
  border: 0,
  color: '#fff',
  background: 'linear-gradient(135deg,#0646cc,#0b5fff)',
  boxShadow: '0 14px 26px rgba(11,95,255,.22)',
  padding: '13px 16px',
  borderRadius: 10,
  fontWeight: 900,
  cursor: 'pointer',
}

const ghostButtonStyle: CSSProperties = {
  border: '1px solid #d8e3f5',
  color: '#163b7a',
  background: '#fff',
  padding: '12px 15px',
  borderRadius: 10,
  fontWeight: 850,
  cursor: 'pointer',
}

const searchStyle: CSSProperties = {
  height: 44,
  width: 220,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid #d8e3f5',
  background: '#fff',
  color: '#7b8ca8',
}

const searchInputStyle: CSSProperties = { border: 0, outline: 0, width: '100%', color: '#12203b', fontWeight: 750 }
const profileStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, color: '#253b5e', fontWeight: 850 }
const warningStyle: CSSProperties = { padding: 12, borderRadius: 12, border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', fontWeight: 850 }

const heroGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) 520px 360px', gap: 14 }

const heroCardStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  minHeight: 250,
  borderRadius: 20,
  border: '1px solid #d8e3f5',
  background: 'linear-gradient(135deg,#f6f9ff 0%,#ffffff 52%,#eaf2ff 100%)',
  boxShadow: '0 16px 36px rgba(15,42,90,.07)',
}

const heroCurveStyle: CSSProperties = {
  position: 'absolute',
  right: -90,
  top: -140,
  width: 500,
  height: 500,
  borderRadius: '50%',
  border: '1px solid rgba(73,126,255,.25)',
  background: 'radial-gradient(circle, rgba(26,99,255,.12), transparent 58%)',
}

const heroCopyStyle: CSSProperties = { position: 'relative', zIndex: 1, padding: 34, maxWidth: 820 }
const welcomeStyle: CSSProperties = { color: '#075bf0', fontWeight: 950, fontSize: 15 }
const heroTitleStyle: CSSProperties = { margin: '14px 0 14px', fontSize: 38, lineHeight: 1.02, letterSpacing: '-.055em', maxWidth: 790 }
const heroLeadStyle: CSSProperties = { margin: 0, color: '#657791', fontWeight: 800, fontSize: 15 }

const overviewCardStyle: CSSProperties = {
  minHeight: 180,
  alignSelf: 'center',
  borderRadius: 18,
  border: '1px solid #d8e3f5',
  background: '#fff',
  padding: 24,
  boxShadow: '0 16px 34px rgba(15,42,90,.07)',
}

const miniHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }
const miniSelectStyle: CSSProperties = { border: '1px solid #d8e3f5', background: '#fff', color: '#5a6d89', borderRadius: 9, padding: '8px 10px', fontWeight: 850 }
const overviewMetricsStyle: CSSProperties = { marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }
const miniMetricStyle: CSSProperties = { display: 'grid', gap: 8, borderLeft: '1px solid #e2eaf6', paddingLeft: 16 }
const healthCardStyle: CSSProperties = { borderRadius: 20, border: '1px solid #d8e3f5', background: '#fff', padding: 22, boxShadow: '0 16px 34px rgba(15,42,90,.07)' }
const healthHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, color: '#203657', fontWeight: 950 }
const blueDotStyle: CSSProperties = { color: '#0b5fff' }

const gaugeStyle: CSSProperties = { position: 'relative', width: 210, height: 124, margin: '28px auto 0', overflow: 'hidden' }
const gaugeFillStyle: CSSProperties = { position: 'absolute', inset: '0 0 auto', width: 210, height: 210, borderRadius: '50%', border: '16px solid #16a34a', borderBottomColor: '#e7eefb', borderLeftColor: '#e7eefb' }
const gaugeInnerStyle: CSSProperties = { position: 'absolute', inset: '44px 0 0', textAlign: 'center', display: 'grid', placeItems: 'center', color: '#0f1b33' }

const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 14 }
const kpiCardStyle: CSSProperties = { minHeight: 118, display: 'flex', gap: 14, alignItems: 'center', padding: 18, borderRadius: 16, background: '#fff', border: '1px solid #d8e3f5', boxShadow: '0 14px 28px rgba(15,42,90,.055)' }
const kpiIconStyle: CSSProperties = { width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 18, background: '#eef4ff', color: '#075bf0', fontSize: 24 }
const kpiLabelStyle: CSSProperties = { display: 'block', color: '#50627d', fontSize: 12, fontWeight: 850 }
const kpiValueStyle: CSSProperties = { display: 'block', margin: '7px 0 4px', fontSize: 24, color: '#091834', letterSpacing: '-.035em' }
const kpiDeltaStyle: CSSProperties = { color: '#159447', fontWeight: 850 }

const chainCardStyle: CSSProperties = { borderRadius: 18, border: '1px solid #d8e3f5', background: '#fff', padding: 17, boxShadow: '0 14px 28px rgba(15,42,90,.055)' }
const sectionTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, color: '#203657', fontWeight: 850 }
const linkButtonStyle: CSSProperties = { border: 0, background: 'transparent', color: '#075bf0', fontWeight: 900 }
const chainStyle: CSSProperties = { marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(17, minmax(0, auto))', alignItems: 'center', gap: 8 }
const chainStepWrapStyle: CSSProperties = { display: 'contents' }
const chainStepStyle: CSSProperties = { minHeight: 70, display: 'grid', placeItems: 'center', gap: 4, padding: '9px 14px', borderRadius: 12, border: '1px solid #bed1f5', background: '#f8fbff', color: '#1a4fba', textAlign: 'center', fontWeight: 900 }
const arrowStyle: CSSProperties = { color: '#4c6b99', fontWeight: 950, fontSize: 18 }

const dashboardGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 14 }
const leftContentStyle: CSSProperties = { minWidth: 0 }
const commandSectionStyle: CSSProperties = { borderRadius: 18, border: '1px solid #d8e3f5', background: '#fff', padding: 18, boxShadow: '0 14px 28px rgba(15,42,90,.055)' }
const sectionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 22, letterSpacing: '-.035em' }
const sectionSubtitleStyle: CSSProperties = { margin: '5px 0 0', color: '#667895', fontWeight: 750 }

const cardsGridStyle: CSSProperties = { marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }
const panelStyle: CSSProperties = { display: 'grid', gap: 14, minHeight: 258, borderRadius: 16, border: '1px solid #d8e3f5', background: '#fff', padding: 18 }
const panelTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, color: '#172a4b', fontWeight: 950 }
const panelBodyStyle: CSSProperties = { display: 'grid', gap: 12 }
const panelFooterStyle: CSSProperties = { marginTop: 'auto', border: '1px solid #e1e9f6', background: '#f9fbff', color: '#075bf0', borderRadius: 10, padding: 11, fontWeight: 900 }

const donutRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '170px 1fr', gap: 18, alignItems: 'center' }
const donutStyle: CSSProperties = { width: 158, height: 158, borderRadius: '50%', background: 'conic-gradient(#064ee4 0 52%, #4d8dff 52% 73%, #9fc0ff 73% 88%, #d8e5ff 88% 100%)', display: 'grid', placeItems: 'center', position: 'relative', color: '#111b33' }
const legendStyle: CSSProperties = { display: 'grid', gap: 10 }
const legendRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '16px 1fr auto', gap: 9, alignItems: 'center', color: '#3e506c', fontWeight: 850 }
const legendSwatchStyle: CSSProperties = { width: 14, height: 14, borderRadius: 3 }

const barRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr auto 120px 50px', alignItems: 'center', gap: 10, color: '#435671', fontWeight: 850 }
const barTrackStyle: CSSProperties = { height: 8, borderRadius: 99, background: '#e8effb', overflow: 'hidden' }
const barFillStyle: CSSProperties = { height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#0b5fff,#4d8dff)' }
const sessionRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #edf2fb', color: '#2c3f5d' }
const smallChartGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const smallChartStyle: CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 14, background: '#fbfcff', border: '1px solid #e0e8f6' }
const sparkStyle: CSSProperties = { width: '100%', height: 62 }
const requestRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #edf2fb' }
const redPillStyle: CSSProperties = { borderRadius: 999, padding: '7px 10px', background: '#fff0f0', color: '#e11d48', fontWeight: 900, fontStyle: 'normal' }
const amberPillStyle: CSSProperties = { ...redPillStyle, background: '#fff7ed', color: '#ea580c' }
const greenPillStyle: CSSProperties = { ...redPillStyle, background: '#ecfdf5', color: '#16a34a' }
const activityRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '34px 1fr auto', alignItems: 'center', gap: 11, padding: '10px 0', borderBottom: '1px solid #edf2fb' }
const activityIconStyle: CSSProperties = { width: 32, height: 32, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#0b5fff', color: '#fff', fontWeight: 950 }

const rightRailStyle: CSSProperties = { display: 'grid', gap: 14, alignContent: 'start' }
const rightCardStyle: CSSProperties = { display: 'grid', gap: 12, borderRadius: 16, border: '1px solid #d8e3f5', background: '#fff', padding: 18, boxShadow: '0 14px 28px rgba(15,42,90,.055)' }
const rightCardTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, color: '#192b4a', fontWeight: 950 }
const rightCardBodyStyle: CSSProperties = { display: 'grid', gap: 10 }
const riskLineStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #edf2fb', color: '#354a68', fontWeight: 850 }
const greenTextStyle: CSSProperties = { color: '#16a34a' }
const redTextStyle: CSSProperties = { color: '#e11d48' }
const amberTextStyle: CSSProperties = { color: '#ea580c' }
const rightLinkStyle: CSSProperties = { border: 0, background: '#f9fbff', color: '#075bf0', borderRadius: 10, padding: 11, fontWeight: 900 }
const moduleLineStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #edf2fb', color: '#354a68', fontWeight: 850 }
const badgeStyle: CSSProperties = { width: 28, height: 28, borderRadius: 999, display: 'grid', placeItems: 'center', color: '#fff', background: '#ef4444', fontWeight: 950 }
const alertLineStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '24px 1fr', gap: 8, padding: '8px 0', color: '#7f1d1d' }
const actionLineStyle: CSSProperties = { display: 'flex', gap: 8, color: '#1e3a8a', fontWeight: 850, padding: '8px 0' }
const loadingStyle: CSSProperties = { position: 'fixed', right: 24, bottom: 24, background: '#0b5fff', color: '#fff', borderRadius: 999, padding: '12px 16px', boxShadow: '0 18px 38px rgba(11,95,255,.25)', fontWeight: 900 }
