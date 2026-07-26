import { NextRequest } from "next/server"
import { fail, ok, parseBody, stationAdminContext } from "@/lib/desktop-stations/server"
import { MINIMUM_SAFE_LOCKED_DESKTOP_VERSION, lockedModeCertified } from "@/lib/desktop-stations/lock-safety"

export async function GET(request: NextRequest) {
  const context = await stationAdminContext(request)
  if ("error" in context) return context.error
  const { data, error } = await context.supabase.from("desktop_station_policy_assignments").select("*,policy:desktop_station_policies(*)").order("precedence", { ascending: false })
  if (error) return fail(error.message, 500)
  return ok(data || [])
}

export async function POST(request: NextRequest) {
  const context = await stationAdminContext(request)
  if ("error" in context) return context.error
  const body = await parseBody(request)
  const type = String(body.target_type || "")
  if (!["device", "installation", "user", "department", "workspace", "fleet"].includes(type) || !body.policy_id) return fail("VALID_POLICY_ASSIGNMENT_REQUIRED")

  const { data: policy, error: policyError } = await context.supabase.from("desktop_station_policies").select("*").eq("id", body.policy_id).maybeSingle()
  if (policyError) return fail(policyError.message, 500)
  if (!policy) return fail("POLICY_NOT_FOUND", 404)

  if (policy.mode === "locked" && type === "device") {
    const { data: device, error: deviceError } = await context.supabase.from("whatsapp_desktop_devices").select("id,device_name,desktop_version").eq("id", String(body.target_id || "")).maybeSingle()
    if (deviceError) return fail(deviceError.message, 500)
    if (!device) return fail("DEVICE_NOT_FOUND", 404)
    if (!lockedModeCertified(device) && body.unsafe_override !== true) {
      return fail("LOCKED_MODE_CLIENT_NOT_CERTIFIED", 409, {
        device_id: device.id,
        device_name: device.device_name,
        desktop_version: device.desktop_version,
        minimum_safe_version: MINIMUM_SAFE_LOCKED_DESKTOP_VERSION,
        resolution: "KEEP_STANDARD_OR_INSTALL_UNLOCK_HOTFIX",
      })
    }
  }

  const targetId = type === "fleet" ? "fleet" : String(body.target_id || "")
  if (!targetId) return fail("TARGET_ID_REQUIRED")
  const { data, error } = await context.supabase.from("desktop_station_policy_assignments").upsert({
    policy_id: body.policy_id,
    target_type: type,
    target_id: targetId,
    precedence: Number(body.precedence || ({ device: 600, installation: 550, user: 500, department: 350, workspace: 300, fleet: 100 } as Record<string, number>)[type]),
    active: body.active !== false,
    assigned_by: context.userId,
  }, { onConflict: "target_type,target_id" }).select("*").single()
  if (error) return fail(error.message, 400)
  return ok(data, { status: 201 })
}
