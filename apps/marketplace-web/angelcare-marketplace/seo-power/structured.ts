import type { CollectionPage, WebPage, WithContext } from "schema-dts";
import type { ChangePatch, Project } from "./model";
export function pageStructuredData(
  project: Project,
  path: string,
  locale: string,
  patch: ChangePatch,
): WithContext<WebPage | CollectionPage> {
  const url = new URL(path, project.origin).href;
  return {
    "@context": "https://schema.org",
    "@type": patch.body ? "CollectionPage" : "WebPage",
    "@id": url + "#webpage",
    url,
    name: patch.title || patch.heading || project.name,
    ...(patch.description ? { description: patch.description } : {}),
    inLanguage: locale,
    ...(patch.relatedPaths?.length
      ? {
          relatedLink: patch.relatedPaths.map(
            (p) => new URL(p, project.origin).href,
          ),
        }
      : {}),
  };
}
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
