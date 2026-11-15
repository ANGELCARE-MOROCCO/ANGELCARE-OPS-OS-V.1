"use client";
import { useEffect, useState, type ReactNode } from "react";
/** Retains the existing EN/AR storefront for other journeys; Partner OS uses the same new renderer. */
export function PartnerLocaleEntry({
  children,
  partner,
}: {
  children: ReactNode;
  partner: ReactNode;
}) {
  const [selected, setSelected] = useState(false);
  useEffect(() => {
    const read = () =>
      setSelected(location.hash.split("/")[0] === "#partner-os");
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, []);
  return selected ? partner : children;
}
