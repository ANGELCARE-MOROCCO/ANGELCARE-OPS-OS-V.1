import { notFound, redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Student360Area10Command from '@/components/angelcare360/student360-area10/Student360Area10Command'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { loadAngelcare360Area10StudentCommand } from '@/lib/angelcare360/server/student360-area10'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function Angelcare360StudentDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('eleves.view') && !context.permissions.has('angelcare360.people.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux élèves verrouillé"
        description="Votre rôle ne permet pas encore de consulter ce dossier élève."
        actionLabel="Retour aux élèves"
        actionHref="/angelcare-360-command-center/eleves"
      />
    )
  }

  const query = searchParams ? await searchParams : {}
  const data = await loadAngelcare360Area10StudentCommand({ view: first(query.view) || 'students', studentId: id })
  if (!data.selectedStudent) notFound()
  return <Student360Area10Command initialData={data}/>
}
