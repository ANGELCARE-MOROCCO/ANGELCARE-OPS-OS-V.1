import ParentRelationshipArea12Command from '@/components/angelcare360/parent-relationship-area12/ParentRelationshipArea12Command'
import { loadAngelcare360Area12Command } from '@/lib/angelcare360/server/parent-relationship-area12'
export const dynamic='force-dynamic'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const data=await loadAngelcare360Area12Command({view:'today',familyId:id});return <ParentRelationshipArea12Command initialData={data}/>}
