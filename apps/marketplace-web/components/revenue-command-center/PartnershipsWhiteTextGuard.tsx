"use client";

import type { ReactNode } from "react";

export default function PartnershipsWhiteTextGuard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      data-partnerships-experience="premium-light-v1"
      className="min-h-screen w-full bg-[#f4f8fc] text-[#102a43]"
    >
      {children}
    </div>
  );
}
