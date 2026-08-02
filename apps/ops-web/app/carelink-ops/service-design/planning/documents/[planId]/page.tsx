import { A4DocumentStudioWorkspace } from '@/components/carelink/service-design/planning/workspaces/A4DocumentStudioWorkspace'

export default async function Page({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  return <A4DocumentStudioWorkspace planId={planId}/>
}
