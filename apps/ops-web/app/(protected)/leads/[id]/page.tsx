import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

type Lead = Record<string, any>
type Activity = Record<string, any>

const ACTIONS = [
  { value: 'new_lead', label: 'Nouveau' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposition' },
  { value: 'negotiation', label: 'Négociation' },
  { value: 'converted', label: 'Converti' },
  { value: 'lost', label: 'Perdu' },
]

function leadName(l: Lead) { return l.full_name || l.parent_name || l.name || `Lead #${l.id}` }
function money(v: unknown) { return `${Number(v || 0).toLocaleString('fr-FR')} MAD` }
function formatDate(v: unknown) {
  if (!v) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(v)))
}
function safeDate(v: unknown) { return v ? String(v).slice(0, 10) : '' }
function tone(stage: string) {
  if (stage === 'converted') return '#22c55e'
  if (stage === 'lost') return '#ef4444'
  if (stage === 'proposal' || stage === 'negotiation') return '#3b82f6'
  return '#64748b'
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireRole(['ceo', 'manager', 'ops_admin', 'sales', 'coordinator'])
  const { id } = await params
  const supabase = await createClient()

  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()
  if (error || !lead) notFound()

  const { data: activitiesRaw } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const activities = (activitiesRaw || []) as Activity[]
  const currentStage = lead.pipeline_stage || lead.status || 'new_lead'
  const stageColor = tone(currentStage)

  async function updateLead(formData: FormData) {
    'use server'
    const actor = await requireRole(['ceo', 'manager', 'ops_admin', 'sales', 'coordinator'])
    const supabase = await createClient()
    const payload = {
      full_name: String(formData.get('full_name') || '').trim(),
      parent_name: String(formData.get('parent_name') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      city: String(formData.get('city') || '').trim(),
      service_interest: String(formData.get('service_interest') || '').trim(),
      child_age: String(formData.get('child_age') || '').trim(),
      source: String(formData.get('source') || 'manual'),
      status: String(formData.get('status') || 'pending'),
      pipeline_stage: String(formData.get('pipeline_stage') || 'qualification'),
      priority: String(formData.get('priority') || 'medium'),
      lead_score: Number(formData.get('lead_score') || 50),
      expected_value: Number(formData.get('expected_value') || 0),
      probability: Number(formData.get('probability') || 30),
      next_action: String(formData.get('next_action') || '').trim(),
      next_action_date: String(formData.get('next_action_date') || '') || null,
      lost_reason: String(formData.get('lost_reason') || '').trim(),
      notes: String(formData.get('notes') || '').trim(),
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('leads').update(payload).eq('id', id)
    if (error) throw new Error(error.message)
    await supabase.from('lead_activities').insert([{ lead_id: Number(id), actor_user_id: actor.id, action: 'update_lead', details: payload }])
    redirect(`/leads/${id}`)
  }

  async function archiveLead() {
    'use server'
    const actor = await requireRole(['ceo', 'manager', 'ops_admin', 'sales', 'coordinator'])
    const supabase = await createClient()
    await supabase.from('leads').update({ is_archived: true, updated_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('lead_activities').insert([{ lead_id: Number(id), actor_user_id: actor.id, action: 'archive_lead', details: { id } }])
    redirect('/leads')
  }

  async function unarchiveLead() {
    'use server'
    const actor = await requireRole(['ceo', 'manager', 'ops_admin', 'sales', 'coordinator'])
    const supabase = await createClient()
    await supabase.from('leads').update({ is_archived: false, updated_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('lead_activities').insert([{ lead_id: Number(id), actor_user_id: actor.id, action: 'unarchive_lead', details: { id } }])
    redirect(`/leads/${id}`)
  }

  async function quickStage(formData: FormData) {
    'use server'
    const actor = await requireRole(['ceo', 'manager', 'ops_admin', 'sales', 'coordinator'])
    const supabase = await createClient()
    const nextStage = String(formData.get('pipeline_stage') || 'qualification')
    const updates: Record<string, any> = { pipeline_stage: nextStage, status: nextStage, updated_at: new Date().toISOString() }
    if (nextStage === 'converted') updates.probability = 100
    if (nextStage === 'lost') updates.probability = 0
    await supabase.from('leads').update(updates).eq('id', id)
    await supabase.from('lead_activities').insert([{ lead_id: Number(id), actor_user_id: actor.id, action: 'change_stage', details: updates }])
    redirect(`/leads/${id}`)
  }

  return (
    <AppShell
      title={leadName(lead)}
      subtitle={`Lead CRM • ${lead.city || 'Ville non définie'} • ${lead.service_interest || 'Service à qualifier'}`}
      breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: leadName(lead) }]}
      actions={
        <>
          <PageAction href="/leads" variant="light">Retour leads</PageAction>
          <PageAction href={lead.is_archived ? '/leads?archive=1' : '/leads'} variant="light">{lead.is_archived ? 'Archive' : 'Pipeline'}</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>Lead Command File</div>
            <h1 style={heroTitleStyle}>{leadName(lead)}</h1>
            <p style={heroTextStyle}>{lead.phone || 'Téléphone —'} • {lead.email || 'Email —'} • {lead.city || 'Ville —'}</p>
          </div>
          <div style={statusPanelStyle(stageColor)}>
            <span style={{ fontSize: 36 }}>{lead.is_archived ? '🗄️' : currentStage === 'converted' ? '✅' : '📈'}</span>
            <div>
              <small>ÉTAT ACTUEL</small>
              <strong>{lead.is_archived ? 'ARCHIVÉ' : currentStage}</strong>
            </div>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Valeur estimée" value={money(lead.expected_value)} sub="potentiel brut" />
          <Kpi label="Probabilité" value={`${Number(lead.probability || 0)}%`} sub="conversion" />
          <Kpi label="Score" value={String(lead.lead_score || 0)} sub="lead quality" />
          <Kpi label="Priorité" value={lead.priority || 'medium'} sub="niveau manager" />
          <Kpi label="Next action" value={safeDate(lead.next_action_date) || '—'} sub={lead.next_action || 'non définie'} />
        </section>

        <section style={quickActionsStyle}>
          {ACTIONS.map((a) => (
            <form key={a.value} action={quickStage}>
              <input type="hidden" name="pipeline_stage" value={a.value} />
              <button style={stageButtonStyle(a.value === currentStage)}>{a.label}</button>
            </form>
          ))}
          <form action={lead.is_archived ? unarchiveLead : archiveLead}>
            <button style={archiveButtonStyle}>{lead.is_archived ? 'Restaurer archive' : 'Archiver lead'}</button>
          </form>
        </section>

        <form action={updateLead} style={mainGridStyle}>
          <div>
            <section style={panelStyle}>
              <Header title="Informations lead" subtitle="Identité, contact et besoin commercial." />
              <div style={gridStyle}>
                <Field name="full_name" label="Nom complet" defaultValue={lead.full_name} />
                <Field name="parent_name" label="Parent / responsable" defaultValue={lead.parent_name} />
                <Field name="phone" label="Téléphone" defaultValue={lead.phone} />
                <Field name="email" label="Email" defaultValue={lead.email} />
                <Field name="city" label="Ville" defaultValue={lead.city} />
                <Field name="child_age" label="Âge enfant" defaultValue={lead.child_age} />
                <Field name="service_interest" label="Service demandé" defaultValue={lead.service_interest} />
                <Select name="source" label="Source" options={['manual','website','whatsapp','phone','facebook','instagram','referral','school','campaign']} defaultValue={lead.source} />
                <Select name="priority" label="Priorité" options={['high','medium','low']} defaultValue={lead.priority} />
              </div>
            </section>

            <section style={panelStyle}>
              <Header title="Pipeline & forecast" subtitle="Données opérationnelles pour pilotage commercial." />
              <div style={gridStyle}>
                <Select name="status" label="Statut" options={['new','pending','qualified','hot_lead','converted','lost']} defaultValue={lead.status} />
                <Select name="pipeline_stage" label="Étape pipeline" options={['new_lead','qualification','proposal','negotiation','converted','lost']} defaultValue={lead.pipeline_stage} />
                <Field name="lead_score" label="Score" type="number" defaultValue={lead.lead_score} />
                <Field name="expected_value" label="Valeur estimée MAD" type="number" defaultValue={lead.expected_value} />
                <Field name="probability" label="Probabilité %" type="number" defaultValue={lead.probability} />
                <Field name="next_action_date" label="Date prochaine action" type="date" defaultValue={safeDate(lead.next_action_date)} />
                <Field name="next_action" label="Prochaine action" defaultValue={lead.next_action} />
                <Field name="lost_reason" label="Raison perte" defaultValue={lead.lost_reason} />
              </div>
              <label style={{ ...fieldStyle, marginTop: 14 }}>
                <span style={labelStyle}>Notes</span>
                <textarea name="notes" rows={6} defaultValue={lead.notes || ''} style={textareaStyle} />
              </label>
            </section>
          </div>

          <aside style={sidePanelStyle}>
            <Header title="Manager controls" subtitle="Sauvegarde et audit lead." />
            <Info label="Créé" value={formatDate(lead.created_at)} />
            <Info label="Mis à jour" value={formatDate(lead.updated_at)} />
            <Info label="Archivé" value={lead.is_archived ? 'Oui' : 'Non'} />
            <button type="submit" style={saveButtonStyle}>Enregistrer modifications</button>
          </aside>
        </form>

        <section style={panelStyle}>
          <Header title="Journal d’activité" subtitle="Historique des changements effectués sur ce lead." />
          <div style={activityListStyle}>
            {activities.map((a) => (
              <div key={a.id} style={activityItemStyle}>
                <strong>{a.action}</strong>
                <span>{formatDate(a.created_at)}</span>
              </div>
            ))}
            {activities.length === 0 ? <div style={emptyStyle}>Aucune activité enregistrée.</div> : null}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 16 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div> }
function Field({ name, label, defaultValue, type = 'text' }: { name: string; label: string; defaultValue?: any; type?: string }) { return <label style={fieldStyle}><span style={labelStyle}>{label}</span><input name={name} type={type} defaultValue={defaultValue || ''} style={inputStyle} /></label> }
function Select({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue?: string }) { return <label style={fieldStyle}><span style={labelStyle}>{label}</span><select name={name} defaultValue={defaultValue || options[0]} style={inputStyle}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label> }
function Info({ label, value }: { label: string; value: string }) { return <div style={infoStyle}><span>{label}</span><strong>{value}</strong></div> }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', padding: 30, borderRadius: 32, background: 'radial-gradient(circle at top left,#2563eb,#020617 65%)', color: '#fff', boxShadow: '0 30px 90px rgba(15,23,42,.28)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 1000, color: '#fff' }
const heroTextStyle: React.CSSProperties = { color: '#dbeafe', fontWeight: 750 }
const statusPanelStyle = (color: string): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260, padding: 20, borderRadius: 26, border: `1px solid ${color}`, background: `${color}22` })
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const quickActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', padding: 14, borderRadius: 22, background: '#fff', border: '1px solid #dbe3ee' }
const stageButtonStyle = (active: boolean): React.CSSProperties => ({ border: '1px solid #dbe3ee', borderRadius: 14, padding: '12px 14px', background: active ? '#0f172a' : '#f8fafc', color: active ? '#fff' : '#0f172a', fontWeight: 950, cursor: 'pointer' })
const archiveButtonStyle: React.CSSProperties = { border: '1px solid #fecaca', borderRadius: 14, padding: '12px 14px', background: '#fff7f7', color: '#991b1b', fontWeight: 950, cursor: 'pointer' }
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)', marginBottom: 18 }
const sidePanelStyle: React.CSSProperties = { ...panelStyle, position: 'sticky', top: 90, marginBottom: 0 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const labelStyle: React.CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box', background: '#fff' }
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' }
const saveButtonStyle: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: '14px 16px', fontWeight: 950, cursor: 'pointer', marginTop: 16 }
const infoStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid #e2e8f0', color: '#334155' }
const activityListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const activityItemStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
