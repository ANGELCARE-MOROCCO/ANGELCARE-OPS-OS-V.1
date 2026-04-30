import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { calculateAttendanceQuality, calculateTrainerLoad } from '../_lib/qualityEngine'

export default async function AcademyQualityPage() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const [{ data: attendance }, { data: groups }] = await Promise.all([
    supabase.from('academy_attendance').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('academy_groups').select('*').order('created_at', { ascending: false }).limit(200),
  ])
  const quality = calculateAttendanceQuality(attendance || [])
  const loads = calculateTrainerLoad(groups || [])

  return (
    <AppShell
      title="Academy Quality Intelligence"
      subtitle="Delivery quality, attendance discipline, trainer load and operational recommendations."
      breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: 'Quality' }]}
      actions={<PageAction href="/academy/attendance">Attendance</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={panel}>
          <h2 style={h2}>Academy Quality Score</h2>
          <div style={scoreBox}>
            <strong style={{ fontSize: 54 }}>{quality.score}%</strong>
            <div><b>{quality.label}</b><p>{quality.recommendation}</p></div>
          </div>
        </section>
        <section style={panel}>
          <h2 style={h2}>Trainer Load Signals</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {loads.length ? loads.map((load) => (
              <div key={load.trainerId} style={row}>
                <b>{load.trainerId === 'unassigned' ? 'Unassigned groups' : `Trainer ${load.trainerId}`}</b>
                <span>{load.groupCount} group(s) · {load.risk}</span>
              </div>
            )) : <p>No group data yet.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

const panel: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 24, boxShadow: '0 22px 48px rgba(15,23,42,.07)' }
const h2: React.CSSProperties = { margin: '0 0 16px', color: '#0f172a', fontSize: 24, fontWeight: 950 }
const scoreBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 22, padding: 22, borderRadius: 24, background: 'linear-gradient(135deg,#eef2ff,#f8fafc)', color: '#0f172a' }
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
