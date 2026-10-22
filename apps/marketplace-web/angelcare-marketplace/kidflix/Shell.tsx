"use client";
import {usePathname,useSearchParams} from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { WORLDS, INTENTS, path, tr, type Locale } from "./catalogue";
import { copy } from "./copy";
import { I } from "./Icons";
import { GuestProvider, useGuest } from "./continuity";
import s from "./kidflix.module.css";
import { Navigation } from "./Navigation";
import { navigateKidFlix } from "./navigation-events";
import { EditionLanguage } from "./journey/Discovery";
import { interpretSearch } from "./journey/contract";
import { j } from "./journey/copy";
import { usePersonal } from "./journey/store";
import js from "./journey/journey.module.css";
export function SearchBox({
  locale,
  large = false,
  initial = "",
}: {
  locale: Locale;
  large?: boolean;
  initial?: string;
}) {
  return (
    <form
      className={`${s.search} ${large ? s.heroSearch : ""}`}
      action={path(locale, "/explore")}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") || "");
        navigateKidFlix(
          path(locale, "/explore?") + (()=>{const params=new URLSearchParams(location.search);for(const key of ["q","intent","age","duration","page"])params.delete(key);for(const [key,value] of Object.entries(interpretSearch(q)))params.set(key,value);return params;})(),
        );
      }}
    >
      <I name="Search" />
      <input
        type="search"
        name="q"
        defaultValue={initial}
        aria-label={copy("searchShort", locale)}
        placeholder={copy(large ? "search" : "searchShort", locale)}
        maxLength={100}
      />
      <button type="submit" aria-label={copy("searchButton", locale)}>
        <I name="Search" />
      </button>
    </form>
  );
}
function Header({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const query = useSearchParams();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const guest = useGuest();

  useEffect(() => {
    if (!menu) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        button.current?.focus();
      }
    };
    const outside = (e: PointerEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !button.current?.contains(e.target as Node)
      ) {
        setMenu(false);
      }
    };
    document.addEventListener("keydown", esc);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", esc);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menu]);

  const toggleWorlds = (target: HTMLButtonElement) => {
    button.current = target;
    setMenu((open) => !open);
  };

  return (
    <header className={`${s.header} ${s.headerV2}`}>
      <div className={s.headerV2Utility}>
        <div className={s.headerV2UtilityInner}>
          <span className={s.headerV2UtilityItem}>
            <I name="Globe" size={15} />
            {tr([
              "A world of discovery for children and families",
              "Un monde de découvertes pour enfants et familles",
              "عالم من الاكتشاف للأطفال والعائلات",
            ], locale)}
          </span>
          <span className={s.headerV2UtilityItem}>
            <I name="Compass" size={15} />
            {copy("worlds", locale)}
          </span>
          <span className={s.headerV2UtilityItem}>
            <I name="ShieldCheck" size={15} />
            {copy("noAccount", locale)}
          </span>
          <span className={s.headerV2UtilityItem}>
            <I name="Heart" size={15} />
            {copy("together", locale)}
          </span>
        </div>
      </div>

      <div className={s.headerMain}>
        <div className={s.headerV2Brand}>
          <Link
            href={path(locale)}
            className={s.logo}
            aria-label={`KidFlix · ${copy("home", locale)}`}
          >
            <img
              src="/kidflix/kidflix-official-optimized.webp"
              width={174}
              height={70}
              alt="KidFlix"
              fetchPriority="high"
            />
          </Link>
          <div className={s.headerV2BrandMessage}>
            <strong>{copy("little", locale)}</strong>
            <span>{copy("together", locale)}</span>
          </div>
        </div>

        <div className={s.headerSearch}>
          <SearchBox locale={locale} />
        </div>

        <div className={s.headerActions}>
          <Link
            href={path(locale, "/my")}
            className={`${s.savedButton} ${s.headerV2Saved}`}
            aria-label={j("my", locale)}
          >
            <I name="Bookmark" size={23} />
            <span className={s.headerV2SavedLabel}>{copy("savedShort", locale)}</span>
            {guest.ready && guest.saved.length > 0 ? (
              <span className={s.headerV2SavedCount}>{guest.saved.length}</span>
            ) : null}
          </Link>
          <div className={s.headerV2Language}>
            <EditionLanguage locale={locale} />
          </div>
          <Link className={s.headerV2CTA} href={path(locale, "/explore")}>
            {copy("explore", locale)}
            <I name="ArrowRight" size={17} />
          </Link>
          <button
            ref={button}
            className={s.menuButton}
            aria-expanded={menu}
            aria-controls="kidflix-world-menu"
            onClick={(e) => toggleWorlds(e.currentTarget)}
            aria-label={copy("worlds", locale)}
          >
            <I name={menu ? "X" : "Menu"} />
          </button>
        </div>
      </div>

      <nav
        className={s.nav}
        aria-label={tr([
          "Main navigation",
          "Navigation principale",
          "التنقل الرئيسي",
        ], locale)}
      >
        <Link href={path(locale)} aria-current={pathname === path(locale) ? "page" : undefined}>
          <I name="Sun" />
          <span>{copy("home", locale)}</span>
        </Link>
        {INTENTS.map(([key, icon, label]) => (
          <Link
            key={key}
            href={path(locale, "/explore?intent=" + key)}
            aria-current={pathname === path(locale, "/explore") && query.get("intent") === key ? "page" : undefined}
          >
            <I name={icon} />
            <span>{tr(label, locale)}</span>
          </Link>
        ))}
        <button
          onClick={(e) => toggleWorlds(e.currentTarget)}
          aria-expanded={menu}
          aria-controls="kidflix-world-menu"
        >
          <I name="Compass" />
          <span>{copy("worlds", locale)}</span>
          <I name="ChevronDown" size={13} />
        </button>
      </nav>

      <div className={s.headerV2WorldRail}>
        <Link href={path(locale, "/explore")} className={s.headerV2WorldLead}>
          <span>
            {tr([
              "Explore the KidFlix worlds",
              "Explorez les univers KidFlix",
              "استكشف عوالم كيدفليكس",
            ], locale)}
          </span>
          <I name="ChevronRight" size={19} />
        </Link>
        <div
          className={s.headerV2WorldTrack}
          role="navigation"
          aria-label={copy("worlds", locale)}
        >
          {WORLDS.map((world) => (
            <Link
              key={world.key}
              href={path(locale, "/explore/" + world.key)}
              className={s.headerV2WorldItem}
              aria-current={pathname === path(locale, "/explore/" + world.key) ? "page" : undefined}
              style={{
                "--accent": world.color,
                "--tint": world.tint,
              } as React.CSSProperties}
            >
              <span className={s.headerV2WorldIcon}><I name={world.icon} size={21} /></span>
              <span className={s.headerV2WorldLabel}>{tr(world.title, locale)}</span>
            </Link>
          ))}
        </div>
      </div>

      {menu ? (
        <div ref={ref} id="kidflix-world-menu" className={s.mega}>
          <div className={s.megaIntro}>
            <span className={s.eyebrow}>KIDFLIX</span>
            <h2>{copy("worldTitle", locale)}</h2>
            <p>{copy("worldSub", locale)}</p>
            <Link
              href={path(locale, "/explore")}
              onClick={() => setMenu(false)}
            >
              {copy("explore", locale)} <I name="ArrowRight" size={16} />
            </Link>
          </div>
          <div className={s.megaGrid}>
            {WORLDS.map((w) => (
              <Link
                href={path(locale, "/explore/" + w.key)}
                key={w.key}
                style={{
                  "--accent": w.color,
                  "--tint": w.tint,
                } as React.CSSProperties}
                onClick={() => setMenu(false)}
              >
                <span><I name={w.icon} /></span>
                {tr(w.title, locale)}
                <I name="ChevronRight" size={14} />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Footer({ locale }: { locale: Locale }) {
  const groups = [
    [
      "footerLearn",
      ["stories", "documents", "learning", "audio", "video", "presentations"],
    ],
    [
      "footerPlay",
      [
        "printables",
        "activities",
        "assessments",
        "visual-cards",
        "tools",
        "bundles",
      ],
    ],
    ["footerGrown", ["planners", "forms", "community", "commerce"]],
  ] as const;
  return (
    <footer className={s.footer}>
      <div className={s.footerTop}>
        <div className={s.footerBrand}>
          <Link href={path(locale)}>
            <img
              src="/kidflix/kidflix-official-optimized.webp"
              width={195}
              height={78}
              alt="KidFlix"
              loading="lazy"
            />
          </Link>
          <p>{copy("footerText", locale)}</p>
          <span className={s.footerStamp}>
            <I name="Heart" />
            {copy("together", locale)}
          </span>
          <Link
            href={`/angelcare-marketplace/${locale}`}
            className={s.marketplace}
          >
            {copy("marketplace", locale)} <I name="ArrowUpRight" size={16} />
          </Link>
        </div>
        {groups.map(([title, keys]) => (
          <div className={s.footerGroup} key={title}>
            <h3>{copy(title, locale)}</h3>
            {keys.map((k) => (
              <Link key={k} href={path(locale, "/explore/" + k)}>
                {tr(WORLDS.find((w) => w.key === k)!.title, locale)}
              </Link>
            ))}
          </div>
        ))}
        <div className={s.footerNote}>
          <div className={s.footerStar}>
            <I name="Sun" size={39} />
          </div>
          <h3>
            {tr(
              [
                "Stay curious. Grow together.",
                "Restez curieux. Grandissons ensemble.",
                "ابقَ فضولياً. لننمُ معاً.",
              ],
              locale,
            )}
          </h3>
          <p>{copy("noAccount", locale)}</p>
          <Link href={path(locale, "/about")}>
            {copy("about", locale)}
            <I name="ArrowRight" size={16} />
          </Link>
          <span className={s.footerShapes} aria-hidden="true">
            ✦ · ✧
          </span>
        </div>
      </div>
      <div className={s.footerBottom}>
        <span>© {new Date().getFullYear()} KidFlix · AngelCare</span>
        <div>
          <Link href={path(locale, "/privacy")}>{copy("privacy", locale)}</Link>
          <Link href={path(locale, "/accessibility")}>
            {copy("access", locale)}
          </Link>
          <span>
            {locale === "en"
              ? "English"
              : locale === "fr"
                ? "Français"
                : "العربية"}
          </span>
        </div>
      </div>
    </footer>
  );
}
function Content({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const personal = usePersonal();
  return (
    <div
      className={s.root}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-kidflix-shell
    >
      <a className={s.skip} href="#kidflix-content">
        {tr(
          ["Skip to content", "Aller au contenu", "انتقل إلى المحتوى"],
          locale,
        )}
      </a>
      <Header locale={locale} />
      <main id="kidflix-content">
        {personal.error ? (
          <p className={js.notice} role="status">
            {j("storage", locale)}
          </p>
        ) : null}
        {children}
      </main>
      <Footer locale={locale} />
      <Navigation locale={locale} />
    </div>
  );
}
export function KidFlixShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <GuestProvider>
      <Content locale={locale}>{children}</Content>
    </GuestProvider>
  );
}
