import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { AdminFamilyCommand } from '@/angelcare-marketplace/family-experience/components/AdminFamilyCommand'
import { adminListFamilies, adminListRequests } from '@/angelcare-marketplace/family-experience/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.family.admin.view');const [families,requests]=await Promise.all([adminListFamilies(),adminListRequests()]);return <AdminFamilyCommand families={families} requests={requests}/>}
