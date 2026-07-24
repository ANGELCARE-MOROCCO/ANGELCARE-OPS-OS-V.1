import Link from 'next/link'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CommandRail, DarkRailCard, EmptyState, Kpi, KpiGrid, LightRailCard, MiniStat, Panel, ReviewRow, SecondaryAction, Services360Hero, Services360Nav, SourceBadge, StatPill, styles } from '@/components/service-os/Services360UI'

function text(value: unknown, fallback = 'Non défini') { return typeof value === 'string' && value.trim() ? value : fallback }
function number(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function money(value: unknown) { return `${Math.round(number(value)).toLocaleString('fr-FR')} Dh` }

export default async function ServicePricingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: service } = await supabase.from('service_catalog').select('*').eq('id', id).single()
  if (!service) return notFound()
  const { data: rules, error: rulesError } = await supabase.from('service_pricing_rules').select('*').eq('service_id', service.id).order('created_at', { ascending: false })

  async function addPricingRule(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const payload = {
      service_id: Number(id), duration: String(formData.get('duration') || ''), city: String(formData.get('city') || ''), region: String(formData.get('region') || ''), client_type: String(formData.get('client_type') || ''), skill_level: String(formData.get('skill_level') || ''), price: Number(formData.get('price') || 0), notes: String(formData.get('notes') || ''), status: String(formData.get('status') || 'active'),
    }
    const { error } = await supabase.from('service_pricing_rules').insert([payload])
    if (error) throw new Error(error.message)
    redirect(`/services/${id}/pricing`)
  }

  const pricingRules: any[] = rules || []
  const explicitPriceRules = pricingRules.filter((rule) => 'price' in rule || 'duration' in rule || 'city' in rule)
  const modifierRules = pricingRules.filter((rule) => 'modifier' in rule || 'condition' in rule)
  const activeRules = pricingRules.filter((rule) => text(rule.status, 'active').toLowerCase() !== 'inactive' && rule.active !== false).length
  const b2cRules = pricingRules.filter((rule) => text(rule.client_type).toUpperCase() === 'B2C').length
  const b2bRules = pricingRules.filter((rule) => text(rule.client_type).toUpperCase() === 'B2B').length
  const prices = explicitPriceRules.map((rule) => number(rule.price)).filter((value) => value > 0)
  const minPrice = prices.length ? Math.min(...prices) : number(service.base_price)
  const maxPrice = prices.length ? Math.max(...prices) : number(service.base_price)
  const schemaMode = explicitPriceRules.length ? 'Explicit pricing records' : modifierRules.length ? 'Condition / modifier rules' : 'No pricing rules'

  const nav = [{ label: 'Vue consolidée', href: '#overview' }, { label: 'Ajouter une règle', href: '#create' }, { label: 'Matrice', href: '#matrix' }, { label: 'Observations', href: '#quality' }]

  return <AppShell title="Service Pricing Control Studio" subtitle={text(service.service_name)} breadcrumbs={[{ label: 'Services', href: '/services' }, { label: text(service.service_name), href: `/services/${String(service.service_code || '').replace(/^#/, '')}` }, { label: 'Pricing' }]}>
    <main className={styles.shell}>
      <Services360Hero eyebrow="Service pricing studio" title={`Pricing architecture for ${text(service.service_name)}`} subtitle="Govern duration, city, region, client and skill-level pricing using the existing service_pricing_rules action. The interface also identifies which rule shape the live records currently expose." actions={<><SecondaryAction href={`/services/${String(service.service_code || '').replace(/^#/, '')}`}>Retour service</SecondaryAction><SecondaryAction href="/services/pricing-engine">Simulation Engine</SecondaryAction></>} briefTitle="Pricing control" briefRows={[{ label: 'Rules', value: pricingRules.length }, { label: 'Active', value: activeRules }, { label: 'Visible range', value: minPrice ? `${money(minPrice)}${maxPrice > minPrice ? ` → ${money(maxPrice)}` : ''}` : 'À définir' }, { label: 'Schema shape', value: schemaMode }]} provenance={[{ label: rulesError ? 'Pricing rules unavailable' : 'Live service_pricing_rules', tone: rulesError ? 'unavailable' : 'live' }, { label: 'Existing addPricingRule action', tone: 'live' }]} />
      <Services360Nav items={nav} />
      <KpiGrid><Kpi label="Rules" value={pricingRules.length} helper={schemaMode} /><Kpi label="Active" value={activeRules} helper="Available outside inactive state" /><Kpi label="B2C" value={b2cRules} helper="Family / individual context" /><Kpi label="B2B" value={b2bRules} helper="Institutional context" /><Kpi label="Minimum" value={minPrice ? money(minPrice) : '—'} helper="Loaded explicit prices" /><Kpi label="Maximum" value={maxPrice ? money(maxPrice) : '—'} helper="Loaded explicit prices" /></KpiGrid>
      <div className={styles.grid2}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel id="overview" eyebrow="Pricing passport" title="Current service price posture" text="Read-only summary of the service record and loaded pricing rules."><div className={styles.grid4}><MiniStat label="Base price" value={number(service.base_price) ? money(service.base_price) : 'À définir'} /><MiniStat label="Explicit records" value={explicitPriceRules.length} /><MiniStat label="Modifier rules" value={modifierRules.length} /><MiniStat label="Data source" value={rulesError ? 'Partial' : 'Loaded'} /></div><div className={styles.sourceStrip}><SourceBadge label={schemaMode} tone={modifierRules.length && !explicitPriceRules.length ? 'legacy' : 'live'} /><StatPill tone={prices.length ? 'good' : 'warn'}>{prices.length ? `${prices.length} visible price points` : 'No explicit price point'}</StatPill></div></Panel>
          <Panel id="create" eyebrow="Create pricing record" title="Add an explicit pricing rule" text="The fields and payload remain exactly aligned with the existing server action."><form action={addPricingRule} className={styles.formGrid}>
            <Field label="Duration"><select className={styles.select} name="duration" defaultValue=""><option value="">Sélectionner</option>{['3h','5h','6h','8h','10h','12h','24h','Mensuel','Sur mesure'].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="City"><select className={styles.select} name="city" defaultValue=""><option value="">Sélectionner</option>{['Casablanca','Rabat','Kénitra','Témara','Salé','Mohammedia','Autre'].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Region / zone"><input className={styles.input} name="region" placeholder="Agdal, Hay Riad, Maarif…" /></Field>
            <Field label="Client type"><select className={styles.select} name="client_type" defaultValue=""><option value="">Sélectionner</option>{['B2C','B2B','Institution','Academy','Event'].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Skill level"><select className={styles.select} name="skill_level" defaultValue=""><option value="">Sélectionner</option>{['Standard','Premium','Expert','Special needs','Newborn care','School support'].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Price (Dh)"><input className={styles.input} name="price" type="number" min="0" /></Field>
            <Field label="Status"><select className={styles.select} name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option><option value="pilot">Pilot</option><option value="seasonal">Seasonal</option></select></Field>
            <label className={styles.field} style={{ gridColumn: '1 / -1' }}><span className={styles.fieldLabel}>Internal notes</span><textarea className={styles.textarea} name="notes" /></label>
            <button className={styles.primaryAction} type="submit">Ajouter la règle tarifaire</button>
          </form></Panel>
          <Panel id="matrix" eyebrow="Pricing matrix" title="Loaded pricing rules" text="The primary view adapts to both explicit price records and condition/modifier-shaped records without changing either schema.">
            {!pricingRules.length ? <EmptyState title="Aucune règle tarifaire" text="No pricing rule is currently visible for this service." /> : <div className={styles.gridAuto}>{pricingRules.map((rule, index) => <article className={styles.card} key={rule.id || index}><div className={styles.cardTop}><div><div className={styles.cardCode}>{text(rule.duration || rule.rule_name, `RULE-${index + 1}`)}</div><h4 className={styles.cardTitle}>{'price' in rule ? money(rule.price) : text(rule.rule_name || rule.name, 'Modifier rule')}</h4></div><SourceBadge label={text(rule.status, rule.active === false ? 'inactive' : 'active')} tone={rule.status === 'inactive' || rule.active === false ? 'unavailable' : 'live'} /></div><div className={styles.cardText}>{'price' in rule ? `${text(rule.city, 'Any city')} · ${text(rule.region, 'Any region')} · ${text(rule.client_type, 'Any client')} · ${text(rule.skill_level, 'Standard skill')}` : `${text(rule.condition, 'Condition not visible')} · modifier ${text(rule.modifier, 'not visible')}`}</div>{rule.notes ? <div className={styles.pills}><StatPill>{String(rule.notes)}</StatPill></div> : null}</article>)}</div>}
          </Panel>
          <Panel id="quality" eyebrow="Data-quality observations" title="Pricing integrity" text="Observations are advisory and do not mutate the service or pricing records."><div className={styles.grid4}><MiniStat label="No explicit price" value={!prices.length ? 'Attention' : 'OK'} /><MiniStat label="Inactive rules" value={pricingRules.length - activeRules} /><MiniStat label="B2C / B2B" value={`${b2cRules}/${b2bRules}`} /><MiniStat label="Schema mode" value={schemaMode} /></div></Panel>
        </div>
        <CommandRail><DarkRailCard title="Pricing governance" alerts={[{ title: 'Schema truth', text: `Loaded records currently indicate: ${schemaMode}.` }, { title: 'Commercial integrity', text: 'This page does not claim tax, discount, credit-note or accounting approval features.' }, { title: 'Cross-module safety', text: 'Saving a rule does not rewrite contracts, orders, missions or invoices.' }]} /><LightRailCard title="Service context"><ReviewRow label="Service" value={text(service.service_code)} /><ReviewRow label="Base price" value={money(service.base_price)} /><ReviewRow label="Pricing model" value={text(service.pricing_model)} /><ReviewRow label="Rules" value={pricingRules.length} /></LightRailCard><LightRailCard title="Navigation"><ReviewRow label="Service dossier" value={<Link className={styles.textLink} href={`/services/${String(service.service_code || '').replace(/^#/, '')}`}>Open</Link>} /><ReviewRow label="Global engine" value={<Link className={styles.textLink} href="/services/pricing-engine">Open</Link>} /></LightRailCard></CommandRail>
      </div>
    </main>
  </AppShell>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className={styles.field}><span className={styles.fieldLabel}>{label}</span>{children}</label> }
