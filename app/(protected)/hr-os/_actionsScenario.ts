'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createHrScenario(formData: FormData) {
  const supabase = await createClient()

  const payload = {
    name: String(formData.get('name') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    current_staff: Number(formData.get('current_staff') || 0),
    required_staff: Number(formData.get('required_staff') || 0),
    projected_demand_increase: Number(formData.get('projected_demand_increase') || 0),
    average_hiring_cost: Number(formData.get('average_hiring_cost') || 0),
    target_coverage: Number(formData.get('target_coverage') || 100),
    notes: String(formData.get('notes') || '').trim(),
  }

  if (!payload.name || !payload.city) return

  await supabase.from('hr_os_scenarios_v9').insert(payload)
  revalidatePath('/hr-os/executive-ai')
}
