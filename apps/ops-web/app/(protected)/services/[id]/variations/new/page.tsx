import AppShell from '@/app/components/erp/AppShell'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CommandRail, DarkRailCard, LightRailCard, Panel, ReviewRow, SecondaryAction, Services360Hero, Services360Nav, SourceBadge, styles } from '@/components/service-os/Services360UI'

export default async function NewVariationPage({ params }: { params: Promise<{ id: string }> }) {
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

  const nav = [{ label: 'Identité', href: '#identity' }, { label: 'Pricing', href: '#pricing' }, { label: 'Exécution', href: '#execution' }, { label: 'Revue', href: '#review' }]

  return <AppShell title="Variation Configuration Studio" subtitle={serviceCode} breadcrumbs={[{ label: 'Services', href: '/services' }, { label: serviceCode, href: `/services/${id}` }, { label: 'Nouvelle variation' }]}>
    <main className={styles.shell}>
      <Services360Hero eyebrow="Service variation studio" title={`Create a market-ready variation for ${serviceCode}`} subtitle="Configure the commercial identity, price points, staff requirements, equipment and geographic availability using the existing service_variations insert contract." actions={<SecondaryAction href={`/services/${id}`}>Retour au service</SecondaryAction>} briefTitle="Variation provisioning" briefRows={[{ label: 'Service code', value: serviceCode }, { label: 'Destination', value: 'service_variations' }, { label: 'Status default', value: 'active' }, { label: 'Backend changes', value: 'None' }]} provenance={[{ label: 'Existing createVariation server action', tone: 'live' }]} />
      <Services360Nav items={nav} />
      <form action={createVariation} className={styles.grid2}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel id="identity" eyebrow="01 · Variation identity" title="Commercial position" text="Name the offer and define the audience, pricing model and operational status.">
            <div className={styles.formGrid}>
              <Field label="Variation name" required><input className={styles.input} name="name" required /></Field>
              <Field label="Client type"><select className={styles.select} name="client_type" defaultValue=""><option value="">Sélectionner</option><option>B2C</option><option>B2B</option><option>Institution</option><option>Event</option><option>Academy</option></select></Field>
              <Field label="Pricing model"><select className={styles.select} name="pricing_model" defaultValue=""><option value="">Sélectionner</option><option value="duration_city_pricing">Duration + city</option><option value="package_pricing">Package</option><option value="premium_pricing">Premium</option><option value="custom_pricing">Custom</option><option value="monthly_pricing">Monthly</option></select></Field>
              <Field label="Base price (Dh)"><input className={styles.input} name="base_price" type="number" min="0" /></Field>
              <Field label="Status"><select className={styles.select} name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option><option value="pilot">Pilot</option><option value="seasonal">Seasonal</option></select></Field>
            </div>
          </Panel>
          <Panel id="pricing" eyebrow="02 · Pricing" title="Duration and client price points" text="All fields below map directly to the existing variation payload.">
            <div className={styles.formGrid}>{[['price_3h','3h'],['price_5h','5h'],['price_8h','8h'],['price_24h','24h'],['price_b2c','B2C'],['price_b2b','B2B']].map(([name,label]) => <Field key={name} label={`${label} price (Dh)`}><input className={styles.input} name={name} type="number" min="0" /></Field>)}</div>
          </Panel>
          <Panel id="execution" eyebrow="03 · Operational design" title="Staff, equipment and cities" text="Describe the real field resources required by this variation.">
            <div className={styles.formGrid}>
              <Field label="Required staff"><input className={styles.input} name="required_staff" /></Field>
              <Field label="Equipment"><input className={styles.input} name="equipment" /></Field>
              <Field label="Available cities"><input className={styles.input} name="available_cities" placeholder="Rabat, Casablanca, Kénitra…" /></Field>
            </div>
          </Panel>
          <Panel id="review" eyebrow="04 · Review" title="Create variation" text="Submission inserts one record and redirects to the current service dossier.">
            <div className={styles.sourceStrip}><SourceBadge label="No architecture changes" tone="live" /><SourceBadge label="No new pricing logic" tone="live" /><SourceBadge label="Existing redirect preserved" tone="live" /></div>
          </Panel>
        </div>
        <CommandRail>
          <DarkRailCard title="Before provisioning" alerts={[{ title: 'Commercial clarity', text: 'The name and client type must be understandable to Sales.' }, { title: 'Pricing truth', text: 'Price points must reflect actual service delivery conditions.' }, { title: 'Operational readiness', text: 'Staff, equipment and coverage must be usable by Operations.' }]} />
          <LightRailCard title="Persistence contract"><ReviewRow label="Table" value="service_variations" /><ReviewRow label="Service" value={serviceCode} /><ReviewRow label="Redirect" value={`/services/${id}`} /></LightRailCard>
          <section className={styles.railCardLight}><button className={styles.primaryAction} style={{ width: '100%' }} type="submit">Créer la variation</button></section>
        </CommandRail>
      </form>
    </main>
  </AppShell>
}

function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) { return <label className={styles.field}><span className={styles.fieldLabel}>{label}{required ? ' *' : ''}</span>{children}</label> }
