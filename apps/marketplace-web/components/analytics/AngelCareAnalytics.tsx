"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";

/** One container. The unrelated GTM-N9Z6RMZC installation must not be added. */
const GTM_ID = "GTM-NHKMDXGK";
const CONSENT_KEY = "angelcare_ga4_analytics_consent_v1";
type Choice = "unknown" | "accepted" | "rejected";
type World = "angelcare" | "jobkix";

const LANGUAGES = new Set(["fr", "en", "ar"]);
const JOBKIX_LANGUAGES = new Set(["en", "fr", "es", "hi", "tl", "id", "ar"]);
const PRIVATE_SEGMENTS = new Set([
  "api", "admin", "account", "accounts", "auth", "login", "logout", "signup",
  "register", "registration", "workspace", "dashboard", "profile", "profiles",
  "customer", "customers", "provider", "providers", "staff", "employee", "employees",
  "candidate", "candidates", "hirer", "hirers", "employer", "employers",
  "applications", "application", "apply", "checkout", "basket", "cart", "payment",
  "payments", "orders", "order", "booking", "bookings", "subscription", "subscriptions",
  "quotation", "quote-basket", "enrollment", "partner-os", "my-angelcare",
  "family", "families", "preview", "private", "kidflix", "sanila", "inbox",
  "settings", "billing", "onboarding", "documents", "downloads", "saved",
]);

