import { requireMarketplaceAdminPageContext } from '@/angelcare-marketplace/auth/context';
import { accessibleJobkixAdminEntries } from '@/angelcare-marketplace/jobkix/admin-navigation/access';
import { JobkixAdminHub } from '@/angelcare-marketplace/jobkix/admin-navigation/Hub';
export const dynamic='force-dynamic';
export const metadata={title:'JOBKIX · Tous les espaces Admin',robots:{index:false,follow:false}};
export default async function JobkixAdminWorkspaces(){const context=await requireMarketplaceAdminPageContext('marketplace.admin.access');return <JobkixAdminHub entries={accessibleJobkixAdminEntries(context)}/>;}
