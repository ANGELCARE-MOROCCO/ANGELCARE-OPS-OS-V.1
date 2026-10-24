import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { loadHome } from "@/angelcare-marketplace/kidflix/server";
import { loadDocuments } from "@/angelcare-marketplace/kidflix/documents/server";
import { KidFlixHome } from "@/angelcare-marketplace/kidflix/Home";
export const dynamic = "force-dynamic";
export async function generateMetadata({
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
export default async function HomePage({
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
