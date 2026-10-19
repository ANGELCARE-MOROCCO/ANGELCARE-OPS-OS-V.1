import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { KidFlixShell } from "@/angelcare-marketplace/kidflix/Shell";
export default async function KidFlixLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <KidFlixShell locale={locale}>{children}</KidFlixShell>;
}
