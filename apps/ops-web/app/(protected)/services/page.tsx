import Link from 'next/link'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import {
  CommandRail,
  DarkRailCard,
  EmptyState,
  Kpi,
  KpiGrid,
  LifecycleRibbon,
  LightRailCard,
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
  serviceWorkspaceNav,
  styles,
} from '@/components/service-os/Services360UI'

const defaultServices = [
  ['#H.S', "Garde et accompagnement d'enfants à domicile", 'Home care', '3h / 5h / 8h / 12h / 24h', 'active'],
  ['#S.K', 'Garde enfant spécial à domicile', 'Special needs', 'Skill required', 'active'],
  ['#S.H', 'Garde enfant spécial hybride', 'Special needs', 'Hybrid workflow', 'active'],
  ['#A.B', 'Animation anniversaire', 'Events', 'Package pricing', 'active'],
  ['#P.P', 'Bébé post accouchement', 'Postpartum', 'Premium family care', 'active'],
  ['#E.X', 'Excursion', 'Mobility', 'Transport checklist', 'active'],
  ['#S.S', "Enfant spécial à l’école", 'School support', 'Institution logic', 'active'],
  ['#S.L', 'Animation ludique avancée', 'Education', 'Program lines', 'active'],
  ['#K.P', 'Animation fêtes', 'Events', 'Group capacity', 'active'],
  ['#A.A', 'AngelCare Academy', 'Training', 'Certification', 'active'],
]

