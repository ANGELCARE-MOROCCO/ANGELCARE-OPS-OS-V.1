"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { I } from "../Icons";
import { isNativeMediaUrl } from "../media-url";
import type { Locale } from "../catalogue";
import { asset, obj, rows, str, type Row } from "./model";
import { local, t } from "./copy";
import s from "./detail.module.css";
export interface PlayerProps {
  openPlayer?: () => void;
  preview?: boolean;
  runAction?: (
    operation: string,
    input: Row,
    signal?: AbortSignal,
  ) => Promise<Row>;
  m: Row;
  d: Row;
  locale: Locale;
  engine: string;
  state: Row;
  update: (patch: Row) => void;
}
export function Button({
  children,
  icon,
  primary = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`${primary ? s.primary : s.button} ${props.className || ""}`}
    >
      {icon ? <I name={icon} size={17} /> : null}
      {children}
    </button>
  );
}
export function Empty({ locale }: { locale: Locale }) {
  return (
    <div className={s.empty} role="status">
      <I name="BookOpen" size={30} />
      <p>{t("empty", locale)}</p>
    </div>
  );
}
export function ErrorNote({
  message,
  locale,
  retry,
}: {
  message?: string;
  locale: Locale;
  retry?: () => void;
}) {
  return (
    <div className={s.error} role="alert">
      <p>{message || t("error", locale)}</p>
      {retry ? <Button onClick={retry}>{t("retry", locale)}</Button> : null}
    </div>
  );
}
export function Pager({
  index,
  count,
  onChange,
  locale,
}: {
  index: number;
  count: number;
  onChange: (n: number) => void;
  locale: Locale;
}) {
  return (
    <div className={s.pager}>
      <Button
        icon="ChevronLeft"
        disabled={index <= 0}
        onClick={() => onChange(index - 1)}
        aria-label={t("previous", locale)}
      >
        {t("previous", locale)}
      </Button>
      <output aria-live="polite">
        {count ? index + 1 : 0} / {count}
      </output>
      <Button
        icon="ChevronRight"
        disabled={index >= count - 1}
        onClick={() => onChange(index + 1)}
        aria-label={t("next", locale)}
      >
        {t("next", locale)}
      </Button>
    </div>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className={s.progress}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <span style={{ width: Math.max(0, Math.min(100, value)) + "%" }} />
      </div>
      <span>{label}</span>
    </div>
  );
}
export function Source({
  m,
  id,
  alt = "",
  className = "",
  locale = m.editionLocale === "fr" ? "fr" : m.editionLocale === "ar" ? "ar" : "en",
}: {
  m: Row;
  id: unknown;
  alt?: string;
  className?: string;
  pdf?: boolean;
  locale?: Locale;
}) {
  const a = asset(m, id),
    [failed, setFailed] = useState(false),
    [pdfRevision, setPdfRevision] = useState(0);
  useEffect(() => setFailed(false), [id, a?.url]);
  if (!a || failed)
    return (
      <div className={s.sourceMissing}>
        <I name="FileText" size={28} />
        <span>{alt}</span>
        <p>{locale === "fr" ? "La source est indisponible. Vérifiez le fichier lié à cette édition." : locale === "ar" ? "المصدر غير متاح. تحقق من الملف المرتبط بهذه النسخة." : "Source unavailable. Check the file bound to this edition."}</p>
      </div>
    );
  return a.mime.startsWith("image/") ? (
    <img
      className={className}
      src={a.url}
      alt={alt || a.alt || ""}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  ) : a.mime === "application/pdf" ? (
    <section aria-label={alt || "PDF"}>
      <div className={s.controls}>
        <a className={s.secondary} href={a.url} target="_blank" rel="noopener noreferrer">
          {locale === "fr" ? "Ouvrir le PDF dans un nouvel onglet" : locale === "ar" ? "فتح ملف PDF في تبويب جديد" : "Open PDF in a new tab"}
        </a>
        <Button onClick={() => setPdfRevision((v) => v + 1)}>{t("retry", locale)}</Button>
      </div>
      <p role="status">{locale === "fr" ? "Le lecteur de votre navigateur gère les pages du PDF. Si l’aperçu est vide, ouvrez le fichier dans un nouvel onglet." : locale === "ar" ? "يتولى قارئ المتصفح عرض صفحات PDF. إذا كانت المعاينة فارغة، افتح الملف في تبويب جديد." : "Your browser’s PDF reader handles the pages. If the preview is blank, open the file in a new tab."}</p>
      <iframe key={a.url + ":" + pdfRevision}
        className={s.pdf}
        src={(!isNativeMediaUrl(a.url) && m.releaseId && m.key && typeof id === "string" ? "/api/kidflix/reader?" + new URLSearchParams({locale, key:m.key, asset:id, release:m.releaseId}) : a.url) + "#toolbar=1"}
        title={alt || "PDF"}
        loading="eager"
      />
    </section>
  ) : null;
}
export function Modal({
  title,
  locale,
  onClose,
  children,
}: {
  title: string;
  locale: Locale;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null),
    id = useId(),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const nodes = [
            ...ref.current!.querySelectorAll<HTMLElement>(
              'button:not(:disabled),a[href],input:not(:disabled),select,textarea,[tabindex="0"]',
            ),
          ].filter((n) => n.getClientRects().length),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      before?.isConnected && before.focus();
    };
  }, []);
  return (
    <div
      className={s.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={s.modal}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <header>
          <h2 id={id}>{title}</h2>
          <Button icon="X" onClick={onClose}>
            {t("close", locale)}
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Editorial({
  m,
  data,
  locale,
  depth = 0,
}: {
  m: Row;
  data: Row;
  locale: Locale;
  depth?: number;
}) {
  if (depth > 3) return null;
  const body = local(data, "body", locale),
    blocks = rows(data.sections).length
      ? rows(data.sections)
      : rows(data.blocks);
  return (
    <div className={s.editorial}>
      {body ? <p>{body}</p> : null}
      {blocks.map((b, i) => {
        const text = local(b, "text", locale),
          title = local(b, "title", locale),
          bound = obj(m.bindings?.records?.[b.contentId]);
        return (
          <section
            key={b.id || i}
            className={b.type === "callout" ? s.callout : undefined}
          >
            {title ? <h3>{title}</h3> : null}
            {b.type === "image" ? (
              <Source
                m={m}
                id={b.assetId}
                alt={local(b, "alt", locale) || title}
              />
            ) : b.type === "list" ? (
              <ul>
                {text
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
              </ul>
            ) : b.type === "content" ? (
              <Editorial
                m={bound}
                data={obj(bound.definition)}
                locale={locale}
                depth={depth + 1}
              />
            ) : text ? (
              <p>{text}</p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
export async function action(
  key: string,
  locale: Locale,
  releaseId: string,
  operation: string,
  input: Row,
  signal?: AbortSignal,
) {
  const r = await fetch(
    "/api/kidflix/experience/" + encodeURIComponent(key) + "/actions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, releaseId, operation, ...input }),
      signal,
    },
  );
  const v = await r.json();
  if (!r.ok) throw Error(v.error || "ACTION_UNAVAILABLE");
  return v;
}
