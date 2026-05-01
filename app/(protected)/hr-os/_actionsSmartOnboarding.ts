'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markSmartOnboardingStep(formData: FormData) {
  const supabase = await createClient()

  const payload = {
    user_id: String(formData.get('user_id') || 'current-user'),
    role: String(formData.get('role') || 'agent'),
    step_code: String(formData.get('step_code') || ''),
    step_title: String(formData.get('step_title') || ''),
    completed: true,
    evidence_note: String(formData.get('evidence_note') || '').trim(),
  }

  if (!payload.step_code) return

  await supabase.from('hr_os_smart_onboarding_progress').insert(payload)
  revalidatePath('/hr-os/onboarding-smart')
}

export async function createOnboardingAssessment(formData: FormData) {
  const supabase = await createClient()

  const payload = {
    user_id: String(formData.get('user_id') || 'current-user'),
    role: String(formData.get('role') || 'agent'),
    score: Number(formData.get('score') || 0),
    decision: String(formData.get('decision') || 'in_progress'),
    manager_note: String(formData.get('manager_note') || '').trim(),
  }

  await supabase.from('hr_os_onboarding_assessments').insert(payload)
  revalidatePath('/hr-os/onboarding-smart')
}
