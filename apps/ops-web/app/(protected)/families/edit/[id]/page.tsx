import Link from 'next/link'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditFamilyGovernanceStudio from '../../_components/EditFamilyGovernanceStudio'

export default async function EditFamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const familyId = Number(id)
  const supabase = await createClient()

  const { data: family, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .maybeSingle()

  if (error) {
    return <AppShell title="Erreur dossier famille" subtitle={error.message}><Link href="/families">Retour au portefeuille</Link></AppShell>
  }

  if (!family) {
    return <AppShell title="Famille introuvable" subtitle="Aucun dossier ne correspond à cette référence."><Link href="/families">Retour au portefeuille</Link></AppShell>
  }

  async function updateFamily(formData: FormData) {
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

    const { error } = await supabase
      .from('families')
      .update({
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
      })
      .eq('id', familyId)

    if (error) throw new Error(error.message)

    redirect(`/families/${familyId}`)
  }

  return (
    <AppShell
      title={`Gouvernance famille #${family.id}`}
      subtitle="SANILA Family Relationship Governance Studio"
      breadcrumbs={[{ label: 'Families 360°', href: '/families' }, { label: family.family_name || `Famille #${family.id}`, href: `/families/${family.id}` }, { label: 'Modifier' }]}
    >
      <EditFamilyGovernanceStudio family={family} action={updateFamily} />
    </AppShell>
  )
}