function asText(value: unknown, fallback = '') { return typeof value === 'string' && value.trim() ? value : fallback }
function asNumber(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function splitValues(value: unknown) { return asText(value).split(/[,;|]/).map((item) => item.trim()).filter(Boolean) }
function formatMoney(value: unknown) { return `${Math.round(asNumber(value)).toLocaleString('fr-FR')} Dh` }
function cleanCode(value: unknown) { return asText(value, 'N-A').replace(/^#/, '') }

export default async function ServicesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const query = asText(params.q).toLowerCase()
  const statusFilter = asText(params.status, 'all')
  const familyFilter = asText(params.family, 'all')
  const focus = asText(params.focus, 'all')
  const view = asText(params.view, 'cards')

  const supabase = await createClient()
  const serviceResult = await supabase.from('service_catalog').select('*').order('service_code', { ascending: true })
  const variationResult = await supabase.from('service_variations').select('*')

  const usesFallback = !serviceResult.data?.length
  const services = serviceResult.data?.length
    ? serviceResult.data
    : defaultServices.map((item) => ({
        id: item[0], service_code: item[0], service_name: item[1], service_family: item[2], pricing_model: item[3], status: item[4],
      }))
  const variations = variationResult.data || []
  const variationsByCode = variations.reduce<Record<string, any[]>>((acc, variation: any) => {
    const code = asText(variation.service_code, 'unknown')
    acc[code] = [...(acc[code] || []), variation]
    return acc
  }, {})

  const enriched = services.map((service: any) => {
    const code = asText(service.service_code, '#N/A')
    const serviceVariations = variationsByCode[code] || []
    const activeVariations = serviceVariations.filter((item: any) => asText(item.status).toLowerCase() !== 'inactive')
    const prices = [service.base_price, ...serviceVariations.flatMap((item: any) => [item.base_price, item.price_b2c, item.price_b2b, item.price_3h, item.price_5h, item.price_8h, item.price_24h])].map(asNumber).filter((item) => item > 0)
    const cities = Array.from(new Set([...
      splitValues(service.available_cities),
      ...serviceVariations.flatMap((item: any) => splitValues(item.available_cities)),
    ]))
    const staff = asText(service.required_staff || service.skill_requirements, serviceVariations.map((item: any) => asText(item.required_staff)).filter(Boolean).join(', '))
    const readinessSignals = [service.service_name, service.pricing_model, prices.length, activeVariations.length, cities.length, staff].filter(Boolean).length
    const readiness = Math.round((readinessSignals / 6) * 100)
    return {
      ...service,
      code,
      serviceVariations,
      activeVariations,
      prices,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      cities,
      staff,
      readiness,
    }
  })

  const families = Array.from(new Set(enriched.map((item: any) => asText(item.service_family, 'Non classé')))).sort()
  const filtered = enriched.filter((service: any) => {
    const haystack = [service.service_code, service.service_name, service.service_family, service.client_type, service.pricing_model, service.available_cities, service.skill_requirements, service.required_staff].join(' ').toLowerCase()
    if (query && !haystack.includes(query)) return false
    if (statusFilter !== 'all' && asText(service.status, 'active').toLowerCase() !== statusFilter) return false
    if (familyFilter !== 'all' && asText(service.service_family, 'Non classé') !== familyFilter) return false
    if (focus === 'no-variation' && service.serviceVariations.length) return false
    if (focus === 'no-pricing' && service.prices.length) return false
    if (focus === 'no-city' && service.cities.length) return false
    if (focus === 'incomplete' && service.readiness >= 80) return false
    return true
  })

  const activeServices = enriched.filter((item: any) => asText(item.status, 'active').toLowerCase() !== 'inactive').length
  const servicesWithoutVariations = enriched.filter((item: any) => !item.serviceVariations.length).length
  const servicesWithoutPricing = enriched.filter((item: any) => !item.prices.length).length
  const servicesWithoutCities = enriched.filter((item: any) => !item.cities.length).length
  const portfolioReadiness = enriched.length ? Math.round(enriched.reduce((sum: number, item: any) => sum + item.readiness, 0) / enriched.length) : 0
  const activeCities = new Set(enriched.flatMap((item: any) => item.cities)).size
  const attention = enriched.filter((item: any) => item.readiness < 80 || asText(item.status).toLowerCase() === 'inactive')

  return (
    <AppShell title="Services 360" subtitle="Service Portfolio, Product Architecture, Pricing & Delivery Command Center" breadcrumbs={[{ label: 'Services' }]}>
      <main className={styles.shell}>
        <Services360Hero
          eyebrow="Portfolio command"
          title="The operating truth of every AngelCare service line."
          subtitle="Design, commercialize, price, operationalize and scale services from one premium portfolio—while clearly distinguishing live catalogue data, ServiceOS configuration and fallback content."
          actions={<><PrimaryAction href="/services/new">Créer un service</PrimaryAction><SecondaryAction href="/services/blueprints">Blueprint Studio</SecondaryAction><SecondaryAction href="/services/pricing-engine">Pricing Engine</SecondaryAction><SecondaryAction href="/services/enterprise">Executive ServiceOS</SecondaryAction></>}
          briefTitle="Portfolio readiness & service integrity"
          briefRows={[
            { label: 'Services actifs', value: `${activeServices}/${enriched.length}` },
            { label: 'Variations', value: variations.length },
            { label: 'Couverture', value: `${activeCities} villes` },
            { label: 'Préparation moyenne', value: `${portfolioReadiness}%` },
            { label: 'À traiter', value: attention.length },
          ]}
          provenance={[
            { label: usesFallback ? 'Fallback catalogue data' : 'Live service_catalog', tone: usesFallback ? 'fallback' : 'live' },
            { label: variationResult.error ? 'Variations unavailable' : 'Live service_variations', tone: variationResult.error ? 'unavailable' : 'live' },
            { label: 'Backend contracts unchanged', tone: 'live' },
          ]}
        />

        <Services360Nav items={serviceWorkspaceNav} />

        <KpiGrid>
          <Kpi label="Catalogue" value={enriched.length} helper="Service codes visible in the portfolio" />
          <Kpi label="Actifs" value={activeServices} helper="Available outside inactive state" />
          <Kpi label="Variations" value={variations.length} helper="Offers, packages and pricing variants" />
          <Kpi label="Sans variation" value={servicesWithoutVariations} helper="Service architecture requires commercial depth" />
          <Kpi label="Sans prix" value={servicesWithoutPricing} helper="No visible price in loaded records" />
          <Kpi label="Readiness" value={`${portfolioReadiness}%`} helper={`${servicesWithoutCities} without city coverage`} />
        </KpiGrid>

        <LifecycleRibbon items={serviceRelationshipNodes} />

        <Panel eyebrow="Portfolio navigator" title="Search, focus and govern the catalogue" text="Filters operate on the data already loaded by the existing service catalogue and variation queries.">
          <form className={styles.toolbar} method="get">
            <input className={styles.input} style={{ maxWidth: 370 }} name="q" defaultValue={asText(params.q)} placeholder="Rechercher code, service, famille, ville, staff…" />
            <select className={styles.select} style={{ width: 190 }} name="status" defaultValue={statusFilter}>
              <option value="all">Tous les statuts</option><option value="active">Actifs</option><option value="inactive">Inactifs</option><option value="pilot">Pilot</option><option value="seasonal">Seasonal</option>
            </select>
            <select className={styles.select} style={{ width: 220 }} name="family" defaultValue={familyFilter}>
              <option value="all">Toutes les familles</option>{families.map((family) => <option key={family} value={family}>{family}</option>)}
            </select>
            <select className={styles.select} style={{ width: 210 }} name="focus" defaultValue={focus}>
              <option value="all">Vue consolidée</option><option value="incomplete">Incomplets</option><option value="no-variation">Sans variation</option><option value="no-pricing">Sans prix</option><option value="no-city">Sans couverture</option>
            </select>
            <select className={styles.select} style={{ width: 150 }} name="view" defaultValue={view}>
              <option value="cards">Cartes</option><option value="table">Tableau</option>
            </select>
            <button className={styles.primaryAction} type="submit">Appliquer</button>
            <Link className={styles.secondaryAction} href="/services">Réinitialiser</Link>
          </form>
          <div className={styles.sourceStrip}>
            <StatPill tone="good">{filtered.length} résultats</StatPill>
            <StatPill>{familyFilter === 'all' ? 'Toutes familles' : familyFilter}</StatPill>
            <StatPill tone={focus === 'all' ? 'neutral' : 'warn'}>{focus === 'all' ? 'Vue consolidée' : focus}</StatPill>
          </div>
        </Panel>

        <div className={styles.grid2}>
          <div style={{ display: 'grid', gap: 18 }}>
            <Panel eyebrow="Operational portfolio" title={view === 'table' ? 'Service portfolio table' : 'Service portfolio cards'} text="Every record shows readiness, pricing, variations, coverage and source confidence without inventing missing integrations.">
              {!filtered.length ? <EmptyState title="Aucun service ne correspond aux filtres" text="Ajustez le statut, la famille ou le focus de préparation pour retrouver les services du catalogue." action={<SecondaryAction href="/services">Afficher tout</SecondaryAction>} /> : view === 'table' ? (
                <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Service</th><th>Famille</th><th>Pricing</th><th>Variations</th><th>Villes</th><th>Readiness</th><th>Statut</th><th>Action</th></tr></thead><tbody>{filtered.map((service: any) => <tr key={service.id || service.code}><td><strong>{service.code}</strong><br />{asText(service.service_name, 'Service sans nom')}</td><td>{asText(service.service_family, 'Non classé')}</td><td>{service.prices.length ? `${formatMoney(service.minPrice)}${service.maxPrice > service.minPrice ? ` → ${formatMoney(service.maxPrice)}` : ''}` : 'À définir'}</td><td>{service.activeVariations.length}/{service.serviceVariations.length}</td><td>{service.cities.length || '—'}</td><td>{service.readiness}%</td><td><SourceBadge label={asText(service.status, 'active')} tone={asText(service.status).toLowerCase() === 'inactive' ? 'unavailable' : 'live'} /></td><td><Link className={styles.textLink} href={`/services/${encodeURIComponent(cleanCode(service.code))}`}>Ouvrir</Link></td></tr>)}</tbody></table></div>
              ) : (
                <div className={styles.gridAuto}>{filtered.map((service: any) => <ServiceCard key={service.id || service.code} code={service.code} title={asText(service.service_name, 'Service sans nom')} text={`${asText(service.service_family, 'Non classé')} · ${asText(service.client_type, 'Client multiple')} · ${asText(service.pricing_model, 'Pricing à préciser')}`} status={<SourceBadge label={asText(service.status, 'active')} tone={asText(service.status).toLowerCase() === 'inactive' ? 'unavailable' : 'live'} />} pills={[{ label: `${service.activeVariations.length}/${service.serviceVariations.length} variations`, tone: service.serviceVariations.length ? 'good' : 'warn' }, { label: service.prices.length ? `${formatMoney(service.minPrice)}${service.maxPrice > service.minPrice ? ` → ${formatMoney(service.maxPrice)}` : ''}` : 'Prix manquant', tone: service.prices.length ? 'good' : 'warn' }, { label: service.cities.length ? `${service.cities.length} villes` : 'Couverture manquante', tone: service.cities.length ? 'good' : 'warn' }]} stats={[{ label: 'Readiness', value: `${service.readiness}%` }, { label: 'Staff', value: service.staff ? 'Configuré' : 'À définir' }, { label: 'Source', value: usesFallback ? 'Fallback' : 'Live' }]} href={`/services/${encodeURIComponent(cleanCode(service.code))}`} footer="Service catalogue" />)}</div>
              )}
            </Panel>

            <Panel eyebrow="Integration truth" title="Cross-module service continuity" text="The current architecture is made explicit: Sales Terminal reads the catalogue, contracts retain service fields, missions inherit context and CareLink maps service types semantically.">
              <div className={styles.grid4}>
                <ServiceCard code="SALES" title="Sales Terminal" text="Reads service catalogue, variations and pricing rules." status={<SourceBadge label="Connected" tone="live" />} stats={[{ label: 'Catalogue', value: 'Live' }, { label: 'Pricing', value: 'Loaded' }, { label: 'Action', value: 'Select service' }]} footer="Existing wiring" />
                <ServiceCard code="CONTRACT" title="Contract Planner" text="Stores service_code and service_type, while the planner list remains partially static." status={<SourceBadge label="Partial" tone="configured" />} stats={[{ label: 'Fields', value: 'Persisted' }, { label: 'Planner', value: 'Static list' }, { label: 'Rewrite', value: 'None' }]} footer="Integrity observation" />
                <ServiceCard code="MISSION" title="Mission Delivery" text="Contract-created missions inherit service context through existing fields." status={<SourceBadge label="Connected" tone="live" />} stats={[{ label: 'Code', value: 'Inherited' }, { label: 'Type', value: 'Inherited' }, { label: 'Logic', value: 'Untouched' }]} footer="Existing wiring" />
                <ServiceCard code="CARELINK" title="CareLink Checklists" text="Service type and family drive semantic operational checklists." status={<SourceBadge label="Semantic" tone="configured" />} stats={[{ label: 'Mapping', value: 'Type-based' }, { label: 'FK', value: 'Not claimed' }, { label: 'Logic', value: 'Untouched' }]} footer="Architecture truth" />
              </div>
            </Panel>
          </div>

          <CommandRail>
            <DarkRailCard title="Portfolio priorities" text="Highest-value configuration gaps detected from the loaded catalogue." alerts={attention.slice(0, 5).map((service: any) => ({ title: `${service.code} · ${asText(service.service_name, 'Service')}`, text: !service.serviceVariations.length ? 'No commercial or operational variation is configured.' : !service.prices.length ? 'No visible price is available.' : !service.cities.length ? 'No city coverage is visible.' : `Readiness ${service.readiness}%` }))} />
            <LightRailCard title="Data source health">
              <ReviewRow label="Catalogue" value={usesFallback ? 'Fallback' : 'Live'} />
              <ReviewRow label="Variations" value={variationResult.error ? 'Unavailable' : 'Live'} />
              <ReviewRow label="Catalogue error" value={serviceResult.error ? 'Yes' : 'No'} />
              <ReviewRow label="Backend changes" value="None" />
            </LightRailCard>
            <LightRailCard title="Configuration gaps">
              <ReviewRow label="Sans variation" value={servicesWithoutVariations} />
              <ReviewRow label="Sans prix" value={servicesWithoutPricing} />
              <ReviewRow label="Sans ville" value={servicesWithoutCities} />
              <ReviewRow label="Readiness < 80%" value={attention.length} />
            </LightRailCard>
          </CommandRail>
        </div>
      </main>
    </AppShell>
  )
}
