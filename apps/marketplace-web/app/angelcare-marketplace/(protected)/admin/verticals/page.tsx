import Link from 'next/link'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { B2BExecutiveCommand } from '@/angelcare-marketplace/b2b-verticals/components/B2BExecutiveCommand'
import { b2bSummary,listOrganizations } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.view');const [summary,organizations]=await Promise.all([b2bSummary(context),listOrganizations({context})]);return <><Link href="/angelcare-marketplace/admin/verticals/requests">Réception des projets B2B →</Link><B2BExecutiveCommand summary={summary} organizations={organizations}/></>}
