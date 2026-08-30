import { handleMarketplaceMediaDelivery } from '@/angelcare-marketplace/commerce-studio/media-storage-api'

export const runtime = 'nodejs'
export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string; fileName: string }> }) {
  const { mediaId } = await params
  return handleMarketplaceMediaDelivery(request, mediaId)
}
export const HEAD = GET
