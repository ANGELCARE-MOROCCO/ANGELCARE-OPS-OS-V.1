
"use client"

import {
  Search,
  Filter,
  Download,
  Users,
  MapPinned,
  Activity,
  Award,
  ClipboardCheck,
  Megaphone,
  BarChart3,
  FolderKanban,
} from "lucide-react"

const ambassadors = [
  { name: "Youssef El Fassi", city: "Casablanca", region: "Casablanca-Settat", score: 92, status: "Active", tasks: 42 },
  { name: "Fatima Zahra Ait", city: "Rabat", region: "Rabat-Salé-Kénitra", score: 89, status: "Active", tasks: 38 },
  { name: "Omar Kabbaj", city: "Marrakech", region: "Marrakech-Safi", score: 88, status: "Active", tasks: 35 },
  { name: "Imane Lahlou", city: "Fès", region: "Fès-Meknès", score: 85, status: "Active", tasks: 31 },
]

const stats = [
  ["Total Ambassadors","1,248"],
  ["Active Ambassadors","1,089"],
  ["Cities Covered","168 / 230"],
  ["Avg. Performance","86/100"],
  ["Tasks Completed","3,847"],
  ["Incentives Paid","1.28M MAD"],
]

export default function AmbassadorsDirectoryExact() {
  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <aside className="w-[260px] border-r border-zinc-200 bg-white px-5 py-6">
        <div className="mb-8 text-2xl font-bold tracking-tight text-violet-700">
          Market-OS
        </div>

        <div className="space-y-2">
          {[
            "Overview",
            "Ambassadors",
            "Territories",
            "Performance",
            "Activities",
            "Reports",
          ].map((item) => (
            <div
              key={item}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                item === "Ambassadors"
                  ? "bg-violet-100 text-violet-700"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Users size={18} />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-violet-200 bg-violet-50 p-5">
          <div className="text-lg font-semibold text-violet-700">Ask Angel AI</div>
          <p className="mt-2 text-sm text-zinc-600">
            Operational assistant for ambassadors management.
          </p>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Ambassadors Directory
            </h1>
            <p className="mt-2 text-zinc-500">
              View, manage and connect with Angelcare ambassadors across Morocco.
            </p>
          </div>

          <button className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium">
            <Filter size={16} />
            Filters
          </button>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {stats.map(([title,value]) => (
            <div key={title as string} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-zinc-500">{title as string}</div>
              <div className="mt-3 text-3xl font-bold text-zinc-900">{value as string}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
              <Search size={18} className="text-zinc-400" />
              <input
                className="w-full outline-none"
                placeholder="Search ambassadors..."
              />
            </div>

            <button className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-medium">
              All Regions
            </button>

            <button className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-medium">
              All Cities
            </button>

            <button className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white">
              Add Ambassador
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1.7fr_0.9fr] gap-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Ambassadors</h2>

              <button className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2">
                <Download size={16} />
                Export
              </button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-sm text-zinc-500">
                  <th className="pb-4">Ambassador</th>
                  <th className="pb-4">Region / City</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Performance</th>
                  <th className="pb-4">Tasks</th>
                </tr>
              </thead>

              <tbody>
                {ambassadors.map((a) => (
                  <tr key={a.name} className="border-b border-zinc-100">
                    <td className="py-5">
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-sm text-zinc-500">+212 600000000</div>
                    </td>

                    <td>
                      <div className="font-medium">{a.region}</div>
                      <div className="text-sm text-zinc-500">{a.city}</div>
                    </td>

                    <td>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                        {a.status}
                      </span>
                    </td>

                    <td>
                      <div className="font-semibold">{a.score}/100</div>
                      <div className="mt-2 h-2 w-24 rounded-full bg-zinc-100">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${a.score}%` }}
                        />
                      </div>
                    </td>

                    <td className="font-semibold">{a.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <MapPinned className="text-violet-600" />
                <h3 className="text-xl font-bold">Ambassador Coverage</h3>
              </div>

              <div className="mt-8 flex h-[280px] items-center justify-center rounded-3xl bg-violet-50 text-violet-400">
                Morocco Coverage Map
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Quick Actions</h3>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  ["Add Ambassador", Users],
                  ["View Performance", BarChart3],
                  ["Campaigns", Megaphone],
                  ["Task Management", FolderKanban],
                ].map(([label, Icon]) => (
                  <button
                    key={label as string}
                    className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 p-6 transition hover:border-violet-300 hover:bg-violet-50"
                  >
                    <Icon className="mb-3 text-violet-600" size={22} />
                    <span className="text-sm font-medium">{label as string}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