/** Default-deny: only explicitly public worlds may initialize GTM. */
export function analyticsWorld(pathname: string): World | null {
  if (/[?#%\\]/.test(pathname)) return null;
  const parts = pathname.toLowerCase().split("/").filter(Boolean);
  if (parts.some((part) => PRIVATE_SEGMENTS.has(part))) return null;
  if (parts[0] === "angelcare-marketplace" && LANGUAGES.has(parts[1]))
    return "angelcare";
  if (parts[0] === "jobkix" && JOBKIX_LANGUAGES.has(parts[1]))
    return "jobkix";
  return null;
}

function eligibleHost(host: string): boolean {
  return host === "angelcarehub.com" || host === "my.angelcarehub.com";
}

function localeOf(path: string): "fr" | "en" | "ar" {
  const parts = path.split("/").filter(Boolean);
  const locale = parts[1];
  return locale === "fr" || locale === "ar" ? locale : "en";
}

const COPY = {
  fr: {
    title: "Mesure d’audience facultative",
    body: "Autorisez Google Analytics pour nous aider à améliorer les pages publiques d’AngelCare. Pas de personnalisation publicitaire. KidFlix et les espaces privés sont exclus.",
    accept: "Autoriser l’analyse", reject: "Refuser", settings: "Confidentialité · Analyse", close: "Fermer",
  },
  en: {
    title: "Optional audience analytics",
    body: "Allow Google Analytics to help us improve public AngelCare pages. No personalized advertising. KidFlix and private workspaces are excluded.",
    accept: "Allow analytics", reject: "Decline", settings: "Privacy · Analytics", close: "Close",
  },
  ar: {
    title: "تحليلات زيارات اختيارية",
    body: "يمكنك السماح بتحليلات Google لتحسين الصفحات العامة. لا نستخدم تخصيص الإعلانات. تُستثنى صفحات KidFlix والمساحات الخاصة.",
    accept: "السماح بالتحليلات", reject: "رفض", settings: "الخصوصية · التحليلات", close: "إغلاق",
  },
} as const;

type DataLayer = Array<unknown>;
declare global {
  interface Window {
    dataLayer?: DataLayer;
  }
}
const DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

/** Use Google's gtag command format; never load GTM before an opt-in. */
function consentCommand(mode: "default" | "update", analytics: "granted" | "denied") {
  window.dataLayer ||= [];
  // GTM expects the gtag arguments-like object, not a generic dataLayer event.
  function gtag(..._args: unknown[]) {
    window.dataLayer?.push(arguments);
  }
  gtag("consent", mode, { ...DENIED, analytics_storage: analytics });
}

function loadGtmOnce(): void {
  if (document.querySelector(`script[data-angelcare-gtm="${GTM_ID}"]`)) return;
  window.dataLayer ||= [];
  consentCommand("default", "denied");
  consentCommand("update", "granted");
  window.dataLayer.push({ event: "gtm.js", "gtm.start": Date.now() });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  script.dataset.angelcareGtm = GTM_ID;
  document.head.appendChild(script);
}

const buttonStyle: CSSProperties = {
  border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 14px",
  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

/**
 * Consent-first, client-side loader. No Google script or beacon is emitted in
 * server HTML, on KidFlix, on private routes, or before visitor acceptance.
 * The custom dataLayer event is intentionally NOT a GA4 page_view: it can be
 * mapped later without duplicating GA4's enhanced-measurement page views.
 */
export default function AngelCareAnalytics() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<Choice>("unknown");
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lastPath = useRef<string>("");
  const hadLiveTag = useRef(false);
  const previousEligible = useRef(false);

  useEffect(() => {
    let value: Choice = "unknown";
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (saved === "accepted" || saved === "rejected") value = saved;
    } catch { /* Fail closed if storage is unavailable. */ }
    setChoice(value);
    setReady(true);
  }, []);

  const world = pathname ? analyticsWorld(pathname) : null;
  const eligible = Boolean(world && ready && typeof window !== "undefined" &&
    eligibleHost(window.location.hostname) && process.env.NODE_ENV === "production");
  const language = localeOf(pathname || "/angelcare-marketplace/fr");
  const copy = COPY[language];

  useEffect(() => {
    if (!ready || !pathname) return;
    if (!eligible || choice !== "accepted") {
      if (hadLiveTag.current) {
        consentCommand("update", "denied");
        // A new document is a hard privacy boundary: no loaded GTM runtime may
        // continue onto child-directed KidFlix or a restricted workspace.
        if (!eligible && previousEligible.current) {
          window.location.reload();
          return;
        }
      }
      previousEligible.current = false;
      return;
    }
    previousEligible.current = true;
    if (!hadLiveTag.current) {
      loadGtmOnce();
      hadLiveTag.current = true;
    } else {
      consentCommand("update", "granted");
    }
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      window.dataLayer?.push({
        event: "angelcare_public_navigation",
        ac_world: world,
        page_path: pathname,
        // Never forward search strings, visitor IDs, forms or user data.
        page_location: window.location.origin + pathname,
      });
    }
  }, [choice, eligible, pathname, ready, world]);

  function setConsent(value: "accepted" | "rejected") {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch {
      // If persistence fails, default to rejection, never silent consent.
      if (value === "accepted") { setChoice("rejected"); setExpanded(false); return; }
    }
    setExpanded(false);
    setChoice(value);
    if (value === "rejected" && hadLiveTag.current) {
      consentCommand("update", "denied");
      window.location.reload(); // Unload previously inserted third-party scripts.
    }
  }

  if (!eligible) return null;
  const showBanner = choice === "unknown" || expanded;
  return (
    <aside
      dir={language === "ar" ? "rtl" : "ltr"}
      aria-label={copy.title}
      style={{ position: "fixed", bottom: 18, left: 18, zIndex: 2147483000,
        maxWidth: "min(440px, calc(100vw - 36px))", fontFamily: "Arial, sans-serif" }}
    >
      {showBanner ? (
        <div role="region" aria-label={copy.title} style={{ background: "#fff", color: "#14253d",
          border: "1px solid #dce5ef", borderRadius: 15, padding: "18px 20px",
          boxShadow: "0 12px 38px rgba(20,38,61,.16)" }}>
          <strong style={{ display: "block", fontSize: 15, lineHeight: 1.3 }}>{copy.title}</strong>
          <p style={{ fontSize: 12, lineHeight: 1.55, margin: "9px 0 15px", color: "#52657c" }}>{copy.body}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" onClick={() => setConsent("accepted")}
              style={{ ...buttonStyle, background: "#1766d7", borderColor: "#1766d7", color: "#fff" }}>
              {copy.accept}
            </button>
            <button type="button" onClick={() => setConsent("rejected")}
              style={{ ...buttonStyle, background: "#fff", color: "#14253d" }}>
              {copy.reject}
            </button>
            {choice !== "unknown" ? (
              <button type="button" onClick={() => setExpanded(false)} aria-label={copy.close}
                style={{ ...buttonStyle, background: "#fff", color: "#475569" }}>×</button>
            ) : null}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setExpanded(true)} style={{ ...buttonStyle,
          background: "#fff", color: "#334155", boxShadow: "0 5px 18px rgba(20,38,61,.1)",
          fontSize: 11, padding: "7px 10px" }}>{copy.settings}</button>
      )}
    </aside>
  );
}
