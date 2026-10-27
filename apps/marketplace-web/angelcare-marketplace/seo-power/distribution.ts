import "server-only";
import { NextResponse } from "next/server";
import { db } from "./repository";
import { publicPages, publicIndexNowKey, publication } from "./public";
import { type World, WORLDS, text } from "./model";
export const xml = (v: unknown) =>
  String(v ?? "").replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const headers = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=60, s-maxage=60",
};
export async function sitemap(request: Request) {
  try {
    const url = new URL(request.url),
      w = url.searchParams.get("world");
    if (!WORLDS.includes(w as World))
      return new NextResponse("Unknown world", { status: 400 });
    const pages = (await publicPages(w as World)).filter(
      (p) => new URL(String(p.origin)).host === url.host,
    );
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        pages
          .map(
            (p) =>
              "<url><loc>" +
              xml(String(p.origin) + String(p.path)) +
              "</loc>" +
              (p.last_scanned_at
                ? "<lastmod>" +
                  xml(new Date(String(p.last_scanned_at)).toISOString()) +
                  "</lastmod>"
                : "") +
              "</url>",
          )
          .join("") +
        "</urlset>",
      { headers },
    );
  } catch {
    return new NextResponse("SEO inventory unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
export async function sitemapIndex(request: Request) {
  const url = new URL(request.url);
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      WORLDS.map(
        (w) =>
          "<sitemap><loc>" +
          xml(
            url.origin +
              "/api/angelcare-marketplace/public/seo-power/sitemap?world=" +
              w,
          ) +
          "</loc></sitemap>",
      ).join("") +
      "</sitemapindex>",
    { headers },
  );
}
export async function feed(request: Request) {
  try {
    const url = new URL(request.url),
      world = url.searchParams.get("world");
    if (!WORLDS.includes(world as World))
      return new NextResponse("Unknown world", { status: 400 });
    const rows = (await publicPages(world as World))
        .filter(
          (p) =>
            p.kind === "landing" && new URL(String(p.origin)).host === url.host,
        )
        .slice(0, 50),
      entries = await Promise.all(
        rows.map(async (p) => {
          const v = await publication(world as World, String(p.path));
          if (!v) return "";
          return (
            "<item><title>" +
            xml(v.patch.title) +
            "</title><link>" +
            xml(v.project.origin + p.path) +
            '</link><guid isPermaLink="true">' +
            xml(v.project.origin + p.path) +
            "</guid><description>" +
            xml(v.patch.description) +
            "</description><pubDate>" +
            xml(new Date(String(v.change.published_at)).toUTCString()) +
            "</pubDate></item>"
          );
        }),
      );
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>' +
        xml(world) +
        " · SEO POWER</title><link>" +
        xml(url.origin) +
        "</link><description>Published editorial resources</description>" +
        entries.join("") +
        "</channel></rss>",
      { headers },
    );
  } catch {
    return new NextResponse("SEO feed unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
export async function indexNowKey(request: Request) {
  try {
    const client = await db(),
      host = new URL(request.url).host,
      r = await client
        .from("ac_seo_power_projects")
        .select("origin")
        .eq("enabled", true);
    if (r.error || !r.data?.some((p) => new URL(p.origin).host === host))
      return new NextResponse("Not found", { status: 404 });
    const key = await publicIndexNowKey();
    return new NextResponse(key || "Unavailable", {
      status: key ? 200 : 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Unavailable", { status: 503 });
  }
}
