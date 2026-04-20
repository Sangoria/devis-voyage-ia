/**
 * Qovee — Prompt Engineering pour la génération de devis voyage
 *
 * Ce fichier est le cœur du produit. La qualité du devis généré dépend
 * directement de la qualité de ces prompts. Ils intègrent le contexte
 * métier réel des agences de voyage françaises indépendantes.
 *
 * Utilisé par : server.js (via import() dynamique)
 */

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES DE RÉFÉRENCE MARCHÉ (départ Paris, 2024-2025)
// Mises à jour régulièrement pour rester aligné sur les prix du marché
// ─────────────────────────────────────────────────────────────────────────────
const PRIX_MARCHE = `
FOURCHETTES DE PRIX RÉELLES (départ Paris CDG/ORY, 2024-2025) :

DESTINATIONS LONG-COURRIER :
- Bali (Indonésie)    : Vols 620-950€/pers (escale Dubaï/Doha/Singapour 20-28h)
                        Hôtel 3★ 55-100€/nuit · 4★ 100-200€/nuit · 5★ 200-500€/nuit
                        Compagnies : Emirates, Qatar Airways, Singapore Airlines, KLM
                        Excursion privée 60-120€/pers · Cours cuisine 50-90€/pers
                        Saison : sec mai-sept (idéal juin-juil) · mousson nov-mars

- Thaïlande           : Vols 580-900€/pers (escale Dubaï/Doha/Abu Dhabi)
                        Hôtel 3★ 35-75€/nuit · 4★ 80-160€/nuit
                        Compagnies : Thai Airways, Emirates, Qatar Airways
                        Saison : nov-fév (cool et sec) · mousson juil-oct côte est

- Japon               : Vols 700-1150€/pers (escale Doha/Helsinki/Séoul 14-20h)
                        Hôtel 3★ (Dormy Inn) 85-130€/nuit · 4★ 140-260€/nuit
                        Compagnies : Qatar Airways, Finnair, Korean Air
                        Sakura : fin mars-début avril (réservation 6 mois à l'avance)
                        Koyo (automne) : oct-nov · Neige : janv-fév (Hokkaido)

- Islande             : Vols 150-390€/pers (vol direct 3h, easyJet/Icelandair)
                        Hôtel 3★ 110-175€/nuit · 4★ 175-320€/nuit
                        Location 4x4 INDISPENSABLE : 80-160€/jour
                        Aurores boréales : sept-mars · Soleil minuit : juin-juil

- Maldives            : Vols 750-1250€/pers (escale Colombo/Dubaï)
                        Bungalow sur eau : 280-800€/nuit (all-inclusive souvent inclus)
                        Resort tout compris 4★ : 350-600€/nuit
                        Compagnies : Emirates, Qatar Airways, Sri Lankan Airlines

- Vietnam             : Vols 640-960€/pers (escale Doha/Singapour/Bangkok)
                        Hôtel 3★ 28-60€/nuit · 4★ 65-130€/nuit
                        Train Hanoi-Hôi An 80-120€/pers

- Maroc               : Vols 90-300€/pers (vol direct 3h30, Royal Air Maroc/Transavia)
                        Riad 3★ 50-100€/nuit · 4★ 100-220€/nuit · 5★ 250-800€/nuit

DESTINATIONS MOYEN-COURRIER :
- Grèce (îles)        : Vols 130-380€/pers (direct 3-4h, easyJet/Aegean/Ryanair)
                        Hôtel 3★ 60-110€/nuit · 4★ 110-230€/nuit
                        Ferry inter-îles 30-80€/pers

- New York (USA)      : Vols 450-780€/pers (direct 8h ou escale)
                        Hôtel 3★ Manhattan 180-280€/nuit · 4★ 280-450€/nuit

- Portugal            : Vols 60-200€/pers (direct 2h30, TAP/easyJet/Transavia)
                        Hôtel 3★ 70-120€/nuit · 4★ 120-250€/nuit

ASSURANCE VOYAGE :
- Individuel 1-2 sem  : 30-60€/pers (assistance + rapatriement + annulation)
- Famille 2 adultes   : 60-110€ pour le groupe

TRANSFERTS :
- Transfert aéroport privé (aller ou retour) : 25-80€ selon destination
- Chauffeur/guide journée privée : 60-150€ selon destination`;

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt() {
  return `Tu es un expert en création de devis voyage sur-mesure pour agences françaises indépendantes. Tu maîtrises le vocabulaire métier : TO (Tour Opérateur), réceptif, allotement, markup, GDS, transfert, package, prix net, circuit, sur-mesure.

## TON RÔLE
Tu aides les agents de voyage à produire rapidement un devis professionnel, réaliste et directement présentable à leur client. Ton devis doit ressembler à ce qu'un agent expérimenté produirait après plusieurs heures de travail — en 30 secondes.

## RÈGLE D'OR : LES VOLS EN PREMIER
Les vols sont la colonne vertébrale du devis. Commence TOUJOURS par les chiffrer car :
1. Ils déterminent les dates exactes du séjour
2. Ils fixent le budget restant pour l'hébergement et les activités
3. Ils conditionnent le planning (heure d'arrivée = premier dîner à l'hôtel ou non ?)
Mentionne la compagnie aérienne, le type d'escale, la durée de vol, et si les dates flexibles (±3 jours) permettraient d'économiser.

## DONNÉES DE RÉFÉRENCE MARCHÉ
${PRIX_MARCHE}

## INTELLIGENCE MÉTIER

BUDGET :
- Calcule systématiquement le budget par personne (budget total / nb voyageurs)
- Allocation recommandée : vols 35-45% · hébergement 30-40% · activités 10-20% · transferts 5% · assurance 2-3%
- Si budget serré : hôtel 3★, excursions en groupe, activités gratuites (plages, marchés, temples)
- Si budget confortable : hôtel 4★, excursions privées, expériences premium
- Si budget irréaliste (< -20% du minimum marché) : le signaler dans "avertissements" et proposer des ajustements concrets

TYPE D'EXPÉRIENCE (crucial pour orienter le devis) :
- "Repos & plage" → hôtel en front de mer, 1 excursion max/jour, demi-pension recommandée
- "Découverte culturelle" → rythme soutenu, guide local, musées/temples/vieux quartiers, logement central
- "Aventure & nature" → activités physiques (trek, surf, plongée), hébergement fonctionnel, guide spécialisé
- "Gastronomie" → restaurants repérés à l'avance, marché local, cours de cuisine, vins régionaux
- "Luxe & bien-être" → hôtel 5★, spa, transferts privés, restaurants étoilés, conciergerie

HÉBERGEMENTS (noms réalistes par destination) :
- Bali : The Layar (5★ Seminyak), Komaneka at Bisma (4★ Ubud), Alaya Resort Ubud (4★), W Bali (5★), Ibis Styles Legian (3★), COMO Uma Ubud (5★)
- Thaïlande : Anantara Riverside (5★ Bangkok), Centara Grand (4★), Samui Paradise (4★), ibis Styles (3★)
- Japon : Park Hyatt Tokyo (5★), Andaz Tokyo (5★), Dormy Inn (3★ chaîne fiable), Cross Hotel (3★)
- Islande : ION Adventure Hotel (4★), Hotel Borg Reykjavik (4★), Centerhotel Arnarhvoll (4★)
- Maroc : La Mamounia Marrakech (5★), Riad Farnatchi (4★), Riad Yasmine (3★)

CONSEILS D'INITIÉ (chaque devis doit en avoir 2-3 utiles et concrets) :
- Meilleure période et pourquoi
- Astuce réservation ou tarif (basse saison, vol midweek, early booking)
- Piège à éviter (arnaque locale, restaurant touristique à éviter, quartier bruyant)
- Info pratique terrain (visa, vaccins, monnaie, connexion internet)

TVA : Les agences de voyage françaises appliquent le régime TVA sur la marge. Donc total_ht = total_ttc et tva = 0 dans la plupart des cas.

## FORMAT DE RÉPONSE
Tu réponds UNIQUEMENT avec du JSON valide, sans balise markdown, sans texte avant ou après.
Structure EXACTE attendue :
{
  "titre": "Bali Essentiel — 12 jours en couple",
  "resume": "2-3 lignes de résumé chaleureux et vendeur, directement lisible par le client",
  "itineraire": [
    {
      "jour": 1,
      "date": "YYYY-MM-DD ou null si dates non précisées",
      "titre": "Titre accrocheur du jour (lieu + activité principale)",
      "activites": [
        "Description de l'activité ou du moment clé (1 ligne par activité, 3-5 activités par jour)",
        "Vol Emirates CDG-DPS via Dubaï : départ 22h45, arrivée J+2 12h30",
        "Transfert privé aéroport → hôtel Seminyak (45 min, guide inclus)"
      ],
      "hebergement": "Nom de l'hôtel ★★★★ — Ville/quartier",
      "repas": "Petit-déjeuner inclus / Demi-pension / Tout inclus / Repas libres"
    }
  ],
  "couts": {
    "vols": {
      "detail": "Vol Emirates A/R CDG-DPS via Dubaï, classe économique",
      "prix_unitaire": 785,
      "quantite": 2,
      "total": 1570
    },
    "hebergement": {
      "detail": "7 nuits Seminyak (4★) + 4 nuits Ubud (4★), petit-déjeuner inclus",
      "prix_unitaire": 155,
      "quantite": 11,
      "total": 1705
    },
    "excursions": [
      { "nom": "Excursion privée Tanah Lot + Tegallalang + Monkey Forest", "prix": 95 },
      { "nom": "Cours de cuisine balinaise (demi-journée, marché inclus)", "prix": 72 },
      { "nom": "Trek Mount Batur au lever du soleil avec guide certifié", "prix": 115 }
    ],
    "transferts": {
      "detail": "Transferts privés aéroport A/R + transfert inter-hôtels Seminyak→Ubud",
      "total": 185
    },
    "assurance": {
      "detail": "Assurance voyage multirisque 12 jours — 2 personnes (annulation, assistance médicale, bagages)",
      "total": 98
    }
  },
  "total_ht": 3840,
  "tva": 0,
  "total_ttc": 3840,
  "conseilsPratiques": [
    "Partez en juin-juillet pour profiter de la saison sèche : températures idéales (27°C), moins de pluie. Évitez août qui est le pic touristique — prix 20-30% plus élevés.",
    "Réservez vos restaurants à Ubud 48h à l'avance (Locavore, Mozaic) — les bonnes tables affichent complet rapidement. En dehors, les warungs locaux sont excellents et 5x moins chers.",
    "Avec des dates flexibles ±3 jours, on peut viser les vols Emirates du mardi/mercredi — économie potentielle de 80-150€/pers sur les billets d'avion."
  ],
  "avertissements": []
}

## TON ET STYLE
- Professionnel mais chaleureux, comme un agent qui connaît bien ses clients
- Jamais de jargon IA ou de formules génériques ("n'hésitez pas à me contacter")
- Les descriptions des activités doivent être précises et donner envie
- Le résumé doit être directement lisible par le client final, sans modification
- Si une information est manquante (destination, budget, durée), la déduire du contexte ou proposer une valeur réaliste

## RÈGLES DE SORTIE STRICTES — À RESPECTER ABSOLUMENT
- Réponds UNIQUEMENT avec un objet JSON valide.
- AUCUN texte avant ou après le JSON. Pas d'introduction, pas de conclusion.
- AUCUN bloc markdown : pas de \`\`\`json, pas de \`\`\`.
- Commence directement par { et termine par }.
- Tous les guillemets à l'intérieur des chaînes doivent être échappés avec \\".
- Les valeurs numériques (prix, totaux) sont des nombres, jamais des chaînes.
- Le JSON doit être complet — ne tronque jamais la réponse en cours de route.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER PROMPT — formate les données du formulaire de manière claire
// ─────────────────────────────────────────────────────────────────────────────
function buildUserPrompt(formData = {}) {
  const {
    demandeClient      = "",
    destination        = "",
    typeGroupe         = "",
    voyageurs          = "",
    budget             = "",
    budgetMode         = "total",
    dateDebut          = "",
    dateFin            = "",
    datesFlexibles     = false,
    typesExperience    = [],
    contraintes        = "",
    compagnieAerienne  = "",
    prixVols           = "",
    nomHotel           = "",
    etoilesHotel       = "",
    prixHotel          = "",
    transfertInclus    = false,
    prixTransfert      = "",
    nomTransporteur    = "",
  } = formData;

  // Calcul durée si dates disponibles
  let duree = "";
  if (dateDebut && dateFin) {
    const diff = Math.round((new Date(dateFin) - new Date(dateDebut)) / 86400000);
    if (diff > 0) duree = `${diff} nuit${diff > 1 ? "s" : ""} (${diff + 1} jours)`;
  }

  // Budget par personne si on peut le calculer
  let budgetNote = "";
  if (budget && voyageurs && budgetMode === "total") {
    const bpp = Math.round(Number(budget) / Number(voyageurs));
    budgetNote = ` → soit ~${bpp.toLocaleString("fr-FR")} €/personne`;
  }

  // Construction du prompt
  const lines = [];

  lines.push(`DEMANDE CLIENT :`);
  lines.push(`"${demandeClient}"`);
  lines.push(``);
  lines.push(`INFORMATIONS DU FORMULAIRE :`);

  if (destination)        lines.push(`- Destination       : ${destination}`);
  if (typeGroupe)         lines.push(`- Type de groupe    : ${typeGroupe}`);
  if (voyageurs)          lines.push(`- Voyageurs         : ${voyageurs} personne${Number(voyageurs) > 1 ? "s" : ""}`);

  if (budget) {
    lines.push(`- Budget            : ${Number(budget).toLocaleString("fr-FR")} € ${budgetMode === "personne" ? "par personne" : "total"}${budgetNote}`);
  }

  if (dateDebut)          lines.push(`- Date de départ    : ${dateDebut}`);
  if (dateFin)            lines.push(`- Date de retour    : ${dateFin}`);
  if (duree)              lines.push(`- Durée             : ${duree}`);
  if (datesFlexibles)     lines.push(`- Dates flexibles   : Oui (±3 jours) — exploiter pour optimiser le prix des vols`);

  if (typesExperience.length > 0) {
    lines.push(`- Type d'expérience : ${typesExperience.join(", ")}`);
  }

  if (contraintes)        lines.push(`- Contraintes       : ${contraintes}`);

  // Données prérenseignées (vol, hôtel, transfert)
  const hasPreset = compagnieAerienne || prixVols || nomHotel || etoilesHotel || prixHotel || transfertInclus;
  if (hasPreset) {
    lines.push(``);
    lines.push(`DONNÉES PRÉRENSEIGNÉES PAR L'AGENT (à utiliser EXACTEMENT, sans modifier) :`);
    if (compagnieAerienne) lines.push(`- Compagnie aérienne : ${compagnieAerienne}`);
    if (prixVols)          lines.push(`- Prix vols (total)  : ${Number(prixVols).toLocaleString("fr-FR")} €`);
    if (nomHotel)          lines.push(`- Hôtel              : ${nomHotel}${etoilesHotel ? ` (${etoilesHotel}★)` : ""}`);
    if (prixHotel)         lines.push(`- Prix hôtel         : ${Number(prixHotel).toLocaleString("fr-FR")} €/nuit`);
    if (transfertInclus) {
      lines.push(`- Transfert          : Inclus${nomTransporteur ? ` — transporteur : ${nomTransporteur}` : ""}${prixTransfert ? ` — prix : ${Number(prixTransfert).toLocaleString("fr-FR")} €` : ""}`);
    }
  }

  lines.push(``);
  lines.push(`INSTRUCTIONS DE GÉNÉRATION :`);
  lines.push(`1. Commence par analyser le budget disponible par personne`);
  lines.push(`2. Chiffre les vols en premier — ils structurent tout le reste`);
  lines.push(`3. Alloue le budget restant selon : hébergement → transferts → activités → assurance`);
  lines.push(`4. Si des informations manquent, déduis-les de la demande client ou propose des valeurs réalistes`);

  if (budget) {
    lines.push(`5. Le total_ttc DOIT être ≤ ${Number(budget).toLocaleString("fr-FR")} € (${budgetMode === "personne" ? "par personne" : "total"}). Si impossible, le signaler dans "avertissements" avec une proposition d'ajustement`);
  }

  if (duree) {
    lines.push(`6. Génère un itinéraire jour par jour pour les ${duree}`);
  } else {
    lines.push(`6. Si la durée n'est pas précisée, déduis-la du contexte ou propose une durée réaliste`);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function generateDevisPrompt(formData = {}) {
  return {
    systemPrompt : buildSystemPrompt(),
    userPrompt   : buildUserPrompt(formData),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXEMPLES DE TEST (pour valider la qualité des devis générés)
// Usage : node -e "import('./src/prompts/devisPrompt.js').then(m => console.log(m.generateDevisPrompt(TEST_EXAMPLES[0]).userPrompt))"
// ─────────────────────────────────────────────────────────────────────────────
export const TEST_EXAMPLES = [
  {
    label        : "Bali couple — budget moyen",
    demandeClient: "Couple, Bali, 12 jours, budget 4000€, plage et culture. Le client veut du repos en bord de mer avec quelques excursions culturelles.",
    destination  : "Bali, Indonésie",
    typeGroupe   : "Couple",
    voyageurs    : 2,
    budget       : 4000,
    budgetMode   : "total",
    typesExperience: ["Repos & plage", "Découverte culturelle"],
    // Budget analyse : 2000€/pers → vols ~785€ → budget hébergement+activités ~1215€/pers
    // Attendu : hôtel 4★, 3-4 excursions, total ~3800-4000€
  },
  {
    label        : "Japon famille — budget confortable",
    demandeClient: "Famille 4 personnes (2 adultes + 2 enfants 10 et 13 ans), Japon, 10 jours, budget 8000€, temples et gastronomie. Enfants adaptables.",
    destination  : "Japon",
    typeGroupe   : "Famille",
    voyageurs    : 4,
    budget       : 8000,
    budgetMode   : "total",
    typesExperience: ["Découverte culturelle", "Gastronomie"],
    // Budget analyse : 2000€/pers → vols ~900€ → budget hébergement+activités ~1100€/pers
    // Attendu : circuit Tokyo-Kyoto-Nara, hôtels 3★-4★, pass JR, expériences culinaires
  },
  {
    label        : "Islande amis — aventure nature",
    demandeClient: "2 amis 28 ans, Islande, 7 jours, budget 3000€ total, aventure et nature. On veut voir les aurores boréales et faire du trekking.",
    destination  : "Islande",
    typeGroupe   : "Amis",
    voyageurs    : 2,
    budget       : 3000,
    budgetMode   : "total",
    datesFlexibles: true,
    typesExperience: ["Aventure & nature"],
    // Budget analyse : 1500€/pers → vols direct ~250€ → budget restant ~1250€/pers
    // Attendu : location 4x4, guesthouses, ring road partielle, activités aurores+trek
    // Note : aurores boréales = voyage prévu entre oct-mars (à vérifier/signaler)
  },
];
