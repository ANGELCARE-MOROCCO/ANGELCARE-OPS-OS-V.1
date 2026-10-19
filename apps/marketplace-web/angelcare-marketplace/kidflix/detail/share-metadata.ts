import type { Metadata } from "next";
import type { Locale } from "../catalogue";
import { asset, obj, type DetailValue } from "./model";
import { local } from "./copy";
import { resourcePath } from "./social-contract";
export function experienceMetadata(
  value: DetailValue | null,
  origin: string,
  locale: Locale,
  key: string,
): Metadata {
  if (!value)
    return { title: "KidFlix", robots: { index: false, follow: false } };
  const m = value.manifest,
    d = obj(m.definition),
    title = m.title + " · KidFlix",
    description = local(d, "summary", locale)
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200),
    url = new URL(resourcePath(key, locale), origin).href,
    cover = asset(m, d.coverAssetId, "image/"),
    image =
      cover && !["image/svg+xml"].includes(cover.mime)
        ? { url: new URL(cover.url, origin).href, alt: cover.alt || m.title }
        : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "KidFlix",
      title,
      description,
      url,
      locale: locale === "fr" ? "fr_FR" : locale === "ar" ? "ar_MA" : "en_US",
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}
