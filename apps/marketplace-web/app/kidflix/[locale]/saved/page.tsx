import { notFound } from "next/navigation";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { SavedDiscoveries } from "@/angelcare-marketplace/kidflix/Discovery";
export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SavedDiscoveries locale={locale} />;
}
