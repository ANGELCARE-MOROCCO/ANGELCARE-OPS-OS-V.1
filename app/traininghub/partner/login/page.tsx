import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function TrainingHubPartnerLegacyLoginRedirect() {
  redirect('/traininghub/login')
}
