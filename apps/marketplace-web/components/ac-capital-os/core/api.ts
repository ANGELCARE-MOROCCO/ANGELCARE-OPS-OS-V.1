import type { ApiEnvelope } from "./types";

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const envelope = payload as Partial<ApiEnvelope<T>> | null;
    throw new Error(envelope?.warning || envelope?.code || `Request failed (${response.status})`);
  }

  return payload as ApiEnvelope<T>;
}

export async function getEnvelope<T>(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { method: "GET", cache: "no-store", signal, headers: { Accept: "application/json" } });
  return parseResponse<T>(response);
}

export async function postEnvelope<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function patchEnvelope<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function uploadEnvelope<T>(url: string, form: FormData) {
  const response = await fetch(url, { method: "POST", body: form, headers: { Accept: "application/json" } });
  return parseResponse<T>(response);
}
