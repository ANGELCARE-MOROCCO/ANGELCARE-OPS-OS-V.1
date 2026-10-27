"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { type Locale } from "./catalogue";
import { navigationEvent, navigateKidFlix } from "./navigation-events";
import { NavigationToast } from "./NavigationToast";
import { routeLoadingCount, serverLoadingCount, subscribeRouteLoading } from "./navigation-loading";

type Phase = "idle" | "pending" | "slow" | "error";

function Lifecycle({ locale }: { locale: Locale }) {
  const pathname = usePathname(), search = useSearchParams();
  const key = pathname + "?" + search.toString();
  const router = useRouter(), routerRef = useRef(router);
  routerRef.current = router;
  const loading = useSyncExternalStore(subscribeRouteLoading, routeLoadingCount, serverLoadingCount) > 0;
  const [state, setState] = useState<Phase>("idle");
  const [refreshing, startRefresh] = useTransition();
  const [boundaryPhase, setBoundaryPhase] = useState<"idle" | "pending" | "slow">("idle");
  const [dismissedBoundary, setDismissedBoundary] = useState(false);
  const target = useRef("");
  const delay = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const slow = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function clear() {
    clearTimeout(delay.current);
    clearTimeout(slow.current);
    setState("idle");
  }
  useEffect(() => { clear(); }, [key]);
  useEffect(() => {
    setBoundaryPhase("idle");
    setDismissedBoundary(false);
    if (!loading) return;
    const pending = setTimeout(() => setBoundaryPhase("pending"), 180);
    const overdue = setTimeout(() => setBoundaryPhase("slow"), 10000);
    return () => { clearTimeout(pending); clearTimeout(overdue); };
  }, [loading]);
  useEffect(() => {
    function start(href: string) {
      clear();
      setDismissedBoundary(false);
      target.current = href;
      delay.current = setTimeout(() => setState("pending"), 180);
      slow.current = setTimeout(() => setState("slow"), 10000);
    }
    function event(e: Event) {
      const detail = (e as CustomEvent<{ phase: string; href: string }>).detail;
      if (detail?.phase === "navigate") {
        if (e.defaultPrevented) return;
        const url = new URL(detail.href, location.href);
        if (url.origin !== location.origin || !/^\/kidflix\/(en|fr|ar)(\/|$)/.test(url.pathname)) return;
        e.preventDefault();
        target.current = url.href;
        try {
          if (url.pathname === location.pathname && url.search === location.search) {
            clear();
            setDismissedBoundary(false);
            startRefresh(() => routerRef.current.refresh());
          } else {
            start(url.href);
            routerRef.current.push(url.pathname + url.search + url.hash);
          }
        } catch { clear(); setState("error"); }
      } else if (detail?.phase === "start") start(detail.href);
      else if (detail?.phase === "error") {
        clear(); target.current = detail.href; setState("error");
      }
    }
    function click(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !(e.target instanceof Element)) return;
      const a = e.target.closest<HTMLAnchorElement>("[data-kidflix-shell] a");
      if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/^\/kidflix\/(en|fr|ar)(\/|$)/.test(url.pathname) || (url.pathname === location.pathname && url.search === location.search)) return;
      start(url.href);
    }
    const pop = () => start(location.href);
    document.addEventListener("click", click, true);
    window.addEventListener(navigationEvent, event);
    window.addEventListener("popstate", pop);
    window.addEventListener("pageshow", clear);
    window.addEventListener("pagehide", clear);
    return () => {
      clearTimeout(delay.current); clearTimeout(slow.current);
      document.removeEventListener("click", click, true);
      window.removeEventListener(navigationEvent, event);
      window.removeEventListener("popstate", pop);
      window.removeEventListener("pageshow", clear);
      window.removeEventListener("pagehide", clear);
    };
  }, []);

  const boundary = loading && !dismissedBoundary ? boundaryPhase : "idle";
  const phase = state === "error" ? "error" : state === "slow" || boundary === "slow" ? "slow" : state === "pending" || boundary === "pending" || refreshing ? "pending" : "idle";
  if (phase === "idle") return null;
  return <NavigationToast locale={locale} state={phase}
    onRetry={() => navigateKidFlix(target.current || location.href)}
    onDismiss={() => { clear(); setDismissedBoundary(true); }} />;
}

export function Navigation({ locale }: { locale: Locale }) {
  return <Suspense fallback={null}><Lifecycle locale={locale} /></Suspense>;
}
