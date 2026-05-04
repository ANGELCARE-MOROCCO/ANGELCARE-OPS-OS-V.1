"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { marketOsSidebarItems } from "@/lib/market-os/market-os-sidebar-items"

export default function MarketOsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-slate-950 text-white min-h-screen p-4">
      <h1 className="text-xl font-black mb-6">Market-OS</h1>

      {marketOsSidebarItems.map((group) => (
        <div key={group.group} className="mb-6">
          <p className="text-xs uppercase text-slate-400 mb-2">{group.group}</p>

          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold ${
                    active
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </aside>
  )
}
