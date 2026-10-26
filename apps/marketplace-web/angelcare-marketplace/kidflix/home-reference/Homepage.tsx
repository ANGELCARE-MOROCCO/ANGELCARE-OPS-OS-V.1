"use client";
import {Artwork,HeroPlacement} from "../imagery/Runtime";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import {
  defaultHome,
  path,
  tr,
  world,
  WORLDS,
  type HomeConfig,
  type Catalogue,
  type Resource,
  type Locale,
  type Tri,
} from "../catalogue";
import { ReferenceGallery } from "../ReferenceGallery";
import { HomeIcon as I } from "./HomeIcon";
import { useGuest } from "../continuity";
import { ReadFailure } from "../Discovery";
import { GuidedDiscovery } from "../journey/Discovery";
import { PageAd } from "../journey/Runtime";
import { useDocumentsSettings } from "../documents/DocumentShell";
import type { DocumentsData } from "../documents/model";
import {
  ART,
  TOPICS,
  PACKS,
  PATHWAYS,
  SEASONS,
  AGES,
  SUBJECTS,
  href,
  tileHref,
  homeScenes,
  customFamilyImage,
  type Tile,
} from "./content";
import { Atlas } from "./HomeShell";
import s from "./home.module.css";
const T = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
function Section({
  title,
  sub,
  icon = "Sparkles",
  to,
  locale,
  children,
  className = "",
  id,
}: {
  title: Tri;
  sub?: Tri;
  icon?: string;
  to?: string;
  locale: Locale;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={`${s.section} ${className}`} id={id}>
      <div className={s.sectionHeading}>
        <div>
          <h2>
            <I name={icon} size={27} />
            {tr(title, locale)}
          </h2>
          {sub ? <p>{tr(sub, locale)}</p> : null}
        </div>
        {to ? (
          <Link href={to}>
            {tr(["View all", "Tout voir", "عرض الكل"], locale)}
            <I name="ArrowRight" size={15} />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
function Topic({ tile, locale, slot }: { tile: Tile; locale: Locale; slot:string }) {
  return (
    <Link
      className={s.topic}
      href={tileHref(tile, locale)}
      data-home-topic={tile.id}
      data-editorial-art
    >
      <Atlas slot={`${slot}.topic.${tile.id}`}
        sheet={tile.sheet}
        cell={tile.cell}
        rows={tile.sheet === "pathways" ? 2 : 4}
      />
      <strong>{tr(tile.title, locale)}</strong>
      <small>
        {tr(
          ["Explore this topic", "Explorer ce thème", "استكشف هذا الموضوع"],
          locale,
        )}
        <I name="ArrowRight" size={12} />
      </small>
    </Link>
  );
}
function ResourceCard({ r, locale }: { r: Resource; locale: Locale }) {
  const guest = useGuest(),
    saved = guest.saved.includes(r.key);
  return (
    <article className={s.resource} data-resource-key={r.key}>
      <Link
        className={s.resourceCover}
        href={path(locale, "/experience/" + r.key)}
      >
        {r.image ? (
          <img data-imagery-owner="resource-owned" data-imagery-record={r.id}
            src={r.image}
            width={420}
            height={380}
            loading="lazy"
            decoding="async"
            alt={r.imageAlt || r.title}
          />
        ) : (
          <span className={s.missingCover}>
            <I name={world(r.family)?.icon || "FileText"} size={48} />
            {tr(
              [
                "Preview not published",
                "Aperçu non publié",
                "لم تُنشر المعاينة",
              ],
              locale,
            )}
          </span>
        )}
      </Link>
      <button
        type="button"
        className={s.save}
        aria-pressed={saved}
        aria-label={
          tr(
            saved
              ? [
                  "Remove from favorites",
                  "Retirer des favoris",
                  "إزالة من المفضلة",
                ]
              : ["Save resource", "Garder cette ressource", "حفظ المورد"],
            locale,
          ) +
          " · " +
          r.title
        }
        onClick={() => guest.toggle(r.key)}
      >
        <I name="Heart" size={15} />
      </button>
      <Link
        className={s.resourceTitle}
        href={path(locale, "/experience/" + r.key)}
      >
        {r.title}
      </Link>
      <div className={s.resourceMeta}>
        {r.formats.length ? (
          <span>
            <I name="FileText" size={12} />
            {r.formats.join(" · ")}
          </span>
        ) : (
          <span>
            {tr(["Free resource", "Ressource gratuite", "مورد مجاني"], locale)}
          </span>
        )}
        {typeof r.loveCount === "number" && r.loveCount > 0 ? (
          <span>
            <I name="Heart" size={12} />
            {r.loveCount.toLocaleString(locale)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
function Shelf({
  rows,
  tiles,
  locale,
  count = 6,
  slot,
}: {
  rows: Resource[];
  tiles: Tile[];
  locale: Locale;
  count?: number;
  slot:string;
}) {
  return (
    <div className={count === 4 ? s.four : s.six}>
      {rows.length
        ? rows
            .slice(0, count)
            .map((r) => <ResourceCard key={r.key} r={r} locale={locale} />)
        : tiles
            .slice(0, count)
            .map((tile) => <Topic slot={slot} key={tile.id} tile={tile} locale={locale} />)}
    </div>
  );
}
export function ReferenceHome({
  locale,
  config,
  catalogue,
  documents,
}: {
  locale: Locale;
  config: HomeConfig;
  catalogue: Catalogue;
  documents?: DocumentsData;
}) {
  const e = config.edition,
    baseline = defaultHome(locale).edition,
    settings = useDocumentsSettings();
  useEffect(() => {
    settings.publish(documents?.edition || {});
    return () => settings.publish({});
  }, [documents?.edition, settings.publish]);
  const visible = (f: string) => !e.hidden.includes(f),
    rows = catalogue.rows.filter((r) => visible(r.family)),
    worlds = e.familyOrder
      .map((k) => world(k))
      .filter((w): w is NonNullable<typeof w> => !!w && visible(w.key));
  const keep = (tiles: Tile[]) => tiles.filter((t) => visible(t.family));
  const forFamily = (family: string) => rows.filter((r) => r.family === family);
  const featured = e.featured.length
    ? e.featured
        .map((k) => rows.find((r) => r.key === k))
        .filter((r): r is Resource => !!r)
    : forFamily("printables");
  const scene = homeScenes(e),
    total = Object.entries(catalogue.counts)
      .filter(([f]) => visible(f))
      .reduce((n, [, count]) => n + count, 0);
  const slots: Record<string, ReactNode> = {
    worlds: (
      <Section
        id="home-category-directory"
        title={T(
          "Browse All 16 Categories",
          "Explorer les 16 catégories",
          "استكشف الفئات الست عشرة",
        )}
        icon="Flame"
        to={href(locale)}
        locale={locale}
      >
        <div className={s.categoryGrid}>
          {worlds.map((w) => (
            <Link
              key={w.key}
              href={href(locale, {}, w.key)}
              style={
                { "--tint": w.tint, "--accent": w.color } as React.CSSProperties
              }
            >
              <b>{WORLDS.findIndex((x) => x.key === w.key) + 1}</b>
              {customFamilyImage(e, w.key) ? (
                <Artwork slot={`worlds.category.${w.key}`}
                  className={s.customCategory}
                  src={customFamilyImage(e, w.key)}
                  width={65}
                  height={65}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <Atlas slot={`worlds.category.${w.key}`}
                  sheet="icons"
                  cell={WORLDS.findIndex((x) => x.key === w.key)}
                />
              )}
              <strong>{tr(w.title, locale)}</strong>
              <span>{tr(w.description, locale)}</span>
            </Link>
          ))}
        </div>
      </Section>
    ),
    today: (
      <Section
        title={T(
          "Trending Free Resources",
          "Des ressources à découvrir",
          "موارد مجانية للاكتشاف",
        )}
        sub={T(
          "Make your next learning moment a great one",
          "Des idées pour votre prochaine séance",
          "أفكار للحظة تعلّم مميزة",
        )}
        icon="Flame"
        to={href(locale)}
        locale={locale}
      >
        <Shelf slot="today" rows={featured} tiles={keep(TOPICS)} locale={locale} />
      </Section>
    ),
    printables: (
      <div className={s.pair}>
        <Section
          title={T(
            "New for Teachers",
            "Nouveau pour les enseignants",
            "جديد للمعلمين",
          )}
          sub={T(
            "Fresh ideas for your next classroom moment",
            "Des idées pour la vie de classe",
            "أفكار جديدة لحياة الصف",
          )}
          icon="Sparkles"
          to={href(locale, { audience: "educator", sort: "new" })}
          locale={locale}
        >
          <Shelf slot="printables.teachers"
            rows={rows
              .filter((r) => r.audience === "educator")
              .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))}
            tiles={keep(TOPICS.slice(6, 10))}
            locale={locale}
            count={4}
          />
        </Section>
        <Section
          title={T(
            "Kindergarten Essentials",
            "Les essentiels de la maternelle",
            "أساسيات الروضة",
          )}
          sub={T(
            "Discoveries for our youngest learners",
            "Pour les premiers apprentissages",
            "لاكتشافات المتعلمين الصغار",
          )}
          icon="Crown"
          to={href(locale, { age: "5" })}
          locale={locale}
        >
          <Shelf slot="printables.learners"
            rows={rows.filter(
              (r) =>
                r.ageMin !== null &&
                r.ageMax !== null &&
                r.ageMin <= 5 &&
                r.ageMax >= 5,
            )}
            tiles={keep([TOPICS[1], TOPICS[10], TOPICS[2], TOPICS[11]])}
            locale={locale}
            count={4}
          />
        </Section>
      </div>
    ),
    grownups: (
      <div className={s.pair}>
        <Section
          title={T(
            "Mother & Home Learning Picks",
            "Apprendre et grandir à la maison",
            "اختيارات التعلّم المنزلي",
          )}
          sub={T(
            "Resources for learning at home",
            "Des ressources à partager en famille",
            "موارد نتشاركها مع العائلة",
          )}
          icon="House"
          to={href(locale, { audience: "parent" })}
          locale={locale}
        >
          <Shelf slot="grownups.professional"
            rows={rows.filter((r) => r.audience === "parent")}
            tiles={keep([TOPICS[12], TOPICS[13], TOPICS[14], TOPICS[8]])}
            locale={locale}
            count={4}
          />
        </Section>
        <Section
          title={T(
            "Classroom Tools & Templates",
            "Outils et modèles pour la classe",
            "أدوات ونماذج الصف",
          )}
          sub={T(
            "Make classroom life a little easier",
            "Préparer et organiser la classe",
            "لتسهيل الحياة في الصف",
          )}
          icon="Wrench"
          to={href(locale, {}, "planners")}
          locale={locale}
        >
          <Shelf slot="grownups.planners"
            rows={forFamily("planners")}
            tiles={keep([TOPICS[5], TOPICS[3], TOPICS[7], TOPICS[9]])}
            locale={locale}
            count={4}
          />
        </Section>
      </div>
    ),
    bundles: visible("bundles") ? (
      <Section
        className={s.packBand}
        title={T(
          "Featured Free Resource Packs",
          "Des kits pour aller plus loin",
          "حقائب موارد مجانية مميزة",
        )}
        sub={T(
          "Discover related ideas for bigger learning moments",
          "Des idées réunies pour enrichir les apprentissages",
          "أفكار مترابطة لتعلّم أوسع",
        )}
        icon="Gift"
        to={href(locale, {}, "bundles")}
        locale={locale}
      >
        <Shelf slot="bundles"
          rows={forFamily("bundles")}
          tiles={keep(PACKS)}
          locale={locale}
        />
      </Section>
    ) : null,
    ages: (
      <div className={s.ageSubject}>
        <Section
          title={T(
            "Shop by Age / Learning Stage",
            "Explorer par âge et étape",
            "استكشف حسب العمر والمرحلة",
          )}
          sub={T(
            "Find the perfect resources for every learner",
            "Des découvertes pour chaque étape",
            "موارد مناسبة لكل متعلم",
          )}
          icon="UsersRound"
          to={href(locale)}
          locale={locale}
        >
          <div className={s.ages}>
            {AGES.map((a, i) => (
              <Link key={a.title[0]} href={href(locale, { age: a.age })}>
                <Atlas slot={`ages.stage.${a.age||"all"}`} sheet="portraits" cell={i} rows={2} />
                <strong>{tr(a.title, locale)}</strong>
                <small>{tr(a.caption, locale)}</small>
              </Link>
            ))}
          </div>
        </Section>
        {e.sections.includes("skills") ? (
          <Section
            title={T(
              "Shop by Subject",
              "Explorer par matière",
              "استكشف حسب المادة",
            )}
            sub={T(
              "Find a new way into a favourite subject",
              "Des idées pour chaque domaine",
              "أفكار لكل مجال تعلّم",
            )}
            icon="Layers"
            locale={locale}
          >
            <div className={s.subjects}>
              {SUBJECTS.map(([label, icon, en, fr, ar], i) => (
                <Link
                  href={href(locale, { q: tr([en, fr, ar], locale) })}
                  key={en}
                  style={
                    {
                      "--accent": [
                        "#00a8ee",
                        "#ff9e00",
                        "#b44dfb",
                        "#00b489",
                        "#ff2b96",
                      ][i % 5],
                    } as React.CSSProperties
                  }
                >
                  <I name={icon} size={27} />
                  <span>{tr(label, locale)}</span>
                </Link>
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    ),
    skills: e.sections.includes("ages") ? null : (
      <Section
        title={T(
          "Shop by Subject",
          "Explorer par matière",
          "استكشف حسب المادة",
        )}
        icon="Layers"
        locale={locale}
      >
        <div className={s.subjects}>
          {SUBJECTS.map(([label, icon, en, fr, ar]) => (
            <Link href={href(locale, { q: tr([en, fr, ar], locale) })} key={en}>
              <I name={icon} size={27} />
              <span>{tr(label, locale)}</span>
            </Link>
          ))}
        </div>
      </Section>
    ),
    new: (
      <Section
        title={T(
          "Seasonal & Classroom Collections",
          "Les collections de saison",
          "مجموعات موسمية وللصف",
        )}
        sub={T(
          "Holiday, seasonal and themed resource discoveries",
          "Des idées pour les fêtes et les saisons",
          "أفكار للمواسم والمناسبات",
        )}
        icon="TreePine"
        to={href(locale, { sort: "new" })}
        locale={locale}
      >
        <div className={s.seasons}>
          {keep(SEASONS).map((tile) => (
            <Topic slot="new.season" key={tile.id} tile={tile} locale={locale} />
          ))}
        </div>
      </Section>
    ),
    learning: (
      <Section
        title={T(
          "Learning Pathways & Ready-to-Use Journeys",
          "Parcours et nouvelles aventures d’apprentissage",
          "مسارات ورحلات تعلّم جاهزة للاستكشاف",
        )}
        sub={T(
          "Structured discoveries to support your learning goals",
          "Avancer, découvrir et construire ses acquis",
          "اكتشافات منظمة لتحقيق أهداف التعلّم",
        )}
        icon="Backpack"
        to={href(locale, {}, "learning")}
        locale={locale}
      >
        <div className={s.six}>
          {keep(PATHWAYS)
            .slice(0, 6)
            .map((tile) => (
              <Topic slot="learning.pathway" key={tile.id} tile={tile} locale={locale} />
            ))}
        </div>
      </Section>
    ),
    continuity: (
      <div className={s.pair}>
        <Section
          title={T(
            "Community & Educator Voices",
            "Regards de notre communauté",
            "آراء المجتمع والمعلمين",
          )}
          sub={T(
            "Permissioned feedback from published sources",
            "Des témoignages autorisés et sourcés",
            "آراء مأذون بنشرها وموثقة المصدر",
          )}
          icon="MessagesSquare"
          to={href(locale, {}, "community")}
          locale={locale}
        >
          {documents?.testimonials.length ? (
            <div className={s.quotes}>
              {documents.testimonials.slice(0, 3).map((t) => (
                <a
                  key={t.id}
                  href={t.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={s.stars} aria-label={`${t.rating}/5`}>
                    {"★".repeat(t.rating)}
                  </span>
                  <p>“{t.body}”</p>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                </a>
              ))}
            </div>
          ) : (
            <div className={s.communityEmpty}>
              <I name="MessagesSquare" size={30} />
              <strong>
                {tr(
                  [
                    "Ideas grow when we share them",
                    "Les idées grandissent en se partageant",
                    "تنمو الأفكار عندما نتشاركها",
                  ],
                  locale,
                )}
              </strong>
              <p>
                {tr(
                  [
                    "Explore questions, professional reading and shared insights.",
                    "Questions, lectures professionnelles et regards partagés.",
                    "استكشف الأسئلة والقراءات المهنية والرؤى المشتركة.",
                  ],
                  locale,
                )}
              </p>
              <Link href={href(locale, {}, "community")}>
                {tr(
                  [
                    "Explore the community",
                    "Explorer la communauté",
                    "استكشف المجتمع",
                  ],
                  locale,
                )}
                <I name="ArrowRight" size={14} />
              </Link>
            </div>
          )}
        </Section>
        <Section
          title={T(
            "Free Resources to Discover Today",
            "Des ressources gratuites à découvrir aujourd’hui",
            "موارد مجانية لاكتشافها اليوم",
          )}
          sub={T(
            "Open a resource. Find your next great idea.",
            "Ouvrir une ressource, découvrir une idée.",
            "افتح مورداً واكتشف فكرتك القادمة.",
          )}
          icon="Download"
          to={href(locale, { sort: "new" })}
          locale={locale}
        >
          <Shelf slot="continuity.discoveries"
            rows={rows.filter((r) => r.formats.length)}
            tiles={keep([TOPICS[15], TOPICS[14], TOPICS[2], TOPICS[4]])}
            locale={locale}
            count={4}
          />
        </Section>
      </div>
    ),
    closing: (
      <div className={s.continuity}>
        <details>
          <summary>
            <I name="Compass" size={20} />
            {tr(
              [
                "Find resources for your next session",
                "Préparer votre prochaine séance",
                "اعثر على موارد لنشاطك القادم",
              ],
              locale,
            )}
            <I name="ChevronDown" size={15} />
          </summary>
          <GuidedDiscovery locale={locale} />
        </details>
      </div>
    ),
  };
  const factoryHeadline = e.headline === baseline.headline;
  return (
    <div
      className={s.home}
      data-home-reference="r2"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <section className={s.opening} aria-labelledby="kidflix-home-title">
        <div className={s.hero}>
          <HeroPlacement src={scene[0]?.desktop} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}><ReferenceGallery scenes={scene} locale={locale} /></HeroPlacement>
          <div className={s.heroCopy}>
            {e.eyebrow !== baseline.eyebrow ? <small>{e.eyebrow}</small> : null}
            <h1 id="kidflix-home-title">
              {factoryHeadline ? (
                <>
                  {tr(
                    [
                      "Free Educational Resources for",
                      "Des ressources éducatives pour",
                      "موارد تعليمية مجانية من أجل",
                    ],
                    locale,
                  )}
                  <em>
                    {tr(
                      [
                        "Brighter Learners!",
                        "apprendre avec joie !",
                        "متعلّمين أكثر إشراقاً!",
                      ],
                      locale,
                    )}
                  </em>
                </>
              ) : (
                e.headline
              )}
            </h1>
            {e.description !== baseline.description ? (
              <p>{e.description}</p>
            ) : null}
            <ul>
              {[
                T(
                  "Free printables, worksheets, activities and creative resources",
                  "Fiches, activités et ressources créatives gratuites",
                  "مطبوعات وأوراق عمل وأنشطة وموارد إبداعية مجانية",
                ),
                T(
                  "For mothers, teachers, kindergarten professionals & classrooms",
                  "Pour les familles, les enseignants et les professionnels",
                  "للعائلات والمعلمين ومهنيي الطفولة والصفوف",
                ),
                T(
                  "Thoughtful ideas. Real published resources.",
                  "Des idées utiles et de vraies ressources publiées.",
                  "أفكار هادفة وموارد منشورة حقيقية.",
                ),
                T(
                  "Read, create, play, discover and grow",
                  "Lire, créer, jouer, découvrir et grandir",
                  "اقرأ وابتكر والعب واكتشف وانمُ",
                ),
              ].map((line) => (
                <li key={line[0]}>
                  <I name="CircleCheck" size={14} />
                  {tr(line, locale)}
                </li>
              ))}
            </ul>
            <Link className={s.cta} href={href(locale)}>
              {tr(
                [
                  "Explore All Free Resources",
                  "Explorer toutes les ressources",
                  "استكشف كل الموارد المجانية",
                ],
                locale,
              )}
              <I name="ArrowRight" size={16} />
            </Link>
          </div>
        </div>
        <div className={s.promos}>
          {[
            {
              id: "seasonal",
              family: "bundles",
              cell: 5,
              title: T(
                "Seasonal Classroom Kits",
                "Kits et fêtes de saison",
                "حقائب موسمية للصف",
              ),
              sub: T(
                "Holiday · Seasonal · Special events",
                "Fêtes · Saisons · Temps forts",
                "أعياد · مواسم · مناسبات",
              ),
              label: T(
                "Explore Collections",
                "Explorer les collections",
                "استكشف المجموعات",
              ),
            },
            {
              id: "teacher",
              family: "planners",
              cell: 6,
              title: T(
                "Teacher Planners & Templates",
                "Plannings et modèles enseignants",
                "مخططات ونماذج للمعلمين",
              ),
              sub: T(
                "Stay organized all year!",
                "Une année bien organisée !",
                "لنبقَ منظمين طوال العام!",
              ),
              label: T(
                "Get Free Templates",
                "Trouver un modèle",
                "اكتشف النماذج",
              ),
            },
            {
              id: "play",
              family: "activities",
              cell: 7,
              title: T(
                "Learning Through Play",
                "Apprendre en jouant",
                "التعلّم من خلال اللعب",
              ),
              sub: T(
                "Activities, games and hands-on ideas",
                "Activités, jeux et découvertes",
                "أنشطة وألعاب وأفكار عملية",
              ),
              label: T(
                "Explore Activities",
                "Explorer les activités",
                "استكشف الأنشطة",
              ),
            },
          ]
            .filter((p) => visible(p.family))
            .map((p) => (
              <Link
                key={p.id}
                className={`${s.promo} ${s[p.id]}`}
                href={href(locale, {}, p.family)}
              >
                {customFamilyImage(e, p.family) ? (
                  <Artwork slot={`opening.promo.${p.id}`} sequence
                    src={customFamilyImage(e, p.family)}
                    alt=""
                    width={800}
                    height={533}
                  />
                ) : (
                  <Atlas slot={`opening.promo.${p.id}`} sequence sheet="collections-01" cell={p.cell} />
                )}
                <div>
                  <h2>{tr(p.title, locale)}</h2>
                  <p>{tr(p.sub, locale)}</p>
                  <span>
                    {tr(p.label, locale)}
                    <I name="ArrowRight" size={13} />
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </section>
      <div className={s.assurance}>
        {[
          [
            "UsersRound",
            T("Free learning", "Apprendre librement", "تعلّم مجاني"),
            T(
              "For curious minds",
              "Pour les esprits curieux",
              "للعقول الفضولية",
            ),
          ],
          [
            "Layers",
            [
              String(worlds.length),
              String(worlds.length),
              String(worlds.length),
            ] as Tri,
            T("Resource categories", "Catégories de ressources", "فئة موارد"),
          ],
          [
            "Download",
            total > 0
              ? ([
                  total.toLocaleString(locale),
                  total.toLocaleString(locale),
                  total.toLocaleString(locale),
                ] as Tri)
              : T("Explore freely", "Explorer librement", "استكشف بحرية"),
            total > 0
              ? T("Published resources", "Ressources publiées", "موارد منشورة")
              : T(
                  "Read, play & create",
                  "Lire, jouer et créer",
                  "اقرأ والعب وابتكر",
                ),
          ],
          [
            "GraduationCap",
            T(
              "Teachers & parents",
              "Enseignants et parents",
              "المعلمون والآباء",
            ),
            T("Ideas for every day", "Des idées au quotidien", "أفكار لكل يوم"),
          ],
          [
            "Globe",
            T(
              "A world of discovery",
              "Un monde de découvertes",
              "عالم من الاكتشافات",
            ),
            T(
              "English · Français · العربية",
              "English · Français · العربية",
              "English · Français · العربية",
            ),
          ],
        ].map(([icon, title, detail]) => (
          <div key={String(icon)}>
            <I name={String(icon)} size={32} />
            <span>
              <strong>{tr(title as Tri, locale)}</strong>
              <small>{tr(detail as Tri, locale)}</small>
            </span>
          </div>
        ))}
      </div>
      {catalogue.error ? <ReadFailure locale={locale} /> : null}
      {[...new Set(e.sections)].map((key) => (
        <div key={key} data-home-section={key}>
          {slots[key] || null}
          {e.adSlots.includes(key) ? (
            <PageAd locale={locale} slot={`home:${key}`} />
          ) : null}
        </div>
      ))}
      <p className={s.editorialNote}>
        {tr(
          [
            "Illustrated topic cards open catalogue searches. Resource previews show the publisher’s actual content.",
            "Les cartes illustrées ouvrent une recherche. Les aperçus de ressources montrent le contenu réel publié.",
            "تفتح البطاقات المصوّرة بحثاً في المكتبة، وتعرض معاينات الموارد المحتوى الحقيقي المنشور.",
          ],
          locale,
        )}
      </p>
    </div>
  );
}
