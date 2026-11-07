"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  RefreshCw,
  X,
  ExternalLink,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Users,
  CreditCard,
  Wallet,
  GraduationCap,
  MessageCircle,
  BriefcaseBusiness,
  Truck,
  Layers,
  AlertTriangle,
  CheckCheck,
  Archive,
  Clock,
  Pin,
  Check,
  ChevronDown,
  Search,
  Activity,
} from "lucide-react";
import { API_PATH, CENTER_PATH, SOURCE_BY_ID } from "./registry";
import {
  badge,
  coverage,
  quietNow,
  EMPTY_FILTER,
  type Feed,
  type Filter,
  type Locale,
  type Notice,
} from "./model";
import { copy, familyLabel, timeGroup, timeLabel } from "./copy";
import { useNotifications } from "./client";
import styles from "./notifications.module.css";
const worldNames = {
  angelcare: "AngelCare",
  kidflix: "KidFlix",
  jobkix: "JOBKIX",
};
const familyIcon = (f: string) =>
  f === "orders"
    ? ShoppingBag
    : f === "identity" || f === "crm"
      ? Users
      : f === "payments" || f === "finance"
        ? CreditCard
        : f === "wallet"
          ? Wallet
          : f === "academy" || f === "certification"
            ? GraduationCap
            : f === "hotline" || f === "cases"
              ? MessageCircle
              : f === "recruitment" || f === "supply"
                ? BriefcaseBusiness
                : f === "operations" || f === "suppliers"
                  ? Truck
                  : f === "quality" || f === "security" || f === "governance"
                    ? ShieldCheck
                    : f === "engagement"
                      ? Activity
                      : Layers;
