import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewFamilyIntakeStudio from '../_components/NewFamilyIntakeStudio'

export default function NewFamilyPage() {
  async function createFamily(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const family_name = String(formData.get('family_name') || '')
    const parent_name = String(formData.get('parent_name') || '')
    const phone = String(formData.get('phone') || '')
    const secondary_phone = String(formData.get('secondary_phone') || '')
    const city = String(formData.get('city') || '')
    const zone = String(formData.get('zone') || '')
    const address = String(formData.get('address') || '')
    const children_count = Number(formData.get('children_count') || 0)
    const children_ages = String(formData.get('children_ages') || '')
    const preferred_schedule = String(formData.get('preferred_schedule') || '')
    const service_preferences = String(formData.get('service_preferences') || '')
    const special_needs = String(formData.get('special_needs') || '')
    const source = String(formData.get('source') || '')
    const status = String(formData.get('status') || 'active')
    const notes = String(formData.get('notes') || '')

    const { data, error } = await supabase
      .from('families')
      .insert([
        {
          family_name,
          parent_name,
          phone,
          secondary_phone,
          city,
          zone,
          address,
          children_count,
          children_ages,
          preferred_schedule,
          service_preferences,
          special_needs,
          source,
          status,
          notes,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)

    redirect(`/families/${data.id}`)
  }

  return (
    <AppShell
      title="Nouvelle famille"
      subtitle="SANILA Family Relationship Intake Studio"
      breadcrumbs={[{ label: 'Families 360°', href: '/families' }, { label: 'Nouveau dossier' }]}
    >
      <NewFamilyIntakeStudio action={createFamily} />
    </AppShell>
  )
}
