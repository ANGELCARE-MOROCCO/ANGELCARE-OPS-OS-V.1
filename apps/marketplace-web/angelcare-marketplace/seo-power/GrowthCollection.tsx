import { growthCopy, type InventoryItem } from "./growth-model";
import { safeJsonLd } from "./structured";
import type { World } from "./model";
import s from "./growth-public.module.css";
export function GrowthCollection({
  items,
  locale,
  path,
  origin,
  ready,
}: {
  items: InventoryItem[];
  locale: string;
  world: World;
  path: string;
  origin: string;
  ready: boolean;
}) {
  const c = growthCopy(locale);
  return (
    <section className={s.root} data-seo-growth="inventory">
      <header>
        <span>
          {items.length} · {c.available}
        </span>
        <h2>{c.guide}</h2>
        <p>{ready ? c.how : c.empty}</p>
      </header>
      {items.length ? (
        <>
          <div className={s.grid}>
            {items.map((x) => (
              <article key={x.path}>
                {x.image && /^https:\/\//.test(x.image) ? (
                  <img src={x.image} alt={x.title} loading="lazy" />
                ) : null}
                <small>
                  {x.group} · {x.locale.toUpperCase()}
                </small>
                <h3>
                  <a href={x.path} data-seo-outcome="resource_open">
                    {x.title}
                  </a>
                </h3>
                <p>{x.summary}</p>
                <a
                  className={s.open}
                  href={x.path}
                  data-seo-outcome="resource_open"
                >
                  {c.open} →
                </a>
              </article>
            ))}
          </div>
          <table>
            <caption>{c.guide}</caption>
            <thead>
              <tr>
                <th>{c.selection}</th>
                <th>
                  {locale === "fr"
                    ? "Sujet / catégorie"
                    : locale === "ar"
                      ? "الموضوع"
                      : "Topic / category"}
                </th>
                <th>
                  {locale === "fr"
                    ? "Langue de la page"
                    : locale === "ar"
                      ? "لغة الصفحة"
                      : "Page language"}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.path}>
                  <td>
                    <a href={x.path} data-seo-outcome="resource_open">
                      {x.title}
                    </a>
                  </td>
                  <td>{x.topic || x.group}</td>
                  <td>{x.locale.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: safeJsonLd({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "@id": new URL(path, origin).href + "#selection",
                itemListElement: items.map((x, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  url: new URL(x.path, origin).href,
                  name: x.title,
                })),
              }),
            }}
          />
        </>
      ) : null}
    </section>
  );
}
