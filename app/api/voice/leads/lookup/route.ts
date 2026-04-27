import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get("phone") || ""
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length < 6) {
    return Response.json({ lead: null })
  }

  const lastDigits = cleaned.slice(-9)

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .ilike("phone", `%${lastDigits}%`)
    .limit(1)
    .maybeSingle()

  if (error) {
    return Response.json({ lead: null, error: error.message })
  }

  return Response.json({ lead: data || null })
}