import { PartnerLocaleLinks } from "@/angelcare-marketplace/establishments-world/partner/LocaleLinks";
import {
  businessTerritoryFromSearch,
  prepareBusinessStorefront,
} from "@/angelcare-marketplace/business-worlds/repository";
import { storefrontExperience } from "@/angelcare-marketplace/catalog-discovery/repository";
import { GlobalPublicShell } from "@/angelcare-marketplace/public-universe/components/GlobalPublicShell";
import { EstablishmentsExperience } from "@/angelcare-marketplace/establishments-world/Experience";
import { storefrontNativeMetadata } from "@/angelcare-marketplace/seo-power/storefronts";
import { seoMetadata } from "@/angelcare-marketplace/seo-power/public";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale = raw === "ar" ? "ar" : raw === "en" ? "en" : "fr";
  const territoryCode = businessTerritoryFromSearch(query);
  const experience = await prepareBusinessStorefront(
    await storefrontExperience({
      locale,
      key: "establishments",
      territoryCode,
    }),
    "establishments",
  );
  return (
    <GlobalPublicShell
      locale={locale}
      navigation={[]}
      variant="marketplace"
      localeSwitcher={<PartnerLocaleLinks locale={locale} dedicated />}
    >
      <EstablishmentsExperience
        experience={experience}
        initialView="partner-os"
        partnerOnly
      />
    </GlobalPublicShell>
  );
}
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params,
    locale = raw === "ar" ? "ar" : raw === "en" ? "en" : "fr",
    query = (await searchParams) || {};
  const base = await storefrontNativeMetadata("establishments", locale);
  const title =
    locale === "ar"
      ? "Partner OS · قيادة مؤسستكم | ANGELCARE"
      : locale === "en"
        ? "Partner OS · Your connected school | ANGELCARE"
        : "Partner OS · Votre établissement connecté | ANGELCARE";
  const description =
    locale === "ar"
      ? "الإدارة والقبول والعائلات والفرق والإيرادات: اكتشفوا مجالات Partner OS وجهّزوا عرضكم التوضيحي."
      : locale === "en"
        ? "Direction, admissions, families, teams and revenue: explore Partner OS capabilities and prepare a demonstration around your needs."
        : "Direction, admissions, familles, équipes et revenus : découvrez les domaines Partner OS et préparez une démonstration adaptée à vos usages.";
  const canonical = `/angelcare-marketplace/${locale}/establishments/partner-os`;
  return seoMetadata("angelcare", canonical, {
    ...base,
    title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        ["fr", "en", "ar"].map((code) => [
          code,
          `/angelcare-marketplace/${code}/establishments/partner-os`,
        ]),
      ),
    },
    openGraph: {
      ...base.openGraph,
      title,
      description,
      url: canonical,
      images: ["/angelcare-marketplace/partner-os-r1/direction-scene.png"],
    },
    ...(Object.keys(query).length
      ? { robots: { index: false, follow: true } }
      : {}),
  });
}
