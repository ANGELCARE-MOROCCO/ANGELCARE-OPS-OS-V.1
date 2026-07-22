import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { MegaActor } from './types'
export async function megaActor():Promise<MegaActor>{const client=await createClient() as any;const result=await client.auth.getUser();const user=result.data?.user;if(!user)throw new Error('unauthenticated');const tenantId=String(user.app_metadata?.tenant_id??user.user_metadata?.tenant_id??'');if(!tenantId)throw new Error('tenant_missing');const permissions=Array.isArray(user.app_metadata?.permissions)?user.app_metadata.permissions:[];return{id:String(user.id),tenantId,displayName:String(user.user_metadata?.full_name??user.email??'Utilisateur'),role:String(user.app_metadata?.role??'user'),permissions}}
export function requirePermission(actor:MegaActor,permission:string):void{if(!actor.permissions.includes(permission)&&!actor.permissions.includes('revenue_os.mega_production.admin')&&!actor.permissions.includes('*'))throw new Error('permission_denied')}
