import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
export default async function MyContentCommandHome(){const user=await getCurrentAppUser() as any;const role=String(user?.role||user?.role_key||'').toLowerCase();try{const supabase=await createServiceClient() as any;const result=await supabase.from('market_content_role_home_profiles').select('default_route').eq('role_key',role).maybeSingle();if(result.data?.default_route)redirect(result.data.default_route)}catch{}redirect('/market-os/content-command-center')}
