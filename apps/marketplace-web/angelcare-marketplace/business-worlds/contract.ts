import type { CatalogLocale } from "../catalog-discovery/types";
import { WORLDS, type BusinessKey } from "./content";
export interface EnquiryValues {
  fullName: string;
  organization: string;
  city: string;
  email: string;
  phone: string;
  message: string;
  capacity: string;
  urgency: string;
  consent: boolean;
  website: string;
}
export const EMPTY_ENQUIRY: EnquiryValues = {
  fullName: "",
  organization: "",
  city: "",
  email: "",
  phone: "",
  message: "",
  capacity: "",
  urgency: "exploration",
  consent: false,
  website: "",
};
export const routeFor = (locale: CatalogLocale, route: string) =>
  `/angelcare-marketplace/${locale}/${route}`;
export function validEnquiry(key: BusinessKey, v: EnquiryValues) {
  const p = WORLDS[key],
    email = v.email.trim(),
    phone = v.phone.trim(),
    message = v.message.trim();
  if (
    !v.consent ||
    message.length < 10 ||
    message.length > (p.vertical ? 3000 : 4000)
  )
    return false;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  if (!["exploration", "quarter", "urgent"].includes(v.urgency)) return false;
  if (v.capacity && (!/^\d+$/.test(v.capacity) || Number(v.capacity) > 1000000))
    return false;
  if (p.vertical)
    return !!v.organization.trim() && !!v.city.trim() && !!email && !!phone;
  return !!v.fullName.trim() && (!!email || !!phone);
}
export function enquiryPayload(
  key: BusinessKey,
  locale: CatalogLocale,
  v: EnquiryValues,
  sourceRoute: string,
) {
  const p = WORLDS[key];
  if (p.vertical)
    return {
      vertical: p.vertical,
      sourceRoute,
      organizationName: v.organization.trim(),
      city: v.city.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      needs: `[${key}]\n${v.message.trim()}`.slice(0, 3000),
      consent: v.consent ? "on" : "",
      sourceLocale: locale,
      urgency: v.urgency,
      capacity: v.capacity ? Number(v.capacity) : null,
    };
  return {
    audience: p.audience,
    locale,
    sourceRoute,
    fullName: v.fullName.trim(),
    email: v.email.trim() || null,
    phone: v.phone.trim() || null,
    organization: v.organization.trim() || null,
    city: v.city.trim() || null,
    message: v.message.trim(),
    consent: v.consent,
    website: v.website,
  };
}
export const enquiryEndpoint = (key: BusinessKey) =>
  WORLDS[key].vertical
    ? "/api/angelcare-marketplace/b2b/public/diagnostics"
    : "/api/angelcare-marketplace/public/inquiries";
export function responseReference(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("data" in payload))
    return null;
  const data = (payload as { data: unknown }).data;
  if (!data || typeof data !== "object" || !("publicReference" in data))
    return null;
  const value = (data as { publicReference: unknown }).publicReference;
  return typeof value === "string" && /^[A-Za-z0-9_-]{4,120}$/.test(value)
    ? value
    : null;
}
export function prioritySummary(
  key: BusinessKey,
  locale: CatalogLocale,
  selected: readonly number[],
  context: readonly string[] = [],
) {
  const p = WORLDS[key],
    labels = [...new Set(selected)]
      .filter((i) => Number.isInteger(i) && i >= 0 && i < p.priorities.length)
      .map((i) => p.priorities[i][locale]);
  return [p.label[locale], ...context.map((v) => v.slice(0, 180)), ...labels]
    .join(" · ")
    .slice(0, 1000);
}
export function appendBrief(message: string, brief: string, max: number) {
  const clean = brief.trim().slice(0, 1000);
  if (!clean || message.includes(clean)) return message;
  return (message.trim() ? `${message.trim()}\n\n${clean}` : clean).slice(
    0,
    max,
  );
}
export function publicEvent(
  key: BusinessKey,
  locale: CatalogLocale,
  name:
    | "explorer_change"
    | "brief_prepared"
    | "enquiry_started"
    | "enquiry_success"
    | "enquiry_failure",
  data: Record<string, string | number> = {},
) {
  // Only public choices and event categories; never names, contacts or message text.
  const safe = Object.fromEntries(
    Object.entries(data).filter(([k]) =>
      ["choice", "dimension", "count"].includes(k),
    ),
  );
  return fetch("/api/angelcare-marketplace/public/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName: `business_world.${name}`,
      route: routeFor(locale, key),
      locale,
      data: { world: key, ...safe },
    }),
    keepalive: true,
  }).catch(() => undefined);
}
