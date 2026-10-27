import type { ReactNode } from "react";
import type { Metadata } from "next";
import { kidflixIcons } from "@/angelcare-marketplace/kidflix/brand";

export const metadata: Metadata = { icons: kidflixIcons() };

export default function KidFlixBoundary({ children }: { children: ReactNode }) {
  return children;
}
