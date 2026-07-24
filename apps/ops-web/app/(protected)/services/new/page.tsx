import AppShell from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  CommandRail,
  DarkRailCard,
  LightRailCard,
  Panel,
  ReviewRow,
  SecondaryAction,
  Services360Hero,
  Services360Nav,
  SourceBadge,
  styles,
} from '@/components/service-os/Services360UI'

const serviceCodes = [
  ['#H.S', "Garde et accompagnement d'enfants à domicile"], ['#S.K', 'Garde enfant spécial à domicile'], ['#S.H', 'Garde enfant spécial hybride'], ['#A.B', 'Animation anniversaire'], ['#P.P', 'Bébé post accouchement'], ['#E.X', 'Excursion'], ['#S.S', "Enfant spécial à l’école"], ['#S.L', 'Animation ludique avancée'], ['#K.P', 'Animation fêtes'], ['#A.A', 'AngelCare Academy'],
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
    }
    const { error } = await supabase.from('service_catalog').upsert([payload], { onConflict: 'service_code' })
    if (error) throw new Error(error.message)
    redirect('/services')
  }

  const stages = [
    { label: '01 · Identité', href: '#identity' }, { label: '02 · Commercial', href: '#commercial' }, { label: '03 · Opérations', href: '#operations' }, { label: '04 · Couverture', href: '#coverage' }, { label: '05 · Revue', href: '#review' },
  ]

  return (
    <AppShell title="Service Product Design Studio" subtitle="Create a service using the existing service_catalog contract" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Nouveau service' }]}>
      <main className={styles.shell}>
        <Services360Hero
          eyebrow="Service product design studio"
          title="Design a service that Sales can sell and Operations can actually deliver."
          subtitle="The studio organizes every field already submitted by the existing create action into one controlled product-design journey. No database column, action, API or redirect is changed."
          actions={<SecondaryAction href="/services">Retour au portfolio</SecondaryAction>}
          briefTitle="Creation control"
          briefRows={[
            { label: 'Destination', value: 'service_catalog' },
            { label: 'Save behavior', value: 'Upsert by service_code' },
            { label: 'Currency', value: 'Dh' },
            { label: 'Backend changes', value: 'None' },
          ]}
          provenance={[{ label: 'Existing createService server action', tone: 'live' }, { label: 'Schema compatibility must be verified in Supabase', tone: 'configured' }]}
        />

        <Services360Nav items={stages} />

        <div className={styles.stageIndex}>
          {stages.map((stage, index) => <a key={stage.href} className={styles.stageLink} href={stage.href}><span className={styles.stageNumber}>{String(index + 1).padStart(2, '0')}</span><span className={styles.stageName}>{stage.label.split(' · ')[1]}</span></a>)}
        </div>

        <form action={createService} className={styles.grid2}>
          <div style={{ display: 'grid', gap: 18 }}>
            <Panel id="identity" eyebrow="Stage 01" title="Service identity" text="Define the canonical service code and business identity that will appear throughout the current catalogue.">
              <div className={styles.formGrid}>
                <Field label="Service code" required><select className={styles.select} name="service_code" required defaultValue=""><option value="" disabled>Sélectionner un code</option>{serviceCodes.map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}</select></Field>
                <Field label="Service name" required><input className={styles.input} name="service_name" required placeholder="Ex. Garde enfant spécial hybride" /></Field>
                <Field label="Service family"><select className={styles.select} name="service_family" defaultValue=""><option value="">Sélectionner</option><option>Home care</option><option>Special needs</option><option>Postpartum</option><option>Events</option><option>Education</option><option>Academy</option><option>B2B / Institutions</option></select></Field>
                <Field label="Client type"><select className={styles.select} name="client_type" defaultValue=""><option value="">Sélectionner</option><option>B2C Family</option><option>B2B Institution</option><option>Academy Candidate</option><option>Event Client</option><option>Hybrid</option></select></Field>
                <Field label="Status"><select className={styles.select} name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option><option value="seasonal">Seasonal</option><option value="pilot">Pilot</option></select></Field>
                <Field label="Operational checklist"><textarea className={styles.textarea} name="internal_checklist" placeholder="Brief parent, skills, transport, mission order…" /></Field>
              </div>
            </Panel>

            <Panel id="commercial" eyebrow="Stage 02" title="Commercial & pricing architecture" text="All visible controls map directly to fields already included in the server action payload.">
              <div className={styles.formGrid}>
                <Field label="Pricing model"><select className={styles.select} name="pricing_model" defaultValue=""><option value="">Sélectionner</option><option value="duration_city_pricing">Duration + city pricing</option><option value="package_pricing">Package pricing</option><option value="premium_duration_pricing">Premium duration pricing</option><option value="custom_pricing">Custom pricing</option><option value="program_pricing">Program pricing</option></select></Field>
                <Field label="Base price (Dh)"><input className={styles.input} name="base_price" type="number" min="0" /></Field>
                <Field label="Duration options"><input className={styles.input} name="duration_options" placeholder="3h, 5h, 8h, 12h, 24h" /></Field>
                <Field label="Price 3h (Dh)"><input className={styles.input} name="price_3h" type="number" min="0" /></Field>
                <Field label="Price 5h (Dh)"><input className={styles.input} name="price_5h" type="number" min="0" /></Field>
                <Field label="Price 8h (Dh)"><input className={styles.input} name="price_8h" type="number" min="0" /></Field>
                <Field label="Price 12h (Dh)"><input className={styles.input} name="price_12h" type="number" min="0" /></Field>
                <Field label="Price 24h (Dh)"><input className={styles.input} name="price_24h" type="number" min="0" /></Field>
                <Field label="Premium price (Dh)"><input className={styles.input} name="price_premium" type="number" min="0" /></Field>
                <Field label="B2C price (Dh)"><input className={styles.input} name="price_b2c" type="number" min="0" /></Field>
                <Field label="B2B price (Dh)"><input className={styles.input} name="price_b2b" type="number" min="0" /></Field>
                <Field label="Options / add-ons"><input className={styles.input} name="addons" placeholder="Transport, nuit, urgence, matériel…" /></Field>
              </div>
            </Panel>

            <Panel id="operations" eyebrow="Stage 03" title="Operational execution design" text="Describe the real people, skills, certifications, equipment and field requirements needed to fulfil the service.">
              <div className={styles.formGrid}>
                <Field label="Skill requirements"><input className={styles.input} name="skill_requirements" placeholder="Special needs, newborn, school support…" /></Field>
                <Field label="Required staff"><input className={styles.input} name="required_staff" placeholder="Junior, senior, spécialisée…" /></Field>
                <Field label="Staff count"><input className={styles.input} name="staff_count" type="number" min="1" defaultValue="1" /></Field>
                <Field label="Equipment"><input className={styles.input} name="equipment" placeholder="Kit bébé, supports éducatifs…" /></Field>
                <Field label="Transport requirement"><select className={styles.select} name="transport_required" defaultValue=""><option value="">Non défini</option><option value="Oui">Oui</option><option value="Non">Non</option><option value="Optionnel">Optionnel</option></select></Field>
                <Field label="Uniform requirement"><select className={styles.select} name="uniform_required" defaultValue=""><option value="">Non défini</option><option value="Oui">Oui</option><option value="Non">Non</option></select></Field>
                <Field label="Certifications"><input className={styles.input} name="certifications" placeholder="Petite enfance, premiers secours…" /></Field>
                <Field label="Fulfilment notes"><textarea className={styles.textarea} name="fulfillment_notes" placeholder="Preparation, restrictions, internal mission instructions…" /></Field>
              </div>
            </Panel>

            <Panel id="coverage" eyebrow="Stage 04" title="Coverage & local rules" text="Geographic fields remain exactly those already written by the create action.">
              <div className={styles.formGrid}>
                <Field label="Available cities"><input className={styles.input} name="available_cities" placeholder="Casablanca, Rabat, Kénitra…" /></Field>
                <Field label="Available regions"><input className={styles.input} name="available_regions" placeholder="Maarif, Agdal, Hay Riad…" /></Field>
                <Field label="City rules"><input className={styles.input} name="city_rules" placeholder="Coverage, transport or local constraints…" /></Field>
                <Field label="Casablanca price adjustment (Dh)"><input className={styles.input} name="price_casablanca" type="number" /></Field>
                <Field label="Rabat price adjustment (Dh)"><input className={styles.input} name="price_rabat" type="number" /></Field>
                <Field label="Kénitra price adjustment (Dh)"><input className={styles.input} name="price_kenitra" type="number" /></Field>
              </div>
            </Panel>

            <Panel id="review" eyebrow="Stage 05" title="Final review & service creation" text="The action below performs the existing upsert and redirects to /services. No hidden workflow is introduced.">
              <div className={styles.grid3}>
                <div className={styles.card}><div className={styles.cardCode}>Identity</div><h4 className={styles.cardTitle}>Canonical catalogue record</h4><div className={styles.cardText}>Code, name, family, client type and status.</div></div>
                <div className={styles.card}><div className={styles.cardCode}>Commercial</div><h4 className={styles.cardTitle}>Pricing fields</h4><div className={styles.cardText}>Base, duration, B2C, B2B, premium and city adjustments.</div></div>
                <div className={styles.card}><div className={styles.cardCode}>Delivery</div><h4 className={styles.cardTitle}>Operational requirements</h4><div className={styles.cardText}>Staff, certifications, equipment, checklist and coverage.</div></div>
              </div>
            </Panel>
          </div>

          <CommandRail>
            <DarkRailCard title="Provisioning checklist" text="Before creating the service, confirm that the catalogue identity is commercially clear and operationally executable." alerts={[
              { title: 'Service code', text: 'The current action upserts on service_code; reusing a code updates the existing record.' },
              { title: 'Pricing integrity', text: 'Only enter price fields supported by the current live schema.' },
              { title: 'Operational truth', text: 'Staff, certification and coverage values should reflect real delivery capacity.' },
              { title: 'No fake automation', text: 'Creation does not automatically synchronize contract planner lists or CareLink mappings.' },
            ]} />
            <LightRailCard title="Persistence contract">
              <ReviewRow label="Table" value="service_catalog" />
              <ReviewRow label="Conflict key" value="service_code" />
              <ReviewRow label="Redirect" value="/services" />
              <ReviewRow label="Currency labels" value="Dh" />
            </LightRailCard>
            <section className={styles.railCardLight}>
              <SourceBadge label="Existing server action" tone="live" />
              <button className={styles.primaryAction} style={{ width: '100%', marginTop: 14 }} type="submit">Créer le service AngelCare</button>
              <p className={styles.panelText}>Submission remains subject to the current Supabase schema and validation behavior.</p>
            </section>
          </CommandRail>
        </form>
      </main>
    </AppShell>
  )
}

function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <label className={styles.field}><span className={styles.fieldLabel}>{label}{required ? ' *' : ''}</span>{children}</label>
}
