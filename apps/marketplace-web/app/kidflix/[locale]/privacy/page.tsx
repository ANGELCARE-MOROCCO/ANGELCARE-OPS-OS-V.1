import { notFound } from "next/navigation";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { InformationPage } from "@/angelcare-marketplace/kidflix/Pages";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <InformationPage locale={locale} topic="privacy" />;
}
