"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type Locale } from "../catalogue";
import { normalizeDocumentSocialLinks } from "../documents/model";
type Edition = Record<string, any>;
type Settings = {
  edition: Edition;
  socialLinks: Record<string, string>;
  publish: (edition: Edition) => void;
};
const Context = createContext<Settings>({
  edition: {},
  socialLinks: {},
  publish: () => {},
});
export function WorldSettingsProvider({
  children,
  locale = "en",
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const [current, setCurrent] = useState<{ locale: Locale; edition: Edition }>({
    locale,
    edition: {},
  });
  const [social, setSocial] = useState<
    Partial<Record<Locale, Record<string, string>>>
  >({});
  const supplied = useRef(new Set<Locale>()),
    active = useRef(locale);
  active.current = locale;
  const publish = useCallback(
    (edition: Edition) => {
      if (active.current !== locale) return;
      setCurrent({ locale, edition });
      if (
        Object.prototype.hasOwnProperty.call(edition, "documentsSocialLinks")
      ) {
        try {
          const links = normalizeDocumentSocialLinks(
            edition.documentsSocialLinks,
          );
          supplied.current.add(locale);
          setSocial((old) => ({ ...old, [locale]: links }));
        } catch {
          /* Keep the last verified published links. */
        }
      }
    },
    [locale],
  );
  useEffect(() => {
    if (supplied.current.has(locale)) return;
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 15000);
    // Reuse the existing public settings authority; no new account or SQL authority.
    fetch("/api/kidflix/documents?locale=" + locale, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw Error("SETTINGS_UNAVAILABLE");
        return response.json();
      })
      .then((value) => {
        if (
          controller.signal.aborted ||
          active.current !== locale ||
          supplied.current.has(locale)
        )
          return;
        if (
          value?.edition &&
          Object.prototype.hasOwnProperty.call(
            value.edition,
            "documentsSocialLinks",
          )
        ) {
          const links = normalizeDocumentSocialLinks(
            value.edition.documentsSocialLinks,
          );
          supplied.current.add(locale);
          setSocial((old) => ({ ...old, [locale]: links }));
        }
      })
      .catch(() => {
        /* Unconfigured channels remain non-interactive marks. */
      })
      .finally(() => clearTimeout(timer));
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [locale]);
  return (
    <Context.Provider
      value={{
        edition: current.locale === locale ? current.edition : {},
        socialLinks: social[locale] || {},
        publish,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useWorldSettings = () => useContext(Context);
