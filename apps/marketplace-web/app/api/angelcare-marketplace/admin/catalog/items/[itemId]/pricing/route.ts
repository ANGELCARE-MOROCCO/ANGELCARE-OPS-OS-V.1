import { handleCommerceResource } from '@/angelcare-marketplace/commerce-studio/api-handlers'

async function scopedRequest(request: Request, itemId: string): Promise<Request> {
  if (request.method === 'GET') {
    const url = new URL(request.url)
    url.searchParams.set('catalog_item_id', itemId)
    return new Request(url, request)
  }
  const payload = await request.json() as Record<string, unknown>
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify({ ...payload, catalog_item_id: itemId }),
  })
}

async function action(request: Request, { params }: { params: Promise<{ itemId: string }> }): Promise<Response> {
  const { itemId } = await params
  return handleCommerceResource(await scopedRequest(request, itemId), 'price-rules')
}

export const GET = action
export const POST = action
