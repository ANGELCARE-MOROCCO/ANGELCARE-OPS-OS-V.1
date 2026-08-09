import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

const MAX_PROXY_BYTES = 80 * 1024 * 1024
const MAX_HTML_BYTES = 1024 * 1024

function isPrivateAddress(address: string) {
  if (address === "::1" || address === "0.0.0.0" || address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true
  if (address.startsWith("127.") || address.startsWith("10.") || address.startsWith("192.168.")) return true
  const match = address.match(/^172\.(\d+)\./)
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31)
}

export async function assertSafeMediaUrl(raw: string) {
  const url = new URL(raw)
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("MEDIA_URL_PROTOCOL_NOT_ALLOWED")
  if (url.username || url.password) throw new Error("MEDIA_URL_CREDENTIALS_NOT_ALLOWED")
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("MEDIA_URL_PORT_NOT_ALLOWED")
  const host = url.hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("MEDIA_URL_HOST_NOT_ALLOWED")
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new Error("MEDIA_URL_PRIVATE_ADDRESS_BLOCKED")
  } else {
    const addresses = await lookup(host, { all: true, verbatim: true })
    if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) throw new Error("MEDIA_URL_PRIVATE_ADDRESS_BLOCKED")
  }
  return url
}


async function safeFetch(raw: string, init: RequestInit, redirects = 0): Promise<Response> {
  if (redirects > 4) throw new Error("MEDIA_REDIRECT_LIMIT_EXCEEDED")
  const safeUrl = await assertSafeMediaUrl(raw)
  const response = await fetch(safeUrl, { ...init, redirect: "manual" })
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location")
    if (!location) throw new Error("MEDIA_REDIRECT_LOCATION_MISSING")
    const next = new URL(location, safeUrl).toString()
    return safeFetch(next, init, redirects + 1)
  }
  return response
}
function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim()
}
function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decode(match[1])
  }
  return ""
}
function absolute(value: string, base: URL) {
  if (!value) return ""
  try { return new URL(value, base).toString() } catch { return "" }
}
function title(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match?.[1] ? decode(match[1].replace(/\s+/g, " ")) : ""
}

export async function fetchExternalMediaMetadata(raw: string) {
  const requested = await assertSafeMediaUrl(raw)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await safeFetch(requested.toString(), {
      cache: "no-store",
      signal: controller.signal,
      headers: { accept: "text/html,application/xhtml+xml,image/*,application/pdf;q=.8,*/*;q=.5", "user-agent": "AngelCare-ContentCommand-Preview/1.0" },
    })
    if (!response.ok) throw new Error(`MEDIA_METADATA_FETCH_FAILED_${response.status}`)
    const finalUrl = await assertSafeMediaUrl(response.url || requested.toString())
    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const contentLength = Number(response.headers.get("content-length") || 0)
    if (contentLength > MAX_HTML_BYTES && contentType.includes("text/html")) throw new Error("MEDIA_METADATA_HTML_TOO_LARGE")
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      return { title: finalUrl.pathname.split("/").pop() || finalUrl.hostname, description: "", image: contentType.startsWith("image/") ? finalUrl.toString() : "", favicon: `${finalUrl.origin}/favicon.ico`, finalUrl: finalUrl.toString(), contentType }
    }
    const html = (await response.text()).slice(0, MAX_HTML_BYTES)
    return {
      title: meta(html, "og:title") || meta(html, "twitter:title") || title(html) || finalUrl.hostname,
      description: meta(html, "og:description") || meta(html, "twitter:description") || meta(html, "description"),
      image: absolute(meta(html, "og:image") || meta(html, "twitter:image") || meta(html, "twitter:image:src"), finalUrl),
      favicon: absolute((html.match(/<link[^>]+rel=["'][^"']*(?:icon|shortcut icon)[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1] || ""), finalUrl) || `${finalUrl.origin}/favicon.ico`,
      finalUrl: finalUrl.toString(),
      contentType,
    }
  } finally { clearTimeout(timeout) }
}

export async function proxyExternalMedia(raw: string, range?: string | null) {
  const requested = await assertSafeMediaUrl(raw)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const headers: Record<string, string> = { accept: "image/*,application/pdf,video/*,audio/*,*/*;q=.6", "user-agent": "AngelCare-ContentCommand-Preview/1.0" }
    if (range) headers.range = range
    const response = await safeFetch(requested.toString(), { cache: "no-store", signal: controller.signal, headers })
    if (!response.ok && response.status !== 206) throw new Error(`MEDIA_PROXY_FETCH_FAILED_${response.status}`)
    await assertSafeMediaUrl(response.url || requested.toString())
    const contentLength = Number(response.headers.get("content-length") || 0)
    if (contentLength > MAX_PROXY_BYTES) throw new Error("MEDIA_PROXY_FILE_TOO_LARGE")
    const outputHeaders = new Headers()
    for (const key of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      const value = response.headers.get(key)
      if (value) outputHeaders.set(key, value)
    }
    outputHeaders.set("cache-control", "private, max-age=300")
    outputHeaders.set("content-disposition", "inline")
    outputHeaders.set("x-content-type-options", "nosniff")
    return { status: response.status, headers: outputHeaders, body: response.body }
  } finally { clearTimeout(timeout) }
}
