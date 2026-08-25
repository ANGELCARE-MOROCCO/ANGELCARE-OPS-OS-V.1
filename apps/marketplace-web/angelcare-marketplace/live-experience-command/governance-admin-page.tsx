import {requireMarketplaceWorkspacePageContext} from '../auth/context'
import {LiveGovernanceCommand} from './components/LiveGovernanceCommand'
import {listLiveGovernance,type LiveGovernanceMode} from './repository'
export async function LiveGovernancePage({mode}:{mode:LiveGovernanceMode}){const context=await requireMarketplaceWorkspacePageContext(`live_experience.${mode}`,'marketplace.live_experience.view');const data=await listLiveGovernance(mode,context);return <LiveGovernanceCommand mode={mode} rows={data.rows}/>}
