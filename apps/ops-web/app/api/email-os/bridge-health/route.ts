import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeBridgeUrl(value: unknown) {
  return clean(value).replace(/\/+$/, "")
}

function getBridgeUrlHost(bridgeUrl: string) {
  if (!bridgeUrl) return ""
  try {
    return new URL(bridgeUrl).host
  } catch {
    return ""
  }
}

function safePreview(input: unknown, maxLength = 260) {
  if (input === null || input === undefined) return ""

  const redactText = (text: string) =>
    text
      .replace(/(["']?(?:password|pass|token|secret|authorization|cookie|smtpPass|smtpPassword)["']?\s*[:=]\s*)(["']?)([^"'\n\r,}]+)\2/gi, "$1***REDACTED***")
      .replace(/(smtpPass\s*[:=]\s*)([^,\s}]+)/gi, "$1***REDACTED***")

  const raw = typeof input === "string" ? input : JSON.stringify(input)
  const text = redactText(raw || "")
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

function readBridgeEnv() {
  const bridgeUrl = normalizeBridgeUrl(process.env.EMAIL_OS_BRIDGE_URL)
  const bridgeToken = clean(process.env.EMAIL_OS_BRIDGE_TOKEN)
  const forceBridge = String(process.env.EMAIL_OS_FORCE_BRIDGE || "").toLowerCase() === "true"

  return {
    bridgeUrl,
    bridgeToken,
    forceBridge,
    hasBridgeUrl: Boolean(bridgeUrl),
    hasBridgeToken: Boolean(bridgeToken),
    bridgeUrlHost: getBridgeUrlHost(bridgeUrl)
  }
}

export async function GET() {
  const config = readBridgeEnv()

  if (!config.hasBridgeUrl || !config.bridgeUrl.startsWith("http://") && !config.bridgeUrl.startsWith("https://")) {
    return NextResponse.json(
      {
        ok: false,
        error: "EMAIL_OS_BRIDGE_URL is missing or invalid.",
        bridgeFetchFailed: true,
        bridgeUrlHost: config.bridgeUrlHost,
        bridgeEndpointPath: "/health",
        forceBridge: config.forceBridge,
        hasBridgeUrl: config.hasBridgeUrl,
        hasBridgeToken: config.hasBridgeToken,
        errorName: "EmailOSBridgeConfigError",
        errorMessage: "EMAIL_OS_BRIDGE_URL must be configured and start with http:// or https://."
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    )
  }

  let response: Response
  try {
    response = await fetch(`${config.bridgeUrl}/health`, {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json"
      }
    })
  } catch (error) {
    const cause = error instanceof Error ? (error as any).cause : null
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Bridge health fetch failed",
        bridgeFetchFailed: true,
        bridgeUrlHost: config.bridgeUrlHost,
        bridgeEndpointPath: "/health",
        forceBridge: config.forceBridge,
        hasBridgeUrl: config.hasBridgeUrl,
        hasBridgeToken: config.hasBridgeToken,
        errorName: error instanceof Error ? error.name : "Error",
        errorMessage: error instanceof Error ? error.message : String(error || "Bridge health fetch failed"),
        errorCauseCode: cause && typeof cause === "object" ? clean((cause as { code?: unknown }).code) || undefined : undefined,
        errorCauseMessage: cause && typeof cause === "object" ? clean((cause as { message?: unknown }).message) || undefined : undefined
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    )
  }

  const responseText = await response.text().catch(() => "")
  const payload = responseText ? (() => {
    try {
      return JSON.parse(responseText)
    } catch {
      return null
    }
  })() : null

  const bridgeHealth = {
    reachable: response.ok,
    status: response.status,
    ok: Boolean(payload?.ok),
    time: typeof payload?.data?.time === "string" ? payload.data.time : null,
    uptimeSeconds: typeof payload?.data?.uptimeSeconds === "number" ? payload.data.uptimeSeconds : null,
    publicPurpose: typeof payload?.data?.publicPurpose === "string" ? payload.data.publicPurpose : null,
    publicDomain: typeof payload?.data?.publicDomain === "string" ? payload.data.publicDomain : null,
    serviceName: typeof payload?.data?.serviceName === "string" ? payload.data.serviceName : null,
    version: typeof payload?.data?.version === "string" ? payload.data.version : null,
    processId: typeof payload?.data?.processId === "number" ? payload.data.processId : null
  }

  if (!response.ok || payload?.ok === false) {
    return NextResponse.json(
      {
        ok: false,
        error: payload?.error || `Bridge health failed with HTTP ${response.status}`,
        bridgeFetchFailed: true,
        bridgeUrlHost: config.bridgeUrlHost,
        bridgeEndpointPath: "/health",
        forceBridge: config.forceBridge,
        hasBridgeUrl: config.hasBridgeUrl,
        hasBridgeToken: config.hasBridgeToken,
        bridgeResponseStatus: response.status,
        bridgeResponseBodyPreview: safePreview(payload ?? responseText),
        bridgeHealth
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        bridgeUrlHost: config.bridgeUrlHost,
        bridgeEndpointPath: "/health",
        forceBridge: config.forceBridge,
        hasBridgeUrl: config.hasBridgeUrl,
        hasBridgeToken: config.hasBridgeToken,
        bridgeHealth
      }
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
