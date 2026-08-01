import { notFound } from 'next/navigation'
import ProductDesignWarRoom from '@/components/flashcards-os/intelligence/ProductDesignWarRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductDesign } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function ProductDesignDossierPage({ params }: { params: Promise<{ designId: string }> }) {
  await requireFlashcardsPageAccess('flashcards_os.manage_product_design')
  const { designId } = await params
  const design = await loadProductDesign(decodeURIComponent(designId))
  if (!design.design) notFound()
  return <ProductDesignWarRoom design={design.design} />
}
