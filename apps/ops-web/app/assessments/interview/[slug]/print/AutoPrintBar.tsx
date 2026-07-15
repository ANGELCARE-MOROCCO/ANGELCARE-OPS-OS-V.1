"use client";

import Link from "next/link";

export default function AutoPrintBar({ backHref }: { backHref: string }) {
  return (
    <div className="ac-printbar no-print">
      <Link href={backHref}>← Retour au questionnaire</Link>
      <button type="button" onClick={() => window.print()}>Imprimer A4</button>
    </div>
  );
}
