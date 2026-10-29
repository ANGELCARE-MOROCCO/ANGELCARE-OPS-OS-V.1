"use client";
import { useEffect } from "react";
const API = "/api/angelcare-marketplace/public/seo-power/metrics";
export function GrowthSignals({ token }: { token: string }) {
  useEffect(() => {
    if (
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl
    )
      return;
    const source = () => {
      try {
        const u = new URL(document.referrer);
        if (u.origin === location.origin) return "internal";
        return /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com|baidu\.com|yandex\.[a-z]+|ecosia\.org|qwant\.com|search\.brave\.com|search\.naver\.com)$/.test(
          u.hostname,
        )
          ? "search"
          : "referral";
      } catch {
        return "direct";
      }
    };
    const send = (event: string) => {
      const body = JSON.stringify({ token, event, channel: source() });
      void fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        credentials: "omit",
      }).catch(() => {});
    };
    send("pageview");
    const click = (e: MouseEvent) => {
      const target =
        e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      try {
        const u = new URL(target.href);
        if (u.origin !== location.origin) return;
        if (u.searchParams.get("apply") === "1") send("apply_intent");
        else if (
          target.dataset.seoOutcome === "resource_open" ||
          /\/experience\/|\/marketplace\/item\/|\/jobs\/[a-f0-9-]{36}/.test(
            u.pathname,
          )
        )
          send("resource_open");
        else if (/\/contact\/?$/.test(u.pathname)) send("enquiry_intent");
      } catch {}
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [token]);
  return null;
}
