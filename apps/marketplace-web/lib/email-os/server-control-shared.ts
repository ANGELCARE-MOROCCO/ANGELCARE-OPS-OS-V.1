export type ServerControlAction =
  | "restart_bridge"
  | "restart_caddy"
  | "validate_caddy"
  | "refresh_duckdns"
  | "smtp_test"
  | "send_test"
  | "reboot_server"
  | "shutdown_server"
  | "cancel_shutdown"
  | "network_test"

export type ServerControlServiceName = "angelcare-email-bridge" | "angelcare-caddy"
export type ServerControlLogType = "bridge" | "bridge-error" | "caddy" | "caddy-error" | "audit"

export function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

