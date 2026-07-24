import Link from 'next/link'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/auth/permissions'
import { requireUser } from '@/lib/auth/session'
import FamilyDossierNavigator from '../_components/FamilyDossierNavigator'

export default async function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const familyId = Number(id)
  const [supabase, user] = await Promise.all([createClient(), requireUser()])

  const [familyRes, leadsRes, missionsRes, notesRes, contractsRes, incidentsRes] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).maybeSingle(),
    supabase.from('leads').select('*').eq('family_id', familyId).order('id', { ascending: false }).limit(30),
    supabase.from('missions').select('*').eq('family_id', familyId).order('id', { ascending: false }).limit(40),
    supabase.from('family_notes').select('*').eq('family_id', familyId).order('created_at', { ascending: false }).limit(30),
    supabase.from('contracts').select('*').eq('family_id', familyId).order('id', { ascending: false }).limit(30),
    supabase.from('incidents').select('*').eq('family_id', familyId).order('id', { ascending: false }).limit(30),
  ])

  const family = familyRes.data as Record<string, any> | null

  if (!family) {
    return (
      <AppShell title="Famille introuvable" subtitle="Aucune fiche famille n’est disponible pour cette référence.">
        <Link href="/families">Retour au portefeuille familles</Link>
      </AppShell>
    )
  }

  const canEdit = hasPermission(user, 'families.edit') || hasPermission(user, 'families.view')
  const canArchive = hasPermission(user, 'families.delete') || hasPermission(user, 'families.view')

  return (
    <AppShell
      title={family.family_name || family.parent_name || `Famille #${family.id}`}
      subtitle="Dossier exécutif 360° · relation, besoins, contrats, missions et continuité de confiance"
      breadcrumbs={[{ label: 'Families 360°', href: '/families' }, { label: family.family_name || `#${family.id}` }]}
    >
      <FamilyDossierNavigator
        data={{
          family,
          leads: leadsRes.data || [],
          missions: missionsRes.data || [],
          notes: notesRes.data || [],
          contracts: contractsRes.data || [],
          incidents: incidentsRes.data || [],
        }}
        canEdit={canEdit}
        canArchive={canArchive}
      />
    </AppShell>
  )
}
