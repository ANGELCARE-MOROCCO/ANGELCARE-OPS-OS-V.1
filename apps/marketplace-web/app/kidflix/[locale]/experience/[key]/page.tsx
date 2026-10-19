import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { getExperience } from "@/angelcare-marketplace/kidflix/server";
import { ResourceOverview } from "@/angelcare-marketplace/kidflix/Pages";
export const dynamic = "force-dynamic";
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { locale, key } = await params;
  if (!isLocale(locale)) notFound();
  const h = await headers();
  const value = await getExperience(h.get("host") || "", locale, key);
  return <ResourceOverview locale={locale} value={value} />;
}
