import "server-only";
import { CheerioCrawler } from "@crawlee/cheerio";
import { Configuration, type BaseHttpClient } from "@crawlee/core";
import { RobotsTxtFile } from "@crawlee/utils";



import { hash, safeRead, SeoHttpClient, USER_AGENT } from "./network";
import {
  type Facts,
  type Project,
  publicPath,
  targetUrl,
  SeoFault,
} from "./model";

export async function inspectWithClient(
  project: Project,
  path: string,
  client: BaseHttpClient,
): Promise<Facts> {
  const requested = targetUrl(path, project),
    started = Date.now();
  let observed: Facts | null = null,
    failure: Error | null = null;
  const crawler = new CheerioCrawler(
    {
      httpClient: client,
      useSessionPool: false,
      persistCookiesPerSession: false,
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,
      maxRequestRetries: 0,
      navigationTimeoutSecs: project.policy.timeoutSeconds + 2,
      requestHandlerTimeoutSecs: 15,
      ignoreHttpErrorStatusCodes: [400, 401, 403, 404, 410, 429, 500, 502, 503],
      async requestHandler({ $, request, response }) {
        const final = targetUrl(request.loadedUrl || request.url, project),
          schemas: unknown[] = [];
        let schemaErrors = 0;
        $('script[type="application/ld+json"]')
          .slice(0, 20)
          .each((_i, el) => {
            try {
              const raw = $(el).text();
              if (raw.length > 100000) throw Error("JSONLD_TOO_LARGE");
              schemas.push(JSON.parse(raw));
            } catch {
              schemaErrors++;
            }
          });
        const main = $("main").first().length
          ? $("main").first().clone()
          : $("body").clone();
        main.find("script,style,noscript,nav,footer,[data-seo-power]").remove();
        const content = main.text().replace(/\s+/g, " ").trim().slice(0, 24000);
        const links: Facts["links"] = [],
          seen = new Set<string>();
        $("a[href]")
          .slice(0, 1200)
          .each((_i, el) => {
            try {
              const u = new URL($(el).attr("href") || "", final);
              if (u.search || u.hash) return;
              const url = targetUrl(u.href, project);
              if (seen.has(url.pathname) || links.length >= 100) return;
              seen.add(url.pathname);
              links.push({
                url: url.href,
                label: $(el).text().trim().slice(0, 160),
              });
            } catch {
              /* Private, external and parameterized links are not crawl seeds. */
            }
          });
        const source = $('meta[name="seo-power-source"]').attr("content") || "";
        observed = {
          url: final.href,
          status: response.statusCode || 0,
          title: $("title").first().text().trim().slice(0, 500),
          description:
            $('meta[name="description"]').attr("content")?.slice(0, 1000) || "",
          canonical: $('link[rel="canonical"]').first().attr("href") || "",
          lang: $("html").attr("lang") || "",
          robots: [
            $('meta[name="robots"]').attr("content") || "",
            String(response.headers["x-robots-tag"] || ""),
          ].join(" "),
          headings: $("h1")
            .map((_i, el) => $(el).text().trim().slice(0, 300))
            .get(),
          text: content,
          links,
          images: $("img")
            .slice(0, 100)
            .map((_i, el) => ({
              src: $(el).attr("src") || "",
              alt: $(el).attr("alt") ?? null,
            }))
            .get(),
          schemas,
          schemaErrors,
          hreflang: $("link[hreflang]")
            .map((_i, el) => ({
              language: $(el).attr("hreflang") || "",
              url: $(el).attr("href") || "",
            }))
            .get(),
          fetchedAt: new Date().toISOString(),
          elapsedMs: Date.now() - started,
          contentHash: hash({ content, source }),
          related: $("[data-seo-power] a")
            .map((_i, el) => $(el).attr("href") || "")
            .get(),
          seoPower: $('meta[name="seo-power"]').attr("content") || "",
          sourceStamp: source,
        bodyHook: $('meta[name="seo-power-body"]').attr("content")||"",
          revision: $('meta[name="seo-power-revision"]').attr("content") || "",
        };
      },
      async failedRequestHandler(_ctx, error) {
        failure = error;
      },
    },
    new Configuration({ persistStorage: false, logLevel: 0 }),
  );
  await crawler.run([requested.href]);
  if (!observed)
    throw (
      failure ||
      new SeoFault(
        "CRAWL_UNAVAILABLE",
        "Le serveur n’a pas fourni de page HTML inspectable.",
        502,
      )
    );
  return observed;
}

export async function inspectPage(
  project: Project,
  path: string,
): Promise<Facts> {
  const url = targetUrl(path, project);
  const robots = await safeRead(new URL("/robots.txt", project.origin), {
    origin: project.origin,
    timeoutMs: project.policy.timeoutSeconds * 1000,
    maxBytes: 500000,
    allowedPath: (p) => {
      if (p !== "/robots.txt")
        throw new SeoFault(
          "ROBOTS_REDIRECT",
          "Redirection robots.txt non prise en charge.",
        );
    },
  });
  if (
    robots.statusCode === 401 ||
    robots.statusCode === 403 ||
    robots.statusCode === 429 ||
    robots.statusCode >= 500
  )
    throw new SeoFault(
      "ROBOTS_UNAVAILABLE",
      "Exploration suspendue : robots.txt inaccessible ou serveur occupé.",
      503,
    );
  if (
    robots.statusCode === 200 &&
    !RobotsTxtFile.from(
      new URL("/robots.txt", project.origin).href,
      robots.body.toString("utf8"),
    ).isAllowed(url.href, USER_AGENT)
  )
    throw new SeoFault(
      "ROBOTS_DISALLOWED",
      "Exploration interdite par robots.txt.",
    );
  return inspectWithClient(
    project,
    path,
    new SeoHttpClient(
      project.origin,
      (p) => {
        publicPath(p, project.world);
      },
      project.policy.timeoutSeconds * 1000,
    ),
  );
}

/** Check canonical link status through the existing bounded, DNS-pinned HTTPS transport.
 * Avoid importing Linkinator in Next.js route initialization or running a
 * transient loopback HTTP server for a status already obtained from the target.
 */
export async function checkLinks(project: Project, paths: string[]) {
  const results: { url: string; state: "OK" | "BROKEN" | "SKIPPED"; status: number }[] = [];
  for (const path of paths.slice(0, 3)) {
    const target = targetUrl(path, project);
    const response = await safeRead(target, {
      origin: project.origin,
      timeoutMs: project.policy.timeoutSeconds * 1000,
      allowedPath: (p) => {
        publicPath(p, project.world);
      },
    });
    const status = response.statusCode;
    const botChallenge = String(response.headers["cf-mitigated"] || "").toLowerCase();
    const state: "OK" | "BROKEN" | "SKIPPED" =
      status === 429 ||
      status === 999 ||
      (status === 403 && botChallenge === "challenge")
        ? "SKIPPED"
        : status >= 200 && status < 400
          ? "OK"
          : "BROKEN";
    results.push({ url: target.href, state, status });
  }
  return results;
}
