import Link from "next/link";
import s from "./marketplace-entry.module.css";
/** Mount inside the EXISTING Marketplace header and footer navigation lists. English is the default entry. */
export function KidFlixMarketplaceEntry({
  placement = "header",
}: {
  placement?: "header" | "footer";
}) {
  return (
    <Link
      href="/kidflix/en"
      className={placement === "footer" ? s.footer : s.header}
      aria-label="KidFlix · Free discoveries"
    >
      <img
        src="/kidflix/kidflix-official.png"
        width={76}
        height={31}
        alt="KidFlix"
      />
      <span>FREE</span>
    </Link>
  );
}
