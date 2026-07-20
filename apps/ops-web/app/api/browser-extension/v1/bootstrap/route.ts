import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest, loadUserAccess } from '@/lib/browser-extension/runtime'
import { BROWSER_EXTENSION_MODULES } from '@/lib/browser-extension/catalog'
import { B2B_INTELLIGENCE_COMMANDS } from '@/lib/browser-extension/b2b-intelligence/contract'
import { B2B_EXECUTION_COMMANDS } from '@/lib/browser-extension/b2b-execution/contract'
import { B2B_DEAL_COMMANDS } from '@/lib/browser-extension/b2b-deal-closing/contract'
import { B2B_PARTNER_COMMANDS } from '@/lib/browser-extension/b2b-partner-lifecycle/contract'
import { B2B_MANAGEMENT_COMMANDS } from '@/lib/browser-extension/b2b-management-command/contract'
export async function GET(req:NextRequest){
  const auth=await authenticateExtensionRequest(req); if(!auth.ok) return auth.response
  const access=await loadUserAccess(auth.db,auth.context.user.id); const now=Date.now()
  const moduleRows=access.modules.filter((r:any)=>!r.valid_until||new Date(r.valid_until).getTime()>now)
  const modules=moduleRows.map((grant:any)=>{ const descriptor=BROWSER_EXTENSION_MODULES.find((item:any)=>item.key===grant.module_key); if(!descriptor)return null; return {...descriptor,enabled:true,accessLevel:grant.access_level,submodules:access.submodules.filter((r:any)=>r.module_key===descriptor.key).map((r:any)=>r.submodule_key),capabilities:access.capabilities.filter((r:any)=>r.module_key===descriptor.key).map((r:any)=>r.capability_key)} }).filter(Boolean)
  const scopes=Object.fromEntries(access.scopes.map((r:any)=>[r.scope_key,r.scope_value]))
  return NextResponse.json({ok:true,user:{id:auth.context.user.id,name:auth.context.user.full_name||auth.context.user.name||auth.context.user.email||'AngelCare operator',email:auth.context.user.email||null,role:auth.context.user.role||auth.context.user.role_key||null},device:{id:auth.context.device.id,installationId:auth.context.device.installation_id,status:auth.context.device.status,extensionVersion:auth.context.device.extension_version},accessVersion:Number(access.profile?.access_version||0),modules,capabilities:access.capabilities.map((r:any)=>r.capability_key),adapters:access.adapters.map((r:any)=>r.adapter_key),autonomy:access.autonomy.map((r:any)=>({actionPattern:r.action_pattern,mode:r.mode})),approvals:access.approvals.map((r:any)=>({commandPattern:r.command_pattern,approvalLevel:r.approval_level,approverRole:r.approver_role})),scopes,features:{b2bAccountIntelligence:true,b2bPartnerLifecycle:true,b2bManagementCommand:true,contractVersion:'mega6-v1',commands:[...B2B_INTELLIGENCE_COMMANDS,...B2B_EXECUTION_COMMANDS,...B2B_DEAL_COMMANDS,...B2B_PARTNER_COMMANDS,...B2B_MANAGEMENT_COMMANDS].map((x)=>x.commandKey)},issuedAt:new Date().toISOString()})
}
