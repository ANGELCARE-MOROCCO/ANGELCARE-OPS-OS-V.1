import {partnerText,type PartnerLocale} from "./partner/Locale";
/** Explicit school-universe editorial translation matrix. Every declared text key must have EN and AR. */
const translations:Record<string,readonly [string,string]> = {
 "Explorer": [
  "Explore",
  "استكشف"
 ],
 "Inspirations": [
  "Inspiration",
  "أفكار ملهمة"
 ],
 "Visiter l'école": [
  "Visit the school",
  "جولة في المؤسسة"
 ],
 "Les univers": [
  "Explore worlds",
  "المجالات"
 ],
 "Mes idées": [
  "My ideas",
  "أفكاري"
 ],
 "L'EXPÉRIENCE ANGELCARE ÉCOLE · NOUVELLE GÉNÉRATION": [
  "NEXT-GENERATION ANGELCARE SCHOOL EXPERIENCE",
  "تجربة أنجل كير المدرسية الجديدة"
 ],
 "Et si votre établissement devenait": [
  "What if your school became",
  "ماذا لو أصبحت مؤسستكم"
 ],
 "votre plus belle vitrine ?": [
  "your best first impression?",
  "أفضل واجهة تعبر عنكم؟"
 ],
 "Découvrez des idées concrètes pour accueillir, inspirer, organiser et faire grandir votre école. Des univers à explorer, des solutions à comprendre, des projets à imaginer.": [
  "Discover real ideas to welcome families, inspire children and organize your school. Explore professional worlds, understand practical solutions and imagine your next project.",
  "اكتشفوا أفكاراً عملية للاستقبال والإلهام والتنظيم وتطوير مؤسستكم. مجالات للاستكشاف وحلول واضحة ومشاريع لتصميمها."
 ],
 "6 univers de vie": [
  "6 professional worlds",
  "٦ مجالات مهنية"
 ],
 "22 domaines réels": [
  "22 real domains",
  "٢٢ مجالاً حقيقياً"
 ],
 "Des idées à conserver": [
  "Save your inspirations",
  "أفكار تستحق الحفظ"
 ],
 "Découvrir les transformations": [
  "Explore transformations",
  "اكتشفوا التحولات"
 ],
 "Imaginez la différence": [
  "Imagine the difference",
  "تخيلوا الفرق"
 ],
 "01 / DÉCOUVERTE SUR MESURE": [
  "01 / PERSONALIZED DISCOVERY",
  "٠١ / اكتشاف مخصص"
 ],
 "Comment souhaitez-vous explorer ?": [
  "How would you like to explore?",
  "كيف ترغبون في الاستكشاف؟"
 ],
 "Trois chemins clairs, une seule destination : des solutions adaptées à votre établissement.": [
  "Three clear routes to one destination: solutions suited to your school.",
  "ثلاث طرق واضحة للوصول إلى حلول مناسبة لمؤسستكم."
 ],
 "Par espace": [
  "By space",
  "حسب الفضاء"
 ],
 "J'explore mon école": [
  "Explore school spaces",
  "أستكشف فضاءات مؤسستي"
 ],
 "Par objectif": [
  "By goal",
  "حسب الهدف"
 ],
 "Je pars d'un besoin": [
  "Start with a need",
  "أنطلق من حاجة"
 ],
 "Par domaine": [
  "By domain",
  "حسب المجال"
 ],
 "Je connais le sujet": [
  "I know my topic",
  "أعرف ما أبحث عنه"
 ],
 "pistes à découvrir": [
  "avenues to explore",
  "مسارات للاستكشاف"
 ],
 "VOTRE PARCOURS RECOMMANDÉ": [
  "YOUR RECOMMENDED PATH",
  "المسار المقترح"
 ],
 "Voici quatre thèmes utiles pour explorer la situation, sans engagement.": [
  "Explore four relevant themes without any commitment.",
  "استكشفوا أربعة مواضيع مناسبة دون أي التزام."
 ],
 "Voir la bibliothèque complète": [
  "View the full library",
  "عرض المكتبة كاملة"
 ],
 "Aucun domaine ne correspond à cette recherche.": [
  "No domains match your search.",
  "لا توجد مجالات مطابقة للبحث."
 ],
 "02 / CE QUI CHANGE VRAIMENT UNE ÉCOLE": [
  "02 / REAL SCHOOL TRANSFORMATIONS",
  "٠٢ / تحولات حقيقية في المدرسة"
 ],
 "De belles idées.": [
  "Beautiful ideas.",
  "أفكار جميلة."
 ],
 "De vrais usages.": [
  "Real applications.",
  "تطبيقات واقعية."
 ],
 "Quatre situations que les directions connaissent bien, racontées par leurs solutions et leurs bénéfices concrets.": [
  "Four familiar school-management situations, with practical solutions and clear benefits.",
  "أربع حالات تعرفها إدارات المؤسسات مع حلول عملية وفوائد واضحة."
 ],
 "Ouvrir une école": [
  "Open a school",
  "افتتاح مؤسسة"
 ],
 "Créer une classe": [
  "Create a classroom",
  "تجهيز قاعة"
 ],
 "Organiser l'équipe": [
  "Organize the team",
  "تنظيم الفريق"
 ],
 "Réussir un événement": [
  "Plan a great event",
  "إنجاح مناسبة"
 ],
 "Ce que cela change": [
  "What it improves",
  "ما الذي سيتغير؟"
 ],
 "À DÉCOUVRIR DANS CE PARCOURS": [
  "EXPLORE IN THIS PATH",
  "اكتشفوا ضمن هذا المسار"
 ],
 "Illustrations d'ambiance, références à vérifier dans le catalogue.": [
  "Illustrative concepts; check published catalogue references.",
  "تصورات توضيحية؛ المرجع هو العروض المنشورة بالكتالوج."
 ],
 "Histoire précédente": [
  "Previous story",
  "القصة السابقة"
 ],
 "Histoire suivante": [
  "Next story",
  "القصة التالية"
 ],
 "03 / VISITE VISUELLE": [
  "03 / VISUAL SCHOOL TOUR",
  "٠٣ / جولة بصرية"
 ],
 "Promenez-vous dans": [
  "Take a tour of",
  "قوموا بجولة في"
 ],
 "l'école idéale.": [
  "your ideal school.",
  "مدرستكم المثالية."
 ],
 "Choisissez un espace : découvrez pourquoi il compte et quelles idées peuvent l'améliorer.": [
  "Choose a space to discover why it matters and how to improve it.",
  "اختاروا فضاءً لاكتشاف أهميته وأفكار تطويره."
 ],
 "6 espaces à explorer": [
  "6 spaces to explore",
  "٦ فضاءات للاستكشاف"
 ],
 "Découvrir les idées de cet espace": [
  "Explore ideas for this space",
  "استكشفوا أفكار هذا الفضاء"
 ],
 "04 / SIX UNIVERS QUI ONT CHACUN LEUR PERSONNALITÉ": [
  "04 / SIX DISTINCT PROFESSIONAL WORLDS",
  "٠٤ / ستة مجالات مهنية متميزة"
 ],
 "À chaque besoin,": [
  "For every need,",
  "لكل حاجة،"
 ],
 "un monde à explorer.": [
  "a world to explore.",
  "مجال للاستكشاف."
 ],
 "Pas six copies d'une même fiche : six histoires, six ambiances et 22 portes d'entrée vers des solutions concrètes.": [
  "Six distinct stories and visual identities, and 22 ways into practical solutions.",
  "ست قصص وأجواء مختلفة، و٢٢ مدخلاً إلى حلول عملية."
 ],
 "BIBLIOTHÈQUE VISUELLE · 22 DOMAINES": [
  "VISUAL LIBRARY · 22 DOMAINS",
  "مكتبة بصرية · ٢٢ مجالاً"
 ],
 "Une idée en tête ?": [
  "Have an idea in mind?",
  "هل لديكم فكرة؟"
 ],
 "Retrouvez-la ici.": [
  "Find it here.",
  "اعثروا عليها هنا."
 ],
 "Explorez les applications, sauvegardez l'inspiration, puis reliez-la à votre projet.": [
  "Explore applications, save inspiration and connect it to your project.",
  "استكشفوا الاستخدامات واحفظوا الأفكار واربطوها بمشروعكم."
 ],
 "Vue compacte": [
  "Compact view",
  "عرض مختصر"
 ],
 "Afficher tous les domaines": [
  "Show every domain",
  "عرض جميع المجالات"
 ],
 "Tous les univers": [
  "All worlds",
  "جميع المجالات"
 ],
 "Aucun résultat. Essayez un autre mot ou univers.": [
  "No results. Try another term or category.",
  "لا توجد نتائج. جربوا كلمة أو مجالاً آخر."
 ],
 "Découvrir les 22 domaines": [
  "Explore all 22 domains",
  "استكشفوا المجالات الـ٢٢"
 ],
 "Retirer cette idée": [
  "Remove this idea",
  "إزالة الفكرة"
 ],
 "Enregistrer cette idée": [
  "Save this idea",
  "حفظ الفكرة"
 ],
 "Retour aux univers": [
  "Back to worlds",
  "العودة إلى المجالات"
 ],
 "Retirer des idées": [
  "Remove saved idea",
  "إزالة الفكرة المحفوظة"
 ],
 "Enregistrer l'idée": [
  "Save idea",
  "حفظ الفكرة"
 ],
 "EXPLOREZ LE CONCEPT": [
  "EXPLORE THE CONCEPT",
  "استكشفوا الفكرة"
 ],
 "Découvrez-le en situation.": [
  "See it in action.",
  "شاهدوا التطبيق العملي."
 ],
 "Concept illustratif : disponibilité, variantes et tarifs restent dans les offres publiées.": [
  "Illustrative concept: check availability, variants and prices in published offers.",
  "الفكرة توضيحية؛ التوافر والخيارات والأسعار حسب العروض المنشورة."
 ],
 "À QUOI CELA SERT CONCRÈTEMENT ?": [
  "WHAT DOES IT HELP WITH?",
  "ما الفائدة العملية؟"
 ],
 "IDÉES D'APPLICATION": [
  "PRACTICAL APPLICATIONS",
  "أفكار للتطبيق"
 ],
 "Pour aller plus loin": [
  "Explore further",
  "للمزيد من الاستكشاف"
 ],
 "D'autres domaines peuvent compléter cette idée, sans créer un lot fictif ni forcer une demande de devis.": [
  "Related domains can complement this idea without implying a bundle or a quotation requirement.",
  "قد تكمل مجالات أخرى هذه الفكرة دون افتراض باقات أو إلزام بطلب عرض."
 ],
 "Garder cette idée": [
  "Save this idea",
  "حفظ هذه الفكرة"
 ],
 "Retirer du projet": [
  "Remove from project",
  "إزالة من المشروع"
 ],
 "Ajouter à ma sélection": [
  "Add to my selection",
  "إضافة إلى اختياراتي"
 ],
 "Voir les offres publiées": [
  "View published products",
  "عرض المنتجات المنشورة"
 ],
 "Masquer les détails": [
  "Hide details",
  "إخفاء التفاصيل"
 ],
 "Préciser un besoin": [
  "Specify a need",
  "تحديد الحاجة"
 ],
 "Facultatif : précisez un besoin uniquement pour enrichir votre brief, pas pour créer une commande.": [
  "Optional: add context to your enquiry; this does not place an order.",
  "اختياري: أضيفوا تفاصيل لطلبكم دون إنشاء طلب شراء."
 ],
 "Tranche d'âge": [
  "Age range",
  "الفئة العمرية"
 ],
 "À préciser": [
  "To be confirmed",
  "يحدد لاحقاً"
 ],
 "Format ou contexte": [
  "Format or context",
  "الحجم أو السياق"
 ],
 "Lieu, format, thème…": [
  "Space, format, theme…",
  "المكان أو الحجم أو الموضوع…"
 ],
 "Note utile": [
  "Useful note",
  "ملاحظة مفيدة"
 ],
 "Détail à préciser": [
  "Detail to clarify",
  "تفصيل للتوضيح"
 ],
 "MA COLLECTION D'INSPIRATIONS": [
  "MY INSPIRATION COLLECTION",
  "مجموعتي من الأفكار"
 ],
 "Votre école prend forme,": [
  "Your school takes shape,",
  "تتبلور مؤسستكم،"
 ],
 "une idée à la fois.": [
  "one idea at a time.",
  "فكرة بعد أخرى."
 ],
 "Enregistrez les inspirations qui vous intéressent, puis sélectionnez les domaines utiles au projet. Rien n'est commandé automatiquement.": [
  "Save inspiring ideas, then select the domains relevant to your project. Nothing is ordered automatically.",
  "احفظوا الأفكار الملهمة ثم اختاروا المجالات المناسبة لمشروعكم. لن يتم طلب أي منتج تلقائياً."
 ],
 "Votre collection commence avec une idée.": [
  "Your collection starts with an idea.",
  "تبدأ مجموعتكم بفكرة."
 ],
 "Visitez un univers, explorez un domaine et enregistrez ce qui vous plaît.": [
  "Visit a world, explore a domain and save what matters to you.",
  "زوروا مجالاً واستكشفوا ما يهمكم واحفظوه."
 ],
 "Voir ma sélection native (": [
  "View my product selection (",
  "عرض اختيارات المنتجات ("
 ],
 "Revoir les produits": [
  "Review products",
  "مراجعة المنتجات"
 ],
 "Préparer mon projet": [
  "Prepare my project",
  "تحضير مشروعي"
 ],
 "ANGELCARE · À VOTRE CÔTÉ": [
  "ANGELCARE · BY YOUR SIDE",
  "أنجل كير · إلى جانبكم"
 ],
 "Des idées pour aujourd'hui.": [
  "Ideas for today.",
  "أفكار لليوم."
 ],
 "Une école plus forte demain.": [
  "A stronger school tomorrow.",
  "ومدرسة أقوى غداً."
 ],
 "Inspirez-vous, explorez et gardez ce qui vous correspond. Notre équipe vous aide ensuite à transformer vos besoins en une demande concrète.": [
  "Discover, explore and save your ideas. Our team can then help you turn your needs into a practical enquiry.",
  "استلهموا الأفكار واستكشفوها واحفظوا ما يناسبكم. يساعدكم فريقنا على تحويل الاحتياجات إلى طلب واضح."
 ],
 "Parler de mon projet": [
  "Discuss my project",
  "مناقشة مشروعي"
 ],
 "Un besoin, un espace, une activité…": [
  "A need, a space, an activity…",
  "حاجة أو فضاء أو نشاط…"
 ],
 "Rechercher dans les 22 domaines": [
  "Search all 22 domains",
  "البحث في المجالات الـ٢٢"
 ],
 "Rechercher un thème, un usage ou un besoin…": [
  "Search a theme, use or need…",
  "ابحثوا عن موضوع أو استخدام أو حاجة…"
 ],
 "Rechercher les domaines": [
  "Search domains",
  "البحث في المجالات"
 ],
 "Filtrer les univers": [
  "Filter school worlds",
  "تصفية المجالات"
 ],
 "Salle de classe lumineuse et espaces pédagogiques": [
  "Bright classroom and educational spaces",
  "قاعة مضيئة وفضاءات تعليمية"
 ],
 "Organisation et préparation de l’équipe pédagogique": [
  "Organized and prepared teaching team",
  "تنظيم الفريق التربوي وتحضيره"
 ],
 "Établissement préscolaire lumineux et accueillant": [
  "Bright and welcoming preschool",
  "مؤسسة تعليم أولي مضيئة ومرحبة"
 ],
 "DOMAINE": [
  "DOMAIN",
  "المجال"
 ],
 "EXPÉRIENCE": [
  "EXPERIENCE",
  "تجربة"
 ],
 "ESPACE": [
  "SPACE",
  "فضاء"
 ],
 "Journées portes ouvertes": [
  "Open days",
  "الأبواب المفتوحة"
 ],
 "Navigation équipements": [
  "Equipment navigation",
  "تنقل التجهيزات"
 ],
 "Choisissez votre manière de découvrir": [
  "Choose how to explore",
  "اختاروا طريقة الاستكشاف"
 ],
 "Modes de découverte": [
  "Discovery modes",
  "طرق الاستكشاف"
 ],
 "Multi-âges": [
  "Mixed ages",
  "أعمار مختلطة"
 ],
 "Équipements · Projet d'établissement": [
  "Equipment · School project",
  "التجهيزات · مشروع المؤسسة"
 ],
 "Inspirations sauvegardées (non commandées)": [
  "Saved inspirations (not ordered)",
  "أفكار محفوظة (لم يتم طلبها)"
 ],
 "Retourner la carte pour explorer": [
  "Flip to explore",
  "اقلبوا البطاقة للاستكشاف"
 ],
 "Offres, tarifs et délais restent soumis au catalogue et à validation.": [
  "Offers, prices and lead times remain subject to the published catalogue and confirmation.",
  "العروض والأسعار والمواعيد رهن الكتالوج المنشور والتأكيد."
 ]
};
export function equipmentUi(locale:PartnerLocale,fr:string):string{
 if(locale==="fr")return fr;
 return translations[fr]?.[locale==="en"?0:1]??partnerText(locale,fr);
}
export const equipmentUiCoverage=Object.keys(translations).length;
