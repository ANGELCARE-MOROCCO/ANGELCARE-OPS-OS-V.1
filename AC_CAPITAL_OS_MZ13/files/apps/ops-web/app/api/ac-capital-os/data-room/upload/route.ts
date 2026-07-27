import { uploadDataRoomFile } from "../../../../../lib/ac-capital-os/server/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { ok: false, dataMode: "disabled", source: "none", code: "FILE_REQUIRED", warning: "A file field named file is required.", data: null },
      { status: 400 },
    );
  }

  const result = await uploadDataRoomFile({
    file,
    category: typeof form.get("category") === "string" ? String(form.get("category")) : undefined,
    sensitivity: typeof form.get("sensitivity") === "string" ? String(form.get("sensitivity")) : undefined,
    owner: typeof form.get("owner") === "string" ? String(form.get("owner")) : undefined,
    founderApprovalRequired: form.get("founderApprovalRequired") === "true",
  });

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
