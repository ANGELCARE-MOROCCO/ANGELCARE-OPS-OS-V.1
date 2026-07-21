import { B2B_EXTENSION_CONTRACT } from './catalog'
import { resolveAutonomy, matchPattern } from './access'
import { loadUserAccess, extensionDb } from './runtime'
import { B2B_INTELLIGENCE_COMMANDS } from './b2b-intelligence/contract'
import { B2B_EXECUTION_COMMANDS } from './b2b-execution/contract'
import { B2B_DEAL_COMMANDS } from './b2b-deal-closing/contract'
import { B2B_PARTNER_COMMANDS } from './b2b-partner-lifecycle/contract'
import { B2B_MANAGEMENT_COMMANDS } from './b2b-management-command/contract'
import { B2B_ULTRA_COMMANDS } from './b2b-ultra/contract'
import type { ExtensionAccessMode } from './types'
const commandToCapability = new Map<string, { permission: string; module: string; contractId: string }>()
for (const capability of B2B_EXTENSION_CONTRACT.capabilities) for (const command of capability.commands) commandToCapability.set(command,{permission:capability.permission,module:capability.module,contractId:capability.id})
for (const command of B2B_INTELLIGENCE_COMMANDS) if(!commandToCapability.has(command.commandKey)) commandToCapability.set(command.commandKey,{permission:command.capabilityPermission,module:'revenue_b2b',contractId:`MEGA2:${command.acceptanceId}`})
for (const command of B2B_EXECUTION_COMMANDS) commandToCapability.set(command.commandKey,{permission:command.capabilityPermission,module:'revenue_b2b',contractId:`MEGA3:${command.acceptanceId}`})
for (const command of B2B_DEAL_COMMANDS) commandToCapability.set(command.commandKey,{permission:command.capabilityPermission,module:'revenue_b2b',contractId:`MEGA4:${command.acceptanceId}`})
for (const command of B2B_PARTNER_COMMANDS) commandToCapability.set(command.commandKey,{permission:command.capabilityPermission,module:'revenue_b2b',contractId:`MEGA5:${command.acceptanceId}`})
for (const command of B2B_MANAGEMENT_COMMANDS) commandToCapability.set(command.commandKey,{permission:command.capabilityPermission,module:'revenue_b2b',contractId:`MEGA6:${command.acceptanceId}`})
for (const command of B2B_ULTRA_COMMANDS) commandToCapability.set(command.commandKey,{permission:command.capabilityPermission,module:'revenue_b2b',contractId:`ULTRA:${command.acceptanceId}`})
export async function authorizeExtensionCommand(db:Awaited<ReturnType<typeof extensionDb>>,userId:string,input:{moduleKey:string;commandKey:string;sourceAdapter?:string|null}){
 const access=await loadUserAccess(db,userId); const contract=commandToCapability.get(input.commandKey)
 if(!contract) return {ok:false as const,status:400,error:'UNREGISTERED_EXTENSION_COMMAND'}
 if(contract.module!==input.moduleKey) return {ok:false as const,status:400,error:'COMMAND_MODULE_MISMATCH'}
 if(!access.modules.some((row:any)=>row.module_key===input.moduleKey)) return {ok:false as const,status:403,error:'MODULE_NOT_ASSIGNED'}
 if(!access.capabilities.some((row:any)=>row.capability_key===contract.permission)) return {ok:false as const,status:403,error:'CAPABILITY_NOT_ASSIGNED'}
 if(input.sourceAdapter && !access.adapters.some((row:any)=>row.adapter_key===input.sourceAdapter)) return {ok:false as const,status:403,error:'ADAPTER_NOT_ASSIGNED'}
 const mode=resolveAutonomy(access.autonomy as Array<{action_pattern:string;mode:ExtensionAccessMode}>,input.commandKey)
 if(mode==='BLOCKED') return {ok:false as const,status:403,error:'COMMAND_BLOCKED_BY_AUTONOMY_POLICY'}
 const approval=access.approvals.find((row:any)=>matchPattern(row.command_pattern,input.commandKey))||null
 return {ok:true as const,contract,mode,approval,access}
}
