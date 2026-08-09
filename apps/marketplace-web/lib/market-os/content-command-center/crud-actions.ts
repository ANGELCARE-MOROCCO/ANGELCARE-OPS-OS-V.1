
import { contentCommandProductionApi } from "./client"

export function buildAssetPayload(input: any) {
  return {
    id: input.id || `asset-${Date.now()}`,
    family: input.family,
    title: input.title || input.name || "Untitled asset",
    category: input.category || input.output || "General",
    subcategory: input.subcategory || input.service_product || "General",
    output: input.output || input.category || "Content",
    channel: input.channel || "Content Library",
    service_product: input.serviceProduct || input.service_product || input.subcategory || "",
    owner: input.owner || "Marketing Team",
    status: input.status || "Draft",
    priority: input.priority || "Medium",
    metadata: input.metadata || {},
  }
}

export function buildDocumentPayload(input: any) {
  return {
    id: input.id || `doc-${Date.now()}`,
    title: input.title || input.name || "Untitled document",
    document_type: input.documentType || input.document_type || input.output || "Document",
    category: input.category || "Corporate Docs",
    subcategory: input.subcategory || "General",
    owner: input.owner || "Operations",
    version: input.version || "v1.0",
    status: input.status || "Draft",
    confidentiality: input.confidentiality || "internal",
    metadata: input.metadata || {},
  }
}

export async function saveContentByFamily(input: any) {
  if (input.family === "Corporate Docs") {
    return contentCommandProductionApi.saveDocument(buildDocumentPayload(input))
  }
  return contentCommandProductionApi.saveAsset(buildAssetPayload(input))
}
