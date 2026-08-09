import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Family360Area11Command from '@/components/angelcare360/family360-area11/Family360Area11Command'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { loadAngelcare360Area11FamilyCommand } from '@/lib/angelcare360/server/family360-area11'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams?: Promise<Record<string,string|string[]|undefined>> }
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value}

export default async function Angelcare360ParentsPage({searchParams}:PageProps){
  const context=await getAngelcare360AccessContext()
  if(!context?.school)redirect('/angelcare-360-command-center')
  if(!context.access.canSeePeopleData&&!context.permissions.has('parents.view')&&!context.permissions.has('angelcare360.people.view')&&context.access.accessLevel!=='super_admin'){
    return <Angelcare360ErrorState title="Accès aux familles verrouillé" description="Votre rôle ne permet pas de consulter les familles et responsables." actionLabel="Retour au cockpit" actionHref="/angelcare-360-command-center"/>
  }
  const params=searchParams?await searchParams:{}
  const data=await loadAngelcare360Area11FamilyCommand({view:first(params.view),familyId:first(params.family),personId:first(params.person)})
  return <Family360Area11Command initialData={data}/>
}
