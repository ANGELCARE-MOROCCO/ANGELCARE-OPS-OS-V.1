import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export default async function AcademyAuditPage() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const { data } = await supabase.from('academy_audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
  return (
    <main style={{ display: 'grid', gap: 18 }}>
      <section style={{ padding: 26, borderRadius: 28, background: 'linear-gradient(135deg,#020617,#334155)', color: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: 36 }}>Academy Audit Log</h1>
        <p style={{ maxWidth: 820, color: 'rgba(255,255,255,.82)', fontWeight: 750 }}>Traceabilité contrôlée: qui a fait quoi, quand, sur quelle entité, avec quelle raison.</p>
      </section>
      <section style={{ background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 20 }}>
        {(data || []).length ? (data || []).map((log: any) => (
          <div key={log.id} style={{ padding: 14, borderBottom: '1px solid #e2e8f0' }}>
            <strong>{log.action}</strong> · <span>{log.entity_type || 'system'}</span>
            <p style={{ margin: '6px 0', color: '#475569' }}>{log.reason || 'No reason captured'}</p>
            <small>{new Date(log.created_at).toLocaleString('fr-FR')}</small>
          </div>
        )) : <div style={{ color: '#64748b', fontWeight: 800 }}>Aucun audit log pour le moment.</div>}
      </section>
    </main>
  )
}
