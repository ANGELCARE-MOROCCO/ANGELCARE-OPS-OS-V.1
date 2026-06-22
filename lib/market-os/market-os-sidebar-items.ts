export type MarketOSSidebarItem = {
  label: string
  href: string
  icon?: string
  permissions?: string[]
}

export type MarketOSSidebarGroup = {
  label: string
  items: MarketOSSidebarItem[]
}

export const marketOSSidebarItems: MarketOSSidebarGroup[] = [
  {
    label: "Market OS",
    items: [
      { label: "Command Center", href: "/market-os" },
      { label: "Content Command", href: "/market-os/content-command-center" },
      { label: "Campaign Lifecycle", href: "/market-os/campaign-lifecycle" },
      { label: "Ambassadors", href: "/market-os/ambassadors" },
    ],
  },
]

export default marketOSSidebarItems

export const marketOsSidebarItems: any[] = []

