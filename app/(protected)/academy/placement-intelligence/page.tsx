import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export default async function AcademyPlacementIntelligencePage() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const [{ data: trainees }, { data: partners }, { data: followups }] = await Promise.all([
    supabase.from('academy_trainees').select('*').in('status', ['certified', 'completed', 'active']).limit(100),
    supabase.from('academy_partners').select('*').eq('status', 'active').limit(100),
    supabase.from('academy_graduation_followups').select('*').limit(100),
  ])

  const opportunities = (trainees || []).map((trainee: any) => {
    const partner = (partners || []).find((p: any) => p.city && trainee.city && p.city === trainee.city)
    return { trainee, partner }
  })

  return (
    <AppShell
      title="Academy Placement Intelligence"
      subtitle="Match certified or near-certified trainees with schools, nurseries, families and professional partners."
      breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: 'Placement Intelligence' }]}
      actions={<><PageAction href="/academy/partners">Partners</PageAction><PageAction href="/academy/graduation" variant="light">Graduation</PageAction></>}
    >
      <section style={panel}>
        <h2 style={h2}>Suggested Placement Matches</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {opportunities.length ? opportunities.map(({ trainee, partner }: any) => (
            <div key={trainee.id} style={row}>
              <div><b>{trainee.full_name}</b><small>{trainee.city || 'City missing'} · {trainee.status}</small></div>
              <div><b>{partner?.name || 'No city partner yet'}</b><small>{partner ? `${partner.type || 'Partner'} · ${partner.city}` : 'Create partner or assign manually'}</small></div>
            </div>
          )) : <p>No placement candidates yet.</p>}
        </div>
      </section>
    </AppShell>
  )
}

const panel: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 24, boxShadow: '0 22px 48px rgba(15,23,42,.07)' }
const h2: React.CSSProperties = { margin: '0 0 16px', color: '#0f172a', fontSize: 24, fontWeight: 950 }
const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
