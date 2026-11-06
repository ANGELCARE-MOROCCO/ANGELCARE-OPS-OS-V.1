import 'server-only';
import { hasMarketplacePermission, hasMarketplaceWorkspaceAccess } from '../../auth/context';
import type { MarketplaceRequestContext } from '../../domain/types';
import { jobkixAdminCatalogue, filterJobkixAdminEntries } from './registry';
export function accessibleJobkixAdminEntries(context:MarketplaceRequestContext){
 const entries=jobkixAdminCatalogue(context.locale),workspaces=new Set(entries.filter(e=>hasMarketplaceWorkspaceAccess(context,e.workspace)).map(e=>e.workspace));
 return filterJobkixAdminEntries(entries,{admin:hasMarketplacePermission(context,'marketplace.admin.access'),workspaces,mediaView:hasMarketplacePermission(context,'marketplace.media.view')});
}
