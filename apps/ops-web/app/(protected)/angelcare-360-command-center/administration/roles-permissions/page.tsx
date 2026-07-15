import { redirect } from 'next/navigation'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import Angelcare360PermissionMatrix from '@/components/angelcare360/administration/Angelcare360PermissionMatrix'
import Angelcare360AdminPageShell from '@/components/angelcare360/administration/Angelcare360AdminPageShell'
import { getAngelcare360AdministrationContext, getAngelcare360AdministrationRolesAndPermissions } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360RolesPermissionsPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const matrix = await getAngelcare360AdministrationRolesAndPermissions()
  const canEdit = state.context.permissions.has('securite.configure') || state.context.access.accessLevel === 'super_admin'

  return (
    <Angelcare360AdminPageShell
      title="Rôles & permissions"
      subtitle="Lecture et contrôle de la matrice RBAC du command center."
      badge="Sécurité"
      statusLabel={`${matrix?.roles.length || 0} rôle(s) · ${matrix?.permissions.length || 0} permission(s)`}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
            { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
            { label: 'RBAC', value: matrix ? 'Chargé' : 'Indisponible' },
          ]}
        />
      )}
    >
      {matrix ? (
        <Angelcare360PermissionMatrix
          schoolId={state.context.school.id}
          roles={matrix.roles}
          permissions={matrix.permissions}
          rolePermissions={matrix.rolePermissions}
          canEdit={canEdit}
          disabledReason={canEdit ? undefined : 'La modification du RBAC est réservée aux profils de configuration sécurité.'}
        />
      ) : (
        <section style={cardStyle}>
          Le socle RBAC n’est pas disponible pour cet établissement.
        </section>
      )}
    </Angelcare360AdminPageShell>
  )
}

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 20,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

