import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'

type ContractRow = any

function money(value: any) {
  const n = Number(value || 0)
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)
}

function safeDate(value: any) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

function daysUntil(value: any) {
  if (!value) return null
  const today = new Date()
  const d = new Date(value)
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

function statusTone(status: string) {
  const v = (status || '').toLowerCase()
  if (v === 'active') return { bg: '#dcfce7', color: '#166534', border: '#86efac' }
  if (v === 'paused') return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' }
  if (v === 'completed') return { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' }
  if (v === 'cancelled') return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
  return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' }
}

function StatusBadge({ value }: { value: string }) {
  const t = statusTone(value)
  return <span style={{ ...pillStyle, background: t.bg, color: t.color, borderColor: t.border }}>{value || 'draft'}</span>
}

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select(`*, families:family_id (family_name, parent_name, city), caregivers:preferred_caregiver_id (full_name)`)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const contracts = (data || []) as ContractRow[]
  const active = contracts.filter((c) => (c.status || '').toLowerCase() === 'active').length
  const pendingPayment = contracts.filter((c) => ['pending', 'overdue', 'partial'].includes(String(c.payment_status || 'pending'))).length
  const totalValue = contracts.reduce((s, c) => s + Number(c.contract_value || c.monthly_amount || 0), 0)
  const remainingSessions = contracts.reduce((s, c) => s + Math.max(0, Number(c.total_sessions || 0) - Number(c.sessions_used || 0)), 0)

  return (
    <AppShell
      title="Contracts Portfolio"
      subtitle="Pilotage premium des contrats, packages, consommation de sessions, renouvellements et risques de paiement."
      breadcrumbs={[{ label: 'Contracts & Billing', href: '/billing' }, { label: 'Contracts' }]}
      actions={
        <>
          <PageAction href="/contracts/command-center" variant="light">Command Center</PageAction>
          <PageAction href="/billing/overview" variant="light">Billing Overview</PageAction>
          <PageAction href="/contracts/new">+ Nouveau contrat</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>📦 Contract Revenue Engine</div>
            <h1 style={heroTitleStyle}>Contrats actifs, valeur, consommation & renouvellements</h1>
            <p style={heroTextStyle}>Vue CEO/manager pour contrôler le portefeuille contractuel sans perdre le lien avec les familles, missions et caregivers.</p>
          </div>
          <div style={heroStatStyle}>
            <span>Valeur portefeuille</span>
            <strong>{money(totalValue)}</strong>
            <small>{contracts.length} contrats suivis</small>
          </div>
        </section>

        {error ? <div style={errorStyle}>Erreur : {error.message}</div> : null}

        <section style={kpiGridStyle}>
          <Metric label="Contrats" value={contracts.length} sub="portefeuille actif" />
          <Metric label="Actifs" value={active} sub="en livraison" />
          <Metric label="À encaisser" value={pendingPayment} sub="pending / partial / overdue" />
          <Metric label="Sessions restantes" value={remainingSessions} sub="capacité vendue" />
        </section>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Contrats opérationnels</h2>
              <p style={sectionTextStyle}>Liste enrichie avec statut, consommation, paiement, renouvellement et accès rapide.</p>
            </div>
          </div>

          {contracts.length === 0 ? (
            <div style={emptyStyle}>Aucun contrat trouvé.</div>
          ) : (
            <div style={cardsStyle}>
              {contracts.map((contract) => {
                const totalSessions = Number(contract.total_sessions || 0)
                const used = Number(contract.sessions_used || 0)
                const remaining = Math.max(0, totalSessions - used)
                const progress = totalSessions > 0 ? Math.min(100, (used / totalSessions) * 100) : 0
                const renewDays = daysUntil(contract.renewal_date || contract.end_date)
                const payment = String(contract.payment_status || 'pending')

                return (
                  <article key={contract.id} style={cardStyle}>
                    <div style={cardTopStyle}>
                      <div>
                        <div style={idStyle}>#{contract.id} • {contract.contract_type || 'one_shot'}</div>
                        <h3 style={nameStyle}>{contract.contract_reference || contract.package_label || `Contrat #${contract.id}`}</h3>
                        <p style={mutedStyle}>{contract.families?.family_name || contract.families?.parent_name || 'Famille non définie'} • {contract.families?.city || 'Ville non définie'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <StatusBadge value={contract.status || 'draft'} />
                        <span style={financePillStyle(payment)}>{payment}</span>
                      </div>
                    </div>

                    <div style={infoGridStyle}>
                      <Info label="Service" value={contract.service_type || '—'} />
                      <Info label="Caregiver" value={contract.caregivers?.full_name || '—'} />
                      <Info label="Début" value={safeDate(contract.start_date)} />
                      <Info label="Fin / renouvellement" value={safeDate(contract.renewal_date || contract.end_date)} />
                      <Info label="Valeur" value={money(contract.contract_value || contract.monthly_amount)} />
                      <Info label="Cycle" value={contract.billing_cycle || 'one_time'} />
                    </div>

                    <div style={sessionWrapStyle}>
                      <div style={sessionHeaderStyle}>
                        <span>Sessions utilisées: <strong>{used}/{totalSessions}</strong></span>
                        <span>Restantes: <strong>{remaining}</strong></span>
                      </div>
                      <div style={trackStyle}><div style={{ ...fillStyle, width: `${progress}%` }} /></div>
                    </div>

                    <div style={riskRowStyle}>
                      <span>{renewDays === null ? '📅 Renouvellement non défini' : renewDays < 0 ? '⚠️ Renouvellement dépassé' : renewDays <= 14 ? `🔥 Renouvellement dans ${renewDays}j` : `📅 Renouvellement dans ${renewDays}j`}</span>
                      <strong>{contract.risk_level || 'normal'}</strong>
                    </div>

                    <div style={actionsStyle}>
                      <Link href={`/contracts/${contract.id}`} style={darkButtonStyle}>Voir contrat</Link>
                      <Link href={`/contracts/edit/${contract.id}`} style={lightButtonStyle}>Modifier</Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <div style={metricStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div style={infoStyle}><span>{label}</span><strong>{value}</strong></div>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: 30, borderRadius: 32, background: 'radial-gradient(circle at top left,#2563eb,#020617 65%)', color: '#fff', boxShadow: '0 32px 80px rgba(15,23,42,.25)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 36, fontWeight: 950, maxWidth: 850, letterSpacing: -0.8 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 750, lineHeight: 1.6, maxWidth: 780 }
const heroStatStyle: React.CSSProperties = { minWidth: 260, padding: 20, borderRadius: 26, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)', display: 'grid', gap: 7 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const metricStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, marginBottom: 18 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '8px 0 0', color: '#64748b', fontWeight: 700 }
const cardsStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const cardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 24, padding: 20, background: 'linear-gradient(180deg,#fff,#f8fafc)' }
const cardTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 16 }
const idStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 900, marginBottom: 6 }
const nameStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const mutedStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 700 }
const pillStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '7px 11px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 950, textTransform: 'capitalize' }
const infoGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const infoStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 13, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }
const sessionWrapStyle: React.CSSProperties = { marginTop: 16 }
const sessionHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, color: '#334155', fontSize: 13 }
const trackStyle: React.CSSProperties = { height: 12, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const fillStyle: React.CSSProperties = { height: 12, borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#0f172a)' }
const riskRowStyle: React.CSSProperties = { marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 12, padding: 13, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 850 }
const actionsStyle: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }
const darkButtonStyle: React.CSSProperties = { background: '#0f172a', color: '#fff', padding: '11px 14px', borderRadius: 13, textDecoration: 'none', fontWeight: 950 }
const lightButtonStyle: React.CSSProperties = { background: '#fff', color: '#0f172a', padding: '11px 14px', borderRadius: 13, textDecoration: 'none', fontWeight: 950, border: '1px solid #cbd5e1' }
const emptyStyle: React.CSSProperties = { padding: 22, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
const errorStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: 800 }
function financePillStyle(value: string): React.CSSProperties { const v = value.toLowerCase(); const c = v === 'paid' ? ['#dcfce7','#166534','#86efac'] : v === 'overdue' ? ['#fee2e2','#991b1b','#fca5a5'] : v === 'partial' ? ['#fef3c7','#92400e','#fcd34d'] : ['#f1f5f9','#334155','#cbd5e1']; return { ...pillStyle, background: c[0], color: c[1], borderColor: c[2] } }
