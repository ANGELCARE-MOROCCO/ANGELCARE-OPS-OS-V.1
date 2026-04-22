import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function statusBadgeStyle(value: string): React.CSSProperties {
  const v = (value || '').toLowerCase()
  const map: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    completed: { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
    paused: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    draft: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
  }
  const color = map[v] || map.draft
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 11px',
    borderRadius: 999,
    background: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`,
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'capitalize',
  }
}

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      families:family_id (family_name, parent_name),
      caregivers:preferred_caregiver_id (full_name)
    `)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const contracts = data || []

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Contracts Engine</div>
          <h1 style={titleStyle}>Contracts / Packages</h1>
          <p style={subtitleStyle}>Base opérationnelle pour les ventes one-shot et les packages mensuels.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={secondaryButtonStyle}>← Dashboard</Link>
          <Link href="/contracts/new" style={buttonStyle}>+ Nouveau contrat</Link>
        </div>
      </div>

      {error ? (
        <div style={errorStyle}>Erreur : {error.message}</div>
      ) : contracts.length === 0 ? (
        <div style={emptyStyle}>Aucun contrat trouvé.</div>
      ) : (
        <div style={gridStyle}>
          {contracts.map((contract: any) => {
            const totalSessions = Number(contract.total_sessions || 0)
            const used = Number(contract.sessions_used || 0)
            const remaining = Math.max(0, totalSessions - used)
            return (
              <section key={contract.id} style={cardStyle}>
                <div style={cardTopStyle}>
                  <div>
                    <div style={idStyle}>Contract #{contract.id}</div>
                    <h2 style={nameStyle}>{contract.contract_reference || contract.package_label || `Contrat #${contract.id}`}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={statusBadgeStyle(contract.status || 'draft')}>{contract.status || 'draft'}</span>
                    <span style={typeBadgeStyle}>{contract.contract_type || 'one_shot'}</span>
                  </div>
                </div>
                <div style={contentGridStyle}>
                  <div>
                    <div style={lineStyle}>🏠 <strong>Famille :</strong> {contract.families?.family_name || contract.families?.parent_name || 'Non définie'}</div>
                    <div style={lineStyle}>🧩 <strong>Service :</strong> {contract.service_type || 'Non défini'}</div>
                    <div style={lineStyle}>📦 <strong>Package :</strong> {contract.package_label || '—'}</div>
                    <div style={lineStyle}>👩‍👧 <strong>Caregiver préférée :</strong> {contract.caregivers?.full_name || 'Non définie'}</div>
                  </div>
                  <div>
                    <div style={lineStyle}>📅 <strong>Début :</strong> {contract.start_date || '—'}</div>
                    <div style={lineStyle}>📅 <strong>Fin :</strong> {contract.end_date || '—'}</div>
                    <div style={lineStyle}>🗓️ <strong>Jours préférés :</strong> {contract.preferred_days || '—'}</div>
                    <div style={lineStyle}>🕒 <strong>Heure préférée :</strong> {contract.preferred_time || '—'}</div>
                  </div>
                </div>
                <div style={sessionBarWrapStyle}>
                  <div style={sessionBarHeaderStyle}>
                    <span>Sessions utilisées: <strong>{used}/{totalSessions}</strong></span>
                    <span>Restantes: <strong>{remaining}</strong></span>
                  </div>
                  <div style={progressTrackStyle}>
                    <div style={{ ...progressFillStyle, width: `${totalSessions > 0 ? Math.min(100, (used / totalSessions) * 100) : 0}%` }} />
                  </div>
                </div>
                <div style={actionsWrapStyle}>
                  <Link href={`/contracts/${contract.id}`} style={primaryActionStyle}>Voir contrat</Link>
                  <Link href={`/contracts/edit/${contract.id}`} style={secondaryButtonStyle}>Modifier</Link>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}

const pageStyle: React.CSSProperties = { padding: 32, fontFamily: 'Arial, sans-serif', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 24 }
const eyebrowStyle: React.CSSProperties = { display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#e2e8f0', color: '#334155', fontSize: 12, fontWeight: 800, marginBottom: 10 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 40, lineHeight: 1.05, color: '#0f172a', fontWeight: 800 }
const subtitleStyle: React.CSSProperties = { color: '#475569', margin: '10px 0 0 0', fontSize: 17 }
const buttonStyle: React.CSSProperties = { background: '#0f172a', color: 'white', padding: '12px 16px', borderRadius: 12, textDecoration: 'none', fontWeight: 800, border: 'none' }
const secondaryButtonStyle: React.CSSProperties = { background: 'white', color: '#0f172a', padding: '12px 16px', borderRadius: 12, textDecoration: 'none', fontWeight: 800, border: '1px solid #cbd5e1' }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: 24, border: '1px solid #dbe3ee', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.07)' }
const cardTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 18, flexWrap: 'wrap' }
const idStyle: React.CSSProperties = { color: '#64748b', fontSize: 13, fontWeight: 700, marginBottom: 6 }
const nameStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 800 }
const typeBadgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '7px 11px', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: 12, fontWeight: 800 }
const contentGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 12 }
const lineStyle: React.CSSProperties = { color: '#475569', fontSize: 16, lineHeight: 1.7 }
const sessionBarWrapStyle: React.CSSProperties = { marginTop: 12, marginBottom: 12 }
const sessionBarHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, color: '#334155', fontSize: 14 }
const progressTrackStyle: React.CSSProperties = { height: 12, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const progressFillStyle: React.CSSProperties = { height: 12, borderRadius: 999, background: 'linear-gradient(90deg, #0f172a 0%, #334155 100%)' }
const actionsWrapStyle: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid #e2e8f0', marginTop: 16 }
const primaryActionStyle: React.CSSProperties = { background: '#0f172a', color: 'white', padding: '10px 14px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: 14 }
const emptyStyle: React.CSSProperties = { background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e2e8f0' }
const errorStyle: React.CSSProperties = { background: '#fff7f7', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 16, padding: 16 }
