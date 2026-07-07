import { redirect } from 'next/navigation'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import Angelcare360AdminPageShell from '@/components/angelcare360/administration/Angelcare360AdminPageShell'
import Angelcare360SchoolSettingsForm from '@/components/angelcare360/administration/Angelcare360SchoolSettingsForm'
import { getAngelcare360AdministrationContext, getAngelcare360SchoolSettings } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ParametresPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const settings = await getAngelcare360SchoolSettings(state.context.school.id)
  const canUpdate = state.context.permissions.has('parametres.update') || state.context.access.accessLevel === 'super_admin'

  return (
    <Angelcare360AdminPageShell
      title="Paramètres établissement"
      subtitle="Réglages opérationnels, linguistiques et financiers de base."
      badge="Configuration"
      statusLabel={settings ? 'Configuration chargée' : 'Configuration non initialisée'}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
            { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
            { label: 'Devise', value: settings?.default_currency || state.context.school.currency || 'MAD' },
          ]}
        />
      )}
    >
      <Angelcare360SchoolSettingsForm
        schoolId={state.context.school.id}
        initialValues={settings}
        canUpdate={canUpdate}
        disabledReason={canUpdate ? undefined : 'La mise à jour des paramètres est réservée aux rôles de direction et de paramétrage.'}
      />
    </Angelcare360AdminPageShell>
  )
}

