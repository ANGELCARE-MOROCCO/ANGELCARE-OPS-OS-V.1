import TrainingHubPartnerProductionProvisioner from '@/components/traininghub/internal/TrainingHubPartnerProductionProvisioner'
import { requireTrainingHubPageContext } from '../traininghub-page-context'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TrainingHubPartnerProvisioningPage({
  searchParams,
}: {
  searchParams?: { organizationId?: string; orgId?: string }
}) {
  await requireTrainingHubPageContext()

  const organizationId = searchParams?.organizationId || searchParams?.orgId || ''

  return (
    <main style={{ minHeight: '100vh', background: '#f6f9ff', padding: 32, color: '#0f172a' }}>
      <section style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 18 }}>
        <a href="/traininghub" style={{ color: '#2563eb', fontWeight: 900, textDecoration: 'none' }}>← TrainingHub Command Center</a>
        <div style={{ borderRadius: 34, padding: 28, background: '#fff', border: '1px solid #dbeafe', boxShadow: '0 22px 60px rgba(15,23,42,.08)' }}>
          <p style={{ margin: 0, color: '#2563eb', fontSize: 11, letterSpacing: '.16em', fontWeight: 950 }}>TRAININGHUB PRODUCTION</p>
          <h1 style={{ margin: '8px 0', fontSize: 42, letterSpacing: '-.06em' }}>Provisioning partenaire</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 800, lineHeight: 1.6 }}>
            Utilisez cette page pour activer ou réparer la couche commerciale minimale d’un partenaire : compte billing,
            offre, abonnement annuel, wallet crédits, session initiale et preuves visibles côté portail.
          </p>
        </div>

        {organizationId ? (
          <TrainingHubPartnerProductionProvisioner organizationId={organizationId} />
        ) : (
          <div style={{ borderRadius: 28, padding: 24, background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontWeight: 900 }}>
            Ajoutez ?organizationId=ID_DU_PARTENAIRE dans l’URL.
          </div>
        )}
      </section>
    </main>
  )
}
