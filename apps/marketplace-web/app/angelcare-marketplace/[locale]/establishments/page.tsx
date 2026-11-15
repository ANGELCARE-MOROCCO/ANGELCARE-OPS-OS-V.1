import { PartnerLocaleLinks } from "@/angelcare-marketplace/establishments-world/partner/LocaleLinks";
import {
  businessTerritoryFromSearch,
  prepareBusinessStorefront,
} from "@/angelcare-marketplace/business-worlds/repository";
import { EstablishmentsExperience } from "@/angelcare-marketplace/establishments-world/Experience";
import { GlobalPublicShell } from "@/angelcare-marketplace/public-universe/components/GlobalPublicShell";
import {
  storefrontMetadata,
  storefrontNativeMetadata,
} from "@/angelcare-marketplace/seo-power/storefronts";
import { PublicEstablishmentsExperience } from "@/angelcare-marketplace/b2b-verticals/components/PublicEstablishmentsExperience";
import { publicVerticalSnapshot } from "@/angelcare-marketplace/b2b-verticals/repository";
import { getPublishedSurface } from "@/angelcare-marketplace/total-commerce-control/repository";
import { Storefront } from "@/angelcare-marketplace/catalog-discovery/components/Storefront";
import { storefrontExperience } from "@/angelcare-marketplace/catalog-discovery/repository";
import { PartnerLocaleEntry } from "@/angelcare-marketplace/establishments-world/partner/LocaleEntry";
import { surfaceContext } from "@/angelcare-marketplace/storefront-immersive/native-context";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const territoryCode = businessTerritoryFromSearch(await searchParams);

  const { locale: raw } = await params;
  const locale = raw === "ar" ? "ar" : raw === "en" ? "en" : "fr";
  // The approved reference pages concern the French Établissements body only.
  // Other journeys keep their authority; the Partner OS hash uses the same new renderer in EN/AR.
  if (locale === "fr") {
    const catalogue = await prepareBusinessStorefront(
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
        localeSwitcher={<PartnerLocaleLinks locale={locale} />}
      >
        <EstablishmentsExperience experience={catalogue} />
      </GlobalPublicShell>
    );
  }
  const [snapshot, experience, storefront] = await Promise.all([
    publicVerticalSnapshot("establishment"),
    getPublishedSurface("establishments", { locale }).catch(() => null),
    storefrontExperience({ locale, key: "establishments", territoryCode }),
  ]);
  const partnerCatalogue = await prepareBusinessStorefront(
    storefront,
    "establishments",
  );
  return (
    <PartnerLocaleEntry
      partner={
        <GlobalPublicShell
          locale={locale}
          navigation={[]}
          variant="marketplace"
          localeSwitcher={<PartnerLocaleLinks locale={locale} />}
        >
          <EstablishmentsExperience
            experience={partnerCatalogue}
            initialView="partner-os"
            partnerOnly
          />
        </GlobalPublicShell>
      }
    >
      <Storefront
        experience={storefront}
        nativeContext={surfaceContext(experience)}
        nativeFallback={
          <PublicEstablishmentsExperience
            locale={locale}
            mode="establishments"
            activePrograms={snapshot.activePrograms}
            organizations={snapshot.organizations}
            experience={experience}
          />
        }
      />
    </PartnerLocaleEntry>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  return storefrontMetadata(
    "establishments",
    locale,
    (await searchParams) || {},
  );
}
