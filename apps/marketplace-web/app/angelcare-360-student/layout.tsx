import RolePortalShell from '@/components/angelcare360/role-portals/RolePortalShell'
import { requirePortalIdentity } from '@/lib/angelcare360/portal/server'

export const dynamic = 'force-dynamic'

export default async function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const identity = await requirePortalIdentity('student')
  const identityName = String(identity.person.full_name || identity.appUser.full_name || identity.appUser.email || 'Utilisateur SANILA')
  return <RolePortalShell kind="student" schoolName={String(identity.school.name || 'Établissement SANILA')} academicYear={String(identity.academicYear?.label || 'Année active')} identityName={identityName}>{children}</RolePortalShell>
}
