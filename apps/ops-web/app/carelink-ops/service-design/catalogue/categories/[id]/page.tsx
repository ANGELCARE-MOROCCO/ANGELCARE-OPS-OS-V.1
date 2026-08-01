import { notFound } from 'next/navigation'
import { CategoryDossierWorkspace } from '@/components/carelink/service-design/workspaces/CategoryDossierWorkspace'
import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getCategoryDossier } from '@/lib/homeservice-design/server/repository'
export const dynamic = 'force-dynamic'
export default async function Page({params}:{params:Promise<{id:string}>}){ await requireHomeServiceAccess('homeservice_design.view'); const {id}=await params; const dossier=await getCategoryDossier(id); if(!dossier) notFound(); return <CategoryDossierWorkspace dossier={dossier}/> }
