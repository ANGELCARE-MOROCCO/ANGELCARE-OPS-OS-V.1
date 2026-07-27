import { getAcCapitalFeatureFlags } from "./feature-flags";
import { supabaseRestInsert, supabaseStorageUpload } from "./supabase";

const allowedTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function uploadDataRoomFile(input: {
  file: File;
  category?: string;
  sensitivity?: string;
  owner?: string;
  founderApprovalRequired?: boolean;
}) {
  const flags = getAcCapitalFeatureFlags();
  const bucket = flags.storageBucket;

  if (!allowedTypes.includes(input.file.type || "application/octet-stream")) {
    return { ok: false, dataMode: "disabled", source: "none", code: "FILE_TYPE_BLOCKED", warning: `Blocked file type: ${input.file.type}` };
  }

  const maxBytes = 20 * 1024 * 1024;
  if (input.file.size > maxBytes) {
    return { ok: false, dataMode: "disabled", source: "none", code: "FILE_TOO_LARGE", warning: "File exceeds 20MB guard." };
  }

  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  const buffer = await input.file.arrayBuffer();
  const upload = await supabaseStorageUpload(bucket, objectPath, buffer, input.file.type || "application/octet-stream");

  if (!upload.ok || !upload.storagePath) {
    return { ok: false, dataMode: "disabled", source: "none", code: "storage_not_configured", warning: upload.warning || "storage_not_configured" };
  }

  const metadata = {
    document_title: input.file.name,
    file_name: input.file.name,
    storage_path: upload.storagePath,
    mime_type: input.file.type,
    file_size_bytes: input.file.size,
    sensitivity: input.sensitivity || "Internal",
    owner: input.owner || "Data Room Owner",
    package_category: input.category || "General",
    founder_approval_required: Boolean(input.founderApprovalRequired),
    status: "Uploaded Metadata",
    created_at: new Date().toISOString(),
  };

  await supabaseRestInsert("ac_capital_data_room_documents", metadata);
  await supabaseRestInsert("ac_capital_data_room_versions", {
    document_id: null,
    version_label: "v1",
    storage_path: upload.storagePath,
    created_at: new Date().toISOString(),
  });

  return {
    ok: true,
    dataMode: "supabase-live",
    source: "supabase",
    data: { storagePath: upload.storagePath, metadata },
  };
}
