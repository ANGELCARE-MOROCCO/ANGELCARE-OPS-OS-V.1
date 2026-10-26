"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Heart, Globe, Search, LayoutGrid, ChevronDown, X } from "lucide-react";
import { WORLDS, path, tr, type Locale } from "../catalogue";
import { PersonalNavigation } from "../personal/PersonalNavigation";
import { interpretSearch } from "../journey/contract";
import { navigateKidFlix } from "../navigation-events";
import { discoveryHref, localizedHref, routeFamily } from "./model";
import s from "./shell.module.css";
export function CategoryMark({ index }: { index: number }) {
  return (
    <span
      className={s.categoryMark}
      aria-hidden="true"
      style={{
        backgroundPosition: `${((index % 4) * 100) / 3}% ${(Math.floor(index / 4) * 100) / 3}%`,
      }}
    />
  );
}
export function WorldHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname(),
    params = useSearchParams(),
    query = params.toString(),
    route = pathname + "?" + query;
  const family = routeFamily(pathname),
    searchValue = params.get("q") || "";
  const [search, setSearch] = useState(searchValue),
    [open, setOpen] = useState(false),
    [filter, setFilter] = useState(""),
    [hash, setHash] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLButtonElement>(null),
    id = useId(),
    titleId = useId(),
    searchId = useId();
  useEffect(() => {
    setSearch(searchValue);
    setOpen(false);
    setFilter("");
  }, [route, searchValue]);
  useEffect(() => {
    const read = () => setHash(location.hash);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [route]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) {
      if (element.open) element.close();
      return;
    }
    if (!element.open) element.showModal();
    element.querySelector("input")?.focus();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
      if (element.open) element.close();
    };
  }, [open]);
  const results = WORLDS.filter((w) =>
    (tr(w.title, locale) + " " + tr(w.short, locale))
      .toLocaleLowerCase(locale)
      .includes(filter.trim().toLocaleLowerCase(locale)),
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    navigateKidFlix(
      discoveryHref(locale, { ...interpretSearch(search), page: "1" }),
    );
  }
  function close() {
    setOpen(false);
  }
  function backdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const r = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      close();
  }
  return (
    <header className={s.header} data-kidflix-world-header="r1">
      <div className={s.utility}>
        <div>
          <span>
            <Heart size={13} aria-hidden="true" />
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
            <Globe size={13} aria-hidden="true" />
            {tr(
              [
                "Resources for home & classrooms",
                "Des ressources pour la maison et la classe",
                "موارد للمنزل والصف",
              ],
              locale,
            )}
          </span>
          <nav aria-label={tr(["Languages", "Langues", "اللغات"], locale)}>
            {(["en", "fr", "ar"] as const).map((l) => (
              <Link
                key={l}
                href={localizedHref(pathname, query, l, hash)}
                lang={l}
                aria-current={l === locale ? "page" : undefined}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className={s.main}>
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
            alt="KidFlix"
            width={175}
            height={76}
            fetchPriority="high"
          />
        </Link>
        <form
          className={s.search}
          action={path(locale, "/explore")}
          role="search"
          onSubmit={submit}
        >
          <input
            type="search"
            name="q"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={tr(
              ["Search KidFlix", "Rechercher dans KidFlix", "ابحث في كيدفليكس"],
              locale,
            )}
            placeholder={tr(
              [
                "Search resources, worksheets, stories and more…",
                "Ressources, fiches, histoires… trouvez votre prochaine idée",
                "ابحث عن الموارد وأوراق العمل والقصص والمزيد…",
              ],
              locale,
            )}
          />
          <button
            type="submit"
            aria-label={tr(["Search", "Rechercher", "بحث"], locale)}
          >
            <Search size={21} />
          </button>
        </form>
        <button
          ref={opener}
          className={s.browse}
          type="button"
          aria-label={tr(
            ["Browse categories", "Explorer les catégories", "تصفح الفئات"],
            locale,
          )}
          aria-expanded={open}
          aria-controls={id}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <LayoutGrid size={23} />
          <span>
            {tr(
              ["Browse categories", "Explorer les catégories", "تصفح الفئات"],
              locale,
            )}
          </span>
          <ChevronDown size={13} />
        </button>
        <PersonalNavigation locale={locale} />
      </div>
      <nav
        className={s.rail}
        aria-label={tr(
          ["Resource categories", "Catégories de ressources", "فئات الموارد"],
          locale,
        )}
      >
        {WORLDS.map((world, index) => (
          <Link
            key={world.key}
            href={path(locale, "/explore/" + world.key)}
            aria-current={family === world.key ? "page" : undefined}
          >
            <CategoryMark index={index} />
            <span>
              <small>{index + 1}</small>
              {tr(world.title, locale)}
            </span>
          </Link>
        ))}
      </nav>
      <dialog
        ref={dialog}
        id={id}
        className={s.dialog}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          setOpen(false);
          if (opener.current?.isConnected)
            opener.current.focus({ preventScroll: true });
        }}
        onClick={backdrop}
      >
        <div className={s.dialogHeading}>
          <div>
            <span>KIDFLIX</span>
            <h2 id={titleId}>
              {tr(
                [
                  "Explore all 16 categories",
                  "Explorer les 16 catégories",
                  "استكشف الفئات الست عشرة",
                ],
                locale,
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={tr(
              ["Close categories", "Fermer les catégories", "إغلاق الفئات"],
              locale,
            )}
          >
            <X size={21} />
          </button>
        </div>
        <label className={s.menuSearch} htmlFor={searchId}>
          <Search size={17} />
          <input
            id={searchId}
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={tr(
              ["Find a category", "Trouver une catégorie", "ابحث عن فئة"],
              locale,
            )}
            aria-label={tr(
              ["Find a category", "Trouver une catégorie", "ابحث عن فئة"],
              locale,
            )}
          />
        </label>
        <div className={s.menuGrid}>
          {results.map((world) => (
            <Link
              key={world.key}
              href={path(locale, "/explore/" + world.key)}
              onClick={close}
            >
              <CategoryMark
                index={WORLDS.findIndex((w) => w.key === world.key)}
              />
              <strong>{tr(world.title, locale)}</strong>
              <span>{tr(world.short, locale)}</span>
            </Link>
          ))}
        </div>
        {!results.length ? (
          <p className={s.menuEmpty} role="status">
            {tr(
              [
                "No matching category. Try another word.",
                "Aucune catégorie correspondante. Essayez un autre mot.",
                "لا توجد فئة مطابقة. جرّب كلمة أخرى.",
              ],
              locale,
            )}
          </p>
        ) : null}
        <Link className={s.all} href={path(locale, "/explore")} onClick={close}>
          {tr(
            [
              "Search all resources",
              "Rechercher toutes les ressources",
              "ابحث في جميع الموارد",
            ],
            locale,
          )}
        </Link>
      </dialog>
    </header>
  );
}
