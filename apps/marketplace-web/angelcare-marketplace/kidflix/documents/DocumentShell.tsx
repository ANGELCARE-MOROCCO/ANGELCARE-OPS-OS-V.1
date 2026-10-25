"use client";
import Link from "next/link";
import { KidFlixFooter } from "../personal/KidFlixFooter";
import { interpretSearch } from "../journey/contract";
import { navigateKidFlix } from "../navigation-events";
import { UserRound, UsersRound } from "lucide-react";
import {
  useState,
  useCallback,
  useContext,
  createContext,
  type ReactNode,
  type CSSProperties,
} from "react";
import { WORLDS, tr, path, type Locale } from "../catalogue";
import { useGuest } from "../continuity";
import { I } from "../Icons";
import {
  ART,
  documentHref,
  type DocumentFilters,
} from "./model";
import s from "./documents.module.css";
const Settings = createContext<{
  edition: Record<string, any>;
  publish: (v: Record<string, any>) => void;
}>({ edition: {}, publish: () => {} });
export function DocumentsSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [edition, setEdition] = useState<Record<string, any>>({}),
    publish = useCallback((v: Record<string, any>) => setEdition(v), []);
  return (
    <Settings.Provider value={{ edition, publish }}>
      {children}
    </Settings.Provider>
  );
}
export const useDocumentsSettings = () => useContext(Settings);
export function ArtIcon({
  index,
  nav = false,
  className = "",
  size,
}: {
  index: number;
  nav?: boolean;
  className?: string;
  size?: number;
}) {
  if (index === 30 && !nav)
    return (
      <span className={s.targetIcon} aria-hidden="true">
        <I name="ArrowUpRight" size={22} />
      </span>
    );
  const columns = nav ? 4 : 6,
    rows = nav ? 4 : 5;
  return (
    <span
      aria-hidden="true"
      className={`${s.artIcon} ${className}`}
      style={
        {
          backgroundImage: `url(${ART}${nav ? "navigation" : "icons"}.png)`,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          backgroundPosition: `${((index % columns) * 100) / (columns - 1)}% ${(Math.floor(index / columns) * 100) / (rows - 1)}%`,
          ...(size ? { width: size, height: size } : {}),
        } as CSSProperties
      }
    />
  );
}
export function DocumentsHeader({ locale }: { locale: Locale }) {
  const guest = useGuest(),
    [more, setMore] = useState(false),
    returnTo = documentHref(locale),
    auth = (mode: string) =>
      `/angelcare-marketplace/${locale}/auth/${mode}?returnTo=${encodeURIComponent(returnTo)}`;
  const audiences = [
    ["educator", ["Teachers", "Enseignants", "المعلمون"]],
    ["parent", ["Parents", "Parents", "الآباء"]],
    ["homeschool", ["Homeschoolers", "École à la maison", "التعلم المنزلي"]],
    ["child", ["Kindergarten", "Maternelle", "الروضة"]],
  ] as const;
  return (
    <header className={s.header} data-documents-header>
      <div className={s.utility}>
        <span>
          <I name="Heart" size={13} />
          {tr(
            [
              "Free educational resources for brighter learners!",
              "Des ressources gratuites pour apprendre avec plaisir !",
              "موارد تعليمية مجانية لتعلم أكثر إشراقاً!",
            ],
            locale,
          )}
        </span>
        <span>
          <I name="ShieldCheck" size={13} />
          {tr(
            [
              "Documents, guides and templates — explore freely",
              "Documents, guides et modèles à découvrir librement",
              "وثائق وأدلة ونماذج للاستكشاف بحرية",
            ],
            locale,
          )}
        </span>
        <nav
          aria-label={tr(
            ["Browse by audience", "Explorer par public", "التصفح حسب الجمهور"],
            locale,
          )}
        >
          {audiences.map(([key, label]) => (
            <Link
              key={key}
              href={documentHref(
                locale,
                key === "homeschool"
                  ? { need: "homeschool" }
                  : key === "child"
                    ? { grade: "kindergarten" }
                    : { audience: key },
              )}
            >
              {tr(label, locale)}
            </Link>
          ))}
        </nav>
      </div>
      <div className={s.headerMain}>
        <Link
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
            className={s.logo}
            src="/kidflix/kidflix-official-optimized.webp"
            alt="KidFlix"
            width={175}
            height={70}
          />
        </Link>
        <form
          action={path(locale, "/explore")}
          onSubmit={(e) => {
            e.preventDefault();
            const query = String(new FormData(e.currentTarget).get("q") || "");
            navigateKidFlix(
              path(locale, "/explore") +
                "?" +
                new URLSearchParams(interpretSearch(query)),
            );
          }}
          className={s.headerSearch}
          role="search"
        >
          <label className={s.srOnly} htmlFor="documents-global-search">
            {tr(
              [
                "Search KidFlix",
                "Rechercher dans KidFlix",
                "البحث في كيدفليكس",
              ],
              locale,
            )}
          </label>
          <I name="Search" size={18} />
          <input
            id="documents-global-search"
            name="q"
            type="search"
            maxLength={100}
            placeholder={tr(
              [
                "Search for free documents, worksheets, activities and more…",
                "Rechercher documents, fiches, activités et plus…",
                "ابحث عن وثائق وأوراق عمل وأنشطة والمزيد…",
              ],
              locale,
            )}
          />
          <button
            aria-label={tr(
              ["Search KidFlix", "Rechercher dans KidFlix", "ابحث في كيدفليكس"],
              locale,
            )}
          >
            <I name="Search" size={22} />
          </button>
        </form>
        <nav
          className={s.accountNav}
          aria-label={tr(
            [
              "Personal library and account",
              "Bibliothèque et compte",
              "المكتبة والحساب",
            ],
            locale,
          )}
        >
          <Link href={path(locale, "/saved")}>
            <span>
              <I name="Heart" size={25} />
              {guest.ready && guest.saved.length > 0 ? (
                <b>{guest.saved.length}</b>
              ) : null}
            </span>
            {tr(["Favorites", "Favoris", "المفضلة"], locale)}
          </Link>
          <Link href={path(locale, "/my")}>
            <I name="BookOpen" size={25} />
            {tr(["My Library", "Ma bibliothèque", "مكتبتي"], locale)}
          </Link>
          <Link href={auth("login")}>
            <UserRound size={25} aria-hidden="true" />
            {tr(["Sign In", "Connexion", "الدخول"], locale)}
          </Link>
          <Link className={s.join} href={auth("register")}>
            <UsersRound size={20} aria-hidden="true" />
            {tr(["Join Free", "Créer un compte", "انضم مجاناً"], locale)}
          </Link>
        </nav>
      </div>
      <nav
        className={s.categoryNav}
        aria-label={tr(
          [
            "KidFlix resource categories",
            "Catégories de ressources KidFlix",
            "فئات موارد كيدفليكس",
          ],
          locale,
        )}
      >
        {WORLDS.map((w, i) => (
          <Link
            key={w.key}
            href={path(locale, "/explore/" + w.key)}
            aria-current={w.key === "documents" ? "page" : undefined}
          >
            <ArtIcon nav index={i} />
            <span>{tr(w.title, locale)}</span>
          </Link>
        ))}
        <button
          className={s.more}
          aria-expanded={more}
          aria-controls="documents-category-directory"
          onClick={() => setMore((v) => !v)}
        >
          •••<small>{tr(["More", "Plus", "المزيد"], locale)}</small>
        </button>
      </nav>
      {more ? (
        <div id="documents-category-directory" className={s.morePanel}>
          {WORLDS.map((w) => (
            <Link key={w.key} href={path(locale, "/explore/" + w.key)}>
              {tr(w.title, locale)}
            </Link>
          ))}
          <button onClick={() => setMore(false)}>
            {tr(["Close", "Fermer", "إغلاق"], locale)}
          </button>
        </div>
      ) : null}
    </header>
  );
}
export function DocumentsFooter({locale}:{locale:Locale}){const {edition}=useDocumentsSettings();return <KidFlixFooter locale={locale} socialLinks={edition.documentsSocialLinks}/>;}
