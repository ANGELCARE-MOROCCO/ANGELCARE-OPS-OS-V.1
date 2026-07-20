import { NextRequest } from "next/server"
import { accessEvent, fail, governanceContext, ok, parseBody, publicDevice, securityEvent } from "@/lib/whatsapp-desktop/server"

function platformOf(value: unknown) {
  const raw = String(value || "").toLowerCase()
  if (raw === "darwin" || raw === "macos") return "macos"
  if (raw === "win32" || raw === "windows") return "windows"
  if (raw === "linux") return "linux"
  return "unknown"
}

export async function POST(request: NextRequest) {
  const context = await governanceContext(request)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const installationId = String(body.installation_id || "").trim().slice(0, 160)
  const deviceName = String(body.device_name || "ANGELCARE Desktop").trim().slice(0, 180)
  if (!installationId || installationId.length < 16) return fail("VALID_INSTALLATION_ID_REQUIRED")
  const { data: existing } = await context.supabase.from("whatsapp_desktop_devices").select("*").eq("installation_id", installationId).maybeSingle()
  if (existing && ["revoked", "compromised"].includes(existing.approval_status)) {
    await securityEvent(context.supabase, { severity: "critical", eventType: "blocked_device_reconnect", userId: context.userId, deviceId: existing.id, title: "Tentative de reconnexion d’un appareil bloqué", description: `Installation ${installationId} refusée.` })
    return fail(`DEVICE_${String(existing.approval_status).toUpperCase()}`, 403, { data: publicDevice(existing) })
  }
  const update = {
    installation_id: installationId,
    device_name: deviceName,
    platform: platformOf(body.platform),
    architecture: String(body.architecture || "").slice(0, 80) || null,
    desktop_version: String(body.desktop_version || "").slice(0, 80) || null,
    operating_system_version: String(body.operating_system_version || "").slice(0, 160) || null,
    registered_user_id: existing?.registered_user_id || context.userId,
    current_user_id: context.userId,
    last_seen_at: new Date().toISOString(),
    runtime_health: body.runtime_health && typeof body.runtime_health === "object" ? body.runtime_health : {},
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
  }
  const { data, error } = existing
    ? await context.supabase.from("whatsapp_desktop_devices").update(update).eq("id", existing.id).select("*").single()
    : await context.supabase.from("whatsapp_desktop_devices").insert(update).select("*").single()
  if (error) return fail(error.message, 400)
  await accessEvent(context.supabase, { eventType: existing ? "device_registered_again" : "device_registered", userId: context.userId, deviceId: data.id, outcome: data.approval_status, metadata: { platform: data.platform, desktop_version: data.desktop_version }, ip: context.ip, userAgent: context.userAgent })
  if (!existing) await securityEvent(context.supabase, { severity: "attention", eventType: "new_device_registered", userId: context.userId, deviceId: data.id, title: "Nouvel appareil ANGELCARE Desktop enregistré", description: `${data.device_name} attend une décision administrateur.` })
  return ok(publicDevice(data), { status: existing ? 200 : 201 })
}
