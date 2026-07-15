import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from("calls")
    .select("*")
    .eq("direction", "inbound")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return Response.json({ call: data || null })
}