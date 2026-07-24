import AppShell from '@/app/components/erp/AppShell'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CommandRail, DarkRailCard, LightRailCard, Panel, ReviewRow, SecondaryAction, Services360Hero, Services360Nav, SourceBadge, styles } from '@/components/service-os/Services360UI'

export default async function EditVariationPage({ params }: { params: Promise<{ id: string; variationId: string }> }) {
  const { id, variationId } = await params
  const serviceCode = `#${decodeURIComponent(id)}`
  const supabase = await createClient()
  const { data: variation } = await supabase.from('service_variations').select('*').eq('id', variationId).single()
  if (!variation) return notFound()

  async function updateVariation(formData: FormData) {
    'use server'
    const { id, variationId } = await params
    const supabase = await createClient()
    const payload = {
      name: String(formData.get('name') || ''), client_type: String(formData.get('client_type') || ''), pricing_model: String(formData.get('pricing_model') || ''), base_price: Number(formData.get('base_price') || 0),
      price_3h: Number(formData.get('price_3h') || 0), price_5h: Number(formData.get('price_5h') || 0), price_8h: Number(formData.get('price_8h') || 0), price_24h: Number(formData.get('price_24h') || 0), price_b2c: Number(formData.get('price_b2c') || 0), price_b2b: Number(formData.get('price_b2b') || 0),
      required_staff: String(formData.get('required_staff') || ''), equipment: String(formData.get('equipment') || ''), available_cities: String(formData.get('available_cities') || ''), status: String(formData.get('status') || 'active'),
    }
    const { error } = await supabase.from('service_variations').update(payload).eq('id', variationId)
    if (error) throw new Error(error.message)
    redirect(`/services/${id}`)
  }

  const nav = [{ label: 'Identité', href: '#identity' }, { label: 'Pricing', href: '#pricing' }, { label: 'Exécution', href: '#execution' }, { label: 'Revue', href: '#review' }]
  return <AppShell title="Variation Governance Studio" subtitle={String(variation.name || serviceCode)} breadcrumbs={[{ label: 'Services', href: '/services' }, { label: serviceCode, href: `/services/${id}` }, { label: 'Modifier variation' }]}>
    <main className={styles.shell}>
      <Services360Hero eyebrow="Variation governance" title={String(variation.name || 'Variation')} subtitle={`Controlled update of ${serviceCode} commercial and operational configuration.`} actions={<SecondaryAction href={`/services/${id}`}>Retour au service</SecondaryAction>} briefTitle="Current variation passport" briefRows={[{ label: 'Client type', value: String(variation.client_type || '—') }, { label: 'Pricing model', value: String(variation.pricing_model || '—') }, { label: 'Base price', value: `${Number(variation.base_price || 0).toLocaleString('fr-FR')} Dh` }, { label: 'Status', value: String(variation.status || 'active') }]} provenance={[{ label: 'Live service_variations record', tone: 'live' }, { label: 'Existing update action', tone: 'live' }]} />
      <Services360Nav items={nav} />
      <form action={updateVariation} className={styles.grid2}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel id="identity" eyebrow="01 · Identity" title="Commercial position" text="Changes remain scoped to the fields already updated by the existing server action."><div className={styles.formGrid}>
            <Field label="Variation name"><input className={styles.input} name="name" defaultValue={variation.name ?? ''} /></Field>
            <Field label="Client type"><select className={styles.select} name="client_type" defaultValue={variation.client_type ?? ''}><option value="">Sélectionner</option><option>B2C</option><option>B2B</option><option>Institution</option><option>Event</option><option>Academy</option></select></Field>
            <Field label="Pricing model"><select className={styles.select} name="pricing_model" defaultValue={variation.pricing_model ?? ''}><option value="">Sélectionner</option><option value="duration_city_pricing">Duration + city</option><option value="package_pricing">Package</option><option value="premium_pricing">Premium</option><option value="custom_pricing">Custom</option><option value="monthly_pricing">Monthly</option></select></Field>
            <Field label="Base price (Dh)"><input className={styles.input} name="base_price" type="number" defaultValue={variation.base_price ?? 0} /></Field>
            <Field label="Status"><select className={styles.select} name="status" defaultValue={variation.status || 'active'}><option value="active">Active</option><option value="inactive">Inactive</option><option value="pilot">Pilot</option><option value="seasonal">Seasonal</option></select></Field>
          </div></Panel>
          <Panel id="pricing" eyebrow="02 · Pricing" title="Price governance" text="Adjust visible price points without changing pricing semantics."><div className={styles.formGrid}>{[['price_3h','3h'],['price_5h','5h'],['price_8h','8h'],['price_24h','24h'],['price_b2c','B2C'],['price_b2b','B2B']].map(([name,label]) => <Field key={name} label={`${label} price (Dh)`}><input className={styles.input} name={name} type="number" defaultValue={variation[name] ?? 0} /></Field>)}</div></Panel>
          <Panel id="execution" eyebrow="03 · Execution" title="Operational requirements" text="Existing missions and contracts are not automatically rewritten by these changes."><div className={styles.formGrid}>
            <Field label="Required staff"><input className={styles.input} name="required_staff" defaultValue={variation.required_staff ?? ''} /></Field>
            <Field label="Equipment"><input className={styles.input} name="equipment" defaultValue={variation.equipment ?? ''} /></Field>
            <Field label="Available cities"><input className={styles.input} name="available_cities" defaultValue={variation.available_cities ?? ''} /></Field>
          </div></Panel>
          <Panel id="review" eyebrow="04 · Change control" title="Validate and apply changes" text="The save action updates this single variation and redirects to the service dossier."><div className={styles.sourceStrip}><SourceBadge label="No mission rewrite" tone="configured" /><SourceBadge label="No contract rewrite" tone="configured" /><SourceBadge label="Existing audit behavior unchanged" tone="live" /></div></Panel>
        </div>
        <CommandRail><DarkRailCard title="Governance warnings" alerts={[{ title: 'Price impact', text: 'Price changes can affect future commercial decisions; existing transactions are not rewritten.' }, { title: 'Coverage impact', text: 'City changes affect visible availability, not existing mission records.' }, { title: 'Status impact', text: 'Inactive status removes normal availability but does not delete the record.' }]} /><LightRailCard title="Current record"><ReviewRow label="ID" value={variationId.slice(0, 8)} /><ReviewRow label="Service" value={serviceCode} /><ReviewRow label="Status" value={String(variation.status || 'active')} /></LightRailCard><section className={styles.railCardLight}><button className={styles.primaryAction} style={{ width: '100%' }} type="submit">Valider les modifications</button></section></CommandRail>
      </form>
    </main>
  </AppShell>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className={styles.field}><span className={styles.fieldLabel}>{label}</span>{children}</label> }
