import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export default async function AcademyExecutivePage() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const [{ count: trainees }, { count: payments }, { count: certificates }, { count: partners }] = await Promise.all([
    supabase.from('academy_trainees').select('*', { count: 'exact', head: true }),
    supabase.from('academy_payments').select('*', { count: 'exact', head: true }),
    supabase.from('academy_certificates').select('*', { count: 'exact', head: true }),
    supabase.from('academy_partners').select('*', { count: 'exact', head: true }),
  ])

  return (
    <AppShell
      title="Academy Executive Board"
      subtitle="Board-level Academy readiness: scale, finance, certification, partner ecosystem and management cadence."
      breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: 'Executive' }]}
      actions={<PageAction href="/academy/reports">Reports</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={grid}>
          <Kpi label="Trainees" value={trainees || 0} />
          <Kpi label="Payments" value={payments || 0} />
          <Kpi label="Certificates" value={certificates || 0} />
          <Kpi label="Partners" value={partners || 0} />
        </section>
        <section style={panel}>
          <h2 style={h2}>Executive Management Cadence</h2>
          <p style={p}>Use this board to run Academy weekly governance: revenue, quality, training capacity, certification, placement and compliance evidence.</p>
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return <div style={card}><span>{label}</span><strong>{value}</strong></div>
}

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 20, display: 'grid', gap: 8, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panel: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 24, boxShadow: '0 22px 48px rgba(15,23,42,.07)', color: '#0f172a' }
const h2: React.CSSProperties = { margin: '0 0 12px', fontSize: 24, fontWeight: 950 }
const p: React.CSSProperties = { color: '#64748b', fontWeight: 750, lineHeight: 1.6 }
