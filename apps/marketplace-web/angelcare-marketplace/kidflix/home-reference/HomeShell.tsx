"use client";
import Link from "next/link";
import { useState } from "react";
import { WORLDS, path, tr, type Locale } from "../catalogue";
import { HomeIcon as I } from "./HomeIcon";
import { useGuest } from "../continuity";
import { interpretSearch } from "../journey/contract";
import { navigateKidFlix } from "../navigation-events";
import { DocumentsFooter } from "../documents/DocumentShell";
import { ART, href } from "./content";
import s from "./home.module.css";
export function Atlas({
  sheet,
  cell,
  columns = 4,
  rows = 4,
  className = "",
  label,
}: {
  sheet: string;
  cell: number;
  columns?: number;
  rows?: number;
  className?: string;
  label?: string;
}) {
  // The generated artwork contains nonuniform paper panels. Sample each measured
  // rectangle directly, so adjacent covers never leak into another topic card.
  const bounds =
    sheet === "topics-01"
      ? {
          x: [0, 423, 783, 1154, 1448],
          y: [0, 275, 551, 814, 1086],
          width: 1448,
          height: 1086,
        }
      : sheet === "collections-01"
        ? {
            x: [0, 362, 724, 1086, 1448],
            y: [0, 279, 543, 803, 1086],
            width: 1448,
            height: 1086,
          }
        : null;
  const column = cell % columns,
    row = Math.floor(cell / columns);
  const x = bounds ? bounds.x[column] + 2 : 0;
  const y = bounds ? bounds.y[row] + 2 : 0;
  const width = bounds ? bounds.x[column + 1] - bounds.x[column] - 4 : 1;
  const height = bounds ? bounds.y[row + 1] - bounds.y[row] - 4 : 1;
  return (
    <span
      className={`${s.atlas} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label}
      style={{
        backgroundImage: `url(${ART}${sheet}.png)`,
        backgroundSize: bounds
          ? `${(bounds.width / width) * 100}% ${(bounds.height / height) * 100}%`
          : `${columns * 100}% ${rows * 100}%`,
        backgroundPosition: bounds
          ? `${(x / (bounds.width - width)) * 100}% ${(y / (bounds.height - height)) * 100}%`
          : `${((cell % columns) * 100) / (columns - 1)}% ${(Math.floor(cell / columns) * 100) / (rows - 1)}%`,
      }}
    />
  );
}
export function HomeHeader({ locale }: { locale: Locale }) {
  const guest = useGuest(),
    [menu, setMenu] = useState(false);
  const auth = (mode: string) =>
    `/angelcare-marketplace/${locale}/auth/${mode}?returnTo=${encodeURIComponent(path(locale, "/my"))}`;
  return (
    <header className={s.header} data-home-reference-header>
      <div className={s.utility}>
        <span>
          <I name="Heart" size={14} />
          {tr(
            [
              "Helping curious minds learn & grow",
              "Pour apprendre, découvrir et grandir",
              "للتعلّم والاكتشاف والنمو",
            ],
            locale,
          )}
        </span>
        <span>
          <I name="Globe" size={14} />
          {tr(
            [
              "Free educational resources for home & classrooms",
              "Des ressources gratuites pour la maison et la classe",
              "موارد تعليمية مجانية للمنزل والصف",
            ],
            locale,
          )}
        </span>
        <nav aria-label={tr(["Languages", "Langues", "اللغات"], locale)}>
          {(["en", "fr", "ar"] as const).map((l) => (
            <Link
              key={l}
              href={path(l)}
              lang={l}
              aria-current={locale === l ? "page" : undefined}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </nav>
      </div>
      <div className={s.headerMain}>
        <Link
          className={s.brand}
          href={path(locale)}
          aria-label={tr(
            [
              "KidFlix homepage",
              "Accueil KidFlix",
              "الصفحة الرئيسية لكيدفليكس",
            ],
            locale,
          )}
        >
          <img
            src="/kidflix/kidflix-official-optimized.webp"
            width={175}
            height={76}
            alt="KidFlix"
          />
        </Link>
        <form
          role="search"
          className={s.search}
          action={href(locale)}
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") || "");
            navigateKidFlix(href(locale, interpretSearch(q)));
          }}
        >
          <input
            type="search"
            name="q"
            maxLength={100}
            aria-label={tr(
              ["Search KidFlix", "Rechercher dans KidFlix", "ابحث في كيدفليكس"],
              locale,
            )}
            placeholder={tr(
              [
                "Search free printables, worksheets, activities, and more…",
                "Fiches, histoires, activités… trouvez votre prochaine idée",
                "ابحث عن أوراق عمل وقصص وأنشطة والمزيد…",
              ],
              locale,
            )}
          />
          <button aria-label={tr(["Search", "Rechercher", "بحث"], locale)}>
            <I name="Search" size={22} />
          </button>
        </form>
        <button
          className={s.browseButton}
          onClick={() => setMenu((v) => !v)}
          aria-expanded={menu}
          aria-controls="kidflix-home-categories"
        >
          <I name="LayoutGrid" size={25} />
          <span>
            {tr(["Browse", "Explorer", "تصفّح"], locale)}
            <br />
            {tr(["Categories", "les catégories", "الفئات"], locale)}
          </span>
          <I name="ChevronDown" size={12} />
        </button>
        <Link className={s.account} href={path(locale, "/saved")}>
          <I name="Heart" size={25} />
          <span>
            {tr(["Favorites", "Favoris", "المفضلة"], locale)}
            {guest.saved.length > 0 ? <b> {guest.saved.length}</b> : null}
          </span>
        </Link>
        <Link className={s.account} href={path(locale, "/my")}>
          <I name="Download" size={25} />
          <span>{tr(["My Library", "Bibliothèque", "مكتبتي"], locale)}</span>
        </Link>
        <Link className={s.account} href={auth("login")}>
          <I name="UserRound" size={25} />
          <span>{tr(["Sign In", "Connexion", "دخول"], locale)}</span>
        </Link>
        <Link className={s.join} href={auth("register")}>
          <I name="Gift" size={23} />
          <span>
            {tr(["All resources", "Des ressources", "الموارد"], locale)}
            <br />
            {tr(["are free!", "gratuites !", "مجانية!"], locale)}
          </span>
        </Link>
      </div>
      <nav
        className={s.categoryRail}
        aria-label={tr(
          ["Resource categories", "Catégories de ressources", "فئات الموارد"],
          locale,
        )}
      >
        {WORLDS.map((w, i) => (
          <Link key={w.key} href={href(locale, {}, w.key)}>
            <Atlas sheet="icons" cell={i} />
            <span>
              <small>{i + 1}</small>
              {tr(w.title, locale)}
            </span>
          </Link>
        ))}
      </nav>
      {menu ? (
        <nav
          id="kidflix-home-categories"
          className={s.categoryMenu}
          aria-label={tr(
            ["All categories", "Toutes les catégories", "كل الفئات"],
            locale,
          )}
        >
          {WORLDS.map((w, i) => (
            <Link
              key={w.key}
              onClick={() => setMenu(false)}
              href={href(locale, {}, w.key)}
            >
              <Atlas sheet="icons" cell={i} />
              {tr(w.title, locale)}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
export function HomeFooter({locale}:{locale:Locale}){return <DocumentsFooter locale={locale}/>;}
