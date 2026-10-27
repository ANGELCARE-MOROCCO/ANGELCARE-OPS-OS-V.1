import { seoMetadata, SeoEnhancements, noindex } from '@/angelcare-marketplace/seo-power/public';
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { loadHome } from "@/angelcare-marketplace/kidflix/server";
import { loadDocuments } from "@/angelcare-marketplace/kidflix/documents/server";
import { KidFlixHome } from "@/angelcare-marketplace/kidflix/Home";
export const dynamic = "force-dynamic";
async function nativeMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title:
      locale === "fr"
        ? "KidFlix · Des découvertes pour grandir"
        : locale === "ar"
          ? "كيدفليكس · اكتشافات للنمو"
          : "KidFlix · Big discoveries. Happy little minds.",
    description:
      "KidFlix by AngelCare · Stories, play, printables and learning for curious minds.",
    alternates: {
      languages: { en: "/kidflix/en", fr: "/kidflix/fr", ar: "/kidflix/ar" },
    },
  };
}
async function NativePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const h = await headers(),
    [value,documents] = await Promise.all([loadHome(h.get("host") || "", locale),loadDocuments(h.get("host") || "",locale)]);
  return <KidFlixHome locale={locale} {...value} documents={documents} />;
}

type SeoPageProps={params:Promise<{locale:string}>};
export async function generateMetadata(props:SeoPageProps){const p=await props.params;const base=await nativeMetadata(props);return seoMetadata('kidflix',`/kidflix/${p.locale}`,base);}
export default async function Page(props:SeoPageProps){const p=await props.params;const [body,base]=await Promise.all([NativePage(props),nativeMetadata(props)]);return <>{body}{!noindex(base)?<SeoEnhancements world="kidflix" path={`/kidflix/${p.locale}`} base={base}/>:null}</>;}
