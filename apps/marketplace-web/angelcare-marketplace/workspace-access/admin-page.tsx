import {requireMarketplaceAdminPageContext} from '../auth/context'
import {MARKETPLACE_ACCESS_WORKSPACES} from './catalog'
import {listWorkspaceAccess} from './repository'
import {WorkspaceAccessCommand,type GovernableWorkspace} from './components/WorkspaceAccessCommand'
export async function WorkspaceAccessPage(){await requireMarketplaceAdminPageContext('marketplace.admin.access');const workspaces:GovernableWorkspace[]=MARKETPLACE_ACCESS_WORKSPACES.map(w=>({key:w.key,domain:w.key.replace('workspace.',''),mission:w.mission,route:w.route,label:w.label}));return <WorkspaceAccessCommand snapshot={await listWorkspaceAccess()} workspaces={workspaces}/>} 
