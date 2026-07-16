import { NextResponse } from "next/server"
import { auditWindowsNodeEvent, getWindowsNodeRequestIp, requireWindowsNodeAdmin } from "@/app/api/opsos/windows-node/_shared"
import { buildWindowsNodeApiErrorResponse, callWindowsBridgeAdmin } from "@/lib/opsos/windows-node"
import type {
  MaintenanceModeState,
  WindowsBackupStatus,
  WindowsNodeActionRequest,
  WindowsNodeActionResult,
  WindowsNodeStatus,
  WindowsNetworkDiagnostic,
  WindowsSmtpDiagnostic,
} from "@/lib/opsos/windows-node-types"

export const dynamic = "force-dynamic"

type StepResult = { name: string; ok: boolean; summary: string }

async function runStatus(request: Request, operator: string) {
  return callWindowsBridgeAdmin<WindowsNodeStatus>("/admin/status", {}, { operator, requestIp: getWindowsNodeRequestIp(request) })
}

async function runNetwork(request: Request, operator: string) {
  return callWindowsBridgeAdmin<WindowsNetworkDiagnostic>("/admin/test/network", {
    method: "POST",
    body: JSON.stringify({ reason: "Run network diagnostic" }),
  }, { operator, requestIp: getWindowsNodeRequestIp(request) })
}

async function runSmtp(request: Request, operator: string) {
  return callWindowsBridgeAdmin<WindowsSmtpDiagnostic>("/admin/test/smtp", {
    method: "POST",
    body: JSON.stringify({ reason: "Validate SMTP connectivity" }),
  }, { operator, requestIp: getWindowsNodeRequestIp(request) })
}

async function runBackupStatus(request: Request, operator: string) {
  return callWindowsBridgeAdmin<WindowsBackupStatus>("/admin/backup/status", {}, { operator, requestIp: getWindowsNodeRequestIp(request) })
}

async function runMaintenanceStatus(request: Request, operator: string) {
  return callWindowsBridgeAdmin<MaintenanceModeState>("/admin/maintenance/status", {}, { operator, requestIp: getWindowsNodeRequestIp(request) })
}

