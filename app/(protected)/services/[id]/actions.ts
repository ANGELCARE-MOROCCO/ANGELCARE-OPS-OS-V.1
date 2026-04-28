'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function disableVariation(formData: FormData) {
  const supabase = await createClient()
  const serviceId = String(formData.get('service_id'))
  const variationId = String(formData.get('variation_id'))

  const { error } = await supabase
    .from('service_variations')
    .update({ status: 'inactive' })
    .eq('id', variationId)

  if (error) throw new Error(error.message)

  redirect(`/services/${serviceId}`)
}

export async function activateVariation(formData: FormData) {
  const supabase = await createClient()
  const serviceId = String(formData.get('service_id'))
  const variationId = String(formData.get('variation_id'))

  const { error } = await supabase
    .from('service_variations')
    .update({ status: 'active' })
    .eq('id', variationId)

  if (error) throw new Error(error.message)

  redirect(`/services/${serviceId}`)
}

export async function deleteVariation(formData: FormData) {
  const supabase = await createClient()
  const serviceId = String(formData.get('service_id'))
  const variationId = String(formData.get('variation_id'))

  const { error } = await supabase
    .from('service_variations')
    .delete()
    .eq('id', variationId)

  if (error) throw new Error(error.message)

  redirect(`/services/${serviceId}`)
}