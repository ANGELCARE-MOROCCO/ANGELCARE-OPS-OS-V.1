import { notFound, redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Family360Area11Command from '@/components/angelcare360/family360-area11/Family360Area11Command'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { loadAngelcare360Area11FamilyCommand } from '@/lib/angelcare360/server/family360-area11'
export const dynamic='force-dynamic'
type PageProps={params:Promise<{id:string}>}
export default async function Angelcare360FamilyDetailPage({params}:PageProps){const {id}=await params;const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');if(!context.access.canSeePeopleData&&!context.permissions.has('parents.view')&&!context.permissions.has('angelcare360.people.view')&&context.access.accessLevel!=='super_admin')return <Angelcare360ErrorState title="Accès famille verrouillé" description="Votre rôle ne permet pas de consulter ce dossier familial." actionLabel="Retour aux familles" actionHref="/angelcare-360-command-center/familles"/>;const data=await loadAngelcare360Area11FamilyCommand({view:'families',familyId:id});if(!data.selectedDossier)notFound();return <Family360Area11Command initialData={data}/>}
