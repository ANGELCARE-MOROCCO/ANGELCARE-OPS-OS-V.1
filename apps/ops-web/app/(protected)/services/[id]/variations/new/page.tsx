
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function NewVariationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const serviceCode = `#${decodeURIComponent(id)}`

  async function createVariation(formData: FormData) {
    'use server'

    const { id } = await params
    const serviceCode = `#${decodeURIComponent(id)}`
    const supabase = await createClient()

    const payload = {
      service_code: serviceCode,
      name: String(formData.get('name') || ''),
      client_type: String(formData.get('client_type') || ''),
      pricing_model: String(formData.get('pricing_model') || ''),
      base_price: Number(formData.get('base_price') || 0),
      price_3h: Number(formData.get('price_3h') || 0),
      price_5h: Number(formData.get('price_5h') || 0),
      price_8h: Number(formData.get('price_8h') || 0),
      price_24h: Number(formData.get('price_24h') || 0),
      price_b2c: Number(formData.get('price_b2c') || 0),
      price_b2b: Number(formData.get('price_b2b') || 0),
      required_staff: String(formData.get('required_staff') || ''),
      equipment: String(formData.get('equipment') || ''),
      available_cities: String(formData.get('available_cities') || ''),
      status: String(formData.get('status') || 'active'),
    }

    const { error } = await supabase.from('service_variations').insert([payload])
    if (error) throw new Error(error.message)

    redirect(`/services/${id}`)
  }

  return (
    <AppShell
      title={`Nouvelle variation — ${serviceCode}`}
      subtitle="Créer une variation commerciale et opérationnelle connectée à service_variations."
      breadcrumbs={[
        { label: 'Products & Services', href: '/services' },
        { label: serviceCode, href: `/services/${id}` },
        { label: 'Nouvelle variation' },
      ]}
      actions={<PageAction href={`/services/${id}`} variant="light">Retour</PageAction>}
    >
      <form action={createVariation} style={pageGridStyle}>
        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div style={eyebrowStyle}>Variation commerciale</div>
            <h2 style={sectionTitleStyle}>Identité & positionnement</h2>
            <p style={sectionTextStyle}>
              Définissez une offre spécifique sous le code {serviceCode}. Exemple : Standard 3h Casablanca, Premium B2B, Mensuel école.
            </p>
          </div>

          <div style={gridStyle}>
            <Field name="name" label="Nom de la variation" placeholder="Ex: H.S Standard 5h Casablanca" />
            <Select name="client_type" label="Type client" options={['B2C', 'B2B', 'Institution', 'Event', 'Academy']} />
            <Select name="pricing_model" label="Modèle tarifaire" options={['duration_city_pricing', 'package_pricing', 'premium_pricing', 'custom_pricing', 'monthly_pricing']} />
            <Field name="base_price" label="Prix base MAD" type="number" placeholder="Ex: 350" />
            <Select name="status" label="Statut" options={['active', 'inactive', 'pilot', 'seasonal']} />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div style={eyebrowStyle}>Pricing</div>
            <h2 style={sectionTitleStyle}>Prix par durée et profil</h2>
            <p style={sectionTextStyle}>Ces prix seront visibles directement dans la page catalogue du code service.</p>
          </div>

          <div style={gridStyle}>
            <Field name="price_3h" label="Prix 3h MAD" type="number" />
            <Field name="price_5h" label="Prix 5h MAD" type="number" />
            <Field name="price_8h" label="Prix 8h MAD" type="number" />
            <Field name="price_24h" label="Prix 24h MAD" type="number" />
            <Field name="price_b2c" label="Prix B2C MAD" type="number" />
            <Field name="price_b2b" label="Prix B2B MAD" type="number" />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div style={eyebrowStyle}>Exécution terrain</div>
            <h2 style={sectionTitleStyle}>Staff, matériel et villes</h2>
            <p style={sectionTextStyle}>Préparez la variation pour l’exploitation terrain et le matching caregiver.</p>
          </div>

          <div style={gridStyle}>
            <Field name="required_staff" label="Staff requis" placeholder="Senior, spécialisée, newborn care..." />
            <Field name="equipment" label="Matériel requis" placeholder="Kit bébé, jeux, supports éducatifs..." />
            <Field name="available_cities" label="Villes disponibles" placeholder="Casablanca, Rabat, Kénitra..." />
          </div>
        </section>

        <aside style={sidePanelStyle}>
          <div style={sideBadgeStyle}>Service Variations</div>
          <h3 style={sideTitleStyle}>Avant validation</h3>
          <ul style={checklistStyle}>
            <li>Le nom décrit clairement l’offre.</li>
            <li>Le prix correspond au profil client.</li>
            <li>Les durées sont cohérentes avec le terrain.</li>
            <li>Le staff requis est exploitable par Ops.</li>
            <li>Les villes disponibles sont claires.</li>
          </ul>
          <button type="submit" style={buttonStyle}>Créer la variation</button>
        </aside>
      </form>
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

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <select name={name} style={inputStyle}>
        <option value="">Sélectionner</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

const pageGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)', marginBottom: 18 }
const sectionHeaderStyle: React.CSSProperties = { marginBottom: 18 }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '6px 10px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 950, fontSize: 12, marginBottom: 10 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '8px 0 0', color: '#64748b', fontWeight: 650, lineHeight: 1.55 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const labelStyle: React.CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box', background: '#fff' }
const sidePanelStyle: React.CSSProperties = { position: 'sticky', top: 18, background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)', borderRadius: 24, padding: 22, color: '#fff', boxShadow: '0 24px 50px rgba(15,23,42,.22)' }
const sideBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.1)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 14 }
const sideTitleStyle: React.CSSProperties = { margin: '0 0 14px', fontSize: 22, fontWeight: 950 }
const checklistStyle: React.CSSProperties = { display: 'grid', gap: 10, paddingLeft: 18, color: '#dbeafe', lineHeight: 1.55, fontWeight: 700, marginBottom: 22 }
const buttonStyle: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 14, background: '#fff', color: '#0f172a', padding: '14px 16px', fontWeight: 950, cursor: 'pointer' }
