import { authorizeExtensionCommand } from '../authorization'
import { B2B_INTELLIGENCE_COMMAND_MAP } from './contract'
import { B2B_EXECUTION_COMMAND_MAP } from '../b2b-execution/contract'
import { B2B_DEAL_COMMAND_MAP } from '../b2b-deal-closing/contract'
import { B2B_PARTNER_COMMAND_MAP } from '../b2b-partner-lifecycle/contract'
import { B2B_MANAGEMENT_COMMAND_MAP } from '../b2b-management-command/contract'
import { B2B_ULTRA_COMMAND_MAP } from '../b2b-ultra/contract'

const ALL_B2B_COMMANDS = new Map([
  ...B2B_INTELLIGENCE_COMMAND_MAP.entries(),
  ...B2B_EXECUTION_COMMAND_MAP.entries(),
  ...B2B_DEAL_COMMAND_MAP.entries(),
  ...B2B_PARTNER_COMMAND_MAP.entries(),
  ...B2B_MANAGEMENT_COMMAND_MAP.entries(),
  ...B2B_ULTRA_COMMAND_MAP.entries(),
])

export async function authorizeB2BIntelligenceCommand(db:any,userId:string,input:{commandKey:string;sourceAdapter?:string|null}){
 const definition=ALL_B2B_COMMANDS.get(input.commandKey); if(!definition)return {ok:false as const,status:400,error:'UNREGISTERED_B2B_COMMAND'}
 const base=await authorizeExtensionCommand(db,userId,{moduleKey:'revenue_b2b',commandKey:input.commandKey,sourceAdapter:input.sourceAdapter||null}); if(!base.ok)return base
 if(definition.requiredSubmodule&&!base.access.submodules.some((row:any)=>row.module_key==='revenue_b2b'&&row.submodule_key===definition.requiredSubmodule))return {ok:false as const,status:403,error:'SUBMODULE_NOT_ASSIGNED'}
 if(definition.adapterKeys?.length&&input.sourceAdapter&&!definition.adapterKeys.includes(input.sourceAdapter))return {ok:false as const,status:400,error:'ADAPTER_NOT_SUPPORTED_FOR_COMMAND'}
 return {...base,definition}
}
