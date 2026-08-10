import Link from 'next/link'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { TenantRegistry } from '@/angelcare-marketplace/partner-os/components/TenantRegistry'
import { TenantCreateDesk } from '@/angelcare-marketplace/partner-os/components/PartnerLifecycleClient'
import { listTenants } from '@/angelcare-marketplace/partner-os/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.partner_os.admin.view');const tenants=await listTenants();return <><TenantCreateDesk/><TenantRegistry tenants={tenants}/><div style={{display:'grid',gap:8,marginTop:14}}>{tenants.map(t=><Link key={t.id} href={`/angelcare-marketplace/admin/partner-os/tenants/${t.id}`}>Ouvrir dossier {t.display_name} →</Link>)}</div></>}
