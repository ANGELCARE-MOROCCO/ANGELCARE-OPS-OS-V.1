"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../catalogue";
import { I } from "../Icons";
import { Modal } from "./shared";
import { shareLinks, sw, validLove } from "./social-contract";
import s from "./social.module.css";
import { notifyJourney } from "../journey/events";
const Love = createContext({
  value: null as { count: number; liked: boolean } | null,
  busy: false,
  error: "",
  refresh: () => {},
  toggle: () => {},
});
export function LoveProvider({
  resourceKey,
  locale,
  children,
}: {
  resourceKey: string;
  locale: Locale;
  children: ReactNode;
}) {
  const [value, setValue] = useState<{ count: number; liked: boolean } | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    flight = useRef(false),
    mounted = useRef(true),
    readController = useRef<AbortController | null>(null),
    writeController = useRef<AbortController | null>(null),
    version = useRef(0);
  const endpoint =
    "/api/kidflix/experience/" + encodeURIComponent(resourceKey) + "/love";
  const refresh = useCallback(async () => {
    if (flight.current) return;
    readController.current?.abort();
    const controller = new AbortController();
    readController.current = controller;
    const expected = version.current,
      timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint + "?locale=" + locale, {
        signal: controller.signal,
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !validLove(result)) throw Error("LOVE_UNAVAILABLE");
      if (
        mounted.current &&
        readController.current === controller &&
        version.current === expected
      ) {
        setValue(result);
        setError("");
      }
    } catch {
      if (
        mounted.current &&
        readController.current === controller &&
        version.current === expected &&
        !flight.current
      )
        setError("unavailable");
    } finally {
      clearTimeout(timer);
    }
  }, [endpoint, locale]);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const sync = (e: StorageEvent) => {
      if (e.key === "kidflix.love.changed") void refresh();
    };
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    window.addEventListener("storage", sync);
    return () => {
      mounted.current = false;
      readController.current?.abort();
      writeController.current?.abort();
      window.removeEventListener("focus", focus);
      window.removeEventListener("storage", sync);
    };
  }, [refresh]);
  async function toggle() {
    if (!value || flight.current) return;
    flight.current = true;
    version.current++;
    readController.current?.abort();
    setBusy(true);
    setError("");
    const controller = new AbortController();
    writeController.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, liked: !value.liked }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !validLove(result))
        throw Error(
          response.status === 428
            ? "cookies"
            : response.status === 429
              ? "wait"
              : "failure",
        );
      if (mounted.current) {
        notifyJourney(resourceKey, result.liked ? "love" : "unlove");
        setValue(result);
        try {
          localStorage.setItem(
            "kidflix.love.changed",
            JSON.stringify({ key: resourceKey, at: Date.now() }),
          );
        } catch {}
      }
    } catch (e) {
      if (mounted.current)
        setError(
          ["cookies", "wait", "failure"].includes((e as Error).message)
            ? (e as Error).message
            : "failure",
        );
    } finally {
      clearTimeout(timer);
      flight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <Love.Provider
      value={{
        value,
        busy,
        error,
        refresh: () => void refresh(),
        toggle: () => void toggle(),
      }}
    >
      {children}
    </Love.Provider>
  );
}
function LoveButton({ locale }: { locale: Locale }) {
  const { value, busy, error, toggle } = useContext(Love),
    label = sw(value?.liked ? "loved" : "love", locale),
    full = value ? value.count.toLocaleString(locale) : "—",
    short = value
      ? new Intl.NumberFormat(locale, {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value.count)
      : "—";
  return (
    <button
      type="button"
      className={s.love}
      onClick={toggle}
      disabled={!value || busy}
      aria-pressed={value?.liked || false}
      aria-busy={busy}
      aria-label={
        label +
        (value
          ? " · " +
            full +
            " " +
            sw(value?.count === 1 ? "heart" : "loves", locale)
          : "")
      }
      title={
        value
          ? full + " " + sw(value?.count === 1 ? "heart" : "loves", locale)
          : sw(error ? "unavailable" : "loading", locale)
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="21"
        height="21"
        aria-hidden="true"
        className={value?.liked ? s.filled : undefined}
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
      <span>{sw("love", locale)}</span>
      <strong aria-live="polite">{short}</strong>
    </button>
  );
}
function Brand({ name }: { name: "whatsapp" | "facebook" }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d={brandPaths[name]} />
    </svg>
  );
}
// Paths reproduced from Simple Icons 15.16.0 (CC0); see THIRD_PARTY_NOTICES.md in the delivery.
const brandPaths = {
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  facebook:
    "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
};
export function ShareControls({
  resourceKey,
  title,
  locale,
}: {
  resourceKey: string;
  title: string;
  locale: Locale;
}) {
  const [origin, setOrigin] = useState(""),
    [notice, setNotice] = useState(""),
    [manual, setManual] = useState(false),
    [native, setNative] = useState(false),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setOrigin(location.origin);
    setNative(typeof navigator.share === "function");
  }, []);
  const links = origin ? shareLinks(origin, resourceKey, locale, title) : null;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (manual) {
      input.current?.focus();
      input.current?.select();
    }
  }, [manual]);
  async function copy() {
    notifyJourney(resourceKey, "share");
    if (!links) return;
    try {
      if (!navigator.clipboard?.writeText) throw Error("CLIPBOARD_UNAVAILABLE");
      await navigator.clipboard.writeText(links.url);
      setManual(false);
      setNotice(sw("copied", locale));
    } catch {
      setManual(true);
    }
  }
  async function more() {
    notifyJourney(resourceKey, "share");
    if (!links) return;
    try {
      await navigator.share({
        title: title + " · KidFlix",
        text: sw("message", locale),
        url: links.url,
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setManual(true);
    }
  }
  return (
    <div
      className={s.shareControls}
      role="group"
      aria-label={sw("share", locale)}
    >
      <a
        className={s.whatsapp}
        onClick={() => notifyJourney(resourceKey, "share")}
        href={links?.whatsapp}
        aria-disabled={!links}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={sw("shareOn", locale) + " WhatsApp"}
      >
        <Brand name="whatsapp" />
        WhatsApp
      </a>
      <a
        className={s.facebook}
        onClick={() => notifyJourney(resourceKey, "share")}
        href={links?.facebook}
        aria-disabled={!links}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={sw("shareOn", locale) + " Facebook"}
      >
        <Brand name="facebook" />
        Facebook
      </a>
      <button type="button" onClick={() => void copy()} disabled={!links}>
        <I name="Copy" size={17} />
        {sw("copy", locale)}
      </button>
      {native ? (
        <button type="button" onClick={() => void more()} disabled={!links}>
          <I name="ExternalLink" size={17} />
          {sw("more", locale)}
        </button>
      ) : null}
      {notice ? (
        <span className={s.feedback} role="status">
          {notice}
        </span>
      ) : null}
      {manual && links ? (
        <label className={s.manual}>
          <span>{sw("copyHelp", locale)}</span>
          <input
            ref={input}
            value={links.url}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={() => setManual(false)}
            aria-label={sw("close", locale)}
          >
            ×
          </button>
        </label>
      ) : null}
    </div>
  );
}
export function SocialToolbar({
  resourceKey,
  title,
  locale,
  lower = false,
}: {
  resourceKey: string;
  title: string;
  locale: Locale;
  lower?: boolean;
}) {
  const { error, refresh, busy } = useContext(Love);
  return (
    <section
      className={`${s.toolbar} ${lower ? s.lower : ""}`}
      aria-label={sw("share", locale)}
    >
      {lower ? (
        <div className={s.invitation}>
          <strong>{sw("endTitle", locale)}</strong>
          <p>{sw("endCopy", locale)}</p>
        </div>
      ) : null}
      <div className={s.row}>
        <LoveButton locale={locale} />
        <ShareControls
          resourceKey={resourceKey}
          title={title}
          locale={locale}
        />
      </div>
      {error ? (
        <div className={s.error} role="status">
          <span>
            {sw(
              error as "unavailable" | "failure" | "cookies" | "wait",
              locale,
            )}
          </span>
          <button type="button" onClick={refresh} disabled={busy}>
            {sw("retry", locale)}
          </button>
        </div>
      ) : null}
    </section>
  );
}
export function CardShare({
  resourceKey,
  title,
  locale,
}: {
  resourceKey: string;
  title: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={s.cardShare}
        onClick={() => setOpen(true)}
        aria-label={sw("share", locale) + " · " + title}
      >
        <I name="ExternalLink" size={16} />
      </button>
      {open
        ? createPortal(
            <div className={s.portal}>
              <Modal
                title={title}
                locale={locale}
                onClose={() => setOpen(false)}
              >
                <p className={s.modalLabel}>{sw("share", locale)}</p>
                <ShareControls
                  resourceKey={resourceKey}
                  title={title}
                  locale={locale}
                />
              </Modal>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
