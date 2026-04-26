import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'

const defaultServices = [
  ['#H.S', "Garde et accompagnement d'enfants à domicile", 'Home care', '3h / 5h / 8h / 12h / 24h', 'active'],
  ['#S.K', "Garde enfant spécial à domicile", 'Special needs', 'Skill required', 'active'],
  ['#S.H', "Garde enfant spécial hybride", 'Special needs', 'Hybrid workflow', 'active'],
  ['#A.B', 'Animation anniversaire', 'Events', 'Package pricing', 'active'],
  ['#P.P', 'Bébé post accouchement', 'Postpartum', 'Premium family care', 'active'],
  ['#E.X', 'Excursion', 'Mobility', 'Transport checklist', 'active'],
  ['#S.S', "Enfant spécial à l’école", 'School support', 'Institution logic', 'active'],
  ['#S.L', 'Animation ludique avancée', 'Education', 'Program lines', 'active'],
  ['#K.P', 'Animation fêtes', 'Events', 'Group capacity', 'active'],
  ['#A.A', 'AngelCare Academy', 'Training', 'Certification', 'active'],
]

export default async function ServicesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('service_catalog')
    .select('*')
    .order('service_code', { ascending: true })

  const { data: variationsData } = await supabase
    .from('service_variations')
    .select('*')

  const services =
    data && data.length
      ? data
      : defaultServices.map((s) => ({
          id: s[0],
          service_code: s[0],
          service_name: s[1],
          service_family: s[2],
          pricing_model: s[3],
          status: s[4],
        }))

  const variations = variationsData || []

  const variationsByCode = variations.reduce((acc: any, variation: any) => {
    const code = variation.service_code || 'unknown'
    acc[code] = acc[code] || []
    acc[code].push(variation)
    return acc
  }, {})

  const activeServices = services.filter((s: any) => String(s.status || '').toLowerCase() !== 'inactive').length
  const configuredCodes = Object.keys(variationsByCode).length
  const totalVariations = variations.length
  const servicesWithoutVariations = services.filter((s: any) => !variationsByCode[s.service_code]?.length).length

  const groups = [
    { key: 'Home care', title: 'Home Care & Familles', icon: '🏠' },
    { key: 'Special needs', title: 'Besoins spécifiques', icon: '🎯' },
    { key: 'Postpartum', title: 'Post-partum & Bébé', icon: '👶' },
    { key: 'Events', title: 'Events & Animations', icon: '🎉' },
    { key: 'Education', title: 'Éducation & Ludique', icon: '🧠' },
    { key: 'Training', title: 'Academy & Formation', icon: '🎓' },
    { key: 'Mobility', title: 'Mobilité & Terrain', icon: '🚌' },
    { key: 'School support', title: 'École & Institutions', icon: '🏫' },
  ]

  return (
    <AppShell
      title="Products & Services Management"
      subtitle="Centre de pilotage premium du catalogue AngelCare : services, variations, pricing, couverture, staff et exécution terrain."
      breadcrumbs={[{ label: 'Products & Services' }]}
      actions={
        <>
          <PageAction href="/services/new">+ Nouveau service</PageAction>
          <PageAction href="/print" variant="light">Imprimer catalogue</PageAction>
        </>
      }
    >
      <section style={heroStyle}>
        <div>
          <div style={heroBadgeStyle}>AngelCare Service Engine • Catalogue Opérationnel</div>
          <h2 style={heroTitleStyle}>Pilotez vos services comme un vrai système ERP : pricing, variations, staff, villes et qualité d’exécution.</h2>
          <p style={heroTextStyle}>
            Chaque code service devient une catégorie structurée avec ses offres, variations tarifaires, règles terrain et logique commerciale.
          </p>
        </div>

        <div style={heroBoardStyle}>
          <div style={heroBoardLabelStyle}>Service Readiness</div>
          <div style={heroBoardValueStyle}>{Math.max(20, Math.round((configuredCodes / Math.max(services.length, 1)) * 100))}%</div>
          <div style={heroBoardTextStyle}>codes avec variations configurées</div>
        </div>
      </section>

      <section style={metricGridStyle}>
        <MetricCard label="Services catalogue" value={services.length} sub="codes opérationnels" icon="🧩" />
        <MetricCard label="Services actifs" value={activeServices} sub="disponibles à la vente" icon="✅" accent="#166534" />
        <MetricCard label="Variations" value={totalVariations} sub="pricing / offres / packages" icon="💎" accent="#1d4ed8" />
        <MetricCard label="À configurer" value={servicesWithoutVariations} sub="sans variation backend" icon="⚠️" accent="#b45309" />
      </section>

      <ERPPanel
        title="Service Control Bar"
        subtitle="Vue opérationnelle pour contrôler les services par famille, statut, niveau de configuration et priorité business."
        right={
          <div style={panelActionsStyle}>
            <Link href="/services/new" style={primaryButtonStyle}>+ Ajouter service</Link>
            <Link href="/services/H.S" style={secondaryButtonStyle}>Ouvrir #H.S</Link>
            <Link href="/services/A.A" style={secondaryButtonStyle}>Ouvrir Academy</Link>
          </div>
        }
      >
        <div style={insightGridStyle}>
          <Insight title="Priorité Ops" value={servicesWithoutVariations > 0 ? 'Configurer variations' : 'Catalogue prêt'} tone={servicesWithoutVariations > 0 ? 'amber' : 'green'} />
          <Insight title="Pricing Engine" value={totalVariations > 0 ? 'Actif' : 'À initialiser'} tone={totalVariations > 0 ? 'blue' : 'amber'} />
          <Insight title="Couverture" value="Multi-ville" tone="purple" />
          <Insight title="Usage contrat" value="Prochaine étape" tone="slate" />
        </div>
      </ERPPanel>

      <section style={groupGridStyle}>
        {groups.map((group) => {
          const groupServices = services.filter((s: any) => String(s.service_family || '').toLowerCase().includes(group.key.toLowerCase()))
          if (!groupServices.length) return null

          return (
            <ERPPanel
              key={group.key}
              title={`${group.icon} ${group.title}`}
              subtitle={`${groupServices.length} service(s) dans cette famille opérationnelle.`}
            >
              <div style={cardGridStyle}>
                {groupServices.map((service: any) => {
                  const code = service.service_code || '#N/A'
                  const cleanCode = String(code).replace('#', '')
                  const serviceVariations = variationsByCode[code] || []
                  const isConfigured = serviceVariations.length > 0
                  const prices = serviceVariations.map((v: any) => Number(v.base_price || 0)).filter((n: number) => n > 0)
                  const minPrice = prices.length ? Math.min(...prices) : Number(service.base_price || 0)
                  const maxPrice = prices.length ? Math.max(...prices) : Number(service.base_price || 0)

                  return (
                    <Link key={service.id || code} href={`/services/${cleanCode}`} style={cardLinkStyle}>
                      <article style={cardStyle}>
                        <div style={cardTopStyle}>
                          <div style={codeStyle}>{code}</div>
                          <StatusPill tone={String(service.status || '').toLowerCase() === 'inactive' ? 'red' : 'green'}>
                            {service.status || 'active'}
                          </StatusPill>
                        </div>

                        <h3 style={nameStyle}>{service.service_name || 'Service sans nom'}</h3>

                        <p style={metaStyle}>
                          {service.service_family || 'Famille'} • {service.pricing_model || 'pricing libre'}
                        </p>

                        <div style={decisionGridStyle}>
                          <Mini label="Variations" value={String(serviceVariations.length)} tone={isConfigured ? 'green' : 'amber'} />
                          <Mini label="Prix" value={minPrice || maxPrice ? `${minPrice} → ${maxPrice} MAD` : 'À définir'} tone="blue" />
                          <Mini label="Ops" value={isConfigured ? 'Ready' : 'Setup'} tone={isConfigured ? 'green' : 'amber'} />
                        </div>

                        <div style={opsStripStyle}>
                          <span>🏙️ Villes</span>
                          <span>👥 Staff</span>
                          <span>🧾 Pricing</span>
                          <span>✅ Checklist</span>
                        </div>

                        <div style={actionRowStyle}>
                          <span style={openButtonStyle}>Ouvrir cockpit</span>
                          <span style={subtleTextStyle}>{isConfigured ? 'configuré' : 'variation requise'}</span>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            </ERPPanel>
          )
        })}
      </section>

      <ERPPanel
        title="Services non classés / autres"
        subtitle="Services sans groupe clair ou nécessitant une meilleure structuration catalogue."
      >
        <div style={cardGridStyle}>
          {services
            .filter((s: any) => !groups.some((g) => String(s.service_family || '').toLowerCase().includes(g.key.toLowerCase())))
            .map((service: any) => {
              const code = service.service_code || '#N/A'
              const cleanCode = String(code).replace('#', '')
              const serviceVariations = variationsByCode[code] || []

              return (
                <Link key={service.id || code} href={`/services/${cleanCode}`} style={cardLinkStyle}>
                  <article style={cardStyle}>
                    <div style={cardTopStyle}>
                      <div style={codeStyle}>{code}</div>
                      <StatusPill tone="slate">{service.status || 'active'}</StatusPill>
                    </div>

                    <h3 style={nameStyle}>{service.service_name || 'Service sans nom'}</h3>
                    <p style={metaStyle}>{service.service_family || 'Famille à structurer'} • {service.pricing_model || 'pricing libre'}</p>

                    <div style={decisionGridStyle}>
                      <Mini label="Variations" value={String(serviceVariations.length)} tone={serviceVariations.length ? 'green' : 'amber'} />
                      <Mini label="Client" value={service.client_type || 'Flexible'} tone="blue" />
                      <Mini label="Statut" value={service.status || 'active'} tone="green" />
                    </div>
                  </article>
                </Link>
              )
            })}
        </div>
      </ERPPanel>
    </AppShell>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone: 'green' | 'blue' | 'amber' | 'purple' | 'slate' }) {
  const colors: any = {
    green: ['#dcfce7', '#166534', '#bbf7d0'],
    blue: ['#e0f2fe', '#075985', '#bae6fd'],
    amber: ['#fef3c7', '#92400e', '#fde68a'],
    purple: ['#ede9fe', '#6d28d9', '#ddd6fe'],
    slate: ['#f1f5f9', '#475569', '#cbd5e1'],
  }

  const c = colors[tone]

  return (
    <div style={{ ...miniStyle, background: c[0], border: `1px solid ${c[2]}` }}>
      <span style={{ ...miniLabelStyle, color: c[1] }}>{label}</span>
      <strong style={{ ...miniValueStyle, color: c[1] }}>{value}</strong>
    </div>
  )
}

function Insight({ title, value, tone }: { title: string; value: string; tone: 'green' | 'blue' | 'amber' | 'purple' | 'slate' }) {
  return (
    <div style={insightStyle}>
      <StatusPill tone={tone}>{title}</StatusPill>
      <strong style={insightValueStyle}>{value}</strong>
    </div>
  )
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 22,
  flexWrap: 'wrap',
  padding: 28,
  borderRadius: 30,
  background: 'radial-gradient(circle at top left,#1d4ed8 0,#0f172a 45%,#020617 100%)',
  color: '#fff',
  marginBottom: 18,
  boxShadow: '0 28px 80px rgba(15,23,42,.22)',
}

const heroBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,.12)',
  color: '#dbeafe',
  fontSize: 12,
  fontWeight: 950,
  marginBottom: 12,
}

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 34,
  fontWeight: 950,
  letterSpacing: -1,
  maxWidth: 920,
}

