import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const serviceCodes = [
  ['#H.S', "Garde et accompagnement d'enfants à domicile"],
  ['#S.K', "Garde enfant spécial à domicile"],
  ['#S.H', "Garde enfant spécial hybride"],
  ['#A.B', 'Animation anniversaire'],
  ['#P.P', 'Bébé post accouchement'],
  ['#E.X', 'Excursion'],
  ['#S.S', "Enfant spécial à l’école"],
  ['#S.L', 'Animation ludique avancée'],
  ['#K.P', 'Animation fêtes'],
  ['#A.A', 'AngelCare Academy'],
]

export default function NewServicePage() {
  async function createService(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const payload = {
      service_code: String(formData.get('service_code') || ''),
      service_name: String(formData.get('service_name') || ''),
      service_family: String(formData.get('service_family') || ''),
      client_type: String(formData.get('client_type') || ''),
      pricing_model: String(formData.get('pricing_model') || ''),
      base_price: Number(formData.get('base_price') || 0),
      duration_options: String(formData.get('duration_options') || ''),
      city_rules: String(formData.get('city_rules') || ''),
      skill_requirements: String(formData.get('skill_requirements') || ''),
      internal_checklist: String(formData.get('internal_checklist') || ''),
      status: String(formData.get('status') || 'active'),
      price_3h: Number(formData.get('price_3h') || 0),

      price_3h: Number(formData.get('price_3h') || 0),
price_5h: Number(formData.get('price_5h') || 0),
price_8h: Number(formData.get('price_8h') || 0),
price_12h: Number(formData.get('price_12h') || 0),
price_24h: Number(formData.get('price_24h') || 0),

price_b2c: Number(formData.get('price_b2c') || 0),
price_b2b: Number(formData.get('price_b2b') || 0),
price_premium: Number(formData.get('price_premium') || 0),

price_casablanca: Number(formData.get('price_casablanca') || 0),
price_rabat: Number(formData.get('price_rabat') || 0),
price_kenitra: Number(formData.get('price_kenitra') || 0),

addons: String(formData.get('addons') || ''),
required_staff: String(formData.get('required_staff') || ''),
staff_count: Number(formData.get('staff_count') || 1),
equipment: String(formData.get('equipment') || ''),
transport_required: String(formData.get('transport_required') || ''),
uniform_required: String(formData.get('uniform_required') || ''),
certifications: String(formData.get('certifications') || ''),
available_cities: String(formData.get('available_cities') || ''),
available_regions: String(formData.get('available_regions') || ''),
fulfillment_notes: String(formData.get('fulfillment_notes') || ''),

      price_3h: Number(formData.get('price_3h') || 0),
price_5h: Number(formData.get('price_5h') || 0),
price_8h: Number(formData.get('price_8h') || 0),

price_b2c: Number(formData.get('price_b2c') || 0),
price_b2b: Number(formData.get('price_b2b') || 0),

required_staff: String(formData.get('required_staff') || ''),
equipment: String(formData.get('equipment') || ''),
    }

const { error } = await supabase
  .from('service_catalog')
  .upsert([payload], { onConflict: 'service_code' })
    if (error) throw new Error(error.message)

    redirect('/services')
  }

  return (
    <AppShell
      title="Create Service / Package"
      subtitle="Add a flexible AngelCare service, package, academy program, event or B2B training product."
      breadcrumbs={[
        { label: 'Products & Services', href: '/services' },
        { label: 'New' },
      ]}
      actions={<PageAction href="/services" variant="light">Back</PageAction>}
    >
      <form action={createService} style={pageGridStyle}>
        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Service identity</div>
              <section style={panelStyle}>
  <div style={sectionHeaderStyle}>
    <div>
      <div style={eyebrowStyle}>Moteur tarifaire</div>
      <h2 style={sectionTitleStyle}>Variations de prix</h2>
      <p style={sectionTextStyle}>
        Configurez les prix selon la durée, la ville, le profil client et le niveau de service.
      </p>
    </div>
  </div>

  <div style={gridStyle}>
    <Field name="price_3h" label="Prix 3h MAD" type="number" placeholder="Ex: 250" />
    <Field name="price_5h" label="Prix 5h MAD" type="number" placeholder="Ex: 350" />
    <Field name="price_8h" label="Prix 8h MAD" type="number" placeholder="Ex: 500" />

    <Field name="price_12h" label="Prix 12h MAD" type="number" placeholder="Ex: 750" />
    <Field name="price_24h" label="Prix 24h MAD" type="number" placeholder="Ex: 1200" />
    <Field name="price_premium" label="Prix premium MAD" type="number" placeholder="Ex: 900" />

    <Field name="price_b2c" label="Prix B2C MAD" type="number" placeholder="Familles" />
    <Field name="price_b2b" label="Prix B2B MAD" type="number" placeholder="Écoles / institutions" />
    <Field name="addons" label="Options / Add-ons" placeholder="Transport, nuit, urgence, matériel..." />
  </div>
</section>

<section style={panelStyle}>
  <div style={sectionHeaderStyle}>
    <div>
      <div style={eyebrowStyle}>Couverture géographique</div>
      <h2 style={sectionTitleStyle}>Villes, zones et règles locales</h2>
      <p style={sectionTextStyle}>
        Définissez les villes disponibles, les régions couvertes et les variations selon localisation.
      </p>
    </div>
  </div>

  <div style={gridStyle}>
    <Field name="available_cities" label="Villes disponibles" placeholder="Casablanca, Rabat, Kénitra..." />
    <Field name="available_regions" label="Zones / régions" placeholder="Maarif, Agdal, Hay Riad..." />
    <Field name="price_casablanca" label="Supplément Casablanca" type="number" placeholder="Ex: 0" />

    <Field name="price_rabat" label="Supplément Rabat" type="number" placeholder="Ex: 50" />
    <Field name="price_kenitra" label="Supplément Kénitra" type="number" placeholder="Ex: 80" />
  </div>
</section>

<section style={panelStyle}>
  <div style={sectionHeaderStyle}>
    <div>
      <div style={eyebrowStyle}>Exécution opérationnelle</div>
      <h2 style={sectionTitleStyle}>Staff, matériel et fulfillment</h2>
      <p style={sectionTextStyle}>
        Définissez les besoins terrain nécessaires pour exécuter ce service correctement.
      </p>
    </div>
  </div>

  <div style={gridStyle}>
    <Field name="required_staff" label="Type intervenante requis" placeholder="Junior, senior, spécialisée..." />
    <Field name="staff_count" label="Nombre intervenantes" type="number" placeholder="Ex: 1" />
    <Field name="equipment" label="Matériel nécessaire" placeholder="Jeux, kit bébé, supports éducatifs..." />

    <Field name="transport_required" label="Transport requis" placeholder="Oui / Non / Optionnel" />
    <Field name="uniform_required" label="Uniforme requis" placeholder="Oui / Non" />
    <Field name="certifications" label="Certifications requises" placeholder="Petite enfance, premiers secours..." />

    <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
      <span style={labelStyle}>Notes fulfillment</span>
      <textarea
        name="fulfillment_notes"
        placeholder="Conditions particulières, préparation avant mission, consignes internes..."
        style={textareaStyle}
      />
    </label>
  </div>
</section>
              <h2 style={sectionTitleStyle}>Core service configuration</h2>
              <p style={sectionTextStyle}>Define the service code, family, client type and operational pricing model.</p>
            </div>
          </div>

          <div style={gridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Service code</span>
              <select name="service_code" style={inputStyle}>
                <option value="">Select code</option>
                {serviceCodes.map(([code, label]) => (
                  <option key={code} value={code}>{code} — {label}</option>
                ))}
              </select>
            </label>

            <Field name="service_name" label="Service name" placeholder="Example: Garde enfant spécial hybride" />

            <label style={fieldStyle}>
              <span style={labelStyle}>Service family</span>
              <select name="service_family" style={inputStyle}>
                <option value="">Select family</option>
                <option value="Home care">Home care</option>
                <option value="Special needs">Special needs</option>
                <option value="Postpartum">Postpartum</option>
                <option value="Events">Events</option>
                <option value="Education">Education</option>
                <option value="Academy">Academy</option>
                <option value="B2B / Institutions">B2B / Institutions</option>
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Client type</span>
              <select name="client_type" style={inputStyle}>
                <option value="">Select client type</option>
                <option value="B2C Family">B2C Family</option>
                <option value="B2B Institution">B2B Institution</option>
                <option value="Academy Candidate">Academy Candidate</option>
                <option value="Event Client">Event Client</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Pricing model</span>
              <select name="pricing_model" style={inputStyle}>
                <option value="">Select pricing model</option>
                <option value="duration_city_pricing">Duration + city pricing</option>
                <option value="package_pricing">Package pricing</option>
                <option value="premium_duration_pricing">Premium duration pricing</option>
                <option value="custom_pricing">Custom pricing</option>
                <option value="program_pricing">Program pricing</option>
              </select>
            </label>

            <Field name="base_price" label="Base price MAD" type="number" placeholder="Example: 300" />
          </div>
        </section>
        <section style={panelStyle}>
  <div style={sectionHeaderStyle}>
    <div>
      <div style={eyebrowStyle}>Pricing engine</div>
      <h2 style={sectionTitleStyle}>Variations et règles tarifaires</h2>
      <p style={sectionTextStyle}>
        Configurez librement les variations de prix selon durée, ville, profil client et options.
      </p>
    </div>
  </div>

  <div style={gridStyle}>
    <Field name="price_3h" label="Prix 3h (MAD)" type="number" />
    <Field name="price_5h" label="Prix 5h (MAD)" type="number" />
    <Field name="price_8h" label="Prix 8h (MAD)" type="number" />

    <Field name="price_casablanca" label="Supplément Casablanca" type="number" />
    <Field name="price_rabat" label="Supplément Rabat" type="number" />
    <Field name="price_other_city" label="Autres villes" type="number" />

    <Field name="price_b2c" label="Prix B2C" type="number" />
    <Field name="price_b2b" label="Prix B2B" type="number" />
    <Field name="price_premium" label="Prix Premium" type="number" />

    <Field name="addons" label="Options / Add-ons" placeholder="Transport, nuit, urgence..." />
  </div>
</section> 
        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Operational rules</div>
              <h2 style={sectionTitleStyle}>Duration, city, skills and checklist</h2>
              <p style={sectionTextStyle}>These fields will later drive contracts, missions, caregiver matching and print templates.</p>
            </div>
          </div>

          <div style={gridStyle}>
            <Field name="duration_options" label="Duration options" placeholder="3h, 5h, 8h, 12h, 24h" />
            <Field name="city_rules" label="City rules" placeholder="Casablanca, Rabat, Kénitra..." />
            <Field name="skill_requirements" label="Skill requirements" placeholder="Special needs, newborn, school support..." />

            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={labelStyle}>Internal checklist</span>
              <textarea
                name="internal_checklist"
                placeholder="Example: confirm parent brief, verify caregiver skills, confirm transport, prepare mission order..."
                style={textareaStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Status</span>
              <select name="status" defaultValue="active" style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="seasonal">Seasonal</option>
                <option value="pilot">Pilot</option>
              </select>
            </label>
          </div>
        </section>
<section style={panelStyle}>
  <div style={sectionHeaderStyle}>
    <div>
      <div style={eyebrowStyle}>Operational execution</div>
      <h2 style={sectionTitleStyle}>Logistique & ressources</h2>
      <p style={sectionTextStyle}>
        Définissez les besoins opérationnels pour exécuter le service.
      </p>
    </div>
  </div>

  <div style={gridStyle}>
    <Field name="required_staff" label="Type intervenante" placeholder="Junior, senior, spécialisée..." />
    <Field name="staff_count" label="Nombre requis" type="number" />
    <Field name="equipment" label="Matériel requis" placeholder="Jeux, kit bébé, matériel éducatif..." />

    <Field name="transport_required" label="Transport nécessaire" placeholder="Oui / Non / Optionnel" />
    <Field name="uniform_required" label="Uniforme requis" placeholder="Oui / Non" />
    <Field name="certifications" label="Certifications requises" placeholder="Petite enfance, soins..." />
  </div>
</section>
        <aside style={sidePanelStyle}>
          <div style={sideBadgeStyle}>AngelCare Service Engine</div>
          <h3 style={sideTitleStyle}>Before saving, verify:</h3>

          <ul style={checklistStyle}>
            <li>Service code matches the operational category.</li>
            <li>Pricing model is clear enough for sales and billing.</li>
            <li>Duration options match real field execution.</li>
            <li>Skills are clear for caregiver matching.</li>
            <li>Checklist is usable by operations staff.</li>
          </ul>

          <button type="submit" style={buttonStyle}>Create service</button>
        </aside>
      </form>
    </AppShell>
  )
}

function Field({
  name,
  label,
  type = 'text',
  placeholder,
}: {
  name: string
  label: string
  type?: string
  placeholder?: string
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input name={name} type={type} placeholder={placeholder} style={inputStyle} />
    </label>
  )
}

const pageGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 340px',
  gap: 18,
  alignItems: 'start',
}

const panelStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbe3ee',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 18px 38px rgba(15,23,42,.06)',
  marginBottom: 18,
}

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 18,
}

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#eef2ff',
  color: '#3730a3',
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 10,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 950,
}

const sectionTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#64748b',
  fontWeight: 650,
  lineHeight: 1.55,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 14,
}

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const labelStyle: React.CSSProperties = {
  color: '#334155',
  fontWeight: 900,
  fontSize: 13,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  color: '#0f172a',
  boxSizing: 'border-box',
  background: '#fff',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: 'vertical',
  fontFamily: 'inherit',
}

const sidePanelStyle: React.CSSProperties = {
  position: 'sticky',
  top: 18,
  background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)',
  borderRadius: 24,
  padding: 22,
  color: '#fff',
  boxShadow: '0 24px 50px rgba(15,23,42,.22)',
}

const sideBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '7px 11px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.1)',
  color: '#dbeafe',
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 14,
}

const sideTitleStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 22,
  fontWeight: 950,
}

const checklistStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  paddingLeft: 18,
  color: '#dbeafe',
  lineHeight: 1.55,
  fontWeight: 700,
  marginBottom: 22,
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: 14,
  background: '#fff',
  color: '#0f172a',
  padding: '14px 16px',
  fontWeight: 950,
  cursor: 'pointer',
}