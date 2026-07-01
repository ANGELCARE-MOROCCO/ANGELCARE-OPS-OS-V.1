import { redirect } from 'next/navigation'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

export async function GET() {
  const supabase = await createTrainingHubUserClient()
  await supabase.auth.signOut()
  redirect('/traininghub/login?logged_out=1')
}

export async function POST() {
  const supabase = await createTrainingHubUserClient()
  await supabase.auth.signOut()
  redirect('/traininghub/login?logged_out=1')
}
