"use client";
import Link from "next/link";
import { useState, Children, isValidElement, type ReactNode } from "react";
import {
  WORLDS,
  INTENTS,
  world,
  path,
  tr,
  type Locale,
  type Catalogue,
  type HomeConfig,
  type Resource,
} from "./catalogue";
import { copy } from "./copy";
import { I } from "./Icons";
import { SearchBox } from "./Shell";
import {
  WorldCard,
  ResourceCard,
  SectionTitle,
  Shelf,
  SavedDiscoveries,
  ReadFailure,
} from "./Discovery";
import s from "./kidflix.module.css";
function HomeSequence({
  order,
  children,
}: {
  order: string[];
  children: ReactNode;
}) {
  const nodes = Children.toArray(children),
    slots = new Map<string, ReactNode>(),
    before: ReactNode[] = [],
    after: ReactNode[] = [];
  for (const node of nodes) {
    if (
      isValidElement<{
        ["data-kidflix-section"]?: string;
        family?: string;
        ["data-kidflix-end"]?: boolean;
      }>(node)
    ) {
      const slot = node.props["data-kidflix-section"] || node.props.family;
      if (slot) {
        slots.set(slot, node);
        continue;
      }
      if (node.props["data-kidflix-end"]) {
        after.push(node);
        continue;
      }
    }
    before.push(node);
  }
  return (
    <>
      {before}
      {order.map((key) => slots.get(key) || null)}
      {after}
    </>
  );
}
function AdPosition({ slot, selected }: { slot: string; selected: string[] }) {
  return selected.includes(slot) ? (
    <div data-kidflix-ad-slot={slot} data-provider-state="inactive" hidden />
  ) : null;
}
function FamilyFeature({
  family,
  locale,
}: {
  family: string;
  locale: Locale;
}) {
  const w = world(family)!;
  return (
    <Link
      className={s.familyFeature}
      href={path(locale, "/explore/" + family)}
      style={{ "--accent": w.color, "--tint": w.tint } as React.CSSProperties}
    >
      <img src={w.image} alt="" width={650} height={420} loading="lazy" />
      <div>
        <span className={s.editorialTag}>
          <I name={w.icon} size={14} />
          {tr(w.title, locale)}
        </span>
        <h3>{tr(w.invitation, locale)}</h3>
        <span className={s.featureCTA}>
          {tr(w.short, locale)}
          <I name="ArrowRight" size={17} />
        </span>
      </div>
    </Link>
  );
}
function ResourceSection({
  title,
  sub,
  icon,
  family,
  rows,
  locale,
  tint = false,
  adSlots = [],
}: {
  title: string;
  sub: string;
  icon: string;
  family: string;
  rows: Resource[];
  locale: Locale;
  tint?: boolean;
  adSlots?: string[];
}) {
  if (!rows.length) return null;
  const w = world(family)!;
  return (
    <section
      className={`${s.section} ${tint ? s.tintedSection : ""}`}
      style={{ "--accent": w.color, "--tint": w.tint } as React.CSSProperties}
    >
      <SectionTitle
        title={title}
        sub={sub}
        icon={icon}
        href={path(locale, "/explore/" + family)}
        locale={locale}
        accent={w.color}
        tag={copy("free", locale)}
      />
      <Shelf rows={rows.slice(0, 6)} locale={locale} />
      <AdPosition
        slot={family === "bundles" ? "after-bundles" : "after-printables"}
        selected={adSlots}
      />
    </section>
  );
}
export function KidFlixHome({
  locale,
  config,
  catalogue,
}: {
  locale: Locale;
  config: HomeConfig;
  catalogue: Catalogue;
}) {
  const e = config.edition,
    [intent, setIntent] = useState("all"),
    rows = catalogue.rows,
    visible = (key: string) => e.sections.includes(key),
    group = (...families: string[]) =>
      rows.filter((r) => families.includes(r.family)),
    today = e.featured.length
      ? e.featured
          .map((k) => rows.find((r) => r.key === k))
          .filter((r): r is Resource => !!r)
      : rows.slice(0, 8),
    chosen =
      intent === "all" ? today : today.filter((r) => r.intent.includes(intent)),
    allWorlds = e.familyOrder
      .map((k) => world(k)!)
      .filter((w) => w && !e.hidden.includes(w.key)),
    ages = [3, 4, 5, 6, 8, 10].filter((n) =>
      rows.some(
        (r) =>
          r.ageMin !== null &&
          r.ageMax !== null &&
          r.ageMin <= n &&
          r.ageMax >= n,
      ),
    );
  return (
    <HomeSequence order={e.sections}>
      <section className={s.hero} aria-labelledby="kidflix-hero-heading">
        <div className={s.heroImage}>
          <picture>
            {e.heroMobile ? (
              <source media="(max-width: 650px)" srcSet={e.heroMobile} />
            ) : null}
            <img
              src={e.hero}
              alt={e.heroAlt}
              width={1100}
              height={760}
              fetchPriority="high"
            />
          </picture>
          <div className={s.heroPhotoBadge}>
            <span>
              <I name="Heart" size={19} />
            </span>
            <div>
              <strong>{copy("together", locale)}</strong>
              <small>{copy("little", locale)}</small>
            </div>
            <I name="Sparkles" size={18} />
          </div>
        </div>
        <div className={s.heroCopy}>
          <span className={s.heroEyebrow}>
            <span /> {e.eyebrow}
          </span>
          <h1 id="kidflix-hero-heading">
            {e.headline.split(". ").map((t, i) => (
              <span key={i}>
                {t}
                {i === 0 && e.headline.includes(". ") ? ". " : ""}
              </span>
            ))}
          </h1>
          <p>{e.description}</p>
          <SearchBox locale={locale} large />
          <div className={s.heroCTA}>
            <Link className={s.primary} href="#kidflix-worlds">
              {copy("explore", locale)}
              <I name="ArrowRight" size={18} />
            </Link>
            <Link className={s.heroSecondary} href="#kidflix-today">
              {copy("today", locale)}
              <I name="ArrowUpRight" size={16} />
            </Link>
          </div>
          <div className={s.heroAssurance}>
            <I name="ShieldCheck" size={15} />
            {copy("noAccount", locale)}
          </div>
          <span className={s.heroDoodle} aria-hidden="true">
            <I name="Sparkles" size={40} />
          </span>
        </div>
        <aside className={s.heroBenefits}>
          <div className={s.benefitHeading}>
            <span>
              <I name="Gift" size={26} />
            </span>
            <div>
              <strong>{copy("free", locale)}</strong>
              <small>{copy("little", locale)}</small>
            </div>
          </div>
          {[
            [
              "BookOpen",
              tr(
                [
                  "Stories to get lost in",
                  "Des histoires pour s’évader",
                  "حكايات تأخذك بعيداً",
                ],
                locale,
              ),
            ],
            [
              "Printer",
              tr(
                [
                  "Ideas to print & create",
                  "Des idées à imprimer et créer",
                  "أفكار للطباعة والإبداع",
                ],
                locale,
              ),
            ],
            [
              "Puzzle",
              tr(
                [
                  "Playful discoveries",
                  "Des découvertes ludiques",
                  "اكتشافات مرحة",
                ],
                locale,
              ),
            ],
            [
              "GraduationCap",
              tr(
                [
                  "Learn at your own pace",
                  "Apprendre à son rythme",
                  "تعلّم بإيقاعك",
                ],
                locale,
              ),
            ],
            [
              "Heart",
              tr(
                [
                  "For families & educators",
                  "Pour familles et éducateurs",
                  "للعائلات والمربين",
                ],
                locale,
              ),
            ],
          ].map(([icon, t]) => (
            <div className={s.benefit} key={icon}>
              <I name="CheckCircle2" size={15} />
              <span>{t}</span>
            </div>
          ))}
          <span className={s.benefitSpark} aria-hidden="true">
            ✦
          </span>
          <Link href={path(locale, "/about")}>
            {copy("about", locale)}
            <I name="ArrowRight" size={14} />
          </Link>
        </aside>
      </section>
      <div className={s.intentDock}>
        {INTENTS.map(([key, icon, label], i) => (
          <Link
            href={path(locale, "/explore?intent=" + key)}
            key={key}
            style={
              {
                "--accent": [
                  "#e4448b",
                  "#8059dc",
                  "#e99015",
                  "#ef6852",
                  "#1b9f9d",
                  "#2684da",
                  "#d85894",
                ][i],
              } as React.CSSProperties
            }
          >
            <span>
              <I name={icon} size={25} />
            </span>
            <strong>{tr(label, locale)}</strong>
          </Link>
        ))}
      </div>
      {catalogue.error ? (
        <div className={s.section}>
          <ReadFailure locale={locale} />
        </div>
      ) : null}
      {visible("worlds") ? (
        <section
          data-kidflix-section="worlds"
          className={s.section}
          id="kidflix-worlds"
        >
          <SectionTitle
            title={copy("worldTitle", locale)}
            sub={copy("worldSub", locale)}
            icon="Compass"
            href={path(locale, "/explore")}
            locale={locale}
          />
          <div className={s.worldGrid}>
            {allWorlds.map((w) => (
              <WorldCard
                key={w.key}
                w={w}
                image={e.familyImages[w.key]}
                count={catalogue.counts[w.key]}
                locale={locale}
              />
            ))}
          </div>
          <AdPosition slot="after-worlds" selected={e.adSlots} />
          <div className={s.worldsFoot}>
            <span>
              <I name="Sparkles" size={15} />
              {copy("free", locale)}
            </span>
            <span>{copy("together", locale)}</span>
          </div>
        </section>
      ) : null}
      {visible("today") ? (
        <section
          data-kidflix-section="today"
          className={`${s.section} ${s.todaySection}`}
          id="kidflix-today"
        >
          <SectionTitle
            title={copy("todayTitle", locale)}
            sub={copy("todaySub", locale)}
            icon="Sun"
            href={path(locale, "/explore")}
            locale={locale}
            accent="#e99a20"
          />
          <div
            className={s.chips}
            role="group"
            aria-label={copy("filters", locale)}
          >
            <button
              onClick={() => setIntent("all")}
              aria-pressed={intent === "all"}
            >
              {copy("all", locale)}
            </button>
            {INTENTS.slice(0, 6).map(([key, icon, label]) => (
              <button
                key={key}
                aria-pressed={intent === key}
                onClick={() => setIntent(key)}
              >
                <I name={icon} size={14} />
                {tr(label, locale)}
              </button>
            ))}
          </div>
          {chosen.length ? (
            <div className={s.todayBento}>
              <ResourceCard resource={chosen[0]} locale={locale} large />
              <div className={s.todaySmall}>
                {chosen.slice(1, 5).map((r) => (
                  <ResourceCard key={r.id} resource={r} locale={locale} />
                ))}
              </div>
            </div>
          ) : (
            <div className={s.inspirationGrid}>
              {(intent === "all"
                ? [
                    world("stories")!,
                    world("printables")!,
                    world("activities")!,
                  ]
                : WORLDS.filter((w) => w.intent.includes(intent)).slice(0, 3)
              ).map((w) => (
                <FamilyFeature key={w.key} family={w.key} locale={locale} />
              ))}
            </div>
          )}
        </section>
      ) : null}
      {visible("ages") && ages.length ? (
        <section data-kidflix-section="ages" className={s.section}>
          <SectionTitle
            title={copy("ageTitle", locale)}
            sub={copy("ageSub", locale)}
            icon="Smile"
            href={path(locale, "/explore")}
            locale={locale}
            accent="#dd6a85"
          />
          <div className={s.ageGrid}>
            {ages.map((age, i) => (
              <Link
                href={path(locale, "/explore?age=" + age)}
                key={age}
                style={
                  {
                    "--tint": [
                      "#fff0f6",
                      "#eaf7ff",
                      "#eefaed",
                      "#fff1e1",
                      "#f3edff",
                      "#e7fafa",
                    ][i % 6],
                    "--accent": [
                      "#d74385",
                      "#2586c9",
                      "#479b4f",
                      "#d28724",
                      "#8750c5",
                      "#269995",
                    ][i % 6],
                  } as React.CSSProperties
                }
              >
                <img
                  src={WORLDS[[9, 6, 10, 7, 3, 8][i % 6]].image}
                  alt=""
                  loading="lazy"
                  width={300}
                  height={180}
                />
                <span className={s.ageNumber}>
                  {age}
                  <small>{copy("years", locale)}</small>
                </span>
                <div>
                  <strong>
                    {tr(
                      [
                        "Let curiosity grow",
                        "Faites grandir la curiosité",
                        "دع الفضول ينمو",
                      ],
                      locale,
                    )}
                  </strong>
                  <I name="ArrowRight" size={15} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {visible("skills") &&
      (catalogue.subjects.length || catalogue.skills.length) ? (
        <section
          data-kidflix-section="skills"
          className={`${s.section} ${s.curiositySection}`}
        >
          <div>
            <span className={s.eyebrow}>
              KIDFLIX · {copy("discovery", locale)}
            </span>
            <h2>{copy("skillTitle", locale)}</h2>
            <p>{copy("skillSub", locale)}</p>
          </div>
          <div className={s.skillCloud}>
            {[
              ...catalogue.subjects
                .slice(0, 6)
                .map((v) => ({ kind: "subject", v })),
              ...catalogue.skills
                .slice(0, 6)
                .map((v) => ({ kind: "skill", v })),
            ].map(({ kind, v }, i) => (
              <Link
                key={kind + v}
                href={path(
                  locale,
                  "/explore?" + kind + "=" + encodeURIComponent(v),
                )}
                style={
                  {
                    "--accent": WORLDS[i % 16].color,
                    "--tint": WORLDS[i % 16].tint,
                  } as React.CSSProperties
                }
              >
                <I
                  name={
                    [
                      "Sparkles",
                      "Leaf",
                      "Sun",
                      "BookOpen",
                      "Puzzle",
                      "Flower2",
                    ][i % 6]
                  }
                  size={18}
                />
                {v}
                <I name="ArrowUpRight" size={13} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {visible("printables") ? (
        <ResourceSection
          title={copy("printTitle", locale)}
          sub={copy("printSub", locale)}
          icon="Printer"
          family="printables"
          rows={group("printables")}
          locale={locale}
          adSlots={e.adSlots}
          tint
        />
      ) : null}
      {visible("storytime") ? (
        <section data-kidflix-section="storytime" className={s.section}>
          <SectionTitle
            title={copy("storyTitle", locale)}
            sub={copy("storySub", locale)}
            icon="BookOpen"
            locale={locale}
            accent="#8751d2"
          />
          <div className={s.storyColumns}>
            {["stories", "audio"].map((f) => (
              <div
                className={s.storyColumn}
                key={f}
                style={
                  {
                    "--accent": world(f)!.color,
                    "--tint": world(f)!.tint,
                  } as React.CSSProperties
                }
              >
                <FamilyFeature family={f} locale={locale} />
                {group(f).length ? (
                  <div className={s.storyMini}>
                    {group(f)
                      .slice(0, 3)
                      .map((r) => (
                        <Link
                          key={r.id}
                          href={path(locale, "/experience/" + r.key)}
                        >
                          {r.image ? (
                            <img
                              src={r.image}
                              alt=""
                              loading="lazy"
                              width={90}
                              height={75}
                            />
                          ) : (
                            <I name={world(f)!.icon} size={25} />
                          )}
                          <span>
                            <strong>{r.title}</strong>
                            <small>
                              {r.duration
                                ? `${r.duration} ${copy("mins", locale)}`
                                : tr(world(f)!.short, locale)}
                            </small>
                          </span>
                          <I name="ArrowRight" size={16} />
                        </Link>
                      ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {visible("challenge") ? (
        <section
          data-kidflix-section="challenge"
          className={`${s.section} ${s.challenge}`}
        >
          <div className={s.challengeArt} aria-hidden="true">
            <div>
              <I name="Zap" size={75} />
              <span className={s.challengeStar}>✦</span>
              <span className={s.challengeDot} />
              <span className={s.challengeBadge}>
                <I name="Star" size={19} />
                KIDFLIX
              </span>
            </div>
          </div>
          <div className={s.challengeCopy}>
            <span className={s.eyebrow}>{copy("little", locale)}</span>
            <h2>{copy("challengeTitle", locale)}</h2>
            <p>{copy("challengeSub", locale)}</p>
            <div className={s.heroCTA}>
              <Link
                href={path(
                  locale,
                  group("assessments").length
                    ? "/experience/" + group("assessments")[0].key
                    : "/explore/assessments",
                )}
                className={s.primary}
              >
                {tr(
                  [
                    "Find my next challenge",
                    "Trouver mon prochain défi",
                    "اعثر على تحدّي القادم",
                  ],
                  locale,
                )}
                <I name="ArrowRight" size={18} />
              </Link>
              <Link
                href={path(locale, "/explore/activities")}
                className={s.heroSecondary}
              >
                {tr(world("activities")!.title, locale)}
                <I name="ArrowUpRight" size={16} />
              </Link>
            </div>
          </div>
          {group("assessments").length ? (
            <div className={s.challengeCard}>
              <ResourceCard
                resource={group("assessments")[0]}
                locale={locale}
              />
            </div>
          ) : null}
        </section>
      ) : null}
      {visible("activities") ? (
        <ResourceSection
          title={tr(world("activities")!.title, locale)}
          sub={tr(world("activities")!.description, locale)}
          icon="Puzzle"
          family="activities"
          rows={group("activities")}
          locale={locale}
        />
      ) : null}
      {visible("learning") ? (
        <ResourceSection
          title={copy("learnTitle", locale)}
          sub={copy("learnSub", locale)}
          icon="GraduationCap"
          family="learning"
          rows={group("learning")}
          locale={locale}
        />
      ) : null}
      {visible("visual-cards") ? (
        <ResourceSection
          title={copy("cardsTitle", locale)}
          sub={copy("cardsSub", locale)}
          icon="Layers"
          family="visual-cards"
          rows={group("visual-cards")}
          locale={locale}
          tint
        />
      ) : null}
      {visible("tools") ? (
        <section data-kidflix-section="tools" className={s.section}>
          <SectionTitle
            title={copy("toolsTitle", locale)}
            sub={copy("toolsSub", locale)}
            icon="WandSparkles"
            locale={locale}
            accent="#119184"
          />
          <div className={s.toolBoard}>
            {["tools", "planners", "forms", "presentations"].map((f) => {
              const w = world(f)!;
              return (
                <Link
                  href={path(locale, "/explore/" + f)}
                  key={f}
                  style={
                    {
                      "--accent": w.color,
                      "--tint": w.tint,
                    } as React.CSSProperties
                  }
                >
                  <span className={s.toolMedallion}>
                    <I name={w.icon} size={37} />
                  </span>
                  <h3>{tr(w.title, locale)}</h3>
                  <p>{tr(w.description, locale)}</p>
                  <span className={s.toolArrow}>
                    <I name="ArrowRight" size={19} />
                  </span>
                </Link>
              );
            })}
          </div>
          {group("tools", "planners").length ? (
            <div className={s.belowBoard}>
              <Shelf
                rows={group("tools", "planners").slice(0, 6)}
                locale={locale}
              />
            </div>
          ) : null}
        </section>
      ) : null}
      {visible("video") && group("video", "presentations").length ? (
        <section
          data-kidflix-section="video"
          className={`${s.section} ${s.videoSection}`}
        >
          <SectionTitle
            title={copy("videoTitle", locale)}
            sub={copy("videoSub", locale)}
            icon="Play"
            href={path(locale, "/explore/video")}
            locale={locale}
            accent="#e28c1b"
          />
          <div className={s.videoGrid}>
            {group("video", "presentations")
              .slice(0, 4)
              .map((r) => (
                <div className={s.videoTile} key={r.id}>
                  <ResourceCard resource={r} locale={locale} />
                  <span className={s.playEmblem} aria-hidden="true">
                    <I name="Play" size={23} />
                  </span>
                </div>
              ))}
          </div>
        </section>
      ) : null}
      {visible("grownups") ? (
        <section
          data-kidflix-section="grownups"
          className={`${s.section} ${s.grownSection}`}
        >
          <SectionTitle
            title={copy("grownTitle", locale)}
            sub={copy("grownSub", locale)}
            icon="Heart"
            locale={locale}
            accent="#cc4c95"
          />
          {group("documents", "community", "forms", "commerce").length ? (
            <Shelf
              rows={group("documents", "community", "forms", "commerce").slice(
                0,
                6,
              )}
              locale={locale}
            />
          ) : (
            <div className={s.grownGateways}>
              {["documents", "community", "commerce"].map((f) => (
                <FamilyFeature family={f} locale={locale} key={f} />
              ))}
            </div>
          )}
        </section>
      ) : null}
      {visible("bundles") ? (
        <ResourceSection
          title={copy("bundleTitle", locale)}
          sub={copy("bundleSub", locale)}
          icon="Route"
          family="bundles"
          rows={group("bundles")}
          locale={locale}
          adSlots={e.adSlots}
          tint
        />
      ) : null}
      {visible("new") && rows.length ? (
        <section data-kidflix-section="new" className={s.section}>
          <SectionTitle
            title={copy("newTitle", locale)}
            sub={copy("newSub", locale)}
            icon="Sparkles"
            href={path(locale, "/explore?sort=new")}
            locale={locale}
            accent="#1765cd"
          />
          <Shelf
            rows={[...rows]
              .sort(
                (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
              )
              .slice(0, 6)}
            locale={locale}
          />
        </section>
      ) : null}
      {visible("continuity") ? (
        <div data-kidflix-section="continuity">
          <SavedDiscoveries locale={locale} compact recent />
        </div>
      ) : null}
      {visible("closing") ? (
        <section
          data-kidflix-section="closing"
          className={`${s.section} ${s.closing}`}
        >
          <div className={s.closingImage}>
            <img
              src="/kidflix/closing.jpg"
              alt=""
              loading="lazy"
              width={600}
              height={400}
            />
            <span>
              <I name="Heart" size={23} />
            </span>
          </div>
          <div>
            <span className={s.eyebrow}>{copy("free", locale)}</span>
            <h2>{copy("closingTitle", locale)}</h2>
            <p>{copy("closingSub", locale)}</p>
            <Link className={s.primary} href={path(locale, "/explore")}>
              {copy("explore", locale)}
              <I name="ArrowRight" size={18} />
            </Link>
          </div>
          <I name="Sparkles" size={62} className={s.closingSpark} />
        </section>
      ) : null}
      <div data-kidflix-end className={s.promiseStrip}>
        <span>
          <I name="Compass" />
          {copy("worlds", locale)}
        </span>
        <span>
          <I name="ShieldCheck" />
          {copy("noAccount", locale)}
        </span>
        <span>
          <I name="Globe" />
          {tr(
            [
              "English · Français · العربية",
              "Français · English · العربية",
              "العربية · English · Français",
            ],
            locale,
          )}
        </span>
        <span>
          <I name="Heart" />
          {copy("together", locale)}
        </span>
      </div>
    </HomeSequence>
  );
}
