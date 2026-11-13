"use client";
import { createContext, useContext, type AnchorHTMLAttributes } from "react";
import type { View } from "./content";
export const JourneyContext = createContext<View>("conseil");
/** The real href carries its journey, including new tabs, copied links and modifier-clicks. */
export function JourneyLink({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const view = useContext(JourneyContext);
  const destination =
    href && /^#(?:ew-|world-enquiry)/.test(href)
      ? `#${view}/${href.slice(1)}`
      : href;
  return <a {...props} href={destination} />;
}
