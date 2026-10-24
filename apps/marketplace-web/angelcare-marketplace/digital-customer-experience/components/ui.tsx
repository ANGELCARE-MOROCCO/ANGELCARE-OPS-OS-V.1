"use client";
import type { DceRecord } from "../types";

import {
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Baby,
  BadgeCheck,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  Camera,
  ChartColumn,
  ChartNoAxesCombined,
  ChartPie,
  ChartSpline,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  CloudUpload,
  Copy,
  CreditCard,
  Database,
  Download,
  EllipsisVertical,
  Eye,
  FileChartColumn,
  FileDown,
  FileImage,
  FileText,
  FileWarning,
  Film,
  Flower,
  Folder,
  FolderTree,
  Gauge,
  GitBranch,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  HeartHandshake,
  HeartPulse,
  Image,
  Images,
  Import,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Leaf,
  Link,
  ListChecks,
  LockKeyhole,
  Map,
  Menu,
  MessageSquare,
  MessageSquareHeart,
  MessagesSquare,
  Monitor,
  MonitorPlay,
  Package,
  Palette,
  PanelRightOpen,
  Paperclip,
  Pencil,
  Play,
  Plus,
  Presentation,
  Printer,
  Puzzle,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  ScanLine,
  School,
  ScrollText,
  Search,
  Send,
  Settings,
  Share,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Square,
  Stethoscope,
  Trash,
  TriangleAlert,
  Undo,
  Users,
  Video,
  Wallet,
  WandSparkles,
  Workflow,
  Wrench,
  X,
  Zap,
} from "lucide-react";
const Icons: Record<string, LucideIcon> = {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Baby,
  BadgeCheck,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  Camera,
  ChartColumn,
  ChartNoAxesCombined,
  ChartPie,
  ChartSpline,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  CloudUpload,
  Copy,
  CreditCard,
  Database,
  Download,
  EllipsisVertical,
  Eye,
  FileChartColumn,
  FileDown,
  FileImage,
  FileText,
  FileWarning,
  Film,
  Flower,
  Folder,
  FolderTree,
  Gauge,
  GitBranch,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  HeartHandshake,
  HeartPulse,
  Image,
  Images,
  Import,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Leaf,
  Link,
  ListChecks,
  LockKeyhole,
  Map,
  Menu,
  MessageSquare,
  MessageSquareHeart,
  MessagesSquare,
  Monitor,
  MonitorPlay,
  Package,
  Palette,
  PanelRightOpen,
  Paperclip,
  Pencil,
  Play,
  Plus,
  Presentation,
  Printer,
  Puzzle,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  ScanLine,
  School,
  ScrollText,
  Search,
  Send,
  Settings,
  Share,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Square,
  Stethoscope,
  Trash,
  TriangleAlert,
  Undo,
  Users,
  Video,
  Wallet,
  WandSparkles,
  Workflow,
  Wrench,
  X,
  Zap,
};
import type { LucideIcon } from "lucide-react";
import {
  API,
  tr,
  type Bootstrap,
  type Command,
  type Locale,
  type Tri,
} from "../types";
import s from "./workspace.module.css";
export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const C =
    (Icons as unknown as Record<string, LucideIcon>)[name] || Icons.Sparkles;
  return <C size={size} aria-hidden="true" />;
}
export const UI = createContext<{
  locale: Locale;
  boot: Bootstrap;
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
  open: (id: string, tab?: string, language?: Locale) => void;
  create: (
    kind?: string,
    family?: string,
    prepared?: Partial<DceRecord>,
  ) => void;
  preview: (id: string, releaseId?: string, language?: Locale) => void;
}>({} as never);
export const useUI = () => useContext(UI);
export function T({ v }: { v: Tri }) {
  return <>{tr(v, useUI().locale)}</>;
}
export async function query<T = any>(
  params: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)]),
  );
  const deadline = AbortSignal.timeout(30000);
  const r = await fetch(API + "?" + qs, {
    signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new DceRequestError(
      j.error?.message || "DCE request failed.",
      j.error?.code,
      j.error?.details,
    );
  return j.data;
}
export class DceRequestError extends Error {
  code: string;
  details: unknown;
  constructor(message: string, code = "REQUEST_FAILED", details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
export async function mutate<T = any>(command: Partial<Command>): Promise<T> {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...command,
      requestId: command.requestId || crypto.randomUUID(),
    }),
    signal: AbortSignal.timeout(60000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new DceRequestError(
      j.error?.message || "DCE operation failed.",
      j.error?.code,
      j.error?.details,
    );
  return j.data;
}
export function useQuery<T>(params: Record<string, unknown>, fallback: T) {
  const key = JSON.stringify(params),
    [result, setResult] = useState<{ key: string; value: T } | null>(null),
    [pending, setPending] = useState(""),
    [error, setError] = useState<{ key: string; message: string } | null>(null),
    [stamp, setStamp] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setPending(key);
    setError(null);
    query<T>(JSON.parse(key), controller.signal)
      .then((value) => {
        if (active) setResult({ key, value });
      })
      .catch((e) => {
        if (active && e.name !== "AbortError")
          setError({ key, message: e.message });
      })
      .finally(() => {
        if (active) setPending("");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [key, stamp]);
  return {
    value: result?.key === key ? result.value : fallback,
    loading: result?.key !== key && error?.key !== key,
    refreshing: pending === key,
    error: error?.key === key ? error.message : "",
    reload: () => setStamp((v) => v + 1),
  };
}

export function Button({
  children,
  icon,
  onClick,
  disabled,
  kind = "secondary",
  type = "button",
  title,
  ariaLabel,
  path,
}: {
  children: ReactNode;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  kind?: string;
  type?: "button" | "submit";
  title?: string;
  ariaLabel?: string;
  path?: string;
}) {
  return (
    <button
      type={type}
      data-dce-path={path}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`${s.button} ${s[kind] || ""}`}
    >
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  );
}
export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`${s.badge} ${s[tone] || ""}`}>{children}</span>;
}
export function Empty({
  icon = "Layers",
  title,
  detail,
  action,
}: {
  icon?: string;
  title: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>
        <Icon name={icon} size={26} />
      </span>
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  );
}
export function State({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
  children: ReactNode;
}) {
  return error ? (
    <div className={s.notice} role="alert">
      <Icon name="TriangleAlert" />
      <div>
        {error}
        <br />
        <Button onClick={retry} icon="RotateCcw">
          <T v={["Retry", "Réessayer", "إعادة المحاولة"]} />
        </Button>
      </div>
    </div>
  ) : loading ? (
    <div className={s.loading} role="status">
      <span className={s.spinner} />
      <T
        v={[
          "Reading scoped records…",
          "Lecture des dossiers…",
          "قراءة السجلات…",
        ]}
      />
    </div>
  ) : (
    <>{children}</>
  );
}
export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${s.panel} ${className}`}>
      {(title || actions) && (
        <header className={s.panelHeader}>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className={s.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
export function Field({
  label,
  hint,
  children,
  path,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  path?: string;
}) {
  const id = useId(),
    simple =
      isValidElement(children) &&
      typeof children.type === "string" &&
      ["input", "select", "textarea"].includes(children.type);
  return simple ? (
    <label className={s.field} data-field={id} data-dce-path={path}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  ) : (
    <fieldset className={s.field} data-field={id} data-dce-path={path}>
      <legend>{label}</legend>
      {children}
      {hint && <small>{hint}</small>}
    </fieldset>
  );
}
export function Switch({
  label,
  value,
  onChange,
  disabled,
  path,
}: {
  label: ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  path?: string;
}) {
  return (
    <label className={s.switch} data-dce-path={path}>
      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span aria-hidden="true" />
      <strong>{label}</strong>
    </label>
  );
}
export function Dialog({
  title,
  children,
  footer,
  onClose,
  wide = false,
  drawer = false,
  workspace = false,
}: {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  drawer?: boolean;
  workspace?: boolean;
}) {
  const { locale } = useUI();
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    node?.showModal();
    return () => {
      node?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${s.dialog} ${wide ? s.wide : ""} ${drawer ? s.drawer : ""} ${workspace ? s.workspaceDialog : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button
          type="button"
          className={s.iconButton}
          aria-label={tr(
            ["Close dialog", "Fermer la fenêtre", "إغلاق النافذة"],
            locale,
          )}
          onClick={onClose}
        >
          <Icon name="X" />
        </button>
      </header>
      <div className={s.dialogBody}>{children}</div>
      {footer && <footer>{footer}</footer>}
    </dialog>
  );
}
export function handleTablistKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]"),
  ).filter((tab) => !tab.disabled);
  const current = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[role=tab]",
  );
  if (!current || !event.currentTarget.contains(current) || !tabs.length)
    return;
  const index = tabs.indexOf(current);
  if (index < 0) return;
  const rtl = Boolean(event.currentTarget.closest("[dir=rtl]"));
  const direction = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (index + direction + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[next]?.focus();
  tabs[next]?.click();
}
export function Pager({
  total,
  page,
  size,
  onPage,
}: {
  total: number;
  page: number;
  size: number;
  onPage: (n: number) => void;
}) {
  const { locale } = useUI();
  const count = Math.max(1, Math.ceil(total / size));
  return (
    <div className={s.pager}>
      <span>
        {total.toLocaleString(locale)} <T v={["records", "dossiers", "سجل"]} />{" "}
        · {page}/{count}
      </span>
      <div className={s.actions}>
        <Button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          icon={locale === "ar" ? "ChevronRight" : "ChevronLeft"}
        >
          <T v={["Previous", "Précédent", "السابق"]} />
        </Button>
        <Button
          disabled={page >= count}
          onClick={() => onPage(page + 1)}
          icon={locale === "ar" ? "ChevronLeft" : "ChevronRight"}
        >
          <T v={["Next", "Suivant", "التالي"]} />
        </Button>
      </div>
    </div>
  );
}
export function download(name: string, body: string, type = "text/plain") {
  const u = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 500);
}
/** A failed response keeps its command identity; a changed command gets a fresh receipt. */
export function useReceiptMutation() {
  const receipts = useRef(new globalThis.Map<string, string>());
  return async <T = any,>(command: Partial<Command>): Promise<T> => {
    const payload = JSON.stringify(command);
    let id = command.requestId || receipts.current.get(payload);
    if (!id) {
      id = crypto.randomUUID();
      if (receipts.current.size > 32)
        receipts.current.delete(receipts.current.keys().next().value!);
      receipts.current.set(payload, id);
    }
    const result = await mutate<T>({ ...command, requestId: id });
    receipts.current.delete(payload);
    return result;
  };
}

/** Safe view and form recovery is isolated by actor + native scope + workspace. */
export function useWorkingState<T>(name: string, initial: T | (() => T)) {
  const { boot, notify, locale } = useUI(),
    key =
      "dce.r6.view." +
      boot.actor.id +
      "." +
      String(boot.health.scopeKey || "global") +
      "." +
      name;
  const fresh = () =>
    typeof initial === "function" ? (initial as () => T)() : initial;
  const [value, setValue] = useState<T>(fresh);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "null");
      if (saved?.version === 1) setValue(saved.value);
    } catch {}
  }, [key]);
  const warned = useRef(false);
  function set(next: T | ((old: T) => T)) {
    setValue((old) => {
      const n = typeof next === "function" ? (next as (o: T) => T)(old) : next;
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            value: n,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        if (!warned.current) {
          warned.current = true;
          queueMicrotask(() =>
            notify(
              tr(
                [
                  "Local recovery storage is unavailable. Keep this tab open or save before leaving.",
                  "Le stockage de reprise local est indisponible. Enregistrez avant de quitter.",
                  "التخزين المحلي للاستعادة غير متاح. احفظ قبل المغادرة.",
                ],
                locale,
              ),
              true,
            ),
          );
        }
      }
      return n;
    });
  }
  const clear = () => {
    try {
      sessionStorage.removeItem(key);
    } catch {}
    setValue(fresh());
  };
  return [value, set, clear] as const;
}
