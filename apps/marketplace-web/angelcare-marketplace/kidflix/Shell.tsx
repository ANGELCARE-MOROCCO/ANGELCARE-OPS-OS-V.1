"use client";
import {usePathname,useSearchParams} from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { WORLDS, path, tr, type Locale } from "./catalogue";
import { copy } from "./copy";
import { I } from "./Icons";
import { GuestProvider } from "./continuity";
import s from "./kidflix.module.css";
import r from "./reference-shell.module.css";
import {DocumentsHeader,DocumentsFooter,DocumentsSettingsProvider} from "./documents/DocumentShell";
import { ReferenceFooter } from "./ReferenceFooter";
import { PremiumHeader } from "./PremiumHeader";
import {CategoryHeader,CategoryFooter} from "./storefront-reference/CategoryShell";
import {FAMILIES as REFERENCE_FAMILIES} from "./storefront-reference/model";
import {HomeHeader,HomeFooter} from "./home-reference/HomeShell";
import hs from "./home-reference/home.module.css";
import { Navigation } from "./Navigation";
import { navigateKidFlix } from "./navigation-events";
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
  const query = useSearchParams(), initial = (query.get("q") || "").slice(0, 100);
  return <PremiumHeader locale={locale} search={<SearchBox key={locale + ":" + initial} locale={locale} initial={initial}/>}/>;
}

function Content({
  locale,
  children,
  variant,
  categoryFamily,
}: {
  locale: Locale;
  children: ReactNode;
  variant?:"documents"|"home";
  categoryFamily?:string;
}) {
  const personal = usePersonal(),pathname=usePathname(),home=variant==="home"||/^\/kidflix\/(en|fr|ar)\/?$/.test(pathname||""),documents=variant==="documents"||/^\/kidflix\/(en|fr|ar)\/explore\/documents\/?$/.test(pathname||"");
  const category=categoryFamily||pathname?.match(/^\/kidflix\/(?:en|fr|ar)\/explore\/([^/]+)\/?$/)?.[1],referenceCategory=category&&REFERENCE_FAMILIES.includes(category)?category:null;
  return (
    <div
      className={`${s.root} ${r.shell} ${home?hs.homeShell:""}`}
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
      {home?<HomeHeader locale={locale}/>:documents?<DocumentsHeader locale={locale}/>:referenceCategory?<CategoryHeader locale={locale} family={referenceCategory}/>:<Header locale={locale} />}
      <main id="kidflix-content">
        {personal.error ? (
          <p className={js.notice} role="status">
            {j("storage", locale)}
          </p>
        ) : null}
        {children}
      </main>
      {home?<HomeFooter locale={locale}/>:documents?<DocumentsFooter locale={locale}/>:referenceCategory?<CategoryFooter locale={locale} family={referenceCategory}/>:<ReferenceFooter locale={locale} />}
      <Navigation locale={locale} />
    </div>
  );
}
export function KidFlixShell({
  locale,
  children,
  variant,
  categoryFamily,
}: {
  locale: Locale;
  children: ReactNode;
  variant?:"documents"|"home";
  categoryFamily?:string;
}) {
  return (
    <GuestProvider>
      <DocumentsSettingsProvider><Content locale={locale} variant={variant} categoryFamily={categoryFamily}>{children}</Content></DocumentsSettingsProvider>
    </GuestProvider>
  );
}
