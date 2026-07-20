import type { BrowserExtensionActor, ExtensionAccessMode } from './types'
import { BROWSER_EXTENSION_MODULES } from './catalog'
export function isExtensionAdmin(user: BrowserExtensionActor | null | undefined) {
  if(!user) return false
  const role=String(user.role||user.role_key||'').toLowerCase().replaceAll('-','_').replaceAll(' ','_')
  const permissions=Array.isArray(user.permissions)?user.permissions.map(String):[]
  return ['ceo','owner','founder','super_admin','admin','managing_director','internal_platform_admin','platform_admin'].includes(role) || permissions.includes('*') || permissions.includes('browser_extension.admin') || permissions.includes('admin.manage')
}
export function matchPattern(pattern:string,value:string){ if(pattern==='*') return true; if(pattern.endsWith('.*')) return value.startsWith(pattern.slice(0,-1)); return pattern===value }
export function resolveAutonomy(rules:Array<{action_pattern:string;mode:ExtensionAccessMode}>,command:string):ExtensionAccessMode { return rules.find((r)=>matchPattern(r.action_pattern,command))?.mode || 'USER_CONFIRMATION' }
export function moduleDescriptor(key:string){ return BROWSER_EXTENSION_MODULES.find((item)=>item.key===key) || null }
