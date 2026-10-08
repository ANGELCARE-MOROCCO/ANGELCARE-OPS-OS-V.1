
import BrandGovernanceStudio from '@/components/angelcare360/operator/branding/BrandGovernanceStudio'
import { normalizeBrandGovernanceMode } from '@/components/angelcare360/operator/branding/BrandGovernanceContract'
import { loadBrandGovernanceSnapshot } from '@/lib/angelcare360/operator/branding'

export const dynamic = 'force-dynamic'

export default async function BrandGovernancePage({ searchParams }: { searchParams: Promise<{ view?: string | string[]; clientId?: string | string[] }> }) {
  const params = await searchParams
  const raw = Array.isArray(params.view) ? params.view[0] : params.view
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId
  return <BrandGovernanceStudio initialSnapshot={await loadBrandGovernanceSnapshot({ clientId })} initialMode={normalizeBrandGovernanceMode(raw)} initialClientId={clientId || ''} />
}
