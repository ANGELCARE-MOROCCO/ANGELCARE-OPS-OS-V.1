import MarketOsLayout from "@/app/components/market-os/layout/layout"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MarketOsLayout>{children}</MarketOsLayout>
}