import DevisPrintClient from './DevisPrintClient'

export default async function DevisPrintPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolved = await params
  return <DevisPrintClient id={resolved.id} />
}
