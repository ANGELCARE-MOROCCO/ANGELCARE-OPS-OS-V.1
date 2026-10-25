"use client";
import Link from "next/link";
import { useState } from "react";
import { WORLDS, world, path, tr, type Locale } from "../catalogue";
import { useGuest } from "../continuity";
import { CategoryResourceFooter } from "./CategoryFooter";
import { I } from "./CategoryIcon";
import { discoveryHref, quickChoices } from "./model";
import { ATLAS_SIZE, ICON_RECTS } from "./artwork";
import s from "./reference.module.css";
export function Art({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  const [x, y, ww, hh] = ICON_RECTS[Math.max(0, Math.min(35, index))],
    [w, h] = ATLAS_SIZE,
    side = Math.max(ww, hh);
  return (
    <span aria-hidden="true" className={`${s.artIcon} ${className}`}>
      <span
        className={s.artInner}
        style={{
          width: `${(ww / side) * 100}%`,
          height: `${(hh / side) * 100}%`,
          backgroundSize: `${(w / ww) * 100}% ${(h / hh) * 100}%`,
          backgroundPosition: `${(x / (w - ww)) * 100}% ${(y / (h - hh)) * 100}%`,
        }}
      />
    </span>
  );
}
const NAV_LABELS:Record<string,readonly[string,string,string]>={documents:["Documents","Documents","وثائق"],printables:["Printables","Imprimables","مطبوعات"],stories:["Stories","Histoires","قصص"],learning:["Courses","Formations","دورات"],video:["Video","Vidéos","فيديو"],audio:["Audio","Audio","صوت"],"visual-cards":["Visual Cards","Cartes","بطاقات"],presentations:["Slides","Diaporamas","شرائح"],assessments:["Quizzes","Quiz","اختبارات"],activities:["Activities","Activités","أنشطة"],tools:["Tools","Outils","أدوات"],planners:["Planners","Plannings","مخططات"],forms:["Questionnaires","Questionnaires","استبيانات"],community:["Community","Communauté","مجتمع"],commerce:["Toolkits","Kits","حزم أدوات"],bundles:["Bundles","Parcours","مسارات"]};
export function CategoryHeader({
  locale,
  family,
}: {
  locale: Locale;
  family: string;
}) {
  const guest = useGuest(),
    [menu, setMenu] = useState(false),
    returnTo = path(locale, "/my"),
    auth = (mode: string) =>
      `/angelcare-marketplace/${locale}/auth/${mode}?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <header className={s.header} data-category-reference-header>
      <div className={s.utility}>
        <span>
          <b>♥</b>
          {tr(
            [
              "Free learning resources for brighter learners!",
              "Des ressources pour éveiller chaque apprenant !",
              "موارد تعليمية لإشراق المتعلمين!",
            ],
            locale,
          )}
        </span>
        <div className={s.utilityLinks}>
          <Link href={discoveryHref(locale, family, { audience: "educator" })}>
            {tr(["Teachers", "Enseignants", "المعلمون"], locale)}
          </Link>
          <Link href={discoveryHref(locale, family, { audience: "parent" })}>
            {tr(["Parents", "Parents", "الآباء"], locale)}
          </Link>
          {quickChoices(family).some((c) => c.key === "home-learning") ? (
            <Link
              href={discoveryHref(locale, family, { quick: "home-learning" })}
            >
              {tr(["Home Learning", "À la maison", "التعلم المنزلي"], locale)}
            </Link>
          ) : null}
        </div>
        <nav aria-label={tr(["Language", "Langue", "اللغة"], locale)}>
          {(["en", "fr", "ar"] as const).map((l) => (
            <Link
              href={discoveryHref(l, family)}
              key={l}
              lang={l}
              aria-current={l === locale ? "page" : undefined}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </nav>
      </div>
      <div className={s.headerMain}>
        <Link className={s.brand} href={path(locale)} aria-label="KidFlix">
          <img
            src="/kidflix/kidflix-official-optimized.webp"
            alt="KidFlix"
            width={180}
            height={72}
          />
        </Link>
        <form
          action={discoveryHref(locale, family)}
          className={s.headerSearch}
          role="search"
        >
          <input
            aria-label={tr(
              [
                "Search this category",
                "Rechercher dans cette catégorie",
                "ابحث في هذه الفئة",
              ],
              locale,
            )}
            name="q"
            type="search"
            maxLength={100}
            placeholder={tr(
              [
                "Search resources, skills, themes or learning goals…",
                "Ressources, compétences, thèmes…",
                "الموارد والمهارات والموضوعات…",
              ],
              locale,
            )}
          />
          <button aria-label={tr(["Search", "Rechercher", "بحث"], locale)}>
            <I name="Search" size={20} />
          </button>
        </form>
        <button
          className={s.menuButton}
          onClick={() => setMenu((v) => !v)}
          aria-expanded={menu}
          aria-controls="category-reference-menu"
        >
          <I name="LayoutGrid" />
          {tr(["Browse", "Explorer", "تصفح"], locale)}
        </button>
        <Link className={s.account} href={path(locale, "/saved")}>
          <I name="Heart" size={22} />
          <span>
            {tr(["Favorites", "Favoris", "المفضلة"], locale)}
            {guest.saved.length ? <b> {guest.saved.length}</b> : null}
          </span>
        </Link>
        <Link className={s.account} href={path(locale, "/my")}>
          <I name="Download" size={22} />
          <span>{tr(["My Library", "Bibliothèque", "مكتبتي"], locale)}</span>
        </Link>
        <Link className={s.account} href={auth("login")}>
          <I name="UserRound" size={22} />
          <span>{tr(["Sign In", "Connexion", "دخول"], locale)}</span>
        </Link>
        <Link className={s.join} href={auth("register")}>
          <I name="Users" size={19} />
          {tr(["Join Free", "S’inscrire", "انضم مجاناً"], locale)}
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
          <Link
            key={w.key}
            href={path(locale, "/explore/" + w.key)}
            aria-current={w.key === family ? "page" : undefined}
          >
            <span
              className={s.navArt}
              aria-hidden="true"
              style={{
                backgroundPosition: `${((i % 4) * 100) / 3}% ${(Math.floor(i / 4) * 100) / 3}%`,
              }}
            />
            <span>{tr(NAV_LABELS[w.key]||w.short, locale)}</span>
          </Link>
        ))}
      </nav>
      {menu ? (
        <nav
          id="category-reference-menu"
          className={s.categoryMenu}
          aria-label={tr(
            ["All categories", "Toutes les catégories", "كل الفئات"],
            locale,
          )}
        >
          {WORLDS.map((w) => (
            <Link
              onClick={() => setMenu(false)}
              key={w.key}
              href={path(locale, "/explore/" + w.key)}
            >
              <I name={w.icon} size={17} />
              {tr(w.title, locale)}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
export function CategoryFooter({
  locale,
  family,
}: {
  locale: Locale;
  family: string;
}) {
  return (
    <CategoryResourceFooter locale={locale} family={family} />
  );
}
