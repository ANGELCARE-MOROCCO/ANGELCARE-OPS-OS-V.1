import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export default async function NewLeadPage() {
  const actor = await requireRole(['ceo', 'manager', 'ops_admin', 'sales', 'coordinator'])

  async function createLead(formData: FormData) {
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
      status: String(formData.get('status') || 'new'),
      pipeline_stage: String(formData.get('pipeline_stage') || 'new_lead'),
      priority: String(formData.get('priority') || 'medium'),
      lead_score: Number(formData.get('lead_score') || 50),
      expected_value: Number(formData.get('expected_value') || 0),
      probability: Number(formData.get('probability') || 30),
      next_action: String(formData.get('next_action') || '').trim(),
      next_action_date: String(formData.get('next_action_date') || '') || null,
      notes: String(formData.get('notes') || '').trim(),
      assigned_to: actor?.id || null,
      is_archived: false,
      updated_at: new Date().toISOString(),
    }

    if (!payload.full_name && !payload.parent_name) throw new Error('Nom du lead obligatoire.')
    if (!payload.phone) throw new Error('Téléphone obligatoire.')

    const { data, error } = await supabase.from('leads').insert([payload]).select('id').single()
    if (error) throw new Error(error.message)

    await supabase.from('lead_activities').insert([{ lead_id: data.id, actor_user_id: actor.id, action: 'create_lead', details: payload }])
    redirect(`/leads/${data.id}`)
  }

  return (
    <AppShell
      title="Créer lead"
      subtitle="Nouvelle opportunité commerciale avec qualification, priorité, valeur attendue et prochaine action."
      breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: 'Nouveau lead' }]}
      actions={<PageAction href="/leads" variant="light">Retour leads</PageAction>}
    >
      <form action={createLead} style={pageStyle}>
        <section style={panelStyle}>
          <Header eyebrow="Identité" title="Informations parent / prospect" text="Capturez les données nécessaires pour reprendre contact rapidement." />
          <div style={gridStyle}>
            <Field name="full_name" label="Nom complet" placeholder="Ex: Sara El Amrani" />
            <Field name="parent_name" label="Parent / responsable" placeholder="Ex: Mme El Amrani" />
            <Field name="phone" label="Téléphone" placeholder="06..." />
            <Field name="email" label="Email" />
            <Field name="city" label="Ville" placeholder="Rabat, Casablanca..." />
            <Field name="child_age" label="Âge enfant" placeholder="Ex: 3 ans" />
          </div>
        </section>

        <section style={panelStyle}>
          <Header eyebrow="Qualification" title="Besoin, source et pipeline" text="Structurez la demande pour permettre la relance et la conversion." />
          <div style={gridStyle}>
            <Field name="service_interest" label="Service demandé" placeholder="Garde enfant, postpartum, besoins spécifiques..." />
            <Select name="source" label="Source" options={['manual','website','whatsapp','phone','facebook','instagram','referral','school','campaign']} />
            <Select name="status" label="Statut" options={['new','pending','qualified','hot_lead','converted','lost']} />
            <Select name="pipeline_stage" label="Étape pipeline" options={['new_lead','qualification','proposal','negotiation','converted','lost']} />
            <Select name="priority" label="Priorité" options={['high','medium','low']} />
            <Field name="lead_score" label="Score lead" type="number" placeholder="50" />
          </div>
        </section>

        <section style={panelStyle}>
          <Header eyebrow="Revenue" title="Valeur et prochaine action" text="Chaque lead doit avoir une action claire pour éviter les opportunités dormantes." />
          <div style={gridStyle}>
            <Field name="expected_value" label="Valeur estimée MAD" type="number" placeholder="3000" />
            <Field name="probability" label="Probabilité %" type="number" placeholder="30" />
            <Field name="next_action_date" label="Date prochaine action" type="date" />
            <Field name="next_action" label="Prochaine action" placeholder="Appeler, envoyer devis, relancer WhatsApp..." />
          </div>
          <label style={{ ...fieldStyle, marginTop: 14 }}>
            <span style={labelStyle}>Notes</span>
            <textarea name="notes" rows={5} style={textareaStyle} placeholder="Contexte, besoin, objections, détails famille..." />
          </label>
        </section>

        <aside style={sideStyle}>
          <div style={sideBadgeStyle}>CRM Control</div>
          <h3 style={sideTitleStyle}>Avant création</h3>
          <ul style={checklistStyle}>
            <li>Téléphone obligatoire.</li>
            <li>Prochaine action recommandée.</li>
            <li>Priorité et pipeline structurés.</li>
            <li>Lead non archivé par défaut.</li>
          </ul>
          <button type="submit" style={buttonStyle}>Créer le lead</button>
        </aside>
      </form>
    </AppShell>
  )
}

function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div style={{ marginBottom: 18 }}><div style={eyebrowStyle}>{eyebrow}</div><h2 style={titleStyle}>{title}</h2><p style={textStyle}>{text}</p></div> }
function Field({ name, label, type = 'text', placeholder }: { name: string; label: string; type?: string; placeholder?: string }) { return <label style={fieldStyle}><span style={labelStyle}>{label}</span><input name={name} type={type} placeholder={placeholder} style={inputStyle} /></label> }
function Select({ name, label, options }: { name: string; label: string; options: string[] }) { return <label style={fieldStyle}><span style={labelStyle}>{label}</span><select name={name} style={inputStyle}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label> }

const pageStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)', marginBottom: 18 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '6px 10px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 950, fontSize: 12, marginBottom: 10 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const textStyle: React.CSSProperties = { margin: '8px 0 0', color: '#64748b', fontWeight: 700, lineHeight: 1.6 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const labelStyle: React.CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box', background: '#fff' }
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' }
const sideStyle: React.CSSProperties = { position: 'sticky', top: 90, background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)', borderRadius: 24, padding: 22, color: '#fff', boxShadow: '0 24px 50px rgba(15,23,42,.22)' }
const sideBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.1)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 14 }
const sideTitleStyle: React.CSSProperties = { margin: '0 0 14px', fontSize: 22, fontWeight: 950 }
const checklistStyle: React.CSSProperties = { display: 'grid', gap: 10, paddingLeft: 18, color: '#dbeafe', lineHeight: 1.55, fontWeight: 700, marginBottom: 22 }
const buttonStyle: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 14, background: '#fff', color: '#0f172a', padding: '14px 16px', fontWeight: 950, cursor: 'pointer' }
