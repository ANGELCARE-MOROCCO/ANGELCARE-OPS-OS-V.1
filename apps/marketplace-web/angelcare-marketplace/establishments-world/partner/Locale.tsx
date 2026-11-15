"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import messages from "./messages.json";
export type PartnerLocale = "fr" | "en" | "ar";
const Context = createContext<PartnerLocale>("fr");
export function PartnerLocaleProvider({
  locale,
  children,
}: {
  locale: PartnerLocale;
  children: ReactNode;
}) {
  return <Context.Provider value={locale}>{children}</Context.Provider>;
}
const dictionary = messages as Record<string, readonly string[]>;
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const templates = Object.entries(dictionary)
  .filter(([key]) => /\{\d+\}/.test(key))
  .sort(
    ([a], [b]) =>
      b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length,
  )
  .map(([key, values]) => ({
    expression: new RegExp(
      "^" +
        key
          .split(/\{\d+\}/)
          .map(escape)
          .join("(.+?)") +
        "$",
    ),
    values,
  }));
export function partnerText(locale: PartnerLocale, text: string): string {
  if (locale === "fr" || !text.trim()) return text;
  const key = text.replace(/\s+/g, " ").trim(),
    index = locale === "ar" ? 1 : 0;
  let value = dictionary[key]?.[index];
  if (value === undefined)
    for (const template of templates) {
      const match = key.match(template.expression);
      if (match) {
        value = template.values[index].replace(/\{(\d+)\}/g, (_, n: string) =>
          partnerText(locale, match[Number(n) + 1]),
        );
        break;
      }
    }
  if (value === undefined) return text;
  return (
    (text.match(/^\s*/)?.[0] || "") + value + (text.match(/\s*$/)?.[0] || "")
  );
}
export function countText(
  locale: PartnerLocale,
  count: number,
  kind: "offer" | "result" = "offer",
) {
  const unit =
    locale === "fr"
      ? (kind === "offer" ? "offre" : "résultat") + (count > 1 ? "s" : "")
      : locale === "en"
        ? (kind === "offer" ? "offer" : "result") + (count === 1 ? "" : "s")
        : kind === "offer"
          ? count === 1
            ? "عرض"
            : count === 2
              ? "عرضان"
              : count >= 3 && count <= 10
                ? "عروض"
                : "عرضًا"
          : count === 1
            ? "نتيجة"
            : count === 2
              ? "نتيجتان"
              : count >= 3 && count <= 10
                ? "نتائج"
                : "نتيجة";
  return new Intl.NumberFormat(locale).format(count) + " " + unit;
}
export function usePartner() {
  const locale = useContext(Context);
  return useMemo(
    () => ({
      locale,
      t: <T,>(text: T): T =>
        typeof text === "string" ? (partnerText(locale, text) as T) : text,
    }),
    [locale],
  );
}
