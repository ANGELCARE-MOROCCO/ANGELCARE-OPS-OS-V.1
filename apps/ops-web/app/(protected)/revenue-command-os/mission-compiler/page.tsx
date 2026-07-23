import { requireAccess } from '@/lib/auth/requireAccess'
import MissionCompilerWorkspace from './_components/MissionCompilerWorkspace'

export const dynamic = 'force-dynamic'

export default async function MissionCompilerPage() {
  await requireAccess(['revenue_os.mission_compiler.view', 'revenue_os.mission_compiler.compile', 'revenue_os.manage'])
  return <MissionCompilerWorkspace />
}
