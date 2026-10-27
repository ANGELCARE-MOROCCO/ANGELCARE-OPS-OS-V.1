import {informationMetadata} from "@/angelcare-marketplace/kidflix/information/metadata";
import { notFound } from "next/navigation";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { InformationPage } from "@/angelcare-marketplace/kidflix/information/InformationPage";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <InformationPage locale={locale} topic="about" />;
}

export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
 const {locale}=await params; if(!isLocale(locale))notFound();
 return informationMetadata(locale,"about");
}
