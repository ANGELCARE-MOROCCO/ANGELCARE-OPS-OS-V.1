import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { SanilaAdminSnapshot } from './types'

export async function getSanilaAdminSnapshot(): Promise<SanilaAdminSnapshot> {
  const db = await createServiceClient()
  const { data: config } = await db
    .from('sanila_demo_configs')
    .select('id,operator_tenant_id,school_id,school_admin_app_user_id,classification,active,access_status,billing_mode,seed_version,seed_health,safety_status,last_seed_verified_at,last_reset_at')
    .eq('classification', 'master_demo')
    .eq('active', true)
    .maybeSingle()

  const [grantsResult, inquiriesResult, eventsResult, sessionsResult] = await Promise.all([
    config
      ? db.from('sanila_demo_access_grants')
        .select('id,config_id,public_inquiry_id,requester_name,requester_email,requester_phone,approval_state,policy_type,max_uses,activation_duration_minutes,absolute_expires_at,status,pin_last4,used_count,activated_at,effective_expires_at,last_access_at,notes,created_at,updated_at')
        .eq('config_id', config.id)
        .order('created_at', { ascending: false })
        .limit(300)
      : Promise.resolve({ data: [] }),
    db.from('angelcare_marketplace_public_inquiries')
      .select('id,public_reference,full_name,email,phone,organization,city,status,source_route,message,source_metadata,created_at,updated_at')
      .like('source_route', '/angelcare-marketplace/fr/sanila/%')
      .order('created_at', { ascending: false })
      .limit(300),
    config
      ? db.from('sanila_demo_access_events')
        .select('id,grant_id,public_inquiry_id,event_type,severity,metadata,created_at')
        .eq('config_id', config.id)
        .order('created_at', { ascending: false })
        .limit(3000)
      : Promise.resolve({ data: [] }),
    config
      ? db.from('sanila_demo_sessions')
        .select('id,grant_id,school_id,activated_at,effective_expires_at,last_seen_at,revoked_at,created_at')
        .eq('config_id', config.id)
        .order('created_at', { ascending: false })
        .limit(500)
      : Promise.resolve({ data: [] }),
  ])

  return {
    config: (config || null) as SanilaAdminSnapshot['config'],
    grants: (grantsResult.data || []) as SanilaAdminSnapshot['grants'],
    inquiries: (inquiriesResult.data || []) as SanilaAdminSnapshot['inquiries'],
    events: (eventsResult.data || []) as SanilaAdminSnapshot['events'],
    sessions: (sessionsResult.data || []) as SanilaAdminSnapshot['sessions'],
  }
}
