import { Readable } from "node:stream";
import { createRequire } from "node:module";

type HeaderValue = number | string | readonly string[];

type NodeLikeResponse = {
  statusCode: number;
  headers: Headers;
  body: BodyInit | null;
  setHeader: (name: string, value: HeaderValue) => void;
  writeHead: (statusCode: number, headers?: Record<string, HeaderValue>) => void;
  end: (body?: string | Buffer | Uint8Array) => void;
};

const require = createRequire(import.meta.url);
const { createRequestHandler } = require("./router.js");

const shopifyHandler = createRequestHandler();

function toNodeHeaders(headers: Headers): Record<string, string> {
  const nodeHeaders: Record<string, string> = {};

  headers.forEach((value, key) => {
    nodeHeaders[key.toLowerCase()] = value;
  });

  return nodeHeaders;
}

function setResponseHeader(headers: Headers, name: string, value: HeaderValue) {
  if (Array.isArray(value)) {
    headers.set(name, value.join(", "));
    return;
  }

  headers.set(name, String(value));
}

async function createNodeLikeRequest(request: Request, pathname: string) {
  const url = new URL(request.url);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? Buffer.from(await request.arrayBuffer()) : Buffer.alloc(0);
  const stream = Readable.from(body.length ? [body] : []);
  const headers = toNodeHeaders(request.headers);

  return Object.assign(stream, {
    method: request.method,
    url: `${pathname}${url.search}`,
    headers,
    socket: {
      remoteAddress:
        headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        headers["x-real-ip"] ||
        "unknown",
    },
  });
}

function createNodeLikeResponse(): NodeLikeResponse {
  const response: NodeLikeResponse = {
    statusCode: 200,
    headers: new Headers(),
    body: null,
    setHeader(name, value) {
      setResponseHeader(this.headers, name, value);
    },
    writeHead(statusCode, headers = {}) {
      this.statusCode = statusCode;

      for (const [name, value] of Object.entries(headers)) {
        setResponseHeader(this.headers, name, value);
      }
    },
    end(body = "") {
      if (typeof body === "string") {
        this.body = body;
      } else {
        const bytes = new Uint8Array(body.byteLength);
        bytes.set(body);
        this.body = bytes.buffer as ArrayBuffer;
      }
    },
  };

  return response;
}

export async function handleShopifyRequest(request: Request, pathname: string) {
  const nodeRequest = await createNodeLikeRequest(request, pathname);
  const nodeResponse = createNodeLikeResponse();

  await shopifyHandler(nodeRequest, nodeResponse);

  return new Response(nodeResponse.body, {
    status: nodeResponse.statusCode,
    headers: nodeResponse.headers,
  });
}
