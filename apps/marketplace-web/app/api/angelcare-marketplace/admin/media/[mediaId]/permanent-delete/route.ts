import { handleMarketplaceMediaPermanentDelete } from '@/angelcare-marketplace/commerce-studio/media-storage-api'

export const runtime = 'nodejs'
export async function POST(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params
  return handleMarketplaceMediaPermanentDelete(request, mediaId)
}
