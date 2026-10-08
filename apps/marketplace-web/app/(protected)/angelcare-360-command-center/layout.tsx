import type { Metadata } from 'next'
import { requireUser } from '@/lib/ac360-portability/auth-session'
import Angelcare360Shell from '@/components/angelcare360/layout/Angelcare360Shell'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from '@/lib/angelcare360/permissions'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { isTrustedSanilaMasterDemoContext } from '@/lib/angelcare360/server/command-center-experience'
import DemoExperienceContextBar from '@/components/angelcare360/demo-experience/DemoExperienceContextBar'
import DemoExperienceRouteTracker from '@/components/angelcare360/demo-experience/DemoExperienceRouteTracker'

export const metadata: Metadata = {
  title: ANGELCARE360_PRODUCT_NAME,
  description: 'Espace établissement SANILA Operating System.',
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : null
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const raw = await requireUser()
  const user = normalizeAngelcare360User(raw)
  if (!user) return null
  const context = await getAngelcare360AccessContext()
  const access = context?.access || buildAngelcare360AccessProfile(user)
  const runtime = context?.runtimeEntitlements || {
    state: 'legacy_unconfigured' as const,
    enforced: false,
    schoolId: null,
    tenantId: null,
    tenantSlug: null,
    tenantStatus: null,
    subscriptionId: null,
    subscriptionStatus: null,
    packageVersionId: null,
    packageVersionName: null,
    packageVersionCode: null,
    snapshotId: null,
    snapshotVersion: null,
    compiledAt: null,
    enabledModules: [],
    restrictedModules: [],
    enabledCapabilities: [],
    restrictedCapabilities: [],
    enabledFeatures: [],
    restrictedFeatures: [],
    enabledServices: [],
    restrictedServices: [],
    enabledOperations: [],
    restrictedOperations: [],
    limits: [],
    provisioning: [],
    warning: 'Entitlements non configurés.',
  }
  const isMasterDemo = isTrustedSanilaMasterDemoContext(context)
  const supportAccess = asRecord(context?.supportAccess)
  const supportClient = asRecord(supportAccess?.client)
  const supportTenant = asRecord(supportAccess?.tenant)
  const supportName = String(
    supportClient?.display_name ||
    supportTenant?.tenant_slug ||
    'Tenant',
  )
  const supportExpiresAt = supportAccess?.expires_at
    ? new Date(String(supportAccess.expires_at)).toLocaleString('fr-FR')
    : '—'

  return (
    <Angelcare360Shell
      user={user}
      access={access}
      runtimeEntitlements={runtime}
      schoolName={context?.school?.name || null}
      academicYearLabel={context?.academicYear?.label || null}
    >
      <DemoExperienceRouteTracker enabled={isMasterDemo}/>
      {isMasterDemo ? <DemoExperienceContextBar/> : null}
      {supportAccess ? (
        <div style={{ position: 'sticky', top: 76, zIndex: 119000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '9px 18px', background: '#fff4db', borderBottom: '1px solid #e4bf72', color: '#6f4c0b', fontSize: 10, fontWeight: 850 }}>
          <span>MODE SUPPORT GOUVERNÉ · {supportName}</span>
          <span>Expiration {supportExpiresAt}</span>
        </div>
      ) : null}
      {children}
    </Angelcare360Shell>
  )
}
