import { handleAdminChangeRequest } from '@/angelcare-marketplace/journey-control/api-handlers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ journeyId: string; changeRequestId: string }> },
) {
  const { journeyId, changeRequestId } = await params
  return handleAdminChangeRequest(request, journeyId, changeRequestId)
}
