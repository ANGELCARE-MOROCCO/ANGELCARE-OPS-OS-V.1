"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { SOURCE_BY_ID } from "./registry";
import { destination, isUuid, type Focus, type Locale } from "./model";
import { copy, familyLabel, timeLabel } from "./copy";
import { request } from "./client";
import styles from "./notifications.module.css";
/** A native-workspace companion, never a replacement workflow or a notification resolution command. */
export function NativeNotificationFocus({
  locale = "fr",
}: {
  locale?: Locale;
}) {
  const params = useSearchParams(),
    pathname = usePathname(),
    id = params.get("acNotice"),
    [focus, setFocus] = useState<Focus | null>(null),
    [error, setError] = useState(false),
    [hidden, setHidden] = useState(false),
    c = copy(locale);
  useEffect(() => {
    setFocus(null);
    setError(false);
    setHidden(false);
    if (!isUuid(id)) return;
    const ctrl = new AbortController();
    void request<Focus>("?id=" + id, undefined, ctrl.signal)
      .then((f) => {
        const target = destination(f.source, f.current, f.id).split("?")[0];
        if (target !== pathname) throw new Error("WRONG_NATIVE_WORKSPACE");
        setFocus(f);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError(true);
      });
    return () => ctrl.abort();
  }, [id, pathname]);
  if (!isUuid(id) || hidden) return null;
  return (
    <aside
      className={styles.focus}
      aria-label={c.focus}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header>
        <ShieldCheck size={21} />
        <h2>{c.focus}</h2>
        <button
          type="button"
          aria-label={c.close}
          onClick={() => setHidden(true)}
        >
          <X size={18} />
        </button>
      </header>
      {error ? (
        <p role="alert">{c.unavailable}</p>
      ) : !focus ? (
        <p aria-busy="true">…</p>
      ) : (
        <>
          <p>
            {familyLabel(SOURCE_BY_ID.get(focus.source)?.family || "", locale)}{" "}
            ·{" "}
            <code>
              {String(
                focus.current?.public_reference ||
                  focus.current?.id ||
                  focus.safe.public_reference ||
                  focus.id,
              )}
            </code>
          </p>
          <h3>{c.current}</h3>
          {focus.deleted ? (
            <p>{c.deleted}</p>
          ) : (
            <dl>
              {Object.entries(focus.current || {})
                .filter(
                  ([k]) =>
                    ![
                      "tenant_id",
                      "territory_id",
                      "school_id",
                      "organization_id",
                      "assigned_to",
                      "assigned_admin_id",
                    ].includes(k),
                )
                .map(([key, value]) => (
                  <div className={styles.focusFact} key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
            </dl>
          )}
          <details>
            <summary>
              {c.timeline} · {focus.eventCount}
            </summary>
            <ol>
              {focus.events.map((e) => (
                <li key={e.id}>
                  <time>{timeLabel(e.at, locale, true)}</time>
                  {String(e.safe.operation || "")} ·{" "}
                  {String(
                    e.safe.status || e.safe.state || e.safe.lifecycle || "",
                  )}{" "}
                  {String(e.safe.type || "")}
                </li>
              ))}
            </ol>
          </details>
          <p>{c.noBusinessChange}</p>
        </>
      )}
    </aside>
  );
}
