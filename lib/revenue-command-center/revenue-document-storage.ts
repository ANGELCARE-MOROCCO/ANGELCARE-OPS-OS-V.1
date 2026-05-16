"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()
const BUCKET = "revenue-documents"

export type RevenueDocumentVersion = {
  id: string
  document_id: string | null
  entity_type: string
  entity_id: string
  title: string
  storage_bucket: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  version: number
  status: string
  uploaded_by: string
  created_at: string
  entity_name?: string
  entity_city?: string
}

export async function uploadRevenueDocument(input: {
  file: File
  entityType: string
  entityId: string
  title: string
  documentId?: string
  uploadedBy?: string
}) {
  const cleanName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const timestamp = Date.now()
  const storagePath = `${input.entityType}/${input.entityId}/${timestamp}-${cleanName}`

  const upload = await supabase.storage.from(BUCKET).upload(storagePath, input.file, { upsert: false })
  if (upload.error) throw upload.error

  const { data: previous } = await supabase
    .from("revenue_document_versions")
    .select("version")
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .eq("title", input.title)
    .order("version", { ascending: false })
    .limit(1)

  const nextVersion = previous?.[0]?.version ? Number(previous[0].version) + 1 : 1

  const { data, error } = await supabase
    .from("revenue_document_versions")
    .insert({
      document_id: input.documentId || null,
      entity_type: input.entityType,
      entity_id: input.entityId,
      title: input.title,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      file_name: input.file.name,
      mime_type: input.file.type || null,
      file_size: input.file.size,
      version: nextVersion,
      uploaded_by: input.uploadedBy || "AngelCare",
      status: "active",
    })
    .select()
    .single()

  if (error) throw error
  return data as RevenueDocumentVersion
}

export async function listRevenueDocuments(entityType?: string, entityId?: string) {
  let query = supabase.from("revenue_document_command_view").select("*").order("created_at", { ascending: false })
  if (entityType) query = query.eq("entity_type", entityType)
  if (entityId) query = query.eq("entity_id", entityId)
  const { data, error } = await query
  if (error) throw error
  return (data || []) as RevenueDocumentVersion[]
}

export async function getRevenueDocumentSignedUrl(storagePath: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export async function deleteRevenueDocumentVersion(id: string, storagePath: string) {
  const remove = await supabase.storage.from(BUCKET).remove([storagePath])
  if (remove.error) throw remove.error
  const { error } = await supabase.from("revenue_document_versions").delete().eq("id", id)
  if (error) throw error
}

export function subscribeRevenueDocuments(onChange: () => void) {
  const channel = supabase
    .channel("revenue-documents")
    .on("postgres_changes", { event: "*", schema: "public", table: "revenue_document_versions" }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
