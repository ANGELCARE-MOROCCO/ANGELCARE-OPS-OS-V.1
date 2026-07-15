import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CaregiversWorkforcePage() {
  redirect('/carelink-ops/agents')
}
