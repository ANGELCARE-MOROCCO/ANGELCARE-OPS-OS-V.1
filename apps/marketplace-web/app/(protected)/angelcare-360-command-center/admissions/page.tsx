import { redirect } from 'next/navigation'
import AdmissionsArea9Command from '@/components/angelcare360/admissions-area9/AdmissionsArea9Command'
import { loadAngelcare360Area9AdmissionsCommand } from '@/lib/angelcare360/server/admissions-area9'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function valueOf(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] : null
}

export default async function Angelcare360AdmissionsArea9Page({ searchParams }: PageProps) {
  const params = await searchParams
  try {
    const data = await loadAngelcare360Area9AdmissionsCommand({
      view: valueOf(params?.view),
      selectedId: valueOf(params?.record),
    })
    return <AdmissionsArea9Command initialData={data} />
  } catch {
    redirect('/angelcare-360-command-center')
  }
}
