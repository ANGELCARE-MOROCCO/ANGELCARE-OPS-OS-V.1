import type { Locale } from "../catalogue";
/** Observations and intents only. Verified outcomes require a server-issued receipt. */
export function notifyJourney(key: string, action: string) {
  window.dispatchEvent(
    new CustomEvent("kidflix:visitor", { detail: { key, action } }),
  );
}
export function emitVisitor(
  key: string,
  locale: Locale,
  releaseId: string,
  action: string,
  receipt?: string,
) {
  try {
    const preferences = JSON.parse(
      localStorage.getItem("kidflix.personal.v3") || "null",
    )?.preferences;
    if (
      preferences?.measurement !== true ||
      !releaseId ||
      !location.pathname.startsWith("/kidflix/")
    )
      return;
    void fetch(
      "/api/kidflix/experience/" + encodeURIComponent(key) + "/runtime",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "event",
          id: crypto.randomUUID(),
          locale,
          releaseId,
          action,
          receipt,
          consent: true,
        }),
        keepalive: true,
      },
    ).catch(() => {});
  } catch {}
}