const heroTextStyle: React.CSSProperties = {
  color: '#dbeafe',
  fontWeight: 650,
  lineHeight: 1.7,
  maxWidth: 900,
  margin: '12px 0 0',
}

const heroBoardStyle: React.CSSProperties = {
  minWidth: 250,
  padding: 20,
  borderRadius: 24,
  background: 'rgba(255,255,255,.1)',
  border: '1px solid rgba(255,255,255,.16)',
}

const heroBoardLabelStyle: React.CSSProperties = { color: '#cbd5e1', fontWeight: 800 }
const heroBoardValueStyle: React.CSSProperties = { fontSize: 46, fontWeight: 950, marginTop: 8 }
const heroBoardTextStyle: React.CSSProperties = { color: '#cbd5e1', fontWeight: 650 }

const metricGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
  gap: 14,
  marginBottom: 18,
}

const panelActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  textDecoration: 'none',
  padding: '12px 16px',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  fontWeight: 950,
}

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  textDecoration: 'none',
  padding: '12px 16px',
  borderRadius: 14,
  background: '#fff',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  fontWeight: 950,
}

const insightGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
  gap: 12,
}

const insightStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
  display: 'grid',
  gap: 12,
}

const insightValueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 18, fontWeight: 950 }

const groupGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
  marginTop: 18,
  marginBottom: 18,
}

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 14,
}

const cardLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const cardStyle: React.CSSProperties = {
  padding: 18,
  border: '1px solid #dbe3ee',
  borderRadius: 24,
  background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
  boxShadow: '0 16px 34px rgba(15,23,42,.06)',
  minHeight: 250,
}

const cardTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
}

const codeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#0f172a',
  color: '#fff',
  fontWeight: 950,
}

const nameStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#0f172a',
  fontSize: 19,
  fontWeight: 950,
  lineHeight: 1.25,
}

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: 700,
  lineHeight: 1.55,
  margin: '0 0 14px',
}

const decisionGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 8,
  marginBottom: 14,
}

const miniStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 14,
}

const miniLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 950,
  marginBottom: 4,
  textTransform: 'uppercase',
}

const miniValueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 950,
  lineHeight: 1.3,
}

const opsStripStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
  gap: 8,
  color: '#475569',
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 14,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
}

const openButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '10px 12px',
  borderRadius: 12,
  background: '#0f172a',
  color: '#fff',
  fontWeight: 950,
}

const subtleTextStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontWeight: 850,
  fontSize: 12,
}