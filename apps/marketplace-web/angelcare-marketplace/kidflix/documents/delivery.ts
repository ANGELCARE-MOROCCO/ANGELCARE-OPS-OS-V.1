import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getDetail } from "../detail/service";
import { readyOutputs } from "../detail/model";
import { publicHost } from "../server";
import { isLocale, type Locale } from "../catalogue";
import { takeBudget } from "./server";
import { createMarketplaceMediaDeliveryUrl } from "../../commerce-studio/media-storage";
export const MAX_DOCUMENT_BYTES = 64 * 1024 * 1024;
export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 &&
        (b === 168 ||
          (b === 0 && (c === 0 || c === 2)) ||
          (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  // Only global-unicast IPv6. Mapped, loopback, local, link-local and multicast addresses fail closed.
  address =
    isIP(address) === 6
      ? new URL(`https://[${address}]/`).hostname.slice(1, -1)
      : address;
  return (
    isIP(address) === 6 &&
    /^[23][0-9a-f]{3}:/i.test(address) &&
    !/^(?:2002:|3fff:|2001:(?:0:|2:|db8:|1[0-9a-f]:|2[0-9a-f]:))/i.test(address)
  );
}
export async function fetchDocumentBinary(
  raw: string,
  mime: string,
  deadline = Date.now() + 25000,
  redirects = 0,
): Promise<Uint8Array> {
  const u = new URL(raw);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443") ||
    redirects > 4
  )
    throw Error("UNSAFE_DOCUMENT_ORIGIN");
  const hostname = u.hostname.replace(/^\[|\]$/g, "");
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await Promise.race([
        lookup(hostname, { all: true, verbatim: true }),
        new Promise<never>((_, reject) => {
          dnsTimer = setTimeout(
            () => reject(Error("DOCUMENT_TIMEOUT")),
            Math.max(1, deadline - Date.now()),
          );
        }),
      ]).finally(() => clearTimeout(dnsTimer));
  if (!addresses.length || addresses.some((x) => !publicAddress(x.address)))
    throw Error("UNSAFE_DOCUMENT_ORIGIN");
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw Error("DOCUMENT_TIMEOUT");
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (error?: Error, data?: Uint8Array) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(data!);
    };
    const req = httpsRequest(
      u,
      {
        method: "GET",
        headers: { Accept: mime, "Accept-Encoding": "identity" },
        lookup: ((_name: any, options: any, callback: any) => {
          const pool = addresses.filter(
            (x) => !options.family || x.family === options.family,
          );
          if (!pool.length) {
            callback(Error("ADDRESS_UNAVAILABLE"));
            return;
          }
          if (options.all) callback(null, pool);
          else callback(null, pool[0].address, pool[0].family);
        }) as any,
      },
      (res) => {
        if (
          [301, 302, 303, 307, 308].includes(res.statusCode || 0) &&
          res.headers.location
        ) {
          res.destroy();
          clearTimeout(timer);
          settled = true;
          fetchDocumentBinary(
            new URL(res.headers.location, u).href,
            mime,
            deadline,
            redirects + 1,
          ).then(resolve, reject);
          return;
        }
        const type = (res.headers["content-type"] || "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        if (
          res.statusCode !== 200 ||
          !["application/octet-stream", mime].includes(type) ||
          Number(res.headers["content-length"] || 0) > MAX_DOCUMENT_BYTES
        ) {
          res.destroy();
          done(Error("DOCUMENT_UNAVAILABLE"));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_DOCUMENT_BYTES) {
            res.destroy();
            done(Error("DOCUMENT_TOO_LARGE"));
          } else chunks.push(chunk);
        });
        res.on("error", (e) => done(e));
        res.on("aborted", () => done(Error("DOCUMENT_INTERRUPTED")));
        res.on("end", () => {
          const bytes = Buffer.concat(chunks);
          if (
            !bytes.length ||
            (mime === "application/pdf" &&
              bytes.subarray(0, 5).toString() !== "%PDF-") ||
            (mime === "image/png" &&
              !bytes
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
          ) {
            done(Error("DOCUMENT_TYPE_MISMATCH"));
            return;
          }
          done(undefined, new Uint8Array(bytes));
        });
      },
    );
    const timer = setTimeout(() => {
      req.destroy();
      done(Error("DOCUMENT_TIMEOUT"));
    }, remaining);
    req.on("error", (e) => done(e));
    req.end();
  });
}
/** A native media gateway URL is freshly signed on the server, never cached in a release. */
export async function fetchPublishedDocumentBinary(
  assetId: string, rawUrl: string, mime: string, host: string,
): Promise<Uint8Array> {
  const db = await createServiceClient();
  const result = await db.from("angelcare_marketplace_media_assets").select("*").eq("id", assetId).maybeSingle();
  const row = result.data;
  if (result.error || !row || row.status !== "active" || row.mime_type !== mime ||
      row.metadata?.status === "failed" ||
      (row.rights_expires_at && Date.parse(row.rights_expires_at) <= Date.now()) ||
      (row.public_url || row.desktop_url) !== rawUrl) throw Error("PUBLISHED_MEDIA_CHANGED");
  if (row.storage_bucket !== "marketplace-windows-media")
    return fetchDocumentBinary(new URL(rawUrl, "https://" + host).href, mime);

  // This URL is generated from a configured, trusted gateway and a known published
  // UUID; it is not a user-supplied SSRF destination. Redirects are disallowed.
  const url = createMarketplaceMediaDeliveryUrl(assetId, 90_000);
  const configured = process.env.MARKETPLACE_MEDIA_GATEWAY_PUBLIC_URL || "";
  if (!configured || new URL(url).origin !== new URL(configured).origin)
    throw Error("MEDIA_GATEWAY_CONFIG_INVALID");
  const response = await fetch(url, {
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(25_000),
    headers: { Accept: mime, "Accept-Encoding": "identity" },
  });
  const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!response.ok || !response.body || ![mime, "application/octet-stream"].includes(contentType) ||
      Number(response.headers.get("content-length") || "0") > MAX_DOCUMENT_BYTES)
    throw Error("MEDIA_GATEWAY_DELIVERY_FAILED");
  const parts: Uint8Array[] = [];
  let bytesRead = 0;
  for await (const chunk of response.body as any) {
    const bytes = new Uint8Array(chunk);
    bytesRead += bytes.length;
    if (bytesRead > MAX_DOCUMENT_BYTES) {
      await response.body.cancel().catch(() => {});
      throw Error("DOCUMENT_TOO_LARGE");
    }
    parts.push(bytes);
  }
  const output = new Uint8Array(bytesRead);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  const starts = (...seq: number[]) => seq.every((b, i) => output[i] === b);
  const valid = mime === "application/pdf" ? starts(37,80,68,70,45) :
    mime === "image/png" ? starts(137,80,78,71,13,10,26,10) :
    mime === "image/jpeg" ? starts(255,216,255) :
    mime === "image/webp" ? output.length >= 12 &&
      String.fromCharCode(...output.subarray(0,4)) === "RIFF" &&
      String.fromCharCode(...output.subarray(8,12)) === "WEBP" :
    mime === "image/avif" ? output.length >= 12 &&
      String.fromCharCode(...output.subarray(4,8)) === "ftyp" : false;
  if (!valid || bytesRead === 0) throw Error("DOCUMENT_TYPE_MISMATCH");
  return output;
}

