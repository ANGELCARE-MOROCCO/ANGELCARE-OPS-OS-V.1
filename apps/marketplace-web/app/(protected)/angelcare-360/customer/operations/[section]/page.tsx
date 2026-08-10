import { Ac360OperationsWorkspace } from '@/components/ac360/customer/operations/Ac360OperationsWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const sections = [
  'vue-reseau',
  'aujourdhui',
  'sites',
  'classes-capacite',
  'presence',
  'routines-ecole',
  'equipe-terrain',
  'incidents',
  'transport',
  'taches-operationnelles',
  'qualite-terrain',
  'cloture-journee',
  'rapports',
  'parametres',
]

export function generateStaticParams() {
  return sections.map((section) => ({ section }))
}

export default async function Ac360OperationsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return <Ac360OperationsWorkspace initialSection={section} />
}
