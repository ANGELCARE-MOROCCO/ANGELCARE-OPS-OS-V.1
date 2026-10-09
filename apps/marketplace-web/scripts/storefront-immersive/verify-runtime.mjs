// storefronts-ten-r1/runtime-tests.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// storefronts-ten-r1/content-runtime.mjs
var w = (fr, en, ar) => ({
  fr,
  en,
  ar
});
var tr = (value, locale) => value[locale];
var topic = (label, body, query, photo2) => ({ label, body, query, photo: photo2 });
var chapter = (title, body, photo2) => ({
  title,
  body,
  photo: photo2
});
var PROFILES = {
  development: {
    key: "development",
    label: w("D\xE9veloppement", "Development", "\u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u0637\u0641\u0644"),
    eyebrow: w(
      "LE MONDE GRANDIT AVEC EUX",
      "A WORLD THAT GROWS WITH THEM",
      "\u0639\u0627\u0644\u0645 \u064A\u0643\u0628\u0631 \u0645\u0639\u0647\u0645"
    ),
    title: w(
      "Petites mains. Grandes d\xE9couvertes.",
      "Little hands. Extraordinary discoveries.",
      "\u0623\u064A\u062F\u064D \u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u0643\u0628\u064A\u0631\u0629."
    ),
    lead: w(
      "Transformez la curiosit\xE9 en moments de d\xE9couverte. Activit\xE9s, jeux et ressources : trouvez l\u2019exp\xE9rience qui fait briller leur prochaine \xE9tape.",
      "Turn curiosity into moments of discovery. Activities, games and resources for their next bright step.",
      "\u062D\u0648\u0651\u0644\u0648\u0627 \u0627\u0644\u0641\u0636\u0648\u0644 \u0625\u0644\u0649 \u0644\u062D\u0638\u0627\u062A \u0627\u0643\u062A\u0634\u0627\u0641 \u0645\u0639 \u0623\u0646\u0634\u0637\u0629 \u0648\u0623\u0644\u0639\u0627\u0628 \u0648\u0645\u0648\u0627\u0631\u062F \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u062E\u0637\u0648\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    photo: "development",
    secondaryPhoto: "flashcards",
    color: "#9b36df",
    companion: "#f42d78",
    signature: w(
      "Le studio des petites d\xE9couvertes",
      "The little-discoveries studio",
      "\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629"
    ),
    signatureLead: w(
      "Un \xE2ge, une envie, une activit\xE9. Composez votre point de d\xE9part \xE0 partir des donn\xE9es de chaque offre.",
      "An age, an interest, an activity. Build a starting point from the details of each offer.",
      "\u0639\u0645\u0631 \u0648\u0627\u0647\u062A\u0645\u0627\u0645 \u0648\u0646\u0634\u0627\u0637: \u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u0645\u0646 \u062A\u0641\u0627\u0635\u064A\u0644 \u0643\u0644 \u0639\u0631\u0636."
    ),
    topics: [
      topic(
        w("Langage & expression", "Language & expression", "\u0627\u0644\u0644\u063A\u0629 \u0648\u0627\u0644\u062A\u0639\u0628\u064A\u0631"),
        w(
          "Des mots aux histoires, ouvrir la conversation.",
          "From words to stories, open a conversation.",
          "\u0645\u0646 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u0642\u0635\u0635\u060C \u0627\u0641\u062A\u062D\u0648\u0627 \u0628\u0627\u0628 \u0627\u0644\u062D\u0648\u0627\u0631."
        ),
        "langage",
        "flashcards"
      ),
      topic(
        w(
          "Autonomie & Montessori",
          "Independence & Montessori",
          "\u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629 \u0648\u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"
        ),
        w(
          "Faire soi-m\xEAme, essayer, recommencer.",
          "Do, try and try again.",
          "\u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u0648\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0648\u0627\u0644\u062A\u0643\u0631\u0627\u0631."
        ),
        "montessori",
        "montessori"
      ),
      topic(
        w("Cr\xE9ativit\xE9 & jeux", "Creativity & play", "\u0627\u0644\u0625\u0628\u062F\u0627\u0639 \u0648\u0627\u0644\u0644\u0639\u0628"),
        w(
          "Mati\xE8res, couleurs et imagination en action.",
          "Materials, colours and imagination in action.",
          "\u0645\u0648\u0627\u062F \u0648\u0623\u0644\u0648\u0627\u0646 \u0648\u062E\u064A\u0627\u0644 \u064A\u062A\u062D\u0631\u0643."
        ),
        "jeu",
        "games"
      ),
      topic(
        w("Attention & apprentissage", "Focus & learning", "\u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0648\u0627\u0644\u062A\u0639\u0644\u0645"),
        w(
          "Des d\xE9couvertes qui respectent le rythme de l\u2019enfant.",
          "Discovery at a child\u2019s own pace.",
          "\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u062A\u062D\u062A\u0631\u0645 \u0625\u064A\u0642\u0627\u0639 \u0627\u0644\u0637\u0641\u0644."
        ),
        "apprentissage",
        "homework"
      )
    ],
    chapters: [
      chapter(
        w(
          "Apprendre commence par jouer",
          "Learning starts with play",
          "\u0627\u0644\u062A\u0639\u0644\u0645 \u064A\u0628\u062F\u0623 \u0628\u0627\u0644\u0644\u0639\u0628"
        ),
        w(
          "Une activit\xE9 adapt\xE9e vaut mieux qu\u2019un programme surcharg\xE9. Consultez l\u2019\xE2ge, la dur\xE9e et les mat\xE9riaux publi\xE9s avant de choisir.",
          "Check the published age, duration and materials before choosing an activity.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0639\u0645\u0631 \u0648\u0627\u0644\u0645\u062F\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0642\u0628\u0644 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0646\u0634\u0627\u0637."
        ),
        "games"
      ),
      chapter(
        w(
          "De la d\xE9couverte \xE0 la maison",
          "Bring discovery home",
          "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u064A\u0635\u0644 \u0625\u0644\u0649 \u0627\u0644\u0628\u064A\u062A"
        ),
        w(
          "Associez votre prochaine activit\xE9 \xE0 un kit ou une ressource, sans perdre le fil de votre objectif.",
          "Pair your next activity with a kit or resource that shares your goal.",
          "\u0627\u0631\u0628\u0637\u0648\u0627 \u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u0642\u0627\u062F\u0645 \u0628\u0645\u062C\u0645\u0648\u0639\u0629 \u0623\u0648 \u0645\u0648\u0631\u062F \u064A\u0646\u0627\u0633\u0628 \u0647\u062F\u0641\u0643\u0645."
        ),
        "montessori"
      ),
      chapter(
        w(
          "Le plaisir de recommencer",
          "The joy of trying again",
          "\u0645\u062A\u0639\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0646 \u062C\u062F\u064A\u062F"
        ),
        w(
          "Un espace, quelques minutes, un support adapt\xE9 : composez des moments qui donnent envie de revenir.",
          "A space, a few minutes and a suitable resource create moments worth returning to.",
          "\u0645\u0633\u0627\u062D\u0629 \u0648\u062F\u0642\u0627\u0626\u0642 \u0648\u0645\u0648\u0631\u062F \u0645\u0646\u0627\u0633\u0628 \u062A\u0635\u0646\u0639 \u0644\u062D\u0638\u0627\u062A \u062A\u0633\u062A\u062D\u0642 \u0627\u0644\u0639\u0648\u062F\u0629."
        ),
        "development"
      )
    ],
    steps: [
      w("Choisir un objectif", "Choose a goal", "\u0627\u062E\u062A\u064A\u0627\u0631 \u0647\u062F\u0641"),
      w("V\xE9rifier l\u2019\xE2ge", "Check the age", "\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0639\u0645\u0631"),
      w("Explorer le contenu", "Explore the content", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u062D\u062A\u0648\u0649"),
      w(
        "Suivre le parcours de l\u2019offre",
        "Follow the offer journey",
        "\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0631\u0636"
      )
    ],
    primary: "family/request",
    primaryLabel: w(
      "\xCAtre guid\xE9 pour mon enfant",
      "Get guidance for my child",
      "\u0637\u0644\u0628 \u062A\u0648\u062C\u064A\u0647 \u0644\u0637\u0641\u0644\u064A"
    ),
    related: ["kits", "home-services", "families"]
  },
  kits: {
    key: "kits",
    label: w("Kits & produits", "Kits & products", "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A"),
    eyebrow: w(
      "OUVREZ UNE BO\xCETE DE POSSIBILIT\xC9S",
      "OPEN A WORLD OF POSSIBILITIES",
      "\u0627\u0641\u062A\u062D\u0648\u0627 \u0639\u0627\u0644\u0645\u0627\u064B \u0645\u0646 \u0627\u0644\u0625\u0645\u0643\u0627\u0646\u0627\u062A"
    ),
    title: w(
      "Le prochain \xAB wow \xBB tient dans leurs mains.",
      "Their next \u201Cwow\u201D is in their hands.",
      "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0642\u0627\u062F\u0645 \u0628\u064A\u0646 \u0623\u064A\u062F\u064A\u0647\u0645."
    ),
    lead: w(
      "Kits Montessori, jeux, flashcartes et ressources digitales. Regardez chaque d\xE9tail, comparez les contenus et choisissez ce qui fait envie d\u2019apprendre.",
      "Montessori kits, games, flashcards and digital resources. Explore every detail and compare contents before choosing.",
      "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A \u0648\u0623\u0644\u0639\u0627\u0628 \u0648\u0628\u0637\u0627\u0642\u0627\u062A \u0648\u0645\u0648\u0627\u0631\u062F \u0631\u0642\u0645\u064A\u0629: \u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A."
    ),
    photo: "kits",
    secondaryPhoto: "flashcards",
    color: "#0873d9",
    companion: "#f42d78",
    signature: w(
      "Ouvrez le kit. D\xE9couvrez ce qu\u2019il contient.",
      "Open the kit. Discover what is inside.",
      "\u0627\u0641\u062A\u062D\u0648\u0627 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0648\u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0645\u062D\u062A\u0648\u064A\u0627\u062A\u0647\u0627."
    ),
    signatureLead: w(
      "Un explorateur de produits r\xE9els : contenus, formats et \xE2ges restent ceux de chaque fiche.",
      "A real-product explorer: contents, formats and ages come from each product record.",
      "\u0645\u0633\u062A\u0643\u0634\u0641 \u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0641\u0639\u0644\u064A\u0629: \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u0634\u0643\u0627\u0644 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0631 \u0645\u0646 \u0628\u064A\u0627\u0646\u0627\u062A \u0643\u0644 \u0645\u0646\u062A\u062C."
    ),
    topics: [
      topic(
        w("Kits Montessori", "Montessori kits", "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"),
        w(
          "D\xE9couvrir, manipuler, gagner en autonomie.",
          "Discover, handle, grow in independence.",
          "\u0627\u0643\u062A\u0634\u0627\u0641 \u0648\u062A\u062C\u0631\u064A\u0628 \u0648\u0627\u0643\u062A\u0633\u0627\u0628 \u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629."
        ),
        "montessori",
        "montessori"
      ),
      topic(
        w("Flashcartes", "Flashcards", "\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629"),
        w(
          "Des images qui ouvrent la conversation.",
          "Images that start conversations.",
          "\u0635\u0648\u0631 \u062A\u0641\u062A\u062D \u0628\u0627\u0628 \u0627\u0644\u062D\u0648\u0627\u0631."
        ),
        "flash",
        "flashcards"
      ),
      topic(
        w("Jeux de d\xE9veloppement", "Development games", "\u0623\u0644\u0639\u0627\u0628 \u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w(
          "L\u2019envie de jouer, le plaisir de progresser.",
          "The desire to play, the joy of progress.",
          "\u0627\u0644\u0631\u063A\u0628\u0629 \u0641\u064A \u0627\u0644\u0644\u0639\u0628 \u0648\u0645\u062A\u0639\u0629 \u0627\u0644\u062A\u0642\u062F\u0645."
        ),
        "jeu",
        "games"
      ),
      topic(
        w("Ressources digitales", "Digital resources", "\u0645\u0648\u0627\u0631\u062F \u0631\u0642\u0645\u064A\u0629"),
        w(
          "D\xE9couvrez le format indiqu\xE9 sur chaque offre.",
          "Discover the format listed on each offer.",
          "\u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0627\u0644\u0634\u0643\u0644 \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u0641\u064A \u0643\u0644 \u0639\u0631\u0636."
        ),
        "digital",
        "digital"
      )
    ],
    chapters: [
      chapter(
        w(
          "Le d\xE9tail fait la diff\xE9rence",
          "Details make the difference",
          "\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u062A\u0635\u0646\u0639 \u0627\u0644\u0641\u0631\u0642"
        ),
        w(
          "Visualisez les images sans recadrage. Consultez les \xE9l\xE9ments inclus, le format et les conditions de chaque produit.",
          "See uncropped images and check included components, format and conditions.",
          "\u0634\u0627\u0647\u062F\u0648\u0627 \u0627\u0644\u0635\u0648\u0631 \u0643\u0627\u0645\u0644\u0629 \u0648\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0634\u0643\u0644 \u0648\u0627\u0644\u0634\u0631\u0648\u0637."
        ),
        "kits"
      ),
      chapter(
        w(
          "Une s\xE9lection qui a du sens",
          "Build a meaningful selection",
          "\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0644\u0647\u0627 \u0645\u0639\u0646\u0649"
        ),
        w(
          "Gardez vos favoris et comparez les offres avant d\u2019ouvrir la fiche qui vous correspond.",
          "Save favourites and compare offers before opening the right product page.",
          "\u0627\u062D\u0641\u0638\u0648\u0627 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0639\u0631\u0648\u0636 \u0642\u0628\u0644 \u0641\u062A\u062D \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629."
        ),
        "flashcards"
      ),
      chapter(
        w("Le jeu continue", "Keep the discovery going", "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u064A\u0633\u062A\u0645\u0631"),
        w(
          "Passez du produit aux id\xE9es d\u2019activit\xE9s dans l\u2019univers D\xE9veloppement.",
          "Move from products to activity ideas in Development.",
          "\u0627\u0646\u062A\u0642\u0644\u0648\u0627 \u0645\u0646 \u0627\u0644\u0645\u0646\u062A\u062C \u0625\u0644\u0649 \u0623\u0641\u0643\u0627\u0631 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0641\u064A \u0641\u0636\u0627\u0621 \u0627\u0644\u062A\u0646\u0645\u064A\u0629."
        ),
        "games"
      )
    ],
    steps: [
      w("Explorer les formats", "Explore formats", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0623\u0634\u0643\u0627\u0644"),
      w("Comparer les contenus", "Compare contents", "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A"),
      w("Ouvrir la fiche", "Open the product page", "\u0641\u062A\u062D \u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u062A\u062C"),
      w(
        "Commander selon les conditions",
        "Order under the listed terms",
        "\u0627\u0644\u0637\u0644\u0628 \u062D\u0633\u0628 \u0627\u0644\u0634\u0631\u0648\u0637"
      )
    ],
    primary: "basket",
    primaryLabel: w("Retrouver mon panier", "Open my basket", "\u0641\u062A\u062D \u0633\u0644\u062A\u064A"),
    related: ["development", "families", "academy"]
  },
  academy: {
    key: "academy",
    label: w("Academy", "Academy", "\u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629"),
    eyebrow: w(
      "VOTRE AMBITION M\xC9RITE UN PARCOURS",
      "YOUR AMBITION DESERVES A PATHWAY",
      "\u0637\u0645\u0648\u062D\u0643\u0645 \u064A\u0633\u062A\u062D\u0642 \u0645\u0633\u0627\u0631\u0627\u064B"
    ),
    title: w(
      "Faites de vos comp\xE9tences votre prochaine force.",
      "Make your skills your next advantage.",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u0645\u0647\u0627\u0631\u0627\u062A\u0643\u0645 \u0642\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    lead: w(
      "Cours, programmes et parcours professionnels. Explorez les contenus publi\xE9s, comparez les modalit\xE9s et construisez une prochaine \xE9tape qui vous ressemble.",
      "Explore published courses, programmes and professional pathways. Compare delivery options and build your next step.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062F\u0648\u0631\u0627\u062A \u0648\u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u062A\u0639\u0644\u0645 \u0644\u0628\u0646\u0627\u0621 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    photo: "academy",
    secondaryPhoto: "professional",
    color: "#7539d9",
    companion: "#f42d78",
    signature: w(
      "Le campus de votre prochaine \xE9tape",
      "The campus for your next step",
      "\u062D\u0631\u0645 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
    ),
    signatureLead: w(
      "S\xE9lectionnez un programme publi\xE9 ou explorez les cours du catalogue. Chaque inscription garde son propre parcours.",
      "Select a published programme or explore catalogue courses. Each enrollment keeps its own journey.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0628\u0631\u0646\u0627\u0645\u062C\u0627\u064B \u0645\u0646\u0634\u0648\u0631\u0627\u064B \u0623\u0648 \u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062F\u0648\u0631\u0627\u062A\u060C \u0645\u0639 \u0645\u0633\u0627\u0631 \u062A\u0633\u062C\u064A\u0644 \u062E\u0627\u0635 \u0628\u0643\u0644 \u0639\u0631\u0636."
    ),
    topics: [
      topic(
        w("Petite enfance", "Early childhood", "\u0627\u0644\u0637\u0641\u0648\u0644\u0629 \u0627\u0644\u0645\u0628\u0643\u0631\u0629"),
        w(
          "Les gestes et connaissances du quotidien.",
          "Everyday knowledge and practical skills.",
          "\u0627\u0644\u0645\u0639\u0627\u0631\u0641 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629."
        ),
        "enfance",
        "care"
      ),
      topic(
        w(
          "P\xE9dagogie & Montessori",
          "Teaching & Montessori",
          "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0648\u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"
        ),
        w(
          "Donner une intention \xE0 chaque activit\xE9.",
          "Bring purpose to every activity.",
          "\u0645\u0646\u062D \u0647\u062F\u0641 \u0644\u0643\u0644 \u0646\u0634\u0627\u0637."
        ),
        "montessori",
        "montessori"
      ),
      topic(
        w("Parcours professionnels", "Professional pathways", "\u0645\u0633\u0627\u0631\u0627\u062A \u0645\u0647\u0646\u064A\u0629"),
        w(
          "Choisir une progression adapt\xE9e \xE0 votre projet.",
          "Choose progress that fits your project.",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u062A\u0642\u062F\u0645 \u064A\u0646\u0627\u0633\u0628 \u0645\u0634\u0631\u0648\u0639\u0643\u0645."
        ),
        "profession",
        "professional"
      ),
      topic(
        w("Formation des \xE9quipes", "Team training", "\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0641\u0631\u0642"),
        w(
          "Des besoins partag\xE9s, un parcours \xE0 \xE9tudier.",
          "Shared needs, a pathway to discuss.",
          "\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0645\u0634\u062A\u0631\u0643\u0629 \u0648\u0645\u0633\u0627\u0631 \u0644\u0644\u062F\u0631\u0627\u0633\u0629."
        ),
        "formation",
        "school"
      )
    ],
    chapters: [
      chapter(
        w(
          "Passez de l\u2019envie \xE0 l\u2019action",
          "Turn ambition into action",
          "\u0645\u0646 \u0627\u0644\u0637\u0645\u0648\u062D \u0625\u0644\u0649 \u0627\u0644\u0639\u0645\u0644"
        ),
        w(
          "Objectif, public vis\xE9, contenu, modalit\xE9 : prenez le temps de comparer avant l\u2019inscription.",
          "Compare goals, audience, content and delivery before enrolling.",
          "\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u062C\u0645\u0647\u0648\u0631 \u0648\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0646\u0645\u0637 \u0642\u0628\u0644 \u0627\u0644\u062A\u0633\u062C\u064A\u0644."
        ),
        "academy"
      ),
      chapter(
        w(
          "Apprendre au plus pr\xE8s du terrain",
          "Learn close to real practice",
          "\u062A\u0639\u0644\u0645 \u0642\u0631\u064A\u0628 \u0645\u0646 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"
        ),
        w(
          "Consultez les objectifs et comp\xE9tences d\xE9clar\xE9s dans chaque programme publi\xE9.",
          "Check the objectives and skills declared in each published programme.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0646\u0629 \u0641\u064A \u0643\u0644 \u0628\u0631\u0646\u0627\u0645\u062C \u0645\u0646\u0634\u0648\u0631."
        ),
        "professional"
      ),
      chapter(
        w(
          "Une \xE9quipe, un projet de progression",
          "One team, a shared learning project",
          "\u0641\u0631\u064A\u0642 \u0648\u0627\u062D\u062F \u0648\u0645\u0634\u0631\u0648\u0639 \u062A\u0639\u0644\u0645 \u0645\u0634\u062A\u0631\u0643"
        ),
        w(
          "Pour une organisation, d\xE9marrez une demande Academy afin d\u2019\xE9tudier les besoins de votre \xE9quipe.",
          "Start an Academy request to discuss your organisation\u2019s training needs.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0637\u0644\u0628\u0627\u064B \u0644\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u062A\u062F\u0631\u064A\u0628 \u0641\u0631\u064A\u0642\u0643\u0645."
        ),
        "school"
      )
    ],
    steps: [
      w("D\xE9finir son objectif", "Set a goal", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0647\u062F\u0641"),
      w("Comparer les parcours", "Compare pathways", "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A"),
      w("V\xE9rifier les conditions", "Check conditions", "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0634\u0631\u0648\u0637"),
      w("D\xE9marrer son inscription", "Start enrollment", "\u0628\u062F\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644")
    ],
    primary: "academy/request",
    primaryLabel: w(
      "Construire mon parcours",
      "Build my pathway",
      "\u0628\u0646\u0627\u0621 \u0645\u0633\u0627\u0631\u064A"
    ),
    related: ["professionals", "establishments", "development"]
  },
  establishments: {
    key: "establishments",
    label: w("\xC9tablissements", "Establishments", "\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A"),
    eyebrow: w(
      "VOTRE \xC9TABLISSEMENT, UN NOUVEL HORIZON",
      "A NEW HORIZON FOR YOUR ESTABLISHMENT",
      "\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629 \u0644\u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    title: w(
      "Faites grandir votre \xE9tablissement. \xC0 tous les niveaux.",
      "Help your establishment grow. At every level.",
      "\u0627\u0631\u062A\u0642\u0648\u0627 \u0628\u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A."
    ),
    lead: w(
      "Cr\xE8ches, \xE9coles et structures d\u2019accueil : reliez vos priorit\xE9s \xE0 des programmes, des comp\xE9tences et des outils pour pr\xE9parer une transformation coh\xE9rente.",
      "Connect your nursery or school priorities to programmes, skills and tools for a coherent transformation.",
      "\u0627\u0631\u0628\u0637\u0648\u0627 \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u062D\u0636\u0627\u0646\u062A\u0643\u0645 \u0623\u0648 \u0645\u062F\u0631\u0633\u062A\u0643\u0645 \u0628\u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0644\u0625\u0639\u062F\u0627\u062F \u062A\u062D\u0648\u0644 \u0645\u062A\u0643\u0627\u0645\u0644."
    ),
    photo: "preschool",
    secondaryPhoto: "school",
    color: "#008ba4",
    companion: "#7539d9",
    signature: w(
      "Votre carte de transformation",
      "Your transformation map",
      "\u062E\u0631\u064A\u0637\u0629 \u062A\u062D\u0648\u0644 \u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    signatureLead: w(
      "Choisissez vos priorit\xE9s. Pr\xE9parez un r\xE9sum\xE9 \xE0 partager au d\xE9marrage du diagnostic.",
      "Choose priorities and prepare a summary to share when starting your assessment.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0648\u0623\u0639\u062F\u0648\u0627 \u0645\u0644\u062E\u0635\u0627\u064B \u0644\u0645\u0634\u0627\u0631\u0643\u062A\u0647 \u0639\u0646\u062F \u0628\u062F\u0621 \u0627\u0644\u062A\u0634\u062E\u064A\u0635."
    ),
    topics: [
      topic(
        w("Programmes \xE9ducatifs", "Educational programmes", "\u0628\u0631\u0627\u0645\u062C \u062A\u0631\u0628\u0648\u064A\u0629"),
        w(
          "Une exp\xE9rience enfant avec une intention claire.",
          "Child experiences with a clear purpose.",
          "\u062A\u062C\u0627\u0631\u0628 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0630\u0627\u062A \u0647\u062F\u0641 \u0648\u0627\u0636\u062D."
        ),
        "programme",
        "preschool"
      ),
      topic(
        w("Renfort & comp\xE9tences", "Staffing & skills", "\u062F\u0639\u0645 \u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w(
          "Aligner les besoins de l\u2019\xE9quipe et les parcours.",
          "Align team needs and learning pathways.",
          "\u0645\u0648\u0627\u0621\u0645\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic(
        w("Qualit\xE9 & diagnostic", "Quality & assessment", "\u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635"),
        w(
          "Identifier les priorit\xE9s avant d\u2019agir.",
          "Identify priorities before taking action.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0639\u0645\u0644."
        ),
        "diagnostic",
        "support"
      ),
      topic(
        w("Organisation & outils", "Operations & tools", "\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u062A"),
        w(
          "Explorer un syst\xE8me au service de votre quotidien.",
          "Explore a system for everyday operations.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0646\u0638\u0627\u0645 \u064A\u062E\u062F\u0645 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u064A\u0648\u0645\u064A."
        ),
        "organisation",
        "desk"
      )
    ],
    chapters: [
      chapter(
        w(
          "Un projet \xE0 votre \xE9chelle",
          "A project at your scale",
          "\u0645\u0634\u0631\u0648\u0639 \u064A\u0646\u0627\u0633\u0628 \u062D\u062C\u0645\u0643\u0645"
        ),
        w(
          "Commencez par votre contexte : type de structure, territoire, \xE9quipe et priorit\xE9s.",
          "Start with your context: organisation, territory, team and priorities.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0627\u0644\u0633\u064A\u0627\u0642: \u0646\u0648\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A."
        ),
        "preschool"
      ),
      chapter(
        w(
          "Connecter les bonnes expertises",
          "Connect the right expertise",
          "\u0631\u0628\u0637 \u0627\u0644\u062E\u0628\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w(
          "Academy, Quality Check et Partner OS ouvrent des parcours compl\xE9mentaires.",
          "Academy, Quality Check and Partner OS offer complementary pathways.",
          "\u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0648\u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u062A\u0648\u0641\u0631 \u0645\u0633\u0627\u0631\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629."
        ),
        "school"
      ),
      chapter(
        w(
          "Pr\xE9parer la mise en \u0153uvre",
          "Prepare implementation",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630"
        ),
        w(
          "Le diagnostic est le point de d\xE9part pour pr\xE9ciser le p\xE9rim\xE8tre et les conditions du projet.",
          "Assessment is the starting point for clarifying project scope and terms.",
          "\u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0628\u062F\u0627\u064A\u0629 \u0644\u062A\u062D\u062F\u064A\u062F \u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u0634\u0631\u0648\u0637\u0647."
        ),
        "desk"
      )
    ],
    steps: [
      w("Vos priorit\xE9s", "Your priorities", "\u0623\u0648\u0644\u0648\u064A\u0627\u062A\u0643\u0645"),
      w("Le diagnostic", "The assessment", "\u0627\u0644\u062A\u0634\u062E\u064A\u0635"),
      w("Le p\xE9rim\xE8tre convenu", "The agreed scope", "\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647"),
      w("La mise en \u0153uvre", "Implementation", "\u0627\u0644\u062A\u0646\u0641\u064A\u0630")
    ],
    primary: "establishments/diagnostic",
    primaryLabel: w(
      "D\xE9marrer mon diagnostic",
      "Start my assessment",
      "\u0628\u062F\u0621 \u062A\u0634\u062E\u064A\u0635 \u0645\u0624\u0633\u0633\u062A\u064A"
    ),
    related: ["academy", "quality-check", "partner-os"]
  },
  hospitality: {
    key: "hospitality",
    label: w("Hospitality", "Hospitality", "\u0627\u0644\u0636\u064A\u0627\u0641\u0629"),
    eyebrow: w(
      "L\u2019EXP\xC9RIENCE FAMILLE, VOTRE SIGNATURE",
      "FAMILY EXPERIENCE, YOUR SIGNATURE",
      "\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0628\u0635\u0645\u062A\u0643\u0645"
    ),
    title: w(
      "Les enfants s\u2019\xE9merveillent. Les familles se souviennent.",
      "Children discover. Families remember.",
      "\u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u064A\u0643\u062A\u0634\u0641\u0648\u0646 \u0648\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u062A\u062A\u0630\u0643\u0631."
    ),
    lead: w(
      "Kids clubs, garde des enfants des clients et conciergerie famille. Imaginez une exp\xE9rience qui prolonge le plaisir du s\xE9jour, puis \xE9tudiez sa mise en place.",
      "Kids clubs, guest childcare and family concierge. Shape an experience that enriches the stay, then discuss implementation.",
      "\u0646\u0648\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641 \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u064A: \u0635\u0645\u0645\u0648\u0627 \u062A\u062C\u0631\u0628\u0629 \u062A\u062B\u0631\u064A \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u062B\u0645 \u0627\u062F\u0631\u0633\u0648\u0627 \u062A\u0646\u0641\u064A\u0630\u0647\u0627."
    ),
    photo: "hospitality",
    secondaryPhoto: "holidays",
    color: "#d06b06",
    companion: "#f42d78",
    signature: w(
      "Votre s\xE9jour famille, sc\xE8ne par sc\xE8ne",
      "Your family stay, scene by scene",
      "\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0645\u0634\u0647\u062F\u0627\u064B \u0628\u0645\u0634\u0647\u062F"
    ),
    signatureLead: w(
      "Explorez les moments d\u2019un s\xE9jour et les parcours correspondants de votre \xE9tablissement.",
      "Explore moments in a stay and your property\u2019s corresponding pathways.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0645\u0646\u0634\u0623\u062A\u0643\u0645."
    ),
    topics: [
      topic(
        w("Kids club", "Kids club", "\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644"),
        w(
          "Un espace pour explorer et cr\xE9er.",
          "A space to explore and create.",
          "\u0645\u0633\u0627\u062D\u0629 \u0644\u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0648\u0627\u0644\u0625\u0628\u062F\u0627\u0639."
        ),
        "kids",
        "games"
      ),
      topic(
        w("Guest childcare", "Guest childcare", "\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641"),
        w(
          "\xC9tudier une garde adapt\xE9e aux clients.",
          "Discuss childcare tailored to guests.",
          "\u062F\u0631\u0627\u0633\u0629 \u0631\u0639\u0627\u064A\u0629 \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u0636\u064A\u0648\u0641."
        ),
        "garde",
        "care"
      ),
      topic(
        w("Conciergerie famille", "Family concierge", "\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A"),
        w(
          "Accompagner la d\xE9couverte du s\xE9jour.",
          "Guide the family\u2019s stay.",
          "\u062A\u0648\u062C\u064A\u0647 \u062A\u062C\u0631\u0628\u0629 \u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629."
        ),
        "famille",
        "family"
      ),
      topic(
        w("Programmes saisonniers", "Seasonal programmes", "\u0628\u0631\u0627\u0645\u062C \u0645\u0648\u0633\u0645\u064A\u0629"),
        w(
          "Pr\xE9parer la prochaine saison ensemble.",
          "Prepare the next season together.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u0642\u0627\u062F\u0645 \u0645\u0639\u0627\u064B."
        ),
        "saison",
        "holidays"
      )
    ],
    chapters: [
      chapter(
        w(
          "Du check-in aux souvenirs",
          "From check-in to memories",
          "\u0645\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0630\u0643\u0631\u064A\u0627\u062A"
        ),
        w(
          "Dessinez le parcours famille selon votre propri\xE9t\xE9, vos espaces et vos publics.",
          "Shape the family journey around your property, spaces and guests.",
          "\u0635\u0645\u0645\u0648\u0627 \u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u062D\u0633\u0628 \u0645\u0646\u0634\u0623\u062A\u0643\u0645 \u0648\u0645\u0633\u0627\u062D\u0627\u062A\u0647\u0627 \u0648\u0636\u064A\u0648\u0641\u0647\u0627."
        ),
        "hospitality"
      ),
      chapter(
        w(
          "Une saison qui se pr\xE9pare",
          "Prepare for the next season",
          "\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0644\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u0642\u0627\u062F\u0645"
        ),
        w(
          "Activit\xE9s, capacit\xE9, horaires et langues se pr\xE9cisent dans l\u2019\xE9tude de votre programme.",
          "Activities, capacity, hours and languages are defined in your programme study.",
          "\u062A\u062D\u062F\u062F \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0633\u0639\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u0644\u063A\u0627\u062A \u062E\u0644\u0627\u0644 \u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        "holidays"
      ),
      chapter(
        w(
          "Le temps de profiter",
          "Time to enjoy the stay",
          "\u0648\u0642\u062A \u0644\u0644\u0627\u0633\u062A\u0645\u062A\u0627\u0639 \u0628\u0627\u0644\u0625\u0642\u0627\u0645\u0629"
        ),
        w(
          "D\xE9couvrez les parcours garde clients, kids club et conciergerie sans m\xE9langer leurs conditions.",
          "Explore guest childcare, kids club and concierge with their distinct conditions.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0648\u0627\u0644\u0646\u0627\u062F\u064A \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0645\u0639 \u0634\u0631\u0648\u0637 \u0643\u0644 \u0645\u0633\u0627\u0631."
        ),
        "family"
      )
    ],
    steps: [
      w("Votre propri\xE9t\xE9", "Your property", "\u0645\u0646\u0634\u0623\u062A\u0643\u0645"),
      w("Les moments famille", "Family moments", "\u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0639\u0627\u0626\u0644\u0629"),
      w("L\u2019\xE9tude de programme", "Programme study", "\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C"),
      w("Le d\xE9ploiement convenu", "Agreed deployment", "\u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "hospitality/request",
    primaryLabel: w(
      "Imaginer mon programme",
      "Shape my programme",
      "\u062A\u0635\u0645\u064A\u0645 \u0628\u0631\u0646\u0627\u0645\u062C\u064A"
    ),
    related: ["home-services", "academy", "quality-check"]
  },
  "health-partners": {
    key: "health-partners",
    label: w("Partenaires sant\xE9", "Health Partners", "\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0635\u062D\u0629"),
    eyebrow: w(
      "PLUS DE PR\xC9SENCE POUR LES FAMILLES",
      "MORE SUPPORT FOR FAMILIES",
      "\u062F\u0639\u0645 \u0623\u0643\u0628\u0631 \u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A"
    ),
    title: w(
      "Entourer les familles. Avec attention et clart\xE9.",
      "Support families. With care and clarity.",
      "\u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0628\u0627\u0647\u062A\u0645\u0627\u0645 \u0648\u0648\u0636\u0648\u062D."
    ),
    lead: w(
      "Maternit\xE9s et partenaires : explorez des programmes de soutien familial non m\xE9dical, des ateliers et un accompagnement du quotidien avec un cadre explicite.",
      "Explore non-medical family support programmes, workshops and everyday assistance with clear service boundaries.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0628\u0631\u0627\u0645\u062C \u062F\u0639\u0645 \u0623\u0633\u0631\u064A \u063A\u064A\u0631 \u0637\u0628\u064A \u0648\u0648\u0631\u0634\u0627\u062A \u0648\u0645\u0633\u0627\u0639\u062F\u0629 \u064A\u0648\u0645\u064A\u0629 \u0636\u0645\u0646 \u0625\u0637\u0627\u0631 \u062E\u062F\u0645\u0629 \u0648\u0627\u0636\u062D."
    ),
    photo: "health",
    secondaryPhoto: "newborn",
    color: "#00886d",
    companion: "#f42d78",
    signature: w(
      "Le parcours d\u2019accompagnement familial",
      "The family-support pathway",
      "\u0645\u0633\u0627\u0631 \u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0629"
    ),
    signatureLead: w(
      "Pr\xE9parer, accueillir, accompagner : explorez les besoins puis le p\xE9rim\xE8tre du programme.",
      "Prepare, welcome and support: explore needs and the programme scope.",
      "\u0625\u0639\u062F\u0627\u062F \u0648\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u062F\u0639\u0645: \u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0648\u0646\u0637\u0627\u0642 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
    ),
    topics: [
      topic(
        w("Mother & Baby Care", "Mother & Baby Care", "\u062F\u0639\u0645 \u0627\u0644\u0623\u0645 \u0648\u0627\u0644\u0637\u0641\u0644"),
        w(
          "Pr\xE9sence et soutien quotidien non m\xE9dical.",
          "Everyday presence and non-medical support.",
          "\u062D\u0636\u0648\u0631 \u0648\u062F\u0639\u0645 \u064A\u0648\u0645\u064A \u063A\u064A\u0631 \u0637\u0628\u064A."
        ),
        "baby",
        "newborn"
      ),
      topic(
        w("Soutien parental", "Parent support", "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646"),
        w(
          "\xC9couter et orienter avec clart\xE9.",
          "Listen and guide with clarity.",
          "\u0627\u0644\u0627\u0633\u062A\u0645\u0627\u0639 \u0648\u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u0628\u0648\u0636\u0648\u062D."
        ),
        "parent",
        "family"
      ),
      topic(
        w("Ateliers familles", "Family workshops", "\u0648\u0631\u0634\u0627\u062A \u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A"),
        w(
          "Des moments d\u2019information et de d\xE9couverte.",
          "Moments of information and discovery.",
          "\u0644\u062D\u0638\u0627\u062A \u0644\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641."
        ),
        "atelier",
        "academy"
      ),
      topic(
        w("Programmes partenaires", "Partner programmes", "\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0634\u0631\u0643\u0627\u0621"),
        w(
          "Un cadre \xE0 \xE9tudier avec votre structure.",
          "A scope to discuss with your organisation.",
          "\u0646\u0637\u0627\u0642 \u0644\u0644\u062F\u0631\u0627\u0633\u0629 \u0645\u0639 \u0645\u0624\u0633\u0633\u062A\u0643\u0645."
        ),
        "programme",
        "support"
      )
    ],
    chapters: [
      chapter(
        w("Une pr\xE9sence qui compte", "Support that matters", "\u062F\u0639\u0645 \u0644\u0647 \u0642\u064A\u0645\u0629"),
        w(
          "L\u2019accompagnement propos\xE9 concerne le quotidien familial et reste strictement non m\xE9dical.",
          "Support concerns family life and remains strictly non-medical.",
          "\u0627\u0644\u062F\u0639\u0645 \u064A\u062E\u0635 \u0627\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u0623\u0633\u0631\u064A\u0629 \u0648\u064A\u0628\u0642\u0649 \u063A\u064A\u0631 \u0637\u0628\u064A."
        ),
        "health"
      ),
      chapter(
        w(
          "Des limites expliqu\xE9es",
          "Clear service boundaries",
          "\u062D\u062F\u0648\u062F \u062E\u062F\u0645\u0629 \u0648\u0627\u0636\u062D\u0629"
        ),
        w(
          "Consentement, confidentialit\xE9 et p\xE9rim\xE8tre de service se v\xE9rifient avant l\u2019engagement.",
          "Consent, privacy and scope are checked before engagement.",
          "\u062A\u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645."
        ),
        "newborn"
      ),
      chapter(
        w(
          "Relier les besoins aux bons parcours",
          "Connect needs to the right pathways",
          "\u0631\u0628\u0637 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0628\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w(
          "Les familles et les structures ont des demandes diff\xE9rentes : choisissez le parcours qui vous correspond.",
          "Families and organisations have different needs: choose your appropriate pathway.",
          "\u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629: \u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
        ),
        "family"
      )
    ],
    steps: [
      w("Le besoin familial", "Family need", "\u0627\u062D\u062A\u064A\u0627\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u0629"),
      w("Le consentement", "Consent", "\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629"),
      w("Le p\xE9rim\xE8tre non m\xE9dical", "Non-medical scope", "\u0627\u0644\u0646\u0637\u0627\u0642 \u063A\u064A\u0631 \u0627\u0644\u0637\u0628\u064A"),
      w("Le programme convenu", "Agreed programme", "\u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "health-partners/request",
    primaryLabel: w(
      "\xC9tudier mon programme",
      "Discuss my programme",
      "\u062F\u0631\u0627\u0633\u0629 \u0628\u0631\u0646\u0627\u0645\u062C\u064A"
    ),
    related: ["home-services", "families", "academy"]
  },
  corporates: {
    key: "corporates",
    label: w("Entreprises", "Corporate", "\u0627\u0644\u0634\u0631\u0643\u0627\u062A"),
    eyebrow: w(
      "PRENDRE SOIN DES FAMILLES, SOUTENIR LES \xC9QUIPES",
      "SUPPORT FAMILIES, SUPPORT YOUR PEOPLE",
      "\u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0648\u062F\u0639\u0645 \u0627\u0644\u0641\u0631\u0642"
    ),
    title: w(
      "Un avantage employeur qui entre dans la vraie vie.",
      "An employee benefit that fits real life.",
      "\u0645\u064A\u0632\u0629 \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u062A\u0644\u0627\u0626\u0645 \u062D\u064A\u0627\u062A\u0647\u0645 \u0627\u0644\u0641\u0639\u0644\u064A\u0629."
    ),
    lead: w(
      "Soutien parental, garde de secours, family days et programmes collaborateurs. Pr\xE9parez une exp\xE9rience famille \xE0 la hauteur de votre culture d\u2019entreprise.",
      "Parent support, backup childcare, family days and employee programmes. Prepare a family experience that reflects your company culture.",
      "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646 \u0648\u0631\u0639\u0627\u064A\u0629 \u0628\u062F\u064A\u0644\u0629 \u0648\u0623\u064A\u0627\u0645 \u0639\u0627\u0626\u0644\u064A\u0629 \u0648\u0628\u0631\u0627\u0645\u062C \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u062A\u0646\u0627\u0633\u0628 \u062B\u0642\u0627\u0641\u0629 \u0634\u0631\u0643\u062A\u0643\u0645."
    ),
    photo: "corporate",
    secondaryPhoto: "family",
    color: "#0873d9",
    companion: "#f42d78",
    signature: w(
      "Le designer d\u2019avantages familles",
      "The family-benefits designer",
      "\u0645\u0635\u0645\u0645 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0623\u0633\u0631\u064A\u0629"
    ),
    signatureLead: w(
      "Composez vos priorit\xE9s RH. Votre s\xE9lection pr\xE9pare la discussion ; aucun budget ni quota n\u2019est cr\xE9\xE9 ici.",
      "Choose HR priorities to prepare a discussion. This does not create a budget or entitlement.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629 \u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0646\u0642\u0627\u0634 \u062F\u0648\u0646 \u0625\u0646\u0634\u0627\u0621 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0623\u0648 \u0627\u0633\u062A\u062D\u0642\u0627\u0642."
    ),
    topics: [
      topic(
        w("Garde de secours", "Backup childcare", "\u0631\u0639\u0627\u064A\u0629 \u0628\u062F\u064A\u0644\u0629"),
        w(
          "\xC9tudier les impr\xE9vus de la vie familiale.",
          "Plan for unexpected family needs.",
          "\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0645\u0641\u0627\u062C\u0626\u0629."
        ),
        "garde",
        "care"
      ),
      topic(
        w("Parentalit\xE9", "Parent support", "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646"),
        w(
          "Accompagner les moments qui comptent.",
          "Support the moments that matter.",
          "\u062F\u0639\u0645 \u0627\u0644\u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0645\u0647\u0645\u0629."
        ),
        "parent",
        "newborn"
      ),
      topic(
        w("Family days", "Family days", "\u0623\u064A\u0627\u0645 \u0639\u0627\u0626\u0644\u064A\u0629"),
        w(
          "Partager un autre moment avec les \xE9quipes.",
          "Share a different moment with your teams.",
          "\u0645\u0634\u0627\u0631\u0643\u0629 \u0644\u062D\u0638\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629 \u0645\u0639 \u0627\u0644\u0641\u0631\u0642."
        ),
        "famille",
        "family"
      ),
      topic(
        w("Programme collaborateurs", "Employee programme", "\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646"),
        w(
          "\xC9ligibilit\xE9 et contribution \xE0 pr\xE9ciser ensemble.",
          "Define eligibility and contributions together.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0645\u0639\u0627\u064B."
        ),
        "programme",
        "corporate"
      )
    ],
    chapters: [
      chapter(
        w(
          "Une politique RH plus proche du quotidien",
          "HR policy closer to everyday life",
          "\u0633\u064A\u0627\u0633\u0629 \u0645\u0648\u0627\u0631\u062F \u0628\u0634\u0631\u064A\u0629 \u0623\u0642\u0631\u0628 \u0644\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629"
        ),
        w(
          "Commencez par vos populations et leurs besoins, puis d\xE9finissez le cadre du programme.",
          "Start with your people and their needs, then define the programme scope.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0648\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A\u0647\u0645 \u062B\u0645 \u062D\u062F\u062F\u0648\u0627 \u0625\u0637\u0627\u0631 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        "corporate"
      ),
      chapter(
        w(
          "Un cadre lisible pour les collaborateurs",
          "Clear terms for employees",
          "\u0634\u0631\u0648\u0637 \u0648\u0627\u0636\u062D\u0629 \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646"
        ),
        w(
          "\xC9ligibilit\xE9, contribution et modalit\xE9s d\u2019acc\xE8s doivent \xEAtre convenues avant l\u2019activation.",
          "Eligibility, contributions and access terms are agreed before activation.",
          "\u062A\u062A\u0641\u0642 \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0627\u062A \u0648\u0634\u0631\u0648\u0637 \u0627\u0644\u0648\u0635\u0648\u0644 \u0642\u0628\u0644 \u0627\u0644\u062A\u0641\u0639\u064A\u0644."
        ),
        "family"
      ),
      chapter(
        w(
          "Connecter les bonnes solutions",
          "Connect the right solutions",
          "\u0631\u0628\u0637 \u0627\u0644\u062D\u0644\u0648\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w(
          "D\xE9couvrez les offres de ce catalogue et pr\xE9parez une demande adapt\xE9e \xE0 votre entreprise.",
          "Explore this catalogue and prepare a request for your company.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0623\u0639\u062F\u0648\u0627 \u0637\u0644\u0628\u0627\u064B \u064A\u0646\u0627\u0633\u0628 \u0634\u0631\u0643\u062A\u0643\u0645."
        ),
        "desk"
      )
    ],
    steps: [
      w("Les populations concern\xE9es", "Eligible populations", "\u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u0639\u0646\u064A\u0629"),
      w(
        "Les besoins prioritaires",
        "Priority needs",
        "\u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0630\u0627\u062A \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629"
      ),
      w("Les r\xE8gles convenues", "Agreed rules", "\u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627"),
      w("L\u2019activation du programme", "Programme activation", "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C")
    ],
    primary: "corporates/request",
    primaryLabel: w(
      "Cr\xE9er mon projet familles",
      "Start my family-benefits project",
      "\u0628\u062F\u0621 \u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0623\u0633\u0631\u064A\u0629"
    ),
    related: ["home-services", "partner-os", "hospitality"]
  },
  "partner-os": {
    key: "partner-os",
    label: w("Partner OS", "Partner OS", "Partner OS"),
    eyebrow: w(
      "VOTRE ORGANISATION, MIEUX CONNECT\xC9E",
      "YOUR ORGANISATION, BETTER CONNECTED",
      "\u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0623\u0643\u062B\u0631 \u062A\u0631\u0627\u0628\u0637\u0627\u064B"
    ),
    title: w(
      "Une nouvelle perspective sur votre quotidien.",
      "A new perspective on everyday operations.",
      "\u0645\u0646\u0638\u0648\u0631 \u062C\u062F\u064A\u062F \u0644\u0644\u0639\u0645\u0644 \u0627\u0644\u064A\u0648\u0645\u064A."
    ),
    lead: w(
      "Explorez les plans publi\xE9s, les modules d\xE9clar\xE9s et les parcours d\u2019activation. Trouvez le cadre qui correspond \xE0 votre organisation, sans perdre la ma\xEEtrise des conditions.",
      "Explore published plans, declared modules and activation pathways. Find the right fit while keeping terms clear.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062E\u0637\u0637 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0646\u0629 \u0648\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
    ),
    photo: "desk",
    secondaryPhoto: "school",
    color: "#087da7",
    companion: "#7539d9",
    signature: w(
      "L\u2019explorateur de plans Partner OS",
      "The Partner OS plan explorer",
      "\u0645\u0633\u062A\u0643\u0634\u0641 \u062E\u0637\u0637 Partner OS"
    ),
    signatureLead: w(
      "Comparez les prix et p\xE9riodes r\xE9ellement publi\xE9s. Une d\xE9monstration pr\xE9pare votre configuration.",
      "Compare actual published prices and billing periods. A demonstration helps prepare your configuration.",
      "\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0641\u062A\u0631\u0627\u062A \u0627\u0644\u0641\u0648\u062A\u0631\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629. \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A \u064A\u0633\u0627\u0639\u062F \u0641\u064A \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0647\u064A\u0626\u0629."
    ),
    topics: [
      topic(
        w("Organisation", "Organisation", "\u0627\u0644\u062A\u0646\u0638\u064A\u0645"),
        w(
          "Explorer la structure des plans.",
          "Explore how plans are structured.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0628\u0646\u064A\u0629 \u0627\u0644\u062E\u0637\u0637."
        ),
        "organisation",
        "desk"
      ),
      topic(
        w("\xC9quipes", "Teams", "\u0627\u0644\u0641\u0631\u0642"),
        w(
          "\xC9tudier les besoins de vos collaborateurs.",
          "Discuss your team\u2019s needs.",
          "\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0641\u0631\u064A\u0642\u0643\u0645."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic(
        w("Modules", "Modules", "\u0627\u0644\u0648\u062D\u062F\u0627\u062A"),
        w(
          "V\xE9rifier ce qui est inclus dans l\u2019offre.",
          "Check what an offer includes.",
          "\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0627 \u064A\u062A\u0636\u0645\u0646\u0647 \u0627\u0644\u0639\u0631\u0636."
        ),
        "module",
        "digital"
      ),
      topic(
        w("Activation", "Activation", "\u0627\u0644\u062A\u0641\u0639\u064A\u0644"),
        w(
          "Pr\xE9parer votre parcours avec l\u2019\xE9quipe.",
          "Prepare your journey with the team.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0633\u0627\u0631 \u0645\u0639 \u0627\u0644\u0641\u0631\u064A\u0642."
        ),
        "plan",
        "school"
      )
    ],
    chapters: [
      chapter(
        w(
          "Voir clair avant d\u2019activer",
          "Get clarity before activation",
          "\u0648\u0636\u0648\u062D \u0642\u0628\u0644 \u0627\u0644\u062A\u0641\u0639\u064A\u0644"
        ),
        w(
          "Consultez les modules, les limites et les conditions propres au plan publi\xE9.",
          "Check the modules, limits and terms of the published plan.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0627\u0644\u062D\u062F\u0648\u062F \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629."
        ),
        "desk"
      ),
      chapter(
        w(
          "Comparer sans extrapoler",
          "Compare actual terms",
          "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u0641\u0639\u0644\u064A\u0629"
        ),
        w(
          "Un prix mensuel et un prix annuel restent deux conditions distinctes. Aucun tarif annuel n\u2019est calcul\xE9 ici.",
          "Monthly and annual prices are separate terms. No annual price is calculated here.",
          "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0634\u0647\u0631\u064A \u0648\u0627\u0644\u0633\u0646\u0648\u064A \u0634\u0631\u0637\u0627\u0646 \u0645\u062E\u062A\u0644\u0641\u0627\u0646 \u0648\u0644\u0627 \u064A\u062D\u0633\u0628 \u0633\u0639\u0631 \u0633\u0646\u0648\u064A \u0647\u0646\u0627."
        ),
        "digital"
      ),
      chapter(
        w(
          "Une d\xE9monstration \xE0 votre contexte",
          "A demonstration for your context",
          "\u0639\u0631\u0636 \u062A\u0648\u0636\u064A\u062D\u064A \u064A\u0646\u0627\u0633\u0628 \u0633\u064A\u0627\u0642\u0643\u0645"
        ),
        w(
          "Pr\xE9parez vos questions puis d\xE9marrez la demande de d\xE9monstration existante.",
          "Prepare your questions and start the demonstration request.",
          "\u0623\u0639\u062F\u0648\u0627 \u0623\u0633\u0626\u0644\u062A\u0643\u0645 \u0648\u0627\u0628\u062F\u0624\u0648\u0627 \u0637\u0644\u0628 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A."
        ),
        "school"
      )
    ],
    steps: [
      w("Votre organisation", "Your organisation", "\u0645\u0624\u0633\u0633\u062A\u0643\u0645"),
      w("Le plan adapt\xE9", "The suitable plan", "\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"),
      w("La d\xE9monstration", "The demonstration", "\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A"),
      w("L\u2019activation convenue", "Agreed activation", "\u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "partner-os/contact",
    primaryLabel: w(
      "Demander une d\xE9monstration",
      "Request a demonstration",
      "\u0637\u0644\u0628 \u0639\u0631\u0636 \u062A\u0648\u0636\u064A\u062D\u064A"
    ),
    related: ["establishments", "quality-check", "corporates"]
  },
  "quality-check": {
    key: "quality-check",
    label: w("Quality Check 360", "Quality Check 360", "Quality Check 360"),
    eyebrow: w(
      "FAIRE DE LA QUALIT\xC9 UNE DIRECTION",
      "MAKE QUALITY YOUR DIRECTION",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u062C\u0647\u062A\u0643\u0645"
    ),
    title: w(
      "Voir plus clair. D\xE9cider mieux. Avancer.",
      "See clearly. Decide better. Move forward.",
      "\u0631\u0624\u064A\u0629 \u0623\u0648\u0636\u062D \u0648\u0642\u0631\u0627\u0631\u0627\u062A \u0623\u0641\u0636\u0644 \u0648\u062A\u0642\u062F\u0645."
    ),
    lead: w(
      "\xC9valuations, r\xE9f\xE9rentiels et accompagnement de la qualit\xE9. Explorez le p\xE9rim\xE8tre d\u2019une \xE9valuation et pr\xE9parez les questions qui comptent pour votre organisation.",
      "Explore assessments, frameworks and quality support. Define an assessment scope and prepare the questions that matter.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0637\u0631 \u0648\u062F\u0639\u0645 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u062D\u062F\u062F\u0648\u0627 \u0646\u0637\u0627\u0642 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0647\u0645\u0629."
    ),
    photo: "support",
    secondaryPhoto: "school",
    color: "#00876b",
    companion: "#0873d9",
    signature: w(
      "La boussole de votre \xE9valuation",
      "Your assessment compass",
      "\u0628\u0648\u0635\u0644\u0629 \u062A\u0642\u064A\u064A\u0645 \u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    signatureLead: w(
      "Choisissez les dimensions \xE0 discuter. Ce rep\xE9rage ne d\xE9livre aucun score ni certificat.",
      "Choose dimensions to discuss. This preparation does not issue a score or certificate.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629. \u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0644\u0627 \u064A\u0645\u0646\u062D \u0646\u062A\u064A\u062C\u0629 \u0623\u0648 \u0634\u0647\u0627\u062F\u0629."
    ),
    topics: [
      topic(
        w("Cadre & organisation", "Framework & operations", "\u0627\u0644\u0625\u0637\u0627\u0631 \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645"),
        w(
          "Rendre le p\xE9rim\xE8tre lisible.",
          "Make the scope clear.",
          "\u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0646\u0637\u0627\u0642."
        ),
        "organisation",
        "desk"
      ),
      topic(
        w("S\xE9curit\xE9 & pratiques", "Safety & practice", "\u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"),
        w(
          "Explorer les crit\xE8res de l\u2019\xE9valuation.",
          "Explore assessment criteria.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062A\u0642\u064A\u064A\u0645."
        ),
        "s\xE9curit\xE9",
        "support"
      ),
      topic(
        w("\xC9quipes & comp\xE9tences", "Teams & skills", "\u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w(
          "Identifier les sujets \xE0 approfondir.",
          "Identify topics to explore further.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0648\u0627\u0636\u064A\u0639 \u0644\u0644\u062A\u0639\u0645\u0642."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic(
        w("Am\xE9lioration", "Improvement", "\u0627\u0644\u062A\u062D\u0633\u064A\u0646"),
        w(
          "Pr\xE9parer des prochaines \xE9tapes discut\xE9es.",
          "Prepare the next steps to discuss.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629."
        ),
        "qualit\xE9",
        "school"
      )
    ],
    chapters: [
      chapter(
        w(
          "Commencer par les bonnes questions",
          "Start with the right questions",
          "\u0627\u0644\u0628\u062F\u0621 \u0628\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629"
        ),
        w(
          "Identifiez le contexte, les documents et les domaines utiles \xE0 votre demande.",
          "Identify the context, documents and areas relevant to your request.",
          "\u062D\u062F\u062F\u0648\u0627 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0648\u0627\u0644\u0645\u062C\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0637\u0644\u0628\u0643\u0645."
        ),
        "support"
      ),
      chapter(
        w(
          "Des preuves avant les conclusions",
          "Evidence before conclusions",
          "\u0627\u0644\u0623\u062F\u0644\u0629 \u0642\u0628\u0644 \u0627\u0644\u0627\u0633\u062A\u0646\u062A\u0627\u062C\u0627\u062A"
        ),
        w(
          "Les r\xE9sultats et scores appartiennent \xE0 une \xE9valuation r\xE9elle ; ce storefront pr\xE9sente les parcours disponibles.",
          "Results and scores come from real assessments; this page presents available pathways.",
          "\u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0645\u0646 \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0641\u0639\u0644\u064A\u0629 \u0648\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u062A\u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629."
        ),
        "school"
      ),
      chapter(
        w(
          "Lier qualit\xE9 et progression",
          "Connect quality and progress",
          "\u0631\u0628\u0637 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u0642\u062F\u0645"
        ),
        w(
          "Explorez Academy et Partner OS pour compl\xE9ter votre projet d\u2019am\xE9lioration.",
          "Explore Academy and Partner OS to complement your improvement project.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u0644\u062A\u0643\u0645\u0644\u0629 \u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u062A\u062D\u0633\u064A\u0646."
        ),
        "desk"
      )
    ],
    steps: [
      w("D\xE9finir le p\xE9rim\xE8tre", "Define scope", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0646\u0637\u0627\u0642"),
      w("Pr\xE9parer les preuves", "Prepare evidence", "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0623\u062F\u0644\u0629"),
      w("R\xE9aliser l\u2019\xE9valuation", "Conduct assessment", "\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u062A\u0642\u064A\u064A\u0645"),
      w(
        "\xC9tudier les prochaines actions",
        "Discuss next actions",
        "\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
      )
    ],
    primary: "establishments/quality-check-360",
    primaryLabel: w(
      "Explorer l\u2019\xE9valuation 360",
      "Explore the 360 assessment",
      "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u062A\u0642\u064A\u064A\u0645 360"
    ),
    related: ["establishments", "academy", "partner-os"]
  },
  professionals: {
    key: "professionals",
    label: w("Professionnels", "Professionals", "\u0627\u0644\u0645\u0647\u0646\u064A\u0648\u0646"),
    eyebrow: w(
      "VOTRE TALENT, UN NOUVEL HORIZON",
      "YOUR TALENT, A NEW HORIZON",
      "\u0645\u0648\u0647\u0628\u062A\u0643\u0645 \u0648\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629"
    ),
    title: w(
      "Faites de votre prochaine \xE9tape une vraie ambition.",
      "Make your next step a real ambition.",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0637\u0645\u0648\u062D\u0627\u064B \u062D\u0642\u064A\u0642\u064A\u0627\u064B."
    ),
    lead: w(
      "Formation, comp\xE9tences et parcours professionnels : explorez les offres publi\xE9es et pr\xE9parez un projet qui valorise votre engagement aupr\xE8s des enfants et des familles.",
      "Explore published training and professional pathways and prepare a project that values your commitment to children and families.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0623\u0639\u062F\u0648\u0627 \u0645\u0634\u0631\u0648\u0639\u0627\u064B \u064A\u062B\u0645\u0646 \u0627\u0644\u062A\u0632\u0627\u0645\u0643\u0645 \u062A\u062C\u0627\u0647 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A."
    ),
    photo: "professional",
    secondaryPhoto: "academy",
    color: "#7539d9",
    companion: "#f42d78",
    signature: w(
      "La carte de votre prochaine \xE9tape",
      "Your next-step map",
      "\u062E\u0631\u064A\u0637\u0629 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
    ),
    signatureLead: w(
      "Choisissez votre axe de progression. Les opportunit\xE9s et conditions restent celles des offres publi\xE9es.",
      "Choose a direction for growth. Opportunities and terms come from published offers.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u062A\u0642\u062F\u0645\u060C \u0645\u0639 \u0641\u0631\u0635 \u0648\u0634\u0631\u0648\u0637 \u062D\u0633\u0628 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629."
    ),
    topics: [
      topic(
        w("Accompagnement enfance", "Childcare practice", "\u062F\u0639\u0645 \u0627\u0644\u0637\u0641\u0648\u0644\u0629"),
        w(
          "Explorer les comp\xE9tences du terrain.",
          "Explore hands-on skills.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629."
        ),
        "enfance",
        "care"
      ),
      topic(
        w("P\xE9dagogie", "Education", "\u0627\u0644\u062A\u0631\u0628\u064A\u0629"),
        w(
          "Donner du sens aux activit\xE9s.",
          "Bring purpose to activities.",
          "\u0645\u0646\u062D \u0647\u062F\u0641 \u0644\u0644\u0623\u0646\u0634\u0637\u0629."
        ),
        "montessori",
        "montessori"
      ),
      topic(
        w("Formation & parcours", "Training & pathways", "\u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A"),
        w(
          "Pr\xE9parer votre prochaine comp\xE9tence.",
          "Prepare your next skill.",
          "\u0625\u0639\u062F\u0627\u062F \u0645\u0647\u0627\u0631\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
        ),
        "formation",
        "academy"
      ),
      topic(
        w("Projet professionnel", "Professional project", "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0647\u0646\u064A"),
        w(
          "Identifier le parcours qui vous correspond.",
          "Find the pathway that fits.",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
        ),
        "profession",
        "professional"
      )
    ],
    chapters: [
      chapter(
        w(
          "Votre engagement a de la valeur",
          "Your commitment has value",
          "\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0643\u0645 \u0642\u064A\u0645\u0629"
        ),
        w(
          "Explorez les parcours adapt\xE9s \xE0 vos objectifs et au contexte dans lequel vous souhaitez exercer.",
          "Explore pathways for your goals and intended work context.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0645\u0633\u0627\u0631\u0627\u062A \u062A\u0646\u0627\u0633\u0628 \u0623\u0647\u062F\u0627\u0641\u0643\u0645 \u0648\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628."
        ),
        "professional"
      ),
      chapter(
        w(
          "Renforcer sa pratique",
          "Strengthen your practice",
          "\u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"
        ),
        w(
          "Les contenus, pr\xE9requis et conditions d\u2019\xE9valuation se consultent dans chaque offre.",
          "Check content, prerequisites and assessment conditions in each offer.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0641\u064A \u0643\u0644 \u0639\u0631\u0636."
        ),
        "academy"
      ),
      chapter(
        w(
          "Choisir la bonne prochaine \xE9tape",
          "Choose the right next step",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062E\u0637\u0648\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w(
          "Une demande Academy permet d\u2019\xE9tudier un parcours. Elle ne constitue pas une promesse d\u2019emploi.",
          "An Academy request helps discuss a pathway and does not promise employment.",
          "\u0637\u0644\u0628 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0645\u0633\u0627\u0631 \u0648\u0644\u0627 \u064A\u0645\u062B\u0644 \u0648\u0639\u062F\u0627\u064B \u0628\u0627\u0644\u062A\u0648\u0638\u064A\u0641."
        ),
        "care"
      )
    ],
    steps: [
      w("Votre projet", "Your project", "\u0645\u0634\u0631\u0648\u0639\u0643\u0645"),
      w("Les comp\xE9tences vis\xE9es", "Target skills", "\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629"),
      w("Le parcours adapt\xE9", "The suitable pathway", "\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628"),
      w("Les conditions de l\u2019offre", "Offer conditions", "\u0634\u0631\u0648\u0637 \u0627\u0644\u0639\u0631\u0636")
    ],
    primary: "academy/request",
    primaryLabel: w(
      "Pr\xE9parer mon parcours professionnel",
      "Prepare my professional pathway",
      "\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0627\u0631\u064A \u0627\u0644\u0645\u0647\u0646\u064A"
    ),
    related: ["academy", "development", "home-services"]
  }
};
var C = {
  explore: w("Explorer les offres", "Explore offers", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0639\u0631\u0648\u0636"),
  all: w("Tout explorer", "Explore all", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0643\u0644"),
  catalogue: w(
    "La s\xE9lection \xE0 explorer",
    "Your discovery selection",
    "\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0644\u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641"
  ),
  search: w(
    "Une envie, un mot, un objectif\u2026",
    "An interest, a word, a goal\u2026",
    "\u0627\u0647\u062A\u0645\u0627\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0623\u0648 \u0647\u062F\u0641\u2026"
  ),
  discover: w("D\xE9couvrir", "Discover", "\u0627\u0643\u062A\u0634\u0641"),
  featured: w(
    "\xC0 la une de cet univers",
    "In the spotlight",
    "\u0641\u064A \u0648\u0627\u062C\u0647\u0629 \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0644\u0645"
  ),
  topics: w(
    "Entrez par ce qui vous inspire",
    "Start with what inspires you",
    "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0645\u0627 \u064A\u0644\u0647\u0645\u0643\u0645"
  ),
  editorial: w("De nouvelles perspectives", "New perspectives", "\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629"),
  collections: w(
    "Des collections pour vous guider",
    "Collections to guide you",
    "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0644\u062A\u0648\u062C\u064A\u0647\u0643\u0645"
  ),
  published: w("offres publi\xE9es", "published offers", "\u0639\u0631\u0648\u0636 \u0645\u0646\u0634\u0648\u0631\u0629"),
  resources: w(
    "Ressources & programmes publi\xE9s",
    "Published resources & programmes",
    "\u0645\u0648\u0627\u0631\u062F \u0648\u0628\u0631\u0627\u0645\u062C \u0645\u0646\u0634\u0648\u0631\u0629"
  ),
  empty: w(
    "Ce catalogue se pr\xE9pare. Les offres apparaissent ici d\xE8s leur publication.",
    "This catalogue is being prepared. Offers appear here when published.",
    "\u0647\u0630\u0627 \u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C \u0642\u064A\u062F \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u060C \u0648\u062A\u0638\u0647\u0631 \u0627\u0644\u0639\u0631\u0648\u0636 \u0639\u0646\u062F \u0646\u0634\u0631\u0647\u0627."
  ),
  noMatch: w(
    "Aucune offre ne correspond \xE0 ces crit\xE8res. Essayez une s\xE9lection plus large.",
    "No offers match these criteria. Try a broader selection.",
    "\u0644\u0627 \u0639\u0631\u0648\u0636 \u062A\u0637\u0627\u0628\u0642 \u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631. \u062C\u0631\u0628\u0648\u0627 \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u064B \u0623\u0648\u0633\u0639."
  ),
  emptyResources: w(
    "Les ressources publi\xE9es seront pr\xE9sent\xE9es ici.",
    "Published resources will appear here.",
    "\u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0647\u0646\u0627."
  ),
  reset: w("Tout r\xE9initialiser", "Reset all", "\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u0627\u0644\u0643\u0644"),
  more: w("Afficher plus d\u2019offres", "Show more offers", "\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F"),
  save: w("Enregistrer", "Save", "\u062D\u0641\u0638"),
  saved: w("Enregistr\xE9", "Saved", "\u0645\u062D\u0641\u0648\u0638"),
  compare: w("Comparer", "Compare", "\u0645\u0642\u0627\u0631\u0646\u0629"),
  compareTitle: w(
    "Le bon choix se voit dans les d\xE9tails",
    "The right choice is in the details",
    "\u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0641\u064A \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644"
  ),
  remove: w("Retirer", "Remove", "\u0625\u0632\u0627\u0644\u0629"),
  compareEmpty: w(
    "Ajoutez jusqu\u2019\xE0 quatre offres avec le bouton Comparer.",
    "Add up to four offers using Compare.",
    "\u0623\u0636\u064A\u0641\u0648\u0627 \u062D\u062A\u0649 \u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629."
  ),
  continue: w(
    "Retrouvez le fil de votre d\xE9couverte",
    "Pick up where you left off",
    "\u062A\u0627\u0628\u0639\u0648\u0627 \u0645\u0646 \u062D\u064A\u062B \u062A\u0648\u0642\u0641\u062A\u0645"
  ),
  recent: w("Vus r\xE9cemment", "Recently viewed", "\u0634\u0648\u0647\u062F\u062A \u0645\u0624\u062E\u0631\u0627\u064B"),
  savedEmpty: w(
    "Gardez vos coups de c\u0153ur avec le bouton Enregistrer.",
    "Keep your favourites using Save.",
    "\u0627\u062D\u062A\u0641\u0638\u0648\u0627 \u0628\u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u062D\u0641\u0638."
  ),
  recentEmpty: w(
    "Les fiches que vous ouvrez appara\xEEtront ici.",
    "Offer pages you open will appear here.",
    "\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062A\u064A \u062A\u0641\u062A\u062D\u0648\u0646\u0647\u0627 \u0633\u062A\u0638\u0647\u0631 \u0647\u0646\u0627."
  ),
  selectionError: w(
    "La s\xE9lection n\u2019a pas pu \xEAtre enregistr\xE9e. R\xE9essayez.",
    "The selection could not be saved. Try again.",
    "\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631. \u062D\u0627\u0648\u0644\u0648\u0627 \u0645\u062C\u062F\u062F\u0627\u064B."
  ),
  compareLimit: w(
    "Quatre offres maximum. Retirez une offre avant d\u2019en ajouter une autre.",
    "Four offers maximum. Remove one before adding another.",
    "\u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636 \u0643\u062D\u062F \u0623\u0642\u0635\u0649. \u0623\u0632\u064A\u0644\u0648\u0627 \u0639\u0631\u0636\u0627\u064B \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0622\u062E\u0631."
  ),
  trust: w(
    "Les d\xE9tails qui vous aident \xE0 d\xE9cider",
    "Details that help you decide",
    "\u062A\u0641\u0627\u0635\u064A\u0644 \u062A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0627\u0631"
  ),
  trustLead: w(
    "Consultez le contenu, le prix, le p\xE9rim\xE8tre et les conditions de l\u2019offre avant de poursuivre.",
    "Check content, price, scope and offer conditions before continuing.",
    "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0633\u0639\u0631 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0642\u0628\u0644 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629."
  ),
  journey: w(
    "Votre prochaine \xE9tape, en toute clart\xE9",
    "A clear next step",
    "\u062E\u0637\u0648\u0629 \u0642\u0627\u062F\u0645\u0629 \u0648\u0627\u0636\u062D\u0629"
  ),
  related: w(
    "Votre d\xE9couverte ne s\u2019arr\xEAte pas ici",
    "There is more to discover",
    "\u0627\u0644\u0645\u0632\u064A\u062F \u064A\u0646\u062A\u0638\u0631 \u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641"
  ),
  faq: w(
    "Les r\xE9ponses avant de choisir",
    "Answers before you choose",
    "\u0625\u062C\u0627\u0628\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631"
  ),
  final: w(
    "Votre prochaine \xE9tape commence ici.",
    "Your next step starts here.",
    "\u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u062A\u0628\u062F\u0623 \u0647\u0646\u0627."
  ),
  price: w("Prix", "Price", "\u0627\u0644\u0633\u0639\u0631"),
  format: w("Format", "Format", "\u0627\u0644\u0634\u0643\u0644"),
  age: w("\xC2ge", "Age", "\u0627\u0644\u0639\u0645\u0631"),
  contents: w("Contenu publi\xE9", "Published contents", "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0646\u0634\u0648\u0631"),
  conditions: w("Consulter les conditions", "See conditions", "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0634\u0631\u0648\u0637"),
  available: w("Disponible", "Available", "\u0645\u062A\u0627\u062D"),
  limited: w("Disponibilit\xE9 limit\xE9e", "Limited availability", "\u062A\u0648\u0641\u0631 \u0645\u062D\u062F\u0648\u062F"),
  unavailable: w(
    "Indisponible actuellement",
    "Currently unavailable",
    "\u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B"
  ),
  quote: w("Proposition \xE0 \xE9tudier", "Discuss a proposal", "\u062F\u0631\u0627\u0633\u0629 \u0639\u0631\u0636"),
  noPrice: w("Prix \xE0 confirmer", "Price to confirm", "\u0627\u0644\u0633\u0639\u0631 \u0644\u0644\u062A\u0623\u0643\u064A\u062F"),
  from: w("D\xE8s", "From", "\u0627\u0628\u062A\u062F\u0627\u0621 \u0645\u0646"),
  type: w("Type d\u2019offre", "Offer type", "\u0646\u0648\u0639 \u0627\u0644\u0639\u0631\u0636"),
  availability: w("Disponibilit\xE9", "Availability", "\u0627\u0644\u062A\u0648\u0641\u0631"),
  sort: w("Trier", "Sort", "\u0627\u0644\u062A\u0631\u062A\u064A\u0628"),
  recommended: w("Ordre du catalogue", "Catalogue order", "\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C"),
  priceAsc: w("Prix croissant", "Price: low to high", "\u0627\u0644\u0633\u0639\u0631 \u062A\u0635\u0627\u0639\u062F\u064A\u0627\u064B"),
  priceDesc: w("Prix d\xE9croissant", "Price: high to low", "\u0627\u0644\u0633\u0639\u0631 \u062A\u0646\u0627\u0632\u0644\u064A\u0627\u064B"),
  name: w("Nom", "Name", "\u0627\u0644\u0627\u0633\u0645"),
  configuration: w("D\xE9tails de l\u2019offre", "Offer details", "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0639\u0631\u0636"),
  prepare: w("Pr\xE9parer mon projet", "Prepare my project", "\u0625\u0639\u062F\u0627\u062F \u0645\u0634\u0631\u0648\u0639\u064A"),
  summary: w(
    "Votre s\xE9lection de priorit\xE9s",
    "Your selected priorities",
    "\u0623\u0648\u0644\u0648\u064A\u0627\u062A\u0643\u0645 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629"
  ),
  copy: w("Copier mon r\xE9sum\xE9", "Copy my summary", "\u0646\u0633\u062E \u0645\u0644\u062E\u0635\u064A"),
  copied: w("R\xE9sum\xE9 copi\xE9", "Summary copied", "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0645\u0644\u062E\u0635"),
  copyFailed: w(
    "Copie impossible. S\xE9lectionnez le texte du r\xE9sum\xE9.",
    "Copy failed. Select the summary text.",
    "\u062A\u0639\u0630\u0631 \u0627\u0644\u0646\u0633\u062E. \u062D\u062F\u062F\u0648\u0627 \u0646\u0635 \u0627\u0644\u0645\u0644\u062E\u0635."
  ),
  note: w(
    "Ce rep\xE9rage pr\xE9pare votre demande. Les conditions seront pr\xE9cis\xE9es dans le parcours d\xE9di\xE9.",
    "This preparation supports your request. Terms are clarified in the dedicated journey.",
    "\u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u064A\u062F\u0639\u0645 \u0637\u0644\u0628\u0643\u0645 \u0648\u062A\u062D\u062F\u062F \u0627\u0644\u0634\u0631\u0648\u0637 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u062E\u0635\u0635."
  ),
  pause: w("Mettre en pause", "Pause", "\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A"),
  play: w("Activer les transitions", "Enable transitions", "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644\u0627\u062A"),
  previous: w("Pr\xE9c\xE9dent", "Previous", "\u0627\u0644\u0633\u0627\u0628\u0642"),
  next: w("Suivant", "Next", "\u0627\u0644\u062A\u0627\u0644\u064A"),
  unknown: w(
    "Non indiqu\xE9 sur l\u2019offre",
    "Not listed on the offer",
    "\u063A\u064A\u0631 \u0645\u0630\u0643\u0648\u0631 \u0641\u064A \u0627\u0644\u0639\u0631\u0636"
  ),
  noMedia: w("Visuel non renseign\xE9", "Image not provided", "\u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629"),
  planner: w("Pr\xE9paration de projet", "Project preparation", "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0634\u0631\u0648\u0639"),
  nativeLead: w(
    "D\xE9couvrez \xE9galement les contenus publi\xE9s dans cet univers.",
    "Also explore the content published in this universe.",
    "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0623\u064A\u0636\u0627\u064B \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0646\u0634\u0648\u0631 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0644\u0645."
  ),
  nonMedical: w(
    "Accompagnement non m\xE9dical : aucun diagnostic, prescription ou administration de m\xE9dicaments.",
    "Non-medical support: no diagnosis, prescriptions or medication administration.",
    "\u062F\u0639\u0645 \u063A\u064A\u0631 \u0637\u0628\u064A: \u062F\u0648\u0646 \u062A\u0634\u062E\u064A\u0635 \u0623\u0648 \u0648\u0635\u0641\u0627\u062A \u0623\u0648 \u0625\u0639\u0637\u0627\u0621 \u0623\u062F\u0648\u064A\u0629."
  ),
  months: w("mois", "months", "\u0623\u0634\u0647\u0631"),
  minutes: w("min", "min", "\u062F\u0642\u064A\u0642\u0629"),
  years: w("ans", "years", "\u0633\u0646\u0648\u0627\u062A"),
  service: w("Service", "Service", "\u062E\u062F\u0645\u0629"),
  product: w("Produit", "Product", "\u0645\u0646\u062A\u062C"),
  training: w("Formation", "Training", "\u062A\u062F\u0631\u064A\u0628"),
  audit: w("\xC9valuation", "Assessment", "\u062A\u0642\u064A\u064A\u0645"),
  kit: w("Kit", "Kit", "\u0645\u062C\u0645\u0648\u0639\u0629"),
  saas_module: w("Partner OS", "Partner OS", "Partner OS"),
  monthly: w("Mensuel", "Monthly", "\u0634\u0647\u0631\u064A"),
  quarterly: w("Trimestriel", "Quarterly", "\u0631\u0628\u0639 \u0633\u0646\u0648\u064A"),
  annual: w("Annuel", "Annual", "\u0633\u0646\u0648\u064A"),
  custom: w("Conditions sp\xE9cifiques", "Custom terms", "\u0634\u0631\u0648\u0637 \u062E\u0627\u0635\u0629"),
  plan: w("Plan publi\xE9", "Published plan", "\u062E\u0637\u0629 \u0645\u0646\u0634\u0648\u0631\u0629"),
  modules: w("modules d\xE9clar\xE9s", "declared modules", "\u0648\u062D\u062F\u0627\u062A \u0645\u0639\u0644\u0646\u0629"),
  faq1: w(
    "Comment choisir la bonne offre ?",
    "How do I choose an offer?",
    "\u0643\u064A\u0641 \u0623\u062E\u062A\u0627\u0631 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u061F"
  ),
  answer1: w(
    "Explorez les contenus, comparez les d\xE9tails puis consultez la fiche. Le parcours de l\u2019offre pr\xE9cise les conditions avant votre engagement.",
    "Explore content, compare details and open the offer page. Its journey clarifies terms before commitment.",
    "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0641\u062A\u062D\u0648\u0627 \u0635\u0641\u062D\u0629 \u0627\u0644\u0639\u0631\u0636 \u0644\u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0634\u0631\u0648\u0637 \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645."
  ),
  faq2: w(
    "Une offre indisponible reste-t-elle consultable ?",
    "Can I still view an unavailable offer?",
    "\u0647\u0644 \u064A\u0645\u0643\u0646 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0639\u0631\u0636 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u061F"
  ),
  answer2: w(
    "Oui, sa fiche reste accessible. Son affichage ne garantit ni stock ni cr\xE9neau ; les conditions sont v\xE9rifi\xE9es dans le parcours concern\xE9.",
    "Yes. Its page remains accessible. Display does not guarantee stock or a slot; terms are checked in the relevant journey.",
    "\u0646\u0639\u0645 \u062A\u0628\u0642\u0649 \u0627\u0644\u0635\u0641\u062D\u0629 \u0645\u062A\u0627\u062D\u0629. \u0627\u0644\u0639\u0631\u0636 \u0644\u0627 \u064A\u0636\u0645\u0646 \u0645\u062E\u0632\u0648\u0646\u0627\u064B \u0623\u0648 \u0645\u0648\u0639\u062F\u0627\u064B \u0648\u062A\u0631\u0627\u062C\u0639 \u0627\u0644\u0634\u0631\u0648\u0637 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0639\u0646\u064A."
  ),
  faq3: w(
    "Puis-je pr\xE9parer une s\xE9lection avant de d\xE9cider ?",
    "Can I prepare a selection before deciding?",
    "\u0647\u0644 \u064A\u0645\u0643\u0646 \u0625\u0639\u062F\u0627\u062F \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0642\u0631\u0627\u0631\u061F"
  ),
  answer3: w(
    "Enregistrez vos favoris ou comparez jusqu\u2019\xE0 quatre offres. Les comparaisons affichent uniquement les informations renseign\xE9es.",
    "Save favourites or compare up to four offers. Comparisons show only provided information.",
    "\u0627\u062D\u0641\u0638\u0648\u0627 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0623\u0648 \u0642\u0627\u0631\u0646\u0648\u0627 \u062D\u062A\u0649 \u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636\u060C \u0645\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629 \u0641\u0642\u0637."
  )
};
var isImmersiveKey = (key) => Object.prototype.hasOwnProperty.call(PROFILES, key);
var photo = (key) => {
  const assets = {
    development: "living-world-02/development-editorial.jpg",
    academy: "living-world-02/academy-editorial.jpg",
    professional: "living-world-02/professional-editorial.jpg",
    corporate: "living-world-02/corporate-editorial-r4.jpg",
    health: "living-world-02/health-editorial-r4.jpg",
    newborn: "living-world-02/newborn-editorial-r4.jpg",
    preschool: "living-world-02/preschool-editorial-r4.jpg",
    school: "living-world-02/school-editorial-r4.jpg",
    desk: "living-world-02/desk-editorial-r4.jpg",
    support: "living-world-02/support-editorial-r4.jpg",
    flashcards: "living-world-02/flashcards-editorial-r4.jpg",
    hospitality: "living-world-02/hospitality-editorial-r4.jpg"
  };
  return `/angelcare-marketplace/${assets[key] || `families-world-r2/${key}.jpg`}`;
};

// storefronts-ten-r1/contract-runtime.mjs
var w2 = (fr, en, ar) => ({
  fr,
  en,
  ar
});
var tr2 = (value, locale) => value[locale];
var topic2 = (label, body, query, photo2) => ({ label, body, query, photo: photo2 });
var chapter2 = (title, body, photo2) => ({
  title,
  body,
  photo: photo2
});
var PROFILES2 = {
  development: {
    key: "development",
    label: w2("D\xE9veloppement", "Development", "\u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u0637\u0641\u0644"),
    eyebrow: w2(
      "LE MONDE GRANDIT AVEC EUX",
      "A WORLD THAT GROWS WITH THEM",
      "\u0639\u0627\u0644\u0645 \u064A\u0643\u0628\u0631 \u0645\u0639\u0647\u0645"
    ),
    title: w2(
      "Petites mains. Grandes d\xE9couvertes.",
      "Little hands. Extraordinary discoveries.",
      "\u0623\u064A\u062F\u064D \u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u0643\u0628\u064A\u0631\u0629."
    ),
    lead: w2(
      "Transformez la curiosit\xE9 en moments de d\xE9couverte. Activit\xE9s, jeux et ressources : trouvez l\u2019exp\xE9rience qui fait briller leur prochaine \xE9tape.",
      "Turn curiosity into moments of discovery. Activities, games and resources for their next bright step.",
      "\u062D\u0648\u0651\u0644\u0648\u0627 \u0627\u0644\u0641\u0636\u0648\u0644 \u0625\u0644\u0649 \u0644\u062D\u0638\u0627\u062A \u0627\u0643\u062A\u0634\u0627\u0641 \u0645\u0639 \u0623\u0646\u0634\u0637\u0629 \u0648\u0623\u0644\u0639\u0627\u0628 \u0648\u0645\u0648\u0627\u0631\u062F \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u062E\u0637\u0648\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    photo: "development",
    secondaryPhoto: "flashcards",
    color: "#9b36df",
    companion: "#f42d78",
    signature: w2(
      "Le studio des petites d\xE9couvertes",
      "The little-discoveries studio",
      "\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629"
    ),
    signatureLead: w2(
      "Un \xE2ge, une envie, une activit\xE9. Composez votre point de d\xE9part \xE0 partir des donn\xE9es de chaque offre.",
      "An age, an interest, an activity. Build a starting point from the details of each offer.",
      "\u0639\u0645\u0631 \u0648\u0627\u0647\u062A\u0645\u0627\u0645 \u0648\u0646\u0634\u0627\u0637: \u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u0645\u0646 \u062A\u0641\u0627\u0635\u064A\u0644 \u0643\u0644 \u0639\u0631\u0636."
    ),
    topics: [
      topic2(
        w2("Langage & expression", "Language & expression", "\u0627\u0644\u0644\u063A\u0629 \u0648\u0627\u0644\u062A\u0639\u0628\u064A\u0631"),
        w2(
          "Des mots aux histoires, ouvrir la conversation.",
          "From words to stories, open a conversation.",
          "\u0645\u0646 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u0642\u0635\u0635\u060C \u0627\u0641\u062A\u062D\u0648\u0627 \u0628\u0627\u0628 \u0627\u0644\u062D\u0648\u0627\u0631."
        ),
        "langage",
        "flashcards"
      ),
      topic2(
        w2(
          "Autonomie & Montessori",
          "Independence & Montessori",
          "\u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629 \u0648\u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"
        ),
        w2(
          "Faire soi-m\xEAme, essayer, recommencer.",
          "Do, try and try again.",
          "\u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u0648\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0648\u0627\u0644\u062A\u0643\u0631\u0627\u0631."
        ),
        "montessori",
        "montessori"
      ),
      topic2(
        w2("Cr\xE9ativit\xE9 & jeux", "Creativity & play", "\u0627\u0644\u0625\u0628\u062F\u0627\u0639 \u0648\u0627\u0644\u0644\u0639\u0628"),
        w2(
          "Mati\xE8res, couleurs et imagination en action.",
          "Materials, colours and imagination in action.",
          "\u0645\u0648\u0627\u062F \u0648\u0623\u0644\u0648\u0627\u0646 \u0648\u062E\u064A\u0627\u0644 \u064A\u062A\u062D\u0631\u0643."
        ),
        "jeu",
        "games"
      ),
      topic2(
        w2("Attention & apprentissage", "Focus & learning", "\u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0648\u0627\u0644\u062A\u0639\u0644\u0645"),
        w2(
          "Des d\xE9couvertes qui respectent le rythme de l\u2019enfant.",
          "Discovery at a child\u2019s own pace.",
          "\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u062A\u062D\u062A\u0631\u0645 \u0625\u064A\u0642\u0627\u0639 \u0627\u0644\u0637\u0641\u0644."
        ),
        "apprentissage",
        "homework"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Apprendre commence par jouer",
          "Learning starts with play",
          "\u0627\u0644\u062A\u0639\u0644\u0645 \u064A\u0628\u062F\u0623 \u0628\u0627\u0644\u0644\u0639\u0628"
        ),
        w2(
          "Une activit\xE9 adapt\xE9e vaut mieux qu\u2019un programme surcharg\xE9. Consultez l\u2019\xE2ge, la dur\xE9e et les mat\xE9riaux publi\xE9s avant de choisir.",
          "Check the published age, duration and materials before choosing an activity.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0639\u0645\u0631 \u0648\u0627\u0644\u0645\u062F\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0642\u0628\u0644 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0646\u0634\u0627\u0637."
        ),
        "games"
      ),
      chapter2(
        w2(
          "De la d\xE9couverte \xE0 la maison",
          "Bring discovery home",
          "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u064A\u0635\u0644 \u0625\u0644\u0649 \u0627\u0644\u0628\u064A\u062A"
        ),
        w2(
          "Associez votre prochaine activit\xE9 \xE0 un kit ou une ressource, sans perdre le fil de votre objectif.",
          "Pair your next activity with a kit or resource that shares your goal.",
          "\u0627\u0631\u0628\u0637\u0648\u0627 \u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u0642\u0627\u062F\u0645 \u0628\u0645\u062C\u0645\u0648\u0639\u0629 \u0623\u0648 \u0645\u0648\u0631\u062F \u064A\u0646\u0627\u0633\u0628 \u0647\u062F\u0641\u0643\u0645."
        ),
        "montessori"
      ),
      chapter2(
        w2(
          "Le plaisir de recommencer",
          "The joy of trying again",
          "\u0645\u062A\u0639\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0646 \u062C\u062F\u064A\u062F"
        ),
        w2(
          "Un espace, quelques minutes, un support adapt\xE9 : composez des moments qui donnent envie de revenir.",
          "A space, a few minutes and a suitable resource create moments worth returning to.",
          "\u0645\u0633\u0627\u062D\u0629 \u0648\u062F\u0642\u0627\u0626\u0642 \u0648\u0645\u0648\u0631\u062F \u0645\u0646\u0627\u0633\u0628 \u062A\u0635\u0646\u0639 \u0644\u062D\u0638\u0627\u062A \u062A\u0633\u062A\u062D\u0642 \u0627\u0644\u0639\u0648\u062F\u0629."
        ),
        "development"
      )
    ],
    steps: [
      w2("Choisir un objectif", "Choose a goal", "\u0627\u062E\u062A\u064A\u0627\u0631 \u0647\u062F\u0641"),
      w2("V\xE9rifier l\u2019\xE2ge", "Check the age", "\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0639\u0645\u0631"),
      w2("Explorer le contenu", "Explore the content", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u062D\u062A\u0648\u0649"),
      w2(
        "Suivre le parcours de l\u2019offre",
        "Follow the offer journey",
        "\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0631\u0636"
      )
    ],
    primary: "family/request",
    primaryLabel: w2(
      "\xCAtre guid\xE9 pour mon enfant",
      "Get guidance for my child",
      "\u0637\u0644\u0628 \u062A\u0648\u062C\u064A\u0647 \u0644\u0637\u0641\u0644\u064A"
    ),
    related: ["kits", "home-services", "families"]
  },
  kits: {
    key: "kits",
    label: w2("Kits & produits", "Kits & products", "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A"),
    eyebrow: w2(
      "OUVREZ UNE BO\xCETE DE POSSIBILIT\xC9S",
      "OPEN A WORLD OF POSSIBILITIES",
      "\u0627\u0641\u062A\u062D\u0648\u0627 \u0639\u0627\u0644\u0645\u0627\u064B \u0645\u0646 \u0627\u0644\u0625\u0645\u0643\u0627\u0646\u0627\u062A"
    ),
    title: w2(
      "Le prochain \xAB wow \xBB tient dans leurs mains.",
      "Their next \u201Cwow\u201D is in their hands.",
      "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0642\u0627\u062F\u0645 \u0628\u064A\u0646 \u0623\u064A\u062F\u064A\u0647\u0645."
    ),
    lead: w2(
      "Kits Montessori, jeux, flashcartes et ressources digitales. Regardez chaque d\xE9tail, comparez les contenus et choisissez ce qui fait envie d\u2019apprendre.",
      "Montessori kits, games, flashcards and digital resources. Explore every detail and compare contents before choosing.",
      "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A \u0648\u0623\u0644\u0639\u0627\u0628 \u0648\u0628\u0637\u0627\u0642\u0627\u062A \u0648\u0645\u0648\u0627\u0631\u062F \u0631\u0642\u0645\u064A\u0629: \u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A."
    ),
    photo: "kits",
    secondaryPhoto: "flashcards",
    color: "#0873d9",
    companion: "#f42d78",
    signature: w2(
      "Ouvrez le kit. D\xE9couvrez ce qu\u2019il contient.",
      "Open the kit. Discover what is inside.",
      "\u0627\u0641\u062A\u062D\u0648\u0627 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0648\u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0645\u062D\u062A\u0648\u064A\u0627\u062A\u0647\u0627."
    ),
    signatureLead: w2(
      "Un explorateur de produits r\xE9els : contenus, formats et \xE2ges restent ceux de chaque fiche.",
      "A real-product explorer: contents, formats and ages come from each product record.",
      "\u0645\u0633\u062A\u0643\u0634\u0641 \u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0641\u0639\u0644\u064A\u0629: \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u0634\u0643\u0627\u0644 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0631 \u0645\u0646 \u0628\u064A\u0627\u0646\u0627\u062A \u0643\u0644 \u0645\u0646\u062A\u062C."
    ),
    topics: [
      topic2(
        w2("Kits Montessori", "Montessori kits", "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"),
        w2(
          "D\xE9couvrir, manipuler, gagner en autonomie.",
          "Discover, handle, grow in independence.",
          "\u0627\u0643\u062A\u0634\u0627\u0641 \u0648\u062A\u062C\u0631\u064A\u0628 \u0648\u0627\u0643\u062A\u0633\u0627\u0628 \u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629."
        ),
        "montessori",
        "montessori"
      ),
      topic2(
        w2("Flashcartes", "Flashcards", "\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629"),
        w2(
          "Des images qui ouvrent la conversation.",
          "Images that start conversations.",
          "\u0635\u0648\u0631 \u062A\u0641\u062A\u062D \u0628\u0627\u0628 \u0627\u0644\u062D\u0648\u0627\u0631."
        ),
        "flash",
        "flashcards"
      ),
      topic2(
        w2("Jeux de d\xE9veloppement", "Development games", "\u0623\u0644\u0639\u0627\u0628 \u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w2(
          "L\u2019envie de jouer, le plaisir de progresser.",
          "The desire to play, the joy of progress.",
          "\u0627\u0644\u0631\u063A\u0628\u0629 \u0641\u064A \u0627\u0644\u0644\u0639\u0628 \u0648\u0645\u062A\u0639\u0629 \u0627\u0644\u062A\u0642\u062F\u0645."
        ),
        "jeu",
        "games"
      ),
      topic2(
        w2("Ressources digitales", "Digital resources", "\u0645\u0648\u0627\u0631\u062F \u0631\u0642\u0645\u064A\u0629"),
        w2(
          "D\xE9couvrez le format indiqu\xE9 sur chaque offre.",
          "Discover the format listed on each offer.",
          "\u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0627\u0644\u0634\u0643\u0644 \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u0641\u064A \u0643\u0644 \u0639\u0631\u0636."
        ),
        "digital",
        "digital"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Le d\xE9tail fait la diff\xE9rence",
          "Details make the difference",
          "\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u062A\u0635\u0646\u0639 \u0627\u0644\u0641\u0631\u0642"
        ),
        w2(
          "Visualisez les images sans recadrage. Consultez les \xE9l\xE9ments inclus, le format et les conditions de chaque produit.",
          "See uncropped images and check included components, format and conditions.",
          "\u0634\u0627\u0647\u062F\u0648\u0627 \u0627\u0644\u0635\u0648\u0631 \u0643\u0627\u0645\u0644\u0629 \u0648\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0634\u0643\u0644 \u0648\u0627\u0644\u0634\u0631\u0648\u0637."
        ),
        "kits"
      ),
      chapter2(
        w2(
          "Une s\xE9lection qui a du sens",
          "Build a meaningful selection",
          "\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0644\u0647\u0627 \u0645\u0639\u0646\u0649"
        ),
        w2(
          "Gardez vos favoris et comparez les offres avant d\u2019ouvrir la fiche qui vous correspond.",
          "Save favourites and compare offers before opening the right product page.",
          "\u0627\u062D\u0641\u0638\u0648\u0627 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0639\u0631\u0648\u0636 \u0642\u0628\u0644 \u0641\u062A\u062D \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629."
        ),
        "flashcards"
      ),
      chapter2(
        w2("Le jeu continue", "Keep the discovery going", "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u064A\u0633\u062A\u0645\u0631"),
        w2(
          "Passez du produit aux id\xE9es d\u2019activit\xE9s dans l\u2019univers D\xE9veloppement.",
          "Move from products to activity ideas in Development.",
          "\u0627\u0646\u062A\u0642\u0644\u0648\u0627 \u0645\u0646 \u0627\u0644\u0645\u0646\u062A\u062C \u0625\u0644\u0649 \u0623\u0641\u0643\u0627\u0631 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0641\u064A \u0641\u0636\u0627\u0621 \u0627\u0644\u062A\u0646\u0645\u064A\u0629."
        ),
        "games"
      )
    ],
    steps: [
      w2("Explorer les formats", "Explore formats", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0623\u0634\u0643\u0627\u0644"),
      w2("Comparer les contenus", "Compare contents", "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A"),
      w2("Ouvrir la fiche", "Open the product page", "\u0641\u062A\u062D \u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u062A\u062C"),
      w2(
        "Commander selon les conditions",
        "Order under the listed terms",
        "\u0627\u0644\u0637\u0644\u0628 \u062D\u0633\u0628 \u0627\u0644\u0634\u0631\u0648\u0637"
      )
    ],
    primary: "basket",
    primaryLabel: w2("Retrouver mon panier", "Open my basket", "\u0641\u062A\u062D \u0633\u0644\u062A\u064A"),
    related: ["development", "families", "academy"]
  },
  academy: {
    key: "academy",
    label: w2("Academy", "Academy", "\u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629"),
    eyebrow: w2(
      "VOTRE AMBITION M\xC9RITE UN PARCOURS",
      "YOUR AMBITION DESERVES A PATHWAY",
      "\u0637\u0645\u0648\u062D\u0643\u0645 \u064A\u0633\u062A\u062D\u0642 \u0645\u0633\u0627\u0631\u0627\u064B"
    ),
    title: w2(
      "Faites de vos comp\xE9tences votre prochaine force.",
      "Make your skills your next advantage.",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u0645\u0647\u0627\u0631\u0627\u062A\u0643\u0645 \u0642\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    lead: w2(
      "Cours, programmes et parcours professionnels. Explorez les contenus publi\xE9s, comparez les modalit\xE9s et construisez une prochaine \xE9tape qui vous ressemble.",
      "Explore published courses, programmes and professional pathways. Compare delivery options and build your next step.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062F\u0648\u0631\u0627\u062A \u0648\u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u062A\u0639\u0644\u0645 \u0644\u0628\u0646\u0627\u0621 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    photo: "academy",
    secondaryPhoto: "professional",
    color: "#7539d9",
    companion: "#f42d78",
    signature: w2(
      "Le campus de votre prochaine \xE9tape",
      "The campus for your next step",
      "\u062D\u0631\u0645 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
    ),
    signatureLead: w2(
      "S\xE9lectionnez un programme publi\xE9 ou explorez les cours du catalogue. Chaque inscription garde son propre parcours.",
      "Select a published programme or explore catalogue courses. Each enrollment keeps its own journey.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0628\u0631\u0646\u0627\u0645\u062C\u0627\u064B \u0645\u0646\u0634\u0648\u0631\u0627\u064B \u0623\u0648 \u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062F\u0648\u0631\u0627\u062A\u060C \u0645\u0639 \u0645\u0633\u0627\u0631 \u062A\u0633\u062C\u064A\u0644 \u062E\u0627\u0635 \u0628\u0643\u0644 \u0639\u0631\u0636."
    ),
    topics: [
      topic2(
        w2("Petite enfance", "Early childhood", "\u0627\u0644\u0637\u0641\u0648\u0644\u0629 \u0627\u0644\u0645\u0628\u0643\u0631\u0629"),
        w2(
          "Les gestes et connaissances du quotidien.",
          "Everyday knowledge and practical skills.",
          "\u0627\u0644\u0645\u0639\u0627\u0631\u0641 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629."
        ),
        "enfance",
        "care"
      ),
      topic2(
        w2(
          "P\xE9dagogie & Montessori",
          "Teaching & Montessori",
          "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0648\u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"
        ),
        w2(
          "Donner une intention \xE0 chaque activit\xE9.",
          "Bring purpose to every activity.",
          "\u0645\u0646\u062D \u0647\u062F\u0641 \u0644\u0643\u0644 \u0646\u0634\u0627\u0637."
        ),
        "montessori",
        "montessori"
      ),
      topic2(
        w2("Parcours professionnels", "Professional pathways", "\u0645\u0633\u0627\u0631\u0627\u062A \u0645\u0647\u0646\u064A\u0629"),
        w2(
          "Choisir une progression adapt\xE9e \xE0 votre projet.",
          "Choose progress that fits your project.",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u062A\u0642\u062F\u0645 \u064A\u0646\u0627\u0633\u0628 \u0645\u0634\u0631\u0648\u0639\u0643\u0645."
        ),
        "profession",
        "professional"
      ),
      topic2(
        w2("Formation des \xE9quipes", "Team training", "\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0641\u0631\u0642"),
        w2(
          "Des besoins partag\xE9s, un parcours \xE0 \xE9tudier.",
          "Shared needs, a pathway to discuss.",
          "\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0645\u0634\u062A\u0631\u0643\u0629 \u0648\u0645\u0633\u0627\u0631 \u0644\u0644\u062F\u0631\u0627\u0633\u0629."
        ),
        "formation",
        "school"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Passez de l\u2019envie \xE0 l\u2019action",
          "Turn ambition into action",
          "\u0645\u0646 \u0627\u0644\u0637\u0645\u0648\u062D \u0625\u0644\u0649 \u0627\u0644\u0639\u0645\u0644"
        ),
        w2(
          "Objectif, public vis\xE9, contenu, modalit\xE9 : prenez le temps de comparer avant l\u2019inscription.",
          "Compare goals, audience, content and delivery before enrolling.",
          "\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u062C\u0645\u0647\u0648\u0631 \u0648\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0646\u0645\u0637 \u0642\u0628\u0644 \u0627\u0644\u062A\u0633\u062C\u064A\u0644."
        ),
        "academy"
      ),
      chapter2(
        w2(
          "Apprendre au plus pr\xE8s du terrain",
          "Learn close to real practice",
          "\u062A\u0639\u0644\u0645 \u0642\u0631\u064A\u0628 \u0645\u0646 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"
        ),
        w2(
          "Consultez les objectifs et comp\xE9tences d\xE9clar\xE9s dans chaque programme publi\xE9.",
          "Check the objectives and skills declared in each published programme.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0646\u0629 \u0641\u064A \u0643\u0644 \u0628\u0631\u0646\u0627\u0645\u062C \u0645\u0646\u0634\u0648\u0631."
        ),
        "professional"
      ),
      chapter2(
        w2(
          "Une \xE9quipe, un projet de progression",
          "One team, a shared learning project",
          "\u0641\u0631\u064A\u0642 \u0648\u0627\u062D\u062F \u0648\u0645\u0634\u0631\u0648\u0639 \u062A\u0639\u0644\u0645 \u0645\u0634\u062A\u0631\u0643"
        ),
        w2(
          "Pour une organisation, d\xE9marrez une demande Academy afin d\u2019\xE9tudier les besoins de votre \xE9quipe.",
          "Start an Academy request to discuss your organisation\u2019s training needs.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0637\u0644\u0628\u0627\u064B \u0644\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u062A\u062F\u0631\u064A\u0628 \u0641\u0631\u064A\u0642\u0643\u0645."
        ),
        "school"
      )
    ],
    steps: [
      w2("D\xE9finir son objectif", "Set a goal", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0647\u062F\u0641"),
      w2("Comparer les parcours", "Compare pathways", "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A"),
      w2("V\xE9rifier les conditions", "Check conditions", "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0634\u0631\u0648\u0637"),
      w2("D\xE9marrer son inscription", "Start enrollment", "\u0628\u062F\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644")
    ],
    primary: "academy/request",
    primaryLabel: w2(
      "Construire mon parcours",
      "Build my pathway",
      "\u0628\u0646\u0627\u0621 \u0645\u0633\u0627\u0631\u064A"
    ),
    related: ["professionals", "establishments", "development"]
  },
  establishments: {
    key: "establishments",
    label: w2("\xC9tablissements", "Establishments", "\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A"),
    eyebrow: w2(
      "VOTRE \xC9TABLISSEMENT, UN NOUVEL HORIZON",
      "A NEW HORIZON FOR YOUR ESTABLISHMENT",
      "\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629 \u0644\u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    title: w2(
      "Faites grandir votre \xE9tablissement. \xC0 tous les niveaux.",
      "Help your establishment grow. At every level.",
      "\u0627\u0631\u062A\u0642\u0648\u0627 \u0628\u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A."
    ),
    lead: w2(
      "Cr\xE8ches, \xE9coles et structures d\u2019accueil : reliez vos priorit\xE9s \xE0 des programmes, des comp\xE9tences et des outils pour pr\xE9parer une transformation coh\xE9rente.",
      "Connect your nursery or school priorities to programmes, skills and tools for a coherent transformation.",
      "\u0627\u0631\u0628\u0637\u0648\u0627 \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u062D\u0636\u0627\u0646\u062A\u0643\u0645 \u0623\u0648 \u0645\u062F\u0631\u0633\u062A\u0643\u0645 \u0628\u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0644\u0625\u0639\u062F\u0627\u062F \u062A\u062D\u0648\u0644 \u0645\u062A\u0643\u0627\u0645\u0644."
    ),
    photo: "preschool",
    secondaryPhoto: "school",
    color: "#008ba4",
    companion: "#7539d9",
    signature: w2(
      "Votre carte de transformation",
      "Your transformation map",
      "\u062E\u0631\u064A\u0637\u0629 \u062A\u062D\u0648\u0644 \u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    signatureLead: w2(
      "Choisissez vos priorit\xE9s. Pr\xE9parez un r\xE9sum\xE9 \xE0 partager au d\xE9marrage du diagnostic.",
      "Choose priorities and prepare a summary to share when starting your assessment.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0648\u0623\u0639\u062F\u0648\u0627 \u0645\u0644\u062E\u0635\u0627\u064B \u0644\u0645\u0634\u0627\u0631\u0643\u062A\u0647 \u0639\u0646\u062F \u0628\u062F\u0621 \u0627\u0644\u062A\u0634\u062E\u064A\u0635."
    ),
    topics: [
      topic2(
        w2("Programmes \xE9ducatifs", "Educational programmes", "\u0628\u0631\u0627\u0645\u062C \u062A\u0631\u0628\u0648\u064A\u0629"),
        w2(
          "Une exp\xE9rience enfant avec une intention claire.",
          "Child experiences with a clear purpose.",
          "\u062A\u062C\u0627\u0631\u0628 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0630\u0627\u062A \u0647\u062F\u0641 \u0648\u0627\u0636\u062D."
        ),
        "programme",
        "preschool"
      ),
      topic2(
        w2("Renfort & comp\xE9tences", "Staffing & skills", "\u062F\u0639\u0645 \u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w2(
          "Aligner les besoins de l\u2019\xE9quipe et les parcours.",
          "Align team needs and learning pathways.",
          "\u0645\u0648\u0627\u0621\u0645\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic2(
        w2("Qualit\xE9 & diagnostic", "Quality & assessment", "\u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635"),
        w2(
          "Identifier les priorit\xE9s avant d\u2019agir.",
          "Identify priorities before taking action.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0639\u0645\u0644."
        ),
        "diagnostic",
        "support"
      ),
      topic2(
        w2("Organisation & outils", "Operations & tools", "\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u062A"),
        w2(
          "Explorer un syst\xE8me au service de votre quotidien.",
          "Explore a system for everyday operations.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0646\u0638\u0627\u0645 \u064A\u062E\u062F\u0645 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u064A\u0648\u0645\u064A."
        ),
        "organisation",
        "desk"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Un projet \xE0 votre \xE9chelle",
          "A project at your scale",
          "\u0645\u0634\u0631\u0648\u0639 \u064A\u0646\u0627\u0633\u0628 \u062D\u062C\u0645\u0643\u0645"
        ),
        w2(
          "Commencez par votre contexte : type de structure, territoire, \xE9quipe et priorit\xE9s.",
          "Start with your context: organisation, territory, team and priorities.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0627\u0644\u0633\u064A\u0627\u0642: \u0646\u0648\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A."
        ),
        "preschool"
      ),
      chapter2(
        w2(
          "Connecter les bonnes expertises",
          "Connect the right expertise",
          "\u0631\u0628\u0637 \u0627\u0644\u062E\u0628\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w2(
          "Academy, Quality Check et Partner OS ouvrent des parcours compl\xE9mentaires.",
          "Academy, Quality Check and Partner OS offer complementary pathways.",
          "\u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0648\u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u062A\u0648\u0641\u0631 \u0645\u0633\u0627\u0631\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629."
        ),
        "school"
      ),
      chapter2(
        w2(
          "Pr\xE9parer la mise en \u0153uvre",
          "Prepare implementation",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630"
        ),
        w2(
          "Le diagnostic est le point de d\xE9part pour pr\xE9ciser le p\xE9rim\xE8tre et les conditions du projet.",
          "Assessment is the starting point for clarifying project scope and terms.",
          "\u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0628\u062F\u0627\u064A\u0629 \u0644\u062A\u062D\u062F\u064A\u062F \u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u0634\u0631\u0648\u0637\u0647."
        ),
        "desk"
      )
    ],
    steps: [
      w2("Vos priorit\xE9s", "Your priorities", "\u0623\u0648\u0644\u0648\u064A\u0627\u062A\u0643\u0645"),
      w2("Le diagnostic", "The assessment", "\u0627\u0644\u062A\u0634\u062E\u064A\u0635"),
      w2("Le p\xE9rim\xE8tre convenu", "The agreed scope", "\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647"),
      w2("La mise en \u0153uvre", "Implementation", "\u0627\u0644\u062A\u0646\u0641\u064A\u0630")
    ],
    primary: "establishments/diagnostic",
    primaryLabel: w2(
      "D\xE9marrer mon diagnostic",
      "Start my assessment",
      "\u0628\u062F\u0621 \u062A\u0634\u062E\u064A\u0635 \u0645\u0624\u0633\u0633\u062A\u064A"
    ),
    related: ["academy", "quality-check", "partner-os"]
  },
  hospitality: {
    key: "hospitality",
    label: w2("Hospitality", "Hospitality", "\u0627\u0644\u0636\u064A\u0627\u0641\u0629"),
    eyebrow: w2(
      "L\u2019EXP\xC9RIENCE FAMILLE, VOTRE SIGNATURE",
      "FAMILY EXPERIENCE, YOUR SIGNATURE",
      "\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0628\u0635\u0645\u062A\u0643\u0645"
    ),
    title: w2(
      "Les enfants s\u2019\xE9merveillent. Les familles se souviennent.",
      "Children discover. Families remember.",
      "\u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u064A\u0643\u062A\u0634\u0641\u0648\u0646 \u0648\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u062A\u062A\u0630\u0643\u0631."
    ),
    lead: w2(
      "Kids clubs, garde des enfants des clients et conciergerie famille. Imaginez une exp\xE9rience qui prolonge le plaisir du s\xE9jour, puis \xE9tudiez sa mise en place.",
      "Kids clubs, guest childcare and family concierge. Shape an experience that enriches the stay, then discuss implementation.",
      "\u0646\u0648\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641 \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u064A: \u0635\u0645\u0645\u0648\u0627 \u062A\u062C\u0631\u0628\u0629 \u062A\u062B\u0631\u064A \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u062B\u0645 \u0627\u062F\u0631\u0633\u0648\u0627 \u062A\u0646\u0641\u064A\u0630\u0647\u0627."
    ),
    photo: "hospitality",
    secondaryPhoto: "holidays",
    color: "#d06b06",
    companion: "#f42d78",
    signature: w2(
      "Votre s\xE9jour famille, sc\xE8ne par sc\xE8ne",
      "Your family stay, scene by scene",
      "\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0645\u0634\u0647\u062F\u0627\u064B \u0628\u0645\u0634\u0647\u062F"
    ),
    signatureLead: w2(
      "Explorez les moments d\u2019un s\xE9jour et les parcours correspondants de votre \xE9tablissement.",
      "Explore moments in a stay and your property\u2019s corresponding pathways.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0645\u0646\u0634\u0623\u062A\u0643\u0645."
    ),
    topics: [
      topic2(
        w2("Kids club", "Kids club", "\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644"),
        w2(
          "Un espace pour explorer et cr\xE9er.",
          "A space to explore and create.",
          "\u0645\u0633\u0627\u062D\u0629 \u0644\u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0648\u0627\u0644\u0625\u0628\u062F\u0627\u0639."
        ),
        "kids",
        "games"
      ),
      topic2(
        w2("Guest childcare", "Guest childcare", "\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641"),
        w2(
          "\xC9tudier une garde adapt\xE9e aux clients.",
          "Discuss childcare tailored to guests.",
          "\u062F\u0631\u0627\u0633\u0629 \u0631\u0639\u0627\u064A\u0629 \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u0636\u064A\u0648\u0641."
        ),
        "garde",
        "care"
      ),
      topic2(
        w2("Conciergerie famille", "Family concierge", "\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A"),
        w2(
          "Accompagner la d\xE9couverte du s\xE9jour.",
          "Guide the family\u2019s stay.",
          "\u062A\u0648\u062C\u064A\u0647 \u062A\u062C\u0631\u0628\u0629 \u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629."
        ),
        "famille",
        "family"
      ),
      topic2(
        w2("Programmes saisonniers", "Seasonal programmes", "\u0628\u0631\u0627\u0645\u062C \u0645\u0648\u0633\u0645\u064A\u0629"),
        w2(
          "Pr\xE9parer la prochaine saison ensemble.",
          "Prepare the next season together.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u0642\u0627\u062F\u0645 \u0645\u0639\u0627\u064B."
        ),
        "saison",
        "holidays"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Du check-in aux souvenirs",
          "From check-in to memories",
          "\u0645\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0630\u0643\u0631\u064A\u0627\u062A"
        ),
        w2(
          "Dessinez le parcours famille selon votre propri\xE9t\xE9, vos espaces et vos publics.",
          "Shape the family journey around your property, spaces and guests.",
          "\u0635\u0645\u0645\u0648\u0627 \u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u062D\u0633\u0628 \u0645\u0646\u0634\u0623\u062A\u0643\u0645 \u0648\u0645\u0633\u0627\u062D\u0627\u062A\u0647\u0627 \u0648\u0636\u064A\u0648\u0641\u0647\u0627."
        ),
        "hospitality"
      ),
      chapter2(
        w2(
          "Une saison qui se pr\xE9pare",
          "Prepare for the next season",
          "\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0644\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u0642\u0627\u062F\u0645"
        ),
        w2(
          "Activit\xE9s, capacit\xE9, horaires et langues se pr\xE9cisent dans l\u2019\xE9tude de votre programme.",
          "Activities, capacity, hours and languages are defined in your programme study.",
          "\u062A\u062D\u062F\u062F \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0633\u0639\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u0644\u063A\u0627\u062A \u062E\u0644\u0627\u0644 \u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        "holidays"
      ),
      chapter2(
        w2(
          "Le temps de profiter",
          "Time to enjoy the stay",
          "\u0648\u0642\u062A \u0644\u0644\u0627\u0633\u062A\u0645\u062A\u0627\u0639 \u0628\u0627\u0644\u0625\u0642\u0627\u0645\u0629"
        ),
        w2(
          "D\xE9couvrez les parcours garde clients, kids club et conciergerie sans m\xE9langer leurs conditions.",
          "Explore guest childcare, kids club and concierge with their distinct conditions.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0648\u0627\u0644\u0646\u0627\u062F\u064A \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0645\u0639 \u0634\u0631\u0648\u0637 \u0643\u0644 \u0645\u0633\u0627\u0631."
        ),
        "family"
      )
    ],
    steps: [
      w2("Votre propri\xE9t\xE9", "Your property", "\u0645\u0646\u0634\u0623\u062A\u0643\u0645"),
      w2("Les moments famille", "Family moments", "\u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0639\u0627\u0626\u0644\u0629"),
      w2("L\u2019\xE9tude de programme", "Programme study", "\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C"),
      w2("Le d\xE9ploiement convenu", "Agreed deployment", "\u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "hospitality/request",
    primaryLabel: w2(
      "Imaginer mon programme",
      "Shape my programme",
      "\u062A\u0635\u0645\u064A\u0645 \u0628\u0631\u0646\u0627\u0645\u062C\u064A"
    ),
    related: ["home-services", "academy", "quality-check"]
  },
  "health-partners": {
    key: "health-partners",
    label: w2("Partenaires sant\xE9", "Health Partners", "\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0635\u062D\u0629"),
    eyebrow: w2(
      "PLUS DE PR\xC9SENCE POUR LES FAMILLES",
      "MORE SUPPORT FOR FAMILIES",
      "\u062F\u0639\u0645 \u0623\u0643\u0628\u0631 \u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A"
    ),
    title: w2(
      "Entourer les familles. Avec attention et clart\xE9.",
      "Support families. With care and clarity.",
      "\u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0628\u0627\u0647\u062A\u0645\u0627\u0645 \u0648\u0648\u0636\u0648\u062D."
    ),
    lead: w2(
      "Maternit\xE9s et partenaires : explorez des programmes de soutien familial non m\xE9dical, des ateliers et un accompagnement du quotidien avec un cadre explicite.",
      "Explore non-medical family support programmes, workshops and everyday assistance with clear service boundaries.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0628\u0631\u0627\u0645\u062C \u062F\u0639\u0645 \u0623\u0633\u0631\u064A \u063A\u064A\u0631 \u0637\u0628\u064A \u0648\u0648\u0631\u0634\u0627\u062A \u0648\u0645\u0633\u0627\u0639\u062F\u0629 \u064A\u0648\u0645\u064A\u0629 \u0636\u0645\u0646 \u0625\u0637\u0627\u0631 \u062E\u062F\u0645\u0629 \u0648\u0627\u0636\u062D."
    ),
    photo: "health",
    secondaryPhoto: "newborn",
    color: "#00886d",
    companion: "#f42d78",
    signature: w2(
      "Le parcours d\u2019accompagnement familial",
      "The family-support pathway",
      "\u0645\u0633\u0627\u0631 \u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0629"
    ),
    signatureLead: w2(
      "Pr\xE9parer, accueillir, accompagner : explorez les besoins puis le p\xE9rim\xE8tre du programme.",
      "Prepare, welcome and support: explore needs and the programme scope.",
      "\u0625\u0639\u062F\u0627\u062F \u0648\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u062F\u0639\u0645: \u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0648\u0646\u0637\u0627\u0642 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
    ),
    topics: [
      topic2(
        w2("Mother & Baby Care", "Mother & Baby Care", "\u062F\u0639\u0645 \u0627\u0644\u0623\u0645 \u0648\u0627\u0644\u0637\u0641\u0644"),
        w2(
          "Pr\xE9sence et soutien quotidien non m\xE9dical.",
          "Everyday presence and non-medical support.",
          "\u062D\u0636\u0648\u0631 \u0648\u062F\u0639\u0645 \u064A\u0648\u0645\u064A \u063A\u064A\u0631 \u0637\u0628\u064A."
        ),
        "baby",
        "newborn"
      ),
      topic2(
        w2("Soutien parental", "Parent support", "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646"),
        w2(
          "\xC9couter et orienter avec clart\xE9.",
          "Listen and guide with clarity.",
          "\u0627\u0644\u0627\u0633\u062A\u0645\u0627\u0639 \u0648\u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u0628\u0648\u0636\u0648\u062D."
        ),
        "parent",
        "family"
      ),
      topic2(
        w2("Ateliers familles", "Family workshops", "\u0648\u0631\u0634\u0627\u062A \u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A"),
        w2(
          "Des moments d\u2019information et de d\xE9couverte.",
          "Moments of information and discovery.",
          "\u0644\u062D\u0638\u0627\u062A \u0644\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641."
        ),
        "atelier",
        "academy"
      ),
      topic2(
        w2("Programmes partenaires", "Partner programmes", "\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0634\u0631\u0643\u0627\u0621"),
        w2(
          "Un cadre \xE0 \xE9tudier avec votre structure.",
          "A scope to discuss with your organisation.",
          "\u0646\u0637\u0627\u0642 \u0644\u0644\u062F\u0631\u0627\u0633\u0629 \u0645\u0639 \u0645\u0624\u0633\u0633\u062A\u0643\u0645."
        ),
        "programme",
        "support"
      )
    ],
    chapters: [
      chapter2(
        w2("Une pr\xE9sence qui compte", "Support that matters", "\u062F\u0639\u0645 \u0644\u0647 \u0642\u064A\u0645\u0629"),
        w2(
          "L\u2019accompagnement propos\xE9 concerne le quotidien familial et reste strictement non m\xE9dical.",
          "Support concerns family life and remains strictly non-medical.",
          "\u0627\u0644\u062F\u0639\u0645 \u064A\u062E\u0635 \u0627\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u0623\u0633\u0631\u064A\u0629 \u0648\u064A\u0628\u0642\u0649 \u063A\u064A\u0631 \u0637\u0628\u064A."
        ),
        "health"
      ),
      chapter2(
        w2(
          "Des limites expliqu\xE9es",
          "Clear service boundaries",
          "\u062D\u062F\u0648\u062F \u062E\u062F\u0645\u0629 \u0648\u0627\u0636\u062D\u0629"
        ),
        w2(
          "Consentement, confidentialit\xE9 et p\xE9rim\xE8tre de service se v\xE9rifient avant l\u2019engagement.",
          "Consent, privacy and scope are checked before engagement.",
          "\u062A\u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645."
        ),
        "newborn"
      ),
      chapter2(
        w2(
          "Relier les besoins aux bons parcours",
          "Connect needs to the right pathways",
          "\u0631\u0628\u0637 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0628\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w2(
          "Les familles et les structures ont des demandes diff\xE9rentes : choisissez le parcours qui vous correspond.",
          "Families and organisations have different needs: choose your appropriate pathway.",
          "\u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629: \u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
        ),
        "family"
      )
    ],
    steps: [
      w2("Le besoin familial", "Family need", "\u0627\u062D\u062A\u064A\u0627\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u0629"),
      w2("Le consentement", "Consent", "\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629"),
      w2("Le p\xE9rim\xE8tre non m\xE9dical", "Non-medical scope", "\u0627\u0644\u0646\u0637\u0627\u0642 \u063A\u064A\u0631 \u0627\u0644\u0637\u0628\u064A"),
      w2("Le programme convenu", "Agreed programme", "\u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "health-partners/request",
    primaryLabel: w2(
      "\xC9tudier mon programme",
      "Discuss my programme",
      "\u062F\u0631\u0627\u0633\u0629 \u0628\u0631\u0646\u0627\u0645\u062C\u064A"
    ),
    related: ["home-services", "families", "academy"]
  },
  corporates: {
    key: "corporates",
    label: w2("Entreprises", "Corporate", "\u0627\u0644\u0634\u0631\u0643\u0627\u062A"),
    eyebrow: w2(
      "PRENDRE SOIN DES FAMILLES, SOUTENIR LES \xC9QUIPES",
      "SUPPORT FAMILIES, SUPPORT YOUR PEOPLE",
      "\u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0648\u062F\u0639\u0645 \u0627\u0644\u0641\u0631\u0642"
    ),
    title: w2(
      "Un avantage employeur qui entre dans la vraie vie.",
      "An employee benefit that fits real life.",
      "\u0645\u064A\u0632\u0629 \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u062A\u0644\u0627\u0626\u0645 \u062D\u064A\u0627\u062A\u0647\u0645 \u0627\u0644\u0641\u0639\u0644\u064A\u0629."
    ),
    lead: w2(
      "Soutien parental, garde de secours, family days et programmes collaborateurs. Pr\xE9parez une exp\xE9rience famille \xE0 la hauteur de votre culture d\u2019entreprise.",
      "Parent support, backup childcare, family days and employee programmes. Prepare a family experience that reflects your company culture.",
      "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646 \u0648\u0631\u0639\u0627\u064A\u0629 \u0628\u062F\u064A\u0644\u0629 \u0648\u0623\u064A\u0627\u0645 \u0639\u0627\u0626\u0644\u064A\u0629 \u0648\u0628\u0631\u0627\u0645\u062C \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u062A\u0646\u0627\u0633\u0628 \u062B\u0642\u0627\u0641\u0629 \u0634\u0631\u0643\u062A\u0643\u0645."
    ),
    photo: "corporate",
    secondaryPhoto: "family",
    color: "#0873d9",
    companion: "#f42d78",
    signature: w2(
      "Le designer d\u2019avantages familles",
      "The family-benefits designer",
      "\u0645\u0635\u0645\u0645 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0623\u0633\u0631\u064A\u0629"
    ),
    signatureLead: w2(
      "Composez vos priorit\xE9s RH. Votre s\xE9lection pr\xE9pare la discussion ; aucun budget ni quota n\u2019est cr\xE9\xE9 ici.",
      "Choose HR priorities to prepare a discussion. This does not create a budget or entitlement.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629 \u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0646\u0642\u0627\u0634 \u062F\u0648\u0646 \u0625\u0646\u0634\u0627\u0621 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0623\u0648 \u0627\u0633\u062A\u062D\u0642\u0627\u0642."
    ),
    topics: [
      topic2(
        w2("Garde de secours", "Backup childcare", "\u0631\u0639\u0627\u064A\u0629 \u0628\u062F\u064A\u0644\u0629"),
        w2(
          "\xC9tudier les impr\xE9vus de la vie familiale.",
          "Plan for unexpected family needs.",
          "\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0645\u0641\u0627\u062C\u0626\u0629."
        ),
        "garde",
        "care"
      ),
      topic2(
        w2("Parentalit\xE9", "Parent support", "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646"),
        w2(
          "Accompagner les moments qui comptent.",
          "Support the moments that matter.",
          "\u062F\u0639\u0645 \u0627\u0644\u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0645\u0647\u0645\u0629."
        ),
        "parent",
        "newborn"
      ),
      topic2(
        w2("Family days", "Family days", "\u0623\u064A\u0627\u0645 \u0639\u0627\u0626\u0644\u064A\u0629"),
        w2(
          "Partager un autre moment avec les \xE9quipes.",
          "Share a different moment with your teams.",
          "\u0645\u0634\u0627\u0631\u0643\u0629 \u0644\u062D\u0638\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629 \u0645\u0639 \u0627\u0644\u0641\u0631\u0642."
        ),
        "famille",
        "family"
      ),
      topic2(
        w2("Programme collaborateurs", "Employee programme", "\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646"),
        w2(
          "\xC9ligibilit\xE9 et contribution \xE0 pr\xE9ciser ensemble.",
          "Define eligibility and contributions together.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0645\u0639\u0627\u064B."
        ),
        "programme",
        "corporate"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Une politique RH plus proche du quotidien",
          "HR policy closer to everyday life",
          "\u0633\u064A\u0627\u0633\u0629 \u0645\u0648\u0627\u0631\u062F \u0628\u0634\u0631\u064A\u0629 \u0623\u0642\u0631\u0628 \u0644\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629"
        ),
        w2(
          "Commencez par vos populations et leurs besoins, puis d\xE9finissez le cadre du programme.",
          "Start with your people and their needs, then define the programme scope.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0648\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A\u0647\u0645 \u062B\u0645 \u062D\u062F\u062F\u0648\u0627 \u0625\u0637\u0627\u0631 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        "corporate"
      ),
      chapter2(
        w2(
          "Un cadre lisible pour les collaborateurs",
          "Clear terms for employees",
          "\u0634\u0631\u0648\u0637 \u0648\u0627\u0636\u062D\u0629 \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646"
        ),
        w2(
          "\xC9ligibilit\xE9, contribution et modalit\xE9s d\u2019acc\xE8s doivent \xEAtre convenues avant l\u2019activation.",
          "Eligibility, contributions and access terms are agreed before activation.",
          "\u062A\u062A\u0641\u0642 \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0627\u062A \u0648\u0634\u0631\u0648\u0637 \u0627\u0644\u0648\u0635\u0648\u0644 \u0642\u0628\u0644 \u0627\u0644\u062A\u0641\u0639\u064A\u0644."
        ),
        "family"
      ),
      chapter2(
        w2(
          "Connecter les bonnes solutions",
          "Connect the right solutions",
          "\u0631\u0628\u0637 \u0627\u0644\u062D\u0644\u0648\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w2(
          "D\xE9couvrez les offres de ce catalogue et pr\xE9parez une demande adapt\xE9e \xE0 votre entreprise.",
          "Explore this catalogue and prepare a request for your company.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0623\u0639\u062F\u0648\u0627 \u0637\u0644\u0628\u0627\u064B \u064A\u0646\u0627\u0633\u0628 \u0634\u0631\u0643\u062A\u0643\u0645."
        ),
        "desk"
      )
    ],
    steps: [
      w2("Les populations concern\xE9es", "Eligible populations", "\u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u0639\u0646\u064A\u0629"),
      w2(
        "Les besoins prioritaires",
        "Priority needs",
        "\u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0630\u0627\u062A \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629"
      ),
      w2("Les r\xE8gles convenues", "Agreed rules", "\u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627"),
      w2("L\u2019activation du programme", "Programme activation", "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C")
    ],
    primary: "corporates/request",
    primaryLabel: w2(
      "Cr\xE9er mon projet familles",
      "Start my family-benefits project",
      "\u0628\u062F\u0621 \u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0623\u0633\u0631\u064A\u0629"
    ),
    related: ["home-services", "partner-os", "hospitality"]
  },
  "partner-os": {
    key: "partner-os",
    label: w2("Partner OS", "Partner OS", "Partner OS"),
    eyebrow: w2(
      "VOTRE ORGANISATION, MIEUX CONNECT\xC9E",
      "YOUR ORGANISATION, BETTER CONNECTED",
      "\u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0623\u0643\u062B\u0631 \u062A\u0631\u0627\u0628\u0637\u0627\u064B"
    ),
    title: w2(
      "Une nouvelle perspective sur votre quotidien.",
      "A new perspective on everyday operations.",
      "\u0645\u0646\u0638\u0648\u0631 \u062C\u062F\u064A\u062F \u0644\u0644\u0639\u0645\u0644 \u0627\u0644\u064A\u0648\u0645\u064A."
    ),
    lead: w2(
      "Explorez les plans publi\xE9s, les modules d\xE9clar\xE9s et les parcours d\u2019activation. Trouvez le cadre qui correspond \xE0 votre organisation, sans perdre la ma\xEEtrise des conditions.",
      "Explore published plans, declared modules and activation pathways. Find the right fit while keeping terms clear.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062E\u0637\u0637 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0646\u0629 \u0648\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
    ),
    photo: "desk",
    secondaryPhoto: "school",
    color: "#087da7",
    companion: "#7539d9",
    signature: w2(
      "L\u2019explorateur de plans Partner OS",
      "The Partner OS plan explorer",
      "\u0645\u0633\u062A\u0643\u0634\u0641 \u062E\u0637\u0637 Partner OS"
    ),
    signatureLead: w2(
      "Comparez les prix et p\xE9riodes r\xE9ellement publi\xE9s. Une d\xE9monstration pr\xE9pare votre configuration.",
      "Compare actual published prices and billing periods. A demonstration helps prepare your configuration.",
      "\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0641\u062A\u0631\u0627\u062A \u0627\u0644\u0641\u0648\u062A\u0631\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629. \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A \u064A\u0633\u0627\u0639\u062F \u0641\u064A \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0647\u064A\u0626\u0629."
    ),
    topics: [
      topic2(
        w2("Organisation", "Organisation", "\u0627\u0644\u062A\u0646\u0638\u064A\u0645"),
        w2(
          "Explorer la structure des plans.",
          "Explore how plans are structured.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0628\u0646\u064A\u0629 \u0627\u0644\u062E\u0637\u0637."
        ),
        "organisation",
        "desk"
      ),
      topic2(
        w2("\xC9quipes", "Teams", "\u0627\u0644\u0641\u0631\u0642"),
        w2(
          "\xC9tudier les besoins de vos collaborateurs.",
          "Discuss your team\u2019s needs.",
          "\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0641\u0631\u064A\u0642\u0643\u0645."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic2(
        w2("Modules", "Modules", "\u0627\u0644\u0648\u062D\u062F\u0627\u062A"),
        w2(
          "V\xE9rifier ce qui est inclus dans l\u2019offre.",
          "Check what an offer includes.",
          "\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0627 \u064A\u062A\u0636\u0645\u0646\u0647 \u0627\u0644\u0639\u0631\u0636."
        ),
        "module",
        "digital"
      ),
      topic2(
        w2("Activation", "Activation", "\u0627\u0644\u062A\u0641\u0639\u064A\u0644"),
        w2(
          "Pr\xE9parer votre parcours avec l\u2019\xE9quipe.",
          "Prepare your journey with the team.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0633\u0627\u0631 \u0645\u0639 \u0627\u0644\u0641\u0631\u064A\u0642."
        ),
        "plan",
        "school"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Voir clair avant d\u2019activer",
          "Get clarity before activation",
          "\u0648\u0636\u0648\u062D \u0642\u0628\u0644 \u0627\u0644\u062A\u0641\u0639\u064A\u0644"
        ),
        w2(
          "Consultez les modules, les limites et les conditions propres au plan publi\xE9.",
          "Check the modules, limits and terms of the published plan.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0627\u0644\u062D\u062F\u0648\u062F \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629."
        ),
        "desk"
      ),
      chapter2(
        w2(
          "Comparer sans extrapoler",
          "Compare actual terms",
          "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u0641\u0639\u0644\u064A\u0629"
        ),
        w2(
          "Un prix mensuel et un prix annuel restent deux conditions distinctes. Aucun tarif annuel n\u2019est calcul\xE9 ici.",
          "Monthly and annual prices are separate terms. No annual price is calculated here.",
          "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0634\u0647\u0631\u064A \u0648\u0627\u0644\u0633\u0646\u0648\u064A \u0634\u0631\u0637\u0627\u0646 \u0645\u062E\u062A\u0644\u0641\u0627\u0646 \u0648\u0644\u0627 \u064A\u062D\u0633\u0628 \u0633\u0639\u0631 \u0633\u0646\u0648\u064A \u0647\u0646\u0627."
        ),
        "digital"
      ),
      chapter2(
        w2(
          "Une d\xE9monstration \xE0 votre contexte",
          "A demonstration for your context",
          "\u0639\u0631\u0636 \u062A\u0648\u0636\u064A\u062D\u064A \u064A\u0646\u0627\u0633\u0628 \u0633\u064A\u0627\u0642\u0643\u0645"
        ),
        w2(
          "Pr\xE9parez vos questions puis d\xE9marrez la demande de d\xE9monstration existante.",
          "Prepare your questions and start the demonstration request.",
          "\u0623\u0639\u062F\u0648\u0627 \u0623\u0633\u0626\u0644\u062A\u0643\u0645 \u0648\u0627\u0628\u062F\u0624\u0648\u0627 \u0637\u0644\u0628 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A."
        ),
        "school"
      )
    ],
    steps: [
      w2("Votre organisation", "Your organisation", "\u0645\u0624\u0633\u0633\u062A\u0643\u0645"),
      w2("Le plan adapt\xE9", "The suitable plan", "\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"),
      w2("La d\xE9monstration", "The demonstration", "\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A"),
      w2("L\u2019activation convenue", "Agreed activation", "\u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "partner-os/contact",
    primaryLabel: w2(
      "Demander une d\xE9monstration",
      "Request a demonstration",
      "\u0637\u0644\u0628 \u0639\u0631\u0636 \u062A\u0648\u0636\u064A\u062D\u064A"
    ),
    related: ["establishments", "quality-check", "corporates"]
  },
  "quality-check": {
    key: "quality-check",
    label: w2("Quality Check 360", "Quality Check 360", "Quality Check 360"),
    eyebrow: w2(
      "FAIRE DE LA QUALIT\xC9 UNE DIRECTION",
      "MAKE QUALITY YOUR DIRECTION",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u062C\u0647\u062A\u0643\u0645"
    ),
    title: w2(
      "Voir plus clair. D\xE9cider mieux. Avancer.",
      "See clearly. Decide better. Move forward.",
      "\u0631\u0624\u064A\u0629 \u0623\u0648\u0636\u062D \u0648\u0642\u0631\u0627\u0631\u0627\u062A \u0623\u0641\u0636\u0644 \u0648\u062A\u0642\u062F\u0645."
    ),
    lead: w2(
      "\xC9valuations, r\xE9f\xE9rentiels et accompagnement de la qualit\xE9. Explorez le p\xE9rim\xE8tre d\u2019une \xE9valuation et pr\xE9parez les questions qui comptent pour votre organisation.",
      "Explore assessments, frameworks and quality support. Define an assessment scope and prepare the questions that matter.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0637\u0631 \u0648\u062F\u0639\u0645 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u062D\u062F\u062F\u0648\u0627 \u0646\u0637\u0627\u0642 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0647\u0645\u0629."
    ),
    photo: "support",
    secondaryPhoto: "school",
    color: "#00876b",
    companion: "#0873d9",
    signature: w2(
      "La boussole de votre \xE9valuation",
      "Your assessment compass",
      "\u0628\u0648\u0635\u0644\u0629 \u062A\u0642\u064A\u064A\u0645 \u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    signatureLead: w2(
      "Choisissez les dimensions \xE0 discuter. Ce rep\xE9rage ne d\xE9livre aucun score ni certificat.",
      "Choose dimensions to discuss. This preparation does not issue a score or certificate.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629. \u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0644\u0627 \u064A\u0645\u0646\u062D \u0646\u062A\u064A\u062C\u0629 \u0623\u0648 \u0634\u0647\u0627\u062F\u0629."
    ),
    topics: [
      topic2(
        w2("Cadre & organisation", "Framework & operations", "\u0627\u0644\u0625\u0637\u0627\u0631 \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645"),
        w2(
          "Rendre le p\xE9rim\xE8tre lisible.",
          "Make the scope clear.",
          "\u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0646\u0637\u0627\u0642."
        ),
        "organisation",
        "desk"
      ),
      topic2(
        w2("S\xE9curit\xE9 & pratiques", "Safety & practice", "\u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"),
        w2(
          "Explorer les crit\xE8res de l\u2019\xE9valuation.",
          "Explore assessment criteria.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062A\u0642\u064A\u064A\u0645."
        ),
        "s\xE9curit\xE9",
        "support"
      ),
      topic2(
        w2("\xC9quipes & comp\xE9tences", "Teams & skills", "\u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w2(
          "Identifier les sujets \xE0 approfondir.",
          "Identify topics to explore further.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0648\u0627\u0636\u064A\u0639 \u0644\u0644\u062A\u0639\u0645\u0642."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic2(
        w2("Am\xE9lioration", "Improvement", "\u0627\u0644\u062A\u062D\u0633\u064A\u0646"),
        w2(
          "Pr\xE9parer des prochaines \xE9tapes discut\xE9es.",
          "Prepare the next steps to discuss.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629."
        ),
        "qualit\xE9",
        "school"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Commencer par les bonnes questions",
          "Start with the right questions",
          "\u0627\u0644\u0628\u062F\u0621 \u0628\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629"
        ),
        w2(
          "Identifiez le contexte, les documents et les domaines utiles \xE0 votre demande.",
          "Identify the context, documents and areas relevant to your request.",
          "\u062D\u062F\u062F\u0648\u0627 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0648\u0627\u0644\u0645\u062C\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0637\u0644\u0628\u0643\u0645."
        ),
        "support"
      ),
      chapter2(
        w2(
          "Des preuves avant les conclusions",
          "Evidence before conclusions",
          "\u0627\u0644\u0623\u062F\u0644\u0629 \u0642\u0628\u0644 \u0627\u0644\u0627\u0633\u062A\u0646\u062A\u0627\u062C\u0627\u062A"
        ),
        w2(
          "Les r\xE9sultats et scores appartiennent \xE0 une \xE9valuation r\xE9elle ; ce storefront pr\xE9sente les parcours disponibles.",
          "Results and scores come from real assessments; this page presents available pathways.",
          "\u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0645\u0646 \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0641\u0639\u0644\u064A\u0629 \u0648\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u062A\u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629."
        ),
        "school"
      ),
      chapter2(
        w2(
          "Lier qualit\xE9 et progression",
          "Connect quality and progress",
          "\u0631\u0628\u0637 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u0642\u062F\u0645"
        ),
        w2(
          "Explorez Academy et Partner OS pour compl\xE9ter votre projet d\u2019am\xE9lioration.",
          "Explore Academy and Partner OS to complement your improvement project.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u0644\u062A\u0643\u0645\u0644\u0629 \u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u062A\u062D\u0633\u064A\u0646."
        ),
        "desk"
      )
    ],
    steps: [
      w2("D\xE9finir le p\xE9rim\xE8tre", "Define scope", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0646\u0637\u0627\u0642"),
      w2("Pr\xE9parer les preuves", "Prepare evidence", "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0623\u062F\u0644\u0629"),
      w2("R\xE9aliser l\u2019\xE9valuation", "Conduct assessment", "\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u062A\u0642\u064A\u064A\u0645"),
      w2(
        "\xC9tudier les prochaines actions",
        "Discuss next actions",
        "\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
      )
    ],
    primary: "establishments/quality-check-360",
    primaryLabel: w2(
      "Explorer l\u2019\xE9valuation 360",
      "Explore the 360 assessment",
      "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u062A\u0642\u064A\u064A\u0645 360"
    ),
    related: ["establishments", "academy", "partner-os"]
  },
  professionals: {
    key: "professionals",
    label: w2("Professionnels", "Professionals", "\u0627\u0644\u0645\u0647\u0646\u064A\u0648\u0646"),
    eyebrow: w2(
      "VOTRE TALENT, UN NOUVEL HORIZON",
      "YOUR TALENT, A NEW HORIZON",
      "\u0645\u0648\u0647\u0628\u062A\u0643\u0645 \u0648\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629"
    ),
    title: w2(
      "Faites de votre prochaine \xE9tape une vraie ambition.",
      "Make your next step a real ambition.",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0637\u0645\u0648\u062D\u0627\u064B \u062D\u0642\u064A\u0642\u064A\u0627\u064B."
    ),
    lead: w2(
      "Formation, comp\xE9tences et parcours professionnels : explorez les offres publi\xE9es et pr\xE9parez un projet qui valorise votre engagement aupr\xE8s des enfants et des familles.",
      "Explore published training and professional pathways and prepare a project that values your commitment to children and families.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0623\u0639\u062F\u0648\u0627 \u0645\u0634\u0631\u0648\u0639\u0627\u064B \u064A\u062B\u0645\u0646 \u0627\u0644\u062A\u0632\u0627\u0645\u0643\u0645 \u062A\u062C\u0627\u0647 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A."
    ),
    photo: "professional",
    secondaryPhoto: "academy",
    color: "#7539d9",
    companion: "#f42d78",
    signature: w2(
      "La carte de votre prochaine \xE9tape",
      "Your next-step map",
      "\u062E\u0631\u064A\u0637\u0629 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
    ),
    signatureLead: w2(
      "Choisissez votre axe de progression. Les opportunit\xE9s et conditions restent celles des offres publi\xE9es.",
      "Choose a direction for growth. Opportunities and terms come from published offers.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u062A\u0642\u062F\u0645\u060C \u0645\u0639 \u0641\u0631\u0635 \u0648\u0634\u0631\u0648\u0637 \u062D\u0633\u0628 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629."
    ),
    topics: [
      topic2(
        w2("Accompagnement enfance", "Childcare practice", "\u062F\u0639\u0645 \u0627\u0644\u0637\u0641\u0648\u0644\u0629"),
        w2(
          "Explorer les comp\xE9tences du terrain.",
          "Explore hands-on skills.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629."
        ),
        "enfance",
        "care"
      ),
      topic2(
        w2("P\xE9dagogie", "Education", "\u0627\u0644\u062A\u0631\u0628\u064A\u0629"),
        w2(
          "Donner du sens aux activit\xE9s.",
          "Bring purpose to activities.",
          "\u0645\u0646\u062D \u0647\u062F\u0641 \u0644\u0644\u0623\u0646\u0634\u0637\u0629."
        ),
        "montessori",
        "montessori"
      ),
      topic2(
        w2("Formation & parcours", "Training & pathways", "\u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A"),
        w2(
          "Pr\xE9parer votre prochaine comp\xE9tence.",
          "Prepare your next skill.",
          "\u0625\u0639\u062F\u0627\u062F \u0645\u0647\u0627\u0631\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
        ),
        "formation",
        "academy"
      ),
      topic2(
        w2("Projet professionnel", "Professional project", "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0647\u0646\u064A"),
        w2(
          "Identifier le parcours qui vous correspond.",
          "Find the pathway that fits.",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
        ),
        "profession",
        "professional"
      )
    ],
    chapters: [
      chapter2(
        w2(
          "Votre engagement a de la valeur",
          "Your commitment has value",
          "\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0643\u0645 \u0642\u064A\u0645\u0629"
        ),
        w2(
          "Explorez les parcours adapt\xE9s \xE0 vos objectifs et au contexte dans lequel vous souhaitez exercer.",
          "Explore pathways for your goals and intended work context.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0645\u0633\u0627\u0631\u0627\u062A \u062A\u0646\u0627\u0633\u0628 \u0623\u0647\u062F\u0627\u0641\u0643\u0645 \u0648\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628."
        ),
        "professional"
      ),
      chapter2(
        w2(
          "Renforcer sa pratique",
          "Strengthen your practice",
          "\u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"
        ),
        w2(
          "Les contenus, pr\xE9requis et conditions d\u2019\xE9valuation se consultent dans chaque offre.",
          "Check content, prerequisites and assessment conditions in each offer.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0641\u064A \u0643\u0644 \u0639\u0631\u0636."
        ),
        "academy"
      ),
      chapter2(
        w2(
          "Choisir la bonne prochaine \xE9tape",
          "Choose the right next step",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062E\u0637\u0648\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w2(
          "Une demande Academy permet d\u2019\xE9tudier un parcours. Elle ne constitue pas une promesse d\u2019emploi.",
          "An Academy request helps discuss a pathway and does not promise employment.",
          "\u0637\u0644\u0628 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0645\u0633\u0627\u0631 \u0648\u0644\u0627 \u064A\u0645\u062B\u0644 \u0648\u0639\u062F\u0627\u064B \u0628\u0627\u0644\u062A\u0648\u0638\u064A\u0641."
        ),
        "care"
      )
    ],
    steps: [
      w2("Votre projet", "Your project", "\u0645\u0634\u0631\u0648\u0639\u0643\u0645"),
      w2("Les comp\xE9tences vis\xE9es", "Target skills", "\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629"),
      w2("Le parcours adapt\xE9", "The suitable pathway", "\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628"),
      w2("Les conditions de l\u2019offre", "Offer conditions", "\u0634\u0631\u0648\u0637 \u0627\u0644\u0639\u0631\u0636")
    ],
    primary: "academy/request",
    primaryLabel: w2(
      "Pr\xE9parer mon parcours professionnel",
      "Prepare my professional pathway",
      "\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0627\u0631\u064A \u0627\u0644\u0645\u0647\u0646\u064A"
    ),
    related: ["academy", "development", "home-services"]
  }
};
var C2 = {
  explore: w2("Explorer les offres", "Explore offers", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0639\u0631\u0648\u0636"),
  all: w2("Tout explorer", "Explore all", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0643\u0644"),
  catalogue: w2(
    "La s\xE9lection \xE0 explorer",
    "Your discovery selection",
    "\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0644\u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641"
  ),
  search: w2(
    "Une envie, un mot, un objectif\u2026",
    "An interest, a word, a goal\u2026",
    "\u0627\u0647\u062A\u0645\u0627\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0623\u0648 \u0647\u062F\u0641\u2026"
  ),
  discover: w2("D\xE9couvrir", "Discover", "\u0627\u0643\u062A\u0634\u0641"),
  featured: w2(
    "\xC0 la une de cet univers",
    "In the spotlight",
    "\u0641\u064A \u0648\u0627\u062C\u0647\u0629 \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0644\u0645"
  ),
  topics: w2(
    "Entrez par ce qui vous inspire",
    "Start with what inspires you",
    "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0645\u0627 \u064A\u0644\u0647\u0645\u0643\u0645"
  ),
  editorial: w2("De nouvelles perspectives", "New perspectives", "\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629"),
  collections: w2(
    "Des collections pour vous guider",
    "Collections to guide you",
    "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0644\u062A\u0648\u062C\u064A\u0647\u0643\u0645"
  ),
  published: w2("offres publi\xE9es", "published offers", "\u0639\u0631\u0648\u0636 \u0645\u0646\u0634\u0648\u0631\u0629"),
  resources: w2(
    "Ressources & programmes publi\xE9s",
    "Published resources & programmes",
    "\u0645\u0648\u0627\u0631\u062F \u0648\u0628\u0631\u0627\u0645\u062C \u0645\u0646\u0634\u0648\u0631\u0629"
  ),
  empty: w2(
    "Ce catalogue se pr\xE9pare. Les offres apparaissent ici d\xE8s leur publication.",
    "This catalogue is being prepared. Offers appear here when published.",
    "\u0647\u0630\u0627 \u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C \u0642\u064A\u062F \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u060C \u0648\u062A\u0638\u0647\u0631 \u0627\u0644\u0639\u0631\u0648\u0636 \u0639\u0646\u062F \u0646\u0634\u0631\u0647\u0627."
  ),
  noMatch: w2(
    "Aucune offre ne correspond \xE0 ces crit\xE8res. Essayez une s\xE9lection plus large.",
    "No offers match these criteria. Try a broader selection.",
    "\u0644\u0627 \u0639\u0631\u0648\u0636 \u062A\u0637\u0627\u0628\u0642 \u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631. \u062C\u0631\u0628\u0648\u0627 \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u064B \u0623\u0648\u0633\u0639."
  ),
  emptyResources: w2(
    "Les ressources publi\xE9es seront pr\xE9sent\xE9es ici.",
    "Published resources will appear here.",
    "\u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0647\u0646\u0627."
  ),
  reset: w2("Tout r\xE9initialiser", "Reset all", "\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u0627\u0644\u0643\u0644"),
  more: w2("Afficher plus d\u2019offres", "Show more offers", "\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F"),
  save: w2("Enregistrer", "Save", "\u062D\u0641\u0638"),
  saved: w2("Enregistr\xE9", "Saved", "\u0645\u062D\u0641\u0648\u0638"),
  compare: w2("Comparer", "Compare", "\u0645\u0642\u0627\u0631\u0646\u0629"),
  compareTitle: w2(
    "Le bon choix se voit dans les d\xE9tails",
    "The right choice is in the details",
    "\u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0641\u064A \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644"
  ),
  remove: w2("Retirer", "Remove", "\u0625\u0632\u0627\u0644\u0629"),
  compareEmpty: w2(
    "Ajoutez jusqu\u2019\xE0 quatre offres avec le bouton Comparer.",
    "Add up to four offers using Compare.",
    "\u0623\u0636\u064A\u0641\u0648\u0627 \u062D\u062A\u0649 \u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629."
  ),
  continue: w2(
    "Retrouvez le fil de votre d\xE9couverte",
    "Pick up where you left off",
    "\u062A\u0627\u0628\u0639\u0648\u0627 \u0645\u0646 \u062D\u064A\u062B \u062A\u0648\u0642\u0641\u062A\u0645"
  ),
  recent: w2("Vus r\xE9cemment", "Recently viewed", "\u0634\u0648\u0647\u062F\u062A \u0645\u0624\u062E\u0631\u0627\u064B"),
  savedEmpty: w2(
    "Gardez vos coups de c\u0153ur avec le bouton Enregistrer.",
    "Keep your favourites using Save.",
    "\u0627\u062D\u062A\u0641\u0638\u0648\u0627 \u0628\u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u062D\u0641\u0638."
  ),
  recentEmpty: w2(
    "Les fiches que vous ouvrez appara\xEEtront ici.",
    "Offer pages you open will appear here.",
    "\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062A\u064A \u062A\u0641\u062A\u062D\u0648\u0646\u0647\u0627 \u0633\u062A\u0638\u0647\u0631 \u0647\u0646\u0627."
  ),
  selectionError: w2(
    "La s\xE9lection n\u2019a pas pu \xEAtre enregistr\xE9e. R\xE9essayez.",
    "The selection could not be saved. Try again.",
    "\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631. \u062D\u0627\u0648\u0644\u0648\u0627 \u0645\u062C\u062F\u062F\u0627\u064B."
  ),
  compareLimit: w2(
    "Quatre offres maximum. Retirez une offre avant d\u2019en ajouter une autre.",
    "Four offers maximum. Remove one before adding another.",
    "\u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636 \u0643\u062D\u062F \u0623\u0642\u0635\u0649. \u0623\u0632\u064A\u0644\u0648\u0627 \u0639\u0631\u0636\u0627\u064B \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0622\u062E\u0631."
  ),
  trust: w2(
    "Les d\xE9tails qui vous aident \xE0 d\xE9cider",
    "Details that help you decide",
    "\u062A\u0641\u0627\u0635\u064A\u0644 \u062A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0627\u0631"
  ),
  trustLead: w2(
    "Consultez le contenu, le prix, le p\xE9rim\xE8tre et les conditions de l\u2019offre avant de poursuivre.",
    "Check content, price, scope and offer conditions before continuing.",
    "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0633\u0639\u0631 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0642\u0628\u0644 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629."
  ),
  journey: w2(
    "Votre prochaine \xE9tape, en toute clart\xE9",
    "A clear next step",
    "\u062E\u0637\u0648\u0629 \u0642\u0627\u062F\u0645\u0629 \u0648\u0627\u0636\u062D\u0629"
  ),
  related: w2(
    "Votre d\xE9couverte ne s\u2019arr\xEAte pas ici",
    "There is more to discover",
    "\u0627\u0644\u0645\u0632\u064A\u062F \u064A\u0646\u062A\u0638\u0631 \u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641"
  ),
  faq: w2(
    "Les r\xE9ponses avant de choisir",
    "Answers before you choose",
    "\u0625\u062C\u0627\u0628\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631"
  ),
  final: w2(
    "Votre prochaine \xE9tape commence ici.",
    "Your next step starts here.",
    "\u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u062A\u0628\u062F\u0623 \u0647\u0646\u0627."
  ),
  price: w2("Prix", "Price", "\u0627\u0644\u0633\u0639\u0631"),
  format: w2("Format", "Format", "\u0627\u0644\u0634\u0643\u0644"),
  age: w2("\xC2ge", "Age", "\u0627\u0644\u0639\u0645\u0631"),
  contents: w2("Contenu publi\xE9", "Published contents", "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0646\u0634\u0648\u0631"),
  conditions: w2("Consulter les conditions", "See conditions", "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0634\u0631\u0648\u0637"),
  available: w2("Disponible", "Available", "\u0645\u062A\u0627\u062D"),
  limited: w2("Disponibilit\xE9 limit\xE9e", "Limited availability", "\u062A\u0648\u0641\u0631 \u0645\u062D\u062F\u0648\u062F"),
  unavailable: w2(
    "Indisponible actuellement",
    "Currently unavailable",
    "\u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B"
  ),
  quote: w2("Proposition \xE0 \xE9tudier", "Discuss a proposal", "\u062F\u0631\u0627\u0633\u0629 \u0639\u0631\u0636"),
  noPrice: w2("Prix \xE0 confirmer", "Price to confirm", "\u0627\u0644\u0633\u0639\u0631 \u0644\u0644\u062A\u0623\u0643\u064A\u062F"),
  from: w2("D\xE8s", "From", "\u0627\u0628\u062A\u062F\u0627\u0621 \u0645\u0646"),
  type: w2("Type d\u2019offre", "Offer type", "\u0646\u0648\u0639 \u0627\u0644\u0639\u0631\u0636"),
  availability: w2("Disponibilit\xE9", "Availability", "\u0627\u0644\u062A\u0648\u0641\u0631"),
  sort: w2("Trier", "Sort", "\u0627\u0644\u062A\u0631\u062A\u064A\u0628"),
  recommended: w2("Ordre du catalogue", "Catalogue order", "\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C"),
  priceAsc: w2("Prix croissant", "Price: low to high", "\u0627\u0644\u0633\u0639\u0631 \u062A\u0635\u0627\u0639\u062F\u064A\u0627\u064B"),
  priceDesc: w2("Prix d\xE9croissant", "Price: high to low", "\u0627\u0644\u0633\u0639\u0631 \u062A\u0646\u0627\u0632\u0644\u064A\u0627\u064B"),
  name: w2("Nom", "Name", "\u0627\u0644\u0627\u0633\u0645"),
  configuration: w2("D\xE9tails de l\u2019offre", "Offer details", "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0639\u0631\u0636"),
  prepare: w2("Pr\xE9parer mon projet", "Prepare my project", "\u0625\u0639\u062F\u0627\u062F \u0645\u0634\u0631\u0648\u0639\u064A"),
  summary: w2(
    "Votre s\xE9lection de priorit\xE9s",
    "Your selected priorities",
    "\u0623\u0648\u0644\u0648\u064A\u0627\u062A\u0643\u0645 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629"
  ),
  copy: w2("Copier mon r\xE9sum\xE9", "Copy my summary", "\u0646\u0633\u062E \u0645\u0644\u062E\u0635\u064A"),
  copied: w2("R\xE9sum\xE9 copi\xE9", "Summary copied", "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0645\u0644\u062E\u0635"),
  copyFailed: w2(
    "Copie impossible. S\xE9lectionnez le texte du r\xE9sum\xE9.",
    "Copy failed. Select the summary text.",
    "\u062A\u0639\u0630\u0631 \u0627\u0644\u0646\u0633\u062E. \u062D\u062F\u062F\u0648\u0627 \u0646\u0635 \u0627\u0644\u0645\u0644\u062E\u0635."
  ),
  note: w2(
    "Ce rep\xE9rage pr\xE9pare votre demande. Les conditions seront pr\xE9cis\xE9es dans le parcours d\xE9di\xE9.",
    "This preparation supports your request. Terms are clarified in the dedicated journey.",
    "\u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u064A\u062F\u0639\u0645 \u0637\u0644\u0628\u0643\u0645 \u0648\u062A\u062D\u062F\u062F \u0627\u0644\u0634\u0631\u0648\u0637 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u062E\u0635\u0635."
  ),
  pause: w2("Mettre en pause", "Pause", "\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A"),
  play: w2("Activer les transitions", "Enable transitions", "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644\u0627\u062A"),
  previous: w2("Pr\xE9c\xE9dent", "Previous", "\u0627\u0644\u0633\u0627\u0628\u0642"),
  next: w2("Suivant", "Next", "\u0627\u0644\u062A\u0627\u0644\u064A"),
  unknown: w2(
    "Non indiqu\xE9 sur l\u2019offre",
    "Not listed on the offer",
    "\u063A\u064A\u0631 \u0645\u0630\u0643\u0648\u0631 \u0641\u064A \u0627\u0644\u0639\u0631\u0636"
  ),
  noMedia: w2("Visuel non renseign\xE9", "Image not provided", "\u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629"),
  planner: w2("Pr\xE9paration de projet", "Project preparation", "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0634\u0631\u0648\u0639"),
  nativeLead: w2(
    "D\xE9couvrez \xE9galement les contenus publi\xE9s dans cet univers.",
    "Also explore the content published in this universe.",
    "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0623\u064A\u0636\u0627\u064B \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0646\u0634\u0648\u0631 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0644\u0645."
  ),
  nonMedical: w2(
    "Accompagnement non m\xE9dical : aucun diagnostic, prescription ou administration de m\xE9dicaments.",
    "Non-medical support: no diagnosis, prescriptions or medication administration.",
    "\u062F\u0639\u0645 \u063A\u064A\u0631 \u0637\u0628\u064A: \u062F\u0648\u0646 \u062A\u0634\u062E\u064A\u0635 \u0623\u0648 \u0648\u0635\u0641\u0627\u062A \u0623\u0648 \u0625\u0639\u0637\u0627\u0621 \u0623\u062F\u0648\u064A\u0629."
  ),
  months: w2("mois", "months", "\u0623\u0634\u0647\u0631"),
  minutes: w2("min", "min", "\u062F\u0642\u064A\u0642\u0629"),
  years: w2("ans", "years", "\u0633\u0646\u0648\u0627\u062A"),
  service: w2("Service", "Service", "\u062E\u062F\u0645\u0629"),
  product: w2("Produit", "Product", "\u0645\u0646\u062A\u062C"),
  training: w2("Formation", "Training", "\u062A\u062F\u0631\u064A\u0628"),
  audit: w2("\xC9valuation", "Assessment", "\u062A\u0642\u064A\u064A\u0645"),
  kit: w2("Kit", "Kit", "\u0645\u062C\u0645\u0648\u0639\u0629"),
  saas_module: w2("Partner OS", "Partner OS", "Partner OS"),
  monthly: w2("Mensuel", "Monthly", "\u0634\u0647\u0631\u064A"),
  quarterly: w2("Trimestriel", "Quarterly", "\u0631\u0628\u0639 \u0633\u0646\u0648\u064A"),
  annual: w2("Annuel", "Annual", "\u0633\u0646\u0648\u064A"),
  custom: w2("Conditions sp\xE9cifiques", "Custom terms", "\u0634\u0631\u0648\u0637 \u062E\u0627\u0635\u0629"),
  plan: w2("Plan publi\xE9", "Published plan", "\u062E\u0637\u0629 \u0645\u0646\u0634\u0648\u0631\u0629"),
  modules: w2("modules d\xE9clar\xE9s", "declared modules", "\u0648\u062D\u062F\u0627\u062A \u0645\u0639\u0644\u0646\u0629"),
  faq1: w2(
    "Comment choisir la bonne offre ?",
    "How do I choose an offer?",
    "\u0643\u064A\u0641 \u0623\u062E\u062A\u0627\u0631 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u061F"
  ),
  answer1: w2(
    "Explorez les contenus, comparez les d\xE9tails puis consultez la fiche. Le parcours de l\u2019offre pr\xE9cise les conditions avant votre engagement.",
    "Explore content, compare details and open the offer page. Its journey clarifies terms before commitment.",
    "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0641\u062A\u062D\u0648\u0627 \u0635\u0641\u062D\u0629 \u0627\u0644\u0639\u0631\u0636 \u0644\u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0634\u0631\u0648\u0637 \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645."
  ),
  faq2: w2(
    "Une offre indisponible reste-t-elle consultable ?",
    "Can I still view an unavailable offer?",
    "\u0647\u0644 \u064A\u0645\u0643\u0646 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0639\u0631\u0636 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u061F"
  ),
  answer2: w2(
    "Oui, sa fiche reste accessible. Son affichage ne garantit ni stock ni cr\xE9neau ; les conditions sont v\xE9rifi\xE9es dans le parcours concern\xE9.",
    "Yes. Its page remains accessible. Display does not guarantee stock or a slot; terms are checked in the relevant journey.",
    "\u0646\u0639\u0645 \u062A\u0628\u0642\u0649 \u0627\u0644\u0635\u0641\u062D\u0629 \u0645\u062A\u0627\u062D\u0629. \u0627\u0644\u0639\u0631\u0636 \u0644\u0627 \u064A\u0636\u0645\u0646 \u0645\u062E\u0632\u0648\u0646\u0627\u064B \u0623\u0648 \u0645\u0648\u0639\u062F\u0627\u064B \u0648\u062A\u0631\u0627\u062C\u0639 \u0627\u0644\u0634\u0631\u0648\u0637 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0639\u0646\u064A."
  ),
  faq3: w2(
    "Puis-je pr\xE9parer une s\xE9lection avant de d\xE9cider ?",
    "Can I prepare a selection before deciding?",
    "\u0647\u0644 \u064A\u0645\u0643\u0646 \u0625\u0639\u062F\u0627\u062F \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0642\u0631\u0627\u0631\u061F"
  ),
  answer3: w2(
    "Enregistrez vos favoris ou comparez jusqu\u2019\xE0 quatre offres. Les comparaisons affichent uniquement les informations renseign\xE9es.",
    "Save favourites or compare up to four offers. Comparisons show only provided information.",
    "\u0627\u062D\u0641\u0638\u0648\u0627 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0623\u0648 \u0642\u0627\u0631\u0646\u0648\u0627 \u062D\u062A\u0649 \u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636\u060C \u0645\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629 \u0641\u0642\u0637."
  )
};
var object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
var text = (value) => typeof value === "string" ? value.trim() : "";
function safeHref(value, fallback) {
  const href = text(value);
  if (!href || /[\u0000-\u0020\\]/.test(href) || href.startsWith("//"))
    return fallback;
  if (href.startsWith("#")) return href;
  if (href.startsWith("/") && !href.split("/").includes("..")) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && !url.username && !url.password ? href : fallback;
  } catch {
    return fallback;
  }
}
var baseHref = (locale) => `/angelcare-marketplace/${locale}`;
var itemHref = (item, locale) => `${baseHref(locale)}/marketplace/item/${encodeURIComponent(item.slug)}`;
var searchHref = (experience2) => {
  const params = new URLSearchParams({ category: experience2.key });
  if (experience2.territoryCode)
    params.set("territory", experience2.territoryCode);
  return `${baseHref(experience2.locale)}/marketplace/search?${params}`;
};
function canonicalItems(experience2) {
  const seen = /* @__PURE__ */ new Set();
  return experience2.items.filter(
    (item) => Boolean(item.id && item.slug) && !seen.has(item.id) && Boolean(seen.add(item.id))
  );
}
function canonicalSubset(items, subset) {
  const byId = new Map(items.map((item) => [item.id, item])), seen = /* @__PURE__ */ new Set();
  return subset.flatMap((item) => {
    const canonical = byId.get(item.id);
    if (!canonical || seen.has(item.id)) return [];
    seen.add(item.id);
    return [canonical];
  });
}
var configuration = (item) => object(item.metadata.experience_configuration);
var schemaKey = (item) => text(item.metadata.experience_schema_key);
var stringList = (value) => Array.isArray(value) ? value.flatMap((entry) => {
  if (typeof entry === "string") return [entry];
  const row = object(entry), title = text(row.label) || text(row.name_fr) || text(row.title) || text(row.name);
  return title ? [title] : [];
}) : [];
function publicContents(item) {
  const config = configuration(item);
  return [
    ...new Set(
      [
        "components",
        "included_items",
        "kit_contents",
        "learning_objectives",
        "competency_areas",
        "modules",
        "materials"
      ].flatMap((key) => stringList(config[key]))
    )
  ].slice(0, 12);
}
var finite = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
function ageRange(item) {
  const config = configuration(item);
  if (finite(config.age_min) && finite(config.age_max) && config.age_max >= config.age_min)
    return { min: config.age_min, max: config.age_max };
  if (finite(config.age_min_months) && finite(config.age_max_months) && config.age_max_months >= config.age_min_months)
    return { min: config.age_min_months / 12, max: config.age_max_months / 12 };
  return null;
}
function priceLabel(item, locale) {
  if (item.price_mode === "quote_only") return tr2(C2.quote, locale);
  if (item.price_amount === null || !Number.isFinite(item.price_amount) || item.price_amount < 0)
    return tr2(C2.noPrice, locale);
  const amount = new Intl.NumberFormat(`${locale}-MA`, {
    maximumFractionDigits: 2
  }).format(item.price_amount);
  return `${item.price_mode === "starting_from" ? tr2(C2.from, locale) + " " : ""}${amount} ${item.currency_label}`;
}
var unavailable = (item) => [
  "unavailable",
  "out_of_stock",
  "sold_out",
  "closed",
  "paused",
  "blocked"
].includes(item.availability_status);
function offerMedia(value) {
  const src = text(value);
  if (!src || !src.startsWith("/") && !/^https?:\/\//.test(src) || src.startsWith("//") || /[\u0000-\u001f]/.test(src))
    return null;
  if (src.startsWith("/api/angelcare-marketplace/media/")) {
    const url = new URL(src, "https://angelcare.invalid");
    url.searchParams.delete("variant");
    return url.pathname + url.search;
  }
  return src;
}
var INITIAL_FILTERS = {
  query: "",
  kind: "all",
  availability: "all",
  schema: "all",
  age: "all",
  sort: "recommended"
};
function filterItems(items, filters) {
  const query = filters.query.trim().toLocaleLowerCase();
  const age = filters.age === "all" ? null : Number(filters.age);
  const filtered = items.filter((item) => {
    const config = configuration(item);
    const searchable = [
      item.name,
      item.short_description || "",
      item.category_title || "",
      ...publicContents(item),
      text(config.format),
      text(config.delivery_mode)
    ].join(" ").toLocaleLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filters.kind !== "all" && item.kind !== filters.kind) return false;
    if (filters.availability !== "all" && item.availability_status !== filters.availability)
      return false;
    if (filters.schema !== "all" && schemaKey(item) !== filters.schema)
      return false;
    if (age !== null) {
      const range = ageRange(item);
      if (!range || age < range.min || age > range.max) return false;
    }
    return true;
  });
  if (filters.sort === "name")
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (filters.sort === "price_asc" || filters.sort === "price_desc")
    filtered.sort((a, b) => {
      const aa = a.price_mode === "quote_only" || a.price_amount === null || !Number.isFinite(a.price_amount) ? null : a.price_amount;
      const bb = b.price_mode === "quote_only" || b.price_amount === null || !Number.isFinite(b.price_amount) ? null : b.price_amount;
      return aa === null ? bb === null ? 0 : 1 : bb === null ? -1 : filters.sort === "price_asc" ? aa - bb : bb - aa;
    });
  return filtered;
}
function safeIds(value, allowed) {
  try {
    const data = JSON.parse(value || "[]");
    return Array.isArray(data) ? [
      ...new Set(
        data.filter(
          (id) => typeof id === "string" && allowed.has(id)
        )
      )
    ].slice(0, 80) : [];
  } catch {
    return [];
  }
}

// storefronts-ten-r1/native-context-runtime.mjs
var w3 = (fr, en, ar) => ({
  fr,
  en,
  ar
});
var tr3 = (value, locale) => value[locale];
var topic3 = (label, body, query, photo2) => ({ label, body, query, photo: photo2 });
var chapter3 = (title, body, photo2) => ({
  title,
  body,
  photo: photo2
});
var PROFILES3 = {
  development: {
    key: "development",
    label: w3("D\xE9veloppement", "Development", "\u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u0637\u0641\u0644"),
    eyebrow: w3(
      "LE MONDE GRANDIT AVEC EUX",
      "A WORLD THAT GROWS WITH THEM",
      "\u0639\u0627\u0644\u0645 \u064A\u0643\u0628\u0631 \u0645\u0639\u0647\u0645"
    ),
    title: w3(
      "Petites mains. Grandes d\xE9couvertes.",
      "Little hands. Extraordinary discoveries.",
      "\u0623\u064A\u062F\u064D \u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u0643\u0628\u064A\u0631\u0629."
    ),
    lead: w3(
      "Transformez la curiosit\xE9 en moments de d\xE9couverte. Activit\xE9s, jeux et ressources : trouvez l\u2019exp\xE9rience qui fait briller leur prochaine \xE9tape.",
      "Turn curiosity into moments of discovery. Activities, games and resources for their next bright step.",
      "\u062D\u0648\u0651\u0644\u0648\u0627 \u0627\u0644\u0641\u0636\u0648\u0644 \u0625\u0644\u0649 \u0644\u062D\u0638\u0627\u062A \u0627\u0643\u062A\u0634\u0627\u0641 \u0645\u0639 \u0623\u0646\u0634\u0637\u0629 \u0648\u0623\u0644\u0639\u0627\u0628 \u0648\u0645\u0648\u0627\u0631\u062F \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u062E\u0637\u0648\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    photo: "development",
    secondaryPhoto: "flashcards",
    color: "#9b36df",
    companion: "#f42d78",
    signature: w3(
      "Le studio des petites d\xE9couvertes",
      "The little-discoveries studio",
      "\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629"
    ),
    signatureLead: w3(
      "Un \xE2ge, une envie, une activit\xE9. Composez votre point de d\xE9part \xE0 partir des donn\xE9es de chaque offre.",
      "An age, an interest, an activity. Build a starting point from the details of each offer.",
      "\u0639\u0645\u0631 \u0648\u0627\u0647\u062A\u0645\u0627\u0645 \u0648\u0646\u0634\u0627\u0637: \u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u0645\u0646 \u062A\u0641\u0627\u0635\u064A\u0644 \u0643\u0644 \u0639\u0631\u0636."
    ),
    topics: [
      topic3(
        w3("Langage & expression", "Language & expression", "\u0627\u0644\u0644\u063A\u0629 \u0648\u0627\u0644\u062A\u0639\u0628\u064A\u0631"),
        w3(
          "Des mots aux histoires, ouvrir la conversation.",
          "From words to stories, open a conversation.",
          "\u0645\u0646 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u0642\u0635\u0635\u060C \u0627\u0641\u062A\u062D\u0648\u0627 \u0628\u0627\u0628 \u0627\u0644\u062D\u0648\u0627\u0631."
        ),
        "langage",
        "flashcards"
      ),
      topic3(
        w3(
          "Autonomie & Montessori",
          "Independence & Montessori",
          "\u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629 \u0648\u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"
        ),
        w3(
          "Faire soi-m\xEAme, essayer, recommencer.",
          "Do, try and try again.",
          "\u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u0648\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0648\u0627\u0644\u062A\u0643\u0631\u0627\u0631."
        ),
        "montessori",
        "montessori"
      ),
      topic3(
        w3("Cr\xE9ativit\xE9 & jeux", "Creativity & play", "\u0627\u0644\u0625\u0628\u062F\u0627\u0639 \u0648\u0627\u0644\u0644\u0639\u0628"),
        w3(
          "Mati\xE8res, couleurs et imagination en action.",
          "Materials, colours and imagination in action.",
          "\u0645\u0648\u0627\u062F \u0648\u0623\u0644\u0648\u0627\u0646 \u0648\u062E\u064A\u0627\u0644 \u064A\u062A\u062D\u0631\u0643."
        ),
        "jeu",
        "games"
      ),
      topic3(
        w3("Attention & apprentissage", "Focus & learning", "\u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0648\u0627\u0644\u062A\u0639\u0644\u0645"),
        w3(
          "Des d\xE9couvertes qui respectent le rythme de l\u2019enfant.",
          "Discovery at a child\u2019s own pace.",
          "\u0627\u0643\u062A\u0634\u0627\u0641\u0627\u062A \u062A\u062D\u062A\u0631\u0645 \u0625\u064A\u0642\u0627\u0639 \u0627\u0644\u0637\u0641\u0644."
        ),
        "apprentissage",
        "homework"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Apprendre commence par jouer",
          "Learning starts with play",
          "\u0627\u0644\u062A\u0639\u0644\u0645 \u064A\u0628\u062F\u0623 \u0628\u0627\u0644\u0644\u0639\u0628"
        ),
        w3(
          "Une activit\xE9 adapt\xE9e vaut mieux qu\u2019un programme surcharg\xE9. Consultez l\u2019\xE2ge, la dur\xE9e et les mat\xE9riaux publi\xE9s avant de choisir.",
          "Check the published age, duration and materials before choosing an activity.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0639\u0645\u0631 \u0648\u0627\u0644\u0645\u062F\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0642\u0628\u0644 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0646\u0634\u0627\u0637."
        ),
        "games"
      ),
      chapter3(
        w3(
          "De la d\xE9couverte \xE0 la maison",
          "Bring discovery home",
          "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u064A\u0635\u0644 \u0625\u0644\u0649 \u0627\u0644\u0628\u064A\u062A"
        ),
        w3(
          "Associez votre prochaine activit\xE9 \xE0 un kit ou une ressource, sans perdre le fil de votre objectif.",
          "Pair your next activity with a kit or resource that shares your goal.",
          "\u0627\u0631\u0628\u0637\u0648\u0627 \u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u0642\u0627\u062F\u0645 \u0628\u0645\u062C\u0645\u0648\u0639\u0629 \u0623\u0648 \u0645\u0648\u0631\u062F \u064A\u0646\u0627\u0633\u0628 \u0647\u062F\u0641\u0643\u0645."
        ),
        "montessori"
      ),
      chapter3(
        w3(
          "Le plaisir de recommencer",
          "The joy of trying again",
          "\u0645\u062A\u0639\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0646 \u062C\u062F\u064A\u062F"
        ),
        w3(
          "Un espace, quelques minutes, un support adapt\xE9 : composez des moments qui donnent envie de revenir.",
          "A space, a few minutes and a suitable resource create moments worth returning to.",
          "\u0645\u0633\u0627\u062D\u0629 \u0648\u062F\u0642\u0627\u0626\u0642 \u0648\u0645\u0648\u0631\u062F \u0645\u0646\u0627\u0633\u0628 \u062A\u0635\u0646\u0639 \u0644\u062D\u0638\u0627\u062A \u062A\u0633\u062A\u062D\u0642 \u0627\u0644\u0639\u0648\u062F\u0629."
        ),
        "development"
      )
    ],
    steps: [
      w3("Choisir un objectif", "Choose a goal", "\u0627\u062E\u062A\u064A\u0627\u0631 \u0647\u062F\u0641"),
      w3("V\xE9rifier l\u2019\xE2ge", "Check the age", "\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0639\u0645\u0631"),
      w3("Explorer le contenu", "Explore the content", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u062D\u062A\u0648\u0649"),
      w3(
        "Suivre le parcours de l\u2019offre",
        "Follow the offer journey",
        "\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0631\u0636"
      )
    ],
    primary: "family/request",
    primaryLabel: w3(
      "\xCAtre guid\xE9 pour mon enfant",
      "Get guidance for my child",
      "\u0637\u0644\u0628 \u062A\u0648\u062C\u064A\u0647 \u0644\u0637\u0641\u0644\u064A"
    ),
    related: ["kits", "home-services", "families"]
  },
  kits: {
    key: "kits",
    label: w3("Kits & produits", "Kits & products", "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A"),
    eyebrow: w3(
      "OUVREZ UNE BO\xCETE DE POSSIBILIT\xC9S",
      "OPEN A WORLD OF POSSIBILITIES",
      "\u0627\u0641\u062A\u062D\u0648\u0627 \u0639\u0627\u0644\u0645\u0627\u064B \u0645\u0646 \u0627\u0644\u0625\u0645\u0643\u0627\u0646\u0627\u062A"
    ),
    title: w3(
      "Le prochain \xAB wow \xBB tient dans leurs mains.",
      "Their next \u201Cwow\u201D is in their hands.",
      "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0642\u0627\u062F\u0645 \u0628\u064A\u0646 \u0623\u064A\u062F\u064A\u0647\u0645."
    ),
    lead: w3(
      "Kits Montessori, jeux, flashcartes et ressources digitales. Regardez chaque d\xE9tail, comparez les contenus et choisissez ce qui fait envie d\u2019apprendre.",
      "Montessori kits, games, flashcards and digital resources. Explore every detail and compare contents before choosing.",
      "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A \u0648\u0623\u0644\u0639\u0627\u0628 \u0648\u0628\u0637\u0627\u0642\u0627\u062A \u0648\u0645\u0648\u0627\u0631\u062F \u0631\u0642\u0645\u064A\u0629: \u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A."
    ),
    photo: "kits",
    secondaryPhoto: "flashcards",
    color: "#0873d9",
    companion: "#f42d78",
    signature: w3(
      "Ouvrez le kit. D\xE9couvrez ce qu\u2019il contient.",
      "Open the kit. Discover what is inside.",
      "\u0627\u0641\u062A\u062D\u0648\u0627 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0648\u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0645\u062D\u062A\u0648\u064A\u0627\u062A\u0647\u0627."
    ),
    signatureLead: w3(
      "Un explorateur de produits r\xE9els : contenus, formats et \xE2ges restent ceux de chaque fiche.",
      "A real-product explorer: contents, formats and ages come from each product record.",
      "\u0645\u0633\u062A\u0643\u0634\u0641 \u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0641\u0639\u0644\u064A\u0629: \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u0634\u0643\u0627\u0644 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0631 \u0645\u0646 \u0628\u064A\u0627\u0646\u0627\u062A \u0643\u0644 \u0645\u0646\u062A\u062C."
    ),
    topics: [
      topic3(
        w3("Kits Montessori", "Montessori kits", "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"),
        w3(
          "D\xE9couvrir, manipuler, gagner en autonomie.",
          "Discover, handle, grow in independence.",
          "\u0627\u0643\u062A\u0634\u0627\u0641 \u0648\u062A\u062C\u0631\u064A\u0628 \u0648\u0627\u0643\u062A\u0633\u0627\u0628 \u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629."
        ),
        "montessori",
        "montessori"
      ),
      topic3(
        w3("Flashcartes", "Flashcards", "\u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629"),
        w3(
          "Des images qui ouvrent la conversation.",
          "Images that start conversations.",
          "\u0635\u0648\u0631 \u062A\u0641\u062A\u062D \u0628\u0627\u0628 \u0627\u0644\u062D\u0648\u0627\u0631."
        ),
        "flash",
        "flashcards"
      ),
      topic3(
        w3("Jeux de d\xE9veloppement", "Development games", "\u0623\u0644\u0639\u0627\u0628 \u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w3(
          "L\u2019envie de jouer, le plaisir de progresser.",
          "The desire to play, the joy of progress.",
          "\u0627\u0644\u0631\u063A\u0628\u0629 \u0641\u064A \u0627\u0644\u0644\u0639\u0628 \u0648\u0645\u062A\u0639\u0629 \u0627\u0644\u062A\u0642\u062F\u0645."
        ),
        "jeu",
        "games"
      ),
      topic3(
        w3("Ressources digitales", "Digital resources", "\u0645\u0648\u0627\u0631\u062F \u0631\u0642\u0645\u064A\u0629"),
        w3(
          "D\xE9couvrez le format indiqu\xE9 sur chaque offre.",
          "Discover the format listed on each offer.",
          "\u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0627\u0644\u0634\u0643\u0644 \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u0641\u064A \u0643\u0644 \u0639\u0631\u0636."
        ),
        "digital",
        "digital"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Le d\xE9tail fait la diff\xE9rence",
          "Details make the difference",
          "\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u062A\u0635\u0646\u0639 \u0627\u0644\u0641\u0631\u0642"
        ),
        w3(
          "Visualisez les images sans recadrage. Consultez les \xE9l\xE9ments inclus, le format et les conditions de chaque produit.",
          "See uncropped images and check included components, format and conditions.",
          "\u0634\u0627\u0647\u062F\u0648\u0627 \u0627\u0644\u0635\u0648\u0631 \u0643\u0627\u0645\u0644\u0629 \u0648\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0634\u0643\u0644 \u0648\u0627\u0644\u0634\u0631\u0648\u0637."
        ),
        "kits"
      ),
      chapter3(
        w3(
          "Une s\xE9lection qui a du sens",
          "Build a meaningful selection",
          "\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0644\u0647\u0627 \u0645\u0639\u0646\u0649"
        ),
        w3(
          "Gardez vos favoris et comparez les offres avant d\u2019ouvrir la fiche qui vous correspond.",
          "Save favourites and compare offers before opening the right product page.",
          "\u0627\u062D\u0641\u0638\u0648\u0627 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0639\u0631\u0648\u0636 \u0642\u0628\u0644 \u0641\u062A\u062D \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629."
        ),
        "flashcards"
      ),
      chapter3(
        w3("Le jeu continue", "Keep the discovery going", "\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u064A\u0633\u062A\u0645\u0631"),
        w3(
          "Passez du produit aux id\xE9es d\u2019activit\xE9s dans l\u2019univers D\xE9veloppement.",
          "Move from products to activity ideas in Development.",
          "\u0627\u0646\u062A\u0642\u0644\u0648\u0627 \u0645\u0646 \u0627\u0644\u0645\u0646\u062A\u062C \u0625\u0644\u0649 \u0623\u0641\u0643\u0627\u0631 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0641\u064A \u0641\u0636\u0627\u0621 \u0627\u0644\u062A\u0646\u0645\u064A\u0629."
        ),
        "games"
      )
    ],
    steps: [
      w3("Explorer les formats", "Explore formats", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0623\u0634\u0643\u0627\u0644"),
      w3("Comparer les contenus", "Compare contents", "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A"),
      w3("Ouvrir la fiche", "Open the product page", "\u0641\u062A\u062D \u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u062A\u062C"),
      w3(
        "Commander selon les conditions",
        "Order under the listed terms",
        "\u0627\u0644\u0637\u0644\u0628 \u062D\u0633\u0628 \u0627\u0644\u0634\u0631\u0648\u0637"
      )
    ],
    primary: "basket",
    primaryLabel: w3("Retrouver mon panier", "Open my basket", "\u0641\u062A\u062D \u0633\u0644\u062A\u064A"),
    related: ["development", "families", "academy"]
  },
  academy: {
    key: "academy",
    label: w3("Academy", "Academy", "\u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629"),
    eyebrow: w3(
      "VOTRE AMBITION M\xC9RITE UN PARCOURS",
      "YOUR AMBITION DESERVES A PATHWAY",
      "\u0637\u0645\u0648\u062D\u0643\u0645 \u064A\u0633\u062A\u062D\u0642 \u0645\u0633\u0627\u0631\u0627\u064B"
    ),
    title: w3(
      "Faites de vos comp\xE9tences votre prochaine force.",
      "Make your skills your next advantage.",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u0645\u0647\u0627\u0631\u0627\u062A\u0643\u0645 \u0642\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    lead: w3(
      "Cours, programmes et parcours professionnels. Explorez les contenus publi\xE9s, comparez les modalit\xE9s et construisez une prochaine \xE9tape qui vous ressemble.",
      "Explore published courses, programmes and professional pathways. Compare delivery options and build your next step.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062F\u0648\u0631\u0627\u062A \u0648\u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u062A\u0639\u0644\u0645 \u0644\u0628\u0646\u0627\u0621 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
    ),
    photo: "academy",
    secondaryPhoto: "professional",
    color: "#7539d9",
    companion: "#f42d78",
    signature: w3(
      "Le campus de votre prochaine \xE9tape",
      "The campus for your next step",
      "\u062D\u0631\u0645 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
    ),
    signatureLead: w3(
      "S\xE9lectionnez un programme publi\xE9 ou explorez les cours du catalogue. Chaque inscription garde son propre parcours.",
      "Select a published programme or explore catalogue courses. Each enrollment keeps its own journey.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0628\u0631\u0646\u0627\u0645\u062C\u0627\u064B \u0645\u0646\u0634\u0648\u0631\u0627\u064B \u0623\u0648 \u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062F\u0648\u0631\u0627\u062A\u060C \u0645\u0639 \u0645\u0633\u0627\u0631 \u062A\u0633\u062C\u064A\u0644 \u062E\u0627\u0635 \u0628\u0643\u0644 \u0639\u0631\u0636."
    ),
    topics: [
      topic3(
        w3("Petite enfance", "Early childhood", "\u0627\u0644\u0637\u0641\u0648\u0644\u0629 \u0627\u0644\u0645\u0628\u0643\u0631\u0629"),
        w3(
          "Les gestes et connaissances du quotidien.",
          "Everyday knowledge and practical skills.",
          "\u0627\u0644\u0645\u0639\u0627\u0631\u0641 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629."
        ),
        "enfance",
        "care"
      ),
      topic3(
        w3(
          "P\xE9dagogie & Montessori",
          "Teaching & Montessori",
          "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0648\u0645\u0648\u0646\u062A\u064A\u0633\u0648\u0631\u064A"
        ),
        w3(
          "Donner une intention \xE0 chaque activit\xE9.",
          "Bring purpose to every activity.",
          "\u0645\u0646\u062D \u0647\u062F\u0641 \u0644\u0643\u0644 \u0646\u0634\u0627\u0637."
        ),
        "montessori",
        "montessori"
      ),
      topic3(
        w3("Parcours professionnels", "Professional pathways", "\u0645\u0633\u0627\u0631\u0627\u062A \u0645\u0647\u0646\u064A\u0629"),
        w3(
          "Choisir une progression adapt\xE9e \xE0 votre projet.",
          "Choose progress that fits your project.",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u062A\u0642\u062F\u0645 \u064A\u0646\u0627\u0633\u0628 \u0645\u0634\u0631\u0648\u0639\u0643\u0645."
        ),
        "profession",
        "professional"
      ),
      topic3(
        w3("Formation des \xE9quipes", "Team training", "\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0641\u0631\u0642"),
        w3(
          "Des besoins partag\xE9s, un parcours \xE0 \xE9tudier.",
          "Shared needs, a pathway to discuss.",
          "\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0645\u0634\u062A\u0631\u0643\u0629 \u0648\u0645\u0633\u0627\u0631 \u0644\u0644\u062F\u0631\u0627\u0633\u0629."
        ),
        "formation",
        "school"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Passez de l\u2019envie \xE0 l\u2019action",
          "Turn ambition into action",
          "\u0645\u0646 \u0627\u0644\u0637\u0645\u0648\u062D \u0625\u0644\u0649 \u0627\u0644\u0639\u0645\u0644"
        ),
        w3(
          "Objectif, public vis\xE9, contenu, modalit\xE9 : prenez le temps de comparer avant l\u2019inscription.",
          "Compare goals, audience, content and delivery before enrolling.",
          "\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u062C\u0645\u0647\u0648\u0631 \u0648\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0646\u0645\u0637 \u0642\u0628\u0644 \u0627\u0644\u062A\u0633\u062C\u064A\u0644."
        ),
        "academy"
      ),
      chapter3(
        w3(
          "Apprendre au plus pr\xE8s du terrain",
          "Learn close to real practice",
          "\u062A\u0639\u0644\u0645 \u0642\u0631\u064A\u0628 \u0645\u0646 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"
        ),
        w3(
          "Consultez les objectifs et comp\xE9tences d\xE9clar\xE9s dans chaque programme publi\xE9.",
          "Check the objectives and skills declared in each published programme.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0646\u0629 \u0641\u064A \u0643\u0644 \u0628\u0631\u0646\u0627\u0645\u062C \u0645\u0646\u0634\u0648\u0631."
        ),
        "professional"
      ),
      chapter3(
        w3(
          "Une \xE9quipe, un projet de progression",
          "One team, a shared learning project",
          "\u0641\u0631\u064A\u0642 \u0648\u0627\u062D\u062F \u0648\u0645\u0634\u0631\u0648\u0639 \u062A\u0639\u0644\u0645 \u0645\u0634\u062A\u0631\u0643"
        ),
        w3(
          "Pour une organisation, d\xE9marrez une demande Academy afin d\u2019\xE9tudier les besoins de votre \xE9quipe.",
          "Start an Academy request to discuss your organisation\u2019s training needs.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0637\u0644\u0628\u0627\u064B \u0644\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u062A\u062F\u0631\u064A\u0628 \u0641\u0631\u064A\u0642\u0643\u0645."
        ),
        "school"
      )
    ],
    steps: [
      w3("D\xE9finir son objectif", "Set a goal", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0647\u062F\u0641"),
      w3("Comparer les parcours", "Compare pathways", "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A"),
      w3("V\xE9rifier les conditions", "Check conditions", "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0634\u0631\u0648\u0637"),
      w3("D\xE9marrer son inscription", "Start enrollment", "\u0628\u062F\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644")
    ],
    primary: "academy/request",
    primaryLabel: w3(
      "Construire mon parcours",
      "Build my pathway",
      "\u0628\u0646\u0627\u0621 \u0645\u0633\u0627\u0631\u064A"
    ),
    related: ["professionals", "establishments", "development"]
  },
  establishments: {
    key: "establishments",
    label: w3("\xC9tablissements", "Establishments", "\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A"),
    eyebrow: w3(
      "VOTRE \xC9TABLISSEMENT, UN NOUVEL HORIZON",
      "A NEW HORIZON FOR YOUR ESTABLISHMENT",
      "\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629 \u0644\u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    title: w3(
      "Faites grandir votre \xE9tablissement. \xC0 tous les niveaux.",
      "Help your establishment grow. At every level.",
      "\u0627\u0631\u062A\u0642\u0648\u0627 \u0628\u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0633\u062A\u0648\u064A\u0627\u062A."
    ),
    lead: w3(
      "Cr\xE8ches, \xE9coles et structures d\u2019accueil : reliez vos priorit\xE9s \xE0 des programmes, des comp\xE9tences et des outils pour pr\xE9parer une transformation coh\xE9rente.",
      "Connect your nursery or school priorities to programmes, skills and tools for a coherent transformation.",
      "\u0627\u0631\u0628\u0637\u0648\u0627 \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u062D\u0636\u0627\u0646\u062A\u0643\u0645 \u0623\u0648 \u0645\u062F\u0631\u0633\u062A\u0643\u0645 \u0628\u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0644\u0625\u0639\u062F\u0627\u062F \u062A\u062D\u0648\u0644 \u0645\u062A\u0643\u0627\u0645\u0644."
    ),
    photo: "preschool",
    secondaryPhoto: "school",
    color: "#008ba4",
    companion: "#7539d9",
    signature: w3(
      "Votre carte de transformation",
      "Your transformation map",
      "\u062E\u0631\u064A\u0637\u0629 \u062A\u062D\u0648\u0644 \u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    signatureLead: w3(
      "Choisissez vos priorit\xE9s. Pr\xE9parez un r\xE9sum\xE9 \xE0 partager au d\xE9marrage du diagnostic.",
      "Choose priorities and prepare a summary to share when starting your assessment.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0648\u0623\u0639\u062F\u0648\u0627 \u0645\u0644\u062E\u0635\u0627\u064B \u0644\u0645\u0634\u0627\u0631\u0643\u062A\u0647 \u0639\u0646\u062F \u0628\u062F\u0621 \u0627\u0644\u062A\u0634\u062E\u064A\u0635."
    ),
    topics: [
      topic3(
        w3("Programmes \xE9ducatifs", "Educational programmes", "\u0628\u0631\u0627\u0645\u062C \u062A\u0631\u0628\u0648\u064A\u0629"),
        w3(
          "Une exp\xE9rience enfant avec une intention claire.",
          "Child experiences with a clear purpose.",
          "\u062A\u062C\u0627\u0631\u0628 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0630\u0627\u062A \u0647\u062F\u0641 \u0648\u0627\u0636\u062D."
        ),
        "programme",
        "preschool"
      ),
      topic3(
        w3("Renfort & comp\xE9tences", "Staffing & skills", "\u062F\u0639\u0645 \u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w3(
          "Aligner les besoins de l\u2019\xE9quipe et les parcours.",
          "Align team needs and learning pathways.",
          "\u0645\u0648\u0627\u0621\u0645\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic3(
        w3("Qualit\xE9 & diagnostic", "Quality & assessment", "\u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635"),
        w3(
          "Identifier les priorit\xE9s avant d\u2019agir.",
          "Identify priorities before taking action.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0639\u0645\u0644."
        ),
        "diagnostic",
        "support"
      ),
      topic3(
        w3("Organisation & outils", "Operations & tools", "\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u062A"),
        w3(
          "Explorer un syst\xE8me au service de votre quotidien.",
          "Explore a system for everyday operations.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0646\u0638\u0627\u0645 \u064A\u062E\u062F\u0645 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u064A\u0648\u0645\u064A."
        ),
        "organisation",
        "desk"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Un projet \xE0 votre \xE9chelle",
          "A project at your scale",
          "\u0645\u0634\u0631\u0648\u0639 \u064A\u0646\u0627\u0633\u0628 \u062D\u062C\u0645\u0643\u0645"
        ),
        w3(
          "Commencez par votre contexte : type de structure, territoire, \xE9quipe et priorit\xE9s.",
          "Start with your context: organisation, territory, team and priorities.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0627\u0644\u0633\u064A\u0627\u0642: \u0646\u0648\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A."
        ),
        "preschool"
      ),
      chapter3(
        w3(
          "Connecter les bonnes expertises",
          "Connect the right expertise",
          "\u0631\u0628\u0637 \u0627\u0644\u062E\u0628\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w3(
          "Academy, Quality Check et Partner OS ouvrent des parcours compl\xE9mentaires.",
          "Academy, Quality Check and Partner OS offer complementary pathways.",
          "\u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0648\u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u062A\u0648\u0641\u0631 \u0645\u0633\u0627\u0631\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629."
        ),
        "school"
      ),
      chapter3(
        w3(
          "Pr\xE9parer la mise en \u0153uvre",
          "Prepare implementation",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630"
        ),
        w3(
          "Le diagnostic est le point de d\xE9part pour pr\xE9ciser le p\xE9rim\xE8tre et les conditions du projet.",
          "Assessment is the starting point for clarifying project scope and terms.",
          "\u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0628\u062F\u0627\u064A\u0629 \u0644\u062A\u062D\u062F\u064A\u062F \u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u0634\u0631\u0648\u0637\u0647."
        ),
        "desk"
      )
    ],
    steps: [
      w3("Vos priorit\xE9s", "Your priorities", "\u0623\u0648\u0644\u0648\u064A\u0627\u062A\u0643\u0645"),
      w3("Le diagnostic", "The assessment", "\u0627\u0644\u062A\u0634\u062E\u064A\u0635"),
      w3("Le p\xE9rim\xE8tre convenu", "The agreed scope", "\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647"),
      w3("La mise en \u0153uvre", "Implementation", "\u0627\u0644\u062A\u0646\u0641\u064A\u0630")
    ],
    primary: "establishments/diagnostic",
    primaryLabel: w3(
      "D\xE9marrer mon diagnostic",
      "Start my assessment",
      "\u0628\u062F\u0621 \u062A\u0634\u062E\u064A\u0635 \u0645\u0624\u0633\u0633\u062A\u064A"
    ),
    related: ["academy", "quality-check", "partner-os"]
  },
  hospitality: {
    key: "hospitality",
    label: w3("Hospitality", "Hospitality", "\u0627\u0644\u0636\u064A\u0627\u0641\u0629"),
    eyebrow: w3(
      "L\u2019EXP\xC9RIENCE FAMILLE, VOTRE SIGNATURE",
      "FAMILY EXPERIENCE, YOUR SIGNATURE",
      "\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0628\u0635\u0645\u062A\u0643\u0645"
    ),
    title: w3(
      "Les enfants s\u2019\xE9merveillent. Les familles se souviennent.",
      "Children discover. Families remember.",
      "\u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u064A\u0643\u062A\u0634\u0641\u0648\u0646 \u0648\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u062A\u062A\u0630\u0643\u0631."
    ),
    lead: w3(
      "Kids clubs, garde des enfants des clients et conciergerie famille. Imaginez une exp\xE9rience qui prolonge le plaisir du s\xE9jour, puis \xE9tudiez sa mise en place.",
      "Kids clubs, guest childcare and family concierge. Shape an experience that enriches the stay, then discuss implementation.",
      "\u0646\u0648\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641 \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u064A: \u0635\u0645\u0645\u0648\u0627 \u062A\u062C\u0631\u0628\u0629 \u062A\u062B\u0631\u064A \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u062B\u0645 \u0627\u062F\u0631\u0633\u0648\u0627 \u062A\u0646\u0641\u064A\u0630\u0647\u0627."
    ),
    photo: "hospitality",
    secondaryPhoto: "holidays",
    color: "#d06b06",
    companion: "#f42d78",
    signature: w3(
      "Votre s\xE9jour famille, sc\xE8ne par sc\xE8ne",
      "Your family stay, scene by scene",
      "\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0645\u0634\u0647\u062F\u0627\u064B \u0628\u0645\u0634\u0647\u062F"
    ),
    signatureLead: w3(
      "Explorez les moments d\u2019un s\xE9jour et les parcours correspondants de votre \xE9tablissement.",
      "Explore moments in a stay and your property\u2019s corresponding pathways.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0645\u0646\u0634\u0623\u062A\u0643\u0645."
    ),
    topics: [
      topic3(
        w3("Kids club", "Kids club", "\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644"),
        w3(
          "Un espace pour explorer et cr\xE9er.",
          "A space to explore and create.",
          "\u0645\u0633\u0627\u062D\u0629 \u0644\u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0648\u0627\u0644\u0625\u0628\u062F\u0627\u0639."
        ),
        "kids",
        "games"
      ),
      topic3(
        w3("Guest childcare", "Guest childcare", "\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641"),
        w3(
          "\xC9tudier une garde adapt\xE9e aux clients.",
          "Discuss childcare tailored to guests.",
          "\u062F\u0631\u0627\u0633\u0629 \u0631\u0639\u0627\u064A\u0629 \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u0636\u064A\u0648\u0641."
        ),
        "garde",
        "care"
      ),
      topic3(
        w3("Conciergerie famille", "Family concierge", "\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A"),
        w3(
          "Accompagner la d\xE9couverte du s\xE9jour.",
          "Guide the family\u2019s stay.",
          "\u062A\u0648\u062C\u064A\u0647 \u062A\u062C\u0631\u0628\u0629 \u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u0629."
        ),
        "famille",
        "family"
      ),
      topic3(
        w3("Programmes saisonniers", "Seasonal programmes", "\u0628\u0631\u0627\u0645\u062C \u0645\u0648\u0633\u0645\u064A\u0629"),
        w3(
          "Pr\xE9parer la prochaine saison ensemble.",
          "Prepare the next season together.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u0642\u0627\u062F\u0645 \u0645\u0639\u0627\u064B."
        ),
        "saison",
        "holidays"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Du check-in aux souvenirs",
          "From check-in to memories",
          "\u0645\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0630\u0643\u0631\u064A\u0627\u062A"
        ),
        w3(
          "Dessinez le parcours famille selon votre propri\xE9t\xE9, vos espaces et vos publics.",
          "Shape the family journey around your property, spaces and guests.",
          "\u0635\u0645\u0645\u0648\u0627 \u0645\u0633\u0627\u0631 \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u062D\u0633\u0628 \u0645\u0646\u0634\u0623\u062A\u0643\u0645 \u0648\u0645\u0633\u0627\u062D\u0627\u062A\u0647\u0627 \u0648\u0636\u064A\u0648\u0641\u0647\u0627."
        ),
        "hospitality"
      ),
      chapter3(
        w3(
          "Une saison qui se pr\xE9pare",
          "Prepare for the next season",
          "\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0644\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u0642\u0627\u062F\u0645"
        ),
        w3(
          "Activit\xE9s, capacit\xE9, horaires et langues se pr\xE9cisent dans l\u2019\xE9tude de votre programme.",
          "Activities, capacity, hours and languages are defined in your programme study.",
          "\u062A\u062D\u062F\u062F \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0633\u0639\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u0644\u063A\u0627\u062A \u062E\u0644\u0627\u0644 \u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        "holidays"
      ),
      chapter3(
        w3(
          "Le temps de profiter",
          "Time to enjoy the stay",
          "\u0648\u0642\u062A \u0644\u0644\u0627\u0633\u062A\u0645\u062A\u0627\u0639 \u0628\u0627\u0644\u0625\u0642\u0627\u0645\u0629"
        ),
        w3(
          "D\xE9couvrez les parcours garde clients, kids club et conciergerie sans m\xE9langer leurs conditions.",
          "Explore guest childcare, kids club and concierge with their distinct conditions.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0648\u0627\u0644\u0646\u0627\u062F\u064A \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0645\u0639 \u0634\u0631\u0648\u0637 \u0643\u0644 \u0645\u0633\u0627\u0631."
        ),
        "family"
      )
    ],
    steps: [
      w3("Votre propri\xE9t\xE9", "Your property", "\u0645\u0646\u0634\u0623\u062A\u0643\u0645"),
      w3("Les moments famille", "Family moments", "\u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0639\u0627\u0626\u0644\u0629"),
      w3("L\u2019\xE9tude de programme", "Programme study", "\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C"),
      w3("Le d\xE9ploiement convenu", "Agreed deployment", "\u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "hospitality/request",
    primaryLabel: w3(
      "Imaginer mon programme",
      "Shape my programme",
      "\u062A\u0635\u0645\u064A\u0645 \u0628\u0631\u0646\u0627\u0645\u062C\u064A"
    ),
    related: ["home-services", "academy", "quality-check"]
  },
  "health-partners": {
    key: "health-partners",
    label: w3("Partenaires sant\xE9", "Health Partners", "\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0635\u062D\u0629"),
    eyebrow: w3(
      "PLUS DE PR\xC9SENCE POUR LES FAMILLES",
      "MORE SUPPORT FOR FAMILIES",
      "\u062F\u0639\u0645 \u0623\u0643\u0628\u0631 \u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A"
    ),
    title: w3(
      "Entourer les familles. Avec attention et clart\xE9.",
      "Support families. With care and clarity.",
      "\u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0628\u0627\u0647\u062A\u0645\u0627\u0645 \u0648\u0648\u0636\u0648\u062D."
    ),
    lead: w3(
      "Maternit\xE9s et partenaires : explorez des programmes de soutien familial non m\xE9dical, des ateliers et un accompagnement du quotidien avec un cadre explicite.",
      "Explore non-medical family support programmes, workshops and everyday assistance with clear service boundaries.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0628\u0631\u0627\u0645\u062C \u062F\u0639\u0645 \u0623\u0633\u0631\u064A \u063A\u064A\u0631 \u0637\u0628\u064A \u0648\u0648\u0631\u0634\u0627\u062A \u0648\u0645\u0633\u0627\u0639\u062F\u0629 \u064A\u0648\u0645\u064A\u0629 \u0636\u0645\u0646 \u0625\u0637\u0627\u0631 \u062E\u062F\u0645\u0629 \u0648\u0627\u0636\u062D."
    ),
    photo: "health",
    secondaryPhoto: "newborn",
    color: "#00886d",
    companion: "#f42d78",
    signature: w3(
      "Le parcours d\u2019accompagnement familial",
      "The family-support pathway",
      "\u0645\u0633\u0627\u0631 \u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0629"
    ),
    signatureLead: w3(
      "Pr\xE9parer, accueillir, accompagner : explorez les besoins puis le p\xE9rim\xE8tre du programme.",
      "Prepare, welcome and support: explore needs and the programme scope.",
      "\u0625\u0639\u062F\u0627\u062F \u0648\u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u062F\u0639\u0645: \u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0648\u0646\u0637\u0627\u0642 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
    ),
    topics: [
      topic3(
        w3("Mother & Baby Care", "Mother & Baby Care", "\u062F\u0639\u0645 \u0627\u0644\u0623\u0645 \u0648\u0627\u0644\u0637\u0641\u0644"),
        w3(
          "Pr\xE9sence et soutien quotidien non m\xE9dical.",
          "Everyday presence and non-medical support.",
          "\u062D\u0636\u0648\u0631 \u0648\u062F\u0639\u0645 \u064A\u0648\u0645\u064A \u063A\u064A\u0631 \u0637\u0628\u064A."
        ),
        "baby",
        "newborn"
      ),
      topic3(
        w3("Soutien parental", "Parent support", "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646"),
        w3(
          "\xC9couter et orienter avec clart\xE9.",
          "Listen and guide with clarity.",
          "\u0627\u0644\u0627\u0633\u062A\u0645\u0627\u0639 \u0648\u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u0628\u0648\u0636\u0648\u062D."
        ),
        "parent",
        "family"
      ),
      topic3(
        w3("Ateliers familles", "Family workshops", "\u0648\u0631\u0634\u0627\u062A \u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A"),
        w3(
          "Des moments d\u2019information et de d\xE9couverte.",
          "Moments of information and discovery.",
          "\u0644\u062D\u0638\u0627\u062A \u0644\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641."
        ),
        "atelier",
        "academy"
      ),
      topic3(
        w3("Programmes partenaires", "Partner programmes", "\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0634\u0631\u0643\u0627\u0621"),
        w3(
          "Un cadre \xE0 \xE9tudier avec votre structure.",
          "A scope to discuss with your organisation.",
          "\u0646\u0637\u0627\u0642 \u0644\u0644\u062F\u0631\u0627\u0633\u0629 \u0645\u0639 \u0645\u0624\u0633\u0633\u062A\u0643\u0645."
        ),
        "programme",
        "support"
      )
    ],
    chapters: [
      chapter3(
        w3("Une pr\xE9sence qui compte", "Support that matters", "\u062F\u0639\u0645 \u0644\u0647 \u0642\u064A\u0645\u0629"),
        w3(
          "L\u2019accompagnement propos\xE9 concerne le quotidien familial et reste strictement non m\xE9dical.",
          "Support concerns family life and remains strictly non-medical.",
          "\u0627\u0644\u062F\u0639\u0645 \u064A\u062E\u0635 \u0627\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u0623\u0633\u0631\u064A\u0629 \u0648\u064A\u0628\u0642\u0649 \u063A\u064A\u0631 \u0637\u0628\u064A."
        ),
        "health"
      ),
      chapter3(
        w3(
          "Des limites expliqu\xE9es",
          "Clear service boundaries",
          "\u062D\u062F\u0648\u062F \u062E\u062F\u0645\u0629 \u0648\u0627\u0636\u062D\u0629"
        ),
        w3(
          "Consentement, confidentialit\xE9 et p\xE9rim\xE8tre de service se v\xE9rifient avant l\u2019engagement.",
          "Consent, privacy and scope are checked before engagement.",
          "\u062A\u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645."
        ),
        "newborn"
      ),
      chapter3(
        w3(
          "Relier les besoins aux bons parcours",
          "Connect needs to the right pathways",
          "\u0631\u0628\u0637 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0628\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w3(
          "Les familles et les structures ont des demandes diff\xE9rentes : choisissez le parcours qui vous correspond.",
          "Families and organisations have different needs: choose your appropriate pathway.",
          "\u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629: \u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
        ),
        "family"
      )
    ],
    steps: [
      w3("Le besoin familial", "Family need", "\u0627\u062D\u062A\u064A\u0627\u062C \u0627\u0644\u0639\u0627\u0626\u0644\u0629"),
      w3("Le consentement", "Consent", "\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629"),
      w3("Le p\xE9rim\xE8tre non m\xE9dical", "Non-medical scope", "\u0627\u0644\u0646\u0637\u0627\u0642 \u063A\u064A\u0631 \u0627\u0644\u0637\u0628\u064A"),
      w3("Le programme convenu", "Agreed programme", "\u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "health-partners/request",
    primaryLabel: w3(
      "\xC9tudier mon programme",
      "Discuss my programme",
      "\u062F\u0631\u0627\u0633\u0629 \u0628\u0631\u0646\u0627\u0645\u062C\u064A"
    ),
    related: ["home-services", "families", "academy"]
  },
  corporates: {
    key: "corporates",
    label: w3("Entreprises", "Corporate", "\u0627\u0644\u0634\u0631\u0643\u0627\u062A"),
    eyebrow: w3(
      "PRENDRE SOIN DES FAMILLES, SOUTENIR LES \xC9QUIPES",
      "SUPPORT FAMILIES, SUPPORT YOUR PEOPLE",
      "\u062F\u0639\u0645 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0648\u062F\u0639\u0645 \u0627\u0644\u0641\u0631\u0642"
    ),
    title: w3(
      "Un avantage employeur qui entre dans la vraie vie.",
      "An employee benefit that fits real life.",
      "\u0645\u064A\u0632\u0629 \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u062A\u0644\u0627\u0626\u0645 \u062D\u064A\u0627\u062A\u0647\u0645 \u0627\u0644\u0641\u0639\u0644\u064A\u0629."
    ),
    lead: w3(
      "Soutien parental, garde de secours, family days et programmes collaborateurs. Pr\xE9parez une exp\xE9rience famille \xE0 la hauteur de votre culture d\u2019entreprise.",
      "Parent support, backup childcare, family days and employee programmes. Prepare a family experience that reflects your company culture.",
      "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646 \u0648\u0631\u0639\u0627\u064A\u0629 \u0628\u062F\u064A\u0644\u0629 \u0648\u0623\u064A\u0627\u0645 \u0639\u0627\u0626\u0644\u064A\u0629 \u0648\u0628\u0631\u0627\u0645\u062C \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u062A\u0646\u0627\u0633\u0628 \u062B\u0642\u0627\u0641\u0629 \u0634\u0631\u0643\u062A\u0643\u0645."
    ),
    photo: "corporate",
    secondaryPhoto: "family",
    color: "#0873d9",
    companion: "#f42d78",
    signature: w3(
      "Le designer d\u2019avantages familles",
      "The family-benefits designer",
      "\u0645\u0635\u0645\u0645 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0623\u0633\u0631\u064A\u0629"
    ),
    signatureLead: w3(
      "Composez vos priorit\xE9s RH. Votre s\xE9lection pr\xE9pare la discussion ; aucun budget ni quota n\u2019est cr\xE9\xE9 ici.",
      "Choose HR priorities to prepare a discussion. This does not create a budget or entitlement.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629 \u0644\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0646\u0642\u0627\u0634 \u062F\u0648\u0646 \u0625\u0646\u0634\u0627\u0621 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0623\u0648 \u0627\u0633\u062A\u062D\u0642\u0627\u0642."
    ),
    topics: [
      topic3(
        w3("Garde de secours", "Backup childcare", "\u0631\u0639\u0627\u064A\u0629 \u0628\u062F\u064A\u0644\u0629"),
        w3(
          "\xC9tudier les impr\xE9vus de la vie familiale.",
          "Plan for unexpected family needs.",
          "\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0645\u0641\u0627\u062C\u0626\u0629."
        ),
        "garde",
        "care"
      ),
      topic3(
        w3("Parentalit\xE9", "Parent support", "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646"),
        w3(
          "Accompagner les moments qui comptent.",
          "Support the moments that matter.",
          "\u062F\u0639\u0645 \u0627\u0644\u0644\u062D\u0638\u0627\u062A \u0627\u0644\u0645\u0647\u0645\u0629."
        ),
        "parent",
        "newborn"
      ),
      topic3(
        w3("Family days", "Family days", "\u0623\u064A\u0627\u0645 \u0639\u0627\u0626\u0644\u064A\u0629"),
        w3(
          "Partager un autre moment avec les \xE9quipes.",
          "Share a different moment with your teams.",
          "\u0645\u0634\u0627\u0631\u0643\u0629 \u0644\u062D\u0638\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629 \u0645\u0639 \u0627\u0644\u0641\u0631\u0642."
        ),
        "famille",
        "family"
      ),
      topic3(
        w3("Programme collaborateurs", "Employee programme", "\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646"),
        w3(
          "\xC9ligibilit\xE9 et contribution \xE0 pr\xE9ciser ensemble.",
          "Define eligibility and contributions together.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0645\u0639\u0627\u064B."
        ),
        "programme",
        "corporate"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Une politique RH plus proche du quotidien",
          "HR policy closer to everyday life",
          "\u0633\u064A\u0627\u0633\u0629 \u0645\u0648\u0627\u0631\u062F \u0628\u0634\u0631\u064A\u0629 \u0623\u0642\u0631\u0628 \u0644\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629"
        ),
        w3(
          "Commencez par vos populations et leurs besoins, puis d\xE9finissez le cadre du programme.",
          "Start with your people and their needs, then define the programme scope.",
          "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0648\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A\u0647\u0645 \u062B\u0645 \u062D\u062F\u062F\u0648\u0627 \u0625\u0637\u0627\u0631 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        "corporate"
      ),
      chapter3(
        w3(
          "Un cadre lisible pour les collaborateurs",
          "Clear terms for employees",
          "\u0634\u0631\u0648\u0637 \u0648\u0627\u0636\u062D\u0629 \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646"
        ),
        w3(
          "\xC9ligibilit\xE9, contribution et modalit\xE9s d\u2019acc\xE8s doivent \xEAtre convenues avant l\u2019activation.",
          "Eligibility, contributions and access terms are agreed before activation.",
          "\u062A\u062A\u0641\u0642 \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0627\u062A \u0648\u0634\u0631\u0648\u0637 \u0627\u0644\u0648\u0635\u0648\u0644 \u0642\u0628\u0644 \u0627\u0644\u062A\u0641\u0639\u064A\u0644."
        ),
        "family"
      ),
      chapter3(
        w3(
          "Connecter les bonnes solutions",
          "Connect the right solutions",
          "\u0631\u0628\u0637 \u0627\u0644\u062D\u0644\u0648\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w3(
          "D\xE9couvrez les offres de ce catalogue et pr\xE9parez une demande adapt\xE9e \xE0 votre entreprise.",
          "Explore this catalogue and prepare a request for your company.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0623\u0639\u062F\u0648\u0627 \u0637\u0644\u0628\u0627\u064B \u064A\u0646\u0627\u0633\u0628 \u0634\u0631\u0643\u062A\u0643\u0645."
        ),
        "desk"
      )
    ],
    steps: [
      w3("Les populations concern\xE9es", "Eligible populations", "\u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u0639\u0646\u064A\u0629"),
      w3(
        "Les besoins prioritaires",
        "Priority needs",
        "\u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0630\u0627\u062A \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629"
      ),
      w3("Les r\xE8gles convenues", "Agreed rules", "\u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627"),
      w3("L\u2019activation du programme", "Programme activation", "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C")
    ],
    primary: "corporates/request",
    primaryLabel: w3(
      "Cr\xE9er mon projet familles",
      "Start my family-benefits project",
      "\u0628\u062F\u0621 \u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0623\u0633\u0631\u064A\u0629"
    ),
    related: ["home-services", "partner-os", "hospitality"]
  },
  "partner-os": {
    key: "partner-os",
    label: w3("Partner OS", "Partner OS", "Partner OS"),
    eyebrow: w3(
      "VOTRE ORGANISATION, MIEUX CONNECT\xC9E",
      "YOUR ORGANISATION, BETTER CONNECTED",
      "\u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0623\u0643\u062B\u0631 \u062A\u0631\u0627\u0628\u0637\u0627\u064B"
    ),
    title: w3(
      "Une nouvelle perspective sur votre quotidien.",
      "A new perspective on everyday operations.",
      "\u0645\u0646\u0638\u0648\u0631 \u062C\u062F\u064A\u062F \u0644\u0644\u0639\u0645\u0644 \u0627\u0644\u064A\u0648\u0645\u064A."
    ),
    lead: w3(
      "Explorez les plans publi\xE9s, les modules d\xE9clar\xE9s et les parcours d\u2019activation. Trouvez le cadre qui correspond \xE0 votre organisation, sans perdre la ma\xEEtrise des conditions.",
      "Explore published plans, declared modules and activation pathways. Find the right fit while keeping terms clear.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062E\u0637\u0637 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0646\u0629 \u0648\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
    ),
    photo: "desk",
    secondaryPhoto: "school",
    color: "#087da7",
    companion: "#7539d9",
    signature: w3(
      "L\u2019explorateur de plans Partner OS",
      "The Partner OS plan explorer",
      "\u0645\u0633\u062A\u0643\u0634\u0641 \u062E\u0637\u0637 Partner OS"
    ),
    signatureLead: w3(
      "Comparez les prix et p\xE9riodes r\xE9ellement publi\xE9s. Une d\xE9monstration pr\xE9pare votre configuration.",
      "Compare actual published prices and billing periods. A demonstration helps prepare your configuration.",
      "\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0641\u062A\u0631\u0627\u062A \u0627\u0644\u0641\u0648\u062A\u0631\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629. \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A \u064A\u0633\u0627\u0639\u062F \u0641\u064A \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062A\u0647\u064A\u0626\u0629."
    ),
    topics: [
      topic3(
        w3("Organisation", "Organisation", "\u0627\u0644\u062A\u0646\u0638\u064A\u0645"),
        w3(
          "Explorer la structure des plans.",
          "Explore how plans are structured.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0628\u0646\u064A\u0629 \u0627\u0644\u062E\u0637\u0637."
        ),
        "organisation",
        "desk"
      ),
      topic3(
        w3("\xC9quipes", "Teams", "\u0627\u0644\u0641\u0631\u0642"),
        w3(
          "\xC9tudier les besoins de vos collaborateurs.",
          "Discuss your team\u2019s needs.",
          "\u062F\u0631\u0627\u0633\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0641\u0631\u064A\u0642\u0643\u0645."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic3(
        w3("Modules", "Modules", "\u0627\u0644\u0648\u062D\u062F\u0627\u062A"),
        w3(
          "V\xE9rifier ce qui est inclus dans l\u2019offre.",
          "Check what an offer includes.",
          "\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0627 \u064A\u062A\u0636\u0645\u0646\u0647 \u0627\u0644\u0639\u0631\u0636."
        ),
        "module",
        "digital"
      ),
      topic3(
        w3("Activation", "Activation", "\u0627\u0644\u062A\u0641\u0639\u064A\u0644"),
        w3(
          "Pr\xE9parer votre parcours avec l\u2019\xE9quipe.",
          "Prepare your journey with the team.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0633\u0627\u0631 \u0645\u0639 \u0627\u0644\u0641\u0631\u064A\u0642."
        ),
        "plan",
        "school"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Voir clair avant d\u2019activer",
          "Get clarity before activation",
          "\u0648\u0636\u0648\u062D \u0642\u0628\u0644 \u0627\u0644\u062A\u0641\u0639\u064A\u0644"
        ),
        w3(
          "Consultez les modules, les limites et les conditions propres au plan publi\xE9.",
          "Check the modules, limits and terms of the published plan.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0627\u0644\u062D\u062F\u0648\u062F \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629."
        ),
        "desk"
      ),
      chapter3(
        w3(
          "Comparer sans extrapoler",
          "Compare actual terms",
          "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u0641\u0639\u0644\u064A\u0629"
        ),
        w3(
          "Un prix mensuel et un prix annuel restent deux conditions distinctes. Aucun tarif annuel n\u2019est calcul\xE9 ici.",
          "Monthly and annual prices are separate terms. No annual price is calculated here.",
          "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0634\u0647\u0631\u064A \u0648\u0627\u0644\u0633\u0646\u0648\u064A \u0634\u0631\u0637\u0627\u0646 \u0645\u062E\u062A\u0644\u0641\u0627\u0646 \u0648\u0644\u0627 \u064A\u062D\u0633\u0628 \u0633\u0639\u0631 \u0633\u0646\u0648\u064A \u0647\u0646\u0627."
        ),
        "digital"
      ),
      chapter3(
        w3(
          "Une d\xE9monstration \xE0 votre contexte",
          "A demonstration for your context",
          "\u0639\u0631\u0636 \u062A\u0648\u0636\u064A\u062D\u064A \u064A\u0646\u0627\u0633\u0628 \u0633\u064A\u0627\u0642\u0643\u0645"
        ),
        w3(
          "Pr\xE9parez vos questions puis d\xE9marrez la demande de d\xE9monstration existante.",
          "Prepare your questions and start the demonstration request.",
          "\u0623\u0639\u062F\u0648\u0627 \u0623\u0633\u0626\u0644\u062A\u0643\u0645 \u0648\u0627\u0628\u062F\u0624\u0648\u0627 \u0637\u0644\u0628 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A."
        ),
        "school"
      )
    ],
    steps: [
      w3("Votre organisation", "Your organisation", "\u0645\u0624\u0633\u0633\u062A\u0643\u0645"),
      w3("Le plan adapt\xE9", "The suitable plan", "\u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"),
      w3("La d\xE9monstration", "The demonstration", "\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A"),
      w3("L\u2019activation convenue", "Agreed activation", "\u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647")
    ],
    primary: "partner-os/contact",
    primaryLabel: w3(
      "Demander une d\xE9monstration",
      "Request a demonstration",
      "\u0637\u0644\u0628 \u0639\u0631\u0636 \u062A\u0648\u0636\u064A\u062D\u064A"
    ),
    related: ["establishments", "quality-check", "corporates"]
  },
  "quality-check": {
    key: "quality-check",
    label: w3("Quality Check 360", "Quality Check 360", "Quality Check 360"),
    eyebrow: w3(
      "FAIRE DE LA QUALIT\xC9 UNE DIRECTION",
      "MAKE QUALITY YOUR DIRECTION",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u062C\u0647\u062A\u0643\u0645"
    ),
    title: w3(
      "Voir plus clair. D\xE9cider mieux. Avancer.",
      "See clearly. Decide better. Move forward.",
      "\u0631\u0624\u064A\u0629 \u0623\u0648\u0636\u062D \u0648\u0642\u0631\u0627\u0631\u0627\u062A \u0623\u0641\u0636\u0644 \u0648\u062A\u0642\u062F\u0645."
    ),
    lead: w3(
      "\xC9valuations, r\xE9f\xE9rentiels et accompagnement de la qualit\xE9. Explorez le p\xE9rim\xE8tre d\u2019une \xE9valuation et pr\xE9parez les questions qui comptent pour votre organisation.",
      "Explore assessments, frameworks and quality support. Define an assessment scope and prepare the questions that matter.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0637\u0631 \u0648\u062F\u0639\u0645 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u062D\u062F\u062F\u0648\u0627 \u0646\u0637\u0627\u0642 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0647\u0645\u0629."
    ),
    photo: "support",
    secondaryPhoto: "school",
    color: "#00876b",
    companion: "#0873d9",
    signature: w3(
      "La boussole de votre \xE9valuation",
      "Your assessment compass",
      "\u0628\u0648\u0635\u0644\u0629 \u062A\u0642\u064A\u064A\u0645 \u0645\u0624\u0633\u0633\u062A\u0643\u0645"
    ),
    signatureLead: w3(
      "Choisissez les dimensions \xE0 discuter. Ce rep\xE9rage ne d\xE9livre aucun score ni certificat.",
      "Choose dimensions to discuss. This preparation does not issue a score or certificate.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629. \u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0644\u0627 \u064A\u0645\u0646\u062D \u0646\u062A\u064A\u062C\u0629 \u0623\u0648 \u0634\u0647\u0627\u062F\u0629."
    ),
    topics: [
      topic3(
        w3("Cadre & organisation", "Framework & operations", "\u0627\u0644\u0625\u0637\u0627\u0631 \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645"),
        w3(
          "Rendre le p\xE9rim\xE8tre lisible.",
          "Make the scope clear.",
          "\u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0646\u0637\u0627\u0642."
        ),
        "organisation",
        "desk"
      ),
      topic3(
        w3("S\xE9curit\xE9 & pratiques", "Safety & practice", "\u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"),
        w3(
          "Explorer les crit\xE8res de l\u2019\xE9valuation.",
          "Explore assessment criteria.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062A\u0642\u064A\u064A\u0645."
        ),
        "s\xE9curit\xE9",
        "support"
      ),
      topic3(
        w3("\xC9quipes & comp\xE9tences", "Teams & skills", "\u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A"),
        w3(
          "Identifier les sujets \xE0 approfondir.",
          "Identify topics to explore further.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0648\u0627\u0636\u064A\u0639 \u0644\u0644\u062A\u0639\u0645\u0642."
        ),
        "\xE9quipe",
        "professional"
      ),
      topic3(
        w3("Am\xE9lioration", "Improvement", "\u0627\u0644\u062A\u062D\u0633\u064A\u0646"),
        w3(
          "Pr\xE9parer des prochaines \xE9tapes discut\xE9es.",
          "Prepare the next steps to discuss.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629."
        ),
        "qualit\xE9",
        "school"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Commencer par les bonnes questions",
          "Start with the right questions",
          "\u0627\u0644\u0628\u062F\u0621 \u0628\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629"
        ),
        w3(
          "Identifiez le contexte, les documents et les domaines utiles \xE0 votre demande.",
          "Identify the context, documents and areas relevant to your request.",
          "\u062D\u062F\u062F\u0648\u0627 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0648\u0627\u0644\u0645\u062C\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0637\u0644\u0628\u0643\u0645."
        ),
        "support"
      ),
      chapter3(
        w3(
          "Des preuves avant les conclusions",
          "Evidence before conclusions",
          "\u0627\u0644\u0623\u062F\u0644\u0629 \u0642\u0628\u0644 \u0627\u0644\u0627\u0633\u062A\u0646\u062A\u0627\u062C\u0627\u062A"
        ),
        w3(
          "Les r\xE9sultats et scores appartiennent \xE0 une \xE9valuation r\xE9elle ; ce storefront pr\xE9sente les parcours disponibles.",
          "Results and scores come from real assessments; this page presents available pathways.",
          "\u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0645\u0646 \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0641\u0639\u0644\u064A\u0629 \u0648\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u062A\u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629."
        ),
        "school"
      ),
      chapter3(
        w3(
          "Lier qualit\xE9 et progression",
          "Connect quality and progress",
          "\u0631\u0628\u0637 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u0642\u062F\u0645"
        ),
        w3(
          "Explorez Academy et Partner OS pour compl\xE9ter votre projet d\u2019am\xE9lioration.",
          "Explore Academy and Partner OS to complement your improvement project.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u0644\u062A\u0643\u0645\u0644\u0629 \u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u062A\u062D\u0633\u064A\u0646."
        ),
        "desk"
      )
    ],
    steps: [
      w3("D\xE9finir le p\xE9rim\xE8tre", "Define scope", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0646\u0637\u0627\u0642"),
      w3("Pr\xE9parer les preuves", "Prepare evidence", "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0623\u062F\u0644\u0629"),
      w3("R\xE9aliser l\u2019\xE9valuation", "Conduct assessment", "\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u062A\u0642\u064A\u064A\u0645"),
      w3(
        "\xC9tudier les prochaines actions",
        "Discuss next actions",
        "\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
      )
    ],
    primary: "establishments/quality-check-360",
    primaryLabel: w3(
      "Explorer l\u2019\xE9valuation 360",
      "Explore the 360 assessment",
      "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u062A\u0642\u064A\u064A\u0645 360"
    ),
    related: ["establishments", "academy", "partner-os"]
  },
  professionals: {
    key: "professionals",
    label: w3("Professionnels", "Professionals", "\u0627\u0644\u0645\u0647\u0646\u064A\u0648\u0646"),
    eyebrow: w3(
      "VOTRE TALENT, UN NOUVEL HORIZON",
      "YOUR TALENT, A NEW HORIZON",
      "\u0645\u0648\u0647\u0628\u062A\u0643\u0645 \u0648\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629"
    ),
    title: w3(
      "Faites de votre prochaine \xE9tape une vraie ambition.",
      "Make your next step a real ambition.",
      "\u0627\u062C\u0639\u0644\u0648\u0627 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0637\u0645\u0648\u062D\u0627\u064B \u062D\u0642\u064A\u0642\u064A\u0627\u064B."
    ),
    lead: w3(
      "Formation, comp\xE9tences et parcours professionnels : explorez les offres publi\xE9es et pr\xE9parez un projet qui valorise votre engagement aupr\xE8s des enfants et des familles.",
      "Explore published training and professional pathways and prepare a project that values your commitment to children and families.",
      "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0623\u0639\u062F\u0648\u0627 \u0645\u0634\u0631\u0648\u0639\u0627\u064B \u064A\u062B\u0645\u0646 \u0627\u0644\u062A\u0632\u0627\u0645\u0643\u0645 \u062A\u062C\u0627\u0647 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062A."
    ),
    photo: "professional",
    secondaryPhoto: "academy",
    color: "#7539d9",
    companion: "#f42d78",
    signature: w3(
      "La carte de votre prochaine \xE9tape",
      "Your next-step map",
      "\u062E\u0631\u064A\u0637\u0629 \u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629"
    ),
    signatureLead: w3(
      "Choisissez votre axe de progression. Les opportunit\xE9s et conditions restent celles des offres publi\xE9es.",
      "Choose a direction for growth. Opportunities and terms come from published offers.",
      "\u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u062A\u0642\u062F\u0645\u060C \u0645\u0639 \u0641\u0631\u0635 \u0648\u0634\u0631\u0648\u0637 \u062D\u0633\u0628 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629."
    ),
    topics: [
      topic3(
        w3("Accompagnement enfance", "Childcare practice", "\u062F\u0639\u0645 \u0627\u0644\u0637\u0641\u0648\u0644\u0629"),
        w3(
          "Explorer les comp\xE9tences du terrain.",
          "Explore hands-on skills.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629."
        ),
        "enfance",
        "care"
      ),
      topic3(
        w3("P\xE9dagogie", "Education", "\u0627\u0644\u062A\u0631\u0628\u064A\u0629"),
        w3(
          "Donner du sens aux activit\xE9s.",
          "Bring purpose to activities.",
          "\u0645\u0646\u062D \u0647\u062F\u0641 \u0644\u0644\u0623\u0646\u0634\u0637\u0629."
        ),
        "montessori",
        "montessori"
      ),
      topic3(
        w3("Formation & parcours", "Training & pathways", "\u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0648\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A"),
        w3(
          "Pr\xE9parer votre prochaine comp\xE9tence.",
          "Prepare your next skill.",
          "\u0625\u0639\u062F\u0627\u062F \u0645\u0647\u0627\u0631\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
        ),
        "formation",
        "academy"
      ),
      topic3(
        w3("Projet professionnel", "Professional project", "\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0647\u0646\u064A"),
        w3(
          "Identifier le parcours qui vous correspond.",
          "Find the pathway that fits.",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."
        ),
        "profession",
        "professional"
      )
    ],
    chapters: [
      chapter3(
        w3(
          "Votre engagement a de la valeur",
          "Your commitment has value",
          "\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0643\u0645 \u0642\u064A\u0645\u0629"
        ),
        w3(
          "Explorez les parcours adapt\xE9s \xE0 vos objectifs et au contexte dans lequel vous souhaitez exercer.",
          "Explore pathways for your goals and intended work context.",
          "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0645\u0633\u0627\u0631\u0627\u062A \u062A\u0646\u0627\u0633\u0628 \u0623\u0647\u062F\u0627\u0641\u0643\u0645 \u0648\u0633\u064A\u0627\u0642 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628."
        ),
        "professional"
      ),
      chapter3(
        w3(
          "Renforcer sa pratique",
          "Strengthen your practice",
          "\u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629"
        ),
        w3(
          "Les contenus, pr\xE9requis et conditions d\u2019\xE9valuation se consultent dans chaque offre.",
          "Check content, prerequisites and assessment conditions in each offer.",
          "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0641\u064A \u0643\u0644 \u0639\u0631\u0636."
        ),
        "academy"
      ),
      chapter3(
        w3(
          "Choisir la bonne prochaine \xE9tape",
          "Choose the right next step",
          "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062E\u0637\u0648\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629"
        ),
        w3(
          "Une demande Academy permet d\u2019\xE9tudier un parcours. Elle ne constitue pas une promesse d\u2019emploi.",
          "An Academy request helps discuss a pathway and does not promise employment.",
          "\u0637\u0644\u0628 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0645\u0633\u0627\u0631 \u0648\u0644\u0627 \u064A\u0645\u062B\u0644 \u0648\u0639\u062F\u0627\u064B \u0628\u0627\u0644\u062A\u0648\u0638\u064A\u0641."
        ),
        "care"
      )
    ],
    steps: [
      w3("Votre projet", "Your project", "\u0645\u0634\u0631\u0648\u0639\u0643\u0645"),
      w3("Les comp\xE9tences vis\xE9es", "Target skills", "\u0627\u0644\u0645\u0647\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629"),
      w3("Le parcours adapt\xE9", "The suitable pathway", "\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628"),
      w3("Les conditions de l\u2019offre", "Offer conditions", "\u0634\u0631\u0648\u0637 \u0627\u0644\u0639\u0631\u0636")
    ],
    primary: "academy/request",
    primaryLabel: w3(
      "Pr\xE9parer mon parcours professionnel",
      "Prepare my professional pathway",
      "\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0627\u0631\u064A \u0627\u0644\u0645\u0647\u0646\u064A"
    ),
    related: ["academy", "development", "home-services"]
  }
};
var C3 = {
  explore: w3("Explorer les offres", "Explore offers", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0639\u0631\u0648\u0636"),
  all: w3("Tout explorer", "Explore all", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0643\u0644"),
  catalogue: w3(
    "La s\xE9lection \xE0 explorer",
    "Your discovery selection",
    "\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0644\u0644\u0627\u0633\u062A\u0643\u0634\u0627\u0641"
  ),
  search: w3(
    "Une envie, un mot, un objectif\u2026",
    "An interest, a word, a goal\u2026",
    "\u0627\u0647\u062A\u0645\u0627\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0623\u0648 \u0647\u062F\u0641\u2026"
  ),
  discover: w3("D\xE9couvrir", "Discover", "\u0627\u0643\u062A\u0634\u0641"),
  featured: w3(
    "\xC0 la une de cet univers",
    "In the spotlight",
    "\u0641\u064A \u0648\u0627\u062C\u0647\u0629 \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0644\u0645"
  ),
  topics: w3(
    "Entrez par ce qui vous inspire",
    "Start with what inspires you",
    "\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u0645\u0627 \u064A\u0644\u0647\u0645\u0643\u0645"
  ),
  editorial: w3("De nouvelles perspectives", "New perspectives", "\u0622\u0641\u0627\u0642 \u062C\u062F\u064A\u062F\u0629"),
  collections: w3(
    "Des collections pour vous guider",
    "Collections to guide you",
    "\u0645\u062C\u0645\u0648\u0639\u0627\u062A \u0644\u062A\u0648\u062C\u064A\u0647\u0643\u0645"
  ),
  published: w3("offres publi\xE9es", "published offers", "\u0639\u0631\u0648\u0636 \u0645\u0646\u0634\u0648\u0631\u0629"),
  resources: w3(
    "Ressources & programmes publi\xE9s",
    "Published resources & programmes",
    "\u0645\u0648\u0627\u0631\u062F \u0648\u0628\u0631\u0627\u0645\u062C \u0645\u0646\u0634\u0648\u0631\u0629"
  ),
  empty: w3(
    "Ce catalogue se pr\xE9pare. Les offres apparaissent ici d\xE8s leur publication.",
    "This catalogue is being prepared. Offers appear here when published.",
    "\u0647\u0630\u0627 \u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C \u0642\u064A\u062F \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u060C \u0648\u062A\u0638\u0647\u0631 \u0627\u0644\u0639\u0631\u0648\u0636 \u0639\u0646\u062F \u0646\u0634\u0631\u0647\u0627."
  ),
  noMatch: w3(
    "Aucune offre ne correspond \xE0 ces crit\xE8res. Essayez une s\xE9lection plus large.",
    "No offers match these criteria. Try a broader selection.",
    "\u0644\u0627 \u0639\u0631\u0648\u0636 \u062A\u0637\u0627\u0628\u0642 \u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631. \u062C\u0631\u0628\u0648\u0627 \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u064B \u0623\u0648\u0633\u0639."
  ),
  emptyResources: w3(
    "Les ressources publi\xE9es seront pr\xE9sent\xE9es ici.",
    "Published resources will appear here.",
    "\u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0647\u0646\u0627."
  ),
  reset: w3("Tout r\xE9initialiser", "Reset all", "\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u0627\u0644\u0643\u0644"),
  more: w3("Afficher plus d\u2019offres", "Show more offers", "\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F"),
  save: w3("Enregistrer", "Save", "\u062D\u0641\u0638"),
  saved: w3("Enregistr\xE9", "Saved", "\u0645\u062D\u0641\u0648\u0638"),
  compare: w3("Comparer", "Compare", "\u0645\u0642\u0627\u0631\u0646\u0629"),
  compareTitle: w3(
    "Le bon choix se voit dans les d\xE9tails",
    "The right choice is in the details",
    "\u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0641\u064A \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644"
  ),
  remove: w3("Retirer", "Remove", "\u0625\u0632\u0627\u0644\u0629"),
  compareEmpty: w3(
    "Ajoutez jusqu\u2019\xE0 quatre offres avec le bouton Comparer.",
    "Add up to four offers using Compare.",
    "\u0623\u0636\u064A\u0641\u0648\u0627 \u062D\u062A\u0649 \u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629."
  ),
  continue: w3(
    "Retrouvez le fil de votre d\xE9couverte",
    "Pick up where you left off",
    "\u062A\u0627\u0628\u0639\u0648\u0627 \u0645\u0646 \u062D\u064A\u062B \u062A\u0648\u0642\u0641\u062A\u0645"
  ),
  recent: w3("Vus r\xE9cemment", "Recently viewed", "\u0634\u0648\u0647\u062F\u062A \u0645\u0624\u062E\u0631\u0627\u064B"),
  savedEmpty: w3(
    "Gardez vos coups de c\u0153ur avec le bouton Enregistrer.",
    "Keep your favourites using Save.",
    "\u0627\u062D\u062A\u0641\u0638\u0648\u0627 \u0628\u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u062D\u0641\u0638."
  ),
  recentEmpty: w3(
    "Les fiches que vous ouvrez appara\xEEtront ici.",
    "Offer pages you open will appear here.",
    "\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062A\u064A \u062A\u0641\u062A\u062D\u0648\u0646\u0647\u0627 \u0633\u062A\u0638\u0647\u0631 \u0647\u0646\u0627."
  ),
  selectionError: w3(
    "La s\xE9lection n\u2019a pas pu \xEAtre enregistr\xE9e. R\xE9essayez.",
    "The selection could not be saved. Try again.",
    "\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631. \u062D\u0627\u0648\u0644\u0648\u0627 \u0645\u062C\u062F\u062F\u0627\u064B."
  ),
  compareLimit: w3(
    "Quatre offres maximum. Retirez une offre avant d\u2019en ajouter une autre.",
    "Four offers maximum. Remove one before adding another.",
    "\u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636 \u0643\u062D\u062F \u0623\u0642\u0635\u0649. \u0623\u0632\u064A\u0644\u0648\u0627 \u0639\u0631\u0636\u0627\u064B \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0622\u062E\u0631."
  ),
  trust: w3(
    "Les d\xE9tails qui vous aident \xE0 d\xE9cider",
    "Details that help you decide",
    "\u062A\u0641\u0627\u0635\u064A\u0644 \u062A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0627\u0631"
  ),
  trustLead: w3(
    "Consultez le contenu, le prix, le p\xE9rim\xE8tre et les conditions de l\u2019offre avant de poursuivre.",
    "Check content, price, scope and offer conditions before continuing.",
    "\u0631\u0627\u062C\u0639\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0644\u0633\u0639\u0631 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0642\u0628\u0644 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629."
  ),
  journey: w3(
    "Votre prochaine \xE9tape, en toute clart\xE9",
    "A clear next step",
    "\u062E\u0637\u0648\u0629 \u0642\u0627\u062F\u0645\u0629 \u0648\u0627\u0636\u062D\u0629"
  ),
  related: w3(
    "Votre d\xE9couverte ne s\u2019arr\xEAte pas ici",
    "There is more to discover",
    "\u0627\u0644\u0645\u0632\u064A\u062F \u064A\u0646\u062A\u0638\u0631 \u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641"
  ),
  faq: w3(
    "Les r\xE9ponses avant de choisir",
    "Answers before you choose",
    "\u0625\u062C\u0627\u0628\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631"
  ),
  final: w3(
    "Votre prochaine \xE9tape commence ici.",
    "Your next step starts here.",
    "\u062E\u0637\u0648\u062A\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u062A\u0628\u062F\u0623 \u0647\u0646\u0627."
  ),
  price: w3("Prix", "Price", "\u0627\u0644\u0633\u0639\u0631"),
  format: w3("Format", "Format", "\u0627\u0644\u0634\u0643\u0644"),
  age: w3("\xC2ge", "Age", "\u0627\u0644\u0639\u0645\u0631"),
  contents: w3("Contenu publi\xE9", "Published contents", "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0646\u0634\u0648\u0631"),
  conditions: w3("Consulter les conditions", "See conditions", "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0634\u0631\u0648\u0637"),
  available: w3("Disponible", "Available", "\u0645\u062A\u0627\u062D"),
  limited: w3("Disponibilit\xE9 limit\xE9e", "Limited availability", "\u062A\u0648\u0641\u0631 \u0645\u062D\u062F\u0648\u062F"),
  unavailable: w3(
    "Indisponible actuellement",
    "Currently unavailable",
    "\u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B"
  ),
  quote: w3("Proposition \xE0 \xE9tudier", "Discuss a proposal", "\u062F\u0631\u0627\u0633\u0629 \u0639\u0631\u0636"),
  noPrice: w3("Prix \xE0 confirmer", "Price to confirm", "\u0627\u0644\u0633\u0639\u0631 \u0644\u0644\u062A\u0623\u0643\u064A\u062F"),
  from: w3("D\xE8s", "From", "\u0627\u0628\u062A\u062F\u0627\u0621 \u0645\u0646"),
  type: w3("Type d\u2019offre", "Offer type", "\u0646\u0648\u0639 \u0627\u0644\u0639\u0631\u0636"),
  availability: w3("Disponibilit\xE9", "Availability", "\u0627\u0644\u062A\u0648\u0641\u0631"),
  sort: w3("Trier", "Sort", "\u0627\u0644\u062A\u0631\u062A\u064A\u0628"),
  recommended: w3("Ordre du catalogue", "Catalogue order", "\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C"),
  priceAsc: w3("Prix croissant", "Price: low to high", "\u0627\u0644\u0633\u0639\u0631 \u062A\u0635\u0627\u0639\u062F\u064A\u0627\u064B"),
  priceDesc: w3("Prix d\xE9croissant", "Price: high to low", "\u0627\u0644\u0633\u0639\u0631 \u062A\u0646\u0627\u0632\u0644\u064A\u0627\u064B"),
  name: w3("Nom", "Name", "\u0627\u0644\u0627\u0633\u0645"),
  configuration: w3("D\xE9tails de l\u2019offre", "Offer details", "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0639\u0631\u0636"),
  prepare: w3("Pr\xE9parer mon projet", "Prepare my project", "\u0625\u0639\u062F\u0627\u062F \u0645\u0634\u0631\u0648\u0639\u064A"),
  summary: w3(
    "Votre s\xE9lection de priorit\xE9s",
    "Your selected priorities",
    "\u0623\u0648\u0644\u0648\u064A\u0627\u062A\u0643\u0645 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629"
  ),
  copy: w3("Copier mon r\xE9sum\xE9", "Copy my summary", "\u0646\u0633\u062E \u0645\u0644\u062E\u0635\u064A"),
  copied: w3("R\xE9sum\xE9 copi\xE9", "Summary copied", "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0645\u0644\u062E\u0635"),
  copyFailed: w3(
    "Copie impossible. S\xE9lectionnez le texte du r\xE9sum\xE9.",
    "Copy failed. Select the summary text.",
    "\u062A\u0639\u0630\u0631 \u0627\u0644\u0646\u0633\u062E. \u062D\u062F\u062F\u0648\u0627 \u0646\u0635 \u0627\u0644\u0645\u0644\u062E\u0635."
  ),
  note: w3(
    "Ce rep\xE9rage pr\xE9pare votre demande. Les conditions seront pr\xE9cis\xE9es dans le parcours d\xE9di\xE9.",
    "This preparation supports your request. Terms are clarified in the dedicated journey.",
    "\u0647\u0630\u0627 \u0627\u0644\u0625\u0639\u062F\u0627\u062F \u064A\u062F\u0639\u0645 \u0637\u0644\u0628\u0643\u0645 \u0648\u062A\u062D\u062F\u062F \u0627\u0644\u0634\u0631\u0648\u0637 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u062E\u0635\u0635."
  ),
  pause: w3("Mettre en pause", "Pause", "\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A"),
  play: w3("Activer les transitions", "Enable transitions", "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644\u0627\u062A"),
  previous: w3("Pr\xE9c\xE9dent", "Previous", "\u0627\u0644\u0633\u0627\u0628\u0642"),
  next: w3("Suivant", "Next", "\u0627\u0644\u062A\u0627\u0644\u064A"),
  unknown: w3(
    "Non indiqu\xE9 sur l\u2019offre",
    "Not listed on the offer",
    "\u063A\u064A\u0631 \u0645\u0630\u0643\u0648\u0631 \u0641\u064A \u0627\u0644\u0639\u0631\u0636"
  ),
  noMedia: w3("Visuel non renseign\xE9", "Image not provided", "\u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629"),
  planner: w3("Pr\xE9paration de projet", "Project preparation", "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0634\u0631\u0648\u0639"),
  nativeLead: w3(
    "D\xE9couvrez \xE9galement les contenus publi\xE9s dans cet univers.",
    "Also explore the content published in this universe.",
    "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0623\u064A\u0636\u0627\u064B \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0646\u0634\u0648\u0631 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0644\u0645."
  ),
  nonMedical: w3(
    "Accompagnement non m\xE9dical : aucun diagnostic, prescription ou administration de m\xE9dicaments.",
    "Non-medical support: no diagnosis, prescriptions or medication administration.",
    "\u062F\u0639\u0645 \u063A\u064A\u0631 \u0637\u0628\u064A: \u062F\u0648\u0646 \u062A\u0634\u062E\u064A\u0635 \u0623\u0648 \u0648\u0635\u0641\u0627\u062A \u0623\u0648 \u0625\u0639\u0637\u0627\u0621 \u0623\u062F\u0648\u064A\u0629."
  ),
  months: w3("mois", "months", "\u0623\u0634\u0647\u0631"),
  minutes: w3("min", "min", "\u062F\u0642\u064A\u0642\u0629"),
  years: w3("ans", "years", "\u0633\u0646\u0648\u0627\u062A"),
  service: w3("Service", "Service", "\u062E\u062F\u0645\u0629"),
  product: w3("Produit", "Product", "\u0645\u0646\u062A\u062C"),
  training: w3("Formation", "Training", "\u062A\u062F\u0631\u064A\u0628"),
  audit: w3("\xC9valuation", "Assessment", "\u062A\u0642\u064A\u064A\u0645"),
  kit: w3("Kit", "Kit", "\u0645\u062C\u0645\u0648\u0639\u0629"),
  saas_module: w3("Partner OS", "Partner OS", "Partner OS"),
  monthly: w3("Mensuel", "Monthly", "\u0634\u0647\u0631\u064A"),
  quarterly: w3("Trimestriel", "Quarterly", "\u0631\u0628\u0639 \u0633\u0646\u0648\u064A"),
  annual: w3("Annuel", "Annual", "\u0633\u0646\u0648\u064A"),
  custom: w3("Conditions sp\xE9cifiques", "Custom terms", "\u0634\u0631\u0648\u0637 \u062E\u0627\u0635\u0629"),
  plan: w3("Plan publi\xE9", "Published plan", "\u062E\u0637\u0629 \u0645\u0646\u0634\u0648\u0631\u0629"),
  modules: w3("modules d\xE9clar\xE9s", "declared modules", "\u0648\u062D\u062F\u0627\u062A \u0645\u0639\u0644\u0646\u0629"),
  faq1: w3(
    "Comment choisir la bonne offre ?",
    "How do I choose an offer?",
    "\u0643\u064A\u0641 \u0623\u062E\u062A\u0627\u0631 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u061F"
  ),
  answer1: w3(
    "Explorez les contenus, comparez les d\xE9tails puis consultez la fiche. Le parcours de l\u2019offre pr\xE9cise les conditions avant votre engagement.",
    "Explore content, compare details and open the offer page. Its journey clarifies terms before commitment.",
    "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0648\u0642\u0627\u0631\u0646\u0648\u0627 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0648\u0627\u0641\u062A\u062D\u0648\u0627 \u0635\u0641\u062D\u0629 \u0627\u0644\u0639\u0631\u0636 \u0644\u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0634\u0631\u0648\u0637 \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645."
  ),
  faq2: w3(
    "Une offre indisponible reste-t-elle consultable ?",
    "Can I still view an unavailable offer?",
    "\u0647\u0644 \u064A\u0645\u0643\u0646 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0639\u0631\u0636 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u061F"
  ),
  answer2: w3(
    "Oui, sa fiche reste accessible. Son affichage ne garantit ni stock ni cr\xE9neau ; les conditions sont v\xE9rifi\xE9es dans le parcours concern\xE9.",
    "Yes. Its page remains accessible. Display does not guarantee stock or a slot; terms are checked in the relevant journey.",
    "\u0646\u0639\u0645 \u062A\u0628\u0642\u0649 \u0627\u0644\u0635\u0641\u062D\u0629 \u0645\u062A\u0627\u062D\u0629. \u0627\u0644\u0639\u0631\u0636 \u0644\u0627 \u064A\u0636\u0645\u0646 \u0645\u062E\u0632\u0648\u0646\u0627\u064B \u0623\u0648 \u0645\u0648\u0639\u062F\u0627\u064B \u0648\u062A\u0631\u0627\u062C\u0639 \u0627\u0644\u0634\u0631\u0648\u0637 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0639\u0646\u064A."
  ),
  faq3: w3(
    "Puis-je pr\xE9parer une s\xE9lection avant de d\xE9cider ?",
    "Can I prepare a selection before deciding?",
    "\u0647\u0644 \u064A\u0645\u0643\u0646 \u0625\u0639\u062F\u0627\u062F \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u0642\u0631\u0627\u0631\u061F"
  ),
  answer3: w3(
    "Enregistrez vos favoris ou comparez jusqu\u2019\xE0 quatre offres. Les comparaisons affichent uniquement les informations renseign\xE9es.",
    "Save favourites or compare up to four offers. Comparisons show only provided information.",
    "\u0627\u062D\u0641\u0638\u0648\u0627 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0623\u0648 \u0642\u0627\u0631\u0646\u0648\u0627 \u062D\u062A\u0649 \u0623\u0631\u0628\u0639\u0629 \u0639\u0631\u0648\u0636\u060C \u0645\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629 \u0641\u0642\u0637."
  )
};
var text2 = (value) => typeof value === "string" ? value.trim() : "";
function safeHref2(value, fallback) {
  const href = text2(value);
  if (!href || /[\u0000-\u0020\\]/.test(href) || href.startsWith("//"))
    return fallback;
  if (href.startsWith("#")) return href;
  if (href.startsWith("/") && !href.split("/").includes("..")) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && !url.username && !url.password ? href : fallback;
  } catch {
    return fallback;
  }
}
var baseHref2 = (locale) => `/angelcare-marketplace/${locale}`;
var emptyNative = () => ({
  resources: [],
  editorial: [],
  copy: {}
});
function surfaceContext(surface2) {
  if (!surface2) return emptyNative();
  const copy = {};
  for (const key of [
    "eyebrow",
    "title",
    "lead",
    "primary_cta_label",
    "primary_cta_href",
    "secondary_cta_label",
    "secondary_cta_href",
    "media_url"
  ]) {
    const value = text2(surface2.copy[key]);
    if (value) copy[key] = value;
  }
  return {
    resources: [],
    copy,
    editorial: [
      ...surface2.cards.map((card, index) => ({
        id: `card-${index}`,
        title: card.title,
        body: card.body || "",
        eyebrow: card.badge || "",
        media: card.media_url || null,
        href: card.href ? safeHref2(card.href, "") || null : null,
        label: null,
        layout: "card"
      })),
      ...surface2.sections.filter((section) => section.visible && section.status === "published").map((section) => ({
        id: section.id,
        title: section.title || "",
        body: section.body || "",
        eyebrow: section.eyebrow || "",
        media: section.media_url || null,
        href: section.primary_cta_href ? safeHref2(section.primary_cta_href, "") || null : null,
        label: section.primary_cta_label || null,
        layout: section.layout_variant
      }))
    ]
  };
}
function developmentContext(locale, categories, activities, kits, surface2) {
  const native = surfaceContext(surface2), cat = new Map(
    categories.filter((c) => c.status === "published").map((c) => [c.id, c.name_fr])
  );
  native.resources = [
    ...activities.filter((a) => a.status === "published").map((a) => ({
      id: a.id,
      title: a.title_fr,
      body: a.objective_fr,
      facts: [
        cat.get(a.category_id || "") || "",
        a.age_min_months !== null && a.age_max_months !== null ? `${a.age_min_months}\u2013${a.age_max_months} ${tr3(C3.months, locale)}` : "",
        a.duration_minutes !== null ? `${a.duration_minutes} ${tr3(C3.minutes, locale)}` : "",
        ...a.materials
      ].filter(Boolean),
      href: `${baseHref2(locale)}/family/request`,
      kind: "activity",
      sourceLocale: "fr"
    })),
    ...kits.filter((k) => k.status === "published").map((k) => ({
      id: k.id,
      title: k.name_fr,
      body: k.description_fr || "",
      facts: [
        k.age_min_months !== null && k.age_max_months !== null ? `${k.age_min_months}\u2013${k.age_max_months} ${tr3(C3.months, locale)}` : ""
      ].filter(Boolean),
      href: `${baseHref2(locale)}/kits`,
      kind: "development-kit",
      sourceLocale: "fr"
    }))
  ];
  return native;
}
function academyContext(locale, programmes, surface2) {
  const native = surfaceContext(surface2);
  native.resources = programmes.filter((p) => p.status === "published").map((p) => ({
    id: p.id,
    title: p.title_fr,
    body: p.description_fr || "",
    facts: p.target_audience,
    href: `${baseHref2(locale)}/academy/request`,
    kind: "programme",
    sourceLocale: "fr"
  }));
  return native;
}
function partnerContext(locale, plans) {
  return {
    ...emptyNative(),
    resources: plans.filter((p) => p.status === "published").map((p) => ({
      id: p.id,
      title: p.name_fr,
      body: p.description_fr || "",
      facts: [],
      href: `${baseHref2(locale)}/partner-os/contact`,
      kind: "plan",
      sourceLocale: "fr",
      amount: p.base_price,
      currency: p.currency_label,
      period: p.billing_period,
      modules: p.module_count
    }))
  };
}

// storefronts-ten-r1/pagination-runtime.mjs
async function completeStorefront(experience2, readPage) {
  if (experience2.items.length < 120) return experience2;
  const items = [...experience2.items], seen = new Set(items.map((item) => item.id));
  let offset = experience2.items.length;
  for (; ; ) {
    const page = await readPage({
      locale: experience2.locale,
      territoryCode: experience2.territoryCode,
      category: experience2.key,
      limit: 240,
      offset
    });
    if (!page.items.length) {
      if (page.total > offset)
        throw Error("Incomplete storefront catalogue page");
      break;
    }
    let added = 0;
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
      added++;
    }
    if (!added) throw Error("Storefront pagination made no progress");
    offset += page.items.length;
    if (offset >= page.total || page.items.length < 240) break;
  }
  const facets = {
    kind: [],
    availability: [],
    category: []
  };
  for (const [facet, key] of [
    ["kind", "kind"],
    ["availability", "availability_status"],
    ["category", "category_key"]
  ]) {
    const counts = /* @__PURE__ */ new Map();
    for (const item of items) {
      const value = item[key];
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
    facets[facet] = [...counts].map(([value, count]) => ({ value, count }));
  }
  return {
    ...experience2,
    items,
    featured: items.filter((item) => item.featured).slice(0, 8),
    facets
  };
}

// storefronts-ten-r1/runtime-tests.mjs
var results = [];
function test(name, fn) {
  fn();
  results.push(name);
  console.log("PASS " + name);
}
var seed = { id: "one", slug: "offer/with space", kind: "product", name: "Alpha Montessori", short_description: null, description: null, price_amount: 90, price_mode: "fixed", currency_label: "Dh", featured: false, availability_status: "available", media_url: null, category_key: "kits", category_title: "Kits", trust_labels: [], metadata: { experience_schema_key: "known", experience_configuration: { age_min: 3, age_max: 6, components: ["Cards", { label: "Guide" }, { secret: "NO" }], internal_cost: 99 } } };
var second = { ...seed, id: "two", slug: "two", name: "Beta", price_amount: null, price_mode: "quote_only", availability_status: "out_of_stock", metadata: { experience_schema_key: "future-schema", experience_configuration: {} } };
var third = { ...seed, id: "three", slug: "three", name: "Gamma", price_amount: 20, metadata: { experience_configuration: { age_min_months: 12, age_max_months: 36 } } };
var frozen = Object.freeze([Object.freeze(seed), Object.freeze(second), Object.freeze(third)]);
var experience = { key: "kits", locale: "fr", territoryCode: "MA-MASTER", items: frozen };
test("TEN_DISTINCT_STORE_FRONTS", () => assert.equal(Object.keys(PROFILES).length, 10));
test("EXCLUDES_FINISHED_WORLDS", () => {
  assert.equal(isImmersiveKey("families"), false);
  assert.equal(isImmersiveKey("home-services"), false);
  assert.equal(isImmersiveKey("toString"), false);
});
test("TEN_SIGNATURES", () => assert.equal(new Set(Object.values(PROFILES).map((p) => tr(p.signature, "en"))).size, 10));
for (const [key, p] of Object.entries(PROFILES)) {
  test(key.toUpperCase().replaceAll("-", "_") + "_CONTENT_CONTRACT", () => {
    assert.equal(p.topics.length, 4);
    assert.equal(p.chapters.length, 3);
    assert.equal(p.steps.length, 4);
    assert.equal(p.related.length, 3);
    for (const locale of ["fr", "en", "ar"]) for (const words of [p.title, p.lead, p.signature, ...p.topics.flatMap((t) => [t.label, t.body]), ...p.chapters.flatMap((c) => [c.title, c.body]), ...p.steps]) assert.ok(tr(words, locale).trim());
  });
}
test("CANONICAL_IDENTITY_PRESERVED", () => assert.equal(canonicalItems(experience)[0], seed));
test("CANONICAL_ORDER_PRESERVED", () => assert.deepEqual(canonicalItems(experience).map((i) => i.id), ["one", "two", "three"]));
test("CANONICAL_DEDUPLICATION", () => assert.equal(canonicalItems({ ...experience, items: [seed, seed, second] }).length, 2));
test("COLLECTIONS_CANNOT_INJECT_OR_REPLACE", () => {
  const result = canonicalSubset(frozen, [{ ...seed, name: "Overridden" }, { ...seed, id: "foreign" }, seed]);
  assert.equal(result.length, 1);
  assert.equal(result[0], seed);
});
test("EMPTY_FILTER_PRESERVES_EVERY_ITEM", () => assert.deepEqual(filterItems(frozen, INITIAL_FILTERS), frozen));
test("UNAVAILABLE_STAYS_VISIBLE", () => assert.ok(filterItems(frozen, INITIAL_FILTERS).includes(second)));
test("FUTURE_SCHEMA_STAYS_VISIBLE", () => assert.ok(filterItems(frozen, INITIAL_FILTERS).includes(second)));
test("SORT_NEVER_MUTATES_SOURCE", () => {
  assert.deepEqual(filterItems(frozen, { ...INITIAL_FILTERS, sort: "price_asc" }).map((i) => i.id), ["three", "one", "two"]);
  assert.deepEqual(frozen.map((i) => i.id), ["one", "two", "three"]);
});
test("DESCENDING_UNKNOWN_PRICE_LAST", () => assert.deepEqual(filterItems(frozen, { ...INITIAL_FILTERS, sort: "price_desc" }).map((i) => i.id), ["one", "three", "two"]));
test("QUERY_MATCHES_PUBLIC_CONTENTS", () => assert.equal(filterItems(frozen, { ...INITIAL_FILTERS, query: "guide" }).length, 1));
test("QUERY_CANNOT_USE_INTERNAL_COST", () => assert.equal(filterItems(frozen, { ...INITIAL_FILTERS, query: "99" }).length, 0));
test("KIND_FILTER_EXPLICIT", () => assert.equal(filterItems(frozen, { ...INITIAL_FILTERS, kind: "service" }).length, 0));
test("SCHEMA_FILTER_EXPLICIT", () => assert.equal(filterItems(frozen, { ...INITIAL_FILTERS, schema: "future-schema" })[0], second));
test("AGE_FILTER_EXCLUDES_UNSPECIFIED", () => assert.deepEqual(filterItems(frozen, { ...INITIAL_FILTERS, age: "3" }).map((i) => i.id), ["one", "three"]));
test("NO_MATCH_STAYS_EMPTY", () => assert.equal(filterItems(frozen, { ...INITIAL_FILTERS, query: "missing" }).length, 0));
test("EMPTY_INPUT_STABLE", () => assert.deepEqual(filterItems([], INITIAL_FILTERS), []));
test("AGE_MONTHS_CONVERTED_EXPLICITLY", () => assert.deepEqual(ageRange(third), { min: 1, max: 3 }));
test("AGE_NOT_INFERRED_FROM_NAME", () => assert.equal(ageRange({ ...second, name: "3 to 6 years" }), null));
test("INVERTED_AGE_UNKNOWN", () => assert.equal(ageRange({ ...seed, metadata: { experience_configuration: { age_min: 9, age_max: 3 } } }), null));
test("CONTENTS_ONLY_PUBLIC_LABELS", () => assert.deepEqual(publicContents(seed), ["Cards", "Guide"]));
test("ZERO_PRICE_IS_ZERO", () => assert.match(priceLabel({ ...seed, price_amount: 0 }, "en"), /^0 /));
test("QUOTE_NEVER_ZERO", () => assert.notEqual(priceLabel(second, "en"), "0 Dh"));
test("NULL_PRICE_NEVER_ZERO", () => assert.notEqual(priceLabel({ ...seed, price_amount: null }, "en"), "0 Dh"));
test("NAN_PRICE_UNKNOWN", () => assert.equal(priceLabel({ ...seed, price_amount: NaN }, "en"), priceLabel({ ...seed, price_amount: null }, "en")));
test("NEGATIVE_PRICE_UNKNOWN", () => assert.equal(priceLabel({ ...seed, price_amount: -1 }, "en"), priceLabel({ ...seed, price_amount: null }, "en")));
for (const locale of ["fr", "en", "ar"]) test("LOCALE_" + locale.toUpperCase() + "_JOURNEY_AND_PRICE", () => {
  assert.equal(itemHref(seed, locale), "/angelcare-marketplace/" + locale + "/marketplace/item/offer%2Fwith%20space");
  assert.ok(priceLabel(seed, locale).includes("Dh"));
});
test("SEARCH_PRESERVES_CATEGORY_AND_TERRITORY", () => assert.equal(searchHref(experience), "/angelcare-marketplace/fr/marketplace/search?category=kits&territory=MA-MASTER"));
test("NULL_MEDIA_NO_INVENTED_IMAGE", () => assert.equal(offerMedia(null), null));
test("NATIVE_MEDIA_REMOVES_CROPPED_VARIANT", () => assert.equal(offerMedia("/api/angelcare-marketplace/media/id/photo?variant=card&token=abc"), "/api/angelcare-marketplace/media/id/photo?token=abc"));
test("UNSAFE_MEDIA_REJECTED", () => {
  for (const src of ["javascript:x", "//evil/image", "data:image/png,x"]) assert.equal(offerMedia(src), null);
});
test("SAFE_LINKS_REJECT_SCRIPT_AND_CREDENTIALS", () => {
  for (const src of ["javascript:alert(1)", "//evil", "https://user:pass@example.com/", "/../secret"]) assert.equal(safeHref(src, "/fallback"), "/fallback");
});
test("SAFE_SELECTION_INTERSECTS_CANONICAL", () => assert.deepEqual(safeIds('["one","foreign","one"]', /* @__PURE__ */ new Set(["one"])), ["one"]));
test("CORRUPT_STORAGE_IS_EMPTY", () => assert.deepEqual(safeIds("{", /* @__PURE__ */ new Set(["one"])), []));
test("UNAVAILABLE_STATUS_RECOGNIZED", () => assert.equal(unavailable(second), true));
var surface = { copy: { title: "Published title", internal_secret: "NO" }, cards: [{ title: "Public card" }], sections: [{ id: "yes", title: "Published section", visible: true, status: "published" }, { id: "hidden", visible: false, status: "published" }, { id: "draft", visible: true, status: "draft" }] };
test("NATIVE_COPY_INTERNAL_FIELDS_NOT_SERIALIZED", () => assert.equal(JSON.stringify(surfaceContext(surface)).includes("internal_secret"), false));
test("NATIVE_SECTION_PUBLICATION_AND_VISIBILITY", () => assert.deepEqual(surfaceContext(surface).editorial.map((x) => x.id), ["card-0", "yes"]));
test("EMPTY_NATIVE_SURFACE_STABLE", () => assert.deepEqual(surfaceContext(null), { resources: [], editorial: [], copy: {} }));
var programme = { id: "programme", title_fr: "Public", description_fr: null, target_audience: ["Professionnels"], status: "published", owner_id: "PRIVATE", competency_framework: { private: "NO" } };
test("ACADEMY_ONLY_PUBLISHED_PUBLIC_PROJECTION", () => {
  const out = academyContext("fr", [programme, { ...programme, id: "draft", status: "draft" }]);
  assert.equal(out.resources.length, 1);
  assert.equal(JSON.stringify(out).includes("PRIVATE"), false);
  assert.equal(JSON.stringify(out).includes("competency_framework"), false);
});
var plan = { id: "plan", name_fr: "Plan", description_fr: null, status: "published", base_price: 150, currency_label: "Dh", billing_period: "monthly", module_count: 4, updated_at: "internal" };
test("PARTNER_PRICE_AND_BILLING_PERIOD_UNALTERED", () => {
  const resource = partnerContext("fr", [plan]).resources[0];
  assert.equal(resource.amount, 150);
  assert.equal(resource.period, "monthly");
});
test("PARTNER_EXCLUDES_DRAFT", () => assert.equal(partnerContext("fr", [{ ...plan, status: "draft" }]).resources.length, 0));
test("DEVELOPMENT_ONLY_PUBLISHED_ACTIVITY", () => {
  const out = developmentContext("fr", [], [{ id: "yes", title_fr: "Public", objective_fr: "Objective", status: "published", age_min_months: null, age_max_months: null, duration_minutes: null, materials: [], category_id: null }, { id: "no", status: "draft" }], []);
  assert.equal(out.resources.length, 1);
});
test("DEVELOPMENT_ONLY_PUBLISHED_KITS", () => assert.equal(developmentContext("fr", [], [], [{ id: "draft", status: "draft" }]).resources.length, 0));
var pageItems = Array.from({ length: 605 }, (_, i) => ({ ...seed, id: "page-" + i, slug: "page-" + i, featured: i === 600 }));
var large = { ...experience, items: pageItems.slice(0, 120), featured: [], facets: {} };
var calls = [];
var complete = await completeStorefront(large, async (input) => {
  calls.push(input);
  return { items: pageItems.slice(input.offset, input.offset + input.limit), total: pageItems.length };
});
test("MORE_THAN_120_AND_240_ALL_605_COMPLETE", () => assert.equal(complete.items.length, 605));
test("PAGINATION_OFFSET_AND_BATCHES", () => assert.deepEqual(calls.map((c) => [c.offset, c.limit]), [[120, 240], [360, 240], [600, 240]]));
test("PAGINATION_KEEPS_TERRITORY_AND_CATEGORY", () => {
  for (const call of calls) {
    assert.equal(call.territoryCode, "MA-MASTER");
    assert.equal(call.category, "kits");
    assert.equal(call.locale, "fr");
  }
});
test("PAGINATION_PRESERVES_SOURCE_AND_ORDER", () => {
  assert.equal(large.items.length, 120);
  assert.equal(complete.items[0], pageItems[0]);
  assert.deepEqual(complete.items.map((i) => i.id), pageItems.map((i) => i.id));
});
test("FEATURED_AFTER_FIRST_PAGE_RECOGNIZED", () => assert.equal(complete.featured[0].id, "page-600"));
test("FACETS_COVER_COMPLETE_CATALOGUE", () => assert.equal(complete.facets.kind[0].count, 605));
var short = await completeStorefront({ ...experience, items: [seed] }, () => {
  throw Error("Unexpected fetch");
});
test("SHORT_PAGE_NO_EXTRA_READ", () => assert.equal(short.items[0], seed));
var readFailure = false;
try {
  await completeStorefront(large, async () => {
    throw Error("Injected read error");
  });
} catch {
  readFailure = true;
}
test("PAGINATION_READ_ERROR_STOPS", () => assert.equal(readFailure, true));
var repeated = false;
try {
  await completeStorefront(large, async () => ({ items: large.items, total: 600 }));
} catch {
  repeated = true;
}
test("PAGINATION_NO_PROGRESS_STOPS", () => assert.equal(repeated, true));
var app = process.argv[2];
if (app) {
  const root = path.resolve(app), read = (p) => fs.readFileSync(path.join(root, p), "utf8"), storefront = read("angelcare-marketplace/catalog-discovery/components/Storefront.tsx");
  test("PUBLISHED_STUDIO_FIRST", () => assert.ok(storefront.indexOf("world.status==='READY'") < storefront.indexOf("if(immersiveStorefrontKeys.includes")));
  test("EXISTING_FAMILIES_AND_HOME_SERVICES_BEFORE_NEW_WORLDS", () => {
    assert.ok(storefront.indexOf("experience.key==='families'") < storefront.indexOf("if(immersiveStorefrontKeys.includes"));
    assert.ok(storefront.indexOf("experience.key==='home-services'") < storefront.indexOf("if(immersiveStorefrontKeys.includes"));
  });
  test("ALL_TEN_ROUTE_FILES_EXIST", () => {
    for (const key of Object.keys(PROFILES)) assert.ok(fs.existsSync(path.join(root, "app/angelcare-marketplace/[locale]/" + key + "/page.tsx")));
  });
  test("ALL_PRIMARY_AND_RELATED_ROUTES_EXIST", () => {
    for (const profile of Object.values(PROFILES)) for (const route of [profile.primary, ...profile.related]) assert.ok(fs.existsSync(path.join(root, "app/angelcare-marketplace/[locale]/" + route + "/page.tsx")), route);
  });
  test("ALL_EDITORIAL_ASSETS_EXIST", () => {
    for (const p of Object.values(PROFILES)) for (const key of [p.photo, p.secondaryPhoto, ...p.topics.map((t) => t.photo), ...p.chapters.map((c) => c.photo)]) assert.ok(fs.existsSync(path.join(root, "public", photo(key))), key);
  });
  const css = read("angelcare-marketplace/storefront-immersive/storefront.module.css");
  test("OFFER_IMAGE_CONTAIN_RULE_EXISTS", () => assert.match(css, /object-fit:\s*contain/));
  test("REDUCED_MOTION_CSS_EXISTS", () => assert.match(css, /prefers-reduced-motion:\s*reduce/));
}
console.log("STOREFRONTS_RUNTIME=" + results.length + "/" + results.length + " PASS");