export async function downloadDocument(request: Request): Promise<Response> {
  const u = new URL(request.url),
    locale = u.searchParams.get("locale") || "",
    key = u.searchParams.get("key") || "",
    output = u.searchParams.get("output") || "",
    release = u.searchParams.get("release") || "";
  if (
    !isLocale(locale) ||
    !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(key) ||
    !output ||
    output.length > 120 ||
    !/^[a-f0-9-]{36}$/i.test(release) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw Error("INVALID_DOWNLOAD");
  const host = publicHost(request.headers.get("host") || u.host);
  await takeBudget(request, host, locale, "delivery");
  const value = await getDetail(host, locale, key);
  if (
    !value ||
    value.releaseId !== release ||
    value.manifest.family !== "documents"
  )
    throw Error("STALE_DOWNLOAD");
  const ready = readyOutputs(value.manifest).filter((o) => o.id === output);
  if (ready.length !== 1) throw Error("OUTPUT_UNAVAILABLE");
  const selected = ready[0],
    asset = selected.asset;
  if (!asset?.url || !["application/pdf", "image/png"].includes(selected.mime))
    throw Error("OUTPUT_UNAVAILABLE");
  const bytes = await fetchDocumentBinary(new URL(asset.url, "https://" + host).href, selected.mime);
  const current = await getDetail(host, locale, key);
  const confirmed =
    current && current.releaseId === release
      ? readyOutputs(current.manifest).filter(
          (o) =>
            o.id === output &&
            o.asset?.url === asset.url &&
            o.mime === selected.mime,
        )
      : [];
  if (confirmed.length !== 1) throw Error("STALE_DOWNLOAD");
  const db = await createServiceClient(),
    recorded = await db.rpc("ac_kidflix_documents_delivery", {
      p_host: host,
      p_locale: locale,
      p_key: key,
      p_release: release,
      p_receipt: randomUUID(),
    });
  if (recorded.error || recorded.data !== true) throw Error("STALE_DOWNLOAD");
  const extension = selected.mime === "application/pdf" ? ".pdf" : ".png",
    filename =
      (value.manifest.title || key)
        .replace(/[\u0000-\u001f\u007f/\\]/g, " ")
        .trim()
        .slice(0, 150) + extension;
  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": selected.mime,
      "Content-Length": String(bytes.length),
      "Content-Disposition":
        "attachment; filename*=UTF-8''" + encodeURIComponent(filename),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      "Content-Security-Policy": "sandbox; default-src 'none'",
    },
  });
}
