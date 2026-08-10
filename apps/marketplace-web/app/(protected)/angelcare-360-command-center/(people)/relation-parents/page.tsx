import ParentRelationshipArea12Command from '@/components/angelcare360/parent-relationship-area12/ParentRelationshipArea12Command'
import { loadAngelcare360Area12Command } from '@/lib/angelcare360/server/parent-relationship-area12'
export const dynamic='force-dynamic'
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const p=await searchParams;const view=typeof p.view==='string'?p.view:'today';const familyId=typeof p.family==='string'?p.family:null;const data=await loadAngelcare360Area12Command({view,familyId});return <ParentRelationshipArea12Command initialData={data}/>}
