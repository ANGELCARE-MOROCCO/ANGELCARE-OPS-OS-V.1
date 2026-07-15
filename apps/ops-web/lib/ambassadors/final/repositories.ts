import { createAmbassadorSupabaseAdminClient } from './supabase-admin';
import type { AmbassadorServiceResult } from './types';

async function listTable(table: string): Promise<AmbassadorServiceResult<unknown[]>> {
  const supabase = createAmbassadorSupabaseAdminClient();
  const { data, error } = await supabase.from(table).select('*').limit(100);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export function listAmbassadorProfiles() {
  return listTable('ambassador_profiles');
}

export function listAmbassadorMissions() {
  return listTable('ambassador_missions');
}

export function listAmbassadorPayouts() {
  return listTable('ambassador_payouts');
}

export async function insertAmbassadorAuditLog(payload: Record<string, unknown>): Promise<AmbassadorServiceResult<unknown>> {
  const supabase = createAmbassadorSupabaseAdminClient();
  const { data, error } = await supabase.from('ambassador_audit_logs').insert(payload).select('*').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}
