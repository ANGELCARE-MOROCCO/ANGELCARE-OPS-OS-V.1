import {DocumentsStorefront}from "@/angelcare-marketplace/kidflix/documents/DocumentsStorefront";
import {loadDocuments}from "@/angelcare-marketplace/kidflix/documents/server";
import {documentFilters}from "@/angelcare-marketplace/kidflix/documents/model";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  isLocale,
  world,
  emptyCatalogue,
} from "@/angelcare-marketplace/kidflix/catalogue";
import { getCatalogue, filters } from "@/angelcare-marketplace/kidflix/server";
import { Explorer } from "@/angelcare-marketplace/kidflix/Discovery";
import {Storefront}from "@/angelcare-marketplace/kidflix/storefronts/Storefront";
import {loadStorefront}from "@/angelcare-marketplace/kidflix/storefronts/server";
import {cleanFilters}from "@/angelcare-marketplace/kidflix/storefront-reference/model";
export const dynamic = "force-dynamic";
export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; family?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await params;
  if (
    !isLocale(p.locale) ||
    (p.family && (p.family.length !== 1 || !world(p.family[0])))
  )
    notFound();
  const locale = p.locale,
    family = p.family?.[0],
    input = await searchParams,
    source = Object.fromEntries(
      Object.entries(input).filter(([, v]) => typeof v === "string"),
    ) as Record<string, string>;
  let f: Record<string, string> = {};
  try {
    f = {
      ...filters(source),
      page: String(
        Math.max(1, Math.min(10000, Math.floor(Number(source.page) || 1))),
      ),
    };
  } catch {}
  const h = await headers();
  if(family==="documents"){let documentInput;try{documentInput=documentFilters(source);}catch{notFound();}return <DocumentsStorefront locale={locale} initial={await loadDocuments(h.get("host")||"",locale,documentInput)} initialFilters={documentInput}/>;}
  if(family){let categoryFilters;try{categoryFilters=cleanFilters(source,family);}catch{notFound();}const initial=await loadStorefront(h.get("host")||"",locale,family,categoryFilters);return <Storefront family={family} locale={locale} initial={initial} initialFilters={categoryFilters}/>;}
  let initial;
  try {
    initial = await getCatalogue(h.get("host") || "", locale, {
      ...f,
      ...(family ? { family } : {}),
    });
  } catch {
    initial = { ...emptyCatalogue, error: true };
  }
  return (
    <Explorer
      locale={locale}
      family={family}
      initial={initial}
      initialFilters={f}
    />
  );
}

export async function generateMetadata({params}:{params:Promise<{locale:string;family?:string[]}>}){const p=await params,w=world(p.family?.[0]||""),locale=isLocale(p.locale)?p.locale:"en";return{title:w?"KidFlix · "+w.title[locale==="fr"?1:locale==="ar"?2:0]:"KidFlix · Discover",description:w?.description[locale==="fr"?1:locale==="ar"?2:0]};}
