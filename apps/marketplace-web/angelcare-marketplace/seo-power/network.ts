import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import type {
  BaseHttpClient,
  HttpRequest,
  HttpResponse,
  ResponseTypes,
  StreamingHttpResponse,
} from "@crawlee/core";
import { SeoFault, canonicalOrigin } from "./model";

export const USER_AGENT =
  "AngelCareSEOPower/1.0 (+https://my.angelcarehub.com)";
function stable(value:unknown):unknown {if(value instanceof Date)return value.toISOString();if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable((value as Record<string,unknown>)[key])]));return value;}
export function hash(value: unknown) {return createHash('sha256').update(typeof value==='string'?value:JSON.stringify(stable(value))).digest('hex');}
export function publicAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const a = ip.split(".").map(Number);
    return !(
      a[0] === 0 ||
      a[0] === 10 ||
      a[0] === 127 ||
      a[0] >= 224 ||
      (a[0] === 169 && a[1] === 254) ||
      (a[0] === 172 && a[1] >= 16 && a[1] <= 31) ||
      (a[0] === 192 && (a[1] === 168 || a[1] === 0)) ||
      (a[0] === 100 && a[1] >= 64 && a[1] <= 127) ||
      (a[0] === 198 && (a[1] === 18 || a[1] === 19 || a[1] === 51)) ||
      (a[0] === 203 && a[1] === 0 && a[2] === 113)
    );
  }
  if (isIP(ip) === 6)
    return (
      /^2[0-9a-f]{3}:/i.test(ip) &&
      !/^2001:(db8|0|10|2):/i.test(ip) &&
      !ip.includes(".")
    );
  return false;
}
export type Response = {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  body: Buffer;
  redirects: URL[];
};
export async function safeRead(
  url: URL,
  options: {
    origin: string;
    timeoutMs?: number;
    maxBytes?: number;
    method?: "GET" | "POST";
    body?: string;
    allowedPath?: (path: string) => void;
  },
): Promise<Response> {
  const origin = canonicalOrigin(options.origin),
    deadline = Date.now() + Math.min(options.timeoutMs || 8000, 12000),
    maxBytes = options.maxBytes || 3 * 1024 * 1024;
  async function once(target: URL, redirects: URL[]): Promise<Response> {
    if (
      target.origin !== origin ||
      target.username ||
      target.password ||
      target.hash ||
      target.search ||
      target.protocol !== "https:"
    )
      throw new SeoFault(
        "NETWORK_SCOPE",
        "Redirection ou URL hors du périmètre HTTPS autorisé.",
      );
    options.allowedPath?.(target.pathname);
    let dnsTimer: ReturnType<typeof setTimeout> | undefined;
    const addresses = await Promise.race([
      lookup(target.hostname, { all: true, verbatim: true }),
      new Promise<never>((_resolve, reject) => {
        dnsTimer = setTimeout(
          () => reject(new Error("DNS_TIMEOUT")),
          Math.max(1, deadline - Date.now()),
        );
      }),
    ]).finally(() => clearTimeout(dnsTimer));
    if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
      throw new SeoFault(
        "PRIVATE_ADDRESS",
        "Adresse réseau non publique refusée.",
      );
    const address = addresses[0],
      remaining = deadline - Date.now();
    if (remaining <= 0)
      throw new SeoFault("TIMEOUT", "Délai réseau dépassé.", 504);
    const response = await new Promise<Response>((resolve, reject) => {
      const req = httpsRequest(
        target,
        {
          method: options.method || "GET",
          servername: target.hostname,
          rejectUnauthorized: true,
          headers: {
            "User-Agent": USER_AGENT,
            Accept:
              "text/html,application/json,application/xml;q=0.8,*/*;q=0.1",
            "Accept-Encoding": "identity",
            ...(options.body
              ? {
                  "Content-Type": "application/json",
                  "Content-Length": String(Buffer.byteLength(options.body)),
                }
              : {}),
          },
          lookup: (_hostname, opts, cb) => {
            const callback = cb as unknown as (
              error: Error | null,
              address: unknown,
              family?: number,
            ) => void;
            if (opts.all) callback(null, [address]);
            else callback(null, address.address, address.family);
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          let size = 0;
          if (Number(res.headers["content-length"] || 0) > maxBytes) {
            res.destroy();
            req.destroy(new Error("RESPONSE_TOO_LARGE"));
            return;
          }
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes) {
              res.destroy();
              req.destroy(new Error("RESPONSE_TOO_LARGE"));
            } else chunks.push(Buffer.from(chunk));
          });
          res.on("error", reject);
          res.on("end", () =>
            resolve({
              url: target.href,
              statusCode: res.statusCode || 0,
              headers: Object.fromEntries(
                Object.entries(res.headers).map(([k, v]) => [
                  k,
                  Array.isArray(v) ? v.join(",") : String(v || ""),
                ]),
              ),
              body: Buffer.concat(chunks),
              redirects,
            }),
          );
        },
      );
      const timer = setTimeout(
        () => req.destroy(new Error("REQUEST_TIMEOUT")),
        remaining,
      );
      req.on("close", () => clearTimeout(timer));
      req.on("error", reject);
      if (options.body) req.write(options.body);
      req.end();
    });
    if (
      [301, 302, 303, 307, 308].includes(response.statusCode) &&
      response.headers.location
    ) {
      if (options.method === "POST" || redirects.length >= 3)
        throw new SeoFault(
          "REDIRECT_REFUSED",
          "Redirection de soumission ou chaîne trop longue refusée.",
        );
      return once(new URL(response.headers.location, target), [
        ...redirects,
        target,
      ]);
    }
    return response;
  }
  return once(url, []);
}
/** Crawlee uses its real Cheerio pipeline with a bounded, DNS-pinned HTTPS transport. */
export class SeoHttpClient implements BaseHttpClient {
  constructor(
    private origin: string,
    private allowedPath: (path: string) => void,
    private timeoutMs: number,
  ) {}
  private async read<T extends keyof ResponseTypes>(request: HttpRequest<T>) {
    return safeRead(new URL(String(request.url)), {
      origin: this.origin,
      allowedPath: this.allowedPath,
      timeoutMs: this.timeoutMs,
    });
  }
  async sendRequest<T extends keyof ResponseTypes = "text">(
    request: HttpRequest<T>,
  ): Promise<HttpResponse<T>> {
    const r = await this.read(request);
    const body =
      request.responseType === "buffer"
        ? r.body
        : request.responseType === "json"
          ? JSON.parse(r.body.toString("utf8"))
          : r.body.toString("utf8");
    return {
      request,
      body,
      url: r.url,
      statusCode: r.statusCode,
      headers: r.headers,
      trailers: {},
      complete: true,
      redirectUrls: r.redirects,
    } as HttpResponse<T>;
  }
  async stream(request: HttpRequest): Promise<StreamingHttpResponse> {
    const r = await this.read(request);
    return {
      request,
      url: r.url,
      statusCode: r.statusCode,
      headers: r.headers,
      trailers: {},
      complete: true,
      redirectUrls: r.redirects,
      stream: Readable.from(r.body),
      downloadProgress: {
        percent: 1,
        transferred: r.body.length,
        total: r.body.length,
      },
      uploadProgress: { percent: 1, transferred: 0, total: 0 },
    };
  }
}
