
import { NextResponse } from "next/server"
import { getContentCommandServerClient } from "@/lib/market-os/content-command-center/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const entityType = String(formData.get("entity_type") || "asset")
    const entityId = String(formData.get("entity_id") || `asset-${Date.now()}`)

    if (!file) {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 })
    }

    const supabase = getContentCommandServerClient()
    const bucket = "content-command-center"
    const path = `${entityType}/${entityId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data, error } = await supabase.from("content_command_uploads").insert({
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      storage_bucket: bucket,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
      created_by: "workspace-user",
    }).select("*").single()

    if (error) throw error

    return NextResponse.json({ ok: true, upload: data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Upload failed" }, { status: 500 })
  }
}
