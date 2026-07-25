import Link from 'next/link'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import {
  ActionLink,
  CommandHeader,
  CommercialCoreBar,
  EmptyState,
  Metric,
  MetricStrip,
  SectionHeading,
  Status,
  TruthNotice,
  WorkspaceNav,
} from '@/components/commercial-core/CommercialCoreShell'
import styles from './_phase1/services-phase1.module.css'

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

const workspaceItems = [
  { href: '/services', label: 'Portfolio', description: 'Offre & readiness' },
  { href: '/services/blueprints', label: 'Blueprints', description: 'Architecture de livraison' },
  { href: '/services/pricing-engine', label: 'Tarification', description: 'Prix & règles' },
  { href: '/services/operations', label: 'Delivery readiness', description: 'Opérations & capacité' },
  { href: '/services/configuration', label: 'Gouvernance', description: 'Modules & règles' },
  { href: '/services/enterprise', label: 'Executive', description: 'Vue ServiceOS' },
]

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function split(value: unknown) {
  return text(value).split(/[,;|]/).map((item) => item.trim()).filter(Boolean)
}

function money(value: unknown) {
  return `${Math.round(num(value)).toLocaleString('fr-FR')} Dh`
}

function statusTone(value: unknown): 'good' | 'attention' | 'risk' | 'neutral' {
  const normalized = text(value, 'active').toLowerCase()
  if (['active', 'ready', 'published'].includes(normalized)) return 'good'
  if (['inactive', 'disabled', 'archived'].includes(normalized)) return 'risk'
  if (['pilot', 'draft', 'seasonal'].includes(normalized)) return 'attention'
  return 'neutral'
}

function statusLabel(value: unknown) {
  const normalized = text(value, 'active').toLowerCase()
  const labels: Record<string, string> = {
    active: 'Actif', inactive: 'Inactif', draft: 'En préparation', pilot: 'Pilote', seasonal: 'Saisonnier', ready: 'Prêt',
  }
  return labels[normalized] || normalized.replaceAll('_', ' ')
}

function readinessState(value: boolean, partial = false): 'ready' | 'attention' | 'missing' {
  if (value) return 'ready'
  return partial ? 'attention' : 'missing'
}

