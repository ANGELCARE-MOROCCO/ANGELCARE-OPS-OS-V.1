"use client";
import { useEffect, useState } from "react";
import type { PartnerLocale } from "./Locale";
import { partnerLocaleHref } from "./locale-navigation";

const LANGUAGES = { fr: "Français", en: "English", ar: "العربية" } as const;

/** Existing shell styling, shared route and language-independent project state. */
export function PartnerLocaleLinks({
  locale,
  dedicated = false,
}: {
  locale: PartnerLocale;
  dedicated?: boolean;
}) {
  const [location, setLocation] = useState({
    pathname: `/angelcare-marketplace/${locale}/establishments${dedicated ? "/partner-os" : ""}`,
    search: "",
    hash: "",
  });
  useEffect(() => {
    const read = () =>
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, [locale, dedicated]);
  return (Object.keys(LANGUAGES) as PartnerLocale[]).map((code) => (
    <a
      key={code}
      href={partnerLocaleHref(
        code,
        location.pathname,
        location.search,
        location.hash,
      )}
      data-active={locale === code}
      hrefLang={code}
      lang={code}
      aria-label={LANGUAGES[code]}
      aria-current={locale === code ? "page" : undefined}
      onPointerEnter={(event) => {
        // History API chapter jumps do not emit hashchange. Resolve at interaction time.
        event.currentTarget.href = partnerLocaleHref(
          code,
          window.location.pathname,
          window.location.search,
          window.location.hash,
        );
      }}
      onFocus={(event) => {
        event.currentTarget.href = partnerLocaleHref(
          code,
          window.location.pathname,
          window.location.search,
          window.location.hash,
        );
      }}
      onClick={(event) => {
        event.currentTarget.href = partnerLocaleHref(
          code,
          window.location.pathname,
          window.location.search,
          window.location.hash,
        );
      }}
    >
      {code.toUpperCase()}
    </a>
  ));
}
