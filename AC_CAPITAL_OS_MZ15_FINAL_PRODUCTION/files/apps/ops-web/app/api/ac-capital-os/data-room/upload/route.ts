import { apiError, insertAudit, insertRow, requireCapitalApiActor, success } from "@/lib/ac-capital-os/server/mz15-api";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const allowed = new Set(["application/pdf","image/png","image/jpeg","image/webp","text/plain","text/csv","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw Object.assign(new Error("FILE_REQUIRED"), { status: 400 });
    if (!allowed.has(file.type || "application/octet-stream")) throw Object.assign(new Error(`FILE_TYPE_BLOCKED: ${file.type}`), { status: 400 });
    if (file.size > 20 * 1024 * 1024) throw Object.assign(new Error("FILE_TOO_LARGE: 20MB maximum"), { status: 400 });
    const bucket = process.env.AC_CAPITAL_DATA_ROOM_BUCKET || "ac-capital-data-room";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName}`;
    const supabase = await createServiceClient();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabase.storage.from(bucket).upload(storagePath, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw Object.assign(new Error(`storage_not_configured: ${error.message}`), { status: 400 });
    const record = await insertRow("ac_capital_data_room_documents", {
      title: file.name,
      category: String(form.get("category") || "General"),
      document_type: String(form.get("documentType") || file.type || "file"),
      readiness_level: "Uploaded - Review Required",
      status: "Uploaded",
      version: "v1",
      language: String(form.get("language") || "FR"),
      owner: String(form.get("owner") || actor.name),
      source_workspace: String(form.get("sourceWorkspace") || "data-room"),
      approval_status: String(form.get("approvalStatus") || "Pending Review"),
      founder_approval_required: form.get("founderApprovalRequired") === "true",
      signature_required: form.get("signatureRequired") === "true",
      stamp_required: form.get("stampRequired") === "true",
      credibility_score: 0,
      reusable: form.get("reusable") === "true",
      sensitivity_level: String(form.get("sensitivity") || "Internal"),
      file_reference: `${bucket}/${storagePath}`,
      next_action: "Validate, classify and link to a capital case.",
      last_updated_at: new Date().toISOString(),
    });
    await insertRow("ac_capital_data_room_versions", { document_id: record.id, version_label: "v1", version_number: 1, status: "Uploaded", change_summary: "Initial controlled upload", created_by: actor.email || actor.name });
    await insertAudit({ actor: actor.email || actor.name, action: "data_room_upload", objectType: "data_room_document", objectId: String(record.id), after: record, risk: String(form.get("sensitivity") || "Internal") });
    return Response.json(success({ record, bucket, storagePath }));
  } catch (reason) { return apiError(reason); }
}
