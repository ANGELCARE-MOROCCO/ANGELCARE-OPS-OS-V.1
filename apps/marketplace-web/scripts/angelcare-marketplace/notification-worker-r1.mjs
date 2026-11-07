#!/usr/bin/env node
/** Run on the existing application server. No credentials are printed or sent to third-party hosts. */
import { setTimeout as delay } from "node:timers/promises";
const once = process.argv.includes("--once");
const secret = process.env.MARKETPLACE_NOTIFICATIONS_WORKER_SECRET || "";
if (secret.length < 32)
  throw new Error(
    "MARKETPLACE_NOTIFICATIONS_WORKER_SECRET must contain at least 32 characters",
  );
const origin = new URL(
  process.env.MARKETPLACE_NOTIFICATIONS_WORKER_ORIGIN ||
    "http://127.0.0.1:3000",
);
if (
  !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname) &&
  origin.protocol !== "https:"
)
  throw new Error("Remote worker origin requires HTTPS");
const endpoint = new URL(
  "/api/internal/angelcare-notifications/worker",
  origin,
);
let stopped = false;
process.once("SIGTERM", () => {
  stopped = true;
});
process.once("SIGINT", () => {
  stopped = true;
});
do {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: "Bearer " + secret },
      redirect: "error",
      signal: AbortSignal.timeout(55000),
    });
    const value = await response.json();
    if (!response.ok || !value.ok) throw new Error("WORKER_UNAVAILABLE");
    console.log(
      "[NOTIFICATIONS]",
      JSON.stringify({
        at: new Date().toISOString(),
        projected: value.data.projected,
        mediaChecked: value.data.mediaChecked,
        mediaUnavailable: value.data.mediaUnavailable,
      }),
    );
  } catch {
    console.error(
      "[NOTIFICATIONS] Worker failed; inspect source coverage. No native business operation was retried.",
    );
    if (once) process.exitCode = 1;
  }
  if (!once && !stopped) await delay(15000);
} while (!once && !stopped);
