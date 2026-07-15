
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getContentCommandServerClient()
    const [assets, documents, tasks, comments, categories, activity] = await Promise.all([
      supabase.from("content_command_assets").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("content_command_documents").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("content_command_tasks").select("*").order("updated_at", { ascending: false }).limit(500),
      supabase.from("content_command_comments").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("content_command_categories").select("*").order("sort_order", { ascending: true }).limit(500),
      supabase.from("content_command_activity").select("*").order("created_at", { ascending: false }).limit(100),
    ])

    const error = assets.error || documents.error || tasks.error || comments.error || categories.error || activity.error
    if (error) throw error

    return NextResponse.json({
      ok: true,
      assets: assets.data || [],
      documents: documents.data || [],
      tasks: tasks.data || [],
      comments: comments.data || [],
      categories: categories.data || [],
      activity: activity.data || [],
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Workspace hydration failed" }, { status: 500 })
  }
}
