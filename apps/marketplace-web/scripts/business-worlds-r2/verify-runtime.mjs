// business-worlds-r2/runtime-tests.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// business-worlds-r2/content-runtime.mjs
var w = (fr, en, ar) => ({
  fr,
  en,
  ar
});
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
var BUSINESS_KEYS = [
  "corporates",
  "establishments",
  "health-partners",
  "hospitality",
  "partner-os",
  "professionals",
  "quality-check"
];
var WORLDS = {
  corporates: {
    label: w("Entreprises", "Corporates", "\u0627\u0644\u0634\u0631\u0643\u0627\u062A"),
    eyebrow: w(
      "LA FAMILLE ENTRE DANS VOTRE EXP\xC9RIENCE COLLABORATEUR",
      "FAMILY BELONGS IN YOUR EMPLOYEE EXPERIENCE",
      "\u0627\u0644\u0623\u0633\u0631\u0629 \u062C\u0632\u0621 \u0645\u0646 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0645\u0648\u0638\u0641"
    ),
    title: w(
      "Derri\xE8re chaque talent, toute une vie.",
      "Behind every talent, an entire life.",
      "\u0648\u0631\u0627\u0621 \u0643\u0644 \u0645\u0648\u0647\u0628\u0629\u060C \u062D\u064A\u0627\u0629 \u0643\u0627\u0645\u0644\u0629."
    ),
    lead: w(
      "Construisez un soutien aux familles qui prend sa place dans la vie r\xE9elle : au quotidien, dans les transitions et dans les moments impr\xE9vus.",
      "Build family support that fits real life: everyday needs, transitions and unexpected moments.",
      "\u0627\u0628\u0646\u0648\u0627 \u062F\u0639\u0645\u0627\u064B \u0644\u0644\u0623\u0633\u0631 \u064A\u0646\u0627\u0633\u0628 \u0627\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0648\u0627\u0644\u062A\u062D\u0648\u0644\u0627\u062A \u0648\u0627\u0644\u0638\u0631\u0648\u0641 \u063A\u064A\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629."
    ),
    action: w(
      "Concevoir mon programme employeur",
      "Design my employer programme",
      "\u062A\u0635\u0645\u064A\u0645 \u0628\u0631\u0646\u0627\u0645\u062C \u0645\u0624\u0633\u0633\u062A\u0646\u0627"
    ),
    photo: "corporate",
    request: "corporates/request",
    audience: "corporate",
    vertical: "corporate",
    priorities: [
      w("Soutien au quotidien", "Everyday support", "\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u064A\u0648\u0645\u064A"),
      w("Situations impr\xE9vues", "Unexpected situations", "\u0627\u0644\u0638\u0631\u0648\u0641 \u063A\u064A\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629"),
      w("Transitions parentales", "Parenthood transitions", "\u062A\u062D\u0648\u0644\u0627\u062A \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0629"),
      w("Moments familles", "Family moments", "\u0644\u062D\u0638\u0627\u062A \u0623\u0633\u0631\u064A\u0629")
    ],
    dossiers: [
      {
        title: w("Family Benefits", "Family Benefits", "\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0623\u0633\u0631\u0629"),
        body: w(
          "Organiser un acc\xE8s aux services selon votre population et votre programme.",
          "Organise service access around your people and programme.",
          "\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u0641\u0626\u0627\u062A \u0648\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u0624\u0633\u0633\u0629."
        ),
        detail: w(
          "\xC0 d\xE9finir ensemble : \xE9ligibilit\xE9, allocation, contribution et parcours d\u2019utilisation.",
          "Define eligibility, allocations, contributions and the use journey together.",
          "\u0646\u062D\u062F\u062F \u0645\u0639\u0627\u064B \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u062E\u0635\u0635\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0627\u062A \u0648\u0645\u0633\u0627\u0631 \u0627\u0644\u0627\u0633\u062A\u0641\u0627\u062F\u0629."
        ),
        photo: "family",
        href: "corporates/family-benefits"
      },
      {
        title: w(
          "Emergency Support",
          "Emergency Support",
          "\u0627\u0644\u062F\u0639\u0645 \u0641\u064A \u0627\u0644\u0638\u0631\u0648\u0641 \u0627\u0644\u0637\u0627\u0631\u0626\u0629"
        ),
        body: w(
          "Pr\xE9parer une r\xE9ponse lorsque l\u2019organisation familiale est perturb\xE9e.",
          "Prepare a response when family arrangements are disrupted.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0639\u0646\u062F \u062A\u0639\u0637\u0644 \u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0623\u0633\u0631\u064A."
        ),
        detail: w(
          "Le p\xE9rim\xE8tre, les conditions d\u2019acc\xE8s et la disponibilit\xE9 se d\xE9finissent dans le programme.",
          "Scope, access conditions and availability are defined within the programme.",
          "\u064A\u064F\u062D\u062F\u062F \u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0634\u0631\u0648\u0637 \u0627\u0644\u0648\u0635\u0648\u0644 \u0648\u0627\u0644\u062A\u0648\u0641\u0631 \u0636\u0645\u0646 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        photo: "urgent",
        href: "corporates/emergency-support"
      },
      {
        title: w("Family Days", "Family Days", "\u0623\u064A\u0627\u0645 \u0627\u0644\u0623\u0633\u0631\u0629"),
        body: w(
          "Donner une place aux enfants et aux familles dans la culture de votre entreprise.",
          "Make room for children and families in your company culture.",
          "\u0645\u0646\u062D \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0627\u0644\u0623\u0633\u0631 \u0645\u0643\u0627\u0646\u0627\u064B \u0641\u064A \u062B\u0642\u0627\u0641\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u0629."
        ),
        detail: w(
          "Objectifs, \xE2ges, activit\xE9s, lieu et coordination composent votre projet.",
          "Objectives, ages, activities, venue and coordination shape your project.",
          "\u062A\u064F\u0628\u0646\u0649 \u0627\u0644\u0645\u0628\u0627\u062F\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0631 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u0643\u0627\u0646 \u0648\u0627\u0644\u062A\u0646\u0633\u064A\u0642."
        ),
        photo: "holidays",
        href: "corporates/family-days"
      }
    ]
  },
  establishments: {
    label: w("\xC9tablissements", "Establishments", "\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629"),
    eyebrow: w(
      "UN \xC9TABLISSEMENT. PLUSIEURS LEVIERS. UNE DIRECTION.",
      "ONE ESTABLISHMENT. MANY LEVERS. ONE DIRECTION.",
      "\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u062D\u062F\u0629\u060C \u0645\u062D\u0627\u0648\u0631 \u0645\u062A\u0639\u062F\u062F\u0629\u060C \u0627\u062A\u062C\u0627\u0647 \u0648\u0627\u0636\u062D"
    ),
    title: w(
      "Faites grandir tout votre \xE9tablissement.",
      "Help your entire establishment grow.",
      "\u0637\u0648\u0651\u0631\u0648\u0627 \u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0628\u0643\u0644 \u0623\u0628\u0639\u0627\u062F\u0647\u0627."
    ),
    lead: w(
      "Reliez les pratiques p\xE9dagogiques, les comp\xE9tences des \xE9quipes, la confiance des parents et votre organisation. Commencez par comprendre o\xF9 agir.",
      "Connect educational practice, team competencies, parent trust and organisation. Start by understanding where to act.",
      "\u0627\u0631\u0628\u0637\u0648\u0627 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0648\u0643\u0641\u0627\u0621\u0627\u062A \u0627\u0644\u0641\u0631\u0642 \u0648\u062B\u0642\u0629 \u0627\u0644\u0622\u0628\u0627\u0621 \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645\u060C \u0648\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A."
    ),
    action: w(
      "Pr\xE9parer mon diagnostic",
      "Prepare my assessment",
      "\u0625\u0639\u062F\u0627\u062F \u0637\u0644\u0628 \u0627\u0644\u062A\u0642\u064A\u064A\u0645"
    ),
    photo: "school",
    request: "establishments/diagnostic",
    audience: "school",
    vertical: "establishment",
    priorities: [
      w("P\xE9dagogie & espaces", "Learning & spaces", "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u0641\u0636\u0627\u0621\u0627\u062A"),
      w("\xC9quipe & comp\xE9tences", "Team & competencies", "\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A"),
      w("Confiance des parents", "Parent trust", "\u062B\u0642\u0629 \u0627\u0644\u0622\u0628\u0627\u0621"),
      w("Organisation & qualit\xE9", "Organisation & quality", "\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0648\u0627\u0644\u062C\u0648\u062F\u0629")
    ],
    dossiers: [
      {
        title: w(
          "Comprendre votre point de d\xE9part",
          "Understand your starting point",
          "\u0641\u0647\u0645 \u0646\u0642\u0637\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642"
        ),
        body: w(
          "Le diagnostic rassemble votre contexte et vos priorit\xE9s avant de d\xE9finir une intervention.",
          "An assessment brings together your context and priorities before defining an intervention.",
          "\u064A\u062C\u0645\u0639 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0642\u0628\u0644 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u062A\u062F\u062E\u0644."
        ),
        detail: w(
          "Type d\u2019\xE9tablissement, publics, espaces, pratiques et organisation servent \xE0 pr\xE9parer l\u2019\xE9change.",
          "Establishment type, audiences, spaces, practices and organisation prepare the discussion.",
          "\u064A\u0633\u0627\u0639\u062F \u0646\u0648\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u0644\u0641\u0626\u0627\u062A \u0648\u0627\u0644\u0641\u0636\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0641\u064A \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0644\u0642\u0627\u0621."
        ),
        photo: "preschool",
        href: "establishments/diagnostic"
      },
      {
        title: w(
          "Faire progresser les comp\xE9tences",
          "Develop competencies",
          "\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A"
        ),
        body: w(
          "Academy relie besoins d\u2019apprentissage et parcours de formation publi\xE9s.",
          "Academy connects learning needs with published training pathways.",
          "\u062A\u0631\u0628\u0637 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u0628\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0643\u0648\u064A\u0646 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629."
        ),
        detail: w(
          "Les modalit\xE9s, pr\xE9requis et \xE9valuations sont pr\xE9cis\xE9s dans le programme concern\xE9.",
          "Delivery, prerequisites and assessments are specified in each programme.",
          "\u062A\u064F\u0648\u0636\u062D \u0627\u0644\u0635\u064A\u063A \u0648\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0641\u064A \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u0639\u0646\u064A."
        ),
        photo: "academy",
        href: "establishments/academy"
      },
      {
        title: w(
          "Structurer votre progression",
          "Structure your progress",
          "\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u062A\u0642\u062F\u0645"
        ),
        body: w(
          "Quality Check et Partner OS abordent l\u2019\xE9valuation et l\u2019organisation selon votre p\xE9rim\xE8tre.",
          "Quality Check and Partner OS address evaluation and organisation within your scope.",
          "\u064A\u0639\u0627\u0644\u062C \u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u062D\u0633\u0628 \u0646\u0637\u0627\u0642\u0643\u0645."
        ),
        detail: w(
          "Chaque composante poss\xE8de ses propres conditions, livrables et parcours.",
          "Each component has its own terms, deliverables and journey.",
          "\u0644\u0643\u0644 \u0645\u062D\u0648\u0631 \u0634\u0631\u0648\u0637\u0647 \u0648\u0645\u062E\u0631\u062C\u0627\u062A\u0647 \u0648\u0645\u0633\u0627\u0631\u0647."
        ),
        photo: "desk",
        href: "quality-check"
      }
    ]
  },
  "health-partners": {
    label: w("Partenaires sant\xE9", "Health Partners", "\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0635\u062D\u0629"),
    eyebrow: w(
      "\xC0 VOS C\xD4T\xC9S. AUTOUR DES FAMILLES.",
      "ALONGSIDE YOU. AROUND FAMILIES.",
      "\u0625\u0644\u0649 \u062C\u0627\u0646\u0628\u0643\u0645\u060C \u0644\u062F\u0639\u0645 \u0627\u0644\u0623\u0633\u0631"
    ),
    title: w(
      "Un accompagnement qui continue autour de la famille.",
      "Support that continues around the family.",
      "\u062F\u0639\u0645 \u064A\u0631\u0627\u0641\u0642 \u0627\u0644\u0623\u0633\u0631\u0629 \u0641\u064A \u0645\u062E\u062A\u0644\u0641 \u0645\u0631\u0627\u062D\u0644\u0647\u0627."
    ),
    lead: w(
      "Maternit\xE9, retour \xE0 domicile, soutien parental et ateliers : construisez un parcours familial chaleureux, coordonn\xE9 et strictement non m\xE9dical.",
      "Maternity, returning home, parent support and workshops: build a warm, coordinated and strictly non-medical family pathway.",
      "\u0627\u0644\u0623\u0645\u0648\u0645\u0629 \u0648\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0632\u0644 \u0648\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646 \u0648\u0627\u0644\u0648\u0631\u0634\u0627\u062A: \u0645\u0633\u0627\u0631 \u0623\u0633\u0631\u064A \u0625\u0646\u0633\u0627\u0646\u064A \u0648\u0645\u0646\u0638\u0645 \u0648\u063A\u064A\u0631 \u0637\u0628\u064A."
    ),
    action: w(
      "\xC9tudier notre partenariat",
      "Explore our partnership",
      "\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0634\u0631\u0627\u0643\u0629"
    ),
    photo: "health",
    request: "health-partners/request",
    audience: "clinic",
    vertical: "health_partner",
    priorities: [
      w("Autour de la maternit\xE9", "Around maternity", "\u062D\u0648\u0644 \u0627\u0644\u0623\u0645\u0648\u0645\u0629"),
      w("Retour \xE0 domicile", "Returning home", "\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0632\u0644"),
      w("Soutien parental", "Parent support", "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646"),
      w("Ateliers familles", "Family workshops", "\u0648\u0631\u0634\u0627\u062A \u0627\u0644\u0623\u0633\u0631")
    ],
    dossiers: [
      {
        title: w(
          "Maternit\xE9 & pr\xE9paration",
          "Maternity & preparation",
          "\u0627\u0644\u0623\u0645\u0648\u0645\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F"
        ),
        body: w(
          "Donner aux familles des rep\xE8res pour organiser le soutien au quotidien.",
          "Give families orientation for organising everyday support.",
          "\u062A\u0642\u062F\u064A\u0645 \u0625\u0631\u0634\u0627\u062F\u0627\u062A \u0644\u0644\u0623\u0633\u0631 \u0644\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u064A\u0648\u0645\u064A."
        ),
        detail: w(
          "Le partenaire et ANGELCARE d\xE9finissent les r\xF4les, le p\xE9rim\xE8tre et la coordination.",
          "The partner and ANGELCARE define roles, scope and coordination.",
          "\u064A\u062D\u062F\u062F \u0627\u0644\u0634\u0631\u064A\u0643 \u0648\u0623\u0646\u062C\u0644 \u0643\u064A\u0631 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u062A\u0646\u0633\u064A\u0642."
        ),
        photo: "newborn",
        href: "health-partners/maternity"
      },
      {
        title: w("Mother & Baby Care", "Mother & Baby Care", "\u062F\u0639\u0645 \u0627\u0644\u0623\u0645 \u0648\u0627\u0644\u0637\u0641\u0644"),
        body: w(
          "Explorer un soutien non m\xE9dical adapt\xE9 au contexte familial.",
          "Explore non-medical support adapted to the family context.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u062F\u0639\u0645 \u063A\u064A\u0631 \u0637\u0628\u064A \u064A\u0646\u0627\u0633\u0628 \u0627\u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u0623\u0633\u0631\u064A."
        ),
        detail: w(
          "Les activit\xE9s autoris\xE9es, limites et modalit\xE9s de relais sont explicites.",
          "Allowed activities, boundaries and handover arrangements are explicit.",
          "\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627 \u0648\u0627\u0644\u062D\u062F\u0648\u062F \u0648\u0635\u064A\u063A \u0627\u0644\u0625\u062D\u0627\u0644\u0629 \u0648\u0627\u0636\u062D\u0629."
        ),
        photo: "care",
        href: "health-partners/mother-baby-care"
      },
      {
        title: w(
          "Ateliers & rep\xE8res",
          "Workshops & orientation",
          "\u0648\u0631\u0634\u0627\u062A \u0648\u0625\u0631\u0634\u0627\u062F\u0627\u062A"
        ),
        body: w(
          "Cr\xE9er des temps d\u2019\xE9change et de d\xE9couverte pour les parents.",
          "Create opportunities for parents to learn and share.",
          "\u0625\u062A\u0627\u062D\u0629 \u0641\u0631\u0635 \u0644\u0644\u062A\u0639\u0644\u0645 \u0648\u0627\u0644\u062A\u0628\u0627\u062F\u0644 \u0628\u064A\u0646 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646."
        ),
        detail: w(
          "Les contenus et intervenants sont pr\xE9cis\xE9s pour chaque atelier publi\xE9.",
          "Content and facilitators are specified for each published workshop.",
          "\u062A\u064F\u0648\u0636\u062D \u0627\u0644\u0645\u0636\u0627\u0645\u064A\u0646 \u0648\u0627\u0644\u0645\u062A\u062F\u062E\u0644\u0648\u0646 \u0644\u0643\u0644 \u0648\u0631\u0634\u0629 \u0645\u0646\u0634\u0648\u0631\u0629."
        ),
        photo: "support",
        href: "health-partners/workshops"
      }
    ]
  },
  hospitality: {
    label: w("Hospitality", "Hospitality", "\u0627\u0644\u0636\u064A\u0627\u0641\u0629"),
    eyebrow: w(
      "LE S\xC9JOUR FAMILLE DEVIENT VOTRE SIGNATURE",
      "THE FAMILY STAY BECOMES YOUR SIGNATURE",
      "\u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0623\u0633\u0631\u064A\u0629 \u062A\u0635\u0628\u062D \u0628\u0635\u0645\u062A\u0643\u0645"
    ),
    title: w(
      "Des enfants \xE9merveill\xE9s. Des parents qui savourent.",
      "Wonder for children. Time for parents.",
      "\u062F\u0647\u0634\u0629 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0648\u0642\u062A \u064A\u0633\u062A\u0645\u062A\u0639 \u0628\u0647 \u0627\u0644\u0648\u0627\u0644\u062F\u0627\u0646."
    ),
    lead: w(
      "Imaginez l\u2019exp\xE9rience famille dans votre propri\xE9t\xE9 : d\xE9couverte, activit\xE9s, garde des enfants des clients et conciergerie. Chaque moment trouve sa place.",
      "Imagine the family experience at your property: discovery, activities, guest childcare and concierge. Every moment finds its place.",
      "\u062A\u0635\u0648\u0631\u0648\u0627 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0623\u0633\u0631 \u0641\u064A \u0645\u0646\u0634\u0623\u062A\u0643\u0645: \u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641 \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C\u060C \u0644\u0643\u0644 \u0644\u062D\u0638\u0629 \u0645\u0643\u0627\u0646\u0647\u0627."
    ),
    action: w(
      "Imaginer notre programme Hospitality",
      "Imagine our Hospitality programme",
      "\u062A\u0635\u0645\u064A\u0645 \u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0636\u064A\u0627\u0641\u0629"
    ),
    photo: "hospitality",
    request: "hospitality/request",
    audience: "hotel",
    vertical: "hospitality",
    priorities: [
      w("Kids Club", "Kids Club", "\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644"),
      w("Guest Childcare", "Guest Childcare", "\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641"),
      w("Family Concierge", "Family Concierge", "\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0623\u0633\u0631\u0629"),
      w("Programmes saisonniers", "Seasonal programmes", "\u0628\u0631\u0627\u0645\u062C \u0645\u0648\u0633\u0645\u064A\u0629")
    ],
    dossiers: [
      {
        title: w("Kids Club", "Kids Club", "\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644"),
        body: w(
          "Un univers d\u2019activit\xE9s pens\xE9 autour des \xE2ges, des espaces et de votre identit\xE9.",
          "An activity universe shaped around ages, spaces and your identity.",
          "\u0639\u0627\u0644\u0645 \u0645\u0646 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0645\u0628\u0646\u064A \u0639\u0644\u0649 \u0627\u0644\u0623\u0639\u0645\u0627\u0631 \u0648\u0627\u0644\u0641\u0636\u0627\u0621\u0627\u062A \u0648\u0647\u0648\u064A\u0629 \u0645\u0646\u0634\u0623\u062A\u0643\u0645."
        ),
        detail: w(
          "D\xE9finir ensemble : publics, capacit\xE9, rythme, encadrement, mat\xE9riel et langues.",
          "Define audiences, capacity, rhythm, supervision, equipment and languages together.",
          "\u0646\u062D\u062F\u062F \u0645\u0639\u0627\u064B \u0627\u0644\u0641\u0626\u0627\u062A \u0648\u0627\u0644\u0633\u0639\u0629 \u0648\u0627\u0644\u0625\u064A\u0642\u0627\u0639 \u0648\u0627\u0644\u062A\u0623\u0637\u064A\u0631 \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0648\u0627\u0644\u0644\u063A\u0627\u062A."
        ),
        photo: "games",
        href: "hospitality/kids-club"
      },
      {
        title: w("Guest Childcare", "Guest Childcare", "\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641"),
        body: w(
          "Organiser la garde des enfants des clients dans le p\xE9rim\xE8tre convenu.",
          "Organise guest childcare within an agreed scope.",
          "\u062A\u0646\u0638\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641 \u0641\u064A \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647."
        ),
        detail: w(
          "R\xE9servation, consentement, langues et remise de l\u2019enfant structurent l\u2019exp\xE9rience.",
          "Booking, consent, languages and child handover structure the experience.",
          "\u064A\u0646\u0638\u0645 \u0627\u0644\u062D\u062C\u0632 \u0648\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u0627\u0644\u0644\u063A\u0627\u062A \u0648\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0637\u0641\u0644 \u0627\u0644\u062A\u062C\u0631\u0628\u0629."
        ),
        photo: "care",
        href: "hospitality/guest-childcare"
      },
      {
        title: w("Family Concierge", "Family Concierge", "\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0623\u0633\u0631\u0629"),
        body: w(
          "Aider les familles \xE0 d\xE9couvrir les possibilit\xE9s de leur s\xE9jour.",
          "Help families discover the possibilities of their stay.",
          "\u0645\u0633\u0627\u0639\u062F\u0629 \u0627\u0644\u0623\u0633\u0631 \u0639\u0644\u0649 \u0627\u0643\u062A\u0634\u0627\u0641 \u0625\u0645\u0643\u0627\u0646\u0627\u062A \u0625\u0642\u0627\u0645\u062A\u0647\u0645."
        ),
        detail: w(
          "Rep\xE8res, orientation et coordination selon les services convenus.",
          "Orientation and coordination follow the agreed services.",
          "\u0625\u0631\u0634\u0627\u062F \u0648\u062A\u0646\u0633\u064A\u0642 \u062D\u0633\u0628 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627."
        ),
        photo: "family",
        href: "hospitality/family-concierge"
      },
      {
        title: w(
          "Programmes saisonniers",
          "Seasonal programmes",
          "\u0628\u0631\u0627\u0645\u062C \u0645\u0648\u0633\u0645\u064A\u0629"
        ),
        body: w(
          "Donner un rythme aux vacances et aux temps forts de votre propri\xE9t\xE9.",
          "Give holidays and key property moments their own rhythm.",
          "\u0645\u0646\u062D \u0627\u0644\u0639\u0637\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0627\u0644\u0628\u0627\u0631\u0632\u0629 \u0625\u064A\u0642\u0627\u0639\u0627\u064B \u062E\u0627\u0635\u0627\u064B."
        ),
        detail: w(
          "Contenu, calendrier, espaces et pr\xE9paration composent votre programme.",
          "Content, timing, spaces and preparation shape your programme.",
          "\u062A\u0634\u0643\u0644 \u0627\u0644\u0645\u0636\u0627\u0645\u064A\u0646 \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u0641\u0636\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        photo: "holidays",
        href: "hospitality/seasonal-programs"
      }
    ]
  },
  "partner-os": {
    label: w("Partner OS", "Partner OS", "\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621"),
    eyebrow: w(
      "VOTRE ORGANISATION, AVEC UNE DIRECTION LISIBLE",
      "YOUR ORGANISATION, WITH A CLEAR DIRECTION",
      "\u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0641\u064A \u0627\u062A\u062C\u0627\u0647 \u0648\u0627\u0636\u062D"
    ),
    title: w(
      "Donnez une structure \xE0 votre quotidien.",
      "Give your daily work a structure.",
      "\u0627\u0645\u0646\u062D\u0648\u0627 \u0639\u0645\u0644\u0643\u0645 \u0627\u0644\u064A\u0648\u0645\u064A \u062A\u0646\u0638\u064A\u0645\u0627\u064B \u0648\u0627\u0636\u062D\u0627\u064B."
    ),
    lead: w(
      "Comprenez les espaces, les r\xF4les, les modules et les \xE9tapes d\u2019activation. Explorez le fonctionnement avant de choisir un plan ou une d\xE9monstration.",
      "Understand workspaces, roles, modules and activation stages. Explore how it works before choosing a plan or demonstration.",
      "\u0627\u0641\u0647\u0645\u0648\u0627 \u0641\u0636\u0627\u0621\u0627\u062A \u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0645\u0631\u0627\u062D\u0644 \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0642\u0628\u0644 \u0627\u062E\u062A\u064A\u0627\u0631 \u062E\u0637\u0629 \u0623\u0648 \u0639\u0631\u0636 \u062A\u0648\u0636\u064A\u062D\u064A."
    ),
    action: w(
      "Pr\xE9parer ma d\xE9monstration",
      "Prepare my demonstration",
      "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A"
    ),
    photo: "desk",
    request: "partner-os/contact",
    audience: "partner_os",
    priorities: [
      w("Espace organisation", "Organisation workspace", "\u0641\u0636\u0627\u0621 \u0627\u0644\u0645\u0624\u0633\u0633\u0629"),
      w("\xC9quipe & acc\xE8s", "Team & access", "\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A"),
      w("Modules & abonnement", "Modules & subscription", "\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643"),
      w(
        "Pr\xE9paration & activation",
        "Readiness & activation",
        "\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0648\u0627\u0644\u062A\u0641\u0639\u064A\u0644"
      )
    ],
    dossiers: [
      {
        title: w(
          "Un espace par organisation",
          "An organisation workspace",
          "\u0641\u0636\u0627\u0621 \u062E\u0627\u0635 \u0628\u0627\u0644\u0645\u0624\u0633\u0633\u0629"
        ),
        body: w(
          "Identit\xE9 de l\u2019organisation, territoire, langue et \xE9tat du workspace.",
          "Organisation identity, territory, language and workspace state.",
          "\u0647\u0648\u064A\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0648\u0627\u0644\u0644\u063A\u0629 \u0648\u062D\u0627\u0644\u0629 \u0641\u0636\u0627\u0621 \u0627\u0644\u0639\u0645\u0644."
        ),
        detail: w(
          "Le contexte de l\u2019organisation d\xE9termine le p\xE9rim\xE8tre des acc\xE8s.",
          "Organisation context determines the access scope.",
          "\u064A\u062D\u062F\u062F \u0633\u064A\u0627\u0642 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0646\u0637\u0627\u0642 \u0627\u0644\u0648\u0635\u0648\u0644."
        ),
        photo: "desk"
      },
      {
        title: w(
          "Des acc\xE8s selon les r\xF4les",
          "Role-based access",
          "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u0623\u062F\u0648\u0627\u0631"
        ),
        body: w(
          "Des membres et des droits pour organiser la participation de votre \xE9quipe.",
          "Members and permissions organise team participation.",
          "\u0623\u0639\u0636\u0627\u0621 \u0648\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0644\u062A\u0646\u0638\u064A\u0645 \u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0641\u0631\u064A\u0642."
        ),
        detail: w(
          "Les droits disponibles suivent les autorit\xE9s et les r\xE8gles du portail.",
          "Available rights follow portal authorities and rules.",
          "\u062A\u062A\u0628\u0639 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0633\u0644\u0637\u0627\u062A \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u0648\u0627\u0628\u0629."
        ),
        photo: "professional"
      },
      {
        title: w(
          "Une activation pr\xE9par\xE9e",
          "Prepared activation",
          "\u062A\u0641\u0639\u064A\u0644 \u0628\u0639\u062F \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F"
        ),
        body: w(
          "Le plan, les modules et les contr\xF4les de pr\xE9paration composent l\u2019activation.",
          "Plan, modules and readiness checks shape activation.",
          "\u062A\u064F\u0628\u0646\u0649 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0639\u0644\u0649 \u0627\u0644\u062E\u0637\u0629 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0641\u062D\u0648\u0635\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F."
        ),
        detail: w(
          "Les modules et limites du plan retenu sont pr\xE9cis\xE9s pendant la qualification.",
          "Modules and limits of the selected plan are specified during qualification.",
          "\u062A\u064F\u0648\u0636\u062D \u0648\u062D\u062F\u0627\u062A \u0648\u062D\u062F\u0648\u062F \u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0623\u0647\u064A\u0644."
        ),
        photo: "academy"
      }
    ]
  },
  professionals: {
    label: w("Professionnels", "Professionals", "\u0627\u0644\u0645\u0647\u0646\u064A\u0648\u0646"),
    eyebrow: w(
      "VOTRE SAVOIR-FAIRE A UN PROCHAIN CHAPITRE",
      "YOUR EXPERTISE HAS A NEXT CHAPTER",
      "\u0644\u0643\u0641\u0627\u0621\u0627\u062A\u0643\u0645 \u0641\u0635\u0644 \u062C\u062F\u064A\u062F"
    ),
    title: w(
      "Vos comp\xE9tences. Votre direction. Votre prochain parcours.",
      "Your skills. Your direction. Your next pathway.",
      "\u0643\u0641\u0627\u0621\u0627\u062A\u0643\u0645\u060C \u0627\u062A\u062C\u0627\u0647\u0643\u0645\u060C \u0648\u0645\u0633\u0627\u0631\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645."
    ),
    lead: w(
      "D\xE9couvrez les univers professionnels ANGELCARE, identifiez vos priorit\xE9s de progression et pr\xE9parez votre entr\xE9e dans le parcours qui vous correspond.",
      "Discover ANGELCARE professional contexts, identify development priorities and prepare the pathway that fits you.",
      "\u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0627\u0644\u0645\u062C\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0644\u0623\u0646\u062C\u0644 \u0643\u064A\u0631 \u0648\u062D\u062F\u062F\u0648\u0627 \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u062A\u0637\u0648\u064A\u0631\u0643\u0645 \u0648\u0623\u0639\u062F\u0648\u0627 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0643\u0645."
    ),
    action: w(
      "Pr\xE9parer mon parcours professionnel",
      "Prepare my professional pathway",
      "\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0627\u0631\u064A \u0627\u0644\u0645\u0647\u0646\u064A"
    ),
    photo: "professional",
    request: "professionals/join",
    audience: "provider",
    priorities: [
      w("Petite enfance", "Early childhood", "\u0627\u0644\u0637\u0641\u0648\u0644\u0629 \u0627\u0644\u0645\u0628\u0643\u0631\u0629"),
      w("Accompagnement familial", "Family support", "\u062F\u0639\u0645 \u0627\u0644\u0623\u0633\u0631\u0629"),
      w(
        "Animation & activit\xE9s",
        "Activities & facilitation",
        "\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u062A\u0646\u0634\u064A\u0637"
      ),
      w("Formation & progression", "Learning & progression", "\u0627\u0644\u062A\u0643\u0648\u064A\u0646 \u0648\u0627\u0644\u062A\u0637\u0648\u0631")
    ],
    dossiers: [
      {
        title: w(
          "Pratiques \xE9ducatives",
          "Educational practice",
          "\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629"
        ),
        body: w(
          "Observation, pr\xE9paration d\u2019activit\xE9s, communication et coop\xE9ration.",
          "Observation, activity preparation, communication and cooperation.",
          "\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0648\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u062A\u0639\u0627\u0648\u0646."
        ),
        detail: w(
          "Les comp\xE9tences et exigences d\xE9pendent du r\xF4le et du parcours concern\xE9.",
          "Competencies and requirements depend on the role and pathway.",
          "\u062A\u062E\u062A\u0644\u0641 \u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u062F\u0648\u0631 \u0648\u0627\u0644\u0645\u0633\u0627\u0631."
        ),
        photo: "preschool",
        href: "academy"
      },
      {
        title: w(
          "Accompagnement des familles",
          "Supporting families",
          "\u0645\u0631\u0627\u0641\u0642\u0629 \u0627\u0644\u0623\u0633\u0631"
        ),
        body: w(
          "Comprendre le contexte, organiser les temps et travailler dans un p\xE9rim\xE8tre clair.",
          "Understand context, organise time and work within a clear scope.",
          "\u0641\u0647\u0645 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0623\u0648\u0642\u0627\u062A \u0648\u0627\u0644\u0639\u0645\u0644 \u0636\u0645\u0646 \u0646\u0637\u0627\u0642 \u0648\u0627\u0636\u062D."
        ),
        detail: w(
          "Le soutien non m\xE9dical, les transmissions et les limites font partie du cadre.",
          "Non-medical support, handovers and boundaries form part of the framework.",
          "\u064A\u0634\u0645\u0644 \u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u062F\u0639\u0645 \u063A\u064A\u0631 \u0627\u0644\u0637\u0628\u064A \u0648\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u062D\u062F\u0648\u062F."
        ),
        photo: "care",
        href: "home-services"
      },
      {
        title: w(
          "Apprendre & se pr\xE9parer",
          "Learn & prepare",
          "\u0627\u0644\u062A\u0639\u0644\u0645 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F"
        ),
        body: w(
          "Explorer les programmes publi\xE9s et clarifier votre prochain besoin d\u2019apprentissage.",
          "Explore published programmes and clarify your next learning need.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u062D\u0627\u062C\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
        ),
        detail: w(
          "Les pr\xE9requis, modalit\xE9s et \xE9valuations sont d\xE9crits sur le programme choisi.",
          "Prerequisites, delivery and assessments are described in the selected programme.",
          "\u062A\u064F\u0639\u0631\u0636 \u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0648\u0627\u0644\u0635\u064A\u063A \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0641\u064A \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u062E\u062A\u0627\u0631."
        ),
        photo: "academy",
        href: "academy"
      }
    ]
  },
  "quality-check": {
    label: w("Quality Check", "Quality Check", "\u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629"),
    eyebrow: w(
      "DE LA VISIBILIT\xC9 \xC0 LA PROGRESSION",
      "FROM VISIBILITY TO PROGRESS",
      "\u0645\u0646 \u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0648\u0627\u0636\u062D\u0629 \u0625\u0644\u0649 \u0627\u0644\u062A\u0642\u062F\u0645"
    ),
    title: w(
      "Voir plus clair. Agir avec une direction.",
      "See clearly. Act with direction.",
      "\u0631\u0624\u064A\u0629 \u0623\u0648\u0636\u062D \u0648\u0639\u0645\u0644 \u0641\u064A \u0627\u062A\u062C\u0627\u0647 \u0645\u062D\u062F\u062F."
    ),
    lead: w(
      "Comprenez le p\xE9rim\xE8tre d\u2019une \xE9valuation, les \xE9l\xE9ments \xE0 pr\xE9parer et la mani\xE8re dont les constats peuvent devenir un plan de progression.",
      "Understand an evaluation scope, what to prepare and how findings can become an improvement plan.",
      "\u0627\u0641\u0647\u0645\u0648\u0627 \u0646\u0637\u0627\u0642 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0648\u0643\u064A\u0641 \u062A\u062A\u062D\u0648\u0644 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0625\u0644\u0649 \u062E\u0637\u0629 \u062A\u062D\u0633\u064A\u0646."
    ),
    action: w(
      "Pr\xE9parer mon \xE9valuation",
      "Prepare my evaluation",
      "\u0625\u0639\u062F\u0627\u062F \u0637\u0644\u0628 \u0627\u0644\u062A\u0642\u064A\u064A\u0645"
    ),
    photo: "school",
    request: "establishments/quality-check-360",
    audience: "school",
    vertical: "establishment",
    priorities: [
      w(
        "Pratiques & organisation",
        "Practice & organisation",
        "\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645"
      ),
      w("\xC9quipe & comp\xE9tences", "Team & competencies", "\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A"),
      w("Cadre & exp\xE9rience", "Environment & experience", "\u0627\u0644\u0625\u0637\u0627\u0631 \u0648\u0627\u0644\u062A\u062C\u0631\u0628\u0629"),
      w("Actions & suivi", "Actions & follow-up", "\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629")
    ],
    dossiers: [
      {
        title: w("D\xE9finir le p\xE9rim\xE8tre", "Define the scope", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0646\u0637\u0627\u0642"),
        body: w(
          "Identifier les objectifs, les lieux concern\xE9s et les dimensions \xE0 examiner.",
          "Identify objectives, relevant locations and dimensions to examine.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0639\u0646\u064A\u0629 \u0648\u0623\u0628\u0639\u0627\u062F \u0627\u0644\u0641\u062D\u0635."
        ),
        detail: w(
          "Le p\xE9rim\xE8tre et la m\xE9thode applicables sont convenus avant l\u2019intervention.",
          "Applicable scope and method are agreed before the intervention.",
          "\u064A\u064F\u062A\u0641\u0642 \u0639\u0644\u0649 \u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u0645\u0646\u0647\u062C \u0642\u0628\u0644 \u0627\u0644\u062A\u062F\u062E\u0644."
        ),
        photo: "school"
      },
      {
        title: w(
          "Rassembler les \xE9l\xE9ments",
          "Gather the evidence",
          "\u062C\u0645\u0639 \u0627\u0644\u0639\u0646\u0627\u0635\u0631"
        ),
        body: w(
          "Pr\xE9parer les documents et les observations adapt\xE9s \xE0 l\u2019\xE9valuation convenue.",
          "Prepare documents and observations suited to the agreed evaluation.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647."
        ),
        detail: w(
          "Les \xE9l\xE9ments attendus sont d\xE9finis selon le contexte et le service retenu.",
          "Expected evidence is defined by context and the selected service.",
          "\u062A\u064F\u062D\u062F\u062F \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u062D\u0633\u0628 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629."
        ),
        photo: "desk"
      },
      {
        title: w(
          "Organiser la progression",
          "Organise improvement",
          "\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u062A\u062D\u0633\u064A\u0646"
        ),
        body: w(
          "Relier les constats, les priorit\xE9s et les actions au suivi convenu.",
          "Connect findings, priorities and actions to agreed follow-up.",
          "\u0631\u0628\u0637 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0628\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627."
        ),
        detail: w(
          "Les livrables et modalit\xE9s du suivi sont pr\xE9cis\xE9s pendant la qualification.",
          "Deliverables and follow-up terms are specified during qualification.",
          "\u062A\u064F\u0648\u0636\u062D \u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A \u0648\u0635\u064A\u063A \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0623\u0647\u064A\u0644."
        ),
        photo: "professional"
      }
    ]
  }
};
var B = {
  discover: w("Explorer", "Explore", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641"),
  prepare: w("Pr\xE9parer mon projet", "Prepare my project", "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0634\u0631\u0648\u0639"),
  offers: w(
    "Les offres de cet univers",
    "Offers in this world",
    "\u0639\u0631\u0648\u0636 \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0644\u0645"
  ),
  offersLead: w(
    "D\xE9couvrez les offres publi\xE9es, leur p\xE9rim\xE8tre et leur parcours.",
    "Explore published offers, their scope and journey.",
    "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0646\u0637\u0627\u0642\u0647\u0627 \u0648\u0645\u0633\u0627\u0631\u0647\u0627."
  ),
  emptyOffers: w(
    "Votre projet peut commencer ici. Pr\xE9parez votre demande pour pr\xE9ciser le p\xE9rim\xE8tre adapt\xE9 \xE0 votre contexte.",
    "Your project can start here. Prepare your enquiry to define a scope suited to your context.",
    "\u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0645\u0634\u0631\u0648\u0639\u0643\u0645 \u0647\u0646\u0627. \u0623\u0639\u062F\u0648\u0627 \u0627\u0644\u0637\u0644\u0628 \u0644\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0633\u064A\u0627\u0642\u0643\u0645."
  ),
  published: w("Offres publi\xE9es", "Published offers", "\u0639\u0631\u0648\u0636 \u0645\u0646\u0634\u0648\u0631\u0629"),
  all: w("Tout", "All", "\u0627\u0644\u0643\u0644"),
  search: w("Chercher dans les offres", "Search offers", "\u0627\u0644\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0639\u0631\u0648\u0636"),
  more: w("Afficher plus d\u2019offres", "Show more offers", "\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F"),
  reset: w("R\xE9initialiser", "Reset", "\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637"),
  sort: w("Trier", "Sort", "\u062A\u0631\u062A\u064A\u0628"),
  kind: w("Type d\u2019offre", "Offer type", "\u0646\u0648\u0639 \u0627\u0644\u0639\u0631\u0636"),
  name: w("Nom", "Name", "\u0627\u0644\u0627\u0633\u0645"),
  price: w("Prix croissant", "Price low to high", "\u0627\u0644\u0633\u0639\u0631 \u062A\u0635\u0627\u0639\u062F\u064A\u0627\u064B"),
  noMatch: w(
    "Aucune offre ne correspond \xE0 ces filtres.",
    "No offers match these filters.",
    "\u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0631\u0648\u0636 \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u0645\u0631\u0634\u062D\u0627\u062A."
  ),
  summary: w("Votre pr\xE9paration", "Your preparation", "\u062A\u062D\u0636\u064A\u0631\u0643\u0645"),
  selected: w("Vos priorit\xE9s", "Your priorities", "\u0623\u0648\u0644\u0648\u064A\u0627\u062A\u0643\u0645"),
  explain: w(
    "Comprendre le fonctionnement",
    "Understand how it works",
    "\u0641\u0647\u0645 \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0639\u0645\u0644"
  ),
  journey: w("Les prochaines \xE9tapes", "Next steps", "\u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0627\u0644\u062A\u0627\u0644\u064A\u0629"),
  question: w(
    "Vos questions, avant de vous lancer",
    "Your questions before getting started",
    "\u0623\u0633\u0626\u0644\u062A\u0643\u0645 \u0642\u0628\u0644 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642"
  ),
  resources: w(
    "Ressources & programmes publi\xE9s",
    "Published resources & programmes",
    "\u0645\u0648\u0627\u0631\u062F \u0648\u0628\u0631\u0627\u0645\u062C \u0645\u0646\u0634\u0648\u0631\u0629"
  ),
  details: w("Approfondir", "Explore further", "\u0627\u0644\u062A\u0639\u0645\u0642"),
  contact: w(
    "Parlons de votre projet",
    "Let\u2019s discuss your project",
    "\u0644\u0646\u062A\u062D\u062F\u062B \u0639\u0646 \u0645\u0634\u0631\u0648\u0639\u0643\u0645"
  ),
  contactLead: w(
    "Partagez votre contexte et vos priorit\xE9s. Votre demande sera enregistr\xE9e pour son traitement.",
    "Share your context and priorities. Your enquiry will be recorded for processing.",
    "\u0634\u0627\u0631\u0643\u0648\u0627 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0644\u064A\u064F\u0633\u062C\u0644 \u0637\u0644\u0628\u0643\u0645 \u0645\u0646 \u0623\u062C\u0644 \u0645\u0639\u0627\u0644\u062C\u062A\u0647."
  ),
  fullName: w("Nom complet", "Full name", "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644"),
  organization: w("Organisation", "Organisation", "\u0627\u0644\u0645\u0624\u0633\u0633\u0629"),
  city: w("Ville", "City", "\u0627\u0644\u0645\u062F\u064A\u0646\u0629"),
  email: w("Email", "Email", "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A"),
  phone: w("T\xE9l\xE9phone", "Phone", "\u0627\u0644\u0647\u0627\u062A\u0641"),
  message: w(
    "Votre contexte et vos besoins",
    "Your context and needs",
    "\u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A"
  ),
  capacity: w(
    "Taille / capacit\xE9 concern\xE9e",
    "Relevant size / capacity",
    "\u0627\u0644\u062D\u062C\u0645 \u0623\u0648 \u0627\u0644\u0633\u0639\u0629 \u0627\u0644\u0645\u0639\u0646\u064A\u0629"
  ),
  urgency: w("Votre horizon", "Your timeframe", "\u0627\u0644\u0623\u0641\u0642 \u0627\u0644\u0632\u0645\u0646\u064A"),
  exploration: w("Je me renseigne", "I\u2019m exploring", "\u0623\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A"),
  quarter: w(
    "Projet envisag\xE9 sous trois mois",
    "Considering a project within three months",
    "\u0645\u0634\u0631\u0648\u0639 \u062E\u0644\u0627\u0644 \u062B\u0644\u0627\u062B\u0629 \u0623\u0634\u0647\u0631"
  ),
  urgent: w(
    "Besoin \xE0 \xE9tudier rapidement",
    "Need to discuss promptly",
    "\u062D\u0627\u062C\u0629 \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629 \u0642\u0631\u064A\u0628\u0627\u064B"
  ),
  consent: w(
    "J\u2019accepte d\u2019\xEAtre contact\xE9 au sujet de cette demande et le traitement de mes informations pour y r\xE9pondre.",
    "I agree to be contacted about this enquiry and to my information being processed to respond.",
    "\u0623\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0628\u0634\u0623\u0646 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0648\u0645\u0639\u0627\u0644\u062C\u0629 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u064A \u0644\u0644\u0631\u062F \u0639\u0644\u064A\u0647."
  ),
  submit: w("Transmettre ma demande", "Send my enquiry", "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628"),
  sending: w("Enregistrement\u2026", "Recording\u2026", "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u0633\u062C\u064A\u0644\u2026"),
  success: w(
    "Votre demande est enregistr\xE9e.",
    "Your enquiry has been recorded.",
    "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0637\u0644\u0628\u0643\u0645."
  ),
  reference: w("R\xE9f\xE9rence", "Reference", "\u0627\u0644\u0645\u0631\u062C\u0639"),
  failure: w(
    "La demande n\u2019a pas pu \xEAtre confirm\xE9e. Vos informations restent ici : v\xE9rifiez et r\xE9essayez.",
    "Your enquiry could not be confirmed. Your information remains here: check and retry.",
    "\u062A\u0639\u0630\u0631 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0637\u0644\u0628. \u062A\u0628\u0642\u0649 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u0643\u0645 \u0647\u0646\u0627 \u0644\u0644\u062A\u062D\u0642\u0642 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629."
  ),
  invalid: w(
    "Renseignez les champs requis, un moyen de contact et votre accord.",
    "Complete required fields, a contact method and your consent.",
    "\u0623\u0643\u0645\u0644\u0648\u0627 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0648\u0648\u0633\u064A\u0644\u0629 \u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629."
  ),
  useBrief: w(
    "Ajouter ma pr\xE9paration au message",
    "Add my preparation to the message",
    "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062A\u062D\u0636\u064A\u0631 \u0625\u0644\u0649 \u0627\u0644\u0631\u0633\u0627\u0644\u0629"
  ),
  next: w("Continuer", "Continue", "\u0645\u062A\u0627\u0628\u0639\u0629"),
  back: w("Retour \xE0 l\u2019univers", "Back to this world", "\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0639\u0627\u0644\u0645"),
  proof: w(
    "Un p\xE9rim\xE8tre clair avant l\u2019engagement",
    "A clear scope before commitment",
    "\u0646\u0637\u0627\u0642 \u0648\u0627\u0636\u062D \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645"
  ),
  faqScope: w(
    "Comment le p\xE9rim\xE8tre est-il d\xE9fini ?",
    "How is the scope defined?",
    "\u0643\u064A\u0641 \u064A\u064F\u062D\u062F\u062F \u0627\u0644\u0646\u0637\u0627\u0642\u061F"
  ),
  faqScopeBody: w(
    "Votre contexte, les objectifs et les conditions du programme ou de l\u2019offre pr\xE9cisent le p\xE9rim\xE8tre applicable.",
    "Your context, objectives and programme or offer terms define the applicable scope.",
    "\u064A\u062D\u062F\u062F \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0634\u0631\u0648\u0637 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0623\u0648 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0637\u0628\u0642."
  ),
  faqPrice: w(
    "O\xF9 trouver les tarifs et les modalit\xE9s ?",
    "Where are prices and terms available?",
    "\u0623\u064A\u0646 \u0623\u062C\u062F \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u0634\u0631\u0648\u0637\u061F"
  ),
  faqPriceBody: w(
    "Les offres et plans publi\xE9s pr\xE9sentent les informations renseign\xE9es. Une demande permet de pr\xE9ciser les projets qui n\xE9cessitent une qualification.",
    "Published offers and plans show their provided information. An enquiry helps clarify projects requiring qualification.",
    "\u062A\u0639\u0631\u0636 \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0627\u0644\u062E\u0637\u0637 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629\u060C \u0648\u064A\u0633\u0627\u0639\u062F \u0627\u0644\u0637\u0644\u0628 \u0641\u064A \u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0627\u0644\u062A\u064A \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u062A\u0623\u0647\u064A\u0644."
  ),
  faqStart: w(
    "Que pr\xE9parer pour le premier \xE9change ?",
    "What should I prepare for the first discussion?",
    "\u0645\u0627\u0630\u0627 \u0623\u0639\u062F \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629 \u0627\u0644\u0623\u0648\u0644\u0649\u061F"
  ),
  faqStartBody: w(
    "Votre contexte, les publics concern\xE9s, vos priorit\xE9s et votre horizon. Les explorateurs de cette page vous aident \xE0 pr\xE9parer ces \xE9l\xE9ments.",
    "Your context, relevant audiences, priorities and timeframe. This page\u2019s explorers help you prepare them.",
    "\u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u0639\u0646\u064A\u0629 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u0641\u0642 \u0627\u0644\u0632\u0645\u0646\u064A. \u062A\u0633\u0627\u0639\u062F\u0643\u0645 \u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0635\u0641\u062D\u0629 \u0639\u0644\u0649 \u0625\u0639\u062F\u0627\u062F\u0647\u0627."
  ),
  nonMedical: w(
    "Accompagnement strictement non m\xE9dical : ANGELCARE ne diagnostique pas, ne prescrit pas et ne remplace pas les professionnels de sant\xE9 autoris\xE9s.",
    "Strictly non-medical support: ANGELCARE does not diagnose, prescribe or replace licensed health professionals.",
    "\u062F\u0639\u0645 \u063A\u064A\u0631 \u0637\u0628\u064A: \u0623\u0646\u062C\u0644 \u0643\u064A\u0631 \u0644\u0627 \u064A\u0634\u062E\u0635 \u0648\u0644\u0627 \u064A\u0635\u0641 \u0639\u0644\u0627\u062C\u0627\u062A \u0648\u0644\u0627 \u064A\u062D\u0644 \u0645\u062D\u0644 \u0627\u0644\u0645\u0647\u0646\u064A\u064A\u0646 \u0627\u0644\u0635\u062D\u064A\u064A\u0646 \u0627\u0644\u0645\u0631\u062E\u0635\u064A\u0646."
  ),
  guide: w("Guide du fonctionnement", "How it works guide", "\u062F\u0644\u064A\u0644 \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0639\u0645\u0644"),
  labelExample: w(
    "Structure explicative",
    "Explanatory structure",
    "\u0628\u0646\u064A\u0629 \u062A\u0648\u0636\u064A\u062D\u064A\u0629"
  ),
  member: w(
    "Acc\xE8s professionnel existant",
    "Existing professional access",
    "\u0648\u0644\u0648\u062C \u0627\u0644\u0645\u0647\u0646\u064A\u064A\u0646 \u0627\u0644\u0645\u0633\u062C\u0644\u064A\u0646"
  ),
  training: w("D\xE9couvrir Academy", "Explore Academy", "\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629"),
  saved: w(
    "Retrouver ma s\xE9lection",
    "Return to my selection",
    "\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A\u064A"
  ),
  compare: w("Comparer mes offres", "Compare my offers", "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0639\u0631\u0648\u0636"),
  copied: w("Pr\xE9paration copi\xE9e", "Preparation copied", "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u062A\u062D\u0636\u064A\u0631"),
  copy: w("Copier", "Copy", "\u0646\u0633\u062E"),
  copyError: w(
    "Copie indisponible ; s\xE9lectionnez le texte.",
    "Copy unavailable; select the text.",
    "\u0627\u0644\u0646\u0633\u062E \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u060C \u062D\u062F\u062F\u0648\u0627 \u0627\u0644\u0646\u0635."
  )
};

// business-worlds-r2/contract-runtime.mjs
var w2 = (fr, en, ar) => ({
  fr,
  en,
  ar
});
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
var WORLDS2 = {
  corporates: {
    label: w2("Entreprises", "Corporates", "\u0627\u0644\u0634\u0631\u0643\u0627\u062A"),
    eyebrow: w2(
      "LA FAMILLE ENTRE DANS VOTRE EXP\xC9RIENCE COLLABORATEUR",
      "FAMILY BELONGS IN YOUR EMPLOYEE EXPERIENCE",
      "\u0627\u0644\u0623\u0633\u0631\u0629 \u062C\u0632\u0621 \u0645\u0646 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0645\u0648\u0638\u0641"
    ),
    title: w2(
      "Derri\xE8re chaque talent, toute une vie.",
      "Behind every talent, an entire life.",
      "\u0648\u0631\u0627\u0621 \u0643\u0644 \u0645\u0648\u0647\u0628\u0629\u060C \u062D\u064A\u0627\u0629 \u0643\u0627\u0645\u0644\u0629."
    ),
    lead: w2(
      "Construisez un soutien aux familles qui prend sa place dans la vie r\xE9elle : au quotidien, dans les transitions et dans les moments impr\xE9vus.",
      "Build family support that fits real life: everyday needs, transitions and unexpected moments.",
      "\u0627\u0628\u0646\u0648\u0627 \u062F\u0639\u0645\u0627\u064B \u0644\u0644\u0623\u0633\u0631 \u064A\u0646\u0627\u0633\u0628 \u0627\u0644\u062D\u064A\u0627\u0629 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0648\u0627\u0644\u062A\u062D\u0648\u0644\u0627\u062A \u0648\u0627\u0644\u0638\u0631\u0648\u0641 \u063A\u064A\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629."
    ),
    action: w2(
      "Concevoir mon programme employeur",
      "Design my employer programme",
      "\u062A\u0635\u0645\u064A\u0645 \u0628\u0631\u0646\u0627\u0645\u062C \u0645\u0624\u0633\u0633\u062A\u0646\u0627"
    ),
    photo: "corporate",
    request: "corporates/request",
    audience: "corporate",
    vertical: "corporate",
    priorities: [
      w2("Soutien au quotidien", "Everyday support", "\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u064A\u0648\u0645\u064A"),
      w2("Situations impr\xE9vues", "Unexpected situations", "\u0627\u0644\u0638\u0631\u0648\u0641 \u063A\u064A\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629"),
      w2("Transitions parentales", "Parenthood transitions", "\u062A\u062D\u0648\u0644\u0627\u062A \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0629"),
      w2("Moments familles", "Family moments", "\u0644\u062D\u0638\u0627\u062A \u0623\u0633\u0631\u064A\u0629")
    ],
    dossiers: [
      {
        title: w2("Family Benefits", "Family Benefits", "\u0645\u0632\u0627\u064A\u0627 \u0627\u0644\u0623\u0633\u0631\u0629"),
        body: w2(
          "Organiser un acc\xE8s aux services selon votre population et votre programme.",
          "Organise service access around your people and programme.",
          "\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u0641\u0626\u0627\u062A \u0648\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u0624\u0633\u0633\u0629."
        ),
        detail: w2(
          "\xC0 d\xE9finir ensemble : \xE9ligibilit\xE9, allocation, contribution et parcours d\u2019utilisation.",
          "Define eligibility, allocations, contributions and the use journey together.",
          "\u0646\u062D\u062F\u062F \u0645\u0639\u0627\u064B \u0627\u0644\u0623\u0647\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u062E\u0635\u0635\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0627\u062A \u0648\u0645\u0633\u0627\u0631 \u0627\u0644\u0627\u0633\u062A\u0641\u0627\u062F\u0629."
        ),
        photo: "family",
        href: "corporates/family-benefits"
      },
      {
        title: w2(
          "Emergency Support",
          "Emergency Support",
          "\u0627\u0644\u062F\u0639\u0645 \u0641\u064A \u0627\u0644\u0638\u0631\u0648\u0641 \u0627\u0644\u0637\u0627\u0631\u0626\u0629"
        ),
        body: w2(
          "Pr\xE9parer une r\xE9ponse lorsque l\u2019organisation familiale est perturb\xE9e.",
          "Prepare a response when family arrangements are disrupted.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0639\u0646\u062F \u062A\u0639\u0637\u0644 \u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0623\u0633\u0631\u064A."
        ),
        detail: w2(
          "Le p\xE9rim\xE8tre, les conditions d\u2019acc\xE8s et la disponibilit\xE9 se d\xE9finissent dans le programme.",
          "Scope, access conditions and availability are defined within the programme.",
          "\u064A\u064F\u062D\u062F\u062F \u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0634\u0631\u0648\u0637 \u0627\u0644\u0648\u0635\u0648\u0644 \u0648\u0627\u0644\u062A\u0648\u0641\u0631 \u0636\u0645\u0646 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        photo: "urgent",
        href: "corporates/emergency-support"
      },
      {
        title: w2("Family Days", "Family Days", "\u0623\u064A\u0627\u0645 \u0627\u0644\u0623\u0633\u0631\u0629"),
        body: w2(
          "Donner une place aux enfants et aux familles dans la culture de votre entreprise.",
          "Make room for children and families in your company culture.",
          "\u0645\u0646\u062D \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0627\u0644\u0623\u0633\u0631 \u0645\u0643\u0627\u0646\u0627\u064B \u0641\u064A \u062B\u0642\u0627\u0641\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u0629."
        ),
        detail: w2(
          "Objectifs, \xE2ges, activit\xE9s, lieu et coordination composent votre projet.",
          "Objectives, ages, activities, venue and coordination shape your project.",
          "\u062A\u064F\u0628\u0646\u0649 \u0627\u0644\u0645\u0628\u0627\u062F\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0631 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u0643\u0627\u0646 \u0648\u0627\u0644\u062A\u0646\u0633\u064A\u0642."
        ),
        photo: "holidays",
        href: "corporates/family-days"
      }
    ]
  },
  establishments: {
    label: w2("\xC9tablissements", "Establishments", "\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629"),
    eyebrow: w2(
      "UN \xC9TABLISSEMENT. PLUSIEURS LEVIERS. UNE DIRECTION.",
      "ONE ESTABLISHMENT. MANY LEVERS. ONE DIRECTION.",
      "\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u062D\u062F\u0629\u060C \u0645\u062D\u0627\u0648\u0631 \u0645\u062A\u0639\u062F\u062F\u0629\u060C \u0627\u062A\u062C\u0627\u0647 \u0648\u0627\u0636\u062D"
    ),
    title: w2(
      "Faites grandir tout votre \xE9tablissement.",
      "Help your entire establishment grow.",
      "\u0637\u0648\u0651\u0631\u0648\u0627 \u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0628\u0643\u0644 \u0623\u0628\u0639\u0627\u062F\u0647\u0627."
    ),
    lead: w2(
      "Reliez les pratiques p\xE9dagogiques, les comp\xE9tences des \xE9quipes, la confiance des parents et votre organisation. Commencez par comprendre o\xF9 agir.",
      "Connect educational practice, team competencies, parent trust and organisation. Start by understanding where to act.",
      "\u0627\u0631\u0628\u0637\u0648\u0627 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0648\u0643\u0641\u0627\u0621\u0627\u062A \u0627\u0644\u0641\u0631\u0642 \u0648\u062B\u0642\u0629 \u0627\u0644\u0622\u0628\u0627\u0621 \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645\u060C \u0648\u0627\u0628\u062F\u0624\u0648\u0627 \u0628\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A."
    ),
    action: w2(
      "Pr\xE9parer mon diagnostic",
      "Prepare my assessment",
      "\u0625\u0639\u062F\u0627\u062F \u0637\u0644\u0628 \u0627\u0644\u062A\u0642\u064A\u064A\u0645"
    ),
    photo: "school",
    request: "establishments/diagnostic",
    audience: "school",
    vertical: "establishment",
    priorities: [
      w2("P\xE9dagogie & espaces", "Learning & spaces", "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u0641\u0636\u0627\u0621\u0627\u062A"),
      w2("\xC9quipe & comp\xE9tences", "Team & competencies", "\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A"),
      w2("Confiance des parents", "Parent trust", "\u062B\u0642\u0629 \u0627\u0644\u0622\u0628\u0627\u0621"),
      w2("Organisation & qualit\xE9", "Organisation & quality", "\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0648\u0627\u0644\u062C\u0648\u062F\u0629")
    ],
    dossiers: [
      {
        title: w2(
          "Comprendre votre point de d\xE9part",
          "Understand your starting point",
          "\u0641\u0647\u0645 \u0646\u0642\u0637\u0629 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642"
        ),
        body: w2(
          "Le diagnostic rassemble votre contexte et vos priorit\xE9s avant de d\xE9finir une intervention.",
          "An assessment brings together your context and priorities before defining an intervention.",
          "\u064A\u062C\u0645\u0639 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0642\u0628\u0644 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u062A\u062F\u062E\u0644."
        ),
        detail: w2(
          "Type d\u2019\xE9tablissement, publics, espaces, pratiques et organisation servent \xE0 pr\xE9parer l\u2019\xE9change.",
          "Establishment type, audiences, spaces, practices and organisation prepare the discussion.",
          "\u064A\u0633\u0627\u0639\u062F \u0646\u0648\u0639 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u0644\u0641\u0626\u0627\u062A \u0648\u0627\u0644\u0641\u0636\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u0641\u064A \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0644\u0642\u0627\u0621."
        ),
        photo: "preschool",
        href: "establishments/diagnostic"
      },
      {
        title: w2(
          "Faire progresser les comp\xE9tences",
          "Develop competencies",
          "\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A"
        ),
        body: w2(
          "Academy relie besoins d\u2019apprentissage et parcours de formation publi\xE9s.",
          "Academy connects learning needs with published training pathways.",
          "\u062A\u0631\u0628\u0637 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u0628\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0643\u0648\u064A\u0646 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629."
        ),
        detail: w2(
          "Les modalit\xE9s, pr\xE9requis et \xE9valuations sont pr\xE9cis\xE9s dans le programme concern\xE9.",
          "Delivery, prerequisites and assessments are specified in each programme.",
          "\u062A\u064F\u0648\u0636\u062D \u0627\u0644\u0635\u064A\u063A \u0648\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0641\u064A \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u0639\u0646\u064A."
        ),
        photo: "academy",
        href: "establishments/academy"
      },
      {
        title: w2(
          "Structurer votre progression",
          "Structure your progress",
          "\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u062A\u0642\u062F\u0645"
        ),
        body: w2(
          "Quality Check et Partner OS abordent l\u2019\xE9valuation et l\u2019organisation selon votre p\xE9rim\xE8tre.",
          "Quality Check and Partner OS address evaluation and organisation within your scope.",
          "\u064A\u0639\u0627\u0644\u062C \u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645 \u062D\u0633\u0628 \u0646\u0637\u0627\u0642\u0643\u0645."
        ),
        detail: w2(
          "Chaque composante poss\xE8de ses propres conditions, livrables et parcours.",
          "Each component has its own terms, deliverables and journey.",
          "\u0644\u0643\u0644 \u0645\u062D\u0648\u0631 \u0634\u0631\u0648\u0637\u0647 \u0648\u0645\u062E\u0631\u062C\u0627\u062A\u0647 \u0648\u0645\u0633\u0627\u0631\u0647."
        ),
        photo: "desk",
        href: "quality-check"
      }
    ]
  },
  "health-partners": {
    label: w2("Partenaires sant\xE9", "Health Partners", "\u0634\u0631\u0643\u0627\u0621 \u0627\u0644\u0635\u062D\u0629"),
    eyebrow: w2(
      "\xC0 VOS C\xD4T\xC9S. AUTOUR DES FAMILLES.",
      "ALONGSIDE YOU. AROUND FAMILIES.",
      "\u0625\u0644\u0649 \u062C\u0627\u0646\u0628\u0643\u0645\u060C \u0644\u062F\u0639\u0645 \u0627\u0644\u0623\u0633\u0631"
    ),
    title: w2(
      "Un accompagnement qui continue autour de la famille.",
      "Support that continues around the family.",
      "\u062F\u0639\u0645 \u064A\u0631\u0627\u0641\u0642 \u0627\u0644\u0623\u0633\u0631\u0629 \u0641\u064A \u0645\u062E\u062A\u0644\u0641 \u0645\u0631\u0627\u062D\u0644\u0647\u0627."
    ),
    lead: w2(
      "Maternit\xE9, retour \xE0 domicile, soutien parental et ateliers : construisez un parcours familial chaleureux, coordonn\xE9 et strictement non m\xE9dical.",
      "Maternity, returning home, parent support and workshops: build a warm, coordinated and strictly non-medical family pathway.",
      "\u0627\u0644\u0623\u0645\u0648\u0645\u0629 \u0648\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0632\u0644 \u0648\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646 \u0648\u0627\u0644\u0648\u0631\u0634\u0627\u062A: \u0645\u0633\u0627\u0631 \u0623\u0633\u0631\u064A \u0625\u0646\u0633\u0627\u0646\u064A \u0648\u0645\u0646\u0638\u0645 \u0648\u063A\u064A\u0631 \u0637\u0628\u064A."
    ),
    action: w2(
      "\xC9tudier notre partenariat",
      "Explore our partnership",
      "\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0634\u0631\u0627\u0643\u0629"
    ),
    photo: "health",
    request: "health-partners/request",
    audience: "clinic",
    vertical: "health_partner",
    priorities: [
      w2("Autour de la maternit\xE9", "Around maternity", "\u062D\u0648\u0644 \u0627\u0644\u0623\u0645\u0648\u0645\u0629"),
      w2("Retour \xE0 domicile", "Returning home", "\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0632\u0644"),
      w2("Soutien parental", "Parent support", "\u062F\u0639\u0645 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646"),
      w2("Ateliers familles", "Family workshops", "\u0648\u0631\u0634\u0627\u062A \u0627\u0644\u0623\u0633\u0631")
    ],
    dossiers: [
      {
        title: w2(
          "Maternit\xE9 & pr\xE9paration",
          "Maternity & preparation",
          "\u0627\u0644\u0623\u0645\u0648\u0645\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F"
        ),
        body: w2(
          "Donner aux familles des rep\xE8res pour organiser le soutien au quotidien.",
          "Give families orientation for organising everyday support.",
          "\u062A\u0642\u062F\u064A\u0645 \u0625\u0631\u0634\u0627\u062F\u0627\u062A \u0644\u0644\u0623\u0633\u0631 \u0644\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u064A\u0648\u0645\u064A."
        ),
        detail: w2(
          "Le partenaire et ANGELCARE d\xE9finissent les r\xF4les, le p\xE9rim\xE8tre et la coordination.",
          "The partner and ANGELCARE define roles, scope and coordination.",
          "\u064A\u062D\u062F\u062F \u0627\u0644\u0634\u0631\u064A\u0643 \u0648\u0623\u0646\u062C\u0644 \u0643\u064A\u0631 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u062A\u0646\u0633\u064A\u0642."
        ),
        photo: "newborn",
        href: "health-partners/maternity"
      },
      {
        title: w2("Mother & Baby Care", "Mother & Baby Care", "\u062F\u0639\u0645 \u0627\u0644\u0623\u0645 \u0648\u0627\u0644\u0637\u0641\u0644"),
        body: w2(
          "Explorer un soutien non m\xE9dical adapt\xE9 au contexte familial.",
          "Explore non-medical support adapted to the family context.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u062F\u0639\u0645 \u063A\u064A\u0631 \u0637\u0628\u064A \u064A\u0646\u0627\u0633\u0628 \u0627\u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u0623\u0633\u0631\u064A."
        ),
        detail: w2(
          "Les activit\xE9s autoris\xE9es, limites et modalit\xE9s de relais sont explicites.",
          "Allowed activities, boundaries and handover arrangements are explicit.",
          "\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627 \u0648\u0627\u0644\u062D\u062F\u0648\u062F \u0648\u0635\u064A\u063A \u0627\u0644\u0625\u062D\u0627\u0644\u0629 \u0648\u0627\u0636\u062D\u0629."
        ),
        photo: "care",
        href: "health-partners/mother-baby-care"
      },
      {
        title: w2(
          "Ateliers & rep\xE8res",
          "Workshops & orientation",
          "\u0648\u0631\u0634\u0627\u062A \u0648\u0625\u0631\u0634\u0627\u062F\u0627\u062A"
        ),
        body: w2(
          "Cr\xE9er des temps d\u2019\xE9change et de d\xE9couverte pour les parents.",
          "Create opportunities for parents to learn and share.",
          "\u0625\u062A\u0627\u062D\u0629 \u0641\u0631\u0635 \u0644\u0644\u062A\u0639\u0644\u0645 \u0648\u0627\u0644\u062A\u0628\u0627\u062F\u0644 \u0628\u064A\u0646 \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646."
        ),
        detail: w2(
          "Les contenus et intervenants sont pr\xE9cis\xE9s pour chaque atelier publi\xE9.",
          "Content and facilitators are specified for each published workshop.",
          "\u062A\u064F\u0648\u0636\u062D \u0627\u0644\u0645\u0636\u0627\u0645\u064A\u0646 \u0648\u0627\u0644\u0645\u062A\u062F\u062E\u0644\u0648\u0646 \u0644\u0643\u0644 \u0648\u0631\u0634\u0629 \u0645\u0646\u0634\u0648\u0631\u0629."
        ),
        photo: "support",
        href: "health-partners/workshops"
      }
    ]
  },
  hospitality: {
    label: w2("Hospitality", "Hospitality", "\u0627\u0644\u0636\u064A\u0627\u0641\u0629"),
    eyebrow: w2(
      "LE S\xC9JOUR FAMILLE DEVIENT VOTRE SIGNATURE",
      "THE FAMILY STAY BECOMES YOUR SIGNATURE",
      "\u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0627\u0644\u0623\u0633\u0631\u064A\u0629 \u062A\u0635\u0628\u062D \u0628\u0635\u0645\u062A\u0643\u0645"
    ),
    title: w2(
      "Des enfants \xE9merveill\xE9s. Des parents qui savourent.",
      "Wonder for children. Time for parents.",
      "\u062F\u0647\u0634\u0629 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0648\u0648\u0642\u062A \u064A\u0633\u062A\u0645\u062A\u0639 \u0628\u0647 \u0627\u0644\u0648\u0627\u0644\u062F\u0627\u0646."
    ),
    lead: w2(
      "Imaginez l\u2019exp\xE9rience famille dans votre propri\xE9t\xE9 : d\xE9couverte, activit\xE9s, garde des enfants des clients et conciergerie. Chaque moment trouve sa place.",
      "Imagine the family experience at your property: discovery, activities, guest childcare and concierge. Every moment finds its place.",
      "\u062A\u0635\u0648\u0631\u0648\u0627 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0623\u0633\u0631 \u0641\u064A \u0645\u0646\u0634\u0623\u062A\u0643\u0645: \u0627\u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u0648\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641 \u0648\u0627\u0644\u0643\u0648\u0646\u0633\u064A\u0631\u062C\u060C \u0644\u0643\u0644 \u0644\u062D\u0638\u0629 \u0645\u0643\u0627\u0646\u0647\u0627."
    ),
    action: w2(
      "Imaginer notre programme Hospitality",
      "Imagine our Hospitality programme",
      "\u062A\u0635\u0645\u064A\u0645 \u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0636\u064A\u0627\u0641\u0629"
    ),
    photo: "hospitality",
    request: "hospitality/request",
    audience: "hotel",
    vertical: "hospitality",
    priorities: [
      w2("Kids Club", "Kids Club", "\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644"),
      w2("Guest Childcare", "Guest Childcare", "\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641"),
      w2("Family Concierge", "Family Concierge", "\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0623\u0633\u0631\u0629"),
      w2("Programmes saisonniers", "Seasonal programmes", "\u0628\u0631\u0627\u0645\u062C \u0645\u0648\u0633\u0645\u064A\u0629")
    ],
    dossiers: [
      {
        title: w2("Kids Club", "Kids Club", "\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0637\u0641\u0627\u0644"),
        body: w2(
          "Un univers d\u2019activit\xE9s pens\xE9 autour des \xE2ges, des espaces et de votre identit\xE9.",
          "An activity universe shaped around ages, spaces and your identity.",
          "\u0639\u0627\u0644\u0645 \u0645\u0646 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0645\u0628\u0646\u064A \u0639\u0644\u0649 \u0627\u0644\u0623\u0639\u0645\u0627\u0631 \u0648\u0627\u0644\u0641\u0636\u0627\u0621\u0627\u062A \u0648\u0647\u0648\u064A\u0629 \u0645\u0646\u0634\u0623\u062A\u0643\u0645."
        ),
        detail: w2(
          "D\xE9finir ensemble : publics, capacit\xE9, rythme, encadrement, mat\xE9riel et langues.",
          "Define audiences, capacity, rhythm, supervision, equipment and languages together.",
          "\u0646\u062D\u062F\u062F \u0645\u0639\u0627\u064B \u0627\u0644\u0641\u0626\u0627\u062A \u0648\u0627\u0644\u0633\u0639\u0629 \u0648\u0627\u0644\u0625\u064A\u0642\u0627\u0639 \u0648\u0627\u0644\u062A\u0623\u0637\u064A\u0631 \u0648\u0627\u0644\u0645\u0648\u0627\u062F \u0648\u0627\u0644\u0644\u063A\u0627\u062A."
        ),
        photo: "games",
        href: "hospitality/kids-club"
      },
      {
        title: w2("Guest Childcare", "Guest Childcare", "\u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641"),
        body: w2(
          "Organiser la garde des enfants des clients dans le p\xE9rim\xE8tre convenu.",
          "Organise guest childcare within an agreed scope.",
          "\u062A\u0646\u0638\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0636\u064A\u0648\u0641 \u0641\u064A \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647."
        ),
        detail: w2(
          "R\xE9servation, consentement, langues et remise de l\u2019enfant structurent l\u2019exp\xE9rience.",
          "Booking, consent, languages and child handover structure the experience.",
          "\u064A\u0646\u0638\u0645 \u0627\u0644\u062D\u062C\u0632 \u0648\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u0627\u0644\u0644\u063A\u0627\u062A \u0648\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0637\u0641\u0644 \u0627\u0644\u062A\u062C\u0631\u0628\u0629."
        ),
        photo: "care",
        href: "hospitality/guest-childcare"
      },
      {
        title: w2("Family Concierge", "Family Concierge", "\u0643\u0648\u0646\u0633\u064A\u0631\u062C \u0627\u0644\u0623\u0633\u0631\u0629"),
        body: w2(
          "Aider les familles \xE0 d\xE9couvrir les possibilit\xE9s de leur s\xE9jour.",
          "Help families discover the possibilities of their stay.",
          "\u0645\u0633\u0627\u0639\u062F\u0629 \u0627\u0644\u0623\u0633\u0631 \u0639\u0644\u0649 \u0627\u0643\u062A\u0634\u0627\u0641 \u0625\u0645\u0643\u0627\u0646\u0627\u062A \u0625\u0642\u0627\u0645\u062A\u0647\u0645."
        ),
        detail: w2(
          "Rep\xE8res, orientation et coordination selon les services convenus.",
          "Orientation and coordination follow the agreed services.",
          "\u0625\u0631\u0634\u0627\u062F \u0648\u062A\u0646\u0633\u064A\u0642 \u062D\u0633\u0628 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627."
        ),
        photo: "family",
        href: "hospitality/family-concierge"
      },
      {
        title: w2(
          "Programmes saisonniers",
          "Seasonal programmes",
          "\u0628\u0631\u0627\u0645\u062C \u0645\u0648\u0633\u0645\u064A\u0629"
        ),
        body: w2(
          "Donner un rythme aux vacances et aux temps forts de votre propri\xE9t\xE9.",
          "Give holidays and key property moments their own rhythm.",
          "\u0645\u0646\u062D \u0627\u0644\u0639\u0637\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0627\u0644\u0628\u0627\u0631\u0632\u0629 \u0625\u064A\u0642\u0627\u0639\u0627\u064B \u062E\u0627\u0635\u0627\u064B."
        ),
        detail: w2(
          "Contenu, calendrier, espaces et pr\xE9paration composent votre programme.",
          "Content, timing, spaces and preparation shape your programme.",
          "\u062A\u0634\u0643\u0644 \u0627\u0644\u0645\u0636\u0627\u0645\u064A\u0646 \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u0641\u0636\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C."
        ),
        photo: "holidays",
        href: "hospitality/seasonal-programs"
      }
    ]
  },
  "partner-os": {
    label: w2("Partner OS", "Partner OS", "\u0646\u0638\u0627\u0645 \u0627\u0644\u0634\u0631\u0643\u0627\u0621"),
    eyebrow: w2(
      "VOTRE ORGANISATION, AVEC UNE DIRECTION LISIBLE",
      "YOUR ORGANISATION, WITH A CLEAR DIRECTION",
      "\u0645\u0624\u0633\u0633\u062A\u0643\u0645 \u0641\u064A \u0627\u062A\u062C\u0627\u0647 \u0648\u0627\u0636\u062D"
    ),
    title: w2(
      "Donnez une structure \xE0 votre quotidien.",
      "Give your daily work a structure.",
      "\u0627\u0645\u0646\u062D\u0648\u0627 \u0639\u0645\u0644\u0643\u0645 \u0627\u0644\u064A\u0648\u0645\u064A \u062A\u0646\u0638\u064A\u0645\u0627\u064B \u0648\u0627\u0636\u062D\u0627\u064B."
    ),
    lead: w2(
      "Comprenez les espaces, les r\xF4les, les modules et les \xE9tapes d\u2019activation. Explorez le fonctionnement avant de choisir un plan ou une d\xE9monstration.",
      "Understand workspaces, roles, modules and activation stages. Explore how it works before choosing a plan or demonstration.",
      "\u0627\u0641\u0647\u0645\u0648\u0627 \u0641\u0636\u0627\u0621\u0627\u062A \u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0645\u0631\u0627\u062D\u0644 \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0642\u0628\u0644 \u0627\u062E\u062A\u064A\u0627\u0631 \u062E\u0637\u0629 \u0623\u0648 \u0639\u0631\u0636 \u062A\u0648\u0636\u064A\u062D\u064A."
    ),
    action: w2(
      "Pr\xE9parer ma d\xE9monstration",
      "Prepare my demonstration",
      "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A"
    ),
    photo: "desk",
    request: "partner-os/contact",
    audience: "partner_os",
    priorities: [
      w2("Espace organisation", "Organisation workspace", "\u0641\u0636\u0627\u0621 \u0627\u0644\u0645\u0624\u0633\u0633\u0629"),
      w2("\xC9quipe & acc\xE8s", "Team & access", "\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A"),
      w2("Modules & abonnement", "Modules & subscription", "\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643"),
      w2(
        "Pr\xE9paration & activation",
        "Readiness & activation",
        "\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0648\u0627\u0644\u062A\u0641\u0639\u064A\u0644"
      )
    ],
    dossiers: [
      {
        title: w2(
          "Un espace par organisation",
          "An organisation workspace",
          "\u0641\u0636\u0627\u0621 \u062E\u0627\u0635 \u0628\u0627\u0644\u0645\u0624\u0633\u0633\u0629"
        ),
        body: w2(
          "Identit\xE9 de l\u2019organisation, territoire, langue et \xE9tat du workspace.",
          "Organisation identity, territory, language and workspace state.",
          "\u0647\u0648\u064A\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0648\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0648\u0627\u0644\u0644\u063A\u0629 \u0648\u062D\u0627\u0644\u0629 \u0641\u0636\u0627\u0621 \u0627\u0644\u0639\u0645\u0644."
        ),
        detail: w2(
          "Le contexte de l\u2019organisation d\xE9termine le p\xE9rim\xE8tre des acc\xE8s.",
          "Organisation context determines the access scope.",
          "\u064A\u062D\u062F\u062F \u0633\u064A\u0627\u0642 \u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0646\u0637\u0627\u0642 \u0627\u0644\u0648\u0635\u0648\u0644."
        ),
        photo: "desk"
      },
      {
        title: w2(
          "Des acc\xE8s selon les r\xF4les",
          "Role-based access",
          "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u0623\u062F\u0648\u0627\u0631"
        ),
        body: w2(
          "Des membres et des droits pour organiser la participation de votre \xE9quipe.",
          "Members and permissions organise team participation.",
          "\u0623\u0639\u0636\u0627\u0621 \u0648\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0644\u062A\u0646\u0638\u064A\u0645 \u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0641\u0631\u064A\u0642."
        ),
        detail: w2(
          "Les droits disponibles suivent les autorit\xE9s et les r\xE8gles du portail.",
          "Available rights follow portal authorities and rules.",
          "\u062A\u062A\u0628\u0639 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0633\u0644\u0637\u0627\u062A \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u0648\u0627\u0628\u0629."
        ),
        photo: "professional"
      },
      {
        title: w2(
          "Une activation pr\xE9par\xE9e",
          "Prepared activation",
          "\u062A\u0641\u0639\u064A\u0644 \u0628\u0639\u062F \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F"
        ),
        body: w2(
          "Le plan, les modules et les contr\xF4les de pr\xE9paration composent l\u2019activation.",
          "Plan, modules and readiness checks shape activation.",
          "\u062A\u064F\u0628\u0646\u0649 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0639\u0644\u0649 \u0627\u0644\u062E\u0637\u0629 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0641\u062D\u0648\u0635\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F."
        ),
        detail: w2(
          "Les modules et limites du plan retenu sont pr\xE9cis\xE9s pendant la qualification.",
          "Modules and limits of the selected plan are specified during qualification.",
          "\u062A\u064F\u0648\u0636\u062D \u0648\u062D\u062F\u0627\u062A \u0648\u062D\u062F\u0648\u062F \u0627\u0644\u062E\u0637\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0623\u0647\u064A\u0644."
        ),
        photo: "academy"
      }
    ]
  },
  professionals: {
    label: w2("Professionnels", "Professionals", "\u0627\u0644\u0645\u0647\u0646\u064A\u0648\u0646"),
    eyebrow: w2(
      "VOTRE SAVOIR-FAIRE A UN PROCHAIN CHAPITRE",
      "YOUR EXPERTISE HAS A NEXT CHAPTER",
      "\u0644\u0643\u0641\u0627\u0621\u0627\u062A\u0643\u0645 \u0641\u0635\u0644 \u062C\u062F\u064A\u062F"
    ),
    title: w2(
      "Vos comp\xE9tences. Votre direction. Votre prochain parcours.",
      "Your skills. Your direction. Your next pathway.",
      "\u0643\u0641\u0627\u0621\u0627\u062A\u0643\u0645\u060C \u0627\u062A\u062C\u0627\u0647\u0643\u0645\u060C \u0648\u0645\u0633\u0627\u0631\u0643\u0645 \u0627\u0644\u0642\u0627\u062F\u0645."
    ),
    lead: w2(
      "D\xE9couvrez les univers professionnels ANGELCARE, identifiez vos priorit\xE9s de progression et pr\xE9parez votre entr\xE9e dans le parcours qui vous correspond.",
      "Discover ANGELCARE professional contexts, identify development priorities and prepare the pathway that fits you.",
      "\u0627\u0643\u062A\u0634\u0641\u0648\u0627 \u0627\u0644\u0645\u062C\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0644\u0623\u0646\u062C\u0644 \u0643\u064A\u0631 \u0648\u062D\u062F\u062F\u0648\u0627 \u0623\u0648\u0644\u0648\u064A\u0627\u062A \u062A\u0637\u0648\u064A\u0631\u0643\u0645 \u0648\u0623\u0639\u062F\u0648\u0627 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0643\u0645."
    ),
    action: w2(
      "Pr\xE9parer mon parcours professionnel",
      "Prepare my professional pathway",
      "\u0625\u0639\u062F\u0627\u062F \u0645\u0633\u0627\u0631\u064A \u0627\u0644\u0645\u0647\u0646\u064A"
    ),
    photo: "professional",
    request: "professionals/join",
    audience: "provider",
    priorities: [
      w2("Petite enfance", "Early childhood", "\u0627\u0644\u0637\u0641\u0648\u0644\u0629 \u0627\u0644\u0645\u0628\u0643\u0631\u0629"),
      w2("Accompagnement familial", "Family support", "\u062F\u0639\u0645 \u0627\u0644\u0623\u0633\u0631\u0629"),
      w2(
        "Animation & activit\xE9s",
        "Activities & facilitation",
        "\u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u062A\u0646\u0634\u064A\u0637"
      ),
      w2("Formation & progression", "Learning & progression", "\u0627\u0644\u062A\u0643\u0648\u064A\u0646 \u0648\u0627\u0644\u062A\u0637\u0648\u0631")
    ],
    dossiers: [
      {
        title: w2(
          "Pratiques \xE9ducatives",
          "Educational practice",
          "\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629"
        ),
        body: w2(
          "Observation, pr\xE9paration d\u2019activit\xE9s, communication et coop\xE9ration.",
          "Observation, activity preparation, communication and cooperation.",
          "\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0648\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u062A\u0639\u0627\u0648\u0646."
        ),
        detail: w2(
          "Les comp\xE9tences et exigences d\xE9pendent du r\xF4le et du parcours concern\xE9.",
          "Competencies and requirements depend on the role and pathway.",
          "\u062A\u062E\u062A\u0644\u0641 \u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u062F\u0648\u0631 \u0648\u0627\u0644\u0645\u0633\u0627\u0631."
        ),
        photo: "preschool",
        href: "academy"
      },
      {
        title: w2(
          "Accompagnement des familles",
          "Supporting families",
          "\u0645\u0631\u0627\u0641\u0642\u0629 \u0627\u0644\u0623\u0633\u0631"
        ),
        body: w2(
          "Comprendre le contexte, organiser les temps et travailler dans un p\xE9rim\xE8tre clair.",
          "Understand context, organise time and work within a clear scope.",
          "\u0641\u0647\u0645 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0623\u0648\u0642\u0627\u062A \u0648\u0627\u0644\u0639\u0645\u0644 \u0636\u0645\u0646 \u0646\u0637\u0627\u0642 \u0648\u0627\u0636\u062D."
        ),
        detail: w2(
          "Le soutien non m\xE9dical, les transmissions et les limites font partie du cadre.",
          "Non-medical support, handovers and boundaries form part of the framework.",
          "\u064A\u0634\u0645\u0644 \u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u062F\u0639\u0645 \u063A\u064A\u0631 \u0627\u0644\u0637\u0628\u064A \u0648\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u062D\u062F\u0648\u062F."
        ),
        photo: "care",
        href: "home-services"
      },
      {
        title: w2(
          "Apprendre & se pr\xE9parer",
          "Learn & prepare",
          "\u0627\u0644\u062A\u0639\u0644\u0645 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F"
        ),
        body: w2(
          "Explorer les programmes publi\xE9s et clarifier votre prochain besoin d\u2019apprentissage.",
          "Explore published programmes and clarify your next learning need.",
          "\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u062D\u0627\u062C\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629."
        ),
        detail: w2(
          "Les pr\xE9requis, modalit\xE9s et \xE9valuations sont d\xE9crits sur le programme choisi.",
          "Prerequisites, delivery and assessments are described in the selected programme.",
          "\u062A\u064F\u0639\u0631\u0636 \u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0648\u0627\u0644\u0635\u064A\u063A \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0641\u064A \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0645\u062E\u062A\u0627\u0631."
        ),
        photo: "academy",
        href: "academy"
      }
    ]
  },
  "quality-check": {
    label: w2("Quality Check", "Quality Check", "\u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629"),
    eyebrow: w2(
      "DE LA VISIBILIT\xC9 \xC0 LA PROGRESSION",
      "FROM VISIBILITY TO PROGRESS",
      "\u0645\u0646 \u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0648\u0627\u0636\u062D\u0629 \u0625\u0644\u0649 \u0627\u0644\u062A\u0642\u062F\u0645"
    ),
    title: w2(
      "Voir plus clair. Agir avec une direction.",
      "See clearly. Act with direction.",
      "\u0631\u0624\u064A\u0629 \u0623\u0648\u0636\u062D \u0648\u0639\u0645\u0644 \u0641\u064A \u0627\u062A\u062C\u0627\u0647 \u0645\u062D\u062F\u062F."
    ),
    lead: w2(
      "Comprenez le p\xE9rim\xE8tre d\u2019une \xE9valuation, les \xE9l\xE9ments \xE0 pr\xE9parer et la mani\xE8re dont les constats peuvent devenir un plan de progression.",
      "Understand an evaluation scope, what to prepare and how findings can become an improvement plan.",
      "\u0627\u0641\u0647\u0645\u0648\u0627 \u0646\u0637\u0627\u0642 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0648\u0643\u064A\u0641 \u062A\u062A\u062D\u0648\u0644 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0625\u0644\u0649 \u062E\u0637\u0629 \u062A\u062D\u0633\u064A\u0646."
    ),
    action: w2(
      "Pr\xE9parer mon \xE9valuation",
      "Prepare my evaluation",
      "\u0625\u0639\u062F\u0627\u062F \u0637\u0644\u0628 \u0627\u0644\u062A\u0642\u064A\u064A\u0645"
    ),
    photo: "school",
    request: "establishments/quality-check-360",
    audience: "school",
    vertical: "establishment",
    priorities: [
      w2(
        "Pratiques & organisation",
        "Practice & organisation",
        "\u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0648\u0627\u0644\u062A\u0646\u0638\u064A\u0645"
      ),
      w2("\xC9quipe & comp\xE9tences", "Team & competencies", "\u0627\u0644\u0641\u0631\u064A\u0642 \u0648\u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A"),
      w2("Cadre & exp\xE9rience", "Environment & experience", "\u0627\u0644\u0625\u0637\u0627\u0631 \u0648\u0627\u0644\u062A\u062C\u0631\u0628\u0629"),
      w2("Actions & suivi", "Actions & follow-up", "\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629")
    ],
    dossiers: [
      {
        title: w2("D\xE9finir le p\xE9rim\xE8tre", "Define the scope", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0646\u0637\u0627\u0642"),
        body: w2(
          "Identifier les objectifs, les lieux concern\xE9s et les dimensions \xE0 examiner.",
          "Identify objectives, relevant locations and dimensions to examine.",
          "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0645\u0639\u0646\u064A\u0629 \u0648\u0623\u0628\u0639\u0627\u062F \u0627\u0644\u0641\u062D\u0635."
        ),
        detail: w2(
          "Le p\xE9rim\xE8tre et la m\xE9thode applicables sont convenus avant l\u2019intervention.",
          "Applicable scope and method are agreed before the intervention.",
          "\u064A\u064F\u062A\u0641\u0642 \u0639\u0644\u0649 \u0627\u0644\u0646\u0637\u0627\u0642 \u0648\u0627\u0644\u0645\u0646\u0647\u062C \u0642\u0628\u0644 \u0627\u0644\u062A\u062F\u062E\u0644."
        ),
        photo: "school"
      },
      {
        title: w2(
          "Rassembler les \xE9l\xE9ments",
          "Gather the evidence",
          "\u062C\u0645\u0639 \u0627\u0644\u0639\u0646\u0627\u0635\u0631"
        ),
        body: w2(
          "Pr\xE9parer les documents et les observations adapt\xE9s \xE0 l\u2019\xE9valuation convenue.",
          "Prepare documents and observations suited to the agreed evaluation.",
          "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647."
        ),
        detail: w2(
          "Les \xE9l\xE9ments attendus sont d\xE9finis selon le contexte et le service retenu.",
          "Expected evidence is defined by context and the selected service.",
          "\u062A\u064F\u062D\u062F\u062F \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u062D\u0633\u0628 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629."
        ),
        photo: "desk"
      },
      {
        title: w2(
          "Organiser la progression",
          "Organise improvement",
          "\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u062A\u062D\u0633\u064A\u0646"
        ),
        body: w2(
          "Relier les constats, les priorit\xE9s et les actions au suivi convenu.",
          "Connect findings, priorities and actions to agreed follow-up.",
          "\u0631\u0628\u0637 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0628\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647\u0627."
        ),
        detail: w2(
          "Les livrables et modalit\xE9s du suivi sont pr\xE9cis\xE9s pendant la qualification.",
          "Deliverables and follow-up terms are specified during qualification.",
          "\u062A\u064F\u0648\u0636\u062D \u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A \u0648\u0635\u064A\u063A \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0623\u0647\u064A\u0644."
        ),
        photo: "professional"
      }
    ]
  }
};
var B2 = {
  discover: w2("Explorer", "Explore", "\u0627\u0633\u062A\u0643\u0634\u0627\u0641"),
  prepare: w2("Pr\xE9parer mon projet", "Prepare my project", "\u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0634\u0631\u0648\u0639"),
  offers: w2(
    "Les offres de cet univers",
    "Offers in this world",
    "\u0639\u0631\u0648\u0636 \u0647\u0630\u0627 \u0627\u0644\u0639\u0627\u0644\u0645"
  ),
  offersLead: w2(
    "D\xE9couvrez les offres publi\xE9es, leur p\xE9rim\xE8tre et leur parcours.",
    "Explore published offers, their scope and journey.",
    "\u0627\u0633\u062A\u0643\u0634\u0641\u0648\u0627 \u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0648\u0646\u0637\u0627\u0642\u0647\u0627 \u0648\u0645\u0633\u0627\u0631\u0647\u0627."
  ),
  emptyOffers: w2(
    "Votre projet peut commencer ici. Pr\xE9parez votre demande pour pr\xE9ciser le p\xE9rim\xE8tre adapt\xE9 \xE0 votre contexte.",
    "Your project can start here. Prepare your enquiry to define a scope suited to your context.",
    "\u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0645\u0634\u0631\u0648\u0639\u0643\u0645 \u0647\u0646\u0627. \u0623\u0639\u062F\u0648\u0627 \u0627\u0644\u0637\u0644\u0628 \u0644\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0633\u064A\u0627\u0642\u0643\u0645."
  ),
  published: w2("Offres publi\xE9es", "Published offers", "\u0639\u0631\u0648\u0636 \u0645\u0646\u0634\u0648\u0631\u0629"),
  all: w2("Tout", "All", "\u0627\u0644\u0643\u0644"),
  search: w2("Chercher dans les offres", "Search offers", "\u0627\u0644\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0639\u0631\u0648\u0636"),
  more: w2("Afficher plus d\u2019offres", "Show more offers", "\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064A\u062F"),
  reset: w2("R\xE9initialiser", "Reset", "\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637"),
  sort: w2("Trier", "Sort", "\u062A\u0631\u062A\u064A\u0628"),
  kind: w2("Type d\u2019offre", "Offer type", "\u0646\u0648\u0639 \u0627\u0644\u0639\u0631\u0636"),
  name: w2("Nom", "Name", "\u0627\u0644\u0627\u0633\u0645"),
  price: w2("Prix croissant", "Price low to high", "\u0627\u0644\u0633\u0639\u0631 \u062A\u0635\u0627\u0639\u062F\u064A\u0627\u064B"),
  noMatch: w2(
    "Aucune offre ne correspond \xE0 ces filtres.",
    "No offers match these filters.",
    "\u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0631\u0648\u0636 \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u0645\u0631\u0634\u062D\u0627\u062A."
  ),
  summary: w2("Votre pr\xE9paration", "Your preparation", "\u062A\u062D\u0636\u064A\u0631\u0643\u0645"),
  selected: w2("Vos priorit\xE9s", "Your priorities", "\u0623\u0648\u0644\u0648\u064A\u0627\u062A\u0643\u0645"),
  explain: w2(
    "Comprendre le fonctionnement",
    "Understand how it works",
    "\u0641\u0647\u0645 \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0639\u0645\u0644"
  ),
  journey: w2("Les prochaines \xE9tapes", "Next steps", "\u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0627\u0644\u062A\u0627\u0644\u064A\u0629"),
  question: w2(
    "Vos questions, avant de vous lancer",
    "Your questions before getting started",
    "\u0623\u0633\u0626\u0644\u062A\u0643\u0645 \u0642\u0628\u0644 \u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642"
  ),
  resources: w2(
    "Ressources & programmes publi\xE9s",
    "Published resources & programmes",
    "\u0645\u0648\u0627\u0631\u062F \u0648\u0628\u0631\u0627\u0645\u062C \u0645\u0646\u0634\u0648\u0631\u0629"
  ),
  details: w2("Approfondir", "Explore further", "\u0627\u0644\u062A\u0639\u0645\u0642"),
  contact: w2(
    "Parlons de votre projet",
    "Let\u2019s discuss your project",
    "\u0644\u0646\u062A\u062D\u062F\u062B \u0639\u0646 \u0645\u0634\u0631\u0648\u0639\u0643\u0645"
  ),
  contactLead: w2(
    "Partagez votre contexte et vos priorit\xE9s. Votre demande sera enregistr\xE9e pour son traitement.",
    "Share your context and priorities. Your enquiry will be recorded for processing.",
    "\u0634\u0627\u0631\u0643\u0648\u0627 \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0644\u064A\u064F\u0633\u062C\u0644 \u0637\u0644\u0628\u0643\u0645 \u0645\u0646 \u0623\u062C\u0644 \u0645\u0639\u0627\u0644\u062C\u062A\u0647."
  ),
  fullName: w2("Nom complet", "Full name", "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644"),
  organization: w2("Organisation", "Organisation", "\u0627\u0644\u0645\u0624\u0633\u0633\u0629"),
  city: w2("Ville", "City", "\u0627\u0644\u0645\u062F\u064A\u0646\u0629"),
  email: w2("Email", "Email", "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A"),
  phone: w2("T\xE9l\xE9phone", "Phone", "\u0627\u0644\u0647\u0627\u062A\u0641"),
  message: w2(
    "Votre contexte et vos besoins",
    "Your context and needs",
    "\u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A"
  ),
  capacity: w2(
    "Taille / capacit\xE9 concern\xE9e",
    "Relevant size / capacity",
    "\u0627\u0644\u062D\u062C\u0645 \u0623\u0648 \u0627\u0644\u0633\u0639\u0629 \u0627\u0644\u0645\u0639\u0646\u064A\u0629"
  ),
  urgency: w2("Votre horizon", "Your timeframe", "\u0627\u0644\u0623\u0641\u0642 \u0627\u0644\u0632\u0645\u0646\u064A"),
  exploration: w2("Je me renseigne", "I\u2019m exploring", "\u0623\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A"),
  quarter: w2(
    "Projet envisag\xE9 sous trois mois",
    "Considering a project within three months",
    "\u0645\u0634\u0631\u0648\u0639 \u062E\u0644\u0627\u0644 \u062B\u0644\u0627\u062B\u0629 \u0623\u0634\u0647\u0631"
  ),
  urgent: w2(
    "Besoin \xE0 \xE9tudier rapidement",
    "Need to discuss promptly",
    "\u062D\u0627\u062C\u0629 \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629 \u0642\u0631\u064A\u0628\u0627\u064B"
  ),
  consent: w2(
    "J\u2019accepte d\u2019\xEAtre contact\xE9 au sujet de cette demande et le traitement de mes informations pour y r\xE9pondre.",
    "I agree to be contacted about this enquiry and to my information being processed to respond.",
    "\u0623\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0628\u0634\u0623\u0646 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628 \u0648\u0645\u0639\u0627\u0644\u062C\u0629 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u064A \u0644\u0644\u0631\u062F \u0639\u0644\u064A\u0647."
  ),
  submit: w2("Transmettre ma demande", "Send my enquiry", "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628"),
  sending: w2("Enregistrement\u2026", "Recording\u2026", "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u0633\u062C\u064A\u0644\u2026"),
  success: w2(
    "Votre demande est enregistr\xE9e.",
    "Your enquiry has been recorded.",
    "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0637\u0644\u0628\u0643\u0645."
  ),
  reference: w2("R\xE9f\xE9rence", "Reference", "\u0627\u0644\u0645\u0631\u062C\u0639"),
  failure: w2(
    "La demande n\u2019a pas pu \xEAtre confirm\xE9e. Vos informations restent ici : v\xE9rifiez et r\xE9essayez.",
    "Your enquiry could not be confirmed. Your information remains here: check and retry.",
    "\u062A\u0639\u0630\u0631 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0637\u0644\u0628. \u062A\u0628\u0642\u0649 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u0643\u0645 \u0647\u0646\u0627 \u0644\u0644\u062A\u062D\u0642\u0642 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629."
  ),
  invalid: w2(
    "Renseignez les champs requis, un moyen de contact et votre accord.",
    "Complete required fields, a contact method and your consent.",
    "\u0623\u0643\u0645\u0644\u0648\u0627 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0648\u0648\u0633\u064A\u0644\u0629 \u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629."
  ),
  useBrief: w2(
    "Ajouter ma pr\xE9paration au message",
    "Add my preparation to the message",
    "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062A\u062D\u0636\u064A\u0631 \u0625\u0644\u0649 \u0627\u0644\u0631\u0633\u0627\u0644\u0629"
  ),
  next: w2("Continuer", "Continue", "\u0645\u062A\u0627\u0628\u0639\u0629"),
  back: w2("Retour \xE0 l\u2019univers", "Back to this world", "\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0639\u0627\u0644\u0645"),
  proof: w2(
    "Un p\xE9rim\xE8tre clair avant l\u2019engagement",
    "A clear scope before commitment",
    "\u0646\u0637\u0627\u0642 \u0648\u0627\u0636\u062D \u0642\u0628\u0644 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645"
  ),
  faqScope: w2(
    "Comment le p\xE9rim\xE8tre est-il d\xE9fini ?",
    "How is the scope defined?",
    "\u0643\u064A\u0641 \u064A\u064F\u062D\u062F\u062F \u0627\u0644\u0646\u0637\u0627\u0642\u061F"
  ),
  faqScopeBody: w2(
    "Votre contexte, les objectifs et les conditions du programme ou de l\u2019offre pr\xE9cisent le p\xE9rim\xE8tre applicable.",
    "Your context, objectives and programme or offer terms define the applicable scope.",
    "\u064A\u062D\u062F\u062F \u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u0648\u0634\u0631\u0648\u0637 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0623\u0648 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0637\u0628\u0642."
  ),
  faqPrice: w2(
    "O\xF9 trouver les tarifs et les modalit\xE9s ?",
    "Where are prices and terms available?",
    "\u0623\u064A\u0646 \u0623\u062C\u062F \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u0634\u0631\u0648\u0637\u061F"
  ),
  faqPriceBody: w2(
    "Les offres et plans publi\xE9s pr\xE9sentent les informations renseign\xE9es. Une demande permet de pr\xE9ciser les projets qui n\xE9cessitent une qualification.",
    "Published offers and plans show their provided information. An enquiry helps clarify projects requiring qualification.",
    "\u062A\u0639\u0631\u0636 \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0627\u0644\u062E\u0637\u0637 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629\u060C \u0648\u064A\u0633\u0627\u0639\u062F \u0627\u0644\u0637\u0644\u0628 \u0641\u064A \u062A\u0648\u0636\u064A\u062D \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639 \u0627\u0644\u062A\u064A \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u062A\u0623\u0647\u064A\u0644."
  ),
  faqStart: w2(
    "Que pr\xE9parer pour le premier \xE9change ?",
    "What should I prepare for the first discussion?",
    "\u0645\u0627\u0630\u0627 \u0623\u0639\u062F \u0644\u0644\u0645\u0646\u0627\u0642\u0634\u0629 \u0627\u0644\u0623\u0648\u0644\u0649\u061F"
  ),
  faqStartBody: w2(
    "Votre contexte, les publics concern\xE9s, vos priorit\xE9s et votre horizon. Les explorateurs de cette page vous aident \xE0 pr\xE9parer ces \xE9l\xE9ments.",
    "Your context, relevant audiences, priorities and timeframe. This page\u2019s explorers help you prepare them.",
    "\u0627\u0644\u0633\u064A\u0627\u0642 \u0648\u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u0639\u0646\u064A\u0629 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u0641\u0642 \u0627\u0644\u0632\u0645\u0646\u064A. \u062A\u0633\u0627\u0639\u062F\u0643\u0645 \u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0635\u0641\u062D\u0629 \u0639\u0644\u0649 \u0625\u0639\u062F\u0627\u062F\u0647\u0627."
  ),
  nonMedical: w2(
    "Accompagnement strictement non m\xE9dical : ANGELCARE ne diagnostique pas, ne prescrit pas et ne remplace pas les professionnels de sant\xE9 autoris\xE9s.",
    "Strictly non-medical support: ANGELCARE does not diagnose, prescribe or replace licensed health professionals.",
    "\u062F\u0639\u0645 \u063A\u064A\u0631 \u0637\u0628\u064A: \u0623\u0646\u062C\u0644 \u0643\u064A\u0631 \u0644\u0627 \u064A\u0634\u062E\u0635 \u0648\u0644\u0627 \u064A\u0635\u0641 \u0639\u0644\u0627\u062C\u0627\u062A \u0648\u0644\u0627 \u064A\u062D\u0644 \u0645\u062D\u0644 \u0627\u0644\u0645\u0647\u0646\u064A\u064A\u0646 \u0627\u0644\u0635\u062D\u064A\u064A\u0646 \u0627\u0644\u0645\u0631\u062E\u0635\u064A\u0646."
  ),
  guide: w2("Guide du fonctionnement", "How it works guide", "\u062F\u0644\u064A\u0644 \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0639\u0645\u0644"),
  labelExample: w2(
    "Structure explicative",
    "Explanatory structure",
    "\u0628\u0646\u064A\u0629 \u062A\u0648\u0636\u064A\u062D\u064A\u0629"
  ),
  member: w2(
    "Acc\xE8s professionnel existant",
    "Existing professional access",
    "\u0648\u0644\u0648\u062C \u0627\u0644\u0645\u0647\u0646\u064A\u064A\u0646 \u0627\u0644\u0645\u0633\u062C\u0644\u064A\u0646"
  ),
  training: w2("D\xE9couvrir Academy", "Explore Academy", "\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629"),
  saved: w2(
    "Retrouver ma s\xE9lection",
    "Return to my selection",
    "\u0627\u0644\u0639\u0648\u062F\u0629 \u0625\u0644\u0649 \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A\u064A"
  ),
  compare: w2("Comparer mes offres", "Compare my offers", "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0639\u0631\u0648\u0636"),
  copied: w2("Pr\xE9paration copi\xE9e", "Preparation copied", "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u062A\u062D\u0636\u064A\u0631"),
  copy: w2("Copier", "Copy", "\u0646\u0633\u062E"),
  copyError: w2(
    "Copie indisponible ; s\xE9lectionnez le texte.",
    "Copy unavailable; select the text.",
    "\u0627\u0644\u0646\u0633\u062E \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u060C \u062D\u062F\u062F\u0648\u0627 \u0627\u0644\u0646\u0635."
  )
};
var EMPTY_ENQUIRY = {
  fullName: "",
  organization: "",
  city: "",
  email: "",
  phone: "",
  message: "",
  capacity: "",
  urgency: "exploration",
  consent: false,
  website: ""
};
var routeFor = (locale, route) => `/angelcare-marketplace/${locale}/${route}`;
function validEnquiry(key, v) {
  const p = WORLDS2[key], email = v.email.trim(), phone = v.phone.trim(), message = v.message.trim();
  if (!v.consent || message.length < 10 || message.length > (p.vertical ? 3e3 : 4e3))
    return false;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  if (!["exploration", "quarter", "urgent"].includes(v.urgency)) return false;
  if (v.capacity && (!/^\d+$/.test(v.capacity) || Number(v.capacity) > 1e6))
    return false;
  if (p.vertical)
    return !!v.organization.trim() && !!v.city.trim() && !!email && !!phone;
  return !!v.fullName.trim() && (!!email || !!phone);
}
function enquiryPayload(key, locale, v, sourceRoute) {
  const p = WORLDS2[key];
  if (p.vertical)
    return {
      vertical: p.vertical,
      organizationName: v.organization.trim(),
      city: v.city.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      needs: `[${key}]
${v.message.trim()}`.slice(0, 3e3),
      consent: v.consent ? "on" : "",
      sourceLocale: locale,
      urgency: v.urgency,
      capacity: v.capacity ? Number(v.capacity) : null
    };
  return {
    audience: p.audience,
    locale,
    sourceRoute,
    fullName: v.fullName.trim(),
    email: v.email.trim() || null,
    phone: v.phone.trim() || null,
    organization: v.organization.trim() || null,
    city: v.city.trim() || null,
    message: v.message.trim(),
    consent: v.consent,
    website: v.website
  };
}
var enquiryEndpoint = (key) => WORLDS2[key].vertical ? "/api/angelcare-marketplace/b2b/public/diagnostics" : "/api/angelcare-marketplace/public/inquiries";
function responseReference(payload) {
  if (!payload || typeof payload !== "object" || !("data" in payload))
    return null;
  const data = payload.data;
  if (!data || typeof data !== "object" || !("publicReference" in data))
    return null;
  const value = data.publicReference;
  return typeof value === "string" && /^[A-Za-z0-9_-]{4,120}$/.test(value) ? value : null;
}
function prioritySummary(key, locale, selected, context = []) {
  const p = WORLDS2[key], labels = [...new Set(selected)].filter((i) => Number.isInteger(i) && i >= 0 && i < p.priorities.length).map((i) => p.priorities[i][locale]);
  return [p.label[locale], ...context.map((v) => v.slice(0, 180)), ...labels].join(" \xB7 ").slice(0, 1e3);
}
function appendBrief(message, brief, max) {
  const clean = brief.trim().slice(0, 1e3);
  if (!clean || message.includes(clean)) return message;
  return (message.trim() ? `${message.trim()}

${clean}` : clean).slice(
    0,
    max
  );
}
function publicEvent(key, locale, name, data = {}) {
  const safe = Object.fromEntries(
    Object.entries(data).filter(
      ([k]) => ["choice", "dimension", "count"].includes(k)
    )
  );
  return fetch("/api/angelcare-marketplace/public/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName: `business_world.${name}`,
      route: routeFor(locale, key),
      locale,
      data: { world: key, ...safe }
    }),
    keepalive: true
  }).catch(() => void 0);
}

// business-worlds-r2/runtime-tests.mjs
var results = [];
function test(name, fn) {
  fn();
  results.push(name);
  console.log("PASS " + name);
}
var values = { ...EMPTY_ENQUIRY, fullName: "Public test", organization: "Example organisation", city: "Rabat", email: "public@example.test", phone: "+212600000000", message: "Please discuss the scope of our project.", capacity: "120", consent: true };
for (const world of BUSINESS_KEYS) {
  test(world.toUpperCase().replaceAll("-", "_") + "_VALID_SUBMISSION_CONTRACT", () => {
    assert.equal(validEnquiry(world, values), true);
    const body = enquiryPayload(world, "ar", values, routeFor("ar", world));
    if (WORLDS[world].vertical) {
      assert.equal(body.vertical, WORLDS[world].vertical);
      assert.equal(body.consent, "on");
      assert.equal(body.sourceLocale, "ar");
      assert.equal(body.capacity, 120);
      assert.equal(body.needs.startsWith("[" + world + "]"), true);
    } else {
      assert.equal(body.audience, WORLDS[world].audience);
      assert.equal(body.consent, true);
      assert.equal(body.locale, "ar");
      assert.equal(body.sourceRoute, routeFor("ar", world));
    }
  });
  test(world.toUpperCase().replaceAll("-", "_") + "_CONSENT_AND_REQUIRED_FIELDS", () => {
    assert.equal(validEnquiry(world, { ...values, consent: false }), false);
    assert.equal(validEnquiry(world, { ...values, message: "short" }), false);
    assert.equal(validEnquiry(world, { ...values, email: "invalid" }), false);
    assert.equal(validEnquiry(world, { ...values, email: "", phone: "" }), false);
    if (WORLDS[world].vertical) assert.equal(validEnquiry(world, { ...values, organization: "" }), false);
    else assert.equal(validEnquiry(world, { ...values, fullName: "" }), false);
  });
  test(world.toUpperCase().replaceAll("-", "_") + "_THREE_LANGUAGES_COMPLETE", () => {
    for (const locale of ["fr", "en", "ar"]) {
      for (const key of ["title", "lead", "action", "label", "eyebrow"]) assert.ok(WORLDS[world][key][locale]);
      for (const d of WORLDS[world].dossiers) for (const key of ["title", "body", "detail"]) assert.ok(d[key][locale]);
      for (const label of WORLDS[world].priorities) assert.ok(label[locale]);
    }
  });
  test(world.toUpperCase().replaceAll("-", "_") + "_BRIEF_ONLY_USES_DECLARED_CHOICES", () => {
    const brief = prioritySummary(world, "en", [0, 0, 999, -1, 0.5], ["Public context"]);
    assert.equal(brief.includes(WORLDS[world].priorities[0].en), true);
    assert.equal(brief.split(WORLDS[world].priorities[0].en).length, 2);
    assert.ok(brief.length <= 1e3);
  });
}
test("ONLY_SEVEN_DEDICATED_BUSINESS_WORLDS", () => assert.equal(BUSINESS_KEYS.length, 7));
test("PARTNER_AND_PROFESSIONAL_USE_EXISTING_PUBLIC_INQUIRY", () => {
  for (const key of ["partner-os", "professionals"]) assert.equal(enquiryEndpoint(key), "/api/angelcare-marketplace/public/inquiries");
});
test("FIVE_INSTITUTIONAL_ENQUIRIES_USE_EXISTING_DIAGNOSTICS", () => {
  for (const key of ["corporates", "establishments", "health-partners", "hospitality", "quality-check"]) assert.equal(enquiryEndpoint(key), "/api/angelcare-marketplace/b2b/public/diagnostics");
});
test("PROFESSIONAL_PHONE_ONLY_IS_VALID", () => assert.equal(validEnquiry("professionals", { ...values, email: "" }), true));
test("PARTNER_EMAIL_ONLY_IS_VALID", () => assert.equal(validEnquiry("partner-os", { ...values, phone: "" }), true));
test("B2B_REQUIRES_BOTH_CONTACT_FIELDS", () => {
  assert.equal(validEnquiry("corporates", { ...values, email: "" }), false);
  assert.equal(validEnquiry("corporates", { ...values, phone: "" }), false);
});
test("INVALID_CAPACITY_OR_TIMEFRAME_REJECTED", () => {
  assert.equal(validEnquiry("corporates", { ...values, capacity: "-1" }), false);
  assert.equal(validEnquiry("corporates", { ...values, capacity: "1000001" }), false);
  assert.equal(validEnquiry("corporates", { ...values, urgency: "invented" }), false);
});
test("EMPTY_CAPACITY_REMAINS_NULL", () => assert.equal(enquiryPayload("corporates", "fr", { ...values, capacity: "" }, "/route").capacity, null));
test("B2B_CONTEXT_IDENTIFIES_QUALITY_REQUEST", () => assert.ok(enquiryPayload("quality-check", "fr", values, "/route").needs.startsWith("[quality-check]")));
test("B2B_MESSAGE_WITH_CONTEXT_RESPECTS_BACKEND_LIMIT", () => assert.ok(enquiryPayload("quality-check", "fr", { ...values, message: "x".repeat(4e3) }, "/route").needs.length <= 3e3));
test("REFERENCE_REQUIRED_FOR_CONFIRMED_SUCCESS", () => {
  for (const bad of [null, {}, [], { data: {} }, { data: { publicReference: "" } }, { data: { publicReference: "<script>" } }, { data: { publicReference: 123 } }]) assert.equal(responseReference(bad), null);
  assert.equal(responseReference({ data: { publicReference: "B2B-TEST-001" } }), "B2B-TEST-001");
});
test("BRIEF_APPEND_PRESERVES_USER_MESSAGE", () => assert.equal(appendBrief("My own message", "Public choices", 4e3), "My own message\n\nPublic choices"));
test("BRIEF_APPEND_IS_IDEMPOTENT_AND_BOUNDED", () => {
  assert.equal(appendBrief("Message with Public choices", "Public choices", 4e3), "Message with Public choices");
  assert.equal(appendBrief("x".repeat(40), "public choices", 45).length, 45);
});
test("FORM_COPY_ALL_LOCALIZED", () => {
  for (const words of Object.values(B)) for (const locale of ["fr", "en", "ar"]) assert.ok(words[locale]);
});
var calls = [];
var priorFetch = globalThis.fetch;
globalThis.fetch = (url, options) => {
  calls.push({ url, options });
  return Promise.resolve(new Response("{}"));
};
await publicEvent("corporates", "en", "enquiry_success", { choice: "programme", email: "do-not-log@example.test", fullName: "private", message: "private" });
globalThis.fetch = priorFetch;
test("ANALYTICS_STRIPS_CONTACT_AND_FREE_TEXT", () => {
  const body = JSON.parse(calls[0].options.body);
  assert.deepEqual(body.data, { world: "corporates", choice: "programme" });
  assert.equal(calls[0].url, "/api/angelcare-marketplace/public/events");
});
if (process.argv[2]) {
  const app = path.resolve(process.argv[2]), route = (r) => path.join(app, "app/angelcare-marketplace/[locale]", r, "page.tsx");
  test("INSTALLED_PUBLIC_REQUEST_AND_PROGRAMME_DESTINATIONS_EXIST", () => {
    for (const key of BUSINESS_KEYS) {
      assert.ok(fs.existsSync(route(WORLDS[key].request)), WORLDS[key].request);
      for (const d of WORLDS[key].dossiers) if (d.href) assert.ok(fs.existsSync(route(d.href)), d.href);
    }
    for (const r of ["establishments/request", "corporates/request", "academy/request"]) assert.ok(fs.existsSync(route(r)), r);
  });
  test("INSTALLED_ATOMIC_AND_ENQUIRY_AUTHORITIES_PRESENT", () => {
    for (const p of ["angelcare-marketplace/catalog-discovery/repository.ts", "angelcare-marketplace/category-native-experience/registry.ts", "angelcare-marketplace/public-experience-authority/storefront-runtime.ts", "angelcare-marketplace/public-universe/repository.ts", "angelcare-marketplace/b2b-verticals/repository.ts"]) assert.ok(fs.existsSync(path.join(app, p)), p);
  });
}
console.log("BUSINESS_WORLDS_RUNTIME=" + results.length + "/" + results.length + " PASS");
export {
  results
};
