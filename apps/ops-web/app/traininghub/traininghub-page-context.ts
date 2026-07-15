import { redirect } from 'next/navigation'
import { getTrainingHubContext } from '@/lib/traininghub/auth'
import {
  getTrainingHubHomeHref,
  requireTrainingHubExperience,
  type TrainingHubExperience,
} from '@/lib/traininghub/experience'

export async function requireTrainingHubPageContext() {
  try {
    const context = await getTrainingHubContext()
    requireTrainingHubExperience(context, 'admin')
    return context
  } catch (error: any) {
    if (error?.code === 'TRAININGHUB_EXPERIENCE_FORBIDDEN') {
      const home = error?.details?.home || '/traininghub/login?error=forbidden_experience'
      redirect(home)
    }
    redirect('/traininghub/login?error=session_required')
  }
}

export async function requireTrainingHubExperiencePageContext(required: TrainingHubExperience | TrainingHubExperience[]) {
  try {
    const context = await getTrainingHubContext()
    requireTrainingHubExperience(context, required)
    return context
  } catch (error: any) {
    if (error?.code === 'TRAININGHUB_EXPERIENCE_FORBIDDEN') {
      redirect(error?.details?.home || '/traininghub/login?error=forbidden_experience')
    }
    redirect('/traininghub/login?error=session_required')
  }
}

export async function redirectToTrainingHubHome() {
  try {
    const context = await getTrainingHubContext()
    redirect(getTrainingHubHomeHref(context))
  } catch {
    redirect('/traininghub/login?error=session_required')
  }
}