export async function POST(request: Request) {
  const auth = await requireWindowsNodeAdmin(request)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => ({}))) as Partial<WindowsNodeActionRequest> & Record<string, unknown>
  const action = String(body.action || "").trim().toLowerCase()
  const reason = String(body.reason || body.message || "").trim()
  const target = String(body.target || body.serviceName || "").trim()
  const toEmail = String(body.toEmail || "").trim()
  const subject = String(body.subject || "").trim()
  const text = String(body.text || "").trim()
  const duration = String(body.duration || "").trim()
  const confirmation = String(body.confirmationText || body.confirmation || "").trim()
  const started = Date.now()
  const requiresReason = new Set([
    "restart_bridge",
    "start_bridge",
    "stop_bridge",
    "restart_caddy",
    "start_caddy",
    "stop_caddy",
    "proof_send",
    "backup_create",
    "maintenance_enable",
    "maintenance_disable",
    "maintenance_extend",
    "system_restart",
    "system_shutdown",
  ])

  if (!action) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ActionRequired",
      errorMessage: "Action is required",
      causeCode: "ACTION_REQUIRED",
      endpointPath: "/admin/action",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  if (requiresReason.has(action) && !reason) {
    return NextResponse.json(buildWindowsNodeApiErrorResponse({
      status: 400,
      errorName: "ReasonRequired",
      errorMessage: "Reason is required",
      causeCode: "REASON_REQUIRED",
      endpointPath: "/admin/action",
    }), { status: 400, headers: { "cache-control": "no-store" } })
  }

  const steps: StepResult[] = []
  let resultData: Record<string, unknown> = {}

  const pushStep = (name: string, ok: boolean, summary: string) => {
    steps.push({ name, ok, summary })
  }

  const bridgeOperator = auth.context.operator

  const addBridgeStep = async <T>(name: string, endpointPath: string, options: RequestInit = {}) => {
    const result = await callWindowsBridgeAdmin<T>(endpointPath, options, {
      operator: bridgeOperator,
      requestIp: getWindowsNodeRequestIp(request),
    })
    if (!result.ok) {
      pushStep(name, false, result.errorMessage)
      return result
    }
    pushStep(name, true, "ok")
    return result
  }

  switch (action) {
    case "refresh_status": {
      const status = await runStatus(request, bridgeOperator)
      if (!status.ok) {
        return NextResponse.json(status, { status: status.status, headers: { "cache-control": "no-store" } })
      }
      resultData = { status: status.data }
      pushStep("status", true, "refreshed")
      break
    }
    case "full_diagnostic": {
      const [status, network, smtp, backups, maintenance] = await Promise.all([
        runStatus(request, bridgeOperator),
        runNetwork(request, bridgeOperator),
        runSmtp(request, bridgeOperator),
        runBackupStatus(request, bridgeOperator),
        runMaintenanceStatus(request, bridgeOperator),
      ])

      const aggregates = [status, network, smtp, backups, maintenance]
      const mapName = ["status", "network", "smtp", "backups", "maintenance"]
      aggregates.forEach((item, index) => {
        if (item.ok) {
          pushStep(mapName[index], true, "ok")
        } else {
          pushStep(mapName[index], false, item.errorMessage)
        }
      })
      resultData = {
        status: status.ok ? status.data : null,
        network: network.ok ? network.data : null,
        smtp: smtp.ok ? smtp.data : null,
        backups: backups.ok ? backups.data : null,
        maintenance: maintenance.ok ? maintenance.data : null,
      }
      break
    }
    case "restart_bridge":
    case "start_bridge":
    case "stop_bridge":
    case "restart_caddy":
    case "start_caddy":
    case "stop_caddy": {
      const serviceName = action.includes("bridge") ? "angelcare-email-bridge" : "angelcare-caddy"
      const serviceAction = action.startsWith("restart") ? "restart" : action.startsWith("start") ? "start" : "stop"
      const confirmationText = confirmation || "CONFIRM SERVICE ACTION"
      const result = await addBridgeStep<WindowsNodeActionResult>(
        "service",
        `/admin/service/${serviceAction}`,
        {
          method: "POST",
          body: JSON.stringify({ service: serviceName, confirmation: confirmationText, reason }),
        }
      )
      if (!result.ok) {
        return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      }
      resultData = result.data as unknown as Record<string, unknown>
      break
    }
    case "validate_caddy":
    case "reload_caddy": {
      const endpointPath = action === "validate_caddy" ? "/admin/caddy/validate" : "/admin/caddy/reload"
      const result = await addBridgeStep<Record<string, unknown>>("caddy", endpointPath, {
        method: "POST",
        body: JSON.stringify({ reason: reason || action }),
      })
      if (!result.ok) {
        return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      }
      resultData = result.data
      break
    }
    case "network_diagnostic": {
      const result = await runNetwork(request, bridgeOperator)
      if (!result.ok) return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      resultData = result.data as unknown as Record<string, unknown>
      break
    }
    case "smtp_test": {
      const result = await runSmtp(request, bridgeOperator)
      if (!result.ok) return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      resultData = result.data as unknown as Record<string, unknown>
      break
    }
    case "proof_send": {
      const result = await addBridgeStep<Record<string, unknown>>("proof-send", "/admin/test/send", {
        method: "POST",
        body: JSON.stringify({ toEmail, subject, text, reason }),
      })
      if (!result.ok) {
        return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      }
      resultData = result.data
      break
    }
    case "backup_create": {
      const result = await addBridgeStep<Record<string, unknown>>("backup", "/admin/backup/create", {
        method: "POST",
        body: JSON.stringify({ reason }),
      })
      if (!result.ok) {
        return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      }
      resultData = result.data
      break
    }
    case "maintenance_enable":
    case "maintenance_disable":
    case "maintenance_extend": {
      const endpointPath = action === "maintenance_enable"
        ? "/admin/maintenance/enable"
        : action === "maintenance_disable"
          ? "/admin/maintenance/disable"
          : "/admin/maintenance/extend"
      const result = await addBridgeStep<MaintenanceModeState>("maintenance", endpointPath, {
        method: "POST",
        body: JSON.stringify({ reason, expectedDuration: duration, message: reason }),
      })
      if (!result.ok) {
        return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      }
      resultData = result.data as unknown as Record<string, unknown>
      break
    }
    case "system_restart":
    case "system_shutdown":
    case "cancel_shutdown": {
      const endpointPath = action === "system_restart"
        ? "/admin/system/restart"
        : action === "system_shutdown"
          ? "/admin/system/shutdown"
          : "/admin/system/cancel-shutdown"
      const payload = action === "cancel_shutdown"
        ? {}
        : { confirmation: confirmation || "CONFIRM SERVER RESTART", reason }
      const result = await addBridgeStep<Record<string, unknown>>("system", endpointPath, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (!result.ok) {
        return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      }
      resultData = result.data
      break
    }
    case "duckdns_status": {
      const result = await addBridgeStep<Record<string, unknown>>("duckdns", "/admin/duckdns/status", { method: "GET" })
      if (!result.ok) {
        return NextResponse.json(result, { status: result.status, headers: { "cache-control": "no-store" } })
      }
      resultData = result.data
      break
    }
    default: {
      return NextResponse.json(buildWindowsNodeApiErrorResponse({
        status: 400,
        errorName: "ActionUnsupported",
        errorMessage: "Unsupported action",
        causeCode: "ACTION_UNSUPPORTED",
        endpointPath: "/admin/action",
      }), { status: 400, headers: { "cache-control": "no-store" } })
    }
  }

  const payload: WindowsNodeActionResult = {
    ok: true,
    action,
    target,
    status: "healthy",
    message: `Action ${action} completed`,
    durationMs: Date.now() - started,
    timestamp: new Date().toISOString(),
    data: {
      reason,
      target,
      steps,
      result: resultData,
    },
  }

  await auditWindowsNodeEvent({
    timestamp: new Date().toISOString(),
    actor: auth.context.operator,
    action: `windows_node_action_${action}`,
    target: target || "/opsos/infrastructure/windows-node",
    result: "ok",
    reason: reason || action,
    severity: action.includes("shutdown") ? "high" : action.includes("restart") || action.includes("backup") ? "medium" : "info",
    metadataSummary: `steps=${steps.length} durationMs=${payload.durationMs}`,
  })

  return NextResponse.json({ ok: true, data: payload }, { headers: { "cache-control": "no-store" } })
}
