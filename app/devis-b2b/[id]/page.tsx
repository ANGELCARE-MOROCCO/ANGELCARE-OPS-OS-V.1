import DevisB2BPrintClient from './DevisB2BPrintClient'

export default async function DevisB2BPrintPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolved = await params
  return <DevisB2BPrintClient id={resolved.id} />
}
