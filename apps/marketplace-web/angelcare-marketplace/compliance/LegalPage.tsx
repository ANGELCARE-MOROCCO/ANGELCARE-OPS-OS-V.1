import type { Metadata } from "next";
import { GlobalPublicShell } from "../public-universe/components/GlobalPublicShell";
import { PublicPageRenderer } from "../public-universe/components/PublicPageRenderer";
import {
  LEGAL_ROUTE_REVISION,
  legalPath,
  type LegalKind,
  type LegalLocale,
} from "./legal-policy";
import { resolvePublishedLegal } from "./legal-repository";
import { NativePolicyDocument } from "./NativePolicyDocument";
import { webPolicy } from "./web-policy";
import s from "./legal.module.css";
const FALLBACK = {
  fr: "La version publiée en français est affichée ci-dessous.",
  en: "The published French version is displayed below.",
  ar: "تُعرض أدناه النسخة المنشورة باللغة الفرنسية.",
};
export async function legalMetadata(
  kind: LegalKind,
  locale: LegalLocale,
): Promise<Metadata> {
  const result = await resolvePublishedLegal(kind, locale),
    native = webPolicy(kind, locale);
  const title =
    result.status === "published"
      ? result.experience.page.seo_title || result.experience.page.title
      : native.title;
  return {
    title: `${title} · ANGELCARE`,
    description:
      result.status === "published"
        ? result.experience.page.seo_description ||
          result.experience.page.description ||
          native.lead
        : native.lead,
    alternates: {
      canonical: legalPath(locale, kind),
      languages: Object.fromEntries(
        (["fr", "en", "ar"] as const).map((l) => [l, legalPath(l, kind)]),
      ),
    },
    ...(result.status === "unavailable"
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}
export async function AngelCareLegalPage({
  kind,
  locale,
}: {
  kind: LegalKind;
  locale: LegalLocale;
}) {
  const result = await resolvePublishedLegal(kind, locale);
  return (
    <GlobalPublicShell
      locale={locale}
      navigation={
        result.status === "published" ? result.experience.navigation : []
      }
      variant="marketplace"
      contentElement="div"
    >
      <main
        data-ac-legal-revision={LEGAL_ROUTE_REVISION}
        data-ac-legal-kind={kind}
        data-ac-legal-state={
          result.status === "published"
            ? "published"
            : result.status === "missing"
              ? "native-web"
              : "native-web-source-unavailable"
        }
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {result.status === "published" ? (
          <>
            {result.sourceLocale !== locale && (
              <aside className={s.translation} role="note">
                {FALLBACK[locale]}
              </aside>
            )}
            <div lang={result.sourceLocale}>
              <PublicPageRenderer
                experience={result.experience}
                locale={result.sourceLocale}
              />
            </div>
          </>
        ) : (
          <NativePolicyDocument
            kind={kind}
            locale={locale}
            sourceIssue={result.status === "unavailable"}
          />
        )}
      </main>
    </GlobalPublicShell>
  );
}
