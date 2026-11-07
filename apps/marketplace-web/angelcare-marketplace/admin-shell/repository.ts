import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { notificationPolicy } from '../admin-notifications/policy'
import type { AdminShellSnapshot,AdminShellIndicator } from './types'
/** Legacy rail remains native and scoped; all notification rows now come exclusively from the recipient API. */
export async function getAdminShellSnapshot(context:MarketplaceRequestContext):Promise<AdminShellSnapshot>{
 const generatedAt=new Date().toISOString();let counts:Record<string,number>={};
 try{const db=await createServiceClient(),r=await db.rpc('ac_nc_indicator_counts',{p_policy:notificationPolicy(context)});if(!r.error)counts=r.data||{};}catch{}
 const definitions=[['orders','Commandes ouvertes','angelcare_marketplace_journeys','/orders'],['customers','Clients actifs','angelcare_marketplace_customer_accounts','/customers'],['invoices','Factures ouvertes','angelcare_marketplace_finance_invoices','/finance/invoices'],['approvals','Décisions en attente','angelcare_marketplace_approval_requests','/approvals'],['inquiries','Demandes à qualifier','angelcare_marketplace_public_inquiries','/public-inquiries'],['blocked','Actions ouvertes','angelcare_marketplace_admin_action_items','/action-center']];
 const indicators:AdminShellIndicator[]=definitions.map(([key,label,source,path])=>({key,label,value:counts[source]===undefined?'—':String(counts[source]),hint:counts[source]===undefined?'périmètre ou source indisponible':'dossiers natifs autorisés',href:'/angelcare-marketplace/admin'+path,category:key==='orders'||key==='customers'||key==='invoices'?'commercial':'control',tone:counts[source]===undefined?'neutral':counts[source]>0?'attention':'positive'}));
 return {generatedAt,indicators,notifications:[],notificationCount:0};
}