export default async function ServicesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const query = text(params.q).toLowerCase()
  const statusFilter = text(params.status, 'all')
  const familyFilter = text(params.family, 'all')
  const focus = text(params.focus, 'all')

  const supabase = await createClient()
  const [serviceResult, variationResult] = await Promise.all([
    supabase.from('service_catalog').select('*').order('service_code', { ascending: true }),
    supabase.from('service_variations').select('*'),
  ])

  const usesFallback = !serviceResult.data?.length
  const services = serviceResult.data?.length
    ? serviceResult.data
    : defaultServices.map((item) => ({
        id: item[0], service_code: item[0], service_name: item[1], service_family: item[2], pricing_model: item[3], status: item[4],
      }))
  const variations = variationResult.data || []
  const variationsByCode = variations.reduce<Record<string, any[]>>((acc, variation: any) => {
    const code = text(variation.service_code, 'unknown')
    acc[code] = [...(acc[code] || []), variation]
    return acc
  }, {})

  const enriched = services.map((service: any) => {
    const code = text(service.service_code, '#N/A')
    const serviceVariations = variationsByCode[code] || []
    const activeVariations = serviceVariations.filter((item: any) => text(item.status).toLowerCase() !== 'inactive')
    const prices = [
      service.base_price,
      ...serviceVariations.flatMap((item: any) => [item.base_price, item.price_b2c, item.price_b2b, item.price_3h, item.price_5h, item.price_8h, item.price_24h]),
    ].map((value) => num(value)).filter((value) => value > 0)
    const cities = Array.from(new Set([
      ...split(service.available_cities),
      ...serviceVariations.flatMap((item: any) => split(item.available_cities)),
    ]))
    const staff = text(service.required_staff || service.skill_requirements, serviceVariations.map((item: any) => text(item.required_staff)).filter(Boolean).join(', '))
    const identityReady = Boolean(text(service.service_name) && code)
    const commercialReady = Boolean(text(service.pricing_model) && prices.length && activeVariations.length)
    const operationalReady = Boolean(staff || text(service.internal_checklist) || text(service.equipment))
    const geographicReady = Boolean(cities.length || text(service.city_rules))
    const readiness = [identityReady, commercialReady, operationalReady, geographicReady].filter(Boolean).length
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
      identityReady,
      commercialReady,
      operationalReady,
      geographicReady,
      readiness,
    }
  })

  const families = Array.from(new Set(enriched.map((item: any) => text(item.service_family, 'Non classé')))).sort()
  const filtered = enriched.filter((service: any) => {
    const haystack = [
      service.service_code, service.service_name, service.service_family, service.client_type,
      service.pricing_model, service.available_cities, service.skill_requirements, service.required_staff,
    ].join(' ').toLowerCase()
    if (query && !haystack.includes(query)) return false
    if (statusFilter !== 'all' && text(service.status, 'active').toLowerCase() !== statusFilter) return false
    if (familyFilter !== 'all' && text(service.service_family, 'Non classé') !== familyFilter) return false
    if (focus === 'commercial-ready' && !service.commercialReady) return false
    if (focus === 'delivery-ready' && !service.operationalReady) return false
    if (focus === 'incomplete' && service.readiness === 4) return false
    if (focus === 'no-pricing' && service.prices.length) return false
    if (focus === 'no-city' && service.geographicReady) return false
    if (focus === 'inactive' && text(service.status, 'active').toLowerCase() !== 'inactive') return false
    return true
  })

  const active = enriched.filter((item: any) => text(item.status, 'active').toLowerCase() !== 'inactive').length
  const readyForSale = enriched.filter((item: any) => item.commercialReady).length
  const readyForDelivery = enriched.filter((item: any) => item.operationalReady && item.geographicReady).length
  const incomplete = enriched.filter((item: any) => item.readiness < 4).length
  const withoutPricing = enriched.filter((item: any) => !item.prices.length).length
  const withoutCoverage = enriched.filter((item: any) => !item.geographicReady).length
  const attention = enriched
    .filter((item: any) => item.readiness < 4 || text(item.status).toLowerCase() === 'inactive')
    .sort((a: any, b: any) => a.readiness - b.readiness)
    .slice(0, 7)

  return (
    <AppShell title="Services" subtitle="Offre, pricing et capacité de livraison" breadcrumbs={[{ label: 'Commercial Core' }, { label: 'Services' }]}>
      <main className={styles.page}>
        <CommercialCoreBar active="services" />

        <CommandHeader
          eyebrow="SANILA Services OS · Portfolio Command"
          title="Ce qu’ANGELCARE vend, à quel prix et avec quelle capacité de livraison."
          description="Le portefeuille de services devient la source de lecture claire de l’offre : identité, déclinaisons commerciales, pricing, exigences opérationnelles et couverture géographique."
          actions={
            <>
              <ActionLink href="/services/new" primary>Créer un service</ActionLink>
              <ActionLink href="/services/blueprints">Blueprints</ActionLink>
              <ActionLink href="/services/pricing-engine">Tarification</ActionLink>
            </>
          }
          aside={
            <div className={styles.headerBrief}>
              <span>Portfolio health</span>
              <strong>{enriched.length ? Math.round(((enriched.length - incomplete) / enriched.length) * 100) : 0}%</strong>
              <p>{readyForSale} services prêts à la vente · {readyForDelivery} prêts à la livraison · {incomplete} à compléter.</p>
            </div>
          }
          source={usesFallback ? 'Source : données de fallback — état non certifié pour production.' : 'Source : service_catalog + service_variations.'}
        />

        <WorkspaceNav items={workspaceItems} activeHref="/services" />

        {usesFallback ? (
          <TruthNotice title="Données de démonstration affichées" tone="attention">
            La source opérationnelle `service_catalog` ne retourne aucun enregistrement. Les lignes visibles servent de fallback et ne doivent pas être interprétées comme l’état certifié du portefeuille.
          </TruthNotice>
        ) : null}

        <MetricStrip>
          <Metric label="Services actifs" value={active} context={`${enriched.length} services chargés`} tone="good" />
          <Metric label="Prêts à la vente" value={readyForSale} context="Prix + variation active" tone={readyForSale ? 'good' : 'attention'} />
          <Metric label="Prêts à livrer" value={readyForDelivery} context="Ressources + couverture" tone={readyForDelivery ? 'good' : 'attention'} />
          <Metric label="À compléter" value={incomplete} context="Au moins un axe incomplet" tone={incomplete ? 'attention' : 'good'} />
          <Metric label="Sans prix" value={withoutPricing} context="Aucun prix visible" tone={withoutPricing ? 'risk' : 'good'} />
          <Metric label="Sans couverture" value={withoutCoverage} context="Aucune ville ou règle" tone={withoutCoverage ? 'attention' : 'good'} />
        </MetricStrip>

        <form className={styles.toolbar} method="get">
          <input className={styles.input} name="q" defaultValue={text(params.q)} placeholder="Rechercher un service, code, famille, ville ou compétence…" />
          <select className={styles.select} name="status" defaultValue={statusFilter}>
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
            <option value="draft">En préparation</option>
            <option value="pilot">Pilotes</option>
          </select>
          <select className={styles.select} name="family" defaultValue={familyFilter}>
            <option value="all">Toutes les familles</option>
            {families.map((family) => <option key={family} value={family}>{family}</option>)}
          </select>
          <select className={styles.select} name="focus" defaultValue={focus}>
            <option value="all">Vue complète</option>
            <option value="commercial-ready">Prêts à la vente</option>
            <option value="delivery-ready">Prêts à livrer</option>
            <option value="incomplete">Incomplets</option>
            <option value="no-pricing">Sans prix</option>
            <option value="no-city">Sans couverture</option>
            <option value="inactive">Inactifs</option>
          </select>
          <button className={styles.submit} type="submit">Appliquer</button>
        </form>

        <div className={styles.contentGrid}>
          <section className={styles.portfolio}>
            <div className={styles.resultBar}>
              <div>
                <h2>Portefeuille de services</h2>
                <p>Lecture structurée de la readiness commerciale, opérationnelle et géographique.</p>
              </div>
              <span className={styles.resultCount}>{filtered.length} résultat(s)</span>
            </div>

            {filtered.length ? (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Famille / marché</th>
                        <th>Modèle commercial</th>
                        <th>Prix</th>
                        <th>Variations</th>
                        <th>Couverture</th>
                        <th>Readiness</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((service: any) => (
                        <tr key={String(service.id || service.code)}>
                          <td>
                            <div className={styles.serviceCell}>
                              <span className={styles.serviceCode}>{service.code}</span>
                              <Link href={`/services/${service.id}`}>{text(service.service_name, 'Service sans nom')}</Link>
                              <span className={styles.muted}>{text(service.client_type, 'Marché non défini')}</span>
                            </div>
                          </td>
                          <td>
                            <strong>{text(service.service_family, 'Non classé')}</strong>
                            <span className={styles.muted}>{text(service.client_type, 'Client non défini')}</span>
                          </td>
                          <td>
                            <strong>{text(service.pricing_model, 'Non défini')}</strong>
                            <span className={styles.muted}>{service.commercialReady ? 'Commercialisable' : 'À compléter'}</span>
                          </td>
                          <td className={styles.priceCell}>
                            <strong>{service.prices.length ? money(service.minPrice) : 'Non configuré'}</strong>
                            <small>{service.maxPrice > service.minPrice ? `jusqu’à ${money(service.maxPrice)}` : 'Prix visible minimal'}</small>
                          </td>
                          <td className={styles.numberCell}>
                            <strong>{service.activeVariations.length}</strong>
                            <small>{service.serviceVariations.length} au total</small>
                          </td>
                          <td className={styles.numberCell}>
                            <strong>{service.cities.length || '—'}</strong>
                            <small>{service.cities.slice(0, 2).join(' · ') || 'Aucune ville visible'}</small>
                          </td>
                          <td>
                            <div className={styles.readiness}>
                              {[
                                ['Identité', readinessState(service.identityReady)],
                                ['Commercial', readinessState(service.commercialReady, Boolean(service.pricing_model))],
                                ['Opérationnel', readinessState(service.operationalReady, Boolean(service.serviceVariations.length))],
                                ['Géographique', readinessState(service.geographicReady)],
                              ].map(([label, state]) => (
                                <div className={styles.readinessRow} key={String(label)}>
                                  <span>{label}</span>
                                  <i className={styles.readinessDot} data-state={state} aria-label={String(state)} />
                                </div>
                              ))}
                            </div>
                          </td>
                          <td><Status tone={statusTone(service.status)}>{statusLabel(service.status)}</Status></td>
                          <td>
                            <div className={styles.actions}>
                              <Link className={styles.actionLink} href={`/services/${service.id}`}>Dossier</Link>
                              <Link className={styles.actionLink} href={`/services/${service.id}/pricing`}>Prix</Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.mobileCards}>
                  {filtered.map((service: any) => (
                    <article className={styles.mobileCard} key={String(service.id || service.code)}>
                      <div className={styles.mobileCardTop}>
                        <div>
                          <span className={styles.serviceCode}>{service.code}</span>
                          <h3>{text(service.service_name, 'Service sans nom')}</h3>
                        </div>
                        <Status tone={statusTone(service.status)}>{statusLabel(service.status)}</Status>
                      </div>
                      <div className={styles.mobileCardGrid}>
                        <div><span>Prix</span><strong>{service.prices.length ? money(service.minPrice) : 'Non configuré'}</strong></div>
                        <div><span>Variations</span><strong>{service.activeVariations.length}</strong></div>
                        <div><span>Couverture</span><strong>{service.cities.length} ville(s)</strong></div>
                        <div><span>Readiness</span><strong>{service.readiness}/4</strong></div>
                      </div>
                      <div className={styles.actions}>
                        <Link className={styles.actionLink} href={`/services/${service.id}`}>Ouvrir le dossier</Link>
                        <Link className={styles.actionLink} href={`/services/${service.id}/pricing`}>Tarification</Link>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="Aucun service dans cette vue" description="Aucun service ne correspond aux critères actuels. Réinitialisez les filtres ou créez un nouveau service." action={<ActionLink href="/services/new" primary>Créer un service</ActionLink>} />
            )}
          </section>

          <aside className={styles.rail}>
            <section className={`${styles.railCard} ${styles.railCardDark}`}>
              <SectionHeading eyebrow="Priorités" title="Ce qui bloque la mise en marché" description="Les signaux sont calculés à partir des données déjà chargées. Aucune correction n’est appliquée automatiquement." />
              <div className={styles.exceptionList}>
                {attention.length ? attention.map((service: any) => (
                  <Link href={`/services/${service.id}`} className={styles.exceptionItem} key={String(service.id || service.code)}>
                    <strong>{text(service.service_name, service.code)}</strong>
                    <span>{!service.commercialReady ? 'Offre ou prix incomplet. ' : ''}{!service.operationalReady ? 'Modèle de livraison incomplet. ' : ''}{!service.geographicReady ? 'Couverture absente.' : ''}</span>
                  </Link>
                )) : <div className={styles.exceptionItem}><strong>Aucune priorité critique</strong><span>Tous les services visibles couvrent les quatre axes de readiness.</span></div>}
              </div>
            </section>

            <section className={styles.railCard}>
              <h3>Architecture de vérité</h3>
              <p>Le catalogue, les blueprints et ServiceOS restent des couches distinctes. Cette page ne prétend pas les synchroniser automatiquement.</p>
              <div className={styles.exceptionList}>
                <div className={styles.exceptionItem}><strong>Catalogue</strong><span>Source de l’offre commercialisée.</span></div>
                <div className={styles.exceptionItem}><strong>Blueprints</strong><span>Architecture de livraison et de mise à l’échelle.</span></div>
                <div className={styles.exceptionItem}><strong>ServiceOS</strong><span>Configuration, simulation et intelligence opérationnelle.</span></div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  )
}
