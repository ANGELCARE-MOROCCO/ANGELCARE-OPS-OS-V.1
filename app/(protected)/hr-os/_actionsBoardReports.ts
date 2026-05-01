'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { makeHrReportReference } from './_lib/hrBoardReporting'

export async function createHrBoardExport(formData: FormData) {
  const supabase = await createClient()

  const type = String(formData.get('type') || 'board_pack')
  const payload = {
    reference: makeHrReportReference(type),
    type,
    reason: String(formData.get('reason') || '').trim(),
    generated_by: String(formData.get('generated_by') || 'OpsOS User').trim(),
    period_start: String(formData.get('period_start') || '') || null,
    period_end: String(formData.get('period_end') || '') || null,
    filters: {
      city: String(formData.get('city') || ''),
      department: String(formData.get('department') || ''),
      confidentiality: String(formData.get('confidentiality') || 'internal'),
    },
  }

  if (!payload.reason) return

  await supabase.from('hr_os_board_exports').insert(payload)
  revalidatePath('/hr-os/board-reports')
}
