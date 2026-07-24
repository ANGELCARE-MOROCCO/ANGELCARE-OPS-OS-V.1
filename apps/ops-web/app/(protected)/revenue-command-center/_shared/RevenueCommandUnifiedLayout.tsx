import "./revenue-command-experience.css";

export default function RevenueCommandUnifiedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-revenue-command-experience="premium-v1">
      <a
        href="#revenue-command-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-slate-950 focus:shadow-xl"
      >
        Aller au contenu principal
      </a>
      <div id="revenue-command-content">{children}</div>
    </div>
  );
}
