import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/session'
import Angelcare360Shell from '@/components/angelcare360/layout/Angelcare360Shell'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from '@/lib/angelcare360/permissions'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'

export const metadata: Metadata = {
  title: ANGELCARE360_PRODUCT_NAME,
  description: 'Cockpit de direction français et indépendant pour AngelCare 360.',
}

export default async function Angelcare360CommandCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rawUser = await requireUser()
  const user = normalizeAngelcare360User(rawUser)

  if (!user) {
    return null
  }

  const context = await getAngelcare360AccessContext()
  const access = context?.access || buildAngelcare360AccessProfile(user)

  return (
    <Angelcare360Shell
      user={user}
      access={access}
      runtimeEntitlements={context?.runtimeEntitlements || {
        state: 'legacy_unconfigured', enforced: false, schoolId: null, tenantId: null, tenantSlug: null, tenantStatus: null,
        subscriptionId: null, subscriptionStatus: null, packageVersionId: null, packageVersionName: null, packageVersionCode: null,
        snapshotId: null, snapshotVersion: null, compiledAt: null, enabledModules: [], restrictedModules: [], enabledFeatures: [],
        restrictedFeatures: [], limits: [], warning: 'Entitlements non configurés.',
      }}
    >
      {context?.supportAccess ? <div style={{position:'sticky',top:0,zIndex:11900,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,padding:'10px 18px',background:'#fff4db',borderBottom:'1px solid #e4bf72',color:'#6f4c0b',fontSize:12,fontWeight:800}}><span>MODE SUPPORT GOUVERNÉ · {String((context.supportAccess as any).client?.display_name || (context.supportAccess as any).tenant?.tenant_slug || 'Tenant')} · {String((context.supportAccess as any).access_mode || 'read_only').replaceAll('_',' ')}</span><span>Expiration {new Date(String((context.supportAccess as any).expires_at)).toLocaleString('fr-FR')}</span></div> : null}
      {children}
    </Angelcare360Shell>
  )
}

