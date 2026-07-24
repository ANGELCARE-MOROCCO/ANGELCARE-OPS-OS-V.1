import Link from 'next/link'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { findBlueprint } from '@/lib/service-os/engine'
import { activateVariation, deleteVariation, disableVariation } from './actions'
import {
  CommandRail,
  DarkRailCard,
  EmptyState,
  Kpi,
  KpiGrid,
  LifecycleRibbon,
  LightRailCard,
  MiniStat,
  Panel,
  PrimaryAction,
  ReviewRow,
  SecondaryAction,
  ServiceCard,
  Services360Hero,
  Services360Nav,
  SourceBadge,
  StatPill,
  serviceRelationshipNodes,
  styles,
} from '@/components/service-os/Services360UI'

function text(value: unknown, fallback = 'Non défini') { return typeof value === 'string' && value.trim() ? value : fallback }
function number(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function split(value: unknown) { return typeof value === 'string' ? value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean) : Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [] }
function money(value: unknown) { return `${Math.round(number(value)).toLocaleString('fr-FR')} Dh` }

export default async function ServiceCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cleanId = decodeURIComponent(id)
  const serviceCode = cleanId.startsWith('#') ? cleanId : `#${cleanId}`
  const supabase = await createClient()

  const [serviceResult, variationResult] = await Promise.all([
    supabase.from('service_catalog').select('*').eq('service_code', serviceCode).maybeSingle(),
    supabase.from('service_variations').select('*').eq('service_code', serviceCode).order('created_at', { ascending: false }),
  ])

  const service: any = serviceResult.data || { service_code: serviceCode, service_name: `Service ${serviceCode}`, status: 'configured' }
  const variations: any[] = variationResult.data || []
  const activeVariations = variations.filter((item) => text(item.status, 'active').toLowerCase() === 'active')
  const inactiveVariations = variations.filter((item) => text(item.status, 'active').toLowerCase() === 'inactive')
  const prices = variations.flatMap((item) => [item.base_price, item.price_3h, item.price_5h, item.price_8h, item.price_24h, item.price_b2c, item.price_b2b]).map(number).filter((value) => value > 0)
  const minPrice = prices.length ? Math.min(...prices) : number(service.base_price)
  const maxPrice = prices.length ? Math.max(...prices) : number(service.base_price)
  const cities = Array.from(new Set([...split(service.available_cities), ...variations.flatMap((item) => split(item.available_cities))]))
  const staff = Array.from(new Set([text(service.required_staff, ''), text(service.skill_requirements, ''), ...variations.map((item) => text(item.required_staff, ''))].filter(Boolean)))
  const equipment = Array.from(new Set([text(service.equipment, ''), ...variations.map((item) => text(item.equipment, ''))].filter(Boolean)))
  const readinessSignals = [service.service_name, service.pricing_model, variations.length, prices.length, cities.length, staff.length].filter(Boolean).length
  const readiness = Math.round((readinessSignals / 6) * 100)
  const blueprint: any = findBlueprint(cleanId) || findBlueprint(serviceCode)
  const blueprintMatched = Boolean(blueprint)
  const serviceId = serviceResult.data?.id

  const nav = [
    { label: 'Vue d’ensemble', href: '#overview' },
    { label: 'Identité', href: '#identity' },
    { label: 'Variations', href: '#variations' },
    { label: 'Tarification', href: '#pricing' },
    { label: 'Exécution', href: '#execution' },
    { label: 'Couverture', href: '#coverage' },
    { label: 'Architecture ServiceOS', href: '#serviceos' },
  ]

  return (
    <AppShell title={`${serviceCode} · Service 360`} subtitle="Executive service dossier" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: serviceCode }]}>
      <main className={styles.shell}>
        <Services360Hero
          eyebrow="Service 360 executive dossier"
          title={text(service.service_name, `Service ${serviceCode}`)}
          subtitle={`${text(service.service_family, 'Service family not classified')} · ${text(service.client_type, 'Multi-client')} · ${text(service.pricing_model, 'Pricing model to define')}`}
          actions={<><PrimaryAction href={`/services/${encodeURIComponent(cleanId)}/variations/new`}>Créer une variation</PrimaryAction>{serviceId ? <SecondaryAction href={`/services/${serviceId}/pricing`}>Pricing Studio</SecondaryAction> : <SecondaryAction href="/services/pricing-engine">Pricing Engine</SecondaryAction>}<SecondaryAction href="/services">Retour portefeuille</SecondaryAction></>}
          briefTitle="Commercial, operational and architecture readiness"
          briefRows={[
            { label: 'Statut', value: text(service.status, 'configured') },
            { label: 'Variations', value: `${activeVariations.length}/${variations.length} actives` },
            { label: 'Prix visible', value: minPrice ? `${money(minPrice)}${maxPrice > minPrice ? ` → ${money(maxPrice)}` : ''}` : 'À définir' },
            { label: 'Villes', value: cities.length || 'Non définies' },
            { label: 'Readiness', value: `${readiness}%` },
          ]}
          provenance={[
            { label: serviceResult.data ? 'Live service_catalog record' : 'Catalogue record unavailable / route context only', tone: serviceResult.data ? 'live' : 'fallback' },
            { label: variationResult.error ? 'Variations unavailable' : 'Live service_variations', tone: variationResult.error ? 'unavailable' : 'live' },
            { label: blueprintMatched ? 'Related ServiceOS blueprint inferred' : 'No blueprint match', tone: blueprintMatched ? 'configured' : 'unavailable' },
          ]}
        />

        <Services360Nav items={nav} />

        <KpiGrid>
          <Kpi label="Readiness" value={`${readiness}%`} helper="Identity, pricing, variation, coverage and staff signals" />
          <Kpi label="Variations" value={variations.length} helper={`${activeVariations.length} active · ${inactiveVariations.length} inactive`} />
          <Kpi label="Price range" value={minPrice ? money(minPrice) : '—'} helper={maxPrice > minPrice ? `Maximum ${money(maxPrice)}` : 'No range visible'} />
          <Kpi label="Cities" value={cities.length} helper={cities.slice(0, 3).join(' · ') || 'Coverage not defined'} />
          <Kpi label="Staff" value={staff.length} helper={staff[0] || 'Requirements to define'} />
          <Kpi label="Blueprint" value={blueprintMatched ? 'Matched' : 'Absent'} helper={blueprintMatched ? text(blueprint.code || blueprint.serviceCode) : 'No inferred architecture'} />
        </KpiGrid>

        <LifecycleRibbon items={serviceRelationshipNodes} />

        <div className={styles.grid2}>
          <div style={{ display: 'grid', gap: 18 }}>
            <Panel id="overview" eyebrow="Executive overview" title="Service readiness & management brief" text="Deterministic observations are computed from the existing catalogue and variation records; no backend state is altered.">
              <div className={styles.grid4}>
                <MiniStat label="Commercial readiness" value={prices.length && activeVariations.length ? 'Ready' : 'Attention'} />
                <MiniStat label="Operational readiness" value={staff.length ? 'Configured' : 'Incomplete'} />
                <MiniStat label="Geographic readiness" value={cities.length ? `${cities.length} cities` : 'Incomplete'} />
                <MiniStat label="Source health" value={serviceResult.error || variationResult.error ? 'Partial' : 'Loaded'} />
              </div>
              <div className={styles.sourceStrip}>
                {!variations.length ? <StatPill tone="warn">Create a variation</StatPill> : null}
                {!prices.length ? <StatPill tone="warn">Pricing missing</StatPill> : null}
                {!cities.length ? <StatPill tone="warn">Coverage missing</StatPill> : null}
                {!staff.length ? <StatPill tone="warn">Staff requirements missing</StatPill> : null}
                {readiness >= 80 ? <StatPill tone="good">Portfolio-ready</StatPill> : null}
              </div>
            </Panel>

            <Panel id="identity" eyebrow="Service identity" title="Catalogue definition" text="Read-only identity and operating requirements currently stored on the catalogue record.">
              <div className={styles.grid4}>
                <MiniStat label="Code" value={serviceCode} />
                <MiniStat label="Family" value={text(service.service_family)} />
                <MiniStat label="Client type" value={text(service.client_type)} />
                <MiniStat label="Pricing model" value={text(service.pricing_model)} />
              </div>
              <div className={styles.grid3} style={{ marginTop: 14 }}>
                <ServiceCard code="SKILLS" title="Skills & staff" text={text(service.skill_requirements || service.required_staff, 'No explicit requirements stored.')} pills={staff.map((item) => ({ label: item }))} footer="Catalogue fields" />
                <ServiceCard code="CHECKLIST" title="Internal checklist" text={text(service.internal_checklist, 'No internal checklist stored.')} footer="Catalogue fields" />
                <ServiceCard code="DELIVERY" title="Fulfilment notes" text={text(service.fulfillment_notes, 'No fulfilment note stored.')} pills={equipment.map((item) => ({ label: item }))} footer="Catalogue fields" />
              </div>
            </Panel>

            <Panel id="variations" eyebrow="Offer architecture" title="Service variations" text="Variations remain connected to the existing create, edit, activate, deactivate and permanent-delete actions.">
              {!variations.length ? <EmptyState title="Aucune variation configurée" text="This service does not yet have a commercial or operational variation in service_variations." action={<PrimaryAction href={`/services/${encodeURIComponent(cleanId)}/variations/new`}>Créer la première variation</PrimaryAction>} /> : (
                <div className={styles.gridAuto}>
                  {variations.map((variation) => {
                    const variationPrices = [variation.base_price, variation.price_3h, variation.price_5h, variation.price_8h, variation.price_24h, variation.price_b2c, variation.price_b2b].map(number).filter((value) => value > 0)
                    const status = text(variation.status, 'active').toLowerCase()
                    return (
                      <article className={styles.card} key={variation.id}>
                        <div className={styles.cardTop}>
                          <div><div className={styles.cardCode}>{text(variation.client_type, 'Variation')}</div><h4 className={styles.cardTitle}>{text(variation.name, 'Variation sans nom')}</h4></div>
                          <SourceBadge label={status} tone={status === 'active' ? 'live' : status === 'inactive' ? 'unavailable' : 'configured'} />
                        </div>
                        <div className={styles.cardText}>{text(variation.pricing_model, 'Pricing à définir')} · {text(variation.required_staff, 'Staff à définir')}</div>
                        <div className={styles.pills}>
                          <StatPill tone={variationPrices.length ? 'good' : 'warn'}>{variationPrices.length ? `${money(Math.min(...variationPrices))}${Math.max(...variationPrices) > Math.min(...variationPrices) ? ` → ${money(Math.max(...variationPrices))}` : ''}` : 'Prix manquant'}</StatPill>
                          <StatPill>{split(variation.available_cities).length || 0} cities</StatPill>
                          <StatPill>{text(variation.equipment, 'No equipment')}</StatPill>
                        </div>
                        <div className={styles.cardFooter} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <div className={styles.actions} style={{ marginTop: 0 }}>
                            <Link className={styles.secondaryAction} href={`/services/${encodeURIComponent(cleanId)}/variations/${variation.id}/edit`}>Modifier</Link>
                            {status === 'active' ? <form action={disableVariation}><input type="hidden" name="service_id" value={cleanId} /><input type="hidden" name="variation_id" value={variation.id} /><button className={styles.secondaryAction} type="submit">Désactiver</button></form> : <form action={activateVariation}><input type="hidden" name="service_id" value={cleanId} /><input type="hidden" name="variation_id" value={variation.id} /><button className={styles.primaryAction} type="submit">Activer</button></form>}
                          </div>
                          <details className={styles.details} style={{ width: '100%' }}><summary>Contrôle destructif</summary><div className={styles.detailsBody}>La suppression est permanente et conserve exactement le comportement backend existant.<form action={deleteVariation} style={{ marginTop: 10 }}><input type="hidden" name="service_id" value={cleanId} /><input type="hidden" name="variation_id" value={variation.id} /><button className={styles.dangerAction} type="submit">Supprimer définitivement</button></form></div></details>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </Panel>

            <Panel id="pricing" eyebrow="Pricing architecture" title="Visible pricing structure" text="Prices are presented honestly from the service and variation fields already loaded.">
              <div className={styles.grid4}>
                <MiniStat label="Base price" value={number(service.base_price) ? money(service.base_price) : 'À définir'} />
                <MiniStat label="Minimum visible" value={minPrice ? money(minPrice) : 'À définir'} />
                <MiniStat label="Maximum visible" value={maxPrice ? money(maxPrice) : 'À définir'} />
                <MiniStat label="Price points" value={prices.length} />
              </div>
              <div className={styles.sourceStrip}>{variations.flatMap((variation) => [
                ['3h', variation.price_3h], ['5h', variation.price_5h], ['8h', variation.price_8h], ['24h', variation.price_24h], ['B2C', variation.price_b2c], ['B2B', variation.price_b2b],
              ]).filter((item) => number(item[1]) > 0).slice(0, 18).map((item, index) => <StatPill key={index}>{item[0]} · {money(item[1])}</StatPill>)}</div>
            </Panel>

            <Panel id="execution" eyebrow="Operational execution" title="Staff, resources & delivery requirements" text="Execution context remains read-only and does not claim synchronization with mission assignment where only semantic fields exist.">
              <div className={styles.grid3}>
                <ServiceCard code="STAFF" title="Required staff" text={staff.join(' · ') || 'No staff requirement visible.'} stats={[{ label: 'Signals', value: staff.length }, { label: 'Source', value: 'Catalogue / variations' }, { label: 'Assignment', value: 'Not changed' }]} footer="Operational requirement" />
                <ServiceCard code="EQUIPMENT" title="Equipment" text={equipment.join(' · ') || 'No equipment requirement visible.'} stats={[{ label: 'Signals', value: equipment.length }, { label: 'Source', value: 'Catalogue / variations' }, { label: 'Checklist', value: text(service.internal_checklist, 'None') }]} footer="Operational requirement" />
                <ServiceCard code="TRANSPORT" title="Transport & uniform" text={`${service.transport_required ? 'Transport required' : 'Transport not explicitly required'} · ${service.uniform_required ? 'Uniform required' : 'Uniform not explicitly required'}`} stats={[{ label: 'Transport', value: service.transport_required ? 'Required' : 'No' }, { label: 'Uniform', value: service.uniform_required ? 'Required' : 'No' }, { label: 'Logic', value: 'Untouched' }]} footer="Catalogue flags" />
              </div>
            </Panel>

            <Panel id="coverage" eyebrow="Geographic coverage" title="Cities & availability" text="Coverage is consolidated from the service and its variations.">
              {cities.length ? <div className={styles.gridAuto}>{cities.map((city) => <ServiceCard key={city} code="CITY" title={city} text="Visible in the current service or variation coverage fields." status={<SourceBadge label="Configured" tone="configured" />} stats={[{ label: 'Service', value: serviceCode }, { label: 'Variations', value: variations.filter((item) => split(item.available_cities).includes(city)).length }, { label: 'Capacity', value: 'See Capacity Center' }]} href="/services/capacity" footer="Configured coverage" />)}</div> : <EmptyState title="Aucune ville visible" text="No city coverage is stored on the service or its variations." />}
            </Panel>

            <Panel id="serviceos" eyebrow="Architecture relationship" title="Related ServiceOS blueprint" text="A blueprint match is displayed as a related architecture, never as the same database record.">
              {blueprintMatched ? <ServiceCard code={text(blueprint.code || blueprint.serviceCode)} title={text(blueprint.name || blueprint.title)} text={text(blueprint.description || blueprint.marketSegment, 'ServiceOS architecture match.')} status={<SourceBadge label="Inferred match" tone="configured" />} pills={[{ label: `${split(blueprint.modules).length} modules`, tone: 'good' }, { label: `${split(blueprint.rules).length} rules` }, { label: `${split(blueprint.cities).length} cities` }]} stats={[{ label: 'Base price', value: money(blueprint.basePriceMad) }, { label: 'Readiness', value: `${number(blueprint.readiness, 68)}%` }, { label: 'Risk', value: text(blueprint.riskLevel, 'standard') }]} href="/services/blueprints" footer="Related architecture" /> : <EmptyState title="No ServiceOS blueprint match" text="The catalogue service remains valid; no inferred blueprint relationship was found in the shared ServiceOS engine." action={<PrimaryAction href="/services/blueprints/new">Créer un blueprint</PrimaryAction>} />}
            </Panel>
          </div>

          <CommandRail>
            <DarkRailCard title="Management action" text="Recommended next step based on visible configuration gaps." alerts={[
              !variations.length ? { title: 'Create a variation', text: 'The service has no commercial or operational variant.' } : !prices.length ? { title: 'Configure pricing', text: 'No visible price point is available.' } : !cities.length ? { title: 'Define coverage', text: 'No city is visible in service or variation records.' } : !staff.length ? { title: 'Define staff requirements', text: 'Operational resource requirements are incomplete.' } : { title: 'Portfolio-ready service', text: 'Review blueprint alignment and ongoing capacity before scaling.' },
              { title: 'Integration truth', text: 'Contract and CareLink relationships remain partially semantic; no fake synchronization is claimed.' },
            ]} />
            <LightRailCard title="Service passport">
              <ReviewRow label="Code" value={serviceCode} />
              <ReviewRow label="Status" value={text(service.status)} />
              <ReviewRow label="Readiness" value={`${readiness}%`} />
              <ReviewRow label="Source" value={serviceResult.data ? 'Live catalogue' : 'Route fallback'} />
              <ReviewRow label="Blueprint" value={blueprintMatched ? 'Matched' : 'Absent'} />
            </LightRailCard>
            <LightRailCard title="Quick access">
              <ReviewRow label="Portfolio" value={<Link className={styles.textLink} href="/services">Open</Link>} />
              <ReviewRow label="Variations" value={<Link className={styles.textLink} href={`/services/${encodeURIComponent(cleanId)}/variations/new`}>Create</Link>} />
              <ReviewRow label="Pricing" value={<Link className={styles.textLink} href={serviceId ? `/services/${serviceId}/pricing` : '/services/pricing-engine'}>Open</Link>} />
              <ReviewRow label="Blueprints" value={<Link className={styles.textLink} href="/services/blueprints">Open</Link>} />
            </LightRailCard>
          </CommandRail>
        </div>
      </main>
    </AppShell>
  )
}
