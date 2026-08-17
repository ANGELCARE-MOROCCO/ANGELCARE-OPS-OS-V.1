import Angelcare360ClaimCreateStudio from '@/components/angelcare360/claims/Angelcare360ClaimCreateStudio'
import type { ClaimRequesterOption } from '@/components/angelcare360/claims/Angelcare360ClaimCreateStudio'
import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimTicketsWorkspace from '@/components/angelcare360/claims/Angelcare360ClaimTicketsWorkspace'
import { listAngelcare360ClaimTickets } from '@/lib/angelcare360/server/claims'
import {
  listAngelcare360Parents as listRequesterParents,
  listAngelcare360Staff as listRequesterStaff,
  listAngelcare360Students as listRequesterStudents,
} from '@/lib/angelcare360/server/queries'
import { getAngelcare360ClaimsContext } from '../_utils'

export const dynamic = 'force-dynamic'

function can(context: Awaited<ReturnType<typeof getAngelcare360ClaimsContext>>, permission: string) {
  return context.permissions.has(permission) || context.permissions.has('angelcare360.*') || context.permissions.has('*')
}

export default async function Angelcare360ClaimTicketsPage() {
  const context = await getAngelcare360ClaimsContext()
  const [tickets, parents, students, staff] = await Promise.all([
    listAngelcare360ClaimTickets({ schoolId: context.school.id }),
    can(context, 'parents.view') ? listRequesterParents(context.school.id).catch(() => []) : Promise.resolve([]),
    can(context, 'eleves.view') ? listRequesterStudents(context.school.id).catch(() => []) : Promise.resolve([]),
    can(context, 'personnel.view') ? listRequesterStaff(context.school.id).catch(() => []) : Promise.resolve([]),
  ])
  const requesterOptions: ClaimRequesterOption[] = [
    ...parents.map((person) => ({ id: String(person.id), label: String(person.full_name || person.parent_code || person.id), code: person.parent_code ? String(person.parent_code) : null, type: 'submittedByParentId' as const })),
    ...students.map((person) => ({ id: String(person.id), label: String(person.full_name || person.student_code || person.id), code: person.student_code ? String(person.student_code) : null, type: 'submittedByStudentId' as const })),
    ...staff.map((person) => ({ id: String(person.id), label: String(person.full_name || person.staff_code || person.id), code: person.staff_code ? String(person.staff_code) : null, type: 'submittedByStaffId' as const })),
  ]

  return <Angelcare360ClaimsSectionScreen
    title="Dossiers de confiance"
    description="File opérationnelle des réclamations : recherche, pression, responsabilité et progression sans perdre le contexte humain. Chaque carte ouvre une Case Chamber complète."
    eyebrow="TRUST RESOLUTION · OPERATIONAL QUEUE"
    activeHref="/angelcare-360-command-center/reclamations/tickets"
    actions={<Angelcare360ClaimCreateStudio schoolId={context.school.id} requesterOptions={requesterOptions} />}
  >
    <Angelcare360ClaimTicketsWorkspace tickets={tickets} />
  </Angelcare360ClaimsSectionScreen>
}
