import { cache } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  isLocale,
  type Locale,
} from "@/angelcare-marketplace/kidflix/catalogue";
import { publicHost } from "@/angelcare-marketplace/kidflix/server";
import { getDetail } from "@/angelcare-marketplace/kidflix/detail/service";
import { Detail } from "@/angelcare-marketplace/kidflix/detail/Detail";

import { experienceMetadata } from "@/angelcare-marketplace/kidflix/detail/share-metadata";
export const dynamic = "force-dynamic";
const load = cache(async (locale: Locale, key: string) => {
  const h = await headers(),
    host = publicHost(h.get("host") || "");
  return {
    value: await getDetail(host, locale, key),
    origin:
      (host === "localhost" || host === "127.0.0.1" ? "http://" : "https://") +
      host,
  };
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}): Promise<Metadata> {
  const { locale, key } = await params;
  if (!isLocale(locale))
    return { title: "KidFlix", robots: { index: false, follow: false } };
  const { value, origin } = await load(locale, key);
  return experienceMetadata(value, origin, locale, key);
}
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { locale, key } = await params;
  if (!isLocale(locale)) notFound();
  const { value } = await load(locale, key);
  if (!value) notFound();
  return <Detail locale={locale} value={value} />;
}
