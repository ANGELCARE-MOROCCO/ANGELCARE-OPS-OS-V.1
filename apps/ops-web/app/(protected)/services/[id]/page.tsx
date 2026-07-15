import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'
import { activateVariation, deleteVariation, disableVariation } from './actions'

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cleanId = decodeURIComponent(id)
  const serviceCode = cleanId.startsWith('#') ? cleanId : `#${cleanId}`

  const supabase = await createClient()

  const { data: variationsData } = await supabase
    .from('service_variations')
    .select('*')
    .eq('service_code', serviceCode)
    .order('created_at', { ascending: false })

  const variations = variationsData || []

  const activeVariations = variations.filter((v: any) => String(v.status || '').toLowerCase() === 'active').length
  const inactiveVariations = variations.filter((v: any) => String(v.status || '').toLowerCase() === 'inactive').length
  const prices = variations.map((v: any) => Number(v.base_price || 0)).filter((n: number) => n > 0)
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const readiness = variations.length ? Math.min(100, Math.round((activeVariations / variations.length) * 100)) : 0

  return (
    <AppShell
      title={`Catalogue ${serviceCode}`}
      subtitle="Cockpit opérationnel des variations, pricing, couverture, staff et readiness commerciale."
      breadcrumbs={[
        { label: 'Products & Services', href: '/services' },
        { label: serviceCode },
      ]}
      actions={
        <>
          <PageAction href="/services" variant="light">Retour catalogue</PageAction>
          <PageAction href={`/services/${cleanId}/variations/new`}>+ Nouvelle variation</PageAction>
        </>
      }
    >
      <section style={heroStyle}>
        <div>
          <div style={heroBadgeStyle}>AngelCare Service Cockpit • {serviceCode}</div>
          <h2 style={heroTitleStyle}>Piloter, configurer et contrôler toutes les variations liées à {serviceCode}.</h2>
          <p style={heroTextStyle}>
            Ce cockpit centralise les offres, prix, profils clients, villes, staff requis et actions de gestion pour transformer un code service en moteur opérationnel.
          </p>
        </div>

        <div style={heroScoreStyle}>
          <span style={scoreLabelStyle}>Readiness</span>
          <strong style={scoreValueStyle}>{readiness}%</strong>
          <span style={scoreTextStyle}>variations actives</span>
        </div>
      </section>

      <section style={metricGridStyle}>
        <MetricCard label="Code service" value={serviceCode} sub="catégorie opérationnelle" icon="🏷️" />
        <MetricCard label="Variations" value={variations.length} sub="offres / packages / prix" icon="🧩" accent="#1d4ed8" />
        <MetricCard label="Actives" value={activeVariations} sub={`${inactiveVariations} inactive(s)`} icon="✅" accent="#166534" />
        <MetricCard label="Prix range" value={prices.length ? `${minPrice} → ${maxPrice}` : 'À définir'} sub="MAD base price" icon="💰" accent="#7c3aed" />
      </section>

      <ERPPanel
        title={`Variations premium — ${serviceCode}`}
        subtitle="Chaque variation peut être modifiée, dupliquée, désactivée, réactivée ou supprimée."
        right={
          <div style={panelActionsStyle}>
            <Link href={`/services/${cleanId}/pricing`} style={secondaryButtonStyle}>Pricing global</Link>
            <Link href={`/services/${cleanId}/variations/new`} style={primaryButtonStyle}>+ Ajouter variation</Link>
          </div>
        }
      >
        {variations.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>🧩</div>
            <h3 style={emptyTitleStyle}>Aucune variation configurée pour {serviceCode}</h3>
            <p style={emptyTextStyle}>
              Ce service ne peut pas encore être exploité commercialement. Créez une première variation avec prix, durée, ville, profil client et staff requis.
            </p>
            <Link href={`/services/${cleanId}/variations/new`} style={primaryButtonStyle}>
              + Créer la première variation
            </Link>
          </div>
        ) : (
          <div style={gridStyle}>
            {variations.map((variation: any) => {
              const isInactive = String(variation.status || '').toLowerCase() === 'inactive'

              return (
                <article key={variation.id} style={isInactive ? inactiveCardStyle : cardStyle}>
                  <div style={cardTopStyle}>
                    <div>
                      <div style={codeStyle}>{variation.service_code || serviceCode}</div>
                      <div style={miniTextStyle}>Variation ID • {String(variation.id).slice(0, 8)}</div>
                    </div>
                    <StatusPill tone={isInactive ? 'red' : variation.status === 'pilot' ? 'amber' : 'green'}>
                      {variation.status || 'active'}
                    </StatusPill>
                  </div>

                  <h3 style={nameStyle}>{variation.name || 'Variation sans nom'}</h3>

                  <p style={metaStyle}>
                    {variation.client_type || 'Client flexible'} • {variation.pricing_model || 'pricing libre'} • {variation.available_cities || 'villes libres'}
                  </p>

                  <div style={decisionGridStyle}>
                    <Mini label="Base" value={`${variation.base_price || 0} MAD`} />
                    <Mini label="B2C" value={`${variation.price_b2c || 0} MAD`} />
                    <Mini label="B2B" value={`${variation.price_b2b || 0} MAD`} />
                    <Mini label="3h" value={`${variation.price_3h || 0} MAD`} />
                    <Mini label="8h" value={`${variation.price_8h || 0} MAD`} />
                    <Mini label="24h" value={`${variation.price_24h || 0} MAD`} />
                  </div>

                  <div style={opsBoardStyle}>
                    <Ops title="Staff requis" value={variation.required_staff || 'Standard'} />
                    <Ops title="Matériel" value={variation.equipment || 'Non défini'} />
                    <Ops title="Villes" value={variation.available_cities || 'Flexible'} />
                  </div>

                  <div style={pillRowStyle}>
                    <StatusPill tone="blue">pricing</StatusPill>
                    <StatusPill tone="purple">ops rules</StatusPill>
                    <StatusPill tone={isInactive ? 'red' : 'green'}>{isInactive ? 'hors catalogue' : 'commercial-ready'}</StatusPill>
                  </div>

                  <div style={actionsStyle}>
                    <Link href={`/services/${cleanId}/variations/${variation.id}/edit`} style={secondaryButtonStyle}>
                      Modifier
                    </Link>

                    <Link href={`/services/${cleanId}/variations/${variation.id}/duplicate`} style={secondaryButtonStyle}>
                      Dupliquer
                    </Link>

                    {isInactive ? (
                      <form action={activateVariation}>
                        <input type="hidden" name="service_id" value={cleanId} />
                        <input type="hidden" name="variation_id" value={variation.id} />
                        <button style={successButtonStyle}>Réactiver</button>
                      </form>
                    ) : (
                      <form action={disableVariation}>
                        <input type="hidden" name="service_id" value={cleanId} />
                        <input type="hidden" name="variation_id" value={variation.id} />
                        <button style={warningButtonStyle}>Désactiver</button>
                      </form>
                    )}

                    <form action={deleteVariation}>
                      <input type="hidden" name="service_id" value={cleanId} />
                      <input type="hidden" name="variation_id" value={variation.id} />
                      <button style={dangerButtonStyle}>Supprimer</button>
                    </form>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </ERPPanel>

      <section style={bottomGridStyle}>
        <ERPPanel title="Lecture opérationnelle" subtitle="Comment utiliser ce cockpit dans l’exploitation AngelCare.">
          <div style={logicGridStyle}>
            <Logic title="Commercial" text="Le commercial choisit la bonne variation selon ville, durée, client et niveau de service." />
            <Logic title="Contrat" text="La variation servira ensuite à générer le contrat avec prix et conditions exactes." />
            <Logic title="Mission" text="Ops récupère staff, matériel, ville et exigences pour préparer l’exécution terrain." />
          </div>
        </ERPPanel>

        <ERPPanel title="Prochaine étape" subtitle="Brancher contrats et missions.">
          <div style={nextStepStyle}>
            <strong>À faire ensuite :</strong>
            <p>Ajouter un sélecteur de variation dans les contrats pour passer de catalogue → contrat → mission.</p>
          </div>
        </ERPPanel>
      </section>
    </AppShell>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={miniStyle}>
      <span style={miniLabelStyle}>{label}</span>
      <strong style={miniValueStyle}>{value}</strong>
    </div>
  )
}

function Ops({ title, value }: { title: string; value: string }) {
  return (
    <div style={opsStyle}>
      <span style={opsTitleStyle}>{title}</span>
      <strong style={opsValueStyle}>{value}</strong>
    </div>
  )
}

function Logic({ title, text }: { title: string; text: string }) {
  return (
    <div style={logicStyle}>
      <strong>{title}</strong>
      <p>{text}</p>
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
  maxWidth: 900,
}

const heroTextStyle: React.CSSProperties = {
  color: '#dbeafe',
  fontWeight: 650,
  lineHeight: 1.7,
  maxWidth: 880,
}

const heroScoreStyle: React.CSSProperties = {
  minWidth: 230,
  padding: 20,
  borderRadius: 24,
  background: 'rgba(255,255,255,.1)',
  border: '1px solid rgba(255,255,255,.16)',
}

const scoreLabelStyle: React.CSSProperties = { color: '#cbd5e1', fontWeight: 800 }
const scoreValueStyle: React.CSSProperties = { display: 'block', fontSize: 46, fontWeight: 950, marginTop: 8 }
const scoreTextStyle: React.CSSProperties = { color: '#cbd5e1', fontWeight: 650 }

const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const panelActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }

const cardStyle: React.CSSProperties = {
  padding: 18,
  border: '1px solid #dbe3ee',
  borderRadius: 24,
  background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',
  boxShadow: '0 16px 34px rgba(15,23,42,.06)',
}

const inactiveCardStyle: React.CSSProperties = { ...cardStyle, opacity: 0.65 }
const cardTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }
const codeStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: '#0f172a', color: '#fff', fontWeight: 950 }
const miniTextStyle: React.CSSProperties = { marginTop: 8, color: '#94a3b8', fontSize: 12, fontWeight: 850 }
const nameStyle: React.CSSProperties = { margin: '0 0 8px', color: '#0f172a', fontSize: 19, fontWeight: 950 }
const metaStyle: React.CSSProperties = { color: '#64748b', fontWeight: 700, lineHeight: 1.55, marginBottom: 14 }
const decisionGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 14 }
const miniStyle: React.CSSProperties = { padding: 10, borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0' }
const miniLabelStyle: React.CSSProperties = { display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 950, marginBottom: 4 }
const miniValueStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 950, fontSize: 13 }
const opsBoardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 14 }
const opsStyle: React.CSSProperties = { padding: 10, borderRadius: 14, background: '#eef2ff', border: '1px solid #c7d2fe' }
const opsTitleStyle: React.CSSProperties = { display: 'block', color: '#3730a3', fontSize: 11, fontWeight: 950, marginBottom: 5 }
const opsValueStyle: React.CSSProperties = { display: 'block', color: '#1e1b4b', fontSize: 12, fontWeight: 900, lineHeight: 1.35 }
const pillRowStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }
const actionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }

