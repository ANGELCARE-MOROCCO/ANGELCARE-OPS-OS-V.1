import { notFound } from 'next/navigation'
import Angelcare360ClaimTicketDetail from '@/components/angelcare360/claims/Angelcare360ClaimTicketDetail'
import { getAngelcare360ClaimTicketById } from '@/lib/angelcare360/server/claims'
import { listAngelcare360Staff } from '@/lib/angelcare360/server/queries'
import { getAngelcare360ClaimsContext } from '../../_utils'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

function can(context: Awaited<ReturnType<typeof getAngelcare360ClaimsContext>>, permission: string) {
  return context.permissions.has(permission) || context.permissions.has('angelcare360.*') || context.permissions.has('*')
}

export default async function Angelcare360ClaimTicketDetailPage({ params }: PageProps) {
  const context = await getAngelcare360ClaimsContext()
  const { id } = await params
  const [ticket, staffRows] = await Promise.all([
    getAngelcare360ClaimTicketById(id, { schoolId: context.school.id }),
    can(context, 'personnel.view') ? listAngelcare360Staff(context.school.id).catch(() => []) : Promise.resolve([]),
  ])
  if (!ticket) notFound()
  const staff = staffRows.map((person) => ({
    id: String(person.id),
    full_name: String(person.full_name || person.staff_code || person.id),
    staff_code: String(person.staff_code || ''),
    department: null,
  }))
  return <Angelcare360ClaimTicketDetail ticket={ticket} schoolId={context.school.id} staff={staff} />
}
