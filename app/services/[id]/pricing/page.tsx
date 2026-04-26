import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function ServicePricingPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: service } = await supabase
    .from('service_catalog')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!service) return notFound()

  const { data: rules } = await supabase
    .from('service_pricing_rules')
    .select('*')
    .eq('service_id', service.id)
    .order('created_at', { ascending: false })

  async function addPricingRule(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const payload = {
      service_id: Number(params.id),
      duration: String(formData.get('duration') || ''),
      city: String(formData.get('city') || ''),
      region: String(formData.get('region') || ''),
      client_type: String(formData.get('client_type') || ''),
      skill_level: String(formData.get('skill_level') || ''),
      price: Number(formData.get('price') || 0),
      notes: String(formData.get('notes') || ''),
      status: String(formData.get('status') || 'active'),
    }

    const { error } = await supabase.from('service_pricing_rules').insert([payload])
    if (error) throw new Error(error.message)

    redirect(`/services/${params.id}/pricing`)
  }

  const pricingRules = rules || []
  const activeRules = pricingRules.filter((r: any) => r.status !== 'inactive').length
  const b2cRules = pricingRules.filter((r: any) => r.client_type === 'B2C').length
  const b2bRules = pricingRules.filter((r: any) => r.client_type === 'B2B').length

  return (
    <AppShell
      title={`Pricing Engine — ${service.service_name}`}
      subtitle="Gestion des prix par durée, ville, région, type client, niveau de compétence et conditions opérationnelles."
      breadcrumbs={[
        { label: 'Services', href: '/services' },
        { label: service.service_name, href: `/services/${service.id}` },
        { label: 'Pricing' },
      ]}
      actions={
        <>
          <PageAction href={`/services/${service.id}`} variant="light">Retour service</PageAction>
          <PageAction href="/services" variant="light">Catalogue</PageAction>
        </>
      }
    >
      <section style={metricGridStyle}>
        <MetricCard label="Règles tarifaires" value={pricingRules.length} sub="variations configurées" icon="💰" />
        <MetricCard label="Actives" value={activeRules} sub="utilisables en vente" icon="✅" accent="#166534" />
        <MetricCard label="B2C" value={b2cRules} sub="familles / particuliers" icon="👨‍👩‍👧" accent="#1d4ed8" />
        <MetricCard label="B2B" value={b2bRules} sub="écoles / institutions" icon="🏫" accent="#7c3aed" />
      </section>

      <section style={mainGridStyle}>
        <ERPPanel
          title="Ajouter une variation tarifaire"
          subtitle="Crée une règle selon la durée, la ville, la région, le type client et le niveau requis."
        >
          <form action={addPricingRule} style={formGridStyle}>
            <FieldSelect name="duration" label="Durée" options={['3h', '5h', '6h', '8h', '10h', '12h', '24h', 'Mensuel', 'Sur mesure']} />
            <FieldSelect name="city" label="Ville" options={['Casablanca', 'Rabat', 'Kénitra', 'Témara', 'Salé', 'Mohammedia', 'Autre']} />
            <Field name="region" label="Zone / Région" placeholder="Ex: Maarif, Agdal, Hay Riad..." />

            <FieldSelect name="client_type" label="Type client" options={['B2C', 'B2B', 'Institution', 'Academy', 'Event']} />
            <FieldSelect name="skill_level" label="Niveau requis" options={['Standard', 'Premium', 'Expert', 'Special needs', 'Newborn care', 'School support']} />
            <Field name="price" label="Prix MAD" type="number" placeholder="Ex: 350" />

            <FieldSelect name="status" label="Statut" options={['active', 'inactive', 'pilot', 'seasonal']} />

            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={labelStyle}>Notes internes</span>
              <textarea
                name="notes"
                placeholder="Ex: prix valable uniquement pour Casablanca centre, transport non inclus, caregiver experte obligatoire..."
                style={textareaStyle}
              />
            </label>

            <div style={{ gridColumn: '1 / -1' }}>
              <button style={buttonStyle}>Ajouter la règle tarifaire</button>
            </div>
          </form>
        </ERPPanel>

        <aside style={sidePanelStyle}>
          <div style={sideBadgeStyle}>Pricing Logic</div>
          <h3 style={sideTitleStyle}>Utilisation future</h3>
          <p style={sideTextStyle}>
            Ces règles serviront ensuite à alimenter les devis, contrats, missions, packages, factures et propositions commerciales.
          </p>
          <ul style={sideListStyle}>
            <li>Prix par ville</li>
            <li>Prix par durée</li>
            <li>Prix B2C / B2B</li>
            <li>Prix selon compétence caregiver</li>
            <li>Prix package / mensuel</li>
          </ul>
        </aside>
      </section>

      <ERPPanel title="Matrice tarifaire" subtitle="Liste des variations actuellement configurées pour ce service.">
        <div style={rulesGridStyle}>
          {pricingRules.length === 0 ? (
            <div style={emptyStyle}>Aucune règle tarifaire pour le moment.</div>
          ) : (
            pricingRules.map((rule: any) => (
              <div key={rule.id} style={ruleCardStyle}>
                <div style={ruleTopStyle}>
                  <strong style={priceStyle}>{rule.price || 0} MAD</strong>
                  <StatusPill tone={rule.status === 'inactive' ? 'red' : 'green'}>{rule.status || 'active'}</StatusPill>
                </div>

                <div style={ruleTitleStyle}>
                  {rule.duration || 'Durée libre'} • {rule.city || 'Ville libre'}
                </div>

                <div style={ruleMetaStyle}>
                  {rule.region || 'Zone non définie'} • {rule.client_type || 'Client libre'} • {rule.skill_level || 'Niveau standard'}
                </div>

                {rule.notes ? <p style={ruleNotesStyle}>{rule.notes}</p> : null}
              </div>
            ))
          )}
        </div>
      </ERPPanel>
    </AppShell>
  )
}

function Field({ name, label, type = 'text', placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input name={name} type={type} placeholder={placeholder} style={inputStyle} />
    </label>
  )
}

function FieldSelect({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <select name={name} style={inputStyle}>
        <option value="">Sélectionner</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start', marginBottom: 18 }
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const labelStyle: React.CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box', background: '#fff' }
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 110, resize: 'vertical', fontFamily: 'inherit' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: '13px 16px', fontWeight: 950, cursor: 'pointer' }
const sidePanelStyle: React.CSSProperties = { position: 'sticky', top: 18, background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)', borderRadius: 24, padding: 22, color: '#fff', boxShadow: '0 24px 50px rgba(15,23,42,.22)' }
const sideBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.1)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 14 }
const sideTitleStyle: React.CSSProperties = { margin: '0 0 14px', fontSize: 22, fontWeight: 950 }
const sideTextStyle: React.CSSProperties = { color: '#dbeafe', lineHeight: 1.6, fontWeight: 650 }
const sideListStyle: React.CSSProperties = { display: 'grid', gap: 10, paddingLeft: 18, color: '#dbeafe', fontWeight: 750 }
const rulesGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const ruleCardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)' }
const ruleTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }
const priceStyle: React.CSSProperties = { color: '#0f172a', fontSize: 24, fontWeight: 950 }
const ruleTitleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 950, marginBottom: 7 }
const ruleMetaStyle: React.CSSProperties = { color: '#64748b', fontWeight: 700, lineHeight: 1.5 }
const ruleNotesStyle: React.CSSProperties = { margin: '12px 0 0', color: '#475569', lineHeight: 1.55, fontWeight: 650 }
const emptyStyle: React.CSSProperties = { gridColumn: '1 / -1', padding: 22, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }