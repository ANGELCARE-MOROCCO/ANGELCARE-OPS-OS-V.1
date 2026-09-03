import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { createServiceClient } from '@/lib/supabase/server'
import SanilaDemoDesk from '@/components/marketplace/SanilaDemoDesk'

export const dynamic = 'force-dynamic'

export default async function SanilaDemoDeskPage() {
  await requireMarketplacePageContext('marketplace.public.inquiries.manage')
  const db = await createServiceClient()
  const { data: config } = await db.from('sanila_demo_configs').select('id,operator_tenant_id,school_id,school_admin_app_user_id,classification,active,access_status,billing_mode,seed_version,seed_health,safety_status,last_seed_verified_at,last_reset_at').eq('classification', 'master_demo').eq('active', true).maybeSingle()
  const [{ data: grants }, { data: inquiries }, { data: events }] = await Promise.all([
    config ? db.from('sanila_demo_access_grants').select('id,public_inquiry_id,requester_name,requester_email,approval_state,policy_type,max_uses,activation_duration_minutes,absolute_expires_at,status,pin_last4,used_count,activated_at,effective_expires_at,last_access_at,notes,created_at').eq('config_id', config.id).order('created_at', { ascending: false }).limit(200) : Promise.resolve({ data: [] }),
    db.from('angelcare_marketplace_public_inquiries').select('id,public_reference,full_name,email,organization,status,source_route,created_at').not('status', 'in', '(closed,spam)').order('created_at', { ascending: false }).limit(100),
    config ? db.from('sanila_demo_access_events').select('id,grant_id,public_inquiry_id,event_type,severity,metadata,created_at').eq('config_id', config.id).order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
  ])
  return <SanilaDemoDesk config={config} grants={grants || []} inquiries={inquiries || []} events={events || []} />
}
