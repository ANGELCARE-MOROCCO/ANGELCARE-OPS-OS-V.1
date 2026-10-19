"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { WORLDS, INTENTS, path, tr, type Locale } from "./catalogue";
import { copy } from "./copy";
import { I } from "./Icons";
import { GuestProvider, useGuest } from "./continuity";
import s from "./kidflix.module.css";
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
  const [menu, setMenu] = useState(false),
    ref = useRef<HTMLDivElement>(null),
    button = useRef<HTMLButtonElement>(null),
    guest = useGuest();
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
      )
        setMenu(false);
    };
    document.addEventListener("keydown", esc);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", esc);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menu]);
  return (
    <header className={s.header}>
      <div className={s.headerMain}>
        <Link
          href={path(locale)}
          className={s.logo}
          aria-label={`KidFlix · ${copy("home", locale)}`}
        >
          <img
            src="/kidflix/kidflix-official.png"
            width={174}
            height={70}
            alt="KidFlix"
            fetchPriority="high"
          />
        </Link>
        <div className={s.headerSearch}>
          <SearchBox locale={locale} />
        </div>
        <div className={s.headerActions}>
          <label className={s.language}>
            <I name="Globe" size={17} />
            <span className={s.sr}>
              {tr(["Language", "Langue", "اللغة"], locale)}
            </span>
            <select
              aria-label={tr(["Language", "Langue", "اللغة"], locale)}
              value={locale}
              onChange={(e) => {
                const tail = location.pathname.replace(
                  /^\/kidflix\/(en|fr|ar)/,
                  "",
                );
                location.assign(
                  path(e.target.value as Locale, tail) + location.search,
                );
              }}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="ar">عربي</option>
            </select>
          </label>
          <Link
            href={path(locale, "/saved")}
            className={s.savedButton}
            aria-label={copy("saved", locale)}
          >
            <I name="Heart" />
            {guest.ready && guest.saved.length > 0 ? (
              <span>{guest.saved.length}</span>
            ) : null}
          </Link>
          <button
            ref={button}
            className={s.menuButton}
            aria-expanded={menu}
            aria-controls="kidflix-world-menu"
            onClick={(e) => {
              button.current = e.currentTarget;
              setMenu((v) => !v);
            }}
            aria-label={copy("worlds", locale)}
          >
            <I name={menu ? "X" : "Menu"} />
          </button>
        </div>
      </div>
      <nav
        className={s.nav}
        aria-label={tr(
          ["Main navigation", "Navigation principale", "التنقل الرئيسي"],
          locale,
        )}
      >
        <Link href={path(locale)}>
          <I name="Sun" />
          <span>{copy("home", locale)}</span>
        </Link>
        {INTENTS.map(([key, icon, label]) => (
          <Link key={key} href={path(locale, "/explore?intent=" + key)}>
            <I name={icon} />
            <span>{tr(label, locale)}</span>
          </Link>
        ))}
        <button
          onClick={(e) => {
            button.current = e.currentTarget;
            setMenu((v) => !v);
          }}
          aria-expanded={menu}
          aria-controls="kidflix-world-menu"
        >
          <I name="Compass" />
          <span>{copy("worlds", locale)}</span>
          <I name="ChevronDown" size={13} />
        </button>
      </nav>
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
                style={
                  {
                    "--accent": w.color,
                    "--tint": w.tint,
                  } as React.CSSProperties
                }
                onClick={() => setMenu(false)}
              >
                <span>
                  <I name={w.icon} />
                </span>
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
              src="/kidflix/kidflix-official.png"
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
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>, stop: ReturnType<typeof setTimeout>;
    const click = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      )
        return;
      const a = (e.target as Element).closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (
        url.origin !== location.origin ||
        (url.pathname === location.pathname && url.search === location.search)
      )
        return;
      t = setTimeout(() => setPending(true), 160);
      stop = setTimeout(() => setPending(false), 15000);
    };
    document.addEventListener("click", click);
    const clear = () => {
      clearTimeout(t);
      clearTimeout(stop);
      setPending(false);
    };
    window.addEventListener("pageshow", clear);
    return () => {
      document.removeEventListener("click", click);
      window.removeEventListener("pageshow", clear);
      clearTimeout(t);
      clearTimeout(stop);
    };
  }, []);
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
      <main id="kidflix-content">{children}</main>
      <Footer locale={locale} />
      {pending ? (
        <div role="status" className={s.navigationToast}>
          <span className={s.loadingRing} />
          <img
            src="/kidflix/kidflix-official.png"
            width={94}
            height={38}
            alt="KidFlix"
          />
          <small>{copy("loading", locale)}</small>
        </div>
      ) : null}
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
