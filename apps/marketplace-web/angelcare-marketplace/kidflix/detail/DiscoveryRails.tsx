"use client";
import { CardShare } from "./Social";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { I } from "../Icons";
import { path, tr, world, type Locale, type Resource } from "../catalogue";
import { useGuest } from "../continuity";
import { num, obj, str, type Row } from "./model";
import { Button, ErrorNote } from "./shared";
import { t } from "./copy";
import s from "./detail.module.css";
import { usePersonal } from "../journey/store";
import { j } from "../journey/copy";
import { emitVisitor } from "../journey/events";
const copy = {
  documents: [
    "More good reads",
    "Encore de belles lectures",
    "المزيد من القراءات",
  ],
  printables: [
    "More little things to print",
    "Encore de belles choses à imprimer",
    "المزيد من الأشياء الجميلة للطباعة",
  ],
  stories: [
    "More stories to discover",
    "Encore des histoires à découvrir",
    "المزيد من القصص للاكتشاف",
  ],
  learning: [
    "Keep your learning going",
    "Poursuivez vos découvertes",
    "واصل رحلة تعلمك",
  ],
  video: ["Your next watch", "Votre prochaine vidéo", "مشاهدتك التالية"],
  audio: ["More to listen to", "Encore à écouter", "المزيد للاستماع"],
  "visual-cards": [
    "More visual card sets",
    "Encore des jeux de cartes",
    "المزيد من مجموعات البطاقات",
  ],
  presentations: [
    "More ideas to explore",
    "Encore des idées à explorer",
    "المزيد من الأفكار للاستكشاف",
  ],
  assessments: [
    "Another little challenge?",
    "Un autre petit défi ?",
    "هل تجرب تحدياً آخر؟",
  ],
  activities: ["Keep the play going", "Prolongez le jeu", "واصل اللعب"],
  tools: [
    "More tools for curious minds",
    "Encore des outils pour les curieux",
    "المزيد من الأدوات للعقول الفضولية",
  ],
  planners: [
    "Plan another lovely moment",
    "Organisez un autre beau moment",
    "خطط للحظة جميلة أخرى",
  ],
  forms: [
    "More personal discoveries",
    "Encore des découvertes personnelles",
    "المزيد من الاكتشافات الشخصية",
  ],
  community: [
    "Keep exploring together",
    "Continuons à explorer",
    "واصل الاستكشاف معنا",
  ],
  commerce: [
    "More useful discoveries",
    "Encore des découvertes utiles",
    "المزيد من الاكتشافات المفيدة",
  ],
  bundles: [
    "Your next little adventure",
    "Votre prochaine petite aventure",
    "مغامرتك الصغيرة التالية",
  ],
} as const;
export function ResourceCard({
  item,
  locale,
  reason,
}: {
  item: Resource & { facts?: Row };
  reason?: string;
  locale: Locale;
}) {
  const w = world(item.family)!,
    guest = useGuest(),
    saved = guest.saved.includes(item.key),
    label = ["video"].includes(item.family)
      ? t("watch", locale)
      : item.family === "audio"
        ? t("listen", locale)
        : item.family === "documents"
          ? t("read", locale)
          : t("open", locale),
    facts = obj(item.facts);
  return (
    <article className={s.resourceCard} data-family={item.family}>
      <div className={s.resourceImage}>
        <Link
          href={path(locale, "/experience/" + item.key)}
          tabIndex={-1}
          aria-hidden="true"
        >
          {item.image ? (
            <img src={item.image} alt="" loading="lazy" draggable={false} />
          ) : (
            <I name={w.icon} size={54} />
          )}
        </Link>
        <span className={s.resourceBadge} style={{ background: w.color }}>
          {tr(w.title, locale)}
        </span>
        <CardShare resourceKey={item.key} title={item.title} locale={locale} />
        <button
          className={s.heart}
          style={{ right: "auto", insetInlineEnd: 9 }}
          aria-label={t(saved ? "saved" : "save", locale) + " · " + item.title}
          aria-pressed={saved}
          onClick={() => guest.toggle(item.key)}
        >
          <I name="Bookmark" size={18} />
        </button>
      </div>
      <div className={s.resourceCopy}>
        <Link
          href={path(locale, "/experience/" + item.key)}
          className={s.resourceTitle}
        >
          {item.title}
        </Link>
        {reason ? <small>{reason}</small> : null}
        {item.summary ? <p>{item.summary}</p> : null}
        <div className={s.cardFacts}>
          {item.ageMin !== null && item.ageMax !== null ? (
            <span>
              {item.ageMin}–{item.ageMax}
            </span>
          ) : null}
          {item.duration ? <span>{item.duration} min</span> : null}
          {Object.entries(obj(facts.counts))
            .slice(0, 1)
            .map(([key, count]) => (
              <span key={key}>
                {String(count)} {key}
              </span>
            ))}
          {item.formats.map((format) => (
            <span key={format}>{format}</span>
          ))}
        </div>
        <Link
          href={path(locale, "/experience/" + item.key)}
          className={s.cardCTA}
        >
          {label} <I name="ArrowRight" size={15} />
        </Link>
      </div>
    </article>
  );
}
function Shelf({
  m,
  locale,
  shelf,
  title,
  context = {},
  excluded = [],
  register,
  includeCompleted = true,
}: {
  excluded?: string[];
  register?: (keys: string[]) => void;
  includeCompleted?: boolean;
  m: Row;
  locale: Locale;
  shelf: "family" | "topic" | "curated" | "skill" | "loved" | "popular";
  title: string;
  context?: Row;
}) {
  const personal = usePersonal();
  const [items, setItems] = useState<Resource[]>([]),
    [page, setPage] = useState(0),
    [total, setTotal] = useState(0),
    [more, setMore] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [loaded, setLoaded] = useState(false),
    rail = useRef<HTMLDivElement>(null),
    section = useRef<HTMLElement>(null),
    controller = useRef<AbortController | null>(null),
    flight = useRef(false),
    drag = useRef({ active: false, x: 0, scroll: 0, moved: false }),
    state = useRef({ page: 0, more: true });
  state.current = { page, more };
  const load = useCallback(async () => {
    if (flight.current || !state.current.more) return;
    flight.current = true;
    setBusy(true);
    setError(false);
    controller.current = new AbortController();
    const next = state.current.page + 1;
    try {
      const response = await fetch(
        "/api/kidflix/experience/" +
          encodeURIComponent(m.key) +
          "/related?" +
          new URLSearchParams({
            locale,
            shelf,
            page: String(next),
            ...(typeof context.score === "number"
              ? { score: String(context.score) }
              : {}),
            complete: String(context.complete === true),
          }),
        { signal: controller.current.signal },
      );
      if (!response.ok) throw Error("DISCOVERY_UNAVAILABLE");
      const value = await response.json();
      if (!Array.isArray(value.rows) || value.page !== next || value.rows.some((r: Row) => !r || !str(r.key) || !str(r.title) || !world(str(r.family)) || !Array.isArray(r.formats) || r.formats.some((format: unknown) => typeof format !== "string")))
        throw Error("INVALID_PAGE");
      const offset = rail.current?.scrollLeft || 0;
      setItems((old) => [
        ...new Map(
          [...old, ...value.rows].map((r: Resource) => [r.key, r]),
        ).values(),
      ]);
      setTotal(num(value.total));
      setPage(next);
      setMore(value.hasMore === true);
      setLoaded(true);
      requestAnimationFrame(() => {
        if (rail.current) rail.current.scrollLeft = offset;
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(true);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }, [m.key, locale, shelf, context.score, context.complete]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void load();
          observer.disconnect();
        }
      },
      { rootMargin: "500px" },
    );
    if (section.current) observer.observe(section.current);
    return () => {
      observer.disconnect();
      controller.current?.abort();
    };
  }, [load]);
  function progress() {
    const r = rail.current;
    if (
      r &&
      state.current.page > 0 &&
      r.scrollWidth > r.clientWidth + 1 &&
      Math.abs(r.scrollLeft) >= r.scrollWidth - r.clientWidth - 500 &&
      !error
    )
      void load();
  }
  function down(e: PointerEvent<HTMLDivElement>) {
    if (
      e.pointerType !== "mouse" ||
      e.button !== 0 ||
      (e.target as HTMLElement).closest("button,input,select")
    )
      return;
    drag.current = {
      active: true,
      x: e.clientX,
      scroll: e.currentTarget.scrollLeft,
      moved: false,
    };
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 7) {
      drag.current.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.scrollLeft = drag.current.scroll - dx;
    }
  }
  function end(e: PointerEvent<HTMLDivElement>) {
    drag.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  const dir = locale === "ar" ? -1 : 1,
    scroll = (n: number) => {
      rail.current?.scrollBy({
        left: n * dir * (rail.current.clientWidth * 0.85),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };
  const visible = items.filter(
    (r) =>
      !excluded.includes(r.key) &&
      (includeCompleted ||
        !personal.data.activity.some(
          (a) => a.key === r.key && a.locale === locale && a.complete,
        )),
  );
  useEffect(() => {
    register?.(visible.map((r) => r.key));
  }, [visible.map((r) => r.key).join(",")]);
  useEffect(() => {
    if (loaded && !visible.length && more && !error && page < 3) void load();
  }, [loaded, visible.length, more, error, page]);
  if (loaded && !visible.length && !error && !more) return null;
  return (
    <section
      ref={section}
      className={`${s.shelf} ${s["shelf_" + shelf] || ""}`}
      aria-label={title}
    >
      <header>
        <div>
          <span className={s.kicker}>{t("look", locale)}</span>
          <h2>{title}</h2>
          <small>{t("railHint", locale)}</small>
        </div>
        <div className={s.controls}>
          <Button
            onClick={() => scroll(-1)}
            aria-label={t("previous", locale)}
            icon="ChevronLeft"
          >
            {t("previous", locale)}
          </Button>
          <Button
            onClick={() => scroll(1)}
            aria-label={t("next", locale)}
            icon="ChevronRight"
          >
            {t("next", locale)}
          </Button>
          <Link
            className={s.viewAll}
            href={path(
              locale,
              "/explore" +
                (shelf === "family" ? "/" + m.family : "") +
                (shelf === "topic"
                  ? "?subject=" + encodeURIComponent(m.definition.subject)
                  : ""),
            )}
          >
            {t("viewAll", locale)} →
          </Link>
        </div>
      </header>
      <div
        ref={rail}
        className={s.rail}
        tabIndex={0}
        role="region"
        aria-label={title}
        aria-busy={busy}
        onScroll={progress}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={() => {
          drag.current.active = false;
        }}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
          } else if (
            (e.target as HTMLElement)
              .closest("a")
              ?.getAttribute("href")
              ?.startsWith("/kidflix/")
          )
            emitVisitor(m.key, locale, m.releaseId, "recommendation_open");
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            scroll(e.key === "ArrowRight" ? dir : -dir);
          }
          if (e.key === "Home") {
            e.preventDefault();
            rail.current?.scrollTo({ left: 0 });
          }
          if (e.key === "End") {
            e.preventDefault();
            rail.current?.scrollTo({ left: dir * rail.current.scrollWidth });
          }
        }}
      >
        {visible.map((item) => (
          <ResourceCard
            item={item}
            key={item.key}
            locale={locale}
            reason={tr(
              shelf === "family"
                ? ["Same resource family", "Même univers", "من نفس العالم"]
                : shelf === "topic"
                  ? [
                      "Same topic in another format",
                      "Même sujet, autre format",
                      "نفس الموضوع بصيغة أخرى",
                    ]
                  : shelf === "skill"
                    ? [
                        "Practise a shared skill",
                        "Pratiquer une compétence commune",
                        "تدرب على مهارة مشتركة",
                      ]
                    : shelf === "loved"
                      ? [
                          "Recorded browser hearts",
                          "Cœurs réels des navigateurs",
                          "إعجابات مسجلة من المتصفحات",
                        ]
                      : shelf === "popular"
                        ? [
                            "Qualified starts over the last 7 days",
                            "Démarrages sur les 7 derniers jours",
                            "بدايات مسجلة خلال آخر 7 أيام",
                          ]
                        : [
                            "Published editorial recommendation",
                            "Recommandation éditoriale publiée",
                            "توصية تحريرية منشورة",
                          ],
              locale,
            )}
          />
        ))}
        {more ? (
          <div className={s.moreCard}>
            <Button disabled={busy} onClick={() => void load()}>
              {busy ? t("loading", locale) : t("more", locale)}
            </Button>
          </div>
        ) : null}
      </div>
      {error ? <ErrorNote locale={locale} retry={() => void load()} /> : null}
      <p className={s.railStatus} aria-live="polite">
        {loaded
          ? visible.length + " · " + t("look", locale)
          : busy
            ? t("loading", locale)
            : ""}
      </p>
    </section>
  );
}
export function DiscoveryRails({
  m,
  locale,
  context = {},
}: {
  m: Row;
  locale: Locale;
  context?: Row;
}) {
  const [claimed, setClaimed] = useState<Record<string, string[]>>({}),
    [includeCompleted, setIncludeCompleted] = useState(false);
  const register = (shelf: string) => (keys: string[]) =>
    setClaimed((old) =>
      JSON.stringify(old[shelf]) === JSON.stringify(keys)
        ? old
        : { ...old, [shelf]: keys },
    );
  return (
    <div className={s.discovery} id="kidflix-related">
      <label className={s.callout}>
        <input
          type="checkbox"
          checked={includeCompleted}
          onChange={(e) => setIncludeCompleted(e.target.checked)}
        />
        {j("includeCompleted", locale)}
      </label>
      <Shelf
        m={m}
        locale={locale}
        shelf="family"
        register={register("family")}
        includeCompleted={includeCompleted}
        title={tr(
          copy[m.family as keyof typeof copy] || [
            "More discoveries",
            "Encore des découvertes",
            "المزيد من الاكتشافات",
          ],
          locale,
        )}
      />
      {str(m.definition.subject) ? (
        <Shelf
          m={m}
          locale={locale}
          shelf="topic"
          excluded={claimed.family || []}
          register={register("topic")}
          includeCompleted={includeCompleted}
          title={t("topicShelf", locale) + " · " + m.definition.subject}
        />
      ) : null}
      {rowsSafe(m.definition.recommendations).length ? (
        <Shelf
          m={m}
          locale={locale}
          shelf="curated"
          register={register("curated")}
          excluded={[
            ...(claimed.family || []),
            ...(claimed.topic || []),
            ...(claimed.curated || []),
          ]}
          includeCompleted={includeCompleted}
          context={context}
          key={String(context.score) + String(context.complete)}
          title={t("curatedShelf", locale)}
        />
      ) : null}
      {str(m.definition.skillTags) ? (
        <Shelf
          m={m}
          locale={locale}
          shelf="skill"
          excluded={[
            ...(claimed.family || []),
            ...(claimed.topic || []),
            ...(claimed.curated || []),
          ]}
          register={register("skill")}
          includeCompleted={includeCompleted}
          title={tr(
            [
              "Practise this skill differently",
              "Pratiquer autrement cette compétence",
              "تدرب على هذه المهارة بطريقة أخرى",
            ],
            locale,
          )}
        />
      ) : null}
      <Shelf
        m={m}
        locale={locale}
        shelf="loved"
        excluded={[
          ...(claimed.family || []),
          ...(claimed.topic || []),
          ...(claimed.skill || []),
          ...(claimed.curated || []),
        ]}
        register={register("loved")}
        includeCompleted={includeCompleted}
        title={tr(
          [
            "Most loved in this world",
            "Les plus aimés dans cet univers",
            "الأكثر إعجاباً في هذا العالم",
          ],
          locale,
        )}
      />
      <Shelf
        m={m}
        locale={locale}
        shelf="popular"
        excluded={[
          ...(claimed.family || []),
          ...(claimed.topic || []),
          ...(claimed.skill || []),
          ...(claimed.loved || []),
          ...(claimed.curated || []),
        ]}
        includeCompleted={includeCompleted}
        title={tr(
          [
            "Popular this week",
            "Populaires cette semaine",
            "الرائجة هذا الأسبوع",
          ],
          locale,
        )}
      />
      <div className={s.closing}>
        <div>
          <span className={s.kicker}>KIDFLIX</span>
          <h2>{t("ready", locale)}</h2>
          <p>{t("look", locale)}</p>
        </div>
        <Link href={path(locale, "/explore")} className={s.primary}>
          {t("allWorlds", locale)} →
        </Link>
      </div>
    </div>
  );
}
function rowsSafe(v: unknown): Row[] {
  return Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : [];
}
