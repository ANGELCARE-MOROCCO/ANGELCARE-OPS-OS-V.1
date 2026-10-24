"use client";
import Link from "next/link";
import { path, world, tr, type Resource, type Locale } from "./catalogue";
import { useGuest } from "./continuity";
import { I } from "./Icons";
import { HomeArtwork } from "./HomeArtwork";
import { topicHref, type DiscoveryTopic } from "./reference-content";
import type { Item } from "./storefronts/model";
import { FactsView } from "./storefronts/elements";
import s from "./reference.module.css";

export function ReferenceCard({
  resource: r,
  locale,
  onPreview,
}: {
  resource: Resource;
  locale: Locale;
  onPreview?: (item: Item) => void;
}) {
  const guest = useGuest(),
    saved = guest.saved.includes(r.key),
    w = world(r.family)!;
  return (
    <article
      className={s.resourceCard}
      data-resource-key={r.key}
      data-card-family={r.family}
    >
      <div className={s.resourceImage}>
        <Link href={path(locale, "/experience/" + r.key)} aria-label={r.title}>
          {r.image ? (
            <img
              src={r.image}
              alt={r.imageAlt || ""}
              width={600}
              height={440}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className={s.noImage}>
              <I name={w.icon} size={48} />
              <small>{tr(w.short, locale)}</small>
            </span>
          )}
        </Link>
        <button
          type="button"
          className={s.save}
          aria-label={
            tr(
              saved
                ? [
                    "Remove saved resource",
                    "Retirer des favoris",
                    "إزالة المورد المحفوظ",
                  ]
                : ["Save resource", "Garder cette ressource", "حفظ المورد"],
              locale,
            ) +
            " · " +
            r.title
          }
          aria-pressed={saved}
          onClick={() => guest.toggle(r.key)}
        >
          <I name="Bookmark" size={16} />
        </button>
        {r.formats.length > 0 ? (
          <span className={s.format}>{r.formats.slice(0, 2).join(" · ")}</span>
        ) : null}
      </div>
      <div className={s.resourceBody}>
        <Link
          className={s.resourceTitle}
          href={path(locale, "/experience/" + r.key)}
        >
          {r.title}
        </Link>
        <div className={s.resourceMeta}>
          {r.subject ? (
            <span>{r.subject}</span>
          ) : (
            <span>{tr(w.title, locale)}</span>
          )}
          {r.duration && r.duration > 0 ? (
            <span>
              <I name="Clock" size={11} />
              {r.duration} min
            </span>
          ) : null}
        </div>
        {"facts" in r && onPreview ? (
          <FactsView item={r as Item} locale={locale} className={s.cardFacts} />
        ) : r.ageMin !== null && r.ageMax !== null ? (
          <small>
            {r.ageMin}–{r.ageMax} {tr(["years", "ans", "سنوات"], locale)}
          </small>
        ) : null}
        <div className={s.resourceActions}>
          {typeof r.loveCount === "number" && r.loveCount > 0 ? (
            <span>
              <I name="Heart" size={12} />
              {r.loveCount.toLocaleString(locale)}
            </span>
          ) : (
            <span className={s.freeLabel}>
              {tr(
                ["Free resource", "Ressource gratuite", "مورد مجاني"],
                locale,
              )}
            </span>
          )}
          {onPreview ? (
            <button
              type="button"
              onClick={() => onPreview(r as Item)}
              aria-label={
                tr(["Quick look", "Aperçu rapide", "نظرة سريعة"], locale) +
                " · " +
                r.title
              }
            >
              <I name="Eye" size={15} />
            </button>
          ) : (
            <Link
              href={path(locale, "/experience/" + r.key)}
              aria-label={
                tr(
                  ["Open resource", "Ouvrir la ressource", "افتح المورد"],
                  locale,
                ) +
                " · " +
                r.title
              }
            >
              <I name="ArrowRight" size={15} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
export function TopicCard({
  topic,
  locale,
  compact = false,
}: {
  topic: DiscoveryTopic;
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <Link
      className={`${s.topicCard} ${compact ? s.compactTopic : ""}`}
      href={topicHref(topic, locale)}
      data-editorial-topic={topic.id}
    >
      <div className={s.topicImage}>
        <HomeArtwork
          src={topic.image}
          alt=""
          width={600}
          height={400}
          loading="lazy"
        />
        <span>
          <I name={world(topic.family)!.icon} size={12} />
          {tr(["Topic search", "Recherche thématique", "بحث موضوعي"], locale)}
        </span>
      </div>
      <strong>{tr(topic.title, locale)}</strong>
      <small>
        {tr(
          ["Explore resources", "Explorer les ressources", "استكشف الموارد"],
          locale,
        )}
        <I name="ArrowRight" size={12} />
      </small>
    </Link>
  );
}
