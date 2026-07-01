import { NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse } from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    return NextResponse.json(
      {
        ok: true,
        data: {
          profileId: context.profile.id,
          isInternal: context.isInternal,
          isSuperAdmin: context.isSuperAdmin,
          roles: context.roles,
          permissions: context.permissions,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error, 'Unable to load TrainingHub permissions')
  }
}
