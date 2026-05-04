import MarketOsSidebar from "./sidebar"
import MarketOsTopbar from "./topbar"

export default function MarketOsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <MarketOsSidebar />

      <div className="flex-1">
        <MarketOsTopbar />
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
