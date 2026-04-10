require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/api/generate-itinerary", async (req, res) => {
  const { destination, voyageurs, budget, dateDebut, dateFin, typeVoyage } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Tu es un expert en voyage. Génère un itinéraire détaillé et personnalisé pour :

- Destination : ${destination}
- Voyageurs : ${voyageurs} personne(s)
- Budget total : ${budget}€
- Dates : du ${dateDebut} au ${dateFin}
- Type de voyage : ${typeVoyage}

Structure ta réponse ainsi :
1. 📋 Résumé du voyage
2. 📅 Itinéraire jour par jour (matin / après-midi / soir)
3. 🏨 Hébergements recommandés
4. 🍽️ Restaurants et spécialités locales
5. 💰 Répartition du budget estimée
6. 💡 Conseils pratiques (visa, météo, transport local)`,
        },
      ],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

const PORT = 3001;
app.listen(PORT, () =>
  console.log(`✅ Serveur API démarré sur http://localhost:${PORT}`)
);
