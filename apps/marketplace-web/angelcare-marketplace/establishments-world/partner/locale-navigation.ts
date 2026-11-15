import type { PartnerLocale } from "./Locale";

/** Change language without changing the Partner OS route, territory or chapter. */
export function partnerLocaleHref(
  locale: PartnerLocale,
  pathname: string,
  search = "",
  hash = "",
) {
  const dedicated =
    /^\/angelcare-marketplace\/(fr|en|ar)\/establishments\/partner-os\/?$/.test(
      pathname,
    );
  const legacy =
    /^\/angelcare-marketplace\/(fr|en|ar)\/establishments\/?$/.test(pathname) &&
    /^#partner-os(?:\/|$)/.test(hash);
  if (!dedicated && !legacy) return `/angelcare-marketplace/${locale}`;
  const query = search.startsWith("?") ? search : "";
  const chapter = hash.startsWith("#") ? hash : "";
  return `/angelcare-marketplace/${locale}/establishments/partner-os${query}${chapter}`;
}
