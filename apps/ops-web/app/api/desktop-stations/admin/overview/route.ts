import { NextRequest } from "next/server"
import { ANGELCARE_DESKTOP_RELEASE, compareDesktopVersions } from "@/lib/desktop/release"
import { fail, ok, stationAdminContext } from "@/lib/desktop-stations/server"

export async function GET(request: NextRequest) {
  const context = await stationAdminContext(request)
  if ("error" in context) return context.error

  const [devices, policies, browserPolicies, assignments, commands, events, templates, attempts] = await Promise.all([
    context.supabase.from("whatsapp_desktop_devices").select("*"),
    context.supabase.from("desktop_station_policies").select("*"),
    context.supabase.from("desktop_station_browser_policies").select("*"),
    context.supabase.from("desktop_station_policy_assignments").select("*"),
    context.supabase.from("desktop_station_commands").select("*").order("issued_at", { ascending: false }).limit(200),
    context.supabase.from("desktop_station_events").select("*").order("created_at", { ascending: false }).limit(200),
    context.supabase.from("desktop_station_tab_templates").select("*").order("position", { ascending: true }),
    context.supabase.from("desktop_station_unlock_attempts").select("*").order("created_at", { ascending: false }).limit(100),
  ])

  for (const result of [devices, policies, browserPolicies, assignments, commands, events, templates, attempts]) {
    if (result.error) return fail(result.error.message, 500)
  }

  const deviceRows = devices.data || []
  const now = Date.now()
  const online = deviceRows.filter((device: any) =>
    device.last_heartbeat_at && now - new Date(device.last_heartbeat_at).getTime() < 180_000,
  )

  return ok({
    release: ANGELCARE_DESKTOP_RELEASE,
    counts: {
      total_stations: deviceRows.length,
      online_stations: online.length,
      locked_stations: online.filter((device: any) => device.station_mode === "locked").length,
      focus_stations: online.filter((device: any) => device.station_mode === "focus").length,
      standard_stations: online.filter((device: any) => !device.station_mode || device.station_mode === "standard").length,
      policy_refresh_required: deviceRows.filter((device: any) => !device.station_policy_synced_at).length,
      old_versions: deviceRows.filter((device: any) =>
        device.desktop_version && compareDesktopVersions(device.desktop_version, ANGELCARE_DESKTOP_RELEASE.version) < 0,
      ).length,
      future_versions: deviceRows.filter((device: any) =>
        device.desktop_version && compareDesktopVersions(device.desktop_version, ANGELCARE_DESKTOP_RELEASE.version) > 0,
      ).length,
      open_security_events: (events.data || []).filter((event: any) =>
        ["high", "critical"].includes(event.severity) && !event.resolved_at,
      ).length,
      browser_violations: (events.data || []).filter((event: any) =>
        ["blocked_navigation", "browser_policy_violation"].includes(event.event_type),
      ).length,
    },
    devices: deviceRows,
    policies: policies.data || [],
    browser_policies: browserPolicies.data || [],
    assignments: assignments.data || [],
    commands: commands.data || [],
    events: events.data || [],
    tab_templates: templates.data || [],
    unlock_attempts: attempts.data || [],
  })
}
