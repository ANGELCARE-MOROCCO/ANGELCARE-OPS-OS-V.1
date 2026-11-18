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
  // R11.1: one approved equipment authority in FR/EN/AR.
  // Preserve the unrelated EN/AR legacy Conseil journey via the hash-aware router,
  // and keep Partner OS using its already-approved shared renderer.
  const modernCatalogue = await prepareBusinessStorefront(
    await storefrontExperience({locale,key:"establishments",territoryCode}),
    "establishments",
  );
  const modern = (
    <GlobalPublicShell
      locale={locale}
      navigation={[]}
      variant="marketplace"
      localeSwitcher={<PartnerLocaleLinks locale={locale} />}
    >
      <EstablishmentsExperience
        experience={modernCatalogue}
        initialView={locale==="fr"?undefined:"produits"}
      />
    </GlobalPublicShell>
  );
  if(locale==="fr")return modern;
  const [snapshot, surface] = await Promise.all([
    publicVerticalSnapshot("establishment"),
    getPublishedSurface("establishments",{locale}).catch(()=>null),
  ]);
  const legacy = <Storefront
    experience={await storefrontExperience({locale,key:"establishments",territoryCode})}
    nativeContext={surfaceContext(surface)}
    nativeFallback={<PublicEstablishmentsExperience
      locale={locale} mode="establishments"
      activePrograms={snapshot.activePrograms}
      organizations={snapshot.organizations}
      experience={surface}
    />}
  />;
  return <PartnerLocaleEntry
    modern={modern}
    legacy={legacy}
    partner={<GlobalPublicShell
      locale={locale} navigation={[]} variant="marketplace"
      localeSwitcher={<PartnerLocaleLinks locale={locale}/>}
    ><EstablishmentsExperience
      experience={modernCatalogue}
      initialView="partner-os" partnerOnly
    /></GlobalPublicShell>}
  />;
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