const primaryButtonStyle: React.CSSProperties = { display: 'inline-flex', textDecoration: 'none', padding: '12px 16px', borderRadius: 14, background: '#0f172a', color: '#fff', fontWeight: 950 }
const secondaryButtonStyle: React.CSSProperties = { display: 'inline-flex', textDecoration: 'none', padding: '10px 12px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 900, cursor: 'pointer' }
const warningButtonStyle: React.CSSProperties = { ...secondaryButtonStyle, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a' }
const successButtonStyle: React.CSSProperties = { ...secondaryButtonStyle, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0' }
const dangerButtonStyle: React.CSSProperties = { ...secondaryButtonStyle, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }

const emptyStateStyle: React.CSSProperties = { padding: 36, borderRadius: 24, border: '1px dashed #cbd5e1', background: '#f8fafc', textAlign: 'center' }
const emptyIconStyle: React.CSSProperties = { width: 72, height: 72, display: 'grid', placeItems: 'center', margin: '0 auto 16px', borderRadius: 24, background: '#eef2ff', border: '1px solid #c7d2fe', fontSize: 32 }
const emptyTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontWeight: 950, fontSize: 22 }
const emptyTextStyle: React.CSSProperties = { maxWidth: 720, margin: '12px auto 20px', color: '#64748b', fontWeight: 700, lineHeight: 1.6 }

const bottomGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 14, marginTop: 18 }
const logicGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const logicStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const nextStepStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, lineHeight: 1.6 }