function severityLabel(n: Notice, l: Locale) {
  const c = copy(l);
  return n.severity === "critical"
    ? c.criticalLabel
    : n.severity === "attention"
      ? c.attentionLabel
      : n.severity === "positive"
        ? c.positiveLabel
        : c.infoLabel;
}
export function NoticeCard({
  notice: n,
  locale: l,
  busy,
  onAction,
}: {
  notice: Notice;
  locale: Locale;
  busy: boolean;
  onAction: (action: string, n: Notice) => void;
}) {
  const c = copy(l),
    source = SOURCE_BY_ID.get(n.source),
    Icon = familyIcon(source?.family || ""),
    status = String(
      n.safe.status ||
        n.safe.state ||
        n.safe.lifecycle ||
        n.safe.operation ||
        "",
    ),
    reference = String(
      n.safe.public_reference || n.safe.reference || n.safe.id || n.id,
    ),
    due = n.safe.due_at || n.safe.expires_at;
  return (
    <article
      className={styles.card}
      data-severity={n.severity}
      data-unread={n.unread}
      data-world={n.world}
    >
      <div className={styles.cardIcon}>
        <Icon size={19} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.world} data-world={n.world}>
            {worldNames[n.world]}
          </span>
          <span className={styles.severity}>{severityLabel(n, l)}</span>
          {n.unread && (
            <span className={styles.unreadDot} aria-label={c.unread} />
          )}{" "}
          {n.pinned && <Pin size={12} aria-label={c.pin} />}
          <time dateTime={n.at} title={timeLabel(n.at, l, true)}>
            {timeLabel(n.at, l)}
          </time>
        </div>
        <a
          className={styles.primary}
          href={API_PATH + "/open?id=" + n.id}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onAction("read", n)}
          aria-label={
            familyLabel(source?.family || "", l) +
            " · " +
            reference +
            " · " +
            c.open
          }
        >
          <strong>{familyLabel(source?.family || "", l)}</strong>
          <ExternalLink size={14} />
        </a>
        <p className={styles.sourceLabel}>{source?.label || n.source}</p>
        <div className={styles.reference}>{reference}</div>
        <div className={styles.facts}>
          <span>{status}</span>
          {n.actionable && (
            <span className={styles.actionPill}>{c.action}</span>
          )}
          {n.eventCount > 1 && (
            <span>
              {n.eventCount} {c.events}
            </span>
          )}
          {n.safe.total_count !== undefined && (
            <span>Σ {String(n.safe.total_count)}</span>
          )}
        </div>
        {due && (
          <small className={styles.deadline}>
            <Clock size={12} />
            {timeLabel(String(due), l, true)}
          </small>
        )}
        {(n.safe.type || n.safe.event_key || n.safe.event_type) && (
          <small className={styles.eventCode}>
            {String(n.safe.type || n.safe.event_key || n.safe.event_type)}
          </small>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction(n.unread ? "read" : "unread", n)}
          >
            <CheckCheck size={14} />
            {n.unread ? c.read : c.notRead}
          </button>
          <details>
            <summary aria-label={c.details}>
              <ChevronDown size={16} />
            </summary>
            <div className={styles.actionMenu}>
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction("pin", n)}
              >
                <Pin size={14} />
                {c.pin}
              </button>
              <button
                type="button"
                disabled={busy || (n.severity === "critical" && n.actionable)}
                onClick={() => onAction("snooze", n)}
              >
                <Clock size={14} />
                {c.snooze}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction("unsnooze", n)}
              >
                {c.unsnooze}
              </button>
              <button
                type="button"
                disabled={busy || (n.severity === "critical" && n.actionable)}
                onClick={() => onAction("archive", n)}
              >
                <Archive size={14} />
                {c.archive}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction("unarchive", n)}
              >
                {c.unarchive}
              </button>
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}
export function CoveragePanel({
  feed,
  locale: l,
  onPreview,
}: {
  feed: Feed;
  locale: Locale;
  onPreview?: (id: string) => void;
}) {
  const c = copy(l),
    h = coverage(feed);
  return (
    <section className={styles.health}>
      <h3>{c.sources}</h3>
      <div className={styles.healthGrid}>
        <span>
          <b>
            {feed.health.sources.filter((s) => s.state === "connected").length}
          </b>
          {c.healthy}
        </span>
        <span>
          <b>{h.blocked}</b>
          {c.partial}
        </span>
        <span>
          <b>{feed.health.pending}</b>
          {c.pending}
        </span>
      </div>
      <p>
        {c.lastWorker}:{" "}
        {feed.health.worker.lastSuccess
          ? timeLabel(feed.health.worker.lastSuccess, l, true)
          : "—"}
      </p>
      {feed.health.worker.stale && <p role="status">{c.stale}</p>}
      <div className={styles.sourceHealth}>
        {feed.health.sources.map((s) => (
          <details key={s.id}>
            <summary>
              <i data-state={s.state} />
              <span>{SOURCE_BY_ID.get(s.id)?.label || s.id}</span>
              <b>{s.state}</b>
            </summary>
            <dl>
              <dt>{c.reason}</dt>
              <dd>{s.reason}</dd>
              <dt>{c.lastCapture}</dt>
              <dd>{s.lastCapture ? timeLabel(s.lastCapture, l, true) : "—"}</dd>
              <dt>{c.verifiedAt}</dt>
              <dd>{timeLabel(s.checkedAt, l, true)}</dd>
            </dl>
            {onPreview && (
              <button type="button" onClick={() => onPreview(s.id)}>
                {c.details}
              </button>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
function SourceOperations({
  feed,
  locale: l,
  command,
}: {
  feed: Feed;
  locale: Locale;
  command: (body: Record<string, unknown>) => Promise<Record<string, unknown>>;
}) {
  const c = copy(l),
    labels =
      l === "ar"
        ? [
            "إدارة المصدر",
            "المبرر",
            "حفظ القاعدة",
            "إعادة محاولة 100 حدث فاشل",
            "معاينة الاسترجاع",
            "تطبيق الاسترجاع",
            "أيام التنبيه قبل الانتهاء",
            "الحد الأدنى للأولوية",
          ]
        : l === "en"
          ? [
              "Source operations",
              "Reason",
              "Save rule",
              "Retry 100 failed events",
              "Preview backfill",
              "Apply backfill",
              "Expiry warning days",
              "Minimum severity",
            ]
          : [
              "Pilotage de la source",
              "Justification",
              "Enregistrer la règle",
              "Relancer 100 événements en échec",
              "Prévisualiser la reprise",
              "Appliquer la reprise",
              "Jours avant expiration",
              "Priorité minimale",
            ];
  const [source, setSource] = useState(feed.health.sources[0]?.id || ""),
    [severity, setSeverity] = useState("info"),
    [days, setDays] = useState(7),
    [reason, setReason] = useState(""),
    [result, setResult] = useState(""),
    [pending, setPending] = useState(false),
    [after, setAfter] = useState<string | null>(null),
    [preview, setPreview] = useState(false);
  const rule = feed.rules?.[source];
  useEffect(() => {
    setSeverity(rule?.minimumSeverity || "info");
    setDays(rule?.expiryWarningDays ?? 7);
    setAfter(null);
    setPreview(false);
  }, [source, rule?.minimumSeverity, rule?.expiryWarningDays]);
  async function run(action: string) {
    setPending(true);
    setResult("");
    try {
      const r = await command({
        action,
        source,
        reason,
        minimumSeverity: severity,
        expiryWarningDays: days,
        after,
      });
      setResult(JSON.stringify(r));
      if (action === "backfill_preview") setPreview(true);
      if (action === "backfill_apply") {
        setAfter(typeof r.cursor === "string" ? r.cursor : null);
        setPreview(false);
      }
    } catch {
      setResult(c.saveFailed);
    } finally {
      setPending(false);
    }
  }
  return (
    <details className={styles.preferences}>
      <summary>{labels[0]}</summary>
      <p>{c.noBusinessChange}</p>
      <label>
        {c.filter}
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          {feed.health.sources.map((s) => (
            <option key={s.id} value={s.id}>
              {SOURCE_BY_ID.get(s.id)?.label || s.id}
            </option>
          ))}
        </select>
      </label>
      <small>
        R{rule?.version || 0} · {SOURCE_BY_ID.get(source)?.family}
      </small>
      <label>
        {labels[7]}
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="info">{c.infoLabel}</option>
          <option value="attention">{c.attentionLabel}</option>
          <option value="critical">{c.criticalLabel}</option>
        </select>
      </label>
      <label>
        {labels[6]}
        <input
          type="number"
          min="0"
          max="90"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </label>
      <label>
        {labels[1]}
        <input
          type="text"
          minLength={8}
          maxLength={160}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <div className={styles.operatorActions}>
        {[
          "source_rule",
          "retry_source",
          "backfill_preview",
          "backfill_apply",
        ].map((action, i) => (
          <button
            key={action}
            type="button"
            disabled={
              pending ||
              reason.trim().length < 8 ||
              (action === "backfill_apply" && !preview)
            }
            onClick={() => void run(action)}
          >
            {labels[i + 2]}
          </button>
        ))}
      </div>
      <output className={styles.operationResult} aria-live="polite">
        {result}
      </output>
    </details>
  );
}
function PreferencesPanel({
  feed,
  locale: l,
  onSave,
  busy,
}: {
  feed: Feed;
  locale: Locale;
  onSave: (command: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const c = copy(l),
    [muted, setMuted] = useState(feed.preferences.muted_sources || []),
    [locale, setLocale] = useState<Locale>(feed.preferences.locale || l),
    [start, setStart] = useState(
      feed.preferences.quiet_start?.toString() || "",
    ),
    [end, setEnd] = useState(feed.preferences.quiet_end?.toString() || "");
  return (
    <section className={styles.preferences}>
      <h3>{c.preferences}</h3>
      <p>{c.hiddenRoutine}</p>
      <label>
        {c.locale}
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </label>
      <fieldset>
        <legend>{c.quiet}</legend>
        <input
          aria-label="Start hour"
          type="number"
          min="0"
          max="23"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <span>→</span>
        <input
          aria-label="End hour"
          type="number"
          min="0"
          max="23"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </fieldset>
      <fieldset>
        <legend>{c.muted}</legend>
        <div className={styles.mutedList}>
          {feed.health.sources.map((s) => (
            <label key={s.id}>
              <input
                type="checkbox"
                checked={muted.includes(s.id)}
                onChange={() =>
                  setMuted((a) =>
                    a.includes(s.id)
                      ? a.filter((x) => x !== s.id)
                      : [...a, s.id],
                  )
                }
              />
              {SOURCE_BY_ID.get(s.id)?.label || s.id}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        className={styles.solid}
        disabled={busy}
        onClick={() =>
          onSave({
            action: "preferences",
            locale,
            mutedSources: muted,
            quietStart: start === "" ? null : Number(start),
            quietEnd: end === "" ? null : Number(end),
          })
        }
      >
        <Check size={15} />
        {c.save}
      </button>
    </section>
  );
}
export function NotificationCenter({
  embedded = false,
  initialLocale = "fr",
}: {
  embedded?: boolean;
  initialLocale?: Locale;
}) {
  const [open, setOpen] = useState(embedded),
    [mounted, setMounted] = useState(false),
    [mobile, setMobile] = useState(false),
    [filter, setFilter] = useState<Filter>({
      ...EMPTY_FILTER,
      view: embedded ? "all" : "unread",
    }),
    [tab, setTab] = useState<"feed" | "health" | "preferences">("feed"),
    [message, setMessage] = useState(""),
    [batch, setBatch] = useState<{ token: string; affected: number } | null>(
      null,
    ),
    [position, setPosition] = useState({ top: 64, right: 16 });
  const bell = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null),
    scroller = useRef<HTMLDivElement>(null),
    id = useId();
  const reading = useCallback(
    () => !!scroller.current && scroller.current.scrollTop > 24,
    [],
  );
  const state = useNotifications(open, filter, reading),
    { feed, busy, error } = state,
    l = feed?.preferences.locale || feed?.locale || initialLocale,
    c = copy(l),
    health = feed ? coverage(feed) : null;
  useEffect(() => {
    setMounted(true);
  }, []);
  const close = useCallback(() => {
    if (busy || embedded) return;
    setOpen(false);
    bell.current?.focus();
  }, [busy, embedded]);
  useEffect(() => {
    if (!open || embedded) return;
    const measure = () => {
      const r = bell.current?.getBoundingClientRect();
      setMobile(window.innerWidth <= 640);
      if (r)
        setPosition({
          top: Math.min(r.bottom + 10, Math.max(60, window.innerHeight - 250)),
          right: Math.max(
            12,
            Math.min(window.innerWidth - r.right, window.innerWidth - 580),
          ),
        });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab" && window.innerWidth <= 640) {
        const els = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input,select,summary,[tabindex="0"]',
          ) || [],
        ).filter((el) => el.getClientRects().length > 0);
        if (!els.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const outside = (e: PointerEvent) => {
      if (
        !panel.current?.contains(e.target as Node) &&
        !bell.current?.contains(e.target as Node)
      )
        close();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    requestAnimationFrame(() =>
      panel.current?.querySelector<HTMLButtonElement>("button")?.focus(),
    );
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, embedded, close]);
  useEffect(() => {
    if (!open || !mobile || embedded || !panel.current) return;
    const parent = panel.current.parentElement,
      others = Array.from(document.body.children).filter(
        (n) => n !== parent,
      ) as HTMLElement[],
      before = others.map((n) => n.inert),
      overflow = document.body.style.overflow;
    others.forEach((n) => {
      n.inert = true;
    });
    document.body.style.overflow = "hidden";
    return () => {
      others.forEach((n, i) => {
        n.inert = before[i];
      });
      document.body.style.overflow = overflow;
    };
  }, [open, mobile, embedded]);
  async function execute(command: Record<string, unknown>) {
    setMessage("");
    try {
      const result = await state.command(command);
      if (command.action === "prepare_read_all") {
        setBatch(result as { token: string; affected: number });
        return;
      }
      if (command.action === "apply_read_all") setBatch(null);
      if (command.action === "preferences") setMessage(c.saved);
      await state.refresh(true);
    } catch {
      setMessage(c.saveFailed);
    }
  }
  function act(action: string, n: Notice) {
    void execute({
      action,
      id: n.id,
      version: n.version,
      ...(action === "snooze"
        ? { until: new Date(Date.now() + 3600000).toISOString() }
        : {}),
    });
  }
  function change(patch: Partial<Filter>) {
    setBatch(null);
    setFilter((f) => ({ ...f, ...patch }));
    scroller.current?.scrollTo({ top: 0 });
  }
  const healthText = error
    ? c.error
    : !feed
      ? c.unavailable
      : health?.stale
        ? c.stale
        : health?.blocked
          ? c.partial
          : feed.health.failed
            ? c.error
            : health?.lag
              ? c.pending
              : c.healthy;
  const body = (
    <div
      className={styles.portal}
      data-embedded={embedded}
      data-mobile={mobile}
    >
      {!embedded && mobile && (
        <div className={styles.backdrop} aria-hidden="true" />
      )}
      <div
        ref={panel}
        id={id}
        className={embedded ? styles.embedded : styles.panel}
        style={
          embedded || mobile
            ? undefined
            : { top: position.top, right: position.right }
        }
        role={embedded ? "region" : "dialog"}
        aria-modal={!embedded && mobile ? true : undefined}
        aria-label={c.title}
        dir={l === "ar" ? "rtl" : "ltr"}
        lang={l}
      >
        <header className={styles.header}>
          <div className={styles.headingIcon}>
            <Bell size={22} />
          </div>
          <div>
            <small>{c.intro}</small>
            <h2>
              {c.title}
              <span>{feed && !error ? feed.counts.unread : "—"}</span>
            </h2>
          </div>
          <div className={styles.headerButtons}>
            <button
              type="button"
              title={c.refresh}
              aria-label={c.refresh}
              disabled={busy}
              onClick={() => void state.refresh(true)}
            >
              <RefreshCw size={17} />
            </button>
            <button
              type="button"
              title={c.preferences}
              aria-label={c.preferences}
              onClick={() =>
                setTab((t) => (t === "preferences" ? "feed" : "preferences"))
              }
            >
              <Settings2 size={17} />
            </button>
            {!embedded && (
              <button
                type="button"
                disabled={busy}
                aria-label={c.close}
                onClick={close}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </header>
        <div
          className={styles.connection}
          data-degraded={error || !health?.complete}
        >
          <span />
          {healthText}
          {feed && (
            <time title={timeLabel(feed.generatedAt, l, true)}>
              {timeLabel(feed.generatedAt, l)}
            </time>
          )}
        </div>
        <nav className={styles.worldTabs} aria-label={c.scope}>
          {(["all", "angelcare", "kidflix", "jobkix"] as const).map((w) => (
            <button
              type="button"
              key={w}
              data-world={w}
              aria-pressed={filter.world === w}
              onClick={() => {
                change({ world: w });
                setTab("feed");
              }}
            >
              {w === "all" ? c.all : worldNames[w]}
              <b>
                {feed
                  ? w === "all"
                    ? feed.counts.unread
                    : feed.counts.worlds[w] || 0
                  : "—"}
              </b>
            </button>
          ))}
        </nav>
        <div className={styles.tools}>
          <div className={styles.viewTabs}>
            {(["unread", "action", "critical", "all", "archived"] as const).map(
              (v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={tab === "feed" && filter.view === v}
                  onClick={() => {
                    change({ view: v });
                    setTab("feed");
                  }}
                >
                  {v === "all"
                    ? c.allViews
                    : v === "archived"
                      ? c.archived
                      : c[v]}
                </button>
              ),
            )}
          </div>
          <button
            className={styles.coverageButton}
            type="button"
            aria-pressed={tab === "health"}
            onClick={() => setTab((t) => (t === "health" ? "feed" : "health"))}
          >
            <ShieldCheck size={14} />
            {c.sources}
            {health && health.blocked > 0 && <b>{health.blocked}</b>}
          </button>
        </div>
        {tab === "feed" && (
          <div className={styles.filters}>
            <label className={styles.search}>
              <Search size={15} />
              <input
                value={filter.query}
                onChange={(e) => change({ query: e.target.value })}
                placeholder={c.search}
                aria-label={c.search}
              />
            </label>
            <select
              value={filter.source}
              onChange={(e) => change({ source: e.target.value })}
              aria-label={c.filter}
            >
              <option value="">
                {c.filter} · {c.all}
              </option>
              {feed?.health.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {SOURCE_BY_ID.get(s.id)?.label || s.id}
                </option>
              ))}
            </select>
            <select
              value={filter.severity}
              onChange={(e) => change({ severity: e.target.value })}
              aria-label={c.severity}
            >
              <option value="all">
                {c.severity} · {c.all}
              </option>
              {(["critical", "attention", "positive", "info"] as const).map(
                (v) => (
                  <option key={v} value={v}>
                    {c[(v + "Label") as "criticalLabel"]}
                  </option>
                ),
              )}
            </select>
          </div>
        )}
        <div className={styles.message} aria-live="polite">
          {message}
        </div>
        {state.arrivals &&
          tab === "feed" &&
          (!feed ||
            !quietNow(feed.preferences) ||
            feed.counts.critical > 0) && (
            <button
              type="button"
              className={styles.arrivals}
              onClick={() => {
                state.showArrivals();
                scroller.current?.scrollTo({ top: 0 });
              }}
            >
              {c.newItems}
            </button>
          )}
        <div ref={scroller} className={styles.scroll} aria-busy={busy}>
          {!feed ? (
            <div className={styles.empty}>
              <AlertTriangle size={30} />
              <p>{healthText}</p>
              <button type="button" onClick={() => void state.refresh(true)}>
                {c.refresh}
              </button>
            </div>
          ) : tab === "health" ? (
            <>
              <CoveragePanel
                feed={feed}
                locale={l}
                onPreview={(source) => {
                  change({ source, view: "all" });
                  setTab("feed");
                }}
              />
              {feed.canManage && (
                <SourceOperations
                  feed={feed}
                  locale={l}
                  command={async (body) => {
                    const r = await state.command(body);
                    await state.refresh(true);
                    return r;
                  }}
                />
              )}
            </>
          ) : tab === "preferences" ? (
            <PreferencesPanel
              feed={feed}
              locale={l}
              onSave={(command) => void execute(command)}
              busy={busy}
            />
          ) : (
            <>
              {feed.items.some(
                (n) => n.actionable && n.severity === "critical",
              ) && (
                <div className={styles.sectionLabel}>
                  <AlertTriangle size={13} />
                  {c.critical}
                </div>
              )}
              {feed.items
                .filter((n) => n.actionable && n.severity === "critical")
                .map((n) => (
                  <NoticeCard
                    key={n.id}
                    notice={n}
                    locale={l}
                    busy={busy}
                    onAction={act}
                  />
                ))}
              {feed.items
                .filter((n) => !(n.actionable && n.severity === "critical"))
                .map((n, i, a) => (
                  <div key={n.id}>
                    {(!i ||
                      timeGroup(a[i - 1].at, l) !== timeGroup(n.at, l)) && (
                      <div className={styles.sectionLabel}>
                        {timeGroup(n.at, l)}
                      </div>
                    )}
                    <NoticeCard
                      notice={n}
                      locale={l}
                      busy={busy}
                      onAction={act}
                    />
                  </div>
                ))}
              {!feed.items.length && (
                <div className={styles.empty}>
                  <CheckCheck size={30} />
                  <p>{feed.health.sources.length ? c.empty : c.noSources}</p>
                  {!health?.complete && <small>{healthText}</small>}
                </div>
              )}
              {!!feed.cursor && feed.items.length >= 30 && (
                <button
                  className={styles.load}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void state.refresh(false, feed.cursor || undefined)
                  }
                >
                  {c.load}
                  <ChevronDown size={14} />
                </button>
              )}
            </>
          )}
        </div>
        {tab === "feed" && (
          <footer className={styles.footer}>
            {batch ? (
              <div className={styles.batch}>
                <strong>
                  {batch.affected} {c.review}
                </strong>
                <button
                  className={styles.solid}
                  disabled={busy}
                  onClick={() =>
                    void execute({
                      action: "apply_read_all",
                      token: batch.token,
                    })
                  }
                >
                  {c.confirm}
                </button>
                <button disabled={busy} onClick={() => setBatch(null)}>
                  {c.cancel}
                </button>
              </div>
            ) : (
              <>
                <a href={CENTER_PATH} target="_blank" rel="noopener noreferrer">
                  {c.history}
                  <ExternalLink size={13} />
                </a>
                <button
                  disabled={busy || !feed}
                  onClick={() =>
                    void execute({ action: "prepare_read_all", filter })
                  }
                >
                  <CheckCheck size={14} />
                  {c.markAll}
                </button>
              </>
            )}
            <small>{c.noBusinessChange}</small>
          </footer>
        )}
      </div>
    </div>
  );
  return (
    <>
      {!embedded && (
        <button
          ref={bell}
          disabled={busy}
          className={styles.bell}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={id}
          aria-label={
            c.title +
            " · " +
            (feed && !error ? feed.counts.unread + " " + c.known : healthText)
          }
          onClick={() => setOpen((v) => !v)}
        >
          <Bell size={19} />
          {(error ? "!" : badge(feed)) && (
            <span className={styles.badge}>{error ? "!" : badge(feed)}</span>
          )}
          {!!feed?.counts.critical && (
            <i className={styles.criticalMarker} aria-label={c.critical} />
          )}
        </button>
      )}
      {embedded
        ? body
        : mounted && open
          ? createPortal(body, document.body)
          : null}
    </>
  );
}
