require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── POST /api/generate-quote ──────────────────────────────────────────
// Reçoit les données du formulaire, appelle Claude, retourne un JSON structuré
app.post("/api/generate-quote", async (req, res) => {
  const { destination, voyageurs, budget, dateDebut, dateFin, demandeClient } = req.body || {};

  // Seule la demande client est obligatoire
  if (!demandeClient) {
    return res.status(400).json({ error: "La demande client est obligatoire." });
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      system: `Tu es un expert en devis voyage pour agences indépendantes.
Tu réponds UNIQUEMENT avec du JSON valide, sans balise markdown, sans texte avant ou après.
Le JSON doit respecter EXACTEMENT cette structure :
{
  "titre": "string",
  "resume": "string",
  "itineraire": [
    {
      "jour": 1,
      "date": "YYYY-MM-DD",
      "titre": "string",
      "matin": "string",
      "apresmidi": "string",
      "soir": "string"
    }
  ],
  "couts": {
    "vols":        { "detail": "string", "montant": 0 },
    "hebergement": { "detail": "string", "montant": 0 },
    "excursions":  { "detail": "string", "montant": 0 },
    "transferts":  { "detail": "string", "montant": 0 },
    "divers":      { "detail": "string", "montant": 0 }
  },
  "totalTTC": 0,
  "conseilsPratiques": ["string"]
}`,
      messages: [
        {
          role: "user",
          content: `Génère un devis voyage professionnel à partir de cette demande :

"${demandeClient}"

${destination ? `- Destination confirmée : ${destination}` : ""}
${voyageurs ? `- Voyageurs : ${voyageurs} personne(s)` : ""}
${budget ? `- Budget total : ${budget} €` : ""}
${dateDebut ? `- Départ : ${dateDebut}` : ""}
${dateFin ? `- Retour : ${dateFin}` : ""}

Si certaines informations manquent (destination, dates, budget, nombre de voyageurs), déduis-les de la demande client ou propose des valeurs réalistes.
${budget ? `Le total de tous les postes de coûts doit être inférieur ou égal au budget de ${budget} €.` : ""}
Génère un itinéraire jour par jour pour toute la durée du séjour.`,
        },
      ],
    });

    // Extraire le texte de la réponse
    const rawText = response.content[0]?.text ?? "";

    // Parser le JSON retourné par Claude
    let devis;
    try {
      // Nettoyer au cas où Claude ajouterait des backticks malgré le system prompt
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      devis = JSON.parse(cleaned);
    } catch {
      console.error("Réponse Claude non-JSON :", rawText);
      return res.status(500).json({ error: "La réponse IA n'est pas au bon format. Réessayez." });
    }

    res.json({ devis });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erreur lors de la génération du devis. Réessayez." });
  }
});

const PORT = 3001;
app.listen(PORT, () =>
  console.log(`✅ Serveur Qovee démarré sur http://localhost:${PORT}`)
);

// Maintient le process en vie (Node v24 + Express 5 sur Windows)
setInterval(() => {}, 1 << 30);
