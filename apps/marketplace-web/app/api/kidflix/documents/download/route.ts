import { downloadDocument } from "@/angelcare-marketplace/kidflix/documents/delivery";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return await downloadDocument(request);
  } catch (e) {
    const u = new URL(request.url),
      l = ["en", "fr", "ar"].includes(u.searchParams.get("locale") || "")
        ? u.searchParams.get("locale")!
        : "en",
      i = l === "fr" ? 1 : l === "ar" ? 2 : 0,
      key = u.searchParams.get("key") || "",
      href = /^[a-z0-9][a-z0-9._-]{1,119}$/.test(key)
        ? `/kidflix/${l}/experience/${key}`
        : `/kidflix/${l}/explore/documents`,
      title = [
        "Document unavailable",
        "Document indisponible",
        "الوثيقة غير متاحة",
      ][i],
      body = [
        "This published file cannot be delivered right now. Return to the resource to check its current files and try again.",
        "Ce fichier ne peut pas être délivré pour le moment. Revenez à la ressource pour consulter ses fichiers actuels et réessayer.",
        "لا يمكن تقديم هذا الملف المنشور حالياً. ارجع إلى المورد للتحقق من ملفاته الحالية وحاول مجدداً.",
      ][i],
      link = [
        "Return to resource",
        "Revenir à la ressource",
        "العودة إلى المورد",
      ][i];
    return new Response(
      `<!doctype html><html lang="${l}" dir="${l === "ar" ? "rtl" : "ltr"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KidFlix · ${title}</title><style>body{font:17px system-ui;background:#edf7ff;color:#121c65;padding:8vh 6vw}main{max-width:600px;background:white;padding:35px;border-radius:18px;margin:auto}img{width:150px}a{display:inline-block;background:#ff0788;color:white;padding:12px 20px;border-radius:9px;text-decoration:none}</style><main><img src="/kidflix/kidflix-official-optimized.webp" alt="KidFlix"><h1>${title}</h1><p>${body}</p><a href="${href}">${link}</a></main></html>`,
      {
        status: String((e as Error).message) === "RATE_LIMITED" ? 429 : 409,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
