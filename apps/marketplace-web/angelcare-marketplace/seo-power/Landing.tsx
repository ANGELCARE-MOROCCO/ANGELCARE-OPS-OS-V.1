import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publication, seoMetadata, SeoEnhancements, samePublicHost } from "./public";
import { type World, locales, root } from "./model";
import styles from "./public.module.css";
export async function landing(world: World, locale: string, slug: string) {
  if (
    !locales(world).includes(locale) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  )
    return null;
  const path = `${root(world)}/${locale}/discover/${slug}`,
    value = await publication(world, path);
  return value?.page.kind === "landing" && await samePublicHost(value.project.origin) ? { ...value, path } : null;
}
export async function landingMetadata(
  world: World,
  locale: string,
  slug: string,
): Promise<Metadata> {
  const v = await landing(world, locale, slug);
  if (!v) return { robots: { index: false, follow: false } };
  return seoMetadata(world, v.path, {
    title: { absolute: v.patch.title || "" },
    description: v.patch.description,
    alternates: { canonical: new URL(v.path, v.project.origin).href },
  });
}
export async function Landing({
  world,
  locale,
  slug,
}: {
  world: World;
  locale: string;
  slug: string;
}) {
  const v = await landing(world, locale, slug);
  if (!v) notFound();
  return (
    <article
      className={styles.landing}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <a href={`${root(world)}/${locale}`}>{v.project.name}</a>
      <h1>{v.patch.heading}</h1>
      <p className={styles.lead}>{v.patch.description}</p>
      {(v.patch.body || "").split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
      <SeoEnhancements world={world} path={v.path} />
    </article>
  );
}
