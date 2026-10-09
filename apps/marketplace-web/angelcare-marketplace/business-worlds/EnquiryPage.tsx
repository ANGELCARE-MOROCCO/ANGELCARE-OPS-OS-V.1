import Link from "next/link";
import type { CatalogLocale } from "../catalog-discovery/types";
import { GlobalPublicShell } from "../public-universe/components/GlobalPublicShell";
import { B, WORLDS, tr, type BusinessKey } from "./content";
import { routeFor } from "./contract";
import { Enquiry } from "./Enquiry";
import s from "./business.module.css";
export async function EnquiryPage({
  world,
  rawLocale,
  brief,
  sourceRoute,
}: {
  world: BusinessKey;
  rawLocale: string;
  brief?: unknown;
  sourceRoute?: string;
}) {
  const locale: CatalogLocale =
      rawLocale === "ar" ? "ar" : rawLocale === "en" ? "en" : "fr",
    p = WORLDS[world],
    cleanBrief =
      typeof brief === "string"
        ? brief.replace(/[\u0000-\u001f]/g, " ").slice(0, 1000)
        : "";
  return (
    <GlobalPublicShell locale={locale} navigation={[]} variant="marketplace">
      <div
        className={`${s.world} ${s[world.replace("-", "_")] || ""}`}
        dir={locale === "ar" ? "rtl" : "ltr"}
        data-business-request={world}
      >
        <header className={`${s.section} ${s.paper}`}>
          <Link className={s.textButton} href={routeFor(locale, world)}>
            ← {tr(B.back, locale)}
          </Link>
          <div className={s.head}>
            <span className={s.kicker}>{tr(p.label, locale)}</span>
            <h1>{tr(p.action, locale)}</h1>
            <p>{tr(p.lead, locale)}</p>
          </div>
        </header>
        <Enquiry
          world={world}
          locale={locale}
          brief={cleanBrief}
          sourceRoute={
            sourceRoute
              ? routeFor(locale, sourceRoute)
              : routeFor(locale, p.request)
          }
        />
      </div>
    </GlobalPublicShell>
  );
}
