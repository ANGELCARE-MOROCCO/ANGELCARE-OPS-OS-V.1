"use client"

import { usePathname } from "next/navigation"

export default function MarketOsTopbar() {
  const pathname = usePathname()

  return (
    <div className="h-16 bg-white border-b flex items-center px-6">
      <h2 className="font-bold text-sm text-slate-600">
        {pathname}
      </h2>
    </div>
  )
}
