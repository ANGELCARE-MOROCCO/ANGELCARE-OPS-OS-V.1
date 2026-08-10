import { notFound, redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Family360Area11Command from '@/components/angelcare360/family360-area11/Family360Area11Command'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { loadAngelcare360Area11FamilyCommand } from '@/lib/angelcare360/server/family360-area11'

export const dynamic = 'force-dynamic'
type PageProps={params:Promise<{id:string}>;searchParams?:Promise<Record<string,string|string[]|undefined>>}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value}
export default async function Angelcare360ParentDetailPage({params,searchParams}:PageProps){
  const {id}=await params; const context=await getAngelcare360AccessContext(); if(!context?.school)redirect('/angelcare-360-command-center')
  if(!context.access.canSeePeopleData&&!context.permissions.has('parents.view')&&!context.permissions.has('angelcare360.people.view')&&context.access.accessLevel!=='super_admin') return <Angelcare360ErrorState title="Accès au responsable verrouillé" description="Votre rôle ne permet pas de consulter ce dossier." actionLabel="Retour aux familles" actionHref="/angelcare-360-command-center/familles"/>
  const q=searchParams?await searchParams:{}; const data=await loadAngelcare360Area11FamilyCommand({view:first(q.view)||'adults',personId:id}); if(!data.selectedDossier)notFound(); return <Family360Area11Command initialData={data}/>
}
