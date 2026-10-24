"use client";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { path, world, tr, type Locale } from "../catalogue";
import { I } from "../Icons";
import { HomeArtwork } from "../HomeArtwork";
import { ReferenceGallery } from "../ReferenceGallery";
import { TopicCard } from "../ReferenceCards";
import { ReferenceSection } from "../ReferenceSection";
import {
  categoryShort,
  familyLayout,
  familyTopics,
  referenceCover,
  discoveryHref,
} from "../reference-content";
import { publisherProfile, say } from "./publisher-content";
import type { Edition, Section } from "./model";
import s from "../reference.module.css";

export function ReferenceFrame({
  family,
  locale,
  accent,
  tint,
  children,
}: {
  family: string;
  locale: Locale;
  accent: string;
  tint: string;
  children: ReactNode;
}) {
  return (
    <div
      className={s.storefront}
      data-reference-family={family}
      data-reference-layout={familyLayout[family]}
      style={{ "--accent": accent, "--tint": tint } as CSSProperties}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {children}
    </div>
  );
}
export function ReferenceOpening({
  family,
  locale,
  edition,
  onGuide,
  onSearch,
  total,
}: {
  family: string;
  locale: Locale;
  edition: Edition;
  onGuide: () => void;
  onSearch: (query: string) => void;
  total: number;
}) {
  const w = world(family)!,
    profile = publisherProfile(family),
    isFactory =
      edition.headline === say(profile.title, locale) ||
      edition.headline === tr(w.title, locale);
  return (
    <header className={s.categoryOpening}>
      <div className={s.categoryMasthead}>
        <div>
          <nav
            className={s.breadcrumb}
            aria-label={tr(
              ["Breadcrumb", "Fil d’Ariane", "مسار التنقل"],
              locale,
            )}
          >
            <Link href={path(locale)}>KidFlix</Link>
            <I name="ChevronRight" size={12} />
            <Link href={discoveryHref(locale)}>
              {tr(
                ["All resources", "Toutes les ressources", "جميع الموارد"],
                locale,
              )}
            </Link>
            <I name="ChevronRight" size={12} />
            <span>{tr(w.title, locale)}</span>
          </nav>
          <span className={s.categoryEyebrow}>
            <I name={w.icon} size={20} />
            {edition.eyebrow}
          </span>
          <h1>{isFactory ? tr(w.title, locale) : edition.headline}</h1>
          <p>{edition.description}</p>
          <div className={s.categoryActions}>
            <a className={s.primary} href="#discover">
              {tr(
                [
                  "Find the right resource",
                  "Trouver la bonne ressource",
                  "اعثر على المورد المناسب",
                ],
                locale,
              )}
              <I name="Search" size={16} />
            </a>
            <button type="button" onClick={onGuide}>
              <I name="SlidersHorizontal" size={16} />
              {tr(
                [
                  "Help me choose",
                  "Aidez-moi à choisir",
                  "ساعدني على الاختيار",
                ],
                locale,
              )}
            </button>
          </div>
          <div className={s.categoryAssurance}>
            <span>
              <I name="Gift" size={14} />
              {tr(
                ["Free to explore", "À explorer gratuitement", "اكتشاف مجاني"],
                locale,
              )}
            </span>
            <span>
              <I name="Layers" size={14} />
              {total.toLocaleString(locale)}{" "}
              {tr(
                [
                  "matching resources",
                  "ressources correspondantes",
                  "موارد مطابقة",
                ],
                locale,
              )}
            </span>
          </div>
        </div>
        <div className={s.categoryHero}>
          <ReferenceGallery scenes={edition.gallery} locale={locale} />
          <span className={s.editorialBadge}>
            {tr(
              [
                "Editorial inspiration",
                "Inspiration éditoriale",
                "إلهام تحريري",
              ],
              locale,
            )}
          </span>
        </div>
      </div>
      <div
        className={s.categoryQuickTopics}
        aria-label={tr(
          ["Search a topic", "Rechercher un thème", "ابحث عن موضوع"],
          locale,
        )}
      >
        {familyTopics(family)
          .slice(0, 4)
          .map((topic, i) => (
            <button
              type="button"
              key={topic.id}
              onClick={() => onSearch(tr(topic.query, locale))}
            >
              <HomeArtwork
                src={referenceCover(family, i)}
                alt=""
                width={250}
                height={160}
                loading="lazy"
              />
              <span>
                <strong>{tr(topic.title, locale)}</strong>
                <small>
                  {tr(
                    [
                      "Search this topic",
                      "Rechercher ce thème",
                      "ابحث في هذا الموضوع",
                    ],
                    locale,
                  )}
                </small>
              </span>
              <I name="ArrowRight" size={14} />
            </button>
          ))}
      </div>
    </header>
  );
}
export function ReferenceStorefrontSection({
  section,
  family,
  locale,
  edition,
  onSearch,
  children,
}: {
  section: Section;
  family: string;
  locale: Locale;
  edition: Edition;
  onSearch: (query: string) => void;
  children: ReactNode;
}) {
  const profile = publisherProfile(family),
    w = world(family)!;
  if (section === "subjects")
    return (
      <>
        <ReferenceSection
          title={[
            "Choose a direction to explore",
            "Choisir une piste à explorer",
            "اختر مجالًا للاستكشاف",
          ]}
          sub={categoryShort[family]}
          icon="Compass"
          locale={locale}
        >
          <div className={s.sixGrid}>
            {familyTopics(family).map((topic) => (
              <TopicCard key={topic.id} topic={topic} locale={locale} />
            ))}
          </div>
        </ReferenceSection>
        {children}
      </>
    );
  if (section === "guide")
    return (
      <section className={s.preparationStrip} id="category-preparation">
        <div className={s.preparationImage}>
          <HomeArtwork
            src={edition.guidance}
            mobile={edition.guidanceMobile}
            alt={edition.guidanceAlt}
            width={600}
            height={400}
            loading="lazy"
          />
        </div>
        <div>
          <span className={s.eyebrow}>
            {tr(
              [
                "A USEFUL WAY TO BEGIN",
                "POUR BIEN COMMENCER",
                "طريقة مفيدة للبدء",
              ],
              locale,
            )}
          </span>
          <h2>{edition.guidanceTitle}</h2>
          <p>{edition.guidanceBody}</p>
          <ol>
            {profile.steps.map((step, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                {say(step, locale)}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  if (section === "collections" && !children)
    return (
      <ReferenceSection
        title={[
          "Explore the possibilities",
          "Explorer les possibilités",
          "استكشف الإمكانات",
        ]}
        sub={[
          "Topic searches across this category",
          "Recherches thématiques dans cette catégorie",
          "عمليات بحث موضوعية في هذه الفئة",
        ]}
        icon="Sparkles"
        locale={locale}
      >
        <div className={s.featureTopics}>
          {familyTopics(family, 2)
            .slice(0, 3)
            .map((topic) => (
              <button
                type="button"
                key={topic.id}
                onClick={() => onSearch(tr(topic.query, locale))}
              >
                <HomeArtwork
                  src={topic.image}
                  alt=""
                  width={600}
                  height={400}
                  loading="lazy"
                />
                <span>
                  <strong>{tr(topic.title, locale)}</strong>
                  <small>
                    {tr(
                      [
                        "Search published resources",
                        "Rechercher les ressources publiées",
                        "ابحث في الموارد المنشورة",
                      ],
                      locale,
                    )}
                  </small>
                </span>
                <I name="ArrowRight" size={17} />
              </button>
            ))}
        </div>
      </ReferenceSection>
    );
  if (section === "related" && !children)
    return (
      <ReferenceSection
        title={[
          "Keep the discovery going",
          "Prolongez la découverte",
          "واصل الاكتشاف",
        ]}
        icon="Route"
        locale={locale}
      >
        <div className={s.closingLinks}>
          {profile.related.map((key) => {
            const related = world(key);
            return related ? (
              <Link key={key} href={discoveryHref(locale, {}, key)}>
                <span
                  style={{ background: related.tint, color: related.color }}
                >
                  <I name={related.icon} size={22} />
                </span>
                <strong>{tr(related.title, locale)}</strong>
                <small>{tr(categoryShort[key], locale)}</small>
                <I name="ArrowRight" size={14} />
              </Link>
            ) : null;
          })}
        </div>
      </ReferenceSection>
    );
  return <div data-reference-storefront-section={section}>{children}</div>;
}
