import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { id, status } = await req.json()

  const supabase = await createClient()

  await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)

  return Response.json({ success: true })
}