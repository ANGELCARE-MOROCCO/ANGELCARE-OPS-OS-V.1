
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = getContentCommandServerClient()

    const now = new Date().toISOString()
    const assets = [
      {
        id: "asset-digital-academy-launch",
        family: "Digital content",
        title: "Academy Launch Campaign",
        category: "Publication Reel",
        subcategory: "A.A ANGELCARE ACADEMY",
        output: "Publication Reel",
        channel: "Instagram / TikTok",
        service_product: "A.A ANGELCARE ACADEMY",
        owner: "Marketing Team",
        status: "In Review",
        priority: "High",
        metadata: { seeded: true },
      },
      {
        id: "asset-print-b2b-brochure",
        family: "Print & Offline Content",
        title: "B2B Partnership Brochure",
        category: "Brochure",
        subcategory: "Partnerships",
        output: "Brochure",
        channel: "Sales / Print",
        service_product: "B2B Preschool Partnership",
        owner: "Sales Enablement",
        status: "Approved",
        priority: "High",
        metadata: { seeded: true },
      },
    ]

    const documents = [
      {
        id: "doc-corporate-policy-template",
        title: "Corporate Document Control Policy",
        document_type: "Policy",
        category: "Governance & Policies",
        subcategory: "Quality & Compliance",
        owner: "Operations",
        version: "v1.0",
        status: "Approved",
        confidentiality: "internal",
        metadata: { seeded: true },
      },
    ]

    const tasks = [
      {
        id: "task-review-academy-launch",
        entity_type: "asset",
        entity_id: "asset-digital-academy-launch",
        title: "Review Academy Launch Campaign",
        status: "active",
        owner: "Marketing Director",
        priority: "high",
        payload: { seeded: true },
      },
    ]

    await supabase.from("content_command_assets").upsert(assets, { onConflict: "id" })
    await supabase.from("content_command_documents").upsert(documents, { onConflict: "id" })
    await supabase.from("content_command_tasks").upsert(tasks, { onConflict: "id" })
    await supabase.from("content_command_activity").insert({
      entity_type: "workspace",
      entity_id: "seed",
      action: "seed-production-workspace",
      actor: "system",
      payload: { now },
    })

    return NextResponse.json({ ok: true, assets: assets.length, documents: documents.length, tasks: tasks.length })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Failed to seed workspace" }, { status: 500 })
  }
}
