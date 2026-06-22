import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { defaultServices } from "@/lib/market-os/content-workspace"

const possibleTables = ["services", "service_items", "service_catalog", "angelcare_services"]

export async function GET() {
  const supabase = await createClient()
  for (const table of possibleTables) {
    const { data, error } = await supabase.from(table).select("id,name,title,category,price").limit(100)
    if (!error && data?.length) {
      return NextResponse.json({ data: data.map((s: any) => ({ id: String(s.id), name: s.name || s.title || "Service", category: s.category || null, price: s.price || null })), source: table })
    }
  }
  return NextResponse.json({ data: defaultServices, fallback: true })
}
