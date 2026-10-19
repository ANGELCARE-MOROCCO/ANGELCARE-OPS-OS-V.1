import { path, type Locale } from "../catalogue";
export const socialWords = {
  love: ["Love this discovery", "J’aime cette découverte", "أحب هذا الاكتشاف"],
  loved: ["Remove my heart", "Retirer mon cœur", "إزالة إعجابي"],
  heart: ["heart", "cœur", "إعجاب"],
  loves: ["hearts", "cœurs", "إعجابات"],
  loading: ["Loading hearts", "Chargement des cœurs", "جار تحميل الإعجابات"],
  unavailable: [
    "Hearts are temporarily unavailable.",
    "Les cœurs sont momentanément indisponibles.",
    "الإعجابات غير متاحة مؤقتاً.",
  ],
  failure: [
    "We could not confirm your heart. Try again.",
    "Votre cœur n’a pas pu être confirmé. Réessayez.",
    "تعذر تأكيد إعجابك. حاول مجدداً.",
  ],
  cookies: [
    "Allow this site’s cookies to keep your heart.",
    "Autorisez les cookies de ce site pour conserver votre cœur.",
    "اسمح بملفات تعريف الارتباط لهذا الموقع لحفظ إعجابك.",
  ],
  wait: [
    "Please wait a moment before changing your heart again.",
    "Patientez un instant avant de modifier à nouveau votre cœur.",
    "انتظر قليلاً قبل تغيير إعجابك مجدداً.",
  ],
  retry: ["Try again", "Réessayer", "حاول مجدداً"],
  share: [
    "Share this discovery",
    "Partager cette découverte",
    "شارك هذا الاكتشاف",
  ],
  shareOn: ["Share on", "Partager sur", "المشاركة عبر"],
  copy: ["Copy link", "Copier le lien", "نسخ الرابط"],
  copied: ["Link copied", "Lien copié", "تم نسخ الرابط"],
  copyHelp: ["Copy this link", "Copiez ce lien", "انسخ هذا الرابط"],
  more: ["More options", "Autres options", "خيارات أخرى"],
  close: ["Close", "Fermer", "إغلاق"],
  endTitle: [
    "A lovely discovery deserves to be shared.",
    "Les belles découvertes se partagent.",
    "الاكتشافات الجميلة تستحق المشاركة.",
  ],
  endCopy: [
    "Leave a heart or pass this discovery to someone you love.",
    "Laissez un cœur ou offrez cette découverte à vos proches.",
    "اترك إعجاباً أو شارك هذا الاكتشاف مع من تحب.",
  ],
  message: [
    "A lovely discovery on KidFlix",
    "Une belle découverte sur KidFlix",
    "اكتشاف جميل على KidFlix",
  ],
} as const;
export type SocialWord = keyof typeof socialWords;
export const sw = (key: SocialWord, locale: Locale) =>
  socialWords[key][locale === "fr" ? 1 : locale === "ar" ? 2 : 0];
export function resourcePath(key: string, locale: Locale) {
  return path(locale, "/experience/" + encodeURIComponent(key));
}
export function shareLinks(
  origin: string,
  key: string,
  locale: Locale,
  title: string,
) {
  const base = new URL(origin);
  if (!["https:", "http:"].includes(base.protocol))
    throw Error("INVALID_ORIGIN");
  const url = new URL(resourcePath(key, locale), base.origin).href;
  const text = sw("message", locale) + " · " + title + "\n" + url;
  return {
    url,
    text,
    whatsapp: "https://wa.me/?text=" + encodeURIComponent(text),
    facebook:
      "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url),
  };
}
export function validLove(
  value: unknown,
): value is { count: number; liked: boolean } {
  const v = value as { count: number; liked: boolean } | null;
  return (
    !!v &&
    Number.isSafeInteger(v.count) &&
    v.count >= 0 &&
    typeof v.liked === "boolean"
  );
}
