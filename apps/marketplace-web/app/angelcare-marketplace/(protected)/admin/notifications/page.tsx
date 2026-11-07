import { requireMarketplaceAdminPageContext } from "@/angelcare-marketplace/auth/context";
import { NotificationCenter } from "@/angelcare-marketplace/admin-notifications/NotificationCenter";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Notifications · AngelCare Admin",
  robots: { index: false, follow: false },
};
export default async function NotificationsPage() {
  const c = await requireMarketplaceAdminPageContext(
    "marketplace.admin.access",
  );
  return <NotificationCenter embedded initialLocale={c.locale} />;
}
